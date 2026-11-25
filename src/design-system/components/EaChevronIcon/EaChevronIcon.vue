<script setup lang="ts">
withDefaults(
  defineProps<{
    direction?: 'right' | 'left' | 'down' | 'up';
    size?: number | string;
    strokeWidth?: number | string;
  }>(),
  {
    direction: 'right',
    size: 16,
    strokeWidth: 2,
  },
);
</script>

<template>
  <svg
    class="ea-chevron-icon"
    :class="`ea-chevron-icon--${direction}`"
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
    <path d="m9 5 7 7-7 7" />
  </svg>
</template>

<style scoped>
.ea-chevron-icon {
  display: block;
  flex: none;
}
.ea-chevron-icon--left {
  transform: rotate(180deg);
}
.ea-chevron-icon--down {
  transform: rotate(90deg);
}
.ea-chevron-icon--up {
  transform: rotate(-90deg);
}
</style>
