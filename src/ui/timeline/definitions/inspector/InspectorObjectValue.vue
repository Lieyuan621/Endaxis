<script setup lang="ts">
import type { InspectorPropertyPath } from './inspectorProperty';
import type { DefinitionProperty } from '../definitionEditContext';
import { computed, defineAsyncComponent } from 'vue';
import type { InspectorValueShape } from './inspectorFields';
import { parameterInspectorField } from './parameterInspectorSchema';

const Fields = defineAsyncComponent(() => import('./InspectorFields.vue'));
const props = defineProps<{
  binding?: DefinitionProperty;
  value: Readonly<Record<string, unknown>>;
  properties: NonNullable<InspectorValueShape['properties']>;
  optionLabelPrefix?: string;
  currentLevel?: number;
  propertyPath?: InspectorPropertyPath;
}>();
const emit = defineEmits<{
  update: [value: Readonly<Record<string, unknown>>, path?: InspectorPropertyPath];
}>();
// 固定判别字段由外层联合选择器负责，不能再显示第二个类型下拉框。
const fields = computed(() =>
  Object.entries(props.properties)
    .filter(([, field]) => !(field.type === 'enum' && field.options?.length === 1))
    .map(([key, shape]) => {
      const field = parameterInspectorField<Record<string, unknown>>(key, shape);
      return key === 'kind' && props.optionLabelPrefix
        ? { ...field, optionLabelPrefix: props.optionLabelPrefix }
        : field;
    }),
);
</script>
<template>
  <Fields
    :binding="binding"
    :property-path="propertyPath"
    :value="value"
    :fields="fields"
    :current-level="currentLevel"
    @update="(next, path) => emit('update', next, path)"
  />
</template>
