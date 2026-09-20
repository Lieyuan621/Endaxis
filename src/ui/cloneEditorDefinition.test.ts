import { reactive } from 'vue';
import { expect, it } from 'vitest';
import { cloneEditorDefinition } from './cloneEditorDefinition';

it('clones definitions with nested proxies introduced by immutable updates', () => {
  const original = reactive({ name: 'old', traits: [{ value: 3, optional: undefined }] });
  const changed = { ...original, name: 'new' };
  const clone = cloneEditorDefinition(changed);
  expect(clone).toEqual(changed);
  clone.traits[0]!.value = 9;
  expect(original.traits[0]!.value).toBe(3);
  expect(Object.hasOwn(clone.traits[0]!, 'optional')).toBe(true);
});
