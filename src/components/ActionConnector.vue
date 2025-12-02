<script setup>
import { computed } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { ElMessage } from 'element-plus'

const props = defineProps({
  connection: { type: Object, required: true },
  containerRef: { type: Object, required: false },
  renderKey: { type: Number }
})

const store = useTimelineStore()
const gradientId = computed(() => `grad-${props.connection.id}`)
const isSelected = computed(() => store.selectedConnectionId === props.connection.id)

function onRightClick() {
  store.removeConnection(props.connection.id)
  ElMessage.success({ message: '已删除 1 条连线', duration: 1000 })
}
function onSelectClick(evt) {
  evt.stopPropagation()
  store.selectConnection(props.connection.id)
}
const resolveRealIndex = (action, storedIndex, effectId) => {
  if (!action) return storedIndex
  if (effectId) {
    const freshIndex = store.findEffectIndexById(action, effectId)
    if (freshIndex !== -1) return freshIndex
  }
  return storedIndex
}

const getTrackCenterY = (trackIndex) => {
  const rowEl = document.getElementById(`track-row-${trackIndex}`)
  if (rowEl) return rowEl.offsetTop + (rowEl.offsetHeight / 2)
  return 20 + trackIndex * 80
}
const resolveColor = (info, effectIndex, effectId) => {
  if (!info || !info.action) return store.getColor('default')
  const { action, trackIndex } = info
  const realIdx = resolveRealIndex(action, effectIndex, effectId)
  if (realIdx !== undefined && realIdx !== null) {
    const raw = action.physicalAnomaly || []
    if (raw.length === 0) return store.getColor('default')
    const flatList = Array.isArray(raw[0]) ? raw.flat() : raw
    const effect = flatList[realIdx]
    if (effect && effect.type) return store.getColor(effect.type)
    return store.getColor('default')
  }
  if (action.type === 'link') return store.getColor('link')
  if (action.type === 'execution') return store.getColor('execution')
  if (action.type === 'attack') return store.getColor('physical')
  if (action.element) return store.getColor(action.element)
  if (trackIndex !== undefined && trackIndex !== null) {
    const track = store.tracks[trackIndex]
    if (track && track.id) return store.getCharacterElementColor(track.id)
  }
  return store.getColor(action.type)
}

const getDomPosition = (elementId, containerEl, isSource) => {
  const el = document.getElementById(elementId)
  if (!el || !containerEl) return null
  const rect = el.getBoundingClientRect()
  const containerRect = containerEl.getBoundingClientRect()
  const offsetX = isSource ? rect.right : rect.left
  const x = (offsetX - containerRect.left) + containerEl.scrollLeft
  const y = (rect.top - containerRect.top) + (rect.height / 2) + containerEl.scrollTop
  return { x, y }
}
const getEffectIconPosition = (instanceId, effectIndex, containerEl) => { /* ...保持不变... */
  const domId = `anomaly-${instanceId}-${effectIndex}`
  const el = document.getElementById(domId)
  if (!el || !containerEl) return null
  const rect = el.getBoundingClientRect()
  const containerRect = containerEl.getBoundingClientRect()
  const scrollLeft = containerEl.scrollLeft
  const scrollTop = containerEl.scrollTop
  const relativeLeft = (rect.left - containerRect.left) + scrollLeft
  const relativeTop = (rect.top - containerRect.top) + scrollTop
  return { left: relativeLeft, right: relativeLeft + rect.width, centerY: relativeTop + (rect.height / 2) }
}
const getTriggerDotPosition = (instanceId, containerEl) => { /* ...保持不变... */
  const actionEl = document.getElementById(`action-${instanceId}`)
  if (!actionEl) return null
  const dotEl = actionEl.querySelector('.tw-dot')
  if (!dotEl) return null
  const rect = dotEl.getBoundingClientRect()
  const containerRect = containerEl.getBoundingClientRect()
  const x = (rect.left - containerRect.left) + (rect.width / 2) + containerEl.scrollLeft
  const y = (rect.top - containerRect.top) + (rect.height / 2) + containerEl.scrollTop
  return { x, y }
}

// ===================================================================================
// 主计算函数
// ===================================================================================

const calculatePoint = (nodeId, effectIndex, isSource, connection = null) => {
  const info = store.getActionPositionInfo(nodeId)
  if (!info) return null

  let realEffectIndex = effectIndex
  if (connection) {
    const targetId = isSource ? connection.fromEffectId : connection.toEffectId
    realEffectIndex = resolveRealIndex(info.action, effectIndex, targetId)
  }

  // -----------------------------------------------------------
  // 情况 A: 消耗连线
  // -----------------------------------------------------------
  if (isSource && connection && connection.isConsumption) {
    let finalX = null
    let finalY = null

    const targetInfo = store.getActionPositionInfo(connection.to)
    if (targetInfo) {
      const offset = connection.consumptionOffset || 0
      finalX = (targetInfo.action.startTime - offset) * store.timeBlockWidth
    }

    let rowIndex = -1
    if (realEffectIndex !== null && realEffectIndex !== undefined) {
      let current = 0
      const rows = info.action.physicalAnomaly || []
      for(let r=0; r<rows.length; r++){
        if(realEffectIndex < current + rows[r].length) { rowIndex = r; break; }
        current += rows[r].length
      }
    }

    if (rowIndex !== -1) {
      finalY = getTrackCenterY(info.trackIndex) - 33 - (rowIndex * 25)
    }

    if (finalX !== null) {
      if (finalY === null) finalY = getTrackCenterY(info.trackIndex)
      return { x: finalX, y: finalY }
    }
  }

  // -----------------------------------------------------------
  // 情况 B: 连线端点是具体的 Effect 图标 (回退到 DOM，因为图标中心很难算)
  // -----------------------------------------------------------
  if (realEffectIndex !== undefined && realEffectIndex !== null) {
    const iconPos = getEffectIconPosition(nodeId, realEffectIndex, props.containerRef)
    if (iconPos) {
      const y = iconPos.centerY
      if (isSource) return { x: iconPos.right, y }
      else return { x: iconPos.left, y }
    }
    // 兜底
    const domId = `anomaly-${nodeId}-${realEffectIndex}`
    const pos = getDomPosition(domId, props.containerRef, isSource)
    if (pos) return { x: pos.x, y: pos.y }
  }

  // -----------------------------------------------------------
  // 情况 C: 连向动作本体
  // -----------------------------------------------------------
  if (!isSource && info.action.triggerWindow && info.action.triggerWindow !== 0) {
    const dotPos = getTriggerDotPosition(nodeId, props.containerRef)
    if (dotPos) return { x: dotPos.x, y: dotPos.y }
  }

  let timePoint = 0
  if (isSource) {
    timePoint = info.action.startTime + info.action.duration
  } else {
    const window = info.action.triggerWindow || 0
    timePoint = info.action.startTime - Math.abs(window)
  }
  const x = timePoint * store.timeBlockWidth
  let y = getTrackCenterY(info.trackIndex)

  // Spread logic
  const tw = info.action.triggerWindow;
  if (!isSource && realEffectIndex == null && (tw === undefined || tw <= 0)) {
    const incoming = store.getIncomingConnections(nodeId)
    const generalIncoming = incoming.filter(c => c.toEffectIndex == null)
    generalIncoming.sort((a, b) => { /* ...排序逻辑不变... */
      const infoA = store.getActionPositionInfo(a.from); const infoB = store.getActionPositionInfo(b.from);
      if (!infoA || !infoB) return 0;
      if (infoA.trackIndex !== infoB.trackIndex) return infoA.trackIndex - infoB.trackIndex;
      if (infoA.action.startTime !== infoB.action.startTime) return infoA.action.startTime - infoB.action.startTime;
      return a.id.localeCompare(b.id);
    })
    const myIndex = generalIncoming.findIndex(c => c.id === props.connection.id)
    if (myIndex !== -1 && generalIncoming.length > 1) {
      y += (myIndex - (generalIncoming.length - 1) / 2) * 6
    }
  }
  return { x, y }
}

const pathInfo = computed(() => {
  const _trigger = props.renderKey
  const conn = props.connection
  const fromInfo = store.getActionPositionInfo(conn.from)
  const toInfo = store.getActionPositionInfo(conn.to)
  if (!fromInfo || !toInfo) return null
  const start = calculatePoint(conn.from, conn.fromEffectIndex, true, conn)
  const end = calculatePoint(conn.to, conn.toEffectIndex, false, conn)
  if (!start || !end) return null
  const colorStart = resolveColor(fromInfo, conn.fromEffectIndex, conn.fromEffectId)
  const colorEnd = resolveColor(toInfo, conn.toEffectIndex, conn.toEffectId)
  const dx = Math.abs(end.x - start.x)
  const controlDist = Math.max(50, Math.min(dx * 0.6, 200))
  const d = `M ${start.x} ${start.y} C ${start.x + controlDist} ${start.y}, ${end.x - controlDist} ${end.y}, ${end.x} ${end.y}`
  return { d, startPoint: { x: start.x, y: start.y }, endPoint: { x: end.x, y: end.y }, colors: { start: colorStart, end: colorEnd } }
})
</script>

<template>
  <g v-if="pathInfo" class="connector-group" :class="{ 'is-selected': isSelected }" @click="onSelectClick" @contextmenu.prevent="onRightClick">
    <defs>
      <linearGradient :id="gradientId" gradientUnits="userSpaceOnUse" :x1="pathInfo.startPoint.x" :y1="pathInfo.startPoint.y" :x2="pathInfo.endPoint.x" :y2="pathInfo.endPoint.y">
        <stop offset="0%" :stop-color="pathInfo.colors.start" stop-opacity="0.8"/>
        <stop offset="100%" :stop-color="pathInfo.colors.end" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <path :d="pathInfo.d" fill="none" :stroke="pathInfo.colors.end" stroke-width="12" class="hover-zone"><title>左键选中+Delete / 右键 删除</title></path>
    <path :d="pathInfo.d" fill="none" :stroke="isSelected ? '#ffffff' : `url(#${gradientId})`" stroke-width="2" stroke-linecap="round" class="main-path"/>
    <circle r="2">
      <animateMotion :path="pathInfo.d" dur="1.5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1"/>
      <animate attributeName="fill" :values="`${pathInfo.colors.start};${pathInfo.colors.end}`" dur="1.5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1"/>
    </circle>
  </g>
</template>

<style scoped>
.connector-group { cursor: pointer; }
.connector-group.is-selected .main-path { stroke-width: 3; filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9)); z-index: 999; }
.hover-zone { pointer-events: stroke; transition: stroke-opacity 0.2s; stroke-opacity: 0; }
.connector-group:hover .hover-zone { stroke-opacity: 0.4; }
.main-path { pointer-events: none; filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5)); stroke-dasharray: 10, 5; animation: dash-flow 30s linear infinite; transition: stroke 0.2s; }
@keyframes dash-flow { to { stroke-dashoffset: -1000; } }
</style>