<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string;
    strokeWidth?: number | string;
  }>(),
  {
    size: 16,
    strokeWidth: 2,
  },
);
</script>

<template>
  <svg
    class="ea-copy-icon"
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
    <rect x="8" y="8" width="12" height="13" rx="2" />
    <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3" />
  </svg>
</template>

<style scoped>
.ea-copy-icon {
  display: block;
  flex: none;
}
</style>
