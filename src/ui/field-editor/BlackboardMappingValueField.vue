<script setup lang="ts">
import type { BlackboardFieldContext } from '../../application/editor/blackboardFieldContext';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaInput, EaSelect, type EaSelectValue } from '@/design-system';
import NodeLevelValues from '../action-graph/NodeLevelValues.vue';
import BlackboardKeyField from './BlackboardKeyField.vue';
import { useBlackboardFieldContext } from './blackboardFieldContext';
import { isLevelValues, isMappingRecord, type BlackboardMappingValue } from './blackboardMapping';

const props = defineProps<{
  value: unknown;
  mode: BlackboardMappingValue;
  label: string;
  readonly?: boolean;
  context?: BlackboardFieldContext;
}>();
const emit = defineEmits<{ change: [value: unknown] }>();
const { t } = useI18n();
const inheritedContext = useBlackboardFieldContext();
const context = computed(() => props.context ?? inheritedContext.value);
const operand = computed(() => (isMappingRecord(props.value) ? props.value : {}));
const branch = computed(() => {
  if (props.mode === 'string' || props.mode === 'copy') return props.mode;
  if (isLevelValues(props.value)) return 'levels';
  return typeof operand.value.kind === 'string' ? operand.value.kind : 'invalid';
});
const options = computed(() => [
  ...(props.mode === 'levels' || props.mode === 'levelsOrOperand'
    ? [{ value: 'levels', label: t('blackboardMapping.levels') }]
    : []),
  ...(props.mode === 'operand' || props.mode === 'levelsOrOperand'
    ? [{ value: 'constant', label: t('blackboardMapping.constant') }]
    : []),
  ...(branch.value === 'valueNode'
    ? [{ value: 'valueNode', label: t('blackboardMapping.connection'), disabled: true }]
    : []),
  ...(branch.value === 'invalid'
    ? [
        {
          value: 'invalid',
          label: t(
            props.value === undefined
              ? 'blackboardMapping.chooseValue'
              : 'blackboardMapping.invalidValue',
          ),
          disabled: true,
        },
      ]
    : []),
]);
function change(value: unknown) {
  if (!props.readonly) emit('change', value);
}
function switchBranch(value: EaSelectValue | EaSelectValue[]) {
  if (props.readonly || value === branch.value) return;
  if (value === 'levels' && (props.mode === 'levels' || props.mode === 'levelsOrOperand'))
    change(0);
  if (props.mode !== 'operand' && props.mode !== 'levelsOrOperand') return;
  if (value === 'constant') change({ kind: 'constant', value: 0 });
}
function updateOperand(key: string, value: unknown) {
  if (props.readonly) return;
  const next = { ...operand.value };
  if (value === undefined) delete next[key];
  else next[key] = value;
  change(next);
}
function numeric(raw: string): number | string {
  return raw.trim() !== '' && Number.isFinite(Number(raw)) ? Number(raw) : raw;
}
</script>

<template>
  <div class="mapping-value" :data-mapping-value="mode">
    <template v-if="mode === 'string'">
      <small>{{ t('blackboardMapping.stringLiteral') }}</small>
      <EaInput
        :disabled="readonly"
        :aria-label="label"
        :model-value="typeof value === 'string' ? value : ''"
        @input="change($event)"
      />
      <small v-if="typeof value !== 'string'" role="status"
        >{{ t('blackboardMapping.invalidValue') }}: {{ String(value) }}</small
      >
    </template>
    <template v-else-if="mode === 'copy'">
      <small>{{ t('blackboardMapping.copySource') }}</small>
      <BlackboardKeyField
        :context="context"
        :value="typeof value === 'string' ? value : undefined"
        :label="label"
        mode="read"
        value-type="any"
        :editable="!readonly"
        @change="change($event)"
        @draft-change="change($event)"
      />
    </template>
    <template v-else>
      <EaSelect
        :disabled="readonly"
        :model-value="branch"
        :options="options"
        :aria-label="`${label} ${t('blackboardMapping.valueMode')}`"
        @change="switchBranch"
      />
      <NodeLevelValues
        :readonly="readonly"
        v-if="branch === 'levels'"
        :text="JSON.stringify(value)"
        :required="true"
        :label="label"
        @change="change(JSON.parse($event))"
      />
      <EaInput
        :disabled="readonly"
        v-else-if="branch === 'constant'"
        :model-value="String(operand.value ?? '')"
        type="number"
        step="any"
        :aria-label="label"
        @input="updateOperand('value', numeric($event))"
      />
      <small v-else-if="branch === 'valueNode'" role="status"
        >{{ t('blackboardMapping.keepConnection') }}: {{ operand.nodeId }}</small
      >
      <small v-else role="status"
        >{{ t('blackboardMapping.invalidValue') }}: {{ JSON.stringify(value) }}</small
      >
    </template>
  </div>
</template>

<style scoped>
.mapping-value {
  display: grid;
  gap: 5px;
  min-width: 0;
}
.mapping-value small {
  color: var(--ea-fg-muted);
  overflow-wrap: anywhere;
}
</style>
