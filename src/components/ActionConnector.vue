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

const isRelatedToHover = computed(() => {
  const hoverId = store.hoveredActionId
  if (!hoverId) return false
  return props.connection.from === hoverId || props.connection.to === hoverId
})

const isDimmed = computed(() => {
  return store.hoveredActionId && !isRelatedToHover.value && !isSelected.value && !connectionHandler.isDragging.value
})

const getTrackCenterY = (trackIndex) => {
  const trackRect = store.trackLaneRects[trackIndex]
  return trackRect.top + (trackRect.height / 2)
}

const resolveColor = (info, effectId) => {
  if (!info) return store.getColor('default')
  const { node:action, trackIndex } = info

  if (effectId) {
    const effect = store.getEffectById(effectId)
    if (effect) return store.getColor(effect.node.type)
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

function onContextMenu(evt) {
  if (store.selectedConnectionId !== props.connection.id) {
    store.selectConnection(props.connection.id)
  }
  store.openContextMenu(evt, props.connection.id)
}

const getNodeRectRelative = (nodeId, isAction) => {
  if (isAction) {
    const layout = store.nodeRects[nodeId]
    if (!layout || !layout.rect) {
      return null
    }
    const rect = layout.rect

    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    }
  } else {
    const layout = store.effectLayouts.get(nodeId)
    if (!layout) {
      return null
    }

    const rect = layout.rect

    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    }
  }
}

const calculatePoint = (nodeId, isSource, connection = null, effectId = null) => {
  const info = store.getActionById(nodeId)
  if (!info) return null

  const action = info.node
  const rawTw = action.triggerWindow || 0
  const hasTriggerWindow = Math.abs(Number(rawTw)) > 0.001


  if (!isSource && hasTriggerWindow && !effectId) {
    const layout = store.nodeRects[nodeId]
    if (layout && layout.triggerWindow && layout.triggerWindow.hasWindow) {
      return { 
        x: layout.triggerWindow.rect.left, 
        y: layout.triggerWindow.rect.top, 
        dir: PORT_DIRECTIONS.left 
      }
    }
  }

  const isGhostMode = rawTw < 0

  let rectNodeId = null

  let isAction = false
  if (isSource && connection && connection.isConsumption && effectId != null) {
    rectNodeId = `${effectId}_transfer`
  } else if (effectId != null) {
    if (isGhostMode) {
     rectNodeId = nodeId 
    } else {
      rectNodeId = effectId
    }
  } else {
    rectNodeId = nodeId
    isAction = true
  }
  
  if (rectNodeId) {
    const rect = getNodeRectRelative(rectNodeId, isAction)

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

  const timePoint = isSource ? action.startTime + action.duration : action.startTime
  return {
    x: timePoint * store.timeBlockWidth,
    y: getTrackCenterY(info.trackIndex),
    dir: isSource ? PORT_DIRECTIONS.right : PORT_DIRECTIONS.left
  }
}

const coordinateInfo = computed(() => {
  const _trigger = props.renderKey
  const conn = props.connection

  const start = calculatePoint(conn.from, true, conn, conn.fromEffectId)
  const end = calculatePoint(conn.to, false, conn, conn.toEffectId)

  if (!start || !end) return null

  const colorStart = resolveColor(store.getActionById(conn.from), conn.fromEffectId)
  const colorEnd = resolveColor(store.getActionById(conn.to), conn.toEffectId)

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