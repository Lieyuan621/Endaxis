<script setup>
import { computed } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'

const props = defineProps({
  action: { type: Object, required: true }
})

const store = useTimelineStore()
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

  const layoutStyle = {
    position: 'absolute',
    top: '0',
    height: '100%',
    left: `${left}px`,
    width: `${finalWidth}px`,
    boxSizing: 'border-box',
    zIndex: isSelected.value ? 20 : 10,
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

  return {
    ...layoutStyle,
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
  const rawCd = props.action.cooldown || 0
  if (rawCd <= 0) return { display: 'none' }
  const reduction = store.calculateCdReduction(props.action.startTime, rawCd, props.action.instanceId)
  const visualCd = Math.max(0, rawCd - reduction)
  const width = visualCd * widthUnit
  return { width: `${width}px`, bottom: '-8px', left: '-2px', opacity: 0.6, transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1)' }
})

// 强化时间样式
const enhancementStyle = computed(() => {
  const widthUnit = store.timeBlockWidth
  const time = props.action.enhancementTime || 0
  const width = time > 0 ? time * widthUnit : 0
  return { width: `${width}px`, bottom: '-8px', left: 'calc(100% + 2px)', opacity: 0.8 }
})

// 触发窗口样式
const triggerWindowStyle = computed(() => {
  const widthUnit = store.timeBlockWidth
  const rawWindow = props.action.triggerWindow || 0
  const snappedWindow = Math.round(Math.abs(rawWindow) * 10) / 10
  if (rawWindow === 0 || snappedWindow === 0) {
    return { display: 'none' }
  }
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

// 计算判定点的位置样式
const renderableTicks = computed(() => {
  const ticks = props.action.damageTicks || []
  const widthUnit = store.timeBlockWidth

  return ticks.map(tick => {
    const left = (tick.offset || 0) * widthUnit
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
  const widthUnit = store.timeBlockWidth
  const ICON_SIZE = 20
  const BAR_MARGIN = 2

  const resultRows = []

  // 获取从本动作出发的所有连线
  const myConnections = store.connections.filter(c => c.from === props.action.instanceId)

  let globalFlatIndex = 0

  rows.forEach((row, rowIndex) => {
    const processedRow = row.map((effect, colIndex) => {
      const myEffectIndex = globalFlatIndex++

      const offsetTime = Number(effect.offset) || 0
      const currentLeft = offsetTime * widthUnit

      let displayDuration = effect.duration || 0
      let isConsumed = false

      // 连线消耗逻辑
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
          const visualAbsStartTime = props.action.startTime + offsetTime

          const offset = conn.consumptionOffset || 0
          const consumptionTime = targetAction.startTime - offset

          const cutDuration = consumptionTime - visualAbsStartTime
          const snappedCutDuration = Math.round(cutDuration * 10) / 10

          if (snappedCutDuration >= 0) {
            displayDuration = snappedCutDuration
            isConsumed = true
          }
        }
      }

      // 计算时长条的像素宽度
      let finalBarWidth = displayDuration > 0 ? (displayDuration * widthUnit) : 0
      if (finalBarWidth > 0) {
        finalBarWidth = Math.max(0, finalBarWidth - ICON_SIZE)
      }
      if (finalBarWidth > 0) {
        finalBarWidth = Math.max(0, finalBarWidth - BAR_MARGIN)
      }

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

      return itemLayout
    })
    resultRows.push(processedRow)
  })
  return resultRows.flat()
})

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
  <div :id="`action-${action.instanceId}`" class="action-item-wrapper" @mouseenter="store.setHoveredAction(action.instanceId)" @mouseleave="store.setHoveredAction(null)":style="style" @click.stop @dragstart.prevent>

    <div v-if="!isGhostMode && action.cooldown > 0" class="cd-bar-container" :style="cdStyle">
      <div class="cd-line" :style="{ backgroundColor: themeColor }"></div>

      <span class="cd-text" :style="{ color: themeColor }">
      {{ action.cooldown }}s
        <span v-if="store.calculateCdReduction(action.startTime, action.cooldown, action.instanceId) > 0"
          style="font-size:9px; opacity: 0.8;">
          (-{{ store.calculateCdReduction(action.startTime, action.cooldown, action.instanceId).toFixed(1) }})
        </span>
      </span>

      <div class="cd-end-mark"
           :style="{
         backgroundColor: themeColor,
         zIndex: 1
       }">
      </div>
    </div>

    <div v-if="!isGhostMode && action.type === 'ultimate' && (action.enhancementTime || 0) > 0"
         class="cd-bar-container"
         :style="enhancementStyle">

      <div class="cd-line" style="background-color: #b37feb;"></div>
      <span class="cd-text" style="color: #b37feb;">{{ action.enhancementTime }}s</span>
      <div class="cd-end-mark" style="background-color: #b37feb;"></div>

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

    <div v-if="!isGhostMode" class="damage-ticks-layer">
      <div v-for="(tick, idx) in renderableTicks" :key="idx"
           class="damage-tick-wrapper"
           :style="tick.style"
           :title="`时间: ${tick.data.offset}s\n失衡值: ${tick.data.stagger || 0}\n技力回复: ${tick.data.sp || 0}`">
        <div class="tick-marker"></div>
      </div>
    </div>

    <div v-if="action.triggerWindow && action.triggerWindow !== 0" class="trigger-window-bar" :style="triggerWindowStyle">
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

    <div v-if="!isGhostMode" class="action-item-content drag-handle">{{ action.name }}</div>

    <div v-if="!isGhostMode" class="anomalies-overlay">
      <div v-for="(item, index) in renderableAnomalies" :key="`${item.rowIndex}-${item.colIndex}`"
           class="anomaly-wrapper" :style="item.style">

        <div :id="`anomaly-${action.instanceId}-${index}`"
             class="anomaly-icon-box"
             :class="{ 'is-link-target': store.isLinking && store.linkingSourceId !== action.instanceId }"
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
.trigger-window-bar::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); height: 2px; background-color: var(--tw-color); opacity: 1; border-radius: 2px 0 0 2px; }
.tw-separator { position: absolute; right: 0; top: -2px; width: 1px; height: 8px; background-color: var(--tw-color); transform: translateX(50%); }
.tw-dot { position: absolute; left: 0; top: 50%; width: 1px; height: 8px; background-color: var(--tw-color); border-radius: 0; z-index: 6; transform: translate(-50%, -50%); }

</style>