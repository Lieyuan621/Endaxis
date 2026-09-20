<script setup lang="ts">
import { inspectorValueWrapper } from './inspectorValueWrapper';
import type { InspectorPropertyPath } from './inspectorProperty';
import { editPropertyValue, type DefinitionProperty } from '../definitionEditContext';
import { computed, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  createInspectorField,
  initialInspectorValue,
  type InspectorValueShape,
} from './inspectorFields';

const Fields = defineAsyncComponent(() => import('./InspectorFields.vue'));
const props = defineProps<{
  binding?: DefinitionProperty;
  value: readonly unknown[];
  element: InspectorValueShape;
  labelKey: string;
  optionLabelPrefix?: string;
  currentLevel?: number;
  propertyPath?: InspectorPropertyPath;
}>();
const emit = defineEmits<{ update: [value: readonly unknown[], path?: InspectorPropertyPath] }>();
const { t } = useI18n({ useScope: 'global' });
const fields = computed(() => [
  createInspectorField<{ value: unknown }>('value', {
    editor: props.element.type,
    options: props.element.options,
    variants: props.element.variants,
    properties: props.element.properties,
    element: props.element.element,
    labelKey: props.labelKey,
    optionLabelPrefix: props.optionLabelPrefix,
  }),
]);
function replace(index: number, value: unknown, path?: InspectorPropertyPath) {
  emit(
    'update',
    props.value.map((item, i) => (i === index ? value : item)),
    path,
  );
}
function change(edit: (items: readonly unknown[]) => readonly unknown[]) {
  editPropertyValue(props.binding, props.value, edit, next => emit('update', next));
}
function remove(index: number) {
  change(items =>
    index < 0 || index >= items.length ? items : items.filter((_, i) => i !== index),
  );
}
function move(index: number, offset: number) {
  change(items => {
    const target = index + offset;
    if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
}
function append() {
  change(items => [...items, initialInspectorValue(props.element)]);
}
</script>
<template>
  <div class="inspector-array">
    <details v-for="(item, index) in value" :key="index" open>
      <summary>{{ index + 1 }}</summary>
      <div class="inspector-array__actions">
        <button
          type="button"
          :disabled="index === 0"
          :title="t('common.moveUp')"
          @click="move(index, -1)"
        >
          ↑
        </button>
        <button
          type="button"
          :disabled="index === value.length - 1"
          :title="t('common.moveDown')"
          @click="move(index, 1)"
        >
          ↓
        </button>
        <button type="button" :title="t('common.delete')" @click="remove(index)">×</button>
      </div>
      <Fields
        :binding="binding?.child(index)"
        :value-adapter="inspectorValueWrapper"
        :property-path="[...(propertyPath ?? []), index]"
        hide-headings
        :value="{ value: item }"
        :fields="fields"
        :current-level="currentLevel"
        @update="(next, path) => replace(index, next.value, path)"
      />
    </details>
    <button type="button" @click="append">＋ {{ t('common.add') }}</button>
  </div>
</template>
<style scoped>
.inspector-array {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.inspector-array > details {
  min-width: 0;
  border: 1px solid var(--ea-border-soft);
  padding: 8px;
}
.inspector-array summary {
  cursor: pointer;
}
.inspector-array__actions {
  display: flex;
  justify-content: end;
  gap: 4px;
  margin-bottom: 6px;
}
.inspector-array button {
  min-height: 30px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
</style>
