import type { LevelValues } from '../../../../packages/game-data-contract/src/index.ts';
import {
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';

export interface ScalarSource {
  /** 原生字段中的直接数值；即使启用黑板引用也必须保留。 */
  readonly value: number;
  /** 启用黑板引用时的键；未启用时固定为 null。 */
  readonly blackboardKey: string | null;
  /**
   * 上层已知的黑板数值：声明默认值为单值，真实 SkillPatch 为等级列，未知输入为 null。
   * 这是解析上下文，不是运行时常量传播；blackboardKey 非空时仍必须保留按键求值。
   */
  readonly levelValues: LevelValues | null;
}

export interface StringScalarSource {
  /** 原生字段中的直接字符串；启用黑板引用时也必须保留。 */
  readonly value: string;
  /** 启用黑板引用时的键；未启用时固定为 null。 */
  readonly blackboardKey: string | null;
}

export interface IntegerScalarSource {
  readonly value: number;
  readonly blackboardKey: string | null;
}

export type BlackboardLevelValues = Readonly<Record<string, LevelValues>>;

export function parseScalarSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): ScalarSource {
  const source = requireRecord(value, path);
  const rawValue = requireNumber(source.value, `${path}.value`);
  const useBlackboardKey = requireBoolean(source.useBlackboardKey, `${path}.useBlackboardKey`);
  const key = source.blackboardKey;
  if (typeof key !== 'string') {
    throw new Error(`${path}.blackboardKey: expected string`);
  }
  if (useBlackboardKey && key.length === 0) {
    throw new Error(`${path}: active scalar blackboard reference has no key`);
  }

  const blackboardKey = useBlackboardKey ? key : null;
  // 未在 SkillPatch 中声明不等于错误：该键也可能由技能动作或运行时写入。
  return {
    value: rawValue,
    blackboardKey,
    levelValues: blackboardKey ? (inheritedBlackboard[blackboardKey] ?? null) : null,
  };
}

/** 读取与 BlackboardDouble 同形、但直接值为字符串的原生包装。 */
export function parseStringScalarSource(value: unknown, path: string): StringScalarSource {
  const source = requireRecord(value, path);
  const rawValue = source.value;
  if (typeof rawValue !== 'string') {
    throw new Error(`${path}.value: expected string`);
  }
  const useBlackboardKey = requireBoolean(source.useBlackboardKey, `${path}.useBlackboardKey`);
  const key = source.blackboardKey;
  if (typeof key !== 'string') {
    throw new Error(`${path}.blackboardKey: expected string`);
  }
  if (useBlackboardKey && key.length === 0) {
    throw new Error(`${path}: active string blackboard reference has no key`);
  }
  return { value: rawValue, blackboardKey: useBlackboardKey ? key : null };
}

/** 读取与 BlackboardInt 同形的整数包装；AbilityEntity 与 Selector 共用同一来源解释。 */
export function parseIntegerScalarSource(value: unknown, path: string): IntegerScalarSource {
  const source = requireRecord(value, path);
  requireExactFields(source, new Set(['useBlackboardKey', 'value', 'blackboardKey']), path);
  const useBlackboardKey = requireBoolean(source.useBlackboardKey, `${path}.useBlackboardKey`);
  const blackboardKey = requireString(source.blackboardKey, `${path}.blackboardKey`);
  if (useBlackboardKey && blackboardKey.length === 0) {
    throw new Error(`${path}: active integer blackboard reference has no key`);
  }
  return {
    value: requireInteger(source.value, `${path}.value`),
    blackboardKey: useBlackboardKey ? blackboardKey : null,
  };
}
