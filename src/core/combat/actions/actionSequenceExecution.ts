/**
 * 根据显式状态推进动作序列。执行端口只在调用期间使用，不进入保存的数据。
 * 状态赋值与同步回调的顺序沿用原有执行器，允许动作在执行中结束整个序列。
 */
import { COMBAT_STEP_STATE, type ActionSequenceState } from '../state/actionState';
import { STEP_RESULT_MODE, type CombatExecutionContext } from './combatStep';

/** 下标对应程序中的步骤；宿主必须即时读取本次步进的数据。 */
export interface ActionSequenceExecutionHost {
  canExecute(): boolean;
  execute(index: number): boolean;
  reset(index: number): void;
  tick(index: number, deltaTime: number): void;
  end(index: number): void;
}

export function executeActionSequence(
  state: ActionSequenceState,
  context: CombatExecutionContext,
  host: ActionSequenceExecutionHost,
): boolean {
  for (const [index, entry] of state.entries.entries()) {
    if (entry.state === COMBAT_STEP_STATE.ended) continue;
    if (entry.state !== COMBAT_STEP_STATE.pending) return false;

    // 原生 AbilityAction.Execute 在进入动作前检查宿主 canExecuteAction。
    // 必须逐项读实时状态；不能只在事件订阅入口检查一次，也不能阻止已开始项 End。
    const resultMode = context.sequence?.resultMode ?? STEP_RESULT_MODE.normal;
    entry.executionPermitted = host.canExecute() !== false;
    // 原生在进入 OnExecute 前写入状态 1；同步事件可在动作尚未返回时 End。
    entry.state = COMBAT_STEP_STATE.started;
    let result = entry.executionPermitted ? host.execute(index) : false;
    if (resultMode === STEP_RESULT_MODE.invertNextResult) {
      context.sequence!.resultMode = STEP_RESULT_MODE.normal;
      result = !result;
    }

    entry.executeResult = result;
    if (!result) return false;
  }
  return true;
}

export function resetActionSequence(
  state: ActionSequenceState,
  host: ActionSequenceExecutionHost,
): void {
  for (const [index, entry] of state.entries.entries()) {
    host.reset(index);
    entry.state = COMBAT_STEP_STATE.pending;
    entry.executeResult = false;
    entry.executionPermitted = false;
  }
}

export function tickActionSequence(
  state: ActionSequenceState,
  deltaTime: number,
  host: ActionSequenceExecutionHost,
): void {
  for (const [index, entry] of state.entries.entries()) {
    if (entry.state !== COMBAT_STEP_STATE.started && entry.state !== COMBAT_STEP_STATE.ticking) {
      continue;
    }
    if (!entry.executeResult || !entry.executionPermitted) continue;
    if (host.canExecute() === false) continue;

    entry.state = COMBAT_STEP_STATE.ticking;
    host.tick(index, deltaTime);
  }
}

export function endActionSequence(
  state: ActionSequenceState,
  host: ActionSequenceExecutionHost,
): void {
  for (const [index, entry] of state.entries.entries()) {
    if (
      (entry.state === COMBAT_STEP_STATE.started || entry.state === COMBAT_STEP_STATE.ticking) &&
      entry.executionPermitted
    )
      host.end(index);
    // 尚未开始的动作不调用 End，但也必须封闭，直到 Reset。
    entry.state = COMBAT_STEP_STATE.ended;
  }
}
