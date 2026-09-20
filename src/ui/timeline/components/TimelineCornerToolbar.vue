<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { EaButton, EaNumberInput } from '@/design-system';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../interaction/usePopoverInteractionBoundary';
import {
  stepTimelineZoomPercent,
  timelineZoomPercentToSliderPosition,
  timelineZoomSliderPositionToPercent,
  TIMELINE_ZOOM_SLIDER_MAX,
} from '../interaction/timelineViewport';

/** 时间轴轨道头部上方的编辑工具区，结构与尺寸以旧版 TimelineGrid 为准。 */
const props = defineProps<{
  configurationReadOnly?: boolean;
  snapLabel: string;
  zoomPercent: number;
  cursorGuideEnabled: boolean;
  boxSelectEnabled: boolean;
  connectionToolEnabled: boolean;
  initialGaugeMode: 'empty' | 'full' | 'custom';
  initialGaugeDisplayValue: string;
  buffLayoutMode: 'compact' | 'loose';
  labels: {
    initialGauge: string;
    cursorGuide: string;
    boxSelect: string;
    snapPrecision: string;
    connectionTool: string;
    buffLayout: string;
    zoom: string;
  };
}>();

const emit = defineEmits<{
  toggleSnapPrecision: [];
  cycleInitialGauge: [];
  setUnifiedInitialGauge: [value: number];
  toggleCursorGuide: [];
  toggleBoxSelect: [];
  toggleConnectionTool: [];
  toggleBuffLayout: [];
  updateZoomPercent: [percent: number];
  setZoomPercent: [percent: number];
}>();

const gaugeEditorOpen = ref(false);
const gaugeDraft = ref(100);
const gaugeInput = ref<{ select: () => void } | null>(null);
usePopoverInteractionBoundary(
  useInteractionSession(),
  () => gaugeEditorOpen.value,
  () => {
    gaugeEditorOpen.value = false;
  },
);

function toggleGaugeEditor(event: Event): void {
  if (props.configurationReadOnly) {
    event.preventDefault();
    return;
  }
  event.preventDefault();
  gaugeEditorOpen.value = !gaugeEditorOpen.value;
  if (gaugeEditorOpen.value) void nextTick(() => gaugeInput.value?.select());
}

function applyGaugeDraft(): void {
  if (!gaugeEditorOpen.value) return;
  const value = Number(gaugeDraft.value);
  if (Number.isInteger(value) && value >= 0) emit('setUnifiedInitialGauge', value);
  gaugeEditorOpen.value = false;
}
</script>

<template>
  <div class="corner-controls">
    <div class="corner-button-row">
      <div class="initial-gauge-tool">
        <EaButton
          variant="ghost"
          size="sm"
          type="button"
          class="mini-tool-button"
          :disabled="configurationReadOnly"
          :class="{
            'is-gauge-custom': initialGaugeMode === 'custom',
          }"
          :title="labels.initialGauge"
          :aria-label="labels.initialGauge"
          :aria-expanded="gaugeEditorOpen"
          aria-controls="timeline-initial-gauge-editor"
          @click="
            gaugeEditorOpen = false;
            emit('cycleInitialGauge');
          "
          @contextmenu="toggleGaugeEditor"
          @keydown.shift.enter.prevent.stop="toggleGaugeEditor"
          :pressed="initialGaugeMode !== 'empty'"
        >
          <svg v-if="initialGaugeMode !== 'custom'" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M13 2 4 14h7l-1 8L20 9h-7V2Z"
              :fill="initialGaugeMode === 'full' ? 'currentColor' : 'none'"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="7" width="16" height="10" rx="2" />
            <path d="M19 10h2v4h-2" />
            <path d="M7 10v4M11 10v4M15 10v4" stroke-width="1.75" />
          </svg>
          <span class="gauge-tool-value">{{ initialGaugeDisplayValue }}</span>
        </EaButton>
        <form
          v-if="gaugeEditorOpen"
          id="timeline-initial-gauge-editor"
          class="gauge-popover"
          @submit.prevent="applyGaugeDraft"
        >
          <EaNumberInput
            ref="gaugeInput"
            v-model="gaugeDraft"
            size="sm"
            controls-position="right"
            :min="0"
            :step="1"
            :aria-label="labels.initialGauge"
            @blur="applyGaugeDraft"
          />
        </form>
      </div>
      <EaButton
        variant="ghost"
        size="sm"
        type="button"
        class="mini-tool-button mini-tool-button--text"
        :title="labels.snapPrecision"
        :aria-label="`${labels.snapPrecision}: ${snapLabel}`"
        @click="$emit('toggleSnapPrecision')"
      >
        <span class="snap-tool-value">{{ snapLabel }}</span>
      </EaButton>
    </div>

    <div class="zoom-row">
      <div class="zoom-info">
        <span>SCALE</span>
        <div class="zoom-value">
          <EaButton
            variant="ghost"
            size="sm"
            icon-only
            type="button"
            class="zoom-reset"
            :disabled="zoomPercent === 100"
            :aria-label="`${labels.zoom}: 100%`"
            @click="emit('setZoomPercent', 100)"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 11a8 8 0 1 1-2.3-5.7M20 4v5h-5" />
            </svg>
          </EaButton>
          <strong>{{ zoomPercent }}%</strong>
        </div>
      </div>
      <div class="zoom-slider-row">
        <EaButton
          variant="ghost"
          size="sm"
          icon-only
          type="button"
          class="zoom-step"
          :aria-label="`${labels.zoom} -`"
          @click="emit('updateZoomPercent', stepTimelineZoomPercent(zoomPercent, -1))"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 13H5v-2h14v2z" />
          </svg>
        </EaButton>
        <input
          :value="timelineZoomPercentToSliderPosition(zoomPercent)"
          type="range"
          min="0"
          :max="TIMELINE_ZOOM_SLIDER_MAX"
          step="1"
          :aria-label="labels.zoom"
          :aria-valuetext="`${zoomPercent}%`"
          @input="
            emit(
              'setZoomPercent',
              timelineZoomSliderPositionToPercent(
                Number(($event.target as HTMLInputElement).value),
              ),
            )
          "
        />
        <EaButton
          variant="ghost"
          size="sm"
          icon-only
          type="button"
          class="zoom-step"
          :aria-label="`${labels.zoom} +`"
          @click="emit('updateZoomPercent', stepTimelineZoomPercent(zoomPercent, 1))"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </EaButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.corner-controls {
  display: flex;
  flex-direction: column;
  flex: none;
  width: 100%;
  gap: 4px;
  min-width: 0;
}

.corner-button-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  gap: 4px;
}

.mini-tool-button {
  min-width: 0;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--ea-border-strong);
  border-radius: 3px;
  background: var(--ea-fill-input);
  color: var(--ea-fg-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.mini-tool-button:hover {
  border-color: var(--ea-border-strong, #777);
  background: var(--ea-hover-fill, #444);
  color: var(--ea-fg-secondary, #ccc);
}

.mini-tool-button:disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.mini-tool-button[aria-pressed='true'] {
  border-color: var(--ea-gold);
  background: color-mix(in srgb, var(--ea-gold) 10%, transparent);
  color: var(--ea-gold);
  box-shadow: none;
}

.initial-gauge-tool {
  grid-column: span 2;
  position: relative;
  min-width: 0;
}

.initial-gauge-tool .mini-tool-button {
  width: 100%;
  gap: 5px;
}

.mini-tool-button.is-gauge-custom {
  border-style: dashed;
}

.mini-tool-button.is-gauge-custom[aria-pressed='true'] {
  border-color: #38bdf8;
  background: rgb(56 189 248 / 12%);
  color: #7dd3fc;
}

.gauge-popover {
  position: absolute;
  z-index: 20;
  top: 6px;
  left: calc(100% + 4px);
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border: 1px solid var(--ea-border-strong);
  background: var(--ea-tooltip-bg);
  box-shadow: 0 10px 25px var(--ea-shadow-strong);
  transform: translateY(-50%);
}

.gauge-popover :deep(.ea-number-input) {
  width: 72px;
}

.gauge-tool-value {
  overflow: hidden;
  font-size: 9px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-tool-button svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.mini-tool-button--text {
  color: var(--ea-gold);
}

.snap-tool-value {
  font-size: 9px;
  font-weight: bold;
  transform: scale(0.9);
}

.zoom-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.zoom-info,
.zoom-slider-row {
  display: flex;
  align-items: center;
}

.zoom-step {
  width: 10px;
  height: 10px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ea-fg-secondary, #aaa);
  font: inherit;
  cursor: pointer;
  transition: color 0.2s;
}

.zoom-step.ea-button.ea-button--icon-only {
  width: 10px;
  min-width: 10px;
  height: 10px;
}

.zoom-info {
  justify-content: space-between;
  padding: 0 2px;
  width: 100%;
}

.zoom-value {
  display: flex;
  align-items: center;
  gap: 5px;
}

.zoom-reset.ea-button.ea-button--icon-only {
  width: 13px;
  min-width: 13px;
  height: 13px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #fff;
}

.zoom-reset svg {
  width: 12px;
  height: 12px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.zoom-reset.ea-button.ea-button--icon-only:hover:not(:disabled) {
  color: var(--ea-gold);
}

.zoom-reset.ea-button.ea-button--icon-only:disabled {
  color: var(--ea-fg-muted, #777);
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-info strong {
  color: var(--ea-gold);
  font-family: 'Roboto Mono', Consolas, monospace;
  font-size: 9px;
  font-weight: 700;
  opacity: 0.9;
}

.zoom-info > span {
  color: var(--ea-fg-secondary, #aaa);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.zoom-step:hover {
  color: var(--ea-gold);
}

.zoom-slider-row {
  width: 100%;
  gap: 4px;
  color: var(--ea-fg-muted);
  font-size: 11px;
  line-height: 1;
}

.zoom-slider-row input {
  min-width: 0;
  height: 2px;
  flex: 1 1 auto;
  margin: 2px;
  appearance: none;
  background: #555;
  outline: none;
  border-radius: 1px;
}

.zoom-slider-row input::-webkit-slider-thumb {
  appearance: none;
  width: 8px;
  height: 8px;
  background: var(--ea-gold);
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid #333;
  box-shadow: 0 0 2px rgb(0 0 0 / 50%);
  transition: transform 0.1s;
}
.zoom-slider-row input::-webkit-slider-thumb:hover {
  transform: scale(1.3);
  background: #fff;
}
.zoom-slider-row input::-moz-range-thumb {
  width: 8px;
  height: 8px;
  background: var(--ea-gold);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
@media (hover: hover) and (pointer: fine) {
  .mini-tool-button[aria-pressed='true']:hover:not(:disabled) {
    border-color: var(--ea-gold);
    background: color-mix(in srgb, var(--ea-gold) 10%, transparent);
    color: var(--ea-gold);
    box-shadow: none;
  }
  .mini-tool-button.is-gauge-custom[aria-pressed='true']:hover:not(:disabled) {
    border-color: #38bdf8;
    background: rgb(56 189 248 / 12%);
    color: #7dd3fc;
  }
}
</style>
