<script setup lang="ts">
import type { LevelValues } from '../../../core/game-data/operatorDefinition';
import { inject } from 'vue';
import { definitionAllLevelsKey } from './definitionLevelEditing';

const props = defineProps<{ value: LevelValues; currentLevel: number }>();
const emit = defineEmits<{ update: [value: LevelValues] }>();
const allLevels = inject(definitionAllLevelsKey, false);

function setKind(event: Event): void {
  const array = (event.target as HTMLSelectElement).value === 'levels';
  if (array && typeof props.value === 'number') emit('update', [props.value]);
  else if (!array && Array.isArray(props.value))
    emit('update', props.value[allLevels ? 0 : props.currentLevel - 1] ?? props.value[0] ?? 0);
}

function setValue(event: Event, index?: number): void {
  const raw = (event.target as HTMLInputElement).value;
  const value = Number(raw);
  if (raw.trim() === '' || !Number.isFinite(value)) return;
  if (typeof props.value === 'number') emit('update', value);
  else if (index !== undefined && index >= 0 && index < props.value.length) {
    const values = [...props.value];
    values[index] = value;
    emit('update', values);
  }
}

function append(): void {
  if (Array.isArray(props.value)) emit('update', [...props.value, 0]);
}

function remove(index: number): void {
  if (Array.isArray(props.value))
    emit(
      'update',
      props.value.filter((_, i) => i !== index),
    );
}
</script>

<template>
  <div class="level-values-editor">
    <select
      aria-label="数值形式"
      :value="Array.isArray(value) ? 'levels' : 'constant'"
      @change="setKind"
    >
      <option value="constant">常量（所有等级）</option>
      <option value="levels">逐级数值</option>
    </select>
    <input
      v-if="typeof value === 'number'"
      aria-label="常量数值"
      type="number"
      step="any"
      :value="value"
      @input="setValue($event)"
    />
    <template v-else>
      <p v-if="!allLevels && value[currentLevel - 1] === undefined">
        当前 {{ currentLevel }} 级未定义；下方编辑已有等级。
      </p>
      <div v-for="(number, index) in value" :key="index" class="level-values-editor__row">
        <label
          >{{ index + 1 }} 级{{ !allLevels && index + 1 === currentLevel ? '（当前）' : '' }}
          <input type="number" step="any" :value="number" @input="setValue($event, index)" />
        </label>
        <button
          type="button"
          :title="`删除第 ${index + 1} 级，后续等级前移`"
          @click="remove(index)"
        >
          ×
        </button>
      </div>
      <button type="button" @click="append">＋ 添加第 {{ value.length + 1 }} 级</button>
    </template>
  </div>
</template>

<style scoped>
.level-values-editor {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.level-values-editor__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 28px;
  gap: 6px;
}
.level-values-editor__row label {
  display: grid;
  grid-template-columns: minmax(56px, 0.6fr) minmax(0, 1fr);
  align-items: center;
  gap: 4px;
}
.level-values-editor input,
.level-values-editor select,
.level-values-editor button {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  height: 30px;
  color: var(--ea-fg);
  background: var(--ea-fill-input, #16161a);
  border: 1px solid var(--ea-border);
}
.level-values-editor p {
  margin: 0;
  font-size: 11px;
  color: var(--ea-fg-muted);
}
</style>
