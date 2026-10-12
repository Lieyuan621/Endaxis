import { expect, it } from 'vitest';
import { initializeCombatFrame } from './combatClock';

it('拒绝非整数或正数初始帧，拒绝覆盖已开始的时钟', () => {
  const state = { frame: 0 };
  for (const invalid of [0.5, 1, NaN, Infinity]) {
    expect(() => initializeCombatFrame(state, invalid)).toThrow(RangeError);
    expect(state.frame).toBe(0);
  }
  initializeCombatFrame(state, -10);
  expect(() => initializeCombatFrame(state, -20)).toThrow('already started');
  expect(state.frame).toBe(-10);
});
