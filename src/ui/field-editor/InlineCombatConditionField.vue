<script setup lang="ts">
import { computed, inject, nextTick, provide, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton } from '@/design-system';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
import DefinitionField from '../definition-editor/DefinitionField.vue';
import { writeNodeField } from '../action-graph/nodeFieldValues';
import { blackboardFieldContextKey } from './blackboardFieldContext';
import { unknownBlackboardContext } from '../../application/editor/blackboardFieldContext';
import {
  definitionConditionContextKey,
  inlineConditionDraftKey,
  inlineConditionEditingKey,
} from './inlineConditionContext';
import { assertInlineCombatCondition } from '../../core/editor/inlineCombatCondition';
import { useSchemaReferences } from '../definition-editor/schemaReferenceContext';
import { sameStructuredValue, validateStructuredValue } from './structuredValue';

const props = defineProps<{
  schema: DefinitionFieldSchema;
  value: unknown;
  editable: boolean;
  label: string;
  referenceChoices?: ReferenceChoices;
}>();
const emit = defineEmits<{ change: [value: unknown]; discard: [] }>();
const { t, te } = useI18n();
const references = useSchemaReferences(() => props.schema);
const blackboard = inject(
  definitionConditionContextKey,
  computed(() => unknownBlackboardContext()),
);
provide(
  blackboardFieldContextKey,
  computed(() => ({ ...blackboard.value, parameters: [] })),
);
provide(
  inlineConditionDraftKey,
  computed(() => (editing.value ? draft.value : props.value)),
);
const editing = ref(false);
provide(
  inlineConditionEditingKey,
  computed(() => editing.value),
);
const draft = shallowRef<unknown>();
const error = ref('');
const awaitingAcceptance = ref(false);
const currentProblem = computed(() => {
  if (editing.value || props.value === undefined) return '';
  try {
    assertInlineCombatCondition(props.schema, props.value, references.value);
    return '';
  } catch (cause) {
    return cause instanceof Error ? cause.message : String(cause);
  }
});
let session = 0;
function reset() {
  session++;
  editing.value = false;
  draft.value = undefined;
  error.value = '';
  awaitingAcceptance.value = false;
}
function begin() {
  if (!props.editable || editing.value) return;
  session++;
  draft.value = props.value;
  editing.value = true;
  error.value = '';
}
function discard() {
  reset();
  emit('discard');
}
function change(path: readonly (string | number)[], value: unknown) {
  if (!props.editable || !editing.value || awaitingAcceptance.value) return;
  if (error.value === 'structuredValue.rejected') emit('discard');
  error.value = '';
  draft.value = writeNodeField(draft.value, path.map(String), value);
}
async function stage() {
  if (!props.editable || !editing.value || awaitingAcceptance.value) return;
  try {
    validateStructuredValue(
      { ...props.schema, references: references.value },
      props.value,
      draft.value,
      {
        choices: props.referenceChoices,
        blackboard: blackboard.value,
      },
    );
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause);
    return;
  }
  if (sameStructuredValue(props.value, draft.value)) {
    reset();
    return;
  }
  const applying = session;
  const next = draft.value;
  awaitingAcceptance.value = true;
  emit('change', next);
  await nextTick();
  if (!editing.value || applying !== session) return;
  if (sameStructuredValue(props.value, next)) reset();
  else {
    awaitingAcceptance.value = false;
    error.value = 'structuredValue.rejected';
  }
}
watch(() => [props.value, props.editable, props.schema], reset);
</script>

<template>
  <section class="structured-value" data-inline-condition @keydown.esc.prevent.stop="discard">
    <small>{{ t('inlineCondition.hint') }}</small>
    <small v-if="currentProblem" role="alert">{{ currentProblem }}</small>
    <DefinitionField
      :key="session"
      :name="label"
      :schema="schema"
      :value="editing ? draft : value"
      :path="[]"
      editing-context="value"
      :editable="editable && editing && !awaitingAcceptance"
      :reference-choices="referenceChoices"
      :expand-depth="3"
      root
      hide-label
      @change="change"
    />
    <EaButton v-if="!editing && editable" size="sm" @click="begin">{{
      t('inlineCondition.edit')
    }}</EaButton>
    <div v-if="editing && editable" class="structured-value__actions">
      <EaButton size="sm" :disabled="awaitingAcceptance" @click="stage">{{
        t('graphDataInput.apply')
      }}</EaButton>
      <EaButton size="sm" @click="discard">{{ t('common.cancel') }}</EaButton>
    </div>
    <small v-if="error" role="alert">{{ te(error) ? t(error) : error }}</small>
  </section>
</template>

<style scoped>
.structured-value {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.structured-value__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.structured-value small {
  color: var(--ea-fg-muted);
}
.structured-value [role='alert'] {
  color: var(--ea-danger);
}
</style>
