<script setup lang="ts">
import { toRefs, type UnwrapNestedRefs } from 'vue';
import { EaButton, EaInput } from '@/design-system';
import ActionGraphCanvas from './ActionGraphCanvas.vue';
import ActionNodeInspector from './ActionNodeInspector.vue';
import GraphConnectionInspector from './GraphConnectionInspector.vue';
import DataNodeInspector from './DataNodeInspector.vue';
import BlackboardPanel from './BlackboardPanel.vue';
import SkillTimelinePanel from './SkillTimelinePanel.vue';
import { blackboardScopeWarnings } from '../../application/editor/graphBlackboard';
import type { useSkillGraphEditor } from './useSkillGraphEditor';
import type { GraphCanvasView } from './graphCanvasView';
const props = defineProps<{
  area: 'tools' | 'canvas' | 'inspector' | 'timeline';
  toolTab?: string;
  canvasView?: GraphCanvasView;
  resourceKey?: string;
  editor: UnwrapNestedRefs<ReturnType<typeof useSkillGraphEditor>>;
}>();
const {
  draft,
  editable,
  address,
  graphKey,
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
  query,
  nodePending,
  timelinePending,
  timelineGesture,
  timelineOpen,
  workspaceHeight,
  timelineHeight,
  visibleTimelineHeight,
  resizeGesture,
  entryGroups,
  variableKeys,
  blackboard,
  dropVariable,
  timelineEntries,
  selectedEntry,
  pending,
  saving,
  creationItems,
  createNode,
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
  applyAction,
  connect,
  connectEntry,
  applyTimelineTime,
  openTimeline,
  closeTimeline,
  addTimelineSchedule,
  duplicateTimelineSchedule,
  removeTimelineSchedule,
  reorderTimelineSchedule,
  removeSelectedNode,
  startTimelineResize,
  moveTimelineResize,
  endTimelineResize,
  cancelTimelineResize,
  resizeTimelineByKey,
} = toRefs(props.editor);
</script>
<template>
  <aside v-if="area === 'tools'" class="resource-panel">
    <template v-if="!toolTab || toolTab === 'content'">
      <h3>当前技能</h3>
      <EaButton
        class="resource-panel__link"
        :pressed="address.kind === 'main'"
        @click="changeGraph({ kind: 'main' })"
      >
        主图 <small>{{ Object.keys(draft.actionGraph.main.nodes).length }}</small>
      </EaButton>
      <h3 v-if="Object.keys(draft.actionGraph.macros).length > 0">宏</h3>
      <EaButton
        v-for="(macro, id) in draft.actionGraph.macros"
        :key="id"
        class="resource-panel__link"
        :pressed="address.kind === 'macro' && address.macroId === id"
        @click="changeGraph({ kind: 'macro', macroId: id })"
      >
        {{ id }} <small>{{ Object.keys(macro.graph.nodes).length }}</small>
      </EaButton>
      <h3>触发来源</h3>
      <EaButton
        v-for="group in entryGroups"
        :key="group.id"
        class="resource-panel__link"
        :disabled="group.id !== 'timeline' && group.entries.length === 0"
        @click="group.id === 'timeline' ? openTimeline() : focusEntry(group.entries[0]!.id)"
      >
        {{ group.label }}<small>{{ group.entries.length }} 次调度</small>
      </EaButton>
    </template>
    <BlackboardPanel
      v-if="!toolTab || toolTab === 'variables'"
      :ref="value => (editor.blackboardPanel = value as InstanceType<typeof BlackboardPanel>)"
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
    <template v-if="!toolTab || toolTab === 'find'">
      <h3>查找节点</h3>
      <EaInput v-model="query" placeholder="名称、类型或节点 ID" aria-label="查找节点" />
      <p v-if="query" class="muted">{{ searchResults.length }} 个结果</p>
      <EaButton
        class="resource-panel__link"
        v-for="[id, node] in searchResults"
        :key="id"
        @click="focusNode(id)"
      >
        {{ node.action.kind }}<small>{{ id }}</small>
      </EaButton>
    </template>
  </aside>
  <ActionGraphCanvas
    v-else-if="area === 'canvas'"
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
    :key="`${resourceKey ?? ''}:${graphKey}`"
    :view="canvasView"
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
  <aside v-else-if="area === 'inspector'" class="inspector-panel">
    <fieldset
      :disabled="!editable && !selectedConnection && !selectedEntry"
      style="border: 0; margin: 0; padding: 0; min-width: 0"
    >
      <DataNodeInspector
        :ref="value => (editor.dataInspector = value as InstanceType<typeof DataNodeInspector>)"
        v-if="selectedDataNode && selectedDataId"
        :node="selectedDataNode"
        :node-id="selectedDataId"
        :scopes="selectedScopes"
        :scope-warnings="blackboardScopeWarnings(blackboard)"
        :variable-keys="variableKeys"
        :apply="applyData"
        @pending="nodePending = $event"
      />
      <GraphConnectionInspector
        v-else-if="selectedConnection"
        :source="
          selectedConnection.nodeId === null
            ? (entryGroups
                .flatMap(group => group.entries)
                .find(entry => entry.id === selectedConnection!.entryId)?.label ??
              selectedConnection.entryId ??
              '')
            : nodeLabel(selectedConnection.nodeId)
        "
        :target="nodeLabel(selectedConnection.targetId)"
        @locate-source="
          selectedConnection!.nodeId !== null
            ? focusNode(selectedConnection!.nodeId)
            : focusEntry(selectedConnection!.entryId!)
        "
        @locate-target="focusNode(selectedConnection!.targetId)"
      />
      <ActionNodeInspector
        :ref="value => (editor.inspector = value as InstanceType<typeof ActionNodeInspector>)"
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
              selectedEntry.endFrame === undefined ? '未设置' : `${selectedEntry.endFrame} 帧`
            }}</span
          >
          <EaButton
            v-if="selectedEntry.id.startsWith('timeline:')"
            size="sm"
            @click="openTimeline"
            >{{ editable ? '编辑时间' : '查看时间' }}</EaButton
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
  <template v-else-if="area === 'timeline' && timelineOpen && address.kind === 'main'">
    <div
      class="timeline-resizer ea-resize-handle ea-resize-handle--horizontal"
      role="separator"
      tabindex="0"
      aria-label="调整时间线编辑区高度"
      aria-orientation="horizontal"
      :aria-valuenow="Math.round(visibleTimelineHeight)"
      :aria-valuemin="140"
      :aria-valuemax="Math.max(140, workspaceHeight - 280)"
      :class="{ 'is-active': resizeGesture }"
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
        :readonly="!editable"
        :disabled="nodePending || Boolean(resizeGesture) || saving"
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
</template>
<style scoped>
.timeline-panel-shell {
  flex: 0 0 240px;
  min-height: 0;
  border-top: 1px solid var(--ea-border);
}
.timeline-resizer {
  flex: 0 0 6px;
  box-sizing: border-box;
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
.resource-panel__link {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: stretch;
  height: auto;
  overflow-wrap: anywhere;
}
.resource-panel small {
  opacity: 0.6;
  font-size: 10px;
}
.resource-panel > :deep(.ea-input) {
  min-width: 0;
  width: 100%;
}
.inspector-empty {
  padding: 20px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--ea-fg-muted);
}
</style>
