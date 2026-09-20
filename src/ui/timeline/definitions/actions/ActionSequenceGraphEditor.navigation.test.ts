import { buildActionSequenceMindMap } from '../skillStructureMindMapModel';
import { createRenderer, h, nextTick, ssrContextKey, shallowRef } from 'vue';
import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import Graph from './ActionSequenceGraphEditor.vue';
import { buildOperatorUpgradeGraph } from '../operators/operatorUpgradeGraph';
const { revealProperty } = vi.hoisted(() => ({ revealProperty: vi.fn(async () => {}) }));
vi.mock('../inspector/useInspectorPropertyReveal', () => ({
  useInspectorPropertyReveal: () => revealProperty,
}));

it('routes inline Buff scalar history to its complete field path', async () => {
  vi.stubGlobal('document', { addEventListener() {}, removeEventListener() {} });
  const initial = {
    steps: [
      {
        kind: 'applyBuff',
        parameters: {
          buffId: 'inline',
          target: 'caster',
          definition: { stackingType: 'refresh', durationSeconds: 10 },
        },
      },
    ],
  };
  const sequence = shallowRef(initial);
  let editor: any;
  const wrapped = {
    ...(Graph as any),
    setup(props: any, ctx: any) {
      editor = (Graph as any).setup(props, ctx);
      return editor;
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
  }).createApp({
    render: () =>
      h(wrapped, {
        sequence: sequence.value,
        buildRoot: buildActionSequenceMindMap,
        initialOverview: false,
        skillLevel: 1,
        createStep: vi.fn(),
        duplicateStep: (value: unknown) => value,
        onUpdate: (value: typeof initial) => {
          sequence.value = value;
        },
      }),
  });
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  try {
    const path = 'steps[0].parameters.definition';
    await editor.reveal(path);
    editor.selectedProperty.value.child('durationSeconds').update(() => 25);
    await nextTick();
    expect(sequence.value.steps[0]!.parameters.definition.durationSeconds).toBe(25);
    await editor.history.restore('undo');
    await nextTick();
    await nextTick();
    expect(sequence.value).toEqual(initial);
    expect(editor.selected.value.sourcePath).toBe(path);
    await vi.waitFor(() =>
      expect(revealProperty).toHaveBeenCalledWith([
        'steps',
        0,
        'parameters',
        'definition',
        'durationSeconds',
      ]),
    );
    await editor.history.restore('redo');
    expect(sequence.value.steps[0]!.parameters.definition.durationSeconds).toBe(25);
    // The actual child receives this binding, rather than the object-only update fallback.
    const source = readFileSync(
      new URL('./ActionSequenceGraphEditor.vue', import.meta.url),
      'utf8',
    );
    expect(source.match(/<BuffStepEditor[\s\S]*?\/>/)?.[0]).toContain(
      ':definition-binding="selectedProperty"',
    );
  } finally {
    app.unmount();
    vi.unstubAllGlobals();
  }
});

it('cancels stale reveal requests when another request, manual selection, or disposal wins', async () => {
  vi.stubGlobal('document', { addEventListener() {}, removeEventListener() {} });
  let editor: any;
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
  }).createApp({
    render: () =>
      h(
        {
          ...(Graph as any),
          setup(props: any, ctx: any) {
            editor = (Graph as any).setup(props, ctx);
            return editor;
          },
          render: () => null,
        },
        {
          sequence: { levels: 1, modifiers: [] },
          buildRoot: (value: any) => buildOperatorUpgradeGraph(value, '天赋'),
          skillLevel: 1,
          createStep: vi.fn(),
          duplicateStep: (value: unknown) => value,
        },
      ),
  });
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  let disposed = false;
  try {
    const first = editor.reveal('modifiers');
    const second = editor.reveal('eventHandlers');
    expect(await first).toBe(false);
    expect(await second).toBe(true);
    expect(editor.selected.value.sourcePath).toBe('eventHandlers');
    const pending = editor.reveal('modifiers');
    editor.selectNode({ id: 'passiveSkills' });
    expect(await pending).toBe(false);
    expect(editor.selected.value.sourcePath).toBe('passiveSkills');
    let release!: () => void;
    editor.map.value = {
      revealNode: () =>
        new Promise<void>(resolve => {
          release = resolve;
        }),
    };
    const animating = editor.reveal('modifiers');
    await nextTick();
    editor.selectNode({ id: 'eventHandlers' });
    release();
    expect(await animating).toBe(false);
    expect(editor.selected.value.sourcePath).toBe('eventHandlers');
    const closing = editor.reveal('modifiers');
    app.unmount();
    disposed = true;
    expect(await closing).toBe(false);
  } finally {
    if (!disposed) app.unmount();
    vi.unstubAllGlobals();
  }
});
