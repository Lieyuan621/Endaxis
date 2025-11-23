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

// ===================================================================================
// 1. 样式计算 (Style Logic)
// ===================================================================================

/**
 * 计算动作块的主题色
 * 优先级：自定义 > 特殊类型(Link/Exec) > 自身属性(Element) > 干员属性 > 默认
 */
const themeColor = computed(() => {
  // 1. 自定义覆盖
  if (props.action.customColor) return props.action.customColor

  // 2. 特殊类型优先
  if (props.action.type === 'link') return store.getColor('link')
  if (props.action.type === 'execution') return store.getColor('execution')
  if (props.action.type === 'attack') return store.getColor('physical') // 重击强制物理色

  // 3. 自身属性 (DataEditor 中设置的 skill_element 等)
  if (props.action.element) {
    return store.getColor(props.action.element)
  }

  // 4. 继承干员属性 (兼容旧逻辑)
  // 这是一个稍显昂贵的查找，但 Vue computed 会缓存结果
  let charId = null
  for (const track of store.tracks) {
    if (track.actions.some(a => a.instanceId === props.action.instanceId)) {
      charId = track.id; break
    }
  }
  if (charId) return store.getCharacterElementColor(charId)

  // 5. 兜底
  return store.getColor('default')
})

/**
 * 主容器样式：位置、尺寸、玻璃拟态背景
 */
const style = computed(() => {
  const widthUnit = store.timeBlockWidth
  const left = (props.action.startTime || 0) * widthUnit
  const width = (props.action.duration || 1) * widthUnit
  const finalWidth = width < 2 ? 2 : width
  const color = themeColor.value

  return {
    position: 'absolute', top: '0', height: '100%',
    left: `${left}px`, width: `${finalWidth}px`,
    boxSizing: 'border-box',
    zIndex: isSelected.value ? 20 : 10,
    // 视觉：同色系虚线框 + 半透明背景
    border: `2px dashed ${isSelected.value ? '#ffffff' : color}`,
    backgroundColor: hexToRgba(color, 0.15),
    backdropFilter: 'blur(4px)',
    color: isSelected.value ? '#ffffff' : color,
    boxShadow: isSelected.value ? `0 0 10px ${color}` : 'none'
  }
})

/**
 * 冷却条样式 (底部细线)
 */
const cdStyle = computed(() => {
  const widthUnit = store.timeBlockWidth
  const cd = props.action.cooldown || 0
  const width = cd > 0 ? (cd + 1) * widthUnit : 0
  return {
    width: `${width}px`, bottom: '-8px', left: '0',
    opacity: 0.6
  }
})

/**
 * 计算异常状态条的布局 (位置偏移)
 */
function getAnomalyRowStyle(effect, index) {
  const widthUnit = store.timeBlockWidth
  const duration = effect.duration || 0
  const bottomOffset = 100 + (index * 50)
  return {
    width: `calc(${duration * widthUnit}px + 21.5px)`,
    bottom: `${bottomOffset}%`,
    left: 'calc(100% - 20px)',
    position: 'absolute',
    marginBottom: '4px',
    zIndex: 15 + index
  }
}

/**
 * 获取状态条背景色
 */
function getEffectColor(type) {
  return store.getColor(type)
}

/**
 * 获取图标路径 (优先专属，其次通用)
 */
function getIconPath(type) {
  // 尝试查找专属图标
  // 注意：这里为了简化，每次渲染都会遍历查找，如果性能敏感可以优化到 computed 或 store
  let charId = null;
  for (const track of store.tracks) {
    if (track.actions.some(a => a.instanceId === props.action.instanceId)) { charId = track.id; break; }
  }
  if (charId) {
    const charInfo = store.characterRoster.find(c => c.id === charId);
    if (charInfo?.exclusive_buffs) {
      const exclusive = charInfo.exclusive_buffs.find(b => b.key === type);
      if (exclusive?.path) return exclusive.path;
    }
  }
  return (iconDatabase.value && iconDatabase.value[type]) ? iconDatabase.value[type] : (iconDatabase.value?.['default'] || '');
}

// ===================================================================================
// 2. 工具函数 (Utils)
// ===================================================================================

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`
  let c = hex.substring(1).split('')
  if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]]
  c = '0x' + c.join('')
  return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')'
}

// ===================================================================================
// 3. 交互逻辑 (Interaction)
// ===================================================================================

function onDeleteClick() {
  store.removeAction(props.action.instanceId)
}

function onIconClick(evt, index) {
  evt.stopPropagation();
  if (store.isLinking) {
    store.confirmLinking(props.action.instanceId, index)
  } else {
    store.selectAction(props.action.instanceId)
  }
}
</script>

<template>
  <div :id="`action-${action.instanceId}`" class="action-item-wrapper" :style="style" @click.stop @dragstart.prevent>

    <div class="action-item-content drag-handle">{{ action.name }}</div>

    <div v-if="isSelected" class="delete-btn-modern" @click.stop="onDeleteClick" title="删除 (Delete)">
      <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>

    <div v-if="action.cooldown > 0" class="cd-bar-container" :style="cdStyle">
      <div class="cd-line" :style="{ backgroundColor: themeColor }"></div>
      <span class="cd-text" :style="{ color: themeColor }">{{ action.cooldown }}s</span>
      <div class="cd-end-mark" :style="{ backgroundColor: themeColor }"></div>
    </div>

    <div class="anomalies-overlay">
      <div v-for="(effect, index) in action.physicalAnomaly" :key="index" class="anomaly-row" :style="getAnomalyRowStyle(effect, index)">

        <div class="anomaly-icon-box"
             :id="`anomaly-${action.instanceId}-${index}`"
             @mousedown.stop="onIconClick($event, index)"
             @click.stop>
          <img :src="getIconPath(effect.type)" class="anomaly-icon"/>
          <div v-if="effect.stacks > 1" class="anomaly-stacks">{{ effect.stacks }}</div>
        </div>

        <div class="anomaly-duration-bar" v-if="effect.duration > 0"
             :style="{ backgroundColor: getEffectColor(effect.type) }">
          <div class="striped-bg"></div>
          <span class="duration-text">{{ effect.duration }}s</span>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* 基础容器 */
.action-item-wrapper {
  display: flex; align-items: center; justify-content: center;
  white-space: nowrap; cursor: grab; user-select: none; position: relative; overflow: visible;
  transition: background-color 0.2s, box-shadow 0.2s, filter 0.2s;
  font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}
.action-item-wrapper:hover { filter: brightness(1.2); z-index: 50 !important; }

.anomalies-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.anomaly-row { display: flex; align-items: center; height: 22px; pointer-events: none; }

/* 图标盒子 */
.anomaly-icon-box {
  width: 20px; height: 20px; background-color: #333; border: 1px solid #999; box-sizing: border-box;
  display: flex; align-items: center; justify-content: center; position: relative; z-index: 100;
  flex-shrink: 0; pointer-events: auto; cursor: pointer; transition: transform 0.1s, border-color 0.1s;
  margin-right: 3px;
}
.anomaly-icon-box:hover { border-color: #ffd700; transform: scale(1.2); z-index: 101; }
.anomaly-icon { width: 100%; height: 100%; object-fit: cover; }
.anomaly-stacks { position: absolute; bottom: -2px; right: -2px; background-color: rgba(0, 0, 0, 0.8); color: #ffd700; font-size: 8px; padding: 0 2px; border-radius: 2px; line-height: 1; }

/* 状态条 */
.anomaly-duration-bar {
  flex-grow: 1; height: 16px; border: none; border-radius: 2px;
  position: relative; display: flex; align-items: center; overflow: hidden; box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.striped-bg {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;
  background: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2) 2px, transparent 2px, transparent 6px);
}

.duration-text {
  position: absolute; left: 4px; font-size: 11px; color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8); z-index: 2; font-weight: bold; line-height: 1; font-family: sans-serif;
}

/* 冷却条 */
.cd-bar-container { position: absolute; height: 4px; display: flex; align-items: center; pointer-events: none; }
.cd-line { flex-grow: 1; height: 2px; margin-top: 1px; opacity: 0.6; }
.cd-text { position: absolute; left: 0; top: 4px; font-size: 10px; font-weight: bold; line-height: 1; }
.cd-end-mark { position: absolute; right: 0; top: -2px; width: 1px; height: 8px; }

/* 删除按钮 */
.delete-btn-modern {
  position: absolute; top: -8px; right: -8px; width: 18px; height: 18px;
  background-color: #333; border: 1px solid #666; color: #ccc; border-radius: 4px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 30;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4); transition: all 0.2s ease;
}
.delete-btn-modern:hover { background-color: #d32f2f; border-color: #d32f2f; color: white; transform: scale(1.1); }
</style>