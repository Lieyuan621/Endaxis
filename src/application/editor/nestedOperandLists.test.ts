import { expect, it } from 'vitest';
import type {
  ActionGraphDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import {
  replaceResourceNodeAction,
  resourceGraph,
  updateResourceGraph,
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
import { operatorReferenceChoices } from './operatorReferenceChoices';
const fixtures = [
  {
    kind: 'applyBuff',
    name: 'keywordEnhancements',
    key: 'value',
    row: { triggerBuffIds: ['buff'], operation: 'add' },
    patch: { operation: 'multiply' },
  },
  {
    kind: 'applyBuff',
    name: 'onActionEndBuffs',
    key: 'amount',
    row: { buffId: 'buff', target: 'caster' },
    patch: { inheritSourceSkillCastInfo: true },
  },
  {
    kind: 'readSkillSettingData',
    name: 'items',
    key: 'column',
    row: { values: [1, 2, 3, 4], storeKey: 'saved' },
    patch: { storeKey: 'next' },
  },
];
function operand(row: any, f: (typeof fixtures)[number]) {
  return f.name === 'onActionEndBuffs' ? row.blackboardAssignments.amount : row[f.key];
}
function withOperand(row: any, f: (typeof fixtures)[number], value: unknown): any {
  return {
    ...row,
    ...(f.name === 'onActionEndBuffs'
      ? { blackboardAssignments: { ...row.blackboardAssignments, amount: value } }
      : { [f.key]: value }),
  };
}
function action(f: (typeof fixtures)[number], value: unknown): ActionGraphStep {
  return {
    kind: f.kind,
    parameters: {
      ...(f.kind === 'applyBuff' ? { buffId: 'buff', target: 'caster', finishByAction: true } : {}),
      [f.name]: [withOperand(f.row, f, value)],
    },
  } as ActionGraphStep;
}
function graph(f: (typeof fixtures)[number]): ActionGraphDefinition {
  return {
    nodes: {
      damage: { action: action(f, { kind: 'valueNode', nodeId: 'shared' }), next: 'other' },
      other: { action: action(f, { kind: 'valueNode', nodeId: 'shared' }), next: null },
    },
    dataNodes: {
      shared: { type: 'number', expression: { kind: 'blackboard', key: 'rate', fallback: 2 } },
    },
  };
}
const rows = (action: unknown, f: (typeof fixtures)[number]) =>
  (action as any).parameters[f.name] as any[];
const withRows = (action: ActionGraphStep, f: (typeof fixtures)[number], value: unknown) =>
  ({
    ...action,
    parameters: { ...(action as any).parameters, [f.name]: value },
  }) as ActionGraphStep;
it.each(fixtures)(
  '$name validates bound proposals in the exact graph and saves raw shared references through undo/redo',
  fixture => {
    const history = new DefinitionDraftSession(
      { actionGraph: { main: graph(fixture), macros: {} } },
      true,
    );
    const original = history.current;
    const source = original.actionGraph.main.nodes.damage!.action;
    const old = rows(source, fixture);
    const next = [{ ...old[0], ...fixture.patch }];
    const field = actionNodeSchemas[fixture.kind as keyof typeof actionNodeSchemas].fields.find(
      field => field.path.at(-1) === fixture.name,
    )!;
    expect(() =>
      validateStructuredValue(field.valueSchema!, old, next, {
        kind: fixture.kind,
        path: field.path,
      }),
    ).not.toThrow();
    history.update(owner =>
      replaceResourceNodeAction(owner, { kind: 'main' }, 'damage', withRows(source, fixture, next)),
    );
    const applied = history.current;
    expect(operand(rows(applied.actionGraph.main.nodes.damage!.action, fixture)[0], fixture)).toBe(
      operand(old[0], fixture),
    );
    expect(applied.actionGraph.main.dataNodes).toBe(original.actionGraph.main.dataNodes);
    expect(applied.actionGraph.main.nodes.other).toBe(original.actionGraph.main.nodes.other);
    expect(
      actionTypedInputs(applied.actionGraph.main.nodes.damage!.action).find(
        input => input.path.at(-1) === fixture.key,
      )?.source,
    ).toBe('shared');
    expect(history.undo()).toBe(true);
    expect(history.current).toBe(original);
    expect(history.redo()).toBe(true);
    expect(history.current).toBe(applied);
    const input = actionTypedInputs(applied.actionGraph.main.nodes.damage!.action).find(
      input => input.path.at(-1) === fixture.key,
    )!;
    history.update(owner =>
      updateResourceGraph(owner, { kind: 'main' }, graph =>
        setGraphDataInput(graph, 'action', 'damage', input, null, 0),
      ),
    );
    const disconnected = history.current.actionGraph.main;
    expect(disconnected.dataNodes!.shared).toBe(applied.actionGraph.main.dataNodes!.shared);
    expect(
      actionTypedInputs(disconnected.nodes.other!.action).find(
        input => input.path.at(-1) === fixture.key,
      )?.source,
    ).toBe('shared');
    const disconnectedAction = disconnected.nodes.damage!.action;
    expect(() =>
      validateStructuredValue(field.valueSchema!, rows(disconnectedAction, fixture), [], {
        kind: fixture.kind,
        path: field.path,
      }),
    ).not.toThrow();
    history.update(owner =>
      replaceResourceNodeAction(
        owner,
        { kind: 'main' },
        'damage',
        withRows(disconnectedAction, fixture, fixture.name === 'onActionEndBuffs' ? undefined : []),
      ),
    );
    expect(history.current.actionGraph.main.dataNodes!.shared).toBe(
      applied.actionGraph.main.dataNodes!.shared,
    );
  },
);

it.each(fixtures)(
  '$name rejects invalid sibling values, missing/type-invalid/cyclic pins and main/undeclared parameters atomically',
  fixture => {
    const owner = { actionGraph: { main: graph(fixture), macros: {} } };
    const before = owner.actionGraph.main.nodes.damage!.action;
    const replace = (value: ActionGraphStep) =>
      replaceResourceNodeAction(owner, { kind: 'main' }, 'damage', value);
    expect(() =>
      replace({
        ...before,
        parameters: {
          ...(before as any).parameters,
          ...(fixture.kind === 'applyBuff'
            ? { target: 'invalid' }
            : { items: [{ values: [1], column: { kind: 'constant', value: 1 }, storeKey: 'x' }] }),
        },
      } as ActionGraphStep),
    ).toThrow();
    expect(() => replace(action(fixture, { kind: 'valueNode', nodeId: 'missing' }))).toThrow(
      /missing/,
    );
    expect(() => replace(action(fixture, { kind: 'parameter', parameter: 'argument' }))).toThrow(
      /only allowed inside a macro/,
    );
    const invalidType = {
      actionGraph: {
        main: {
          ...graph(fixture),
          dataNodes: {
            shared: {
              type: 'boolean' as const,
              expression: { kind: 'constant' as const, value: true },
            },
          },
        },
        macros: {},
      },
    };
    expect(() =>
      replaceResourceNodeAction(invalidType, { kind: 'main' }, 'damage', { ...before }),
    ).toThrow(/expected number/);
    const cyclic = {
      actionGraph: {
        main: {
          ...graph(fixture),
          dataNodes: {
            shared: {
              type: 'number' as const,
              expression: { kind: 'valueNode' as const, nodeId: 'shared' },
            },
          },
        },
        macros: {},
      },
    };
    expect(() =>
      replaceResourceNodeAction(cyclic, { kind: 'main' }, 'damage', { ...before }),
    ).toThrow(/recursive data graph/);
    const macroOwner = {
      actionGraph: {
        main: {
          nodes: {},
          dataNodes: {
            shared: {
              type: 'boolean' as const,
              expression: { kind: 'constant' as const, value: true },
            },
          },
        },
        macros: {
          macro: {
            parameters: ['argument'],
            entry: { $sequence: 'damage' },
            graph: graph(fixture),
          },
        },
      },
    };
    const macro = replaceResourceNodeAction(
      macroOwner,
      { kind: 'macro', macroId: 'macro' },
      'damage',
      { ...before },
    );
    expect(
      operand(rows(macro.actionGraph.macros.macro.graph.nodes.damage!.action, fixture)[0], fixture),
    ).toEqual({ kind: 'valueNode', nodeId: 'shared' });
    expect(() =>
      replaceResourceNodeAction(
        macroOwner,
        { kind: 'macro', macroId: 'macro' },
        'damage',
        action(fixture, { kind: 'parameter', parameter: 'argument' }),
      ),
    ).not.toThrow();
    expect(() =>
      replaceResourceNodeAction(
        macroOwner,
        { kind: 'macro', macroId: 'macro' },
        'damage',
        action(fixture, { kind: 'parameter', parameter: 'missing' }),
      ),
    ).toThrow(/undeclared/);
    expect(owner.actionGraph.main.nodes.damage!.action).toBe(before);
  },
);

function findOwner(
  value: unknown,
  fixture: (typeof fixtures)[number],
  path: (string | number)[] = [],
): { path: (string | number)[]; id: string } | undefined {
  if (!value || typeof value !== 'object') return;
  const object = value as Record<string, any>;
  for (const [id, node] of Object.entries(object.actionGraph?.main?.nodes ?? {}) as [
    string,
    any,
  ][]) {
    if (node.action?.kind === fixture.kind && node.action.parameters[fixture.name]?.length)
      return { path, id };
  }
  for (const [key, child] of Object.entries(object)) {
    const found = findOwner(child, fixture, [...path, Array.isArray(value) ? Number(key) : key]);
    if (found) return found;
  }
}
it.each(fixtures)(
  '$name edits real generated owner graphs with official project serialization/import and creation history',
  async fixture => {
    const definition =
      fixture.name === 'keywordEnhancements'
        ? (await import('../../data/operators/purrchena.generated')).purrchena
        : fixture.name === 'onActionEndBuffs'
          ? (await import('../../data/operators/liino.generated')).liino
          : (await import('../../data/operators/antal.generated')).antal;
    const target = findOwner(definition, fixture)!;
    expect(target).toBeDefined();
    const session = new WorkspaceAssetSession(
      {
        id: definition.slug,
        kind: 'operator',
        kindName: 'Operator',
        name: 'Modifiers',
        custom: false,
        edit: { kind: 'operator', definition },
      },
      `project:operator:modifier-${fixture.key}`,
    );
    const owner = fieldValueAt(
      session.current.edit.definition,
      target.path,
    ) as ActionGraphResourceOwner;
    const original = resourceGraph(owner, { kind: 'main' });
    const current = original.nodes[target.id]!.action;
    const old = rows(current, fixture);
    const field = actionNodeSchemas[fixture.kind as keyof typeof actionNodeSchemas].fields.find(
      field => field.path.at(-1) === fixture.name,
    )!;
    const next = [
      ...old.map((row, index) => (index ? row : { ...row, ...fixture.patch })),
      withOperand(
        {
          ...old[0],
          ...(fixture.name === 'onActionEndBuffs' ? { blackboardAssignments: {} } : {}),
        },
        fixture,
        { kind: 'constant', value: 3 },
      ),
    ];
    validateStructuredValue(field.valueSchema!, old, next, {
      kind: fixture.kind,
      path: field.path,
      choices: operatorReferenceChoices(definition),
    });
    session.changeGraph(target.path, owner =>
      replaceResourceNodeAction(
        owner,
        { kind: 'main' },
        target.id,
        withRows(current, fixture, next),
      ),
    );
    const changed = session.current;
    const graphAfter = resourceGraph(
      fieldValueAt(changed.edit.definition, target.path) as ActionGraphResourceOwner,
      { kind: 'main' },
    );
    expect(graphAfter.dataNodes).toBe(original.dataNodes);
    old.forEach((row, index) =>
      expect(operand(rows(graphAfter.nodes[target.id]!.action, fixture)[index], fixture)).toBe(
        operand(row, fixture),
      ),
    );
    expect(Object.keys(graphAfter.nodes)).toEqual(Object.keys(original.nodes));
    for (const input of actionTypedInputs(current)) {
      if (!input.source) continue;
      expect(
        actionTypedInputs(graphAfter.nodes[target.id]!.action).find(
          next => next.path.join('.') === input.path.join('.'),
        )?.source,
      ).toBe(input.source);
      expect(fieldValueAt(graphAfter.nodes[target.id]!.action, input.path)).toBe(
        fieldValueAt(current, input.path),
      );
    }
    session.history.undo();
    expect(
      rows(
        resourceGraph(
          fieldValueAt(session.current.edit.definition, target.path) as ActionGraphResourceOwner,
          { kind: 'main' },
        ).nodes[target.id]!.action,
        fixture,
      ),
    ).toEqual(old);
    session.history.redo();
    expect(session.current).toBe(changed);
    const request = session.saveRequest();
    const project = saveProjectTemplateDefinition(
      createEmptyProject({ createdWith: 'graph-operand-test' }),
      request.draft.edit,
      request.sourceId,
      request.targetId,
      request.draft.name,
      request.replace,
      request.draft.graphPresentations,
    );
    const parsed = parseProjectDocument(serializeProjectDocument(project));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('roundtrip failed');
    const saved = parsed.value.definitionLibrary!.operators[request.targetId]!.definition;
    expect(fieldValueAt(saved, [...target.path, 'actionGraph'])).toEqual(
      (fieldValueAt(changed.edit.definition, target.path) as ActionGraphResourceOwner).actionGraph,
    );
    expect(findOwner(definition, fixture)).toEqual(target);
  },
);
