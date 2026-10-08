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
import NodeInspectorFields from '../action-graph/NodeInspectorFields.vue';
import ActionNodeInspector from '../action-graph/ActionNodeInspector.vue';
import BlackboardMappingField from './BlackboardMappingField.vue';
import SkillSettingValuesField from './SkillSettingValuesField.vue';
import { resolveBlackboardMapping } from './blackboardMapping';
import { replaceResourceNodeAction } from '../../application/editor/actionGraphResourceEditing';
const fixtures = [
  {
    kind: 'applyBuff',
    name: 'keywordEnhancements',
    path: ['value'],
    row: { triggerBuffIds: ['buff'], operation: 'add' },
    patch: { operation: 'multiply' },
  },
  {
    kind: 'applyBuff',
    name: 'onActionEndBuffs',
    path: ['blackboardAssignments', 'amount'],
    row: { buffId: 'buff', target: 'caster', stringBlackboardAssignments: { caption: 'raw text' } },
    patch: { inheritSourceSkillCastInfo: true },
  },
  {
    kind: 'readSkillSettingData',
    name: 'items',
    path: ['column'],
    row: { values: [1, 2, 3, 4], storeKey: 'saved' },
    patch: { storeKey: 'newKey' },
  },
].map(f => ({
  ...f,
  field: actionNodeSchemas[f.kind as keyof typeof actionNodeSchemas].fields.find(
    field => field.path.at(-1) === f.name,
  )!,
}));
function row(f: (typeof fixtures)[number], value: unknown): any {
  return {
    ...f.row,
    ...(f.path.length === 2
      ? { blackboardAssignments: { amount: value } }
      : { [f.path[0]!]: value }),
  };
}
const choices = {
  buff: {
    family: 'buff',
    complete: true,
    candidates: [
      {
        identity: 'buff',
        value: 'buff',
        label: 'Buff',
        family: 'buff',
        scope: 'shared' as const,
        source: { id: 'test', label: 'Test', kind: 'builtin' as const },
        writable: false,
      },
    ],
  },
};
const context = (parameters: readonly string[] = []) =>
  createBlackboardFieldContext(
    analyzeGraphBlackboard({ nodes: {} }, [], parameters, { rate: 2, text: 'value' }),
    new Set(['current']),
  );

function mount(
  component: unknown,
  initial: Record<string, unknown>,
  field = fixtures[0]!.field,
  parameters: readonly string[] = [],
  items?: unknown,
) {
  return mountSetup(component, initial, app => {
    app.provide(
      blackboardFieldContextKey,
      computed(() => context(parameters)),
    );
    app.provide(
      structuredFieldContextKey,
      computed(() => ({
        kind: fixtures.find(f => f.field === field)!.kind,
        items,
        path: field.path,
        graphOperands: graphOperandSchemas(
          field.valueSchema,
          fixtures.find(f => f.field === field)!.kind,
          field.path,
        ),
      })),
    );
  });
}

it.each(fixtures)(
  '$name has exact declaration admission and real readonly generated controls',
  async f => {
    const allowed = graphOperandSchemas(f.field.valueSchema, f.kind, f.field.path)!;
    expect(supportsStructuredValue(f.field.valueSchema!)).toBe(false);
    expect(resolveFieldEditor(f.field, { nodeKind: f.kind }).control).toBe('structuredValue');
    expect(
      graphOperandSchemas(
        { ...f.field.valueSchema!, declaration: undefined },
        f.kind,
        f.field.path,
      ),
    ).toBeUndefined();
    const operand = [...allowed][0]!;
    expect(() => assertEditableValue(operand, undefined, { kind: 'constant', value: 2 })).toThrow();
    const value = [row(f, { kind: 'valueNode', nodeId: 'shared' })];
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(ActionNodeInspector, {
            nodeId: 'node',
            node: { action: { kind: f.kind, parameters: { [f.name]: value } } as any, next: null },
            readonly: true,
            referenceChoices: choices,
            applyAction: () => false,
          }),
      })
        .use(i18n)
        .provide(ID_INJECTION_KEY, { prefix: 1, current: 0 })
        .provide(ZINDEX_INJECTION_KEY, { current: 0 }),
    );
    expect(html).toContain(`data-structured-path="${f.field.path.join('.')}"`);
    expect(html).toContain('shared');
    expect(html).not.toContain('textarea');
    expect(html).not.toContain('aria-label="nodeId"');
  },
);
it.each(fixtures)(
  '$name creates, stages, repairs, cancels, and rejects stale sources/connected removal',
  async f => {
    const schema = f.field.valueSchema!;
    const options = { kind: f.kind, path: f.field.path, blackboard: context(['arg']), choices };
    for (const operand of [{ kind: 'constant', value: 2 }])
      expect(() =>
        validateStructuredValue(schema, undefined, [row(f, operand)], options),
      ).not.toThrow();
    for (const operand of [
      { kind: 'constant', value: '' },
      { kind: 'parameter', parameter: 'absent' },
      { kind: 'blackboard', key: 'text' },
      { kind: 'valueNode', nodeId: 'raw' },
      [1, 2],
      3,
    ])
      expect(() =>
        validateStructuredValue(schema, undefined, [row(f, operand)], options),
      ).toThrow();
    const pin = { kind: 'valueNode', nodeId: 'shared' };
    const before = [row(f, pin)];
    expect(() =>
      validateStructuredValue(schema, before, [{ ...before[0], ...f.patch }], options),
    ).not.toThrow();
    for (const next of [[], [before[0], before[0]], [row(f, { ...pin })]])
      expect(() => validateStructuredValue(schema, before, next, options)).toThrow();
    if (schema.kind !== 'array') throw new Error('array');
    const created: unknown[] = [];
    const creator = await mount(
      DefinitionValueCreator,
      {
        schema: schema.element,
        editable: true,
        editingContext: 'value',
        referenceChoices: choices,
        fieldPath: [0],
        onCreate: (value: unknown) => created.push(value),
      },
      f.field,
      ['arg'],
    );
    creator.state.change([], row(f, { kind: 'constant', value: 1 }));
    expect(creator.state.complete.value).toBe(true);
    creator.state.create();
    expect(created).toHaveLength(1);
    creator.state.change(f.path, { kind: 'parameter', parameter: 'absent' });
    expect(creator.state.complete.value).toBe(false);
    creator.state.change(f.path, { kind: 'constant', value: 2 });
    expect(creator.state.complete.value).toBe(true);
    await creator.update({ editable: false });
    creator.state.create();
    expect(created).toHaveLength(1);
    creator.stop();
    const changes: unknown[] = [];
    const value = [row(f, { kind: 'constant', value: 1 })];
    const host = await mount(
      StructuredValueField,
      {
        schema,
        value,
        editable: true,
        kind: f.kind,
        path: f.field.path,
        label: f.name,
        referenceChoices: choices,
        onChange: (next: unknown) => changes.push(next),
      },
      f.field,
    );
    host.state.begin();
    host.state.change([0, ...f.path], { kind: 'constant', value: '' });
    await host.state.stage();
    expect(changes).toHaveLength(0);
    expect(host.state.error.value).not.toBe('');
    host.state.change([0, ...f.path], { kind: 'constant', value: 3 });
    await host.state.stage();
    expect(changes).toHaveLength(1);
    await host.update({ value: changes[0] });
    host.state.begin();
    await host.state.stage();
    expect(changes).toHaveLength(1);
    host.state.begin();
    host.state.change([0, ...f.path], { kind: 'constant', value: 4 });
    host.state.discard();
    host.state.begin();
    expect(host.state.draft.value).toBe(changes[0]);
    await host.update({ editable: false });
    await host.state.stage();
    expect(changes).toHaveLength(1);
    host.stop();
  },
);
it('trigger Buff lists require the current real catalog while retaining raw order and duplicate IDs', () => {
  const f = fixtures[0]!;
  const value = [row(f, { kind: 'constant', value: 1 })];
  value[0].triggerBuffIds = ['buff', 'buff'];
  const options = { kind: f.kind, path: f.field.path, choices };
  expect(() =>
    validateStructuredValue(f.field.valueSchema!, undefined, value, options),
  ).not.toThrow();
  expect(() =>
    validateStructuredValue(f.field.valueSchema!, undefined, value, {
      ...options,
      choices: { buff: { ...choices.buff, candidates: [] } },
    }),
  ).toThrow(/Reference/);
  expect(() =>
    validateStructuredValue(
      f.field.valueSchema!,
      undefined,
      [{ ...value[0], triggerBuffIds: ['missing'] }],
      options,
    ),
  ).toThrow(/Reference/);
});
it('exit mappings keep connected identity across sibling edits and lock connected keys, removal, values and readonly retries', async () => {
  const f = fixtures[1]!;
  const schema = f.field.valueSchema!;
  if (schema.kind !== 'array' || schema.element.kind !== 'object') throw new Error('row');
  const mapping = schema.element.fields.blackboardAssignments!;
  if (mapping.kind !== 'record') throw new Error('record');
  const descriptor = resolveBlackboardMapping(mapping, 'blackboardAssignments')!;
  expect(descriptor).toEqual({ value: 'operand', destination: 'exitBuff' });
  const pin = { kind: 'valueNode', nodeId: 'shared' };
  const extension = { keep: 1 };
  const original = { linked: pin, amount: { kind: 'constant', value: 1, extension } };
  const changes: any[] = [];
  const host = await mount(
    BlackboardMappingField,
    {
      value: original,
      descriptor,
      valueSchema: mapping.value,
      preserveConnections: true,
      editable: true,
      label: 'Exit',
      onChange: (value: unknown) => changes.push(value),
    },
    f.field,
  );
  host.state.begin();
  expect(host.state.rows.value[0].value).toBe(pin);
  host.state.changeKey(0, 'moved');
  host.state.remove(0);
  host.state.changeValue(0, { kind: 'constant', value: 0 });
  expect(host.state.rows.value[0]).toMatchObject({ key: 'linked', value: pin });
  host.state.changeValue(1, { kind: 'constant', value: 3 });
  const applying = host.state.apply();
  host.state.changeKey(1, 'raced');
  await applying;
  expect(changes[0].linked).toBe(pin);
  expect(changes[0].amount).toEqual({ kind: 'constant', value: 3, extension });
  expect(host.state.error.value).toBe('applyRejected');
  expect(() =>
    validateStructuredValue(
      schema,
      [row(f, original.amount)],
      [{ ...row(f, original.amount), blackboardAssignments: changes[0] }],
      { kind: f.kind, path: f.field.path, choices },
    ),
  ).toThrow();
  const previous = [{ ...f.row, blackboardAssignments: original }];
  expect(() =>
    validateStructuredValue(schema, previous, [{ ...f.row, blackboardAssignments: changes[0] }], {
      kind: f.kind,
      path: f.field.path,
      choices,
      blackboard: context(),
    }),
  ).not.toThrow();
  await host.update({ editable: false });
  host.state.changeValue(1, 8);
  await host.state.apply();
  expect(changes).toHaveLength(1);
  host.stop();
});
it('exit Buff list and finishByAction are applied as one validated sibling transaction and remain staged after rejection', async () => {
  const f = fixtures[1]!;
  const finish = actionNodeSchemas.applyBuff.fields.find(
    field => field.path.at(-1) === 'finishByAction',
  )!;
  const value: any = { kind: 'applyBuff', parameters: { buffId: 'buff', target: 'caster' } };
  let owner: any = {
    actionGraph: { main: { nodes: { node: { action: value, next: null } } }, macros: {} },
  };
  let commits = 0;
  const host = await mount(
    NodeInspectorFields,
    {
      kind: f.kind,
      value,
      fields: [f.field, finish],
      referenceChoices: choices,
      blackboardContext: context(),
      applyValue: (next: any) => {
        try {
          owner = replaceResourceNodeAction(owner, { kind: 'main' }, 'node', next);
          commits++;
          return true;
        } catch {
          return false;
        }
      },
    },
    f.field,
  );
  host.state.stageStructured(f.field, [row(f, { kind: 'constant', value: 2 })]);
  expect(host.state.apply()).toBe(false);
  expect(host.state.hasTypedDrafts.value).toBe(true);
  expect(commits).toBe(0);
  host.state.inputs.value['parameters.finishByAction'] = 'true';
  expect(host.state.apply()).toBe(true);
  expect(commits).toBe(1);
  expect(owner.actionGraph.main.nodes.node.action.parameters).toMatchObject({
    finishByAction: true,
    onActionEndBuffs: [{ buffId: 'buff' }],
  });
  host.stop();
});
it('four-column controls expose malformed imports and support same-field repair without list resizing', async () => {
  const changes: any[] = [];
  const host = await mount(SkillSettingValuesField, {
    value: [1, 2, 3, 4],
    editable: true,
    label: 'Columns',
    onChange: (value: unknown) => changes.push(value),
  });
  host.state.change(1, undefined);
  expect(changes[0]).toEqual([1, undefined, 3, 4]);
  await host.update({ value: changes[0] });
  host.state.change(1, 9);
  expect(changes[1]).toEqual([1, 9, 3, 4]);
  await host.update({ editable: false });
  host.state.change(0, 99);
  host.state.replace();
  expect(changes).toHaveLength(2);
  host.stop();
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(SkillSettingValuesField, {
          value: [1, 'bad', Infinity, 4],
          editable: false,
          label: 'Columns',
        }),
    }).use(i18n),
  );
  expect(html).toContain('bad');
  expect(html).toContain('Infinity');
  expect(html).toContain('role="alert"');
  const f = fixtures[2]!;
  for (const values of [[], [1, 2, 3], [1, 2, 3, 4, 5], [1, 2, 3, Infinity]])
    expect(() =>
      validateStructuredValue(
        f.field.valueSchema!,
        undefined,
        [{ ...row(f, { kind: 'constant', value: 1 }), values }],
        { kind: f.kind, path: f.field.path },
      ),
    ).toThrow();
});
