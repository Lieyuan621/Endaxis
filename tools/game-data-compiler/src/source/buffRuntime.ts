import {
  parseGameplayAttributeModifierEntrySource,
  parseGameplayAttributeModifierSource,
  parseAttributeTypeName,
  type GameplayAttributeModifierEntrySource,
  type GameplayAttributeModifierSource,
} from './attributeModifiers.ts';
import { numericDeclaredBlackboard } from './blackboard.ts';
import { readHealModifierSide, readModifierSide } from './nativeEnums.ts';
import {
  parseKnownNativeBuffActionGraphSource,
  type BuffActionGraphSource,
} from './buffActionGraph.ts';
import type { KnownNativeActionLeafSource } from './actionLeaf.ts';
import { parseKnownNativeActionLeafSource } from './actionLeaf.ts';
import { parseDamageProcessors, type DamageProcessorSource } from './damageActions.ts';
import { parseEffectActionSource } from './presentationActions.ts';
import { parseNativeSequenceSource, type NativeSequenceSource } from './controlFlow.ts';
import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import {
  parseIntegerScalarSource,
  parseScalarSource,
  type BlackboardLevelValues,
  type IntegerScalarSource,
  type ScalarSource,
} from './scalar.ts';

export const BUFF_STACKING_TYPES = [
  /** 每次施加都创建并启用一个独立实例，不限制同时存在的数量。 */
  'Unlimited',
  /** 保留所有实例，但同组仅启用优先级最高的一个；最高项结束后自动启用下一项。 */
  'HighPriority',
  /** 每次施加创建一个独立层；达到最大层数后先结束组内最低优先项。 */
  'Stack',
  /** 复用现有实例并增加强化层数，上限由 maxStackCount 决定，不改变剩余时长。 */
  'Enhance',
  /** 复用现有实例，不加层；仅在新时长更长时更新剩余时长。 */
  'Refresh',
  /** 复用现有实例，不加层；把新时长累加到当前剩余时长。 */
  'Extend',
  /** 复用现有实例，不加层、不改时长；合并输入黑板并重算属性修正。 */
  'Modify',
  /** 同组已有实例时拒绝本次施加，已有实例保持不变。 */
  'Unique',
  /** 复用现有实例并增加强化层数，同时仅在新时长更长时更新剩余时长。 */
  'EnhanceAndRefresh',
  /** 复用现有实例，不加层；用新时长直接替换当前剩余时长。 */
  'OverwriteDuration',
  /** 复用现有实例并增加强化层数，同时用新时长直接替换当前剩余时长。 */
  'EnhanceAndOverwriteDuration',
  /** 保留所有实例，并按优先级只启用 maxStackCount 个；超出的实例停用但不结束。 */
  'HighPriorityWithMaxStack',
  /** 复用单个强化实例；配置时长作为自动加层周期，直至 maxStackCount。 */
  'TimedGrowingEnhance',
] as const;
export type BuffStackingTypeSource = (typeof BUFF_STACKING_TYPES)[number];

const TIMELINE_AVAILABLE_BUFF_STACKING_TYPES: ReadonlySet<BuffStackingTypeSource> = new Set([
  'Unlimited',
  'Stack',
  'Unique',
]);

/**
 * 原生 BuffData.showTimelineActions 只对 BuffStackingSettings 静态数组中的
 * Unlimited、Stack 和 Unique 返回 true；其他叠加类型不会把 timelineActions
 * 交给 Buff 的 TimelineActionProcessor。
 */
export function buffShowsTimelineActions(source: BuffRuntimeSource): boolean {
  return TIMELINE_AVAILABLE_BUFF_STACKING_TYPES.has(source.lifecycle.stackingType);
}

export interface BuffPresentationSource {
  readonly hasIcon: boolean;
  readonly spritePath: string;
  readonly showInHeadBarCommon: boolean;
  readonly showInHeadBarAttached: boolean;
  readonly showInSquadIcon: boolean;
  readonly onlyShowForMainCharacter: boolean;
  readonly blinkInMainCharHpBar: boolean;
  readonly showProgressInHpBar: boolean;
  readonly showProgressInNormalSkillButton: boolean;
  readonly useWeakProgressInNormalSkillButton: boolean;
  readonly showProgressInUltimateSkillButton: boolean;
  readonly forceRaiseIconEvent: boolean;
  readonly showWarningBackground: boolean;
  readonly playStrongInAnimation: boolean;
  readonly hasCharHpBarVfxType: boolean;
  readonly charHpBarVfxType: string;
  readonly iconStyleInSquad: string;
  readonly abnormalColorType: string;
  readonly orderUseDirectoryValue: boolean;
  readonly orderPriorityValue: number;
  readonly orderPriorityEnum: string;
}

export interface BuffLifecycleSource {
  readonly addingCooldown: ScalarSource | null;
  readonly ignoreAddingCooldown: boolean;
  readonly lifeType: 'Limited' | 'Infinity';
  readonly duration: ScalarSource;
  readonly triggerInterval: ScalarSource;
  readonly waitFirstTriggerInterval: boolean;
  readonly maxTriggerCount: ScalarSource;
  readonly stackingIdentifierType: 'Id' | 'StackingKey';
  readonly stackingType: BuffStackingTypeSource;
  readonly stackingKey: string;
  readonly priority: ScalarSource;
  readonly negatePriority: boolean;
  readonly maxStackCount: ScalarSource;
  readonly needsStackEffect: boolean;
  readonly stackEffectCount: number;
  /** 原生 stackingSettings.stackEffects 的类型化表现槽；当前导出结构只允许 EffectAction。 */
  readonly stackEffectActionTypes: readonly 'EffectAction'[];
}

export interface UnsupportedBuffPayloadSource {
  readonly field: string;
  readonly entryCount: number;
}

export interface BuffDamageModifierSource {
  readonly enabledSide: string;
  readonly condition: NativeSequenceSource<KnownNativeActionLeafSource>;
  readonly processors: readonly DamageProcessorSource[];
}

export interface BuffHealModifierSource {
  readonly enabledSide: string;
  readonly condition: NativeSequenceSource<KnownNativeActionLeafSource>;
  readonly processors: readonly (
    | {
        readonly kind: 'instantAttribute';
        readonly modifyTargetSide: string;
        readonly modifier: GameplayAttributeModifierEntrySource;
      }
    | {
        readonly kind: 'modifyCalculationResult';
        readonly baseMultiplier: ScalarSource;
        readonly multiplierCount: ScalarSource;
      }
  )[];
}

export interface BuffPoiseModifierSource {
  readonly enabledSide: string;
  readonly condition: NativeSequenceSource<KnownNativeActionLeafSource>;
  readonly processors: readonly {
    readonly kind: 'instantAttribute';
    readonly modifyTargetSide: string;
    readonly modifier: GameplayAttributeModifierEntrySource;
  }[];
}

export interface BuffShieldSource {
  readonly infinityValue: boolean;
  readonly value:
    | {
        readonly kind: 'definite';
        readonly value: ScalarSource;
        readonly applyScale: boolean;
        readonly valueScale: ScalarSource;
      }
    | {
        readonly kind: 'attribute';
        readonly valueSource: string;
        readonly attributeType: import('./attributeModifiers.ts').AttributeTypeSource;
        readonly multiplier: ScalarSource;
        readonly addition: ScalarSource;
      };
  readonly damageAbsorptions: readonly {
    readonly damageType: string;
    readonly ratio: ScalarSource;
    readonly scale: ScalarSource;
  }[];
  readonly absorbCount: IntegerScalarSource;
  readonly absorbAllDamageWhenConsumed: boolean;
  readonly removeBuffWhenConsumed: boolean;
  readonly priority: string;
  readonly replaceHitEffect: boolean;
}

/**
 * BuffData 的公共、可审计运行时切片。根字段先由动作图读取器做精确校验；这里再保留生命
 * 周期、图标、标签和属性修正，并把尚未结构化的非空载荷显式列出。
 */
export interface BuffRuntimeSource {
  readonly graph: BuffActionGraphSource<KnownNativeActionLeafSource>;
  readonly presentation: BuffPresentationSource;
  readonly lifecycle: BuffLifecycleSource;
  readonly attributeModifiers: GameplayAttributeModifierSource;
  readonly damageModifiers: readonly BuffDamageModifierSource[];
  readonly healModifiers: readonly BuffHealModifierSource[];
  readonly poiseModifiers: readonly BuffPoiseModifierSource[];
  readonly shields: readonly BuffShieldSource[];
  readonly applyTagIds: readonly number[];
  readonly extendTagIds: readonly number[];
  readonly unsupportedPayloads: readonly UnsupportedBuffPayloadSource[];
}

export function parseBuffRuntimeSource(
  value: unknown,
  sourcePath: string,
  inheritedBlackboard: BlackboardLevelValues = {},
): BuffRuntimeSource {
  const root = requireRecord(value, sourcePath);
  // The reference parser owns the version-sensitive root field list. Parse once to discover the
  // local declarations, then parse executable leaves with local fixed defaults available.
  const declarationGraph = parseKnownNativeBuffActionGraphSource(
    value,
    sourcePath,
    inheritedBlackboard,
  );
  const localBlackboard = {
    ...inheritedBlackboard,
    ...numericDeclaredBlackboard(declarationGraph.declaredBlackboard, true),
  };
  const graph = parseKnownNativeBuffActionGraphSource(value, sourcePath, localBlackboard);

  const addingCooldown = validatePassiveFlags(root, sourcePath, localBlackboard);
  const unsupportedPayloads = [...unsupportedArray(root, sourcePath, 'globalModifier')];

  const stacking = requireRecord(root.stackingSettings, `${sourcePath}.stackingSettings`);
  requireExactFields(
    stacking,
    new Set([
      'identifierType',
      'stackingType',
      'stackingKey',
      'usePriorityKey',
      'priorityKey',
      'negatePriority',
      'priority',
      'useMaxStackCntKey',
      'maxStackCntKey',
      'maxStackCnt',
      'isNeedStackEffect',
      'stackEffects',
    ]),
    `${sourcePath}.stackingSettings`,
  );
  const stackEffects = parsePresentationStackEffects(
    stacking.stackEffects,
    `${sourcePath}.stackingSettings.stackEffects`,
  );

  return {
    graph,
    presentation: parsePresentation(root, sourcePath),
    lifecycle: {
      addingCooldown,
      ignoreAddingCooldown: requireBoolean(
        root.ignoreCooldownWhenAdding,
        `${sourcePath}.ignoreCooldownWhenAdding`,
      ),
      lifeType: requireOneOf(root.lifeType, ['Limited', 'Infinity'], `${sourcePath}.lifeType`),
      duration: parseScalarSource(root.duration, `${sourcePath}.duration`, localBlackboard),
      triggerInterval: parseScalarSource(
        root.triggerInterval,
        `${sourcePath}.triggerInterval`,
        localBlackboard,
      ),
      waitFirstTriggerInterval: requireBoolean(
        root.waitFirstTriggerInterval,
        `${sourcePath}.waitFirstTriggerInterval`,
      ),
      maxTriggerCount: parseScalarSource(
        root.maxTriggerCnt,
        `${sourcePath}.maxTriggerCnt`,
        localBlackboard,
      ),
      stackingIdentifierType: requireOneOf(
        stacking.identifierType,
        ['Id', 'StackingKey'],
        `${sourcePath}.stackingSettings.identifierType`,
      ),
      stackingType: requireOneOf(
        stacking.stackingType,
        BUFF_STACKING_TYPES,
        `${sourcePath}.stackingSettings.stackingType`,
      ),
      stackingKey: requireString(
        stacking.stackingKey,
        `${sourcePath}.stackingSettings.stackingKey`,
      ),
      priority: scalarFromToggle(
        stacking.usePriorityKey,
        stacking.priorityKey,
        stacking.priority,
        `${sourcePath}.stackingSettings.priority`,
        localBlackboard,
      ),
      negatePriority: requireBoolean(
        stacking.negatePriority,
        `${sourcePath}.stackingSettings.negatePriority`,
      ),
      maxStackCount: scalarFromToggle(
        stacking.useMaxStackCntKey,
        stacking.maxStackCntKey,
        stacking.maxStackCnt,
        `${sourcePath}.stackingSettings.maxStackCnt`,
        localBlackboard,
      ),
      needsStackEffect: requireBoolean(
        stacking.isNeedStackEffect,
        `${sourcePath}.stackingSettings.isNeedStackEffect`,
      ),
      stackEffectCount: stackEffects.length,
      stackEffectActionTypes: stackEffects.flatMap(effect => effect.actionTypes),
    },
    attributeModifiers: parseGameplayAttributeModifierSource(
      root.attributeModifier,
      `${sourcePath}.attributeModifier`,
      localBlackboard,
    ),
    damageModifiers: parseBuffDamageModifiers(
      root.damageModifier,
      `${sourcePath}.damageModifier`,
      localBlackboard,
    ),
    healModifiers: parseBuffHealModifiers(
      root.healModifier,
      `${sourcePath}.healModifier`,
      localBlackboard,
    ),
    poiseModifiers: parseBuffPoiseModifiers(
      root.poiseModifier,
      `${sourcePath}.poiseModifier`,
      localBlackboard,
    ),
    shields: parseBuffShields(root.shieldConfigs, `${sourcePath}.shieldConfigs`, localBlackboard),
    applyTagIds: parseTagIds(root.applyTags, `${sourcePath}.applyTags`),
    extendTagIds: parseTagIds(
      root.tagsAfterTriggerExtendBuffAction,
      `${sourcePath}.tagsAfterTriggerExtendBuffAction`,
    ),
    unsupportedPayloads,
  };
}

function parseBuffShields(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): readonly BuffShieldSource[] {
  return requireArray(value, path).map((raw, index) => {
    const itemPath = `${path}[${index}]`;
    const item = requireRecord(raw, itemPath);
    requireExactFields(
      item,
      new Set([
        'infinityValue',
        'valueCalculation',
        'damageAbsorptions',
        'absorbCnt',
        'absorbAllDmgWhenConsume',
        'removeBuffWhenConsume',
        'priority',
        'replaceHitEffect',
        'hitEffect',
      ]),
      itemPath,
    );
    const calculationPath = `${itemPath}.valueCalculation`;
    const calculation = requireRecord(item.valueCalculation, calculationPath);
    const calculationType = requireNonEmptyString(calculation.$type, `${calculationPath}.$type`);
    let shieldValue: BuffShieldSource['value'];
    if (calculationType === 'Beyond.Gameplay.Core.DefiniteValueCalculation, Gameplay.Beyond') {
      requireExactFields(
        calculation,
        new Set(['$type', 'value', 'applyScale', 'valueScale']),
        calculationPath,
      );
      shieldValue = {
        kind: 'definite',
        value: parseScalarSource(
          calculation.value,
          `${calculationPath}.value`,
          inheritedBlackboard,
        ),
        applyScale: requireBoolean(calculation.applyScale, `${calculationPath}.applyScale`),
        valueScale: parseScalarSource(
          calculation.valueScale,
          `${calculationPath}.valueScale`,
          inheritedBlackboard,
        ),
      };
    } else if (
      calculationType === 'Beyond.Gameplay.Core.MultiplyAttributeCalculation, Gameplay.Beyond'
    ) {
      requireExactFields(
        calculation,
        new Set(['$type', 'valueSource', 'attributeType', 'multiplier', 'addition']),
        calculationPath,
      );
      shieldValue = {
        kind: 'attribute',
        valueSource: requireNonEmptyString(
          calculation.valueSource,
          `${calculationPath}.valueSource`,
        ),
        attributeType: parseAttributeTypeName(
          calculation.attributeType,
          `${calculationPath}.attributeType`,
        ),
        multiplier: parseScalarSource(
          calculation.multiplier,
          `${calculationPath}.multiplier`,
          inheritedBlackboard,
        ),
        addition: parseScalarSource(
          calculation.addition,
          `${calculationPath}.addition`,
          inheritedBlackboard,
        ),
      };
    } else {
      throw new Error(
        `${calculationPath}.$type: unsupported shield calculation ${JSON.stringify(calculationType)}`,
      );
    }
    requireRecord(item.hitEffect, `${itemPath}.hitEffect`);
    return {
      infinityValue: requireBoolean(item.infinityValue, `${itemPath}.infinityValue`),
      value: shieldValue,
      damageAbsorptions: requireArray(item.damageAbsorptions, `${itemPath}.damageAbsorptions`).map(
        (rawAbsorption, absorptionIndex) => {
          const absorptionPath = `${itemPath}.damageAbsorptions[${absorptionIndex}]`;
          const absorption = requireRecord(rawAbsorption, absorptionPath);
          requireExactFields(
            absorption,
            new Set(['damageType', 'absorptionRatio', 'absorptionScale']),
            absorptionPath,
          );
          return {
            damageType: requireNonEmptyString(
              absorption.damageType,
              `${absorptionPath}.damageType`,
            ),
            ratio: parseScalarSource(
              absorption.absorptionRatio,
              `${absorptionPath}.absorptionRatio`,
              inheritedBlackboard,
            ),
            scale: parseScalarSource(
              absorption.absorptionScale,
              `${absorptionPath}.absorptionScale`,
              inheritedBlackboard,
            ),
          };
        },
      ),
      absorbCount: parseIntegerScalarSource(item.absorbCnt, `${itemPath}.absorbCnt`),
      absorbAllDamageWhenConsumed: requireBoolean(
        item.absorbAllDmgWhenConsume,
        `${itemPath}.absorbAllDmgWhenConsume`,
      ),
      removeBuffWhenConsumed: requireBoolean(
        item.removeBuffWhenConsume,
        `${itemPath}.removeBuffWhenConsume`,
      ),
      priority: requireNonEmptyString(item.priority, `${itemPath}.priority`),
      replaceHitEffect: requireBoolean(item.replaceHitEffect, `${itemPath}.replaceHitEffect`),
    };
  });
}

function parseBuffPoiseModifiers(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): readonly BuffPoiseModifierSource[] {
  return requireArray(value, path).map((raw, index) => {
    const itemPath = `${path}[${index}]`;
    const item = requireRecord(raw, itemPath);
    requireExactFields(item, new Set(['enableSide', 'condition', 'poiseProcessors']), itemPath);
    const processors = requireArray(item.poiseProcessors, `${itemPath}.poiseProcessors`).map(
      (rawProcessor, processorIndex) => {
        const processorPath = `${itemPath}.poiseProcessors[${processorIndex}]`;
        const processor = requireRecord(rawProcessor, processorPath);
        requireExactFields(
          processor,
          new Set(['$type', 'modifyTargetSide', 'modifier']),
          processorPath,
        );
        const type = requireNonEmptyString(processor.$type, `${processorPath}.$type`);
        if (type !== 'Beyond.Gameplay.Core.InstantModifyAttributeForPoise, Gameplay.Beyond') {
          throw new Error(
            `${processorPath}.$type: unsupported poise processor ${JSON.stringify(type)}`,
          );
        }
        return {
          kind: 'instantAttribute' as const,
          modifyTargetSide: requireNonEmptyString(
            processor.modifyTargetSide,
            `${processorPath}.modifyTargetSide`,
          ),
          modifier: parseGameplayAttributeModifierEntrySource(
            processor.modifier,
            `${processorPath}.modifier`,
            inheritedBlackboard,
          ),
        };
      },
    );
    return {
      enabledSide: readModifierSide(item.enableSide, `${itemPath}.enableSide`),
      condition: parseNativeSequenceSource(
        item.condition,
        `${itemPath}.condition`,
        inheritedBlackboard,
        (leaf, leafPath) => parseKnownNativeActionLeafSource(leaf, leafPath, inheritedBlackboard),
      ),
      processors,
    };
  });
}

function parseBuffHealModifiers(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): readonly BuffHealModifierSource[] {
  return requireArray(value, path).map((raw, index) => {
    const itemPath = `${path}[${index}]`;
    const item = requireRecord(raw, itemPath);
    requireExactFields(item, new Set(['enableSide', 'condition', 'healProcessors']), itemPath);
    const processors = requireArray(item.healProcessors, `${itemPath}.healProcessors`).map(
      (rawProcessor, processorIndex) => {
        const processorPath = `${itemPath}.healProcessors[${processorIndex}]`;
        const processor = requireRecord(rawProcessor, processorPath);
        const type = requireNonEmptyString(processor.$type, `${processorPath}.$type`);
        if (type === 'Beyond.Gameplay.Core.ModifyHealCalcResult, Gameplay.Beyond') {
          requireExactFields(
            processor,
            new Set(['$type', 'modifyType', 'baseMultiplier', 'multiplierCnt']),
            processorPath,
          );
          if (
            requireNonEmptyString(processor.modifyType, `${processorPath}.modifyType`) !==
            'Multiply'
          )
            throw new Error(`${processorPath}.modifyType: expected "Multiply"`);
          return {
            kind: 'modifyCalculationResult' as const,
            baseMultiplier: parseScalarSource(
              processor.baseMultiplier,
              `${processorPath}.baseMultiplier`,
              inheritedBlackboard,
            ),
            multiplierCount: parseScalarSource(
              processor.multiplierCnt,
              `${processorPath}.multiplierCnt`,
              inheritedBlackboard,
            ),
          };
        }
        requireExactFields(
          processor,
          new Set(['$type', 'modifyTargetSide', 'modifier']),
          processorPath,
        );
        if (type !== 'Beyond.Gameplay.Core.InstantModifyAttributeForHeal, Gameplay.Beyond')
          throw new Error(
            `${processorPath}.$type: unsupported heal processor ${JSON.stringify(type)}`,
          );
        return {
          kind: 'instantAttribute' as const,
          modifyTargetSide: requireNonEmptyString(
            processor.modifyTargetSide,
            `${processorPath}.modifyTargetSide`,
          ),
          modifier: parseGameplayAttributeModifierEntrySource(
            processor.modifier,
            `${processorPath}.modifier`,
            inheritedBlackboard,
          ),
        };
      },
    );
    return {
      enabledSide: readHealModifierSide(item.enableSide, `${itemPath}.enableSide`),
      condition: parseNativeSequenceSource(
        item.condition,
        `${itemPath}.condition`,
        inheritedBlackboard,
        (leaf, leafPath) => parseKnownNativeActionLeafSource(leaf, leafPath, inheritedBlackboard),
      ),
      processors,
    };
  });
}

function parseBuffDamageModifiers(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): readonly BuffDamageModifierSource[] {
  return requireArray(value, path).map((raw, index) => {
    const itemPath = `${path}[${index}]`;
    const item = requireRecord(raw, itemPath);
    requireExactFields(item, new Set(['enableSide', 'condition', 'damageProcessors']), itemPath);
    return {
      enabledSide: readModifierSide(item.enableSide, `${itemPath}.enableSide`),
      condition: parseNativeSequenceSource(
        item.condition,
        `${itemPath}.condition`,
        inheritedBlackboard,
        (leaf, leafPath) => parseKnownNativeActionLeafSource(leaf, leafPath, inheritedBlackboard),
      ),
      processors: parseDamageProcessors(
        item.damageProcessors,
        `${itemPath}.damageProcessors`,
        inheritedBlackboard,
      ),
    };
  });
}

function parsePresentation(
  root: Record<string, unknown>,
  sourcePath: string,
): BuffPresentationSource {
  const icon = requireRecord(root.iconConfig, `${sourcePath}.iconConfig`);
  requireExactFields(
    icon,
    new Set([
      '_spritePath',
      'showInHeadBarCommon',
      'showInHeadBarAttached',
      ...('showDirectlyInHeadBuff' in icon ? ['showDirectlyInHeadBuff'] : []),
      'showInSquadIcon',
      'onlyShowForMainCharacter',
      'blinkInMainCharHpBar',
      'showProgressInHpBar',
      'showProgressInNormalSkillButton',
      'useWeakProgressInNormalSkillButton',
      'showProgressInUltimateSkillButton',
      'forceRaiseIconEvent',
      'iconStyleInSquad',
      'abnormalColorType',
      '_orderPriorityConfig',
      'showWarningBackground',
      'playStrongInAnimation',
      'hasCharHpBarVfxType',
      'charHpBarVfxType',
    ]),
    `${sourcePath}.iconConfig`,
  );
  // 这是新增显示资格，不是闪烁等纯渲染参数；关闭与旧结构等价，开启需先还原原生路由。
  if (
    'showDirectlyInHeadBuff' in icon &&
    requireBoolean(icon.showDirectlyInHeadBuff, `${sourcePath}.iconConfig.showDirectlyInHeadBuff`)
  ) {
    throw new Error(
      `${sourcePath}.iconConfig.showDirectlyInHeadBuff: direct head buff display requires native routing projection`,
    );
  }
  const order = requireRecord(
    icon._orderPriorityConfig,
    `${sourcePath}.iconConfig._orderPriorityConfig`,
  );
  requireExactFields(
    order,
    new Set(['useDirectoryValue', 'priorityValue', 'priorityEnum']),
    `${sourcePath}.iconConfig._orderPriorityConfig`,
  );
  const readSerializedEnum = (value: unknown, path: string): string =>
    typeof value === 'number'
      ? String(requireNonNegativeInteger(value, path))
      : requireNonEmptyString(value, path);
  return {
    hasIcon: requireBoolean(root.hasIcon, `${sourcePath}.hasIcon`),
    spritePath: requireString(icon._spritePath, `${sourcePath}.iconConfig._spritePath`),
    showInHeadBarCommon: requireBoolean(
      icon.showInHeadBarCommon,
      `${sourcePath}.iconConfig.showInHeadBarCommon`,
    ),
    showInHeadBarAttached: requireBoolean(
      icon.showInHeadBarAttached,
      `${sourcePath}.iconConfig.showInHeadBarAttached`,
    ),
    showInSquadIcon: requireBoolean(
      icon.showInSquadIcon,
      `${sourcePath}.iconConfig.showInSquadIcon`,
    ),
    onlyShowForMainCharacter: requireBoolean(
      icon.onlyShowForMainCharacter,
      `${sourcePath}.iconConfig.onlyShowForMainCharacter`,
    ),
    blinkInMainCharHpBar: requireBoolean(
      icon.blinkInMainCharHpBar,
      `${sourcePath}.iconConfig.blinkInMainCharHpBar`,
    ),
    showProgressInHpBar: requireBoolean(
      icon.showProgressInHpBar,
      `${sourcePath}.iconConfig.showProgressInHpBar`,
    ),
    showProgressInNormalSkillButton: requireBoolean(
      icon.showProgressInNormalSkillButton,
      `${sourcePath}.iconConfig.showProgressInNormalSkillButton`,
    ),
    useWeakProgressInNormalSkillButton: requireBoolean(
      icon.useWeakProgressInNormalSkillButton,
      `${sourcePath}.iconConfig.useWeakProgressInNormalSkillButton`,
    ),
    showProgressInUltimateSkillButton: requireBoolean(
      icon.showProgressInUltimateSkillButton,
      `${sourcePath}.iconConfig.showProgressInUltimateSkillButton`,
    ),
    forceRaiseIconEvent: requireBoolean(
      icon.forceRaiseIconEvent,
      `${sourcePath}.iconConfig.forceRaiseIconEvent`,
    ),
    showWarningBackground: requireBoolean(
      icon.showWarningBackground,
      `${sourcePath}.iconConfig.showWarningBackground`,
    ),
    playStrongInAnimation: requireBoolean(
      icon.playStrongInAnimation,
      `${sourcePath}.iconConfig.playStrongInAnimation`,
    ),
    hasCharHpBarVfxType: requireBoolean(
      icon.hasCharHpBarVfxType,
      `${sourcePath}.iconConfig.hasCharHpBarVfxType`,
    ),
    charHpBarVfxType: readSerializedEnum(
      icon.charHpBarVfxType,
      `${sourcePath}.iconConfig.charHpBarVfxType`,
    ),
    iconStyleInSquad: readSerializedEnum(
      icon.iconStyleInSquad,
      `${sourcePath}.iconConfig.iconStyleInSquad`,
    ),
    abnormalColorType: readSerializedEnum(
      icon.abnormalColorType,
      `${sourcePath}.iconConfig.abnormalColorType`,
    ),
    orderUseDirectoryValue: requireBoolean(
      order.useDirectoryValue,
      `${sourcePath}.iconConfig._orderPriorityConfig.useDirectoryValue`,
    ),
    orderPriorityValue: requireNumber(
      order.priorityValue,
      `${sourcePath}.iconConfig._orderPriorityConfig.priorityValue`,
    ),
    orderPriorityEnum: readSerializedEnum(
      order.priorityEnum,
      `${sourcePath}.iconConfig._orderPriorityConfig.priorityEnum`,
    ),
  };
}

function validatePassiveFlags(
  root: Record<string, unknown>,
  sourcePath: string,
  inheritedBlackboard: BlackboardLevelValues,
): ScalarSource | null {
  for (const field of ['ignoreTagImmune', 'finishOnRepatriate', 'ignoreCooldownWhenAdding']) {
    requireBoolean(root[field], `${sourcePath}.${field}`);
  }
  const hasAddingCooldown = requireBoolean(
    root.hasAddingCooldown,
    `${sourcePath}.hasAddingCooldown`,
  );
  const parsedAddingCooldown = hasAddingCooldown
    ? parseScalarSource(root.addingCooldown, `${sourcePath}.addingCooldown`, inheritedBlackboard)
    : null;
  // 关闭槽在 1.4.4 中存在 useBlackboardKey=true + 空 key 的序列化脏值；
  // 结构仍须严格，禁用值则不应被提升成运行时黑板依赖。
  const addingCooldown = requireRecord(root.addingCooldown, `${sourcePath}.addingCooldown`);
  requireExactFields(
    addingCooldown,
    new Set(['useBlackboardKey', 'value', 'blackboardKey']),
    `${sourcePath}.addingCooldown`,
  );
  requireBoolean(addingCooldown.useBlackboardKey, `${sourcePath}.addingCooldown.useBlackboardKey`);
  requireNumber(addingCooldown.value, `${sourcePath}.addingCooldown.value`);
  requireString(addingCooldown.blackboardKey, `${sourcePath}.addingCooldown.blackboardKey`);
  const dispel = requireRecord(root.dispelConfig, `${sourcePath}.dispelConfig`);
  requireExactFields(
    dispel,
    new Set(['canBeDispelled', 'dispelledLevel']),
    `${sourcePath}.dispelConfig`,
  );
  requireBoolean(dispel.canBeDispelled, `${sourcePath}.dispelConfig.canBeDispelled`);
  if (typeof dispel.dispelledLevel === 'number')
    requireNonNegativeInteger(dispel.dispelledLevel, `${sourcePath}.dispelConfig.dispelledLevel`);
  else requireNonEmptyString(dispel.dispelledLevel, `${sourcePath}.dispelConfig.dispelledLevel`);
  return parsedAddingCooldown;
}

function unsupportedArray(
  root: Record<string, unknown>,
  sourcePath: string,
  field: string,
): UnsupportedBuffPayloadSource[] {
  const count = requireArray(root[field], `${sourcePath}.${field}`).length;
  return count === 0 ? [] : [{ field, entryCount: count }];
}

interface PresentationStackEffectSource {
  readonly actionTypes: readonly 'EffectAction'[];
}

/**
 * stackEffects 不是任意动作并集：当前 1.4.4 导出把它序列化成专用 effectActions 槽。
 * 因此可以在不解释粒子参数的前提下证明它只承载表现；字段漂移会在这里失败。
 */
function parsePresentationStackEffects(
  value: unknown,
  path: string,
): PresentationStackEffectSource[] {
  return requireArray(value, path).map((rawEffect, effectIndex) => {
    const effectPath = `${path}[${effectIndex}]`;
    const effect = requireRecord(rawEffect, effectPath);
    requireExactFields(effect, new Set(['effectActions']), effectPath);
    const actions = requireArray(effect.effectActions, `${effectPath}.effectActions`);
    actions.forEach((rawAction, actionIndex) => {
      const actionPath = `${effectPath}.effectActions[${actionIndex}]`;
      parseEffectActionSource(rawAction, actionPath, 'typedSlot');
    });
    return { actionTypes: actions.map(() => 'EffectAction' as const) };
  });
}

function parseTagIds(value: unknown, path: string): number[] {
  return requireArray(value, path).map((entry, index) => {
    const entryPath = `${path}[${index}]`;
    const tag = requireRecord(entry, entryPath);
    requireExactFields(tag, new Set(['tagId']), entryPath);
    return requireInteger(tag.tagId, `${entryPath}.tagId`);
  });
}

function scalarFromToggle(
  rawUseKey: unknown,
  rawKey: unknown,
  rawValue: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): ScalarSource {
  const useBlackboardKey = requireBoolean(rawUseKey, `${path}.useBlackboardKey`);
  const blackboardKey = requireString(rawKey, `${path}.blackboardKey`);
  const value = requireNumber(rawValue, `${path}.value`);
  return parseScalarSource({ useBlackboardKey, blackboardKey, value }, path, inheritedBlackboard);
}

function requireOneOf<const T extends readonly string[]>(
  value: unknown,
  options: T,
  path: string,
): T[number] {
  if (typeof value === 'number') {
    const index = requireNonNegativeInteger(value, path);
    const option = options[index];
    if (option === undefined) throw new Error(`${path}: unsupported value ${value}`);
    return option;
  }
  const name = requireNonEmptyString(value, path);
  if (!(options as readonly string[]).includes(name))
    throw new Error(`${path}: unsupported value ${JSON.stringify(name)}`);
  return name as T[number];
}
