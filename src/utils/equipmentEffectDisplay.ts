import { getGameAttributeName } from '@/data/gameText';

type TranslateFn = (key: string, named?: Record<string, unknown>) => string;

/**
 * 装备/武器静态属性的 UI 语义图标。这里返回 null 而不是默认图，确保新增 modifier 不会被
 * “看起来能显示”掩盖；调用方应把 null 作为待补映射诊断或使用无图标表现。
 */
export const EQUIPMENT_MODIFIER_ICON_PATHS: Readonly<Record<string, string>> = Object.freeze({
  primary_ability: '/icons/icon_battle_primary_attribute_all_up.webp',
  secondary_ability: '/icons/icon_battle_primary_attribute_all_up.webp',
  strength: '/icons/icon_attribute_str.webp',
  agility: '/icons/icon_attribute_agi.webp',
  intellect: '/icons/icon_attribute_wisd.webp',
  will: '/icons/icon_attribute_will.webp',
  attack: '/icons/icon_battle_buff_atk_up.webp',
  hp: '/icons/icon_attribute_maxHp.webp',
  crit_rate: '/icons/icon_attribute_criticalRate.webp',
  crit_dmg: '/icons/icon_attribute_criticalDamageIncrease.webp',
  blaze_dmg: '/icons/icon_battle_fire_dmg_up.webp',
  emag_dmg: '/icons/icon_battle_pulse_dmg_up.webp',
  cold_dmg: '/icons/icon_battle_cryst_dmg_up.webp',
  nature_dmg: '/icons/icon_battle_natural_dmg_up.webp',
  physical_dmg: '/icons/icon_physical_damage_increase.webp',
  arts_dmg: '/icons/icon_battle_spell_up.webp',
  attack_dmg_bonus: '/icons/icon_normal_atk_efficiency.webp',
  skill_dmg_bonus: '/icons/icon_normal_skill_efficiency.webp',
  link_dmg_bonus: '/icons/icon_comboskill_cooldown_scalar.webp',
  ultimate_dmg_bonus: '/icons/icon_ultimate_skill_efficiency.webp',
  all_skill_dmg_bonus: '/icons/icon_battle_affix_enhance.webp',
  broken_dmg_bonus: '/icons/icon_attr_damage_to_broken_unit_increase.webp',
  healing_effect: '/icons/icon_heal_output_increase.webp',
  final_dmg_reduction: '/icons/icon_battle_affix_shelter.webp',
  originium_arts_power: '/icons/icon_originium_arts.webp',
  ult_charge_eff: '/icons/icon_ultimate_sp_gain_scalar.webp',
  link_cd_reduction: '/icons/icon_comboskill_cooldown_scalar.webp',
  susceptibility: '/icons/icon_battle_affix_vulnerable.webp',
  susceptibility_physical: '/icons/icon_battle_affix_physical_vulnerable.webp',
  susceptibility_heat: '/icons/icon_battle_affix_fire_vulnerable.webp',
  susceptibility_cryo: '/icons/icon_battle_affix_cryst_vulnerable.webp',
  susceptibility_electric: '/icons/icon_battle_affix_pulse_vulnerable.webp',
  susceptibility_nature: '/icons/icon_battle_affix_natural_vulnerable.webp',
});

export function getEquipmentModifierIconPath(modifierId: string): string | null {
  return EQUIPMENT_MODIFIER_ICON_PATHS[modifierId] ?? null;
}

interface EquipmentStatLike {
  modifier?: string;
  elements?: string | string[] | null;
  skillTypes?: string | string[] | null;
  attribute?: string | string[] | null;
}

interface EquipmentEffectLike {
  stat?: EquipmentStatLike | null;
  condition?: { kind?: string } | null;
  [key: string]: unknown;
}

export function normalizeEquipmentStatArray(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

export function normalizeEquipmentAttributeId(attribute: string): string {
  if (attribute === 'main') return 'primary_ability';
  if (attribute === 'sub' || attribute === 'secondary') return 'secondary_ability';
  if (['strength', 'agility', 'intellect', 'will'].includes(attribute)) return attribute;
  return '';
}

function getEquipmentElementPairId(elements: string[]): string {
  const set = new Set(elements);
  if (set.size !== 2) return '';
  if (set.has('heat') && set.has('nature')) return 'heat_nature_dmg_bonus';
  if (set.has('cryo') && set.has('electric')) return 'cryo_electric_dmg_bonus';
  return '';
}

function sameEquipmentValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Collapse paired element dmgBonus lines (heat+nature / cryo+electric) that share the
 * same value array into a single effect with `elements: [a, b]` for display.
 */
export function mergeEquipmentElementPairEffects<T extends EquipmentEffectLike>(
  effects: T[] | null | undefined,
): T[] {
  const list = Array.isArray(effects) ? effects : [];
  const out: T[] = [];
  const used = new Set<number>();

  list.forEach((effect, index) => {
    if (used.has(index)) return;

    const stat = effect?.stat;
    const element = typeof stat?.elements === 'string' ? stat.elements : '';
    if (stat?.modifier !== 'dmgBonus' || !element) {
      out.push(effect);
      return;
    }

    const pairIndex = list.findIndex((candidate, candidateIndex) => {
      if (candidateIndex <= index || used.has(candidateIndex)) return false;
      const candidateStat = candidate?.stat;
      if (candidateStat?.modifier !== 'dmgBonus') return false;
      const candidateElement =
        typeof candidateStat?.elements === 'string' ? candidateStat.elements : '';
      if (!candidateElement) return false;
      if (!sameEquipmentValue(effect.value, candidate.value)) return false;
      return !!getEquipmentElementPairId([element, candidateElement]);
    });

    if (pairIndex < 0) {
      out.push(effect);
      return;
    }

    used.add(index);
    used.add(pairIndex);
    const pairedElement = list[pairIndex]!.stat!.elements as string;
    out.push({
      ...effect,
      stat: {
        ...stat,
        elements: [element, pairedElement],
      },
    });
  });

  return out;
}

function isEquipmentArtsDmgElements(elements: string | string[] | null | undefined): boolean {
  const set = new Set(normalizeEquipmentStatArray(elements));
  return (
    set.size === 4 && set.has('heat') && set.has('cryo') && set.has('electric') && set.has('nature')
  );
}

const ELEMENT_DMG_MODIFIER_IDS: Record<string, string> = {
  physical: 'physical_dmg',
  heat: 'blaze_dmg',
  cryo: 'cold_dmg',
  electric: 'emag_dmg',
  nature: 'nature_dmg',
};

const SKILL_TYPE_DMG_MODIFIER_IDS: Record<string, string> = {
  basicAttack: 'attack_dmg_bonus',
  battleSkill: 'skill_dmg_bonus',
  comboSkill: 'link_dmg_bonus',
  ultimate: 'ultimate_dmg_bonus',
};

function getEquipmentDmgBonusModifierIds(
  stat: EquipmentStatLike,
  condition?: { kind?: string } | null,
): string[] {
  if (condition?.kind === 'enemyStaggered') return ['broken_dmg_bonus'];

  const elements = normalizeEquipmentStatArray(stat?.elements);

  if (elements.length > 0) {
    if (isEquipmentArtsDmgElements(elements)) {
      return ['arts_dmg'];
    }

    const pairId = getEquipmentElementPairId(elements);
    if (pairId) return [pairId];

    const mapped = elements
      .map(element => ELEMENT_DMG_MODIFIER_IDS[element])
      .filter((id): id is string => Boolean(id));

    return mapped.length > 0 ? mapped : ['all_skill_dmg_bonus'];
  }

  const skillTypes = normalizeEquipmentStatArray(stat?.skillTypes);

  if (skillTypes.length > 0) {
    if (skillTypes.length === 1) {
      return [SKILL_TYPE_DMG_MODIFIER_IDS[skillTypes[0]!] || 'all_skill_dmg_bonus'];
    }

    if (
      skillTypes.includes('battleSkill') &&
      skillTypes.includes('comboSkill') &&
      skillTypes.includes('ultimate')
    ) {
      return ['all_skill_dmg_bonus'];
    }
  }

  return ['all_skill_dmg_bonus'];
}

export function getEquipmentEffectModifierIds(
  stat: EquipmentStatLike | null | undefined,
  condition?: { kind?: string } | null,
): string[] {
  if (!stat?.modifier) return [];

  if (stat.modifier === 'attributeFlat' || stat.modifier === 'attributePercent') {
    return normalizeEquipmentStatArray(stat.attribute)
      .map(normalizeEquipmentAttributeId)
      .filter(Boolean);
  }

  if (stat.modifier === 'atkFlat' || stat.modifier === 'atkPercent') return ['attack'];
  if (stat.modifier === 'flatHp' || stat.modifier === 'hpPercent') return ['hp'];
  if (stat.modifier === 'critRate') return ['crit_rate'];
  if (stat.modifier === 'critDmg') return ['crit_dmg'];
  if (stat.modifier === 'artsIntensity') return ['originium_arts_power'];
  if (stat.modifier === 'ultimateGainEfficiency') return ['ult_charge_eff'];
  if (stat.modifier === 'heal') return ['healing_effect'];
  if (stat.modifier === 'protection') return ['final_dmg_reduction'];
  if (stat.modifier === 'dmgBonus') return getEquipmentDmgBonusModifierIds(stat, condition);

  if (stat.modifier === 'susceptibility') {
    const elements = normalizeEquipmentStatArray(stat.elements);
    return elements.length > 0
      ? elements.map(element => `susceptibility_${element}`)
      : ['susceptibility'];
  }

  return [stat.modifier];
}

function trOrFallback(t: TranslateFn | undefined, key: string, fallback: string): string {
  const out = typeof t === 'function' ? t(key) : key;
  return out === key ? fallback : out;
}

export function getEquipmentModifierLabel(modifierId: string, t: TranslateFn | undefined): string {
  const filterKey = `timelineGrid.equipmentDialog.affixFilters.${modifierId}`;
  const filterLabel = typeof t === 'function' ? t(filterKey) : filterKey;
  if (filterLabel !== filterKey) return filterLabel;
  return trOrFallback(t, `stats.${modifierId}`, modifierId);
}

export function formatEquipmentEffectLabel(
  effect: EquipmentEffectLike | null | undefined,
  t: TranslateFn | undefined,
  locale?: string,
): string {
  const stat = effect?.stat;
  if (!stat) return trOrFallback(t, 'common.unknown', 'Unknown');

  const modifierId =
    getEquipmentEffectModifierIds(stat, effect?.condition)[0] || stat.modifier || '';

  if (stat.modifier === 'attributeFlat' || stat.modifier === 'attributePercent') {
    const attr = normalizeEquipmentStatArray(stat.attribute)[0];
    const normalizedAttr = normalizeEquipmentAttributeId(attr ?? '');

    if (normalizedAttr === 'primary_ability' || normalizedAttr === 'secondary_ability') {
      return getEquipmentModifierLabel(normalizedAttr, t);
    }

    if (attr) return getGameAttributeName(attr, locale);
  }

  if (stat.modifier === 'dmgBonus') {
    return getEquipmentModifierLabel(modifierId, t);
  }

  if (stat.modifier === 'susceptibility') {
    const elements = normalizeEquipmentStatArray(stat.elements);

    if (elements.length === 1) {
      return trOrFallback(
        t,
        `game.stat.susceptibility:${elements[0]}`,
        trOrFallback(t, 'game.stat.susceptibility', '脆弱'),
      );
    }

    return trOrFallback(t, 'game.stat.susceptibility', '脆弱');
  }

  if (stat.modifier === 'artsIntensity')
    return getEquipmentModifierLabel('originium_arts_power', t);
  if (stat.modifier === 'ultimateGainEfficiency')
    return getEquipmentModifierLabel('ult_charge_eff', t);
  if (stat.modifier === 'heal') return getEquipmentModifierLabel('healing_effect', t);
  if (stat.modifier === 'protection') return getEquipmentModifierLabel('final_dmg_reduction', t);

  return getEquipmentModifierLabel(modifierId, t);
}

export function equipmentValueNeedsPercent(stat: EquipmentStatLike | null | undefined): boolean {
  return [
    'attributePercent',
    'atkPercent',
    'hpPercent',
    'critRate',
    'critDmg',
    'dmgBonus',
    'ultimateGainEfficiency',
    'susceptibility',
    'heal',
    'protection',
  ].includes(stat?.modifier ?? '');
}

export function formatEquipmentNumber(value: unknown): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? '');
  if (Math.abs(num - Math.round(num)) < 0.0001) return String(Math.round(num));
  return num.toFixed(1).replace(/\.0$/, '');
}

export function formatEquipmentEffectStatValue(
  effect: EquipmentEffectLike | null | undefined,
  value: unknown,
): string {
  const suffix = equipmentValueNeedsPercent(effect?.stat) ? '%' : '';
  return `${formatEquipmentNumber(value)}${suffix}`;
}
