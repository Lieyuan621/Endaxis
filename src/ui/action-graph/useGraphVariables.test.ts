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

it('isolated scope and numeric data inputs reject root-only, string and non-input targets', () => {
  const graph: ActionGraphDefinition = {
    nodes: {
      scope: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: { scopeKey: 'child', initialValues: { local: 1 }, inheritParent: false },
          body: { $sequence: 'inside' },
        },
        next: null,
      },
      inside: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'existing',
            target: 'caster',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
    },
  };
  const selection = createEditorSelection();
  selection.selectedId.value = 'inside';
  const variables = useGraphVariables({
    graph: () => graph,
    roots: () => ['scope'],
    parameters: () => [],
    initial: () => ({ rootOnly: 1, stringOnly: 'buff' }),
    label: () => 'skill',
    selection,
  });
  const root = variables.analysis.value.variables.find(variable => variable.key === 'rootOnly')!;
  const text = variables.analysis.value.variables.find(variable => variable.key === 'stringOnly')!;
  const local = variables.analysis.value.variables.find(variable => variable.key === 'local')!;
  expect(variables.variableKeys.value).toEqual(['local']);
  expect(() =>
    variables.createNode(graph, root, false, {
      owner: 'action',
      id: 'inside',
      path: ['parameters', 'count'],
    }),
  ).toThrow('另一局部调用环境');
  const stringRead = variables.createNode(graph, text, false);
  expect(stringRead.graph.dataNodes![stringRead.id]).toEqual({
    type: 'string',
    expression: { blackboardKey: 'stringOnly' },
  });
  expect(() =>
    variables.createNode(graph, local, false, {
      owner: 'action',
      id: 'inside',
      path: ['parameters', 'buffId'],
    }),
  ).toThrow('类型相符的正式数据输入');
});

it('string variable creation and drop match only string inputs and keep numeric macro parameters separate', () => {
  const graph: ActionGraphDefinition = {
    nodes: {
      use: {
        action: {
          kind: 'applyBuff',
          parameters: {
            target: 'caster',
            buffId: { kind: 'stringNode', nodeId: 'text' },
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'scope',
      },
      scope: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: { initialValues: { privateText: 1 }, inheritParent: false },
          body: { $sequence: 'inside' },
        },
        next: null,
      },
      inside: {
        action: { kind: 'applyBuff', parameters: { target: 'caster', buffId: 'old' } },
        next: null,
      },
    },
    dataNodes: { text: { type: 'string', expression: { blackboardKey: 'same' } } },
  };
  const selection = createEditorSelection();
  selection.selectedDataId.value = 'text';
  const variables = useGraphVariables({
    graph: () => graph,
    roots: () => ['use'],
    parameters: () => ['same'],
    initial: () => ({ same: 'root', amount: 2 }),
    label: () => 'main',
    selection,
  });
  expect(variables.variableKeys.value).toEqual(['same']);
  const text = variables.analysis.value.variables.find(
    variable => variable.key === 'same' && variable.layer === 'direct',
  )!;
  const parameter = variables.analysis.value.variables.find(
    variable => variable.key === 'same' && variable.layer === 'parameter',
  )!;
  const local = variables.analysis.value.variables.find(
    variable => variable.key === 'privateText',
  )!;
  const target = { owner: 'action' as const, id: 'use', path: ['parameters', 'buffId'] };
  const created = variables.createNode(graph, text, false, target);
  expect(created.graph.nodes.use!.action).toHaveProperty('parameters.buffId', {
    kind: 'stringNode',
    nodeId: created.id,
  });
  expect(created.graph.dataNodes![created.id]).toEqual({
    type: 'string',
    expression: { blackboardKey: 'same' },
  });
  expect(() => variables.createNode(graph, parameter, false, target)).toThrow('类型相符');
  expect(() =>
    variables.createNode(graph, text, false, { ...target, path: ['parameters', 'count'] }),
  ).toThrow('类型相符');
  expect(() =>
    variables.createNode(graph, text, false, { ...target, path: ['parameters', 'target'] }),
  ).toThrow('类型相符');
  expect(() => variables.createNode(graph, local, false, target)).toThrow('另一局部调用环境');
  expect(() => variables.createNode(graph, text, false, { ...target, id: 'inside' })).toThrow(
    '另一局部调用环境',
  );
  expect(() => variables.createNode(graph, local, false, { ...target, id: 'inside' })).toThrow(
    '类型相符',
  );
  expect(Object.keys(graph.dataNodes!)).toEqual(['text']);
  const data = variables.createNode(graph, text, false, { owner: 'data', id: 'text', path: [] });
  expect(data.graph.dataNodes!.text!.expression).toEqual({ kind: 'stringNode', nodeId: data.id });
});

it('a declared string target constrains an unknown runtime key without granting string macro parameters', () => {
  const graph: ActionGraphDefinition = {
    nodes: {
      use: {
        action: {
          kind: 'applyBuff',
          parameters: {
            target: 'caster',
            buffId: { blackboardKey: 'providedAtRuntime' },
            count: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
    },
  };
  const variables = useGraphVariables({
    graph: () => graph,
    roots: () => ['use'],
    parameters: () => ['providedAtRuntime'],
    initial: () => ({}),
    label: () => 'unknown runtime caller',
    selection: createEditorSelection(),
  });
  const unknown = variables.analysis.value.variables.find(
    variable => variable.key === 'providedAtRuntime' && variable.layer === 'direct',
  )!;
  const target = { owner: 'action' as const, id: 'use', path: ['parameters', 'buffId'] };
  const created = variables.createNode(graph, unknown, false, target);
  expect(created.graph.dataNodes![created.id]).toEqual({
    type: 'string',
    expression: { blackboardKey: 'providedAtRuntime' },
  });
  expect(created.graph.nodes.use!.action).toHaveProperty('parameters.buffId', {
    kind: 'stringNode',
    nodeId: created.id,
  });
  const numeric = variables.createNode(graph, unknown, false, {
    ...target,
    path: ['parameters', 'count'],
  });
  expect(numeric.graph.dataNodes![numeric.id]?.type).toBe('number');
  const parameter = variables.analysis.value.variables.find(
    variable => variable.layer === 'parameter',
  )!;
  expect(() => variables.createNode(graph, parameter, false, target)).toThrow('类型相符');
  const write = variables.createNode(graph, unknown, true);
  expect(write.graph.nodes[write.id]!.action).toHaveProperty('kind', 'modifyActionValue');
});

it('connecting existing string sources rejects known open-board mismatches and mixed shared consumers', () => {
  const read = { kind: 'stringNode' as const, nodeId: 'shared' };
  const graph: ActionGraphDefinition = {
    nodes: {
      scope: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: { initialValues: { same: 7 }, inheritParent: false },
          body: { $sequence: 'inside' },
        },
        next: 'outside',
      },
      inside: {
        action: { kind: 'applyBuff', parameters: { target: 'caster', buffId: read } },
        next: null,
      },
      outside: {
        action: { kind: 'applyBuff', parameters: { target: 'caster', buffId: read } },
        next: null,
      },
    },
    dataNodes: {
      shared: { type: 'string', expression: 'before' },
      source: { type: 'string', expression: { blackboardKey: 'same' } },
      unknown: { type: 'string', expression: { blackboardKey: 'providedAtRuntime' } },
      literal: { type: 'string', expression: 'literal' },
    },
  };
  const variables = useGraphVariables({
    graph: () => graph,
    roots: () => ['scope'],
    parameters: () => [],
    initial: () => ({ same: 'root text' }),
    label: () => 'main',
    selection: createEditorSelection(),
  });
  const path = ['parameters', 'buffId'];
  expect(() =>
    variables.assertConnection(graph, 'action', 'outside', path, 'source'),
  ).not.toThrow();
  expect(() => variables.assertConnection(graph, 'action', 'inside', path, 'source')).toThrow(
    '实际调用黑板',
  );
  expect(() => variables.assertConnection(graph, 'data', 'shared', [], 'source')).toThrow(
    '实际调用黑板',
  );
  expect(() => variables.assertConnection(graph, 'data', 'shared', [], 'unknown')).not.toThrow();
  expect(() => variables.assertConnection(graph, 'data', 'shared', [], 'literal')).not.toThrow();
  expect(graph.dataNodes!.shared!.expression).toBe('before');
});
