<script setup lang="ts">
/** 悬停或选中来源技能时，在整个时间轴纵向显示其时间膨胀持续区间。 */
import { computed } from 'vue';
import { PROJECT_FPS } from '../../../core/project/schema';
import type { TimelineTimeDilationBand } from '../../../core/projection/timelineDisplayTime';
import { frameToTimelinePx } from '../timelineGeometry';

const props = defineProps<{
  bands: readonly TimelineTimeDilationBand[];
  sourceCastIds: ReadonlySet<string>;
  prepFrames: number;
  pxPerFrame: number;
  horizontalOffset: number;
  prepEndFrame?: number;

  prepExpanded: boolean;
}>();

const visibleBands = computed(() =>
  props.bands
    .filter(band => band.sourceCastId !== undefined && props.sourceCastIds.has(band.sourceCastId))
    .map(band => ({
      ...band,
      left:
        props.horizontalOffset +
        frameToTimelinePx(
          band.startFrame,
          props.prepFrames,
          props.pxPerFrame,
          props.prepExpanded,
          props.prepEndFrame,
        ),
      width: Math.max(
        1,
        frameToTimelinePx(
          band.endFrame,
          props.prepFrames,
          props.pxPerFrame,
          props.prepExpanded,
          props.prepEndFrame,
        ) -
          frameToTimelinePx(
            band.startFrame,
            props.prepFrames,
            props.pxPerFrame,
            props.prepExpanded,
            props.prepEndFrame,
          ),
      ),
      duration: formatDuration(band.endFrame - band.startFrame),
    })),
);

function formatDuration(frames: number): string {
  const seconds = frames / PROJECT_FPS;
  return `${Number(seconds.toFixed(2))}s`;
}
</script>

<template>
  <div class="time-dilation-bands" aria-hidden="true">
    <span
      v-for="band in visibleBands"
      :key="`${band.kind}:${band.instanceId}`"
      class="time-dilation-band"
      :style="{ left: `${band.left}px`, width: `${band.width}px` }"
    >
      <span class="time-dilation-duration">{{ band.duration }}</span>
    </span>
  </div>
</template>

<style scoped>
.time-dilation-bands {
  position: absolute;
  z-index: 5;
  inset: 60px 0 0;
  overflow: hidden;
  pointer-events: none;
}

.time-dilation-band {
  position: absolute;
  top: 0;
  bottom: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  border-inline: 1px dashed rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
  animation: time-dilation-fade-in 0.2s ease-out;
}

.time-dilation-duration {
  color: rgba(255, 255, 255, 0.4);
  font:
    700 10px/1 'Roboto Mono',
    monospace;
  white-space: nowrap;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  user-select: none;
}

@keyframes time-dilation-fade-in {
  from {
    opacity: 0;
  }
}
</style>
