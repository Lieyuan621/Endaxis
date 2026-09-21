<script setup lang="ts">
/**
 * 时间轴的实际战斗时间标尺与准备区边界。
 */
import { computed, nextTick, onScopeDispose, ref } from 'vue';
import { EaButton, EaNumberInput } from '@/design-system';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../interaction/usePopoverInteractionBoundary';
import { useI18n } from 'vue-i18n';
import { PROJECT_FPS } from '../../../core/project/schema';
import { frameToTimelinePx, timelinePxToFrame, timelineTotalWidth } from '../timelineGeometry';
import {
  projectTimelineOperationMarkers,
  type TimelineOperationMarkerInput,
  type OperationKeycapMode,
} from '../timelineOperationMarkers';
import { projectTimelineRulerTicks } from '../timelineRulerTicks';
const interactionSession = useInteractionSession();

const MIN_BATTLE_DURATION_FRAMES = PROJECT_FPS * 30;
const MAX_BATTLE_DURATION_FRAMES = PROJECT_FPS * 600;

const props = defineProps<{
  prepReadOnly?: boolean;
  prepFrames: number;
  durationFrames: number;
  cursorFrame: number;
  pxPerFrame: number;
  snapFrames: number;
  operations: readonly TimelineOperationMarkerInput[];
  keycapMode: OperationKeycapMode;
  visibleLeftPx: number;
  visibleWidthPx: number;
  prepEndFrame?: number;

  prepExpanded: boolean;
}>();

const emit = defineEmits<{
  seek: [frame: number];
  prepInfo: [event: MouseEvent];
  resizeHistory: [event: PointerEvent];
  setPrepFrames: [frames: number];
  setDurationFrames: [frames: number];
}>();
const { t } = useI18n({ useScope: 'global' });
const prepPreview = ref<number | null>(null);
const durationPreview = ref<number | null>(null);
const prepEditorOpen = ref(false);
const durationEditorOpen = ref(false);
usePopoverInteractionBoundary(interactionSession, () => prepEditorOpen.value, closePrepEditor);
usePopoverInteractionBoundary(
  interactionSession,
  () => durationEditorOpen.value,
  closeDurationEditor,
);
const prepDraft = ref<number>();
const durationDraftSeconds = ref<number>();
const prepInput = ref<{ focus: (options?: FocusOptions) => void } | null>(null);
const durationInput = ref<{ focus: (options?: FocusOptions) => void } | null>(null);
let stopResize: (() => void) | null = null;
const activePrepFrames = computed(() => prepPreview.value ?? props.prepFrames);
const activeDurationFrames = computed(() => durationPreview.value ?? props.durationFrames);
const totalWidth = computed(() =>
  timelineTotalWidth(
    activePrepFrames.value,
    activeDurationFrames.value,
    props.pxPerFrame,
    props.prepExpanded,
    props.prepEndFrame,
  ),
);
const prepWidth = computed(() =>
  frameToTimelinePx(
    props.prepEndFrame ?? 0,
    activePrepFrames.value,
    props.pxPerFrame,
    props.prepExpanded,
    props.prepEndFrame,
  ),
);
const ticks = computed(() =>
  projectTimelineRulerTicks({
    prepFrames: activePrepFrames.value,
    durationFrames: activeDurationFrames.value,
    pxPerFrame: props.pxPerFrame,
    visibleLeftPx: props.visibleLeftPx,
    visibleWidthPx: props.visibleWidthPx,
    prepExpanded: props.prepExpanded,
    prepEndFrame: props.prepEndFrame,
  }),
);
const operationMarkers = computed(() =>
  projectTimelineOperationMarkers(
    props.operations,
    activePrepFrames.value,
    props.pxPerFrame,
    props.prepExpanded,
    props.prepEndFrame,
    props.keycapMode,
  ),
);

function snapFrame(frame: number): number {
  const step = Math.max(1, props.snapFrames);
  return Math.round(frame / step) * step;
}

function beginResize(kind: 'prep' | 'duration', event: PointerEvent): void {
  if (kind === 'prep' && props.prepReadOnly) {
    emit('resizeHistory', event);
    return;
  }
  if (event.button !== 0) return;
  if (kind === 'prep' && !props.prepExpanded) return;
  event.preventDefault();
  event.stopPropagation();
  const lease = interactionSession.tryStart('ruler-resize', () => stopResize?.());
  if (lease === null) return;
  const ruler = (event.currentTarget as HTMLElement).closest('.ruler-content') as HTMLElement;
  const move = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== event.pointerId) return;
    const localPx = moveEvent.clientX - ruler.getBoundingClientRect().left;
    if (kind === 'prep') {
      prepPreview.value = Math.max(0, snapFrame(localPx / props.pxPerFrame));
    } else {
      durationPreview.value = Math.max(
        MIN_BATTLE_DURATION_FRAMES,
        Math.min(
          MAX_BATTLE_DURATION_FRAMES,
          snapFrame(
            timelinePxToFrame(
              localPx,
              activePrepFrames.value,
              props.pxPerFrame,
              props.prepExpanded,
              props.prepEndFrame,
            ),
          ),
        ),
      );
    }
  };
  const cleanup = () => {
    lease.release();
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', cancel);
    stopResize = null;
  };
  const finish = (finishEvent: PointerEvent) => {
    if (finishEvent.pointerId !== event.pointerId) return;
    const prep = prepPreview.value;
    const duration = durationPreview.value;
    prepPreview.value = null;
    durationPreview.value = null;
    cleanup();
    if (kind === 'prep' && prep !== null) emit('setPrepFrames', prep);
    if (kind === 'duration' && duration !== null) emit('setDurationFrames', duration);
  };
  const cancel = (cancelEvent?: PointerEvent) => {
    if (cancelEvent !== undefined && cancelEvent.pointerId !== event.pointerId) return;
    prepPreview.value = null;
    durationPreview.value = null;
    cleanup();
  };
  stopResize = cancel;
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', cancel);
}

function openPrepEditor(event: MouseEvent): void {
  if (props.prepReadOnly) {
    emit('prepInfo', event);
    return;
  }
  prepDraft.value = props.prepFrames;
  prepEditorOpen.value = true;
  durationEditorOpen.value = false;
  void nextTick(() => prepInput.value?.focus({ preventScroll: true }));
}

function applyPrepDraft(): void {
  if (!prepEditorOpen.value) return;
  const frames = Number(prepDraft.value);
  prepEditorOpen.value = false;
  if (Number.isInteger(frames) && frames >= 0) emit('setPrepFrames', frames);
}

function closePrepEditor(): void {
  prepDraft.value = props.prepFrames;
  prepEditorOpen.value = false;
}

function openDurationEditor(): void {
  durationDraftSeconds.value = props.durationFrames / PROJECT_FPS;
  durationEditorOpen.value = true;
  prepEditorOpen.value = false;
  void nextTick(() => durationInput.value?.focus({ preventScroll: true }));
}

function applyDurationDraft(): void {
  if (!durationEditorOpen.value) return;
  const seconds = Number(durationDraftSeconds.value);
  durationEditorOpen.value = false;
  const frames = Math.round(seconds * PROJECT_FPS);
  if (Number.isFinite(seconds) && frames > 0) emit('setDurationFrames', frames);
}

function closeDurationEditor(): void {
  durationDraftSeconds.value = props.durationFrames / PROJECT_FPS;
  durationEditorOpen.value = false;
}

onScopeDispose(() => stopResize?.());

function seek(event: MouseEvent): void {
  const element = event.currentTarget as HTMLElement;
  const px = event.clientX - element.getBoundingClientRect().left;
  const actualFrame = timelinePxToFrame(
    px,
    props.prepFrames,
    props.pxPerFrame,
    props.prepExpanded,
    props.prepEndFrame,
  );
  emit(
    'seek',
    Math.max(-props.prepFrames, Math.min(props.durationFrames, Math.round(actualFrame))),
  );
}
</script>

<template>
  <div class="ruler-viewport">
    <div class="ruler-content" :style="{ width: `${totalWidth}px` }" @click="seek">
      <div class="prep-zone" :style="{ width: `${prepWidth}px` }"></div>
      <div
        class="operation-layer"
        :style="{ clipPath: prepExpanded ? undefined : 'inset(0 0 0 18px)' }"
      >
        <span
          v-for="operation in operationMarkers"
          :key="operation.id"
          class="key-cap"
          :class="[
            `key-cap--${operation.kind}`,
            { 'is-hold': operation.hold, 'is-perfect': operation.perfect },
          ]"
          :style="{
            left: `${operation.left}px`,
            top: `${operation.top}px`,
            width: operation.width === null ? 'auto' : `${operation.width}px`,
            height: `${operation.height}px`,
            fontSize: `${operation.fontSize}px`,
          }"
        >
          <span class="key-text">{{ operation.label }}</span>
        </span>
      </div>
      <div class="time-ruler-track" :title="t('timelineGrid.ruler.realTimeTitle')"></div>
      <span
        v-for="tick in ticks"
        :key="tick.key"
        class="tick"
        :class="`tick--${tick.type}`"
        :style="{ left: `${Math.round(tick.left)}px` }"
      >
        <span v-if="tick.label" class="tick-label">{{ tick.label }}</span>
      </span>
      <span
        class="axis-boundary axis-boundary--prep"
        :class="{ 'is-prep-collapsed': !prepExpanded }"
        :style="{ left: `${prepWidth}px` }"
        @pointerdown="beginResize('prep', $event)"
        @click.stop
      >
        <EaButton
          variant="ghost"
          size="sm"
          icon-only
          type="button"
          :title="t(prepReadOnly ? 'inheritance.boundary' : 'timelineGrid.prep.setDurationTitle')"
          @pointerdown.stop
          @click.stop="openPrepEditor"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <template v-if="prepReadOnly">
              <circle cx="6" cy="5" r="2"></circle>
              <circle cx="18" cy="19" r="2"></circle>
              <path d="M6 7v5a7 7 0 0 0 7 7h3M13 5h7m-3-3 3 3-3 3"></path>
            </template>
            <template v-else>
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 7v6l4 2"></path>
            </template>
          </svg>
        </EaButton>
      </span>
      <span
        class="axis-boundary axis-boundary--end"
        :style="{ left: `${totalWidth}px` }"
        @pointerdown="beginResize('duration', $event)"
        @click.stop
      >
        <EaButton
          variant="ghost"
          size="sm"
          icon-only
          type="button"
          :title="t('timelineGrid.battle.setDurationTitle')"
          @pointerdown.stop
          @click.stop="openDurationEditor"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v6l4 2"></path>
          </svg>
        </EaButton>
        <b>{{ Math.round(activeDurationFrames / PROJECT_FPS) }}s</b>
      </span>
      <form
        v-if="prepEditorOpen"
        class="axis-editor"
        :style="{ left: `${prepWidth + 8}px` }"
        @submit.prevent="applyPrepDraft"
        @pointerdown.stop
      >
        <EaNumberInput
          ref="prepInput"
          v-model="prepDraft"
          size="sm"
          controls-position="right"
          :min="0"
          :step="1"
          @blur="applyPrepDraft"
        />
        <span>f</span>
      </form>
      <form
        v-if="durationEditorOpen"
        class="axis-editor axis-editor--end"
        :style="{ left: `${Math.max(8, totalWidth - 88)}px` }"
        @submit.prevent="applyDurationDraft"
        @pointerdown.stop
      >
        <EaNumberInput
          ref="durationInput"
          v-model="durationDraftSeconds"
          size="sm"
          controls-position="right"
          :min="30"
          :max="600"
          :step="1"
          @blur="applyDurationDraft"
        />
        <span>s</span>
      </form>
    </div>
  </div>
</template>

<style scoped>
.ruler-viewport {
  width: 100%;
  height: 60px;
  overflow: hidden;
  border-bottom: 1px solid var(--ea-border);
  background: var(--ea-workbench-header);
}

.ruler-content {
  position: relative;
  height: 100%;
  min-width: 100%;
  cursor: default;
}

.prep-zone {
  position: absolute;
  inset: 0 auto 0 0;
  box-sizing: border-box;
  border-right: 1px solid var(--ea-border);
  background: var(--ea-prep-fill);
}

.operation-layer {
  position: absolute;
  z-index: 10;
  top: 4px;
  left: 0;
  width: 100%;
  height: 50px;
  pointer-events: none;
}

.key-cap {
  position: absolute;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid var(--ea-keycap-border, #666);
  border-radius: 2px;
  background: var(--ea-keycap-bg, #444);
  color: var(--ea-fg, #fff);
  box-shadow: 0 1px 1px var(--ea-shadow, rgb(0 0 0 / 50%));
  font-family: Consolas, Monaco, monospace;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0.95;
  pointer-events: none;
  transition:
    top 0.2s,
    height 0.2s;
}

.key-cap--skill {
  border-color: var(--ea-keycap-skill-border, #888);
  background: var(--ea-keycap-skill-bg, #3a3a3a);
}

.key-cap--combo {
  z-index: 2;
  border-color: var(--ea-gold);
  background: color-mix(in srgb, var(--ea-gold) 20%, transparent);
  color: var(--ea-gold);
}

.key-cap--combo.is-perfect {
  border-color: #fff2a8;
  background: rgb(255 236 122 / 36%);
  color: #fff7cf;
  box-shadow:
    0 0 0 1px rgb(255 242 168 / 85%),
    0 0 12px color-mix(in srgb, var(--ea-gold) 85%, transparent);
  animation: perfect-operation-pulse 1.15s ease-in-out infinite;
}

.key-cap--switch {
  border-color: #d3adff;
  background: rgb(211 173 255 / 20%);
  color: #d3adff;
}

.key-cap.is-hold {
  justify-content: center;
  width: auto;
  padding: 0 4px;
  border-color: var(--ea-keycap-skill-border, #888);
  background: var(--ea-keycap-skill-bg, #3a3a3a);
}

.key-cap.is-hold .key-text {
  margin: 0;
  padding: 0;
  background: transparent;
  color: var(--ea-fg, #fff);
  font-size: 9px;
}

@keyframes perfect-operation-pulse {
  50% {
    filter: brightness(1.35);
  }
}

@media (prefers-reduced-motion: reduce) {
  .key-cap--combo.is-perfect {
    animation: none;
  }
}

.time-ruler-track {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 20px;
}

.tick {
  position: absolute;
  bottom: 0;
  height: 10px;
  width: 1px;
  background: var(--ea-mark);
  transform: translateX(-0.5px);
  image-rendering: pixelated;
  pointer-events: none;
}

.tick--major,
.tick--majorDim {
  height: 17px;
  background: var(--ea-mark-strong);
}

.tick--major {
  z-index: 2;
}

.tick--majorDim {
  background: var(--ea-mark);
  z-index: 1;
}

.tick--minor {
  height: 10px;
  background: var(--ea-mark-major);
  z-index: 1;
}

.tick--frame {
  height: 5px;
}

.tick-label {
  position: absolute;
  left: 3px;
  bottom: 1px;
  color: var(--ea-fg-muted, #888);
  font:
    10px/1 'Roboto Mono',
    Consolas,
    monospace;
  white-space: nowrap;
}

.tick--major .tick-label {
  color: var(--ea-fg, #e0e0e0);
  font-size: 11px;
  font-weight: 700;
}

.tick--majorDim .tick-label {
  display: none;
}

.tick--minor .tick-label,
.tick--frame .tick-label {
  color: var(--ea-fg-faint, #666);
  font-size: 8px;
  font-style: italic;
}

.axis-boundary {
  position: absolute;
  z-index: 5;
  top: 0;
  bottom: 0;
  width: 14px;
  margin-left: -7px;
  cursor: ew-resize;
}

.axis-boundary::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 6px;
  width: 2px;
  background: color-mix(in srgb, var(--ea-mark-strong) 70%, transparent);
}

.axis-boundary--end::before {
  background: rgb(0 229 255 / 55%);
}

.axis-boundary button {
  position: absolute;
  top: 6px;
  left: -12px;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  padding: 0;
  background: transparent;
  color: var(--ea-fg-secondary);
  cursor: pointer;
  transition: color 0.12s ease;
}

.axis-boundary button:hover {
  color: var(--ea-gold);
}

.axis-boundary button:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ea-gold) 35%, transparent);
}

.axis-boundary--end button {
  left: -15px;
}

.axis-boundary--prep.is-prep-collapsed {
  cursor: default;
}

.axis-boundary--prep.is-prep-collapsed button {
  top: auto;
  bottom: 20px;
  left: -11px;
}

.axis-boundary--end::before {
  background: rgb(0 229 255 / 55%);
}

.axis-boundary b {
  position: absolute;
  top: 28px;
  right: 12px;
  color: rgb(0 229 255 / 92%);
  font:
    10px/1 'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-align: right;
  text-shadow: 0 0 6px rgb(0 229 255 / 25%);
  white-space: nowrap;
}

.axis-editor {
  position: absolute;
  z-index: 50;
  top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid var(--ea-border-strong);
  background: var(--ea-tooltip-bg);
  box-shadow: 0 10px 25px var(--ea-shadow-strong);
}

.axis-editor :deep(.ea-number-input) {
  width: 72px;
}

.axis-editor span {
  color: var(--ea-fg-muted);
  font:
    12px 'Roboto Mono',
    Consolas,
    monospace;
}
</style>
