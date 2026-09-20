<script setup lang="ts">
import { ElIcon } from 'element-plus';
/**
 * 敌人实例的选择与属性编辑界面。
 * 组件复用旧版布局语言，但只处理草稿和展示；定义解析、默认值捕获与事务提交由外层协调器负责。
 */
import {
  EaButton,
  EaDeleteIcon,
  EaDialog,
  EaDialogActions,
  EaFilterChip,
  EaInput,
  EaNumberInput,
} from '@/design-system';
import { computed, reactive, ref, watch } from 'vue';
import { Plus, Search } from '@element-plus/icons-vue';
import { elementColors } from '../../gameColors';
import { useI18n } from 'vue-i18n';
import type { EnemyDefinition, EnemyTier } from '../../../core/game-data/enemyDefinition';
import { ENEMY_LEVELS as LEVELS, getEnemyHpAtLevel } from '../../../core/game-data/enemyDefinition';
import type { EnemyDocument, EnemyEditableValues } from '../../../core/project/schema';
import { DAMAGE_ELEMENTS } from '../../../core/game-data/operatorDefinition';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import { cloneEditorDefinition } from '../../cloneEditorDefinition';
import {
  generatedEnemySelectionCategories,
  generatedEnemySelectionCategoryById,
  generatedHiddenEnemyIds,
} from '../../../data/enemies/generated/index.generated';

const EDITABLE_RESISTANCE_DAMAGE_TYPES = DAMAGE_ELEMENTS;
const { t } = useI18n();

const TIERS: readonly { value: EnemyTier; color: string }[] = [
  { value: 'leader', color: '#ff4d4f' },
  { value: 'boss', color: '#ffd700' },
  { value: 'elite', color: '#d8b4fe' },
  { value: 'advanced', color: '#52c41a' },
  { value: 'normal', color: '#a0a0a0' },
];
const CATEGORY_ALL = '__all__';
const CATEGORY_UNCATEGORIZED = '__uncategorized__';
const categoryByEnemyId: Readonly<Record<string, string>> = generatedEnemySelectionCategoryById;
const hiddenEnemyIds = new Set<string>(generatedHiddenEnemyIds);
const TIER_WEIGHT: Readonly<Record<EnemyTier, number>> = {
  normal: 0,
  advanced: 1,
  elite: 2,
  boss: 3,
  leader: 4,
};

const props = defineProps<{
  readOnly?: boolean;
  enemy: EnemyDocument;
  definition: EnemyDefinition | null;
  enemies: readonly EnemyDefinition[];
  fps: number;
  nameOf: (enemyId: string) => string;
  labels: {
    all: string;
    close: string;
    confirm: string;
    custom: string;
    customDescription: string;
    unknown: string;
    clickToChange: string;
    selectTitle: string;
    searchPlaceholder: string;
    level: string;
    empty: string;
    editStats: string;
    editStatsTitle: string;
    enemyHp: string;
    defense: string;
    finisherMultiplier: string;
    maximumStagger: string;
    staggerNodes: string;
    nodeDuration: string;
    brokenDuration: string;
    finisherRecovery: string;
    superArmor: string;
    resistances: string;
    resistance: Record<(typeof EDITABLE_RESISTANCE_DAMAGE_TYPES)[number], string>;
    tier: Record<EnemyTier, string>;
  };
}>();

const emit = defineEmits<{
  selectDefinition: [enemyId: string, level: number];
  selectCustom: [level: number];
  save: [values: EnemyEditableValues];
}>();

const selectorVisible = ref(false);
const statsVisible = ref(false);
const searchQuery = ref('');
const tierFilter = ref<EnemyTier | 'all'>('all');
const categoryFilter = ref<string>(CATEGORY_ALL);
const selectedLevel = ref(90);
const draft = reactive<EnemyEditableValues>(cloneEditorDefinition(props.enemy.editable));

const activeName = computed(() =>
  props.enemy.source.kind === 'custom'
    ? props.labels.custom
    : props.definition === null
      ? props.labels.unknown
      : props.nameOf(props.definition.id),
);
const resistanceSummary = computed(() =>
  EDITABLE_RESISTANCE_DAMAGE_TYPES.map(type => ({
    type,
    value: props.enemy.editable.resistances[type] ?? 0,
    color: elementColors[type] ?? '#aaaaaa',
  })),
);
const filteredEnemies = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  return props.enemies.filter(enemy => {
    if (hiddenEnemyIds.has(enemy.id)) return false;
    if (tierFilter.value !== 'all' && enemy.tier !== tierFilter.value) return false;
    const category = categoryByEnemyId[enemy.id] ?? CATEGORY_UNCATEGORIZED;
    if (categoryFilter.value !== CATEGORY_ALL && category !== categoryFilter.value) return false;
    return query.length === 0 || props.nameOf(enemy.id).toLocaleLowerCase().includes(query);
  });
});
const groupedEnemies = computed(() => {
  const categories =
    categoryFilter.value === CATEGORY_ALL
      ? [...generatedEnemySelectionCategories, CATEGORY_UNCATEGORIZED]
      : [categoryFilter.value];
  return categories.flatMap(category => {
    const enemies = filteredEnemies.value
      .filter(candidate => (categoryByEnemyId[candidate.id] ?? CATEGORY_UNCATEGORIZED) === category)
      .sort((left, right) => TIER_WEIGHT[right.tier] - TIER_WEIGHT[left.tier]);
    return enemies.length === 0 ? [] : [{ category, enemies }];
  });
});
const showCustomEnemy = computed(
  () =>
    categoryFilter.value === CATEGORY_ALL &&
    tierFilter.value === 'all' &&
    searchQuery.value.trim() === '',
);
const canAddKnotThreshold = computed(() => (draft.stagger.knotThresholds.at(-1) ?? 0) < 0.99);

watch(
  () => props.enemy.source,
  source => {
    selectedLevel.value = source.level;
  },
  { immediate: true },
);
watch(statsVisible, visible => {
  if (visible) Object.assign(draft, cloneEditorDefinition(props.enemy.editable));
});

function supportsLevel(enemy: EnemyDefinition): boolean {
  return getEnemyHpAtLevel(enemy, selectedLevel.value) !== null;
}

function tierColor(tier: EnemyTier): string {
  return TIERS.find(item => item.value === tier)?.color ?? '#a0a0a0';
}

function selectDefinition(enemy: EnemyDefinition): void {
  if (!supportsLevel(enemy)) return;
  emit('selectDefinition', enemy.id, selectedLevel.value);
  selectorVisible.value = false;
}

function selectCustom(): void {
  emit('selectCustom', selectedLevel.value);
  selectorVisible.value = false;
}

function selectLevel(level: number): void {
  selectedLevel.value = level;
  if (props.enemy.source.kind === 'custom') emit('selectCustom', level);
  else if (props.definition !== null && getEnemyHpAtLevel(props.definition, level) !== null) {
    emit('selectDefinition', props.definition.id, level);
  }
}

function saveDraft(): void {
  emit('save', cloneEditorDefinition(draft));
  statsVisible.value = false;
}

function setDraftNumber(
  target: Record<string, number>,
  key: string,
  value: number | undefined,
): void {
  if (value !== undefined && Number.isFinite(value)) target[key] = value;
}

function setDuration(
  field: 'knotBreakDurationFrames' | 'brokenDurationFrames',
  seconds: number | undefined,
): void {
  if (seconds !== undefined && Number.isFinite(seconds)) {
    draft.stagger[field] = Math.max(0, Math.round(seconds * props.fps));
  }
}

function addKnotThreshold(): void {
  const previous = draft.stagger.knotThresholds.at(-1) ?? 0;
  if (previous >= 0.99) return;
  draft.stagger.knotThresholds.push(Math.min(0.99, Math.round((previous + 0.25) * 100) / 100));
}

function removeKnotThreshold(index: number): void {
  draft.stagger.knotThresholds.splice(index, 1);
}
</script>

<template>
  <section class="enemy-settings-panel">
    <EaButton
      type="button"
      class="enemy-select-module"
      :disabled="readOnly"
      @click="selectorVisible = true"
    >
      <span class="module-deco-line"></span>
      <span class="enemy-avatar-box">
        <img v-if="definition?.iconPath" :src="definition.iconPath" alt="" />
        <span v-else class="custom-avatar-placeholder">?</span>
        <span class="scan-line"></span>
      </span>
      <span class="enemy-info-col">
        <span class="enemy-name-line">
          <strong class="enemy-name">{{ activeName }}</strong>
          <span v-if="enemy.source.kind !== 'custom'" class="enemy-level-badge"
            >Lv{{ enemy.source.level }}</span
          >
        </span>
        <span class="click-hint">{{ labels.clickToChange }}</span>
      </span>
    </EaButton>

    <div class="stats-summary">
      <div class="summary-row">
        <span class="summary-label">{{ labels.enemyHp }}</span
        ><span class="summary-value">{{ enemy.editable.hp.toLocaleString() }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">{{ labels.maximumStagger }}</span
        ><span class="summary-value">{{ enemy.editable.stagger.maximum.toLocaleString() }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">{{ labels.staggerNodes }}</span
        ><span class="summary-value">{{ enemy.editable.stagger.knotThresholds.length }}</span>
      </div>
      <div class="summary-row summary-row--resistance">
        <span class="summary-label">{{ labels.resistances }}</span>
        <span class="summary-value summary-value--res">
          <template v-for="(item, index) in resistanceSummary" :key="item.type">
            <span v-if="index > 0" class="res-sep">/</span>
            <span class="res-value" :style="{ color: item.color }">{{ item.value }}</span>
          </template>
        </span>
      </div>
      <EaButton size="sm" type="button" class="stats-edit-button" @click="statsVisible = true">
        {{ labels.editStats }}
      </EaButton>
    </div>

    <InputRegionBoundary label="enemy-selection" :active="selectorVisible" modal>
      <EaDialog
        v-model="selectorVisible"
        :title="labels.selectTitle"
        width="640px"
        align-center
        append-to-body
        class="char-selector-dialog next-enemy-selector"
      >
        <div class="selector-header">
          <EaInput
            v-model="searchQuery"
            :placeholder="labels.searchPlaceholder"
            :prefix-icon="Search"
            clearable
          />
          <div class="enemy-level-picker">
            <span class="level-label">{{ labels.level }}</span>
            <div class="level-buttons">
              <EaButton
                size="sm"
                v-for="level in LEVELS"
                :key="level"
                type="button"
                @click="selectLevel(level)"
                :pressed="selectedLevel === level"
              >
                {{ level }}
              </EaButton>
            </div>
          </div>
        </div>
        <div class="enemy-filter-rows">
          <div class="category-tabs">
            <EaFilterChip
              type="button"
              :selected="categoryFilter === CATEGORY_ALL"
              accent="var(--ea-gold)"
              @click="categoryFilter = CATEGORY_ALL"
            >
              {{ labels.all }}
            </EaFilterChip>
            <EaFilterChip
              v-for="category in generatedEnemySelectionCategories"
              :key="category"
              type="button"
              :selected="categoryFilter === category"
              accent="var(--ea-gold)"
              @click="categoryFilter = category"
            >
              {{ t(`resourceMonitor.enemy.categories.${category}`) }}
            </EaFilterChip>
          </div>
          <div class="tier-filters">
            <EaFilterChip
              type="button"
              :selected="tierFilter === 'all'"
              accent="var(--ea-gold)"
              @click="tierFilter = 'all'"
            >
              {{ labels.all }}
            </EaFilterChip>
            <EaFilterChip
              v-for="tier in TIERS"
              :key="tier.value"
              type="button"
              :selected="tierFilter === tier.value"
              :accent="tier.color"
              @click="tierFilter = tier.value"
            >
              {{ labels.tier[tier.value] }}
            </EaFilterChip>
          </div>
        </div>
        <div class="enemy-list-grid">
          <section v-if="showCustomEnemy" class="enemy-group-section">
            <div class="group-header">
              {{ t('resourceMonitor.enemy.specialGroup') }} <span>(1)</span>
            </div>
            <div class="group-items">
              <EaButton
                type="button"
                class="enemy-card enemy-card--custom"
                variant="ghost"
                @click="selectCustom"
                :pressed="enemy.source.kind === 'custom'"
              >
                <span class="card-avatar">?</span>
                <span class="card-info"
                  ><strong>{{ labels.custom }}</strong
                  ><small>{{ labels.customDescription }}</small></span
                >
              </EaButton>
            </div>
          </section>
          <section
            v-for="group in groupedEnemies"
            :key="group.category"
            class="enemy-group-section"
          >
            <div class="group-header">
              {{
                group.category === CATEGORY_UNCATEGORIZED
                  ? t('common.uncategorized')
                  : t(`resourceMonitor.enemy.categories.${group.category}`)
              }}
              <span>({{ group.enemies.length }})</span>
            </div>
            <div class="group-items">
              <EaButton
                v-for="candidate in group.enemies"
                :key="candidate.id"
                type="button"
                class="enemy-card"
                variant="ghost"
                :class="{ 'has-tier': candidate.tier !== 'normal' }"
                :disabled="!supportsLevel(candidate)"
                :style="{
                  '--tier-color': tierColor(candidate.tier),
                }"
                @click="selectDefinition(candidate)"
                :pressed="definition?.id === candidate.id"
              >
                <span class="card-avatar">
                  <img :src="candidate.iconPath" alt="" />
                  <span v-if="candidate.tier !== 'normal'" class="tier-strip">{{
                    labels.tier[candidate.tier]
                  }}</span>
                </span>
                <span class="card-info">
                  <strong>{{ nameOf(candidate.id) }}</strong>
                  <small>{{
                    t('resourceMonitor.enemy.desc', {
                      max: candidate.stagger.maximum,
                      nodes: candidate.stagger.knotThresholds.length,
                    })
                  }}</small>
                </span>
              </EaButton>
            </div>
          </section>
          <div v-if="groupedEnemies.length === 0 && !showCustomEnemy" class="empty-state">
            {{ labels.empty }}
          </div>
        </div>
      </EaDialog>
    </InputRegionBoundary>

    <InputRegionBoundary label="enemy-stats" :active="statsVisible" modal>
      <EaDialog
        v-model="statsVisible"
        :title="labels.editStatsTitle"
        width="440px"
        align-center
        append-to-body
        class="armory-dialog next-enemy-stats-dialog"
      >
        <fieldset class="stats-form" :disabled="readOnly">
          <label
            ><span>{{ labels.enemyHp }}</span
            ><EaNumberInput v-model="draft.hp" size="sm" controls-position="right" :min="1"
          /></label>
          <label
            ><span>{{ labels.defense }}</span
            ><EaNumberInput v-model="draft.defense" size="sm" controls-position="right" :min="0"
          /></label>
          <label
            ><span>{{ labels.finisherMultiplier }}</span
            ><EaNumberInput
              v-model="draft.finisherMultiplier"
              size="sm"
              controls-position="right"
              :min="0"
              :step="0.05"
          /></label>
          <label
            ><span>{{ labels.maximumStagger }}</span
            ><EaNumberInput
              v-model="draft.stagger.maximum"
              size="sm"
              controls-position="right"
              :min="0"
          /></label>
          <div class="knot-threshold-field">
            <span>{{ labels.staggerNodes }}</span>
            <div class="knot-threshold-list">
              <div
                v-for="(_, index) in draft.stagger.knotThresholds"
                :key="index"
                class="knot-threshold-row"
              >
                <EaNumberInput
                  v-model="draft.stagger.knotThresholds[index]"
                  size="sm"
                  controls-position="right"
                  :min="0.01"
                  :max="0.99"
                  :step="0.01"
                />
                <EaButton
                  type="button"
                  variant="danger"
                  size="sm"
                  icon-only
                  :title="labels.close"
                  :aria-label="labels.close"
                  @click="removeKnotThreshold(index)"
                >
                  <EaDeleteIcon />
                </EaButton>
              </div>
              <EaButton
                size="sm"
                type="button"
                class="add-knot-button"
                :disabled="!canAddKnotThreshold"
                @click="addKnotThreshold"
              >
                <el-icon><Plus /></el-icon>
                {{ labels.staggerNodes }}
              </EaButton>
            </div>
          </div>
          <label
            ><span>{{ labels.nodeDuration }}</span
            ><EaNumberInput
              size="sm"
              controls-position="right"
              :model-value="draft.stagger.knotBreakDurationFrames / fps"
              :min="0"
              :step="0.1"
              @change="setDuration('knotBreakDurationFrames', $event)"
          /></label>
          <label
            ><span>{{ labels.brokenDuration }}</span
            ><EaNumberInput
              size="sm"
              controls-position="right"
              :model-value="draft.stagger.brokenDurationFrames / fps"
              :min="0"
              :step="0.1"
              @change="setDuration('brokenDurationFrames', $event)"
          /></label>
          <label
            ><span>{{ labels.finisherRecovery }}</span
            ><EaNumberInput
              v-model="draft.stagger.finisherSpRecovery"
              size="sm"
              controls-position="right"
              :min="0"
          /></label>
          <label
            ><span>{{ labels.superArmor }}</span
            ><EaNumberInput v-model="draft.superArmor" size="sm" controls-position="right" :min="0"
          /></label>
          <div class="form-section-title">{{ labels.resistances }}</div>
          <label v-for="type in EDITABLE_RESISTANCE_DAMAGE_TYPES" :key="type">
            <span>{{ labels.resistance[type] }}</span>
            <EaNumberInput
              size="sm"
              controls-position="right"
              :model-value="draft.resistances[type] ?? 0"
              :step="0.01"
              @change="setDraftNumber(draft.resistances, type, $event)"
            />
          </label>
        </fieldset>
        <template #footer>
          <EaDialogActions>
            <EaButton type="button" @click="statsVisible = false">{{ labels.close }}</EaButton>
            <EaButton type="button" variant="primary" :disabled="readOnly" @click="saveDraft">
              {{ labels.confirm }}
            </EaButton>
          </EaDialogActions>
        </template>
      </EaDialog>
    </InputRegionBoundary>
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
.enemy-select-module {
  position: relative;
  width: 100%;
  height: auto;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-bottom: 1px solid var(--ea-border-soft, rgb(255 255 255 / 8%));
  background: var(--ea-fill-soft, rgb(255 255 255 / 3%));
  text-align: left;
  cursor: pointer;
}
.enemy-select-module:hover {
  background: var(--ea-hover-fill, rgb(255 255 255 / 6%));
}
.module-deco-line {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 0;
  width: 2px;
  background: var(--ea-gold);
}
.enemy-avatar-box {
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid var(--ea-border-strong, #444);
  background: var(--ea-keycap-bg, #111);
}
.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: color-mix(in srgb, var(--ea-gold) 30%, transparent);
  animation: enemy-scan 3s infinite linear;
}
@keyframes enemy-scan {
  from {
    transform: translateY(-2px);
  }
  to {
    transform: translateY(34px);
  }
}
.enemy-avatar-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.custom-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--ea-gold) 5%, transparent);
  color: var(--ea-gold);
  font-family: 'Roboto Mono', monospace;
  font-size: 18px;
  font-weight: 900;
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
  overflow: hidden;
  color: var(--ea-fg, #eee);
  font-size: 12px;
  font-weight: bold;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.enemy-level-badge,
.click-hint {
  color: var(--ea-gold);
  font-size: 10px;
}
.enemy-level-badge {
  flex-shrink: 0;
  font-family: 'Roboto Mono', monospace;
  font-weight: 800;
  line-height: 1;
  opacity: 0.86;
}
.click-hint {
  margin-top: 1px;
  opacity: 0.5;
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
  padding: 6px 8px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  background: var(--ea-fill-soft);
  font-size: 11px;
}
.summary-label {
  color: var(--ea-fg-secondary, rgba(255, 255, 255, 0.48));
  font-size: 11px;
  white-space: nowrap;
}
.summary-value--res {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
  font-family: 'Roboto Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.02em;
}
.summary-value {
  color: var(--ea-fg, rgba(255, 255, 255, 0.86));
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.res-sep {
  margin: 0 2px;
  color: var(--ea-fg-faint);
}
.res-value {
  font-weight: 800;
}
.stats-edit-button {
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
.selector-header .el-input {
  width: 180px;
}
.enemy-level-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.level-label {
  color: var(--ea-fg-muted);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  user-select: none;
}
.level-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}
.level-buttons button {
  min-width: 30px;
  height: 24px;
  padding: 0 7px;
}
.enemy-filter-rows {
  margin: 0 0 20px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--ea-fill-input);
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
.category-tabs .ea-filter-chip,
.tier-filters .ea-filter-chip {
  flex: none;
  padding-right: 16px;
  padding-left: 16px;
  margin-bottom: 2px;
}
.enemy-list-grid {
  max-height: 450px;
  padding: 10px;
  overflow-y: auto;
  scrollbar-width: none;
}
.enemy-list-grid::-webkit-scrollbar {
  display: none;
}
.enemy-group-section {
  margin-bottom: 24px;
}
.group-items {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.enemy-card {
  --tier-color: var(--ea-border-strong);
  position: relative;
  min-width: 0;
  height: 64px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  border: 1px solid var(--ea-border-soft);
  border-left: 3px solid var(--ea-border-strong);
  box-sizing: border-box;
  cursor: pointer;
  background: var(--ea-fill-muted);
  color: inherit;
  font: inherit;
  text-align: left;
  white-space: normal;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease;
}
.enemy-card.has-tier {
  border-left-color: var(--tier-color);
}
.enemy-card.ea-button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--ea-gold) 7%, transparent);
}
.enemy-card.ea-button.has-tier:hover:not(:disabled) {
  background: color-mix(in srgb, var(--tier-color) 10%, rgb(255 255 255 / 3%));
}
.enemy-card .card-avatar {
  position: relative;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border: 1px solid var(--ea-border);
  background: var(--ea-keycap-bg);
  overflow: hidden;
}
.enemy-card .card-avatar > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.enemy-card .tier-strip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  height: 14px;
  padding: 0 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    to top,
    var(--ea-stack-bg, rgb(0 0 0 / 92%)) 0%,
    color-mix(in srgb, var(--ea-stack-bg, rgb(0 0 0 / 92%)) 70%, transparent) 100%
  );
  border-top: 1px solid color-mix(in srgb, var(--tier-color) 55%, transparent);
  color: var(--tier-color);
  font-size: 8px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.06em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px var(--ea-shadow, rgb(0 0 0 / 85%));
}
.enemy-card .card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}
.enemy-card strong,
.enemy-card small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.enemy-card strong {
  color: var(--ea-fg);
  font-size: 12px;
  margin-bottom: 2px;
}
.enemy-card.has-tier strong {
  color: var(--tier-color);
}
.enemy-card small {
  color: var(--ea-fg-muted);
  font-size: 10px;
}
.group-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid var(--ea-gold);
  color: var(--ea-fg);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
}
.group-header span {
  font-size: 11px;
  color: var(--ea-fg-faint);
  font-weight: normal;
}
.enemy-card.ea-button[aria-pressed='true'] {
  border-top-color: color-mix(in srgb, var(--ea-gold) 18%, transparent);
  border-right-color: color-mix(in srgb, var(--ea-gold) 18%, transparent);
  border-bottom-color: color-mix(in srgb, var(--ea-gold) 18%, transparent);
  background: color-mix(in srgb, var(--ea-gold) 12%, transparent);
  color: var(--ea-fg);
}
.enemy-card.has-tier.ea-button[aria-pressed='true'] {
  border-top-color: color-mix(in srgb, var(--tier-color) 24%, transparent);
  border-right-color: color-mix(in srgb, var(--tier-color) 24%, transparent);
  border-bottom-color: color-mix(in srgb, var(--tier-color) 24%, transparent);
  background: color-mix(in srgb, var(--tier-color) 16%, rgb(255 255 255 / 3%));
}
.enemy-card.ea-button[aria-pressed='true']:hover:not(:disabled) {
  background: color-mix(in srgb, var(--ea-gold) 15%, transparent);
}
.enemy-card.ea-button.has-tier[aria-pressed='true']:hover:not(:disabled) {
  background: color-mix(in srgb, var(--tier-color) 20%, rgb(255 255 255 / 3%));
}
.enemy-card:disabled {
  opacity: 0.35;
}
.enemy-card--custom {
  --tier-color: var(--ea-gold);
}
.enemy-card--custom .card-avatar {
  border-color: color-mix(in srgb, var(--ea-gold) 40%, transparent);
  background: color-mix(in srgb, var(--ea-gold) 5%, transparent);
  color: var(--ea-gold);
  font-family: 'Roboto Mono', monospace;
  font-size: 22px;
  font-weight: 900;
}
.enemy-card--custom[aria-pressed='true'] .card-avatar {
  background: color-mix(in srgb, var(--ea-gold) 12%, transparent);
}
.empty-state {
  padding: 40px 0;
  color: var(--ea-fg-faint);
  text-align: center;
  font-size: 13px;
}
.stats-form {
  padding: 0;
  margin: 0;
  border: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stats-form label {
  padding: 7px 9px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}
.stats-form label span {
  color: var(--ea-fg-secondary);
  font-size: 12px;
}
.stats-form :deep(.ea-number-input) {
  width: 92px;
}
.knot-threshold-field {
  padding: 7px 9px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 12px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
  color: var(--ea-fg-secondary);
  font-size: 12px;
}
.knot-threshold-list {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.knot-threshold-row {
  display: flex;
  gap: 4px;
}
.add-knot-button {
  min-width: 26px;
}
.add-knot-button {
  padding: 0 7px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.form-section-title {
  margin-top: 8px;
  color: var(--ea-fg-secondary);
  font-size: 12px;
  font-weight: 700;
}
.primary-button {
  border-color: var(--ea-gold);
  color: var(--ea-gold);
}

:global(html[data-theme='light'] .next-enemy-selector .enemy-card) {
  border-color: var(--ea-border);
  background: var(--ea-surface-row);
}

:global(html[data-theme='light'] .next-enemy-selector .enemy-card:hover:not(:disabled)) {
  background: rgb(180 140 0 / 10%);
}

:global(html[data-theme='light'] .next-enemy-selector .enemy-card[aria-pressed='true']) {
  border-top-color: rgb(180 140 0 / 35%);
  border-right-color: rgb(180 140 0 / 35%);
  border-bottom-color: rgb(180 140 0 / 35%);
  background: rgb(180 140 0 / 14%);
}

:global(html[data-theme='light'] .enemy-settings-panel .summary-row) {
  background: var(--ea-surface-row);
}

:global(html[data-theme='light'] .next-enemy-selector .enemy-filter-rows) {
  background: var(--ea-surface-sunken);
}

:global(html[data-theme='light'] .enemy-settings-panel .enemy-avatar-box),
:global(html[data-theme='light'] .next-enemy-selector .card-avatar) {
  border-color: rgb(26 27 30 / 14%);
  background: var(--ea-chip-fill);
}
@media (hover: hover) and (pointer: fine) {
  :global(
    html[data-theme='light']
      .next-enemy-selector
      .enemy-card[aria-pressed='true']:hover:not(:disabled)
  ) {
    border-top-color: rgb(180 140 0 / 35%);
    border-right-color: rgb(180 140 0 / 35%);
    border-bottom-color: rgb(180 140 0 / 35%);
    background: rgb(180 140 0 / 14%);
  }
}
</style>
