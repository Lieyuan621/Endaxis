/**
 * Expected damage calculation for timeline hit diamonds.
 *
 * Computes crit-biased expected damage: the average damage over many hits,
 * weighting crit probability.
 *
 * Formula:
 *   ATK * (multiplier/100) * (1+dmgBonus) * (1+critRate*critDmg)
 *     * (1+ampBonus) * directMult * (1+susceptibility) * (1+increasedDmgTaken)
 *     * linkMult * defMult * resMult
 *
 * Enemy resistance is stored as resistance points: 20 means the target takes 80% damage.
 * Resistance ignore and shred subtract from enemy resistance before converting to resMult.
 */

import type { ScopedDamageModifier } from './types';
import type { DamageElement } from '../types';
import type { ConsumedStatEffect } from '@/simulation/compiler/types';
import type { OperatorStatus, ComputedEnemyStatus } from '@/types';

// ─── Link multiplier tables ─────────────────────────────────────────────────

const SKILL_LINK_BONUS = [0, 0.3, 0.45, 0.6, 0.75]; // stacks 0–4
const ULT_LINK_BONUS = [0, 0.2, 0.3, 0.4, 0.5];

export function linkMultiplier(stacks: number, skillType?: string): number {
  if (stacks <= 0) return 1;
  const idx = Math.min(stacks, 4);
  if (skillType === 'battleSkill') return 1 + (SKILL_LINK_BONUS[idx] ?? 0);
  if (skillType === 'ultimate') return 1 + (ULT_LINK_BONUS[idx] ?? 0);
  return 1;
}

// ─── Damage modifier filtering ──────────────────────────────────────────────

function matchesElement(
  filter: DamageElement | DamageElement[] | undefined,
  element: string | undefined,
): boolean {
  if (!filter) return true;
  if (!element) return false;
  return Array.isArray(filter) ? filter.includes(element as DamageElement) : filter === element;
}

function matchesSkillType(
  filter: string | string[] | undefined,
  skillType: string | undefined,
): boolean {
  if (!filter) return true;
  if (filter === 'nonSkill') return skillType == null;
  if (!skillType) return false;
  const types = Array.isArray(filter) ? filter : [filter];
  // basicAttack scope matches basicAttack, finalStrike, and dive
  if (types.includes('basicAttack') && (skillType === 'finalStrike' || skillType === 'dive'))
    return true;
  return types.includes(skillType);
}

function matchesSkillId(
  filter: string | string[] | undefined,
  skillId: string | undefined,
): boolean {
  if (!filter) return true;
  if (!skillId) return false;
  return Array.isArray(filter) ? filter.includes(skillId) : filter === skillId;
}

interface FilteredModifiers {
  dmgBonus: number;
  dmgBonusExternalMult: number;
  dmgBonusSources: DamageModifierSource[];
  ampBonus: number;
  ampBonusSources: DamageModifierSource[];
  directMultiplier: number;
  resistanceIgnore: number;
  resistanceIgnoreSources: DamageModifierSource[];
  susceptibilityAmplify: number;
  susceptibilityAmplifySources: DamageModifierSource[];
}

/** One contributing dmgBonus line for the hit-detail dialog. */
export interface DamageModifierSource {
  /** Prefer effect.name; fall back to effect id. */
  label: string;
  /** Decimal contribution (e.g. 0.2 = +20%) or external factor delta. */
  value: number;
  external?: boolean;
}

/**
 * Filter and accumulate damage modifiers matching element + skillType.
 */
export function filterDamageModifiers(
  modifiers: ScopedDamageModifier[],
  element: string | undefined,
  skillType: string | undefined,
  skillId: string | undefined,
): FilteredModifiers {
  let dmgBonus = 0;
  let dmgBonusExternalMult = 1;
  let ampBonus = 0;
  let directMultiplier = 1;
  let resistanceIgnore = 0;
  let susceptibilityAmplify = 1;
  const dmgBonusSources: DamageModifierSource[] = [];
  const ampBonusSources: DamageModifierSource[] = [];
  const resistanceIgnoreSources: DamageModifierSource[] = [];
  const susceptibilityAmplifySources: DamageModifierSource[] = [];

  for (const mod of modifiers) {
    if (!matchesElement(mod.elements, element)) continue;
    if (!matchesSkillType(mod.skillTypes, skillType)) continue;
    if (!matchesSkillId(mod.skillId, skillId)) continue;

    switch (mod.modifier) {
      case 'dmgBonus':
        if (mod.external) {
          dmgBonusExternalMult *= Math.max(0, 1 + mod.value);
        } else {
          dmgBonus += mod.value;
        }
        dmgBonusSources.push({
          label: mod.sourceLabel || mod.effectId || 'dmgBonus',
          value: mod.value,
          external: mod.external,
        });
        break;
      case 'ampBonus':
        ampBonus += mod.value;
        ampBonusSources.push({
          label: mod.sourceLabel || mod.effectId || 'ampBonus',
          value: mod.value,
        });
        break;
      case 'directMultiplier':
        directMultiplier *= mod.value;
        break;
      case 'resistanceIgnore':
        resistanceIgnore += mod.value;
        resistanceIgnoreSources.push({
          label: mod.sourceLabel || mod.effectId || 'resistanceIgnore',
          value: mod.value,
        });
        break;
      case 'susceptibilityAmplify':
        susceptibilityAmplify *= 1 + mod.value;
        susceptibilityAmplifySources.push({
          label: mod.sourceLabel || mod.effectId || 'susceptibilityAmplify',
          value: mod.value,
        });
        break;
    }
  }

  return {
    dmgBonus,
    dmgBonusExternalMult,
    dmgBonusSources,
    ampBonus,
    ampBonusSources,
    directMultiplier,
    resistanceIgnore,
    resistanceIgnoreSources,
    susceptibilityAmplify,
    susceptibilityAmplifySources,
  };
}

/** Collect susceptibility / resistance-shred lines from live enemy status entries. */
export function collectEnemyHitModifierSources(
  entries: ReadonlyArray<{
    id: string;
    stat?: { modifier?: string; elements?: string | string[] | null };
    value: number;
    stacks: number;
    effect?: { name?: string | null } | null;
  }>,
  element: string | undefined,
): {
  susceptibilitySources: DamageModifierSource[];
  resistanceShredSources: DamageModifierSource[];
  increasedDmgTakenSources: DamageModifierSource[];
} {
  const susceptibilitySources: DamageModifierSource[] = [];
  const resistanceShredSources: DamageModifierSource[] = [];
  const increasedDmgTakenSources: DamageModifierSource[] = [];

  for (const entry of entries) {
    const modifier = entry.stat?.modifier;
    if (!modifier) continue;
    const named =
      entry.effect && typeof entry.effect.name === 'string' && entry.effect.name.trim()
        ? entry.effect.name.trim()
        : '';
    const decimal = (entry.value * entry.stacks) / 100;

    if (modifier === 'susceptibility') {
      const elements = entry.stat?.elements;
      const arr = elements == null ? [] : Array.isArray(elements) ? elements : [elements];
      const label =
        named ||
        (arr.length === 0
          ? 'susceptibility'
          : arr.length === 1
            ? `susceptibility:${arr[0]}`
            : arr.length === 4 &&
                ['heat', 'cryo', 'electric', 'nature'].every(e => arr.includes(e))
              ? 'susceptibility:arts'
              : arr.includes('nature') && arr.includes('cryo') && arr.length === 2
                ? 'natureCryoSusceptibility'
                : 'susceptibility');
      if (arr.length === 0) {
        susceptibilitySources.push({ label, value: decimal });
        continue;
      }
      if (element && arr.includes(element)) {
        susceptibilitySources.push({ label, value: decimal });
      }
      continue;
    }

    if (modifier === 'increasedDmgTaken') {
      const elements = entry.stat?.elements;
      const arr = elements == null ? [] : Array.isArray(elements) ? elements : [elements];
      const label =
        named ||
        (arr.length === 0
          ? 'increasedDmgTaken'
          : arr.length === 1
            ? `increasedDmgTaken:${arr[0]}`
            : 'increasedDmgTaken');
      if (arr.length === 0) {
        increasedDmgTakenSources.push({ label, value: decimal });
        continue;
      }
      if (element && arr.includes(element)) {
        increasedDmgTakenSources.push({ label, value: decimal });
      }
      continue;
    }

    if (modifier === 'resistanceShred') {
      const label =
        named ||
        (entry.id === 'corrosion:resShred' || entry.id.startsWith('corrosion:')
          ? 'corrosion'
          : entry.id);
      resistanceShredSources.push({ label, value: decimal });
    }
  }

  return { susceptibilitySources, resistanceShredSources, increasedDmgTakenSources };
}

// ─── Consumed stat effect application ───────────────────────────────────────

interface MutableDamageStats {
  attack: number;
  critRate: number;
  critDmg: number;
  dmgBonus: number;
  dmgBonusExternalMult: number;
  dmgBonusSources: DamageModifierSource[];
  ampBonus: number;
  ampBonusSources: DamageModifierSource[];
  directMultiplier: number;
  resistanceIgnore: number;
  resistanceIgnoreSources: DamageModifierSource[];
  susceptibilityAmplify: number;
  susceptibilityAmplifySources: DamageModifierSource[];
}

/**
 * Apply consumed one-time stat effects onto damage stats.
 * Modifies the stats object in-place.
 */
export function applyConsumedStatEffects(
  stats: MutableDamageStats,
  consumedEffects: ConsumedStatEffect[] | undefined,
  operatorStatus: OperatorStatus,
): void {
  if (!consumedEffects?.length) return;
  for (const ce of consumedEffects) {
    const stat = typeof ce.stat === 'string' ? ce.stat : (ce.stat as any)?.modifier;
    if (!stat) continue;

    // Values arrive in percentage-point form (e.g. 30 = 30%), matching operator data convention.
    // Divide by 100 for stats that use decimal form in the damage formula,
    // mirroring the normalization in computeStats (line 224: pct = val / 100).
    switch (stat) {
      case 'atkPercent': {
        const baseAtkTotal = operatorStatus.baseAtk.operator + operatorStatus.baseAtk.weapon;
        const attrs = operatorStatus.attributes;
        const coeff = operatorStatus.attrAtkCoeff;
        const attrBonus =
          1 +
          coeff.strength * attrs.strength +
          coeff.agility * attrs.agility +
          coeff.intellect * attrs.intellect +
          coeff.will * attrs.will;
        stats.attack = Math.floor(
          (baseAtkTotal * (1 + operatorStatus.atkPercent + ce.value / 100) +
            operatorStatus.flatAtk) *
            attrBonus,
        );
        break;
      }
      case 'atkFlat': {
        const baseAtkTotal = operatorStatus.baseAtk.operator + operatorStatus.baseAtk.weapon;
        const attrs = operatorStatus.attributes;
        const coeff = operatorStatus.attrAtkCoeff;
        const attrBonus =
          1 +
          coeff.strength * attrs.strength +
          coeff.agility * attrs.agility +
          coeff.intellect * attrs.intellect +
          coeff.will * attrs.will;
        stats.attack = Math.floor(
          (baseAtkTotal * (1 + operatorStatus.atkPercent) + operatorStatus.flatAtk + ce.value) *
            attrBonus,
        );
        break;
      }
      case 'critRate':
        stats.critRate += ce.value / 100;
        break;
      case 'critDmg':
        stats.critDmg += ce.value / 100;
        break;
      case 'dmgBonus':
        stats.dmgBonus += ce.value / 100;
        stats.dmgBonusSources.push({
          label: typeof ce.stat === 'string' ? ce.stat : ((ce.stat as any)?.modifier ?? 'dmgBonus'),
          value: ce.value / 100,
        });
        break;
      case 'ampBonus':
        stats.ampBonus += ce.value / 100;
        break;
      case 'directMultiplier':
        stats.directMultiplier *= ce.value;
        break;
      case 'resistanceIgnore':
        stats.resistanceIgnore += ce.value / 100;
        break;
      case 'susceptibilityAmplify':
        stats.susceptibilityAmplify *= 1 + ce.value / 100;
        break;
    }
  }
}

// ─── Stagger multiplier constant ────────────────────────────────────────────

export const STAGGER_DAMAGE_MULTIPLIER = 1.3;

// ─── Finisher multiplier by enemy tier ─────────────────────────────────────

export const FINISHER_MULTIPLIER_BY_TIER: Record<string, number> = {
  normal: 1.0,
  advanced: 1.25,
  elite: 1.25,
  boss: 1.5,
  leader: 1.75,
};

// ─── Main damage calculation ────────────────────────────────────────────────

interface HitDamageParams {
  attack: number;
  multiplier: number; // percentage, e.g. 155
  skillType?: string;
  critRate: number; // decimal
  critDmg: number; // decimal
  dmgBonus: number; // decimal
  dmgBonusExternalMult: number; // standalone multiplicative factor (Π(1 + external dmgBonus))
  dmgBonusSources?: DamageModifierSource[];
  ampBonus: number; // decimal
  ampBonusSources?: DamageModifierSource[];
  directMultiplier: number; // pre-computed product
  enemyDef: number;
  resistanceIgnore: number; // decimal
  resistanceIgnoreSources?: DamageModifierSource[];
  resistanceShred: number; // decimal
  resistanceShredSources?: DamageModifierSource[];
  enemyResistance?: number; // decimal resistance points, e.g. 0.2 = 20 resistance = 80% damage
  susceptibility: number; // decimal
  susceptibilitySources?: DamageModifierSource[];
  susceptibilityAmplifySources?: DamageModifierSource[];
  increasedDmgTaken: number; // decimal
  increasedDmgTakenSources?: DamageModifierSource[];
  dmgTakenExternalMult: number; // standalone multiplicative damage-taken factor (Π(1 + external), e.g. Wrap)
  linkStacks: number;
  staggerMult: number; // 1.3 when enemy is staggered, 1 otherwise
  finisherMult: number; // tier-based multiplier for finisher actions against staggered enemies
}

// ─── Damage breakdown (for detail dialog) ──────────────────────────────────

export interface DamageBreakdown {
  attack: number;
  multiplier: number;
  skillType?: string;
  element?: string;
  base: number;
  dmgBonus: number;
  dmgBonusMult: number;
  dmgBonusExternalMult: number;
  dmgBonusSources?: DamageModifierSource[];
  critRate: number;
  critDmg: number;
  critMult: number;
  ampBonus: number;
  ampMult: number;
  ampBonusSources?: DamageModifierSource[];
  directMultiplier: number;
  susceptibility: number;
  susceptMult: number;
  susceptibilitySources?: DamageModifierSource[];
  susceptibilityAmplifySources?: DamageModifierSource[];
  increasedDmgTaken: number;
  dmgTakenMult: number;
  increasedDmgTakenSources?: DamageModifierSource[];
  dmgTakenExternalMult: number;
  linkStacks: number;
  linkMult: number;
  enemyDef: number;
  defMult: number;
  enemyResistance: number;
  resistanceIgnore: number;
  resistanceIgnoreSources?: DamageModifierSource[];
  resistanceShred: number;
  resistanceShredSources?: DamageModifierSource[];
  resMult: number;
  enemyResMult: number;
  staggerMult: number;
  finisherMult: number;
  nonCritDamage: number;
  critDamage: number;
  expectedDamage: number;

  // Reaction-specific (present only for reaction damage hits)
  isReaction?: boolean;
  reactionType?: string;
  levelCoefficient?: number;
  artsIntensityMult?: number;
  artsIntensity?: number;
  operatorLevel?: number;
  effectivenessMult?: number;
}

export function computeExpectedDamageWithBreakdown(
  p: HitDamageParams,
  element?: string,
): DamageBreakdown {
  const base = p.attack * (p.multiplier / 100);
  const dmgBonusMult = 1 + p.dmgBonus;
  const critRate = Math.min(p.critRate, 1);
  const critMult = 1 + critRate * p.critDmg;
  const ampMult = 1 + p.ampBonus;
  const susceptMult = 1 + p.susceptibility;
  const dmgTakenMult = 1 + p.increasedDmgTaken;
  const dmgTakenExternalMult = p.dmgTakenExternalMult ?? 1;
  const link = linkMultiplier(p.linkStacks, p.skillType);
  const def = Math.max(p.enemyDef, 100);
  const defMult = 100 / (def + 100);
  const enemyResistance = p.enemyResistance ?? 0;
  const effectiveResistance = enemyResistance - p.resistanceIgnore - p.resistanceShred;
  const resMult = 1 - effectiveResistance;
  const enemyResMult = resMult;

  const shared =
    base *
    dmgBonusMult *
    p.dmgBonusExternalMult *
    ampMult *
    p.directMultiplier *
    susceptMult *
    dmgTakenMult *
    dmgTakenExternalMult *
    link *
    defMult *
    resMult *
    p.staggerMult *
    p.finisherMult;

  return {
    attack: p.attack,
    multiplier: p.multiplier,
    skillType: p.skillType,
    element,
    base,
    dmgBonus: p.dmgBonus,
    dmgBonusMult,
    dmgBonusExternalMult: p.dmgBonusExternalMult,
    dmgBonusSources: p.dmgBonusSources?.length ? p.dmgBonusSources : undefined,
    critRate,
    critDmg: p.critDmg,
    critMult,
    ampBonus: p.ampBonus,
    ampMult,
    ampBonusSources: p.ampBonusSources?.length ? p.ampBonusSources : undefined,
    directMultiplier: p.directMultiplier,
    susceptibility: p.susceptibility,
    susceptMult,
    susceptibilitySources: p.susceptibilitySources?.length ? p.susceptibilitySources : undefined,
    susceptibilityAmplifySources: p.susceptibilityAmplifySources?.length
      ? p.susceptibilityAmplifySources
      : undefined,
    increasedDmgTaken: p.increasedDmgTaken,
    dmgTakenMult,
    increasedDmgTakenSources: p.increasedDmgTakenSources?.length
      ? p.increasedDmgTakenSources
      : undefined,
    dmgTakenExternalMult,
    linkStacks: p.linkStacks,
    linkMult: link,
    enemyDef: p.enemyDef,
    defMult,
    enemyResistance,
    resistanceIgnore: p.resistanceIgnore,
    resistanceIgnoreSources: p.resistanceIgnoreSources?.length
      ? p.resistanceIgnoreSources
      : undefined,
    resistanceShred: p.resistanceShred,
    resistanceShredSources: p.resistanceShredSources?.length
      ? p.resistanceShredSources
      : undefined,
    resMult,
    enemyResMult,
    staggerMult: p.staggerMult,
    finisherMult: p.finisherMult,
    nonCritDamage: Math.floor(shared),
    critDamage: Math.floor(shared * (1 + p.critDmg)),
    expectedDamage: Math.floor(shared * critMult),
  };
}

export function computeHitDamageWithBreakdown(
  hit: {
    multiplier?: number;
    skillType?: string;
    skillId?: string;
    consumedStacks?: Record<string, number>;
    consumedStatEffects?: ConsumedStatEffect[];
  },
  operatorStatus: OperatorStatus,
  enemyDef: number,
  enemyStatus: ComputedEnemyStatus | undefined,
  element: string | undefined,
  staggerMult: number = 1,
  finisherMult: number = 1,
  enemyResistance: number = 0,
  enemyEntries: Parameters<typeof collectEnemyHitModifierSources>[0] = [],
): DamageBreakdown | null {
  if (hit.multiplier == null || hit.multiplier === 0) return null;

  const mods = filterDamageModifiers(
    operatorStatus.damageModifiers ?? [],
    element,
    hit.skillType,
    hit.skillId,
  );

  const stats: MutableDamageStats = {
    attack: operatorStatus.attack,
    critRate: operatorStatus.critRate,
    critDmg: operatorStatus.critDmg,
    ...mods,
    dmgBonusSources: [...mods.dmgBonusSources],
    ampBonusSources: [...mods.ampBonusSources],
    resistanceIgnoreSources: [...mods.resistanceIgnoreSources],
    susceptibilityAmplifySources: [...mods.susceptibilityAmplifySources],
  };

  applyConsumedStatEffects(stats, hit.consumedStatEffects, operatorStatus);

  const elementalSusc =
    element && enemyStatus?.elementalSusceptibility?.[element]
      ? enemyStatus.elementalSusceptibility[element]
      : 0;
  const elementalDmgTaken =
    element && enemyStatus?.elementalIncreasedDmgTaken?.[element]
      ? enemyStatus.elementalIncreasedDmgTaken[element]
      : 0;
  const totalSusc =
    ((enemyStatus?.susceptibility ?? 0) + elementalSusc) * stats.susceptibilityAmplify;
  const dmgTakenExternalMult =
    (enemyStatus?.increasedDmgTakenExternalMult ?? 1) *
    (element ? (enemyStatus?.elementalIncreasedDmgTakenExternalMult?.[element] ?? 1) : 1);

  const enemySources = collectEnemyHitModifierSources(enemyEntries, element);

  return computeExpectedDamageWithBreakdown(
    {
      attack: stats.attack,
      multiplier: hit.multiplier,
      skillType: hit.skillType,
      critRate: stats.critRate,
      critDmg: stats.critDmg,
      dmgBonus: stats.dmgBonus,
      dmgBonusExternalMult: stats.dmgBonusExternalMult,
      dmgBonusSources: stats.dmgBonusSources,
      ampBonus: stats.ampBonus,
      ampBonusSources: stats.ampBonusSources,
      directMultiplier: stats.directMultiplier,
      enemyDef,
      resistanceIgnore: stats.resistanceIgnore,
      resistanceIgnoreSources: stats.resistanceIgnoreSources,
      resistanceShred: enemyStatus?.resistanceShred ?? 0,
      resistanceShredSources: enemySources.resistanceShredSources,
      enemyResistance,
      susceptibility: totalSusc,
      susceptibilitySources: enemySources.susceptibilitySources,
      susceptibilityAmplifySources: stats.susceptibilityAmplifySources,
      increasedDmgTaken: (enemyStatus?.increasedDmgTaken ?? 0) + elementalDmgTaken,
      increasedDmgTakenSources: enemySources.increasedDmgTakenSources,
      dmgTakenExternalMult,
      linkStacks: hit.consumedStacks?.link ?? 0,
      staggerMult,
      finisherMult,
    },
    element,
  );
}

// ─── Reaction damage breakdown ─────────────────────────────────────────────

interface ReactionBreakdownParams {
  hitParams: HitDamageParams;
  levelCoefficient: number;
  artsIntensityMult: number;
  effectivenessMult: number;
  reactionType: string;
  operatorLevel: number;
  artsIntensity: number;
  element?: string;
}

/**
 * Compute reaction damage breakdown.
 * Wraps the standard formula and additionally applies:
 *   levelCoefficient × artsIntensityMult × effectivenessMult
 */
export function computeReactionHitDamageWithBreakdown(p: ReactionBreakdownParams): DamageBreakdown {
  const base = computeExpectedDamageWithBreakdown(p.hitParams, p.element);
  const reactionMult = p.levelCoefficient * p.artsIntensityMult * p.effectivenessMult;

  return {
    ...base,
    isReaction: true,
    reactionType: p.reactionType,
    levelCoefficient: p.levelCoefficient,
    artsIntensityMult: p.artsIntensityMult,
    artsIntensity: p.artsIntensity,
    operatorLevel: p.operatorLevel,
    effectivenessMult: p.effectivenessMult,
    nonCritDamage: Math.floor(base.nonCritDamage * reactionMult),
    critDamage: Math.floor(base.critDamage * reactionMult),
    expectedDamage: Math.floor(base.expectedDamage * reactionMult),
  };
}
