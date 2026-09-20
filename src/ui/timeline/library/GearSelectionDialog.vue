<script setup lang="ts">
import { EaTooltip } from '@/design-system';
/**
 * Next 时间轴的单槽装备选择器。父层决定正在编辑的轨道和槽位，并负责把选择、卸下及精锻档位写回项目；
 * 本组件只复刻旧版装备选择弹窗的定义浏览流程，不读取旧 store，也不把适配状态写入存档。
 */
import {
  EaButton,
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
import { getEquipmentSupport } from '../../../data/equipment/index';
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
  readonly close: string;
  readonly empty: string;
  readonly partialSupport: string;
  readonly defense: string;
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
  readonly isPartial: boolean;
  readonly supportSummary: string;
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
const affixFilter = ref('ALL');
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
    affixFilter.value = 'ALL';
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
    const gearSupport = getEquipmentSupport('gear', definition.slug);
    const setSupport = gearSetSlug ? getEquipmentSupport('gearSet', gearSetSlug) : null;
    const issues = [...(gearSupport?.issues ?? []), ...(setSupport?.issues ?? [])];
    return {
      definition,
      name: definition.displayName ?? getGearPieceGameName(definition.slug, locale.value),
      gearSetSlug,
      gearSetName: gearSetSlug
        ? (props.gearSetNames[gearSetSlug] ?? getGearSetGameName(gearSetSlug, locale.value))
        : props.labels.noSet,
      isPartial: gearSupport?.completeness === 'partial' || setSupport?.completeness === 'partial',
      supportSummary: [
        ...new Set(issues.map(issue => `${issue.sourceKind}.${issue.path}: ${issue.message}`)),
      ].join('\n'),
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
  const names = new Map<string, string>();
  for (const item of gearItems.value) {
    if (item.gearSetSlug !== null) names.set(item.gearSetSlug, item.gearSetName);
  }
  return [...names.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((left, right) => left.name.localeCompare(right.name));
});

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
      class="char-selector-dialog"
      append-to-body
      @close="emit('close')"
    >
      <div class="selector-header">
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
              <EaButton
                size="sm"
                v-for="tier in refineTiers"
                :key="tier"
                type="button"
                class="equipment-refine-btn"
                @click="setRefineTier(tier)"
                :pressed="refineTier === tier"
              >
                {{ tier === 0 ? t('timelineGrid.equipmentDialog.refineBase') : tier }}
              </EaButton>
            </div>
          </div>
        </div>
        <div class="element-filters">
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
          <EaFilterChip
            v-for="gearSet in gearSets"
            :key="gearSet.slug"
            :selected="gearSetFilter === gearSet.slug"
            accent="#2dd4bf"
            @click="gearSetFilter = gearSet.slug"
          >
            {{ gearSet.name }}
          </EaFilterChip>
        </div>
        <div class="equipment-affix-filter-section">
          <div class="equipment-affix-filter-strip">
            <EaFilterChip
              type="button"
              :selected="affixFilter === 'ALL'"
              accent="#2dd4bf"
              @click="affixFilter = 'ALL'"
            >
              {{ t('timelineGrid.equipmentDialog.allAffixes') }}
            </EaFilterChip>
            <template
              v-for="(group, groupIndex) in affixFilterGroups"
              :key="`next_gear_affix_group_${group.key}`"
            >
              <span
                v-if="groupIndex > 0"
                class="equipment-affix-filter-divider"
                aria-hidden="true"
              />
              <EaFilterChip
                v-for="option in group.items"
                :key="`next_gear_affix_filter_${option.value}`"
                :selected="affixFilter === option.value"
                :accent="option.accent"
                @click="affixFilter = option.value"
              >
                {{ option.label }}
              </EaFilterChip>
            </template>
          </div>
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
                  <div
                    v-if="gear.isPartial"
                    class="next-gear-preview__warning"
                    :title="gear.supportSummary"
                  >
                    {{ labels.partialSupport }}
                  </div>
                </template>
                <div class="selection-card-tooltip-target">
                  <div
                    class="card-avatar-wrapper"
                    :class="{ 'is-ability-match-both': gear.matchesOperatorAttributes }"
                    :style="{
                      borderColor: getEquipmentLevelColor(gear.definition.levelRequirement),
                    }"
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
                      :src="gear.definition.iconPath || DEFAULT_GAME_ICON_PATH"
                      :alt="gear.name"
                      loading="lazy"
                    />
                  </div>
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

<style scoped>
.next-gear-preview__warning {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  color: #facc15;
  font-size: 12px;
}
</style>
