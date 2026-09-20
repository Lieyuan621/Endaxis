import { describe, expect, it } from 'vitest';
import { createOperatorCenterState } from '../state/abilityState';
import { OperatorCenterStateRuntime } from './operatorCenterStateRuntime';

describe('OperatorCenterStateRuntime', () => {
  it('keeps unknown native timing explicit while executing the confirmed Dash transition', () => {
    const state = createOperatorCenterState();
    const runtime = new OperatorCenterStateRuntime({
      operatorId: 'op',
      clock: { frame: 0, time: 0 },
      receipt: { record: () => undefined },
      interruptCurrentSkillForDash: () => null,
      addDashBuffs: () => [],
      clearDashBuffs: () => undefined,
    });

    runtime.enterDash(state, { dashId: 'dash', operatorId: 'op', direction: 'forward' });

    expect(state).toMatchObject({ state: 'dash', dashTimingKnown: false });
    expect(runtime.inspect(state)).toMatchObject({
      canConsumeAttack: null,
      canLeaveForAttack: null,
      perfectDodgeDashAvailable: null,
    });
  });

  it('uses movement facts, not timers, to decide Dash to Free', () => {
    const state = createOperatorCenterState();
    const runtime = new OperatorCenterStateRuntime({
      operatorId: 'op',
      clock: { frame: 0, time: 0 },
      timing: {
        blockAttackFramesInDash: 99,
        allowAttackAfterFramesInDash: 99,
        blockAttackFramesInPerfectDodge: 99,
        allowAttackAfterFramesInPerfectDodge: 99,
        blockDashAfterPerfectDodgeFrames: 0,
      },
      receipt: { record: () => undefined },
      interruptCurrentSkillForDash: () => null,
      addDashBuffs: () => [],
      clearDashBuffs: () => undefined,
    });
    runtime.enterDash(state, { dashId: 'dash', operatorId: 'op', direction: 'forward' });

    expect(
      runtime.shouldLeaveDashForFree(state, {
        hasMoveCommand: true,
        sharedExitCondition: false,
        movementModeIsDash: true,
        movementBlocksFreeTransition: true,
      }),
    ).toBe(true);
    expect(
      runtime.shouldLeaveDashForFree(state, {
        hasMoveCommand: false,
        sharedExitCondition: false,
        movementModeIsDash: true,
        movementBlocksFreeTransition: false,
      }),
    ).toBe(false);
    expect(
      runtime.shouldLeaveDashForFree(state, {
        hasMoveCommand: false,
        sharedExitCondition: false,
        movementModeIsDash: false,
        movementBlocksFreeTransition: false,
      }),
    ).toBe(true);
  });

  it('interrupts the current skill and keeps the two attack timers separate', () => {
    const state = createOperatorCenterState();
    const events: string[] = [];
    const runtime = new OperatorCenterStateRuntime({
      operatorId: 'operator',
      clock: { frame: 10, time: 1 / 3 },
      timing: {
        blockAttackFramesInDash: 2,
        allowAttackAfterFramesInDash: 4,
        blockAttackFramesInPerfectDodge: 1,
        allowAttackAfterFramesInPerfectDodge: 2,
        blockDashAfterPerfectDodgeFrames: 3,
      },
      receipt: { record: receipt => events.push(receipt.event) },
      interruptCurrentSkillForDash: () => ({
        skillId: 'attack1',
        nativeSkillType: 'attack',
        timelineFrame: 8,
        canInterrupt: false,
        canDash: true,
      }),
      addDashBuffs: id => {
        events.push(`add:${id}`);
        return [];
      },
      clearDashBuffs: (_references, id) => events.push(`clear:${id}`),
    });

    const interrupted = runtime.enterDash(state, {
      dashId: 'dash:1',
      operatorId: 'operator',
      direction: 'backward',
    });

    expect(interrupted?.skillId).toBe('attack1');
    expect(state.state).toBe('dash');
    expect(state.direction).toBe('backward');
    expect(runtime.inspect(state)).toMatchObject({
      canConsumeAttack: false,
      canLeaveForAttack: false,
    });
    runtime.advanceFrame(state, 1);
    runtime.advanceFrame(state, 1);
    expect(runtime.inspect(state)).toMatchObject({
      canConsumeAttack: true,
      canLeaveForAttack: false,
    });
    runtime.advanceFrame(state, 1);
    runtime.advanceFrame(state, 1);
    expect(runtime.inspect(state).canLeaveForAttack).toBe(true);
    expect(events).toEqual(['add:dash:1', 'DashInputExecuted']);
  });

  it('consumes a perfect dodge declaration once and enters skill state', () => {
    const state = createOperatorCenterState();
    const events: string[] = [];
    const runtime = new OperatorCenterStateRuntime({
      operatorId: 'operator',
      clock: { frame: 0, time: 0 },
      timing: {
        blockAttackFramesInDash: 0,
        allowAttackAfterFramesInDash: 0,
        blockAttackFramesInPerfectDodge: 1,
        allowAttackAfterFramesInPerfectDodge: 2.5,
        blockDashAfterPerfectDodgeFrames: 3,
      },
      receipt: { record: receipt => events.push(receipt.event) },
      interruptCurrentSkillForDash: () => null,
      addDashBuffs: () => [],
      clearDashBuffs: (_references, id) => events.push(`clear:${id}`),
    });
    runtime.enterDash(state, { dashId: 'dash:1', operatorId: 'operator', direction: 'forward' });

    expect(runtime.canDeclarePerfectDodgeSuccess(state, 'dash:1')).toBe(true);
    expect(runtime.enterPerfectDodgeSkill(state, 'dash:1')).toBe(true);
    expect(runtime.canDeclarePerfectDodgeSuccess(state, 'dash:1')).toBe(false);
    expect(runtime.enterPerfectDodgeSkill(state, 'dash:1')).toBe(false);
    expect(state).toMatchObject({
      state: 'skill',
      perfectDodgeActive: true,
      perfectDodgeConsumed: true,
      perfectDodgeDashBlockRemainingFrames: 3,
      attackBlockRemainingFrames: 1,
      attackAllowRemainingFrames: 2.5,
    });
    expect(runtime.inspect(state)).toMatchObject({
      canConsumeAttack: false,
      canLeaveForAttack: false,
    });
    runtime.advanceFrame(state, 1);
    expect(runtime.inspect(state)).toMatchObject({
      canConsumeAttack: true,
      canLeaveForAttack: false,
    });
    runtime.advanceFrame(state, 1);
    runtime.advanceFrame(state, 1);
    expect(runtime.inspect(state).canLeaveForAttack).toBe(true);
    expect(events.filter(event => event === 'PerfectDodgeSkillStarted')).toHaveLength(1);
  });

  it('uses scaled entity time for all three native center timers', () => {
    const state = createOperatorCenterState();
    const runtime = new OperatorCenterStateRuntime({
      operatorId: 'op',
      clock: { frame: 0, time: 0 },
      timing: {
        blockAttackFramesInDash: 2,
        allowAttackAfterFramesInDash: 4,
        blockAttackFramesInPerfectDodge: 2,
        allowAttackAfterFramesInPerfectDodge: 4,
        blockDashAfterPerfectDodgeFrames: 6,
      },
      receipt: { record: () => undefined },
      interruptCurrentSkillForDash: () => null,
      addDashBuffs: () => [],
      clearDashBuffs: () => undefined,
    });
    runtime.enterDash(state, { dashId: 'dash', operatorId: 'op', direction: 'forward' });
    runtime.enterPerfectDodgeSkill(state, 'dash');

    runtime.advanceFrame(state, 0);
    expect(state).toMatchObject({
      attackBlockRemainingFrames: 2,
      attackAllowRemainingFrames: 4,
      perfectDodgeDashBlockRemainingFrames: 6,
    });
    for (let frame = 0; frame < 4; frame += 1) runtime.advanceFrame(state, 0.5);
    expect(state).toMatchObject({
      attackBlockRemainingFrames: 0,
      attackAllowRemainingFrames: 2,
      perfectDodgeDashBlockRemainingFrames: 4,
    });
    expect(runtime.inspect(state)).toMatchObject({
      canConsumeAttack: true,
      canLeaveForAttack: false,
    });
    runtime.advanceFrame(state, 4);
    expect(state).toMatchObject({
      attackAllowRemainingFrames: 0,
      perfectDodgeDashBlockRemainingFrames: 0,
    });
  });
});
