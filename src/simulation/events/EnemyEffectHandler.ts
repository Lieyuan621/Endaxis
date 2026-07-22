import type { EventHandler } from './EventHandler';
import type { SimulationContext } from '../engine/SimulationContext';
import type {
  EnemyEffectApplyEvent,
  EnemyEffectExpireEvent,
  ArtsBurstEvent,
} from '../engine/types';
import type { HitEvent, CorrosionTickSimEvent, DotTickSimEvent } from '../events/event.types';
import { getReactionDuration } from '@/data/effectPresets';
import type { EnemyState } from '../state/EnemyState';
import type { TriggerRegistry } from '@/simulation/engine/TriggerRegistry';
import type { ArtsReaction, PhysicalStatus, EnemyStat } from '@/data/types';
import type { ResolvedHit } from '@/simulation/compiler/types';
import {
  type ReactionDamageType,
  getReactionMultiplier,
  getReactionDamageElement,
  computeEffectEnhancement,
  computeArtsIntensityStaggerMult,
  LIFT_KNOCKDOWN_BASE_STAGGER,
  ELECTRIFICATION_DMG_TAKEN,
  BREACH_DMG_TAKEN,
  CORROSION_INITIAL_SHRED,
  CORROSION_PER_SECOND,
  CORROSION_MAX_SHRED,
  nextCorrosionShred,
  aggregateReactionMods,
} from '@/data/stats/computeReactionDamage';
import { computeStats } from '@/data/stats/computeStats';
import type { ResolvedStatModifier } from '@/data/stats/types';
import type { SourceSlot } from '@/simulation/engine/types';

type EnemyEffectEvents =
  | EnemyEffectApplyEvent
  | EnemyEffectExpireEvent
  | ArtsBurstEvent
  | CorrosionTickSimEvent
  | DotTickSimEvent;

const MAX_INFLICTION_STACKS = 4;
const MAX_VULNERABILITY_STACKS = 4;
const VULNERABILITY_DEFAULT_DURATION = 20;

const ELEMENT_TO_REACTION: Record<string, ArtsReaction> = {
  heat: 'combustion',
  cryo: 'solidification',
  electric: 'electrification',
  nature: 'corrosion',
};

// ─── FIFO source queue helpers ──────────────────────────────────────────────

/** Push stacks to a FIFO source queue, capping total at maxStacks by trimming oldest first. */
function pushSourceQueue(
  queue: SourceSlot[],
  sourceId: string,
  count: number,
  maxStacks: number,
): void {
  const last = queue[queue.length - 1];
  if (last && last.sourceId === sourceId) {
    last.count += count;
  } else {
    queue.push({ sourceId, count });
  }
  let total = queue.reduce((s, slot) => s + slot.count, 0);
  while (total > maxStacks && queue.length > 0) {
    const oldest = queue[0];
    if (!oldest) break;
    const excess = total - maxStacks;
    if (oldest.count <= excess) {
      total -= oldest.count;
      queue.shift();
    } else {
      oldest.count -= excess;
      total = maxStacks;
    }
  }
}

/** Flatten a source queue into a sourceId → stacks map. */
function consumeSourceQueue(queue: SourceSlot[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const slot of queue) {
    result[slot.sourceId] = (result[slot.sourceId] ?? 0) + slot.count;
  }
  return result;
}

/**
 * Compute fractional source breakdown for reaction effects.
 * Trigger gets 1 bonus share + their own stacks; each provider gets their stacks.
 * Returns sourceId → fraction (sums to 1).
 */
function computeSourceBreakdown(
  triggerId: string,
  consumedSources: Record<string, number> | undefined,
  totalStacks: number,
): Record<string, number> | undefined {
  if (!consumedSources) return undefined;
  const totalShares = 1 + totalStacks;
  if (totalShares <= 0) return undefined;
  const triggerStacks = consumedSources[triggerId] ?? 0;
  const breakdown: Record<string, number> = {};
  breakdown[triggerId] = (1 + triggerStacks) / totalShares;
  for (const [srcId, stacks] of Object.entries(consumedSources)) {
    if (srcId !== triggerId) {
      breakdown[srcId] = stacks / totalShares;
    }
  }
  return breakdown;
}

export class EnemyEffectHandler implements EventHandler<EnemyEffectEvents> {
  private registry?: TriggerRegistry;
  constructor(registry?: TriggerRegistry) {
    this.registry = registry;
  }

  handle(event: EnemyEffectEvents, ctx: SimulationContext): void {
    switch (event.type) {
      case 'ENEMY_EFFECT_APPLY':
        this.processApply(event, ctx);
        break;
      case 'ENEMY_EFFECT_EXPIRE':
        this.processExpire(event, ctx);
        break;
      case 'ARTS_BURST':
        ctx.enemyLog(event);
        this.emitReactionDamageHit('artsBurst', 1, event.time, event.sourceId, ctx, {
          triggerElement: event.element,
        });
        this.registry?.onStatusApplied(
          `${event.element}Burst`,
          undefined,
          'enemy',
          event.sourceId,
          event.time,
          ctx,
          event.sourceSkillType,
          event.sourceSkillId,
        );
        break;
      case 'CORROSION_TICK':
        this.handleCorrosionTick(event, ctx);
        break;
      case 'DOT_TICK':
        this.handleDotTick(event, ctx);
        break;
    }
  }

  // ─── Reaction damage helpers ─────────────────────────────────────────────────

  private getSourceArtsIntensity(sourceId: string, time: number, ctx: SimulationContext): number {
    const baseStats = ctx.getBaseStats(sourceId);
    if (!baseStats) return 0;
    const activeEntries = ctx.getOperatorEffects(sourceId).getActiveEntries(time);
    const dynamicMods: ResolvedStatModifier[] = [];
    for (const entry of activeEntries) {
      if (!entry.stat) continue;
      dynamicMods.push({ stat: entry.stat, value: entry.value * entry.stacks });
    }
    const status = computeStats(baseStats, [], dynamicMods);
    return status.artsIntensity;
  }

  private emitReactionDamageHit(
    reactionType: ReactionDamageType,
    level: number,
    time: number,
    sourceId: string,
    ctx: SimulationContext,
    opts?: {
      triggerElement?: string;
      effectiveness?: number;
      consumedStackSources?: Record<string, number>;
      actionId?: string;
    },
    stagger = 0,
    reactionStaggerMult?: number,
  ): void {
    const element = getReactionDamageElement(reactionType, opts?.triggerElement);
    const multiplier = getReactionMultiplier(reactionType, level);

    ctx.queue.enqueue(
      {
        type: 'DAMAGE_HIT',
        time,
        payload: {
          targetId: 'enemy',
          sourceId,
          stagger,
          hitData: {
            offset: 0,
            multiplier,
            spRecovery: 0,
            spReturn: 0,
            stagger,
            realTime: time,
            realOffset: 0,
            time,
            triggered: true,
            triggeredBy: `reaction:${reactionType}`,
            _reactionMeta: {
              reactionType,
              level,
              element,
              effectiveness: opts?.effectiveness,
              consumedStackSources: opts?.consumedStackSources,
            },
            _reactionStaggerMult: reactionStaggerMult,
          } as ResolvedHit,
          actionId: opts?.actionId ?? `reaction:${reactionType}:${time}`,
        },
      },
      0,
    );
  }

  // ─── Apply routing ──────────────────────────────────────────────────────────

  private processApply(event: EnemyEffectApplyEvent, ctx: SimulationContext): void {
    switch (event.kind) {
      case 'infliction':
        this.applyInfliction(event, ctx);
        break;
      case 'physicalStatus':
        this.applyPhysicalStatus(event, ctx);
        break;
      case 'reaction':
        this.applyReaction(event, ctx);
        break;
      case 'status':
        this.applyEnemyStatus(event, ctx);
        break;
    }
  }

  // ─── Infliction ─────────────────────────────────────────────────────────────

  private applyInfliction(
    event: Extract<EnemyEffectApplyEvent, { kind: 'infliction' }>,
    ctx: SimulationContext,
  ): void {
    const state = ctx.state.enemy;
    const { element, time, sourceId, sourceSkillType, sourceSkillId } = event;
    if (state.hasInflictionBarrier(element, time)) return;
    const stacks = event.stacks ?? 1;
    const duration = event.effectiveDuration;
    const shiftedExpiry = ctx.getShiftedTime(time, duration);
    const stackStrategy = event.stackStrategy ?? 'REFRESH_DURATION';

    if (state.infliction === null || stackStrategy === 'REPLACE') {
      if (state.infliction !== null) {
        ctx.queue.cancel(
          e =>
            e.type === 'ENEMY_EFFECT_EXPIRE' &&
            (e as EnemyEffectExpireEvent).kind === 'infliction' &&
            (e as Extract<EnemyEffectExpireEvent, { kind: 'infliction' }>).element ===
              state.infliction?.element,
        );
      }
      const queue: SourceSlot[] = [];
      pushSourceQueue(queue, sourceId, stacks, MAX_INFLICTION_STACKS);
      state.infliction = {
        element,
        stacks: Math.min(MAX_INFLICTION_STACKS, stacks),
        appliedAt: time,
        expiresAt: shiftedExpiry,
        sourceQueue: queue,
      };
      ctx.queue.enqueue(
        {
          type: 'ENEMY_EFFECT_EXPIRE',
          time: shiftedExpiry,
          kind: 'infliction',
          element,
          consumed: false,
        },
        2,
      );
      ctx.enemyLog({
        type: 'INFLICTION_APPLY',
        time,
        element,
        stacks: state.infliction.stacks,
        sourceId,
        effectiveDuration: duration,
        expiresAt: shiftedExpiry,
      });
      this.registry?.onStatusApplied(
        `${element}Infliction`,
        undefined,
        'enemy',
        sourceId,
        time,
        ctx,
        sourceSkillType,
        sourceSkillId,
      );
      return;
    }

    if (state.infliction.element === element) {
      // Same element → Arts Burst, increment stacks, refresh timer
      pushSourceQueue(state.infliction.sourceQueue, sourceId, stacks, MAX_INFLICTION_STACKS);
      state.infliction.stacks = Math.min(MAX_INFLICTION_STACKS, state.infliction.stacks + stacks);
      state.infliction.expiresAt = shiftedExpiry;
      ctx.queue.cancel(
        e =>
          e.type === 'ENEMY_EFFECT_EXPIRE' &&
          (e as EnemyEffectExpireEvent).kind === 'infliction' &&
          (e as Extract<EnemyEffectExpireEvent, { kind: 'infliction' }>).element === element,
      );
      ctx.queue.enqueue(
        {
          type: 'ENEMY_EFFECT_EXPIRE',
          time: shiftedExpiry,
          kind: 'infliction',
          element,
          consumed: false,
        },
        2,
      );
      ctx.enemyLog({
        type: 'INFLICTION_APPLY',
        time,
        element,
        stacks,
        sourceId,
        effectiveDuration: duration,
        expiresAt: shiftedExpiry,
      });
      ctx.queue.enqueue(
        { type: 'ARTS_BURST', time: time + 1, element, sourceId, sourceSkillType, sourceSkillId },
        1,
      );
      this.registry?.onStatusApplied(
        `${element}Infliction`,
        undefined,
        'enemy',
        sourceId,
        time,
        ctx,
        sourceSkillType,
        sourceSkillId,
      );
      return;
    }

    // Different element → consume existing infliction, trigger reaction, no new infliction bar
    const consumedElement = state.infliction.element;
    const consumedStacks = state.infliction.stacks;
    const consumedSources = consumeSourceQueue(state.infliction.sourceQueue);
    const reactionLevel = Math.max(1, Math.min(MAX_INFLICTION_STACKS, consumedStacks));

    ctx.queue.cancel(
      e =>
        e.type === 'ENEMY_EFFECT_EXPIRE' &&
        (e as EnemyEffectExpireEvent).kind === 'infliction' &&
        (e as Extract<EnemyEffectExpireEvent, { kind: 'infliction' }>).element === consumedElement,
    );

    ctx.enemyLog({
      type: 'INFLICTION_CONSUMED',
      time,
      element: consumedElement,
      consumedStacks,
      sourceId,
    });
    this.registry?.onStatusConsumed(
      `${consumedElement}Infliction`,
      undefined,
      'enemy',
      sourceId,
      time,
      ctx,
      consumedStacks,
      sourceSkillType,
      sourceSkillId,
    );
    state.infliction = null;

    const reactionType = ELEMENT_TO_REACTION[element];
    if (!reactionType) return;
    ctx.queue.enqueue(
      {
        type: 'ENEMY_EFFECT_APPLY',
        time,
        kind: 'reaction',
        reactionType,
        level: reactionLevel,
        sourceId,
        actionId: event.actionId,
        effectiveDuration: 0,
        consumedStackSources: consumedSources,
      },
      1,
    );
    // Log the trigger icon (no duration bar for consumed infliction)
    ctx.enemyLog({
      type: 'INFLICTION_APPLY',
      time,
      element,
      stacks,
      sourceId,
      effectiveDuration: duration,
      triggerOnly: true,
    });
    this.registry?.onStatusApplied(
      `${element}Infliction`,
      undefined,
      'enemy',
      sourceId,
      time,
      ctx,
      sourceSkillType,
      sourceSkillId,
    );
  }

  // ─── Physical status / vulnerability ────────────────────────────────────────

  private consumeVulnerability(
    physicalType: 'breach' | 'crush',
    time: number,
    sourceId: string,
    ctx: SimulationContext,
    sourceSkillType?: string,
    sourceSkillId?: string,
  ): { level: number; consumedSources: Record<string, number> } {
    const state = ctx.state.enemy;
    const preConsumeSnap = state.statusSnapshot();
    const consumedStacks = state.vulnerability!.stacks;
    const consumedSources = consumeSourceQueue(state.vulnerability!.sourceQueue);
    const level = Math.max(1, Math.min(MAX_VULNERABILITY_STACKS, consumedStacks));
    ctx.queue.cancel(
      e =>
        e.type === 'ENEMY_EFFECT_EXPIRE' && (e as EnemyEffectExpireEvent).kind === 'vulnerability',
    );
    state.vulnerability = null;
    ctx.enemyLog({
      type: 'VULNERABILITY_CONSUMED',
      time,
      consumedStacks,
      consumedBy: physicalType,
      sourceId,
    });
    this.registry?.onStatusConsumed(
      'vulnerability',
      undefined,
      'enemy',
      sourceId,
      time,
      ctx,
      consumedStacks,
      sourceSkillType,
      sourceSkillId,
      preConsumeSnap,
    );
    return { level, consumedSources };
  }

  private applyPhysicalStatus(
    event: Extract<EnemyEffectApplyEvent, { kind: 'physicalStatus' }>,
    ctx: SimulationContext,
  ): void {
    const state = ctx.state.enemy;
    const { physicalType, time, sourceId, sourceSkillType, sourceSkillId, actionId, forced } =
      event;
    const hasVuln = state.vulnerability !== null;
    const isLiftOrKnockdown = physicalType === 'lift' || physicalType === 'knockdown';
    const enemySuperArmor = Math.max(0, Number(state.config?.superArmor) || 0);
    const actualPhysicalControl =
      isLiftOrKnockdown && Boolean(hasVuln || forced) && enemySuperArmor < 30;

    ctx.enemyLog({
      type: 'PHYSICAL_STATUS',
      time,
      physicalType,
      sourceId,
      effectiveDuration: event.effectiveDuration,
      ...(isLiftOrKnockdown ? { actualControl: actualPhysicalControl } : {}),
    });

    // Shatter: any physical hit on a solidified enemy immediately consumes solidification
    if (state.solidification) {
      this.triggerShatter(
        state.solidification.level,
        time,
        sourceId,
        ctx,
        state.solidification.consumedStackSources,
      );
      state.solidification = null;
    }

    switch (physicalType) {
      case 'vulnerability':
        this.processVulnerabilityApply(
          time,
          physicalType,
          sourceId,
          event.effectiveDuration,
          ctx,
          sourceSkillType,
          sourceSkillId,
          event.stackStrategy,
        );
        break;

      case 'lift':
      case 'knockdown':
        this.processVulnerabilityApply(
          time,
          physicalType,
          sourceId,
          VULNERABILITY_DEFAULT_DURATION,
          ctx,
          sourceSkillType,
          sourceSkillId,
          event.stackStrategy,
        );
        if (hasVuln || forced) {
          // Only deal damage + stagger when vulnerability was present (not forced without vuln)
          if (hasVuln) {
            const ai = this.getSourceArtsIntensity(sourceId, time, ctx);
            this.emitReactionDamageHit(
              physicalType as ReactionDamageType,
              1,
              time,
              sourceId,
              ctx,
              { actionId },
              LIFT_KNOCKDOWN_BASE_STAGGER,
              computeArtsIntensityStaggerMult(ai),
            );
          }
          this.registry?.onStatusApplied(
            physicalType,
            undefined,
            'enemy',
            sourceId,
            time,
            ctx,
            sourceSkillType,
            sourceSkillId,
          );
        }
        break;

      case 'crush':
        if (hasVuln) {
          const { level: crushLevel, consumedSources: crushSources } = this.consumeVulnerability(
            'crush',
            time,
            sourceId,
            ctx,
            sourceSkillType,
            sourceSkillId,
          );
          this.emitReactionDamageHit('crush', crushLevel, time, sourceId, ctx, {
            effectiveness: event.effectiveness,
            consumedStackSources: crushSources,
            actionId,
          });
          this.registry?.onStatusApplied(
            'crush',
            undefined,
            'enemy',
            sourceId,
            time,
            ctx,
            sourceSkillType,
            sourceSkillId,
          );
        } else {
          this.processVulnerabilityApply(
            time,
            physicalType,
            sourceId,
            event.effectiveDuration,
            ctx,
            sourceSkillType,
            sourceSkillId,
            event.stackStrategy,
          );
          if (forced) {
            // Forced without vuln: no damage, but still trigger status
            this.registry?.onStatusApplied(
              'crush',
              undefined,
              'enemy',
              sourceId,
              time,
              ctx,
              sourceSkillType,
              sourceSkillId,
            );
          }
        }
        break;

      case 'breach':
        if (hasVuln) {
          const { level, consumedSources: breachSources } = this.consumeVulnerability(
            'breach',
            time,
            sourceId,
            ctx,
            sourceSkillType,
            sourceSkillId,
          );
          this.emitReactionDamageHit('breach', level, time, sourceId, ctx, {
            effectiveness: event.effectiveness,
            consumedStackSources: breachSources,
            actionId,
          });
          this.applyBreachDebuff(
            state,
            time,
            level,
            sourceId,
            ctx,
            getReactionDuration('breach', level),
            sourceSkillType,
            sourceSkillId,
            undefined,
            breachSources,
          );
        } else {
          this.processVulnerabilityApply(
            time,
            physicalType,
            sourceId,
            event.effectiveDuration,
            ctx,
            sourceSkillType,
            sourceSkillId,
            event.stackStrategy,
          );
          if (forced) {
            // Forced without vuln: no damage, but still apply debuff
            this.applyBreachDebuff(
              state,
              time,
              1,
              sourceId,
              ctx,
              getReactionDuration('breach', 1),
              sourceSkillType,
              sourceSkillId,
            );
          }
        }
        break;
    }
  }

  private processVulnerabilityApply(
    time: number,
    physicalType: string,
    sourceId: string,
    duration: number,
    ctx: SimulationContext,
    sourceSkillType?: string,
    sourceSkillId?: string,
    stackStrategy: 'REFRESH_DURATION' | 'INDEPENDENT' | 'REPLACE' = 'REFRESH_DURATION',
  ): void {
    const state = ctx.state.enemy;
    if (state.hasInflictionBarrier('physical', time)) return;
    const effectiveDuration = duration || VULNERABILITY_DEFAULT_DURATION;
    const shiftedExpiry = ctx.getShiftedTime(time, effectiveDuration);
    if (state.vulnerability === null || stackStrategy === 'REPLACE') {
      state.vulnerability = {
        stacks: 1,
        appliedAt: time,
        expiresAt: shiftedExpiry,
        sourceQueue: [{ sourceId, count: 1 }],
      };
      ctx.enemyLog({
        type: 'VULNERABILITY_CHANGE',
        time,
        stacks: 1,
        expiresAt: shiftedExpiry,
        trigger: physicalType as PhysicalStatus,
        sourceId,
      });
    } else {
      ctx.queue.cancel(
        e =>
          e.type === 'ENEMY_EFFECT_EXPIRE' &&
          (e as EnemyEffectExpireEvent).kind === 'vulnerability',
      );
      pushSourceQueue(state.vulnerability.sourceQueue, sourceId, 1, MAX_VULNERABILITY_STACKS);
      state.vulnerability.stacks = Math.min(
        MAX_VULNERABILITY_STACKS,
        state.vulnerability.stacks + 1,
      );
      state.vulnerability.appliedAt = time;
      state.vulnerability.expiresAt = shiftedExpiry;
      ctx.enemyLog({
        type: 'VULNERABILITY_CHANGE',
        time,
        stacks: state.vulnerability.stacks,
        expiresAt: state.vulnerability.expiresAt,
        trigger: physicalType as PhysicalStatus,
        sourceId,
      });
    }
    ctx.queue.enqueue(
      {
        type: 'ENEMY_EFFECT_EXPIRE',
        time: shiftedExpiry,
        kind: 'vulnerability',
        consumed: false,
      },
      2,
    );
    this.registry?.onStatusApplied(
      'vulnerability',
      undefined,
      'enemy',
      sourceId,
      time,
      ctx,
      sourceSkillType,
      sourceSkillId,
    );
  }

  private triggerShatter(
    level: number,
    time: number,
    sourceId: string,
    ctx: SimulationContext,
    consumedStackSources?: Record<string, number>,
  ): void {
    ctx.queue.cancel(
      e =>
        e.type === 'ENEMY_EFFECT_EXPIRE' &&
        (e as EnemyEffectExpireEvent).kind === 'debuff' &&
        (e as Extract<EnemyEffectExpireEvent, { kind: 'debuff' }>).debuffType === 'solidification',
    );
    ctx.enemyLog({
      type: 'ENEMY_EFFECT_EXPIRE',
      time,
      kind: 'debuff',
      debuffType: 'solidification',
      consumed: true,
    });
    ctx.queue.enqueue(
      {
        type: 'ENEMY_EFFECT_APPLY',
        time,
        kind: 'reaction',
        reactionType: 'shatter',
        level,
        sourceId,
        effectiveDuration: 0,
        consumedStackSources,
      },
      1,
    );
  }

  // ─── Reaction ───────────────────────────────────────────────────────────────

  private applyReaction(
    event: Extract<EnemyEffectApplyEvent, { kind: 'reaction' }>,
    ctx: SimulationContext,
  ): void {
    const enemy = ctx.state.enemy;
    const {
      reactionType,
      time,
      sourceId,
      requiresInfliction,
      sourceSkillType,
      sourceSkillId,
      actionId,
    } = event;
    let level = Math.max(1, Math.min(MAX_INFLICTION_STACKS, event.level ?? 1));
    let consumedStackSources = event.consumedStackSources;

    // If the reaction requires consuming a specific infliction, do so now
    if (requiresInfliction && requiresInfliction.length > 0) {
      if (!enemy.infliction || !requiresInfliction.includes(enemy.infliction.element)) {
        return; // Required infliction not present or wrong element — don't trigger
      }
      const { element: infElement, stacks: consumedStacks } = enemy.infliction;
      consumedStackSources = consumeSourceQueue(enemy.infliction.sourceQueue);
      ctx.queue.cancel(
        e =>
          e.type === 'ENEMY_EFFECT_EXPIRE' &&
          (e as EnemyEffectExpireEvent).kind === 'infliction' &&
          (e as Extract<EnemyEffectExpireEvent, { kind: 'infliction' }>).element === infElement,
      );
      ctx.enemyLog({
        type: 'INFLICTION_CONSUMED',
        time,
        element: infElement,
        consumedStacks,
        sourceId,
      });
      this.registry?.onStatusConsumed(
        `${infElement}Infliction`,
        undefined,
        'enemy',
        sourceId,
        time,
        ctx,
        consumedStacks,
        sourceSkillType,
        sourceSkillId,
      );
      enemy.infliction = null;
      level = Math.max(1, Math.min(MAX_INFLICTION_STACKS, consumedStacks + level - 1));
    }

    ctx.enemyLog({
      type: 'REACTION_TRIGGER',
      time,
      reactionType,
      level,
      sourceId,
      effectiveDuration: event.effectiveDuration,
      effectiveness: event.effectiveness,
    });
    // Fold the caster's own reaction modifiers (duration +s, effectiveness bonus) into this reaction.
    // Reads getOperatorEffects(sourceId) → applies only to reactions this operator triggers. When the
    // caster has no such modifiers (all existing content), duration/effectiveness are unchanged.
    const mods = aggregateReactionMods(
      ctx.getOperatorEffects(sourceId).getActiveEntries(time),
      reactionType,
    );
    const effectiveDuration = mods.durationBonus
      ? (event.effectiveDuration || getReactionDuration(reactionType, level) || 0) +
        mods.durationBonus
      : event.effectiveDuration;
    const effectiveness = mods.effectivenessBonus
      ? (event.effectiveness ?? 1) + mods.effectivenessBonus
      : event.effectiveness;
    const css = consumedStackSources; // shorthand
    // Forced reactions (via ReactionEffect) don't deal reaction damage
    const isForced = !!event.forced;
    switch (reactionType) {
      case 'electrification':
        this.applyElectrification(
          enemy,
          time,
          level,
          sourceId,
          ctx,
          effectiveDuration,
          sourceSkillType,
          sourceSkillId,
          effectiveness,
          css,
        );
        if (!isForced)
          this.emitReactionDamageHit('electrification', level, time, sourceId, ctx, {
            effectiveness,
            consumedStackSources: css,
            actionId,
          });
        break;
      case 'corrosion':
        this.applyCorrosion(
          enemy,
          time,
          level,
          sourceId,
          ctx,
          effectiveDuration,
          sourceSkillType,
          sourceSkillId,
          effectiveness,
          css,
        );
        if (!isForced)
          this.emitReactionDamageHit('corrosion', level, time, sourceId, ctx, {
            effectiveness,
            consumedStackSources: css,
            actionId,
          });
        break;
      case 'combustion':
        this.applyCombustion(
          enemy,
          time,
          level,
          sourceId,
          ctx,
          effectiveDuration,
          sourceSkillType,
          sourceSkillId,
          effectiveness,
          css,
          actionId,
        );
        if (!isForced)
          this.emitReactionDamageHit('combustion', level, time, sourceId, ctx, {
            effectiveness,
            consumedStackSources: css,
            actionId,
          });
        break;
      case 'solidification':
        this.applySolidification(
          enemy,
          time,
          level,
          sourceId,
          ctx,
          effectiveDuration,
          sourceSkillType,
          sourceSkillId,
          css,
        );
        if (!isForced)
          this.emitReactionDamageHit('solidification', level, time, sourceId, ctx, {
            effectiveness,
            consumedStackSources: css,
            actionId,
          });
        break;
      case 'shatter':
        if (!isForced)
          this.emitReactionDamageHit('shatter', level, time, sourceId, ctx, {
            effectiveness,
            consumedStackSources: css,
            actionId,
          });
        this.registry?.onStatusApplied(
          'shatter',
          undefined,
          'enemy',
          sourceId,
          time,
          ctx,
          sourceSkillType,
          sourceSkillId,
        );
        break;
      // crush, breach — handled inline in applyPhysicalStatus
    }
  }

  private scheduleDebuffExpire(
    debuffType: 'electrification' | 'corrosion' | 'combustion' | 'solidification' | 'breach',
    expiresAt: number,
    ctx: SimulationContext,
  ): void {
    ctx.queue.cancel(
      e =>
        e.type === 'ENEMY_EFFECT_EXPIRE' &&
        (e as EnemyEffectExpireEvent).kind === 'debuff' &&
        (e as Extract<EnemyEffectExpireEvent, { kind: 'debuff' }>).debuffType === debuffType,
    );
    ctx.queue.enqueue(
      { type: 'ENEMY_EFFECT_EXPIRE', time: expiresAt, kind: 'debuff', debuffType, consumed: false },
      2,
    );
  }

  private applyElectrification(
    enemy: EnemyState,
    time: number,
    level: number,
    sourceId: string,
    ctx: SimulationContext,
    effectiveDuration: number,
    sourceSkillType?: string,
    sourceSkillId?: string,
    effectiveness?: number,
    consumedStackSources?: Record<string, number>,
  ): void {
    const duration = effectiveDuration || getReactionDuration('electrification', level);
    const expiresAt = ctx.getShiftedTime(time, duration);
    this.scheduleDebuffExpire('electrification', expiresAt, ctx);
    enemy.electrification = { level, expiresAt, operatorSlot: 0, sourceId };
    ctx.enemyLog({
      type: 'DEBUFF_APPLY',
      time,
      debuffType: 'electrification',
      level,
      expiresAt,
      sourceId,
    });

    // Apply arts damage taken increase as enemy status effect
    const baseDmgTaken = ELECTRIFICATION_DMG_TAKEN[level] ?? 12;
    const ai = this.getSourceArtsIntensity(sourceId, time, ctx);
    const enhancement = computeEffectEnhancement(ai);
    const finalDmgTaken = baseDmgTaken * (1 + enhancement) * (effectiveness ?? 1);
    // Cancel previous electrification status effect
    ctx.queue.cancel(
      e =>
        e.type === 'ENEMY_EFFECT_EXPIRE' &&
        (e as EnemyEffectExpireEvent).kind === 'status' &&
        (e as Extract<EnemyEffectExpireEvent, { kind: 'status' }>).id ===
          'electrification:dmgTaken',
    );
    ctx.state.enemy.expireStatus('electrification:dmgTaken');
    ctx.queue.enqueue(
      {
        type: 'ENEMY_EFFECT_APPLY',
        time,
        kind: 'status',
        id: 'electrification:dmgTaken',
        stat: { modifier: 'increasedDmgTaken', elements: ['electric', 'heat', 'cryo', 'nature'] },
        value: finalDmgTaken,
        stacks: 1,
        maxStacks: 1,
        expiresAt,
        sourceId,
        sourceSkillType,
        icon: undefined,
        effect: { kind: 'status', hide: true } as any,
        sourceBreakdown: computeSourceBreakdown(sourceId, consumedStackSources, level),
      },
      1,
    );

    this.registry?.onStatusApplied(
      'electrification',
      undefined,
      'enemy',
      sourceId,
      time,
      ctx,
      sourceSkillType,
      sourceSkillId,
    );
  }

  private applyCorrosion(
    enemy: EnemyState,
    time: number,
    level: number,
    sourceId: string,
    ctx: SimulationContext,
    effectiveDuration: number,
    sourceSkillType?: string,
    sourceSkillId?: string,
    effectiveness?: number,
    consumedStackSources?: Record<string, number>,
  ): void {
    const duration = effectiveDuration || getReactionDuration('corrosion', level);
    const expiresAt = ctx.getShiftedTime(time, duration);
    const existing = enemy.corrosion;

    const ai = this.getSourceArtsIntensity(sourceId, time, ctx);
    const enhancement = computeEffectEnhancement(ai);
    const effectivenessMult = effectiveness ?? 1;

    this.scheduleDebuffExpire('corrosion', expiresAt, ctx);

    // The new application always owns its own level → initial/rate/cap (never inherits the old one's).
    const initialShred =
      (CORROSION_INITIAL_SHRED[level] ?? 3.6) * (1 + enhancement) * effectivenessMult;
    const perSecond = (CORROSION_PER_SECOND[level] ?? 0.84) * (1 + enhancement) * effectivenessMult;
    const maxShred = (CORROSION_MAX_SHRED[level] ?? 12) * (1 + enhancement) * effectivenessMult;

    // On re-apply only the current shred carries over as a floor (never lowered); if it already exceeds
    // this application's cap, the tick handler holds it there (no ramp) for the refreshed duration.
    const startingShred = existing
      ? Math.max(existing.currentResShred, initialShred)
      : initialShred;

    enemy.corrosion = {
      level,
      startedAt: time,
      expiresAt,
      operatorSlot: 0,
      currentResShred: startingShred,
      perSecond,
      maxShred,
      sourceId,
    };

    ctx.enemyLog({
      type: 'DEBUFF_APPLY',
      time,
      debuffType: 'corrosion',
      level,
      expiresAt,
      sourceId,
    });

    // Cancel previous corrosion tick chain + hidden status events
    ctx.queue.cancel(e => e.type === 'CORROSION_TICK');
    ctx.queue.cancel(
      e =>
        (e.type === 'ENEMY_EFFECT_EXPIRE' &&
          (e as EnemyEffectExpireEvent).kind === 'status' &&
          (e as Extract<EnemyEffectExpireEvent, { kind: 'status' }>).id === 'corrosion:resShred') ||
        (e.type === 'ENEMY_EFFECT_APPLY' &&
          (e as EnemyEffectApplyEvent).kind === 'status' &&
          (e as Extract<EnemyEffectApplyEvent, { kind: 'status' }>).id === 'corrosion:resShred'),
    );
    ctx.state.enemy.expireStatus('corrosion:resShred');

    // Apply initial res shred status (priority 1: after reaction damage at same time)
    ctx.queue.enqueue(
      {
        type: 'ENEMY_EFFECT_APPLY',
        time,
        kind: 'status',
        id: 'corrosion:resShred',
        stat: { modifier: 'resistanceShred' },
        value: startingShred,
        stacks: 1,
        maxStacks: 1,
        expiresAt,
        sourceId,
        sourceSkillType,
        icon: undefined,
        effect: { kind: 'status', id: 'corrosion:resShred', name: 'corrosion', hide: true } as any,
        sourceBreakdown: computeSourceBreakdown(sourceId, consumedStackSources, level),
      },
      1,
    );

    // Log initial corrosion tick
    ctx.enemyLog({
      type: 'CORROSION_TICK',
      time,
      sourceId,
      resShred: startingShred,
      level,
      tickIndex: 0,
    });

    // Schedule first self-chaining tick
    const firstTickTime = ctx.getShiftedTime(time, 1);
    if (firstTickTime < expiresAt) {
      ctx.queue.enqueue(
        {
          type: 'CORROSION_TICK',
          time: firstTickTime,
          payload: {
            sourceId,
            perSecond,
            maxShred,
            tickIndex: 1,
            expiresAt,
          },
        },
        1,
      );
    }

    this.registry?.onStatusApplied(
      'corrosion',
      undefined,
      'enemy',
      sourceId,
      time,
      ctx,
      sourceSkillType,
      sourceSkillId,
    );
  }

  private handleCorrosionTick(event: CorrosionTickSimEvent, ctx: SimulationContext): void {
    const enemy = ctx.state.enemy;
    const corrosion = enemy.corrosion;

    // Guard: corrosion expired or cleared
    if (!corrosion || event.time >= corrosion.expiresAt) return;

    const { sourceId, perSecond, maxShred, tickIndex, expiresAt } = event.payload;

    // Compute new shred value
    const newShred = nextCorrosionShred(corrosion.currentResShred, perSecond, maxShred);
    corrosion.currentResShred = newShred;

    // Update the hidden corrosion:resShred status effect value in-place
    const existing = enemy.enemyStatusEffects.get('corrosion:resShred');
    if (existing) {
      existing.value = newShred;
    }

    // Log the tick for projection
    ctx.enemyLog({
      type: 'CORROSION_TICK',
      time: event.time,
      sourceId,
      resShred: newShred,
      level: corrosion.level,
      tickIndex,
    });

    // Schedule next tick (self-chain)
    const nextTickTime = ctx.getShiftedTime(event.time, 1);
    if (nextTickTime < expiresAt) {
      ctx.queue.enqueue(
        {
          type: 'CORROSION_TICK',
          time: nextTickTime,
          payload: {
            sourceId,
            perSecond,
            maxShred,
            tickIndex: tickIndex + 1,
            expiresAt,
          },
        },
        1,
      );
    }
  }

  private handleDotTick(event: DotTickSimEvent, ctx: SimulationContext): void {
    const { sourceId, effectId, element, multiplier, skillType, skillId, canCrit, actionId } =
      event.payload;

    // Log for projection (diamond markers)
    ctx.enemyLog({ type: 'DOT_TICK', time: event.time, effectId, sourceId });

    // Emit the actual damage hit
    ctx.queue.enqueue(
      {
        type: 'DAMAGE_HIT',
        time: event.time,
        payload: {
          targetId: 'enemy',
          sourceId,
          stagger: 0,
          hitData: {
            offset: 0,
            multiplier,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
            realTime: event.time,
            realOffset: 0,
            time: event.time,
            triggered: true,
            triggeredBy: `dot:${effectId}`,
            skillType,
            skillId,
            element,
            consumedStacks: event.payload.consumedStacks,
            consumedStatEffects: event.payload.consumedStatEffects,
            _canCrit: canCrit !== false ? undefined : false,
          } as ResolvedHit,
          actionId: actionId ?? `triggered:${effectId}`,
        },
      },
      1,
    );
  }

  private applyCombustion(
    enemy: EnemyState,
    time: number,
    level: number,
    sourceId: string,
    ctx: SimulationContext,
    effectiveDuration: number,
    sourceSkillType?: string,
    sourceSkillId?: string,
    effectiveness?: number,
    consumedStackSources?: Record<string, number>,
    actionId?: string,
  ): void {
    const duration = effectiveDuration || getReactionDuration('combustion', level);
    const expiresAt = ctx.getShiftedTime(time, duration);

    // Cancel pending DoT hits from previous combustion
    ctx.queue.cancel(
      e =>
        e.type === 'DAMAGE_HIT' &&
        ((e as HitEvent).payload.hitData as ResolvedHit)?.triggeredBy === 'reaction:combustion_dot',
    );

    this.scheduleDebuffExpire('combustion', expiresAt, ctx);
    enemy.combustion = {
      level,
      startedAt: time,
      expiresAt,
      sourceId,
      effectiveness,
      consumedStackSources,
      actionId,
    };
    ctx.enemyLog({
      type: 'DEBUFF_APPLY',
      time,
      debuffType: 'combustion',
      level,
      expiresAt,
      sourceId,
    });

    // Schedule 10 DoT ticks at 1s intervals (1s..10s from start)
    for (let tick = 1; tick <= 10; tick++) {
      const tickTime = ctx.getShiftedTime(time, tick);
      if (tickTime > expiresAt) break;
      this.emitReactionDamageHit('combustion_dot', level, tickTime, sourceId, ctx, {
        effectiveness,
        consumedStackSources,
        actionId,
      });
    }

    this.registry?.onStatusApplied(
      'combustion',
      undefined,
      'enemy',
      sourceId,
      time,
      ctx,
      sourceSkillType,
      sourceSkillId,
    );
  }

  private applySolidification(
    enemy: EnemyState,
    time: number,
    level: number,
    sourceId: string,
    ctx: SimulationContext,
    effectiveDuration: number,
    sourceSkillType?: string,
    sourceSkillId?: string,
    consumedStackSources?: Record<string, number>,
  ): void {
    const duration = effectiveDuration || getReactionDuration('solidification', level);
    const expiresAt = ctx.getShiftedTime(time, duration);
    this.scheduleDebuffExpire('solidification', expiresAt, ctx);
    enemy.solidification = {
      level,
      expiresAt,
      consumedStackSources,
      sourceId,
    };
    ctx.enemyLog({
      type: 'DEBUFF_APPLY',
      time,
      debuffType: 'solidification',
      level,
      expiresAt,
      sourceId,
    });
    this.registry?.onStatusApplied(
      'solidification',
      undefined,
      'enemy',
      sourceId,
      time,
      ctx,
      sourceSkillType,
      sourceSkillId,
    );
  }

  private applyBreachDebuff(
    enemy: EnemyState,
    time: number,
    level: number,
    sourceId: string,
    ctx: SimulationContext,
    effectiveDuration: number,
    sourceSkillType?: string,
    sourceSkillId?: string,
    effectiveness?: number,
    consumedStackSources?: Record<string, number>,
  ): void {
    const duration = effectiveDuration || getReactionDuration('breach', level);
    const expiresAt = ctx.getShiftedTime(time, duration);
    this.scheduleDebuffExpire('breach', expiresAt, ctx);
    enemy.breach = { level, expiresAt, operatorSlot: 0, sourceId };
    ctx.enemyLog({ type: 'DEBUFF_APPLY', time, debuffType: 'breach', level, expiresAt, sourceId });

    // Apply physical damage taken increase as enemy status effect
    const baseDmgTaken = BREACH_DMG_TAKEN[level] ?? 12;
    const ai = this.getSourceArtsIntensity(sourceId, time, ctx);
    const enhancement = computeEffectEnhancement(ai);
    const finalDmgTaken = baseDmgTaken * (1 + enhancement) * (effectiveness ?? 1);
    // Cancel previous breach status effect
    ctx.queue.cancel(
      e =>
        e.type === 'ENEMY_EFFECT_EXPIRE' &&
        (e as EnemyEffectExpireEvent).kind === 'status' &&
        (e as Extract<EnemyEffectExpireEvent, { kind: 'status' }>).id === 'breach:dmgTaken',
    );
    ctx.state.enemy.expireStatus('breach:dmgTaken');
    ctx.queue.enqueue(
      {
        type: 'ENEMY_EFFECT_APPLY',
        time,
        kind: 'status',
        id: 'breach:dmgTaken',
        stat: { modifier: 'increasedDmgTaken', elements: ['physical'] },
        value: finalDmgTaken,
        stacks: 1,
        maxStacks: 1,
        expiresAt,
        sourceId,
        sourceSkillType,
        icon: undefined,
        effect: { kind: 'status', hide: true } as any,
        sourceBreakdown: computeSourceBreakdown(sourceId, consumedStackSources, level),
      },
      1,
    );

    this.registry?.onStatusApplied(
      'breach',
      undefined,
      'enemy',
      sourceId,
      time,
      ctx,
      sourceSkillType,
      sourceSkillId,
    );
  }

  // ─── Enemy StatusEffect (unified stat + state) ─────────────────────────────

  private applyEnemyStatus(
    event: Extract<EnemyEffectApplyEvent, { kind: 'status' }>,
    ctx: SimulationContext,
  ): void {
    const {
      id,
      stat,
      value,
      stacks,
      maxStacks,
      expiresAt,
      stackStrategy,
      time,
      sourceId,
      sourceSkillType,
      sourceSkillId,
      actionId,
    } = event;
    if (expiresAt <= time) return;
    ctx.state.enemy.applyStatus({
      id,
      stat,
      value,
      stacks,
      maxStacks,
      expiresAt,
      stackStrategy,
      sourceId,
      icon: event.icon,
      effect: event.effect,
      consumedStacks: event.consumedStacks,
      sourceBreakdown: event.sourceBreakdown,
      cancelHitKey: (event as any).cancelHitKey,
      external: event.external,
      actionId,
    });
    ctx.enemyLog({
      type: 'ENEMY_STATUS_APPLY',
      time,
      id,
      stat,
      value,
      stacks,
      maxStacks,
      expiresAt,
      stackStrategy,
      sourceId,
      icon: event.icon,
      effect: event.effect,
    });
    ctx.queue.cancel(
      e =>
        e.type === 'ENEMY_EFFECT_EXPIRE' &&
        (e as EnemyEffectExpireEvent).kind === 'status' &&
        (e as Extract<EnemyEffectExpireEvent, { kind: 'status' }>).id === id &&
        e.time >= time,
    );
    ctx.queue.enqueue(
      {
        type: 'ENEMY_EFFECT_EXPIRE',
        time: expiresAt,
        kind: 'status',
        id,
        consumed: false,
        sourceSkillType,
        sourceSkillId,
        actionId,
      },
      2,
    );
    if (!event.silent) {
      this.registry?.onStatusApplied(
        id,
        stat,
        'enemy',
        sourceId,
        time,
        ctx,
        sourceSkillType,
        sourceSkillId,
        undefined,
        actionId,
      );
    }
  }

  // ─── Expire routing ─────────────────────────────────────────────────────────

  private processExpire(event: EnemyEffectExpireEvent, ctx: SimulationContext): void {
    const enemy = ctx.state.enemy;
    // Snapshot enemy state before any mutations so triggered stack-scaling and
    // readConsumedStacks both read pre-consume values (single unified mechanism).
    const preConsumeSnap = enemy.statusSnapshot();
    let status: string | undefined;
    let statusStat: EnemyStat | undefined;
    let consumedStacks = 1;
    let originActionId: string | undefined = event.actionId;

    switch (event.kind) {
      case 'infliction':
        if (enemy.infliction && enemy.infliction.element === event.element) {
          status = `${event.element}Infliction`;
          if (
            event.stacksToConsume !== undefined &&
            event.stacksToConsume < enemy.infliction.stacks
          ) {
            consumedStacks = event.stacksToConsume;
            enemy.infliction.stacks -= event.stacksToConsume;
            ctx.enemyLog(event);
            ctx.enemyLog({
              type: 'INFLICTION_APPLY',
              time: event.time,
              element: event.element,
              stacks: enemy.infliction.stacks,
              sourceId: event.sourceId ?? '',
              effectiveDuration: enemy.infliction.expiresAt - event.time,
            });
          } else {
            consumedStacks = enemy.infliction.stacks;
            enemy.infliction = null;
            ctx.enemyLog(event);
          }
        }
        break;
      case 'vulnerability':
        if (enemy.vulnerability) {
          consumedStacks = enemy.vulnerability.stacks;
          status = 'vulnerability';
          enemy.vulnerability = null;
          ctx.enemyLog(event);
        }
        break;
      case 'debuff': {
        const dt = event.debuffType;
        switch (dt) {
          case 'electrification':
            if (enemy.electrification) {
              status = dt;
              consumedStacks = enemy.electrification.level;
              enemy.electrification = null;
              ctx.queue.cancel(
                e =>
                  e.type === 'ENEMY_EFFECT_EXPIRE' &&
                  (e as EnemyEffectExpireEvent).kind === 'status' &&
                  (e as Extract<EnemyEffectExpireEvent, { kind: 'status' }>).id ===
                    'electrification:dmgTaken',
              );
              ctx.state.enemy.expireStatus('electrification:dmgTaken');
              ctx.enemyLog(event);
            }
            break;
          case 'corrosion':
            if (enemy.corrosion) {
              status = dt;
              consumedStacks = enemy.corrosion.level;
              enemy.corrosion = null;
              // Cancel pending corrosion tick chain and hidden status
              ctx.queue.cancel(e => e.type === 'CORROSION_TICK');
              ctx.state.enemy.expireStatus('corrosion:resShred');
              ctx.enemyLog(event);
            }
            break;
          case 'combustion':
            if (enemy.combustion) {
              status = dt;
              consumedStacks = enemy.combustion.level;
              enemy.combustion = null;
              // Cancel pending combustion DoT hits
              ctx.queue.cancel(
                e =>
                  e.type === 'DAMAGE_HIT' &&
                  ((e as HitEvent).payload.hitData as ResolvedHit)?.triggeredBy ===
                    'reaction:combustion_dot',
              );
              ctx.enemyLog(event);
            }
            break;
          case 'solidification':
            if (enemy.solidification) {
              status = dt;
              consumedStacks = enemy.solidification.level;
              enemy.solidification = null;
              ctx.enemyLog(event);
            }
            break;
          case 'breach':
            if (enemy.breach) {
              status = dt;
              consumedStacks = enemy.breach.level;
              enemy.breach = null;
              ctx.queue.cancel(
                e =>
                  e.type === 'ENEMY_EFFECT_EXPIRE' &&
                  (e as EnemyEffectExpireEvent).kind === 'status' &&
                  (e as Extract<EnemyEffectExpireEvent, { kind: 'status' }>).id ===
                    'breach:dmgTaken',
              );
              ctx.state.enemy.expireStatus('breach:dmgTaken');
              ctx.enemyLog(event);
            }
            break;
        }
        break;
      }
      case 'status': {
        if (!enemy.hasStatus(event.id)) break;
        const entry = enemy.enemyStatusEffects.get(event.id);
        statusStat = entry?.stat;
        status = event.id;
        originActionId = entry?.actionId ?? event.actionId;
        if (event.stacksToConsume !== undefined) {
          const result = enemy.consumeStatusStacks(event.id, event.stacksToConsume, event.time);
          if (!result) break;
          consumedStacks = event.stacksToConsume;
          ctx.enemyLog(event);
          if (result.remaining > 0) {
            ctx.enemyLog({
              type: 'ENEMY_STATUS_APPLY',
              time: event.time,
              id: event.id,
              stat: entry?.stat,
              value: entry?.value ?? 0,
              stacks: result.remaining,
              maxStacks: result.maxStacks,
              expiresAt: result.expiresAt,
              sourceId: result.sourceId,
              icon: result.icon,
              isContinuation: true,
            });
          } else {
            enemy.expireStatus(event.id);
          }
        } else {
          consumedStacks = enemy.getStatusStacks(event.id, event.time) || 1;
          // Cancel pending DoT ticks if this status tracks a DoT
          if (entry?.cancelHitKey) {
            ctx.queue.cancel(
              e => e.type === 'DOT_TICK' && e.payload.effectId === entry.cancelHitKey,
            );
          }
          enemy.expireStatus(event.id);
          ctx.enemyLog(event);
        }
        break;
      }
    }

    if (status !== undefined) {
      if (event.consumed) {
        this.registry?.onStatusConsumed(
          status,
          statusStat,
          'enemy',
          event.sourceId ?? '',
          event.time,
          ctx,
          consumedStacks,
          event.sourceSkillType,
          event.sourceSkillId,
          preConsumeSnap,
          undefined,
          originActionId,
        );
      } else {
        this.registry?.onStatusExpire(
          status,
          statusStat,
          'enemy',
          event.sourceId ?? '',
          event.time,
          ctx,
          consumedStacks,
          event.sourceSkillType,
          event.sourceSkillId,
          preConsumeSnap,
          undefined,
          originActionId,
        );
      }
    }
  }
}
