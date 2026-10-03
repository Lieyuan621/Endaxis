<script setup lang="ts">
import { computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaSelect, type EaSelectValue } from '@/design-system';
import {
  resolveReference,
  type ReferenceCandidate,
  type ReferenceCatalog,
} from '@/application/editor/referenceResolver';
import { referenceNavigationKey } from './referenceNavigation';

/** Serialized values remain raw IDs; selection identities are source-qualified. */
const props = defineProps<{
  value?: string;
  label: string;
  referenceKind: string;
  choices?: ReferenceCatalog;
  disabled?: boolean;
  allowUnset?: boolean;
}>();
const emit = defineEmits<{ change: [value: string] }>();
const { t } = useI18n();
const navigate = inject(referenceNavigationKey, undefined);
const resolution = computed(() =>
  resolveReference(props.referenceKind, props.value, props.choices),
);
const selected = computed(() => resolution.value.selected);
const state = computed(() => resolution.value.state);
const catalogState = computed(() => resolution.value.catalogState);
const key = (candidate: ReferenceCandidate) =>
  JSON.stringify([candidate.source.id, candidate.identity]);
const modelValue = computed(() =>
  selected.value ? key(selected.value) : props.value ? 'unresolved' : '',
);
function candidateLabel(candidate: ReferenceCandidate) {
  return [
    candidate.label,
    candidate.source.label,
    candidate.owner,
    !candidate.writable ? t('fieldReference.readOnly') : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
}
const options = computed(() => [
  { value: '', label: t('fieldReference.unset'), disabled: !props.allowUnset },
  ...(props.value && !selected.value
    ? [{ value: 'unresolved', label: props.value, disabled: true }]
    : []),
  ...resolution.value.candidates.map(candidate => ({
    value: key(candidate),
    label: candidateLabel(candidate),
    disabled: !candidate.selectable,
  })),
]);
function change(value: EaSelectValue | EaSelectValue[]) {
  if (props.disabled || typeof value !== 'string') return;
  if (value === '' && props.allowUnset) {
    emit('change', '');
    return;
  }
  const candidate = resolution.value.candidates.find(
    candidate => key(candidate) === value && candidate.selectable,
  );
  if (candidate) emit('change', candidate.value);
}
const canNavigate = computed(() => Boolean(navigate && selected.value?.target));
async function openTarget() {
  if (selected.value?.target && navigate) await navigate(selected.value.target);
}
</script>

<template>
  <div
    class="reference-field"
    :data-reference-kind="referenceKind"
    :data-reference-state="state"
    :data-reference-catalog="catalogState"
  >
    <EaSelect
      :model-value="modelValue"
      :aria-label="label"
      :disabled="disabled"
      :options="options"
      :placeholder="t('fieldReference.unset')"
      @change="change"
    />
    <small v-if="value" class="reference-field__identity">{{ value }}</small>
    <small role="status">{{ t(`fieldReference.${state}`) }}</small>
    <small v-if="selected" class="reference-field__source">
      {{ t('fieldReference.source') }}: {{ selected.source.label }}
      <template v-if="selected.owner">
        · {{ t('fieldReference.owner') }}: {{ selected.owner }}</template
      >
      <template v-if="!selected.writable"> · {{ t('fieldReference.readOnly') }}</template>
    </small>
    <small v-if="catalogState !== 'available' && catalogState !== state">{{
      t(`fieldReference.${catalogState}`)
    }}</small>
    <EaButton v-if="canNavigate" class="reference-field__navigate" size="sm" @click="openTarget">
      {{ t('fieldReference.openTarget') }}
    </EaButton>
  </div>
</template>

<style scoped>
.reference-field {
  display: grid;
  min-width: 0;
  gap: 3px;
}
.reference-field :deep(.ea-select) {
  width: 100%;
}
.reference-field small {
  color: var(--ea-fg-muted);
  overflow-wrap: anywhere;
}
.reference-field__identity {
  font-family: monospace;
}
</style>
