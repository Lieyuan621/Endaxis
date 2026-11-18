<script setup lang="ts">
import SelectionIconFrame from './SelectionIconFrame.vue';
import { resolveImage } from '../../imageResources';
import { EaTooltip } from '@/design-system';
/**
 * Next 时间轴的装备选择器。父层决定正在编辑的轨道和槽位，并负责把选择、卸下及精锻档位写回项目；
 * 本组件只复刻旧版装备选择弹窗的定义浏览流程，不读取旧 store，也不把适配状态写入存档。
 */
import {
  EaButton,
  EaChevronIcon,
  EaDialog,
  EaFilterChip,
  EaInput,
  EaTabs,
  EaUnequipIcon,
} from '../../../design-system/index';
import { computed, nextTick, ref, watch } from 'vue';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import { Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
  getGearPieceGameName,
  getGearSetGameDescription,
  getGearSetGameName,
} from '../../gameText';
import { getEquipmentLevelColor } from '../../progression';
import type { GearDefinition } from '../../../core/game-data/equipmentDefinition';
import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
import type { TrackGearSlot } from '../interaction/timelineDocumentCommands';
import EquipmentSelectionTooltip from './EquipmentSelectionTooltip.vue';
import './selectionDialog.css';
import { getGearDefinitionSelectionAffixRows } from './gearAffixPresentation';
import {
  GEAR_AFFIX_FILTER_GROUPS,
  GEAR_ATTRIBUTE_FILTER_OPTIONS,
  gearMatchesAffixFilter,
  gearMatchesAttributeFilter,
  gearMatchesOperatorAttributes,
} from './gearSelectionFilters';
import { getEquipmentModifierLabel } from '../../../utils/equipmentEffectDisplay';
import { DEFAULT_GAME_ICON_PATH } from '../../gameAssetPaths';
import { matchesLocalizedNameSearch } from './localizedNameSearch';

export interface GearSelectionDialogLabels {
  readonly title: string;
  readonly searchPlaceholder: string;
  readonly unequip: string;
  readonly empty: string;
  readonly noSet: string;
}

const props = withDefaults(
  defineProps<{
    visible: boolean;
    /** 父层已经按当前槽位筛选好的装备定义。 */
    gears: readonly GearDefinition[];
    selectedSlug: string | null;
    /** 已装备 Build 的精锻档位；未装备时默认预选满精锻，与旧版一致。 */
    selectedArtificingLevels?: readonly number[];
    /** 当前槽位由父层指定，两个配件槽仍保留各自的稳定身份。 */
    activeSlotKey?: TrackGearSlot;
    operatorDefinition?: OperatorDefinition | null;
    gearSetNames?: Readonly<Record<string, string>>;
    labels: GearSelectionDialogLabels;
  }>(),
  {
    selectedArtificingLevels: () => [],
    activeSlotKey: 'armor',
    gearSetNames: () => ({}),
  },
);

const emit = defineEmits<{
  close: [];
  select: [slug: string, artificingTier: number];
  clear: [];
  'change-slot': [slot: TrackGearSlot];
  'change-refine-tier': [tier: number];
}>();

interface GearListItem {
  readonly definition: GearDefinition;
  readonly name: string;
  readonly gearSetSlug: string | null;
  readonly gearSetName: string;
  readonly matchesOperatorAttributes: boolean;
  readonly legacyPreviewIdentity: {
    readonly id: string;
    readonly canonicalId: string;
    readonly name: string;
    readonly category: string;
  };
  readonly previewRows: ReturnType<typeof getGearDefinitionSelectionAffixRows>;
}

interface GearLevelGroup {
  readonly level: number;
  readonly items: readonly GearListItem[];
}

const { locale, t } = useI18n({ useScope: 'global' });
const searchQuery = ref('');
const gearSetFilter = ref('ALL');
const filtersExpanded = ref(false);
const attributeFilters = ref<string[]>([]);
const affixFilter = ref('ALL');
const levelFilter = ref<number | 'ALL'>('ALL');
const refineTier = ref(3);
const rosterScrollContainer = ref<HTMLElement | null>(null);
const refineTiers = [0, 1, 2, 3] as const;
const gearSlots: readonly TrackGearSlot[] = ['armor', 'gloves', 'accessory1', 'accessory2'];
const slotTabs = computed(() =>
  gearSlots.map(slot => ({
    value: slot,
    label: t(`timelineGrid.equipmentSlot.${slot}`),
    id: `gear-selector-tab-${slot}`,
    panelId: 'gear-selector-list',
  })),
);
const NO_SET_FILTER = '__NO_SET__';

const currentArtificingTier = computed(() => {
  if (props.selectedArtificingLevels.length === 0) return 0;
  return Math.max(0, Math.min(3, Math.max(...props.selectedArtificingLevels)));
});

watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    searchQuery.value = '';
    gearSetFilter.value = 'ALL';
    filtersExpanded.value = false;
    attributeFilters.value = [];
    affixFilter.value = 'ALL';
    levelFilter.value = 'ALL';
    refineTier.value = props.selectedSlug === null ? 3 : currentArtificingTier.value;
  },
  { immediate: true },
);

watch(
  () => props.activeSlotKey,
  () => {
    if (!props.visible) return;
    searchQuery.value = '';
    void nextTick(() => rosterScrollContainer.value?.scrollTo(0, 0));
    if (
      gearSetFilter.value !== 'ALL' &&
      gearSetFilter.value !== NO_SET_FILTER &&
      !gearSets.value.some(set => set.slug === gearSetFilter.value)
    ) {
      gearSetFilter.value = 'ALL';
    }
    if (levelFilter.value !== 'ALL' && !levels.value.includes(levelFilter.value)) {
      levelFilter.value = 'ALL';
    }
  },
);

watch(
  () => [props.activeSlotKey, props.selectedSlug, currentArtificingTier.value] as const,
  () => {
    if (props.visible) {
      refineTier.value = props.selectedSlug === null ? 3 : currentArtificingTier.value;
    }
  },
);

const gearItems = computed<readonly GearListItem[]>(() =>
  props.gears.map(definition => {
    const gearSetSlug =
      definition.gearSetSlug && definition.gearSetSlug !== 'no-set-bonuses'
        ? definition.gearSetSlug
        : null;
    return {
      definition,
      name: definition.displayName ?? getGearPieceGameName(definition.slug, locale.value),
      gearSetSlug,
      gearSetName: gearSetSlug
        ? (props.gearSetNames[gearSetSlug] ?? getGearSetGameName(gearSetSlug, locale.value))
        : props.labels.noSet,
      matchesOperatorAttributes: gearMatchesOperatorAttributes(
        definition,
        props.operatorDefinition,
      ),
      legacyPreviewIdentity: {
        id: definition.slug,
        canonicalId: definition.slug,
        name: definition.displayName ?? getGearPieceGameName(definition.slug, locale.value),
        category: gearSetSlug ?? '',
      },
      previewRows: getGearDefinitionSelectionAffixRows(definition, t),
    };
  }),
);

const gearSets = computed(() => {
  const sets = new Map<string, { name: string; maxLevel: number }>();
  for (const item of gearItems.value) {
    if (item.gearSetSlug === null) continue;
    const previous = sets.get(item.gearSetSlug);
    sets.set(item.gearSetSlug, {
      name: item.gearSetName,
      maxLevel: Math.max(previous?.maxLevel ?? 0, item.definition.levelRequirement),
    });
  }
  return [...sets.entries()].map(([slug, set]) => ({ slug, ...set }));
});

const gearSetGroups = computed(() => {
  const byLevel = new Map<number, (typeof gearSets.value)[number][]>();
  for (const set of gearSets.value) {
    const group = byLevel.get(set.maxLevel) ?? [];
    group.push(set);
    byLevel.set(set.maxLevel, group);
  }
  return [...byLevel.entries()]
    .sort(([left], [right]) => right - left)
    .map(([level, sets]) => ({
      level,
      sets: sets.sort((left, right) => left.name.localeCompare(right.name)),
    }));
});

const selectedGearSetLabel = computed(
  () =>
    (gearSetFilter.value === NO_SET_FILTER
      ? props.labels.noSet
      : gearSets.value.find(set => set.slug === gearSetFilter.value)?.name) ??
    t('timelineGrid.equipmentDialog.allCategories'),
);

const levels = computed(() =>
  [...new Set(gearItems.value.map(item => item.definition.levelRequirement))].sort(
    (left, right) => right - left,
  ),
);

const affixFilterGroups = computed(() =>
  GEAR_AFFIX_FILTER_GROUPS.map(group => {
    const items = group.items.map(item => ({
      ...item,
      label:
        item.value === 'primary_ability' || item.value === 'secondary_ability'
          ? t(`timelineGrid.equipmentDialog.percentAffixFilters.${item.value}`)
          : getEquipmentModifierLabel(item.value, t),
    }));
    return {
      ...group,
      items,
      rows: Array.from({ length: Math.ceil(items.length / group.rowSize) }, (_, index) =>
        items.slice(index * group.rowSize, (index + 1) * group.rowSize),
      ),
    };
  }),
);

const attributeFilterOptions = computed(() =>
  GEAR_ATTRIBUTE_FILTER_OPTIONS.map(item => ({
    ...item,
    label: getEquipmentModifierLabel(item.value, t),
  })),
);

const selectedAffixLabel = computed(
  () =>
    affixFilterGroups.value
      .flatMap(group => group.items)
      .find(item => item.value === affixFilter.value)?.label ??
    t('timelineGrid.equipmentDialog.allAffixes'),
);

type FilterKind = 'level' | 'set' | 'attribute' | 'affix';

interface ActiveFilter {
  readonly kind: FilterKind;
  readonly label: string;
  readonly value?: string;
}

const activeFilters = computed<readonly ActiveFilter[]>(() => {
  const filters: ActiveFilter[] = [];
  for (const value of attributeFilters.value) {
    const label = attributeFilterOptions.value.find(item => item.value === value)?.label;
    if (label) filters.push({ kind: 'attribute', label, value });
  }
  if (gearSetFilter.value !== 'ALL') {
    filters.push({ kind: 'set', label: selectedGearSetLabel.value });
  }
  if (affixFilter.value !== 'ALL') {
    filters.push({ kind: 'affix', label: selectedAffixLabel.value });
  }
  if (levelFilter.value !== 'ALL') {
    filters.push({ kind: 'level', label: `Lv${levelFilter.value}` });
  }
  return filters;
});

const groups = computed<readonly GearLevelGroup[]>(() => {
  const filtered = gearItems.value.filter(item => {
    if (
      gearSetFilter.value !== 'ALL' &&
      (gearSetFilter.value === NO_SET_FILTER
        ? item.gearSetSlug !== null
        : item.gearSetSlug !== gearSetFilter.value)
    ) {
      return false;
    }
    if (levelFilter.value !== 'ALL' && item.definition.levelRequirement !== levelFilter.value) {
      return false;
    }
    if (!gearMatchesAttributeFilter(item.definition, attributeFilters.value)) return false;
    if (!gearMatchesAffixFilter(item.definition, affixFilter.value, t)) return false;
    return matchesLocalizedNameSearch(item.name, searchQuery.value);
  });
  const byLevel = new Map<number, GearListItem[]>();
  for (const item of filtered) {
    const level = item.definition.levelRequirement;
    const items = byLevel.get(level) ?? [];
    items.push(item);
    byLevel.set(level, items);
  }
  return [...byLevel.entries()]
    .sort(([left], [right]) => right - left)
    .map(([level, items]) => ({
      level,
      items: items.sort((left, right) => left.name.localeCompare(right.name)),
    }));
});

function setRefineTier(tier: number): void {
  refineTier.value = tier;
  if (props.selectedSlug !== null) emit('change-refine-tier', tier);
}

function selectGear(slug: string): void {
  emit('select', slug, refineTier.value);
}

function clearGear(): void {
  emit('clear');
}

function selectSlot(value: string): void {
  const slot = gearSlots.find(item => item === value);
  if (slot) emit('change-slot', slot);
}

function clearAllFilters(): void {
  levelFilter.value = 'ALL';
  gearSetFilter.value = 'ALL';
  attributeFilters.value = [];
  affixFilter.value = 'ALL';
}

function toggleAttributeFilter(value: string): void {
  if (attributeFilters.value.includes(value)) {
    attributeFilters.value = attributeFilters.value.filter(filter => filter !== value);
  } else if (attributeFilters.value.length < 2) {
    attributeFilters.value = [...attributeFilters.value, value];
  }
}

function clearFilter(kind: FilterKind, value?: string): void {
  if (kind === 'level') levelFilter.value = 'ALL';
  else if (kind === 'set') gearSetFilter.value = 'ALL';
  else if (kind === 'attribute') {
    attributeFilters.value = attributeFilters.value.filter(filter => filter !== value);
  } else affixFilter.value = 'ALL';
}
</script>

<template>
  <InputRegionBoundary label="gear-selection" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      :title="labels.title"
      width="600px"
      align-center
      class="char-selector-dialog gear-selector-dialog"
      scroll-mode="body"
      append-to-body
      @closed="emit('close')"
    >
      <div class="selector-header gear-selector-header">
        <EaTabs
          :tabs="slotTabs"
          :model-value="activeSlotKey"
          :label="t('timelineGrid.equipmentSlot.equipment')"
          size="sm"
          @update:model-value="selectSlot"
        />
        <div class="header-left-group">
          <EaInput
            v-model="searchQuery"
            :placeholder="labels.searchPlaceholder"
            :prefix-icon="Search"
            clearable
            style="width: 180px"
          />
          <EaButton
            class="selector-unequip-button"
            type="button"
            :disabled="selectedSlug === null"
            :title="labels.unequip"
            @click="clearGear"
          >
            <EaUnequipIcon />
            {{ labels.unequip }}
          </EaButton>
          <div class="equipment-tier-picker">
            <span class="tier-label">{{ t('timelineGrid.equipmentDialog.refine') }}</span>
            <div class="equipment-refine-buttons">
              <EaFilterChip
                size="sm"
                v-for="tier in refineTiers"
                :key="tier"
                class="equipment-refine-btn"
                @click="setRefineTier(tier)"
                :selected="refineTier === tier"
              >
                {{ tier === 0 ? t('timelineGrid.equipmentDialog.refineBase') : tier }}
              </EaFilterChip>
            </div>
          </div>
        </div>
        <div class="equipment-filter-section">
          <div class="equipment-filter-heading">
            <button
              class="equipment-filter-toggle"
              type="button"
              :aria-expanded="filtersExpanded"
              aria-controls="gear-filter-options"
              @click="filtersExpanded = !filtersExpanded"
            >
              <EaChevronIcon :direction="filtersExpanded ? 'up' : 'down'" :size="16" />
              {{ t('timelineGrid.equipmentDialog.filters') }}
            </button>
            <span v-if="activeFilters.length === 0" class="equipment-filter-empty">{{
              t('timelineGrid.equipmentDialog.allFilters')
            }}</span>
            <EaButton
              v-if="activeFilters.length > 0"
              class="equipment-filter-clear"
              variant="secondary"
              size="sm"
              :title="t('timelineGrid.equipmentDialog.clearAllFilters')"
              :aria-label="t('timelineGrid.equipmentDialog.clearAllFilters')"
              @click="clearAllFilters"
            >
              {{ t('timelineGrid.equipmentDialog.clearFilters') }}
            </EaButton>
          </div>
          <div v-if="activeFilters.length > 0" class="equipment-filter-active">
            <button
              v-for="filter in activeFilters"
              :key="filter.kind + (filter.value ?? '')"
              class="equipment-filter-tag"
              type="button"
              :aria-label="t('timelineGrid.equipmentDialog.removeFilter', { label: filter.label })"
              :title="t('timelineGrid.equipmentDialog.removeFilter', { label: filter.label })"
              @click="clearFilter(filter.kind, filter.value)"
            >
              <span class="equipment-filter-tag-label">{{ filter.label }}</span>
            </button>
          </div>
          <Transition name="gear-filter-expand">
            <div v-show="filtersExpanded" id="gear-filter-options" class="equipment-filter-panel">
              <div class="equipment-filter-group">
                <span class="equipment-filter-label">{{
                  t('timelineGrid.equipmentDialog.attributeFilter')
                }}</span>
                <div class="equipment-attribute-filter-options">
                  <EaFilterChip
                    type="button"
                    :selected="attributeFilters.length === 0"
                    accent="#2dd4bf"
                    @click="attributeFilters = []"
                  >
                    {{ t('timelineGrid.equipmentDialog.allAttributes') }}
                  </EaFilterChip>
                  <EaFilterChip
                    v-for="option in attributeFilterOptions"
                    :key="'next_gear_attribute_filter_' + option.value"
                    :selected="attributeFilters.includes(option.value)"
                    :disabled="
                      attributeFilters.length >= 2 && !attributeFilters.includes(option.value)
                    "
                    :accent="option.accent"
                    @click="toggleAttributeFilter(option.value)"
                  >
                    {{ option.label }}
                  </EaFilterChip>
                </div>
              </div>
              <div class="equipment-filter-group">
                <span class="equipment-filter-label">{{
                  t('timelineGrid.equipmentDialog.gearSetFilter')
                }}</span>
                <div class="equipment-filter-content">
                  <div class="equipment-filter-reset">
                    <EaFilterChip
                      type="button"
                      :selected="gearSetFilter === 'ALL'"
                      accent="#2dd4bf"
                      @click="gearSetFilter = 'ALL'"
                    >
                      {{ t('timelineGrid.equipmentDialog.allCategories') }}
                    </EaFilterChip>
                    <EaFilterChip
                      type="button"
                      :selected="gearSetFilter === NO_SET_FILTER"
                      accent="#888"
                      @click="gearSetFilter = NO_SET_FILTER"
                    >
                      {{ labels.noSet }}
                    </EaFilterChip>
                  </div>
                  <div class="equipment-set-filter-strip">
                    <div
                      v-for="group in gearSetGroups"
                      :key="group.level"
                      class="equipment-set-filter-group"
                    >
                      <span class="equipment-set-filter-level">{{
                        t('timelineGrid.equipmentDialog.gearSetMaxLevel', { level: group.level })
                      }}</span>
                      <div class="equipment-set-filter-options">
                        <EaFilterChip
                          v-for="gearSet in group.sets"
                          :key="gearSet.slug"
                          :selected="gearSetFilter === gearSet.slug"
                          accent="#2dd4bf"
                          @click="gearSetFilter = gearSet.slug"
                        >
                          {{ gearSet.name }}
                        </EaFilterChip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="equipment-filter-group">
                <span class="equipment-filter-label">{{
                  t('timelineGrid.equipmentDialog.affixGroup')
                }}</span>
                <div class="equipment-filter-content">
                  <div class="equipment-filter-reset">
                    <EaFilterChip
                      type="button"
                      :selected="affixFilter === 'ALL'"
                      accent="#2dd4bf"
                      @click="affixFilter = 'ALL'"
                    >
                      {{ t('timelineGrid.equipmentDialog.allAffixes') }}
                    </EaFilterChip>
                  </div>
                  <div class="equipment-affix-filter-strip">
                    <div
                      v-for="group in affixFilterGroups"
                      :key="group.key"
                      class="equipment-affix-filter-group"
                    >
                      <div
                        v-for="(row, rowIndex) in group.rows"
                        :key="`${group.key}_${rowIndex}`"
                        class="equipment-affix-filter-row"
                      >
                        <EaFilterChip
                          v-for="option in row"
                          :key="'next_gear_affix_filter_' + option.value"
                          :selected="affixFilter === option.value"
                          :accent="option.accent"
                          @click="affixFilter = option.value"
                        >
                          {{ option.label }}
                        </EaFilterChip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="equipment-filter-group">
                <span class="equipment-filter-label">{{
                  t('timelineGrid.equipmentDialog.levelFilter')
                }}</span>
                <div class="element-filters">
                  <EaFilterChip
                    type="button"
                    :selected="levelFilter === 'ALL'"
                    accent="#2dd4bf"
                    @click="levelFilter = 'ALL'"
                  >
                    {{ t('timelineGrid.equipmentDialog.allLevels') }}
                  </EaFilterChip>
                  <EaFilterChip
                    v-for="level in levels"
                    :key="level"
                    :selected="levelFilter === level"
                    :accent="getEquipmentLevelColor(level)"
                    @click="levelFilter = level"
                  >
                    Lv{{ level }}
                  </EaFilterChip>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <div
        id="gear-selector-list"
        ref="rosterScrollContainer"
        class="roster-scroll-container"
        role="tabpanel"
        :aria-labelledby="`gear-selector-tab-${activeSlotKey}`"
      >
        <template v-for="group in groups" :key="group.level">
          <div class="rarity-header" :style="{ color: getEquipmentLevelColor(group.level) }">
            <span class="rarity-label">Lv{{ group.level }}</span>
            <div class="rarity-line"></div>
          </div>
          <div class="roster-grid">
            <EaButton
              v-for="gear in group.items"
              :key="gear.definition.slug"
              class="roster-card equipment-roster-card"
              :class="{ 'is-ability-match-both': gear.matchesOperatorAttributes }"
              :pressed="selectedSlug === gear.definition.slug"
              @click="selectGear(gear.definition.slug)"
              variant="ghost"
            >
              <EaTooltip
                placement="top-start"
                effect="dark"
                :show-after="160"
                :enterable="false"
                popper-class="equipment-selection-preview-popper"
              >
                <template #content>
                  <EquipmentSelectionTooltip
                    :equipment="gear.legacyPreviewIdentity"
                    :affix-rows="[...gear.previewRows]"
                    :gear-set-name="gear.gearSetName === labels.noSet ? '' : gear.gearSetName"
                    :gear-set-description="
                      gear.gearSetSlug
                        ? (getGearSetGameDescription(gear.gearSetSlug, locale) ?? '')
                        : ''
                    "
                  />
                </template>
                <div class="selection-card-tooltip-target">
                  <SelectionIconFrame
                    :equipment-level="gear.definition.levelRequirement"
                    :class="{ 'is-ability-match-both': gear.matchesOperatorAttributes }"
                  >
                    <div class="eq-affix-icon-stack">
                      <div
                        v-for="icon in gear.previewRows"
                        :key="`next_gear_affix_${gear.definition.slug}_${icon.key}`"
                        class="eq-affix-icon-cell"
                        :class="{
                          'has-img': Boolean(icon.src),
                          'has-hollow-marker': icon.marker === 'hollow-dot',
                        }"
                        :title="icon.title"
                      >
                        <span class="eq-affix-icon-dot" aria-hidden="true"></span>
                        <svg
                          v-if="icon.marker === 'hollow-dot'"
                          class="eq-affix-icon-hollow"
                          viewBox="0 0 12 12"
                          aria-hidden="true"
                        >
                          <circle
                            cx="6"
                            cy="6"
                            r="3.25"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                          />
                        </svg>
                        <img
                          v-else-if="icon.src"
                          class="eq-affix-icon-img"
                          :src="icon.src"
                          alt=""
                          @error="
                            ($event.currentTarget as HTMLImageElement)
                              .closest('.eq-affix-icon-cell')
                              ?.classList.add('img-failed')
                          "
                          @load="
                            ($event.currentTarget as HTMLImageElement)
                              .closest('.eq-affix-icon-cell')
                              ?.classList.remove('img-failed')
                          "
                        />
                      </div>
                    </div>
                    <img
                      :src="resolveImage(gear.definition.icon) || DEFAULT_GAME_ICON_PATH"
                      :alt="gear.name"
                      loading="lazy"
                    />
                  </SelectionIconFrame>
                  <div class="card-name">{{ gear.name }}</div>
                </div>
              </EaTooltip>
              <div v-if="selectedSlug === gear.definition.slug" class="in-team-tag weapon-equipped">
                {{ t('timelineGrid.weaponDialog.equipped') }}
              </div>
            </EaButton>
          </div>
        </template>
        <div v-if="groups.length === 0" class="empty-roster">{{ labels.empty }}</div>
      </div>
    </EaDialog>
  </InputRegionBoundary>
</template>
