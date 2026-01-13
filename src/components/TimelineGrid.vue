<script setup>
import { ref, provide, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { refThrottled } from '@vueuse/core'
import { useTimelineStore } from '../stores/timelineStore.js'
import ActionItem from './ActionItem.vue'
import ActionConnector from './ActionConnector.vue'
import ConnectionPreview from './ConnectionPreview.vue'
import GaugeOverlay from './GaugeOverlay.vue'
import ContextMenu from './ContextMenu.vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useDragConnection } from '@/composables/useDragConnection.js'
import { watchEffect } from 'vue'

const store = useTimelineStore()
const connectionHandler = useDragConnection()

// ===================================================================================
// 初始化与常量
// ===================================================================================

const TIME_BLOCK_WIDTH = computed(() => store.timeBlockWidth)
provide('TIME_BLOCK_WIDTH', TIME_BLOCK_WIDTH)

// Refs
const tracksContentRef = ref(null)
const timeRulerWrapperRef = ref(null)
const tracksHeaderRef = ref(null)
const trackLaneRefs = ref([])

// Render State
const svgRenderKey = ref(0)
const scrollbarHeight = ref(0)
const isCursorVisible = ref(false)

// Drag State
const isMouseDown = ref(false)
const isDragStarted = ref(false)
const movingActionId = ref(null)
const movingTrackId = ref(null)
const initialMouseX = ref(0)
const initialMouseY = ref(0)
const dragThreshold = 5
const wasSelectedOnPress = ref(false)
const wasCycleSelectedOnPress = ref(false)
const wasSwitchSelectedOnPress = ref(false)
const dragStartTimes = new Map()
const hadAnomalySelection = ref(false)
const isAltDown = ref(false)
const isShiftDown = ref(false)
const hoveredContext = ref(null)
const draggingCycleBoundaryId = ref(null)
const draggingSwitchEventId = ref(null)
const draggingWeaponStatusId = ref(null)
const wasWeaponStatusSelectedOnPress = ref(false)
const weaponStatusDragOffset = ref(0)

// === 边缘自动滚动相关状态 ===
const autoScrollSpeed = ref(0)
let autoScrollRaf = null
let lastMouseX = 0
const SCROLL_ZONE = 50
const MAX_SCROLL_SPEED = 15

const TRACK_HEIGHT = 50
let resizeObserver = []

// Box Select State
const isBoxSelecting = ref(false)
const boxStart = ref({ x: 0, y: 0 })
const boxRect = ref({ left: 0, top: 0, width: 0, height: 0 })

const draggingTrackOrderIndex = ref(null)
const reorderDropTargetIndex = ref(null)

function onReorderDragStart(evt, index) {
  draggingTrackOrderIndex.value = index
  evt.dataTransfer.effectAllowed = 'move'
  
  const trackInfoEl = evt.target.closest('.track-info')
  if (trackInfoEl) {
    const rect = trackInfoEl.getBoundingClientRect()
    const offsetX = evt.clientX - rect.left
    const offsetY = evt.clientY - rect.top
    evt.dataTransfer.setDragImage(trackInfoEl, offsetX, offsetY)
  }
}

function onReorderDragOver(evt, index) {
  if (draggingTrackOrderIndex.value === null) return
  evt.preventDefault() // Allow drop
  evt.dataTransfer.dropEffect = 'move'
  reorderDropTargetIndex.value = index
}

function onReorderDrop(evt, targetIndex) {
  evt.preventDefault()
  if (draggingTrackOrderIndex.value !== null && draggingTrackOrderIndex.value !== targetIndex) {
    store.moveTrack(draggingTrackOrderIndex.value, targetIndex)
  }
  resetReorderState()
}

function onReorderDragEnd() {
  resetReorderState()
}

function resetReorderState() {
  draggingTrackOrderIndex.value = null
  reorderDropTargetIndex.value = null
}

function moveTrackUp(index) {
  if (index > 0) store.moveTrack(index, index - 1)
}

function moveTrackDown(index) {
  if (index < store.tracks.length - 1) store.moveTrack(index, index + 1)
}


// ===================================================================================
// 干员选择弹窗逻辑
// ===================================================================================

const isSelectorVisible = ref(false)
const targetTrackIndex = ref(null)
const searchQuery = ref('')
const filterElement = ref('ALL')
const isWeaponSelectorVisible = ref(false)
const weaponTargetIndex = ref(null)
const weaponSearchQuery = ref('')

const isGameTimeCollapsed = ref(true)
const showGameTime = computed(() => !isGameTimeCollapsed.value || store.isCapturing)
const gridRowHeight = computed(() => showGameTime.value ? '60px' : '48px')

const ELEMENT_FILTERS = [
  { label: '全部', value: 'ALL', color: '#888' },
  { label: '物理', value: 'physical', color: '#e0e0e0' },
  { label: '灼热', value: 'blaze', color: '#ff4d4f' },
  { label: '寒冷', value: 'cold', color: '#00e5ff' },
  { label: '电磁', value: 'emag', color: '#ffd700' },
  { label: '自然', value: 'nature', color: '#52c41a' }
]

function openCharacterSelector(index) {
  targetTrackIndex.value = index
  searchQuery.value = ''
  filterElement.value = 'ALL'
  isSelectorVisible.value = true
}

function confirmCharacterSelection(charId) {
  if (targetTrackIndex.value !== null) {
    const oldId = store.tracks[targetTrackIndex.value].id
    store.changeTrackOperator(targetTrackIndex.value, oldId, charId)
  }
  isSelectorVisible.value = false
}

function removeOperator() {
  if (targetTrackIndex.value !== null) {
    store.clearTrack(targetTrackIndex.value)
  }
  isSelectorVisible.value = false
}

function openWeaponSelector(index) {
  if (!store.tracks[index] || !store.tracks[index].id) return
  weaponTargetIndex.value = index
  weaponSearchQuery.value = ''
  isWeaponSelectorVisible.value = true
}

function confirmWeaponSelection(weaponId) {
  if (weaponTargetIndex.value !== null) {
    const track = store.tracks[weaponTargetIndex.value]
    if (track && track.id) {
      store.updateTrackWeapon(track.id, weaponId)
    }
  }
  isWeaponSelectorVisible.value = false
}

function removeWeapon() {
  if (weaponTargetIndex.value !== null) {
    const track = store.tracks[weaponTargetIndex.value]
    if (track && track.id) {
      store.updateTrackWeapon(track.id, null)
    }
  }
  isWeaponSelectorVisible.value = false
}

const filteredListFlat = computed(() => {
  let list = store.characterRoster
  if (filterElement.value !== 'ALL') {
    list = list.filter(c => c.element === filterElement.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q))
  }
  return list.sort((a, b) => (b.rarity || 0) - (a.rarity || 0))
})

const rosterByRarity = computed(() => {
  const groups = {}
  filteredListFlat.value.forEach(char => {
    const r = char.rarity || 1
    if (!groups[r]) groups[r] = []
    groups[r].push(char)
  })
  const levels = Object.keys(groups).map(Number).sort((a, b) => b - a)
  return levels.map(level => ({ level: level, list: groups[level] }))
})

function getRarityBaseColor(rarity) {
  if (rarity === 6) return '#FFD700'
  if (rarity === 5) return '#ffc400'
  if (rarity === 4) return '#d8b4fe'
  return '#a0a0a0'
}

const weaponCandidates = computed(() => {
  if (weaponTargetIndex.value === null) return []
  const track = store.tracks[weaponTargetIndex.value]
  if (!track || !track.id) return []
  const char = store.characterRoster.find(c => c.id === track.id)
  const requiredType = char?.weapon
  let list = store.weaponDatabase || []
  if (requiredType) list = list.filter(w => w.type === requiredType)
  if (weaponSearchQuery.value) {
    const q = weaponSearchQuery.value.toLowerCase()
    list = list.filter(w => (w.name || '').toLowerCase().includes(q))
  }
  return [...list].sort((a, b) => (b.rarity || 0) - (a.rarity || 0))
})

const weaponRosterByRarity = computed(() => {
  const groups = {}
  weaponCandidates.value.forEach(weapon => {
    const rarity = getWeaponRarity(weapon)
    if (!groups[rarity]) groups[rarity] = []
    groups[rarity].push(weapon)
  })
  const levels = Object.keys(groups).map(Number).sort((a, b) => b - a)
  return levels.map(level => ({ level, list: groups[level] }))
})

const currentWeaponForDialog = computed(() => {
  if (weaponTargetIndex.value === null) return null
  return getWeaponForTrack(store.tracks[weaponTargetIndex.value])
})

function getWeaponForTrack(track) {
  if (!track || !track.weaponId) return null
  return store.weaponDatabase.find(w => w.id === track.weaponId) || null
}

function getWeaponRarity(weapon) {
  return Math.max(3, weapon?.rarity || 3)
}

function isWeaponEquipped(weaponId) {
  if (weaponTargetIndex.value === null) return false
  const track = store.tracks[weaponTargetIndex.value]
  return !!track && track.weaponId === weaponId
}

const weaponStatusesByTrack = computed(() => {
  const map = new Map()
  store.weaponStatuses.forEach(status => {
    const idx = store.tracks.findIndex(t => t.id === status.trackId)
    if (idx === -1) return
    const arr = map.get(status.trackId) || []
    arr.push(status)
    map.set(status.trackId, arr)
  })
  map.forEach(arr => arr.sort((a, b) => a.startTime - b.startTime))
  return map
})

function getWeaponStatusLeft(status) {
  const start = Number(status.startTime) || 0
  return start * TIME_BLOCK_WIDTH.value
}

function getWeaponStatusBarStyle(status) {
  const start = Number(status.startTime) || 0
  const rawDuration = Number(status.duration) || 0
  const shiftedEnd = store.getShiftedEndTime(start, rawDuration, status.id)
  const finalDuration = Math.max(0, shiftedEnd - start)
  let width = finalDuration > 0 ? (finalDuration * TIME_BLOCK_WIDTH.value) : 0
  if (width > 0) {
    const ICON_SIZE = 20
    const BAR_MARGIN = 2
    width = Math.max(0, width - ICON_SIZE - BAR_MARGIN)
  }
  const color = status.color || '#b37feb'
  return {
    width: `${width}px`,
    backgroundColor: color,
    display: (finalDuration > 0 || rawDuration > 0) ? 'flex' : 'none'
  }
}

function getWeaponStatusDurationLabel(status) {
  const start = Number(status.startTime) || 0
  const baseDuration = Math.max(0, Number(status.duration) || 0)
  const shiftedEnd = store.getShiftedEndTime(start, baseDuration, status.id)
  const finalDuration = Math.max(0, shiftedEnd - start)
  const extensionAmount = Math.round((finalDuration - baseDuration) * 1000) / 1000
  if (extensionAmount > 0) {
    return `${store.formatTimeLabel(baseDuration)} (+${store.formatTimeLabel(extensionAmount)})`
  }
  return store.formatTimeLabel(baseDuration)
}

// ===================================================================================
// 核心逻辑：操作轴计算
// ===================================================================================

const operationMarkers = computed(() => {
  let rawMarkers = []
  const widthUnit = TIME_BLOCK_WIDTH.value

  store.tracks.forEach((track, index) => {
    if (!track.id) return
    const keyNum = index + 1

    track.actions.forEach(action => {
      if ((action.triggerWindow || 0) < 0) return

      let label = '', isHold = false, customClass = ''
      if (action.type === 'skill') {
        label = `${keyNum}`; customClass = 'op-skill'
      } else if (action.type === 'link') {
        label = 'E'; customClass = 'op-link'
      } else if (action.type === 'ultimate') {
        label = `${keyNum} (Hold)`; isHold = true; customClass = 'op-ultimate'
      } else return

      rawMarkers.push({
        id: `op-${action.instanceId}`,
        left: (action.startTime || 0) * widthUnit,
        width: isHold ? null : 24,
        right: ((action.startTime || 0) * widthUnit) + (isHold ? ((action.duration || 0) * widthUnit) : 24),
        label, isHold, customClass,
        top: 0, height: 14, fontSize: 9
      })
    })

    const mySwitchEvents = (store.switchEvents || []).filter(sw => sw.characterId === track.id)

    mySwitchEvents.forEach(sw => {
      rawMarkers.push({
        id: `op-sw-${sw.id}`,
        left: sw.time * widthUnit,
        width: 24,
        right: (sw.time * widthUnit) + 24,
        label: `F${keyNum}`,
        isHold: false,
        customClass: 'op-switch',
        top: 0, height: 14, fontSize: 9
      })
    })
  })

  rawMarkers.sort((a, b) => a.left - b.left)
  const finalMarkers = []
  let cluster = []
  let clusterMaxRight = -1
  const processCluster = (group) => {
    if (group.length === 0) return
    const levels = []
    group.forEach(m => {
      let placed = false
      for (let i = 0; i < levels.length; i++) {
        if (levels[i] + 1 <= m.left) { m.rowIndex = i; levels[i] = m.right; placed = true; break }
      }
      if (!placed) { m.rowIndex = levels.length; levels.push(m.right) }
    })
    const depth = levels.length
    let h, step, fs
    if (depth <= 2) { h = 14; step = 16; fs = 9; }
    else if (depth === 3) { h = 12; step = 13; fs = 9; }
    else { h = 10; step = 10; fs = 8; }
    group.forEach(m => { m.height = h; m.top = m.rowIndex * step; m.fontSize = fs; finalMarkers.push(m) })
  }
  rawMarkers.forEach(m => {
    if (cluster.length === 0) { cluster.push(m); clusterMaxRight = m.right } else {
      if (m.left < clusterMaxRight) { cluster.push(m); clusterMaxRight = Math.max(clusterMaxRight, m.right) } else { processCluster(cluster); cluster = [m]; clusterMaxRight = m.right }
    }
  })
  processCluster(cluster)
  return finalMarkers
})

// ===================================================================================
// 辅助计算属性 & 事件处理
// ===================================================================================

const totalWidthComputed = computed(() => {
  return store.TOTAL_DURATION * TIME_BLOCK_WIDTH.value
})

const transformStyle = computed(() => {
  return {
    transform: `translateX(${-store.timelineShift}px)`,
    willChange: 'transform'
  }
})

const getTrackLaneStyle = computed(() => {
  const w = TIME_BLOCK_WIDTH.value
  const totalWidth = totalWidthComputed.value

  return {
    width: `${totalWidth}px`,
    backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 0)`,
    backgroundSize: `${w}px 100%`,
    backgroundRepeat: 'repeat-x',
    imageRendering: 'auto'
  }
})

function getViewWindow({ bufferPx = 0 } = {}) {
  const width = TIME_BLOCK_WIDTH.value;
  const totalSeconds = store.TOTAL_DURATION;

  if (!tracksContentRef.value || store.isCapturing) {
    return {
      startPx: 0,
      endPx: totalSeconds * width,
      startTime: 0,
      endTime: totalSeconds
    }
  }

  const timelineWidth = store.timelineRect.width;
  const scrollLeft = store.timelineShift;

  const startPx = Math.max(scrollLeft - bufferPx, 0);
  const endPx = Math.min(scrollLeft + timelineWidth + bufferPx, totalSeconds * width);

  return {
    startPx,
    endPx,
    startTime: Math.floor(startPx / width),
    endTime: Math.ceil(endPx / width)
  }
}

const rawDynamicTicks = computed(() => {
  const width = TIME_BLOCK_WIDTH.value;
  const viewWindow = getViewWindow({ bufferPx: 100 });

  const realStart = viewWindow.startTime;
  const realEnd = viewWindow.endTime;
  
  const gameStart = store.toGameTime(realStart);

  let subDivision = 1;
  if (width >= 800) subDivision = 60;
  else if (width >= 200) subDivision = 10;
  else if (width >= 100) subDivision = 2;

  const startStep = Math.floor(Math.min(realStart, gameStart) * subDivision);
  const endStep = Math.ceil(realEnd * subDivision);

  const realTicks = [];
  const gameTicks = [];

  for (let i = startStep; i <= endStep; i++) {
    const t = i / subDivision;
    let type = '';
    let label = '';
    const isIntegerSecond = (i % subDivision === 0);

    if (isIntegerSecond) {
      const secondValue = Math.round(t);
      const isFiveSec = secondValue % 5 === 0;
      const showAllLabels = width >= 100;

      if (showAllLabels || isFiveSec) {
        type = 'major';
        label = `${secondValue}s`;
      } else {
        type = 'major-dim';
      }

    } else {
      if (subDivision === 2) {
        type = 'tenth';
      } else if (subDivision === 10) {
        type = 'tenth';
        if (width >= 500) label = `.${Math.round((t % 1) * 10)}`;
      } else if (subDivision === 60) {
        const frameIdx = i % 60;
        if (frameIdx % 10 === 0 && frameIdx !== 0) {
          type = 'tenth';
          if (width >= 600) label = `${frameIdx}f`;
        } else if (frameIdx % 2 === 0) {
          type = 'frame';
        } else {
          if (width < 1000) continue;
          type = 'frame';
        }
      } else {
        continue;
      }
    }

    realTicks.push({
      time: t,
      type,
      label,
      x: t * width
    });

    const realT = store.toRealTime(t);

    // 游戏时间相对现实时间有偏移，所以再检查一次窗口边界
    if (realT >= realStart && realT <= realEnd) {
      gameTicks.push({
        time: t,
        type,
        label,
        x: realT * width
      });
    }
  }

  return { realTicks, gameTicks };
});

const dynamicTicks = refThrottled(rawDynamicTicks, 100);

function forceSvgUpdate() { svgRenderKey.value++ }

function updateScrollbarHeight() {
  if (tracksContentRef.value) {
    const el = tracksContentRef.value
    const height = el.offsetHeight - el.clientHeight
    scrollbarHeight.value = height > 0 ? height : 0
  }
}

function calculateTimeFromEvent(evt, fixedStep = null) {
  const mouseXInTrack = store.toTimelineSpace(evt.clientX, evt.clientY).x

  const rawTime = mouseXInTrack / TIME_BLOCK_WIDTH.value

  const step = fixedStep !== null ? fixedStep : store.snapStep

  const inverse = 1 / step
  let startTime = Math.round(rawTime * inverse) / inverse
  if (startTime < 0) startTime = 0

  return startTime
}

const fakeScrollbarRef = ref(null)

let ticking = false
function onFakeScroll(e) {
  if (ticking) return
  ticking = true
  store.setTimelineShift(e.target.scrollLeft)
  requestAnimationFrame(() => {
    ticking = false
  })
}

watch(() => store.timelineShift, (val) => {
  if (fakeScrollbarRef.value) {
    fakeScrollbarRef.value.scrollLeft = val
  }
})

watch(() => store.timelineScrollTop, (val) => {
  if (tracksHeaderRef.value) {
    tracksHeaderRef.value.scrollTop = val
  }
  if (tracksContentRef.value && Math.abs(tracksContentRef.value.scrollTop - val) > 1) {
    tracksContentRef.value.scrollTop = val
  }
})

function syncVerticalScroll() {
  if (tracksContentRef.value) {
    const top = tracksContentRef.value.scrollTop
    store.setScrollTop(top)
  }
}


function onActionContextMenu(evt, action) {
  if (!store.multiSelectedIds.has(action.instanceId)) {
    store.selectAction(action.instanceId)
  }
  store.openContextMenu(evt, action.instanceId)
}
// ===================================================================================
// 鼠标与拖拽逻辑
// ===================================================================================

const cachedSpData = computed(() => store.calculateGlobalSpData())
const currentSpValue = computed(() => {
  const time = store.cursorPosTimeline.x / TIME_BLOCK_WIDTH.value
  const points = cachedSpData.value
  if (!points || points.length === 0) {
    const val = Number(store.systemConstants.initialSp)
    return isNaN(val) ? 200 : val
  }
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]; const p2 = points[i+1]
    if (time >= p1.time && time < p2.time) {
      const progress = (time - p1.time) / (p2.time - p1.time)
      const val = p1.sp + (p2.sp - p1.sp) * progress
      return Math.floor(val)
    }
  }
  return Math.floor(points[points.length - 1].sp)
})

const cachedStaggerData = computed(() => store.calculateGlobalStaggerData().points)
const currentStaggerValue = computed(() => {
  const time = store.cursorPosTimeline.x / TIME_BLOCK_WIDTH.value
  const points = cachedStaggerData.value
  if (!points || points.length === 0) return 0
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i+1]
    if (time >= p1.time && time < p2.time) {
      return Math.floor(p1.val)
    }
  }
  return Math.floor(points[points.length - 1].val)
})

function onGridMouseMove(evt) {
  store.setCursorPosition(evt.clientX, evt.clientY)
  isCursorVisible.value = true
}
function onGridMouseLeave() { isCursorVisible.value = false }

function onContentMouseDown(evt) {
  if (store.isBoxSelectMode) {
    evt.stopPropagation(); evt.preventDefault()
    isBoxSelecting.value = true
    boxStart.value = store.toTimelineSpace(evt.clientX, evt.clientY)
    boxRect.value = { left: boxStart.value.x, top: boxStart.value.y, width: 0, height: 0 }
    window.addEventListener('mousemove', onBoxMouseMove)
    window.addEventListener('mouseup', onBoxMouseUp)
    return
  }
  onBackgroundClick(evt)
}

function onCycleLineMouseDown(evt, boundaryId) {
  evt.stopPropagation()

  wasCycleSelectedOnPress.value = (store.selectedCycleBoundaryId === boundaryId)

  if (!wasCycleSelectedOnPress.value) {
    store.selectCycleBoundary(boundaryId)
  }

  draggingCycleBoundaryId.value = boundaryId
  initialMouseX.value = evt.clientX
  initialMouseY.value = evt.clientY
  isDragStarted.value = false
  isMouseDown.value = true

  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
}

function onBoxMouseMove(evt) {
  if (!isBoxSelecting.value) return
  const current = store.toTimelineSpace(evt.clientX, evt.clientY)
  const left = Math.min(boxStart.value.x, current.x)
  const top = Math.min(boxStart.value.y, current.y)
  boxRect.value = {
    left, top,
    width: Math.abs(current.x - boxStart.value.x),
    height: Math.abs(current.y - boxStart.value.y)
  }
}

function onBoxMouseUp() {
  isBoxSelecting.value = false
  window.removeEventListener('mousemove', onBoxMouseMove)
  window.removeEventListener('mouseup', onBoxMouseUp)
  const box = boxRect.value
  const selection = {
    left: box.width > 0 ? box.left : box.left + box.width,
    top: box.height > 0 ? box.top : box.top + box.height,
    right: box.width > 0 ? box.left + box.width : box.left,
    bottom: box.height > 0 ? box.top + box.height : box.top
  }
  if (selection.left > selection.right) [selection.left, selection.right] = [selection.right, selection.left]
  if (selection.top > selection.bottom) [selection.top, selection.bottom] = [selection.bottom, selection.top]
  const foundIds = []
  store.tracks.forEach((track, trackIndex) => {
    const trackEl = document.getElementById(`track-row-${trackIndex}`)
    if (!trackEl) return
    const trackRect = trackEl.getBoundingClientRect()
    const containerRect = store.timelineRect
    const trackRelativeTop = (trackRect.top - containerRect.top) + store.timelineScrollTop
    const trackRelativeBottom = trackRelativeTop + trackRect.height
    if (trackRelativeBottom < selection.top || trackRelativeTop > selection.bottom) return
    track.actions.forEach(action => {
      const startPixel = action.startTime * TIME_BLOCK_WIDTH.value
      const endPixel = (action.startTime + action.duration) * TIME_BLOCK_WIDTH.value
      if (startPixel < selection.right && endPixel > selection.left) foundIds.push(action.instanceId)
    })
  })
  if (foundIds.length > 0) { store.setMultiSelection(foundIds); ElMessage.success(`选中了 ${foundIds.length} 个动作`) }
  else { store.clearSelection() }
  boxRect.value = { left: 0, top: 0, width: 0, height: 0 }
}

// ===================================================================================
// 缩放逻辑
// ===================================================================================

const zoomValue = computed({
  get: () => store.timeBlockWidth,
  set: (val) => store.setBaseBlockWidth(val)
})

function adjustZoom(delta, anchorTime = null) {
  const oldWidth = store.timeBlockWidth

  if (anchorTime === null) {
    const viewportCenterX = store.timelineShift + store.timelineRect.width / 2
    anchorTime = viewportCenterX / oldWidth
  }

  const anchorOffsetInViewport = (anchorTime * oldWidth) - store.timelineShift

  const newVal = oldWidth + delta
  store.setBaseBlockWidth(newVal)

  const newWidth = store.timeBlockWidth

  const newScrollLeft = (anchorTime * newWidth) - anchorOffsetInViewport

  nextTick(() => {
    store.setTimelineShift(newScrollLeft)
  })
}
function handleWheel(e) {
  if (e.ctrlKey) {
    e.preventDefault()

    const timeAtMouse = store.cursorCurrentTime

    const zoomSpeed = 0.15
    const direction = e.deltaY < 0 ? 1 : -1
    const delta = Math.round(store.timeBlockWidth * zoomSpeed * direction)

    adjustZoom(delta, timeAtMouse)
  }
}

function handleTrackWheel(e) {
  if (ticking) return

  ticking = true
  requestAnimationFrame(() => {
    ticking = false
  })

  if (e.ctrlKey) {
    handleWheel(e); return
  }

  if (Math.abs(e.deltaX) > 0 || e.shiftKey) {
    e.preventDefault()
    let delta = e.deltaX
    if (e.shiftKey && delta === 0) delta = e.deltaY

    const newLeft = store.timelineShift + delta
    store.setTimelineShift(newLeft)
  }
}

// ===================================================================================
// 对齐辅助线逻辑
// ===================================================================================

const alignGuide = ref({
  visible: false,
  x: 0,
  top: 0,
  height: 0,
  label: '',
  type: '', // 'snap' | 'align'
  color: '',
  targetRect: null
})

function updateAlignGuide(evt, action) {
  hoveredContext.value = { action, clientX: evt.clientX }

  if (!isAltDown.value || !store.selectedActionId || store.selectedActionId === action.instanceId) {
    alignGuide.value.visible = false
    return
  }

  const actionLayout = store.getNodeRect(action.instanceId)
  if (!actionLayout) return

  const rect = actionLayout.rect
  const relLeft = rect.left
  const relTop = rect.top

  const clickX = store.toTimelineSpace(evt.clientX, evt.clientY).x - rect.left
  const isClickLeft = clickX < (rect.width / 2)
  const isShift = isShiftDown.value

  let guideX = 0
  let label = ''
  let type = ''
  let color = ''
  let iconKey = ''

  if (!isShift) {
    // 磁吸模式 (Snap)
    type = 'snap'
    color = '#00e5ff'
    if (isClickLeft) {
      guideX = relLeft
      label = '接前方'
      iconKey = 'snap-left'
    } else {
      guideX = relLeft + rect.width
      label = '接后方'
      iconKey = 'snap-right'
    }
  } else {
    // 对齐模式 (Align)
    type = 'align'
    color = '#ff00ff'
    if (isClickLeft) {
      guideX = relLeft
      label = '左对齐'
      iconKey = 'align-left'
    } else {
      guideX = relLeft + rect.width
      label = '右对齐'
      iconKey = 'align-right'
    }
  }

  alignGuide.value = {
    visible: true,
    x: guideX,
    top: relTop,
    height: rect.height,
    label,
    iconKey,
    type,
    color,
    targetRect: { left: relLeft, top: relTop, width: rect.width, height: rect.height }
  }
}

function hideAlignGuide() {
  alignGuide.value.visible = false
  hoveredContext.value = null
}

function recalcAlignGuide() {
  if (hoveredContext.value) {
    const { action, clientX } = hoveredContext.value
    updateAlignGuide({ clientX }, action)
  }
}

function onBackgroundContextMenu(evt) {
  evt.preventDefault()

  if (isBoxSelecting.value || isDragStarted.value) return

  const cursorPos = store.toTimelineSpace(evt.clientX, evt.clientY)
  const rawTime = cursorPos.x / TIME_BLOCK_WIDTH.value

  const snap = store.snapStep
  let clickTime = Math.round(rawTime / snap) * snap
  clickTime = Math.round(Math.max(0, clickTime) * 1000) / 1000
  store.openContextMenu(evt, null, clickTime)
}

function onActionMouseDown(evt, track, action) {
  evt.stopPropagation()
  if (action.isLocked) {
    if (evt.button === 0) {
      store.selectAction(action.instanceId)
      ElMessage.warning({ message: '该动作已锁定位置', duration: 1000, grouping: true })
      return
    }
  }

  const actionLayout = store.getNodeRect(action.instanceId)
  if (!actionLayout) return

  const mousePos = store.toTimelineSpace(evt.clientX, evt.clientY)

  if (isAltDown.value) {
    if (store.selectedActionId && store.selectedActionId !== action.instanceId) {
      const rect = actionLayout.rect
      const clickX = mousePos.x - rect.left
      const isClickLeft = clickX < (rect.width / 2)
      const isShift = isShiftDown.value

      let alignMode = ''
      let msg = ''

      if (!isShift) {
        if (isClickLeft) { alignMode = 'RL'; msg = '已拼接至前方' }
        else { alignMode = 'LR'; msg = '已拼接至后方' }
      } else {
        if (isClickLeft) { alignMode = 'LL'; msg = '已左对齐' }
        else { alignMode = 'RR'; msg = '已右对齐' }
      }

      const success = store.alignActionToTarget(action.instanceId, alignMode)
      if (success) {
        ElMessage.success(msg)
        hideAlignGuide()
      } else {
        ElMessage.warning('位置未改变')
      }
    }
    return
  }

  if (connectionHandler.isDragging.value) return
  if (evt.button !== 0) return

  const offset = mousePos.x - actionLayout.rect.left

  setTimeout(() => {
    wasSelectedOnPress.value = store.multiSelectedIds.has(action.instanceId)
    hadAnomalySelection.value = (store.selectedAnomalyId !== null)

    if (!store.multiSelectedIds.has(action.instanceId)) {
      store.selectAction(action.instanceId)
    }

    isMouseDown.value = true
    isDragStarted.value = false
    movingActionId.value = action.instanceId
    movingTrackId.value = track.id
    initialMouseY.value = evt.clientY

    dragStartTimes.clear()
    store.tracks.forEach(t => {
      t.actions.forEach(a => {
        if (a.logicalStartTime === undefined) a.logicalStartTime = a.startTime
        dragStartTimes.set(a.instanceId, a.logicalStartTime)
      })
    })

    initialMouseX.value = evt.clientX

    window.addEventListener('mousemove', onWindowMouseMove)
    window.addEventListener('mouseup', onWindowMouseUp)
    window.addEventListener('blur', onWindowMouseUp)
  }, 0)
}

function updateDragPosition(clientX) {
  if (!isDragStarted.value || !movingActionId.value) return;

  const delta = clientX - initialMouseX.value;
  const deltaTime = delta / TIME_BLOCK_WIDTH.value

  const selectedIds = store.multiSelectedIds;
  const snap = store.snapStep;

  store.tracks.forEach(t => {
    t.actions.forEach(a => {
      if (selectedIds.has(a.instanceId) && !a.isLocked) {
        const orgLogical = dragStartTimes.get(a.instanceId);
        const targetTime = orgLogical + deltaTime;

        let snappedTime = Math.round(targetTime / snap) * snap;

        a.logicalStartTime = Math.max(0, Math.round(snappedTime * 1000) / 1000);
      }
    });
  });

  store.refreshAllActionShifts();

  nextTick(() => svgRenderKey.value++);
}

function performAutoScroll() {
  if (autoScrollSpeed.value === 0) {
    cancelAnimationFrame(autoScrollRaf)
    autoScrollRaf = null
    return
  }
  const newShift = store.timelineShift + autoScrollSpeed.value
  store.setTimelineShift(newShift)
  updateDragPosition(lastMouseX)
  autoScrollRaf = requestAnimationFrame(performAutoScroll)
}

function onSwitchMarkerMouseDown(evt, id) {
  evt.stopPropagation()
  evt.preventDefault()
  if (evt.button !== 0) return

  wasSwitchSelectedOnPress.value = (store.selectedSwitchEventId === id)

  if (!wasSwitchSelectedOnPress.value) {
    store.selectSwitchEvent(id)
  }
  draggingSwitchEventId.value = id
  initialMouseX.value = evt.clientX
  initialMouseY.value = evt.clientY
  isDragStarted.value = false
  isMouseDown.value = true

  document.body.classList.add('is-dragging')

  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
  window.addEventListener('blur', onWindowMouseUp)
}

function onWeaponStatusMouseDown(evt, status) {
  evt.stopPropagation()
  evt.preventDefault()
  if (connectionHandler.isDragging.value) return
  if (evt.button !== 0) return

  wasWeaponStatusSelectedOnPress.value = (store.selectedWeaponStatusId === status.id)

  if (!wasWeaponStatusSelectedOnPress.value) {
    store.selectWeaponStatus(status.id)
  }

  draggingWeaponStatusId.value = status.id
  const mousePos = store.toTimelineSpace(evt.clientX, evt.clientY)
  const offset = (mousePos.x / TIME_BLOCK_WIDTH.value) - (Number(status.startTime) || 0)
  weaponStatusDragOffset.value = Number.isFinite(offset) ? offset : 0
  initialMouseX.value = evt.clientX
  initialMouseY.value = evt.clientY
  isDragStarted.value = false
  isMouseDown.value = true

  document.body.classList.add('is-dragging')

  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
  window.addEventListener('blur', onWindowMouseUp)
}

function onWindowMouseMove(evt) {
  if (draggingSwitchEventId.value) {
    if (!isDragStarted.value) {
      const dist = Math.sqrt(Math.pow(evt.clientX - initialMouseX.value, 2) + Math.pow(evt.clientY - initialMouseY.value, 2))
      if (dist > dragThreshold) isDragStarted.value = true; else return
    }
    let newTime = calculateTimeFromEvent(evt, store.snapStep)
    if (newTime > store.TOTAL_DURATION) newTime = store.TOTAL_DURATION
    newTime = Math.round(newTime * 1000) / 1000
    store.updateSwitchEvent(draggingSwitchEventId.value, newTime)
    return
  }
  if (draggingWeaponStatusId.value) {
    if (!isDragStarted.value) {
      const dist = Math.sqrt(Math.pow(evt.clientX - initialMouseX.value, 2) + Math.pow(evt.clientY - initialMouseY.value, 2))
      if (dist > dragThreshold) isDragStarted.value = true; else return
    }
    let newTime = calculateTimeFromEvent(evt, store.snapStep) - weaponStatusDragOffset.value
    if (newTime > store.TOTAL_DURATION) newTime = store.TOTAL_DURATION
    if (newTime < 0) newTime = 0
    newTime = Math.round(newTime * 1000) / 1000
    const status = store.weaponStatuses.find(s => s.id === draggingWeaponStatusId.value)
    if (status) {
      status.startTime = newTime
      status.logicalStartTime = newTime
    }
    return
  }
  if (draggingCycleBoundaryId.value) {
    if (!isDragStarted.value) {
      const dist = Math.sqrt(Math.pow(evt.clientX - initialMouseX.value, 2) + Math.pow(evt.clientY - initialMouseY.value, 2))
      if (dist > dragThreshold) {
        isDragStarted.value = true
      } else {
        return
      }
    }
    let newTime = calculateTimeFromEvent(evt, store.snapStep)
    if (newTime > store.TOTAL_DURATION) newTime = store.TOTAL_DURATION
    newTime = Math.round(newTime * 1000) / 1000
    store.updateCycleBoundary(draggingCycleBoundaryId.value, newTime)
    return
  }
  if (!isMouseDown.value) return
  if (evt.buttons === 0) { onWindowMouseUp(evt); return }
  const target = evt.target
  const isForm = target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  const isSidebar = target && (target.closest('.properties-sidebar') || target.closest('.action-library'))
  if (isForm || isSidebar) { onWindowMouseUp(evt); return }

  if (!isDragStarted.value) {
    const dist = Math.sqrt(Math.pow(evt.clientX - initialMouseX.value, 2) + Math.pow(evt.clientY - initialMouseY.value, 2))
    if (dist > dragThreshold) isDragStarted.value = true; else return
  }

  lastMouseX = evt.clientX
  if (tracksContentRef.value) {
    const rect = store.timelineRect
    if (evt.clientX < rect.left + SCROLL_ZONE) {
      const ratio = 1 - (Math.max(0, evt.clientX - rect.left) / SCROLL_ZONE)
      autoScrollSpeed.value = -Math.max(2, ratio * MAX_SCROLL_SPEED)
    }
    else if (evt.clientX > rect.right - SCROLL_ZONE) {
      const ratio = 1 - (Math.max(0, rect.right - evt.clientX) / SCROLL_ZONE)
      autoScrollSpeed.value = Math.max(2, ratio * MAX_SCROLL_SPEED)
    }
    else {
      autoScrollSpeed.value = 0
    }
    if (autoScrollSpeed.value !== 0 && !autoScrollRaf) {
      performAutoScroll()
    }
  }

  if (autoScrollSpeed.value === 0) {
    updateDragPosition(evt.clientX)
  }
}

function onGlobalWindowMouseUp(event) {
  if (connectionHandler.isDragging.value && event && event.target.tagName !== 'BUTTON') {
      connectionHandler.cancelDrag() 
  }
}

function onWindowMouseUp(event) {
  autoScrollSpeed.value = 0
  if (autoScrollRaf) { cancelAnimationFrame(autoScrollRaf); autoScrollRaf = null }

  if (draggingSwitchEventId.value) {
    if (!isDragStarted.value && wasSwitchSelectedOnPress.value) {
      store.selectSwitchEvent(draggingSwitchEventId.value)
    }

    if (isDragStarted.value) {
      store.commitState()
    }

    isDragStarted.value = false
    draggingSwitchEventId.value = null
    document.body.classList.remove('is-dragging')
    window.removeEventListener('mousemove', onWindowMouseMove)
    window.removeEventListener('mouseup', onWindowMouseUp)
    window.removeEventListener('blur', onWindowMouseUp)
    isMouseDown.value = false

    return
  }

  if (draggingWeaponStatusId.value) {
    if (!isDragStarted.value && wasWeaponStatusSelectedOnPress.value) {
      store.selectWeaponStatus(draggingWeaponStatusId.value)
    }

    if (isDragStarted.value) {
      store.commitState()
    }

    isDragStarted.value = false
    draggingWeaponStatusId.value = null
    document.body.classList.remove('is-dragging')
    window.removeEventListener('mousemove', onWindowMouseMove)
    window.removeEventListener('mouseup', onWindowMouseUp)
    window.removeEventListener('blur', onWindowMouseUp)
    isMouseDown.value = false
    return
  }

  if (draggingCycleBoundaryId.value) {

    if (!isDragStarted.value && wasCycleSelectedOnPress.value) {
      store.selectCycleBoundary(draggingCycleBoundaryId.value)
    }

    if (isDragStarted.value) {
      store.commitState()
    }

    isDragStarted.value = false
    draggingCycleBoundaryId.value = null
    window.removeEventListener('mousemove', onWindowMouseMove)
    window.removeEventListener('mouseup', onWindowMouseUp)
    window.removeEventListener('blur', onWindowMouseUp)
    isMouseDown.value = false
    return
  }

  const _wasDragging = isDragStarted.value
  try {
    if (!isDragStarted.value && movingActionId.value) {
      if (store.selectedAnomalyId) {
        store.setSelectedAnomalyId(null)
      } else if (wasSelectedOnPress.value) {
        store.selectAction(movingActionId.value)
      }
    } else if (_wasDragging) { store.commitState() }
  } catch (error) { console.error("MouseUp Error:", error) } finally {
    dragStartTimes.clear()
    isMouseDown.value = false; isDragStarted.value = false; movingActionId.value = null; movingTrackId.value = null
    window.removeEventListener('mousemove', onWindowMouseMove)
    window.removeEventListener('mouseup', onWindowMouseUp)
    window.removeEventListener('blur', onWindowMouseUp)
  }
  if (_wasDragging) window.addEventListener('click', captureClick, {capture: true, once: true})
}

function captureClick(e) { e.stopPropagation(); e.preventDefault() }
function onTrackDrop(track, evt) {
  const skill = store.draggingSkillData; if (!skill || store.activeTrackId !== track.id) return
  if (skill.librarySource === 'weapon' || skill.type === 'weapon') {
    if (!track.weaponId || (skill.weaponId && skill.weaponId !== track.weaponId)) return
    const startTime = calculateTimeFromEvent(evt)
    store.addWeaponStatus(track.id, skill, startTime)
    return
  }
  const startTime = calculateTimeFromEvent(evt)
  store.addSkillToTrack(track.id, skill, startTime)
  nextTick(() => forceSvgUpdate())
}
function onTrackDragOver(evt) { evt.preventDefault(); evt.dataTransfer.dropEffect = 'copy' }

function onBackgroundClick(event) {
  if (!event || event.target === tracksContentRef.value || event.target.classList.contains('track-row') || event.target.classList.contains('time-block')) {
    store.selectTrack(null)
  }
}

function handleKeyDown(event) {
  const target = event.target
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return

  const hasSelection = store.selectedActionId || store.multiSelectedIds.size > 0 || store.selectedConnectionId || store.selectedCycleBoundaryId || store.selectedSwitchEventId || store.selectedWeaponStatusId
  if (!hasSelection) return

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault();
    const result = store.removeCurrentSelection();
    if (result && result.total > 0) {
      ElMessage.success({ message: '已删除', duration: 800 })
    }
  }
  if (store.selectedActionId || store.multiSelectedIds.size > 0) {
    if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') { event.preventDefault(); store.nudgeSelection(-1) }
    if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') { event.preventDefault(); store.nudgeSelection(1) }
  }
}

function handleGlobalKeyUp(e) {
  if (e.key === 'Alt') {
    isAltDown.value = false;
    hideAlignGuide()
  }
  if (e.key === 'Shift') {
    isShiftDown.value = false;
    recalcAlignGuide()
  }
}

function resetModifierKeys() {
  isAltDown.value = false
  isShiftDown.value = false
  hideAlignGuide()
}

function handleGlobalKeyDownWrapper(e) {
  if (e.key === 'Alt') {
    e.preventDefault()
    isAltDown.value = true
    recalcAlignGuide()
  }
  if (e.key === 'Shift') {
    isShiftDown.value = true
    recalcAlignGuide()
  }
  handleKeyDown(e)
}

function updateTrackRects() {
  trackLaneRefs.value.forEach(ref => {
    const idx = ref.dataset.trackIndex
    const rect = ref.getBoundingClientRect()
    const style = window.getComputedStyle(ref)
    // 排除border
    let borderTop = parseInt(style.borderTopWidth)
    let borderBottom = parseInt(style.borderBottomWidth)

    if (Number.isNaN(borderTop)) borderTop = 0
    if (Number.isNaN(borderBottom)) borderBottom = 0
      
    const data = {
      top: rect.top + borderTop,
      bottom: rect.bottom - borderBottom,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height - borderTop - borderBottom
    }
    store.setTrackLaneRect(idx, data)
  })
}

const activeFreezeRegions = computed(() => {
  const selectedIds = store.multiSelectedIds
  const hoveredId = store.hoveredActionId
  if (selectedIds.size === 0 && !hoveredId) return []
  return store.globalExtensions.filter(ext => {
    return ext.sourceId === hoveredId || selectedIds.has(ext.sourceId)
  })
})

watch(() => store.timeBlockWidth, () => { nextTick(() => { forceSvgUpdate(); updateScrollbarHeight() }) })
watch(() => [store.tracks, store.connections], () => { nextTick(() => { forceSvgUpdate() }) }, { deep: true })

onMounted(() => {
  if (tracksContentRef.value) {
    tracksContentRef.value.addEventListener('scroll', syncVerticalScroll)

    const tracksResizeObserver = new ResizeObserver(([entry]) => { 
      const rect = entry.target.getBoundingClientRect()

      updateTrackRects()

      store.setTimelineRect(rect.width, rect.height, rect.top, rect.right, rect.bottom, rect.left)
      forceSvgUpdate(); updateScrollbarHeight();
    })

    tracksResizeObserver.observe(tracksContentRef.value)
    resizeObserver.push(tracksResizeObserver)
    updateScrollbarHeight()
  }

  window.addEventListener('keydown', handleGlobalKeyDownWrapper)
  window.addEventListener('keyup', handleGlobalKeyUp)
  window.addEventListener('blur', resetModifierKeys)
  window.addEventListener('mouseup', onGlobalWindowMouseUp)
})
onUnmounted(() => {
  if (tracksContentRef.value) {
    // tracksContentRef.value.removeEventListener('scroll', syncRulerScroll);
    tracksContentRef.value.removeEventListener('scroll', syncVerticalScroll);
    // tracksContentRef.value.removeEventListener('wheel', handleWheel)
  }
  resizeObserver.forEach(obs => obs.disconnect())
  resizeObserver = []
  window.removeEventListener('keydown', handleGlobalKeyDownWrapper)
  window.removeEventListener('keyup', handleGlobalKeyUp)
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
  window.removeEventListener('mousemove', onBoxMouseMove)
  window.removeEventListener('mouseup', onBoxMouseUp)
  window.removeEventListener('blur', resetModifierKeys)
  window.removeEventListener('mouseup', onGlobalWindowMouseUp)
})
</script>

<template>
  <div class="timeline-grid-layout" :style="{ gridTemplateRows: `${gridRowHeight} 1fr` }">
    <div class="corner-placeholder">
      <div class="corner-controls">
        <div class="corner-button-row">
          <button class="mini-tool-btn" :class="{ 'is-active': store.showCursorGuide }" @click="store.toggleCursorGuide" title="辅助线 (Ctrl+G)">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="6" x2="12" y2="18"></line><line x1="6" y1="12" x2="18" y2="12"></line></svg>
          </button>
          
          <button class="mini-tool-btn" :class="{ 'is-active': store.isBoxSelectMode }" @click="store.toggleBoxSelectMode" title="框选 (Ctrl+B)">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 4"/><path d="M8 12h8" stroke-width="1.5"/><path d="M12 8v8" stroke-width="1.5"/></svg>
          </button>
          
          <button class="mini-tool-btn" :class="{ 'is-active': store.snapStep < 0.1 }" @click="store.toggleSnapStep" title="吸附精度 (Alt+S)">
            <span class="btn-text">{{ store.snapStep < 0.05 ? '1f' : '0.1s' }}</span>
          </button>
          
          <button class="mini-tool-btn" :class="{ 'is-active': connectionHandler.toolEnabled.value }" @click="store.toggleConnectionTool" title="连线工具 (Alt+L)">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M5 4h14c3 0 3 8 0 8h-14c-3 0-3 8 0 8h14" /><circle cx="5" cy="4" r="2" fill="currentColor"/><circle cx="19" cy="20" r="2" fill="currentColor"/></svg>
          </button>
        </div>
        
        <div class="corner-zoom-row">
          <div class="zoom-info-line">
            <span class="zoom-label">SCALE</span>
            <span class="zoom-value">{{ Math.round((store.timeBlockWidth / 50) * 100) }}%</span>
          </div>
          <div class="zoom-slider-container">
            <span class="zoom-icon" @click="adjustZoom(-Math.max(1, Math.round(store.timeBlockWidth * 0.1)), null)"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg></span>
            <input
            type="range"
            class="davinci-range"
            :min="store.ZOOM_LIMITS.MIN"
            :max="store.ZOOM_LIMITS.MAX"
            step="1"
            v-model.number="zoomValue"
            />
            <span class="zoom-icon" @click="adjustZoom(Math.max(1, Math.round(store.timeBlockWidth * 0.1)), null)"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></span>
          </div>
        </div>
      </div>
      <div class="timeline-label-wrapper">
        <template v-if="showGameTime">
          <div class="timeline-label interactable" title="游戏时间（点击折叠）" @click="isGameTimeCollapsed = true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <text x="12" y="20" font-size="20" fill="currentColor" text-anchor="middle" font-weight="bold" font-family="sans-serif">G</text>
            </svg>
            <div class="collapse-hint-icon">
              <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="3" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
          <div class="timeline-label" title="现实时间">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <text x="12" y="20" font-size="20" fill="currentColor" text-anchor="middle" font-weight="bold" font-family="sans-serif">R</text>
            </svg>
          </div>
        </template>
        <template v-else>
          <div class="timeline-label interactable expand-btn" title="展开游戏时间轴" @click="isGameTimeCollapsed = false">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </div>
        </template>
      </div>
    </div>

    <div class="time-ruler-wrapper" ref="timeRulerWrapperRef" @click="store.selectTrack(null)">
      <div class="ruler-content-container" :style="transformStyle">
      <div v-show="showGameTime" class="time-ruler-track game-time" :style="{ width: `${totalWidthComputed}px` }">
        <div v-for="(ext, idx) in store.globalExtensions"
             :key="idx"
             class="freeze-region-dim timeline"
             :style="{
             left: `${ext.time * TIME_BLOCK_WIDTH}px`,
             width: `${ext.amount * TIME_BLOCK_WIDTH}px`}">
        </div>
        <div v-for="tick in dynamicTicks.gameTicks"
             :key="tick.time"
             class="tick-line"
             :class="tick.type"
             :style="{ left: `${Math.round(tick.x)}px` }">
           <span v-if="tick.label" class="tick-label">{{ tick.label }}</span>
        </div>
      </div>
      <div class="time-ruler-track" :style="{ width: `${totalWidthComputed}px` }">
        <div v-for="tick in dynamicTicks.realTicks"
             :key="tick.time"
             class="tick-line"
             :class="tick.type"
             :style="{ left: `${Math.round(tick.x)}px` }">
          <span v-if="tick.label" class="tick-label">{{ tick.label }}</span>
        </div>
      </div>
      <div class="operation-layer">
        <div v-for="op in operationMarkers" :key="op.id" class="key-cap"
             :class="[op.customClass, { 'is-hold': op.isHold }]"
             :style="{ left: `${op.left}px`, top: `${op.top}px`, width: op.width ? `${op.width}px` : 'auto', height: `${op.height}px`, fontSize: `${op.fontSize}px` }">
          <span class="key-text">{{ op.label }}</span>
        </div>
      </div>
      </div>
    </div>

    <div class="tracks-header-sticky" ref="tracksHeaderRef" @click="store.selectTrack(null)"
         :style="{ paddingBottom: `${20 + scrollbarHeight}px` }">
      <div v-for="(track, index) in store.teamTracksInfo" :key="index" class="track-info"
           @click.stop="store.selectTrack(track.id)"
           :class="{ 
             'is-active': track.id && track.id === store.activeTrackId,
             'is-reorder-target': reorderDropTargetIndex === index && draggingTrackOrderIndex !== index,
             'is-reorder-source': draggingTrackOrderIndex === index
           }"
           @dragover="onReorderDragOver($event, index)"
           @drop="onReorderDrop($event, index)"
           @dragend="onReorderDragEnd">

        <div class="track-controls">
           <div class="reorder-btn arrow-btn up-btn" @click.stop="moveTrackUp(index)" :class="{ disabled: index === 0 }" title="上移">
              <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="3" fill="none"><polyline points="18 15 12 9 6 15"></polyline></svg>
           </div>
           
           <div class="drag-handle" draggable="true" @dragstart="onReorderDragStart($event, index)">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><circle cx="8" cy="4" r="2"></circle><circle cx="8" cy="12" r="2"></circle><circle cx="8" cy="20" r="2"></circle><circle cx="16" cy="4" r="2"></circle><circle cx="16" cy="12" r="2"></circle><circle cx="16" cy="20" r="2"></circle></svg>
           </div>

           <div class="reorder-btn arrow-btn down-btn" @click.stop="moveTrackDown(index)" :class="{ disabled: index === store.tracks.length - 1 }" title="下移">
              <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="3" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
           </div>
        </div>

        <div class="char-select-trigger">
          <div class="trigger-avatar-wrapper">
            <div class="trigger-avatar-box" @click.stop="openCharacterSelector(index)" title="点击更换干员">
              <img v-if="track.id" :src="track.avatar" class="avatar-image" :alt="track.name"/>
              <div v-else class="avatar-placeholder"></div>
              <div class="avatar-change-hint" v-if="track.id">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.5 2v6h-6"></path>
                  <path d="M21.5 8A10 10 0 0 0 3 8"></path>
                  <path d="M2.5 22v-6h6"></path>
                  <path d="M2.5 16A10 10 0 0 0 21 16"></path>
                </svg>
              </div>
            </div>
            <div v-if="track.id" class="weapon-slot-compact" @click.stop="openWeaponSelector(index)" title="选择武器">
              <div class="weapon-box" :class="getWeaponForTrack(track) ? '' : 'weapon-empty'">
                <img v-if="getWeaponForTrack(track)?.icon" :src="getWeaponForTrack(track).icon" @error="e=>e.target.style.display='none'" />
                <div v-else class="weapon-placeholder"></div>
              </div>
            </div>
          </div>
          <div class="trigger-info" @click="!track.id && openCharacterSelector(index)">
            <span class="trigger-name">{{ track.name || '请选择干员' }}</span>
          </div>
        </div>

      </div>
    </div>

    <div class="tracks-content-viewport" ref="tracksContentRef" @mousedown="onContentMouseDown" @wheel="handleTrackWheel"
         @mousemove="onGridMouseMove" @mouseleave="onGridMouseLeave" @contextmenu="onBackgroundContextMenu">

      <div class="tracks-content-scroller" :style="transformStyle">
        <div v-if="store.showCursorGuide && !store.isBoxSelectMode" class="cursor-guide"
             :style="{ transform: `translateX(${store.cursorPosTimeline.x}px)` }"
             v-show="isCursorVisible">

          <div class="guide-time-label">
            {{ store.formatTimeLabel(store.cursorCurrentTime) }}
          </div>

          <div class="guide-sp-label">技力: {{ currentSpValue }}</div>
          <div class="guide-stagger-label">失衡: {{ currentStaggerValue }}</div>
        </div>

        <div v-for="boundary in store.cycleBoundaries"
             :key="boundary.id"
             class="cycle-guide"
             :class="{ 'is-selected': boundary.id === store.selectedCycleBoundaryId }"
             :style="{ left: `${boundary.time * TIME_BLOCK_WIDTH}px` }"
             @mousedown="onCycleLineMouseDown($event, boundary.id)">

          <div class="cycle-label-time">{{ store.formatTimeLabel(boundary.time) }}</div>
          <div class="cycle-label-text">循环分界线</div>
          <div class="cycle-hit-area"></div>
        </div>

        <div v-if="alignGuide.visible" class="align-guide-layer">
          <div class="target-highlight-box"
               :style="{
                 left: `${alignGuide.targetRect.left}px`,
                 top: `${alignGuide.targetRect.top}px`,
                 width: `${alignGuide.targetRect.width}px`,
                 height: `${alignGuide.targetRect.height}px`,
                 color: alignGuide.color
               }">
          </div>

          <div class="guide-line-vertical"
               :style="{ left: `${alignGuide.x}px`, color: alignGuide.color }">
          </div>

          <div class="guide-float-label"
               :style="{
                 left: `${alignGuide.x}px`,
                 top: `${alignGuide.top - 28}px`,
                 backgroundColor: alignGuide.color,
                 '--arrow-color': alignGuide.color
               }">

            <span class="guide-icon">
              <svg v-if="alignGuide.iconKey === 'snap-left'" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline><line x1="21" y1="4" x2="21" y2="20"></line></svg>

              <svg v-if="alignGuide.iconKey === 'snap-right'" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><polyline points="12 5 19 12 12 19"></polyline><line x1="3" y1="4" x2="3" y2="20"></line></svg>

              <svg v-if="alignGuide.iconKey === 'align-left'" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="18" x2="3" y2="18"></line><line x1="6" y1="2" x2="6" y2="22"></line></svg>

              <svg v-if="alignGuide.iconKey === 'align-right'" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="18" x2="3" y2="18"></line><line x1="18" y1="2" x2="18" y2="22"></line></svg>
            </span>

            <span class="guide-text">{{ alignGuide.label }}</span>
          </div>
        </div>

        <div v-if="isBoxSelecting" class="selection-box-overlay" :style="{ left: `${boxRect.left}px`, top: `${boxRect.top}px`, width: `${boxRect.width}px`, height: `${boxRect.height}px` }"></div>

        <div class="tracks-content">
          <ContextMenu />
          <svg class="connections-svg">
            <template v-if="tracksContentRef">
              <ActionConnector v-for="conn in store.connections" :key="conn.id" :connection="conn" :render-key="svgRenderKey"/>
              <ConnectionPreview v-if="connectionHandler.isDragging" />
            </template>
          </svg>

          <div v-for="(track, index) in store.tracks" :key="index" class="track-row" :id="`track-row-${index}`" :style="{ '--track-height': `${TRACK_HEIGHT}px` }"
               :class="{ 'is-active-drop': track.id === store.activeTrackId,'is-last-track': index === store.tracks.length - 1 }" @dragover="onTrackDragOver" @drop="onTrackDrop(track, $event)">
            <div class="track-lane" :style="getTrackLaneStyle" ref="trackLaneRefs" :data-track-index="index" :data-track-id="track.id">
              <GaugeOverlay v-if="track.id" :track-id="track.id"/>
              <div class="actions-container">
                <ActionItem v-memo="[action]" v-for="action in track.actions" :key="action.instanceId" :action="action"
                  @mousedown="onActionMouseDown($event, track, action)"
                  @mousemove="updateAlignGuide($event, action, $el.querySelector(`#action-${action.instanceId}`))"
                  @mouseleave="hideAlignGuide"
                  @contextmenu.prevent.stop="onActionContextMenu($event, action)"
                  :class="{ 'is-moving': isDragStarted && store.isActionSelected(action.instanceId) }"
                />
              </div>
              <div class="switch-marker-layer">
                <div v-for="sw in store.switchEvents.filter(s => s.characterId === track.id)"
                     :key="sw.id"
                     class="switch-tag"
                     :class="{ 'is-selected': sw.id === store.selectedSwitchEventId, 'is-dragging': sw.id === draggingSwitchEventId }"
                     :style="{ left: `${sw.time * TIME_BLOCK_WIDTH}px` }"
                     @mousedown.stop="onSwitchMarkerMouseDown($event, sw.id)">

                  <div class="tag-avatar">
                    <img :src="store.characterRoster.find(c => c.id === sw.characterId)?.avatar" />
                  </div>
                  <div class="tag-time">{{ store.formatTimeLabel(sw.time) }}</div>
                </div>
              </div>
              <div class="weapon-status-layer">
                <div
                  v-for="status in weaponStatusesByTrack.get(track.id) || []"
                  :key="status.id"
                  class="weapon-status-item"
                  :class="{ 'is-selected': status.id === store.selectedWeaponStatusId, 'is-dragging': status.id === draggingWeaponStatusId }"
                  :style="{ left: `${getWeaponStatusLeft(status)}px` }"
                >
                  <div class="weapon-status-icon-box" @mousedown.stop="onWeaponStatusMouseDown($event, status)">
                    <img v-if="status.icon" :src="status.icon" @error="e=>e.target.style.display='none'" />
                  </div>
                  <div class="weapon-status-bar" :style="getWeaponStatusBarStyle(status)">
                    <div class="striped-bg"></div>
                    <span class="duration-text">{{ getWeaponStatusDurationLabel(status) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="global-freeze-layer">
            <div v-for="(ext, idx) in activeFreezeRegions"
                 :key="idx"
                 class="freeze-region-dim"
                 :style="{
                 left: `${ext.time * TIME_BLOCK_WIDTH}px`,
                 width: `${ext.amount * TIME_BLOCK_WIDTH}px`}">
              <div class="freeze-duration-label">
                {{ store.formatTimeLabel(ext.amount) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="timeline-horizontal-scrollbar" ref="fakeScrollbarRef" @scroll="onFakeScroll">
        <div class="scrollbar-spacer" :style="{ width: `${totalWidthComputed}px` }"></div>
      </div>
    </div>

    <el-dialog v-model="isSelectorVisible" title="更换干员" width="600px" align-center class="char-selector-dialog" :append-to-body="true">
      <div class="selector-header">
        <div class="header-left-group">
          <el-input v-model="searchQuery" placeholder="搜索干员名称..." :prefix-icon="Search" clearable style="width: 180px" />
          <button class="ea-btn ea-btn--glass-cut ea-btn--glass-cut-danger ea-btn--cut-left ea-btn--lift" @click="removeOperator" title="清空当前轨道">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            卸下
          </button>
        </div>
        <div class="element-filters">
          <button v-for="elm in ELEMENT_FILTERS" :key="elm.value" class="ea-btn ea-btn--glass-cut" :class="{ 'is-active': filterElement === elm.value }" :style="{ '--ea-btn-accent': elm.color }" @click="filterElement = elm.value">
            {{ elm.label }}
          </button>
        </div>
      </div>
      <div class="roster-scroll-container">
        <template v-for="group in rosterByRarity" :key="group.level">
          <div class="rarity-header" :class="`header-rarity-${group.level}`" :style="{ color: getRarityBaseColor(group.level) }">
            <span class="rarity-label">{{ group.level }} ★</span>
            <div class="rarity-line"></div>
          </div>
          <div class="roster-grid">
            <div v-for="char in group.list" :key="char.id" class="roster-card" :class="[{ 'is-selected': store.tracks.some(t => t.id === char.id) }, `rarity-${char.rarity}-style`]" @click="confirmCharacterSelection(char.id)">
              <div class="card-avatar-wrapper" :style="char.rarity === 6 ? {} : { borderColor: getRarityBaseColor(char.rarity) }">
                <img :src="char.avatar" loading="lazy" /><div class="element-badge" :style="{ background: store.getColor(char.element) }"></div>
              </div>
              <div class="card-name">{{ char.name }}</div>
              <div v-if="store.tracks.some(t => t.id === char.id)" class="in-team-tag">已上场</div>
            </div>
          </div>
        </template>
        <div v-if="rosterByRarity.length === 0" class="empty-roster">没有找到匹配的干员</div>
      </div>
    </el-dialog>

    <el-dialog v-model="isWeaponSelectorVisible" title="选择武器" width="600px" align-center class="char-selector-dialog" :append-to-body="true">
      <div class="selector-header">
        <div class="header-left-group">
          <el-input v-model="weaponSearchQuery" placeholder="搜索武器名称..." :prefix-icon="Search" clearable style="width: 180px" />
          <button class="ea-btn ea-btn--glass-cut ea-btn--glass-cut-danger ea-btn--cut-left ea-btn--lift" :disabled="!currentWeaponForDialog" @click="removeWeapon" title="卸下当前武器">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            卸下
          </button>
        </div>
      </div>
      <div class="roster-scroll-container">
        <template v-for="group in weaponRosterByRarity" :key="group.level">
          <div class="rarity-header" :class="`header-rarity-${group.level}`" :style="{ color: getRarityBaseColor(group.level) }">
            <span class="rarity-label">{{ group.level }} ★</span>
          <div class="rarity-line"></div>
        </div>
        <div class="roster-grid">
          <div v-for="weapon in group.list" :key="weapon.id" class="roster-card" :class="[`rarity-${getWeaponRarity(weapon)}-style`]" @click="confirmWeaponSelection(weapon.id)">
            <div class="card-avatar-wrapper" :style="getWeaponRarity(weapon) === 6 ? {} : { borderColor: getRarityBaseColor(getWeaponRarity(weapon)) }">
              <img :src="weapon.icon || '/weapons/default.webp'" loading="lazy" />
            </div>
            <div class="card-name">{{ weapon.name }}</div>
            <div v-if="isWeaponEquipped(weapon.id)" class="in-team-tag weapon-equipped">已装备</div>
          </div>
        </div>
      </template>
      <div v-if="weaponRosterByRarity.length === 0" class="empty-roster">没有找到匹配的武器</div>
    </div>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ==========================================================================
   1. Grid Layout Structure
   ========================================================================== */
.timeline-grid-layout {
  display: grid;
  grid-template-columns: 180px 1fr;
  grid-template-rows: 60px 1fr;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

/* ==========================================================================
   2. Corner Placeholder (Top-Left)
   ========================================================================== */
.corner-placeholder {
  background: #3a3a3a;
  border-bottom: 1px solid #444;
  border-right: 1px solid #444;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 2px 0 8px;
  gap: 4px;
  box-sizing: border-box;
}

.corner-controls {
  display: flex;
  flex-direction: column;
  flex: 1 0 0;
  gap: 4px;
  min-width: 0;
}

.corner-button-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 4px;
}

.mini-tool-btn {
  flex: 1;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2b2b2b;
  border: 1px solid #555;
  border-radius: 3px;
  color: #888;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
}

.mini-tool-btn:hover {
  background: #444;
  color: #ccc;
  border-color: #777;
}

.mini-tool-btn.is-active {
  color: #ffd700;
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
}

.btn-text {
  font-size: 9px;
  font-weight: bold;
  transform: scale(0.9);
}

.corner-zoom-row {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.zoom-info-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0 2px;
  width: 100%;
}

.zoom-label {
  font-size: 8px;
  color: #555;
  letter-spacing: 0.5px;
  font-weight: bold;
}

.zoom-value {
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 9px;
  color: #ffd700;
  font-weight: bold;
  opacity: 0.9;
}

.zoom-slider-container {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 4px;
}

.zoom-icon {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: color 0.2s;
}

.zoom-icon:hover {
  color: #ffd700;
}

.davinci-range {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 2px;
  background: #555;
  outline: none;
  border-radius: 1px;
  min-width: 0;
}

.davinci-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 8px;
  height: 8px;
  background: #ffd700;
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid #333;
  box-shadow: 0 0 2px rgba(0,0,0,0.5);
  transition: transform 0.1s;
}

body.capture-mode .davinci-range {
  opacity: 0;
}

.davinci-range::-webkit-slider-thumb:hover {
  transform: scale(1.3);
  background: #fff;
}

.davinci-range::-moz-range-thumb {
  width: 8px;
  height: 8px;
  background: #ffd700;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.timeline-label-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
}

.timeline-label {
  flex: 0 0 auto;
  height: 20px;
  display: flex;
  align-items: flex-end;
  font-size: 10px;
  color: #888;
  transition: color 0.2s;

  &:hover {
    color: #e0e0e0;
  }

  &.interactable {
    cursor: pointer;
    position: relative;

    &:hover {
      color: #ffd700;
    }
  }

  &.expand-btn {
    justify-content: center;
    align-items: center;
    color: #888;

    &:hover {
      color: #ffd700;
      background: rgba(255, 215, 0, 0.1);
      border-radius: 4px;
    }
  }
}

.collapse-hint-icon {
  position: absolute;
  top: 0;
  right: -4px;
  opacity: 0;
  transition: opacity 0.2s;
  color: #888;
}

.timeline-label.interactable:hover .collapse-hint-icon {
  opacity: 1;
}

/* ==========================================================================
   3. Time Ruler (Top-Right)
   ========================================================================== */
.time-ruler-wrapper {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  background: #2b2b2b;
  border-bottom: 1px solid #444;
  overflow: hidden;
  z-index: 6;
  user-select: none;
}

.ruler-content-container {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.time-ruler-track {
  position: relative;
  flex: 0 0 auto;
  height: 20px;
  width: 100%;

  &.game-time {
    opacity: 0.5;
  }
}

.tick-line {
  position: absolute;
  bottom: 0;
  width: 1px;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-0.5px);
  image-rendering: pixelated;
}

.tick-label {
  position: absolute;
  left: 3px;
  bottom: 1px;
  white-space: nowrap;
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 10px;
  color: #888;
  user-select: none;
  pointer-events: none;
  line-height: 1;
}

.tick-line.major {
  height: 17px;
  background: rgba(255, 255, 255, 0.7);
  z-index: 2;
}

.tick-line.major-dim {
  height: 17px;
  background: rgba(255, 255, 255, 0.15);
  z-index: 1;
}

.tick-line.major-dim .tick-label {
  display: none;
}

.tick-line.major .tick-label {
  color: #e0e0e0;
  font-weight: bold;
  font-size: 11px;
  bottom: 1px;
}

.tick-line.tenth {
  height: 10px;
  background: rgba(255, 255, 255, 0.4);
  z-index: 1;
}

.tick-line.frame {
  height: 5px;
  background: rgba(255, 255, 255, 0.2);
}

.tick-line.frame .tick-label,
.tick-line.tenth .tick-label {
  font-size: 8px;
  color: #666;
  font-style: italic;
}

/* ==========================================================================
   4. Sidebar Tracks Header (Left Column)
   ========================================================================== */
.tracks-header-sticky {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  width: 180px;
  background: #3a3a3a;
  display: flex;
  flex-direction: column;
  z-index: 6;
  border-right: 1px solid #444;
  padding: 20px 0;
  overflow-x: hidden;
  box-sizing: border-box;
}

.track-info {
  flex: 1;
  min-height: 110px;
  display: flex;
  align-items: center;
  background: #3a3a3a;
  padding-left: 4px;
  transition: background 0.2s;
  border: 1px solid transparent;
}

.track-info.is-active {
  background: #4a5a6a;
  border-right: 3px solid #ffd700;
}

.char-select-trigger {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0 6px;
}

.trigger-avatar-box {
  position: relative;
  margin-right: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.avatar-image {
  display: block;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #555;
  transition: border-color 0.2s;
}

.avatar-placeholder {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #444;
  border: 2px dashed #666;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s;
}

.avatar-placeholder:hover {
  border-color: #ffd700;
  background: #555;
}

.avatar-placeholder::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 2px;
  background-color: #888;
  border-radius: 1px;
  transition: background-color 0.2s;
}

.avatar-placeholder::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 16px;
  background-color: #888;
  border-radius: 1px;
  transition: background-color 0.2s;
}

.avatar-placeholder:hover::before,
.avatar-placeholder:hover::after {
  background-color: #ffd700;
}

.avatar-change-hint {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.trigger-avatar-box:hover .avatar-change-hint {
  opacity: 1;
}

.trigger-avatar-box:hover .avatar-image {
  border-color: #ffd700;
}

.trigger-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-grow: 1;
  height: 100%;
  cursor: default;
}

.track-info:not(.is-active) .trigger-info {
  cursor: pointer;
}

.trigger-name {
  color: #f0f0f0;
  font-weight: bold;
  font-size: 14px;
  user-select: none;
}

.trigger-avatar-wrapper { display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; width: 64px; }
.weapon-slot-compact { cursor: pointer; position: absolute; top: 34px; left: -6px; }
.weapon-box { width: 32px; height: 32px; border-radius: 6px; background: #444; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid #555; box-sizing: border-box; transition: border-color 0.2s, background 0.2s; position: relative; }
.weapon-box.weapon-empty { border: 2px dashed #666; }
.weapon-slot-compact:hover .weapon-box { border-color: #ffd700; background: #555; box-shadow: none; }
.weapon-box img { width: 100%; height: 100%; object-fit: cover; }
.weapon-placeholder { width: 100%; height: 100%; position: relative; }
.weapon-placeholder::before,
.weapon-placeholder::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  background: #888;
  border-radius: 1px;
  transition: background 0.2s;
}
.weapon-placeholder::before { width: 16px; height: 2px; transform: translate(-50%, -50%); }
.weapon-placeholder::after { width: 2px; height: 16px; transform: translate(-50%, -50%); }
.weapon-slot-compact:hover .weapon-placeholder::before,
.weapon-slot-compact:hover .weapon-placeholder::after {
  background: #ffd700;
}

/* ==========================================================================
   5. Main Content Scroller
   ========================================================================== */
.tracks-content-viewport {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  background: #18181c;
}

.tracks-content-scroller {
  height: 100%;
}

.timeline-horizontal-scrollbar {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  width: 100%;
  height: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 100;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.timeline-horizontal-scrollbar:hover { opacity: 1; }
.scrollbar-spacer { height: 1px; }

.tracks-content {
  position: relative;
  width: fit-content;
  min-width: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  height: 100%;
  box-sizing: border-box;
}

.cursor-guide {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 215, 0, 0.8);
  pointer-events: none;
  z-index: 5;
  box-shadow: 0 0 6px #ffd700;
}

.guide-time-label {
  width: fit-content;
  color: #ffffff;
  font-size: 10px;
  font-weight: bold;
  font-family: monospace;
  padding: 2px 4px;
  border-radius: 0 4px 4px 0;
  white-space: nowrap;
  line-height: 1;
}

.guide-sp-label {
  width: fit-content;
  color: #ffd700;
  font-size: 10px;
  font-weight: bold;
  font-family: monospace;
  padding: 2px 4px;
  white-space: nowrap;
  line-height: 1;
  text-shadow: 0 0 2px rgba(255, 215, 0, 0.5);
}

.guide-stagger-label {
  width: fit-content;
  color: #ff7875;
  font-size: 10px;
  font-weight: bold;
  font-family: monospace;
  padding: 2px 4px;
  border-radius: 0 4px 4px 0;
  white-space: nowrap;
  line-height: 1;
  text-shadow: 0 0 2px rgba(255, 120, 117, 0.5);
  margin-top: 1px;
}

.selection-box-overlay {
  position: absolute;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
  --g-h: linear-gradient(to right, rgba(255, 255, 255, 0.9) 60%, transparent 60%);
  --g-v: linear-gradient(to bottom, rgba(255, 255, 255, 0.9) 60%, transparent 60%);
  background-image: var(--g-h), var(--g-h), var(--g-v), var(--g-v);
  background-position: top, bottom, left, right;
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-size: 10px 1px, 10px 1px, 1px 10px, 1px 10px;
}

/* ==========================================================================
   6. Track Rows & Actions
   ========================================================================== */
.track-row {
  --track-height: 50px;
  position: relative;
  flex: 1;
  min-height: var(--track-height);
  padding-bottom: 26px;
  width: fit-content;
  min-width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.track-row.is-last-track {
  border-bottom: none;
}

.track-lane {
  position: relative;
  height: var(--track-height);
  display: flex;
  background: rgba(255, 255, 255, 0.02);
  border-top: 2px solid transparent;
  border-bottom: 2px solid transparent;
}

.track-row.is-active-drop .track-lane {
  border-top: 2px dashed #c0c0c0;
  border-bottom: 2px dashed #c0c0c0;
  z-index: 20;
}

.actions-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
}

.connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 25;
  pointer-events: none;
  overflow: visible;
}

/* ==========================================================================
   7. Operation Layer (Key Markers)
   ========================================================================== */
.operation-layer {
  position: absolute;
  top: 4px;
  left: 0;
  width: 100%;
  height: 50px;
  pointer-events: none;
  z-index: 10;
}

.key-cap {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #444;
  border: 1px solid #666;
  border-radius: 2px;
  color: #fff;
  font-weight: bold;
  font-family: Consolas, Monaco, monospace;
  box-shadow: 0 1px 1px rgba(0,0,0,0.5);
  white-space: nowrap;
  opacity: 0.95;
  z-index: 1;
  transition: top 0.2s, height 0.2s;
}

.key-cap.op-skill {
  background: #3a3a3a;
  border-color: #888;
  width: 20px !important;
}

.key-cap.op-link {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
  color: #ffd700;
  width: 20px !important;
  z-index: 2;
}

.key-cap.op-switch {
  background: rgba(211, 173, 255, 0.2);
  border-color: #d3adff;
  color: #d3adff;
  width: 28px !important;
}

.key-cap.is-hold {
  justify-content: center;
  padding: 0 4px;
  background: #3a3a3a;
  border: 1px solid #888;
  border-radius: 2px;
  box-shadow: 0 1px 1px rgba(0,0,0,0.5);
  white-space: nowrap;
}

.key-cap.is-hold .key-text {
  margin: 0;
  padding: 0;
  background: transparent;
  color: #fff;
  font-size: 9px;
}

.track-info.is-reorder-target {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.3);
}

.track-info.is-reorder-source {
  opacity: 0.5;
}

.track-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 24px;
  flex-shrink: 0;
  gap: 2px;
  color: #888;
}

.reorder-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: inherit;
}

.reorder-btn:hover {
  background-color: #444;
  color: #ccc;
}

.reorder-btn.disabled {
  opacity: 0.2;
  pointer-events: none;
}

.drag-handle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

/* ==========================================================================
   8. Character Selector Dialog
   ========================================================================== */
.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.15);
  flex-wrap: wrap;
  gap: 12px;
}

.header-left-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.element-filters {
  display: flex;
  gap: 6px;
}
.roster-scroll-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 8px;
  scrollbar-width: none;
}

.roster-scroll-container::-webkit-scrollbar {
  display: none;
}

/* 分组标题 */
.rarity-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  margin-bottom: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(30, 30, 30, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 10px 0;
}

.rarity-header:first-child {
  margin-top: 0;
}

.rarity-label {
  font-size: 15px;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 1px;
}

.rarity-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, currentColor 0%, transparent 100%);
  opacity: 0.4;
  margin-left: 8px;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.header-rarity-6 .rarity-label {
  background: linear-gradient(45deg, #FFD700, #FF8C00, #FF4500);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent !important;
}

.header-rarity-6 .rarity-line {
  background: linear-gradient(90deg,
  #FF4500 0%,
  #FF8C00 30%,
  #FFD700 60%,
  transparent 100%
  );
  opacity: 0.7;
  height: 2px;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.roster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.roster-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.roster-card:hover {
  transform: translateY(-4px);
}

/* 头像框 */
.card-avatar-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
  background: #111;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2px;
  box-sizing: border-box;
  overflow: hidden;
}

.card-avatar-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.element-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 18px;
  height: 18px;
  clip-path: polygon(100% 0, 0% 100%, 100% 100%);
  z-index: 2;
}

.card-name {
  margin-top: 8px;
  font-size: 11px;
  color: #aaa;
  text-align: center;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  letter-spacing: 0.3px;
}

.roster-card:hover .card-name {
  color: #fff;
}

/* 已上场状态 */
.in-team-tag {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  color: #ffd700;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 10px;
  letter-spacing: 1px;
  border: 1px solid rgba(255, 215, 0, 0.5);
  z-index: 5;
  pointer-events: none;
}

.in-team-tag::before {
  content: 'FIELDED';
  margin-bottom: 2px;
}

.in-team-tag.weapon-equipped::before {
  content: 'EQUIPPED';
}

.empty-roster {
  text-align: center;
  color: #555;
  padding: 30px;
  font-style: italic;
  font-size: 13px;
}

.rarity-6-style .card-avatar-wrapper {
  border: 1px solid transparent;
  background:
      linear-gradient(#111, #111) padding-box,
      linear-gradient(135deg, #FFD700, #FF8C00, #FF4500) border-box;
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.2);
}

.rarity-6-style:hover .card-avatar-wrapper {
  box-shadow: 0 0 15px rgba(255, 165, 0, 0.5);
  border-color: rgba(255, 215, 0, 0.8);
}

/* ==========================================================================
   9. Element Plus Overrides
   ========================================================================== */
:deep(.char-selector-dialog .el-dialog__body) {
  padding-top: 10px;
}
:deep(.char-selector-dialog .el-input__wrapper) {
  background-color: #2b2b2b;
  box-shadow: 0 0 0 1px #444 inset;
}
:deep(.char-selector-dialog .el-input__inner) {
  color: #fff;
}

/* ==========================================================================
   10. Align Guide Styles
   ========================================================================== */
.align-guide-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2000;
  overflow: visible;
}

.target-highlight-box {
  position: absolute;
  border: 1px solid;
  border-radius: 4px;
  pointer-events: none;
  background: currentColor;
  opacity: 0.1;
  box-sizing: border-box;
  transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.target-highlight-box::after {
  content: '';
  position: absolute;
  top: -2px; left: -2px; right: -2px; bottom: -2px;
  border: 1px solid inherit;
  border-radius: 5px;
  opacity: 0.6;
  animation: pulse-border 1.5s infinite;
  box-shadow: 0 0 8px currentColor;
}

/* ==========================================================================
   11. Cycle Guide Styles
   ========================================================================== */
.cycle-guide {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #d3adff;
  box-shadow: 0 0 6px #d3adff;
  pointer-events: auto;
  cursor: col-resize;
  z-index: 4;
  transition: background-color 0.1s, box-shadow 0.1s;
}

.cycle-guide:hover {
  width: 2px;
  background: #e0c4ff;
  box-shadow: 0 0 8px #e0c4ff;
}

.cycle-guide.is-selected {
  background: #fff;
  box-shadow: 0 0 8px #fff, 0 0 12px rgba(255, 255, 255, 0.5);
  z-index: 30;
  width: 2px;
}

.cycle-guide.is-selected .cycle-label-time {
  background: #fff;
  color: #000;
}

.cycle-guide.is-selected .cycle-label-text {
  color: #fff;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
}

.cycle-label-time {
  position: absolute;
  top: 0;
  left: 0;
  width: fit-content;
  background: #d3adff;
  color: #222;
  font-size: 10px;
  font-weight: bold;
  font-family: monospace;
  padding: 2px 4px;
  border-radius: 0 4px 4px 0;
  white-space: nowrap;
  line-height: 1;
  pointer-events: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.cycle-label-text {
  position: absolute;
  top: 16px;
  left: 0;
  width: fit-content;
  color: #d3adff;
  font-size: 10px;
  font-weight: bold;
  font-family: monospace;
  padding: 2px 4px;
  white-space: nowrap;
  line-height: 1;
  text-shadow: 0 0 2px rgba(211, 173, 255, 0.5);
  writing-mode: horizontal-tb;
  letter-spacing: normal;
  pointer-events: none;
}

.cycle-hit-area {
  position: absolute;
  left: -5px;
  top: 0;
  bottom: 0;
  width: 10px;
  background: transparent;
  cursor: col-resize;
  z-index: 20;
}
@keyframes pulse-border {
  0% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.02); }
  100% { opacity: 0.4; transform: scale(1); }
}

/* ==========================================================================
   12. Switch Marker Styles
   ========================================================================== */
.switch-marker-layer {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;
}
.switch-tag {
  position: absolute; top: -12px;
  display: flex; flex-direction: column; align-items: center;
  pointer-events: auto; cursor: col-resize; z-index: 30; transform: translateX(-50%); transition: transform 0.1s;
}
.switch-tag.is-dragging {
  transition: none;
}
.tag-avatar {
  width: 24px; height: 24px; border-radius: 50%; border: 2px solid #d3adff;
  background: #222; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}
.tag-avatar img { width: 100%; height: 100%; object-fit: cover; }
.tag-time {
  font-size: 9px;
  color: #d3adff;
  font-weight: bold;
  background: transparent;
  padding: 0 2px;
  border-radius: 2px;
  margin-top: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
.switch-tag.is-selected .tag-avatar {
  border-color: #fff; box-shadow: 0 0 8px #fff;
}

.weapon-status-layer {
  position: absolute;
  left: 0;
  top: calc(100% + 4px);
  height: 22px;
  width: 100%;
  pointer-events: none;
}

.weapon-status-item {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0;
  pointer-events: none;
}

.weapon-status-icon-box {
  width: 20px;
  height: 20px;
  background-color: #333;
  border: 1px solid #999;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  pointer-events: auto;
  cursor: grab;
}

.weapon-status-icon-box:active {
  cursor: grabbing;
}

.weapon-status-item.is-selected .weapon-status-icon-box {
  border-color: #ffd700;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.45);
}

.weapon-status-icon-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.weapon-status-bar {
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

.weapon-status-bar .striped-bg {
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
  pointer-events: none;
}

.weapon-status-bar .duration-text {
  position: absolute;
  left: 4px;
  font-size: 11px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 2;
  font-weight: bold;
  line-height: 1;
  font-family: sans-serif;
  white-space: nowrap;
}
:global(body.is-dragging) {
  user-select: none !important;
  cursor: col-resize !important;
}
.guide-line-vertical {
  position: absolute;
  top: -100px;
  bottom: -100px;
  width: 1px;
  background: linear-gradient(to bottom,
  transparent,
  currentColor 20%,
  currentColor 80%,
  transparent
  );
  pointer-events: none;
  box-shadow: 0 0 6px currentColor;
  z-index: 2001;
  transition: left 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.guide-float-label {
  --arrow-color: transparent;
  position: absolute;
  padding: 4px 8px;
  border-radius: 20px;
  color: #000;
  font-weight: 800;
  font-size: 10px;
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 2002;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: left 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.15s ease-out;
  display: flex;
  align-items: center;
  gap: 4px;
}

.guide-float-label::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -4px;
  border-width: 4px;
  border-style: solid;
  border-color: var(--arrow-color) transparent transparent transparent;
}

.guide-icon {
  display: flex;
  align-items: center;
}

.guide-text {
  line-height: 1;
}

.global-freeze-layer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 0;
}

.freeze-region-dim {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  border-left: 1px dashed rgba(255, 255, 255, 0.2);
  border-right: 1px dashed rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  animation: fadeIn 0.2s ease-out;
  transition: left 0.1s, width 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;

  &.timeline {
    border: none;
    transition: none;
    background: repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.3),
      rgba(255, 255, 255, 0.3) 3px,
      rgba(255, 255, 255, 0.2) 3px,
      rgba(255, 255, 255, 0.2) 6px
    );
  }
}

.freeze-duration-label {
  color: rgba(255, 255, 255, 0.4);
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 0;
  user-select: none;
  pointer-events: none;
  white-space: nowrap;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 30px) {
  .freeze-duration-label {
    font-size: 10px;
    opacity: 0.1;
  }
}
</style>