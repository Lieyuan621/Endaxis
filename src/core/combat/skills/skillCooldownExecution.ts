/**
 * 冷却账本算法：保留预占、确认帧返还、动态倍率及显式覆盖的原有顺序。
 * 多个技能块必须引用同一个状态节点，不能各自复制一份冷却。
 */
import { createPeriodicTimerState } from '../state/environmentState';
import { COMBAT_FRAMES_PER_SECOND } from '../time/combatClock';
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

export type ComboSkillCooldownReadiness =
  | { readonly oneReady: true }
  | { readonly oneReady: boolean; readonly maxPassedTime: number; readonly startCdFrame: number };

/** 原生连携准入：存在就绪计时器，或最大已过时间尚未到 startCdTime。 */
export function isComboTriggerReady(cooldown: ComboSkillCooldownReadiness): boolean {
  if (cooldown.oneReady) return true;
  if (!Number.isFinite(cooldown.maxPassedTime) || !Number.isFinite(cooldown.startCdFrame))
    throw new Error('combo condition cooldown values must be finite');
  return (
    Math.fround(cooldown.maxPassedTime) <
    Math.fround(Math.fround(cooldown.startCdFrame) / COMBAT_FRAMES_PER_SECOND)
  );
}

export function compileSkillCooldown(
  periodFrames?: number,
  commitFrame?: number,
): SkillCooldownProgram {
  if (periodFrames === undefined) return { periodFrames: 0, configured: false };
  if (!Number.isFinite(periodFrames) || periodFrames < 0)
    throw new RangeError('skill cooldown period must be a non-negative finite frame count');
  if (commitFrame !== undefined && (!Number.isInteger(commitFrame) || commitFrame < 0))
    throw new RangeError('skill cooldown commit frame must be a non-negative integer');
  return { periodFrames, commitFrame, configured: true };
}

export function createSkillCooldownState(program: SkillCooldownProgram): SkillCooldownState {
  const timer = !program.configured ? undefined : createPeriodicTimerState();
  if (timer !== undefined) resetPeriodicTimer(timer, program.periodFrames, false);
  return { timer, reservedByCurrentCast: false };
}

export function readSkillCooldown(state: SkillCooldownState): SkillCooldownSnapshot {
  const timer = state.timer;
  return {
    configured: timer !== undefined && timer.period > 0,
    ready: timer === undefined || isPeriodicTimerReady(timer),
    remainingFrames: timer === undefined ? 0 : Math.max(0, timer.remaining),
    progress: timer === undefined ? 1 : readPeriodicTimerProgress(timer),
  };
}

export function reserveSkillCooldown(
  state: SkillCooldownState,
  program: SkillCooldownProgram,
  resolvePeriodFrames: (baseFrames: number) => number,
): boolean {
  const timer = state.timer;
  if (timer === undefined) return true;
  if (!isPeriodicTimerReady(timer)) {
    state.reservedByCurrentCast = false;
    return false;
  }
  const periodFrames = resolvePeriodFrames(program.periodFrames);
  if (!Number.isFinite(periodFrames)) {
    throw new RangeError(`skill cooldown period must be finite, received ${periodFrames}`);
  }
  resetPeriodicTimer(timer, periodFrames, true);
  state.reservedByCurrentCast = timer.period > 0;
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

export function reduceSkillCooldownByRatio(state: SkillCooldownState, ratio: number): boolean {
  if (!Number.isFinite(ratio) || ratio < 0) {
    throw new RangeError('skill cooldown reduction ratio must be a non-negative finite number');
  }
  const timer = state.timer;
  if (timer === undefined || isPeriodicTimerReady(timer)) return false;
  setPeriodicTimerRemaining(timer, Math.max(0, timer.remaining - timer.period * ratio));
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

export function setSkillCooldownByRatio(state: SkillCooldownState, ratio: number): boolean {
  if (!Number.isFinite(ratio) || ratio < 0) {
    throw new RangeError('skill cooldown ratio must be a non-negative finite number');
  }
  const timer = state.timer;
  if (timer === undefined) return false;
  return setSkillCooldownFrames(state, timer.period * ratio);
}

export function setSkillCooldownProgress(state: SkillCooldownState, progress: number): boolean {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new RangeError('skill cooldown progress must be a finite number between 0 and 1');
  }
  return setSkillCooldownByRatio(state, 1 - progress);
}

export function overrideSkillCooldown(
  state: SkillCooldownState,
  program: SkillCooldownProgram,
  ready: boolean,
): boolean {
  // 用户控制覆盖既有施放的预占；随后结束该施放不能退回这次显式设置。
  state.reservedByCurrentCast = false;
  return setSkillCooldownFrames(state, ready ? 0 : program.periodFrames);
}

export function setSkillCooldownFrames(state: SkillCooldownState, frames: number): boolean {
  if (!Number.isFinite(frames) || frames < 0) {
    throw new RangeError('skill cooldown frames must be a non-negative finite number');
  }
  const timer = state.timer;
  if (timer === undefined) return false;
  // 原生 SetRemainingTime 会扩展周期；零基础战技也能被显式设置为正冷却。
  if (frames > timer.period + READY_EPSILON) timer.period = frames;
  if (timer.period <= 0) {
    resetPeriodicTimer(timer, 0, false);
    return true;
  }
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

/** 原生 Set：没有正在恢复的层时，按当前 Skill.cooldown 重建第一层。 */
export function prepareReadySkillCooldownSet(
  state: SkillCooldownState,
  periodFrames: number,
): void {
  if (!Number.isFinite(periodFrames)) throw new RangeError('skill cooldown period must be finite');
  if (state.timer !== undefined && isPeriodicTimerReady(state.timer))
    resetPeriodicTimer(state.timer, periodFrames, false);
}
