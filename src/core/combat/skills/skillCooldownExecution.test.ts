/** 共享冷却状态的分支恢复，覆盖确认帧前返还和用户覆盖取消预占。 */
import { describe, expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import {
  compileSkillCooldown,
  createSkillCooldownState,
  reserveSkillCooldown,
  advanceSkillCooldown,
  finishSkillCooldownCast,
  overrideSkillCooldown,
  readSkillCooldown,
} from './skillCooldownExecution';

describe('shared cooldown data', () => {
  it('restores shared identity and a reservation after a different branch overrides it', () => {
    const program = compileSkillCooldown(100, 10);
    const cooldown = createSkillCooldownState(program);
    const session = new StateStepper(
      { first: cooldown, second: cooldown, multiplier: 2, reads: 0 },
      (step, input: 'reserve' | 'advance' | 'override' | 'finish') => {
        const state = step.state;
        if (input === 'reserve')
          return reserveSkillCooldown(state.first, program, () => {
            state.reads++;
            return state.multiplier;
          });
        if (input === 'advance') return advanceSkillCooldown(state.second, 5);
        if (input === 'override') return overrideSkillCooldown(state.second, program, false);
        return finishSkillCooldownCast(state.first, program);
      },
    );
    expect(session.step('reserve')).toBe(true);
    expect(readSkillCooldown(session.read().second).remainingFrames).toBe(200);
    session.step('advance');
    const reserved = session.save();
    session.step('override');
    const overridden = session.save();
    expect(session.step('finish')).toBe(false);
    expect(readSkillCooldown(session.read().first).remainingFrames).toBe(100);
    session.restore(reserved);
    expect(session.step('finish')).toBe(true);
    const restored = session.read();
    expect(restored.first).toBe(restored.second);
    expect(restored.reads).toBe(1);
    expect(readSkillCooldown(restored.second).ready).toBe(true);
    session.restore(overridden);
    expect(session.step('finish')).toBe(false);
    expect(readSkillCooldown(session.read().second).remainingFrames).toBe(100);
  });

  it('does not read dynamic multipliers when already cooling or unconfigured', () => {
    const program = compileSkillCooldown(10, 1);
    const state = createSkillCooldownState(program);
    reserveSkillCooldown(state, program, () => 1);
    expect(
      reserveSkillCooldown(state, program, () => {
        throw new Error('unexpected');
      }),
    ).toBe(false);
    const absent = compileSkillCooldown();
    expect(
      reserveSkillCooldown(createSkillCooldownState(absent), absent, () => {
        throw new Error('unexpected');
      }),
    ).toBe(true);
  });
});
