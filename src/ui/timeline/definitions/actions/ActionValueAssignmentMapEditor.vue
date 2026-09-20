<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ActionValueOperand } from '../../../../core/game-data/operatorDefinition';
import ActionValueOperandEditor from './ActionValueOperandEditor.vue';

const props = defineProps<{
  assignments: Readonly<Record<string, ActionValueOperand>>;
  title?: string;
  newKeyPrefix?: string;
}>();
const emit = defineEmits<{
  update: [assignments: Readonly<Record<string, ActionValueOperand>>];
}>();
const { t } = useI18n({ useScope: 'global' });
const entries = computed(() => Object.entries(props.assignments));
const operandLabels = () => ({
  constant: t('timeline.skillEditing.operandConstant'),
  blackboard: t('timeline.skillEditing.operandBlackboard'),
  blackboardKey: t('timeline.skillEditing.operandBlackboardKey'),
  constantValue: t('timeline.skillEditing.operandConstantValue'),
});

function append(): void {
  let index = 1;
  const prefix = props.newKeyPrefix ?? 'value';
  while (`${prefix}${index}` in props.assignments) index += 1;
  emit('update', {
    ...props.assignments,
    [`${prefix}${index}`]: { kind: 'constant', value: 0 },
  });
}

function remove(key: string): void {
  const next = { ...props.assignments };
  delete next[key];
  emit('update', next);
}

function rename(oldKey: string, event: Event): void {
  const key = (event.target as HTMLInputElement).value.trim();
  if (key === '' || (key !== oldKey && key in props.assignments)) return;
  const next: Record<string, ActionValueOperand> = {};
  for (const [entryKey, value] of entries.value) next[entryKey === oldKey ? key : entryKey] = value;
  emit('update', next);
}

function setValue(key: string, value: ActionValueOperand): void {
  emit('update', { ...props.assignments, [key]: value });
}
</script>

<template>
  <fieldset class="assignment-map">
    <legend>{{ title ?? '黑板赋值' }}</legend>
    <div v-for="[key, value] in entries" :key="key" class="assignment-map__row">
      <input type="text" :value="key" aria-label="目标黑板键" @change="rename(key, $event)" />
      <ActionValueOperandEditor
        :value="value"
        :labels="operandLabels()"
        @update="setValue(key, $event)"
      />
      <button type="button" title="删除赋值" @click="remove(key)">×</button>
    </div>
    <p v-if="entries.length === 0" class="assignment-map__empty">没有赋值</p>
    <button type="button" class="assignment-map__add" @click="append">＋ 添加赋值</button>
  </fieldset>
</template>

<style scoped>
.assignment-map {
  min-width: 0;
  display: grid;
  gap: 8px;
  border: 1px solid var(--ea-border-soft);
}

.assignment-map__row {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(90px, 0.7fr) minmax(180px, 1.5fr) 28px;
  gap: 8px;
}

.assignment-map input,
.assignment-map button {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}

.assignment-map__empty {
  margin: 0;
  color: var(--ea-fg-muted);
}

.assignment-map__add {
  justify-self: start;
  padding: 0 10px;
}
</style>
