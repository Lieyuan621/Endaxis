<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useTimelineStore } from '../stores/timelineStore.js';
import CustomNumberInput from './CustomNumberInput.vue';
import { getEnemyGameName } from '@/data/gameText';

const store = useTimelineStore();
const { t, locale } = useI18n({ useScope: 'global' });
const { enemyDatabase, enemyCategories } = storeToRefs(store);

const ENEMY_TIERS = store.ENEMY_TIERS;
const TIER_WEIGHTS = {
  leader: 5,
  boss: 4,
  elite: 3,
  advanced: 2,
  normal: 1,
};
const ENEMY_RESISTANCE_ELEMENTS = ['physical', 'heat', 'cryo', 'electric', 'nature'];
const ENEMY_LEVELS = [1, 20, 40, 60, 80, 90];
const CATEGORY_ALL = '__ALL__';
const CATEGORY_UNCATEGORIZED = '__UNCAT__';

const isEnemySelectorVisible = ref(false);
const enemySearchQuery = ref('');
const activeCategoryTab = ref(CATEGORY_ALL);

const activeEnemyInfo = computed(() => {
  if (store.activeEnemyId === 'custom') {
    return { name: t('resourceMonitor.enemy.custom'), avatar: '', isCustom: true };
  }
  const enemy = store.enemyDatabase.find(e => e.id === store.activeEnemyId);
  return enemy
    ? { ...enemy, name: getEnemyGameName(enemy.id, locale.value) }
    : { name: t('resourceMonitor.enemy.unknown'), avatar: '' };
});

const groupedEnemyList = computed(() => {
  locale.value;
  let list = (enemyDatabase.value || []).map(enemy => ({
    ...enemy,
    name: getEnemyGameName(enemy.id, locale.value),
  }));

  if (enemySearchQuery.value) {
    const q = enemySearchQuery.value.toLowerCase();
    list = list.filter(e => e.name.toLowerCase().includes(q));
  }

  const groups = {};
  const targetCategories =
    activeCategoryTab.value === CATEGORY_ALL
      ? [...enemyCategories.value, CATEGORY_UNCATEGORIZED]
      : [activeCategoryTab.value];

  targetCategories.forEach(cat => {
    groups[cat] = [];
  });

  list.forEach(enemy => {
    let cat = enemy.category;
    if (!cat || !enemyCategories.value.includes(cat)) cat = CATEGORY_UNCATEGORIZED;
    if (groups[cat]) groups[cat].push(enemy);
  });

  return targetCategories.flatMap(cat => {
    const enemyList = groups[cat];
    if (!enemyList || enemyList.length === 0) return [];
    enemyList.sort((a, b) => (TIER_WEIGHTS[b.tier] || 0) - (TIER_WEIGHTS[a.tier] || 0));
    return [
      {
        id: cat,
        name: cat === CATEGORY_UNCATEGORIZED ? t('common.uncategorized') : cat,
        list: enemyList,
      },
    ];
  });
});

function getTierColor(tierValue) {
  const tier = ENEMY_TIERS.find(t => t.value === tierValue);
  return tier ? tier.color : '#a0a0a0';
}

function getTierLabel(tierValue) {
  const tier = ENEMY_TIERS.find(t => t.value === tierValue);
  if (!tier) return '';
  if (tier.labelKey) return t(tier.labelKey);
  return tier.label || '';
}

function getTypeColor(typeKey) {
  return store.getColor?.(typeKey) || '#aaaaaa';
}

function selectEnemy(id) {
  store.applyEnemyPreset(id);
  isEnemySelectorVisible.value = false;
}

function setEnemyLevel(level) {
  store.setActiveEnemyLevel(level);
}
</script>

<template>
  <section class="enemy-settings-panel">
    <button type="button" class="enemy-select-module" @click="isEnemySelectorVisible = true">
      <div class="module-deco-line"></div>
      <div class="enemy-avatar-box">
        <img
          v-if="!activeEnemyInfo.isCustom"
          :src="activeEnemyInfo.avatar"
          @error="e => (e.target.src = '/Endaxis/avatars/default_enemy.webp')"
        />
        <div v-else class="custom-avatar-placeholder">?</div>
        <div class="scan-line"></div>
      </div>
      <div class="enemy-info-col">
        <div class="enemy-name-line">
          <span class="enemy-name">{{ activeEnemyInfo.name }}</span>
        </div>
        <div class="click-hint">{{ t('resourceMonitor.enemy.clickToChange') }}</div>
      </div>
    </button>

    <div class="settings-scroll-area">
      <div class="section-container tech-style border-red">
        <div class="panel-tag-mini red">{{ t('resourceMonitor.sections.enemy') }}</div>
        <div class="attribute-grid-mini">
          <div class="control-row-mini">
            <label>{{ t('resourceMonitor.labels.enemyHp') }}</label>
            <CustomNumberInput
              v-model="store.systemConstants.enemyHp"
              :min="1"
              active-color="#ff7875"
              class="standard-input"
            />
          </div>
          <div class="control-row-mini">
            <label>{{ t('resourceMonitor.labels.maxStagger') }}</label>
            <CustomNumberInput
              v-model="store.systemConstants.maxStagger"
              :min="1"
              active-color="#ff7875"
              class="standard-input"
            />
          </div>
          <div class="control-row-mini">
            <label>{{ t('resourceMonitor.labels.staggerNodes') }}</label>
            <CustomNumberInput
              v-model="store.systemConstants.staggerNodeCount"
              :min="0"
              class="standard-input"
            />
          </div>
          <div class="control-row-mini">
            <label>{{ t('resourceMonitor.labels.nodeDuration') }}</label>
            <CustomNumberInput
              v-model="store.systemConstants.staggerNodeDuration"
              :step="0.1"
              active-color="#ff7875"
              class="standard-input"
            />
          </div>
          <div class="control-row-mini">
            <label>{{ t('resourceMonitor.labels.breakDuration') }}</label>
            <CustomNumberInput
              v-model="store.systemConstants.staggerBreakDuration"
              :step="0.5"
              active-color="#ff7875"
              class="standard-input"
            />
          </div>
          <div class="control-row-mini">
            <label>{{ t('resourceMonitor.labels.executionRecovery') }}</label>
            <CustomNumberInput
              v-model="store.systemConstants.executionRecovery"
              :min="0"
              class="standard-input"
            />
          </div>
          <div class="control-row-mini">
            <label>{{ t('resourceMonitor.labels.superArmor') }}</label>
            <CustomNumberInput
              v-model="store.systemConstants.superArmor"
              :min="0"
              class="standard-input"
            />
          </div>
          <div class="mini-subsection-label">{{ t('resourceMonitor.labels.resistanceTitle') }}</div>
          <div
            v-for="element in ENEMY_RESISTANCE_ELEMENTS"
            :key="element"
            class="control-row-mini resistance-row"
          >
            <label :style="{ color: getTypeColor(element) }">
              {{ t(`resourceMonitor.resistance.${element}`) }}
            </label>
            <CustomNumberInput
              v-model="store.systemConstants.resistance[element]"
              :min="0"
              :step="1"
              :active-color="getTypeColor(element)"
              class="standard-input"
            />
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="isEnemySelectorVisible"
      :title="t('resourceMonitor.enemy.dialogTitle')"
      width="640px"
      align-center
      class="char-selector-dialog"
      :append-to-body="true"
    >
      <div class="selector-header">
        <el-input
          v-model="enemySearchQuery"
          :placeholder="t('resourceMonitor.enemy.searchPlaceholder')"
          :prefix-icon="Search"
          clearable
          style="width: 180px"
        />
        <div class="enemy-level-picker">
          <span class="tier-label">{{ t('resourceMonitor.enemy.level') }}</span>
          <div class="enemy-level-buttons">
            <button
              v-for="level in ENEMY_LEVELS"
              :key="`enemy_level_${level}`"
              type="button"
              class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-gold enemy-level-btn"
              :class="{ 'is-active': store.activeEnemyLevel === level }"
              @click="setEnemyLevel(level)"
            >
              {{ level }}
            </button>
          </div>
        </div>
      </div>

      <div class="category-tabs">
        <button
          class="ea-btn ea-btn--glass-cut"
          :class="{ 'is-active': activeCategoryTab === CATEGORY_ALL }"
          :style="{ '--ea-btn-accent': 'var(--ea-gold)' }"
          @click="activeCategoryTab = CATEGORY_ALL"
        >
          {{ t('common.all') }}
        </button>
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
        <div
          v-if="activeCategoryTab === CATEGORY_ALL && !enemySearchQuery"
          class="enemy-group-section"
        >
          <div class="group-header">
            {{ t('resourceMonitor.enemy.specialGroup') }} <span class="count">(1)</span>
          </div>
          <div class="group-items">
            <div
              class="enemy-card"
              :class="{ selected: store.activeEnemyId === 'custom' }"
              style="--tier-color: #ffd700"
              @click="selectEnemy('custom')"
            >
              <div class="enemy-avatar-wrapper">
                <div class="enemy-avatar custom">?</div>
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
            {{ group.name }} <span class="count">({{ group.list.length }})</span>
          </div>
          <div class="group-items">
            <div
              v-for="enemy in group.list"
              :key="enemy.id"
              class="enemy-card"
              :class="{ selected: store.activeEnemyId === enemy.id }"
              :style="{ '--tier-color': getTierColor(enemy.tier) }"
              @click="selectEnemy(enemy.id)"
            >
              <div class="enemy-avatar-wrapper">
                <img
                  :src="enemy.avatar"
                  class="enemy-avatar"
                  @error="e => (e.target.src = '/Endaxis/avatars/default_enemy.webp')"
                />
                <div
                  v-if="enemy.tier && enemy.tier !== 'normal'"
                  class="tier-badge"
                  :style="{ backgroundColor: getTierColor(enemy.tier) }"
                >
                  {{ getTierLabel(enemy.tier) }}
                </div>
              </div>
              <div class="enemy-info">
                <div
                  class="name"
                  :style="{
                    color:
                      enemy.tier === 'leader'
                        ? '#ff4d4f'
                        : enemy.tier === 'boss'
                          ? '#ffd700'
                          : '#f0f0f0',
                  }"
                >
                  {{ enemy.name }}
                </div>
                <div class="desc">
                  {{
                    t('resourceMonitor.enemy.desc', {
                      max: enemy.maxStagger,
                      nodes: enemy.staggerNodeCount,
                    })
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="
            groupedEnemyList.length === 0 &&
            !(activeCategoryTab === CATEGORY_ALL && !enemySearchQuery)
          "
          class="empty-state"
        >
          {{ t('resourceMonitor.enemy.empty') }}
        </div>
      </div>
    </el-dialog>
  </section>
</template>

<style scoped>
.enemy-settings-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #252526;
}

.enemy-select-module {
  width: 100%;
  padding: 8px 10px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  text-align: left;
}

.enemy-select-module:hover {
  background: rgba(255, 255, 255, 0.08);
}

.module-deco-line {
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: #ffd700;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
}

.custom-avatar-placeholder,
.enemy-avatar.custom {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 215, 0, 0.05);
  color: #ffd700;
  font-size: 18px;
  font-weight: 900;
  font-family: 'Roboto Mono', monospace;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
}

.enemy-avatar-box {
  width: 32px;
  height: 32px;
  border: 1px solid #444;
  background: #111;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.enemy-avatar-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 4px #ffd700;
  animation: scan 3s infinite linear;
}

@keyframes scan {
  from {
    transform: translateY(-2px);
  }
  to {
    transform: translateY(34px);
  }
}

.enemy-info-col {
  flex-grow: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.enemy-name-line {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
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

.settings-scroll-area {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: none;
}

.settings-scroll-area::-webkit-scrollbar {
  display: none;
}

.section-container.tech-style {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 3px solid rgba(255, 255, 255, 0.2);
  padding: 10px 8px 8px;
  position: relative;
  flex-shrink: 0;
}

.section-container.border-red {
  border-left-color: #ff7875;
}

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

.mini-subsection-label {
  margin-top: 4px;
  padding-top: 7px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.58);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.resistance-row label {
  max-width: 86px;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.standard-input) {
  width: 65px !important;
  height: 22px !important;
  font-size: 11px !important;
}

.selector-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.enemy-level-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.enemy-level-picker .tier-label {
  font-size: 12px;
  color: #888;
  font-weight: 700;
  user-select: none;
}

.enemy-level-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.enemy-level-btn {
  min-width: 30px;
  height: 24px;
  padding: 0 7px;
  line-height: 1;
}

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

.enemy-list-grid {
  max-height: 450px;
  overflow-y: auto;
  padding: 10px;
  scrollbar-width: none;
}

.enemy-list-grid::-webkit-scrollbar {
  display: none;
}

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
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.5),
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
  background: #111;
  object-fit: cover;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
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

.enemy-card.selected .enemy-avatar.custom {
  background: rgba(255, 215, 0, 0.15);
  border-style: solid;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.2);
}

.empty-state {
  color: #666;
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
}
</style>
