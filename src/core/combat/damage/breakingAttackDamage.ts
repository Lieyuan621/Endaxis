/**
 * 破防攻击专用输入转换与通用生命伤害公式之间的边界。
 * 只在命中明确使用破防攻击计算路径时调用，并保持原生数值转换顺序。
 */
export interface BreakingAttackCalculationInput {
  readonly attack: number;
  readonly targetDamageTakenMultiplier: number;
  readonly calculationMultiplier: number;
  readonly attackScale: number;
}

/**
 * 在通用伤害公式运行前复现破防攻击计算。
 * 每次类型转换都对应一个原生转换或浮点乘法边界。
 */
export function calculateBreakingAttackValue(input: BreakingAttackCalculationInput): number {
  const scaledAttack = Math.fround(input.attack * input.targetDamageTakenMultiplier);
  const attackScale = Math.fround(input.attackScale);
  const calculationMultiplier = Math.fround(input.calculationMultiplier);
  return Math.fround(Math.fround(attackScale * calculationMultiplier) * scaledAttack);
}
