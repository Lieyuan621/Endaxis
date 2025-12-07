<script setup>
import { computed, ref, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import draggable from 'vuedraggable'
import CustomNumberInput from './CustomNumberInput.vue'
import { ArrowRight } from '@element-plus/icons-vue'

const store = useTimelineStore()

// ===================================================================================
// 1. 常量与配置
// ===================================================================================
const HIGHLIGHT_COLORS = {
  default: '#ffd700',
  red: '#ff7875',
  blue: '#00e5ff',
}

const EFFECT_NAMES = {
  "break": "破防", "armor_break": "碎甲", "stagger": "猛击", "knockdown": "倒地", "knockup": "击飞",
  "blaze_attach": "灼热附着", "emag_attach": "电磁附着", "cold_attach": "寒冷附着", "nature_attach": "自然附着",
  "blaze_burst": "灼热爆发", "emag_burst": "电磁爆发", "cold_burst": "寒冷爆发", "nature_burst": "自然爆发",
  "burning": "燃烧", "conductive": "导电", "frozen": "冻结", "ice_shatter": "碎冰", "corrosion": "腐蚀",
  "default": "默认图标"
}

const GROUP_DEFINITIONS = [
  { label: ' 物理异常 ', keys: ['break', 'armor_break', 'stagger', 'knockdown', 'knockup', 'ice_shatter'] },
  { label: ' 元素附着', matcher: (key) => key.endsWith('_attach') },
  { label: ' 元素爆发', matcher: (key) => key.endsWith('_burst') },
  { label: ' 异常状态 ', keys: ['burning', 'conductive', 'frozen', 'corrosion'] },
  { label: ' 其他', keys: ['default'] }
]

// ===================================================================================
// 2. 核心状态计算
// ===================================================================================

const isTicksExpanded = ref(false)
const isBarsExpanded = ref(false)
const localSelectedAnomalyId = ref(null) // 用于库模式下的本地选中状态

// 监听选中切换，重置本地状态
watch(() => store.selectedLibrarySkillId, () => {
  localSelectedAnomalyId.value = null
})

const targetData = computed(() => {
  if (store.selectedActionId) {
    // 寻找实例
    for (const track of store.tracks) {
      const found = track.actions.find(a => a.instanceId === store.selectedActionId)
      if (found) return found
    }
  }
  if (store.selectedLibrarySkillId) {
    // 寻找库模板
    return store.activeSkillLibrary.find(s => s.id === store.selectedLibrarySkillId)
  }
  return null
})

const isLibraryMode = computed(() => {
  return !!store.selectedLibrarySkillId && !store.selectedActionId
})

const currentCharacter = computed(() => {
  if (!targetData.value) return null

  if (!isLibraryMode.value) {
    const track = store.tracks.find(t => t.actions.some(a => a.instanceId === store.selectedActionId))
    if (!track) return null
    return store.characterRoster.find(c => c.id === track.id)
  }

  if (store.activeTrackId) {
    return store.characterRoster.find(c => c.id === store.activeTrackId)
  }
  return null
})

const currentSkillType = computed(() => targetData.value?.type || 'unknown')

// === 统一更新函数 ===
function commitUpdate(payload) {
  if (!targetData.value) return

  if (isLibraryMode.value) {
    // 更新库技能 (Character Overrides)
    store.updateLibrarySkill(targetData.value.id, payload)
  } else {
    // 更新时间轴实例
    store.updateAction(store.selectedActionId, payload)
  }
}

// === 异常状态相关 ===

const anomalyRows = computed({
  get: () => targetData.value?.physicalAnomaly || [],
  set: (val) => commitUpdate({ physicalAnomaly: val })
})

const activeAnomalyId = computed(() => {
  return isLibraryMode.value ? localSelectedAnomalyId.value : store.selectedAnomalyId
})

const currentSelectedCoords = computed(() => {
  if (!activeAnomalyId.value || !targetData.value) return null

  const rows = targetData.value.physicalAnomaly || []
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    const c = row.findIndex(e => e._id === activeAnomalyId.value)
    if (c !== -1) return { rowIndex: r, colIndex: c }
  }
  return null
})

const editingEffectData = computed(() => {
  const coords = currentSelectedCoords.value
  if (!coords) return null
  return anomalyRows.value[coords.rowIndex]?.[coords.colIndex]
})

const currentFlatIndex = computed(() => {
  const coords = currentSelectedCoords.value
  if (!coords) return null
  let flatIndex = 0
  for (let i = 0; i < coords.rowIndex; i++) {
    if (anomalyRows.value[i]) flatIndex += anomalyRows.value[i].length
  }
  flatIndex += coords.colIndex
  return flatIndex
})

function isEditing(r, c) {
  const coords = currentSelectedCoords.value
  return coords && coords.rowIndex === r && coords.colIndex === c
}

// ===================================================================================
// 3. 动作与更新逻辑
// ===================================================================================

function toggleEditEffect(r, c) {
  const effect = anomalyRows.value[r]?.[c]
  if (!effect) return
  if (!effect._id) effect._id = Math.random().toString(36).substring(2, 9)

  const targetId = effect._id

  if (isLibraryMode.value) {
    // 库模式：使用本地状态
    localSelectedAnomalyId.value = (localSelectedAnomalyId.value === targetId) ? null : targetId
  } else {
    // 实例模式：使用 Store 状态
    if (store.selectedAnomalyId === targetId) {
      store.setSelectedAnomalyId(null)
    } else {
      store.selectAnomaly(store.selectedActionId, r, c)
    }
  }
}

function updateEffectProp(key, value) {
  const coords = currentSelectedCoords.value
  if (!coords) return
  const { rowIndex, colIndex } = coords
  const rows = JSON.parse(JSON.stringify(anomalyRows.value))
  if (rows[rowIndex] && rows[rowIndex][colIndex]) {
    rows[rowIndex][colIndex][key] = value
    commitUpdate({ physicalAnomaly: rows })
  }
}

function addRow() {
  const rows = JSON.parse(JSON.stringify(anomalyRows.value))
  const allowed = targetData.value.allowedTypes || []
  const defaultType = allowed.length > 0 ? allowed[0] : 'default'

  rows.push([{
    _id: Math.random().toString(36).substring(2, 9),
    type: defaultType, stacks: 1, duration: 0, offset: 0, sp: 0, stagger: 0
  }])

  commitUpdate({ physicalAnomaly: rows })

  const lastRowIndex = rows.length - 1
  const newEffect = rows[lastRowIndex][0]
  if (newEffect) {
    if (isLibraryMode.value) localSelectedAnomalyId.value = newEffect._id
    else store.setSelectedAnomalyId(newEffect._id)
  }
}

function addEffectToRow(rowIndex) {
  const rows = JSON.parse(JSON.stringify(anomalyRows.value))
  const allowed = targetData.value.allowedTypes || []
  const defaultType = allowed.length > 0 ? allowed[0] : 'default'

  if (rows[rowIndex]) {
    const newEffect = {
      _id: Math.random().toString(36).substring(2, 9),
      type: defaultType, stacks: 1, duration: 0, offset: 0, sp: 0, stagger: 0
    }
    rows[rowIndex].push(newEffect)
    commitUpdate({ physicalAnomaly: rows })

    if (isLibraryMode.value) localSelectedAnomalyId.value = newEffect._id
    else store.setSelectedAnomalyId(newEffect._id)
  }
}

function removeEffect(r, c) {
  if (isLibraryMode.value) {
    const rows = JSON.parse(JSON.stringify(anomalyRows.value))
    if (rows[r]) {
      rows[r].splice(c, 1)
      if (rows[r].length === 0) rows.splice(r, 1)
      commitUpdate({ physicalAnomaly: rows })
      localSelectedAnomalyId.value = null
    }
    return
  }
  store.removeAnomaly(store.selectedActionId, r, c)
  store.setSelectedAnomalyId(null)
}

function updateActionProp(key, value) {
  commitUpdate({ [key]: value })
}

function updateActionGaugeWithLink(value) {
  commitUpdate({ gaugeGain: value, teamGaugeGain: value })
}

function addDamageTick() {
  const currentTicks = targetData.value.damageTicks ? [...targetData.value.damageTicks] : []
  currentTicks.push({ offset: 0, stagger: 0, sp: 0 })
  currentTicks.sort((a, b) => a.offset - b.offset)
  commitUpdate({ damageTicks: currentTicks })
  isTicksExpanded.value = true
}

function removeDamageTick(index) {
  const currentTicks = [...(targetData.value.damageTicks || [])]
  currentTicks.splice(index, 1)
  commitUpdate({ damageTicks: currentTicks })
}

function updateDamageTick(index, key, value) {
  const currentTicks = [...(targetData.value.damageTicks || [])]
  currentTicks[index] = { ...currentTicks[index], [key]: value }
  if (key === 'offset') {
    currentTicks.sort((a, b) => a.offset - b.offset)
  }
  commitUpdate({ damageTicks: currentTicks })
}

const customBarsList = computed(() => targetData.value?.customBars || [])

function addCustomBar() {
  const newList = [...customBarsList.value]
  newList.push({ text: '', duration: 1, offset: 0 })
  commitUpdate({ customBars: newList })
  isBarsExpanded.value = true
}

function removeCustomBar(index) {
  const newList = [...customBarsList.value]
  newList.splice(index, 1)
  commitUpdate({ customBars: newList })
}

function updateCustomBarItem(index, key, value) {
  const newList = [...customBarsList.value]
  newList[index] = { ...newList[index], [key]: value }
  commitUpdate({ customBars: newList })
}

// ===================================================================================
// 4. 资源与连线查询
// ===================================================================================

const iconOptions = computed(() => {
  const allGlobalKeys = Object.keys(store.iconDatabase)
  const allowed = targetData.value?.allowedTypes
  const availableKeys = (allowed && allowed.length > 0)
      ? allGlobalKeys.filter(key => allowed.includes(key) || key === 'default')
      : allGlobalKeys

  const groups = []
  if (currentCharacter.value && currentCharacter.value.exclusive_buffs) {
    let exclusiveOpts = currentCharacter.value.exclusive_buffs.map(buff => ({
      label: `★ ${buff.name}`, value: buff.key, path: buff.path
    }))
    if (allowed && allowed.length > 0) exclusiveOpts = exclusiveOpts.filter(opt => allowed.includes(opt.value))
    if (exclusiveOpts.length > 0) groups.push({ label: ' 专属效果 ', options: exclusiveOpts })
  }

  const processedKeys = new Set()
  GROUP_DEFINITIONS.forEach(def => {
    const groupKeys = availableKeys.filter(key => {
      if (processedKeys.has(key)) return false
      if (def.keys && def.keys.includes(key)) return true
      if (def.matcher && def.matcher(key)) return true
      return false
    })
    if (groupKeys.length > 0) {
      groupKeys.forEach(k => processedKeys.add(k))
      groups.push({
        label: def.label,
        options: groupKeys.map(key => ({
          label: EFFECT_NAMES[key] || key, value: key, path: store.iconDatabase[key]
        }))
      })
    }
  })

  const remainingKeys = availableKeys.filter(k => !processedKeys.has(k))
  if (remainingKeys.length > 0) {
    groups.push({
      label: '其他',
      options: remainingKeys.map(key => ({
        label: EFFECT_NAMES[key] || key, value: key, path: store.iconDatabase[key]
      }))
    })
  }
  return groups
})

function getIconPath(type) {
  if (store.iconDatabase[type]) return store.iconDatabase[type]
  if (currentCharacter.value && currentCharacter.value.exclusive_buffs) {
    const exclusive = currentCharacter.value.exclusive_buffs.find(b => b.key === type)
    if (exclusive) return exclusive.path
  }
  return store.iconDatabase['default'] || ''
}

const relevantConnections = computed(() => {
  if (isLibraryMode.value || !store.selectedActionId) return []

  return store.connections
      .filter(c => c.from === store.selectedActionId || c.to === store.selectedActionId)
      .map(conn => {
        const isOutgoing = conn.from === store.selectedActionId
        const otherActionId = isOutgoing ? conn.to : conn.from

        let otherActionName = '未知动作'
        let otherAction = null
        for (const track of store.tracks) {
          const action = track.actions.find(a => a.instanceId === otherActionId)
          if (action) {
            otherActionName = action.name
            otherAction = action
            break
          }
        }

        let myIconPath = null
        if (targetData.value) {
          const myEffectId = isOutgoing ? conn.fromEffectId : conn.toEffectId
          let realIndex = -1
          if (myEffectId) realIndex = store.findEffectIndexById(targetData.value, myEffectId)
          if (realIndex === -1 && (isOutgoing ? conn.fromEffectIndex : conn.toEffectIndex) !== null) {
            realIndex = isOutgoing ? conn.fromEffectIndex : conn.toEffectIndex
          }
          if (realIndex !== -1) {
            const allEffects = (targetData.value.physicalAnomaly || []).flat()
            const effect = allEffects[realIndex]
            if (effect) myIconPath = getIconPath(effect.type)
          }
        }

        let otherIconPath = null
        if (otherAction) {
          const otherEffectId = isOutgoing ? conn.toEffectId : conn.fromEffectId
          let realIndex = -1
          if (otherEffectId) realIndex = store.findEffectIndexById(otherAction, otherEffectId)
          if (realIndex === -1 && (isOutgoing ? conn.toEffectIndex : conn.fromEffectIndex) !== null) {
            realIndex = isOutgoing ? conn.toEffectIndex : conn.fromEffectIndex
          }
          if (realIndex !== -1) {
            const allEffects = (otherAction.physicalAnomaly || []).flat()
            const effect = allEffects[realIndex]
            if (effect) otherIconPath = getIconPath(effect.type)
          }
        }

        return {
          id: conn.id,
          direction: isOutgoing ? '连向' : '来自',
          isOutgoing,
          rawConnection: conn,
          otherActionName,
          myIconPath,
          otherIconPath
        }
      })
})
</script>

<template>
  <div v-if="targetData" class="properties-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        {{ targetData.name }}
        <span v-if="isLibraryMode" class="mode-badge">此处更改会全局生效</span>
      </h3>
      <div class="type-badge">{{ targetData.type }}</div>
    </div>

    <div class="section-container">
      <div class="section-label">基础属性</div>
      <div class="attribute-grid">
        <div class="form-group compact">
          <label>持续时间(s)</label>
          <CustomNumberInput :model-value="targetData.duration" @update:model-value="val => updateActionProp('duration', val)" :step="0.1" :min="0" :activeColor="HIGHLIGHT_COLORS.default" text-align="center"/>
        </div>

        <div class="form-group compact" v-if="currentSkillType === 'link'">
          <label>冷却时间(s)</label>
          <CustomNumberInput :model-value="targetData.cooldown" @update:model-value="val => updateActionProp('cooldown', val)" :min="0" :activeColor="HIGHLIGHT_COLORS.default" text-align="center"/>
        </div>

        <div class="form-group compact" v-if="currentSkillType === 'link' && !isLibraryMode">
          <label>触发窗口(s)</label>
          <CustomNumberInput :model-value="targetData.triggerWindow || 0" @update:model-value="val => updateActionProp('triggerWindow', val)" :step="0.1" :border-color="HIGHLIGHT_COLORS.default" text-align="center"/>
        </div>

        <div class="form-group compact" v-if="currentSkillType === 'skill'">
          <label>技力消耗</label>
          <CustomNumberInput :model-value="targetData.spCost" @update:model-value="val => updateActionProp('spCost', val)" :min="0" :border-color="HIGHLIGHT_COLORS.default" text-align="center"/>
        </div>

        <div class="form-group compact" v-if="currentSkillType === 'ultimate'">
          <label>充能消耗</label>
          <CustomNumberInput :model-value="targetData.gaugeCost" @update:model-value="val => updateActionProp('gaugeCost', val)" :min="0" :border-color="HIGHLIGHT_COLORS.blue" text-align="center"/>
        </div>

        <div class="form-group compact" v-if="!['execution'].includes(currentSkillType)">
          <label>自身充能</label>
          <CustomNumberInput :model-value="targetData.gaugeGain" @update:model-value="val => updateActionGaugeWithLink(val)" :min="0" :border-color="HIGHLIGHT_COLORS.blue" text-align="center"/>
        </div>

        <div class="form-group compact" v-if="currentSkillType === 'skill'">
          <label>队友充能</label>
          <CustomNumberInput :model-value="targetData.teamGaugeGain" @update:model-value="val => updateActionProp('teamGaugeGain', val)" :min="0" :border-color="HIGHLIGHT_COLORS.blue" text-align="center"/>
        </div>

        <div class="form-group compact" v-if="currentSkillType === 'ultimate'">
          <label>强化时间(s)</label>
          <CustomNumberInput :model-value="targetData.enhancementTime || 0" @update:model-value="val => updateActionProp('enhancementTime', val)" :step="0.5" :min="0" activeColor="#b37feb" border-color="#b37feb" text-align="center"/></div>
      </div>
    </div>

    <div class="section-container border-red">
      <div class="section-header clickable" @click="isTicksExpanded = !isTicksExpanded">
        <div class="header-left">
          <label style="color: #ff7875;">伤害判定点 ({{ (targetData.damageTicks || []).length }})</label>
        </div>
        <div class="header-right">
          <button class="icon-btn-add" @click.stop="addDamageTick">+</button>
          <el-icon :class="{ 'is-rotated': isTicksExpanded }" style="margin-left:5px"><ArrowRight /></el-icon>
        </div>
      </div>

      <div v-if="isTicksExpanded" class="section-content">
        <div v-if="!targetData.damageTicks || targetData.damageTicks.length === 0" class="empty-hint">暂无判定点</div>
        <div v-for="(tick, index) in (targetData.damageTicks || [])" :key="index" class="tick-item">
          <div class="tick-header">
            <span class="tick-idx">HIT {{ index + 1 }}</span>
            <button class="remove-btn" @click="removeDamageTick(index)">×</button>
          </div>
          <div class="tick-row">
            <div class="tick-col">
              <label>触发时间(s)</label>
              <CustomNumberInput :model-value="tick.offset" @update:model-value="val => updateDamageTick(index, 'offset', val)" :step="0.1" :min="0" border-color="#ff7875" />
            </div>
            <div class="tick-col">
              <label>失衡值</label>
              <CustomNumberInput :model-value="tick.stagger" @update:model-value="val => updateDamageTick(index, 'stagger', val)" :step="1" :min="0" border-color="#ff7875" text-align="center"/>
            </div>
            <div class="tick-col">
              <label>技力回复</label>
              <CustomNumberInput :model-value="tick.sp || 0" @update:model-value="val => updateDamageTick(index, 'sp', val)" :step="1" :min="0" border-color="#ffd700" text-align="center"/>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-container border-blue">
      <div class="section-header clickable" @click="isBarsExpanded = !isBarsExpanded">
        <div class="header-left">
          <label style="color: #00e5ff;">自定义时间条 ({{ customBarsList.length }})</label>
        </div>
        <div class="header-right">
          <button class="icon-btn-add cyan" @click.stop="addCustomBar">+</button>
          <el-icon :class="{ 'is-rotated': isBarsExpanded }" style="margin-left:5px"><ArrowRight /></el-icon>
        </div>
      </div>
      <div v-if="isBarsExpanded" class="section-content">
        <div v-if="customBarsList.length === 0" class="empty-hint">暂无时间条</div>
        <div v-for="(bar, index) in customBarsList" :key="index" class="tick-item blue-theme">
          <div class="tick-header">
            <input type="text" :value="bar.text" @input="e => updateCustomBarItem(index, 'text', e.target.value)" placeholder="条目名称..." class="simple-input">
            <button class="remove-btn" @click="removeCustomBar(index)">×</button>
          </div>
          <div class="tick-row">
            <div class="tick-col">
              <label>持续时间(s)</label>
              <CustomNumberInput :model-value="bar.duration" @update:model-value="val => updateCustomBarItem(index, 'duration', val)" :step="0.5" :min="0" border-color="#00e5ff" />
            </div>
            <div class="tick-col">
              <label>偏移(s)</label>
              <CustomNumberInput :model-value="bar.offset" @update:model-value="val => updateCustomBarItem(index, 'offset', val)" :step="0.1" :min="0" border-color="#00e5ff" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-container no-border">
      <div class="section-label">状态效果与排布</div>
      <div class="anomalies-editor-container">
        <draggable v-model="anomalyRows" item-key="rowIndex" class="rows-container" handle=".row-handle" :animation="200">
          <template #item="{ element: row, index: rowIndex }">
            <div class="anomaly-editor-row">
              <div class="row-handle">⋮</div>
              <draggable :list="row" item-key="_id" class="row-items-list" :group="{ name: 'effects' }" :animation="150"
                         @change="() => commitUpdate({ physicalAnomaly: anomalyRows })">
                <template #item="{ element: effect, index: colIndex }">
                  <div class="icon-wrapper" :class="{ 'is-editing': isEditing(rowIndex, colIndex) }"
                       @click="toggleEditEffect(rowIndex, colIndex)">
                    <img :src="getIconPath(effect.type)" class="mini-icon"/>
                    <div v-if="effect.stacks > 1" class="mini-stacks">{{ effect.stacks }}</div>
                  </div>
                </template>
              </draggable>
              <button class="add-to-row-btn" @click="addEffectToRow(rowIndex)" title="追加">+</button>
            </div>
          </template>
        </draggable>
        <button class="add-effect-bar" @click="addRow">+ 添加新行</button>
      </div>

      <div v-if="editingEffectData && currentSelectedCoords" class="effect-detail-editor-embedded">
        <div class="editor-arrow"></div>
        <div class="editor-header-mini">
          <span>编辑 R{{ currentSelectedCoords.rowIndex + 1 }} : C{{ currentSelectedCoords.colIndex + 1 }}</span>
          <button class="close-btn" @click="isLibraryMode ? (localSelectedAnomalyId = null) : store.setSelectedAnomalyId(null)">关闭</button>
        </div>

        <div class="editor-grid">
          <div class="full-width-col">
            <label>类型</label>
            <el-select :model-value="editingEffectData.type" @update:model-value="(val) => updateEffectProp('type', val)" placeholder="选择状态" filterable size="small" class="effect-select-dark">
              <el-option-group v-for="group in iconOptions" :key="group.label" :label="group.label">
                <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value">
                  <div class="opt-row">
                    <img :src="item.path" /><span>{{ item.label }}</span>
                  </div>
                </el-option>
              </el-option-group>
            </el-select>
          </div>

          <div>
            <label>触发时间(s)</label>
            <CustomNumberInput :model-value="editingEffectData.offset || 0" @update:model-value="val => updateEffectProp('offset', val)" :step="0.1" :min="0" :activeColor="HIGHLIGHT_COLORS.default"/>
          </div>
          <div>
            <label>持续时间(s)</label>
            <CustomNumberInput :model-value="editingEffectData.duration" @update:model-value="val => updateEffectProp('duration', val)" :min="0" :step="0.5" :activeColor="HIGHLIGHT_COLORS.default"/>
          </div>
          <div>
            <label>层数</label>
            <CustomNumberInput :model-value="editingEffectData.stacks" @update:model-value="val => updateEffectProp('stacks', val)" :min="1" :activeColor="HIGHLIGHT_COLORS.default"/>
          </div>
        </div>

        <div class="editor-actions">
          <button v-if="!isLibraryMode" class="action-btn link-style" @click.stop="store.startLinking(currentFlatIndex)"
                  :class="{ 'is-linking': store.isLinking && store.linkingEffectIndex === currentFlatIndex }">
            连线
          </button>
          <button class="action-btn delete-style" @click="removeEffect(currentSelectedCoords.rowIndex, currentSelectedCoords.colIndex)">删除</button>
        </div>
      </div>
    </div>

    <div v-if="!isLibraryMode" class="section-container no-border" style="margin-top: 20px;">
      <div class="connection-header-group">
        <div class="section-label">动作连线关系</div>
        <button class="main-link-btn" @click.stop="store.startLinking()"
                :class="{ 'is-linking': store.isLinking && store.linkingEffectIndex === null }">
          {{ (store.isLinking && store.linkingEffectIndex === null) ? '选择目标...' : '+ 新建连线' }}
        </button>
      </div>

      <div v-if="relevantConnections.length === 0" class="empty-hint">无连线</div>

      <div class="connections-list">
        <div v-for="conn in relevantConnections" :key="conn.id" class="connection-card"
             :class="{ 'outgoing': conn.isOutgoing, 'incoming': !conn.isOutgoing }">

          <div class="conn-vis">
            <div class="node left">
              <img v-if="conn.isOutgoing && conn.myIconPath" :src="conn.myIconPath" class="icon-s" />
              <span v-else class="text-s">{{ conn.isOutgoing ? '本动作' : conn.otherActionName }}</span>
            </div>
            <div class="arrow">➔</div>
            <div class="node right">
              <img v-if="!conn.isOutgoing && conn.myIconPath" :src="conn.myIconPath" class="icon-s" />
              <span v-else class="text-s">{{ conn.isOutgoing ? conn.otherActionName : '本动作' }}</span>
            </div>
          </div>

          <div class="conn-tools">
            <div v-if="conn.isOutgoing && conn.rawConnection.fromEffectIndex != null" class="consume-tag"
                 :class="{ 'active': conn.rawConnection.isConsumption }"
                 @click="store.updateConnection(conn.id, { isConsumption: !conn.rawConnection.isConsumption })">
              被消耗
            </div>

            <div v-if="conn.rawConnection.isConsumption" class="offset-mini">
              <span>提前</span>
              <CustomNumberInput :model-value="conn.rawConnection.consumptionOffset || 0" @update:model-value="val => store.updateConnection(conn.id, { consumptionOffset: val })" :step="0.1" style="width: 65px; height: 22px;"/>
            </div>

            <div class="spacer"></div>
            <button class="btn-del-conn" @click="store.removeConnection(conn.id)">×</button>
          </div>
        </div>
      </div>
    </div>

  </div>

  <div v-else class="properties-panel empty">
    <p>请选中一个动作或技能</p>
  </div>
</template>

<style scoped>
/* Reset & Base */
.properties-panel {
  padding: 12px;
  color: #e0e0e0;
  background-color: #2b2b2b;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  font-size: 13px;
}

/* Header */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
}
.panel-title { margin: 0; color: #ffd700; font-size: 16px; font-weight: bold; display: flex; flex-direction: column; gap: 4px; }
.mode-badge { font-size: 10px; color: #888; font-weight: normal; background: #333; padding: 2px 4px; border-radius: 2px; width: fit-content; }
.type-badge { font-size: 10px; background: #444; padding: 2px 6px; border-radius: 4px; color: #aaa; text-transform: uppercase; }

/* Sections */
.section-container {
  margin-bottom: 15px;
  background: #333;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #444;
}
.section-container.no-border { background: transparent; border: none; overflow: visible; }
.section-container.border-red { border-left: 3px solid #ff7875; }
.section-container.border-blue { border-left: 3px solid #00e5ff; }

.section-label {
  font-size: 12px; font-weight: bold; color: #888; margin-bottom: 8px; display: block;
}

/* Grid Layout for Attributes */
.attribute-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 10px;
}
.form-group.compact label { font-size: 10px; color: #999; margin-bottom: 2px; display: block; }

/* Accordion Headers */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: rgba(0,0,0,0.2);
  cursor: pointer;
  transition: background 0.2s;
}
.section-header:hover { background: rgba(0,0,0,0.4); }
.header-left label { font-size: 12px; font-weight: bold; cursor: pointer; }
.header-right { display: flex; align-items: center; }
.icon-btn-add {
  background: #ff7875; color: #000; border: none; width: 18px; height: 18px;
  border-radius: 2px; font-weight: bold; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.icon-btn-add.cyan { background: #00e5ff; }

.section-content { padding: 8px; background: rgba(0,0,0,0.1); border-top: 1px solid #444; }

/* Tick Items */
.tick-item { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #444; }
.tick-item:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
.tick-header { display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center; }
.tick-idx { font-size: 10px; color: #ff7875; font-family: monospace; }
.blue-theme .tick-idx { color: #00e5ff; }
.remove-btn { background: none; border: none; color: #666; cursor: pointer; font-size: 16px; line-height: 1; padding: 0; }
.remove-btn:hover { color: #fff; }
.tick-row { display: flex; gap: 6px; }
.tick-col label { font-size: 9px; color: #777; display: block; margin-bottom: 1px; }
.simple-input { background: transparent; border: none; border-bottom: 1px solid #555; color: #ccc; width: 100%; font-size: 12px; padding: 0 0 2px 0; }
.simple-input:focus { outline: none; border-color: #00e5ff; }

/* Anomalies Matrix */
.anomalies-editor-container { background: #252525; padding: 8px; border-radius: 4px; border: 1px solid #444; }
.anomaly-editor-row { display: flex; align-items: center; gap: 4px; margin-bottom: 4px; background: #2f2f2f; padding: 2px; border-radius: 4px; }
.row-handle { color: #555; cursor: grab; padding: 0 2px; }
.row-items-list { display: flex; flex-wrap: wrap; gap: 4px; flex-grow: 1; }
.add-to-row-btn { background: #333; border: 1px dashed #555; color: #777; width: 20px; height: 20px; cursor: pointer; border-radius: 2px; display: flex; align-items: center; justify-content: center; padding: 0; line-height: 1; }
.add-to-row-btn:hover { color: #ffd700; border-color: #ffd700; }
.add-effect-bar { width: 100%; background: #333; border: 1px dashed #444; color: #777; font-size: 11px; padding: 4px; cursor: pointer; margin-top: 4px; border-radius: 2px; }
.add-effect-bar:hover { border-color: #888; color: #ccc; }

.icon-wrapper { width: 28px; height: 28px; background: #3a3a3a; border: 1px solid #555; border-radius: 3px; display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; }
.icon-wrapper:hover { border-color: #999; background: #444; }
.icon-wrapper.is-editing { border-color: #ffd700; box-shadow: 0 0 0 1px #ffd700; z-index: 5; }
.mini-icon { width: 20px; height: 20px; object-fit: contain; }
.mini-stacks { position: absolute; bottom: 0; right: 0; background: rgba(0,0,0,0.8); color: #fff; font-size: 8px; padding: 0 2px; line-height: 1; }

/* Embedded Editor */
.effect-detail-editor-embedded { margin-top: 10px; background: #1f1f1f; border: 1px solid #555; border-radius: 6px; padding: 10px; position: relative; animation: fadeIn 0.2s ease; }
.editor-arrow { position: absolute; top: -6px; left: 20px; width: 10px; height: 10px; background: #1f1f1f; border-left: 1px solid #555; border-top: 1px solid #555; transform: rotate(45deg); }
.editor-header-mini { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; color: #ffd700; font-weight: bold; }
.close-btn { background: none; border: none; color: #666; font-size: 11px; cursor: pointer; text-decoration: underline; }
.editor-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
.full-width-col { grid-column: 1 / -1; }
.editor-grid label { font-size: 10px; color: #888; display: block; margin-bottom: 2px; }

.effect-select-dark { width: 100%; }
:deep(.effect-select-dark .el-input__wrapper) { background-color: #111; box-shadow: none; border: 1px solid #444; }
.opt-row { display: flex; align-items: center; gap: 6px; }
.opt-row img { width: 16px; height: 16px; }

.editor-actions { display: flex; gap: 8px; }
.action-btn { flex: 1; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 12px; border: 1px solid; background: transparent; }
.action-btn.link-style { border-color: #ffd700; color: #ffd700; }
.action-btn.link-style:hover { background: rgba(255, 215, 0, 0.1); }
.action-btn.link-style.is-linking { background: #ffd700; color: #000; }
.action-btn.delete-style { border-color: #ff4d4f; color: #ff4d4f; }
.action-btn.delete-style:hover { background: rgba(255, 77, 79, 0.1); }

/* Connections Zone */
.connection-header-group { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.main-link-btn {
  background: transparent; border: 1px dashed #ffd700; color: #ffd700;
  padding: 4px 10px; font-size: 12px; border-radius: 4px; cursor: pointer;
  transition: all 0.2s;
}
.main-link-btn:hover { background: rgba(255, 215, 0, 0.1); }
.main-link-btn.is-linking { background: #ffd700; color: #000; border-style: solid; animation: pulse 1s infinite; }

.connection-card {
  background: #222; border-left: 3px solid #666; margin-bottom: 6px; border-radius: 2px;
  padding: 6px; display: flex; flex-direction: column; gap: 4px;
}
.connection-card.outgoing { border-left-color: #ffd700; }
.connection-card.incoming { border-left-color: #00e5ff; }

.conn-vis { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #ccc; }
.node { display: flex; align-items: center; gap: 4px; width: 45%; overflow: hidden; }
.node.right { justify-content: flex-end; }
.icon-s { width: 16px; height: 16px; border: 1px solid #444; border-radius: 2px; }
.text-s { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.arrow { color: #666; font-size: 10px; }

.conn-tools { display: flex; align-items: center; gap: 6px; margin-top: 2px; padding-top: 4px; border-top: 1px solid #333; }
.consume-tag {
  font-size: 10px;
  padding: 0 8px;
  border: 1px solid #444;
  border-radius: 4px;
  color: #888;
  cursor: pointer;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: all 0.2s;
  background-color: rgba(255, 255, 255, 0.05);
}
.consume-tag.active { border-color: #ffd700; color: #ffd700; background: rgba(255,215,0,0.1); font-weight: bold; }
.offset-mini { display: flex; align-items: center; gap: 2px; font-size: 9px; color: #666; }
.spacer { flex: 1; }
.btn-del-conn { background: none; border: none; color: #555; cursor: pointer; font-size: 14px; line-height: 1; }
.btn-del-conn:hover { color: #ff4d4f; }
.empty-hint { font-size: 12px; color: #555; text-align: center; padding: 10px; font-style: italic; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
:deep(.is-rotated) { transform: rotate(90deg); transition: transform 0.2s; }
</style>