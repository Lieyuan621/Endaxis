<script setup lang="ts">
/**
 * Next 时间轴的干员定义选择器。
 *
 * 组件沿用旧版选择器的布局和交互，但只消费 Next 干员定义并通过事件返回选择结果；
 * 不读取项目状态，也不负责创建或修改 Build。
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
import { getGameClassName, getGameElementName, getOperatorGameName } from '../../../data/gameText';
import type {
  DamageElement,
  OperatorDefinition,
  OperatorRole,
} from '../../../core/game-data/operatorDefinition';
import { projectOperatorSupport } from './operatorSupportViewModel';
import OperatorSupportNotice from './OperatorSupportNotice.vue';
import OperatorAvatar from '../../components/OperatorAvatar.vue';
import { getElementIconPath, getOperatorAvatarPath } from '../../gameAssetPaths';
import { matchesLocalizedNameSearch } from './localizedNameSearch';

const props = defineProps<{
  visible: boolean;
  operators: readonly OperatorDefinition[];
  selectedSlugs: readonly string[];
}>();

const emit = defineEmits<{
  close: [];
  select: [slug: string];
  clear: [];
}>();

const { t, locale } = useI18n({ useScope: 'global' });
const searchQuery = ref('');
const elementFilter = ref<DamageElement | 'ALL'>('ALL');
const classFilter = ref<OperatorRole | 'ALL'>('ALL');

const elementColors: Readonly<Record<DamageElement, string>> = {
  physical: '#8c8c8c',
  heat: '#ff4d4f',
  cryo: '#00e5ff',
  electric: '#f0b23c',
  nature: '#52c41a',
};

watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    searchQuery.value = '';
    elementFilter.value = 'ALL';
    classFilter.value = 'ALL';
  },
);

function rarityColor(rarity: number): string {
  if (rarity === 6) return 'var(--ea-gold)';
  if (rarity === 5) return '#ffc400';
  if (rarity === 4) return '#d8b4fe';
  return '#a0a0a0';
}

const elementFilters = computed(() => [
  { label: t('timelineGrid.elementFilter.all'), value: 'ALL' as const, color: '#888' },
  ...(['physical', 'heat', 'cryo', 'electric', 'nature'] as const).map(element => ({
    label: getGameElementName(element, locale.value),
    value: element,
    color: elementColors[element],
  })),
]);

const classFilters = computed(() => [
  { label: t('timelineGrid.classFilter.all'), value: 'ALL' as const },
  ...(['guard', 'caster', 'defender', 'vanguard', 'striker', 'supporter'] as const).map(
    operatorClass => ({
      label: getGameClassName(operatorClass, locale.value),
      value: operatorClass,
    }),
  ),
]);

const operatorItems = computed(() =>
  props.operators.map(operator => {
    const assetSlug = operator.assetSlug ?? operator.slug;
    const name = operator.displayName ?? getOperatorGameName(assetSlug, locale.value);
    const elementName = getGameElementName(operator.element, locale.value);
    return {
      slug: operator.slug,
      name,
      avatar: getOperatorAvatarPath(assetSlug),
      rarity: Number(operator.rarity) || 0,
      element: operator.element,
      elementName,
      role: operator.role,
      support: projectOperatorSupport(operator),
    };
  }),
);

const groups = computed(() => {
  const operators = operatorItems.value.filter(operator => {
    if (elementFilter.value !== 'ALL' && operator.element !== elementFilter.value) return false;
    if (classFilter.value !== 'ALL' && operator.role !== classFilter.value) return false;
    return matchesLocalizedNameSearch(operator.name, searchQuery.value);
  });

  const byRarity = new Map<number, typeof operators>();
  for (const operator of operators) {
    const list = byRarity.get(operator.rarity) ?? [];
    list.push(operator);
    byRarity.set(operator.rarity, list);
  }

  return [...byRarity.entries()]
    .sort(([left], [right]) => right - left)
    .map(([level, list]) => ({ level, list }));
});

function select(slug: string): void {
  emit('select', slug);
}

function clear(): void {
  emit('clear');
}
</script>

<template>
  <InputRegionBoundary label="operator-selection" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      :title="t('timelineGrid.operatorDialog.title')"
      width="600px"
      align-center
      class="char-selector-dialog"
      append-to-body
      @closed="emit('close')"
    >
      <div class="selector-header">
        <div class="header-left-group">
          <EaInput
            v-model="searchQuery"
            :placeholder="t('timelineGrid.operatorDialog.searchPlaceholder')"
            :prefix-icon="Search"
            clearable
            style="width: 180px"
          />
          <EaButton
            variant="danger"
            type="button"
            :title="t('timelineGrid.operatorDialog.clearTrack')"
            @click="clear"
          >
            <EaDeleteIcon />
            {{ t('common.unequip') }}
          </EaButton>
        </div>
        <div class="element-filters">
          <EaFilterChip
            v-for="element in elementFilters"
            :key="element.value"
            :selected="elementFilter === element.value"
            :accent="element.color"
            @click="elementFilter = element.value"
          >
            {{ element.label }}
          </EaFilterChip>
        </div>
        <div class="class-filters">
          <EaFilterChip
            v-for="operatorClass in classFilters"
            :key="operatorClass.value"
            :selected="classFilter === operatorClass.value"
            @click="classFilter = operatorClass.value"
          >
            {{ operatorClass.label }}
          </EaFilterChip>
        </div>
      </div>

      <div class="roster-scroll-container">
        <template v-for="group in groups" :key="group.level">
          <div
            class="rarity-header"
            :class="`header-rarity-${group.level}`"
            :style="{ color: rarityColor(group.level) }"
          >
            <span class="rarity-label">{{ group.level }} ★</span>
            <div class="rarity-line"></div>
          </div>
          <div class="roster-grid">
            <EaButton
              v-for="operator in group.list"
              :key="operator.slug"
              class="roster-card operator-roster-card"
              :class="[`rarity-${operator.rarity}-style`]"
              @click="select(operator.slug)"
              variant="ghost"
              :pressed="selectedSlugs.includes(operator.slug)"
            >
              <div
                class="card-avatar-wrapper"
                :style="operator.rarity === 6 ? {} : { borderColor: rarityColor(operator.rarity) }"
              >
                <OperatorSupportNotice :support="operator.support" compact />
                <OperatorAvatar :src="operator.avatar" loading="lazy" />
                <div
                  class="element-badge"
                  :class="{ 'is-physical': operator.element === 'physical' }"
                  :style="{ backgroundColor: elementColors[operator.element] }"
                  :title="operator.elementName"
                >
                  <img :src="getElementIconPath(operator.element)" alt="" loading="lazy" />
                </div>
              </div>
              <div class="card-name">{{ operator.name }}</div>
              <div v-if="selectedSlugs.includes(operator.slug)" class="in-team-tag">
                {{ t('timelineGrid.operatorDialog.inTeam') }}
              </div>
            </EaButton>
          </div>
        </template>
        <div v-if="groups.length === 0" class="empty-roster">
          {{ t('timelineGrid.operatorDialog.empty') }}
        </div>
      </div>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style src="./selectionDialog.css"></style>
