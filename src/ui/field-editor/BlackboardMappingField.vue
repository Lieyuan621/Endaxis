<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import { preserveDefinitionExtensions } from '../definition-editor/definitionFieldRuntime';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import { useI18n } from 'vue-i18n';
import { EaButton } from '@/design-system';
import { unknownBlackboardContext } from '@/application/editor/blackboardFieldContext';
import BlackboardKeyField from './BlackboardKeyField.vue';
import BlackboardMappingValueField from './BlackboardMappingValueField.vue';
import { useBlackboardFieldContext } from './blackboardFieldContext';
import {
  createMappingRows,
  defaultMappingValue,
  isMappingRecord,
  mappingFromRows,
  mappingValidationError,
  validMappingSources,
  type BlackboardMappingDescriptor,
  type BlackboardMappingRow,
} from './blackboardMapping';

const props = defineProps<{
  value: unknown;
  descriptor: BlackboardMappingDescriptor;
  editable: boolean;
  label: string;
  required?: boolean;
  preserveConnections?: boolean;
  valueSchema?: DefinitionFieldSchema;
}>();
const emit = defineEmits<{ change: [value: unknown]; discard: [] }>();
const { t } = useI18n();
const context = useBlackboardFieldContext();
const editing = ref(false);
const rows = shallowRef<BlackboardMappingRow[]>([]);
const error = ref('');
const original = shallowRef<unknown>();
const awaitingAcceptance = ref(false);
const expectedNext = ref<unknown>();
const hasExpected = ref(false);
const unsetRequested = ref(false);
const draftValue = computed(() => (unsetRequested.value ? undefined : mappingFromRows(rows.value)));
const conflict = computed(
  () => editing.value && JSON.stringify(props.value) !== JSON.stringify(original.value),
);
const displayedRows = computed(() => createMappingRows(props.value));
const destination = computed(() =>
  unknownBlackboardContext(
    t(`blackboardMapping.destinationUnknown.${props.descriptor.destination}`),
  ),
);
const destinationType = computed(() =>
  props.descriptor.value === 'string'
    ? 'string'
    : props.descriptor.value === 'copy'
      ? 'any'
      : 'number',
);

function begin() {
  if (!props.editable) return;
  original.value = props.value;
  rows.value = createMappingRows(props.value);
  error.value = '';
  unsetRequested.value = false;
  editing.value = true;
}
function cancel() {
  editing.value = false;
  rows.value = [];
  error.value = '';
  awaitingAcceptance.value = false;
  expectedNext.value = undefined;
  hasExpected.value = false;
  unsetRequested.value = false;
}
function requestUnset() {
  if (!props.editable || props.required !== false) return;
  if (!editing.value) begin();
  unsetRequested.value = true;
}
function discard() {
  cancel();
  emit('discard');
}
function add() {
  if (!editing.value || !props.editable || awaitingAcceptance.value) return;
  unsetRequested.value = false;
  rows.value = [...rows.value, { key: '', value: defaultMappingValue(props.descriptor.value) }];
}
function remove(index: number) {
  if (!editing.value || !props.editable || awaitingAcceptance.value) return;
  if (connected(rows.value[index]?.value)) return;
  rows.value = rows.value.filter((_, current) => current !== index);
}
function connected(value: unknown): boolean {
  return !!props.preserveConnections && isMappingRecord(value) && value.kind === 'valueNode';
}
function changeKey(index: number, key: string) {
  if (
    !props.editable ||
    !editing.value ||
    awaitingAcceptance.value ||
    connected(rows.value[index]?.value)
  )
    return;
  rows.value = rows.value.map((row, current) => (current === index ? { ...row, key } : row));
}
function changeValue(index: number, value: unknown) {
  if (
    !props.editable ||
    !editing.value ||
    awaitingAcceptance.value ||
    connected(rows.value[index]?.value)
  )
    return;
  rows.value = rows.value.map((row, current) =>
    current === index
      ? {
          ...row,
          value: props.valueSchema
            ? preserveDefinitionExtensions(props.valueSchema, row.value, value)
            : value,
        }
      : row,
  );
}
async function apply() {
  if (!editing.value || !props.editable || awaitingAcceptance.value) return;
  if (conflict.value) {
    error.value = 'staleDraft';
    return;
  }
  const invalid = unsetRequested.value
    ? undefined
    : mappingValidationError(rows.value, original.value, props.descriptor.value);
  if (invalid) {
    error.value = invalid;
    return;
  }
  if (
    !unsetRequested.value &&
    !validMappingSources(rows.value, original.value, props.descriptor.value, context.value)
  ) {
    error.value = 'incompatibleSource';
    return;
  }
  if (unsetRequested.value && props.required !== false) return;
  const next = draftValue.value;
  if (JSON.stringify(next) === JSON.stringify(props.value)) {
    cancel();
    return;
  }
  awaitingAcceptance.value = true;
  expectedNext.value = next;
  hasExpected.value = true;
  emit('change', next);
  await nextTick();
  if (!editing.value) return;
  if (JSON.stringify(props.value) === JSON.stringify(next)) cancel();
  else {
    awaitingAcceptance.value = false;
    error.value = 'applyRejected';
  }
}
watch(
  () => props.value,
  value => {
    if (
      editing.value &&
      hasExpected.value &&
      JSON.stringify(value) === JSON.stringify(expectedNext.value) &&
      JSON.stringify(draftValue.value) === JSON.stringify(expectedNext.value)
    )
      cancel();
  },
);
watch(
  () => props.editable,
  editable => {
    if (!editable) cancel();
  },
);
watch(
  () => props.descriptor,
  (value, previous) => {
    if (value.value !== previous.value || value.destination !== previous.destination) cancel();
  },
);
function valueLabel(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (isMappingRecord(value)) {
    if (value.kind === 'constant')
      return `${t('blackboardMapping.constant')}: ${String(value.value)}`;
    if (value.kind === 'valueNode')
      return `${t('blackboardMapping.connection')}: ${String(value.nodeId)}`;
  }
  return JSON.stringify(value) ?? String(value);
}
</script>

<template>
  <div
    @keydown.esc.prevent.stop="discard"
    class="blackboard-mapping"
    :data-blackboard-mapping="descriptor.value"
    :data-mapping-destination="descriptor.destination"
  >
    <small
      >{{ t(`blackboardMapping.destination.${descriptor.destination}`) }} ·
      {{
        t(
          descriptor.destination === 'macroArguments'
            ? 'blackboardMapping.argumentKey'
            : 'blackboardMapping.writeDestination',
        )
      }}</small
    >
    <small class="blackboard-mapping__hint" role="status">{{ destination.diagnostic }}</small>
    <template v-if="!editing">
      <div v-for="row in displayedRows" :key="row.key" class="blackboard-mapping__summary">
        <span>{{ row.key }}</span
        ><span
          >←
          {{
            descriptor.value === 'copy'
              ? `${t('blackboardMapping.copySource')}: `
              : descriptor.value === 'string'
                ? `${t('blackboardMapping.stringLiteral')}: `
                : ''
          }}{{ valueLabel(row.value) }}</span
        >
      </div>
      <small v-if="value !== undefined && !isMappingRecord(value)" role="status"
        >{{ t('blackboardMapping.invalidMapping') }}: {{ valueLabel(value) }}</small
      >
      <small v-else-if="!displayedRows.length">{{ t('blackboardMapping.empty') }}</small>
      <EaButton v-if="editable" size="sm" @click="begin">{{
        t(
          value !== undefined && !isMappingRecord(value)
            ? 'blackboardMapping.replace'
            : 'blackboardMapping.edit',
        )
      }}</EaButton>
    </template>
    <template v-else>
      <div
        v-for="(row, index) in unsetRequested ? [] : rows"
        :key="index"
        class="blackboard-mapping__row"
      >
        <div>
          <small>{{
            t(
              descriptor.destination === 'macroArguments'
                ? 'blackboardMapping.argumentKey'
                : 'blackboardMapping.writeDestination',
            )
          }}</small>
          <BlackboardKeyField
            :value="row.key"
            :context="destination"
            :label="`${label} ${t(descriptor.destination === 'macroArguments' ? 'blackboardMapping.argumentKey' : 'blackboardMapping.writeDestination')} ${index + 1}`"
            mode="write"
            :value-type="destinationType"
            :editable="editable && !awaitingAcceptance && !connected(row.value)"
            @change="changeKey(index, $event)"
            @draft-change="changeKey(index, $event)"
          />
        </div>
        <BlackboardMappingValueField
          :value="row.value"
          :mode="descriptor.value"
          :label="`${label} ${t('blackboardMapping.value')} ${index + 1}`"
          @change="changeValue(index, $event)"
          :readonly="!editable || awaitingAcceptance || connected(row.value)"
        />
        <EaButton
          size="sm"
          :aria-label="`${t('blackboardMapping.remove')} ${row.key || index + 1}`"
          :disabled="awaitingAcceptance || connected(row.value)"
          @click="remove(index)"
          >{{ t('blackboardMapping.remove') }}</EaButton
        >
      </div>
      <small v-if="unsetRequested" role="status">{{ t('blackboardMapping.unsetPending') }}</small>
      <EaButton size="sm" @click="add">{{ t('blackboardMapping.add') }}</EaButton>
      <EaButton v-if="required === false && !unsetRequested" size="sm" @click="requestUnset">{{
        t('blackboardMapping.unset')
      }}</EaButton>
      <small v-if="error || conflict" role="alert">{{
        t(`blackboardMapping.${conflict ? 'staleDraft' : error}`)
      }}</small>
      <div class="blackboard-mapping__actions">
        <EaButton size="sm" :disabled="conflict || awaitingAcceptance" @click="apply">{{
          t('blackboardMapping.apply')
        }}</EaButton>
        <EaButton size="sm" @click="discard">{{ t('blackboardMapping.cancel') }}</EaButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.blackboard-mapping {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.blackboard-mapping__hint,
.blackboard-mapping small {
  color: var(--ea-fg-muted);
  overflow-wrap: anywhere;
}
.blackboard-mapping__summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: 8px;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.blackboard-mapping__row {
  display: grid;
  gap: 8px;
  border: 1px solid var(--ea-border);
  padding: 8px;
  border-radius: 5px;
}
.blackboard-mapping__actions {
  display: flex;
  gap: 6px;
}
</style>
