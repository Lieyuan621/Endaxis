<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import CustomNumberInput from './CustomNumberInput.vue'
import ConnectionPath from './ConnectionPath.vue'
import HitDamageDetailDialog from './HitDamageDetailDialog.vue'
import { useI18n } from 'vue-i18n'
import { getDisplayKeyCandidates } from '@/utils/effectDisplay.js'
import { getEnemyGameName } from '@/data/gameText'
import { computeContingencyEnemyHealing } from '@/data/contingencyContracts/criteriaEffects'

const store = useTimelineStore()
const { t, locale } = useI18n({ useScope: 'global' })
const props = defineProps({
  expandAllToken: { type: Number, default: 0 },
})
const emit = defineEmits(['collapse-panel', 'section-collapse-change'])
const reactionHitDetailHit = ref(null)
const showReactionHitDetail = computed(() => reactionHitDetailHit.value !== null)
const reactionHitDetailBreakdown = computed(() => reactionHitDetailHit.value?._damageBreakdown ?? null)

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

function openReactionHitDetail(hitData) {
  if (!hitData?._damageBreakdown) return
  reactionHitDetailHit.value = hitData
}

function closeReactionHitDetail() {
  reactionHitDetailHit.value = null
}

function getReactionHitTitle(hitData) {
  const damage = Math.floor(Number(hitData?._expectedDamage ?? hitData?._damageBreakdown?.expectedDamage ?? 0) || 0)
  return damage > 0 ? t('actionItem.damageHitTooltip', { damage: damage.toLocaleString() }) : ''
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

function areAllSectionsCollapsed(state) {
  return SECTION_KEYS.every(key => state?.[key] === true)
}

function getCollapsedSectionCount(state = sectionCollapsed.value) {
  const normalized = getNormalizedCollapsedState(state)
  return SECTION_KEYS.reduce((count, key) => count + (normalized[key] ? 1 : 0), 0)
}

function emitSectionCollapseChange() {
  emit('section-collapse-change', getCollapsedSectionCount())
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
    const restored = normalizeSectionCollapsed(JSON.parse(raw))
    sectionCollapsed.value = areAllSectionsCollapsed(restored)
      ? { affliction: false, stagger: false, sp: false }
      : restored
  } catch {
    // ignore
  }
}

function getNormalizedCollapsedState(source = sectionCollapsed.value) {
  return normalizeSectionCollapsed(source)
}

function expandAllSections() {
  sectionCollapsed.value = { affliction: false, stagger: false, sp: false }
  persistSectionCollapsed()
  emitSectionCollapseChange()
}

function toggleSectionCollapsed(which) {
  if (!SECTION_KEYS.includes(which)) return
  const next = getNormalizedCollapsedState({
    ...sectionCollapsed.value,
    [which]: !sectionCollapsed.value[which],
  })
  if (areAllSectionsCollapsed(next)) {
    expandAllSections()
    emit('collapse-panel')
    return
  }
  sectionCollapsed.value = next
  persistSectionCollapsed()
  emitSectionCollapseChange()
}

watch(() => props.expandAllToken, () => {
  expandAllSections()
})

onMounted(() => {
  restoreSectionWeights()
  restoreSectionCollapsed()
  emitSectionCollapseChange()
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

const COLOR_STAGGER = '#ff7875'
const COLOR_LIMIT = '#d32f2f'
const COLOR_SP_MAIN = '#ffd700'
const COLOR_SP_WARN = '#ff4d4f'

function getMarkerPriority(typeKey) {
  const w = {
    breach: 500,
    lift: 400,
    knockdown: 300,
    crush: 200,
    vulnerability: 100,
  }
  return w[typeKey] || 0
}

function getComboStacksAtTime(segments, time, epsilon = 0.001) {
  return Math.max(
    0,
    ...(segments || [])
      .filter((seg) =>
        seg?.typeKey === 'vulnerability' &&
        seg?.tracksComboState === true &&
        Number(seg.start) <= time + epsilon &&
        Number(seg.end) > time + epsilon,
      )
      .map((seg) => Number(seg.stacks) || 1),
  )
}

function getPreviousComboStacksAtTime(segments, time, epsilon = 0.001) {
  return Math.max(
    0,
    ...(segments || [])
      .filter((seg) =>
        seg?.typeKey === 'vulnerability' &&
        seg?.tracksComboState === true &&
        Number(seg.start) < time - epsilon &&
        Number(seg.end) > time - epsilon,
      )
      .map((seg) => Number(seg.stacks) || 1),
  )
}

const PHYSICAL_REACTION_MARKERS = new Set(['lift', 'knockdown', 'breach', 'crush'])
const PHYSICAL_STACKING_MARKERS = new Set(['lift', 'knockdown'])
const PHYSICAL_CONSUMING_MARKERS = new Set(['breach', 'crush'])
const PHYSICAL_CANONICAL_ICON_KEYS = new Set(['vulnerability', 'lift', 'knockdown', 'breach', 'crush'])

const afflictionViz = computed(() => {
  return store.enemyAfflictionViz
})
function getTypeIcon(typeKey, icon) {
  const candidates = getDisplayKeyCandidates(typeKey)
  const canonical = candidates[0]
  if (PHYSICAL_CANONICAL_ICON_KEYS.has(canonical) && store.iconDatabase?.[canonical]) {
    return store.iconDatabase[canonical]
  }
  if (icon) return icon
  for (const candidate of candidates) {
    if (store.iconDatabase?.[candidate]) return store.iconDatabase[candidate]
  }
  return store.iconDatabase?.default || '/icons/default_icon.webp'
}

function getTypeColor(typeKey) {
  return store.getColor?.(typeKey) || '#aaaaaa'
}

function getAttachmentLineColors(headTypeKey, tailTypeKey = null) {
  return {
    start: getTypeColor(headTypeKey),
    end: getTypeColor(tailTypeKey || headTypeKey),
  }
}

const afflictionItems = computed(() => {
  const iconSize = Number(afflictionLayout.value.iconSize) || 20
  const rowHeight = Number(afflictionLayout.value.rowHeight) || 20
  const gap = Number(afflictionLayout.value.gap) || 4
  const epsilon = 0.001

  const out = []
  const physicalMarkerTimeKeys = new Set(
    (afflictionViz.value.physical.markers || []).map((marker) =>
      Math.round((Number(marker.time) || 0) / epsilon),
    ),
  )

  // segments
  for (const seg of afflictionViz.value.physical.segments || []) {
    if (seg.tracksComboState) continue
    const start = Number(seg.start) || 0
    out.push({
      row: 'physical',
      rowIndex: 0,
      isMarker: false,
      startTime: start,
      endTime: seg.end,
      typeKey: seg.typeKey,
      stacks: seg.stacks || 1,
      slotIndex: 0,
      icon: seg.icon || null,
      hideIcon: physicalMarkerTimeKeys.has(Math.round(start / epsilon)),
    })
  }

  for (const seg of afflictionViz.value.attachment.segments || []) {
    out.push({
      row: 'attach',
      rowIndex: 0,
      isMarker: false,
      startTime: seg.start,
      endTime: seg.end,
      typeKey: seg.typeKey,
      stacks: seg.stacks || 1,
      slotIndex: 0,
      icon: seg.icon || null,
      hideIcon: false,
    })
  }

  for (const seg of afflictionViz.value.anomalies.segments || []) {
    out.push({
      row: 'anomaly',
      rowIndex: Number(seg.row) || 0,
      isMarker: false,
      startTime: seg.start,
      endTime: seg.end,
      typeKey: seg.typeKey,
      stacks: seg.stacks || 1,
      slotIndex: 0,
      icon: seg.icon || null,
      hideIcon: false,
    })
  }

  for (const seg of afflictionViz.value.statuses.segments || []) {
    out.push({
      row: 'status',
      rowIndex: Number(seg.row) || 0,
      isMarker: false,
      startTime: seg.start,
      endTime: seg.end,
      typeKey: seg.typeKey,
      stacks: seg.stacks || 1,
      slotIndex: 0,
      icon: seg.icon || null,
      hideIcon: false,
    })
  }

  // markers (need slotIndex by time group)
  function pushGroupedMarkers(row, rowIndex, markers) {
    const groups = []
    for (const m of markers || []) {
      const time = Number(m.time) || 0
      const typeKey = m.typeKey
      if (!typeKey) continue
      let g = groups.find((x) => Math.abs(x.time - time) <= epsilon)
      if (!g) {
        g = { time, list: [] }
        groups.push(g)
      }
      g.list.push({
        typeKey,
        stacks: m.stacks || 1,
        icon: m.icon || null,
        isDamageHit: !!m.isDamageHit,
        hitData: m.hitData || null,
        damageHits: Array.isArray(m.damageHits) ? m.damageHits : [],
      })
      if (Array.isArray(m.damageHits)) {
        for (const hitData of m.damageHits) {
          g.list.push({
            typeKey,
            stacks: m.stacks || 1,
            icon: null,
            isDamageHit: true,
            hitData,
            damageHits: [],
          })
        }
      }
    }

    groups.sort((a, b) => a.time - b.time)
    groups.forEach((g) => {
      if (row === 'physical') {
        const previousComboStacks = getPreviousComboStacksAtTime(
          afflictionViz.value.physical.segments,
          g.time,
          epsilon,
        )
        const activeComboStacks = getComboStacksAtTime(
          afflictionViz.value.physical.segments,
          g.time,
          epsilon,
        )
        const comboItems = g.list.filter((x) => !x.isDamageHit && PHYSICAL_REACTION_MARKERS.has(x.typeKey))
        if (comboItems.length > 0) {
          let representative =
            [...comboItems].sort((a, b) => getMarkerPriority(b.typeKey) - getMarkerPriority(a.typeKey))[0] ||
            comboItems[0]
          let mergedStacks = 1

          if (previousComboStacks <= 0) {
            representative = { typeKey: 'vulnerability', stacks: 1, icon: null }
          } else if (PHYSICAL_CONSUMING_MARKERS.has(representative.typeKey)) {
            mergedStacks = Math.min(
              4,
              Math.max(previousComboStacks, ...comboItems.map((x) => Number(x.stacks) || 1)),
            )
          } else if (PHYSICAL_STACKING_MARKERS.has(representative.typeKey)) {
            mergedStacks = Math.min(4, Math.max(activeComboStacks, previousComboStacks + 1))
          } else {
            mergedStacks = Math.min(
              4,
              Math.max(activeComboStacks, previousComboStacks, Number(representative?.stacks) || 1),
            )
          }

          g.list = g.list.filter((x) =>
            x.isDamageHit || (x.typeKey !== 'vulnerability' && !PHYSICAL_REACTION_MARKERS.has(x.typeKey)),
          )
          g.list.push({
            typeKey: representative?.typeKey || 'vulnerability',
            stacks: Math.max(1, mergedStacks || Number(representative?.stacks) || 1),
            icon: representative?.icon || null,
          })
        }
      }

      g.list.sort((a, b) => getMarkerPriority(b.typeKey) - getMarkerPriority(a.typeKey))
      let iconSlotIndex = 0
      g.list.forEach((it, idx) => {
        const slotIndex = it.isDamageHit ? idx : iconSlotIndex++
        out.push({
          row,
          rowIndex,
          isMarker: true,
          startTime: g.time,
          endTime: null,
          typeKey: it.typeKey,
          stacks: it.stacks || 1,
          slotIndex,
          icon: it.icon || null,
          isDamageHit: !!it.isDamageHit,
          hitData: it.hitData || null,
          hideIcon: false,
        })
      })
    })
  }

  pushGroupedMarkers('physical', 0, afflictionViz.value.physical.markers)
  pushGroupedMarkers('attach', 0, afflictionViz.value.attachment.markers)
  pushGroupedMarkers('anomaly', 0, afflictionViz.value.anomalies.markers)
  pushGroupedMarkers('status', 0, afflictionViz.value.statuses.markers)

  // calculate px/top in-place for rendering
  return out.map((it, idx) => {
    const leftBase = store.timeToPx(it.startTime)
    const hiddenIconOffset = !it.isMarker && it.hideIcon ? iconSize : 0
      const markerOffset = it.isMarker && !it.isDamageHit
        ? it.slotIndex * (iconSize + 2)
        : 0
      const left = leftBase + hiddenIconOffset + markerOffset

    let top = afflictionLayout.value.yPhysical
    if (it.row === 'attach') top = afflictionLayout.value.yAttachment
    else if (it.row === 'anomaly') top = afflictionLayout.value.yAnomalyStart + (it.rowIndex || 0) * (rowHeight + gap)
    else if (it.row === 'status') top = afflictionLayout.value.yStatusStart + (it.rowIndex || 0) * (rowHeight + gap)

    const barWidth =
      it.isMarker || !Number.isFinite(it.endTime)
        ? 0
        : Math.max(0, store.timeToPx(it.endTime) - leftBase - iconSize - 2)

      return {
        ...it,
        _key: `${it.row}-${it.isMarker ? 'm' : 's'}-${it.typeKey}-${it.startTime}-${it.rowIndex}-${it.slotIndex}-${idx}`,
        leftPx: left,
        topPx: top + Math.floor((rowHeight - iconSize) / 2),
        diamondTopPx: top + Math.floor((rowHeight - iconSize) / 2) + iconSize - 3,
        barWidthPx: barWidth,
      }
  })
})

const afflictionConnectionItems = computed(() => {
  const iconSize = Number(afflictionLayout.value.iconSize) || 20
  const epsilon = 0.001
  const findTailItem = (sourceItem) => {
    const endTime = Number(sourceItem.endTime)
    if (!Number.isFinite(endTime)) return null
    return afflictionItems.value
      .filter((candidate) => candidate._key !== sourceItem._key)
      .filter((candidate) => !candidate.isDamageHit)
      .filter((candidate) => Math.abs((Number(candidate.startTime) || 0) - endTime) <= epsilon)
      .sort((a, b) => {
        const weight = { anomaly: 4, status: 3, physical: 2, attach: 1 }
        return (weight[b.row] || 0) - (weight[a.row] || 0)
      })[0]
  }

  return afflictionItems.value
    .filter((it) => !it.isMarker && it.row === 'attach' && it.barWidthPx > 0)
    .map((it) => {
      const tail = findTailItem(it)
      if (!tail) return null
      const y = it.topPx + iconSize / 2
      const startX = it.leftPx + iconSize
      const endX = it.leftPx + iconSize + 2 + it.barWidthPx

      return {
        key: `${it._key}-link`,
        sourceKey: it._key,
        startPoint: { x: startX, y },
        endPoint: { x: endX, y },
        colors: getAttachmentLineColors(it.typeKey, tail.typeKey),
      }
    })
    .filter(Boolean)
})

const reactedAttachmentKeys = computed(() => {
  return new Set(afflictionConnectionItems.value.map((item) => item.sourceKey))
})

const afflictionLayout = computed(() => {
  const height = Math.max(0, sectionRects.value.affliction?.bodyHeight || 0)

  const header = 0
  const padding = 0
  const icon = 20
  const gap = 4

  const baseRows = 2 // physical + attachment
  const anomalyRows = Math.max(0, afflictionViz.value.anomalies.rowCount)
  const statusRows = Math.max(0, afflictionViz.value.statuses.rowCount)
  const totalRows = baseRows + Math.max(1, anomalyRows) + statusRows

  const available = Math.max(0, height - header - padding * 2 - gap * (totalRows - 1))
  const rawRow = Math.floor(available / totalRows)
  const rowHeight = Math.max(14, Math.min(20, rawRow))

  const startY = header + padding
  const yPhysical = startY
  const yAttachment = yPhysical + rowHeight + gap
  const yAnomalyStart = yAttachment + rowHeight + gap
  const yStatusStart = yAnomalyStart + Math.max(1, anomalyRows) * (rowHeight + gap)

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
    yStatusStart,
    totalRows,
  }
})

const activeEnemyInfo = computed(() => {
  if (store.activeEnemyId === 'custom') {
    return { name: t('resourceMonitor.enemy.custom'), avatar: '', isCustom: true }
  }
  const enemy = store.enemyDatabase.find(e => e.id === store.activeEnemyId)
  return enemy
    ? { ...enemy, name: getEnemyGameName(enemy.id, locale.value) }
    : { name: t('resourceMonitor.enemy.unknown'), avatar: '' }
})

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


const spData = computed(() => {
  return store.spSeries
})
const SP_BODY_HEIGHT = computed(() => Math.max(0, sectionRects.value.sp?.bodyHeight || 0))
const SP_NEGATIVE_BUFFER = 40
const SP_TOTAL_RANGE = computed(() => 300 + SP_NEGATIVE_BUFFER)
const SP_ZERO_Y = computed(() => {
  return SP_BODY_HEIGHT.value * (300 / SP_TOTAL_RANGE.value)
})
const SP_WARNING_TAG_HEIGHT = 18

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

const spWarningZones = computed(() => {
  const points = spData.value
  return points.flatMap((point, index) => {
    // 只有技力降低到0以下的点会警告
    if (!(point.sp < 0 && point.change < 0)) return []
    // 技力不足警告放在扣技力前的拐点高度，避免盖住折线图
    const referenceSp = index === 0 ? point.sp : points[index - 1].sp
    return [{
      left: store.timeToPx(point.time),
      top: getSpWarningTagTop(referenceSp),
    }]
  })
})

function getSpPointY(sp) {
  return clamp(SP_ZERO_Y.value - (sp * scaleY_SP.value), 0, SP_BODY_HEIGHT.value)
}

function getSpWarningTagTop(sp) {
  const curveY = getSpPointY(sp);
  const spBodyHeight = SP_BODY_HEIGHT.value
  // 技力不足警告到折线的间距
  const gap = clamp(Math.round(spBodyHeight * 0.08), 4, 10)
  // 技力不足警告到顶部和底部的最小间距
  const topPadding = clamp(Math.round(spBodyHeight * 0.07), 4, 10)
  const bottomPadding = clamp(Math.round(spBodyHeight * 0.09), 6, 12)
  const preferredTop = curveY - SP_WARNING_TAG_HEIGHT - gap
  const maxTop = Math.max(topPadding, spBodyHeight - SP_WARNING_TAG_HEIGHT - bottomPadding)
  return clamp(preferredTop, topPadding, maxTop)
}

const transformStyle = computed(() => {
  return {
    transform: `translateX(${-store.timelineShift}px)`,
    willChange: 'transform'
  }
})

const totalDamageDone = computed(() => {
  return (store.simLog || []).reduce((sum, entry) => {
    if (entry?.type !== 'DAMAGE_HIT') return sum
    const hit = entry.payload?.hitData
    return sum + Number(store.getHitDisplayDamage?.(hit) ?? hit?._expectedDamage ?? hit?._damageBreakdown?.expectedDamage ?? 0)
  }, 0)
})

const enemyMaxHp = computed(() => Math.max(1, Number(store.effectiveEnemyHp ?? store.systemConstants.enemyHp) || 1))
const enemyHealingDone = computed(() => computeContingencyEnemyHealing(store.enemyLog || [], {
  maxHp: enemyMaxHp.value,
  rate: Number(store.contingencyEnemyHealingRate) || 0,
  until: Number(store.viewDuration) || Infinity,
}))
const enemyRemainingHp = computed(() => {
  const remaining = enemyMaxHp.value - totalDamageDone.value + enemyHealingDone.value
  return Math.max(0, Math.min(enemyMaxHp.value, Math.round(remaining)))
})
const enemyHpRatio = computed(() => clamp(enemyRemainingHp.value / enemyMaxHp.value, 0, 1))
const currentStaggerValue = computed(() => {
  const points = staggerPoints.value
  const last = points[points.length - 1]
  return Math.round(Number(last?.val) || 0)
})
const staggerRatio = computed(() => {
  const maxStagger = Math.max(1, Number(store.systemConstants.maxStagger) || 1)
  return clamp(currentStaggerValue.value / maxStagger, 0, 1)
})
</script>

<template>
  <div ref="monitorRootRef" class="resource-monitor-layout">

    <div class="monitor-sidebar monitor-module-sidebar">
      <div class="module-meta-shell" :style="{ height: `${sectionRects.affliction.shellHeight}px` }">
        <div v-if="activeSectionCollapsed.affliction" class="module-meta-collapsed">
          {{ t('resourceMonitor.modules.enemyStatus') }}
        </div>
        <div v-else class="module-meta-body enemy-status-meta">
          <div class="module-title red">{{ t('resourceMonitor.modules.enemyStatus') }}</div>
          <div class="enemy-compact">
            <div class="enemy-compact-text">
              <div class="enemy-name-line">
                <span class="enemy-name">{{ activeEnemyInfo.name }}</span>
                <span v-if="store.activeEnemyId !== 'custom'" class="enemy-level-badge">Lv{{ store.activeEnemyLevel }}</span>
              </div>
            </div>
          </div>
          <div class="module-value-text enemy-hp-text">{{ enemyRemainingHp.toLocaleString() }}/{{ enemyMaxHp.toLocaleString() }}</div>
          <div class="enemy-hp-bar">
            <div class="enemy-hp-fill" :style="{ width: `${enemyHpRatio * 100}%` }"></div>
          </div>
        </div>
      </div>

      <div
        v-if="resizeHandleItems.some((item) => item.lowerKey === 'stagger')"
        class="module-meta-resize-gap"
      ></div>
      <div class="module-meta-shell" :style="{ height: `${sectionRects.stagger.shellHeight}px` }">
        <div v-if="activeSectionCollapsed.stagger" class="module-meta-collapsed">
          {{ t('resourceMonitor.modules.stagger') }}
        </div>
        <div v-else class="module-meta-body stagger-meta">
          <div class="module-title orange">{{ t('resourceMonitor.modules.stagger') }}</div>
          <div class="module-value-text stagger-value-text">{{ currentStaggerValue }}/{{ store.systemConstants.maxStagger }}</div>
          <div class="enemy-hp-bar stagger-value-bar">
            <div class="enemy-hp-fill stagger-value-fill" :style="{ width: `${staggerRatio * 100}%` }"></div>
          </div>
        </div>
      </div>

      <div
        v-if="resizeHandleItems.some((item) => item.lowerKey === 'sp')"
        class="module-meta-resize-gap"
      ></div>
      <div class="module-meta-shell" :style="{ height: `${sectionRects.sp.shellHeight}px` }">
        <div v-if="activeSectionCollapsed.sp" class="module-meta-collapsed">
          {{ t('resourceMonitor.modules.sp') }}
        </div>
        <div v-else class="module-meta-body sp-meta">
          <div class="module-control-row">
            <label>{{ t('resourceMonitor.labels.initialSp') }}</label>
            <CustomNumberInput v-model="store.systemConstants.initialSp" :min="0" :max="300" active-color="#ffd700" class="standard-input" />
          </div>
          <div class="module-control-row">
            <label>{{ t('resourceMonitor.labels.spPerSecond') }}</label>
            <CustomNumberInput v-model="store.systemConstants.spRegenRate" :step="0.5" :min="0" active-color="#ffd700" class="standard-input" />
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
                    :class="{ 'is-damage-hit': it.isDamageHit }"
                    :style="{ left: it.leftPx + 'px', top: (it.isDamageHit ? it.diamondTopPx : it.topPx) + 'px' }"
                    :title="it.isDamageHit ? getReactionHitTitle(it.hitData) : ''"
                    @mousedown.stop="it.isDamageHit && openReactionHitDetail(it.hitData)"
                  >
                    <div v-if="it.isDamageHit" class="enemy-damage-diamond" :class="{ 'link-buffed': it.hitData?.consumedStacks?.link > 0 }"></div>
                    <div v-else-if="!it.hideIcon" class="anomaly-icon-box">
                      <img :src="getTypeIcon(it.typeKey, it.icon)" class="anomaly-icon" />
                      <div class="anomaly-stacks">{{ it.stacks || 1 }}</div>
                    </div>

                    <div
                      v-if="!it.isMarker && it.barWidthPx > 0 && !reactedAttachmentKeys.has(it._key)"
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
                  :style="{ left: warning.left + 'px', top: warning.top + 'px', color: COLOR_SP_WARN }"
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

    <HitDamageDetailDialog
      :visible="showReactionHitDetail"
      :breakdown="reactionHitDetailBreakdown"
      :hit-data="reactionHitDetailHit"
      @update:visible="closeReactionHitDetail"
    />

  </div>
</template>

<style scoped>
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

.monitor-module-sidebar {
  background: #222;
}

.module-meta-shell {
  min-height: 0;
  position: relative;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.module-meta-resize-gap {
  height: 0;
  flex-shrink: 0;
}

.module-meta-body {
  height: 100%;
  padding: 8px 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 7px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, transparent 100%);
  border-left: 3px solid rgba(255, 255, 255, 0.18);
}

.enemy-status-meta { border-left-color: #ff7875; }
.stagger-meta { border-left-color: #ff9c6e; justify-content: center; }
.sp-meta { border-left-color: #ffd700; justify-content: center; }

.module-meta-collapsed {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.55);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: rgba(34, 34, 40, 0.94);
  border-left: 3px solid rgba(255, 255, 255, 0.16);
  box-sizing: border-box;
  white-space: nowrap;
}

.module-title {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.8px;
  line-height: 1;
  white-space: nowrap;
}

.module-title.red { color: #ff7875; }
.module-title.orange { color: #ff9c6e; }
.module-title.gold { color: #ffd700; }

.enemy-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.enemy-compact-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.enemy-name-line {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.enemy-level-badge {
  flex-shrink: 0;
  color: #ffd700;
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  opacity: 0.86;
}

.enemy-hp-text {
  text-align: center;
}

.module-value-text {
  color: rgba(255, 255, 255, 0.82);
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.1;
  white-space: nowrap;
}

.enemy-hp-bar {
  height: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.enemy-hp-fill {
  height: 100%;
  background: #d9363e;
  position: relative;
  transition: width 0.16s ease;
}

.enemy-hp-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.18),
    rgba(255, 255, 255, 0.18) 2px,
    transparent 2px,
    transparent 6px
  );
  pointer-events: none;
}

.stagger-value-text {
  text-align: center;
  color: rgba(255, 255, 255, 0.82);
}

.stagger-value-bar {
  background: rgba(255, 214, 145, 0.08);
}

.stagger-value-fill {
  background: #d46b08;
}

.module-control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.module-control-row label {
  color: rgba(255, 255, 255, 0.48);
  font-size: 11px;
  white-space: nowrap;
}

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

.mini-subsection-label {
  margin-top: 4px;
  padding-top: 7px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.58);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.resistance-row label {
  max-width: 86px;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.standard-input) {
  width: 65px !important;
  height: 22px !important;
  font-size: 11px !important;
}

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

.stagger-section-body::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: rgba(255, 156, 110, 0.32);
  z-index: 2;
  pointer-events: none;
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

.affliction-item.is-damage-hit {
  width: 6px;
  height: 6px;
  pointer-events: auto;
  cursor: default;
  z-index: 20;
}

.enemy-damage-diamond {
  width: 6px;
  height: 6px;
  background-color: #fff;
  border: 1px solid #666;
  transform: rotate(45deg);
  box-sizing: border-box;
  transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: none;
}

.enemy-damage-diamond.link-buffed {
  background-color: #64c8ff;
  border-color: #3a9fd4;
  box-shadow: 0 0 6px 2px rgba(100, 200, 255, 0.6);
}

.affliction-item.is-damage-hit:hover .enemy-damage-diamond {
  background-color: #ffd700;
  border-color: #fff;
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.8);
  transform: rotate(45deg) scale(1.3);
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
  min-width: 58px;
  height: 18px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 2px 6px;
  box-sizing: border-box;
  border-radius: 4px;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  line-height: 1;
  border: 1px solid rgba(255, 77, 79, 0.3);
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  white-space: nowrap;
}

@keyframes scan {
  0% { transform: translateY(-10cqh); }
  100% { transform: translateY(110cqh); }
}

.stun-bg-anim { animation: stun-flash 2s infinite alternate; }
@keyframes stun-flash { 0% { fill-opacity: 0.1; } 100% { fill-opacity: 0.3; } }

.node-bar-anim { animation: node-pulse 1.5s infinite alternate; }
@keyframes node-pulse { 0% { opacity: 0.4; } 100% { opacity: 0.8; } }
</style>
