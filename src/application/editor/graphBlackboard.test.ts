import { expect, it } from 'vitest';
import type {
  ActionGraphDefinition,
  ActionGraphNode,
} from '../../../packages/game-data-contract/src/actionGraph';
import { analyzeGraphBlackboard, blackboardScopeWarnings } from './graphBlackboard';

const scope = (
  body: string,
  inheritParent = false,
  shareParentBlackboard = false,
): ActionGraphNode => ({
  action: {
    kind: 'withActionBlackboardScope',
    parameters: {
      initialValues: shareParentBlackboard ? {} : { local: 1 },
      inheritParent,
      shareParentBlackboard,
    },
    body: { $sequence: body },
  },
  next: 'outside',
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
      scope: scope('inside'),
      inside: use(),
      outside: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
    },
    dataNodes: { read: { type: 'number', expression: { kind: 'blackboard', key: 'local' } } },
  };
}
it('局部 body 与外侧 next 使用不同板，共享读节点登记全部调用环境', () => {
  const graph = fixture();
  const analysis = analyzeGraphBlackboard(graph, ['scope']);
  expect([...analysis.contexts.get('inside')!]).toEqual(['current/scope']);
  expect([...analysis.contexts.get('outside')!]).toEqual(['current']);
  expect(blackboardScopeWarnings(analysis)).toEqual([]);
  const shared = analyzeGraphBlackboard({ ...graph, nodes: { ...graph.nodes, outside: use() } }, [
    'scope',
  ]);
  expect(shared.dataContexts.get('read')?.size).toBe(2);
  expect(blackboardScopeWarnings(shared)).toHaveLength(1);
});
it('共享父板不伪造新作用域，宏参数单列只读', () => {
  const graph = fixture();
  const analysis = analyzeGraphBlackboard(
    { ...graph, nodes: { ...graph.nodes, scope: scope('inside', true, true) } },
    ['scope'],
    ['input'],
  );
  expect(analysis.scopes.size).toBe(1);
  expect(analysis.variables.find(v => v.key === 'input')?.layer).toBe('parameter');
});
it('不把显式缺值默认值或外部动态键误判为越界', () => {
  const graph = fixture();
  const changed: ActionGraphDefinition = {
    ...graph,
    nodes: { ...graph.nodes, outside: use() },
    dataNodes: {
      read: { type: 'number', expression: { kind: 'blackboard', key: 'local', fallback: 0 } },
    },
  };
  expect(blackboardScopeWarnings(analyzeGraphBlackboard(changed, ['scope']))).toEqual([]);
  expect(
    blackboardScopeWarnings(
      analyzeGraphBlackboard({ ...graph, nodes: { outside: use() } }, ['outside']),
    ),
  ).toEqual([]);
});
