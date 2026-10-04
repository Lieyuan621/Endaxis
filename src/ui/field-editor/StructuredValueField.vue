<script setup lang="ts">
import { spawnDefinitionResources } from './spawnDefinitionSchema';
import { spawnDefinitionBlackboardContext } from '../../application/editor/spawnDefinitionFieldContext';
import { graphSequenceBoundaries } from './graphSequenceContainerSchema';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import {
  globalBuffBlackboardContext,
  globalBuffDraftContext,
} from '../../application/editor/globalBuffFieldContext';
import { blackboardFieldContextKey } from './blackboardFieldContext';
import { computed, provide, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton } from '@/design-system';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
import DefinitionField from '../definition-editor/DefinitionField.vue';
import { useBlackboardFieldContext } from './blackboardFieldContext';
import { graphOperandSchemas } from './graphOperandContainerSchema';
import { structuredFieldContextKey } from './structuredFieldContext';
import { validateStructuredValue } from './structuredValue';
import { useStructuredDraft } from './useStructuredDraft';

const props = defineProps<{
  schema: DefinitionFieldSchema;
  actionValue?: unknown;
  graph?: ActionGraphDefinition;
  value: unknown;
  editable: boolean;
  label: string;
  kind: string;
  path: readonly string[];
  referenceChoices?: ReferenceChoices;
}>();
const emit = defineEmits<{ change: [value: unknown]; discard: [] }>();
const { t, te } = useI18n();
const blackboard = useBlackboardFieldContext();
const ownedResources = computed(() =>
  spawnDefinitionResources(props.schema, props.kind, props.path),
);
const globalBuff = computed(() =>
  props.kind === 'createGlobalBuff' && props.path.join('.') === 'parameters.definition'
    ? {
        definition: editing.value ? draft.value : props.value,
        overrides:
          globalBuffDraftContext(props.actionValue)?.overrides ??
          (props.actionValue === undefined ? null : undefined),
      }
    : undefined,
);
provide(
  blackboardFieldContextKey,
  computed(() =>
    globalBuff.value
      ? globalBuffBlackboardContext(
          blackboard.value,
          globalBuff.value.definition,
          globalBuff.value.overrides,
        )
      : ownedResources.value
        ? spawnDefinitionBlackboardContext(blackboard.value, props.actionValue)
        : blackboard.value,
  ),
);
provide(
  structuredFieldContextKey,
  computed(() => ({
    ownedResources: ownedResources.value,
    ownedNavigationBlocked: editing.value,
    spawnDefinition: ownedResources.value ? (editing.value ? draft.value : props.value) : undefined,
    globalBuff: globalBuff.value,
    graph: props.graph,
    kind: props.kind,
    path: props.path,
    items:
      props.kind === 'readSkillSettingData' && props.path.join('.') === 'parameters.items'
        ? editing.value
          ? draft.value
          : props.value
        : undefined,
    graphOperands: graphOperandSchemas(props.schema, props.kind, props.path),
    graphBoundaries: graphSequenceBoundaries(props.schema, props.kind, props.path),
  })),
);
const { editing, draft, error, awaitingAcceptance, session, reset, begin, discard, change, stage } =
  useStructuredDraft(props, {
    validate(next) {
      validateStructuredValue(props.schema, props.value, next, {
        actionValue: props.actionValue,
        choices: props.referenceChoices,
        blackboard: blackboard.value,
        globalBuff: globalBuff.value,
        graph: props.graph,
        kind: props.kind,
        path: props.path,
      });
    },
    change: next => emit('change', next),
    discard: () => emit('discard'),
  });
watch(() => [props.value, props.editable, props.schema, props.kind, props.path], reset);
</script>

<template>
  <section
    class="structured-value"
    :data-structured-path="path.join('.')"
    data-structured-value
    @keydown.esc.prevent.stop="discard"
  >
    <small v-if="ownedResources" role="status">{{ t('spawnDefinitionField.assignments') }}</small>
    <small v-if="globalBuff" role="status">{{ t('globalBuffField.localBoard') }}</small>
    <DefinitionField
      :key="session"
      :name="path.at(-1) ?? label"
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
      t('structuredValue.edit')
    }}</EaButton>
    <div v-if="editing && editable" class="structured-value__actions">
      <EaButton size="sm" :disabled="awaitingAcceptance" @click="stage">{{
        t('structuredValue.stage')
      }}</EaButton>
      <EaButton size="sm" @click="discard">{{ t('common.cancel') }}</EaButton>
      <small>{{ t('structuredValue.stageHint') }}</small>
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
