// @ts-nocheck
import type { OperatorStatus, ComputedEnemyStatus } from '../types';
import type { TeamInstance, OperatorInstance, WeaponInstance, GearInstance } from '../types';
import type { StatusEffect, ResolvedStatusEffect, operatorClass } from './types';
import { isStatusEffect } from './types';
import type { CollectedEffect } from './collect';
import { collectEffects, resolveStatAttributes } from './collect';
import { getOperator } from './index';
import type { SheetStatEffect } from './stats/types';
import { getBaseStatValues } from './stats/baseValues';
import { computeStats } from './stats/computeStats';
import { computeEnemyStats } from './stats/computeEnemyStats';

// Re-export for backward compatibility (used by effectDispatch.ts)

// ─── Conditions ─────────────────────────────────────────────────────────────

interface ReactionDebuffConfig {
  active: boolean;
  level: number; // 1–4
  triggeringOperatorSlot: number; // team slot index of triggering operator
  corrosionTime: number; // elapsed seconds (only used for corrosion)
}

interface EnemyStatusState {
  /** Boolean toggles for statuses without stacks: staggered, slowed, reactions, specials */
  toggles: Record<string, boolean>;
  /** Stack counts for statuses with stacks: vulnerability, inflictions (0 = off) */
  stacks: Record<string, number>;
  /** Enemy HP thresholds checked by user (e.g. { 'below:50': true }) */
  hpThresholds: Record<string, boolean>;
  /** Reaction debuff configs for Electrification, Breach, Corrosion */
  reactionDebuffs: {
    electrification: ReactionDebuffConfig;
    corrosion: ReactionDebuffConfig;
    breach: ReactionDebuffConfig;
  };
}

interface OperatorStatusState {
  /** Per-operator state toggles: `${slotIndex}::${state}` → enabled */
  stateToggles: Record<string, boolean>;
  /** Per-operator HP thresholds: `${slotIndex}::${compare}:${percent}` → checked */
  hpThresholds: Record<string, boolean>;
}

interface TeamConditions {
  /** Enemy status toggles and stacks */
  enemyStatusState: EnemyStatusState;
  /** Operator state toggles and HP thresholds */
  operatorStatusState: OperatorStatusState;
}

interface TeamStatusResult {
  operatorStatuses: (OperatorStatus | null)[];
  enemyStatus: ComputedEnemyStatus;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert a collected status effect to a SheetStatEffect for computeStats. */
function toSheetEffect(ce: CollectedEffect & { effect: StatusEffect }): SheetStatEffect | null {
  if (!ce.effect.stat) return null;
  const resolved = ce.effect as unknown as ResolvedStatusEffect;
  return {
    stat: resolved.stat!,
    value: resolved.value,
    scaling: resolved.scaling,
    id: resolved.id,
    external: resolved.external,
  };
}

/** Convert collected status effects to SheetStatEffect[], filtering out those without stat. */
function toSheetEffects(
  effects: (CollectedEffect & { effect: StatusEffect })[],
): SheetStatEffect[] {
  const result: SheetStatEffect[] = [];
  for (const ce of effects) {
    const se = toSheetEffect(ce);
    if (se) result.push(se);
  }
  return result;
}

// ─── Main entry point ───────────────────────────────────────────────────────

/**
 * Compute full team status: OperatorStatus for each slot + enemy status.
 * This is the single entry point for all stat computation.
 */
export function getTeamStatus(
  team: TeamInstance,
  operatorInstances: OperatorInstance[],
  weaponInstances: WeaponInstance[],
  gearInstances: GearInstance[],
  conditions: TeamConditions,
  targetSlotIndex?: number,
  targetSkillType?: string,
  targetSkillId?: string,
  extraEffects: CollectedEffect[] = [],
): TeamStatusResult {
  // 1. Collect all effects (including implicit weapon/gear effects), plus any externally-supplied
  //    effects (e.g. Contingency Contract criteria) that aren't part of the operator/weapon/gear sheets.
  const allEffects = [
    ...collectEffects(team, operatorInstances, weaponInstances, gearInstances),
    ...extraEffects,
  ];

  // 2. Filter by conditions, then narrow to stat effects
  const active = filterByConditions(allEffects, conditions).filter(
    (ce): ce is CollectedEffect & { effect: StatusEffect } => isStatusEffect(ce.effect),
  );

  // 3. Partition by target
  const { slotEffects, enemyEffects } = partitionByTarget(active, team, operatorInstances);

  // 4. Resolve each slot's OperatorStatus
  const operatorStatuses = team.slots.map((slot, slotIndex) => {
    if (!slot.operatorId) return null;
    const opInst = operatorInstances.find(o => o.id === slot.operatorId);
    if (!opInst) return null;
    const wInst = slot.weaponId ? weaponInstances.find(w => w.id === slot.weaponId) : undefined;
    const isTarget = slotIndex === targetSlotIndex;
    const type = isTarget ? targetSkillType : undefined;
    const skillId = isTarget ? targetSkillId : undefined;

    const base = getBaseStatValues(opInst, wInst);
    return computeStats(base, toSheetEffects(slotEffects[slotIndex]), [], type, skillId);
  });

  // 4b. Resolve enemy status
  const enemyStatus = computeEnemyStats(toSheetEffects(enemyEffects), []);

  return { operatorStatuses, enemyStatus };
}

/**
 * Batch-compute team status for multiple targetSkillId values in a single pass.
 *
 * Shares the expensive collectEffects → filterByConditions → partition steps
 * across all requested skill IDs, then calls computeStats once per ID.
 * Use this instead of calling getTeamStatus N times when you need per-skill-type
 * SP recovery data for a single operator.
 */
export function getTeamStatusBatch(
  team: TeamInstance,
  operatorInstances: OperatorInstance[],
  weaponInstances: WeaponInstance[],
  gearInstances: GearInstance[],
  conditions: TeamConditions,
  targetSlotIndex: number,
  targetSkills: Array<{ type: string; skillId: string }>,
  extraEffects: CollectedEffect[] = [],
): Map<string, TeamStatusResult> {
  // Steps 1–3: shared across all skill IDs
  const allEffects = [
    ...collectEffects(team, operatorInstances, weaponInstances, gearInstances),
    ...extraEffects,
  ];
  const active = filterByConditions(allEffects, conditions).filter(
    (ce): ce is CollectedEffect & { effect: StatusEffect } => isStatusEffect(ce.effect),
  );

  const { slotEffects, enemyEffects } = partitionByTarget(active, team, operatorInstances);

  const enemyStatus = computeEnemyStats(toSheetEffects(enemyEffects), []);

  // Pre-convert sheet effects per slot (shared across skill IDs)
  const slotSheetEffects = slotEffects.map(effects => toSheetEffects(effects));

  // Step 4: one computeStats call per (type, skillId) pair. Results keyed by skillId.
  const results = new Map<string, TeamStatusResult>();
  for (const { type, skillId } of targetSkills) {
    const operatorStatuses = team.slots.map((slot, slotIndex) => {
      if (!slot.operatorId) return null;
      const opInst = operatorInstances.find(o => o.id === slot.operatorId);
      if (!opInst) return null;
      const wInst = slot.weaponId ? weaponInstances.find(w => w.id === slot.weaponId) : undefined;
      const isTarget = slotIndex === targetSlotIndex;
      const t = isTarget ? type : undefined;
      const sid = isTarget ? skillId : undefined;

      const base = getBaseStatValues(opInst, wInst);
      return computeStats(base, slotSheetEffects[slotIndex], [], t, sid);
    });
    results.set(skillId, { operatorStatuses, enemyStatus });
  }

  return results;
}

// ─── Target partitioning ───────────────────────────────────────────────────

type StatusCollectedEffect = CollectedEffect & { effect: StatusEffect };

function partitionByTarget(
  active: StatusCollectedEffect[],
  team: TeamInstance,
  operatorInstances: OperatorInstance[],
): { slotEffects: StatusCollectedEffect[][]; enemyEffects: StatusCollectedEffect[] } {
  const slotClasses: (operatorClass | null)[] = team.slots.map(slot => {
    if (!slot.operatorId) return null;
    const opInst = operatorInstances.find(o => o.id === slot.operatorId);
    if (!opInst) return null;
    return getOperator(opInst.operatorSlug)?.class ?? null;
  });
  const slotElements: (string | null)[] = team.slots.map(slot => {
    if (!slot.operatorId) return null;
    const opInst = operatorInstances.find(o => o.id === slot.operatorId);
    if (!opInst) return null;
    return getOperator(opInst.operatorSlug)?.element ?? null;
  });
  // Per-slot operators, used to resolve 'main'/'sub' attribute placeholders on team-scoped effects
  // against each *target* operator (not the source). Self-scoped placeholders were already
  // resolved against the source operator at collection time.
  const slotOperators = team.slots.map(slot => {
    if (!slot.operatorId) return null;
    const opInst = operatorInstances.find(o => o.id === slot.operatorId);
    if (!opInst) return null;
    return getOperator(opInst.operatorSlug) ?? null;
  });

  /** Resolve a team effect's 'main'/'sub' placeholder against target slot `i`. */
  const resolveForSlot = (ce: StatusCollectedEffect, i: number): StatusCollectedEffect => {
    const op = slotOperators[i];
    if (!op) return ce;
    const resolvedStat = resolveStatAttributes(ce.effect.stat, op.mainAttribute, op.subAttribute);
    if (resolvedStat === ce.effect.stat) return ce;
    return { ...ce, effect: { ...ce.effect, stat: resolvedStat } };
  };

  const slotEffects: StatusCollectedEffect[][] = [[], [], [], []];
  const enemyEffects: StatusCollectedEffect[] = [];

  for (const ce of active) {
    const rawTarget = ce.effect.target;
    const scope = typeof rawTarget === 'string' ? rawTarget : (rawTarget?.scope ?? 'self');
    if (scope === 'team' || scope === 'teamExcludeSelf' || scope === 'teamExcludeSameElement') {
      const classes = typeof rawTarget === 'object' ? rawTarget?.classes : undefined;
      const sourceElement = slotElements[ce.sourceSlotIndex];
      for (let i = 0; i < 4; i++) {
        if (scope === 'teamExcludeSelf' && i === ce.sourceSlotIndex) continue;
        if (scope === 'teamExcludeSameElement' && slotElements[i] === sourceElement) continue;
        if (classes) {
          const cls = slotClasses[i];
          if (!cls || !classes.includes(cls)) continue;
        }
        slotEffects[i].push(resolveForSlot(ce, i));
      }
    } else {
      // 'self' (default) — only to source slot
      slotEffects[ce.sourceSlotIndex]?.push(ce);
    }
  }

  return { slotEffects, enemyEffects };
}

// ─── Condition filtering ────────────────────────────────────────────────────

function filterByConditions(
  effects: CollectedEffect[],
  conditions: TeamConditions,
): CollectedEffect[] {
  return effects.filter(({ effect, sourceSlotIndex }) => {
    // Always-on: no conditional → always included
    if (!effect.condition) return true;

    // Conditional effects: auto-resolve from state
    const cond = effect.condition;
    if (Array.isArray(cond)) return true; // array conditions: permissive in static team-status
    switch (cond.kind) {
      case 'enemyStatus':
        // Debuff reactions: check reactionDebuffs state
        if (
          cond.status === 'electrification' ||
          cond.status === 'breach' ||
          cond.status === 'corrosion'
        ) {
          return conditions.enemyStatusState.reactionDebuffs[
            cond.status as 'electrification' | 'breach' | 'corrosion'
          ].active;
        }
        // Auto-resolve: check if the enemy status is toggled on or has stacks > 0
        {
          const statusKey = statusToKey(cond.status);
          return (
            conditions.enemyStatusState.toggles[statusKey] === true ||
            (conditions.enemyStatusState.stacks[statusKey] ?? 0) > 0
          );
        }
      case 'enemyHp': {
        const key = `${cond.compare}:${cond.percent}`;
        return conditions.enemyStatusState.hpThresholds[key] === true;
      }
      case 'operatorStatus': {
        const key = `${sourceSlotIndex}::${statusToKey(cond.status)}`;
        return conditions.operatorStatusState.stateToggles[key] === true;
      }
      case 'operatorHp': {
        const key = `${sourceSlotIndex}::${cond.compare}:${cond.percent}`;
        return conditions.operatorStatusState.hpThresholds[key] === true;
      }
    }

    return true;
  });
}

/** Serialize a condition status (string or EffectStat object) into a stable key. */
export function statusToKey(status: unknown): string {
  if (typeof status === 'string') return status;
  if (status && typeof status === 'object' && 'modifier' in status) {
    return `stat:${(status as { modifier: string }).modifier}`;
  }
  return String(status);
}
