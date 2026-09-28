<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue';
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
import { REFERENCE_FIELD_KIND, type ReferenceChoices } from './fieldInputConfig';
import {
  editableDefault,
  emptyDefinitionActionGraph,
  fieldSchemaForValue,
} from './definitionFieldRuntime';
import DefinitionValueCreator from './DefinitionValueCreator.vue';

defineOptions({ name: 'DefinitionField' });
const props = defineProps<{
  name: string;
  value: unknown;
  schema?: DefinitionFieldSchema;
  path: readonly (string | number)[];
  root?: boolean;
  expandDepth?: number;
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
const shape = computed(() => fieldSchemaForValue(props.schema, props.value, props.name));
const union = computed(() => (props.schema?.kind === 'union' ? props.schema : null));
function canChooseVariant(variant: DefinitionFieldSchema): boolean {
  return (
    editableDefault(variant) !== undefined ||
    ['number', 'string', 'boolean', 'enum', 'object'].includes(variant.kind)
  );
}
const canSwitchUnion = computed(() => union.value?.variants.some(canChooseVariant) ?? false);
const pendingVariantIndex = ref<number | null>(null);
const pendingVariant = computed(() =>
  pendingVariantIndex.value === null ? null : union.value?.variants[pendingVariantIndex.value],
);
const pendingValue = ref('');
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
const needsForm = (schema: DefinitionFieldSchema) => ['object', 'union'].includes(schema.kind);
const readonlyField = computed(
  () =>
    !props.editable ||
    props.name === 'key' ||
    (props.path.length === 1 && ['slug', 'gameId', 'skillId'].includes(props.name)),
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
  ['object', 'array', 'record'].includes(
    fieldSchemaForValue(props.schema, props.value ?? optionalDraft.value, props.name).kind,
  ),
);
function toggleOptional(checked: boolean): void {
  if (readonlyField.value) return;
  optionalEnabled.value = checked;
  if (!optionalEnabled.value) update(undefined);
  else if (optionalDraft.value !== undefined) update(optionalDraft.value);
}
const label = computed(() =>
  te(`definitionEditor.fields.${props.name}`)
    ? t(`definitionEditor.fields.${props.name}`)
    : te(`definitionEditor.kinds.${props.name}`)
      ? t(`definitionEditor.kinds.${props.name}`)
      : props.name,
);
function optionLabel(option: string | number): string {
  const key = `definitionEditor.options.${String(option)}`;
  return te(key) ? t(key) : String(option);
}
function choiceOptions(schema: DefinitionFieldSchema, stringValues = false): EaSelectOption[] {
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
        value: stringValues ? String(option) : option,
        label: optionLabel(option),
      })),
    ];
  return [placeholder];
}
const referenceKind = computed(() => props.referenceKind ?? REFERENCE_FIELD_KIND[props.name]);
const choices = computed(() => props.referenceChoices?.[referenceKind.value ?? ''] ?? []);
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
function update(value: unknown) {
  if (readonlyField.value) return;
  emit('change', props.path, value);
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
  update(value);
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
  if (schema.kind === 'string')
    return referenceKind.value &&
      choices.value.length &&
      !choices.value.some(choice => choice.value === newItemValue.value)
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
  return editableDefault(schema);
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
  if (Array.isArray(chosen)) return;
  const index = Number(chosen);
  const variant = union.value?.variants[index];
  if (!variant) return;
  pendingVariantIndex.value = null;
  pendingValue.value = '';
  const initial = editableDefault(variant);
  if (initial !== undefined) update(initial);
  else if (['number', 'string', 'boolean', 'enum', 'object'].includes(variant.kind))
    pendingVariantIndex.value = index;
}
const pendingParsedValue = computed(() => {
  const variant = pendingVariant.value;
  if (!variant) return undefined;
  if (variant.kind === 'string') return pendingValue.value;
  if (variant.kind === 'number') {
    if (!pendingValue.value.trim()) return undefined;
    const parsed = Number(pendingValue.value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (variant.kind === 'boolean')
    return pendingValue.value === '' ? undefined : pendingValue.value === 'true';
  if (variant.kind === 'enum')
    return variant.options.find(option => String(option) === pendingValue.value);
  return undefined;
});
function applyPendingVariant(): void {
  if (pendingParsedValue.value === undefined) return;
  update(pendingParsedValue.value);
  pendingVariantIndex.value = null;
  pendingValue.value = '';
}
</script>

<template>
  <section
    class="definition-field"
    :class="{
      'definition-field--root': root,
      'definition-field--optional': schema?.optional,
      'definition-field--container': isContainer,
    }"
  >
    <template v-if="schema?.optional">
      <EaCheckbox
        class="definition-field__enable"
        :model-value="optionalEnabled"
        :disabled="readonlyField || schema.kind === 'condition' || schema.kind === 'opaque'"
        @change="toggleOptional"
        >{{ label }}</EaCheckbox
      >
      <DefinitionField
        :name="name"
        :value="value ?? optionalDraft"
        :schema="enabledSchema"
        :path="path"
        :root="root"
        :expand-depth="expandDepth"
        :hidden-fields="hiddenFields"
        :editable="editable && optionalEnabled"
        :reference-choices="referenceChoices"
        :reference-kind="referenceKind"
        hide-label
        @change="(childPath, next) => emit('change', childPath, next)"
        @open-graph="emit('openGraph', $event)"
      />
    </template>
    <label
      v-else-if="value === undefined"
      class="definition-field__missing"
      :class="{ 'definition-field__value-only': hideLabel }"
    >
      <span v-if="!hideLabel">{{ label }}</span>
      <EaSelect
        v-if="union && canSwitchUnion"
        :disabled="!editable"
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
        v-else-if="shape.kind === 'number'"
        type="number"
        :disabled="!editable"
        :placeholder="t('definitionEditor.enterValue')"
        @change="updateNumber"
      />
      <EaSelect
        v-else-if="shape.kind === 'string' && choices.length"
        :options="[...choices]"
        :disabled="!editable"
        :placeholder="t('definitionEditor.chooseValue')"
        @change="update($event)"
      />
      <EaInput
        v-else-if="shape.kind === 'string'"
        :model-value="''"
        :disabled="!editable"
        :placeholder="t('definitionEditor.enterValue')"
        @change="update($event)"
      />
      <EaSelect
        v-else-if="shape.kind === 'enum' || shape.kind === 'boolean'"
        :disabled="!editable"
        model-value=""
        :options="choiceOptions(shape)"
        @change="updateOptionalChoice"
      />
      <EaButton v-else-if="shape.kind === 'graph'" :disabled="!editable" @click="addEmptyGraph">
        {{ t('definitionEditor.addGraph') }}
      </EaButton>
      <EaButton
        v-else-if="shape.kind === 'array' || shape.kind === 'record' || shape.kind === 'object'"
        :disabled="!editable"
        @click="shape.kind === 'object' ? (creatingValue = true) : addEmptyContainer()"
      >
        {{ t('definitionEditor.addField', { name: label }) }}
      </EaButton>
      <span v-else class="definition-field__unsupported">{{
        t(
          shape.kind === 'condition'
            ? 'definitionEditor.conditionAbsent'
            : 'definitionEditor.specialField',
        )
      }}</span>
    </label>
    <template v-else-if="union">
      <label v-if="canSwitchUnion" class="definition-field__variant">
        <span>{{ label }}</span>
        <EaSelect
          :model-value="unionIndex"
          :disabled="!editable"
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
        v-if="!pendingVariant"
        :name="name"
        :value="value"
        :schema="shape"
        :path="path"
        :root="root"
        :hidden-fields="hiddenFields"
        :editable="editable"
        :reference-choices="referenceChoices"
        :hide-label="canSwitchUnion"
        @change="(childPath, next) => emit('change', childPath, next)"
        @open-graph="emit('openGraph', $event)"
      />
    </template>
    <template
      v-else-if="shape.kind === 'object' || shape.kind === 'record' || shape.kind === 'array'"
    >
      <details
        :class="{ 'definition-field__unlabelled': hideLabel }"
        :open="hideLabel || expanded"
        @toggle="expanded = ($event.target as HTMLDetailsElement).open"
      >
        <summary>
          {{ hideLabel ? t(`definitionEditor.valueTypes.${shape.kind}`) : label }}
          <small v-if="shape.kind === 'array'">{{ (value as unknown[]).length }}</small>
        </summary>
        <div v-if="hideLabel || expanded" class="definition-field__children">
          <template v-if="shape.kind === 'object'">
            <template v-for="entry in objectEntries" :key="entry.key">
              <DefinitionField
                :name="entry.key"
                :expand-depth="Math.max(0, (expandDepth ?? 0) - 1)"
                :value="entry.value"
                :schema="entry.child"
                :path="[...path, entry.key]"
                :editable="editable"
                :reference-choices="referenceChoices"
                @change="(childPath, next) => emit('change', childPath, next)"
                @open-graph="emit('openGraph', $event)"
              />
            </template>
          </template>
          <template v-else-if="shape.kind === 'record'">
            <div v-for="[key, item] in recordEntries" :key="key" class="definition-field__item">
              <DefinitionField
                :name="key"
                :expand-depth="Math.max(0, (expandDepth ?? 0) - 1)"
                :value="item"
                :schema="shape.value"
                :path="[...path, key]"
                :editable="editable"
                :reference-choices="referenceChoices"
                :reference-kind="referenceKind"
                @change="(childPath, next) => emit('change', childPath, next)"
                @open-graph="emit('openGraph', $event)"
              />
              <EaButton :disabled="!editable" @click="removeRecordEntry(key)">
                {{ t('common.delete') }}
              </EaButton>
            </div>
            <div class="definition-field__item">
              <EaInput
                v-model="recordKey"
                :aria-label="t('definitionEditor.newKey')"
                :placeholder="t('definitionEditor.newKey')"
                :disabled="!editable"
              />
              <EaInput
                v-if="shape.value.kind === 'string' || shape.value.kind === 'number'"
                v-model="newItemValue"
                :type="shape.value.kind === 'number' ? 'number' : 'text'"
                :aria-label="t('definitionEditor.enterValue')"
                :placeholder="t('definitionEditor.enterValue')"
                :disabled="!editable"
              />
              <EaSelect
                v-else-if="shape.value.kind === 'boolean' || shape.value.kind === 'enum'"
                v-model="newItemValue"
                :aria-label="t('definitionEditor.chooseValue')"
                :disabled="!editable"
                :options="choiceOptions(shape.value, true)"
              />
              <EaButton
                :disabled="
                  !editable ||
                  !recordKey.trim() ||
                  (!needsForm(shape.value) && !canAddEntry(shape.value))
                "
                @click="addRecordEntry"
              >
                {{ t('definitionEditor.add') }}
              </EaButton>
            </div>
            <DefinitionValueCreator
              v-if="creatingEntry"
              :schema="shape.value"
              :editable="!!editable"
              :reference-choices="referenceChoices"
              @create="createEntry"
              @cancel="creatingEntry = false"
            />
          </template>
          <template v-else>
            <div
              v-for="(item, index) in value as readonly unknown[]"
              :key="index"
              class="definition-field__item"
            >
              <DefinitionField
                :name="`${index + 1}`"
                :expand-depth="Math.max(1, (expandDepth ?? 0) - 1)"
                :value="item"
                :schema="shape.element"
                :path="[...path, index]"
                :editable="editable"
                :reference-choices="referenceChoices"
                :reference-kind="referenceKind"
                @change="(childPath, next) => emit('change', childPath, next)"
                @open-graph="emit('openGraph', $event)"
              />
              <EaButton :disabled="!editable || index === 0" @click="moveArray(index, -1)">
                ↑
              </EaButton>
              <EaButton
                :disabled="!editable || index === (value as readonly unknown[]).length - 1"
                @click="moveArray(index, 1)"
              >
                ↓
              </EaButton>
              <EaButton :disabled="!editable" @click="removeArrayEntry(index)">
                {{ t('common.delete') }}
              </EaButton>
            </div>
            <div class="definition-field__item">
              <EaSelect
                v-if="shape.element.kind === 'string' && choices.length"
                v-model="newItemValue"
                :aria-label="t('definitionEditor.chooseValue')"
                :disabled="!editable"
                :options="[
                  { value: '', label: t('definitionEditor.chooseValue'), disabled: true },
                  ...choices,
                ]"
              />
              <EaInput
                v-else-if="shape.element.kind === 'string' || shape.element.kind === 'number'"
                v-model="newItemValue"
                :type="shape.element.kind === 'number' ? 'number' : 'text'"
                :aria-label="t('definitionEditor.enterValue')"
                :placeholder="t('definitionEditor.enterValue')"
                :disabled="!editable"
              />
              <EaSelect
                v-else-if="shape.element.kind === 'boolean' || shape.element.kind === 'enum'"
                v-model="newItemValue"
                :aria-label="t('definitionEditor.chooseValue')"
                :disabled="!editable"
                :options="choiceOptions(shape.element, true)"
              />
              <EaButton
                :disabled="!editable || (!needsForm(shape.element) && !canAddEntry(shape.element))"
                @click="addArrayEntry"
              >
                {{ t('definitionEditor.add') }}
              </EaButton>
            </div>
            <DefinitionValueCreator
              v-if="creatingEntry"
              :schema="shape.element"
              :editable="!!editable"
              :reference-choices="referenceChoices"
              @create="createEntry"
              @cancel="creatingEntry = false"
            />
          </template>
        </div>
      </details>
    </template>
    <template v-else>
      <div class="definition-field__value" :class="{ 'definition-field__value-only': hideLabel }">
        <span v-if="!hideLabel">{{ label }}</span>
        <EaSelect
          v-if="shape.kind === 'enum'"
          :aria-label="label"
          :model-value="value as string | number"
          :options="shape.options.map(option => ({ value: option, label: optionLabel(option) }))"
          :disabled="readonlyField"
          @change="update($event)"
        />
        <EaNumberInput
          v-else-if="shape.kind === 'number'"
          :aria-label="label"
          :model-value="value as number"
          :controls="false"
          :disabled="readonlyField"
          @update:model-value="updateNumberValue"
        />
        <EaCheckbox
          v-else-if="shape.kind === 'boolean'"
          :aria-label="label"
          :model-value="value as boolean"
          :disabled="readonlyField"
          @change="update($event)"
        />
        <EaSelect
          v-else-if="shape.kind === 'string' && choices.length"
          :aria-label="label"
          :model-value="value as string"
          :options="[
            ...(value && !choices.some(choice => choice.value === value)
              ? [{ value: value as string, label: value as string }]
              : []),
            ...choices,
          ]"
          :disabled="readonlyField"
          @change="update($event)"
        />
        <EaInput
          v-else-if="shape.kind === 'string'"
          :aria-label="label"
          :model-value="value as string"
          :disabled="readonlyField"
          @change="update($event)"
        />
        <EaButton v-else-if="shape.kind === 'graph'" @click="emit('openGraph', path)">
          {{ t('definitionEditor.openGraph') }}
        </EaButton>
        <span v-else-if="shape.kind === 'null'">{{ t('definitionEditor.valueTypes.null') }}</span>
        <span v-else-if="shape.kind === 'condition'" class="definition-field__unsupported">{{
          t('definitionEditor.conditionReadOnly', {
            kind: (value as { kind?: string } | undefined)?.kind ?? '-',
          })
        }}</span>
        <span v-else class="definition-field__unsupported">{{
          t('definitionEditor.specialField')
        }}</span>
      </div>
    </template>
    <DefinitionValueCreator
      v-if="creatingValue || pendingVariant?.kind === 'object'"
      :schema="pendingVariant ?? shape"
      :editable="!!editable"
      :reference-choices="referenceChoices"
      @create="createValue"
      @cancel="
        creatingValue = false;
        pendingVariantIndex = null;
      "
    />
    <div v-else-if="pendingVariant" class="definition-field__pending">
      <EaInput
        v-if="pendingVariant.kind === 'number' || pendingVariant.kind === 'string'"
        v-model="pendingValue"
        :type="pendingVariant.kind === 'number' ? 'number' : 'text'"
        :disabled="!editable"
        :aria-label="t('definitionEditor.enterValue')"
      />
      <EaSelect
        v-else-if="pendingVariant.kind === 'boolean'"
        v-model="pendingValue"
        :disabled="!editable"
        :aria-label="t('definitionEditor.chooseValue')"
        :options="[
          { value: '', label: t('definitionEditor.chooseValue'), disabled: true },
          { value: 'true', label: t('definitionEditor.yes') },
          { value: 'false', label: t('definitionEditor.no') },
        ]"
      />
      <EaSelect
        v-else-if="pendingVariant.kind === 'enum'"
        v-model="pendingValue"
        :disabled="!editable"
        :aria-label="t('definitionEditor.chooseValue')"
        :options="[
          { value: '', label: t('definitionEditor.chooseValue'), disabled: true },
          ...pendingVariant.options.map(option => ({
            value: String(option),
            label: optionLabel(option),
          })),
        ]"
      />
      <EaButton
        :disabled="!editable || pendingParsedValue === undefined"
        @click="applyPendingVariant"
      >
        {{ t('definitionEditor.applyValue') }}
      </EaButton>
    </div>
  </section>
</template>

<style scoped>
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
