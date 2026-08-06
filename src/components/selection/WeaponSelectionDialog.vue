<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import WeaponSelectionTooltip from '@/components/selection/WeaponSelectionTooltip.vue';
import { useTimelineStore } from '@/stores/timelineStore.js';
import { getGameWeaponTypeName, getWeaponGameName } from '@/data/gameText';

const store = useTimelineStore();
const { t, locale } = useI18n();
const visible = ref(false);
const targetTrackIndex = ref(null);
const searchQuery = ref('');
const fullPotential = ref(false);

function rarity(weapon) {
  return Math.max(3, Number(weapon?.rarity) || 3);
}

function rarityColor(value) {
  if (value === 6) return 'var(--ea-gold)';
  if (value === 5) return '#ffc400';
  if (value === 4) return '#d8b4fe';
  return '#a0a0a0';
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

const currentTrack = computed(() =>
  targetTrackIndex.value === null ? null : store.tracks[targetTrackIndex.value] || null,
);

const currentWeaponId = computed(() => currentTrack.value?.weaponId || '');

const groups = computed(() => {
  const track = currentTrack.value;
  if (!track?.id) return [];

  const operator = (store.characterRoster || []).find(item => item.id === track.id);
  const requiredType = operator?.weapon;
  const query = normalizeSearchText(searchQuery.value);
  let weapons = (store.weaponDatabase || [])
    .filter(weapon => !requiredType || weapon.type === requiredType)
    .map(weapon => ({
      id: weapon.id,
      canonicalId: weapon.canonicalSlug || weapon.id,
      name: getWeaponGameName(weapon.canonicalSlug || weapon.id, locale.value),
      icon: weapon.icon || '/weapons/default.webp',
      rarity: Number(weapon.rarity) || 0,
      searchTerms: [
        getWeaponGameName(weapon.canonicalSlug || weapon.id, locale.value),
        weapon.id,
        weapon.canonicalSlug,
        getGameWeaponTypeName(weapon.type, locale.value),
      ]
        .map(normalizeSearchText)
        .filter(Boolean),
    }));

  if (query) {
    weapons = weapons.filter(weapon => weapon.searchTerms.some(term => term.includes(query)));
  }

  const byRarity = new Map();
  for (const weapon of weapons) {
    const level = rarity(weapon);
    if (!byRarity.has(level)) byRarity.set(level, []);
    byRarity.get(level).push(weapon);
  }
  return [...byRarity.entries()]
    .sort(([a], [b]) => b - a)
    .map(([level, list]) => ({ level, list }));
});

function open(trackIndex) {
  const track = store.tracks[trackIndex];
  if (!track?.id) return;
  store.selectTrack(trackIndex);
  targetTrackIndex.value = trackIndex;
  searchQuery.value = '';
  visible.value = true;
}

function select(weaponId) {
  if (currentTrack.value?.id) store.updateTrackWeapon(currentTrack.value.id, weaponId);
  close();
}

function remove() {
  if (currentTrack.value?.id) store.updateTrackWeapon(currentTrack.value.id, null);
  close();
}

function close() {
  visible.value = false;
}

function onClosed() {
  targetTrackIndex.value = null;
  fullPotential.value = false;
}

function handleKeyDown(event) {
  if (event.key === 'Control') fullPotential.value = true;
}

function handleKeyUp(event) {
  if (event.key === 'Control') fullPotential.value = false;
}

function resetModifierKey() {
  fullPotential.value = false;
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', resetModifierKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('blur', resetModifierKey);
});

defineExpose({ open, close, isOpen: () => visible.value });
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('timelineGrid.weaponDialog.title')"
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
          :placeholder="t('timelineGrid.weaponDialog.searchPlaceholder')"
          :prefix-icon="Search"
          clearable
          style="width: 180px"
        />
        <button
          class="ea-btn ea-btn--glass-cut ea-btn--glass-cut-danger ea-btn--cut-left ea-btn--lift"
          :disabled="!currentWeaponId"
          :title="t('timelineGrid.weaponDialog.unequipTooltip')"
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
            v-for="weapon in group.list"
            :key="weapon.id"
            class="roster-card"
            :class="[`rarity-${rarity(weapon)}-style`]"
            @click="select(weapon.id)"
          >
            <el-tooltip
              placement="top-start"
              effect="dark"
              :show-after="160"
              popper-class="weapon-selection-preview-popper"
            >
              <template #content>
                <WeaponSelectionTooltip :weapon="weapon" :full-potential="fullPotential" />
              </template>
              <div class="selection-card-tooltip-target">
                <div
                  class="card-avatar-wrapper"
                  :style="rarity(weapon) === 6 ? {} : { borderColor: rarityColor(rarity(weapon)) }"
                >
                  <img :src="weapon.icon || '/weapons/default.webp'" loading="lazy" />
                </div>
                <div class="card-name">{{ weapon.name }}</div>
              </div>
            </el-tooltip>
            <div v-if="currentWeaponId === weapon.id" class="in-team-tag weapon-equipped">
              {{ t('timelineGrid.weaponDialog.equipped') }}
            </div>
          </div>
        </div>
      </template>
      <div v-if="groups.length === 0" class="empty-roster">
        {{ t('timelineGrid.weaponDialog.empty') }}
      </div>
    </div>
  </el-dialog>
</template>

<style src="./selectionDialog.css"></style>
