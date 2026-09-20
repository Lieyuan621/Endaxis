import { parseNativeCalculationSource, type NativeCalculationSource } from './calculation.ts';
import {
  nativeActionName,
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNamedOrInteger,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import {
  parseGameplayAttributeModifierEntrySource,
  type AttributeTypeSource,
  type ModifierTypeSource,
  type ModifyAttributeTypeSource,
} from './attributeModifiers.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import { parseTagIdsSource } from './tagQuery.ts';
import { parseSkillCostSource, type SkillCostSource } from './skillCost.ts';

const ACTION_META_FIELDS = [
  '$type',
  'isEnable',
  'priorityLevel',
  'priorityOffset',
  'serverActionIndex',
];
const DAMAGE_UNIT_BASE_FIELDS = [
  'damageType',
  'damageAttributeType',
  'simpleCalculation',
  'atkScale',
  'takeAtkSnapshot',
  'damageDecorateMask',
  'controlEffectRoll',
  'onlyEnableForMainChar',
  'damageProcessors',
  'ignoreDamageImmuneLevel',
  'ignorePoiseImmune',
  'reduceDamageForGuard',
  'reduceDamageForGuardRatio',
  'gainCost',
  'costDataList',
  'playDefaultHitEffect',
  'playHitEffect',
  'effectData',
  'playHitSound',
  'hitSoundData',
  'playHitFlashEffect',
  'hideMainCharHpScreenEffect',
  'hidePoiseUIEffect',
  'enablePoiseBreakTimeDilation',
  'damageVisualImportance',
  'enableDamageVisualCoalition',
  'damageVisualCoalitionGroupKey',
  'alwaysStartNewCoalition',
  'alwaysEndCoalition',
  'updatePositionOnCoalition',
];

export type DamageCostSource = SkillCostSource;

export type DamageProcessorSource =
  | {
      readonly kind: 'instantAttributeModifier';
      readonly targetSide: string;
      readonly modifyAttributeType: ModifyAttributeTypeSource;
      readonly attributeType: AttributeTypeSource;
      readonly formulaItem: ModifierTypeSource;
      readonly parameter: ScalarSource;
    }
  | {
      readonly kind: 'damageScale';
      readonly side: string;
      readonly zoneName: string;
      readonly addition: ScalarSource;
    }
  | {
      /** AfterCalculation 飘字元数据，不修改伤害数值。 */
      readonly kind: 'damageTextPresentation';
      readonly style: string;
      readonly useHpChangeAsDisplayValue: boolean;
    };

export interface DamageUnitSource {
  readonly damageType: string;
  readonly attributeType: string;
  readonly simpleCalculation: boolean;
  readonly attackScale: ScalarSource;
  readonly serializedAttackCalculationPresent: boolean;
  readonly attackCalculation: NativeCalculationSource | null;
  readonly serializedPoiseCalculationPresent: boolean;
  readonly poiseCalculation: NativeCalculationSource | null;
  readonly takeAttackSnapshot: boolean;
  readonly damageDecorateMask: number;
  /** DamageUnit.damageTags 的原生 GameplayTag ID；与 damageDecorateMask 分类位相互独立。 */
  readonly gameplayTagIds: readonly number[];
  readonly controlEffectRoll: boolean;
  readonly onlyEnableForMainOperator: boolean;
  readonly processors: readonly DamageProcessorSource[];
  readonly ignoreDamageImmuneLevel: string;
  readonly ignorePoiseImmune: boolean;
  readonly reduceDamageForGuard: boolean;
  readonly reduceDamageForGuardRatio: number;
  readonly gainCost: boolean;
  readonly costs: readonly DamageCostSource[];
  readonly enablePoiseBreakTimeDilation: boolean;
  readonly visualImportance: string | number;
  readonly visualCoalitionEnabled: boolean;
  readonly visualCoalitionGroupKey: string;
  readonly alwaysStartNewCoalition: boolean;
  readonly alwaysEndCoalition: boolean;
  readonly updatePositionOnCoalition: boolean;
}

export interface DamageActionSource {
  readonly kind: 'damage';
  readonly alwaysNext: boolean;
  readonly attacker: string;
  readonly target: TargetReferenceSource;
  readonly effectSource: TargetReferenceSource;
  readonly hitEnvironment: boolean;
  readonly units: readonly DamageUnitSource[];
}

const ACTION_TARGET_TYPES = [
  'ActionSource',
  'ActionOwner',
  'InputTarget',
  'CurrentTarget',
  'ContextTarget',
  'MainCharacter',
] as const;
const DAMAGE_TYPES = [
  'Physical',
  'Real',
  'Fire',
  'Pulse',
  'Cryst',
  'LifeDrain',
  'Natural',
  'Ether',
] as const;
const DAMAGE_ATTRIBUTE_TYPES = ['Hp', 'Poise'] as const;
const DAMAGE_DECORATE_TYPES = [
  'PoiseBreak',
  'IgnoreGuardDodge',
  'PowerAttack',
  'FireAbnormalInitial',
  'PulseAbnormalInitial',
  'CrystAbnormalInitial',
  'IgniteByMud',
  'NormalAttack',
  'NormalSkill',
  'UltimateSkill',
  'PlungingAttack',
  'Bomb',
  'CanBreakWeakness',
  'ComboSkill',
  'Crush',
  'Airborne',
  'KnockDown',
  'DashAttack',
  'IgnoreDodgeImmune',
  'IgnoreSkillImmune',
  'NaturalAbnormalInitial',
  'NormalAttackLastCombo',
  'FireBurst',
  'CrystBurst',
  'PulseBurst',
  'NaturalBurst',
  'Burning',
  'Shatter',
  'Dot',
  'RemainArea',
  'Fracture',
  'TalentDamage',
] as const;

function parseIndexedEnum(
  value: unknown,
  names: readonly string[],
  path: string,
  nativeName: string,
): string {
  if (typeof value !== 'number') return requireNonEmptyString(value, path);
  const index = requireInteger(value, path);
  const name = names[index];
  if (name === undefined) throw new Error(`${path}: unknown ${nativeName} ${index}`);
  return name;
}

function parseIgnoredDamageImmuneLevel(value: unknown, path: string): string {
  if (value === -1) return 'None';
  return parseIndexedEnum(value, DAMAGE_DECORATE_TYPES, path, 'DamageDecorateType');
}

/** 读取 DamageAction 的原生战斗事实；标准伤害公式兼容性由后续投影层判断。 */
export function parseDamageActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): DamageActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'alwaysNext',
      'attacker',
      'targetSettings',
      'effectSource',
      'damageUnits',
      'hitEnvironment',
      'hitEnvData',
    ]),
    path,
  );
  // hitEnvData 只描述环境命中特效；确认对象存在，但不复制进战斗 IR。
  requireRecord(action.hitEnvData, `${path}.hitEnvData`);
  return {
    kind: 'damage',
    alwaysNext: requireBoolean(action.alwaysNext, `${path}.alwaysNext`),
    attacker: parseIndexedEnum(
      action.attacker,
      ACTION_TARGET_TYPES,
      `${path}.attacker`,
      'ActionTargetType',
    ),
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    effectSource: parseTargetReferenceSource(action.effectSource, `${path}.effectSource`),
    hitEnvironment: requireBoolean(action.hitEnvironment, `${path}.hitEnvironment`),
    units: requireArray(action.damageUnits, `${path}.damageUnits`).map((unit, index) =>
      parseDamageUnitSource(unit, `${path}.damageUnits[${index}]`, inheritedBlackboard),
    ),
  };
}

export function parseDamageUnitSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): DamageUnitSource {
  const unit = requireRecord(value, path);
  const expectedFields = new Set(DAMAGE_UNIT_BASE_FIELDS);
  if ('atkCalculation' in unit) expectedFields.add('atkCalculation');
  if ('poiseCalculation' in unit) expectedFields.add('poiseCalculation');
  if ('damageTags' in unit) expectedFields.add('damageTags');
  requireExactFields(unit, expectedFields, path);
  const gameplayTagIds =
    'damageTags' in unit ? parseTagIdsSource(unit.damageTags, `${path}.damageTags`) : [];
  // 两个字段是完整表现配置；只校验对象存在。
  requireRecord(unit.effectData, `${path}.effectData`);
  requireRecord(unit.hitSoundData, `${path}.hitSoundData`);
  const attributeType = parseIndexedEnum(
    unit.damageAttributeType,
    DAMAGE_ATTRIBUTE_TYPES,
    `${path}.damageAttributeType`,
    'DamageAttributeType',
  );
  const simpleCalculation = requireBoolean(unit.simpleCalculation, `${path}.simpleCalculation`);
  const hasAttackCalculation = 'atkCalculation' in unit && unit.atkCalculation !== null;
  const hasPoiseCalculation = 'poiseCalculation' in unit && unit.poiseCalculation !== null;
  if (hasPoiseCalculation && attributeType === 'Hp') {
    // DamageAction._ProcessDamage branches on damageAttributeType at
    // 0x0353FFE5. The Hp branch never reads the +0x68 poiseCalculation field, but
    // real data may still serialize an inactive calculation object (Gilberta battle skill).
    requireRecord(unit.poiseCalculation, `${path}.poiseCalculation`);
  }
  if (hasAttackCalculation && attributeType === 'Poise') {
    // The Poise branch reads poiseCalculation directly after damageAttributeType
    // dispatch; simpleCalculation and atkCalculation belong to the inactive Hp path.
    requireRecord(unit.atkCalculation, `${path}.atkCalculation`);
  }
  for (const field of [
    'playDefaultHitEffect',
    'playHitEffect',
    'playHitSound',
    'playHitFlashEffect',
    'hideMainCharHpScreenEffect',
    'hidePoiseUIEffect',
  ]) {
    requireBoolean(unit[field], `${path}.${field}`);
  }
  return {
    damageType: parseIndexedEnum(unit.damageType, DAMAGE_TYPES, `${path}.damageType`, 'DamageType'),
    attributeType,
    simpleCalculation,
    attackScale: parseScalarSource(unit.atkScale, `${path}.atkScale`, inheritedBlackboard),
    serializedAttackCalculationPresent: hasAttackCalculation,
    attackCalculation:
      hasAttackCalculation && attributeType === 'Hp' && !simpleCalculation
        ? parseNativeCalculationSource(
            unit.atkCalculation,
            `${path}.atkCalculation`,
            inheritedBlackboard,
          )
        : null,
    serializedPoiseCalculationPresent: hasPoiseCalculation,
    poiseCalculation:
      hasPoiseCalculation && attributeType === 'Poise'
        ? parseNativeCalculationSource(
            unit.poiseCalculation,
            `${path}.poiseCalculation`,
            inheritedBlackboard,
          )
        : null,
    takeAttackSnapshot: requireBoolean(unit.takeAtkSnapshot, `${path}.takeAtkSnapshot`),
    damageDecorateMask: requireNonNegativeInteger(
      unit.damageDecorateMask,
      `${path}.damageDecorateMask`,
    ),
    gameplayTagIds,
    controlEffectRoll: requireBoolean(unit.controlEffectRoll, `${path}.controlEffectRoll`),
    onlyEnableForMainOperator: requireBoolean(
      unit.onlyEnableForMainChar,
      `${path}.onlyEnableForMainChar`,
    ),
    processors: parseDamageProcessors(
      unit.damageProcessors,
      `${path}.damageProcessors`,
      inheritedBlackboard,
    ),
    ignoreDamageImmuneLevel: parseIgnoredDamageImmuneLevel(
      unit.ignoreDamageImmuneLevel,
      `${path}.ignoreDamageImmuneLevel`,
    ),
    ignorePoiseImmune: requireBoolean(unit.ignorePoiseImmune, `${path}.ignorePoiseImmune`),
    reduceDamageForGuard: requireBoolean(unit.reduceDamageForGuard, `${path}.reduceDamageForGuard`),
    reduceDamageForGuardRatio: requireNumber(
      unit.reduceDamageForGuardRatio,
      `${path}.reduceDamageForGuardRatio`,
    ),
    gainCost: requireBoolean(unit.gainCost, `${path}.gainCost`),
    costs: parseDamageCosts(unit.costDataList, `${path}.costDataList`),
    enablePoiseBreakTimeDilation: requireBoolean(
      unit.enablePoiseBreakTimeDilation,
      `${path}.enablePoiseBreakTimeDilation`,
    ),
    visualImportance: requireNamedOrInteger(
      unit.damageVisualImportance,
      `${path}.damageVisualImportance`,
    ),
    visualCoalitionEnabled: requireBoolean(
      unit.enableDamageVisualCoalition,
      `${path}.enableDamageVisualCoalition`,
    ),
    visualCoalitionGroupKey: requireString(
      unit.damageVisualCoalitionGroupKey,
      `${path}.damageVisualCoalitionGroupKey`,
    ),
    alwaysStartNewCoalition: requireBoolean(
      unit.alwaysStartNewCoalition,
      `${path}.alwaysStartNewCoalition`,
    ),
    alwaysEndCoalition: requireBoolean(unit.alwaysEndCoalition, `${path}.alwaysEndCoalition`),
    updatePositionOnCoalition: requireBoolean(
      unit.updatePositionOnCoalition,
      `${path}.updatePositionOnCoalition`,
    ),
  };
}

function parseDamageCosts(value: unknown, path: string): DamageCostSource[] {
  return requireArray(value, path).map((rawCost, index) =>
    parseSkillCostSource(rawCost, `${path}[${index}]`),
  );
}

export function parseDamageProcessors(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): DamageProcessorSource[] {
  return requireArray(value, path).map((rawProcessor, index) => {
    const processorPath = `${path}[${index}]`;
    const processor = requireRecord(rawProcessor, processorPath);
    const sourceType = typeof processor.$type === 'string' ? nativeActionName(processor.$type) : '';
    if (sourceType === 'InstantModifyAttribute') {
      const hasExportedCache =
        'm_attributeModifierLoader' in processor || '<attributeMask>k__BackingField' in processor;
      requireExactFields(
        processor,
        new Set([
          '$type',
          'modifyTargetSide',
          'modifier',
          ...(hasExportedCache
            ? ['m_attributeModifierLoader', '<attributeMask>k__BackingField']
            : []),
        ]),
        processorPath,
      );
      if (hasExportedCache) {
        // 原生每次处理伤害时由 modifier 与当前黑板重新装载缓存；只接受导出器写出的空初态。
        // 此处只处理该原生分支，不能据此忽略真实 modifier 或非空运行状态。
        const loaderPath = `${processorPath}.m_attributeModifierLoader`;
        requireExactFields(
          requireRecord(processor.m_attributeModifierLoader, loaderPath),
          new Set(),
          loaderPath,
        );
        const maskPath = `${processorPath}.<attributeMask>k__BackingField`;
        const mask = requireRecord(processor['<attributeMask>k__BackingField'], maskPath);
        requireExactFields(mask, new Set(['lowerMask', 'higherMask']), maskPath);
        for (const key of ['lowerMask', 'higherMask'] as const) {
          if (requireNumber(mask[key], `${maskPath}.${key}`) !== 0)
            throw new Error(`${maskPath}.${key}: expected empty exported attribute mask`);
        }
      }
      const modifier = requireRecord(processor.modifier, `${processorPath}.modifier`);
      requireExactFields(
        modifier,
        new Set(['modifyAttributeType', 'attributeType', 'formulaItem', 'param']),
        `${processorPath}.modifier`,
      );
      const parsedModifier = parseGameplayAttributeModifierEntrySource(
        modifier,
        `${processorPath}.modifier`,
        inheritedBlackboard,
      );
      return {
        kind: 'instantAttributeModifier',
        targetSide: requireNonEmptyString(
          processor.modifyTargetSide,
          `${processorPath}.modifyTargetSide`,
        ),
        modifyAttributeType: parsedModifier.modifyAttributeType,
        attributeType: parsedModifier.attributeType,
        formulaItem: parsedModifier.formulaItem,
        parameter: parsedModifier.parameter,
      };
    }
    if (sourceType === 'DamageScaleProcessor') {
      requireExactFields(
        processor,
        new Set(['$type', 'side', 'zoneName', 'addition']),
        processorPath,
      );
      return {
        kind: 'damageScale',
        side: requireNonEmptyString(processor.side, `${processorPath}.side`),
        zoneName: requireNonEmptyString(processor.zoneName, `${processorPath}.zoneName`),
        addition: parseScalarSource(
          processor.addition,
          `${processorPath}.addition`,
          inheritedBlackboard,
        ),
      };
    }
    if (sourceType === 'DamageTextProcessor') {
      requireExactFields(
        processor,
        new Set(['$type', 'damageTextStyle', 'useHpChangeAsDisplayValue']),
        processorPath,
      );
      return {
        kind: 'damageTextPresentation',
        style: requireNonEmptyString(processor.damageTextStyle, `${processorPath}.damageTextStyle`),
        useHpChangeAsDisplayValue: requireBoolean(
          processor.useHpChangeAsDisplayValue,
          `${processorPath}.useHpChangeAsDisplayValue`,
        ),
      };
    }
    throw new Error(`${processorPath}: unsupported damage processor ${JSON.stringify(sourceType)}`);
  });
}
