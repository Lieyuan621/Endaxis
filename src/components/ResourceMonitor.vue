<script setup>
import { computed, watch, ref } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import CustomNumberInput from './CustomNumberInput.vue'

const store = useTimelineStore()
const scrollContainer = ref(null)

// === 布局常量 ===
const TOTAL_HEIGHT = 200
const STAGGER_HEIGHT = 60
const SP_HEIGHT = 140
const gridLinesCount = computed(() => Math.ceil(store.TOTAL_DURATION / 5))

// === 颜色常量 ===
const COLOR_STAGGER = '#ff7875'
const COLOR_LIMIT = '#d32f2f'
const COLOR_SP_MAIN = '#ffd700'
const COLOR_SP_WARN = '#ff4d4f'

// === 数据计算 (失衡)===
const staggerResult = computed(() => store.calculateGlobalStaggerData())
const staggerPoints = computed(() => staggerResult.value.points || [])
const lockSegments = computed(() => staggerResult.value.lockSegments || [])
const nodeSegments = computed(() => staggerResult.value.nodeSegments || [])

const BASE_Y_STAGGER = STAGGER_HEIGHT - 5
const PADDING_TOP_STAGGER = 10
const scaleY_Stagger = computed(() => {
  const max = store.systemConstants.maxStagger
  if (!max || max <= 0) return 1
  return (BASE_Y_STAGGER - PADDING_TOP_STAGGER) / max
})

const staggerPolyline = computed(() => {
  if (staggerPoints.value.length === 0) return ''
  return staggerPoints.value.map(p => {
    const x = p.time * store.timeBlockWidth
    const val = Math.min(p.val, store.systemConstants.maxStagger)
    const y = BASE_Y_STAGGER - (val * scaleY_Stagger.value)
    return `${x},${y}`
  }).join(' ')
})

const staggerArea = computed(() => {
  if (staggerPoints.value.length === 0) return ''
  const line = staggerPolyline.value
  const lastX = staggerPoints.value[staggerPoints.value.length - 1].time * store.timeBlockWidth
  return `0,${BASE_Y_STAGGER} ${line} ${lastX},${BASE_Y_STAGGER}`
})

const nodeZones = computed(() => nodeSegments.value.map(seg => ({
  x: seg.start * store.timeBlockWidth,
  width: (seg.end - seg.start) * store.timeBlockWidth,
  y: BASE_Y_STAGGER - (seg.thresholdVal * scaleY_Stagger.value)
})))

const lockZones = computed(() => lockSegments.value.map(seg => ({
  x: seg.start * store.timeBlockWidth,
  width: (seg.end - seg.start) * store.timeBlockWidth
})))


// === 数据计算 (技力) ===
const spData = computed(() => store.calculateGlobalSpData())

// 技力绘图坐标计算
const BASE_Y_SP = STAGGER_HEIGHT + SP_HEIGHT - 20
const PADDING_TOP_SP = STAGGER_HEIGHT + 2
const EFFECTIVE_HEIGHT_SP = BASE_Y_SP - PADDING_TOP_SP
const scaleY_SP = computed(() => EFFECTIVE_HEIGHT_SP / 300)

const spPolyline = computed(() => {
  if (spData.value.length === 0) return ''
  return spData.value.map(p => {
    const x = p.time * store.timeBlockWidth
    const y = BASE_Y_SP - (p.sp * scaleY_SP.value)
    return `${x},${y}`
  }).join(' ')
})

const spArea = computed(() => {
  if (spData.value.length === 0) return ''
  const points = spData.value.map(p => {
    const x = p.time * store.timeBlockWidth
    const y = BASE_Y_SP - (p.sp * scaleY_SP.value)
    return `${x},${y}`
  })
  const lastX = spData.value[spData.value.length - 1].time * store.timeBlockWidth
  return `0,${BASE_Y_SP} ${points.join(' ')} ${lastX},${BASE_Y_SP}`
})

const spWarningZones = computed(() => spData.value.filter(p => p.sp < 0).map(p => ({
  left: p.time * store.timeBlockWidth,
  sp: p.sp
})))

watch(() => store.timelineScrollLeft, (newVal) => {
  if (scrollContainer.value) scrollContainer.value.scrollLeft = newVal
}, { flush: 'sync' })

</script>

<template>
  <div class="resource-monitor-layout">

    <div class="monitor-sidebar">
      <div class="control-row">
        <label style="color: #ff7875;">失衡上限</label>
        <CustomNumberInput v-model="store.systemConstants.maxStagger" :min="1" class="standard-input" />
      </div>
      <div class="control-row">
        <label>失衡节点</label>
        <CustomNumberInput v-model="store.systemConstants.staggerNodeCount" :min="0" class="standard-input" />
      </div>
      <div class="control-row">
        <label style="color: #ff7875;">踉跄时长</label>
        <CustomNumberInput v-model="store.systemConstants.staggerNodeDuration" :step="0.1" class="standard-input" />
      </div>
      <div class="control-row">
        <label style="color: #ff7875;">失衡时长</label>
        <CustomNumberInput v-model="store.systemConstants.staggerBreakDuration" :step="0.5" class="standard-input" />
      </div>
      <div class="control-row">
        <label style="color: #ffd700;">初始技力</label>
        <CustomNumberInput v-model="store.systemConstants.initialSp" :min="0" :max="300" class="standard-input" />
      </div>
      <div class="control-row">
        <label style="color: #ffd700;">回复/秒</label>
        <CustomNumberInput v-model="store.systemConstants.spRegenRate" :step="0.5" :min="0" class="standard-input" />
      </div>
    </div>

    <div class="chart-scroll-wrapper" ref="scrollContainer">
      <svg class="chart-svg" :height="TOTAL_HEIGHT" :width="store.TOTAL_DURATION * store.timeBlockWidth">

        <defs>
          <linearGradient id="stagger-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="COLOR_STAGGER" stop-opacity="0.5"/>
            <stop offset="100%" :stop-color="COLOR_STAGGER" stop-opacity="0.1"/>
          </linearGradient>
          <linearGradient id="sp-fill-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="COLOR_SP_MAIN" stop-opacity="0.3"/>
            <stop offset="100%" :stop-color="COLOR_SP_MAIN" stop-opacity="0.05"/>
          </linearGradient>

          <pattern id="stun-pattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="10" height="10" fill="#ff9c6e" fill-opacity="0.1"/>
            <rect width="2" height="10" transform="translate(0,0)" fill="#ffd591" fill-opacity="0.6"></rect>
          </pattern>

          <pattern id="node-stripe-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#fa8c16" fill-opacity="0.05"/>
            <rect width="2" height="8" transform="translate(0,0)" fill="#fa8c16" fill-opacity="0.5"></rect>
          </pattern>
        </defs>

        <line v-for="i in gridLinesCount" :key="`grid-${i}`"
              :x1="i * 5 * store.timeBlockWidth" y1="0"
              :x2="i * 5 * store.timeBlockWidth" :y2="TOTAL_HEIGHT"
              stroke="#333" stroke-width="1" stroke-dasharray="2"/>

        <g class="layer-stagger">
          <line x1="0" :y1="PADDING_TOP_STAGGER" :x2="store.TOTAL_DURATION * store.timeBlockWidth" :y2="PADDING_TOP_STAGGER"
                :stroke="COLOR_LIMIT" stroke-width="1" stroke-dasharray="4"/>
          <line x1="0" :y1="BASE_Y_STAGGER" :x2="store.TOTAL_DURATION * store.timeBlockWidth" :y2="BASE_Y_STAGGER"
                :stroke="COLOR_LIMIT" stroke-width="1" stroke-dasharray="4" opacity="0.6"/>

          <g v-for="(zone, i) in nodeZones" :key="`node-${i}`">
            <rect :x="zone.x" :y="PADDING_TOP_STAGGER" :width="zone.width" :height="BASE_Y_STAGGER - PADDING_TOP_STAGGER"
                  fill="url(#node-stripe-pattern)" class="node-bar-anim" />
          </g>

          <g v-for="(zone, i) in lockZones" :key="`lock-${i}`">
            <rect :x="zone.x" :y="PADDING_TOP_STAGGER" :width="zone.width" :height="BASE_Y_STAGGER - PADDING_TOP_STAGGER" fill="url(#stun-pattern)" class="stun-bg-anim" />
            <text :x="zone.x + zone.width / 2" :y="(BASE_Y_STAGGER + PADDING_TOP_STAGGER) / 2 + 4" fill="#fff" font-size="12" font-weight="900" text-anchor="middle" style="text-shadow: 0 0 2px #ff7a45; letter-spacing: 1px;">WEAK</text>
          </g>

          <polygon :points="staggerArea" fill="url(#stagger-grad)"/>
          <polyline :points="staggerPolyline" fill="none" :stroke="COLOR_STAGGER" stroke-width="2"/>
          <circle v-for="(p, idx) in staggerPoints" :key="idx" :cx="p.time * store.timeBlockWidth"
                  :cy="BASE_Y_STAGGER - (Math.min(p.val, store.systemConstants.maxStagger) * scaleY_Stagger)" r="2" :fill="COLOR_STAGGER"/>
        </g>

        <line x1="0" :y1="STAGGER_HEIGHT" :x2="store.TOTAL_DURATION * store.timeBlockWidth" :y2="STAGGER_HEIGHT" stroke="#444" stroke-width="2"/>

        <g class="layer-sp">
          <line x1="0" :y1="BASE_Y_SP - (300 * scaleY_SP)" :x2="store.TOTAL_DURATION * store.timeBlockWidth" :y2="BASE_Y_SP - (300 * scaleY_SP)" stroke="#444" stroke-width="1" stroke-dasharray="2"/>
          <line x1="0" :y1="BASE_Y_SP - (200 * scaleY_SP)" :x2="store.TOTAL_DURATION * store.timeBlockWidth" :y2="BASE_Y_SP - (200 * scaleY_SP)" stroke="#444" stroke-width="1" stroke-dasharray="2"/>
          <line x1="0" :y1="BASE_Y_SP - (100 * scaleY_SP)" :x2="store.TOTAL_DURATION * store.timeBlockWidth" :y2="BASE_Y_SP - (100 * scaleY_SP)" stroke="#444" stroke-width="1" stroke-dasharray="2"/>
          <line x1="0" :y1="BASE_Y_SP" :x2="store.TOTAL_DURATION * store.timeBlockWidth" :y2="BASE_Y_SP" stroke="#aaa" stroke-width="2"/>

          <text x="5" :y="BASE_Y_SP - (300 * scaleY_SP) + 12" fill="#888" font-size="10">MAX(300)</text>
          <text x="5" :y="BASE_Y_SP + 12" fill="#666" font-size="10">0</text>

          <rect x="0" :y="BASE_Y_SP" :width="store.TOTAL_DURATION * store.timeBlockWidth" :height="TOTAL_HEIGHT - BASE_Y_SP" :fill="`${COLOR_SP_WARN}26`"/>
          <polygon :points="spArea" fill="url(#sp-fill-gradient)"/>
          <polyline :points="spPolyline" fill="none" :stroke="COLOR_SP_MAIN" stroke-width="2" stroke-linejoin="round"/>

          <circle v-for="(p, idx) in spData" :key="idx" :cx="p.time * store.timeBlockWidth" :cy="BASE_Y_SP - (p.sp * scaleY_SP)" r="2" :fill="p.sp < 0 ? COLOR_SP_WARN : COLOR_SP_MAIN" />
        </g>

      </svg>

      <div v-for="(w, idx) in spWarningZones" :key="idx" class="warning-tag"
           :style="{ left: w.left + 'px', top: (BASE_Y_SP + 5) + 'px', color: COLOR_SP_WARN }">
        ⚠️不足
      </div>
    </div>
  </div>
</template>

<style scoped>
.resource-monitor-layout {
  display: grid;
  grid-template-columns: 180px 1fr;
  width: 100%;
  height: 100%;
  background: #222;
  border-top: 1px solid #444;
  box-sizing: border-box;
  font-family: sans-serif;
}

.monitor-sidebar {
  background-color: #2a2a2a;
  border-right: 1px solid #444;
  padding: 6px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  overflow: hidden;
}

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.control-row label {
  font-size: 12px;
  color: #ccc;
  white-space: nowrap;
}

:deep(.standard-input) {
  width: 80px !important;
  height: 28px !important;
  font-size: 12px !important;
  flex-shrink: 0;
}

.chart-scroll-wrapper { overflow: hidden; position: relative; background: #252525; }
.warning-tag { position: absolute; font-size: 10px; background: rgba(0,0,0,0.8); padding: 2px 4px; border-radius: 4px; transform: translateX(-50%); pointer-events: none; z-index: 5; }

.stun-bg-anim { animation: stun-flash 1.5s infinite alternate; }
@keyframes stun-flash { 0% { fill-opacity: 0.6; } 100% { fill-opacity: 1; } }
.node-bar-anim { animation: node-pulse 1s infinite alternate; }
@keyframes node-pulse { 0% { opacity: 0.6; } 100% { opacity: 1; } }
</style>