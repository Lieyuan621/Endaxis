<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    disabled?: boolean;
    loading?: boolean;
  }>(),
  {
    modelValue: false,
    disabled: false,
    loading: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [value: boolean];
}>();

function toggle() {
  if (props.disabled || props.loading) return;
  const value = !props.modelValue;
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<template>
  <button
    type="button"
    class="ea-switch"
    :class="{ 'ea-switch--checked': modelValue, 'ea-switch--loading': loading }"
    role="switch"
    :aria-checked="modelValue"
    :aria-busy="loading || undefined"
    :disabled="disabled || loading"
    @click="toggle"
  >
    <span class="ea-switch__track" aria-hidden="true">
      <span class="ea-switch__thumb" />
    </span>
    <span v-if="$slots.default" class="ea-switch__label"><slot /></span>
  </button>
</template>
