<script setup lang="ts">
defineProps<{
  kind: 'text' | 'number' | 'enum' | 'boolean';
  value: unknown;
  label: string;
  disabled?: boolean;
  optional?: boolean;
  defaultLabel: string;
  options?: readonly { value: string; label: string }[];
}>();
const emit = defineEmits<{ update: [value: unknown]; omit: [] }>();
function numberChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.value.trim() && input.validity.valid && Number.isFinite(input.valueAsNumber))
    emit('update', input.valueAsNumber);
}
function selectChange(kind: string, event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (kind === 'boolean' && value === '') emit('omit');
  else emit('update', kind === 'boolean' ? value === 'true' : value);
}
</script>
<template>
  <select
    v-if="kind === 'enum' || kind === 'boolean'"
    :aria-label="label"
    :disabled="disabled"
    :value="kind === 'boolean' ? (value === undefined ? '' : String(value)) : value"
    @change="selectChange(kind, $event)"
  >
    <option v-if="kind === 'boolean' && optional" value="">{{ defaultLabel }}</option>
    <option v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
  <input
    v-else-if="kind === 'number'"
    type="number"
    step="any"
    :aria-label="label"
    :disabled="disabled"
    :value="value"
    @change="numberChange"
  />
  <input
    v-else
    type="text"
    :aria-label="label"
    :disabled="disabled"
    :value="value"
    @input="emit('update', ($event.target as HTMLInputElement).value)"
  />
</template>
<style scoped>
input,
select {
  width: 100%;
  min-width: 0;
  height: 32px;
  box-sizing: border-box;
  padding: 0 8px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
</style>
