/** 使用真实调度和序列内核，验证活动区间、跳转游标及动作进度在同一切面恢复。 */
import { describe, expect, it } from 'vitest';
import {
  endActionSequence,
  executeActionSequence,
  resetActionSequence,
  tickActionSequence,
  type ActionSequenceExecutionHost,
} from '../actions/actionSequenceExecution';
import { StateStepper } from '../runtime/stateStepper';
import {
  COMBAT_STEP_STATE,
  createTimelineActionState,
  type ActionStepState,
} from '../state/actionState';
import {
  compileTimelineActionIntervals,
  endTimelineActions,
  jumpToTimelineActions,
  tickTimelineActions,
  type TimelineActionExecutionHost,
} from './timelineActionExecution';

const program = compileTimelineActionIntervals([
  { startFrame: 0, endFrame: 5 },
  { startFrame: 2, endFrame: 3 },
  { startFrame: 4, endFrame: 6 },
]);

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
      timeline: createTimelineActionState(),
      sequences: program.map(() => createActionSequenceState(2)),
      calls: [] as string[],
    },
    (step, input: { frame: number; jump?: number; interrupt?: boolean }) => {
      const state = step.state;
      const sequenceHost = (action: number): ActionSequenceExecutionHost => ({
        canExecute: () => true,
        execute: index => {
          state.calls.push(`execute:${action}:${index}`);
          if (input.interrupt) endTimelineActions(state.timeline, program, input.frame, host);
          return true;
        },
        reset: () => {},
        tick: index => {
          state.calls.push(`tick:${action}:${index}`);
        },
        end: index => {
          state.calls.push(`end:${action}:${index}`);
        },
      });
      const host: TimelineActionExecutionHost = {
        execute: index => {
          executeActionSequence(state.sequences[index]!, {}, sequenceHost(index));
        },
        reset: index => resetActionSequence(state.sequences[index]!, sequenceHost(index)),
        tick: (index, delta) =>
          tickActionSequence(state.sequences[index]!, delta, sequenceHost(index)),
        end: index => endActionSequence(state.sequences[index]!, sequenceHost(index)),
        started: (index, frame) => {
          state.calls.push(`started:${index}:${frame}`);
        },
        ended: (index, frame) => {
          state.calls.push(`ended:${index}:${frame}`);
        },
      };
      if (input.jump !== undefined) {
        jumpToTimelineActions(state.timeline, program, input.jump, input.frame, host);
      } else tickTimelineActions(state.timeline, program, input.frame, 1, host);
    },
  );
}

describe('timeline and sequence data branches', () => {
  it('restores active intervals and skipped pending actions independently', () => {
    const session = createSession();
    session.step({ frame: 0 });
    const root = session.save();
    session.step({ frame: 2 });
    const normal = session.save();
    session.step({ frame: 3 });
    const expectedNormal = session.read();
    session.restore(root);
    session.step({ frame: 0, jump: 4 });
    expect(session.read().timeline.active).toEqual([0]);
    expect(session.read().timeline.nextPendingIndex).toBe(2);
    const jumped = session.save();
    session.step({ frame: 4 });
    expect(session.read().timeline.active).toEqual([0, 2]);
    const expectedJump = session.read();
    session.restore(normal);
    session.step({ frame: 3 });
    expect(session.read()).toEqual(expectedNormal);
    session.restore(jumped);
    session.step({ frame: 4 });
    expect(session.read()).toEqual(expectedJump);
    const fresh = createSession();
    fresh.step({ frame: 0 });
    fresh.step({ frame: 0, jump: 4 });
    fresh.step({ frame: 4 });
    expect(session.read()).toEqual(fresh.read());
  });

  it('restores after synchronous skill end without resurrecting the entering sequence', () => {
    const session = createSession();
    const root = session.save();
    session.step({ frame: 0, interrupt: true });
    const ended = session.save();
    expect(session.read().calls).toEqual(['started:0:0', 'execute:0:0', 'end:0:0', 'ended:0:0']);
    expect(session.read().timeline.active).toEqual([]);
    session.restore(root);
    session.step({ frame: 0 });
    expect(session.read().timeline.active).toEqual([0]);
    session.restore(ended);
    const before = session.read();
    session.step({ frame: 4 });
    expect(session.read()).toEqual(before);
  });
});
