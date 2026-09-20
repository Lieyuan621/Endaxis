import {
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireNativeEnum,
  requireRecord,
} from './primitives.ts';

// OperationType 的原生元数据常量。
const BLACKBOARD_OPERATIONS = new Map([
  [0, 'Assign'],
  [1, 'Add'],
  [2, 'Multiply'],
  [3, 'Divide'],
  [4, 'Floor'],
  [5, 'Ceil'],
  [6, 'RoundToInt'],
] as const);

function readBlackboardOperation(value: unknown, path: string): string {
  return requireNativeEnum(value, BLACKBOARD_OPERATIONS, path);
}
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { ATTRIBUTE_TYPES, type AttributeTypeSource } from './attributeModifiers.ts';

const ACTION_META_FIELDS = [
  '$type',
  'isEnable',
  'priorityLevel',
  'priorityOffset',
  'serverActionIndex',
];

export interface BlackboardCalculationPayloadSource {
  readonly key: string;
  readonly operation: string;
  readonly left: ScalarSource;
  readonly right: ScalarSource;
  readonly addend: ScalarSource | null;
}

export interface BlackboardMutationPayloadSource {
  readonly key: string;
  readonly operation: string;
  readonly value: ScalarSource;
}

export interface BlackboardCalculationActionSource extends BlackboardCalculationPayloadSource {
  readonly kind: 'blackboardCalculation';
}

export interface BlackboardMutationActionSource extends BlackboardMutationPayloadSource {
  readonly kind: 'blackboardMutation';
  readonly directValue: boolean;
  readonly calculationTarget: TargetReferenceSource;
  readonly calculationType: string;
}

export interface RandomBlackboardActionSource {
  readonly kind: 'randomBlackboardWrite';
  readonly randomType: string;
  readonly minimum: ScalarSource;
  readonly maximum: ScalarSource;
  readonly targetKey: string;
}

export interface AttributeSnapshotActionSource {
  readonly kind: 'attributeSnapshot';
  readonly target: TargetReferenceSource;
  readonly primaryAttributeType: 'Specific' | 'Sub';
  readonly attributeType: AttributeTypeSource;
  readonly storeAttributeType: 'BaseNonConverted' | 'FinalNonConverted';
  readonly useFloor: boolean;
  readonly divisor: ScalarSource;
  readonly multiplier: ScalarSource;
  readonly baseValue: ScalarSource;
  readonly outputKey: string;
}

export interface EntityPropertySnapshotActionSource {
  readonly kind: 'entityPropertySnapshot';
  readonly target: TargetReferenceSource;
  readonly property: 'CurHp' | 'CurPoise';
  readonly useFloor: boolean;
  readonly divisor: ScalarSource;
  readonly multiplier: ScalarSource;
  readonly baseValue: ScalarSource;
  readonly outputKey: string;
}

/** 严格读取 StoreEntityProperty 的属性枚举及公式字段。 */
export function parseEntityPropertySnapshotActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): EntityPropertySnapshotActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'targetSettings',
      'propertyType',
      'useFloor',
      'divisorValue',
      'multiplierValue',
      'baseValue',
      'key',
    ]),
    path,
  );
  return {
    kind: 'entityPropertySnapshot',
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    property: requireKnownString(action.propertyType, `${path}.propertyType`, [
      'CurHp',
      'CurPoise',
    ]),
    useFloor: requireBoolean(action.useFloor, `${path}.useFloor`),
    divisor: parseScalarSource(action.divisorValue, `${path}.divisorValue`, inheritedBlackboard),
    multiplier: parseScalarSource(
      action.multiplierValue,
      `${path}.multiplierValue`,
      inheritedBlackboard,
    ),
    baseValue: parseScalarSource(action.baseValue, `${path}.baseValue`, inheritedBlackboard),
    outputKey: requireNonEmptyString(action.key, `${path}.key`),
  };
}

/** 只保存随机写入的原生配置；上下界包含性和随机算法留给有运行时证据的投影层。 */
export function parseRandomBlackboardActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): RandomBlackboardActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([...ACTION_META_FIELDS, 'randomType', 'minValue', 'maxValue', 'targetBlackboardKey']),
    path,
  );
  return {
    kind: 'randomBlackboardWrite',
    randomType: requireNonEmptyString(action.randomType, `${path}.randomType`),
    minimum: parseScalarSource(action.minValue, `${path}.minValue`, inheritedBlackboard),
    maximum: parseScalarSource(action.maxValue, `${path}.maxValue`, inheritedBlackboard),
    targetKey: requireNonEmptyString(action.targetBlackboardKey, `${path}.targetBlackboardKey`),
  };
}

/** 读取目标属性快照及写回公式；具体属性求值由后续公共执行层负责。 */
export function parseAttributeSnapshotActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): AttributeSnapshotActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'targetSettings',
      'primaryAttributeType',
      'attributeType',
      'storeAttributeType',
      'useFloor',
      'divisorValue',
      'multiplierValue',
      'baseValue',
      'key',
    ]),
    path,
  );
  return {
    kind: 'attributeSnapshot',
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    primaryAttributeType: requireKnownString(
      action.primaryAttributeType,
      `${path}.primaryAttributeType`,
      ['Specific', 'Sub'],
    ),
    attributeType: requireKnownString(
      action.attributeType,
      `${path}.attributeType`,
      ATTRIBUTE_TYPES,
    ),
    storeAttributeType: requireKnownString(
      action.storeAttributeType,
      `${path}.storeAttributeType`,
      ['BaseNonConverted', 'FinalNonConverted'],
    ),
    useFloor: requireBoolean(action.useFloor, `${path}.useFloor`),
    divisor: parseScalarSource(action.divisorValue, `${path}.divisorValue`, inheritedBlackboard),
    multiplier: parseScalarSource(
      action.multiplierValue,
      `${path}.multiplierValue`,
      inheritedBlackboard,
    ),
    baseValue: parseScalarSource(action.baseValue, `${path}.baseValue`, inheritedBlackboard),
    outputKey: requireNonEmptyString(action.key, `${path}.key`),
  };
}

function requireKnownString<const T extends string>(
  value: unknown,
  path: string,
  known: readonly T[],
): T {
  const text = requireNonEmptyString(value, path);
  if (!known.includes(text as T)) {
    throw new Error(`${path}: unsupported value ${JSON.stringify(text)}`);
  }
  return text as T;
}

/** 完整读取 SimpleCalcBBAction；调度帧仍由外层时间轴节点负责。 */
export function parseBlackboardCalculationActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): BlackboardCalculationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([...ACTION_META_FIELDS, 'key', 'operation', 'value1', 'value2']),
    path,
  );
  return {
    kind: 'blackboardCalculation',
    ...parseBlackboardCalculationPayloadSource(action, path, inheritedBlackboard),
  };
}

/**
 * 完整读取 ModifyDynamicBlackboard 来源事实。间接路径是合法原生数据；是否能执行由投影层判断。
 */
export function parseBlackboardMutationActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): BlackboardMutationActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'key',
      'operation',
      'directValue',
      'value',
      'calculationTarget',
      'calculateType',
    ]),
    path,
  );
  return {
    kind: 'blackboardMutation',
    key: requireNonEmptyString(action.key, `${path}.key`),
    operation: readBlackboardOperation(action.operation, `${path}.operation`),
    value: parseScalarSource(action.value, `${path}.value`, inheritedBlackboard),
    directValue: requireBoolean(action.directValue, `${path}.directValue`),
    calculationTarget: parseTargetReferenceSource(
      action.calculationTarget,
      `${path}.calculationTarget`,
    ),
    calculationType: requireNonEmptyString(action.calculateType, `${path}.calculateType`),
  };
}

/** 读取 SimpleCalcBBAction 的纯计算载荷；调度帧由外层时间轴收集器附加。 */
export function parseBlackboardCalculationPayloadSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): BlackboardCalculationPayloadSource {
  const action = requireRecord(value, path);
  return {
    key: requireNonEmptyString(action.key, `${path}.key`),
    operation: readBlackboardOperation(action.operation, `${path}.operation`),
    left: parseScalarSource(action.value1, `${path}.value1`, inheritedBlackboard),
    right: parseScalarSource(action.value2, `${path}.value2`, inheritedBlackboard),
    addend: null,
  };
}

/**
 * 读取当前 Endaxis 可执行的直接值子集。完整来源读取必须使用
 * parseBlackboardMutationActionSource，不能把这里的投影限制当成源数据无效。
 */
export function parseBlackboardMutationPayloadSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): BlackboardMutationPayloadSource {
  const action = requireRecord(value, path);
  if (!requireBoolean(action.directValue, `${path}.directValue`)) {
    throw new Error(`${path}.directValue: unsupported false`);
  }
  return {
    key: requireNonEmptyString(action.key, `${path}.key`),
    operation: readBlackboardOperation(action.operation, `${path}.operation`),
    value: parseScalarSource(action.value, `${path}.value`, inheritedBlackboard),
  };
}
