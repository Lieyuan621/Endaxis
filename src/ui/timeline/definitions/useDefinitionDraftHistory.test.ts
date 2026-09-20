import { effectScope, shallowRef } from 'vue';
import { expect, it } from 'vitest';
import {
  useDefinitionDraftHistory,
  useDefinitionPageDraft,
  projectDefinitionHistory,
} from './useDefinitionDraftHistory';

it('embedded pages read current root values and preserve sequence locations without another history', () => {
  const scope = effectScope();
  const root = shallowRef({ count: 1 });
  const { history, page } = scope.run(() => {
    const history = useDefinitionDraftHistory(
      () => root.value,
      value => {
        root.value = value;
      },
    );
    const page = useDefinitionPageDraft(
      () => root.value,
      history,
      () => ({ path: '', objectId: 'selected' }),
    );
    return { history, page };
  })!;
  try {
    page.draft.value = { count: 2 };
    expect(root.value.count).toBe(2);
    expect(history.undoLocation?.value?.objectId).toBe('selected');
    page.reset({ count: 99 });
    expect(page.draft.value.count).toBe(2);
    expect(history.canUndo.value).toBe(true);
    const sequence = projectDefinitionHistory(
      page.history,
      (value: number) => {
        page.draft.value = { count: value };
      },
      () => ({ objectId: 'sequence' }),
    );
    sequence.commit(3, { path: 'steps[1]', propertyPath: ['steps', 1, 'key'] });
    expect(history.undoLocation?.value).toEqual({
      path: 'steps[1]',
      objectId: 'sequence',
      propertyPath: ['steps', 1, 'key'],
    });
    page.history.restore('undo');
    expect(page.draft.value.count).toBe(2);
    page.history.restore('undo');
    expect(page.draft.value.count).toBe(1);
    expect(page.history.canUndo.value).toBe(false);
  } finally {
    scope.stop();
  }
});

it('independent definition pages isolate their draft until their host saves', () => {
  const scope = effectScope();
  const source = { count: 1 };
  const page = scope.run(() =>
    useDefinitionPageDraft(
      () => source,
      undefined,
      () => ({ path: '' }),
    ),
  )!;
  try {
    page.draft.value = { count: 2 };
    expect(source.count).toBe(1);
    page.history.restore('undo');
    expect(page.draft.value.count).toBe(1);
  } finally {
    scope.stop();
  }
});

it('isolates property location segments and keeps them through undo and redo', () => {
  const scope = effectScope();
  const value = shallowRef({ count: 1 });
  const history = scope.run(() =>
    useDefinitionDraftHistory(
      () => value.value,
      next => {
        value.value = next;
      },
    ),
  )!;
  const propertyPath: (string | number)[] = ['parameters', 'items', 0, 'a.b'];
  try {
    history.commit({ count: 2 }, { path: 'steps[0]', propertyPath });
    expect(history.undoLocation?.value?.path).toBe('steps[0]');
    expect(history.redoLocation?.value).toBeUndefined();
    propertyPath.push('mutated');
    history.restore('undo');
    expect(history.undoLocation?.value).toBeUndefined();
    expect(history.redoLocation?.value?.path).toBe('steps[0]');
    expect(history.restoredLocation?.value).toEqual({
      path: 'steps[0]',
      propertyPath: ['parameters', 'items', 0, 'a.b'],
    });
    history.restore('redo');
    expect(history.restoredLocation?.value?.propertyPath).toEqual([
      'parameters',
      'items',
      0,
      'a.b',
    ]);
  } finally {
    scope.stop();
  }
});

it('isolates history snapshots, invalidates redo after a new edit and resets on external replacement', () => {
  const scope = effectScope();
  const value = shallowRef({ steps: [1] });
  const history = scope.run(() =>
    useDefinitionDraftHistory(
      () => value.value,
      next => {
        value.value = next;
      },
    ),
  )!;
  try {
    const input = { steps: [1, 2] };
    history.commit(input);
    input.steps.push(3);
    expect(value.value.steps).toEqual([1, 2]);
    history.restore('undo');
    expect(value.value.steps).toEqual([1]);
    expect(history.canRedo.value).toBe(true);
    history.commit({ steps: [4] });
    expect(history.canRedo.value).toBe(false);
    history.restore('undo');
    expect(value.value.steps).toEqual([1]);
    history.restore('redo');
    expect(value.value.steps).toEqual([4]);
    value.value = { steps: [9] };
    expect(history.canUndo.value).toBe(false);
    history.restore('undo');
    expect(value.value.steps).toEqual([9]);
    history.commit({ steps: [9] });
    expect(history.canUndo.value).toBe(false);
  } finally {
    scope.stop();
  }
});
