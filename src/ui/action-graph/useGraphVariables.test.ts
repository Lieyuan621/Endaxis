import { expect, it } from 'vitest';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { createEditorSelection } from '../editor/editorSelection';
import { useGraphVariables } from './useGraphVariables';

it('变量读取只能接入其局部作用域，宏参数不能生成写入节点', () => {
  const graph: ActionGraphDefinition = {
    nodes: {
      scope: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            initialValues: { local: 1 },
            inheritParent: false,
            shareParentBlackboard: false,
          },
          body: { $sequence: 'inside' },
        },
        next: 'outside',
      },
      inside: {
        action: { kind: 'dealStagger', parameters: { value: { kind: 'constant', value: 1 } } },
        next: null,
      },
      outside: {
        action: { kind: 'dealStagger', parameters: { value: { kind: 'constant', value: 1 } } },
        next: null,
      },
    },
  };
  const variables = useGraphVariables({
    graph: () => graph,
    roots: () => ['scope'],
    parameters: () => ['argument'],
    initial: () => ({}),
    label: () => 'test',
    selection: createEditorSelection(),
  });
  const local = variables.analysis.value.variables.find(variable => variable.key === 'local')!;
  const target = { owner: 'action' as const, id: 'inside', path: ['parameters', 'value'] };
  const created = variables.createNode(graph, local, false, target);
  expect(created.graph.nodes.inside!.action).toHaveProperty('parameters.value', {
    kind: 'valueNode',
    nodeId: created.id,
  });
  expect(created.graph.dataNodes![created.id]!.expression).toEqual({
    kind: 'blackboard',
    key: 'local',
  });
  expect(graph.dataNodes).toBeUndefined();
  expect(() => variables.createNode(graph, local, false, { ...target, id: 'outside' })).toThrow(
    '另一局部调用环境',
  );
  const parameter = variables.analysis.value.variables.find(
    variable => variable.key === 'argument',
  )!;
  expect(() => variables.createNode(graph, parameter, true)).toThrow('宏输入参数只允许读取');
  const readParameter = variables.createNode(graph, parameter, false);
  expect(readParameter.graph.dataNodes![readParameter.id]!.expression).toEqual({
    kind: 'parameter',
    parameter: 'argument',
  });
});
