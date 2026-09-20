import {
  createRenderer,
  h,
  nextTick,
  reactive,
  shallowRef,
  ssrContextKey,
  type ComponentOptions,
} from 'vue';
import { expect, it } from 'vitest';
import Editor from './EquipmentBuffDefinitionsDialog.vue';
import { projectDefinitionHistory, useDefinitionDraft } from '../useDefinitionDraftHistory';

it('附属 Buff 直接进入根草稿，返回不保存也不清历史，撤销保留效果及 Buff 身份', async () => {
  const visible = shallowRef(true);
  const initial = {
    buffDefinitions: { qa: { stackingType: 'refresh' }, other: { stackingType: 'refresh' } },
  };
  let panel: any;
  let root: any;
  const renderer = createRenderer<object, object>({
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
  });
  const wrapped = {
    ...(Editor as ComponentOptions),
    setup(props: any, ctx: any) {
      panel = (Editor as any).setup(props, ctx);
      return panel;
    },
    render: () => null,
  };
  const app = renderer.createApp({
    setup() {
      root = useDefinitionDraft(initial);
      const history = projectDefinitionHistory(
        root.history,
        (value, location) => root.history.commit(value, location),
        () => ({ objectId: '0' }),
      );
      return () =>
        visible.value
          ? h(wrapped, {
              visible: true,
              contribution: root.draft.value,
              sharedHistory: history,
              referenceRoot: root.draft.value,
              level: 1,
            })
          : null;
    },
  });
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  try {
    panel.selectedId.value = 'qa';
    const changed = reactive({
      stackingType: 'refresh',
      childPresentations: [{ buffId: 'child', presentation: { visible: true } }],
    });
    panel.selectedHistory.commit(changed, {
      path: '',
      propertyPath: ['childPresentations', 0, 'presentation'],
    });
    await nextTick();
    expect(root.draft.value.buffDefinitions.qa).toEqual(changed);
    expect(root.draft.value.buffDefinitions.qa.childPresentations).not.toBe(
      changed.childPresentations,
    );
    expect(() => structuredClone(root.draft.value)).not.toThrow();
    expect(initial.buffDefinitions.qa).not.toHaveProperty('childPresentations');
    visible.value = false;
    await nextTick();
    expect(root.history.canUndo.value).toBe(true);
    root.history.restore('undo');
    expect(root.history.restoredLocation.value).toMatchObject({
      objectId: '0',
      page: 'buff:qa',
      propertyPath: ['childPresentations', 0, 'presentation'],
    });
    visible.value = true;
    await nextTick();
    expect(panel.selectedId.value).toBe('qa');
    root.history.restore('redo');
    await nextTick();
    expect(panel.draft.value.qa).toEqual(changed);
    panel.addBuff();
    await nextTick();
    const added = panel.selectedId.value;
    root.history.restore('undo');
    await nextTick();
    expect(panel.draft.value[added]).toBeUndefined();
    expect(panel.selectedDefinition.value).toBeDefined();
    root.history.restore('redo');
    await nextTick();
    expect(panel.selectedId.value).toBe(added);
    root.reset(initial);
    await nextTick();
    expect(root.draft.value).toEqual(initial);
    expect(root.history.canUndo.value).toBe(false);
  } finally {
    app.unmount();
  }
});
