import { all, click, node, renderer, text } from '../../test/componentRender';
import { compileComponentTemplates } from '../../test/componentTemplates';
import { defineComponent, h, nextTick, shallowRef, ssrContextKey, toRaw } from 'vue';
import { beforeAll, expect, it, vi } from 'vitest';
import * as Vue from 'vue';
import DefinitionField from '../definition-editor/DefinitionField.vue';
import DefinitionValueCreator from '../definition-editor/DefinitionValueCreator.vue';
import StructuredValueField from './StructuredValueField.vue';
import OwnedSpawnResourceField from './OwnedSpawnResourceField.vue';
import BlackboardKeyField from './BlackboardKeyField.vue';
import StringCollectionField from './StringCollectionField.vue';
import GameplayTagField from './GameplayTagField.vue';
import EditorHelp from '../editor/EditorHelp.vue';
import { i18n } from '../../i18n';
import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { structuredFieldContextKey } from './structuredFieldContext';
import { spawnDefinitionResources } from './spawnDefinitionSchema';
import { ownedResourceNavigationKey } from './ownedResourceNavigation';
import { ownedActionResourceLink } from '../asset-workspace/ownedActionResourceNavigation';
import { WorkspaceAssetSession } from '../asset-workspace/workspaceSession';
import { WorkspaceNavigation } from '../asset-workspace/workspaceNavigation';
import { createWorkspaceDocumentViews, resourceView } from '../asset-workspace/workspaceViews';
import { useWorkspaceGraphEditor } from '../asset-workspace/useWorkspaceGraphEditor';
import { listDefinitionResources } from '../definition-editor/definitionResources';
import { fieldValueAt } from '../definition-editor/definitionFieldRuntime';
import {
  replaceResourceNodeAction,
  type ActionGraphResourceOwner,
} from '../../application/editor/actionGraphResourceEditing';
import { arclight } from '../../data/operators/arclight.generated';
vi.mock('@/design-system', async importOriginal => {
  const original = await importOriginal<Record<string, unknown>>();
  const { createFieldPrimitives } = await import('../../test/fieldPrimitives');
  return {
    ...original,
    ...createFieldPrimitives(),
    EaNumberInput: defineComponent({
      props: ['modelValue', 'disabled'],
      emits: ['update:modelValue'],
      setup:
        (p, { attrs, emit }) =>
        () =>
          h('input', {
            ...attrs,
            type: 'number',
            disabled: p.disabled,
            value: p.modelValue,
            onInput: (value: number | undefined) => emit('update:modelValue', value),
          }),
    }),
  };
});

beforeAll(() => {
  i18n.global.locale.value = 'en';
  vi.stubGlobal('PointerEvent', class {});
  vi.stubGlobal('window', { addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  compileComponentTemplates(
    [
      [DefinitionField, '../definition-editor/DefinitionField.vue'],
      [DefinitionValueCreator, '../definition-editor/DefinitionValueCreator.vue'],
      [StructuredValueField, './StructuredValueField.vue'],
      [OwnedSpawnResourceField, './OwnedSpawnResourceField.vue'],
      [BlackboardKeyField, './BlackboardKeyField.vue'],
      [EditorHelp, '../editor/EditorHelp.vue'],
      [StringCollectionField, './StringCollectionField.vue'],
      [GameplayTagField, './GameplayTagField.vue'],
    ],
    import.meta.url,
  );
});

const field = actionNodeSchemas.spawnAbilityEntity.fields.find(
  field => field.path.at(-1) === 'definition',
)!;
const entity = Object.values(arclight.abilityEntityDefinitions!)[0]!;
it('rendered field opens an existing independent child graph, shares editor history/layout and returns through workspace navigation', async () => {
  const spawn: any = {
    kind: 'spawnAbilityEntity',
    parameters: { abilityEntityId: 'inline', dieWhenSourceDies: false, definition: entity },
  };
  const session = new WorkspaceAssetSession(
    {
      id: 'operator:arclight',
      kind: 'operator',
      kindName: 'operator',
      name: 'Arclight',
      custom: false,
      edit: {
        kind: 'operator',
        definition: {
          ...arclight,
          dodgeSkill: {
            ...arclight.dodgeSkill!,
            actionGraph: { main: { nodes: { spawn: { action: spawn, next: null } } }, macros: {} },
            scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'spawn' } }],
          },
        },
      },
    },
    'project:operator:field-jump',
  );
  const revision = shallowRef(0),
    path = shallowRef<readonly (string | number)[]>(['dodgeSkill']);
  const views = createWorkspaceDocumentViews(),
    navigation = new WorkspaceNavigation();
  const record = () =>
    navigation.record({
      document: 'asset',
      resource: JSON.stringify(path.value),
      page: 'graph',
      graphOpen: true,
    });
  record();
  const owner = () => {
    void revision.value;
    return fieldValueAt(session.current.edit.definition, path.value) as ActionGraphResourceOwner;
  };
  let editor!: ReturnType<typeof useWorkspaceGraphEditor>;
  const root = node('root');
  const app = renderer.createApp({
    setup() {
      editor = useWorkspaceGraphEditor({
        session: () => {
          void revision.value;
          return session;
        },
        view: () => resourceView(views, JSON.stringify(path.value)),
        identity: () => JSON.stringify(path.value),
        label: () => 'resource',
        path: () => path.value,
        owner,
        skill: () => undefined,
        busy: () => false,
        changed: () => {
          revision.value++;
        },
        undo: () => {
          session.history.undo();
          revision.value++;
        },
        redo: () => {
          session.history.redo();
          revision.value++;
        },
      });
      Vue.provide(ownedResourceNavigationKey, (relative, resource) =>
        ownedActionResourceLink(
          {
            identity: () => JSON.stringify(path.value),
            scope: () => editor.resource.interactionScope,
            ownerPath: () => path.value,
            address: () => editor.resource.address,
            graph: () => editor.resource.graph,
            definition: () => session.current.edit.definition,
            hasResource: p =>
              listDefinitionResources(
                'operator',
                session.current.edit.definition as typeof arclight,
              ).some(r => JSON.stringify(r.path) === JSON.stringify(p)),
            flush: () => editor.canLeaveFields(),
            open: p => {
              path.value = p;
              record();
            },
          },
          {
            nodeId: 'spawn',
            graph: toRaw(editor.resource.graph),
            scope: editor.resource.interactionScope,
            path: relative,
            resource: toRaw(resource),
          },
        ),
      );
      return () =>
        path.value.length === 1
          ? h(StructuredValueField, {
              schema: field.valueSchema!,
              value: (editor.resource.graph.nodes.spawn!.action as any).parameters.definition,
              actionValue: editor.resource.graph.nodes.spawn!.action,
              kind: 'spawnAbilityEntity',
              path: field.path,
              editable: true,
              label: 'definition',
              onChange: next => {
                editor.resource.edit(current =>
                  replaceResourceNodeAction(current, { kind: 'main' }, 'spawn', {
                    ...spawn,
                    parameters: { ...spawn.parameters, definition: next },
                  }),
                );
              },
            })
          : h(
              'button',
              {
                onClick: () => {
                  const previous = navigation.travel(-1);
                  if (previous) path.value = JSON.parse(previous.resource);
                },
              },
              'Back',
            );
    },
  });
  app.use(i18n).provide(ssrContextKey, { modules: new Set() });
  app.mount(root);
  await nextTick();
  expect(text(root)).toContain(entity.childSkill!.skillId);
  await click(root, i18n.global.t('structuredValue.edit'));
  const open = all(root).find(
    n => n.type === 'button' && text(n).trim() === i18n.global.t('definitionEditor.openGraph'),
  )!;
  expect(open.props.disabled).toBe(true);
  open.props.onClick();
  await nextTick();
  expect(path.value).toEqual(['dodgeSkill']);
  expect(text(root)).toContain('Stage or cancel');
  await click(root, i18n.global.t('common.cancel'));
  await click(root, i18n.global.t('definitionEditor.openGraph'));
  expect(path.value.at(-1)).toBe('childSkill');
  expect(navigation.canBack).toBe(true);
  const childOwner = owner(),
    id = Object.keys(childOwner.actionGraph.main.nodes)[0]!,
    original = childOwner.actionGraph.main.nodes[id]!;
  expect(
    editor.resource.edit(current =>
      replaceResourceNodeAction(current, { kind: 'main' }, id, {
        ...original.action,
        key: 'edited-through-child',
      }),
    ),
  ).toBe(true);
  expect(editor.resource.graph.nodes[id]!.action.key).toBe('edited-through-child');
  editor.resource.changePresentation(
    { nodePositions: { [id]: { x: 42, y: 18 } }, entryPositions: {} },
    true,
  );
  expect(Object.values(session.current.graphPresentations)[0]!.main!.nodePositions[id]).toEqual({
    x: 42,
    y: 18,
  });
  expect(session.history.undo()).toBe(true);
  revision.value++;
  expect(session.history.undo()).toBe(true);
  revision.value++;
  await nextTick();
  expect(editor.resource.graph.nodes[id]!.action.key).toBe(original.action.key);
  session.history.redo();
  session.history.redo();
  revision.value++;
  await nextTick();
  await click(root, 'Back');
  expect(path.value).toEqual(['dodgeSkill']);
  expect(
    (editor.resource.graph.nodes.spawn!.action as any).parameters.definition.childSkill.actionGraph
      .main.nodes[id].action.key,
  ).toBe('edited-through-child');
  expect(all(root).some(n => n.type === 'textarea')).toBe(false);
  app.unmount();
});
it('rendered ordinary fields repair invalid template keys in place, stage, cancel and remain readonly without an editable JSON fallback', async () => {
  const value = shallowRef<any>({
      lifetime: { kind: 'limited', durationSeconds: { blackboardKey: 'duration', fallback: 5 } },
      deathReleaseDelaySeconds: 1,
    }),
    editable = shallowRef(true);
  let commits = 0;
  const root = node('root');
  const app = renderer.createApp({
    render: () =>
      h(StructuredValueField, {
        schema: field.valueSchema!,
        value: value.value,
        actionValue: {
          kind: 'spawnAbilityEntity',
          parameters: {
            definition: value.value,
            stringBlackboardAssignments: { duration: 'text' },
          },
        },
        kind: 'spawnAbilityEntity',
        path: field.path,
        editable: editable.value,
        label: 'definition',
        onChange: next => {
          value.value = next;
          commits++;
        },
      }),
  });
  app.use(i18n).provide(ssrContextKey, { modules: new Set() });
  app.mount(root);
  await nextTick();
  await click(root, i18n.global.t('structuredValue.edit'));
  const key = all(root).find(n => n.type === 'input' && n.props.value === 'duration')!;
  expect(key).toBeDefined();
  key.props.onInput('');
  await nextTick();
  await click(root, i18n.global.t('structuredValue.stage'));
  expect(commits).toBe(0);
  expect(all(root).some(n => n.props.role === 'alert')).toBe(true);
  expect(all(root)).toContain(key);
  key.props.onInput('external');
  key.props.onChange('external');
  await nextTick();
  await click(root, i18n.global.t('structuredValue.stage'));
  expect(commits).toBe(1);
  expect(value.value.lifetime.durationSeconds.blackboardKey).toBe('external');
  await click(root, i18n.global.t('structuredValue.edit'));
  await click(root, i18n.global.t('common.cancel'));
  expect(commits).toBe(1);
  editable.value = false;
  await nextTick();
  expect(
    all(root)
      .filter(n => n.type === 'input')
      .every(n => n.props.disabled),
  ).toBe(true);
  expect(all(root).some(n => n.type === 'textarea')).toBe(false);
  app.unmount();
});
it('rendered containing Creator creates ordinary spawn values and cancels incomplete alternatives', async () => {
  const created: unknown[] = [];
  let cancelled = 0;
  const root = node('root');
  const app = renderer.createApp({
    render: () =>
      h(DefinitionValueCreator, {
        schema: { ...field.valueSchema!, optional: false },
        editingContext: 'value',
        editable: true,
        onCreate: value => created.push(value),
        onCancel: () => cancelled++,
      }),
  });
  app
    .use(i18n)
    .provide(ssrContextKey, { modules: new Set() })
    .provide(
      structuredFieldContextKey,
      Vue.computed(() => ({
        kind: 'spawnAbilityEntity',
        path: field.path,
        ownedResources: spawnDefinitionResources(
          field.valueSchema,
          'spawnAbilityEntity',
          field.path,
        ),
      })),
    );
  app.mount(root);
  await nextTick();
  expect(
    all(root).find(
      n => n.type === 'button' && text(n).trim() === i18n.global.t('definitionEditor.applyValue'),
    )?.props.disabled,
  ).toBe(true);
  const choose = all(root).find(
    n =>
      n.type === 'select' &&
      n.props.options?.some(
        (option: any) =>
          option.label === i18n.global.t('actionGraphEditor.options.infinite') ||
          option.label === 'infinite',
      ),
  )!;
  expect(choose).toBeDefined();
  const infinite = choose.props.options.find(
    (option: any) =>
      option.label === i18n.global.t('actionGraphEditor.options.infinite') ||
      option.label === 'infinite',
  );
  choose.props.onChange(infinite.value);
  await nextTick();
  await click(root, i18n.global.t('definitionEditor.applyValue'));
  expect(created).toEqual([{ lifetime: { kind: 'infinite' } }]);
  await click(root, i18n.global.t('common.cancel'));
  expect(cancelled).toBe(1);
  app.unmount();
});
