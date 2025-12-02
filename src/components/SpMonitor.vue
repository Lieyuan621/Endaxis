<script setup>
import { computed, watch, ref } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import CustomNumberInput from './CustomNumberInput.vue'

const store = useTimelineStore()
const scrollContainer = ref(null)

// === 常量与颜色 ===
const MAX_SP = 300
const SVG_HEIGHT = 140
const PADDING_TOP = 2
const PADDING_BOTTOM = 20
const BASE_Y = SVG_HEIGHT - PADDING_BOTTOM
const EFFECTIVE_HEIGHT = BASE_Y - PADDING_TOP
const SCALE_Y = EFFECTIVE_HEIGHT / MAX_SP

// 引用全局色
const COLOR_SP_MAIN = store.ELEMENT_COLORS['emag'] || '#ffd700'
const COLOR_WARNING = store.ELEMENT_COLORS['blaze'] || '#ff4d4f'

const gridLinesCount = computed(() => Math.ceil(store.TOTAL_DURATION / 5))
const spData = computed(() => store.calculateGlobalSpData())

/**
 * 折线路径数据
 */
const polylinePoints = computed(() => {
  if (spData.value.length === 0) return ''
  return spData.value.map(p => {
    const x = p.time * store.timeBlockWidth
    let y = BASE_Y - (p.sp * SCALE_Y)
    return `${x},${y}`
  }).join(' ')
})

/**
 * 区域填充路径数据
 */
const areaPoints = computed(() => {
  if (spData.value.length === 0) return ''
  const points = spData.value.map(p => {
    const x = p.time * store.timeBlockWidth
    let y = BASE_Y - (p.sp * SCALE_Y)
    return `${x},${y}`
  })
  const lastX = spData.value[spData.value.length - 1].time * store.timeBlockWidth
  return `0,${BASE_Y} ${points.join(' ')} ${lastX},${BASE_Y}`
})

const warningZones = computed(() => {
  return spData.value.filter(p => p.sp < 0).map(p => ({
    left: p.time * store.timeBlockWidth,
    sp: p.sp
  }))
})

watch(
    () => store.timelineScrollLeft,
    (newVal) => {
      if (scrollContainer.value) {
        scrollContainer.value.scrollLeft = newVal
      }
    },
    { flush: 'sync' }
)
</script>

<template>
  <div class="sp-monitor-layout">

    <div class="monitor-sidebar">
      <div class="info-group">
        <div class="info-title">技力趋势模拟</div>

        <div class="input-row">
          <label>初始</label>
          <CustomNumberInput
              v-model="store.systemConstants.initialSp"
              :min="0"
              :max="300"
              max-width="65px"
          />
        </div>

        <div class="info-detail">回复: {{ store.systemConstants.spRegenRate }}/s</div>
      </div>

      <div class="legend-group">
        <div class="legend-item"><span class="dot sp-dot" :style="{background: COLOR_SP_MAIN}"></span>全队共享</div>
        <div class="legend-item"><span class="line-mark max-mark"></span>上限({{ store.systemConstants.maxSp }})</div>
      </div>
    </div>

    <div class="chart-scroll-wrapper" ref="scrollContainer">
      <svg class="sp-chart-svg" :height="SVG_HEIGHT" :width="store.TOTAL_DURATION * store.timeBlockWidth">

        <defs>
          <linearGradient id="sp-fill-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="COLOR_SP_MAIN" stop-opacity="0.3"/>
            <stop offset="100%" :stop-color="COLOR_SP_MAIN" stop-opacity="0.05"/>
          </linearGradient>
        </defs>

        <line v-for="i in gridLinesCount" :key="`grid-${i}`"
              :x1="i * 5 * store.timeBlockWidth" y1="0"
              :x2="i * 5 * store.timeBlockWidth" :y2="SVG_HEIGHT"
              stroke="#333" stroke-width="1" stroke-dasharray="2"/>

        <line x1="0" :y1="PADDING_TOP" :x2="store.TOTAL_DURATION * store.timeBlockWidth" :y2="PADDING_TOP"
              stroke="#666" stroke-width="1" stroke-dasharray="4"/>
        <text x="5" :y="PADDING_TOP + 10" fill="#888" font-size="10">MAX (300)</text>

        <line x1="0" :y1="BASE_Y - (200 * SCALE_Y)" :x2="store.TOTAL_DURATION * store.timeBlockWidth"
              :y2="BASE_Y - (200 * SCALE_Y)"
              stroke="#444" stroke-width="1" stroke-dasharray="2"/>
        <line x1="0" :y1="BASE_Y - (100 * SCALE_Y)" :x2="store.TOTAL_DURATION * store.timeBlockWidth"
              :y2="BASE_Y - (100 * SCALE_Y)"
              stroke="#444" stroke-width="1" stroke-dasharray="2"/>

        <line x1="0" :y1="BASE_Y" :x2="store.TOTAL_DURATION * store.timeBlockWidth" :y2="BASE_Y"
              stroke="#aaa" stroke-width="2"/>
        <text x="5" :y="BASE_Y + 12" fill="#666" font-size="10">0</text>

        <rect x="0" :y="BASE_Y" :width="store.TOTAL_DURATION * store.timeBlockWidth" :height="SVG_HEIGHT - BASE_Y"
              :fill="`${COLOR_WARNING}26`"/>

        <polygon :points="areaPoints" fill="url(#sp-fill-gradient)"/>

        <polyline
            :points="polylinePoints"
            fill="none"
            :stroke="COLOR_SP_MAIN"
            stroke-width="2"
            stroke-linejoin="round"
        />

        <circle
            v-for="(p, idx) in spData"
            :key="idx"
            :cx="p.time * store.timeBlockWidth"
            :cy="BASE_Y - (p.sp * SCALE_Y)"
            r="3"
            :fill="p.sp < 0 ? COLOR_WARNING : COLOR_SP_MAIN"
            stroke="#000" stroke-width="1"
        />
      </svg>

      <div v-for="(w, idx) in warningZones" :key="idx" class="warning-tag"
           :style="{ left: w.left + 'px', top: (BASE_Y + 5) + 'px', color: COLOR_WARNING }">
        ⚠️不足
      </div>
    </div>
  </div>
</template>

<style scoped>
.sp-monitor-layout {
  display: grid;
  grid-template-columns: 180px 1fr;
  width: 100%;
  height: 100%;
  background: #222;
  border-top: 1px solid #444;
}

.monitor-sidebar {
  background-color: #252525; /* 与 StaggerMonitor 一致 */
  border-right: 1px solid #444;
  padding: 0 15px; /* 上下 padding 由 grid 居中控制 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  color: #ccc;
  font-size: 12px;
}

.info-title {
  font-weight: bold;
  color: #f0f0f0;
  margin-bottom: 8px;
  font-size: 13px;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.input-row label { 
  white-space: nowrap; 
  text-overflow: ellipsis; 
}

.info-detail {
  color: #999;
  margin-top: 2px;
  font-size: 11px;
}

.legend-group {
  margin-top: 8px;
  border-top: 1px dashed #444;
  padding-top: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.line-mark {
  width: 12px;
  height: 2px;
  background: #666;
}

.chart-scroll-wrapper {
  position: relative;
  overflow: hidden;
  background: #282828;
}

.sp-chart-svg {
  display: block;
}

.warning-tag {
  position: absolute;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 2px 4px;
  border-radius: 4px;
  transform: translateX(-50%);
  white-space: nowrap;
  pointer-events: none;
  z-index: 5;
}
</style>