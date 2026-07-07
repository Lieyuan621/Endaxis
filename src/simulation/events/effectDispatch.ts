/**
 * Shared utilities for evaluating effect conditions and resolving stat values.
 * Used by both HitHandler and TriggerRegistry.
 */
import type {
  Attribute,
  Effect,
  EffectCondition,
  EnemyStat,
  EffectStat,
  EffectTarget,
  EffectTargetScope,
  StacksConstraint,
  StatusEffect,
  ResolvedEffect,
  ResolvedScalingDef,
  ResolvedConsumeEffect,
  ResolvedDamageOverTimeEffect,
  ResolvedDamageHitEffect,
  ResolvedSpGainEffect,
  ResolvedSpReturnEffect,
  ResolvedUltimateEnergyGainEffect,
  ResolvedOneTimeEffect,
} from '@/data/types';
import { isEnemyEffect } from '@/data/types';
import type {
  EnemyStatusEntry,
  EnemyStatusSnapshot,
  EnemyEffectApplyEvent,
  EnemyEffectExpireEvent,
} from '@/simulation/engine/types';
import type { SimulationContext } from '@/simulation/engine/SimulationContext';
import { resolveEffectDefaults, resolveEffectLifecycle } from '@/data/effectPresets';
import type { ActorStats } from '@/simulation/compiler/types';
import { computeScalingBasis } from '@/data/stats';
import { computeStats } from '@/data/stats/computeStats';
import { resolveStatAttributes } from '@/data/collect';
import { ATTR_MAP } from '@/data/stats/baseValues';
import type { ResolvedStatModifier, Attributes } from '@/data/stats/types';

/** Find an enemy status entry by base id, considering @instanceKey suffix from scheduleDotTicks. */
function findEnemyStatusByBaseId(
  map: ReadonlyMap<string, EnemyStatusEntry>,
  status: string,
  time: number,
): { key: string; entry: EnemyStatusEntry } | undefined {
  const exact = map.get(status);
  if (exact && time < exact.expiresAt) return { key: status, entry: exact };
  for (const [key, entry] of map) {
    if (!key) continue;
    if (time >= entry.expiresAt) continue;
    if (key.split('@')[0] === status) return { key, entry };
  }
  return undefined;
}

function getRuntimeEffectId(effect: Effect | ResolvedEffect): string {
  const raw = effect as { id?: string; _id?: string; name?: string; kind?: string };
  return raw.id ?? raw._id ?? raw.name ?? raw.kind ?? 'effect';
}

/** True if the condition (or any element of an array condition) has consume: true/number. */
export function conditionHasConsume(
  cond: EffectCondition | EffectCondition[] | undefined,
): boolean {
  if (!cond) return false;
  if (Array.isArray(cond)) return cond.some(c => conditionHasConsume(c));
  if (cond.kind === 'or') return cond.conditions.some(c => conditionHasConsume(c));
  return 'consume' in cond && !!(cond as any).consume;
}

export function checkStacks(stacks: number, constraint: StacksConstraint | undefined): boolean {
  if (!constraint) return true;
  switch (constraint.compare) {
    case 'exact':
      return stacks === constraint.count;
    case 'atLeast':
      return stacks >= constraint.count;
    case 'atMost':
      return stacks <= constraint.count;
  }
}

/**
 * Resolve enemy status from a snapshot.
 * `status` is either an EnemyStat descriptor (checks active stat effects by modifier)
 * or a named string (checks hardcoded infliction/reaction/vulnerability fields first,
 * then falls through to the dynamic enemyStatusEffects map).
 */
function getEnemyStatus(
  status: EnemyStat | string,
  snap: EnemyStatusSnapshot,
  time: number,
): { present: boolean; stacks: number } {
  // ── EnemyStat object: check by stat match ─────────────────────────────────
  if (typeof status === 'object') {
    const mod = status.modifier;
    const reqElements =
      'elements' in status && status.elements
        ? Array.isArray(status.elements)
          ? status.elements
          : [status.elements]
        : null;
    for (const [, entry] of snap.enemyStatusEffects) {
      if (time >= entry.expiresAt) continue;
      if (!entry.stat) continue;
      if (entry.stat.modifier !== mod) continue;
      if (reqElements) {
        const entryEls =
          'elements' in entry.stat && entry.stat.elements
            ? Array.isArray(entry.stat.elements)
              ? (entry.stat.elements as string[])
              : [entry.stat.elements as string]
            : [];
        if (!reqElements.some(el => entryEls.includes(el as string))) continue;
      }
      return { present: true, stacks: entry.stacks };
    }
    return { present: false, stacks: 0 };
  }

  // ── String: hardcoded infliction / reaction / vulnerability mappings ───────
  switch (status) {
    case 'cryoInfliction':
      return snap.infliction?.element === 'cryo'
        ? { present: true, stacks: snap.infliction.stacks }
        : { present: false, stacks: 0 };
    case 'electricInfliction':
      return snap.infliction?.element === 'electric'
        ? { present: true, stacks: snap.infliction.stacks }
        : { present: false, stacks: 0 };
    case 'natureInfliction':
      return snap.infliction?.element === 'nature'
        ? { present: true, stacks: snap.infliction.stacks }
        : { present: false, stacks: 0 };
    case 'heatInfliction':
      return snap.infliction?.element === 'heat'
        ? { present: true, stacks: snap.infliction.stacks }
        : { present: false, stacks: 0 };
    case 'vulnerability':
      return snap.vulnerability
        ? { present: true, stacks: snap.vulnerability.stacks }
        : { present: false, stacks: 0 };
    case 'solidification':
      return snap.solidification
        ? { present: true, stacks: snap.solidification.level }
        : { present: false, stacks: 0 };
    case 'electrification':
      return snap.electrification
        ? { present: true, stacks: snap.electrification.level }
        : { present: false, stacks: 0 };
    case 'corrosion':
      return snap.corrosion
        ? { present: true, stacks: snap.corrosion.level }
        : { present: false, stacks: 0 };
    case 'combustion':
      return snap.combustion
        ? { present: true, stacks: snap.combustion.level }
        : { present: false, stacks: 0 };
    case 'breach':
      return snap.breach
        ? { present: true, stacks: snap.breach.level }
        : { present: false, stacks: 0 };
    default: {
      const match = findEnemyStatusByBaseId(snap.enemyStatusEffects, status, time);
      if (!match) return { present: false, stacks: 0 };
      return { present: true, stacks: match.entry.stacks };
    }
  }
}

/**
 * Resolve active operator stacks for an EffectStat condition.
 * If stat is an object (EffectStat descriptor), matches any active entry whose stat matches.
 * If stat is a string, matches by id (id).
 */
function getOperatorStatusStacks(
  status: EffectStat | string,
  sourceTrackId: string,
  time: number,
  ctx: SimulationContext,
): number {
  if (typeof status === 'string') {
    return ctx.getOperatorEffects(sourceTrackId).getStacks(status, time);
  }
  // EffectStat descriptor — find any active entry with matching stat modifier
  const activeEntries = ctx.getOperatorEffects(sourceTrackId).getActiveEntries(time);
  for (const entry of activeEntries) {
    if (
      entry.stat &&
      (entry.stat as { modifier: string }).modifier === (status as { modifier: string }).modifier
    ) {
      return entry.stacks;
    }
  }
  return 0;
}

/** Evaluate an effect's `condition` field against live simulation state. Returns true if absent.
 *  Pass a pre-built `snap` to avoid redundant snapshot allocation (e.g. when already computed at hit-time). */
export function evaluateEffectCondition(
  cond: EffectCondition | EffectCondition[] | undefined,
  time: number,
  sourceTrackId: string,
  ctx: SimulationContext,
  snap?: EnemyStatusSnapshot,
  actionId?: string,
): boolean {
  if (!cond) return true;
  if (Array.isArray(cond)) {
    return cond.every(c => evaluateEffectCondition(c, time, sourceTrackId, ctx, snap, actionId));
  }
  if (cond.kind === 'or') {
    return cond.conditions.some(c =>
      evaluateEffectCondition(c, time, sourceTrackId, ctx, snap, actionId),
    );
  }
  if (cond.kind === 'enemyStatus') {
    const s = snap ?? ctx.state.enemy.statusSnapshot();
    const statuses = Array.isArray(cond.status) ? cond.status : [cond.status];
    return statuses.some(status => {
      const { present, stacks } = getEnemyStatus(status, s, time);
      if (!cond.stacks) return present;
      return checkStacks(stacks, cond.stacks);
    });
  }
  if (cond.kind === 'operatorStatus') {
    const statuses = Array.isArray(cond.status) ? cond.status : [cond.status];
    // 'controlled' reads the status from the operator controlled at this time; otherwise the source.
    const readTrackId =
      cond.target === 'controlled' ? ctx.getControlledOperatorAt(time) : sourceTrackId;
    return statuses.some(s => {
      if (cond.consumeScope === 'team') {
        const getStacks = (id: string) => getOperatorStatusStacks(s, id, time, ctx);
        if (!cond.stacks) return ctx.allTrackIds.some(id => getStacks(id) > 0);
        return ctx.allTrackIds.some(id => checkStacks(getStacks(id), cond.stacks));
      }
      if (!readTrackId) return false;
      const stacks = getOperatorStatusStacks(s, readTrackId, time, ctx);
      if (!cond.stacks) return stacks > 0;
      return checkStacks(stacks, cond.stacks);
    });
  }
  if (cond.kind === 'not') {
    return !evaluateEffectCondition(cond.condition, time, sourceTrackId, ctx, snap, actionId);
  }
  if (cond.kind === 'actionLinkConsumed') {
    if (!actionId) return false;
    return (ctx.getAction(actionId)?.consumedStacks?.link ?? 0) > 0;
  }
  if (cond.kind === 'enemyStaggered') {
    return ctx.state.enemy.isBroken(time);
  }
  // enemyHp, operatorHp — not yet implemented, default to permissive
  return true;
}

// ─── Condition consumption ───────────────────────────────────────────────────

/** Returns true if entryStat satisfies conditionStat — i.e. all fields specified in the condition are present with matching values on the entry. */
function enemyStatMatchesCondition(entryStat: EnemyStat, conditionStat: EnemyStat): boolean {
  if (entryStat.modifier !== conditionStat.modifier) return false;
  for (const key of Object.keys(conditionStat) as (keyof EnemyStat)[]) {
    if (key === 'modifier') continue;
    const cVal = (conditionStat as Record<string, unknown>)[key];
    const eVal = (entryStat as Record<string, unknown>)[key];
    if (cVal === undefined) continue;
    if (JSON.stringify(eVal) !== JSON.stringify(cVal)) return false;
  }
  return true;
}

/** Schedule a priority-3 consumption event for the status referenced by the condition. */
export function scheduleConsumption(
  condition: EffectCondition | EffectCondition[],
  time: number,
  sourceId: string,
  ctx: SimulationContext,
  skillType?: string,
  skillId?: string,
): void {
  if (Array.isArray(condition)) {
    for (const c of condition) scheduleConsumption(c, time, sourceId, ctx, skillType, skillId);
    return;
  }
  if (condition.kind === 'or') {
    for (const c of condition.conditions)
      scheduleConsumption(c, time, sourceId, ctx, skillType, skillId);
    return;
  }
  if (condition.kind === 'enemyStatus') {
    const statuses = Array.isArray(condition.status) ? condition.status : [condition.status];
    const DEBUFF_TYPES = [
      'electrification',
      'corrosion',
      'combustion',
      'solidification',
      'breach',
    ] as const;
    type DbT = (typeof DEBUFF_TYPES)[number];
    const stacksToConsume = typeof condition.consume === 'number' ? condition.consume : undefined;
    for (const status of statuses) {
      if (typeof status === 'object') {
        // EnemyStat descriptor — find matching entry in enemyStatusEffects
        const snap = ctx.state.enemy.statusSnapshot();
        let matchingKey: string | undefined;
        for (const [key, entry] of snap.enemyStatusEffects) {
          if (entry.stat && enemyStatMatchesCondition(entry.stat, status)) {
            matchingKey = key;
            break;
          }
        }
        if (matchingKey) {
          ctx.queue.enqueue(
            {
              type: 'ENEMY_EFFECT_EXPIRE',
              time,
              kind: 'status',
              id: matchingKey,
              consumed: true,
              sourceId,
              sourceSkillType: skillType,
              sourceSkillId: skillId,
              ...(stacksToConsume !== undefined && { stacksToConsume }),
            } as EnemyEffectExpireEvent,
            3,
          );
          break;
        }
        continue;
      }
      const snap = ctx.state.enemy;
      const INFLICTION_ELEMENT_BY_STATUS: Record<string, string> = {
        cryoInfliction: 'cryo',
        electricInfliction: 'electric',
        heatInfliction: 'heat',
        natureInfliction: 'nature',
      };
      const requestedInflictionElement = INFLICTION_ELEMENT_BY_STATUS[status];
      if (requestedInflictionElement !== undefined) {
        if (snap.infliction && snap.infliction.element === requestedInflictionElement) {
          const consumedElement = snap.infliction.element;
          ctx.queue.cancel(
            e =>
              e.type === 'ENEMY_EFFECT_EXPIRE' &&
              (e as EnemyEffectExpireEvent).kind === 'infliction' &&
              (e as Extract<EnemyEffectExpireEvent, { kind: 'infliction' }>).element ===
                consumedElement,
          );
          ctx.queue.enqueue(
            {
              type: 'ENEMY_EFFECT_EXPIRE',
              time,
              kind: 'infliction',
              element: consumedElement,
              consumed: true,
              sourceId,
              sourceSkillType: skillType,
              sourceSkillId: skillId,
              ...(stacksToConsume !== undefined && { stacksToConsume }),
            } as EnemyEffectExpireEvent,
            3,
          );
          break;
        }
      } else if (status === 'vulnerability') {
        if (snap.vulnerability) {
          ctx.queue.enqueue(
            {
              type: 'ENEMY_EFFECT_EXPIRE',
              time,
              kind: 'vulnerability',
              consumed: true,
              sourceId,
              sourceSkillType: skillType,
              sourceSkillId: skillId,
            } as EnemyEffectExpireEvent,
            3,
          );
          break;
        }
      } else if (DEBUFF_TYPES.includes(status as DbT)) {
        if (snap[status as DbT]) {
          ctx.queue.enqueue(
            {
              type: 'ENEMY_EFFECT_EXPIRE',
              time,
              kind: 'debuff',
              debuffType: status as DbT,
              consumed: true,
              sourceId,
              sourceSkillType: skillType,
              sourceSkillId: skillId,
            } as EnemyEffectExpireEvent,
            3,
          );
          break;
        }
      } else {
        // Dynamic enemy status — match by base id (considering @instanceKey suffix)
        const snap2 = ctx.state.enemy.statusSnapshot();
        const match = findEnemyStatusByBaseId(snap2.enemyStatusEffects, status, time);
        if (match) {
          ctx.queue.enqueue(
            {
              type: 'ENEMY_EFFECT_EXPIRE',
              time,
              kind: 'status',
              id: match.key,
              consumed: true,
              sourceId,
              sourceSkillType: skillType,
              sourceSkillId: skillId,
              ...(stacksToConsume !== undefined && { stacksToConsume }),
            } as EnemyEffectExpireEvent,
            3,
          );
          break;
        }
      }
    }
  } else if (condition.kind === 'operatorStatus') {
    const statuses = Array.isArray(condition.status) ? condition.status : [condition.status];
    const stacksToConsume = typeof condition.consume === 'number' ? condition.consume : undefined;
    // 'controlled' consumes from the operator controlled at this time; otherwise the source.
    const consumeFromId =
      condition.target === 'controlled' ? ctx.getControlledOperatorAt(time) : sourceId;
    for (const status of statuses) {
      // For consumption, resolve to id (string or by stat.modifier match)
      let id: string | undefined;
      if (typeof status === 'string') {
        id = status;
      } else if (status && 'modifier' in status) {
        const trackIds =
          condition.consumeScope === 'team'
            ? ctx.allTrackIds
            : consumeFromId
              ? [consumeFromId]
              : [];
        for (const trackId of trackIds) {
          const entries = ctx.getOperatorEffects(trackId).getActiveEntries(time);
          const match = entries.find(
            e =>
              e.stat &&
              (e.stat as { modifier: string }).modifier ===
                (status as { modifier: string }).modifier,
          );
          if (match) {
            id = match.id;
            break;
          }
        }
      }
      if (!id) continue;
      const trackIds =
        condition.consumeScope === 'team'
          ? ctx.allTrackIds
          : consumeFromId
            ? [consumeFromId]
            : [];
      const anyPresent = trackIds.some(
        trackId => ctx.getOperatorEffects(trackId).getStacks(id, time) > 0,
      );
      if (anyPresent) {
        for (const trackId of trackIds) {
          if (ctx.getOperatorEffects(trackId).getStacks(id, time) <= 0) continue;
          ctx.queue.enqueue(
            {
              type: 'OPERATOR_EFFECT_EXPIRE',
              time,
              targetTrackId: trackId,
              id,
              consumed: true,
              sourceSkillType: skillType,
              sourceSkillId: skillId,
              ...(stacksToConsume !== undefined && { stacksToConsume }),
            },
            3,
          );
        }
        break;
      }
    }
  }
}

/**
 * Resolve the final numeric value of a status effect at initial-effect time
 * (before the simulation engine is running). Evaluates constants and attribute-based
 * scaling only — stack-based terms are skipped since there is no live state.
 * Used only for unconditional passive effects at timeline startup.
 */
export function resolveEffectValueStatic(effect: StatusEffect, attrs?: ActorStats): number {
  let value = typeof effect.value === 'number' ? effect.value : 0;
  if (effect.scaling)
    value = applyResolvedScalingStatic(value, effect.scaling as ResolvedScalingDef, attrs);
  return value;
}

/**
 * Static (non-simulation) scaling resolution. Evaluates constants and attribute-based
 * terms only — stack-based and conditionalScaling terms are skipped.
 */
function applyResolvedScalingStatic(
  base: number,
  scaling: ResolvedScalingDef,
  attrs?: ActorStats,
): number {
  let additiveSum = 0;
  for (const term of scaling.additive ?? []) {
    if (typeof term === 'number') {
      additiveSum += term;
    } else if ('basis' in term && attrs) {
      additiveSum +=
        computeScalingBasis(term.basis as string | string[], attrs) * (term.coefficient as number);
    }
  }
  if (scaling.cap !== undefined) additiveSum = Math.min(additiveSum, scaling.cap);
  let value = base + additiveSum;
  for (const m of scaling.multiplier ?? []) {
    value *= m as number;
  }
  return value;
}

/**
 * Extract the EffectTargetScope from any effect that may carry a `target` field.
 * Handles both shorthand (`target: 'self'`) and object (`target: { scope: 'self' }`) forms.
 */
function getEffectTargetScope(effect: Effect | ResolvedEffect): EffectTargetScope | undefined {
  const raw = (effect as { target?: EffectTarget }).target;
  if (raw === undefined) return undefined;
  return typeof raw === 'string' ? raw : raw.scope;
}

/**
 * Extract the full EffectTarget from any effect type that may carry one.
 * Normalizes the shorthand string form to an object.
 */
export function getEffectTarget(
  effect: Effect | ResolvedEffect,
): { scope: EffectTargetScope; classes?: string[] } | undefined {
  const raw = (effect as { target?: EffectTarget }).target;
  if (raw === undefined) return undefined;
  return typeof raw === 'string' ? { scope: raw } : raw;
}

/**
 * Resolve effect target to concrete track IDs.
 *
 * @param effect      – the effect (target?.scope is read)
 * @param selfTrackId – the track that "owns" the effect (scope:'self' target)
 * @param allTrackIds – every track ID in the simulation
 * @param ownerTrackId – for triggered effects: the track that *sourced* the trigger
 *                       (scope:'owner' target). Falls back to selfTrackId when omitted.
 * @param elementByTrackId – optional map of trackId→element for teamExcludeSameElement scope
 */
export function resolveTargetTrackIds(
  effect: Effect | ResolvedEffect,
  selfTrackId: string,
  allTrackIds: readonly string[],
  ownerTrackId?: string,
  elementByTrackId?: ReadonlyMap<string, string | undefined>,
  controlledTrackId?: string | null,
): string[] {
  const scope = getEffectTargetScope(effect) ?? 'self';
  switch (scope) {
    case 'self':
      return [selfTrackId];
    case 'owner':
      return [ownerTrackId ?? selfTrackId];
    case 'controlled':
      return controlledTrackId ? [controlledTrackId] : [];
    case 'team':
      return allTrackIds as string[];
    case 'teamExcludeSelf':
      return allTrackIds.filter(id => id !== selfTrackId) as string[];
    case 'teamExcludeSameElement': {
      const selfElement = elementByTrackId?.get(selfTrackId);
      return allTrackIds.filter(
        id => id !== selfTrackId && elementByTrackId?.get(id) !== selfElement,
      ) as string[];
    }
    case 'enemy':
      return [];
    default:
      return [selfTrackId];
  }
}

// ─── Shared dispatch helpers ────────────────────────────────────────────────

/**
 * Apply a ResolvedScalingDef to a base value at simulation time.
 * Evaluates all additive terms (constants, attribute-based, stack-based),
 * post-multipliers, and cap.
 */
export function applyResolvedScaling(
  base: number,
  scaling: ResolvedScalingDef,
  sourceTrackId: string,
  time: number,
  ctx: SimulationContext,
  enemySnap?: EnemyStatusSnapshot,
  preConsumeOpStacks?: Map<string, number>,
): number {
  // Sum additive terms separately so cap applies to additive portion only
  let additiveSum = 0;
  let liveAttrs: Attributes | undefined;
  for (const term of scaling.additive ?? []) {
    if (typeof term === 'number') {
      additiveSum += term;
    } else if ('basis' in term) {
      if (liveAttrs === undefined) {
        const baseStats = ctx.getBaseStats(sourceTrackId);
        if (baseStats) {
          const activeEntries = ctx.getOperatorEffects(sourceTrackId).getActiveEntries(time);
          const dynamicMods: ResolvedStatModifier[] = [];
          for (const entry of activeEntries) {
            if (!entry.stat) continue;
            dynamicMods.push({
              stat: entry.stat,
              value: entry.value * entry.stacks,
              external: entry.external,
            });
          }
          liveAttrs = computeStats(baseStats, [], dynamicMods).attributes;
        } else {
          liveAttrs = { strength: 0, agility: 0, intellect: 0, will: 0 };
        }
      }
      additiveSum +=
        computeScalingBasis(term.basis as string | string[], liveAttrs) * term.coefficient;
    } else if ('key' in term) {
      const stackCount =
        term.target === 'enemy'
          ? ((enemySnap ? getEnemyStatus(term.key, enemySnap, time).stacks : 0) ?? 0)
          : (preConsumeOpStacks?.get(term.key) ??
            ctx.getOperatorEffects(sourceTrackId).getStacks(term.key, time));
      additiveSum += term.coefficient * stackCount;
    }
  }
  if (scaling.cap !== undefined) additiveSum = Math.min(additiveSum, scaling.cap);
  let value = base + additiveSum;
  for (const m of scaling.multiplier ?? []) {
    value *= m;
  }
  if (scaling.conditionalScaling !== undefined) {
    const { condition, scaling: condScaling } = scaling.conditionalScaling;
    if (evaluateEffectCondition(condition, time, sourceTrackId, ctx, enemySnap)) {
      value = applyResolvedScaling(
        value,
        condScaling,
        sourceTrackId,
        time,
        ctx,
        enemySnap,
        preConsumeOpStacks,
      );
    }
  }
  return value;
}

/**
 * Resolve the stacks count for a `fromConsume` effect by reading the current
 * status before it is consumed.  Returns 1 as a safe fallback.
 * Exported so HitHandler can use it for hit-level `status` effects.
 */
export function resolveConsumeTargetStacks(
  condition: EffectCondition | EffectCondition[] | undefined,
  sourceId: string,
  time: number,
  ctx: SimulationContext,
): number {
  if (Array.isArray(condition)) {
    return condition.reduce(
      (sum, c) =>
        sum + (conditionHasConsume(c) ? resolveConsumeTargetStacks(c, sourceId, time, ctx) : 0),
      0,
    );
  }
  if (condition?.kind === 'operatorStatus') {
    const statuses = Array.isArray(condition.status) ? condition.status : [condition.status];
    for (const s of statuses) {
      if (typeof s === 'string') {
        const n = ctx.getOperatorEffects(sourceId).getStacks(s, time);
        if (n > 0) return n;
      }
    }
  }
  if (condition?.kind === 'enemyStatus') {
    const snap = ctx.state.enemy.statusSnapshot();
    const statuses = Array.isArray(condition.status) ? condition.status : [condition.status];
    for (const s of statuses) {
      const { present, stacks } = getEnemyStatus(s, snap, time);
      if (present && stacks > 0) return stacks;
    }
  }
  return 1;
}

export function dispatchEnemyEffects(
  effects: readonly (Effect | ResolvedEffect)[] | undefined,
  time: number,
  sourceId: string,
  ctx: SimulationContext,
  skillType?: string,
  actionId?: string,
  consumedStacks?: number,
  enemySnap?: EnemyStatusSnapshot,
  skillId?: string,
): void {
  if (!effects) return;
  for (const effect of effects) {
    if (!isEnemyEffect(effect)) continue;
    const resolved = resolveEffectDefaults(effect);

    const cond = (resolved as { condition?: EffectCondition | EffectCondition[] }).condition;
    if (!evaluateEffectCondition(cond, time, sourceId, ctx, undefined, actionId)) continue;
    if (cond && conditionHasConsume(cond))
      scheduleConsumption(cond, time, sourceId, ctx, skillType, skillId);
    const lifecycle = resolveEffectLifecycle(resolved);
    switch (resolved.kind) {
      case 'infliction':
        ctx.queue.enqueue(
          {
            type: 'ENEMY_EFFECT_APPLY',
            kind: 'infliction',
            time,
            element: resolved.element,
            stacks:
              resolved.stacks === 'fromConsume'
                ? (consumedStacks ??
                  resolveConsumeTargetStacks(resolved.condition, sourceId, time, ctx))
                : lifecycle.stacks,
            sourceId,
            sourceSkillType: skillType,
            sourceSkillId: skillId,
            actionId,
            effectiveDuration: lifecycle.duration,
          } as EnemyEffectApplyEvent,
          0,
        );
        break;
      case 'physicalStatus':
        ctx.queue.enqueue(
          {
            type: 'ENEMY_EFFECT_APPLY',
            kind: 'physicalStatus',
            time,
            physicalType: resolved.physicalType,
            forced: resolved.forced,
            sourceId,
            sourceSkillType: skillType,
            sourceSkillId: skillId,
            actionId,
            effectiveDuration: lifecycle.duration,
            effectiveness: resolved.effectiveness,
          } as EnemyEffectApplyEvent,
          0,
        );
        break;
      case 'reaction':
        ctx.queue.enqueue(
          {
            type: 'ENEMY_EFFECT_APPLY',
            kind: 'reaction',
            time,
            reactionType: resolved.reactionType as any,
            level: resolved.defaultLevel ?? 1,
            sourceId,
            sourceSkillType: skillType,
            sourceSkillId: skillId,
            actionId,
            requiresInfliction: resolved.requiresInfliction,
            effectiveDuration: lifecycle.duration,
            effectiveness: resolved.effectiveness,
            forced: true,
          } as EnemyEffectApplyEvent,
          0,
        );
        break;
      case 'status': {
        let value = typeof resolved.value === 'number' ? resolved.value : 0;
        if (resolved.stat && resolved.scaling)
          value = applyResolvedScaling(
            value,
            resolved.scaling as ResolvedScalingDef,
            sourceId,
            time,
            ctx,
            enemySnap,
          );
        const { duration, stacks, maxStacks } = lifecycle;
        if (duration <= 0) break;
        const effectId = getRuntimeEffectId(resolved);
        ctx.queue.enqueue(
          {
            type: 'ENEMY_EFFECT_APPLY',
            kind: 'status',
            time,
            stat: resolved.stat,
            id: effectId,
            value,
            stacks,
            maxStacks,
            expiresAt: resolved.ignoreTimeShift
              ? time + duration
              : ctx.getShiftedTime(time, duration),
            sourceId,
            sourceSkillType: skillType,
            sourceSkillId: skillId,
            icon: resolved.icon,
            effect: resolved,
            ...(ctx.consumedStacksWriteKeys.has(effectId) && actionId
              ? { consumedStacks: ctx.getAction(actionId)?.consumedStacks }
              : {}),
            ...(resolved.silent ? { silent: true } : {}),
            ...(resolved.external ? { external: true } : {}),
          } as EnemyEffectApplyEvent,
          0,
        );
        break;
      }
    }
  }
}

/**
 * Dispatch a consume effect (schedule consumption of operator/enemy statuses).
 * Shared by HitHandler and TriggerRegistry.
 */
export function dispatchConsumeEffect(
  resolved: ResolvedConsumeEffect,
  time: number,
  sourceTrackId: string,
  ctx: SimulationContext,
  skillType?: string,
  skillId?: string,
): void {
  if (resolved.operatorStatus !== undefined) {
    scheduleConsumption(
      {
        kind: 'operatorStatus',
        status: resolved.operatorStatus,
        consume: resolved.consumeStacks ?? true,
        consumeScope: resolved.consumeScope,
      },
      time,
      sourceTrackId,
      ctx,
      skillType,
      skillId,
    );
  }
  if (resolved.enemyStatus !== undefined) {
    scheduleConsumption(
      {
        kind: 'enemyStatus',
        status: resolved.enemyStatus,
        consume: resolved.consumeStacks ?? true,
      },
      time,
      sourceTrackId,
      ctx,
      skillType,
      skillId,
    );
  }
}

// ─── DamageOverTime scheduling ──────────────────────────────────────────────

export function scheduleDotTicks(
  r: ResolvedDamageOverTimeEffect,
  time: number,
  sourceTrackId: string,
  ctx: SimulationContext,
  sourceSkillType?: string,
  sourceActionId?: string,
  sourceSkillId?: string,
): void {
  const duration = r.duration ?? 0;
  if (duration <= 0 || r.interval <= 0) return;

  // Shift base time by effect-level offset (delays entire schedule)
  const baseTime = r.offset ? ctx.getShiftedTime(time, r.offset) : time;

  const baseEffectId = getRuntimeEffectId(r as Effect);
  // When cancelOnRefresh=false, each application gets a unique key so they render on separate rows
  // and can be consumed/expired independently. When true, reuse the same key to replace.
  const instanceKey = sourceActionId ?? time;
  const effectId = r.cancelOnRefresh ? baseEffectId : `${baseEffectId}@${instanceKey}`;

  // Cancel previous ticks if configured
  if (r.cancelOnRefresh) {
    ctx.queue.cancel(e => e.type === 'DOT_TICK' && e.payload.effectId === effectId);
    // Also cancel the old status expire so the new one takes over
    ctx.queue.cancel(
      e =>
        e.type === 'ENEMY_EFFECT_EXPIRE' &&
        (e as any).kind === 'status' &&
        (e as any).id === effectId,
    );
  }

  // Resolve multiplier with scaling
  const finalMultiplier = r.multiplierScaling
    ? applyResolvedScaling(r.multiplier, r.multiplierScaling, sourceTrackId, time, ctx)
    : r.multiplier;

  // Compute tick count and per-tick multiplier
  const tickCount = r.skipFirstTick
    ? Math.floor(duration / r.interval)
    : Math.floor(duration / r.interval) + 1;

  const tickMultiplier =
    r.multiplierMode === 'split' && tickCount > 0 ? finalMultiplier / tickCount : finalMultiplier;

  // Inherit consumed stacks and stat effects from the source action (if any),
  // and merge in any effect-level consumedStatEffects baked into the DoT definition.
  const sourceAction = sourceActionId ? ctx.getAction(sourceActionId) : undefined;
  const consumedStacks = sourceAction?.consumedStacks;
  const actionConsumedStatEffects = sourceAction?.consumedStatEffects;
  const consumedStatEffects =
    r.consumedStatEffects || actionConsumedStatEffects
      ? [...(actionConsumedStatEffects ?? []), ...(r.consumedStatEffects ?? [])]
      : undefined;

  // Schedule DOT_TICK events
  for (let i = 0; i < tickCount; i++) {
    const offset = r.skipFirstTick ? (i + 1) * r.interval : i * r.interval;
    const tickTime = ctx.getShiftedTime(baseTime, offset);

    ctx.queue.enqueue(
      {
        type: 'DOT_TICK',
        time: tickTime,
        payload: {
          sourceId: sourceTrackId,
          effectId,
          element: r.element,
          multiplier: tickMultiplier,
          skillType: sourceSkillType,
          skillId: sourceSkillId,
          canCrit: r.canCrit,
          consumedStacks,
          consumedStatEffects,
        },
      },
      1,
    );
  }

  // Create a tracked enemy status so the DoT can be consumed/expired
  const expiresAt = r.ignoreTimeShift
    ? baseTime + duration
    : ctx.getShiftedTime(baseTime, duration);
  ctx.queue.enqueue(
    {
      type: 'ENEMY_EFFECT_APPLY',
      kind: 'status',
      time: baseTime,
      id: effectId,
      stat: undefined,
      value: 0,
      stacks: 1,
      maxStacks: 1,
      expiresAt,
      sourceId: sourceTrackId,
      icon: r.icon as string | undefined,
      effect: { kind: 'status', id: effectId, name: r.name, icon: r.icon, target: 'enemy' } as any,
      cancelHitKey: effectId,
      ...(ctx.consumedStacksWriteKeys.has(baseEffectId) && consumedStacks
        ? { consumedStacks }
        : {}),
    } as any,
    0,
  );

  // Schedule status expiry
  ctx.queue.enqueue(
    {
      type: 'ENEMY_EFFECT_EXPIRE',
      time: expiresAt,
      kind: 'status',
      id: effectId,
      consumed: false,
    } as any,
    2,
  );
}

// ─── Unified actor effect dispatch ──────────────────────────────────────────

export interface EffectDispatchContext {
  time: number;
  sourceTrackId: string;
  ctx: SimulationContext;
  enemySnap?: EnemyStatusSnapshot;
  /** Action-type tag (e.g. 'comboSkill') — scopes effect skillTypes filters. */
  skillType?: string;
  /** Specific skillId (e.g. 'alesh-enhanced-combo') — scopes effect skillId filters. */
  skillId?: string;
  actionId?: string;
  /** Track that triggered the event; for target resolution 'self' scope.
   *  Defaults to sourceTrackId. Only differs for global-scope triggers. */
  selfTrackId?: string;
  /** Track that owns the trigger; for target resolution 'owner' scope.
   *  Defaults to sourceTrackId. Not needed by hit callers. */
  ownerTrackId?: string;
  /** Passthrough string for SP_CHANGE reason field. Defaults to 'hit'. */
  spReason?: string;
  /** For 'fromConsume' stacks: pre-resolved count. Falls back to live read when absent. */
  consumedStacks?: number;
  /** Pre-consume operator stacks snapshot (for scaling after stacks already decremented). */
  preConsumeOpStacks?: Map<string, number>;
  /** Duration override for duringAction triggers. */
  durationOverride?: number;
  /** Forward into OPERATOR_EFFECT_APPLY for duringAction runtime extension. */
  statusActionId?: string;
  /** Override triggeredBy on DAMAGE_HIT. Defaults to resolved.name ?? resolved.id. */
  triggeredByOverride?: string;
  /** Pre-resolved consumedStacks for damageHit readConsumedStacks (trigger-only). */
  hitConsumedStacks?: Record<string, number>;
  /** CD reduction callback (requires TriggerRegistry). */
  applyCooldownReduction?: (
    effect: any,
    time: number,
    targetTrackId: string,
    ctx: SimulationContext,
  ) => void;
  /** Callback for zero-duration status heals (fires onStatusApplied signal). */
  onInstantHeal?: (
    id: string,
    stat: any,
    sourceTrackId: string,
    time: number,
    skillType?: string,
  ) => void;
}

/**
 * Dispatch a single resolved non-enemy, non-consume actor effect.
 * Shared by HitHandler and TriggerRegistry — all effect-kind logic lives here.
 *
 * `resolved` accepts `Effect | ResolvedEffect` because CooldownReductionEffect
 * is part of Effect but has no corresponding ResolvedEffect variant.
 */
export function dispatchSingleActorEffect(
  _effect: Effect,
  resolved: Effect | ResolvedEffect,
  dc: EffectDispatchContext,
): void {
  const { time, sourceTrackId, ctx, skillType, skillId, actionId, preConsumeOpStacks } = dc;
  const enemySnap = dc.enemySnap ?? ctx.state.enemy.statusSnapshot();
  const selfTrackId = dc.selfTrackId ?? sourceTrackId;
  const ownerTrackId = dc.ownerTrackId ?? sourceTrackId;
  const controlledTrackId = ctx.getControlledOperatorAt?.(time) ?? null;

  // ── cooldownReduction ──────────────────────────────────────────────────
  if (resolved.kind === 'cooldownReductionFlat' || resolved.kind === 'cooldownReductionPercent') {
    const targets = resolveTargetTrackIds(
      resolved,
      selfTrackId,
      ctx.allTrackIds,
      ownerTrackId,
      ctx.elementByTrackId,
      controlledTrackId,
    );
    for (const targetId of targets) {
      dc.applyCooldownReduction?.(resolved as any, time, targetId, ctx);
    }
    return;
  }

  // ── oneTime ────────────────────────────────────────────────────────────
  if (resolved.kind === 'oneTime') {
    const r = resolved as ResolvedOneTimeEffect;
    const effectId = getRuntimeEffectId(resolved);
    const { stacks, maxStacks } = resolveEffectLifecycle(resolved);
    let value = typeof r.value === 'number' ? r.value : 0;
    if (r.stat && (r as any).scaling)
      value = applyResolvedScaling(
        value,
        (r as any).scaling,
        sourceTrackId,
        time,
        ctx,
        enemySnap,
        preConsumeOpStacks,
      );
    const targets = resolveTargetTrackIds(
      resolved,
      selfTrackId,
      ctx.allTrackIds,
      ownerTrackId,
      ctx.elementByTrackId,
      controlledTrackId,
    );
    const oneTimeDuration = resolveEffectLifecycle(resolved).duration;
    const expiresAt =
      oneTimeDuration > 0
        ? resolved.ignoreTimeShift
          ? time + oneTimeDuration
          : ctx.getShiftedTime(time, oneTimeDuration)
        : Infinity;
    for (const targetId of targets) {
      const cumulativeStacks = ctx.getOperatorEffects(targetId).applyOneTime({
        id: effectId,
        stat: r.stat,
        value,
        stacks,
        maxStacks,
        skillTypes: r.skillTypes,
        skillId: r.skillId,
        expiresAt,
        sourceId: sourceTrackId,
        effect: resolved,
      });
      ctx.operatorLog({
        type: 'OPERATOR_EFFECT_APPLY',
        time,
        targetTrackId: targetId,
        id: effectId,
        stat: r.stat,
        value,
        stacks,
        maxStacks,
        expiresAt,
        sourceId: sourceTrackId,
        effect: resolved,
        cumulativeStacks,
      });
    }
    return;
  }

  // ── damageHit ──────────────────────────────────────────────────────────
  if (resolved.kind === 'damageHit') {
    const r = resolved as ResolvedDamageHitEffect;
    const effectId = getRuntimeEffectId(resolved);
    let finalMultiplier = r.multiplierScaling
      ? applyResolvedScaling(
          r.multiplier,
          r.multiplierScaling,
          sourceTrackId,
          time,
          ctx,
          enemySnap,
          preConsumeOpStacks,
        )
      : r.multiplier;

    // Scale multiplier by operator's live crit rate at dispatch time
    let critRateScale: number | undefined;
    if (r.scaleByCrit) {
      const baseStats = ctx.getBaseStats(sourceTrackId);
      if (baseStats) {
        const activeEntries = ctx.getOperatorEffects(sourceTrackId).getActiveEntries(time);
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
        critRateScale = operatorStatus.critRate;
        finalMultiplier *= critRateScale;
      }
    }

    const finalStagger = r.staggerScaling
      ? applyResolvedScaling(
          r.hit?.stagger ?? 0,
          r.staggerScaling,
          sourceTrackId,
          time,
          ctx,
          enemySnap,
          preConsumeOpStacks,
        )
      : (r.hit?.stagger ?? 0);
    const parentAction = actionId ? ctx.getAction(actionId) : undefined;
    const hitTime = r.offset ? ctx.getShiftedTime(time, r.offset) : time;
    ctx.queue.enqueue(
      {
        type: 'DAMAGE_HIT',
        time: hitTime,
        payload: {
          targetId: 'enemy',
          sourceId: sourceTrackId,
          stagger: finalStagger,
          hitData: {
            offset: 0,
            element: r.element,
            multiplier: finalMultiplier,
            spRecovery: r.hit?.spRecovery ?? 0,
            spReturn: r.hit?.spReturn ?? 0,
            stagger: finalStagger,
            effects: r.hit?.effects,
            realTime: time,
            realOffset: 0,
            time: hitTime,
            triggered: true,
            triggeredBy: dc.triggeredByOverride ?? resolved.name ?? effectId,
            skillType,
            consumedStacks: dc.hitConsumedStacks ?? parentAction?.consumedStacks,
            consumedStatEffects: parentAction?.consumedStatEffects,
            ...(critRateScale !== undefined && { _critRateScale: critRateScale }),
          },
          actionId: actionId ?? `triggered:${effectId}`,
        },
      },
      1,
    );
    return;
  }

  // ── damageOverTime ─────────────────────────────────────────────────────
  if (resolved.kind === 'damageOverTime') {
    scheduleDotTicks(
      resolved as ResolvedDamageOverTimeEffect,
      time,
      sourceTrackId,
      ctx,
      skillType,
      actionId,
      skillId,
    );
    return;
  }

  // ── spRecovery / spReturn ──────────────────────────────────────────────
  if (resolved.kind === 'spRecovery' || resolved.kind === 'spReturn') {
    const effectId = getRuntimeEffectId(resolved);
    const targets = resolveTargetTrackIds(
      resolved,
      selfTrackId,
      ctx.allTrackIds,
      ownerTrackId,
      ctx.elementByTrackId,
      controlledTrackId,
    );
    const spEff = resolved as ResolvedSpGainEffect | ResolvedSpReturnEffect;
    const gain = spEff.scaling
      ? applyResolvedScaling(
          spEff.value,
          spEff.scaling,
          sourceTrackId,
          time,
          ctx,
          enemySnap,
          preConsumeOpStacks,
        )
      : spEff.value;
    if (gain > 0) {
      for (const targetId of targets) {
        ctx.queue.enqueue({
          type: 'SP_CHANGE',
          time,
          payload: {
            actorId: targetId,
            spChange: gain,
            reason: dc.spReason ?? 'hit',
            sourceId: actionId ?? effectId,
            parent: null as any,
            spType: resolved.kind === 'spReturn' ? 'return' : 'recovery',
            skillType: dc.skillType,
            skillId: dc.skillId,
          },
        });
      }
    }
    return;
  }

  // ── ultEnergyGain ──────────────────────────────────────────────────────
  if (resolved.kind === 'ultEnergyGain') {
    const effectId = getRuntimeEffectId(resolved);
    const targets = resolveTargetTrackIds(
      resolved,
      selfTrackId,
      ctx.allTrackIds,
      ownerTrackId,
      ctx.elementByTrackId,
      controlledTrackId,
    );
    const ue = resolved as ResolvedUltimateEnergyGainEffect;
    const gain = ue.scaling
      ? applyResolvedScaling(
          ue.value,
          ue.scaling,
          sourceTrackId,
          time,
          ctx,
          enemySnap,
          preConsumeOpStacks,
        )
      : ue.value;
    if (gain > 0) {
      for (const targetId of targets) {
        ctx.queue.enqueue({
          type: 'ULT_ENERGY_CHANGE',
          time,
          payload: {
            actorId: targetId,
            change: gain,
            sourceId: effectId,
          },
        });
      }
    }
    return;
  }

  // ── status ─────────────────────────────────────────────────────────────
  if (resolved.kind === 'status') {
    const targets = resolveTargetTrackIds(
      resolved,
      selfTrackId,
      ctx.allTrackIds,
      ownerTrackId,
      ctx.elementByTrackId,
      controlledTrackId,
    );
    const lifecycle = resolveEffectLifecycle(resolved);
    const duration =
      dc.durationOverride !== undefined
        ? dc.durationOverride + (resolved.durationExtension ?? 0)
        : lifecycle.duration;

    if (duration <= 0) {
      if (resolved.stat?.modifier === 'heal' && !resolved.silent) {
        dc.onInstantHeal?.(getRuntimeEffectId(resolved), resolved.stat, sourceTrackId, time, skillType);
      }
      return;
    }

    const effectId = getRuntimeEffectId(resolved);
    const { stacks: baseStacks, maxStacks } = lifecycle;
    const stacks =
      resolved.stacks === 'fromConsume'
        ? (dc.consumedStacks ??
          resolveConsumeTargetStacks(resolved.condition, sourceTrackId, time, ctx))
        : baseStacks;

    let value = typeof resolved.value === 'number' ? resolved.value : 0;
    if (resolved.stat && resolved.scaling)
      value = applyResolvedScaling(
        value,
        resolved.scaling as ResolvedScalingDef,
        sourceTrackId,
        time,
        ctx,
        enemySnap,
        preConsumeOpStacks,
      );

    for (const targetId of targets) {
      // Resolve 'main'/'sub' attribute placeholders against the *target* operator (team-scoped
      // effects spread to multiple operators with differing main/sub attributes).
      const targetBase = ctx.getBaseStats(targetId);
      const targetStat = resolveStatAttributes(
        resolved.stat,
        targetBase ? (ATTR_MAP[targetBase.mainAttributeName] as Attribute) : undefined,
        targetBase ? (ATTR_MAP[targetBase.secondaryAttributeName] as Attribute) : undefined,
      );
      ctx.queue.enqueue(
        {
          type: 'OPERATOR_EFFECT_APPLY',
          time,
          targetTrackId: targetId,
          id: effectId,
          stat: targetStat,
          value,
          stacks,
          maxStacks,
          expiresAt: resolved.ignoreTimeShift
            ? time + duration
            : ctx.getShiftedTime(time, duration),
          sourceId: sourceTrackId,
          effect: resolved,
          sourceSkillType: skillType,
          sourceSkillId: skillId,
          stackStrategy: lifecycle.stackStrategy,
          actionId: dc.statusActionId,
          ...(ctx.consumedStacksWriteKeys.has(effectId) && actionId
            ? { consumedStacks: ctx.getAction(actionId)?.consumedStacks }
            : {}),
          ...(resolved.silent ? { silent: true } : {}),
          ...(resolved.external ? { external: true } : {}),
        },
        0,
      );

      // If this status carries a CD reduction modifier, also shrink any active cooldown bars.
      const mod = resolved.stat?.modifier;
      if (
        (mod === 'cooldownReductionFlat' || mod === 'cooldownReductionPercent') &&
        dc.applyCooldownReduction
      ) {
        dc.applyCooldownReduction(
          {
            kind: mod,
            value,
            skillTypes: (resolved.stat as any).skillTypes,
            skillId: (resolved.stat as any).skillId,
          },
          time,
          targetId,
          ctx,
        );
      }
    }
  }
}

/**
 * Dispatch all actor (non-enemy) effects from an effect list.
 * Evaluates conditions, schedules consumption, handles consume effects,
 * and delegates the rest to dispatchSingleActorEffect.
 */
export function dispatchActorEffects(
  effects: ReadonlyArray<Effect> | undefined,
  dc: EffectDispatchContext,
): void {
  if (!effects) return;
  for (const effect of effects) {
    if (isEnemyEffect(effect)) continue;
    const resolved = resolveEffectDefaults(effect);

    const cond = (resolved as { condition?: EffectCondition | EffectCondition[] }).condition;
    if (!evaluateEffectCondition(cond, dc.time, dc.sourceTrackId, dc.ctx, undefined, dc.actionId))
      continue;
    if (cond && conditionHasConsume(cond))
      scheduleConsumption(cond, dc.time, dc.sourceTrackId, dc.ctx, dc.skillType, dc.skillId);

    if (resolved.kind === 'consume') {
      dispatchConsumeEffect(
        resolved as ResolvedConsumeEffect,
        dc.time,
        dc.sourceTrackId,
        dc.ctx,
        dc.skillType,
        dc.skillId,
      );
      continue;
    }

    dispatchSingleActorEffect(effect, resolved, dc);
  }
}
