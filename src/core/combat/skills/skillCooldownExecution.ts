/**
 * 冷却账本算法：保留预占、确认帧返还、动态倍率及显式覆盖的原有顺序。
 * 多个技能块必须引用同一个状态节点，不能各自复制一份冷却。
 */
import { createPeriodicTimerState } from '../state/environmentState';
import {
  isPeriodicTimerReady,
  readPeriodicTimerProgress,
  resetPeriodicTimer,
  setPeriodicTimerRemaining,
  updatePeriodicTimer,
} from '../time/periodicTimerExecution';
import type {
  SkillCooldownState,
  SkillCooldownProgram,
  SkillCooldownSnapshot,
} from '../state/abilityState';
const READY_EPSILON = 0.00001;

export function compileSkillCooldown(
  periodFrames?: number,
  commitFrame?: number,
): SkillCooldownProgram {
  if (periodFrames === undefined) return { periodFrames: 0 };
  if (!Number.isFinite(periodFrames) || periodFrames <= 0)
    throw new RangeError('skill cooldown period must be a positive finite frame count');
  if (commitFrame !== undefined && (!Number.isInteger(commitFrame) || commitFrame < 0))
    throw new RangeError('skill cooldown commit frame must be a non-negative integer');
  return { periodFrames, commitFrame };
}

export function createSkillCooldownState(program: SkillCooldownProgram): SkillCooldownState {
  const timer = program.periodFrames === 0 ? undefined : createPeriodicTimerState();
  if (timer !== undefined) resetPeriodicTimer(timer, program.periodFrames, false);
  return { timer, reservedByCurrentCast: false };
}

export function readSkillCooldown(state: SkillCooldownState): SkillCooldownSnapshot {
  const timer = state.timer;
  return {
    configured: timer !== undefined,
    ready: timer === undefined || isPeriodicTimerReady(timer),
    remainingFrames: timer === undefined ? 0 : Math.max(0, timer.remaining),
    progress: timer === undefined ? 1 : readPeriodicTimerProgress(timer),
  };
}

export function reserveSkillCooldown(
  state: SkillCooldownState,
  program: SkillCooldownProgram,
  resolvePeriodMultiplier: () => number,
): boolean {
  const timer = state.timer;
  if (timer === undefined) return true;
  if (!isPeriodicTimerReady(timer)) {
    state.reservedByCurrentCast = false;
    return false;
  }
  const multiplier = resolvePeriodMultiplier();
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    throw new RangeError(
      `skill cooldown period multiplier must be positive and finite, received ${multiplier}`,
    );
  }
  resetPeriodicTimer(timer, program.periodFrames * multiplier, true);
  state.reservedByCurrentCast = true;
  return true;
}

export function advanceSkillCooldown(state: SkillCooldownState, deltaFrames = 1): boolean {
  if (!Number.isFinite(deltaFrames) || deltaFrames < 0) {
    throw new RangeError('cooldown delta frames must be a non-negative finite number');
  }
  const timer = state.timer;
  return (
    timer !== undefined && !isPeriodicTimerReady(timer) && updatePeriodicTimer(timer, deltaFrames)
  );
}

export function reduceSkillCooldownByRatio(
  state: SkillCooldownState,
  program: SkillCooldownProgram,
  ratio: number,
): boolean {
  if (!Number.isFinite(ratio) || ratio < 0) {
    throw new RangeError('skill cooldown reduction ratio must be a non-negative finite number');
  }
  const timer = state.timer;
  if (timer === undefined || isPeriodicTimerReady(timer)) return false;
  updatePeriodicTimer(timer, program.periodFrames * ratio);
  return true;
}

export function reduceSkillCooldownByFrames(state: SkillCooldownState, frames: number): boolean {
  if (!Number.isFinite(frames) || frames < 0) {
    throw new RangeError('skill cooldown reduction frames must be non-negative and finite');
  }
  const timer = state.timer;
  if (timer === undefined || isPeriodicTimerReady(timer)) return false;
  updatePeriodicTimer(timer, frames);
  return true;
}

export function setSkillCooldownByRatio(
  state: SkillCooldownState,
  program: SkillCooldownProgram,
  ratio: number,
): boolean {
  if (!Number.isFinite(ratio) || ratio < 0) {
    throw new RangeError('skill cooldown ratio must be a non-negative finite number');
  }
  const timer = state.timer;
  if (timer === undefined) return false;
  setPeriodicTimerRemaining(timer, program.periodFrames * ratio);
  return true;
}

export function setSkillCooldownProgress(
  state: SkillCooldownState,
  program: SkillCooldownProgram,
  progress: number,
): boolean {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new RangeError('skill cooldown progress must be a finite number between 0 and 1');
  }
  return setSkillCooldownByRatio(state, program, 1 - progress);
}

export function overrideSkillCooldown(
  state: SkillCooldownState,
  program: SkillCooldownProgram,
  ready: boolean,
): boolean {
  // 用户控制覆盖既有施放的预占；随后结束该施放不能退回这次显式设置。
  state.reservedByCurrentCast = false;
  return setSkillCooldownByRatio(state, program, ready ? 0 : 1);
}

export function setSkillCooldownFrames(state: SkillCooldownState, frames: number): boolean {
  if (!Number.isFinite(frames) || frames < 0) {
    throw new RangeError('skill cooldown frames must be a non-negative finite number');
  }
  const timer = state.timer;
  if (timer === undefined) return false;
  setPeriodicTimerRemaining(timer, frames);
  return true;
}

export function finishSkillCooldownCast(
  state: SkillCooldownState,
  program: SkillCooldownProgram,
): boolean {
  const timer = state.timer;
  if (!state.reservedByCurrentCast || timer === undefined) return false;
  state.reservedByCurrentCast = false;
  if (program.commitFrame === undefined) return false;
  if (timer.passed >= program.commitFrame - READY_EPSILON) return false;
  resetPeriodicTimer(timer, program.periodFrames, false);
  return true;
}
