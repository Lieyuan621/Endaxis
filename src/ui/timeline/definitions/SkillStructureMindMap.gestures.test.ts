import { createRenderer, defineComponent, h, markRaw, nextTick, ref, ssrContextKey } from 'vue';
import type { ComponentOptions } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SkillStructureMindMap from './SkillStructureMindMap.vue';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import type { InteractionSession } from '../../interaction/interactionSession';
import { usePopoverInteractionBoundary } from '../../interaction/usePopoverInteractionBoundary';
import { useEditorHistoryShortcuts } from '../../keyboard/useEditorHistoryShortcuts';
import { createDefinitionViewState, definitionViewStateKey } from './definitionViewState';
import { presentStructureMap } from './structureMapPresentation';
import { buildActionSequenceMindMap } from './skillStructureMindMapModel';

// Mount production setup/lifecycle with a host renderer. Vitest compiles SFCs
// for SSR, so templates are not executed here: this tests handler state and
// injection, not native DnD dispatch, template wiring, undo history or layout.
class Host {
  parent: Host | null = null;
  children: Host[] = [];
  props: Record<string, any> = {};
  scrollLeft = 0;
  scrollTop = 0;
  captures = new Set<number>();
  constructor(
    public tag: string,
    public text = '',
  ) {}
  closest() {
    return null;
  }
  contains(target: Host): boolean {
    return this === target || this.children.some(c => c.contains(target));
  }
  getBoundingClientRect() {
    return { top: 0, height: 50 };
  }
  setPointerCapture(id: number) {
    this.captures.add(id);
  }
  hasPointerCapture(id: number) {
    return this.captures.has(id);
  }
  releasePointerCapture(id: number) {
    this.captures.delete(id);
  }
}
const renderer = createRenderer<Host, Host>({
  createElement: tag => new Host(tag),
  createText: text => new Host('#text', text),
  createComment: text => new Host('#comment', text),
  setText: (node, text) => {
    node.text = text;
  },
  setElementText: (node, text) => {
    node.text = text;
  },
  parentNode: node => node.parent,
  nextSibling: node => node.parent?.children[node.parent.children.indexOf(node) + 1] ?? null,
  patchProp: (node, key, _old, value) => {
    node.props[key] = value;
  },
  insert: (node, parent, anchor) => {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
    node.parent = parent;
    const index = anchor ? parent.children.indexOf(anchor) : -1;
    parent.children.splice(index < 0 ? parent.children.length : index, 0, node);
  },
  remove: node => {
    node.parent?.children.splice(node.parent.children.indexOf(node), 1);
    node.parent = null;
  },
});
function event(extra = {}) {
  return { preventDefault: vi.fn(), stopPropagation: vi.fn(), ...extra };
}
const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach(f => f());
  vi.unstubAllGlobals();
});

async function mount(view?: { selectedId: string; savedId: string }) {
  vi.stubGlobal('document', new EventTarget());
  vi.stubGlobal('window', new EventTarget());
  // Drag events below deliberately use a non-Element source: observer lifecycle
  // is tested separately in nativeDragLifecycle.test.ts.
  vi.stubGlobal('Element', class {});
  vi.stubGlobal('Node', Host);
  let session!: InteractionSession;
  let state: any;
  const move = vi.fn();
  const nodeAction = vi.fn();
  const history = vi.fn();
  const select = vi.fn();
  const editorRoot = ref<HTMLElement | null>(null);
  const pickerOpen = ref(false);
  const child = (id: string) => ({
    id,
    label: id,
    kind: '动作序列',
    summary: '',
    sourcePath: id,
    details: {},
    children: [],
    payloadKind: 'scheduledSequence' as const,
  });
  const root = { ...child('root'), children: [child('first'), child('second')] };
  const Probe = defineComponent({
    setup() {
      session = useInteractionSession();
      useEditorHistoryShortcuts(editorRoot, action => history(action));
      usePopoverInteractionBoundary(
        session,
        () => pickerOpen.value,
        () => {
          pickerOpen.value = false;
        },
      );
      return () =>
        h(
          {
            ...(SkillStructureMindMap as ComponentOptions),
            setup(props: any, context: any) {
              state = (SkillStructureMindMap as any).setup(props, context);
              return state;
            },
            render: () => null,
          },
          {
            root,
            onMoveNode: move,
            onHistoryAction: history,
            onNodeAction: nodeAction,
            selectedId: view?.selectedId,
            viewStateKey: view ? 'qa' : undefined,
            onSelect: select,
          },
        );
    },
  });
  const Boundary = {
    ...(InputRegionBoundary as ComponentOptions),
    render: (ctx: any) => ctx.$slots.default(),
  };
  const app = renderer.createApp({
    render: () =>
      h(Boundary, { label: 'test-modal', active: true, modal: true }, { default: () => h(Probe) }),
  });
  const host = new Host('root');
  app.provide(ssrContextKey, {});
  if (view) {
    const views = createDefinitionViewState();
    views.write('qa', { zoom: 0.9, collapsedIds: [], left: 0, top: 0, selectedId: view.savedId });
    app.provide(definitionViewStateKey, views);
  }
  app.mount(host);
  let mounted = true;
  const unmount = () => {
    if (mounted) {
      mounted = false;
      app.unmount();
    }
  };
  cleanups.push(unmount);
  await nextTick();
  const source = new Host('source');
  const target = new Host('target');
  target.props.onContextmenu = (e: unknown) => state.openContextMenu(e, root.children[1]);
  const handle = new Host('handle');
  handle.props.onDragend = state.endNodeDrag;
  // Real DOM nodes are not proxied by Vue refs; keep the host node identity too.
  const viewport = markRaw(new Host('viewport'));
  state.viewport.value = viewport;
  state.shell.value = viewport;
  const inspector = markRaw(new Host('inspector'));
  const workspace = markRaw(new Host('workspace'));
  workspace.children = [viewport, inspector];
  editorRoot.value = workspace as unknown as HTMLElement;
  viewport.props.onPointerdown = state.startPan;
  viewport.props.onLostpointercapture = state.endPan;
  const start = () =>
    state.startNodeDrag(event({ dataTransfer: { setData: vi.fn() } }), root.children[0]);
  const drop = () =>
    state.dropOnNode(event({ currentTarget: target, clientY: 40 }), root.children[1]);
  const focus = () => state.trackActive({ type: 'focusin', target: viewport });
  const focusInspector = () => {
    const focusEvent = new Event('focusin');
    Object.defineProperty(focusEvent, 'target', { value: inspector });
    document.dispatchEvent(focusEvent);
  };
  return {
    session,
    state,
    move,
    nodeAction,
    history,
    select,
    pickerOpen,
    unmount,
    focus,
    focusInspector,
    start,
    drop,
    handle,
    source,
    target,
    viewport,
  };
}

it('单序列父节点的粘贴和向内拖放使用真实端口，复制仍使用父节点', async () => {
  const probe = await mount();
  const graph = presentStructureMap(
    buildActionSequenceMindMap({
      steps: [
        { kind: 'finishCurrentAbilityEntity', parameters: {} },
        { kind: 'once', parameters: { scopeKey: 'test' }, body: { steps: [] } },
      ],
    }),
  );
  const source = graph.children[0]!;
  const parent = graph.children[1]!;
  probe.state.runNodeAction('copy', parent);
  expect(probe.nodeAction).toHaveBeenLastCalledWith('copy', parent);
  probe.state.runNodeAction('paste', parent);
  expect(probe.nodeAction).toHaveBeenLastCalledWith('paste', parent.childActionTarget);
  probe.state.startNodeDrag(event({ dataTransfer: { setData: vi.fn() } }), source);
  probe.state.dropOnNode(event({ currentTarget: probe.target, clientY: 40 }), parent);
  expect(probe.move).toHaveBeenCalledWith({
    source,
    target: parent.childActionTarget,
    placement: 'inside',
  });
});

it('restores a remembered object selection without overriding an explicit target or selecting a missing node', async () => {
  const returned = await mount({ selectedId: 'root', savedId: 'first' });
  expect(returned.select).toHaveBeenCalledWith(expect.objectContaining({ id: 'first' }));
  returned.unmount();
  const explicit = await mount({ selectedId: 'second', savedId: 'first' });
  expect(explicit.select).not.toHaveBeenCalled();
  explicit.unmount();
  const removed = await mount({ selectedId: 'root', savedId: 'removed' });
  expect(removed.select).not.toHaveBeenCalled();
});

function keydown(key: string, extra = {}) {
  const event = new Event('keydown', { cancelable: true });
  for (const [name, value] of Object.entries({ key, ...extra }))
    Object.defineProperty(event, name, { value });
  window.dispatchEvent(event);
  return event;
}

it('deletes explicitly deletable nodes independently of clipboard payload support', async () => {
  const { state, nodeAction } = await mount();
  const node = { id: 'window', sourcePath: 'inputWindows.commandMappings[0]', canDelete: true };
  state.contextMenu.value = { node, x: 0, y: 0 };
  expect(state.handleKeyboard({ key: 'Delete', target: null })).toBe(true);
  expect(nodeAction).toHaveBeenCalledWith('delete', node);
  state.contextMenu.value = { node: { ...node, canDelete: false }, x: 0, y: 0 };
  expect(state.handleKeyboard({ key: 'Delete', target: null })).toBe(false);
  expect(nodeAction).toHaveBeenCalledTimes(1);
});

describe('mounted structure map gesture ownership', () => {
  it('preserves the wheel anchor through the real zoom handler including stage offset', async () => {
    const f = await mount();
    f.viewport.getBoundingClientRect = () => ({ left: 20, top: 30, height: 150 });
    f.viewport.scrollLeft = 200;
    f.viewport.scrollTop = 180;
    f.state.stage.value = markRaw({ offsetLeft: 0, offsetTop: 22 });
    const wheel = event({ ctrlKey: true, clientX: 130, clientY: 100, deltaY: -1 });
    const before = (180 + 70 - 22) / 0.9;
    await f.state.zoomAtPointer(wheel);
    expect(wheel.preventDefault).toHaveBeenCalledOnce();
    expect(f.state.zoom.value).toBe(1);
    expect((f.viewport.scrollTop + 70 - 22) / f.state.zoom.value).toBeCloseTo(before);
    await f.state.zoomAtPointer(event({ metaKey: true, clientX: 130, clientY: 100, deltaY: 1 }));
    expect(f.viewport.scrollTop).toBeCloseTo(180);
    expect(f.viewport.scrollLeft).toBeCloseTo(200);
  });

  it('routes history from the inspector without allowing it through a picker', async () => {
    const f = await mount();
    f.focusInspector();
    keydown('z', { ctrlKey: true });
    expect(f.history.mock.calls).toEqual([['undo']]);
    f.pickerOpen.value = true;
    keydown('z', { ctrlKey: true });
    expect(f.history).toHaveBeenCalledOnce();
    keydown('Escape');
    keydown('y', { ctrlKey: true });
    expect(f.history.mock.calls).toEqual([['undo'], ['redo']]);
  });

  it('routes Escape to the current gesture, then restores map history commands', async () => {
    const f = await mount();
    f.focus();
    f.start();
    keydown('z', { ctrlKey: true });
    expect(f.history).not.toHaveBeenCalled();
    expect(keydown('Escape').defaultPrevented).toBe(true);
    expect(f.session.current).toBeNull();
    f.drop();
    expect(f.move).not.toHaveBeenCalled();
    keydown('z', { ctrlKey: true });
    keydown('z', { ctrlKey: true, shiftKey: true });
    expect(f.history.mock.calls).toEqual([['undo'], ['redo']]);
  });

  it('a nested picker cancels the gesture, owns Escape and releases map commands on close', async () => {
    const f = await mount();
    f.focus();
    f.start();
    f.pickerOpen.value = true;
    expect(f.session.current).toBeNull();
    keydown('z', { ctrlKey: true });
    expect(f.history).not.toHaveBeenCalled();
    expect(keydown('Escape').defaultPrevented).toBe(true);
    expect(f.pickerOpen.value).toBe(false);
    f.start();
    f.drop();
    expect(f.move).toHaveBeenCalledOnce();
    keydown('z', { ctrlKey: true });
    expect(f.history).toHaveBeenCalledWith('undo');
  });

  it('unmount cancels the pan and late pointer events cannot resume it', async () => {
    const f = await mount();
    const pointer = event({
      target: f.viewport,
      button: 0,
      pointerId: 1,
      clientX: 20,
      clientY: 20,
    });
    f.viewport.props.onPointerdown(pointer);
    expect(f.viewport.hasPointerCapture(1)).toBe(true);
    f.unmount();
    expect(f.viewport.hasPointerCapture(1)).toBe(false);
    expect(f.session.current).toBeNull();
    f.viewport.props.onLostpointercapture(pointer);
    expect(f.session.current).toBeNull();
  });

  it('commits one compatible drop and releases the modal lease before another gesture', async () => {
    const f = await mount();
    f.start();
    expect(f.session.current?.owner).toBe('structure-node-move');
    f.drop();
    expect(f.move).toHaveBeenCalledOnce();
    expect(f.move.mock.calls[0]![0]).toMatchObject({
      source: { id: 'first' },
      target: { id: 'second' },
      placement: 'after',
    });
    expect(f.session.current).toBeNull();
    f.handle.props.onDragend(event());
    f.drop();
    expect(f.move).toHaveBeenCalledOnce();
  });

  it('never commits a drop after a foreground barrier cancels the drag', async () => {
    const f = await mount();
    f.start();
    const release = f.session.block();
    f.drop();
    expect(f.move).not.toHaveBeenCalled();
    release();
    f.start();
    f.drop();
    expect(f.move).toHaveBeenCalledOnce();
  });

  it('cancels a node drag when its context menu opens', async () => {
    const f = await mount();
    f.start();
    f.target.props.onContextmenu(event({ clientX: 0, clientY: 0 }));
    expect(f.session.current).toBeNull();
    f.drop();
    expect(f.move).not.toHaveBeenCalled();
    expect(f.session.tryStart('other', vi.fn())).toBeNull();
    const escape = new Event('keydown', { cancelable: true });
    Object.defineProperty(escape, 'key', { value: 'Escape' });
    window.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    f.start();
    f.drop();
    expect(f.move).toHaveBeenCalledOnce();
  });

  it('clears pointer capture and the lease when a pan loses capture', async () => {
    const f = await mount();
    const pointer = event({
      target: f.viewport,
      button: 0,
      pointerId: 1,
      clientX: 50,
      clientY: 50,
    });
    f.viewport.props.onPointerdown(pointer);
    expect(f.session.current?.owner).toBe('structure-pan');
    f.viewport.props.onLostpointercapture(pointer);
    expect(f.session.current).toBeNull();
    expect(f.viewport.hasPointerCapture(1)).toBe(false);
  });
});
