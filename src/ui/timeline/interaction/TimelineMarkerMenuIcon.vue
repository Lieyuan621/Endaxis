<script setup lang="ts">
import TimelineDodgeIcon from './TimelineDodgeIcon.vue';

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
    <TimelineDodgeIcon
      v-if="kind === 'dodge' || kind === 'perfectDodge'"
      class="dodge-icon"
      :kind="kind"
    />
    <svg v-else viewBox="0 0 24 24" fill="none">
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

.dodge-icon,
svg {
  width: 16px;
  height: 16px;
}

svg {
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
