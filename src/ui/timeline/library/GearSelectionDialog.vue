<script setup lang="ts">
import SelectionIconFrame from './SelectionIconFrame.vue';
import { resolveImage } from '../../imageResources';
import { EaTooltip } from '@/design-system';
/**
 * Next 时间轴的单槽装备选择器。父层决定正在编辑的轨道和槽位，并负责把选择、卸下及精锻档位写回项目；
 * 本组件只复刻旧版装备选择弹窗的定义浏览流程，不读取旧 store，也不把适配状态写入存档。
 */
import {
  EaButton,
  EaChevronIcon,
  EaCloseIcon,
  EaDeleteIcon,
  EaDialog,
  EaFilterChip,
  EaInput,
} from '../../../design-system/index';
import { computed, ref, watch } from 'vue';
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
import EquipmentSelectionTooltip from './EquipmentSelectionTooltip.vue';
import './selectionDialog.css';
import { getGearDefinitionSelectionAffixRows } from './gearAffixPresentation';
import {
  GEAR_AFFIX_FILTER_GROUPS,
  gearMatchesAffixFilter,
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
    activeSlotKey?: string;
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
const gearSetExpanded = ref(false);
const affixFilter = ref('ALL');
const affixExpanded = ref(false);
const levelFilter = ref<number | 'ALL'>('ALL');
const refineTier = ref(3);
const refineTiers = [0, 1, 2, 3] as const;
const NO_SET_FILTER = '__NO_SET__';

watch(
  () => [props.visible, props.activeSlotKey, props.selectedSlug] as const,
  ([visible]) => {
    if (!visible) return;
    searchQuery.value = '';
    gearSetFilter.value = 'ALL';
    gearSetExpanded.value = false;
    affixFilter.value = 'ALL';
    affixExpanded.value = false;
    levelFilter.value = 'ALL';
    refineTier.value = props.selectedSlug === null ? 3 : currentArtificingTier.value;
  },
);

const currentArtificingTier = computed(() => {
  if (props.selectedArtificingLevels.length === 0) return 0;
  return Math.max(0, Math.min(3, Math.max(...props.selectedArtificingLevels)));
});

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
  GEAR_AFFIX_FILTER_GROUPS.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      label: getEquipmentModifierLabel(item.value, t),
    })),
  })),
);

const selectedAffixLabel = computed(
  () =>
    affixFilterGroups.value
      .flatMap(group => group.items)
      .find(item => item.value === affixFilter.value)?.label ??
    t('timelineGrid.equipmentDialog.allAffixes'),
);

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
  emit('close');
}

function clearGear(): void {
  emit('clear');
  emit('close');
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
      @close="emit('close')"
    >
      <div class="selector-header gear-selector-header">
        <div class="header-left-group">
          <EaInput
            v-model="searchQuery"
            :placeholder="labels.searchPlaceholder"
            :prefix-icon="Search"
            clearable
            style="width: 180px"
          />
          <EaButton
            variant="danger"
            type="button"
            :disabled="selectedSlug === null"
            :title="labels.unequip"
            @click="clearGear"
          >
            <EaDeleteIcon />
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
        <div class="equipment-set-filter-section">
          <div class="equipment-affix-filter-heading">
            <button
              class="equipment-affix-filter-toggle"
              type="button"
              :aria-expanded="gearSetExpanded"
              aria-controls="gear-set-filter-options"
              @click="gearSetExpanded = !gearSetExpanded"
            >
              <EaChevronIcon :direction="gearSetExpanded ? 'up' : 'down'" :size="16" />
              {{ t('timelineGrid.equipmentDialog.gearSetFilter') }}
            </button>
            <span
              class="equipment-affix-filter-summary"
              :class="{ 'is-selected': gearSetFilter !== 'ALL' }"
              :title="selectedGearSetLabel"
              >{{ selectedGearSetLabel }}</span
            >
            <button
              v-if="gearSetFilter !== 'ALL'"
              class="equipment-affix-filter-clear"
              type="button"
              :aria-label="t('timelineGrid.equipmentDialog.clearGearSetFilter')"
              :title="t('timelineGrid.equipmentDialog.clearGearSetFilter')"
              @click="gearSetFilter = 'ALL'"
            >
              <EaCloseIcon :size="14" />
            </button>
          </div>
          <Transition name="gear-affix-expand">
            <div
              v-show="gearSetExpanded"
              id="gear-set-filter-options"
              class="equipment-affix-filter-panel"
            >
              <div class="equipment-affix-filter-reset">
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
          </Transition>
        </div>
        <div class="equipment-affix-filter-section">
          <div class="equipment-affix-filter-heading">
            <button
              class="equipment-affix-filter-toggle"
              type="button"
              :aria-expanded="affixExpanded"
              aria-controls="gear-affix-filter-options"
              @click="affixExpanded = !affixExpanded"
            >
              <EaChevronIcon :direction="affixExpanded ? 'up' : 'down'" :size="16" />
              {{ t('timelineGrid.equipmentDialog.affixFilter') }}
            </button>
            <span
              class="equipment-affix-filter-summary"
              :class="{ 'is-selected': affixFilter !== 'ALL' }"
              :title="selectedAffixLabel"
              >{{ selectedAffixLabel }}</span
            >
            <button
              v-if="affixFilter !== 'ALL'"
              class="equipment-affix-filter-clear"
              type="button"
              :aria-label="t('timelineGrid.equipmentDialog.clearAffixFilter')"
              :title="t('timelineGrid.equipmentDialog.clearAffixFilter')"
              @click="affixFilter = 'ALL'"
            >
              <EaCloseIcon :size="14" />
            </button>
          </div>
          <Transition name="gear-affix-expand">
            <div
              v-show="affixExpanded"
              id="gear-affix-filter-options"
              class="equipment-affix-filter-panel"
            >
              <div class="equipment-affix-filter-reset">
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
                  <EaFilterChip
                    v-for="option in group.items"
                    :key="`next_gear_affix_filter_${option.value}`"
                    :selected="affixFilter === option.value"
                    :accent="option.accent"
                    @click="affixFilter = option.value"
                  >
                    {{ option.label }}
                  </EaFilterChip>
                </div>
              </div>
            </div>
          </Transition>
        </div>
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

      <div class="roster-scroll-container">
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
