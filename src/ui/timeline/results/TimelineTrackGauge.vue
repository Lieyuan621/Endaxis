<script setup lang="ts">
/**
 * 干员轨道上的终结技能量曲线（对齐旧版 GaugeOverlay 的最终视觉）。
 * 曲线只在 50px 技能带内绘制：普通低透明折线 + 满能量双层高亮线，不画面积填充。
 */
import { computed } from 'vue';
import type { OperatorUltimateEnergyCurve } from '../../../core/projection/resourceCurves';
import { frameToTimelinePx, timelineTotalWidth } from '../timelineGeometry';

const props = defineProps<{
  curve: OperatorUltimateEnergyCurve | null;
  color: string;
  prepFrames: number;
  durationFrames: number;
  pxPerFrame: number;
  prepEndFrame?: number;

  prepExpanded: boolean;
}>();

/** 旧版 GaugeOverlay 的 50px 曲线带。根容器外框 54px 并垂直居中，SVG 自身保持 50px。 */
const CHART_HEIGHT = 50;
const BASE_Y = 50;

const gaugePoints = computed(() => {
  const curve = props.curve;
  if (curve === null || curve.maxValue <= 0) return [];
  const points = curve.points.map(point => ({
    frame: point.frame,
    ratio: Math.min(point.value / curve.maxValue, 1),
  }));
  const first = points[0];
  // 首个输入可晚于准备区起点；此前没有资源事件，显示初始值即可，不改曲线事实或模拟起点。
  return first !== undefined && first.frame > -props.prepFrames
    ? [{ frame: -props.prepFrames, ratio: first.ratio }, ...points.slice(1)]
    : points;
});

const pathData = computed(() => {
  const points = gaugePoints.value;
  if (points.length === 0) return '';
  const xForFrame = (frame: number) =>
    frameToTimelinePx(
      frame,
      props.prepFrames,
      props.pxPerFrame,
      props.prepExpanded,
      props.prepEndFrame,
    );
  const yForRatio = (ratio: number) => BASE_Y - ratio * CHART_HEIGHT;
  const first = points[0]!;
  const endX = xForFrame(props.durationFrames);
  // 稀疏状态点按阶梯展示：每个后续点先水平到变化帧，再垂直跳到新状态；最后延伸到显示时长终点。
  let d = `M ${xForFrame(first.frame)} ${yForRatio(first.ratio)}`;
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]!;
    d += ` H ${xForFrame(point.frame)} V ${yForRatio(point.ratio)}`;
  }
  d += ` H ${endX}`;
  return d;
});

const fullSegments = computed(() => {
  const segments: { x1: number; x2: number }[] = [];
  const points = gaugePoints.value;
  const endX = frameToTimelinePx(
    props.durationFrames,
    props.prepFrames,
    props.pxPerFrame,
    props.prepExpanded,
    props.prepEndFrame,
  );
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]!;
    if (point.ratio < 1) continue;
    const x1 = frameToTimelinePx(
      point.frame,
      props.prepFrames,
      props.pxPerFrame,
      props.prepExpanded,
      props.prepEndFrame,
    );
    const nextPoint = points[index + 1];
    const x2 =
      nextPoint === undefined
        ? endX
        : frameToTimelinePx(
            nextPoint.frame,
            props.prepFrames,
            props.pxPerFrame,
            props.prepExpanded,
            props.prepEndFrame,
          );
    // 稀疏点代表“从该帧持续到下一变化帧或显示终点”；失去满能时在下一变化帧结束。
    if (x2 > x1) segments.push({ x1, x2 });
  }
  return segments;
});

/** 曲线身份为空时仍给 SVG filter 一个稳定 id；有曲线时按 operatorId 保持唯一。 */
const glowFilterId = computed(() => `glow-${props.curve?.operatorId ?? 'none'}`);
</script>

<template>
  <div class="track-gauge">
    <svg
      class="track-gauge-svg"
      :height="CHART_HEIGHT"
      :width="
        timelineTotalWidth(prepFrames, durationFrames, pxPerFrame, prepExpanded, prepEndFrame)
      "
    >
      <defs v-if="curve !== null">
        <filter :id="glowFilterId" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        v-if="pathData"
        :d="pathData"
        fill="none"
        :stroke="color"
        stroke-width="1"
        stroke-opacity="0.4"
        stroke-linejoin="round"
        stroke-linecap="round"
        class="no-events"
      />

      <line
        v-for="(seg, index) in fullSegments"
        :key="`full-${index}`"
        :x1="seg.x1"
        :y1="1"
        :x2="seg.x2"
        :y2="1"
        :stroke="color"
        class="full-gauge-line no-events"
      />

      <line
        v-for="(seg, index) in fullSegments"
        :key="`glow-${index}`"
        :x1="seg.x1"
        :y1="1"
        :x2="seg.x2"
        :y2="1"
        :stroke="color"
        class="full-gauge-glow no-events"
        :filter="`url(#${glowFilterId})`"
      />
    </svg>
  </div>
</template>

<style scoped>
.track-gauge {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 54px;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 1;
  overflow: visible;
}

.track-gauge-svg {
  display: block;
  overflow: visible;
}

.no-events {
  pointer-events: none !important;
}

.full-gauge-line {
  stroke-width: 2;
  stroke-linecap: round;
  transform: translateY(1px);
  will-change: opacity;
  animation: stroke-opacity 2s ease-in-out infinite alternate;
}

.full-gauge-glow {
  stroke-width: 2;
  filter: drop-shadow(0 0 6px currentColor);
  transform: translateY(1px);
  will-change: opacity, transform;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  0% {
    opacity: 0;
    transform: scaleY(1);
  }
  100% {
    opacity: 1;
    transform: scaleY(1.2);
  }
}

@keyframes stroke-opacity {
  0% {
    opacity: 0.85;
  }
  100% {
    opacity: 1;
  }
}
</style>
