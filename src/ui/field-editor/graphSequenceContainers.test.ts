import { mountSetup } from '../../test/componentSetup';
import { computed, createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import { expect, it } from 'vitest';
import { i18n } from '../../i18n';
import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { graphOperandSchemas } from './graphOperandContainerSchema';
import { graphSequenceBoundaries } from './graphSequenceContainerSchema';
import { resolveFieldEditor } from './fieldEditorDispatch';
import { supportsStructuredValue } from './structuredValueSchema';
import { validateStructuredValue } from './structuredValue';
import { assertEditableValue } from '../definition-editor/definitionFieldRuntime';
import { structuredFieldContextKey } from './structuredFieldContext';
import StructuredValueField from './StructuredValueField.vue';
import ActionNodeInspector from '../action-graph/ActionNodeInspector.vue';
import NodeInspectorFields from '../action-graph/NodeInspectorFields.vue';
import { actionTypedInputs } from '../action-graph/typedGraphInputs';
import { replaceResourceNodeAction } from '../../application/editor/actionGraphResourceEditing';
import type {
  ActionGraphDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
const graph: ActionGraphDefinition = {
  nodes: { target: { action: { kind: 'finishTimeline', parameters: {} }, next: null } },
};
const fixtures = [
  {
    kind: 'switch',
    path: ['options'],
    row: (n = 1): any => ({ value: { kind: 'constant', value: n }, sequence: { $sequence: null } }),
    patch: { value: { kind: 'constant', value: 4 } },
  },
  {
    kind: 'listenForCombatEvents',
    path: ['parameters', 'responses'],
    row: (n = 1): any => ({
      key: `response${n}`,
      event: { kind: 'operatorHit' },
      sequence: { $sequence: null },
    }),
    patch: { key: 'renamed' },
  },
].map(f => ({
  ...f,
  field: actionNodeSchemas[f.kind as keyof typeof actionNodeSchemas].fields.find(
    field => field.path.join('.') === f.path.join('.'),
  )!,
}));
const action = (f: (typeof fixtures)[number], rows: unknown[]): ActionGraphStep =>
  (f.kind === 'switch'
    ? {
        kind: 'switch',
        parameters: { choice: { kind: 'constant', value: 1 }, alwaysNext: true },
        options: rows,
      }
    : { kind: f.kind, parameters: { responses: rows } }) as ActionGraphStep;
const options = (f: (typeof fixtures)[number]) => ({ kind: f.kind, path: f.path, graph });
function mount(component: unknown, initial: Record<string, unknown>, f = fixtures[0]!) {
  return mountSetup(component, initial, app => {
    app.provide(
      structuredFieldContextKey,
      computed(() => ({
        kind: f.kind,
        path: f.path,
        graph,
        graphOperands: graphOperandSchemas(f.field.valueSchema, f.kind, f.path),
        graphBoundaries: graphSequenceBoundaries(f.field.valueSchema, f.kind, f.path),
      })),
    );
  });
}
it.each(fixtures)(
  '$kind admits exact formal declarations and creates only explicit empty sequences',
  f => {
    const schema = f.field.valueSchema!;
    expect(resolveFieldEditor(f.field, { nodeKind: f.kind }).control).toBe('structuredValue');
    expect(supportsStructuredValue(schema)).toBe(false);
    expect(
      graphSequenceBoundaries({ ...schema, declaration: undefined }, f.kind, f.path),
    ).toBeUndefined();
    expect(graphSequenceBoundaries(schema, 'spawnAbilityEntity', f.path)).toBeUndefined();
    expect(() => validateStructuredValue(schema, [], [f.row()], options(f))).not.toThrow();
    expect(() => assertEditableValue(schema, [], [f.row()], 'value')).toThrow();
    for (const sequence of [
      undefined,
      {},
      { $sequence: 'target' },
      { $sequence: null, extension: true },
    ])
      expect(() =>
        validateStructuredValue(schema, [], [{ ...f.row(), sequence }], options(f)),
      ).toThrow();
  },
);
it.each(fixtures)(
  '$kind preserves connected identity/count/path and shared target while inserting and reordering rows',
  f => {
    const schema = f.field.valueSchema!,
      first = { ...f.row(), sequence: { $sequence: 'target' }, extension: { keep: true } },
      second = { ...f.row(2), sequence: { $sequence: 'target' } };
    const before = [first, second];
    expect(() =>
      validateStructuredValue(
        schema,
        before,
        [f.row(3), { ...second, ...f.patch }, first],
        options(f),
      ),
    ).not.toThrow();
    for (const next of [
      [second],
      [first, first, second],
      [{ ...first, sequence: { $sequence: 'target' } }, second],
      [
        { ...first, sequence: second.sequence },
        { ...second, sequence: first.sequence },
      ],
    ])
      expect(() => validateStructuredValue(schema, before, next, options(f))).toThrow();
    const empty = { ...f.row(), extension: 'keep' };
    expect(() =>
      validateStructuredValue(schema, [empty], [f.row(2), empty], options(f)),
    ).not.toThrow();
    expect(() => validateStructuredValue(schema, [empty], [], options(f))).not.toThrow();
    if (f.kind === 'listenForCombatEvents') {
      const a = { ...f.row(), condition: { kind: 'constant', value: true } },
        b = { ...f.row(2), condition: { kind: 'constant', value: false } };
      expect(() =>
        validateStructuredValue(schema, [a, b], [{ ...b, key: 'changed' }, a], options(f)),
      ).not.toThrow();
      expect(() => validateStructuredValue(schema, [a], [], options(f))).not.toThrow();
      const pinned = { ...a, condition: { kind: 'conditionNode', nodeId: 'boolean' } };
      expect(() => validateStructuredValue(schema, [pinned], [], options(f))).toThrow();
      expect(() =>
        validateStructuredValue(
          schema,
          [a],
          [{ ...a, condition: { kind: 'constant', value: false } }],
          options(f),
        ),
      ).toThrow();
    }
  },
);
it.each(fixtures)(
  '$kind typed Stage stays atomic, preserves rejected drafts, no-op, repeated edits and cancel',
  async f => {
    const before = [f.row()],
      staged: unknown[] = [];
    const host = await mount(
      StructuredValueField,
      {
        schema: f.field.valueSchema,
        value: before,
        editable: true,
        label: 'Rows',
        kind: f.kind,
        path: f.path,
        graph,
        onChange: (v: unknown) => staged.push(v),
      },
      f,
    );
    host.state.begin();
    await host.state.stage();
    expect(staged).toEqual([]);
    expect(host.state.editing.value).toBe(false);
    host.state.begin();
    host.state.change([0], { ...before[0], ...f.patch });
    await host.state.stage();
    expect(staged).toHaveLength(1);
    expect(host.state.error.value).toBe('structuredValue.rejected');
    host.state.change([0, 'sequence'], { $sequence: 'target' });
    await host.state.stage();
    expect(staged).toHaveLength(1);
    expect(host.state.error.value).toBeTruthy();
    host.state.discard();
    expect(host.state.editing.value).toBe(false);
    host.state.begin();
    await host.update({ editable: false });
    host.state.change([0], f.row(3));
    await host.state.stage();
    expect(staged).toHaveLength(1);
    host.stop();
  },
);
it.each(fixtures)(
  '$kind real Inspector displays mixed rows without raw editable JSON and preserves graph inputs',
  async f => {
    const row = { ...f.row(), sequence: { $sequence: 'target' } };
    if (f.kind === 'switch') row.value = { kind: 'valueNode', nodeId: 'number' };
    else row.condition = { kind: 'conditionNode', nodeId: 'boolean' };
    const current = action(f, [row]);
    const nodes = { ...graph.nodes, source: { action: current, next: null } };
    const full: ActionGraphDefinition = {
      nodes,
      dataNodes: {
        number: { type: 'number', expression: { kind: 'constant', value: 1 } },
        boolean: { type: 'boolean', expression: { kind: 'constant', value: true } },
      },
    };
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(ActionNodeInspector, {
            nodeId: 'source',
            node: nodes.source,
            graph: full,
            readonly: true,
            applyAction: () => true,
          }),
      })
        .use(i18n)
        .provide(ID_INJECTION_KEY, { prefix: 1, current: 0 })
        .provide(ZINDEX_INJECTION_KEY, { current: 0 }),
    );
    expect(html).toContain('data-structured-value');
    expect(html).not.toContain('<textarea');
    expect(html).toContain('data-graph-row-boundary');
    expect(
      actionTypedInputs(current).some(input =>
        input.path
          .join('.')
          .includes(f.kind === 'switch' ? 'options.0.value' : 'responses.0.condition'),
      ),
    ).toBe(true);
    if (f.kind === 'listenForCombatEvents')
      expect(
        actionTypedInputs(action(f, [f.row()])).some(
          input => input.path.join('.') === 'parameters.responses.0.condition',
        ),
      ).toBe(true);
  },
);
it('listener full-action Apply rejects duplicate keys and phase/priority combinations without losing typed draft', async () => {
  const f = fixtures[1]!,
    before = action(f, [f.row()]);
  let accepted: unknown;
  const owner = {
    actionGraph: {
      main: { ...graph, nodes: { ...graph.nodes, source: { action: before, next: null } } },
      macros: {},
    },
  };
  const host = await mount(
    NodeInspectorFields,
    {
      value: before,
      kind: f.kind,
      fields: [f.field],
      graph: owner.actionGraph.main,
      applyValue: (value: unknown) => {
        try {
          accepted = replaceResourceNodeAction(owner, { kind: 'main' }, 'source', value);
          return true;
        } catch {
          return false;
        }
      },
    },
    f,
  );
  host.state.stageStructured(f.field, [f.row(), f.row()]);
  expect(host.state.apply()).toBe(false);
  expect(host.state.hasTypedDrafts.value).toBe(true);
  host.state.stageStructured(f.field, [{ ...f.row(), priority: 1 }]);
  expect(host.state.apply()).toBe(false);
  host.state.stageStructured(f.field, [{ ...f.row(), phase: 'dataAction', priority: 1 }]);
  expect(host.state.apply()).toBe(true);
  expect(accepted).toBeDefined();
  host.stop();
});
it('switch Stage and ordinary sibling drafts apply together and survive rejection/cancel', async () => {
  const f = fixtures[0]!,
    before = action(f, [f.row()]);
  const accepted: unknown[] = [];
  const sibling = actionNodeSchemas.switch.fields.find(
    field => field.path.join('.') === 'parameters.alwaysNext',
  )!;
  const host = await mount(
    NodeInspectorFields,
    {
      value: before,
      kind: f.kind,
      fields: [f.field, sibling],
      graph,
      applyValue: (value: unknown) => {
        accepted.push(value);
        return true;
      },
    },
    f,
  );
  host.state.stageStructured(f.field, [f.row(2)]);
  host.state.change('parameters.alwaysNext', '"bad"');
  expect(host.state.apply()).toBe(false);
  expect(accepted).toEqual([]);
  expect(host.state.hasTypedDrafts.value).toBe(true);
  host.state.change('parameters.alwaysNext', 'false');
  expect(host.state.apply()).toBe(true);
  expect(accepted).toEqual([
    {
      kind: 'switch',
      parameters: { choice: { kind: 'constant', value: 1 }, alwaysNext: false },
      options: [f.row(2)],
    },
  ]);
  host.state.stageStructured(f.field, [f.row(3)]);
  host.state.discardStructured(f.field);
  expect(host.state.hasTypedDrafts.value).toBe(false);
  expect(accepted).toHaveLength(1);
  host.stop();
});
