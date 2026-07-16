import { getGameAttributeName } from '@/data/gameText';
import { getEffectName } from '@/data/effectPresets';

type TranslateFn = (key: string, named?: Record<string, unknown>) => string;

interface EquipmentStatLike {
  modifier?: string;
  elements?: string | string[] | null;
  skillTypes?: string | string[] | null;
  attribute?: string | string[] | null;
}

interface EquipmentEffectLike {
  stat?: EquipmentStatLike | null;
  [key: string]: unknown;
}

export function normalizeEquipmentStatArray(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

export function normalizeEquipmentAttributeId(attribute: string): string {
  if (attribute === 'main') return 'primary_ability';
  if (attribute === 'sub') return 'secondary_ability';
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

function getEquipmentDmgBonusModifierIds(stat: EquipmentStatLike): string[] {
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
  if (stat.modifier === 'dmgBonus') return getEquipmentDmgBonusModifierIds(stat);

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
  return trOrFallback(
    t,
    `timelineGrid.equipmentDialog.affixFilters.${modifierId}`,
    trOrFallback(t, `stats.${modifierId}`, modifierId),
  );
}

export function formatEquipmentEffectLabel(
  effect: EquipmentEffectLike | null | undefined,
  t: TranslateFn | undefined,
  locale?: string,
): string {
  const stat = effect?.stat;
  if (!stat) return trOrFallback(t, 'common.unknown', 'Unknown');

  const modifierId = getEquipmentEffectModifierIds(stat)[0] || stat.modifier || '';

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

  return (
    getEquipmentModifierLabel(modifierId, t) ||
    getEffectName(effect as unknown as Parameters<typeof getEffectName>[0])
  );
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
