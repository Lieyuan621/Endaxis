import { createRenderer, h, nextTick, shallowRef, ssrContextKey, type ComponentOptions } from 'vue';
import { expect, it } from 'vitest';
import { i18n } from '../../i18n';
import { referenceCatalog } from './referenceTestFixtures';
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
import type { StringCollectionKind } from './stringCollectionSchema';
import StringCollectionField from './StringCollectionField.vue';

async function mount(
  value: readonly string[] | undefined,
  editable = true,
  referenceChoices: ReferenceChoices = { buff: referenceCatalog() },
  kind: StringCollectionKind = 'reference',
) {
  const changes: (readonly string[] | undefined)[] = [];
  let discards = 0;
  const props = shallowRef({
    value,
    editable,
    label: 'Values',
    kind,
    referenceKind: 'buff',
    referenceChoices,
    onChange: (value: readonly string[] | undefined) => changes.push(value),
    onDiscard: () => discards++,
  });
  const implementation = StringCollectionField as ComponentOptions;
  let state: any;
  const stub = {
    ...implementation,
    setup(p: any, ctx: any) {
      state = implementation.setup!(p, ctx);
      return state;
    },
    render: () => null,
  };
  const app = createRenderer<object, object>({
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
  }).createApp({ render: () => h(stub, props.value) });
  app.use(i18n).provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  await nextTick();
  return {
    state,
    changes,
    get discards() {
      return discards;
    },
    stop: () => app.unmount(),
    async update(next: Partial<typeof props.value>) {
      props.value = { ...props.value, ...next };
      await nextTick();
    },
  };
}

it('stages append/reorder/delete and preserves duplicate rows until one atomic apply', async () => {
  const original = Object.freeze(['known', 'stale', 'known']);
  const panel = await mount(original);
  try {
    panel.state.begin();
    panel.state.move(2, -1);
    panel.state.remove(0);
    panel.state.choice.value = 'known';
    panel.state.add();
    expect(panel.state.draft.value).toEqual(['known', 'stale', 'known']);
    expect(panel.changes).toEqual([]);
    panel.state.remove(1);
    await panel.state.apply();
    expect(panel.changes).toEqual([['known', 'known']]);
    expect(original).toEqual(['known', 'stale', 'known']);
  } finally {
    panel.stop();
  }
});
it('distinguishes absent and empty, cancels without publishing and retains rejected proposals', async () => {
  const panel = await mount(undefined);
  try {
    panel.state.begin();
    panel.state.empty();
    expect(panel.state.draft.value).toEqual([]);
    panel.state.discard();
    expect(panel.changes).toEqual([]);
    panel.state.begin();
    panel.state.empty();
    await panel.state.apply();
    expect(panel.changes).toEqual([[]]);
    expect(panel.state.error.value).toBe('rejected');
    panel.state.choice.value = 'known';
    panel.state.add();
    expect(panel.discards).toBe(2);
    expect(panel.state.error.value).toBe('');
    await panel.state.apply();
    await panel.update({ value: ['known'] });
    expect(panel.state.editing.value).toBe(false);
    panel.state.begin();
    panel.state.empty(true);
    await panel.state.apply();
    expect(panel.changes.at(-1)).toBeUndefined();
  } finally {
    panel.stop();
  }
});
it('rechecks the latest catalog at apply without clearing an in-progress draft', async () => {
  const panel = await mount([]);
  try {
    panel.state.begin();
    panel.state.choice.value = 'known';
    panel.state.add();
    await panel.update({ referenceChoices: { buff: referenceCatalog('buff', []) } });
    expect(panel.state.draft.value).toEqual(['known']);
    await panel.state.apply();
    expect(panel.changes).toEqual([]);
    expect(panel.state.error.value).toBe('invalid');
    panel.state.remove(0);
    panel.state.discard();
    expect(panel.discards).toBe(1);
  } finally {
    panel.stop();
  }
});
it('readonly transitions and external replacement invalidate drafts and forged mutation events', async () => {
  const panel = await mount(['known']);
  try {
    panel.state.begin();
    panel.state.remove(0);
    await panel.update({ value: ['known', 'known'] });
    expect(panel.state.editing.value).toBe(false);
    panel.state.begin();
    await panel.update({ editable: false });
    panel.state.begin();
    panel.state.choice.value = 'known';
    panel.state.add();
    panel.state.replace(0, 'known');
    panel.state.move(0, 1);
    panel.state.empty();
    await panel.state.apply();
    expect(panel.changes).toEqual([]);
    expect(panel.state.editing.value).toBe(false);
  } finally {
    panel.stop();
  }
});
it('rejects rapid duplicate Apply and ignores an older acceptance after cancel/reopen', async () => {
  const panel = await mount([]);
  try {
    panel.state.begin();
    panel.state.choice.value = 'known';
    panel.state.add();
    const first = panel.state.apply();
    const second = panel.state.apply();
    panel.state.discard();
    panel.state.begin();
    await Promise.all([first, second]);
    expect(panel.changes).toHaveLength(1);
    expect(panel.state.error.value).toBe('');
    expect(panel.state.draft.value).toEqual([]);
  } finally {
    panel.stop();
  }
});

it('creates native queries without a catalog, preserves exact IDs and rejects empty drafts', async () => {
  const panel = await mount(undefined, true, {}, 'nativeId');
  try {
    panel.state.begin();
    panel.state.empty(true);
    await panel.state.apply();
    expect(panel.changes).toEqual([]);
    expect(panel.state.error.value).toBe('invalid');
    panel.state.choice.value = '';
    panel.state.add();
    expect(panel.state.draft.value).toBeUndefined();
    for (const id of ['unknown', ' \t\r\n ', 'unknown']) {
      panel.state.choice.value = id;
      panel.state.add();
    }
    expect(panel.changes).toEqual([]);
    const first = panel.state.apply();
    const repeated = panel.state.apply();
    await panel.update({ value: ['unknown', ' \t\r\n ', 'unknown'] });
    await Promise.all([first, repeated]);
    expect(panel.changes).toEqual([['unknown', ' \t\r\n ', 'unknown']]);
    expect(panel.state.editing.value).toBe(false);
    panel.state.begin();
    panel.state.replace(0, '');
    await panel.state.apply();
    expect(panel.changes).toHaveLength(1);
    expect(panel.state.draft.value[0]).toBe('');
    expect(panel.state.error.value).toBe('invalid');
    panel.state.replace(0, ' another ');
    panel.state.move(2, -1);
    panel.state.remove(2);
    panel.state.discard();
    expect(panel.changes).toHaveLength(1);
    panel.state.begin();
    expect(panel.state.draft.value).toEqual(['unknown', ' \t\r\n ', 'unknown']);
    panel.state.empty();
    await panel.state.apply();
    expect(panel.changes).toHaveLength(1);
    expect(panel.state.error.value).toBe('invalid');
  } finally {
    panel.stop();
  }
});
it('keeps imported native errors visible and blocks readonly or stale sessions', async () => {
  const panel = await mount([''], true, {}, 'nativeId');
  try {
    expect(panel.state.invalidNative.value).toBe(true);
    panel.state.begin();
    await panel.state.apply();
    expect(panel.changes).toEqual([]);
    panel.state.replace(0, 'fixed');
    await panel.update({ editable: false });
    panel.state.begin();
    panel.state.replace(0, 'forged');
    panel.state.choice.value = 'forged';
    panel.state.add();
    panel.state.remove(0);
    panel.state.move(0, 1);
    panel.state.empty();
    await panel.state.apply();
    expect(panel.changes).toEqual([]);
    await panel.update({ editable: true, value: ['replacement'] });
    panel.state.begin();
    panel.state.replace(0, 'proposal');
    const pending = panel.state.apply();
    panel.state.discard();
    panel.state.begin();
    await pending;
    expect(panel.changes).toEqual([['proposal']]);
    expect(panel.state.draft.value).toEqual(['replacement']);
    expect(panel.state.error.value).toBe('');
  } finally {
    panel.stop();
  }
});
