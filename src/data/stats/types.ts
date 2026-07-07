import type {
  OperatorStat,
  EnemyStat,
  EffectStat,
  DamageElement,
  SkillType,
  ResolvedScalingDef,
} from '../types';

// ─── Attributes ────────────────────────────────────────────────────────────

export interface Attributes {
  strength: number;
  agility: number;
  intellect: number;
  will: number;
}

// ─── Base stat values (from operator/weapon sheets at a given level) ───────

export interface BaseStatValues {
  level: number;
  baseAtk: number;
  baseHp: number;
  weaponAtk: number;
  baseAttrs: Attributes;
  mainAttributeName: string;
  secondaryAttributeName: string;
}

// ─── Resolved stat modifier (universal interface) ──────────────────────────

/**
 * A fully resolved, flat stat modifier ready for accumulation.
 *
 * Both sheet effects (after value/level resolution) and simulation effects
 * (from OperatorEffectState.getActiveEntries) produce this same shape.
 *
 * Sheet effects that have ScalingDef are NOT represented here — they are
 * passed as raw StatusEffect objects to computeStats so that attribute-
 * dependent scaling can be resolved with the correct attrs at each time T.
 */
export interface ResolvedStatModifier {
  stat: OperatorStat | EnemyStat;
  /** Fully resolved numeric value (value * stacks for simulation effects). */
  value: number;
  /** Effect ID — used for gear defense identification (id ending with ':defense'). */
  effectId?: string;
  /** Source operator track ID — used for LMDI contribution attribution. */
  sourceId?: string;
  external?: boolean;
}

// ─── Sheet stat effect (input to computeStats) ────────────────────────────

/**
 * A sheet-sourced stat effect that may need attribute/scaling resolution.
 * Extracted from ResolvedStatusEffect — only the fields computeStats needs.
 */
export interface SheetStatEffect {
  stat: EffectStat;
  value?: number;
  scaling?: ResolvedScalingDef;
  id?: string;
  external?: boolean;
}

// ─── Scoped damage modifier ────────────────────────────────────────────────

/**
 * A damage modifier with its full scope preserved.
 * Stored in OperatorStatus output; filtered by the damage calculator at hit time.
 */
export interface ScopedDamageModifier {
  modifier:
    | 'dmgBonus'
    | 'ampBonus'
    | 'directMultiplier'
    | 'resistanceIgnore'
    | 'susceptibilityAmplify';
  value: number;
  elements?: DamageElement | DamageElement[];
  skillTypes?: SkillType | SkillType[] | 'nonSkill';
  skillId?: string | string[];
  external?: boolean;
}
