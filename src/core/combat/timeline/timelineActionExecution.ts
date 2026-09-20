/**
 * 时间轴程序及调度算法。程序只包含固定区间，进度由调用方传入，动作通过本次执行端口调用。
 * 同帧顺序、同步 End 和 JumpTo 的区别沿用原调度器，不改变游戏规则。
 */
import type { TimelineActionState } from '../state/actionState';

/** 已排序的动作区间；sourceIndex 对应原始配置中的步骤绑定。 */
export interface TimelineActionInterval {
  readonly startFrame: number;
  readonly endFrame?: number;
  readonly sourceIndex: number;
}

/** 当前调用期间可用的动作端口；index 是排序后的程序下标。 */
export interface TimelineActionExecutionHost {
  reset(index: number): void;
  execute(index: number): void;
  tick(index: number, deltaTime: number): void;
  end(index: number): void;
  started(index: number, frame: number): void;
  ended(index: number, frame: number): void;
}

export function compileTimelineActionIntervals(
  actions: readonly { readonly startFrame: number; readonly endFrame?: number }[],
): readonly TimelineActionInterval[] {
  actions.forEach((action, index) => {
    if (!Number.isInteger(action.startFrame)) {
      throw new TypeError(`timeline action ${index} must use an integer frame`);
    }
    if (
      action.endFrame !== undefined &&
      (!Number.isInteger(action.endFrame) || action.endFrame < action.startFrame)
    ) {
      throw new TypeError(`timeline action ${index} must use endFrame >= startFrame`);
    }
  });
  // 起点排序仅供到期游标检索；执行时按 sourceIndex 恢复原生配置顺序。
  return actions
    .map((action, sourceIndex) => ({
      startFrame: action.startFrame,
      endFrame: action.endFrame,
      sourceIndex,
    }))
    .sort((a, b) => a.startFrame - b.startFrame || a.sourceIndex - b.sourceIndex);
}

export function resetTimelineActions(
  state: TimelineActionState,
  program: readonly TimelineActionInterval[],
  host: TimelineActionExecutionHost,
): void {
  state.ended = false;
  state.nextPendingIndex = 0;
  state.active.length = 0;
  state.starting = null;
  state.startingCrossedByJump = false;
  state.startingJumpDestination = null;
  for (let index = 0; index < program.length; index += 1) host.reset(index);
}

export function tickTimelineActions(
  state: TimelineActionState,
  program: readonly TimelineActionInterval[],
  currentFrame: number,
  deltaTime: number,
  host: TimelineActionExecutionHost,
): void {
  if (state.ended) return;
  // 原生 Load 保留配置顺序，_TickInternal 按该顺序逐项推进和结束。
  // 按起点排序的程序只用于定位到期项，不能把活动节点和新节点分成两个执行阶段。
  const pendingStart = state.nextPendingIndex;
  const due = [...state.active];
  for (let index = pendingStart; index < program.length; index += 1) {
    if (program[index]!.startFrame > currentFrame) break;
    due.push(index);
  }
  due.sort((left, right) => program[left]!.sourceIndex - program[right]!.sourceIndex);
  // 本次调用内的乱序完成集合，不进入切面；返回前游标已经越过全部到期项。
  const started = new Set<number>();
  for (const indexedAction of due) {
    if (state.ended) break;
    if (indexedAction < pendingStart) {
      // 前一节点的同步 End / JumpTo 可能已经结束这个活动项。
      if (!state.active.includes(indexedAction)) continue;
      host.tick(indexedAction, deltaTime);
      const activeIndex = state.active.indexOf(indexedAction);
      if (
        activeIndex >= 0 &&
        (program[indexedAction]!.endFrame ?? program[indexedAction]!.startFrame) <= currentFrame
      ) {
        state.active.splice(activeIndex, 1);
        endInterval(indexedAction, currentFrame, host);
      }
      continue;
    }
    // 跳转或结束会推进游标，已跳过的节点不能从本帧候选列表重新启动。
    if (indexedAction < state.nextPendingIndex) continue;
    started.add(indexedAction);
    while (started.has(state.nextPendingIndex)) state.nextPendingIndex += 1;
    state.starting = indexedAction;
    state.startingCrossedByJump = false;
    state.startingJumpDestination = null;
    host.started(indexedAction, currentFrame);
    host.execute(indexedAction);
    // 同步 JumpTo / CastEnd 保留原有当前序列收尾协议。
    if (state.startingCrossedByJump) {
      endInterval(indexedAction, state.startingJumpDestination!, host);
    } else {
      // 原生 Pending 分支直接进入下一节点，首次普通 Tick/End 留到后续访问。
      // 瞬时区间也进入活动集合，复用既有切面状态保存 Execute 后的寿命。
      state.active.push(indexedAction);
    }
    state.starting = null;
    state.startingJumpDestination = null;
    state.startingCrossedByJump = false;
    while (started.has(state.nextPendingIndex)) state.nextPendingIndex += 1;
  }
}
/**
 * 原生 JumpTo：跳过起始帧严格早于目标的待执行项，正常结束到期活动项。
 * 跨越目标的活动项继续存活，目标帧上的待执行项留给下次 Tick。反向跳转没有证据支持。
 */
export function jumpToTimelineActions(
  state: TimelineActionState,
  program: readonly TimelineActionInterval[],
  destinationFrame: number,
  currentFrame: number,
  host: TimelineActionExecutionHost,
): void {
  if (!Number.isInteger(destinationFrame)) {
    throw new TypeError('timeline jump destination must use an integer frame');
  }
  if (destinationFrame < currentFrame) {
    throw new RangeError('backward timeline jumps are not supported');
  }

  const startingEndFrame = state.starting === null ? undefined : program[state.starting]!.endFrame;
  if (
    state.starting !== null &&
    (startingEndFrame === undefined || startingEndFrame <= destinationFrame)
  ) {
    // 当前序列仍位于 execute 调用栈中；返回后再 End，避免重入其步骤生命周期。
    state.startingCrossedByJump = true;
    state.startingJumpDestination = destinationFrame;
  }

  for (let index = state.active.length - 1; index >= 0; index -= 1) {
    const indexedAction = state.active[index]!;
    if ((program[indexedAction]!.endFrame ?? program[indexedAction]!.startFrame) > destinationFrame)
      continue;
    state.active.splice(index, 1);
    endInterval(indexedAction, destinationFrame, host);
  }

  while (
    state.nextPendingIndex < program.length &&
    program[state.nextPendingIndex]!.startFrame < destinationFrame
  ) {
    state.nextPendingIndex += 1;
  }
}

/** 原生 InterruptCurSkillAction：结束活动项并丢弃全部尚未开始项。 */
export function finishTimelineActions(
  state: TimelineActionState,
  program: readonly TimelineActionInterval[],
  currentFrame: number,
  host: TimelineActionExecutionHost,
): void {
  if (state.starting !== null) {
    state.startingCrossedByJump = true;
    state.startingJumpDestination = currentFrame;
  }
  for (let index = state.active.length - 1; index >= 0; index -= 1) {
    const indexedAction = state.active[index]!;
    state.active.splice(index, 1);
    endInterval(indexedAction, currentFrame, host);
  }
  state.nextPendingIndex = program.length;
}

export function endTimelineActions(
  state: TimelineActionState,
  program: readonly TimelineActionInterval[],
  currentFrame: number,
  host: TimelineActionExecutionHost,
): void {
  if (state.ended) return;
  // 原生 CastEnd 清理后关闭 isCasting；下一条 timeline 每次检查该状态。
  // 先封闭调度入口，避免 End 的同步回调重入，Reset 才允许再次启动。
  state.ended = true;
  state.nextPendingIndex = program.length;
  if (state.starting !== null) {
    state.startingCrossedByJump = true;
    state.startingJumpDestination = currentFrame;
    // CastEnd 与 JumpTo 不同：原生同步 End 所有序列，包括当前进入中的序列。
    host.end(state.starting);
  }
  for (const indexedAction of state.active.splice(0)) {
    endInterval(indexedAction, currentFrame, host);
  }
}

function endInterval(index: number, frame: number, host: TimelineActionExecutionHost): void {
  host.end(index);
  host.ended(index, frame);
}
