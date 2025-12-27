<script setup>
import { computed } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'

const props = defineProps({
  trackId: { type: String, required: false }
})

const store = useTimelineStore()

// ===================================================================================
// 布局常量
// ===================================================================================
const ROW_HEIGHT = 50
const CHART_HEIGHT = 50    // 高度占满轨道
const BASE_Y = 50          // 基准线沉底

// ===================================================================================
// 颜色与渐变
// ===================================================================================

// 获取当前轨道干员的元素属性颜色
const themeColor = computed(() => {
  if (!props.trackId) return '#00e5ff' // 默认青色
  return store.getCharacterElementColor(props.trackId)
})

// 生成唯一的渐变 ID，防止轨道间样式冲突
const gradientId = computed(() => `gauge-grad-${props.trackId}`)

// ===================================================================================
// 数据计算
// ===================================================================================

// 获取原始充能数据点序列
const gaugePoints = computed(() => {
  if (!props.trackId) return []
  return store.calculateGaugeData(props.trackId)
})

const pathData = computed(() => {
  if (gaugePoints.value.length === 0) return ''
  return gaugePoints.value.map(p => {
    const x = p.time * store.timeBlockWidth
    const ratio = Math.min(p.ratio, 1.0) // 限制最大值为 1.0
    const y = BASE_Y - (ratio * CHART_HEIGHT)
    return `${x},${y}`
  }).join(' ')
})

const areaData = computed(() => {
  if (gaugePoints.value.length === 0) return ''
  const pointsStr = pathData.value
  const lastPoint = gaugePoints.value[gaugePoints.value.length - 1]
  const lastX = lastPoint ? lastPoint.time * store.timeBlockWidth : 0

  // 闭合路径逻辑
  return `0,${BASE_Y} ${pointsStr} ${lastX},${BASE_Y}`
})

const fullSegments = computed(() => {
  const segments = []
  const points = gaugePoints.value
  const currentBlockWidth = store.timeBlockWidth

  for (let i = 0; i < points.length - 1; i++) {
    // 判定连续两点均为满能量状态
    if (points[i].ratio >= 1 && points[i + 1].ratio >= 1) {
      const x1 = points[i].time * currentBlockWidth
      const x2 = points[i + 1].time * currentBlockWidth
      if (x2 > x1) segments.push({x1, x2})
    }
  }
  return segments
})
</script>

<template>
  <div class="gauge-overlay">
    <svg class="gauge-svg" :height="ROW_HEIGHT" :width="store.TOTAL_DURATION * store.timeBlockWidth">

      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="themeColor" stop-opacity="0.2" />
          <stop offset="100%" :stop-color="themeColor" stop-opacity="0" />
        </linearGradient>

        <filter :id="`glow-${trackId}`" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <polyline
          :points="pathData"
          fill="none"
          :stroke="themeColor"
          stroke-width="1"
          stroke-opacity="0.4"
          stroke-linejoin="round"
          stroke-linecap="round"
          class="no-events"
      />

      <line
          v-for="(seg, i) in fullSegments"
          :key="i"
          :x1="seg.x1" :y1="1"
          :x2="seg.x2" :y2="1"
          class="full-gauge-line no-events"
          :stroke="themeColor"
          :filter="`url(#glow-${trackId})`"
      />
    </svg>
  </div>
</template>

<style scoped>
.gauge-overlay {
  position: absolute;
  top: -2px;
  bottom: -2px;
  left: 0;
  right: 0;
  width: 100%;
  height: auto;
  pointer-events: none;
  z-index: 1;
  overflow: visible;
}

.no-events { pointer-events: none !important; }

.full-gauge-line {
  stroke-width: 2;
  stroke-linecap: round;
  animation: pulse-glow 2s ease-in-out infinite alternate;
  transform: translateY(1px);
}

@keyframes pulse-glow {
  0% {
    stroke-opacity: 0.85;
    filter: drop-shadow(0 0 1px currentColor);
  }
  100% {
    stroke-opacity: 1;
    filter: drop-shadow(0 0 6px currentColor);
  }
}
</style>