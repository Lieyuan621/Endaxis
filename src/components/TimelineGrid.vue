<script setup>
import { ref, provide, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { refThrottled } from '@vueuse/core'
import { useTimelineStore } from '../stores/timelineStore.js'
import ActionItem from './ActionItem.vue'
import ActionConnector from './ActionConnector.vue'
import ConnectionPreview from './ConnectionPreview.vue'
import GaugeOverlay from './GaugeOverlay.vue'
import TimelineBuffLayer from './TimelineBuffLayer.vue'
import ContextMenu from './ContextMenu.vue'
import StatDetailDialog from './StatDetailDialog.vue'
import HitDamageDetailDialog from './HitDamageDetailDialog.vue'
import CustomNumberInput from './CustomNumberInput.vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useDragConnection } from '@/composables/useDragConnection.js'
import { useI18n } from 'vue-i18n'
import { snapMs } from '@/utils/precision.js'
import { frameToTime, snapTimeToFrame, timeToFrame } from '@/utils/time.js'
import { toLegacyDisplayType } from '@/utils/hitModel.js'
import { getGearPiece, getEnemy, getOperator } from '@/data'
import {
  getGameElementName,
  getGameAttributeName,
  getGameSlotTypeName,
  getGameWeaponTypeName,
  getGearPieceGameName,
  getGearSetGameName,
  getOperatorGameName,
  getWeaponGameName,
} from '@/data/gameText'

const store = useTimelineStore()
const connectionHandler = useDragConnection()
const { t, locale } = useI18n()

// ===================================================================================
// 初始化与常量
// ===================================================================================

const TIME_BLOCK_WIDTH = computed(() => store.timeBlockWidth)
provide('TIME_BLOCK_WIDTH', TIME_BLOCK_WIDTH)

// Refs
const tracksContentRef = ref(null)
const timeRulerWrapperRef = ref(null)
const tracksHeaderRef = ref(null)
const trackLaneRefs = ref([])

// Render State
const svgRenderKey = ref(0)
const scrollbarHeight = ref(0)
const isCursorVisible = ref(false)
const hitDetailHit = ref(null)
const showHitDetail = computed(() => hitDetailHit.value !== null)
const hitDetailBreakdown = computed(() => hitDetailHit.value?._damageBreakdown ?? null)

function openHitDetail(hitData) {
  hitDetailHit.value = hitData
}

function closeHitDetail() {
  hitDetailHit.value = null
}

// Drag State
const isMouseDown = ref(false)
const isDragStarted = ref(false)
const movingActionId = ref(null)
const movingTrackId = ref(null)
const initialMouseX = ref(0)
const initialMouseY = ref(0)
const dragThreshold = 5
const wasSelectedOnPress = ref(false)
const wasCycleSelectedOnPress = ref(false)
const wasSwitchSelectedOnPress = ref(false)
const dragStartTimes = new Map()
const isAltDown = ref(false)
const isShiftDown = ref(false)
const hoveredContext = ref(null)
const draggingCycleBoundaryId = ref(null)
const draggingSwitchEventId = ref(null)
const switchEventDragOffsetX = ref(0)
const cycleBoundaryDragOffsetX = ref(0)
const dragStartMouseTime = ref(0)

// === 边缘自动滚动相关状态 ===
const autoScrollSpeed = ref(0)
let autoScrollRaf = null
let lastMouseX = 0
let lastMouseY = 0
const SCROLL_ZONE = 50
const MAX_SCROLL_SPEED = 15

const TRACK_HEIGHT = 50
const TRACK_ROW_BASE_PADDING = 30
const TRACK_ROW_MIN_PADDING = 8
const TRACK_ROW_BASE_HEIGHT = TRACK_HEIGHT + TRACK_ROW_BASE_PADDING * 2
const TRACK_ROW_MIN_HEIGHT = TRACK_HEIGHT + TRACK_ROW_MIN_PADDING * 2
const OPERATOR_BUFF_ROW_HEIGHT = 24
const EQUIPMENT_BUFF_LANE_PITCH = 22
const BUFF_LAYER_MARGIN = 4
const TRACKS_VERTICAL_PADDING = 20
const TRACK_LAYOUT_KEY = 'endaxis:timeline-track-row-heights:v1'
let resizeObserver = []
let trackResizeState = null

// Box Select State
const isBoxSelecting = ref(false)
const boxStart = ref({ x: 0, y: 0 })
const boxRect = ref({ left: 0, top: 0, width: 0, height: 0 })

const draggingTrackOrderIndex = ref(null)
const reorderDropTargetIndex = ref(null)
const isResizingPrep = ref(false)
const prepDurationPreview = ref(null)

function onReorderDragStart(evt, index) {
  draggingTrackOrderIndex.value = index
  evt.dataTransfer.effectAllowed = 'move'
  
  const trackInfoEl = evt.target.closest('.track-info')
  if (trackInfoEl) {
    const rect = trackInfoEl.getBoundingClientRect()
    const offsetX = evt.clientX - rect.left
    const offsetY = evt.clientY - rect.top
    evt.dataTransfer.setDragImage(trackInfoEl, offsetX, offsetY)
  }
}

function onReorderDragOver(evt, index) {
  if (draggingTrackOrderIndex.value === null) return
  evt.preventDefault() // Allow drop
  evt.dataTransfer.dropEffect = 'move'
  reorderDropTargetIndex.value = index
}

function onReorderDrop(evt, targetIndex) {
  evt.preventDefault()
  if (draggingTrackOrderIndex.value !== null && draggingTrackOrderIndex.value !== targetIndex) {
    store.moveTrack(draggingTrackOrderIndex.value, targetIndex)
  }
  resetReorderState()
}

function onReorderDragEnd() {
  resetReorderState()
}

function resetReorderState() {
  draggingTrackOrderIndex.value = null
  reorderDropTargetIndex.value = null
}

function moveTrackUp(index) {
  if (index > 0) store.moveTrack(index, index - 1)
}

function moveTrackDown(index) {
  if (index < store.tracks.length - 1) store.moveTrack(index, index + 1)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function normalizeTrackWeights(weights, count = store.tracks.length) {
  const safeCount = Math.max(0, Number(count) || 0)
  return Array.from({ length: safeCount }, (_, index) => {
    const raw = Array.isArray(weights) ? weights[index] : null
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  })
}

const trackHeightWeights = ref([])
const tracksViewportHeight = ref(0)
const draggingTrackResizeIndex = ref(null)
const trackRowHeightPreview = ref(null)

function restoreTrackLayoutWeights() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(TRACK_LAYOUT_KEY)
    if (!raw) return
    trackHeightWeights.value = normalizeTrackWeights(JSON.parse(raw))
  } catch {
    trackHeightWeights.value = normalizeTrackWeights([])
  }
}

function persistTrackLayoutWeights() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TRACK_LAYOUT_KEY, JSON.stringify(trackHeightWeights.value))
  } catch {
    // ignore
  }
}

watch(() => store.tracks.length, (count) => {
  trackHeightWeights.value = normalizeTrackWeights(trackHeightWeights.value, count)
}, { immediate: true })

const trackRowHeights = computed(() => {
  const count = store.tracks.length
  if (!count) return []

  const weights = normalizeTrackWeights(trackHeightWeights.value, count)
  const totalHeight = Math.max(
    (tracksViewportHeight.value || 0) - TRACKS_VERTICAL_PADDING * 2,
    count * TRACK_ROW_MIN_HEIGHT
  )
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || count
  const heights = new Array(count).fill(TRACK_ROW_MIN_HEIGHT)
  let remaining = totalHeight

  for (let index = 0; index < count; index += 1) {
    if (index === count - 1) {
      heights[index] = remaining
      break
    }

    const portion = Math.round(totalHeight * (weights[index] / totalWeight))
    const applied = clamp(portion, TRACK_ROW_MIN_HEIGHT, remaining - ((count - index - 1) * TRACK_ROW_MIN_HEIGHT))
    heights[index] = applied
    remaining -= applied
  }

  return heights
})

const displayTrackRowHeights = computed(() => {
  const preview = trackRowHeightPreview.value
  if (Array.isArray(preview) && preview.length === store.tracks.length) return preview
  return trackRowHeights.value
})

const trackDividerOffsets = computed(() => {
  const offsets = []
  let cumulative = TRACKS_VERTICAL_PADDING

  for (let index = 0; index < displayTrackRowHeights.value.length - 1; index += 1) {
    cumulative += displayTrackRowHeights.value[index]
    offsets.push(cumulative)
  }

  return offsets
})

function getTrackRowStyle(index) {
  const requestedRowHeight = displayTrackRowHeights.value[index] ?? TRACK_ROW_BASE_HEIGHT
  const basePadding = Math.max(TRACK_ROW_MIN_PADDING, (requestedRowHeight - TRACK_HEIGHT) / 2)
  const { topPadding, bottomPadding, rowHeight } = getTrackBuffAdjustedRowMetrics(index, basePadding, requestedRowHeight)
  return {
    '--track-height': `${TRACK_HEIGHT}px`,
    '--track-row-height': `${rowHeight}px`,
    '--track-row-padding-top': `${topPadding}px`,
    '--track-row-padding-bottom': `${bottomPadding}px`,
  }
}

function getTrackInfoStyle(index) {
  const requestedRowHeight = displayTrackRowHeights.value[index] ?? TRACK_ROW_BASE_HEIGHT
  const basePadding = Math.max(TRACK_ROW_MIN_PADDING, (requestedRowHeight - TRACK_HEIGHT) / 2)
  const { topPadding, bottomPadding, rowHeight } = getTrackBuffAdjustedRowMetrics(index, basePadding, requestedRowHeight)
  return {
    '--track-height': `${TRACK_HEIGHT}px`,
    '--track-row-height': `${rowHeight}px`,
    '--track-row-padding-top': `${topPadding}px`,
    '--track-row-padding-bottom': `${bottomPadding}px`,
  }
}

function getTrackBuffAdjustedRowMetrics(index, basePadding, requestedRowHeight) {
  return {
    topPadding: basePadding,
    bottomPadding: basePadding,
    rowHeight: requestedRowHeight,
  }
}

function beginTrackResize(index, event) {
  if (event.button !== 0) return
  event.preventDefault()
  const rowHeights = trackRowHeights.value
  if (!rowHeights[index] || !rowHeights[index + 1]) return

  draggingTrackResizeIndex.value = index
  trackRowHeightPreview.value = [...rowHeights]
  trackResizeState = {
    index,
    startY: event.clientY,
    rowHeights: [...rowHeights],
  }
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'ns-resize'
  window.addEventListener('pointermove', onTrackResizeMove)
  window.addEventListener('pointerup', endTrackResize)
}

function onTrackResizeMove(event) {
  if (!trackResizeState) return

  const { index, startY, rowHeights } = trackResizeState
  const dy = event.clientY - startY
  const nextHeights = [...rowHeights]
  const pairTotal = rowHeights[index] + rowHeights[index + 1]
  const upper = clamp(rowHeights[index] + dy, TRACK_ROW_MIN_HEIGHT, pairTotal - TRACK_ROW_MIN_HEIGHT)
  nextHeights[index] = upper
  nextHeights[index + 1] = pairTotal - upper
  trackRowHeightPreview.value = nextHeights
}

function endTrackResize() {
  const preview = Array.isArray(trackRowHeightPreview.value) ? trackRowHeightPreview.value : null
  if (preview && preview.length === store.tracks.length) {
    trackHeightWeights.value = normalizeTrackWeights(preview, preview.length)
  }
  trackResizeState = null
  trackRowHeightPreview.value = null
  draggingTrackResizeIndex.value = null
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  window.removeEventListener('pointermove', onTrackResizeMove)
  window.removeEventListener('pointerup', endTrackResize)
  persistTrackLayoutWeights()
}

function resetTrackLayoutWeights() {
  trackRowHeightPreview.value = null
  trackHeightWeights.value = normalizeTrackWeights([])
  persistTrackLayoutWeights()
}


// ===================================================================================
// 干员选择弹窗逻辑
// ===================================================================================

const isSelectorVisible = ref(false)
const targetTrackIndex = ref(null)
const searchQuery = ref('')
const filterElement = ref('ALL')
const isWeaponSelectorVisible = ref(false)
const weaponTargetIndex = ref(null)
const weaponSearchQuery = ref('')
const isEquipmentSelectorVisible = ref(false)
const equipmentTargetIndex = ref(null)
const equipmentSlotKey = ref('armor') // 'armor' | 'gloves' | 'accessory1' | 'accessory2'
const equipmentSearchQuery = ref('')
const equipmentCategoryFilter = ref('ALL')
const equipmentAffixFilter = ref('ALL')
const equipmentLevelFilter = ref('ALL')
const equipmentPendingRefineTier = ref(0)
const statDetailTrackIndex = ref(null)

const isStatDetailVisible = computed({
  get: () => statDetailTrackIndex.value !== null,
  set: (visible) => {
    if (!visible) statDetailTrackIndex.value = null
  },
})

const statDetailTrack = computed(() => (
  statDetailTrackIndex.value !== null ? store.tracks[statDetailTrackIndex.value] || null : null
))

const statDetailTrackInfo = computed(() => (
  statDetailTrackIndex.value !== null ? store.teamTracksInfo[statDetailTrackIndex.value] || null : null
))

function openStatDetail(index) {
  const track = store.tracks[index]
  if (!track?.id || !track.operatorStatus) return
  statDetailTrackIndex.value = index
}

const EQUIPMENT_LEVELS = [70, 50, 36, 28, 20, 10]
const EQUIPMENT_LEVEL_COLORS = {
  70: '#ffd700',
  50: '#b37feb',
  36: '#4a90e2',
  28: '#73c94f',
  20: '#95de64',
  10: '#888888',
}
const EQUIPMENT_AFFIX_FILTER_GROUPS = [
  {
    key: 'elementDamage',
    items: [
      { value: 'arts_dmg', accent: '#ef4444' },
      { value: 'cryo_electric_dmg_bonus', accent: '#ef4444' },
      { value: 'heat_nature_dmg_bonus', accent: '#ef4444' },
      { value: 'physical_dmg', accent: '#ef4444' },
    ],
  },
  {
    key: 'skillDamage',
    items: [
      { value: 'all_skill_dmg_bonus', accent: '#ef4444' },
      { value: 'attack_dmg_bonus', accent: '#fde68a' },
      { value: 'skill_dmg_bonus', accent: '#93c5fd' },
      { value: 'link_dmg_bonus', accent: '#facc15' },
      { value: 'ultimate_dmg_bonus', accent: '#38bdf8' },
    ],
  },
  {
    key: 'brokenDamage',
    items: [
      { value: 'broken_dmg_bonus', accent: '#fb7185' },
    ],
  },
  {
    key: 'ability',
    items: [
      { value: 'primary_ability', accent: '#a3e635' },
      { value: 'secondary_ability', accent: '#84cc16' },
    ],
  },
  {
    key: 'attack',
    items: [
      { value: 'attack', accent: '#991b1b' },
    ],
  },
  {
    key: 'crit',
    items: [
      { value: 'crit_rate', accent: '#f43f5e' },
    ],
  },
  {
    key: 'artsPower',
    items: [
      { value: 'originium_arts_power', accent: '#a78bfa' },
    ],
  },
  {
    key: 'ultimateCharge',
    items: [
      { value: 'ult_charge_eff', accent: '#38bdf8' },
    ],
  },
  {
    key: 'survival',
    items: [
      { value: 'hp', accent: '#4ade80' },
      { value: 'final_dmg_reduction', accent: '#4ade80' },
      { value: 'healing_effect', accent: '#4ade80' },
    ],
  },
]
const EQUIPMENT_REFINE_TIERS = [0, 1, 2, 3]

const EQUIPMENT_PRIMARY_STAT_ICON_MAP = {
  primary_ability: '/icons/icon_battle_primary_attribute_all_up.webp',
  secondary_ability: '/icons/icon_battle_primary_attribute_all_up.webp',
  strength: '/icons/icon_attribute_str.webp',
  agility: '/icons/icon_attribute_agi.webp',
  intellect: '/icons/icon_attribute_wisd.webp',
  will: '/icons/icon_attribute_will.webp',
}

const EQUIPMENT_BONUS_STAT_ICON_MAP = {
  primary_ability: '/icons/icon_battle_primary_attribute_all_up.webp',
  secondary_ability: '/icons/icon_battle_primary_attribute_all_up.webp',
  strength: '/icons/icon_attribute_str.webp',
  agility: '/icons/icon_attribute_agi.webp',
  intellect: '/icons/icon_attribute_wisd.webp',
  will: '/icons/icon_attribute_will.webp',
  attack: '/icons/icon_battle_buff_atk_up.webp',
  hp: '/icons/icon_attribute_maxHp.webp',
  crit_rate: '/icons/icon_attribute_criticalRate.webp',
  crit_dmg: '/icons/icon_attribute_criticalDamageIncrease.webp',
  blaze_dmg: '/icons/icon_battle_fire_dmg_up.webp',
  emag_dmg: '/icons/icon_battle_pulse_dmg_up.webp',
  cold_dmg: '/icons/icon_battle_cryst_dmg_up.webp',
  nature_dmg: '/icons/icon_battle_natural_dmg_up.webp',
  physical_dmg: '/icons/icon_physical_damage_increase.webp',
  arts_dmg: '/icons/icon_battle_spell_up.webp',
  attack_dmg_bonus: '/icons/icon_normal_atk_efficiency.webp',
  skill_dmg_bonus: '/icons/icon_normal_skill_efficiency.webp',
  link_dmg_bonus: '/icons/icon_comboskill_cooldown_scalar.webp',
  ultimate_dmg_bonus: '/icons/icon_ultimate_skill_efficiency.webp',
  all_skill_dmg_bonus: '/icons/icon_battle_affix_enhance.webp',
  broken_dmg_bonus: '/icons/icon_attr_damage_to_broken_unit_increase.webp',
  healing_effect: '/icons/icon_heal_output_increase.webp',
  final_dmg_reduction: '/icons/icon_battle_affix_shelter.webp',
  originium_arts_power: '/icons/icon_originium_arts.webp',
  ult_charge_eff: '/icons/icon_ultimate_sp_gain_scalar.webp',
  link_cd_reduction: '/icons/icon_comboskill_cooldown_scalar.webp',
  susceptibility: '/icons/icon_battle_affix_vulnerable.webp',
  susceptibility_physical: '/icons/icon_battle_affix_physical_vulnerable.webp',
  susceptibility_heat: '/icons/icon_battle_affix_fire_vulnerable.webp',
  susceptibility_cryo: '/icons/icon_battle_affix_cryst_vulnerable.webp',
  susceptibility_electric: '/icons/icon_battle_affix_pulse_vulnerable.webp',
  susceptibility_nature: '/icons/icon_battle_affix_natural_vulnerable.webp',
}

function getEquipmentAffixIconSrc(modifierId) {
  return EQUIPMENT_PRIMARY_STAT_ICON_MAP[modifierId]
    || EQUIPMENT_BONUS_STAT_ICON_MAP[modifierId]
    || '/icons/default_icon.webp'
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
}

function normalizeEquipmentStatArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? [value] : []
}

function normalizeEquipmentAttributeId(attribute) {
  if (attribute === 'main') return 'primary_ability'
  if (attribute === 'sub') return 'secondary_ability'
  if (['strength', 'agility', 'intellect', 'will'].includes(attribute)) return attribute
  return ''
}

function isEquipmentAttributeStat(stat) {
  return stat?.modifier === 'attributeFlat' || stat?.modifier === 'attributePercent'
}

function getEquipmentDialogOperator(track) {
  if (!track?.id) return null
  return getOperator(track.id) || null
}

const CORE_ATTRIBUTES = new Set(['strength', 'agility', 'intellect', 'will'])

function getEquipmentAbilityMatch(eq, operator) {
  const piece = getGearPiece(eq?.canonicalId || eq?.canonicalGearPieceId || eq?.id)

  if (!piece || !operator) {
    return {
      matched: false,
      primaryMatched: false,
      secondaryMatched: false,
      attributeLineCount: 0,
      unmatchedAttributeLineCount: 0,
      type: '',
    }
  }

  const mainAttribute =
      operator?.mainAttribute
      || operator?.primaryAbility
      || operator?.primaryAttribute
      || ''

  const subAttribute =
      operator?.subAttribute
      || operator?.secondaryAbility
      || operator?.secondaryAttribute
      || ''

  let primaryMatched = false
  let secondaryMatched = false
  let attributeLineCount = 0
  let unmatchedAttributeLineCount = 0

  const skills = [piece.skill1, piece.skill2, piece.skill3].filter(Boolean)

  for (const skill of skills) {
    const effects = Array.isArray(skill?.effects) ? skill.effects : []

    const visibleEffects = mergeEquipmentElementPairEffects(effects)
        .filter(effect => effect?.kind === 'status')

    for (const effect of visibleEffects) {
      const stat = effect?.stat
      if (!isEquipmentAttributeStat(stat)) continue

      const attrs = normalizeEquipmentStatArray(stat.attribute)
          .filter(attr => CORE_ATTRIBUTES.has(attr))

      if (attrs.length === 0) continue

      attributeLineCount += 1

      const matchedPrimary = Boolean(mainAttribute && attrs.includes(mainAttribute))
      const matchedSecondary = Boolean(subAttribute && attrs.includes(subAttribute))

      if (matchedPrimary) primaryMatched = true
      if (matchedSecondary) secondaryMatched = true

      if (!matchedPrimary && !matchedSecondary) {
        unmatchedAttributeLineCount += 1
      }
    }
  }

  const allAttributeLinesMatched =
      attributeLineCount > 0
      && unmatchedAttributeLineCount === 0

  const strongMatch =
      allAttributeLinesMatched
      && (
          (primaryMatched && secondaryMatched)
          || (attributeLineCount === 1 && primaryMatched)
      )

  return {
    matched: strongMatch,
    primaryMatched,
    secondaryMatched,
    attributeLineCount,
    unmatchedAttributeLineCount,
    type: strongMatch ? 'both' : '',
  }
}

function sameEquipmentValue(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

function getEquipmentElementPairId(elements) {
  const set = new Set(elements)
  if (set.size !== 2) return ''
  if (set.has('heat') && set.has('nature')) return 'heat_nature_dmg_bonus'
  if (set.has('cryo') && set.has('electric')) return 'cryo_electric_dmg_bonus'
  return ''
}

function isEquipmentArtsDmgElements(elements) {
  const set = new Set(normalizeEquipmentStatArray(elements))
  return (
      set.size === 4
      && set.has('heat')
      && set.has('cryo')
      && set.has('electric')
      && set.has('nature')
  )
}

function isEquipmentPairModifierId(modifierId) {
  return modifierId === 'heat_nature_dmg_bonus' || modifierId === 'cryo_electric_dmg_bonus'
}

function mergeEquipmentElementPairEffects(effects) {
  const out = []
  const used = new Set()
  effects.forEach((effect, index) => {
    if (used.has(index)) return
    const stat = effect?.stat
    const element = typeof stat?.elements === 'string' ? stat.elements : ''
    if (stat?.modifier !== 'dmgBonus' || !element) {
      out.push(effect)
      return
    }

    const pairIndex = effects.findIndex((candidate, candidateIndex) => {
      if (candidateIndex <= index || used.has(candidateIndex)) return false
      const candidateStat = candidate?.stat
      if (candidateStat?.modifier !== 'dmgBonus') return false
      const candidateElement = typeof candidateStat?.elements === 'string' ? candidateStat.elements : ''
      if (!candidateElement) return false
      if (!sameEquipmentValue(effect.value, candidate.value)) return false
      return !!getEquipmentElementPairId([element, candidateElement])
    })

    if (pairIndex < 0) {
      out.push(effect)
      return
    }

    used.add(index)
    used.add(pairIndex)
    out.push({
      ...effect,
      stat: {
        ...stat,
        elements: [element, effects[pairIndex].stat.elements],
      },
    })
  })
  return out
}

function getEquipmentDmgBonusModifierIds(stat) {
  const elements = normalizeEquipmentStatArray(stat?.elements)
  if (elements.length > 0) {
    if (isEquipmentArtsDmgElements(elements)) {
      return ['arts_dmg']
    }
    const pairId = getEquipmentElementPairId(elements)
    if (pairId) return [pairId]
    const mapped = elements.map((element) => ({
      physical: 'physical_dmg',
      heat: 'blaze_dmg',
      cryo: 'cold_dmg',
      electric: 'emag_dmg',
      nature: 'nature_dmg',
    })[element]).filter(Boolean)
    return mapped.length > 0 ? mapped : ['all_skill_dmg_bonus']
  }

  const skillTypes = normalizeEquipmentStatArray(stat?.skillTypes)
  if (skillTypes.length > 0) {
    if (skillTypes.length === 1) {
      return [{
        basicAttack: 'attack_dmg_bonus',
        battleSkill: 'skill_dmg_bonus',
        comboSkill: 'link_dmg_bonus',
        ultimate: 'ultimate_dmg_bonus',
      }[skillTypes[0]] || 'all_skill_dmg_bonus']
    }
    if (
        skillTypes.includes('battleSkill')
        && skillTypes.includes('comboSkill')
        && skillTypes.includes('ultimate')
    ) {
      return ['all_skill_dmg_bonus']
    }
  }

  return ['all_skill_dmg_bonus']
}

function getEquipmentEffectModifierIds(stat) {
  if (!stat?.modifier) return []
  if (stat.modifier === 'attributeFlat' || stat.modifier === 'attributePercent') {
    return normalizeEquipmentStatArray(stat.attribute)
      .map(normalizeEquipmentAttributeId)
      .filter(Boolean)
  }
  if (stat.modifier === 'atkFlat' || stat.modifier === 'atkPercent') return ['attack']
  if (stat.modifier === 'flatHp' || stat.modifier === 'hpPercent') return ['hp']
  if (stat.modifier === 'critRate') return ['crit_rate']
  if (stat.modifier === 'critDmg') return ['crit_dmg']
  if (stat.modifier === 'artsIntensity') return ['originium_arts_power']
  if (stat.modifier === 'ultimateGainEfficiency') return ['ult_charge_eff']
  if (stat.modifier === 'heal') return ['healing_effect']
  if (stat.modifier === 'protection') return ['final_dmg_reduction']
  if (stat.modifier === 'dmgBonus') return getEquipmentDmgBonusModifierIds(stat)
  if (stat.modifier === 'susceptibility') {
    const elements = normalizeEquipmentStatArray(stat.elements)
    return elements.length > 0
      ? elements.map(element => `susceptibility_${element}`)
      : ['susceptibility']
  }
  return [stat.modifier]
}

function trOrFallback(key, fallback) {
  const out = t(key)
  return out === key ? fallback : out
}

function getEquipmentModifierLabel(modifierId) {
  return trOrFallback(
      `timelineGrid.equipmentDialog.affixFilters.${modifierId}`,
      trOrFallback(`stats.${modifierId}`, modifierId)
  )
}

function getEquipmentEffectLabel(stat, modifierId) {
  if (!stat?.modifier) return getEquipmentModifierLabel(modifierId)
  if (stat.modifier === 'attributeFlat' || stat.modifier === 'attributePercent') {
    const attr = normalizeEquipmentStatArray(stat.attribute)[0]
    const normalizedAttr = normalizeEquipmentAttributeId(attr)
    if (normalizedAttr === 'primary_ability' || normalizedAttr === 'secondary_ability') {
      return getEquipmentModifierLabel(normalizedAttr)
    }
    if (attr) return getGameAttributeName(attr, locale.value)
  }
  if (stat.modifier === 'dmgBonus') {
    return getEquipmentModifierLabel(modifierId)
  }

  if (stat.modifier === 'susceptibility') {
    const elements = normalizeEquipmentStatArray(stat.elements)
    if (elements.length === 1) {
      return trOrFallback(
          `game.stat.susceptibility:${elements[0]}`,
          trOrFallback('game.stat.susceptibility', '脆弱')
      )
    }
    return trOrFallback('game.stat.susceptibility', '脆弱')
  }

  if (stat.modifier === 'artsIntensity') return getEquipmentModifierLabel('originium_arts_power')
  if (stat.modifier === 'ultimateGainEfficiency') return getEquipmentModifierLabel('ult_charge_eff')
  if (stat.modifier === 'heal') return getEquipmentModifierLabel('healing_effect')
  if (stat.modifier === 'protection') return getEquipmentModifierLabel('final_dmg_reduction')
  return getEquipmentModifierLabel(modifierId)
}

function equipmentValueNeedsPercent(stat) {
  return [
    'attributePercent',
    'atkPercent',
    'hpPercent',
    'critRate',
    'critDmg',
    'dmgBonus',
    'ultimateGainEfficiency',
    'susceptibility',
    'heal',
    'protection',
  ].includes(stat?.modifier)
}

function formatEquipmentNumber(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value ?? '')
  if (Math.abs(num - Math.round(num)) < 0.0001) return String(Math.round(num))
  return num.toFixed(1).replace(/\.0$/, '')
}

function formatEquipmentEffectValue(effect) {
  const rawValues = Array.isArray(effect?.value) ? effect.value : [effect?.value]
  const values = rawValues.filter(v => v !== undefined && v !== null)
  if (values.length === 0) return ''
  const suffix = equipmentValueNeedsPercent(effect?.stat) ? '%' : ''
  return values.map(value => `+${formatEquipmentNumber(value)}${suffix}`).join(' / ')
}

function getEquipmentPieceAffixRows(eq) {
  const piece = getGearPiece(eq?.canonicalId || eq?.canonicalGearPieceId || eq?.id)
  if (!piece) return []
  return [piece.skill1, piece.skill2, piece.skill3]
    .filter(Boolean)
    .flatMap((skill, slotIndex) => {
      const effects = Array.isArray(skill?.effects) ? skill.effects : []
      return mergeEquipmentElementPairEffects(effects)
        .filter(effect => effect?.kind === 'status')
        .flatMap((effect, effectIndex) => getEquipmentEffectModifierIds(effect.stat).map((modifierId) => {
          const label = getEquipmentEffectLabel(effect.stat, modifierId)
          const valueText = formatEquipmentEffectValue(effect)
          return {
            key: `${eq?.id || 'eq'}-${slotIndex}-${effectIndex}-${modifierId}`,
            modifierId,
            label,
            valueText,
            src: isEquipmentPairModifierId(modifierId) ? '' : getEquipmentAffixIconSrc(modifierId),
            marker: isEquipmentPairModifierId(modifierId) ? 'hollow-dot' : 'image',
            title: valueText ? `${label} ${valueText}` : label,
          }
        }))
    })
}

function getEquipmentAffixRows(eq) {
  return getEquipmentPieceAffixRows(eq)
}

function getEquipmentPrimaryAffixIconStack(eq) {
  return getEquipmentAffixRows(eq)
}

const isGameTimeCollapsed = ref(true)
const showGameTime = computed(() => !isGameTimeCollapsed.value || store.isCapturing)
const gridRowHeight = computed(() => showGameTime.value ? '60px' : '48px')

const ELEMENT_FILTERS = computed(() => {
  locale.value
  return [
    { label: t('timelineGrid.elementFilter.all'), value: 'ALL', color: '#888' },
    { label: getGameElementName('physical', locale.value), value: 'physical', color: '#e0e0e0' },
    { label: getGameElementName('heat', locale.value), value: 'heat', color: '#ff4d4f' },
    { label: getGameElementName('cryo', locale.value), value: 'cryo', color: '#00e5ff' },
    { label: getGameElementName('electric', locale.value), value: 'electric', color: '#ffd700' },
    { label: getGameElementName('nature', locale.value), value: 'nature', color: '#52c41a' }
  ]
})

const OPERATOR_ELEMENT_ICON_MAP = {
  physical: '/icons/icon_element_physical.webp',
  heat: '/icons/icon_element_heat.webp',
  cryo: '/icons/icon_element_cryo.webp',
  electric: '/icons/icon_element_electric.webp',
  nature: '/icons/icon_element_nature.webp',
}

function getOperatorElementIcon(element) {
  return OPERATOR_ELEMENT_ICON_MAP[element] || OPERATOR_ELEMENT_ICON_MAP.physical
}

function getOperatorElementBadgeColor(element) {
  if (element === 'physical') return '#8c8c8c'
  return store.getColor(element)
}

function openCharacterSelector(index) {
  store.selectTrack(index)
  targetTrackIndex.value = index
  searchQuery.value = ''
  filterElement.value = 'ALL'
  isSelectorVisible.value = true
}

function confirmCharacterSelection(charId) {
  if (targetTrackIndex.value !== null) {
    const oldId = store.tracks[targetTrackIndex.value].id
    store.changeTrackOperator(targetTrackIndex.value, oldId, charId)
  }
  isSelectorVisible.value = false
}

function removeOperator() {
  if (targetTrackIndex.value !== null) {
    store.clearTrack(targetTrackIndex.value)
  }
  isSelectorVisible.value = false
}

function openWeaponSelector(index) {
  if (!store.tracks[index] || !store.tracks[index].id) return
  store.selectTrack(index)
  weaponTargetIndex.value = index
  weaponSearchQuery.value = ''
  isWeaponSelectorVisible.value = true
}

function confirmWeaponSelection(weaponId) {
  if (weaponTargetIndex.value !== null) {
    const track = store.tracks[weaponTargetIndex.value]
    if (track && track.id) {
      store.updateTrackWeapon(track.id, weaponId)
    }
  }
  isWeaponSelectorVisible.value = false
}

function removeWeapon() {
  if (weaponTargetIndex.value !== null) {
    const track = store.tracks[weaponTargetIndex.value]
    if (track && track.id) {
      store.updateTrackWeapon(track.id, null)
    }
  }
  isWeaponSelectorVisible.value = false
}

function openEquipmentSelector(index, slotKey) {
  if (!store.tracks[index] || !store.tracks[index].id) return
  store.selectTrack(index)
  equipmentTargetIndex.value = index
  equipmentSlotKey.value = slotKey
  equipmentSearchQuery.value = ''
  equipmentCategoryFilter.value = 'ALL'
  equipmentAffixFilter.value = 'ALL'
  equipmentLevelFilter.value = 'ALL'
  equipmentPendingRefineTier.value = getEquipmentTierForTrack(store.tracks[index], slotKey)
  isEquipmentSelectorVisible.value = true
}

function confirmEquipmentSelection(equipmentId) {
  if (equipmentTargetIndex.value !== null) {
    const track = store.tracks[equipmentTargetIndex.value]
    if (track && track.id) {
      store.updateTrackEquipment(track.id, equipmentSlotKey.value, equipmentId)
      if (equipmentId) {
        store.updateTrackEquipmentTier(
            track.id,
            equipmentSlotKey.value,
            equipmentPendingRefineTier.value,
        )
      }
    }
  }
  isEquipmentSelectorVisible.value = false
}

function removeEquipment() {
  if (equipmentTargetIndex.value !== null) {
    const track = store.tracks[equipmentTargetIndex.value]
    if (track && track.id) {
      store.updateTrackEquipment(track.id, equipmentSlotKey.value, null)
    }
  }
  equipmentPendingRefineTier.value = 0
  isEquipmentSelectorVisible.value = false
}

const operatorSelectorItems = computed(() => {
  locale.value
  return (store.characterRoster || []).map((char) => ({
    id: char.id,
    canonicalId: char.id,
    name: getOperatorGameName(char.id || char.slug, locale.value),
    avatar: char.avatar,
    rarity: Number(char.rarity) || 0,
    element: char.element || 'physical',
    elementName: getGameElementName(char.element, locale.value),
    weapon: char.weapon || '',
    weaponName: getGameWeaponTypeName(char.weapon, locale.value),
    searchTerms: [
      getOperatorGameName(char.id || char.slug, locale.value),
      char.id,
      char.slug,
      getGameElementName(char.element, locale.value),
      getGameWeaponTypeName(char.weapon, locale.value),
    ].map(normalizeSearchText).filter(Boolean),
    raw: char,
  }))
})

function getOperatorAvatarById(operatorId) {
  return operatorSelectorItems.value.find(item => item.id === operatorId)?.avatar || ''
}

const filteredListFlat = computed(() => {
  let list = operatorSelectorItems.value
  if (filterElement.value !== 'ALL') {
    list = list.filter(c => c.element === filterElement.value)
  }
  if (searchQuery.value) {
    const q = normalizeSearchText(searchQuery.value)
    list = list.filter(c => c.searchTerms.some(term => term.includes(q)))
  }
  return [...list].sort((a, b) => (b.rarity || 0) - (a.rarity || 0))
})

const rosterByRarity = computed(() => {
  const groups = {}
  filteredListFlat.value.forEach(char => {
    const r = char.rarity || 1
    if (!groups[r]) groups[r] = []
    groups[r].push(char)
  })
  const levels = Object.keys(groups).map(Number).sort((a, b) => b - a)
  return levels.map(level => ({ level: level, list: groups[level] }))
})

function getRarityBaseColor(rarity) {
  if (rarity === 6) return '#FFD700'
  if (rarity === 5) return '#ffc400'
  if (rarity === 4) return '#d8b4fe'
  return '#a0a0a0'
}

const weaponSelectorItems = computed(() => {
  locale.value
  return (store.weaponDatabase || []).map((weapon) => ({
    id: weapon.id,
    canonicalId: weapon.canonicalSlug || weapon.id,
    name: getWeaponGameName(weapon.canonicalSlug || weapon.id, locale.value),
    icon: weapon.icon || '/weapons/default.webp',
    rarity: Number(weapon.rarity) || 0,
    type: weapon.type || '',
    typeName: getGameWeaponTypeName(weapon.type, locale.value),
    searchTerms: [
      getWeaponGameName(weapon.canonicalSlug || weapon.id, locale.value),
      weapon.id,
      weapon.canonicalSlug,
      getGameWeaponTypeName(weapon.type, locale.value),
    ].map(normalizeSearchText).filter(Boolean),
    raw: weapon,
  }))
})

const weaponCandidates = computed(() => {
  if (weaponTargetIndex.value === null) return []
  const track = store.tracks[weaponTargetIndex.value]
  if (!track || !track.id) return []
  const char = operatorSelectorItems.value.find(c => c.id === track.id)
  const requiredType = char?.weapon
  let list = weaponSelectorItems.value
  if (requiredType) list = list.filter(w => w.type === requiredType)
  if (weaponSearchQuery.value) {
    const q = normalizeSearchText(weaponSearchQuery.value)
    list = list.filter(w => w.searchTerms.some(term => term.includes(q)))
  }
  return [...list].sort((a, b) => (b.rarity || 0) - (a.rarity || 0))
})

const weaponRosterByRarity = computed(() => {
  const groups = {}
  weaponCandidates.value.forEach(weapon => {
    const rarity = getWeaponRarity(weapon)
    if (!groups[rarity]) groups[rarity] = []
    groups[rarity].push(weapon)
  })
  const levels = Object.keys(groups).map(Number).sort((a, b) => b - a)
  return levels.map(level => ({ level, list: groups[level] }))
})

const currentWeaponForDialog = computed(() => {
  if (weaponTargetIndex.value === null) return null
  return getWeaponForTrack(store.tracks[weaponTargetIndex.value])
})

function getWeaponForTrack(track) {
  if (!track || !track.weaponId) return null
  return store.getWeaponById(track.weaponId)
}

function getWeaponRarity(weapon) {
  return Math.max(3, weapon?.rarity || 3)
}

function isWeaponEquipped(weaponId) {
  if (weaponTargetIndex.value === null) return false
  const track = store.tracks[weaponTargetIndex.value]
  return !!track && track.weaponId === weaponId
}

function getEquipmentForTrack(track, slotKey) {
  if (!track) return null
  let eqId = null
  if (slotKey === 'armor') eqId = track.equipArmorId
  else if (slotKey === 'gloves') eqId = track.equipGlovesId
  else if (slotKey === 'accessory1') eqId = track.equipAccessory1Id
  else if (slotKey === 'accessory2') eqId = track.equipAccessory2Id
  return store.getEquipmentById(eqId)
}

function getEquipmentTierForTrack(track, slotKey) {
  if (!track) return 0
  if (slotKey === 'armor') return Number(track.equipArmorRefineTier) || 0
  if (slotKey === 'gloves') return Number(track.equipGlovesRefineTier) || 0
  if (slotKey === 'accessory1') return Number(track.equipAccessory1RefineTier) || 0
  if (slotKey === 'accessory2') return Number(track.equipAccessory2RefineTier) || 0
  return 0
}

function getInitialGaugeMax(track) {
  if (!track?.id) return 0
  return Math.max(0, Number(store.getTrackGaugeMax(track.id)) || 0)
}

function getInitialGaugeValue(track) {
  const max = getInitialGaugeMax(track)
  const value = Math.max(0, Number(track?.initialGauge) || 0)
  return max > 0 ? Math.min(value, max) : value
}

function updateInitialGauge(track, value) {
  if (!track?.id) return
  store.updateTrackInitialGauge(track.id, value)
}

const equipmentSlotType = computed(() => {
  if (equipmentSlotKey.value === 'accessory1' || equipmentSlotKey.value === 'accessory2') return 'accessory'
  return equipmentSlotKey.value
})

const equipmentSlotLabel = computed(() => {
  locale.value
  if (equipmentSlotKey.value === 'armor') return t('timelineGrid.equipmentSlot.armor')
  if (equipmentSlotKey.value === 'gloves') return t('timelineGrid.equipmentSlot.gloves')
  if (equipmentSlotKey.value === 'accessory1') return t('timelineGrid.equipmentSlot.accessory1')
  if (equipmentSlotKey.value === 'accessory2') return t('timelineGrid.equipmentSlot.accessory2')
  return t('timelineGrid.equipmentSlot.equipment')
})

const equipmentSelectorItems = computed(() => {
  locale.value
  return (store.equipmentDatabase || []).map((eq) => ({
    id: eq.id,
    canonicalId: eq.canonicalGearPieceId || eq.id,
    name: getGearPieceGameName(eq.canonicalGearPieceId || eq.id, locale.value),
    icon: eq.icon || '/icons/default_icon.webp',
    level: Number(eq.level) || 0,
    slot: eq.slot || '',
    slotName: getGameSlotTypeName(eq.slot, locale.value),
    category: eq.category || '',
    categoryName: eq.category ? getGearSetGameName(eq.category, locale.value) : '',
    affixes: eq.affixes,
    searchTerms: [
      getGearPieceGameName(eq.canonicalGearPieceId || eq.id, locale.value),
      eq.id,
      eq.canonicalGearPieceId,
      eq.category,
      eq.category ? getGearSetGameName(eq.category, locale.value) : '',
      getGameSlotTypeName(eq.slot, locale.value),
    ].map(normalizeSearchText).filter(Boolean),
    raw: eq,
  }))
})

const equipmentCandidates = computed(() => {
  if (equipmentTargetIndex.value === null) return []
  const track = store.tracks[equipmentTargetIndex.value]
  if (!track || !track.id) return []

  const operator = getEquipmentDialogOperator(track)

  let list = equipmentSelectorItems.value
  list = list.filter(e => e.slot === equipmentSlotType.value)

  if (equipmentCategoryFilter.value !== 'ALL') {
    if (equipmentCategoryFilter.value === '__UNCAT__') {
      const known = new Set(store.equipmentCategories || [])
      list = list.filter(e => !e.category || !known.has(e.category))
    } else {
      list = list.filter(e => e.category === equipmentCategoryFilter.value)
    }
  }

  if (equipmentAffixFilter.value !== 'ALL') {
    list = list.filter(e => equipmentMatchesAffixFilter(e, equipmentAffixFilter.value))
  }

  if (equipmentLevelFilter.value !== 'ALL') {
    const targetLv = Number(equipmentLevelFilter.value)
    list = list.filter(e => Number(e.level) === targetLv)
  }

  if (equipmentSearchQuery.value) {
    const q = normalizeSearchText(equipmentSearchQuery.value)
    list = list.filter(e => e.searchTerms.some(term => term.includes(q)))
  }

  return [...list]
    .map(eq => ({
      ...eq,
      abilityMatch: getEquipmentAbilityMatch(eq, operator),
    }))
    .sort((a, b) => {
      const lvDiff = (Number(b.level) || 0) - (Number(a.level) || 0)
      if (lvDiff !== 0) return lvDiff
      return (a.name || '').localeCompare(b.name || '')
    })
})

const equipmentRosterByLevel = computed(() => {
  const groups = {}
  equipmentCandidates.value.forEach(eq => {
    const level = Number(eq.level) || 0
    if (!groups[level]) groups[level] = []
    groups[level].push(eq)
  })
  const levels = Object.keys(groups).map(Number).sort((a, b) => b - a)
  return levels.map(level => ({ level, list: groups[level] }))
})

const currentEquipmentForDialog = computed(() => {
  if (equipmentTargetIndex.value === null) return null
  return getEquipmentForTrack(store.tracks[equipmentTargetIndex.value], equipmentSlotKey.value)
})

const currentEquipmentTierForDialog = computed(() => {
  return equipmentPendingRefineTier.value
})

function setCurrentEquipmentTierForDialog(tier) {
  const nextTier = Math.max(0, Math.min(3, Number(tier) || 0))
  equipmentPendingRefineTier.value = nextTier
  if (equipmentTargetIndex.value === null) return
  const track = store.tracks[equipmentTargetIndex.value]
  if (!track?.id) return
  if (!currentEquipmentForDialog.value) return

  store.updateTrackEquipmentTier(track.id, equipmentSlotKey.value, nextTier)
}
function getEquipmentLevelColor(level) {
  const key = Number(level)
  return EQUIPMENT_LEVEL_COLORS[key] || '#888'
}

function isEquipmentEquipped(equipmentId) {
  if (equipmentTargetIndex.value === null) return false
  const track = store.tracks[equipmentTargetIndex.value]
  const current = getEquipmentForTrack(track, equipmentSlotKey.value)
  return !!current && (current.id === equipmentId || current.canonicalGearPieceId === equipmentId)
}

// ===================================================================================
// 核心逻辑：操作轴计算
// ===================================================================================

const PERFECT_LINK_STATUS_IDS = new Set([
  'rossi-combo-perfect-timing-satisfied',
])

function isPerfectLinkAction(action) {
  if (!action || toLegacyDisplayType(action.type) !== 'link') return false
  const id = action.instanceId
  if (!id) return false
  return (store.operatorLog || []).some((entry) => (
    entry?.type === 'OPERATOR_EFFECT_APPLY' &&
    entry?.actionId === id &&
    PERFECT_LINK_STATUS_IDS.has(entry?.id)
  ))
}

const operationMarkers = computed(() => {
  let rawMarkers = []

  store.tracks.forEach((track, index) => {
    if (!track.id) return
    const keyNum = index + 1

    track.actions.forEach(action => {
      if ((action.triggerWindow || 0) < 0) return

      const displayType = toLegacyDisplayType(action.type)
      let label = '', isHold = false, customClass = ''
      if (displayType === 'skill') {
        label = `${keyNum}`; customClass = 'op-skill'
      } else if (displayType === 'link') {
        label = 'E'; customClass = 'op-link'
      } else if (displayType === 'ultimate') {
        label = `${keyNum} (Hold)`; isHold = true; customClass = 'op-ultimate'
      } else return

      rawMarkers.push({
        id: `op-${action.instanceId}`,
        left: store.timeToPx(action.startTime || 0),
        width: isHold ? null : 24,
        right: store.timeToPx(action.startTime || 0) + (isHold ? (store.timeToPx((action.startTime || 0) + (action.duration || 0)) - store.timeToPx(action.startTime || 0)) : 24),
        label, isHold, customClass,
        perfectLink: isPerfectLinkAction(action),
        top: 0, height: 14, fontSize: 9
      })
    })

    const mySwitchEvents = (store.switchEvents || []).filter(sw => sw.characterId === track.id)

    mySwitchEvents.forEach(sw => {
      rawMarkers.push({
        id: `op-sw-${sw.id}`,
        left: store.timeToPx(sw.time),
        width: 24,
        right: store.timeToPx(sw.time) + 24,
        label: `F${keyNum}`,
        isHold: false,
        customClass: 'op-switch',
        top: 0, height: 14, fontSize: 9
      })
    })
  })

  rawMarkers.sort((a, b) => a.left - b.left)
  const finalMarkers = []
  let cluster = []
  let clusterMaxRight = -1
  const processCluster = (group) => {
    if (group.length === 0) return
    const levels = []
    group.forEach(m => {
      let placed = false
      for (let i = 0; i < levels.length; i++) {
        if (levels[i] + 1 <= m.left) { m.rowIndex = i; levels[i] = m.right; placed = true; break }
      }
      if (!placed) { m.rowIndex = levels.length; levels.push(m.right) }
    })
    const depth = levels.length
    let h, step, fs
    if (depth <= 2) { h = 14; step = 16; fs = 9; }
    else if (depth === 3) { h = 12; step = 13; fs = 9; }
    else { h = 10; step = 10; fs = 8; }
    group.forEach(m => { m.height = h; m.top = m.rowIndex * step; m.fontSize = fs; finalMarkers.push(m) })
  }
  rawMarkers.forEach(m => {
    if (cluster.length === 0) { cluster.push(m); clusterMaxRight = m.right } else {
      if (m.left < clusterMaxRight) { cluster.push(m); clusterMaxRight = Math.max(clusterMaxRight, m.right) } else { processCluster(cluster); cluster = [m]; clusterMaxRight = m.right }
    }
  })
  processCluster(cluster)
  return finalMarkers
})

// ===================================================================================
// 辅助计算属性 & 事件处理
// ===================================================================================

const equipmentAffixFilterGroups = computed(() => {
  locale.value
  return EQUIPMENT_AFFIX_FILTER_GROUPS.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      label: getEquipmentAffixFilterLabel(item.value),
    })),
  }))
})

function getEquipmentAffixFilterLabel(filterId) {
  return trOrFallback(
      `timelineGrid.equipmentDialog.affixFilters.${filterId}`,
      getEquipmentModifierLabel(filterId)
  )
}

function getEquipmentAffixModifierIds(eq) {
  return getEquipmentAffixRows(eq)
      .map(row => row.modifierId)
      .filter(Boolean)
}

function equipmentMatchesAffixFilter(eq, filterId) {
  if (!filterId || filterId === 'ALL') return true
  return getEquipmentAffixModifierIds(eq).includes(filterId)
}

const totalWidthComputed = computed(() => {
  return store.totalTimelineWidthPx
})

const activePrepDuration = computed(() => (
  prepDurationPreview.value !== null ? prepDurationPreview.value : store.prepDuration
))

const prepZoneWidthPxRounded = computed(() => {
  const dur = Number(activePrepDuration.value) || 0
  if (dur <= 0) return 0
  if (store.prepExpanded) return Math.round(dur * store.timeBlockWidth)
  return Math.round(store.prepZoneWidthPx)
})

const transformStyle = computed(() => {
  return {
    transform: `translateX(${-store.timelineShift}px)`,
    willChange: 'transform'
  }
})

const getTrackLaneStyle = computed(() => {
  const w = TIME_BLOCK_WIDTH.value
  const totalWidth = totalWidthComputed.value

  return {
    width: `${totalWidth}px`,
    backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 0)`,
    backgroundSize: `${w}px 100%`,
    backgroundRepeat: 'repeat-x',
    imageRendering: 'auto'
  }
})

function getViewWindow({ bufferPx = 0 } = {}) {
  const totalPx = store.totalTimelineWidthPx;
  const totalSeconds = store.viewDuration;

  if (!tracksContentRef.value || store.isCapturing) {
    return {
      startPx: 0,
      endPx: totalPx,
      startTime: 0,
      endTime: totalSeconds
    }
  }

  const timelineWidth = store.timelineRect.width;
  const scrollLeft = store.timelineShift;

  const startPx = Math.max(scrollLeft - bufferPx, 0);
  const endPx = Math.min(scrollLeft + timelineWidth + bufferPx, totalPx);

  return {
    startPx,
    endPx,
    startTime: store.pxToTime(startPx),
    endTime: store.pxToTime(endPx)
  }
}

const rawDynamicTicks = computed(() => {
  const width = TIME_BLOCK_WIDTH.value;
  const viewWindow = getViewWindow({ bufferPx: 100 });

  const prep = activePrepDuration.value || 0
  const realStartVT = viewWindow.startTime;
  const realEndVT = viewWindow.endTime;

  const btStart = realStartVT - prep
  const btEnd = realEndVT - prep

  const gameStartVT = store.toGameTime(realStartVT);
  const gameStartBT = gameStartVT - prep

  let subDivision = 1;
  if (width >= 800) subDivision = 60;
  else if (width >= 200) subDivision = 10;
  else if (width >= 100) subDivision = 2;

  const minBtForTicks = (!store.prepExpanded && prep > 0) ? 0 : Math.min(btStart, gameStartBT)
  const startStep = Math.floor(minBtForTicks * subDivision);
  const endStep = Math.ceil(btEnd * subDivision);

  const realTicks = [];
  const gameTicks = [];

  for (let i = startStep; i <= endStep; i++) {
    const bt = i / subDivision;
    let type = '';
    let label = '';
    const isIntegerSecond = (i % subDivision === 0);

    if (isIntegerSecond) {
      const secondValue = Math.round(bt);
      const isFiveSec = secondValue % 5 === 0;
      const showAllLabels = width >= 100;

      if (showAllLabels || isFiveSec) {
        type = 'major';
        label = `${secondValue}s`;
      } else {
        type = 'major-dim';
      }

    } else {
      if (subDivision === 2) {
        type = 'tenth';
      } else if (subDivision === 10) {
        type = 'tenth';
        if (width >= 500) label = `.${Math.round((bt % 1) * 10)}`;
      } else if (subDivision === 60) {
        const frameIdx = i % 60;
        if (frameIdx % 10 === 0 && frameIdx !== 0) {
          type = 'tenth';
          if (width >= 600) label = `${frameIdx}f`;
        } else if (frameIdx % 2 === 0) {
          type = 'frame';
        } else {
          if (width < 1000) continue;
          type = 'frame';
        }
      } else {
        continue;
      }
    }

    const realVT = bt + prep
    if (!store.prepExpanded && prep > 0 && bt < -0.0001) {
      continue
    }
    const realX = store.timeToPx(realVT)

    realTicks.push({
      time: bt,
      type,
      label,
      x: realX
    });

    const gameVT = bt + prep
    const mappedRealVT = store.toRealTime(gameVT);

    // 游戏时间相对现实时间有偏移，所以再检查一次窗口边界
    if (mappedRealVT >= realStartVT && mappedRealVT <= realEndVT) {
      gameTicks.push({
        time: bt,
        type,
        label,
        x: store.timeToPx(mappedRealVT)
      });
    }
  }

  return { realTicks, gameTicks };
});

const dynamicTicks = refThrottled(rawDynamicTicks, 100);

function forceSvgUpdate() { svgRenderKey.value++ }

function updateScrollbarHeight() {
  if (tracksContentRef.value) {
    const el = tracksContentRef.value
    const height = el.offsetHeight - el.clientHeight
    scrollbarHeight.value = height > 0 ? height : 0
  }
}

function calculateTimeFromClient(clientX, clientY, offsetX = 0, fixedStep = null) {
  const mouseXInTrack = store.toTimelineSpace(clientX - offsetX, clientY).x

  const rawTime = store.pxToTime(mouseXInTrack)

  const step = fixedStep !== null ? fixedStep : store.snapStep

  const inverse = 1 / step
  let startTime = Math.round(rawTime * inverse) / inverse
  if (startTime < 0) startTime = 0

  return snapTimeToFrame(startTime)
}

function calculateTimeFromEvent(evt, fixedStep = null) {
  return calculateTimeFromClient(evt.clientX, evt.clientY, 0, fixedStep)
}

function onPrepResizeMouseDown(evt) {
  if (!store.prepExpanded) return
  if (store.prepDuration <= 0) return
  evt.stopPropagation()
  evt.preventDefault()
  isResizingPrep.value = true
  prepDurationPreview.value = Number(store.prepDuration) || 0
  document.body.classList.add('is-dragging')
  document.body.style.cursor = 'ew-resize'
  window.addEventListener('mousemove', onPrepResizeMouseMove)
  window.addEventListener('mouseup', onPrepResizeMouseUp)
}

function onPrepResizeMouseMove(evt) {
  if (!isResizingPrep.value) return
  const newDuration = calculateTimeFromEvent(evt, store.snapStep)
  prepDurationPreview.value = newDuration
}

function onPrepResizeMouseUp() {
  if (!isResizingPrep.value) return
  const finalDuration = prepDurationPreview.value
  isResizingPrep.value = false
  prepDurationPreview.value = null
  document.body.classList.remove('is-dragging')
  document.body.style.cursor = ''
  window.removeEventListener('mousemove', onPrepResizeMouseMove)
  window.removeEventListener('mouseup', onPrepResizeMouseUp)
  if (finalDuration !== null) {
    store.setPrepDuration(finalDuration)
  }
}

const isPrepDurationEditorOpen = ref(false)
const prepDurationDraft = ref('')
const prepDurationInputRef = ref(null)

function openPrepDurationEditor() {
  prepDurationDraft.value = String(timeToFrame(activePrepDuration.value))
  isPrepDurationEditorOpen.value = true
  nextTick(() => prepDurationInputRef.value?.focus?.())
}

function closePrepDurationEditor() {
  isPrepDurationEditorOpen.value = false
}

function applyPrepDurationDraft() {
  const frames = Number(prepDurationDraft.value)
  if (!Number.isFinite(frames)) return
  store.setPrepDuration(frameToTime(frames))
  closePrepDurationEditor()
}

const fakeScrollbarRef = ref(null)

let ticking = false
function onFakeScroll(e) {
  if (ticking) return
  ticking = true
  store.setTimelineShift(e.target.scrollLeft)
  requestAnimationFrame(() => {
    ticking = false
  })
}

watch(() => store.timelineShift, (val) => {
  if (fakeScrollbarRef.value) {
    fakeScrollbarRef.value.scrollLeft = val
  }
})

watch(() => store.timelineScrollTop, (val) => {
  if (tracksHeaderRef.value) {
    tracksHeaderRef.value.scrollTop = val
  }
  if (tracksContentRef.value && Math.abs(tracksContentRef.value.scrollTop - val) > 1) {
    tracksContentRef.value.scrollTop = val
  }
})

function syncVerticalScroll() {
  if (tracksContentRef.value) {
    const top = tracksContentRef.value.scrollTop
    store.setScrollTop(top)
  }
}


function onActionContextMenu(evt, action) {
  if (!store.multiSelectedIds.has(action.instanceId)) {
    store.selectAction(action.instanceId)
  }
  store.openContextMenu(evt, action.instanceId)
}
// ===================================================================================
// 鼠标与拖拽逻辑
// ===================================================================================

const cachedSpData = computed(() => store.spSeries || [])
const currentSpValue = computed(() => {
  const time = store.cursorCurrentTime
  const points = cachedSpData.value
  if (!points || points.length === 0) {
    const val = Number(store.systemConstants.initialSp)
    return isNaN(val) ? 200 : val
  }
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]; const p2 = points[i+1]
    if (time >= p1.time && time < p2.time) {
      const progress = (time - p1.time) / (p2.time - p1.time)
      const val = p1.sp + (p2.sp - p1.sp) * progress
      return Math.floor(val)
    }
  }
  return Math.floor(points[points.length - 1].sp)
})

const cachedStaggerData = computed(() => store.staggerSeries?.points || [])
const currentStaggerValue = computed(() => {
  const time = store.cursorCurrentTime
  const points = cachedStaggerData.value
  if (!points || points.length === 0) return 0
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i+1]
    if (time >= p1.time && time < p2.time) {
      return Math.floor(p1.val)
    }
  }
  return Math.floor(points[points.length - 1].val)
})
const currentEnemyMaxHp = computed(() => {
  return Number(store.systemConstants.enemyHp ?? 0) || 0
})

const currentEnemyDamageTaken = computed(() => {
  const time = store.cursorCurrentTime

  return (store.simLog || [])
      .filter(entry => entry.type === 'DAMAGE_HIT' && Number(entry.time) <= time)
      .reduce((sum, entry) => {
        const hitData = entry.payload?.hitData
        const damage = Number(store.getHitDisplayDamage?.(hitData) ?? hitData?._expectedDamage ?? 0) || 0
        return sum + damage
      }, 0)
})

const currentEnemyHp = computed(() => {
  const maxHp = currentEnemyMaxHp.value
  if (!maxHp) return 0
  return Math.max(0, Math.floor(maxHp - currentEnemyDamageTaken.value))
})

const currentEnemyHpText = computed(() => {
  const maxHp = currentEnemyMaxHp.value
  if (!maxHp) return ''
  return `${currentEnemyHp.value.toLocaleString()} / ${maxHp.toLocaleString()}`
})

function getStepPointAtTime(points, time) {
  if (!points || points.length === 0) return null

  let lo = 0
  let hi = points.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if ((Number(points[mid].time) || 0) <= time) lo = mid + 1
    else hi = mid - 1
  }

  return points[Math.max(0, hi)] || null
}

function toMutedRgba(color, alpha = 0.78) {
  const c = String(color || '').trim()
  if (!c) return `rgba(255,255,255,${alpha})`

  if (c.startsWith('#')) {
    const hex = c.slice(1)
    const expanded = (hex.length === 3)
      ? hex.split('').map(ch => ch + ch).join('')
      : hex

    if (expanded.length === 6) {
      const r = parseInt(expanded.slice(0, 2), 16)
      const g = parseInt(expanded.slice(2, 4), 16)
      const b = parseInt(expanded.slice(4, 6), 16)
      if ([r, g, b].every(Number.isFinite)) return `rgba(${r},${g},${b},${alpha})`
    }
  }

  return c
}

const cursorGaugeRows = computed(() => {
  const time = snapTimeToFrame(store.cursorCurrentTime)
  const rows = []

  for (const track of store.teamTracksInfo) {
    if (!track?.id) continue

    const points = store.gaugeSeriesByTrackId.get(track.id) || []
    const point = getStepPointAtTime(points, time)
    const val = snapMs(point?.val ?? 0)

    const max = store.getTrackGaugeMax(track.id)
    const baseColor = store.getCharacterElementColor(track.id)
    const isFull = max > 0 && val >= max - 1e-9
    const colorMuted = toMutedRgba(baseColor, 0.78)
    const colorFull = toMutedRgba(baseColor, 1)

    rows.push({
      id: track.id,
      name: track.name,
      isFull,
      color: isFull ? colorFull : colorMuted,
      colorMuted,
      colorFull,
      val,
      max,
    })
  }

  return rows
})

function onGridMouseMove(evt) {
  store.setCursorPosition(evt.clientX, evt.clientY)
  isCursorVisible.value = true
}
function onGridMouseLeave() { isCursorVisible.value = false }

function onContentMouseDown(evt) {
  if (store.isBoxSelectMode) {
    evt.stopPropagation(); evt.preventDefault()
    isBoxSelecting.value = true
    boxStart.value = store.toTimelineSpace(evt.clientX, evt.clientY)
    boxRect.value = { left: boxStart.value.x, top: boxStart.value.y, width: 0, height: 0 }
    window.addEventListener('mousemove', onBoxMouseMove)
    window.addEventListener('mouseup', onBoxMouseUp)
    return
  }
  onBackgroundClick(evt)
}

function onCycleLineMouseDown(evt, boundaryId) {
  evt.stopPropagation()
  evt.preventDefault()
  if (evt.button !== 0) return

  wasCycleSelectedOnPress.value = (store.selectedCycleBoundaryId === boundaryId)

  if (!wasCycleSelectedOnPress.value) {
    store.selectCycleBoundary(boundaryId)
  }

  const boundary = store.cycleBoundaries.find((item) => item.id === boundaryId)
  const mousePos = store.toTimelineSpace(evt.clientX, evt.clientY)
  cycleBoundaryDragOffsetX.value = mousePos.x - store.timeToPx(Number(boundary?.time) || 0)
  draggingCycleBoundaryId.value = boundaryId
  initialMouseX.value = evt.clientX
  initialMouseY.value = evt.clientY
  isDragStarted.value = false
  isMouseDown.value = true
  document.body.classList.add('is-dragging')

  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
  window.addEventListener('blur', onWindowMouseUp)
}

function onBoxMouseMove(evt) {
  if (!isBoxSelecting.value) return
  const current = store.toTimelineSpace(evt.clientX, evt.clientY)
  const left = Math.min(boxStart.value.x, current.x)
  const top = Math.min(boxStart.value.y, current.y)
  boxRect.value = {
    left, top,
    width: Math.abs(current.x - boxStart.value.x),
    height: Math.abs(current.y - boxStart.value.y)
  }
}

function onBoxMouseUp() {
  isBoxSelecting.value = false
  window.removeEventListener('mousemove', onBoxMouseMove)
  window.removeEventListener('mouseup', onBoxMouseUp)
  const box = boxRect.value
  const selection = {
    left: box.width > 0 ? box.left : box.left + box.width,
    top: box.height > 0 ? box.top : box.top + box.height,
    right: box.width > 0 ? box.left + box.width : box.left,
    bottom: box.height > 0 ? box.top + box.height : box.top
  }
  if (selection.left > selection.right) [selection.left, selection.right] = [selection.right, selection.left]
  if (selection.top > selection.bottom) [selection.top, selection.bottom] = [selection.bottom, selection.top]
  const foundIds = []
  store.tracks.forEach((track, trackIndex) => {
    const trackEl = document.getElementById(`track-row-${trackIndex}`)
    if (!trackEl) return
    const trackRect = trackEl.getBoundingClientRect()
    const containerRect = store.timelineRect
    const trackRelativeTop = (trackRect.top - containerRect.top) + store.timelineScrollTop
    const trackRelativeBottom = trackRelativeTop + trackRect.height
    if (trackRelativeBottom < selection.top || trackRelativeTop > selection.bottom) return
    track.actions.forEach(action => {
      const rect = store.nodeRects[action.instanceId]?.rect
      const startPixel = rect ? rect.left : store.timeToPx(action.startTime)
      const endPixel = rect ? rect.right : store.timeToPx(store.getShiftedEndTime(action.startTime, action.duration, action.instanceId))
      if (startPixel < selection.right && endPixel > selection.left) foundIds.push(action.instanceId)
    })
  })
  if (foundIds.length > 0) { store.setMultiSelection(foundIds); ElMessage.success(t('timelineGrid.selection.selectedCount', { count: foundIds.length })) }
  else { store.clearSelection() }
  boxRect.value = { left: 0, top: 0, width: 0, height: 0 }
}

// ===================================================================================
// 缩放逻辑
// ===================================================================================

const zoomValue = computed({
  get: () => store.timeBlockWidth,
  set: (val) => store.setBaseBlockWidth(val)
})

function adjustZoom(delta, anchorTime = null) {
  const oldWidth = store.timeBlockWidth

  if (anchorTime === null) {
    const viewportCenterX = store.timelineShift + store.timelineRect.width / 2
    anchorTime = store.pxToTime(viewportCenterX)
  }

  const anchorOffsetInViewport = store.timeToPx(anchorTime) - store.timelineShift

  const newVal = oldWidth + delta
  store.setBaseBlockWidth(newVal)

  const newWidth = store.timeBlockWidth

  const newScrollLeft = store.timeToPx(anchorTime) - anchorOffsetInViewport

  nextTick(() => {
    store.setTimelineShift(newScrollLeft)
  })
}
function handleWheel(e) {
  if (e.ctrlKey) {
    e.preventDefault()

    const timeAtMouse = store.cursorCurrentTime

    const zoomSpeed = 0.15
    const direction = e.deltaY < 0 ? 1 : -1
    const delta = Math.round(store.timeBlockWidth * zoomSpeed * direction)

    adjustZoom(delta, timeAtMouse)
  }
}

function handleTrackWheel(e) {
  if (ticking) return

  ticking = true
  requestAnimationFrame(() => {
    ticking = false
  })

  if (e.ctrlKey) {
    handleWheel(e); return
  }

  if (Math.abs(e.deltaX) > 0 || e.shiftKey) {
    e.preventDefault()
    let delta = e.deltaX
    if (e.shiftKey && delta === 0) delta = e.deltaY

    const newLeft = store.timelineShift + delta
    store.setTimelineShift(newLeft)
  }
}

// ===================================================================================
// 对齐辅助线逻辑
// ===================================================================================

const alignGuide = ref({
  visible: false,
  x: 0,
  top: 0,
  height: 0,
  label: '',
  type: '', // 'snap' | 'align'
  color: '',
  targetRect: null
})

function updateAlignGuide(evt, action) {
  hoveredContext.value = { action, clientX: evt.clientX }

  if (!isAltDown.value || !store.selectedActionId || store.selectedActionId === action.instanceId) {
    alignGuide.value.visible = false
    return
  }

  const actionLayout = store.getNodeRect(action.instanceId)
  if (!actionLayout) return

  const rect = actionLayout.rect
  const relLeft = rect.left
  const relTop = rect.top

  const clickX = store.toTimelineSpace(evt.clientX, evt.clientY).x - rect.left
  const isClickLeft = clickX < (rect.width / 2)
  const isShift = isShiftDown.value

  let guideX = 0
  let label = ''
  let type = ''
  let color = ''
  let iconKey = ''

  if (!isShift) {
    // 磁吸模式 (Snap)
    type = 'snap'
    color = '#00e5ff'
    if (isClickLeft) {
      guideX = relLeft
      label = t('timelineGrid.alignGuide.snapFront')
      iconKey = 'snap-left'
    } else {
      guideX = relLeft + rect.width
      label = t('timelineGrid.alignGuide.snapBack')
      iconKey = 'snap-right'
    }
  } else {
    // 对齐模式 (Align)
    type = 'align'
    color = '#ff00ff'
    if (isClickLeft) {
      guideX = relLeft
      label = t('timelineGrid.alignGuide.alignLeft')
      iconKey = 'align-left'
    } else {
      guideX = relLeft + rect.width
      label = t('timelineGrid.alignGuide.alignRight')
      iconKey = 'align-right'
    }
  }

  alignGuide.value = {
    visible: true,
    x: guideX,
    top: relTop,
    height: rect.height,
    label,
    iconKey,
    type,
    color,
    targetRect: { left: relLeft, top: relTop, width: rect.width, height: rect.height }
  }
}

function hideAlignGuide() {
  alignGuide.value.visible = false
  hoveredContext.value = null
}

function recalcAlignGuide() {
  if (hoveredContext.value) {
    const { action, clientX } = hoveredContext.value
    updateAlignGuide({ clientX }, action)
  }
}

function onBackgroundContextMenu(evt) {
  evt.preventDefault()

  if (isBoxSelecting.value || isDragStarted.value) return

  const cursorPos = store.toTimelineSpace(evt.clientX, evt.clientY)
  const rawTime = store.pxToTime(cursorPos.x)

  const snap = store.snapStep
  let clickTime = Math.round(rawTime / snap) * snap
  clickTime = snapTimeToFrame(Math.max(0, clickTime))
  store.openContextMenu(evt, null, clickTime)
}

function onActionMouseDown(evt, track, action) {
  evt.stopPropagation()
  if (action.isLocked) {
    if (evt.button === 0) {
      store.selectAction(action.instanceId)
      ElMessage.warning({ message: t('timelineGrid.action.locked'), duration: 1000, grouping: true })
      return
    }
  }

  const actionLayout = store.getNodeRect(action.instanceId)
  if (!actionLayout) return

  const mousePos = store.toTimelineSpace(evt.clientX, evt.clientY)

  if (isAltDown.value) {
    if (store.selectedActionId && store.selectedActionId !== action.instanceId) {
      const rect = actionLayout.rect
      const clickX = mousePos.x - rect.left
      const isClickLeft = clickX < (rect.width / 2)
      const isShift = isShiftDown.value

      let alignMode = ''
      let msg = ''

      if (!isShift) {
        if (isClickLeft) { alignMode = 'RL'; msg = t('timelineGrid.alignResult.snappedFront') }
        else { alignMode = 'LR'; msg = t('timelineGrid.alignResult.snappedBack') }
      } else {
        if (isClickLeft) { alignMode = 'LL'; msg = t('timelineGrid.alignResult.alignedLeft') }
        else { alignMode = 'RR'; msg = t('timelineGrid.alignResult.alignedRight') }
      }

      const success = store.alignActionToTarget(action.instanceId, alignMode)
      if (success) {
        ElMessage.success(msg)
        hideAlignGuide()
      } else {
        ElMessage.warning(t('timelineGrid.alignResult.unchanged'))
      }
    }
    return
  }

  if (connectionHandler.isDragging.value) return
  if (evt.button !== 0) return

  const offset = mousePos.x - actionLayout.rect.left

  setTimeout(() => {
    wasSelectedOnPress.value = store.multiSelectedIds.has(action.instanceId)

    if (!store.multiSelectedIds.has(action.instanceId)) {
      store.selectAction(action.instanceId)
    }

    isMouseDown.value = true
    isDragStarted.value = false
    movingActionId.value = action.instanceId
    movingTrackId.value = track.id
    initialMouseY.value = evt.clientY

    dragStartTimes.clear()
    store.tracks.forEach(t => {
      t.actions.forEach(a => {
        if (a.logicalStartTime === undefined) a.logicalStartTime = a.startTime
        dragStartTimes.set(a.instanceId, a.logicalStartTime)
      })
    })

    initialMouseX.value = evt.clientX
    dragStartMouseTime.value = store.pxToTime(mousePos.x)

    window.addEventListener('mousemove', onWindowMouseMove)
    window.addEventListener('mouseup', onWindowMouseUp)
    window.addEventListener('blur', onWindowMouseUp)
  }, 0)
}

function updateDragPosition(clientX) {
  if (!isDragStarted.value || !movingActionId.value) return;

  const timelineX = store.toTimelineSpace(clientX, initialMouseY.value).x
  const mouseTime = store.pxToTime(timelineX)
  const deltaTime = mouseTime - dragStartMouseTime.value

  const selectedIds = store.multiSelectedIds
  const snap = store.snapStep
  const minStartTime = getMinSkillStartTime()

  const dragTargets = []

  store.tracks.forEach(t => {
    t.actions.forEach(a => {
      if (selectedIds.has(a.instanceId) && !a.isLocked) {
        const orgLogical = dragStartTimes.get(a.instanceId)
        if (!Number.isFinite(Number(orgLogical))) return

        dragTargets.push({
          action: a,
          targetTime: Number(orgLogical) + deltaTime,
        })
      }
    })
  })

  if (dragTargets.length === 0) return

  const earliestTargetTime = Math.min(...dragTargets.map(item => item.targetTime))
  const groupOffset = earliestTargetTime < minStartTime
      ? minStartTime - earliestTargetTime
      : 0

  dragTargets.forEach(({ action, targetTime }) => {
    const shiftedTargetTime = targetTime + groupOffset
    const snappedTime = Math.round(shiftedTargetTime / snap) * snap

    action.logicalStartTime = Math.max(
        minStartTime,
        snapTimeToFrame(snappedTime),
    )
  })

  store.refreshAllActionShifts()

  nextTick(() => svgRenderKey.value++)
}

function updateSwitchMarkerPosition(clientX, clientY) {
  let newTime = calculateTimeFromClient(clientX, clientY, switchEventDragOffsetX.value, store.snapStep)
  if (newTime > store.viewDuration) newTime = store.viewDuration
  if (newTime < 0) newTime = 0
  newTime = snapTimeToFrame(newTime)
  store.updateSwitchEvent(draggingSwitchEventId.value, newTime)
}

function updateCycleBoundaryPosition(clientX, clientY) {
  let newTime = calculateTimeFromClient(clientX, clientY, cycleBoundaryDragOffsetX.value, store.snapStep)
  if (newTime > store.viewDuration) newTime = store.viewDuration
  if (newTime < 0) newTime = 0
  newTime = snapTimeToFrame(newTime)
  store.updateCycleBoundary(draggingCycleBoundaryId.value, newTime)
}

function updateDragAutoScroll(clientX) {
  if (!tracksContentRef.value) return
  const rect = store.timelineRect
  if (clientX < rect.left + SCROLL_ZONE) {
    const ratio = 1 - (Math.max(0, clientX - rect.left) / SCROLL_ZONE)
    autoScrollSpeed.value = -Math.max(2, ratio * MAX_SCROLL_SPEED)
  }
  else if (clientX > rect.right - SCROLL_ZONE) {
    const ratio = 1 - (Math.max(0, rect.right - clientX) / SCROLL_ZONE)
    autoScrollSpeed.value = Math.max(2, ratio * MAX_SCROLL_SPEED)
  }
  else {
    autoScrollSpeed.value = 0
  }
  if (autoScrollSpeed.value !== 0 && !autoScrollRaf) {
    performAutoScroll()
  }
}

function performAutoScroll() {
  if (autoScrollSpeed.value === 0) {
    cancelAnimationFrame(autoScrollRaf)
    autoScrollRaf = null
    return
  }
  const newShift = store.timelineShift + autoScrollSpeed.value
  store.setTimelineShift(newShift)
  if (draggingSwitchEventId.value) updateSwitchMarkerPosition(lastMouseX, lastMouseY)
  else if (draggingCycleBoundaryId.value) updateCycleBoundaryPosition(lastMouseX, lastMouseY)
  else updateDragPosition(lastMouseX)
  autoScrollRaf = requestAnimationFrame(performAutoScroll)
}

function onSwitchMarkerMouseDown(evt, id) {
  evt.stopPropagation()
  evt.preventDefault()
  if (evt.button !== 0) return

  wasSwitchSelectedOnPress.value = (store.selectedSwitchEventId === id)

  if (!wasSwitchSelectedOnPress.value) {
    store.selectSwitchEvent(id)
  }
  const sw = store.switchEvents.find((item) => item.id === id)
  const mousePos = store.toTimelineSpace(evt.clientX, evt.clientY)
  switchEventDragOffsetX.value = mousePos.x - store.timeToPx(Number(sw?.time) || 0)
  draggingSwitchEventId.value = id
  initialMouseX.value = evt.clientX
  initialMouseY.value = evt.clientY
  isDragStarted.value = false
  isMouseDown.value = true

  document.body.classList.add('is-dragging')

  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
  window.addEventListener('blur', onWindowMouseUp)
}

function onWindowMouseMove(evt) {
  lastMouseX = evt.clientX
  lastMouseY = evt.clientY

  if (draggingSwitchEventId.value) {
    if (!isDragStarted.value) {
      const dist = Math.sqrt(Math.pow(evt.clientX - initialMouseX.value, 2) + Math.pow(evt.clientY - initialMouseY.value, 2))
      if (dist > dragThreshold) isDragStarted.value = true; else return
    }
    updateDragAutoScroll(evt.clientX)
    if (autoScrollSpeed.value === 0) {
      updateSwitchMarkerPosition(evt.clientX, evt.clientY)
    }
    return
  }
  if (draggingCycleBoundaryId.value) {
    if (!isDragStarted.value) {
      const dist = Math.sqrt(Math.pow(evt.clientX - initialMouseX.value, 2) + Math.pow(evt.clientY - initialMouseY.value, 2))
      if (dist > dragThreshold) {
        isDragStarted.value = true
      } else {
        return
      }
    }
    updateDragAutoScroll(evt.clientX)
    if (autoScrollSpeed.value === 0) {
      updateCycleBoundaryPosition(evt.clientX, evt.clientY)
    }
    return
  }
  if (!isMouseDown.value) return
  if (evt.buttons === 0) { onWindowMouseUp(evt); return }
  const target = evt.target
  const isForm = target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  const isSidebar = target && (target.closest('.properties-sidebar') || target.closest('.action-library'))
  if (isForm || isSidebar) { onWindowMouseUp(evt); return }

  if (!isDragStarted.value) {
    const dist = Math.sqrt(Math.pow(evt.clientX - initialMouseX.value, 2) + Math.pow(evt.clientY - initialMouseY.value, 2))
    if (dist > dragThreshold) isDragStarted.value = true; else return
  }

  if (tracksContentRef.value) {
    updateDragAutoScroll(evt.clientX)
  }

  if (autoScrollSpeed.value === 0) {
    updateDragPosition(evt.clientX)
  }
}

function onGlobalWindowMouseUp(event) {
  if (connectionHandler.isDragging.value && event && event.target.tagName !== 'BUTTON') {
      connectionHandler.cancelDrag() 
  }
}

function onWindowMouseUp(event) {
  autoScrollSpeed.value = 0
  if (autoScrollRaf) { cancelAnimationFrame(autoScrollRaf); autoScrollRaf = null }

  if (draggingSwitchEventId.value) {
    if (!isDragStarted.value && wasSwitchSelectedOnPress.value) {
      store.selectSwitchEvent(draggingSwitchEventId.value)
    }

    if (isDragStarted.value) {
      store.commitState()
    }

    isDragStarted.value = false
    draggingSwitchEventId.value = null
    switchEventDragOffsetX.value = 0
    document.body.classList.remove('is-dragging')
    window.removeEventListener('mousemove', onWindowMouseMove)
    window.removeEventListener('mouseup', onWindowMouseUp)
    window.removeEventListener('blur', onWindowMouseUp)
    isMouseDown.value = false

    return
  }

  if (draggingCycleBoundaryId.value) {

    if (!isDragStarted.value && wasCycleSelectedOnPress.value) {
      store.selectCycleBoundary(draggingCycleBoundaryId.value)
    }

    if (isDragStarted.value) {
      store.commitState()
    }

    isDragStarted.value = false
    draggingCycleBoundaryId.value = null
    cycleBoundaryDragOffsetX.value = 0
    document.body.classList.remove('is-dragging')
    window.removeEventListener('mousemove', onWindowMouseMove)
    window.removeEventListener('mouseup', onWindowMouseUp)
    window.removeEventListener('blur', onWindowMouseUp)
    isMouseDown.value = false
    return
  }

  const _wasDragging = isDragStarted.value
  try {
    if (!isDragStarted.value && movingActionId.value) {
      if (wasSelectedOnPress.value) {
        store.selectAction(movingActionId.value)
      }
    } else if (_wasDragging) { store.commitState() }
  } catch (error) { console.error("MouseUp Error:", error) } finally {
    dragStartTimes.clear()
    isMouseDown.value = false; isDragStarted.value = false; movingActionId.value = null; movingTrackId.value = null
    window.removeEventListener('mousemove', onWindowMouseMove)
    window.removeEventListener('mouseup', onWindowMouseUp)
    window.removeEventListener('blur', onWindowMouseUp)
  }
  if (_wasDragging) window.addEventListener('click', captureClick, {capture: true, once: true})
}

function captureClick(e) { e.stopPropagation(); e.preventDefault() }

function getMinSkillStartTime() {
  if (store.prepExpanded) return 0
  return snapTimeToFrame(Math.max(0, Number(store.prepDuration) || 0))
}

function clampSkillStartTime(time) {
  const raw = Number(time) || 0
  return Math.max(getMinSkillStartTime(), snapTimeToFrame(raw))
}

function calculateTimeFromDropEvent(evt, skill, fixedStep = null) {
  const offsetX = Number(skill?.dragOffsetX) || 0
  const mouseXInTrack = store.toTimelineSpace((evt?.clientX || 0) - offsetX, evt?.clientY || 0).x

  const rawTime = store.pxToTime(mouseXInTrack)

  const step = fixedStep !== null ? fixedStep : store.snapStep
  const inverse = 1 / step
  let startTime = Math.round(rawTime * inverse) / inverse
  startTime = clampSkillStartTime(startTime)
  return startTime
}

function onTrackDrop(track, index, evt) {
  const skill = store.draggingSkillData; if (!skill || store.activeTrackIndex !== index) return
  const startTime = calculateTimeFromDropEvent(evt, skill)
  store.addSkillToTrack(track.id, skill, startTime)
  nextTick(() => forceSvgUpdate())
}
function onTrackDragOver(evt) { evt.preventDefault(); evt.dataTransfer.dropEffect = 'copy' }

function onBackgroundClick(event) {
  if (!event || event.target === tracksContentRef.value || event.target.classList.contains('track-row') || event.target.classList.contains('time-block')) {
    store.selectTrack(null)
  }
}

function handleKeyDown(event) {
  const target = event.target
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return

  const hasSelection = store.selectedActionId || store.multiSelectedIds.size > 0 || store.selectedConnectionId || store.selectedCycleBoundaryId || store.selectedSwitchEventId
  const hasNudgeTarget = store.selectedActionId || store.multiSelectedIds.size > 0 || store.selectedCycleBoundaryId || store.selectedSwitchEventId
  if (!hasSelection) return

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault();
    const result = store.removeCurrentSelection();
    if (result && result.total > 0) {
      ElMessage.success({ message: t('timelineGrid.selection.deleted'), duration: 800 })
    }
  }
  if (hasNudgeTarget) {
    if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') { event.preventDefault(); store.nudgeSelection(-1) }
    if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') { event.preventDefault(); store.nudgeSelection(1) }
  }
}

function handleGlobalKeyUp(e) {
  if (e.key === 'Alt') {
    isAltDown.value = false;
    hideAlignGuide()
  }
  if (e.key === 'Shift') {
    isShiftDown.value = false;
    recalcAlignGuide()
  }
}

function resetModifierKeys() {
  isAltDown.value = false
  isShiftDown.value = false
  hideAlignGuide()
}

function handleGlobalKeyDownWrapper(e) {
  if (e.key === 'Alt') {
    e.preventDefault()
    isAltDown.value = true
    recalcAlignGuide()
  }
  if (e.key === 'Shift') {
    isShiftDown.value = true
    recalcAlignGuide()
  }
  handleKeyDown(e)
}

function updateTrackRects() {
  trackLaneRefs.value.forEach(ref => {
    const idx = ref.dataset.trackIndex
    const rect = ref.getBoundingClientRect()
    const style = window.getComputedStyle(ref)
    // 排除border
    let borderTop = parseInt(style.borderTopWidth)
    let borderBottom = parseInt(style.borderBottomWidth)

    if (Number.isNaN(borderTop)) borderTop = 0
    if (Number.isNaN(borderBottom)) borderBottom = 0
      
    const data = {
      top: rect.top + borderTop,
      bottom: rect.bottom - borderBottom,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height - borderTop - borderBottom
    }
    store.setTrackLaneRect(idx, data)
  })
}

function onCycleBoundaryContextMenu(evt, boundaryId) {
  const boundary = store.cycleBoundaries.find((item) => item.id === boundaryId)
  if (!boundary) return

  store.selectCycleBoundary(boundaryId)
  store.openContextMenu(evt, boundaryId, Number(boundary.time) || 0, 'cycleBoundary')
}

const activeFreezeRegions = computed(() => {
  const selectedIds = store.multiSelectedIds
  const hoveredId = store.hoveredActionId
  if (selectedIds.size === 0 && !hoveredId) return []
  return store.globalExtensions.filter(ext => {
    return ext.sourceId === hoveredId || selectedIds.has(ext.sourceId)
  })
})

watch(() => store.timeBlockWidth, () => { nextTick(() => { forceSvgUpdate(); updateScrollbarHeight() }) })
watch(() => [store.tracks, store.connections], () => { nextTick(() => { forceSvgUpdate() }) }, { deep: true })
watch(() => trackRowHeights.value.slice(), () => {
  nextTick(() => {
    updateTrackRects()
    forceSvgUpdate()
  })
})

onMounted(() => {
  restoreTrackLayoutWeights()
  if (tracksContentRef.value) {
    tracksContentRef.value.addEventListener('scroll', syncVerticalScroll)
    tracksViewportHeight.value = tracksContentRef.value.clientHeight || 0

    const tracksResizeObserver = new ResizeObserver(([entry]) => { 
      const rect = entry.target.getBoundingClientRect()
      tracksViewportHeight.value = entry.target.clientHeight || rect.height || 0

      updateTrackRects()

      store.setTimelineRect(rect.width, rect.height, rect.top, rect.right, rect.bottom, rect.left)
      forceSvgUpdate(); updateScrollbarHeight();
    })

    tracksResizeObserver.observe(tracksContentRef.value)
    resizeObserver.push(tracksResizeObserver)
    updateScrollbarHeight()
  }

  window.addEventListener('keydown', handleGlobalKeyDownWrapper)
  window.addEventListener('keyup', handleGlobalKeyUp)
  window.addEventListener('blur', resetModifierKeys)
  window.addEventListener('mouseup', onGlobalWindowMouseUp)
})
onUnmounted(() => {
  if (tracksContentRef.value) {
    // tracksContentRef.value.removeEventListener('scroll', syncRulerScroll);
    tracksContentRef.value.removeEventListener('scroll', syncVerticalScroll);
    // tracksContentRef.value.removeEventListener('wheel', handleWheel)
  }
  resizeObserver.forEach(obs => obs.disconnect())
  resizeObserver = []
  window.removeEventListener('keydown', handleGlobalKeyDownWrapper)
  window.removeEventListener('keyup', handleGlobalKeyUp)
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
  window.removeEventListener('mousemove', onBoxMouseMove)
  window.removeEventListener('mouseup', onBoxMouseUp)
  window.removeEventListener('blur', resetModifierKeys)
  window.removeEventListener('mouseup', onGlobalWindowMouseUp)
  window.removeEventListener('mousemove', onPrepResizeMouseMove)
  window.removeEventListener('mouseup', onPrepResizeMouseUp)
  window.removeEventListener('pointermove', onTrackResizeMove)
  window.removeEventListener('pointerup', endTrackResize)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
})
</script>

<template>
  <div class="timeline-grid-layout" :style="{ gridTemplateRows: `${gridRowHeight} 1fr` }">
    <div class="corner-placeholder">
        <div class="corner-controls">
          <div class="corner-button-row">
            <button class="mini-tool-btn" :class="{ 'is-active': store.showCursorGuide }" @click="store.toggleCursorGuide" :title="t('timelineGrid.toolbar.cursorGuide')">
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="6" x2="12" y2="18"></line><line x1="6" y1="12" x2="18" y2="12"></line></svg>
            </button>
          
          <button class="mini-tool-btn" :class="{ 'is-active': store.isBoxSelectMode }" @click="store.toggleBoxSelectMode" :title="t('timelineGrid.toolbar.boxSelect')">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 4"/><path d="M8 12h8" stroke-width="1.5"/><path d="M12 8v8" stroke-width="1.5"/></svg>
          </button>
          
          <button class="mini-tool-btn" :class="{ 'is-active': store.snapStep < 0.1 }" @click="store.toggleSnapStep" :title="t('timelineGrid.toolbar.snapPrecision')">
            <span class="btn-text">{{ store.snapStep < 0.05 ? '1f' : '0.1s' }}</span>
          </button>
          
          <button class="mini-tool-btn" :class="{ 'is-active': connectionHandler.toolEnabled.value }" @click="store.toggleConnectionTool" :title="t('timelineGrid.toolbar.connectionTool')">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M5 4h14c3 0 3 8 0 8h-14c-3 0-3 8 0 8h14" /><circle cx="5" cy="4" r="2" fill="currentColor"/><circle cx="19" cy="20" r="2" fill="currentColor"/></svg>
          </button>

        </div>
        
        <div class="corner-zoom-row">
          <div class="zoom-info-line">
            <span class="zoom-label">SCALE</span>
            <span class="zoom-value">{{ Math.round((store.timeBlockWidth / 50) * 100) }}%</span>
          </div>
          <div class="zoom-slider-container">
            <span class="zoom-icon" @click="adjustZoom(-Math.max(1, Math.round(store.timeBlockWidth * 0.1)), null)"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg></span>
            <input
            type="range"
            class="davinci-range"
            :min="store.ZOOM_LIMITS.MIN"
            :max="store.ZOOM_LIMITS.MAX"
            step="1"
            v-model.number="zoomValue"
            />
            <span class="zoom-icon" @click="adjustZoom(Math.max(1, Math.round(store.timeBlockWidth * 0.1)), null)"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></span>
          </div>
        </div>
      </div>
    </div>

    <div class="time-ruler-wrapper" ref="timeRulerWrapperRef" @click="store.selectTrack(null)">
      <div class="ruler-content-container" :style="transformStyle">
      <div v-if="activePrepDuration > 0" class="prep-zone-bg prep-zone-bg--ruler" :style="{ width: `${prepZoneWidthPxRounded}px` }"></div>
       <div v-if="activePrepDuration > 0" class="battle-start-line battle-start-line--ruler" :style="{ left: `${prepZoneWidthPxRounded}px` }">
         <div v-if="store.prepExpanded" class="battle-start-handle" @mousedown.stop.prevent="onPrepResizeMouseDown"></div>
       </div>
       <div
         v-if="activePrepDuration > 0 && store.prepExpanded"
         class="prep-ruler-controls"
         :style="{ left: `${prepZoneWidthPxRounded}px` }"
       >
          <button type="button" class="prep-mini-btn" :title="t('timelineGrid.prep.setDurationTitle')" @click.stop="openPrepDurationEditor">
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
             <circle cx="12" cy="12" r="9"></circle>
             <path d="M12 7v6l4 2"></path>
           </svg>
         </button>
       </div>
       <div v-if="activePrepDuration > 0 && !store.prepExpanded" class="prep-zone-controls" :style="{ width: `${prepZoneWidthPxRounded}px`, bottom: showGameTime ? '40px' : '20px' }">
          <button type="button" class="prep-mini-btn" :title="t('timelineGrid.prep.setDurationTitle')" @click.stop="openPrepDurationEditor">
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
             <circle cx="12" cy="12" r="9"></circle>
             <path d="M12 7v6l4 2"></path>
           </svg>
         </button>
       </div>

      <div v-if="isPrepDurationEditorOpen" class="prep-duration-popover" :style="{ left: `${prepZoneWidthPxRounded + 8}px` }" @mousedown.stop>
        <input
          ref="prepDurationInputRef"
          v-model="prepDurationDraft"
          class="prep-duration-input"
          type="number"
          min="1"
          step="1"
          @keydown.enter.prevent="applyPrepDurationDraft"
          @keydown.esc.prevent="closePrepDurationEditor"
          @blur="applyPrepDurationDraft"
        />
        <span class="prep-duration-unit">f</span>
      </div>

      <div v-if="activePrepDuration > 0" class="prep-rtgt-wrapper" :style="{ width: `${prepZoneWidthPxRounded}px` }">
        <div v-if="showGameTime" class="prep-rtgt-row prep-rtgt-row--game">
           <button type="button" class="timeline-label interactable" :title="t('timelineGrid.ruler.gameTimeCollapseTitle')" @click.stop="isGameTimeCollapsed = true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <text x="12" y="20" font-size="20" fill="currentColor" text-anchor="middle" font-weight="bold" font-family="sans-serif">G</text>
            </svg>
            <span class="collapse-hint-icon">
              <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="3" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </span>
          </button>
        </div>
        <div class="prep-rtgt-row prep-rtgt-row--real">
          <template v-if="showGameTime">
            <div class="timeline-label" :title="t('timelineGrid.ruler.realTimeTitle')">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <text x="12" y="20" font-size="20" fill="currentColor" text-anchor="middle" font-weight="bold" font-family="sans-serif">R</text>
              </svg>
            </div>
          </template>
          <template v-else>
            <button type="button" class="timeline-label interactable expand-btn" :title="t('timelineGrid.ruler.gameTimeExpandTitle')" @click.stop="isGameTimeCollapsed = false">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </template>
        </div>
      </div>
      <div v-show="showGameTime" class="time-ruler-track game-time" :style="{ width: `${totalWidthComputed}px` }">
        <div v-for="(ext, idx) in store.globalExtensions"
             :key="idx"
             class="freeze-region-dim timeline"
             :style="{
             left: `${store.timeToPx(ext.time)}px`,
             width: `${store.timeToPx(ext.time + ext.amount) - store.timeToPx(ext.time)}px`}">
        </div>
        <div v-for="tick in dynamicTicks.gameTicks"
             :key="tick.time"
             class="tick-line"
             :class="tick.type"
             :style="{ left: `${Math.round(tick.x)}px` }">
           <span v-if="tick.label" class="tick-label">{{ tick.label }}</span>
        </div>
      </div>
      <div class="time-ruler-track" :style="{ width: `${totalWidthComputed}px` }">
        <div v-for="tick in dynamicTicks.realTicks"
             :key="tick.time"
             class="tick-line"
             :class="tick.type"
             :style="{ left: `${Math.round(tick.x)}px` }">
          <span v-if="tick.label" class="tick-label">{{ tick.label }}</span>
        </div>
      </div>
      <div class="operation-layer">
        <div v-for="op in operationMarkers" :key="op.id" class="key-cap"
             :class="[op.customClass, { 'is-hold': op.isHold, 'is-perfect-link': op.perfectLink }]"
             :style="{ left: `${op.left}px`, top: `${op.top}px`, width: op.width ? `${op.width}px` : 'auto', height: `${op.height}px`, fontSize: `${op.fontSize}px` }">
          <span class="key-text">{{ op.label }}</span>
        </div>
      </div>
      </div>
    </div>

    <div class="tracks-header-sticky" ref="tracksHeaderRef" @click="store.selectTrack(null)"
         :style="{ paddingBottom: `${20 + scrollbarHeight}px` }">
      <div v-for="(track, index) in store.teamTracksInfo" :key="index" class="track-info"
           :style="getTrackInfoStyle(index)"
           @click.stop="store.selectTrack(index)"
           :class="{ 
             'is-active': index === store.activeTrackIndex,
             'is-reorder-target': reorderDropTargetIndex === index && draggingTrackOrderIndex !== index,
             'is-reorder-source': draggingTrackOrderIndex === index
           }"
           @dragover="onReorderDragOver($event, index)"
           @drop="onReorderDrop($event, index)"
           @dragend="onReorderDragEnd">

        <div class="track-controls">
           <div class="reorder-btn arrow-btn up-btn" @click.stop="moveTrackUp(index)" :class="{ disabled: index === 0 }" :title="t('common.moveUp')">
              <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="3" fill="none"><polyline points="18 15 12 9 6 15"></polyline></svg>
           </div>
           
           <div class="drag-handle" draggable="true" @dragstart="onReorderDragStart($event, index)">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><circle cx="8" cy="4" r="2"></circle><circle cx="8" cy="12" r="2"></circle><circle cx="8" cy="20" r="2"></circle><circle cx="16" cy="4" r="2"></circle><circle cx="16" cy="12" r="2"></circle><circle cx="16" cy="20" r="2"></circle></svg>
           </div>

           <div class="reorder-btn arrow-btn down-btn" @click.stop="moveTrackDown(index)" :class="{ disabled: index === store.tracks.length - 1 }" :title="t('common.moveDown')">
              <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="3" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
           </div>
        </div>

        <div class="char-select-trigger">
          <div class="operator-main-block">
            <div class="initial-gauge-slot">
              <div
                  v-if="track.id"
                  class="initial-gauge-control"
                  :title="t('timelineGrid.track.initialGauge')"
                  @click.stop
              >
                <span class="initial-gauge-label">{{ t('timelineGrid.track.initialGaugeShort') }}</span>
                <div class="initial-gauge-input-wrap">
                  <CustomNumberInput
                      :model-value="getInitialGaugeValue(track)"
                      :min="0"
                      :max="getInitialGaugeMax(track)"
                      :step="1"
                      active-color="#7dd3fc"
                      border-color="#7dd3fc"
                      text-align="center"
                      @update:model-value="val => updateInitialGauge(track, val)"
                  />
                </div>
                <span class="initial-gauge-max">/{{ getInitialGaugeMax(track) }}</span>
              </div>
            </div>

            <div class="operator-row">
              <div class="trigger-avatar-box" @click.stop="openCharacterSelector(index)" :title="t('timelineGrid.track.changeOperatorTooltip')">
                <img v-if="track.id" :src="track.avatar" class="avatar-image" :alt="track.name"/>
                <div v-else class="avatar-placeholder"></div>
                <div class="avatar-change-hint" v-if="track.id">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.5 2v6h-6"></path>
                    <path d="M21.5 8A10 10 0 0 0 3 8"></path>
                    <path d="M2.5 22v-6h6"></path>
                    <path d="M2.5 16A10 10 0 0 0 21 16"></path>
                  </svg>
                </div>
            </div>
              <div class="trigger-info" @click="!track.id && openCharacterSelector(index)">
                <button
                    v-if="store.tracks[index]?.id"
                    type="button"
                    class="track-stat-detail-btn"
                    :disabled="!store.tracks[index]?.operatorStatus"
                    :title="t('statDetail.button')"
                    @click.stop="openStatDetail(index)"
                >
                  {{ t('statDetail.button') }}
                </button>
                <span class="trigger-name">{{ track.name || t('timelineGrid.track.selectOperator') }}</span>
              </div>
            </div>
          </div>
        <div v-if="track.id" class="gear-panel">
          <div class="gear-row">
            <div class="weapon-slot-compact" @click.stop="openWeaponSelector(index)" :title="t('timelineGrid.track.selectWeaponTooltip')">
              <div class="weapon-box" :class="getWeaponForTrack(track) ? '' : 'weapon-empty'">
                <img v-if="getWeaponForTrack(track)?.icon" :src="getWeaponForTrack(track).icon" @error="e=>e.target.style.display='none'" />
                <div v-else class="weapon-placeholder"></div>
              </div>
            </div>
            <div class="equip-slots-compact">
              <div class="equip-grid">
                <div class="equip-box" :class="getEquipmentForTrack(track, 'armor') ? '' : 'equip-empty'" @click.stop="openEquipmentSelector(index, 'armor')" :title="t('timelineGrid.equipmentSlot.armor')">
                  <img v-if="getEquipmentForTrack(track, 'armor')?.icon" :src="getEquipmentForTrack(track, 'armor').icon" @error="e=>e.target.style.display='none'" />
                  <div v-else class="equip-placeholder"></div>
                </div>
                <div class="equip-box" :class="getEquipmentForTrack(track, 'gloves') ? '' : 'equip-empty'" @click.stop="openEquipmentSelector(index, 'gloves')" :title="t('timelineGrid.equipmentSlot.gloves')">
                  <img v-if="getEquipmentForTrack(track, 'gloves')?.icon" :src="getEquipmentForTrack(track, 'gloves').icon" @error="e=>e.target.style.display='none'" />
                  <div v-else class="equip-placeholder"></div>
                </div>
                <div class="equip-box" :class="getEquipmentForTrack(track, 'accessory1') ? '' : 'equip-empty'" @click.stop="openEquipmentSelector(index, 'accessory1')" :title="t('timelineGrid.equipmentSlot.accessory1')">
                  <img v-if="getEquipmentForTrack(track, 'accessory1')?.icon" :src="getEquipmentForTrack(track, 'accessory1').icon" @error="e=>e.target.style.display='none'" />
                  <div v-else class="equip-placeholder"></div>
                </div>
                <div class="equip-box" :class="getEquipmentForTrack(track, 'accessory2') ? '' : 'equip-empty'" @click.stop="openEquipmentSelector(index, 'accessory2')" :title="t('timelineGrid.equipmentSlot.accessory2')">
                  <img v-if="getEquipmentForTrack(track, 'accessory2')?.icon" :src="getEquipmentForTrack(track, 'accessory2').icon" @error="e=>e.target.style.display='none'" />
                  <div v-else class="equip-placeholder"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="gear-hint-row">
            <div class="set-bonus-hint" :class="{ 'is-hidden': !store.getActiveSetBonusCategories(track.id)?.length }">
              {{ t('timelineGrid.track.setBonusActive') }}
            </div>
          </div>
        </div>
      </div>

      </div>
    </div>

    <StatDetailDialog
      :visible="isStatDetailVisible"
      :operator-status="statDetailTrack?.operatorStatus"
      :operator-name="statDetailTrackInfo?.name || ''"
      @update:visible="isStatDetailVisible = $event"
    />
    <HitDamageDetailDialog
      :visible="showHitDetail"
      :breakdown="hitDetailBreakdown"
      :hit-data="hitDetailHit"
      @update:visible="closeHitDetail"
    />

    <div class="tracks-content-viewport" ref="tracksContentRef" @mousedown="onContentMouseDown" @wheel="handleTrackWheel"
         @mousemove="onGridMouseMove" @mouseleave="onGridMouseLeave" @contextmenu="onBackgroundContextMenu">
      <div v-if="trackDividerOffsets.length" class="track-divider-overlay" aria-hidden="true">
        <div
          v-for="(offset, index) in trackDividerOffsets"
          :key="`track-divider-${index}`"
          class="track-divider-handle"
          :class="{ 'is-active': draggingTrackResizeIndex === index }"
          :style="{
            top: `${offset - store.timelineScrollTop}px`,
            left: `${prepZoneWidthPxRounded}px`,
            '--track-divider-prep-offset': `${prepZoneWidthPxRounded}px`,
          }"
          @pointerdown.stop="beginTrackResize(index, $event)"
          @dblclick.stop="resetTrackLayoutWeights"
        >
          <div class="track-divider-line"></div>
        </div>
      </div>

      <div class="tracks-content-scroller" :style="transformStyle">
        <div v-if="store.showCursorGuide && !store.isBoxSelectMode" class="cursor-guide"
             :style="{ transform: `translateX(${store.cursorPosTimeline.x}px)` }"
             v-show="isCursorVisible">

          <div class="guide-time-label">
            {{ store.formatAxisTimeLabel(store.cursorCurrentTime) }}
          </div>

          <div class="guide-sp-label">{{ t('timelineGrid.cursor.sp') }}: {{ currentSpValue }}</div>
          <div class="guide-stagger-label">{{ t('timelineGrid.cursor.stagger') }}: {{ currentStaggerValue }}</div>

          <div v-if="cursorGaugeRows.length" class="guide-gauge-panel">
            <div class="guide-gauge-title">{{ t('timelineGrid.cursor.gauge') }}</div>
            <div class="guide-gauge-grid">
              <div v-for="row in cursorGaugeRows" :key="row.id" class="guide-gauge-grid-row">
                <span class="guide-gauge-name" :class="{ 'is-full': row.isFull }" :style="{ color: row.color, '--row-color': row.color }">{{ row.name }}</span>
                <span class="guide-gauge-value" :class="{ 'is-full': row.isFull }">
                  <span class="guide-gauge-current" :style="{ color: row.color }">{{ row.val }}</span>
                  <span class="guide-gauge-sep">/</span>
                  <span class="guide-gauge-max">{{ row.max }}</span>
                </span>
              </div>
            </div>
          </div>
          <div v-if="currentEnemyHpText" class="guide-enemy-hp-label">
            HP: {{ currentEnemyHpText }}
          </div>
        </div>

        <div v-for="boundary in store.cycleBoundaries"
             :key="boundary.id"
             class="cycle-guide"
             :class="{ 'is-selected': boundary.id === store.selectedCycleBoundaryId }"
             :style="{ left: `${store.timeToPx(boundary.time)}px` }"
             @mousedown="onCycleLineMouseDown($event, boundary.id)"
             @contextmenu.stop.prevent="onCycleBoundaryContextMenu($event, boundary.id)">

          <div class="cycle-label-time">{{ store.formatAxisTimeLabel(boundary.time) }}</div>
          <div class="cycle-label-text">{{ t('timelineGrid.cycleBoundary') }}</div>
          <div class="cycle-hit-area"></div>
        </div>

        <div v-if="alignGuide.visible" class="align-guide-layer">
          <div class="target-highlight-box"
               :style="{
                 left: `${alignGuide.targetRect.left}px`,
                 top: `${alignGuide.targetRect.top}px`,
                 width: `${alignGuide.targetRect.width}px`,
                 height: `${alignGuide.targetRect.height}px`,
                 color: alignGuide.color
               }">
          </div>

          <div class="guide-line-vertical"
               :style="{ left: `${alignGuide.x}px`, color: alignGuide.color }">
          </div>

          <div class="guide-float-label"
               :style="{
                 left: `${alignGuide.x}px`,
                 top: `${alignGuide.top - 28}px`,
                 backgroundColor: alignGuide.color,
                 '--arrow-color': alignGuide.color
               }">

            <span class="guide-icon">
              <svg v-if="alignGuide.iconKey === 'snap-left'" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline><line x1="21" y1="4" x2="21" y2="20"></line></svg>

              <svg v-if="alignGuide.iconKey === 'snap-right'" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><polyline points="12 5 19 12 12 19"></polyline><line x1="3" y1="4" x2="3" y2="20"></line></svg>

              <svg v-if="alignGuide.iconKey === 'align-left'" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="18" x2="3" y2="18"></line><line x1="6" y1="2" x2="6" y2="22"></line></svg>

              <svg v-if="alignGuide.iconKey === 'align-right'" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="18" x2="3" y2="18"></line><line x1="18" y1="2" x2="18" y2="22"></line></svg>
            </span>

            <span class="guide-text">{{ alignGuide.label }}</span>
          </div>
        </div>

        <div v-if="isBoxSelecting" class="selection-box-overlay" :style="{ left: `${boxRect.left}px`, top: `${boxRect.top}px`, width: `${boxRect.width}px`, height: `${boxRect.height}px` }"></div>

        <div class="tracks-content">
          <div v-if="activePrepDuration > 0" class="prep-zone-bg prep-zone-bg--content" :style="{ width: `${prepZoneWidthPxRounded}px` }"></div>
          <div v-if="activePrepDuration > 0" class="battle-start-line battle-start-line--content" :style="{ left: `${prepZoneWidthPxRounded}px` }">
            <div v-if="store.prepExpanded" class="battle-start-handle" @mousedown.stop.prevent="onPrepResizeMouseDown"></div>
          </div>
          <div
            v-if="activePrepDuration > 0 && !store.prepExpanded"
            class="prep-collapsed-entry"
            :style="{ width: `${prepZoneWidthPxRounded}px` }"
          >
            <div class="prep-collapsed-text">{{ t('timelineGrid.prep.title') }}</div>
            <button type="button" class="prep-collapsed-toggle" @click.stop="store.togglePrepExpanded" :title="t('timelineGrid.prep.expand')">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="8 6 16 12 8 18"></polyline>
              </svg>
            </button>
            <div class="prep-collapsed-text">{{ t('timelineGrid.prep.expand') }}</div>
          </div>

          <div
            v-if="activePrepDuration > 0 && store.prepExpanded"
            class="prep-expanded-collapse"
            :style="{ left: `${Math.max(0, prepZoneWidthPxRounded - 18)}px` }"
          >
            <button type="button" class="prep-mini-btn" :title="t('timelineGrid.prep.collapseTitle')" @click.stop="store.togglePrepExpanded">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 6 8 12 16 18"></polyline>
              </svg>
            </button>
          </div>
          <ContextMenu />
          <svg class="connections-svg">
            <template v-if="tracksContentRef">
              <ActionConnector v-for="conn in store.connections" :key="conn.id" :connection="conn" :render-key="svgRenderKey"/>
              <ConnectionPreview v-if="connectionHandler.isDragging" />
            </template>
          </svg>

          <div v-for="(track, index) in store.tracks" :key="index" class="track-row" :id="`track-row-${index}`" :style="getTrackRowStyle(index)"
               :class="{ 'is-active-drop': index === store.activeTrackIndex,'is-last-track': index === store.tracks.length - 1 }" @dragover="onTrackDragOver" @drop="onTrackDrop(track, index, $event)">
            <TimelineBuffLayer
              v-if="track.id && store.isOperatorEffectsVisible(index)"
              :track-id="track.id"
              placement="upper"
            />
            <div class="track-lane" :style="getTrackLaneStyle" ref="trackLaneRefs" :data-track-index="index" :data-track-id="track.id">
              <GaugeOverlay v-if="track.id && store.isOperatorEffectsVisible(index)" :track-id="track.id"/>
              <div class="actions-container">
                <ActionItem v-memo="[action, store.isOperatorEffectsVisible(index)]" v-for="action in track.actions" :key="action.instanceId" :action="action"
                  :show-decorations="store.isOperatorEffectsVisible(index)"
                  @hit-click="openHitDetail"
                  @mousedown="onActionMouseDown($event, track, action)"
                  @mousemove="updateAlignGuide($event, action, $el.querySelector(`#action-${action.instanceId}`))"
                  @mouseleave="hideAlignGuide"
                  @contextmenu.prevent.stop="onActionContextMenu($event, action)"
                  :class="{ 'is-moving': isDragStarted && store.isActionSelected(action.instanceId) }"
                />
              </div>
              <div v-if="store.isOperatorEffectsVisible(index)" class="switch-marker-layer">
                <div v-for="sw in store.switchEvents.filter(s => s.characterId === track.id)"
                     :key="sw.id"
                     class="switch-tag"
                     :class="{ 'is-selected': sw.id === store.selectedSwitchEventId, 'is-dragging': sw.id === draggingSwitchEventId }"
                     :style="{ left: `${store.timeToPx(sw.time)}px` }"
                     @mousedown.stop="onSwitchMarkerMouseDown($event, sw.id)">

                  <div class="tag-avatar">
                    <img :src="getOperatorAvatarById(sw.characterId)" />
                  </div>
                  <div class="tag-time">{{ store.formatAxisTimeLabel(sw.time) }}</div>
                  <div class="tag-pointer"></div>
                </div>
              </div>
            </div>
            <TimelineBuffLayer
              v-if="track.id && store.isOperatorEffectsVisible(index)"
              :track-id="track.id"
              placement="lower"
            />
          </div>

          <div class="global-freeze-layer">
            <div v-for="(ext, idx) in activeFreezeRegions"
                 :key="idx"
                 class="freeze-region-dim"
                 :style="{
                 left: `${store.timeToPx(ext.time)}px`,
                 width: `${store.timeToPx(ext.time + ext.amount) - store.timeToPx(ext.time)}px`}">
              <div class="freeze-duration-label">
                {{ store.formatTimeLabel(ext.amount) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="timeline-horizontal-scrollbar" ref="fakeScrollbarRef" @scroll="onFakeScroll">
        <div class="scrollbar-spacer" :style="{ width: `${totalWidthComputed}px` }"></div>
      </div>
    </div>

    <el-dialog v-model="isSelectorVisible" :title="t('timelineGrid.operatorDialog.title')" width="600px" align-center class="char-selector-dialog" :append-to-body="true">
      <div class="selector-header">
        <div class="header-left-group">
          <el-input v-model="searchQuery" :placeholder="t('timelineGrid.operatorDialog.searchPlaceholder')" :prefix-icon="Search" clearable style="width: 180px" />
          <button class="ea-btn ea-btn--glass-cut ea-btn--glass-cut-danger ea-btn--cut-left ea-btn--lift" @click="removeOperator" :title="t('timelineGrid.operatorDialog.clearTrack')">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            {{ t('common.unequip') }}
          </button>
        </div>
        <div class="element-filters">
          <button v-for="elm in ELEMENT_FILTERS" :key="elm.value" class="ea-btn ea-btn--glass-cut" :class="{ 'is-active': filterElement === elm.value }" :style="{ '--ea-btn-accent': elm.color }" @click="filterElement = elm.value">
            {{ elm.label }}
          </button>
        </div>
      </div>
      <div class="roster-scroll-container">
        <template v-for="group in rosterByRarity" :key="group.level">
          <div class="rarity-header" :class="`header-rarity-${group.level}`" :style="{ color: getRarityBaseColor(group.level) }">
            <span class="rarity-label">{{ group.level }} ★</span>
            <div class="rarity-line"></div>
          </div>
          <div class="roster-grid">
            <div v-for="char in group.list" :key="char.id" class="roster-card" :class="[{ 'is-selected': store.tracks.some(t => t.id === char.id) }, `rarity-${char.rarity}-style`]" @click="confirmCharacterSelection(char.id)">
              <div class="card-avatar-wrapper" :style="char.rarity === 6 ? {} : { borderColor: getRarityBaseColor(char.rarity) }">
                <img :src="char.avatar" loading="lazy" />
                <div
                  class="element-badge"
                  :class="{ 'is-physical': char.element === 'physical' }"
                  :style="{ backgroundColor: getOperatorElementBadgeColor(char.element) }"
                  :title="char.elementName"
                >
                  <img :src="getOperatorElementIcon(char.element)" alt="" loading="lazy" />
                </div>
              </div>
              <div class="card-name">{{ char.name }}</div>
              <div v-if="store.tracks.some(t => t.id === char.id)" class="in-team-tag">{{ t('timelineGrid.operatorDialog.inTeam') }}</div>
            </div>
          </div>
        </template>
        <div v-if="rosterByRarity.length === 0" class="empty-roster">{{ t('timelineGrid.operatorDialog.empty') }}</div>
      </div>
    </el-dialog>

    <el-dialog v-model="isWeaponSelectorVisible" :title="t('timelineGrid.weaponDialog.title')" width="600px" align-center class="char-selector-dialog" :append-to-body="true">
      <div class="selector-header">
        <div class="header-left-group">
          <el-input v-model="weaponSearchQuery" :placeholder="t('timelineGrid.weaponDialog.searchPlaceholder')" :prefix-icon="Search" clearable style="width: 180px" />
          <button class="ea-btn ea-btn--glass-cut ea-btn--glass-cut-danger ea-btn--cut-left ea-btn--lift" :disabled="!currentWeaponForDialog" @click="removeWeapon" :title="t('timelineGrid.weaponDialog.unequipTooltip')">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            {{ t('common.unequip') }}
          </button>
        </div>
      </div>
      <div class="roster-scroll-container">
        <template v-for="group in weaponRosterByRarity" :key="group.level">
          <div class="rarity-header" :class="`header-rarity-${group.level}`" :style="{ color: getRarityBaseColor(group.level) }">
            <span class="rarity-label">{{ group.level }} ★</span>
          <div class="rarity-line"></div>
        </div>
        <div class="roster-grid">
          <div v-for="weapon in group.list" :key="weapon.id" class="roster-card" :class="[`rarity-${getWeaponRarity(weapon)}-style`]" @click="confirmWeaponSelection(weapon.id)">
            <div class="card-avatar-wrapper" :style="getWeaponRarity(weapon) === 6 ? {} : { borderColor: getRarityBaseColor(getWeaponRarity(weapon)) }">
              <img :src="weapon.icon || '/weapons/default.webp'" loading="lazy" />
            </div>
            <div class="card-name">{{ weapon.name }}</div>
            <div v-if="isWeaponEquipped(weapon.id)" class="in-team-tag weapon-equipped">{{ t('timelineGrid.weaponDialog.equipped') }}</div>
          </div>
        </div>
      </template>
      <div v-if="weaponRosterByRarity.length === 0" class="empty-roster">{{ t('timelineGrid.weaponDialog.empty') }}</div>
    </div>
    </el-dialog>

    <el-dialog v-model="isEquipmentSelectorVisible" :title="t('timelineGrid.equipmentDialog.title', { slot: equipmentSlotLabel })" width="600px" align-center class="char-selector-dialog" :append-to-body="true">
      <div class="selector-header">
        <div class="header-left-group">
          <el-input v-model="equipmentSearchQuery" :placeholder="t('timelineGrid.equipmentDialog.searchPlaceholder')" :prefix-icon="Search" clearable style="width: 180px" />
          <button class="ea-btn ea-btn--glass-cut ea-btn--glass-cut-danger ea-btn--cut-left ea-btn--lift" :disabled="!currentEquipmentForDialog" @click="removeEquipment" :title="t('timelineGrid.equipmentDialog.unequipTooltip')">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            {{ t('common.unequip') }}
          </button>
          <div class="equipment-tier-picker">
            <span class="tier-label">{{ t('timelineGrid.equipmentDialog.refine') }}</span>
            <div class="equipment-refine-buttons">
              <button
                v-for="tier in EQUIPMENT_REFINE_TIERS"
                :key="`tier_${tier}`"
                type="button"
                class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-gold equipment-refine-btn"
                :class="{ 'is-active': currentEquipmentTierForDialog === tier }"
                @click="setCurrentEquipmentTierForDialog(tier)"
              >
                {{ tier === 0 ? t('timelineGrid.equipmentDialog.refineBase') : tier }}
              </button>
            </div>
          </div>
        </div>
        <div class="element-filters">
          <button class="ea-btn ea-btn--glass-cut equipment-filter-chip" :class="{ 'is-active': equipmentCategoryFilter === 'ALL' }" :style="{ '--ea-btn-accent': '#2dd4bf' }" @click="equipmentCategoryFilter = 'ALL'">{{ t('timelineGrid.equipmentDialog.allCategories') }}</button>
          <button class="ea-btn ea-btn--glass-cut equipment-filter-chip" :class="{ 'is-active': equipmentCategoryFilter === '__UNCAT__' }" :style="{ '--ea-btn-accent': '#888' }" @click="equipmentCategoryFilter = '__UNCAT__'">{{ t('timelineGrid.equipmentDialog.uncategorized') }}</button>
          <button v-for="cat in store.equipmentCategories" :key="`eqcat_${cat}`" class="ea-btn ea-btn--glass-cut" :class="{ 'is-active': equipmentCategoryFilter === cat }" :style="{ '--ea-btn-accent': '#2dd4bf' }" @click="equipmentCategoryFilter = cat">{{ store.getSetBonusDisplayName ? store.getSetBonusDisplayName(cat) : cat }}</button>
        </div>
        <div class="equipment-affix-filter-section">
          <div class="equipment-affix-filter-strip">
            <button
                class="ea-btn ea-btn--glass-cut equipment-filter-chip"
                :class="{ 'is-active': equipmentAffixFilter === 'ALL' }"
                :style="{ '--ea-btn-accent': '#2dd4bf' }"
                @click="equipmentAffixFilter = 'ALL'"
            >
              {{ t('timelineGrid.equipmentDialog.allAffixes') }}
            </button>

            <template
                v-for="(group, groupIndex) in equipmentAffixFilterGroups"
                :key="`eq_affix_group_${group.key}`"
            >
      <span
          v-if="groupIndex > 0"
          class="equipment-affix-filter-divider"
          aria-hidden="true"
      />

              <button
                  v-for="option in group.items"
                  :key="`eq_affix_filter_${option.value}`"
                  class="ea-btn ea-btn--glass-cut equipment-filter-chip"
                  :class="{ 'is-active': equipmentAffixFilter === option.value }"
                  :style="{ '--ea-btn-accent': option.accent }"
                  @click="equipmentAffixFilter = option.value"
              >
                {{ option.label }}
              </button>
            </template>
          </div>
        </div>
        <div class="element-filters">
          <button class="ea-btn ea-btn--glass-cut equipment-filter-chip" :class="{ 'is-active': equipmentLevelFilter === 'ALL' }" :style="{ '--ea-btn-accent': '#2dd4bf' }" @click="equipmentLevelFilter = 'ALL'">{{ t('timelineGrid.equipmentDialog.allLevels') }}</button>
          <button v-for="lv in EQUIPMENT_LEVELS" :key="`eqlv_${lv}`" class="ea-btn ea-btn--glass-cut equipment-filter-chip" :class="{ 'is-active': equipmentLevelFilter === lv }" :style="{ '--ea-btn-accent': getEquipmentLevelColor(lv) }" @click="equipmentLevelFilter = lv">Lv{{ lv }}</button>
        </div>
      </div>
      <div class="roster-scroll-container">
        <template v-for="group in equipmentRosterByLevel" :key="group.level">
          <div class="rarity-header" :style="{ color: getEquipmentLevelColor(group.level) }">
            <span class="rarity-label">Lv{{ group.level }}</span>
            <div class="rarity-line"></div>
          </div>
          <div class="roster-grid">
            <div
                v-for="eq in group.list"
                :key="eq.id"
                class="roster-card equipment-roster-card"
                :class="{ 'is-ability-match-both': eq.abilityMatch?.type === 'both', }" @click="confirmEquipmentSelection(eq.id)">
              <el-tooltip
                placement="top-start"
                effect="dark"
                :show-after="160"
                :disabled="getEquipmentAffixRows(eq).length === 0"
                popper-class="equipment-affix-tooltip-popper"
              >
                <template #content>
                  <div class="equipment-affix-tooltip">
                    <div
                      v-for="row in getEquipmentAffixRows(eq)"
                      :key="`eq_tip_${row.key}`"
                      class="equipment-affix-tooltip-row"
                    >
                      <svg
                        v-if="row.marker === 'hollow-dot'"
                        class="equipment-affix-tooltip-marker"
                        viewBox="0 0 12 12"
                        aria-hidden="true"
                      >
                        <circle cx="6" cy="6" r="3.25" fill="none" stroke="currentColor" stroke-width="1.5" />
                      </svg>
                      <img v-else class="equipment-affix-tooltip-icon" :src="row.src" loading="lazy" />
                      <span class="equipment-affix-tooltip-label">{{ row.label }}</span>
                      <strong class="equipment-affix-tooltip-value">{{ row.valueText }}</strong>
                    </div>
                  </div>
                </template>
                <div
                    class="card-avatar-wrapper"
                    :class="{ 'is-ability-match-both': eq.abilityMatch?.type === 'both',}" :style="{ borderColor: getEquipmentLevelColor(eq.level) }">
                  <div class="eq-affix-icon-stack">
                    <div
                      v-for="icon in getEquipmentPrimaryAffixIconStack(eq)"
                      :key="`eq_affix_${eq.id}_${icon.key || icon.modifierId}`"
                      class="eq-affix-icon-cell"
                      :class="{ 'has-img': !!icon.src, 'has-hollow-marker': icon.marker === 'hollow-dot' }"
                      :title="icon.title"
                    >
                      <span class="eq-affix-icon-dot" aria-hidden="true"></span>
                      <svg
                        v-if="icon.marker === 'hollow-dot'"
                        class="eq-affix-icon-hollow"
                        viewBox="0 0 12 12"
                        aria-hidden="true"
                      >
                        <circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" stroke-width="1.4" />
                      </svg>
                      <img
                        v-else-if="icon.src"
                        class="eq-affix-icon-img"
                        :src="icon.src"
                        loading="lazy"
                        @load="e=>e.target.closest('.eq-affix-icon-cell')?.classList.remove('img-failed')"
                        @error="e=>e.target.closest('.eq-affix-icon-cell')?.classList.add('img-failed')"
                      />
                    </div>
                  </div>
                  <img :src="eq.icon || '/icons/default_icon.webp'" loading="lazy" />
                </div>
              </el-tooltip>
              <div class="card-name">{{ eq.name }}</div>
              <div v-if="isEquipmentEquipped(eq.id)" class="in-team-tag weapon-equipped">{{ t('timelineGrid.weaponDialog.equipped') }}</div>
            </div>
          </div>
        </template>
        <div v-if="equipmentRosterByLevel.length === 0" class="empty-roster">{{ t('timelineGrid.equipmentDialog.empty') }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ==========================================================================
   1. Grid Layout Structure
   ========================================================================== */
.timeline-grid-layout {
  display: grid;
  grid-template-columns: 180px 1fr;
  grid-template-rows: 60px 1fr;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

/* ==========================================================================
   2. Corner Placeholder (Top-Left)
   ========================================================================== */
.corner-placeholder {
  background: #3a3a3a;
  border-bottom: 1px solid #444;
  border-right: 1px solid #444;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 2px 0 8px;
  gap: 4px;
  box-sizing: border-box;
}

.corner-controls {
  display: flex;
  flex-direction: column;
  flex: 1 0 0;
  gap: 4px;
  min-width: 0;
}

.corner-button-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 4px;
}

.mini-tool-btn {
  flex: 1;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2b2b2b;
  border: 1px solid #555;
  border-radius: 3px;
  color: #888;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
}

.mini-tool-btn:hover {
  background: #444;
  color: #ccc;
  border-color: #777;
}

.mini-tool-btn.is-active {
  color: #ffd700;
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
}

.btn-text {
  font-size: 9px;
  font-weight: bold;
  transform: scale(0.9);
}

.corner-zoom-row {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.zoom-info-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0 2px;
  width: 100%;
}

.zoom-label {
  font-size: 8px;
  color: #555;
  letter-spacing: 0.5px;
  font-weight: bold;
}

.zoom-value {
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 9px;
  color: #ffd700;
  font-weight: bold;
  opacity: 0.9;
}

.zoom-slider-container {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 4px;
}

.zoom-icon {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: color 0.2s;
}

.zoom-icon:hover {
  color: #ffd700;
}

.davinci-range {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 2px;
  background: #555;
  outline: none;
  border-radius: 1px;
  min-width: 0;
}

.davinci-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 8px;
  height: 8px;
  background: #ffd700;
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid #333;
  box-shadow: 0 0 2px rgba(0,0,0,0.5);
  transition: transform 0.1s;
}

body.capture-mode .davinci-range {
  opacity: 0;
}

.davinci-range::-webkit-slider-thumb:hover {
  transform: scale(1.3);
  background: #fff;
}

.davinci-range::-moz-range-thumb {
  width: 8px;
  height: 8px;
  background: #ffd700;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.timeline-label {
  flex: 0 0 auto;
  height: 20px;
  display: flex;
  align-items: flex-end;
  font-size: 10px;
  color: #888;
  transition: color 0.2s;

  &:hover {
    color: #e0e0e0;
  }

  &.interactable {
    cursor: pointer;
    position: relative;

    &:hover {
      color: #ffd700;
    }
  }

  &.expand-btn {
    justify-content: center;
    align-items: center;
    color: #888;

    &:hover {
      color: #ffd700;
      background: rgba(255, 215, 0, 0.1);
      border-radius: 4px;
    }
  }
}

.collapse-hint-icon {
  position: absolute;
  top: 0;
  right: -4px;
  opacity: 0;
  transition: opacity 0.2s;
  color: #888;
}

.timeline-label.interactable:hover .collapse-hint-icon {
  opacity: 1;
}

/* ==========================================================================
   3. Time Ruler (Top-Right)
   ========================================================================== */
.time-ruler-wrapper {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  background: #2b2b2b;
  border-bottom: 1px solid #444;
  overflow: hidden;
  z-index: 6;
  user-select: none;
}

.ruler-content-container {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.prep-zone-bg {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  pointer-events: none;
  z-index: 0;
}

.battle-start-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 255, 255, 0.38);
  transform: translateX(-1px);
  z-index: 2;
}

.battle-start-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -7px;
  width: 14px;
  cursor: ew-resize;
  pointer-events: auto;
  background: transparent;
}

.prep-rtgt-wrapper {
  position: absolute;
  left: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  z-index: 4;
  pointer-events: none;
}

.prep-rtgt-row {
  height: 20px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding-right: 2px;
  pointer-events: auto;
}

.prep-rtgt-wrapper button.timeline-label,
.prep-rtgt-wrapper .timeline-label {
  border: none;
  background: transparent;
  padding: 0;
}

.prep-zone-controls {
  position: absolute;
  left: 0;
  top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  pointer-events: none;
  z-index: 6;
}

.prep-zone-controls .prep-mini-btn {
  pointer-events: auto;
}

.prep-expanded-collapse {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 6;
  pointer-events: none;
}

.prep-expanded-collapse .prep-mini-btn {
  pointer-events: auto;
}

.prep-ruler-controls {
  position: absolute;
  top: 6px;
  transform: translateX(-100%);
  width: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 6;
  pointer-events: none;
  margin-left: -1px;
}

.prep-ruler-controls .prep-mini-btn {
  pointer-events: auto;
}

.prep-mini-btn {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  border-radius: 6px;
  outline: none;
  transition: color 0.12s ease;
}
.prep-mini-btn:hover {
  color: #ffd700;
}
.prep-mini-btn:focus-visible {
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.35);
}

.prep-duration-popover {
  position: absolute;
  top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  z-index: 50;
}

.prep-duration-input {
  width: 72px;
  height: 22px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.18);
  outline: none;
  padding: 0 6px;
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 12px;
}
.prep-duration-input:focus {
  border-color: rgba(255, 215, 0, 0.7);
}
.prep-duration-unit {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-family: 'Roboto Mono', 'Consolas', monospace;
}

.prep-collapsed-entry {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 6;
  pointer-events: none;
}

.prep-collapsed-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.72);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
}

.prep-collapsed-toggle {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  pointer-events: auto;
  border-radius: 8px;
  outline: none;
}

.prep-collapsed-toggle:hover {
  color: #ffd700;
}
.prep-collapsed-toggle:focus-visible {
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.35);
}

.time-ruler-track {
  position: relative;
  flex: 0 0 auto;
  height: 20px;
  width: 100%;

  &.game-time {
    opacity: 0.5;
  }
}

.tick-line {
  position: absolute;
  bottom: 0;
  width: 1px;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-0.5px);
  image-rendering: pixelated;
}

.tick-label {
  position: absolute;
  left: 3px;
  bottom: 1px;
  white-space: nowrap;
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 10px;
  color: #888;
  user-select: none;
  pointer-events: none;
  line-height: 1;
}

.tick-line.major {
  height: 17px;
  background: rgba(255, 255, 255, 0.7);
  z-index: 2;
}

.tick-line.major-dim {
  height: 17px;
  background: rgba(255, 255, 255, 0.15);
  z-index: 1;
}

.tick-line.major-dim .tick-label {
  display: none;
}

.tick-line.major .tick-label {
  color: #e0e0e0;
  font-weight: bold;
  font-size: 11px;
  bottom: 1px;
}

.tick-line.tenth {
  height: 10px;
  background: rgba(255, 255, 255, 0.4);
  z-index: 1;
}

.tick-line.frame {
  height: 5px;
  background: rgba(255, 255, 255, 0.2);
}

.tick-line.frame .tick-label,
.tick-line.tenth .tick-label {
  font-size: 8px;
  color: #666;
  font-style: italic;
}

/* ==========================================================================
   4. Sidebar Tracks Header (Left Column)
   ========================================================================== */
.tracks-header-sticky {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  width: 180px;
  background: #3a3a3a;
  display: flex;
  flex-direction: column;
  z-index: 6;
  border-right: 1px solid #444;
  padding: 20px 0;
  overflow-x: hidden;
  overflow-y: hidden;
  box-sizing: border-box;
}

.track-info {
  --track-row-height: 110px;
  flex: 0 0 auto;
  height: var(--track-row-height);
  min-height: var(--track-row-height);
  display: flex;
  align-items: center;
  background: #3a3a3a;
  padding-left: 4px;
  transition: background 0.2s;
  border: 1px solid transparent;
}

.track-info.is-active {
  background: #4a5a6a;
  border-right: 3px solid #ffd700;
}

.char-select-trigger {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0 6px;
  gap: 0;
  position: relative;
}

.operator-main-block {
  --initial-gauge-slot-height: 40px;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto minmax(0, 1fr);
  grid-template-columns: 100%;
  width: 100%;
  height: 100%;
  min-width: 0;
  position: relative;
}
.initial-gauge-slot {
  grid-row: 1;
  align-self: end;
  height: var(--initial-gauge-slot-height);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  overflow: visible;
}

.operator-row {
  grid-row: 2;
  display: flex;
  align-items: center;
  min-width: 0;
  height: auto;
  flex: none;
}

.trigger-avatar-box {
  position: relative;
  margin-right: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.avatar-image {
  display: block;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #555;
  transition: border-color 0.2s;
}

.avatar-placeholder {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #444;
  border: 2px dashed #666;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s;
}

.avatar-placeholder:hover {
  border-color: #ffd700;
  background: #555;
}

.avatar-placeholder::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 2px;
  background-color: #888;
  border-radius: 1px;
  transition: background-color 0.2s;
}

.avatar-placeholder::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 16px;
  background-color: #888;
  border-radius: 1px;
  transition: background-color 0.2s;
}

.avatar-placeholder:hover::before,
.avatar-placeholder:hover::after {
  background-color: #ffd700;
}

.avatar-change-hint {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.trigger-avatar-box:hover .avatar-change-hint {
  opacity: 1;
}

.trigger-avatar-box:hover .avatar-image {
  border-color: #ffd700;
}

.trigger-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  cursor: default;
  position: relative;
}

.track-info:not(.is-active) .trigger-info {
  cursor: pointer;
}

.trigger-name {
  display: block;
  color: #f0f0f0;
  font-weight: bold;
  font-size: 14px;
  line-height: 18px;
  user-select: none;
}

.initial-gauge-control {
  --initial-gauge-accent: #7dd3fc;
  --initial-gauge-input-width: 54px;
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  width: 100%;
  height: 20px;
  padding-left: 1px;
  color: var(--initial-gauge-accent);
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

.initial-gauge-label {
  flex: 0 0 auto;
  color: rgba(125, 211, 252, 0.92);
  user-select: none;
}

.initial-gauge-input-wrap {
  flex: 0 0 var(--initial-gauge-input-width);
  width: var(--initial-gauge-input-width);
  height: 20px;
}

.initial-gauge-input-wrap :deep(.custom-number-input) {
  height: 20px;
  background: rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 0 1px rgba(125, 211, 252, 0.38) inset;
}

.initial-gauge-input-wrap :deep(.custom-number-input:focus-within) {
  background: rgba(125, 211, 252, 0.1);
  box-shadow: 0 0 0 1px rgba(125, 211, 252, 0.9) inset;
}

.initial-gauge-input-wrap :deep(.value-display) {
  color: #e0f2fe;
  font-size: 10px;
  font-weight: 800;
  line-height: 20px;
  padding: 0 2px;
}

.initial-gauge-input-wrap :deep(.controls-stack) {
  width: 14px;
}

.initial-gauge-input-wrap :deep(.control-btn) {
  width: 14px;
  color: rgba(125, 211, 252, 0.62);
  font-size: 9px;
}

.initial-gauge-input-wrap :deep(.control-btn:hover:not(:disabled)) {
  color: #e0f2fe;
}

.initial-gauge-max {
  flex: 0 0 auto;
  color: rgba(186, 230, 253, 0.62);
  user-select: none;
}

.track-stat-detail-btn {
  position: absolute;
  left: 0;
  top: -5px;
  z-index: 4;
  align-self: flex-start;
  max-width: 100%;
  height: 18px;
  margin-bottom: 0;
  padding: 0 7px;
  border: 1px solid rgba(255, 215, 0, 0.28);
  background: rgba(255, 215, 0, 0.08);
  color: #ffd700;
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.14s ease, border-color 0.14s ease, background-color 0.14s ease;
}

.track-stat-detail-btn:hover:not(:disabled) {
  color: #fff;
  border-color: rgba(255, 215, 0, 0.72);
  background: rgba(255, 215, 0, 0.16);
}

.track-stat-detail-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.gear-panel {
  --gear-gap: 4px;
  position: absolute;
  left: 0;
  right: 0;
  top: calc(50% + 33px);
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  pointer-events: auto;
  z-index: 2;
}

.gear-row {
  display: flex;
  align-items: flex-end;
  gap: var(--gear-gap);
  min-width: 0;
  height: 22px;
  overflow: visible;
}

.weapon-slot-compact { cursor: pointer; flex: 0 0 auto; }
.weapon-box { width: 32px; height: 32px; border-radius: 6px; background: #444; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid #555; box-sizing: border-box; transition: border-color 0.2s, background 0.2s; position: relative; }
.weapon-box.weapon-empty { border: 2px dashed #666; }
.weapon-slot-compact:hover .weapon-box { border-color: #ffd700; background: #555; box-shadow: none; }
.weapon-box img { width: 100%; height: 100%; object-fit: cover; }
.weapon-placeholder { width: 100%; height: 100%; position: relative; }
.weapon-placeholder::before,
.weapon-placeholder::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  background: #888;
  border-radius: 1px;
  transition: background 0.2s;
}
.weapon-placeholder::before { width: 16px; height: 2px; transform: translate(-50%, -50%); }
.weapon-placeholder::after { width: 2px; height: 16px; transform: translate(-50%, -50%); }
.weapon-slot-compact:hover .weapon-placeholder::before,
.weapon-slot-compact:hover .weapon-placeholder::after {
  background: #ffd700;
}

.equip-slots-compact { pointer-events: auto; flex: 1 1 auto; min-width: 0; }

.equip-grid { display: flex; align-items: center; gap: var(--gear-gap); padding: 0; flex-wrap: nowrap; }

.equip-box {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #444;
  border: 2px solid #555;
  box-sizing: border-box;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.equip-box.equip-empty {
  border: 2px dashed #666;
  background: #444;
}

.equip-box:hover {
  border-color: #2dd4bf;
  background: #555;
  box-shadow: none;
}

.equip-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.equip-placeholder {
  width: 100%;
  height: 100%;
  position: relative;
}

.equip-placeholder::before,
.equip-placeholder::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  background: #888;
  border-radius: 1px;
  transition: background 0.2s;
}
.equip-placeholder::before { width: 12px; height: 2px; transform: translate(-50%, -50%); }
.equip-placeholder::after { width: 2px; height: 12px; transform: translate(-50%, -50%); }
.equip-box:hover .equip-placeholder::before,
.equip-box:hover .equip-placeholder::after { background: #2dd4bf; }

.equipment-tier-picker {
  display: flex;
  align-items: center;
  gap: 6px;
}

.equipment-tier-picker .tier-label {
  font-size: 12px;
  color: #888;
  font-weight: 700;
  user-select: none;
}

.equipment-refine-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.equipment-refine-btn {
  min-width: 30px;
  height: 24px;
  padding: 0 7px;
  line-height: 1;
}

.gear-hint-row { height: 22px; }

.set-bonus-hint {
  height: 22px;
  line-height: 22px;
  font-size: 12px;
  font-weight: 800;
  color: #2dd4bf;
  opacity: 0.6;
  letter-spacing: 0.5px;
  margin-left: calc(32px + var(--gear-gap));
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.set-bonus-hint.is-hidden { visibility: hidden; }

/* ==========================================================================
   5. Main Content Scroller
   ========================================================================== */
.tracks-content-viewport {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  background: #18181c;
}

.tracks-content-scroller {
  height: 100%;
}

.track-divider-overlay {
  position: absolute;
  inset: 0 0 12px 0;
  pointer-events: none;
  z-index: 1;
}

.track-divider-handle {
  position: absolute;
  right: 0;
  height: 6px;
  transform: translateY(-50%);
  cursor: ns-resize;
  pointer-events: auto;
}

.track-divider-line {
  position: absolute;
  left: calc(-1 * var(--track-divider-prep-offset, 0px));
  right: 0;
  top: 50%;
  height: 1px;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-50%);
  transition: background-color 0.12s ease, box-shadow 0.12s ease;
}

.track-divider-handle:hover .track-divider-line,
.track-divider-handle.is-active .track-divider-line {
  background: rgba(255, 215, 0, 0.45);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
}

.timeline-horizontal-scrollbar {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  width: 100%;
  height: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 100;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.timeline-horizontal-scrollbar:hover { opacity: 1; }
.scrollbar-spacer { height: 1px; }

.tracks-content {
  position: relative;
  width: fit-content;
  min-width: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  height: 100%;
  box-sizing: border-box;
}

.cursor-guide {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 215, 0, 0.8);
  pointer-events: none;
  z-index: 3000;
  box-shadow: 0 0 6px #ffd700;
}

.guide-time-label {
  width: fit-content;
  color: #ffffff;
  font-size: 10px;
  font-weight: bold;
  font-family: monospace;
  padding: 2px 4px;
  border-radius: 0 4px 4px 0;
  white-space: nowrap;
  line-height: 1;
}

.guide-sp-label {
  width: fit-content;
  color: #ffd700;
  font-size: 10px;
  font-weight: bold;
  font-family: monospace;
  padding: 2px 4px;
  white-space: nowrap;
  line-height: 1;
  text-shadow: 0 0 2px rgba(255, 215, 0, 0.5);
}

.guide-stagger-label {
  width: fit-content;
  color: #ff7875;
  font-size: 10px;
  font-weight: bold;
  font-family: monospace;
  padding: 2px 4px;
  border-radius: 0 4px 4px 0;
  white-space: nowrap;
  line-height: 1;
  text-shadow: 0 0 2px rgba(255, 120, 117, 0.5);
  margin-top: 1px;
}

.guide-enemy-hp-label {
  width: fit-content;
  color: #ff4d4f;
  font-size: 10px;
  font-weight: bold;
  font-family: monospace;
  padding: 2px 4px;
  white-space: nowrap;
  line-height: 1;
  text-shadow: 0 0 2px rgba(255, 77, 79, 0.5);
  margin-top: 2px;
}

.guide-gauge-panel {
  width: fit-content;
  font-size: 10px;
  font-weight: bold;
  font-family: monospace;
  padding: 2px 4px;
  border-radius: 0 4px 4px 0;
  white-space: nowrap;
  line-height: 1;
  margin-top: 2px;
}

.guide-gauge-title {
  color: #00e5ff;
  text-shadow: 0 0 2px rgba(0, 229, 255, 0.45);
  margin-bottom: 2px;
}

.guide-gauge-grid {
  display: grid;
  grid-template-columns: max-content max-content;
  column-gap: 8px;
  row-gap: 2px;
}

.guide-gauge-grid-row {
  display: contents;
}

.guide-gauge-name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 6px;
  border-left: 2px solid var(--row-color);
}

.guide-gauge-value {
  opacity: 0.95;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.92);
}

.guide-gauge-name.is-full {
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.18);
}

.guide-gauge-value.is-full .guide-gauge-current {
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.18);
}

.guide-gauge-sep {
  opacity: 0.55;
  padding: 0 4px;
}

.guide-gauge-max {
  color: rgba(170, 170, 170, 0.92);
}

.selection-box-overlay {
  position: absolute;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
  --g-h: linear-gradient(to right, rgba(255, 255, 255, 0.9) 60%, transparent 60%);
  --g-v: linear-gradient(to bottom, rgba(255, 255, 255, 0.9) 60%, transparent 60%);
  background-image: var(--g-h), var(--g-h), var(--g-v), var(--g-v);
  background-position: top, bottom, left, right;
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-size: 10px 1px, 10px 1px, 1px 10px, 1px 10px;
}

/* ==========================================================================
   6. Track Rows & Actions
   ========================================================================== */
.track-row {
  --track-height: 50px;
  --track-row-height: 110px;
  --track-row-padding-top: 30px;
  --track-row-padding-bottom: 30px;
  position: relative;
  flex: 0 0 auto;
  height: var(--track-row-height);
  min-height: var(--track-height);
  padding-top: var(--track-row-padding-top);
  padding-bottom: var(--track-row-padding-bottom);
  box-sizing: border-box;
  width: fit-content;
  min-width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.track-lane {
  position: relative;
  height: var(--track-height);
  display: flex;
  background: rgba(255, 255, 255, 0.02);
  border-top: 2px solid transparent;
  border-bottom: 2px solid transparent;
}

.track-row.is-active-drop .track-lane {
  border-top: 2px dashed #c0c0c0;
  border-bottom: 2px dashed #c0c0c0;
  z-index: 1;
}

.actions-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
}

.connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 25;
  pointer-events: none;
  overflow: visible;
}

/* ==========================================================================
   7. Operation Layer (Key Markers)
   ========================================================================== */
.operation-layer {
  position: absolute;
  top: 4px;
  left: 0;
  width: 100%;
  height: 50px;
  pointer-events: none;
  z-index: 10;
}

.key-cap {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #444;
  border: 1px solid #666;
  border-radius: 2px;
  color: #fff;
  font-weight: bold;
  font-family: Consolas, Monaco, monospace;
  box-shadow: 0 1px 1px rgba(0,0,0,0.5);
  white-space: nowrap;
  opacity: 0.95;
  z-index: 1;
  transition: top 0.2s, height 0.2s;
}

.key-cap.op-skill {
  background: #3a3a3a;
  border-color: #888;
  width: 20px !important;
}

.key-cap.op-link {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
  color: #ffd700;
  width: 20px !important;
  z-index: 2;
}

.key-cap.op-link.is-perfect-link {
  background: rgba(255, 236, 122, 0.36);
  border-color: #fff2a8;
  color: #fff7cf;
  box-shadow: 0 0 0 1px rgba(255, 242, 168, 0.85), 0 0 12px rgba(255, 215, 0, 0.85);
  animation: perfect-link-pulse 1.15s ease-in-out infinite;
}

.key-cap.op-switch {
  background: rgba(211, 173, 255, 0.2);
  border-color: #d3adff;
  color: #d3adff;
  width: 28px !important;
}

.key-cap.is-hold {
  justify-content: center;
  padding: 0 4px;
  background: #3a3a3a;
  border: 1px solid #888;
  border-radius: 2px;
  box-shadow: 0 1px 1px rgba(0,0,0,0.5);
  white-space: nowrap;
}

.key-cap.is-hold .key-text {
  margin: 0;
  padding: 0;
  background: transparent;
  color: #fff;
  font-size: 9px;
}

@keyframes perfect-link-pulse {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.35);
  }
}

.track-info.is-reorder-target {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.3);
}

.track-info.is-reorder-source {
  opacity: 0.5;
}

.track-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 24px;
  flex-shrink: 0;
  gap: 2px;
  color: #888;
}

.reorder-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: inherit;
}

.reorder-btn:hover {
  background-color: #444;
  color: #ccc;
}

.reorder-btn.disabled {
  opacity: 0.2;
  pointer-events: none;
}

.drag-handle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

/* ==========================================================================
   8. Character Selector Dialog
   ========================================================================== */
.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.15);
  flex-wrap: wrap;
  gap: 12px;
}

.header-left-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.element-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 100%;
}
.equipment-affix-filter-section {
  width: 100%;
}

.equipment-affix-filter-strip {
  --equipment-filter-cut: 10px;
  --equipment-filter-divider-skew: -18deg;

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  min-width: 0;
}

.equipment-filter-chip {
  --equipment-filter-cut-size: var(--equipment-filter-cut, 10px);

  height: 26px;
  min-width: 0;
  padding-left: 14px;
  padding-right: 14px;
  white-space: nowrap;
  clip-path: polygon(
      var(--equipment-filter-cut-size) 0,
      100% 0,
      calc(100% - var(--equipment-filter-cut-size)) 100%,
      0 100%
  );
}

.equipment-affix-filter-divider {
  position: relative;
  flex: 0 0 12px;
  width: 12px;
  height: 26px;
  opacity: 0.85;
}

.equipment-affix-filter-divider::before {
  content: '';
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 50%;
  width: 1px;
  background: linear-gradient(
      180deg,
      transparent,
      rgba(255, 255, 255, 0.32),
      transparent
  );
  transform: translateX(-50%) skewX(var(--equipment-filter-divider-skew));
  transform-origin: center;
}

.roster-scroll-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 8px;
  scrollbar-width: none;
}

.roster-scroll-container::-webkit-scrollbar {
  display: none;
}

/* 分组标题 */
.rarity-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  margin-bottom: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(30, 30, 30, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 10px 0;
}

.rarity-header:first-child {
  margin-top: 0;
}

.rarity-label {
  font-size: 15px;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 1px;
}

.rarity-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, currentColor 0%, transparent 100%);
  opacity: 0.4;
  margin-left: 8px;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.header-rarity-6 .rarity-label {
  background: linear-gradient(45deg, #FFD700, #FF8C00, #FF4500);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent !important;
}

.header-rarity-6 .rarity-line {
  background: linear-gradient(90deg,
  #FF4500 0%,
  #FF8C00 30%,
  #FFD700 60%,
  transparent 100%
  );
  opacity: 0.7;
  height: 2px;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.roster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.roster-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.roster-card:hover {
  transform: translateY(-4px);
}

/* 头像框 */
.card-avatar-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
  background: #111;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2px;
  box-sizing: border-box;
  overflow: hidden;
}

.equipment-roster-card .card-avatar-wrapper.is-ability-match-both {
  border-color: #ffd700 !important;
  box-shadow:
      0 0 0 2px rgba(255, 215, 0, 0.95),
      0 0 18px rgba(255, 215, 0, 0.55),
      inset 0 0 10px rgba(255, 215, 0, 0.2);
}

.card-avatar-wrapper > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.eq-affix-icon-stack {
  position: absolute;
  top: 3px;
  left: 3px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  z-index: 3;
  pointer-events: none;
}

.eq-affix-icon-cell {
  position: relative;
  width: 14px;
  height: 14px;
}

.eq-affix-icon-dot {
  position: absolute;
  inset: 4px;
  opacity: 1;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.9);
  background: transparent;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.55);
  transition: opacity 120ms ease;
}

.eq-affix-icon-cell.has-img:not(.img-failed) .eq-affix-icon-dot {
  opacity: 0;
}

.eq-affix-icon-cell.has-img.img-failed .eq-affix-icon-img {
  display: none;
}

.eq-affix-icon-cell.has-hollow-marker .eq-affix-icon-dot {
  opacity: 0;
}

.eq-affix-icon-hollow {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 7px;
  height: 7px;
  color: rgba(255, 255, 255, 0.92);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
}

.eq-affix-icon-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.55));
}

:global(.equipment-affix-tooltip-popper) {
  max-width: 320px;
}

:global(.equipment-affix-tooltip-popper.el-popper.is-dark) {
  background: #050505;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.72);
}

:global(.equipment-affix-tooltip-popper.el-popper.is-dark .el-popper__arrow::before) {
  background: #050505;
  border-color: rgba(255, 255, 255, 0.18);
}

:global(.equipment-affix-tooltip) {
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:global(.equipment-affix-tooltip-row) {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 22px;
}

:global(.equipment-affix-tooltip-icon) {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
}

:global(.equipment-affix-tooltip-marker) {
  width: 12px;
  height: 12px;
  justify-self: center;
  color: rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
}

:global(.equipment-affix-tooltip-label) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.9);
}

:global(.equipment-affix-tooltip-value) {
  color: #facc15;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.element-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 10, 14, 0.82);
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.16);
  z-index: 2;
  box-sizing: border-box;
  pointer-events: none;
}

.element-badge img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  display: block;
}

.card-name {
  margin-top: 8px;
  font-size: 11px;
  color: #aaa;
  text-align: center;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  letter-spacing: 0.3px;
}

.roster-card:hover .card-name {
  color: #fff;
}

/* 已上场状态 */
.in-team-tag {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  color: #ffd700;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 10px;
  letter-spacing: 1px;
  border: 1px solid rgba(255, 215, 0, 0.5);
  z-index: 5;
  pointer-events: none;
}

.in-team-tag::before {
  content: 'FIELDED';
  margin-bottom: 2px;
}

.in-team-tag.weapon-equipped::before {
  content: 'EQUIPPED';
}

.empty-roster {
  text-align: center;
  color: #555;
  padding: 30px;
  font-style: italic;
  font-size: 13px;
}

.rarity-6-style .card-avatar-wrapper {
  border: 1px solid transparent;
  background:
      linear-gradient(#111, #111) padding-box,
      linear-gradient(135deg, #FFD700, #FF8C00, #FF4500) border-box;
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.2);
}

.rarity-6-style:hover .card-avatar-wrapper {
  box-shadow: 0 0 15px rgba(255, 165, 0, 0.5);
  border-color: rgba(255, 215, 0, 0.8);
}

/* ==========================================================================
   9. Element Plus Overrides
   ========================================================================== */
:deep(.char-selector-dialog .el-dialog__body) {
  padding-top: 10px;
}
:deep(.char-selector-dialog .el-input__wrapper) {
  background-color: #2b2b2b;
  box-shadow: 0 0 0 1px #444 inset;
}
:deep(.char-selector-dialog .el-input__inner) {
  color: #fff;
}

/* ==========================================================================
   10. Align Guide Styles
   ========================================================================== */
.align-guide-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2000;
  overflow: visible;
}

.target-highlight-box {
  position: absolute;
  border: 1px solid;
  border-radius: 4px;
  pointer-events: none;
  background: currentColor;
  opacity: 0.1;
  box-sizing: border-box;
  transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.target-highlight-box::after {
  content: '';
  position: absolute;
  top: -2px; left: -2px; right: -2px; bottom: -2px;
  border: 1px solid inherit;
  border-radius: 5px;
  opacity: 0.6;
  animation: pulse-border 1.5s infinite;
  box-shadow: 0 0 8px currentColor;
}

/* ==========================================================================
   11. Cycle Guide Styles
   ========================================================================== */
.cycle-guide {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #d3adff;
  box-shadow: 0 0 6px #d3adff;
  pointer-events: auto;
  cursor: grab;
  z-index: 4;
  transition: background-color 0.1s, box-shadow 0.1s;
}

.cycle-guide:hover {
  width: 2px;
  background: #e0c4ff;
  box-shadow: 0 0 8px #e0c4ff;
}

.cycle-guide.is-selected {
  background: #fff;
  box-shadow: 0 0 8px #fff, 0 0 12px rgba(255, 255, 255, 0.5);
  z-index: 30;
  width: 2px;
}

.cycle-guide.is-selected .cycle-label-time {
  background: #fff;
  color: #000;
}

.cycle-guide.is-selected .cycle-label-text {
  color: #fff;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
}

.cycle-label-time {
  position: absolute;
  top: 0;
  left: 0;
  width: fit-content;
  background: #d3adff;
  color: #222;
  font-size: 10px;
  font-weight: bold;
  font-family: monospace;
  padding: 2px 4px;
  border-radius: 0 4px 4px 0;
  white-space: nowrap;
  line-height: 1;
  pointer-events: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.cycle-label-text {
  position: absolute;
  top: 16px;
  left: 0;
  width: fit-content;
  color: #d3adff;
  font-size: 10px;
  font-weight: bold;
  font-family: monospace;
  padding: 2px 4px;
  white-space: nowrap;
  line-height: 1;
  text-shadow: 0 0 2px rgba(211, 173, 255, 0.5);
  writing-mode: horizontal-tb;
  letter-spacing: normal;
  pointer-events: none;
}

.cycle-hit-area {
  position: absolute;
  left: -5px;
  top: 0;
  bottom: 0;
  width: 10px;
  background: transparent;
  cursor: grab;
  z-index: 20;
}
@keyframes pulse-border {
  0% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.02); }
  100% { opacity: 0.4; transform: scale(1); }
}

/* ==========================================================================
   12. Switch Marker Styles
   ========================================================================== */
.switch-marker-layer {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;
}
.switch-tag {
  position: absolute; top: -42px;
  display: flex; flex-direction: column; align-items: center;
  gap: 2px;
  pointer-events: auto; cursor: grab; z-index: 30; transform: translateX(-50%); transition: transform 0.1s;
}
.switch-tag.is-dragging {
  transition: none;
  cursor: grabbing;
}
.tag-avatar {
  width: 24px; height: 24px; border-radius: 50%; border: 2px solid #d3adff;
  background: #222; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}
.tag-avatar img { width: 100%; height: 100%; object-fit: cover; }
.tag-time {
  font-size: 9px;
  color: #f0dcff;
  font-weight: bold;
  background: rgba(24, 18, 30, 0.92);
  border: 1px solid rgba(211, 173, 255, 0.65);
  padding: 1px 5px;
  border-radius: 10px;
  line-height: 1.2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  box-shadow: 0 1px 4px rgba(0,0,0,0.35);
  white-space: nowrap;
}
.tag-pointer {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 7px solid #d3adff;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
}
.switch-tag.is-selected .tag-avatar {
  border-color: #fff; box-shadow: 0 0 8px #fff;
}
.switch-tag.is-selected .tag-time {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.85);
}
.switch-tag.is-selected .tag-pointer {
  border-top-color: #fff;
}

:global(body.is-dragging) {
  user-select: none !important;
  cursor: grabbing !important;
}
.guide-line-vertical {
  position: absolute;
  top: -100px;
  bottom: -100px;
  width: 1px;
  background: linear-gradient(to bottom,
  transparent,
  currentColor 20%,
  currentColor 80%,
  transparent
  );
  pointer-events: none;
  box-shadow: 0 0 6px currentColor;
  z-index: 2001;
  transition: left 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.guide-float-label {
  --arrow-color: transparent;
  position: absolute;
  padding: 4px 8px;
  border-radius: 20px;
  color: #000;
  font-weight: 800;
  font-size: 10px;
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 2002;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: left 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.15s ease-out;
  display: flex;
  align-items: center;
  gap: 4px;
}

.guide-float-label::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -4px;
  border-width: 4px;
  border-style: solid;
  border-color: var(--arrow-color) transparent transparent transparent;
}

.guide-icon {
  display: flex;
  align-items: center;
}

.guide-text {
  line-height: 1;
}

.global-freeze-layer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 0;
}

.freeze-region-dim {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  border-left: 1px dashed rgba(255, 255, 255, 0.2);
  border-right: 1px dashed rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  animation: fadeIn 0.2s ease-out;
  transition: left 0.1s, width 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;

  &.timeline {
    border: none;
    transition: none;
    background: repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.3),
      rgba(255, 255, 255, 0.3) 3px,
      rgba(255, 255, 255, 0.2) 3px,
      rgba(255, 255, 255, 0.2) 6px
    );
  }
}

.freeze-duration-label {
  color: rgba(255, 255, 255, 0.4);
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 0;
  user-select: none;
  pointer-events: none;
  white-space: nowrap;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 30px) {
  .freeze-duration-label {
    font-size: 10px;
    opacity: 0.1;
  }
}
</style>
