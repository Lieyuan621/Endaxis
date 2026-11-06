<script setup lang="ts">
defineProps<{
  kind:
    | 'inherit'
    | 'comboReady'
    | 'comboCooldown'
    | 'cycleBoundary'
    | 'simulationStart'
    | 'simulationEnd'
    | 'switchOperator'
    | 'consumable'
    | 'dodge'
    | 'perfectDodge';
}>();
</script>

<template>
  <span class="menu-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none">
      <template v-if="kind === 'inherit'">
        <path d="M4 11a8 8 0 1 1 2.5 5.7M4 5v6h6" />
      </template>
      <template v-else-if="kind === 'comboReady'">
        <path d="M20 11a8 8 0 1 1-2.3-5.7M20 4v7h-7" />
      </template>
      <template v-else-if="kind === 'comboCooldown'">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </template>
      <template v-else-if="kind === 'cycleBoundary'">
        <path d="M5 3v18M17.5 8a5.5 5.5 0 1 0 .5 8M18 8v4h-4" />
      </template>
      <template v-else-if="kind === 'simulationStart'">
        <path d="M5 3v18M9 12h10m-4-4 4 4-4 4" />
      </template>
      <template v-else-if="kind === 'simulationEnd'">
        <path d="M19 3v18M5 12h10m-4-4 4 4-4 4" />
      </template>
      <template v-else-if="kind === 'switchOperator'">
        <path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4" />
      </template>
      <template v-else-if="kind === 'consumable'">
        <path d="M9 3h6M10 3v5l-3.5 5.5A4 4 0 0 0 10 20h4a4 4 0 0 0 3.5-6.5L14 8V3M8 14h8" />
      </template>
      <template v-else-if="kind === 'dodge' || kind === 'perfectDodge'">
        <path d="M4 17c3-7 8-10 16-8m-6-4 6 4-5 5" />
        <path v-if="kind === 'perfectDodge'" d="m5 3 .8 2.2L8 6l-2.2.8L5 9l-.8-2.2L2 6l2.2-.8Z" />
      </template>
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
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
