/** 动作序列的跳转控制；状态仍由动作宿主持有。 */
import type { TimelineJumpState } from '../state/actionState';

/** 条件检查包含其同步通知；取请求时验证宿主，不能在已跳转后才发现缺少宿主。 */
export interface TimelineJumpExecutionHost {
  evaluate(): boolean;
  resolveRequest(): () => void;
}

export function executeTimelineJump(
  state: TimelineJumpState,
  host: TimelineJumpExecutionHost,
): void {
  state.skipInitialTick = true;
  tryJump(state, host);
}

export function tickTimelineJump(state: TimelineJumpState, host: TimelineJumpExecutionHost): void {
  if (state.skipInitialTick) {
    state.skipInitialTick = false;
    return;
  }
  tryJump(state, host);
}

export function resetTimelineJump(state: TimelineJumpState): void {
  state.jumped = false;
  state.skipInitialTick = false;
}

function tryJump(state: TimelineJumpState, host: TimelineJumpExecutionHost): void {
  if (state.jumped || !host.evaluate()) return;
  const request = host.resolveRequest();
  state.jumped = true;
  request();
}
