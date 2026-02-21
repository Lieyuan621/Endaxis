<script setup>
import { computed, ref, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import draggable from 'vuedraggable'
import CustomNumberInput from './CustomNumberInput.vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { useDragConnection } from '@/composables/useDragConnection.js'
import { getRectPos } from '@/utils/layoutUtils.js'
import { buildEffectBindingOptions } from '@/utils/effectBindingOptions.js'
import { useI18n } from 'vue-i18n'

const store = useTimelineStore()
const connectionHandler = useDragConnection()
const { t } = useI18n({ useScope: 'global' })
// ===================================================================================
// 1. 常量与配置
// ===================================================================================
const HIGHLIGHT_COLORS = {
  default: '#ffd700',
  red: '#ff7875',
  blue: '#00e5ff',
}

function getEffectDisplayName(type) {
  if (!type) return t('common.unknown')
  const key = `effects.name.${type}`
  const out = t(key)
  return out === key ? type : out
}

const GROUP_DEFINITIONS = computed(() => [
  { label: t('effects.group.physical'), keys: ['break', 'armor_break', 'stagger', 'knockdown', 'knockup', 'ice_shatter'] },
  { label: t('effects.group.attach'), matcher: (key) => key.endsWith('_attach') },
  { label: t('effects.group.burst'), matcher: (key) => key.endsWith('_burst') },
  { label: t('effects.group.status'), keys: ['burning', 'conductive', 'frozen', 'corrosion'] },
  { label: t('effects.group.other'), keys: ['default'] }
])

const PORT_OPTIONS = computed(() => [
  { label: t('connection.port.right'), value: 'right' },
  { label: t('connection.port.left'), value: 'left' },
  { label: t('connection.port.top'), value: 'top' },
  { label: t('connection.port.bottom'), value: 'bottom' },
  { label: t('connection.port.topRight'), value: 'top-right' },
  { label: t('connection.port.bottomRight'), value: 'bottom-right' },
  { label: t('connection.port.topLeft'), value: 'top-left' },
  { label: t('connection.port.bottomLeft'), value: 'bottom-left' },
])

function getFullTypeName(type) {
  const key = `skillType.${type}`
  const out = t(key)
  return out === key ? t('skillType.unknown') : out
}

// ===================================================================================
// 2. 核心状态计算
// ===================================================================================

const isTicksExpanded = ref(false)
const isBarsExpanded = ref(false)
const localSelectedAnomalyId = ref(null) // 用于库模式下的本地选中状态
const selectedWeaponStatus = computed(() => {
  if (!store.selectedWeaponStatusId) return null
  return store.weaponStatuses.find(s => s.id === store.selectedWeaponStatusId) || null
})
const isWeaponStatusMode = computed(() => !!selectedWeaponStatus.value)
const isSetLibraryMode = computed(() => store.selectedLibrarySource === 'set')
const activeLibraryList = computed(() => {
  if (store.selectedLibrarySource === 'weapon') return store.activeWeaponSkillLibrary
  if (store.selectedLibrarySource === 'set') return store.activeSetBonusLibrary
  return store.activeSkillLibrary
})
const isWeaponLibraryMode = computed(() => store.selectedLibrarySource === 'weapon')

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
    return activeLibraryList.value.find(s => s.id === store.selectedLibrarySkillId)
  }
  if (selectedWeaponStatus.value) {
    return selectedWeaponStatus.value
  }
  return null
})

const isLibraryMode = computed(() => {
  return !!store.selectedLibrarySkillId && !store.selectedActionId && !isWeaponStatusMode.value
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

const currentSkillType = computed(() => {
  if (isWeaponStatusMode.value) return 'weapon'
  return targetData.value?.type || 'unknown'
})

// === 统一更新函数 ===
function commitUpdate(payload) {
  if (!targetData.value) return

  if (isWeaponStatusMode.value) {
    store.updateWeaponStatus(store.selectedWeaponStatusId, payload)
    return
  }

  if (isLibraryMode.value) {
    if (isSetLibraryMode.value) {
      const category = targetData.value.setCategory
      if (!category) return
      if (payload.duration !== undefined) {
        store.updateEquipmentCategoryOverride(category, {
          setBonus: { duration: payload.duration }
        })
      }
      return
    }

    // 更新库技能 (Character/Weapon Overrides)
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

const totalStagger = computed(() => {
  if (!targetData.value || !targetData.value.damageTicks) return 0
  return targetData.value.damageTicks.reduce((acc, tick) => acc + (Number(tick.stagger) || 0), 0)
})

const totalSpGain = computed(() => {
  if (!targetData.value || !targetData.value.damageTicks) return 0
  return targetData.value.damageTicks.reduce((acc, tick) => acc + (Number(tick.sp) || 0), 0)
})

function isEditing(r, c) {
  const coords = currentSelectedCoords.value
  return coords && coords.rowIndex === r && coords.colIndex === c
}

// ===================================================================================
// 3. 技能与更新逻辑
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

function addDamageTick() {
  const currentTicks = targetData.value.damageTicks ? [...targetData.value.damageTicks] : []
  currentTicks.push({ offset: 0, stagger: 0, sp: 0, boundEffects: [] })
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

const availableEffectOptions = computed(() => {
  if (!targetData.value || !targetData.value.physicalAnomaly) return []
  const rowsRaw = targetData.value.physicalAnomaly
  if (!rowsRaw || rowsRaw.length === 0) return []
  const rows = Array.isArray(rowsRaw[0]) ? rowsRaw : [rowsRaw]

  rows.forEach(row => {
    row.forEach(effect => {
      if (!effect._id) effect._id = Math.random().toString(36).substring(2, 9)
    })
  })

  const getEffectName = (type) => {
    const key = `effects.name.${type}`
    const translated = t(key)
    if (translated !== key) return translated
    const exclusive = currentCharacter.value?.exclusive_buffs?.find(b => b.key === type)
    if (exclusive?.name) return exclusive.name
    return type || t('common.unknown')
  }

  return buildEffectBindingOptions(rowsRaw, { getEffectName })
})

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
  const availableKeys = allGlobalKeys.filter(key =>
      (allowed && allowed.includes(key)) || key === 'default'
  )

  const groups = []
  if (currentCharacter.value && currentCharacter.value.exclusive_buffs) {
    let exclusiveOpts = currentCharacter.value.exclusive_buffs.map(buff => ({
      label: `★ ${buff.name}`, value: buff.key, path: buff.path
    }))
    if (allowed && allowed.length > 0) exclusiveOpts = exclusiveOpts.filter(opt => allowed.includes(opt.value))
    if (exclusiveOpts.length > 0) groups.push({ label: t('effects.group.exclusive'), options: exclusiveOpts })
  }

  const processedKeys = new Set()
  GROUP_DEFINITIONS.value.forEach(def => {
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
          label: getEffectDisplayName(key), value: key, path: store.iconDatabase[key]
        }))
      })
    }
  })

  const remainingKeys = availableKeys.filter(k => !processedKeys.has(k))
  if (remainingKeys.length > 0) {
    groups.push({
      label: t('effects.group.other'),
      options: remainingKeys.map(key => ({
        label: getEffectDisplayName(key), value: key, path: store.iconDatabase[key]
      }))
    })
  }
  return groups
})

function getIconPath(type, charId = null) {
  if (store.iconDatabase[type]) return store.iconDatabase[type]
  const targetChar = charId
      ? store.characterRoster.find(c => c.id === charId)
      : currentCharacter.value
  if (targetChar && targetChar.exclusive_buffs) {
    const exclusive = targetChar.exclusive_buffs.find(b => b.key === type)
    if (exclusive) return exclusive.path
  }
  return store.iconDatabase['default'] || ''
}

const relevantConnections = computed(() => {
  if (isLibraryMode.value || !store.selectedActionId) return []
  const myActionWrap = store.getActionById(store.selectedActionId)
  const myCharId = myActionWrap?.trackId

  return store.connections
      .filter(c => c.from === store.selectedActionId || c.to === store.selectedActionId)
      .map(conn => {
        const isOutgoing = conn.from === store.selectedActionId
        const otherActionId = isOutgoing ? conn.to : conn.from

        const otherActionWrap = store.getActionById(otherActionId)
        const otherAction = otherActionWrap?.node
        const otherCharId = otherActionWrap?.trackId
        const otherActionName = otherAction?.name || t('common.unknownSkill')

        let myIconPath = null
        if (targetData.value) {
          const myEffectId = isOutgoing ? conn.fromEffectId : conn.toEffectId
          const myEffect = store.getEffectById(myEffectId)
          if (myEffect) {
            myIconPath = getIconPath(myEffect.node.type, myCharId)
          }
        }

        let otherIconPath = null
        if (otherAction) {
          const otherEffectId = isOutgoing ? conn.toEffectId : conn.fromEffectId
          const otherEffect = store.getEffectById(otherEffectId)
          if (otherEffect) {
            otherIconPath = getIconPath(otherEffect.node.type, otherCharId)
          }
        }

        return {
          id: conn.id,
          direction: isOutgoing ? t('connection.direction.to') : t('connection.direction.from'),
          isOutgoing,
          rawConnection: conn,
          otherActionName,
          myIconPath,
          otherIconPath
        }
      })
})

function updateConnPort(connId, type, event) {
  const val = event.target.value
  store.updateConnectionPort(connId, type, val)
}

function handleStartConnection(id, type) {
  if (connectionHandler.isDragging.value) {
    connectionHandler.cancelDrag()
    return
  }

  let rect;

  if (type === 'action') {
    const actionLayout = store.getNodeRect(id)
    rect = actionLayout.rect
  } else {
    const effectLayout = store.effectLayouts.get(id)
    rect = effectLayout.rect
  }

  if (!rect) {
    return
  }

  const point = getRectPos(rect, 'right')
  connectionHandler.newConnectionFrom(point, id, 'right')
}
</script>

<template>
  <div class="properties-panel">

    <div class="panel-header">
      <div class="header-main-row">
        <div class="left-group">
          <div class="header-icon-bar"></div>
          <h3 class="char-name">
            {{ targetData ? targetData.name : t('propertiesPanel.noSelection') }}
          </h3>
          <span v-if="targetData && isLibraryMode" class="mode-badge">{{ t('propertiesPanel.globalMode') }}</span>
        </div>

        <div class="right-group">
          <div v-if="targetData" class="skill-type-minimal">
            {{ getFullTypeName(currentSkillType) }}
          </div>
        </div>
      </div>
      <div class="header-divider"></div>
    </div>

      <div v-if="targetData" class="scrollable-content">
        <div class="section-container tech-style">
          <div class="panel-tag-mini">{{ t('propertiesPanel.sections.basic') }}</div>
          <div class="attribute-grid">
            <div class="form-group compact">
              <label>{{ t('propertiesPanel.labels.durationS') }}</label>
              <CustomNumberInput :model-value="targetData.duration" @update:model-value="val => updateActionProp('duration', val)" :step="0.1" :min="0" :activeColor="HIGHLIGHT_COLORS.default" text-align="center"/>
            </div>
            <div class="form-group compact" v-if="currentSkillType === 'link'">
              <label>{{ t('propertiesPanel.labels.cooldownS') }}</label>
              <CustomNumberInput :model-value="targetData.cooldown" @update:model-value="val => updateActionProp('cooldown', val)" :min="0" :activeColor="HIGHLIGHT_COLORS.default" text-align="center"/>
            </div>

            <div class="form-group compact" v-if="currentSkillType === 'link' && !isLibraryMode">
              <label>{{ t('propertiesPanel.labels.triggerWindowS') }}</label>
              <CustomNumberInput :model-value="targetData.triggerWindow || 0" @update:model-value="val => updateActionProp('triggerWindow', val)" :step="0.1" :border-color="HIGHLIGHT_COLORS.default" text-align="center"/>
            </div>

            <div class="form-group compact" v-if="currentSkillType === 'skill'">
              <label>{{ t('propertiesPanel.labels.spCost') }}</label>
              <CustomNumberInput :model-value="targetData.spCost" @update:model-value="val => updateActionProp('spCost', val)" :min="0" :border-color="HIGHLIGHT_COLORS.default" text-align="center"/>
            </div>

            <div class="form-group compact" v-if="currentSkillType === 'ultimate'">
              <label>{{ t('propertiesPanel.labels.gaugeCost') }}</label>
              <CustomNumberInput :model-value="targetData.gaugeCost" @update:model-value="val => updateActionProp('gaugeCost', val)" :min="0" :border-color="HIGHLIGHT_COLORS.blue" text-align="center"/>
            </div>

            <div class="form-group compact" v-if="!['execution','dodge','weapon','set'].includes(currentSkillType)">
              <label>{{ t('propertiesPanel.labels.gaugeGain') }}</label>
              <CustomNumberInput :model-value="targetData.gaugeGain" @update:model-value="val => updateActionProp('gaugeGain', val)" :min="0" :border-color="HIGHLIGHT_COLORS.blue" text-align="center"/>
            </div>

            <div class="form-group compact" v-if="currentSkillType === 'skill'">
              <label>{{ t('propertiesPanel.labels.teamGaugeGain') }}</label>
              <CustomNumberInput :model-value="targetData.teamGaugeGain" @update:model-value="val => updateActionProp('teamGaugeGain', val)" :min="0" :border-color="HIGHLIGHT_COLORS.blue" text-align="center"/>
            </div>

            <div class="form-group compact" v-if="currentSkillType === 'ultimate'">
              <label>{{ t('propertiesPanel.labels.enhancementTimeS') }}</label>
              <CustomNumberInput :model-value="targetData.enhancementTime || 0" @update:model-value="val => updateActionProp('enhancementTime', val)" :step="0.5" :min="0" activeColor="#b37feb" border-color="#b37feb" text-align="center"/></div>
          </div>
        </div>

      <div v-if="!isWeaponLibraryMode && !isWeaponStatusMode && !isSetLibraryMode && currentSkillType !== 'dodge'" class="section-container tech-style border-red" @click="isTicksExpanded = !isTicksExpanded" style="cursor: pointer;">
        <div class="panel-tag-mini red">{{ t('propertiesPanel.damage.title') }} ({{ (targetData.damageTicks || []).length }})</div>

        <div class="section-header-tech">
          <div class="module-deco">
            <span class="module-code">{{ t('propertiesPanel.damage.system') }}</span>
            <span class="module-label">{{ t('propertiesPanel.damage.stagger') }}: {{ totalStagger }} | {{ t('propertiesPanel.damage.sp') }}: {{ totalSpGain }}</span>
          </div>
          <div class="spacer"></div>
          <button class="ea-btn ea-btn--icon ea-btn--icon-22 ea-btn--icon-plus ea-btn--icon-plus-red" @click.stop="addDamageTick">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <el-icon :class="{ 'is-rotated': isTicksExpanded }" class="toggle-arrow"><ArrowRight /></el-icon>
        </div>

        <div v-if="isTicksExpanded" class="section-content-tech" @click.stop>
          <div v-if="!targetData.damageTicks || targetData.damageTicks.length === 0" class="empty-hint">{{ t('propertiesPanel.damage.empty') }}</div>
            <div v-for="(tick, index) in (targetData.damageTicks || [])" :key="index" class="tick-item red-theme">
              <div class="tick-header">
                <span class="tick-idx">HIT {{ index + 1 }}</span>
                <button type="button" class="ea-btn ea-btn--icon ea-btn--icon-18 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger" @click="removeDamageTick(index)">×</button>
              </div>
              <div class="tick-row">
                <div class="tick-col">
                  <label>{{ t('propertiesPanel.damage.tickTime') }}</label>
                  <CustomNumberInput :model-value="tick.offset" @update:model-value="val => updateDamageTick(index, 'offset', val)" :step="0.1" :min="0" border-color="#ff7875" />
                </div>
                <div class="tick-col">
                  <label>{{ t('propertiesPanel.damage.tickStagger') }}</label>
                  <CustomNumberInput :model-value="tick.stagger" @update:model-value="val => updateDamageTick(index, 'stagger', val)" :step="1" :min="0" border-color="#ff7875" text-align="center"/>
                </div>
                <div class="tick-col">
                  <label>{{ t('propertiesPanel.damage.tickSpGain') }}</label>
                  <CustomNumberInput :model-value="tick.sp || 0" @update:model-value="val => updateDamageTick(index, 'sp', val)" :step="1" :min="0" border-color="#ffd700" text-align="center"/>
                </div>
              </div>
              <div class="tick-row binding-row">
                <div class="tick-col full-width">
                  <label>{{ t('propertiesPanel.damage.bindEffects') }}</label>
                  <el-select
                      :model-value="tick.boundEffects || []"
                      @update:model-value="val => updateDamageTick(index, 'boundEffects', val)"
                      multiple
                      collapse-tags
                      collapse-tags-tooltip
                      popper-class="ea-tick-binding-popper"
                      :placeholder="t('propertiesPanel.damage.bindPlaceholder')"
                      size="small"
                      class="tick-select"
                      :disabled="availableEffectOptions.length === 0"
                  >
                    <el-option
                        v-for="opt in availableEffectOptions"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                    >
                      <div class="binding-option">
                        <img :src="getIconPath(opt.type)" class="binding-option__icon" />
                        <span class="binding-option__label">{{ opt.label }}</span>
                        <span class="binding-option__hint">{{ opt.hint }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </div>
              </div>
          </div>
        </div>
      </div>

      <div v-if="!isWeaponLibraryMode && !isWeaponStatusMode && !isSetLibraryMode" class="section-container tech-style border-blue" @click="isBarsExpanded = !isBarsExpanded" style="cursor: pointer;">
        <div class="panel-tag-mini blue">{{ t('propertiesPanel.bars.title') }} ({{ customBarsList.length }})</div>

        <div class="section-header-tech">
          <div class="module-deco">
            <span class="module-code">{{ t('propertiesPanel.bars.system') }}</span>
            <span class="module-label">{{ t('propertiesPanel.bars.activeItems') }}: {{ customBarsList.length }}</span>
          </div>
          <div class="spacer"></div>
          <button class="ea-btn ea-btn--icon ea-btn--icon-22 ea-btn--icon-plus ea-btn--icon-plus-cyan" @click.stop="addCustomBar">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <el-icon :class="{ 'is-rotated': isBarsExpanded }" class="toggle-arrow"><ArrowRight /></el-icon>
        </div>

        <div v-if="isBarsExpanded" class="section-content-tech" @click.stop>
          <div v-if="customBarsList.length === 0" class="empty-hint">{{ t('propertiesPanel.bars.empty') }}</div>
            <div v-for="(bar, index) in customBarsList" :key="index" class="tick-item blue-theme">
              <div class="tick-header">
                <input type="text" :value="bar.text" @input="e => updateCustomBarItem(index, 'text', e.target.value)" :placeholder="t('propertiesPanel.bars.namePlaceholder')" class="simple-input">
                <button type="button" class="ea-btn ea-btn--icon ea-btn--icon-18 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger" @click="removeCustomBar(index)">×</button>
              </div>
              <div class="tick-row">
                <div class="tick-col">
                  <label>{{ t('propertiesPanel.bars.offsetS') }}</label>
                  <CustomNumberInput :model-value="bar.offset" @update:model-value="val => updateCustomBarItem(index, 'offset', val)" :step="0.1" :min="0" border-color="#00e5ff" />
                </div>
                <div class="tick-col">
                  <label>{{ t('propertiesPanel.bars.durationS') }}</label>
                  <CustomNumberInput :model-value="bar.duration" @update:model-value="val => updateCustomBarItem(index, 'duration', val)" :step="0.5" :min="0" border-color="#00e5ff" />
                </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!isWeaponLibraryMode && !isWeaponStatusMode && !isSetLibraryMode && currentSkillType !== 'dodge'" class="section-container tech-style">
        <div class="panel-tag-mini">{{ t('propertiesPanel.effects.title') }}</div>
        <div class="anomalies-editor-container" style="background: transparent; border-color: rgba(255,255,255,0.1); margin-top: 10px;">
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
                <button class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--icon-plus" @click="addEffectToRow(rowIndex)" :title="t('propertiesPanel.effects.addEffect')">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            </template>
          </draggable>
          <button class="add-effect-bar" @click="addRow">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>{{ t('propertiesPanel.effects.addRow') }}</span>
          </button>
        </div>

        <div v-if="editingEffectData && currentSelectedCoords" class="effect-detail-editor-embedded">
          <div class="editor-arrow"></div>
          <div class="editor-header-mini">
            <div class="header-tag"></div>
            <span>{{ t('propertiesPanel.effects.editing', { row: currentSelectedCoords.rowIndex + 1, col: currentSelectedCoords.colIndex + 1 }) }}</span>
            <div class="spacer"></div>
            <button class="close-btn" @click="isLibraryMode ? (localSelectedAnomalyId = null) : store.setSelectedAnomalyId(null)">{{ t('common.close') }}</button>
          </div>

          <div class="editor-grid">
            <div class="full-width-col">
              <label>{{ t('common.type') }}</label>
              <el-select :model-value="editingEffectData.type" @update:model-value="(val) => updateEffectProp('type', val)" :placeholder="t('propertiesPanel.effects.selectPlaceholder')" filterable size="small" class="effect-select-dark">
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
              <label>{{ t('common.triggerTime') }}</label>
              <CustomNumberInput :model-value="editingEffectData.offset || 0" @update:model-value="val => updateEffectProp('offset', val)" :step="0.1" :min="0" :activeColor="HIGHLIGHT_COLORS.default"/>
            </div>
            <div>
              <label>{{ t('common.stacks') }}</label>
              <CustomNumberInput :model-value="editingEffectData.stacks" @update:model-value="val => updateEffectProp('stacks', val)" :min="1" :activeColor="HIGHLIGHT_COLORS.default"/>
            </div>
            <div>
              <label>{{ t('common.duration') }}</label>
              <CustomNumberInput :model-value="editingEffectData.duration" @update:model-value="val => updateEffectProp('duration', val)" :min="0" :step="0.5" :activeColor="HIGHLIGHT_COLORS.default"/>
            </div>
          </div>

          <div class="editor-actions">
            <button v-if="!isLibraryMode" class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-gold ea-btn--glass-rect-accent" @click.stop="handleStartConnection(activeAnomalyId, 'effect')"
                    :class="{ 'is-linking': connectionHandler.isDragging.value && connectionHandler.state.value.sourceId === activeAnomalyId }">
              {{ t('connection.connect') }}
            </button>
            <button class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger" @click="removeEffect(currentSelectedCoords.rowIndex, currentSelectedCoords.colIndex)">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>

      <div v-if="!isLibraryMode && !isWeaponLibraryMode && !isWeaponStatusMode" class="section-container tech-style">
        <div class="panel-tag-mini">{{ t('propertiesPanel.connections.title') }}</div>

        <div class="connection-header-group">
          <div class="link-ctrl-deco">
            <div class="ctrl-bar"></div>
            <div class="ctrl-info">
              <span class="ctrl-label">{{ t('propertiesPanel.connections.system') }}</span>
              <span class="ctrl-count">{{ t('propertiesPanel.connections.currentCount') }}: {{ relevantConnections.length }}</span>
            </div>
          </div>

          <div class="spacer"></div>

          <button class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-gold ea-btn--glass-rect-accent" @click.stop="handleStartConnection(store.selectedActionId, 'action')" :class="{ 'is-linking': connectionHandler.isDragging.value && connectionHandler.state.value.sourceId === store.selectedActionId }">
            <span class="plus-icon"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span>
            {{ (connectionHandler.isDragging.value) ? t('propertiesPanel.connections.chooseTarget') : t('propertiesPanel.connections.new') }}
          </button>
        </div>

        <div v-if="relevantConnections.length === 0" class="empty-hint">{{ t('propertiesPanel.connections.empty') }}</div>

        <div class="connections-list">
          <div v-for="conn in relevantConnections" :key="conn.id" class="connection-card"
               :class="{ 'outgoing': conn.isOutgoing, 'incoming': !conn.isOutgoing }">

            <div class="conn-vis">
              <div class="node">
                <img v-if="conn.isOutgoing ? conn.myIconPath : conn.otherIconPath" :src="conn.isOutgoing ? conn.myIconPath : conn.otherIconPath" class="icon-s"/>
                <span class="text-s">{{ conn.isOutgoing ? (targetData.name || t('propertiesPanel.connections.thisSkill')) : conn.otherActionName }}</span>
              </div>
              <div class="direction-tag" :class="conn.isOutgoing ? 'to' : 'from'">
                {{ conn.direction }}
              </div>
              <div class="node right">
                <span class="text-s">{{ conn.isOutgoing ? conn.otherActionName : (targetData.name || t('propertiesPanel.connections.thisSkill')) }}</span>
                <img v-if="conn.isOutgoing ? conn.otherIconPath : conn.myIconPath" :src="conn.isOutgoing ? conn.otherIconPath : conn.myIconPath" class="icon-s"/>
              </div>
            </div>

            <div class="conn-row-ports">
              <div class="port-config">
                <div class="port-select-wrapper">
                  <span class="port-label">{{ t('propertiesPanel.connections.outPort') }}</span>
                  <select class="mini-select" :value="conn.rawConnection.sourcePort || 'right'" @change="(e) => updateConnPort(conn.id, 'source', e)">
                    <option v-for="opt in PORT_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
                <span class="port-arrow">>></span>
                <div class="port-select-wrapper">
                  <span class="port-label">{{ t('propertiesPanel.connections.inPort') }}</span>
                  <select class="mini-select" :value="conn.rawConnection.targetPort || 'left'" @change="(e) => updateConnPort(conn.id, 'target', e)">
                    <option v-for="opt in PORT_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="conn-row-actions">
              <template v-if="conn.isOutgoing && conn.rawConnection.fromEffectIndex != null">
                <div class="ea-btn ea-btn--glass-rect ea-btn--glass-rect-tag ea-btn--accent-gold ea-btn--glass-rect-hover-accent"
                 :class="{ 'active': conn.rawConnection.isConsumption }"
                 @click="store.updateConnection(conn.id, { isConsumption: !conn.rawConnection.isConsumption })">
                  {{ conn.rawConnection.isConsumption ? t('propertiesPanel.connections.consumed') : t('propertiesPanel.connections.consume') }}
                </div>

                <div v-if="conn.rawConnection.isConsumption" class="offset-mini">
                  <span style="color: #666; font-size: 10px; margin-right: 2px; white-space: nowrap;">{{ t('propertiesPanel.connections.offset') }}</span>
                  <CustomNumberInput
                      :model-value="conn.rawConnection.consumptionOffset || 0"
                      @update:model-value="val => store.updateConnection(conn.id, { consumptionOffset: val })"
                      :step="0.1"
                      :min="-10"
                      :max="10"
                      active-color="#ffd700"
                      style="width: 50px;"
                  />
                </div>
              </template>

              <div class="spacer"></div>
              <button class="ea-btn ea-btn--icon ea-btn--icon-18 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger" @click="store.removeConnection(conn.id)">×</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Base & Layout */
.properties-panel { padding: 15px; background-color: #252525; display: flex; flex-direction: column; gap: 15px; height: 100%; box-sizing: border-box; overflow-y: auto; font-size: 13px; color: #e0e0e0; transition: background-color 0.3s ease; scrollbar-width: none; -ms-overflow-style: none; }
.properties-panel::-webkit-scrollbar { display: none; }
.panel-header { display: flex; flex-direction: column; gap: 4px; margin-bottom: 0; }
.header-main-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; overflow: hidden; }
.left-group { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.header-icon-bar { width: 4px; height: 18px; background-color: #ffd700; }
.char-name { margin: 0; color: #fff; font-size: 18px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mode-badge { font-size: 10px; color: #888; background: #333; padding: 1px 4px; border-radius: 2px; }
.skill-type-minimal { font-size: 11px; color: #666; background: rgba(255, 255, 255, 0.05); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); letter-spacing: 1px; }
.mode-badge, .skill-type-minimal { flex-shrink: 0; white-space: nowrap; }
.header-divider { height: 2px; background: linear-gradient(90deg, #ffd700 0%, transparent 100%); opacity: 0.3; margin-top: 3px; }

/* Sections */
.section-container { margin-bottom: 0; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 4px; overflow: hidden; backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); }
.section-container.tech-style { background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-left: 3px solid rgba(255, 255, 255, 0.2); padding: 12px; position: relative; overflow: visible !important; flex-shrink: 0; margin-top: 12px !important; }
.section-container.tech-style.border-red { border-left-color: #ff7875 !important; }
.section-container.tech-style.border-blue { border-left-color: #00e5ff !important; }
.section-container.tech-style::before { content: ""; position: absolute; bottom: 4px; right: 4px; width: 10px; height: 10px; border-right: 1px solid rgba(255,255,255,0.3); border-bottom: 1px solid rgba(255,255,255,0.3); pointer-events: none; }
.module-deco { display: flex; flex-direction: column; line-height: 1.1; opacity: 0.4; pointer-events: none; border-left: 2px solid currentColor; padding-left: 6px; margin-left: 2px; }
.module-code { font-size: 10px; font-weight: 900; font-family: 'Inter', sans-serif; color: currentColor; letter-spacing: 1px; }
.module-label { font-size: 9px; color: rgba(255, 255, 255, 0.7); transform: none; opacity: 1; margin-top: 2px; white-space: nowrap; }
.section-header-tech { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; height: 26px; padding: 0 4px; }
.panel-tag-mini { position: absolute; right: 0; top: -12px; background: #1a1a1a; border: 1px solid #444; border-bottom: none; font-size: 10px; color: #aaa; padding: 2px 10px; font-family: 'Inter', sans-serif; letter-spacing: 1px; text-transform: uppercase; clip-path: polygon(10% 0, 100% 0, 100% 100%, 0% 100%); z-index: 5; }
.panel-tag-mini.red { color: #ff7875; border-color: rgba(255, 120, 117, 0.4); }
.panel-tag-mini.blue { color: #00e5ff; border-color: rgba(0, 229, 255, 0.4); }
.toggle-arrow { color: #666; font-size: 14px; transition: transform 0.2s; }
.section-content-tech { margin-top: 10px; animation: fadeIn 0.2s ease; }
.tech-style .form-group.compact label { font-size: 11px !important; color: rgba(255, 255, 255, 0.5) !important; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px !important; font-family: 'Inter', sans-serif; display: block; }
.tech-style .attribute-grid { gap: 8px 12px !important; padding: 8px 8px !important; }
.attribute-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 10px; }
.form-group.compact label { font-size: 10px; color: #999; margin-bottom: 2px; display: block; }
.header-left label { font-size: 12px; font-weight: bold; cursor: pointer; }
.empty-hint { font-size: 12px; color: #555; text-align: center; padding: 10px; font-style: italic; }

/* Buttons & Inputs */
.simple-input { background: transparent; border: none; border-bottom: 1px solid #555; color: #ccc; width: 100%; font-size: 12px; padding: 0 0 2px 0; }
.simple-input:focus { outline: none; border-color: #00e5ff; }

/* Ticks & Anomalies List */
.tick-item { background: rgba(255, 255, 255, 0.02) !important; border: 1px solid rgba(255, 255, 255, 0.05) !important; border-left: 3px solid rgba(255, 255, 255, 0.2) !important; padding: 10px !important; margin-bottom: 10px !important; position: relative; backdrop-filter: blur(5px); transition: all 0.2s; clip-path: polygon(0 0, 100% 0, 100% 90%, 97% 100%, 0 100%); }
.tick-item.red-theme { border-left-color: #ff7875 !important; background: linear-gradient(90deg, rgba(255, 120, 117, 0.08) 0%, transparent 100%) !important; }
.tick-item.blue-theme { border-left-color: #00e5ff !important; background: linear-gradient(90deg, rgba(0, 229, 255, 0.08) 0%, transparent 100%) !important; }
.tick-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 4px; }
.tick-idx { font-size: 10px; font-weight: 900; font-family: 'Inter', monospace; letter-spacing: 1px; text-transform: uppercase; }
.tick-row { display: flex; gap: 2px; align-items: flex-end; }
.binding-row { align-items: flex-start; }
.tick-col label { font-size: 9px !important; color: rgba(255, 255, 255, 0.3) !important; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px !important; }
.tick-col.full-width { flex: 1; }
.tick-select { width: 100%; }
.binding-option { display: flex; align-items: center; gap: 8px; padding: 2px 0; }
.binding-option__icon { width: 18px; height: 18px; border-radius: 3px; object-fit: cover; background: #111; box-shadow: 0 0 0 1px rgba(255,255,255,0.08) inset; flex: 0 0 auto; }
.binding-option__label { font-size: 12px; color: #e6e6e6; }
.binding-option__hint { font-size: 11px; color: rgba(255, 255, 255, 0.35); margin-left: 4px; white-space: nowrap; opacity: 0.95; }
.anomalies-editor-container { padding: 8px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.05); }
.anomaly-editor-row { display: flex; align-items: center; gap: 4px; margin-bottom: 8px; background: rgba(255, 255, 255, 0.02); padding: 6px; border: 1px solid rgba(255, 255, 255, 0.05); border-left: 3px solid rgba(255, 255, 255, 0.15); border-radius: 2px; position: relative; transition: all 0.2s; clip-path: polygon(0 0, 100% 0, 100% 85%, 98% 100%, 0 100%); }
.anomaly-editor-row:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1); }
.row-handle { color: #555; cursor: grab; padding: 0 2px; }
.row-items-list { display: flex; flex-wrap: wrap; gap: 4px; flex-grow: 1; }
.add-effect-bar { width: 100%; background: rgba(255, 255, 255, 0.03) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; color: #888 !important; font-size: 11px !important; padding: 8px !important; margin-top: 10px; border-radius: 0 !important; cursor: pointer; transition: all 0.2s; position: relative; display: flex; align-items: center; justify-content: center; gap: 8px; }
.add-effect-bar:hover { background: rgba(255, 255, 255, 0.08) !important; color: #ccc !important; border-color: #ffd700 !important; }
.add-effect-bar::before, .add-effect-bar::after { content: ''; position: absolute; width: 4px; height: 100%; border: 1px solid rgba(255, 255, 255, 0.2); transition: all 0.2s; }
.add-effect-bar::before { left: 0; border-right: none; }
.add-effect-bar::after { right: 0; border-left: none; }
.add-effect-bar:hover::before, .add-effect-bar:hover::after { border-color: #ffd700; width: 6px; }
.icon-wrapper { width: 24px; height: 24px; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 2px; display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; transition: all 0.2s; }
.icon-wrapper:hover { border-color: rgba(255, 255, 255, 0.3); background: rgba(255, 255, 255, 0.05); }
.icon-wrapper.is-editing { border-color: #ffd700; background: rgba(255, 215, 0, 0.1); box-shadow: 0 0 8px rgba(255, 215, 0, 0.2); }
.mini-icon { width: 18px; height: 18px; object-fit: contain; }
.mini-stacks { position: absolute; bottom: 0; right: 0; background: rgba(0,0,0,0.8); color: #fff; font-size: 8px; padding: 0 2px; line-height: 1; }

/* Embedded Editor */
.effect-detail-editor-embedded { margin-top: 12px; background: rgba(30, 30, 30, 0.9) !important; border: 1px solid rgba(255, 215, 0, 0.3); padding: 12px; position: relative; animation: fadeIn 0.2s ease; backdrop-filter: blur(8px); clip-path: polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%); }
.editor-arrow { position: absolute; top: -6px; left: 24px; width: 10px; height: 10px; background: rgba(30, 30, 30, 0.9); border-left: 1px solid rgba(255, 215, 0, 0.3); border-top: 1px solid rgba(255, 215, 0, 0.3); transform: rotate(45deg); }
.editor-header-mini { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; font-size: 10px; color: #ffd700; font-weight: 800; letter-spacing: 1px; }
.header-tag { width: 3px; height: 10px; background: #ffd700; }
.close-btn { background: none; border: none; color: #666; font-size: 11px; cursor: pointer; text-decoration: underline; }
.editor-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 16px; margin-bottom: 10px; }
.full-width-col { grid-column: 1 / -1; }
.editor-grid label { font-size: 10px; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px; }
.effect-select-dark { width: 100%; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 2px; }
:deep(.effect-select-dark .el-input__wrapper) { background-color: #111; box-shadow: none; border: 1px solid #444; }
.opt-row { display: flex; align-items: center; gap: 6px; }
.opt-row img { width: 16px; height: 16px; }
.editor-actions { display: flex; gap: 8px; }
.editor-actions .ea-btn { flex: 1; }

/* Connection Cards - Optimized */
.connection-header-group { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.plus-icon { display: flex; align-items: center; }
.connections-list { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
.link-ctrl-deco { display: flex; align-items: center; gap: 8px; opacity: 0.8; flex-shrink: 0; min-width: 65px; }
.link-ctrl-deco .ctrl-bar { width: 3px; height: 20px; background: #ffd700; box-shadow: 0 0 8px rgba(255, 215, 0, 0.4); flex-shrink: 0; }
.link-ctrl-deco .ctrl-info { display: flex; flex-direction: column; line-height: 1.2; white-space: nowrap; }
.link-ctrl-deco .ctrl-label { font-size: 11px; font-weight: 900; color: #fff; letter-spacing: 1px; display: block; width: 100%; }
.link-ctrl-deco .ctrl-count { font-size: 9px; color: #ffd700; font-family: 'Roboto Mono', monospace; margin-top: 1px; display: block; }
.connection-card { background: linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%) !important; border: 1px solid rgba(255, 255, 255, 0.05); border-left: 3px solid #666; padding: 10px; position: relative; backdrop-filter: blur(5px); clip-path: polygon(0 0, 100% 0, 100% 90%, 97% 100%, 0 100%); transition: all 0.2s; }
.connection-card:hover { background: rgba(255, 255, 255, 0.06) !important; border-color: rgba(255, 255, 255, 0.1); }
.connection-card.outgoing { border-left-color: #ffd700 !important; }
.connection-card.incoming { border-left-color: #00e5ff !important; }
.conn-vis { display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; }
.direction-tag { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 10px; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.5px; min-width: 40px; text-align: center; opacity: 0.8; border: 1px solid transparent; }
.direction-tag.to { color: #ffd700; background: rgba(255, 215, 0, 0.1); border-color: rgba(255, 215, 0, 0.2); }
.direction-tag.from { color: #00e5ff; background: rgba(0, 229, 255, 0.1); border-color: rgba(0, 229, 255, 0.2); }
.node { display: flex; align-items: center; gap: 6px; width: 38% !important; overflow: hidden; }
.node.right { justify-content: flex-end; }
.node.right .text-s { text-align: right; margin-right: 0; }
.text-s { font-size: 11px; color: #eee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-grow: 1; min-width: 0; }
.icon-s { width: 16px; height: 16px; border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; }

/* Connection Tools Rows */
.conn-row-ports { padding: 4px 0 2px 0; display: flex; justify-content: center; }
.conn-row-actions { display: flex; align-items: center; gap: 4px; height: 24px; margin-top: 2px; }
.port-config { display: flex; align-items: center; gap: 12px; background: rgba(0, 0, 0, 0.4) !important; padding: 2px 10px !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; border-radius: 12px; width: fit-content; }
.port-select-wrapper { display: flex; align-items: center; gap: 4px; }
.mini-select { font-family: 'Inter', sans-serif; font-weight: bold; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; }
.port-label { font-size: 9px; color: #666; font-weight: bold; text-transform: uppercase; }
.mini-select { background: transparent; border: none; color: #aaa; font-size: 10px; font-weight: bold; cursor: pointer; padding: 0 2px; text-align: center; appearance: none; outline: none; transition: color 0.2s; }
.mini-select:hover { color: #ffd700; }
.mini-select option { background: #2a2a2a; color: #eee; }
.port-arrow { font-size: 8px; color: #444; letter-spacing: -1px; font-weight: bold; }
.offset-mini { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.spacer { flex: 1; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
:deep(.is-rotated) { transform: rotate(90deg); transition: transform 0.2s; }
</style>