import { computed, reactive, ref } from 'vue';
import { expect, it } from 'vitest';
import {
  createResourceEditorView,
  resourceEditorSelection,
  resourceGraphAddress,
} from './resourceEditorView';

it('资源导航恢复各自的宏和选择，检查器与画布始终读写同一份选择', () => {
  const views = reactive({ skill: createResourceEditorView(), buff: createResourceEditorView() });
  const active = ref<'skill' | 'buff'>('skill');
  const view = computed(() => views[active.value]);
  const inspector = resourceEditorSelection(() => view.value);
  const canvas = resourceEditorSelection(() => view.value);
  const address = resourceGraphAddress(() => view.value);
  address.value = { kind: 'macro', macroId: 'damage' };
  canvas.selectedId.value = 'hit';
  expect(inspector.selectedId.value).toBe('hit');
  active.value = 'buff';
  expect(address.value).toEqual({ kind: 'main' });
  expect(inspector.current.value).toBeNull();
  inspector.field.value = 'duration';
  expect(canvas.field.value).toBe('duration');
  active.value = 'skill';
  expect(address.value).toEqual({ kind: 'macro', macroId: 'damage' });
  expect(inspector.selectedId.value).toBe('hit');
  expect(views.buff.selection).toEqual({ kind: 'field', id: 'duration' });
});
