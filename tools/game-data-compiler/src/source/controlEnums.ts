import { requireNativeEnum } from './primitives.ts';

// 原生倒地动作的常量，各动作的执行差异分别处理。
// 共享的是字段类型身份，不是各控制动作的返回策略或木桩简化规则。
const DEAD_OPTIONS = new Map([
  [0, 'AllValid'],
  [1, 'OnlyAlive'],
  [2, 'OnlyDead'],
] as const);
const RETURN_TRUE_METHODS = new Map([
  [0, 'Always'],
  [1, 'BothSuccessAndInterrupted'],
  [2, 'OnlySuccess'],
  [3, 'OnlyInterrupted'],
] as const);

export type ControlledStateDeadOptionSource = ReturnType<typeof readControlledStateDeadOption>;
export type AbilityActionReturnTrueMethodSource = ReturnType<
  typeof readAbilityActionReturnTrueMethod
>;

export function readControlledStateDeadOption(value: unknown, path: string) {
  return requireNativeEnum(value, DEAD_OPTIONS, path);
}

export function readAbilityActionReturnTrueMethod(value: unknown, path: string) {
  return requireNativeEnum(value, RETURN_TRUE_METHODS, path);
}
