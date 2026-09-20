import { createRenderer, h, nextTick, shallowRef, ssrContextKey, type ComponentOptions } from 'vue';
import { expect, it } from 'vitest';
import Graph from './EquipmentContributionGraphEditor.vue';
import weaponSource from './WeaponDefinitionWorkspaceDialog.vue?raw';
import gearSource from './GearDefinitionWorkspaceDialog.vue?raw';
import setSource from './GearSetDefinitionWorkspaceDialog.vue?raw';

it('keeps history across label changes and discards it when the host changes editing context', async () => {
  const context = shallowRef('0:0');
  const label = shallowRef('same-name');
  const contribution = shallowRef<any>({ initializationSequence: { steps: [] } });
  let panel: any;
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
    ...(Graph as ComponentOptions),
    setup(props: any, ctx: any) {
      panel = (Graph as any).setup(props, ctx);
      return panel;
    },
    render: () => null,
  };
  const app = renderer.createApp({
    render: () =>
      h(wrapped, {
        key: context.value,
        label: label.value,
        level: 1,
        contribution: contribution.value,
        onUpdate: (value: unknown) => {
          contribution.value = value;
        },
      }),
  });
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  try {
    panel.createInitializationSequence('enableSequence');
    await nextTick();
    expect(contribution.value.enableSequence).toEqual({ steps: [] });
    await panel.selectPath('enableSequence');
    await panel.removeInitializationSequence('enableSequence');
    expect(contribution.value).not.toHaveProperty('enableSequence');
    await panel.restoreHistory('undo');
    expect(contribution.value.enableSequence).toEqual({ steps: [] });
    await panel.restoreHistory('redo');
    expect(contribution.value).not.toHaveProperty('enableSequence');
    await panel.removeInitializationSequence();
    expect(contribution.value).not.toHaveProperty('initializationSequence');
    label.value = 'renamed';
    await nextTick();
    expect(panel.history.canUndo.value).toBe(true);
    await panel.restoreHistory('undo');
    expect(contribution.value.initializationSequence).toEqual({ steps: [] });
    // 属性句柄与结构操作共用宿主历史；字段定位不需要逐层转发事件。
    panel.editing.context.root
      .child('initializationSequence')
      .child('steps')
      .update(() => [{ kind: 'storeCurrentTimelineFrame', parameters: { outputKey: 'before' } }]);
    await nextTick();
    await panel.selectPath('initializationSequence.steps[0]');
    panel.editing.property.value
      .child('parameters')
      .child('outputKey')
      .update(() => 'after');
    await nextTick();
    expect(contribution.value.initializationSequence.steps[0].parameters.outputKey).toBe('after');
    await panel.selectPath('');
    await panel.restoreHistory('undo');
    await nextTick();
    expect(contribution.value.initializationSequence.steps[0].parameters.outputKey).toBe('before');
    expect(panel.selectedPath.value).toBe('initializationSequence.steps[0]');
    expect(panel.history.restoredLocation.value).toMatchObject({
      path: 'initializationSequence.steps[0]',
      propertyPath: ['parameters', 'outputKey'],
    });
    await panel.restoreHistory('redo');
    expect(contribution.value.initializationSequence.steps[0].parameters.outputKey).toBe('after');
    await panel.removeInitializationSequence();
    expect(contribution.value).not.toHaveProperty('initializationSequence');
    context.value = '0:1'; // A different trait, same display label.
    contribution.value = { blackboard: { other: 2 } };
    await nextTick();
    expect(panel.history.canUndo.value).toBe(false);
    await panel.restoreHistory('undo');
    expect(contribution.value).toEqual({ blackboard: { other: 2 } });
    panel.createInitializationSequence();
    await nextTick();
    context.value = '1:1'; // Deletion replaces the selected trait at the same index.
    contribution.value = {};
    await nextTick();
    expect(panel.history.canUndo.value).toBe(false);
    expect(panel.history.canRedo.value).toBe(false);
  } finally {
    app.unmount();
  }
});

it('hosts key graph sessions by selection/replacement rather than mutable labels', () => {
  for (const source of [weaponSource, gearSource]) {
    expect(source).toContain(':key="`${contributionEditorRevision}:${selectedTraitIndex}`"');
    const remove = source.slice(
      source.indexOf('function removeTrait'),
      source.indexOf('function moveTrait'),
    );
    expect(remove).toContain('contributionEditorRevision.value += 1');
  }
  expect(setSource).toContain(':key="draft.slug"');
});
