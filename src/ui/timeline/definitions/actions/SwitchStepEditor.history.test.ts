import { createSSRApp, h, nextTick, type ComponentOptions } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { expect, it } from 'vitest';
import SwitchStepEditor from './SwitchStepEditor.vue';
import ActionSequenceEditor from './ActionSequenceEditor.vue';

// 使用真实 setup 验证容器边界；这里不验证 DOM 展开和焦点。
async function setupEditor(component: ComponentOptions, props: Record<string, unknown>) {
  let editor: any;
  const updates: any[][] = [];
  const wrapped = {
    ...component,
    setup(values: any, context: any) {
      editor = (component as any).setup(values, context);
      return editor;
    },
    ssrRender: () => {},
  };
  const app = createSSRApp({
    render: () => h(wrapped, { ...props, onUpdate: (...args: any[]) => updates.push(args) }),
  });
  app.use(createI18n({ legacy: false, locale: 'en', messages: {} }));
  await renderToString(app);
  await nextTick();
  return { editor, updates };
}

it('switch 候选序列恢复到子步骤，叶子修改一次交回外层宿主', async () => {
  const leaf = { kind: 'storeCurrentTimelineFrame', parameters: { outputKey: 'old' } };
  const sequence = { steps: [leaf, leaf] };
  const step = {
    kind: 'switch',
    parameters: { choice: { kind: 'constant', value: 0 } },
    options: [0, 1].map(value => ({ value: { kind: 'constant', value }, sequence })),
  };
  const path = ['options', 1, 'sequence', 'steps', 1, 'parameters', 'outputKey'];
  const parent = await setupEditor(SwitchStepEditor as ComponentOptions, {
    step,
    skillLevel: 1,
    restoredPropertyPath: path,
  });
  expect(parent.editor.restoredOption.value).toEqual({ index: 1, path: path.slice(3) });
  const child = await setupEditor(ActionSequenceEditor as ComponentOptions, {
    sequence,
    skillLevel: 1,
    createStep: () => leaf,
    duplicateStep: (value: unknown) => value,
    restoredPropertyPath: parent.editor.restoredOption.value.path,
  });
  expect(child.editor.selectedStepIndex.value).toBe(1);
  expect(child.editor.restoredStepPath.value).toEqual(['parameters', 'outputKey']);
  expect(child.editor.history.canUndo.value).toBe(false);
  expect(parent.updates).toEqual([]);
  expect(child.updates).toEqual([]);
  const changed = { ...leaf, parameters: { outputKey: 'new' } };
  child.editor.replaceStep(changed, ['parameters', 'outputKey']);
  expect(child.updates).toHaveLength(1);
  parent.editor.setSequence(1, ...child.updates[0]!);
  expect(parent.updates).toHaveLength(1);
  expect(parent.updates[0]![1]).toEqual(path);
  expect(parent.updates[0]![0].options[1].sequence.steps).toEqual([leaf, changed]);
  expect(parent.updates[0]![0].options[0]).toBe(step.options[0]);
  expect(child.editor.history.canUndo.value).toBe(false);
  expect(sequence.steps[1]).toBe(leaf);
});

it('过期的候选恢复路径不会转给其他序列', async () => {
  const { editor, updates } = await setupEditor(SwitchStepEditor as ComponentOptions, {
    step: { kind: 'switch', parameters: { choice: { kind: 'constant', value: 0 } }, options: [] },
    skillLevel: 1,
    restoredPropertyPath: ['options', 4, 'sequence', 'steps', 0],
  });
  expect(editor.restoredOption.value).toBeUndefined();
  editor.setSequence(4, { steps: [] }, ['steps', 0]);
  expect(updates).toEqual([]);
});
