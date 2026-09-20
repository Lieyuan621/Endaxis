import type {
  EquipmentModifierDefinition,
  EquipmentTraitDisplayDefinition,
} from '../../../core/game-data/equipmentDefinition';
import {
  formatEquipmentNumber,
  getEquipmentEffectModifierIds,
  normalizeEquipmentAttributeId,
} from '../../../utils/equipmentEffectDisplay';

export interface EquipmentModifierProjection {
  readonly modifierId: string;
  readonly values: readonly number[];
  readonly percent: boolean;
}

const DAMAGE_SCALE_MODIFIER_IDS = {
  normalAttack: 'attack_dmg_bonus',
  battleSkill: 'skill_dmg_bonus',
  comboSkill: 'link_dmg_bonus',
  ultimate: 'ultimate_dmg_bonus',
  physical: 'physical_dmg',
  heat: 'blaze_dmg',
  electric: 'emag_dmg',
  cryo: 'cold_dmg',
  nature: 'nature_dmg',
  ether: 'arts_dmg',
  staggeredEnemy: 'broken_dmg_bonus',
} as const;

function levelValues(value: number | readonly number[]): readonly number[] {
  return typeof value === 'number' ? [value] : value;
}

/**
 * 把公共配装修正投影成展示语义。这里只转换协议中已经明确的乘区和单位，不读取旧装备表。
 */
export function projectEquipmentModifier(
  modifier: EquipmentModifierDefinition,
): EquipmentModifierProjection {
  if (modifier.kind === 'attribute') {
    return {
      modifierId: normalizeEquipmentAttributeId(modifier.attribute),
      values: levelValues(modifier.value),
      percent: modifier.operation === 'percent',
    };
  }
  if (modifier.kind === 'damageScale') {
    return {
      modifierId: DAMAGE_SCALE_MODIFIER_IDS[modifier.target],
      values: levelValues(modifier.value),
      percent: true,
    };
  }
  if (modifier.kind === 'staticHealingIncrease') {
    return {
      modifierId: 'healing_effect',
      values: levelValues(modifier.value),
      percent: true,
    };
  }
  if (modifier.kind === 'skillCooldownMultiplier') {
    return {
      modifierId: 'link_cd_reduction',
      values: levelValues(modifier.value).map(value => 1 - value),
      percent: true,
    };
  }
  if (modifier.kind === 'damageBonus') {
    return {
      modifierId:
        getEquipmentEffectModifierIds({
          modifier: 'dmgBonus',
          elements:
            typeof modifier.damageTypes === 'string'
              ? modifier.damageTypes
              : [...modifier.damageTypes],
          skillTypes:
            typeof modifier.skillTypes === 'string' || modifier.skillTypes === undefined
              ? modifier.skillTypes
              : [...modifier.skillTypes],
        })[0] ?? 'all_skill_dmg_bonus',
      values: levelValues(modifier.value),
      percent: true,
    };
  }
  const panel = {
    attackFlat: ['attack', false],
    attackPercent: ['attack', true],
    healthFlat: ['hp', false],
    healthPercent: ['hp', true],
    defenseFlat: ['defense', false],
    defensePercent: ['defense', true],
    criticalRate: ['crit_rate', true],
    criticalDamage: ['crit_dmg', true],
    artsIntensity: ['originium_arts_power', false],
    ultimateEnergyGainEfficiency: ['ult_charge_eff', true],
    skillCooldownReduction: ['link_cd_reduction', true],
    staggerDamagePercent: ['stagger_damage', true],
  } as const;
  const [modifierId, percent] = panel[modifier.stat];
  return { modifierId, values: levelValues(modifier.value), percent };
}

/** 只读取装备定义中由 displayAttrModifiers 生成的展示事实。 */
export function projectEquipmentTraitDisplay(
  display: EquipmentTraitDisplayDefinition,
): EquipmentModifierProjection {
  if (display.kind === 'modifier') return projectEquipmentModifier(display.modifier);
  const values = levelValues(display.value);
  const modifierId = {
    cryoAndElectricDamageIncrease: 'cryo_electric_dmg_bonus',
    heatAndNatureDamageIncrease: 'heat_nature_dmg_bonus',
    allSkillDamageIncrease: 'all_skill_dmg_bonus',
    allDamageReduction: 'final_dmg_reduction',
    spellDamageIncrease: 'arts_dmg',
  }[display.composite];
  return {
    modifierId,
    values: display.composite === 'allDamageReduction' ? values.map(value => 1 - value) : values,
    percent: true,
  };
}

export function formatProjectedEquipmentModifierValue(
  projection: EquipmentModifierProjection,
  levelIndex: number,
): string {
  const index = Math.max(0, Math.min(projection.values.length - 1, Math.trunc(levelIndex)));
  const value = projection.values[index] ?? 0;
  const normalized = projection.percent ? value * 100 : value;
  return `+${formatEquipmentNumber(normalized)}${projection.percent ? '%' : ''}`;
}
