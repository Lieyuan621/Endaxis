import { createRenderer, h, nextTick, shallowRef, ssrContextKey } from 'vue';
import { createI18n } from 'vue-i18n';
import { expect, it } from 'vitest';
import LevelEditor from './LevelValuesEditor.vue';
import BuffEditor from './buffs/BuffAssignmentsEditor.vue';
import { createDefinitionEditContext } from './definitionEditContext';

function mount(component: any, input: any) {
  const state = shallowRef(input);
  let panel: any;
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
    render: () =>
      h(
        {
          ...component,
          setup(props: any, ctx: any) {
            panel = component.setup(props, ctx);
            return panel;
          },
          render: () => null,
        },
        {
          ...state.value,
          onUpdate: (value: unknown) => {
            state.value = { ...state.value, value };
          },
        },
      ),
  });
  app.use(createI18n({ legacy: false, locale: 'zh-CN', messages: {} }));
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  return {
    state,
    get panel() {
      return panel;
    },
    app,
  };
}
const event = (value: string) => ({ target: { value } });

it('Buff assignments use current root handles and shared safe rename for special keys', async () => {
  let draft = { assignments: { dmg: [0.2, 0.4], other: 5 } as Record<string, unknown> };
  const paths: unknown[] = [];
  const context = createDefinitionEditContext({
    read: () => draft,
    commit(next, path) {
      draft = next;
      paths.push(path);
    },
  });
  const view = mount(BuffEditor, {
    value: draft.assignments,
    currentLevel: 12,
    binding: context.root.child('assignments'),
  });
  try {
    view.panel.renameAssignment('dmg', event('__proto__'));
    expect(Object.hasOwn(draft.assignments, '__proto__')).toBe(true);
    expect(draft.assignments.__proto__).toEqual([0.2, 0.4]);
    expect(Object.getPrototypeOf(draft.assignments)).toBe(Object.prototype);
    view.panel.setAssignment('__proto__', [0.3, 0.5]);
    view.panel.appendAssignment();
    view.panel.appendAssignment();
    expect(Object.keys(draft.assignments)).toEqual(['__proto__', 'other', 'custom-1', 'custom-2']);
    expect(paths[1]).toEqual(['assignments', '__proto__']);
    const count = paths.length;
    view.panel.renameAssignment('__proto__', event('other'));
    view.panel.removeAssignment('missing');
    view.panel.setAssignment('missing', 3);
    expect(paths).toHaveLength(count);
    expect(view.state.value.value).toEqual({ dmg: [0.2, 0.4], other: 5 });
  } finally {
    view.app.unmount();
  }
});

it('edits explicit indices independently of the contextual level, without sparse writes', async () => {
  const original = [0.2, 0.4];
  const view = mount(LevelEditor, { value: original, currentLevel: 12 });
  try {
    view.panel.setValue(event('0.3'), 0);
    await nextTick();
    expect(view.state.value.value).toEqual([0.3, 0.4]);
    expect(original).toEqual([0.2, 0.4]);
    view.panel.setValue(event('1'), 11);
    expect(view.state.value.value).toEqual([0.3, 0.4]);
    view.panel.append();
    await nextTick();
    expect(view.state.value.value).toEqual([0.3, 0.4, 0]);
    view.panel.remove(0);
    await nextTick();
    expect(view.state.value.value).toEqual([0.4, 0]);
    view.panel.setKind(event('constant'));
    await nextTick();
    expect(view.state.value.value).toBe(0.4);
    view.panel.setKind(event('levels'));
    await nextTick();
    expect(view.state.value.value).toEqual([0.4]);
    view.panel.remove(0);
    await nextTick();
    expect(view.state.value.value).toEqual([]);
    view.panel.append();
    await nextTick();
    expect(view.state.value.value).toEqual([0]);
  } finally {
    view.app.unmount();
  }
});

it('Buff assignment preserves full arrays and replaces them explicitly with expressions', async () => {
  const step = {
    kind: 'applyBuff',
    parameters: { buffId: 'qa', blackboardAssignments: { dmg: [0.2, 0.4], other: 5 } },
  };
  const view = mount(BuffEditor, {
    value: step.parameters.blackboardAssignments,
    currentLevel: 12,
  });
  try {
    expect(view.panel.assignments.value[0]).toEqual(['dmg', [0.2, 0.4]]);
    view.panel.setAssignment('dmg', [0.3, 0.4]);
    await nextTick();
    expect(view.state.value.value).toEqual({
      dmg: [0.3, 0.4],
      other: 5,
    });
    view.panel.setAssignment('dmg', { kind: 'constant', value: 0.3 });
    await nextTick();
    expect(view.state.value.value.dmg).toEqual({
      kind: 'constant',
      value: 0.3,
    });
    expect(step.parameters.blackboardAssignments.dmg).toEqual([0.2, 0.4]);
  } finally {
    view.app.unmount();
  }
});
