<script setup>
import { computed } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { getEffectName } from '@/data/effectPresets'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  trackId: { type: String, required: true },
  placement: { type: String, required: true },
})

const store = useTimelineStore()
const { locale } = useI18n({ useScope: 'global' })
const ICON_SIZE = 18
const BAR_GAP = 2
const LANE_PITCH = 22
const OPERATOR_ROW_HEIGHT = 24
const BUFF_EDGE_INSET = Math.floor((OPERATOR_ROW_HEIGHT - ICON_SIZE) / 2)

function getFallbackLabel(title) {
  const value = String(title || '').trim()
  return value ? value.charAt(0).toUpperCase() : '+'
}

const items = computed(() => {
  locale.value

  if (props.placement === 'upper') {
    const layout = store.operatorEffectLayouts.get(props.trackId)
    const segments = (layout?.positionedSegments || []).filter((segment) => (Number(segment.group) || 0) === 0)

    return segments.map((segment, index) => {
      const startPx = store.timeToPx(segment.start)
      const endPx = store.timeToPx(segment.end)
      const showIcon = segment.showIcon !== false
      const iconOffsetPx = showIcon ? ICON_SIZE + BAR_GAP : 0
      const widthPx = Math.max(0, endPx - startPx - iconOffsetPx - BAR_GAP)
      return {
        key: `${segment.effectId || segment.typeKey}-${segment.start}-${index}`,
        start: segment.start,
        lane: segment.subRow || 0,
        leftPx: startPx,
        topPx: (Number(segment.y) || 0) + Math.floor((OPERATOR_ROW_HEIGHT - ICON_SIZE) / 2),
        barOffsetPx: iconOffsetPx,
        widthPx,
        icon: segment.icon || null,
        color: segment.color,
        title: segment.effect ? getEffectName(segment.effect) : (segment.typeKey || ''),
        stacks: segment.stacks || 1,
        maxStacks: segment.maxStacks || 1,
        isConsumed: !!segment.isConsumed,
        showIcon,
      }
    }).sort((left, right) => {
      if (left.start !== right.start) return left.start - right.start
      return left.topPx - right.topPx
    })
  }

  const layout = store.trackBuffLayouts.get(props.trackId)
  const segments = layout?.lower || []

  return segments.map((segment) => {
    const leftPx = store.timeToPx(segment.start)
    const widthPx = Math.max(0, store.timeToPx(segment.end) - store.timeToPx(segment.start) - (ICON_SIZE + BAR_GAP))
    return {
      ...segment,
      leftPx,
      bottomPx: BUFF_EDGE_INSET + (Number(segment.lane) || 0) * LANE_PITCH,
      barOffsetPx: ICON_SIZE + BAR_GAP,
      showIcon: true,
      title: segment.effect ? getEffectName(segment.effect) : segment.title,
      widthPx,
    }
  }).sort((left, right) => {
    if (left.start !== right.start) return left.start - right.start
    return left.lane - right.lane
  })
})

const hasItems = computed(() => items.value.length > 0)

function getItemStyle(buff) {
  const style = { left: `${buff.leftPx}px` }
  if (props.placement === 'lower') {
    style.bottom = `${buff.bottomPx || 0}px`
  } else {
    style.top = `${buff.topPx || 0}px`
  }
  return style
}
</script>

<template>
  <div v-if="hasItems" class="timeline-buff-layer" :class="`is-${placement}`">
    <div
      v-for="buff in items"
      :key="buff.key"
      class="timeline-buff-item"
      :class="{ 'is-consumed': buff.isConsumed }"
      :style="getItemStyle(buff)"
    >
      <div v-if="buff.showIcon" class="timeline-buff-icon-box" :title="buff.title">
        <img v-if="buff.icon" :src="buff.icon" class="timeline-buff-icon" @error="e => (e.target.style.display = 'none')" />
        <span v-else class="timeline-buff-fallback">{{ getFallbackLabel(buff.title) }}</span>
        <div v-if="buff.maxStacks > 1" class="timeline-buff-stacks">{{ buff.stacks }}</div>
      </div>

      <div
        v-if="buff.widthPx > 0"
        class="timeline-buff-duration-bar"
        :style="{ width: `${buff.widthPx}px`, backgroundColor: buff.color, marginLeft: `${buff.showIcon ? BAR_GAP : buff.barOffsetPx}px` }"
        :title="buff.title"
      >
        <div class="timeline-buff-striped-bg"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-buff-layer {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 8;
}

.timeline-buff-layer.is-upper {
  top: 2px;
  height: calc(var(--track-row-padding-top) - 2px);
}

.timeline-buff-layer.is-lower {
  bottom: 2px;
  height: calc(var(--track-row-padding-bottom) - 2px);
}

.timeline-buff-item {
  position: absolute;
  display: flex;
  align-items: center;
  white-space: nowrap;
  pointer-events: none;
}

.timeline-buff-item.is-consumed {
  opacity: 0.6;
}

.timeline-buff-icon-box {
  width: 18px;
  height: 18px;
  background-color: #333;
  border: 1px solid #999;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  pointer-events: auto;
  transition: transform 0.12s ease, filter 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
  will-change: transform;
}

.timeline-buff-icon-box:hover {
  z-index: 12;
  transform: scale(1.18);
  filter: brightness(1.18);
  border-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.22), 0 4px 12px rgba(0, 0, 0, 0.46);
}

.timeline-buff-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.12s ease;
}

.timeline-buff-icon-box:hover .timeline-buff-icon {
  filter: brightness(1.12) saturate(1.08);
}

.timeline-buff-fallback {
  color: #eef6ff;
  font-size: 10px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.timeline-buff-stacks {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: rgba(0, 0, 0, 0.8);
  color: #ffd700;
  font-size: 8px;
  padding: 0 2px;
  line-height: 1;
  border-radius: 2px;
}

.timeline-buff-duration-bar {
  height: 16px;
  border: none;
  border-radius: 2px;
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  z-index: 1;
  margin-left: 2px;
  pointer-events: auto;
  transition: filter 0.12s ease, box-shadow 0.12s ease;
}

.timeline-buff-duration-bar:hover {
  filter: brightness(1.16) saturate(1.08);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18), 0 2px 8px rgba(0, 0, 0, 0.5);
}

.timeline-buff-striped-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.2) 2px,
    transparent 2px,
    transparent 6px
  );
}
</style>
