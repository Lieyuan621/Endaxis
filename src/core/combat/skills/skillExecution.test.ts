/** 技能、调度及动作进度共同恢复，覆盖延迟扣费、自然结束及继承施法的开始状态。 */
import { describe, expect, it } from 'vitest';
import {
  endActionSequence,
  executeActionSequence,
  resetActionSequence,
  tickActionSequence,
  type ActionSequenceExecutionHost,
} from '../actions/actionSequenceExecution';
import { StateStepper } from '../runtime/stateStepper';
import { createSkillExecutionState } from '../state/abilityState';
import {
  COMBAT_STEP_STATE,
  createTimelineActionState,
  type ActionStepState,
} from '../state/actionState';
import {
  compileTimelineActionIntervals,
  endTimelineActions,
  tickTimelineActions,
  type TimelineActionExecutionHost,
} from '../timeline/timelineActionExecution';
import {
  advanceSkillExecution,
  beginSkillCast,
  endSkillExecution,
  tickSkillExecution,
} from './skillExecution';

const program = compileTimelineActionIntervals([{ startFrame: 1, endFrame: 3 }]);

/** 共享内核状态的测试夹具：与图执行器同样按 `entries()` 枚举步骤生命周期。 */
function createActionSequenceState(stepCount: number): { entries: ActionStepState[] } {
  return {
    entries: Array.from({ length: stepCount }, () => ({
      state: COMBAT_STEP_STATE.pending,
      executeResult: false,
      executionPermitted: false,
    })),
  };
}

function createSession() {
  return new StateStepper(
    {
      skill: createSkillExecutionState(),
      timeline: createTimelineActionState(),
      sequence: createActionSequenceState(1),
      nextCastId: 1,
      sp: 100,
      calls: [] as string[],
    },
    (step, input: 'start' | 'advance' | 'end') => {
      const state = step.state;
      const actions: ActionSequenceExecutionHost = {
        canExecute: () => true,
        execute: () => {
          state.calls.push('execute');
          return true;
        },
        tick: () => {
          state.calls.push('tick');
        },
        reset: () => {},
        end: () => {
          state.calls.push('actionEnd');
        },
      };
      const timeline: TimelineActionExecutionHost = {
        execute: () => {
          executeActionSequence(state.sequence, {}, actions);
        },
        tick: (_index, delta) => tickActionSequence(state.sequence, delta, actions),
        end: () => endActionSequence(state.sequence, actions),
        reset: () => resetActionSequence(state.sequence, actions),
        started: () => {
          state.calls.push('timelineStart');
        },
        ended: () => {
          state.calls.push('timelineEnd');
        },
      };
      const end = () =>
        endSkillExecution(state.skill, {
          endTimeline: frame => endTimelineActions(state.timeline, program, frame, timeline),
          finishAttached: () => {
            state.calls.push('buffsEnd');
          },
          finishCooldown: () => false,
          cooldownRefunded: () => {
            state.calls.push('refund');
          },
          recordEnded: () => {
            state.calls.push('skillEnd');
          },
          emitEnded: () => {
            state.calls.push(`event:${state.skill.state}`);
          },
        });
      const tick = (delta: number) =>
        tickSkillExecution(state.skill, 1, delta, {
          applyCost: () => {
            state.calls.push('cost');
            state.sp -= 20;
            state.skill.appliedCost = true;
            state.skill.nonReturnedSpCost = 20;
          },
          tickTimeline: (frame, seconds) =>
            tickTimelineActions(state.timeline, program, frame, seconds, timeline),
        });
      if (input === 'start') {
        beginSkillCast(state.skill, 0, () => state.nextCastId++);
        tick(0);
      } else if (input === 'end') end();
      else
        advanceSkillExecution(state.skill, 3, false, 1 / 30, 1 / 30, {
          advanceCooldown: () => false,
          cooldownReady: () => {},
          tick,
          timelineComplete: () =>
            state.timeline.nextPendingIndex === program.length &&
            state.timeline.active.length === 0,
          end,
        });
    },
  );
}

describe('skill execution data', () => {
  it('restores a paid cast after an early-end branch and finishes like a fresh simulation', () => {
    const session = createSession();
    session.step('start');
    const unpaid = session.save();
    session.step('advance');
    expect(session.read().calls.slice(0, 3)).toEqual(['cost', 'timelineStart', 'execute']);
    const paid = session.save();
    session.step('end');
    const stopped = session.save();
    session.restore(paid);
    session.step('advance');
    session.step('advance');
    expect(session.read().sp).toBe(80);
    expect(session.read().calls.slice(-5)).toEqual([
      'actionEnd',
      'timelineEnd',
      'buffsEnd',
      'skillEnd',
      'event:ended',
    ]);
    const expected = session.read();
    session.restore(unpaid);
    session.step('advance');
    session.step('advance');
    session.step('advance');
    expect(session.read()).toEqual(expected);
    const fresh = createSession();
    fresh.step('start');
    fresh.step('advance');
    fresh.step('advance');
    fresh.step('advance');
    expect(session.read()).toEqual(fresh.read());
    session.restore(stopped);
    const before = session.read();
    session.step('advance');
    expect(session.read()).toEqual(before);
  });

  it('consumes prepared identity and inherited payment without allocating again', () => {
    const state = createSkillExecutionState();
    state.preparedSkillCastId = 7;
    state.preparedSkillCastInfo = {
      skillCastId: 7,
      originSkillId: 'origin',
      originSkillType: 'basicAttack',
      nonReturnedSpCost: 20,
    };
    state.preparedSkipApplyCost = true;
    state.preparedForceTimelinePayment = true;
    beginSkillCast(state, -1, () => {
      throw new Error('unexpected allocation');
    });
    expect(state.skillCastId).toBe(7);
    expect(state.nonReturnedSpCost).toBe(20);
    expect(state.preparationCast).toBe(true);
    expect(state.attemptedCost).toBe(true);
    expect(state.forceTimelinePayment).toBe(true);
    expect(state.preparedSkillCastId).toBe(0);
    expect(state.preparedSkillCastInfo).toBeUndefined();
    expect(state.preparedSkipApplyCost).toBe(false);
  });
});
