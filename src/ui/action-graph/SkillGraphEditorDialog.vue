<script setup lang="ts">
/** 编辑当前技能块的完整技能图；草稿就是正式定义，保存时只提交一次场景事务。 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, toRaw } from 'vue';
import { EaButton, EaDialog } from '@/design-system';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import { listNodeCreations, nodeCreationGroup } from './nodeCreation';
import { nodeName, nodeHelp } from './editorNodeText';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
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
import InputRegionBoundary from '../keyboard/InputRegionBoundary.vue';
import {
  useInteractionBarrier,
  useInteractionSession,
} from '../interaction/interactionSessionContext';
import ActionGraphCanvas from './ActionGraphCanvas.vue';
import ActionNodeInspector from './ActionNodeInspector.vue';
import SkillTimelinePanel from './SkillTimelinePanel.vue';
import { actionNodeTitle } from './nodePresentation';
import {
  extractResourceDataNodes,
  listDataInputs,
  dataNodeInputs,
} from '../../core/action-graph/actionGraphDataNodes';
import { updateSkillGraph } from '../../application/editor/skillGraphCommands';
import { writeNodeField } from './nodeFieldValues';
import DataNodeInspector from './DataNodeInspector.vue';
import BlackboardPanel from './BlackboardPanel.vue';
import {
  freezeGraphDocument,
  copyCustomGraphDocument,
} from '../../application/editor/immutableGraphDocument';
import {
  analyzeGraphBlackboard,
  blackboardScopeWarnings,
  type BlackboardVariable,
} from '../../application/editor/graphBlackboard';
import {
  readGraphPresentation,
  type GraphPresentation,
  type SkillGraphPresentation,
} from '../../core/project/graphPresentation';

const props = defineProps<{
  definition: SkillDefinition;
  custom: boolean;
  label: string;
  presentation?: SkillGraphPresentation;
  saveDefinition: (
    definition: SkillDefinition,
    presentation: SkillGraphPresentation,
    createCustom: boolean,
  ) => void | Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
useInteractionBarrier(useInteractionSession(), () => true);

// 只保存被改动的图与字段。撤销历史共享其余不可变数据，不反复复制整份干员。
const sourceDefinition = freezeGraphDocument(toRaw(props.definition));
const initialDefinition = freezeGraphDocument({
  ...sourceDefinition,
  actionGraph: extractResourceDataNodes(props.definition.actionGraph),
});
const draft = shallowRef<SkillDefinition>(initialDefinition);
const editable = ref(props.custom);
function customize() {
  if (editable.value) return;
  const copy = copyCustomGraphDocument(sourceDefinition);
  draft.value = freezeGraphDocument({
    ...copy,
    actionGraph: extractResourceDataNodes(copy.actionGraph),
  });
  editable.value = true;
  past.value = [];
  future.value = [];
}
// 排版仅属于当前技能块。没有保存过坐标的新技能块使用当前布局规则。
const presentation = shallowRef(
  freezeGraphDocument(readGraphPresentation(props.custom ? props.presentation : undefined)),
);
type Snapshot = {
  definition: SkillDefinition;
  presentation: SkillGraphPresentation;
  layoutEdited: boolean;
};
const snapshot = (): Snapshot => ({
  definition: draft.value,
  presentation: presentation.value,
  layoutEdited: layoutEdited.value,
});
function restore(value: Snapshot) {
  draft.value = value.definition;
  presentation.value = value.presentation;
  layoutEdited.value = value.layoutEdited;
}
const past = shallowRef<readonly Snapshot[]>([]);
const future = shallowRef<readonly Snapshot[]>([]);
const layoutEdited = ref(false);
const address = shallowRef<SkillGraphAddress>({ kind: 'main' });
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
  if (userEdit) {
    past.value = [...past.value.slice(-29), snapshot()];
    future.value = [];
    layoutEdited.value = true;
  }
  presentation.value = freezeGraphDocument(
    address.value.kind === 'main'
      ? { ...presentation.value, main: value }
      : {
          ...presentation.value,
          macros: { ...presentation.value.macros, [address.value.macroId]: value },
        },
  );
}
const selectedId = ref<string | null>(null);
const selectedDataId = ref<string | null>(null);
const selectedScopes = computed(() => {
  const contexts = selectedId.value
    ? blackboard.value.contexts.get(selectedId.value)
    : selectedDataId.value
      ? blackboard.value.dataContexts.get(selectedDataId.value)
      : undefined;
  return [...(contexts ?? [])].flatMap(id => {
    const scope = blackboard.value.scopes.get(id);
    return scope ? [scope] : [];
  });
});
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
          ...Object.values(graph.dataNodes ?? {}).flatMap(dataNodeInputs),
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
function connectData(
  owner: 'action' | 'data',
  id: string,
  path: readonly string[],
  source: string | null,
  constant?: number | boolean,
) {
  if (!canLeaveFields()) return;
  edit(skill =>
    updateSkillGraph(skill, address.value, graph => {
      const target =
        owner === 'action' ? graph.nodes[id]!.action : graph.dataNodes![id]!.expression;
      const input = (
        owner === 'action' ? listDataInputs(target) : dataNodeInputs(graph.dataNodes![id]!)
      ).find(input => JSON.stringify(input.path) === JSON.stringify(path));
      if (!input) throw new Error('数据输入不存在');
      const node = source === null ? null : graph.dataNodes?.[source];
      if (source !== null && (!node || node.type !== input.type))
        throw new Error('数据引脚类型不一致');
      const value =
        source === null
          ? { kind: 'constant', value: constant ?? (input.type === 'boolean' ? false : 0) }
          : { kind: input.type === 'boolean' ? 'conditionNode' : 'valueNode', nodeId: source };
      const changed = writeNodeField(target, path, value);
      return owner === 'action'
        ? {
            ...graph,
            nodes: {
              ...graph.nodes,
              [id]: {
                ...graph.nodes[id]!,
                action: changed as (typeof graph.nodes)[string]['action'],
              },
            },
          }
        : {
            ...graph,
            dataNodes: {
              ...graph.dataNodes,
              [id]: { ...graph.dataNodes![id]!, expression: changed } as NonNullable<
                typeof graph.dataNodes
              >[string],
            },
          };
    }),
  );
}
const selectedEntryId = ref<string | null>(null);
const selectedConnection = ref<{
  nodeId: string | null;
  entryId: string | null;
  targetId: string;
} | null>(null);
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
const variableKeys = computed(() => {
  const expression = selectedDataNode.value?.expression;
  const environments = selectedDataId.value
    ? blackboard.value.dataContexts.get(selectedDataId.value)
    : undefined;
  const keys = blackboard.value.variables
    .filter(v => {
      if (expression?.kind === 'parameter') return v.layer === 'parameter';
      return (
        v.layer !== 'parameter' &&
        (!environments?.size || v.scope === 'current' || environments.has(v.scope))
      );
    })
    .map(v => v.key);
  if (expression?.kind === 'blackboard') keys.push(expression.key);
  if (expression?.kind === 'parameter') keys.push(expression.parameter);
  return [...new Set(keys)];
});
const blackboard = computed(() =>
  analyzeGraphBlackboard(
    graph.value,
    entryGroups.value.flatMap(g =>
      g.entries.flatMap(e => (e.targetId === null ? [] : [e.targetId])),
    ),
    address.value.kind === 'macro'
      ? draft.value.actionGraph.macros[address.value.macroId]?.parameters
      : [],
    address.value.kind === 'main' ? draft.value.blackboard : {},
    address.value.kind === 'main'
      ? t('actionGraphEditor.skillScope', { name: props.label })
      : t('actionGraphEditor.macroScope', { name: address.value.macroId }),
  ),
);
function createVariable(
  variable: BlackboardVariable,
  write: boolean,
  point?: { x: number; y: number },
  target?: { owner: 'action' | 'data'; id: string; path: readonly string[] },
) {
  if (!canLeaveFields()) return;
  if (write && variable.layer === 'parameter') {
    error.value = '宏输入参数只允许读取。';
    return;
  }
  let id = '';
  const success = edit(skill =>
    updateSkillGraph(skill, address.value, graph => {
      let i = 1;
      const collection = write ? graph.nodes : (graph.dataNodes ?? {});
      do {
        id = `${write ? 'node' : 'data'}_${i++}`;
      } while (Object.hasOwn(collection, id));
      if (write)
        return {
          ...graph,
          nodes: {
            ...graph.nodes,
            [id]: {
              action: {
                kind: 'modifyActionValue',
                parameters: {
                  key: variable.key,
                  operation: 'assign',
                  value: { kind: 'constant', value: 0 },
                },
              },
              next: null,
            },
          },
        };
      const created = {
        ...graph,
        dataNodes: {
          ...graph.dataNodes,
          [id]: {
            type: 'number' as const,
            expression:
              variable.layer === 'parameter'
                ? { kind: 'parameter' as const, parameter: variable.key }
                : { kind: 'blackboard' as const, key: variable.key },
          },
        },
      };
      if (!target) return created;
      const environments =
        target.owner === 'action'
          ? blackboard.value.contexts.get(target.id)
          : blackboard.value.dataContexts.get(target.id);
      if (
        variable.scope !== 'current' &&
        environments?.size &&
        [...environments].some(scope => scope !== variable.scope)
      )
        throw new Error('该变量来自另一局部调用环境，不能在这里自动创建同名读取。');
      return writeNodeField(
        created,
        target.owner === 'action'
          ? ['nodes', target.id, 'action', ...target.path]
          : ['dataNodes', target.id, 'expression', ...target.path],
        { kind: 'valueNode', nodeId: id },
      ) as typeof created;
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
  target?: { owner: 'action' | 'data'; id: string; path: readonly string[] },
) {
  const variable = blackboardPanel.value?.resolve(identity);
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
const saving = ref(false);
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
  selectedDataId.value = null;
  selectedId.value = null;
  selectedEntryId.value = null;
  selectedConnection.value = null;
}
function selectConnection(nodeId: string | null, entryId: string | null, targetId: string) {
  if (!canLeaveFields()) return;
  selectedDataId.value = null;
  selectedId.value = null;
  selectedEntryId.value = null;
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
function disconnectInput(id: string) {
  if (!canLeaveFields()) return;
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
  selectedDataId.value = null;
  selectedId.value = id;
  selectedConnection.value = null;
  selectedEntryId.value = null;
  error.value = '';
}
function selectEntry(id: string): boolean {
  selectedDataId.value = null;
  if (selectedEntryId.value === id) return true;
  if (!canLeaveFields()) return false;
  selectedId.value = null;
  selectedConnection.value = null;
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
      past.value = [...past.value.slice(-29), snapshot()];
      future.value = [];
      draft.value = freezeGraphDocument(next);
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
function connect(nodeId: string, path: readonly string[], target: string | null) {
  if (!canLeaveFields()) return;
  edit(skill => setGraphConnection(skill, address.value, nodeId, path, target));
}
function connectEntry(ids: readonly string[], target: string | null) {
  if (!canLeaveFields()) return;
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
  if (!canLeaveFields() || past.value.length === 0) return;
  canvas.value?.cancelConnection();
  selectedConnection.value = null;
  selectedDataId.value = null;
  future.value = [...future.value, snapshot()];
  restore(past.value[past.value.length - 1]!);
  past.value = past.value.slice(0, -1);
  selectedId.value = null;
  selectedEntryId.value = null;
  error.value = '';
}
function redo() {
  if (!canLeaveFields() || future.value.length === 0) return;
  canvas.value?.cancelConnection();
  selectedConnection.value = null;
  selectedDataId.value = null;
  past.value = [...past.value, snapshot()];
  restore(future.value[future.value.length - 1]!);
  future.value = future.value.slice(0, -1);
  selectedId.value = null;
  selectedEntryId.value = null;
  error.value = '';
}
async function save() {
  if (!editable.value || !canLeaveFields() || saving.value) return;
  saving.value = true;
  try {
    await props.saveDefinition(
      draft.value === initialDefinition ? props.definition : draft.value,
      presentation.value,
      !props.custom,
    );
    emit('close');
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause);
  } finally {
    saving.value = false;
  }
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
    event.shiftKey ? redo() : undo();
  } else if (event.key.toLowerCase() === 'y') {
    event.preventDefault();
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
onMounted(() => {
  if (editorRoot.value) {
    workspaceHeight.value = editorRoot.value.clientHeight;
    workspaceObserver = new ResizeObserver(entries => {
      const height = entries[0]?.contentRect.height;
      if (height !== undefined) workspaceHeight.value = height;
    });
    workspaceObserver.observe(editorRoot.value);
  }
  window.addEventListener('blur', cancelTimelineResize);
});
onBeforeUnmount(() => {
  cancelTimelineResize();
  workspaceObserver?.disconnect();
  window.removeEventListener('blur', cancelTimelineResize);
});
</script>

<template>
  <InputRegionBoundary label="skill-graph-editor" :active="true" modal>
    <EaDialog
      :model-value="true"
      class="skill-graph-dialog"
      size="full"
      fullscreen
      :title="`技能图 · ${label}`"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :busy="saving"
      @update:model-value="emit('close')"
    >
      <div ref="editorRoot" class="skill-graph-editor" @keydown="onKeydown">
        <header class="editor-toolbar">
          <strong :title="definition.key">技能图 · {{ label }}</strong>
          <span class="scope-hint">{{
            editable ? '自定义图 · 仅修改当前技能块' : '库图 · 只读'
          }}</span>
          <span class="spacer" />
          <EaButton
            v-if="address.kind === 'main'"
            size="sm"
            :disabled="blocked"
            @click="timelineOpen ? closeTimeline() : openTimeline()"
          >
            {{ timelineOpen ? '收起时间线' : editable ? '编辑时间线' : '查看时间线' }}
          </EaButton>
          <EaButton v-if="!editable" size="sm" variant="primary" @click="customize"
            >自定义</EaButton
          >
          <EaButton v-if="editable" size="sm" :disabled="blocked || past.length === 0" @click="undo"
            >撤销</EaButton
          >
          <EaButton
            v-if="editable"
            size="sm"
            :disabled="blocked || future.length === 0"
            @click="redo"
            >重做</EaButton
          >
          <EaButton size="sm" :disabled="saving" @click="emit('close')">取消</EaButton>
          <EaButton
            v-if="editable"
            size="sm"
            variant="primary"
            :disabled="blocked || (draft === initialDefinition && !(custom && layoutEdited))"
            :loading="saving"
            @click="save"
            >保存</EaButton
          >
        </header>
        <div class="editor-panels" :inert="timelineGesture || Boolean(resizeGesture) || saving">
          <aside class="resource-panel">
            <h3>当前技能</h3>
            <button
              :class="{ active: address.kind === 'main' }"
              @click="changeGraph({ kind: 'main' })"
            >
              主图 <small>{{ Object.keys(draft.actionGraph.main.nodes).length }}</small>
            </button>
            <h3 v-if="Object.keys(draft.actionGraph.macros).length > 0">宏</h3>
            <button
              v-for="(macro, id) in draft.actionGraph.macros"
              :key="id"
              :class="{ active: address.kind === 'macro' && address.macroId === id }"
              @click="changeGraph({ kind: 'macro', macroId: id })"
            >
              {{ id }} <small>{{ Object.keys(macro.graph.nodes).length }}</small>
            </button>
            <h3>触发来源</h3>
            <button
              v-for="group in entryGroups"
              :key="group.id"
              :disabled="group.id !== 'timeline' && group.entries.length === 0"
              @click="group.id === 'timeline' ? openTimeline() : focusEntry(group.entries[0]!.id)"
            >
              {{ group.label }}<small>{{ group.entries.length }} 次调度</small>
            </button>
            <BlackboardPanel
              ref="blackboardPanel"
              :analysis="blackboard"
              :readonly="!editable"
              @drop="(identity, event, readonly) => canvas?.dropVariable(identity, event, readonly)"
              @locate="
                (id, data) => {
                  if (data) {
                    selectData(id);
                    canvas?.focusData(id);
                  } else {
                    focusNode(id);
                  }
                }
              "
            />
            <h3>查找节点</h3>
            <input v-model="query" placeholder="名称、类型或节点 ID" aria-label="查找节点" />
            <p v-if="query" class="muted">{{ searchResults.length }} 个结果</p>
            <button v-for="[id, node] in searchResults" :key="id" @click="focusNode(id)">
              {{ node.action.kind }}<small>{{ id }}</small>
            </button>
          </aside>
          <ActionGraphCanvas
            :creation-items="creationItems"
            @create-node="createNode"
            :readonly="!editable"
            @drop-variable="dropVariable"
            :selected-data-id="selectedDataId"
            @select-data="selectData"
            @remove-data="removeDataNode"
            @connect-data="connectData"
            @constant-data="(owner, id, path, value) => connectData(owner, id, path, null, value)"
            :presentation="graphPresentation"
            @change-presentation="changePresentation"
            ref="canvas"
            :key="graphKey"
            :graph="graph"
            :selected-id="selectedId"
            :entry-groups="entryGroups"
            :selected-entry-id="selectedEntryId"
            :before-interaction="canLeaveFields"
            @select="selectNode"
            @connect="connect"
            @select-entry="selectEntry"
            @connect-entry="connectEntry"
            @edit-timeline="openTimeline"
            @clear-selection="clearSelection"
            @remove-node="removeSelectedNode"
            @disconnect-input="disconnectInput"
            @open-node="openNode"
            @select-connection="selectConnection"
          />
          <aside class="inspector-panel">
            <fieldset :disabled="!editable" style="border: 0; margin: 0; padding: 0; min-width: 0">
              <DataNodeInspector
                ref="dataInspector"
                v-if="selectedDataNode && selectedDataId"
                :node="selectedDataNode"
                :node-id="selectedDataId"
                :scopes="selectedScopes"
                :scope-warnings="blackboardScopeWarnings(blackboard)"
                :variable-keys="variableKeys"
                :apply="applyData"
                @pending="nodePending = $event"
              />
              <section v-else-if="selectedConnection" class="entry-inspector">
                <h3>执行连线</h3>
                <span
                  >来源：{{
                    selectedConnection.nodeId === null
                      ? '时间线调度'
                      : nodeLabel(selectedConnection.nodeId)
                  }}</span
                >
                <span>目标：{{ nodeLabel(selectedConnection.targetId) }}</span>
                <EaButton
                  size="sm"
                  @click="
                    selectedConnection!.nodeId !== null
                      ? focusNode(selectedConnection!.nodeId)
                      : focusEntry(selectedConnection!.entryId!)
                  "
                  >定位来源</EaButton
                >
                <EaButton size="sm" @click="focusNode(selectedConnection!.targetId)"
                  >定位目标</EaButton
                >
                <p class="muted">拖拽引脚更换连接。Alt 单击连线或使用右键菜单可断开。</p>
              </section>
              <ActionNodeInspector
                ref="inspector"
                v-else-if="selectedNode && selectedId !== null"
                :key="`${graphKey}:${selectedId}`"
                :node-id="selectedId"
                :scopes="selectedScopes"
                :scope-warnings="blackboardScopeWarnings(blackboard)"
                :node="selectedNode"
                :apply-action="applyAction"
                @pending="nodePending = $event"
                @open-macro="changeGraph({ kind: 'macro', macroId: $event })"
              />
              <section v-else-if="selectedEntry" class="entry-inspector">
                <h3>{{ selectedEntry.label }}</h3>
                <p class="muted">
                  每条调度独立调用目标动作。时间和处理顺序在底部编辑，执行目标通过画布接线修改。
                </p>
                <template v-if="selectedEntry.startFrame !== undefined">
                  <span>开始：{{ selectedEntry.startFrame }} 帧</span>
                  <span
                    >结束：{{
                      selectedEntry.endFrame === undefined
                        ? '未设置'
                        : `${selectedEntry.endFrame} 帧`
                    }}</span
                  >
                  <EaButton
                    v-if="selectedEntry.id.startsWith('timeline:')"
                    size="sm"
                    @click="openTimeline"
                    >编辑时间</EaButton
                  >
                </template>
                <label
                  >执行目标<code>{{ selectedEntry.targetId ?? '未连接' }}</code></label
                >
                <EaButton
                  size="sm"
                  :disabled="selectedEntry.targetId === null || pending"
                  @click="focusNode(selectedEntry.targetId)"
                  >定位动作</EaButton
                >
              </section>
              <div v-else class="inspector-empty">
                <strong>节点详情</strong>
                <p>选择节点查看参数和执行出口。</p>
                <p>点击输出端口，再点击另一个节点的输入端口，即可连接。</p>
              </div>
            </fieldset>
          </aside>
        </div>
        <template v-if="timelineOpen && address.kind === 'main'">
          <div
            class="timeline-resizer"
            role="separator"
            tabindex="0"
            aria-label="调整时间线编辑区高度"
            aria-orientation="horizontal"
            :aria-valuenow="Math.round(visibleTimelineHeight)"
            :aria-valuemin="140"
            :aria-valuemax="Math.max(140, workspaceHeight - 280)"
            :class="{ active: resizeGesture }"
            @pointerdown="startTimelineResize"
            @pointermove="moveTimelineResize"
            @pointerup="endTimelineResize"
            @pointercancel="cancelTimelineResize"
            @lostpointercapture="cancelTimelineResize"
            @keydown="resizeTimelineByKey"
            @dblclick="timelineHeight = 240"
          />
          <div class="timeline-panel-shell" :style="{ flexBasis: `${visibleTimelineHeight}px` }">
            <SkillTimelinePanel
              :entries="timelineEntries"
              :graph="graph"
              :selected-entry-id="selectedEntryId"
              :disabled="!editable || nodePending || Boolean(resizeGesture) || saving"
              :select-entry="selectEntry"
              :apply-time="applyTimelineTime"
              @add="addTimelineSchedule"
              @duplicate="duplicateTimelineSchedule"
              @remove="removeTimelineSchedule"
              @reorder="reorderTimelineSchedule"
              @focus-entry="focusEntry"
              @close="closeTimeline"
              @pending="timelinePending = $event"
              @gesture="timelineGesture = $event"
            />
          </div>
        </template>
        <footer v-if="error" class="editor-status has-error" role="alert">
          <pre>{{ error }}</pre>
        </footer>
      </div>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
:global(.skill-graph-dialog.el-dialog) {
  width: 100vw !important;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0 !important;
  padding: 0;
  border: 0;
  border-radius: 0;
  overflow: hidden;
}
:global(.skill-graph-dialog .el-dialog__header) {
  display: none;
}
:global(.skill-graph-dialog .el-dialog__body) {
  padding: 0;
  height: 100%;
  overflow: hidden;
}
.skill-graph-editor {
  position: relative;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  color: var(--ea-fg);
}
.editor-toolbar {
  flex: 0 0 42px;
  box-sizing: border-box;
  padding: 4px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--ea-border);
}
.editor-toolbar > strong {
  max-width: 38%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}
.scope-hint,
.muted {
  color: var(--ea-fg-muted);
  font-size: 11px;
}
.spacer {
  flex: 1;
}
.editor-panels {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 180px minmax(200px, 1fr) 270px;
}
.timeline-panel-shell {
  flex: 0 0 240px;
  min-height: 0;
  border-top: 1px solid var(--ea-border);
}
.timeline-resizer {
  flex: 0 0 6px;
  cursor: ns-resize;
  touch-action: none;
  background: var(--ea-workbench-panel);
  border-top: 1px solid var(--ea-border);
  box-sizing: border-box;
}
.timeline-resizer:hover,
.timeline-resizer:focus-visible,
.timeline-resizer.active {
  background: var(--ea-gold);
  outline: none;
}
.resource-panel,
.inspector-panel {
  min-width: 0;
  overflow: auto;
  background: var(--ea-workbench-panel);
}
.resource-panel {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px;
  border-right: 1px solid var(--ea-border);
}
.inspector-panel {
  border-left: 1px solid var(--ea-border);
}
.entry-inspector,
.entry-inspector label {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.entry-inspector {
  padding: 16px;
  font-size: 12px;
}
.entry-inspector p {
  line-height: 1.7;
}
h3 {
  margin: 14px 0 3px;
  font-size: 12px;
  color: var(--ea-fg-muted);
}
.resource-panel > button:not(.ea-button) {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid transparent;
  background: var(--ea-fill-soft);
  color: var(--ea-fg);
  padding: 8px;
  border-radius: 3px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  overflow-wrap: anywhere;
}
.resource-panel > button.active {
  border-color: var(--ea-gold);
}
.resource-panel small {
  opacity: 0.6;
  font-size: 10px;
}
.resource-panel > button:disabled {
  opacity: 0.45;
  cursor: default;
}
input,
select {
  min-width: 0;
  padding: 7px;
  color: var(--ea-fg);
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
}
.inspector-empty {
  padding: 20px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--ea-fg-muted);
}
.editor-status {
  position: absolute;
  z-index: 10;
  right: 12px;
  bottom: 12px;
  max-width: min(600px, 80%);
  max-height: 120px;
  overflow: auto;
  padding: 6px 10px;
  box-sizing: border-box;
  font-size: 11px;
  color: var(--ea-fg-muted);
  background: var(--ea-workbench-panel);
  border: 1px solid var(--ea-border);
}
.editor-status pre {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.has-error {
  color: #ff9999;
}
@media (max-width: 1100px) {
  .editor-panels {
    grid-template-columns: 160px minmax(150px, 1fr) 250px;
  }
  .scope-hint {
    display: none;
  }
}
</style>
