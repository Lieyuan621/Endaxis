import { createRenderer, nextTick, reactive, shallowRef, ssrContextKey } from 'vue';
import { expect, it, vi } from 'vitest';
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
import { createResourceEditorView } from '../../ui/editor/resourceEditorView';
import { useResourceGraphEditor } from '../../ui/action-graph/useResourceGraphEditor';
import { useSkillGraphEditor } from '../../ui/action-graph/useSkillGraphEditor';
import { i18n } from '../../i18n';
import { perlica } from '../../data/operators/perlica.generated';

const fixtures = [
  {
    name: 'instantDamageScaleModifiers',
    key: 'addition',
    row: { side: 'attacker', zone: 'normal' },
    patch: { side: 'defender' },
  },
  {
    name: 'instantAttributeModifiers',
    key: 'value',
    row: {
      targetSide: 'attacker',
      attribute: 'Atk',
      slot: 'baseAddition',
      attributeTiming: 'runtime',
    },
    patch: { attribute: 'criticalRate' },
  },
];
function action(field: (typeof fixtures)[number], value: unknown): ActionGraphStep {
  return {
    kind: 'dealDamage',
    parameters: {
      damageType: 'physical',
      attackScale: 1,
      tags: [],
      [field.name]: [{ ...field.row, [field.key]: value }],
    },
  } as ActionGraphStep;
}
function graph(field: (typeof fixtures)[number]): ActionGraphDefinition {
  return {
    nodes: {
      damage: { action: action(field, { kind: 'valueNode', nodeId: 'shared' }), next: 'other' },
      other: { action: action(field, { kind: 'valueNode', nodeId: 'shared' }), next: null },
    },
    dataNodes: {
      shared: { type: 'number', expression: { kind: 'blackboard', key: 'rate', fallback: 2 } },
    },
  };
}
const rows = (action: unknown, fixture: (typeof fixtures)[number]) =>
  (action as any).parameters[fixture.name] as any[];
function withRows(
  action: ActionGraphStep,
  fixture: (typeof fixtures)[number],
  value: unknown,
): ActionGraphStep {
  return {
    ...action,
    parameters: { ...(action as any).parameters, [fixture.name]: value },
  } as ActionGraphStep;
}

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
    const field = actionNodeSchemas.dealDamage.fields.find(
      field => field.path.at(-1) === fixture.name,
    )!;
    expect(() =>
      validateStructuredValue(field.valueSchema!, old, next, {
        kind: 'dealDamage',
        path: field.path,
      }),
    ).not.toThrow();
    history.update(owner =>
      replaceResourceNodeAction(owner, { kind: 'main' }, 'damage', withRows(source, fixture, next)),
    );
    const applied = history.current;
    expect(rows(applied.actionGraph.main.nodes.damage!.action, fixture)[0][fixture.key]).toBe(
      old[0][fixture.key],
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
        kind: 'dealDamage',
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
        parameters: { ...(before as any).parameters, attackScale: NaN },
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
      rows(macro.actionGraph.macros.macro.graph.nodes.damage!.action, fixture)[0][fixture.key],
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
    if (node.action?.kind === 'dealDamage' && node.action.parameters[fixture.name]?.length)
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
      fixture.name === 'instantAttributeModifiers'
        ? (await import('../../data/operators/yvonne.generated')).yvonne
        : (await import('../../data/operators/estella.generated')).estella;
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
    const field = actionNodeSchemas.dealDamage.fields.find(
      field => field.path.at(-1) === fixture.name,
    )!;
    const next = [
      ...old.map((row, index) => (index ? row : { ...row, ...fixture.patch })),
      { ...fixture.row, [fixture.key]: { kind: 'constant', value: 3 } },
    ];
    validateStructuredValue(field.valueSchema!, old, next, {
      kind: 'dealDamage',
      path: field.path,
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
      expect(rows(graphAfter.nodes[target.id]!.action, fixture)[index][fixture.key]).toBe(
        row[fixture.key],
      ),
    );
    expect(Object.keys(graphAfter.nodes)).toEqual(Object.keys(original.nodes));
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

it.each(['resource', 'skill'] as const)(
  '%s rejects an indexed connection captured before a successful structural flush, preserving one history step',
  async kind => {
    const fixture = fixtures[0]!;
    const first = action(fixture, { kind: 'constant', value: 1 });
    const second = { ...fixture.row, [fixture.key]: { kind: 'constant', value: 2 } };
    const current = withRows(first, fixture, [...rows(first, fixture), second]);
    const initial = {
      ...perlica.dodgeSkill!,
      blackboard: { rate: 2 },
      actionGraph: {
        main: { ...graph(fixture), nodes: { damage: { action: current, next: null } } },
        macros: {},
      },
      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'damage' } }],
    };
    const history = new DefinitionDraftSession(initial, true),
      state = shallowRef(history.current);
    const view = reactive(createResourceEditorView());
    view.selection = { kind: 'action', id: 'damage' };
    let host: any;
    const change = (update: (owner: any) => any) => {
      history.update(update);
      state.value = history.current;
    };
    const app = createRenderer<object, object>({
      insert() {},
      remove() {},
      patchProp() {},
      setText() {},
      setElementText() {},
      createElement: () => ({}),
      createText: () => ({}),
      createComment: () => ({}),
      parentNode: () => null,
      nextSibling: () => null,
    }).createApp({
      setup() {
        host =
          kind === 'resource'
            ? useResourceGraphEditor({
                owner: () => state.value,
                readonly: () => false,
                view: () => view,
                presentation: () => undefined,
                identity: () => kind,
                label: () => kind,
                change,
              })
            : useSkillGraphEditor({
                definition: () => state.value,
                editable: () => true,
                busy: () => false,
                view: () => view,
                presentation: () => undefined,
                identity: () => kind,
                label: () => kind,
                change,
                undo() {},
                redo() {},
              });
        return () => null;
      },
    });
    app.use(i18n).provide(ssrContextKey, { modules: new Set() });
    vi.stubGlobal('PointerEvent', class {});
    vi.stubGlobal('window', { addEventListener() {}, removeEventListener() {} });
    app.mount({});
    await nextTick();
    try {
      const pending = kind === 'resource' ? host.pending : host.nodePending;
      pending.value = true;
      host.inspector.value = {
        apply: () => {
          change(owner =>
            replaceResourceNodeAction(
              owner,
              { kind: 'main' },
              'damage',
              withRows(owner.actionGraph.main.nodes.damage.action, fixture, [
                second,
                rows(owner.actionGraph.main.nodes.damage.action, fixture)[0],
              ]),
            ),
          );
          pending.value = false;
          return true;
        },
      };
      const path = ['parameters', fixture.name, '0', fixture.key];
      const rate = host.blackboard.value.variables.find((variable: any) => variable.key === 'rate');
      const sourceIdentity = JSON.stringify([rate.scope, rate.layer, rate.key]);
      const initialDataNodes = history.current.actionGraph.main.dataNodes;
      host.dropVariable(
        sourceIdentity,
        false,
        { x: 0, y: 0 },
        { owner: 'action', id: 'damage', path },
      );
      expect(host.error.value).not.toBe('');
      expect(history.current.actionGraph.main.dataNodes).toBe(initialDataNodes);
      expect(history.undo()).toBe(true);
      expect(history.undo()).toBe(false);
      state.value = history.current;
      pending.value = true;

      expect(host.connectData('action', 'damage', path, 'shared')).toBe(false);
      expect(host.error.value).not.toBe('');
      expect(
        rows(history.current.actionGraph.main.nodes.damage!.action, fixture)[0][fixture.key],
      ).toEqual({ kind: 'constant', value: 2 });
      expect(history.undo()).toBe(true);
      expect(history.undo()).toBe(false);
      history.redo();
      state.value = history.current;
      expect(host.connectData('action', 'damage', path, 'shared')).toBe(true);
      expect(
        rows(history.current.actionGraph.main.nodes.damage!.action, fixture)[0][fixture.key],
      ).toEqual({ kind: 'valueNode', nodeId: 'shared' });
      pending.value = true;
      host.inspector.value = { apply: () => false };
      expect(host.connectData('action', 'damage', path, null, 9)).toBe(false);
    } finally {
      app.unmount();
      vi.unstubAllGlobals();
    }
  },
);
