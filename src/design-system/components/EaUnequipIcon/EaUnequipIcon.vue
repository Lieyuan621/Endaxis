<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string;
  }>(),
  {
    size: 16,
  },
);
</script>

<template>
  <svg
    class="ea-unequip-icon"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M4 5h9v14H4z" />
    <path d="M8 12h12" />
    <path d="m16 8 4 4-4 4" />
  </svg>
</template>

<style scoped>
.ea-unequip-icon {
  display: block;
  flex: none;
}
</style>
