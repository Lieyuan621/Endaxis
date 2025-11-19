<script setup>
import { computed, inject } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { storeToRefs } from 'pinia'

const props = defineProps({
  action: {
    type: Object,
    required: true
  }
})

const TIME_BLOCK_WIDTH = inject('TIME_BLOCK_WIDTH', 50)
const store = useTimelineStore()
const { iconDatabase } = storeToRefs(store)

const isSelected = computed(() => store.selectedActionId === props.action.instanceId)

const typeClass = computed(() => {
  switch (props.action.type) {
    case 'link': return 'style-link'       // 连携：黄框
    default: return 'style-normal'         // 其他：默认样式
  }
})

const style = computed(() => {
  const left = (props.action.startTime || 0) * TIME_BLOCK_WIDTH
  const width = (props.action.duration || 1) * TIME_BLOCK_WIDTH

  return {
    position: 'absolute',
    top: '0',
    height: '100%',
    left: `${left}px`,
    width: `${width}px`,
    // 选中时强制显示橙色高亮边框
    border: isSelected.value ? '2px solid #ffaa00' : undefined,
    boxSizing: 'border-box',
    zIndex: isSelected.value ? 20 : 10,
  }
})

// 计算 CD 条的样式
const cdStyle = computed(() => {
  const cd = props.action.cooldown || 0
  const width = cd > 0 ? (cd + 1) * TIME_BLOCK_WIDTH : 0

  return {
    width: `${width}px`,
    bottom: '-8px',
    left: '0',
  }
})

function getAnomalyBarStyle(effect, index) {
  const duration = effect.duration || 0

  const bottomOffset = 100 + (index * 50) // 100% 表示在动作块上方

  return {
    width: `calc(${duration * TIME_BLOCK_WIDTH}px + 20px)`, // 宽度跟随持续时间
    bottom: `${bottomOffset}%`, // 向上排列
    left: 'calc(100% - 20px)',
    position: 'absolute',
    marginBottom: '4px', // 稍微留点空隙
    zIndex: 15 + index
  }
}

function getIconPath(type) {
  // 1. 尝试查找该动作所属的干员
  let charId = null;
  for (const track of store.tracks) {
    if (track.actions.some(a => a.instanceId === props.action.instanceId)) {
      charId = track.id;
      break;
    }
  }

  // 2. 如果找到了干员，尝试在专属 Buff 里找
  if (charId) {
    const charInfo = store.characterRoster.find(c => c.id === charId);
    if (charInfo && charInfo.exclusive_buffs) {
      const exclusive = charInfo.exclusive_buffs.find(b => b.key === type);
      if (exclusive && exclusive.path) {
        return exclusive.path;
      }
    }
  }

  // 3. 全局查找
  return (iconDatabase.value && iconDatabase.value[type])
      ? iconDatabase.value[type]
      : (iconDatabase.value?.['default'] || '');
}

function onActionClick() {
  if (store.isLinking) {
    store.confirmLinking(props.action.instanceId)
    return // 优先处理连线，成功后立即退出
  }

  // 否则正常选中
  store.selectAction(props.action.instanceId)
  store.cancelConnection()
}

function onDeleteClick() {
  store.removeAction(props.action.instanceId)
}
</script>

<template>
  <div
      :id="`action-${action.instanceId}`"
      class="action-item-wrapper"
      :class="typeClass"
      :style="style"
      @click="onActionClick"
  >

    <div class="action-item-content drag-handle">
      {{ action.name }}
    </div>

    <div
        v-if="isSelected"
        class="delete-btn-modern"
        @click.stop="onDeleteClick"
        title="删除 (Delete)"
    >
      <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none"
           stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>

    <div v-if="action.cooldown > 0" class="cd-bar-container" :style="cdStyle">
      <div class="cd-line"></div>
      <span class="cd-text">{{ action.cooldown }}s</span>
      <div class="cd-end-mark"></div>
    </div>

    <div class="anomalies-overlay">
      <div
          v-for="(effect, index) in action.physicalAnomaly"
          :key="index"
          class="anomaly-row"
          :style="getAnomalyBarStyle(effect, index)"
      >
        <div class="anomaly-icon-box"
             :id="`anomaly-${action.instanceId}-${index}`"
        >
          <img :src="getIconPath(effect.type)" class="anomaly-icon" />
          <div v-if="effect.stacks > 1" class="anomaly-stacks">{{ effect.stacks }}</div>
        </div>

        <div class="anomaly-duration-bar" v-if="effect.duration > 0">
          <div class="striped-bg"></div>
          <span class="duration-text">{{ effect.duration }}s</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.action-item-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4f4f4f;
  color: white;
  border: 2px dashed #ffffff;
  white-space: nowrap;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  position: relative;
  overflow: visible;
}

.action-item-wrapper:hover {
  background-color: #5a5a5a;
}

/* 样式分类 */
.style-normal {
  border: 2px dashed #e0e0e0;
  background-color: #4f4f4f;
}

.style-link {
  border: 2px dashed #ffd700 !important;
  background-color: #4f4f4f;
  color: #ffd700;
}

.anomalies-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 让鼠标点击穿透，不影响选中下面的动作块 */
  overflow: visible;
}

.anomaly-row {
  display: flex;
  align-items: center;
  height: 22px;
  /* 这里的 width 和 bottom 由内联样式控制 */
  pointer-events: none;
}

/* 图标盒子 */
.anomaly-icon-box {
  width: 20px;
  height: 20px;
  background-color: #333;
  border: 1px solid #999;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  flex-shrink: 0; /* 防止被挤压 */
}

.anomaly-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.anomaly-stacks {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background-color: rgba(0,0,0,0.8);
  color: #ffd700;
  font-size: 8px;
  padding: 0 2px;
  border-radius: 2px;
  line-height: 1;
}

/* 时间条主体 */
.anomaly-duration-bar {
  flex-grow: 1; /* 占满剩余宽度 */
  height: 14px; /* 比图标稍微矮一点，更有层次感 */
  background-color: rgba(255, 255, 255, 0.2); /* 浅灰底色 */
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-left: none; /* 跟图标连接处不需要边框 */
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  box-sizing: border-box;
}

/* 模拟截图中的斜纹效果 */
.striped-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      rgba(255, 255, 255, 0.1) 4px,
      rgba(255, 255, 255, 0.1) 8px
  );
  z-index: 1;
}

.duration-text {
  position: absolute;
  left: 4px;
  font-size: 10px;
  color: #fff;
  text-shadow: 1px 1px 2px black;
  z-index: 2;
  font-weight: bold;
  line-height: 1;
}

/* CD 条样式 */
.cd-bar-container {
  position: absolute;
  height: 4px;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.cd-line {
  flex-grow: 1;
  height: 2px;
  background-color: #ffd700;
  margin-top: 1px;
  opacity: 0.3;
}

.cd-text {
  position: absolute;
  left: 0;
  top: 4px;
  font-size: 10px;
  color: #ffd700;
  font-weight: bold;
  line-height: 1;
}

.cd-end-mark {
  position: absolute;
  right: 0;
  top: -2px;
  width: 1px;
  height: 8px;
  background-color: #ffd700;
}

/* 删除按钮样式 */
.delete-btn-modern {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 18px;
  height: 18px;
  background-color: #333;
  border: 1px solid #666;
  color: #ccc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 30;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  transition: all 0.2s ease;
}

.delete-btn-modern:hover {
  background-color: #d32f2f;
  border-color: #d32f2f;
  color: white;
  transform: scale(1.1);
}

/* 效果图标样式 */
.effects-bar {
  position: absolute;
  top: -40px;
  right: 0px;
  display: flex;
  gap: 5px;
  z-index: 20;
  pointer-events: none;
}

.effect-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.effect-stacks {
  height: 12px;
  line-height: 12px;
  font-size: 10px;
  font-weight: bold;
  color: #fff;
  background: transparent;
  padding: 0 3px;
  border-radius: 2px;
  z-index: 1;
}

.effect-icon {
  width: 20px;
  height: 20px;
  border-radius: 0;
  background: #aaa;
  border: 1px solid #ccc;
  box-sizing: border-box;
  object-fit: cover;
}
</style>