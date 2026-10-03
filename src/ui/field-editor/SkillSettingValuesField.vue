<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaNumberInput } from '@/design-system';

const props = defineProps<{ value: unknown; editable: boolean; label: string }>();
const emit = defineEmits<{ change: [value: unknown] }>();
const { t } = useI18n();
const columns = computed(() =>
  Array.isArray(props.value) && props.value.length === 4 ? props.value : undefined,
);
const empty = () => [undefined, undefined, undefined, undefined];
function replace() {
  if (props.editable) emit('change', empty());
}
function change(index: number, value: number | undefined) {
  if (!props.editable) return;
  const next = [...(columns.value ?? empty())];
  next[index] = value;
  emit('change', next);
}
</script>

<template>
  <div data-skill-setting-values>
    <small>{{ t('skillSettingValues.hint') }}</small>
    <small
      v-if="columns?.some(value => typeof value !== 'number' || !Number.isFinite(value))"
      role="alert"
      >{{ t('skillSettingValues.invalid') }}:
      {{
        columns
          .map(value => (typeof value === 'string' ? JSON.stringify(value) : String(value)))
          .join(', ')
      }}</small
    >
    <template v-if="columns || value === undefined">
      <EaNumberInput
        v-for="index in 4"
        :key="index"
        :aria-label="`${label} ${index}`"
        :disabled="!editable"
        :model-value="typeof columns?.[index - 1] === 'number' ? columns[index - 1] : undefined"
        @change="change(index - 1, $event)"
      />
    </template>
    <template v-else>
      <small role="alert">{{ t('skillSettingValues.invalid') }}: {{ JSON.stringify(value) }}</small>
      <EaButton v-if="editable" @click="replace">{{ t('blackboardMapping.replace') }}</EaButton>
    </template>
  </div>
</template>
