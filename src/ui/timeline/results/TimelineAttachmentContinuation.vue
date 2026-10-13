<script setup lang="ts">
import { useId } from 'vue';
import TimelineConnectorStroke from '../components/TimelineConnectorStroke.vue';

defineProps<{
  width: number;
  height: number;
  color?: string;
  endColor?: string;
}>();

const gradientId = useId();
</script>

<template>
  <svg
    class="attachment-continuation"
    :width="width"
    :height="height"
    :style="{ color: color ?? 'var(--ea-fg-muted)' }"
    aria-hidden="true"
  >
    <defs>
      <linearGradient
        :id="gradientId"
        gradientUnits="userSpaceOnUse"
        x1="0"
        :y1="height / 2"
        :x2="width"
        :y2="height / 2"
      >
        <stop offset="0%" stop-color="currentColor" stop-opacity="0.8" />
        <stop offset="100%" :stop-color="endColor ?? color ?? 'currentColor'" stop-opacity="1" />
      </linearGradient>
    </defs>
    <TimelineConnectorStroke
      :path="`M 0 ${height / 2} H ${width}`"
      :stroke="`url(#${gradientId})`"
      :start-color="color"
      :end-color="endColor"
      particle
    />
  </svg>
</template>

<style scoped>
.attachment-continuation {
  position: relative;
  z-index: 1;
  overflow: visible;
  pointer-events: none;
  flex-shrink: 0;
}
</style>
