import { expect, it, vi } from 'vitest';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { CombatCondition } from '../../../packages/game-data-contract/src/conditions';
import {
  appendCondition,
  moveCondition,
  removeCondition,
} from '../../ui/field-editor/conditionList';
import { createGraphDataResolver, resolveGraphData } from '../action-graph/actionGraphData';
import { extractGraphDataNodes } from '../action-graph/actionGraphDataNodes';
import { validateActionGraphActions } from './validation/actionPrograms';
import { ActionBlackboard } from '../combat/actions/actionBlackboard';
import { ActionBlackboardOperationExecutor } from '../combat/actions/actionBlackboardOperationExecutor';
import { ExplicitProbabilitySampleSource } from '../combat/random/probabilitySampleSource';
import { createActionGraphCompilation } from '../compiler/compileActionGraph';

function sample(): ActionGraphDefinition {
  return {
    nodes: {
      branch: {
        action: {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'all',
              conditions: [
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'count' },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
              ],
            },
          },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
    },
  };
}
it('条件与读黑板转为正式数据引用，绑定还原原表达式，编译使用同一执行入口', () => {
  const original = sample();
  const graph = extractGraphDataNodes(original);
  expect(resolveGraphData(graph)).toEqual(original);
  expect(extractGraphDataNodes(JSON.parse(JSON.stringify(graph)))).toEqual(graph);
  expect(validateActionGraphActions(graph, 'graph')).toEqual([]);
  const compiler = createActionGraphCompilation(graph, 1);
  const entry = compiler.compileEntry({ $sequence: 'branch' }, 'cast');
  compiler.finish();
  expect(entry.graph.nodes.get('branch')!.action).toEqual(original.nodes.branch!.action);
});
it('数据节点不提前读黑板，短路条件不多抽随机数，多次执行分别取样', () => {
  const graph = resolveGraphData(extractGraphDataNodes(sample()));
  const action = graph.nodes.branch!.action;
  if (action.kind !== 'conditional') throw new Error('wrong fixture');
  const executor = new ActionBlackboardOperationExecutor(
    { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    new ExplicitProbabilitySampleSource([0.25, 0.75]),
  );
  expect(
    executor.evaluate(action.parameters.condition, {
      blackboard: new ActionBlackboard({ count: 0 }),
    }),
  ).toBe(false);
  expect(
    executor.evaluate(action.parameters.condition, {
      blackboard: new ActionBlackboard({ count: 1 }),
    }),
  ).toBe(true);
  expect(
    executor.evaluate(action.parameters.condition, {
      blackboard: new ActionBlackboard({ count: 1 }),
    }),
  ).toBe(false);
});
it('拒绝数据环、跨图引用和类型错配，不能把布尔结果当成数值', () => {
  const graph: ActionGraphDefinition = {
    nodes: {},
    dataNodes: {
      a: { type: 'number', expression: { kind: 'valueNode', nodeId: 'b' } },
      b: { type: 'number', expression: { kind: 'valueNode', nodeId: 'a' } },
    },
  };
  expect(() => resolveGraphData(graph)).toThrow('recursive');
  expect(() => createGraphDataResolver(graph).node('missing', 'number')).toThrow('missing');
  expect(() => createGraphDataResolver(graph).node('a', 'boolean')).toThrow('expected boolean');
});

it('含副作用的条件拒绝增加消费者，纯黑板读取允许多个使用点', () => {
  const graph = extractGraphDataNodes(sample());
  const branch = graph.nodes.branch!;
  expect(() => resolveGraphData({ ...graph, nodes: { ...graph.nodes, second: branch } })).toThrow(
    '有副作用',
  );
  const pure: ActionGraphDefinition = {
    nodes: {
      a: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'out',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'read' },
          },
        },
        next: 'b',
      },
      b: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'out',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'read' },
          },
        },
        next: null,
      },
    },
    dataNodes: { read: { type: 'number', expression: { kind: 'blackboard', key: 'count' } } },
  };
  expect(() => resolveGraphData(pure)).not.toThrow();
});

it.each(['all', 'any'] as const)(
  '%s 列表增删保留读取及随机短路顺序，只有显式排序改变求值顺序',
  kind => {
    const graph = extractGraphDataNodes(sample());
    const branch = graph.nodes.branch!.action;
    if (branch.kind !== 'conditional' || branch.parameters.condition.kind !== 'conditionNode')
      throw new Error('wrong fixture');
    const id = branch.parameters.condition.nodeId;
    const original = graph.dataNodes![id]!.expression;
    if (typeof original !== 'object' || !('kind' in original) || original.kind !== 'all')
      throw new Error('wrong fixture');
    const appended = appendCondition(original.conditions, kind === 'all');
    const removed = removeCondition(appended, appended.length - 1);
    const reordered = moveCondition(removed, 1, 0);
    const empty = removeCondition(removeCondition(removed, 1), 0);

    const compile = (conditions: readonly CombatCondition[]) => {
      const changed: ActionGraphDefinition = {
        ...graph,
        dataNodes: {
          ...graph.dataNodes,
          [id]: { type: 'boolean', expression: { kind, conditions } },
        },
      };
      const compilation = createActionGraphCompilation(changed, 1);
      const entry = compilation.compileEntry({ $sequence: 'branch' }, 'cast');
      compilation.finish();
      const action = entry.graph.nodes.get('branch')!.action;
      if (action.kind !== 'conditional') throw new Error('wrong compiled fixture');
      return action.parameters.condition;
    };

    for (const conditions of [original.conditions, appended, removed, reordered, empty]) {
      const events: string[] = [];
      const blackboard = new ActionBlackboard({ count: kind === 'all' ? 0 : 1 });
      const getNumber = blackboard.getNumber.bind(blackboard);
      vi.spyOn(blackboard, 'getNumber').mockImplementation(key => {
        events.push(`read:${key}`);
        return getNumber(key);
      });
      const neutralSample = kind === 'all' ? 0.25 : 0.75;
      const samples = new ExplicitProbabilitySampleSource([neutralSample, neutralSample]);
      const nextSample = samples.nextProbabilitySample.bind(samples);
      const sampleSpy = vi.spyOn(samples, 'nextProbabilitySample').mockImplementation(() => {
        events.push('sample');
        return nextSample();
      });
      const executor = new ActionBlackboardOperationExecutor(
        { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
        samples,
      );
      const condition = compile(conditions);
      expect(events).toEqual([]);
      expect(executor.evaluate(condition, { blackboard })).toBe(
        conditions === empty ? kind === 'all' : kind === 'any',
      );
      expect(events).toEqual(
        conditions === empty
          ? []
          : conditions === reordered
            ? ['sample', 'read:count']
            : ['read:count'],
      );
      expect(sampleSpy).toHaveBeenCalledTimes(conditions === reordered ? 1 : 0);

      events.length = 0;
      blackboard.assignDynamic('count', kind === 'all' ? 1 : 0);
      expect(executor.evaluate(condition, { blackboard })).toBe(kind === 'all');
      expect(events).toEqual(
        conditions === empty
          ? []
          : conditions === reordered
            ? ['sample', 'read:count']
            : ['read:count', 'sample'],
      );
      expect(sampleSpy).toHaveBeenCalledTimes(
        conditions === empty ? 0 : conditions === reordered ? 2 : 1,
      );
    }
  },
);

it('does not rewrite legacy string operands while extracting numeric and condition nodes', () => {
  const graph: ActionGraphDefinition = {
    nodes: {
      a: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: { blackboardKey: 'skill' },
            target: 'caster',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: 'b',
      },
      b: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'literal',
            target: 'caster',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
    },
  };
  expect(extractGraphDataNodes(graph)).toBe(graph);
  const reference = { kind: 'stringNode' as const, nodeId: 'read' };
  const linked: ActionGraphDefinition = {
    nodes: {
      a: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: reference,
            target: 'caster',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
    },
    dataNodes: { read: { type: 'string', expression: { blackboardKey: 'skill' } } },
  };
  expect(extractGraphDataNodes(linked)).toBe(linked);
});
