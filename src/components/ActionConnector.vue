<script setup>
import { computed } from 'vue'
import ConnectionPath from './ConnectionPath.vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { useDragConnection } from '../composables/useDragConnection.js'
import { PORT_DIRECTIONS } from '@/utils/layoutUtils.js'

const props = defineProps({
  connection: { type: Object, required: true },
  containerRef: { type: Object, required: false },
  renderKey: { type: Number }
})

const store = useTimelineStore()
const connectionHandler = useDragConnection()

const isSelected = computed(() => store.selectedConnectionId === props.connection.id)

const isRelatedToHover = computed(() => {
  const hoverId = store.hoveredActionId
  if (!hoverId) return false
  return props.connection.from === hoverId || props.connection.to === hoverId
})

const isDimmed = computed(() => {
  return store.hoveredActionId && !isRelatedToHover.value && !isSelected.value && !connectionHandler.isDragging.value
})

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

const getElementRectRelative = (domId, containerEl) => {
  const el = document.getElementById(domId)
  if (!el || !containerEl) return null
  const rect = el.getBoundingClientRect()
  const containerRect = containerEl.getBoundingClientRect()
  return {
    left: (rect.left - containerRect.left) + containerEl.scrollLeft,
    top: (rect.top - containerRect.top) + containerEl.scrollTop,
    rawLeft: rect.left,
    rawTop: rect.top,
    width: rect.width,
    height: rect.height
  }
}

const calculatePoint = (nodeId, effectIndex, isSource, connection = null, effectId = null) => {
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
    const transferId = `transfer-${nodeId}-${realEffectIndex}`
    if (document.getElementById(transferId)) {
      targetDomId = transferId
    } else {
      targetDomId = `anomaly-${nodeId}-${realEffectIndex}`
    }
  } else if (realEffectIndex != null) {
    targetDomId = `anomaly-${nodeId}-${realEffectIndex}`
  } else {
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
        rawX: rect.rawLeft + (rect.width * config.x),
        rawY: rect.rawTop + (rect.height * config.y),
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

const coordinateInfo = computed(() => {
  const _trigger = props.renderKey
  const conn = props.connection

  const start = calculatePoint(conn.from, conn.fromEffectIndex, true, conn, conn.fromEffectId)
  const end = calculatePoint(conn.to, conn.toEffectIndex, false, conn, conn.toEffectId)

  if (!start || !end) return null

  const colorStart = resolveColor(store.getActionPositionInfo(conn.from), conn.fromEffectIndex, conn.fromEffectId)
  const colorEnd = resolveColor(store.getActionPositionInfo(conn.to), conn.toEffectIndex, conn.toEffectId)

  return {
    startPoint: { x: start.x, y: start.y },
    endPoint: { x: end.x, y: end.y },
    rawStartPoint: { x: start.rawX, y: start.rawY },
    rawEndPoint: { x: end.rawX, y: end.rawY },
    startDirection: start.dir, 
    endDirection: end.dir,
    colors: { start: colorStart, end: colorEnd }
  }
})

function onSelectClick() {
  store.selectConnection(props.connection.id)
}

const onDragTarget = (evt) => {
  connectionHandler.moveConnectionEnd(props.connection.id, coordinateInfo.value.rawStartPoint)
}
</script>

<template>
  <ConnectionPath
    v-if="coordinateInfo"
    :id="connection.id"
    :is-consumption="connection.isConsumption"  :start-point="coordinateInfo.startPoint"
    :end-point="coordinateInfo.endPoint"
    :start-direction="coordinateInfo.startDirection"
    :end-direction="coordinateInfo.endDirection"
    :colors="coordinateInfo.colors"
    :is-selected="isSelected"
    :is-dimmed="isDimmed"
    :is-highlighted="isRelatedToHover"
    :is-selectable="!connectionHandler.isDragging.value"
    @click="onSelectClick"
    @contextmenu="onContextMenu"
    @drag-start-target="onDragTarget"
  />
</template>