<script setup lang="ts">
import { spawnDefinitionResources } from '../field-editor/spawnDefinitionSchema';
import { graphSequenceBoundaries } from '../field-editor/graphSequenceContainerSchema';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { globalBuffDraftContext } from '../../application/editor/globalBuffFieldContext';
import TimeScaleCurveField from '../field-editor/TimeScaleCurveField.vue';
import { useTimeScaleCurveCatalog } from '../field-editor/timeScaleCurveCatalog';
import { assertTimeScaleCurveSelection } from '../field-editor/timeScaleCurveValue';
import StructuredValueField from '../field-editor/StructuredValueField.vue';
import { validateStructuredValue, sameStructuredValue } from '../field-editor/structuredValue';
import StringCollectionField from '../field-editor/StringCollectionField.vue';
import GameplayTagField from '../field-editor/GameplayTagField.vue';
import { stringCollectionDescriptor } from '../field-editor/stringCollectionSchema';
import { validStringCollection, validCollectionEntry } from '../field-editor/stringCollection';
import { canSelectReference } from '@/application/editor/referenceResolver';
import { computed, provide, ref, shallowRef, watch } from 'vue';
import type { BlackboardFieldContext } from '@/application/editor/blackboardFieldContext';
import {
  blackboardContextForField,
  blackboardRequestForField,
  resolveBlackboardKey,
  unknownBlackboardContext,
} from '@/application/editor/blackboardFieldContext';
import { blackboardFieldContextKey } from '../field-editor/blackboardFieldContext';
import BlackboardKeyField from '../field-editor/BlackboardKeyField.vue';
import ConditionListField from '../field-editor/ConditionListField.vue';
import BlackboardMappingField from '../field-editor/BlackboardMappingField.vue';
import { resolveBlackboardMapping, validMappingDraft } from '../field-editor/blackboardMapping';
import StringOperandField from '../field-editor/StringOperandField.vue';
import { validStringOperandDraft, isStringNodeReference } from '../field-editor/stringOperandDraft';
import { useI18n } from 'vue-i18n';
import {
  EaButton,
  EaCheckbox,
  EaInput,
  EaSelect,
  EaTextarea,
  type EaSelectValue,
} from '@/design-system';
import EditorHelp from '../editor/EditorHelp.vue';
import ReferenceField from '../field-editor/ReferenceField.vue';
import { resolveFieldEditor } from '../field-editor/fieldEditorDispatch';
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
import NodeLevelValues from './NodeLevelValues.vue';
import type { NodeFieldSchema } from './nodeSchema';
import { fieldName, fieldHelp, optionName } from './editorNodeText';
import {
  containsActionGraph,
  containsGraphReference,
  formatNodeField,
  parseNodeField,
  readNodeField,
  writeNodeField,
} from './nodeFieldValues';

const props = defineProps<{
  value: unknown;
  graph?: ActionGraphDefinition;
  readonly?: boolean;
  blackboardContext?: BlackboardFieldContext;
  kind: string;
  fields: readonly NodeFieldSchema[];
  choices?: Readonly<Record<string, readonly string[]>>;
  referenceChoices?: ReferenceChoices;
  applyValue: (value: unknown) => boolean;
}>();
provide(
  blackboardFieldContextKey,
  computed(() => props.blackboardContext ?? unknownBlackboardContext()),
);
const emit = defineEmits<{ pending: [value: boolean] }>();
const { t } = useI18n();
const curveCatalog = useTimeScaleCurveCatalog();
const inputs = ref<Record<string, string>>({});
const typedDrafts = shallowRef<Record<string, unknown>>({});
const hasTypedDrafts = computed(() => Object.keys(typedDrafts.value).length > 0);
function displayedValue(field: NodeFieldSchema): unknown {
  const key = field.path.join('.');
  return Object.hasOwn(typedDrafts.value, key)
    ? typedDrafts.value[key]
    : readNodeField(props.value, field.path);
}
function stageStructured(field: NodeFieldSchema, value: unknown) {
  if (props.readonly) return;
  const key = field.path.join('.');
  const drafts = { ...typedDrafts.value };
  if (sameStructuredValue(value, readNodeField(props.value, field.path))) delete drafts[key];
  else drafts[key] = value;
  typedDrafts.value = drafts;
  refreshPending();
}
function refreshPending() {
  pending.value =
    hasTypedDrafts.value ||
    props.fields.some(item => inputs.value[item.path.join('.')] !== committedText(item));
  emit('pending', pending.value);
}
function applyImmediate() {
  if (!hasTypedDrafts.value) apply();
}
const pending = ref(false);
const resetSerial = ref(0);
const error = ref('');
function fieldEditor(field: NodeFieldSchema) {
  return resolveFieldEditor(field, { nodeKind: props.kind });
}
function committedText(field: NodeFieldSchema): string {
  return ['structuredValue', 'timeScaleCurve'].includes(fieldEditor(field).control)
    ? ''
    : formatNodeField(readNodeField(props.value, field.path), field);
}

function collectionChoices(field: NodeFieldSchema) {
  const descriptor = stringCollectionDescriptor(field);
  if (
    descriptor?.referenceKind === 'abilityEntity' &&
    props.kind === 'findOwnerSpawnedAbilityEntities' &&
    (readNodeField(props.value, ['parameters', 'ownerContextKey']) ||
      inputs.value['parameters.ownerContextKey']?.trim())
  )
    return undefined;
  return props.referenceChoices;
}
function levelText(field: NodeFieldSchema): string {
  const value = structuredValue(field);
  return value &&
    typeof value === 'object' &&
    'kind' in value &&
    value.kind === 'constant' &&
    'value' in value
    ? JSON.stringify(value.value)
    : (inputs.value[field.path.join('.')] ?? '');
}
function structuredValue(field: NodeFieldSchema): unknown {
  const text = inputs.value[field.path.join('.')] ?? '';
  try {
    return text ? parseNodeField(text, field) : undefined;
  } catch {
    return readNodeField(props.value, field.path);
  }
}
function blackboardRequest(field: NodeFieldSchema) {
  const request = blackboardRequestForField(props.kind, field.path, field.valueSchema);
  const fallbackText = inputs.value.fallback ?? '';
  return request &&
    props.kind === 'blackboard' &&
    fallbackText.trim() !== '' &&
    Number.isFinite(Number(fallbackText))
    ? { ...request, fallback: Number(fallbackText) }
    : request;
}
function fieldContext(field: NodeFieldSchema) {
  return blackboardContextForField(
    props.blackboardContext ?? unknownBlackboardContext(),
    props.kind,
    field.path,
  );
}
function discardStructured(field: NodeFieldSchema) {
  inputs.value[field.path.join('.')] = committedText(field);
  const drafts = { ...typedDrafts.value };
  delete drafts[field.path.join('.')];
  typedDrafts.value = drafts;
  refreshPending();
  error.value = '';
  emit('pending', pending.value);
}
function changeStructured(field: NodeFieldSchema, value: unknown) {
  if (hasTypedDrafts.value) {
    stageStructured(field, value);
    return;
  }
  change(field.path.join('.'), formatNodeField(value, field));
  applyImmediate();
}
function reset() {
  resetSerial.value++;
  typedDrafts.value = {};
  inputs.value = Object.fromEntries(
    props.fields.map(field => [field.path.join('.'), committedText(field)]),
  );
  pending.value = false;
  error.value = '';
  emit('pending', false);
}
watch(
  [
    () => props.value,
    () => props.readonly,
    () => props.kind,
    () => props.fields.map(field => field.path.join('.')).join('|'),
  ],
  reset,
  { immediate: true },
);
function change(key: string, value: string) {
  if (props.readonly) return;
  inputs.value[key] = value;
  pending.value = true;
  emit('pending', true);
}
function selectValue(key: string, value: EaSelectValue | EaSelectValue[]) {
  if (typeof value !== 'string') return;
  change(key, value);
  applyImmediate();
}
function selectedOptions(field: NodeFieldSchema): unknown[] {
  const text = inputs.value[field.path.join('.')];
  return text ? JSON.parse(text) : [];
}
function toggleOption(field: NodeFieldSchema, option: string | number | boolean, checked: boolean) {
  const values = selectedOptions(field).filter(value => value !== option);
  if (checked) values.push(option);
  change(field.path.join('.'), JSON.stringify(values));
  applyImmediate();
}
function proposalValue(): unknown {
  let value = props.value;
  for (const field of props.fields) {
    const key = field.path.join('.');
    const typed = Object.hasOwn(typedDrafts.value, key);
    const text = inputs.value[key] ?? '';
    if (
      !typed &&
      (['structuredValue', 'timeScaleCurve'].includes(fieldEditor(field).control) ||
        text === committedText(field))
    )
      continue;
    value = writeNodeField(
      value,
      field.path,
      typed
        ? typedDrafts.value[key]
        : parseNodeField(text, field, fieldName(field.path, props.kind)),
    );
  }
  return value;
}
const previewValue = computed(() => {
  try {
    return proposalValue();
  } catch {
    return undefined;
  }
});
function apply(): boolean {
  if (props.readonly || !pending.value) return true;
  try {
    const proposal = proposalValue();
    let value = props.value;
    for (const field of props.fields) {
      const text = inputs.value[field.path.join('.')] ?? '';
      const typed = Object.hasOwn(typedDrafts.value, field.path.join('.'));
      if (
        !typed &&
        (['structuredValue', 'timeScaleCurve'].includes(fieldEditor(field).control) ||
          text === committedText(field))
      )
        continue;
      const parsed = typed
        ? typedDrafts.value[field.path.join('.')]
        : parseNodeField(text, field, fieldName(field.path, props.kind));
      if (typed && fieldEditor(field).control === 'structuredValue') {
        if (!field.valueSchema) throw new Error('missing structured value schema');
        validateStructuredValue(field.valueSchema, readNodeField(props.value, field.path), parsed, {
          actionValue: proposal,
          globalBuff: globalBuffDraftContext(proposal),
          graph: props.graph,
          choices: collectionChoices(field),
          blackboard: fieldContext(field),
          kind: props.kind,
          path: field.path,
        });
      }
      if (typed && fieldEditor(field).control === 'timeScaleCurve')
        assertTimeScaleCurveSelection(
          readNodeField(props.value, field.path),
          parsed,
          curveCatalog.value,
        );
      const editor = fieldEditor(field);
      if (
        editor.control === 'stringOperand' &&
        isStringNodeReference(readNodeField(props.value, field.path))
      ) {
        error.value = t('actionGraphEditor.invalid');
        return false;
      }
      const collection = stringCollectionDescriptor(field);
      if (
        collection &&
        !(parsed === undefined && field.valueSchema.optional) &&
        !validStringCollection(
          parsed,
          readNodeField(props.value, field.path),
          collection.kind,
          collection.referenceKind,
          collectionChoices(field),
        )
      ) {
        error.value = t('stringCollection.invalid');
        return false;
      }
      if (
        editor.control === 'gameplayTag' &&
        !(parsed === undefined && field.valueSchema.optional) &&
        !validCollectionEntry(parsed, 'gameplayTag')
      ) {
        error.value = t('stringCollection.invalidTag');
        return false;
      }
      const mapping = resolveBlackboardMapping(field);
      if (
        mapping &&
        !(parsed === undefined && field.valueSchema.optional) &&
        !validMappingDraft(
          parsed,
          readNodeField(props.value, field.path),
          mapping,
          fieldContext(field),
        )
      ) {
        error.value = t('actionGraphEditor.invalid');
        return false;
      }
      const request = blackboardRequest(field);
      if (
        request &&
        !(parsed === undefined && field.valueSchema.optional) &&
        (typeof parsed !== 'string' ||
          !resolveBlackboardKey(fieldContext(field), parsed, request).valid)
      ) {
        error.value = t('actionGraphEditor.invalid');
        return false;
      }
      if (
        editor.control === 'stringOperand' &&
        !(parsed === undefined && field.valueSchema.optional) &&
        !validStringOperandDraft(parsed, editor.referenceKind, props.referenceChoices)
      ) {
        error.value = t('fieldReference.invalid');
        return false;
      }
      if (
        editor.control === 'reference' &&
        !(parsed === undefined && field.valueSchema.optional) &&
        !(
          typeof parsed === 'string' &&
          canSelectReference(
            editor.referenceKind ?? '',
            parsed,
            props.referenceChoices?.[editor.referenceKind ?? ''],
          )
        )
      ) {
        error.value = t('fieldReference.invalid');
        return false;
      }
      if (
        (containsActionGraph(parsed) &&
          !(
            typed &&
            editor.control === 'structuredValue' &&
            spawnDefinitionResources(field.valueSchema, props.kind, field.path)
          )) ||
        (containsGraphReference(parsed) &&
          !(
            typed &&
            editor.control === 'structuredValue' &&
            (graphSequenceBoundaries(field.valueSchema, props.kind, field.path) ||
              spawnDefinitionResources(field.valueSchema, props.kind, field.path))
          ))
      ) {
        error.value = t('actionGraphEditor.invalid');
        return false;
      }
      value = writeNodeField(value, field.path, parsed);
    }
    // Creation overrides can invalidate an unchanged inner read. Recheck the complete
    // local definition after every sibling proposal, not only when its own field staged.
    if (props.kind === 'createGlobalBuff') {
      const definition = props.fields.find(
        field => field.path.join('.') === 'parameters.definition',
      );
      if (definition?.valueSchema)
        validateStructuredValue(
          definition.valueSchema,
          readNodeField(props.value, definition.path),
          readNodeField(value, definition.path),
          {
            kind: props.kind,
            path: definition.path,
            choices: props.referenceChoices,
            blackboard: props.blackboardContext,
            globalBuff: globalBuffDraftContext(value),
            graph: props.graph,
          },
        );
    }
    if (!props.applyValue(value)) {
      error.value = t('actionGraphEditor.invalid');
      return false;
    }
    reset();
    return true;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause);
    return false;
  }
}
defineExpose({ apply });
</script>

<template>
  <form @submit.prevent="apply" @keydown.esc.prevent.stop="reset">
    <div
      v-for="field in fields"
      :key="field.path.join('.')"
      class="node-field"
      :data-field-semantic="fieldEditor(field).semantic"
      :data-field-control="fieldEditor(field).control"
      :data-field-fallback="fieldEditor(field).fallback"
    >
      <span>
        <span class="field-name"
          >{{ fieldName(field.path, kind)
          }}<EditorHelp
            v-if="fieldHelp(field.path, kind) || field.description"
            :text="fieldHelp(field.path, kind) || field.description"
        /></span>
        <EditorHelp
          v-if="fieldEditor(field).fallback"
          :text="t(`fieldFallback.${fieldEditor(field).fallback}`)"
        />
        <small v-if="field.valueSchema.optional">{{ t('actionGraphEditor.optional') }}</small>
      </span>
      <TimeScaleCurveField
        v-if="fieldEditor(field).control === 'timeScaleCurve'"
        :key="`${field.path.join('.')}:${resetSerial}`"
        :value="displayedValue(field)"
        :editable="!readonly"
        :label="fieldName(field.path, kind)"
        staged
        @change="stageStructured(field, $event)"
        @discard="discardStructured(field)"
      />
      <StructuredValueField
        v-else-if="fieldEditor(field).control === 'structuredValue'"
        :key="`${field.path.join('.')}:${resetSerial}`"
        :schema="field.valueSchema!"
        :action-value="previewValue"
        :graph="graph"
        :value="displayedValue(field)"
        :editable="!readonly"
        :label="fieldName(field.path, kind)"
        :kind="kind"
        :path="field.path"
        :reference-choices="collectionChoices(field)"
        @change="stageStructured(field, $event)"
        @discard="discardStructured(field)"
      />
      <StringCollectionField
        v-else-if="fieldEditor(field).control === 'stringCollection'"
        :key="`${field.path.join('.')}:${resetSerial}`"
        :value="displayedValue(field)"
        :editable="!readonly"
        :required="!field.valueSchema.optional"
        :label="fieldName(field.path, kind)"
        :kind="stringCollectionDescriptor(field)!.kind"
        :reference-kind="stringCollectionDescriptor(field)!.referenceKind"
        :reference-choices="collectionChoices(field)"
        @change="changeStructured(field, $event)"
        @discard="discardStructured(field)"
      />
      <GameplayTagField
        v-else-if="fieldEditor(field).control === 'gameplayTag'"
        :key="`${field.path.join('.')}:${resetSerial}`"
        :allow-unset="field.valueSchema.optional"
        :value="inputs[field.path.join('.')]"
        :disabled="readonly"
        :label="fieldName(field.path, kind)"
        @change="selectValue(field.path.join('.'), $event)"
      />
      <ConditionListField
        v-else-if="fieldEditor(field).control === 'conditionList'"
        :value="displayedValue(field)"
        :key="`${field.path.join('.')}:${resetSerial}`"
        :editable="!readonly"
        :label="fieldName(field.path, kind)"
        @change="changeStructured(field, $event)"
        @discard="discardStructured(field)"
      />
      <BlackboardMappingField
        v-else-if="fieldEditor(field).control === 'blackboardMapping'"
        :value="displayedValue(field)"
        :key="`${field.path.join('.')}:${resetSerial}`"
        :descriptor="resolveBlackboardMapping(field)!"
        :required="!field.valueSchema.optional"
        :editable="!readonly"
        :label="fieldName(field.path, kind)"
        @change="changeStructured(field, $event)"
        @discard="discardStructured(field)"
      />
      <BlackboardKeyField
        v-else-if="blackboardRequest(field)"
        :value="inputs[field.path.join('.')] ?? ''"
        :label="fieldName(field.path, kind)"
        :editable="!readonly"
        :context="fieldContext(field)"
        :mode="blackboardRequest(field)!.mode"
        :value-type="blackboardRequest(field)!.valueType"
        :fallback="blackboardRequest(field)!.fallback"
        @draft-change="change(field.path.join('.'), $event)"
        @change="selectValue(field.path.join('.'), $event)"
      />
      <StringOperandField
        v-else-if="fieldEditor(field).control === 'stringOperand'"
        :value="displayedValue(field)"
        :key="`${field.path.join('.')}:${resetSerial}`"
        :label="fieldName(field.path, kind)"
        :editable="!readonly"
        :required="!field.valueSchema.optional"
        :reference-kind="fieldEditor(field).referenceKind"
        :reference-choices="referenceChoices"
        @change="changeStructured(field, $event)"
        @discard="discardStructured(field)"
      />
      <fieldset
        v-else-if="fieldEditor(field).control === 'levelValues'"
        :disabled="readonly"
        class="node-field__group"
      >
        <NodeLevelValues
          :text="levelText(field)"
          :readonly="readonly"
          :required="!field.valueSchema.optional"
          :label="fieldName(field.path, kind)"
          @change="
            change(field.path.join('.'), $event);
            applyImmediate();
          "
        />
      </fieldset>
      <div v-else-if="fieldEditor(field).control === 'multiselect'" class="field-options">
        <EaCheckbox
          :disabled="readonly"
          v-for="option in field.options"
          :key="String(option)"
          class="field-options__checkbox"
          :model-value="selectedOptions(field).includes(option)"
          @change="toggleOption(field, option, $event)"
        >
          {{ optionName(option, field.optionLabels) }}
        </EaCheckbox>
        <EaButton
          :disabled="readonly"
          v-if="field.valueSchema.optional && inputs[field.path.join('.')]"
          size="sm"
          @click="
            change(field.path.join('.'), '');
            applyImmediate();
          "
          >{{ t('actionGraphEditor.unset') }}</EaButton
        >
      </div>
      <ReferenceField
        :disabled="readonly"
        v-else-if="fieldEditor(field).control === 'reference'"
        :value="inputs[field.path.join('.')]"
        :label="fieldName(field.path, kind)"
        :reference-kind="fieldEditor(field).referenceKind!"
        :choices="referenceChoices?.[fieldEditor(field).referenceKind ?? '']"
        :allow-unset="field.valueSchema.optional"
        @change="selectValue(field.path.join('.'), $event)"
      />
      <EaSelect
        :disabled="readonly"
        v-else-if="choices?.[field.path.join('.')]"
        class="node-field__control"
        :aria-label="fieldName(field.path, kind)"
        size="sm"
        :model-value="inputs[field.path.join('.')]"
        :options="(choices?.[field.path.join('.')] ?? []).map(value => ({ value, label: value }))"
        @change="selectValue(field.path.join('.'), $event)"
      />
      <EaSelect
        :disabled="readonly"
        v-else-if="
          fieldEditor(field).control === 'select' || fieldEditor(field).control === 'boolean'
        "
        class="node-field__control"
        :aria-label="fieldName(field.path, kind)"
        size="sm"
        :model-value="inputs[field.path.join('.')]"
        :options="[
          ...(field.valueSchema.optional
            ? [{ value: '', label: t('actionGraphEditor.unset') }]
            : []),
          ...(fieldEditor(field).control === 'boolean' ? [true, false] : (field.options ?? [])).map(
            option => ({
              value: JSON.stringify(option),
              label: optionName(option, field.optionLabels),
            }),
          ),
        ]"
        @change="selectValue(field.path.join('.'), $event)"
      />
      <EaInput
        :disabled="readonly"
        v-else-if="
          fieldEditor(field).control === 'number' || fieldEditor(field).control === 'string'
        "
        class="node-field__control"
        :aria-label="fieldName(field.path, kind)"
        size="sm"
        :type="fieldEditor(field).control === 'number' ? 'number' : 'text'"
        step="any"
        :model-value="inputs[field.path.join('.')]"
        @input="change(field.path.join('.'), $event)"
        @blur="applyImmediate"
      />
      <EaTextarea
        :disabled="readonly"
        v-else
        class="node-field__control node-field__textarea"
        :aria-label="fieldName(field.path, kind)"
        size="sm"
        variant="code"
        spellcheck="false"
        :rows="Math.min(8, Math.max(2, (inputs[field.path.join('.')] ?? '').split('\n').length))"
        :model-value="inputs[field.path.join('.')]"
        @input="change(field.path.join('.'), $event)"
        @blur="applyImmediate"
        @keydown.ctrl.enter.prevent="apply"
        @keydown.meta.enter.prevent="apply"
      />
    </div>
    <pre v-if="error" class="field-error" role="alert">{{ error }}</pre>
    <small v-if="hasTypedDrafts" role="status">{{ t('structuredValue.staged') }}</small>
    <div v-if="pending" class="actions">
      <EaButton type="submit" size="sm" variant="primary">{{
        t('actionGraphEditor.apply')
      }}</EaButton>
      <EaButton size="sm" @click="reset">{{ t('actionGraphEditor.discard') }}</EaButton>
    </div>
  </form>
</template>

<style scoped>
.node-field__group {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}
.node-field__control {
  width: 100%;
  min-width: 0;
}
.node-field__textarea :deep(textarea) {
  font-family: Consolas, monospace;
}
.field-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
}
.field-options__checkbox {
  font-size: 12px;
}
</style>
