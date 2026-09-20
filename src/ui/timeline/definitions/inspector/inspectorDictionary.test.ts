import { readFileSync } from 'node:fs';
import { effectScope, shallowRef } from 'vue';
import { describe, expect, it } from 'vitest';
import { nextInspectorEntryKey, renameInspectorEntry } from './inspectorDictionary';
import { stepInspectorFields } from './stepInspectorSchema';
import { useDefinitionDraftHistory } from '../useDefinitionDraftHistory';

describe('契约驱动字典参数', () => {
  it('直接提取字典值类型，保留逐级初值和动态操作数', () => {
    const fields = stepInspectorFields('withActionBlackboardScope')!;
    const initial = fields.find(field => field.key === 'initialValues')!;
    const assignments = fields.find(field => field.key === 'entityAssignments')!;
    expect(initial.editor).toBe('dictionary');
    expect(initial.element?.type).toBe('levelValues');
    expect(assignments.element?.type).toBe('actionValue');
    const original = { scopeKey: 'scope', inheritParent: true, initialValues: { a: [1, 2, 3] } };
    expect(initial.write(original, { a: [1, 20, 3] }).initialValues).toEqual({ a: [1, 20, 3] });
    expect(original.initialValues.a).toEqual([1, 2, 3]);
    expect(initial.write(original, { a: 'invalid' })).toBe(original);
  });

  it('重命名不覆盖条目、不改变值，特殊键作为自有属性保存', () => {
    const original = { a: [1, 2], b: 3 };
    expect(renameInspectorEntry(original, 'a', 'b')).toBe(original);
    expect(renameInspectorEntry(original, 'a', ' ')).toBe(original);
    const renamed = renameInspectorEntry(original, 'a', '__proto__');
    expect(Object.hasOwn(renamed, '__proto__')).toBe(true);
    expect(renamed.__proto__).toBe(original.a);
    expect(Object.getPrototypeOf(renamed)).toBe(Object.prototype);
    expect(Object.keys(renameInspectorEntry(original, 'a', 'c'))).toEqual(['c', 'b']);
    expect(nextInspectorEntryKey({ 'custom-1': 1, 'custom-2': 2 })).toBe('custom-3');
  });

  it('一次字典重命名由宿主历史整体撤销、重做', () => {
    const scope = effectScope();
    const value = shallowRef<{ entries: Readonly<Record<string, unknown>> }>({
      entries: { a: [1, 2] },
    });
    const history = scope.run(() =>
      useDefinitionDraftHistory(
        () => value.value,
        next => {
          value.value = next;
        },
      ),
    )!;
    try {
      history.commit({ entries: renameInspectorEntry(value.value.entries, 'a', 'renamed') });
      history.restore('undo');
      expect(value.value.entries).toEqual({ a: [1, 2] });
      history.restore('redo');
      expect(value.value.entries).toEqual({ renamed: [1, 2] });
    } finally {
      scope.stop();
    }
  });

  it('字典控件不拥有历史；含定义的步骤仍回退专用入口', () => {
    const source = readFileSync(new URL('./InspectorDictionaryValue.vue', import.meta.url), 'utf8');
    expect(source).not.toContain('useDefinitionDraftHistory');
    expect(source).toContain(':current-level="currentLevel"');
    expect(stepInspectorFields('spawnAbilityEntity')).toBeUndefined();
    expect(stepInspectorFields('applyBuff')).toBeUndefined();
  });
});
