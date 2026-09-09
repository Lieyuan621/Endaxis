<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import type { EaControlSize } from '../types';

const props = withDefaults(
  defineProps<{
    selected?: boolean;
    disabled?: boolean;
    size?: EaControlSize;
    accent?: string;
  }>(),
  {
    selected: false,
    disabled: false,
    size: 'sm',
    accent: 'var(--ea-accent)',
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const accentStyle = computed<CSSProperties>(() => ({ '--ea-filter-accent': props.accent }));
</script>

<template>
  <button
    type="button"
    class="ea-filter-chip"
    :class="[`ea-filter-chip--${size}`, { 'ea-filter-chip--selected': selected }]"
    :style="accentStyle"
    :disabled="disabled"
    :aria-pressed="selected"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>
