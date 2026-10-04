import { all, click, event, node, renderer, text } from '../../test/componentRender';
import { compileComponentTemplates } from '../../test/componentTemplates';
import { h, nextTick, reactive, shallowRef, ssrContextKey } from 'vue';
import { beforeAll, expect, it, vi } from 'vitest';
import DefinitionField from '../definition-editor/DefinitionField.vue';
import DefinitionValueCreator from '../definition-editor/DefinitionValueCreator.vue';
import StructuredValueField from './StructuredValueField.vue';
import GraphRowBoundaryField from './GraphRowBoundaryField.vue';
import BlackboardMappingValueField from './BlackboardMappingValueField.vue';
import BlackboardKeyField from './BlackboardKeyField.vue';
import EditorHelp from '../editor/EditorHelp.vue';
import ActionGraphCanvas from '../action-graph/ActionGraphCanvas.vue';
import GraphDataInputs from '../action-graph/GraphDataInputs.vue';
import GraphNodeHeader from '../action-graph/GraphNodeHeader.vue';
import TypedDataInput from '../action-graph/TypedDataInput.vue';
import { i18n } from '../../i18n';
import { blackboardNavigationKey } from './blackboardFieldContext';
import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { DefinitionDraftSession } from '../../application/editor/definitionDraftSession';
import { replaceResourceNodeAction } from '../../application/editor/actionGraphResourceEditing';
import { createResourceEditorView } from '../editor/resourceEditorView';
import { useResourceGraphEditor } from '../action-graph/useResourceGraphEditor';
import { useSkillGraphEditor } from '../action-graph/useSkillGraphEditor';
import { perlica } from '../../data/operators/perlica.generated';
vi.mock('@/design-system', async importOriginal => {
  const original = await importOriginal<Record<string, unknown>>();
  const { createFieldPrimitives } = await import('../../test/fieldPrimitives');
  return {
    ...original,
    ...createFieldPrimitives(),
  };
});

beforeAll(() => {
  i18n.global.locale.value = 'en';
  compileComponentTemplates(
    [
      [DefinitionField, '../definition-editor/DefinitionField.vue'],
      [DefinitionValueCreator, '../definition-editor/DefinitionValueCreator.vue'],
      [StructuredValueField, './StructuredValueField.vue'],
      [GraphRowBoundaryField, './GraphRowBoundaryField.vue'],
      [BlackboardMappingValueField, './BlackboardMappingValueField.vue'],
      [BlackboardKeyField, './BlackboardKeyField.vue'],
      [EditorHelp, '../editor/EditorHelp.vue'],
      [ActionGraphCanvas, '../action-graph/ActionGraphCanvas.vue'],
      [GraphDataInputs, '../action-graph/GraphDataInputs.vue'],
      [GraphNodeHeader, '../action-graph/GraphNodeHeader.vue'],
      [TypedDataInput, '../action-graph/TypedDataInput.vue'],
    ],
    import.meta.url,
  );
});

it('switch rendered row Creator selects an operand, reports invalid draft, repairs, creates, cancels and stages', async () => {
  const field = actionNodeSchemas.switch.fields.find(f => f.path.join('.') === 'options')!;
  const value = shallowRef<unknown[]>([]),
    editable = shallowRef(true);
  let commits = 0;
  const root = node('root');
  const app = renderer.createApp({
    render: () =>
      h(StructuredValueField, {
        schema: field.valueSchema!,
        value: value.value,
        editable: editable.value,
        label: 'Rows',
        kind: 'switch',
        path: field.path,
        graph: { nodes: {} },
        onChange: (next: unknown) => {
          value.value = next as unknown[];
          commits++;
        },
      }),
  });
  app.use(i18n).provide(ssrContextKey, { modules: new Set() });
  app.mount(root);
  await nextTick();
  await click(root, i18n.global.t('structuredValue.edit'));
  await click(root, i18n.global.t('common.add'));
  let creator = all(root).find(n => String(n.props.class).includes('definition-value-creator'))!;
  expect(creator).toBeDefined();
  const select = all(creator).find(
    n =>
      n.type === 'select' &&
      String(n.props['aria-label']).includes(i18n.global.t('blackboardMapping.valueMode')),
  )!;
  select.props.onChange('constant');
  await nextTick();
  let numeric = all(creator).find(n => n.type === 'input' && n.props.type === 'number')!;
  numeric.props.onInput('');
  await nextTick();
  expect(
    all(creator).find(
      n => n.type === 'button' && text(n).trim() === i18n.global.t('definitionEditor.applyValue'),
    )?.props.disabled,
  ).toBe(true);
  numeric.props.onInput('2');
  await nextTick();
  await click(creator, i18n.global.t('definitionEditor.applyValue'));
  expect(all(root).some(n => String(n.props.class).includes('definition-value-creator'))).toBe(
    false,
  );
  await click(root, i18n.global.t('structuredValue.stage'));
  expect(commits).toBe(1);
  expect(value.value).toEqual([
    { value: { kind: 'constant', value: 2 }, sequence: { $sequence: null } },
  ]);
  await click(root, i18n.global.t('structuredValue.edit'));
  await click(root, i18n.global.t('common.add'));
  creator = all(root).find(n => String(n.props.class).includes('definition-value-creator'))!;
  await click(creator, i18n.global.t('common.cancel'));
  expect(commits).toBe(1);
  editable.value = false;
  await nextTick();
  expect(
    all(root)
      .filter(n => n.type === 'input')
      .every(n => n.props.disabled),
  ).toBe(true);
  app.unmount();
});

async function mountCanvas(hostKind: 'resource' | 'skill', listener = false, connected = false) {
  vi.stubGlobal('window', { addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('PointerEvent', class {});
  const rows = listener
    ? [
        {
          key: 'a',
          event: { kind: 'operatorHit' },
          sequence: { $sequence: connected ? 'target' : null },
        },
        { key: 'b', event: { kind: 'operatorHit' }, sequence: { $sequence: null } },
      ]
    : [
        {
          value: { kind: 'constant', value: 1 },
          sequence: { $sequence: connected ? 'target' : null },
        },
        { value: { kind: 'constant', value: 2 }, sequence: { $sequence: null } },
      ];
  const action: any = listener
    ? { kind: 'listenForCombatEvents', parameters: { responses: rows } }
    : {
        kind: 'switch',
        parameters: { choice: { kind: 'constant', value: 1 }, alwaysNext: true },
        options: rows,
      };
  const initial = {
    ...perlica.dodgeSkill!,
    actionGraph: {
      main: {
        nodes: {
          source: { action, next: null },
          target: { action: { kind: 'finishTimeline' as const, parameters: {} }, next: null },
        },
        dataNodes: {
          shared: listener
            ? { type: 'boolean' as const, expression: { kind: 'constant' as const, value: true } }
            : { type: 'number' as const, expression: { kind: 'constant' as const, value: 3 } },
        },
      },
      macros: {},
    },
    scheduledSequences: [
      { startFrame: 0, ...(listener ? { endFrame: 5 } : {}), sequence: { $sequence: 'source' } },
    ],
  };
  const history = new DefinitionDraftSession(initial, true),
    state = shallowRef(history.current),
    view = reactive(createResourceEditorView());
  view.selection = { kind: 'action', id: 'source' };
  let host: any;
  const identity = shallowRef(hostKind as string);
  const root = node('root');
  const change = (update: (v: any) => any) => {
    history.update(update);
    state.value = history.current;
  };
  const app = renderer.createApp({
    setup() {
      host =
        hostKind === 'resource'
          ? useResourceGraphEditor({
              owner: () => state.value,
              readonly: () => false,
              view: () => view,
              presentation: () => undefined,
              identity: () => identity.value,
              label: () => hostKind,
              change,
            })
          : useSkillGraphEditor({
              definition: () => state.value,
              editable: () => true,
              busy: () => false,
              view: () => view,
              presentation: () => undefined,
              identity: () => identity.value,
              label: () => hostKind,
              change,
              undo() {},
              redo() {},
            });
      return () =>
        h(ActionGraphCanvas, {
          graph: host.graph.value,
          graphScope: host.interactionScope.value,
          view: { camera: { x: 0, y: 0, zoom: 1 }, positioned: true },
          readonly: false,
          creationItems: [],
          selectedId: null,
          selectedEntryId: null,
          entryGroups: [],
          beforeInteraction: host.canLeaveFields,
          onConnect: host.connect,
          onConnectData: (
            owner: any,
            id: string,
            path: readonly string[],
            source: string | null,
            snapshot: any,
          ) => host.connectData(owner, id, path, source, undefined, snapshot),
          onConstantData: (
            owner: any,
            id: string,
            path: readonly string[],
            value: any,
            snapshot: any,
          ) => host.connectData(owner, id, path, null, value, snapshot),
          onConnectEntry: host.connectEntry,
          onDisconnectInput: host.disconnectInput,
        });
    },
  });
  app.use(i18n).provide(ssrContextKey, { modules: new Set() });
  app.mount(root);
  await nextTick();
  await nextTick();
  const pending = hostKind === 'resource' ? host.pending : host.nodePending;
  function queueReorder() {
    pending.value = true;
    host.inspector.value = {
      apply() {
        change(owner => {
          const current = owner.actionGraph.main.nodes.source.action;
          const previous = listener ? current.parameters.responses : current.options;
          return replaceResourceNodeAction(
            owner,
            { kind: 'main' },
            'source',
            listener
              ? {
                  ...current,
                  parameters: { ...current.parameters, responses: [previous[1], previous[0]] },
                }
              : { ...current, options: [previous[1], previous[0]] },
          );
        });
        pending.value = false;
        return true;
      },
    };
  }
  const pin = (key: unknown[]) => {
    const found = all(root).find(n => n.props['data-graph-pin'] === JSON.stringify(key));
    expect(found, JSON.stringify(key)).toBeDefined();
    return found!;
  };
  return {
    host,
    identity,
    change,
    history,
    state,
    root,
    queueReorder,
    pin,
    stop() {
      app.unmount();
      vi.unstubAllGlobals();
    },
    sequence: () =>
      listener
        ? history.current.actionGraph.main.nodes.source.action.parameters.responses
        : history.current.actionGraph.main.nodes.source.action.options,
  };
}
for (const hostKind of ['resource', 'skill'] as const)
  for (const listener of [false, true]) {
    const path = listener
      ? ['action', 'parameters', 'responses', '0', 'sequence', '$sequence']
      : ['action', 'options', '0', 'sequence', '$sequence'];
    it(`${hostKind} ${listener ? 'listener' : 'switch'} rendered canvas rejects preflush indexed execution and data events, then accepts refreshed pins`, async () => {
      const scene = await mountCanvas(hostKind, listener);
      try {
        const output = scene.pin(['action', 'source', path]),
          target = scene.pin(['input', 'target']);
        scene.queueReorder();
        output.props.onClick(event());
        target.props.onClick(event());
        await nextTick();
        expect(scene.host.error.value).toBeTruthy();
        expect(scene.sequence().every((row: any) => row.sequence.$sequence === null)).toBe(true);
        expect(scene.history.undo()).toBe(true);
        expect(scene.history.undo()).toBe(false);
        scene.history.redo();
        scene.state.value = scene.history.current;
        await nextTick();
        scene.pin(['action', 'source', path]).props.onClick(event());
        scene.pin(['input', 'target']).props.onClick(event());
        await nextTick();
        expect(scene.sequence()[0].sequence.$sequence).toBe('target');
        const dataPath = listener
          ? ['parameters', 'responses', '0', 'condition']
          : ['options', '0', 'value'];
        const input = scene.pin(['data-input', 'action', 'source', dataPath]),
          data = scene.pin(['data-output', 'shared']);
        scene.queueReorder();
        input.props.onClick(event());
        data.props.onClick(event());
        await nextTick();
        expect(scene.host.error.value).toBeTruthy();
        expect(
          listener ? scene.sequence()[0].condition : scene.sequence()[0].value,
        ).not.toMatchObject({ nodeId: 'shared' });
        scene.pin(['data-input', 'action', 'source', dataPath]).props.onClick(event());
        scene.pin(['data-output', 'shared']).props.onClick(event());
        await nextTick();
        expect(listener ? scene.sequence()[0].condition : scene.sequence()[0].value).toMatchObject({
          nodeId: 'shared',
        });
      } finally {
        scene.stop();
      }
    });
    it(`${hostKind} ${listener ? 'listener' : 'switch'} canvas Alt-disconnect and selected-wire Delete retain the old source snapshot`, async () => {
      const scene = await mountCanvas(hostKind, listener, true);
      try {
        const output = scene.pin(['action', 'source', path]);
        scene.queueReorder();
        output.props.onPointerdown(event({ altKey: true }));
        await nextTick();
        expect(scene.host.error.value).toBeTruthy();
        expect(scene.sequence()[1].sequence.$sequence).toBe('target');
        // Select the old wire, then let a later field flush rebind the same indexed path.
        const wire = all(scene.root).find(n => n.type === 'path' && n.props.onClick)!;
        expect(wire).toBeDefined();
        wire.props.onClick(event());
        await nextTick();
        scene.queueReorder();
        const viewport = all(scene.root).find(n => n.props['aria-label'] === '动作图画布')!;
        viewport.props.onKeydown(event({ key: 'Delete', target: viewport }));
        await nextTick();
        expect(scene.host.error.value).toBeTruthy();
        expect(scene.sequence()[0].sequence.$sequence).toBe('target');
        scene.pin(['action', 'source', path]).props.onContextmenu(event());
        await nextTick();
        scene.queueReorder();
        await click(scene.root, '断开连线');
        expect(scene.host.error.value).toBeTruthy();
        expect(scene.sequence()[1].sequence.$sequence).toBe('target');
      } finally {
        scene.stop();
      }
    });
  }
it('listener rendered Creator adds metadata with no condition and existing condition navigation stays graph-owned', async () => {
  const field = actionNodeSchemas.listenForCombatEvents.fields.find(
    f => f.path.join('.') === 'parameters.responses',
  )!;
  const value = shallowRef<any[]>([]),
    located: unknown[] = [];
  const root = node('root');
  const app = renderer.createApp({
    render: () =>
      h(StructuredValueField, {
        schema: field.valueSchema!,
        value: value.value,
        editable: true,
        label: 'Responses',
        kind: 'listenForCombatEvents',
        path: field.path,
        graph: {
          nodes: {},
          dataNodes: {
            condition: { type: 'boolean', expression: { kind: 'constant', value: true } },
          },
        },
        onChange: (next: unknown) => (value.value = next as any[]),
      }),
  });
  app
    .use(i18n)
    .provide(ssrContextKey, { modules: new Set() })
    .provide(blackboardNavigationKey, target => located.push(target));
  app.mount(root);
  await nextTick();
  await click(root, i18n.global.t('structuredValue.edit'));
  await click(root, i18n.global.t('common.add'));
  const creator = all(root).find(n => String(n.props.class).includes('definition-value-creator'))!;
  const key = all(creator).find(n => n.type === 'input')!;
  expect(key).toBeDefined();
  key.props.onChange('new');
  await nextTick();
  const kind = all(creator).find(n => n.type === 'select' && n.props.options?.length > 4)!;
  expect(kind).toBeDefined();
  kind.props.onChange(1);
  await nextTick();
  await click(creator, i18n.global.t('definitionEditor.applyValue'));
  await click(root, i18n.global.t('structuredValue.stage'));
  expect(value.value).toEqual([
    { key: 'new', event: { kind: 'operatorHit' }, sequence: { $sequence: null } },
  ]);
  value.value = [{ ...value.value[0], condition: { kind: 'conditionNode', nodeId: 'condition' } }];
  await nextTick();
  await click(root, 'condition ↗');
  expect(located).toEqual([{ owner: 'data', id: 'condition' }]);
  expect(
    all(root)
      .filter(n => n.type === 'input')
      .every(n => n.props.disabled),
  ).toBe(true);
  app.unmount();
});
it.each(['resource', 'skill'] as const)(
  '%s canvas rejects old callbacks after target replacement and a same-name graph switch',
  async hostKind => {
    const scene = await mountCanvas(hostKind);
    try {
      const path = ['action', 'options', '0', 'sequence', '$sequence'];
      const output = scene.pin(['action', 'source', path]),
        target = scene.pin(['input', 'target']);
      scene.change(owner => ({
        ...owner,
        actionGraph: {
          ...owner.actionGraph,
          main: {
            ...owner.actionGraph.main,
            nodes: {
              ...owner.actionGraph.main.nodes,
              target: { ...owner.actionGraph.main.nodes.target },
            },
          },
        },
      }));
      output.props.onClick(event());
      target.props.onClick(event());
      await nextTick();
      expect(scene.host.error.value).toBeTruthy();
      expect(scene.sequence()[0].sequence.$sequence).toBeNull();
      const freshOutput = scene.pin(['action', 'source', path]).props.onClick,
        freshTarget = scene.pin(['input', 'target']).props.onClick;
      const inner = scene.history.current.actionGraph.main;
      scene.change(owner => ({
        ...owner,
        actionGraph: {
          ...owner.actionGraph,
          main: { ...inner, nodes: { ...inner.nodes } },
          macros: { m: { parameters: [], entry: { $sequence: 'source' }, graph: inner } },
        },
      }));
      scene.host.changeGraph({ kind: 'macro', macroId: 'm' });
      await nextTick();
      freshOutput(event());
      freshTarget(event());
      await nextTick();
      // The macro may share this immutable graph object with the previously rendered main.
      // Switching graph namespaces must also invalidate callbacks even in that case.
      expect(scene.host.error.value).toBeTruthy();
      const sameGraphOutput = scene.pin(['action', 'source', path]).props.onClick,
        sameGraphTarget = scene.pin(['input', 'target']).props.onClick;
      scene.identity.value = 'another-resource';
      await nextTick();
      sameGraphOutput(event());
      sameGraphTarget(event());
      await nextTick();
      expect(scene.host.error.value).toBeTruthy();
    } finally {
      scene.stop();
    }
  },
);
it.each(['resource', 'skill'] as const)(
  '%s pointer drag preflush rejects the captured indexed port',
  async hostKind => {
    const scene = await mountCanvas(hostKind);
    try {
      const output = scene.pin([
          'action',
          'source',
          ['action', 'options', '0', 'sequence', '$sequence'],
        ]),
        target = scene.pin(['input', 'target']);
      const viewport = all(scene.root).find(n => n.props['aria-label'] === '动作图画布')!;
      vi.stubGlobal('document', { elementFromPoint: () => target });
      scene.queueReorder();
      output.props.onPointerdown(event());
      viewport.props.onPointermove(event({ clientX: 10 }));
      viewport.props.onPointerup(event({ clientX: 10 }));
      await nextTick();
      expect(scene.host.error.value || text(scene.root)).toContain(
        i18n.global.t('graphDataInput.ownerChanged'),
      );
      expect(scene.sequence().every((row: any) => row.sequence.$sequence === null)).toBe(true);
    } finally {
      scene.stop();
    }
  },
);
