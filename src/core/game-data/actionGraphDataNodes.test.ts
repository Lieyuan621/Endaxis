import { expect, it, vi } from 'vitest';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
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
  expect(Object.keys(graph.dataNodes!)).toHaveLength(4);
  expect(resolveGraphData(graph)).toEqual(original);
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
it('同一数据节点的多个输入只共享定义，保存后再次转换不复制节点', () => {
  const graph = extractGraphDataNodes(sample());
  expect(extractGraphDataNodes(JSON.parse(JSON.stringify(graph)))).toEqual(graph);
  const resolver = createGraphDataResolver(graph);
  const id = Object.keys(graph.dataNodes!)[0]!;
  expect(resolver.node(id, 'number')).toBe(resolver.node(id, 'number'));
});
