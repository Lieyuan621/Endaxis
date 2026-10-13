/**
 * 分支动作的选择与生命周期算法。Switch 与条件动作保留各自选择和重置规则。
 * 宿主只在调用期间提供分支操作，状态中不保存序列对象或闭包。
 */
import type { BranchActionState } from '../state/actionState';
import type { CombatExecutionContext } from './combatStep';

/** 分支 true、false 分别为 0、1；绑定不保存本次调用的上下文，允许同步重入。 */
export interface BranchActionHost {
  execute(index: number, context: CombatExecutionContext): boolean;
  tick(index: number, deltaTime: number, context: CombatExecutionContext): void;
  end(index: number, context: CombatExecutionContext): void;
  reset(index: number, context: CombatExecutionContext): void;
}

export function executeSwitchAction(
  state: BranchActionState,
  optionCount: number,
  alwaysNext: boolean,
  host: BranchActionHost & { choice(): number; value(index: number): number },
  context: CombatExecutionContext,
): boolean {
  state.activeBranch = null;
  const choice = Math.fround(host.choice());
  for (let index = 0; index < optionCount; index += 1) {
    const value = Math.fround(host.value(index));
    // 减法也收窄为 float32；NaN 不匹配。命中后不读取后面的标签。
    if (!(Math.abs(Math.fround(value - choice)) <= Math.fround(1e-5))) continue;
    state.activeBranch = index;
    const result = host.execute(index, context);
    return alwaysNext || result;
  }
  return alwaysNext;
}

export function executeConditionalAction(
  state: BranchActionState,
  hasFalseBranch: boolean,
  alwaysNext: boolean,
  host: BranchActionHost & { evaluate(context: CombatExecutionContext): boolean },
  context: CombatExecutionContext,
): boolean {
  // 条件及其同步通知先完成，再替换选中分支。
  const passed = host.evaluate(context);
  state.activeBranch = passed ? 0 : hasFalseBranch ? 1 : null;
  const result = state.activeBranch === null ? passed : host.execute(state.activeBranch, context);
  return alwaysNext || result;
}

export function tickBranchAction(
  state: BranchActionState,
  delta: number,
  host: BranchActionHost,
  context: CombatExecutionContext,
): void {
  if (state.activeBranch !== null) host.tick(state.activeBranch, delta, context);
}

export function endBranchAction(
  state: BranchActionState,
  host: BranchActionHost,
  context: CombatExecutionContext,
): void {
  if (state.activeBranch !== null) host.end(state.activeBranch, context);
}

/** Switch 重置所有分支，但沿用原生规则保留选择；下一次 Execute 才清除。 */
export function resetSwitchAction(
  optionCount: number,
  host: BranchActionHost,
  context: CombatExecutionContext,
): void {
  for (let index = 0; index < optionCount; index += 1) host.reset(index, context);
}

/** IfElse 先重置两支以准备攻击快照，再清除选择。 */
export function resetConditionalAction(
  state: BranchActionState,
  hasFalseBranch: boolean,
  host: BranchActionHost,
  context: CombatExecutionContext,
): void {
  host.reset(0, context);
  if (hasFalseBranch) host.reset(1, context);
  state.activeBranch = null;
}
