<script setup>
import { computed, ref, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import CustomNumberInput from './CustomNumberInput.vue'

const store = useTimelineStore()

// === 核心数据逻辑 ===
const activeTrack = computed(() => store.tracks.find(t => t.id === store.activeTrackId))
const activeCharacter = computed(() => {
  return store.characterRoster.find(c => c.id === store.activeTrackId)
})
const activeWeapon = computed(() => activeTrack.value?.weaponId ? store.getWeaponById(activeTrack.value.weaponId) : null)
const hasActiveCharacter = computed(() => !!(activeTrack.value && activeCharacter.value))
const hasAnyEquipmentEquipped = computed(() => {
  const t = activeTrack.value
  if (!t) return false
  return !!(t.equipArmorId || t.equipGlovesId || t.equipAccessory1Id || t.equipAccessory2Id)
})

const activeCharacterName = computed(() => activeCharacter.value ? activeCharacter.value.name : '未选择干员')
const activeWeaponName = computed(() => activeWeapon.value ? activeWeapon.value.name : '未装备武器')
const activeLibraryTab = ref('character')
const hasWeaponLibrary = computed(() => store.activeWeaponSkillLibrary.length > 0)
const currentLibrary = computed(() => {
  if (activeLibraryTab.value === 'weapon') return store.activeWeaponSkillLibrary
  if (activeLibraryTab.value === 'set') return store.activeSetBonusLibrary
  return store.activeSkillLibrary
})
const activeLibraryTitle = computed(() => {
  if (activeLibraryTab.value === 'weapon') return `${activeCharacterName.value} · ${activeWeaponName.value}`
  if (activeLibraryTab.value === 'set') return `${activeCharacterName.value} · 装备`
  return activeCharacterName.value
})

// 技能类型完整名称映射
const getFullTypeName = (type) => {
  const map = {
    'attack': '重击',
    'dodge': '闪避',
    'skill': '战技',
    'link': '连携',
    'ultimate': '终结技',
    'execution': '处决',
    'weapon': '武器',
    'set': '套装'
  }
  return map[type] || '技能'
}

// 图标路径
const WEAPON_ICON_MAP = {
  'sword': '/icons/icon_attack_sword.webp',
  'claym': '/icons/icon_attack_claym.webp',
  'lance': '/icons/icon_attack_lance.webp',
  'pistol': '/icons/icon_attack_pistol.webp',
  'funnel': '/icons/icon_attack_funnel.webp'
}

const currentWeaponIcon = computed(() => {
  const wType = activeCharacter.value?.weapon || 'sword'
  return WEAPON_ICON_MAP[wType] || WEAPON_ICON_MAP['sword']
})

function getSkillDisplayIcon(skill) {
  if (skill.librarySource === 'weapon') {
    return skill.icon || activeWeapon.value?.icon || ''
  }
  if (skill.librarySource === 'set') {
    return skill.icon || ''
  }
  if (['attack', 'dodge', 'execution'].includes(skill.type)) {
    return currentWeaponIcon.value
  }
  return skill.icon || ''
}

// === 充能设置逻辑 ===
const maxGaugeValue = computed({
  get: () => {
    if (!activeTrack.value) return 100
    return activeTrack.value.maxGaugeOverride || activeCharacter.value?.ultimate_gaugeMax || 100
  },
  set: (val) => {
    if (store.activeTrackId) {
      store.updateTrackMaxGauge(store.activeTrackId, val)
    }
  }
})

const initialGaugeValue = computed({
  get: () => activeTrack.value ? (activeTrack.value.initialGauge || 0) : 0,
  set: (val) => {
    if (store.activeTrackId) {
      store.updateTrackInitialGauge(store.activeTrackId, val)
    }
  }
})

const gaugeEfficiencyValue = computed({
  get: () => {
    if (!activeTrack.value) return 100;
    return activeTrack.value.gaugeEfficiency ?? 100;
  },
  set: (val) => {
    if (store.activeTrackId) {
      store.updateTrackGaugeEfficiency(store.activeTrackId, val)
    }
  }
})

const linkCdReductionValue = computed({
  get: () => {
    if (!activeTrack.value) return 0
    return activeTrack.value.linkCdReduction ?? 0
  },
  set: (val) => {
    if (store.activeTrackId) {
      store.updateTrackLinkCdReduction(store.activeTrackId, val)
    }
  }
})

const originiumArtsPowerValue = computed({
  get: () => activeTrack.value ? (activeTrack.value.originiumArtsPower ?? 0) : 0,
  set: (val) => {
    if (store.activeTrackId) {
      store.updateTrackOriginiumArtsPower(store.activeTrackId, val)
    }
  }
})

// === 武器词条等级选择（每段 1-9）===
const weaponCommon1TierValue = computed({
  get: () => activeTrack.value ? (activeTrack.value.weaponCommon1Tier ?? 1) : 1,
  set: (val) => {
    if (store.activeTrackId) {
      store.updateTrackWeaponTier(store.activeTrackId, 'common1', val)
    }
  }
})

const weaponCommon2TierValue = computed({
  get: () => activeTrack.value ? (activeTrack.value.weaponCommon2Tier ?? 1) : 1,
  set: (val) => {
    if (store.activeTrackId) {
      store.updateTrackWeaponTier(store.activeTrackId, 'common2', val)
    }
  }
})

const weaponBuffTierValue = computed({
  get: () => activeTrack.value ? (activeTrack.value.weaponBuffTier ?? 1) : 1,
  set: (val) => {
    if (store.activeTrackId) {
      store.updateTrackWeaponTier(store.activeTrackId, 'buff', val)
    }
  }
})

function getEquipmentForSlot(slotKey) {
  const t = activeTrack.value
  if (!t) return null
  let id = null
  if (slotKey === 'armor') id = t.equipArmorId
  else if (slotKey === 'gloves') id = t.equipGlovesId
  else if (slotKey === 'accessory1') id = t.equipAccessory1Id
  else if (slotKey === 'accessory2') id = t.equipAccessory2Id
  return store.getEquipmentById(id)
}

const equipArmor = computed(() => getEquipmentForSlot('armor'))
const equipGloves = computed(() => getEquipmentForSlot('gloves'))
const equipAccessory1 = computed(() => getEquipmentForSlot('accessory1'))
const equipAccessory2 = computed(() => getEquipmentForSlot('accessory2'))

const equipArmorTierValue = computed({
  get: () => activeTrack.value ? (activeTrack.value.equipArmorRefineTier ?? 0) : 0,
  set: (val) => { if (store.activeTrackId) store.updateTrackEquipmentTier(store.activeTrackId, 'armor', val) }
})
const equipGlovesTierValue = computed({
  get: () => activeTrack.value ? (activeTrack.value.equipGlovesRefineTier ?? 0) : 0,
  set: (val) => { if (store.activeTrackId) store.updateTrackEquipmentTier(store.activeTrackId, 'gloves', val) }
})
const equipAccessory1TierValue = computed({
  get: () => activeTrack.value ? (activeTrack.value.equipAccessory1RefineTier ?? 0) : 0,
  set: (val) => { if (store.activeTrackId) store.updateTrackEquipmentTier(store.activeTrackId, 'accessory1', val) }
})
const equipAccessory2TierValue = computed({
  get: () => activeTrack.value ? (activeTrack.value.equipAccessory2RefineTier ?? 0) : 0,
  set: (val) => { if (store.activeTrackId) store.updateTrackEquipmentTier(store.activeTrackId, 'accessory2', val) }
})

function formatEquipValue(eq) {
  if (!eq) return '未装备'
  const lv = Number(eq.level) || 0
  return `${eq.name || eq.id || ''}${lv ? ` · Lv${lv}` : ''}`
}

function formatSlotLabel(slot) {
  const modifierId = slot?.modifierId || slot?.key
  if (!modifierId) return '（无）'
  const sizeLabel = slot.size === 'large' ? '大' : (slot.size === 'medium' ? '中' : '小')
  return `${store.getModifierLabel(modifierId)} · ${sizeLabel}`
}

const weaponSlot1Label = computed(() => formatSlotLabel(activeWeapon.value?.commonSlots?.[0]))
const weaponSlot2Label = computed(() => formatSlotLabel(activeWeapon.value?.commonSlots?.[1]))
const weaponBuffKeysLabel = computed(() => {
  const list = Array.isArray(activeWeapon.value?.buffBonuses) ? activeWeapon.value.buffBonuses : []
  const ids = list.map(b => b?.modifierId || b?.key).filter(Boolean)
  if (ids.length === 0) return '（无）'
  return ids.map(k => store.getModifierLabel(k)).join('、')
})

// === 技能列表逻辑 ===
const localSkills = ref([])

function onSkillClick(skillId) {
  store.selectLibrarySkill(skillId, activeLibraryTab.value)
}

watch(
    () => currentLibrary.value,
    (newVal) => {
      if (newVal && newVal.length > 0) {
        localSkills.value = JSON.parse(JSON.stringify(newVal.filter(s => !s.hiddenInLibraryGrid)))
      } else {
        localSkills.value = []
      }
    },
    { immediate: true, deep: true }
)

watch(activeLibraryTab, (tab) => {
  if (tab === 'weapon' && !hasWeaponLibrary.value) {
    activeLibraryTab.value = 'character'
    return
  }
  if (store.selectedLibrarySource !== tab) {
    store.selectLibrarySkill(null, tab)
  }
})

watch(activeWeapon, (weapon) => {
  if (!weapon && activeLibraryTab.value === 'weapon') {
    activeLibraryTab.value = 'character'
  }
})

watch(hasAnyEquipmentEquipped, (hasAny) => {
  if (!hasAny && activeLibraryTab.value === 'set') {
    activeLibraryTab.value = 'character'
  }
})

watch(hasActiveCharacter, (val) => {
  if (!val) {
    activeLibraryTab.value = 'character'
  }
})

watch(() => store.selectedLibrarySource, (src) => {
  if (src === 'weapon' && hasWeaponLibrary.value) {
    activeLibraryTab.value = 'weapon'
  }
  if (src === 'set') {
    activeLibraryTab.value = 'set'
  }
  if (src === 'character') {
    activeLibraryTab.value = 'character'
  }
})

// === 拖拽 Ghost 逻辑 ===
function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`
  let c = hex.substring(1).split('')
  if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]]
  c = '0x' + c.join('')
  return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')'
}

function getSkillThemeColor(skill) {
  if (skill.customColor) return skill.customColor
  if (skill.type === 'link') return store.getColor('link')
  if (skill.type === 'execution') return store.getColor('execution')
  if (skill.type === 'attack') return store.getColor('physical')
  if (skill.type === 'dodge') return store.getColor('dodge')
  if (skill.element) return store.getColor(skill.element)
  if (activeCharacter.value?.element) return store.getColor(activeCharacter.value.element)
  return store.getColor('default')
}

function formatDurationLabel(val) {
  const num = Number(val)
  if (!Number.isFinite(num)) return 0
  const rounded = Math.round(num * 1000) / 1000
  return rounded
}

function isAttackSegmentDisabled(seg) {
  return (Number(seg?.duration) || 0) <= 0
}

function getVisibleAttackSegments(skill) {
  return Array.isArray(skill?.attackSegments) ? skill.attackSegments : []
}

function onAttackSegmentDragStart(evt, seg) {
  if (isAttackSegmentDisabled(seg)) {
    evt.preventDefault()
    return
  }
  onNativeDragStart(evt, seg)
}

function onAttackSegmentClick(seg) {
  if (isAttackSegmentDisabled(seg)) return
  onSkillClick(seg.id)
}

function onNativeDragStart(evt, skill) {
  const isIconDrag = (skill.librarySource === 'weapon' || skill.librarySource === 'set' || skill.type === 'weapon' || skill.type === 'set')
  const ghost = document.createElement('div');
  ghost.id = 'custom-drag-ghost';

  const duration = Number(skill.duration) || 0;
  const themeColor = getSkillThemeColor(skill);
  let dragOffsetX = 0
  let dragOffsetY = 0

  if (isIconDrag) {
    const safeColor = themeColor || '#ccc'
    const iconBox = document.createElement('div')
    iconBox.style.width = '20px'
    iconBox.style.height = '20px'
    iconBox.style.border = `1px solid ${safeColor}`
    iconBox.style.background = '#333'
    iconBox.style.display = 'flex'
    iconBox.style.alignItems = 'center'
    iconBox.style.justifyContent = 'center'
    iconBox.style.overflow = 'hidden'
    iconBox.style.boxSizing = 'border-box'

    if (skill.icon) {
      const img = document.createElement('img')
      img.src = skill.icon
      img.style.width = '100%'
      img.style.height = '100%'
      img.style.objectFit = 'cover'
      iconBox.appendChild(img)
    }

    ghost.appendChild(iconBox)

    const size = 20
    Object.assign(ghost.style, {
      position: 'absolute', top: '-9999px', left: '-9999px',
      width: `${size}px`,
      height: `${size}px`,
      boxSizing: 'border-box',
      zIndex: '999999',
      pointerEvents: 'none'
    });
    document.body.appendChild(ghost);
    dragOffsetX = size / 2
    dragOffsetY = size / 2
    evt.dataTransfer.setDragImage(ghost, dragOffsetX, dragOffsetY);
  } else {
    const realWidth = (duration || 1) * store.timeBlockWidth;
    ghost.textContent = skill.name || '';
    Object.assign(ghost.style, {
      position: 'absolute', top: '-9999px', left: '-9999px',
      width: `${realWidth}px`, height: '50px',
      border: `2px dashed ${themeColor}`,
      backgroundColor: hexToRgba(themeColor, 0.2),
      color: '#ffffff',
      boxShadow: `0 0 10px ${themeColor}`,
      textShadow: `0 1px 2px rgba(0,0,0,0.8)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxSizing: 'border-box',
      fontSize: '12px', fontWeight: 'bold', zIndex: '999999', pointerEvents: 'none',
      fontFamily: 'sans-serif', whiteSpace: 'nowrap',
      backdropFilter: 'blur(4px)'
    });
    document.body.appendChild(ghost);
    dragOffsetX = 10
    dragOffsetY = 25
    evt.dataTransfer.setDragImage(ghost, dragOffsetX, dragOffsetY);
  }
  evt.dataTransfer.effectAllowed = 'copy';

  const libSource = skill.librarySource || activeLibraryTab.value || 'character'
  const payload = {
    ...skill,
    librarySource: libSource,
    weaponId: libSource === 'weapon' ? (skill.weaponId || activeWeapon.value?.id || null) : null,
    dragOffsetX,
    dragOffsetY,
  }

  store.setDraggingSkill(payload);
  document.body.classList.add('is-lib-dragging');

  setTimeout(() => {
    const el = document.getElementById('custom-drag-ghost');
    if (el) document.body.removeChild(el);
  }, 0);
}

function onNativeDragEnd() {
  store.setDraggingSkill(null)
  document.body.classList.remove('is-lib-dragging')
}
</script>

<template>
  <div class="library-container">
    <div class="lib-header">
      <div class="header-main">
        <div class="header-icon-bar"></div>
        <h3 class="char-name">{{ activeLibraryTitle }}</h3>
      </div>
      <div class="lib-tabs">
        <button
          class="lib-tab"
          :class="{ active: hasActiveCharacter && activeLibraryTab === 'character' }"
          :disabled="!hasActiveCharacter"
          @click="activeLibraryTab = 'character'">
          干员
        </button>
        <button
          class="lib-tab"
          :class="{ active: hasActiveCharacter && activeLibraryTab === 'weapon' }"
          :disabled="!hasWeaponLibrary || !hasActiveCharacter"
          title="需要为当前干员选择武器"
          @click="activeLibraryTab = 'weapon'">
          武器
        </button>
        <button
          class="lib-tab"
          :class="{ active: hasActiveCharacter && activeLibraryTab === 'set' }"
          :disabled="!hasActiveCharacter || !hasAnyEquipmentEquipped"
          title="需要先装备任意装备"
          @click="activeLibraryTab = 'set'">
          装备
        </button>
      </div>
      <div class="header-divider"></div>
    </div>

    <div v-if="activeTrack && activeCharacter && activeLibraryTab === 'character'" class="gauge-settings-panel">
      <div class="panel-tag">干员数值</div>

      <div class="setting-group">
        <div class="setting-info">
          <span class="label">初始充能</span>
          <span class="value cyan">{{ initialGaugeValue }}</span>
        </div>
        <div class="setting-controls">
          <el-slider v-model="initialGaugeValue" :max="maxGaugeValue" :show-tooltip="false" size="small" class="tech-slider cyan-theme" />
          <CustomNumberInput v-model="initialGaugeValue" :min="0" :max="maxGaugeValue" active-color="#00e5ff" class="tech-input" />
        </div>
      </div>

      <div class="group-divider"></div>

      <div class="setting-group">
        <div class="setting-info">
          <span class="label">充能上限</span>
          <span class="value gold">{{ maxGaugeValue }}</span>
        </div>
        <div class="setting-controls">
          <el-slider v-model="maxGaugeValue" :min="1" :max="300" :show-tooltip="false" size="small" class="tech-slider gold-theme" />
          <CustomNumberInput v-model="maxGaugeValue" :min="1" :max="300" active-color="#ffd700" class="tech-input" />
        </div>
      </div>

      <div class="group-divider"></div>

      <div class="setting-group">
        <div class="setting-info">
          <span class="label">充能效率</span>
          <span class="value green">{{ gaugeEfficiencyValue }}%</span>
        </div>
        <div class="setting-controls">
          <el-slider v-model="gaugeEfficiencyValue" :min="0" :max="300" :step="0.1" :show-tooltip="false" size="small" class="tech-slider green-theme" />
          <CustomNumberInput v-model="gaugeEfficiencyValue" :min="0" :max="300" suffix="%" active-color="#52c41a" class="tech-input" />
        </div>
      </div>

      <div class="group-divider"></div>

      <div class="setting-group">
        <div class="setting-info">
          <span class="label">连携技冷却缩减</span>
          <span class="value gold">{{ linkCdReductionValue }}%</span>
        </div>
        <div class="setting-controls">
          <el-slider v-model="linkCdReductionValue" :min="0" :max="100" :step="1" :show-tooltip="false" size="small" class="tech-slider gold-theme" />
          <CustomNumberInput v-model="linkCdReductionValue" :min="0" :max="100" suffix="%" active-color="#ffd700" class="tech-input" />
        </div>
      </div>

      <div class="group-divider"></div>

      <div class="setting-group">
        <div class="setting-info">
          <span class="label">源石技艺强度</span>
          <span class="value purple">{{ originiumArtsPowerValue }}</span>
        </div>
        <div class="setting-controls">
          <el-slider v-model="originiumArtsPowerValue" :min="0" :max="200" :step="1" :show-tooltip="false" size="small" class="tech-slider purple-theme" />
          <CustomNumberInput v-model="originiumArtsPowerValue" :min="0" :max="200" :step="1" active-color="#b37feb" class="tech-input" />
        </div>
      </div>

    </div>

    <div v-if="activeTrack && activeCharacter && activeLibraryTab === 'weapon' && activeWeapon" class="gauge-settings-panel">
      <div class="panel-tag">武器数值</div>

      <div class="setting-group">
        <div class="setting-info stacked-layout">
          <span class="label">通用词条 1</span>
          <span class="value">{{ weaponSlot1Label }}</span>
        </div>
        <div class="setting-controls">
          <el-slider v-model="weaponCommon1TierValue" :min="1" :max="9" :step="1" :show-tooltip="false" size="small" class="tech-slider white-theme" />
          <CustomNumberInput v-model="weaponCommon1TierValue" :min="1" :max="9" suffix="级" class="tech-input" />
        </div>
      </div>

      <div class="group-divider"></div>

      <div class="setting-group">
        <div class="setting-info stacked-layout">
          <span class="label">通用词条 2</span>
          <span class="value">{{ weaponSlot2Label }}</span>
        </div>
        <div class="setting-controls">
          <el-slider v-model="weaponCommon2TierValue" :min="1" :max="9" :step="1" :show-tooltip="false" size="small" class="tech-slider white-theme" />
          <CustomNumberInput v-model="weaponCommon2TierValue" :min="1" :max="9" suffix="级" class="tech-input" />
        </div>
      </div>

      <div class="group-divider"></div>

      <div class="setting-group">
        <div class="setting-info stacked-layout">
          <span class="label">{{ activeWeapon.buffName || '专属 BUFF' }}</span>
          <span class="value">{{ weaponBuffKeysLabel }}</span>
        </div>
        <div class="setting-controls">
          <el-slider v-model="weaponBuffTierValue" :min="1" :max="9" :step="1" :show-tooltip="false" size="small" class="tech-slider white-theme" />
          <CustomNumberInput v-model="weaponBuffTierValue" :min="1" :max="9" suffix="级" class="tech-input" />
        </div>
      </div>
    </div>

    <div v-if="activeTrack && activeCharacter && activeLibraryTab === 'set'" class="gauge-settings-panel">
      <div class="panel-tag">装备精锻</div>

      <div v-if="equipArmor" class="setting-group">
        <div class="setting-info stacked-layout">
          <span class="label">护甲</span>
          <span class="value">{{ formatEquipValue(equipArmor) }}</span>
        </div>
        <div class="setting-controls" v-if="Number(equipArmor.level) === 70">
          <el-slider v-model="equipArmorTierValue" :min="0" :max="3" :step="1" :show-tooltip="false" size="small" class="tech-slider white-theme" />
          <CustomNumberInput v-model="equipArmorTierValue" :min="0" :max="3" suffix="级" class="tech-input" />
        </div>
        <div class="setting-controls" v-else>
          <span class="value" style="color:#666; font-size: 12px;">非 Lv70 无精锻</span>
        </div>
      </div>

      <div v-if="equipArmor && equipGloves" class="group-divider"></div>
      <div v-if="equipGloves" class="setting-group">
        <div class="setting-info stacked-layout">
          <span class="label">护手</span>
          <span class="value">{{ formatEquipValue(equipGloves) }}</span>
        </div>
        <div class="setting-controls" v-if="Number(equipGloves.level) === 70">
          <el-slider v-model="equipGlovesTierValue" :min="0" :max="3" :step="1" :show-tooltip="false" size="small" class="tech-slider white-theme" />
          <CustomNumberInput v-model="equipGlovesTierValue" :min="0" :max="3" suffix="级" class="tech-input" />
        </div>
        <div class="setting-controls" v-else>
          <span class="value" style="color:#666; font-size: 12px;">非 Lv70 无精锻</span>
        </div>
      </div>

      <div v-if="(equipArmor || equipGloves) && equipAccessory1" class="group-divider"></div>
      <div v-if="equipAccessory1" class="setting-group">
        <div class="setting-info stacked-layout">
          <span class="label">配件 1</span>
          <span class="value">{{ formatEquipValue(equipAccessory1) }}</span>
        </div>
        <div class="setting-controls" v-if="Number(equipAccessory1.level) === 70">
          <el-slider v-model="equipAccessory1TierValue" :min="0" :max="3" :step="1" :show-tooltip="false" size="small" class="tech-slider white-theme" />
          <CustomNumberInput v-model="equipAccessory1TierValue" :min="0" :max="3" suffix="级" class="tech-input" />
        </div>
        <div class="setting-controls" v-else>
          <span class="value" style="color:#666; font-size: 12px;">非 Lv70 无精锻</span>
        </div>
      </div>

      <div v-if="(equipArmor || equipGloves || equipAccessory1) && equipAccessory2" class="group-divider"></div>
      <div v-if="equipAccessory2" class="setting-group">
        <div class="setting-info stacked-layout">
          <span class="label">配件 2</span>
          <span class="value">{{ formatEquipValue(equipAccessory2) }}</span>
        </div>
        <div class="setting-controls" v-if="Number(equipAccessory2.level) === 70">
          <el-slider v-model="equipAccessory2TierValue" :min="0" :max="3" :step="1" :show-tooltip="false" size="small" class="tech-slider white-theme" />
          <CustomNumberInput v-model="equipAccessory2TierValue" :min="0" :max="3" suffix="级" class="tech-input" />
        </div>
        <div class="setting-controls" v-else>
          <span class="value" style="color:#666; font-size: 12px;">非 Lv70 无精锻</span>
        </div>
      </div>
    </div>

    <div v-if="hasActiveCharacter" class="skill-section">
      <div class="section-title-box">
        <span class="section-title">
          {{
            activeLibraryTab === 'weapon'
              ? '武器BUFF库'
              : activeLibraryTab === 'set'
                ? '套装BUFF库'
                : '干员技能库'
          }}
        </span>
        <span class="section-hint">
          {{
            activeLibraryTab === 'weapon'
              ? '拖拽武器BUFF到轨道，拖拽位置即为开始时间'
              : activeLibraryTab === 'set'
                ? '拖拽BUFF到轨道，拖拽位置即为开始时间'
                : '点击编辑基础数值 / 拖拽排轴'
          }}
        </span>
      </div>
      <div v-if="localSkills.length > 0" class="skill-grid">
        <div
            v-for="skill in localSkills"
            :key="skill.id"
            class="skill-item"
            :style="{ '--accent-color': getSkillThemeColor(skill) }"
        >
          <div
              class="skill-card"
              :class="{ 'is-selected': store.selectedLibrarySkillId === skill.id && store.selectedLibrarySource === activeLibraryTab }"
              draggable="true"
              @dragstart="onNativeDragStart($event, skill)"
              @dragend="onNativeDragEnd"
              @click="onSkillClick(skill.id)"
          >
            <div class="card-edge"></div>
            <div class="card-body">
              <div class="skill-meta"><span v-if="!skill.name.includes(getFullTypeName(skill.type))" class="skill-type">{{ getFullTypeName(skill.type) }}</span>
                <span v-else class="skill-type-empty"></span>
                <span class="skill-time">{{ formatDurationLabel(skill.duration) }}s</span>
              </div>
              <div class="skill-name">{{ skill.name }}</div>
            </div>

            <div class="card-bg-deco" v-if="getSkillDisplayIcon(skill)">
              <img :src="getSkillDisplayIcon(skill)" class="weapon-icon-inner" />
            </div>
            <div v-else class="card-bg-deco-empty"></div>
          </div>

          <div v-if="skill.kind === 'attack_group'" class="attack-segment-row" @click.stop>
            <div
                v-for="(seg, idx) in getVisibleAttackSegments(skill)"
                :key="seg.id"
                class="attack-segment-chip"
                :class="{ 'is-selected': store.selectedLibrarySkillId === seg.id && store.selectedLibrarySource === activeLibraryTab, 'is-last': idx === getVisibleAttackSegments(skill).length - 1 }"
                :draggable="!isAttackSegmentDisabled(seg)"
                @dragstart="onAttackSegmentDragStart($event, seg)"
                @dragend="onNativeDragEnd"
                @click.stop="onAttackSegmentClick(seg)"
            >{{ (seg.attackSegmentIndex || '') + 'A' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.library-container {
  padding: 15px;
  display: flex;
  flex-direction: column;
  background-color: #252525;
  height: 100%;
  gap: 15px;
  overflow-y: auto;
  transition: background-color 0.3s ease;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.library-container::-webkit-scrollbar {
  display: none;
}
/* 头部样式 */
.lib-header { display: flex; flex-direction: column; gap: 4px; }
.header-main { display: flex; align-items: center; gap: 10px; }
.header-icon-bar { width: 4px; height: 18px; background-color: #ffd700; }
.char-name { margin: 0; color: #fff; font-size: 18px; letter-spacing: 1px; }
.lib-tabs { display: flex; gap: 8px; margin-top: 6px; }
.lib-tab {
  background: #1f1f1f;
  border: 1px solid #333;
  color: #bbb;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}
.lib-tab:hover:not(:disabled) { color: #fff; border-color: #555; }
.lib-tab.active { color: #ffd700; border-color: #ffd700; box-shadow: 0 0 10px rgba(255, 215, 0, 0.2); }
.lib-tab:disabled { opacity: 0.35; cursor: not-allowed; }
.header-divider { height: 2px; background: linear-gradient(90deg, #ffd700 0%, transparent 100%); opacity: 0.3; margin-top: 3px; }

/* 参数面板 */
.gauge-settings-panel {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 3px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 12px;
  margin-top: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.panel-tag {
  position: absolute;
  right: 0;
  top: -12px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-bottom: none;
  font-size: 10px;
  color: #aaa;
  padding: 2px 10px;
  font-family: 'Inter', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  clip-path: polygon(10% 0, 100% 0, 100% 100%, 0% 100%);
}
.gauge-settings-panel::before {
  content: "";
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 10px;
  height: 10px;
  border-right: 1px solid rgba(255,255,255,0.3);
  border-bottom: 1px solid rgba(255,255,255,0.3);
}
.setting-group { display: flex; flex-direction: column; gap: 4px; }
.setting-info { display: flex; justify-content: space-between; align-items: baseline; }
.label { font-size: 11px;color: rgba(255, 255, 255, 0.5); text-transform: uppercase; letter-spacing: 1px; }
.value { font-family: 'Roboto Mono', monospace; font-weight: bold; font-size: 15px; }
.cyan { color: #00e5ff; }
.gold { color: #ffd700; }
.green { color: #52c41a; }
.purple { color: #b37feb; }
.setting-controls { display: flex; align-items: center; gap: 12px; }
.tech-slider { flex-grow: 1; }
.tech-input { width: 150px; }
.group-divider { height: 1px;background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%); }

.setting-info.stacked-layout { flex-direction: column; align-items: flex-start; gap: 2px; margin-bottom: 2px; }
.setting-info.stacked-layout .label { color: rgba(255, 255, 255, 0.4); font-size: 10px; line-height: 1; margin-left: 1px; }
.setting-info.stacked-layout .value { font-size: 11px !important; line-height: 1.3; color: #e0e0e0; word-break: break-all; white-space: normal; text-align: left; }

/* 技能卡片列表 */
.skill-section { display: flex; flex-direction: column; gap: 15px; }
.section-title-box { display: flex; flex-direction: column; border-left: 2px solid #444; padding-left: 10px; }
.section-title { font-size: 14px; font-weight: bold; color: #ccc; }
.section-hint { font-size: 10px; color: #555; }

.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.skill-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  --accent-color: #8c8c8c;
}

.skill-card {
  position: relative;
  height: 60px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  cursor: grab;
  overflow: hidden;
  box-sizing: border-box;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.skill-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}
.skill-card.is-selected {
  border-color: #ffd700;
  box-shadow: inset 0 0 10px rgba(255, 215, 0, 0.1);
  background: rgba(255, 215, 0, 0.05);
}

.attack-segment-row {
  display: flex;
  gap: 2px;
  width: 100%;
  padding: 0;
  min-height: 22px;
  align-items: center;
  box-sizing: border-box;
}

.attack-segment-chip {
  position: relative;
  flex: 1 1 0;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.75);
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1;
  user-select: none;
  cursor: grab;
  box-sizing: border-box;
  transition: all 0.15s ease;
  border-radius: 2px;
  min-width: 0;
}

.attack-segment-chip::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 2px 0 10px rgba(255, 255, 255, 0.25);
  opacity: 0.75;
}

.attack-segment-chip:not(.is-last)::after {
  content: '>';
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.28);
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1;
  pointer-events: none;
}

.attack-segment-chip:hover {
  border-color: var(--accent-color);
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.attack-segment-chip.is-selected {
  border-color: #ffd700;
  color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.12);
}


.skill-type-empty {
  height: 9px;
  flex: 1;
}

.skill-card:not(:has(.skill-type)) .skill-name {
  font-size: 14px;
  margin-top: 2px;
}

.card-edge {
  position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
  background-color: var(--accent-color);
  box-shadow: 2px 0 10px var(--accent-color);
}

.card-body { padding: 10px 12px 10px 16px; height: 100%; display: flex; flex-direction: column; justify-content: center; box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.1); }

.skill-meta { display: flex; align-items: center; margin-bottom: 2px; }
.skill-type { font-size: 9px; color: var(--accent-color); filter: brightness(0.8); font-weight: bold; text-transform: uppercase; opacity: 0.6; }
.skill-time { position: absolute; top: 5px; right: 21px; width: 38px; display: flex; align-items: center; gap: 4px; font-family: 'Roboto Mono', 'Consolas', monospace; font-size: 10px; font-weight: 500; color: rgba(255, 255, 255, 0.45); z-index: 3; }
.skill-time::before { content: ''; width: 1px; height: 8px; background: var(--accent-color); opacity: 0.4; }
.skill-name { font-size: 13px; color: rgba(255, 255, 255, 0.9); font-weight: bold; margin-top: 2px; padding-right: 65px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.card-bg-deco {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, transparent 20%, var(--accent-color) 100%);
  opacity: 0.6;
  clip-path: polygon(100% 0, 0 100%, 100% 100%);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.weapon-icon-inner {
  width: 28px;
  height: 28px;
  filter: brightness(1.2) drop-shadow(0 0 5px var(--accent-color));
  opacity: 0.9;
  margin-right: 2px;
  margin-bottom: 2px;
  pointer-events: none;
  transition: all 0.2s ease;
}

.skill-card:hover .card-bg-deco {
  opacity: 0.85;
  transform: scale(1.05);
}

.skill-card:hover .weapon-icon-inner {
  filter: brightness(1.5) drop-shadow(0 0 8px #fff);
  transform: scale(1.1);
  opacity: 1;
}

.card-bg-deco-empty {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 15px;
  height: 15px;
  background: var(--accent-color);
  opacity: 0.2;
  clip-path: polygon(100% 0, 0 100%, 100% 100%);
}

/* Slider 自定义 */
:deep(.el-slider) { height: 24px; display: flex; align-items: center; }
:deep(.el-slider__runway) { height: 4px !important; background-color: rgba(255, 255, 255, 0.1) !important; border-radius: 2px; margin: 0 !important; flex: 1; }
:deep(.el-slider__bar) { height: 4px !important; border-radius: 2px; }
:deep(.el-slider__button-wrapper) { height: 100% !important; top: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; width: 36px !important; background-color: transparent !important; }
:deep(.el-slider__button) { width: 12px !important; height: 12px !important; background-color: #1a1a1a !important; border: 2px solid currentColor !important; box-shadow: 0 0 8px currentColor; transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
:deep(.el-slider__button:hover) { transform: scale(1.2); }
.cyan-theme { color: #00e5ff; }
.cyan-theme :deep(.el-slider__bar) { background-color: #00e5ff; }
.gold-theme { color: #ffd700; }
.gold-theme :deep(.el-slider__bar) { background-color: #ffd700; }
.green-theme { color: #52c41a; }
.green-theme :deep(.el-slider__bar) { background-color: #52c41a; }
.purple-theme { color: #b37feb; }
.purple-theme :deep(.el-slider__bar) { background-color: #b37feb; }
.white-theme { color: #ffffff; }
.white-theme :deep(.el-slider__bar) { background-color: #ffffff; }
</style>