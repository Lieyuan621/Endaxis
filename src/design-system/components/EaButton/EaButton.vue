<script setup lang="ts">
import type { EaButtonVariant, EaControlSize } from '../types';

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset';
    variant?: EaButtonVariant;
    size?: EaControlSize;
    loading?: boolean;
    disabled?: boolean;
    iconOnly?: boolean;
    pressed?: boolean;
  }>(),
  {
    type: 'button',
    variant: 'secondary',
    size: 'md',
    loading: false,
    disabled: false,
    iconOnly: false,
    pressed: undefined,
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

function handleClick(event: MouseEvent) {
  if (props.disabled || props.loading) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  emit('click', event);
}
</script>

<template>
  <button
    :type="type"
    class="ea-button"
    :class="[
      `ea-button--${variant}`,
      `ea-button--${size}`,
      { 'ea-button--loading': loading, 'ea-button--icon-only': iconOnly },
    ]"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-pressed="pressed"
    @click="handleClick"
  >
    <span v-if="loading" class="ea-button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>
