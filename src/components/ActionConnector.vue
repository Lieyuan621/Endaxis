<script setup>
import { computed } from 'vue'
import ConnectionPath from './ConnectionPath.vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { useDragConnection } from '../composables/useDragConnection.js'
import { PORT_DIRECTIONS } from '@/utils/layoutUtils.js'

const props = defineProps({
  connection: { type: Object, required: true },
  renderKey: { type: Number }
})

const store = useTimelineStore()
const connectionHandler = useDragConnection()

const isSelected = computed(() => store.selectedConnectionId === props.connection.id)

const getEndpointId = (conn, side) => {
  if (!conn) return null
  if (side === 'from') return conn.fromNodeId || conn.fromEffectId || conn.from || null
  return conn.toNodeId || conn.toEffectId || conn.to || null
}

const connectionTouchesHoveredAction = (conn, actionId) => {
  const fromId = getEndpointId(conn, 'from')
  const toId = getEndpointId(conn, 'to')
  if (!actionId || !fromId || !toId) return false

  const fromNode = store.resolveNode(fromId)
  const toNode = store.resolveNode(toId)

  const match = (node) => {
    if (!node) return false
    if (node.type === 'action') return node.id === actionId
    if (node.type === 'effect') return node.actionId === actionId
    return false
  }

  return match(fromNode) || match(toNode)
}

const isRelatedToHover = computed(() => {
  const hoverId = store.hoveredActionId
  if (!hoverId) return false
  return connectionTouchesHoveredAction(props.connection, hoverId)
})

const isDimmed = computed(() => {
  return store.hoveredActionId && !isRelatedToHover.value && !isSelected.value && !connectionHandler.isDragging.value
})

const getTrackCenterY = (trackIndex) => {
  const trackRect = store.trackLaneRects[trackIndex]
  if (!trackRect) return 0
  return trackRect.top + (trackRect.height / 2)
}

const resolveColor = (info, effectId) => {
  if (!info) return store.getColor('default')
  if (info.type === 'status') return info.node?.color || store.getColor('default')

  if (info.type === 'effect') {
    const effectType = info.node?.type
    return effectType ? store.getColor(effectType) : store.getColor('default')
  }

  const { node: action, trackIndex } = info
  if (!action) return store.getColor('default')

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

function onContextMenu(evt) {
  if (store.selectedConnectionId !== props.connection.id) {
    store.selectConnection(props.connection.id)
  }
  store.openContextMenu(evt, props.connection.id)
}

const getRectByNodeId = (nodeId, { connection = null, isSource = false } = {}) => {
  const info = store.resolveNode(nodeId)
  if (!info) return null

  if (info.type === 'action') {
    const layout = store.nodeRects[nodeId]
    return layout?.rect || null
  }

  if (info.type === 'effect') {
    if (isSource && connection?.isConsumption) {
      const transferId = `${nodeId}_transfer`
      const transferLayout = store.effectLayouts.get(transferId)
      if (transferLayout?.rect) return transferLayout.rect
    }
    const layout = store.effectLayouts.get(nodeId)
    return layout?.rect || null
  }

  if (info.type === 'status') {
    if (isSource && connection?.isConsumption) {
      const transferId = `${nodeId}_transfer`
      const transferLayout = store.statusNodeRects.get(transferId)
      if (transferLayout?.rect) return transferLayout.rect
    }
    const layout = store.statusNodeRects.get(nodeId)
    return layout?.rect || null
  }

  return null
}

const calculatePoint = (nodeId, isSource, connection = null) => {
  const info = store.resolveNode(nodeId)
  if (!info) return null

  if (!isSource && info.type === 'action') {
    const action = info.node
    const rawTw = action?.triggerWindow || 0
    const hasTriggerWindow = Math.abs(Number(rawTw)) > 0.001
    if (hasTriggerWindow) {
      const layout = store.nodeRects[nodeId]
      if (layout && layout.triggerWindow && layout.triggerWindow.hasWindow) {
        return { x: layout.triggerWindow.rect.left, y: layout.triggerWindow.rect.top, dir: PORT_DIRECTIONS.left }
      }
    }
  }

  const rect = getRectByNodeId(nodeId, { connection, isSource })
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

  if (info.type === 'action') {
    const timePoint = isSource ? (Number(info.node.startTime) || 0) + (Number(info.node.duration) || 0) : (Number(info.node.startTime) || 0)
    return {
      x: timePoint * store.timeBlockWidth,
      y: getTrackCenterY(info.trackIndex),
      dir: isSource ? PORT_DIRECTIONS.right : PORT_DIRECTIONS.left
    }
  }

  if (info.type === 'effect') {
    const actionWrap = store.getActionById(info.actionId)
    const baseStart = Number(actionWrap?.node?.startTime) || 0
    const offset = Number(info.node?.offset) || 0
    const t = store.getShiftedEndTime(baseStart, offset, info.actionId)
    return {
      x: t * store.timeBlockWidth,
      y: getTrackCenterY(actionWrap?.trackIndex ?? 0),
      dir: isSource ? PORT_DIRECTIONS.right : PORT_DIRECTIONS.left
    }
  }

  if (info.type === 'status') {
    const trackIndex = info.trackIndex
    const y = getTrackCenterY(trackIndex) + 20
    const t = Number(info.node?.startTime) || 0
    return {
      x: t * store.timeBlockWidth,
      y,
      dir: isSource ? PORT_DIRECTIONS.right : PORT_DIRECTIONS.left
    }
  }

  return null
}

const coordinateInfo = computed(() => {
  const _trigger = props.renderKey
  const conn = props.connection

  const fromId = getEndpointId(conn, 'from')
  const toId = getEndpointId(conn, 'to')

  const start = fromId ? calculatePoint(fromId, true, conn) : null
  const end = toId ? calculatePoint(toId, false, conn) : null

  if (!start || !end) return null

  const colorStart = resolveColor(store.resolveNode(fromId))
  const colorEnd = resolveColor(store.resolveNode(toId))

  return {
    startPoint: { x: start.x, y: start.y },
    endPoint: { x: end.x, y: end.y },
    startDirection: start.dir, 
    endDirection: end.dir,
    colors: { start: colorStart, end: colorEnd }
  }
})

function onSelectClick() {
  store.selectConnection(props.connection.id)
}

const onDragTarget = (evt) => {
  connectionHandler.moveConnectionEnd(props.connection.id, coordinateInfo.value.startPoint)
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