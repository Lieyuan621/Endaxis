<script setup lang="ts">
/**
 * 时间轴状态段的统一展示框架。
 *
 * Buff、干员专属 UI 和后续其他状态只提供图形内容；边框、计数、悬停和持续条由这里统一。
 */
import { computed, onBeforeUnmount, ref } from 'vue';

withDefaults(
  defineProps<{
    left: number;
    top: number;
    width: number;
    title: string;
    durationColor?: string;
    count?: number | string | null;
    active?: boolean;
    interactive?: boolean;
    iconWidth?: number;
  }>(),
  { interactive: false, iconWidth: 18 },
);

const emit = defineEmits<{
  activate: [];
}>();

const tooltipVisible = ref(false);
const pointerX = ref(0);
const pointerY = ref(0);
let tooltipTimer: ReturnType<typeof setTimeout> | undefined;

const tooltipStyle = computed(() => {
  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth;
  const placeLeft = viewportWidth > 0 && pointerX.value > viewportWidth / 2;
  const placeBelow = pointerY.value < 48;
  return {
    left: `${pointerX.value + (placeLeft ? -12 : 12)}px`,
    top: `${pointerY.value + (placeBelow ? 12 : -12)}px`,
    transform: `translate(${placeLeft ? '-100%' : '0'}, ${placeBelow ? '0' : '-100%'})`,
  };
});

function updateTooltipPointer(event: PointerEvent): void {
  pointerX.value = event.clientX;
  pointerY.value = event.clientY;
}

function beginTooltip(event: PointerEvent): void {
  updateTooltipPointer(event);
  clearTimeout(tooltipTimer);
  tooltipTimer = setTimeout(() => {
    tooltipVisible.value = true;
  }, 100);
}

function endTooltip(): void {
  clearTimeout(tooltipTimer);
  tooltipVisible.value = false;
}

function showTooltipForFocus(event: FocusEvent): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  pointerX.value = rect.left + rect.width / 2;
  pointerY.value = rect.top;
  clearTimeout(tooltipTimer);
  tooltipVisible.value = true;
}

onBeforeUnmount(() => clearTimeout(tooltipTimer));
</script>

<template>
  <span
    class="timeline-status-segment"
    :class="{
      'is-active': active,
      'is-interactive': interactive,
    }"
    :style="{
      left: `${left}px`,
      top: `${top}px`,
      '--timeline-status-icon-width': `${iconWidth}px`,
    }"
  >
    <span
      class="timeline-status-segment__body"
      @pointerenter="beginTooltip"
      @pointermove="updateTooltipPointer"
      @pointerleave="endTooltip"
      @click.stop
    >
      <span
        class="timeline-status-segment__icon"
        :role="interactive ? 'button' : undefined"
        :tabindex="interactive ? 0 : undefined"
        :aria-label="interactive ? title : undefined"
        @focus="showTooltipForFocus"
        @blur="endTooltip"
        @click.stop="interactive && emit('activate')"
        @keydown.enter.stop.prevent="interactive && emit('activate')"
        @keydown.space.stop.prevent="interactive && emit('activate')"
      >
        <span class="timeline-status-segment__content"><slot name="content" /></span>
        <span v-if="count !== undefined && count !== null" class="timeline-status-segment__count">
          {{ count }}
        </span>
      </span>
      <span
        v-if="width > 0"
        class="timeline-status-segment__duration"
        :style="{ width: `${width}px`, backgroundColor: durationColor }"
      >
        <span class="timeline-status-segment__stripes"></span>
      </span>
    </span>
    <Teleport to="body">
      <span
        v-if="tooltipVisible"
        class="timeline-status-pointer-tooltip"
        :style="tooltipStyle"
        role="tooltip"
      >
        {{ title }}
      </span>
    </Teleport>
  </span>
</template>

<style scoped>
.timeline-status-segment {
  position: absolute;
  display: flex;
  align-items: center;
  white-space: nowrap;
  pointer-events: none;
}

.timeline-status-segment__body {
  display: flex;
  align-items: center;
  outline: none;
  pointer-events: none;
}

.timeline-status-segment.is-interactive .timeline-status-segment__body {
  pointer-events: auto;
}

.timeline-status-segment.is-interactive .timeline-status-segment__icon {
  cursor: pointer;
}

.timeline-status-segment__icon {
  position: relative;
  z-index: 2;
  width: var(--timeline-status-icon-width);
  height: 18px;
  box-sizing: border-box;
  display: grid;
  flex: 0 0 var(--timeline-status-icon-width);
  place-items: center;
  border: 1px solid var(--ea-keycap-skill-border, #999);
  border-radius: 2px;
  background: var(--ea-keycap-skill-bg, #333);
  box-shadow: 0 1px 2px rgb(0 0 0 / 50%);
  transition:
    transform 0.12s ease,
    filter 0.12s ease,
    border-color 0.12s ease,
    box-shadow 0.12s ease;
}

.timeline-status-segment__icon:hover,
.timeline-status-segment__icon:focus-visible {
  z-index: 12;
  transform: scale(1.18);
  filter: brightness(1.18);
  border-color: rgb(255 255 255 / 95%);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 22%),
    0 4px 12px rgb(0 0 0 / 46%);
}

.timeline-status-segment__content {
  position: relative;
  width: calc(var(--timeline-status-icon-width) - 2px);
  height: 16px;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.timeline-status-segment__count {
  position: absolute;
  right: -3px;
  bottom: -3px;
  z-index: 3;
  min-width: 9px;
  box-sizing: border-box;
  padding: 0 2px;
  border-radius: 2px;
  background: rgb(19 20 22 / 92%);
  color: var(--ea-gold);
  font:
    700 8px/10px 'Roboto Mono',
    Consolas,
    monospace;
  text-align: center;
}

.timeline-status-segment__duration {
  position: relative;
  z-index: 1;
  height: 16px;
  margin-left: 2px;
  overflow: hidden;
  box-sizing: border-box;
  border-radius: 2px;
  background: #8c8c8c;
  box-shadow: 0 1px 2px rgb(0 0 0 / 50%);
  pointer-events: none;
}

.timeline-status-segment.is-active .timeline-status-segment__duration {
  background: color-mix(in srgb, var(--ea-gold) 55%, #555);
}

.timeline-status-segment__body:hover .timeline-status-segment__duration,
.timeline-status-segment__body:focus-within .timeline-status-segment__duration {
  filter: brightness(1.16) saturate(1.08);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 18%),
    0 2px 8px rgb(0 0 0 / 50%);
}

.timeline-status-segment__stripes {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    rgb(255 255 255 / 20%),
    rgb(255 255 255 / 20%) 2px,
    transparent 2px,
    transparent 6px
  );
}

:global(.timeline-status-pointer-tooltip) {
  position: fixed;
  z-index: 10000;
  max-width: min(320px, calc(100vw - 16px));
  box-sizing: border-box;
  padding: var(--ea-space-2) 10px;
  border: 1px solid var(--ea-floating-border);
  border-radius: var(--ea-control-radius);
  background: var(--ea-floating-bg);
  color: var(--ea-floating-fg);
  box-shadow: var(--ea-floating-shadow);
  font-size: var(--ea-control-font-size-sm);
  line-height: 1.4;
  white-space: normal;
  pointer-events: none;
}
</style>
