/** 将重复计时与跳转进度一起恢复，检查边界、兄弟分支和同步重入。 */
import { describe, expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import { createRepeatedActionState } from '../state/actionState';
import { executeRepeatedAction, tickRepeatedAction } from './repeatedActionExecution';
import { createTimelineJumpState } from '../state/actionState';
import {
  executeTimelineJump,
  tickTimelineJump,
  type TimelineJumpExecutionHost,
} from './sequenceControl';

function createSession() {
  const parameters = { nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.07 } };
  return new StateStepper(
    { repeat: createRepeatedActionState(), jump: createTimelineJumpState(), hits: 0, jumps: 0 },
    (step, input: { start?: boolean; delta: number; allowed: boolean }) => {
      const state = step.state;
      const host: TimelineJumpExecutionHost = {
        evaluate: () => input.allowed,
        resolveRequest: () => () => {
          state.jumps += 1;
          tickTimelineJump(state.jump, host);
        },
      };
      const body = () => {
        state.hits += 1;
      };
      if (input.start) {
        executeRepeatedAction(state.repeat, parameters, body);
        executeTimelineJump(state.jump, host);
      } else {
        tickRepeatedAction(state.repeat, parameters, input.delta, body);
        tickTimelineJump(state.jump, host);
      }
    },
  );
}

describe('action progress branches', () => {
  it('restores initialized interval progress, single catch-up and a jump that has not happened yet', () => {
    const session = createSession();
    session.step({ start: true, delta: 0, allowed: false });
    expect(session.read().hits).toBe(1);
    const first = session.save();
    session.step({ delta: 0.5, allowed: true });
    expect(session.read().hits).toBe(2);
    expect(session.read().jumps).toBe(0);
    session.step({ delta: 0.5, allowed: true });
    expect(session.read().hits).toBe(3);
    expect(session.read().jumps).toBe(1);
    const jumped = session.save();
    session.restore(first);
    session.step({ delta: 0.5, allowed: false });
    session.step({ delta: 0.5, allowed: false });
    const waiting = session.save();
    expect(session.read().jumps).toBe(0);
    session.restore(jumped);
    session.step({ delta: 0, allowed: true });
    expect(session.read().hits).toBe(4);
    expect(session.read().jumps).toBe(1);
    const expected = session.read();
    session.restore(waiting);
    session.step({ delta: 0, allowed: true });
    expect(session.read()).toEqual(expected);
    const fresh = createSession();
    fresh.step({ start: true, delta: 0, allowed: false });
    fresh.step({ delta: 0.5, allowed: true });
    fresh.step({ delta: 0.5, allowed: true });
    fresh.step({ delta: 0, allowed: true });
    expect(session.read()).toEqual(fresh.read());
  });

  it('keeps the strict target interval and maximum trigger count after restoration', () => {
    const parameters = {
      nativeChanneling: {
        executeEachFrame: true,
        triggerIntervalSeconds: 0.25,
        maxCountPerTarget: 2,
        targetTriggerIntervalSeconds: 0.25,
      },
    };
    const session = new StateStepper(
      { progress: createRepeatedActionState(), hits: 0 },
      (step, delta: number | null) => {
        const state = step.state;
        const body = () => {
          state.hits += 1;
        };
        if (delta === null) executeRepeatedAction(state.progress, parameters, body);
        else tickRepeatedAction(state.progress, parameters, delta, body);
      },
    );
    session.step(null);
    session.step(0);
    session.step(0.25);
    expect(session.read().hits).toBe(1);
    const boundary = session.save();
    session.step(0.125);
    session.step(1);
    expect(session.read().hits).toBe(2);
    const expected = session.read();
    session.restore(boundary);
    session.step(0.125);
    session.step(1);
    expect(session.read()).toEqual(expected);
  });

  it('does not consume a jump when the host request cannot be resolved', () => {
    const state = createTimelineJumpState();
    expect(() =>
      executeTimelineJump(state, {
        evaluate: () => true,
        resolveRequest: () => {
          throw new Error('missing host');
        },
      }),
    ).toThrow('missing host');
    expect(state.jumped).toBe(false);
  });
});
