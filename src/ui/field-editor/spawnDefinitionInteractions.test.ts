import {
  createRenderer,
  defineComponent,
  h,
  nextTick,
  shallowRef,
  ssrContextKey,
  toRaw,
} from 'vue';
import { beforeAll, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as Vue from 'vue';
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc';
import ts from 'typescript';
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
// Keep production field components, templates, watchers and events mounted. Only visual
// primitives are replaced with their public event interfaces; this is not a browser test.
vi.mock('@/design-system', async importOriginal => {
  const original = await importOriginal<Record<string, unknown>>();
  const input = defineComponent({
    props: ['modelValue', 'disabled', 'type'],
    emits: ['input', 'change', 'update:modelValue'],
    setup:
      (props, { attrs, emit }) =>
      () =>
        h('input', {
          ...attrs,
          type: props.type,
          disabled: props.disabled,
          value: props.modelValue,
          onInput: (value: string) => {
            emit('input', value);
            emit('update:modelValue', value);
          },
          onChange: (value: string) => emit('change', value),
        }),
  });
  return {
    ...original,
    EaInput: input,
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
    EaButton: defineComponent({
      props: ['disabled'],
      emits: ['click'],
      setup:
        (props, { attrs, emit, slots }) =>
        () =>
          h(
            'button',
            {
              ...attrs,
              disabled: props.disabled,
              onClick: () => emit('click'),
            },
            slots.default?.(),
          ),
    }),
    EaSelect: defineComponent({
      props: ['modelValue', 'disabled', 'options'],
      emits: ['change'],
      setup:
        (props, { attrs, emit }) =>
        () =>
          h('select', {
            ...attrs,
            disabled: props.disabled,
            value: props.modelValue,
            options: props.options,
            onChange: (value: unknown) => emit('change', value),
          }),
    }),
    EaCheckbox: defineComponent({
      props: ['modelValue', 'disabled'],
      emits: ['change'],
      setup:
        (props, { attrs, emit, slots }) =>
        () =>
          h('label', {}, [
            h('input', {
              ...attrs,
              type: 'checkbox',
              disabled: props.disabled,
              checked: props.modelValue,
              onChange: (value: boolean) => emit('change', value),
            }),
            slots.default?.(),
          ]),
    }),
    EaTooltip: defineComponent({
      setup:
        (_, { slots }) =>
        () =>
          slots.default?.(),
    }),
  };
});

// Node-mode Vite imports SSR-only SFCs. Compile their unchanged production templates
// for this renderer, keeping the imported production setup functions and object identities.
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
  for (const [component, path] of [
    [DefinitionField, '../definition-editor/DefinitionField.vue'],
    [DefinitionValueCreator, '../definition-editor/DefinitionValueCreator.vue'],
    [StructuredValueField, './StructuredValueField.vue'],
    [OwnedSpawnResourceField, './OwnedSpawnResourceField.vue'],
    [BlackboardKeyField, './BlackboardKeyField.vue'],
    [EditorHelp, '../editor/EditorHelp.vue'],
    [StringCollectionField, './StringCollectionField.vue'],
    [GameplayTagField, './GameplayTagField.vue'],
  ] as const) {
    const filename = fileURLToPath(new URL(path, import.meta.url));
    const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename });
    const script = compileScript(descriptor, { id: path });
    const result = compileTemplate({
      source: descriptor.template!.content,
      filename,
      id: path,
      compilerOptions: { bindingMetadata: script.bindings, expressionPlugins: ['typescript'] },
    });
    expect(result.errors).toEqual([]);
    const code = ts
      .transpileModule(result.code, {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
      })
      .outputText.replace(
        /import \{([^}]+)\} from ["']vue["'];?/g,
        (_match, bindings: string) => `const {${bindings.replace(/ as /g, ': ')}} = Vue;`,
      )
      .replace('export function render', 'return function render');
    component.render = new Function('Vue', code)(Vue);
  }
});

type Node = {
  type: string;
  props: Record<string, any>;
  text: string;
  children: Node[];
  parent: Node | null;
  readonly dataset: Record<string, string>;
  clientWidth: number;
  clientHeight: number;
  getBoundingClientRect(): {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  };
  contains(child: Node): boolean;
  focus(): void;
  setPointerCapture(): void;
  hasPointerCapture(): boolean;
  releasePointerCapture(): void;
  querySelector(): null;
  querySelectorAll(): never[];
  closest(selector: string): Node | null;
};
const node = (type: string, text = ''): Node => ({
  type,
  text,
  props: {},
  children: [],
  parent: null,
  get dataset() {
    return { graphPin: this.props['data-graph-pin'] };
  },
  clientWidth: 10000,
  clientHeight: 10000,
  getBoundingClientRect: () => ({
    left: 0,
    top: 0,
    right: 10000,
    bottom: 10000,
    width: 10000,
    height: 10000,
  }),
  contains(child) {
    return all(Vue.toRaw(this)).includes(Vue.toRaw(child));
  },
  focus() {},
  setPointerCapture() {},
  hasPointerCapture: () => false,
  releasePointerCapture() {},
  querySelector: () => null,
  querySelectorAll: () => [],
  closest(selector) {
    return selector === '[data-graph-pin]' && this.props['data-graph-pin'] ? this : null;
  },
});
function detach(child: Node) {
  if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1);
  child.parent = null;
}
const renderer = createRenderer<Node, Node>({
  insert(child, parent, anchor) {
    detach(child);
    const index = anchor ? parent.children.indexOf(anchor) : -1;
    parent.children.splice(index < 0 ? parent.children.length : index, 0, child);
    child.parent = parent;
  },
  remove: detach,
  patchProp: (element, key, _old, value) => {
    element.props[key] = value;
  },
  setText: (element, text) => {
    element.text = text;
  },
  setElementText: (element, text) => {
    element.text = text;
    element.children = [];
  },
  createElement: type => node(type),
  createText: text => node('text', text),
  createComment: text => node('comment', text),
  parentNode: element => element.parent,
  nextSibling: element =>
    element.parent?.children[element.parent.children.indexOf(element) + 1] ?? null,
});
function all(root: Node): Node[] {
  return [root, ...root.children.flatMap(all)];
}
function text(root: Node): string {
  return root.text + root.children.map(text).join('');
}
function event(extra: Record<string, unknown> = {}) {
  return {
    preventDefault() {},
    stopPropagation() {},
    button: 0,
    detail: 0,
    pointerId: 1,
    clientX: 1,
    clientY: 1,
    altKey: false,
    ...extra,
  };
}
async function click(root: Node, label: string) {
  const target = all(root).find(n => n.type === 'button' && text(n).trim() === label);
  expect(target, label).toBeDefined();
  target!.props.onClick(event());
  await nextTick();
}
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
