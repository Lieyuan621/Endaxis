import { expect, it } from 'vitest';
import type { ActionGraphResourceDefinition } from '../../../../packages/game-data-contract/src/actionGraph';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import { conditionInputExpression } from '../../compiler/compiledGraphData';
import { ActionGraphExecution, type ActionGraphExecutionHost } from './actionGraphExecution';
import { CombatStep } from './combatStep';
import type { ActionGraphExecutionState, ActionStepData } from '../state/actionState';

it('物理查询选择回调但不传播回调失败，不推进回调 Tick，恢复不重复探测', () => {
  const definition: ActionGraphResourceDefinition = {
    main: {
      nodes: {
        probe: {
          action: {
            kind: 'physicsCast',
            parameters: {
              source: { kind: 'source' },
              startHeightOffset: 0,
              maxDistance: 100,
              saveToContextKey: 'ground',
            },
            whenHit: { $sequence: 'hit' },
            whenMiss: { $sequence: 'miss' },
          },
          next: 'after',
        },
        hit: {
          action: { kind: 'markCurrentSkillCanDash', parameters: {}, key: 'hit' },
          next: null,
        },
        miss: {
          action: { kind: 'markCurrentSkillCanDash', parameters: {}, key: 'miss' },
          next: null,
        },
        after: {
          action: { kind: 'markCurrentSkillCanDash', parameters: {}, key: 'after' },
          next: null,
        },
      },
    },
    macros: {},
  };
  const compilation = createActionGraphCompilation(definition, 1);
  const entry = compilation.compileEntry({ $sequence: 'probe' }, 'physics');
  const calls: string[] = [];
  let hit = true;
  const unexpected = (): never => {
    throw new Error('unexpected host call');
  };
  const host: ActionGraphExecutionHost = {
    executionPolicy: { resultMode: 'normal' },
    requestTimelineJump: undefined,
    canExecute: () => true,
    listener: unexpected,
    targets: unexpected,
    withTarget: unexpected,
    withSavedInput: unexpected,
    value: unexpected,
    evaluate: unexpected,
    bindOperation: action =>
      new (class extends CombatStep {
        override get executionData() {
          return { kind: 'stateless' as const };
        }
        override bindExecutionData() {}
        execute() {
          this.tryExecute();
        }
        override tryExecute() {
          calls.push(action.key ?? action.kind);
          return action.kind === 'physicsCast' ? hit : action.key !== 'hit';
        }
        override tick() {
          calls.push(`tick:${action.key}`);
        }
      })(),
  };
  const make = (state?: ActionGraphExecutionState) =>
    new ActionGraphExecution(entry.graph, entry.entry, 'physics', host, state, entry.callSite);
  const first = make();
  expect(first.tryExecute({})).toBe(true);
  expect(calls).toEqual(['physicsCast', 'hit', 'after']);
  calls.length = 0;
  const restored = make(structuredClone(first.runtimeState));
  expect(calls).toEqual([]);
  restored.tick(1 / 30, {});
  expect(calls).not.toContain('tick:hit');
  calls.length = 0;
  hit = false;
  restored.reset({});
  restored.tryExecute({});
  expect(calls).toEqual(['physicsCast', 'miss', 'after']);
});

it('按消费点执行，短路不执行后续输入，恢复保留独立 once 状态且不重放行为', () => {
  const definition: ActionGraphResourceDefinition = {
    main: {
      nodes: {
        first: {
          action: {
            kind: 'checkCondition',
            parameters: { condition: { kind: 'conditionNode', nodeId: 'both' } },
          },
          next: 'second',
        },
        second: {
          action: {
            kind: 'checkCondition',
            parameters: { condition: { kind: 'conditionNode', nodeId: 'result' } },
          },
          next: null,
        },
        once: {
          action: { kind: 'once', parameters: {}, body: { $sequence: 'effect' } },
          next: null,
        },
        effect: { action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} }, next: null },
        shortCircuit: {
          action: {
            kind: 'checkCondition',
            parameters: { condition: { kind: 'conditionNode', nodeId: 'shortCircuit' } },
          },
          next: null,
        },
      },
      dataNodes: {
        both: {
          type: 'boolean',
          expression: {
            kind: 'all',
            conditions: [
              { kind: 'conditionNode', nodeId: 'result' },
              { kind: 'conditionNode', nodeId: 'result' },
            ],
          },
        },
        result: {
          type: 'boolean',
          expression: { kind: 'checkActionResult', action: { $sequence: 'once' } },
        },
        shortCircuit: {
          type: 'boolean',
          expression: {
            kind: 'all',
            conditions: [
              { kind: 'constant', value: false },
              { kind: 'conditionNode', nodeId: 'result' },
            ],
          },
        },
      },
    },
    macros: {},
  };
  const compilation = createActionGraphCompilation(definition, 1);
  const entry = compilation.compileEntry({ $sequence: 'first' }, 'test');
  const skipped = compilation.compileEntry({ $sequence: 'shortCircuit' }, 'skip');
  const calls: string[] = [];
  const observed: { kind: string; result: boolean }[] = [];
  const unexpected = (): never => {
    throw new Error('unexpected host call');
  };
  const host: ActionGraphExecutionHost = {
    executionPolicy: { resultMode: 'normal' },
    requestTimelineJump: undefined,
    canExecute: () => true,
    observeCondition: (input, result) =>
      observed.push({ kind: conditionInputExpression(input).kind, result }),
    listener: unexpected,
    targets: unexpected,
    withTarget: unexpected,
    withSavedInput: unexpected,
    value: unexpected,
    evaluate: input => {
      const expression = conditionInputExpression(input);
      if (expression.kind !== 'constant') return unexpected();
      return expression.value;
    },
    bindOperation: () =>
      new (class extends CombatStep {
        override get executionData() {
          return { kind: 'stateless' as const };
        }
        override bindExecutionData(data: ActionStepData | null) {
          expect(data?.kind).toBe('stateless');
        }
        execute() {
          calls.push('effect');
        }
      })(),
  };
  const make = (state?: ActionGraphExecutionState) =>
    new ActionGraphExecution(entry.graph, entry.entry, 'test', host, state, entry.callSite);
  expect(new ActionGraphExecution(skipped.graph, skipped.entry, 'skip', host).tryExecute({})).toBe(
    false,
  );
  expect(calls).toEqual([]);
  expect(observed).toEqual([
    { kind: 'constant', result: false },
    { kind: 'all', result: false },
  ]);
  observed.length = 0;
  const first = make();
  expect(first.tryExecute({})).toBe(true);
  expect(calls).toEqual(['effect', 'effect', 'effect']);
  expect(observed).toEqual([
    { kind: 'checkActionResult', result: true },
    { kind: 'checkActionResult', result: true },
    { kind: 'all', result: true },
    { kind: 'checkActionResult', result: true },
  ]);
  const restored = make(structuredClone(first.runtimeState));
  expect(calls).toHaveLength(3);
  restored.reset({ resetReason: 'afterInstant' });
  restored.executeInstant({});
  expect(calls).toHaveLength(3);
  restored.reset({});
  restored.tryExecute({});
  expect(calls).toHaveLength(6);
});
