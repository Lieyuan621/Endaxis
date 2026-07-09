<script setup>
import { computed, ref, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { useOperatorStore } from '@/stores/operatorStore'
import { useWeaponStore } from '@/stores/weaponStore'
import EditOperatorInstanceDialog from './armory/EditOperatorInstanceDialog.vue'
import EditWeaponInstanceDialog from './armory/EditWeaponInstanceDialog.vue'
import EditTrackGearLoadoutDialog from './armory/EditTrackGearLoadoutDialog.vue'
import { useI18n } from 'vue-i18n'
import { getOperatorGameName, getWeaponGameName } from '@/data/gameText'

const store = useTimelineStore()
const operatorStore = useOperatorStore()
const weaponStore = useWeaponStore()
const { t, locale } = useI18n()
const props = defineProps({
  onResetPanel: {
    type: Function,
    default: null
  },
  onCollapsePanel: {
    type: Function,
    default: null
  }
})

function handleResetPanel() {
  props.onResetPanel?.()
}

function handleCollapsePanel() {
  props.onCollapsePanel?.()
}

// === 核心数据逻辑 ===
const activeTrack = computed(() => (
  store.activeTrackIndex !== null && store.activeTrackIndex !== undefined
    ? store.tracks[store.activeTrackIndex] || null
    : store.tracks.find(t => t.id === store.activeTrackId) || null
))
const activeCharacter = computed(() => {
  return activeTrack.value?.id ? (store.characterRoster.find(c => c.id === activeTrack.value.id) || null) : null
})
const activeWeapon = computed(() => activeTrack.value?.weaponId ? store.getWeaponById(activeTrack.value.weaponId) : null)
const activeOperatorInstance = computed(() => {
  const instanceId = activeTrack.value?.operatorInstanceId
  return instanceId ? operatorStore.operators.find(op => op.id === instanceId) || null : null
})
const activeWeaponInstance = computed(() => {
  const instanceId = activeTrack.value?.weaponInstanceId
  return instanceId ? weaponStore.weapons.find(weapon => weapon.id === instanceId) || null : null
})
const hasActiveCharacter = computed(() => !!(activeTrack.value && activeCharacter.value))
const hasAnyEquipmentEquipped = computed(() => {
  const t = activeTrack.value
  if (!t) return false
  return !!(
    t.equipArmorInstanceId ||
    t.equipGlovesInstanceId ||
    t.equipAccessory1InstanceId ||
    t.equipAccessory2InstanceId ||
    t.equipArmorId ||
    t.equipGlovesId ||
    t.equipAccessory1Id ||
    t.equipAccessory2Id
  )
})

const activeCharacterName = computed(() => {
  if (!activeCharacter.value) return t('actionLibrary.fallback.noOperator')
  return getOperatorGameName(activeCharacter.value.id || activeCharacter.value.slug, locale.value)
})
const activeWeaponName = computed(() => {
  if (!activeWeapon.value) return t('actionLibrary.fallback.noWeapon')
  return getWeaponGameName(activeWeapon.value.canonicalSlug || activeWeapon.value.id, locale.value)
})
const activeLibraryTitle = computed(() => {
  return activeCharacterName.value
})

const showOperatorEditDialog = ref(false)
const showWeaponEditDialog = ref(false)
const showGearLoadoutDialog = ref(false)

function openOperatorEditDialog() {
  if (!activeOperatorInstance.value) return
  showOperatorEditDialog.value = true
}

function openWeaponEditDialog() {
  if (!activeWeaponInstance.value) return
  showWeaponEditDialog.value = true
}

function openGearLoadoutDialog() {
  if (!hasAnyEquipmentEquipped.value) return
  showGearLoadoutDialog.value = true
}

function getFullTypeName(type) {
  const displayType =
    type === 'basicAttack'
      ? 'attack'
      : type === 'battleSkill'
        ? 'skill'
        : type === 'comboSkill'
          ? 'link'
          : type === 'finisher'
            ? 'execution'
            : type === 'dive'
              ? 'dive'
              : type
  const key = `skillType.${displayType}`
  const out = t(key)
  return out === key ? t('skillType.unknown') : out
}

// 图标路径
const WEAPON_ICON_MAP = {
  'sword': '/icons/icon_attack_sword.webp',
  'greatsword': '/icons/icon_attack_claym.webp',
  'polearm': '/icons/icon_attack_lance.webp',
  'handcannon': '/icons/icon_attack_pistol.webp',
  'arts-unit': '/icons/icon_attack_funnel.webp',
}

const currentWeaponIcon = computed(() => {
  const wType = activeCharacter.value?.weapon || 'sword'
  return WEAPON_ICON_MAP[wType] || WEAPON_ICON_MAP['sword']
})

function getSkillDisplayIcon(skill) {
  if (['basicAttack', 'dive', 'finisher'].includes(skill.type)) {
    return currentWeaponIcon.value
  }
  return skill.icon || ''
}

function getSkillCardTooltip(skill) {
  const name = typeof skill?.name === 'string' ? skill.name.trim() : ''
  const description = typeof skill?.description === 'string' ? skill.description.trim() : ''
  if (name && description) return `${name}\n\n${description}`
  return description || name || ''
}

// Operator skill library
const localSkills = ref([])

function onSkillClick(skillId) {
  store.selectLibrarySkill(skillId)
}

watch(
    () => [store.activeSkillLibrary, locale.value],
    (newVal) => {
      const skills = newVal?.[0]
      if (skills && skills.length > 0) {
        localSkills.value = JSON.parse(JSON.stringify(skills.filter(s => !s.hiddenInLibraryGrid)))
      } else {
        localSkills.value = []
      }
    },
    { immediate: true, deep: true }
)

watch(hasActiveCharacter, (val) => {
  if (!val) {
    store.selectLibrarySkill(null)
  }
})

// === 拖拽 Ghost 逻辑 ===
function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`
  let c = hex.substring(1).split('')
  if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]]
  c = '0x' + c.join('')
  return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')'
}

function getSkillThemeColor(skill) {
  if (skill.customColor) return skill.customColor
  if (skill.type === 'comboSkill') return store.getColor('link')
  if (skill.type === 'finisher') return store.getColor('execution')
  if (skill.type === 'basicAttack') return store.getColor('attack')
  if (skill.type === 'dive') return store.getColor('dodge')
  if (skill.type === 'battleSkill') return skill.element ? store.getColor(skill.element) : store.getColor('skill')
  if (skill.type === 'ultimate') return skill.element ? store.getColor(skill.element) : store.getColor('ultimate')
  if (skill.element) return store.getColor(skill.element)
  if (activeCharacter.value?.element) return store.getColor(activeCharacter.value.element)
  return store.getColor('default')
}

function formatDurationLabel(val) {
  const num = Number(val)
  if (!Number.isFinite(num)) return 0
  const rounded = Math.round(num * 1000) / 1000
  return rounded
}

function isAttackSegmentDisabled(seg) {
  return (Number(seg?.duration) || 0) <= 0
}

function getVisibleAttackSegments(skill) {
  return Array.isArray(skill?.attackSegments) ? skill.attackSegments : []
}

function getVisibleSkillSegments(skill) {
  if (skill?.kind === 'attack_group') return getVisibleAttackSegments(skill)
  if (skill?.kind === 'group' && Array.isArray(skill?.segments)) return skill.segments
  return []
}

function getSegmentChipLabel(seg) {
  if (seg.type === 'basicAttack') return `${seg.attackSegmentIndex || seg.segmentIndex || ''}A`
  const suffix = {
    battleSkill: 'C',
    comboSkill: 'E',
    ultimate: 'U',
    finisher: 'X',
    dive: 'D',
  }[seg.type] || '?'
  return `${seg.segmentIndex || seg.sequenceIndex || ''}${suffix}`
}

function onAttackSegmentDragStart(evt, seg) {
  if (isAttackSegmentDisabled(seg)) {
    evt.preventDefault()
    return
  }
  onNativeDragStart(evt, seg)
}

function onAttackSegmentClick(seg) {
  if (isAttackSegmentDisabled(seg)) return
  onSkillClick(seg.id)
}

function onNativeDragStart(evt, skill) {
  const ghost = document.createElement('div');
  ghost.id = 'custom-drag-ghost';

  const duration = Number(skill.duration) || 0;
  const themeColor = getSkillThemeColor(skill);
  let dragOffsetX = 0
  let dragOffsetY = 0

  const realWidth = (duration || 1) * store.timeBlockWidth;
  ghost.textContent = skill.name || '';
  Object.assign(ghost.style, {
    position: 'absolute', top: '-9999px', left: '-9999px',
    width: `${realWidth}px`, height: '50px',
    border: `2px dashed ${themeColor}`,
    backgroundColor: hexToRgba(themeColor, 0.2),
    color: '#ffffff',
    boxShadow: `0 0 10px ${themeColor}`,
    textShadow: `0 1px 2px rgba(0,0,0,0.8)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxSizing: 'border-box',
    fontSize: '12px', fontWeight: 'bold', zIndex: '999999', pointerEvents: 'none',
    fontFamily: 'sans-serif', whiteSpace: 'nowrap',
    backdropFilter: 'blur(4px)'
  });
  document.body.appendChild(ghost);
  dragOffsetX = 10
  dragOffsetY = 25
  evt.dataTransfer.setDragImage(ghost, dragOffsetX, dragOffsetY);
  evt.dataTransfer.effectAllowed = 'copy';

  const payload = {
    ...skill,
    librarySource: 'character',
    weaponId: null,
    dragOffsetX,
    dragOffsetY,
  }

  store.setDraggingSkill(payload);
  document.body.classList.add('is-lib-dragging');

  setTimeout(() => {
    const el = document.getElementById('custom-drag-ghost');
    if (el) document.body.removeChild(el);
  }, 0);
}

function onNativeDragEnd() {
  store.setDraggingSkill(null)
  document.body.classList.remove('is-lib-dragging')
}
</script>

<template>
  <div class="library-container">
    <div class="lib-header">
      <div class="header-main">
        <div class="header-main-title">
          <div class="header-icon-bar"></div>
          <h3 class="char-name">{{ activeLibraryTitle }}</h3>
        </div>
        <div class="header-actions">
          <button type="button" class="header-tool-btn" @click="handleResetPanel">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
      </div>
      <div class="header-divider"></div>

      <div class="section-title-box status-adjust-title-box">
        <span class="section-title">{{ t('actionLibrary.section.operatorStatusAdjust') }}</span>
        <span class="section-hint">{{ t('actionLibrary.hints.adjustOperatorStatus') }}</span>
      </div>

      <div class="loadout-actions">
        <button
          type="button"
          class="loadout-action-btn"
          :disabled="!activeOperatorInstance"
          @click="openOperatorEditDialog"
        >
          {{ t('actionLibrary.tabs.operator') }}
        </button>
        <button
          type="button"
          class="loadout-action-btn"
          :disabled="!activeWeaponInstance"
          :title="t('actionLibrary.tabs.weaponNeedSelect')"
          @click="openWeaponEditDialog"
        >
          {{ t('actionLibrary.tabs.weapon') }}
        </button>
        <button
          type="button"
          class="loadout-action-btn"
          :disabled="!hasAnyEquipmentEquipped"
          :title="t('actionLibrary.tabs.setNeedEquip')"
          @click="openGearLoadoutDialog"
        >
          {{ t('actionLibrary.tabs.set') }}
        </button>
      </div>
    </div>

    <EditOperatorInstanceDialog
      :visible="showOperatorEditDialog"
      :instance="activeOperatorInstance"
      :display-name="activeCharacterName"
      @update:visible="showOperatorEditDialog = $event"
    />
    <EditWeaponInstanceDialog
      :visible="showWeaponEditDialog"
      :instance="activeWeaponInstance"
      :display-name="activeWeaponName"
      @update:visible="showWeaponEditDialog = $event"
    />
    <EditTrackGearLoadoutDialog
      :visible="showGearLoadoutDialog"
      :track="activeTrack"
      @update:visible="showGearLoadoutDialog = $event"
    />

    <div v-if="hasActiveCharacter" class="skill-section">
      <div class="section-title-box">
        <span class="section-title">{{ t('actionLibrary.section.operatorSkillLibrary') }}</span>
        <span class="section-hint">{{ t('actionLibrary.hints.clickOrDrag') }}</span>
      </div>
      <div v-if="localSkills.length > 0" class="skill-grid">
        <div
            v-for="skill in localSkills"
            :key="skill.id"
            class="skill-item"
            :style="{ '--accent-color': getSkillThemeColor(skill) }"
        >
          <div
              class="skill-card"
              :class="{ 'is-selected': store.selectedLibrarySkillId === skill.id }"
              :title="getSkillCardTooltip(skill)"
              draggable="true"
              @dragstart="onNativeDragStart($event, skill)"
              @dragend="onNativeDragEnd"
              @click="onSkillClick(skill.id)"
          >
            <div class="card-edge"></div>
            <div class="card-body">
              <div class="skill-meta"><span v-if="!skill.name.includes(getFullTypeName(skill.type))" class="skill-type">{{ getFullTypeName(skill.type) }}</span>
                <span v-else class="skill-type-empty"></span>
                <span class="skill-time">{{ formatDurationLabel(skill.duration) }}s</span>
              </div>
              <div class="skill-name">{{ skill.name }}</div>
            </div>

            <div class="card-bg-deco" v-if="getSkillDisplayIcon(skill)">
              <img :src="getSkillDisplayIcon(skill)" class="weapon-icon-inner" />
            </div>
            <div v-else class="card-bg-deco-empty"></div>
          </div>

          <div v-if="getVisibleSkillSegments(skill).length > 1" class="attack-segment-row" @click.stop>
            <div
                v-for="(seg, idx) in getVisibleSkillSegments(skill)"
                :key="seg.id"
                class="attack-segment-chip"
                :class="{ 'is-selected': store.selectedLibrarySkillId === seg.id, 'is-last': idx === getVisibleSkillSegments(skill).length - 1 }"
                :draggable="!isAttackSegmentDisabled(seg)"
                @dragstart="onAttackSegmentDragStart($event, seg)"
                @dragend="onNativeDragEnd"
                @click.stop="onAttackSegmentClick(seg)"
            >{{ getSegmentChipLabel(seg) }}</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.library-container {
  padding: 15px;
  display: flex;
  flex-direction: column;
  background-color: #252525;
  height: 100%;
  gap: 15px;
  overflow-y: auto;
  transition: background-color 0.3s ease;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.library-container::-webkit-scrollbar {
  display: none;
}
/* 头部样式 */
.lib-header { display: flex; flex-direction: column; gap: 4px; }
.header-main { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.header-main-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
.header-icon-bar { width: 4px; height: 18px; background-color: #ffd700; }
.char-name { margin: 0; color: #fff; font-size: 18px; letter-spacing: 1px; }
.header-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; margin-right: -2px; }
.header-tool-btn { width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 0; background: transparent; color: rgba(255, 255, 255, 0.34); cursor: pointer; padding: 0; transition: color 0.14s ease, background-color 0.14s ease; }
.header-tool-btn:hover { color: rgba(255, 255, 255, 0.86); background: rgba(255, 255, 255, 0.055); }
.loadout-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 6px; }
.loadout-action-btn {
  background: #1f1f1f;
  border: 1px solid #333;
  color: #bbb;
  padding: 6px 12px;
  border-radius: 0;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}
.loadout-action-btn:hover:not(:disabled) { color: #fff; border-color: #ffd700; box-shadow: 0 0 10px rgba(255, 215, 0, 0.16); }
.loadout-action-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.header-divider { height: 2px; background: linear-gradient(90deg, #ffd700 0%, transparent 100%); opacity: 0.3; margin-top: 3px; }

/* 技能卡片列表 */
.skill-section { display: flex; flex-direction: column; gap: 15px; }
.section-title-box { display: flex; flex-direction: column; border-left: 2px solid #444; padding-left: 10px; }
.section-title { font-size: 14px; font-weight: bold; color: #ccc; }
.section-hint { font-size: 10px; color: #555; }

.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.skill-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  --accent-color: #8c8c8c;
}

.skill-card {
  position: relative;
  height: 60px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0;
  cursor: grab;
  overflow: hidden;
  box-sizing: border-box;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.skill-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}
.skill-card.is-selected {
  border-color: #ffd700;
  box-shadow: inset 0 0 10px rgba(255, 215, 0, 0.1);
  background: rgba(255, 215, 0, 0.05);
}

.attack-segment-row {
  display: flex;
  gap: 2px;
  width: 100%;
  padding: 0;
  min-height: 22px;
  align-items: center;
  box-sizing: border-box;
}

.attack-segment-chip {
  position: relative;
  flex: 1 1 0;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.75);
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1;
  user-select: none;
  cursor: grab;
  box-sizing: border-box;
  transition: all 0.15s ease;
  border-radius: 0;
  min-width: 0;
}

.attack-segment-chip::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: var(--accent-color, rgba(255, 255, 255, 0.9));
  box-shadow: 2px 0 10px color-mix(in srgb, var(--accent-color, white) 25%, transparent);
  opacity: 0.75;
}

.attack-segment-chip:not(.is-last)::after {
  content: '>';
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.28);
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1;
  pointer-events: none;
}

.attack-segment-chip:hover {
  border-color: var(--accent-color);
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.attack-segment-chip.is-selected {
  border-color: #ffd700;
  color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.12);
}


.skill-type-empty {
  height: 9px;
  flex: 1;
}

.skill-card:not(:has(.skill-type)) .skill-name {
  font-size: 14px;
  margin-top: 2px;
}

.card-edge {
  position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
  background-color: var(--accent-color);
  box-shadow: 2px 0 10px var(--accent-color);
}

.card-body { padding: 10px 12px 10px 16px; height: 100%; display: flex; flex-direction: column; justify-content: center; box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.1); }

.skill-meta { display: flex; align-items: center; margin-bottom: 2px; }
.skill-type { font-size: 9px; color: var(--accent-color); filter: brightness(0.8); font-weight: bold; text-transform: uppercase; opacity: 0.6; }
.skill-time { position: absolute; top: 5px; right: 21px; width: 38px; display: flex; align-items: center; gap: 4px; font-family: 'Roboto Mono', 'Consolas', monospace; font-size: 10px; font-weight: 500; color: rgba(255, 255, 255, 0.45); z-index: 3; }
.skill-time::before { content: ''; width: 1px; height: 8px; background: var(--accent-color); opacity: 0.4; }
.skill-name { font-size: 13px; color: rgba(255, 255, 255, 0.9); font-weight: bold; margin-top: 2px; padding-right: 65px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.card-bg-deco {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, transparent 20%, var(--accent-color) 100%);
  opacity: 0.6;
  clip-path: polygon(100% 0, 0 100%, 100% 100%);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.weapon-icon-inner {
  width: 28px;
  height: 28px;
  filter: brightness(1.2) drop-shadow(0 0 5px var(--accent-color));
  opacity: 0.9;
  margin-right: 2px;
  margin-bottom: 2px;
  pointer-events: none;
  transition: all 0.2s ease;
}

.skill-card:hover .card-bg-deco {
  opacity: 0.85;
  transform: scale(1.05);
}

.skill-card:hover .weapon-icon-inner {
  filter: brightness(1.5) drop-shadow(0 0 8px #fff);
  transform: scale(1.1);
  opacity: 1;
}

.card-bg-deco-empty {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 15px;
  height: 15px;
  background: var(--accent-color);
  opacity: 0.2;
  clip-path: polygon(100% 0, 0 100%, 100% 100%);
}

/* Slider 自定义 */
</style>
