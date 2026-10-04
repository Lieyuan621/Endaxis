import { mountSetup } from '../../test/componentSetup';
import { computed, createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import { expect, it } from 'vitest';
import { i18n } from '../../i18n';
import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { graphOperandSchemas } from './graphOperandContainerSchema';
import { supportsStructuredValue } from './structuredValueSchema';
import { resolveFieldEditor } from './fieldEditorDispatch';
import { validateStructuredValue } from './structuredValue';
import { assertEditableValue } from '../definition-editor/definitionFieldRuntime';
import { analyzeGraphBlackboard } from '../../application/editor/graphBlackboard';
import { createBlackboardFieldContext } from '../../application/editor/blackboardFieldContext';
import { blackboardFieldContextKey } from './blackboardFieldContext';
import { structuredFieldContextKey } from './structuredFieldContext';
import StructuredValueField from './StructuredValueField.vue';
import DefinitionValueCreator from '../definition-editor/DefinitionValueCreator.vue';
import ActionNodeInspector from '../action-graph/ActionNodeInspector.vue';
import NodeInspectorFields from '../action-graph/NodeInspectorFields.vue';
import { resolveBlackboardMapping } from './blackboardMapping';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import {
  globalBuffDraftContext,
  globalBuffBlackboardContext,
} from '../../application/editor/globalBuffFieldContext';
const definitionField = actionNodeSchemas.createGlobalBuff.fields.find(
  field => field.path.at(-1) === 'definition',
)!;
const assignmentsField = actionNodeSchemas.createGlobalBuff.fields.find(
  field => field.path.at(-1) === 'blackboardAssignments',
)!;
const context = (parameters: readonly string[] = []) =>
  createBlackboardFieldContext(
    analyzeGraphBlackboard({ nodes: {} }, [], parameters, {
      ratio: 99,
      creatorOnly: 8,
      EntityBB_creator: 9,
    }),
    new Set(['current']),
  );
function baseDefinition(): any {
  return {
    stackingType: 'unlimited',
    blackboard: { ratio: 'wrong', local: 3, nil: null },
    durationSeconds: { blackboardKey: 'ratio' },
    children: [
      { buffId: 'child', blackboardAssignments: { amount: { kind: 'blackboard', key: 'local' } } },
    ],
    sharedSpModifiers: [
      {
        attribute: 'spRecovery',
        operation: 'addition',
        applyToReturnSpGain: false,
        value: { kind: 'blackboard', key: 'ratio' },
      },
    ],
  };
}
function action(
  definition = baseDefinition(),
  overrides: unknown = { ratio: { kind: 'constant', value: 2 } },
): any {
  return {
    kind: 'createGlobalBuff',
    parameters: {
      globalBuffId: 'global',
      definition,
      ...(overrides === null ? {} : { blackboardAssignments: overrides }),
    },
  };
}
const choices = {
  buff: {
    family: 'buff',
    complete: true,
    candidates: [
      {
        identity: 'child',
        value: 'child',
        label: 'Child',
        family: 'buff',
        scope: 'shared' as const,
        source: { id: 'test', label: 'Test', kind: 'builtin' as const },
        writable: false,
      },
    ],
  },
};
const options = (
  value: any,
  graph?: ActionGraphDefinition,
  parameters: readonly string[] = [],
) => ({
  kind: 'createGlobalBuff',
  path: definitionField.path,
  choices,
  blackboard: context(parameters),
  globalBuff: globalBuffDraftContext(value),
  graph,
});
function mount(
  component: unknown,
  initial: Record<string, unknown>,
  field = definitionField,
  parameters: readonly string[] = [],
  graph?: ActionGraphDefinition,
) {
  return mountSetup(component, initial, app => {
    app.provide(
      blackboardFieldContextKey,
      computed(() => context(parameters)),
    );
    app.provide(
      structuredFieldContextKey,
      computed(() => ({
        kind: 'createGlobalBuff',
        globalBuff: {
          definition: baseDefinition(),
          overrides: { ratio: { kind: 'constant', value: 2 } },
        },
        graph,
        path: field.path,
        graphOperands: graphOperandSchemas(field.valueSchema, 'createGlobalBuff', field.path),
      })),
    );
  });
}

it('admits only the formal GlobalBuff body and two operand positions without granting duration a graph pin', () => {
  const schema = definitionField.valueSchema!;
  const allowed = graphOperandSchemas(schema, 'createGlobalBuff', definitionField.path)!;
  expect(supportsStructuredValue(schema)).toBe(false);
  expect(resolveFieldEditor(definitionField, { nodeKind: 'createGlobalBuff' }).control).toBe(
    'structuredValue',
  );
  expect(
    graphOperandSchemas(
      { ...schema, declaration: undefined },
      'createGlobalBuff',
      definitionField.path,
    ),
  ).toBeUndefined();
  for (const operand of allowed)
    expect(() => assertEditableValue(operand, undefined, { kind: 'constant', value: 1 })).toThrow();
  const a = action();
  expect(() =>
    validateStructuredValue(schema, undefined, a.parameters.definition, options(a)),
  ).not.toThrow();
  expect(() =>
    validateStructuredValue(
      schema,
      a.parameters.definition,
      { ...a.parameters.definition, durationSeconds: { kind: 'valueNode', nodeId: 'raw' } },
      options(a),
    ),
  ).toThrow();
  const fields: any = (schema as any).fields;
  expect(
    resolveBlackboardMapping(
      fields.children.element.fields.blackboardAssignments,
      'blackboardAssignments',
    )?.destination,
  ).toBe('globalBuffChild');
});
it('closed local operands reject creator-only, string and null reads, support overrides/fallbacks and retain macro namespaces', () => {
  const a = action();
  const before = a.parameters.definition;
  for (const value of [
    { kind: 'constant', value: 0 },
    { kind: 'blackboard', key: 'local' },
    { kind: 'blackboard', key: 'ratio' },
    { kind: 'blackboard', key: 'missing', fallback: 1 },
    { kind: 'parameter', parameter: 'arg' },
  ]) {
    const next = { ...before, sharedSpModifiers: [{ ...before.sharedSpModifiers[0], value }] };
    expect(() =>
      validateStructuredValue(definitionField.valueSchema!, before, next, {
        ...options(a, undefined, ['arg']),
        globalBuff: { ...globalBuffDraftContext(a)!, definition: next },
      }),
    ).not.toThrow();
  }
  for (const value of [
    { kind: 'blackboard', key: 'creatorOnly' },
    { kind: 'blackboard', key: 'EntityBB_creator' },
    { kind: 'blackboard', key: 'nil' },
    { kind: 'parameter', parameter: 'arg' },
    { kind: 'constant', value: '' },
  ]) {
    const next = { ...before, sharedSpModifiers: [{ ...before.sharedSpModifiers[0], value }] };
    expect(() =>
      validateStructuredValue(definitionField.valueSchema!, before, next, options(a)),
    ).toThrow();
  }
  const withoutOverride = action(before, null);
  expect(() =>
    validateStructuredValue(definitionField.valueSchema!, before, before, options(withoutOverride)),
  ).toThrow();
  expect(
    globalBuffBlackboardContext(context(), before, undefined).candidates.some(
      c => c.key === 'creatorOnly',
    ),
  ).toBe(false);
});
it('connected local reads bind same-graph expressions and preserve identity/count while checking the local board', () => {
  const a = action();
  const pin = { kind: 'valueNode', nodeId: 'shared' };
  a.parameters.definition.children[0].blackboardAssignments.amount = pin;
  const graph: ActionGraphDefinition = {
    nodes: {},
    dataNodes: { shared: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } } },
  };
  const before = a.parameters.definition;
  const next = { ...before, applyIconDurationToBuffs: true };
  expect(() =>
    validateStructuredValue(definitionField.valueSchema!, before, next, options(a, graph)),
  ).not.toThrow();
  expect(() =>
    validateStructuredValue(
      definitionField.valueSchema!,
      before,
      next,
      options(action(before, null), graph),
    ),
  ).toThrow();
  expect(() =>
    validateStructuredValue(definitionField.valueSchema!, before, next, options(a)),
  ).toThrow(/graphRequired/);
  for (const children of [
    [],
    [before.children[0], before.children[0]],
    [{ ...before.children[0], blackboardAssignments: { amount: { ...pin } } }],
  ])
    expect(() =>
      validateStructuredValue(
        definitionField.valueSchema!,
        before,
        { ...before, children },
        options(a, graph),
      ),
    ).toThrow();
  const wrong: ActionGraphDefinition = {
    nodes: {},
    dataNodes: { shared: { type: 'boolean', expression: { kind: 'constant', value: true } } },
  };
  expect(() =>
    validateStructuredValue(definitionField.valueSchema!, before, next, options(a, wrong)),
  ).toThrow(/expected number/);
});
it('the whole-node proposal revalidates unchanged definition reads when only override siblings change', async () => {
  const value = action();
  const applied: unknown[] = [];
  const host = await mount(NodeInspectorFields, {
    value,
    kind: 'createGlobalBuff',
    fields: [definitionField, assignmentsField],
    referenceChoices: choices,
    blackboardContext: context(),
    applyValue: (next: unknown) => {
      applied.push(next);
      return true;
    },
  });
  host.state.changeStructured(assignmentsField, undefined);
  expect(applied).toEqual([]);
  expect(host.state.error.value).not.toBe('');
  host.state.changeStructured(assignmentsField, { ratio: { kind: 'constant', value: 5 } });
  expect(applied).toHaveLength(1);
  host.state.stageStructured(definitionField, {
    ...value.parameters.definition,
    applyIconDurationToBuffs: true,
  });
  host.state.changeStructured(assignmentsField, {
    ratio: { kind: 'blackboard', key: 'creatorOnly' },
  });
  expect(host.state.apply()).toBe(true);
  expect(applied).toHaveLength(2);
  host.stop();
});
it('open local drafts use latest override props without reset, retain failed drafts, and cancel/readonly/no-op safely', async () => {
  const value = action();
  const changes: any[] = [];
  const host = await mount(StructuredValueField, {
    value: value.parameters.definition,
    schema: definitionField.valueSchema,
    actionValue: value,
    kind: 'createGlobalBuff',
    path: definitionField.path,
    editable: true,
    label: 'Global',
    referenceChoices: choices,
    onChange: (next: unknown) => changes.push(next),
  });
  host.state.begin();
  host.state.change(['applyIconDurationToBuffs'], true);
  await host.update({ actionValue: action(value.parameters.definition, null) });
  expect(host.state.editing.value).toBe(true);
  await host.state.stage();
  expect(changes).toHaveLength(0);
  await host.update({ actionValue: value });
  await host.state.stage();
  expect(changes).toHaveLength(1);
  expect(host.state.error.value).toBe('structuredValue.rejected');
  await host.update({ value: changes[0] });
  host.state.begin();
  await host.state.stage();
  expect(changes).toHaveLength(1);
  host.state.begin();
  host.state.change(['blackboard', 'local'], 'bad');
  host.state.discard();
  host.state.begin();
  expect(host.state.draft.value).toBe(changes[0]);
  await host.update({ editable: false });
  await host.state.stage();
  expect(changes).toHaveLength(1);
  host.stop();
});
it('full and child Creators use their true local draft board, keep destination keys separate, and revalidate references', async () => {
  const created: unknown[] = [];
  const schema: any = definitionField.valueSchema;
  const host = await mount(
    DefinitionValueCreator,
    {
      schema,
      editable: true,
      editingContext: 'value',
      referenceChoices: choices,
      onCreate: (value: unknown) => created.push(value),
    },
    definitionField,
    ['arg'],
  );
  const value = baseDefinition();
  value.blackboard.local = 7;
  host.state.change([], value);
  expect(host.state.structuredContext.value.globalBuff.definition).toBe(value);
  expect(host.state.complete.value).toBe(true);
  host.state.create();
  expect(created).toHaveLength(1);
  host.state.change(['children', 0, 'blackboardAssignments', 'amount'], {
    kind: 'parameter',
    parameter: 'arg',
  });
  expect(host.state.complete.value).toBe(true);
  host.state.change(['children', 0, 'blackboardAssignments', 'amount'], {
    kind: 'valueNode',
    nodeId: 'raw',
  });
  expect(host.state.complete.value).toBe(false);
  host.state.change(['children', 0, 'blackboardAssignments', 'amount'], {
    kind: 'blackboard',
    key: 'local',
  });
  await host.update({ editable: false });
  expect(host.state.complete.value).toBe(true);
  host.state.create();
  expect(created).toHaveLength(1);
  host.stop();
  const child = await mount(DefinitionValueCreator, {
    schema: schema.fields.children.element,
    fieldPath: ['children', 0],
    editable: true,
    editingContext: 'value',
    referenceChoices: choices,
  });
  child.state.change([], {
    buffId: 'child',
    blackboardAssignments: { brandNewChildKey: { kind: 'blackboard', key: 'local' } },
  });
  expect(child.state.complete.value).toBe(true);
  child.state.change(['blackboardAssignments', 'brandNewChildKey'], {
    kind: 'blackboard',
    key: 'creatorOnly',
  });
  expect(child.state.complete.value).toBe(false);
  child.state.change(['blackboardAssignments', 'brandNewChildKey'], { kind: 'constant', value: 1 });
  await child.update({ referenceChoices: { buff: { ...choices.buff, candidates: [] } } });
  expect(child.state.complete.value).toBe(false);
  child.stop();
});
it('generated existing and readonly GlobalBuff fields render local diagnostics and preserve connected source navigation', async () => {
  const a = action();
  const pin = { kind: 'valueNode', nodeId: 'shared' };
  a.parameters.definition.children[0].blackboardAssignments.amount = pin;
  const inspector = await mount(ActionNodeInspector, {
    nodeId: 'global',
    node: { action: a, next: null },
    applyAction: () => true,
  });
  expect(inspector.state.fields.value).toContain(definitionField);
  inspector.stop();
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(StructuredValueField, {
          schema: definitionField.valueSchema!,
          actionValue: a,
          value: a.parameters.definition,
          kind: 'createGlobalBuff',
          path: definitionField.path,
          label: 'Global',
          editable: false,
          referenceChoices: choices,
        }),
    })
      .use(i18n)
      .provide(ID_INJECTION_KEY, { prefix: 1, current: 0 })
      .provide(ZINDEX_INJECTION_KEY, { current: 0 }),
  );
  expect(html).toContain('GlobalBuff');
  expect(html).toContain('shared');
  expect(html).not.toContain('textarea');
  expect(html).not.toContain('aria-label="nodeId"');
});
