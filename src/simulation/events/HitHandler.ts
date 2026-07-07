import type { EventHandler } from '@/simulation/events/EventHandler.ts';
import type { HitEvent, ActionEndEvent } from '@/simulation/events/event.types.ts';
import type { SimulationContext } from '@/simulation/engine/SimulationContext.ts';
import type { TriggerRegistry } from '@/simulation/engine/TriggerRegistry';
import type { OperatorEffectExpireEvent } from '@/simulation/engine/types';
import {
  evaluateEffectCondition,
  applyResolvedScaling,
  dispatchEnemyEffects,
  scheduleConsumption,
  conditionHasConsume,
  dispatchActorEffects,
} from './effectDispatch';
import { computeStats } from '@/data/stats/computeStats';
import { computeEnemyStats } from '@/data/stats/computeEnemyStats';
import {
  computeHitDamageWithBreakdown,
  computeReactionHitDamageWithBreakdown,
  computeExpectedDamageWithBreakdown,
  filterDamageModifiers,
  applyConsumedStatEffects,
  STAGGER_DAMAGE_MULTIPLIER,
} from '@/data/stats/computeDamage';
import type { ResolvedStatModifier } from '@/data/stats/types';
import type { DamageElement } from '@/data/types';
import {
  computeLmdiContributions,
  computeReactionLmdiContributions,
} from '@/data/stats/computeLmdi';
import type { SourceTaggedMod } from '@/data/stats/computeLmdi';
import {
  type ReactionDamageType,
  computeLevelCoefficient,
  computeArtsIntensityDamageMult,
} from '@/data/stats/computeReactionDamage';
import type { Effect, ResolvedEffect } from '@/data/types';

// ─── Handler ─────────────────────────────────────────────────────────────────

function getEnemyResistanceValue(ctx: SimulationContext, element: string | undefined): number {
  if (!element) return 0;
  const value = ctx.enemyResistance?.[element as DamageElement];
  return value != null ? value / 100 : 0;
}

function applyEnemyDamageCapToBreakdown(
  breakdown: any,
  time: number,
  ctx: SimulationContext,
  hit: any,
) {
  const rawDamage = Math.max(0, Math.floor(Number(breakdown?.expectedDamage) || 0));
  const capped = ctx.applyEnemyDamageCap(time, rawDamage);
  if (!capped.capped) return breakdown;

  const finalDamage = Math.max(0, Math.floor(capped.damage));
  const maxForThisHit = Math.max(0, capped.cap - capped.usedBefore);
  breakdown.expectedDamage = finalDamage;
  breakdown.nonCritDamage = Math.min(
    Math.max(0, Math.floor(Number(breakdown.nonCritDamage) || 0)),
    maxForThisHit,
  );
  breakdown.critDamage = Math.min(
    Math.max(0, Math.floor(Number(breakdown.critDamage) || 0)),
    maxForThisHit,
  );
  hit._enemyDamageCap = {
    capped: true,
    cap: capped.cap,
    rawDamage,
    finalDamage,
    usedBefore: capped.usedBefore,
    windowStart: capped.windowStart,
    windowEnd: capped.windowEnd,
  };
  return breakdown;
}

function afterDamageEffects(
  effects: readonly (Effect | ResolvedEffect)[] | undefined,
): readonly (Effect | ResolvedEffect)[] | undefined {
  if (!effects?.length) return effects;
  return effects.filter(effect => effect.applyTiming !== 'beforeDamage');
}

export class HitHandler implements EventHandler<HitEvent> {
  private registry?: TriggerRegistry;
  constructor(registry?: TriggerRegistry) {
    this.registry = registry;
  }

  handle(e: HitEvent, ctx: SimulationContext) {
    const hit = e.payload.hitData;

    // Stamp consumed one-time stat effects from parent action
    const parentAction = ctx.getAction(e.payload.actionId);
    if (parentAction?.consumedStatEffects?.length) {
      hit.consumedStatEffects = parentAction.consumedStatEffects;
    }

    // Resolve multiplierScaling (attribute + stack based) at hit time.
    // Use a local variable — never mutate hit.multiplier, which is shared
    // across simulation runs via the compiled timeline.
    const resolvedMultiplier =
      hit._multiplierScaling && hit.multiplier != null
        ? applyResolvedScaling(
            hit.multiplier,
            hit._multiplierScaling,
            e.payload.sourceId,
            e.time,
            ctx,
            ctx.state.enemy.statusSnapshot(),
          )
        : hit.multiplier;
    // Evaluate condition against live enemy state before firing
    if (hit._condition) {
      const snap = ctx.state.enemy.statusSnapshot();
      if (
        !evaluateEffectCondition(
          hit._condition,
          e.time,
          e.payload.sourceId,
          ctx,
          snap,
          e.payload.actionId,
        )
      ) {
        // Condition not met — shrink action end if this hit had durationExtension
        // (optimistic scheduling pre-added all possible extensions).
        if (hit.durationExtension) {
          this.shrinkActionEnd(e.payload.actionId, hit.durationExtension, ctx);
        }
        return;
      }
    }

    // Compute expected damage using live operator + enemy state at time T
    const staggerMult = ctx.state.enemy.isBroken(e.time) ? STAGGER_DAMAGE_MULTIPLIER : 1;
    hit._staggerMult = staggerMult;
    if (staggerMult > 1) {
      hit._staggerContributions = ctx.state.enemy.getStaggerContributionFractions();
    }

    // Finisher multiplier: applies when a finisher action hits a staggered enemy
    const action = ctx.getAction(e.payload.actionId);
    const finisherMult =
      action?.node.type === 'finisher' && ctx.state.enemy.isBroken(e.time)
        ? (ctx.state.enemy.config.finisherMultiplier ?? 1)
        : 1;
    hit._finisherMult = finisherMult;

    const baseStats = ctx.getBaseStats(e.payload.sourceId);
    const reactionMeta = hit._reactionMeta;

    if (reactionMeta && baseStats && resolvedMultiplier != null) {
      // ── Reaction damage path ──────────────────────────────────────────
      const operatorLevel = baseStats.level;

      // Always compute operator stats live at hit time
      const activeEntries = ctx.getOperatorEffects(e.payload.sourceId).getActiveEntries(e.time);
      const dynamicMods: ResolvedStatModifier[] = [];
      for (const entry of activeEntries) {
        if (!entry.stat) continue;
        dynamicMods.push({
          stat: entry.stat,
          value: entry.value * entry.stacks,
          external: entry.external,
        });
      }
      const operatorStatus = computeStats(baseStats, [], dynamicMods);

      const enemyEntries = [...ctx.state.enemy.enemyStatusEffects.values()].filter(
        entry => e.time < entry.expiresAt,
      );
      const enemyMods: ResolvedStatModifier[] = [];
      for (const entry of enemyEntries) {
        if (!entry.stat) continue;
        enemyMods.push({
          stat: entry.stat,
          value: entry.value * entry.stacks,
          external: entry.external,
        });
      }
      const enemyStatus = computeEnemyStats([], enemyMods);

      const element = reactionMeta.element;
      const enemyResistance = getEnemyResistanceValue(ctx, element);
      const levelCoeff = reactionMeta.synthetic
        ? 1
        : computeLevelCoefficient(operatorLevel, reactionMeta.reactionType as ReactionDamageType);
      const artsIntensityMult = computeArtsIntensityDamageMult(operatorStatus.artsIntensity);
      const effectivenessMult = reactionMeta.effectiveness ?? 1;

      // No skill-type scoping for reaction damage
      const mods = filterDamageModifiers(
        operatorStatus.damageModifiers ?? [],
        element,
        undefined,
        undefined,
      );

      const elementalSusc =
        element && enemyStatus?.elementalSusceptibility?.[element]
          ? enemyStatus.elementalSusceptibility[element]
          : 0;
      const elementalDmgTaken =
        element && enemyStatus?.elementalIncreasedDmgTaken?.[element]
          ? enemyStatus.elementalIncreasedDmgTaken[element]
          : 0;
      const dmgTakenExternalMult =
        (enemyStatus?.increasedDmgTakenExternalMult ?? 1) *
        (element ? (enemyStatus?.elementalIncreasedDmgTakenExternalMult?.[element] ?? 1) : 1);

      const isCombustionDot = reactionMeta.reactionType === 'combustion_dot';
      const noCrit = hit._canCrit === false || isCombustionDot;

      const reactionHitParams = {
        attack: operatorStatus.attack,
        multiplier: resolvedMultiplier,
        critRate: noCrit ? 0 : operatorStatus.critRate,
        critDmg: noCrit ? 0 : operatorStatus.critDmg,
        dmgBonus: mods.dmgBonus,
        dmgBonusExternalMult: mods.dmgBonusExternalMult,
        ampBonus: mods.ampBonus,
        directMultiplier: mods.directMultiplier,
        enemyDef: ctx.enemyDef,
        resistanceIgnore: mods.resistanceIgnore,
        resistanceShred: enemyStatus?.resistanceShred ?? 0,
        enemyResistance,
        susceptibility:
          ((enemyStatus?.susceptibility ?? 0) + elementalSusc) * mods.susceptibilityAmplify,
        increasedDmgTaken: (enemyStatus?.increasedDmgTaken ?? 0) + elementalDmgTaken,
        dmgTakenExternalMult,
        linkStacks: 0,
        staggerMult,
        finisherMult,
        susceptibilityAmplify: mods.susceptibilityAmplify,
      };
      applyConsumedStatEffects(reactionHitParams, hit.consumedStatEffects, operatorStatus);
      const breakdown = computeReactionHitDamageWithBreakdown({
        hitParams: reactionHitParams,
        levelCoefficient: levelCoeff,
        artsIntensityMult,
        effectivenessMult,
        reactionType: reactionMeta.reactionType,
        operatorLevel,
        artsIntensity: operatorStatus.artsIntensity,
        element,
      });
      applyEnemyDamageCapToBreakdown(breakdown, e.time, ctx, hit);
      hit._expectedDamage = breakdown.expectedDamage;
      hit._damageBreakdown = breakdown;

      // ── LMDI contribution decomposition for reaction damage ─────────
      const hittingTrackId = e.payload.sourceId;

      // Always split live entries — no snapshot path remains
      const selfOpMods: ResolvedStatModifier[] = [];
      const extOpMods: SourceTaggedMod[] = [];
      for (const entry of activeEntries) {
        if (!entry.stat) continue;
        const mod: ResolvedStatModifier = {
          stat: entry.stat,
          value: entry.value * entry.stacks,
          external: entry.external,
        };
        if (entry.sourceId === hittingTrackId) selfOpMods.push(mod);
        else extOpMods.push({ sourceId: entry.sourceId, mod });
      }

      // Enemy mods are always live — split with sourceBreakdown support
      const selfEnemyMods: ResolvedStatModifier[] = [];
      const extEnemyMods: SourceTaggedMod[] = [];
      const creditToApplier = ctx.lmdiAttributionMode === 'applier';
      for (const entry of enemyEntries) {
        if (!entry.stat) continue;
        const totalValue = entry.value * entry.stacks;
        if (!creditToApplier && entry.sourceBreakdown) {
          for (const [srcId, fraction] of Object.entries(entry.sourceBreakdown)) {
            const partialMod: ResolvedStatModifier = {
              stat: entry.stat,
              value: totalValue * fraction,
              external: entry.external,
            };
            if (srcId === hittingTrackId) selfEnemyMods.push(partialMod);
            else extEnemyMods.push({ sourceId: srcId, mod: partialMod });
          }
        } else {
          const mod: ResolvedStatModifier = {
            stat: entry.stat,
            value: totalValue,
            external: entry.external,
          };
          if (entry.sourceId === hittingTrackId) selfEnemyMods.push(mod);
          else extEnemyMods.push({ sourceId: entry.sourceId, mod });
        }
      }

      // Build the standard-part breakdown (before reaction multipliers) for LMDI
      const standardPartBreakdown = computeExpectedDamageWithBreakdown(
        {
          attack: operatorStatus.attack,
          multiplier: hit.multiplier!,
          critRate: noCrit ? 0 : operatorStatus.critRate,
          critDmg: noCrit ? 0 : operatorStatus.critDmg,
          dmgBonus: mods.dmgBonus,
          dmgBonusExternalMult: mods.dmgBonusExternalMult,
          ampBonus: mods.ampBonus,
          directMultiplier: mods.directMultiplier,
          enemyDef: ctx.enemyDef,
          resistanceIgnore: mods.resistanceIgnore,
          resistanceShred: enemyStatus?.resistanceShred ?? 0,
          enemyResistance,
          susceptibility:
            ((enemyStatus?.susceptibility ?? 0) + elementalSusc) * mods.susceptibilityAmplify,
          increasedDmgTaken: (enemyStatus?.increasedDmgTaken ?? 0) + elementalDmgTaken,
          dmgTakenExternalMult,
          linkStacks: 0,
          staggerMult,
          finisherMult,
        },
        element,
      );

      const lmdi = computeReactionLmdiContributions({
        baseStats,
        selfOperatorMods: selfOpMods,
        externalOperatorMods: extOpMods,
        selfEnemyMods,
        externalEnemyMods: extEnemyMods,
        hit: { multiplier: hit.multiplier! },
        hittingTrackId,
        element,
        enemyDef: ctx.enemyDef,
        enemyResistance,
        actualStandardBreakdown: standardPartBreakdown,
        actualArtsIntensityMult: artsIntensityMult,
        actualDamage: breakdown.expectedDamage,
        isCombustionDot,
        reactionLevel: reactionMeta.level,
        consumedStackSources: reactionMeta.consumedStackSources,
        staggerMult,
        staggerSources: hit._staggerContributions,
        finisherMult,
        creditToApplier,
      });
      hit._lmdiSelf = lmdi.self;
      hit._lmdiExternal = lmdi.external;
    } else if (baseStats && resolvedMultiplier != null) {
      // ── Standard damage path ──────────────────────────────────────────
      const activeEntries = ctx.getOperatorEffects(e.payload.sourceId).getActiveEntries(e.time);
      const dynamicMods: ResolvedStatModifier[] = [];
      for (const entry of activeEntries) {
        if (!entry.stat) continue;
        dynamicMods.push({
          stat: entry.stat,
          value: entry.value * entry.stacks,
          external: entry.external,
        });
      }
      const operatorStatus = computeStats(baseStats, [], dynamicMods, hit.skillType, hit.skillId);

      const enemyEntries = [...ctx.state.enemy.enemyStatusEffects.values()].filter(
        entry => e.time < entry.expiresAt,
      );
      const enemyMods: ResolvedStatModifier[] = [];
      for (const entry of enemyEntries) {
        if (!entry.stat) continue;
        enemyMods.push({
          stat: entry.stat,
          value: entry.value * entry.stacks,
          external: entry.external,
        });
      }
      const enemyStatus = computeEnemyStats([], enemyMods);

      const action = ctx.getAction(e.payload.actionId);
      const element = hit.element ?? action?.node.element;
      const enemyResistance = getEnemyResistanceValue(ctx, element);

      // Inherit consumed stacks from the action (link stacks, etc.) if the hit doesn't have its own
      if (!hit.consumedStacks && action?.consumedStacks) {
        hit.consumedStacks = action.consumedStacks;
      }

      const effectiveStatus =
        hit._canCrit === false ? { ...operatorStatus, critRate: 0, critDmg: 0 } : operatorStatus;

      const breakdown = computeHitDamageWithBreakdown(
        { ...hit, multiplier: resolvedMultiplier },
        effectiveStatus,
        ctx.enemyDef,
        enemyStatus,
        element,
        staggerMult,
        finisherMult,
        enemyResistance,
      );
      if (breakdown) {
        applyEnemyDamageCapToBreakdown(breakdown, e.time, ctx, hit);
        hit._expectedDamage = breakdown.expectedDamage;
        hit._damageBreakdown = breakdown;

        // ── LMDI contribution decomposition ───────────────────────────
        const hittingTrackId = action?.trackId;
        if (hittingTrackId) {
          const selfOpMods: ResolvedStatModifier[] = [];
          const extOpMods: SourceTaggedMod[] = [];
          for (const entry of activeEntries) {
            if (!entry.stat) continue;
            const mod: ResolvedStatModifier = {
              stat: entry.stat,
              value: entry.value * entry.stacks,
              external: entry.external,
            };
            if (entry.sourceId === hittingTrackId) selfOpMods.push(mod);
            else extOpMods.push({ sourceId: entry.sourceId, mod });
          }

          const selfEnemyMods: ResolvedStatModifier[] = [];
          const extEnemyMods: SourceTaggedMod[] = [];
          const creditToApplier = ctx.lmdiAttributionMode === 'applier';
          for (const entry of enemyEntries) {
            if (!entry.stat) continue;
            const totalValue = entry.value * entry.stacks;
            if (!creditToApplier && entry.sourceBreakdown) {
              for (const [srcId, fraction] of Object.entries(entry.sourceBreakdown)) {
                const partialMod: ResolvedStatModifier = {
                  stat: entry.stat,
                  value: totalValue * fraction,
                  external: entry.external,
                };
                if (srcId === hittingTrackId) selfEnemyMods.push(partialMod);
                else extEnemyMods.push({ sourceId: srcId, mod: partialMod });
              }
            } else {
              const mod: ResolvedStatModifier = {
                stat: entry.stat,
                value: totalValue,
                external: entry.external,
              };
              if (entry.sourceId === hittingTrackId) selfEnemyMods.push(mod);
              else extEnemyMods.push({ sourceId: entry.sourceId, mod });
            }
          }

          const lmdi = computeLmdiContributions({
            baseStats,
            selfOperatorMods: selfOpMods,
            externalOperatorMods: extOpMods,
            selfEnemyMods,
            externalEnemyMods: extEnemyMods,
            hit: {
              multiplier: hit.multiplier!,
              skillType: hit.skillType,
              skillId: hit.skillId,
              consumedStacks: hit.consumedStacks,
              consumedStatEffects: hit.consumedStatEffects,
            },
            linkStacks: hit.consumedStacks?.link ?? 0,
            linkSources: action?.consumedLinkSources,
            hittingTrackId,
            element,
            enemyDef: ctx.enemyDef,
            enemyResistance,
            actualBreakdown: breakdown,
            staggerMult,
            staggerSources: hit._staggerContributions,
            finisherMult,
          });
          hit._lmdiSelf = lmdi.self;
          hit._lmdiExternal = lmdi.external;
        }
      }
    }

    ctx.simLog({
      type: 'DAMAGE_HIT',
      time: e.time,
      payload: {
        targetId: e.payload.targetId,
        sourceId: e.payload.sourceId,
        stagger: hit.stagger,
        hitData: hit,
        actionId: e.payload.actionId,
      },
    });

    if (hit.stagger > 0) {
      ctx.queue.enqueue({
        type: 'STAGGER_CHANGE',
        time: ctx.state.getCurrentTime(),
        payload: {
          stagger: hit.stagger,
          actorId: e.payload.sourceId,
          actionId: e.payload.actionId,
          targetId: e.payload.targetId,
          skillType: hit.skillType,
          skillId: hit.skillId,
          reactionStaggerMult: hit._reactionStaggerMult,
        },
      });
    }

    if (hit.spRecovery > 0) {
      ctx.queue.enqueue({
        type: 'SP_CHANGE',
        time: ctx.state.getCurrentTime(),
        payload: {
          actorId: e.payload.sourceId,
          spChange: hit.spRecovery,
          reason: 'damage',
          sourceId: e.payload.actionId,
          parent: e,
          spType: 'recovery',
          skillType: hit.skillType,
          skillId: hit.skillId,
        },
      });
    }

    if (hit.spReturn > 0) {
      ctx.queue.enqueue({
        type: 'SP_CHANGE',
        time: ctx.state.getCurrentTime(),
        payload: {
          actorId: e.payload.sourceId,
          spChange: hit.spReturn,
          reason: 'damage',
          sourceId: e.payload.actionId,
          parent: e,
          spType: 'return',
          skillType: hit.skillType,
          skillId: hit.skillId,
        },
      });
    }

    // durationExtension: no-op here — optimistic scheduling already includes it.
    // Shrinking happens in the condition-not-met branch above.

    const sourceId = e.payload.sourceId ?? e.payload.actionId;
    const enemySnap = ctx.state.enemy.statusSnapshot();

    // Schedule consumption at priority 3 (after all other checks at the same time)
    if (hit._condition && conditionHasConsume(hit._condition)) {
      scheduleConsumption(hit._condition, e.time, sourceId, ctx, hit.skillType, hit.skillId);
    }

    // Dispatch enemy-targeting effects from this hit
    const postDamageEffects = afterDamageEffects(hit.effects);

    dispatchEnemyEffects(
      postDamageEffects,
      e.time,
      sourceId,
      ctx,
      hit.skillType,
      e.payload.actionId,
      undefined,
      enemySnap,
      hit.skillId,
    );
    // Dispatch self/team-targeting effects from this hit
    dispatchActorEffects(postDamageEffects, {
      time: e.time,
      sourceTrackId: sourceId,
      ctx,
      enemySnap,
      skillType: hit.skillType,
      skillId: hit.skillId,
      actionId: e.payload.actionId,
      statusActionId: e.payload.actionId,
      spReason: 'hit',
      applyCooldownReduction: this.registry
        ? (eff, t, tid, c) => this.registry!.applyCooldownReduction(eff, t, tid, c)
        : undefined,
      onInstantHeal: this.registry
        ? (id, stat, src, t, st) =>
            this.registry!.onStatusApplied(id, stat, 'self', src, t, ctx, st, hit.skillId)
        : undefined,
    });
    // Fire onHit triggers from TriggerRegistry (skip no-damage hits)
    if (hit.multiplier) this.registry?.onHit(e, ctx);
    this.registry?.onFinalStrike(e, ctx);
    this.registry?.onDive(e, ctx);
    this.registry?.onFinisher(e, ctx);
  }

  /** Shrink ACTION_END when a conditional hit with durationExtension is skipped. */
  private shrinkActionEnd(actionId: string, extension: number, ctx: SimulationContext) {
    const currentEnd = ctx.actionEndTimes.get(actionId);
    if (currentEnd === undefined) return;
    const newEnd = currentEnd - extension;
    ctx.actionEndTimes.set(actionId, newEnd);

    const actionEndEvents = ctx.queue.collect(
      ev => ev.type === 'ACTION_END' && (ev as ActionEndEvent).payload.actionId === actionId,
    ) as ActionEndEvent[];
    for (const ev of actionEndEvents) {
      ctx.queue.enqueue({ ...ev, time: newEnd });
    }

    const expireEvents = ctx.queue.collect(
      ev =>
        ev.type === 'OPERATOR_EFFECT_EXPIRE' &&
        (ev as OperatorEffectExpireEvent).actionId === actionId,
    ) as OperatorEffectExpireEvent[];
    for (const ev of expireEvents) {
      ctx.queue.enqueue({ ...ev, time: ev.time - extension }, 2);
    }
  }
}
