<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaInput, EaSelect, type EaSelectValue } from '@/design-system';
import {
  resolveBlackboardKey,
  type BlackboardFieldContext,
  type BlackboardKeyRequest,
} from '../../application/editor/blackboardFieldContext';
import { blackboardNavigationKey, useBlackboardFieldContext } from './blackboardFieldContext';

const props = withDefaults(
  defineProps<{
    value?: string;
    label?: string;
    context?: BlackboardFieldContext;
    mode: BlackboardKeyRequest['mode'];
    valueType: BlackboardKeyRequest['valueType'];
    fallback?: number;
    editable?: boolean;
  }>(),
  { value: '', label: '', editable: true },
);
const emit = defineEmits<{ change: [value: string]; draftChange: [value: string] }>();
const { t } = useI18n();
const inherited = useBlackboardFieldContext();
const navigate = inject(blackboardNavigationKey, undefined);
const context = computed(() => props.context ?? inherited.value);
const draft = ref(props.value);
watch(
  () => props.value,
  value => {
    draft.value = value;
  },
);
const resolution = computed(() => resolveBlackboardKey(context.value, draft.value, props));
const options = computed(() => [
  { value: '', label: t('blackboardField.choose'), disabled: true },
  ...resolution.value.candidates.map(candidate => ({
    value: candidate.key,
    label: [candidate.key, t(`blackboardField.types.${candidate.valueType}`), candidate.source]
      .filter(Boolean)
      .join(' · '),
    disabled: !candidate.selectable,
  })),
]);
function choose(value: EaSelectValue | EaSelectValue[]) {
  if (!props.editable || typeof value !== 'string') return;
  if (
    !resolution.value.candidates.some(candidate => candidate.key === value && candidate.selectable)
  )
    return;
  draft.value = value;
  emit('draftChange', value);
  emit('change', value);
}
function input(value: string) {
  if (!props.editable) return;
  draft.value = value;
  emit('draftChange', value);
}
function change(value: string) {
  if (!props.editable) return;
  draft.value = value;
  if (resolveBlackboardKey(context.value, value, props).valid) emit('change', value);
}
function locate() {
  if (resolution.value.state === 'valid' && resolution.value.selected?.target)
    navigate?.(resolution.value.selected.target);
}
</script>

<template>
  <div
    class="blackboard-key-field"
    :data-blackboard-mode="mode"
    :data-blackboard-state="resolution.state"
  >
    <EaSelect
      v-if="resolution.candidates.length"
      :model-value="resolution.selected?.key ?? ''"
      :options="options"
      :disabled="!editable"
      :aria-label="label || t('blackboardField.choose')"
      @change="choose"
    />
    <EaInput
      :model-value="draft"
      :disabled="!editable"
      :invalid="Boolean(draft) && !resolution.valid"
      :aria-label="label || t('blackboardField.key')"
      :placeholder="t('blackboardField.key')"
      @update:model-value="input"
      @change="change"
    />
    <small v-if="draft" class="blackboard-key-field__key">{{ draft }}</small>
    <small role="status">{{ t(`blackboardField.states.${resolution.state}`) }}</small>
    <small v-if="context.diagnostic === 'externalBuff'">{{
      t('blackboardField.externalBuff')
    }}</small>
    <small v-if="context.scopes.length"
      >{{ t('blackboardField.scope') }}:
      {{ context.scopes.map(scope => scope.label).join(' / ') }}</small
    >
    <small v-if="resolution.selected?.source"
      >{{ t('blackboardField.source') }}: {{ resolution.selected.source }}</small
    >
    <EaButton
      v-if="navigate && resolution.state === 'valid' && resolution.selected?.target"
      size="sm"
      @click="locate"
      >{{ t('blackboardField.locate') }}</EaButton
    >
  </div>
</template>

<style scoped>
.blackboard-key-field {
  display: grid;
  min-width: 0;
  gap: 4px;
}
.blackboard-key-field small {
  color: var(--ea-fg-muted);
  overflow-wrap: anywhere;
}
</style>
