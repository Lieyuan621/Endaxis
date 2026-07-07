<script setup>
import { computed } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { useDragConnection } from '../composables/useDragConnection.js'
import ActionLinkPorts from './ActionLinkPorts.vue'
import { useI18n } from 'vue-i18n'
import { snapTimeToFrame } from '@/utils/time.js'
const props = defineProps({
  action: { type: Object, required: true },
  showDecorations: { type: Boolean, default: true },
})
const emit = defineEmits(['hit-click'])

const store = useTimelineStore()
const connectionHandler = useDragConnection()
const { t } = useI18n({ useScope: 'global' })
const TYPE_SHORTHAND = {
  'basicAttack': 'A', 'dive': 'D', 'finisher': 'X', 'battleSkill': 'C', 'comboSkill': 'E', 'ultimate': 'U'
}

const isVariant = computed(() => {
  return props.action.id && props.action.id.includes('_variant_')
})

const secWidth = computed(() => store.timeBlockWidth)

const displayLabel = computed(() => {
  const name = props.action.name || ''
  const type = props.action.type
  const width = secWidth.value

  const variantSuffix = isVariant.value ? '*' : ''
  const comboIdx = Number(props.action.comboSegmentIndex) || 0
  const comboTotal = Number(props.action.comboSegmentTotal) || 0
  const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩']
  const comboSuffix = (props.action.kind !== 'segment' && comboTotal >= 2 && comboIdx >= 1)
    ? (CIRCLED[comboIdx - 1] || `(${comboIdx})`)
    : ''
  const suffix = `${variantSuffix}${comboSuffix}`

  if (props.action.kind === 'attack_segment') {
    const total = Number(props.action.attackSequenceTotal) || 0
    const idx = Number(props.action.attackSequenceIndex) || 0

    if (total > 0 && idx > 0) {
      if (idx === total) {
        const groupName = props.action.attackGroupName || (name ? name.replace(/\s*\d+\s*$/, '') : t('skillType.attack'))
        return `${groupName}${suffix}`
      }
      return `A${idx}${suffix}`
    }
  }

  if (width >= 30) return `${name}${suffix}`
  return `${TYPE_SHORTHAND[type] || '?'}${suffix}`
})

const isSelected = computed(() => store.isActionSelected(props.action.instanceId))

// 幽灵模式：触发窗口 < 0 时仅显示逻辑点，不显示实体框
const isGhostMode = computed(() => (props.action.triggerWindow || 0) < 0)

// 计算主题色
const themeColor = computed(() => {
  if (props.action.customColor) return props.action.customColor
  if (props.action.type === 'comboSkill') return store.getColor('link')
  if (props.action.type === 'finisher') return store.getColor('execution')
  if (props.action.type === 'basicAttack') return store.getColor('attack')
  if (props.action.type === 'dive') return store.getColor('dodge')
  if (props.action.element) return store.getColor(props.action.element)

  let charId = null
  for (const track of store.tracks) {
    if (track.actions.some(a => a.instanceId === props.action.instanceId)) {
      charId = track.id
      break
    }
  }
  if (charId) return store.getCharacterElementColor(charId)
  return store.getColor('default')
})

const actionLayout = computed(() => store.nodeRects[props.action.instanceId])
const coverStartTime = computed(() => store.getActionCoverStartTime(props.action.instanceId))

function isCoveredBeforeStart(startTime) {
  const coverStart = coverStartTime.value
  const itemStart = Number(startTime)
  if (!Number.isFinite(coverStart) || !Number.isFinite(itemStart)) return false
  return coverStart <= itemStart + 0.0001
}

function getDamageHitValue(hit) {
  return Number(store.getHitDisplayDamage?.(hit?.data) ?? hit?.data?._expectedDamage ?? hit?.data?._damageBreakdown?.expectedDamage ?? 0) || 0
}

function getDamageHitTitle(hit) {
  return t('actionItem.damageHitTooltip', {
    damage: Math.floor(getDamageHitValue(hit)).toLocaleString(),
  })
}

function onDamageHitClick(hit) {
  if (!hit?.data?._damageBreakdown) return
  emit('hit-click', hit.data)
}

// 连携冷却计算

const currentTrack = computed(() => {
  return store.tracks.find(t => t.actions?.some(a => a.instanceId === props.action.instanceId)) || null
})

const baseCooldown = computed(() => {
  const resolved = store.compiledTimeline?.actionMap?.get(props.action.instanceId)
  return Number(resolved?.node?.baseCooldown ?? props.action.baseCooldown ?? props.action.cooldown) || 0
})

const simCdReduction = computed(() => {
  const log = store.simLog || store.simulation?.simLog || []
  return log
    .filter((entry) => entry.type === 'CD_REDUCTION' && entry.payload?.actionId === props.action.instanceId)
    .reduce((sum, entry) => sum + (Number(entry.payload?.reduction) || 0), 0)
})

const effectiveComboCooldown = computed(() => {
  const baseCd = baseCooldown.value
  if (props.action.type !== 'comboSkill') return 0
  const track = currentTrack.value
  const clamp = (val) => {
    const num = Number(val) || 0
    if (num < 0) return 0
    if (num > 100) return 100
    return num
  }
  const reduction = Math.max(
      clamp(track?.stats?.combo_cd_reduction),
      clamp(track?.stats?.link_cd_reduction),
      clamp(track?.linkCdReduction),
      clamp(store.systemConstants.linkCdReduction),
  )
  const flat = Math.max(0, Number(track?.stats?.combo_cd_reduction_flat) || 0)
  const extMult = Math.max(0, Number(track?.stats?.combo_cd_external_mult ?? 1) || 1)
  return Math.max(0, (baseCd - flat) * (1 - reduction / 100) * extMult - simCdReduction.value)
})

const effectiveUltimateCooldown = computed(() => {
  const baseCd = baseCooldown.value
  if (props.action.type !== 'ultimate') return 0
  const track = store.tracks.find(t => t.actions?.some(a => a.instanceId === props.action.instanceId))
  const pct = Math.max(0, Math.min(100, Number(track?.stats?.ult_cd_reduction) || 0))
  const flat = Math.max(0, Number(track?.stats?.ult_cd_reduction_flat) || 0)
  const extMult = Math.max(0, Number(track?.stats?.ult_cd_external_mult ?? 1) || 1)
  return Math.max(0, (baseCd - flat) * (1 - pct / 100) * extMult - simCdReduction.value)
})

// 主体样式计算
const PERFECT_LINK_STATUS_IDS = new Set([
  'rossi-combo-perfect-timing-satisfied',
])

const isPerfectLinkAction = computed(() => {
  if (props.action.type !== 'comboSkill') return false
  return (store.operatorLog || []).some((entry) => (
    entry?.type === 'OPERATOR_EFFECT_APPLY' &&
    entry?.actionId === props.action.instanceId &&
    PERFECT_LINK_STATUS_IDS.has(entry?.id)
  ))
})

const style = computed(() => {
  const layout = actionLayout.value
  if (!layout || !layout.rect) {
    return {}
  }
  const { left, width, height } = layout.rect
  const color = themeColor.value

  const priorityBase = isSelected.value ? 10000 : 100;
  const timeWeight = Math.floor((props.action.startTime || 0) * 10);
  const finalZIndex = priorityBase + timeWeight;

  const layoutStyle = {
    position: 'absolute',
    top: '0',
    height: `${height}px`,
    left: `${left}px`,
    width: `${width}px`,
    boxSizing: 'border-box',
    zIndex: finalZIndex,
  }

  if (isGhostMode.value) {
    return {
      ...layoutStyle,
      border: 'none',
      backgroundColor: 'transparent',
      boxShadow: 'none',
      color: 'transparent',
      pointerEvents: isSelected.value ? 'auto' : 'none'
    }
  }

  let borderStyle = ''
  if (isSelected.value) {
    borderStyle = `2px dashed #ffffff`
  } else if (props.action.type === 'basicAttack') {
    borderStyle = `1.5px solid ${hexToRgba(color, 0.4)}`
  } else {
    borderStyle = `2px dashed ${color}`
  }

  if (props.action.type === 'ultimate' && !props.action.isDisabled) {
    return {
      ...layoutStyle,
      border: `1.5px solid ${color}`,
      background: `radial-gradient(circle at center,
      ${hexToRgba(color, 0.5)} 0%,
      ${hexToRgba(color, 0.2)} 70%,
      ${hexToRgba(color, 0.1)} 100%)`,
      boxShadow: `0 0 15px ${hexToRgba(color, 0.5)}`,
      borderRadius: '2px',
      padding: '0 6px',
    }
  }

  if (props.action.type === 'comboSkill' && !props.action.isDisabled) {
    const perfect = isPerfectLinkAction.value
    return {
      ...layoutStyle,
      border: perfect ? '1.5px solid #fff2a8' : `1.5px solid ${color}`,
      borderRadius: '2px',
      backgroundColor: perfect ? 'rgba(255, 236, 122, 0.18)' : hexToRgba(color, 0.15),
      boxShadow: perfect
        ? '0 0 0 1px rgba(255, 242, 168, 0.75), 0 0 14px rgba(255, 215, 0, 0.55)'
        : (isSelected.value ? `0 0 8px ${color}` : 'none'),
      backdropFilter: store.isCapturing ? 'none' : 'blur(4px)',
      color: perfect ? '#fff7cf' : (isSelected.value ? '#ffffff' : color),
    }
  }

  if (props.action.isDisabled) {
    return {
      ...layoutStyle,
      border: `2px dashed #555`,
      backgroundColor: `rgba(40,40,40, 0.3)`,
      color: '#777',
      opacity: 0.6,
      backdropFilter: 'none',
      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.5) 5px, rgba(0,0,0,0.5) 10px)'
    }
  }

  return {
    ...layoutStyle,
    border: borderStyle,
    backgroundColor: hexToRgba(color, 0.15),
    backdropFilter: store.isCapturing ? 'none' : 'blur(4px)',
    color: isSelected.value ? '#ffffff' : color,
    boxShadow: isSelected.value ? `0 0 10px ${color}` : 'none'
  }
})

// 冷却条样式
const TRACKING_BAR_ROW_GAP = 8

function getActionRealStartTime() {
  const resolved = store.compiledTimeline?.actionMap?.get(props.action.instanceId)
  return Number(resolved?.realStartTime ?? props.action.startTime) || 0
}

function getTrackingBarTransform(leftPx, rowIndex) {
  const layout = actionLayout.value
  if (!layout) return null
  return `translate(${layout.bar.leftEdge + leftPx}px, ${layout.bar.relativeY + TRACKING_BAR_ROW_GAP * rowIndex}px)`
}

function getCooldownStyle(cooldown, rowIndex) {
  const layout = actionLayout.value
  if (!layout) return { display: 'none' }

  const start = getActionRealStartTime()
  const freezeDuration = props.action.type === 'ultimate' ? (Number(props.action.animationTime) || 0) : 0
  const cdStart = start + freezeDuration
  const cdVal = Number(cooldown) || 0
  if (cdVal <= 0) return { display: 'none' }

  const left = store.timeToPx(cdStart) - store.timeToPx(start)
  const width = store.timeToPx(cdStart + cdVal) - store.timeToPx(cdStart)
  return {
    width: `${width}px`,
    transform: getTrackingBarTransform(left, rowIndex),
    opacity: 0.6
  }
}

const cdStyle = computed(() => {
  return getCooldownStyle(effectiveComboCooldown.value, 0)
})

const ultCdStyle = computed(() => {
  return getCooldownStyle(effectiveUltimateCooldown.value, 1)
})

// 强化时间样式
const enhancementMetrics = computed(() => {
  const layout = actionLayout.value
  if (!layout) return { widthPx: 0, extensionAmount: 0, enhStart: 0 }

  const start = getActionRealStartTime()
  const freezeDuration = Number(props.action.animationTime || props.action.duration) || 0
  const end = store.getShiftedEndTime(start, freezeDuration, props.action.instanceId)
  const time = Number(props.action.enhancementTime) || 0
  if (time <= 0) return { widthPx: 0, extensionAmount: 0, enhStart: end }

  const ultimateMetrics = (props.action.type === 'ultimate')
      ? store.getUltimateEnhancementMetrics?.(props.action.instanceId)
      : null

  const finalEnd = ultimateMetrics?.finalEnd || store.getShiftedEndTime(end, time, props.action.instanceId)
  const baseDuration = ultimateMetrics?.baseDuration ?? time

  const shiftedEnhDuration = finalEnd - end
  const extensionAmount = snapTimeToFrame(shiftedEnhDuration - baseDuration)
  const widthPx = store.timeToPx(finalEnd) - store.timeToPx(end)

  return { widthPx, extensionAmount, enhStart: end }
})

const enhancementStyle = computed(() => {
  const layout = actionLayout.value

  if (!layout) {
    return { display: 'none' }
  }

  const start = getActionRealStartTime()
  const left = store.timeToPx(enhancementMetrics.value.enhStart) - store.timeToPx(start)
  const width = enhancementMetrics.value.widthPx

  return { 
    width: `${width}px`, 
    transform: getTrackingBarTransform(left, 2),
    opacity: 0.8 
  }
})

// 触发窗口样式
const triggerWindowStyle = computed(() => {
  const layout = actionLayout.value

  if (!layout || !layout.triggerWindow || !layout.triggerWindow.hasWindow) {
    return { display: 'none' }
  }

  const width = layout.triggerWindow.rect.width
  const color = themeColor.value
  return { 
    '--tw-width': `${width}px`, 
    '--tw-color': color, 
    transform: layout.triggerWindow.localTransform
  }
})

// 自定义时间条
const customBarsToRender = computed(() => {
  const bars = props.action.customBars || []
  const resolvedAction = store.compiledTimeline?.actionMap?.get(props.action.instanceId)
  const base = Number(resolvedAction?.realStartTime ?? props.action.startTime) || 0
  const baseRow = props.action.type === 'ultimate' ? 3 : (effectiveComboCooldown.value > 0 ? 1 : 0)

  return bars.map((bar, index) => {
    const originalDuration = bar.duration || 0
    const originalOffset = bar.offset || 0
    if (originalDuration <= 0) return null

    // 计算起始点的现实偏移
    const shiftedStartTimestamp = store.getShiftedEndTime(base, originalOffset, props.action.instanceId)
    if (isCoveredBeforeStart(shiftedStartTimestamp)) return null

    // 计算受时停影响后的结束点，从而得出最终视觉时长
    const shiftedEndTimestamp = store.getShiftedEndTime(shiftedStartTimestamp, originalDuration, props.action.instanceId)
    const shiftedDuration = shiftedEndTimestamp - shiftedStartTimestamp

    // 计算延长量
    const extensionAmount = snapTimeToFrame(shiftedDuration - originalDuration)

    const left = (store.timeToPx(shiftedStartTimestamp) - store.timeToPx(base)) - 2
    const width = store.timeToPx(shiftedEndTimestamp) - store.timeToPx(shiftedStartTimestamp)
    const transform = getTrackingBarTransform(left, baseRow + index)

    return {
      style: { width: `${width}px`, transform, pointerEvents: 'none', opacity: 0.6, zIndex: 5 - index },
      text: bar.text, originalDuration, extensionAmount,
      displayDuration: snapTimeToFrame(shiftedDuration)
    }
  }).filter(item => item !== null)
})

// 计算动画时间的视觉宽度
const animationTimeWidth = computed(() => {
  // 从 Store 的计算结果中找到属于自己的那一项
  const myExtension = store.globalExtensions.find(ext => ext.sourceId === props.action.instanceId)

  if (myExtension) {
    return store.timeToPx(myExtension.time + myExtension.amount) - store.timeToPx(myExtension.time)
  }

  return 0
})

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`
  let c = hex.substring(1).split('');
  if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  c = '0x' + c.join('');
  return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')'
}

const connectionSourceActionId = computed(() => {
  const node = store.resolveNode(connectionHandler.state.value.sourceId)
  if (!node) {
    return null
  }
  if (node.type === 'action') {
    return node.id
  }
  return node.actionId
})

// 计算判定点的位置样式
const renderableHits = computed(() => {
  const resolvedAction = store.compiledTimeline?.actionMap.get(props.action.instanceId)
  if (!resolvedAction) return []

  const firedHitRefs = new Set(
    (store.simLog || [])
      .filter((entry) => entry.type === 'DAMAGE_HIT' && entry.payload.actionId === props.action.instanceId)
      .map((entry) => entry.payload.hitData),
  )

  const baseHits = (resolvedAction.resolvedHits || [])
    .filter((hit) => !hit._noDamage)
    .filter((hit) => !hit._condition || firedHitRefs.has(hit))
    .filter((hit) => !isCoveredBeforeStart(hit.realTime))
    .map((hit) => {
      const left = store.timeToPx(hit.realTime) - store.timeToPx(resolvedAction.realStartTime)
      return {
        style: { left: `${left}px` },
        data: hit,
        linkBuffed: Object.values(hit.consumedStacks || {}).some((value) => (Number(value) || 0) > 0),
      }
    })

  const actionStart = resolvedAction.realStartTime
  const trackActionStarts = [...(store.compiledTimeline?.actionMap.entries() ?? [])]
    .filter(([, action]) => action.trackId === resolvedAction.trackId)
    .map(([id, action]) => ({ id, start: action.realStartTime }))
    .sort((left, right) => right.start - left.start)

  const triggeredHits = (store.simLog || [])
    .filter((entry) => entry.type === 'DAMAGE_HIT')
    .filter((entry) => entry.payload.hitData?.triggered)
    .filter((entry) => !entry.payload.hitData?._reactionMeta)
    .filter((entry) => !String(entry.payload.hitData?.triggeredBy || '').startsWith('dot:'))
    .filter((entry) => entry.payload.sourceId === resolvedAction.trackId)
    .filter((entry) => {
      const owner = trackActionStarts.find((item) => item.start <= entry.time)
      return owner?.id === props.action.instanceId
    })
    .filter((entry) => !isCoveredBeforeStart(entry.time))
    .map((entry) => {
      const left = store.timeToPx(entry.time) - store.timeToPx(actionStart)
      return {
        style: { left: `${left}px` },
        data: entry.payload.hitData,
        linkBuffed: Object.values(entry.payload.hitData?.consumedStacks || {}).some((value) => (Number(value) || 0) > 0),
        _time: entry.time,
      }
    })

  const groupedTriggeredHits = new Map()
  triggeredHits.forEach((hit) => {
    const key = Number(hit._time) || 0
    if (!groupedTriggeredHits.has(key)) groupedTriggeredHits.set(key, [])
    groupedTriggeredHits.get(key).push(hit)
  })
  groupedTriggeredHits.forEach((group) => {
    group.forEach((hit, index) => {
      hit.style['--stack-index'] = index
    })
  })

  return [...baseHits, ...triggeredHits]
})

const showPorts = computed(() => {
  if (isGhostMode.value) {
    return false
  }
  if (connectionHandler.isDragging.value) {
    if (store.hoveredActionId === props.action.instanceId && props.action.instanceId !== connectionHandler.state.value.sourceId) {
      return true
    }
    return false
  } else if (store.hoveredActionId === props.action.instanceId && connectionHandler.toolEnabled.value) {
    return true
  }
  return false
})

const isActionValidConnectionTarget = computed(() => {
  return connectionHandler.isNodeValid(props.action.instanceId)
})

function handleConnectionDrop(port) {
  connectionHandler.endDrag(props.action.instanceId, port)
}

function handleConnectionSnap(port, snapPos) {
  if (connectionHandler.isNodeValid(props.action.instanceId)) {
    connectionHandler.snapTo(props.action.instanceId, port, snapPos);
  }
}

function handleActionDragStart(startPos, port) {
  connectionHandler.newConnectionFrom(startPos, props.action.instanceId, port)
}
</script>

<template>
  <div :id="`action-${action.instanceId}`" ref="actionElRef" class="action-item-wrapper" :data-id="action.instanceId"
       :class="{ 'is-link-target-invalid': !isActionValidConnectionTarget && connectionSourceActionId !== action.instanceId, 'is-perfect-link-action': isPerfectLinkAction }"
       @mouseenter="store.setHoveredAction(action.instanceId)"
       @mouseleave="store.setHoveredAction(null)"
       :style="style"
       @click.stop
       @dragstart.prevent>
    <div v-if="showDecorations && !isGhostMode && effectiveComboCooldown > 0" class="cd-bar-container bottom-bar" :style="cdStyle">
      <div class="cd-line" :style="{ backgroundColor: themeColor }"></div>

      <span class="cd-text" :style="{ color: themeColor }">{{ store.formatTimeLabel(effectiveComboCooldown) }}</span>

      <div class="cd-end-mark"
           :style="{
         backgroundColor: themeColor,
         zIndex: 1
       }">
      </div>
    </div>

    <div v-if="showDecorations && !isGhostMode && effectiveUltimateCooldown > 0" class="cd-bar-container bottom-bar" :style="ultCdStyle">
      <div class="cd-line" :style="{ backgroundColor: store.getColor('ultimate') }"></div>

      <span class="cd-text" :style="{ color: store.getColor('ultimate') }">{{ store.formatTimeLabel(effectiveUltimateCooldown) }}</span>

      <div class="cd-end-mark"
           :style="{
         backgroundColor: store.getColor('ultimate'),
         zIndex: 1
       }">
      </div>
    </div>

    <div v-if="showDecorations && !isGhostMode && action.type === 'ultimate' && (action.enhancementTime || 0) > 0"
         class="cd-bar-container bottom-bar"
         :style="enhancementStyle">

      <div class="cd-line" style="background-color: #b37feb;"></div>
      <span class="cd-text" style="color: #b37feb;">
        {{ store.formatTimeLabel(action.enhancementTime) }}
        <span v-if="enhancementMetrics.extensionAmount > 0" class="extension-label">
          (+{{ store.formatTimeLabel(enhancementMetrics.extensionAmount) }})
        </span>
      </span>
      <div class="cd-end-mark" style="background-color: #b37feb;"></div>

    </div>

    <template v-if="showDecorations && !isGhostMode">
      <div v-for="(barItem, idx) in customBarsToRender" :key="idx"
           class="custom-blue-bar bottom-bar" :style="barItem.style">
        <div class="cb-line"></div>
        <div class="cb-end-mark"></div>
        <span v-if="barItem.text" class="cb-label">{{ barItem.text }}</span>

        <span class="cb-duration">
          {{ store.formatTimeLabel(barItem.originalDuration) }}
          <span v-if="barItem.extensionAmount > 0" class="extension-label">(+{{ store.formatTimeLabel(barItem.extensionAmount) }})</span>
        </span>
      </div>
    </template>

    <div v-if="!isGhostMode" class="damage-ticks-layer">
      <div v-for="(tick, idx) in renderableHits" :key="idx"
           class="damage-tick-wrapper"
           :style="tick.style">
        <div
          class="tick-marker"
          :class="{
            'is-triggered': tick.data?.triggered,
            'is-link-buffed': tick.linkBuffed,
            'is-forced-crit': store.isHitForcedCrit(tick.data?._actionInstanceId, tick.data?._hitIndex),
          }"
          :title="getDamageHitTitle(tick)"
          @mousedown.stop="onDamageHitClick(tick)"
        ></div>
      </div>
    </div>

    <div v-if="showDecorations && action.triggerWindow && action.triggerWindow !== 0" class="trigger-window-bar bottom-bar" :style="triggerWindowStyle">
      <div class="tw-dot"></div>
      <div class="tw-separator"></div>
    </div>

    <div v-if="showDecorations && action.isLocked" class="status-icon lock-icon" :title="t('actionItem.lockedTitle')">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>

    <div v-if="showDecorations && action.isDisabled" class="status-icon mute-icon" :title="t('actionItem.disabledTitle')">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
      </svg>
    </div>

    <template v-if="showDecorations && action.type === 'ultimate' && !action.isDisabled">
      <div class="ultimate-side-bar left-bar" :style="{ backgroundColor: themeColor }"></div>
      <div class="ultimate-side-bar right-bar" :style="{ backgroundColor: themeColor }"></div>
    </template>

    <div v-if="!isGhostMode" class="action-item-content drag-handle" :class="{ 'is-link-target-invalid': !isActionValidConnectionTarget && connectionSourceActionId !== action.instanceId }">
      {{ displayLabel }}
      <div v-if="animationTimeWidth > 0"
           class="animation-phase-overlay"
           :style="{ width: `${animationTimeWidth}px` }">
        <div class="shimmer-bar"></div>
      </div>
    </div>

    <ActionLinkPorts @drop="handleConnectionDrop" @snap="handleConnectionSnap"
                     @drag-start="handleActionDragStart" @clear-snap="connectionHandler.clearSnap"
                     :isDragging="connectionHandler.isDragging.value"
                     :disabled="!isActionValidConnectionTarget"
                     :canStart="connectionHandler.toolEnabled.value"
                     :rect="store.nodeRects[action.instanceId]?.rect"
                     v-if="showPorts && showDecorations"
                     :color="themeColor" />
  </div>
</template>

<style scoped>
/* === 基础容器 === */
.action-item-wrapper {
  display: flex; align-items: center; justify-content: center;
  white-space: nowrap; cursor: grab; user-select: none;
  position: relative; overflow: visible;
  transition: background-color 0.2s, box-shadow 0.2s, filter 0.2s;
  font-weight: bold; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
.action-item-wrapper:hover { filter: brightness(1.2); }

.action-item-wrapper.is-perfect-link-action::after {
  content: '';
  position: absolute;
  inset: -2px;
  border: 1px solid rgba(255, 242, 168, 0.9);
  border-radius: 3px;
  box-shadow: 0 0 14px rgba(255, 215, 0, 0.7);
  pointer-events: none;
  z-index: 4;
  animation: perfect-link-action-pulse 1.15s ease-in-out infinite;
}

@keyframes perfect-link-action-pulse {
  0%, 100% {
    opacity: 0.65;
  }
  50% {
    opacity: 1;
  }
}

/* === 异常状态层 === */

.status-icon {
  position: absolute;
  top: 2px;
  font-size: 10px;
  z-index: 25;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));
  pointer-events: none;
}
.lock-icon {
  left: 2px;
}
.mute-icon {
  right: 2px;
}

.action-item-content {
  &.is-link-target-invalid {
    opacity: 0.5;
  }
}

/* 伤害节点样式 */
.damage-ticks-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 12;
}

.damage-tick-wrapper {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  margin-left: -4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  pointer-events: none;
  z-index: 20;
}

.tick-marker {
  position: relative;
  width: 6px;
  height: 6px;
  background-color: #ff4d4f;
  border: 1px solid #333;
  transform: translateY(50%) rotate(45deg);
  box-shadow: 0 1px 2px rgba(0,0,0,0.5);
  transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: auto;
  cursor: default;
}

.tick-marker.is-triggered {
  background-color: #faad14;
  border-color: #d48806;
  transform: translateY(calc(50% + 14px + var(--stack-index, 0) * 10px)) rotate(45deg);
}

.tick-marker.is-link-buffed {
  background-color: #64c8ff;
  border-color: #3a9fd4;
  box-shadow: 0 0 6px rgba(100, 200, 255, 0.8);
}

.tick-marker.is-forced-crit {
  background-color: #ff6b6b;
  border-color: #ffd166;
  box-shadow: 0 0 8px rgba(255, 209, 102, 0.9);
}

.tick-marker:hover {
  background-color: #ffd700;
  border-color: #fff;
  transform: translateY(50%) rotate(45deg) scale(1.65);
  box-shadow: 0 0 8px rgba(255, 215, 0, 1);
  z-index: 30;
}

.tick-marker.is-triggered:hover {
  transform: translateY(calc(50% + 14px + var(--stack-index, 0) * 10px)) rotate(45deg) scale(1.35);
}

/* === 其他样式 === */
.bottom-bar { 
  bottom: 0;
  left: 0;
  position: absolute;
 }

.cd-bar-container { position: absolute; height: 2px; display: flex; align-items: center; pointer-events: none; }
.cd-line { flex-grow: 1; height: 2px; }
.cd-text { position: absolute; left: 0; top: 4px; font-size: 10px; font-weight: bold; line-height: 1; }
.cd-end-mark { position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 1px; height: 8px; }

.custom-blue-bar { height: 2px; display: flex; align-items: center; color: #69c0ff; z-index: 5; }
.cb-line { flex-grow: 1; height: 2px; background-color: #69c0ff; }
.cb-label {
  position: absolute; right: 100%; margin-right: 6px; top: 50%; transform: translateY(-50%);
  font-size: 10px; font-weight: bold; white-space: nowrap; line-height: 1; color: #69c0ff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}
.cb-duration { position: absolute; left: 0; top: 4px; font-size: 10px; font-weight: bold; line-height: 1; color: #69c0ff; display: flex; align-items: center; }
.cb-end-mark { position: absolute; right: 0; width: 1px; height: 8px; background-color: #69c0ff; top: 50%; transform: translateY(-50%); }

.trigger-window-bar {
  position: absolute; --tw-width: 0px; --tw-color: transparent;
  width: var(--tw-width); height: 2px;
  display: flex; align-items: center; pointer-events: auto; cursor: pointer; z-index: 5;
}
.trigger-window-bar::after { content: ''; position: absolute; top: -4px; bottom: -4px; left: 0; right: 0; background: transparent; }
.trigger-window-bar::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); height: 2px; background-color: var(--tw-color); opacity: 1; border-radius: 2px 0 0 2px; }
.tw-separator { position: absolute; right: 0; top: -2px; width: 1px; height: 8px; background-color: var(--tw-color); transform: translateX(50%); }
.tw-dot { position: absolute; left: 0; top: 50%; width: 1px; height: 8px; background-color: var(--tw-color); border-radius: 0; z-index: 6; transform: translate(-50%, -50%); }

.ultimate-side-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  z-index: 2;
  pointer-events: none;
}

.left-bar {
  left: 0;
  border-radius: 2px 0 0 2px;
}

.right-bar {
  right: 0;
  border-radius: 0 2px 2px 0;
}

.animation-phase-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  max-width: calc(100% - 1px);
  pointer-events: none;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 1;
}

.shimmer-bar {
  position: absolute;
  inset: 0;
  width: 200%;
  background: linear-gradient(
    90deg, 
    rgba(255, 255, 255, 0) 0%, 
    rgba(255, 255, 255, 0.15) 50%, 
    rgba(255, 255, 255, 0) 100%
  );
  will-change: transform;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { 
    transform: translateX(-100%); 
  }
  100% { 
    transform: translateX(50%); 
  }
}
</style>
