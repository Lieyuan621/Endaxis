<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaInput } from '@/design-system';
import { type ReferenceChoices } from '@/application/editor/referenceResolver';
import { isStringNodeReference, validStringOperandDraft } from './stringOperandDraft';
import { blackboardNavigationKey } from './blackboardFieldContext';
import ReferenceField from './ReferenceField.vue';

const props = defineProps<{
  value: unknown;
  label: string;
  editable?: boolean;
  required?: boolean;
  referenceKind?: string;
  referenceChoices?: ReferenceChoices;
}>();
const emit = defineEmits<{ change: [value: unknown]; discard: [] }>();
const { t } = useI18n();
const navigate = inject(blackboardNavigationKey, undefined);
const graphReference = computed(() => isStringNodeReference(props.value));
const graphSource = computed(() =>
  graphReference.value &&
  props.value &&
  typeof props.value === 'object' &&
  'nodeId' in props.value &&
  typeof props.value.nodeId === 'string'
    ? props.value.nodeId
    : undefined,
);
const literalEditable = computed(() => props.editable && !graphReference.value);
const mode = computed(() => (graphReference.value ? 'graph' : 'literal'));
const literal = ref('');
const dirty = ref(false);
const original = computed(() =>
  typeof props.value === 'string' ? props.value : JSON.stringify(props.value),
);
function reset() {
  literal.value = typeof props.value === 'string' ? props.value : '';
  dirty.value = false;
}
function discard() {
  reset();
  emit('discard');
}
watch(() => props.value, reset, { immediate: true });
function changeLiteral(value: string | undefined) {
  if (!literalEditable.value) return;
  literal.value = value ?? '';
  dirty.value = true;
}
const valid = computed(() =>
  validStringOperandDraft(literal.value, props.referenceKind, props.referenceChoices),
);
function apply() {
  // 草稿打开期间目录可能变化，提交时重新检查。
  if (
    literalEditable.value &&
    dirty.value &&
    validStringOperandDraft(literal.value, props.referenceKind, props.referenceChoices)
  )
    emit('change', literal.value);
}
function locate() {
  if (graphSource.value) navigate?.({ owner: 'data', id: graphSource.value });
}
function unset() {
  if (literalEditable.value && !props.required) emit('change', undefined);
}
</script>

<template>
  <section
    @keydown.esc.prevent.stop="discard"
    class="string-operand"
    :data-string-operand-mode="mode"
  >
    <template v-if="graphReference">
      <small>{{ t('graphDataInput.source', { id: graphSource ?? original }) }}</small>
      <small>{{ t('graphDataInput.disconnectHelp') }}</small>
      <EaButton v-if="navigate && graphSource" size="sm" @click="locate">{{
        t('blackboardField.locate')
      }}</EaButton>
    </template>
    <ReferenceField
      v-if="mode === 'literal' && referenceKind"
      :value="literal"
      :label="label"
      :reference-kind="referenceKind"
      :choices="referenceChoices?.[referenceKind]"
      :disabled="!literalEditable"
      @change="changeLiteral"
    />
    <EaInput
      v-else-if="mode === 'literal'"
      :aria-label="label"
      :model-value="literal"
      :disabled="!literalEditable"
      @input="changeLiteral"
    />
    <small>{{ t('stringOperand.current') }}: {{ original ?? t('actionGraphEditor.unset') }}</small>
    <div v-if="literalEditable" class="string-operand__actions">
      <EaButton v-if="dirty" :disabled="!valid" size="sm" @click="apply">{{
        t('actionGraphEditor.apply')
      }}</EaButton>
      <EaButton v-if="dirty" size="sm" @click="discard">{{
        t('actionGraphEditor.discard')
      }}</EaButton>
      <EaButton v-if="!required && value !== undefined" size="sm" @click="unset">{{
        t('actionGraphEditor.unset')
      }}</EaButton>
    </div>
  </section>
</template>
<style scoped>
.string-operand {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.string-operand__actions {
  display: flex;
  gap: 6px;
}
.string-operand small {
  overflow-wrap: anywhere;
}
</style>
