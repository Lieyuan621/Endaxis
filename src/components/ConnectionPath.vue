<script setup>
import { computed } from 'vue'

const props = defineProps({
  id: { type: [String, Number], required: true },

  startPoint: { type: Object, required: true }, // { x, y }
  endPoint: { type: Object, required: true },   // { x, y }

  startDirection: {
    type: Object,
    default: () => ({ cx: 1, cy: 0 })
  },
  endDirection: {
    type: Object,
    default: () => ({ cx: -1, cy: 0 })
  },

  colors: {
    type: Object,
    default: () => ({ start: '#ccc', end: '#ccc' })
  },

  isSelected: { type: Boolean, default: false },
  isDimmed: { type: Boolean, default: false },
  isHighlighted: { type: Boolean, default: false },
  isSelectable: { type: Boolean, default: true },
  isConsumption: { type: Boolean, default: false },
  isPreview: { type: Boolean, default: false }
})

const emit = defineEmits([
  'click',
  'contextmenu',
  'drag-start-source',
  'drag-start-target'
])

const gradientId = computed(() => `grad-${props.id}`)

const pathData = computed(() => {
  const { startPoint, endPoint, startDirection, endDirection } = props

  const dx = Math.abs(endPoint.x - startPoint.x)
  const dy = Math.abs(endPoint.y - startPoint.y)
  const dist = Math.sqrt(dx * dx + dy * dy)
  const tension = Math.min(150, Math.max(40, dist * 0.4))

  const c1 = {
    x: startPoint.x + (startDirection.cx * tension),
    y: startPoint.y + (startDirection.cy * tension)
  }
  const c2 = {
    x: endPoint.x + (endDirection.cx * tension),
    y: endPoint.y + (endDirection.cy * tension)
  }

  return `M ${startPoint.x} ${startPoint.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${endPoint.x} ${endPoint.y}`
})
</script>

<template>
  <g class="connector-group" :class="{
    'is-selected': isSelected,
    'is-dimmed': isDimmed,
    'is-highlighted': isHighlighted,
    'is-preview': isPreview,
    'is-selectable': isSelectable,
    'is-consumption': isConsumption
  }" @click.stop="emit('click', $event)" @contextmenu.prevent.stop="emit('contextmenu', $event)">
    <defs>
      <linearGradient :id="gradientId" gradientUnits="userSpaceOnUse" :x1="startPoint.x" :y1="startPoint.y"
        :x2="endPoint.x" :y2="endPoint.y">
        <stop offset="0%" :stop-color="colors.start" stop-opacity="0.8" />
        <stop offset="100%" :stop-color="colors.end" stop-opacity="1" />
      </linearGradient>
    </defs>

    <path :d="pathData" fill="none" :stroke="colors.end" stroke-width="12" class="hover-zone"
      :class="{ 'is-preview': isPreview, 'is-selectable': isSelectable }">
      <title>{{ $t('connection.deleteHint') }}</title>
    </path>

    <g class="path-group">
      <path :d="pathData" 
        fill="none" 
        stroke="rgba(0,0,0,0.3)" 
        stroke-width="3" 
        class="path-shadow" />

      <path :d="pathData" 
        fill="none" 
        :stroke="isSelected ? '#ffffff' : `url(#${gradientId})`" 
        stroke-width="2"
        stroke-linecap="round" 
        class="main-path" />
    </g>

    <circle r="2" class="moving-circle" 
      :style="{
        offsetPath: `path('${pathData}')`,
        '--start-color': colors.start,
        '--end-color': colors.end
      }"></circle>

    <template v-if="isSelected && !isPreview">
      <circle :cx="endPoint.x" :cy="endPoint.y" r="5" class="drag-handle-dot target-handle"
        @mousedown.stop="emit('drag-start-target', $event)" />
    </template>
  </g>
</template>

<style scoped>
.connector-group {
  transition: opacity 0.2s, filter 0.2s;
  cursor: pointer;
  
  &.is-dimmed {
    opacity: 0.1;
    filter: grayscale(0.8);
  }

  &.is-preview {
    pointer-events: none;
    cursor: default;
    opacity: 0.5;
  }
}

.connector-group.is-selectable.is-highlighted .main-path {
  stroke-width: 3;
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.4));
}

.connector-group.is-selected .main-path {
  stroke-width: 3;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9));
  z-index: 999;
}

.connector-group.is-consumption {
  opacity: 0.4;
}

.connector-group.is-consumption .main-path {
  stroke-dasharray: 2, 6;
  stroke-linecap: round;
  /* animation: dash-flow 60s linear infinite; */
}

.connector-group.is-consumption.is-selected {
  opacity: 0.8;
}

.hover-zone {
  transition: stroke-opacity 0.2s;
  stroke-opacity: 0;

  &.is-selectable {
    pointer-events: stroke;
  }

  &.is-preview {
    pointer-events: none;
  }
}

.connector-group:hover .hover-zone {
  stroke-opacity: 0.4;
}

.path-shadow {
  filter: blur(2px); 
  transform: translateY(1px);
}

.main-path {
  pointer-events: none;
  stroke-dasharray: 10, 5;
  will-change: stroke-dashoffset;
  animation: dash-flow 0.5s linear infinite;
}

@keyframes dash-flow {
  from {
    stroke-dashoffset: 15;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.drag-handle-dot {
  fill: #fff;
  stroke: #333;
  stroke-width: 1px;
  cursor: grab;
  pointer-events: auto;
  transition: r 0.1s, fill 0.1s;
  z-index: 1000;
}

.drag-handle-dot:hover {
  r: 7;
  fill: #ffd700;
}

.moving-circle {
  will-change: offset-distance, fill;
  
  animation: 
    move-along-path 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite,
    color-pulse 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes move-along-path {
  0% {
    offset-distance: 0%;
  }
  100% {
    offset-distance: 100%;
  }
}

@keyframes color-pulse {
  0% {
    fill: var(--start-color);
  }
  100% {
    fill: var(--end-color);
  }
}
</style>