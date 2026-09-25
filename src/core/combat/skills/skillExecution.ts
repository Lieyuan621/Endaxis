/**
 * 根据显式技能状态处理开局记账、逐帧扣费和自然结束。外部操作在本次调用内同步执行。
 * 扣费先于时间轴，结束检查后于时间轴；同步动作可能改变当前状态，不能提前缓存判定结果。
 */
import { COMBAT_FRAMES_PER_SECOND } from '../time/combatClock';
import type { SkillExecutionState } from '../state/abilityState';

/** 初始化前黑板和时间轴已按原顺序重置；分配编号仍在原来的时点调用。 */
export function beginSkillCast(
  state: SkillExecutionState,
  frame: number,
  allocateCastId: () => number,
): void {
  state.passedFrames = 0;
  state.inputTarget = state.preparedInputTarget;
  state.preparedInputTarget = undefined;
  state.castStartFrame = frame;
  state.appliedCost = state.preparedSkipApplyCost;
  state.attemptedCost = state.preparedSkipApplyCost;
  state.forceTimelinePayment = state.preparedForceTimelinePayment;
  state.preparationCast = frame < 0;
  state.timelineFinishRequested = false;
  state.reachedOperableBoundaryFrame = undefined;
  state.operableBoundaryCandidateFrame = undefined;
  state.operableBoundaryCandidateSkillIds.length = 0;
  state.inheritedSkillCastInfo = state.preparedSkillCastInfo;
  state.nonReturnedSpCost = state.preparedSkillCastInfo?.nonReturnedSpCost ?? 0;
  state.skillCastId =
    state.preparedSkillCastId === 0 ? allocateCastId() : state.preparedSkillCastId;
  state.preparedSkillCastId = 0;
  state.preparedSkillCastInfo = undefined;
  state.preparedSkipApplyCost = false;
  state.preparedForceTimelinePayment = false;
  if (!Number.isSafeInteger(state.skillCastId) || state.skillCastId <= 0) {
    throw new RangeError('allocated skill cast id must be a positive safe integer');
  }
  state.state = 'casting';
}

export interface SkillTickHost {
  applyCost(): void;
  tickTimeline(frame: number, deltaSeconds: number): void;
}

export function tickSkillExecution(
  state: SkillExecutionState,
  costFrame: number | undefined,
  delta: number,
  host: SkillTickHost,
): void {
  if (!state.attemptedCost && costFrame !== undefined && state.passedFrames >= costFrame) {
    state.attemptedCost = true;
    host.applyCost();
  }
  host.tickTimeline(state.passedFrames, delta);
}

export interface SkillAdvanceHost {
  advanceCooldown(deltaFrames: number): boolean;
  cooldownReady(): void;
  tick(deltaSeconds: number): void;
  timelineComplete(): boolean;
  end(): void;
}

/** 附着集合由调用方在结束时间轴之前取快照，finishAttached 只清理这份快照。 */
export interface SkillEndHost {
  endTimeline(frame: number): void;
  finishAttached(): void;
  finishCooldown(): boolean;
  cooldownRefunded(): void;
  recordEnded(): void;
  emitEnded(): void;
}

export function endSkillExecution(state: SkillExecutionState, host: SkillEndHost): void {
  if (state.state !== 'casting') return;
  host.endTimeline(state.passedFrames);
  host.finishAttached();
  if (host.finishCooldown()) host.cooldownRefunded();
  state.state = 'ended';
  host.recordEnded();
  host.emitEnded();
}

export function advanceSkillExecution(
  state: SkillExecutionState,
  naturalDurationFrames: number | undefined,
  advancesCooldown: boolean,
  timelineDeltaSeconds: number,
  cooldownDeltaSeconds: number,
  host: SkillAdvanceHost,
): void {
  if (
    !Number.isFinite(timelineDeltaSeconds) ||
    timelineDeltaSeconds < 0 ||
    !Number.isFinite(cooldownDeltaSeconds) ||
    cooldownDeltaSeconds < 0
  ) {
    throw new RangeError('skill deltas must be non-negative finite numbers');
  }
  if (advancesCooldown && host.advanceCooldown(cooldownDeltaSeconds * COMBAT_FRAMES_PER_SECOND)) {
    host.cooldownReady();
  }
  if (state.state !== 'casting') return;
  state.passedFrames += timelineDeltaSeconds * COMBAT_FRAMES_PER_SECOND;
  host.tick(timelineDeltaSeconds);
  // 原生自然时长到期帧先完成 Timeline Tick，再 CastEnd。无自然时长时使用动作完成边界。
  if (
    state.timelineFinishRequested ||
    (naturalDurationFrames === undefined
      ? host.timelineComplete()
      : state.passedFrames >= naturalDurationFrames)
  )
    host.end();
}
