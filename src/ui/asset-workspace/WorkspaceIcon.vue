<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 16 });

const paths: Record<string, string> = {
  back: 'M14 5 7 12l7 7M7 12h14',
  forward: 'm10 5 7 7-7 7M3 12h14',
  folder: 'M3 6h7l2 3h9v11H3ZM3 6V4h7l2 2',
  search: 'M16 16 21 21M18 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  close: 'm6 6 12 12M6 18 18 6',
  chevron: 'm9 5 7 7-7 7',
  down: 'm5 9 7 7 7-7',
  lock: 'M6 11h12v10H6ZM8 11V7a4 4 0 0 1 8 0v4',
  unlock: 'M6 11h12v10H6ZM8 11V7a4 4 0 0 1 7.5-2',
  undo: 'M9 4 4 9l5 5M4 9h10a6 6 0 0 1 0 12',
  redo: 'm15 4 5 5-5 5M20 9H10a6 6 0 0 0 0 12',
  check: 'm5 12 4 4L19 6',
  copy: 'M9 9h12v12H9ZM15 9V3H3v12h6',
  graph: 'M3 4h6v6H3ZM15 14h6v6h-6ZM9 7h9v7M3 17h6v4H3ZM6 10v7',
  link: 'm9 15 6-6M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  timeline: 'M4 5v14M4 8h14M4 16h17M9 5v6m5 2v6',
  shield: 'M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7Z',
  box: 'm12 2 10 5v10l-10 5L2 17V7Zm0 10L2 7m10 5 10-5m-10 5v10',
  pin: 'm8 3 9 3-3 4v5l-4 1-4-4 3-3ZM9 15l-5 6',
  layout: 'M3 4h18v16H3ZM8 4v16m9-16v16',
  fit: 'M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6',
  minus: 'M5 12h14',
  plus: 'M5 12h14M12 5v14',
  info: 'M12 11v6m0-11v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  list: 'M8 5h13M8 12h13M8 19h13M3 5h1m-1 7h1m-1 7h1',
};
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.box" />
  </svg>
</template>
