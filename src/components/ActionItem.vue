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

// 幽灵模式：triggerWindow < 0 时仅显示逻辑点，不显示实体框
const isGhostMode = computed(() => (props.action.triggerWindow || 0) < 0)

// 计算主题色
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

// 主体样式计算
const style = computed(() => {
  const widthUnit = store.timeBlockWidth
  const left = (props.action.startTime || 0) * widthUnit
  const width = (props.action.duration || 1) * widthUnit
  const finalWidth = width < 2 ? 2 : width
  const color = themeColor.value

  const baseStyle = {
    position: 'absolute',
    top: '0',
    height: '100%',
    left: `${left}px`,
    width: `${finalWidth}px`,
    boxSizing: 'border-box',
    zIndex: isSelected.value ? 20 : 10,
  }

  if (isGhostMode.value) {
    return {
      ...baseStyle,
      border: 'none',
      backgroundColor: 'transparent',
      boxShadow: 'none',
      color: 'transparent',
      pointerEvents: isSelected.value ? 'auto' : 'none'
    }
  }

  return {
    ...baseStyle,
    border: `2px dashed ${isSelected.value ? '#ffffff' : color}`,
    backgroundColor: hexToRgba(color, 0.15),
    backdropFilter: 'blur(4px)',
    color: isSelected.value ? '#ffffff' : color,
    boxShadow: isSelected.value ? `0 0 10px ${color}` : 'none'
  }
})

// 冷却条样式
const cdStyle = computed(() => {
  const widthUnit = store.timeBlockWidth
  const cd = props.action.cooldown || 0
  const width = cd > 0 ? cd * widthUnit : 0
  return { width: `${width}px`, bottom: '-8px', left: '-2px', opacity: 0.6 }
})

// 触发窗口样式
const triggerWindowStyle = computed(() => {
  const widthUnit = store.timeBlockWidth
  const rawWindow = props.action.triggerWindow || 0
  if (rawWindow === 0) return { display: 'none' }
  const snappedWindow = Math.round(Math.abs(rawWindow) * 10) / 10
  const width = snappedWindow * widthUnit
  const color = themeColor.value
  return { '--tw-width': `${width}px`, '--tw-color': color, right: 'calc(100% + 2px)' }
})

// 自定义时间条
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

const renderableAnomalies = computed(() => {
  const raw = props.action.physicalAnomaly || []
  if (raw.length === 0) return []

  const rows = Array.isArray(raw[0]) ? raw : [raw]
  const rowDelays = props.action.anomalyRowDelays || []
  const widthUnit = store.timeBlockWidth
  const ICON_SIZE = 20
  const GAP = 2
  const BAR_MARGIN = 2

  const resultRows = []

  // 获取从本动作出发的所有连线
  const myConnections = store.connections.filter(c => c.from === props.action.instanceId)

  let globalFlatIndex = 0 // 这个仅用于生成唯一的 key 或 id，不再用于匹配连线

  rows.forEach((row, rowIndex) => {
    const startDelay = rowDelays[rowIndex] || 0
    let currentDurationOffset = startDelay
    let currentLeft = startDelay * widthUnit

    const processedRow = row.map((effect, colIndex) => {
      const myEffectIndex = globalFlatIndex++
      const originalDurationWidth = effect.duration > 0 ? (effect.duration * widthUnit) : 0

      let displayDuration = effect.duration
      let isConsumed = false

      let conn = null
      if (effect._id) {
        conn = myConnections.find(c => c.fromEffectId === effect._id)
      }
      if (!conn) {
        conn = myConnections.find(c => !c.fromEffectId && c.fromEffectIndex === myEffectIndex)
      }

      if (conn && conn.isConsumption) {
        const targetTrack = store.tracks.find(t => t.actions.some(a => a.instanceId === conn.to))
        const targetAction = targetTrack?.actions.find(a => a.instanceId === conn.to)

        if (targetAction) {
          const myAbsStartTime = props.action.startTime + currentDurationOffset

          const offset = conn.consumptionOffset || 0

          const consumptionTime = targetAction.startTime - offset

          const cutDuration = consumptionTime - myAbsStartTime
          const snappedCutDuration = Math.round(cutDuration * 10) / 10

          if (snappedCutDuration >= 0) {
            displayDuration = snappedCutDuration
            isConsumed = true
          }
        }
      }

      let finalBarWidth = displayDuration > 0 ? (displayDuration * widthUnit) : 0
      if (finalBarWidth > 0) {
        finalBarWidth = Math.max(0, finalBarWidth - ICON_SIZE)
      }
      if (finalBarWidth > 0) finalBarWidth = Math.max(0, finalBarWidth - BAR_MARGIN)

      const itemLayout = {
        data: effect,
        rowIndex,
        colIndex,
        flatIndex: myEffectIndex,
        style: {
          left: `${currentLeft}px`,
          bottom: `${100 + (rowIndex * 50)}%`,
          position: 'absolute',
          zIndex: 15 + rowIndex
        },
        barWidth: finalBarWidth,
        isConsumed,
        displayDuration,
        originalDuration: effect.duration
      }

      currentDurationOffset += effect.duration
      const originalBarRenderWidth = Math.max(0, originalDurationWidth - ICON_SIZE - BAR_MARGIN)
      const spaceTaken = ICON_SIZE + (originalDurationWidth > 0 ? (BAR_MARGIN + originalBarRenderWidth) : 0) + GAP
      currentLeft += spaceTaken

      return itemLayout
    })
    resultRows.push(processedRow)
  })
  return resultRows.flat()
})

function onDeleteClick() { store.removeAction(props.action.instanceId) }
function onIconClick(evt, item, flatIndex) {
  evt.stopPropagation()
  if (store.isLinking) {
    store.confirmLinking(props.action.instanceId, flatIndex)
  } else {
    store.selectAnomaly(props.action.instanceId, item.rowIndex, item.colIndex)
  }
}
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

        <div :id="`anomaly-${action.instanceId}-${index}`"
             class="anomaly-icon-box"
             :class="{
                'is-logic-tick': item.data.type === 'logic_tick',
                'is-link-target': store.isLinking && store.linkingSourceId !== action.instanceId
             }"
             @mousedown.stop="onIconClick($event, item, index)"
             @click.stop>
          <img :src="getIconPath(item.data.type)" class="anomaly-icon"/>
          <div v-if="item.data.stacks > 1" class="anomaly-stacks">{{ item.data.stacks }}</div>
        </div>

        <div class="anomaly-duration-bar"
             v-if="(item.displayDuration > 0 || item.data.duration > 0) && !item.data.hideDuration"
             :style="{ width: `${item.barWidth}px`, backgroundColor: getEffectColor(item.data.type) }"
             :class="{ 'is-consumed-bar': item.isConsumed }">

          <div class="striped-bg"></div>
          <span class="duration-text">
            {{ item.isConsumed ? item.displayDuration.toFixed(1) + 's' : item.data.duration + 's' }}
          </span>

          <div v-if="item.isConsumed"
               :id="`transfer-${action.instanceId}-${item.flatIndex}`"
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
.anomaly-wrapper { display: flex; align-items: center; height: 22px; pointer-events: none; white-space: nowrap; }

/* 图标样式 */
.anomaly-icon-box {
  width: 20px; height: 20px; background-color: #333; border: 1px solid #999;
  box-sizing: border-box; display: flex; align-items: center; justify-content: center;
  position: relative; z-index: 10; flex-shrink: 0; pointer-events: auto; cursor: pointer;
  transition: transform 0.1s, border-color 0.1s, box-shadow 0.2s;
}
.anomaly-icon-box:hover { border-color: #ffd700; transform: scale(1.2); z-index: 20; }
.anomaly-icon-box.is-link-target {
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

/* === 时长条样式 === */
.anomaly-duration-bar {
  height: 16px; border: none; border-radius: 2px; position: relative;
  display: flex; align-items: center; overflow: visible;
  box-sizing: border-box; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  z-index: 1; margin-left: 2px; transition: width 0.1s linear;
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
  position: absolute; width: 2px; height: 14px; background-color: #fff;
  border-radius: 1px; box-shadow: 0 0 2px rgba(0,0,0,0.5); z-index: 1;
}

/* === 其他样式 === */
.anomaly-icon-box.is-logic-tick {
  width: 8px; height: 8px; border-radius: 50%; background-color: #ffd700;
  border: none; margin-top: 6px; box-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
}
.anomaly-icon-box.is-logic-tick .anomaly-icon, .anomaly-icon-box.is-logic-tick .anomaly-stacks { display: none; }
.anomaly-icon-box.is-logic-tick:hover { transform: scale(1.5); background-color: #fff; }

.cd-bar-container { position: absolute; height: 4px; display: flex; align-items: center; pointer-events: none; }
.cd-line { flex-grow: 1; height: 2px; }
.cd-text { position: absolute; left: 0; top: 4px; font-size: 10px; font-weight: bold; line-height: 1; }
.cd-end-mark { position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 1px; height: 8px; }

.custom-blue-bar { height: 4px; display: flex; align-items: center; color: #69c0ff; z-index: 5; }
.cb-line { flex-grow: 1; height: 2px; background-color: #69c0ff; }
.cb-label {
  position: absolute; right: 100%; margin-right: 6px; top: 50%; transform: translateY(-50%);
  font-size: 10px; font-weight: bold; white-space: nowrap; line-height: 1; color: #69c0ff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}
.cb-duration { position: absolute; left: 0; top: 4px; font-size: 10px; font-weight: bold; line-height: 1; color: #69c0ff; }
.cb-end-mark { position: absolute; right: 0; width: 1px; height: 8px; background-color: #69c0ff; top: 50%; transform: translateY(-50%); }

.trigger-window-bar {
  position: absolute; --tw-width: 0px; --tw-color: transparent;
  width: var(--tw-width); height: 4px; bottom: -8px; right: 100%;
  display: flex; align-items: center; pointer-events: auto; cursor: pointer; z-index: 5;
}
.trigger-window-bar::after { content: ''; position: absolute; top: -4px; bottom: -4px; left: 0; right: 0; background: transparent; }
.trigger-window-bar::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); height: 3px; background-color: var(--tw-color); opacity: 1; border-radius: 2px 0 0 2px; }
.tw-separator { position: absolute; right: 0; top: -2px; width: 1px; height: 8px; background-color: var(--tw-color); transform: translateX(50%); }
.tw-dot { position: absolute; left: 0; top: 50%; width: 1px; height: 8px; background-color: var(--tw-color); border-radius: 0; z-index: 6; transform: translate(-50%, -50%); }

.delete-btn-modern {
  position: absolute; top: -8px; right: -8px; width: 18px; height: 18px;
  background-color: #333; border: 1px solid #666; color: #ccc; border-radius: 4px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  z-index: 30; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4); transition: all 0.2s ease;
}
.delete-btn-modern:hover { background-color: #d32f2f; border-color: #d32f2f; color: white; transform: scale(1.1); }
</style>