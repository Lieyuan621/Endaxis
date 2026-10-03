<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaInput, EaSelect, type EaSelectValue } from '@/design-system';
import { type ReferenceChoices } from '@/application/editor/referenceResolver';
import type { BlackboardFieldContext } from '@/application/editor/blackboardFieldContext';
import { isStringNodeReference, validStringOperandDraft } from './stringOperandDraft';
import { blackboardNavigationKey, useBlackboardFieldContext } from './blackboardFieldContext';
import BlackboardKeyField from './BlackboardKeyField.vue';
import ReferenceField from './ReferenceField.vue';

const props = defineProps<{
  value: unknown;
  label: string;
  editable?: boolean;
  required?: boolean;
  referenceKind?: string;
  referenceChoices?: ReferenceChoices;
  blackboardContext?: BlackboardFieldContext;
}>();
const emit = defineEmits<{ change: [value: unknown]; discard: [] }>();
const { t } = useI18n();
const inheritedContext = useBlackboardFieldContext();
const context = computed(() => props.blackboardContext ?? inheritedContext.value);
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
const inlineEditable = computed(() => props.editable && !graphReference.value);
const mode = ref<'literal' | 'blackboard' | 'graph'>('literal');
const literal = ref('');
const key = ref('');
const dirty = ref(false);
const original = computed(() =>
  typeof props.value === 'string' ? props.value : JSON.stringify(props.value),
);
function reset() {
  mode.value = graphReference.value
    ? 'graph'
    : typeof props.value === 'object' && props.value !== null && 'blackboardKey' in props.value
      ? 'blackboard'
      : 'literal';
  literal.value = typeof props.value === 'string' ? props.value : '';
  key.value =
    mode.value === 'blackboard'
      ? String((props.value as { blackboardKey: unknown }).blackboardKey)
      : '';
  dirty.value = false;
}
function discard() {
  reset();
  emit('discard');
}
watch(() => props.value, reset, { immediate: true });
function chooseMode(next: EaSelectValue | EaSelectValue[]) {
  if (!inlineEditable.value || (next !== 'literal' && next !== 'blackboard')) return;
  mode.value = next;
  dirty.value = true;
}
function changeLiteral(value: string | undefined) {
  if (!inlineEditable.value) return;
  literal.value = value ?? '';
  dirty.value = true;
}
function changeKey(value: string) {
  if (!inlineEditable.value) return;
  key.value = value;
  dirty.value = true;
}
const draft = computed(() =>
  mode.value === 'literal' ? literal.value : { blackboardKey: key.value },
);
const valid = computed(() =>
  validStringOperandDraft(draft.value, props.referenceKind, props.referenceChoices, context.value),
);
function apply() {
  // Re-evaluate at commit: catalogs/scopes may have changed with a draft open.
  if (
    inlineEditable.value &&
    dirty.value &&
    validStringOperandDraft(draft.value, props.referenceKind, props.referenceChoices, context.value)
  )
    emit('change', draft.value);
}
function locate() {
  if (graphSource.value) navigate?.({ owner: 'data', id: graphSource.value });
}
function unset() {
  if (inlineEditable.value && !props.required) emit('change', undefined);
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
    <EaSelect
      v-else
      :aria-label="`${label} · ${t('stringOperand.mode')}`"
      :model-value="mode"
      :disabled="!inlineEditable"
      :options="[
        { value: 'literal', label: t('stringOperand.literal') },
        { value: 'blackboard', label: t('stringOperand.blackboard') },
      ]"
      @change="chooseMode"
    />
    <ReferenceField
      v-if="mode === 'literal' && referenceKind"
      :value="literal"
      :label="label"
      :reference-kind="referenceKind"
      :choices="referenceChoices?.[referenceKind]"
      :disabled="!inlineEditable"
      @change="changeLiteral"
    />
    <EaInput
      v-else-if="mode === 'literal'"
      :aria-label="label"
      :model-value="literal"
      :disabled="!inlineEditable"
      @input="changeLiteral"
    />
    <BlackboardKeyField
      v-else-if="mode === 'blackboard'"
      :value="key"
      :label="label"
      :editable="inlineEditable"
      :context="context"
      mode="read"
      value-type="string"
      @draft-change="changeKey"
      @change="changeKey"
    />
    <small>{{ t('stringOperand.current') }}: {{ original ?? t('actionGraphEditor.unset') }}</small>
    <small v-if="mode === 'blackboard'">{{ t('stringOperand.readHelp') }}</small>
    <div v-if="inlineEditable" class="string-operand__actions">
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
