import type {
  AttributeTypeSource,
  ResolvedAttributeModifierSource,
} from '../../source/attributeModifiers.ts';
import type {
  AttributeModifierSlot,
  OperatorAttribute,
  LevelValues,
} from '../../../../../packages/game-data-contract/src/index.ts';

// 领域适配器只通过公共编译入口消费规范化属性修正，不直接依赖原生枚举解析模块。
export {
  type AttributeTypeSource,
  type ModifierTypeSource,
  type ModifyAttributeTypeSource,
  type ResolvedAttributeModifierSource,
} from '../../source/attributeModifiers.ts';

export { ATTRIBUTE_MODIFIER_SLOTS } from '../../../../../packages/game-data-contract/src/modifiers.ts';
export type AttributeModifierSlotSource = AttributeModifierSlot;

export type CompiledAttributeModifierTargetSource = 'specific' | 'main' | 'sub' | 'all';
export type ProjectedPrimaryAttributeSource = OperatorAttribute;

const PRIMARY_ATTRIBUTE_KEYS: Readonly<
  Partial<Record<AttributeTypeSource, ProjectedPrimaryAttributeSource>>
> = {
  Str: 'strength',
  Agi: 'agility',
  Wisd: 'intellect',
  Will: 'will',
};

/**
 * 原生 AttributeType 到 Next 战斗属性键的已取证映射。
 * 公共 IR 始终保留原生枚举身份；只有进入 Next 运行时定义时才做投影。
 */
const COMBAT_RUNTIME_ATTRIBUTE_KEYS: Readonly<Partial<Record<AttributeTypeSource, string>>> = {
  ...PRIMARY_ATTRIBUTE_KEYS,
  CriticalRate: 'criticalRate',
  CriticalDamageIncrease: 'criticalDamageIncrease',
  WeaknessDmgScalar: 'weaknessDamageMultiplier',
  ShelterDmgScalar: 'shelterDamageMultiplier',
  HealOutputIncrease: 'healOutputIncrease',
  HealTakenIncrease: 'healTakenIncrease',
  NormalAttackDamageIncrease: 'normalAttackDamageIncrease',
  NormalSkillDamageIncrease: 'normalSkillDamageIncrease',
  ComboSkillDamageIncrease: 'comboSkillDamageIncrease',
  UltimateSkillDamageIncrease: 'ultimateSkillDamageIncrease',
  PhysicalDamageIncrease: 'physicalDamageIncrease',
  FireDamageIncrease: 'heatDamageIncrease',
  PulseDamageIncrease: 'electricDamageIncrease',
  CrystDamageIncrease: 'cryoDamageIncrease',
  NaturalDamageIncrease: 'natureDamageIncrease',
  EtherDamageIncrease: 'etherDamageIncrease',
  FireAbnormalDamageIncrease: 'fireAbnormalDamageIncrease',
  PulseAbnormalDamageIncrease: 'electricAbnormalDamageIncrease',
  CrystAbnormalDamageIncrease: 'cryoAbnormalDamageIncrease',
  NaturalAbnormalDamageIncrease: 'natureAbnormalDamageIncrease',
  FireBurstDamageIncrease: 'fireBurstDamageIncrease',
  PulseBurstDamageIncrease: 'electricBurstDamageIncrease',
  CrystBurstDamageIncrease: 'cryoBurstDamageIncrease',
  NaturalBurstDamageIncrease: 'natureBurstDamageIncrease',
  PhysicalEnhancedDmgIncrease: 'physicalEnhancedDamageIncrease',
  FireEnhancedDmgIncrease: 'heatEnhancedDamageIncrease',
  PulseEnhancedDmgIncrease: 'electricEnhancedDamageIncrease',
  CrystEnhancedDmgIncrease: 'cryoEnhancedDamageIncrease',
  NaturalEnhancedDmgIncrease: 'natureEnhancedDamageIncrease',
  EtherEnhancedDmgIncrease: 'etherEnhancedDamageIncrease',
  // 关键词载体属性进入既有伤害模型的 Vulnerable 区，不新增伤害公式。
  PhysicalVulnerableDmgIncrease: 'physicalVulnerabilityIncrease',
  FireVulnerableDmgIncrease: 'heatVulnerabilityIncrease',
  PulseVulnerableDmgIncrease: 'electricVulnerabilityIncrease',
  CrystVulnerableDmgIncrease: 'cryoVulnerabilityIncrease',
  NaturalVulnerableDmgIncrease: 'natureVulnerabilityIncrease',
  EtherVulnerableDmgIncrease: 'etherVulnerabilityIncrease',
};

export function projectCombatRuntimeAttributeKey(attribute: AttributeTypeSource): string {
  return COMBAT_RUNTIME_ATTRIBUTE_KEYS[attribute] ?? attribute;
}

/**
 * 固定单敌人、零空间模型实际消费的属性边界。公共 IR 仍保留所有原生枚举，只有进入
 * Endaxis Buff 运行定义时才排除纯索敌距离与移动速度；否则它们会伪装成需要战斗属性上下界的数值。
 * 对同一 Buff 中仍影响伤害的生命周期、事件与其他修饰不做连带裁剪。
 */
export function isCombatRuntimeAttributeRelevant(attribute: AttributeTypeSource): boolean {
  return ![
    'NormalAttackRange',
    'NormalAttackStartRange',
    'MoveSpeedScalar',
    'InAirMoveSpeedScalar',
  ].includes(attribute);
}

/** 原生四维 AttributeType 到 Next 稳定主属性键的唯一公共投影。 */
export function projectPrimaryAttributeKey(
  attribute: AttributeTypeSource,
): ProjectedPrimaryAttributeSource | null {
  return PRIMARY_ATTRIBUTE_KEYS[attribute] ?? null;
}

/**
 * 领域无关的静态属性修正程序。声明属性即使在 Main/Sub/All 模式下不参与目标选择也继续保留，
 * 以便审计原始数据，不能因运行时忽略而从公共 IR 删除。
 */
export interface CompiledAttributeModifierSource<Value extends LevelValues = number> {
  readonly sourcePath: string;
  readonly target: CompiledAttributeModifierTargetSource;
  readonly declaredAttributeType: AttributeTypeSource;
  readonly slot: AttributeModifierSlotSource;
  readonly value: Value;
}

export function compileResolvedAttributeModifierSource<Value extends LevelValues>(
  source: Omit<ResolvedAttributeModifierSource, 'value'> & { readonly value: Value },
): CompiledAttributeModifierSource<Value> {
  // 结构与公式槽只解释一次；等级列逐值校验但不展开成多份修正对象。
  const input: LevelValues = source.value;
  const values = typeof input === 'number' ? [input] : input;
  if (values.length === 0 || values.some(value => !Number.isFinite(value))) {
    throw new Error(
      `${source.sourcePath}: attribute modifier value must be finite and level columns must not be empty`,
    );
  }
  return {
    sourcePath: source.sourcePath,
    target: source.modifyAttributeType.toLowerCase() as CompiledAttributeModifierTargetSource,
    declaredAttributeType: source.attributeType,
    slot: compileModifierSlot(source.formulaItem, source.sourcePath),
    value: source.value,
  };
}

/** 按原生 AttributeModifierTargetResolver 展开 Specific/Main/Sub/All。 */
export function resolveCompiledAttributeModifierTargets(
  modifier: CompiledAttributeModifierSource<LevelValues>,
  mainAttribute: AttributeTypeSource | null,
  subAttribute: AttributeTypeSource | null,
): readonly AttributeTypeSource[] {
  switch (modifier.target) {
    case 'specific':
      return [modifier.declaredAttributeType];
    case 'main':
      return mainAttribute === null ? [] : [mainAttribute];
    case 'sub':
      return subAttribute === null ? [] : [subAttribute];
    case 'all':
      return ['Str', 'Agi', 'Wisd', 'Will'];
  }
}

function compileModifierSlot(
  formulaItem: ResolvedAttributeModifierSource['formulaItem'],
  sourcePath: string,
): AttributeModifierSlotSource {
  switch (formulaItem) {
    case 'Addition':
      return 'addition';
    case 'Multiplier':
      return 'multiplier';
    case 'FinalAddition':
      return 'finalAddition';
    case 'FinalMultiplier':
      return 'finalMultiplier';
    case 'BaseAddition':
      return 'baseAddition';
    case 'BaseMultiplier':
      return 'baseMultiplier';
    case 'BaseFinalAddition':
      return 'baseFinalAddition';
    case 'BaseFinalMultiplier':
      return 'baseFinalMultiplier';
    case 'None':
    case 'Enum':
      throw new Error(`${sourcePath}: ModifierType ${formulaItem} is not a numeric formula slot`);
  }
}
