<script setup>
import { computed } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import ConnectionPath from './ConnectionPath.vue'
import { useDragConnection } from '@/composables/useDragConnection.js'
import { PORT_DIRECTIONS } from '@/utils/layoutUtils.js'

const props = defineProps({})
const store = useTimelineStore()
const connectionHandler = useDragConnection()

const startPoint = computed(() => {
  const state = connectionHandler.state.value
  
  if (!connectionHandler.isDragging.value) {
    return null
  }

  const scrollX = store.timelineScrollLeft
  const scrollY = store.timelineScrollTop

  return {
    x: (state.startPoint.x - store.timelineRect.left) + scrollX,
    y: (state.startPoint.y - store.timelineRect.top) + scrollY,
    dir: PORT_DIRECTIONS[state.sourcePort]
  }
})

const mousePoint = computed(() => {
  let rawX = store.cursorPosition.x
  let rawY = store.cursorPosition.y

  const snapState = connectionHandler.snapState.value

  if (snapState.isActive && snapState.snapPos) {
    rawX = snapState.snapPos.x
    rawY = snapState.snapPos.y
  }

  const x = (rawX - store.timelineRect.left) + store.timelineScrollLeft
  const y = (rawY - store.timelineRect.top) + store.timelineScrollTop

  const dir = PORT_DIRECTIONS[snapState.targetPort ?? 'left']

  return { x, y, dir }
})

function getActionColor(action) {
  if (action.type === 'link') return store.getColor('link')
  if (action.type === 'execution') return store.getColor('execution')
  if (action.type === 'attack') return store.getColor('physical')
  if (action.element) return store.getColor(action.element)
}

function getColors() {
  let startColor = store.getColor('default')
  let endColor = store.getColor('default')

  const fromNode = store.resolveNode(connectionHandler.state.value.sourceId)
  const toNode = store.resolveNode(connectionHandler.snapState.value.targetId)

  if (fromNode) {
    if (fromNode.type === 'action') {
      startColor = getActionColor(fromNode.node)
    } else {
      startColor = store.getColor(fromNode.node.type)
    }
  }
  if (toNode) {
    if (toNode.type === 'action') {
      endColor = getActionColor(toNode.node)
    } else {
      endColor = store.getColor(toNode.node.type)
    }
  }

  return { start: startColor, end: endColor }
}

const pathProps = computed(() => {
  if (!connectionHandler.isDragging.value || !startPoint.value) {
    return null
  }

  const start = startPoint.value
  const end = mousePoint.value

  return {
    startPoint: { x: start.x, y: start.y },
    endPoint: { x: end.x, y: end.y },
    startDirection: start.dir,
    endDirection: end.dir,
    colors: getColors()
  }
})
</script>

<template>
  <ConnectionPath v-if="pathProps" id="drag-preview-line" :start-point="pathProps.startPoint"
    :end-point="pathProps.endPoint" :start-direction="pathProps.startDirection" :end-direction="pathProps.endDirection"
    :colors="pathProps.colors" :is-preview="true" style="pointer-events: none;" />
</template>

<style scoped>
</style>