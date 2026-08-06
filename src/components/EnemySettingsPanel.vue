<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useTimelineStore } from '../stores/timelineStore.js';
import EditEnemyBaseStatsDialog from './EditEnemyBaseStatsDialog.vue';
import { getEnemyGameName } from '@/data/gameText';
import { ENEMY_TIERS, ENEMY_TIER_WEIGHT } from '@/utils/theme';

const store = useTimelineStore();
const { t, locale } = useI18n({ useScope: 'global' });
const { enemyDatabase, enemyCategories } = storeToRefs(store);
const props = defineProps({
  selectorOnly: { type: Boolean, default: false },
});

const ENEMY_RESISTANCE_ELEMENTS = ['physical', 'heat', 'cryo', 'electric', 'nature'];
const ENEMY_LEVELS = [1, 20, 40, 60, 80, 90];
const CATEGORY_ALL = '__ALL__';
const CATEGORY_UNCATEGORIZED = '__UNCAT__';

const isEnemySelectorVisible = ref(false);
const isStatsDialogVisible = ref(false);
const enemySearchQuery = ref('');
const activeCategoryTab = ref(CATEGORY_ALL);
const activeTierFilter = ref('ALL');

const TIER_FILTERS = computed(() => {
  locale.value;
  return [
    { label: t('common.all'), value: 'ALL', color: 'var(--ea-gold)' },
    ...ENEMY_TIERS.map(tier => ({
      label: t(tier.labelKey),
      value: tier.value,
      color: tier.color,
    })),
  ];
});

const activeEnemyInfo = computed(() => {
  if (store.activeEnemyId === 'custom') {
    return { name: t('resourceMonitor.enemy.custom'), avatar: '', isCustom: true };
  }
  const enemy = store.enemyDatabase.find(e => e.id === store.activeEnemyId);
  return enemy
    ? { ...enemy, name: getEnemyGameName(enemy.id, locale.value) }
    : { name: t('resourceMonitor.enemy.unknown'), avatar: '' };
});

const showCustomEnemyCard = computed(
  () =>
    activeCategoryTab.value === CATEGORY_ALL &&
    activeTierFilter.value === 'ALL' &&
    !enemySearchQuery.value,
);

const summaryHp = computed(() => Math.max(1, Number(store.systemConstants.enemyHp) || 1));
const summaryStagger = computed(() => Math.max(1, Number(store.systemConstants.maxStagger) || 1));
const summaryStaggerNodes = computed(() =>
  Math.max(0, Number(store.systemConstants.staggerNodeCount) || 0),
);
const resistanceSummary = computed(() => {
  const res = store.systemConstants.resistance || {};
  return ENEMY_RESISTANCE_ELEMENTS.map(el => ({
    key: el,
    value: Number(res[el]) || 0,
    color: store.getColor?.(el) || '#aaaaaa',
  }));
});

function tierWeight(tier) {
  return ENEMY_TIER_WEIGHT[tier] || 0;
}

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

  if (activeTierFilter.value !== 'ALL') {
    list = list.filter(e => (e.tier || 'normal') === activeTierFilter.value);
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
    enemyList.sort((a, b) => tierWeight(b.tier) - tierWeight(a.tier));
    return [
      {
        id: cat,
        name: cat === CATEGORY_UNCATEGORIZED ? t('common.uncategorized') : cat,
        list: enemyList,
      },
    ];
  });
});

function getTierMeta(tierValue) {
  return ENEMY_TIERS.find(t => t.value === tierValue);
}

function getTierColor(tierValue) {
  return getTierMeta(tierValue)?.color || '#a0a0a0';
}

function getTierLabel(tierValue) {
  const tier = getTierMeta(tierValue);
  return tier ? t(tier.labelKey) : '';
}

function selectEnemy(id) {
  store.applyEnemyPreset(id);
  isEnemySelectorVisible.value = false;
}

function openSelector() {
  isEnemySelectorVisible.value = true;
}

function closeSelector() {
  isEnemySelectorVisible.value = false;
}

defineExpose({
  openSelector,
  close: closeSelector,
  isOpen: () => isEnemySelectorVisible.value,
});

function setEnemyLevel(level) {
  store.setActiveEnemyLevel(level);
}
</script>

<template>
  <section
    class="enemy-settings-panel"
    :class="{ 'is-selector-only': props.selectorOnly }"
  >
    <template v-if="!props.selectorOnly">
    <button type="button" class="enemy-select-module" @click="openSelector">
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
          <span v-if="!activeEnemyInfo.isCustom" class="enemy-level-badge"
            >Lv{{ store.activeEnemyLevel }}</span
          >
        </div>
        <div class="click-hint">{{ t('resourceMonitor.enemy.clickToChange') }}</div>
      </div>
    </button>

    <div class="stats-summary">
      <div class="summary-row">
        <span class="summary-label">{{ t('resourceMonitor.labels.enemyHp') }}</span>
        <span class="summary-value">{{ summaryHp.toLocaleString() }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">{{ t('resourceMonitor.labels.maxStagger') }}</span>
        <span class="summary-value">{{ summaryStagger.toLocaleString() }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">{{ t('resourceMonitor.labels.staggerNodes') }}</span>
        <span class="summary-value">{{ summaryStaggerNodes }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">{{ t('resourceMonitor.labels.resistanceTitle') }}</span>
        <span class="summary-value summary-value--res">
          <template v-for="(item, index) in resistanceSummary" :key="item.key">
            <span v-if="index > 0" class="res-sep">/</span>
            <span class="res-value" :style="{ color: item.color }">{{ item.value }}</span>
          </template>
        </span>
      </div>
      <button
        type="button"
        class="ea-btn ea-btn--sm ea-btn--glass-rect stats-edit-btn"
        @click="isStatsDialogVisible = true"
      >
        {{ t('resourceMonitor.enemy.editStats') }}
      </button>
    </div>

    <EditEnemyBaseStatsDialog v-model:visible="isStatsDialogVisible" />
    </template>

    <el-dialog
      v-model="isEnemySelectorVisible"
      :title="t('resourceMonitor.enemy.dialogTitle')"
      width="640px"
      align-center
      class="char-selector-dialog enemy-selector-dialog"
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

      <div class="enemy-filter-rows">
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
        <div class="tier-filters">
          <button
            v-for="tier in TIER_FILTERS"
            :key="tier.value"
            class="ea-btn ea-btn--glass-cut"
            :class="{ 'is-active': activeTierFilter === tier.value }"
            :style="{ '--ea-btn-accent': tier.color }"
            @click="activeTierFilter = tier.value"
          >
            {{ tier.label }}
          </button>
        </div>
      </div>

      <div class="enemy-list-grid">
        <div v-if="showCustomEnemyCard" class="enemy-group-section">
          <div class="group-header">
            {{ t('resourceMonitor.enemy.specialGroup') }} <span class="count">(1)</span>
          </div>
          <div class="group-items">
            <div
              class="enemy-card"
              :class="{ selected: store.activeEnemyId === 'custom' }"
              style="--tier-color: var(--ea-gold)"
              @click="selectEnemy('custom')"
            >
              <div class="enemy-avatar-wrapper is-custom">
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
              :class="{
                selected: store.activeEnemyId === enemy.id,
                'has-tier': enemy.tier && enemy.tier !== 'normal',
              }"
              :style="{ '--tier-color': getTierColor(enemy.tier) }"
              @click="selectEnemy(enemy.id)"
            >
              <div class="enemy-avatar-wrapper">
                <img
                  :src="enemy.avatar"
                  class="enemy-avatar"
                  @error="e => (e.target.src = '/Endaxis/avatars/default_enemy.webp')"
                />
                <div v-if="enemy.tier && enemy.tier !== 'normal'" class="tier-strip">
                  {{ getTierLabel(enemy.tier) }}
                </div>
              </div>
              <div class="enemy-info">
                <div class="name">{{ enemy.name }}</div>
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

        <div v-if="groupedEnemyList.length === 0 && !showCustomEnemyCard" class="empty-state">
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
  background: var(--ea-workbench-panel, #252526);
  color: var(--ea-fg, #f0f0f0);
}

.enemy-settings-panel.is-selector-only {
  display: contents;
}

.enemy-select-module {
  width: 100%;
  padding: 8px 10px;
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.03));
  border: none;
  border-bottom: 1px solid var(--ea-border-soft, rgba(255, 255, 255, 0.08));
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  text-align: left;
}

.enemy-select-module:hover {
  background: var(--ea-hover-fill, rgba(255, 255, 255, 0.06));
}

.module-deco-line {
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--ea-gold);
}

.custom-avatar-placeholder,
.enemy-avatar.custom {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--ea-gold) 5%, transparent);
  color: var(--ea-gold);
  font-size: 18px;
  font-weight: 900;
  font-family: 'Roboto Mono', monospace;
}

.enemy-avatar-box {
  width: 32px;
  height: 32px;
  border: 1px solid var(--ea-border-strong, #444);
  background: var(--ea-keycap-bg, #111);
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
  background: color-mix(in srgb, var(--ea-gold) 30%, transparent);
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
  color: var(--ea-fg, #eee);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.enemy-level-badge {
  flex-shrink: 0;
  color: var(--ea-gold);
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  opacity: 0.86;
}

.click-hint {
  font-size: 10px;
  color: var(--ea-gold);
  opacity: 0.5;
  margin-top: 1px;
}

.stats-summary {
  flex: 1 1 0;
  min-height: 0;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.03));
}

.summary-label {
  font-size: 11px;
  color: var(--ea-fg-secondary, rgba(255, 255, 255, 0.48));
  white-space: nowrap;
}

.summary-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--ea-fg, rgba(255, 255, 255, 0.86));
  text-align: right;
}

.summary-value--res {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
  font-size: 11px;
  letter-spacing: 0.02em;
}
.res-sep {
  color: var(--ea-fg-faint, rgba(255, 255, 255, 0.28));
  margin: 0 2px;
}
.res-value {
  font-weight: 800;
}

.stats-edit-btn {
  margin-top: auto;
  width: 100%;
  justify-content: center;
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
  color: var(--ea-fg-muted, #888);
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

.enemy-filter-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding: 8px;
  background: var(--ea-fill-input, #1e1e1e);
  border-bottom: 1px solid color-mix(in srgb, var(--ea-gold) 20%, transparent);
}

.category-tabs,
.tier-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 100%;
  overflow: visible;
  white-space: normal;
}

.category-tabs .ea-btn,
.tier-filters .ea-btn {
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
  color: var(--ea-fg, #ececec);
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid var(--ea-gold);
  display: flex;
  align-items: baseline;
  gap: 8px;
  letter-spacing: 1px;
}

.group-header .count {
  font-size: 11px;
  color: var(--ea-fg-faint, #666);
  font-weight: normal;
}

.group-items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.enemy-card {
  --tier-color: #555;
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: var(--ea-fill-muted, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--ea-border-soft, rgba(255, 255, 255, 0.05));
  border-left: 3px solid var(--ea-border-strong, #444);
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease;
  min-width: 0;
  height: 64px;
  box-sizing: border-box;
}

.enemy-card.has-tier {
  border-left-color: var(--tier-color);
}

.enemy-card:hover {
  background: color-mix(in srgb, var(--ea-gold) 7%, transparent);
}

.enemy-card.has-tier:hover {
  background: color-mix(in srgb, var(--tier-color) 10%, rgba(255, 255, 255, 0.03));
}

.enemy-card.selected {
  background: color-mix(in srgb, var(--ea-gold) 12%, transparent);
  border-top-color: color-mix(in srgb, var(--ea-gold) 18%, transparent);
  border-right-color: color-mix(in srgb, var(--ea-gold) 18%, transparent);
  border-bottom-color: color-mix(in srgb, var(--ea-gold) 18%, transparent);
}

.enemy-card.has-tier.selected {
  background: color-mix(in srgb, var(--tier-color) 16%, rgba(255, 255, 255, 0.03));
  border-top-color: color-mix(in srgb, var(--tier-color) 24%, transparent);
  border-right-color: color-mix(in srgb, var(--tier-color) 24%, transparent);
  border-bottom-color: color-mix(in srgb, var(--tier-color) 24%, transparent);
}

.enemy-card.selected:hover {
  background: color-mix(in srgb, var(--ea-gold) 15%, transparent);
}

.enemy-card.has-tier.selected:hover {
  background: color-mix(in srgb, var(--tier-color) 20%, rgba(255, 255, 255, 0.03));
}

.enemy-card.selected .name {
  color: var(--ea-fg, #fff);
}

.enemy-card.has-tier.selected .name {
  color: var(--tier-color);
}

.enemy-avatar-wrapper {
  position: relative;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid var(--ea-border, rgba(255, 255, 255, 0.1));
  background: var(--ea-keycap-bg, #111);
}

.enemy-avatar {
  width: 100%;
  height: 100%;
  border: none;
  background: var(--ea-keycap-bg, #111);
  object-fit: cover;
  display: block;
}

.tier-strip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 14px;
  padding: 0 2px;
  background: linear-gradient(
    to top,
    var(--ea-stack-bg, rgba(0, 0, 0, 0.92)) 0%,
    color-mix(in srgb, var(--ea-stack-bg, rgba(0, 0, 0, 0.92)) 70%, transparent) 100%
  );
  color: var(--tier-color);
  border-top: 1px solid color-mix(in srgb, var(--tier-color) 55%, transparent);
  font-size: 8px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.06em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px var(--ea-shadow, rgba(0, 0, 0, 0.85));
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
  color: var(--ea-fg, #f0f0f0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.enemy-card.has-tier .name {
  color: var(--tier-color);
}

.enemy-info .desc {
  font-size: 10px;
  color: var(--ea-fg-muted, #888);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.enemy-avatar.custom {
  border: none;
  font-size: 22px;
}

.enemy-avatar-wrapper.is-custom {
  border-color: color-mix(in srgb, var(--ea-gold) 40%, transparent);
}

.enemy-card.selected .enemy-avatar-wrapper.is-custom {
  background: color-mix(in srgb, var(--ea-gold) 12%, transparent);
}

.empty-state {
  color: var(--ea-fg-faint, #666);
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
}

:global(html[data-theme='light'] .enemy-settings-panel .enemy-card) {
  background: var(--ea-surface-row);
  border-color: var(--ea-border);
}
:global(html[data-theme='light'] .enemy-settings-panel .enemy-card:hover) {
  background: rgba(180, 140, 0, 0.1);
}
:global(html[data-theme='light'] .enemy-settings-panel .enemy-card.selected) {
  background: rgba(180, 140, 0, 0.14);
  border-top-color: rgba(180, 140, 0, 0.35);
  border-right-color: rgba(180, 140, 0, 0.35);
  border-bottom-color: rgba(180, 140, 0, 0.35);
}
:global(html[data-theme='light'] .enemy-settings-panel .summary-row) {
  background: var(--ea-surface-row);
}
:global(html[data-theme='light'] .enemy-settings-panel .enemy-filter-rows) {
  background: var(--ea-surface-sunken);
}
:global(html[data-theme='light'] .enemy-settings-panel .enemy-avatar-box),
:global(html[data-theme='light'] .enemy-settings-panel .enemy-avatar-wrapper),
:global(html[data-theme='light'] .enemy-settings-panel .enemy-avatar) {
  background: var(--ea-chip-fill);
  border-color: rgba(26, 27, 30, 0.14);
}
:global(html[data-theme='light'] .char-selector-dialog .el-dialog__body) {
  color: var(--ea-dialog-body, #3a3d44);
}
:global(html[data-theme='light'] .char-selector-dialog .el-input__wrapper) {
  background-color: var(--ea-fill-input, var(--ea-surface-soft)) !important;
  box-shadow: 0 0 0 1px var(--ea-border, #d8dbe0) inset !important;
}
:global(html[data-theme='light'] .char-selector-dialog .el-input__inner) {
  color: var(--ea-fg, #1a1b1e) !important;
}
</style>
