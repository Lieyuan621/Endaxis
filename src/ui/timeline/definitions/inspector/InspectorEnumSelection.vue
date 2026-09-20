<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  value: readonly string[];
  options: readonly string[];
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabelKey?: string;
  optionLabelPrefix?: string;
}>();
const emit = defineEmits<{ update: [value: readonly string[]] }>();
const { t, te } = useI18n({ useScope: 'global' });
function toggle(option: string) {
  if (props.disabled || !props.options.includes(option)) return;
  const next = props.value.includes(option)
    ? props.value.filter(value => value !== option)
    : [...props.value, option];
  if (next.length || props.allowEmpty) emit('update', next);
}
</script>
<template>
  <div class="enum-selection">
    <button
      v-if="allowEmpty && emptyLabelKey"
      type="button"
      :disabled="disabled"
      :aria-pressed="value.length === 0"
      @click="emit('update', [])"
    >
      {{ t(emptyLabelKey) }}
    </button>
    <button
      v-for="option in options"
      :key="option"
      type="button"
      :disabled="disabled || (!allowEmpty && value.length === 1 && value[0] === option)"
      :aria-pressed="value.includes(option)"
      @click="toggle(option)"
    >
      {{ te(`${optionLabelPrefix}${option}`) ? t(`${optionLabelPrefix}${option}`) : option }}
    </button>
  </div>
</template>
<style scoped>
.enum-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}
button {
  padding: 5px 7px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-soft);
  color: var(--ea-fg-secondary);
  cursor: pointer;
}
button[aria-pressed='true'] {
  border-color: var(--ea-gold);
  color: var(--ea-gold);
  background: color-mix(in srgb, var(--ea-gold) 12%, var(--ea-fill-soft));
}
button:disabled {
  cursor: default;
}
</style>
