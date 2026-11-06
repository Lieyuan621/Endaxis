<script setup lang="ts">
defineProps<{ kind: 'spawn' | 'enter' | 'exit' | 'target' }>();
</script>

<template>
  <svg
    class="enemy-lifecycle-menu-icon"
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="kind === 'spawn'">
      <path d="m12 3 8 9-8 9-8-9 8-9Z" />
    </template>
    <template v-else-if="kind === 'enter'">
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M4 12h9m-4-4 4 4-4 4" />
    </template>
    <template v-else-if="kind === 'exit'">
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M11 12h9m-4-4 4 4-4 4" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
    </template>
  </svg>
</template>
