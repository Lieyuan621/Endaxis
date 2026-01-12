<script setup>
import { ref, computed, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { executeSave } from '@/api/saveStrategy.js'

const store = useTimelineStore()
const { characterRoster, iconDatabase, enemyDatabase, enemyCategories, weaponDatabase } = storeToRefs(store)

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

const ENEMY_TIERS = store.ENEMY_TIERS
const TIER_WEIGHTS = { 'boss': 4, 'champion': 3, 'elite': 2, 'normal': 1 }
const HIDDEN_CHECKBOX_KEYS = ['default']
const effectKeys = Object.keys(EFFECT_NAMES).filter(key => !HIDDEN_CHECKBOX_KEYS.includes(key))

// === 状态与计算属性 ===

const editingMode = ref('character') // 'character' | 'enemy' | 'weapon'
const searchQuery = ref('')
const selectedCharId = ref(null)
const selectedEnemyId = ref(null)
const selectedWeaponId = ref(null)
const activeTab = ref('basic')
const newCategoryName = ref('')

const filteredRoster = computed(() => {
  let list = characterRoster.value || []
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
  }
  return list.sort((a, b) => (b.rarity || 0) - (a.rarity || 0))
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
  return list
      .sort((a, b) => (order[a.type] || 99) - (order[b.type] || 99))
      .sort((a, b) => (b.rarity || 0) - (a.rarity || 0))
})

const groupedWeapons = computed(() => {
  const groups = WEAPON_TYPES.map(t => ({ name: t.label.split(' ')[0], key: t.value, list: [] }))
  filteredWeapons.value.forEach(w => {
    const grp = groups.find(g => g.key === w.type) || groups[groups.length - 1]
    grp.list.push(w)
  })
  return groups.filter(g => g.list.length > 0)
})

const selectedChar = computed(() => {
  return characterRoster.value.find(c => c.id === selectedCharId.value)
})

const selectedEnemy = computed(() => {
  return enemyDatabase.value.find(e => e.id === selectedEnemyId.value)
})

const selectedWeapon = computed(() => {
  return weaponDatabase.value.find(w => w.id === selectedWeaponId.value)
})

const collapsedEnemyGroups = ref(new Set())
const collapsedWeaponGroups = ref(new Set())

// === 生命周期 ===

watch(characterRoster, (newList) => {
  if (newList && newList.length > 0 && !selectedCharId.value) {
    selectedCharId.value = newList[0].id
  }
}, { immediate: true })

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
  }
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

function addNewCharacter() {
  const newId = `char_${Date.now()}`
  const allGlobalEffects = [...effectKeys]

  const newChar = {
    id: newId, name: "新干员", rarity: 5, element: "physical", weapon: "sword", avatar: "/avatars/default.png", exclusive_buffs: [],
    accept_team_gauge: true,

    // 初始化各类动作属性
    attack_duration: 2.5, attack_gaugeGain: 0, attack_allowed_types: allGlobalEffects, attack_anomalies: [], attack_damage_ticks: [],
    skill_duration: 2, skill_spCost: 100, skill_gaugeGain: 0, skill_teamGaugeGain: 0, skill_allowed_types: [], skill_anomalies: [], skill_damage_ticks: [], skill_icon: "",
    link_duration: 1.5, link_cooldown: 15, link_gaugeGain: 0, link_allowed_types: [], link_anomalies: [], link_damage_ticks: [], link_icon: "",
    ultimate_duration: 3, ultimate_gaugeMax: 100, ultimate_gaugeReply: 0, ultimate_enhancementTime: 0, ultimate_allowed_types: [], ultimate_anomalies: [], ultimate_damage_ticks: [], ultimate_animationTime: 1.5, ultimate_icon: "",
    execution_duration: 1.5, execution_allowed_types: allGlobalEffects, execution_anomalies: [], execution_damage_ticks: [],

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
    avatar: '/Icon_Enemy/default_enemy.png',
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
    type: 'sword',
    rarity: 3,
    duration: 0,
    icon: '/weapons/default.png'
  }
  if (!weaponDatabase.value) weaponDatabase.value = []
  weaponDatabase.value.push(newWeapon)
  selectedWeaponId.value = newId
  ElMessage.success('已添加新武器')
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

function quickAddCategory() {
  ElMessageBox.prompt('请输入新的分类名称', '新建分类', {
    confirmButtonText: '添加',
    cancelButtonText: '取消',
    inputPattern: /\S+/,
    inputErrorMessage: '分类名称不能为空'
  }).then(({ value }) => {
    const val = value.trim()
    if (val && !enemyCategories.value.includes(val)) {
      enemyCategories.value.push(val)
      // 自动选中新添加的分类
      if (selectedEnemy.value) {
        selectedEnemy.value.category = val
      }
      ElMessage.success(`已添加并选中: ${val}`)
    } else if (enemyCategories.value.includes(val)) {
      ElMessage.warning('该分类已存在')
    }
  }).catch(() => {})
}
// === 判定点逻辑 (Damage Ticks) ===
function getDamageTicks(char, type) {
  if (!char) return []
  const key = `${type}_damage_ticks`
  if (!char[key]) char[key] = []
  normalizeDamageTicks(char[key])
  return char[key]
}

function addDamageTick(char, type) {
  const list = getDamageTicks(char, type)
  // 默认判定点：0秒时，造成0失衡，回复0技力
  list.push({ offset: 0, stagger: 0, sp: 0, boundEffects: [] })
}

function removeDamageTick(char, type, index) {
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
}

function removeVariant(idx) {
  if (selectedChar.value.variants) {
    selectedChar.value.variants.splice(idx, 1)
  }
}

function onVariantTypeChange(variant) {
  if (!selectedChar.value) return
  const newStats = getSnapshotFromBase(selectedChar.value, variant.type)
  Object.assign(variant, newStats)

  if (variant.name === '新强化技能' || variant.name.startsWith('强化')) {
    const typeObj = VARIANT_TYPES.find(t => t.value === variant.type)
    if (typeObj) {
      const labelName = typeObj.label
      variant.name = `强化${labelName}`
    }
  }
}

// === 变体Checkbox逻辑 ===

function onVariantCheckChange(variant, key) {
  if (!variant.allowedTypes) variant.allowedTypes = []
  const list = variant.allowedTypes
  const isChecked = list.includes(key)
  handleGroupCheck(list, isChecked, key)
}

function onCheckChange(char, skillType, key) {
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
    } else {
      const keep = list.filter(item => !group.includes(item))
      list.length = 0
      keep.forEach(k => list.push(k))
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

function getVariantAvailableOptions(variant) {
  const allowedList = variant.allowedTypes || []
  const combinedKeys = new Set([...allowedList, 'default'])
  return buildOptions(combinedKeys)
}

function getAvailableAnomalyOptions(skillType) {
  if (!selectedChar.value) return []
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
  const rows = Array.isArray(raw[0]) ? raw : [raw]
  const seen = new Set()
  const options = []

  rows.forEach(row => {
    row.forEach(effect => {
      if (!effect || !effect._id || seen.has(effect._id)) return
      seen.add(effect._id)
      options.push({ value: effect._id, label: EFFECT_NAMES[effect.type] || effect.type || 'Unknown' })
    })
  })

  return options
}

function getBindingOptions(skillType) {
  if (!selectedChar.value) return []
  const raw = selectedChar.value[`${skillType}_anomalies`]
  return buildBindingOptionsFromAnomalies(raw)
}

function getVariantBindingOptions(variant) {
  if (!variant) return []
  return buildBindingOptionsFromAnomalies(variant.physicalAnomaly)
}

// === 二维数组通用处理逻辑 ===

function getAnomalyRows(char, skillType) {
  if (!char) return []
  const key = `${skillType}_anomalies`
  const raw = char[key] || []
  if (raw.length === 0) return []
  ensureEffectIds(raw)
  if (!Array.isArray(raw[0])) return [raw]
  return raw
}

function addAnomalyRow(char, skillType) {
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
function addVariantRow(variant) {
  if (!variant.physicalAnomaly) variant.physicalAnomaly = []
  const defaultType = (variant.allowedTypes && variant.allowedTypes.length > 0) ? variant.allowedTypes[0] : 'default'
  variant.physicalAnomaly.push([createEffect(defaultType)])
}

function addVariantEffect(variant, rowIndex) {
  if (variant.physicalAnomaly && variant.physicalAnomaly[rowIndex]) {
    const defaultType = (variant.allowedTypes && variant.allowedTypes.length > 0) ? variant.allowedTypes[0] : 'default'
    variant.physicalAnomaly[rowIndex].push(createEffect(defaultType))
  }
}

function removeVariantEffect(variant, rowIndex, colIndex) {
  if (variant.physicalAnomaly && variant.physicalAnomaly[rowIndex]) {
    variant.physicalAnomaly[rowIndex].splice(colIndex, 1)
    if (variant.physicalAnomaly[rowIndex].length === 0) {
      variant.physicalAnomaly.splice(rowIndex, 1)
    }
  }
}

function getVariantTicks(variant) {
  if (!variant.damageTicks) variant.damageTicks = []
  normalizeDamageTicks(variant.damageTicks)
  return variant.damageTicks
}

// 变体里的判定点操作
function addVariantDamageTick(variant) {
  const ticks = getVariantTicks(variant)
  ticks.push({ offset: 0, stagger: 0, sp: 0, boundEffects: [] })
}
function removeVariantDamageTick(variant, index) {
  const ticks = getVariantTicks(variant)
  ticks.splice(index, 1)
}

function onSkillGaugeInput(event) {
  const val = Number(event.target.value)
  if (selectedChar.value) {
    selectedChar.value.skill_teamGaugeGain = val
  }
}

function normalizeCharacterForSave(char) {
  const skillTypes = ['attack', 'skill', 'link', 'ultimate', 'execution']
  skillTypes.forEach(type => {
    const tickKey = `${type}_damage_ticks`
    if (!char[tickKey]) char[tickKey] = []
    normalizeDamageTicks(char[tickKey])
    ensureEffectIds(char[`${type}_anomalies`])
  })

  if (char.variants) {
    char.variants.forEach(variant => {
      if (!variant.damageTicks) variant.damageTicks = []
      normalizeDamageTicks(variant.damageTicks)
      ensureEffectIds(variant.physicalAnomaly)
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

  const dataToSave = {
    ICON_DATABASE: iconDatabase.value,
    characterRoster: characterRoster.value,
    enemyDatabase: enemyDatabase.value,
    enemyCategories: enemyCategories.value,
    weaponDatabase: weaponDatabase.value
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
          :class="{ 'is-active': editingMode === 'enemy' }"
          :style="{ '--ea-btn-accent': 'var(--ea-danger-soft)' }"
          @click="setMode('enemy')"
        >敌人</button>
      </div>

      <div class="sidebar-header">
        <h2>
          {{
            editingMode === 'character'
              ? '干员数据'
              : editingMode === 'enemy'
                ? '敌人数据'
                : '武器数据'
          }}
        </h2>
        <button class="ea-btn ea-btn--icon ea-btn--icon-28 ea-btn--icon-plus" @click="editingMode === 'character' ? addNewCharacter() : (editingMode === 'enemy' ? addNewEnemy() : addNewWeapon())">＋</button>
      </div>
      <div class="search-box">
        <input v-model="searchQuery" placeholder="搜索 ID 或名称..." />
      </div>

      <div v-if="editingMode === 'character'" class="char-list">
        <div v-for="char in filteredRoster" :key="char.id"
             class="char-item" :class="{ active: char.id === selectedCharId }"
             @click="selectChar(char.id)">

          <div class="avatar-wrapper-small" :class="`rarity-${char.rarity}-border`">
            <img :src="char.avatar" @error="e=>e.target.src='/avatars/default.png'" />
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
                :style="{ borderLeftColor: ENEMY_TIERS.find(t=>t.value===enemy.tier)?.color }"
                @click="selectEnemy(enemy.id)">

              <div class="avatar-wrapper-small" :style="{ borderColor: ENEMY_TIERS.find(t=>t.value===enemy.tier)?.color }">
                <img :src="enemy.avatar" @error="e=>e.target.src='/avatars/default_enemy.png'" />
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
                    :src="weapon.icon || '/weapons/default.png'"
                    @error="e=>e.target.src='/weapons/default.png'"
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
              <img :src="selectedChar.avatar" @error="e=>e.target.src='/avatars/default.png'" />
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
              <div class="form-group full-width"><label>头像路径 (Public Dir)</label><input v-model="selectedChar.avatar" type="text" /></div>
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
                  <el-select v-model="variant.type" size="large" style="width: 100%" @change="onVariantTypeChange(variant)">
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

                <div class="form-group"><label>持续时间</label><input type="number" step="0.1" v-model.number="variant.duration"></div>

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
                <div v-if="getVariantTicks(variant).length === 0" class="empty-ticks-hint">暂无判定点</div>
                <div v-for="(tick, tIdx) in getVariantTicks(variant)" :key="tIdx" class="tick-row">
                  <div class="tick-top">
                    <div class="tick-idx">HIT {{ tIdx + 1 }}</div>
                    <div class="tick-inputs">
                      <div class="t-group"><label>时间(s)</label><input type="number" v-model.number="tick.offset" step="0.1" class="mini-input"></div>
                      <div class="t-group"><label style="color:#ff7875">失衡值</label><input type="number" v-model.number="tick.stagger" class="mini-input"></div>
                      <div class="t-group"><label style="color:#ffd700">回复技力</label><input type="number" v-model.number="tick.sp" class="mini-input"></div>
                    </div>
                    <button class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger" @click="removeVariantDamageTick(variant, tIdx)">×</button>
                  </div>
                  <div class="tick-binding">
                    <label>绑定状态</label>
                    <el-select
                        v-model="tick.boundEffects"
                        multiple
                        collapse-tags
                        collapse-tags-tooltip
                        size="small"
                        class="tick-select"
                        placeholder="选择要绑定的状态"
                        :disabled="getVariantBindingOptions(variant).length === 0"
                    >
                      <el-option v-for="opt in getVariantBindingOptions(variant)" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                  </div>
                </div>
                <button class="ea-btn ea-btn--block ea-btn--lg ea-btn--dashed-panel ea-btn--radius-6" style="margin-top: 5px;" @click="addVariantDamageTick(variant)">+ 添加判定点</button>
              </div>

              <div class="checkbox-grid" style="margin-top: 15px;">
                <label v-for="key in effectKeys" :key="`v_${variant.id}_${key}`" class="cb-item">
                  <input type="checkbox" :value="key" v-model="variant.allowedTypes" @change="onVariantCheckChange(variant, key)">
                  {{ EFFECT_NAMES[key] }}
                </label>
                <label v-for="buff in selectedChar.exclusive_buffs" :key="`v_${variant.id}_${buff.key}`" class="cb-item exclusive">
                  <input type="checkbox" :value="buff.key" v-model="variant.allowedTypes">
                  ★ {{ buff.name }}
                </label>
              </div>

              <div class="matrix-editor-area" style="margin-top: 15px; border-top: 1px dashed #444; padding-top: 15px;">
                <label style="font-size: 12px; color: #aaa; margin-bottom: 8px; display: block; font-weight: bold;">附加异常状态</label>
                <div class="anomalies-grid-editor">
                  <div v-for="(row, rIndex) in (variant.physicalAnomaly || [])" :key="rIndex" class="editor-row">
                    <div v-for="(item, cIndex) in row" :key="cIndex" class="editor-card">
                      <div class="card-header">
                        <span class="card-label">R{{rIndex+1}}:C{{cIndex+1}}</span>
                        <button class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger" @click="removeVariantEffect(variant, rIndex, cIndex)">×</button>
                      </div>
                      <el-select v-model="item.type" size="small" class="card-select full-width-mb" style="width: 100%">
                        <el-option v-for="opt in getVariantAvailableOptions(variant)" :key="opt.value" :label="opt.label" :value="opt.value" />
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
                    <button class="ea-btn ea-btn--icon ea-btn--icon-40 ea-btn--icon-plus" @click="addVariantEffect(variant, rIndex)">+</button>
                  </div>
                  <button class="ea-btn ea-btn--block ea-btn--lg ea-btn--dashed-panel ea-btn--radius-6" @click="addVariantRow(variant)" :disabled="getVariantAvailableOptions(variant).length === 0">+ 新增效果行</button>
                </div>
              </div>
            </div>

            <button class="ea-btn ea-btn--block ea-btn--lg ea-btn--dashed-panel ea-btn--radius-6" @click="addVariant" style="margin-top: 20px;">+ 添加新变体动作</button>
          </div>

          <template v-for="type in ['attack', 'skill', 'link', 'ultimate', 'execution']" :key="type">
            <div v-show="activeTab === type" class="form-section">
              <h3 class="section-title">数值配置</h3>
              <div class="form-grid three-col">
                <div class="form-group" v-if="type === 'skill' || type === 'ultimate'">
                  <label>技能属性</label>
                  <el-select v-model="selectedChar[`${type}_element`]" size="large" placeholder="默认 (跟随干员)" style="width: 100%">
                    <el-option value="" label="默认 (跟随干员)" />
                    <el-option v-for="elm in ELEMENTS" :key="elm.value" :label="elm.label" :value="elm.value" />
                  </el-select>
                </div>

                <div class="form-group" v-if="['skill', 'link', 'ultimate'].includes(type)"><label>自定义图标路径</label><input v-model="selectedChar[`${type}_icon`]" type="text"/></div>

                <div class="form-group"><label>持续时间 (s)</label><input type="number" step="0.1" v-model.number="selectedChar[`${type}_duration`]"></div>

                <div class="form-group" v-if="type === 'attack'"><label>自身充能</label><input type="number" v-model.number="selectedChar[`${type}_gaugeGain`]"></div>

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

              <h3 class="section-title">伤害判定点</h3>
              <div class="ticks-editor-area">
                <div v-if="getDamageTicks(selectedChar, type).length === 0" class="empty-ticks-hint">
                  暂无判定点，请点击下方按钮添加
                </div>
                <div v-for="(tick, tIdx) in getDamageTicks(selectedChar, type)" :key="tIdx" class="tick-row">
                  <div class="tick-top">
                    <div class="tick-idx">HIT {{ tIdx + 1 }}</div>
                    <div class="tick-inputs">
                      <div class="t-group"><label>时间(s)</label><input type="number" v-model.number="tick.offset" step="0.1" class="mini-input"></div>
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
                        size="small"
                        class="tick-select"
                        placeholder="选择要绑定的状态"
                        :disabled="getBindingOptions(type).length === 0"
                    >
                      <el-option v-for="opt in getBindingOptions(type)" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                  </div>
                </div>
                <button class="ea-btn ea-btn--block ea-btn--lg ea-btn--dashed-panel ea-btn--radius-6" style="margin-top: 10px;" @click="addDamageTick(selectedChar, type)">+ 添加判定点</button>
              </div>

              <h3 class="section-title">效果池配置</h3>
              <div class="checkbox-grid">
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
            </div>
          </template>

        </div>
      </div>

      <div v-else-if="editingMode === 'enemy' && selectedEnemy" class="editor-panel">
        <header class="panel-header">
          <div class="header-left">
            <div class="avatar-wrapper-large" style="border-color: #ff4d4f">
              <img :src="selectedEnemy.avatar" @error="e=>e.target.src='/avatars/default_enemy.png'" />
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
              <label>分类</label>
              <div style="display: flex; gap: 5px;">
                <el-select v-model="selectedEnemy.category" size="large" style="flex-grow: 1;">
                  <el-option v-for="cat in enemyCategories" :key="cat" :label="cat" :value="cat" />
                </el-select>
                <button
                    class="ea-btn ea-btn--icon ea-btn--icon-38 ea-btn--icon-plus"
                    @click="quickAddCategory"
                    title="新建分类"
                >+</button>
              </div>
            </div>
            <div class="form-group full-width"><label>头像路径</label><input v-model="selectedEnemy.avatar" /></div>
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

      <div v-else-if="editingMode === 'weapon' && selectedWeapon" class="editor-panel">
        <header class="panel-header">
          <div class="header-left">
            <div class="avatar-wrapper-large" :class="`rarity-${Math.max(3, selectedWeapon.rarity || 3)}-border`" style="display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff; overflow:hidden;">
              <img
                  :key="selectedWeapon.icon || selectedWeapon.id"
                  :src="selectedWeapon.icon || '/weapons/default.png'"
                  @error="e=>e.target.src='/weapons/default.png'"
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
              <label>持续时间 (s，若有BUFF)</label>
              <input type="number" min="0" step="0.1" v-model.number="selectedWeapon.duration">
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
.sidebar-tabs { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: #1e1e1e; border-bottom: 1px solid #333; }
.sidebar-tabs .ea-btn { flex: 1; justify-content: center; height: 34px; }

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
.editor-panel { max-width: 1000px; margin: 0 auto; animation: fadeIn 0.3s ease; }

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
.ea-textarea {
  width: 100%;
  background: #16161a;
  border: none;
  box-shadow: 0 0 0 1px #333 inset;
  color: #f0f0f0;
  padding: 10px 12px;
  border-radius: 0;
  font-size: 14px;
  transition: box-shadow 0.2s, background-color 0.2s;
  resize: vertical;
}
.ea-textarea:focus {
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
.empty-ticks-hint { color: #666; font-size: 12px; text-align: center; padding: 10px; font-style: italic; }

.info-banner { background: rgba(50, 50, 50, 0.5); padding: 12px; border-left: 3px solid #666; color: #aaa; margin-bottom: 20px; font-size: 13px; border-radius: 0 4px 4px 0; }
.empty-state { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 400px; color: #666; font-size: 16px; border: 2px dashed #333; border-radius: 8px; margin-top: 20px; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.rarity-6-border { border: 2px solid transparent; background: linear-gradient(#2b2b2b, #2b2b2b) padding-box, linear-gradient(135deg, #FFD700, #FF8C00, #FF4500) border-box; box-shadow: 0 0 6px rgba(255, 140, 0, 0.3); }
.rarity-5-border { border-color: #ffc400; }
.rarity-4-border { border-color: #d8b4fe; }
</style>