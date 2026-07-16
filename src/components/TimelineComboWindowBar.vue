<script setup>
import { useTimelineStore } from '../stores/timelineStore.js';
import { formatFrameCount } from '@/utils/time';
import { useI18n } from 'vue-i18n';

defineProps({
  trackId: { type: String, required: true },
});

const store = useTimelineStore();
const { t } = useI18n({ useScope: 'global' });

function formatDuration(time) {
  if (time >= 1) return store.formatTimeLabel(time);
  return formatFrameCount(time);
}
</script>

<template>
  <div v-if="store.comboWindowLayouts?.get(trackId)?.length" class="combo-window-bar-layer">
    <div
      v-for="(cw, cwIdx) in store.comboWindowLayouts.get(trackId)"
      :key="`cw-${trackId}-${cwIdx}`"
      :class="['combo-window-bar', { 'perfect-timing-bar': cw.perfectTiming }]"
      :title="cw.perfectTiming ? t('effects.name.perfectTiming') : t('effects.name.comboWindow')"
      :style="{
        left: `${store.timeToPx(cw.start)}px`,
        width: `${store.timeToPx(cw.end) - store.timeToPx(cw.start)}px`,
        '--cw-color': cw.color,
      }"
    >
      <div class="cw-start-mark"></div>
      <div class="cw-line"></div>
      <div class="cw-end-mark"></div>
      <span class="cw-duration-text">{{ formatDuration(cw.duration) }}</span>
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
  pointer-events: auto;
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

.perfect-timing-bar .cw-line {
  position: relative;
  height: 2px;
  border-bottom: none;
  background: repeating-linear-gradient(
    90deg,
    var(--cw-color) 0,
    var(--cw-color) 4px,
    transparent 4px,
    transparent 8px
  );
  background-size: 8px 100%;
  animation: dash-flow 0.5s linear infinite;
}

@keyframes dash-flow {
  from {
    background-position-x: 0;
  }
  to {
    background-position-x: 8px;
  }
}

.perfect-timing-bar .cw-line::after {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--cw-color);
  animation: move-along-path 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes move-along-path {
  0% {
    left: 0;
  }
  100% {
    left: calc(100% - 4px);
  }
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

.cw-duration-text {
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
