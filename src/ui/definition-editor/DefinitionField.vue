<script setup lang="ts">
import OwnedSpawnResourceField from '../field-editor/OwnedSpawnResourceField.vue';
import GraphRowBoundaryField from '../field-editor/GraphRowBoundaryField.vue';
import {
  definitionFieldWindowKey,
  DEFINITION_FIELD_WINDOW_DEPTH,
  DEFINITION_FIELD_WINDOW_ROWS,
  type DefinitionFieldFocus,
} from './definitionFieldWindow';
import SkillSettingValuesField from '../field-editor/SkillSettingValuesField.vue';
import { isSkillSettingValuesSchema } from '../field-editor/graphOperandContainerSchema';
import { auditDefinitionSchema } from '../../core/editor/auditDefinitionSchema';
import { useSchemaReferences } from './schemaReferenceContext';
import { resolveDefinitionSchema } from '../../core/editor/resolveDefinitionSchema';
import InlineCombatConditionField from '../field-editor/InlineCombatConditionField.vue';
import BlackboardMappingValueField from '../field-editor/BlackboardMappingValueField.vue';
import {
  inlineConditionDraftKey,
  inlineConditionEditingKey,
} from '../field-editor/inlineConditionContext';
import { useBlackboardFieldContext } from '../field-editor/blackboardFieldContext';
import {
  blackboardContextForField,
  skillSettingItemBlackboardContext,
} from '../../application/editor/blackboardFieldContext';
import { hasSemanticAlias } from '../../core/editor/fieldSemantics.ts';
import TimeScaleCurveField from '../field-editor/TimeScaleCurveField.vue';
import StringCollectionField from '../field-editor/StringCollectionField.vue';
import GameplayTagField from '../field-editor/GameplayTagField.vue';
import { stringCollectionDescriptor } from '../field-editor/stringCollectionSchema';
import { computed, inject, provide, ref, shallowRef, watch } from 'vue';
import NodeLevelValues from '../action-graph/NodeLevelValues.vue';
import BlackboardKeyField from '../field-editor/BlackboardKeyField.vue';
import { blackboardRequestForField } from '../../application/editor/blackboardFieldContext';
import { structuredFieldContextKey } from '../field-editor/structuredFieldContext';
import { isReadonlyDefinitionSlot } from '../field-editor/structuredValueSchema';
import { useI18n } from 'vue-i18n';
import {
  EaButton,
  EaCheckbox,
  EaInput,
  EaNumberInput,
  EaSelect,
  type EaSelectOption,
  type EaSelectValue,
} from '@/design-system';
import type { DefinitionFieldSchema } from './fieldSchema';
import { canSelectReference } from '@/application/editor/referenceResolver';
import type { ReferenceChoices } from './fieldInputConfig';
import { resolveFieldEditor } from '../field-editor/fieldEditorDispatch';
import ReferenceField from '../field-editor/ReferenceField.vue';
import BlackboardMappingField from '../field-editor/BlackboardMappingField.vue';
import { resolveBlackboardMapping } from '../field-editor/blackboardMapping';
import StringOperandField from '../field-editor/StringOperandField.vue';
import EditorHelp from '../editor/EditorHelp.vue';
import {
  editableDefault,
  fieldValueAt,
  emptyDefinitionActionGraph,
  fieldSchemaForValue,
  isProtectedDefinitionIdentity,
  preserveDefinitionExtensions,
  type DefinitionEditingContext,
} from './definitionFieldRuntime';
import DefinitionValueCreator from './DefinitionValueCreator.vue';

defineOptions({ name: 'DefinitionField' });
const props = defineProps<{
  name: string;
  editingContext?: DefinitionEditingContext;
  value: unknown;
  schema?: DefinitionFieldSchema;
  path: readonly (string | number)[];
  root?: boolean;
  expandDepth?: number;
  windowDepth?: number;
  hideLabel?: boolean;
  editable?: boolean;
  referenceChoices?: ReferenceChoices;
  referenceKind?: keyof ReferenceChoices;
  hiddenFields?: readonly string[];
}>();
const emit = defineEmits<{
  change: [path: readonly (string | number)[], value: unknown];
  openGraph: [path: readonly (string | number)[]];
}>();
const { t, te } = useI18n({ useScope: 'global' });
const references = useSchemaReferences(() => props.schema);
const inlineEditing = inject(inlineConditionEditingKey, undefined);
const schemaProblem = computed(() => {
  try {
    if (props.schema) auditDefinitionSchema({ ...props.schema, references: references.value });
    return '';
  } catch (cause) {
    return cause instanceof Error ? cause.message : String(cause);
  }
});
const resolution = computed(() => {
  try {
    if (schemaProblem.value) throw new Error(schemaProblem.value);
    let shape = fieldSchemaForValue(props.schema, props.value, props.name, references.value);
    const declared = props.schema && resolveDefinitionSchema(props.schema, references.value);
    // An invalid leaf (for example an empty numeric draft) must not erase the already
    // selected condition branch. This is rendering only: Apply still uses the strict
    // resolver and complete-condition validator, and unknown/ambiguous kinds stay opaque.
    if (
      inlineEditing?.value &&
      declared?.inlineCondition &&
      declared.kind === 'union' &&
      shape.kind === 'opaque' &&
      props.value &&
      typeof props.value === 'object' &&
      Object.hasOwn(props.value, 'kind')
    ) {
      const kind = (props.value as Record<string, unknown>).kind;
      const matches = declared.variants
        .map(variant => resolveDefinitionSchema(variant, references.value))
        .filter(variant => {
          if (variant.kind !== 'object' || !variant.fields.kind) return false;
          const discriminator = resolveDefinitionSchema(variant.fields.kind, references.value);
          return (
            discriminator.kind === 'enum' &&
            discriminator.options.length === 1 &&
            discriminator.options[0] === kind
          );
        });
      if (matches.length === 1) shape = matches[0]!;
    }
    return {
      shape,
      declared,
      error: '',
    };
  } catch (cause) {
    return {
      shape: { kind: 'opaque' } as DefinitionFieldSchema,
      declared: undefined,
      error: cause instanceof Error ? cause.message : String(cause),
    };
  }
});
const declaredSchema = computed(() => resolution.value.declared);
const schemaError = computed(() => resolution.value.error);
const inlineSchema = computed(
  () => declaredSchema.value && { ...declaredSchema.value, references: references.value },
);
const deferredConditionMessage = computed(() => {
  if (props.schema?.optional || props.schema?.kind !== 'condition') return '';
  if (props.name === 'availability' && props.schema.deferredCondition === 'availability')
    return t('inlineCondition.availabilityDeferred');
  if (props.name === 'condition' && props.schema.deferredCondition === 'legacyHandler')
    return t('inlineCondition.legacyHandlerDeferred');
  return '';
});
const inheritedWindow = inject(definitionFieldWindowKey, undefined);
const ownsWindow = props.root === true || !inheritedWindow;
const focusHistory = shallowRef<readonly DefinitionFieldFocus[]>([]);
const focus = computed(() => focusHistory.value.at(-1));
const window = ownsWindow
  ? {
      focus: (target: DefinitionFieldFocus) => {
        focusHistory.value = [...focusHistory.value, target];
      },
    }
  : inheritedWindow!;
provide(definitionFieldWindowKey, window);
const focusedValue = computed(
  () => focus.value && fieldValueAt(props.value, focus.value.path.slice(props.path.length)),
);
watch(
  () => props.value,
  () => {
    const target = focus.value;
    if (!target || !props.schema) return;
    try {
      let schema = props.schema;
      let value = props.value;
      for (const key of target.path.slice(props.path.length)) {
        const current = fieldSchemaForValue(schema, value, undefined, references.value);
        const next =
          current.kind === 'object'
            ? current.fields[String(key)]
            : current.kind === 'array'
              ? current.element
              : current.kind === 'tuple'
                ? current.elements[Number(key)]
                : current.kind === 'record'
                  ? current.value
                  : undefined;
        if (!next) throw new Error('focus path changed');
        schema = next;
        value =
          value && typeof value === 'object'
            ? (value as Record<string | number, unknown>)[key]
            : undefined;
      }
      if (value === undefined) throw new Error('focused container was removed');
      const actual = fieldSchemaForValue(schema, value, undefined, references.value);
      const previous = fieldSchemaForValue(target.schema, value, undefined, references.value);
      const same =
        actual === previous ||
        (actual.kind === 'object' &&
          previous.kind === 'object' &&
          actual.fields === previous.fields) ||
        (actual.kind === 'array' &&
          previous.kind === 'array' &&
          actual.element === previous.element) ||
        (actual.kind === 'record' &&
          previous.kind === 'record' &&
          actual.value === previous.value) ||
        (actual.kind === 'tuple' &&
          previous.kind === 'tuple' &&
          actual.elements === previous.elements);
      if (!same) focusHistory.value = [];
    } catch {
      focusHistory.value = [];
    }
  },
);
const depthLimited = computed(() => (props.windowDepth ?? 0) >= DEFINITION_FIELD_WINDOW_DEPTH);
const page = ref(0);
const pageStart = computed(() => page.value * DEFINITION_FIELD_WINDOW_ROWS);
function focusSubtree() {
  if (props.schema)
    window.focus({
      path: props.path,
      schema: props.schema,
      name: props.name,
      editable: !readonlyField.value,
      referenceKind: referenceKind.value,
    });
}
watch(
  () => [props.schema, props.name, props.path.join('.')],
  () => {
    focusHistory.value = [];
  },
);
function closeFocus() {
  focusHistory.value = focusHistory.value.slice(0, -1);
}
const inlineDraft = inject(inlineConditionDraftKey, undefined);
const blackboard = useBlackboardFieldContext();
const inlineKey = computed(() => {
  if (!inlineDraft || !props.path.length) return undefined;
  const parent = fieldValueAt(inlineDraft.value, props.path.slice(0, -1));
  if (
    !parent ||
    typeof parent !== 'object' ||
    !('kind' in parent) ||
    typeof parent.kind !== 'string'
  )
    return undefined;
  const request = blackboardRequestForField(parent.kind, [props.path.at(-1)!], props.schema);
  return (
    request && {
      request,
      context: blackboardContextForField(blackboard.value, parent.kind, [props.path.at(-1)!]),
    }
  );
});
const structuredContext = inject(structuredFieldContextKey, undefined);
const ownedResource = computed(
  () => declaredSchema.value && structuredContext?.value.ownedResources?.get(declaredSchema.value),
);
const graphSequence = computed(
  () =>
    !!declaredSchema.value &&
    !!structuredContext?.value.graphBoundaries?.sequences.has(declaredSchema.value),
);
const graphCondition = computed(
  () =>
    !!declaredSchema.value &&
    !!structuredContext?.value.graphBoundaries?.conditions.has(declaredSchema.value),
);
const graphOperand = computed(
  () =>
    !!declaredSchema.value && !!structuredContext?.value.graphOperands?.has(declaredSchema.value),
);
const graphOperandContext = computed(() =>
  skillSettingItemBlackboardContext(
    blackboard.value,
    structuredContext?.value.kind,
    [...(structuredContext?.value.path ?? []), ...props.path],
    structuredContext?.value.items,
  ),
);
const connectedOperand = computed(
  () =>
    graphOperand.value &&
    props.value &&
    typeof props.value === 'object' &&
    'kind' in props.value &&
    props.value.kind === 'valueNode',
);
const keyRequest = computed(() => {
  if (inlineKey.value) return inlineKey.value.request;
  if (!structuredContext) return;
  const path = [...structuredContext.value.path, ...props.path];
  const request = blackboardRequestForField(structuredContext.value.kind, path, props.schema);
  if (request && structuredContext.value.kind === 'spawnAbilityEntity') {
    const parent = fieldValueAt(structuredContext.value.spawnDefinition, path.slice(2, -1));
    return {
      ...request,
      fallback:
        parent &&
        typeof parent === 'object' &&
        'fallback' in parent &&
        typeof parent.fallback === 'number'
          ? parent.fallback
          : undefined,
    };
  }
  return request;
});
const protectedIdentity = computed(
  () =>
    props.editingContext !== 'value' &&
    (isProtectedDefinitionIdentity(props.name, props.path.length === 1) ||
      isReadonlyDefinitionSlot(props.schema)),
);
const shape = computed(() => resolution.value.shape);
const union = computed(() =>
  declaredSchema.value?.kind === 'union'
    ? {
        ...declaredSchema.value,
        variants: declaredSchema.value.variants.map(variant =>
          resolveDefinitionSchema(variant, references.value),
        ),
      }
    : null,
);
function canChooseVariant(variant: DefinitionFieldSchema): boolean {
  return (
    editableDefault(variant, references.value) !== undefined ||
    ['number', 'string', 'boolean', 'enum', 'object', 'tuple'].includes(variant.kind)
  );
}
const canSwitchUnion = computed(() => union.value?.variants.some(canChooseVariant) ?? false);
const pendingVariantIndex = ref<number | null>(null);
const pendingVariant = computed(() =>
  pendingVariantIndex.value === null ? null : union.value?.variants[pendingVariantIndex.value],
);
const unionIndex = computed(
  () =>
    pendingVariantIndex.value ??
    union.value?.variants.findIndex(variant => variant === shape.value) ??
    -1,
);
const recordKey = ref('');
const newItemValue = ref('');
const expanded = ref(props.root === true || (props.expandDepth ?? 0) > 0);
const creatingEntry = ref(false);
const creatingValue = ref(false);
const resolved = (schema: DefinitionFieldSchema) =>
  resolveDefinitionSchema(schema, references.value);
const needsForm = (schema: DefinitionFieldSchema) =>
  ['object', 'union', 'tuple', 'timeScaleCurve'].includes(resolved(schema).kind);
const readonlyField = computed(
  () => !props.editable || protectedIdentity.value || !!schemaError.value,
);
// 禁用只移除有效数据，当前表单仍保留草稿，重新启用时恢复。
const optionalEnabled = ref(props.value !== undefined);
const optionalDraft = shallowRef(props.value);
watch(
  () => props.value,
  value => {
    optionalEnabled.value = value !== undefined;
    if (value !== undefined) optionalDraft.value = value;
  },
);
const enabledSchema = computed(() => props.schema && { ...props.schema, optional: false });
const isContainer = computed(() =>
  ['object', 'array', 'tuple', 'record'].includes(shape.value.kind),
);
function toggleOptional(checked: boolean): void {
  if (readonlyField.value) return;
  optionalEnabled.value = checked;
  if (!optionalEnabled.value) update(undefined);
  else if (optionalDraft.value !== undefined) update(optionalDraft.value);
  else if (props.schema) {
    const initial = editableDefault(props.schema, references.value);
    if (initial !== undefined) update(initial);
  }
}
const label = computed(() =>
  te(`definitionEditor.fields.${props.name}`)
    ? t(`definitionEditor.fields.${props.name}`)
    : props.editingContext === 'value' && te(`actionGraphEditor.fields.${props.name}.name`)
      ? t(`actionGraphEditor.fields.${props.name}.name`)
      : te(`definitionEditor.kinds.${props.name}`)
        ? t(`definitionEditor.kinds.${props.name}`)
        : props.name,
);
function optionLabel(option: string | number | boolean): string {
  const key = `definitionEditor.options.${String(option)}`;
  return te(key)
    ? t(key)
    : props.editingContext === 'value' && te(`actionGraphEditor.options.${String(option)}`)
      ? t(`actionGraphEditor.options.${String(option)}`)
      : String(option);
}
function choiceOptions(schema: DefinitionFieldSchema, stringValues = false): EaSelectOption[] {
  schema = resolved(schema);
  const placeholder: EaSelectOption = {
    value: '',
    label: t('definitionEditor.chooseValue'),
    disabled: true,
  };
  if (schema.kind === 'boolean')
    return [
      placeholder,
      { value: 'true', label: t('definitionEditor.yes') },
      { value: 'false', label: t('definitionEditor.no') },
    ];
  if (schema.kind === 'enum')
    return [
      placeholder,
      ...schema.options.map(option => ({
        value: stringValues || typeof option === 'boolean' ? String(option) : option,
        label: optionLabel(option),
      })),
    ];
  return [placeholder];
}
const referenceKind = computed(
  () =>
    (!schemaError.value &&
      resolveFieldEditor(props.schema ?? shape.value, {
        name: props.name,
        referenceKind: props.referenceKind,
        protectedIdentity: protectedIdentity.value,
        references: references.value,
      }).referenceKind) ||
    undefined,
);
// Selecting a union keeps the semantic alias of this value, without changing
// shape identity used by the variant selector or propagating it to object children.
const editorSchema = computed((): DefinitionFieldSchema =>
  !schemaError.value && props.schema?.semantics
    ? {
        ...shape.value,
        inlineCondition: declaredSchema.value?.inlineCondition ?? shape.value.inlineCondition,
        semantics: {
          ...props.schema.semantics,
          ...shape.value.semantics,
          aliases: [
            ...(props.schema.semantics.aliases ?? []),
            ...(shape.value.semantics?.aliases ?? []),
          ],
        },
      }
    : shape.value,
);
const editor = computed(() =>
  resolveFieldEditor(schemaError.value ? { kind: 'opaque' } : editorSchema.value, {
    name: props.name,
    referenceKind: referenceKind.value,
    editable: props.editable === true,
    graphOperand: graphOperand.value,
    protectedIdentity: protectedIdentity.value,
    references: references.value,
  }),
);
function entryEditor(schema: DefinitionFieldSchema) {
  return resolveFieldEditor(schema, {
    referenceKind: referenceKind.value,
    references: references.value,
  });
}
const choices = computed(() => props.referenceChoices?.[referenceKind.value ?? '']);
const objectEntries = computed(() => {
  if (shape.value.kind !== 'object') return [];
  const value = props.value as Record<string, unknown> | undefined;
  return Object.entries(shape.value.fields)
    .filter(([key]) => !props.root || !props.hiddenFields?.includes(key))
    .map(([key, child]) => ({ key, child, value: value?.[key] }));
});
const recordEntries = computed(() =>
  props.value && typeof props.value === 'object' && !Array.isArray(props.value)
    ? Object.entries(props.value as Record<string, unknown>)
    : [],
);
const arrayEntries = computed(() =>
  Array.isArray(props.value)
    ? props.value
        .map((value, index) => ({ value, index }))
        .slice(pageStart.value, pageStart.value + DEFINITION_FIELD_WINDOW_ROWS)
    : [],
);
const rowCount = computed(() =>
  shape.value.kind === 'object'
    ? objectEntries.value.length
    : shape.value.kind === 'record'
      ? recordEntries.value.length
      : Array.isArray(props.value)
        ? props.value.length
        : 0,
);
watch(
  () => [props.value, props.schema],
  () => {
    page.value = Math.min(
      page.value,
      Math.max(0, Math.ceil(rowCount.value / DEFINITION_FIELD_WINDOW_ROWS) - 1),
    );
  },
);
function update(value: unknown) {
  if (readonlyField.value) return;
  emit('change', props.path, value);
}
function changeGraphOperand(value: unknown) {
  if (connectedOperand.value || !props.schema) return;
  update(preserveDefinitionExtensions(props.schema, props.value, value, references.value));
}
function createEntry(value: unknown) {
  if (readonlyField.value) return;
  if (shape.value.kind === 'array') update([...(props.value as readonly unknown[]), value]);
  else if (shape.value.kind === 'record') {
    const key = recordKey.value.trim();
    if (!key || recordEntries.value.some(([name]) => name === key)) return;
    update({ ...(props.value as Record<string, unknown>), [key]: value });
    recordKey.value = '';
  }
  creatingEntry.value = false;
}
function createValue(value: unknown) {
  update(
    props.schema
      ? preserveDefinitionExtensions(props.schema, props.value, value, references.value)
      : value,
  );
  creatingValue.value = false;
  pendingVariantIndex.value = null;
}
function addEmptyContainer(): void {
  if (shape.value.kind === 'array') update([]);
  if (shape.value.kind === 'record') update({});
}
function addEmptyGraph(): void {
  update(emptyDefinitionActionGraph());
}
function addRecordEntry() {
  if (shape.value.kind !== 'record') return;
  const key = recordKey.value.trim();
  if (!key || recordEntries.value.some(([name]) => name === key)) return;
  if (needsForm(shape.value.value)) {
    creatingEntry.value = true;
    return;
  }
  const initial = newEntryValue(shape.value.value);
  if (initial === undefined) return;
  update({ ...(props.value as Record<string, unknown>), [key]: initial });
  recordKey.value = '';
  newItemValue.value = '';
}
function removeRecordEntry(key: string) {
  const copy = { ...(props.value as Record<string, unknown>) };
  delete copy[key];
  update(copy);
}
function moveArray(index: number, delta: number) {
  const copy = [...(props.value as readonly unknown[])];
  const [item] = copy.splice(index, 1);
  copy.splice(index + delta, 0, item);
  update(copy);
}
function addArrayEntry() {
  if (shape.value.kind !== 'array') return;
  if (needsForm(shape.value.element)) {
    creatingEntry.value = true;
    return;
  }
  const initial = newEntryValue(shape.value.element);
  if (initial !== undefined) {
    update([...(props.value as readonly unknown[]), initial]);
    newItemValue.value = '';
  }
}
function newEntryValue(schema: DefinitionFieldSchema): unknown {
  schema = resolved(schema);
  if (schema.kind === 'string')
    return entryEditor(schema).control === 'reference' &&
      !canSelectReference(
        entryEditor(schema).referenceKind ?? '',
        newItemValue.value,
        props.referenceChoices?.[entryEditor(schema).referenceKind ?? ''],
      )
      ? undefined
      : newItemValue.value;
  if (schema.kind === 'number') {
    if (!newItemValue.value.trim()) return undefined;
    const number = Number(newItemValue.value);
    return Number.isFinite(number) ? number : undefined;
  }
  if (schema.kind === 'boolean')
    return newItemValue.value === '' ? undefined : newItemValue.value === 'true';
  if (schema.kind === 'enum')
    return schema.options.find(option => String(option) === newItemValue.value);
  return editableDefault(schema, references.value);
}
function canAddEntry(schema: DefinitionFieldSchema): boolean {
  return newEntryValue(schema) !== undefined;
}
function removeArrayEntry(index: number) {
  update((props.value as readonly unknown[]).filter((_, current) => current !== index));
}
function updateNumber(raw: string) {
  if (raw === '') return;
  const number = Number(raw);
  if (Number.isFinite(number)) update(number);
}
function updateNumberValue(value: number | undefined): void {
  if (value !== undefined && Number.isFinite(value)) update(value);
}
function updateOptionalChoice(chosen: EaSelectValue | EaSelectValue[]): void {
  if (Array.isArray(chosen)) return;
  if (shape.value.kind === 'boolean') update(chosen === 'true');
  if (shape.value.kind === 'enum')
    update(shape.value.options.find(option => String(option) === String(chosen)));
}
function variantLabel(variant: DefinitionFieldSchema): string {
  if (variant.kind === 'enum')
    return variant.options.length === 1
      ? optionLabel(variant.options[0]!)
      : `${t('definitionEditor.valueTypes.enum')} (${variant.options.slice(0, 3).map(optionLabel).join('、')}${variant.options.length > 3 ? '…' : ''})`;
  if (
    variant.kind === 'object' &&
    variant.fields.kind?.kind === 'enum' &&
    variant.fields.kind.options.length === 1
  )
    return optionLabel(variant.fields.kind.options[0]!);
  return t(`definitionEditor.valueTypes.${variant.kind}`);
}
function switchVariant(chosen: EaSelectValue | EaSelectValue[]): void {
  if (readonlyField.value || Array.isArray(chosen)) return;
  const index = Number(chosen);
  const variant = union.value?.variants[index];
  if (!variant) return;
  pendingVariantIndex.value = null;
  const initial = editableDefault(variant, references.value);
  if (initial !== undefined)
    update(preserveDefinitionExtensions(union.value!, props.value, initial, references.value));
  else if (['number', 'string', 'boolean', 'enum', 'object', 'tuple'].includes(variant.kind))
    pendingVariantIndex.value = index;
}
</script>

<template>
  <section
    class="definition-field"
    :data-field-semantic="editor.semantic"
    :data-field-control="editor.control"
    :data-field-fallback="editor.fallback"
    :class="{
      'definition-field--root': root,
      'definition-field--optional': schema?.optional,
      'definition-field--container': isContainer,
    }"
  >
    <p v-if="deferredConditionMessage" role="status">{{ deferredConditionMessage }}</p>
    <p v-if="schemaError" role="alert" data-field-traversal-error>{{ schemaError }}</p>
    <OwnedSpawnResourceField
      v-else-if="ownedResource"
      :value="value"
      :slot="ownedResource"
      :label="label"
      :path="[...structuredContext!.path, ...path]"
    />
    <GraphRowBoundaryField
      v-else-if="graphSequence || graphCondition"
      :value="value"
      :label="label"
      :sequence="graphSequence"
    />
    <template v-else-if="schema?.optional">
      <EaCheckbox
        class="definition-field__enable"
        :model-value="optionalEnabled"
        :disabled="
          readonlyField ||
          schema.kind === 'condition' ||
          schema.kind === 'opaque' ||
          (schema.kind === 'graph' && value !== undefined)
        "
        @change="toggleOptional"
        ><span>{{ label }}<EditorHelp v-if="schema.description" :text="schema.description" /></span
      ></EaCheckbox>
      <DefinitionField
        :editing-context="editingContext"
        :name="name"
        :value="value ?? optionalDraft"
        :schema="enabledSchema"
        :path="path"
        :root="root"
        :window-depth="windowDepth"
        :expand-depth="expandDepth"
        :hidden-fields="hiddenFields"
        :editable="!readonlyField && optionalEnabled"
        :reference-choices="referenceChoices"
        :reference-kind="referenceKind"
        hide-label
        @change="(childPath, next) => emit('change', childPath, next)"
        @open-graph="emit('openGraph', $event)"
      />
    </template>
    <InlineCombatConditionField
      v-else-if="editor.control === 'inlineCondition' && !inlineDraft"
      :schema="inlineSchema!"
      :value="value"
      :editable="!readonlyField"
      :label="label"
      :reference-choices="referenceChoices"
      @change="update"
    />
    <SkillSettingValuesField
      v-else-if="declaredSchema && isSkillSettingValuesSchema(declaredSchema)"
      :value="value"
      :editable="!readonlyField"
      :label="label"
      @change="update"
    />
    <BlackboardMappingValueField
      v-else-if="graphOperand"
      :context="graphOperandContext"
      :value="value"
      mode="operand"
      :label="label"
      :readonly="readonlyField || !!connectedOperand"
      @change="changeGraphOperand"
    />
    <BlackboardMappingValueField
      v-else-if="editor.control === 'inlineOperand' && inlineDraft"
      :value="value"
      :mode="
        hasSemanticAlias(editorSchema.semantics, 'LevelValues') ? 'levelsOrOperand' : 'operand'
      "
      :label="label"
      :readonly="readonlyField"
      :allows-parameters="false"
      @change="update"
    />
    <div v-else-if="editor.control === 'timeScaleCurve'">
      <span v-if="!hideLabel"
        >{{ label }}<EditorHelp v-if="schema?.description" :text="schema.description"
      /></span>
      <TimeScaleCurveField
        :value="value"
        :editable="!readonlyField"
        :label="label"
        @change="update"
      />
    </div>
    <div v-else-if="editor.control === 'levelValues'">
      <span v-if="!hideLabel"
        >{{ label }}<EditorHelp v-if="schema?.description" :text="schema.description"
      /></span>
      <NodeLevelValues
        :value="value as number | readonly number[] | undefined"
        :required="!schema?.optional"
        :readonly="readonlyField"
        :label="label"
        @value-change="update"
      />
    </div>
    <div v-else-if="keyRequest">
      <span v-if="!hideLabel"
        >{{ label }}<EditorHelp v-if="schema?.description" :text="schema.description"
      /></span>
      <BlackboardKeyField
        :value="value as string | undefined"
        :context="inlineKey?.context"
        :mode="keyRequest.mode"
        :value-type="keyRequest.valueType"
        :fallback="keyRequest.fallback"
        @draft-change="structuredContext?.kind === 'spawnAbilityEntity' && update($event)"
        :editable="!readonlyField"
        :label="label"
        @change="update"
      />
    </div>
    <div v-else-if="editor.control === 'stringCollection'">
      <span v-if="!hideLabel"
        >{{ label }}<EditorHelp v-if="schema?.description" :text="schema.description"
      /></span>
      <StringCollectionField
        :value="value"
        :editable="!readonlyField"
        required
        :label="label"
        :kind="stringCollectionDescriptor(editorSchema, name, referenceKind)!.kind"
        :reference-kind="referenceKind"
        :reference-choices="referenceChoices"
        @change="update"
      />
    </div>
    <div v-else-if="editor.control === 'gameplayTag'">
      <span v-if="!hideLabel"
        >{{ label }}<EditorHelp v-if="schema?.description" :text="schema.description"
      /></span>
      <GameplayTagField
        :value="value as string | undefined"
        :label="label"
        :disabled="readonlyField"
        @change="update"
      />
    </div>
    <BlackboardMappingField
      v-else-if="editor.control === 'blackboardMapping'"
      :value="value"
      :descriptor="resolveBlackboardMapping(editorSchema, name)!"
      :preserve-connections="!!structuredContext?.graphOperands"
      :value-schema="shape.kind === 'record' ? shape.value : undefined"
      :editable="!readonlyField"
      :label="label"
      @change="update"
    />
    <div v-else-if="editor.control === 'stringOperand'">
      <span v-if="!hideLabel"
        >{{ label }}<EditorHelp v-if="schema?.description" :text="schema.description"
      /></span>
      <StringOperandField
        :value="value"
        :label="label"
        :editable="!readonlyField"
        required
        :reference-kind="referenceKind"
        :reference-choices="referenceChoices"
        @change="update"
      />
    </div>
    <p v-else-if="editor.semantic === 'valueOperand'" class="definition-field__unsupported">
      {{ t('fieldFallback.structured-editor-pending') }}
    </p>
    <label
      v-else-if="value === undefined"
      class="definition-field__missing"
      :class="{ 'definition-field__value-only': hideLabel }"
    >
      <span v-if="!hideLabel"
        >{{ label }}<EditorHelp v-if="schema?.description" :text="schema.description"
      /></span>
      <EaSelect
        v-if="union && canSwitchUnion"
        :disabled="readonlyField"
        :model-value="pendingVariantIndex ?? ''"
        :options="[
          { value: '', label: t('definitionEditor.chooseValue'), disabled: true },
          ...union.variants.map((variant, index) => ({
            value: index,
            label: variantLabel(variant),
            disabled: !canChooseVariant(variant),
          })),
        ]"
        @change="switchVariant"
      />
      <EaInput
        v-else-if="editor.control === 'number'"
        type="number"
        :disabled="readonlyField"
        :placeholder="t('definitionEditor.enterValue')"
        @change="updateNumber"
      />
      <ReferenceField
        v-else-if="editor.control === 'reference'"
        :reference-kind="editor.referenceKind!"
        :choices="choices"
        :label="label"
        :disabled="readonlyField"
        @change="update($event)"
      />
      <EaInput
        v-else-if="editor.control === 'string'"
        :model-value="''"
        :disabled="readonlyField"
        :placeholder="t('definitionEditor.enterValue')"
        @change="update($event)"
      />
      <EaSelect
        v-else-if="shape.kind === 'enum' || editor.control === 'boolean'"
        :disabled="readonlyField"
        model-value=""
        :options="choiceOptions(shape)"
        @change="updateOptionalChoice"
      />
      <EaButton
        v-else-if="editor.control === 'graph'"
        :disabled="readonlyField"
        @click="addEmptyGraph"
      >
        {{ t('definitionEditor.addGraph') }}
      </EaButton>
      <EaButton
        v-else-if="
          shape.kind === 'array' ||
          shape.kind === 'tuple' ||
          shape.kind === 'record' ||
          shape.kind === 'object'
        "
        :disabled="readonlyField"
        @click="
          shape.kind === 'object' || shape.kind === 'tuple'
            ? (creatingValue = true)
            : addEmptyContainer()
        "
      >
        {{ t('definitionEditor.addField', { name: label }) }}
      </EaButton>
      <span v-else class="definition-field__unsupported">{{
        t(
          editor.control === 'condition'
            ? 'definitionEditor.conditionAbsent'
            : 'definitionEditor.specialField',
        )
      }}</span>
    </label>
    <template v-else-if="union">
      <label v-if="canSwitchUnion" class="definition-field__variant">
        <span>{{ label }}<EditorHelp v-if="schema?.description" :text="schema.description" /></span>
        <EaSelect
          :model-value="unionIndex"
          :disabled="readonlyField"
          :options="
            union.variants.map((variant, index) => ({
              value: index,
              label: variantLabel(variant),
              disabled: !canChooseVariant(variant),
            }))
          "
          @change="switchVariant"
        />
      </label>
      <DefinitionField
        :editing-context="editingContext"
        v-if="!pendingVariant"
        :name="name"
        :value="value"
        :schema="editorSchema"
        :path="path"
        :root="root"
        :window-depth="windowDepth"
        :hidden-fields="hiddenFields"
        :editable="!readonlyField"
        :reference-choices="referenceChoices"
        :reference-kind="referenceKind"
        :hide-label="canSwitchUnion"
        @change="(childPath, next) => emit('change', childPath, next)"
        @open-graph="emit('openGraph', $event)"
      />
    </template>
    <template
      v-else-if="
        shape.kind === 'object' ||
        shape.kind === 'record' ||
        shape.kind === 'array' ||
        shape.kind === 'tuple'
      "
    >
      <details
        :class="{ 'definition-field__unlabelled': hideLabel }"
        :open="hideLabel || expanded"
        @toggle="expanded = ($event.target as HTMLDetailsElement).open"
      >
        <summary>
          {{ hideLabel ? t(`definitionEditor.valueTypes.${shape.kind}`) : label }}
          <EditorHelp v-if="schema?.description" :text="schema.description" />
          <small v-if="shape.kind === 'array'">{{ (value as unknown[]).length }}</small>
        </summary>
        <EaButton
          v-if="(hideLabel || expanded) && depthLimited"
          data-field-focus
          @click="focusSubtree"
          >{{ t('definitionEditor.focusSubtree') }}</EaButton
        >
        <div v-else-if="hideLabel || expanded" class="definition-field__children">
          <template v-if="shape.kind === 'object'">
            <template
              v-for="entry in objectEntries.slice(
                pageStart,
                pageStart + DEFINITION_FIELD_WINDOW_ROWS,
              )"
              :key="entry.key"
            >
              <DefinitionField
                :editing-context="editingContext"
                :name="entry.key"
                :expand-depth="Math.max(0, (expandDepth ?? 0) - 1)"
                :value="entry.value"
                :schema="entry.child"
                :path="[...path, entry.key]"
                :window-depth="(windowDepth ?? 0) + 1"
                :editable="!readonlyField"
                :reference-choices="referenceChoices"
                @change="(childPath, next) => emit('change', childPath, next)"
                @open-graph="emit('openGraph', $event)"
              />
            </template>
          </template>
          <template v-else-if="shape.kind === 'tuple'">
            <DefinitionField
              v-for="{ value: item, index } in arrayEntries"
              :key="index"
              :editing-context="editingContext"
              :name="shape.semantics?.tuple?.elements[index]?.label ?? `${index + 1}`"
              :value="item"
              :schema="shape.elements[index]"
              :path="[...path, index]"
              :window-depth="(windowDepth ?? 0) + 1"
              :editable="!readonlyField"
              :reference-choices="referenceChoices"
              :expand-depth="1"
              @change="(childPath, next) => emit('change', childPath, next)"
            />
          </template>
          <template v-else-if="shape.kind === 'record'">
            <div
              v-for="[key, item] in recordEntries.slice(
                pageStart,
                pageStart + DEFINITION_FIELD_WINDOW_ROWS,
              )"
              :key="key"
              class="definition-field__item"
            >
              <DefinitionField
                :editing-context="editingContext"
                :name="key"
                :expand-depth="Math.max(0, (expandDepth ?? 0) - 1)"
                :value="item"
                :schema="shape.value"
                :path="[...path, key]"
                :window-depth="(windowDepth ?? 0) + 1"
                :editable="!readonlyField"
                :reference-choices="referenceChoices"
                :reference-kind="referenceKind"
                @change="(childPath, next) => emit('change', childPath, next)"
                @open-graph="emit('openGraph', $event)"
              />
              <EaButton :disabled="readonlyField" @click="removeRecordEntry(key)">
                {{ t('common.delete') }}
              </EaButton>
            </div>
            <div class="definition-field__item">
              <EaInput
                v-model="recordKey"
                :aria-label="t('definitionEditor.newKey')"
                :placeholder="t('definitionEditor.newKey')"
                :disabled="readonlyField"
              />
              <ReferenceField
                v-if="entryEditor(shape.value).control === 'reference'"
                :value="newItemValue"
                :label="t('definitionEditor.enterValue')"
                :reference-kind="entryEditor(shape.value).referenceKind!"
                :choices="referenceChoices?.[entryEditor(shape.value).referenceKind ?? '']"
                :disabled="readonlyField"
                @change="newItemValue = $event"
              />
              <EaInput
                v-else-if="
                  resolved(shape.value).kind === 'string' || resolved(shape.value).kind === 'number'
                "
                v-model="newItemValue"
                :type="resolved(shape.value).kind === 'number' ? 'number' : 'text'"
                :aria-label="t('definitionEditor.enterValue')"
                :placeholder="t('definitionEditor.enterValue')"
                :disabled="readonlyField"
              />
              <EaSelect
                v-else-if="
                  resolved(shape.value).kind === 'boolean' || resolved(shape.value).kind === 'enum'
                "
                v-model="newItemValue"
                :aria-label="t('definitionEditor.chooseValue')"
                :disabled="readonlyField"
                :options="choiceOptions(shape.value, true)"
              />
              <EaButton
                :disabled="
                  readonlyField ||
                  !recordKey.trim() ||
                  (!needsForm(shape.value) && !canAddEntry(shape.value))
                "
                @click="addRecordEntry"
              >
                {{ t('definitionEditor.add') }}
              </EaButton>
            </div>
            <DefinitionValueCreator
              :editing-context="editingContext"
              v-if="creatingEntry"
              :schema="shape.value"
              :field-path="[...path, recordKey.trim()]"
              :reference-kind="referenceKind"
              :editable="!readonlyField"
              :reference-choices="referenceChoices"
              @create="createEntry"
              @cancel="creatingEntry = false"
            />
          </template>
          <template v-else>
            <div
              v-for="{ value: item, index } in arrayEntries"
              :key="index"
              class="definition-field__item"
            >
              <DefinitionField
                :editing-context="editingContext"
                :name="`${index + 1}`"
                :expand-depth="Math.max(1, (expandDepth ?? 0) - 1)"
                :value="item"
                :schema="shape.element"
                :path="[...path, index]"
                :window-depth="(windowDepth ?? 0) + 1"
                :editable="!readonlyField"
                :reference-choices="referenceChoices"
                :reference-kind="referenceKind"
                @change="(childPath, next) => emit('change', childPath, next)"
                @open-graph="emit('openGraph', $event)"
              />
              <EaButton :disabled="readonlyField || index === 0" @click="moveArray(index, -1)">
                ↑
              </EaButton>
              <EaButton
                :disabled="readonlyField || index === (value as readonly unknown[]).length - 1"
                @click="moveArray(index, 1)"
              >
                ↓
              </EaButton>
              <EaButton :disabled="readonlyField" @click="removeArrayEntry(index)">
                {{ t('common.delete') }}
              </EaButton>
            </div>
            <div class="definition-field__item">
              <ReferenceField
                v-if="entryEditor(shape.element).control === 'reference'"
                :value="newItemValue"
                :label="t('definitionEditor.chooseValue')"
                :reference-kind="entryEditor(shape.element).referenceKind!"
                :choices="referenceChoices?.[entryEditor(shape.element).referenceKind ?? '']"
                :disabled="readonlyField"
                @change="newItemValue = $event"
              />
              <EaInput
                v-else-if="
                  resolved(shape.element).kind === 'string' ||
                  resolved(shape.element).kind === 'number'
                "
                v-model="newItemValue"
                :type="resolved(shape.element).kind === 'number' ? 'number' : 'text'"
                :aria-label="t('definitionEditor.enterValue')"
                :placeholder="t('definitionEditor.enterValue')"
                :disabled="readonlyField"
              />
              <EaSelect
                v-else-if="
                  resolved(shape.element).kind === 'boolean' ||
                  resolved(shape.element).kind === 'enum'
                "
                v-model="newItemValue"
                :aria-label="t('definitionEditor.chooseValue')"
                :disabled="readonlyField"
                :options="choiceOptions(shape.element, true)"
              />
              <EaButton
                :disabled="
                  readonlyField || (!needsForm(shape.element) && !canAddEntry(shape.element))
                "
                @click="addArrayEntry"
              >
                {{ t('definitionEditor.add') }}
              </EaButton>
            </div>
            <DefinitionValueCreator
              :editing-context="editingContext"
              v-if="creatingEntry"
              :schema="shape.element"
              :field-path="[...path, Array.isArray(value) ? value.length : 0]"
              :reference-kind="referenceKind"
              :editable="!readonlyField"
              :reference-choices="referenceChoices"
              @create="createEntry"
              @cancel="creatingEntry = false"
            />
          </template>
          <nav
            v-if="rowCount > DEFINITION_FIELD_WINDOW_ROWS"
            class="definition-field__pages"
            data-field-pages
          >
            <EaButton :disabled="page === 0" @click="page--">{{
              t('definitionEditor.previousPage')
            }}</EaButton>
            <span>{{ page + 1 }} / {{ Math.ceil(rowCount / DEFINITION_FIELD_WINDOW_ROWS) }}</span>
            <EaButton
              :disabled="pageStart + DEFINITION_FIELD_WINDOW_ROWS >= rowCount"
              @click="page++"
              >{{ t('definitionEditor.nextPage') }}</EaButton
            >
          </nav>
        </div>
      </details>
    </template>
    <template v-else>
      <div class="definition-field__value" :class="{ 'definition-field__value-only': hideLabel }">
        <span v-if="!hideLabel"
          >{{ label }}<EditorHelp v-if="schema?.description" :text="schema.description"
        /></span>
        <EaSelect
          v-if="shape.kind === 'enum'"
          :aria-label="label"
          :model-value="typeof value === 'boolean' ? String(value) : (value as string | number)"
          :options="
            shape.options.map(option => ({
              value: typeof option === 'boolean' ? String(option) : option,
              label: optionLabel(option),
            }))
          "
          :disabled="readonlyField"
          @change="updateOptionalChoice"
        />
        <EaNumberInput
          v-else-if="editor.control === 'number'"
          :aria-label="label"
          :model-value="value as number"
          :controls="false"
          :disabled="readonlyField"
          @update:model-value="updateNumberValue"
        />
        <EaCheckbox
          v-else-if="editor.control === 'boolean'"
          :aria-label="label"
          :model-value="value as boolean"
          :disabled="readonlyField"
          @change="update($event)"
        />
        <ReferenceField
          v-else-if="editor.control === 'reference'"
          :value="value as string"
          :label="label"
          :reference-kind="editor.referenceKind!"
          :choices="choices"
          :disabled="readonlyField"
          @change="update($event)"
        />
        <EaInput
          v-else-if="editor.control === 'string'"
          :aria-label="label"
          :model-value="value as string"
          :disabled="readonlyField"
          @change="update($event)"
        />
        <EaButton v-else-if="editor.control === 'graph'" @click="emit('openGraph', path)">
          {{ t('definitionEditor.openGraph') }}
        </EaButton>
        <span v-else-if="editor.control === 'null'">{{
          t('definitionEditor.valueTypes.null')
        }}</span>
        <span v-else-if="editor.control === 'condition'" class="definition-field__unsupported">{{
          t('definitionEditor.conditionReadOnly', {
            kind: (value as { kind?: string } | undefined)?.kind ?? '-',
          })
        }}</span>
        <span v-else class="definition-field__unsupported">{{
          t('definitionEditor.specialField')
        }}</span>
      </div>
    </template>
    <section
      v-if="ownsWindow && focus"
      class="definition-field__focus"
      role="dialog"
      :aria-label="t('definitionEditor.focusSubtree')"
      data-field-focus-window
    >
      <EaButton @click="closeFocus">{{ t('definitionEditor.backToParent') }}</EaButton>
      <small>{{ focus.path.join('.') }}</small>
      <DefinitionField
        :name="focus.name"
        :schema="focus.schema"
        :value="focusedValue"
        :path="focus.path"
        :editing-context="editingContext"
        :editable="editable && focus.editable"
        :reference-kind="focus.referenceKind"
        :reference-choices="referenceChoices"
        :window-depth="0"
        :expand-depth="1"
        @change="(childPath, next) => emit('change', childPath, next)"
        @open-graph="emit('openGraph', $event)"
      />
    </section>
    <small
      v-if="editor.fallback && !schema?.optional && !union"
      class="definition-field__unsupported"
    >
      {{ t(`fieldFallback.${editor.fallback}`) }}
    </small>
    <DefinitionValueCreator
      :editing-context="editingContext"
      v-if="creatingValue || pendingVariant"
      :key="pendingVariantIndex ?? 'create'"
      :schema="pendingVariant ?? shape"
      :field-path="path"
      :reference-kind="referenceKind"
      :editable="!readonlyField"
      :reference-choices="referenceChoices"
      @create="createValue"
      @cancel="
        creatingValue = false;
        pendingVariantIndex = null;
      "
    />
  </section>
</template>

<style scoped>
.definition-field__focus {
  padding: 12px;
  border: 1px solid var(--ea-border-soft);
  max-height: 70vh;
  overflow: auto;
}
.definition-field__pages {
  display: flex;
  align-items: center;
  gap: 8px;
}

.definition-field {
  min-width: 0;
  padding: 5px 0;
}
.definition-field details {
  border-left: 1px solid var(--ea-border, #555);
  padding-left: 12px;
}
.definition-field--root > details {
  border: 0;
  padding: 0;
}
.definition-field summary {
  cursor: pointer;
  font-weight: 600;
  padding: 6px 0;
}
.definition-field__children {
  display: grid;
  gap: 4px;
}
.definition-field label,
.definition-field__value {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}
.definition-field label span,
.definition-field__value > span {
  overflow-wrap: anywhere;
}
.definition-field label.definition-field__value-only,
.definition-field__value-only {
  grid-template-columns: 1fr;
}
.definition-field label :deep(.ea-input),
.definition-field label :deep(.ea-number-input),
.definition-field label :deep(.ea-select),
.definition-field__value :deep(.ea-input),
.definition-field__value :deep(.ea-number-input),
.definition-field__value :deep(.ea-select) {
  width: 100%;
}
.definition-field :deep(.ea-input),
.definition-field :deep(.ea-select),
.definition-field :deep(.ea-number-input) {
  min-width: 0;
}
.definition-field .definition-field__enable {
  display: flex;
  gap: 6px;
  margin: 0;
}
.definition-field--optional:not(.definition-field--container) {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}
.definition-field--optional > .definition-field {
  padding: 0;
}
.definition-field--container > .definition-field__enable {
  padding: 8px 0;
}
.definition-field__unlabelled > summary {
  display: none;
}
.definition-field__unlabelled > .definition-field__children {
  padding: 0;
}
.definition-field__item {
  padding: 8px;
  background: var(--ea-fill-soft);
  border: 1px solid var(--ea-border, #ffffff12);
}
.definition-field__item {
  display: flex;
  align-items: start;
  gap: 4px;
}
.definition-field__item > .definition-field {
  flex: 1;
}
.definition-field__pending {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.definition-field__unsupported {
  color: var(--ea-fg-muted);
}
@media (max-width: 700px) {
  .definition-field label,
  .definition-field__value,
  .definition-field--optional:not(.definition-field--container) {
    grid-template-columns: minmax(100px, 140px) minmax(0, 1fr);
  }
}
</style>
