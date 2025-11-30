<script setup>
import { computed, ref } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import draggable from 'vuedraggable'

const store = useTimelineStore()

const EFFECT_NAMES = {
  "break": "破防", "armor_break": "碎甲", "stagger": "猛击", "knockdown": "倒地", "knockup": "击飞",
  "blaze_attach": "灼热附着", "emag_attach": "电磁附着", "cold_attach": "寒冷附着", "nature_attach": "自然附着",
  "blaze_burst": "灼热爆发", "emag_burst": "电磁爆发", "cold_burst": "寒冷爆发", "nature_burst": "自然爆发",
  "burning": "燃烧", "conductive": "导电", "frozen": "冻结", "ice_shatter": "碎冰", "corrosion": "腐蚀",
  "consumed": "被消耗",
  "logic_tick": "分段判定",
  "default": "默认图标"
}

const GROUP_DEFINITIONS = [
  { label: ' 物理异常 ', keys: ['break', 'armor_break', 'stagger', 'knockdown', 'knockup', 'ice_shatter'] },
  { label: ' 元素附着', matcher: (key) => key.endsWith('_attach') },
  { label: ' 元素爆发', matcher: (key) => key.endsWith('_burst') },
  { label: ' 异常状态 ', keys: ['burning', 'conductive', 'frozen', 'corrosion'] },
  { label: ' 其他', keys: ['default', 'consumed', 'logic_tick'] }
]

const editingIndexObj = ref(null)

const selectedLibrarySkill = computed(() => {
  if (!store.selectedLibrarySkillId) return null
  return store.activeSkillLibrary.find(s => s.id === store.selectedLibrarySkillId)
})

const selectedAction = computed(() => {
  if (!store.selectedActionId) return null
  for (const track of store.tracks) {
    const found = track.actions.find(a => a.instanceId === store.selectedActionId)
    if (found) return found
  }
  return null
})

const currentCharacter = computed(() => {
  if (!selectedAction.value) return null;
  const track = store.tracks.find(t => t.actions.some(a => a.instanceId === store.selectedActionId));
  if (!track) return null;
  return store.characterRoster.find(c => c.id === track.id);
})

const currentSkillType = computed(() => {
  if (selectedLibrarySkill.value) return selectedLibrarySkill.value.type;
  if (selectedAction.value) return selectedAction.value.type;
  return 'unknown';
});

const anomalyRows = computed({
  get: () => selectedAction.value?.physicalAnomaly || [],
  set: (val) => store.updateAction(store.selectedActionId, {physicalAnomaly: val})
})
function isEditing(r, c) { return editingIndexObj.value && editingIndexObj.value.r === r && editingIndexObj.value.c === c }
const editingEffectData = computed(() => {
  if (!editingIndexObj.value) return null
  const {r, c} = editingIndexObj.value
  return anomalyRows.value[r]?.[c]
})
const currentFlatIndex = computed(() => {
  if (!editingIndexObj.value) return null
  const {r, c} = editingIndexObj.value
  let flatIndex = 0
  for (let i = 0; i < r; i++) { if (anomalyRows.value[i]) flatIndex += anomalyRows.value[i].length }
  flatIndex += c
  return flatIndex
})
function updateEffectProp(key, value) {
  if (!editingIndexObj.value) return
  const {r, c} = editingIndexObj.value
  const rows = JSON.parse(JSON.stringify(anomalyRows.value))
  if (rows[r] && rows[r][c]) {
    rows[r][c][key] = value
    store.updateAction(store.selectedActionId, {physicalAnomaly: rows})
  }
}
function addRow() {
  const rows = JSON.parse(JSON.stringify(anomalyRows.value))
  rows.push([{type: 'default', stacks: 1, duration: 0}])
  store.updateAction(store.selectedActionId, {physicalAnomaly: rows})
  editingIndexObj.value = {r: rows.length - 1, c: 0}
}
function addEffectToRow(rowIndex) {
  const rows = JSON.parse(JSON.stringify(anomalyRows.value))
  rows[rowIndex].push({type: 'default', stacks: 1, duration: 0})
  store.updateAction(store.selectedActionId, {physicalAnomaly: rows})
  editingIndexObj.value = {r: rowIndex, c: rows[rowIndex].length - 1}
}
function removeEffect(r, c) {
  store.removeAnomaly(store.selectedActionId, r, c);
  editingIndexObj.value = null;
}

// 【新增】获取和更新行延迟
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

const iconOptions = computed(() => {
  const allGlobalKeys = Object.keys(store.iconDatabase);
  const allowed = selectedAction.value?.allowedTypes;
  const availableKeys = (allowed && allowed.length > 0) ? allGlobalKeys.filter(key => allowed.includes(key) || key === 'default' || key === 'consumed' || key === 'logic_tick') : allGlobalKeys;
  const groups = [];
  if (currentCharacter.value && currentCharacter.value.exclusive_buffs) {
    let exclusiveOpts = currentCharacter.value.exclusive_buffs.map(buff => ({ label: `★ ${buff.name}`, value: buff.key, path: buff.path }));
    if (allowed && allowed.length > 0) exclusiveOpts = exclusiveOpts.filter(opt => allowed.includes(opt.value));
    if (exclusiveOpts.length > 0) groups.push({label: ' 专属效果 ', options: exclusiveOpts});
  }
  const processedKeys = new Set();
  GROUP_DEFINITIONS.forEach(def => {
    const groupKeys = availableKeys.filter(key => {
      if (processedKeys.has(key)) return false;
      if (def.keys && def.keys.includes(key)) return true;
      if (def.matcher && def.matcher(key)) return true;
      return false;
    });
    if (groupKeys.length > 0) {
      groupKeys.forEach(k => processedKeys.add(k));
      groups.push({ label: def.label, options: groupKeys.map(key => ({label: EFFECT_NAMES[key] || key, value: key, path: store.iconDatabase[key]})) });
    }
  });
  const remainingKeys = availableKeys.filter(k => !processedKeys.has(k));
  if (remainingKeys.length > 0) {
    groups.push({ label: '其他', options: remainingKeys.map(key => ({label: EFFECT_NAMES[key] || key, value: key, path: store.iconDatabase[key]})) });
  }
  return groups;
})
const relevantConnections = computed(() => {
  if (!store.selectedActionId) return []
  return store.connections.filter(c => c.from === store.selectedActionId || c.to === store.selectedActionId).map(conn => {
    const isOutgoing = conn.from === store.selectedActionId
    const otherActionId = isOutgoing ? conn.to : conn.from
    let otherActionName = '未知动作';
    for (const track of store.tracks) {
      const action = track.actions.find(a => a.instanceId === otherActionId)
      if (action) { otherActionName = action.name; break; }
    }
    return {id: conn.id, direction: isOutgoing ? '连向' : '来自', otherActionName, isOutgoing}
  })
})
function getIconPath(type) {
  if (currentCharacter.value && currentCharacter.value.exclusive_buffs) {
    const exclusive = currentCharacter.value.exclusive_buffs.find(b => b.key === type);
    if (exclusive) return exclusive.path;
  }
  return store.iconDatabase[type] || store.iconDatabase['default'] || ''
}

function updateLibraryProp(key, value) {
  if (!selectedLibrarySkill.value) return
  store.updateLibrarySkill(selectedLibrarySkill.value.id, {[key]: value})
}
function updateActionProp(key, value) {
  if (!selectedAction.value) return;
  store.updateAction(store.selectedActionId, {[key]: value});
}
function updateActionGaugeWithLink(value) {
  if (!selectedAction.value) return
  store.updateAction(store.selectedActionId, { gaugeGain: value, teamGaugeGain: value * 0.5 })
}
function updateLibraryGaugeWithLink(value) {
  if (!selectedLibrarySkill.value) return
  store.updateLibrarySkill(selectedLibrarySkill.value.id, { gaugeGain: value, teamGaugeGain: value * 0.5 })
}

// ===================================================================================
// 自定义时间条多条逻辑
// ===================================================================================

const customBarsList = computed(() => {
  return selectedAction.value?.customBars || []
})

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
        <input type="number" :value="selectedAction.duration"
               @input="e => updateActionProp('duration', Number(e.target.value))" step="0.1">
      </div>
      <div class="form-group highlight-red" v-if="currentSkillType !== 'execution'">
        <label>失衡值</label>
        <input type="number" :value="selectedAction.stagger"
               @input="e => updateActionProp('stagger', Number(e.target.value))">
      </div>
      <div class="form-group" v-if="currentSkillType === 'link'">
        <label>冷却时间</label>
        <input type="number" :value="selectedAction.cooldown"
               @input="e => updateActionProp('cooldown', Number(e.target.value))">
      </div>
      <div class="form-group highlight" v-if="currentSkillType === 'link'">
        <label>触发窗口（仅为展示连携窗口）</label>
        <input type="number" :value="selectedAction.triggerWindow || 0"
               @input="e => updateActionProp('triggerWindow', Number(e.target.value))" step="0.1">
      </div>
      <div class="form-group highlight" v-if="currentSkillType === 'skill'">
        <label>技力消耗</label>
        <input type="number" :value="selectedAction.spCost"
               @input="e => updateActionProp('spCost', Number(e.target.value))">
      </div>
      <div class="form-group highlight-blue" v-if="currentSkillType === 'ultimate'">
        <label>充能消耗</label>
        <input type="number" :value="selectedAction.gaugeCost"
               @input="e => updateActionProp('gaugeCost', Number(e.target.value))">
      </div>
      <div class="form-group highlight">
        <label>技力回复</label>
        <input type="number" :value="selectedAction.spGain"
               @input="e => updateActionProp('spGain', Number(e.target.value))">
      </div>

      <div class="form-group highlight-blue" v-if="!['attack', 'execution'].includes(currentSkillType)">
        <label>自身充能</label>
        <input type="number" :value="selectedAction.gaugeGain"
               @input="e => updateActionGaugeWithLink(Number(e.target.value))">
      </div>

      <div class="form-group highlight-blue" v-if="currentSkillType === 'skill'">
        <label>队友充能</label>
        <input type="number" :value="selectedAction.teamGaugeGain"
               @input="e => updateActionProp('teamGaugeGain', Number(e.target.value))">
      </div>

      <hr class="divider"/>

      <div class="form-group highlight-cyan" style="border: 1px dashed #00e5ff; padding: 8px; border-radius: 4px; background: rgba(0, 229, 255, 0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <label style="color: #00e5ff; font-weight: bold; margin: 0;">自定义时间条</label>
          <button class="add-bar-btn" @click="addCustomBar" title="添加一条">+</button>
        </div>

        <div v-if="customBarsList.length === 0" style="color: #666; font-size: 12px; text-align: center; padding: 10px;">
          暂无时间条，点击右上角添加
        </div>

        <div v-for="(bar, index) in customBarsList" :key="index" class="custom-bar-item">
          <div class="bar-header">
            <span class="bar-index">#{{ index + 1 }}</span>
            <button class="remove-bar-btn" @click="removeCustomBar(index)">×</button>
          </div>

          <div style="margin-bottom: 6px;">
            <input type="text" :value="bar.text"
                   @input="e => updateCustomBarItem(index, 'text', e.target.value)"
                   placeholder="显示文本"
                   style="border-color: #00e5ff; width: 100%;">
          </div>

          <div style="display: flex; gap: 6px;">
            <div style="flex: 1;">
              <input type="number" :value="bar.duration"
                     @input="e => updateCustomBarItem(index, 'duration', Number(e.target.value))"
                     step="0.5" placeholder="时长"
                     style="border-color: #00e5ff; width: 100%;">
            </div>
            <div style="flex: 1;">
              <input type="number" :value="bar.offset"
                     @input="e => updateCustomBarItem(index, 'offset', Number(e.target.value))"
                     step="0.1" placeholder="偏移"
                     style="border-color: #00e5ff; width: 100%;">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="relevantConnections.length > 0" class="connections-list-area">
      <div class="info-row"><label>现有连线</label></div>
      <div v-for="conn in relevantConnections" :key="conn.id" class="connection-item"
           :class="{ 'is-outgoing': conn.isOutgoing, 'is-incoming': !conn.isOutgoing }">
        <span class="conn-icon">{{ conn.isOutgoing ? '➔' : '←' }}</span>
        <span class="conn-text">{{ conn.direction }} {{ conn.otherActionName }}</span>
        <div class="delete-conn-btn" @click="store.removeConnection(conn.id)" title="断开连线">×</div>
      </div>
    </div>

    <hr class="divider"/>

    <div class="info-row" style="margin-bottom: 5px;">
      <label>状态效果排布 (可二维拖拽)</label>
    </div>

    <div class="anomalies-editor-container">
      <draggable
          v-model="anomalyRows"
          item-key="rowIndex"
          class="rows-container"
          handle=".row-handle"
          :animation="200"
      >
        <template #item="{ element: row, index: rowIndex }">
          <div class="anomaly-editor-row">
            <div class="row-handle">⋮</div>

            <div class="row-delay-input" title="该行起始延迟 (秒)">
              <span class="delay-icon">↦</span>
              <input
                  type="number"
                  :value="getRowDelay(rowIndex)"
                  @input="e => updateRowDelay(rowIndex, Number(e.target.value))"
                  step="0.1"
                  min="0"
                  class="delay-num"
              />
            </div>

            <draggable
                :list="row"
                item-key="type"
                class="row-items-list"
                :group="{ name: 'effects' }"
                :animation="150"
                @change="() => store.updateAction(store.selectedActionId, { physicalAnomaly: anomalyRows })"
            >
              <template #item="{ element: effect, index: colIndex }">
                <div class="icon-wrapper"
                     :class="{ 'is-editing': isEditing(rowIndex, colIndex) }"
                     @click="editingIndexObj = { r: rowIndex, c: colIndex }">
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

    <div v-if="editingEffectData" class="effect-detail-editor">
      <div class="editor-header">
        <span>编辑 R{{ editingIndexObj.r + 1 }} : C{{ editingIndexObj.c + 1 }}</span>
        <button class="close-btn" @click="editingIndexObj = null">×</button>
      </div>

      <div class="form-row full-width">
        <label>类型</label>
        <el-select
            :model-value="editingEffectData.type"
            @update:model-value="(val) => updateEffectProp('type', val)"
            placeholder="选择状态" filterable size="small" class="effect-select"
        >
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
        <input type="number" :value="editingEffectData.stacks"
               @input="e => updateEffectProp('stacks', Number(e.target.value))" min="1">
      </div>
      <div class="form-row">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <label>持续(s)</label>
          <label style="font-size: 10px; color: #888; display: flex; align-items: center; gap: 4px; cursor: pointer; user-select: none;">
            <input type="checkbox" :checked="editingEffectData.hideDuration"
                   @change="e => updateEffectProp('hideDuration', e.target.checked)"
                   style="width: 12px; height: 12px; margin: 0; vertical-align: middle;">
            隐藏时长条
          </label>
        </div>
        <input type="number" :value="editingEffectData.duration"
               @input="e => updateEffectProp('duration', Number(e.target.value))" min="0" step="0.1">
      </div>

      <div class="form-row-group" style="display: flex; gap: 10px; margin-bottom: 8px;">
        <div class="form-row" style="flex: 1;">
          <label style="color: #ffd700;">技力回复</label>
          <input type="number" :value="editingEffectData.sp || 0"
                 @input="e => updateEffectProp('sp', Number(e.target.value))"
                 style="border-color: #ffd700; color: #ffd700;">
        </div>
        <div class="form-row" style="flex: 1;">
          <label style="color: #ff7875;">失衡值</label>
          <input type="number" :value="editingEffectData.stagger || 0"
                 @input="e => updateEffectProp('stagger', Number(e.target.value))"
                 style="border-color: #ff7875; color: #ff7875;">
        </div>
      </div>

      <div class="editor-footer">
        <button class="effect-link-btn"
                @click.stop="store.startLinking(currentFlatIndex)"
                :class="{ 'is-linking': store.isLinking && store.linkingEffectIndex === currentFlatIndex }">
          🔗 连线
        </button>
        <button class="delete-btn-small" @click="removeEffect(editingIndexObj.r, editingIndexObj.c)">删除此效果</button>
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
      <div class="form-group"><label>持续时间</label><input type="number" :value="selectedLibrarySkill.duration"
                                                            @input="e => updateLibraryProp('duration', Number(e.target.value))"
                                                            min="0.5" step="0.5"></div>
      <div class="form-group highlight-red" v-if="currentSkillType !== 'execution'"><label>失衡值</label><input
          type="number" :value="selectedLibrarySkill.stagger"
          @input="e => updateLibraryProp('stagger', Number(e.target.value))"></div>
      <div class="form-group" v-if="currentSkillType === 'link'"><label>冷却时间</label><input type="number"
                                                                                               :value="selectedLibrarySkill.cooldown"
                                                                                               @input="e => updateLibraryProp('cooldown', Number(e.target.value))"
                                                                                               min="0"></div>
      <div class="form-group highlight" v-if="currentSkillType === 'skill'"><label>技力消耗</label><input type="number"
                                                                                                          :value="selectedLibrarySkill.spCost"
                                                                                                          @input="e => updateLibraryProp('spCost', Number(e.target.value))"
                                                                                                          min="0"></div>
      <div class="form-group highlight-blue" v-if="currentSkillType === 'ultimate'"><label>充能消耗</label><input
          type="number" :value="selectedLibrarySkill.gaugeCost"
          @input="e => updateLibraryProp('gaugeCost', Number(e.target.value))" min="0"></div>
      <div class="form-group highlight"><label>技力回复</label><input type="number" :value="selectedLibrarySkill.spGain"
                                                                      @input="e => updateLibraryProp('spGain', Number(e.target.value))"
                                                                      min="0"></div>
      <div class="form-group highlight-blue" v-if="!['attack', 'execution'].includes(currentSkillType)">
        <label>自身充能 (联动队友)</label>
        <input type="number" :value="selectedLibrarySkill.gaugeGain"
               @input="e => updateLibraryGaugeWithLink(Number(e.target.value))" min="0">
      </div>
      <div class="form-group highlight-blue" v-if="currentSkillType === 'skill'">
        <label>队友充能</label>
        <input type="number" :value="selectedLibrarySkill.teamGaugeGain"
               @input="e => updateLibraryProp('teamGaugeGain', Number(e.target.value))">
      </div>
    </div>
  </div>

  <div v-else class="properties-panel empty">
    <p>请选中一个动作或技能</p>
  </div>
</template>

<style scoped>
/* ==========================================
   Panel Layout & Basic Elements
   ========================================== */
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

/* ==========================================
   Forms & Inputs
   ========================================== */
.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #bbb;
}

input, select {
  width: 100%;
  box-sizing: border-box;
  background: #222;
  color: white;
  border: 1px solid #555;
  padding: 6px;
  border-radius: 4px;
}

input:focus, select:focus {
  border-color: #ffd700;
  outline: none;
}

.highlight input {
  border-color: #ffd700;
  color: #ffd700;
}

.highlight-blue input {
  border-color: #00e5ff;
  color: #00e5ff;
}

.highlight-red input {
  border-color: #ff7875;
  color: #ff7875;
}

/* ==========================================
   Buttons & Interactions
   ========================================== */
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

/* ==========================================
   Anomalies Grid Editor
   ========================================== */
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

/* ==========================================
   Effect Detail Editor
   ========================================== */
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

.form-row input, .form-row select {
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

/* ==========================================
   Connection List
   ========================================== */
.connection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #3a3a3a;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 5px;
  border-left: 3px solid transparent;
}

.connection-item.is-outgoing {
  border-left-color: #ffd700;
}

.connection-item.is-incoming {
  border-left-color: #00e5ff;
}

/* ==========================================
   Library Mode & Misc
   ========================================== */
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
.add-bar-btn:hover { background: #fff; }

.custom-bar-item {
  background: rgba(0, 0, 0, 0.3);
  padding: 6px;
  border-radius: 4px;
  margin-bottom: 8px;
  border-left: 2px solid #00e5ff;
}

.bar-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;
}
.bar-index { font-size: 10px; color: #00e5ff; font-family: monospace; }

.remove-bar-btn {
  background: none; border: none; color: #666; cursor: pointer; font-size: 14px; padding: 0; line-height: 1;
}
.remove-bar-btn:hover { color: #ff7875; }

.row-delay-input {
  display: flex;
  align-items: center;
  margin-right: 6px;
  background: #222;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 0 2px;
  height: 22px;
}

.delay-icon {
  color: #888;
  font-size: 10px;
  margin-right: 2px;
  user-select: none;
}

.delay-num {
  width: 30px !important;
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: 100% !important;
  font-size: 11px !important;
  text-align: center;
  color: #ffd700 !important;
}

.delay-num:focus {
  outline: none;
}

/* Chrome/Safari 隐藏 number input 的上下箭头，保持界面整洁 */
.delay-num::-webkit-outer-spin-button,
.delay-num::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>