<script setup lang="ts">
import { computed, inject, provide, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton } from '@/design-system';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
import DefinitionField from '../definition-editor/DefinitionField.vue';
import { blackboardFieldContextKey } from './blackboardFieldContext';
import { unknownBlackboardContext } from '../../application/editor/blackboardFieldContext';
import {
  definitionConditionContextKey,
  inlineConditionDraftKey,
  inlineConditionEditingKey,
} from './inlineConditionContext';
import { assertInlineCombatCondition } from '../../core/editor/inlineCombatCondition';
import { useSchemaReferences } from '../definition-editor/schemaReferenceContext';
import { validateStructuredValue } from './structuredValue';
import { useStructuredDraft } from './useStructuredDraft';

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
const { editing, draft, error, awaitingAcceptance, session, reset, begin, discard, change, stage } =
  useStructuredDraft(props, {
    validate(next) {
      validateStructuredValue(
        { ...props.schema, references: references.value },
        props.value,
        next,
        { choices: props.referenceChoices, blackboard: blackboard.value },
      );
    },
    change: next => emit('change', next),
    discard: () => emit('discard'),
  });
provide(
  inlineConditionEditingKey,
  computed(() => editing.value),
);
const currentProblem = computed(() => {
  if (editing.value || props.value === undefined) return '';
  try {
    assertInlineCombatCondition(props.schema, props.value, references.value);
    return '';
  } catch (cause) {
    return cause instanceof Error ? cause.message : String(cause);
  }
});
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
