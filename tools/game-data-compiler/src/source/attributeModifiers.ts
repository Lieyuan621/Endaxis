import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';

export const MODIFY_ATTRIBUTE_TYPES = ['Specific', 'Main', 'Sub', 'All'] as const;
export type ModifyAttributeTypeSource = (typeof MODIFY_ATTRIBUTE_TYPES)[number];

export const MODIFIER_TYPES = [
  'Addition',
  'Multiplier',
  'FinalAddition',
  'FinalMultiplier',
  'BaseAddition',
  'BaseMultiplier',
  'BaseFinalAddition',
  'BaseFinalMultiplier',
  'None',
  'Enum',
] as const;
export type ModifierTypeSource = (typeof MODIFIER_TYPES)[number];

/** Beyond.GEnums.AttributeType 的 1.4.4 数字顺序；索引就是原生枚举值。 */
export const ATTRIBUTE_TYPES = [
  'Level',
  'MaxHp',
  'Atk',
  'Def',
  'PhysicalDamageTakenScalar',
  'FireDamageTakenScalar',
  'PulseDamageTakenScalar',
  'CrystDamageTakenScalar',
  'Weight',
  'CriticalRate',
  'CriticalDamageIncrease',
  'Hatred',
  'NormalAttackRange',
  'MoveSpeedScalar',
  'TurnRateScalar',
  'AttackRate',
  'SkillCooldownScalar',
  'NormalAttackDamageIncrease',
  'HpRecoveryPerSec',
  'HpRecoveryPerSecByMaxHpRatio',
  'MaxPoise',
  'PoiseRecTime',
  'MaxUltimateSp',
  'ComboSkillCooldownFinalAddition',
  'PoiseDamageTakenScalar',
  'PhysicalInflictionDamageScalar',
  'PoiseDamageOutputScalar',
  'BreakingAttackDamageTakenScalar',
  'UltimateSkillDamageIncrease',
  'HealOutputIncrease',
  'HealTakenIncrease',
  'PoiseRecTimeScalar',
  'NormalSkillDamageIncrease',
  'ComboSkillDamageIncrease',
  'KnockDownTimeAddition',
  'FireBurstDamageIncrease',
  'PulseBurstDamageIncrease',
  'CrystBurstDamageIncrease',
  'NaturalBurstDamageIncrease',
  'Str',
  'Agi',
  'Wisd',
  'Will',
  'LifeSteal',
  'UltimateSpGainScalar',
  'AtbCostAddition',
  'NormalSkillCooldownAddition',
  'ComboSkillCooldownScalar',
  'NaturalDamageTakenScalar',
  'IgniteDamageScalar',
  'PhysicalDamageIncrease',
  'FireDamageIncrease',
  'PulseDamageIncrease',
  'CrystDamageIncrease',
  'NaturalDamageIncrease',
  'EtherDamageIncrease',
  'FireAbnormalDamageIncrease',
  'PulseAbnormalDamageIncrease',
  'CrystAbnormalDamageIncrease',
  'NaturalAbnormalDamageIncrease',
  'EtherDamageTakenScalar',
  'DamageToBrokenUnitIncrease',
  'WeaknessDmgScalar',
  'ShelterDmgScalar',
  'PhysicalEnhancedDmgIncrease',
  'FireEnhancedDmgIncrease',
  'PulseEnhancedDmgIncrease',
  'CrystEnhancedDmgIncrease',
  'NaturalEnhancedDmgIncrease',
  'EtherEnhancedDmgIncrease',
  'PhysicalVulnerableDmgIncrease',
  'FireVulnerableDmgIncrease',
  'PulseVulnerableDmgIncrease',
  'CrystVulnerableDmgIncrease',
  'NaturalVulnerableDmgIncrease',
  'EtherVulnerableDmgIncrease',
  'AtkIncreaseFactorFromStr',
  'AtkIncreaseFactorFromAgi',
  'AtkIncreaseFactorFromWisd',
  'AtkIncreaseFactorFromWill',
  'PhysicalDmgResistScalar',
  'NaturalDmgResistScalar',
  'CrystDmgResistScalar',
  'PulseDmgResistScalar',
  'FireDmgResistScalar',
  'EtherDmgResistScalar',
  'SlowActionSpeedScalar',
  'PhysicalAndSpellInflictionEnhance',
  'ShieldOutputIncrease',
  'ShieldTakenIncrease',
  'NormalAttackStartRange',
  'InAirMoveSpeedScalar',
  'KeywordSpeedUpScalar',
  'ComboSkillCooldownRecoveryScalar',
  'PhysicalResistance',
  'NaturalResistance',
  'CrystResistance',
  'PulseResistance',
  'FireResistance',
  'EtherResistance',
  'ComboSkillCooldownDecrease',
  'Enum',
] as const;
export type AttributeTypeSource = (typeof ATTRIBUTE_TYPES)[number];

/** Buff、CardSkill、武器与装备属性修正共用的枚举身份。 */
export interface AttributeModifierIdentitySource {
  readonly modifyAttributeType: ModifyAttributeTypeSource;
  readonly attributeType: AttributeTypeSource;
  readonly formulaItem: ModifierTypeSource;
}

/** 已选定数值、但尚未解释目标和八槽运行语义的一项属性修正。 */
export interface ResolvedAttributeModifierSource extends AttributeModifierIdentitySource {
  readonly sourcePath: string;
  readonly value: number;
}

/** MemoryPack `Beyond.Gameplay.AttributeModifierData.AttributeModifier`。 */
export interface GameplayAttributeModifierEntrySource extends AttributeModifierIdentitySource {
  readonly parameter: ScalarSource;
}

/**
 * MemoryPack `Beyond.Gameplay.AttributeModifierData`。
 * SkillData.cardAttributeModifier 与 BuffData.attributeModifier 均明确引用该同一个原生类。
 */
export interface GameplayAttributeModifierSource {
  /** 原生容器标记；当前样本均为 false，但不能据此删除字段。 */
  readonly isConvertedAttribute: boolean;
  readonly modifiers: readonly GameplayAttributeModifierEntrySource[];
}

/**
 * 读取 CardSkill 与战斗被动 SkillData 共用的属性修正结构。
 * 参数继续保持直接值、黑板引用与逐等级来源，不在读取层计算角色主副属性映射。
 */
export function parseGameplayAttributeModifierSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): GameplayAttributeModifierSource {
  const container = requireRecord(value, path);
  requireExactFields(container, new Set(['attributeModifiers', 'isConvertedAttribute']), path);
  return {
    isConvertedAttribute: requireBoolean(
      container.isConvertedAttribute,
      `${path}.isConvertedAttribute`,
    ),
    modifiers: requireArray(container.attributeModifiers, `${path}.attributeModifiers`).map(
      (rawModifier, index) =>
        parseGameplayAttributeModifierEntrySource(
          rawModifier,
          `${path}.attributeModifiers[${index}]`,
          inheritedBlackboard,
        ),
    ),
  };
}

/** 读取所有原生即时/常驻处理器共同复用的单项 AttributeModifier。 */
export function parseGameplayAttributeModifierEntrySource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): GameplayAttributeModifierEntrySource {
  const modifier = requireRecord(value, path);
  requireExactFields(
    modifier,
    new Set(['modifyAttributeType', 'attributeType', 'formulaItem', 'param']),
    path,
  );
  return {
    modifyAttributeType:
      typeof modifier.modifyAttributeType === 'number'
        ? parseModifyAttributeTypeValue(modifier.modifyAttributeType, `${path}.modifyAttributeType`)
        : requireEnumName(
            modifier.modifyAttributeType,
            MODIFY_ATTRIBUTE_TYPES,
            `${path}.modifyAttributeType`,
          ),
    attributeType:
      typeof modifier.attributeType === 'number'
        ? parseAttributeTypeValue(modifier.attributeType, `${path}.attributeType`)
        : requireEnumName(modifier.attributeType, ATTRIBUTE_TYPES, `${path}.attributeType`),
    formulaItem:
      typeof modifier.formulaItem === 'number'
        ? parseModifierTypeValue(modifier.formulaItem, `${path}.formulaItem`)
        : requireEnumName(modifier.formulaItem, MODIFIER_TYPES, `${path}.formulaItem`),
    parameter: parseScalarSource(modifier.param, `${path}.param`, inheritedBlackboard),
  };
}

export function parseModifyAttributeTypeValue(
  value: unknown,
  path: string,
): ModifyAttributeTypeSource {
  return requireEnumValue(value, MODIFY_ATTRIBUTE_TYPES, path);
}

export function parseAttributeTypeValue(value: unknown, path: string): AttributeTypeSource {
  return requireEnumValue(value, ATTRIBUTE_TYPES, path);
}

export function parseAttributeTypeName(value: unknown, path: string): AttributeTypeSource {
  return requireEnumName(value, ATTRIBUTE_TYPES, path);
}

/** ModifierType 的原生数值 2 未使用，因此不能直接用数组索引。 */
export function parseModifierTypeValue(value: unknown, path: string): ModifierTypeSource {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${path}: expected integer enum value`);
  }
  const name = new Map<number, ModifierTypeSource>([
    [0, 'Addition'],
    [1, 'Multiplier'],
    [3, 'FinalAddition'],
    [4, 'FinalMultiplier'],
    [5, 'BaseAddition'],
    [6, 'BaseMultiplier'],
    [7, 'BaseFinalAddition'],
    [8, 'BaseFinalMultiplier'],
    [9, 'None'],
    [10, 'Enum'],
  ]).get(value);
  if (name === undefined) {
    throw new Error(`${path}: unknown ModifierType value ${value}`);
  }
  return name;
}

function requireEnumValue<const T extends readonly string[]>(
  value: unknown,
  names: T,
  path: string,
): T[number] {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${path}: expected integer enum value`);
  }
  const name = names[value];
  if (name === undefined) {
    throw new Error(`${path}: unknown enum value ${value}`);
  }
  return name;
}

function requireEnumName<const T extends readonly string[]>(
  value: unknown,
  names: T,
  path: string,
): T[number] {
  const name = requireNonEmptyString(value, path);
  if (!names.includes(name)) {
    throw new Error(`${path}: unknown enum name ${JSON.stringify(name)}`);
  }
  return name as T[number];
}
