/** 验证准备期帧时钟在保存、恢复后继续推进，不共享试探分支的帧数。 */
import { expect, it } from 'vitest';
import { CombatClock, advanceCombatFrame, initializeCombatFrame } from './combatClock';
import { StateStepper } from '../runtime/stateStepper';

it('负帧起点可以保存恢复，分支继续推进不改变原时钟', () => {
  const clock = new CombatClock();
  clock.initializeFrame(-2);
  const session = new StateStepper(clock.runtimeState, (step, count: number) => {
    for (let index = 0; index < count; index++) advanceCombatFrame(step.state);
    return step.state.frame;
  });
  const saved = session.save();
  expect(session.step(5)).toBe(3);
  session.restore(saved);
  expect(session.step(1)).toBe(-1);
  session.restore(saved);
  expect(session.step(5)).toBe(3);
  expect(clock.frame).toBe(-2);
  expect(clock.time).toBe(-2 / 30);
});

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
