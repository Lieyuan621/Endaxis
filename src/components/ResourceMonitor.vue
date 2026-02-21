<script setup>
import { computed, watch, ref } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { storeToRefs } from 'pinia'
import CustomNumberInput from './CustomNumberInput.vue'
import { Search } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const store = useTimelineStore()
const { t } = useI18n({ useScope: 'global' })

const { enemyDatabase, enemyCategories } = storeToRefs(store)
const ENEMY_TIERS = store.ENEMY_TIERS
const TIER_WEIGHTS = { 'boss': 4, 'champion': 3, 'elite': 2, 'normal': 1 }

// === 布局常量 ===
const TOTAL_HEIGHT = 200
const STAGGER_HEIGHT = 60
const SP_HEIGHT = 140
const gridLineTimes = computed(() => {
  const prep = Number(store.prepDuration) || 0
  const startBt = -prep
  const endBt = store.TOTAL_DURATION
  const start = Math.ceil(startBt / 5) * 5
  const result = []
  for (let bt = start; bt <= endBt; bt += 5) {
    result.push(bt + prep)
  }
  return result
})

// === 颜色常量 ===
const COLOR_STAGGER = '#ff7875'
const COLOR_LIMIT = '#d32f2f'
const COLOR_SP_MAIN = '#ffd700'
const COLOR_SP_WARN = '#ff4d4f'

// === 敌人选择器逻辑 ===
const CATEGORY_ALL = '__ALL__'
const CATEGORY_UNCATEGORIZED = '__UNCAT__'
const isEnemySelectorVisible = ref(false)
const enemySearchQuery = ref('')
const activeCategoryTab = ref(CATEGORY_ALL)

const activeEnemyInfo = computed(() => {
  if (store.activeEnemyId === 'custom') {
    return { name: t('resourceMonitor.enemy.custom'), avatar: '', isCustom: true }
  }
  return store.enemyDatabase.find(e => e.id === store.activeEnemyId) || { name: t('resourceMonitor.enemy.unknown'), avatar: '' }
})

const groupedEnemyList = computed(() => {
  let list = enemyDatabase.value || []

  if (enemySearchQuery.value) {
    const q = enemySearchQuery.value.toLowerCase()
    list = list.filter(e => e.name.toLowerCase().includes(q))
  }

  const groups = {}

  const targetCategories = (activeCategoryTab.value === CATEGORY_ALL)
      ? [...enemyCategories.value, CATEGORY_UNCATEGORIZED]
      : [activeCategoryTab.value]

  targetCategories.forEach(cat => { groups[cat] = [] })

  list.forEach(enemy => {
    let cat = enemy.category
    if (!cat || !enemyCategories.value.includes(cat)) {
      cat = CATEGORY_UNCATEGORIZED
    }

    if (groups[cat]) {
      groups[cat].push(enemy)
    }
  })

  const result = []

  targetCategories.forEach(cat => {
    const enemyList = groups[cat]
    if (enemyList && enemyList.length > 0) {
      enemyList.sort((a, b) => (TIER_WEIGHTS[b.tier] || 0) - (TIER_WEIGHTS[a.tier] || 0))
      result.push({
        id: cat,
        name: cat === CATEGORY_UNCATEGORIZED ? t('common.uncategorized') : cat,
        list: enemyList
      })
    }
  })

  return result
})

function getTierColor(tierValue) {
  const tier = ENEMY_TIERS.find(t => t.value === tierValue)
  return tier ? tier.color : '#a0a0a0'
}

function getTierLabel(tierValue) {
  const tier = ENEMY_TIERS.find(t => t.value === tierValue)
  if (!tier) return ''
  if (tier.labelKey) return t(tier.labelKey)
  return tier.label || ''
}

function selectEnemy(id) {
  store.applyEnemyPreset(id)
  isEnemySelectorVisible.value = false
}

// === 数据计算 (失衡)===
const staggerResult = computed(() => {
  if (store.useNewCompiler) {
    return store.staggerSeries
  }
  return store.calculateGlobalStaggerData()
})
const staggerPoints = computed(() => staggerResult.value.points || [])
const lockSegments = computed(() => staggerResult.value.lockSegments || [])
const nodeSegments = computed(() => staggerResult.value.nodeSegments || [])

const BASE_Y_STAGGER = STAGGER_HEIGHT - 5
const PADDING_TOP_STAGGER = 10
const scaleY_Stagger = computed(() => {
  const max = store.systemConstants.maxStagger
  if (!max || max <= 0) return 1
  return (BASE_Y_STAGGER - PADDING_TOP_STAGGER) / max
})

const staggerPolyline = computed(() => {
  if (staggerPoints.value.length === 0) return ''
  return staggerPoints.value.map(p => {
    const x = store.timeToPx(p.time)
    const val = Math.min(p.val, store.systemConstants.maxStagger)
    const y = BASE_Y_STAGGER - (val * scaleY_Stagger.value)
    return `${x},${y}`
  }).join(' ')
})

const staggerArea = computed(() => {
  if (staggerPoints.value.length === 0) return ''
  const line = staggerPolyline.value
  const lastX = store.timeToPx(staggerPoints.value[staggerPoints.value.length - 1].time)
  return `0,${BASE_Y_STAGGER} ${line} ${lastX},${BASE_Y_STAGGER}`
})

const nodeZones = computed(() => nodeSegments.value.map(seg => ({
  x: store.timeToPx(seg.start),
  width: store.timeToPx(seg.end) - store.timeToPx(seg.start),
  y: BASE_Y_STAGGER - (seg.thresholdVal * scaleY_Stagger.value)
})))

const lockZones = computed(() => lockSegments.value.map(seg => ({
  x: store.timeToPx(seg.start),
  width: store.timeToPx(seg.end) - store.timeToPx(seg.start)
})))


// === 数据计算 (技力) ===
const spData = computed(() => {
  if (store.useNewCompiler) {
    return store.spSeries
  }
  return store.calculateGlobalSpData()
})

// 技力绘图坐标计算
const BASE_Y_SP = STAGGER_HEIGHT + SP_HEIGHT - 20
const PADDING_TOP_SP = STAGGER_HEIGHT + 2
const EFFECTIVE_HEIGHT_SP = BASE_Y_SP - PADDING_TOP_SP
const scaleY_SP = computed(() => EFFECTIVE_HEIGHT_SP / 300)

const spPolyline = computed(() => {
  if (spData.value.length === 0) return ''
  return spData.value.map(p => {
    const x = store.timeToPx(p.time)
    const y = BASE_Y_SP - (p.sp * scaleY_SP.value)
    return `${x},${y}`
  }).join(' ')
})

const spArea = computed(() => {
  if (spData.value.length === 0) return ''
  const points = spData.value.map(p => {
    const x = store.timeToPx(p.time)
    const y = BASE_Y_SP - (p.sp * scaleY_SP.value)
    return `${x},${y}`
  })
  const lastX = store.timeToPx(spData.value[spData.value.length - 1].time)
  return `0,${BASE_Y_SP} ${points.join(' ')} ${lastX},${BASE_Y_SP}`
})

const spWarningZones = computed(() => spData.value.filter(p => p.sp < 0).map(p => ({
  left: store.timeToPx(p.time),
  sp: p.sp
})))

const transformStyle = computed(() => {
  return {
    transform: `translateX(${-store.timelineShift}px)`,
    willChange: 'transform'
  }
})
</script>

<template>
  <div class="resource-monitor-layout">

    <div class="monitor-sidebar">
      <div class="enemy-select-module" @click="isEnemySelectorVisible = true">
        <div class="module-deco-line"></div>
        <div class="enemy-avatar-box">
          <img v-if="!activeEnemyInfo.isCustom" :src="activeEnemyInfo.avatar" @error="e=>e.target.src='/Endaxis/avatars/default_enemy.webp'" />
          <div v-else class="custom-avatar-placeholder">?</div>
          <div class="scan-line"></div>
        </div>
          <div class="enemy-info-col">
            <div class="enemy-name">{{ activeEnemyInfo.name }}</div>
            <div class="click-hint">{{ t('resourceMonitor.enemy.clickToChange') }}</div>
          </div>
        </div>

        <div class="settings-scroll-area">
          <div class="section-container tech-style border-red">
            <div class="panel-tag-mini red">{{ t('resourceMonitor.sections.enemy') }}</div>
            <div class="attribute-grid-mini">
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.maxStagger') }}</label>
                <CustomNumberInput v-model="store.systemConstants.maxStagger" :min="1" active-color="#ff7875" class="standard-input" />
              </div>
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.staggerNodes') }}</label>
                <CustomNumberInput v-model="store.systemConstants.staggerNodeCount" :min="0" class="standard-input" />
              </div>
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.nodeDuration') }}</label>
                <CustomNumberInput v-model="store.systemConstants.staggerNodeDuration" :step="0.1" active-color="#ff7875" class="standard-input" />
              </div>
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.breakDuration') }}</label>
                <CustomNumberInput v-model="store.systemConstants.staggerBreakDuration" :step="0.5" active-color="#ff7875" class="standard-input" />
              </div>
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.executionRecovery') }}</label>
                <CustomNumberInput v-model="store.systemConstants.executionRecovery" :min="0" class="standard-input" />
              </div>
            </div>
          </div>

          <div class="section-container tech-style border-gold">
            <div class="panel-tag-mini gold">{{ t('resourceMonitor.sections.team') }}</div>
            <div class="attribute-grid-mini">
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.initialSp') }}</label>
                <CustomNumberInput v-model="store.systemConstants.initialSp" :min="0" :max="300" active-color="#ffd700" class="standard-input" />
              </div>
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.spPerSecond') }}</label>
                <CustomNumberInput v-model="store.systemConstants.spRegenRate" :step="0.5" :min="0" active-color="#ffd700" class="standard-input" />
              </div>
            </div>
          </div>
      </div>
    </div>

    <div class="chart-scroll-wrapper">
      <div :style="transformStyle">
        <svg class="chart-svg" :height="TOTAL_HEIGHT" :width="store.totalTimelineWidthPx">
          <defs>
            <linearGradient id="stagger-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="COLOR_STAGGER" stop-opacity="0.5"/>
              <stop offset="100%" :stop-color="COLOR_STAGGER" stop-opacity="0.1"/>
            </linearGradient>
            <linearGradient id="sp-fill-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="COLOR_SP_MAIN" stop-opacity="0.3"/>
              <stop offset="100%" :stop-color="COLOR_SP_MAIN" stop-opacity="0.05"/>
            </linearGradient>

            <pattern id="stun-pattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="10" height="10" fill="#ff9c6e" fill-opacity="0.1"/>
              <rect width="2" height="10" transform="translate(0,0)" fill="#ffd591" fill-opacity="0.6"></rect>
            </pattern>

            <pattern id="node-stripe-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="8" fill="#fa8c16" fill-opacity="0.05"/>
              <rect width="2" height="8" transform="translate(0,0)" fill="#fa8c16" fill-opacity="0.5"></rect>
            </pattern>
          </defs>

          <rect v-if="store.prepDuration > 0" x="0" y="0" :width="store.prepZoneWidthPx" :height="TOTAL_HEIGHT" fill="rgba(255, 255, 255, 0.04)" />
          <line v-if="store.prepDuration > 0" :x1="store.prepZoneWidthPx" y1="0" :x2="store.prepZoneWidthPx" :y2="TOTAL_HEIGHT" stroke="rgba(255, 255, 255, 0.38)" stroke-width="2"/>

          <line v-for="(t, i) in gridLineTimes" :key="`grid-${i}`"
                :x1="store.timeToPx(t)" y1="0"
                :x2="store.timeToPx(t)" :y2="TOTAL_HEIGHT"
                stroke="#333" stroke-width="1" stroke-dasharray="2"/>

          <g class="layer-stagger">
            <line x1="0" :y1="PADDING_TOP_STAGGER" :x2="store.totalTimelineWidthPx" :y2="PADDING_TOP_STAGGER"
                  :stroke="COLOR_LIMIT" stroke-width="1" stroke-dasharray="4"/>
            <line x1="0" :y1="BASE_Y_STAGGER" :x2="store.totalTimelineWidthPx" :y2="BASE_Y_STAGGER"
                  :stroke="COLOR_LIMIT" stroke-width="1" stroke-dasharray="4" opacity="0.6"/>

            <g v-for="(zone, i) in nodeZones" :key="`node-${i}`">
              <rect :x="zone.x" :y="PADDING_TOP_STAGGER" :width="zone.width" :height="BASE_Y_STAGGER - PADDING_TOP_STAGGER"
                    fill="url(#node-stripe-pattern)" class="node-bar-anim" />
            </g>

            <g v-for="(zone, i) in lockZones" :key="`lock-${i}`">
              <rect :x="zone.x" :y="PADDING_TOP_STAGGER" :width="zone.width" :height="BASE_Y_STAGGER - PADDING_TOP_STAGGER" fill="url(#stun-pattern)" class="stun-bg-anim" />
              <text :x="zone.x + zone.width / 2" :y="(BASE_Y_STAGGER + PADDING_TOP_STAGGER) / 2 + 4" fill="#fff" font-size="12" font-weight="900" text-anchor="middle" style="text-shadow: 0 0 2px #ff7a45; letter-spacing: 1px;">WEAK</text>
            </g>

            <polygon :points="staggerArea" fill="url(#stagger-grad)"/>
            <polyline :points="staggerPolyline" fill="none" :stroke="COLOR_STAGGER" stroke-width="2"/>
            <circle v-for="(p, idx) in staggerPoints" :key="idx" :cx="store.timeToPx(p.time)"
                    :cy="BASE_Y_STAGGER - (Math.min(p.val, store.systemConstants.maxStagger) * scaleY_Stagger)" r="2" :fill="COLOR_STAGGER"/>
          </g>

          <line x1="0" :y1="STAGGER_HEIGHT" :x2="store.totalTimelineWidthPx" :y2="STAGGER_HEIGHT" stroke="#444" stroke-width="2"/>

          <g class="layer-sp">
            <line x1="0" :y1="BASE_Y_SP - (300 * scaleY_SP)" :x2="store.totalTimelineWidthPx" :y2="BASE_Y_SP - (300 * scaleY_SP)" stroke="#444" stroke-width="1" stroke-dasharray="2"/>
            <line x1="0" :y1="BASE_Y_SP - (200 * scaleY_SP)" :x2="store.totalTimelineWidthPx" :y2="BASE_Y_SP - (200 * scaleY_SP)" stroke="#444" stroke-width="1" stroke-dasharray="2"/>
            <line x1="0" :y1="BASE_Y_SP - (100 * scaleY_SP)" :x2="store.totalTimelineWidthPx" :y2="BASE_Y_SP - (100 * scaleY_SP)" stroke="#444" stroke-width="1" stroke-dasharray="2"/>
            <line x1="0" :y1="BASE_Y_SP" :x2="store.totalTimelineWidthPx" :y2="BASE_Y_SP" stroke="#aaa" stroke-width="2"/>

            <text x="5" :y="BASE_Y_SP - (300 * scaleY_SP) + 12" fill="#888" font-size="10">MAX(300)</text>
            <text x="5" :y="BASE_Y_SP + 12" fill="#666" font-size="10">0</text>

            <rect x="0" :y="BASE_Y_SP" :width="store.totalTimelineWidthPx" :height="TOTAL_HEIGHT - BASE_Y_SP" :fill="`${COLOR_SP_WARN}26`"/>
            <polygon :points="spArea" fill="url(#sp-fill-gradient)"/>
            <polyline :points="spPolyline" fill="none" :stroke="COLOR_SP_MAIN" stroke-width="2" stroke-linejoin="round"/>

            <circle v-for="(p, idx) in spData" :key="idx" :cx="store.timeToPx(p.time)" :cy="BASE_Y_SP - (p.sp * scaleY_SP)" r="2" :fill="p.sp < 0 ? COLOR_SP_WARN : COLOR_SP_MAIN" />
          </g>
        </svg>
        <div v-for="(w, idx) in spWarningZones" :key="idx" class="warning-tag"
            :style="{ left: w.left + 'px', top: (BASE_Y_SP + 5) + 'px', color: COLOR_SP_WARN }">
          <span class="warn-icon">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </span>
          {{ t('resourceMonitor.sp.insufficient') }}
        </div>
      </div>
    </div>

    <el-dialog v-model="isEnemySelectorVisible" :title="t('resourceMonitor.enemy.dialogTitle')" width="600px" align-center class="char-selector-dialog" :append-to-body="true">
      <div class="selector-header">
        <el-input v-model="enemySearchQuery" :placeholder="t('resourceMonitor.enemy.searchPlaceholder')" :prefix-icon="Search" clearable style="width: 100%" />
      </div>

      <div class="category-tabs">
        <button
            class="ea-btn ea-btn--glass-cut"
            :class="{ 'is-active': activeCategoryTab === CATEGORY_ALL }"
            :style="{ '--ea-btn-accent': 'var(--ea-gold)' }"
            @click="activeCategoryTab = CATEGORY_ALL"
        >{{ t('common.all') }}</button>
        <button
            v-for="cat in enemyCategories"
            :key="cat"
            class="ea-btn ea-btn--glass-cut"
            :class="{ 'is-active': activeCategoryTab === cat }"
            :style="{ '--ea-btn-accent': 'var(--ea-gold)' }"
            @click="activeCategoryTab = cat"
        >
          {{ cat }}
        </button>
      </div>

      <div class="enemy-list-grid">

        <div v-if="activeCategoryTab === CATEGORY_ALL && !enemySearchQuery" class="enemy-group-section">
          <div class="group-header">
            {{ t('resourceMonitor.enemy.specialGroup') }} <span class="count">(1)</span>
          </div>
          <div class="group-items">
            <div class="enemy-card"
                 :class="{ selected: store.activeEnemyId === 'custom' }"
                 @click="selectEnemy('custom')"
                 style="--tier-color: #ffd700;"> <div class="enemy-avatar-wrapper">
              <div class="enemy-avatar custom">?</div>
              <div class="tier-badge" style="background-color: #ffd700; color: #000;">EDIT</div>
            </div>

              <div class="enemy-info">
                <div class="name">{{ t('resourceMonitor.enemy.custom') }}</div>
                <div class="desc">{{ t('resourceMonitor.enemy.customDesc') }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-for="group in groupedEnemyList" :key="group.id" class="enemy-group-section">
          <div class="group-header">
            {{ group.name }}
            <span class="count">({{ group.list.length }})</span>
          </div>

          <div class="group-items">
            <div v-for="enemy in group.list" :key="enemy.id"
                 class="enemy-card"
                 :class="{ selected: store.activeEnemyId === enemy.id }"
                 :style="{ '--tier-color': getTierColor(enemy.tier) }"
                 @click="selectEnemy(enemy.id)">

              <div class="enemy-avatar-wrapper">
                <img :src="enemy.avatar" class="enemy-avatar" @error="e=>e.target.src='/Endaxis/avatars/default_enemy.webp'"/>
                <div v-if="enemy.tier && enemy.tier !== 'normal'" class="tier-badge" :style="{ backgroundColor: getTierColor(enemy.tier) }">
                  {{ getTierLabel(enemy.tier) }}
                </div>
              </div>

              <div class="enemy-info">
                <div class="name" :style="{ color: enemy.tier === 'boss' ? '#ff4d4f' : '#f0f0f0' }">
                  {{ enemy.name }}
                </div>
                <div class="desc">{{ t('resourceMonitor.enemy.desc', { max: enemy.maxStagger, nodes: enemy.staggerNodeCount }) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="groupedEnemyList.length === 0 && !(activeCategoryTab === CATEGORY_ALL && !enemySearchQuery)" class="empty-state">
          {{ t('resourceMonitor.enemy.empty') }}
        </div>

      </div>
    </el-dialog>

  </div>
</template>

<style scoped>
/* 基础布局与侧边栏容器 */
.resource-monitor-layout {
  display: grid;
  grid-template-columns: 180px 1fr;
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, sans-serif;
}

.monitor-sidebar {
  background-color: #252525;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

/* 敌人选择模块 */
.enemy-select-module {
  padding: 8px 10px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
}

.enemy-select-module:hover { background: rgba(255, 255, 255, 0.08); }

.module-deco-line {
  position: absolute;
  left: 0;
  top: 8px; bottom: 8px;
  width: 2px;
  background: #ffd700;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
}

.custom-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 215, 0, 0.05);
  border: 1px rgba(255, 215, 0, 0.4);
  box-sizing: border-box;
  color: #ffd700;
  font-size: 18px;
  font-weight: 900;
  font-family: 'Roboto Mono', monospace;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
}

.enemy-avatar-box {
  container-type: size;
  width: 32px;
  height: 32px;
  border: 1px solid #444;
  background: #111;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.enemy-avatar-box img { width: 100%; height: 100%; object-fit: cover; }

.scan-line {
  position: absolute; top: 0; left: 0; width: 100%; height: 1px;
  background: rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 4px #ffd700;
  will-change: transform;
  animation: scan 3s infinite linear;
}

.enemy-info-col {
  flex-grow: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.enemy-name {
  font-weight: bold;
  color: #eee;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.click-hint {
  font-size: 10px;
  color: #ffd700;
  opacity: 0.5;
  margin-top: 1px;
}

/* 属性设置区 */
.settings-scroll-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px 8px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: none;
}

.settings-scroll-area::-webkit-scrollbar {
  display: none;
}

.section-container.tech-style {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 3px solid rgba(255, 255, 255, 0.2);
  padding: 10px 8px 8px 8px;
  position: relative;
  flex-shrink: 0;
}

.section-container.border-red { border-left-color: #ff7875; }
.section-container.border-gold { border-left-color: #ffd700; }

.panel-tag-mini {
  position: absolute;
  right: 0; top: -11px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-bottom: none;
  font-size: 9px;
  color: #888;
  padding: 1px 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  clip-path: polygon(10% 0, 100% 0, 100% 100%, 0% 100%);
}

.panel-tag-mini.red { color: #ff7875; border-color: rgba(255, 120, 117, 0.4); }
.panel-tag-mini.gold { color: #ffd700; border-color: rgba(255, 215, 0, 0.4); }

.attribute-grid-mini {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.control-row-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.control-row-mini label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  letter-spacing: 0.3px;
}

:deep(.standard-input) {
  width: 65px !important;
  height: 22px !important;
  font-size: 11px !important;
}

/* 图表展示区 */
.chart-scroll-wrapper {
  grid-column: 2 / 3;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: #18181c;
}

.chart-svg { display: block; }

.warning-tag {
  position: absolute;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 3px;
  border: 1px solid rgba(255, 77, 79, 0.3);
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

/* 敌人选择弹窗容器 */
.enemy-list-grid {
  max-height: 450px;
  overflow-y: auto;
  padding: 10px;
  scrollbar-width: none;
}
.enemy-list-grid::-webkit-scrollbar { display: none; }

/* 分类页签 */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 8px;
  margin-bottom: 20px;
  padding: 8px;
  background: #1e1e1e;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  overflow: visible;
  white-space: normal;
}

.category-tabs .ea-btn {
  flex: none;
  margin-bottom: 2px;
  --ea-btn-py: 6px;
  --ea-btn-px: 16px;
}

/* --- 分组标题样式 --- */
.enemy-group-section {
  margin-bottom: 24px;
}

.group-header {
  font-size: 13px;
  font-weight: 800;
  color: #ececec;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #ffd700;
  display: flex;
  align-items: baseline;
  gap: 8px;
  letter-spacing: 1px;
}

.group-header .count {
  font-size: 11px;
  color: #666;
  font-weight: normal;
}

/* --- 敌人卡片网格布局 (3列) --- */
.group-items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.enemy-card {
  --tier-color: #555;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 3px solid #444;
  cursor: pointer;
  margin-bottom: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  min-width: 0;
  height: 64px;
  box-sizing: border-box;
}

.enemy-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.15);
  border-left-color: var(--tier-color) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5),
  -2px 0 8px -2px var(--tier-color);
}

.enemy-card.selected {
  border-left-color: var(--tier-color) !important;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
}

.enemy-avatar-wrapper {
  position: relative;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
}

.enemy-avatar {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  object-fit: cover;
  background: #111;
}

.tier-badge {
  position: absolute;
  bottom: -2px;
  right: -4px;
  color: #000;
  font-size: 8px;
  font-weight: 900;
  padding: 1px 5px;
  border-radius: 2px;
  text-transform: uppercase;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
  z-index: 2;
}

.enemy-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.enemy-info .name {
  font-size: 12px;
  font-weight: bold;
  color: #f0f0f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.enemy-info .desc {
  font-size: 10px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 自定义敌人的特殊头像样式 */
.enemy-avatar.custom {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 215, 0, 0.05);
  border: 1px rgba(255, 215, 0, 0.4);
  color: #ffd700;
  font-size: 22px;
  font-weight: 900;
  font-family: 'Roboto Mono', monospace;
  box-shadow: inset 0 0 10px rgba(255, 215, 0, 0.1);
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

/* 选中状态下的自定义头像变化 */
.enemy-card.selected .enemy-avatar.custom {
  background: rgba(255, 215, 0, 0.15);
  border-style: solid;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.2);
}

/* 动画定义 */
@keyframes scan {
  0% { transform: translateY(-10cqh); }
  100% { transform: translateY(110cqh); }
}

.stun-bg-anim { animation: stun-flash 2s infinite alternate; }
@keyframes stun-flash { 0% { fill-opacity: 0.1; } 100% { fill-opacity: 0.3; } }

.node-bar-anim { animation: node-pulse 1.5s infinite alternate; }
@keyframes node-pulse { 0% { opacity: 0.4; } 100% { opacity: 0.8; } }
</style>