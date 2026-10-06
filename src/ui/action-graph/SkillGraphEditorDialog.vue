<script setup lang="ts">
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
/** 技能块单独编辑时的宿主；图操作和各面板与资产工作区共用。 */
import { computed, reactive, ref, watch, toRaw, shallowRef, onBeforeUnmount } from 'vue';
import { editorPanelWidth } from './editorPanelGeometry';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { EaButton, EaDialog } from '@/design-system';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillGraphPresentation } from '../../core/project/graphPresentation';
import { readGraphPresentation } from '../../core/project/graphPresentation';
import { DefinitionDraftSession } from '../../application/editor/definitionDraftSession';
import InputRegionBoundary from '../keyboard/InputRegionBoundary.vue';
import {
  useInteractionBarrier,
  useInteractionSession,
} from '../interaction/interactionSessionContext';
import { useSkillGraphEditor } from './useSkillGraphEditor';
import SkillGraphPanels from './SkillGraphPanels.vue';
import { createResourceEditorView } from '../editor/resourceEditorView';
import { createGraphCanvasView } from './graphCanvasView';

const props = defineProps<{
  referenceChoices?: ReferenceChoices;
  definition: SkillDefinition;
  custom: boolean;
  allowCustomize?: boolean;
  readOnly?: boolean;
  alternateGraph?: boolean;
  executionView?: boolean;
  label: string;
  presentation?: SkillGraphPresentation;
  saveDefinition: (
    definition: SkillDefinition,
    presentation: SkillGraphPresentation,
    createCustom: boolean,
  ) => void | Promise<void>;
}>();
const emit = defineEmits<{
  close: [];
  nodeSelected: [graph: ActionGraphDefinition, id: string | null];
}>();
useInteractionBarrier(useInteractionSession(), () => true);
const session = new DefinitionDraftSession(
  {
    definition: props.definition,
    presentation: readGraphPresentation(props.custom ? props.presentation : undefined),
  },
  props.custom,
);
const revision = ref(0);
const saving = ref(false);
const current = computed(() => {
  void revision.value;
  return session.current;
});
const editable = computed(() => {
  void revision.value;
  return !props.readOnly && session.editable;
});
const canUndo = computed(() => {
  void revision.value;
  return session.canUndo;
});
const canRedo = computed(() => {
  void revision.value;
  return session.canRedo;
});
const view = reactive(createResourceEditorView());
const editor = reactive(
  useSkillGraphEditor({
    view: () => view,
    definition: () => current.value.definition,
    editable: () => editable.value,
    busy: () => saving.value,
    label: () => props.label,
    identity: () => props.definition.key,
    presentation: () => current.value.presentation,
    change: (change, layout) => {
      session.update(value => {
        const definition = change(value.definition);
        const presentation = layout ?? value.presentation;
        return definition === value.definition && presentation === value.presentation
          ? value
          : { definition, presentation };
      });
      revision.value++;
    },
    undo: () => {
      session.undo();
      revision.value++;
    },
    redo: () => {
      session.redo();
      revision.value++;
    },
  }),
);
if (props.executionView) editor.closeTimeline();
const navigationOpen = ref(true);
const inspectorOpen = ref(true);
const panelsElement = ref<HTMLElement>();
const panelWidths = reactive({ left: 214, right: 270 });
const resizingSide = ref<'left' | 'right' | null>(null);
let stopPanelResize: (() => void) | undefined;
function setPanelWidth(side: 'left' | 'right', width: number) {
  const other =
    side === 'left'
      ? inspectorOpen.value
        ? panelWidths.right
        : 0
      : navigationOpen.value
        ? panelWidths.left
        : 0;
  panelWidths[side] = editorPanelWidth(width, panelsElement.value?.clientWidth ?? 1200, other);
}
function resizePanel(side: 'left' | 'right', event: PointerEvent) {
  if (event.button !== 0) return;
  event.preventDefault();
  stopPanelResize?.();
  const start = event.clientX,
    width = panelWidths[side],
    pointerId = event.pointerId;
  resizingSide.value = side;
  const move = (next: PointerEvent) => {
    if (next.pointerId === pointerId)
      setPanelWidth(side, width + (next.clientX - start) * (side === 'left' ? 1 : -1));
  };
  const end = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
    window.removeEventListener('blur', end);
    resizingSide.value = null;
    stopPanelResize = undefined;
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  window.addEventListener('blur', end);
  stopPanelResize = end;
}
onBeforeUnmount(() => stopPanelResize?.());
watch(
  () => [editor.graphKey, editor.selectedId] as const,
  () => {
    const graph =
      editor.address.kind === 'main'
        ? props.definition.actionGraph.main
        : props.definition.actionGraph.macros[editor.address.macroId]?.graph;
    if (graph) emit('nodeSelected', graph, editor.selectedId);
  },
);
const cameras = new Map<string, ReturnType<typeof createGraphCanvasView>>();
const canvasView = computed(() => {
  if (!cameras.has(editor.graphKey))
    cameras.set(editor.graphKey, reactive(createGraphCanvasView()));
  return cameras.get(editor.graphKey)!;
});
function showGraphNode(graph: ActionGraphDefinition, nodeId: string) {
  const root = props.definition.actionGraph;
  if (toRaw(graph) === toRaw(root.main)) {
    if (editor.address.kind !== 'main') editor.changeGraph({ kind: 'main' });
  } else {
    const macroId = Object.keys(root.macros).find(
      id => toRaw(root.macros[id]!.graph) === toRaw(graph),
    );
    if (macroId === undefined) return false;
    if (editor.address.kind !== 'macro' || editor.address.macroId !== macroId)
      editor.changeGraph({ kind: 'macro', macroId });
  }
  if (!Object.hasOwn(editor.graph.nodes, nodeId)) return false;
  editor.selectNode(nodeId);
  return true;
}
async function locateGraphNode(graph: ActionGraphDefinition, nodeId: string) {
  if (!showGraphNode(graph, nodeId)) return false;
  await editor.focusNode(nodeId);
  return true;
}
const executionTarget = shallowRef<{ graph: ActionGraphDefinition; nodeId: string }>();
const executionNodeId = computed(() => {
  const root = props.definition.actionGraph;
  const graph =
    editor.address.kind === 'main' ? root.main : root.macros[editor.address.macroId]?.graph;
  return toRaw(graph) === toRaw(executionTarget.value?.graph)
    ? executionTarget.value?.nodeId
    : undefined;
});
function highlightGraphNode(graph?: ActionGraphDefinition, nodeId?: string) {
  executionTarget.value = graph && nodeId ? { graph, nodeId } : undefined;
  const root = props.definition.actionGraph;
  const visible =
    editor.address.kind === 'main' ? root.main : root.macros[editor.address.macroId]?.graph;
  // 步进只改变选择；跨图导航和画布平移由显式定位操作负责。
  if (
    graph &&
    toRaw(visible) === toRaw(graph) &&
    nodeId &&
    Object.hasOwn(editor.graph.nodes, nodeId)
  )
    editor.selectNode(nodeId);
  else view.selection = null;
}
defineExpose({ locateGraphNode, highlightGraphNode, showGraphNode });
function customize() {
  if (props.allowCustomize === false) return;
  session.customize();
  revision.value++;
}
async function save() {
  if (!editable.value || !editor.canLeaveFields()) return;
  saving.value = true;
  try {
    const value = session.exportDefinition();
    await props.saveDefinition(value.definition, value.presentation, !props.custom);
    emit('close');
  } catch (cause) {
    editor.error = cause instanceof Error ? cause.message : String(cause);
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <InputRegionBoundary label="skill-graph-editor" :active="true" modal>
    <EaDialog
      :model-value="true"
      class="skill-graph-dialog"
      size="full"
      fullscreen
      :title="`技能图 · ${label}`"
      :busy="saving"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @update:model-value="emit('close')"
    >
      <div
        :ref="value => (editor.editorRoot = value as HTMLElement)"
        class="skill-graph-editor"
        @keydown="editor.onKeydown"
      >
        <header class="editor-toolbar">
          <strong>{{ executionView ? '执行回放' : '技能图' }} · {{ label }}</strong>
          <span v-if="!executionView">{{
            editable ? '自定义图 · 仅修改当前技能块' : '库图 · 只读'
          }}</span>
          <div class="spacer" />
          <template v-if="executionView">
            <EaButton
              size="sm"
              :aria-pressed="navigationOpen"
              @click="navigationOpen = !navigationOpen"
              >调用与历史</EaButton
            >
            <EaButton
              size="sm"
              :aria-pressed="inspectorOpen"
              @click="inspectorOpen = !inspectorOpen"
              >执行详情</EaButton
            >
          </template>
          <EaButton
            v-if="editor.address.kind === 'main' && !alternateGraph"
            size="sm"
            :disabled="editor.blocked"
            @click="editor.timelineOpen ? editor.closeTimeline() : editor.openTimeline()"
          >
            {{ editor.timelineOpen ? '收起时间线' : '查看时间线' }}
          </EaButton>
          <EaButton v-if="!editable && allowCustomize !== false" size="sm" @click="customize"
            >自定义</EaButton
          >
          <EaButton
            v-if="editable"
            size="sm"
            :disabled="editor.blocked || !canUndo"
            @click="editor.undo"
            >撤销</EaButton
          >
          <EaButton
            v-if="editable"
            size="sm"
            :disabled="editor.blocked || !canRedo"
            @click="editor.redo"
            >重做</EaButton
          >
          <EaButton size="sm" :disabled="saving" @click="emit('close')">{{
            executionView ? '关闭' : '取消'
          }}</EaButton>
          <EaButton
            v-if="editable"
            size="sm"
            :disabled="editor.blocked"
            :loading="saving"
            @click="save"
            >保存</EaButton
          >
        </header>
        <slot name="toolbar" />
        <div
          ref="panelsElement"
          class="editor-panels"
          :style="{
            gridTemplateColumns: `${navigationOpen ? `${panelWidths.left}px 1px ` : ''}minmax(0, 1fr)${inspectorOpen ? ` 1px ${panelWidths.right}px` : ''}`,
          }"
          :inert="editor.timelineGesture || Boolean(editor.resizeGesture) || saving"
        >
          <div v-show="navigationOpen" class="editor-navigation">
            <slot name="navigation">
              <SkillGraphPanels area="tools" :editor="editor" />
            </slot>
          </div>
          <div
            v-show="navigationOpen"
            class="panel-splitter ea-resize-handle ea-resize-handle--vertical"
            :class="{ 'is-active': resizingSide === 'left' }"
            role="separator"
            aria-orientation="vertical"
            aria-label="调整左侧面板宽度"
            :aria-valuenow="panelWidths.left"
            :aria-valuemin="160"
            :aria-valuemax="360"
            tabindex="0"
            @pointerdown.stop="resizePanel('left', $event)"
            @keydown.left.stop.prevent="setPanelWidth('left', panelWidths.left - 10)"
            @keydown.right.stop.prevent="setPanelWidth('left', panelWidths.left + 10)"
          />
          <div v-show="!alternateGraph" style="display: contents">
            <SkillGraphPanels
              area="canvas"
              :editor="editor"
              :canvas-view="canvasView"
              :execution-node-id="executionNodeId"
            />
          </div>
          <slot v-if="alternateGraph" name="alternate-graph" />
          <div
            v-show="inspectorOpen"
            class="panel-splitter ea-resize-handle ea-resize-handle--vertical"
            :class="{ 'is-active': resizingSide === 'right' }"
            role="separator"
            aria-orientation="vertical"
            aria-label="调整右侧面板宽度"
            :aria-valuenow="panelWidths.right"
            :aria-valuemin="160"
            :aria-valuemax="360"
            tabindex="0"
            @pointerdown.stop="resizePanel('right', $event)"
            @keydown.left.stop.prevent="setPanelWidth('right', panelWidths.right + 10)"
            @keydown.right.stop.prevent="setPanelWidth('right', panelWidths.right - 10)"
          />
          <div v-show="inspectorOpen" class="editor-inspector">
            <slot name="inspector-before" />
            <details :open="!executionView">
              <summary v-if="executionView" class="definition-heading">节点定义</summary>
              <slot v-if="alternateGraph" name="alternate-inspector" />
              <SkillGraphPanels
                v-else
                area="inspector"
                :editor="editor"
                :reference-choices="referenceChoices"
              />
            </details>
          </div>
        </div>
        <div v-show="!alternateGraph" style="display: contents">
          <SkillGraphPanels area="timeline" :editor="editor" />
        </div>
        <slot name="footer" />
        <pre v-if="editor.error" role="alert">{{ editor.error }}</pre>
      </div>
    </EaDialog>
  </InputRegionBoundary>
</template>
<style scoped>
:global(.skill-graph-dialog .el-dialog__header) {
  display: none;
}
:global(.skill-graph-dialog .el-dialog__body) {
  padding: 0;
  height: 100%;
  overflow: hidden;
}
.skill-graph-editor {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid var(--ea-border);
}
.spacer {
  flex: 1;
}
.editor-inspector {
  min-width: 0;
  min-height: 0;
  overflow: auto;
}
.editor-navigation {
  min-width: 0;
  min-height: 0;
  overflow: auto;
}
.definition-heading {
  padding: 12px;
  cursor: pointer;
  border-top: 1px solid var(--ea-border);
}
.editor-panels {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 214px minmax(0, 1fr) 270px;
}
.panel-splitter {
  z-index: 3;
}
</style>
