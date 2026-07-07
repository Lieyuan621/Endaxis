<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getGearPiece } from '@/data'
import {
  getGameSlotTypeName,
  getGearPieceGameName,
  getGearSetGameName,
} from '@/data/gameText'
import {
  formatEquipmentEffectLabel,
  formatEquipmentEffectStatValue,
} from '@/utils/equipmentEffectDisplay'
import { resolveLeveled } from '@/data/types'
import { useGearStore } from '@/stores/gearStore'
import { useTimelineStore } from '@/stores/timelineStore'
import EditGearInstanceDialog from './EditGearInstanceDialog.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  track: { type: Object, default: null },
})

const emit = defineEmits(['update:visible'])

const store = useTimelineStore()
const gearStore = useGearStore()
const { t, locale } = useI18n()
const editingGearInstance = ref(null)

const SLOT_CONFIGS = [
  {
    slotKey: 'armor',
    idKey: 'equipArmorId',
    instanceKey: 'equipArmorInstanceId',
    tierKey: 'equipArmorRefineTier',
    labelKey: 'timelineGrid.equipmentSlot.armor',
    fallback: 'Armor',
  },
  {
    slotKey: 'gloves',
    idKey: 'equipGlovesId',
    instanceKey: 'equipGlovesInstanceId',
    tierKey: 'equipGlovesRefineTier',
    labelKey: 'timelineGrid.equipmentSlot.gloves',
    fallback: 'Gloves',
  },
  {
    slotKey: 'accessory1',
    idKey: 'equipAccessory1Id',
    instanceKey: 'equipAccessory1InstanceId',
    tierKey: 'equipAccessory1RefineTier',
    labelKey: 'timelineGrid.equipmentSlot.accessory1',
    fallback: 'Accessory 1',
  },
  {
    slotKey: 'accessory2',
    idKey: 'equipAccessory2Id',
    instanceKey: 'equipAccessory2InstanceId',
    tierKey: 'equipAccessory2RefineTier',
    labelKey: 'timelineGrid.equipmentSlot.accessory2',
    fallback: 'Accessory 2',
  },
]

const EQUIPMENT_LEVEL_COLORS = {
  70: '#ffd700',
  50: '#b37feb',
  36: '#4a90e2',
  28: '#73c94f',
  20: '#95de64',
  10: '#888888',
}
function getEquipmentLevelColor(level) {
  const key = Number(level)
  return EQUIPMENT_LEVEL_COLORS[key] || '#888'
}

function tr(key, fallback) {
  const out = t(key)
  return out === key ? fallback : out
}

function getInstance(instanceId) {
  return instanceId ? gearStore.gears.find(item => item.id === instanceId) || null : null
}

function getRefineLevel(instance) {
  const levels = Array.isArray(instance?.artificingLevels) ? instance.artificingLevels : []
  const normalized = [0, 1, 2].map(index => {
    const level = Number(levels[index]) || 0
    return Math.max(0, Math.min(3, level))
  })

  const first = normalized[0]
  const allSame = normalized.every(level => level === first)

  return allSame ? first : null
}
function getSkillSlots(piece) {
  if (!piece) return []
  return [piece.skill1, piece.skill2, piece.skill3]
    .filter(Boolean)
    .map(skill => (skill.effects || []).filter(effect => effect.kind === 'status'))
    .filter(slot => slot.length > 0)
}

function formatStatLabel(effect) {
  return formatEquipmentEffectLabel(effect, t, locale.value)
}

function getDisplaySlotName(slotType) {
  if (slotType === 'kit' || slotType === 'accessory') {
    return String(locale.value || '').toLowerCase().startsWith('zh') ? '配件' : 'Accessory'
  }
  return getGameSlotTypeName(slotType, locale.value)
}

function formatStatValue(effect, value) {
  return formatEquipmentEffectStatValue(effect, value)
}

function getArtificingLevel(instance, slotIdx) {
  const levels = Array.isArray(instance?.artificingLevels) ? instance.artificingLevels : []
  const level = Number(levels[slotIdx]) || 0
  return Math.max(0, Math.min(3, level))
}

function getSlotStatRows(piece, instance) {
  return getSkillSlots(piece).map((slot, index) => {
    const effect = slot[0]
    const refine = getArtificingLevel(instance, index)

    return {
      key: `${effect?.id || effect?.stat?.modifier || 'stat'}-${index}`,
      label: formatStatLabel(effect),
      value: effect ? formatStatValue(effect, resolveLeveled(effect.value, refine)) : '',
      refine,
    }
  })
}

function isUniformRefineActive(slot, level) {
  const levels = (slot?.stats || []).map(row => Number(row.refine))
  if (levels.length === 0) return false
  return levels.every(refine => refine === level)
}

const slots = computed(() => {
  const track = props.track
  return SLOT_CONFIGS.map(config => {
    const equipmentId = track?.[config.idKey] || null
    const instance = getInstance(track?.[config.instanceKey])
    const equipment = store.getEquipmentById?.(equipmentId) || null
    const piece = getGearPiece(instance?.gearPieceId || equipmentId)
    const level = Number(equipment?.level ?? piece?.levelRequirement) || 0
    const color = getEquipmentLevelColor(level)
    const trackRefine = Number(track?.[config.tierKey])
    const refine = Number.isFinite(trackRefine) ? Math.max(0, Math.min(3, trackRefine)) : getRefineLevel(instance)

    return {
      ...config,
      label: tr(config.labelKey, config.fallback),
      equipment,
      instance,
      piece,
      level,
      color,
      refine,
      isGold: level >= 70,
      name: instance
        ? getGearPieceGameName(instance.gearPieceId, locale.value) || instance.gearPieceId
        : equipment?.name || '',
      icon: piece?.icon || equipment?.icon || '/icons/default_icon.webp',
      setName: getGearSetGameName(piece?.setSlug || equipment?.category || '', locale.value) || equipment?.categoryName || '',
      slotType: piece?.slotType || equipment?.slot || '',
      stats: getSlotStatRows(piece, instance),
    }
  })
})

function setRefine(slot, level) {
  if (!props.track?.id || !slot?.instance || !slot.isGold) return
  store.updateTrackEquipmentTier(props.track.id, slot.slotKey, level)
}

function maxOut() {
  if (!props.track?.id) return
  slots.value.forEach(slot => {
    if (slot.instance && slot.isGold) store.updateTrackEquipmentTier(props.track.id, slot.slotKey, 3)
  })
}

function openItemEditor(slot) {
  if (!slot?.instance) return
  editingGearInstance.value = slot.instance
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="980px"
    append-to-body
    class="gear-loadout-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="loadout-layout">
      <div
        v-for="slot in slots"
        :key="slot.slotKey"
        class="gear-slot-card"
        :class="{ 'is-empty': !slot.instance }"
      >
        <div class="slot-head">
          <div class="slot-title">{{ slot.label }}</div>
          <div v-if="slot.instance" class="slot-tags">
            <span class="slot-tag" :style="{ color: slot.color, borderColor: slot.color }">
              Lv{{ slot.level }}
            </span>
            <span class="slot-tag">{{ getDisplaySlotName(slot.slotType) }}</span>
          </div>
        </div>

        <template v-if="slot.instance">
          <div class="gear-main">
            <div class="gear-icon-frame" :style="{ borderColor: slot.color }">
              <img :src="slot.icon" class="gear-icon" />
            </div>
            <div class="gear-info">
              <div class="gear-name">{{ slot.name }}</div>
              <div class="gear-subline">Lv{{ slot.level }}<span v-if="slot.setName"> / {{ slot.setName }}</span></div>
              <div v-if="slot.stats.length > 0" class="stat-list">
                <div v-for="row in slot.stats" :key="row.key" class="stat-row">
                  <span>{{ row.label }}</span>
                  <strong>+{{ row.value }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="refine-row">
            <span class="refine-label">{{ tr('timelineGrid.equipmentDialog.refine', 'Refine') }}</span>
            <span
                v-if="slot.isGold && slot.stats.length > 0"
                class="refine-mixed"
            >
              {{ slot.stats.map(row => row.refine).join('/') }}
            </span>
            <template v-if="slot.isGold">
              <div class="refine-buttons">
                <button
                  v-for="level in [0, 1, 2, 3]"
                  :key="`${slot.slotKey}-${level}`"
                  type="button"
                  class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-gold refine-btn"
                  :class="{ 'is-active': isUniformRefineActive(slot, level) }"
                  @click="setRefine(slot, level)"
                >
                  {{ level === 0 ? tr('timelineGrid.equipmentDialog.refineBase', 'Base') : level }}
                </button>
              </div>
            </template>
            <span v-else class="refine-locked">{{ t('actionLibrary.hints.noRefineNon70') }}</span>
          </div>

          <button class="ea-btn ea-btn--sm ea-btn--glass-rect edit-item-btn" @click="openItemEditor(slot)">
            {{ t('actionLibrary.buttons.editItem') }}
          </button>
        </template>

        <div v-else class="empty-slot">
          {{ tr('actionLibrary.fallback.noEquip', 'No gear equipped') }}
        </div>
      </div>
    </div>

    <EditGearInstanceDialog
      :visible="!!editingGearInstance"
      :instance="editingGearInstance"
      @update:visible="value => { if (!value) editingGearInstance = null }"
    />

    <template #footer>
      <div class="footer">
        <button class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--square ea-btn--hover-gold-fill" @click="maxOut">{{ t('common.max') }}</button>
        <button class="ea-btn ea-btn--sm ea-btn--glass-rect" @click="emit('update:visible', false)">{{ t('common.close') }}</button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.loadout-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  max-height: 68vh;
  overflow: auto;
  padding-right: 4px;
}

.gear-slot-card {
  min-height: 230px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.gear-slot-card.is-empty {
  justify-content: space-between;
  opacity: 0.65;
}

.slot-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.slot-title {
  color: #f0f0f0;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
}

.slot-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.slot-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 10px;
  color: #bbb;
  border: 1px solid #555;
  background: rgba(255, 255, 255, 0.04);
}

.gear-main {
  display: flex;
  gap: 14px;
  min-width: 0;
}

.gear-icon-frame {
  width: 76px;
  height: 76px;
  flex: 0 0 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #555;
  background: #1a1a1e;
}

.gear-icon {
  width: 72%;
  height: 72%;
  object-fit: contain;
}

.gear-info {
  flex: 1;
  min-width: 0;
}

.gear-name {
  color: #f0f0f0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
}

.gear-subline {
  margin-top: 4px;
  color: #999;
  font-size: 12px;
}

.stat-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #bdbdbd;
  font-size: 12px;
}

.stat-row strong {
  color: #eab308;
  font-family: 'Roboto Mono', monospace;
}

.refine-row {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 28px;
}

.refine-label {
  color: #888;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.refine-buttons {
  display: flex;
  gap: 6px;
}

.refine-btn {
  min-width: 34px;
  height: 24px;
  padding: 0 8px;
}

.refine-locked,
.empty-slot {
  color: #777;
  font-size: 12px;
}

.edit-item-btn {
  align-self: flex-end;
  min-width: 110px;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}

@media (max-width: 900px) {
  .loadout-layout {
    grid-template-columns: 1fr;
  }
}

.refine-mixed {
  color: #eab308;
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  opacity: 0.95;
}
</style>
