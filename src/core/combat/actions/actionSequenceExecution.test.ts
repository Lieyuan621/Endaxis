/** 验证真实序列内核在兄弟分支中恢复进度，以及同步结束不会继续执行后续步骤。 */
import { describe, expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import { COMBAT_STEP_STATE, type ActionStepState } from '../state/actionState';
import {
  endActionSequence,
  executeActionSequence,
  tickActionSequence,
  type ActionSequenceExecutionHost,
} from './actionSequenceExecution';
import { STEP_RESULT_MODE, type CombatExecutionContext } from './combatStep';

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
      sequence: createActionSequenceState(2),
      context: { sequence: { resultMode: STEP_RESULT_MODE.normal } } as CombatExecutionContext,
      calls: [] as string[],
      enabled: true,
    },
    (step, input: 'execute' | 'tick' | 'interrupt' | 'invert') => {
      const state = step.state;
      const host: ActionSequenceExecutionHost = {
        canExecute: () => state.enabled,
        execute: index => {
          state.calls.push(`execute:${index}`);
          if (input === 'interrupt') endActionSequence(state.sequence, host);
          return input !== 'invert';
        },
        reset: index => {
          state.calls.push(`reset:${index}`);
        },
        tick: index => {
          state.calls.push(`tick:${index}`);
        },
        end: index => {
          state.calls.push(`end:${index}`);
        },
      };
      if (input === 'tick') tickActionSequence(state.sequence, 1, host);
      else {
        if (input === 'invert')
          state.context.sequence!.resultMode = STEP_RESULT_MODE.invertNextResult;
        executeActionSequence(state.sequence, state.context, host);
      }
    },
  );
}

describe('action sequence data branches', () => {
  it('restores independent running and synchronously interrupted branches', () => {
    const session = createSession();
    const root = session.save();
    session.step('execute');
    const running = session.save();
    session.step('tick');
    const expected = session.read();
    session.restore(root);
    session.step('interrupt');
    const interrupted = session.save();
    expect(session.read().calls).toEqual(['execute:0', 'end:0']);
    session.restore(running);
    session.step('tick');
    expect(session.read()).toEqual(expected);
    session.restore(interrupted);
    session.step('tick');
    expect(session.read().calls).toEqual(['execute:0', 'end:0']);
  });

  it('restores the consumed inversion and failed step result with the sequence', () => {
    const session = createSession();
    session.step('invert');
    const branch = session.save();
    expect(session.read().context.sequence!.resultMode).toBe(STEP_RESULT_MODE.normal);
    session.step('tick');
    expect(session.read().calls).toEqual(['execute:0', 'execute:1', 'tick:0']);
    const expected = session.read();
    session.restore(branch);
    session.step('tick');
    expect(session.read()).toEqual(expected);
  });
});
