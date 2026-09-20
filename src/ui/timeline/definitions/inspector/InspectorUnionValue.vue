<script setup lang="ts">
import { inspectorValueWrapper } from './inspectorValueWrapper';
import type { InspectorPropertyPath } from './inspectorProperty';
import type { DefinitionProperty } from '../definitionEditContext';
import { computed, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  createInspectorField,
  initialInspectorValue,
  matchesInspectorValue,
  type InspectorValueShape,
} from './inspectorFields';

const Fields = defineAsyncComponent(() => import('./InspectorFields.vue'));
const props = defineProps<{
  binding?: DefinitionProperty;
  value: unknown;
  variants: readonly InspectorValueShape[];
  labelKey: string;
  optionLabelPrefix?: string;
  currentLevel?: number;
  propertyPath?: InspectorPropertyPath;
}>();
const emit = defineEmits<{ update: [value: unknown, path?: InspectorPropertyPath] }>();
const { t, te } = useI18n({ useScope: 'global' });
const selected = computed(() =>
  props.variants.findIndex(shape => matchesInspectorValue(shape, props.value)),
);
const fields = computed(() => {
  const shape = props.variants[selected.value];
  return shape
    ? [
        createInspectorField<{ value: unknown }>('value', {
          editor: shape.type,
          options: shape.options,
          variants: shape.variants,
          properties: shape.properties,
          element: shape.element,
          labelKey: props.labelKey,
          optionLabelPrefix: props.optionLabelPrefix,
        }),
      ]
    : [];
});
const labelKeys: Record<InspectorValueShape['type'], string> = {
  text: 'valueTypes.string',
  number: 'valueTypes.number',
  boolean: 'valueTypes.boolean',
  enum: 'scalarValue',
  enumList: 'unionListValue',
  textList: 'unionListValue',
  actionValue: 'actionOperandValue',
  stringReference: 'operandBlackboard',
  union: 'contextValueType',
  object: 'queryParameters',
  array: 'unionListValue',
  levelValues: 'unionLevelValues',
  dictionary: 'queryParameters',
};
function variantLabel(shape: InspectorValueShape) {
  const kind = shape.properties?.kind?.options?.[0];
  if (kind !== undefined)
    return te(`${props.optionLabelPrefix}${kind}`) ? t(`${props.optionLabelPrefix}${kind}`) : kind;
  if (shape.type === 'object')
    return Object.entries(shape.properties ?? {})
      .filter(([, field]) => !field.optional)
      .map(([key]) =>
        te(`timeline.skillEditing.${key}`) ? t(`timeline.skillEditing.${key}`) : key,
      )
      .join(' / ');
  return t('timeline.skillEditing.' + labelKeys[shape.type]);
}
function switchVariant(event: Event) {
  const index = Number((event.target as HTMLSelectElement).value);
  const shape = props.variants[index];
  if (shape && index !== selected.value) {
    if (props.binding) props.binding.update(() => initialInspectorValue(shape));
    else emit('update', initialInspectorValue(shape));
  }
}
</script>
<template>
  <div class="inspector-union">
    <select
      :aria-label="t('timeline.skillEditing.contextValueType')"
      :value="selected"
      @change="switchVariant"
    >
      <option v-if="selected < 0" :value="-1" disabled>
        {{ t('timeline.skillEditing.unionUnknownValue') }}
      </option>
      <option v-for="(shape, index) in variants" :key="index" :value="index">
        {{ variantLabel(shape) }}
      </option>
    </select>
    <Fields
      :binding="binding"
      v-if="fields.length"
      :value-adapter="inspectorValueWrapper"
      :property-path="propertyPath"
      hide-headings
      :value="{ value }"
      :fields="fields"
      :current-level="currentLevel"
      @update="(next, path) => emit('update', next.value, path)"
    />
    <pre v-else>{{ JSON.stringify(value) }}</pre>
  </div>
</template>
<style scoped>
.inspector-union {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.inspector-union > select {
  width: 100%;
  min-width: 0;
  height: 32px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
.inspector-union > pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
