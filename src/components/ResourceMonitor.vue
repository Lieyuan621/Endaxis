<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { storeToRefs } from 'pinia'
import CustomNumberInput from './CustomNumberInput.vue'
import ConnectionPath from './ConnectionPath.vue'
import { Search } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const store = useTimelineStore()
const { t } = useI18n({ useScope: 'global' })

const { enemyDatabase, enemyCategories } = storeToRefs(store)
const ENEMY_TIERS = store.ENEMY_TIERS
const TIER_WEIGHTS = { 'boss': 5, 'head': 4, 'champion': 3, 'elite': 2, 'normal': 1 }

// === 布局常量 ===
const MIN_CHART_HEIGHT = 116
const MAX_CHART_HEIGHT = 520

const monitorRootRef = ref(null)
const chartViewportRef = ref(null)
const monitorHeight = ref(0)
const chartViewportHeight = ref(0)

let resizeObserver = null
let resizeRaf = null
let sectionResizeState = null

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function beginSectionResize(which, event) {
  event.preventDefault()
  sectionResizeState = {
    upperKey: which.upperKey,
    lowerKey: which.lowerKey,
    startY: event.clientY,
    heights: { ...SECTION_BODY_HEIGHTS.value },
  }
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'ns-resize'
  window.addEventListener('pointermove', onSectionResizeMove)
  window.addEventListener('pointerup', endSectionResize, { once: true })
}

function onSectionResizeMove(event) {
  if (!sectionResizeState) return

  const dy = event.clientY - sectionResizeState.startY
  const base = sectionResizeState.heights

  let aff = base.affliction
  let stg = base.stagger
  let sp = base.sp

  const minMap = {
    affliction: MIN_AFFLICTION_HEIGHT,
    stagger: MIN_STAGGER_HEIGHT,
    sp: MIN_SP_HEIGHT,
  }
  const upperKey = sectionResizeState.upperKey
  const lowerKey = sectionResizeState.lowerKey
  const pairTotal = base[upperKey] + base[lowerKey]
  const nextUpper = clamp(base[upperKey] + dy, minMap[upperKey], pairTotal - minMap[lowerKey])
  const nextLower = pairTotal - nextUpper

  if (upperKey === 'affliction') aff = nextUpper
  if (upperKey === 'stagger') stg = nextUpper
  if (upperKey === 'sp') sp = nextUpper

  if (lowerKey === 'affliction') aff = nextLower
  if (lowerKey === 'stagger') stg = nextLower
  if (lowerKey === 'sp') sp = nextLower

  sectionWeights.value = normalizeWeights({
    affliction: aff,
    stagger: stg,
    sp,
  })
}

function endSectionResize() {
  sectionResizeState = null
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  window.removeEventListener('pointermove', onSectionResizeMove)
  persistSectionWeights()
}

function flushMonitorMetrics() {
  resizeRaf = null
  monitorHeight.value = monitorRootRef.value?.clientHeight || 0
  chartViewportHeight.value = chartViewportRef.value?.clientHeight || 0
}

function queueMonitorMetrics() {
  if (resizeRaf !== null) return
  resizeRaf = requestAnimationFrame(flushMonitorMetrics)
}

onMounted(() => {
  queueMonitorMetrics()
  if (typeof ResizeObserver === 'undefined') return

  resizeObserver = new ResizeObserver(() => {
    queueMonitorMetrics()
  })

  if (monitorRootRef.value) resizeObserver.observe(monitorRootRef.value)
  if (chartViewportRef.value) resizeObserver.observe(chartViewportRef.value)
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (resizeRaf !== null) {
    cancelAnimationFrame(resizeRaf)
    resizeRaf = null
  }
  window.removeEventListener('pointermove', onSectionResizeMove)
  sectionResizeState = null
})

const TOTAL_HEIGHT = computed(() => {
  const measured = chartViewportHeight.value || 200
  return clamp(Math.round(measured), MIN_CHART_HEIGHT, MAX_CHART_HEIGHT)
})

const SECTION_TOPBAR_HEIGHT = 14
const SECTION_RESIZE_HANDLE_HEIGHT = 0

const DEFAULT_SECTION_WEIGHTS = Object.freeze({
  affliction: 2,
  stagger: 1,
  sp: 3,
})

const MIN_AFFLICTION_HEIGHT = 46
const MIN_STAGGER_HEIGHT = 26
const MIN_SP_HEIGHT = 52
const COLLAPSED_STRIP_HEIGHT = 14
const SECTION_COLLAPSE_KEY = 'endaxis:resource-monitor-section-collapse:v1'
const SECTION_KEYS = ['affliction', 'stagger', 'sp']

const SECTION_LAYOUT_KEY = 'endaxis:resource-monitor-sections:v1'
const sectionWeights = ref({ ...DEFAULT_SECTION_WEIGHTS })
const sectionCollapsed = ref({
  affliction: false,
  stagger: false,
  sp: false,
})

function normalizeWeights(next) {
  const a = Math.max(0.1, Number(next?.affliction) || DEFAULT_SECTION_WEIGHTS.affliction)
  const s = Math.max(0.1, Number(next?.stagger) || DEFAULT_SECTION_WEIGHTS.stagger)
  const sp = Math.max(0.1, Number(next?.sp) || DEFAULT_SECTION_WEIGHTS.sp)
  return { affliction: a, stagger: s, sp }
}

function persistSectionWeights() {
  try {
    localStorage.setItem(SECTION_LAYOUT_KEY, JSON.stringify(sectionWeights.value))
  } catch {
    // ignore
  }
}

function restoreSectionWeights() {
  try {
    const raw = localStorage.getItem(SECTION_LAYOUT_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    sectionWeights.value = normalizeWeights(parsed)
  } catch {
    // ignore
  }
}

function normalizeSectionCollapsed(next) {
  return {
    affliction: next?.affliction === true,
    stagger: next?.stagger === true,
    sp: next?.sp === true,
  }
}

function persistSectionCollapsed() {
  try {
    localStorage.setItem(SECTION_COLLAPSE_KEY, JSON.stringify(sectionCollapsed.value))
  } catch {
    // ignore
  }
}

function restoreSectionCollapsed() {
  try {
    const raw = localStorage.getItem(SECTION_COLLAPSE_KEY)
    if (!raw) return
    sectionCollapsed.value = normalizeSectionCollapsed(JSON.parse(raw))
  } catch {
    // ignore
  }
}

function getNormalizedCollapsedState(source = sectionCollapsed.value) {
  const normalized = normalizeSectionCollapsed(source)
  if (normalized.affliction && normalized.stagger && normalized.sp) {
    normalized.sp = false
  }
  return normalized
}

function toggleSectionCollapsed(which) {
  if (!SECTION_KEYS.includes(which)) return
  const next = getNormalizedCollapsedState({
    ...sectionCollapsed.value,
    [which]: !sectionCollapsed.value[which],
  })
  sectionCollapsed.value = next
  persistSectionCollapsed()
}

onMounted(() => {
  restoreSectionWeights()
  restoreSectionCollapsed()
})

const activeSectionCollapsed = computed(() => getNormalizedCollapsedState())
const expandedSectionKeys = computed(() => SECTION_KEYS.filter(key => !activeSectionCollapsed.value[key]))
const expandedSectionCount = computed(() => expandedSectionKeys.value.length)
const resizeHandleItems = computed(() => {
  return expandedSectionKeys.value.slice(1).map((lowerKey, index) => ({
    upperKey: expandedSectionKeys.value[index],
    lowerKey,
  }))
})
const visibleResizeHandleCount = computed(() => resizeHandleItems.value.length)
const EXPANDED_SECTION_BODY_SPACE = computed(() => {
  return Math.max(
    96,
    TOTAL_HEIGHT.value
      - SECTION_TOPBAR_HEIGHT * expandedSectionCount.value
      - COLLAPSED_STRIP_HEIGHT * (SECTION_KEYS.length - expandedSectionCount.value)
      - SECTION_RESIZE_HANDLE_HEIGHT * visibleResizeHandleCount.value,
  )
})

const sectionLayout = computed(() => {
  const collapsed = activeSectionCollapsed.value
  const expanded = expandedSectionKeys.value
  const heights = { affliction: 0, stagger: 0, sp: 0 }
  const minMap = {
    affliction: MIN_AFFLICTION_HEIGHT,
    stagger: MIN_STAGGER_HEIGHT,
    sp: MIN_SP_HEIGHT,
  }
  const expandedContent = Math.max(0, EXPANDED_SECTION_BODY_SPACE.value)

  if (expanded.length === 1) {
    heights[expanded[0]] = expandedContent
  } else if (expanded.length > 0) {
    const w = normalizeWeights(sectionWeights.value)
    const totalWeight = expanded.reduce((sum, key) => sum + w[key], 0)
    const minSum = expanded.reduce((sum, key) => sum + minMap[key], 0)

    if (expandedContent < minSum) {
      const scale = expandedContent / Math.max(1, minSum)
      let remaining = expandedContent
      expanded.forEach((key, index) => {
        const proposed = index === expanded.length - 1
          ? remaining
          : Math.max(8, Math.floor(minMap[key] * scale))
        heights[key] = proposed
        remaining -= proposed
      })
    } else {
      expanded.forEach((key) => {
        heights[key] = Math.round(expandedContent * (w[key] / totalWeight))
      })

      expanded.forEach((key) => {
        heights[key] = Math.max(minMap[key], heights[key])
      })

      let sum = expanded.reduce((acc, key) => acc + heights[key], 0)
      if (sum > expandedContent) {
        let overflow = sum - expandedContent
        const shrinkOrder = ['affliction', 'stagger', 'sp'].filter((key) => expanded.includes(key))
        shrinkOrder.forEach((key) => {
          if (overflow <= 0) return
          const reducible = Math.max(0, heights[key] - minMap[key])
          const take = Math.min(overflow, reducible)
          heights[key] -= take
          overflow -= take
        })
      } else if (sum < expandedContent) {
        heights[expanded[expanded.length - 1]] += expandedContent - sum
      }
    }
  }

  SECTION_KEYS.forEach((key) => {
    if (collapsed[key]) {
      heights[key] = COLLAPSED_STRIP_HEIGHT
    }
  })

  let cursorTop = 0
  const ranges = {}
  SECTION_KEYS.forEach((key) => {
    const handleBeforeVisible = resizeHandleItems.value.some((item) => item.lowerKey === key)
    if (handleBeforeVisible) {
      cursorTop += SECTION_RESIZE_HANDLE_HEIGHT
    }

    const isCollapsed = collapsed[key]
    const bodyHeight = isCollapsed ? 0 : heights[key]
    const topbarHeight = isCollapsed ? 0 : SECTION_TOPBAR_HEIGHT
    const stripHeight = isCollapsed ? COLLAPSED_STRIP_HEIGHT : 0
    const topbarTop = cursorTop
    const bodyTop = topbarTop + topbarHeight
    const bodyBottom = bodyTop + bodyHeight
    const shellHeight = topbarHeight + bodyHeight + stripHeight
    ranges[key] = {
      topbarTop,
      topbarHeight,
      bodyTop,
      bodyBottom,
      bodyHeight,
      stripHeight,
      shellHeight,
      collapsed: isCollapsed,
      handleBeforeVisible,
    }

    cursorTop += shellHeight
  })

  return { heights, ranges }
})

const SECTION_BODY_HEIGHTS = computed(() => sectionLayout.value.heights)
const sectionRects = computed(() => sectionLayout.value.ranges)
const chartLabelFontSize = computed(() => 9)
const warningLabelText = computed(() => t('resourceMonitor.sp.insufficient'))

const gridLineTimes = computed(() => {
  const prep = Number(store.prepDuration) || 0
  const startBt = -prep
  const endBt = store.TOTAL_DURATION
  const start = Math.ceil(startBt / 5) * 5
  const result = []
  for (let bt = start; bt <= endBt; bt += 5) {
    result.push(bt + prep)
  }
  return result
})

// === 颜色常量 ===
const COLOR_STAGGER = '#ff7875'
const COLOR_LIMIT = '#d32f2f'
const COLOR_SP_MAIN = '#ffd700'
const COLOR_SP_WARN = '#ff4d4f'

const AFFLICTION_COLORS = {
  ELEMENT_HEAT: '#ff4d4f',
  ELEMENT_CRYO: '#00e5ff',
  ELEMENT_ELECTRIC: '#ffd666',
  ELEMENT_NATURE: '#73d13d',
  ELEMENT_COMBUSTION: '#ff7875',
  ELEMENT_ELECTRIFICATION: '#fff566',
  ELEMENT_SOLIDIFICATION: '#40a9ff',
  ELEMENT_CORROSION: '#95de64',
  ELEMENT_HEAT_BURST: '#ff7875',
  ELEMENT_CRYO_BURST: '#69c0ff',
  ELEMENT_ELECTRIC_BURST: '#fff566',
  ELEMENT_NATURE_BURST: '#b7eb8f',
  PHYSICAL_VULNERABLE: '#e0e0e0',
  PHYSICAL_KNOCK_DOWN: '#d9d9d9',
  PHYSICAL_LIFT: '#d9d9d9',
  PHYSICAL_CRUSH: '#d9d9d9',
  PHYSICAL_BREACH: '#d9d9d9',
}

function getAfflictionColor(effectId) {
  return AFFLICTION_COLORS[effectId] || '#aaaaaa'
}

function getAfflictionIcon(effectId) {
  const map = {
    // Arts inflictions (attachments)
    ELEMENT_HEAT: '/icons/icon_energy_fusion_fire.webp',
    ELEMENT_CRYO: '/icons/icon_energy_fusion_cryst.webp',
    ELEMENT_ELECTRIC: '/icons/icon_energy_fusion_pulse.webp',
    ELEMENT_NATURE: '/icons/icon_energy_fusion_nature.webp',
    // Arts reactions (anomalies)
    ELEMENT_COMBUSTION: '/icons/icon_battle_debuff_burning.webp',
    ELEMENT_ELECTRIFICATION: '/icons/icon_battle_debuff_conduct.webp',
    ELEMENT_SOLIDIFICATION: '/icons/icon_battle_debuff_frozen.webp',
    ELEMENT_CORROSION: '/icons/icon_battle_debuff_corrupt.webp',
    // Bursts (treat as marker)
    ELEMENT_HEAT_BURST: '/icons/icon_burst_fusion_fire.webp',
    ELEMENT_CRYO_BURST: '/icons/icon_burst_fusion_cryst.webp',
    ELEMENT_ELECTRIC_BURST: '/icons/icon_burst_fusion_pulse.webp',
    ELEMENT_NATURE_BURST: '/icons/icon_burst_fusion_nature.webp',

	    // Physical statuses
	    PHYSICAL_VULNERABLE: '/icons/icon_battle_affix_physical_vulnerable.webp',
	    PHYSICAL_KNOCK_DOWN: '/icons/icon_battle_physical_knockdown.webp',
	    PHYSICAL_LIFT: '/icons/icon_battle_physical_airborne.webp',
	    PHYSICAL_CRUSH: '/icons/icon_battle_physical_crush.webp',
	    PHYSICAL_BREACH: '/icons/icon_battle_physical_fracture.webp',
	  }

  return map[effectId] || '/icons/default_icon.webp'
}

function getStackDurationSeconds(effectId, stacks) {
  const s = Math.max(1, Math.min(4, Number(stacks) || 1))
  if (effectId === 'ELEMENT_ELECTRIFICATION') return [12, 18, 24, 30][s - 1]
  if (effectId === 'ELEMENT_SOLIDIFICATION') return [6, 7, 8, 9][s - 1]
  if (effectId === 'PHYSICAL_BREACH') return [12, 18, 24, 30][s - 1]
  if (effectId === 'ELEMENT_CORROSION') return 15
  if (effectId === 'ELEMENT_COMBUSTION') return 10
  return null
}

function isArtsAttachment(effectId) {
  return (
    effectId === 'ELEMENT_HEAT' ||
    effectId === 'ELEMENT_CRYO' ||
    effectId === 'ELEMENT_ELECTRIC' ||
    effectId === 'ELEMENT_NATURE'
  )
}

function isArtsAnomaly(effectId) {
  return (
    effectId === 'ELEMENT_ELECTRIFICATION' ||
    effectId === 'ELEMENT_CORROSION' ||
    effectId === 'ELEMENT_COMBUSTION' ||
    effectId === 'ELEMENT_SOLIDIFICATION'
  )
}

function isBurst(effectId) {
  return typeof effectId === 'string' && effectId.endsWith('_BURST')
}

function isPhysical(effectId) {
  return typeof effectId === 'string' && effectId.startsWith('PHYSICAL_')
}

function isDurationControlled(effectId) {
  return effectId === 'PHYSICAL_BREACH' || isArtsAnomaly(effectId)
}

function isBossTarget(targetId) {
  return targetId === 'boss' || targetId === '' || targetId === undefined || targetId === null
}

function effectIdToTypeKey(effectId) {
  const map = {
    PHYSICAL_VULNERABLE: 'break',
    PHYSICAL_LIFT: 'knockup',
    PHYSICAL_KNOCK_DOWN: 'knockdown',
    PHYSICAL_BREACH: 'armor_break',
    PHYSICAL_CRUSH: 'stagger',

    ELEMENT_HEAT: 'blaze_attach',
    ELEMENT_CRYO: 'cold_attach',
    ELEMENT_ELECTRIC: 'emag_attach',
    ELEMENT_NATURE: 'nature_attach',

    ELEMENT_COMBUSTION: 'burning',
    ELEMENT_ELECTRIFICATION: 'conductive',
    ELEMENT_SOLIDIFICATION: 'frozen',
    ELEMENT_CORROSION: 'corrosion',

    ELEMENT_HEAT_BURST: 'blaze_burst',
    ELEMENT_CRYO_BURST: 'cold_burst',
    ELEMENT_ELECTRIC_BURST: 'emag_burst',
    ELEMENT_NATURE_BURST: 'nature_burst',
  }

  return map[effectId] || 'default'
}

function typeKeyToEffectId(typeKey) {
  const map = {
    blaze_attach: 'ELEMENT_HEAT',
    cold_attach: 'ELEMENT_CRYO',
    emag_attach: 'ELEMENT_ELECTRIC',
    nature_attach: 'ELEMENT_NATURE',
  }
  return map[typeKey] || null
}

function isAttachmentTypeKey(typeKey) {
  return (
    typeKey === 'blaze_attach' ||
    typeKey === 'cold_attach' ||
    typeKey === 'emag_attach' ||
    typeKey === 'nature_attach'
  )
}

function getMarkerPriority(typeKey) {
  const w = {
    armor_break: 500,
    knockup: 400,
    knockdown: 300,
    stagger: 200,
    break: 100,
  }
  return w[typeKey] || 0
}

function inferIncomingAttachmentTypeKeyAt(timeSeconds, logs, epsilon) {
  const time = Number(timeSeconds) || 0
  const timeline = store.compiledTimeline
  const actionMap = timeline?.actionMap
  if (!actionMap) return null

  for (let i = 0; i < logs.length; i++) {
    const entry = logs[i]
    if (!entry || entry.type !== 'REACTION_OCCURRED') continue
    if (Math.abs((Number(entry.time) || 0) - time) > epsilon) continue
    const actionId = entry.payload?.actionId
    if (!actionId) continue

    const action = actionMap.get(actionId)
    if (!action) continue

    const eff = (action.effects || []).find((e) => {
      if (!e) return false
      if (Math.abs((Number(e.realStartTime) || 0) - time) > epsilon) return false
      return isAttachmentTypeKey(e.node?.type)
    })

    if (eff?.node?.type) {
      return eff.node.type
    }
  }

  return null
}

const afflictionViz = computed(() => {
  const endTime = Number(store.viewDuration) || store.TOTAL_DURATION
  const epsilon = 0.001

  const logs = Array.isArray(store.simLog) ? store.simLog : []

  // For durationless effects, show as marker icons.
  const physicalMarkers = []
  const physicalSegments = []
  const attachmentSegments = []
  const attachmentMarkers = []
  const anomalySegments = []
  const anomalyMarkers = []

  // Track open segments by effectId for effects we treat as segments (override/refresh behaviour).
  const open = new Map()

  function closeOpen(effectId, end) {
    const seg = open.get(effectId)
    if (!seg) return
    open.delete(effectId)
    const finalEnd = Math.min(endTime, end)
    if (Number.isFinite(seg.start) && Number.isFinite(finalEnd) && finalEnd > seg.start + epsilon) {
      seg.end = finalEnd
      if (seg.kind === 'physical') physicalSegments.push(seg)
      else if (seg.kind === 'attachment') attachmentSegments.push(seg)
      else if (seg.kind === 'anomaly') anomalySegments.push(seg)
    }
  }

  // Step 1: process EFFECT_START and build segments/markers.
  logs.forEach((entry) => {
    if (!entry || !entry.type) return
    if (entry.type !== 'EFFECT_START') return

    const effectId = entry.payload?.effectSnapshot?.id
    const targetId = entry.payload?.targetId
    if (!effectId || !isBossTarget(targetId)) return

    const time = Number(entry.time) || 0
    const stacks = Number(entry.payload?.effectSnapshot?.currentStacks) || 1

    // Bursts are treated as instant markers.
    if (isBurst(effectId)) {
      anomalyMarkers.push({ effectId, time })
      return
    }

    // Physical: only Breach has defined duration; others show as markers (per requirement).
    if (isPhysical(effectId)) {
      const dur = getStackDurationSeconds(effectId, stacks)
      if (!dur) {
        physicalMarkers.push({ effectId, time, stacks })
        return
      }

      closeOpen(effectId, time)
      open.set(effectId, {
        kind: 'physical',
        effectId,
        stacks,
        start: time,
        end: time + dur,
      })
      return
    }

    // Arts attachment: single lane; show as segments. No explicit duration, ends when consumed or overridden.
    if (isArtsAttachment(effectId)) {
      // Close any other attachment at this time (only one should exist).
      for (const [openId, seg] of open.entries()) {
        if (seg.kind === 'attachment' && openId !== effectId) {
          closeOpen(openId, time)
        }
      }
      closeOpen(effectId, time)
      open.set(effectId, {
        kind: 'attachment',
        effectId,
        stacks,
        start: time,
        end: endTime,
      })
      return
    }

    // Arts anomalies: durations are specified; can be packed into rows.
    if (isArtsAnomaly(effectId)) {
      const dur = getStackDurationSeconds(effectId, stacks)
      if (!dur) {
        anomalyMarkers.push({ effectId, time, stacks })
        return
      }

      closeOpen(effectId, time)
      open.set(effectId, {
        kind: 'anomaly',
        effectId,
        stacks,
        start: time,
        end: time + dur,
      })
      return
    }

    // Unknown element effects: show as markers.
    attachmentMarkers.push({ effectId, time, stacks })
  })

  // Step 2: process EFFECT_END to close segments early (consumption/expiration).
  logs.forEach((entry) => {
    if (!entry || entry.type !== 'EFFECT_END') return
    const effectId = entry.payload?.effectId
    const targetId = entry.payload?.targetId
    if (!effectId || !isBossTarget(targetId)) return
    const time = Number(entry.time) || 0
    const endType = entry.payload?.type

    if (!Number.isFinite(time)) return

    if (endType === 'consumption' && isArtsAttachment(effectId)) {
      const incomingTypeKey = inferIncomingAttachmentTypeKeyAt(time, logs, epsilon)
      const incomingEffectId = incomingTypeKey ? typeKeyToEffectId(incomingTypeKey) : null
      attachmentMarkers.push({ effectId: incomingEffectId || effectId, time, stacks: 1 })
    }
    closeOpen(effectId, time)
  })

  // Step 3: close remaining open segments to endTime.
  for (const [effectId, seg] of open.entries()) {
    closeOpen(effectId, seg.end ?? endTime)
  }

  // Step 4: pack anomalies into rows (first-fit, reuse row once it ends).
  anomalySegments.sort((a, b) => a.start - b.start)
  const rowEnds = []
  anomalySegments.forEach((seg) => {
    const start = seg.start
    let row = rowEnds.findIndex((end) => end <= start + epsilon)
    if (row === -1) {
      row = rowEnds.length
      rowEnds.push(seg.end)
    } else {
      rowEnds[row] = seg.end
    }
    seg.row = row
  })

  return {
    physical: { segments: physicalSegments, markers: physicalMarkers },
    attachment: { segments: attachmentSegments, markers: attachmentMarkers },
    anomalies: { segments: anomalySegments, markers: anomalyMarkers, rowCount: rowEnds.length },
  }
})

function getTypeIcon(typeKey) {
  return store.iconDatabase?.[typeKey] || store.iconDatabase?.default || '/icons/default_icon.webp'
}

function getTypeColor(typeKey) {
  return store.getColor?.(typeKey) || '#aaaaaa'
}

const afflictionItems = computed(() => {
  const iconSize = Number(afflictionLayout.value.iconSize) || 20
  const rowHeight = Number(afflictionLayout.value.rowHeight) || 20
  const gap = Number(afflictionLayout.value.gap) || 4
  const epsilon = 0.001

  const out = []

  // segments
  for (const seg of afflictionViz.value.physical.segments || []) {
    const typeKey = effectIdToTypeKey(seg.effectId)
    out.push({
      row: 'physical',
      rowIndex: 0,
      isMarker: false,
      startTime: seg.start,
      endTime: seg.end,
      typeKey,
      stacks: seg.stacks || 1,
      slotIndex: 0,
    })
  }

  for (const seg of afflictionViz.value.attachment.segments || []) {
    const typeKey = effectIdToTypeKey(seg.effectId)
    out.push({
      row: 'attach',
      rowIndex: 0,
      isMarker: false,
      startTime: seg.start,
      endTime: seg.end,
      typeKey,
      stacks: seg.stacks || 1,
      slotIndex: 0,
    })
  }

  for (const seg of afflictionViz.value.anomalies.segments || []) {
    const typeKey = effectIdToTypeKey(seg.effectId)
    out.push({
      row: 'anomaly',
      rowIndex: Number(seg.row) || 0,
      isMarker: false,
      startTime: seg.start,
      endTime: seg.end,
      typeKey,
      stacks: seg.stacks || 1,
      slotIndex: 0,
    })
  }

  // markers (need slotIndex by time group)
  function pushGroupedMarkers(row, rowIndex, markers) {
    const groups = []
    for (const m of markers || []) {
      const time = Number(m.time) || 0
      const typeKey = effectIdToTypeKey(m.effectId)
      let g = groups.find((x) => Math.abs(x.time - time) <= epsilon)
      if (!g) {
        g = { time, list: [] }
        groups.push(g)
      }
      g.list.push({ typeKey, stacks: m.stacks || 1 })
    }

    groups.sort((a, b) => a.time - b.time)
    groups.forEach((g) => {
      if (row === 'physical') {
        const breakItem = g.list.find((x) => x.typeKey === 'break')
        if (breakItem) {
          let replaced = false
          g.list = g.list.map((x) => {
            if (x.typeKey === 'knockup' || x.typeKey === 'knockdown') {
              replaced = true
              return { ...x, stacks: Math.max(Number(x.stacks) || 1, Number(breakItem.stacks) || 1) }
            }
            return x
          })
          if (replaced) {
            g.list = g.list.filter((x) => x.typeKey !== 'break')
          }
        }
      }

      g.list.sort((a, b) => getMarkerPriority(b.typeKey) - getMarkerPriority(a.typeKey))
      g.list.forEach((it, idx) => {
        out.push({
          row,
          rowIndex,
          isMarker: true,
          startTime: g.time,
          endTime: null,
          typeKey: it.typeKey,
          stacks: it.stacks || 1,
          slotIndex: idx,
        })
      })
    })
  }

  pushGroupedMarkers('physical', 0, afflictionViz.value.physical.markers)
  pushGroupedMarkers('attach', 0, afflictionViz.value.attachment.markers)
  pushGroupedMarkers('anomaly', 0, afflictionViz.value.anomalies.markers)

  // calculate px/top in-place for rendering
  return out.map((it, idx) => {
    const leftBase = store.timeToPx(it.startTime)
    const left = leftBase + (it.isMarker ? it.slotIndex * (iconSize + 2) : 0)

    let top = afflictionLayout.value.yPhysical
    if (it.row === 'attach') top = afflictionLayout.value.yAttachment
    else if (it.row === 'anomaly') top = afflictionLayout.value.yAnomalyStart + (it.rowIndex || 0) * (rowHeight + gap)

    const barWidth =
      it.isMarker || !Number.isFinite(it.endTime)
        ? 0
        : Math.max(0, store.timeToPx(it.endTime) - leftBase - iconSize - 2)

    return {
      ...it,
      _key: `${it.row}-${it.isMarker ? 'm' : 's'}-${it.typeKey}-${it.startTime}-${it.rowIndex}-${it.slotIndex}-${idx}`,
      leftPx: left,
      topPx: top + Math.floor((rowHeight - iconSize) / 2),
      barWidthPx: barWidth,
    }
  })
})

const afflictionConnectionItems = computed(() => {
  const iconSize = Number(afflictionLayout.value.iconSize) || 20
  return afflictionItems.value
    .filter((it) => !it.isMarker && it.row === 'attach' && it.barWidthPx > 0)
    .map((it) => {
      const y = it.topPx + iconSize / 2
      const startX = it.leftPx + iconSize
      const endX = it.leftPx + iconSize + 2 + it.barWidthPx
      const color = getTypeColor(it.typeKey)

      return {
        key: `${it._key}-link`,
        startPoint: { x: startX, y },
        endPoint: { x: endX, y },
        colors: { start: color, end: color },
      }
    })
})

const afflictionLayout = computed(() => {
  const height = Math.max(0, sectionRects.value.affliction?.bodyHeight || 0)

  const header = 0
  const padding = 0
  const icon = 20
  const gap = 4

  const baseRows = 2 // physical + attachment
  const anomalyRows = Math.max(0, afflictionViz.value.anomalies.rowCount)
  const totalRows = baseRows + Math.max(1, anomalyRows)

  const available = Math.max(0, height - header - padding * 2 - gap * (totalRows - 1))
  const rawRow = Math.floor(available / totalRows)
  const rowHeight = Math.max(14, Math.min(20, rawRow))

  const startY = header + padding
  const yPhysical = startY
  const yAttachment = yPhysical + rowHeight + gap
  const yAnomalyStart = yAttachment + rowHeight + gap

  return {
    height,
    headerHeight: header,
    padding,
    gap,
    iconSize: Math.min(icon, rowHeight),
    rowHeight,
    yPhysical,
    yAttachment,
    yAnomalyStart,
    totalRows,
  }
})

// === 敌人选择器逻辑 ===
const CATEGORY_ALL = '__ALL__'
const CATEGORY_UNCATEGORIZED = '__UNCAT__'
const isEnemySelectorVisible = ref(false)
const enemySearchQuery = ref('')
const activeCategoryTab = ref(CATEGORY_ALL)

const activeEnemyInfo = computed(() => {
  if (store.activeEnemyId === 'custom') {
    return { name: t('resourceMonitor.enemy.custom'), avatar: '', isCustom: true }
  }
  return store.enemyDatabase.find(e => e.id === store.activeEnemyId) || { name: t('resourceMonitor.enemy.unknown'), avatar: '' }
})

const groupedEnemyList = computed(() => {
  let list = enemyDatabase.value || []

  if (enemySearchQuery.value) {
    const q = enemySearchQuery.value.toLowerCase()
    list = list.filter(e => e.name.toLowerCase().includes(q))
  }

  const groups = {}

  const targetCategories = (activeCategoryTab.value === CATEGORY_ALL)
      ? [...enemyCategories.value, CATEGORY_UNCATEGORIZED]
      : [activeCategoryTab.value]

  targetCategories.forEach(cat => { groups[cat] = [] })

  list.forEach(enemy => {
    let cat = enemy.category
    if (!cat || !enemyCategories.value.includes(cat)) {
      cat = CATEGORY_UNCATEGORIZED
    }

    if (groups[cat]) {
      groups[cat].push(enemy)
    }
  })

  const result = []

  targetCategories.forEach(cat => {
    const enemyList = groups[cat]
    if (enemyList && enemyList.length > 0) {
      enemyList.sort((a, b) => (TIER_WEIGHTS[b.tier] || 0) - (TIER_WEIGHTS[a.tier] || 0))
      result.push({
        id: cat,
        name: cat === CATEGORY_UNCATEGORIZED ? t('common.uncategorized') : cat,
        list: enemyList
      })
    }
  })

  return result
})

function getTierColor(tierValue) {
  const tier = ENEMY_TIERS.find(t => t.value === tierValue)
  return tier ? tier.color : '#a0a0a0'
}

function getTierLabel(tierValue) {
  const tier = ENEMY_TIERS.find(t => t.value === tierValue)
  if (!tier) return ''
  if (tier.labelKey) return t(tier.labelKey)
  return tier.label || ''
}

function selectEnemy(id) {
  store.applyEnemyPreset(id)
  isEnemySelectorVisible.value = false
}

// === 数据计算 (失衡)===
const staggerResult = computed(() => {
  return store.staggerSeries
})
const staggerPoints = computed(() => staggerResult.value.points || [])
const lockSegments = computed(() => staggerResult.value.lockSegments || [])
const nodeSegments = computed(() => staggerResult.value.nodeSegments || [])
const STAGGER_BODY_HEIGHT = computed(() => Math.max(0, sectionRects.value.stagger?.bodyHeight || 0))

const scaleY_Stagger = computed(() => {
  const max = store.systemConstants.maxStagger
  if (!max || max <= 0) return 1
  return STAGGER_BODY_HEIGHT.value / max
})

const staggerPolyline = computed(() => {
  if (staggerPoints.value.length === 0) return ''
  return staggerPoints.value.map(p => {
    const x = store.timeToPx(p.time)
    const val = Math.min(p.val, store.systemConstants.maxStagger)
    const y = STAGGER_BODY_HEIGHT.value - (val * scaleY_Stagger.value)
    return `${x},${y}`
  }).join(' ')
})

const staggerArea = computed(() => {
  if (staggerPoints.value.length === 0) return ''
  const line = staggerPolyline.value
  const lastX = store.timeToPx(staggerPoints.value[staggerPoints.value.length - 1].time)
  return `0,${STAGGER_BODY_HEIGHT.value} ${line} ${lastX},${STAGGER_BODY_HEIGHT.value}`
})

const nodeZones = computed(() => nodeSegments.value.map(seg => ({
  x: store.timeToPx(seg.start),
  width: store.timeToPx(seg.end) - store.timeToPx(seg.start),
  y: STAGGER_BODY_HEIGHT.value - (seg.thresholdVal * scaleY_Stagger.value)
})))

const lockZones = computed(() => lockSegments.value.map(seg => ({
  x: store.timeToPx(seg.start),
  width: store.timeToPx(seg.end) - store.timeToPx(seg.start)
})))


// === 数据计算 (技力) ===
const spData = computed(() => {
  return store.spSeries
})
const SP_BODY_HEIGHT = computed(() => Math.max(0, sectionRects.value.sp?.bodyHeight || 0))
const SP_NEGATIVE_BUFFER = 40
const SP_TOTAL_RANGE = computed(() => 300 + SP_NEGATIVE_BUFFER)
const SP_ZERO_Y = computed(() => {
  return SP_BODY_HEIGHT.value * (300 / SP_TOTAL_RANGE.value)
})
const SP_WARNING_TAG_TOP = computed(() => `${Math.min(Math.max(6, SP_ZERO_Y.value + 4), Math.max(6, SP_BODY_HEIGHT.value - 18))}px`)

// 技力绘图坐标计算
const scaleY_SP = computed(() => {
  return SP_BODY_HEIGHT.value / SP_TOTAL_RANGE.value
})

const spPolyline = computed(() => {
  if (spData.value.length === 0) return ''
  return spData.value.map(p => {
    const x = store.timeToPx(p.time)
    const y = SP_ZERO_Y.value - (p.sp * scaleY_SP.value)
    return `${x},${y}`
  }).join(' ')
})

const spArea = computed(() => {
  if (spData.value.length === 0) return ''
  const points = spData.value.map(p => {
    const x = store.timeToPx(p.time)
    const y = SP_ZERO_Y.value - (p.sp * scaleY_SP.value)
    return `${x},${y}`
  })
  const lastX = store.timeToPx(spData.value[spData.value.length - 1].time)
  return `0,${SP_ZERO_Y.value} ${points.join(' ')} ${lastX},${SP_ZERO_Y.value}`
})

const spWarningZones = computed(() => spData.value.filter(p => p.sp < 0).map(p => ({
  left: store.timeToPx(p.time),
  sp: p.sp
})))

const transformStyle = computed(() => {
  return {
    transform: `translateX(${-store.timelineShift}px)`,
    willChange: 'transform'
  }
})
</script>

<template>
  <div ref="monitorRootRef" class="resource-monitor-layout">

    <div class="monitor-sidebar">
      <div class="enemy-select-module" @click="isEnemySelectorVisible = true">
        <div class="module-deco-line"></div>
        <div class="enemy-avatar-box">
          <img v-if="!activeEnemyInfo.isCustom" :src="activeEnemyInfo.avatar" @error="e=>e.target.src='/Endaxis/avatars/default_enemy.webp'" />
          <div v-else class="custom-avatar-placeholder">?</div>
          <div class="scan-line"></div>
        </div>
          <div class="enemy-info-col">
            <div class="enemy-name">{{ activeEnemyInfo.name }}</div>
            <div class="click-hint">{{ t('resourceMonitor.enemy.clickToChange') }}</div>
          </div>
        </div>

        <div class="settings-scroll-area">
          <div class="section-container tech-style border-red">
            <div class="panel-tag-mini red">{{ t('resourceMonitor.sections.enemy') }}</div>
            <div class="attribute-grid-mini">
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.maxStagger') }}</label>
                <CustomNumberInput v-model="store.systemConstants.maxStagger" :min="1" active-color="#ff7875" class="standard-input" />
              </div>
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.staggerNodes') }}</label>
                <CustomNumberInput v-model="store.systemConstants.staggerNodeCount" :min="0" class="standard-input" />
              </div>
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.nodeDuration') }}</label>
                <CustomNumberInput v-model="store.systemConstants.staggerNodeDuration" :step="0.1" active-color="#ff7875" class="standard-input" />
              </div>
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.breakDuration') }}</label>
                <CustomNumberInput v-model="store.systemConstants.staggerBreakDuration" :step="0.5" active-color="#ff7875" class="standard-input" />
              </div>
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.executionRecovery') }}</label>
                <CustomNumberInput v-model="store.systemConstants.executionRecovery" :min="0" class="standard-input" />
              </div>
            </div>
          </div>

          <div class="section-container tech-style border-gold">
            <div class="panel-tag-mini gold">{{ t('resourceMonitor.sections.team') }}</div>
            <div class="attribute-grid-mini">
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.initialSp') }}</label>
                <CustomNumberInput v-model="store.systemConstants.initialSp" :min="0" :max="300" active-color="#ffd700" class="standard-input" />
              </div>
              <div class="control-row-mini">
                <label>{{ t('resourceMonitor.labels.spPerSecond') }}</label>
                <CustomNumberInput v-model="store.systemConstants.spRegenRate" :step="0.5" :min="0" active-color="#ffd700" class="standard-input" />
              </div>
            </div>
          </div>
      </div>
    </div>

    <div ref="chartViewportRef" class="chart-scroll-wrapper">
      <div class="chart-background-layer">
        <div :style="[transformStyle, { width: store.totalTimelineWidthPx + 'px' }]" class="chart-background-track">
          <svg class="chart-background-svg" :height="TOTAL_HEIGHT" :width="store.totalTimelineWidthPx">
            <rect
              v-if="store.prepDuration > 0"
              x="0"
              y="0"
              :width="store.prepZoneWidthPx"
              :height="TOTAL_HEIGHT"
              fill="rgba(255, 255, 255, 0.04)"
            />
            <line
              v-if="store.prepDuration > 0"
              :x1="store.prepZoneWidthPx"
              y1="0"
              :x2="store.prepZoneWidthPx"
              :y2="TOTAL_HEIGHT"
              stroke="rgba(255, 255, 255, 0.38)"
              stroke-width="2"
            />
            <line
              v-for="(time, index) in gridLineTimes"
              :key="`bg-grid-${index}`"
              :x1="store.timeToPx(time)"
              y1="0"
              :x2="store.timeToPx(time)"
              :y2="TOTAL_HEIGHT"
              stroke="#333"
              stroke-width="1"
              stroke-dasharray="2"
            />
          </svg>
        </div>
      </div>

      <div class="chart-sections-layer">
        <div class="monitor-sections" :style="{ height: TOTAL_HEIGHT + 'px' }">
          <div class="monitor-section-shell" :style="{ height: `${sectionRects.affliction.shellHeight}px` }">
            <div v-if="!activeSectionCollapsed.affliction" class="section-topbar">
              <div class="section-topbar-line"></div>
              <button
                type="button"
                class="section-toggle-btn"
                :class="{ 'is-collapsed': activeSectionCollapsed.affliction }"
                @click="toggleSectionCollapsed('affliction')"
              >
                <span class="section-toggle-chevron" :class="{ 'is-collapsed': activeSectionCollapsed.affliction }"></span>
              </button>
            </div>
            <div
              v-if="activeSectionCollapsed.affliction"
              class="section-collapsed-strip"
              :style="{ height: `${sectionRects.affliction.stripHeight}px` }"
            >
              <button
                type="button"
                class="section-toggle-btn is-in-strip"
                @click="toggleSectionCollapsed('affliction')"
              >
                <span class="section-toggle-chevron is-collapsed"></span>
              </button>
            </div>
            <div
              v-else
              class="section-body affliction-section-body"
              :style="{ height: `${sectionRects.affliction.bodyHeight}px` }"
            >
              <div :style="[transformStyle, { width: store.totalTimelineWidthPx + 'px' }]" class="section-content-track">
                <div
                  class="affliction-connections-overlay"
                  :style="{
                    width: store.totalTimelineWidthPx + 'px',
                    height: sectionRects.affliction.bodyHeight + 'px',
                  }"
                >
                  <svg class="affliction-connections-svg" :height="sectionRects.affliction.bodyHeight" :width="store.totalTimelineWidthPx">
                    <g v-for="it in afflictionConnectionItems" :key="it.key" style="pointer-events: none;">
                      <ConnectionPath
                        :id="it.key"
                        :start-point="it.startPoint"
                        :end-point="it.endPoint"
                        :start-direction="{ cx: 1, cy: 0 }"
                        :end-direction="{ cx: -1, cy: 0 }"
                        :colors="it.colors"
                        :is-selectable="false"
                      />
                    </g>
                  </svg>
                </div>

                <div
                  class="afflictions-overlay"
                  :style="{
                    width: store.totalTimelineWidthPx + 'px',
                    height: sectionRects.affliction.bodyHeight + 'px',
                    '--aff-icon-size': afflictionLayout.iconSize + 'px',
                  }"
                >
                  <div
                    v-for="it in afflictionItems"
                    :key="it._key"
                    class="anomaly-wrapper affliction-item"
                    :style="{ left: it.leftPx + 'px', top: it.topPx + 'px' }"
                  >
                    <div class="anomaly-icon-box">
                      <img :src="getTypeIcon(it.typeKey)" class="anomaly-icon" />
                      <div class="anomaly-stacks">{{ it.stacks || 1 }}</div>
                    </div>

                    <div
                      v-if="!it.isMarker && it.row !== 'attach' && it.barWidthPx > 0"
                      class="anomaly-duration-bar"
                      :style="{ width: it.barWidthPx + 'px', backgroundColor: getTypeColor(it.typeKey) }"
                    >
                      <div class="striped-bg"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="resizeHandleItems.some((item) => item.lowerKey === 'stagger')"
            class="section-resize-handle"
            @pointerdown="beginSectionResize(resizeHandleItems.find((item) => item.lowerKey === 'stagger'), $event)"
          ></div>
          <div class="monitor-section-shell" :style="{ height: `${sectionRects.stagger.shellHeight}px` }">
            <div v-if="!activeSectionCollapsed.stagger" class="section-topbar">
              <div class="section-topbar-line"></div>
              <button
                type="button"
                class="section-toggle-btn"
                :class="{ 'is-collapsed': activeSectionCollapsed.stagger }"
                @click="toggleSectionCollapsed('stagger')"
              >
                <span class="section-toggle-chevron" :class="{ 'is-collapsed': activeSectionCollapsed.stagger }"></span>
              </button>
            </div>
            <div
              v-if="activeSectionCollapsed.stagger"
              class="section-collapsed-strip"
              :style="{ height: `${sectionRects.stagger.stripHeight}px` }"
            >
              <button
                type="button"
                class="section-toggle-btn is-in-strip"
                @click="toggleSectionCollapsed('stagger')"
              >
                <span class="section-toggle-chevron is-collapsed"></span>
              </button>
            </div>
            <div
              v-else
              class="section-body stagger-section-body"
              :style="{ height: `${sectionRects.stagger.bodyHeight}px` }"
            >
              <div :style="[transformStyle, { width: store.totalTimelineWidthPx + 'px' }]" class="section-content-track">
                <svg class="section-body-svg" :height="sectionRects.stagger.bodyHeight" :width="store.totalTimelineWidthPx">
                  <defs>
                    <linearGradient id="stagger-grad-monitor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" :stop-color="COLOR_STAGGER" stop-opacity="0.5" />
                      <stop offset="100%" :stop-color="COLOR_STAGGER" stop-opacity="0.1" />
                    </linearGradient>
                    <pattern id="stun-pattern-monitor" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <rect width="10" height="10" fill="#ff9c6e" fill-opacity="0.1" />
                      <rect width="2" height="10" transform="translate(0,0)" fill="#ffd591" fill-opacity="0.6"></rect>
                    </pattern>
                    <pattern id="node-stripe-pattern-monitor" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <rect width="8" height="8" fill="#fa8c16" fill-opacity="0.05" />
                      <rect width="2" height="8" transform="translate(0,0)" fill="#fa8c16" fill-opacity="0.5"></rect>
                    </pattern>
                  </defs>

                  <g v-for="(zone, index) in nodeZones" :key="`node-${index}`">
                    <rect
                      :x="zone.x"
                      y="0"
                      :width="zone.width"
                      :height="sectionRects.stagger.bodyHeight"
                      fill="url(#node-stripe-pattern-monitor)"
                      class="node-bar-anim"
                    />
                  </g>

                  <g v-for="(zone, index) in lockZones" :key="`lock-${index}`">
                    <rect
                      :x="zone.x"
                      y="0"
                      :width="zone.width"
                      :height="sectionRects.stagger.bodyHeight"
                      fill="url(#stun-pattern-monitor)"
                      class="stun-bg-anim"
                    />
                    <text
                      :x="zone.x + zone.width / 2"
                      :y="sectionRects.stagger.bodyHeight / 2 + 4"
                      fill="#fff"
                      font-size="10"
                      font-weight="900"
                      text-anchor="middle"
                      style="text-shadow: 0 0 2px #ff7a45; letter-spacing: 1px;"
                    >
                      WEAK
                    </text>
                  </g>

                  <polygon :points="staggerArea" fill="url(#stagger-grad-monitor)" />
                  <polyline :points="staggerPolyline" fill="none" :stroke="COLOR_STAGGER" stroke-width="2" />
                  <circle
                    v-for="(point, index) in staggerPoints"
                    :key="`stagger-point-${index}`"
                    :cx="store.timeToPx(point.time)"
                    :cy="STAGGER_BODY_HEIGHT - (Math.min(point.val, store.systemConstants.maxStagger) * scaleY_Stagger)"
                    r="2"
                    :fill="COLOR_STAGGER"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            v-if="resizeHandleItems.some((item) => item.lowerKey === 'sp')"
            class="section-resize-handle"
            @pointerdown="beginSectionResize(resizeHandleItems.find((item) => item.lowerKey === 'sp'), $event)"
          ></div>
          <div class="monitor-section-shell" :style="{ height: `${sectionRects.sp.shellHeight}px` }">
            <div v-if="!activeSectionCollapsed.sp" class="section-topbar">
              <div class="section-topbar-line"></div>
              <button
                type="button"
                class="section-toggle-btn"
                :class="{ 'is-collapsed': activeSectionCollapsed.sp }"
                @click="toggleSectionCollapsed('sp')"
              >
                <span class="section-toggle-chevron" :class="{ 'is-collapsed': activeSectionCollapsed.sp }"></span>
              </button>
            </div>
            <div
              v-if="activeSectionCollapsed.sp"
              class="section-collapsed-strip"
              :style="{ height: `${sectionRects.sp.stripHeight}px` }"
            >
              <button
                type="button"
                class="section-toggle-btn is-in-strip"
                @click="toggleSectionCollapsed('sp')"
              >
                <span class="section-toggle-chevron is-collapsed"></span>
              </button>
            </div>
            <div
              v-else
              class="section-body sp-section-body"
              :style="{ height: `${sectionRects.sp.bodyHeight}px` }"
            >
              <div :style="[transformStyle, { width: store.totalTimelineWidthPx + 'px' }]" class="section-content-track">
                <svg class="section-body-svg" :height="sectionRects.sp.bodyHeight" :width="store.totalTimelineWidthPx">
                  <defs>
                    <linearGradient id="sp-fill-gradient-monitor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" :stop-color="COLOR_SP_MAIN" stop-opacity="0.3" />
                      <stop offset="100%" :stop-color="COLOR_SP_MAIN" stop-opacity="0.05" />
                    </linearGradient>
                  </defs>

                  <line x1="0" :y1="SP_ZERO_Y - (300 * scaleY_SP)" :x2="store.totalTimelineWidthPx" :y2="SP_ZERO_Y - (300 * scaleY_SP)" stroke="#444" stroke-width="1" stroke-dasharray="2" />
                  <line x1="0" :y1="SP_ZERO_Y - (200 * scaleY_SP)" :x2="store.totalTimelineWidthPx" :y2="SP_ZERO_Y - (200 * scaleY_SP)" stroke="#444" stroke-width="1" stroke-dasharray="2" />
                  <line x1="0" :y1="SP_ZERO_Y - (100 * scaleY_SP)" :x2="store.totalTimelineWidthPx" :y2="SP_ZERO_Y - (100 * scaleY_SP)" stroke="#444" stroke-width="1" stroke-dasharray="2" />

                  <text x="5" :y="SP_ZERO_Y - (300 * scaleY_SP) + 12" fill="#888" :font-size="chartLabelFontSize">MAX(300)</text>
                  <text x="5" :y="SP_ZERO_Y - 4" fill="#666" :font-size="chartLabelFontSize">0</text>

                  <rect
                    x="0"
                    :y="SP_ZERO_Y"
                    :width="store.totalTimelineWidthPx"
                    :height="Math.max(0, SP_BODY_HEIGHT - SP_ZERO_Y)"
                    :fill="`${COLOR_SP_WARN}18`"
                  />

                  <polygon :points="spArea" fill="url(#sp-fill-gradient-monitor)" />
                  <polyline :points="spPolyline" fill="none" :stroke="COLOR_SP_MAIN" stroke-width="2" stroke-linejoin="round" />

                  <circle
                    v-for="(point, index) in spData"
                    :key="`sp-point-${index}`"
                    :cx="store.timeToPx(point.time)"
                    :cy="SP_ZERO_Y - (point.sp * scaleY_SP)"
                    r="2"
                    :fill="point.sp < 0 ? COLOR_SP_WARN : COLOR_SP_MAIN"
                  />
                </svg>

                <div
                  v-for="(warning, index) in spWarningZones"
                  :key="`warning-${index}`"
                  class="warning-tag"
                  :style="{ left: warning.left + 'px', top: SP_WARNING_TAG_TOP, color: COLOR_SP_WARN }"
                >
                  <span class="warn-icon">
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </span>
                  {{ warningLabelText }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="isEnemySelectorVisible" :title="t('resourceMonitor.enemy.dialogTitle')" width="600px" align-center class="char-selector-dialog" :append-to-body="true">
      <div class="selector-header">
        <el-input v-model="enemySearchQuery" :placeholder="t('resourceMonitor.enemy.searchPlaceholder')" :prefix-icon="Search" clearable style="width: 100%" />
      </div>

      <div class="category-tabs">
        <button
            class="ea-btn ea-btn--glass-cut"
            :class="{ 'is-active': activeCategoryTab === CATEGORY_ALL }"
            :style="{ '--ea-btn-accent': 'var(--ea-gold)' }"
            @click="activeCategoryTab = CATEGORY_ALL"
        >{{ t('common.all') }}</button>
        <button
            v-for="cat in enemyCategories"
            :key="cat"
            class="ea-btn ea-btn--glass-cut"
            :class="{ 'is-active': activeCategoryTab === cat }"
            :style="{ '--ea-btn-accent': 'var(--ea-gold)' }"
            @click="activeCategoryTab = cat"
        >
          {{ cat }}
        </button>
      </div>

      <div class="enemy-list-grid">

        <div v-if="activeCategoryTab === CATEGORY_ALL && !enemySearchQuery" class="enemy-group-section">
          <div class="group-header">
            {{ t('resourceMonitor.enemy.specialGroup') }} <span class="count">(1)</span>
          </div>
          <div class="group-items">
            <div class="enemy-card"
                 :class="{ selected: store.activeEnemyId === 'custom' }"
                 @click="selectEnemy('custom')"
                 style="--tier-color: #ffd700;"> <div class="enemy-avatar-wrapper">
              <div class="enemy-avatar custom">?</div>
              <div class="tier-badge" style="background-color: #ffd700; color: #000;">EDIT</div>
            </div>

              <div class="enemy-info">
                <div class="name">{{ t('resourceMonitor.enemy.custom') }}</div>
                <div class="desc">{{ t('resourceMonitor.enemy.customDesc') }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-for="group in groupedEnemyList" :key="group.id" class="enemy-group-section">
          <div class="group-header">
            {{ group.name }}
            <span class="count">({{ group.list.length }})</span>
          </div>

          <div class="group-items">
            <div v-for="enemy in group.list" :key="enemy.id"
                 class="enemy-card"
                 :class="{ selected: store.activeEnemyId === enemy.id }"
                 :style="{ '--tier-color': getTierColor(enemy.tier) }"
                 @click="selectEnemy(enemy.id)">

              <div class="enemy-avatar-wrapper">
                <img :src="enemy.avatar" class="enemy-avatar" @error="e=>e.target.src='/Endaxis/avatars/default_enemy.webp'"/>
                <div v-if="enemy.tier && enemy.tier !== 'normal'" class="tier-badge" :style="{ backgroundColor: getTierColor(enemy.tier) }">
                  {{ getTierLabel(enemy.tier) }}
                </div>
              </div>

              <div class="enemy-info">
                <div class="name" :style="{ color: enemy.tier === 'boss' ? '#ff4d4f' : (enemy.tier === 'head' ? '#ffd700' : '#f0f0f0') }">
                  {{ enemy.name }}
                </div>
                <div class="desc">{{ t('resourceMonitor.enemy.desc', { max: enemy.maxStagger, nodes: enemy.staggerNodeCount }) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="groupedEnemyList.length === 0 && !(activeCategoryTab === CATEGORY_ALL && !enemySearchQuery)" class="empty-state">
          {{ t('resourceMonitor.enemy.empty') }}
        </div>

      </div>
    </el-dialog>

  </div>
</template>

<style scoped>
/* 基础布局与侧边栏容器 */
.resource-monitor-layout {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, sans-serif;
  min-height: 0;
  overflow: hidden;
}

.monitor-sidebar {
  background-color: #252525;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

/* 敌人选择模块 */
.enemy-select-module {
  padding: 8px 10px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
}

.enemy-select-module:hover { background: rgba(255, 255, 255, 0.08); }

.module-deco-line {
  position: absolute;
  left: 0;
  top: 8px; bottom: 8px;
  width: 2px;
  background: #ffd700;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
}

.custom-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 215, 0, 0.05);
  border: 1px rgba(255, 215, 0, 0.4);
  box-sizing: border-box;
  color: #ffd700;
  font-size: 18px;
  font-weight: 900;
  font-family: 'Roboto Mono', monospace;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
}

.enemy-avatar-box {
  container-type: size;
  width: 32px;
  height: 32px;
  border: 1px solid #444;
  background: #111;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.enemy-avatar-box img { width: 100%; height: 100%; object-fit: cover; }

.scan-line {
  position: absolute; top: 0; left: 0; width: 100%; height: 1px;
  background: rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 4px #ffd700;
  will-change: transform;
  animation: scan 3s infinite linear;
}

.enemy-info-col {
  flex-grow: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.enemy-name {
  font-weight: bold;
  color: #eee;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.click-hint {
  font-size: 10px;
  color: #ffd700;
  opacity: 0.5;
  margin-top: 1px;
}

/* 属性设置区 */
.settings-scroll-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px 8px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: none;
}

.settings-scroll-area::-webkit-scrollbar {
  display: none;
}

.section-container.tech-style {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 3px solid rgba(255, 255, 255, 0.2);
  padding: 10px 8px 8px 8px;
  position: relative;
  flex-shrink: 0;
}

.section-container.border-red { border-left-color: #ff7875; }
.section-container.border-gold { border-left-color: #ffd700; }

.attribute-grid-mini {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.control-row-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.control-row-mini label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  letter-spacing: 0.3px;
}

:deep(.standard-input) {
  width: 65px !important;
  height: 22px !important;
  font-size: 11px !important;
}

/* 图表展示区 */
.chart-scroll-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: #18181c;
  min-width: 0;
  min-height: 0;
}

.chart-background-layer,
.chart-sections-layer {
  position: absolute;
  inset: 0;
}

.chart-background-layer {
  pointer-events: none;
  z-index: 0;
}

.chart-background-track {
  position: absolute;
  inset: 0 auto 0 0;
  will-change: transform;
}

.chart-background-svg {
  display: block;
}

.chart-sections-layer {
  z-index: 1;
}

.monitor-sections {
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.monitor-section-shell {
  position: relative;
  min-height: 0;
}

.section-topbar {
  position: relative;
  height: 14px;
  flex-shrink: 0;
}

.section-topbar-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.16);
}

.section-body {
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.section-content-track {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  will-change: transform;
}

.section-body-svg {
  display: block;
}

.section-collapsed-strip {
  position: relative;
  background: rgba(34, 34, 40, 0.94);
  border-radius: 2px;
}

.section-resize-handle {
  position: relative;
  height: 0;
  flex-shrink: 0;
  z-index: 3;
}

.section-resize-handle::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -6px;
  height: 12px;
  cursor: ns-resize;
}

.section-toggle-btn {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 16px;
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  cursor: pointer;
}

.section-toggle-btn.is-in-strip {
  top: 50%;
  width: 24px;
  height: 14px;
}

.section-toggle-btn:hover {
  color: #fff;
}

.section-toggle-chevron {
  width: 8px;
  height: 8px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
  opacity: 0.88;
}

.section-toggle-chevron.is-collapsed {
  transform: rotate(-135deg);
}

/* === 附着/异常叠层 === */
.affliction-connections-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible;
  z-index: 5;
}

.affliction-connections-svg {
  display: block;
  overflow: visible;
}

.afflictions-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible;
  z-index: 6;
}

.affliction-item {
  position: absolute;
  display: flex;
  align-items: center;
  white-space: nowrap;
  pointer-events: none;
}

.anomaly-icon-box {
  width: var(--aff-icon-size, 20px);
  height: var(--aff-icon-size, 20px);
  background-color: #333;
  border: 1px solid #999;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  pointer-events: none;
}

.anomaly-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.anomaly-stacks {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: rgba(0, 0, 0, 0.8);
  color: #ffd700;
  font-size: 8px;
  padding: 0 2px;
  line-height: 1;
  border-radius: 2px;
}

.anomaly-duration-bar {
  height: 16px;
  border: none;
  border-radius: 2px;
  position: relative;
  display: flex;
  align-items: center;
  overflow: visible;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  z-index: 1;
  margin-left: 2px;
}

.striped-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.2) 2px,
    transparent 2px,
    transparent 6px
  );
}

.warning-tag {
  position: absolute;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 3px;
  border: 1px solid rgba(255, 77, 79, 0.3);
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  white-space: nowrap;
}

/* 敌人选择弹窗容器 */
.enemy-list-grid {
  max-height: 450px;
  overflow-y: auto;
  padding: 10px;
  scrollbar-width: none;
}
.enemy-list-grid::-webkit-scrollbar { display: none; }

/* 分类页签 */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 8px;
  margin-bottom: 20px;
  padding: 8px;
  background: #1e1e1e;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  overflow: visible;
  white-space: normal;
}

.category-tabs .ea-btn {
  flex: none;
  margin-bottom: 2px;
  --ea-btn-py: 6px;
  --ea-btn-px: 16px;
}

/* --- 分组标题样式 --- */
.enemy-group-section {
  margin-bottom: 24px;
}

.group-header {
  font-size: 13px;
  font-weight: 800;
  color: #ececec;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #ffd700;
  display: flex;
  align-items: baseline;
  gap: 8px;
  letter-spacing: 1px;
}

.group-header .count {
  font-size: 11px;
  color: #666;
  font-weight: normal;
}

/* --- 敌人卡片网格布局 (3列) --- */
.group-items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.enemy-card {
  --tier-color: #555;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 3px solid #444;
  cursor: pointer;
  margin-bottom: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  min-width: 0;
  height: 64px;
  box-sizing: border-box;
}

.enemy-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.15);
  border-left-color: var(--tier-color) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5),
  -2px 0 8px -2px var(--tier-color);
}

.enemy-card.selected {
  border-left-color: var(--tier-color) !important;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
}

.enemy-avatar-wrapper {
  position: relative;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
}

.enemy-avatar {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  object-fit: cover;
  background: #111;
}

.tier-badge {
  position: absolute;
  bottom: -2px;
  right: -4px;
  color: #000;
  font-size: 8px;
  font-weight: 900;
  padding: 1px 5px;
  border-radius: 2px;
  text-transform: uppercase;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
  z-index: 2;
}

.enemy-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.enemy-info .name {
  font-size: 12px;
  font-weight: bold;
  color: #f0f0f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.enemy-info .desc {
  font-size: 10px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 自定义敌人的特殊头像样式 */
.enemy-avatar.custom {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 215, 0, 0.05);
  border: 1px rgba(255, 215, 0, 0.4);
  color: #ffd700;
  font-size: 22px;
  font-weight: 900;
  font-family: 'Roboto Mono', monospace;
  box-shadow: inset 0 0 10px rgba(255, 215, 0, 0.1);
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

/* 选中状态下的自定义头像变化 */
.enemy-card.selected .enemy-avatar.custom {
  background: rgba(255, 215, 0, 0.15);
  border-style: solid;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.2);
}

/* 动画定义 */
@keyframes scan {
  0% { transform: translateY(-10cqh); }
  100% { transform: translateY(110cqh); }
}

.stun-bg-anim { animation: stun-flash 2s infinite alternate; }
@keyframes stun-flash { 0% { fill-opacity: 0.1; } 100% { fill-opacity: 0.3; } }

.node-bar-anim { animation: node-pulse 1.5s infinite alternate; }
@keyframes node-pulse { 0% { opacity: 0.4; } 100% { opacity: 0.8; } }
</style>