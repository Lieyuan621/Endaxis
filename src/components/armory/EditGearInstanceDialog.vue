<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getGearPiece, getQualityTier } from '@/data'
import {
  getGameQualityName,
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
import { qualityColors } from '@/utils/theme'

const props = defineProps({
  instance: { type: Object, default: null },
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible'])

const gearStore = useGearStore()
const { t, locale } = useI18n()

const piece = computed(() => (props.instance ? getGearPiece(props.instance.gearPieceId) : null))
const quality = computed(() => (piece.value ? getQualityTier(piece.value.levelRequirement) : 'green'))
const isGold = computed(() => quality.value === 'gold')
const color = computed(() => qualityColors[quality.value] ?? '#888')

const skillSlots = computed(() => {
  const currentPiece = piece.value
  if (!currentPiece) return []
  return [currentPiece.skill1, currentPiece.skill2, currentPiece.skill3]
    .filter(Boolean)
    .map(skill => (skill.effects || []).filter(effect => effect.kind === 'status'))
})

function formatStatLabel(effect) {
  return formatEquipmentEffectLabel(effect, t, locale.value)
}

function getDisplaySlotName(slotType) {
  if (slotType === 'kit' || slotType === 'accessory') {
    return String(locale.value || '').toLowerCase().startsWith('zh') ? '配件' : 'Accessory'
  }
  return getGameSlotTypeName(slotType, locale.value)
}

function update(updates) {
  if (props.instance) gearStore.updateGear(props.instance.id, updates)
}

function maxOut() {
  if (!props.instance || !piece.value || !isGold.value) return
  update({ artificingLevels: skillSlots.value.map(() => 3) })
}

function setArtificingLevel(slotIdx, slotLevel) {
  if (!props.instance || !isGold.value) return
  const current = props.instance.artificingLevels[slotIdx] ?? 0
  const nextLevel = slotLevel === current ? slotLevel - 1 : slotLevel
  const levels = [...(props.instance.artificingLevels ?? [])]
  while (levels.length <= slotIdx) levels.push(0)
  levels[slotIdx] = nextLevel
  update({ artificingLevels: levels })
}

function slotClass(slotIdx, slotLevel) {
  const current = props.instance?.artificingLevels[slotIdx] ?? 0
  return slotLevel <= current ? 'slot-active' : 'slot-empty'
}

function formatStatValue(effect, value) {
  return formatEquipmentEffectStatValue(effect, value)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="560px"
    append-to-body
    class="armory-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <template v-if="instance && piece">
      <div class="layout">
        <div class="header">
          <div class="portrait-frame" :style="{ borderColor: color }">
            <img :src="piece.icon" class="portrait" />
          </div>
          <div class="header-info">
            <div class="name">{{ getGearPieceGameName(instance.gearPieceId, locale) || instance.gearPieceId }}</div>
            <div class="tags">
              <span class="tag" :style="{ color, borderColor: color }">{{ getGameQualityName(quality, locale) }}</span>
              <span class="tag">{{ getDisplaySlotName(piece.slotType) }}</span>
              <span v-if="piece.setSlug" class="tag">{{ getGearSetGameName(piece.setSlug, locale) }}</span>
            </div>
            <div v-if="piece.defense" class="row">
              <span class="section-label">{{ t('armory.common.defense') }}</span>
              <span class="value">{{ piece.defense }}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">{{ t('armory.common.artificing') }}</div>
          <div v-for="(slot, slotIdx) in skillSlots" :key="slotIdx" class="stat-row">
            <div class="stat-info">
              <span class="stat-name">
                {{ formatStatLabel(slot[0]) }}
                <span v-if="slot[0]" class="stat-value-inline">
                  +{{ formatStatValue(slot[0], resolveLeveled(slot[0].value, instance.artificingLevels[slotIdx] ?? 0)) }}
                </span>
              </span>
            </div>
            <div v-if="isGold" class="stat-bar-area">
              <div class="stat-slots">
                <button
                  v-for="artSlot in 3"
                  :key="artSlot"
                  class="ea-btn ea-btn--icon ea-btn--icon-22 ea-btn--glass-rect ea-btn--accent-gold art-slot"
                  :class="{ 'is-active': slotClass(slotIdx, artSlot) === 'slot-active' }"
                  @click="setArtificingLevel(slotIdx, artSlot)"
                >
                  <template v-if="slotClass(slotIdx, artSlot) === 'slot-empty'">&nbsp;</template>
                  <template v-else>/</template>
                </button>
              </div>
              <span class="stat-level">{{ instance.artificingLevels[slotIdx] ?? 0 }}/3</span>
            </div>
            <div v-else class="stat-locked">{{ t('armory.common.requireLevel70') }}</div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="footer">
        <button v-if="isGold" class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--square ea-btn--hover-gold-fill" @click="maxOut">{{ t('common.max') }}</button>
        <button class="ea-btn ea-btn--sm ea-btn--glass-rect" @click="emit('update:visible', false)">{{ t('common.close') }}</button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.layout { display: flex; flex-direction: column; gap: 20px; }
.header { display: flex; gap: 20px; align-items: flex-start; }
.portrait-frame { width: 100px; min-width: 100px; height: 100px; border: 2px solid #555; overflow: hidden; background: #1a1a1e; display: flex; align-items: center; justify-content: center; }
.portrait { width: 80%; height: 80%; object-fit: contain; }
.header-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.name { font-size: 20px; font-weight: 700; color: #f0f0f0; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag { display: inline-flex; align-items: center; padding: 2px 10px; font-size: 11px; border: 1px solid #555; color: #bbb; background: rgba(255,255,255,0.04); }
.row { display: flex; align-items: center; gap: 8px; }
.section-label { font-size: 11px; color: #888; letter-spacing: 1px; text-transform: uppercase; }
.value { font-size: 16px; font-weight: 700; color: #f0f0f0; }
.section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 16px; }
.section-title { font-size: 11px; font-weight: 700; color: #888; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px; }
.stat-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.stat-row:last-child { border-bottom: none; }
.stat-info { flex: 1; min-width: 0; }
.stat-name { font-size: 13px; font-weight: 600; color: #e0e0e0; }
.stat-value-inline { font-weight: 400; color: #aaa; margin-left: 6px; }
.stat-bar-area { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.stat-slots { display: flex; gap: 3px; }
.art-slot { font-family: 'Roboto Mono', monospace; }
.art-slot:not(.is-active) { color: transparent; }
.stat-level { font-size: 13px; font-weight: 700; color: #ccc; min-width: 24px; text-align: right; font-family: 'Roboto Mono', monospace; }
.stat-locked { color: #777; font-size: 12px; }
.footer { display: flex; justify-content: flex-end; gap: 8px; width: 100%; }
</style>
