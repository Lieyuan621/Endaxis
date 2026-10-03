import { expect, it } from 'vitest';
import { validateSkillDefinition } from '../../core/game-data/validateSkillDefinition';
import { perlica } from '../../data/operators/perlica.generated';
import type {
  ActionGraphDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import {
  connectResourceNode,
  replaceResourceNodeAction,
  resourceGraph,
  type ActionGraphResourceOwner,
} from './actionGraphResourceEditing';
import { DefinitionDraftSession } from './definitionDraftSession';
import { setGraphDataInput } from './graphDataInputEditing';
import { actionTypedInputs } from '../../ui/action-graph/typedGraphInputs';
import { actionNodeSchemas } from '../../ui/action-graph/actionNodeSchemas.generated';
import { validateStructuredValue } from '../../ui/field-editor/structuredValue';
import { fieldValueAt } from '../../ui/definition-editor/definitionFieldRuntime';
import { WorkspaceAssetSession } from '../../ui/asset-workspace/workspaceSession';
import { saveProjectTemplateDefinition } from './projectTemplateCommands';
import { createEmptyProject } from '../../core/project/createProject';
import { parseProjectDocument, serializeProjectDocument } from '../../core/project/serialization';
import { createActionGraphCompilation } from '../../core/compiler/compileActionGraph';
import { CombatActionSequenceRuntime } from '../../core/combat/actions/combatActionSequenceRuntime';
import { ActionBlackboard } from '../../core/combat/actions/actionBlackboard';
const fixtures = [
  {
    kind: 'switch' as const,
    path: ['options'],
    row: (n = 1): any => ({ value: { kind: 'constant', value: n }, sequence: { $sequence: null } }),
    patch: { value: { kind: 'constant', value: 4 } },
  },
  {
    kind: 'listenForCombatEvents' as const,
    path: ['parameters', 'responses'],
    row: (n = 1): any => ({
      key: `r${n}`,
      event: { kind: 'operatorHit' },
      sequence: { $sequence: null },
    }),
    patch: { key: 'renamed' },
  },
];
const rows = (value: any, f: (typeof fixtures)[number]): any[] =>
  f.kind === 'switch' ? value.options : value.parameters.responses;
const withRows = (value: any, f: (typeof fixtures)[number], next: any[]): ActionGraphStep =>
  f.kind === 'switch'
    ? { ...value, options: next }
    : { ...value, parameters: { ...value.parameters, responses: next } };
function graph(f: (typeof fixtures)[number]): ActionGraphDefinition {
  const first = { ...f.row(), sequence: { $sequence: 'target' } },
    second = { ...f.row(2), sequence: { $sequence: 'target' } };
  if (f.kind === 'switch') first.value = { kind: 'valueNode', nodeId: 'shared' };
  else first.condition = { kind: 'conditionNode', nodeId: 'shared' };
  const action =
    f.kind === 'switch'
      ? {
          kind: 'switch',
          parameters: { choice: { kind: 'constant', value: 1 }, alwaysNext: true },
          options: [first, second],
        }
      : { kind: f.kind, parameters: { responses: [first, second] } };
  return {
    nodes: {
      source: { action: action as ActionGraphStep, next: null },
      other: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'target' } },
        next: null,
      },
      target: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
    },
    dataNodes: {
      shared:
        f.kind === 'switch'
          ? { type: 'number', expression: { kind: 'constant', value: 1 } }
          : { type: 'boolean', expression: { kind: 'constant', value: true } },
    },
  };
}
it.each(fixtures)(
  '$kind keeps shared nodes and exact port identities through creation, reorder, explicit disconnect and history',
  f => {
    const history = new DefinitionDraftSession(
      { actionGraph: { main: graph(f), macros: {} } },
      true,
    );
    const original = history.current,
      source = original.actionGraph.main.nodes.source!.action,
      old = rows(source, f);
    const field = actionNodeSchemas[f.kind].fields.find(
      field => field.path.join('.') === f.path.join('.'),
    )!;
    const next = [f.row(3), { ...old[1], ...f.patch }, old[0]];
    validateStructuredValue(field.valueSchema!, old, next, {
      kind: f.kind,
      path: f.path,
      graph: original.actionGraph.main,
    });
    history.update(owner =>
      replaceResourceNodeAction(owner, { kind: 'main' }, 'source', withRows(source, f, next)),
    );
    const changed = history.current;
    expect(changed.actionGraph.main.nodes.target).toBe(original.actionGraph.main.nodes.target);
    expect(changed.actionGraph.main.nodes.other).toBe(original.actionGraph.main.nodes.other);
    expect(changed.actionGraph.main.dataNodes).toBe(original.actionGraph.main.dataNodes);
    expect(rows(changed.actionGraph.main.nodes.source!.action, f)[2].sequence).toBe(
      old[0].sequence,
    );
    history.undo();
    expect(history.current).toBe(original);
    history.redo();
    expect(history.current).toBe(changed);
    const path = ['action', ...f.path, '1', 'sequence', '$sequence'];
    history.update(owner => connectResourceNode(owner, { kind: 'main' }, 'source', path, null));
    const disconnected = history.current,
      current = disconnected.actionGraph.main.nodes.source!.action;
    const after = rows(current, f).filter((_, index) => index !== 1);
    validateStructuredValue(field.valueSchema!, rows(current, f), after, {
      kind: f.kind,
      path: f.path,
      graph: disconnected.actionGraph.main,
    });
    history.update(owner =>
      replaceResourceNodeAction(owner, { kind: 'main' }, 'source', withRows(current, f, after)),
    );
    expect(
      rows(history.current.actionGraph.main.nodes.source!.action, f)[1].sequence.$sequence,
    ).toBe('target');
    expect(history.current.actionGraph.main.nodes.target).toBe(
      original.actionGraph.main.nodes.target,
    );
    expect(history.current.actionGraph.main.dataNodes).toBe(original.actionGraph.main.dataNodes);
    expect(history.current.actionGraph.main.nodes.other).toBe(
      original.actionGraph.main.nodes.other,
    );
    const input = actionTypedInputs(history.current.actionGraph.main.nodes.source!.action).find(
      input => input.source === 'shared',
    )!;
    history.update(owner => ({
      ...owner,
      actionGraph: {
        ...owner.actionGraph,
        main: setGraphDataInput(
          owner.actionGraph.main,
          'action',
          'source',
          input,
          null,
          f.kind === 'switch' ? 1 : true,
        ),
      },
    }));
    expect(history.current.actionGraph.main.dataNodes!.shared).toBe(
      original.actionGraph.main.dataNodes!.shared,
    );
  },
);
it.each(fixtures)(
  '$kind commands bind in the exact main/macro namespace and retain invalid-draft rejection',
  f => {
    const inner = graph(f),
      owner = {
        actionGraph: {
          main: {
            nodes: {},
            dataNodes: {
              shared:
                f.kind === 'switch'
                  ? {
                      type: 'boolean' as const,
                      expression: { kind: 'constant' as const, value: true },
                    }
                  : {
                      type: 'number' as const,
                      expression: { kind: 'constant' as const, value: 2 },
                    },
            },
          },
          macros: { m: { parameters: ['p'], entry: { $sequence: 'source' }, graph: inner } },
        },
      };
    const source = inner.nodes.source!.action;
    const changed = replaceResourceNodeAction(
      owner,
      { kind: 'macro', macroId: 'm' },
      'source',
      withRows(
        source,
        f,
        rows(source, f).map(row => ({ ...row })),
      ),
    );
    expect(rows(changed.actionGraph.macros.m.graph.nodes.source!.action, f)[0].sequence).toBe(
      rows(source, f)[0].sequence,
    );
    expect(() =>
      replaceResourceNodeAction(
        owner,
        { kind: 'macro', macroId: 'm' },
        'source',
        withRows(source, f, [{ ...f.row(), sequence: { $sequence: 'missing' } }]),
      ),
    ).toThrow();
    if (f.kind === 'switch') {
      const parameter = { ...f.row(), value: { kind: 'parameter', parameter: 'p' } };
      expect(() =>
        replaceResourceNodeAction(
          owner,
          { kind: 'macro', macroId: 'm' },
          'source',
          withRows(source, f, [parameter]),
        ),
      ).not.toThrow();
      expect(() =>
        replaceResourceNodeAction(
          { actionGraph: { main: inner, macros: {} } },
          { kind: 'main' },
          'source',
          withRows(source, f, [parameter]),
        ),
      ).toThrow();
    } else {
      for (const next of [
        [],
        [f.row(), f.row()],
        [{ ...f.row(), priority: 1 }],
        [{ ...f.row(), phase: 'dataAction', priority: 1.5 }],
      ])
        expect(() =>
          replaceResourceNodeAction(
            owner,
            { kind: 'macro', macroId: 'm' },
            'source',
            withRows(source, f, next),
          ),
        ).toThrow();
    }
  },
);
function findOwner(
  value: unknown,
  kind: string,
  path: (string | number)[] = [],
): { path: (string | number)[]; id: string } | undefined {
  if (!value || typeof value !== 'object') return;
  const object = value as Record<string, any>;
  for (const [id, node] of Object.entries(object.actionGraph?.main?.nodes ?? {}) as [string, any][])
    if (node.action?.kind === kind) return { path, id };
  for (const [key, child] of Object.entries(object)) {
    const found = findOwner(child, kind, [...path, Array.isArray(value) ? Number(key) : key]);
    if (found) return found;
  }
}
it.each(fixtures)(
  '$kind edits generated owner rows through WorkspaceAssetSession and official save/import',
  async f => {
    const definition =
      f.kind === 'switch'
        ? (await import('../../data/operators/mifu.generated')).mifu
        : (await import('../../data/operators/ember.generated')).ember;
    const target = findOwner(definition, f.kind)!;
    expect(target).toBeDefined();
    const session = new WorkspaceAssetSession(
      {
        id: definition.slug,
        kind: 'operator',
        kindName: 'Operator',
        name: 'Branches',
        custom: false,
        edit: { kind: 'operator', definition },
      },
      `project:operator:branches-${f.kind}`,
    );
    const owner = fieldValueAt(
      session.current.edit.definition,
      target.path,
    ) as ActionGraphResourceOwner;
    const original = resourceGraph(owner, { kind: 'main' }),
      source = original.nodes[target.id]!.action,
      old = rows(source, f);
    const next = [...old.map((row, index) => (index ? row : { ...row, ...f.patch })), f.row(99)];
    const field = actionNodeSchemas[f.kind].fields.find(
      field => field.path.join('.') === f.path.join('.'),
    )!;
    validateStructuredValue(field.valueSchema!, old, next, {
      kind: f.kind,
      path: f.path,
      graph: original,
    });
    session.changeGraph(target.path, owner =>
      replaceResourceNodeAction(owner, { kind: 'main' }, target.id, withRows(source, f, next)),
    );
    const changed = session.current,
      after = resourceGraph(
        fieldValueAt(changed.edit.definition, target.path) as ActionGraphResourceOwner,
        { kind: 'main' },
      );
    expect(after.dataNodes).toBe(original.dataNodes);
    expect(Object.keys(after.nodes)).toEqual(Object.keys(original.nodes));
    old.forEach((row, index) =>
      expect(rows(after.nodes[target.id]!.action, f)[index].sequence).toBe(row.sequence),
    );
    session.history.undo();
    session.history.redo();
    expect(session.current).toBe(changed);
    const request = session.saveRequest();
    const project = saveProjectTemplateDefinition(
      createEmptyProject({ createdWith: 'sequence-test' }),
      request.draft.edit,
      request.sourceId,
      request.targetId,
      request.draft.name,
      request.replace,
      request.draft.graphPresentations,
    );
    const parsed = parseProjectDocument(serializeProjectDocument(project));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw Error('roundtrip');
    expect(
      fieldValueAt(parsed.value.definitionLibrary!.operators[request.targetId]!.definition, [
        ...target.path,
        'actionGraph',
      ]),
    ).toEqual(
      after === original
        ? owner.actionGraph
        : (fieldValueAt(changed.edit.definition, target.path) as ActionGraphResourceOwner)
            .actionGraph,
    );
  },
);
it('edited switch rows execute the first float32 match and preserve an empty matched branch', () => {
  const f = fixtures[0]!;
  const initial = graph(f);
  const owner: { actionGraph: { main: ActionGraphDefinition; macros: {} } } = {
    actionGraph: {
      main: {
        ...initial,
        nodes: {
          ...initial.nodes,
          target: {
            action: {
              kind: 'setContextFlag' as const,
              parameters: { target: 'caster' as const, flag: 'chosen', value: true },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  };
  const source = owner.actionGraph.main.nodes.source!.action;
  const linked = {
    ...f.row(),
    value: { kind: 'constant', value: 1 + 1e-9 },
    sequence: { $sequence: 'target' },
  };
  const empty = f.row();
  const first = replaceResourceNodeAction(
    owner,
    { kind: 'main' },
    'source',
    withRows(source, f, [linked, empty]),
  );
  const reordered = replaceResourceNodeAction(
    first,
    { kind: 'main' },
    'source',
    withRows(first.actionGraph.main.nodes.source!.action, f, [empty, linked]),
  );
  function run(current: ActionGraphDefinition) {
    const calls: string[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: operation => {
          calls.push(operation.kind);
          return true;
        },
        evaluate: () => true,
      },
      { blackboard: new ActionBlackboard() },
    );
    const sequence = runtime.createGraphSequence(
      createActionGraphCompilation(current, 1, 'edited-switch').compileAll(),
      'source',
      'root',
    );
    sequence.reset({});
    sequence.tryExecute({});
    return calls;
  }
  expect(run(first.actionGraph.main)).toEqual(['setContextFlag']);
  expect(run(reordered.actionGraph.main)).toEqual([]);
});
it('listener authoring keeps the original event and end-frame validation contract', () => {
  const f = fixtures[1]!,
    main = graph(f),
    original = {
      ...perlica.dodgeSkill!,
      actionGraph: { main, macros: {} },
      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'source' } }],
    };
  expect(
    validateSkillDefinition(original).some(
      issue => issue.message === 'combat event listeners require an end frame',
    ),
  ).toBe(true);
  expect(
    validateSkillDefinition({
      ...original,
      scheduledSequences: [{ ...original.scheduledSequences[0]!, endFrame: 5 }],
    }).some(issue => issue.message === 'combat event listeners require an end frame'),
  ).toBe(false);
  expect(() =>
    replaceResourceNodeAction(
      original,
      { kind: 'main' },
      'source',
      withRows(main.nodes.source!.action, f, [{ ...f.row(), event: { kind: 'unknown' } }]),
    ),
  ).toThrow();
});
