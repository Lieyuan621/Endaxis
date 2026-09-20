import { expect, it } from 'vitest';
import { reactive } from 'vue';
import { editorDefinitionsEqual } from './editorDefinitionsEqual';

it('ignores record insertion order and absent optional fields, including reactive drafts', () => {
  expect(
    editorDefinitionsEqual(reactive({ a: { y: 2, x: 1 }, b: undefined }), { a: { x: 1, y: 2 } }),
  ).toBe(true);
});
it('preserves array ordering, scalar types, and meaningful null/empty fields', () => {
  for (const [a, b] of [
    [{ steps: [1, 2] }, { steps: [2, 1] }],
    [{ value: 1 }, { value: '1' }],
    [{ value: null }, {}],
    [{ steps: [] }, {}],
    [[1], { 0: 1 }],
  ])
    expect(editorDefinitionsEqual(a, b)).toBe(false);
});
