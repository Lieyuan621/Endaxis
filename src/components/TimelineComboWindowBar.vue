<script setup>
import { useTimelineStore } from '../stores/timelineStore.js'
import { formatFrameCount } from '@/utils/time.js'

defineProps({
  trackId: { type: String, required: true },
})

const store = useTimelineStore()

function formatDuration(time) {
  if (time >= 1) return store.formatTimeLabel(time)
  return formatFrameCount(time)
}
</script>

<template>
  <div
    v-if="store.comboWindowLayouts?.get(trackId)?.length"
    class="combo-window-bar-layer"
  >
    <div
      v-for="(cw, cwIdx) in store.comboWindowLayouts.get(trackId)"
      :key="`cw-${trackId}-${cwIdx}`"
      class="combo-window-bar"
      :style="{
        left: `${store.timeToPx(cw.start)}px`,
        width: `${store.timeToPx(cw.end) - store.timeToPx(cw.start)}px`,
        '--cw-color': cw.color,
      }"
    >
      <div class="cw-start-mark"></div>
      <div class="cw-line"></div>
      <div class="cw-end-mark"></div>
      <span class="cw-duration">{{ formatDuration(cw.duration) }}</span>
    </div>
  </div>
</template>

<style scoped>
.combo-window-bar-layer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0;
  pointer-events: none;
  z-index: 10;
}

.combo-window-bar {
  position: absolute;
  bottom: 0;
  height: 2px;
  display: flex;
  align-items: center;
  transform: translateY(7px);
  pointer-events: none;
}

.cw-start-mark {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 8px;
  background-color: var(--cw-color);
}

.cw-line {
  flex-grow: 1;
  height: 0;
  border-bottom: 2px dashed var(--cw-color);
}

.cw-end-mark {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 8px;
  background-color: var(--cw-color);
}

.cw-duration {
  position: absolute;
  left: 0;
  top: 4px;
  font-size: 10px;
  font-weight: bold;
  line-height: 1;
  color: var(--cw-color);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
}
</style>
