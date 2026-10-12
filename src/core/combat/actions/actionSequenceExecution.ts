/**
 * 根据显式状态推进动作序列。执行端口只在调用期间使用，不进入保存的数据。
 * 状态赋值与同步回调的顺序沿用原有执行器，允许动作在执行中结束整个序列。
 */
import { COMBAT_STEP_STATE, STEP_RESULT_MODE, type ActionStepState } from '../state/actionState';
import type { CombatExecutionContext } from './combatStep';

/** 宿主接收当前条目和本次调用的上下文，不跨调用保存临时上下文。 */
export interface ActionSequenceExecutionHost<Key = number> {
  canExecute(): boolean;
  executeStep(index: Key, context: CombatExecutionContext): boolean;
  resetStep(index: Key, context: CombatExecutionContext, reason?: 'normal' | 'afterInstant'): void;
  tickStep(index: Key, deltaTime: number, context: CombatExecutionContext): void;
  endStep(index: Key, context: CombatExecutionContext): void;
}

export function executeActionSequence<Key>(
  entries: Iterable<[Key, ActionStepState]>,
  context: CombatExecutionContext,
  host: ActionSequenceExecutionHost<Key>,
  resetAfterExecute = false,
): boolean {
  context.sequence ??= { resultMode: STEP_RESULT_MODE.normal };
  for (const [index, entry] of entries) {
    if (entry.state === COMBAT_STEP_STATE.ended) continue;
    if (entry.state !== COMBAT_STEP_STATE.pending) return false;

    // 原生 AbilityAction.Execute 在进入动作前检查宿主 canExecuteAction。
    // 必须逐项读实时状态；不能只在事件订阅入口检查一次，也不能阻止已开始项 End。
    const resultMode = context.sequence.resultMode;
    entry.executionPermitted = host.canExecute() !== false;
    // 原生在进入 OnExecute 前写入状态 1；同步事件可在动作尚未返回时 End。
    entry.state = COMBAT_STEP_STATE.started;
    let result: boolean;
    try {
      result = entry.executionPermitted ? host.executeStep(index, context) : false;
      if (resultMode === STEP_RESULT_MODE.invertNextResult) {
        context.sequence!.resultMode = STEP_RESULT_MODE.normal;
        result = !result;
      }
      entry.executeResult = result;
    } finally {
      // 原生同步条件逐项 End/Reset，已完成的前缀可再次执行；
      // 重入遇到仍在执行的项则在上方返回，不能结束外层正在执行的动作。
      if (resetAfterExecute) {
        if (
          (entry.state === COMBAT_STEP_STATE.started ||
            entry.state === COMBAT_STEP_STATE.ticking) &&
          entry.executionPermitted
        )
          host.endStep(index, context);
        entry.state = COMBAT_STEP_STATE.ended;
        host.resetStep(index, context, 'afterInstant');
        entry.state = COMBAT_STEP_STATE.pending;
        entry.executeResult = false;
        entry.executionPermitted = false;
      }
    }
    if (!result) return false;
  }
  return true;
}

export function resetActionSequence<Key>(
  entries: Iterable<[Key, ActionStepState]>,
  context: CombatExecutionContext,
  host: ActionSequenceExecutionHost<Key>,
): void {
  for (const [index, entry] of entries) {
    host.resetStep(index, context);
    entry.state = COMBAT_STEP_STATE.pending;
    entry.executeResult = false;
    entry.executionPermitted = false;
  }
}

export function tickActionSequence<Key>(
  entries: Iterable<[Key, ActionStepState]>,
  deltaTime: number,
  context: CombatExecutionContext,
  host: ActionSequenceExecutionHost<Key>,
): void {
  for (const [index, entry] of entries) {
    if (entry.state !== COMBAT_STEP_STATE.started && entry.state !== COMBAT_STEP_STATE.ticking) {
      continue;
    }
    if (!entry.executeResult || !entry.executionPermitted) continue;
    if (host.canExecute() === false) continue;

    entry.state = COMBAT_STEP_STATE.ticking;
    host.tickStep(index, deltaTime, context);
  }
}

export function endActionSequence<Key>(
  entries: Iterable<[Key, ActionStepState]>,
  context: CombatExecutionContext,
  host: ActionSequenceExecutionHost<Key>,
): void {
  for (const [index, entry] of entries) {
    if (
      (entry.state === COMBAT_STEP_STATE.started || entry.state === COMBAT_STEP_STATE.ticking) &&
      entry.executionPermitted
    )
      host.endStep(index, context);
    // 尚未开始的动作不调用 End，但也必须封闭，直到 Reset。
    entry.state = COMBAT_STEP_STATE.ended;
  }
}
