import { expect, it } from 'vitest';
import type {
  ActionGraphDefinition,
  ActionGraphNode,
} from '../../../packages/game-data-contract/src/actionGraph';
import { analyzeGraphBlackboard, blackboardScopeWarnings } from './graphBlackboard';

it('所属对象变量的读写出现在同一项，不把读取误记成局部变量', () => {
  const graph: ActionGraphDefinition = {
    nodes: {
      write: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_count',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'read' },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      read: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_count' } },
    },
  };
  const analysis = analyzeGraphBlackboard(graph, ['write']);
  expect(analysis.variables).toHaveLength(1);
  expect(analysis.variables[0]).toMatchObject({
    key: 'EntityBB_count',
    layer: 'entity',
    reads: ['read'],
    writes: ['write'],
  });
});

const use = (): ActionGraphNode => ({
  action: {
    kind: 'modifyActionValue',
    parameters: {
      key: 'result',
      operation: 'assign',
      value: { kind: 'valueNode', nodeId: 'read' },
    },
  },
  next: null,
});
function fixture(): ActionGraphDefinition {
  return {
    nodes: {
      inside: use(),
      outside: { action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} }, next: null },
    },
    dataNodes: { read: { type: 'number', expression: { kind: 'blackboard', key: 'local' } } },
  };
}
it('不把显式缺值默认值或外部动态键误判为越界', () => {
  const graph = fixture();
  const changed: ActionGraphDefinition = {
    ...graph,
    nodes: { ...graph.nodes, outside: use() },
    dataNodes: {
      read: { type: 'number', expression: { kind: 'blackboard', key: 'local', fallback: 0 } },
    },
  };
  expect(blackboardScopeWarnings(analyzeGraphBlackboard(changed, ['inside', 'outside']))).toEqual(
    [],
  );
  expect(
    blackboardScopeWarnings(
      analyzeGraphBlackboard({ ...graph, nodes: { outside: use() } }, ['outside']),
    ),
  ).toEqual([]);
});
