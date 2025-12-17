<script setup>
import { ref, provide, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import ActionItem from './ActionItem.vue'
import ActionConnector from './ActionConnector.vue'
import ConnectionPreview from './ConnectionPreview.vue'
import GaugeOverlay from './GaugeOverlay.vue'
import ContextMenu from './ContextMenu.vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useDragConnection } from '@/composables/useDragConnection.js'

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

// Render State
const svgRenderKey = ref(0)
const scrollbarHeight = ref(0)
const cursorX = ref(0)
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
const dragStartTimes = new Map()
const hadAnomalySelection = ref(false)
const isAltDown = ref(false)
const isShiftDown = ref(false)
const hoveredContext = ref(null)
const draggingCycleBoundaryId = ref(null)

// === 边缘自动滚动相关状态 ===
const autoScrollSpeed = ref(0)
let autoScrollRaf = null
let lastMouseX = 0
const SCROLL_ZONE = 50
const MAX_SCROLL_SPEED = 15

let resizeObserver = null

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

// ===================================================================================
// 核心逻辑：操作轴计算
// ===================================================================================

const operationMarkers = computed(() => {
  let rawMarkers = []
  store.tracks.forEach((track, index) => {
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
      } else {
        return
      }

      rawMarkers.push({
        id: `op-${action.instanceId}`,
        left: action.startTime * TIME_BLOCK_WIDTH.value,
        width: isHold ? null : 24,
        right: (action.startTime * TIME_BLOCK_WIDTH.value) + (isHold ? (action.duration * TIME_BLOCK_WIDTH.value) : 24),
        label, isHold, customClass,
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

const timeBlocks = computed(() => Array.from({length: store.TOTAL_DURATION}, (_, i) => i + 1))

function forceSvgUpdate() { svgRenderKey.value++ }

function updateScrollbarHeight() {
  if (tracksContentRef.value) {
    const el = tracksContentRef.value
    const height = el.offsetHeight - el.clientHeight
    scrollbarHeight.value = height > 0 ? height : 0
  }
}

function calculateTimeFromEvent(evt, fixedStep = null) {
  const trackRect = tracksContentRef.value.getBoundingClientRect()
  const scrollLeft = tracksContentRef.value.scrollLeft
  const mouseX = evt.clientX
  const activeOffset = store.globalDragOffset || 0
  const mouseXInTrack = (mouseX - activeOffset) - trackRect.left + scrollLeft

  const rawTime = mouseXInTrack / TIME_BLOCK_WIDTH.value

  const step = fixedStep !== null ? fixedStep : store.snapStep

  const inverse = 1 / step
  let startTime = Math.round(rawTime * inverse) / inverse
  if (startTime < 0) startTime = 0

  return startTime
}

function syncRulerScroll() {
  if (timeRulerWrapperRef.value && tracksContentRef.value) {
    const left = tracksContentRef.value.scrollLeft
    timeRulerWrapperRef.value.scrollLeft = left
    store.setScrollLeft(left)
  }
  forceSvgUpdate()
}

function syncVerticalScroll() {
  if (tracksHeaderRef.value && tracksContentRef.value) {
    tracksHeaderRef.value.scrollTop = tracksContentRef.value.scrollTop
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
  const time = cursorX.value / TIME_BLOCK_WIDTH.value
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
  const time = cursorX.value / TIME_BLOCK_WIDTH.value
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
  if (!tracksContentRef.value) return
  store.setCursorPosition(evt.clientX, evt.clientY)
  const rect = tracksContentRef.value.getBoundingClientRect()
  const scrollLeft = tracksContentRef.value.scrollLeft
  cursorX.value = Math.round((evt.clientX - rect.left) + scrollLeft)
  isCursorVisible.value = true
  const exactTime = cursorX.value / TIME_BLOCK_WIDTH.value
  store.setCursorTime(Math.round(exactTime * 10) / 10)
}
function onGridMouseLeave() { isCursorVisible.value = false }

function onContentMouseDown(evt) {
  if (store.isBoxSelectMode) {
    evt.stopPropagation(); evt.preventDefault()
    isBoxSelecting.value = true
    const rect = tracksContentRef.value.getBoundingClientRect()
    boxStart.value = {
      x: evt.clientX - rect.left + tracksContentRef.value.scrollLeft,
      y: evt.clientY - rect.top + tracksContentRef.value.scrollTop
    }
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

  store.setDragOffset(0)
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
  const rect = tracksContentRef.value.getBoundingClientRect()
  const currentX = evt.clientX - rect.left + tracksContentRef.value.scrollLeft
  const currentY = evt.clientY - rect.top + tracksContentRef.value.scrollTop
  const left = Math.min(boxStart.value.x, currentX)
  const top = Math.min(boxStart.value.y, currentY)
  boxRect.value = {
    left, top,
    width: Math.abs(currentX - boxStart.value.x),
    height: Math.abs(currentY - boxStart.value.y)
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
    const containerRect = tracksContentRef.value.getBoundingClientRect()
    const trackRelativeTop = (trackRect.top - containerRect.top) + tracksContentRef.value.scrollTop
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

function updateAlignGuide(evt, action, element) {
  hoveredContext.value = { action, element, clientX: evt.clientX }

  if (!isAltDown.value || !store.selectedActionId || store.selectedActionId === action.instanceId) {
    alignGuide.value.visible = false
    return
  }

  const rect = element.getBoundingClientRect()
  const containerRect = tracksContentRef.value.getBoundingClientRect()
  const relLeft = rect.left - containerRect.left + tracksContentRef.value.scrollLeft
  const relTop = rect.top - containerRect.top + tracksContentRef.value.scrollTop

  const clickX = evt.clientX - rect.left
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
    color = '#00e5ff' // 蓝
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
    color = '#ff00ff' // 紫
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
    const { action, element, clientX } = hoveredContext.value
    updateAlignGuide({ clientX }, action, element)
  }
}

function onBackgroundContextMenu(evt) {
  evt.preventDefault()

  if (isBoxSelecting.value || isDragStarted.value) return

  const trackRect = tracksContentRef.value.getBoundingClientRect()
  const scrollLeft = tracksContentRef.value.scrollLeft

  const mouseX = evt.clientX
  const mouseXInTrack = mouseX - trackRect.left + scrollLeft
  const rawTime = mouseXInTrack / TIME_BLOCK_WIDTH.value

  let clickTime = Math.round(rawTime * 10) / 10
  if (clickTime < 0) clickTime = 0

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

  if (isAltDown.value) {
    if (store.selectedActionId && store.selectedActionId !== action.instanceId) {
      const rect = evt.currentTarget.getBoundingClientRect()
      const clickX = evt.clientX - rect.left
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

  const clientX = evt.clientX
  const clientY = evt.clientY
  const rect = evt.currentTarget.getBoundingClientRect()
  const offset = clientX - rect.left

  setTimeout(() => {
    wasSelectedOnPress.value = store.multiSelectedIds.has(action.instanceId)
    hadAnomalySelection.value = (store.selectedAnomalyId !== null)

    if (!store.multiSelectedIds.has(action.instanceId)) {
      store.selectAction(action.instanceId)
    }

    isMouseDown.value = true;
    isDragStarted.value = false
    movingActionId.value = action.instanceId;
    movingTrackId.value = track.id
    initialMouseX.value = clientX;
    initialMouseY.value = clientY

    dragStartTimes.clear()
    store.tracks.forEach(t => {
      t.actions.forEach(a => {
        if (store.multiSelectedIds.has(a.instanceId)) dragStartTimes.set(a.instanceId, a.startTime)
      })
    })

    store.setDragOffset(offset)

    window.addEventListener('mousemove', onWindowMouseMove)
    window.addEventListener('mouseup', onWindowMouseUp)
    window.addEventListener('blur', onWindowMouseUp)
  }, 0)
}

function updateDragPosition(clientX) {
  if (!isDragStarted.value || !movingActionId.value) return

  const fakeEvent = { clientX: clientX }
  const newLeaderTime = calculateTimeFromEvent(fakeEvent)
  const leaderOriginalTime = dragStartTimes.get(movingActionId.value)
  if (leaderOriginalTime === undefined) return

  const timeDelta = newLeaderTime - leaderOriginalTime

  let isValidMove = true
  for (const originalTime of dragStartTimes.values()) {
    if (originalTime + timeDelta < 0) { isValidMove = false; break }
  }

  if (isValidMove) {
    let hasChanged = false
    store.tracks.forEach(t => {
      let trackChanged = false
      t.actions.forEach(a => {
        if (store.multiSelectedIds.has(a.instanceId)) {
          if (a.isLocked) return
          const original = dragStartTimes.get(a.instanceId)
          const targetTime = Math.max(0, original + timeDelta)
          if (a.startTime !== targetTime) { a.startTime = targetTime; trackChanged = true; hasChanged = true }
        }
      })
      if (trackChanged) t.actions.sort((a, b) => a.startTime - b.startTime)
    })
    if (hasChanged) nextTick(() => forceSvgUpdate())
  }
}

function performAutoScroll() {
  if (autoScrollSpeed.value === 0 || !tracksContentRef.value) {
    cancelAnimationFrame(autoScrollRaf)
    autoScrollRaf = null
    return
  }
  tracksContentRef.value.scrollLeft += autoScrollSpeed.value
  syncRulerScroll()
  updateDragPosition(lastMouseX)
  autoScrollRaf = requestAnimationFrame(performAutoScroll)
}

function onWindowMouseMove(evt) {
  if (draggingCycleBoundaryId.value) {
    if (!isDragStarted.value) {
      const dist = Math.sqrt(Math.pow(evt.clientX - initialMouseX.value, 2) + Math.pow(evt.clientY - initialMouseY.value, 2))
      if (dist > dragThreshold) {
        isDragStarted.value = true
      } else {
        return
      }
    }
    let newTime = calculateTimeFromEvent(evt, 0.1)
    if (newTime > store.TOTAL_DURATION) newTime = store.TOTAL_DURATION
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
    const rect = tracksContentRef.value.getBoundingClientRect()
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

  const hasSelection = store.selectedActionId || store.multiSelectedIds.size > 0 || store.selectedConnectionId || store.selectedCycleBoundaryId
  if (!hasSelection) return

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault();
    const result = store.removeCurrentSelection();
    if (result && result.total > 0) {
      ElMessage.success({ message: '已删除', duration: 800 })
    }
  }
  if (store.selectedActionId || store.multiSelectedIds.size > 0) {
    if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') { event.preventDefault(); store.nudgeSelection(-0.1) }
    if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') { event.preventDefault(); store.nudgeSelection(0.1) }
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

watch(() => store.timeBlockWidth, () => { nextTick(() => { forceSvgUpdate(); updateScrollbarHeight() }) })
watch(() => [store.tracks, store.connections], () => { nextTick(() => { forceSvgUpdate() }) }, { deep: true })

onMounted(() => {
  if (tracksContentRef.value) {
    tracksContentRef.value.addEventListener('scroll', syncRulerScroll)
    tracksContentRef.value.addEventListener('scroll', syncVerticalScroll)
    resizeObserver = new ResizeObserver(() => { forceSvgUpdate(); updateScrollbarHeight() })
    resizeObserver.observe(tracksContentRef.value)
    updateScrollbarHeight()
  }
  window.addEventListener('keydown', handleGlobalKeyDownWrapper)
  window.addEventListener('keyup', handleGlobalKeyUp)
  window.addEventListener('blur', resetModifierKeys)
  window.addEventListener('mouseup', onGlobalWindowMouseUp)
})
onUnmounted(() => {
  if (tracksContentRef.value) {
    tracksContentRef.value.removeEventListener('scroll', syncRulerScroll); tracksContentRef.value.removeEventListener('scroll', syncVerticalScroll); if (resizeObserver) resizeObserver.disconnect()
  }
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
  <div class="timeline-grid-layout">
    <div class="corner-placeholder">
      <button class="guide-toggle-btn" :class="{ 'is-active': store.showCursorGuide }" @click="store.toggleCursorGuide" title="辅助线 (Ctrl+G)">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="6" x2="12" y2="18"></line>
          <line x1="6" y1="12" x2="18" y2="12"></line>
        </svg>
      </button>
      <button class="guide-toggle-btn" :class="{ 'is-active': store.isBoxSelectMode }"
              @click="store.toggleBoxSelectMode" title="框选 (Ctrl+B)" style="margin-left: 4px;">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 4"/>
          <path d="M8 12h8" stroke-width="1.5"/>
          <path d="M12 8v8" stroke-width="1.5"/>
        </svg>
      </button>
      <button class="guide-toggle-btn"
              :class="{ 'is-active': store.snapStep === 0.1 }"
              @click="store.toggleSnapStep"
              title="切换吸附精度 (Alt+S)"
              style="margin-left: 4px; font-size: 10px; font-weight: bold; width: 28px; padding: 0;">
        {{ store.snapStep }}s
      </button>
    </div>

    <div class="time-ruler-wrapper" ref="timeRulerWrapperRef" @click="store.selectTrack(null)">
      <div class="time-ruler-track">
        <div v-for="block in timeBlocks" :key="block" class="ruler-tick"
             :style="{ width: `${TIME_BLOCK_WIDTH}px` }"
             :class="{ 'major-tick': (block - 1) % 5 === 0 }">
          <span v-if="(block - 1) % 5 === 0" class="tick-label">{{ block - 1 }}s</span>
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
          <div class="trigger-info" @click="!track.id && openCharacterSelector(index)">
            <span class="trigger-name">{{ track.name || '请选择干员' }}</span>
          </div>
        </div>

      </div>
    </div>

    <div class="tracks-content-scroller" ref="tracksContentRef" @mousedown="onContentMouseDown"
         @mousemove="onGridMouseMove" @mouseleave="onGridMouseLeave" @contextmenu="onBackgroundContextMenu">

      <div class="cursor-guide" :style="{ left: `${cursorX}px` }" v-show="isCursorVisible && store.showCursorGuide && !store.isBoxSelectMode">
        <div class="guide-time-label">{{ (cursorX / TIME_BLOCK_WIDTH).toFixed(1) }}s</div>
        <div class="guide-sp-label">技力: {{ currentSpValue }}</div>
        <div class="guide-stagger-label">失衡: {{ currentStaggerValue }}</div>
      </div>

      <div v-for="boundary in store.cycleBoundaries"
           :key="boundary.id"
           class="cycle-guide"
           :class="{ 'is-selected': boundary.id === store.selectedCycleBoundaryId }"
           :style="{ left: `${boundary.time * TIME_BLOCK_WIDTH}px` }"
           @mousedown="onCycleLineMouseDown($event, boundary.id)">

        <div class="cycle-label-time">{{ boundary.time }}s</div>
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
            <ActionConnector v-for="conn in store.connections" :key="conn.id" :connection="conn" :container-ref="tracksContentRef" :render-key="svgRenderKey"/>
            <ConnectionPreview v-if="connectionHandler.isDragging" :container-ref="tracksContentRef" />
          </template>
        </svg>

        <div v-for="(track, index) in store.tracks" :key="index" class="track-row" :id="`track-row-${index}`"
             :class="{ 'is-active-drop': track.id === store.activeTrackId }" @dragover="onTrackDragOver" @drop="onTrackDrop(track, $event)">
          <div class="track-lane">
            <div v-for="block in timeBlocks" :key="block" class="time-block" :style="{ width: `${TIME_BLOCK_WIDTH}px` }"></div>
            <GaugeOverlay v-if="track.id" :track-id="track.id"/>
            <div class="actions-container">
              <ActionItem v-for="action in track.actions" :key="action.instanceId" :action="action"
                @mousedown="onActionMouseDown($event, track, action)"
                @mousemove="updateAlignGuide($event, action, $el.querySelector(`#action-${action.instanceId}`))"
                @mouseleave="hideAlignGuide"
                @contextmenu.prevent.stop="onActionContextMenu($event, action)"
                :class="{ 'is-moving': isDragStarted && store.isActionSelected(action.instanceId) }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="isSelectorVisible" title="更换干员" width="600px" align-center class="char-selector-dialog" :append-to-body="true">
      <div class="selector-header">
        <div class="header-left-group">
          <el-input v-model="searchQuery" placeholder="搜索干员名称..." :prefix-icon="Search" clearable style="width: 180px" />
          <button class="remove-btn" @click="removeOperator" title="清空当前轨道">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            卸下
          </button>
        </div>
        <div class="element-filters">
          <button v-for="elm in ELEMENT_FILTERS" :key="elm.value" class="filter-btn" :class="{ active: filterElement === elm.value }" :style="{ '--btn-color': elm.color }" @click="filterElement = elm.value">
            {{ elm.label }}
          </button>
        </div>
      </div>
      <div class="roster-scroll-container">
        <template v-for="group in rosterByRarity" :key="group.level">
          <div class="rarity-header" :class="`header-rarity-${group.level}`">
            <span class="rarity-label" :style="{ color: getRarityBaseColor(group.level) }">{{ group.level }} ★</span>
            <div class="rarity-line" :style="{ backgroundColor: getRarityBaseColor(group.level) }"></div>
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
  </div>
</template>

<style scoped>
/* ==========================================================================
   1. Grid Layout Structure
   ========================================================================== */
.timeline-grid-layout {
  display: grid;
  grid-template-columns: 180px 1fr;
  grid-template-rows: 50px 1fr;
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
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  background: #3a3a3a;
  border-bottom: 1px solid #444;
  border-right: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;
}

.guide-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 4px;
  background: none;
  border: 1px solid #555;
  border-radius: 4px;
  color: #777;
  cursor: pointer;
  transition: all 0.2s;
}

.guide-toggle-btn:hover {
  border-color: #888;
  color: #ccc;
}

.guide-toggle-btn.is-active {
  border-color: #ffd700;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
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
  position: relative;
}

.time-ruler-track {
  display: flex;
  flex-direction: row;
  width: fit-content;
  height: 100%;
  align-items: flex-end;
}

.ruler-tick {
  height: 12px;
  box-sizing: border-box;
  flex-shrink: 0;
  position: relative;
  border-left: 1px solid #444;
}

.ruler-tick.major-tick {
  border-left: 1px solid #888;
  height: 18px;
}

.tick-label {
  position: absolute;
  left: 4px;
  bottom: 2px;
  font-size: 10px;
  color: #777;
  font-family: 'Roboto Mono', monospace;
  pointer-events: none;
}

.ruler-tick.major-tick .tick-label {
  color: #e0e0e0;
  font-weight: bold;
  font-size: 11px;
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
  min-height: 60px;
  display: flex;
  align-items: center;
  background: #3a3a3a;
  padding-left: 8px;
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
  padding: 0 10px;
}

.trigger-avatar-box {
  position: relative;
  margin-right: 10px;
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

/* ==========================================================================
   5. Main Content Scroller
   ========================================================================== */
.tracks-content-scroller {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
  background: #18181c;
}

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
  background: transparent;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
  background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.9) 60%, transparent 60%),
      linear-gradient(to right, rgba(255, 255, 255, 0.9) 60%, transparent 60%),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.9) 60%, transparent 60%),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.9) 60%, transparent 60%);
  background-position: top, bottom, left, right;
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-size: 10px 1px, 10px 1px, 1px 10px, 1px 10px;
}

/* ==========================================================================
   6. Track Rows & Actions
   ========================================================================== */
.track-row {
  position: relative;
  flex: 1;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.track-row:last-child {
  border-bottom: none;
}

.track-lane {
  position: relative;
  height: 50px;
  width: 100%;
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

.time-block {
  height: 100%;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
  box-sizing: border-box;
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
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.header-left-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.remove-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: 32px;
  background: rgba(255, 77, 79, 0.1);
  border: 1px solid rgba(255, 77, 79, 0.3);
  color: #ff7875;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: rgba(255, 77, 79, 0.2);
  border-color: #ff7875;
  transform: translateY(-1px);
}

.remove-btn:active {
  transform: translateY(0);
}

.element-filters {
  display: flex;
  gap: 5px;
}

.filter-btn {
  --btn-color: #888;
  padding: 4px 12px;
  background: #333;
  border: 1px solid #555;
  color: #aaa;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: var(--btn-color);
  color: var(--btn-color);
}

.filter-btn.active {
  background: var(--btn-color);
  border-color: var(--btn-color);
  color: #000;
  font-weight: bold;
}

.roster-scroll-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 5px;
}

.rarity-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  margin-bottom: 10px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  padding: 5px 0;
}

.rarity-header:first-child {
  margin-top: 0;
}

.rarity-label {
  font-size: 16px;
  font-weight: 900;
  font-style: italic;
}

.rarity-line {
  flex: 1;
  height: 1px;
  opacity: 0.3;
}

.header-rarity-6 .rarity-label {
  background: linear-gradient(45deg, #FFD700, #FF8C00, #FF4500);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent !important;
}

.header-rarity-6 .rarity-line {
  background: linear-gradient(90deg, #FFD700, transparent) !important;
  opacity: 0.8;
}

.roster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.roster-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.roster-card:hover {
  transform: translateY(-3px);
}

.card-avatar-wrapper {
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #555;
  background: #222;
  transition: border-color 0.2s;
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
  width: 16px;
  height: 16px;
  clip-path: polygon(100% 0, 0% 100%, 100% 100%);
}

.card-name {
  margin-top: 6px;
  font-size: 12px;
  color: #444;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.in-team-tag {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  color: #ffd700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
  border-radius: 8px;
  pointer-events: none;
}

.empty-roster {
  text-align: center;
  color: #666;
  padding: 20px;
}

.rarity-6-style .card-avatar-wrapper {
  border-width: 2px;
  border-style: solid;
  border-color: transparent;
  background: linear-gradient(#222, #222) padding-box, linear-gradient(135deg, #FFD700, #FF8C00, #FF4500) border-box;
  box-shadow: 0 0 8px rgba(255, 165, 0, 0.4);
}

.rarity-6-style:hover .card-avatar-wrapper {
  box-shadow: 0 0 12px rgba(255, 165, 0, 0.7);
}

/* ==========================================================================
   9. Element Plus Overrides
   ========================================================================== */
:deep(.char-selector-dialog) {
  background: #f5f5f5;
}
:deep(.char-selector-dialog .el-dialog__title) {
  color: #f0f0f0;
}
:deep(.char-selector-dialog .el-dialog__body) {
  padding-top: 10px;
}
:deep(.char-selector-dialog .el-input__wrapper) {
  background-color: #333;
  box-shadow: 0 0 0 1px #555 inset;
}
:deep(.char-selector-dialog .el-input__inner) {
  color: white;
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

</style>