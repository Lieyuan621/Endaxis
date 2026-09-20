/**
 * 分支动作的选择与生命周期算法。Switch 与条件动作保留各自选择和重置规则。
 * 宿主只在调用期间提供分支操作，状态中不保存序列对象或闭包。
 */
import type { BranchActionState } from '../state/actionState';

/** 分支下标对应不可变程序；条件动作的 true、false 分别为 0、1。 */
export interface BranchActionHost {
  execute(index: number): boolean;
  tick(index: number, deltaTime: number): void;
  end(index: number): void;
  reset(index: number): void;
}

export function executeSwitchAction(
  state: BranchActionState,
  optionCount: number,
  alwaysNext: boolean,
  host: BranchActionHost & { choice(): number; value(index: number): number },
): boolean {
  state.activeBranch = null;
  const choice = Math.fround(host.choice());
  for (let index = 0; index < optionCount; index += 1) {
    const value = Math.fround(host.value(index));
    // 减法也收窄为 float32；NaN 不匹配。命中后不读取后面的标签。
    if (!(Math.abs(Math.fround(value - choice)) <= Math.fround(1e-5))) continue;
    state.activeBranch = index;
    const result = host.execute(index);
    return alwaysNext || result;
  }
  return alwaysNext;
}

export function executeConditionalAction(
  state: BranchActionState,
  hasFalseBranch: boolean,
  alwaysNext: boolean,
  host: BranchActionHost & { evaluate(): boolean },
): boolean {
  // 条件及其同步通知先完成，再替换选中分支。
  const passed = host.evaluate();
  state.activeBranch = passed ? 0 : hasFalseBranch ? 1 : null;
  const result = state.activeBranch === null ? passed : host.execute(state.activeBranch);
  return alwaysNext || result;
}

export function tickBranchAction(
  state: BranchActionState,
  delta: number,
  host: BranchActionHost,
): void {
  if (state.activeBranch !== null) host.tick(state.activeBranch, delta);
}

export function endBranchAction(state: BranchActionState, host: BranchActionHost): void {
  if (state.activeBranch !== null) host.end(state.activeBranch);
}

/** Switch 重置所有分支，但沿用原生规则保留选择；下一次 Execute 才清除。 */
export function resetSwitchAction(optionCount: number, host: BranchActionHost): void {
  for (let index = 0; index < optionCount; index += 1) host.reset(index);
}

/** IfElse 先重置两支以准备攻击快照，再清除选择。 */
export function resetConditionalAction(
  state: BranchActionState,
  hasFalseBranch: boolean,
  host: BranchActionHost,
): void {
  host.reset(0);
  if (hasFalseBranch) host.reset(1);
  state.activeBranch = null;
}
