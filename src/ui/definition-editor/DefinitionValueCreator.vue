<script setup lang="ts">
import { writeNodeField } from '../action-graph/nodeFieldValues';
import { globalBuffBlackboardContext } from '../../application/editor/globalBuffFieldContext';
import { blackboardFieldContextKey } from '../field-editor/blackboardFieldContext';
import { isInlineCombatCondition } from '../../core/editor/inlineCombatCondition';
import { useBlackboardFieldContext } from '../field-editor/blackboardFieldContext';
import { structuredFieldContextKey } from '../field-editor/structuredFieldContext';
import { validateStructuredValue } from '../field-editor/structuredValue';
import { inlineConditionDraftKey } from '../field-editor/inlineConditionContext';
import { auditDefinitionSchema } from '../../core/editor/auditDefinitionSchema';
import { useSchemaReferences } from './schemaReferenceContext';
import { resolveDefinitionSchema } from '../../core/editor/resolveDefinitionSchema';
import { useTimeScaleCurveCatalog } from '../field-editor/timeScaleCurveCatalog';
import { computed, inject, provide, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaSelect, type EaSelectValue } from '@/design-system';
import { resolveFieldEditor } from '../field-editor/fieldEditorDispatch';
import { validReferenceDraft } from '../field-editor/referenceDraftValidation';
import DefinitionField from './DefinitionField.vue';
import type { DefinitionFieldSchema } from './fieldSchema';
import type { ReferenceChoices } from './fieldInputConfig';
import {
  createDefinitionValueDraft,
  isCompleteDefinitionValue,
  type DefinitionEditingContext,
} from './definitionFieldRuntime';

const props = defineProps<{
  schema: DefinitionFieldSchema;
  fieldPath?: readonly (string | number)[];
  editingContext?: DefinitionEditingContext;
  editable: boolean;
  referenceChoices?: ReferenceChoices;
  referenceKind?: keyof ReferenceChoices;
}>();
const emit = defineEmits<{ create: [value: unknown]; cancel: [] }>();
const { t, te } = useI18n();
const references = useSchemaReferences(() => props.schema);
const creationProblem = computed(() => {
  try {
    auditDefinitionSchema({ ...props.schema, references: references.value });
    return '';
  } catch (cause) {
    return cause instanceof Error ? cause.message : String(cause);
  }
});
const schema = computed(() =>
  creationProblem.value ? undefined : resolveDefinitionSchema(props.schema, references.value),
);
const curveCatalog = useTimeScaleCurveCatalog();
const variants = computed(() =>
  schema.value?.kind === 'union' &&
  resolveFieldEditor(schema.value, { references: references.value }).control !== 'stringOperand'
    ? schema.value.variants.map(variant => resolveDefinitionSchema(variant, references.value))
    : schema.value
      ? [schema.value]
      : [],
);
const index = ref(variants.value.length === 1 ? 0 : -1);
const selected = computed(() => variants.value[index.value]);
const inheritedStructuredContext = inject(structuredFieldContextKey, undefined);
const value = shallowRef<unknown>(
  selected.value
    ? createDefinitionValueDraft(
        selected.value,
        references.value,
        inheritedStructuredContext?.value.graphBoundaries,
      )
    : undefined,
);
const inlineDraft = inject(inlineConditionDraftKey, undefined);
const blackboard = useBlackboardFieldContext();
const structuredContext =
  inheritedStructuredContext &&
  computed(() => ({
    ...inheritedStructuredContext.value,
    ...(inheritedStructuredContext.value.ownedResources
      ? {
          spawnDefinition: writeNodeField(
            inheritedStructuredContext.value.spawnDefinition,
            [...inheritedStructuredContext.value.path.slice(2), ...(props.fieldPath ?? [])].map(
              String,
            ),
            value.value,
          ),
        }
      : {}),
    ...(inheritedStructuredContext.value.globalBuff &&
    inheritedStructuredContext.value.path.join('.') === 'parameters.definition' &&
    !props.fieldPath?.length
      ? { globalBuff: { ...inheritedStructuredContext.value.globalBuff, definition: value.value } }
      : {}),
    path: [...inheritedStructuredContext.value.path, ...(props.fieldPath ?? [])],
  }));
if (structuredContext) {
  provide(structuredFieldContextKey, structuredContext);
  provide(
    blackboardFieldContextKey,
    computed(() => {
      const global = structuredContext.value.globalBuff;
      return global
        ? globalBuffBlackboardContext(blackboard.value, global.definition, global.overrides)
        : blackboard.value;
    }),
  );
}
if (inlineDraft)
  provide(
    inlineConditionDraftKey,
    computed(() => value.value),
  );
watch(
  () => props.schema,
  () => {
    index.value = variants.value.length === 1 ? 0 : -1;
    value.value = selected.value
      ? createDefinitionValueDraft(
          selected.value,
          references.value,
          structuredContext?.value.graphBoundaries,
        )
      : undefined;
  },
);
const completionSchema = computed(() =>
  selected.value && schema.value && isInlineCombatCondition(schema.value)
    ? {
        ...selected.value,
        inlineCondition: schema.value.inlineCondition,
        semantics: schema.value.semantics,
      }
    : selected.value,
);
const complete = computed(() => {
  const graphOperands = structuredContext?.value.graphOperands;
  if (
    (graphOperands ||
      structuredContext?.value.graphBoundaries ||
      structuredContext?.value.ownedResources) &&
    completionSchema.value
  ) {
    try {
      validateStructuredValue(
        { ...completionSchema.value, references: references.value },
        undefined,
        value.value,
        {
          choices: props.referenceChoices,
          blackboard: blackboard.value,
          graphOperands,
          graphBoundaries: structuredContext?.value.graphBoundaries,
          kind: structuredContext?.value.kind,
          path: structuredContext?.value.path,
          items: structuredContext?.value.items,
          globalBuff: structuredContext?.value.globalBuff,
          graph: structuredContext?.value.graph,
        },
      );
      return value.value !== undefined;
    } catch {
      return false;
    }
  }
  return (
    completionSchema.value &&
    isCompleteDefinitionValue(
      completionSchema.value,
      value.value,
      props.editingContext,
      references.value,
    ) &&
    validReferenceDraft(
      completionSchema.value,
      value.value,
      props.referenceChoices,
      props.referenceKind,
      undefined,
      undefined,
      inlineDraft ? blackboard.value : undefined,
      curveCatalog.value,
      references.value,
    )
  );
});
function label(schema: DefinitionFieldSchema) {
  const kind =
    schema.kind === 'object' && schema.fields.kind?.kind === 'enum'
      ? schema.fields.kind.options[0]
      : undefined;
  if (kind !== undefined) {
    const key = `definitionEditor.options.${kind}`;
    return te(key)
      ? t(key)
      : props.editingContext === 'value' && te(`actionGraphEditor.options.${String(kind)}`)
        ? t(`actionGraphEditor.options.${String(kind)}`)
        : String(kind);
  }
  return t(`definitionEditor.valueTypes.${schema.kind}`);
}
function choose(next: EaSelectValue | EaSelectValue[]) {
  if (!props.editable) return;
  index.value = Number(next);
  value.value = selected.value
    ? createDefinitionValueDraft(
        selected.value,
        references.value,
        structuredContext?.value.graphBoundaries,
      )
    : undefined;
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
    <small v-if="creationProblem" role="alert">{{ creationProblem }}</small>
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
      :editing-context="editingContext"
      :value="value"
      :schema="selected"
      :path="[]"
      :editable="editable"
      :reference-choices="referenceChoices"
      :reference-kind="referenceKind"
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
