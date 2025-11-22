<script setup>
import { computed, ref } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import draggable from 'vuedraggable'

const store = useTimelineStore()

// UI 显示用的中文映射 (保留在此，因为只用于显示)
const EFFECT_NAMES = {
  "break": "破防", "armor_break": "碎甲", "stagger": "猛击", "knockdown": "倒地", "knockup": "击飞",
  "blaze_attach": "灼热附着", "emag_attach": "电磁附着", "cold_attach": "寒冷附着", "nature_attach": "自然附着",
  "blaze_burst": "灼热爆发", "emag_burst": "电磁爆发", "cold_burst": "寒冷爆发", "nature_burst": "自然爆发",
  "burning": "燃烧", "conductive": "导电", "frozen": "冻结", "ice_shatter": "碎冰", "corrosion": "腐蚀",
  "default": "默认图标"
}

const GROUP_DEFINITIONS = [
  {
    label: ' 物理异常 ',
    keys: ['break', 'armor_break', 'stagger', 'knockdown', 'knockup', 'ice_shatter']
  },
  {
    label: ' 元素附着',
    matcher: (key) => key.endsWith('_attach')
  },
  {
    label: ' 元素爆发',
    matcher: (key) => key.endsWith('_burst')
  },
  {
    label: ' 异常状态 ',
    keys: ['burning', 'conductive', 'frozen', 'corrosion']
  },
  {
    label: ' 其他',
    keys: ['default']
  }
]

const editingEffectIndex = ref(null)

// ===================================================================================
// 1. 选中对象获取 (Selection Logic)
// ===================================================================================

// 模式 A: 技能库模式 (选中了左侧图标)
const selectedLibrarySkill = computed(() => {
  if (!store.selectedLibrarySkillId) return null
  return store.activeSkillLibrary.find(s => s.id === store.selectedLibrarySkillId)
})

// 模式 B: 动作实例模式 (选中了时间轴上的块)
const selectedAction = computed(() => {
  if (!store.selectedActionId) return null
  for (const track of store.tracks) {
    const found = track.actions.find(a => a.instanceId === store.selectedActionId)
    if (found) return found
  }
  return null
})

// 获取当前选中动作所属的干员 (用于读取专属 Buff)
const currentCharacter = computed(() => {
  if (!selectedAction.value) return null;
  // 反查轨道
  const track = store.tracks.find(t => t.actions.some(a => a.instanceId === store.selectedActionId));
  if (!track) return null;
  return store.characterRoster.find(c => c.id === track.id);
})

// 辅助：判断当前技能类型 (用于 v-if 控制表单显隐)
const currentSkillType = computed(() => {
  if (selectedLibrarySkill.value) return selectedLibrarySkill.value.type;
  if (selectedAction.value) return selectedAction.value.type;
  return 'unknown';
});

// ===================================================================================
// 2. 数据源准备 (Data Preparation)
// ===================================================================================

// 构建图标下拉框选项 (全局图标 + 专属图标)
const iconOptions = computed(() => {
  const allGlobalKeys = Object.keys(store.iconDatabase);
  const allowed = selectedAction.value?.allowedTypes;

  // 1. 预处理：筛选出当前允许显示的 Key
  const availableKeys = (allowed && allowed.length > 0)
      ? allGlobalKeys.filter(key => allowed.includes(key) || key === 'default')
      : allGlobalKeys;

  // 2. 构建分组数据
  const groups = [];

  // --- A. 专属 Buff 组 (优先级最高) ---
  if (currentCharacter.value && currentCharacter.value.exclusive_buffs) {
    let exclusiveOpts = currentCharacter.value.exclusive_buffs.map(buff => ({
      label: `★ ${buff.name}`,
      value: buff.key,
      path: buff.path
    }));
    // 再次过滤 allowed
    if (allowed && allowed.length > 0) {
      exclusiveOpts = exclusiveOpts.filter(opt => allowed.includes(opt.value));
    }
    if (exclusiveOpts.length > 0) {
      groups.push({ label: ' 专属效果 ', options: exclusiveOpts });
    }
  }

  // --- B. 全局分组 ---
  // 用于记录已处理的 Key，避免重复
  const processedKeys = new Set();

  GROUP_DEFINITIONS.forEach(def => {
    // 找出符合当前分组规则且在 availableKeys 里的 Key
    const groupKeys = availableKeys.filter(key => {
      if (processedKeys.has(key)) return false;
      if (def.keys && def.keys.includes(key)) return true;
      if (def.matcher && def.matcher(key)) return true;
      return false;
    });

    if (groupKeys.length > 0) {
      // 标记已处理
      groupKeys.forEach(k => processedKeys.add(k));

      //以此构建选项
      groups.push({
        label: def.label,
        options: groupKeys.map(key => ({
          label: EFFECT_NAMES[key] || key,
          value: key,
          path: store.iconDatabase[key]
        }))
      });
    }
  });

  // --- C. 兜底 (如果有漏网之鱼) ---
  const remainingKeys = availableKeys.filter(k => !processedKeys.has(k));
  if (remainingKeys.length > 0) {
    groups.push({
      label: '其他',
      options: remainingKeys.map(key => ({
        label: EFFECT_NAMES[key] || key,
        value: key,
        path: store.iconDatabase[key]
      }))
    });
  }

  return groups;
})

// 计算相关连线 (用于显示列表和删除)
const relevantConnections = computed(() => {
  if (!store.selectedActionId) return []

  // 筛选出与当前动作有关的线
  return store.connections
      .filter(c => c.from === store.selectedActionId || c.to === store.selectedActionId)
      .map(conn => {
        const isOutgoing = conn.from === store.selectedActionId
        const otherActionId = isOutgoing ? conn.to : conn.from

        // 查找对方动作的名称 (用于显示)
        let otherActionName = '未知动作';
        for (const track of store.tracks) {
          const action = track.actions.find(a => a.instanceId === otherActionId)
          if (action) { otherActionName = action.name; break; }
        }

        return {
          id: conn.id,
          direction: isOutgoing ? '连向' : '来自',
          otherActionName,
          isOutgoing
        }
      })
})

// 获取图标路径工具
function getIconPath(type) {
  if (currentCharacter.value && currentCharacter.value.exclusive_buffs) {
    const exclusive = currentCharacter.value.exclusive_buffs.find(b => b.key === type);
    if (exclusive) return exclusive.path;
  }
  return store.iconDatabase[type] || store.iconDatabase['default'] || ''
}

// ===================================================================================
// 3. 更新操作 (Actions)
// ===================================================================================

// 库模式更新
function updateLibraryProp(key, value) {
  if (!selectedLibrarySkill.value) return
  store.updateLibrarySkill(selectedLibrarySkill.value.id, { [key]: value })
}

// 实例模式更新
function updateActionProp(key, value) {
  if (!selectedAction.value) return;
  store.updateAction(store.selectedActionId, { [key]: value });
}

// 异常状态列表更新 (用于 v-model)
const anomalyList = computed({
  get: () => selectedAction.value?.physicalAnomaly || [],
  set: (val) => store.updateAction(store.selectedActionId, { physicalAnomaly: val })
})

function updateEffectProp(index, key, value) {
  const list = [...selectedAction.value.physicalAnomaly];
  list[index][key] = value;
  store.updateAction(store.selectedActionId, { physicalAnomaly: list })
}

function addEffect() {
  const list = [...(selectedAction.value.physicalAnomaly || [])];
  list.push({ type: 'default', stacks: 1, duration: 0 });
  store.updateAction(store.selectedActionId, { physicalAnomaly: list });
  // 自动选中新添加的项进行编辑
  editingEffectIndex.value = list.length - 1;
}

function removeEffect(index) {
  const list = [...selectedAction.value.physicalAnomaly];
  list.splice(index, 1);
  store.updateAction(store.selectedActionId, { physicalAnomaly: list });
  if (editingEffectIndex.value === index) editingEffectIndex.value = null;
}
</script>

<template>
  <div v-if="selectedAction" class="properties-panel">
    <h3 class="panel-title">动作实例编辑</h3>
    <div class="type-tag">{{ selectedAction.name }} ({{ currentSkillType }})</div>

    <button class="link-btn" @click.stop="store.startLinking()" :class="{ 'is-linking': store.isLinking && store.linkingEffectIndex === null }">
      {{ (store.isLinking && store.linkingEffectIndex === null) ? '请点击目标动作块...' : '🔗 建立连线' }}
    </button>

    <div class="attribute-editor">
      <div class="form-group">
        <label>持续时间</label>
        <input type="number" :value="selectedAction.duration" @input="e => updateActionProp('duration', Number(e.target.value))" step="0.1">
      </div>

      <div class="form-group" v-if="currentSkillType === 'link'">
        <label>冷却时间</label>
        <input type="number" :value="selectedAction.cooldown" @input="e => updateActionProp('cooldown', Number(e.target.value))">
      </div>

      <div class="form-group highlight" v-if="currentSkillType === 'skill'">
        <label>技力消耗</label>
        <input type="number" :value="selectedAction.spCost" @input="e => updateActionProp('spCost', Number(e.target.value))">
      </div>

      <div class="form-group highlight-blue" v-if="currentSkillType === 'ultimate'">
        <label>充能消耗</label>
        <input type="number" :value="selectedAction.gaugeCost" @input="e => updateActionProp('gaugeCost', Number(e.target.value))">
      </div>

      <div class="form-group highlight">
        <label>技力回复</label>
        <input type="number" :value="selectedAction.spGain" @input="e => updateActionProp('spGain', Number(e.target.value))">
      </div>

      <div class="form-group highlight-blue" v-if="!['attack', 'execution'].includes(currentSkillType)">
        <label>自身充能</label>
        <input type="number" :value="selectedAction.gaugeGain" @input="e => updateActionProp('gaugeGain', Number(e.target.value))">
      </div>

      <div class="form-group highlight-blue" v-if="currentSkillType === 'skill'">
        <label style="color: #ffd700;">队友充能</label>
        <input type="number" :value="selectedAction.teamGaugeGain" @input="e => updateActionProp('teamGaugeGain', Number(e.target.value))">
      </div>
    </div>

    <div v-if="relevantConnections.length > 0" class="connections-list-area">
      <div class="info-row"><label>现有连线</label></div>
      <div v-for="conn in relevantConnections" :key="conn.id" class="connection-item" :class="{ 'is-outgoing': conn.isOutgoing, 'is-incoming': !conn.isOutgoing }">
        <span class="conn-icon">{{ conn.isOutgoing ? '➔' : '←' }}</span>
        <span class="conn-text">{{ conn.direction }} {{ conn.otherActionName }}</span>
        <div class="delete-conn-btn" @click="store.removeConnection(conn.id)" title="断开连线">×</div>
      </div>
    </div>

    <hr class="divider" />

    <div class="info-row" style="margin-bottom: 5px;">
      <label>状态效果 (可拖拽排序)</label>
    </div>

    <div class="icon-stream-container">
      <draggable v-model="anomalyList" item-key="type" class="icon-list" :animation="200" ghost-class="ghost-icon">
        <template #item="{ element, index }">
          <div class="icon-wrapper" :class="{ 'is-editing': editingEffectIndex === index }" @click="editingEffectIndex = index">
            <img :src="getIconPath(element.type)" class="mini-icon" />
            <div v-if="element.stacks > 1" class="mini-stacks">{{ element.stacks }}</div>
          </div>
        </template>
      </draggable>
    </div>

    <button class="add-effect-bar" @click="addEffect"> + 添加效果 </button>

    <div v-if="editingEffectIndex !== null && selectedAction.physicalAnomaly[editingEffectIndex]" class="effect-detail-editor">
      <div class="editor-header">
        <span>编辑 #{{ editingEffectIndex + 1 }}</span>
        <button class="close-btn" @click="editingEffectIndex = null">×</button>
      </div>
      <div class="form-row full-width">
        <label>类型</label>

        <el-select
            :model-value="selectedAction.physicalAnomaly[editingEffectIndex].type"
            @update:model-value="(val) => updateEffectProp(editingEffectIndex, 'type', val)"
            placeholder="选择状态"
            filterable
            size="small"
            class="effect-select"
        >
          <el-option-group
              v-for="group in iconOptions"
              :key="group.label"
              :label="group.label"
          >
            <el-option
                v-for="item in group.options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            >
              <div style="display: flex; align-items: center; gap: 8px;">
                <img :src="item.path" style="width: 18px; height: 18px; object-fit: contain;" />
                <span>{{ item.label }}</span>
              </div>
            </el-option>
          </el-option-group>
        </el-select>
      </div>
      <div class="form-row">
        <label>层数</label>
        <input type="number" :value="selectedAction.physicalAnomaly[editingEffectIndex].stacks" @input="e => updateEffectProp(editingEffectIndex, 'stacks', Number(e.target.value))" min="1">
      </div>
      <div class="form-row">
        <label>持续(s)</label>
        <input type="number" :value="selectedAction.physicalAnomaly[editingEffectIndex].duration" @input="e => updateEffectProp(editingEffectIndex, 'duration', Number(e.target.value))" min="0" step="0.5">
      </div>
      <div class="editor-footer">
        <button class="effect-link-btn" @click.stop="store.startLinking(editingEffectIndex)" :class="{ 'is-linking': store.isLinking && store.linkingEffectIndex === editingEffectIndex }">
          🔗 连线
        </button>
        <button class="delete-btn-small" @click="removeEffect(editingEffectIndex)">删除</button>
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
      <div class="form-group">
        <label>持续时间</label>
        <input type="number" :value="selectedLibrarySkill.duration" @input="e => updateLibraryProp('duration', Number(e.target.value))" min="0.5" step="0.5">
      </div>

      <div class="form-group" v-if="currentSkillType === 'link'">
        <label>冷却时间</label>
        <input type="number" :value="selectedLibrarySkill.cooldown" @input="e => updateLibraryProp('cooldown', Number(e.target.value))" min="0">
      </div>

      <div class="form-group highlight" v-if="currentSkillType === 'skill'">
        <label>技力消耗</label>
        <input type="number" :value="selectedLibrarySkill.spCost" @input="e => updateLibraryProp('spCost', Number(e.target.value))" min="0">
      </div>

      <div class="form-group highlight-blue" v-if="currentSkillType === 'ultimate'">
        <label>充能消耗</label>
        <input type="number" :value="selectedLibrarySkill.gaugeCost" @input="e => updateLibraryProp('gaugeCost', Number(e.target.value))" min="0">
      </div>

      <div class="form-group highlight">
        <label>技力回复</label>
        <input type="number" :value="selectedLibrarySkill.spGain" @input="e => updateLibraryProp('spGain', Number(e.target.value))" min="0">
      </div>

      <div class="form-group highlight-blue" v-if="!['attack', 'execution'].includes(currentSkillType)">
        <label>自身充能</label>
        <input type="number" :value="selectedLibrarySkill.gaugeGain" @input="e => updateLibraryProp('gaugeGain', Number(e.target.value))" min="0">
      </div>

      <div class="form-group highlight-blue" v-if="currentSkillType === 'skill'">
        <label style="color: #ffd700;">队友充能</label>
        <input type="number" :value="selectedLibrarySkill.teamGaugeGain" @input="e => updateLibraryProp('teamGaugeGain', Number(e.target.value))">
      </div>
    </div>

    <div class="info-box">
      <p>💡 提示：点击左侧相同技能块可取消选中。</p>
    </div>
  </div>

  <div v-else class="properties-panel empty">
    <p>请选中一个动作块或技能库图标</p>
  </div>
</template>

<style scoped>
.properties-panel { padding: 15px; color: #e0e0e0; background-color: #2b2b2b; height: 100%; box-sizing: border-box; overflow-y: auto; border-left: 1px solid #444; font-size: 14px; }
.attribute-editor { border: 1px solid #444; padding: 10px; border-radius: 6px; margin-bottom: 15px; background: #333; }
.panel-title { color: #ffd700; margin-top: 0; margin-bottom: 10px; }
.type-tag { font-size: 12px; color: #888; margin-bottom: 15px; font-style: italic; }

.form-group { margin-bottom: 12px; }
.form-group label { display: block; margin-bottom: 4px; font-size: 12px; color: #bbb; }
input, select { width: 100%; box-sizing: border-box; background: #222; color: white; border: 1px solid #555; padding: 6px; border-radius: 4px; }
input:focus, select:focus { border-color: #ffd700; outline: none; }

.highlight input { border-color: #ffd700; color: #ffd700; }
.highlight-blue input { border-color: #00e5ff; color: #00e5ff; }

.link-btn { width: 100%; padding: 8px; margin-bottom: 10px; background-color: #444; color: #ffd700; border: 1px solid #ffd700; border-radius: 4px; cursor: pointer; font-weight: bold; }
.link-btn:hover { background-color: #555; }
.link-btn.is-linking { background-color: #ffd700; color: #000; animation: pulse 1s infinite; }
.delete-conn-btn { cursor: pointer; color: #aaa; font-weight: bold; padding: 0 5px; } .delete-conn-btn:hover { color: #d32f2f; }
.connection-item { display: flex; justify-content: space-between; align-items: center; background-color: #3a3a3a; padding: 8px; border-radius: 4px; margin-bottom: 5px; border-left: 3px solid transparent; }
.connection-item.is-outgoing { border-left-color: #ffd700; }
.connection-item.is-incoming { border-left-color: #00e5ff; }

.info-row { display: flex; justify-content: space-between; align-items: center; color: #aaa; font-size: 12px; }

.add-effect-bar {
  width: 100%; padding: 8px; margin-top: 8px;
  background-color: #333; border: 1px dashed #666; color: #aaa;
  border-radius: 4px; cursor: pointer; transition: all 0.2s;
  font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 5px;
}
.add-effect-bar:hover { border-color: #ffd700; color: #ffd700; background-color: #3a3a3a; }

.icon-stream-container { background: #333; padding: 8px; border-radius: 6px; border: 1px solid #444; min-height: 45px; margin-top: 5px;}
.icon-list { display: flex; flex-wrap: wrap; gap: 6px; }
.icon-wrapper { position: relative; width: 36px; height: 36px; background: #444; border: 1px solid #666; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
.icon-wrapper:hover { border-color: #999; background: #555; }
.icon-wrapper.is-editing { border-color: #ffd700; background: #4a4a3a; box-shadow: 0 0 4px rgba(255, 215, 0, 0.3); }
.mini-icon { width: 24px; height: 24px; object-fit: contain; }
.mini-stacks { position: absolute; bottom: 0; right: 0; background: rgba(0,0,0,0.8); color: #fff; font-size: 9px; padding: 0 2px; line-height: 1; border-radius: 2px; }
.ghost-icon { opacity: 0.5; background: #ffd700; }

.effect-detail-editor { margin-top: 10px; background: #383838; padding: 10px; border-radius: 6px; border: 1px solid #555; animation: fadeIn 0.2s ease; }
.editor-header { display: flex; justify-content: space-between; margin-bottom: 8px; color: #ffd700; font-size: 12px; font-weight: bold; }
.close-btn { background: none; border: none; color: #888; cursor: pointer; font-size: 16px; line-height: 1; padding: 0; }
.form-row { display: flex; flex-direction: column; margin-bottom: 8px; }
.form-row.full-width { grid-column: 1 / -1; }
.form-row label { font-size: 11px; color: #999; margin-bottom: 2px; }
.form-row input, .form-row select { font-size: 12px; padding: 4px; }
.editor-footer { display: flex; gap: 8px; }
.effect-link-btn { flex-grow: 1; background: #444; border: 1px dashed #ffd700; color: #ffd700; font-size: 12px; padding: 4px; cursor: pointer; border-radius: 4px; }
.effect-link-btn.is-linking { background-color: #ffd700; color: #000; border-style: solid; animation: pulse 1s infinite; }
.delete-btn-small { background: #d32f2f; border: none; color: white; font-size: 12px; padding: 4px 10px; cursor: pointer; border-radius: 4px; }

.library-mode .attribute-editor { border-color: #4a90e2; }
.panel-desc { font-size: 12px; color: #aaa; margin-bottom: 20px; padding: 8px; background: rgba(74, 144, 226, 0.1); border-left: 2px solid #4a90e2; }
.info-box { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
.empty { display: flex; align-items: center; justify-content: center; color: #666; }
.divider { border: 0; border-top: 1px solid #444; margin: 15px 0; }

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

@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>