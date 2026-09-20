<script setup lang="ts">
/** 旧版 ResourceMonitor 三段共用的时间背景层。 */
import { computed } from 'vue';
import { frameToTimelinePx } from '../timelineGeometry';

const props = defineProps<{
  width: number;
  durationFrames: number;
  prepFrames: number;
  prepEndFrame?: number;

  prepExpanded: boolean;
  pxPerFrame: number;
  trackHeaderWidth: number;
  scrollLeft: number;
}>();

const GRID_LINE_FRAME_STEP = 150;

function pointX(frame: number): number {
  return (
    props.trackHeaderWidth +
    frameToTimelinePx(
      frame,
      props.prepFrames,
      props.pxPerFrame,
      props.prepExpanded,
      props.prepEndFrame,
    ) -
    props.scrollLeft
  );
}

const gridLines = computed(() => {
  const lines: number[] = [];
  for (let frame = 0; frame <= Math.max(0, props.durationFrames); frame += GRID_LINE_FRAME_STEP) {
    lines.push(pointX(frame));
  }
  return lines;
});

const prepStartX = computed(() => pointX(-props.prepFrames));
const zeroX = computed(() => pointX(0));
</script>

<template>
  <svg
    class="monitor-grid"
    :width="width"
    height="100%"
    :viewBox="`0 0 ${Math.max(1, width)} 100`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <rect
      v-if="prepExpanded && prepFrames > 0"
      :x="prepStartX"
      y="0"
      :width="Math.max(0, zeroX - prepStartX)"
      height="100"
      class="monitor-grid__prep"
    />
    <line
      v-for="line in gridLines"
      :key="line"
      :x1="line"
      y1="0"
      :x2="line"
      y2="100"
      class="monitor-grid__line"
    />
    <line
      v-if="prepExpanded && prepFrames > 0"
      :x1="zeroX"
      y1="0"
      :x2="zeroX"
      y2="100"
      class="monitor-grid__zero"
    />
  </svg>
</template>

<style scoped>
.monitor-grid {
  position: absolute;
  z-index: 0;
  inset: 0;
  display: block;
  overflow: hidden;
  pointer-events: none;
}

.monitor-grid__prep {
  fill: rgb(255 255 255 / 4%);
}

.monitor-grid__line {
  stroke: #333;
  stroke-width: 1;
  stroke-dasharray: 2;
  vector-effect: non-scaling-stroke;
}

.monitor-grid__zero {
  stroke: rgb(255 255 255 / 38%);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}
</style>
