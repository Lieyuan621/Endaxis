/**
 * Reaction damage computation utilities.
 *
 * Pure functions for computing reaction multipliers, level coefficients,
 * arts intensity bonuses, and debuff effect enhancement.
 */

// ─── Reaction damage types ─────────────────────────────────────────────────

export type ReactionDamageType =
  | 'electrification'
  | 'corrosion'
  | 'combustion'
  | 'solidification'
  | 'combustion_dot'
  | 'shatter'
  | 'artsBurst'
  | 'knockdown'
  | 'lift'
  | 'breach'
  | 'crush';

// ─── Reaction multiplier constants (percentage values) ─────────────────────

const ARTS_REACTION_INITIAL = 80; // Electrification, Corrosion, Combustion, Solidification
const COMBUSTION_DOT = 12; // Per tick
const SHATTER = 120;
const ARTS_BURST = 160;
const KNOCKDOWN_LIFT = 120;
const BREACH = 50;
const CRUSH = 150;
export const LIFT_KNOCKDOWN_BASE_STAGGER = 10;

// ─── Level coefficient divisors ────────────────────────────────────────────

const ARTS_LEVEL_DIVISOR = 196;
const PHYSICAL_LEVEL_DIVISOR = 392;

const PHYSICAL_REACTIONS: ReadonlySet<ReactionDamageType> = new Set([
  'knockdown',
  'lift',
  'breach',
  'crush',
  'shatter',
]);

// ─── Reaction → damage element mapping ─────────────────────────────────────

const REACTION_ELEMENT: Partial<Record<ReactionDamageType, string>> = {
  electrification: 'electric',
  corrosion: 'nature',
  combustion: 'heat',
  combustion_dot: 'heat',
  solidification: 'cryo',
  shatter: 'physical',
  knockdown: 'physical',
  lift: 'physical',
  breach: 'physical',
  crush: 'physical',
};

// ─── Debuff base values by level (1–4) ─────────────────────────────────────

export const ELECTRIFICATION_DMG_TAKEN: Record<number, number> = { 1: 12, 2: 16, 3: 20, 4: 24 };
export const BREACH_DMG_TAKEN: Record<number, number> = { 1: 12, 2: 16, 3: 20, 4: 24 };

export const CORROSION_INITIAL_SHRED: Record<number, number> = { 1: 3.6, 2: 4.8, 3: 6, 4: 7.2 };
export const CORROSION_PER_SECOND: Record<number, number> = {
  1: 0.84,
  2: 1.12,
  3: 1.4,
  4: 1.68,
};
export const CORROSION_MAX_SHRED: Record<number, number> = { 1: 12, 2: 16, 3: 20, 4: 24 };

/** Next corrosion shred after a 1s tick. Ramps by `perSecond` toward `maxShred`, but never below the
 *  current value — so a re-applied corrosion whose inherited floor is above the new cap stays locked
 *  (never regresses) instead of dropping to that cap. */
export function nextCorrosionShred(current: number, perSecond: number, maxShred: number): number {
  return Math.min(current + perSecond, Math.max(maxShred, current));
}

/** Sum a caster's reaction modifiers from their active status entries, scoped to the reaction being
 *  applied. `durationBonus` is flat seconds (additive); `effectivenessBonus` adds to the effectiveness
 *  multiplier (0.05 = +5%). Only entries whose `reactionType` matches count.
 *  For corrosion, effectivenessBonus only scales the shred cap (max), not initial/per-second.
 *  Fresh corrosion also immediately applies one ramp step (initial+perSecond) at generation. */
export function aggregateReactionMods(
  entries: { stat?: { modifier?: string; reactionType?: string }; value: number; stacks: number }[],
  reactionType: string,
): { durationBonus: number; effectivenessBonus: number } {
  let durationBonus = 0;
  let effectivenessBonus = 0;
  for (const e of entries) {
    if (e.stat?.reactionType !== reactionType) continue;
    if (e.stat.modifier === 'reactionDurationBonus') durationBonus += e.value * e.stacks;
    else if (e.stat.modifier === 'reactionEffectivenessBonus')
      effectivenessBonus += e.value * e.stacks;
  }
  return { durationBonus, effectivenessBonus };
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Get the element of damage dealt by a reaction.
 * Arts burst uses the triggering element; all others have fixed elements.
 */
export function getReactionDamageElement(
  reactionType: ReactionDamageType,
  triggerElement?: string,
): string {
  if (reactionType === 'artsBurst') return triggerElement ?? 'physical';
  return REACTION_ELEMENT[reactionType] ?? 'physical';
}

/**
 * Compute the base damage multiplier (percentage) for a reaction at the given level.
 * Level is the consumed infliction/vulnerability stack count (1–4).
 */
export function getReactionMultiplier(
  reactionType: ReactionDamageType,
  reactionLevel: number,
): number {
  switch (reactionType) {
    case 'electrification':
    case 'corrosion':
    case 'combustion':
    case 'solidification':
      return ARTS_REACTION_INITIAL * (1 + reactionLevel);
    case 'combustion_dot':
      return COMBUSTION_DOT * (1 + reactionLevel);
    case 'shatter':
      return SHATTER * (1 + reactionLevel);
    case 'artsBurst':
      return ARTS_BURST;
    case 'knockdown':
    case 'lift':
      return KNOCKDOWN_LIFT;
    case 'breach':
      return BREACH * (1 + reactionLevel);
    case 'crush':
      return CRUSH * (1 + reactionLevel);
    default:
      return 0;
  }
}

/**
 * Compute the level coefficient for reaction damage.
 * Arts reactions + arts burst: 1 + (level - 1) / 196
 * Physical reactions: 1 + (level - 1) / 392
 */
export function computeLevelCoefficient(
  operatorLevel: number,
  reactionType: ReactionDamageType,
): number {
  const divisor = PHYSICAL_REACTIONS.has(reactionType)
    ? PHYSICAL_LEVEL_DIVISOR
    : ARTS_LEVEL_DIVISOR;
  return 1 + (operatorLevel - 1) / divisor;
}

/**
 * Compute the arts intensity damage multiplier.
 * Each point of arts intensity = +1% damage to all reactions.
 */
export function computeArtsIntensityDamageMult(artsIntensity: number): number {
  return 1 + artsIntensity / 100;
}

/**
 * Compute the arts intensity stagger multiplier for Lift/Knockdown reactions.
 * Half of arts intensity value as percentage increase, multiplicative with staggerPercent.
 * Formula: 1 + artsIntensity / 200
 */
export function computeArtsIntensityStaggerMult(artsIntensity: number): number {
  return 1 + artsIntensity / 200;
}

/**
 * Compute the effect enhancement multiplier for debuff values
 * (Breach phys dmg taken, Electrification arts dmg taken, Corrosion res shred).
 * Formula: (2 * artsIntensity) / (artsIntensity + 300)
 */
export function computeEffectEnhancement(artsIntensity: number): number {
  if (artsIntensity <= 0) return 0;
  return (2 * artsIntensity) / (artsIntensity + 300);
}
