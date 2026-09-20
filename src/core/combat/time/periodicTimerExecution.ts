/** 根据传入数据推进原生单周期计时，不持有内部对象。 */
import type { PeriodicTimerState } from '../state/environmentState';
const READY_EPSILON = 0.00001;

export function isPeriodicTimerValid(state: PeriodicTimerState): boolean {
  return state.period > 0;
}

export function isPeriodicTimerReady(state: PeriodicTimerState): boolean {
  return Math.abs(state.remaining) <= READY_EPSILON;
}

export function readPeriodicTimerProgress(state: PeriodicTimerState): number {
  return state.period === 0 ? 1 : Math.min(1, Math.max(0, 1 - state.remaining / state.period));
}

export function resetPeriodicTimer(
  state: PeriodicTimerState,
  period: number,
  waitFirstPeriod: boolean,
): void {
  state.period = Math.max(0, period);
  state.remaining = waitFirstPeriod ? state.period : 0;
  state.passed = 0;
}

export function setPeriodicTimerRemaining(state: PeriodicTimerState, remaining: number): void {
  if (!isPeriodicTimerValid(state))
    throw new Error('cannot set remaining time on an invalid timer');
  if (!Number.isFinite(remaining) || remaining < 0) {
    throw new RangeError('timer remaining time must be a non-negative finite number');
  }
  state.remaining = remaining;
  state.passed = Math.max(0, state.period - state.remaining);
}

export function invalidatePeriodicTimer(state: PeriodicTimerState): void {
  state.period = -1;
  state.remaining = -1;
}

export function updatePeriodicTimer(state: PeriodicTimerState, deltaTime: number): boolean {
  if (deltaTime < 0) throw new RangeError('timer delta must not be negative');
  state.remaining -= deltaTime;
  state.passed += deltaTime;
  if (state.remaining > 0) return false;
  state.remaining = 0;
  state.passed = state.period;
  return true;
}
