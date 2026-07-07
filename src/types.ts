import type { ScopedDamageModifier } from './data/stats/types';

// ─── Operators ───────────────────────────────────────────────────────────────

export interface OperatorListEntry {
  slug: string;
  rarity: number;
  class: string;
  new?: boolean;
  beta?: boolean;
}

// ─── Operator Instances ──────────────────────────────────────────────────────

export type OperatorLevel = 1 | 20 | 40 | 60 | 80 | 90;

export interface OperatorInstance {
  id: string;
  operatorSlug: string;
  level: OperatorLevel;
  promoted: boolean;
  potential: number;
  skillLevels: Record<string, number>;
  talentStates: Record<string, number>;
  trustLevel: number;
}

// ─── Weapons ─────────────────────────────────────────────────────────────────

export interface WeaponListEntry {
  slug: string;
  rarity: number;
  type: string;
}

export type WeaponLevel = 1 | 20 | 40 | 60 | 80 | 90;

export interface WeaponInstance {
  id: string;
  weaponSlug: string;
  level: WeaponLevel;
  tuned: boolean;
  potential: number;
  skill1Level: number;
  skill2Level: number;
  skill3Level: number;
}

// ─── Gear ────────────────────────────────────────────────────────────────────

export interface GearInstance {
  id: string;
  gearPieceId: string;
  /** Artificing level (0–3) per effect, indexed by position. Missing index = 0. */
  artificingLevels: number[];
}

export interface GearPieceListEntry {
  slug: string;
  slotType: string;
  levelRequirement: number;
  setSlug?: string;
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export interface TeamGearSlots {
  armor: string | null;
  gloves: string | null;
  kit1: string | null;
  kit2: string | null;
}

export interface TeamSlot {
  operatorId: string | null;
  weaponId: string | null;
  gear: TeamGearSlots;
}

export interface TeamInstance {
  id: string;
  name: string;
  slots: [TeamSlot, TeamSlot, TeamSlot, TeamSlot];
}

// ─── Status Snapshots ────────────────────────────────────────────────────────

export interface OperatorStatus {
  // Final computed stats
  attack: number;
  health: number;
  defense: number;
  critRate: number;
  critDmg: number;
  artsIntensity: number;
  ultimateGainEfficiency: number;

  // Attributes (resolved, after all bonuses)
  attributes: {
    strength: number;
    agility: number;
    intellect: number;
    will: number;
  };

  // Main/sub attribute metadata
  mainAttributeName: string;
  secondaryAttributeName: string;
  mainAttribute: number;
  secondaryAttribute: number;

  // Attack subcomponents
  baseAtk: { operator: number; weapon: number };
  atkPercent: number;
  flatAtk: number;

  // Per-attribute ATK coefficients (e.g. main=0.005, sub=0.002, others=0 by default)
  attrAtkCoeff: { strength: number; agility: number; intellect: number; will: number };

  // HP subcomponents
  baseHp: number;
  hpPercent: number;
  flatHp: number;

  // DEF subcomponents
  baseDef: number;
  gearDefense: number;
  defPercent: number;
  flatDef: number;

  // SP recovery modifiers
  spRecoveryFlat: number;
  spRecoveryPercent: number;

  // Ultimate energy modifiers
  ultimateEnergyCostReduction: number;

  // Cooldown reduction (static, from potentials/talents/gear)
  /** Flat seconds removed from comboSkill cooldown. */
  comboCdReductionFlat: number;
  /** Flat seconds removed from ultimate cooldown. */
  ultCdReductionFlat: number;
  /** Percent (0–100) removed from comboSkill cooldown. */
  comboCdReductionPercent: number;
  /** Percent (0–100) removed from ultimate cooldown. */
  ultCdReductionPercent: number;
  /** Standalone multiplicative comboSkill cooldown factor (Π of external `cooldownReductionPercent`); 1 = none. */
  comboCdExternalMult: number;
  /** Standalone multiplicative ultimate cooldown factor (Π of external `cooldownReductionPercent`); 1 = none. */
  ultCdExternalMult: number;

  // Damage modifiers (scoped by element/skill — filtered by damage calculator at hit time)
  damageModifiers: ScopedDamageModifier[];
}

export interface ComputedEnemyStatus {
  susceptibility: number;
  resistanceShred: number;
  defReduction: number;
  increasedDmgTaken: number;
  dmgReductionEffects: number[];
  elementalSusceptibility: Record<string, number>;
  elementalIncreasedDmgTaken: Record<string, number>;
  /** Standalone-multiplicative damage-taken factor (external increasedDmgTaken, e.g. Wrap); 1 = none. */
  increasedDmgTakenExternalMult: number;
  elementalIncreasedDmgTakenExternalMult: Record<string, number>;
}
