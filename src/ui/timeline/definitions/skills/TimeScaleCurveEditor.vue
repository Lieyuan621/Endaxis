<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TimeScaleCurveKeyDefinition } from '../../../../core/game-data/operatorDefinition';
import { evaluateTimeScaleCurve } from '../../../../core/combat/time/timeScaleCurve';
import { useInteractionSession } from '../../../interaction/interactionSessionContext';
import { useTimeScaleCurveDrag } from './useTimeScaleCurveDrag';

const WIDTH = 520;
const HEIGHT = 220;
const PADDING = { left: 42, right: 16, top: 14, bottom: 30 } as const;
const TIME_EPSILON = 0.000001;

const props = withDefaults(
  defineProps<{
    keys: readonly TimeScaleCurveKeyDefinition[];
    readonly?: boolean;
  }>(),
  { readonly: false },
);
const emit = defineEmits<{ update: [keys: readonly TimeScaleCurveKeyDefinition[]] }>();
const { t } = useI18n({ useScope: 'global' });

const svg = ref<SVGSVGElement>();
const drag = useTimeScaleCurveDrag({
  session: useInteractionSession(),
  keys: () => props.keys,
  readonly: () => props.readonly,
  commit: keys => emit('update', keys),
});
const draggedIndex = drag.index;
const displayKeys = computed(() => drag.preview.value ?? props.keys);

const domain = computed(() => {
  const times = props.keys.map(key => key.time);
  const values = props.keys.map(key => key.value);
  const sampleValues = props.keys.length
    ? Array.from({ length: 121 }, (_, index) => evaluateTimeScaleCurve(props.keys, index / 120))
    : [];
  const minTime = Math.min(0, ...times);
  const maxTime = Math.max(1, ...times);
  const minValue = Math.min(0, ...values, ...sampleValues);
  const maxValue = Math.max(1, ...values, ...sampleValues);
  const valuePadding = Math.max((maxValue - minValue) * 0.08, 0.05);
  return {
    minTime,
    maxTime: maxTime === minTime ? minTime + 1 : maxTime,
    minValue: minValue - valuePadding,
    maxValue: maxValue + valuePadding,
  };
});

const plotWidth = WIDTH - PADDING.left - PADDING.right;
const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
const displayDomain = domain;

function xFor(time: number): number {
  return (
    PADDING.left +
    ((time - displayDomain.value.minTime) /
      (displayDomain.value.maxTime - displayDomain.value.minTime)) *
      plotWidth
  );
}

function yFor(value: number): number {
  return (
    PADDING.top +
    ((displayDomain.value.maxValue - value) /
      (displayDomain.value.maxValue - displayDomain.value.minValue)) *
      plotHeight
  );
}

const curvePath = computed(() => {
  if (displayKeys.value.length === 0) return '';
  const start = displayDomain.value.minTime;
  const end = displayDomain.value.maxTime;
  return Array.from({ length: 161 }, (_, index) => {
    const time = start + ((end - start) * index) / 160;
    const value = evaluateTimeScaleCurve(displayKeys.value, time);
    return `${index === 0 ? 'M' : 'L'} ${xFor(time).toFixed(2)} ${yFor(value).toFixed(2)}`;
  }).join(' ');
});

function pointerValue(event: PointerEvent): { time: number; value: number } | undefined {
  const element = svg.value;
  if (element === undefined) return undefined;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return undefined;
  const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
  const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
  const time =
    displayDomain.value.minTime +
    ((x - PADDING.left) / plotWidth) * (displayDomain.value.maxTime - displayDomain.value.minTime);
  const value =
    displayDomain.value.maxValue -
    ((y - PADDING.top) / plotHeight) *
      (displayDomain.value.maxValue - displayDomain.value.minValue);
  return { time, value };
}

function startDrag(index: number, event: PointerEvent): void {
  if (svg.value) drag.start(index, event, svg.value);
}

function moveDrag(event: PointerEvent): void {
  const point = pointerValue(event);
  if (point) drag.move(event.pointerId, point);
}

function endDrag(event: PointerEvent): void {
  drag.finish(event.pointerId);
}

function addKey(event: MouseEvent): void {
  if (props.readonly || props.keys.length === 0) return;
  const point = pointerValue(event as PointerEvent);
  if (point === undefined) return;
  const first = props.keys[0]!;
  const last = props.keys.at(-1)!;
  if (point.time <= first.time + TIME_EPSILON || point.time >= last.time - TIME_EPSILON) return;
  const key: TimeScaleCurveKeyDefinition = {
    time: point.time,
    value: evaluateTimeScaleCurve(props.keys, point.time),
    inTangent: 0,
    outTangent: 0,
    weightedMode: 0,
    inWeight: 1 / 3,
    outWeight: 1 / 3,
  };
  emit(
    'update',
    [...props.keys, key].sort((left, right) => left.time - right.time),
  );
}
</script>

<template>
  <div class="curve-graph" :class="{ 'curve-graph--readonly': readonly }">
    <svg
      ref="svg"
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      role="img"
      :aria-label="t('timeline.skillEditing.timeDilationCurve')"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="drag.cancelPointer($event.pointerId)"
      @lostpointercapture="drag.cancelPointer($event.pointerId)"
      @dblclick="addKey"
    >
      <rect
        class="curve-graph__plot"
        :x="PADDING.left"
        :y="PADDING.top"
        :width="plotWidth"
        :height="plotHeight"
      />
      <line
        v-for="tick in [0, 0.25, 0.5, 0.75, 1]"
        :key="`x-${tick}`"
        class="curve-graph__grid"
        :x1="xFor(tick)"
        :x2="xFor(tick)"
        :y1="PADDING.top"
        :y2="HEIGHT - PADDING.bottom"
      />
      <line
        v-for="tick in [0, 0.25, 0.5, 0.75, 1]"
        :key="`y-${tick}`"
        class="curve-graph__grid"
        :x1="PADDING.left"
        :x2="WIDTH - PADDING.right"
        :y1="yFor(tick)"
        :y2="yFor(tick)"
      />
      <path class="curve-graph__line" :d="curvePath" />
      <g v-for="(key, index) in displayKeys" :key="index">
        <circle
          class="curve-graph__key"
          :class="{ 'curve-graph__key--dragging': draggedIndex === index }"
          :cx="xFor(key.time)"
          :cy="yFor(key.value)"
          r="5"
          @pointerdown.prevent="startDrag(index, $event)"
        />
        <title>{{ `t=${key.time}, scale=${key.value}` }}</title>
      </g>
      <text class="curve-graph__axis" :x="PADDING.left" :y="HEIGHT - 8">0</text>
      <text class="curve-graph__axis" :x="WIDTH - PADDING.right" :y="HEIGHT - 8" text-anchor="end">
        1
      </text>
      <text class="curve-graph__axis" x="8" :y="yFor(1) + 4">1</text>
      <text class="curve-graph__axis" x="8" :y="yFor(0) + 4">0</text>
    </svg>
    <span v-if="!readonly" class="curve-graph__hint">
      {{ t('timeline.skillEditing.timeScaleCurveEditingHint') }}
    </span>
  </div>
</template>

<style scoped>
.curve-graph {
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--ea-border-soft);
  background: color-mix(in srgb, var(--ea-fill-soft) 72%, transparent);
}

.curve-graph svg {
  display: block;
  width: 100%;
  min-height: 160px;
  touch-action: none;
  user-select: none;
}

.curve-graph__plot {
  fill: color-mix(in srgb, var(--ea-panel) 88%, transparent);
  stroke: var(--ea-border-soft);
}

.curve-graph__grid {
  stroke: color-mix(in srgb, var(--ea-border-soft) 58%, transparent);
  stroke-width: 1;
}

.curve-graph__line {
  fill: none;
  stroke: var(--ea-accent, #d6a45f);
  stroke-width: 2.5;
  vector-effect: non-scaling-stroke;
}

.curve-graph__key {
  fill: var(--ea-panel);
  stroke: var(--ea-accent, #d6a45f);
  stroke-width: 2;
  cursor: grab;
  vector-effect: non-scaling-stroke;
}

.curve-graph--readonly .curve-graph__key {
  cursor: default;
}

.curve-graph__key--dragging {
  cursor: grabbing;
  fill: var(--ea-accent, #d6a45f);
}

.curve-graph__axis {
  fill: var(--ea-fg-muted);
  font-size: 11px;
}

.curve-graph__hint {
  display: block;
  margin: 4px 4px 0;
  color: var(--ea-fg-muted);
  font-size: 12px;
}
</style>
