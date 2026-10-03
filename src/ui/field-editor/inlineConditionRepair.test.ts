import {
  computed,
  createRenderer,
  defineComponent,
  h,
  nextTick,
  shallowRef,
  ssrContextKey,
} from 'vue';
import { beforeAll, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as Vue from 'vue';
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc';
import ts from 'typescript';
import InlineCombatConditionField from './InlineCombatConditionField.vue';
import BlackboardMappingValueField from './BlackboardMappingValueField.vue';
import BlackboardKeyField from './BlackboardKeyField.vue';
import EditorHelp from '../editor/EditorHelp.vue';
import { i18n } from '../../i18n';
import DefinitionField from '../definition-editor/DefinitionField.vue';
import { definitionSchemas } from '../definition-editor/definitionSchemas.generated';
import { fieldSchemaForValue } from '../definition-editor/definitionFieldRuntime';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import { definitionConditionContextKey } from './inlineConditionContext';
import { inlineConditionBlackboardContext } from '../../application/editor/inlineConditionContext';
import {
  WorkspaceAssetSession,
  type WorkspaceAssetSource,
} from '../asset-workspace/workspaceSession';
import type { CombatCondition } from '../../../packages/game-data-contract/src/conditions';
import gearSet from '../../data/equipment/generated-gear-sets/suit_phy01.generated';

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
    EaNumberInput: input,
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
  for (const [component, path] of [
    [DefinitionField, '../definition-editor/DefinitionField.vue'],
    [InlineCombatConditionField, './InlineCombatConditionField.vue'],
    [BlackboardMappingValueField, './BlackboardMappingValueField.vue'],
    [BlackboardKeyField, './BlackboardKeyField.vue'],
    [EditorHelp, '../editor/EditorHelp.vue'],
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
};
const node = (type: string, text = ''): Node => ({
  type,
  text,
  props: {},
  children: [],
  parent: null,
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
const condition: CombatCondition = {
  kind: 'actionValueCompare',
  left: { kind: 'blackboard', key: 'rate' },
  operator: 'greater',
  right: { kind: 'constant', value: 1 },
};
const rootSchema: DefinitionFieldSchema = definitionSchemas.gearSet;
const rootShape = fieldSchemaForValue(rootSchema, gearSet);
if (rootShape.kind !== 'object' || rootShape.fields.eventHandlers?.kind !== 'array')
  throw new Error('expected handlers');
const handler = {
  key: 'listener',
  event: { kind: 'operatorHit' },
  sequence: { $sequence: null },
  condition,
};
const handlerSchema = fieldSchemaForValue(
  rootShape.fields.eventHandlers.element,
  handler,
  undefined,
  rootSchema.references,
);
if (handlerSchema.kind !== 'object') throw new Error('expected handler');
const schema = { ...handlerSchema.fields.condition!, references: rootSchema.references };

async function mountCondition(initial: unknown = condition) {
  const source: WorkspaceAssetSource = {
    id: gearSet.slug,
    kind: 'gearSet',
    kindName: 'Gear set',
    name: 'Condition',
    custom: false,
    edit: {
      kind: 'gearSet',
      definition: {
        ...gearSet,
        blackboard: { rate: 2 },
        eventHandlers: [
          { ...handler, event: { kind: 'operatorHit' }, condition: initial as CombatCondition },
        ],
      },
    },
  };
  const session = new WorkspaceAssetSession(source, 'project:gearSet:repair');
  const state = shallowRef(session.current);
  const editable = shallowRef(true);
  let commits = 0;
  const current = () =>
    state.value.edit.kind === 'gearSet'
      ? state.value.edit.definition.eventHandlers![0]!.condition
      : undefined;
  const root = node('root');
  const app = renderer.createApp({
    render: () =>
      h(DefinitionField, {
        name: 'condition',
        schema,
        value: current(),
        path: ['eventHandlers', 0, 'condition'],
        editable: editable.value,
        root: true,
        onChange: (path, value) => {
          session.change(path, value);
          state.value = session.current;
          commits++;
        },
      }),
  });
  app.use(i18n).provide(ssrContextKey, { modules: new Set() });
  app.provide(
    definitionConditionContextKey,
    computed(() => inlineConditionBlackboardContext('gearSet', source.edit.definition)),
  );
  app.mount(root);
  await nextTick();
  return {
    root,
    current,
    session,
    commits: () => commits,
    numeric: () =>
      all(root)
        .filter(item => item.type === 'input' && item.props.type === 'number')
        .at(-1),
    async click(label: string) {
      const button = all(root).find(item => item.type === 'button' && text(item).trim() === label);
      expect(button, `button ${label}`).toBeDefined();
      button!.props.onClick();
      await nextTick();
    },
    async expand() {
      for (let i = 0; i < 8; i++) {
        const closed = all(root).filter(item => item.type === 'details' && !item.props.open);
        if (!closed.length) break;
        closed.forEach(item => item.props.onToggle({ target: { open: true } }));
        await nextTick();
      }
    },
    async readonly(value: boolean) {
      editable.value = !value;
      await nextTick();
    },
    stop: () => app.unmount(),
  };
}

it.each([
  { name: 'direct', value: condition, read: (value: any) => value.right.value },
  {
    name: 'nested all/not',
    value: { kind: 'not', condition: { kind: 'all', conditions: [condition] } },
    read: (value: any) => value.condition.conditions[0].right.value,
  },
])(
  '$name keeps a real generated numeric control mounted for clear, invalid Apply and in-place repair',
  async ({ value, read }) => {
    const host = await mountCondition(value);
    try {
      await host.click('Edit condition');
      await host.expand();
      const input = host.numeric();
      expect(input).toBeDefined();
      input!.props.onInput('');
      await nextTick();
      expect(host.numeric()).toBe(input);
      expect(host.numeric()!.props.value).toBe('');
      await host.click('Apply');
      expect(all(host.root).some(item => item.props.role === 'alert')).toBe(true);
      expect(host.commits()).toBe(0);
      expect(read(host.current())).toBe(1);
      expect(host.numeric()).toBe(input);
      input!.props.onInput('4');
      await nextTick();
      await host.click('Apply');
      expect(host.commits()).toBe(1);
      expect(read(host.current())).toBe(4);
      expect(all(host.root).some(item => item.props.role === 'alert')).toBe(false);
      host.session.history.undo();
      expect(
        read(
          host.session.current.edit.kind === 'gearSet'
            ? host.session.current.edit.definition.eventHandlers![0]!.condition
            : undefined,
        ),
      ).toBe(1);
    } finally {
      host.stop();
    }
  },
);

it('cancel and readonly discard invalid drafts and ignore stale numeric events', async () => {
  const host = await mountCondition();
  try {
    await host.click('Edit condition');
    const input = host.numeric()!;
    input.props.onInput('');
    await nextTick();
    await host.click('Cancel');
    expect(host.commits()).toBe(0);
    await host.click('Edit condition');
    expect(host.numeric()!.props.value).toBe('1');
    host.numeric()!.props.onInput('');
    await nextTick();
    const stale = host.numeric()!;
    await host.readonly(true);
    expect(host.numeric()!.props.disabled).toBe(true);
    stale.props.onInput('9');
    await nextTick();
    expect(host.commits()).toBe(0);
    expect(host.current()).toEqual(condition);
    await host.readonly(false);
    await host.click('Edit condition');
    expect(host.numeric()!.props.value).toBe('1');
  } finally {
    host.stop();
  }
});

it.each([
  { ...condition, right: { kind: 'constant', value: '' } },
  { kind: 'unrecognizedCondition', value: 1 },
])(
  'keeps malformed imported values explicit until editing and never approves guessed branches',
  async value => {
    const host = await mountCondition(value);
    try {
      expect(host.numeric()).toBeUndefined();
      expect(all(host.root).some(item => item.props.role === 'alert')).toBe(true);
      await host.click('Edit condition');
      if (value.kind === 'unrecognizedCondition') expect(host.numeric()).toBeUndefined();
      await host.click('Apply');
      expect(host.commits()).toBe(0);
      expect(all(host.root).some(item => item.props.role === 'alert')).toBe(true);
    } finally {
      host.stop();
    }
  },
);
