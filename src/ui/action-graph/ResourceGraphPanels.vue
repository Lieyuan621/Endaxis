<script setup lang="ts">
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
import type { GraphEntryGroup } from '../../application/editor/actionGraphEditing';
import { provide, type UnwrapNestedRefs } from 'vue';
import { blackboardNavigationKey } from '../field-editor/blackboardFieldContext';
import { useI18n } from 'vue-i18n';
import ActionGraphCanvas from './ActionGraphCanvas.vue';
import ActionNodeInspector from './ActionNodeInspector.vue';
import DataNodeInspector from './DataNodeInspector.vue';
import GraphConnectionInspector from './GraphConnectionInspector.vue';
import EditorInspector from '../editor/EditorInspector.vue';
import type { useResourceGraphEditor } from './useResourceGraphEditor';
import type { GraphCanvasView } from './graphCanvasView';
import {
  replaceResourceNodeAction,
  updateResourceGraph,
} from '../../application/editor/actionGraphResourceEditing';

const props = defineProps<{
  referenceChoices?: ReferenceChoices;
  area: 'canvas' | 'inspector';
  resourceGraphEditor: UnwrapNestedRefs<ReturnType<typeof useResourceGraphEditor>>;
  readonly: boolean;
  resourceKey: string;
  label: string;
  identity?: string;
  canvasView?: GraphCanvasView;
  executionNodeId?: string | null;
  executionEntries?: readonly GraphEntryGroup[];
}>();
const { t } = useI18n();
provide(blackboardNavigationKey, target => {
  void props.resourceGraphEditor.locateVariable(target.id, target.owner === 'data');
});
</script>
<template>
  <ActionGraphCanvas
    v-if="area === 'canvas'"
    :view="canvasView"
    :execution-node-id="executionNodeId"
    :ref="value => (resourceGraphEditor.canvas = value as InstanceType<typeof ActionGraphCanvas>)"
    :key="`${resourceKey}:${resourceGraphEditor.graphKey}`"
    :graph="resourceGraphEditor.graph"
    :graph-scope="resourceGraphEditor.interactionScope"
    :readonly="readonly"
    :creation-items="resourceGraphEditor.creationItems"
    :selected-id="resourceGraphEditor.selectedId"
    :selected-data-id="resourceGraphEditor.selectedDataId"
    :selected-entry-id="resourceGraphEditor.selectedEntryId"
    :entry-groups="executionEntries ?? resourceGraphEditor.entryGroups"
    :presentation="resourceGraphEditor.graphPresentation"
    :before-interaction="resourceGraphEditor.canLeaveFields"
    @create-node="resourceGraphEditor.createNode"
    @select="resourceGraphEditor.selectNode"
    @select-data="resourceGraphEditor.selectData"
    @select-entry="resourceGraphEditor.selectEntry"
    @clear-selection="resourceGraphEditor.clearSelection"
    @remove-node="resourceGraphEditor.removeNode"
    @remove-data="resourceGraphEditor.removeData"
    @disconnect-input="resourceGraphEditor.disconnectInput"
    @connect-data="
      (owner, id, path, source, snapshot) =>
        resourceGraphEditor.connectData(owner, id, path, source, undefined, snapshot)
    "
    @constant-data="
      (kind, id, path, value, snapshot) =>
        resourceGraphEditor.connectData(kind, id, path, null, value, snapshot)
    "
    @change-presentation="resourceGraphEditor.changePresentation"
    @open-node="resourceGraphEditor.openNode"
    @select-connection="resourceGraphEditor.selectConnection"
    @drop-variable="resourceGraphEditor.dropVariable"
    @connect="resourceGraphEditor.connect"
    @connect-entry="resourceGraphEditor.connectEntry"
  >
    <template #world-overlay="overlay"><slot name="world-overlay" v-bind="overlay" /></template>
  </ActionGraphCanvas>
  <fieldset v-else class="ap-graph-inspector">
    <DataNodeInspector
      :reference-choices="referenceChoices"
      :blackboard-context="resourceGraphEditor.blackboardContext"
      :graph="resourceGraphEditor.graph"
      :graph-scope="resourceGraphEditor.interactionScope"
      :readonly="readonly"
      v-if="resourceGraphEditor.selectedData && resourceGraphEditor.selectedDataId"
      :key="`${resourceKey}:${resourceGraphEditor.graphKey}:${resourceGraphEditor.selectedDataId}`"
      :ref="
        value =>
          (resourceGraphEditor.dataInspector = value as InstanceType<typeof DataNodeInspector>)
      "
      :node="resourceGraphEditor.selectedData"
      :node-id="resourceGraphEditor.selectedDataId"
      :scopes="resourceGraphEditor.selectedScopes"
      :scope-warnings="resourceGraphEditor.scopeWarnings"
      :variable-keys="resourceGraphEditor.variableKeys"
      :apply="
        expression =>
          resourceGraphEditor.edit(owner =>
            updateResourceGraph(owner, resourceGraphEditor.address, graph => ({
              ...graph,
              dataNodes: {
                ...graph.dataNodes,
                [resourceGraphEditor.selectedDataId!]: {
                  ...resourceGraphEditor.selectedData!,
                  expression,
                } as NonNullable<typeof graph.dataNodes>[string],
              },
            })),
          )
      "
      @change-data="
        (path, source, constant, snapshot, id) =>
          resourceGraphEditor.connectData('data', id, path, source, constant, snapshot)
      "
      @locate-data="id => resourceGraphEditor.locateVariable(id, true)"
      @pending="resourceGraphEditor.pending = $event"
    />
    <ActionNodeInspector
      :reference-choices="referenceChoices"
      :blackboard-context="resourceGraphEditor.blackboardContext"
      :graph="resourceGraphEditor.graph"
      :graph-scope="resourceGraphEditor.interactionScope"
      :readonly="readonly"
      v-else-if="resourceGraphEditor.selectedNode && resourceGraphEditor.selectedId"
      :key="`${resourceKey}:${resourceGraphEditor.graphKey}:${resourceGraphEditor.selectedId}`"
      :ref="
        value => (resourceGraphEditor.inspector = value as InstanceType<typeof ActionNodeInspector>)
      "
      :node="resourceGraphEditor.selectedNode"
      :node-id="resourceGraphEditor.selectedId"
      :scopes="resourceGraphEditor.selectedScopes"
      :scope-warnings="resourceGraphEditor.scopeWarnings"
      :apply-action="
        action =>
          resourceGraphEditor.edit(owner =>
            replaceResourceNodeAction(
              owner,
              resourceGraphEditor.address,
              resourceGraphEditor.selectedId!,
              action,
            ),
          )
      "
      @change-data="
        (path, source, constant, snapshot, id) =>
          resourceGraphEditor.connectData('action', id, path, source, constant, snapshot)
      "
      @locate-data="id => resourceGraphEditor.locateVariable(id, true)"
      @pending="resourceGraphEditor.pending = $event"
      @open-macro="resourceGraphEditor.changeGraph({ kind: 'macro', macroId: $event })"
    />
    <GraphConnectionInspector
      v-else-if="resourceGraphEditor.selectedConnection"
      :source="
        resourceGraphEditor.selectedConnection.nodeId === null
          ? (resourceGraphEditor.entries.find(
              entry => entry.id === resourceGraphEditor.selectedConnection!.entryId,
            )?.label ?? '')
          : resourceGraphEditor.nodeLabel(resourceGraphEditor.selectedConnection.nodeId)
      "
      :target="resourceGraphEditor.nodeLabel(resourceGraphEditor.selectedConnection.targetId)"
      @locate-source="
        resourceGraphEditor.selectedConnection!.nodeId !== null
          ? resourceGraphEditor.focusNode(resourceGraphEditor.selectedConnection!.nodeId)
          : resourceGraphEditor.focusEntry(resourceGraphEditor.selectedConnection!.entryId!)
      "
      @locate-target="
        resourceGraphEditor.focusNode(resourceGraphEditor.selectedConnection!.targetId)
      "
    />
    <EditorInspector v-else :title="label" :identity="identity">
      <p>
        {{
          resourceGraphEditor.entries.find(
            entry => entry.id === resourceGraphEditor.selectedEntryId,
          )?.label ?? t('assetWorkspace.workspace.selectionHint')
        }}
      </p>
    </EditorInspector>
  </fieldset>
</template>
<style scoped>
.ap-graph-inspector {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
</style>
