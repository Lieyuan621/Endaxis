<script setup lang="ts">
import { computed, inject } from 'vue';
import { isEmptyGraphSequence } from './graphSequenceContainerSchema';
import { useI18n } from 'vue-i18n';
import { EaButton } from '@/design-system';
import { blackboardNavigationKey } from './blackboardFieldContext';
const props = defineProps<{ value: unknown; label: string; sequence: boolean }>();
const emit = defineEmits<{ open: [] }>();
const { t } = useI18n();
const navigate = inject(blackboardNavigationKey, undefined);
const target = computed(() => {
  const value = props.value;
  if (!value || typeof value !== 'object') return;
  if (props.sequence && '$sequence' in value && typeof value.$sequence === 'string')
    return value.$sequence;
  if (
    !props.sequence &&
    'kind' in value &&
    value.kind === 'conditionNode' &&
    'nodeId' in value &&
    typeof value.nodeId === 'string'
  )
    return value.nodeId;
});
const summary = computed(() =>
  props.value === undefined
    ? t('graphSequenceField.absentCondition')
    : props.sequence
      ? t(
          target.value
            ? 'graphSequenceField.connected'
            : isEmptyGraphSequence(props.value)
              ? 'graphSequenceField.empty'
              : 'graphSequenceField.invalid',
        )
      : props.value && typeof props.value === 'object' && 'kind' in props.value
        ? String(props.value.kind)
        : t('graphSequenceField.invalid'),
);
</script>
<template>
  <div data-graph-row-boundary :data-graph-boundary-kind="sequence ? 'sequence' : 'condition'">
    <span>{{ label }} · {{ summary }}</span>
    <EaButton
      v-if="target"
      size="sm"
      @click="
        navigate ? navigate({ owner: sequence ? 'action' : 'data', id: target }) : emit('open')
      "
      >{{ target }} ↗</EaButton
    >
    <small>{{
      t(sequence ? 'graphSequenceField.help' : 'graphSequenceField.conditionHelp')
    }}</small>
  </div>
</template>
