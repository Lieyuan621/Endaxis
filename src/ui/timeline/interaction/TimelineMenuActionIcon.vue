<script setup lang="ts">
defineProps<{ action: 'copy' | 'cut' | 'paste' | 'delete' }>();
</script>

<template>
  <span class="menu-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24">
      <template v-if="action === 'copy'">
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3" />
      </template>
      <template v-else-if="action === 'cut'">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="m8 8 12 12M8 16 20 4" />
      </template>
      <template v-else-if="action === 'paste'">
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M8 4H5v17h14V4h-3" />
      </template>
      <path
        v-else
        d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      />
    </svg>
  </span>
</template>

<style scoped>
.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex: 0 0 20px;
}
svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
