<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EnemyHealthCurve } from '../../../core/projection/enemyHealthCurves';
import TimelinePointerTooltip from './TimelinePointerTooltip.vue';

const HEIGHT = 16;
const PADDING = 2;
const props = defineProps<{
  name: string;
  curve: EnemyHealthCurve;
  startFrame: number;
  endFrame: number;
  top: number;
  framePx: (frame: number) => number;
  pxFrame: (px: number) => number;
  scrollLeft: number;
}>();
const { t } = useI18n();
const hoverFrame = ref<number>();
const width = computed(() =>
  Math.max(1, props.framePx(props.endFrame) - props.framePx(props.startFrame)),
);
function valueAt(frame: number): number {
  let value = props.curve.points[0]?.value ?? props.curve.maxValue;
  for (const point of props.curve.points) {
    if (point.frame > frame) break;
    value = point.value;
  }
  return value;
}
function y(value: number): number {
  const ratio = Math.min(1, Math.max(0, value / Math.max(1, props.curve.maxValue)));
  return PADDING + (1 - ratio) * (HEIGHT - PADDING * 2);
}
const linePath = computed(() => {
  let path = `M 0 ${y(valueAt(props.startFrame))}`;
  for (const point of props.curve.points) {
    if (point.frame <= props.startFrame || point.frame > props.endFrame) continue;
    const x = props.framePx(point.frame) - props.framePx(props.startFrame);
    path += ` H ${x} V ${y(point.value)}`;
  }
  return `${path} H ${width.value}`;
});
const tooltip = computed(() => {
  const frame = Math.min(
    props.endFrame,
    Math.max(props.startFrame, hoverFrame.value ?? props.endFrame),
  );
  return `${props.name} · ${t('resourceMonitor.labels.enemyHp')} ${Math.round(valueAt(frame)).toLocaleString()} / ${Math.round(props.curve.maxValue).toLocaleString()} · ${(frame / 30).toFixed(2)}s`;
});
function updateHover(event: PointerEvent): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const frame = props.pxFrame(props.framePx(props.startFrame) + event.clientX - rect.left);
  hoverFrame.value = Math.min(props.endFrame, Math.max(props.startFrame, Math.round(frame)));
}
</script>

<template>
  <TimelinePointerTooltip :text="tooltip" v-slot="{ events }">
    <div
      class="enemy-health-mini"
      :style="{
        left: framePx(startFrame) - scrollLeft + 'px',
        top: top + 'px',
        width: width + 'px',
        height: HEIGHT + 'px',
      }"
      role="img"
      tabindex="0"
      :aria-label="tooltip"
      v-on="events"
      @pointermove="updateHover"
    >
      <svg :width="width" :height="HEIGHT" :viewBox="`0 0 ${width} ${HEIGHT}`" aria-hidden="true">
        <path class="enemy-health-mini__zero" :d="`M 0 ${HEIGHT - PADDING} H ${width}`" />
        <path class="enemy-health-mini__line" :d="linePath" />
      </svg>
    </div>
  </TimelinePointerTooltip>
</template>

<style scoped>
.enemy-health-mini {
  position: absolute;
  z-index: 2;
  cursor: crosshair;
}
.enemy-health-mini:focus-visible {
  outline: 1px solid var(--ea-gold);
  outline-offset: -1px;
}
.enemy-health-mini svg {
  display: block;
  overflow: hidden;
}
.enemy-health-mini__zero {
  fill: none;
  stroke: rgb(255 255 255 / 12%);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.enemy-health-mini__line {
  fill: none;
  stroke: #e67d67;
  stroke-width: 1.5;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
</style>
