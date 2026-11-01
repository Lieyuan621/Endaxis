<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
defineProps<{ text?: string }>();
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
      class="timeline-status-pointer-tooltip"
      :style="tooltipStyle"
      role="tooltip"
    >
      {{ text }}
    </span>
  </Teleport>
</template>
<style scoped>
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
  white-space: pre-line;
  pointer-events: none;
}
</style>
