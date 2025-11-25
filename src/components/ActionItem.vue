<script setup>
import { computed } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { storeToRefs } from 'pinia'

const props = defineProps({
  action: { type: Object, required: true }
})

const store = useTimelineStore()
const { iconDatabase } = storeToRefs(store)
const isSelected = computed(() => store.isActionSelected(props.action.instanceId))

// 判断是否为“幽灵模式”（只显示触发窗口）
const isGhostMode = computed(() => (props.action.triggerWindow || 0) < 0)

const themeColor = computed(() => {
  if (props.action.customColor) return props.action.customColor
  if (props.action.type === 'link') return store.getColor('link')
  if (props.action.type === 'execution') return store.getColor('execution')
  if (props.action.type === 'attack') return store.getColor('physical')
  if (props.action.element) return store.getColor(props.action.element)

  let charId = null
  for (const track of store.tracks) {
    if (track.actions.some(a => a.instanceId === props.action.instanceId)) {
      charId = track.id
      break
    }
  }
  if (charId) return store.getCharacterElementColor(charId)
  return store.getColor('default')
})

// 主容器样式：如果是 Ghost 模式，隐藏视觉本体
const style = computed(() => {
  const widthUnit = store.timeBlockWidth
  const left = (props.action.startTime || 0) * widthUnit
  const width = (props.action.duration || 1) * widthUnit
  const finalWidth = width < 2 ? 2 : width
  const color = themeColor.value

  // 基础布局属性
  const baseStyle = {
    position: 'absolute',
    top: '0',
    height: '100%',
    left: `${left}px`,
    width: `${finalWidth}px`,
    boxSizing: 'border-box',
    zIndex: isSelected.value ? 20 : 10,
  }

  // 如果是幽灵模式，隐藏本体视觉
  if (isGhostMode.value) {
    return {
      ...baseStyle,
      border: 'none',
      backgroundColor: 'transparent',
      boxShadow: 'none',
      color: 'transparent',
      pointerEvents: isSelected.value ? 'auto' : 'none' // 可选：非选中时穿透，方便操作下层
    }
  }

  // 正常模式
  return {
    ...baseStyle,
    border: `2px dashed ${isSelected.value ? '#ffffff' : color}`,
    backgroundColor: hexToRgba(color, 0.15),
    backdropFilter: 'blur(4px)',
    color: isSelected.value ? '#ffffff' : color,
    boxShadow: isSelected.value ? `0 0 10px ${color}` : 'none'
  }
})

const cdStyle = computed(() => {
  const widthUnit = store.timeBlockWidth
  const cd = props.action.cooldown || 0
  const width = cd > 0 ? cd * widthUnit : 0
  return { width: `${width}px`, bottom: '-8px', left: '-2px', opacity: 0.6 }
})

const triggerWindowStyle = computed(() => {
  const widthUnit = store.timeBlockWidth
  const rawWindow = props.action.triggerWindow || 0

  if (rawWindow === 0) return { display: 'none' }

  const width = Math.abs(rawWindow) * widthUnit
  const color = themeColor.value

  return {
    '--tw-width': `${width}px`,
    '--tw-color': color,
    right: '100%'
  }
})

const customBarsToRender = computed(() => {
  const widthUnit = store.timeBlockWidth
  const bars = props.action.customBars || []
  return bars.map((bar, index) => {
    const duration = bar.duration || 0
    const offset = bar.offset || 0
    if (duration <= 0) return null
    const width = duration * widthUnit
    const left = (offset * widthUnit) - 2
    const bottomOffset = -24 - (index * 16)
    return {
      style: { width: `${width}px`, left: `${left}px`, bottom: `${bottomOffset}px`, position: 'absolute', pointerEvents: 'none', opacity: 0.6, zIndex: 5 - index },
      text: bar.text,
      duration: bar.duration
    }
  }).filter(item => item !== null)
})

function getEffectColor(type) { return store.getColor(type) }
function getIconPath(type) {
  let charId = null
  for (const track of store.tracks) {
    if (track.actions.some(a => a.instanceId === props.action.instanceId)) { charId = track.id; break; }
  }
  if (charId) {
    const charInfo = store.characterRoster.find(c => c.id === charId)
    if (charInfo?.exclusive_buffs) {
      const exclusive = charInfo.exclusive_buffs.find(b => b.key === type)
      if (exclusive?.path) return exclusive.path
    }
  }
  return store.iconDatabase[type] || store.iconDatabase['default'] || ''
}
function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`
  let c = hex.substring(1).split('');
  if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  c = '0x' + c.join('');
  return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')'
}

const renderableAnomalies = computed(() => {
  const raw = props.action.physicalAnomaly || []
  if (raw.length === 0) return []
  const rows = Array.isArray(raw[0]) ? raw : [raw]
  const widthUnit = store.timeBlockWidth
  const ICON_SIZE = 20
  const GAP = 2
  const resultRows = []
  rows.forEach((row, rowIndex) => {
    let currentLeft = 0
    const processedRow = row.map((effect, colIndex) => {
      const durationWidth = effect.duration > 0 ? (effect.duration * widthUnit) : 0
      const BAR_MARGIN = 2
      let finalBarWidth = durationWidth
      if (colIndex > 0 && finalBarWidth > 0) finalBarWidth = Math.max(0, finalBarWidth - ICON_SIZE)
      if (finalBarWidth > 0) finalBarWidth = Math.max(0, finalBarWidth - BAR_MARGIN)
      const itemLayout = { data: effect, rowIndex, colIndex, style: { left: `${currentLeft}px`, bottom: `${100 + (rowIndex * 50)}%`, position: 'absolute', zIndex: 15 + rowIndex }, barWidth: finalBarWidth }
      const occupiedWidth = finalBarWidth > 0 ? (BAR_MARGIN + finalBarWidth) : 0
      currentLeft += ICON_SIZE + occupiedWidth + GAP
      return itemLayout
    })
    resultRows.push(processedRow)
  })
  return resultRows.flat()
})

function onDeleteClick() { store.removeAction(props.action.instanceId) }
function onIconClick(evt, index) { evt.stopPropagation(); if (store.isLinking) { store.confirmLinking(props.action.instanceId, index) } else { store.selectAction(props.action.instanceId) } }
</script>

<template>
  <div :id="`action-${action.instanceId}`" class="action-item-wrapper" :style="style" @click.stop @dragstart.prevent>

    <div v-if="!isGhostMode" class="action-item-content drag-handle">{{ action.name }}</div>

    <div v-if="isSelected" class="delete-btn-modern" @click.stop="onDeleteClick" title="删除 (Delete)">
      <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>

    <div v-if="!isGhostMode && action.cooldown > 0" class="cd-bar-container" :style="cdStyle">
      <div class="cd-line" :style="{ backgroundColor: themeColor }"></div>
      <span class="cd-text" :style="{ color: themeColor }">{{ action.cooldown }}s</span>
      <div class="cd-end-mark" :style="{ backgroundColor: themeColor }"></div>
    </div>

    <template v-if="!isGhostMode">
      <div v-for="(barItem, idx) in customBarsToRender" :key="idx"
           class="custom-blue-bar" :style="barItem.style">
        <div class="cb-line"></div>
        <div class="cb-end-mark"></div>
        <span v-if="barItem.text" class="cb-label">{{ barItem.text }}</span>
        <span class="cb-duration">{{ barItem.duration }}s</span>
      </div>
    </template>

    <div v-if="action.triggerWindow && action.triggerWindow !== 0" class="trigger-window-bar" :style="triggerWindowStyle">
      <div class="tw-dot"></div>
      <div class="tw-separator"></div>
    </div>

    <div v-if="!isGhostMode" class="anomalies-overlay">
      <div v-for="(item, index) in renderableAnomalies" :key="`${item.rowIndex}-${item.colIndex}`"
           class="anomaly-wrapper" :style="item.style">
        <div :id="`anomaly-${action.instanceId}-${index}`" class="anomaly-icon-box"
             @mousedown.stop="onIconClick($event, index)" @click.stop>
          <img :src="getIconPath(item.data.type)" class="anomaly-icon"/>
          <div v-if="item.data.stacks > 1" class="anomaly-stacks">{{ item.data.stacks }}</div>
        </div>
        <div class="anomaly-duration-bar" v-if="item.data.duration > 0"
             :style="{ width: `${item.barWidth}px`, backgroundColor: getEffectColor(item.data.type) }">
          <div class="striped-bg"></div>
          <span class="duration-text">{{ item.data.duration }}s</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* === 基础容器 === */
.action-item-wrapper { display: flex; align-items: center; justify-content: center; white-space: nowrap; cursor: grab; user-select: none; position: relative; overflow: visible; transition: background-color 0.2s, box-shadow 0.2s, filter 0.2s; font-weight: bold; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8); }
.action-item-wrapper:hover { filter: brightness(1.2); z-index: 50 !important; }

/* === 异常状态层 === */
.anomalies-overlay { position: absolute; top: 0; left: calc(100% - 20px); width: 0; height: 100%; pointer-events: none; overflow: visible; }
.anomaly-wrapper { display: flex; align-items: center; height: 22px; pointer-events: none; white-space: nowrap; }
.anomaly-icon-box { width: 20px; height: 20px; background-color: #333; border: 1px solid #999; box-sizing: border-box; display: flex; align-items: center; justify-content: center; position: relative; z-index: 10; flex-shrink: 0; pointer-events: auto; cursor: pointer; transition: transform 0.1s, border-color 0.1s; }
.anomaly-icon-box:hover { border-color: #ffd700; transform: scale(1.2); z-index: 20; }
.anomaly-icon { width: 100%; height: 100%; object-fit: cover; }
.anomaly-stacks { position: absolute; bottom: -2px; right: -2px; background: rgba(0, 0, 0, 0.8); color: #ffd700; font-size: 8px; padding: 0 2px; line-height: 1; border-radius: 2px; }
.anomaly-duration-bar { height: 16px; border: none; border-radius: 2px; position: relative; display: flex; align-items: center; overflow: hidden; box-sizing: border-box; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); z-index: 1; margin-left: 2px; }
.striped-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; background: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2) 2px, transparent 2px, transparent 6px); }
.duration-text { position: absolute; left: 4px; font-size: 11px; color: #fff; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8); z-index: 2; font-weight: bold; line-height: 1; font-family: sans-serif; }

/* === 冷却条 (CD Bar) === */
.cd-bar-container { position: absolute; height: 4px; display: flex; align-items: center; pointer-events: none; }
.cd-line { flex-grow: 1; height: 2px; }
.cd-text { position: absolute; left: 0; top: 4px; font-size: 10px; font-weight: bold; line-height: 1; }
.cd-end-mark { position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 1px; height: 8px; }

/* === 自定义浅蓝条样式 === */
.custom-blue-bar {
  height: 4px;
  display: flex;
  align-items: center;
  color: #69c0ff;
  z-index: 5;
}

.cb-line {
  flex-grow: 1;
  height: 2px;
  background-color: #69c0ff;
}

.cb-label {
  position: absolute;
  right: 100%;
  margin-right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
  line-height: 1;
  color: #69c0ff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}

.cb-duration {
  position: absolute;
  left: 0;
  top: 4px;
  font-size: 10px;
  font-weight: bold;
  line-height: 1;
  color: #69c0ff;
}

.cb-end-mark {
  position: absolute;
  right: 0;
  width: 1px;
  height: 8px;
  background-color: #69c0ff;
  top: 50%;
  transform: translateY(-50%);
}

/* === 触发窗口 === */
.trigger-window-bar { position: absolute; --tw-width: 0px; --tw-color: transparent; width: var(--tw-width); height: 4px; bottom: -8px; right: 100%; display: flex; align-items: center; pointer-events: auto; cursor: pointer; z-index: 5; }
.trigger-window-bar::after { content: ''; position: absolute; top: -4px; bottom: -4px; left: 0; right: 0; background: transparent; }
.trigger-window-bar::before { content: ''; position: absolute; left: 0; right: 0; height: 3px; background-color: var(--tw-color); opacity: 1; border-radius: 2px 0 0 2px; }
.tw-separator { position: absolute; right: 0; top: -2px; width: 1px; height: 8px; background-color: var(--tw-color); }
.tw-dot { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 1px; height: 8px; background-color: var(--tw-color); border-radius: 0; z-index: 6; }

/* === 删除按钮 === */
.delete-btn-modern { position: absolute; top: -8px; right: -8px; width: 18px; height: 18px; background-color: #333; border: 1px solid #666; color: #ccc; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 30; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4); transition: all 0.2s ease; }
.delete-btn-modern:hover { background-color: #d32f2f; border-color: #d32f2f; color: white; transform: scale(1.1); }
</style>