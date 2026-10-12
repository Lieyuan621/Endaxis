import type { ComparisonOperator } from '../../../packages/game-data-contract/src/primitives.ts';

/**
 * 动作运行时和生成器共用的数值比较规则。
 * 输入由调用方解析；按原生调用选择 CompareFloat 或 CompareDouble 的输入及中间运算精度，不读取变量或修改战斗状态。
 */

export const COMBAT_FLOAT_COMPARISON_TOLERANCE = Math.fround(1e-5);

const doublePrecision = (value: number): number => value;

export function compareCombatNumbers(
  left: number,
  right: number,
  operator: ComparisonOperator,
  precision: 'float' | 'double' = 'float',
): boolean {
  const round = precision === 'float' ? Math.fround : doublePrecision;
  left = round(left);
  right = round(right);
  switch (operator) {
    case 'less':
      return left < round(right - COMBAT_FLOAT_COMPARISON_TOLERANCE);
    case 'lessOrEqual':
      return left <= round(right + COMBAT_FLOAT_COMPARISON_TOLERANCE);
    case 'greater':
      return left > round(right + COMBAT_FLOAT_COMPARISON_TOLERANCE);
    case 'greaterOrEqual':
      return left >= round(right - COMBAT_FLOAT_COMPARISON_TOLERANCE);
    case 'equal':
      return Math.abs(round(left - right)) <= COMBAT_FLOAT_COMPARISON_TOLERANCE;
    case 'notEqual':
      return Math.abs(round(left - right)) > COMBAT_FLOAT_COMPARISON_TOLERANCE;
  }
}
