<script setup>
import { computed } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { useDragConnection } from '../composables/useDragConnection.js'
import ActionLinkPorts from './ActionLinkPorts.vue'
import { getRectPos } from '@/utils/layoutUtils.js'

const props = defineProps({
  action: { type: Object, required: true },
})

const store = useTimelineStore()
const connectionHandler = useDragConnection()
const TYPE_SHORTHAND = {
  'attack': 'A', 'execution': 'X', 'skill': 'C', 'link': 'E', 'ultimate': 'U'
}

const isVariant = computed(() => {
  return props.action.id && props.action.id.includes('_variant_')
})

const secWidth = computed(() => store.timeBlockWidth)

const displayLabel = computed(() => {
  const name = props.action.name || ''
  const type = props.action.type
  const width = secWidth.value

  const suffix = isVariant.value ? '*' : ''

  if (width >= 30) return `${name}${suffix}`
  return `${TYPE_SHORTHAND[type] || '?'}${suffix}`
})

const isSelected = computed(() => store.isActionSelected(props.action.instanceId))

// 幽灵模式：触发窗口 < 0 时仅显示逻辑点，不显示实体框
const isGhostMode = computed(() => (props.action.triggerWindow || 0) < 0)

// 计算主题色
const themeColor = computed(() => {
  if (props.action.customColor) return props.action.customColor
  if (props.action.type === 'link') return store.getColor('link')
  if (props.action.type === 'execution') return store.getColor('execution')
  if (props.action.type === 'attack') return store.getColor('attack')
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

const actionLayout = computed(() => store.nodeRects[props.action.instanceId])

// 主体样式计算
const style = computed(() => {
  const layout = actionLayout.value
  if (!layout || !layout.rect) {
    return {}
  }
  const { left, width, height } = layout.rect
  const color = themeColor.value

  const layoutStyle = {
    position: 'absolute',
    top: '0',
    height: `${height}px`,
    left: `${left}px`,
    width: `${width}px`,
    boxSizing: 'border-box',
    zIndex: isSelected.value ? 20 : 10,
  }

  if (isGhostMode.value) {
    return {
      ...layoutStyle,
      border: 'none',
      backgroundColor: 'transparent',
      boxShadow: 'none',
      color: 'transparent',
      pointerEvents: isSelected.value ? 'auto' : 'none'
    }
  }

  let borderStyle = ''
  if (isSelected.value) {
    borderStyle = `2px dashed #ffffff`
  } else if (props.action.type === 'attack') {
    borderStyle = `1.5px solid ${hexToRgba(color, 0.4)}`
  } else {
    borderStyle = `2px dashed ${color}`
  }

  if (props.action.type === 'ultimate' && !props.action.isDisabled) {
    return {
      ...layoutStyle,
      border: `1.5px solid ${color}`,
      background: `radial-gradient(circle at center,
      ${hexToRgba(color, 0.5)} 0%,
      ${hexToRgba(color, 0.2)} 70%,
      ${hexToRgba(color, 0.1)} 100%)`,
      boxShadow: `0 0 15px ${hexToRgba(color, 0.5)}`,
      zIndex: isSelected.value ? 40 : 25,
      borderRadius: '2px',
      padding: '0 6px',
    }
  }

  if (props.action.type === 'link' && !props.action.isDisabled) {
    return {
      ...layoutStyle,
      border: `1.5px solid ${color}`,
      borderRadius: '2px',
      backgroundColor: hexToRgba(color, 0.15),
      boxShadow: isSelected.value ? `0 0 8px ${color}` : 'none',
      backdropFilter: 'blur(4px)',
      color: isSelected.value ? '#ffffff' : color,
      zIndex: isSelected.value ? 30 : 20
    }
  }

  if (props.action.isDisabled) {
    return {
      ...layoutStyle,
      border: `2px dashed #555`,
      backgroundColor: `rgba(40,40,40, 0.3)`,
      color: '#777',
      opacity: 0.6,
      backdropFilter: 'none',
      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.5) 5px, rgba(0,0,0,0.5) 10px)'
    }
  }

  return {
    ...layoutStyle,
    border: borderStyle,
    backgroundColor: hexToRgba(color, 0.15),
    backdropFilter: 'blur(4px)',
    color: isSelected.value ? '#ffffff' : color,
    boxShadow: isSelected.value ? `0 0 10px ${color}` : 'none'
  }
})

// 冷却条样式
const cdStyle = computed(() => {
  const layout = actionLayout.value

  if (!layout) {
    return { display: 'none' }
  }

  const widthUnit = store.timeBlockWidth
  const rawCd = props.action.cooldown || 0

  if (rawCd <= 0) return { display: 'none' }

  const width = rawCd * widthUnit
  return {
    width: `${width}px`,
    transform: `translate(${layout.bar.leftEdge}px, ${layout.bar.relativeY}px)`,
    opacity: 0.6
  }
})

// 强化时间样式
const enhancementStyle = computed(() => {
  const layout = actionLayout.value

  if (!layout) {
    return { display: 'none' }
  }

  const widthUnit = store.timeBlockWidth
  const time = props.action.enhancementTime || 0
  const width = time > 0 ? time * widthUnit : 0

  return { 
    width: `${width}px`, 
    transform: `translate(${layout.bar.rightEdge}px, ${layout.bar.relativeY}px)`,
    opacity: 0.8 
  }
})

// 触发窗口样式
const triggerWindowStyle = computed(() => {
  const layout = actionLayout.value

  if (!layout || !layout.triggerWindow || !layout.triggerWindow.hasWindow) {
    return { display: 'none' }
  }

  const width = layout.triggerWindow.rect.width
  const color = themeColor.value
  return { 
    '--tw-width': `${width}px`, 
    '--tw-color': color, 
    transform: layout.triggerWindow.localTransform
  }
})

// 自定义时间条
const customBarsToRender = computed(() => {
  const widthUnit = store.timeBlockWidth
  const bars = props.action.customBars || []
  return bars.map((bar, index) => {
    const originalDuration = bar.duration || 0
    const originalOffset = bar.offset || 0
    if (originalDuration <= 0) return null

    // 计算起始点的现实偏移
    const shiftedStartTimestamp = store.getShiftedEndTime(props.action.startTime, originalOffset, props.action.instanceId)
    const shiftedOffset = shiftedStartTimestamp - props.action.startTime

    // 计算受时停影响后的结束点，从而得出最终视觉时长
    const shiftedEndTimestamp = store.getShiftedEndTime(shiftedStartTimestamp, originalDuration, props.action.instanceId)
    const shiftedDuration = shiftedEndTimestamp - shiftedStartTimestamp

    // 计算延长量
    const extensionAmount = Math.round((shiftedDuration - originalDuration) * 1000) / 1000

    const left = (shiftedOffset * widthUnit) - 2
    const width = shiftedDuration * widthUnit
    const bottomOffset = -24 - (index * 16)

    return {
      style: { width: `${width}px`, left: `${left}px`, bottom: `${bottomOffset}px`, pointerEvents: 'none', opacity: 0.6, zIndex: 5 - index },
      text: bar.text, originalDuration, extensionAmount,
      displayDuration: Number(shiftedDuration.toFixed(1))
    }
  }).filter(item => item !== null)
})

// 计算动画时间的视觉宽度
const animationTimeWidth = computed(() => {
  const widthUnit = store.timeBlockWidth

  // 从 Store 的计算结果中找到属于自己的那一项
  const myExtension = store.globalExtensions.find(ext => ext.sourceId === props.action.instanceId)

  if (myExtension) {
    return myExtension.amount * widthUnit
  }

  return 0
})
// 辅助函数
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

const connectionSourceActionId = computed(() => {
  const node = store.resolveNode(connectionHandler.state.value.sourceId)
  if (!node) {
    return null
  }
  if (node.type === 'action') {
    return node.id
  }
  return node.actionId
})

// 计算判定点的位置样式
const renderableTicks = computed(() => {
  const ticks = props.action.damageTicks || []
  const widthUnit = store.timeBlockWidth

  return ticks.map(tick => {
    const originalOffset = tick.offset || 0
    const shiftedTimestamp = store.getShiftedEndTime(props.action.startTime, originalOffset, props.action.instanceId)
    const shiftedOffset = shiftedTimestamp - props.action.startTime

    const left = shiftedOffset * widthUnit
    return {
      style: { left: `${left}px` },
      data: tick
    }
  })
})

const renderableAnomalies = computed(() => {
  const raw = props.action.physicalAnomaly || []
  if (raw.length === 0) return []
  const rows = Array.isArray(raw[0]) ? raw : [raw]
  const resultRows = []

  let globalFlatIndex = 0

  rows.forEach((row, rowIndex) => {
    row.forEach((effect, colIndex) => {
      const myEffectIndex = globalFlatIndex++
      const effectId = effect._id
      
      const layout = store.effectLayouts.get(effectId)
      if (!layout) return

      resultRows.push({
        data: effect, 
        rowIndex, 
        colIndex, 
        flatIndex: myEffectIndex,
        style: { 
            transform: layout.localTransform, 
            zIndex: 15 + rowIndex
        },
        barWidth: layout.barData.width, 
        isConsumed: layout.barData.isConsumed, 
        displayDuration: layout.barData.displayDuration,
        extensionAmount: layout.barData.extensionAmount,
        effectId: effectId
      })
    })
  })
  return resultRows
})

const showPorts = computed(() => {
  if (isGhostMode.value) {
    return false
  }
  if (connectionHandler.isDragging.value) {
    if (store.hoveredActionId === props.action.instanceId && props.action.instanceId !== connectionHandler.state.value.sourceId) {
      return true
    }
    return false
  } else if (store.hoveredActionId === props.action.instanceId && connectionHandler.toolEnabled.value) {
    return true
  }
  return false
})

const isActionValidConnectionTarget = computed(() => {
  return connectionHandler.isNodeValid(props.action.instanceId)
})

function onIconClick(evt, item, flatIndex) {
  evt.stopPropagation()
  store.selectAnomaly(props.action.instanceId, item.rowIndex, item.colIndex)
}

function handleConnectionDrop(port) {
  connectionHandler.endDrag(props.action.instanceId, port)
}

function handleConnectionSnap(port, snapPos) {
  if (connectionHandler.isNodeValid(props.action.instanceId)) {
    connectionHandler.snapTo(props.action.instanceId, port, snapPos);
  }
}

function handleActionDragStart(startPos, port) {
  connectionHandler.newConnectionFrom(startPos, props.action.instanceId, port)
}

function handleEffectDragStart(event, effectId) {
  if (!connectionHandler.toolEnabled.value || connectionHandler.isDragging.value) {
    return
  }
  const effectLayout = store.effectLayouts.get(effectId)
  if (!effectLayout) return
  const rect = effectLayout.rect
  const timelinePoint = getRectPos(rect, 'right')
  connectionHandler.newConnectionFrom(timelinePoint, effectId, 'right')
}

function handleEffectSnap(event, effectId) {
  if (connectionSourceActionId.value !== props.action.instanceId) {
    if (!connectionHandler.isNodeValid(effectId)) {
      return
    }
    const effectLayout = store.effectLayouts.get(effectId)
    if (!effectLayout) return
    const rect = effectLayout.rect
    const timelinePoint = getRectPos(rect, 'left')
    connectionHandler.snapTo(effectId, 'left', timelinePoint)
  }
}

function handleEffectDrop(effectId) {
  connectionHandler.endDrag(effectId, 'left')
}
</script>

<template>
  <div :id="`action-${action.instanceId}`" ref="actionElRef" class="action-item-wrapper" :data-id="action.instanceId"
       :class="{ 'is-link-target-invalid': !isActionValidConnectionTarget && connectionSourceActionId !== action.instanceId }"
       @mouseenter="store.setHoveredAction(action.instanceId)"
       @mouseleave="store.setHoveredAction(null)"
       :style="style"
       @click.stop
       @dragstart.prevent>


    <div v-if="!isGhostMode && action.cooldown > 0" class="cd-bar-container bottom-bar" :style="cdStyle">
      <div class="cd-line" :style="{ backgroundColor: themeColor }"></div>

      <span class="cd-text" :style="{ color: themeColor }">{{ store.formatTimeLabel(action.cooldown) }}</span>

      <div class="cd-end-mark"
           :style="{
         backgroundColor: themeColor,
         zIndex: 1
       }">
      </div>
    </div>

    <div v-if="!isGhostMode && action.type === 'ultimate' && (action.enhancementTime || 0) > 0"
         class="cd-bar-container bottom-bar"
         :style="enhancementStyle">

      <div class="cd-line" style="background-color: #b37feb;"></div>
      <span class="cd-text" style="color: #b37feb;">{{ store.formatTimeLabel(action.enhancementTime) }}</span>
      <div class="cd-end-mark" style="background-color: #b37feb;"></div>

    </div>

    <template v-if="!isGhostMode">
      <div v-for="(barItem, idx) in customBarsToRender" :key="idx"
           class="custom-blue-bar bottom-bar" :style="barItem.style">
        <div class="cb-line"></div>
        <div class="cb-end-mark"></div>
        <span v-if="barItem.text" class="cb-label">{{ barItem.text }}</span>

        <span class="cb-duration">
          {{ store.formatTimeLabel(barItem.originalDuration) }}
          <span v-if="barItem.extensionAmount > 0" class="extension-label">(+{{ store.formatTimeLabel(barItem.extensionAmount) }})</span>
        </span>
      </div>
    </template>

    <div v-if="!isGhostMode" class="damage-ticks-layer">
      <div v-for="(tick, idx) in renderableTicks" :key="idx"
           class="damage-tick-wrapper"
           :style="tick.style"
           :title="`时间: ${store.formatTimeLabel(tick.data.offset)}\n失衡值: ${tick.data.stagger || 0}\n技力回复: ${tick.data.sp || 0}`">
        <div class="tick-marker"></div>
      </div>
    </div>

    <div v-if="action.triggerWindow && action.triggerWindow !== 0" class="trigger-window-bar bottom-bar" :style="triggerWindowStyle">
      <div class="tw-dot"></div>
      <div class="tw-separator"></div>
    </div>

    <div v-if="action.isLocked" class="status-icon lock-icon" title="位置已锁定">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>

    <div v-if="action.isDisabled" class="status-icon mute-icon" title="已禁用：不参与计算">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
      </svg>
    </div>

    <template v-if="action.type === 'ultimate' && !action.isDisabled">
      <div class="ultimate-side-bar left-bar" :style="{ backgroundColor: themeColor }"></div>
      <div class="ultimate-side-bar right-bar" :style="{ backgroundColor: themeColor }"></div>
    </template>

    <div v-if="!isGhostMode" class="action-item-content drag-handle" :class="{ 'is-link-target-invalid': !isActionValidConnectionTarget && connectionSourceActionId !== action.instanceId }">
      {{ displayLabel }}
      <div v-if="animationTimeWidth > 0"
           class="animation-phase-overlay"
           :style="{ width: `${animationTimeWidth}px` }">
        <div class="shimmer-bar"></div>
      </div>
    </div>

    <ActionLinkPorts @drop="handleConnectionDrop" @snap="handleConnectionSnap"
                     @drag-start="handleActionDragStart" @clear-snap="connectionHandler.clearSnap"
                     :isDragging="connectionHandler.isDragging.value"
                     :disabled="!isActionValidConnectionTarget"
                     :canStart="connectionHandler.toolEnabled.value"
                     :rect="store.nodeRects[action.instanceId]?.rect"
                     v-if="showPorts"
                     :color="themeColor" />

    <div v-if="!isGhostMode" class="anomalies-overlay">
      <div v-for="(item, index) in renderableAnomalies" :key="`${item.rowIndex}-${item.colIndex}`"
           class="anomaly-wrapper" :style="item.style" :data-id="item.effectId">

        <div :id="item.effectId"
             class="anomaly-icon-box"
             :class="{ 'is-linking': connectionHandler.isDragging.value, 'is-link-target-valid': connectionHandler.isNodeValid(item.data._id) }"
             @mousedown.stop="handleEffectDragStart($event, item.data._id)"
             @mouseover.stop="handleEffectSnap($event, item.data._id)"
             @mouseup.stop="handleEffectDrop(item.data._id)"
             @mouseleave="connectionHandler.clearSnap()"
             @click.stop="onIconClick($event, item, index)">

          <img :src="getIconPath(item.data.type)" class="anomaly-icon" />
          <div v-if="item.data.stacks > 1" class="anomaly-stacks">{{ item.data.stacks }}</div>
        </div>

        <div class="anomaly-duration-bar"
           v-if="!item.data.hideDuration"
           :style="{width: `${item.barWidth}px`,backgroundColor: getEffectColor(item.data.type),display: (item.displayDuration > 0 || item.data.duration > 0 || item.isConsumed) ? 'flex' : 'none'}"
           :class="{ 'is-consumed-bar': item.isConsumed }">

          <div class="striped-bg"></div>
          <span class="duration-text">
            {{ store.formatTimeLabel(item.isConsumed ? item.displayDuration : item.data.duration) }}
            <span v-if="!item.isConsumed && item.extensionAmount > 0" class="extension-label">
              (+{{ store.formatTimeLabel(item.extensionAmount) }})
            </span>
          </span>

          <div v-if="item.isConsumed"
               :id="`${item.effectId}_transfer`"
               class="transfer-node-wrapper">
            <div class="transfer-node"></div>
            <div class="transfer-line"></div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* === 基础容器 === */
.action-item-wrapper {
  display: flex; align-items: center; justify-content: center;
  white-space: nowrap; cursor: grab; user-select: none;
  position: relative; overflow: visible;
  transition: background-color 0.2s, box-shadow 0.2s, filter 0.2s;
  font-weight: bold; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
.action-item-wrapper:hover { filter: brightness(1.2); z-index: 50 !important; }

/* === 异常状态层 === */
.anomalies-overlay { position: absolute; top: 0; left: -1px; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.anomaly-wrapper { position: absolute; display: flex; align-items: center; pointer-events: none; white-space: nowrap; bottom: 100% }

/* 图标样式 */
.anomaly-icon-box {
  width: 20px; height: 20px; background-color: #333; border: 1px solid #999;
  box-sizing: border-box; display: flex; align-items: center; justify-content: center;
  position: relative; z-index: 10; flex-shrink: 0; pointer-events: auto; cursor: pointer;
  transition: transform 0.1s, border-color 0.1s, box-shadow 0.2s;
}
.anomaly-icon-box:hover { border-color: #ffd700; transform: scale(1.2); z-index: 20; }
.anomaly-icon-box.is-linking {
  opacity: 0.5;
  pointer-events: none;
}
.anomaly-icon-box.is-linking.is-link-target-valid {
  opacity: 1;
  pointer-events: auto;
  border-color: #fff; box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
  transform: scale(1.1); animation: pulse-target 1s infinite; z-index: 100;
}
@keyframes pulse-target {
  0% { box-shadow: 0 0 0 rgba(255,255,255,0.4); } 70% { box-shadow: 0 0 10px rgba(255,255,255,0); } 100% { box-shadow: 0 0 0 rgba(255,255,255,0); }
}
.anomaly-icon { width: 100%; height: 100%; object-fit: cover; }
.anomaly-stacks {
  position: absolute; bottom: -2px; right: -2px; background: rgba(0, 0, 0, 0.8);
  color: #ffd700; font-size: 8px; padding: 0 2px; line-height: 1; border-radius: 2px;
}

.status-icon {
  position: absolute;
  top: 2px;
  font-size: 10px;
  z-index: 25;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));
  pointer-events: none;
}
.lock-icon {
  left: 2px;
}
.mute-icon {
  right: 2px;
}

.action-item-content {
  &.is-link-target-invalid {
    opacity: 0.5;
  }
}

/* 伤害节点样式 */
.damage-ticks-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 12;
}

.damage-tick-wrapper {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 12px;
  margin-left: -6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  pointer-events: auto;
  z-index: 20;
}

.tick-marker {
  width: 6px;
  height: 6px;
  background-color: #ff4d4f;
  border: 1px solid #333;
  transform: translateY(50%) rotate(45deg);
  box-shadow: 0 1px 2px rgba(0,0,0,0.5);
  transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.damage-tick-wrapper:hover .tick-marker {
  background-color: #ffd700;
  border-color: #fff;
  transform: translateY(50%) rotate(45deg) scale(2.0);
  box-shadow: 0 0 8px rgba(255, 215, 0, 1);
  z-index: 30;
}

/* === 时长条样式 === */
.anomaly-duration-bar {
  height: 16px; border: none; border-radius: 2px; position: relative;
  display: flex; align-items: center; overflow: visible;
  box-sizing: border-box; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  z-index: 1; margin-left: 2px;
}
.is-consumed-bar { opacity: 0.95; border-right: none; }
.striped-bg {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;
  background: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2) 2px, transparent 2px, transparent 6px);
}
.duration-text {
  position: absolute; left: 4px; font-size: 11px; color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8); z-index: 2; font-weight: bold; line-height: 1; font-family: sans-serif;
}

/* === 被消耗节点 === */
.transfer-node-wrapper {
  position: absolute; right: -6px; top: 50%; transform: translateY(-50%);
  width: 12px; height: 12px; display: flex; align-items: center; justify-content: center;
  z-index: 20; pointer-events: none;
}
.transfer-node {
  width: 6px; height: 6px; background-color: #fff; border: 1px solid #ffd700;
  transform: rotate(45deg); box-shadow: 0 0 4px #ffd700, 0 0 8px rgba(255, 215, 0, 0.6);
  position: relative; z-index: 2;
}
.transfer-line {
  position: absolute;
  width: 2px;
  height: 14px;
  background-color: #fff;
  border-radius: 1px;
  box-shadow: 0 0 2px rgba(0,0,0,0.5);
  z-index: 1;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

/* === 其他样式 === */
.bottom-bar { 
  bottom: 0;
  left: 0;
  position: absolute;
 }

.cd-bar-container { position: absolute; height: 2px; display: flex; align-items: center; pointer-events: none; }
.cd-line { flex-grow: 1; height: 2px; }
.cd-text { position: absolute; left: 0; top: 4px; font-size: 10px; font-weight: bold; line-height: 1; }
.cd-end-mark { position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 1px; height: 8px; }

.custom-blue-bar { height: 2px; display: flex; align-items: center; color: #69c0ff; z-index: 5; }
.cb-line { flex-grow: 1; height: 2px; background-color: #69c0ff; }
.cb-label {
  position: absolute; right: 100%; margin-right: 6px; top: 50%; transform: translateY(-50%);
  font-size: 10px; font-weight: bold; white-space: nowrap; line-height: 1; color: #69c0ff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}
.cb-duration { position: absolute; left: 0; top: 4px; font-size: 10px; font-weight: bold; line-height: 1; color: #69c0ff; display: flex; align-items: center; }
.cb-end-mark { position: absolute; right: 0; width: 1px; height: 8px; background-color: #69c0ff; top: 50%; transform: translateY(-50%); }

.trigger-window-bar {
  position: absolute; --tw-width: 0px; --tw-color: transparent;
  width: var(--tw-width); height: 2px;
  display: flex; align-items: center; pointer-events: auto; cursor: pointer; z-index: 5;
}
.trigger-window-bar::after { content: ''; position: absolute; top: -4px; bottom: -4px; left: 0; right: 0; background: transparent; }
.trigger-window-bar::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); height: 2px; background-color: var(--tw-color); opacity: 1; border-radius: 2px 0 0 2px; }
.tw-separator { position: absolute; right: 0; top: -2px; width: 1px; height: 8px; background-color: var(--tw-color); transform: translateX(50%); }
.tw-dot { position: absolute; left: 0; top: 50%; width: 1px; height: 8px; background-color: var(--tw-color); border-radius: 0; z-index: 6; transform: translate(-50%, -50%); }

.ultimate-side-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  z-index: 2;
  pointer-events: none;
}

.left-bar {
  left: 0;
  border-radius: 2px 0 0 2px;
}

.right-bar {
  right: 0;
  border-radius: 0 2px 2px 0;
}

.animation-phase-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  max-width: calc(100% - 1px);
  pointer-events: none;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 1;
}

.shimmer-bar {
  position: absolute;
  inset: 0;
  width: 200%;
  background: linear-gradient(
    90deg, 
    rgba(255, 255, 255, 0) 0%, 
    rgba(255, 255, 255, 0.15) 50%, 
    rgba(255, 255, 255, 0) 100%
  );
  will-change: transform;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { 
    transform: translateX(-100%); 
  }
  100% { 
    transform: translateX(50%); 
  }
}
</style>