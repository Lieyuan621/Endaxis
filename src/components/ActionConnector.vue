<script setup>
import { computed } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'

const props = defineProps({
  connection: { type: Object, required: true },
  containerRef: { type: Object, required: false },
  renderKey: { type: Number }
})

const store = useTimelineStore()
const gradientId = computed(() => `grad-${props.connection.id}`)
const isSelected = computed(() => store.selectedConnectionId === props.connection.id)

const isRelatedToHover = computed(() => {
  const hoverId = store.hoveredActionId
  if (!hoverId) return false
  return props.connection.from === hoverId || props.connection.to === hoverId
})

const isDimmed = computed(() => {
  return store.hoveredActionId && !isRelatedToHover.value && !isSelected.value
})

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

const getTriggerDotPosition = (instanceId, containerEl) => {
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

function onContextMenu(evt) {
  if (store.selectedConnectionId !== props.connection.id) {
    store.selectConnection(props.connection.id)
  }
  store.openContextMenu(evt, props.connection.id)
}

const PORT_DIRECTIONS = {
  'top':          { x: 0.5, y: 0,   cx: 0,  cy: -1 },
  'bottom':       { x: 0.5, y: 1,   cx: 0,  cy: 1 },
  'left':         { x: 0,   y: 0.5, cx: -1, cy: 0 },
  'right':        { x: 1,   y: 0.5, cx: 1,  cy: 0 },
  'top-left':     { x: 0,   y: 0,   cx: -1, cy: -1 },
  'top-right':    { x: 1,   y: 0,   cx: 1,  cy: -1 },
  'bottom-left':  { x: 0,   y: 1,   cx: -1, cy: 1 },
  'bottom-right': { x: 1,   y: 1,   cx: 1,  cy: 1 },
}

const getElementRectRelative = (domId, containerEl) => {
  const el = document.getElementById(domId)
  if (!el || !containerEl) return null
  const rect = el.getBoundingClientRect()
  const containerRect = containerEl.getBoundingClientRect()
  return {
    left: (rect.left - containerRect.left) + containerEl.scrollLeft,
    top: (rect.top - containerRect.top) + containerEl.scrollTop,
    width: rect.width,
    height: rect.height
  }
}

const calculatePoint = (nodeId, effectIndex, isSource, connection = null) => {
  const info = store.getActionPositionInfo(nodeId)
  if (!info) return null

  const rawTw = info.action.triggerWindow || 0
  const hasTriggerWindow = Math.abs(Number(rawTw)) > 0.001

  if (!isSource && hasTriggerWindow && effectIndex == null) {
    const dotPos = getTriggerDotPosition(nodeId, props.containerRef)
    if (dotPos) {
      return { x: dotPos.x, y: dotPos.y, dir: PORT_DIRECTIONS.left }
    }
  }

  let targetDomId = null
  let realEffectIndex = effectIndex

  if (connection) {
    const targetId = isSource ? connection.fromEffectId : connection.toEffectId
    realEffectIndex = resolveRealIndex(info.action, effectIndex, targetId)
  }

  if (isSource && connection && connection.isConsumption && realEffectIndex != null) {
    targetDomId = `transfer-${nodeId}-${realEffectIndex}`
  }
  else if (realEffectIndex != null) {
    targetDomId = `anomaly-${nodeId}-${realEffectIndex}`
  }
  else {
    targetDomId = `action-${nodeId}`
  }

  if (targetDomId) {
    const rect = getElementRectRelative(targetDomId, props.containerRef)

    if (rect) {
      const userPort = isSource ? connection?.sourcePort : connection?.targetPort
      const defaultPort = isSource ? 'right' : 'left'
      const dirKey = userPort || defaultPort

      const config = PORT_DIRECTIONS[dirKey] || PORT_DIRECTIONS[defaultPort]

      return {
        x: rect.left + (rect.width * config.x),
        y: rect.top + (rect.height * config.y),
        dir: config
      }
    }
  }

  const timePoint = isSource ? info.action.startTime + info.action.duration : info.action.startTime
  return {
    x: timePoint * store.timeBlockWidth,
    y: getTrackCenterY(info.trackIndex),
    dir: isSource ? PORT_DIRECTIONS.right : PORT_DIRECTIONS.left
  }
}

const pathInfo = computed(() => {
  const _trigger = props.renderKey
  const conn = props.connection

  const start = calculatePoint(conn.from, conn.fromEffectIndex, true, conn)
  const end = calculatePoint(conn.to, conn.toEffectIndex, false, conn)

  if (!start || !end) return null

  const colorStart = resolveColor(store.getActionPositionInfo(conn.from), conn.fromEffectIndex, conn.fromEffectId)
  const colorEnd = resolveColor(store.getActionPositionInfo(conn.to), conn.toEffectIndex, conn.toEffectId)

  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)
  const dist = Math.sqrt(dx*dx + dy*dy)

  const tension = Math.min(150, Math.max(40, dist * 0.4))

  const c1 = {
    x: start.x + (start.dir.cx * tension),
    y: start.y + (start.dir.cy * tension)
  }

  const c2 = {
    x: end.x + (end.dir.cx * tension),
    y: end.y + (end.dir.cy * tension)
  }

  const d = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`

  return {
    d,
    startPoint: { x: start.x, y: start.y },
    endPoint: { x: end.x, y: end.y },
    colors: { start: colorStart, end: colorEnd }
  }
})
</script>

<template>
  <g
      v-if="pathInfo"
      class="connector-group"
      :class="{ 'is-selected': isSelected, 'is-dimmed': isDimmed, 'is-highlighted': isRelatedToHover }"
      @click="onSelectClick"
      @contextmenu.prevent.stop="onContextMenu"
  >
    <defs>
      <linearGradient :id="gradientId" gradientUnits="userSpaceOnUse" :x1="pathInfo.startPoint.x" :y1="pathInfo.startPoint.y" :x2="pathInfo.endPoint.x" :y2="pathInfo.endPoint.y">
        <stop offset="0%" :stop-color="pathInfo.colors.start" stop-opacity="0.8"/>
        <stop offset="100%" :stop-color="pathInfo.colors.end" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <path :d="pathInfo.d" fill="none" :stroke="pathInfo.colors.end" stroke-width="12" class="hover-zone"><title>左键选中后按 Delete 删除</title></path>
    <path :d="pathInfo.d" fill="none" :stroke="isSelected ? '#ffffff' : `url(#${gradientId})`" stroke-width="2" stroke-linecap="round" class="main-path"/>
    <circle r="2">
      <animateMotion :path="pathInfo.d" dur="1.5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1"/>
      <animate attributeName="fill" :values="`${pathInfo.colors.start};${pathInfo.colors.end}`" dur="1.5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1"/>
    </circle>
  </g>
</template>

<style scoped>
.connector-group {
  cursor: pointer;
  transition: opacity 0.2s, filter 0.2s;
}
.connector-group.is-dimmed {
  opacity: 0.1;
  filter: grayscale(0.8);
}
.connector-group.is-highlighted .main-path {
  stroke-width: 3;
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.4));
}
.connector-group.is-selected .main-path {
  stroke-width: 3;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9));
  z-index: 999;
}
.hover-zone { pointer-events: stroke; transition: stroke-opacity 0.2s; stroke-opacity: 0; }
.connector-group:hover .hover-zone { stroke-opacity: 0.4; }
.main-path { pointer-events: none; filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5)); stroke-dasharray: 10, 5; animation: dash-flow 30s linear infinite; transition: stroke 0.2s; }
@keyframes dash-flow { to { stroke-dashoffset: -1000; } }
</style>