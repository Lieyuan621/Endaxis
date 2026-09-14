<script setup lang="ts">
import EaButton from '../EaButton/EaButton.vue';
import type { EaControlSize } from '../types';

withDefaults(
  defineProps<{
    label: string;
    size?: EaControlSize;
  }>(),
  {
    size: 'md',
  },
);
</script>

<template>
  <EaButton
    type="button"
    variant="ghost"
    icon-only
    :size="size"
    class="ea-close-button"
    :class="`ea-close-button--${size}`"
    :title="label"
    :aria-label="label"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M18 6 6 18M6 6l12 12"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
      />
    </svg>
  </EaButton>
</template>
