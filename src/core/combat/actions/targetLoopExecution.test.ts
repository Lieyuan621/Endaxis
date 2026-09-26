/** 同时保存目标循环成员、动态子序列进度和目标，验证恢复不会遗漏在执行的子序列。 */
import { describe, expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import {
  COMBAT_STEP_STATE,
  createTargetLoopState,
  type ActionStepState,
} from '../state/actionState';
import {
  endActionSequence,
  executeActionSequence,
  tickActionSequence,
  type ActionSequenceExecutionHost,
} from './actionSequenceExecution';
import {
  endTargetLoop,
  executeTargetLoop,
  resetTargetLoop,
  tickTargetLoop,
  type TargetLoopHost,
} from './sequenceControl';

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
      loop: createTargetLoopState<ReturnType<typeof createActionSequenceState>>(),
      calls: [] as string[],
    },
    (step, input: 'start' | 'tick' | 'end' | 'reset') => {
      const state = step.state;
      const actions = (id: number): ActionSequenceExecutionHost => ({
        canExecute: () => true,
        execute: () => {
          state.calls.push(`execute:${id}`);
          return true;
        },
        tick: () => {
          state.calls.push(`tick:${id}`);
        },
        end: () => {
          state.calls.push(`end:${id}`);
        },
        reset: () => {},
      });
      const host: TargetLoopHost = {
        start: target => {
          const id = state.loop.nextBodyId++;
          const sequence = createActionSequenceState(1);
          state.loop.bodies.set(id, { target, sequence });
          executeActionSequence(sequence, {}, actions(id));
          return id;
        },
        tick: (id, delta) =>
          tickActionSequence(state.loop.bodies.get(id)!.sequence, delta, actions(id)),
        end: id => endActionSequence(state.loop.bodies.get(id)!.sequence, actions(id)),
      };
      if (input === 'start')
        executeTargetLoop(
          state.loop,
          [
            { kind: 'abilityEntity', instanceId: 3 },
            { kind: 'abilityEntity', instanceId: 7 },
          ],
          host,
        );
      else if (input === 'tick') tickTargetLoop(state.loop, 1, host);
      else {
        if (input === 'end') endTargetLoop(state.loop, host);
        else resetTargetLoop(state.loop);
      }
    },
  );
}

describe('target loop branches', () => {
  it('回退同时恢复子序列编号和目标，Reset 不复用旧编号', () => {
    const session = createSession();
    session.step('start');
    const active = session.save();
    session.step('reset');
    session.step('start');
    expect(session.read().loop.activeBodies).toEqual([3, 4]);
    session.restore(active);
    expect(session.read().loop.nextBodyId).toBe(3);
    expect(session.read().loop.bodies.get(1)?.target).toEqual({
      kind: 'abilityEntity',
      instanceId: 3,
    });
    session.step('start');
    expect(session.read().loop.activeBodies).toEqual([1, 2, 3, 4]);
  });

  it('restores the live children after another branch destroys them', () => {
    const session = createSession();
    session.step('start');
    expect(session.read().calls).toEqual(['execute:1', 'execute:2']);
    const active = session.save();
    session.step('end');
    const ended = session.save();
    expect(session.read().calls).toEqual(['execute:1', 'execute:2', 'end:1', 'end:2']);
    session.restore(active);
    session.step('tick');
    expect(session.read().calls).toEqual(['execute:1', 'execute:2', 'tick:1', 'tick:2']);
    const fresh = createSession();
    fresh.step('start');
    fresh.step('tick');
    expect(session.read()).toEqual(fresh.read());
    session.restore(ended);
    const before = session.read();
    session.step('tick');
    expect(session.read()).toEqual(before);
  });

  it('resets membership without ending children, then restores before reset', () => {
    const session = createSession();
    session.step('start');
    const active = session.save();
    session.step('reset');
    session.step('tick');
    expect(session.read().calls).toEqual(['execute:1', 'execute:2']);
    session.restore(active);
    session.step('end');
    expect(session.read().calls).toEqual(['execute:1', 'execute:2', 'end:1', 'end:2']);
  });
});
