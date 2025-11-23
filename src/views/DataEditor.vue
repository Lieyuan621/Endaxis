<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useTimelineStore()
const { characterRoster, iconDatabase } = storeToRefs(store)

// === 1. 常量定义 ===

const ELEMENTS = [
  { label: ' 灼热 (Blaze)', value: 'blaze' },
  { label: ' 寒冷 (Cold)', value: 'cold' },
  { label: ' 电磁 (Emag)', value: 'emag' },
  { label: ' 自然 (Nature)', value: 'nature' },
  { label: ' 物理 (Physical)', value: 'physical' }
]

const EFFECT_NAMES = {
  "break": "破防", "armor_break": "碎甲", "stagger": "猛击", "knockdown": "倒地", "knockup": "击飞",
  "blaze_attach": "灼热附着", "emag_attach": "电磁附着", "cold_attach": "寒冷附着", "nature_attach": "自然附着",
  "blaze_burst": "灼热爆发", "emag_burst": "电磁爆发", "cold_burst": "寒冷爆发", "nature_burst": "自然爆发",
  "burning": "燃烧", "conductive": "导电", "frozen": "冻结", "ice_shatter": "碎冰", "corrosion": "腐蚀",
  "default": "默认图标"
}
const effectKeys = Object.keys(EFFECT_NAMES)

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

    attack_duration: 2.5, attack_spGain: 15, attack_stagger: 0, attack_allowed_types: allGlobalEffects, attack_anomalies: [],
    skill_duration: 2, skill_spCost: 100, skill_spGain: 0, skill_stagger: 0, skill_gaugeGain: 0, skill_teamGaugeGain: 6, skill_allowed_types: [], skill_anomalies: [],
    link_duration: 1.5, link_cooldown: 15, link_spGain: 0, link_stagger: 0, link_gaugeGain: 0, link_allowed_types: [], link_anomalies: [],
    ultimate_duration: 3, ultimate_gaugeMax: 100, ultimate_spGain: 0, ultimate_stagger: 0, ultimate_gaugeReply: 0, ultimate_allowed_types: [], ultimate_anomalies: [],
    execution_duration: 1.5, execution_spGain: 20, execution_allowed_types: allGlobalEffects, execution_anomalies: []
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

  // 获取允许列表
  const allowedList = selectedChar.value[`${skillType}_allowed_types`] || []

  // 映射为选项对象
  return allowedList.map(key => {
    // 1. 全局状态
    if (EFFECT_NAMES[key]) {
      return { label: EFFECT_NAMES[key], value: key }
    }
    // 2. 专属状态
    const exclusive = selectedChar.value.exclusive_buffs.find(b => b.key === key)
    if (exclusive) {
      return { label: `★ ${exclusive.name}`, value: key }
    }
    // 3. 未知/兜底
    return { label: key, value: key }
  })
}

function addAnomaly(targetKey, skillType) {
  // 1. 安全检查与初始化
  if (!selectedChar.value) return
  if (!selectedChar.value[targetKey]) {
    selectedChar.value[targetKey] = []
  }

  const list = selectedChar.value[targetKey]

  // 2. 计算默认类型
  const allowedList = selectedChar.value[`${skillType}_allowed_types`] || []
  const defaultType = allowedList.length > 0 ? allowedList[0] : 'default'

  // 3. 推入新数据
  list.push({ type: defaultType, stacks: 1, duration: 0 })
}
</script>

<template>
  <div class="cms-layout">
    <aside class="cms-sidebar">
      <div class="sidebar-header">
        <h2>干员列表</h2>
        <button class="btn-add" @click="addNewCharacter">+ 新增</button>
      </div>
      <div class="search-box">
        <input v-model="searchQuery" placeholder="搜索干员..." />
      </div>
      <div class="char-list">
        <div v-for="char in filteredRoster" :key="char.id"
             class="char-item" :class="{ active: char.id === selectedCharId }"
             @click="selectChar(char.id)">
          <img :src="char.avatar" class="avatar-small" @error="e=>e.target.src='/avatars/default.png'" />
          <div class="char-info">
            <span class="char-name">{{ char.name }}</span>
            <span class="char-meta" :class="`rarity-${char.rarity}`">{{ char.rarity }}★ {{ char.element }}</span>
          </div>
        </div>
      </div>
      <div class="sidebar-footer">
        <button class="btn-save" @click="saveData">💾 下载数据</button>
        <router-link to="/" class="btn-back">↩ 返回排轴</router-link>
      </div>
    </aside>

    <main class="cms-content">
      <div v-if="selectedChar" class="editor-panel">
        <header class="panel-header">
          <div class="header-left">
            <img :src="selectedChar.avatar" class="avatar-large" />
            <div>
              <h1 class="edit-title">{{ selectedChar.name }} <span class="id-tag">{{ selectedChar.id }}</span></h1>
            </div>
          </div>
          <button class="btn-danger" @click="deleteCurrentCharacter">删除干员</button>
        </header>

        <div class="cms-tabs">
          <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础信息</button>
          <button :class="{ active: activeTab === 'attack' }" @click="activeTab = 'attack'">⚔️ 重击</button>
          <button :class="{ active: activeTab === 'skill' }" @click="activeTab = 'skill'">⚡ 战技</button>
          <button :class="{ active: activeTab === 'link' }" @click="activeTab = 'link'">🔗 连携</button>
          <button :class="{ active: activeTab === 'ultimate' }" @click="activeTab = 'ultimate'">🌟 终结技</button>
          <button :class="{ active: activeTab === 'execution' }" @click="activeTab = 'execution'">☠️ 处决</button>
        </div>

        <div class="tab-content">

          <div v-show="activeTab === 'basic'" class="form-section">
            <div class="form-row">
              <div class="form-group"><label>名称</label><input v-model="selectedChar.name" type="text" /></div>
              <div class="form-group"><label>ID (英文唯一)</label><input :value="selectedChar.id" @input="updateCharId" type="text" /></div>
              <div class="form-group"><label>星级</label>
                <select v-model.number="selectedChar.rarity"><option :value="6">6 ★</option><option :value="5">5 ★</option><option :value="4">4 ★</option></select>
              </div>
              <div class="form-group"><label>元素属性</label>
                <select v-model="selectedChar.element">
                  <option v-for="elm in ELEMENTS" :key="elm.value" :value="elm.value">{{ elm.label }}</option>
                </select>
              </div>
            </div>
            <div class="form-group"><label>头像路径</label><input v-model="selectedChar.avatar" type="text" /></div>
            <div class="form-group">
              <label>专属 Buff</label>
              <div v-for="(buff, idx) in selectedChar.exclusive_buffs" :key="idx" class="exclusive-row">
                <input v-model="buff.key" placeholder="Key" /><input v-model="buff.name" placeholder="Name" /><input v-model="buff.path" placeholder="Path" class="flex-grow" />
                <button class="btn-icon" @click="selectedChar.exclusive_buffs.splice(idx, 1)">×</button>
              </div>
              <button class="btn-small" @click="selectedChar.exclusive_buffs.push({key:'',name:'',path:''})">+ 添加</button>
            </div>
          </div>

          <div v-show="activeTab === 'attack'" class="form-section">
            <div class="form-row">
              <div class="form-group"><label>持续时间</label><input type="number" step="0.1" v-model.number="selectedChar.attack_duration"></div>
              <div class="form-group"><label>技力回复</label><input type="number" v-model.number="selectedChar.attack_spGain"></div>
              <div class="form-group"><label>失衡值</label><input type="number" v-model.number="selectedChar.attack_stagger"></div>
            </div>

            <div class="form-group"><label>允许挂载的状态</label>
              <div class="checkbox-grid">
                <label v-for="key in effectKeys" :key="`attack_${key}`" class="cb-item">
                  <input type="checkbox" :value="key" v-model="selectedChar.attack_allowed_types" @change="onCheckChange(selectedChar, 'attack', key)">
                  {{ EFFECT_NAMES[key] }}
                </label>
                <label v-for="buff in selectedChar.exclusive_buffs" :key="`attack_${buff.key}`" class="cb-item exclusive">
                  <input type="checkbox" :value="buff.key" v-model="selectedChar.attack_allowed_types">
                  ★ {{ buff.name }}
                </label>
              </div>
            </div>

            <div class="form-group" style="margin-top: 20px; border-top: 1px dashed #444; padding-top: 15px;">
              <label>默认附带状态</label>
              <div class="info-banner" v-if="getAvailableAnomalyOptions('attack').length === 0">请先在上方勾选允许的状态。</div>

              <div v-for="(item, idx) in selectedChar.attack_anomalies" :key="idx" class="exclusive-row">
                <select v-model="item.type" class="flex-grow">
                  <option v-for="opt in getAvailableAnomalyOptions('attack')" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <input type="number" v-model.number="item.stacks" placeholder="层" style="width: 50px">
                <input type="number" v-model.number="item.duration" placeholder="秒" step="0.1" style="width: 60px">
                <button class="btn-icon" @click="selectedChar.attack_anomalies.splice(idx, 1)">×</button>
              </div>
              <button class="btn-small"
                      @click="addAnomaly('attack_anomalies', 'attack')"
                      :disabled="getAvailableAnomalyOptions('attack').length === 0">
                + 添加默认状态
              </button>
            </div>
          </div>

          <div v-show="activeTab === 'skill'" class="form-section">
            <div class="form-row">
              <div class="form-group"><label>属性 (可选)</label>
                <select v-model="selectedChar.skill_element"><option :value="undefined">跟随干员</option><option v-for="elm in ELEMENTS" :key="elm.value" :value="elm.value">{{ elm.label }}</option></select>
              </div>
              <div class="form-group"><label>持续时间</label><input type="number" step="0.1" v-model.number="selectedChar.skill_duration"></div>
              <div class="form-group"><label>技力消耗</label><input type="number" v-model.number="selectedChar.skill_spCost"></div>
              <div class="form-group"><label>技力回复</label><input type="number" v-model.number="selectedChar.skill_spGain"></div>
              <div class="form-group"><label>失衡值</label><input type="number" v-model.number="selectedChar.skill_stagger"></div>
              <div class="form-group"><label>自身充能</label><input type="number" v-model.number="selectedChar.skill_gaugeGain"></div>

              <div class="form-group">
                <label>队友充能</label>
                <input type="number" v-model.number="selectedChar.skill_teamGaugeGain">
              </div>
            </div>

            <div class="form-group"><label>允许挂载的状态</label>
              <div class="checkbox-grid">
                <label v-for="key in effectKeys" :key="`skill_${key}`" class="cb-item"><input type="checkbox" :value="key" v-model="selectedChar.skill_allowed_types" @change="onCheckChange(selectedChar, 'skill', key)">{{ EFFECT_NAMES[key] }}</label>
                <label v-for="buff in selectedChar.exclusive_buffs" :key="`skill_${buff.key}`" class="cb-item exclusive"><input type="checkbox" :value="buff.key" v-model="selectedChar.skill_allowed_types">★ {{ buff.name }}</label>
              </div>
            </div>

            <div class="form-group" style="margin-top: 20px; border-top: 1px dashed #444; padding-top: 15px;">
              <label>默认附带状态 (Auto Anomalies)</label>
              <div class="info-banner" v-if="getAvailableAnomalyOptions('skill').length === 0">请先在上方勾选允许的状态。</div>

              <div v-for="(item, idx) in selectedChar.skill_anomalies" :key="idx" class="exclusive-row">
                <select v-model="item.type" class="flex-grow">
                  <option v-for="opt in getAvailableAnomalyOptions('skill')" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <input type="number" v-model.number="item.stacks" placeholder="层" style="width: 50px">
                <input type="number" v-model.number="item.duration" placeholder="秒" step="0.1" style="width: 60px">
                <button class="btn-icon" @click="selectedChar.skill_anomalies.splice(idx, 1)">×</button>
              </div>
              <button class="btn-small"
                      @click="addAnomaly('skill_anomalies', 'skill')"
                      :disabled="getAvailableAnomalyOptions('skill').length === 0">
                + 添加默认状态
              </button>
            </div>
          </div>

          <div v-show="activeTab === 'link'" class="form-section">
            <div class="form-row">
              <div class="form-group"><label>持续时间</label><input type="number" step="0.1" v-model.number="selectedChar.link_duration"></div>
              <div class="form-group"><label>冷却时间</label><input type="number" v-model.number="selectedChar.link_cooldown"></div>
              <div class="form-group"><label>技力回复</label><input type="number" v-model.number="selectedChar.link_spGain"></div>
              <div class="form-group"><label>失衡值</label><input type="number" v-model.number="selectedChar.link_stagger"></div>
              <div class="form-group"><label>自身充能</label><input type="number" v-model.number="selectedChar.link_gaugeGain"></div>
            </div>

            <div class="form-group"><label>允许挂载的状态</label>
              <div class="checkbox-grid">
                <label v-for="key in effectKeys" :key="`link_${key}`" class="cb-item"><input type="checkbox" :value="key" v-model="selectedChar.link_allowed_types" @change="onCheckChange(selectedChar, 'link', key)">{{ EFFECT_NAMES[key] }}</label>
                <label v-for="buff in selectedChar.exclusive_buffs" :key="`link_${buff.key}`" class="cb-item exclusive"><input type="checkbox" :value="buff.key" v-model="selectedChar.link_allowed_types">★ {{ buff.name }}</label>
              </div>
            </div>

            <div class="form-group" style="margin-top: 20px; border-top: 1px dashed #444; padding-top: 15px;">
              <label>默认附带状态 (Auto Anomalies)</label>
              <div class="info-banner" v-if="getAvailableAnomalyOptions('link').length === 0">请先在上方勾选允许的状态。</div>
              <div v-for="(item, idx) in selectedChar.link_anomalies" :key="idx" class="exclusive-row">
                <select v-model="item.type" class="flex-grow">
                  <option v-for="opt in getAvailableAnomalyOptions('link')" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <input type="number" v-model.number="item.stacks" placeholder="层" style="width: 50px">
                <input type="number" v-model.number="item.duration" placeholder="秒" step="0.1" style="width: 60px">
                <button class="btn-icon" @click="selectedChar.link_anomalies.splice(idx, 1)">×</button>
              </div>
              <button class="btn-small"
                      @click="addAnomaly('link_anomalies', 'link')"
                      :disabled="getAvailableAnomalyOptions('link').length === 0">
                + 添加默认状态
              </button>
            </div>
          </div>

          <div v-show="activeTab === 'ultimate'" class="form-section">
            <div class="form-row">
              <div class="form-group"><label>属性 (可选)</label>
                <select v-model="selectedChar.ultimate_element"><option :value="undefined">跟随干员</option><option v-for="elm in ELEMENTS" :key="elm.value" :value="elm.value">{{ elm.label }}</option></select>
              </div>
              <div class="form-group"><label>持续时间</label><input type="number" step="0.1" v-model.number="selectedChar.ultimate_duration"></div>

              <div class="form-group"><label>技力回复</label><input type="number" v-model.number="selectedChar.ultimate_spGain"></div>
              <div class="form-group"><label>失衡值</label><input type="number" v-model.number="selectedChar.ultimate_stagger"></div>
              <div class="form-group"><label>充能消耗</label><input type="number" v-model.number="selectedChar.ultimate_gaugeMax"></div>

              <div class="form-group"><label>自身充能</label><input type="number" v-model.number="selectedChar.ultimate_gaugeReply"></div>
            </div>

            <div class="form-group"><label>允许挂载的状态</label>
              <div class="checkbox-grid">
                <label v-for="key in effectKeys" :key="`ultimate_${key}`" class="cb-item"><input type="checkbox" :value="key" v-model="selectedChar.ultimate_allowed_types" @change="onCheckChange(selectedChar, 'ultimate', key)">{{ EFFECT_NAMES[key] }}</label>
                <label v-for="buff in selectedChar.exclusive_buffs" :key="`ultimate_${buff.key}`" class="cb-item exclusive"><input type="checkbox" :value="buff.key" v-model="selectedChar.ultimate_allowed_types">★ {{ buff.name }}</label>
              </div>
            </div>

            <div class="form-group" style="margin-top: 20px; border-top: 1px dashed #444; padding-top: 15px;">
              <label>默认附带状态 (Auto Anomalies)</label>
              <div class="info-banner" v-if="getAvailableAnomalyOptions('ultimate').length === 0">请先在上方勾选允许的状态。</div>
              <div v-for="(item, idx) in selectedChar.ultimate_anomalies" :key="idx" class="exclusive-row">
                <select v-model="item.type" class="flex-grow">
                  <option v-for="opt in getAvailableAnomalyOptions('ultimate')" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <input type="number" v-model.number="item.stacks" placeholder="层" style="width: 50px">
                <input type="number" v-model.number="item.duration" placeholder="秒" step="0.1" style="width: 60px">
                <button class="btn-icon" @click="selectedChar.ultimate_anomalies.splice(idx, 1)">×</button>
              </div>
              <button class="btn-small"
                      @click="addAnomaly('ultimate_anomalies', 'ultimate')"
                      :disabled="getAvailableAnomalyOptions('ultimate').length === 0">
                + 添加默认状态
              </button>
            </div>
          </div>

          <div v-show="activeTab === 'execution'" class="form-section">
            <div class="form-row">
              <div class="form-group"><label>持续时间</label><input type="number" step="0.1" v-model.number="selectedChar.execution_duration"></div>
              <div class="form-group"><label>技力回复</label><input type="number" v-model.number="selectedChar.execution_spGain"></div>
            </div>

            <div class="form-group"><label>允许挂载的状态</label>
              <div class="checkbox-grid">
                <label v-for="key in effectKeys" :key="`execution_${key}`" class="cb-item">
                  <input type="checkbox" :value="key" v-model="selectedChar.execution_allowed_types" @change="onCheckChange(selectedChar, 'execution', key)">
                  {{ EFFECT_NAMES[key] }}
                </label>
                <label v-for="buff in selectedChar.exclusive_buffs" :key="`execution_${buff.key}`" class="cb-item exclusive">
                  <input type="checkbox" :value="buff.key" v-model="selectedChar.execution_allowed_types">
                  ★ {{ buff.name }}
                </label>
              </div>
            </div>

            <div class="form-group" style="margin-top: 20px; border-top: 1px dashed #444; padding-top: 15px;">
              <label>默认附带状态 (Auto Anomalies)</label>
              <div class="info-banner" v-if="getAvailableAnomalyOptions('execution').length === 0">请先在上方勾选允许的状态。</div>

              <div v-for="(item, idx) in selectedChar.execution_anomalies" :key="idx" class="exclusive-row">
                <select v-model="item.type" class="flex-grow">
                  <option v-for="opt in getAvailableAnomalyOptions('execution')" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <input type="number" v-model.number="item.stacks" placeholder="层" style="width: 50px">
                <input type="number" v-model.number="item.duration" placeholder="秒" step="0.1" style="width: 60px">
                <button class="btn-icon" @click="selectedChar.execution_anomalies.splice(idx, 1)">×</button>
              </div>
              <button class="btn-small"
                      @click="addAnomaly('execution_anomalies', 'execution')"
                      :disabled="getAvailableAnomalyOptions('execution').length === 0">
                + 添加默认状态
              </button>
            </div>

          </div>

        </div>
      </div>
      <div v-else class="empty-state">请从左侧选择干员</div>
    </main>
  </div>
</template>

<style scoped>
.cms-layout { display: flex; height: 100vh; background-color: #1e1e1e; color: #f0f0f0; overflow: hidden; font-family: sans-serif; }
.cms-sidebar { width: 280px; background-color: #252526; border-right: 1px solid #333; display: flex; flex-direction: column; }
.sidebar-header { padding: 15px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }
.sidebar-header h2 { margin: 0; font-size: 18px; color: #ffd700; }
.btn-add { background: #444; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
.btn-add:hover { background: #555; }
.search-box { padding: 10px; border-bottom: 1px solid #333; }
.search-box input { width: 100%; padding: 8px; box-sizing: border-box; background: #333; border: 1px solid #444; color: #fff; border-radius: 4px; }
.char-list { flex-grow: 1; overflow-y: auto; padding: 10px; }
.char-item { display: flex; align-items: center; padding: 8px; border-radius: 6px; cursor: pointer; transition: background 0.2s; margin-bottom: 4px; }
.char-item:hover { background-color: #333; }
.char-item.active { background-color: #37373d; border-left: 3px solid #ffd700; }
.avatar-small { width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; background: #444; object-fit: cover; }
.char-info { display: flex; flex-direction: column; }
.char-name { font-weight: bold; font-size: 14px; }
.char-meta { font-size: 12px; color: #888; }
.rarity-6 { color: #ffd700; } .rarity-5 { color: #f0f0f0; }
.sidebar-footer { padding: 15px; border-top: 1px solid #333; display: flex; flex-direction: column; gap: 10px; }
.btn-save { width: 100%; padding: 10px; background: #2e7d32; border: none; color: white; border-radius: 4px; cursor: pointer; font-weight: bold; }
.btn-save:hover { background: #388e3c; }
.btn-back { text-align: center; color: #aaa; text-decoration: none; font-size: 12px; display: block; padding: 5px; }
.btn-back:hover { color: #fff; }
.cms-content { flex-grow: 1; overflow-y: auto; padding: 30px; background-color: #1e1e1e; }
.editor-panel { max-width: 900px; margin: 0 auto; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #444; padding-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 20px; }
.avatar-large { width: 80px; height: 80px; border-radius: 8px; background: #333; object-fit: cover; border: 2px solid #555; }
.edit-title { margin: 0; font-size: 24px; }
.id-tag { font-size: 14px; color: #666; font-weight: normal; margin-left: 10px; font-family: monospace; }
.btn-danger { background: #d32f2f; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
.cms-tabs { display: flex; gap: 5px; margin-bottom: 20px; border-bottom: 1px solid #444; }
.cms-tabs button { background: #2d2d2d; border: none; color: #aaa; padding: 10px 20px; cursor: pointer; border-radius: 4px 4px 0 0; transition: all 0.2s; }
.cms-tabs button:hover { background: #333; color: #fff; }
.cms-tabs button.active { background: #37373d; color: #ffd700; font-weight: bold; border-bottom: 2px solid #ffd700; }
.form-section { background: #252526; padding: 20px; border-radius: 8px; animation: fadeIn 0.2s ease; }
.form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
.form-group { margin-bottom: 15px; display: flex; flex-direction: column; }
.form-group label { margin-bottom: 6px; color: #999; font-size: 12px; }
.form-group input, .form-group select { background: #1e1e1e; border: 1px solid #444; color: #fff; padding: 10px; border-radius: 4px; font-size: 14px; }
.form-group input:focus { border-color: #ffd700; outline: none; }
.exclusive-row { display: flex; gap: 10px; margin-bottom: 10px; }
.exclusive-row input { background: #1e1e1e; border: 1px solid #444; color: #fff; padding: 6px; border-radius: 4px; }
.flex-grow { flex-grow: 1; }
.btn-icon { background: none; border: none; color: #666; cursor: pointer; font-size: 18px; }
.btn-icon:hover { color: #d32f2f; }
.btn-small { background: #333; border: 1px dashed #666; color: #aaa; padding: 6px 12px; cursor: pointer; border-radius: 4px; width: 100%; }
.btn-small:hover { border-color: #ffd700; color: #ffd700; }
.checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; background: #1e1e1e; padding: 15px; border-radius: 4px; border: 1px solid #333; }
.cb-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #ccc; cursor: pointer; user-select: none; }
.cb-item.exclusive { color: #ffd700; }
.info-banner { background: rgba(255, 255, 255, 0.05); padding: 10px; border-left: 3px solid #888; color: #ccc; margin-bottom: 20px; font-size: 13px; }
.empty-state { display: flex; justify-content: center; align-items: center; height: 300px; color: #666; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>