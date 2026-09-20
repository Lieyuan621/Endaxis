import { buildActionSequenceMindMap } from '../skillStructureMindMapModel';
import { createRenderer, h, nextTick, shallowRef, ssrContextKey } from 'vue';
import { createI18n } from 'vue-i18n';
import { expect, it, vi } from 'vitest';
import Workspace from './ActionSequenceWorkspace.vue';
import Graph from './ActionSequenceGraphEditor.vue';
import Form from './ActionSequenceEditor.vue';

it('retains one history across graph/form unmounts and does not replay into a replaced sequence', async () => {
  vi.stubGlobal('document', { addEventListener() {}, removeEventListener() {} });
  const initial = {
    steps: [{ kind: 'finishActionOwnerAbilityEntity', parameters: {}, key: 'initial' }],
  };
  const sequence = shallowRef<any>(initial);
  let workspace: any;
  let child: any;
  const wrap = (component: any) => ({
    ...component,
    setup(props: any, ctx: any) {
      child = component.setup(props, ctx);
      return child;
    },
    render: () => null,
  });
  const graph = wrap(Graph);
  const form = wrap(Form);
  const createStep = () => initial.steps[0];
  const duplicateStep = (value: any) => structuredClone(value);
  const host = {
    ...(Workspace as any),
    setup(props: any, ctx: any) {
      workspace = (Workspace as any).setup(props, ctx);
      return workspace;
    },
    // Mount both real child setups; DOM/template layout is verified separately in browser.
    render: () =>
      h(workspace.view.value === 'graph' ? graph : form, {
        ...(workspace.view.value === 'graph'
          ? { buildRoot: buildActionSequenceMindMap, initialOverview: false }
          : {}),
        sequence: sequence.value,
        skillLevel: 1,
        createStep,
        duplicateStep,
        sharedHistory: workspace.history,
        selectedPath: workspace.graphPath.value,
        standaloneHistory: true,
      }),
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
      h(host, {
        sequence: sequence.value,
        skillLevel: 1,
        createStep,
        duplicateStep,
        onUpdate: (value: unknown) => {
          sequence.value = value;
        },
      }),
  });
  app.provide(ssrContextKey, { modules: new Set() });
  app.use(createI18n({ legacy: false, locale: 'zh-CN', messages: {} }));
  app.mount({});
  try {
    const history = workspace.history;
    child.selectNode({ id: 'action-sequence:step:0' });
    // 图中自动字段直接提交根句柄，不经步骤组件 update 转发。
    child.editContext.root
      .child('steps')
      .child(0)
      .child('key')
      .update(() => 'graph-edit');
    await nextTick();
    workspace.showDetails('steps[0]');
    await nextTick();
    expect(workspace.formPath.value).toBe('steps[0]');
    expect(child.history).toBe(history);
    child.replaceStep({ ...initial.steps[0], key: 'form-edit' }, ['key']);
    await nextTick();
    expect(workspace.navigateStructure.canNavigate(sequence.value.steps[0])).toBe(true);
    expect(workspace.view.value).toBe('form');
    expect(workspace.navigateStructure.canNavigate(initial.steps[0])).toBe(false);
    expect(workspace.navigateStructure(sequence.value.steps[0])).toBe(true);
    await nextTick();
    await nextTick();
    expect(workspace.graphPath.value).toBe('steps[0]');
    expect(child.selected.value.sourcePath).toBe('steps[0]');
    expect(workspace.navigateStructure(initial.steps[0])).toBe(false);
    expect(child.history).toBe(history);
    child.history.restore('undo');
    await nextTick();
    expect(sequence.value.steps[0].key).toBe('graph-edit');
    expect(history.restoredLocation.value).toEqual({ path: 'steps[0]', propertyPath: ['key'] });
    child.history.restore('undo');
    await nextTick();
    expect(sequence.value).toEqual(initial);
    expect(history.restoredLocation.value).toEqual({ path: 'steps[0]', propertyPath: ['key'] });
    child.history.restore('redo');
    await nextTick();
    child.history.restore('redo');
    await nextTick();
    expect(sequence.value.steps[0].key).toBe('form-edit');
    sequence.value = { steps: [] };
    await nextTick();
    expect(history.canUndo.value).toBe(false);
    expect(history.canRedo.value).toBe(false);
    // 同一个对象被两处引用时，不猜应跳向哪一处。
    const shared = { ...initial.steps[0] };
    sequence.value = { steps: [shared, shared] };
    await nextTick();
    expect(workspace.navigateStructure.canNavigate(shared)).toBe(false);
    expect(workspace.navigateStructure(shared)).toBe(false);
  } finally {
    app.unmount();
    vi.unstubAllGlobals();
  }
});
