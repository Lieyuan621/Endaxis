<script setup lang="ts">
import { ref } from 'vue';
import type {
  BuffDuration,
  BuffKeywordEnhancementDefinition,
} from '../../../../../packages/game-data-contract/src/buffs';
import BuffDefinitionScalarEditor from './BuffDefinitionScalarEditor.vue';
import InspectorStringList from '../inspector/InspectorStringList.vue';

const props = defineProps<{
  enhancements: readonly BuffKeywordEnhancementDefinition[];
  singleEntry?: boolean;
}>();
const emit = defineEmits<{ update: [enhancements: readonly BuffKeywordEnhancementDefinition[]] }>();
const collapsed = ref(true);
function replace(index: number, enhancement: BuffKeywordEnhancementDefinition): void {
  emit(
    'update',
    props.enhancements.map((item, itemIndex) => (itemIndex === index ? enhancement : item)),
  );
}
function add(): void {
  emit('update', [
    ...props.enhancements,
    { triggerBuffIds: [], operation: 'assign', targetKey: '', initialValue: 0, value: 0 },
  ]);
}
function remove(index: number): void {
  emit(
    'update',
    props.enhancements.filter((_, itemIndex) => itemIndex !== index),
  );
}
function move(index: number, offset: -1 | 1): void {
  const target = index + offset;
  if (target < 0 || target >= props.enhancements.length) return;
  const next = [...props.enhancements];
  [next[index], next[target]] = [next[target]!, next[index]!];
  emit('update', next);
}
function setScalar(callback: (value: BuffDuration) => void, value: BuffDuration | undefined): void {
  if (value !== undefined) callback(value);
}
</script>

<template>
  <section class="keyword-editor" :class="{ 'single-entry': singleEntry }">
    <header v-if="!singleEntry">
      <button type="button" @click="collapsed = !collapsed">
        {{ collapsed ? '▸' : '▾' }} 关键词强化 <span>{{ enhancements.length }}</span></button
      ><button type="button" @click="add">＋</button>
    </header>
    <p v-if="!collapsed">普通 Buff 加入边沿按触发 Buff ID 持久改写目标关键词。</p>
    <article
      v-for="(enhancement, index) in enhancements"
      v-show="singleEntry || !collapsed"
      :key="index"
    >
      <header v-if="!singleEntry">
        <strong>关键词强化 {{ index + 1 }}</strong
        ><button type="button" :disabled="index === 0" @click="move(index, -1)">↑</button
        ><button
          type="button"
          :disabled="index === enhancements.length - 1"
          @click="move(index, 1)"
        >
          ↓</button
        ><button type="button" @click="remove(index)">×</button>
      </header>
      <label
        ><span>触发 Buff ID</span
        ><InspectorStringList
          :value="enhancement.triggerBuffIds"
          label="触发 Buff ID"
          @update="replace(index, { ...enhancement, triggerBuffIds: $event })"
      /></label>
      <label
        ><span>操作</span
        ><select
          :value="enhancement.operation"
          @change="
            replace(index, {
              ...enhancement,
              operation: ($event.target as HTMLSelectElement)
                .value as BuffKeywordEnhancementDefinition['operation'],
            })
          "
        >
          <option value="assign">assign</option>
          <option value="add">add</option>
          <option value="multiply">multiply</option>
        </select></label
      >
      <label
        ><span>目标键</span
        ><input
          type="text"
          :value="enhancement.targetKey"
          @input="
            replace(index, { ...enhancement, targetKey: ($event.target as HTMLInputElement).value })
          "
      /></label>
      <label
        ><span>初始值</span
        ><BuffDefinitionScalarEditor
          :value="enhancement.initialValue"
          @update="
            setScalar(initialValue => replace(index, { ...enhancement, initialValue }), $event)
          "
      /></label>
      <label
        ><span>改写值</span
        ><BuffDefinitionScalarEditor
          :value="enhancement.value"
          @update="setScalar(value => replace(index, { ...enhancement, value }), $event)"
      /></label>
    </article>
  </section>
</template>

<style scoped>
.keyword-editor {
  margin-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 10px;
}
.keyword-editor > header,
.keyword-editor article > header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) repeat(3, 30px);
  gap: 5px;
}
.keyword-editor > header {
  grid-template-columns: minmax(0, 1fr) 30px;
}
.keyword-editor button,
.keyword-editor input,
.keyword-editor select {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.keyword-editor > p {
  color: var(--ea-fg-muted);
  font-size: 11px;
}
.keyword-editor article {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid var(--ea-border-soft);
}
.keyword-editor article > header {
  grid-column: 1 / -1;
}
.keyword-editor article > label {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
.single-entry {
  margin-top: 0;
  border: 0;
  padding: 0;
}
.single-entry article {
  margin: 0;
  padding: 0;
  border: 0;
  grid-template-columns: minmax(0, 1fr);
}
.single-entry article > label {
  grid-template-columns: minmax(0, 1fr);
  gap: 5px;
}
</style>
