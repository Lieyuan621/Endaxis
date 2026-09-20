/** 将分支选择与真实动作序列进度一起保存，避免只恢复选择却丢失分支内的执行状态。 */
import { describe, expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import { createActionSequenceState, createBranchActionState } from '../state/actionState';
import {
  endActionSequence,
  executeActionSequence,
  resetActionSequence,
  tickActionSequence,
  type ActionSequenceExecutionHost,
} from './actionSequenceExecution';
import {
  executeConditionalAction,
  executeSwitchAction,
  resetConditionalAction,
  resetSwitchAction,
  tickBranchAction,
  type BranchActionHost,
} from './branchActionExecution';

function createSession(kind: 'switch' | 'conditional') {
  return new StateStepper(
    {
      branch: createBranchActionState(),
      sequences: [createActionSequenceState(1), createActionSequenceState(1)],
      calls: [] as string[],
    },
    (step, input: number | 'tick' | 'reset') => {
      const state = step.state;
      const sequenceHost = (branch: number): ActionSequenceExecutionHost => ({
        canExecute: () => true,
        execute: () => {
          state.calls.push(`execute:${branch}`);
          return true;
        },
        tick: () => {
          state.calls.push(`tick:${branch}`);
        },
        end: () => {
          state.calls.push(`end:${branch}`);
        },
        reset: () => {
          state.calls.push(`reset:${branch}`);
        },
      });
      const host: BranchActionHost = {
        execute: index => executeActionSequence(state.sequences[index]!, {}, sequenceHost(index)),
        tick: (index, delta) =>
          tickActionSequence(state.sequences[index]!, delta, sequenceHost(index)),
        end: index => endActionSequence(state.sequences[index]!, sequenceHost(index)),
        reset: index => resetActionSequence(state.sequences[index]!, sequenceHost(index)),
      };
      if (input === 'tick') tickBranchAction(state.branch, 1, host);
      else if (input === 'reset') {
        if (kind === 'switch') resetSwitchAction(2, host);
        else resetConditionalAction(state.branch, true, host);
      } else if (kind === 'switch') {
        executeSwitchAction(state.branch, 2, false, {
          ...host,
          choice: () => input,
          value: index => index,
        });
      } else {
        executeConditionalAction(state.branch, true, false, {
          ...host,
          evaluate: () => input === 0,
        });
      }
    },
  );
}

describe('branch action data', () => {
  it.each(['switch', 'conditional'] as const)(
    'restores %s selection and running sequence together',
    kind => {
      const session = createSession(kind);
      const root = session.save();
      session.step(0);
      const left = session.save();
      session.step('tick');
      const expectedLeft = session.read();
      session.restore(root);
      session.step(1);
      const right = session.save();
      session.step('tick');
      const expectedRight = session.read();
      expect(expectedRight.calls).toEqual(['execute:1', 'tick:1']);
      session.restore(left);
      session.step('tick');
      expect(session.read()).toEqual(expectedLeft);
      session.restore(right);
      session.step('tick');
      expect(session.read()).toEqual(expectedRight);
      const fresh = createSession(kind);
      fresh.step(1);
      fresh.step('tick');
      expect(session.read()).toEqual(fresh.read());
    },
  );

  it('preserves the distinct reset rules and restores a branch before reset', () => {
    for (const kind of ['switch', 'conditional'] as const) {
      const session = createSession(kind);
      session.step(1);
      const running = session.save();
      session.step('reset');
      expect(session.read().branch.activeBranch).toBe(kind === 'switch' ? 1 : null);
      expect(session.read().calls).toEqual(['execute:1', 'reset:0', 'reset:1']);
      session.step('tick');
      expect(session.read().calls).toHaveLength(3);
      session.restore(running);
      session.step('tick');
      expect(session.read().calls).toEqual(['execute:1', 'tick:1']);
    }
  });
});
