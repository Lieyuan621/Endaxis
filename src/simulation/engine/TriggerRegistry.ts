import type {
  TriggerEffect,
  TriggerEvent,
  Effect,
  EffectStat,
  StacksConstraint,
  ResolvedDamageHitEffect,
} from '@/data/types';
import type { ResolvedAction } from '@/simulation/compiler/types';
import { isUltimateLikeAction } from '@/simulation/compiler/types';
import { isEnemyEffect } from '@/data/types';
import type { SimulationContext } from './SimulationContext';
import type { SpChangeEvent, HitEvent, ActionStartEvent } from '@/simulation/events/event.types';
import type { EnemyStatusSnapshot } from '@/simulation/engine/types';
import { resolveEffectDefaults } from '@/data/effectPresets';
import {
  evaluateEffectCondition,
  dispatchEnemyEffects,
  dispatchConsumeEffect,
  scheduleConsumption,
  checkStacks,
  dispatchSingleActorEffect,
  conditionHasConsume,
} from '@/simulation/events/effectDispatch';
import { passesSkillFilter } from '@/data/filter';
import { resolveEffectiveActionSkillType } from '@/simulation/events/actionSkillType';
import { statusToKey } from '@/data/team-status';

interface TriggerRegistryEntry {
  triggerEffect: TriggerEffect;
  sourceTrackId: string;
  /** Skill type this trigger originates from (e.g. 'comboSkill'), for damage calculation. */
  sourceSkillType?: string;
  /** Stack threshold for onStatusApplied — internal use only, not part of TriggerEvent schema. */
  stacksConstraint?: StacksConstraint;
}

export class TriggerRegistry {
  private entries: TriggerRegistryEntry[];
  /** Tracks last-fire time per id+sourceTrackId for ICD enforcement. */
  private lastFire = new Map<string, number>();

  constructor(entries: TriggerRegistryEntry[]) {
    this.entries = entries;
  }

  /** Returns true when the entry should fire for the given actor.
   *  Global triggers fire for any actor; self triggers only for the owner. */
  private matchesScope(entry: TriggerRegistryEntry, actorId: string): boolean {
    const trigger = entry.triggerEffect.trigger;
    if ('triggerScope' in trigger && trigger.triggerScope === 'global') return true;
    return entry.sourceTrackId === actorId;
  }

  onSpRecovery(event: SpChangeEvent, ctx: SimulationContext): void {
    if (event.payload.spChange <= 0) return;
    const actorId = event.payload.actorId;
    for (const entry of this.entries) {
      if (entry.sourceTrackId !== actorId) continue;
      const { trigger } = entry.triggerEffect;
      if (trigger.kind !== 'onSpRecovery') continue;
      const t = trigger as Extract<TriggerEvent, { kind: 'onSpRecovery' }>;
      if (t.skillTypes || t.skillId) {
        const action = ctx.getAction(event.payload.sourceId);
        // For triggered hits (synthetic actionId), fall back to the skillType stamped on the event.
        const type = action?.node.type ?? event.payload.skillType;
        const skillId = action?.node.skillId ?? event.payload.skillId;
        if (!type && !skillId) continue;
        // `skillTypes` filter matches the action's type (e.g. 'comboSkill' matches
        // both the canonical combo AND every sub-combo variant).
        if (t.skillTypes && (!type || !passesSkillFilter(t.skillTypes, type))) continue;
        // `skillId` filter matches the specific skillId (distinguishes sub-variants).
        if (t.skillId && (!skillId || !passesSkillFilter(t.skillId, skillId))) continue;
      }
      this.dispatch(
        entry.triggerEffect.effects,
        event.time,
        actorId,
        ctx,
        event.payload.spChange,
        undefined,
        entry.sourceSkillType,
        undefined,
        undefined,
        undefined,
        undefined,
        event.payload.skillId,
      );
    }
  }

  onHit(event: HitEvent, ctx: SimulationContext): void {
    const actorId = event.payload.sourceId;
    // Skip reaction damage — reactions are not direct skill hits
    if ((event.payload.hitData as any)._reactionMeta) return;
    if ((event.payload.hitData as any).triggered) return;
    for (const entry of this.entries) {
      if (!this.matchesScope(entry, actorId)) continue;
      const { trigger } = entry.triggerEffect;
      if (trigger.kind !== 'onHit') continue;
      const t = trigger as Extract<TriggerEvent, { kind: 'onHit' }>;
      if (t.skillTypes || t.skillId) {
        const action = ctx.getAction(event.payload.actionId);
        if (!action) continue;
        // Prefer the hit's stamped skillType — honors `HitGroup.treatAsSkillType`
        // overrides so a damage group authored under one skill can match filters
        // for another (e.g. Hunt hits inside a battleSkill segment match `comboSkill`).
        const hitSkillType = (event.payload.hitData as any).skillType as string | undefined;
        const effectiveType = hitSkillType ?? action.node.type;
        if (t.skillTypes && !passesSkillFilter(t.skillTypes, effectiveType)) continue;
        if (t.skillId) {
          const hitId = event.payload.hitData.id;
          // Match against the hit's id first, then fall back to the action's skillId
          if (
            !passesSkillFilter(t.skillId, hitId ?? '') &&
            !passesSkillFilter(t.skillId, action.node.skillId)
          )
            continue;
        }
      }
      this.dispatch(
        entry.triggerEffect.effects,
        event.time,
        entry.sourceTrackId,
        ctx,
        1,
        undefined,
        entry.sourceSkillType,
        actorId,
        undefined,
        undefined,
        undefined,
        (event.payload.hitData as any)?.skillId,
      );
    }
  }

  onFinalStrike(event: HitEvent, ctx: SimulationContext): void {
    const actorId = event.payload.sourceId;
    const action = ctx.getAction(event.payload.actionId);
    if (!action) return;

    const resolvedHits = action.resolvedHits;
    if (!resolvedHits.length || event.payload.hitData !== resolvedHits[resolvedHits.length - 1])
      return;

    // onFinalStrike is defined as the final hit of a basic attack sequence
    if (action.node.type !== 'basicAttack') return;

    const node = action.node as any;
    const sequenceIndex = Number(node.sequenceIndex ?? node.attackSequenceIndex) || 0;
    const sequenceTotal = Number(node.sequenceTotal ?? node.attackSequenceTotal) || 0;
    if (sequenceTotal > 0 && sequenceIndex !== sequenceTotal) return;

    for (const entry of this.entries) {
      if (!this.matchesScope(entry, actorId)) continue;
      const { trigger } = entry.triggerEffect;
      if (trigger.kind !== 'onFinalStrike') continue;
      this.dispatch(
        entry.triggerEffect.effects,
        event.time,
        entry.sourceTrackId,
        ctx,
        1,
        undefined,
        entry.sourceSkillType,
        actorId,
      );
    }
  }

  onDive(event: HitEvent, ctx: SimulationContext): void {
    const actorId = event.payload.sourceId;
    const action = ctx.getAction(event.payload.actionId);
    if (!action) return;

    const resolvedHits = action.resolvedHits;
    if (!resolvedHits.length || event.payload.hitData !== resolvedHits[resolvedHits.length - 1])
      return;

    // onDive is defined as the final hit of a dive action
    if (action.node.type !== 'dive') return;

    for (const entry of this.entries) {
      if (!this.matchesScope(entry, actorId)) continue;
      const { trigger } = entry.triggerEffect;
      if (trigger.kind !== 'onDive') continue;
      this.dispatch(
        entry.triggerEffect.effects,
        event.time,
        entry.sourceTrackId,
        ctx,
        1,
        undefined,
        entry.sourceSkillType,
        actorId,
      );
    }
  }

  onFinisher(event: HitEvent, ctx: SimulationContext): void {
    const actorId = event.payload.sourceId;
    const action = ctx.getAction(event.payload.actionId);
    if (!action) return;

    const resolvedHits = action.resolvedHits;
    if (!resolvedHits.length || event.payload.hitData !== resolvedHits[resolvedHits.length - 1])
      return;

    if (action.node.type !== 'finisher') return;

    for (const entry of this.entries) {
      if (!this.matchesScope(entry, actorId)) continue;
      const { trigger } = entry.triggerEffect;
      if (trigger.kind !== 'onFinisher') continue;

      this.dispatch(
          entry.triggerEffect.effects,
          event.time,
          entry.sourceTrackId,
          ctx,
          1,
          undefined,
          entry.sourceSkillType,
          actorId,
      );
    }
  }

  onActionStart(event: ActionStartEvent, ctx: SimulationContext): void {
    const actorId = event.payload.actorId;
    const action = ctx.getAction(event.payload.actionId);
    for (const entry of this.entries) {
      if (!this.matchesScope(entry, actorId)) continue;
      const { trigger } = entry.triggerEffect;
      if (trigger.kind !== 'onActionStart') continue;
      const t = trigger as Extract<TriggerEvent, { kind: 'onActionStart' }>;
      if (action) {
        const effectiveType = resolveEffectiveActionSkillType(action, event.time, actorId, ctx);
        if (t.skillTypes && !passesSkillFilter(t.skillTypes, effectiveType)) continue;
        if (t.skillId && !passesSkillFilter(t.skillId, action.node.skillId)) continue;
        if (t.element) {
          const allowed = Array.isArray(t.element) ? t.element : [t.element];
          if (!allowed.includes(action.node.element as (typeof allowed)[number])) continue;
        }
      } else if (t.element) {
        continue; // element-filtered trigger needs an action to match against
      }
      this.dispatch(
        entry.triggerEffect.effects,
        event.time,
        actorId,
        ctx,
        1,
        undefined,
        entry.sourceSkillType,
      );
    }
  }

  onDuringAction(event: ActionStartEvent, ctx: SimulationContext): void {
    const actorId = event.payload.actorId;
    const action = ctx.getAction(event.payload.actionId);
    if (!action) return;
    for (const entry of this.entries) {
      if (entry.sourceTrackId !== actorId) continue;
      const { trigger } = entry.triggerEffect;
      if (trigger.kind !== 'duringAction') continue;
      const t = trigger as Extract<TriggerEvent, { kind: 'duringAction' }>;
      const effectiveType = resolveEffectiveActionSkillType(action, event.time, actorId, ctx);
      if (t.skillTypes && !passesSkillFilter(t.skillTypes, effectiveType)) continue;
      if (t.skillId && !passesSkillFilter(t.skillId, action.node.skillId)) continue;
      const freezeDuration = action.freezeDuration ?? 0;
      this.dispatch(
        entry.triggerEffect.effects,
        event.time,
        actorId,
        ctx,
        1,
        action.duration - freezeDuration,
        entry.sourceSkillType,
        undefined,
        action.id,
      );
    }
  }

  /**
   * Fires when any status is applied to an operator (scope='self') or the enemy (scope='enemy').
   * id = effect's unique identifier; stat = EffectStat descriptor for type-based matching.
   * Trigger.status string matches by id; trigger.status object matches by stat.
   */
  onStatusApplied(
    id: string,
    stat: EffectStat | undefined,
    scope: 'enemy' | 'self',
    actorId: string,
    time: number,
    ctx: SimulationContext,
    skillType?: string,
    skillId?: string,
    cumulativeStacks?: number,
  ): void {
    for (const entry of this.entries) {
      if (!this.matchesScope(entry, actorId)) continue;
      const { trigger } = entry.triggerEffect;
      if (trigger.kind !== 'onStatusApplied') continue;
      const t = trigger as Extract<TriggerEvent, { kind: 'onStatusApplied' }>;
      if (t.target && t.target !== scope) continue;
      if (t.status !== undefined && !matchesStatus(id, stat, t.status)) continue;
      if (t.skillTypes !== undefined && !passesSkillFilter(t.skillTypes, skillType ?? '')) continue;
      if (t.skillId !== undefined && !passesSkillFilter(t.skillId, skillId ?? skillType ?? ''))
        continue;
      if (
        entry.stacksConstraint !== undefined &&
        !checkStacks(cumulativeStacks ?? 0, entry.stacksConstraint)
      )
        continue;
      this.dispatch(
        entry.triggerEffect.effects,
        time,
        entry.sourceTrackId,
        ctx,
        1,
        undefined,
        entry.sourceSkillType,
        actorId,
        undefined,
        undefined,
        undefined,
        skillId,
      );
    }
  }

  /**
   * Fires when any status is force-consumed (priority-3 expiry) on an operator (scope='self') or the enemy (scope='enemy').
   * id = effect's unique identifier; stat = EffectStat descriptor for type-based matching.
   */
  onStatusConsumed(
    id: string,
    stat: EffectStat | undefined,
    scope: 'enemy' | 'self',
    actorId: string,
    time: number,
    ctx: SimulationContext,
    consumedStacks = 1,
    skillType?: string,
    skillId?: string,
    preComputedEnemySnap?: EnemyStatusSnapshot,
    preConsumeOpStacks?: Map<string, number>,
  ): void {
    for (const entry of this.entries) {
      if (!this.matchesScope(entry, actorId)) continue;
      const { trigger } = entry.triggerEffect;
      if (trigger.kind !== 'onStatusConsumed') continue;
      const t = trigger as Extract<TriggerEvent, { kind: 'onStatusConsumed' }>;
      if (t.target && t.target !== scope) continue;
      if (t.status !== undefined && !matchesStatus(id, stat, t.status)) continue;
      if (t.skillTypes !== undefined && !passesSkillFilter(t.skillTypes, skillType ?? '')) continue;
      if (t.skillId !== undefined && !passesSkillFilter(t.skillId, skillId ?? skillType ?? ''))
        continue;
      this.dispatch(
        entry.triggerEffect.effects,
        time,
        entry.sourceTrackId,
        ctx,
        consumedStacks,
        undefined,
        entry.sourceSkillType,
        actorId,
        undefined,
        preComputedEnemySnap,
        preConsumeOpStacks,
        skillId,
      );
    }
  }

  /**
   * Fires when any status expires naturally (duration runs out, not force-consumed) on an operator (scope='self') or the enemy (scope='enemy').
   * id = effect's unique identifier; stat = EffectStat descriptor for type-based matching.
   */
  onStatusExpire(
    id: string,
    stat: EffectStat | undefined,
    scope: 'enemy' | 'self',
    actorId: string,
    time: number,
    ctx: SimulationContext,
    consumedStacks = 1,
    skillType?: string,
    skillId?: string,
    preComputedEnemySnap?: EnemyStatusSnapshot,
    preConsumeOpStacks?: Map<string, number>,
  ): void {
    for (const entry of this.entries) {
      // Natural expiry has no triggering actor (actorId is ''), so fire for all matching entries.
      // When actorId is present (self-scope operator expiry), restrict to the owning entry.
      if (actorId && !this.matchesScope(entry, actorId)) continue;
      const { trigger } = entry.triggerEffect;
      if (trigger.kind !== 'onStatusExpire') continue;
      const t = trigger as Extract<TriggerEvent, { kind: 'onStatusExpire' }>;
      if (t.target && t.target !== scope) continue;
      if (t.status !== undefined && !matchesStatus(id, stat, t.status)) continue;
      if (t.skillTypes !== undefined && !passesSkillFilter(t.skillTypes, skillType ?? '')) continue;
      if (t.skillId !== undefined && !passesSkillFilter(t.skillId, skillId ?? skillType ?? ''))
        continue;
      this.dispatch(
        entry.triggerEffect.effects,
        time,
        entry.sourceTrackId,
        ctx,
        consumedStacks,
        undefined,
        entry.sourceSkillType,
        actorId || undefined,
        undefined,
        preComputedEnemySnap,
        preConsumeOpStacks,
        skillId,
      );
    }
  }

  private dispatch(
    effects: Effect[],
    time: number,
    sourceTrackId: string,
    ctx: SimulationContext,
    consumedStacks = 1,
    durationOverride?: number,
    sourceSkillType?: string,
    /** For global-scope triggers: the operator who fired the event.
     *  Used for scope:'self' / 'teamExcludeSelf' target resolution and spGain.
     *  Defaults to sourceTrackId when absent (self-scope triggers). */
    triggeringTrackId?: string,
    /** Set only for duringAction triggers; forwarded to effect apply/expire events for runtime extension. */
    actionId?: string,
    /** Pre-mutation enemy snapshot for consume/expire triggers (enemy state already mutated before dispatch).
     *  When absent, a live snapshot is taken. */
    preComputedEnemySnap?: EnemyStatusSnapshot,
    /** Pre-consume operator stacks snapshot (mirrors enemy snap for operator-side stack scaling). */
    preConsumeOpStacks?: Map<string, number>,
    /** Originating event's specific skillId (e.g. 'alesh-enhanced-combo'). Propagated to
     *  downstream OPERATOR_EFFECT_APPLY / ENEMY_EFFECT_APPLY events as `sourceSkillId` so that
     *  onStatusApplied triggers with a `skillId:` filter on the applied status match correctly. */
    sourceSkillId?: string,
  ): void {
    const enemySnap = preComputedEnemySnap ?? ctx.state.enemy.statusSnapshot();
    const selfTrackId = triggeringTrackId ?? sourceTrackId;
    for (const effect of effects) {
      const resolved = resolveEffectDefaults(effect);

      // ICD check (trigger-specific — hit-attached effects don't have ICD)
      if (resolved.icd !== undefined && resolved.icd > 0) {
        const key = resolved.icdGroup ?? `${sourceTrackId}:${resolved.id!}`;
        const last = this.lastFire.get(key) ?? -Infinity;
        if (time - last < resolved.icd) continue;
        this.lastFire.set(key, time);
      }

      // Condition check
      if (!evaluateEffectCondition(resolved.condition, time, sourceTrackId, ctx, enemySnap)) continue;

      // Schedule consumption if the condition (or any element of a compound condition) has consume.
      const cond = resolved.condition;
      if (conditionHasConsume(cond)) {
        scheduleConsumption(cond!, time, sourceTrackId, ctx, sourceSkillType, sourceSkillId);
      }

      if (resolved.kind === 'consume') {
        dispatchConsumeEffect(
          resolved as any,
          time,
          sourceTrackId,
          ctx,
          sourceSkillType,
          sourceSkillId,
        );
        continue;
      }

      if (isEnemyEffect(resolved)) {
        dispatchEnemyEffects(
          [resolved],
          time,
          sourceTrackId,
          ctx,
          sourceSkillType,
          undefined,
          consumedStacks,
          enemySnap,
          sourceSkillId,
        );
        continue;
      }

      // Pre-resolve readConsumedStacks for damageHit (trigger-specific)
      let hitConsumedStacks: Record<string, number> | undefined;
      if (resolved.kind === 'damageHit') {
        const r = resolved as ResolvedDamageHitEffect;
        if (r.readConsumedStacks) {
          const { statusKey, target } = r.readConsumedStacks;
          hitConsumedStacks =
            target === 'enemy'
              ? enemySnap.enemyStatusEffects.get(statusKey)?.consumedStacks
              : ctx.getOperatorEffects(sourceTrackId).getConsumedStacks(statusKey, time);
        }
      }

      // Compute triggeredBy override for trigger path
      const triggeredByOverride = cond && 'status' in cond ? statusToKey(cond.status) : undefined;

      dispatchSingleActorEffect(effect, resolved, {
        time,
        sourceTrackId,
        ctx,
        enemySnap,
        skillType: sourceSkillType,
        skillId: sourceSkillId,
        actionId,
        selfTrackId,
        ownerTrackId: sourceTrackId,
        spReason: 'trigger',
        consumedStacks,
        preConsumeOpStacks,
        durationOverride,
        statusActionId: actionId,
        hitConsumedStacks,
        triggeredByOverride,
        applyCooldownReduction: (eff, t, tid, c) => this.applyCooldownReduction(eff, t, tid, c),
        onInstantHeal: (id, stat, src, t, st) =>
          this.onStatusApplied(id, stat, 'self', src, t, ctx, st, sourceSkillId),
      });
    }
  }

  applyCooldownReduction(
    effect: {
      kind: 'cooldownReductionFlat' | 'cooldownReductionPercent';
      value: number;
      skillTypes?: any;
      skillId?: any;
    },
    time: number,
    targetTrackId: string,
    ctx: SimulationContext,
  ): void {
    const rawValue = typeof effect.value === 'number' ? effect.value : 0;
    if (rawValue <= 0) return;

    // Find all actions on the target track that are currently in cooldown and match filters.
    const matchingActions: ResolvedAction[] = [];
    for (const action of ctx.getAllActions()) {
      if (action.trackId !== targetTrackId) continue;
      const cd = action.node.cooldown ?? 0;
      if (cd <= 0) continue;
      const cdStart =
        action.realStartTime +
        (isUltimateLikeAction(action.node) ? Number(action.node.animationTime) || 0 : 0);
      const cdEnd = cdStart + cd;
      if (time <= cdStart || time >= cdEnd) continue;
      if (effect.skillTypes && !passesSkillFilter(effect.skillTypes, action.node.type)) continue;
      if (effect.skillId && !passesSkillFilter(effect.skillId, action.node.skillId)) continue;
      matchingActions.push(action);
    }

    for (const target of matchingActions) {
      const baseCd = target.node.cooldown ?? 0;
      const cdStart =
        target.realStartTime +
        (isUltimateLikeAction(target.node) ? Number(target.node.animationTime) || 0 : 0);
      const remaining = cdStart + baseCd - time;

      const reduction =
        effect.kind === 'cooldownReductionFlat' ? rawValue : (baseCd * rawValue) / 100;

      const clamped = Math.min(reduction, remaining);
      if (clamped <= 0) continue;

      ctx.state.getActor(targetTrackId).recordCdReduction(target.node.instanceId, clamped);

      ctx.simLog({
        type: 'CD_REDUCTION',
        time,
        payload: {
          actorId: targetTrackId,
          actionId: target.node.instanceId,
          reduction: clamped,
        },
      });
    }
  }
}

/**
 * Checks whether a dispatched (id, stat) pair satisfies a trigger's status filter.
 * - Trigger string → matches against id (exact match)
 * - Trigger object → matches against stat (modifier + field specificity)
 */
function matchesStatus(
  id: string,
  stat: EffectStat | undefined,
  triggerStatus: EffectStat | string | (EffectStat | string)[],
): boolean {
  if (Array.isArray(triggerStatus)) {
    return triggerStatus.some(s => matchesStatus(id, stat, s));
  }

  // String trigger — match by base id (strip @instanceKey suffix added by scheduleDotTicks)
  if (typeof triggerStatus === 'string') {
    return id != null && id.split('@')[0] === triggerStatus;
  }

  // Object trigger — match by stat descriptor; no stat means no match
  if (stat === undefined) return false;

  const trigMod = (triggerStatus as { modifier: string }).modifier;
  const statMod = (stat as { modifier: string }).modifier;
  if (statMod !== trigMod) return false;

  // Specificity check: all fields present on trigger must match stat
  for (const key of Object.keys(triggerStatus) as string[]) {
    if (key === 'modifier') continue;
    const tVal = (triggerStatus as Record<string, unknown>)[key];
    const eVal = (stat as Record<string, unknown>)[key];
    if (tVal === undefined) continue;
    if (eVal === undefined) return false;
    if (JSON.stringify(tVal) !== JSON.stringify(eVal)) return false;
  }

  return true;
}
