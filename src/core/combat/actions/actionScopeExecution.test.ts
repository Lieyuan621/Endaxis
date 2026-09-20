/** 作用域缓存与黑板整图恢复，确保恢复后命中原缓存，并恢复 once 标记。 */
import { describe, expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import { createActionScopeState } from '../state/actionState';
import { createActionBlackboardState } from '../state/foundationState';
import { executeActionOnce, getActionScopeBlackboard, resetActionScopes } from './sequenceControl';

describe('action scope data', () => {
  it('restores cache identity, once markers and reset branches together', () => {
    const session = new StateStepper(
      {
        scopes: createActionScopeState(),
        parent: createActionBlackboardState(),
        creations: 0,
        executions: 0,
      },
      (step, input: 'run' | 'reset') => {
        const state = step.state;
        if (input === 'reset') {
          resetActionScopes(state.scopes);
          return;
        }
        getActionScopeBlackboard(
          state.scopes,
          state.parent,
          {
            scopeKey: 'scope',
            initialValues: {},
            inheritParent: false,
          },
          () => {
            state.creations += 1;
            return createActionBlackboardState({ value: state.creations });
          },
        );
        executeActionOnce(state.scopes, 'once', () => {
          state.executions += 1;
        });
      },
    );
    session.step('run');
    const cached = session.save();
    session.step('reset');
    session.step('run');
    expect(session.read().creations).toBe(2);
    expect(session.read().executions).toBe(2);
    session.restore(cached);
    session.step('run');
    const restored = session.read();
    expect(restored.creations).toBe(1);
    expect(restored.executions).toBe(1);
    expect(restored.scopes.blackboards.has(restored.parent)).toBe(true);
  });

  it('does not cache execution scopes and does not mark a throwing once body', () => {
    const state = createActionScopeState();
    const parent = createActionBlackboardState();
    const parameters = {
      scopeKey: 'scope',
      lifetime: 'execution' as const,
      initialValues: {},
      inheritParent: false,
    };
    const first = getActionScopeBlackboard(state, parent, parameters, () =>
      createActionBlackboardState(),
    );
    const second = getActionScopeBlackboard(state, parent, parameters, () =>
      createActionBlackboardState(),
    );
    expect(first).not.toBe(second);
    expect(state.blackboards.size).toBe(0);
    expect(() =>
      executeActionOnce(state, 'once', () => {
        throw new Error('failed');
      }),
    ).toThrow('failed');
    expect(state.executedOnce.size).toBe(0);
    let calls = 0;
    executeActionOnce(state, 'once', () => {
      calls++;
    });
    executeActionOnce(state, 'once', () => {
      calls++;
    });
    expect(calls).toBe(1);
  });
});
