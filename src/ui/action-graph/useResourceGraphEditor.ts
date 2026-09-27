import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  resourceEditorSelection,
  resourceGraphAddress,
  type ResourceEditorView,
} from '../editor/resourceEditorView';
import type { GraphEntryGroup } from '../../application/editor/actionGraphEditing';
import {
  addResourceNode,
  connectResourceEntry,
  connectResourceNode,
  listResourceGraphEntries,
  removeResourceNode,
  resourceGraph,
  updateResourceGraph,
  type ActionGraphAddress,
  type ActionGraphResourceOwner,
} from '../../application/editor/actionGraphResourceEditing';
import { listGraphPorts } from '../../application/editor/actionGraphPorts';
import {
  listDataInputs,
  dataNodeInputs,
  extractResourceDataNodes,
} from '../../core/action-graph/actionGraphDataNodes';
import { useGraphVariables } from './useGraphVariables';
import { blackboardScopeWarnings } from '../../application/editor/graphBlackboard';
import {
  type GraphPresentation,
  type SkillGraphPresentation,
} from '../../core/project/graphPresentation';
import { listNodeCreations, nodeCreationGroup } from './nodeCreation';
import { nodeName } from './editorNodeText';
import { actionNodeTitle } from './nodePresentation';
import { writeNodeField } from './nodeFieldValues';
import ActionGraphCanvas from './ActionGraphCanvas.vue';
import ActionNodeInspector from './ActionNodeInspector.vue';
import DataNodeInspector from './DataNodeInspector.vue';

/** 文档由宿主持有；控制器只管理图中的选择和手势，不复制资源、不建立保存或撤销历史。 */
export interface ResourceGraphDocument {
  readonly view: () => ResourceEditorView;
  readonly owner: () => ActionGraphResourceOwner;
  readonly readonly: () => boolean;
  readonly presentation: () => SkillGraphPresentation | undefined;
  readonly identity: () => string;
  readonly label: () => string;
  readonly change: (
    change: (owner: ActionGraphResourceOwner) => ActionGraphResourceOwner,
    presentation?: SkillGraphPresentation,
  ) => void;
}

export function useResourceGraphEditor(document: ResourceGraphDocument) {
  const { t } = useI18n({ useScope: 'global' });
  const draft = computed(() => {
    const owner = document.owner();
    return { ...owner, actionGraph: extractResourceDataNodes(owner.actionGraph) };
  });
  const automaticPresentation = shallowRef<SkillGraphPresentation>({});
  const presentation = computed(() => ({
    ...automaticPresentation.value,
    ...document.presentation(),
    macros: { ...automaticPresentation.value.macros, ...document.presentation()?.macros },
  }));
  const address = resourceGraphAddress(document.view);
  const selection = resourceEditorSelection(document.view);
  const { selectedId, selectedDataId, selectedEntryId, selectedConnection } = selection;
  const pending = ref(false);
  const error = ref('');
  const graph = computed(() => resourceGraph(draft.value, address.value));
  const graphKey = computed(() =>
    address.value.kind === 'main' ? 'main' : `macro:${address.value.macroId}`,
  );
  const graphPresentation = computed(() =>
    address.value.kind === 'main'
      ? presentation.value.main
      : presentation.value.macros?.[address.value.macroId],
  );
  const entries = computed(() => listResourceGraphEntries(draft.value, address.value));
  const variables = useGraphVariables({
    graph: () => graph.value,
    roots: () => entries.value.flatMap(entry => (entry.targetId === null ? [] : [entry.targetId])),
    parameters: () =>
      address.value.kind === 'macro'
        ? (draft.value.actionGraph.macros[address.value.macroId]?.parameters ?? [])
        : [],
    initial: () => (address.value.kind === 'main' ? (draft.value.blackboard ?? {}) : {}),
    label: () =>
      address.value.kind === 'main'
        ? document.label()
        : t('actionGraphEditor.macroScope', { name: address.value.macroId }),
    selection: selection,
  });
  const { analysis: blackboard, selectedScopes, variableKeys } = variables;
  const scopeWarnings = computed(() => blackboardScopeWarnings(blackboard.value));
  const entryGroups = computed<readonly GraphEntryGroup[]>(() => [
    {
      id: address.value.kind === 'main' ? 'resource' : 'macro',
      label:
        address.value.kind === 'main' ? t('definitionEditor.graphEntries') : address.value.macroId,
      entries: entries.value.map(entry => ({
        id: entry.id,
        label: entry.label,
        targetId: entry.targetId,
      })),
    },
  ]);
  const selectedNode = computed(() =>
    selectedId.value === null ? undefined : graph.value.nodes[selectedId.value],
  );
  const selectedData = computed(() =>
    selectedDataId.value === null ? undefined : graph.value.dataNodes?.[selectedDataId.value],
  );
  const creations = listNodeCreations();
  const creationItems = computed(() =>
    creations.map(item => ({
      key: item.key,
      label: nodeName(item.kind),
      group: t(`actionGraphEditor.nodeGroups.${nodeCreationGroup(item)}`),
    })),
  );
  const canvas = ref<InstanceType<typeof ActionGraphCanvas>>();
  const inspector = ref<InstanceType<typeof ActionNodeInspector>>();
  const dataInspector = ref<InstanceType<typeof DataNodeInspector>>();
  function canLeaveFields(): boolean {
    if (!pending.value) return true;
    const applied = selectedDataId.value ? dataInspector.value?.apply() : inspector.value?.apply();
    if (applied) return true;
    error.value = t('definitionEditor.applyFieldsFirst');
    return false;
  }

  function edit(change: (owner: ActionGraphResourceOwner) => ActionGraphResourceOwner): boolean {
    if (document.readonly()) return false;
    try {
      document.change(() => change(draft.value));
      error.value = '';
      return true;
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause);
      return false;
    }
  }
  function selectNode(id: string): void {
    if (!canLeaveFields()) return;
    selectedId.value = id;
    selectedDataId.value = null;
    selectedEntryId.value = null;
  }
  function selectData(id: string): void {
    if (!canLeaveFields()) return;
    selectedDataId.value = id;
    selectedId.value = null;
    selectedEntryId.value = null;
  }
  function selectEntry(id: string): void {
    if (!canLeaveFields()) return;
    selectedEntryId.value = id;
    selectedId.value = null;
    selectedDataId.value = null;
  }
  function selectConnection(nodeId: string | null, entryId: string | null, targetId: string) {
    if (!canLeaveFields()) return;
    selectedConnection.value = { nodeId, entryId, targetId };
  }
  function nodeLabel(id: string): string {
    const node = graph.value.nodes[id];
    return node ? actionNodeTitle(node.action.kind) : id;
  }
  async function focusNode(id: string) {
    if (!canLeaveFields()) return;
    selectNode(id);
    await nextTick();
    canvas.value?.focusNode(id);
  }
  async function focusEntry(id: string) {
    if (!canLeaveFields()) return;
    selectEntry(id);
    await nextTick();
    canvas.value?.focusEntry(id);
  }
  async function locateVariable(id: string, data: boolean) {
    if (!canLeaveFields()) return;
    if (!data) return focusNode(id);
    selectData(id);
    await nextTick();
    canvas.value?.focusData(id);
  }
  function dropVariable(
    identity: string,
    write: boolean,
    point: { x: number; y: number },
    target?: { owner: 'action' | 'data'; id: string; path: readonly string[] },
  ) {
    if (!canLeaveFields()) return;
    const variable = variables.resolve(identity);
    if (!variable) return;
    let id = '';
    const success = edit(owner =>
      updateResourceGraph(owner, address.value, graph => {
        const created = variables.createNode(graph, variable, write, target);
        id = created.id;
        return created.graph;
      }),
    );
    if (!success) return;
    if (write) selectNode(id);
    else selectData(id);
    void nextTick(() => canvas.value?.placeNode(id, !write, point));
  }
  function clearSelection(): void {
    if (!canLeaveFields()) return;
    selection.clear();
  }
  function changeGraph(next: ActionGraphAddress): void {
    if (!canLeaveFields()) return;
    address.value = next;
    clearSelection();
  }
  function openNode(id: string): void {
    if (!canLeaveFields()) return;
    const node = graph.value.nodes[id];
    if (node?.action.kind === 'callMacro')
      changeGraph({ kind: 'macro', macroId: node.action.macroId });
    else selectNode(id);
  }
  function createNode(key: string, point: { x: number; y: number }): void {
    const creation = creations.find(item => item.key === key);
    if (!creation) return;
    const data = creation.category !== 'action';
    const ids = data ? (graph.value.dataNodes ?? {}) : graph.value.nodes;
    let number = 1;
    let id: string;
    do {
      id = `${data ? 'data' : 'node'}_${number++}`;
    } while (Object.hasOwn(ids, id));
    const changed = edit(owner =>
      creation.category === 'action'
        ? addResourceNode(owner, address.value, id, structuredClone(creation.action))
        : updateResourceGraph(owner, address.value, current => ({
            ...current,
            dataNodes: { ...current.dataNodes, [id]: structuredClone(creation.data) },
          })),
    );
    if (changed) {
      if (data) selectData(id);
      else selectNode(id);
      void nextTick(() => canvas.value?.placeNode(id, data, point));
    }
  }
  function removeNode(id: string): void {
    if (edit(owner => removeResourceNode(owner, address.value, id))) clearSelection();
  }
  function removeData(id: string): void {
    const changed = edit(owner =>
      updateResourceGraph(owner, address.value, current => {
        const used = [
          ...Object.values(current.nodes).flatMap(node => listDataInputs(node.action)),
          ...Object.values(current.dataNodes ?? {}).flatMap(dataNodeInputs),
        ].some(input => input.source === id);
        if (used) throw new Error(t('definitionEditor.dataNodeStillConnected'));
        const dataNodes = { ...current.dataNodes };
        delete dataNodes[id];
        return { ...current, dataNodes };
      }),
    );
    if (changed) clearSelection();
  }
  function connectData(
    targetKind: 'action' | 'data',
    id: string,
    path: readonly string[],
    source: string | null,
    constant?: number | boolean,
  ): void {
    edit(owner =>
      updateResourceGraph(owner, address.value, current => {
        const target =
          targetKind === 'action' ? current.nodes[id]?.action : current.dataNodes?.[id]?.expression;
        if (!target) throw new Error('missing data target');
        const input = (
          targetKind === 'action' ? listDataInputs(target) : dataNodeInputs(current.dataNodes![id]!)
        ).find(
          item =>
            item.path.length === path.length &&
            item.path.every((part, index) => part === path[index]),
        );
        if (!input) throw new Error('missing data input');
        if (source !== null && current.dataNodes?.[source]?.type !== input.type)
          throw new Error('data pin type mismatch');
        const value =
          source === null
            ? { kind: 'constant', value: constant ?? (input.type === 'boolean' ? false : 0) }
            : { kind: input.type === 'boolean' ? 'conditionNode' : 'valueNode', nodeId: source };
        const changed = writeNodeField(target, path, value);
        return targetKind === 'action'
          ? {
              ...current,
              nodes: {
                ...current.nodes,
                [id]: {
                  ...current.nodes[id]!,
                  action: changed as (typeof current.nodes)[string]['action'],
                },
              },
            }
          : {
              ...current,
              dataNodes: {
                ...current.dataNodes,
                [id]: { ...current.dataNodes![id]!, expression: changed } as NonNullable<
                  typeof current.dataNodes
                >[string],
              },
            };
      }),
    );
  }
  function disconnectInput(id: string): void {
    edit(owner => {
      let changed = owner;
      for (const [sourceId, node] of Object.entries(graph.value.nodes))
        for (const port of listGraphPorts(node))
          if (port.target === id)
            changed = connectResourceNode(changed, address.value, sourceId, port.path, null);
      for (const entry of entries.value)
        if (entry.targetId === id)
          changed = connectResourceEntry(changed, address.value, entry.id, null);
      return changed;
    });
  }
  function changePresentation(next: GraphPresentation, userEdit: boolean): void {
    if (userEdit && document.readonly()) return;
    if (JSON.stringify(graphPresentation.value) === JSON.stringify(next)) return;
    const updated =
      address.value.kind === 'main'
        ? { ...presentation.value, main: next }
        : {
            ...presentation.value,
            macros: { ...presentation.value.macros, [address.value.macroId]: next },
          };
    if (userEdit) document.change(owner => owner, updated);
    else automaticPresentation.value = updated;
  }

  watch(document.identity, () => {
    pending.value = false;
    error.value = '';
    automaticPresentation.value = {};
  });
  return {
    draft,
    address,
    graph,
    graphKey,
    graphPresentation,
    entries,
    entryGroups,
    selectedId,
    selectedDataId,
    selectedEntryId,
    selectedConnection,
    selectConnection,
    nodeLabel,
    focusNode,
    focusEntry,
    locateVariable,
    dropVariable,
    blackboard,
    selectedScopes,
    variableKeys,
    scopeWarnings,
    selectedNode,
    selectedData,
    creationItems,
    canvas,
    inspector,
    dataInspector,
    pending,
    error,
    canLeaveFields,
    edit,
    selectNode,
    selectData,
    selectEntry,
    clearSelection,
    changeGraph,
    openNode,
    createNode,
    removeNode,
    removeData,
    connectData,
    disconnectInput,
    changePresentation,
  };
}
