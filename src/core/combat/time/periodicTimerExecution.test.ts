import { describe, expect, it } from 'vitest';
import { createPeriodicTimerState } from '../state/environmentState';
import {
  resetPeriodicTimer,
  updatePeriodicTimer,
  readPeriodicTimerProgress,
  isPeriodicTimerReady,
  isPeriodicTimerValid,
  setPeriodicTimerRemaining,
} from './periodicTimerExecution';

describe('PeriodicTimer', () => {
  it('advances and clamps at the ready boundary', () => {
    const timer = createPeriodicTimerState();
    resetPeriodicTimer(timer, 10, true);

    expect(updatePeriodicTimer(timer, 3)).toBe(false);
    expect(readPeriodicTimerProgress(timer)).toBeCloseTo(0.3);
    expect(updatePeriodicTimer(timer, 7)).toBe(true);
    expect(isPeriodicTimerReady(timer)).toBe(true);
    expect(readPeriodicTimerProgress(timer)).toBe(1);
  });

  it('preserves the native invalid state', () => {
    const timer = createPeriodicTimerState();
    expect(isPeriodicTimerValid(timer)).toBe(false);
    expect(readPeriodicTimerProgress(timer)).toBe(0);
  });

  it('sets remaining time while preserving the configured period', () => {
    const timer = createPeriodicTimerState();
    resetPeriodicTimer(timer, 10, true);

    setPeriodicTimerRemaining(timer, 4);
    expect(timer.remaining).toBe(4);
    expect(timer.passed).toBe(6);
    expect(readPeriodicTimerProgress(timer)).toBeCloseTo(0.6);

    setPeriodicTimerRemaining(timer, 20);
    expect(timer.remaining).toBe(20);
    expect(timer.passed).toBe(0);
    expect(readPeriodicTimerProgress(timer)).toBe(0);
  });
});
