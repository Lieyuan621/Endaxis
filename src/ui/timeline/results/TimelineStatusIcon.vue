<script setup lang="ts">
import TimelineStatusBadge from './TimelineStatusBadge.vue';
withDefaults(
  defineProps<{
    as?: 'span' | 'button';
    size?: number;
    src?: string;
    fallback?: string;
    width?: number;
    height?: number;
    count?: number | string | null;
  }>(),
  { as: 'span', size: 20 },
);
</script>
<template>
  <component
    :is="as"
    class="anomaly-icon-box"
    :style="{
      '--aff-icon-size': size + 'px',
      width: (width ?? size) + 'px',
      height: (height ?? size) + 'px',
    }"
  >
    <slot
      ><img v-if="src" :src="src" class="status-image" alt="" /><span
        v-else-if="fallback"
        class="status-fallback"
        >{{ fallback }}</span
      ></slot
    >
    <TimelineStatusBadge v-if="count !== undefined && count !== null">{{
      count
    }}</TimelineStatusBadge>
  </component>
</template>
<style scoped>
.anomaly-icon-box {
  position: relative;
  z-index: 10;
  width: var(--aff-icon-size, 20px);
  height: var(--aff-icon-size, 20px);
  flex-shrink: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--ea-keycap-skill-bg, #333);
  border: 1px solid var(--ea-keycap-skill-border, #999);
  cursor: default;
  transition:
    filter 0.12s ease,
    border-color 0.12s ease,
    box-shadow 0.12s ease;
}
.anomaly-icon-box.is-clickable {
  cursor: pointer;
}
.anomaly-icon-box:focus-visible {
  outline: none;
  box-shadow: var(--ea-focus-ring);
}
@media (hover: hover) and (pointer: fine) {
  .anomaly-icon-box:hover {
    filter: brightness(1.18);
    border-color: rgb(255 255 255 / 95%);
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 22%),
      0 4px 12px rgb(0 0 0 / 46%);
  }
  .anomaly-icon-box:hover :deep(img) {
    filter: brightness(1.12) saturate(1.08);
  }
}
.anomaly-icon-box {
  padding: 0;
  font: inherit;
}
.status-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.12s ease;
}
.status-fallback {
  color: #eef6ff;
  font-size: 10px;
  font-weight: 700;
}
</style>
