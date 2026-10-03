import {
  computed,
  createRenderer,
  createSSRApp,
  h,
  nextTick,
  shallowRef,
  ssrContextKey,
  type ComponentOptions,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import { expect, it } from 'vitest';
import { i18n } from '../../i18n';
import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { graphOperandSchemas } from './graphOperandContainerSchema';
import { supportsStructuredValue } from './structuredValueSchema';
import { resolveFieldEditor } from './fieldEditorDispatch';
import { validateStructuredValue } from './structuredValue';
import {
  assertEditableValue,
  assertEditableDefinitionField,
} from '../definition-editor/definitionFieldRuntime';
import { analyzeGraphBlackboard } from '../../application/editor/graphBlackboard';
import { createBlackboardFieldContext } from '../../application/editor/blackboardFieldContext';
import { blackboardFieldContextKey } from './blackboardFieldContext';
import { structuredFieldContextKey } from './structuredFieldContext';
import StructuredValueField from './StructuredValueField.vue';
import DefinitionField from '../definition-editor/DefinitionField.vue';
import DefinitionValueCreator from '../definition-editor/DefinitionValueCreator.vue';
import ActionNodeInspector from '../action-graph/ActionNodeInspector.vue';
import NodeInspectorFields from '../action-graph/NodeInspectorFields.vue';

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
].map(fixture => ({
  ...fixture,
  field: actionNodeSchemas.dealDamage.fields.find(field => field.path.at(-1) === fixture.name)!,
}));
const context = (parameters: readonly string[] = []) =>
  createBlackboardFieldContext(
    analyzeGraphBlackboard({ nodes: {} }, [], parameters, { rate: 2, text: 'value' }),
    new Set(['current']),
  );

async function mount(
  component: unknown,
  initial: Record<string, unknown>,
  field = fixtures[0]!.field,
  parameters: readonly string[] = [],
) {
  let state: any;
  const props = shallowRef(initial);
  const implementation = component as ComponentOptions;
  const stub = {
    ...implementation,
    setup(p: any, ctx: any) {
      state = implementation.setup!(p, ctx);
      return state;
    },
    render: () => null,
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
  }).createApp({ render: () => h(stub, props.value) });
  app.use(i18n).provide(ssrContextKey, { modules: new Set() });
  app.provide(
    blackboardFieldContextKey,
    computed(() => context(parameters)),
  );
  app.provide(
    structuredFieldContextKey,
    computed(() => ({
      kind: 'dealDamage',
      path: field.path,
      graphOperands: graphOperandSchemas(field.valueSchema, 'dealDamage', field.path),
    })),
  );
  app.mount({});
  await nextTick();
  return {
    state,
    stop: () => app.unmount(),
    async update(value: Record<string, unknown>) {
      props.value = { ...props.value, ...value };
      await nextTick();
    },
  };
}

it.each(fixtures)(
  '$name admits only the formal graph container, preserving contextless operand boundaries',
  fixture => {
    const { field } = fixture;
    const schema = field.valueSchema!;
    const allowed = graphOperandSchemas(schema, 'dealDamage', field.path);
    expect(allowed?.size).toBe(1);
    expect(resolveFieldEditor(field, { nodeKind: 'dealDamage' })).toMatchObject({
      control: 'structuredValue',
      edit: 'recursive',
    });
    expect(supportsStructuredValue(schema)).toBe(false);
    expect(supportsStructuredValue(schema, fixture.name, schema.references, allowed)).toBe(true);
    for (const kind of [undefined, 'applyBuff', 'createGlobalBuff'])
      expect(graphOperandSchemas(schema, kind, field.path)).toBeUndefined();
    expect(
      graphOperandSchemas(
        { ...schema, source: ['custom/actions.ts:1:1'] },
        'dealDamage',
        field.path,
      ),
    ).toBeUndefined();
    expect(graphOperandSchemas(schema, 'dealDamage', ['other', fixture.name])).toBeUndefined();
    const operand = [...allowed!][0]!;
    expect(() =>
      assertEditableValue(operand, undefined, { kind: 'constant', value: 1 }, 'value'),
    ).toThrow(/graph input/);
    expect(() =>
      assertEditableDefinitionField(
        { kind: 'object', fields: { value: operand } },
        { value: { kind: 'constant', value: 1 } },
        ['value', 'value'],
        2,
        'value',
      ),
    ).toThrow(/graph input/);
  },
);

it.each(fixtures)(
  '$name creates numeric reads and scoped parameters, rejects invalid drafts and rechecks source context',
  fixture => {
    const schema = fixture.field.valueSchema!;
    const options = {
      kind: 'dealDamage',
      path: fixture.field.path,
      blackboard: context(['argument']),
    };
    for (const value of [
      { kind: 'constant', value: 2 },
      { kind: 'blackboard', key: 'rate' },
      { kind: 'blackboard', key: 'external', fallback: 1 },
      { kind: 'parameter', parameter: 'argument' },
    ]) {
      expect(() =>
        validateStructuredValue(
          schema,
          undefined,
          [{ ...fixture.row, [fixture.key]: value }],
          options,
        ),
      ).not.toThrow();
    }
    for (const value of [
      { kind: 'constant', value: '' },
      { kind: 'constant', value: Infinity },
      { kind: 'parameter', parameter: 'missing' },
      { kind: 'blackboard', key: 'text' },
      { kind: 'valueNode', nodeId: 'raw' },
      3,
      [1, 2],
    ]) {
      expect(() =>
        validateStructuredValue(
          schema,
          undefined,
          [{ ...fixture.row, [fixture.key]: value }],
          options,
        ),
      ).toThrow();
    }
    const value = [{ ...fixture.row, [fixture.key]: { kind: 'parameter', parameter: 'argument' } }];
    expect(() =>
      validateStructuredValue(schema, value, [{ ...value[0], ...fixture.patch }], {
        ...options,
        blackboard: context(),
      }),
    ).toThrow();
    const invalid = [{ ...fixture.row, [fixture.key]: { kind: 'futureOperand', extra: 1 } }];
    expect(() =>
      validateStructuredValue(schema, invalid, [{ ...invalid[0], ...fixture.patch }], options),
    ).toThrow();
  },
);

it.each(fixtures)(
  '$name preserves connected rows, reference identity/count and unknown extensions',
  fixture => {
    const pin = { kind: 'valueNode', nodeId: 'shared' },
      secondPin = { kind: 'valueNode', nodeId: 'shared' };
    const extension = { keep: true };
    const first = { ...fixture.row, [fixture.key]: pin, extension };
    const second = { ...fixture.row, [fixture.key]: secondPin };
    const options = { kind: 'dealDamage', path: fixture.field.path, blackboard: context() };
    const validate = (next: unknown) =>
      validateStructuredValue(fixture.field.valueSchema!, [first, second], next, options);
    expect(() => validate([second, { ...first, ...fixture.patch }])).not.toThrow();
    for (const next of [
      [first],
      [first, first],
      [{ ...first, [fixture.key]: { ...pin } }, second],
      [{ ...first, [fixture.key]: { kind: 'constant', value: 0 } }, second],
      undefined,
    ])
      expect(() => validate(next)).toThrow();
    expect(() => validate([{ ...fixture.row, [fixture.key]: pin }, second])).toThrow(/preserved/);
  },
);

it.each(fixtures)(
  '$name exposes generated existing expression containers and readonly connected controls without nodeId inputs',
  async fixture => {
    const value = [{ ...fixture.row, [fixture.key]: { kind: 'valueNode', nodeId: 'shared' } }];
    const action = {
      kind: 'dealDamage',
      parameters: { damageType: 'physical', attackScale: 1, tags: [], [fixture.name]: value },
    };
    const inspector = await mount(
      ActionNodeInspector,
      { nodeId: 'damage', node: { action, next: null }, applyAction: () => true },
      fixture.field,
    );
    try {
      expect(inspector.state.fields.value.map((field: any) => field.path.join('.'))).toContain(
        fixture.field.path.join('.'),
      );
    } finally {
      inspector.stop();
    }
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(StructuredValueField, {
            schema: fixture.field.valueSchema!,
            value,
            editable: false,
            label: fixture.name,
            kind: 'dealDamage',
            path: fixture.field.path,
          }),
      })
        .use(i18n)
        .provide(ID_INJECTION_KEY, { prefix: 1, current: 0 })
        .provide(ZINDEX_INJECTION_KEY, { current: 0 }),
    );
    expect(html).toContain('data-structured-value');
    expect(html).toContain('shared');
    expect(html).not.toContain('textarea');
    expect(html).not.toContain('aria-label="nodeId"');
  },
);

it.each(fixtures)(
  '$name creator uses inherited graph scope while connected operand events and branch extension loss are guarded',
  async fixture => {
    const schema = fixture.field.valueSchema!;
    if (schema.kind !== 'array') throw new Error('expected array');
    const creator = await mount(
      DefinitionValueCreator,
      { schema: schema.element, editable: true, editingContext: 'value' },
      fixture.field,
      ['argument'],
    );
    try {
      creator.state.change([], {
        ...fixture.row,
        [fixture.key]: { kind: 'parameter', parameter: 'argument' },
      });
      expect(creator.state.complete.value).toBe(true);
      creator.state.change([fixture.key], { kind: 'parameter', parameter: 'missing' });
      expect(creator.state.complete.value).toBe(false);
      creator.state.change([fixture.key], { kind: 'valueNode', nodeId: 'shared' });
      expect(creator.state.complete.value).toBe(false);
      creator.state.change([fixture.key], { kind: 'constant', value: '' });
      expect(creator.state.complete.value).toBe(false);
    } finally {
      creator.stop();
    }
    const operand = [...graphOperandSchemas(schema, 'dealDamage', fixture.field.path)!][0]!;
    const changes: unknown[] = [],
      extension = { imported: true };
    const field = await mount(
      DefinitionField,
      {
        schema: operand,
        name: fixture.key,
        path: [0, fixture.key],
        value: { kind: 'constant', value: 1, extension },
        editable: true,
        editingContext: 'value',
        onChange: (_path: unknown, value: unknown) => changes.push(value),
      },
      fixture.field,
    );
    try {
      field.state.changeGraphOperand({ kind: 'blackboard', key: 'rate' });
      expect(changes).toEqual([{ kind: 'blackboard', key: 'rate', extension }]);
      await field.update({ value: { kind: 'valueNode', nodeId: 'shared' } });
      field.state.changeGraphOperand({ kind: 'constant', value: 0 });
      expect(changes).toHaveLength(1);
      await field.update({ value: { kind: 'constant', value: 1 }, editable: false });
      field.state.changeGraphOperand({ kind: 'constant', value: 2 });
      expect(changes).toHaveLength(1);
    } finally {
      field.stop();
    }
  },
);

it.each(fixtures)(
  '$name stages whole containers repeatedly, retaining prior accepted drafts on no-op and cancelling rejected/readonly edits',
  async fixture => {
    const row = { ...fixture.row, [fixture.key]: { kind: 'constant', value: 1 } };
    let value = [row];
    const changes: unknown[] = [];
    const child = await mount(
      StructuredValueField,
      {
        schema: fixture.field.valueSchema,
        value,
        editable: true,
        kind: 'dealDamage',
        path: fixture.field.path,
        label: fixture.name,
        onChange: (next: unknown) => changes.push(next),
      },
      fixture.field,
    );
    try {
      child.state.begin();
      child.state.change([0, fixture.key], { kind: 'constant', value: '' });
      await child.state.stage();
      expect(changes).toEqual([]);
      expect(child.state.editing.value).toBe(true);
      child.state.change([0, fixture.key], { kind: 'constant', value: 2 });
      await child.state.stage();
      expect(changes).toHaveLength(1);
      expect(child.state.error.value).toBe('structuredValue.rejected');
      await child.update({ value: changes[0] });
      expect(child.state.editing.value).toBe(false);
      child.state.begin();
      await child.state.stage();
      expect(changes).toHaveLength(1);
      child.state.begin();
      child.state.change([0, fixture.key], { kind: 'constant', value: 3 });
      child.state.discard();
      child.state.begin();
      expect(child.state.draft.value).toBe(changes[0]);
      await child.update({ editable: false });
      await child.state.stage();
      expect(changes).toHaveLength(1);
    } finally {
      child.stop();
    }
    const action = {
      kind: 'dealDamage',
      parameters: { damageType: 'physical', attackScale: 1, tags: [], [fixture.name]: value },
    };
    const proposals: unknown[] = [];
    const panel = await mount(
      NodeInspectorFields,
      {
        kind: 'dealDamage',
        value: action,
        fields: [fixture.field],
        blackboardContext: context(),
        applyValue: (next: unknown) => {
          proposals.push(next);
          return true;
        },
      },
      fixture.field,
    );
    try {
      panel.state.stageStructured(fixture.field, [{ ...row, ...fixture.patch }]);
      expect(proposals).toEqual([]);
      panel.state.stageStructured(fixture.field, [{ ...row, ...fixture.patch }]);
      expect(panel.state.apply()).toBe(true);
      expect(proposals).toHaveLength(1);
      await panel.update({ readonly: true });
      panel.state.stageStructured(fixture.field, []);
      expect(panel.state.apply()).toBe(true);
      expect(proposals).toHaveLength(1);
    } finally {
      panel.stop();
    }
  },
);
