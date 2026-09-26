<script setup lang="ts">
/** 调度项始终按源数组排列；拖动预览与正式时间提交分离。 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { EaButton } from '@/design-system';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { GraphEntry } from '../../application/editor/actionGraphEditing';
import { actionNodeTitle } from './nodePresentation';

const props = defineProps<{
  entries: readonly GraphEntry[];
  graph: ActionGraphDefinition;
  selectedEntryId: string | null;
  disabled?: boolean;
  selectEntry: (id: string) => boolean;
  applyTime: (id: string, startFrame: number, endFrame: number | null) => boolean;
}>();
const emit = defineEmits<{
  add: [frame: number];
  duplicate: [id: string];
  remove: [id: string];
  reorder: [fromId: string, toIndex: number];
  focusEntry: [id: string];
  close: [];
  gesture: [active: boolean];
  pending: [value: boolean];
}>();

const LABEL_WIDTH = 220;
const ROW_HEIGHT = 38;
const RULER_HEIGHT = 28;
const TRACK_INSET = 16;
const MIN_SCALE = 0.02;
const MAX_SCALE = 24;
const panel = ref<HTMLElement>();
const viewport = ref<HTMLDivElement>();
const viewportWidth = ref(900);
const horizontalScroll = ref(0);
const pixelsPerFrame = ref(4);
const autoFit = ref(true);
const error = ref('');
const startInput = ref('');
const endInput = ref('');
const formPending = ref(false);
let resizeObserver: ResizeObserver | undefined;
let deferredFit = false;

interface GestureBase {
  readonly id: string;
  readonly pointerId: number;
  readonly capture: HTMLElement;
}
interface TimeGesture extends GestureBase {
  readonly kind: 'move' | 'start' | 'end';
  readonly originX: number;
  readonly originScroll: number;
  readonly scale: number;
  readonly originalStart: number;
  readonly originalEnd: number | null;
  readonly start: number;
  readonly end: number | null;
}
interface OrderGesture extends GestureBase {
  readonly kind: 'order';
  readonly fromIndex: number;
  readonly toIndex: number;
}
const gesture = shallowRef<TimeGesture | OrderGesture | null>(null);
// 本面板只处理主图的 scheduledSequences，事件响应保持各自的编辑范围。
const rows = computed(() => props.entries.filter(entry => /^timeline:\d+$/.test(entry.id)));
const selected = computed(() => rows.value.find(entry => entry.id === props.selectedEntryId));
const selectedIndex = computed(() =>
  rows.value.findIndex(entry => entry.id === props.selectedEntryId),
);
const busy = computed(() => Boolean(props.disabled || gesture.value || formPending.value));
const durationExtent = computed(() => {
  let latest = 120;
  for (const entry of rows.value)
    latest = Math.max(latest, entry.startFrame ?? 0, entry.endFrame ?? 0);
  const active = gesture.value;
  if (active && active.kind !== 'order') latest = Math.max(latest, active.start, active.end ?? 0);
  return latest;
});
const trackWidth = computed(() =>
  Math.max(
    320,
    viewportWidth.value - LABEL_WIDTH,
    TRACK_INSET + durationExtent.value * pixelsPerFrame.value + 130,
  ),
);
const tickStep = computed(() => {
  const minimum = Math.max(1, 70 / pixelsPerFrame.value);
  const power = 10 ** Math.floor(Math.log10(minimum));
  return [1, 2, 5, 10].map(value => value * power).find(value => value >= minimum) ?? power * 10;
});
const ticks = computed(() => {
  const interval = tickStep.value * pixelsPerFrame.value;
  const first = Math.max(0, Math.floor((horizontalScroll.value - TRACK_INSET) / interval));
  const count = Math.ceil(Math.max(0, viewportWidth.value - LABEL_WIDTH) / interval) + 2;
  return Array.from({ length: count }, (_, index) => (first + index) * tickStep.value);
});
const contentStyle = computed(() => ({
  width: `${LABEL_WIDTH + trackWidth.value}px`,
  '--label-width': `${LABEL_WIDTH}px`,
  '--row-height': `${ROW_HEIGHT}px`,
  '--tick-width': `${tickStep.value * pixelsPerFrame.value}px`,
  '--track-inset': `${TRACK_INSET}px`,
}));

function title(entry: GraphEntry): string {
  if (entry.targetId === null) return '空入口';
  const node = props.graph.nodes[entry.targetId];
  return node ? actionNodeTitle(node.action.kind) : '入口节点不存在';
}
function frameX(frame: number): number {
  return TRACK_INSET + frame * pixelsPerFrame.value;
}
function timeOf(entry: GraphEntry): { start: number; end: number | null } {
  const active = gesture.value;
  return active && active.kind !== 'order' && active.id === entry.id
    ? { start: active.start, end: active.end }
    : { start: entry.startFrame ?? 0, end: entry.endFrame ?? null };
}
function timeLabel(entry: GraphEntry): string {
  const value = timeOf(entry);
  return value.end === null ? `${value.start} 帧 · 点` : `${value.start}–${value.end} 帧 · 区间`;
}
function markerStyle(entry: GraphEntry) {
  const time = timeOf(entry);
  return {
    left: `${frameX(time.start)}px`,
    width: time.end === null ? undefined : `${(time.end - time.start) * pixelsPerFrame.value}px`,
  };
}
function setPending(value: boolean): void {
  if (formPending.value === value) return;
  formPending.value = value;
  emit('pending', value);
}
function resetForm(): void {
  startInput.value = selected.value ? String(selected.value.startFrame ?? 0) : '';
  endInput.value = selected.value?.endFrame === undefined ? '' : String(selected.value.endFrame);
  setPending(false);
  error.value = '';
}
function changeFrame(which: 'start' | 'end', value: string): void {
  if (which === 'start') startInput.value = value;
  else endInput.value = value;
  setPending(
    startInput.value !== String(selected.value?.startFrame ?? 0) ||
      endInput.value !==
        (selected.value?.endFrame === undefined ? '' : String(selected.value.endFrame)),
  );
  error.value = '';
}
function submitTime(id: string, start: number, end: number | null): boolean {
  try {
    if (props.applyTime(id, start, end)) {
      error.value = '';
      return true;
    }
    error.value = '时间修改未通过校验，请检查帧范围和动作的持续时间要求。';
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause);
  }
  return false;
}
function applyForm(): void {
  if (!selected.value || props.disabled || gesture.value) return;
  const start = startInput.value.trim() === '' ? NaN : Number(startInput.value);
  const end = endInput.value.trim() === '' ? null : Number(endInput.value);
  if (
    !Number.isSafeInteger(start) ||
    start < 0 ||
    (end !== null && (!Number.isSafeInteger(end) || end < start))
  ) {
    error.value = '开始帧须为非负整数，结束帧须不早于开始帧；留空表示没有结束帧。';
    return;
  }
  if (submitTime(selected.value.id, start, end)) {
    startInput.value = String(start);
    endInput.value = end === null ? '' : String(end);
    setPending(false);
  }
}
function choose(entry: GraphEntry): boolean {
  if (props.disabled || gesture.value) return false;
  return props.selectEntry(entry.id);
}
function capture(event: PointerEvent): HTMLElement | null {
  const element = event.currentTarget;
  if (!(element instanceof HTMLElement)) return null;
  element.focus({ preventScroll: true });
  try {
    element.setPointerCapture(event.pointerId);
    return element;
  } catch {
    return null;
  }
}
function startTime(event: PointerEvent, entry: GraphEntry, kind: TimeGesture['kind']): void {
  if (event.button !== 0 || busy.value || !choose(entry)) return;
  const element = capture(event);
  if (!element) return;
  event.preventDefault();
  event.stopPropagation();
  error.value = '';
  const start = entry.startFrame ?? 0;
  const end = entry.endFrame ?? null;
  gesture.value = {
    kind,
    id: entry.id,
    pointerId: event.pointerId,
    capture: element,
    originX: event.clientX,
    originScroll: viewport.value?.scrollLeft ?? 0,
    scale: pixelsPerFrame.value,
    originalStart: start,
    originalEnd: end,
    start,
    end,
  };
  emit('gesture', true);
}
function startOrder(event: PointerEvent, entry: GraphEntry, index: number): void {
  if (event.button !== 0 || busy.value || !choose(entry)) return;
  const element = capture(event);
  if (!element) return;
  event.preventDefault();
  event.stopPropagation();
  error.value = '';
  gesture.value = {
    kind: 'order',
    id: entry.id,
    pointerId: event.pointerId,
    capture: element,
    fromIndex: index,
    toIndex: index,
  };
  emit('gesture', true);
}
function movePointer(event: PointerEvent): void {
  const active = gesture.value;
  const scroll = viewport.value;
  if (!active || active.pointerId !== event.pointerId || !scroll) return;
  event.preventDefault();
  const bounds = scroll.getBoundingClientRect();
  if (active.kind === 'order') {
    if (event.clientY < bounds.top + RULER_HEIGHT + 18) scroll.scrollTop -= 10;
    else if (event.clientY > bounds.bottom - 18) scroll.scrollTop += 10;
    const row = Math.floor(
      (event.clientY - bounds.top + scroll.scrollTop - RULER_HEIGHT) / ROW_HEIGHT,
    );
    gesture.value = { ...active, toIndex: Math.max(0, Math.min(rows.value.length - 1, row)) };
    return;
  }
  if (event.clientX > bounds.right - 24) scroll.scrollLeft += 14;
  else if (event.clientX < bounds.left + LABEL_WIDTH + 24) scroll.scrollLeft -= 14;
  const delta = Math.round(
    (event.clientX - active.originX + scroll.scrollLeft - active.originScroll) / active.scale,
  );
  let start = active.originalStart;
  let end = active.originalEnd;
  if (active.kind === 'move') {
    start = Math.max(0, active.originalStart + delta);
    if (end !== null) end = start + (end - active.originalStart);
  } else if (active.kind === 'start' && end !== null) {
    start = Math.max(0, Math.min(end, active.originalStart + delta));
  } else if (active.kind === 'end' && end !== null) {
    end = Math.max(start, end + delta);
  }
  gesture.value = { ...active, start, end };
}
function releaseGesture(): TimeGesture | OrderGesture | null {
  const active = gesture.value;
  if (!active) return null;
  gesture.value = null;
  if (active.capture.hasPointerCapture(active.pointerId))
    active.capture.releasePointerCapture(active.pointerId);
  emit('gesture', false);
  if (deferredFit && autoFit.value) void nextTick(applyFit);
  return active;
}
function cancelGesture(): void {
  releaseGesture();
}
function finishPointer(event: PointerEvent): void {
  if (gesture.value?.pointerId !== event.pointerId) return;
  movePointer(event);
  const active = releaseGesture();
  if (!active || props.disabled) return;
  if (active.kind === 'order') {
    if (active.toIndex !== active.fromIndex) emit('reorder', active.id, active.toIndex);
  } else if (active.start !== active.originalStart || active.end !== active.originalEnd) {
    submitTime(active.id, active.start, active.end);
  }
}
function escapeGesture(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !gesture.value) return;
  event.preventDefault();
  event.stopPropagation();
  cancelGesture();
}
function blurPanel(event: FocusEvent): void {
  if (
    gesture.value &&
    !(event.relatedTarget instanceof Node && panel.value?.contains(event.relatedTarget))
  )
    cancelGesture();
}
function visibilityChanged(): void {
  if (document.hidden) cancelGesture();
}
function addAtPointer(event: MouseEvent): void {
  if (busy.value) return;
  const lane = event.currentTarget as HTMLElement;
  const frame = Math.max(
    0,
    Math.round(
      (event.clientX - lane.getBoundingClientRect().left - TRACK_INSET) / pixelsPerFrame.value,
    ),
  );
  emit('add', frame);
}
function reorderSelected(delta: number): void {
  if (!selected.value || busy.value) return;
  const index = selectedIndex.value + delta;
  if (index >= 0 && index < rows.value.length) emit('reorder', selected.value.id, index);
}
function viewportScrolled(): void {
  horizontalScroll.value = viewport.value?.scrollLeft ?? 0;
}
async function revealSelection(): Promise<void> {
  await nextTick();
  const scroll = viewport.value;
  const index = selectedIndex.value;
  if (!scroll || index < 0 || gesture.value) return;
  const rowTop = RULER_HEIGHT + index * ROW_HEIGHT;
  const rowBottom = rowTop + ROW_HEIGHT;
  if (rowTop < scroll.scrollTop + RULER_HEIGHT) scroll.scrollTop = index * ROW_HEIGHT;
  else if (rowBottom > scroll.scrollTop + scroll.clientHeight)
    scroll.scrollTop = rowBottom - scroll.clientHeight;
}
async function zoom(factor: number): Promise<void> {
  if (gesture.value) return;
  autoFit.value = false;
  deferredFit = false;
  const scroll = viewport.value;
  const oldScale = pixelsPerFrame.value;
  const visibleWidth = Math.max(0, (scroll?.clientWidth ?? viewportWidth.value) - LABEL_WIDTH);
  const centerFrame = ((scroll?.scrollLeft ?? 0) + visibleWidth / 2 - TRACK_INSET) / oldScale;
  pixelsPerFrame.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, oldScale * factor));
  await nextTick();
  if (scroll) {
    scroll.scrollLeft = Math.max(0, frameX(centerFrame) - visibleWidth / 2);
    viewportScrolled();
  }
}
function fit(): void {
  if (gesture.value) return;
  autoFit.value = true;
  applyFit();
}
function applyFit(): void {
  if (gesture.value) {
    deferredFit = true;
    return;
  }
  deferredFit = false;
  const width = Math.max(100, viewportWidth.value - LABEL_WIDTH - TRACK_INSET - 100);
  pixelsPerFrame.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, width / durationExtent.value));
  if (viewport.value) viewport.value.scrollLeft = 0;
  horizontalScroll.value = 0;
}

watch(
  () => [props.selectedEntryId, selected.value?.startFrame, selected.value?.endFrame] as const,
  () => {
    if (gesture.value && gesture.value.id !== props.selectedEntryId) cancelGesture();
    resetForm();
  },
  { immediate: true },
);
// ID 来自源数组下标：顺序、入口或时间变化后，进行中的手势不再指向原始调度。
watch(
  () =>
    JSON.stringify(
      rows.value.map(entry => [entry.id, entry.targetId, entry.startFrame, entry.endFrame]),
    ),
  cancelGesture,
  { flush: 'sync' },
);
watch(() => [props.selectedEntryId, rows.value.length] as const, revealSelection, {
  flush: 'post',
});
watch(
  () => props.disabled,
  disabled => {
    if (disabled) cancelGesture();
  },
);
onMounted(() => {
  if (viewport.value) {
    viewportWidth.value = viewport.value.clientWidth;
    resizeObserver = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width !== undefined && width !== viewportWidth.value) {
        viewportWidth.value = width;
        if (autoFit.value) applyFit();
      }
    });
    resizeObserver.observe(viewport.value);
  }
  fit();
  void revealSelection();
  window.addEventListener('blur', cancelGesture);
  window.addEventListener('keydown', escapeGesture, true);
  document.addEventListener('visibilitychange', visibilityChanged);
});
onBeforeUnmount(() => {
  cancelGesture();
  setPending(false);
  resizeObserver?.disconnect();
  window.removeEventListener('blur', cancelGesture);
  window.removeEventListener('keydown', escapeGesture, true);
  document.removeEventListener('visibilitychange', visibilityChanged);
});
</script>

<template>
  <section
    ref="panel"
    class="skill-timeline-panel"
    aria-label="技能施放时间编辑区"
    @focusout="blurPanel"
  >
    <header class="panel-header">
      <div class="panel-heading">
        <strong>施放时间</strong><span>{{ rows.length }} 项调度 · 局部帧</span>
      </div>
      <div class="panel-controls">
        <EaButton size="sm" :disabled="busy" @click="emit('add', selected?.startFrame ?? 0)"
          >新增调度</EaButton
        >
        <span class="zoom-controls">
          <EaButton
            size="sm"
            icon-only
            :disabled="Boolean(gesture) || pixelsPerFrame <= MIN_SCALE"
            aria-label="缩小时间刻度"
            @click="zoom(1 / 1.4)"
            >−</EaButton
          >
          <EaButton size="sm" :disabled="Boolean(gesture)" @click="fit">适合宽度</EaButton>
          <EaButton
            size="sm"
            icon-only
            :disabled="Boolean(gesture) || pixelsPerFrame >= MAX_SCALE"
            aria-label="放大时间刻度"
            @click="zoom(1.4)"
            >＋</EaButton
          >
        </span>
        <EaButton
          size="sm"
          title="选择调度行后可输入精确帧。◆ 为无结束帧的点，拖动修改开始帧；区间整体拖动保持长度，两端把手调整范围。开始帧等于结束帧仍是显式区间，结束帧留空表示没有结束帧。⠿ 拖柄只调整调度顺序；双击时间尺新增。拖动松手应用，Esc 取消。"
          >操作说明</EaButton
        >
        <EaButton
          size="sm"
          icon-only
          aria-label="收起施放时间"
          :disabled="Boolean(gesture)"
          @click="emit('close')"
          >×</EaButton
        >
      </div>
    </header>
    <div v-if="selected" class="selection-toolbar">
      <span class="selection-name" :title="title(selected)"
        >{{ selectedIndex + 1 }} · {{ title(selected) }}</span
      >
      <form class="frame-form" @submit.prevent="applyForm">
        <label
          >开始帧<input
            type="number"
            min="0"
            step="1"
            :disabled="disabled || Boolean(gesture)"
            :value="startInput"
            @input="changeFrame('start', ($event.target as HTMLInputElement).value)"
        /></label>
        <label
          >结束帧<input
            type="number"
            min="0"
            step="1"
            placeholder="无结束"
            :disabled="disabled || Boolean(gesture)"
            :value="endInput"
            @input="changeFrame('end', ($event.target as HTMLInputElement).value)"
        /></label>
        <EaButton
          type="submit"
          size="sm"
          variant="primary"
          :disabled="!formPending || disabled || Boolean(gesture)"
          >应用</EaButton
        >
        <EaButton
          size="sm"
          :disabled="!formPending || disabled || Boolean(gesture)"
          @click="resetForm"
          >放弃修改</EaButton
        >
      </form>
      <div class="entry-controls">
        <EaButton size="sm" :disabled="busy" @click="emit('focusEntry', selected.id)"
          >定位画布</EaButton
        >
        <EaButton size="sm" :disabled="busy" @click="emit('duplicate', selected.id)">复制</EaButton>
        <EaButton size="sm" :disabled="busy || selectedIndex <= 0" @click="reorderSelected(-1)"
          >上移</EaButton
        >
        <EaButton
          size="sm"
          :disabled="busy || selectedIndex >= rows.length - 1"
          @click="reorderSelected(1)"
          >下移</EaButton
        >
        <EaButton size="sm" variant="danger" :disabled="busy" @click="emit('remove', selected.id)"
          >删除</EaButton
        >
      </div>
    </div>
    <div ref="viewport" class="timeline-viewport" @scroll="viewportScrolled">
      <div class="timeline-content" :style="contentStyle">
        <div class="timeline-ruler">
          <div class="ruler-label">调度顺序 / 入口动作</div>
          <div class="ruler-track" title="双击刻度处新增调度" @dblclick="addAtPointer">
            <span
              v-for="tick in ticks"
              :key="tick"
              class="ruler-tick"
              :style="{ left: `${frameX(tick)}px` }"
              >{{ tick }}</span
            >
          </div>
        </div>
        <div
          v-for="(entry, index) in rows"
          :key="entry.id"
          class="timeline-row"
          :class="{
            selected: entry.id === selectedEntryId,
            'dragging-order': gesture?.kind === 'order' && gesture.id === entry.id,
            'drop-before':
              gesture?.kind === 'order' &&
              gesture.toIndex === index &&
              gesture.toIndex < gesture.fromIndex,
            'drop-after':
              gesture?.kind === 'order' &&
              gesture.toIndex === index &&
              gesture.toIndex > gesture.fromIndex,
          }"
        >
          <div class="row-label">
            <button
              type="button"
              class="order-grip"
              :disabled="disabled || formPending"
              :aria-label="`拖动调整第 ${index + 1} 项顺序`"
              title="只调整调度顺序，不改变时间"
              @pointerdown="startOrder($event, entry, index)"
              @pointermove="movePointer"
              @pointerup="finishPointer"
              @pointercancel="cancelGesture"
              @lostpointercapture="cancelGesture"
            >
              ⠿
            </button>
            <button
              type="button"
              class="row-choice"
              :disabled="disabled || Boolean(gesture)"
              :title="`${title(entry)} · ${entry.targetId ?? '空入口'}`"
              :aria-pressed="entry.id === selectedEntryId"
              @click="choose(entry)"
            >
              <span class="row-number">{{ index + 1 }}</span
              ><span class="row-title">{{ title(entry) }}</span>
            </button>
          </div>
          <div class="row-track" @click.self="choose(entry)">
            <button
              v-if="timeOf(entry).end === null"
              type="button"
              class="point-marker"
              :style="markerStyle(entry)"
              :disabled="disabled || formPending"
              :aria-label="`${title(entry)}，${timeLabel(entry)}，拖动修改开始帧`"
              :title="timeLabel(entry)"
              @pointerdown="startTime($event, entry, 'move')"
              @pointermove="movePointer"
              @pointerup="finishPointer"
              @pointercancel="cancelGesture"
              @lostpointercapture="cancelGesture"
              @click="choose(entry)"
            >
              <span class="point-shape" /><span class="time-caption">{{
                timeOf(entry).start
              }}</span>
            </button>
            <div
              v-else
              class="range-marker"
              :class="{ 'zero-range': timeOf(entry).start === timeOf(entry).end }"
              :style="markerStyle(entry)"
            >
              <button
                type="button"
                class="range-body"
                :disabled="disabled || formPending"
                :aria-label="`${title(entry)}，${timeLabel(entry)}，拖动保持区间长度`"
                :title="`${timeLabel(entry)}；拖动整体移动`"
                @pointerdown="startTime($event, entry, 'move')"
                @pointermove="movePointer"
                @pointerup="finishPointer"
                @pointercancel="cancelGesture"
                @lostpointercapture="cancelGesture"
                @click="choose(entry)"
              />
              <button
                type="button"
                class="range-handle start-handle"
                :disabled="disabled || formPending"
                :aria-label="`调整第 ${index + 1} 项开始帧`"
                title="调整开始帧"
                @pointerdown="startTime($event, entry, 'start')"
                @pointermove="movePointer"
                @pointerup="finishPointer"
                @pointercancel="cancelGesture"
                @lostpointercapture="cancelGesture"
              />
              <button
                type="button"
                class="range-handle end-handle"
                :disabled="disabled || formPending"
                :aria-label="`调整第 ${index + 1} 项结束帧`"
                title="调整结束帧"
                @pointerdown="startTime($event, entry, 'end')"
                @pointermove="movePointer"
                @pointerup="finishPointer"
                @pointercancel="cancelGesture"
                @lostpointercapture="cancelGesture"
              />
              <span class="time-caption">{{ timeOf(entry).start }}–{{ timeOf(entry).end }}</span>
            </div>
          </div>
        </div>
        <p v-if="rows.length === 0" class="empty-timeline">
          暂无施放调度。双击时间尺或点击“新增调度”。
        </p>
      </div>
    </div>
    <div v-if="error || gesture || formPending" class="panel-notice" role="status">
      <span v-if="error" class="panel-error" role="alert">{{ error }}</span>
      <span v-if="gesture?.kind === 'order'"
        >调整顺序：第 {{ gesture.fromIndex + 1 }} 项 → 第 {{ gesture.toIndex + 1 }} 项 ·
        松手应用，Esc 取消</span
      >
      <span v-else-if="gesture"
        >预览：{{ gesture.start
        }}{{ gesture.end === null ? ' 帧 · 点' : `–${gesture.end} 帧 · 区间` }} · 松手应用，Esc
        取消</span
      >
      <span v-if="formPending" class="pending-label">时间输入尚未应用</span>
    </div>
  </section>
</template>

<style scoped>
.skill-timeline-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  color: var(--ea-fg);
  background: var(--ea-bg, #18181c);
  font-size: 12px;
}
.panel-header,
.panel-heading,
.panel-controls,
.zoom-controls,
.selection-toolbar,
.frame-form,
.entry-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.panel-header {
  flex: none;
  box-sizing: border-box;
  min-height: 34px;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 10px;
  border-bottom: 1px solid var(--ea-border);
}
.panel-heading {
  min-width: 0;
  white-space: nowrap;
}
.panel-heading span {
  color: var(--ea-fg-muted);
}
.zoom-controls {
  gap: 2px;
}
.selection-toolbar {
  flex: none;
  box-sizing: border-box;
  min-height: 38px;
  gap: 8px;
  padding: 4px 10px;
  border-bottom: 1px solid var(--ea-border);
}
.selection-name {
  min-width: 40px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.frame-form {
  flex: none;
  gap: 6px;
}
.frame-form label {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  color: var(--ea-fg-muted);
}
.frame-form input {
  box-sizing: border-box;
  width: 76px;
  height: 28px;
  padding: 3px 6px;
  border: 1px solid var(--ea-border);
  border-radius: 0;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  font:
    12px Consolas,
    monospace;
}
.entry-controls {
  flex: none;
  margin-left: auto;
  gap: 5px;
}
.panel-error {
  color: var(--ea-danger-soft);
}
.timeline-viewport {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}
.timeline-content {
  min-height: 100%;
}
.timeline-ruler,
.timeline-row {
  display: grid;
  grid-template-columns: var(--label-width) 1fr;
}
.timeline-ruler {
  position: sticky;
  top: 0;
  z-index: 5;
  height: 28px;
  background: var(--ea-bg, #18181c);
  box-shadow: 0 1px var(--ea-border);
}
.ruler-label,
.row-label {
  position: sticky;
  left: 0;
  z-index: 3;
  box-sizing: border-box;
  background: var(--ea-bg, #18181c);
  border-right: 1px solid var(--ea-border);
}
.ruler-label {
  z-index: 6;
  display: flex;
  align-items: center;
  padding-left: 16px;
  color: var(--ea-fg-muted);
}
.ruler-track {
  position: relative;
  cursor: crosshair;
  overflow: hidden;
}
.ruler-tick {
  position: absolute;
  height: 100%;
  border-left: 1px solid var(--ea-border);
  padding-left: 5px;
  padding-top: 4px;
  box-sizing: border-box;
  font:
    11px Consolas,
    monospace;
  color: var(--ea-fg-muted);
}
.timeline-row {
  position: relative;
  height: var(--row-height);
  box-sizing: border-box;
  border-bottom: 1px solid color-mix(in srgb, var(--ea-border) 60%, transparent);
}
.row-label {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 7px;
}
.row-choice {
  min-width: 0;
  height: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  border: 0;
  padding: 0 3px;
  background: transparent;
  color: var(--ea-fg);
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.row-number {
  flex: none;
  width: 20px;
  color: var(--ea-fg-muted);
  text-align: right;
  font:
    11px Consolas,
    monospace;
}
.row-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.order-grip {
  flex: none;
  width: 22px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ea-fg-muted);
  font-size: 20px;
  cursor: grab;
  touch-action: none;
}
.row-track {
  position: relative;
  background-image: repeating-linear-gradient(
    to right,
    var(--ea-border) 0,
    var(--ea-border) 1px,
    transparent 1px,
    transparent var(--tick-width)
  );
  background-position: var(--track-inset) 0;
}
.selected .row-label {
  background: color-mix(in srgb, var(--ea-blue) 15%, var(--ea-bg, #18181c));
}
.selected .row-track {
  background-color: color-mix(in srgb, var(--ea-blue) 8%, transparent);
}
.dragging-order .row-label {
  opacity: 0.7;
}
.drop-before::before,
.drop-after::after {
  position: absolute;
  z-index: 7;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--ea-accent);
  content: '';
  pointer-events: none;
}
.drop-before::before {
  top: 0;
}
.drop-after::after {
  bottom: 0;
}
.point-marker,
.range-body,
.range-handle {
  padding: 0;
  border: 0;
  background: transparent;
  touch-action: none;
  user-select: none;
}
.point-marker {
  position: absolute;
  top: 8px;
  width: 20px;
  height: 22px;
  transform: translateX(-50%);
  cursor: ew-resize;
  overflow: visible;
  color: var(--ea-blue);
}
.point-shape {
  display: block;
  width: 10px;
  height: 10px;
  margin: auto;
  transform: rotate(45deg);
  background: currentColor;
  border: 1px solid color-mix(in srgb, var(--ea-fg) 60%, transparent);
  box-sizing: border-box;
}
.range-marker {
  position: absolute;
  top: 8px;
  height: 22px;
}
.range-body {
  position: absolute;
  inset: 2px 0;
  width: 100%;
  min-width: 2px;
  border: 1px solid var(--ea-blue);
  background: color-mix(in srgb, var(--ea-blue) 38%, transparent);
  cursor: grab;
}
.range-handle {
  position: absolute;
  top: 0;
  width: 7px;
  height: 22px;
  background: var(--ea-blue);
  border: 1px solid color-mix(in srgb, var(--ea-fg) 60%, transparent);
  cursor: ew-resize;
}
.start-handle {
  left: -3px;
}
.end-handle {
  right: -3px;
}
.zero-range .range-body {
  left: -5px;
  width: 10px;
}
.zero-range .start-handle {
  left: -10px;
}
.zero-range .end-handle {
  right: -10px;
}
.time-caption {
  position: absolute;
  left: calc(100% + 10px);
  top: 3px;
  pointer-events: none;
  color: var(--ea-fg-muted);
  white-space: nowrap;
  font:
    11px/16px Consolas,
    monospace;
}
.selected .point-marker {
  color: var(--ea-accent);
}
.selected .range-body {
  border-color: var(--ea-accent);
  background: color-mix(in srgb, var(--ea-accent) 30%, transparent);
}
.selected .range-handle {
  background: var(--ea-accent);
}
button:disabled {
  cursor: default;
}
.point-marker:disabled,
.range-body:disabled,
.range-handle:disabled {
  opacity: 0.75;
}
button:focus-visible,
input:focus-visible {
  outline: 1px solid var(--ea-accent);
  outline-offset: 2px;
}
.empty-timeline {
  position: sticky;
  left: 0;
  width: min(600px, 90vw);
  box-sizing: border-box;
  margin: 0;
  padding: 22px 16px;
  color: var(--ea-fg-muted);
}
.panel-notice {
  position: absolute;
  z-index: 9;
  right: 12px;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: min(620px, calc(100% - 24px));
  padding: 5px 9px;
  border: 1px solid var(--ea-border);
  background: var(--ea-bg, #18181c);
  color: var(--ea-fg-muted);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--ea-bg, #18181c) 60%, transparent);
  font-size: 11px;
  pointer-events: none;
}
.pending-label {
  color: var(--ea-orange);
  white-space: nowrap;
}
@media (max-width: 900px) {
  .panel-heading span {
    display: none;
  }
  .selection-name {
    max-width: 130px;
  }
  .selection-toolbar {
    flex-wrap: wrap;
  }
  .entry-controls {
    margin-left: 0;
  }
}
@media (max-width: 620px) {
  .frame-form {
    flex: auto;
    flex-wrap: wrap;
  }
}
</style>
