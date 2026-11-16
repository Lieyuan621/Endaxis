<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
const props = defineProps<{ text?: string }>();
const tooltipLines = computed(() => props.text?.split('\n') ?? []);
const tooltipDetails = computed(() => tooltipLines.value.slice(1).join('\n'));
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
const events = {
  pointerenter: beginTooltip,
  pointermove: updateTooltipPointer,
  pointerleave: endTooltip,
  pointerdown: endTooltip,
  focusin: showTooltipForFocus,
  focusout: endTooltip,
};
</script>
<template>
  <slot :events="events" />
  <Teleport to="body">
    <span
      v-if="text && tooltipVisible"
      class="ea-floating-surface ea-tooltip-surface timeline-status-pointer-tooltip"
      :style="tooltipStyle"
      role="tooltip"
    >
      <template v-if="tooltipDetails">
        <strong class="timeline-status-pointer-tooltip__title">{{ tooltipLines[0] }}</strong>
        <span class="timeline-status-pointer-tooltip__detail">{{ tooltipDetails }}</span>
      </template>
      <template v-else>{{ text }}</template>
    </span>
  </Teleport>
</template>
<style scoped>
:global(.timeline-status-pointer-tooltip) {
  position: fixed;
  z-index: 10000;
  max-width: min(320px, calc(100vw - 16px));
  pointer-events: none;
}

:global(.timeline-status-pointer-tooltip__title) {
  display: block;
  color: var(--ea-fg);
  font-weight: 600;
}

:global(.timeline-status-pointer-tooltip__detail) {
  display: block;
  margin-top: 2px;
  color: var(--ea-fg-secondary);
}
</style>
