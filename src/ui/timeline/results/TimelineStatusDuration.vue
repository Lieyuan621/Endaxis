<script setup lang="ts">
withDefaults(defineProps<{ as?: 'span' | 'button' }>(), { as: 'span' });
</script>
<template>
  <component :is="as" class="anomaly-duration-bar generic-buff-bar"
    ><span class="striped-bg" /><slot
  /></component>
</template>
<style scoped>
.anomaly-duration-bar {
  position: relative;
  z-index: 1;
  height: 16px;
  margin-left: 2px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  overflow: visible;
  border: none;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 50%);
  pointer-events: auto;
  transition:
    filter 0.12s ease,
    box-shadow 0.12s ease;
}
.generic-buff-bar {
  background: color-mix(in srgb, var(--ea-fg) 30%, var(--ea-workbench-main));
}
@media (hover: hover) and (pointer: fine) {
  .anomaly-duration-bar:hover {
    filter: brightness(1.16) saturate(1.08);
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 18%),
      0 2px 8px rgb(0 0 0 / 50%);
  }
}
.striped-bg {
  position: absolute;
  inset: 0;
  border-radius: 2px;
  background: repeating-linear-gradient(
    45deg,
    rgb(255 255 255 / 20%),
    rgb(255 255 255 / 20%) 2px,
    transparent 2px,
    transparent 6px
  );
}
.anomaly-duration-bar {
  padding: 0;
}
.striped-bg {
  pointer-events: none;
}
</style>
