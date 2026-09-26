import type { ComparisonOperator } from '../../../packages/game-data-contract/src/primitives.ts';

/**
 * 动作运行时和生成器共用的数值比较规则。
 * 输入已经由调用方解析；这里不读取黑板，也不改变浮点精度或执行任何战斗行为。
 */

export const COMBAT_FLOAT_COMPARISON_TOLERANCE = 1e-5;

export function compareCombatNumbers(
  left: number,
  right: number,
  operator: ComparisonOperator,
): boolean {
  switch (operator) {
    case 'less':
      return left < right - COMBAT_FLOAT_COMPARISON_TOLERANCE;
    case 'lessOrEqual':
      return left <= right + COMBAT_FLOAT_COMPARISON_TOLERANCE;
    case 'greater':
      return left > right + COMBAT_FLOAT_COMPARISON_TOLERANCE;
    case 'greaterOrEqual':
      return left >= right - COMBAT_FLOAT_COMPARISON_TOLERANCE;
    case 'equal':
      return Math.abs(left - right) <= COMBAT_FLOAT_COMPARISON_TOLERANCE;
    case 'notEqual':
      return Math.abs(left - right) > COMBAT_FLOAT_COMPARISON_TOLERANCE;
  }
}
