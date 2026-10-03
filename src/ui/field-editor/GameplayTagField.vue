<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaInput, EaSelect, type EaSelectValue } from '@/design-system';
import { GAMEPLAY_TAG_PATHS, parseGameplayTagReference } from '@/data/combat/gameplayTagCatalog';
const props = defineProps<{
  value?: string;
  label: string;
  disabled?: boolean;
  allowUnset?: boolean;
}>();
const emit = defineEmits<{ change: [value: string] }>();
const { t } = useI18n();
const text = ref(typeof props.value === 'string' ? props.value : '');
watch(
  () => [props.value, props.disabled],
  () => {
    text.value = typeof props.value === 'string' ? props.value : '';
  },
);
const valid = computed(() => parseGameplayTagReference(text.value));
const matches = computed(() => {
  const query = text.value.toLocaleLowerCase();
  return props.disabled
    ? []
    : GAMEPLAY_TAG_PATHS.filter(path => path.toLocaleLowerCase().includes(query));
});
const options = computed(() =>
  [
    ...new Set([
      ...(typeof props.value === 'string' && props.value ? [props.value] : []),
      ...matches.value.slice(0, 50),
    ]),
  ].map(value => ({ value, label: value.split('/').join(' / ') })),
);
function unset() {
  if (!props.disabled && props.allowUnset) {
    text.value = '';
    emit('change', '');
  }
}
function select(value: EaSelectValue | EaSelectValue[]) {
  if (props.disabled || typeof value !== 'string' || !parseGameplayTagReference(value)) return;
  text.value = value;
  emit('change', value);
}
function apply() {
  if (!props.disabled && valid.value) emit('change', valid.value);
}
</script>
<template>
  <div data-gameplay-tag class="gameplay-tag">
    <EaSelect
      v-if="!disabled"
      :model-value="value ?? ''"
      :aria-label="label"
      :options="options"
      filterable
      :disabled="disabled"
      @change="select"
    />
    <EaButton v-if="allowUnset && !disabled && value" @click="unset">{{
      t('actionGraphEditor.unset')
    }}</EaButton>
    <small>{{ value ?? t('fieldReference.unset') }}</small>
    <template v-if="!disabled">
      <EaInput
        v-model="text"
        :aria-label="t('stringCollection.customTag')"
        :placeholder="t('stringCollection.customTag')"
      />
      <small v-if="matches.length > 50">{{
        t('stringCollection.refineSearch', { count: matches.length })
      }}</small>
      <EaButton :disabled="!valid" @click="apply">{{ t('stringCollection.useTag') }}</EaButton>
      <small v-if="text && !valid" role="alert">{{ t('stringCollection.invalidTag') }}</small>
    </template>
  </div>
</template>
<style scoped>
.gameplay-tag {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.gameplay-tag small {
  overflow-wrap: anywhere;
}
</style>
