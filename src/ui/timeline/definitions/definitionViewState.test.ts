import { expect, it } from 'vitest';
import { createDefinitionViewState } from './definitionViewState';

it('isolates object views and returned snapshots within one root session', () => {
  const store = createDefinitionViewState();
  const state = { zoom: 0.7, collapsedIds: ['branch'], left: 42, top: 88 };
  store.write('buff:a', state);
  state.collapsedIds.push('other');
  expect(store.read('entity:a')).toBeUndefined();
  const restored = store.read('buff:a')!;
  expect(restored).toEqual({ zoom: 0.7, collapsedIds: ['branch'], left: 42, top: 88 });
  restored.left = 0;
  expect(store.read('buff:a')!.left).toBe(42);
  store.clear();
  expect(store.read('buff:a')).toBeUndefined();
});
