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
import TimeScaleCurveField from './TimeScaleCurveField.vue';
import DefinitionField from '../definition-editor/DefinitionField.vue';
import DefinitionValueCreator from '../definition-editor/DefinitionValueCreator.vue';
import NodeInspectorFields from '../action-graph/NodeInspectorFields.vue';
import { timeScaleCurveCatalogKey } from './timeScaleCurveCatalog';
import { newTimeScaleCurveKey, type TimeScaleCurveCatalog } from './timeScaleCurveValue';
import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { DefinitionDraftSession } from '../../application/editor/definitionDraftSession';
import { updateResourceGraph } from '../../application/editor/actionGraphResourceEditing';
import { validateActionGraphStepDefinition } from '../../core/game-data/validation/actionPrograms';
import type { ActionGraphStep } from '../../../packages/game-data-contract/src/actionGraph';

const curveField = actionNodeSchemas.startTimeDilation.fields.find(
  field => field.path.at(-1) === 'curve',
)!;
const first = {
  ...newTimeScaleCurveKey([]),
  inTangent: Infinity,
  outTangent: -Infinity,
  inWeight: -2,
  outWeight: 4,
};
const inline = {
  kind: 'inline' as const,
  keys: [first, { ...newTimeScaleCurveKey([first]), value: 2 }],
};
const catalog = { first: inline.keys, second: inline.keys };
async function mount(
  component: unknown,
  initial: Record<string, unknown>,
  initialCatalog: TimeScaleCurveCatalog = catalog,
) {
  const props = shallowRef(initial);
  const choices = shallowRef(initialCatalog);
  let state: any;
  const implementation = component as ComponentOptions;
  const stub = {
    ...implementation,
    setup(p: any, context: any) {
      state = implementation.setup!(p, context);
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
  app
    .use(i18n)
    .provide(ssrContextKey, { modules: new Set() })
    .provide(
      timeScaleCurveCatalogKey,
      computed(() => choices.value),
    );
  app.mount({});
  await nextTick();
  return {
    state,
    stop: () => app.unmount(),
    async update(next: Record<string, unknown>) {
      props.value = { ...props.value, ...next };
      await nextTick();
    },
    async catalog(next: TimeScaleCurveCatalog) {
      choices.value = next;
      await nextTick();
    },
  };
}
it('edits every field without flattening infinite tangents or inactive weights; invalid order stays local', async () => {
  const changes: unknown[] = [];
  const f = await mount(TimeScaleCurveField, {
    value: inline,
    editable: true,
    label: 'Curve',
    onChange: (value: unknown) => changes.push(value),
  });
  try {
    f.state.begin();
    f.state.inputNumber(1, 'time', '0');
    await f.state.apply();
    expect(changes).toEqual([]);
    expect(f.state.error.value).toContain('strictly increasing');
    expect(f.state.keys.value.map((key: any) => key.time)).toEqual([0, 0]);
    f.state.inputNumber(1, 'time', '3');
    f.state.inputNumber(1, 'value', '0.5');
    f.state.inputNumber(0, 'inWeight', '-5');
    f.state.updateKey(0, 'weightedMode', 3);
    f.state.chooseTangent(0, 'inTangent', 'negative');
    await f.state.apply();
    expect(changes).toHaveLength(1);
    expect((changes[0] as any).keys[0]).toEqual({
      ...first,
      inTangent: -Infinity,
      weightedMode: 3,
      inWeight: -5,
    });
    expect(inline.keys[0]).toBe(first);
    expect(f.state.error.value).toBe('timeScaleCurve.rejected');
    expect(f.state.editing.value).toBe(true);
    f.state.inputNumber(1, 'value', '');
    await f.state.apply();
    expect(changes).toHaveLength(1);
    expect(f.state.rawInputs.value['1.value']).toBe('');
  } finally {
    f.stop();
  }
});
it('branch switches remain local and cancelable, use no first-item default, and reset stale branch caches', async () => {
  const changes: unknown[] = [];
  let discards = 0;
  const f = await mount(TimeScaleCurveField, {
    value: inline,
    editable: true,
    label: 'Curve',
    onChange: (value: unknown) => changes.push(value),
    onDiscard: () => discards++,
  });
  try {
    f.state.begin();
    f.state.chooseBranch('named');
    expect(f.state.namedKey.value).toBe('');
    await f.state.apply();
    expect(changes).toEqual([]);
    f.state.chooseName('first');
    f.state.chooseBranch('inline');
    expect(f.state.draft.value).toBe(inline);
    f.state.chooseBranch('named');
    expect(f.state.namedKey.value).toBe('first');
    f.state.discard();
    expect(discards).toBe(1);
    f.state.begin();
    f.state.chooseBranch('named');
    expect(f.state.namedKey.value).toBe('');
    f.state.discard();
    await f.update({ value: undefined });
    f.state.begin();
    f.state.chooseBranch('inline');
    expect(f.state.keys.value).toEqual([]);
    f.state.addKey();
    expect(f.state.keys.value).toEqual([newTimeScaleCurveKey([])]);
  } finally {
    f.stop();
  }
});
it('rechecks changed catalogs without resetting input, preserves old unknown names, and blocks new unknown selections', async () => {
  const changes: unknown[] = [];
  const f = await mount(TimeScaleCurveField, {
    value: { kind: 'named', key: 'imported' },
    editable: true,
    label: 'Curve',
    onChange: (value: unknown) => changes.push(value),
  });
  try {
    f.state.begin();
    await f.state.apply();
    expect(changes).toEqual([]);
    f.state.begin();
    f.state.chooseName('second');
    await f.catalog({ first: inline.keys });
    expect(f.state.namedKey.value).toBe('second');
    await f.state.apply();
    expect(changes).toEqual([]);
    expect(f.state.error.value).toBe('timeScaleCurve.unknownSelection');
    f.state.chooseName('first');
    await f.state.apply();
    expect(changes).toEqual([{ kind: 'named', key: 'first' }]);
  } finally {
    f.stop();
  }
});
it('accepts staged proposals without losing them on no-op reopen and blocks repeat/readonly or canceled responses', async () => {
  const proposals: unknown[] = [];
  let discards = 0;
  const f = await mount(TimeScaleCurveField, {
    value: inline,
    editable: true,
    label: 'Curve',
    onChange: (value: unknown) => proposals.push(value),
    onDiscard: () => discards++,
  });
  try {
    f.state.begin();
    f.state.inputNumber(0, 'outWeight', '7');
    const pending = f.state.apply();
    const repeated = f.state.apply();
    expect(proposals).toHaveLength(1);
    await f.update({ value: proposals[0] });
    await Promise.all([pending, repeated]);
    expect(f.state.editing.value).toBe(false);
    f.state.begin();
    await f.state.apply();
    expect(discards).toBe(0);
    expect(proposals).toHaveLength(1);
    f.state.begin();
    f.state.discard();
    expect(discards).toBe(1);
    f.state.begin();
    f.state.inputNumber(0, 'outWeight', '9');
    const refused = f.state.apply();
    f.state.discard();
    f.state.begin();
    await refused;
    expect(f.state.keys.value[0].outWeight).toBe(7);
    expect(f.state.error.value).toBe('');
    await f.update({ editable: false });
    f.state.begin();
    f.state.chooseBranch('named');
    f.state.addKey();
    await f.state.apply();
    expect(proposals).toHaveLength(2);
    expect(f.state.editing.value).toBe(false);
  } finally {
    f.stop();
  }
});
it('keeps a creator incomplete until an explicit valid curve and rechecks the current named catalog on Create', async () => {
  const created: unknown[] = [];
  const f = await mount(DefinitionValueCreator, {
    schema: curveField.valueSchema,
    editable: true,
    onCreate: (value: unknown) => created.push(value),
  });
  try {
    expect(f.state.complete.value).toBe(false);
    f.state.change([], { kind: 'named', key: 'second' });
    expect(f.state.complete.value).toBe(true);
    await f.catalog({ first: inline.keys });
    f.state.create();
    expect(created).toEqual([]);
    expect(f.state.value.value).toEqual({ kind: 'named', key: 'second' });
    f.state.change([], inline);
    f.state.create();
    expect(created).toEqual([inline]);
    await f.update({ editable: false });
    f.state.create();
    expect(created).toHaveLength(1);
  } finally {
    f.stop();
  }
});
it('stages curve and sibling values atomically through a real draft graph transaction, with domain rejection and undo/redo', async () => {
  const original: ActionGraphStep = {
    kind: 'startTimeDilation',
    parameters: {
      scope: 'global',
      slot: 'Test/Time',
      priority: 1,
      durationSeconds: { kind: 'constant', value: 1 },
      finishByAction: false,
      ignoredTargets: [],
      curve: inline,
    },
  };
  const history = new DefinitionDraftSession(
    { actionGraph: { main: { nodes: { curve: { action: original, next: null } } }, macros: {} } },
    true,
  );
  const before = history.current;
  let attempts = 0;
  const fields = actionNodeSchemas.startTimeDilation.fields;
  const f = await mount(NodeInspectorFields, {
    value: before.actionGraph.main.nodes.curve.action,
    kind: 'startTimeDilation',
    fields,
    applyValue: (value: ActionGraphStep) => {
      attempts++;
      if (validateActionGraphStepDefinition(value, 'action').length) return false;
      return history.update(owner =>
        updateResourceGraph(owner, { kind: 'main' }, graph => ({
          ...graph,
          nodes: { ...graph.nodes, curve: { ...graph.nodes.curve!, action: value } },
        })),
      );
    },
  });
  try {
    expect(f.state.inputs.value['parameters.curve']).toBe('');
    f.state.stageStructured(curveField, {
      ...inline,
      keys: [{ ...first, inTangent: -Infinity }, inline.keys[1]],
    });
    f.state.change('parameters.priority', '1.5');
    expect(attempts).toBe(0);
    expect(f.state.apply()).toBe(false);
    expect(history.current).toBe(before);
    expect(history.canUndo).toBe(false);
    expect(f.state.typedDrafts.value['parameters.curve'].keys[0].inTangent).toBe(-Infinity);
    f.state.change('parameters.priority', '2');
    expect(f.state.apply()).toBe(true);
    const committed = history.current;
    expect(
      (committed.actionGraph.main.nodes.curve.action as any).parameters.curve.keys[0].outTangent,
    ).toBe(-Infinity);
    expect((committed.actionGraph.main.nodes.curve.action as any).parameters.priority).toBe(2);
    expect(history.undo()).toBe(true);
    expect(history.current).toBe(before);
    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(true);
    expect(history.current).toBe(committed);
    await f.update({ value: committed.actionGraph.main.nodes.curve.action });
    f.state.stageStructured(curveField, { kind: 'named', key: 'second' });
    await f.catalog({ first: inline.keys });
    expect(f.state.apply()).toBe(false);
    expect(history.current).toBe(committed);
    f.state.discardStructured(curveField);
    expect(f.state.pending.value).toBe(false);
    f.state.stageStructured(curveField, { kind: 'named', key: 'first' });
    await f.update({ readonly: true });
    expect(f.state.typedDrafts.value).toEqual({});
  } finally {
    f.stop();
  }
});
it('renders the same complete labeled curve control in node, definition, creator and readonly hosts without JSON', async () => {
  for (const [component, props] of [
    [
      NodeInspectorFields,
      {
        value: { parameters: { curve: inline } },
        kind: 'startTimeDilation',
        fields: [curveField],
        readonly: true,
        applyValue: () => false,
      },
    ],
    [
      DefinitionField,
      {
        name: 'Visible curve',
        value: inline,
        path: ['curve'],
        schema: { ...curveField.valueSchema, description: 'Curve help text' },
        editable: false,
      },
    ],
    [DefinitionValueCreator, { schema: curveField.valueSchema, editable: true }],
  ] as const) {
    const html = await renderToString(
      createSSRApp({ render: () => h(component as any, props) })
        .use(i18n)
        .provide(ID_INJECTION_KEY, { prefix: 100, current: 0 })
        .provide(ZINDEX_INJECTION_KEY, { current: 0 }),
    );
    expect(html).toContain('data-time-scale-curve');
    expect(html).not.toContain('<textarea');
    if (component !== DefinitionValueCreator) {
      expect(html).toContain('Infinity');
      expect(html).toContain('data-curve-preview');
      expect(html).toContain(i18n.global.t('timeScaleCurve.outWeight'));
    }
    if (component === DefinitionField) {
      expect(html).toMatch(/<span[^>]*>Visible curve/);
      expect(html).toContain('Curve help text');
    }
  }
});

it('restores an explicitly edited finite tangent and bounds table rendering without losing distant keys', async () => {
  const keys = Array.from({ length: 30 }, (_, time) => ({ ...first, time, inTangent: time + 2 }));
  const f = await mount(TimeScaleCurveField, {
    value: { kind: 'inline', keys },
    editable: true,
    label: 'Curve',
  });
  try {
    f.state.begin();
    expect(f.state.visibleKeys.value).toHaveLength(12);
    f.state.inputNumber(0, 'inTangent', '8');
    f.state.chooseTangent(0, 'inTangent', 'positive');
    f.state.chooseTangent(0, 'inTangent', 'negative');
    f.state.chooseTangent(0, 'inTangent', 'finite');
    expect(f.state.keys.value[0].inTangent).toBe(8);
    expect(f.state.keys.value[0].outWeight).toBe(4);
    f.state.page.value = 2;
    expect(f.state.visibleKeys.value).toHaveLength(6);
    expect(f.state.visibleKeys.value[0].index).toBe(24);
    expect(f.state.keys.value[29]).toBe(keys[29]);
  } finally {
    f.stop();
  }
});

it('explicit remove then add can replace an ordinary metadata row without using array length as identity', async () => {
  const extension = { imported: true };
  const original = {
    kind: 'inline',
    keys: [
      { ...first, extension },
      { ...first, time: 1 },
    ],
  };
  const changes: unknown[] = [];
  const f = await mount(TimeScaleCurveField, {
    value: original,
    editable: true,
    label: 'Curve',
    onChange: (value: unknown) => changes.push(value),
  });
  try {
    f.state.begin();
    f.state.inputNumber(0, 'value', '3');
    expect(f.state.keys.value[0].extension).toBe(extension);
    f.state.removeKey(0);
    f.state.addKey();
    await f.state.apply();
    expect(changes).toHaveLength(1);
    expect((changes[0] as any).keys).toHaveLength(2);
    expect((changes[0] as any).keys[0]).toBe(original.keys[1]);
    expect((changes[0] as any).keys[1].extension).toBeUndefined();
  } finally {
    f.stop();
  }
});
it('large readonly previews stop before inspecting extension metadata', async () => {
  let reads = 0;
  const keys = Array.from({ length: 129 }, (_, time) =>
    Object.defineProperty({ ...first, time }, 'extension', {
      enumerable: true,
      get() {
        reads++;
        throw new Error('metadata must not be visited');
      },
    }),
  );
  const f = await mount(TimeScaleCurveField, {
    value: { kind: 'inline', keys },
    editable: false,
    label: 'Curve',
  });
  try {
    expect(f.state.preview.value.error).toBe('timeScaleCurve.previewLimit');
    expect(reads).toBe(0);
    expect(f.state.visibleKeys.value).toHaveLength(12);
  } finally {
    f.stop();
  }
});
