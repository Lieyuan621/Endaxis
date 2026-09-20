import type { GearDefinition } from '../../../core/game-data/equipmentDefinition';
import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
import { getGearDefinitionSelectionAffixRows } from './gearAffixPresentation';

export interface GearAffixFilterOption {
  readonly value: string;
  readonly accent: string;
}

export interface GearAffixFilterGroup {
  readonly key: string;
  readonly items: readonly GearAffixFilterOption[];
}

/**
 * 词条筛选的视觉分组沿用旧版已经验证过的认知顺序；匹配数据则完全来自当前 GearDefinition，
 * 不读取旧装备模板，也不让展示分组参与模拟。
 */
export const GEAR_AFFIX_FILTER_GROUPS = Object.freeze([
  {
    key: 'elementDamage',
    items: [
      { value: 'arts_dmg', accent: '#ef4444' },
      { value: 'cryo_electric_dmg_bonus', accent: '#ef4444' },
      { value: 'heat_nature_dmg_bonus', accent: '#ef4444' },
      { value: 'physical_dmg', accent: '#ef4444' },
    ],
  },
  {
    key: 'skillDamage',
    items: [
      { value: 'all_skill_dmg_bonus', accent: '#ef4444' },
      { value: 'attack_dmg_bonus', accent: '#fde68a' },
      { value: 'skill_dmg_bonus', accent: '#93c5fd' },
      { value: 'link_dmg_bonus', accent: '#facc15' },
      { value: 'ultimate_dmg_bonus', accent: '#38bdf8' },
    ],
  },
  { key: 'brokenDamage', items: [{ value: 'broken_dmg_bonus', accent: '#fb7185' }] },
  {
    key: 'ability',
    items: [
      { value: 'primary_ability', accent: '#a3e635' },
      { value: 'secondary_ability', accent: '#84cc16' },
    ],
  },
  { key: 'attack', items: [{ value: 'attack', accent: '#991b1b' }] },
  { key: 'crit', items: [{ value: 'crit_rate', accent: '#f43f5e' }] },
  { key: 'artsPower', items: [{ value: 'originium_arts_power', accent: '#a78bfa' }] },
  { key: 'ultimateCharge', items: [{ value: 'ult_charge_eff', accent: '#38bdf8' }] },
  {
    key: 'survival',
    items: [
      { value: 'hp', accent: '#4ade80' },
      { value: 'final_dmg_reduction', accent: '#4ade80' },
      { value: 'healing_effect', accent: '#4ade80' },
    ],
  },
] satisfies readonly GearAffixFilterGroup[]);

export function getGearAffixModifierIds(
  definition: GearDefinition,
  t: (key: string, named?: Record<string, unknown>) => string,
): ReadonlySet<string> {
  return new Set(getGearDefinitionSelectionAffixRows(definition, t).map(row => row.modifierId));
}

export function gearMatchesAffixFilter(
  definition: GearDefinition,
  filterId: string,
  t: (key: string, named?: Record<string, unknown>) => string,
): boolean {
  return filterId === 'ALL' || getGearAffixModifierIds(definition, t).has(filterId);
}

export function gearMatchesOperatorAttributes(
  definition: GearDefinition,
  operator: OperatorDefinition | null | undefined,
): boolean {
  if (!operator) return false;
  const attributeModifiers = definition.traits.flatMap(trait =>
    (trait.modifiers ?? []).filter(modifier => modifier.kind === 'attribute'),
  );
  if (attributeModifiers.length === 0) return false;

  let primaryMatched = false;
  let secondaryMatched = false;
  for (const modifier of attributeModifiers) {
    const primary = modifier.attribute === 'main' || modifier.attribute === operator.mainAttribute;
    const secondary =
      modifier.attribute === 'secondary' || modifier.attribute === operator.secondaryAttribute;
    if (!primary && !secondary) return false;
    primaryMatched ||= primary;
    secondaryMatched ||= secondary;
  }

  return (
    (primaryMatched && secondaryMatched) || (attributeModifiers.length === 1 && primaryMatched)
  );
}
