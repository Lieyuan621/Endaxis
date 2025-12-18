<script setup>
import { computed, ref, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import CustomNumberInput from './CustomNumberInput.vue'

const store = useTimelineStore()

const activeTrack = computed(() => store.tracks.find(t => t.id === store.activeTrackId))

const activeCharacter = computed(() => {
  return store.characterRoster.find(c => c.id === store.activeTrackId)
})

const activeCharacterName = computed(() => activeCharacter.value ? activeCharacter.value.name : '干员')

// === 充能设置逻辑 ===
const maxGaugeValue = computed({
  get: () => {
    if (!activeTrack.value) return 100
    return activeTrack.value.maxGaugeOverride || activeCharacter.value?.ultimate_gaugeMax || 100
  },
  set: (val) => {
    if (store.activeTrackId) {
      store.updateTrackMaxGauge(store.activeTrackId, val)
    }
  }
})

const initialGaugeValue = computed({
  get: () => activeTrack.value ? (activeTrack.value.initialGauge || 0) : 0,
  set: (val) => {
    if (store.activeTrackId) {
      store.updateTrackInitialGauge(store.activeTrackId, val)
    }
  }
})

// === 技能列表逻辑 ===
const localSkills = ref([])

function onSkillClick(skillId) {
  store.selectLibrarySkill(skillId)
}

watch(
    () => store.activeSkillLibrary,
    (newVal) => {
      if (newVal && newVal.length > 0) {
        localSkills.value = JSON.parse(JSON.stringify(newVal))
      } else {
        localSkills.value = []
      }
    },
    { immediate: true, deep: true }
)

// === 拖拽 Ghost 逻辑 ===

// 辅助函数：HEX 转 RGBA
function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`
  let c = hex.substring(1).split('')
  if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]]
  c = '0x' + c.join('')
  return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')'
}

function getSkillThemeColor(skill) {
  // 1. 特殊类型优先
  if (skill.type === 'link') return store.getColor('link')
  if (skill.type === 'execution') return store.getColor('execution')
  if (skill.type === 'attack') return store.getColor('physical')

  // 2. 自身属性 (如果有)
  if (skill.element) {
    return store.getColor(skill.element)
  }

  // 3. 继承当前选中干员的属性
  if (activeCharacter.value?.element) {
    return store.getColor(activeCharacter.value.element)
  }

  // 4. 默认
  return store.getColor('default')
}

function onNativeDragStart(evt, skill) {
  // 创建 Ghost 元素
  const ghost = document.createElement('div');
  ghost.id = 'custom-drag-ghost';
  ghost.textContent = skill.name;

  // 计算尺寸
  const duration = Number(skill.duration) || 1;
  const realWidth = duration * store.timeBlockWidth;

  // 获取颜色
  const themeColor = getSkillThemeColor(skill);

  // 应用样式 (复刻 ActionItem.vue 的视觉风格)
  Object.assign(ghost.style, {
    position: 'absolute', top: '-9999px', left: '-9999px',
    width: `${realWidth}px`, height: '50px',

    // 视觉核心：同色系虚线框 + 半透明背景 + 光晕
    border: `2px dashed ${themeColor}`,
    backgroundColor: hexToRgba(themeColor, 0.2),
    color: '#ffffff',
    boxShadow: `0 0 10px ${themeColor}`,
    textShadow: `0 1px 2px rgba(0,0,0,0.8)`,

    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxSizing: 'border-box',
    fontSize: '12px', fontWeight: 'bold', zIndex: '999999', pointerEvents: 'none',
    fontFamily: 'sans-serif', whiteSpace: 'nowrap',
    backdropFilter: 'blur(4px)'
  });

  document.body.appendChild(ghost);

  evt.dataTransfer.setDragImage(ghost, 10, 25);
  evt.dataTransfer.effectAllowed = 'copy';

  store.setDragOffset(0);
  store.setDraggingSkill(skill);

  document.body.classList.add('is-lib-dragging');

  // 下一帧移除 DOM 里的 ghost (因为它已经被浏览器截屏用于拖拽了)
  setTimeout(() => {
    const el = document.getElementById('custom-drag-ghost');
    if (el) document.body.removeChild(el);
  }, 0);
}

function onNativeDragEnd() {
  store.setDraggingSkill(null)
  document.body.classList.remove('is-lib-dragging')
}
</script>

<template>
  <div class="library-container">
    <div class="lib-header">
      <h3>{{ activeCharacterName }} 的技能</h3>
    </div>

    <div v-if="activeTrack && activeCharacter" class="gauge-settings-panel">

      <div class="setting-row-group">
        <div class="setting-label-row">
          <span class="label-text">初始充能 (Initial)</span>
          <span class="value-text">{{ initialGaugeValue }}</span>
        </div>
        <div class="setting-control-row">
          <el-slider
              v-model="initialGaugeValue"
              :max="maxGaugeValue"
              :show-tooltip="false"
              size="small"
              class="gauge-slider"
          />
          <CustomNumberInput
              v-model="initialGaugeValue"
              :min="0"
              :max="maxGaugeValue"
              active-color="#ffd700"
              class="gauge-input"
          />
        </div>
      </div>

      <hr class="separator"/>

      <div class="setting-row-group">
        <div class="setting-label-row">
          <span class="label-text">充能上限 (Max)</span>
          <span class="value-text" style="color: #ffd700;">{{ maxGaugeValue }}</span>
        </div>
        <div class="setting-control-row">
          <el-slider
              v-model="maxGaugeValue"
              :min="1"
              :max="300"
              :step="1"
              :show-tooltip="false"
              size="small"
              class="gauge-slider slider-orange"
          />
          <CustomNumberInput
              v-model="maxGaugeValue"
              :min="1"
              :max="300"
              active-color="#ffd700"
              class="gauge-input"
          />
        </div>
      </div>

    </div>

    <div class="hint-text">点击技能可修改基础数值</div>

    <div class="skill-list">
      <div
          v-for="skill in localSkills"
          :key="skill.id"
          class="skill-item"
          :class="{ 'is-selected': store.selectedLibrarySkillId === skill.id }"
          :style="{ '--duration': skill.duration }"
          draggable="true"
          @dragstart="onNativeDragStart($event, skill)"
          @dragend="onNativeDragEnd"
          @click="onSkillClick(skill.id)"
      >
        {{ skill.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.library-container { padding: 15px; display: flex; flex-direction: column; flex-grow: 1; gap: 15px; }
.lib-header h3 { margin: 0; color: #f0f0f0; font-size: 16px; }

.gauge-settings-panel {
  background-color: #3a3a3a; border: 1px solid #555;
  border-radius: 6px; padding: 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.setting-row-group { display: flex; flex-direction: column; gap: 4px; }
.setting-label-row { display: flex; justify-content: space-between; font-size: 12px; color: #ccc; }
.value-text { color: #00e5ff; font-family: monospace; }
.setting-control-row { display: flex; align-items: center; gap: 10px; }
.gauge-slider { flex-grow: 1; margin-right: 5px; }
.gauge-input { width: 150px; }
.separator { border: 0; border-top: 1px dashed #555; margin: 8px 0; }

:deep(.el-slider__runway) { background-color: #555; }
:deep(.el-slider__bar) { background-color: #00e5ff; }
:deep(.el-slider__button) { border-color: #00e5ff; background-color: #222; width: 14px; height: 14px; }

.slider-orange { --el-slider-main-bg-color: #ffd700; }
:deep(.slider-orange .el-slider__bar) { background-color: #ffd700; }
:deep(.slider-orange .el-slider__button) { border-color: #ffd700; }

.skill-list { display: flex; flex-direction: row; flex-wrap: wrap; gap: 10px; }
.hint-text { font-size: 12px; color: #666; margin-top: -5px; margin-bottom: 5px; }
.skill-item {
  height: 50px; padding: 0 20px;
  display: flex; align-items: center; justify-content: center;
  background-color: #4f4f4f; border: 1px solid #666;
  box-sizing: border-box; border-radius: 4px;
  cursor: grab; font-weight: bold; color: white;
  user-select: none; transition: all 0.2s;
  width: 100px; flex-grow: 1;
}
.skill-item:active { cursor: grabbing; }
.skill-item:hover { background-color: #5a5a5a; border-color: #999; }
.skill-item.is-selected { border-color: #ffd700; color: #ffd700; background-color: #4a4a3a; box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
</style>