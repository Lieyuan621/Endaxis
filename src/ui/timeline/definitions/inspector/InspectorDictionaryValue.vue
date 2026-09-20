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
import { nextInspectorEntryKey, renameInspectorEntry } from './inspectorDictionary';

const Fields = defineAsyncComponent(() => import('./InspectorFields.vue'));
const props = defineProps<{
  binding?: DefinitionProperty;
  value: Readonly<Record<string, unknown>>;
  element: InspectorValueShape;
  labelKey: string;
  currentLevel?: number;
  propertyPath?: InspectorPropertyPath;
}>();
const emit = defineEmits<{
  update: [value: Readonly<Record<string, unknown>>, path?: InspectorPropertyPath];
}>();
const { t } = useI18n({ useScope: 'global' });
const fields = computed(() => [
  createInspectorField<{ value: unknown }>('value', {
    ...props.element,
    editor: props.element.type,
    labelKey: props.labelKey,
  }),
]);
function change(
  edit: (items: Readonly<Record<string, unknown>>) => Readonly<Record<string, unknown>>,
) {
  editPropertyValue(props.binding, props.value, edit, next => emit('update', next));
}
function rename(key: string, event: Event) {
  const input = event.target as HTMLInputElement;
  change(items => {
    const next = renameInspectorEntry(items, key, input.value);
    if (next === items) input.value = key;
    return next;
  });
}
function remove(key: string) {
  change(items =>
    Object.hasOwn(items, key)
      ? Object.fromEntries(Object.entries(items).filter(([name]) => name !== key))
      : items,
  );
}
function append() {
  change(items => ({
    ...items,
    [nextInspectorEntryKey(items)]: initialInspectorValue(props.element),
  }));
}
</script>
<template>
  <div class="inspector-dictionary">
    <div v-for="(item, key) in value" :key="key" class="inspector-dictionary__entry">
      <div class="inspector-dictionary__key">
        <input
          :value="key"
          :aria-label="t('timeline.skillEditing.assignmentTargetKey')"
          @change="rename(key, $event)"
        />
        <button type="button" :title="t('common.delete')" @click="remove(key)">×</button>
      </div>
      <Fields
        :binding="binding?.child(key)"
        :value-adapter="inspectorValueWrapper"
        :property-path="[...(propertyPath ?? []), key]"
        hide-headings
        :value="{ value: item }"
        :fields="fields"
        :current-level="currentLevel"
        @update="(next, path) => emit('update', { ...value, [key]: next.value }, path)"
      />
    </div>
    <button type="button" @click="append">＋ {{ t('common.add') }}</button>
  </div>
</template>
<style scoped>
.inspector-dictionary,
.inspector-dictionary__entry {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.inspector-dictionary__entry {
  border: 1px solid var(--ea-border-soft);
  padding: 8px;
}
.inspector-dictionary__key {
  display: flex;
  gap: 6px;
  min-width: 0;
}
input {
  flex: 1;
  width: 0;
  min-width: 0;
}
input,
button {
  min-height: 32px;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
}
</style>
