// @ts-nocheck
import type {
  Effect,
  ResolvedEffect,
  EffectBase,
  EffectStat,
  ArtsElement,
  ArtsReaction,
  PhysicalStatus,
} from './types';
import { i18n } from '@/i18n';
import { EFFECT_COLORS, FALLBACK_EFFECT_COLOR } from '@/utils/theme';

// ─── Preset types ───────────────────────────────────────────────────────────

interface EffectPreset {
  icon: string;
  duration?: number;
  stacks?: number;
  maxStacks?: number;
}

// ─── Status effect presets ───────────────────────────────────────────────────
// Stat-bearing effects are keyed by modifier name (e.g. 'atkPercent', 'ampBonus:heat').
// Pure state effects are keyed by effect id (e.g. 'shield', 'slowed').

const STATUS_PRESETS: Record<string, EffectPreset> = {
  atkPercent: { icon: '/icons/icon_battle_buff_atk_up.webp' },
  atkFlat: { icon: '/icons/icon_battle_buff_atk_up.webp' },
  dmgBonus: { icon: '/icons/icon_battle_buff_atk_up.webp' },
  'dmgBonus:physical': { icon: '/icons/icon_battle_physical_dmg_up.webp' },
  'dmgBonus:arts': { icon: '/icons/icon_battle_spell_up.webp' },
  'dmgBonus:heat': { icon: '/icons/icon_battle_fire_dmg_up.webp' },
  'dmgBonus:cryo': { icon: '/icons/icon_battle_cryst_dmg_up.webp' },
  'dmgBonus:electric': { icon: '/icons/icon_battle_pulse_dmg_up.webp' },
  'dmgBonus:nature': { icon: '/icons/icon_battle_natural_dmg_up.webp' },
  'dmgBonus:basicAttack': { icon: '/icons/icon_normal_atk_efficiency.webp' },
  'dmgBonus:battleSkill': { icon: '/icons/icon_normal_skill_efficiency.webp' },
  'dmgBonus:comboSkill': { icon: '/icons/icon_combo_skill_efficiency.webp' },
  'dmgBonus:ultimate': { icon: '/icons/icon_ultimate_skill_efficiency.webp' },
  directMultiplier: { icon: '/icons/icon_battle_buff_atk_up.webp' },
  critRate: { icon: '/icons/icon_battle_crit_rate_up.webp' },
  critDmg: { icon: '/icons/icon_battle_crit_up.webp' },
  artsIntensity: { icon: '/icons/icon_battle_physical_infliction_up.webp' },
  ampBonus: { icon: '/icons/icon_battle_affix_spell_enhance.webp' },
  'ampBonus:physical': { icon: '/icons/icon_battle_affix_physical_enhance.webp' },
  'ampBonus:arts': { icon: '/icons/icon_battle_affix_spell_enhance.webp' },
  'ampBonus:heat': { icon: '/icons/icon_battle_affix_fire_enhance.webp' },
  'ampBonus:cryo': { icon: '/icons/icon_battle_affix_cryst_enhance.webp' },
  'ampBonus:electric': { icon: '/icons/icon_battle_affix_pulse_enhance.webp' },
  'ampBonus:nature': { icon: '/icons/icon_battle_affix_natural_enhance.webp' },
  susceptibility: { icon: '/icons/icon_battle_affix_vulnerable.webp' },
  'susceptibility:physical': { icon: '/icons/icon_battle_affix_physical_vulnerable.webp' },
  'susceptibility:arts': { icon: '/icons/icon_battle_affix_spell_vulnerable.webp' },
  'susceptibility:heat': { icon: '/icons/icon_battle_affix_fire_vulnerable.webp' },
  'susceptibility:cryo': { icon: '/icons/icon_battle_affix_cryst_vulnerable.webp' },
  'susceptibility:electric': { icon: '/icons/icon_battle_affix_pulse_vulnerable.webp' },
  'susceptibility:nature': { icon: '/icons/icon_battle_affix_natural_vulnerable.webp' },
  'increasedDmgTaken:physical': { icon: '/icons/icon_battle_buff_phy_res_down.webp' },
  'increasedDmgTaken:arts': { icon: '/icons/icon_battle_spell_taken_up.webp' },
  'increasedDmgTaken:heat': { icon: '/icons/icon_battle_fire_taken_up.webp' },
  'increasedDmgTaken:cryo': { icon: '/icons/icon_battle_cryst_taken_up.webp' },
  'increasedDmgTaken:electric': { icon: '/icons/icon_battle_pulse_taken_up.webp' },
  'increasedDmgTaken:nature': { icon: '/icons/icon_battle_nature_taken_up.webp' },
  'resistanceShred:physical': { icon: '/icons/icon_battle_buff_phy_res_down.webp' },
  'resistanceShred:arts': { icon: '/icons/icon_battle_buff_def_down.webp' },
  'resistanceShred:heat': { icon: '/icons/icon_battle_buff_fire_res_down.webp' },
  'resistanceShred:cryo': { icon: '/icons/icon_battle_buff_cryst_res_down.webp' },
  'resistanceShred:electric': { icon: '/icons/icon_battle_buff_pulse_res_down.webp' },
  'resistanceShred:nature': { icon: '/icons/icon_battle_buff_natural_res_down.webp' },
  'resistanceIgnore:physical': { icon: '/icons/icon_battle_buff_phy_res_down.webp' },
  'resistanceIgnore:arts': { icon: '/icons/icon_battle_buff_def_down.webp' },
  'resistanceIgnore:heat': { icon: '/icons/icon_battle_buff_fire_res_down.webp' },
  'resistanceIgnore:cryo': { icon: '/icons/icon_battle_buff_cryst_res_down.webp' },
  'resistanceIgnore:electric': { icon: '/icons/icon_battle_buff_pulse_res_down.webp' },
  'resistanceIgnore:nature': { icon: '/icons/icon_battle_buff_natural_res_down.webp' },
  link: { icon: '/icons/icon_battle_affix_combo.webp', maxStacks: 4 },
  shield: { icon: '/icons/icon_battle_shield.webp' },
  protection: { icon: '/icons/icon_battle_affix_shelter.webp' },
  slowed: { icon: '/icons/icon_battle_affix_slow.webp' },
  weaken: { icon: '/icons/icon_battle_affix_weak.webp' },
  heal: { icon: '/icons/icon_buff_heal.webp' },
};

const ARTS_ELEMENTS = new Set(['heat', 'cryo', 'electric', 'nature']);

function resolveElementKey(elements: unknown): string | null {
  if (!elements) return null;
  const arr = Array.isArray(elements) ? elements : [elements];
  if (arr.length === 0) return null;
  if (arr.every((e: string) => ARTS_ELEMENTS.has(e)) && arr.length > 1) return 'arts';
  return arr[0] as string;
}

function getStatPresetKey(stat: EffectStat): string {
  const { modifier } = stat;
  if ('elements' in stat && stat.elements) {
    const key = resolveElementKey(stat.elements);
    if (key) return `${modifier}:${key}`;
  }
  if ('skillTypes' in stat && stat.skillTypes) {
    const types = stat.skillTypes;
    if (typeof types === 'string') return `${modifier}:${types}`;
    if (Array.isArray(types) && types.length === 1) return `${modifier}:${types[0]}`;
  }
  return modifier;
}

// ─── Infliction presets ─────────────────────────────────────────────────────

const INFLICTION_PRESETS: Record<ArtsElement, EffectPreset> = {
  heat: { icon: '/icons/icon_energy_fusion_fire.webp', duration: 20, maxStacks: 4 },
  electric: { icon: '/icons/icon_energy_fusion_pulse.webp', duration: 20, maxStacks: 4 },
  cryo: { icon: '/icons/icon_energy_fusion_cryst.webp', duration: 20, maxStacks: 4 },
  nature: { icon: '/icons/icon_energy_fusion_nature.webp', duration: 20, maxStacks: 4 },
};

// ─── Burst presets ──────────────────────────────────────────────────────────

const BURST_PRESETS: Record<ArtsElement, EffectPreset> = {
  heat: { icon: '/icons/icon_burst_fusion_fire.webp' },
  electric: { icon: '/icons/icon_burst_fusion_pulse.webp' },
  cryo: { icon: '/icons/icon_burst_fusion_cryst.webp' },
  nature: { icon: '/icons/icon_burst_fusion_nature.webp' },
};

// ─── Reaction presets ───────────────────────────────────────────────────────

const REACTION_PRESETS: Record<ArtsReaction | 'shatter', EffectPreset> = {
  combustion: { icon: '/icons/icon_battle_debuff_burning.webp' },
  electrification: { icon: '/icons/icon_battle_debuff_conduct.webp' },
  corrosion: { icon: '/icons/icon_battle_debuff_corrupt.webp' },
  solidification: { icon: '/icons/icon_battle_debuff_frozen.webp' },
  shatter: { icon: '/icons/icon_battle_debuff_crystbreak.webp', duration: 0 },
};

// ─── Physical status presets ────────────────────────────────────────────────

const PHYSICAL_PRESETS: Record<PhysicalStatus, EffectPreset> = {
  vulnerability: {
    icon: '/icons/icon_battle_physical_no_guard.webp',
    duration: 20,
    maxStacks: 4,
  },
  breach: { icon: '/icons/icon_battle_physical_fracture.webp' },
  crush: { icon: '/icons/icon_battle_physical_crush.webp' },
  knockdown: { icon: '/icons/icon_battle_physical_knockdown.webp', duration: 3 },
  lift: { icon: '/icons/icon_battle_physical_airborne.webp', duration: 3 },
};

// ─── Reaction duration tables (by level 1–4) ───────────────────────────────

const REACTION_DURATIONS: Record<string, number | number[]> = {
  electrification: [12, 18, 24, 30],
  solidification: [6, 7, 8, 9],
  corrosion: 15,
  combustion: 10,
  breach: [12, 18, 24, 30],
};

/** Get the duration for a reaction/debuff at the given level (1-based). */
export function getReactionDuration(type: string, level: number): number {
  const entry = REACTION_DURATIONS[type];
  if (typeof entry === 'number') return entry;
  if (Array.isArray(entry)) return entry[Math.max(0, Math.min(level - 1, entry.length - 1))];
  return 0;
}

const FALLBACK_ICON = '/icons/default_icon.webp';
const DMG_BONUS_DOWN_COLOR = '#b71915';
const DMG_BONUS_DOWN_ICONS: Record<string, string> = {
  physical: '/icons/icon_battle_affix_physical_vulnerable.webp',
  heat: '/icons/icon_battle_affix_fire_vulnerable.webp',
  cryo: '/icons/icon_battle_affix_cryst_vulnerable.webp',
  electric: '/icons/icon_battle_affix_pulse_vulnerable.webp',
  nature: '/icons/icon_battle_affix_natural_vulnerable.webp',
};

const GLOBAL_DEFAULTS = { stacks: 1, maxStacks: 1, stackStrategy: 'REFRESH_DURATION' as const };
const DEFAULT_STACK_STRATEGIES = {
  reaction: 'REPLACE',
} as const;

function isNegativeDmgBonusEffect(effect: Effect | ResolvedEffect): boolean {
  if (effect.kind !== 'status' || effect.stat?.modifier !== 'dmgBonus') return false;
  const values = Array.isArray(effect.value) ? effect.value : [effect.value];
  return values.some(value => Number(value) < 0);
}

function getNegativeDmgBonusLocaleKey(effect: Effect): string {
  if (effect.kind !== 'status' || !effect.stat) return 'dmgBonusDown';
  return getStatPresetKey({ ...effect.stat, modifier: 'dmgBonusDown' } as EffectStat);
}

function getNegativeDmgBonusIcon(effect: Effect): string {
  if (effect.kind !== 'status' || !effect.stat || !('elements' in effect.stat)) {
    return '/icons/icon_battle_affix_shelter.webp';
  }
  const element = resolveElementKey(effect.stat.elements);
  return (element && DMG_BONUS_DOWN_ICONS[element]) || '/icons/icon_battle_affix_shelter.webp';
}

// ─── Resolution functions ───────────────────────────────────────────────────

/**
 * Returns a display key for an effect derived from its type (e.g. `"atkPercent"`, `"vulnerability"`).
 * Used for icon, color, and name resolution. **Display-only — must not be used as a simulation
 * identity key** (ICD clocks, stacking, expiry, status routing). Use `effect.id` for identity.
 */
export function getEffectPresetKey(effect: Effect): string {
  switch (effect.kind) {
    case 'status':
      // Stat-bearing effects derive their display key from the stat (icon, name, color).
      // Pure state effects use their id.
      if (effect.displayType) return effect.displayType;
      if (effect.stat) return getStatPresetKey(effect.stat);
      return effect.id ?? 'status';
    case 'infliction':
      return `${effect.element}_infliction`;
    case 'burst':
      return `${effect.element}_burst`;
    case 'reaction':
      return effect.reactionType;
    case 'physicalStatus':
      return effect.physicalType;
    case 'damageHit':
      return effect.id ?? 'damageHit';
    case 'spRecovery':
      return effect.id ?? 'spRecovery';
    case 'spReturn':
      return effect.id ?? 'spReturn';
    case 'ultEnergyGain':
      return effect.id ?? 'ultEnergyGain';
    case 'consume':
      return effect.id ?? 'consume';
  }
}

export function getEffectIcon(effect: Effect, currentStacks?: number): string {
  if (effect.icon) {
    if (Array.isArray(effect.icon)) {
      const idx = (currentStacks ?? 1) - 1;
      return effect.icon[Math.min(idx, effect.icon.length - 1)] ?? FALLBACK_ICON;
    }
    return effect.icon;
  }

  switch (effect.kind) {
    case 'status':
      if (isNegativeDmgBonusEffect(effect)) return getNegativeDmgBonusIcon(effect);
      return (
        STATUS_PRESETS[effect.stat ? getStatPresetKey(effect.stat) : (effect.id ?? '')]?.icon ??
        FALLBACK_ICON
      );
    case 'infliction':
      return INFLICTION_PRESETS[effect.element]?.icon ?? FALLBACK_ICON;
    case 'burst':
      return BURST_PRESETS[effect.element]?.icon ?? FALLBACK_ICON;
    case 'reaction':
      return REACTION_PRESETS[effect.reactionType]?.icon ?? FALLBACK_ICON;
    case 'physicalStatus':
      return PHYSICAL_PRESETS[effect.physicalType]?.icon ?? FALLBACK_ICON;
    case 'damageHit':
    case 'spRecovery':
    case 'spReturn':
    case 'ultEnergyGain':
    case 'consume':
      return FALLBACK_ICON;
  }
}

export function resolveEffectDefaults(effect: ResolvedEffect): ResolvedEffect;
export function resolveEffectDefaults<T extends Effect>(effect: T): T;
export function resolveEffectDefaults(effect: Effect | ResolvedEffect): Effect | ResolvedEffect {
  let preset: EffectPreset | undefined;
  switch (effect.kind) {
    case 'infliction':
      preset = INFLICTION_PRESETS[effect.element];
      break;
    case 'burst':
      preset = BURST_PRESETS[effect.element];
      break;
    case 'reaction':
      preset = REACTION_PRESETS[effect.reactionType];
      break;
    case 'physicalStatus':
      preset = PHYSICAL_PRESETS[effect.physicalType];
      break;
    case 'status':
      preset = STATUS_PRESETS[effect.stat ? getStatPresetKey(effect.stat) : (effect.id ?? '')];
      break;
    case 'spRecovery':
    case 'spReturn':
    case 'ultEnergyGain':
    case 'damageHit':
    case 'consume':
    case 'cooldownReductionFlat':
    case 'cooldownReductionPercent':
      break;
  }
  const defaults = {
    ...GLOBAL_DEFAULTS,
    ...(preset?.duration !== undefined ? { duration: preset.duration } : {}),
    ...(preset?.stacks !== undefined ? { stacks: preset.stacks } : {}),
    ...(preset?.maxStacks !== undefined ? { maxStacks: preset.maxStacks } : {}),
  };
  return {
    ...defaults,
    ...effect,
  };
}

// ─── Lifecycle resolution ───────────────────────────────────────────────────

interface ResolvedLifecycle {
  duration: number;
  stacks: number;
  maxStacks: number;
  stackStrategy: 'REFRESH_DURATION' | 'INDEPENDENT' | 'REPLACE';
  icd: number;
}

export function getDefaultStackStrategy(
  effect?: Pick<EffectBase, 'kind'>,
): 'REFRESH_DURATION' | 'INDEPENDENT' | 'REPLACE' {
  return (
    DEFAULT_STACK_STRATEGIES[effect?.kind as keyof typeof DEFAULT_STACK_STRATEGIES] ??
    'REFRESH_DURATION'
  );
}

export function resolveEffectLifecycle(effect: EffectBase): ResolvedLifecycle {
  return {
    duration:
      (typeof effect.duration === 'number' ? effect.duration : 0) + (effect.durationExtension ?? 0),
    stacks:
      (effect.stacks === 'fromConsume'
        ? 1
        : Array.isArray(effect.stacks)
          ? effect.stacks[0]
          : effect.stacks) ?? 1,
    maxStacks: (Array.isArray(effect.maxStacks) ? effect.maxStacks[0] : effect.maxStacks) ?? 1,
    stackStrategy: effect.stackStrategy ?? getDefaultStackStrategy(effect),
    icd: effect.icd ?? 0,
  };
}

function getEffectLocaleKey(effect: Effect): string {
  switch (effect.kind) {
    case 'status':
      if (effect.displayType) return effect.displayType;
      if (effect.stat) return getStatPresetKey(effect.stat);
      return effect.id ?? 'status';
    case 'infliction':
      return `${effect.element}_infliction`;
    case 'burst':
      return `${effect.element}_burst`;
    case 'reaction':
      return effect.reactionType;
    case 'physicalStatus':
      return effect.physicalType;
    case 'damageHit':
    case 'spRecovery':
    case 'spReturn':
    case 'ultEnergyGain':
    case 'consume':
      return effect.id ?? effect.kind;
  }
}

export function getEffectName(effect: Effect): string {
  const key =
    effect.name ??
    (isNegativeDmgBonusEffect(effect)
      ? getNegativeDmgBonusLocaleKey(effect)
      : getEffectLocaleKey(effect));
  const { t, te } = i18n.global;
  // Try effects.name.{key} first (short camelCase keys like 'originiumCrystals')
  const effectsLocaleKey = `effects.name.${key}`;
  if (te(effectsLocaleKey)) return t(effectsLocaleKey);
  // Fall back to treating the key as a direct locale path (e.g. talent/potential names)
  if (te(key)) return t(key);
  return key;
}

// ─── Color resolution ───────────────────────────────────────────────────────

export function getEffectColor(effect: Effect): string {
  if (isNegativeDmgBonusEffect(effect)) return DMG_BONUS_DOWN_COLOR;
  const key = getEffectPresetKey(effect);
  return EFFECT_COLORS[key] ?? FALLBACK_EFFECT_COLOR;
}
