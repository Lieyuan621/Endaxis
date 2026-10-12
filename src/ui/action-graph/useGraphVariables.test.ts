import { expect, it } from 'vitest';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { createEditorSelection } from '../editor/editorSelection';
import { useGraphVariables } from './useGraphVariables';

it('a declared string target constrains an unknown runtime key without granting string macro parameters', () => {
  const graph: ActionGraphDefinition = {
    nodes: {
      use: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: { kind: 'stringNode', nodeId: 'buffId' } }],
            targets: { kind: 'fixed', target: 'caster' },
            count: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
    },
    dataNodes: { buffId: { type: 'string', expression: { blackboardKey: 'providedAtRuntime' } } },
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
  const target = {
    owner: 'action' as const,
    id: 'use',
    path: ['parameters', 'buffs', '0', 'buffId'],
  };
  const created = variables.createNode(graph, unknown, false, target);
  expect(created.graph.dataNodes![created.id]).toEqual({
    type: 'string',
    expression: { blackboardKey: 'providedAtRuntime' },
  });
  expect(created.graph.nodes.use!.action).toHaveProperty('parameters.buffs.0.buffId', {
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
