import { expect, it } from 'vitest';
import type {
  ActionGraphDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import { replaceResourceNodeAction, updateResourceGraph } from './actionGraphResourceEditing';
import { DefinitionDraftSession } from './definitionDraftSession';
import { setGraphDataInput } from './graphDataInputEditing';
import { actionTypedInputs } from '../../ui/action-graph/typedGraphInputs';
import { actionNodeSchemas } from '../../ui/action-graph/actionNodeSchemas.generated';
import { validateStructuredValue } from '../../ui/field-editor/structuredValue';
const fixtures = [
  {
    kind: 'readSkillSettingData',
    name: 'items',
    key: 'column',
    row: { values: [1, 2, 3, 4], storeKey: 'saved' },
    patch: { storeKey: 'next' },
  },
];
function operand(row: any, f: (typeof fixtures)[number]) {
  return row[f.key];
}
function withOperand(row: any, f: (typeof fixtures)[number], value: unknown): any {
  return {
    ...row,
    [f.key]: value,
  };
}
function action(f: (typeof fixtures)[number], value: unknown): ActionGraphStep {
  return {
    kind: f.kind,
    parameters: {
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
        withRows(disconnectedAction, fixture, []),
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
          items: [{ values: [1], column: { kind: 'constant', value: 1 }, storeKey: 'x' }],
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
