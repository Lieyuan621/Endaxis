<script setup>
import { computed, watch, ref } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'

const store = useTimelineStore()
const scrollContainer = ref(null)

const SVG_HEIGHT = 60
const PADDING_TOP = 10
const BASE_Y = SVG_HEIGHT - 5
const COLOR_STAGGER = '#ff7875'
const COLOR_LIMIT = '#d32f2f'

const gridLinesCount = computed(() => Math.ceil(store.TOTAL_DURATION / 5))

const calculationResult = computed(() => store.calculateGlobalStaggerData())
const chartData = computed(() => calculationResult.value.points || [])
const lockSegments = computed(() => calculationResult.value.lockSegments || [])

const maxVal = computed({
  get: () => store.systemConstants.maxStagger,
  set: (val) => store.systemConstants.maxStagger = val
})

const scaleY = computed(() => (BASE_Y - PADDING_TOP) / maxVal.value)

const lockZones = computed(() => {
  return lockSegments.value.map(seg => ({
    x: seg.start * store.timeBlockWidth,
    width: (seg.end - seg.start) * store.timeBlockWidth
  }))
})

const polylinePoints = computed(() => {
  if (chartData.value.length === 0) return ''
  return chartData.value.map(p => {
    const x = p.time * store.timeBlockWidth
    const val = Math.min(p.val, maxVal.value)
    const y = BASE_Y - (val * scaleY.value)
    return `${x},${y}`
  }).join(' ')
})

const areaPoints = computed(() => {
  if (chartData.value.length === 0) return ''
  const line = polylinePoints.value
  const lastX = chartData.value[chartData.value.length - 1].time * store.timeBlockWidth
  return `0,${BASE_Y} ${line} ${lastX},${BASE_Y}`
})

const fullSegments = computed(() => {
  const segments = []
  const data = chartData.value
  const limit = maxVal.value
  for (let i = 0; i < data.length - 1; i++) {
    const p1 = data[i]; const p2 = data[i+1]
    if (p1.val >= limit - 0.01 && p2.val >= limit - 0.01) {
      segments.push({ x1: p1.time * store.timeBlockWidth, x2: p2.time * store.timeBlockWidth })
    }
  }
  return segments
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
  <div class="stagger-monitor-layout">
    <div class="monitor-sidebar">
      <div class="sidebar-header"><span class="title-text">失衡积累</span></div>
      <div class="input-row"><label>上限</label><input type="number" v-model.number="maxVal" class="limit-input"></div>
    </div>

    <div class="chart-scroll-wrapper" ref="scrollContainer">
      <svg class="chart-svg" :height="SVG_HEIGHT" :width="store.TOTAL_DURATION * store.timeBlockWidth">
        <defs>
          <linearGradient id="stagger-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="COLOR_STAGGER" stop-opacity="0.5"/>
            <stop offset="100%" :stop-color="COLOR_STAGGER" stop-opacity="0.1"/>
          </linearGradient>

          <pattern id="stun-pattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="10" height="10" fill="#ff9c6e" fill-opacity="0.1"/>
            <rect width="2" height="10" transform="translate(0,0)" fill="#ffd591" fill-opacity="0.6"></rect>
          </pattern>

        </defs>

        <line v-for="i in gridLinesCount" :key="`grid-${i}`"
              :x1="i * 5 * store.timeBlockWidth" y1="0"
              :x2="i * 5 * store.timeBlockWidth" :y2="SVG_HEIGHT"
              stroke="#333" stroke-width="1" stroke-dasharray="2"/>
        <line x1="0" :y1="PADDING_TOP" :x2="store.TOTAL_DURATION * store.timeBlockWidth" :y2="PADDING_TOP"
              :stroke="COLOR_LIMIT" stroke-width="1" stroke-dasharray="4"/>
        <line x1="0" :y1="BASE_Y"
              :x2="store.TOTAL_DURATION * store.timeBlockWidth" :y2="BASE_Y"
              :stroke="COLOR_LIMIT" stroke-width="1" stroke-dasharray="4" opacity="0.6"/>
        <g v-for="(zone, i) in lockZones" :key="`lock-${i}`">
          <rect :x="zone.x" :y="PADDING_TOP" :width="zone.width" :height="BASE_Y - PADDING_TOP"
                fill="url(#stun-pattern)"
                class="stun-bg-anim" />

          <text :x="zone.x + zone.width / 2" :y="(BASE_Y + PADDING_TOP) / 2 + 4"
                fill="#fff" font-size="12" font-weight="900" text-anchor="middle"
                style="text-shadow: 0 0 2px #ff7a45; letter-spacing: 1px;">
            ⚠️ WEAK ⚠️
          </text>
        </g>

        <polygon :points="areaPoints" fill="url(#stagger-grad)"/>
        <polyline :points="polylinePoints" fill="none" :stroke="COLOR_STAGGER" stroke-width="2"/>

        <circle v-for="(p, idx) in chartData" :key="idx" :cx="p.time * store.timeBlockWidth" :cy="BASE_Y - (Math.min(p.val, maxVal) * scaleY)" r="2" :fill="COLOR_STAGGER"/>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.stagger-monitor-layout { display: grid; grid-template-columns: 180px 1fr; width: 100%; height: 100%; background: #222; border-top: 1px solid #444; box-sizing: border-box; }
.monitor-sidebar { background-color: #2a2a2a; border-right: 1px solid #444; padding: 0 15px; display: flex; align-items: center; justify-content: space-between; color: #ccc; font-size: 12px; }
.title-text { font-weight: bold; color: #ff7875; }
.input-row { display: flex; align-items: center; gap: 5px; }
.limit-input { width: 50px; background: #333; border: 1px solid #555; color: #fff; border-radius: 4px; padding: 2px 5px; font-size: 12px; }
.chart-scroll-wrapper { overflow: hidden; position: relative; background: #252525; }
@keyframes stagger-pulse {  0% { stroke-opacity: 0.6; stroke-width: 3; }  100% { stroke-opacity: 1; stroke-width: 5; } /* 只改变透明度和宽度，不加阴影 */ }
.stun-bg-anim { animation: stun-flash 1.5s infinite alternate; }
@keyframes stun-flash {  0% { fill-opacity: 0.6; }  100% { fill-opacity: 1; }  }
</style>