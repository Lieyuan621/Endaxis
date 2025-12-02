<script setup>
import { computed, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import draggable from 'vuedraggable'
import CustomNumberInput from './CustomNumberInput.vue'

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
  "logic_tick": "分段判定",
  "default": "默认图标"
}

const GROUP_DEFINITIONS = [
  { label: ' 物理异常 ', keys: ['break', 'armor_break', 'stagger', 'knockdown', 'knockup', 'ice_shatter'] },
  { label: ' 元素附着', matcher: (key) => key.endsWith('_attach') },
  { label: ' 元素爆发', matcher: (key) => key.endsWith('_burst') },
  { label: ' 异常状态 ', keys: ['burning', 'conductive', 'frozen', 'corrosion'] },
  { label: ' 其他', keys: ['default', 'logic_tick'] }
]

// ===================================================================================
// 2. 核心状态计算 (基于 Store)
// ===================================================================================

// 当前选中的技能库模板
const selectedLibrarySkill = computed(() => {
  if (!store.selectedLibrarySkillId) return null
  return store.activeSkillLibrary.find(s => s.id === store.selectedLibrarySkillId)
})

// 当前选中的时间轴动作实例
const selectedAction = computed(() => {
  if (!store.selectedActionId) return null
  for (const track of store.tracks) {
    const found = track.actions.find(a => a.instanceId === store.selectedActionId)
    if (found) return found
  }
  return null
})

// 当前动作所属干员信息
const currentCharacter = computed(() => {
  if (!selectedAction.value) return null
  const track = store.tracks.find(t => t.actions.some(a => a.instanceId === store.selectedActionId))
  if (!track) return null
  return store.characterRoster.find(c => c.id === track.id)
})

// 当前技能类型 (attack/skill/link/ultimate)
const currentSkillType = computed(() => {
  if (selectedLibrarySkill.value) return selectedLibrarySkill.value.type
  if (selectedAction.value) return selectedAction.value.type
  return 'unknown'
})

// 异常状态矩阵 (支持双向绑定以响应拖拽)
const anomalyRows = computed({
  get: () => selectedAction.value?.physicalAnomaly || [],
  set: (val) => store.updateAction(store.selectedActionId, { physicalAnomaly: val })
})

const currentSelectedCoords = computed(() => {
  if (!store.selectedActionId || !store.selectedAnomalyId) return null
  // 需要在 store 中实现 getAnomalyIndexById 方法
  return store.getAnomalyIndexById(store.selectedActionId, store.selectedAnomalyId)
})

// 获取当前正在编辑的效果数据
const editingEffectData = computed(() => {
  const coords = currentSelectedCoords.value
  if (!coords) return null
  return anomalyRows.value[coords.rowIndex]?.[coords.colIndex]
})

// 计算当前选中项的 Flat Index (用于连线定位)
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

// 判断指定格子是否处于选中状态
function isEditing(r, c) {
  const coords = currentSelectedCoords.value
  return coords && coords.rowIndex === r && coords.colIndex === c
}

// ===================================================================================
// 3. 数据操作逻辑
// ===================================================================================

function toggleEditEffect(r, c) {
  const effect = anomalyRows.value[r]?.[c]
  if (!effect) return

  // 数据兜底：确保有 ID
  if (!effect._id) effect._id = Math.random().toString(36).substring(2, 9)

  if (store.selectedAnomalyId === effect._id) {
    store.selectedAnomalyId = null
  } else {
    // 调用 store 的方法选中，它会更新 store.selectedAnomalyId
    store.selectAnomaly(store.selectedActionId, r, c)
  }
}

function updateEffectProp(key, value) {
  const coords = currentSelectedCoords.value
  if (!coords) return
  const { rowIndex, colIndex } = coords
  const rows = JSON.parse(JSON.stringify(anomalyRows.value))
  if (rows[rowIndex] && rows[rowIndex][colIndex]) {
    rows[rowIndex][colIndex][key] = value
    store.updateAction(store.selectedActionId, { physicalAnomaly: rows })
  }
}

function addRow() {
  store.addAnomalyRow(selectedAction.value, currentSkillType.value)
  // 选中新行第一个 (直接操作 Store ID)
  const newRows = selectedAction.value.physicalAnomaly
  if (newRows && newRows.length > 0) {
    const lastRowIndex = newRows.length - 1
    const newEffect = newRows[lastRowIndex][0]
    if (newEffect) store.selectedAnomalyId = newEffect._id
  }
}

function addEffectToRow(rowIndex) {
  store.addAnomalyToRow(selectedAction.value, currentSkillType.value, rowIndex)
  // 选中新添加的图标 (直接操作 Store ID)
  const row = selectedAction.value.physicalAnomaly[rowIndex]
  if (row) {
    const newEffect = row[row.length - 1]
    if (newEffect) store.selectedAnomalyId = newEffect._id
  }
}

function removeEffect(r, c) {
  store.removeAnomaly(store.selectedActionId, r, c)
  // 删除后 ID 自动失效，computed 变为 null
  store.selectedAnomalyId = null
}

function getRowDelay(rowIndex) {
  const delays = selectedAction.value?.anomalyRowDelays || []
  return delays[rowIndex] || 0
}

function updateRowDelay(rowIndex, value) {
  const currentDelays = [...(selectedAction.value?.anomalyRowDelays || [])]
  while (currentDelays.length <= rowIndex) {
    currentDelays.push(0)
  }
  currentDelays[rowIndex] = value
  store.updateAction(store.selectedActionId, { anomalyRowDelays: currentDelays })
}

// ===================================================================================
// 4. 图标与连线资源管理
// ===================================================================================

const iconOptions = computed(() => {
  const allGlobalKeys = Object.keys(store.iconDatabase)
  const allowed = selectedAction.value?.allowedTypes
  const availableKeys = (allowed && allowed.length > 0)
      ? allGlobalKeys.filter(key => allowed.includes(key) || key === 'default' || key === 'logic_tick')
      : allGlobalKeys

  const groups = []

  // 专属效果组
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

function getIconPath(type, actionContext = null) {
  if (store.iconDatabase[type]) return store.iconDatabase[type]
  if (actionContext) {
    const track = store.tracks.find(t => t.actions.some(a => a.instanceId === actionContext.instanceId))
    if (track) {
      const charInfo = store.characterRoster.find(c => c.id === track.id)
      if (charInfo?.exclusive_buffs) {
        const exclusive = charInfo.exclusive_buffs.find(b => b.key === type)
        if (exclusive?.path) return exclusive.path
      }
    }
  }
  if (currentCharacter.value && currentCharacter.value.exclusive_buffs) {
    const exclusive = currentCharacter.value.exclusive_buffs.find(b => b.key === type)
    if (exclusive) return exclusive.path
  }
  return store.iconDatabase['default'] || ''
}

// 相关连线查询逻辑
const relevantConnections = computed(() => {
  if (!store.selectedActionId) return []

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

        // 获取我方图标
        let myIconPath = null
        if (selectedAction.value) {
          const myEffectId = isOutgoing ? conn.fromEffectId : conn.toEffectId
          let realIndex = -1
          if (myEffectId) realIndex = store.findEffectIndexById(selectedAction.value, myEffectId)
          // 兜底兼容
          if (realIndex === -1) {
            const storedIdx = isOutgoing ? conn.fromEffectIndex : conn.toEffectIndex
            if (storedIdx !== null) realIndex = storedIdx
          }

          if (realIndex !== -1) {
            const allEffects = (selectedAction.value.physicalAnomaly || []).flat()
            const effect = allEffects[realIndex]
            if (effect) myIconPath = getIconPath(effect.type, selectedAction.value)
          }
        }

        // 获取对方图标
        let otherIconPath = null
        if (otherAction) {
          const otherEffectId = isOutgoing ? conn.toEffectId : conn.fromEffectId
          let realIndex = -1
          if (otherEffectId) realIndex = store.findEffectIndexById(otherAction, otherEffectId)
          // 兜底兼容
          if (realIndex === -1) {
            const storedIdx = isOutgoing ? conn.toEffectIndex : conn.fromEffectIndex
            if (storedIdx !== null) realIndex = storedIdx
          }

          if (realIndex !== -1) {
            const allEffects = (otherAction.physicalAnomaly || []).flat()
            const effect = allEffects[realIndex]
            if (effect) otherIconPath = getIconPath(effect.type, otherAction)
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

// ===================================================================================
// 5. 属性更新通用方法
// ===================================================================================

function updateLibraryProp(key, value) {
  if (!selectedLibrarySkill.value) return
  store.updateLibrarySkill(selectedLibrarySkill.value.id, { [key]: value })
}

function updateActionProp(key, value) {
  if (!selectedAction.value) return
  store.updateAction(store.selectedActionId, { [key]: value })
}

function updateActionGaugeWithLink(value) {
  if (!selectedAction.value) return
  store.updateAction(store.selectedActionId, { gaugeGain: value, teamGaugeGain: value * 0.5 })
}

function updateLibraryGaugeWithLink(value) {
  if (!selectedLibrarySkill.value) return
  store.updateLibrarySkill(selectedLibrarySkill.value.id, { gaugeGain: value, teamGaugeGain: value * 0.5 })
}

const customBarsList = computed(() => selectedAction.value?.customBars || [])

function addCustomBar() {
  const newList = [...customBarsList.value]
  newList.push({ text: '', duration: 1, offset: 0 })
  store.updateAction(store.selectedActionId, { customBars: newList })
}

function removeCustomBar(index) {
  const newList = [...customBarsList.value]
  newList.splice(index, 1)
  store.updateAction(store.selectedActionId, { customBars: newList })
}

function updateCustomBarItem(index, key, value) {
  const newList = [...customBarsList.value]
  newList[index] = { ...newList[index], [key]: value }
  store.updateAction(store.selectedActionId, { customBars: newList })
}

</script>

<template>
  <div v-if="selectedAction" class="properties-panel">
    <h3 class="panel-title">动作实例编辑</h3>
    <div class="type-tag">{{ selectedAction.name }}</div>

    <button class="link-btn" @click.stop="store.startLinking()"
            :class="{ 'is-linking': store.isLinking && store.linkingEffectIndex === null }">
      {{ (store.isLinking && store.linkingEffectIndex === null) ? '请点击目标动作块...' : '🔗 建立连线' }}
    </button>

    <div class="attribute-editor">
      <div class="form-group">
        <label>持续时间</label>
        <CustomNumberInput :model-value="selectedAction.duration"
               @update:model-value="val => updateActionProp('duration', val)" :step="0.1" :min="0" :activeColor="HIGHLIGHT_COLORS.default" text-align="left"/>
      </div>
      <div class="form-group" v-if="currentSkillType !== 'execution'">
        <label>失衡值</label>
        <CustomNumberInput :model-value="selectedAction.stagger"
               @update:model-value="val => updateActionProp('stagger', val)"
               :border-color="HIGHLIGHT_COLORS.red" text-align="left"/>
      </div>
      <div class="form-group" v-if="currentSkillType === 'link'">
        <label>冷却时间</label>
        <CustomNumberInput :model-value="selectedAction.cooldown"
               @update:model-value="val => updateActionProp('cooldown', val)" :min="0" :activeColor="HIGHLIGHT_COLORS.default" text-align="left"/>
      </div>
      <div class="form-group" v-if="currentSkillType === 'link'">
        <label>触发窗口</label>
        <CustomNumberInput :model-value="selectedAction.triggerWindow || 0"
               @update:model-value="val => updateActionProp('triggerWindow', val)" :step="0.1" :min="0"
               :border-color="HIGHLIGHT_COLORS.default" text-align="left"/>
      </div>
      <div class="form-group" v-if="currentSkillType === 'skill'">
        <label>技力消耗</label>
        <CustomNumberInput :model-value="selectedAction.spCost"
               @update:model-value="val => updateActionProp('spCost', val)" :min="0"
               :border-color="HIGHLIGHT_COLORS.default" text-align="left"/>
      </div>
      <div class="form-group" v-if="currentSkillType === 'ultimate'">
        <label>充能消耗</label>
        <CustomNumberInput :model-value="selectedAction.gaugeCost"
               @update:model-value="val => updateActionProp('gaugeCost', val)" :min="0"
               :border-color="HIGHLIGHT_COLORS.blue" text-align="left"/>
      </div>
      <div class="form-group">
        <label>技力回复</label>
        <CustomNumberInput :model-value="selectedAction.spGain"
               @update:model-value="val => updateActionProp('spGain', val)" :min="0"
               :border-color="HIGHLIGHT_COLORS.default" text-align="left"/>
      </div>
      <div class="form-group" v-if="!['attack', 'execution'].includes(currentSkillType)">
        <label>自身充能</label>
        <CustomNumberInput :model-value="selectedAction.gaugeGain"
               @update:model-value="val => updateActionGaugeWithLink(val)" :min="0"
               :border-color="HIGHLIGHT_COLORS.blue" text-align="left"/>
      </div>
      <div class="form-group" v-if="currentSkillType === 'skill'">
        <label>队友充能</label>
        <CustomNumberInput :model-value="selectedAction.teamGaugeGain"
               @update:model-value="val => updateActionProp('teamGaugeGain', val)" :min="0"
               :border-color="HIGHLIGHT_COLORS.blue" text-align="left"/>
      </div>

      <hr class="divider"/>

      <div class="form-group highlight-cyan"
           style="border: 1px dashed #00e5ff; padding: 8px; border-radius: 4px; background: rgba(0, 229, 255, 0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <label style="color: #00e5ff; font-weight: bold; margin: 0;">自定义时间条</label>
          <button class="add-bar-btn" @click="addCustomBar" title="添加一条">+</button>
        </div>
        <div v-if="customBarsList.length === 0"
             style="color: #666; font-size: 12px; text-align: center; padding: 10px;">
          暂无时间条
        </div>
        <div v-for="(bar, index) in customBarsList" :key="index" class="custom-bar-item">
          <div class="bar-header">
            <span class="bar-index">#{{ index + 1 }}</span>
            <button class="remove-bar-btn" @click="removeCustomBar(index)">×</button>
          </div>
          <div style="margin-bottom: 6px;">
            <input type="text" :value="bar.text" @input="e => updateCustomBarItem(index, 'text', e.target.value)"
                   placeholder="显示文本" style="border-color: #00e5ff; width: 100%;">
          </div>
          <div style="display: flex; gap: 6px;">
            <div style="flex: 1;">
              <CustomNumberInput :model-value="bar.duration"
                     @update:model-value="val => updateCustomBarItem(index, 'duration', val)"
                     :step="0.5" :min="0" :border-color="HIGHLIGHT_COLORS.blue" style="width: 100%;" text-align="left"/>
            </div>
            <div style="flex: 1;">
              <CustomNumberInput :model-value="bar.offset"
                     @update:model-value="val => updateCustomBarItem(index, 'offset', val)"
                     :step="0.1" :min="0" :border-color="HIGHLIGHT_COLORS.blue" style="width: 100%;" text-align="left"/>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="relevantConnections.length > 0" class="connections-list-area">
      <div class="info-row"><label>现有连线</label></div>
      <div v-for="conn in relevantConnections" :key="conn.id" class="connection-item"
           :class="{ 'is-outgoing': conn.isOutgoing, 'is-incoming': !conn.isOutgoing }">

        <div class="conn-visual-row">
          <div class="conn-node">
            <template v-if="conn.isOutgoing">
              <img v-if="conn.myIconPath" :src="conn.myIconPath" class="conn-mini-icon" title="我方状态"/>
              <span v-else class="conn-node-text">本动作</span>
            </template>
            <template v-else>
              <img v-if="conn.otherIconPath" :src="conn.otherIconPath" class="conn-mini-icon" title="来源状态"/>
              <span v-else class="conn-node-text">{{ conn.otherActionName }}</span>
            </template>
          </div>

          <div class="conn-arrow">
            <span v-if="conn.isOutgoing" style="color: #ffd700;">➔</span>
            <span v-else style="color: #00e5ff;">➔</span>
          </div>

          <div class="conn-node">
            <template v-if="conn.isOutgoing">
              <img v-if="conn.otherIconPath" :src="conn.otherIconPath" class="conn-mini-icon" title="目标状态"/>
              <span v-else class="conn-node-text">{{ conn.otherActionName }}</span>
            </template>
            <template v-else>
              <img v-if="conn.myIconPath" :src="conn.myIconPath" class="conn-mini-icon" title="我方状态"/>
              <span v-else class="conn-node-text">本动作</span>
            </template>
          </div>
        </div>

        <div class="conn-controls">
          <div v-if="conn.isOutgoing && conn.rawConnection.fromEffectIndex != null" class="consume-toggle"
               :class="{ 'is-active': conn.rawConnection.isConsumption }"
               @click="store.updateConnection(conn.id, { isConsumption: !conn.rawConnection.isConsumption })"
               title="切换：状态是否被此动作消耗？">
            <span class="toggle-icon">⚡</span>
            <span class="toggle-text">消耗</span>
          </div>

          <div v-if="conn.rawConnection.isConsumption" class="offset-input-wrapper" title="消耗提前量 (秒)">
            <span class="offset-label">提前</span>
            <CustomNumberInput
                class="mini-offset-input"
                :model-value="conn.rawConnection.consumptionOffset || 0"
                @update:model-value="val => store.updateConnection(conn.id, { consumptionOffset: val })"
                :step="0.1"
                :min="0"
                text-align="left"
            />
            <span class="offset-label">s</span>
          </div>

          <div class="delete-conn-btn" @click="store.removeConnection(conn.id)" title="断开连线">×</div>
        </div>
      </div>
    </div>

    <hr class="divider"/>

    <div class="info-row" style="margin-bottom: 5px;">
      <label>状态效果排布 (可二维拖拽)</label>
    </div>

    <div class="anomalies-editor-container">
      <draggable v-model="anomalyRows" item-key="rowIndex" class="rows-container" handle=".row-handle" :animation="200">
        <template #item="{ element: row, index: rowIndex }">
          <div class="anomaly-editor-row">
            <div class="row-handle">⋮</div>
            <div class="row-delay-input" title="该行起始延迟 (秒)">
              <CustomNumberInput
                  :model-value="getRowDelay(rowIndex)"
                  @update:model-value="val => updateRowDelay(rowIndex, val)"
                  :step="0.1"
                  :min="0"
                  class="delay-num"
                  text-align="left"
              >
                <template #prepend><span class="delay-icon">↦</span></template>
              </CustomNumberInput>
            </div>
            <draggable :list="row" item-key="_id" class="row-items-list" :group="{ name: 'effects' }" :animation="150"
                       @change="() => store.updateAction(store.selectedActionId, { physicalAnomaly: anomalyRows })">
              <template #item="{ element: effect, index: colIndex }">
                <div class="icon-wrapper" :class="{ 'is-editing': isEditing(rowIndex, colIndex) }"
                     @click="toggleEditEffect(rowIndex, colIndex)">
                  <img :src="getIconPath(effect.type)" class="mini-icon"/>
                  <div v-if="effect.stacks > 1" class="mini-stacks">{{ effect.stacks }}</div>
                </div>
              </template>
            </draggable>
            <button class="add-to-row-btn" @click="addEffectToRow(rowIndex)" title="在此行追加效果">+</button>
          </div>
        </template>
      </draggable>
      <button class="add-effect-bar" @click="addRow"> + 添加新行</button>
    </div>

    <div v-if="editingEffectData && currentSelectedCoords" class="effect-detail-editor">
      <div class="editor-header">
        <span>编辑 R{{ currentSelectedCoords.rowIndex + 1 }} : C{{ currentSelectedCoords.colIndex + 1 }}</span>
        <button class="close-btn" @click="store.selectedAnomalyId = null">×</button>
      </div>

      <div class="form-row full-width">
        <label>类型</label>
        <el-select :model-value="editingEffectData.type" @update:model-value="(val) => updateEffectProp('type', val)"
                   placeholder="选择状态" filterable size="small" class="effect-select">
          <el-option-group v-for="group in iconOptions" :key="group.label" :label="group.label">
            <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value">
              <div style="display: flex; align-items: center; gap: 8px;">
                <img :src="item.path" style="width: 18px; height: 18px; object-fit: contain;"/>
                <span>{{ item.label }}</span>
              </div>
            </el-option>
          </el-option-group>
        </el-select>
      </div>

      <div class="form-row">
        <label>层数</label>
        <CustomNumberInput :model-value="editingEffectData.stacks"
               @update:model-value="val => updateEffectProp('stacks', val)" :min="1" text-align="left"
               :activeColor="HIGHLIGHT_COLORS.default"/>
      </div>
      <div class="form-row">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <label>持续(s)</label>
          <label
              style="font-size: 10px; color: #888; display: flex; align-items: center; gap: 4px; cursor: pointer; user-select: none;">
            <input type="checkbox" :checked="editingEffectData.hideDuration"
                   @change="e => updateEffectProp('hideDuration', e.target.checked)"
                   style="width: 12px; height: 12px; margin: 0; vertical-align: middle;">
            隐藏时长条
          </label>
        </div>
        <CustomNumberInput :model-value="editingEffectData.duration"
               @update:model-value="val => updateEffectProp('duration', val)" :min="0" :step="0.1" text-align="left"
               :activeColor="HIGHLIGHT_COLORS.default"/>
      </div>

      <div class="form-row-group" style="display: flex; gap: 10px; margin-bottom: 8px;">
        <div class="form-row" style="flex: 1;">
          <label style="color: #ffd700;">技力回复</label>
          <CustomNumberInput :model-value="editingEffectData.sp || 0"
                 @update:model-value="val => updateEffectProp('sp', val)"
                 :border-color="HIGHLIGHT_COLORS.default" text-align="left"/>
        </div>
        <div class="form-row" style="flex: 1;">
          <label style="color: #ff7875;">失衡值</label>
          <CustomNumberInput :model-value="editingEffectData.stagger || 0"
                 @update:model-value="val => updateEffectProp('stagger', val)"
                 :border-color="HIGHLIGHT_COLORS.red" text-align="left"/>
        </div>
      </div>

      <div class="editor-footer">
        <button class="effect-link-btn" @click.stop="store.startLinking(currentFlatIndex)"
                :class="{ 'is-linking': store.isLinking && store.linkingEffectIndex === currentFlatIndex }">
          🔗 连线
        </button>
        <button class="delete-btn-small"
                @click="removeEffect(currentSelectedCoords.rowIndex, currentSelectedCoords.colIndex)">删除此效果
        </button>
      </div>
    </div>
  </div>

  <div v-else-if="selectedLibrarySkill" class="properties-panel library-mode">
    <h3 class="panel-title" style="color: #4a90e2;">基础数值调整</h3>
    <div class="panel-desc">
      修改 <strong>{{ selectedLibrarySkill.name }}</strong> 的基础属性。<br/>
      此修改将同步更新所有同类技能（全局生效）。
    </div>
    <div class="attribute-editor">
      <div class="form-group"><label>持续时间</label><CustomNumberInput :model-value="selectedLibrarySkill.duration"
          @update:model-value="val => updateLibraryProp('duration', val)"
          :min="0.5" :step="0.5" text-align="left"/></div>
      <div class="form-group" v-if="currentSkillType !== 'execution'"><label>失衡值</label><CustomNumberInput
          :model-value="selectedLibrarySkill.stagger"
          @update:model-value="val => updateLibraryProp('stagger', val)" :border-color="HIGHLIGHT_COLORS.red" text-align="left"/></div>
      <div class="form-group" v-if="currentSkillType === 'link'"><label>冷却时间</label><CustomNumberInput
          :model-value="selectedLibrarySkill.cooldown"
          @update:model-value="val => updateLibraryProp('cooldown', val)"
          :min="0" text-align="left"/></div>
      <div class="form-group" v-if="currentSkillType === 'skill'"><label>技力消耗</label><CustomNumberInput
          :model-value="selectedLibrarySkill.spCost"
          @update:model-value="val => updateLibraryProp('spCost', val)"
          :min="0" :border-color="HIGHLIGHT_COLORS.default" text-align="left"/></div>
      <div class="form-group" v-if="currentSkillType === 'ultimate'"><label>充能消耗</label><CustomNumberInput
          :model-value="selectedLibrarySkill.gaugeCost"
          @update:model-value="val => updateLibraryProp('gaugeCost', val)" :min="0" :border-color="HIGHLIGHT_COLORS.blue" text-align="left"/></div>
      <div class="form-group"><label>技力回复</label><CustomNumberInput :model-value="selectedLibrarySkill.spGain"
          @update:model-value="val => updateLibraryProp('spGain', val)"
          :min="0" :border-color="HIGHLIGHT_COLORS.default" text-align="left"/></div>
      <div class="form-group" v-if="!['attack', 'execution'].includes(currentSkillType)">
        <label>自身充能 (联动队友)</label>
        <CustomNumberInput :model-value="selectedLibrarySkill.gaugeGain"
               @update:model-value="val => updateLibraryGaugeWithLink(val)" :min="0" :border-color="HIGHLIGHT_COLORS.blue" text-align="left"/>
      </div>
      <div class="form-group" v-if="currentSkillType === 'skill'">
        <label>队友充能</label>
        <CustomNumberInput :model-value="selectedLibrarySkill.teamGaugeGain"
               @update:model-value="val => updateLibraryProp('teamGaugeGain', val)" :min="0" :border-color="HIGHLIGHT_COLORS.blue" text-align="left"/>
      </div>
    </div>
  </div>

  <div v-else class="properties-panel empty">
    <p>请选中一个动作或技能</p>
  </div>
</template>

<style scoped>
.properties-panel {
  padding: 15px;
  color: #e0e0e0;
  background-color: #2b2b2b;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  border-left: 1px solid #444;
  font-size: 14px;
}

.attribute-editor {
  border: 1px solid #444;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  background: #333;
}

.panel-title {
  color: #ffd700;
  margin-top: 0;
  margin-bottom: 10px;
}

.type-tag {
  font-size: 12px;
  color: #888;
  margin-bottom: 15px;
  font-style: italic;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #aaa;
  font-size: 12px;
}

.divider {
  border: 0;
  border-top: 1px solid #444;
  margin: 15px 0;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #bbb;
}

input,
select {
  width: 100%;
  box-sizing: border-box;
  background: #222;
  color: white;
  border: 1px solid #555;
  padding: 6px;
  border-radius: 4px;
}

.link-btn {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  background-color: #444;
  color: #ffd700;
  border: 1px solid #ffd700;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.link-btn:hover {
  background-color: #555;
}

.link-btn.is-linking {
  background-color: #ffd700;
  color: #000;
  animation: pulse 1s infinite;
}

.add-effect-bar {
  width: 100%;
  padding: 8px;
  margin-top: 8px;
  background-color: #333;
  border: 1px dashed #666;
  color: #aaa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.add-effect-bar:hover {
  border-color: #ffd700;
  color: #ffd700;
  background-color: #3a3a3a;
}

.delete-btn-small {
  background: #d32f2f;
  border: none;
  color: white;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 4px;
  width: 100%;
}

.delete-conn-btn {
  cursor: pointer;
  color: #aaa;
  font-weight: bold;
  padding: 0 5px;
}

.delete-conn-btn:hover {
  color: #d32f2f;
}

.anomalies-editor-container {
  background: #333;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #444;
  margin-top: 5px;
  user-select: none;
  -webkit-user-select: none;
}

.anomaly-editor-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 6px;
  background: #2a2a2a;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #444;
}

.row-handle {
  cursor: grab;
  color: #666;
  font-size: 16px;
  padding: 0 4px;
}

.row-handle:active {
  cursor: grabbing;
  color: #ffd700;
}

.row-items-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex-grow: 1;
  min-height: 24px;
  align-items: center;
}

.add-to-row-btn {
  background: #444;
  border: 1px dashed #666;
  color: #aaa;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 16px;
  font-family: sans-serif;
  padding-bottom: 2px;
  transition: all 0.2s;
}

.add-to-row-btn:hover {
  border-color: #ffd700;
  color: #ffd700;
  background: #3a3a3a;
}

.icon-wrapper {
  position: relative;
  width: 32px;
  height: 32px;
  background: #444;
  border: 1px solid #666;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-wrapper:hover {
  border-color: #999;
  background: #555;
}

.icon-wrapper.is-editing {
  border-color: #ffd700;
  background: #4a4a3a;
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.3);
}

.mini-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.mini-stacks {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 9px;
  padding: 0 2px;
  line-height: 1;
  border-radius: 2px;
}

.effect-detail-editor {
  margin-top: 10px;
  background: #383838;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #555;
  animation: fadeIn 0.2s ease;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #ffd700;
  font-size: 12px;
  font-weight: bold;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}

.form-row.full-width {
  grid-column: 1 / -1;
}

.form-row label {
  font-size: 11px;
  color: #999;
  margin-bottom: 2px;
}

.form-row input,
.form-row select {
  font-size: 12px;
  padding: 4px;
}

.editor-footer {
  display: flex;
  gap: 8px;
}

.effect-link-btn {
  flex-grow: 1;
  background: #444;
  border: 1px dashed #ffd700;
  color: #ffd700;
  font-size: 12px;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
}

.effect-link-btn.is-linking {
  background-color: #ffd700;
  color: #000;
  border-style: solid;
  animation: pulse 1s infinite;
}

.effect-select {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  background-color: #222;
  box-shadow: 0 0 0 1px #555 inset;
}

:deep(.el-select .el-input__inner) {
  color: #eee;
}

.connection-item {
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  margin-bottom: 6px;
  border-left: 2px solid #555;
  overflow: hidden;
}

.connection-item.is-outgoing {
  border-left-color: #ffd700;
}

.connection-item.is-incoming {
  border-left-color: #00e5ff;
}

.conn-visual-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
}

.conn-node {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 45%;
}

.conn-mini-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border: 1px solid #555;
  border-radius: 2px;
  background: #333;
}

.conn-node-text {
  font-size: 11px;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conn-arrow {
  font-size: 12px;
  opacity: 0.6;
}

.conn-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.1);
}

.offset-input-wrapper {
  display: flex;
  align-items: center;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0 4px;
  margin-left: 4px;
}

.offset-label {
  font-size: 10px;
  color: #888;
  user-select: none;
}

.mini-offset-input {
  width: 30px !important;
  background: transparent !important;
  border: none !important;
  color: #ffd700 !important;
  font-size: 11px !important;
  text-align: center;
  padding: 2px 0 !important;
  height: auto !important;
}

.mini-offset-input:focus {
  outline: none;
}

.consume-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  background: #222;
  border: 1px solid #444;
  color: #666;
  transition: all 0.2s;
}

.consume-toggle:hover {
  border-color: #666;
  color: #aaa;
}

.consume-toggle.is-active {
  background: rgba(255, 215, 0, 0.15);
  border-color: #ffd700;
  color: #ffd700;
  font-weight: bold;
}

.toggle-icon {
  font-size: 12px;
}

.library-mode .attribute-editor {
  border-color: #4a90e2;
}

.panel-desc {
  font-size: 12px;
  color: #aaa;
  margin-bottom: 20px;
  padding: 8px;
  background: rgba(74, 144, 226, 0.1);
  border-left: 2px solid #4a90e2;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }

  100% {
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.add-bar-btn {
  background: #00e5ff;
  color: #000;
  border: none;
  border-radius: 4px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 16px;
  padding-bottom: -2px;
}

.add-bar-btn:hover {
  background: #fff;
}

.custom-bar-item {
  background: rgba(0, 0, 0, 0.3);
  padding: 6px;
  border-radius: 4px;
  margin-bottom: 8px;
  border-left: 2px solid #00e5ff;
}

.bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.bar-index {
  font-size: 10px;
  color: #00e5ff;
  font-family: monospace;
}

.remove-bar-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;
}

.remove-bar-btn:hover {
  color: #ff7875;
}

.row-delay-input {
  display: flex;
  align-items: center;
  padding: 0 2px;
  height: 22px;
}

.delay-icon {
  color: #888;
  font-size: 10px;
  user-select: none;
}

.delay-num {
  height: 100% !important;
  font-size: 11px !important;
  color: #ffd700 !important;
}

:deep(.delay-num .value-display) {
  width: 20px !important;
  min-width: 20px !important;
  padding: 0 4px !important;
}

.delay-num:focus {
  outline: none;
}

.delay-num::-webkit-outer-spin-button,
.delay-num::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>