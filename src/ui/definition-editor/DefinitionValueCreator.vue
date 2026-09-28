<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaSelect, type EaSelectValue } from '@/design-system';
import DefinitionField from './DefinitionField.vue';
import type { DefinitionFieldSchema } from './fieldSchema';
import type { ReferenceChoices } from './fieldInputConfig';
import { createDefinitionValueDraft, isCompleteDefinitionValue } from './definitionFieldRuntime';

const props = defineProps<{
  schema: DefinitionFieldSchema;
  editable: boolean;
  referenceChoices?: ReferenceChoices;
}>();
const emit = defineEmits<{ create: [value: unknown]; cancel: [] }>();
const { t, te } = useI18n();
const variants = computed(() =>
  props.schema.kind === 'union' ? props.schema.variants : [props.schema],
);
const index = ref(variants.value.length === 1 ? 0 : -1);
const selected = computed(() => variants.value[index.value]);
const value = shallowRef<unknown>(
  selected.value ? createDefinitionValueDraft(selected.value) : undefined,
);
const complete = computed(
  () => selected.value && isCompleteDefinitionValue(selected.value, value.value),
);
function label(schema: DefinitionFieldSchema) {
  const kind =
    schema.kind === 'object' && schema.fields.kind?.kind === 'enum'
      ? schema.fields.kind.options[0]
      : undefined;
  if (kind !== undefined) {
    const key = `definitionEditor.options.${kind}`;
    return te(key) ? t(key) : String(kind);
  }
  return t(`definitionEditor.valueTypes.${schema.kind}`);
}
function choose(next: EaSelectValue | EaSelectValue[]) {
  if (!props.editable) return;
  index.value = Number(next);
  value.value = selected.value ? createDefinitionValueDraft(selected.value) : undefined;
}
function change(path: readonly (string | number)[], next: unknown) {
  if (!props.editable) return;
  function replace(current: unknown, offset: number): unknown {
    if (offset === path.length) return next;
    const key = path[offset]!;
    if (Array.isArray(current)) {
      const copy = [...current];
      copy[Number(key)] = replace(copy[Number(key)], offset + 1);
      return copy;
    }
    const copy = { ...(current as Record<string, unknown> | undefined) };
    if (next === undefined && offset === path.length - 1) delete copy[key];
    else copy[key] = replace(copy[key], offset + 1);
    return copy;
  }
  value.value = replace(value.value, 0);
}
function create() {
  if (props.editable && complete.value) emit('create', value.value);
}
</script>

<template>
  <section class="definition-value-creator">
    <EaSelect
      v-if="variants.length > 1"
      class="definition-value-creator__selector"
      :model-value="index"
      :disabled="!editable"
      :aria-label="t('definitionEditor.chooseValue')"
      :options="[
        { value: -1, label: t('definitionEditor.chooseValue'), disabled: true },
        ...variants.map((variant, i) => ({ value: i, label: label(variant) })),
      ]"
      @change="choose"
    />
    <DefinitionField
      v-if="selected"
      :key="index"
      name="value"
      :value="value"
      :schema="selected"
      :path="[]"
      :editable="editable"
      :reference-choices="referenceChoices"
      root
      hide-label
      @change="change"
    />
    <div class="definition-value-creator__actions">
      <EaButton :disabled="!editable || !complete" @click="create">
        {{ t('definitionEditor.applyValue') }}
      </EaButton>
      <EaButton @click="emit('cancel')">{{ t('common.cancel') }}</EaButton>
    </div>
  </section>
</template>

<style scoped>
.definition-value-creator {
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--ea-border-soft);
}
.definition-value-creator__selector {
  width: 100%;
}
.definition-value-creator__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>
