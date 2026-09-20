import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireNativeEnum,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';

// 原生 DataPair.ValueType 的枚举值。
const VALUE_TYPES = new Map([
  [0, 'Numeric'],
  [1, 'String'],
  [2, 'Any'],
] as const);

export function readBlackboardAssignmentValueType(value: unknown, path: string) {
  const result = requireNativeEnum(value, VALUE_TYPES, path);
  // 枚举有 Any 不等于当前赋值协议已能携带任意对象，保留原有支持边界。
  if (result === 'Any') throw new Error(`${path}: unsupported value Any`);
  return result;
}

/**
 * 原生动作向子对象黑板写值时使用的公共结构。
 *
 * `useDirectValue=false` 时运行时读取 `inputValueKey`；直接值字段仍属于序列化事实，
 * 不能因为当前分支不读取它们就丢弃。
 */
export interface BlackboardAssignmentSource {
  readonly targetKey: string;
  readonly valueType: string;
  readonly numericValue: number;
  readonly stringValue: string;
  readonly useDirectValue: boolean;
  readonly inputValueKey: string;
}

export interface BlackboardAssignmentParseOptions {
  /** 整组赋值是否启用；关闭时允许原生数据保留空占位。 */
  readonly enabled: boolean;
}

export function parseBlackboardAssignmentsSource(
  value: unknown,
  path: string,
  options: BlackboardAssignmentParseOptions,
): BlackboardAssignmentSource[] {
  const seenKeys = new Set<string>();
  return requireArray(value, path).map((rawAssignment, index) => {
    const assignmentPath = `${path}[${index}]`;
    const assignment = requireRecord(rawAssignment, assignmentPath);
    requireExactFields(
      assignment,
      new Set([
        'targetKey',
        'inputValueKey',
        'useDirectValue',
        'directValueType',
        'numericValue',
        'stringValue',
      ]),
      assignmentPath,
    );
    const targetKey = options.enabled
      ? requireNonEmptyString(assignment.targetKey, `${assignmentPath}.targetKey`)
      : requireString(assignment.targetKey, `${assignmentPath}.targetKey`);
    if (targetKey && seenKeys.has(targetKey)) {
      throw new Error(`${path}: duplicate assignment for ${targetKey}`);
    }
    if (targetKey) seenKeys.add(targetKey);

    const valueType = readBlackboardAssignmentValueType(
      assignment.directValueType,
      `${assignmentPath}.directValueType`,
    );
    const useDirectValue = requireBoolean(
      assignment.useDirectValue,
      `${assignmentPath}.useDirectValue`,
    );
    const inputValueKey = requireString(
      assignment.inputValueKey,
      `${assignmentPath}.inputValueKey`,
    );
    if (options.enabled && !useDirectValue && !inputValueKey) {
      throw new Error(`${assignmentPath}: indirect assignment requires an input key`);
    }
    return {
      targetKey,
      valueType,
      numericValue: requireNumber(assignment.numericValue, `${assignmentPath}.numericValue`),
      stringValue: requireString(assignment.stringValue, `${assignmentPath}.stringValue`),
      useDirectValue,
      inputValueKey,
    };
  });
}
