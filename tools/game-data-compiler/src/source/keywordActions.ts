import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';
import {
  parseScalarSource,
  parseStringScalarSource,
  type BlackboardLevelValues,
  type ScalarSource,
  type StringScalarSource,
} from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

// 来自 GetKeywordBuffName 的原生跳转表和元数据字符串，
// 不是根据 Buff ID 命名规律生成。其它关键词族须取得自身映射证据后再加入。
const VULNERABLE_CARRIERS = {
  All: 'buff_common_affixes_vulnerable_all',
  Spell: 'buff_common_affixes_vulnerable_spell',
  Physical: 'buff_common_affixes_vulnerable_physical',
  Natural: 'buff_common_affixes_vulnerable_natural',
  Fire: 'buff_common_affixes_vulnerable_fire',
  Crystal: 'buff_common_affixes_vulnerable_crystal',
  Pulse: 'buff_common_affixes_vulnerable_pulse',
} as const;

const ENHANCED_CARRIERS = {
  All: 'buff_common_affixes_enhance_all',
  Spell: 'buff_common_affixes_enhance_spell',
  Physical: 'buff_common_affixes_enhance_physical',
  Natural: 'buff_common_affixes_enhance_natural',
  Fire: 'buff_common_affixes_enhance_fire',
  Crystal: 'buff_common_affixes_enhance_crystal',
  Pulse: 'buff_common_affixes_enhance_pulse',
} as const;

const RECOVERED_KEYWORD_CARRIER_IDS = new Set<string>([
  ...Object.values(VULNERABLE_CARRIERS),
  ...Object.values(ENHANCED_CARRIERS),
  'buff_common_affixes_shelter',
  'buff_common_affixes_slow',
  'buff_common_affixes_speedup',
  'buff_common_affixes_weak',
]);

/** 仅用于识别由本模块已取证映射生成的关键词载体，不按 Buff ID 命名模式猜测。 */
export function isRecoveredKeywordCarrierBuffId(id: string): boolean {
  return RECOVERED_KEYWORD_CARRIER_IDS.has(id);
}

type KeywordSubType = keyof typeof VULNERABLE_CARRIERS;

interface KeywordBuffActionFields {
  readonly kind: 'keywordBuff';
  readonly carrierBuffId: string;
  readonly source: TargetReferenceSource;
  readonly target: TargetReferenceSource;
  readonly duration: ScalarSource;
  readonly rate: ScalarSource;
  readonly overrideChildBuffId: boolean;
  readonly childBuffId: StringScalarSource;
  readonly asChildBuff: boolean;
  readonly autoFinishByAction: boolean;
  readonly enhancements: readonly {
    readonly buffIds: readonly string[];
    readonly operation: 'Assign' | 'Add' | 'Multiply';
    readonly value: ScalarSource;
  }[];
}

/** KeywordActionData 没有 subType；仅其派生 WithSubTypeData 承载该字段。 */
export type KeywordBuffActionSource = KeywordBuffActionFields &
  (
    | { readonly keyword: 'Shelter' | 'Slow' | 'Speedup' | 'Weak'; readonly subType: null }
    | { readonly keyword: 'Vulnerable' | 'Enhanced'; readonly subType: KeywordSubType }
  );

export function parseShelterActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): KeywordBuffActionSource {
  return parseKeywordBuffActionSource(value, path, inheritedBlackboard, 'Shelter');
}

export function parseWeakActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): KeywordBuffActionSource {
  return parseKeywordBuffActionSource(value, path, inheritedBlackboard, 'Weak');
}

export function parseSlowActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): KeywordBuffActionSource {
  return parseKeywordBuffActionSource(value, path, inheritedBlackboard, 'Slow');
}

export function parseSpeedupActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): KeywordBuffActionSource {
  return parseKeywordBuffActionSource(value, path, inheritedBlackboard, 'Speedup');
}

/** 公共关键词来源切片：保留动态覆盖与增强触发条件，不提前简化成一个属性修正。 */
export function parseVulnerableActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): KeywordBuffActionSource {
  return parseKeywordBuffActionSource(
    value,
    path,
    inheritedBlackboard,
    'Vulnerable',
    VULNERABLE_CARRIERS,
  );
}

export function parseEnhancedActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): KeywordBuffActionSource {
  return parseKeywordBuffActionSource(
    value,
    path,
    inheritedBlackboard,
    'Enhanced',
    ENHANCED_CARRIERS,
  );
}

function parseKeywordBuffActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
  keyword: KeywordBuffActionSource['keyword'],
  carriers?: Readonly<Record<KeywordSubType, string>>,
): KeywordBuffActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'source',
      'target',
      'duration',
      'rate',
      'overrideChildBuffId',
      'childBuffId',
      'asChildBuff',
      'enhancingList',
      'autoFinishByAction',
      ...(keyword === 'Shelter' || keyword === 'Slow' || keyword === 'Speedup' || keyword === 'Weak'
        ? []
        : ['subType']),
    ]),
    path,
  );
  const subType =
    keyword === 'Shelter' || keyword === 'Slow' || keyword === 'Speedup' || keyword === 'Weak'
      ? null
      : requireNonEmptyString(action.subType, `${path}.subType`);
  if (subType !== null && !Object.hasOwn(VULNERABLE_CARRIERS, subType))
    throw new Error(`${path}.subType: unsupported keyword subtype ${JSON.stringify(subType)}`);
  const identity =
    keyword === 'Shelter'
      ? // 1.4.4 KeywordActionType=4 → slot 0x0F0AB3C8。
        ({ keyword, subType: null, carrierBuffId: 'buff_common_affixes_shelter' } as const)
      : keyword === 'Weak'
        ? // 1.4.4 KeywordActionType=0 与固定载体。
          ({ keyword, subType: null, carrierBuffId: 'buff_common_affixes_weak' } as const)
        : keyword === 'Slow'
          ? // 1.4.4 KeywordActionType=2 → slot 0x0F0AB3E8。
            ({ keyword, subType: null, carrierBuffId: 'buff_common_affixes_slow' } as const)
          : keyword === 'Speedup'
            ? // 1.4.4 KeywordActionType=5 → slot 0x0F0AB3D8。
              ({ keyword, subType: null, carrierBuffId: 'buff_common_affixes_speedup' } as const)
            : {
                keyword,
                subType: subType as KeywordSubType,
                carrierBuffId: carriers![subType as KeywordSubType],
              };
  return {
    kind: 'keywordBuff',
    ...identity,
    source: parseTargetReferenceSource(action.source, `${path}.source`),
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    duration: parseScalarSource(action.duration, `${path}.duration`, inheritedBlackboard),
    rate: parseScalarSource(action.rate, `${path}.rate`, inheritedBlackboard),
    overrideChildBuffId: requireBoolean(action.overrideChildBuffId, `${path}.overrideChildBuffId`),
    childBuffId: parseStringScalarSource(action.childBuffId, `${path}.childBuffId`),
    asChildBuff: requireBoolean(action.asChildBuff, `${path}.asChildBuff`),
    autoFinishByAction: requireBoolean(action.autoFinishByAction, `${path}.autoFinishByAction`),
    enhancements: requireArray(action.enhancingList, `${path}.enhancingList`).map((raw, index) => {
      const itemPath = `${path}.enhancingList[${index}]`;
      const item = requireRecord(raw, itemPath);
      requireExactFields(item, new Set(['buffIds', 'operationType', 'value']), itemPath);
      const operation = requireNonEmptyString(item.operationType, `${itemPath}.operationType`);
      if (operation !== 'Assign' && operation !== 'Add' && operation !== 'Multiply')
        throw new Error(
          `${itemPath}.operationType: unsupported keyword enhancement ${JSON.stringify(operation)}`,
        );
      return {
        buffIds: requireArray(item.buffIds, `${itemPath}.buffIds`).map((id, idIndex) =>
          requireNonEmptyString(id, `${itemPath}.buffIds[${idIndex}]`),
        ),
        operation,
        value: parseScalarSource(item.value, `${itemPath}.value`, inheritedBlackboard),
      };
    }),
  };
}
