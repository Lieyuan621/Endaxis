<script setup>
import { computed, ref, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import CustomNumberInput from './CustomNumberInput.vue'

const store = useTimelineStore()

// === 核心数据逻辑 ===
const activeTrack = computed(() => store.tracks.find(t => t.id === store.activeTrackId))
const activeCharacter = computed(() => {
  return store.characterRoster.find(c => c.id === store.activeTrackId)
})

const activeCharacterName = computed(() => activeCharacter.value ? activeCharacter.value.name : '未选择干员')

// 技能类型完整名称映射
const getFullTypeName = (type) => {
  const map = {
    'attack': '重击',
    'skill': '战技',
    'link': '连携',
    'ultimate': '终结技',
    'execution': '处决'
  }
  return map[type] || '技能'
}

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

const gaugeEfficiencyValue = computed({
  get: () => {
    if (!activeTrack.value) return 100;
    return activeTrack.value.gaugeEfficiency ?? 100;
  },
  set: (val) => {
    if (store.activeTrackId) {
      store.updateTrackGaugeEfficiency(store.activeTrackId, val)
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
function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`
  let c = hex.substring(1).split('')
  if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]]
  c = '0x' + c.join('')
  return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')'
}

function getSkillThemeColor(skill) {
  if (skill.type === 'link') return store.getColor('link')
  if (skill.type === 'execution') return store.getColor('execution')
  if (skill.type === 'attack') return store.getColor('physical')
  if (skill.element) return store.getColor(skill.element)
  if (activeCharacter.value?.element) return store.getColor(activeCharacter.value.element)
  return store.getColor('default')
}

function onNativeDragStart(evt, skill) {
  const ghost = document.createElement('div');
  ghost.id = 'custom-drag-ghost';
  ghost.textContent = skill.name;

  const duration = Number(skill.duration) || 1;
  const realWidth = duration * store.timeBlockWidth;
  const themeColor = getSkillThemeColor(skill);

  Object.assign(ghost.style, {
    position: 'absolute', top: '-9999px', left: '-9999px',
    width: `${realWidth}px`, height: '50px',
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
      <div class="header-main">
        <div class="header-icon-bar"></div>
        <h3 class="char-name">{{ activeCharacterName }}</h3>
      </div>
      <div class="header-sub">干员技能</div>
      <div class="header-divider"></div>
    </div>

    <div v-if="activeTrack && activeCharacter" class="gauge-settings-panel">
      <div class="panel-tag">终极技充能</div>

      <div class="setting-group">
        <div class="setting-info">
          <span class="label">初始充能</span>
          <span class="value cyan">{{ initialGaugeValue }}</span>
        </div>
        <div class="setting-controls">
          <el-slider v-model="initialGaugeValue" :max="maxGaugeValue" :show-tooltip="false" size="small" class="tech-slider cyan-theme" />
          <CustomNumberInput v-model="initialGaugeValue" :min="0" :max="maxGaugeValue" active-color="#00e5ff" class="tech-input" />
        </div>
      </div>

      <div class="group-divider"></div>

      <div class="setting-group">
        <div class="setting-info">
          <span class="label">充能上限</span>
          <span class="value gold">{{ maxGaugeValue }}</span>
        </div>
        <div class="setting-controls">
          <el-slider v-model="maxGaugeValue" :min="1" :max="300" :show-tooltip="false" size="small" class="tech-slider gold-theme" />
          <CustomNumberInput v-model="maxGaugeValue" :min="1" :max="300" active-color="#ffd700" class="tech-input" />
        </div>
      </div>

      <div class="group-divider"></div>

      <div class="setting-group">
        <div class="setting-info">
          <span class="label">充能效率</span>
          <span class="value green">{{ gaugeEfficiencyValue }}%</span>
        </div>
        <div class="setting-controls">
          <el-slider v-model="gaugeEfficiencyValue" :min="0" :max="300" :step="0.1" :show-tooltip="false" size="small" class="tech-slider green-theme" />
          <CustomNumberInput v-model="gaugeEfficiencyValue" :min="0" :max="300" suffix="%" active-color="#52c41a" class="tech-input" />
        </div>
      </div>
    </div>

    <div class="skill-section">
      <div v-if="activeTrack && activeCharacter" class="skill-section">
        <div class="section-title-box">
          <span class="section-title">技能模块库</span>
          <span class="section-hint">点击编辑基础数值 / 拖拽排轴</span>
        </div>
        <div class="skill-grid">
          <div
              v-for="skill in localSkills"
              :key="skill.id"
              class="skill-card"
              :class="{ 'is-selected': store.selectedLibrarySkillId === skill.id }"
              :style="{ '--accent-color': getSkillThemeColor(skill) }"
              draggable="true"
              @dragstart="onNativeDragStart($event, skill)"
              @dragend="onNativeDragEnd"
              @click="onSkillClick(skill.id)"
          >
            <div class="card-edge"></div>
            <div class="card-body">
              <div class="skill-meta">
                <span v-if="!skill.name.includes(getFullTypeName(skill.type))" class="skill-type">{{ getFullTypeName(skill.type) }}</span>
                <span v-else class="skill-type-empty"></span>
                <span class="skill-time">{{ skill.duration }}S</span>
              </div>
              <div class="skill-name">{{ skill.name }}</div>
            </div>
            <div class="card-bg-deco"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.library-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  background-color: #252525;
  height: 100%;
  gap: 20px;
  overflow-y: auto;
  transition: background-color 0.3s ease;
}

/* 头部样式 */
.lib-header { display: flex; flex-direction: column; gap: 4px; }
.header-main { display: flex; align-items: center; gap: 10px; }
.header-icon-bar { width: 4px; height: 18px; background-color: #ffd700; }
.char-name { margin: 0; color: #fff; font-size: 18px; letter-spacing: 1px; }
.header-sub { font-size: 10px; color: #555; font-family: 'Roboto Mono', monospace; }
.header-divider { height: 1px; background: linear-gradient(90deg, #ffd700 0%, transparent 100%); opacity: 0.3; margin-top: 5px; }

/* 参数面板 */
.gauge-settings-panel {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 3px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.panel-tag {
  position: absolute;
  right: 0;
  top: -12px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-bottom: none;
  font-size: 10px;
  color: #aaa;
  padding: 2px 10px;
  font-family: 'Inter', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  clip-path: polygon(10% 0, 100% 0, 100% 100%, 0% 100%);
}
.gauge-settings-panel::before {
  content: "";
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 10px;
  height: 10px;
  border-right: 1px solid rgba(255,255,255,0.3);
  border-bottom: 1px solid rgba(255,255,255,0.3);
}
.setting-group { display: flex; flex-direction: column; gap: 8px; }
.setting-info { display: flex; justify-content: space-between; align-items: baseline; }
.label { font-size: 11px;color: rgba(255, 255, 255, 0.5); text-transform: uppercase; letter-spacing: 1px; }
.value { font-family: 'Roboto Mono', monospace; font-weight: bold; font-size: 15px; }
.cyan { color: #00e5ff; }
.gold { color: #ffd700; }
.green { color: #52c41a; }
.setting-controls { display: flex; align-items: center; gap: 12px; }
.tech-slider { flex-grow: 1; }
.tech-input { width: 200px; }
.group-divider { height: 1px;background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%); }

/* 技能卡片列表 */
.skill-section { display: flex; flex-direction: column; gap: 15px; }
.section-title-box { display: flex; flex-direction: column; border-left: 2px solid #444; padding-left: 10px; }
.section-title { font-size: 14px; font-weight: bold; color: #ccc; }
.section-hint { font-size: 10px; color: #555; }

.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.skill-card {
  --accent-color: #8c8c8c;
  position: relative;
  height: 60px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  cursor: grab;
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.skill-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}
.skill-card.is-selected {
  border-color: #ffd700;
  box-shadow: inset 0 0 10px rgba(255, 215, 0, 0.1);
  background: rgba(255, 215, 0, 0.05);
}

.skill-type-empty {
  height: 9px;
  flex: 1;
}

.skill-card:not(:has(.skill-type)) .skill-name {
  font-size: 14px;
  margin-top: 2px;
}

.card-edge {
  position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
  background-color: var(--accent-color);
  box-shadow: 2px 0 10px var(--accent-color);
}
.card-body {
  padding: 8px 12px 8px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  z-index: 2;
  position: relative;
}
.skill-meta { display: flex; justify-content: space-between; align-items: center; }
.skill-type { font-size: 9px; color: #888; font-weight: bold; }
.skill-time { font-size: 9px; color: #555; font-family: monospace; }
.skill-name { font-size: 13px; color: #fff; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.card-bg-deco {
  position: absolute; right: -5px; bottom: -5px;
  width: 30px; height: 30px;
  background: var(--accent-color);
  opacity: 0.05;
  transform: rotate(45deg);
}

/* Slider 自定义 */
:deep(.el-slider__runway) { background-color: rgba(255,255,255,0.05) !important; height: 2px !important; }
:deep(.el-slider__bar) { height: 4px; }
:deep(.el-slider__button) { width: 10px; height: 10px; background: #1a1a1a; border-width: 2px; }

.cyan-theme :deep(.el-slider__bar) { background-color: #00e5ff; }
.cyan-theme :deep(.el-slider__button) { border-color: #00e5ff; }

.gold-theme :deep(.el-slider__bar) { background-color: #ffd700; }
.gold-theme :deep(.el-slider__button) { border-color: #ffd700; }

.green-theme :deep(.el-slider__bar) { background-color: #52c41a; }
.green-theme :deep(.el-slider__button) { border-color: #52c41a; }
</style>