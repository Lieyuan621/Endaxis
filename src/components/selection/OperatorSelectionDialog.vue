<script setup>
import { computed, ref } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useTimelineStore } from '@/stores/timelineStore.js';
import {
  getGameClassName,
  getGameElementName,
  getGameWeaponTypeName,
  getOperatorGameName,
} from '@/data/gameText';

const store = useTimelineStore();
const { t, locale } = useI18n();

const visible = ref(false);
const targetTrackIndex = ref(null);
const searchQuery = ref('');
const elementFilter = ref('ALL');
const classFilter = ref('ALL');

const elementIcons = {
  physical: '/icons/icon_element_physical.webp',
  heat: '/icons/icon_element_heat.webp',
  cryo: '/icons/icon_element_cryo.webp',
  electric: '/icons/icon_element_electric.webp',
  nature: '/icons/icon_element_nature.webp',
};

function rarityColor(rarity) {
  if (rarity === 6) return '#FFD700';
  if (rarity === 5) return '#ffc400';
  if (rarity === 4) return '#d8b4fe';
  return '#a0a0a0';
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

const elementFilters = computed(() => {
  locale.value;
  return [
    { label: t('timelineGrid.elementFilter.all'), value: 'ALL', color: '#888' },
    { label: getGameElementName('physical', locale.value), value: 'physical', color: '#e0e0e0' },
    { label: getGameElementName('heat', locale.value), value: 'heat', color: '#ff4d4f' },
    { label: getGameElementName('cryo', locale.value), value: 'cryo', color: '#00e5ff' },
    { label: getGameElementName('electric', locale.value), value: 'electric', color: '#ffd700' },
    { label: getGameElementName('nature', locale.value), value: 'nature', color: '#52c41a' },
  ];
});

const classFilters = computed(() => {
  locale.value;
  return [
    { label: t('timelineGrid.classFilter.all'), value: 'ALL' },
    { label: getGameClassName('guard', locale.value), value: 'guard' },
    { label: getGameClassName('caster', locale.value), value: 'caster' },
    { label: getGameClassName('defender', locale.value), value: 'defender' },
    { label: getGameClassName('vanguard', locale.value), value: 'vanguard' },
    { label: getGameClassName('striker', locale.value), value: 'striker' },
    { label: getGameClassName('supporter', locale.value), value: 'supporter' },
  ];
});

const selectedIds = computed(() => (store.tracks || []).map(track => track.id).filter(Boolean));

const operatorItems = computed(() => {
  locale.value;
  return (store.characterRoster || []).map(operator => ({
    id: operator.id,
    name: getOperatorGameName(operator.id || operator.slug, locale.value),
    avatar: operator.avatar,
    rarity: Number(operator.rarity) || 0,
    element: operator.element || 'physical',
    elementName: getGameElementName(operator.element, locale.value),
    elementBadgeColor:
      operator.element === 'physical' ? '#8c8c8c' : store.getColor(operator.element || 'physical'),
    class: operator.class || '',
    searchTerms: [
      getOperatorGameName(operator.id || operator.slug, locale.value),
      operator.id,
      operator.slug,
      getGameElementName(operator.element, locale.value),
      getGameClassName(operator.class, locale.value),
      getGameWeaponTypeName(operator.weapon, locale.value),
    ]
      .map(normalizeSearchText)
      .filter(Boolean),
  }));
});

const groups = computed(() => {
  let operators = operatorItems.value;
  if (elementFilter.value !== 'ALL') {
    operators = operators.filter(operator => operator.element === elementFilter.value);
  }
  if (classFilter.value !== 'ALL') {
    operators = operators.filter(operator => operator.class === classFilter.value);
  }
  if (searchQuery.value) {
    const query = normalizeSearchText(searchQuery.value);
    operators = operators.filter(operator =>
      operator.searchTerms.some(term => term.includes(query)),
    );
  }

  const byRarity = new Map();
  for (const operator of operators) {
    const rarity = operator.rarity || 1;
    if (!byRarity.has(rarity)) byRarity.set(rarity, []);
    byRarity.get(rarity).push(operator);
  }
  return [...byRarity.entries()]
    .sort(([a], [b]) => b - a)
    .map(([level, list]) => ({ level, list }));
});

function open(trackIndex) {
  store.selectTrack(trackIndex);
  targetTrackIndex.value = trackIndex;
  searchQuery.value = '';
  elementFilter.value = 'ALL';
  classFilter.value = 'ALL';
  visible.value = true;
}

function select(operatorId) {
  if (targetTrackIndex.value !== null) {
    const oldId = store.tracks[targetTrackIndex.value]?.id;
    store.changeTrackOperator(targetTrackIndex.value, oldId, operatorId);
  }
  close();
}

function remove() {
  if (targetTrackIndex.value !== null) store.clearTrack(targetTrackIndex.value);
  close();
}

function close() {
  visible.value = false;
}

function onClosed() {
  targetTrackIndex.value = null;
}

defineExpose({ open, isOpen: () => visible.value });
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('timelineGrid.operatorDialog.title')"
    width="600px"
    align-center
    class="char-selector-dialog"
    append-to-body
    @closed="onClosed"
  >
    <div class="selector-header">
      <div class="header-left-group">
        <el-input
          v-model="searchQuery"
          :placeholder="t('timelineGrid.operatorDialog.searchPlaceholder')"
          :prefix-icon="Search"
          clearable
          style="width: 180px"
        />
        <button
          class="ea-btn ea-btn--glass-cut ea-btn--glass-cut-danger ea-btn--cut-left ea-btn--lift"
          :title="t('timelineGrid.operatorDialog.clearTrack')"
          @click="remove"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          >
            <path d="M3 6h18" />
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            />
          </svg>
          {{ t('common.unequip') }}
        </button>
      </div>
      <div class="element-filters">
        <button
          v-for="element in elementFilters"
          :key="element.value"
          class="ea-btn ea-btn--glass-cut"
          :class="{ 'is-active': elementFilter === element.value }"
          :style="{ '--ea-btn-accent': element.color }"
          @click="elementFilter = element.value"
        >
          {{ element.label }}
        </button>
      </div>
      <div class="class-filters">
        <button
          v-for="operatorClass in classFilters"
          :key="operatorClass.value"
          class="ea-btn ea-btn--glass-cut"
          :class="{ 'is-active': classFilter === operatorClass.value }"
          @click="classFilter = operatorClass.value"
        >
          {{ operatorClass.label }}
        </button>
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
          <div
            v-for="operator in group.list"
            :key="operator.id"
            class="roster-card"
            :class="[
              { 'is-selected': selectedIds.includes(operator.id) },
              `rarity-${operator.rarity}-style`,
            ]"
            @click="select(operator.id)"
          >
            <div
              class="card-avatar-wrapper"
              :style="operator.rarity === 6 ? {} : { borderColor: rarityColor(operator.rarity) }"
            >
              <img :src="operator.avatar" loading="lazy" />
              <div
                class="element-badge"
                :class="{ 'is-physical': operator.element === 'physical' }"
                :style="{ backgroundColor: operator.elementBadgeColor }"
                :title="operator.elementName"
              >
                <img
                  :src="elementIcons[operator.element] || elementIcons.physical"
                  alt=""
                  loading="lazy"
                />
              </div>
            </div>
            <div class="card-name">{{ operator.name }}</div>
            <div v-if="selectedIds.includes(operator.id)" class="in-team-tag">
              {{ t('timelineGrid.operatorDialog.inTeam') }}
            </div>
          </div>
        </div>
      </template>
      <div v-if="groups.length === 0" class="empty-roster">
        {{ t('timelineGrid.operatorDialog.empty') }}
      </div>
    </div>
  </el-dialog>
</template>

<style src="./selectionDialog.css"></style>
