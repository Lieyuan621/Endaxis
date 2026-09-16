<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string;
    strokeWidth?: number | string;
  }>(),
  {
    size: 14,
    strokeWidth: 2,
  },
);
</script>

<template>
  <svg
    class="ea-plus-icon"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
</template>

<style scoped>
.ea-plus-icon {
  display: block;
  flex: none;
}
</style>
