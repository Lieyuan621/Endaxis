<script setup lang="ts">
/** 复刻旧版轨道底边的连携窗口线；几何只读取运行时生命周期投影。 */
import { computed } from 'vue';
import { PROJECT_FPS } from '../../../core/project/schema';
import type { ComboWindowTimelineSegment } from '../../../core/projection/comboWindowTimelineViz';
import { frameToTimelinePx } from '../timelineGeometry';

const props = defineProps<{
  segments: readonly ComboWindowTimelineSegment[];
  prepFrames: number;
  pxPerFrame: number;
  actionTop: number;
  label: string;
  perfectLabel?: string;
  prepEndFrame?: number;

  prepExpanded: boolean;
}>();

/** 旧版连携窗口固定使用连携技主题金色，不跟随干员属性色。 */
const COMBO_WINDOW_COLOR = '#fdd900';
const ACTION_HEIGHT = 50;

function formatDuration(frames: number): string {
  if (frames < PROJECT_FPS) return `${frames}f`;
  const seconds = frames / PROJECT_FPS;
  return `${Number(seconds.toFixed(2))}s`;
}

const items = computed(() =>
  props.segments.map(segment => {
    const durationFrames = Math.max(0, segment.endFrame - segment.startFrame);
    return {
      ...segment,
      left: frameToTimelinePx(
        segment.startFrame,
        props.prepFrames,
        props.pxPerFrame,
        props.prepExpanded,
        props.prepEndFrame,
      ),
      width:
        frameToTimelinePx(
          segment.endFrame,
          props.prepFrames,
          props.pxPerFrame,
          props.prepExpanded,
          props.prepEndFrame,
        ) -
        frameToTimelinePx(
          segment.startFrame,
          props.prepFrames,
          props.pxPerFrame,
          props.prepExpanded,
          props.prepEndFrame,
        ),
      duration: formatDuration(durationFrames),
    };
  }),
);
</script>

<template>
  <div
    v-if="items.length > 0"
    class="combo-window-bar-layer"
    :style="{ top: `${actionTop + ACTION_HEIGHT}px` }"
  >
    <div
      v-for="item in items"
      :key="`${item.operatorId}:${item.sequence}:${item.startFrame}`"
      class="combo-window-bar"
      :class="[`is-${item.outcome}`, { 'perfect-timing-bar': item.perfectTiming }]"
      :title="item.perfectTiming ? (perfectLabel ?? label) : label"
      :style="{
        left: `${item.left}px`,
        width: `${item.width}px`,
        '--cw-color': COMBO_WINDOW_COLOR,
      }"
    >
      <div class="cw-start-mark"></div>
      <div class="cw-line"></div>
      <div class="cw-end-mark"></div>
      <span class="cw-duration-text">{{ item.duration }}</span>
    </div>
  </div>
</template>

<style scoped>
.combo-window-bar-layer {
  position: absolute;
  right: 0;
  left: 0;
  height: 0;
  pointer-events: none;
  z-index: 10;
}

.combo-window-bar {
  position: absolute;
  bottom: 0;
  height: 2px;
  display: flex;
  align-items: center;
  transform: translateY(7px);
  pointer-events: auto;
}

.cw-start-mark,
.cw-end-mark {
  position: absolute;
  top: 50%;
  width: 1px;
  height: 8px;
  transform: translateY(-50%);
  background-color: var(--cw-color);
}

.cw-start-mark {
  left: 0;
}

.cw-end-mark {
  right: 0;
}

.cw-line {
  flex-grow: 1;
  height: 0;
  border-bottom: 2px dashed var(--cw-color);
}

.cw-duration-text {
  position: absolute;
  left: 0;
  top: 4px;
  color: var(--cw-color);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 1px 2px rgb(0 0 0 / 80%);
  white-space: nowrap;
}

.perfect-timing-bar .cw-line {
  height: 2px;
  border-bottom: none;
  background: var(--cw-color);
}
</style>
