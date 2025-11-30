<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useTimelineStore()
const { characterRoster, iconDatabase } = storeToRefs(store)

// === 1. 常量定义 ===

const ELEMENTS = [
  { label: '🔥 灼热 (Blaze)', value: 'blaze' },
  { label: '❄️ 寒冷 (Cold)', value: 'cold' },
  { label: '⚡ 电磁 (Emag)', value: 'emag' },
  { label: '🌿 自然 (Nature)', value: 'nature' },
  { label: '⚔️ 物理 (Physical)', value: 'physical' }
]

const VARIANT_TYPES = [
  { label: '⚔️ 重击 (Attack)', value: 'attack' },
  { label: '⚡ 战技 (Skill)', value: 'skill' },
  { label: '🔗 连携 (Link)', value: 'link' },
  { label: '🌟 终结技 (Ultimate)', value: 'ultimate' },
  { label: '☠️ 处决 (Execution)', value: 'execution' }
]

const EFFECT_NAMES = {
  "break": "破防", "armor_break": "碎甲", "stagger": "猛击", "knockdown": "倒地", "knockup": "击飞",
  "blaze_attach": "灼热附着", "emag_attach": "电磁附着", "cold_attach": "寒冷附着", "nature_attach": "自然附着",
  "blaze_burst": "灼热爆发", "emag_burst": "电磁爆发", "cold_burst": "寒冷爆发", "nature_burst": "自然爆发",
  "burning": "燃烧", "conductive": "导电", "frozen": "冻结", "ice_shatter": "碎冰", "corrosion": "腐蚀",
  "consumed": "被消耗",
  "logic_tick": "分段判定",
  "default": "默认图标"
}

const HIDDEN_CHECKBOX_KEYS = ['default', 'consumed', 'logic_tick']
const effectKeys = Object.keys(EFFECT_NAMES).filter(key => !HIDDEN_CHECKBOX_KEYS.includes(key))

// === 2. 状态与计算属性 ===

const searchQuery = ref('')
const selectedCharId = ref(null)
const activeTab = ref('basic')

const filteredRoster = computed(() => {
  let list = characterRoster.value || []
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
  }
  return list.sort((a, b) => (b.rarity || 0) - (a.rarity || 0))
})

const selectedChar = computed(() => {
  return characterRoster.value.find(c => c.id === selectedCharId.value)
})

// === 3. 生命周期 ===

onMounted(async () => {
  if (characterRoster.value.length === 0) {
    await store.fetchGameData()
  }
  if (characterRoster.value.length > 0) {
    selectedCharId.value = characterRoster.value[0].id
  }
})

// === 4. 操作方法 ===

function selectChar(id) {
  selectedCharId.value = id
  activeTab.value = 'basic'
}

function updateCharId(event) {
  const newId = event.target.value
  if (selectedChar.value) selectedChar.value.id = newId
  selectedCharId.value = newId
}

function addNewCharacter() {
  const newId = `char_${Date.now()}`
  const allGlobalEffects = [...effectKeys]

  const newChar = {
    id: newId, name: "新干员", rarity: 5, element: "physical", avatar: "/avatars/default.png", exclusive_buffs: [],
    accept_team_gauge: true,
    attack_duration: 2.5, attack_spGain: 15, attack_stagger: 0, attack_allowed_types: allGlobalEffects, attack_anomalies: [],
    skill_duration: 2, skill_spCost: 100, skill_spGain: 0, skill_stagger: 0, skill_gaugeGain: 0, skill_teamGaugeGain: 0, skill_allowed_types: [], skill_anomalies: [],
    link_duration: 1.5, link_cooldown: 15, link_spGain: 0, link_stagger: 0, link_gaugeGain: 0, link_allowed_types: [], link_anomalies: [],
    ultimate_duration: 3, ultimate_gaugeMax: 100, ultimate_spGain: 0, ultimate_stagger: 0, ultimate_gaugeReply: 0, ultimate_allowed_types: [], ultimate_anomalies: [],
    execution_duration: 1.5, execution_spGain: 20, execution_allowed_types: allGlobalEffects, execution_anomalies: [],
    variants: [] // 初始变体数组
  }

  characterRoster.value.unshift(newChar)
  selectedCharId.value = newId
  ElMessage.success('已添加新干员')
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

// === 变体动作核心逻辑 (Updated) ===

function getSnapshotFromBase(char, type) {
  // 基础数值
  const snapshot = {
    duration: char[`${type}_duration`] || 1,
    stagger: char[`${type}_stagger`] || 0,
    spGain: char[`${type}_spGain`] || 0,
    element: char[`${type}_element`],
    // 如果基础技能没有配置(undefined)，则默认为空数组
    allowedTypes: char[`${type}_allowed_types`] ? [...char[`${type}_allowed_types`]] : [],
    // 深拷贝异常状态矩阵
    physicalAnomaly: char[`${type}_anomalies`]
        ? JSON.parse(JSON.stringify(char[`${type}_anomalies`]))
        : [],
    // 拷贝行延迟
    anomalyRowDelays: char[`${type}_anomaly_delays`]
        ? [...char[`${type}_anomaly_delays`]]
        : []
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

  if (variant.name === '新强化动作' || variant.name.includes('强化')) {
    const typeObj = VARIANT_TYPES.find(t => t.value === variant.type)

    if (typeObj) {
      const labelName = typeObj.label.split(' ')[1]

      variant.name = `强化${labelName}`
    }
  }
}

// === 变体Checkbox逻辑 (New) ===

function onVariantCheckChange(variant, key) {
  if (!variant.allowedTypes) variant.allowedTypes = []
  const list = variant.allowedTypes
  const isChecked = list.includes(key)

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
      variant.allowedTypes = list.filter(item => !group.includes(item))
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

// 获取变体可用的状态选项 (受 allowedTypes 限制)
function getVariantAvailableOptions(variant) {
  const allowedList = variant.allowedTypes || []

  // 创建一个 Set，合并原有的 allowedList 和 强制显示的选项
  // 这样无论上面勾没勾，这里都会有
  const combinedKeys = new Set([...allowedList, 'default', 'logic_tick', 'consumed'])

  return Array.from(combinedKeys).map(key => {
    if (EFFECT_NAMES[key]) {
      return { label: EFFECT_NAMES[key], value: key }
    }
    const exclusive = selectedChar.value?.exclusive_buffs.find(b => b.key === key)
    if (exclusive) {
      return { label: `★ ${exclusive.name}`, value: key }
    }
    return { label: key, value: key }
  })
}

// === 变体矩阵操作逻辑 ===

function addVariantRow(variant) {
  if (!variant.physicalAnomaly) variant.physicalAnomaly = []
  // 默认使用允许列表里的第一个，或者 'default'
  const defaultType = (variant.allowedTypes && variant.allowedTypes.length > 0) ? variant.allowedTypes[0] : 'default'
  variant.physicalAnomaly.push([{ type: defaultType, stacks: 1, duration: 0, sp: 0, stagger: 0 }])
}

function addVariantEffect(variant, rowIndex) {
  if (variant.physicalAnomaly && variant.physicalAnomaly[rowIndex]) {
    const defaultType = (variant.allowedTypes && variant.allowedTypes.length > 0) ? variant.allowedTypes[0] : 'default'
    variant.physicalAnomaly[rowIndex].push({ type: defaultType, stacks: 1, duration: 0, sp: 0, stagger: 0 })
  }
}

function removeVariantEffect(variant, rowIndex, colIndex) {
  if (variant.physicalAnomaly && variant.physicalAnomaly[rowIndex]) {
    variant.physicalAnomaly[rowIndex].splice(colIndex, 1)
    if (variant.physicalAnomaly[rowIndex].length === 0) {
      variant.physicalAnomaly.splice(rowIndex, 1)
      if (variant.anomalyRowDelays) variant.anomalyRowDelays.splice(rowIndex, 1)
    }
  }
}

function getVariantRowDelay(variant, rowIndex) {
  const delays = variant.anomalyRowDelays || []
  return delays[rowIndex] || 0
}

function setVariantRowDelay(variant, rowIndex, val) {
  if (!variant.anomalyRowDelays) variant.anomalyRowDelays = []
  while (variant.anomalyRowDelays.length <= rowIndex) {
    variant.anomalyRowDelays.push(0)
  }
  variant.anomalyRowDelays[rowIndex] = val
}

// === 通用逻辑 ===

function onCheckChange(char, skillType, key) {
  const fieldName = `${skillType}_allowed_types`
  if (!char[fieldName]) char[fieldName] = []
  const list = char[fieldName]
  const isChecked = list.includes(key)

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
      char[fieldName] = list.filter(item => !group.includes(item))
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

function onSkillGaugeInput(event) {
  const val = Number(event.target.value)
  if (selectedChar.value) {
    selectedChar.value.skill_teamGaugeGain = val * 0.5
  }
}

function saveData() {
  characterRoster.value.sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
  const dataToSave = {
    SYSTEM_CONSTANTS: { MAX_SP: 300, SP_REGEN_PER_SEC: 8, SKILL_SP_COST_DEFAULT: 100 },
    ICON_DATABASE: iconDatabase.value,
    characterRoster: characterRoster.value
  }
  const jsonData = JSON.stringify(dataToSave, null, 2)
  const blob = new Blob([jsonData], {type: 'application/json'})
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'gamedata.json'
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('gamedata.json 已生成，请覆盖项目文件')
}

function getAvailableAnomalyOptions(skillType) {
  if (!selectedChar.value) return []
  const allowedList = selectedChar.value[`${skillType}_allowed_types`] || []
  const combinedKeys = new Set([...allowedList, 'default', 'logic_tick', 'consumed'])

  return Array.from(combinedKeys).map(key => {
    if (EFFECT_NAMES[key]) {
      return { label: EFFECT_NAMES[key], value: key }
    }
    const exclusive = selectedChar.value.exclusive_buffs.find(b => b.key === key)
    if (exclusive) {
      return { label: `★ ${exclusive.name}`, value: key }
    }
    return { label: key, value: key }
  })
}

// === 二维数组通用处理逻辑 (Standard Skills) ===

function getAnomalyRows(char, skillType) {
  if (!char) return []
  const key = `${skillType}_anomalies`
  const raw = char[key] || []
  if (raw.length === 0) return []
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

  char[key].push([{ type: defaultType, stacks: 1, duration: 0, sp: 0, stagger: 0 }])
}

function addAnomalyToRow(char, skillType, rowIndex) {
  const rows = getAnomalyRows(char, skillType)
  const allowedList = char[`${skillType}_allowed_types`] || []
  const defaultType = allowedList.length > 0 ? allowedList[0] : 'default'

  if (rows[rowIndex]) {
    rows[rowIndex].push({ type: defaultType, stacks: 1, duration: 0, sp: 0, stagger: 0 })
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

function getRowDelay(char, skillType, rowIndex) {
  if (!char) return 0
  const key = `${skillType}_anomaly_delays`
  const delays = char[key] || []
  return delays[rowIndex] || 0
}

function setRowDelay(char, skillType, rowIndex, val) {
  if (!char) return
  const key = `${skillType}_anomaly_delays`
  if (!char[key]) char[key] = []
  while (char[key].length <= rowIndex) {
    char[key].push(0)
  }
  char[key][rowIndex] = val
}
</script>

<template>
  <div class="cms-layout">
    <aside class="cms-sidebar">
      <div class="sidebar-header">
        <h2>干员数据</h2>
        <button class="btn-add" @click="addNewCharacter">＋</button>
      </div>
      <div class="search-box">
        <input v-model="searchQuery" placeholder="🔍 搜索干员 ID 或名称..." />
      </div>
      <div class="char-list">
        <div v-for="char in filteredRoster" :key="char.id"
             class="char-item" :class="{ active: char.id === selectedCharId }"
             @click="selectChar(char.id)">

          <div class="avatar-wrapper-small" :class="`rarity-${char.rarity}-border`">
            <img :src="char.avatar" @error="e=>e.target.src='/avatars/default.png'" />
          </div>

          <div class="char-info">
            <span class="char-name">{{ char.name }}</span>
            <span class="char-meta" :class="`rarity-${char.rarity}`">
        {{ char.rarity }}★ {{ char.element }}
      </span>
          </div>
        </div>
      </div>
      <div class="sidebar-footer">
        <button class="btn-save" @click="saveData">💾 生成并下载 JSON</button>
        <router-link to="/" class="btn-back">↩ 返回排轴器</router-link>
      </div>
    </aside>

    <main class="cms-content">
      <div v-if="selectedChar" class="editor-panel">
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
          <button class="btn-danger" @click="deleteCurrentCharacter">删除此干员</button>
        </header>

        <div class="cms-tabs">
          <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础信息</button>
          <button :class="{ active: activeTab === 'attack' }" @click="activeTab = 'attack'">⚔️ 重击</button>
          <button :class="{ active: activeTab === 'skill' }" @click="activeTab = 'skill'">⚡ 战技</button>
          <button :class="{ active: activeTab === 'link' }" @click="activeTab = 'link'">🔗 连携</button>
          <button :class="{ active: activeTab === 'ultimate' }" @click="activeTab = 'ultimate'">🌟 终结技</button>
          <button :class="{ active: activeTab === 'execution' }" @click="activeTab = 'execution'">☠️ 处决</button>
          <button :class="{ active: activeTab === 'variants' }" @click="activeTab = 'variants'">✨ 变体</button>
        </div>

        <div class="tab-content">

          <div v-show="activeTab === 'basic'" class="form-section">
            <h3 class="section-title">基本属性</h3>
            <div class="form-grid">
              <div class="form-group"><label>名称</label><input v-model="selectedChar.name" type="text" /></div>
              <div class="form-group"><label>ID (Unique)</label><input :value="selectedChar.id" @input="updateCharId" type="text" /></div>
              <div class="form-group"><label>星级</label>
                <select v-model.number="selectedChar.rarity"><option :value="6">6 ★</option><option :value="5">5 ★</option><option :value="4">4 ★</option></select>
              </div>
              <div class="form-group"><label>元素属性</label>
                <select v-model="selectedChar.element">
                  <option v-for="elm in ELEMENTS" :key="elm.value" :value="elm.value">{{ elm.label }}</option>
                </select>
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
                <button class="btn-icon-del" @click="selectedChar.exclusive_buffs.splice(idx, 1)">×</button>
              </div>
              <button class="btn-small-add" @click="selectedChar.exclusive_buffs.push({key:'',name:'',path:''})">+ 添加专属效果</button>
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
                <button class="btn-icon-del" @click="removeVariant(idx)">×</button>
              </div>

              <div class="form-grid three-col">
                <div class="form-group">
                  <label>显示名称</label>
                  <input v-model="variant.name" placeholder="例如：强化战技" />
                </div>

                <div class="form-group">
                  <label>动作类型 (切换将重置数值)</label>
                  <select v-model="variant.type" @change="onVariantTypeChange(variant)">
                    <option v-for="t in VARIANT_TYPES" :key="t.value" :value="t.value">
                      {{ t.label }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label>唯一标识 (ID后缀)</label>
                  <input v-model="variant.id" placeholder="英文key, 如 s1_enhanced" />
                </div>

                <div class="form-group"><label>持续时间</label><input type="number" step="0.1" v-model.number="variant.duration"></div>
                <div class="form-group"><label>失衡值</label><input type="number" v-model.number="variant.stagger"></div>
                <div class="form-group"><label>技力回复</label><input type="number" v-model.number="variant.spGain"></div>

                <div class="form-group" v-if="variant.type === 'skill'"><label>技力消耗</label><input type="number" v-model.number="variant.spCost"></div>
                <div class="form-group" v-if="variant.type === 'skill'"><label>自身充能</label><input type="number" v-model.number="variant.gaugeGain"></div>
                <div class="form-group" v-if="variant.type === 'skill'"><label>队友充能</label><input type="number" v-model.number="variant.teamGaugeGain"></div>

                <div class="form-group" v-if="variant.type === 'link'"><label>冷却时间 (CD)</label><input type="number" v-model.number="variant.cooldown"></div>
                <div class="form-group" v-if="variant.type === 'link'"><label>自身充能</label><input type="number" v-model.number="variant.gaugeGain"></div>

                <div class="form-group" v-if="variant.type === 'ultimate'"><label>充能消耗 (Max)</label><input type="number" v-model.number="variant.gaugeCost"></div>
                <div class="form-group" v-if="variant.type === 'ultimate'"><label>充能返还/回复</label><input type="number" v-model.number="variant.gaugeGain"></div>
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
                    <div class="row-delay-input" title="该行起始延迟 (秒)">
                      <span class="delay-icon">↦</span>
                      <input
                          type="number"
                          :value="getVariantRowDelay(variant, rIndex)"
                          @input="e => setVariantRowDelay(variant, rIndex, Number(e.target.value))"
                          step="0.1"
                          min="0"
                          class="delay-num"
                      />
                    </div>
                    <div v-for="(item, cIndex) in row" :key="cIndex" class="editor-card">
                      <div class="card-header">
                        <span class="card-label">R{{rIndex+1}}:C{{cIndex+1}}</span>
                        <button class="btn-icon-del" @click="removeVariantEffect(variant, rIndex, cIndex)">×</button>
                      </div>

                      <select v-model="item.type" class="card-input">
                        <option v-for="opt in getVariantAvailableOptions(variant)" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </option>
                      </select>

                      <div class="card-row">
                        <input type="number" v-model.number="item.stacks" placeholder="层" class="mini-input"><span class="unit">层</span>
                        <input type="number" v-model.number="item.duration" placeholder="秒" step="0.5" class="mini-input"><span class="unit">s</span>
                      </div>

                      <div style="display: flex; align-items: center; justify-content: flex-end; margin: 2px 0;">
                        <label style="font-size: 9px; color: #888; display: flex; align-items: center; gap: 3px; cursor: pointer; user-select: none;">
                          <input type="checkbox" v-model="item.hideDuration" style="width: 11px; height: 11px; margin: 0; accent-color: #666;"> 隐藏时长条
                        </label>
                      </div>
                      <div class="card-row" style="margin-top: 4px; border-top: 1px dashed #444; padding-top: 4px;">
                        <input type="number" v-model.number="item.sp" placeholder="技力" class="mini-input highlight-sp" title="此段回复技力"><span class="unit">回复技力</span>
                        <input type="number" v-model.number="item.stagger" placeholder="失衡" class="mini-input highlight-stagger" title="此段造成失衡"><span class="unit">失衡值</span>
                      </div>
                    </div>
                    <button class="btn-add-col" @click="addVariantEffect(variant, rIndex)">+</button>
                  </div>
                  <button class="btn-add-row" @click="addVariantRow(variant)" :disabled="getVariantAvailableOptions(variant).length === 0">+ 新增效果行</button>
                </div>
              </div>
            </div>

            <button class="btn-add-row" @click="addVariant" style="margin-top: 20px;">+ 添加新变体动作</button>
          </div>

          <template v-for="type in ['attack', 'skill', 'link', 'ultimate', 'execution']" :key="type">
            <div v-show="activeTab === type" class="form-section">
              <h3 class="section-title">数值配置</h3>
              <div class="form-grid three-col">
                <div class="form-group" v-if="type === 'skill' || type === 'ultimate'">
                  <label>技能属性</label>
                  <select v-model="selectedChar[`${type}_element`]">
                    <option :value="undefined">默认 (跟随干员)</option>
                    <option v-for="elm in ELEMENTS" :key="elm.value" :value="elm.value">
                      {{ elm.label }}
                    </option>
                  </select>
                </div>

                <div class="form-group"><label>持续时间 (s)</label><input type="number" step="0.1" v-model.number="selectedChar[`${type}_duration`]"></div>

                <div class="form-group"><label>技力回复</label><input type="number" v-model.number="selectedChar[`${type}_spGain`]"></div>

                <div class="form-group" v-if="type === 'attack' || type === 'skill' || type === 'link' || type === 'ultimate'"><label>失衡值</label><input type="number" v-model.number="selectedChar[`${type}_stagger`]"></div>

                <div class="form-group" v-if="type === 'skill'"><label>技力消耗</label><input type="number" v-model.number="selectedChar[`${type}_spCost`]"></div>
                <div class="form-group" v-if="type === 'skill'"><label>自身充能</label><input type="number" v-model.number="selectedChar[`${type}_gaugeGain`]" @input="onSkillGaugeInput"></div>
                <div class="form-group" v-if="type === 'skill'"><label>队友充能</label><input type="number" v-model.number="selectedChar[`${type}_teamGaugeGain`]"></div>

                <div class="form-group" v-if="type === 'link'"><label>CD (s)</label><input type="number" v-model.number="selectedChar[`${type}_cooldown`]"></div>
                <div class="form-group" v-if="type === 'link'"><label>自身充能</label><input type="number" v-model.number="selectedChar[`${type}_gaugeGain`]"></div>

                <div class="form-group" v-if="type === 'ultimate'"><label>充能消耗</label><input type="number" v-model.number="selectedChar[`${type}_gaugeMax`]"></div>
                <div class="form-group" v-if="type === 'ultimate'"><label>自身充能</label><input type="number" v-model.number="selectedChar[`${type}_gaugeReply`]"></div>
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
                    <div class="row-delay-input" title="该行起始延迟 (秒)">
                      <span class="delay-icon">↦</span>
                      <input
                          type="number"
                          :value="getRowDelay(selectedChar, type, rIndex)"
                          @input="e => setRowDelay(selectedChar, type, rIndex, Number(e.target.value))"
                          step="0.1"
                          min="0"
                          class="delay-num"
                      />
                    </div>
                    <div v-for="(item, cIndex) in row" :key="cIndex" class="editor-card">
                      <div class="card-header">
                        <span class="card-label">R{{rIndex+1}}:C{{cIndex+1}}</span>
                        <button class="btn-icon-del" @click="removeAnomaly(selectedChar, type, rIndex, cIndex)">×</button>
                      </div>
                      <select v-model="item.type" class="card-input">
                        <option v-for="opt in getAvailableAnomalyOptions(type)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                      </select>
                      <div class="card-row">
                        <input type="number" v-model.number="item.stacks" placeholder="层" class="mini-input"><span class="unit">层</span>
                        <input type="number" v-model.number="item.duration" placeholder="秒" step="0.5" class="mini-input"><span class="unit">s</span>
                      </div>

                      <div style="display: flex; align-items: center; justify-content: flex-end; margin: 2px 0;">
                        <label style="font-size: 9px; color: #888; display: flex; align-items: center; gap: 3px; cursor: pointer; user-select: none;">
                          <input type="checkbox" v-model="item.hideDuration" style="width: 11px; height: 11px; margin: 0; accent-color: #666;"> 隐藏时长条
                        </label>
                      </div>
                      <div class="card-row" style="margin-top: 4px; border-top: 1px dashed #444; padding-top: 4px;">
                        <input type="number" v-model.number="item.sp" placeholder="技力" class="mini-input highlight-sp" title="此段回复技力"><span class="unit">回复技力</span>
                        <input type="number" v-model.number="item.stagger" placeholder="失衡" class="mini-input highlight-stagger" title="此段造成失衡"><span class="unit">失衡值</span>
                      </div>
                    </div>
                    <button class="btn-add-col" @click="addAnomalyToRow(selectedChar, type, rIndex)">+</button>
                  </div>
                  <button class="btn-add-row" @click="addAnomalyRow(selectedChar, type)" :disabled="getAvailableAnomalyOptions(type).length === 0">+ 新增效果行</button>
                </div>
              </div>
            </div>
          </template>

        </div>
      </div>
      <div v-else class="empty-state">请从左侧列表选择干员</div>
    </main>
  </div>
</template>

<style scoped>
.cms-layout { display: flex; height: 100vh; background-color: #1e1e1e; color: #f0f0f0; overflow: hidden; font-family: 'Segoe UI', Roboto, sans-serif; }

/* Sidebar */
.cms-sidebar { width: 300px; background-color: #252526; border-right: 1px solid #333; display: flex; flex-direction: column; flex-shrink: 0; }
.sidebar-header { padding: 15px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; background: #2b2b2b; }
.sidebar-header h2 { margin: 0; font-size: 16px; color: #ffd700; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
.btn-add { background: #3a3a3a; border: 1px solid #555; color: #fff; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.2s; }
.btn-add:hover { background: #ffd700; border-color: #ffd700; color: #000; }
.search-box { padding: 10px; border-bottom: 1px solid #333; background: #252526; }
.search-box input { width: 100%; padding: 8px 12px; box-sizing: border-box; background: #1e1e1e; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 13px; }
.search-box input:focus { border-color: #666; outline: none; }

/* Character List */
.char-list { flex-grow: 1; overflow-y: auto; padding: 10px; }
.char-item { display: flex; align-items: center; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; margin-bottom: 4px; border: 1px solid transparent; }
.char-item:hover { background-color: #2d2d2d; border-color: #444; }
.char-item.active { background-color: #37373d; border-color: #ffd700; box-shadow: 0 0 10px rgba(0,0,0,0.2); }

.avatar-wrapper-small {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  margin-right: 12px;
  background: #333;
  position: relative;
  overflow: hidden;
  border: 2px solid #444;
  flex-shrink: 0;
  box-sizing: border-box;
}

.avatar-wrapper-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.char-info { display: flex; flex-direction: column; justify-content: center; }
.char-name { font-weight: bold; font-size: 14px; margin-bottom: 2px; color: #f0f0f0; }

.char-meta { font-size: 12px; font-weight: bold; }

.rarity-6 { background: linear-gradient(45deg, #FFD700, #FF8C00, #FF4500); background-clip: text; -webkit-background-clip: text; color: transparent; }
.rarity-5 { color: #ffc400; }
.rarity-4 { color: #d8b4fe; }
.rarity-3, .rarity-2, .rarity-1 { color: #888; }

/* Sidebar Footer */
.sidebar-footer { padding: 15px; border-top: 1px solid #333; display: flex; flex-direction: column; gap: 10px; background: #2b2b2b; }
.btn-save { width: 100%; padding: 10px; background: #2e7d32; border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-save:hover { background: #388e3c; }
.btn-back { text-align: center; color: #888; text-decoration: none; font-size: 13px; display: block; padding: 8px; border: 1px solid #444; border-radius: 4px; transition: all 0.2s; }
.btn-back:hover { color: #fff; border-color: #666; background: #333; }

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
.btn-danger { background: #3a1a1a; color: #ff7875; border: 1px solid #5c2b2b; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: all 0.2s; font-size: 13px; }
.btn-danger:hover { background: #d32f2f; color: white; border-color: #d32f2f; }

/* Tabs */
.cms-tabs { display: flex; gap: 2px; margin-bottom: 20px; border-bottom: 2px solid #333; }
.cms-tabs button { background: #252526; border: none; color: #888; padding: 12px 24px; cursor: pointer; border-radius: 6px 6px 0 0; transition: all 0.2s; font-weight: 500; font-size: 14px; }
.cms-tabs button:hover { background: #2d2d2d; color: #ccc; }
.cms-tabs button.active { background: #333; color: #ffd700; font-weight: bold; box-shadow: 0 -2px 0 #ffd700 inset; }

/* Forms */
.form-section { background: #252526; padding: 25px; border-radius: 0 0 8px 8px; margin-top: -22px; border: 1px solid #333; border-top: none; }
.section-title { font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #333; padding-bottom: 8px; margin: 30px 0 15px 0; }
.section-title:first-child { margin-top: 0; }

.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px 20px; }
.form-grid.three-col { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.form-group { display: flex; flex-direction: column; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label { margin-bottom: 8px; color: #aaa; font-size: 12px; font-weight: 500; }
.form-group input, .form-group select { background: #1a1a1a; border: 1px solid #444; color: #f0f0f0; padding: 10px 12px; border-radius: 4px; font-size: 14px; transition: border-color 0.2s; }
.form-group input:focus, .form-group select:focus { border-color: #ffd700; outline: none; background: #111; }

/* Variant Card Style (New) */
.variant-card {
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  border-left: 4px solid #ffd700;
}
.variant-header { display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center; }
.variant-idx { font-weight: bold; color: #ffd700; font-size: 12px; }

/* ... existing styles ... */
.checkbox-wrapper { background: #1a1a1a; border: 1px solid #444; padding: 0 15px; border-radius: 4px; display: flex; align-items: center; height: 38px; cursor: pointer; transition: all 0.2s; }
.checkbox-wrapper:hover { border-color: #666; }
.checkbox-wrapper.is-checked { border-color: #ffd700; background: rgba(255, 215, 0, 0.05); }
.checkbox-wrapper input { margin-right: 10px; cursor: pointer; width: 16px; height: 16px; accent-color: #ffd700; }
.checkbox-wrapper label { margin: 0; cursor: pointer; color: #ccc; }

.exclusive-list { display: flex; flex-direction: column; gap: 10px; }
.exclusive-row { display: flex; gap: 10px; align-items: center; }
.exclusive-row input { background: #1a1a1a; border: 1px solid #444; color: #fff; padding: 8px; border-radius: 4px; font-size: 13px; }
.flex-grow { flex-grow: 1; }
.btn-icon-del { width: 24px; height: 24px; background: #3a1a1a; border: 1px solid #5c2b2b; color: #ff7875; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.2s; }
.btn-icon-del:hover { background: #d32f2f; color: white; border-color: #d32f2f; }
.btn-small-add { background: #333; border: 1px dashed #666; color: #aaa; padding: 8px; border-radius: 4px; cursor: pointer; width: 100%; font-size: 13px; transition: all 0.2s; }
.btn-small-add:hover { border-color: #ffd700; color: #ffd700; background: #3a3a3a; }

.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; background: #1a1a1a; padding: 15px; border-radius: 6px; border: 1px solid #333; margin-bottom: 20px; }
.cb-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #bbb; cursor: pointer; user-select: none; padding: 5px; border-radius: 4px; transition: background 0.1s; }
.cb-item:hover { background: #252526; }
.cb-item input { accent-color: #ffd700; width: 16px; height: 16px; }
.cb-item.exclusive { color: #ffd700; }

.matrix-editor-area { margin-top: 25px; border-top: 1px dashed #444; padding-top: 20px; }
.anomalies-grid-editor { display: flex; flex-direction: column; gap: 10px; }
.editor-row { display: flex; flex-wrap: wrap; gap: 10px; background: #1f1f1f; padding: 10px; border-radius: 6px; border: 1px solid #333; align-items: center; }
.editor-card { background: #2b2b2b; border: 1px solid #444; border-radius: 6px; padding: 8px; width: 150px; display: flex; flex-direction: column; gap: 6px; transition: transform 0.2s; }
.editor-card:hover { border-color: #666; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
.card-label { font-size: 11px; color: #666; font-family: monospace; }
.card-input { width: 100%; background: #1a1a1a; border: 1px solid #333; color: #ddd; font-size: 12px; padding: 4px; border-radius: 3px; }
.card-row { display: flex; align-items: center; gap: 5px; }
.mini-input { width: 50px !important; padding: 4px !important; text-align: center; background: #1a1a1a; border: 1px solid #333; color: #ffd700; font-weight: bold; }
.unit { font-size: 10px; color: #666; }
.btn-add-col { width: 40px; background: #252526; border: 1px dashed #444; color: #666; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.2s; }
.btn-add-col:hover { border-color: #ffd700; color: #ffd700; background: #2b2b2b; }
.btn-add-row { width: 100%; padding: 10px; background: #252526; border: 1px dashed #444; color: #888; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.btn-add-row:hover:not(:disabled) { border-color: #ffd700; color: #ffd700; background: #2b2b2b; }
.btn-add-row:disabled { cursor: not-allowed; opacity: 0.5; }

.info-banner { background: rgba(50, 50, 50, 0.5); padding: 12px; border-left: 3px solid #666; color: #aaa; margin-bottom: 20px; font-size: 13px; border-radius: 0 4px 4px 0; }
.empty-state { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 400px; color: #666; font-size: 16px; border: 2px dashed #333; border-radius: 8px; margin-top: 20px; }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #1e1e1e; }
::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #555; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.row-delay-input { display: flex; align-items: center; margin-right: 6px; background: #222; border: 1px solid #555; border-radius: 3px; padding: 0 2px; height: 22px; }
.delay-icon { color: #888; font-size: 10px; margin-right: 2px; user-select: none; }
.delay-num { width: 30px !important; border: none !important; background: transparent !important; padding: 0 !important; height: 100% !important; font-size: 11px !important; text-align: center; color: #ffd700 !important; }
.delay-num:focus { outline: none; }
.delay-num::-webkit-outer-spin-button, .delay-num::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

.highlight-sp {
  border-color: #ffd700 !important;
  color: #ffd700 !important;
}
.highlight-stagger {
  border-color: #ff7875 !important;
  color: #ff7875 !important;
}

.rarity-6-border { border: 2px solid transparent; background: linear-gradient(#2b2b2b, #2b2b2b) padding-box, linear-gradient(135deg, #FFD700, #FF8C00, #FF4500) border-box; box-shadow: 0 0 6px rgba(255, 140, 0, 0.3); }
.rarity-5-border { border-color: #ffc400; }
.rarity-4-border { border-color: #d8b4fe; }
</style>