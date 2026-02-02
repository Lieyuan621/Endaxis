<script setup>
import { ref, computed, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { executeSave } from '@/api/saveStrategy.js'
import { CORE_STATS } from '@/utils/coreStats.js'
import { buildEffectBindingOptions } from '@/utils/effectBindingOptions.js'
import draggable from 'vuedraggable'

const store = useTimelineStore()
const { characterRoster, iconDatabase, enemyDatabase, enemyCategories, weaponDatabase, equipmentDatabase, equipmentCategories, equipmentCategoryConfigs, misc } = storeToRefs(store)

// === 常量定义 ===

const ELEMENTS = [
  { label: '灼热', value: 'blaze' },
  { label: '寒冷', value: 'cold' },
  { label: '电磁', value: 'emag' },
  { label: '自然', value: 'nature' },
  { label: '物理', value: 'physical' }
]

const VARIANT_TYPES = [
  { label: '重击', value: 'attack' },
  { label: '战技', value: 'skill' },
  { label: '连携', value: 'link' },
  { label: '终结技', value: 'ultimate' },
  { label: '处决', value: 'execution' }
]

const EFFECT_NAMES = {
  "break": "破防", "armor_break": "碎甲", "stagger": "猛击", "knockdown": "倒地", "knockup": "击飞",
  "blaze_attach": "灼热附着", "emag_attach": "电磁附着", "cold_attach": "寒冷附着", "nature_attach": "自然附着",
  "blaze_burst": "灼热爆发", "emag_burst": "电磁爆发", "cold_burst": "寒冷爆发", "nature_burst": "自然爆发",
  "burning": "燃烧", "conductive": "导电", "frozen": "冻结", "ice_shatter": "碎冰", "corrosion": "腐蚀",
  "default": "默认图标"
}

const WEAPON_TYPES = [
  { label: '单手剑', value: 'sword' },
  { label: '双手剑', value: 'claym' },
  { label: '长柄武器', value: 'lance' },
  { label: '手铳', value: 'pistol' },
  { label: '施术单元', value: 'funnel' }
]

const EQUIPMENT_SLOTS = [
  { label: '护甲', value: 'armor' },
  { label: '护手', value: 'gloves' },
  { label: '配件', value: 'accessory' }
]

const EQUIPMENT_LEVELS = [70, 50, 36, 20, 10]
const EQUIPMENT_LEVEL_COLORS = {
  70: '#ffd700',
  50: '#b37feb',
  36: '#4a90e2',
  20: '#95de64',
  10: '#888888'
}

function getEquipmentLevelColor(level) {
  const key = Number(level)
  return EQUIPMENT_LEVEL_COLORS[key] || '#555'
}

const ENEMY_TIERS = store.ENEMY_TIERS
const TIER_WEIGHTS = { 'boss': 4, 'champion': 3, 'elite': 2, 'normal': 1 }
const HIDDEN_CHECKBOX_KEYS = ['default']
const effectKeys = Object.keys(EFFECT_NAMES).filter(key => !HIDDEN_CHECKBOX_KEYS.includes(key))

// === 状态与计算属性 ===

const editingMode = ref('character') // 'character' | 'enemy' | 'weapon' | 'equipment' | 'misc'
const searchQuery = ref('')
const selectedCharId = ref(null)
const selectedEnemyId = ref(null)
const selectedWeaponId = ref(null)
const selectedEquipmentId = ref(null)
const miscSection = ref('stats') // 'stats' | 'weapon_table' | 'equipment_table' | 'equipment_categories' | 'enemy_categories'
const newEquipmentCategoryName = ref('')
const newEnemyCategoryName = ref('')
const activeTab = ref('basic')
const attackSegmentIndex = ref(0)
const variantAttackSegmentIndexList = ref([])

const ATTACK_SEGMENT_COUNT = 5

function ensureAttackSegments(char) {
  if (!char) return

  const isValidSeg = (seg) => {
    if (!seg || typeof seg !== 'object') return false
    if (seg.duration === undefined) return false
    if (seg.gaugeGain === undefined) return false
    if (seg.allowed_types === undefined) return false
    if (seg.anomalies === undefined) return false
    if (seg.damage_ticks === undefined) return false
    return true
  }

  const legacy = {
    duration: Number(char.attack_duration) || 0,
    gaugeGain: Number(char.attack_gaugeGain) || 0,
    allowed_types: Array.isArray(char.attack_allowed_types) ? [...char.attack_allowed_types] : [],
    anomalies: char.attack_anomalies ? JSON.parse(JSON.stringify(char.attack_anomalies)) : [],
    damage_ticks: char.attack_damage_ticks ? JSON.parse(JSON.stringify(char.attack_damage_ticks)) : []
  }

  const migrateFromLegacy = () => {
    const base = {
      duration: legacy.duration,
      gaugeGain: legacy.gaugeGain,
      allowed_types: [...legacy.allowed_types],
      anomalies: JSON.parse(JSON.stringify(legacy.anomalies)),
      damage_ticks: JSON.parse(JSON.stringify(legacy.damage_ticks)),
    }
    char.attack_segments = Array.from({ length: ATTACK_SEGMENT_COUNT }, (_, idx) => {
      if (idx === 0) return base
      return { ...JSON.parse(JSON.stringify(base)), duration: 0 }
    })
  }

  if (!Array.isArray(char.attack_segments)) {
    migrateFromLegacy()
    return
  }

  if (char.attack_segments.length !== ATTACK_SEGMENT_COUNT) {
    char.attack_segments = char.attack_segments.slice(0, ATTACK_SEGMENT_COUNT)
    while (char.attack_segments.length < ATTACK_SEGMENT_COUNT) {
      char.attack_segments.push({ duration: 0, gaugeGain: 0, allowed_types: [], anomalies: [], damage_ticks: [] })
    }
  }

  if (char.attack_segments.some(s => !isValidSeg(s))) {
    migrateFromLegacy()
    return
  }

  for (const seg of char.attack_segments) {
    seg.duration = Number(seg.duration) || 0
    seg.gaugeGain = Number(seg.gaugeGain) || 0
    if (!Array.isArray(seg.allowed_types)) seg.allowed_types = []
    if (!Array.isArray(seg.anomalies)) seg.anomalies = []
    if (!Array.isArray(seg.damage_ticks)) seg.damage_ticks = []
    if (seg.element !== undefined && typeof seg.element !== 'string') delete seg.element
    if (seg.icon !== undefined && typeof seg.icon !== 'string') delete seg.icon
  }
}

function syncVariantAttackSegmentIndexList() {
  const len = selectedChar.value?.variants?.length || 0
  const prev = Array.isArray(variantAttackSegmentIndexList.value) ? variantAttackSegmentIndexList.value : []
  const next = prev.slice(0, len).map(v => {
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    return Math.min(Math.max(Math.floor(n), 0), ATTACK_SEGMENT_COUNT - 1)
  })
  while (next.length < len) next.push(0)
  variantAttackSegmentIndexList.value = next
}

function deepClone(val) {
  return val ? JSON.parse(JSON.stringify(val)) : val
}

function createVariantAttackSegment(seed = {}, fallbackSeg = null) {
  const raw = (seed && typeof seed === 'object') ? seed : {}
  const fb = (fallbackSeg && typeof fallbackSeg === 'object') ? fallbackSeg : {}

  const allowedTypesRaw = raw.allowedTypes ?? fb.allowedTypes
  const physicalAnomalyRaw = raw.physicalAnomaly ?? fb.physicalAnomaly
  const damageTicksRaw = raw.damageTicks ?? fb.damageTicks

  const out = {
    duration: Number(raw.duration ?? fb.duration) || 0,
    gaugeGain: Number(raw.gaugeGain ?? fb.gaugeGain) || 0,
    allowedTypes: Array.isArray(allowedTypesRaw) ? [...allowedTypesRaw] : [],
    physicalAnomaly: deepClone(physicalAnomalyRaw) || [],
    damageTicks: deepClone(damageTicksRaw) || [],
  }

  const element = raw.element ?? fb.element
  if (element !== undefined) out.element = element
  const icon = raw.icon ?? fb.icon
  if (icon !== undefined) out.icon = icon

  normalizeDamageTicks(out.damageTicks)
  ensureEffectIds(out.physicalAnomaly)

  return out
}

function sanitizeVariantAttackSegmentInPlace(seg) {
  if (!seg || typeof seg !== 'object') return false
  seg.duration = Number(seg.duration) || 0
  seg.gaugeGain = Number(seg.gaugeGain) || 0
  if (!Array.isArray(seg.allowedTypes)) seg.allowedTypes = []
  if (!Array.isArray(seg.physicalAnomaly)) seg.physicalAnomaly = []
  if (!Array.isArray(seg.damageTicks)) seg.damageTicks = []
  if (seg.element !== undefined && typeof seg.element !== 'string') delete seg.element
  if (seg.icon !== undefined && typeof seg.icon !== 'string') delete seg.icon
  return true
}

function buildVariantAttackSegmentsFromBase(char) {
  if (!char) {
    return Array.from({ length: ATTACK_SEGMENT_COUNT }, () => createVariantAttackSegment({ duration: 0 }))
  }

  ensureAttackSegments(char)

  const baseList = Array.isArray(char.attack_segments) ? char.attack_segments : []
  const mapped = baseList.slice(0, ATTACK_SEGMENT_COUNT).map((seg) => createVariantAttackSegment({
    duration: Number(seg?.duration) || 0,
    gaugeGain: Number(seg?.gaugeGain) || 0,
    allowedTypes: Array.isArray(seg?.allowed_types) ? [...seg.allowed_types] : [],
    physicalAnomaly: deepClone(seg?.anomalies) || [],
    damageTicks: deepClone(seg?.damage_ticks) || [],
    element: seg?.element,
    icon: seg?.icon
  }))

  const fallback = mapped[0] || null
  while (mapped.length < ATTACK_SEGMENT_COUNT) mapped.push(createVariantAttackSegment({ duration: 0 }, fallback))
  return mapped
}

function ensureVariantAttackSegments(variant, char, { force = false } = {}) {
  if (!variant || variant.type !== 'attack') return

  if (force || !Array.isArray(variant.attackSegments)) {
    variant.attackSegments = buildVariantAttackSegmentsFromBase(char)
    return
  }

  if (variant.attackSegments.length > ATTACK_SEGMENT_COUNT) {
    variant.attackSegments.length = ATTACK_SEGMENT_COUNT
  }

  const fallback = variant.attackSegments[0] || null
  while (variant.attackSegments.length < ATTACK_SEGMENT_COUNT) {
    variant.attackSegments.push(createVariantAttackSegment({ duration: 0 }, fallback))
  }

  for (let i = 0; i < variant.attackSegments.length; i++) {
    const ok = sanitizeVariantAttackSegmentInPlace(variant.attackSegments[i])
    if (!ok) {
      variant.attackSegments[i] = createVariantAttackSegment({ duration: 0 }, fallback)
    }
  }
}

function getVariantAttackTotalDuration(variant) {
  if (!variant || variant.type !== 'attack') return 0
  ensureVariantAttackSegments(variant, selectedChar.value)
  const segs = Array.isArray(variant.attackSegments) ? variant.attackSegments : []
  const total = segs.reduce((acc, s) => acc + (Number(s?.duration) || 0), 0)
  return Math.round(total * 1000) / 1000
}

function getVariantAttackSegIndex(variantIdx) {
  const raw = variantAttackSegmentIndexList.value?.[variantIdx]
  const n = Number(raw)
  if (!Number.isFinite(n)) return 0
  return Math.min(Math.max(Math.floor(n), 0), ATTACK_SEGMENT_COUNT - 1)
}

function getVariantAllowedTypesRef(variant, variantIdx) {
  if (!variant) return []
  if (variant.type === 'attack') {
    ensureVariantAttackSegments(variant, selectedChar.value)
    const idx = getVariantAttackSegIndex(variantIdx)
    const seg = variant.attackSegments?.[idx]
    if (!seg.allowedTypes) seg.allowedTypes = []
    return seg.allowedTypes
  }
  if (!variant.allowedTypes) variant.allowedTypes = []
  return variant.allowedTypes
}

function getVariantPhysicalAnomalyRef(variant, variantIdx) {
  if (!variant) return []
  if (variant.type === 'attack') {
    ensureVariantAttackSegments(variant, selectedChar.value)
    const idx = getVariantAttackSegIndex(variantIdx)
    const seg = variant.attackSegments?.[idx]
    if (!seg.physicalAnomaly) seg.physicalAnomaly = []
    ensureEffectIds(seg.physicalAnomaly)
    return seg.physicalAnomaly
  }
  if (!variant.physicalAnomaly) variant.physicalAnomaly = []
  ensureEffectIds(variant.physicalAnomaly)
  return variant.physicalAnomaly
}

function getVariantDamageTicksRef(variant, variantIdx) {
  if (!variant) return []
  if (variant.type === 'attack') {
    ensureVariantAttackSegments(variant, selectedChar.value)
    const idx = getVariantAttackSegIndex(variantIdx)
    const seg = variant.attackSegments?.[idx]
    if (!seg.damageTicks) seg.damageTicks = []
    normalizeDamageTicks(seg.damageTicks)
    return seg.damageTicks
  }
  if (!variant.damageTicks) variant.damageTicks = []
  normalizeDamageTicks(variant.damageTicks)
  return variant.damageTicks
}


const filteredRoster = computed(() => {
  let list = characterRoster.value || []
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
  }
  return [...list].sort((a, b) => (b.rarity || 0) - (a.rarity || 0))
})

const groupedEnemies = computed(() => {
  let list = enemyDatabase.value || []

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(e => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
  }

  const groups = {}

  enemyCategories.value.forEach(cat => {
    groups[cat] = []
  })
  groups['未分类'] = []

  list.forEach(enemy => {
    const cat = enemy.category
    if (cat && groups[cat]) {
      groups[cat].push(enemy)
    } else {
      groups['未分类'].push(enemy)
    }
  })

  const result = []

  enemyCategories.value.forEach(cat => {
    if (groups[cat].length > 0) {
      groups[cat].sort((a, b) => (TIER_WEIGHTS[b.tier] || 0) - (TIER_WEIGHTS[a.tier] || 0))
      result.push({ name: cat, list: groups[cat] })
    }
  })

  if (groups['未分类'].length > 0) {
    groups['未分类'].sort((a, b) => (TIER_WEIGHTS[b.tier] || 0) - (TIER_WEIGHTS[a.tier] || 0))
    result.push({ name: '未分类', list: groups['未分类'] })
  }

  return result
})

const filteredWeapons = computed(() => {
  let list = weaponDatabase.value || []
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(w => (w.name || '').toLowerCase().includes(q) || (w.id || '').toLowerCase().includes(q))
  }
  const order = { sword: 1, claym: 2, lance: 3, pistol: 4, funnel: 5 }

  return [...list].sort((a, b) => {
    const rarityDiff = (b.rarity || 0) - (a.rarity || 0)
    if (rarityDiff !== 0) return rarityDiff
    return (order[a.type] || 99) - (order[b.type] || 99)
  })
})

const groupedWeapons = computed(() => {
  const groups = WEAPON_TYPES.map(t => ({ name: t.label.split(' ')[0], key: t.value, list: [] }))
  filteredWeapons.value.forEach(w => {
    const grp = groups.find(g => g.key === w.type) || groups[groups.length - 1]
    grp.list.push(w)
  })
  return groups.filter(g => g.list.length > 0)
})

const filteredEquipment = computed(() => {
  let list = equipmentDatabase.value || []
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(e => (e.name || '').toLowerCase().includes(q) || (e.id || '').toLowerCase().includes(q))
  }
  return list
})

const groupedEquipment = computed(() => {
  const groups = {}
  ;(equipmentCategories.value || []).forEach(cat => { groups[cat] = [] })
  groups['未分类'] = []

  filteredEquipment.value.forEach(eq => {
    const cat = eq.category
    if (cat && groups[cat]) groups[cat].push(eq)
    else groups['未分类'].push(eq)
  })

  const result = []
  ;(equipmentCategories.value || []).forEach(cat => {
    if (groups[cat].length > 0) result.push({ name: cat, list: groups[cat] })
  })
  if (groups['未分类'].length > 0) result.push({ name: '未分类', list: groups['未分类'] })

  return result
})

const selectedChar = computed(() => {
  return characterRoster.value.find(c => c.id === selectedCharId.value)
})

const currentAttackSegment = computed(() => {
  const char = selectedChar.value
  if (!char) return null
  if (!Array.isArray(char.attack_segments) || char.attack_segments.length === 0) return null
  const idx = Math.min(Math.max(attackSegmentIndex.value, 0), ATTACK_SEGMENT_COUNT - 1)
  return char.attack_segments[idx] || null
})

const attackTotalDuration = computed(() => {
  const char = selectedChar.value
  if (!char) return 0
  const list = Array.isArray(char.attack_segments) ? char.attack_segments : null
  if (!list) return Number(char.attack_duration) || 0
  const total = list.reduce((acc, seg) => acc + (Number(seg?.duration) || 0), 0)
  return Math.round(total * 1000) / 1000
})

function applyAttackSegmentToAll({ includeDuration = false } = {}) {
  const char = selectedChar.value
  if (!char) return
  ensureAttackSegments(char)

  const idx = Math.min(Math.max(attackSegmentIndex.value, 0), ATTACK_SEGMENT_COUNT - 1)
  const source = char.attack_segments[idx]
  if (!source) return

  const deepClone = (val) => (val ? JSON.parse(JSON.stringify(val)) : val)

  for (let i = 0; i < ATTACK_SEGMENT_COUNT; i++) {
    if (i === idx) continue
    const target = char.attack_segments[i]
    if (!target) continue

    if (includeDuration) {
      target.duration = Number(source.duration) || 0
    }

    target.gaugeGain = Number(source.gaugeGain) || 0
    target.allowed_types = Array.isArray(source.allowed_types) ? [...source.allowed_types] : []
    target.anomalies = deepClone(source.anomalies) || []
    target.damage_ticks = deepClone(source.damage_ticks) || []

    if (source.element !== undefined) target.element = source.element
    if (source.icon !== undefined) target.icon = source.icon
  }

  ElMessage.success(includeDuration ? '已覆盖到所有段（包含持续时间）' : '已覆盖到所有段（不含持续时间）')
}

const selectedEnemy = computed(() => {
  return enemyDatabase.value.find(e => e.id === selectedEnemyId.value)
})

const selectedWeapon = computed(() => {
  return weaponDatabase.value.find(w => w.id === selectedWeaponId.value)
})

const selectedEquipment = computed(() => {
  return equipmentDatabase.value.find(e => e.id === selectedEquipmentId.value)
})

const equipmentAffixEditorMounted = ref(false)
let equipmentAffixMountTimer = null

const selectedEquipmentAffixes = computed(() => {
  if (!selectedEquipment.value) return null
  if (!equipmentAffixEditorMounted.value) return null
  return selectedEquipment.value.affixes || null
})

const equipmentAffixColumns = computed(() => {
  const eq = selectedEquipment.value
  const is70 = Number(eq?.level) === 70
  return is70
    ? [
        { label: '初始', index: 0 },
        { label: '精锻1', index: 1 },
        { label: '精锻2', index: 2 },
        { label: '精锻3', index: 3 },
      ]
    : [{ label: '初始', index: 0 }]
})

const modifierDefs = computed(() => misc.value?.modifierDefs || [])
const weaponCommonModifiers = computed(() => misc.value?.weaponCommonModifiers || {})

const PRIMARY_STAT_IDS = ['strength', 'agility', 'intellect', 'will']
const primaryStatOptions = computed(() => {
  const coreMap = new Map(CORE_STATS.map(s => [s.id, s]))
  return PRIMARY_STAT_IDS.map(id => ({ value: id, label: coreMap.get(id)?.label || id }))
})

const equipmentModifierOptions = computed(() => {
  const map = new Map()
  for (const s of CORE_STATS) {
    map.set(s.id, { id: s.id, label: s.label, unit: s.unit })
  }
  for (const d of (modifierDefs.value || [])) {
    if (!d?.id) continue
    map.set(d.id, { id: d.id, label: d.label || d.id, unit: d.unit })
  }
  return [...map.values()].sort((a, b) => (a.label || '').localeCompare(b.label || ''))
})

const equipmentModifierOptionsV2 = computed(() => {
  return equipmentModifierOptions.value.map(o => ({ value: o.id, label: o.label }))
})

const availableCoreStatsToAdd = computed(() => {
  const existing = new Set((modifierDefs.value || []).map(d => d.id))
  return CORE_STATS.filter(s => !existing.has(s.id))
})

const collapsedEnemyGroups = ref(new Set())
const collapsedWeaponGroups = ref(new Set())
const collapsedEquipmentGroups = ref(new Set())

// === 生命周期 ===

function scheduleEquipmentAffixEditorMount() {
  if (equipmentAffixEditorMounted.value) return
  if (equipmentAffixMountTimer) return

  const start = () => {
    equipmentAffixMountTimer = null
    equipmentAffixEditorMounted.value = true
  }

  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    equipmentAffixMountTimer = window.requestIdleCallback(start, { timeout: 800 })
  } else {
    equipmentAffixMountTimer = setTimeout(start, 200)
  }
}

watch(characterRoster, (newList) => {
  if (newList && newList.length > 0 && !selectedCharId.value) {
    selectedCharId.value = newList[0].id
  }
}, { immediate: true })

watch(selectedCharId, () => {
  attackSegmentIndex.value = 0
  if (!selectedChar.value) return
  ensureAttackSegments(selectedChar.value)
  for (const seg of selectedChar.value.attack_segments || []) {
    normalizeDamageTicks(seg.damage_ticks)
    ensureEffectIds(seg.anomalies)
  }
  syncVariantAttackSegmentIndexList()
  if (selectedChar.value.variants) {
    selectedChar.value.variants.forEach(v => {
      if (v?.type === 'attack') ensureVariantAttackSegments(v, selectedChar.value)
    })
  }
})

watch(enemyDatabase, (newList) => {
  if (newList && newList.length > 0 && !selectedEnemyId.value) {
    selectedEnemyId.value = newList[0].id
  }
}, { immediate: true })

watch(weaponDatabase, (newList) => {
  if (newList && newList.length > 0 && !selectedWeaponId.value) {
    selectedWeaponId.value = newList[0].id
  }
}, { immediate: true })

watch(editingMode, (mode) => {
  if (mode === 'equipment') scheduleEquipmentAffixEditorMount()
})

watch(selectedWeapon, (w) => {
  if (!w) return
  if (!Array.isArray(w.commonSlots)) {
    w.commonSlots = [
      { modifierId: null, size: 'small' },
      { modifierId: null, size: 'small' }
    ]
  } else {
    while (w.commonSlots.length < 2) w.commonSlots.push({ modifierId: null, size: 'small' })
    w.commonSlots = w.commonSlots.slice(0, 2).map(s => ({
      modifierId: (typeof s?.modifierId === 'string' && s.modifierId.trim())
        ? s.modifierId.trim()
        : ((typeof s?.key === 'string' && s.key.trim()) ? s.key.trim() : null),
      size: (s?.size === 'large' || s?.size === 'medium' || s?.size === 'small') ? s.size : 'small'
    }))
  }
  if (!Array.isArray(w.buffBonuses)) w.buffBonuses = []
  w.buffBonuses = w.buffBonuses.map(b => ({
    modifierId: (typeof b?.modifierId === 'string' && b.modifierId.trim())
      ? b.modifierId.trim()
      : ((typeof b?.key === 'string' && b.key.trim()) ? b.key.trim() : null),
    values: normalizeArray9(b?.values)
  }))
}, { immediate: true })

watch(equipmentDatabase, (newList) => {
  if (newList && newList.length > 0 && !selectedEquipmentId.value) {
    selectedEquipmentId.value = newList[0].id
  }
}, { immediate: true })

watch([selectedEquipment, equipmentAffixEditorMounted], ([eq, mounted]) => {
  if (!mounted || !eq) return
  ensureEquipmentAffixes(eq)
}, { immediate: true })

watch(() => selectedEquipment.value?.category, (newCat) => {
  if (!newCat) return
  ensureEquipmentCategoryConfig(newCat)
}, { immediate: true })

// === 操作方法 ===

function setMode(mode) {
  editingMode.value = mode
  searchQuery.value = ''
  // 切换模式时自动选中第一个
  if (mode === 'enemy' && enemyDatabase.value && enemyDatabase.value.length > 0 && !selectedEnemyId.value) {
    selectedEnemyId.value = enemyDatabase.value[0].id
  } else if (mode === 'character' && characterRoster.value && characterRoster.value.length > 0 && !selectedCharId.value) {
    selectedCharId.value = characterRoster.value[0].id
  } else if (mode === 'weapon' && weaponDatabase.value && weaponDatabase.value.length > 0 && !selectedWeaponId.value) {
    selectedWeaponId.value = weaponDatabase.value[0].id
  } else if (mode === 'equipment' && equipmentDatabase.value && equipmentDatabase.value.length > 0 && !selectedEquipmentId.value) {
    selectedEquipmentId.value = equipmentDatabase.value[0].id
  } else if (mode === 'misc') {
    miscSection.value = 'stats'
  }
}

function handleAddNew() {
  if (editingMode.value === 'character') return addNewCharacter()
  if (editingMode.value === 'enemy') return addNewEnemy()
  if (editingMode.value === 'weapon') return addNewWeapon()
  if (editingMode.value === 'equipment') return addNewEquipment()
}

function ensureMiscRoot() {
  if (!misc.value) {
    misc.value = { modifierDefs: [], weaponCommonModifiers: {}, equipmentTemplates: {} }
  }
  if (!misc.value.modifierDefs) misc.value.modifierDefs = []
  if (!misc.value.weaponCommonModifiers) misc.value.weaponCommonModifiers = {}
  if (!misc.value.equipmentTemplates || typeof misc.value.equipmentTemplates !== 'object') misc.value.equipmentTemplates = {}
  if (!misc.value.equipmentTemplates.armor) misc.value.equipmentTemplates.armor = { primary1: [0, 0, 0, 0], primary2: [0, 0, 0, 0], primary1Single: [0, 0, 0, 0] }
  if (!misc.value.equipmentTemplates.gloves) misc.value.equipmentTemplates.gloves = { primary1: [0, 0, 0, 0], primary2: [0, 0, 0, 0], primary1Single: [0, 0, 0, 0] }
  if (!misc.value.equipmentTemplates.accessory) misc.value.equipmentTemplates.accessory = { primary1: [0, 0, 0, 0], primary2: [0, 0, 0, 0], primary1Single: [0, 0, 0, 0] }
}

function normalizeArray9(arr) {
  const list = Array.isArray(arr) ? arr.slice(0, 9) : []
  while (list.length < 9) list.push(0)
  return list.map(v => Number(v) || 0)
}

function normalizeArray4(arr) {
  const list = Array.isArray(arr) ? arr.slice(0, 4) : []
  while (list.length < 4) list.push(0)
  return list.map(v => Number(v) || 0)
}

function normalizeModifierDefs(defs) {
  const list = Array.isArray(defs) ? defs : []
  const seen = new Set()
  const out = []
  for (const def of list) {
    const id = typeof def?.id === 'string' ? def.id.trim() : (typeof def?.key === 'string' ? def.key.trim() : '')
    if (!id || seen.has(id)) continue
    const unit = def?.unit === 'percent' || def?.unit === 'flat' ? def.unit : 'flat'
    out.push({ id, label: (def?.label || id).toString(), unit, note: def?.note, domainTags: def?.domainTags })
    seen.add(id)
  }
  return out
}

function normalizeEquipmentAffixes(level, affixes) {
  const safe = (affixes && typeof affixes === 'object') ? affixes : {}
  const is70 = Number(level) === 70

  const normalizePrimary = (input, { defaultId = null } = {}) => {
    const raw = (input && typeof input === 'object') ? input : {}
    const modifierId = typeof raw.modifierId === 'string' && raw.modifierId.trim()
      ? raw.modifierId.trim()
      : (typeof raw.key === 'string' && raw.key.trim() ? raw.key.trim() : defaultId)

    const values = is70 ? normalizeArray4(raw.values) : [Number(Array.isArray(raw.values) ? raw.values[0] : raw.value) || 0]
    return { modifierId: modifierId || null, values }
  }

  const normalizeAdapter = (input) => {
    const raw = (input && typeof input === 'object') ? input : {}
    const ids = Array.isArray(raw.modifierIds) ? raw.modifierIds : (raw.modifierId ? [raw.modifierId] : [])
    const cleaned = []
    for (const id of ids) {
      if (typeof id !== 'string') continue
      const trimmed = id.trim()
      if (!trimmed) continue
      if (!cleaned.includes(trimmed)) cleaned.push(trimmed)
    }
    const values = is70 ? normalizeArray4(raw.values) : [Number(Array.isArray(raw.values) ? raw.values[0] : raw.value) || 0]
    return { modifierIds: cleaned, values }
  }

  return {
    primary1: normalizePrimary(safe.primary1),
    primary2: normalizePrimary(safe.primary2),
    adapter: normalizeAdapter(safe.adapter),
  }
}

function ensureEquipmentAffixes(eq) {
  if (!eq) return null
  const is70 = Number(eq.level) === 70
  const targetLen = is70 ? 4 : 1

  const ensureValues = (values, fillFrom = 0) => {
    const out = Array.isArray(values) ? values.slice() : []
    const base = Number(out[0] ?? fillFrom) || 0
    if (out.length === 0) out.push(base)
    if (out.length > targetLen) return out.slice(0, targetLen).map(v => Number(v) || 0)
    while (out.length < targetLen) out.push(base)
    return out.map(v => Number(v) || 0)
  }

  if (!eq.affixes || typeof eq.affixes !== 'object') {
    const legacy = (eq.affixes70 && typeof eq.affixes70 === 'object') ? eq.affixes70 : null
    const normalized = normalizeEquipmentAffixes(eq.level, legacy || null)
    eq.affixes = normalized
    return eq.affixes
  }

  if (!eq.affixes.primary1 || typeof eq.affixes.primary1 !== 'object') eq.affixes.primary1 = { modifierId: null, values: [] }
  if (!eq.affixes.primary2 || typeof eq.affixes.primary2 !== 'object') eq.affixes.primary2 = { modifierId: null, values: [] }
  if (!eq.affixes.adapter || typeof eq.affixes.adapter !== 'object') eq.affixes.adapter = { modifierIds: [], values: [] }

  eq.affixes.primary1.modifierId = (typeof eq.affixes.primary1.modifierId === 'string' && eq.affixes.primary1.modifierId.trim())
    ? eq.affixes.primary1.modifierId.trim()
    : null
  eq.affixes.primary2.modifierId = (typeof eq.affixes.primary2.modifierId === 'string' && eq.affixes.primary2.modifierId.trim())
    ? eq.affixes.primary2.modifierId.trim()
    : null

  if (!Array.isArray(eq.affixes.adapter.modifierIds)) eq.affixes.adapter.modifierIds = []
  eq.affixes.adapter.modifierIds = eq.affixes.adapter.modifierIds
    .filter(v => typeof v === 'string' && v.trim())
    .map(v => v.trim())

  eq.affixes.primary1.values = ensureValues(eq.affixes.primary1.values, 0)
  eq.affixes.primary2.values = ensureValues(eq.affixes.primary2.values, 0)
  eq.affixes.adapter.values = ensureValues(eq.affixes.adapter.values, 0)

  return eq.affixes
}

function ensureEquipmentTemplate(slotKey) {
  ensureMiscRoot()
  const mapKey = slotKey === 'armor' ? 'armor' : (slotKey === 'gloves' ? 'gloves' : (slotKey === 'accessory' ? 'accessory' : null))
  if (!mapKey) return null
  return misc.value.equipmentTemplates?.[mapKey] || null
}

async function applyEquipmentTemplate(eq) {
  if (!eq || Number(eq.level) !== 70) return
  const t = ensureEquipmentTemplate(eq.slot)
  if (!t) return
  const aff = ensureEquipmentAffixes(eq)
  if (!aff) return

  const hasSecond = !!aff.primary2?.modifierId
  const templateValues = hasSecond
    ? [...normalizeArray4(t.primary1), ...normalizeArray4(t.primary2)]
    : normalizeArray4(t.primary1Single)

  const templateHasNonZero = templateValues.some(v => (Number(v) || 0) !== 0)
  if (!templateHasNonZero) {
    const currentValues = hasSecond
      ? [...normalizeArray4(aff.primary1.values), ...normalizeArray4(aff.primary2.values)]
      : normalizeArray4(aff.primary1.values)
    const currentHasNonZero = currentValues.some(v => (Number(v) || 0) !== 0)
    if (currentHasNonZero) {
      try {
        await ElMessageBox.confirm('模板数值全为 0，会清空当前数值，是否继续？', '提示', {
          confirmButtonText: '继续',
          cancelButtonText: '取消',
          type: 'warning',
        })
      } catch {
        return
      }
    }
  }

  if (hasSecond) {
    aff.primary1.values = normalizeArray4(t.primary1)
    aff.primary2.values = normalizeArray4(t.primary2)
  } else {
    aff.primary1.values = normalizeArray4(t.primary1Single)
    aff.primary2.values = [0, 0, 0, 0]
  }
}

function ensureWeaponCommonEntry(key) {
  if (!key) return null
  ensureMiscRoot()
  if (!misc.value.weaponCommonModifiers[key]) {
    misc.value.weaponCommonModifiers[key] = {
      small: Array(9).fill(0),
      medium: Array(9).fill(0),
      large: Array(9).fill(0),
    }
  }
  return misc.value.weaponCommonModifiers[key]
}

function selectChar(id) {
  selectedCharId.value = id
  activeTab.value = 'basic'
}

function selectEnemy(id) {
  selectedEnemyId.value = id
}

function selectWeapon(id) {
  selectedWeaponId.value = id
}

function selectEquipment(id) {
  selectedEquipmentId.value = id
}

function updateEnemyId(event) {
  const newId = event.target.value
  if (!newId) {
    event.target.value = selectedEnemy.value.id
    return
  }
  if (selectedEnemy.value) selectedEnemy.value.id = newId
  selectedEnemyId.value = newId
}

function updateCharId(event) {
  const newId = event.target.value
  if (!newId) {
    event.target.value = selectedChar.value.id
    return
  }
  if (selectedChar.value) selectedChar.value.id = newId
  selectedCharId.value = newId
}

function updateWeaponId(event) {
  const newId = event.target.value
  if (!newId) {
    event.target.value = selectedWeapon.value.id
    return
  }
  if (selectedWeapon.value) selectedWeapon.value.id = newId
  selectedWeaponId.value = newId
}

function updateEquipmentId(event) {
  const newId = event.target.value
  if (!newId) {
    event.target.value = selectedEquipment.value.id
    return
  }
  if (selectedEquipment.value) selectedEquipment.value.id = newId
  selectedEquipmentId.value = newId
}

function addNewCharacter() {
  const newId = `char_${Date.now()}`
  const allGlobalEffects = [...effectKeys]

  const newChar = {
    id: newId, name: "新干员", rarity: 5, element: "physical", weapon: "sword", avatar: "/avatars/default.webp", exclusive_buffs: [],
    accept_team_gauge: true,

    // 初始化各类动作属性
    attack_segments: Array.from({ length: ATTACK_SEGMENT_COUNT }, (_, idx) => ({
      duration: idx === 0 ? 2.5 : 0,
      gaugeGain: 0,
      allowed_types: allGlobalEffects,
      anomalies: [],
      damage_ticks: []
    })),
    skill_duration: 2, skill_spCost: 100, skill_gaugeGain: 0, skill_teamGaugeGain: 0, skill_allowed_types: [], skill_anomalies: [], skill_damage_ticks: [], skill_icon: "",
    link_duration: 1.5, link_cooldown: 15, link_gaugeGain: 0, link_allowed_types: [], link_anomalies: [], link_damage_ticks: [], link_icon: "",
    ultimate_duration: 3, ultimate_gaugeMax: 100, ultimate_gaugeReply: 0, ultimate_enhancementTime: 0, ultimate_allowed_types: [], ultimate_anomalies: [], ultimate_damage_ticks: [], ultimate_animationTime: 1.5, ultimate_icon: "",
    execution_duration: 1.5, execution_allowed_types: allGlobalEffects, execution_anomalies: [], execution_damage_ticks: [],
    dodge_duration: 0.5,

    variants: []
  }

  characterRoster.value.unshift(newChar)
  selectedCharId.value = newId
  ElMessage.success('已添加新干员')
}

function addNewEnemy() {
  const newId = `enemy_${Date.now()}`
  const newEnemy = {
    id: newId,
    name: '新敌人',
    avatar: '/Icon_Enemy/default_enemy.webp',
    maxStagger: 100,
    staggerNodeCount: 0,
    staggerNodeDuration: 2,
    staggerBreakDuration: 10,
    executionRecovery: 20,
    category: enemyCategories.value[0] || '',
    tier: 'normal'
  }
  if (!enemyDatabase.value) enemyDatabase.value = []
  enemyDatabase.value.push(newEnemy)
  selectedEnemyId.value = newId
  ElMessage.success('已添加新敌人')
}

function addNewWeapon() {
  const newId = `wp_${Date.now()}`
  const newWeapon = {
    id: newId,
    name: '新武器',
    buffName: '',
    type: 'sword',
    rarity: 3,
    duration: 0,
    icon: '/weapons/default.webp',
    commonSlots: [
      { modifierId: null, size: 'small' },
      { modifierId: null, size: 'small' }
    ],
    buffBonuses: []
  }
  if (!weaponDatabase.value) weaponDatabase.value = []
  weaponDatabase.value.push(newWeapon)
  selectedWeaponId.value = newId
  ElMessage.success('已添加新武器')
}

function addNewEquipment() {
  const newId = `eq_${Date.now()}`
  const category = equipmentCategories.value?.[0] || ''
  const newEquipment = {
    id: newId,
    name: '新装备',
    category,
    slot: 'armor',
    level: 70,
    icon: '/equipment/default.webp'
  }
  if (!equipmentDatabase.value) equipmentDatabase.value = []
  equipmentDatabase.value.push(newEquipment)
  selectedEquipmentId.value = newId

  if (category && !equipmentCategoryConfigs.value?.[category]) {
    equipmentCategoryConfigs.value[category] = { setBonus: { duration: 0 } }
  }

  ElMessage.success('已添加新装备')
}

function addCoreModifierDef(statId) {
  if (!statId) return
  ensureMiscRoot()
  if (modifierDefs.value.some(d => d.id === statId)) return
  const core = CORE_STATS.find(s => s.id === statId)
  const newDef = { id: statId, label: core ? `${core.label}提升` : '新属性', unit: core?.unit || 'flat' }
  misc.value.modifierDefs.push(newDef)
  ensureWeaponCommonEntry(statId)
  if (miscSection.value === 'weapon_table') {
    selectedWeaponTableModifierId.value = statId
  }
}

function removeModifierDef(id) {
  if (!id) return
  ElMessageBox.confirm('确定要移除此属性吗？已配置到武器的引用会被清空。', '提示', {
    confirmButtonText: '移除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const idx = misc.value.modifierDefs.findIndex(d => d.id === id)
    if (idx !== -1) misc.value.modifierDefs.splice(idx, 1)

    if (misc.value.weaponCommonModifiers && misc.value.weaponCommonModifiers[id]) {
      delete misc.value.weaponCommonModifiers[id]
    }

    for (const w of weaponDatabase.value || []) {
      if (Array.isArray(w.commonSlots)) {
        w.commonSlots.forEach(slot => { if ((slot?.modifierId || slot?.key) === id) slot.modifierId = null })
      }
      if (Array.isArray(w.buffBonuses)) {
        w.buffBonuses = w.buffBonuses.filter(b => (b?.modifierId || b?.key) !== id)
      }
    }

  }).catch(() => {})
}

function addEquipmentCategory() {
  const name = (newEquipmentCategoryName.value || '').trim()
  if (!name) {
    ElMessage.warning('分类名称不能为空')
    return
  }
  if (equipmentCategories.value.includes(name)) {
    ElMessage.warning('该分类已存在')
    return
  }
  equipmentCategories.value.push(name)
  if (!equipmentCategoryConfigs.value?.[name]) {
    equipmentCategoryConfigs.value[name] = { setBonus: { duration: 0 } }
  }
  newEquipmentCategoryName.value = ''
  ElMessage.success(`已添加分类：${name}`)
}

function deleteEquipmentCategory(name) {
  if (!name) return
  ElMessageBox.confirm(`确定要删除装备分类 "${name}" 吗？该分类下的装备会变为未分类。`, '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    for (const eq of equipmentDatabase.value || []) {
      if (eq.category === name) eq.category = ''
    }
    const idx = equipmentCategories.value.indexOf(name)
    if (idx !== -1) equipmentCategories.value.splice(idx, 1)
    if (equipmentCategoryConfigs.value?.[name]) delete equipmentCategoryConfigs.value[name]
  }).catch(() => {})
}

function addEnemyCategory() {
  const name = (newEnemyCategoryName.value || '').trim()
  if (!name) {
    ElMessage.warning('分类名称不能为空')
    return
  }
  if (enemyCategories.value.includes(name)) {
    ElMessage.warning('该分类已存在')
    return
  }
  enemyCategories.value.push(name)
  newEnemyCategoryName.value = ''
  ElMessage.success(`已添加分类：${name}`)
}

function deleteEnemyCategory(name) {
  if (!name) return
  ElMessageBox.confirm(`确定要删除敌人分类 "${name}" 吗？该分类下的敌人会变为未分类。`, '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    for (const enemy of enemyDatabase.value || []) {
      if (enemy.category === name) enemy.category = ''
    }
    const idx = enemyCategories.value.indexOf(name)
    if (idx !== -1) enemyCategories.value.splice(idx, 1)
  }).catch(() => {})
}

function addWeaponBuffBonusRow() {
  if (!selectedWeapon.value) return
  if (!Array.isArray(selectedWeapon.value.buffBonuses)) selectedWeapon.value.buffBonuses = []
  selectedWeapon.value.buffBonuses.push({
    modifierId: null,
    values: Array(9).fill(0)
  })
}

function removeWeaponBuffBonusRow(index) {
  if (!selectedWeapon.value) return
  if (!Array.isArray(selectedWeapon.value.buffBonuses)) return
  selectedWeapon.value.buffBonuses.splice(index, 1)
}

function deleteCurrentCharacter() {
  if (!selectedChar.value) return
  ElMessageBox.confirm(`确定要删除干员 "${selectedChar.value.name}" 吗？`, '警告', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    const idx = characterRoster.value.findIndex(c => c.id === selectedCharId.value)
    if (idx !== -1) {
      characterRoster.value.splice(idx, 1)
      if (characterRoster.value.length > 0) selectedCharId.value = characterRoster.value[0].id
      else selectedCharId.value = null
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

function deleteCurrentEnemy() {
  if (!selectedEnemy.value) return
  ElMessageBox.confirm(`确定要删除敌人 "${selectedEnemy.value.name}" 吗？`, '警告', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    const idx = enemyDatabase.value.findIndex(e => e.id === selectedEnemyId.value)
    if (idx !== -1) {
      enemyDatabase.value.splice(idx, 1)
      selectedEnemyId.value = enemyDatabase.value.length > 0 ? enemyDatabase.value[0].id : null
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

function deleteCurrentWeapon() {
  if (!selectedWeapon.value) return
  ElMessageBox.confirm(`确定要删除武器 "${selectedWeapon.value.name}" 吗？`, '警告', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    const idx = weaponDatabase.value.findIndex(w => w.id === selectedWeaponId.value)
    if (idx !== -1) {
      weaponDatabase.value.splice(idx, 1)
      selectedWeaponId.value = weaponDatabase.value.length > 0 ? weaponDatabase.value[0].id : null
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

function deleteCurrentEquipment() {
  if (!selectedEquipment.value) return
  ElMessageBox.confirm(`确定要删除装备 "${selectedEquipment.value.name}" 吗？`, '警告', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    const idx = equipmentDatabase.value.findIndex(e => e.id === selectedEquipmentId.value)
    if (idx !== -1) {
      equipmentDatabase.value.splice(idx, 1)
      selectedEquipmentId.value = equipmentDatabase.value.length > 0 ? equipmentDatabase.value[0].id : null
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

function toggleEnemyGroup(name) {
  const set = collapsedEnemyGroups.value
  if (set.has(name)) set.delete(name); else set.add(name)
}

function isEnemyGroupCollapsed(name) {
  return collapsedEnemyGroups.value.has(name)
}

function toggleWeaponGroup(name) {
  const set = collapsedWeaponGroups.value
  if (set.has(name)) set.delete(name); else set.add(name)
}

function isWeaponGroupCollapsed(name) {
  return collapsedWeaponGroups.value.has(name)
}

function toggleEquipmentGroup(name) {
  const set = collapsedEquipmentGroups.value
  if (set.has(name)) set.delete(name); else set.add(name)
}

function isEquipmentGroupCollapsed(name) {
  return collapsedEquipmentGroups.value.has(name)
}

function ensureEquipmentCategoryConfig(category) {
  if (!category) return
  if (!equipmentCategoryConfigs.value) equipmentCategoryConfigs.value = {}
  if (!equipmentCategoryConfigs.value[category]) {
    equipmentCategoryConfigs.value[category] = { setBonus: { duration: 0 } }
    return
  }
  if (!equipmentCategoryConfigs.value[category].setBonus) {
    equipmentCategoryConfigs.value[category].setBonus = { duration: 0 }
    return
  }
  if (equipmentCategoryConfigs.value[category].setBonus.duration === undefined) {
    equipmentCategoryConfigs.value[category].setBonus.duration = 0
  }
}

function getCategorySetBonusDuration(category) {
  ensureEquipmentCategoryConfig(category)
  const raw = equipmentCategoryConfigs.value?.[category]?.setBonus?.duration
  const num = Number(raw)
  return Number.isFinite(num) ? Math.max(0, num) : 0
}

function setCategorySetBonusDuration(category, value) {
  ensureEquipmentCategoryConfig(category)
  const num = Number(value)
  equipmentCategoryConfigs.value[category].setBonus.duration = Number.isFinite(num) ? Math.max(0, num) : 0
}

// === 判定点逻辑 (Damage Ticks) ===
function getDamageTicks(char, type) {
  if (!char) return []

  if (type === 'attack') {
    const idx = Math.min(Math.max(attackSegmentIndex.value, 0), ATTACK_SEGMENT_COUNT - 1)
    const seg = Array.isArray(char.attack_segments) ? char.attack_segments[idx] : null
    return Array.isArray(seg?.damage_ticks) ? seg.damage_ticks : []
  }

  const key = `${type}_damage_ticks`
  if (!char[key]) char[key] = []
  normalizeDamageTicks(char[key])
  return char[key]
}

function addDamageTick(char, type) {
  if (!char) return
  if (type === 'attack') {
    ensureAttackSegments(char)
    const idx = Math.min(Math.max(attackSegmentIndex.value, 0), ATTACK_SEGMENT_COUNT - 1)
    const seg = char.attack_segments[idx]
    if (!Array.isArray(seg.damage_ticks)) seg.damage_ticks = []
    normalizeDamageTicks(seg.damage_ticks)
    seg.damage_ticks.push({ offset: 0, stagger: 0, sp: 0, boundEffects: [] })
    return
  }

  const list = getDamageTicks(char, type)
  // 默认判定点：0秒时，造成0失衡，回复0技力
  list.push({ offset: 0, stagger: 0, sp: 0, boundEffects: [] })
}

function removeDamageTick(char, type, index) {
  if (!char) return
  if (type === 'attack') {
    ensureAttackSegments(char)
    const idx = Math.min(Math.max(attackSegmentIndex.value, 0), ATTACK_SEGMENT_COUNT - 1)
    const seg = char.attack_segments[idx]
    if (!Array.isArray(seg.damage_ticks)) seg.damage_ticks = []
    seg.damage_ticks.splice(index, 1)
    return
  }

  const list = getDamageTicks(char, type)
  list.splice(index, 1)
}

function normalizeDamageTicks(list = []) {
  list.forEach(tick => {
    if (!tick.boundEffects) tick.boundEffects = []
  })
}


// === 变体动作核心逻辑 ===

function getSnapshotFromBase(char, type) {
  if (type === 'attack') {
    const attackSegments = buildVariantAttackSegmentsFromBase(char)
    const totalDuration = attackSegments.reduce((acc, s) => acc + (Number(s?.duration) || 0), 0)
    return { duration: totalDuration, attackSegments }
  }

  // 基础数值
  const snapshot = {
    duration: char[`${type}_duration`] || 1,
    element: char[`${type}_element`] || undefined,
    icon: char[`${type}_icon`] || "",
    allowedTypes: char[`${type}_allowed_types`] ? [...char[`${type}_allowed_types`]] : [],
    physicalAnomaly: char[`${type}_anomalies`] ? JSON.parse(JSON.stringify(char[`${type}_anomalies`])) : [],
    damageTicks: char[`${type}_damage_ticks`] ? JSON.parse(JSON.stringify(char[`${type}_damage_ticks`])) : []
  }

  if (type === 'skill') {
    snapshot.spCost = char.skill_spCost || 0
    snapshot.gaugeGain = char.skill_gaugeGain || 0
    snapshot.teamGaugeGain = char.skill_teamGaugeGain || 0
  }
  else if (type === 'link') {
    snapshot.cooldown = char.link_cooldown || 0
    snapshot.gaugeGain = char.link_gaugeGain || 0
  }
  else if (type === 'ultimate') {
    snapshot.gaugeCost = char.ultimate_gaugeMax || 0
    snapshot.gaugeGain = char.ultimate_gaugeReply || 0
    snapshot.enhancementTime = char.ultimate_enhancementTime || 0
    snapshot.animationTime = char.ultimate_animationTime || 0
  }
  return snapshot
}

function addVariant() {
  if (!selectedChar.value.variants) selectedChar.value.variants = []

  const defaultType = 'attack'
  const baseStats = getSnapshotFromBase(selectedChar.value, defaultType)

  selectedChar.value.variants.push({
    id: `v_${Date.now()}`,
    name: '强化重击',
    type: defaultType,
    ...baseStats
  })
  syncVariantAttackSegmentIndexList()
}

function removeVariant(idx) {
  if (selectedChar.value.variants) {
    selectedChar.value.variants.splice(idx, 1)
  }
  syncVariantAttackSegmentIndexList()
}

function onVariantTypeChange(variant, variantIdx) {
  if (!selectedChar.value) return
  const newStats = getSnapshotFromBase(selectedChar.value, variant.type)
  Object.assign(variant, newStats)

  if (variant.type === 'attack') {
    ensureVariantAttackSegments(variant, selectedChar.value, { force: true })
    syncVariantAttackSegmentIndexList()
    if (variantIdx !== undefined && variantIdx !== null) {
      variantAttackSegmentIndexList.value[variantIdx] = 0
    }
  } else {
    delete variant.attackSegments
  }

  if (variant.name === '新强化技能' || variant.name.startsWith('强化')) {
    const typeObj = VARIANT_TYPES.find(t => t.value === variant.type)
    if (typeObj) {
      const labelName = typeObj.label
      variant.name = `强化${labelName}`
    }
  }
}

// === 变体Checkbox逻辑 ===

function onVariantCheckChange(variant, variantIdx, key) {
  const list = getVariantAllowedTypesRef(variant, variantIdx)
  const isChecked = list.includes(key)
  handleGroupCheck(list, isChecked, key)
}

function onCheckChange(char, skillType, key) {
  if (!char) return

  if (skillType === 'attack') {
    ensureAttackSegments(char)
    const idx = Math.min(Math.max(attackSegmentIndex.value, 0), ATTACK_SEGMENT_COUNT - 1)
    const seg = char.attack_segments[idx]
    if (!seg.allowed_types) seg.allowed_types = []
    const list = seg.allowed_types
    const isChecked = list.includes(key)
    handleGroupCheck(list, isChecked, key)
    return
  }

  const fieldName = `${skillType}_allowed_types`
  if (!char[fieldName]) char[fieldName] = []
  const list = char[fieldName]
  const isChecked = list.includes(key)
  handleGroupCheck(list, isChecked, key)
}

function handleGroupCheck(list, isChecked, key) {
  const elementalGroups = [
    ['burning', 'blaze_attach', 'blaze_burst'],
    ['conductive', 'emag_attach', 'emag_burst'],
    ['frozen', 'cold_attach', 'cold_burst'],
    ['corrosion', 'nature_attach', 'nature_burst']
  ]
  const group = elementalGroups.find(g => g.includes(key))
  if (group) {
    if (isChecked) {
      group.forEach(item => { if (!list.includes(item)) list.push(item) })
    }
  }

  const physicalGroup = ['stagger', 'armor_break', 'knockup', 'knockdown'];
  const physicalBase = ['break', 'ice_shatter'];
  if (isChecked && physicalGroup.includes(key)) {
    physicalBase.forEach(baseItem => {
      if (!list.includes(baseItem)) list.push(baseItem);
    });
  }
}

function generateEffectId() {
  return Math.random().toString(36).substring(2, 9)
}

function createEffect(defaultType = 'default') {
  return { _id: generateEffectId(), type: defaultType, stacks: 1, duration: 0, offset: 0 }
}

function ensureEffectIds(rows) {
  if (!rows || rows.length === 0) return
  const normalized = Array.isArray(rows[0]) ? rows : [rows]
  normalized.forEach(row => {
    row.forEach(effect => {
      if (effect && !effect._id) effect._id = generateEffectId()
    })
  })
}

function getEffectDisplayName(type) {
  if (EFFECT_NAMES[type]) return EFFECT_NAMES[type]
  const exclusive = selectedChar.value?.exclusive_buffs?.find(b => b.key === type)
  if (exclusive?.name) return exclusive.name
  return type || 'Unknown'
}

function getEffectIconPath(type) {
  const exclusive = selectedChar.value?.exclusive_buffs?.find(b => b.key === type)
  if (exclusive?.path) return exclusive.path
  return iconDatabase.value?.[type] || iconDatabase.value?.default || ''
}

function getVariantAvailableOptions(variant, variantIdx) {
  const allowedList = getVariantAllowedTypesRef(variant, variantIdx)
  const combinedKeys = new Set([...allowedList, 'default'])
  return buildOptions(combinedKeys)
}

function getAvailableAnomalyOptions(skillType) {
  if (!selectedChar.value) return []
  if (skillType === 'attack') {
    const idx = Math.min(Math.max(attackSegmentIndex.value, 0), ATTACK_SEGMENT_COUNT - 1)
    const seg = Array.isArray(selectedChar.value.attack_segments) ? selectedChar.value.attack_segments[idx] : null
    const allowedList = seg?.allowed_types || []
    const combinedKeys = new Set([...allowedList, 'default'])
    return buildOptions(combinedKeys)
  }

  const allowedList = selectedChar.value[`${skillType}_allowed_types`] || []
  const combinedKeys = new Set([...allowedList, 'default'])
  return buildOptions(combinedKeys)
}

function buildOptions(keysSet) {
  return Array.from(keysSet).map(key => {
    if (EFFECT_NAMES[key]) return { label: EFFECT_NAMES[key], value: key }
    const exclusive = selectedChar.value?.exclusive_buffs.find(b => b.key === key)
    if (exclusive) return { label: `★ ${exclusive.name}`, value: key }
    return { label: key, value: key }
  })
}

function buildBindingOptionsFromAnomalies(raw) {
  if (!raw || raw.length === 0) return []
  ensureEffectIds(raw)
  return buildEffectBindingOptions(raw, { getEffectName: (type) => getEffectDisplayName(type) })
}

function getBindingOptions(skillType) {
  if (!selectedChar.value) return []
  if (skillType === 'attack') {
    const idx = Math.min(Math.max(attackSegmentIndex.value, 0), ATTACK_SEGMENT_COUNT - 1)
    const seg = Array.isArray(selectedChar.value.attack_segments) ? selectedChar.value.attack_segments[idx] : null
    const raw = seg?.anomalies
    return buildBindingOptionsFromAnomalies(raw)
  }

  const raw = selectedChar.value[`${skillType}_anomalies`]
  return buildBindingOptionsFromAnomalies(raw)
}

function getVariantBindingOptions(variant, variantIdx) {
  if (!variant) return []
  const raw = getVariantPhysicalAnomalyRef(variant, variantIdx)
  return buildBindingOptionsFromAnomalies(raw)
}

// === 二维数组通用处理逻辑 ===

function getAnomalyRows(char, skillType) {
  if (!char) return []
  if (skillType === 'attack') {
    const idx = Math.min(Math.max(attackSegmentIndex.value, 0), ATTACK_SEGMENT_COUNT - 1)
    const seg = Array.isArray(char.attack_segments) ? char.attack_segments[idx] : null
    const raw = seg?.anomalies || []
    if (raw.length === 0) return []
    if (!Array.isArray(raw[0])) return [raw]
    return raw
  }

  const key = `${skillType}_anomalies`
  const raw = char[key] || []
  if (raw.length === 0) return []
  ensureEffectIds(raw)
  if (!Array.isArray(raw[0])) return [raw]
  return raw
}

function addAnomalyRow(char, skillType) {
  if (!char) return

  if (skillType === 'attack') {
    ensureAttackSegments(char)
    const idx = Math.min(Math.max(attackSegmentIndex.value, 0), ATTACK_SEGMENT_COUNT - 1)
    const seg = char.attack_segments[idx]
    let rows = getAnomalyRows(char, skillType)
    if (!seg.anomalies || (seg.anomalies.length > 0 && !Array.isArray(seg.anomalies[0]))) {
      seg.anomalies = rows
    }
    const allowedList = seg.allowed_types || []
    const defaultType = allowedList.length > 0 ? allowedList[0] : 'default'
    seg.anomalies.push([createEffect(defaultType)])
    return
  }

  const key = `${skillType}_anomalies`
  let rows = getAnomalyRows(char, skillType)
  if (!char[key] || (char[key].length > 0 && !Array.isArray(char[key][0]))) {
    char[key] = rows
  }
  const allowedList = char[`${skillType}_allowed_types`] || []
  const defaultType = allowedList.length > 0 ? allowedList[0] : 'default'
  char[key].push([createEffect(defaultType)])
}

function addAnomalyToRow(char, skillType, rowIndex) {
  const rows = getAnomalyRows(char, skillType)

  if (skillType === 'attack') {
    ensureAttackSegments(char)
    const idx = Math.min(Math.max(attackSegmentIndex.value, 0), ATTACK_SEGMENT_COUNT - 1)
    const seg = char.attack_segments[idx]
    const allowedList = seg.allowed_types || []
    const defaultType = allowedList.length > 0 ? allowedList[0] : 'default'
    if (rows[rowIndex]) {
      rows[rowIndex].push(createEffect(defaultType))
    }
    return
  }

  const allowedList = char[`${skillType}_allowed_types`] || []
  const defaultType = allowedList.length > 0 ? allowedList[0] : 'default'
  if (rows[rowIndex]) {
    rows[rowIndex].push(createEffect(defaultType))
  }
}

function removeAnomaly(char, skillType, rowIndex, colIndex) {
  const rows = getAnomalyRows(char, skillType)
  if (rows[rowIndex]) {
    rows[rowIndex].splice(colIndex, 1)
    if (rows[rowIndex].length === 0) {
      rows.splice(rowIndex, 1)
    }
  }
}

// 变体里的矩阵操作
function addVariantRow(variant, variantIdx) {
  const anomalies = getVariantPhysicalAnomalyRef(variant, variantIdx)
  const allowedTypes = getVariantAllowedTypesRef(variant, variantIdx)
  const defaultType = (allowedTypes && allowedTypes.length > 0) ? allowedTypes[0] : 'default'
  anomalies.push([createEffect(defaultType)])
}

function addVariantEffect(variant, variantIdx, rowIndex) {
  const anomalies = getVariantPhysicalAnomalyRef(variant, variantIdx)
  const allowedTypes = getVariantAllowedTypesRef(variant, variantIdx)
  if (anomalies && anomalies[rowIndex]) {
    const defaultType = (allowedTypes && allowedTypes.length > 0) ? allowedTypes[0] : 'default'
    anomalies[rowIndex].push(createEffect(defaultType))
  }
}

function removeVariantEffect(variant, variantIdx, rowIndex, colIndex) {
  const anomalies = getVariantPhysicalAnomalyRef(variant, variantIdx)
  if (anomalies && anomalies[rowIndex]) {
    anomalies[rowIndex].splice(colIndex, 1)
    if (anomalies[rowIndex].length === 0) {
      anomalies.splice(rowIndex, 1)
    }
  }
}

function getVariantTicks(variant, variantIdx) {
  return getVariantDamageTicksRef(variant, variantIdx)
}

// 变体里的判定点操作
function addVariantDamageTick(variant, variantIdx) {
  const ticks = getVariantTicks(variant, variantIdx)
  ticks.push({ offset: 0, stagger: 0, sp: 0, boundEffects: [] })
}
function removeVariantDamageTick(variant, variantIdx, index) {
  const ticks = getVariantTicks(variant, variantIdx)
  ticks.splice(index, 1)
}

function onSkillGaugeInput(event) {
  const val = Number(event.target.value)
  if (selectedChar.value) {
    selectedChar.value.skill_teamGaugeGain = val
  }
}

function normalizeCharacterForSave(char) {
  if (char.dodge_duration === '' || char.dodge_duration === null) {
    delete char.dodge_duration
  } else if (char.dodge_duration !== undefined) {
    const dodgeVal = Number(char.dodge_duration)
    if (Number.isFinite(dodgeVal)) char.dodge_duration = Math.max(0, dodgeVal)
    else delete char.dodge_duration
  }

  const skillTypes = ['skill', 'link', 'ultimate', 'execution']
  skillTypes.forEach(type => {
    const tickKey = `${type}_damage_ticks`
    if (!char[tickKey]) char[tickKey] = []
    normalizeDamageTicks(char[tickKey])
    ensureEffectIds(char[`${type}_anomalies`])
  })

  ensureAttackSegments(char)
  for (const seg of char.attack_segments || []) {
    if (!seg.damage_ticks) seg.damage_ticks = []
    normalizeDamageTicks(seg.damage_ticks)
    ensureEffectIds(seg.anomalies)
    if (!Array.isArray(seg.allowed_types)) seg.allowed_types = []
  }

  // Legacy attack fields are no longer persisted.
  delete char.attack_duration
  delete char.attack_gaugeGain
  delete char.attack_allowed_types
  delete char.attack_anomalies
  delete char.attack_damage_ticks

  if (char.variants) {
    char.variants.forEach(variant => {
      if (variant?.type === 'attack') {
        ensureVariantAttackSegments(variant, char)
        for (const seg of variant.attackSegments || []) {
          if (!seg.damageTicks) seg.damageTicks = []
          normalizeDamageTicks(seg.damageTicks)
          ensureEffectIds(seg.physicalAnomaly)
          if (!Array.isArray(seg.allowedTypes)) seg.allowedTypes = []
        }
      } else {
        if (!variant.damageTicks) variant.damageTicks = []
        normalizeDamageTicks(variant.damageTicks)
        ensureEffectIds(variant.physicalAnomaly)
        if (!Array.isArray(variant.allowedTypes)) variant.allowedTypes = []
      }
    })
  }
}

function saveData() {
  characterRoster.value.sort((a, b) => (b.rarity || 0) - (a.rarity || 0));

  // Normalize optional fields so we don't persist placeholder sentinel values.
  for (const char of characterRoster.value || []) {
    normalizeCharacterForSave(char)
    for (const key of Object.keys(char)) {
      if (key.endsWith('_element') && char[key] === '') {
        delete char[key]
      }
    }
  }

  // Normalize weapon optional fields
  for (const weapon of weaponDatabase.value || []) {
    if (!Array.isArray(weapon.commonSlots)) {
      weapon.commonSlots = [
        { modifierId: null, size: 'small' },
        { modifierId: null, size: 'small' }
      ]
    }
    while (weapon.commonSlots.length < 2) weapon.commonSlots.push({ modifierId: null, size: 'small' })
    weapon.commonSlots = weapon.commonSlots.slice(0, 2).map(s => ({
      modifierId: (typeof s?.modifierId === 'string' && s.modifierId.trim())
        ? s.modifierId.trim()
        : ((typeof s?.key === 'string' && s.key.trim()) ? s.key.trim() : null),
      size: (s?.size === 'large' || s?.size === 'medium' || s?.size === 'small') ? s.size : 'small'
    }))

    if (!Array.isArray(weapon.buffBonuses)) weapon.buffBonuses = []
    weapon.buffBonuses = weapon.buffBonuses.map(b => ({
      modifierId: (typeof b?.modifierId === 'string' && b.modifierId.trim())
        ? b.modifierId.trim()
        : ((typeof b?.key === 'string' && b.key.trim()) ? b.key.trim() : null),
      values: normalizeArray9(b?.values)
    })).filter(b => b.modifierId)
  }

  // Normalize misc fields
  ensureMiscRoot()
  misc.value.modifierDefs = normalizeModifierDefs(misc.value.modifierDefs)
  const normalizedCommon = {}
  for (const def of misc.value.modifierDefs) {
    const entry = misc.value.weaponCommonModifiers?.[def.id]
    if (!entry) continue
    normalizedCommon[def.id] = {
      small: normalizeArray9(entry.small),
      medium: normalizeArray9(entry.medium),
      large: normalizeArray9(entry.large),
    }
  }
  misc.value.weaponCommonModifiers = normalizedCommon

  if (!misc.value.equipmentTemplates || typeof misc.value.equipmentTemplates !== 'object') misc.value.equipmentTemplates = {}
  for (const key of ['armor', 'gloves', 'accessory']) {
    if (!misc.value.equipmentTemplates[key]) {
      misc.value.equipmentTemplates[key] = { primary1: [0, 0, 0, 0], primary2: [0, 0, 0, 0], primary1Single: [0, 0, 0, 0] }
    }
    const t = misc.value.equipmentTemplates[key]
    t.primary1 = normalizeArray4(t.primary1)
    t.primary2 = normalizeArray4(t.primary2)
    t.primary1Single = normalizeArray4(t.primary1Single)
  }

  for (const eq of equipmentDatabase.value || []) {
    if (!eq) continue
    if (eq.affixes || eq.affixes70) {
      ensureEquipmentAffixes(eq)
    }
    if (Number(eq.level) !== 70 && eq.affixes) {
      eq.affixes.primary1.values = [Number(eq.affixes.primary1.values?.[0]) || 0]
      eq.affixes.primary2.values = [Number(eq.affixes.primary2.values?.[0]) || 0]
      eq.affixes.adapter.values = [Number(eq.affixes.adapter.values?.[0]) || 0]
    }
  }

  const dataToSave = {
    ICON_DATABASE: iconDatabase.value,
    characterRoster: characterRoster.value,
    enemyDatabase: enemyDatabase.value,
    enemyCategories: enemyCategories.value,
    weaponDatabase: weaponDatabase.value,
    equipmentDatabase: equipmentDatabase.value,
    equipmentCategories: equipmentCategories.value,
    equipmentCategoryConfigs: equipmentCategoryConfigs.value,
    misc: misc.value
  }
  executeSave(dataToSave)
}
</script>

<template>
  <div class="cms-layout">
    <aside class="cms-sidebar">
      <div class="sidebar-tabs">
        <button
          class="ea-btn ea-btn--glass-cut"
          :class="{ 'is-active': editingMode === 'character' }"
          :style="{ '--ea-btn-accent': 'var(--ea-gold)' }"
          @click="setMode('character')"
        >干员</button>
        <button
            class="ea-btn ea-btn--glass-cut"
            :class="{ 'is-active': editingMode === 'weapon' }"
            :style="{ '--ea-btn-accent': 'var(--ea-blue)' }"
            @click="setMode('weapon')"
        >武器</button>
        <button
            class="ea-btn ea-btn--glass-cut"
            :class="{ 'is-active': editingMode === 'equipment' }"
            :style="{ '--ea-btn-accent': 'var(--ea-success)' }"
            @click="setMode('equipment')"
        >装备</button>
        <button
          class="ea-btn ea-btn--glass-cut"
          :class="{ 'is-active': editingMode === 'enemy' }"
          :style="{ '--ea-btn-accent': 'var(--ea-danger-soft)' }"
          @click="setMode('enemy')"
        >敌人</button>
        <button
          class="ea-btn ea-btn--glass-cut"
          :class="{ 'is-active': editingMode === 'misc' }"
          :style="{ '--ea-btn-accent': 'var(--ea-purple)' }"
          @click="setMode('misc')"
        >杂项</button>
      </div>

      <div class="sidebar-header">
        <h2>
          {{
            editingMode === 'character'
              ? '干员数据'
              : editingMode === 'enemy'
                ? '敌人数据'
                : editingMode === 'weapon'
                  ? '武器数据'
                  : editingMode === 'equipment'
                    ? '装备数据'
                    : '杂项'
          }}
        </h2>
        <button
          v-if="editingMode !== 'misc'"
          class="ea-btn ea-btn--icon ea-btn--icon-28 ea-btn--icon-plus"
          @click="handleAddNew"
        >＋</button>
      </div>
      <div v-if="editingMode !== 'misc'" class="search-box">
        <input v-model="searchQuery" placeholder="搜索 ID 或名称..." />
      </div>

      <div v-if="editingMode === 'character'" class="char-list">
        <div v-for="char in filteredRoster" :key="char.id"
             class="char-item" :class="{ active: char.id === selectedCharId }"
             @click="selectChar(char.id)">

          <div class="avatar-wrapper-small" :class="`rarity-${char.rarity}-border`">
            <img :src="char.avatar" loading="lazy" decoding="async" @error="e=>e.target.src='/avatars/default.webp'" />
          </div>

          <div class="char-info">
            <span class="char-name">{{ char.name }}</span>
            <span class="char-meta" :class="`rarity-${char.rarity}`">
              {{ char.rarity }}★ {{ ELEMENTS.find(e=>e.value===char.element)?.label || char.element || '' }}
            </span>
          </div>
        </div>

      </div>

      <div v-else-if="editingMode === 'enemy'" class="char-list">

        <div v-for="group in groupedEnemies" :key="group.name" class="enemy-group">
          <div class="group-title" @click="toggleEnemyGroup(group.name)" style="cursor: pointer; display:flex; align-items:center; justify-content:space-between;">
            <span>{{ group.name }}</span>
            <span class="group-meta">
              <span class="group-count">({{ group.list.length }})</span>
              <el-icon class="toggle-arrow" :class="{ 'is-rotated': !isEnemyGroupCollapsed(group.name) }"><ArrowRight /></el-icon>
            </span>
          </div>

          <div v-if="!isEnemyGroupCollapsed(group.name)">
            <div v-for="enemy in group.list" :key="enemy.id"
                 class="char-item"
                :class="{ active: enemy.id === selectedEnemyId }"
                @click="selectEnemy(enemy.id)">

              <div class="avatar-wrapper-small" :style="{ borderColor: ENEMY_TIERS.find(t=>t.value===enemy.tier)?.color }">
                <img :src="enemy.avatar" loading="lazy" decoding="async" @error="e=>e.target.src='/avatars/default_enemy.webp'" />
              </div>

              <div class="char-info">
                <span class="char-name">{{ enemy.name }}</span>
                <span class="char-meta" style="color:#aaa">
                  {{ enemy.maxStagger }} / {{ enemy.staggerNodeCount }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="groupedEnemies.length === 0" class="empty-hint">
          暂无匹配的敌人
        </div>

      </div>

      <div v-else-if="editingMode === 'weapon'" class="char-list">
        <div v-for="group in groupedWeapons" :key="group.key" class="enemy-group">
          <div class="group-title" @click="toggleWeaponGroup(group.name)" style="cursor: pointer; display:flex; align-items:center; justify-content:space-between;">
            <span>{{ group.name }}</span>
            <span class="group-meta">
              <span class="group-count">({{ group.list.length }})</span>
              <el-icon class="toggle-arrow" :class="{ 'is-rotated': !isWeaponGroupCollapsed(group.name) }"><ArrowRight /></el-icon>
            </span>
          </div>

          <div v-if="!isWeaponGroupCollapsed(group.name)">
            <div v-for="weapon in group.list" :key="weapon.id"
                 class="char-item"
                 :class="{ active: weapon.id === selectedWeaponId }"
                 @click="selectWeapon(weapon.id)">
              <div class="avatar-wrapper-small" :class="`rarity-${Math.max(3, weapon.rarity || 3)}-border`" style="display:flex;align-items:center;justify-content:center; overflow:hidden;">
                <img
                    :key="weapon.icon || weapon.id"
                    :src="weapon.icon || '/weapons/default.webp'"
                    loading="lazy"
                    decoding="async"
                    @error="e=>e.target.src='/weapons/default.webp'"
                    style="width:100%;height:100%;object-fit:cover;" />
              </div>
              <div class="char-info">
                <span class="char-name">{{ weapon.name }}</span>
                <span class="char-meta" :class="`rarity-${Math.max(3, weapon.rarity || 3)}`">
                  {{ Math.max(3, weapon.rarity || 3) }}★ {{ (WEAPON_TYPES.find(w=>w.value===weapon.type)?.label || weapon.type || '未知') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredWeapons.length === 0" class="empty-hint">
          暂无武器，点击上方添加
        </div>
      </div>

      <div v-else-if="editingMode === 'equipment'" class="char-list">
        <div v-for="group in groupedEquipment" :key="group.name" class="enemy-group">
          <div class="group-title" @click="toggleEquipmentGroup(group.name)" style="cursor: pointer; display:flex; align-items:center; justify-content:space-between;">
            <span>{{ group.name }}</span>
            <span class="group-meta">
              <span class="group-count">({{ group.list.length }})</span>
              <el-icon class="toggle-arrow" :class="{ 'is-rotated': !isEquipmentGroupCollapsed(group.name) }"><ArrowRight /></el-icon>
            </span>
          </div>

          <div v-show="!isEquipmentGroupCollapsed(group.name)">
            <div v-for="eq in group.list" :key="eq.id"
                 class="char-item"
                 :class="{ active: eq.id === selectedEquipmentId }"
                 @click="selectEquipment(eq.id)">
              <div class="avatar-wrapper-small" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderColor: getEquipmentLevelColor(eq.level) }">
                <img
                    :key="eq.icon || eq.id"
                    :src="eq.icon || '/icons/default_icon.webp'"
                    loading="lazy"
                    decoding="async"
                    @error="e=>e.target.src='/icons/default_icon.webp'"
                    style="width:100%;height:100%;object-fit:cover;" />
              </div>
              <div class="char-info">
                <span class="char-name">{{ eq.name }}</span>
                <span class="char-meta" :style="{ color: getEquipmentLevelColor(eq.level) }">
                  {{ (EQUIPMENT_SLOTS.find(s=>s.value===eq.slot)?.label || eq.slot || '未知') }} · Lv{{ eq.level || 0 }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredEquipment.length === 0" class="empty-hint">
          暂无装备，点击上方添加
        </div>
      </div>

      <div v-else-if="editingMode === 'misc'" class="char-list">
        <div class="char-item" :class="{ active: miscSection === 'stats' }" @click="miscSection = 'stats'">
          <div class="char-info">
            <span class="char-name">所有属性</span>
            <span class="char-meta" style="color:#aaa">排序 / 快速添加</span>
          </div>
        </div>
        <div class="char-item" :class="{ active: miscSection === 'weapon_table' }" @click="miscSection = 'weapon_table'">
          <div class="char-info">
            <span class="char-name">武器词条数值</span>
            <span class="char-meta" style="color:#aaa">1–9 级 / 大中小</span>
          </div>
        </div>
        <div class="char-item" :class="{ active: miscSection === 'equipment_table' }" @click="miscSection = 'equipment_table'">
          <div class="char-info">
            <span class="char-name">装备词条模板</span>
            <span class="char-meta" style="color:#aaa">护甲/护手/配件</span>
          </div>
        </div>
        <div class="char-item" :class="{ active: miscSection === 'equipment_categories' }" @click="miscSection = 'equipment_categories'">
          <div class="char-info">
            <span class="char-name">装备分类</span>
            <span class="char-meta" style="color:#aaa">增删 / 排序</span>
          </div>
        </div>
        <div class="char-item" :class="{ active: miscSection === 'enemy_categories' }" @click="miscSection = 'enemy_categories'">
          <div class="char-info">
            <span class="char-name">敌人分类</span>
            <span class="char-meta" style="color:#aaa">增删 / 排序</span>
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <button class="ea-btn ea-btn--block ea-btn--lg ea-btn--fill-success" @click="saveData">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          保存数据
        </button>
        <router-link to="/" class="ea-btn ea-btn--block ea-btn--outline-muted">↩ 返回排轴器</router-link>
      </div>
    </aside>

    <main class="cms-content">
      <div v-if="editingMode === 'character' && selectedChar" class="editor-panel">
        <header class="panel-header">
          <div class="header-left">
            <div class="avatar-wrapper-large" :class="`rarity-${selectedChar.rarity}-border`">
              <img :src="selectedChar.avatar" @error="e=>e.target.src='/avatars/default.webp'" />
            </div>

            <div class="header-titles">
              <h1 class="edit-title">{{ selectedChar.name }}</h1>
              <span class="id-tag">{{ selectedChar.id }}</span>
            </div>
          </div>
          <button class="ea-btn ea-btn--md ea-btn--fill-danger" @click="deleteCurrentCharacter">删除此干员</button>
        </header>

        <div class="cms-tabs">
          <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            基础信息
          </button>

          <button :class="{ active: activeTab === 'attack' }" @click="activeTab = 'attack'">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path>
              <path d="M13 19l6-6"></path>
              <path d="M16 16l4 4"></path>
              <path d="M19 21l2-2"></path>
            </svg>
            重击
          </button>

          <button :class="{ active: activeTab === 'skill' }" @click="activeTab = 'skill'">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            战技
          </button>

          <button :class="{ active: activeTab === 'link' }" @click="activeTab = 'link'">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            连携
          </button>

          <button :class="{ active: activeTab === 'ultimate' }" @click="activeTab = 'ultimate'">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            终结技
          </button>

          <button :class="{ active: activeTab === 'execution' }" @click="activeTab = 'execution'">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="22" y1="12" x2="18" y2="12"></line>
              <line x1="6" y1="12" x2="2" y2="12"></line>
              <line x1="12" y1="6" x2="12" y2="2"></line>
              <line x1="12" y1="22" x2="12" y2="18"></line>
            </svg>
            处决
          </button>

          <button :class="{ active: activeTab === 'dodge' }" @click="activeTab = 'dodge'">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12c3-6 6-6 9 0s6 6 9 0"></path>
              <path d="M3 12c3 6 6 6 9 0s6-6 9 0"></path>
            </svg>
            闪避
          </button>

          <button :class="{ active: activeTab === 'variants' }" @click="activeTab = 'variants'">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            变体
          </button>
        </div>

        <div class="tab-content">

          <div v-show="activeTab === 'basic'" class="form-section">
            <h3 class="section-title">基本属性</h3>
            <div class="form-grid">
              <div class="form-group"><label>名称</label><input v-model="selectedChar.name" type="text" /></div>
              <div class="form-group"><label>ID (Unique)</label><input :value="selectedChar.id" @input="updateCharId" type="text" /></div>
              <div class="form-group"><label>星级</label>
                <el-select v-model="selectedChar.rarity" size="large" style="width: 100%">
                  <el-option :value="6" label="6 ★" />
                  <el-option :value="5" label="5 ★" />
                  <el-option :value="4" label="4 ★" />
                </el-select>
              </div>
              <div class="form-group">
                <label>元素属性</label>
                <el-select v-model="selectedChar.element" size="large" style="width: 100%">
                  <el-option v-for="elm in ELEMENTS" :key="elm.value" :label="elm.label" :value="elm.value" />
                </el-select>
              </div>
              <div class="form-group">
                <label>武器类型</label>
                <el-select v-model="selectedChar.weapon" size="large" style="width: 100%">
                  <el-option v-for="wpn in WEAPON_TYPES" :key="wpn.value" :label="wpn.label" :value="wpn.value" />
                </el-select>
              </div>
              <div class="form-group full-width"><label>图标路径</label><input v-model="selectedChar.avatar" type="text" /></div>
            </div>

            <h3 class="section-title">特殊机制</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>充能判定</label>
                <div class="checkbox-wrapper" :class="{ 'is-checked': selectedChar.accept_team_gauge !== false }">
                  <input
                      type="checkbox"
                      id="cb_accept_gauge"
                      :checked="selectedChar.accept_team_gauge !== false"
                      @change="e => selectedChar.accept_team_gauge = e.target.checked"
                  >
                  <label for="cb_accept_gauge">接受队友充能</label>
                </div>
              </div>
            </div>

            <h3 class="section-title">专属效果</h3>
            <div class="exclusive-list">
              <div v-for="(buff, idx) in selectedChar.exclusive_buffs" :key="idx" class="exclusive-row">
                <input v-model="buff.key" placeholder="Key" />
                <input v-model="buff.name" placeholder="显示名称" />
                <input v-model="buff.path" placeholder="图标路径" class="flex-grow" />
                <button class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger" @click="selectedChar.exclusive_buffs.splice(idx, 1)">×</button>
              </div>
              <button class="ea-btn ea-btn--block ea-btn--dashed-muted" @click="selectedChar.exclusive_buffs.push({key:'',name:'',path:''})">+ 添加专属效果</button>
            </div>
          </div>

          <div v-show="activeTab === 'variants'" class="form-section">
            <div class="info-banner">
              此处添加的动作将拥有<strong>独立的数值</strong>（从创建时刻的基础数值深拷贝而来）。<br>
              修改此处数值不会影响基础技能，反之亦然。
            </div>

            <div v-for="(variant, idx) in (selectedChar.variants || [])" :key="idx" class="variant-card">
              <div class="variant-header">
                <span class="variant-idx">#{{ idx + 1 }}</span>
                <button class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger" @click="removeVariant(idx)">×</button>
              </div>

              <div class="form-grid three-col">
                <div class="form-group">
                  <label>显示名称</label>
                  <input v-model="variant.name" placeholder="例如：强化战技" />
                </div>
                <div class="form-group">
                  <label>动作类型 (切换重置)</label>
                  <el-select v-model="variant.type" size="large" style="width: 100%" @change="onVariantTypeChange(variant, idx)">
                    <el-option v-for="t in VARIANT_TYPES" :key="t.value" :label="t.label" :value="t.value" />
                  </el-select>
                </div>
                <div class="form-group">
                  <label>唯一标识 (ID后缀)</label>
                  <input v-model="variant.id" placeholder="英文key, 如 s1_enhanced" />
                </div>
                <div class="form-group" v-if="['skill', 'link', 'ultimate'].includes(variant.type)">
                  <label>变体专属图标路径</label>
                  <input v-model="variant.icon" type="text"/>
                </div>

                <div class="form-group" v-if="variant.type !== 'attack'"><label>持续时间</label><input type="number" step="0.1" v-model.number="variant.duration"></div>

                <template v-if="variant.type === 'attack'">
                  <div class="form-group">
                    <label>重击分段</label>
                    <el-select v-model="variantAttackSegmentIndexList[idx]" size="large" style="width: 100%">
                      <el-option v-for="i in ATTACK_SEGMENT_COUNT" :key="`vseg_${idx}_${i}`" :label="`第${i}段`" :value="i - 1" />
                    </el-select>
                  </div>
                  <div class="form-group"><label>总时长 (s)</label><input type="number" :value="getVariantAttackTotalDuration(variant)" disabled></div>
                  <div class="form-group"><label>本段时长 (s)</label><input type="number" step="0.1" v-model.number="variant.attackSegments[variantAttackSegmentIndexList[idx] || 0].duration"></div>
                  <div class="form-group"><label>本段自身充能</label><input type="number" v-model.number="variant.attackSegments[variantAttackSegmentIndexList[idx] || 0].gaugeGain"></div>
                  <div class="form-group full-width">
                    <button class="ea-btn ea-btn--block ea-btn--dashed-muted" @click="ensureVariantAttackSegments(variant, selectedChar, { force: true })">从基础重击重新深拷贝 5 段</button>
                  </div>
                </template>

                <div class="form-group" v-if="variant.type === 'skill'"><label>技力消耗</label><input type="number" v-model.number="variant.spCost"></div>
                <div class="form-group" v-if="variant.type === 'skill'"><label>自身充能</label><input type="number" v-model.number="variant.gaugeGain"></div>
                <div class="form-group" v-if="variant.type === 'skill'"><label>队友充能</label><input type="number" v-model.number="variant.teamGaugeGain"></div>

                <div class="form-group" v-if="variant.type === 'link'"><label>冷却时间 (CD)</label><input type="number" v-model.number="variant.cooldown"></div>
                <div class="form-group" v-if="variant.type === 'link'"><label>自身充能</label><input type="number" v-model.number="variant.gaugeGain"></div>

                <div class="form-group" v-if="variant.type === 'ultimate'"><label>充能消耗</label><input type="number" v-model.number="variant.gaugeCost"></div>
                <div class="form-group" v-if="variant.type === 'ultimate'"><label>充能返还</label><input type="number" v-model.number="variant.gaugeGain"></div>
                <div class="form-group" v-if="variant.type === 'ultimate'"><label>强化时间 (s)</label><input type="number" step="0.5" v-model.number="variant.enhancementTime"></div>
                <div class="form-group" v-if="variant.type === 'ultimate'"><label>动画时间 (s)</label><input type="number" step="0.1" v-model.number="variant.animationTime"></div>
              </div>

              <div class="ticks-editor-area" style="margin-top: 10px;">
                <label style="font-size: 12px; color: #aaa; font-weight: bold; display: block; margin-bottom: 5px;">伤害判定点</label>
                <div v-if="getVariantTicks(variant, idx).length === 0" class="empty-ticks-hint">暂无判定点</div>
                <div v-for="(tick, tIdx) in getVariantTicks(variant, idx)" :key="tIdx" class="tick-row">
                  <div class="tick-top">
                    <div class="tick-idx">HIT {{ tIdx + 1 }}</div>
                    <div class="tick-inputs">
                      <div class="t-group"><label>时间(s)</label><input type="number" v-model.number="tick.offset" step="any" class="mini-input"></div>
                      <div class="t-group"><label style="color:#ff7875">失衡值</label><input type="number" v-model.number="tick.stagger" class="mini-input"></div>
                      <div class="t-group"><label style="color:#ffd700">回复技力</label><input type="number" v-model.number="tick.sp" class="mini-input"></div>
                    </div>
                    <button class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger" @click="removeVariantDamageTick(variant, idx, tIdx)">×</button>
                  </div>
                  <div class="tick-binding">
                    <label>绑定状态</label>
                    <el-select
                        v-model="tick.boundEffects"
                        multiple
                        collapse-tags
                        collapse-tags-tooltip
                        popper-class="ea-tick-binding-popper"
                        size="small"
                        class="tick-select"
                        placeholder="选择要绑定的状态"
                        :disabled="getVariantBindingOptions(variant, idx).length === 0"
                    >
                      <el-option v-for="opt in getVariantBindingOptions(variant, idx)" :key="opt.value" :label="opt.label" :value="opt.value">
                        <div class="binding-option">
                          <img :src="getEffectIconPath(opt.type)" class="binding-option__icon" />
                          <span class="binding-option__label">{{ opt.label }}</span>
                          <span class="binding-option__hint">{{ opt.hint }}</span>
                        </div>
                      </el-option>
                    </el-select>
                  </div>
                </div>
                <button class="ea-btn ea-btn--block ea-btn--lg ea-btn--dashed-panel ea-btn--radius-6" style="margin-top: 5px;" @click="addVariantDamageTick(variant, idx)">+ 添加判定点</button>
              </div>

              <div class="checkbox-grid" style="margin-top: 15px;">
                <template v-if="variant.type === 'attack'">
                  <label v-for="key in effectKeys" :key="`v_${variant.id}_${key}`" class="cb-item">
                    <input type="checkbox" :value="key" v-model="variant.attackSegments[variantAttackSegmentIndexList[idx] || 0].allowedTypes" @change="onVariantCheckChange(variant, idx, key)">
                    {{ EFFECT_NAMES[key] }}
                  </label>
                  <label v-for="buff in selectedChar.exclusive_buffs" :key="`v_${variant.id}_${buff.key}`" class="cb-item exclusive">
                    <input type="checkbox" :value="buff.key" v-model="variant.attackSegments[variantAttackSegmentIndexList[idx] || 0].allowedTypes" @change="onVariantCheckChange(variant, idx, buff.key)">
                    ★ {{ buff.name }}
                  </label>
                </template>
                <template v-else>
                  <label v-for="key in effectKeys" :key="`v_${variant.id}_${key}`" class="cb-item">
                    <input type="checkbox" :value="key" v-model="variant.allowedTypes" @change="onVariantCheckChange(variant, idx, key)">
                    {{ EFFECT_NAMES[key] }}
                  </label>
                  <label v-for="buff in selectedChar.exclusive_buffs" :key="`v_${variant.id}_${buff.key}`" class="cb-item exclusive">
                    <input type="checkbox" :value="buff.key" v-model="variant.allowedTypes" @change="onVariantCheckChange(variant, idx, buff.key)">
                    ★ {{ buff.name }}
                  </label>
                </template>
              </div>

              <div class="matrix-editor-area" style="margin-top: 15px; border-top: 1px dashed #444; padding-top: 15px;">
                <label style="font-size: 12px; color: #aaa; margin-bottom: 8px; display: block; font-weight: bold;">附加异常状态</label>
                <div class="anomalies-grid-editor">
                  <div v-for="(row, rIndex) in (variant.type === 'attack' ? (variant.attackSegments[variantAttackSegmentIndexList[idx] || 0].physicalAnomaly || []) : (variant.physicalAnomaly || []))" :key="rIndex" class="editor-row">
                    <div v-for="(item, cIndex) in row" :key="cIndex" class="editor-card">
                      <div class="card-header">
                        <span class="card-label">R{{rIndex+1}}:C{{cIndex+1}}</span>
                        <button class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger" @click="removeVariantEffect(variant, idx, rIndex, cIndex)">×</button>
                      </div>
                      <el-select v-model="item.type" size="small" class="card-select full-width-mb" style="width: 100%">
                        <el-option v-for="opt in getVariantAvailableOptions(variant, idx)" :key="opt.value" :label="opt.label" :value="opt.value" />
                      </el-select>

                      <div class="card-props-grid">
                        <div class="prop-item full-span">
                          <label>层数 (Stacks)</label>
                          <div class="input-with-unit">
                            <input type="number" v-model.number="item.stacks" placeholder="1" class="mini-input">
                            <span class="unit">层</span>
                          </div>
                        </div>
                        <div class="prop-item">
                          <label>触发 (Start)</label>
                          <div class="input-with-unit">
                            <input type="number" v-model.number="item.offset" placeholder="0" step="0.1" class="mini-input">
                            <span class="unit">s</span>
                          </div>
                        </div>
                        <div class="prop-item">
                          <label>持续 (Dur)</label>
                          <div class="input-with-unit">
                            <input type="number" v-model.number="item.duration" placeholder="0" step="0.5" class="mini-input">
                            <span class="unit">s</span>
                          </div>
                        </div>
                      </div>

                    </div>
                    <button class="ea-btn ea-btn--icon ea-btn--icon-40 ea-btn--icon-plus" @click="addVariantEffect(variant, idx, rIndex)">+</button>
                  </div>
                  <button class="ea-btn ea-btn--block ea-btn--lg ea-btn--dashed-panel ea-btn--radius-6" @click="addVariantRow(variant, idx)" :disabled="getVariantAvailableOptions(variant, idx).length === 0">+ 新增效果行</button>
                </div>
              </div>
            </div>

            <button class="ea-btn ea-btn--block ea-btn--lg ea-btn--dashed-panel ea-btn--radius-6" @click="addVariant" style="margin-top: 20px;">+ 添加新变体动作</button>
          </div>

          <template v-for="type in ['attack', 'skill', 'link', 'ultimate', 'execution', 'dodge']" :key="type">
            <div v-show="activeTab === type" class="form-section">
              <h3 class="section-title">数值配置</h3>

              <div v-if="type === 'attack'" class="attack-seg-toolbar">
                <div class="attack-seg-buttons">
                  <button
                      v-for="i in ATTACK_SEGMENT_COUNT"
                      :key="`atkseg_${i}`"
                      class="ea-btn ea-btn--glass-cut ea-btn--sm"
                      :class="{ active: attackSegmentIndex === (i - 1) }"
                      @click="attackSegmentIndex = i - 1"
                  >第{{ i }}段</button>
                </div>
                <div class="attack-seg-meta">
                  <span class="meta-item">总时长：{{ attackTotalDuration }}s</span>
                  <button class="ea-btn ea-btn--glass-cut ea-btn--sm" @click="applyAttackSegmentToAll({ includeDuration: false })">批量覆盖（不含时长）</button>
                  <button class="ea-btn ea-btn--glass-cut ea-btn--sm" @click="applyAttackSegmentToAll({ includeDuration: true })">批量覆盖（含时长）</button>
                </div>
              </div>

              <div v-if="type === 'attack' && currentAttackSegment" class="form-grid three-col">
                <div class="form-group"><label>本段持续时间 (s)</label><input type="number" step="0.1" v-model.number="currentAttackSegment.duration"></div>
                <div class="form-group"><label>本段自身充能</label><input type="number" v-model.number="currentAttackSegment.gaugeGain"></div>
              </div>

              <div v-else class="form-grid three-col">
                <div class="form-group" v-if="type === 'skill' || type === 'ultimate'">
                  <label>技能属性</label>
                  <el-select v-model="selectedChar[`${type}_element`]" size="large" placeholder="默认 (跟随干员)" style="width: 100%">
                    <el-option value="" label="默认 (跟随干员)" />
                    <el-option v-for="elm in ELEMENTS" :key="elm.value" :label="elm.label" :value="elm.value" />
                  </el-select>
                </div>

                <div class="form-group" v-if="['skill', 'link', 'ultimate'].includes(type)"><label>自定义图标路径</label><input v-model="selectedChar[`${type}_icon`]" type="text"/></div>

                <div class="form-group"><label>持续时间 (s)</label><input type="number" step="0.1" v-model.number="selectedChar[`${type}_duration`]"></div>

                <div class="form-group" v-if="type === 'skill'"><label>技力消耗</label><input type="number" v-model.number="selectedChar[`${type}_spCost`]"></div>
                <div class="form-group" v-if="type === 'skill'"><label>自身充能</label><input type="number" v-model.number="selectedChar[`${type}_gaugeGain`]" @input="onSkillGaugeInput"></div>
                <div class="form-group" v-if="type === 'skill'"><label>队友充能</label><input type="number" v-model.number="selectedChar[`${type}_teamGaugeGain`]"></div>

                <div class="form-group" v-if="type === 'link'"><label>冷却时间 (s)</label><input type="number" v-model.number="selectedChar[`${type}_cooldown`]"></div>
                <div class="form-group" v-if="type === 'link'"><label>自身充能</label><input type="number" v-model.number="selectedChar[`${type}_gaugeGain`]"></div>

                <div class="form-group" v-if="type === 'ultimate'"><label>充能消耗</label><input type="number" v-model.number="selectedChar[`${type}_gaugeMax`]"></div>
                <div class="form-group" v-if="type === 'ultimate'"><label>自身充能</label><input type="number" v-model.number="selectedChar[`${type}_gaugeReply`]"></div>
                <div class="form-group" v-if="type === 'ultimate'"><label>强化时间 (s)</label><input type="number" step="0.5" v-model.number="selectedChar[`${type}_enhancementTime`]"></div>
                <div class="form-group" v-if="type === 'ultimate'">
                  <label>动画时间 (s)</label>
                  <input type="number" step="0.1" v-model.number="selectedChar[`${type}_animationTime`]">
                </div>
              </div>

              <template v-if="type !== 'dodge'">
                <h3 class="section-title">伤害判定点</h3>
              <div class="ticks-editor-area">
                <div v-if="getDamageTicks(selectedChar, type).length === 0" class="empty-ticks-hint">
                  暂无判定点，请点击下方按钮添加
                </div>
                <div v-for="(tick, tIdx) in getDamageTicks(selectedChar, type)" :key="tIdx" class="tick-row">
                  <div class="tick-top">
                    <div class="tick-idx">HIT {{ tIdx + 1 }}</div>
                    <div class="tick-inputs">
                      <div class="t-group"><label>时间(s)</label><input type="number" v-model.number="tick.offset" step="any" class="mini-input"></div>
                      <div class="t-group"><label style="color:#ff7875">失衡值</label><input type="number" v-model.number="tick.stagger" class="mini-input"></div>
                      <div class="t-group"><label style="color:#ffd700">回复技力</label><input type="number" v-model.number="tick.sp" class="mini-input"></div>
                    </div>
                    <button class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger" @click="removeDamageTick(selectedChar, type, tIdx)">×</button>
                  </div>
                  <div class="tick-binding">
                    <label>绑定状态</label>
                    <el-select
                        v-model="tick.boundEffects"
                        multiple
                        collapse-tags
                        collapse-tags-tooltip
                        popper-class="ea-tick-binding-popper"
                        size="small"
                        class="tick-select"
                        placeholder="选择要绑定的状态"
                        :disabled="getBindingOptions(type).length === 0"
                    >
                      <el-option v-for="opt in getBindingOptions(type)" :key="opt.value" :label="opt.label" :value="opt.value">
                        <div class="binding-option">
                          <img :src="getEffectIconPath(opt.type)" class="binding-option__icon" />
                          <span class="binding-option__label">{{ opt.label }}</span>
                          <span class="binding-option__hint">{{ opt.hint }}</span>
                        </div>
                      </el-option>
                    </el-select>
                  </div>
                </div>
                <button class="ea-btn ea-btn--block ea-btn--lg ea-btn--dashed-panel ea-btn--radius-6" style="margin-top: 10px;" @click="addDamageTick(selectedChar, type)">+ 添加判定点</button>
              </div>

              <h3 class="section-title">效果池配置</h3>
              <div v-if="type === 'attack' && currentAttackSegment" class="checkbox-grid">
                <label v-for="key in effectKeys" :key="`${type}_${attackSegmentIndex}_${key}`" class="cb-item">
                  <input type="checkbox" :value="key" v-model="currentAttackSegment.allowed_types" @change="onCheckChange(selectedChar, type, key)">
                  {{ EFFECT_NAMES[key] }}
                </label>
                <label v-for="buff in selectedChar.exclusive_buffs" :key="`${type}_${attackSegmentIndex}_${buff.key}`" class="cb-item exclusive">
                  <input type="checkbox" :value="buff.key" v-model="currentAttackSegment.allowed_types">
                  ★ {{ buff.name }}
                </label>
              </div>
              <div v-else class="checkbox-grid">
                <label v-for="key in effectKeys" :key="`${type}_${key}`" class="cb-item">
                  <input type="checkbox" :value="key" v-model="selectedChar[`${type}_allowed_types`]" @change="onCheckChange(selectedChar, type, key)">
                  {{ EFFECT_NAMES[key] }}
                </label>
                <label v-for="buff in selectedChar.exclusive_buffs" :key="`${type}_${buff.key}`" class="cb-item exclusive">
                  <input type="checkbox" :value="buff.key" v-model="selectedChar[`${type}_allowed_types`]">
                  ★ {{ buff.name }}
                </label>
              </div>

              <div class="matrix-editor-area">
                <h3 class="section-title">默认附带状态 (二维矩阵)</h3>
                <div class="anomalies-grid-editor">
                  <div v-for="(row, rIndex) in getAnomalyRows(selectedChar, type)" :key="rIndex" class="editor-row">

                    <div v-for="(item, cIndex) in row" :key="cIndex" class="editor-card">
                      <div class="card-header">
                        <span class="card-label">R{{rIndex+1}}:C{{cIndex+1}}</span>
                        <button class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger" @click="removeAnomaly(selectedChar, type, rIndex, cIndex)">×</button>
                      </div>
                      <el-select v-model="item.type" size="small" class="card-select full-width-mb" style="width: 100%">
                        <el-option v-for="opt in getAvailableAnomalyOptions(type)" :key="opt.value" :label="opt.label" :value="opt.value" />
                      </el-select>

                      <div class="card-props-grid">
                        <div class="prop-item full-span">
                          <label>层数</label>
                          <div class="input-with-unit">
                            <input type="number" v-model.number="item.stacks" placeholder="1" class="mini-input">
                            <span class="unit">层</span>
                          </div>
                        </div>
                        <div class="prop-item">
                          <label>触发</label>
                          <div class="input-with-unit">
                            <input type="number" v-model.number="item.offset" placeholder="0" step="0.1" class="mini-input">
                            <span class="unit">s</span>
                          </div>
                        </div>
                        <div class="prop-item">
                          <label>持续</label>
                          <div class="input-with-unit">
                            <input type="number" v-model.number="item.duration" placeholder="0" step="0.5" class="mini-input">
                            <span class="unit">s</span>
                          </div>
                        </div>
                      </div>

                    </div>
                    <button class="ea-btn ea-btn--icon ea-btn--icon-40 ea-btn--icon-plus" @click="addAnomalyToRow(selectedChar, type, rIndex)">+</button>
                  </div>
                  <button class="ea-btn ea-btn--block ea-btn--lg ea-btn--dashed-panel ea-btn--radius-6" @click="addAnomalyRow(selectedChar, type)" :disabled="getAvailableAnomalyOptions(type).length === 0">+ 新增效果行</button>
                </div>
              </div>
              </template>
            </div>
          </template>

        </div>
      </div>

      <div v-else-if="editingMode === 'enemy' && selectedEnemy" class="editor-panel">
        <header class="panel-header">
          <div class="header-left">
            <div class="avatar-wrapper-large" :style="{ borderColor: ENEMY_TIERS.find(t=>t.value===selectedEnemy.tier)?.color || '#ff4d4f' }">
              <img :src="selectedEnemy.avatar" @error="e=>e.target.src='/avatars/default_enemy.webp'" />
            </div>
            <div class="header-titles">
              <h1 class="edit-title">{{ selectedEnemy.name }}</h1>
              <span class="id-tag">{{ selectedEnemy.id }}</span>
            </div>
          </div>
          <button class="ea-btn ea-btn--md ea-btn--fill-danger" @click="deleteCurrentEnemy">删除此敌人</button>
        </header>

        <div class="form-section">
          <h3 class="section-title">基本信息</h3>
          <div class="form-grid">
            <div class="form-group"><label>名称</label><input v-model="selectedEnemy.name" /></div>
            <div class="form-group"><label>ID</label><input :value="selectedEnemy.id" @change="updateEnemyId" /></div>
            <div class="form-group">
              <label>等阶</label>
              <el-select
                v-model="selectedEnemy.tier"
                size="large"
                class="enemy-tier-select"
                style="width: 100%"
                :style="{ '--ea-tier-color': ENEMY_TIERS.find(t=>t.value===selectedEnemy.tier)?.color }"
              >
                <el-option v-for="t in ENEMY_TIERS" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </div>

            <div class="form-group">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <label>分类</label>
              </div>
              <el-select v-model="selectedEnemy.category" size="large" style="width: 100%">
                <el-option :value="''" label="未分类" />
                <el-option v-for="cat in enemyCategories" :key="cat" :label="cat" :value="cat" />
              </el-select>
            </div>
            <div class="form-group full-width"><label>图标路径</label><input v-model="selectedEnemy.avatar" /></div>
          </div>

          <h3 class="section-title">数值属性</h3>
          <div class="form-grid three-col">
            <div class="form-group"><label style="color:#ff7875">失衡上限</label><input type="number" v-model.number="selectedEnemy.maxStagger"></div>
            <div class="form-group"><label style="color:#ff7875">失衡节点数</label><input type="number" v-model.number="selectedEnemy.staggerNodeCount"></div>
            <div class="form-group"><label style="color:#ff7875">踉跄时长 (s)</label><input type="number" step="0.1" v-model.number="selectedEnemy.staggerNodeDuration"></div>
            <div class="form-group"><label style="color:#ff7875">失衡时长 (s)</label><input type="number" step="0.5" v-model.number="selectedEnemy.staggerBreakDuration"></div>
            <div class="form-group"><label style="color:#ffd700">处决回复技力</label><input type="number" v-model.number="selectedEnemy.executionRecovery"></div>
          </div>
        </div>
      </div>

      <div v-else-if="editingMode === 'equipment' && selectedEquipment" class="editor-panel">
        <header class="panel-header">
          <div class="header-left">
            <div class="avatar-wrapper-large" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderColor: getEquipmentLevelColor(selectedEquipment.level) }">
              <img
                  :key="selectedEquipment.icon || selectedEquipment.id"
                  :src="selectedEquipment.icon || '/icons/default_icon.webp'"
                  @error="e=>e.target.src='/icons/default_icon.webp'"
                  style="width:100%; height:100%; object-fit:cover;" />
            </div>
            <div class="header-titles">
              <h1 class="edit-title">{{ selectedEquipment.name }}</h1>
              <span class="id-tag">{{ selectedEquipment.id }}</span>
            </div>
          </div>
          <button class="ea-btn ea-btn--md ea-btn--fill-danger" @click="deleteCurrentEquipment">删除此装备</button>
        </header>

        <div class="form-section">
          <h3 class="section-title">基础信息</h3>
          <div class="form-grid three-col">
            <div class="form-group"><label>名称</label><input v-model="selectedEquipment.name" type="text" /></div>
            <div class="form-group"><label>ID (Unique)</label><input :value="selectedEquipment.id" @input="updateEquipmentId" type="text" /></div>
            <div class="form-group">
              <label>部位</label>
              <el-select v-model="selectedEquipment.slot" size="large" style="width: 100%">
                <el-option v-for="s in EQUIPMENT_SLOTS" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </div>
            <div class="form-group">
              <label>等级</label>
              <el-select v-model="selectedEquipment.level" size="large" style="width: 100%">
                <el-option v-for="lv in EQUIPMENT_LEVELS" :key="lv" :label="`Lv${lv}`" :value="lv" />
              </el-select>
            </div>
            <div class="form-group">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <label>分类</label>
              </div>
              <el-select v-model="selectedEquipment.category" size="large" style="width: 100%">
                <el-option :value="''" label="未分类" />
                <el-option v-for="cat in equipmentCategories" :key="cat" :label="cat" :value="cat" />
              </el-select>
            </div>
            <div class="form-group full-width"><label>图标路径</label><input v-model="selectedEquipment.icon" type="text" /></div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">三件套（套装 BUFF）</h3>
          <div class="form-grid three-col">
            <div class="form-group">
              <label>BUFF 名称（固定等于分类名）</label>
              <input :value="selectedEquipment.category || ''" disabled />
            </div>
            <div class="form-group">
              <label>持续时间 (s)</label>
              <input
                  type="number"
                  min="0"
                  step="0.1"
                  :value="getCategorySetBonusDuration(selectedEquipment.category)"
                  @input="setCategorySetBonusDuration(selectedEquipment.category, $event.target.value)"
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">装备词条数值</h3>
          <div class="info-banner">
            Lv70 装备支持“初始 / 精锻1 / 精锻2 / 精锻3”四档；非 Lv70 仅支持“初始数值”。副词条可为空；适配词条可多选（用于寒冷+电磁等组合）。
          </div>

          <div v-if="Number(selectedEquipment.level) === 70" class="attack-seg-toolbar" style="margin-bottom: 12px;">
            <div class="attack-seg-meta" style="justify-content: space-between;">
              <span class="meta-item">可精锻属性：4 档</span>
              <button class="ea-btn ea-btn--glass-cut ea-btn--sm" @click="applyEquipmentTemplate(selectedEquipment)">套用部位模板（仅数值）</button>
            </div>
          </div>

          <div v-if="selectedEquipmentAffixes" class="matrix-grid" :style="{ gridTemplateColumns: `140px 200px repeat(${equipmentAffixColumns.length}, 1fr)` }">
            <div class="matrix-cell header-corner">词条</div>
            <div class="matrix-cell header-level">属性</div>
            <div v-for="col in equipmentAffixColumns" :key="`eq_col_${col.index}`" class="matrix-cell header-level">{{ col.label }}</div>

            <div class="matrix-cell row-label large">主词条</div>
            <div class="matrix-cell">
              <el-select v-model="selectedEquipmentAffixes.primary1.modifierId" size="small" style="width: 100%" :teleported="true" placeholder="请选择">
                <el-option :value="null" label="（无）" />
                <el-option v-for="opt in primaryStatOptions" :key="`p1_${opt.value}`" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div v-for="col in equipmentAffixColumns" :key="`p1v_${col.index}`" class="matrix-cell">
              <input type="number" step="0.1" v-model.number="selectedEquipmentAffixes.primary1.values[col.index]" class="matrix-input" />
            </div>

            <div class="matrix-cell row-label medium">副词条</div>
            <div class="matrix-cell">
              <el-select v-model="selectedEquipmentAffixes.primary2.modifierId" size="small" style="width: 100%" :teleported="true" placeholder="请选择">
                <el-option :value="null" label="（无）" />
                <el-option v-for="opt in primaryStatOptions" :key="`p2_${opt.value}`" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
            <div v-for="col in equipmentAffixColumns" :key="`p2v_${col.index}`" class="matrix-cell">
              <input type="number" step="0.1" v-model.number="selectedEquipmentAffixes.primary2.values[col.index]" class="matrix-input" />
            </div>

            <div class="matrix-cell row-label small">属性加成</div>
            <div class="matrix-cell" style="overflow: visible;">
              <el-select-v2
                  v-model="selectedEquipmentAffixes.adapter.modifierIds"
                  multiple
                  filterable
                  collapse-tags
                  collapse-tags-tooltip
                  size="small"
                  style="width: 100%"
                  :teleported="true"
                  :options="equipmentModifierOptionsV2"
                  placeholder="请选择"
              />
            </div>
            <div v-for="col in equipmentAffixColumns" :key="`adv_${col.index}`" class="matrix-cell">
              <input type="number" step="0.1" v-model.number="selectedEquipmentAffixes.adapter.values[col.index]" class="matrix-input" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="editingMode === 'misc'" class="editor-panel">
        <header class="panel-header">
          <div class="header-left">
            <div class="header-titles">
              <h1 class="edit-title">
                {{
                  miscSection === 'stats'
                    ? '所有属性'
                    : miscSection === 'weapon_table'
                      ? '武器词条数值'
                      : miscSection === 'equipment_table'
                        ? '装备词条模板'
                      : miscSection === 'equipment_categories'
                        ? '装备分类'
                        : '敌人分类'
                }}
              </h1>
              <span class="id-tag">杂项</span>
            </div>
          </div>
        </header>

        <div v-if="miscSection === 'stats'" class="form-section">
          <div class="info-banner">
            这里只维护“已适配”的属性；武器/装备数值只有配置到这些属性上才会生效。
          </div>

          <div v-if="availableCoreStatsToAdd.length > 0" style="margin-top: 18px;">
            <h3 class="section-title">快速添加（已适配属性）</h3>
            <div style="display:flex; flex-wrap: wrap; gap: 10px;">
              <button
                  v-for="s in availableCoreStatsToAdd"
                  :key="s.id"
                  class="ea-btn ea-btn--glass-cut"
                  :style="{ '--ea-btn-accent': s.unit === 'percent' ? 'var(--ea-gold)' : 'var(--ea-purple)' }"
                  @click="addCoreModifierDef(s.id)"
              >{{ s.label }}提升</button>
            </div>
          </div>

          <h3 class="section-title" style="margin-top: 18px;">属性列表（可拖拽排序）</h3>

          <div v-if="misc.modifierDefs.length === 0" class="empty-hint">
            暂无属性，请使用上方“快速添加”
          </div>

          <draggable v-model="misc.modifierDefs" :item-key="(item) => item.id" handle=".drag-handle" :animation="150">
            <template #item="{ element }">
              <div class="editor-row" style="align-items:center;">
                <div class="drag-handle" style="cursor: grab; color:#666; font-family: monospace;">≡</div>
                <div class="flex-grow">
                  <div class="form-grid" style="grid-template-columns: 1fr 160px 110px; gap: 12px; align-items:end;">
                    <div class="form-group">
                      <label>名称</label>
                      <input v-model="element.label" type="text" />
                    </div>
                    <div class="form-group">
                      <label>单位</label>
                      <div class="unit-badge" :class="element.unit">
                        {{ element.unit === 'percent' ? '百分比 (%)' : '固定数值' }}
                      </div>
                    </div>
                    <div class="form-group">
                      <label>操作</label>
                      <button class="ea-btn ea-btn--md ea-btn--fill-danger" @click="removeModifierDef(element.id)">移除</button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <div v-else-if="miscSection === 'weapon_table'" class="form-section">
          <h3 class="section-title">武器词条数值表</h3>
          <div class="info-banner">
            此处配置属性在不同等级（1-9级）和不同幅度（大/中/小）下的具体数值。<br>
          </div>

          <div v-if="modifierDefs.length === 0" class="empty-hint">
            暂无属性，请先在“所有属性”中添加。
          </div>

          <div class="weapon-table-list">
            <div v-for="def in modifierDefs" :key="def.id" class="stat-table-card">
              <div class="stat-header">
                <div class="stat-title-group">
                  <span class="stat-name">{{ def.label }}</span>
                  <span class="stat-unit-badge" :class="def.unit">
            {{ def.unit === 'percent' ? '百分比 (%)' : '固定数值' }}
          </span>
                </div>
                <div class="stat-id">ID: {{ def.id }}</div>
              </div>

              <div class="stat-body" v-if="ensureWeaponCommonEntry(def.id)">
                <div class="matrix-grid">
                  <div class="matrix-cell header-corner">等级</div>
                  <div v-for="lv in 9" :key="`h-${lv}`" class="matrix-cell header-level">{{ lv }}</div>

                  <div class="matrix-cell row-label large">大</div>
                  <div v-for="i in 9" :key="`l-${i}`" class="matrix-cell">
                    <input
                        type="number"
                        :step="def.unit === 'percent' ? 0.1 : 1"
                        v-model.number="misc.weaponCommonModifiers[def.id].large[i - 1]"
                        class="matrix-input"
                    />
                  </div>

                  <div class="matrix-cell row-label medium">中</div>
                  <div v-for="i in 9" :key="`m-${i}`" class="matrix-cell">
                    <input
                        type="number"
                        :step="def.unit === 'percent' ? 0.1 : 1"
                        v-model.number="misc.weaponCommonModifiers[def.id].medium[i - 1]"
                        class="matrix-input"
                    />
                  </div>

                  <div class="matrix-cell row-label small">小</div>
                  <div v-for="i in 9" :key="`s-${i}`" class="matrix-cell">
                    <input
                        type="number"
                        :step="def.unit === 'percent' ? 0.1 : 1"
                        v-model.number="misc.weaponCommonModifiers[def.id].small[i - 1]"
                        class="matrix-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="miscSection === 'equipment_table'" class="form-section">
          <h3 class="section-title">Lv70 装备词条数值模板</h3>
          <div class="info-banner">
            这里维护护甲/护手/配件三种“数值模板”，在装备编辑页（Lv70）可一键套用到主词条数值（不包含词条类型）。
          </div>

          <div class="weapon-table-list">
            <div v-for="slotKey in ['armor','gloves','accessory']" :key="`eqtpl_${slotKey}`" class="stat-table-card">
              <div class="stat-header">
                <div class="stat-title-group">
                  <span class="stat-name">
                    {{ slotKey === 'armor' ? '护甲' : (slotKey === 'gloves' ? '护手' : '配件') }}
                  </span>
                  <span class="stat-unit-badge flat">数值</span>
                </div>
                <div class="stat-id">模板</div>
              </div>

              <div class="stat-body" v-if="ensureEquipmentTemplate(slotKey)">
                <div class="matrix-grid" style="grid-template-columns: 80px repeat(4, minmax(60px, 1fr));">
                  <div class="matrix-cell header-corner">词条</div>
                  <div class="matrix-cell header-level">初始</div>
                  <div class="matrix-cell header-level">精锻1</div>
                  <div class="matrix-cell header-level">精锻2</div>
                  <div class="matrix-cell header-level">精锻3</div>

                  <div class="matrix-cell row-label large">主词条</div>
                  <div v-for="i in 4" :key="`t_${slotKey}_p1_${i}`" class="matrix-cell">
                    <input type="number" step="0.1" v-model.number="misc.equipmentTemplates[slotKey].primary1[i - 1]" class="matrix-input" />
                  </div>

                  <div class="matrix-cell row-label medium">副词条</div>
                  <div v-for="i in 4" :key="`t_${slotKey}_p2_${i}`" class="matrix-cell">
                    <input type="number" step="0.1" v-model.number="misc.equipmentTemplates[slotKey].primary2[i - 1]" class="matrix-input" />
                  </div>

                  <div class="matrix-cell row-label small">主词条(单)</div>
                  <div v-for="i in 4" :key="`t_${slotKey}_p1s_${i}`" class="matrix-cell">
                    <input type="number" step="0.1" v-model.number="misc.equipmentTemplates[slotKey].primary1Single[i - 1]" class="matrix-input" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="miscSection === 'equipment_categories'" class="form-section">
          <h3 class="section-title">装备分类（增删 / 排序）</h3>
          <div class="info-banner">删除分类后，该分类下装备会变为未分类（分类为空）。</div>

          <div class="add-cat-row" style="display:flex; gap: 10px; margin-bottom: 12px;">
            <input v-model="newEquipmentCategoryName" placeholder="输入新分类名..." />
            <button class="ea-btn ea-btn--md ea-btn--fill-success" @click="addEquipmentCategory">添加</button>
          </div>

          <draggable v-model="equipmentCategories" :item-key="(item) => item" handle=".drag-handle" :animation="150">
            <template #item="{ element }">
              <div class="editor-row" style="align-items:center;">
                <div class="drag-handle" style="cursor: grab; color:#666; font-family: monospace;">≡</div>
                <div class="flex-grow" style="color:#ddd;">{{ element }}</div>
                <button class="ea-btn ea-btn--md ea-btn--fill-danger" @click="deleteEquipmentCategory(element)">删除</button>
              </div>
            </template>
          </draggable>
        </div>

        <div v-else-if="miscSection === 'enemy_categories'" class="form-section">
          <h3 class="section-title">敌人分类（增删 / 排序）</h3>
          <div class="info-banner">删除分类后，该分类下敌人会变为未分类（分类为空）。</div>

          <div class="add-cat-row" style="display:flex; gap: 10px; margin-bottom: 12px;">
            <input v-model="newEnemyCategoryName" placeholder="输入新分类名..." />
            <button class="ea-btn ea-btn--md ea-btn--fill-success" @click="addEnemyCategory">添加</button>
          </div>

          <draggable v-model="enemyCategories" :item-key="(item) => item" handle=".drag-handle" :animation="150">
            <template #item="{ element }">
              <div class="editor-row" style="align-items:center;">
                <div class="drag-handle" style="cursor: grab; color:#666; font-family: monospace;">≡</div>
                <div class="flex-grow" style="color:#ddd;">{{ element }}</div>
                <button class="ea-btn ea-btn--md ea-btn--fill-danger" @click="deleteEnemyCategory(element)">删除</button>
              </div>
            </template>
          </draggable>
        </div>
      </div>

      <div v-else-if="editingMode === 'weapon' && selectedWeapon" class="editor-panel">
        <header class="panel-header">
          <div class="header-left">
            <div class="avatar-wrapper-large" :class="`rarity-${Math.max(3, selectedWeapon.rarity || 3)}-border`" style="display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff; overflow:hidden;">
              <img
                  :key="selectedWeapon.icon || selectedWeapon.id"
                  :src="selectedWeapon.icon || '/weapons/default.webp'"
                  @error="e=>e.target.src='/weapons/default.webp'"
                  style="width:100%; height:100%; object-fit:cover;" />
            </div>
            <div class="header-titles">
              <h1 class="edit-title">{{ selectedWeapon.name }}</h1>
              <span class="id-tag">{{ selectedWeapon.id }}</span>
            </div>
          </div>
          <button class="ea-btn ea-btn--md ea-btn--fill-danger" @click="deleteCurrentWeapon">删除此武器</button>
        </header>

        <div class="form-section">
          <h3 class="section-title">基础信息</h3>
          <div class="form-grid three-col">
            <div class="form-group"><label>名称</label><input v-model="selectedWeapon.name" type="text" /></div>
            <div class="form-group"><label>ID (Unique)</label><input :value="selectedWeapon.id" @input="updateWeaponId" type="text" /></div>
            <div class="form-group">
              <label>星级</label>
              <el-select v-model="selectedWeapon.rarity" size="large" style="width: 100%">
                <el-option :value="6" label="6 ★" />
                <el-option :value="5" label="5 ★" />
                <el-option :value="4" label="4 ★" />
                <el-option :value="3" label="3 ★" />
              </el-select>
            </div>
            <div class="form-group">
              <label>类型</label>
              <el-select v-model="selectedWeapon.type" size="large" style="width: 100%">
                <el-option v-for="wpn in WEAPON_TYPES" :key="wpn.value" :label="wpn.label" :value="wpn.value" />
              </el-select>
            </div>
            <div class="form-group full-width"><label>图标路径</label><input v-model="selectedWeapon.icon" type="text" /></div>
            <div class="form-group full-width">
              <div class="form-grid" style="gap: 20px;">
                <div class="form-group">
                  <label>BUFF 名称</label>
                  <input v-model="selectedWeapon.buffName" type="text" />
                </div>
                <div class="form-group">
                  <label>持续时间 (s)</label>
                  <input type="number" min="0" step="0.1" v-model.number="selectedWeapon.duration">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">武器数值</h3>
          <div class="info-banner">
            前两段为通用词条：选“属性项 + 大/中/小”。第三段为该武器专属：可添加多条属性，并为 1–9 级单独填数值。
          </div>

          <div class="weapon-seg">
            <div class="weapon-seg-title">
              <span class="seg-bar"></span>
              <span>通用词条</span>
            </div>
            <div class="form-grid" style="grid-template-columns: 1fr 160px; gap: 14px; align-items: end;">
              <div class="form-group">
                <label>属性项</label>
                <el-select
                    v-model="selectedWeapon.commonSlots[0].modifierId"
                    size="large"
                    style="width: 100%"
                    placeholder="请选择"
                >
                  <el-option :value="null" label="（无）" />
                  <el-option v-for="def in modifierDefs" :key="def.id" :label="def.label" :value="def.id" />
                </el-select>
              </div>
              <div class="form-group">
                <label>幅度</label>
                <el-select v-model="selectedWeapon.commonSlots[0].size" size="large" style="width: 100%">
                  <el-option value="large" label="大" />
                  <el-option value="medium" label="中" />
                  <el-option value="small" label="小" />
                </el-select>
              </div>
            </div>
          </div>

          <div class="weapon-seg">
            <div class="weapon-seg-title">
              <span class="seg-bar"></span>
              <span>通用词条</span>
            </div>
            <div class="form-grid" style="grid-template-columns: 1fr 160px; gap: 14px; align-items: end;">
              <div class="form-group">
                <label>属性项</label>
                <el-select
                    v-model="selectedWeapon.commonSlots[1].modifierId"
                    size="large"
                    style="width: 100%"
                    placeholder="请选择"
                >
                  <el-option :value="null" label="（无）" />
                  <el-option v-for="def in modifierDefs" :key="def.id" :label="def.label" :value="def.id" />
                </el-select>
              </div>
              <div class="form-group">
                <label>幅度</label>
                <el-select v-model="selectedWeapon.commonSlots[1].size" size="large" style="width: 100%">
                  <el-option value="large" label="大" />
                  <el-option value="medium" label="中" />
                  <el-option value="small" label="小" />
                </el-select>
              </div>
            </div>
          </div>

          <div class="weapon-seg">
            <div class="weapon-seg-title">
              <span class="seg-bar"></span>
              <span>专属 BUFF</span>
            </div>
            <div class="info-banner">
              当前先按常驻属性处理（与前两段同样加减）；未来可能扩展为“仅在持续时间内生效”。
            </div>

            <div style="display:flex; justify-content: space-between; align-items:center; gap: 10px; margin-bottom: 12px;">
              <div style="color:#aaa; font-size: 13px;">
                BUFF 名称：<span style="color:#ffd700; font-weight:700;">{{ selectedWeapon.buffName || '（未填写）' }}</span>
              </div>
              <button class="ea-btn ea-btn--md ea-btn--glass-rect" :style="{ '--ea-btn-accent': 'var(--ea-purple)' }" @click="addWeaponBuffBonusRow">＋ 添加属性</button>
            </div>

            <div v-if="selectedWeapon.buffBonuses && selectedWeapon.buffBonuses.length > 0" class="matrix-editor-area">
              <div
                v-for="(bonus, idx) in selectedWeapon.buffBonuses"
                :key="idx"
                class="editor-row"
                style="align-items: flex-start;"
              >
                <div style="display:flex; flex-direction: column; gap: 10px; width: 100%;">
                  <div class="form-grid" style="grid-template-columns: 1fr 140px; gap: 12px; align-items:end;">
                    <div class="form-group">
                      <label>属性项</label>
                      <el-select
                          v-model="bonus.modifierId"
                          size="large"
                          style="width: 100%"
                          placeholder="请选择"
                      >
                        <el-option :value="null" label="（无）" />
                        <el-option v-for="def in modifierDefs" :key="def.id" :label="def.label" :value="def.id" />
                      </el-select>
                    </div>
                    <div class="form-group">
                      <label>操作</label>
                      <button class="ea-btn ea-btn--md ea-btn--fill-danger" @click="removeWeaponBuffBonusRow(idx)">删除</button>
                    </div>
                  </div>

                  <div class="form-grid" style="grid-template-columns: repeat(9, minmax(60px, 1fr)); gap: 10px;">
                    <div v-for="lv in 9" :key="lv" class="form-group">
                      <label style="text-align:center;">{{ lv }}级</label>
                      <input type="number" step="0.01" v-model.number="bonus.values[lv - 1]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-hint" style="margin-top: 10px;">
              未添加任何专属属性
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">请从左侧列表选择条目</div>
    </main>
  </div>
</template>

<style scoped>
.cms-layout { display: flex; height: 100vh; background-color: #1e1e1e; color: #f0f0f0; overflow: hidden; font-family: 'Segoe UI', Roboto, sans-serif; }

/* Sidebar */
.cms-sidebar { width: 300px; background-color: #252526; border-right: 1px solid #333; display: flex; flex-direction: column; flex-shrink: 0; }
.sidebar-tabs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 10px; background: #1e1e1e; border-bottom: 1px solid #333; }
.sidebar-tabs .ea-btn { flex: 1 1 90px; min-width: 90px; justify-content: center; height: 34px; padding: 0 10px; font-size: 12px; }
.sidebar-tabs .ea-btn--glass-cut { clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%); }

.sidebar-header { padding: 15px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; background: #2b2b2b; }
.sidebar-header h2 { margin: 0; font-size: 16px; color: #ffd700; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
.search-box { padding: 10px; border-bottom: 1px solid #333; background: #252526; }
.search-box input {
  width: 100%;
  padding: 8px 12px;
  box-sizing: border-box;
  background: #16161a;
  border: none;
  box-shadow: 0 0 0 1px #333 inset;
  color: #fff;
  border-radius: 0;
  font-size: 13px;
  transition: box-shadow 0.2s, background-color 0.2s;
}
.search-box input:focus {
  box-shadow: 0 0 0 1px #ffd700 inset;
  outline: none;
  background-color: #1f1f24;
}
.enemy-group { margin-bottom: 15px; border: 1px solid #2b2b2b; border-radius: 6px; padding: 6px; background: #1a1a1a; }
.group-title { font-size: 11px; color: #ccc; font-weight: bold; text-transform: uppercase; padding: 6px 8px; background: #242424; border-radius: 4px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; column-gap: 8px; }
.group-meta { display: flex; align-items: center; gap: 8px; }
.group-count { color: #999; font-size: 12px; }
.toggle-arrow { transition: transform 0.2s; }
.toggle-arrow.is-rotated { transform: rotate(90deg); }
.add-cat-row input { flex: 1; background: #1a1a1a; border: 1px solid #444; color: #fff; padding: 8px; border-radius: 4px; }

/* Character List */
.char-list { flex-grow: 1; overflow-y: auto; padding: 10px; }
.char-item { display: flex; align-items: center; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; margin-bottom: 4px; border: 1px solid transparent; border-left: 3px solid transparent; padding-left: 8px; }
.char-item:hover { background-color: #2d2d2d; border-color: #444; }
.char-item.active { background-color: #37373d; box-shadow: 0 0 10px rgba(0,0,0,0.2); }
.empty-hint { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }

.avatar-wrapper-small { width: 44px; height: 44px; border-radius: 6px; margin-right: 12px; background: #333; position: relative; overflow: hidden; border: 2px solid #444; flex-shrink: 0; box-sizing: border-box; }
.avatar-wrapper-small[class*="rarity-6-border"] { border: 2px solid transparent; background: linear-gradient(#2b2b2b, #2b2b2b) padding-box, linear-gradient(135deg, #FFD700, #FF8C00, #FF4500) border-box; box-shadow: 0 0 6px rgba(255, 140, 0, 0.3); }
.avatar-wrapper-small img { width: 100%; height: 100%; object-fit: cover; display: block; }
.char-info { display: flex; flex-direction: column; justify-content: center; }
.char-name { font-weight: bold; font-size: 14px; margin-bottom: 2px; color: #f0f0f0; }
.char-meta { font-size: 12px; font-weight: bold; }
.rarity-6 { background: linear-gradient(45deg, #FFD700, #FF8C00, #FF4500); background-clip: text; -webkit-background-clip: text; color: transparent; }
.rarity-5 { color: #ffc400; }
.rarity-4 { color: #d8b4fe; }
.rarity-3, .rarity-2, .rarity-1 { color: #888; }
.char-meta.rarity-6 {
  background: linear-gradient(45deg, #FFD700, #FF8C00, #FF4500);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.char-meta.rarity-5 { color: #ffc400; }
.char-meta.rarity-4 { color: #d8b4fe; }
.char-meta.rarity-3, .char-meta.rarity-2, .char-meta.rarity-1 { color: #aaa; }

/* Sidebar Footer */
.sidebar-footer { padding: 15px; border-top: 1px solid #333; display: flex; flex-direction: column; gap: 10px; background: #2b2b2b; }

/* Main Content */
.cms-content { flex-grow: 1; overflow-y: auto; padding: 30px 40px; background-color: #1e1e1e; }
.editor-panel { max-width: 1000px; margin: 0 auto; animation: fadeIn 0.3s ease; --ea-tier-color: #fff; }

/* Header */
.panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 1px solid #333; padding-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 20px; }
.avatar-wrapper-large { width: 80px; height: 80px; border-radius: 8px; background: #333; position: relative; overflow: hidden; border: 3px solid #555; box-shadow: 0 4px 8px rgba(0,0,0,0.3); flex-shrink: 0; box-sizing: border-box; }
.avatar-wrapper-large img { width: 100%; height: 100%; object-fit: cover; display: block; }
.header-titles { display: flex; flex-direction: column; gap: 5px; }
.edit-title { margin: 0; font-size: 28px; font-weight: 700; color: #f0f0f0; }
.id-tag { font-size: 14px; color: #666; font-family: 'Roboto Mono', monospace; background: #252526; padding: 2px 8px; border-radius: 4px; border: 1px solid #333; align-self: flex-start; }

/* Tabs */
.cms-tabs { display: flex; gap: 2px; margin-bottom: 20px; border-bottom: 2px solid #333; }
.cms-tabs button { background: #252526; border: none; color: #888; padding: 10px 18px; cursor: pointer; border-radius: 6px 6px 0 0; transition: all 0.2s; font-weight: 500; font-size: 13px; display: flex; align-items: center; gap: 6px; border-bottom: 2px solid transparent; }
.cms-tabs button:hover { background: #2d2d2d; color: #ccc; }
.cms-tabs button.active { background: #333; color: #ffd700; font-weight: bold; border-bottom-color: #ffd700; box-shadow: none; }
.cms-tabs button svg { flex-shrink: 0; opacity: 0.7; transition: opacity 0.2s; }
.cms-tabs button.active svg { opacity: 1; }

/* Forms */
.form-section { background: #252526; padding: 25px; border-radius: 0 0 8px 8px; margin-top: -22px; border: 1px solid #333; border-top: none; }
.section-title { font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #333; padding-bottom: 8px; margin: 30px 0 15px 0; }
.section-title:first-child { margin-top: 0; }
.weapon-seg { margin-top: 16px; }
.weapon-seg:first-child { margin-top: 10px; }
.weapon-seg-title { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: #ddd; margin-bottom: 10px; }
.weapon-seg-title .seg-bar { width: 4px; height: 18px; background-color: #ffd700; flex-shrink: 0; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px 20px; }
.form-grid.three-col { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.form-group { display: flex; flex-direction: column; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label { margin-bottom: 8px; color: #aaa; font-size: 12px; font-weight: 500; }
.form-group input {
  background: #16161a;
  border: none;
  box-shadow: 0 0 0 1px #333 inset;
  color: #f0f0f0;
  padding: 10px 12px;
  border-radius: 0;
  font-size: 14px;
  transition: box-shadow 0.2s, background-color 0.2s;
}
.form-group input:focus {
  box-shadow: 0 0 0 1px #ffd700 inset;
  outline: none;
  background: #1f1f24;
}

:deep(.enemy-tier-select .el-input__inner) {
  color: var(--ea-tier-color) !important;
}

/* Variant Card Style */
.variant-card { background: #2b2b2b; border: 1px solid #444; border-radius: 6px; padding: 15px; margin-bottom: 15px; border-left: 4px solid #ffd700; }
.variant-header { display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center; }
.variant-idx { font-weight: bold; color: #ffd700; font-size: 12px; }

/* Checkbox & Exclusive */
.checkbox-wrapper { background: #1a1a1a; border: 1px solid #444; padding: 0 15px; border-radius: 4px; display: flex; align-items: center; height: 38px; cursor: pointer; transition: all 0.2s; }
.checkbox-wrapper:hover { border-color: #666; }
.checkbox-wrapper.is-checked { border-color: #ffd700; background: rgba(255, 215, 0, 0.05); }
.checkbox-wrapper input { margin-right: 10px; cursor: pointer; width: 16px; height: 16px; accent-color: #ffd700; }
.checkbox-wrapper label { margin: 0; cursor: pointer; color: #ccc; }
.exclusive-list { display: flex; flex-direction: column; gap: 10px; }
.exclusive-row { display: flex; gap: 10px; align-items: center; }
.exclusive-row input {
  background: #16161a;
  border: none;
  box-shadow: 0 0 0 1px #333 inset;
  color: #fff;
  padding: 8px;
  border-radius: 0;
  font-size: 13px;
  transition: box-shadow 0.2s, background-color 0.2s;
}
.exclusive-row input:focus {
  box-shadow: 0 0 0 1px #ffd700 inset;
  outline: none;
  background: #1f1f24;
}
.flex-grow { flex-grow: 1; }
.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; background: #1a1a1a; padding: 15px; border-radius: 6px; border: 1px solid #333; margin-bottom: 20px; }
.cb-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #bbb; cursor: pointer; user-select: none; padding: 5px; border-radius: 4px; transition: background 0.1s; }
.cb-item:hover { background: #252526; }
.cb-item input { accent-color: #ffd700; width: 16px; height: 16px; }
.cb-item.exclusive { color: #ffd700; }


/* Matrix Editor */
.matrix-editor-area { margin-top: 25px; border-top: 1px dashed #444; padding-top: 20px; }
.anomalies-grid-editor { display: flex; flex-direction: column; gap: 10px; }
.editor-row { display: flex; flex-wrap: wrap; gap: 10px; background: #1f1f1f; padding: 10px; border-radius: 6px; border: 1px solid #333; align-items: center; }
.card-select { width: 100%; }
:deep(.card-select .el-input__wrapper) { padding: 0 8px; min-height: 24px; }
:deep(.card-select .el-input__inner) { font-size: 12px; height: 24px; line-height: 24px; }

.unit-badge {
  height: 34px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: #1a1a1a;
  border: 1px solid #333;
  color: #666;
  font-size: 13px;
  user-select: none;
  white-space: nowrap;
}

.unit-badge.percent {
  color: #ffd700;
  background: rgba(255, 215, 0, 0.05);
  border-color: rgba(255, 215, 0, 0.2);
}

.unit-badge.flat {
  color: #b37feb;
  background: rgba(179, 127, 235, 0.05);
  border-color: rgba(179, 127, 235, 0.2);
}

.weapon-table-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 10px;
}

.stat-table-card {
  background: #1f1f1f;
  border: 1px solid #333;
  border-radius: 6px;
  overflow: hidden;
}

.stat-header {
  background: #2b2b2b;
  padding: 8px 15px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-name {
  font-weight: bold;
  color: #f0f0f0;
  font-size: 14px;
}

.stat-unit-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #333;
  color: #aaa;
  text-transform: uppercase;
}

.stat-unit-badge.percent {
  color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.stat-id {
  font-family: monospace;
  font-size: 11px;
  color: #555;
}

.stat-body {
  padding: 15px;
  overflow-x: auto;
}

.matrix-grid {
  display: grid;
  grid-template-columns: 60px repeat(9, minmax(50px, 1fr));
  gap: 1px;
  background: #333;
  border: 1px solid #333;
}

.matrix-cell {
  background: #16161a;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
}

.matrix-cell.header-corner {
  background: #252526;
  color: #888;
  font-size: 11px;
  font-weight: bold;
}

.matrix-cell.header-level {
  background: #252526;
  color: #aaa;
  font-size: 12px;
  font-family: monospace;
}

.matrix-cell.row-label {
  font-size: 12px;
  font-weight: bold;
}

.matrix-cell.row-label.large { color: #ff7875; border-left: 3px solid #ff7875; }
.matrix-cell.row-label.medium { color: #ffd700; border-left: 3px solid #ffd700; }
.matrix-cell.row-label.small { color: #69c0ff; border-left: 3px solid #69c0ff; }

.matrix-input {
  width: 100%;
  background: transparent !important;
  border: none !important;
  color: #fff !important;
  text-align: center;
  font-family: 'Roboto Mono', monospace;
  font-size: 13px;
  padding: 0 !important;
  height: 100%;
  box-shadow: none !important;
}

.matrix-input:focus {
  color: #ffd700 !important;
  font-weight: bold;
}

.matrix-cell:focus-within {
  background: #2a2a30;
}
/* === 卡片样式 === */
.editor-card {
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 8px;
  width: 170px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.2s, border-color 0.2s;
}
.editor-card:hover {
  border-color: #777;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #3a3a3a;
  padding-bottom: 4px;
  margin-bottom: 2px;
}
.card-label {
  font-size: 11px;
  color: #888;
  font-family: monospace;
}

.full-width-mb {
  width: 100%;
  margin-bottom: 4px;
}

.card-props-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.prop-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.prop-item.full-span {
  grid-column: span 2;
}

.prop-item label {
  font-size: 10px;
  color: #aaa;
}

.input-with-unit {
  display: flex;
  align-items: center;
  background: #16161a;
  border: none;
  box-shadow: 0 0 0 1px #333 inset;
  border-radius: 0;
  overflow: hidden;
}
.input-with-unit:focus-within {
  box-shadow: 0 0 0 1px #ffd700 inset;
  background: #1f1f24;
}

.mini-input {
  width: 100% !important;
  border: none !important;
  background: transparent !important;
  padding: 2px 4px !important;
  text-align: center;
  color: #fff;
  font-size: 12px;
  height: 20px;
}
.mini-input:focus {
  background: transparent !important;
  outline: none;
}

.unit {
  font-size: 10px;
  color: #666;
  padding-right: 4px;
  background: transparent;
  user-select: none;
}

/* Ticks Editor Area */
.ticks-editor-area { background: #1f1f1f; padding: 15px; border-radius: 6px; border: 1px solid #333; margin-bottom: 20px; }
.tick-row { display: flex; flex-direction: column; align-items: stretch; gap: 10px; margin-bottom: 8px; background: #2b2b2b; padding: 10px; border-radius: 4px; border-left: 3px solid #666; }
.tick-top { display: flex; align-items: center; gap: 15px; width: 100%; }
.tick-idx { font-family: monospace; color: #888; font-size: 12px; width: 48px; }
.tick-inputs { display: flex; gap: 15px; flex-grow: 1; flex-wrap: wrap; }
.t-group { display: flex; align-items: center; gap: 6px; }
.t-group label { font-size: 11px; color: #aaa; white-space: nowrap; }
.tick-binding { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.tick-select { width: 100%; }
:deep(.tick-binding label) { font-size: 12px; color: #ccc; font-weight: 600; letter-spacing: 0.2px; }
:deep(.tick-select .el-input__wrapper) { background: #16161a; box-shadow: 0 0 0 1px #333 inset; }

.binding-option { display: flex; align-items: center; gap: 8px; padding: 2px 0; }
.binding-option__icon { width: 18px; height: 18px; border-radius: 3px; object-fit: cover; background: #111; box-shadow: 0 0 0 1px rgba(255,255,255,0.08) inset; flex: 0 0 auto; }
.binding-option__label { font-size: 12px; color: #e6e6e6; }
.binding-option__hint { font-size: 11px; color: #9aa0a6; margin-left: 4px; white-space: nowrap; opacity: 0.95; }

.empty-ticks-hint { color: #666; font-size: 12px; text-align: center; padding: 10px; font-style: italic; }

.info-banner { background: rgba(50, 50, 50, 0.5); padding: 12px; border-left: 3px solid #666; color: #aaa; margin-bottom: 20px; font-size: 13px; border-radius: 0 4px 4px 0; }
.empty-state { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 400px; color: #666; font-size: 16px; border: 2px dashed #333; border-radius: 8px; margin-top: 20px; }

.attack-seg-toolbar { display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid #333; background: #1f1f1f; border-radius: 6px; margin-bottom: 14px; }
.attack-seg-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
.attack-seg-toolbar .ea-btn--sm { height: 30px; padding: 0 10px; font-size: 12px; }
.attack-seg-toolbar .ea-btn.active { box-shadow: 0 0 0 1px #ffd700 inset, 0 0 14px rgba(255, 215, 0, 0.15); }
.attack-seg-toolbar .ea-btn--glass-cut { clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%); }
.attack-seg-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; color: #aaa; font-size: 12px; }
.attack-seg-meta .meta-item { color: #ccc; font-weight: 600; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.rarity-6-border { border: 2px solid transparent; background: linear-gradient(#2b2b2b, #2b2b2b) padding-box, linear-gradient(135deg, #FFD700, #FF8C00, #FF4500) border-box; box-shadow: 0 0 6px rgba(255, 140, 0, 0.3); }
.rarity-5-border { border-color: #ffc400; }
.rarity-4-border { border-color: #d8b4fe; }
</style>