/**
 * Runtime enum arrays for domain primitives.
 * Types are derived from these consts — sheets, editor, and simulation all import here
 * (or via `data/types` re-exports) so UI selects and TypeScript stay aligned.
 */

export const COMBAT_SKILL_TYPES = Object.freeze([
  'basicAttack',
  'battleSkill',
  'comboSkill',
  'ultimate',
] as const);
export type CombatSkillType = (typeof COMBAT_SKILL_TYPES)[number];

export const SKILL_TYPES = Object.freeze([
  ...COMBAT_SKILL_TYPES,
  'finalStrike',
  'dive',
] as const);
export type SkillType = (typeof SKILL_TYPES)[number];

/** Stat / editor scopes beyond `SkillType` (e.g. finisher attribution, non-skill damage). */
export const SKILL_TYPE_SCOPES = Object.freeze([
  ...SKILL_TYPES,
  'finisher',
  'nonSkill',
] as const);
export type SkillTypeScope = (typeof SKILL_TYPE_SCOPES)[number];

export const ARTS_ELEMENTS = Object.freeze(['heat', 'cryo', 'electric', 'nature'] as const);
export type ArtsElement = (typeof ARTS_ELEMENTS)[number];

export const DAMAGE_ELEMENTS = Object.freeze(['physical', ...ARTS_ELEMENTS] as const);
export type DamageElement = (typeof DAMAGE_ELEMENTS)[number];

export const PHYSICAL_STATUS_TYPES = Object.freeze([
  'vulnerability',
  'breach',
  'crush',
  'lift',
  'knockdown',
] as const);
export type PhysicalStatus = (typeof PHYSICAL_STATUS_TYPES)[number];

export const REACTION_TYPES = Object.freeze([
  'combustion',
  'electrification',
  'solidification',
  'corrosion',
] as const);
export type ArtsReaction = (typeof REACTION_TYPES)[number];

/** Hit `treatAsReaction` — arts reactions plus shatter / physical breach|crush. */
export const TREAT_AS_REACTION_TYPES = Object.freeze([
  ...REACTION_TYPES,
  'shatter',
  'breach',
  'crush',
] as const);
export type TreatAsReaction = (typeof TREAT_AS_REACTION_TYPES)[number];

export const STACK_STRATEGIES = Object.freeze([
  'REFRESH_DURATION',
  'INDEPENDENT',
  'REPLACE',
] as const);
export type StackStrategy = (typeof STACK_STRATEGIES)[number];

export const APPLY_TIMINGS = Object.freeze(['afterDamage', 'beforeDamage'] as const);
export type ApplyTiming = (typeof APPLY_TIMINGS)[number];

export const MULTIPLIER_MODES = Object.freeze(['each', 'split'] as const);
export type MultiplierMode = (typeof MULTIPLIER_MODES)[number];

export const CONSUME_SCOPES = Object.freeze(['team'] as const);

export const EFFECT_TARGET_SCOPES = Object.freeze([
  'self',
  'team',
  'teamExcludeSelf',
  'teamExcludeSameElement',
  'enemy',
  'owner',
  'controlled',
] as const);
export type EffectTargetScope = (typeof EFFECT_TARGET_SCOPES)[number];

export const ATTRIBUTES = Object.freeze([
  'strength',
  'agility',
  'intellect',
  'will',
  'main',
  'sub',
] as const);
export type Attribute = (typeof ATTRIBUTES)[number];

export const OPERATOR_CLASSES = Object.freeze([
  'guard',
  'caster',
  'defender',
  'vanguard',
  'supporter',
  'striker',
] as const);
export type OperatorClass = (typeof OPERATOR_CLASSES)[number];

export const EFFECT_CONDITION_KINDS = Object.freeze([
  'enemyStatus',
  'enemyHp',
  'enemyStaggered',
  'operatorStatus',
  'operatorHp',
  'comboNotOnCooldown',
  'actionLinkConsumed',
  'not',
  'or',
] as const);
export type EffectConditionKind = (typeof EFFECT_CONDITION_KINDS)[number];

export const STACKS_COMPARES = Object.freeze(['exact', 'atLeast', 'atMost'] as const);
export const HP_COMPARES = Object.freeze(['above', 'below'] as const);

export const ENEMY_STAT_MODIFIERS = Object.freeze([
  'susceptibility',
  'increasedDmgTaken',
  'resistanceShred',
  'slowed',
  'weaken',
  'inflictionBarrier',
] as const);

export const OPERATOR_STAT_MODIFIERS = Object.freeze([
  'atkPercent',
  'attributeAtkPercent',
  'atkFlat',
  'hpPercent',
  'flatHp',
  'defPercent',
  'flatDef',
  'artsIntensity',
  'ultimateGainEfficiency',
  'ultimateEnergyCostReduction',
  'shield',
  'protection',
  'link',
  'heal',
  'critRate',
  'critDmg',
  'directMultiplier',
  'spRecoveryFlat',
  'spRecoveryPercent',
  'battleSkillSPCostReduction',
  'staggerFlat',
  'staggerPercent',
  'cooldownReductionFlat',
  'cooldownReductionPercent',
  'ampBonus',
  'resistanceIgnore',
  'dmgBonus',
  'susceptibilityAmplify',
  'attributeFlat',
  'attributePercent',
] as const);

export const ATTRIBUTE_STAT_MODIFIERS = Object.freeze([
  'attributeFlat',
  'attributePercent',
] as const);

export const ELEMENT_SCOPED_STAT_MODIFIERS = Object.freeze([
  'ampBonus',
  'resistanceIgnore',
  'dmgBonus',
  'susceptibilityAmplify',
  'susceptibility',
  'increasedDmgTaken',
  'resistanceShred',
  'inflictionBarrier',
] as const);

export const SKILL_SCOPED_STAT_MODIFIERS = Object.freeze([
  'critRate',
  'critDmg',
  'directMultiplier',
  'spRecoveryFlat',
  'spRecoveryPercent',
  'staggerFlat',
  'staggerPercent',
  'cooldownReductionFlat',
  'cooldownReductionPercent',
  'dmgBonus',
  'susceptibilityAmplify',
] as const);

export function isPhysicalStatusType(value: string | null | undefined): boolean {
  return !!value && (PHYSICAL_STATUS_TYPES as readonly string[]).includes(value);
}

export function isReactionType(value: string | null | undefined): boolean {
  return !!value && (REACTION_TYPES as readonly string[]).includes(value);
}

export function isTreatAsReactionType(value: string | null | undefined): boolean {
  return !!value && (TREAT_AS_REACTION_TYPES as readonly string[]).includes(value);
}
