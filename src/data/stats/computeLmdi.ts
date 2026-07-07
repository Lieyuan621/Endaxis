// @ts-nocheck
/**
 * LMDI (Logarithmic Mean Divisia Index) decomposition for damage contribution.
 *
 * For each hit, decomposes actual damage into:
 *   - self: damage attributable to the hitting operator's own stats + self-buffs
 *   - external: damage attributable to each external buff source
 *
 * The decomposition is exact — self + sum(external) = actualDamage.
 */

import type { ResolvedStatModifier, BaseStatValues } from './types';
import type { DamageBreakdown } from './computeDamage';
import type { ComputedEnemyStatus } from '@/types';
import type { ConsumedStatEffect } from '@/simulation/compiler/types';
import { computeStats } from './computeStats';
import { computeEnemyStats } from './computeEnemyStats';
import {
  filterDamageModifiers,
  computeExpectedDamageWithBreakdown,
  applyConsumedStatEffects,
} from './computeDamage';
import { computeArtsIntensityDamageMult } from './computeReactionDamage';

export interface SourceTaggedMod {
  sourceId: string;
  mod: ResolvedStatModifier;
}

interface LmdiResult {
  /** Damage attributable to the hitting operator's own stats + self-buffs. */
  self: number;
  /** Damage attributed to external buff sources. sourceId → damage value. */
  external: Record<string, number>;
}

interface LmdiParams {
  baseStats: BaseStatValues;
  selfOperatorMods: ResolvedStatModifier[];
  externalOperatorMods: SourceTaggedMod[];
  selfEnemyMods: ResolvedStatModifier[];
  externalEnemyMods: SourceTaggedMod[];
  hit: {
    multiplier: number;
    skillType?: string;
    skillId?: string;
    consumedStacks?: Record<string, number>;
    consumedStatEffects?: ConsumedStatEffect[];
  };
  linkStacks: number;
  linkSources: Record<string, number> | undefined;
  hittingTrackId: string;
  element: string | undefined;
  enemyDef: number;
  enemyResistance?: number;
  actualBreakdown: DamageBreakdown;
  staggerMult: number;
  staggerSources: Record<string, number> | undefined;
  finisherMult: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function logarithmicMean(a: number, b: number): number {
  if (a <= 0 || b <= 0) return 0;
  if (Math.abs(a - b) < 1e-9) return a;
  return (a - b) / Math.log(a / b);
}

/**
 * For a factor that's a sum of contributions (e.g. dmgBonus = sum of mod values),
 * compute how much of the total external Δ should be attributed to each source,
 * proportional to each source's additive contribution.
 */
function attributeProportionally(
  delta: number,
  externalBySource: Record<string, number>,
): Record<string, number> {
  const total = Object.values(externalBySource).reduce((s, v) => s + Math.abs(v), 0);
  if (total === 0) return {};
  const result: Record<string, number> = {};
  for (const [sourceId, value] of Object.entries(externalBySource)) {
    result[sourceId] = (result[sourceId] ?? 0) + delta * (Math.abs(value) / total);
  }
  return result;
}

function mergeInto(target: Record<string, number>, source: Record<string, number>): void {
  for (const [k, v] of Object.entries(source)) {
    target[k] = (target[k] ?? 0) + v;
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function computeLmdiContributions(params: LmdiParams): LmdiResult {
  const {
    baseStats,
    selfOperatorMods,
    externalOperatorMods,
    selfEnemyMods,
    externalEnemyMods,
    hit,
    linkStacks,
    linkSources,
    hittingTrackId,
    element,
    enemyDef,
    enemyResistance = 0,
    actualBreakdown,
    staggerMult,
    staggerSources,
    finisherMult,
  } = params;

  const actualDamage = actualBreakdown.expectedDamage;
  if (actualDamage <= 0) return { self: 0, external: {} };

  // ── 1. Compute self-only operator status ──────────────────────────────────
  const selfOpStatus = computeStats(baseStats, [], selfOperatorMods, hit.skillType, hit.skillId);
  const selfMods = filterDamageModifiers(
    selfOpStatus.damageModifiers ?? [],
    element,
    hit.skillType,
    hit.skillId,
  );

  // ── 2. Compute self-only enemy status ─────────────────────────────────────
  const selfEnemyStatus: ComputedEnemyStatus =
    selfEnemyMods.length > 0
      ? computeEnemyStats([], selfEnemyMods)
      : {
          susceptibility: 0,
          resistanceShred: 0,
          defReduction: 0,
          increasedDmgTaken: 0,
          dmgReductionEffects: [],
          elementalSusceptibility: {},
          elementalIncreasedDmgTaken: {},
          increasedDmgTakenExternalMult: 1,
          elementalIncreasedDmgTakenExternalMult: {},
        };

  // ── 3. Compute self-only link stacks ──────────────────────────────────────
  const selfLinkStacks = linkSources ? (linkSources[hittingTrackId] ?? 0) : linkStacks; // if no source info, attribute all to self

  // ── 3b. Compute self-only stagger multiplier ─────────────────────────────
  const selfStaggerFraction = staggerSources ? (staggerSources[hittingTrackId] ?? 0) : 1;
  const selfStaggerMult = 1 + selfStaggerFraction * (staggerMult - 1);

  // ── 4. Build self-only damage stats (apply consumed stat effects too) ─────
  const selfStats = {
    attack: selfOpStatus.attack,
    critRate: selfOpStatus.critRate,
    critDmg: selfOpStatus.critDmg,
    ...selfMods,
  };
  applyConsumedStatEffects(selfStats, hit.consumedStatEffects, selfOpStatus);

  const selfElementalSusc =
    element && selfEnemyStatus.elementalSusceptibility?.[element]
      ? selfEnemyStatus.elementalSusceptibility[element]
      : 0;
  const selfElementalDmgTaken =
    element && selfEnemyStatus.elementalIncreasedDmgTaken?.[element]
      ? selfEnemyStatus.elementalIncreasedDmgTaken[element]
      : 0;

  const selfDmgTakenExternalMult =
    (selfEnemyStatus.increasedDmgTakenExternalMult ?? 1) *
    (element ? (selfEnemyStatus.elementalIncreasedDmgTakenExternalMult?.[element] ?? 1) : 1);

  const selfTotalSusc =
    (selfEnemyStatus.susceptibility + selfElementalSusc) * selfStats.susceptibilityAmplify;

  const selfBreakdown = computeExpectedDamageWithBreakdown(
    {
      attack: selfStats.attack,
      multiplier: hit.multiplier,
      skillType: hit.skillType,
      critRate: selfStats.critRate,
      critDmg: selfStats.critDmg,
      dmgBonus: selfStats.dmgBonus,
      dmgBonusExternalMult: selfStats.dmgBonusExternalMult,
      ampBonus: selfStats.ampBonus,
      directMultiplier: selfStats.directMultiplier,
      enemyDef,
      resistanceIgnore: selfStats.resistanceIgnore,
      resistanceShred: selfEnemyStatus.resistanceShred,
      enemyResistance,
      susceptibility: selfTotalSusc,
      increasedDmgTaken: selfEnemyStatus.increasedDmgTaken + selfElementalDmgTaken,
      dmgTakenExternalMult: selfDmgTakenExternalMult,
      linkStacks: selfLinkStacks,
      staggerMult: selfStaggerMult,
      finisherMult,
    },
    element,
  );

  const D_actual = actualBreakdown.expectedDamage;
  const D_self = selfBreakdown.expectedDamage;

  // If no difference, all damage is self
  if (D_actual <= D_self || D_self <= 0) {
    return { self: D_actual, external: {} };
  }

  // ── 5. LMDI factor decomposition ─────────────────────────────────────────
  const L = logarithmicMean(D_actual, D_self);
  const external: Record<string, number> = {};

  // Factor pairs: [actual_factor, self_factor, attribution_sources]
  // For each factor where actual != self, compute Δ_k and attribute

  const factors: Array<{
    actual: number;
    self: number;
    sources: Record<string, number>; // sourceId → contribution magnitude
  }> = [];

  // (a) base = ATK × (mult/100)
  factors.push({
    actual: actualBreakdown.base,
    self: selfBreakdown.base,
    sources: groupExternalByStatCategory(externalOperatorMods, 'atk'),
  });

  // (b) dmgBonusMult = 1 + dmgBonus
  factors.push({
    actual: actualBreakdown.dmgBonusMult,
    self: selfBreakdown.dmgBonusMult,
    sources: {
      ...groupExternalByStatCategory(externalOperatorMods, 'dmgBonus'),
    },
  });

  // (b2) dmgBonusExternalMult = Π(1 + external dmgBonus) — standalone multiplicative factor
  factors.push({
    actual: actualBreakdown.dmgBonusExternalMult,
    self: selfBreakdown.dmgBonusExternalMult,
    sources: groupExternalByStatCategory(externalOperatorMods, 'dmgBonus'),
  });

  // (c) critMult = 1 + critRate * critDmg
  factors.push({
    actual: actualBreakdown.critMult,
    self: selfBreakdown.critMult,
    sources: groupExternalByStatCategory(externalOperatorMods, 'crit'),
  });

  // (d) ampMult = 1 + ampBonus
  factors.push({
    actual: actualBreakdown.ampMult,
    self: selfBreakdown.ampMult,
    sources: groupExternalByStatCategory(externalOperatorMods, 'ampBonus'),
  });

  // (e) directMultiplier
  factors.push({
    actual: actualBreakdown.directMultiplier,
    self: selfBreakdown.directMultiplier,
    sources: groupExternalByStatCategory(externalOperatorMods, 'directMultiplier'),
  });

  // (f) susceptMult = 1 + susceptibility (enemy debuff)
  factors.push({
    actual: actualBreakdown.susceptMult,
    self: selfBreakdown.susceptMult,
    sources: groupExternalByStatCategory(externalEnemyMods, 'susceptibility'),
  });

  // (g) dmgTakenMult = 1 + increasedDmgTaken (enemy debuff)
  factors.push({
    actual: actualBreakdown.dmgTakenMult,
    self: selfBreakdown.dmgTakenMult,
    sources: groupExternalByStatCategory(externalEnemyMods, 'increasedDmgTaken'),
  });

  // (g2) dmgTakenExternalMult — standalone multiplicative damage-taken factor (e.g. Wrap)
  factors.push({
    actual: actualBreakdown.dmgTakenExternalMult,
    self: selfBreakdown.dmgTakenExternalMult,
    sources: groupExternalByStatCategory(externalEnemyMods, 'increasedDmgTaken'),
  });

  // (h) resMult = 1 + resistanceIgnore + resistanceShred
  const resSources: Record<string, number> = {};
  mergeInto(resSources, groupExternalByStatCategory(externalOperatorMods, 'resistanceIgnore'));
  mergeInto(resSources, groupExternalByStatCategory(externalEnemyMods, 'resistanceShred'));
  factors.push({
    actual: actualBreakdown.resMult,
    self: selfBreakdown.resMult,
    sources: resSources,
  });

  // (i) linkMult
  const externalLinkSources: Record<string, number> = {};
  if (linkSources) {
    for (const [srcId, stacks] of Object.entries(linkSources)) {
      if (srcId !== hittingTrackId) {
        externalLinkSources[srcId] = stacks;
      }
    }
  }
  factors.push({
    actual: actualBreakdown.linkMult,
    self: selfBreakdown.linkMult,
    sources: externalLinkSources,
  });

  // (j) staggerMult
  if (staggerMult > 1 && staggerSources) {
    const externalStaggerSources: Record<string, number> = {};
    for (const [srcId, fraction] of Object.entries(staggerSources)) {
      if (srcId !== hittingTrackId) {
        externalStaggerSources[srcId] = fraction;
      }
    }
    factors.push({
      actual: actualBreakdown.staggerMult,
      self: selfBreakdown.staggerMult,
      sources: externalStaggerSources,
    });
  }

  // (k) defMult — not affected by operator buffs, skip (actual == self)

  // ── 6. Compute and attribute each factor's Δ ──────────────────────────────
  for (const factor of factors) {
    if (factor.actual <= 0 || factor.self <= 0) continue;
    if (Math.abs(factor.actual - factor.self) < 1e-9) continue;

    const delta = L * Math.log(factor.actual / factor.self);
    if (Object.keys(factor.sources).length > 0) {
      mergeInto(external, attributeProportionally(delta, factor.sources));
    }
    // If no external sources identified for this factor change, it goes to a rounding bucket
    // (shouldn't happen in practice, but avoid losing damage)
  }

  // ── 7. Compute self as remainder to ensure exact sum ──────────────────────
  const externalTotal = Object.values(external).reduce((s, v) => s + v, 0);
  const selfDamage = D_actual - externalTotal;

  return {
    self: selfDamage,
    external,
  };
}

// ─── Stat category grouping ─────────────────────────────────────────────────

/**
 * Group external modifier values by sourceId for a given stat category.
 * Returns { sourceId: totalValue } for proportional attribution.
 */
function groupExternalByStatCategory(
  mods: SourceTaggedMod[],
  category: string,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const { sourceId, mod } of mods) {
    if (!matchesCategory(mod, category)) continue;
    result[sourceId] = (result[sourceId] ?? 0) + Math.abs(mod.value);
  }
  return result;
}

// ─── Reaction LMDI ─────────────────────────────────────────────────────────

interface ReactionLmdiParams {
  baseStats: BaseStatValues;
  selfOperatorMods: ResolvedStatModifier[];
  externalOperatorMods: SourceTaggedMod[];
  selfEnemyMods: ResolvedStatModifier[];
  externalEnemyMods: SourceTaggedMod[];
  hit: { multiplier: number };
  hittingTrackId: string;
  element: string | undefined;
  enemyDef: number;
  enemyResistance?: number;
  /** The actual (full-buffed) standard-part breakdown (before reaction multipliers). */
  actualStandardBreakdown: DamageBreakdown;
  /** The actual artsIntensityMult with all buffs. */
  actualArtsIntensityMult: number;
  /** The actual total damage including reaction multipliers. */
  actualDamage: number;
  /** Combustion DoT cannot crit. */
  isCombustionDot: boolean;
  /** Reaction level (consumed stacks). Used for the reactionLevel factor. */
  reactionLevel?: number;
  /** Per-source stack attribution from consumed infliction/vulnerability. */
  consumedStackSources?: Record<string, number>;
  staggerMult: number;
  staggerSources: Record<string, number> | undefined;
  finisherMult: number;
  /** When true, all reaction debuff credit goes to the applier — skip the stack-provider split for factor (j). */
  creditToApplier?: boolean;
}

/**
 * LMDI decomposition for reaction/DoT damage.
 *
 * Same approach as standard LMDI but with extra reaction-specific factors:
 *   - artsIntensityMult (decomposable — artsIntensity can be externally buffed)
 *   - levelCoefficient (pure self — cancels in ratio)
 *   - effectivenessMult (pure self — cancels in ratio)
 */
export function computeReactionLmdiContributions(params: ReactionLmdiParams): LmdiResult {
  const {
    baseStats,
    selfOperatorMods,
    externalOperatorMods,
    selfEnemyMods,
    externalEnemyMods,
    hit,
    hittingTrackId,
    element,
    enemyDef,
    enemyResistance = 0,
    actualStandardBreakdown,
    actualArtsIntensityMult,
    actualDamage,
    isCombustionDot,
  } = params;

  if (actualDamage <= 0) return { self: 0, external: {} };

  // ── 1. Compute self-only operator status (no skillType for reactions) ─────
  const selfOpStatus = computeStats(baseStats, [], selfOperatorMods);
  const selfMods = filterDamageModifiers(
    selfOpStatus.damageModifiers ?? [],
    element,
    undefined,
    undefined,
  );

  // ── 2. Compute self-only enemy status ─────────────────────────────────────
  const selfEnemyStatus: ComputedEnemyStatus =
    selfEnemyMods.length > 0
      ? computeEnemyStats([], selfEnemyMods)
      : {
          susceptibility: 0,
          resistanceShred: 0,
          defReduction: 0,
          increasedDmgTaken: 0,
          dmgReductionEffects: [],
          elementalSusceptibility: {},
          elementalIncreasedDmgTaken: {},
          increasedDmgTakenExternalMult: 1,
          elementalIncreasedDmgTakenExternalMult: {},
        };

  // ── 3. Build self-only standard breakdown ─────────────────────────────────
  const selfElementalSusc =
    element && selfEnemyStatus.elementalSusceptibility?.[element]
      ? selfEnemyStatus.elementalSusceptibility[element]
      : 0;
  const selfElementalDmgTaken =
    element && selfEnemyStatus.elementalIncreasedDmgTaken?.[element]
      ? selfEnemyStatus.elementalIncreasedDmgTaken[element]
      : 0;

  // Self-only stagger multiplier
  const selfStaggerFraction = params.staggerSources
    ? (params.staggerSources[hittingTrackId] ?? 0)
    : 1;
  const selfStaggerMult = 1 + selfStaggerFraction * (params.staggerMult - 1);

  const selfDmgTakenExternalMult =
    (selfEnemyStatus.increasedDmgTakenExternalMult ?? 1) *
    (element ? (selfEnemyStatus.elementalIncreasedDmgTakenExternalMult?.[element] ?? 1) : 1);

  const selfTotalSusc =
    (selfEnemyStatus.susceptibility + selfElementalSusc) * selfMods.susceptibilityAmplify;

  const selfStandardBreakdown = computeExpectedDamageWithBreakdown(
    {
      attack: selfOpStatus.attack,
      multiplier: hit.multiplier,
      critRate: isCombustionDot ? 0 : selfOpStatus.critRate,
      critDmg: isCombustionDot ? 0 : selfOpStatus.critDmg,
      dmgBonus: selfMods.dmgBonus,
      dmgBonusExternalMult: selfMods.dmgBonusExternalMult,
      ampBonus: selfMods.ampBonus,
      directMultiplier: selfMods.directMultiplier,
      enemyDef,
      resistanceIgnore: selfMods.resistanceIgnore,
      resistanceShred: selfEnemyStatus.resistanceShred,
      enemyResistance,
      susceptibility: selfTotalSusc,
      increasedDmgTaken: selfEnemyStatus.increasedDmgTaken + selfElementalDmgTaken,
      dmgTakenExternalMult: selfDmgTakenExternalMult,
      linkStacks: 0,
      staggerMult: selfStaggerMult,
      finisherMult: params.finisherMult,
    },
    element,
  );

  // ── 4. Compute self-only artsIntensityMult ────────────────────────────────
  const selfArtsIntensityMult = computeArtsIntensityDamageMult(selfOpStatus.artsIntensity);

  // ── 5. Derive D_self via ratio ────────────────────────────────────────────
  // levelCoefficient and effectivenessMult are pure self → cancel in ratio:
  // D_self = D_actual × (selfStandard / actualStandard) × (selfArtsIntMult / actualArtsIntMult)
  const D_actual_standard = actualStandardBreakdown.expectedDamage;
  if (D_actual_standard <= 0 || actualArtsIntensityMult <= 0) {
    return { self: actualDamage, external: {} };
  }

  const D_self =
    actualDamage *
    (selfStandardBreakdown.expectedDamage / D_actual_standard) *
    (selfArtsIntensityMult / actualArtsIntensityMult);

  if (actualDamage <= D_self || D_self <= 0) {
    return { self: actualDamage, external: {} };
  }

  // ── 6. LMDI factor decomposition ─────────────────────────────────────────
  const L = logarithmicMean(actualDamage, D_self);
  const external: Record<string, number> = {};

  const factors: Array<{
    actual: number;
    self: number;
    sources: Record<string, number>;
  }> = [];

  // (a) base = ATK × (mult/100)
  factors.push({
    actual: actualStandardBreakdown.base,
    self: selfStandardBreakdown.base,
    sources: groupExternalByStatCategory(externalOperatorMods, 'atk'),
  });

  // (b) dmgBonusMult
  factors.push({
    actual: actualStandardBreakdown.dmgBonusMult,
    self: selfStandardBreakdown.dmgBonusMult,
    sources: groupExternalByStatCategory(externalOperatorMods, 'dmgBonus'),
  });

  // (b2) dmgBonusExternalMult — standalone multiplicative factor
  factors.push({
    actual: actualStandardBreakdown.dmgBonusExternalMult,
    self: selfStandardBreakdown.dmgBonusExternalMult,
    sources: groupExternalByStatCategory(externalOperatorMods, 'dmgBonus'),
  });

  // (c) critMult (0 for combustion_dot but still included — both sides match)
  factors.push({
    actual: actualStandardBreakdown.critMult,
    self: selfStandardBreakdown.critMult,
    sources: groupExternalByStatCategory(externalOperatorMods, 'crit'),
  });

  // (d) ampMult
  factors.push({
    actual: actualStandardBreakdown.ampMult,
    self: selfStandardBreakdown.ampMult,
    sources: groupExternalByStatCategory(externalOperatorMods, 'ampBonus'),
  });

  // (e) directMultiplier
  factors.push({
    actual: actualStandardBreakdown.directMultiplier,
    self: selfStandardBreakdown.directMultiplier,
    sources: groupExternalByStatCategory(externalOperatorMods, 'directMultiplier'),
  });

  // (f) susceptMult
  factors.push({
    actual: actualStandardBreakdown.susceptMult,
    self: selfStandardBreakdown.susceptMult,
    sources: groupExternalByStatCategory(externalEnemyMods, 'susceptibility'),
  });

  // (g) dmgTakenMult
  factors.push({
    actual: actualStandardBreakdown.dmgTakenMult,
    self: selfStandardBreakdown.dmgTakenMult,
    sources: groupExternalByStatCategory(externalEnemyMods, 'increasedDmgTaken'),
  });

  // (g2) dmgTakenExternalMult — standalone multiplicative damage-taken factor (e.g. Wrap)
  factors.push({
    actual: actualStandardBreakdown.dmgTakenExternalMult,
    self: selfStandardBreakdown.dmgTakenExternalMult,
    sources: groupExternalByStatCategory(externalEnemyMods, 'increasedDmgTaken'),
  });

  // (h) resMult
  const resSources: Record<string, number> = {};
  mergeInto(resSources, groupExternalByStatCategory(externalOperatorMods, 'resistanceIgnore'));
  mergeInto(resSources, groupExternalByStatCategory(externalEnemyMods, 'resistanceShred'));
  factors.push({
    actual: actualStandardBreakdown.resMult,
    self: selfStandardBreakdown.resMult,
    sources: resSources,
  });

  // (i) artsIntensityMult (reaction-specific decomposable factor)
  factors.push({
    actual: actualArtsIntensityMult,
    self: selfArtsIntensityMult,
    sources: groupExternalByStatCategory(externalOperatorMods, 'artsIntensity'),
  });

  // (j) reactionLevelFactor = (1 + totalStacks) — infliction/vulnerability source attribution
  // Skipped in 'creditToApplier' mode: the trigger owns the whole level factor (cancels in ratio).
  if (
    !params.creditToApplier &&
    params.reactionLevel != null &&
    params.reactionLevel > 0 &&
    params.consumedStackSources
  ) {
    const totalStacks = params.reactionLevel;
    const triggerStacks = params.consumedStackSources[params.hittingTrackId] ?? 0;
    const actualFactor = 1 + totalStacks;
    const selfFactor = 1 + triggerStacks;
    const externalSources: Record<string, number> = {};
    for (const [srcId, stacks] of Object.entries(params.consumedStackSources)) {
      if (srcId !== params.hittingTrackId) {
        externalSources[srcId] = stacks;
      }
    }
    if (Math.abs(actualFactor - selfFactor) > 1e-9 && selfFactor > 0) {
      factors.push({ actual: actualFactor, self: selfFactor, sources: externalSources });
    }
  }

  // No link factor (reactions don't consume link stacks)
  // levelCoefficient + effectivenessMult: pure self, delta = 0

  // (k) staggerMult
  if (params.staggerMult > 1 && params.staggerSources) {
    const externalStaggerSources: Record<string, number> = {};
    for (const [srcId, fraction] of Object.entries(params.staggerSources)) {
      if (srcId !== hittingTrackId) {
        externalStaggerSources[srcId] = fraction;
      }
    }
    factors.push({
      actual: actualStandardBreakdown.staggerMult,
      self: selfStandardBreakdown.staggerMult,
      sources: externalStaggerSources,
    });
  }

  // ── 7. Compute and attribute each factor's Δ ──────────────────────────────
  for (const factor of factors) {
    if (factor.actual <= 0 || factor.self <= 0) continue;
    if (Math.abs(factor.actual - factor.self) < 1e-9) continue;

    const delta = L * Math.log(factor.actual / factor.self);
    if (Object.keys(factor.sources).length > 0) {
      mergeInto(external, attributeProportionally(delta, factor.sources));
    }
  }

  // ── 8. Self as remainder for exact sum ────────────────────────────────────
  const externalTotal = Object.values(external).reduce((s, v) => s + v, 0);
  return { self: actualDamage - externalTotal, external };
}

// ─── Stat category grouping ─────────────────────────────────────────────────

function matchesCategory(mod: ResolvedStatModifier, category: string): boolean {
  const stat = mod.stat;
  if (typeof stat === 'string') {
    // OperatorStat string form
    switch (category) {
      case 'atk':
        return stat === 'atkPercent' || stat === 'atkFlat' || stat === 'attributeAtkPercent';
      case 'crit':
        return stat === 'critRate' || stat === 'critDmg';
      case 'dmgBonus':
      case 'ampBonus':
      case 'directMultiplier':
      case 'resistanceIgnore':
        return stat === category;
      default:
        return false;
    }
  }
  if (typeof stat === 'object' && stat !== null && 'modifier' in stat) {
    // EnemyStat object form: { modifier: 'susceptibility' | 'resistanceShred' | ... }
    const modifier = (stat as any).modifier;
    return modifier === category;
  }
  return false;
}
