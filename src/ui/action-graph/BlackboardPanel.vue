<script setup lang="ts">
/** 变量清单只展示定义和引用；拖放携带清单身份，不传递运行时黑板对象。 */
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { scopeName, scopeHelp } from './editorNodeText';
import EditorHelp from './EditorHelp.vue';
const { t } = useI18n();
import type {
  analyzeGraphBlackboard,
  BlackboardVariable,
} from '../../application/editor/graphBlackboard';
const props = defineProps<{
  analysis: ReturnType<typeof analyzeGraphBlackboard>;
  readonly?: boolean;
}>();
const emit = defineEmits<{
  locate: [id: string, data: boolean];
  drop: [identity: string, event: PointerEvent, readonly: boolean];
}>();
const query = ref('');
const selected = ref<string>();
const identity = (v: BlackboardVariable) => JSON.stringify([v.scope, v.layer, v.key]);
const detail = computed(() => props.analysis.variables.find(v => identity(v) === selected.value));
const dragging = ref<{ x: number; y: number; moved: boolean }>();
function startDrag(event: PointerEvent) {
  if (props.readonly) return;
  if (event.button !== 0) return;
  dragging.value = { x: event.clientX, y: event.clientY, moved: false };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function moveDrag(event: PointerEvent) {
  if (
    dragging.value &&
    Math.hypot(event.clientX - dragging.value.x, event.clientY - dragging.value.y) > 5
  )
    dragging.value.moved = true;
}
function endDrag(event: PointerEvent, variable: BlackboardVariable) {
  const moved = dragging.value?.moved;
  dragging.value = undefined;
  if (moved) emit('drop', identity(variable), event, variable.layer === 'parameter');
}
defineExpose({ resolve: (id: string) => props.analysis.variables.find(v => identity(v) === id) });
</script>
<template>
  <section class="blackboard-panel">
    <h3>
      {{ t('actionGraphEditor.variablePanel')
      }}<EditorHelp
        :text="t(`actionGraphEditor.${readonly ? 'readonlyVariableHelp' : 'variableHelp'}`)"
      />
    </h3>
    <input
      v-model="query"
      :placeholder="t('actionGraphEditor.searchVariables')"
      :aria-label="t('actionGraphEditor.searchVariables')"
    />
    <template v-for="scope in analysis.scopes.values()" :key="scope.id">
      <details open>
        <summary>{{ scopeName(scope) }}<EditorHelp :text="scopeHelp(scope)" /></summary>
        <button
          v-for="v in analysis.variables.filter(
            v => v.scope === scope.id && v.key.toLowerCase().includes(query.toLowerCase()),
          )"
          :key="identity(v)"
          class="variable-item"
          :class="{ active: selected === identity(v) }"
          @pointerdown="startDrag"
          @pointermove="moveDrag"
          @pointerup="endDrag($event, v)"
          @pointercancel="dragging = undefined"
          @lostpointercapture="dragging = undefined"
          @keydown.esc="dragging = undefined"
          @click="selected = identity(v)"
        >
          <span class="variable-dot" /> <span>{{ v.key }}</span>
          <small>{{
            t(
              `actionGraphEditor.${v.layer === 'parameter' ? 'paramLayer' : v.layer === 'entity' ? 'entityLayer' : 'localLayer'}`,
            )
          }}</small>
        </button>
      </details>
    </template>
    <div v-if="detail" class="variable-detail">
      <strong>{{ detail.key }}</strong
      ><EditorHelp :text="t('actionGraphEditor.variableReadHelp')" />
      <EditorHelp
        v-if="detail.layer !== 'parameter'"
        :text="
          t(
            `actionGraphEditor.${detail.key.startsWith('EntityBB_') ? 'entityWriteHelp' : 'localWriteHelp'}`,
          )
        "
      />
      <p>
        {{ t('actionGraphEditor.initial') }}：{{
          detail.initial === undefined
            ? t('actionGraphEditor.unknownInitial')
            : JSON.stringify(detail.initial)
        }}
      </p>
      <div v-for="id in detail.reads" :key="`r:${id}`">
        <button @click="emit('locate', id, true)">
          {{ t('actionGraphEditor.read') }} · {{ id }}
        </button>
      </div>
      <div v-for="id in detail.writes" :key="`w:${id}`">
        <button @click="emit('locate', id, false)">
          {{ t('actionGraphEditor.write') }} · {{ id }}
        </button>
      </div>
    </div>
  </section>
</template>
<style scoped>
.blackboard-panel {
  margin-top: 14px;
  border-top: 1px solid #444;
  padding-top: 8px;
}
input {
  width: 100%;
  box-sizing: border-box;
}
summary {
  cursor: pointer;
  font-size: 12px;
  padding: 8px 0;
  color: #bbb;
  overflow-wrap: anywhere;
}
.variable-item {
  user-select: none;
  touch-action: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  text-align: left;
  width: 100%;
  padding: 6px;
  background: #26292e;
  border: 1px solid transparent;
  color: #eee;
  cursor: grab;
}
.variable-item span:nth-child(2) {
  overflow-wrap: anywhere;
  min-width: 0;
}
.variable-item.active {
  border-color: #dbaf55;
}
.variable-item small {
  width: 100%;
  padding-left: 12px;
  color: #9ca8b2;
  font-size: 10px;
}
.variable-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #73cda3;
}
.hint,
.variable-detail {
  font-size: 11px;
  color: #aeb8c2;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.variable-detail {
  border-top: 1px solid #444;
  padding-top: 8px;
}
.variable-detail button {
  color: #dce8ef;
  background: #30363b;
  border: 1px solid #4a535a;
  margin: 3px;
  cursor: pointer;
}
.variable-detail button:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
