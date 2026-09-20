<script setup lang="ts">
/**
 * 时间轴下方资源曲线的展示组件（对齐旧版 ResourceMonitor 的坐标与画法）。
 *
 * 只画"全队 SP、敌人生命、失衡"三类曲线；各干员终结技能量画在各自轨道上，不在这里。
 * 横轴坐标和时间轴共用同一换算（准备区偏移 + 每帧像素），并跟随时间轴横向滚动，
 * 保证曲线和上方标尺、技能块位置一一对齐。每帧自动回复不单独标点。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import CustomNumberInput from '../../components/CustomNumberInput.vue';
import { poiseProgressPoints, poiseDisplayPoints, spDisplayPoints } from './resourceCurveDisplay';
import type { SharedSpCurve } from '../../../core/projection/resourceCurves';
import type { EnemyHealthCurve } from '../../../core/projection/enemyHealthCurves';
import type { PoiseCurve } from '../../../core/projection/poiseCurves';
import type { PoiseBrokenSegment, PoiseKnotSegment } from '../../../core/projection/poiseCurves';
import { frameToTimelinePx } from '../timelineGeometry';
import TimelineMonitorGrid from './TimelineMonitorGrid.vue';

const props = defineProps<{
  spCurve: SharedSpCurve;
  timelineWidth: number;
  durationFrames: number;
  cursorFrame: number;
  prepFrames: number;
  pxPerFrame: number;
  /** 时间轴内容区左侧轨道头宽度；曲线从这里开始画，和标尺对齐。 */
  trackHeaderWidth: number;
  /** 时间轴当前的横向滚动距离；曲线按它平移，跟着时间轴一起滚。 */
  scrollLeft: number;
  enemyHealthCurve?: EnemyHealthCurve | null;
  poiseCurve?: PoiseCurve | null;
  poiseBrokenSegments?: readonly PoiseBrokenSegment[];
  poiseKnotSegments?: readonly PoiseKnotSegment[];
  poiseKnotThresholds?: readonly number[];
  enemyHealthLabel?: string;
  poiseLabel?: string;
  spLabel?: string;
  visibleKinds?: readonly ResourceCurveRow['kind'][];
  prepEndFrame?: number;

  prepExpanded: boolean;
  initialSp?: number;
  configurationReadOnly?: boolean;
  spRecoveryPerSecond?: number;
  initialSpLabel?: string;
  spRecoveryLabel?: string;
  poiseBrokenLabel?: string;
  spInsufficientLabel?: string;
}>();

const emit = defineEmits<{
  updateResourceRule: [field: 'initialSp' | 'spRecoveryPerSecond', value: number];
}>();

const ROW_HEIGHT = 56;
const SECTION_TOPBAR_HEIGHT = 14;
const CHART_TOP = 0;
const CHART_BOTTOM = 0;
const POINT_RADIUS = 2;
const root = ref<HTMLElement | null>(null);
const poiseBodyHeight = ref(ROW_HEIGHT);
const spBodyHeight = ref(ROW_HEIGHT);
let sizeObserver: ResizeObserver | undefined;
onMounted(() => {
  if (root.value === null) return;
  const update = () => {
    const chart = root.value?.querySelector('.curve-row--poise .curve-chart');
    if (chart) poiseBodyHeight.value = Math.max(1, chart.getBoundingClientRect().height);
    const spChart = root.value?.querySelector('.curve-row--sp .curve-chart');
    if (spChart) spBodyHeight.value = Math.max(1, spChart.getBoundingClientRect().height);
  };
  sizeObserver = new ResizeObserver(update);
  sizeObserver.observe(root.value);
  update();
});
onBeforeUnmount(() => sizeObserver?.disconnect());
/** 旧版 ResourceMonitor 为技力 0 以下固定保留 40 点显示区。 */
const SP_NEGATIVE_BUFFER = 40;

interface ResourceCurveRow {
  readonly key: string;
  readonly label: string;
  readonly kind: 'sp' | 'enemyHealth' | 'poise';
  readonly maxValue: number;
  readonly points: readonly ResourceCurvePointView[];
}

interface ResourceCurvePointView {
  readonly frame: number;
  readonly value: number;
  readonly source?: 'autoRecovery';
}

const width = computed(() => Math.max(1, props.trackHeaderWidth + props.timelineWidth));
const duration = computed(() => Math.max(0, props.durationFrames));
const rows = computed<readonly ResourceCurveRow[]>(() => [
  {
    key: 'sp',
    label: props.spLabel ?? 'SP',
    kind: 'sp',
    maxValue: props.spCurve.maxValue,
    points: props.spCurve.points,
  },
  ...(props.enemyHealthCurve === null || props.enemyHealthCurve === undefined
    ? []
    : [
        {
          key: 'enemyHealth',
          label: props.enemyHealthLabel ?? 'HP',
          kind: 'enemyHealth' as const,
          maxValue: props.enemyHealthCurve.maxValue,
          points: props.enemyHealthCurve.points,
        },
      ]),
  ...(props.poiseCurve === null || props.poiseCurve === undefined
    ? []
    : [
        {
          key: 'poise',
          label: props.poiseLabel ?? 'POISE',
          kind: 'poise' as const,
          maxValue: props.poiseCurve.maxValue,
          points: poiseProgressPoints(props.poiseCurve),
        },
      ]),
]);
// 父模板可能每次渲染都传新数组；语义相同的可见性不能让几何缓存失效。
const visibleKindsKey = computed(() => props.visibleKinds?.join('|') ?? '*');
const visibleRows = computed(() =>
  rows.value.filter(
    row =>
      row.points.length > 0 &&
      (visibleKindsKey.value === '*' || visibleKindsKey.value.split('|').includes(row.kind)),
  ),
);
const hasCurves = computed(() => visibleRows.value.length > 0);

/** 与时间轴同坐标系的横坐标：轨道头 + 帧位置，再减去当前滚动距离。 */
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

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function pointY(row: ResourceCurveRow, value: number): number {
  const chartHeight = rowHeight(row) - CHART_TOP - CHART_BOTTOM;
  const upperBound = row.maxValue > 0 ? row.maxValue : 1;
  const minimum = row.kind === 'sp' ? -SP_NEGATIVE_BUFFER : 0;
  const rawRatio = (value - minimum) / (upperBound - minimum);
  // 技力可低于显示下界；由 SVG 裁切，不把不同负值伪造成同一条水平线。
  const ratio = row.kind === 'sp' ? rawRatio : clamp(rawRatio, 0, 1);
  return CHART_TOP + (1 - ratio) * chartHeight;
}

function baselineY(row: ResourceCurveRow): number {
  return pointY(row, 0);
}

/** 资源 SVG 使用真实像素高度，避免拖高面板时拉伸条纹、文字和命中圆点。 */
function rowHeight(row: ResourceCurveRow): number {
  if (row.kind === 'poise') return poiseBodyHeight.value;
  return row.kind === 'sp' ? spBodyHeight.value : ROW_HEIGHT;
}

/** 曲线绘图补瞬时跳变、保持段与显示终点；不改变原始事实点、标记和读数。 */
function displayPoints(row: ResourceCurveRow): readonly ResourceCurvePointView[] {
  if (row.kind === 'sp') return spDisplayPoints(row.points, -props.prepFrames, duration.value);
  return row.kind === 'poise' ? poiseDisplayPoints(row.points, duration.value) : row.points;
}

/** 旧版资源监控器直接连接相邻事实点；同帧的连续事实自然形成竖直线。 */
function linePath(row: ResourceCurveRow): string {
  const [first, ...rest] = displayPoints(row);
  if (first === undefined) return '';
  let path = `M ${pointX(first.frame)} ${pointY(row, first.value)}`;
  for (const point of rest) {
    path += ` L ${pointX(point.frame)} ${pointY(row, point.value)}`;
  }
  return path;
}

function fillPath(row: ResourceCurveRow): string {
  const points = displayPoints(row);
  const last = points.at(-1);
  if (last === undefined) return '';
  const coordinates = points.map(point => `${pointX(point.frame)} ${pointY(row, point.value)}`);
  const startX = row.kind === 'sp' ? pointX(points[0]!.frame) : 0;
  return `M ${startX} ${baselineY(row)} L ${coordinates.join(' L ')} L ${pointX(last.frame)} ${baselineY(row)} Z`;
}

// 光标读数更新不改变曲线几何；仅数据、坐标或面板高度变化时重建 SVG 路径。
const curvePaths = computed(
  () =>
    new Map(
      visibleRows.value.map(row => [
        row.key,
        {
          line: linePath(row),
          fill: fillPath(row),
        },
      ]),
    ),
);

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round(value * 100) / 100;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

function valueAtCursor(row: ResourceCurveRow): number {
  let value = row.points[0]?.value ?? 0;
  for (const point of row.points) {
    if (point.frame > props.cursorFrame) break;
    value = point.value;
  }
  return value;
}

function pointTitle(point: ResourceCurvePointView): string {
  return `${formatNumber(point.frame)}f / ${formatNumber(point.frame / 30)}s · ${formatNumber(point.value)}`;
}

/** 上游失衡读数与进度条采用取整后的末值；绘图和回执仍保留原精度。 */
function readoutValue(row: ResourceCurveRow): number {
  const value = valueAtCursor(row);
  return row.kind === 'poise' ? Math.round(value) : value;
}
const spWarnings = computed(() => {
  const points = props.spCurve.points;
  return points.flatMap((point, index) => {
    const previous = points[index - 1];
    if (point.source === 'autoRecovery' || point.value >= 0 || previous === undefined) return [];
    if (point.value >= previous.value) return [];
    const height = spBodyHeight.value;
    const curveY = clamp(pointY(rows.value[0]!, previous.value), 0, height);
    const gap = clamp(Math.round(height * 0.08), 4, 10);
    const topPadding = clamp(Math.round(height * 0.07), 4, 10);
    const bottomPadding = clamp(Math.round(height * 0.09), 6, 12);
    const top = clamp(
      curveY - 18 - gap,
      topPadding,
      Math.max(topPadding, height - 18 - bottomPadding),
    );
    return [{ frame: point.frame, top }];
  });
});
</script>

<template>
  <div
    ref="root"
    class="resource-curves"
    :class="{ 'resource-curves--empty': !hasCurves }"
    :style="{ width: `${width}px` }"
  >
    <div v-if="!hasCurves" class="empty-state">—</div>
    <div
      v-for="row in visibleRows"
      v-else
      :key="row.key"
      class="curve-row"
      :class="`curve-row--${row.kind}`"
    >
      <div
        v-if="row.kind === 'poise'"
        class="poise-maximum-line"
        :style="{ left: `${trackHeaderWidth}px` }"
        aria-hidden="true"
      ></div>
      <TimelineMonitorGrid
        :width="width"
        :duration-frames="durationFrames"
        :prep-frames="prepFrames"
        :prep-end-frame="prepEndFrame"
        :prep-expanded="prepExpanded"
        :px-per-frame="pxPerFrame"
        :track-header-width="trackHeaderWidth"
        :scroll-left="scrollLeft"
      />
      <span class="curve-label" :style="{ width: `${trackHeaderWidth}px` }">
        <template
          v-if="row.kind === 'sp' && initialSp !== undefined && spRecoveryPerSecond !== undefined"
        >
          <strong>{{ row.label }}</strong>
          <label class="resource-control-row">
            <span>{{ initialSpLabel }}</span>
            <span v-if="configurationReadOnly">{{ initialSp }}</span>
            <CustomNumberInput
              v-else
              :model-value="initialSp"
              :min="0"
              :max="row.maxValue"
              active-color="var(--ea-gold)"
              class="standard-input"
              @update:model-value="emit('updateResourceRule', 'initialSp', Number($event))"
            />
          </label>
          <label class="resource-control-row">
            <span>{{ spRecoveryLabel }}</span>
            <span v-if="configurationReadOnly">{{ spRecoveryPerSecond }}</span>
            <CustomNumberInput
              v-else
              :model-value="spRecoveryPerSecond"
              :min="0"
              :step="0.5"
              active-color="var(--ea-gold)"
              class="standard-input"
              @update:model-value="
                emit('updateResourceRule', 'spRecoveryPerSecond', Number($event))
              "
            />
          </label>
        </template>
        <template v-else>
          <strong>{{ row.label }}</strong>
          <small
            ><span>{{ formatNumber(readoutValue(row)) }}</span
            ><span class="label-value-max">/{{ formatNumber(row.maxValue) }}</span></small
          >
          <span v-if="row.kind === 'poise'" class="label-readout-bar">
            <i
              class="label-readout-fill"
              :style="{
                width: `${Math.max(0, Math.min(1, readoutValue(row) / Math.max(1, row.maxValue))) * 100}%`,
              }"
            ></i>
            <i
              v-for="threshold in poiseKnotThresholds ?? []"
              :key="threshold"
              class="label-readout-knot"
              :style="{ left: `${threshold * 100}%` }"
            ></i>
          </span>
        </template>
      </span>
      <svg
        v-memo="[
          curvePaths.get(row.key),
          width,
          rowHeight(row),
          row.points,
          poiseBrokenSegments,
          poiseKnotSegments,
          poiseBrokenLabel,
          prepExpanded,
          prepEndFrame,
          scrollLeft,
        ]"
        class="curve-chart"
        :style="{
          clipPath: prepExpanded
            ? undefined
            : `inset(0 0 0 ${Math.max(trackHeaderWidth, pointX(prepEndFrame ?? 0))}px)`,
        }"
        :width="width"
        height="100%"
        :viewBox="`0 0 ${width} ${rowHeight(row)}`"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient :id="`curve-fill-${row.kind}`" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stop-color="currentColor"
              :stop-opacity="row.kind === 'poise' ? 0.5 : 0.3"
            />
            <stop
              offset="100%"
              stop-color="currentColor"
              :stop-opacity="row.kind === 'poise' ? 0.1 : 0.05"
            />
          </linearGradient>
          <pattern
            v-if="row.kind === 'poise'"
            id="poise-broken-pattern"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="10" height="10" fill="#ff9c6e" fill-opacity="0.1" />
            <rect width="2" height="10" fill="#ffd591" fill-opacity="0.6" />
          </pattern>
          <pattern
            v-if="row.kind === 'poise'"
            id="poise-knot-pattern"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="8" height="8" fill="#fa8c16" fill-opacity="0.05" />
            <rect width="2" height="8" fill="#fa8c16" fill-opacity="0.5" />
          </pattern>
        </defs>
        <template v-if="row.kind === 'sp'">
          <line
            v-for="value in [300, 200, 100]"
            :key="value"
            class="guide-line"
            x1="0"
            :y1="pointY(row, value)"
            :x2="width"
            :y2="pointY(row, value)"
          />
          <text
            :x="trackHeaderWidth + 5 - scrollLeft"
            :y="pointY(row, 300) + 12"
            class="guide-label"
          >
            MAX({{ formatNumber(row.maxValue) }})
          </text>
          <text
            :x="trackHeaderWidth + 5 - scrollLeft"
            :y="baselineY(row) - 4"
            class="guide-label guide-label--zero"
          >
            0
          </text>
        </template>
        <g v-if="row.kind === 'poise'">
          <rect
            v-for="segment in poiseKnotSegments ?? []"
            :key="`knot:${segment.startFrame}:${segment.endFrame}`"
            :x="pointX(segment.startFrame)"
            y="0"
            :width="Math.max(0, pointX(segment.endFrame) - pointX(segment.startFrame))"
            :height="rowHeight(row)"
            fill="url(#poise-knot-pattern)"
            class="poise-knot-zone"
          />
          <g
            v-for="segment in poiseBrokenSegments ?? []"
            :key="`${segment.startFrame}:${segment.endFrame}`"
          >
            <rect
              :x="pointX(segment.startFrame)"
              y="0"
              :width="Math.max(0, pointX(segment.endFrame) - pointX(segment.startFrame))"
              :height="rowHeight(row)"
              fill="url(#poise-broken-pattern)"
              class="poise-broken-zone"
            />
            <text
              :x="(pointX(segment.startFrame) + pointX(segment.endFrame)) / 2"
              :y="rowHeight(row) / 2 + 4"
              class="poise-broken-label"
              text-anchor="middle"
            >
              {{ poiseBrokenLabel }}
            </text>
          </g>
        </g>
        <rect
          v-if="row.kind === 'sp'"
          class="sp-negative-zone"
          x="0"
          :y="baselineY(row)"
          :width="width"
          :height="Math.max(0, rowHeight(row) - CHART_BOTTOM - baselineY(row))"
        />
        <path
          class="curve-fill"
          :style="{ fill: `url(#curve-fill-${row.kind})` }"
          :d="curvePaths.get(row.key)?.fill ?? ''"
        />
        <path class="curve-line" :d="curvePaths.get(row.key)?.line ?? ''" />
        <circle
          v-for="(point, index) in row.points.filter(point => point.source !== 'autoRecovery')"
          :key="`${point.frame}:${index}`"
          class="curve-point"
          :cx="pointX(point.frame)"
          :cy="pointY(row, point.value)"
          :r="POINT_RADIUS"
          :class="{ 'is-negative': row.kind === 'sp' && point.value < 0 }"
        >
          <title>{{ pointTitle(point) }}</title>
        </circle>
      </svg>
      <span
        v-for="(warning, index) in row.kind === 'sp' ? spWarnings : []"
        :key="`sp-warning-${warning.frame}:${index}`"
        class="sp-warning-tag"
        :style="{
          left: `${pointX(warning.frame)}px`,
          top: `${SECTION_TOPBAR_HEIGHT + warning.top}px`,
        }"
      >
        <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true">
          <path d="M12 3 2 21h20L12 3Zm0 5v7m0 3v.1" />
        </svg>
        {{ spInsufficientLabel }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.resource-curves {
  min-width: 1px;
  height: 100%;
  color: var(--ea-text-secondary, rgb(215 218 222 / 82%));
  background: var(--ea-workbench-main, #18181c);
  font-family: var(--ea-font-family, 'Segoe UI', sans-serif);
  letter-spacing: 0;
}

.resource-curves--empty {
  min-height: 56px;
  display: grid;
  place-items: center;
}

.empty-state {
  color: var(--ea-text-muted, rgb(255 255 255 / 32%));
  font-size: 11px;
}

.curve-row {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-bottom: 1px solid var(--ea-border, rgb(255 255 255 / 10%));
  color: #e6c928;
  background: var(--ea-workbench-main, #18181c);
}

.curve-row--enemyHealth {
  color: #e0492f;
}

.curve-row--sp {
  color: var(--ea-gold);
}

.curve-row--poise {
  color: #ff7875;
}

.poise-maximum-line {
  position: absolute;
  right: 0;
  top: 14px;
  height: 1px;
  background: rgba(255, 156, 110, 0.32);
  z-index: 2;
  pointer-events: none;
}

.curve-label {
  position: absolute;
  inset: 0 auto 0 0;
  z-index: 2;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 6px;
  padding: 8px 10px;
  border-right: 1px solid var(--ea-divider, rgb(255 255 255 / 16%));
  background: var(--ea-workbench-panel, #252526);
  pointer-events: none;
}

.curve-label strong {
  color: currentColor;
  font:
    700 10px/13px Consolas,
    monospace;
}

.curve-row--poise .curve-label {
  color: #ff9c6e;
  border-left: 3px solid #ff9c6e;
}

.curve-row--poise .curve-label strong,
.curve-row--sp .curve-label strong {
  font:
    700 11px/1 Inter,
    -apple-system,
    sans-serif;
}

.curve-row--poise .curve-label small {
  line-height: 1.1;
}

.curve-row--sp .curve-label {
  border-left: 3px solid var(--ea-gold);
  font-family:
    Inter,
    -apple-system,
    sans-serif;
}

.curve-label small {
  color: currentColor;
  font:
    700 12px/14px 'Roboto Mono',
    monospace;
}

.label-value-max {
  color: var(--ea-fg-faint, rgb(255 255 255 / 45%));
  font-weight: 600;
}

.label-readout-bar {
  position: relative;
  display: block;
  width: 100%;
  height: 5px;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--ea-fill-soft, rgb(255 255 255 / 8%));
}

.label-readout-fill {
  display: block;
  height: 100%;
  background: #d46b08;
  transition: width 0.16s ease;
}

.label-readout-knot {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid #f5c89a;
  background: #4c362b;
  transform: translateX(-50%);
}

.resource-control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--ea-fg-faint, rgb(255 255 255 / 48%));
  font-size: 11px;
  white-space: nowrap;
  pointer-events: auto;
}

:deep(.standard-input) {
  width: 65px !important;
  height: 22px !important;
  font-size: 11px !important;
}

.curve-chart {
  position: absolute;
  z-index: 1;
  top: 14px;
  right: 0;
  bottom: 0;
  left: 0;
  height: calc(100% - 14px);
  display: block;
  overflow: hidden;
}

.guide-line {
  stroke: #444;
  stroke-width: 1;
  stroke-dasharray: 2;
  vector-effect: non-scaling-stroke;
}

.guide-label {
  fill: #888;
  font-size: 9px;
}

.guide-label--zero {
  fill: #666;
}

.curve-fill {
  fill: currentColor;
}

.curve-line {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.curve-point {
  fill: currentColor;
  stroke: var(--ea-workbench-main, #18181c);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  pointer-events: all;
}

.curve-point.is-negative {
  fill: #ff4d4f;
}

.curve-row--poise .curve-point,
.curve-row--sp .curve-point {
  stroke: none;
}

.sp-negative-zone {
  fill: #ff4d4f;
  fill-opacity: 0.09;
}

.poise-broken-zone {
  animation: poise-broken-flash 2s infinite alternate;
}

.poise-knot-zone {
  animation: poise-knot-pulse 1.5s infinite alternate;
}

@keyframes poise-knot-pulse {
  0% {
    opacity: 0.4;
  }
  100% {
    opacity: 0.8;
  }
}

.poise-broken-label {
  fill: #fff;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1px;
  text-shadow: 0 0 2px #ff7a45;
}

.sp-warning-tag {
  position: absolute;
  /* 与曲线同层，滚入左侧时由固定读数栏遮挡，不覆盖输入控件。 */
  z-index: 1;
  min-width: 58px;
  height: 18px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 2px 6px;
  border: 1px solid rgb(255 77 79 / 30%);
  border-radius: 4px;
  background: rgb(0 0 0 / 80%);
  box-shadow: 0 2px 8px rgb(0 0 0 / 50%);
  color: #ff4d4f;
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
}

.sp-warning-tag svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@keyframes poise-broken-flash {
  from {
    fill-opacity: 0.1;
  }

  to {
    fill-opacity: 0.3;
  }
}
</style>
