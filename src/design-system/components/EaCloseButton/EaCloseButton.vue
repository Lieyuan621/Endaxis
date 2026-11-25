<script setup lang="ts">
import EaButton from '../EaButton/EaButton.vue';
import EaCloseIcon from '../EaCloseIcon/EaCloseIcon.vue';
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
    <EaCloseIcon size="100%" />
  </EaButton>
</template>
