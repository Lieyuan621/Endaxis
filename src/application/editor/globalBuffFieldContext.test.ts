import { expect, it } from 'vitest';
import type {
  ActionGraphDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import {
  analyzeGraphBlackboard,
  graphFieldContexts,
  blackboardScopeWarnings,
} from './graphBlackboard';
import { createBlackboardFieldContext, resolveBlackboardKey } from './blackboardFieldContext';
import { globalBuffBlackboardContext, globalBuffDraftContext } from './globalBuffFieldContext';
import { useGraphVariables } from '../../ui/action-graph/useGraphVariables';
import { createEditorSelection } from '../../ui/editor/editorSelection';
import { WorkspaceAssetSession } from '../../ui/asset-workspace/workspaceSession';
import { fieldValueAt } from '../../ui/definition-editor/definitionFieldRuntime';
import {
  resourceGraph,
  replaceResourceNodeAction,
  type ActionGraphResourceOwner,
} from './actionGraphResourceEditing';
import { actionNodeSchemas } from '../../ui/action-graph/actionNodeSchemas.generated';
import { validateStructuredValue } from '../../ui/field-editor/structuredValue';
import { commonBuffDefinitions } from '../../data/buffs/commonDefinitions';
import { operatorReferenceChoices } from './operatorReferenceChoices';
import { saveProjectTemplateDefinition } from './projectTemplateCommands';
import { createEmptyProject } from '../../core/project/createProject';
import { parseProjectDocument, serializeProjectDocument } from '../../core/project/serialization';

const pin = { kind: 'valueNode' as const, nodeId: 'shared' };
function fixture(): ActionGraphDefinition {
  return {
    nodes: {
      global: {
        action: {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global',
            count: pin,
            definition: {
              stackingType: 'unlimited',
              durationSeconds: { blackboardKey: 'same' },
              blackboard: { same: 'local text', local: 2, nil: null, EntityBB_local: 3 },
              sharedSpModifiers: [
                {
                  attribute: 'spRecovery',
                  operation: 'addition',
                  value: pin,
                  applyToReturnSpGain: false,
                },
              ],
              children: [{ buffId: 'child', blackboardAssignments: { output: pin } }],
            },
            blackboardAssignments: {
              same: { kind: 'blackboard', key: 'creatorOnly' },
              extra: { kind: 'constant', value: 4 },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: { shared: { type: 'number', expression: { kind: 'blackboard', key: 'same' } } },
  };
}
const initial = { same: 7, creatorOnly: 8, EntityBB_creator: 10 };
const request = { mode: 'read' as const, valueType: 'number' as const };
it('attributes inline and shared data consumers to independent local boards and preserves macro namespace', () => {
  const graph = fixture();
  const analysis = analyzeGraphBlackboard(graph, ['global'], ['arg'], initial);
  const localScopes = graphFieldContexts(analysis, graph, 'action', 'global', [
    'parameters',
    'definition',
    'children',
    '0',
    'blackboardAssignments',
    'output',
  ])!;
  expect(localScopes.size).toBe(1);
  expect(localScopes.has('current')).toBe(false);
  const local = createBlackboardFieldContext(analysis, localScopes);
  expect(local.closed).toBe(true);
  expect(local.candidates.map(c => c.key).sort()).toEqual([
    'EntityBB_local',
    'extra',
    'local',
    'nil',
    'same',
  ]);
  expect(local.parameters.map(c => c.key)).toEqual(['arg']);
  expect(resolveBlackboardKey(local, 'same', request).valid).toBe(true);
  expect(resolveBlackboardKey(local, 'creatorOnly', request).state).toBe('outOfScope');
  expect(resolveBlackboardKey(local, 'EntityBB_creator', request).valid).toBe(false);
  expect(resolveBlackboardKey(local, 'nil', request).state).toBe('typeMismatch');
  expect(resolveBlackboardKey(local, 'nil', { ...request, fallback: 0 }).valid).toBe(true);
  expect(resolveBlackboardKey(local, 'missing', { ...request, fallback: 0 }).valid).toBe(true);
  expect(resolveBlackboardKey(local, 'arg', { ...request, mode: 'parameter' }).valid).toBe(true);
  expect(
    resolveBlackboardKey(local, 'newChildDestination', { ...request, mode: 'write' }).valid,
  ).toBe(true);
  expect(analysis.dataContexts.get('shared')).toEqual(new Set(['current', ...localScopes]));
  const variable = analysis.variables.find(v => v.key === 'same' && v.scope !== 'current')!;
  expect(variable).toMatchObject({
    assignedType: 'number',
    reads: ['global', 'shared'],
    layer: 'direct',
  });
  expect(variable.initial).toBeUndefined();
  expect(blackboardScopeWarnings(analysis)).toEqual([]);
  const outside = createBlackboardFieldContext(
    analysis,
    graphFieldContexts(analysis, graph, 'action', 'global', ['parameters', 'count']),
  );
  expect(outside.closed).toBeUndefined();
  expect(resolveBlackboardKey(outside, 'creatorOnly', request).valid).toBe(true);
});
it('a shared expression must be numeric in every consumer board, including missing/null local keys', () => {
  const graph: any = fixture();
  delete graph.nodes.global.action.parameters.blackboardAssignments.same;
  const analysis = analyzeGraphBlackboard(graph, ['global'], [], initial);
  const shared = createBlackboardFieldContext(analysis, analysis.dataContexts.get('shared'));
  expect(shared.status).toBe('multiple');
  expect(shared.closed).toBe(true);
  expect(resolveBlackboardKey(shared, 'same', request).state).toBe('typeMismatch');
  expect(resolveBlackboardKey(shared, 'creatorOnly', request).state).toBe('outOfScope');
  expect(resolveBlackboardKey(shared, 'missing', request).state).toBe('outOfScope');
  expect(resolveBlackboardKey(shared, 'same', { ...request, fallback: 1 }).valid).toBe(true);
  graph.nodes.global.action.parameters.definition.blackboard.same = null;
  const withNull = analyzeGraphBlackboard(graph, ['global'], [], initial);
  expect(
    resolveBlackboardKey(
      createBlackboardFieldContext(withNull, withNull.dataContexts.get('shared')),
      'same',
      request,
    ).state,
  ).toBe('typeMismatch');
});
it('each enclosing call environment gets a distinct GlobalBuff board without inherited entity state', () => {
  const base = fixture();
  const graph: ActionGraphDefinition = {
    ...base,
    nodes: {
      ...base.nodes,
      scope: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            initialValues: { inherited: 9 },
            entityInitialValues: { EntityBB_extra: 2 },
            inheritParent: true,
          },
          body: { $sequence: 'global' },
        },
        next: 'global',
      },
    },
  };
  const analysis = analyzeGraphBlackboard(graph, ['scope'], [], initial);
  expect(analysis.contexts.get('global')?.size).toBe(2);
  expect(analysis.fieldContexts.get('global')?.size).toBe(2);
  expect(analysis.dataContexts.get('shared')?.size).toBe(4);
  for (const id of analysis.globalBuffScopes)
    expect(analysis.scopes.get(id)).toMatchObject({
      copiesParent: false,
      sharesEntity: false,
      entityInitial: {},
    });
});
it('variable-node creation uses the exact inner target path and rejects creator/local cross-board same names', () => {
  const graph = fixture();
  const variables = useGraphVariables({
    graph: () => graph,
    roots: () => ['global'],
    parameters: () => ['arg'],
    initial: () => initial,
    label: () => 'root',
    selection: createEditorSelection(),
  });
  const local = variables.analysis.value.variables.find(
    v => v.key === 'same' && v.scope !== 'current',
  )!;
  const creator = variables.analysis.value.variables.find(
    v => v.key === 'same' && v.scope === 'current',
  )!;
  const target = {
    owner: 'action' as const,
    id: 'global',
    path: ['parameters', 'definition', 'children', '0', 'blackboardAssignments', 'output'],
  };
  expect(() => variables.createNode(graph, local, true)).toThrow(/局部板/);
  const reads: ActionGraphDefinition = {
    ...graph,
    dataNodes: {
      ...graph.dataNodes,
      creatorRead: { type: 'number', expression: { kind: 'blackboard', key: 'creatorOnly' } },
      fallback: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'creatorOnly', fallback: 2 },
      },
    },
  };
  expect(() =>
    variables.assertConnection(reads, target.owner, target.id, target.path, 'creatorRead'),
  ).toThrow(/局部黑板/);
  expect(() =>
    variables.assertConnection(reads, target.owner, target.id, target.path, 'fallback'),
  ).not.toThrow();
  expect(() =>
    variables.assertConnection(
      reads,
      target.owner,
      target.id,
      ['parameters', 'count'],
      'creatorRead',
    ),
  ).not.toThrow();
  const created = variables.createNode(graph, local, false, target);
  expect(created.graph.dataNodes![created.id]!.expression).toEqual({
    kind: 'blackboard',
    key: 'same',
  });
  expect(fieldValueAt(created.graph.nodes.global!.action, target.path)).toEqual({
    kind: 'valueNode',
    nodeId: created.id,
  });
  expect(() => variables.createNode(graph, creator, false, target)).toThrow(/另一局部/);
  expect(() =>
    variables.createNode(graph, local, false, { ...target, path: ['parameters', 'count'] }),
  ).toThrow(/另一局部/);
  const parameter = variables.analysis.value.variables.find(v => v.layer === 'parameter')!;
  expect(variables.createNode(graph, parameter, false, target).graph.dataNodes).toBeDefined();
  expect(() =>
    variables.createNode(graph, local, false, {
      ...target,
      path: ['parameters', 'definition', 'durationSeconds', 'blackboardKey'],
    }),
  ).toThrow(/类型相符的正式数据输入/);
});
it('local candidate evidence updates on numeric overrides without evaluating their expressions', () => {
  const enclosing = createBlackboardFieldContext(
    analyzeGraphBlackboard({ nodes: {} }, [], ['arg'], initial),
    new Set(['current']),
  );
  const definition = { blackboard: { text: 'wrong', nil: null } };
  const before = globalBuffBlackboardContext(enclosing, definition, undefined);
  expect(resolveBlackboardKey(before, 'text', request).valid).toBe(false);
  expect(resolveBlackboardKey(before, 'nil', request).valid).toBe(false);
  const after = globalBuffBlackboardContext(enclosing, definition, {
    text: { kind: 'parameter', parameter: 'arg' },
    nil: pin,
  });
  expect(resolveBlackboardKey(after, 'text', request).valid).toBe(true);
  expect(resolveBlackboardKey(after, 'nil', request).valid).toBe(true);
  expect(after.candidates.some(c => c.key === 'creatorOnly')).toBe(false);
  expect(globalBuffBlackboardContext(enclosing, undefined, undefined)).toMatchObject({
    status: 'unknown',
    candidates: [],
    parameters: enclosing.parameters,
  });
});
function findOwner(
  value: unknown,
  path: (string | number)[] = [],
): { path: (string | number)[]; id: string } | undefined {
  if (!value || typeof value !== 'object') return;
  const object = value as Record<string, any>;
  for (const [id, node] of Object.entries(object.actionGraph?.main?.nodes ?? {}) as [string, any][])
    if (node.action?.kind === 'createGlobalBuff') return { path, id };
  for (const [key, child] of Object.entries(object)) {
    const found = findOwner(child, [...path, Array.isArray(value) ? Number(key) : key]);
    if (found) return found;
  }
}
it.each(['lifeng', 'akekuri'] as const)(
  '%s generated GlobalBuff definitions preserve shared graph values through commands/history and official import',
  async name => {
    const definition =
      name === 'lifeng'
        ? (await import('../../data/operators/lifeng.generated')).lifeng
        : (await import('../../data/operators/akekuri.generated')).akekuri;
    const target = findOwner(definition)!;
    expect(target).toBeDefined();
    const session = new WorkspaceAssetSession(
      {
        id: name,
        kind: 'operator',
        kindName: 'Operator',
        name,
        custom: false,
        edit: { kind: 'operator', definition },
      },
      `project:operator:global-${name}`,
    );
    const owner = fieldValueAt(
      session.current.edit.definition,
      target.path,
    ) as ActionGraphResourceOwner;
    const original = resourceGraph(owner, { kind: 'main' });
    const action: any = original.nodes[target.id]!.action;
    const before = action.parameters.definition;
    const next = {
      ...before,
      applyIconDurationToBuffs: !before.applyIconDurationToBuffs,
      children: [
        ...before.children,
        {
          ...before.children[0],
          blackboardAssignments: { newTarget: { kind: 'constant', value: 2 } },
        },
      ],
    };
    const field = actionNodeSchemas.createGlobalBuff.fields.find(
      field => field.path.at(-1) === 'definition',
    )!;
    validateStructuredValue(field.valueSchema!, before, next, {
      kind: 'createGlobalBuff',
      path: field.path,
      choices: operatorReferenceChoices(definition, [
        { id: 'common-buffs', buffDefinitions: commonBuffDefinitions },
      ]),
      graph: original,
      globalBuff: { ...globalBuffDraftContext(action)!, definition: next },
    });
    session.changeGraph(target.path, value =>
      replaceResourceNodeAction(value, { kind: 'main' }, target.id, {
        ...action,
        parameters: { ...action.parameters, definition: next },
      } as ActionGraphStep),
    );
    const changed = session.current;
    const updated = resourceGraph(
      fieldValueAt(changed.edit.definition, target.path) as ActionGraphResourceOwner,
      { kind: 'main' },
    );
    expect(updated.dataNodes).toBe(original.dataNodes);
    expect((updated.nodes[target.id]!.action as any).parameters.definition.children[0]).toBe(
      before.children[0],
    );
    session.history.undo();
    expect(fieldValueAt(session.current.edit.definition, [...target.path, 'actionGraph'])).toBe(
      owner.actionGraph,
    );
    session.history.redo();
    expect(session.current).toBe(changed);
    const request = session.saveRequest();
    const project = saveProjectTemplateDefinition(
      createEmptyProject({ createdWith: 'global-scope-test' }),
      request.draft.edit,
      request.sourceId,
      request.targetId,
      request.draft.name,
      request.replace,
      request.draft.graphPresentations,
    );
    const parsed = parseProjectDocument(serializeProjectDocument(project));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('parse');
    expect(
      fieldValueAt(parsed.value.definitionLibrary!.operators[request.targetId]!.definition, [
        ...target.path,
        'actionGraph',
      ]),
    ).toEqual(
      (fieldValueAt(changed.edit.definition, target.path) as ActionGraphResourceOwner).actionGraph,
    );
  },
);

it('unconnected ordinary actions keep open creation while isolated GlobalBuff connections retain closed local evidence', () => {
  const graph = fixture();
  const vars = useGraphVariables({
    graph: () => graph,
    roots: () => [],
    parameters: () => ['arg'],
    initial: () => initial,
    label: () => 'root',
    selection: createEditorSelection(),
  });
  const readGraph: ActionGraphDefinition = {
    ...graph,
    dataNodes: {
      ...graph.dataNodes,
      creator: { type: 'number', expression: { kind: 'blackboard', key: 'creatorOnly' } },
    },
  };
  expect(() =>
    vars.assertConnection(
      readGraph,
      'action',
      'global',
      ['parameters', 'definition', 'children', '0', 'blackboardAssignments', 'output'],
      'creator',
    ),
  ).toThrow(/局部黑板/);
  expect(() =>
    vars.assertConnection(readGraph, 'action', 'global', ['parameters', 'count'], 'creator'),
  ).not.toThrow();
  const ordinary: ActionGraphDefinition = {
    nodes: {
      unused: {
        action: { kind: 'dealStagger', parameters: { value: { kind: 'constant', value: 1 } } },
        next: null,
      },
    },
  };
  const plain = useGraphVariables({
    graph: () => ordinary,
    roots: () => [],
    parameters: () => [],
    initial: () => initial,
    label: () => 'root',
    selection: createEditorSelection(),
  });
  const source = plain.analysis.value.variables.find(v => v.key === 'same')!;
  expect(() =>
    plain.createNode(ordinary, source, false, {
      owner: 'action',
      id: 'unused',
      path: ['parameters', 'value'],
    }),
  ).not.toThrow();
});
it('GlobalBuff command binding keeps main/macro node namespaces and raw references distinct', () => {
  const main = fixture();
  const macro = fixture();
  const owner = {
    actionGraph: {
      main: {
        ...main,
        dataNodes: {
          shared: {
            type: 'boolean' as const,
            expression: { kind: 'constant' as const, value: true },
          },
        },
      },
      macros: { local: { parameters: ['arg'], entry: { $sequence: 'global' }, graph: macro } },
    },
  };
  const before: any = macro.nodes.global!.action;
  const next: any = {
    ...before,
    parameters: {
      ...before.parameters,
      definition: {
        ...before.parameters.definition,
        sharedSpModifiers: [
          {
            ...before.parameters.definition.sharedSpModifiers[0],
            value: { kind: 'parameter', parameter: 'arg' },
          },
        ],
      },
    },
  };
  // Validate just the addressed macro even with a colliding main ID; make main independently valid.
  owner.actionGraph.main.nodes = {};
  const changed = replaceResourceNodeAction(
    owner,
    { kind: 'macro', macroId: 'local' },
    'global',
    next,
  );
  expect(
    (changed.actionGraph.macros.local.graph.nodes.global!.action as any).parameters.definition
      .children[0].blackboardAssignments.output,
  ).toBe(pin);
  expect(changed.actionGraph.macros.local.graph.dataNodes).toBe(macro.dataNodes);
  const bad = {
    ...next,
    parameters: { ...next.parameters, count: { kind: 'parameter', parameter: 'absent' } },
  };
  expect(() =>
    replaceResourceNodeAction(owner, { kind: 'macro', macroId: 'local' }, 'global', bad),
  ).toThrow(/undeclared/);
  const mainOwner = { actionGraph: { main: fixture(), macros: {} } };
  expect(() => replaceResourceNodeAction(mainOwner, { kind: 'main' }, 'global', next)).toThrow(
    /only allowed inside a macro/,
  );
});

it('GlobalBuff string variables stay local and cannot bypass numeric inputs or make plain ids into pins', () => {
  const graph = fixture();
  const variables = useGraphVariables({
    graph: () => graph,
    roots: () => ['global'],
    parameters: () => [],
    initial: () => ({ same: 'creator text' }),
    label: () => 'creator',
    selection: createEditorSelection(),
  });
  const untouched: any = fixture();
  delete untouched.nodes.global.action.parameters.blackboardAssignments.same;
  const isolated = useGraphVariables({
    graph: () => untouched,
    roots: () => ['global'],
    parameters: () => [],
    initial: () => ({ same: 'creator text' }),
    label: () => 'creator',
    selection: createEditorSelection(),
  });
  const local = isolated.analysis.value.variables.find(
    value => value.key === 'same' && value.scope !== 'current',
  )!;
  const created = isolated.createNode(untouched, local, false);
  expect(created.graph.dataNodes![created.id]).toEqual({
    type: 'string',
    expression: { blackboardKey: 'same' },
  });
  expect(() => isolated.createNode(untouched, local, true)).toThrow('局部板');
  const numeric = ['parameters', 'definition', 'children', '0', 'blackboardAssignments', 'output'];
  expect(() =>
    isolated.createNode(untouched, local, false, { owner: 'action', id: 'global', path: numeric }),
  ).toThrow('类型相符');
  expect(() =>
    isolated.createNode(untouched, local, false, {
      owner: 'action',
      id: 'global',
      path: ['parameters', 'count'],
    }),
  ).toThrow('另一局部');
  expect(() =>
    variables.assertConnection(created.graph, 'action', 'global', numeric, created.id),
  ).toThrow(/expected number/);
  expect(() =>
    isolated.assertConnection(
      created.graph,
      'action',
      'global',
      ['parameters', 'definition', 'children', '0', 'buffId'],
      created.id,
    ),
  ).toThrow('数据输入不存在');
});
