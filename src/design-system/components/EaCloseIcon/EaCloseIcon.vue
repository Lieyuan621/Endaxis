<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string;
    strokeWidth?: number | string;
  }>(),
  {
    size: 14,
    strokeWidth: 2.2,
  },
);
</script>

<template>
  <svg
    class="ea-close-icon"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
</template>

<style scoped>
.ea-close-icon {
  display: block;
  flex: none;
}
</style>
