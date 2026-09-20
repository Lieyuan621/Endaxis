import { effectScope, shallowRef } from 'vue';
import { expect, it, vi } from 'vitest';
import { createInspectorField } from './inspectorFields';
import { inspectorProperty } from './inspectorProperty';
import { useDefinitionDraftHistory } from '../useDefinitionDraftHistory';

it('不同视图句柄读取同一宿主，修改和外部替换不产生陈旧副本', () => {
  let value = { amount: 1 };
  const commit = vi.fn((next: typeof value) => {
    value = next;
  });
  const source = { read: () => value, issues: () => [], commit };
  const field = createInspectorField<typeof value>('amount', {
    editor: 'number',
    labelKey: 'amount',
  });
  const first = inspectorProperty(source, field);
  const second = inspectorProperty(source, field);
  first.set(2);
  expect(second.value).toBe(2);
  value = { amount: 3 };
  expect(first.value).toBe(3);
  first.set('invalid');
  expect(commit).toHaveBeenCalledTimes(1);
});

it('联动写入只提交一次，复用宿主历史并恢复节点位置', () => {
  const scope = effectScope();
  const value = shallowRef({ operation: 'set', basis: 'seconds' });
  const history = scope.run(() =>
    useDefinitionDraftHistory(
      () => value.value,
      next => {
        value.value = next;
      },
    ),
  )!;
  const field = createInspectorField<typeof value.value>('operation', {
    editor: 'enum',
    options: ['set', 'reduce'],
    labelKey: 'operation',
    replace: (current, input) => ({
      ...current,
      operation: String(input),
      basis: input === 'reduce' ? 'ratio' : current.basis,
    }),
  });
  const commit = vi.fn((next: typeof value.value) => history.commit(next, { path: 'steps[0]' }));
  const handle = inspectorProperty(
    { read: () => value.value, issues: () => [], path: ['steps', 0, 'parameters'], commit },
    field,
  );
  try {
    handle.set('reduce');
    expect(commit).toHaveBeenCalledTimes(1);
    expect(handle.path).toEqual(['steps', 0, 'parameters', 'operation']);
    expect(value.value).toEqual({ operation: 'reduce', basis: 'ratio' });
    history.restore('undo');
    expect(handle.value).toBe('set');
    expect(value.value.basis).toBe('seconds');
    expect(history.restoredLocation?.value?.path).toBe('steps[0]');
    history.restore('redo');
    expect(handle.value).toBe('reduce');
  } finally {
    scope.stop();
  }
});

it('禁用约束同时作用于写入和启停；校验信息随宿主变化', () => {
  let value: { name?: string; locked: boolean } = { locked: true };
  const source = {
    read: () => value,
    commit: (next: typeof value) => {
      value = next;
    },
    issues: () => (value.name === '' ? [{ path: 'name', message: 'empty' }] : []),
  };
  const field = createInspectorField<typeof value>('name', {
    editor: 'text',
    labelKey: 'name',
    optional: true,
    create: () => '',
    disabled: current => current.locked,
  });
  const handle = inspectorProperty(source, field);
  handle.setPresent(true);
  handle.set('blocked');
  expect(handle.present).toBe(false);
  value = { locked: false };
  handle.setPresent(true);
  expect(handle.issues).toEqual([{ path: 'name', message: 'empty' }]);
  handle.set('valid');
  expect(handle.issues).toEqual([]);
  handle.setPresent(false);
  expect(value).toEqual({ locked: false });
});

it('字段键按原样保存为路径段，不拆字典中的点号', () => {
  const handle = inspectorProperty(
    { read: () => ({ 'a.b': 1 }), issues: () => [], commit: () => {}, path: ['assignments'] },
    createInspectorField<{ 'a.b': number }>('a.b', { editor: 'number', labelKey: 'key' }),
  );
  expect(handle.path).toEqual(['assignments', 'a.b']);
});

it('拒绝子控件报告越界路径，透明包装不增加虚构层级', () => {
  const commit = vi.fn();
  const field = createInspectorField<{ value: string }>('value', {
    editor: 'text',
    labelKey: 'value',
  });
  const handle = inspectorProperty(
    { read: () => ({ value: 'old' }), issues: () => [], commit, path: ['items', 0] },
    field,
    [],
  );
  handle.set('new', ['unrelated']);
  expect(commit).toHaveBeenLastCalledWith({ value: 'new' }, ['items', 0]);
});
