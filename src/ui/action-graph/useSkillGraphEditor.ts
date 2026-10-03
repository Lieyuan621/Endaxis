import type { GraphInteractionSnapshot } from './graphInteractionSnapshot';
import { toRaw, computed, nextTick, onBeforeUnmount, watch, ref, shallowRef } from 'vue';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import { listNodeCreations, nodeCreationGroup } from './nodeCreation';
import { nodeName, nodeHelp } from './editorNodeText';
import { useI18n } from 'vue-i18n';
import {
  resourceEditorSelection,
  resourceGraphAddress,
  type ResourceEditorView,
} from '../editor/resourceEditorView';
import { useGraphVariables } from './useGraphVariables';
import type { SkillGraphAddress } from '../../application/editor/skillGraphCommands';
import {
  addGraphNode,
  addSkillTimelineSchedule,
  duplicateSkillTimelineSchedule,
  editGraphEntries,
  getEditableGraph,
  listGraphEntryGroups,
  listGraphPorts,
  removeGraphNode,
  removeSkillTimelineSchedule,
  moveSkillTimelineSchedule,
  replaceGraphNodeAction,
  setGraphConnection,
} from '../../application/editor/actionGraphEditing';
import ActionGraphCanvas from './ActionGraphCanvas.vue';
import ActionNodeInspector from './ActionNodeInspector.vue';
import { actionNodeTitle } from './nodePresentation';
import {
  extractResourceDataNodes,
  listDataInputs,
  dataNodeInputs,
} from '../../core/action-graph/actionGraphDataNodes';
import { updateSkillGraph } from '../../application/editor/skillGraphCommands';
import { actionTypedInputs, dataTypedInputs } from './typedGraphInputs';
import { setGraphDataInput } from '../../application/editor/graphDataInputEditing';
import DataNodeInspector from './DataNodeInspector.vue';
import BlackboardPanel from './BlackboardPanel.vue';
import { freezeGraphDocument } from '../../application/editor/immutableGraphDocument';
import { type BlackboardVariable } from '../../application/editor/graphBlackboard';
import {
  type GraphPresentation,
  type SkillGraphPresentation,
} from '../../core/project/graphPresentation';

/** 技能图的操作与选择；宿主文档独占定义、撤销历史和保存。 */
export interface SkillGraphDocument {
  readonly view: () => ResourceEditorView;
  readonly definition: () => SkillDefinition;
  readonly editable: () => boolean;
  readonly busy: () => boolean;
  readonly label: () => string;
  readonly identity: () => string;
  readonly presentation: () => SkillGraphPresentation | undefined;
  readonly change: (
    change: (skill: SkillDefinition) => SkillDefinition,
    presentation?: SkillGraphPresentation,
  ) => void;
  readonly undo: () => void;
  readonly redo: () => void;
}
export function useSkillGraphEditor(document: SkillGraphDocument) {
  const { t } = useI18n();
  const draft = computed(() => {
    const definition = document.definition();
    return { ...definition, actionGraph: extractResourceDataNodes(definition.actionGraph) };
  });
  const editable = computed(document.editable);
  const automaticPresentation = shallowRef<SkillGraphPresentation>({});
  const presentation = computed(() => ({
    ...automaticPresentation.value,
    ...document.presentation(),
    macros: { ...automaticPresentation.value.macros, ...document.presentation()?.macros },
  }));
  const address = resourceGraphAddress(document.view);
  const selection = resourceEditorSelection(document.view);
  const graphKey = computed(() =>
    address.value.kind === 'main' ? 'main' : `macro:${address.value.macroId}`,
  );
  const graph = computed(() => getEditableGraph(draft.value, address.value));
  const graphPresentation = computed(() =>
    address.value.kind === 'main'
      ? presentation.value.main
      : presentation.value.macros?.[address.value.macroId],
  );
  function changePresentation(value: GraphPresentation, userEdit: boolean) {
    if (userEdit && !editable.value) return;
    if (JSON.stringify(graphPresentation.value) === JSON.stringify(value)) return;
    const next = freezeGraphDocument(
      address.value.kind === 'main'
        ? { ...presentation.value, main: value }
        : {
            ...presentation.value,
            macros: { ...presentation.value.macros, [address.value.macroId]: value },
          },
    );
    if (userEdit) document.change(skill => skill, next);
    else automaticPresentation.value = next;
  }
  const { selectedId, selectedDataId, selectedEntryId, selectedConnection } = selection;
  const selectedDataNode = computed(() =>
    selectedDataId.value ? graph.value.dataNodes?.[selectedDataId.value] : undefined,
  );
  function selectData(id: string) {
    if (!canLeaveFields()) return;
    clearSelection();
    selectedDataId.value = id;
  }
  function applyData(expression: unknown): boolean {
    const id = selectedDataId.value;
    if (!id || !selectedDataNode.value) return false;
    return edit(skill =>
      updateSkillGraph(skill, address.value, graph => ({
        ...graph,
        dataNodes: {
          ...graph.dataNodes,
          [id]: { ...graph.dataNodes![id]!, expression } as NonNullable<
            typeof graph.dataNodes
          >[string],
        },
      })),
    );
  }
  function removeDataNode(id: string) {
    if (!canLeaveFields()) return;
    if (
      edit(skill =>
        updateSkillGraph(skill, address.value, graph => {
          const used = [
            ...Object.values(graph.nodes).flatMap(node => listDataInputs(node.action)),
            ...Object.values(graph.dataNodes ?? {}).flatMap(node => dataNodeInputs(node)),
          ].some(input => input.source === id);
          if (used) throw new Error('此数据节点仍有连线，请先从输入端断开，再删除节点。');
          const dataNodes = { ...graph.dataNodes };
          delete dataNodes[id];
          return { ...graph, dataNodes };
        }),
      )
    )
      selectedDataId.value = null;
  }
  const interactionScope = computed(() => JSON.stringify([document.identity(), graphKey.value]));
  function canUseGraphSnapshot(
    expected: GraphInteractionSnapshot = { value: graph.value, scope: interactionScope.value },
  ): boolean {
    if (!canLeaveFields()) return false;
    if (
      toRaw(expected.value) !== toRaw(graph.value) ||
      (expected.scope !== undefined && expected.scope !== interactionScope.value)
    ) {
      error.value = t('graphDataInput.ownerChanged');
      return false;
    }
    return true;
  }
  function connectData(
    owner: 'action' | 'data',
    id: string,
    path: readonly string[],
    source: string | null,
    constant?: number | boolean | string,
    expectedGraph?: GraphInteractionSnapshot,
  ): boolean {
    const previousOwner =
      owner === 'action' ? graph.value.nodes[id]?.action : graph.value.dataNodes?.[id];
    if (!canUseGraphSnapshot(expectedGraph)) return false;
    const currentOwner =
      owner === 'action' ? graph.value.nodes[id]?.action : graph.value.dataNodes?.[id];
    // A flush may reorder indexed rows. Never replay the captured old path against
    // the newly accepted owner; the user must select its refreshed input instead.
    if (previousOwner !== currentOwner) {
      error.value = t('graphDataInput.ownerChanged');
      return false;
    }
    return edit(document =>
      updateSkillGraph(document, address.value, current => {
        variables.assertConnection(current, owner, id, path, source);
        const action = current.nodes[id]?.action;
        const data = current.dataNodes?.[id];
        const input = (
          owner === 'action'
            ? action
              ? actionTypedInputs(action)
              : []
            : data
              ? dataTypedInputs(data)
              : []
        ).find(
          item =>
            item.path.length === path.length &&
            item.path.every((part, index) => part === path[index]),
        );
        if (!input) throw new Error('数据输入不存在');
        return setGraphDataInput(current, owner, id, input, source, constant);
      }),
    );
  }

  const selectedNode = computed(() =>
    selectedId.value === null ? undefined : graph.value.nodes[selectedId.value],
  );
  const canvas = ref<InstanceType<typeof ActionGraphCanvas>>();
  const inspector = ref<InstanceType<typeof ActionNodeInspector>>();
  const dataInspector = ref<InstanceType<typeof DataNodeInspector>>();
  const query = ref('');
  const nodePending = ref(false);
  const timelinePending = ref(false);
  const timelineGesture = ref(false);
  const timelineOpen = ref(true);
  const editorRoot = ref<HTMLElement>();
  const workspaceHeight = ref(900);
  const timelineHeight = ref(240);
  const visibleTimelineHeight = computed(() =>
    Math.min(timelineHeight.value, Math.max(140, workspaceHeight.value - 280)),
  );
  const resizeGesture = shallowRef<{
    pointerId: number;
    startY: number;
    height: number;
    capture: HTMLElement;
  } | null>(null);
  let workspaceObserver: ResizeObserver | undefined;
  const entryGroups = computed(() => listGraphEntryGroups(draft.value, address.value));
  const blackboardPanel = ref<InstanceType<typeof BlackboardPanel>>();
  const variables = useGraphVariables({
    graph: () => graph.value,
    roots: () =>
      entryGroups.value.flatMap(group =>
        group.entries.flatMap(entry => (entry.targetId === null ? [] : [entry.targetId])),
      ),
    parameters: () =>
      address.value.kind === 'macro'
        ? (draft.value.actionGraph.macros[address.value.macroId]?.parameters ?? [])
        : [],
    initial: () => (address.value.kind === 'main' ? (draft.value.blackboard ?? {}) : {}),
    label: () =>
      address.value.kind === 'main'
        ? t('actionGraphEditor.skillScope', { name: document.label() })
        : t('actionGraphEditor.macroScope', { name: address.value.macroId }),
    selection: selection,
  });
  const { analysis: blackboard, selectedScopes, variableKeys, blackboardContext } = variables;
  function createVariable(
    variable: BlackboardVariable,
    write: boolean,
    point?: { x: number; y: number },
    target?: {
      owner: 'action' | 'data';
      id: string;
      path: readonly string[];
      graph?: GraphInteractionSnapshot;
    },
  ) {
    const beforeTarget =
      target &&
      (target.owner === 'action'
        ? graph.value.nodes[target.id]?.action
        : graph.value.dataNodes?.[target.id]);
    if (!canUseGraphSnapshot(target?.graph)) return;
    if (
      target &&
      beforeTarget !==
        (target.owner === 'action'
          ? graph.value.nodes[target.id]?.action
          : graph.value.dataNodes?.[target.id])
    ) {
      error.value = t('graphDataInput.ownerChanged');
      return;
    }
    if (write && variable.layer === 'parameter') {
      error.value = '宏输入参数只允许读取。';
      return;
    }
    let id = '';
    const success = edit(skill =>
      updateSkillGraph(skill, address.value, graph => {
        const created = variables.createNode(graph, variable, write, target);
        id = created.id;
        return created.graph;
      }),
    );
    if (!success) return;
    if (write) selectNode(id);
    else selectData(id);
    void nextTick(() => {
      if (point) canvas.value?.placeNode(id, !write, point);
      else if (write) canvas.value?.focusNode(id);
      else canvas.value?.focusData(id);
    });
  }
  function dropVariable(
    identity: string,
    write: boolean,
    point: { x: number; y: number },
    target?: {
      owner: 'action' | 'data';
      id: string;
      path: readonly string[];
      graph?: GraphInteractionSnapshot;
    },
  ) {
    const variable = variables.resolve(identity);
    if (variable) createVariable(variable, write, point, target);
  }
  const timelineEntries = computed(
    () => entryGroups.value.find(group => group.id === 'timeline')?.entries ?? [],
  );
  const selectedEntry = computed(() =>
    entryGroups.value
      .flatMap(group => group.entries)
      .find(entry => entry.id === selectedEntryId.value),
  );
  const pending = computed(() => nodePending.value || timelinePending.value);
  const blocked = computed(
    () => pending.value || timelineGesture.value || resizeGesture.value !== null || saving.value,
  );
  const saving = computed(document.busy);
  const error = ref('');
  const nodeCreations = listNodeCreations();
  const creationItems = computed(() =>
    nodeCreations.map(item => ({
      key: item.key,
      label: nodeName(item.kind),
      group: t('actionGraphEditor.nodeGroups.' + nodeCreationGroup(item)),
    })),
  );
  function createNode(key: string, point: { x: number; y: number }) {
    if (!canLeaveFields()) return;
    const item = nodeCreations.find(item => item.key === key);
    if (!item) return;
    const data = item.category !== 'action';
    const entries = data ? (graph.value.dataNodes ?? {}) : graph.value.nodes;
    let index = 1;
    const prefix = data ? 'data' : 'node';
    while (Object.hasOwn(entries, `${prefix}_${index}`)) index++;
    const id = `${prefix}_${index}`;
    const success = edit(skill =>
      item.category === 'action'
        ? addGraphNode(skill, address.value, id, structuredClone(item.action))
        : updateSkillGraph(skill, address.value, graph => ({
            ...graph,
            dataNodes: { ...graph.dataNodes, [id]: structuredClone(item.data) },
          })),
    );
    if (success) {
      if (data) selectData(id);
      else selectNode(id);
      void nextTick(() => canvas.value?.placeNode(id, data, point));
    }
  }
  const nodes = computed(() => Object.entries(graph.value.nodes));
  const searchResults = computed(() => {
    const text = query.value.trim().toLowerCase();
    if (!text) return [];
    return nodes.value.filter(([id, node]) =>
      `${id} ${nodeName(node.action.kind)} ${nodeHelp(node.action.kind)}`
        .toLowerCase()
        .includes(text),
    );
  });
  function canLeaveFields(): boolean {
    if (timelineGesture.value || resizeGesture.value !== null || saving.value) return false;
    if (
      nodePending.value &&
      !(selectedDataId.value ? dataInspector.value?.apply() : inspector.value?.apply())
    )
      return false;
    if (!pending.value) return true;
    error.value = '当前参数尚未应用，请先应用或放弃参数修改。';
    return false;
  }
  function clearSelection() {
    if (!canLeaveFields()) return;
    selection.clear();
  }
  function selectConnection(nodeId: string | null, entryId: string | null, targetId: string) {
    if (!canLeaveFields()) return;
    selectedConnection.value = { nodeId, entryId, targetId };
  }
  function nodeLabel(id: string): string {
    const node = graph.value.nodes[id];
    return node ? actionNodeTitle(node.action.kind) : id;
  }
  function openNode(id: string) {
    if (!canLeaveFields()) return;
    const node = graph.value.nodes[id];
    if (node?.action.kind === 'callMacro')
      changeGraph({ kind: 'macro', macroId: node.action.macroId });
    else selectNode(id);
  }
  function disconnectInput(id: string, expectedGraph?: GraphInteractionSnapshot) {
    if (!canUseGraphSnapshot(expectedGraph)) return;
    // 一次断开输入的所有来源只记一次撤销，不能让半次断线暴露给界面。
    edit(skill => {
      let changed = skill;
      for (const [nodeId, node] of Object.entries(graph.value.nodes))
        for (const port of listGraphPorts(node))
          if (port.target === id)
            changed = setGraphConnection(changed, address.value, nodeId, port.path, null);
      const entries = entryGroups.value
        .flatMap(group => group.entries)
        .filter(entry => entry.targetId === id);
      if (entries.length)
        changed = editGraphEntries(
          changed,
          address.value,
          entries.map(entry => entry.id),
          { targetId: null },
        );
      return changed;
    });
  }
  function changeGraph(next: SkillGraphAddress) {
    if (!canLeaveFields()) return;
    selectedDataId.value = null;
    address.value = next;
    selectedConnection.value = null;
    selectedId.value = null;
    selectedEntryId.value = null;
    query.value = '';
    error.value = '';
  }
  function selectNode(id: string) {
    if (!canLeaveFields()) return;
    selectedId.value = id;
    error.value = '';
  }
  function selectEntry(id: string): boolean {
    if (selectedEntryId.value === id) return true;
    if (!canLeaveFields()) return false;
    selectedEntryId.value = id;
    error.value = '';
    return true;
  }
  async function focusEntry(id: string) {
    if (!canLeaveFields()) return;
    selectEntry(id);
    await nextTick();
    canvas.value?.focusEntry(id);
  }
  async function focusNode(id: string | null) {
    if (id === null || !canLeaveFields()) return;
    selectNode(id);
    await nextTick();
    canvas.value?.focusNode(id);
  }
  function edit(update: (skill: SkillDefinition) => SkillDefinition): boolean {
    if (!editable.value) return false;
    try {
      const next = update(draft.value);
      if (next !== draft.value) {
        selectedConnection.value = null;
        document.change(() => next);
      }
      error.value = '';
      return true;
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause);
      return false;
    }
  }
  function applyAction(action: unknown): boolean {
    const id = selectedId.value;
    return id !== null && edit(skill => replaceGraphNodeAction(skill, address.value, id, action));
  }
  function connect(
    nodeId: string,
    path: readonly string[],
    target: string | null,
    expectedGraph?: GraphInteractionSnapshot,
  ) {
    if (!canUseGraphSnapshot(expectedGraph)) return;
    edit(skill => setGraphConnection(skill, address.value, nodeId, path, target));
  }
  function connectEntry(
    ids: readonly string[],
    target: string | null,
    expectedGraph?: GraphInteractionSnapshot,
  ) {
    if (!canUseGraphSnapshot(expectedGraph)) return;
    edit(skill => editGraphEntries(skill, address.value, ids, { targetId: target }));
  }
  function applyTimelineTime(id: string, startFrame: number, endFrame: number | null): boolean {
    if (address.value.kind !== 'main' || nodePending.value || saving.value) return false;
    return edit(skill => editGraphEntries(skill, { kind: 'main' }, [id], { startFrame, endFrame }));
  }
  function openTimeline() {
    if (!canLeaveFields() || address.value.kind !== 'main') return;
    timelineOpen.value = true;
    void nextTick(() => canvas.value?.focusTimeline());
  }
  function closeTimeline() {
    if (canLeaveFields()) timelineOpen.value = false;
  }
  function timelineIndex(id: string): number {
    const match = /^timeline:(\d+)$/.exec(id);
    if (!match) throw new Error('请选择施放时间线中的调度项。');
    return Number(match[1]);
  }
  function editTimelineStructure(
    update: (skill: SkillDefinition) => SkillDefinition,
    selectedIndex: number,
  ) {
    if (address.value.kind !== 'main' || !canLeaveFields()) return;
    if (!edit(update)) return;
    // 调度项以数组下标定位，增删换序后不能沿用旧下标上的待完成连线。
    canvas.value?.cancelConnection();
    selectedId.value = null;
    selectedEntryId.value =
      draft.value.scheduledSequences.length === 0
        ? null
        : `timeline:${Math.min(selectedIndex, draft.value.scheduledSequences.length - 1)}`;
  }
  function addTimelineSchedule(frame: number) {
    editTimelineStructure(
      skill => addSkillTimelineSchedule(skill, frame),
      draft.value.scheduledSequences.length,
    );
  }
  function duplicateTimelineSchedule(id: string) {
    const index = timelineIndex(id);
    editTimelineStructure(skill => duplicateSkillTimelineSchedule(skill, index), index + 1);
  }
  function removeTimelineSchedule(id: string) {
    const index = timelineIndex(id);
    editTimelineStructure(skill => removeSkillTimelineSchedule(skill, index), index);
  }
  function reorderTimelineSchedule(id: string, toIndex: number) {
    editTimelineStructure(
      skill => moveSkillTimelineSchedule(skill, timelineIndex(id), toIndex),
      toIndex,
    );
  }
  function removeSelectedNode(id: string | null = selectedId.value) {
    if (id !== null && canLeaveFields() && edit(skill => removeGraphNode(skill, address.value, id)))
      selectedId.value = null;
  }
  function undo() {
    if (!canLeaveFields()) return;
    canvas.value?.cancelConnection();
    document.undo();
    clearSelection();
  }
  function redo() {
    if (!canLeaveFields()) return;
    canvas.value?.cancelConnection();
    document.redo();
    clearSelection();
  }
  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && resizeGesture.value) {
      event.preventDefault();
      event.stopPropagation();
      cancelTimelineResize();
      return;
    }
    if ((event.target as HTMLElement).closest('input,textarea,select,[contenteditable]')) return;
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key.toLowerCase() === 'z') {
      event.preventDefault();
      event.stopPropagation();
      event.shiftKey ? redo() : undo();
    } else if (event.key.toLowerCase() === 'y') {
      event.preventDefault();
      event.stopPropagation();
      redo();
    }
  }
  function startTimelineResize(event: PointerEvent) {
    if (event.button !== 0 || timelineGesture.value || resizeGesture.value !== null || saving.value)
      return;
    const capture = event.currentTarget as HTMLElement;
    event.preventDefault();
    capture.focus({ preventScroll: true });
    capture.setPointerCapture(event.pointerId);
    resizeGesture.value = {
      pointerId: event.pointerId,
      startY: event.clientY,
      height: visibleTimelineHeight.value,
      capture,
    };
  }
  function moveTimelineResize(event: PointerEvent) {
    const drag = resizeGesture.value;
    if (!drag || drag.pointerId !== event.pointerId) return;
    timelineHeight.value = Math.max(
      140,
      Math.min(workspaceHeight.value - 280, drag.height + drag.startY - event.clientY),
    );
  }
  function endTimelineResize(event?: PointerEvent) {
    const drag = resizeGesture.value;
    if (event && drag?.pointerId !== event.pointerId) return;
    resizeGesture.value = null;
    if (drag?.capture.hasPointerCapture(drag.pointerId))
      drag.capture.releasePointerCapture(drag.pointerId);
  }
  function cancelTimelineResize(event?: Event) {
    if (event instanceof PointerEvent && resizeGesture.value?.pointerId !== event.pointerId) return;
    if (resizeGesture.value) timelineHeight.value = resizeGesture.value.height;
    endTimelineResize();
  }
  function resizeTimelineByKey(event: KeyboardEvent) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    timelineHeight.value = Math.max(
      140,
      Math.min(
        workspaceHeight.value - 280,
        visibleTimelineHeight.value + (event.key === 'ArrowUp' ? 24 : -24),
      ),
    );
  }
  watch(
    editorRoot,
    root => {
      workspaceObserver?.disconnect();
      if (root) {
        workspaceHeight.value = root.clientHeight;
        workspaceObserver = new ResizeObserver(entries => {
          const height = entries[0]?.contentRect.height;
          if (height !== undefined) workspaceHeight.value = height;
        });
        workspaceObserver.observe(root);
      }
    },
    { flush: 'post' },
  );
  window.addEventListener('blur', cancelTimelineResize);
  onBeforeUnmount(() => {
    cancelTimelineResize();
    workspaceObserver?.disconnect();
    window.removeEventListener('blur', cancelTimelineResize);
  });
  watch(document.identity, () => {
    cancelTimelineResize();
    nodePending.value = timelinePending.value = timelineGesture.value = false;
    automaticPresentation.value = {};
    query.value = error.value = '';
  });
  return {
    draft,
    editable,
    address,
    graphKey,
    interactionScope,
    graph,
    graphPresentation,
    changePresentation,
    selectedId,
    selectedDataId,
    selectedScopes,
    selectedDataNode,
    selectData,
    applyData,
    removeDataNode,
    connectData,
    selectedEntryId,
    selectedConnection,
    selectedNode,
    canvas,
    inspector,
    dataInspector,
    query,
    nodePending,
    timelinePending,
    timelineGesture,
    timelineOpen,
    editorRoot,
    workspaceHeight,
    timelineHeight,
    visibleTimelineHeight,
    resizeGesture,
    entryGroups,
    blackboardPanel,
    variableKeys,
    blackboardContext,
    blackboard,
    createVariable,
    dropVariable,
    timelineEntries,
    selectedEntry,
    pending,
    blocked,
    saving,
    error,
    nodeCreations,
    creationItems,
    createNode,
    nodes,
    searchResults,
    canLeaveFields,
    clearSelection,
    selectConnection,
    nodeLabel,
    openNode,
    disconnectInput,
    changeGraph,
    selectNode,
    selectEntry,
    focusEntry,
    focusNode,
    edit,
    applyAction,
    connect,
    connectEntry,
    applyTimelineTime,
    openTimeline,
    closeTimeline,
    timelineIndex,
    editTimelineStructure,
    addTimelineSchedule,
    duplicateTimelineSchedule,
    removeTimelineSchedule,
    reorderTimelineSchedule,
    removeSelectedNode,
    undo,
    redo,
    onKeydown,
    startTimelineResize,
    moveTimelineResize,
    endTimelineResize,
    cancelTimelineResize,
    resizeTimelineByKey,
  };
}
