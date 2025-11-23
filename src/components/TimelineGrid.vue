<script setup>
import { ref, provide, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import ActionItem from './ActionItem.vue'
import ActionConnector from './ActionConnector.vue'
import GaugeOverlay from './GaugeOverlay.vue'
import { ElMessage } from 'element-plus'

const store = useTimelineStore()

// ===================================================================================
// 1. 初始化 (Init)
// ===================================================================================

const TIME_BLOCK_WIDTH = computed(() => store.timeBlockWidth)
provide('TIME_BLOCK_WIDTH', TIME_BLOCK_WIDTH)

// Refs
const tracksContentRef = ref(null)
const timeRulerWrapperRef = ref(null)
const tracksHeaderRef = ref(null)

// State
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
const dragStartTimes = new Map()

let resizeObserver = null

// Box Select State
const isBoxSelecting = ref(false)
const boxStart = ref({ x: 0, y: 0 })
const boxRect = ref({ left: 0, top: 0, width: 0, height: 0 })

// ===================================================================================
// 2. 核心计算 (Core Calc)
// ===================================================================================

const timeBlocks = computed(() => Array.from({ length: store.TOTAL_DURATION }, (_, i) => i + 1))

const groupedCharacters = computed(() => {
  const groups = {}
  store.characterRoster.forEach(char => {
    const rarity = char.rarity || 0
    if (!groups[rarity]) groups[rarity] = []
    groups[rarity].push(char)
  })
  return Object.keys(groups).sort((a, b) => b - a).map(rarity => ({
    label: rarity > 0 ? `${rarity} ★` : '未知星级',
    options: groups[rarity]
  }))
})

function forceSvgUpdate() { svgRenderKey.value++ }

function updateScrollbarHeight() {
  if (tracksContentRef.value) {
    const el = tracksContentRef.value
    const height = el.offsetHeight - el.clientHeight
    scrollbarHeight.value = height > 0 ? height : 0
  }
}

function calculateTimeFromEvent(evt) {
  const trackRect = tracksContentRef.value.getBoundingClientRect()
  const scrollLeft = tracksContentRef.value.scrollLeft
  const mouseX = evt.clientX
  const activeOffset = store.globalDragOffset || 0
  const mouseXInTrack = (mouseX - activeOffset) - trackRect.left + scrollLeft
  const fractionalBlockIndex = mouseXInTrack / TIME_BLOCK_WIDTH.value
  let startTime = Math.round(fractionalBlockIndex * 2) / 2
  if (startTime < 0) startTime = 0
  return startTime
}

// ===================================================================================
// 3. 滚动同步 (Scroll Sync)
// ===================================================================================

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

// ===================================================================================
// 4. 交互：鼠标移动与框选 (Mouse & Box Selection)
// ===================================================================================

function onGridMouseMove(evt) {
  if (!tracksContentRef.value) return

  const rect = tracksContentRef.value.getBoundingClientRect()
  const scrollLeft = tracksContentRef.value.scrollLeft

  // 1. 更新像素坐标 (用于辅助线)
  const rawX = (evt.clientX - rect.left) + scrollLeft
  cursorX.value = rawX
  isCursorVisible.value = true

  // 2. 更新逻辑时间 (用于智能粘贴)
  const exactTime = rawX / TIME_BLOCK_WIDTH.value
  const snappedTime = Math.round(exactTime * 10) / 10
  store.setCursorTime(snappedTime)
}

function onGridMouseLeave() { isCursorVisible.value = false }

// 框选：开始
function onContentMouseDown(evt) {
  // 1. 框选模式
  if (store.isBoxSelectMode) {
    evt.stopPropagation()
    evt.preventDefault()

    isBoxSelecting.value = true
    const rect = tracksContentRef.value.getBoundingClientRect()
    const scrollLeft = tracksContentRef.value.scrollLeft
    const scrollTop = tracksContentRef.value.scrollTop

    boxStart.value = { x: evt.clientX - rect.left + scrollLeft, y: evt.clientY - rect.top + scrollTop }
    boxRect.value = { left: boxStart.value.x, top: boxStart.value.y, width: 0, height: 0 }

    window.addEventListener('mousemove', onBoxMouseMove)
    window.addEventListener('mouseup', onBoxMouseUp)
    return
  }

  // 2. 普通点击
  onBackgroundClick(evt)
}

// 框选：移动
function onBoxMouseMove(evt) {
  if (!isBoxSelecting.value) return
  const rect = tracksContentRef.value.getBoundingClientRect()
  const scrollLeft = tracksContentRef.value.scrollLeft
  const scrollTop = tracksContentRef.value.scrollTop

  const currentX = evt.clientX - rect.left + scrollLeft
  const currentY = evt.clientY - rect.top + scrollTop

  const left = Math.min(boxStart.value.x, currentX)
  const top = Math.min(boxStart.value.y, currentY)
  const width = Math.abs(currentX - boxStart.value.x)
  const height = Math.abs(currentY - boxStart.value.y)

  boxRect.value = { left, top, width, height }
}

// 框选：结束
function onBoxMouseUp() {
  isBoxSelecting.value = false
  window.removeEventListener('mousemove', onBoxMouseMove)
  window.removeEventListener('mouseup', onBoxMouseUp)

  // 碰撞检测 AABB
  const box = boxRect.value
  const selection = {
    left: box.width > 0 ? box.left : box.left + box.width,
    top: box.height > 0 ? box.top : box.top + box.height,
    right: box.width > 0 ? box.left + box.width : box.left,
    bottom: box.height > 0 ? box.top + box.height : box.top
  }
  // 坐标标准化
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
      if (startPixel < selection.right && endPixel > selection.left) {
        foundIds.push(action.instanceId)
      }
    })
  })

  if (foundIds.length > 0) {
    store.setMultiSelection(foundIds)
    ElMessage.success(`选中了 ${foundIds.length} 个动作`)
  } else {
    store.clearSelection()
  }

  boxRect.value = { left: 0, top: 0, width: 0, height: 0 }
}

// ===================================================================================
// 5. 交互：动作块拖拽 (Action Dragging)
// ===================================================================================

function onActionMouseDown(evt, track, action) {
  evt.stopPropagation()
  if (evt.button !== 0) return

  // 智能多选逻辑
  const isAlreadySelected = store.multiSelectedIds.has(action.instanceId)
  if (!isAlreadySelected) {
    store.selectAction(action.instanceId)
  }

  isMouseDown.value = true
  isDragStarted.value = false
  movingActionId.value = action.instanceId
  movingTrackId.value = track.id
  initialMouseX.value = evt.clientX
  initialMouseY.value = evt.clientY

  // 记录所有选中块的初始时间，防止累积误差
  dragStartTimes.clear()
  store.tracks.forEach(t => {
    t.actions.forEach(a => {
      if (store.multiSelectedIds.has(a.instanceId)) {
        dragStartTimes.set(a.instanceId, a.startTime)
      }
    })
  })

  const rect = evt.currentTarget.getBoundingClientRect()
  store.setDragOffset(evt.clientX - rect.left)

  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
  window.addEventListener('blur', onWindowMouseUp)
}

function onWindowMouseMove(evt) {
  if (!isMouseDown.value) return
  if (evt.buttons === 0) { onWindowMouseUp(evt); return }

  const target = evt.target
  const isFormElement = target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  const isInSidebar = target && (target.closest('.properties-sidebar') || target.closest('.action-library'))
  if (isFormElement || isInSidebar) { onWindowMouseUp(evt); return }

  if (!isDragStarted.value) {
    const dist = Math.sqrt(Math.pow(evt.clientX - initialMouseX.value, 2) + Math.pow(evt.clientY - initialMouseY.value, 2))
    if (dist > dragThreshold) { isDragStarted.value = true } else { return }
  }

  // 计算时间差
  const newLeaderTime = calculateTimeFromEvent(evt)
  const leaderOriginalTime = dragStartTimes.get(movingActionId.value)
  if (leaderOriginalTime === undefined) return

  const timeDelta = newLeaderTime - leaderOriginalTime

  // 验证移动合法性
  let isValidMove = true
  for (const [id, originalTime] of dragStartTimes) {
    if (originalTime + timeDelta < 0) { isValidMove = false; break }
  }

  if (isValidMove) {
    let hasChanged = false
    store.tracks.forEach(t => {
      let trackChanged = false
      t.actions.forEach(a => {
        if (store.multiSelectedIds.has(a.instanceId)) {
          const original = dragStartTimes.get(a.instanceId)
          const targetTime = Math.max(0, original + timeDelta)
          if (a.startTime !== targetTime) {
            a.startTime = targetTime
            trackChanged = true; hasChanged = true
          }
        }
      })
      if (trackChanged) t.actions.sort((a, b) => a.startTime - b.startTime)
    })
    if (hasChanged) nextTick(() => forceSvgUpdate())
  }
}

function onWindowMouseUp(evt) {
  const _wasDragging = isDragStarted.value
  try {
    if (!isDragStarted.value && movingActionId.value) {
      if (store.isLinking) { store.confirmLinking(movingActionId.value) }
      else { if (store.cancelLinking) store.cancelLinking() }
    } else if (_wasDragging) {
      // 拖拽结束，提交历史
      store.commitState()
    }
  } catch (error) { console.error("MouseUp Error:", error) } finally {
    dragStartTimes.clear()
    isMouseDown.value = false; isDragStarted.value = false; movingActionId.value = null; movingTrackId.value = null
    window.removeEventListener('mousemove', onWindowMouseMove)
    window.removeEventListener('mouseup', onWindowMouseUp)
    window.removeEventListener('blur', onWindowMouseUp)
  }
  if (_wasDragging) { window.addEventListener('click', captureClick, { capture: true, once: true }) }
}

function captureClick(e) { e.stopPropagation(); e.preventDefault() }
function onTrackDrop(track, evt) {
  const skill = store.draggingSkillData; if (!skill || store.activeTrackId !== track.id) return
  const startTime = calculateTimeFromEvent(evt)
  store.addSkillToTrack(track.id, skill, startTime)
  nextTick(() => forceSvgUpdate())
}
function onTrackDragOver(evt) { evt.preventDefault(); evt.dataTransfer.dropEffect = 'copy' }
function onActionClick(action) { if (!isDragStarted.value && wasSelectedOnPress.value && store.selectedActionId === action.instanceId) store.selectAction(action.instanceId) }
function onBackgroundClick(event) { if (!event || event.target === tracksContentRef.value || event.target.classList.contains('track-row') || event.target.classList.contains('time-block')) { store.cancelLinking(); store.selectTrack(null) } }

function handleKeyDown(event) {
  const hasSelection = store.selectedActionId || store.multiSelectedIds.size > 0
  if (!hasSelection) return
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    const count = store.removeCurrentSelection()
    if (count > 0) ElMessage.success(`已删除 ${count} 个动作`)
  }
}

// ===================================================================================
// 6. 生命周期 (Lifecycle)
// ===================================================================================

watch(() => store.timeBlockWidth, () => { nextTick(() => { forceSvgUpdate(); updateScrollbarHeight() }) })
watch(() => [store.tracks, store.connections], () => { setTimeout(() => { forceSvgUpdate() }, 50) }, {deep: false})

onMounted(() => {
  if (tracksContentRef.value) {
    tracksContentRef.value.addEventListener('scroll', syncRulerScroll)
    tracksContentRef.value.addEventListener('scroll', syncVerticalScroll)
    resizeObserver = new ResizeObserver(() => { forceSvgUpdate(); updateScrollbarHeight() })
    resizeObserver.observe(tracksContentRef.value)
    updateScrollbarHeight()
  }
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  if (tracksContentRef.value) {
    tracksContentRef.value.removeEventListener('scroll', syncRulerScroll)
    tracksContentRef.value.removeEventListener('scroll', syncVerticalScroll)
    if (resizeObserver) resizeObserver.disconnect()
  }
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
  window.removeEventListener('mousemove', onBoxMouseMove)
  window.removeEventListener('mouseup', onBoxMouseUp)
})
</script>

<template>
  <div class="timeline-grid-layout">
    <div class="corner-placeholder">
      <button class="guide-toggle-btn" :class="{ 'is-active': store.showCursorGuide }" @click="store.toggleCursorGuide" title="辅助线 (Ctrl+G)">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="6" x2="12" y2="18"></line><line x1="6" y1="12" x2="18" y2="12"></line></svg>
      </button>
      <button class="guide-toggle-btn" :class="{ 'is-active': store.isBoxSelectMode }" @click="store.toggleBoxSelectMode" title="框选 (Ctrl+B)" style="margin-left: 4px;">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 4" /><path d="M8 12h8" stroke-width="1.5"/><path d="M12 8v8" stroke-width="1.5"/></svg>
      </button>
    </div>

    <div class="time-ruler-wrapper" ref="timeRulerWrapperRef" @click="store.selectTrack(null)">
      <div class="time-ruler-track">
        <div v-for="block in timeBlocks" :key="block" class="ruler-tick" :style="{ width: `${TIME_BLOCK_WIDTH}px` }" :class="{ 'major-tick': (block % 5 === 0) }">
          <span v-if="block % 5 === 0" class="tick-label">{{ block }}s</span>
        </div>
      </div>
    </div>

    <div class="tracks-header-sticky" ref="tracksHeaderRef" @click="store.selectTrack(null)" :style="{ paddingBottom: `${20 + scrollbarHeight}px` }">
      <div v-for="(track, index) in store.teamTracksInfo" :key="index" class="track-info" @click.stop="store.selectTrack(track.id)" :class="{ 'is-active': track.id && track.id === store.activeTrackId }">
        <img v-if="track.id" :src="track.avatar" class="avatar-image" :alt="track.name"/>
        <div v-else class="avatar-placeholder"></div>
        <el-select :model-value="track.id" @change="(newId) => store.changeTrackOperator(index, track.id, newId)" placeholder="选择干员" class="character-select" @click.stop>
          <el-option-group v-for="group in groupedCharacters" :key="group.label" :label="group.label">
            <el-option v-for="character in group.options" :key="character.id" :label="character.name" :value="character.id"/>
          </el-option-group>
        </el-select>
      </div>
    </div>

    <div class="tracks-content-scroller" ref="tracksContentRef" @mousedown="onContentMouseDown" @mousemove="onGridMouseMove" @mouseleave="onGridMouseLeave">

      <div class="cursor-guide" :style="{ left: `${cursorX}px` }" v-show="isCursorVisible && store.showCursorGuide && !store.isBoxSelectMode"></div>
      <div v-if="isBoxSelecting" class="selection-box-overlay" :style="{ left: `${boxRect.left}px`, top: `${boxRect.top}px`, width: `${boxRect.width}px`, height: `${boxRect.height}px` }"></div>

      <div class="tracks-content">
        <svg class="connections-svg">
          <template v-if="tracksContentRef">
            <ActionConnector v-for="conn in store.connections" :key="conn.id" :connection="conn" :container-ref="tracksContentRef" :render-key="svgRenderKey"/>
          </template>
        </svg>

        <div v-for="(track, index) in store.tracks" :key="index" class="track-row" :id="`track-row-${index}`" :class="{ 'is-active-drop': track.id === store.activeTrackId }" @dragover="onTrackDragOver" @drop="onTrackDrop(track, $event)">
          <div class="track-lane">
            <div v-for="block in timeBlocks" :key="block" class="time-block" :style="{ width: `${TIME_BLOCK_WIDTH}px` }"></div>
            <GaugeOverlay v-if="track.id" :track-id="track.id"/>
            <div class="actions-container">
              <ActionItem v-for="action in track.actions" :key="action.instanceId" :action="action" @mousedown="onActionMouseDown($event, track, action)" @click.stop="onActionClick(action)" :class="{ 'is-moving': isDragStarted && movingActionId === action.instanceId }"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 核心布局 */
.timeline-grid-layout { display: grid; grid-template-columns: 180px 1fr; grid-template-rows: 40px 1fr; width: 100%; height: 100%; overflow: hidden; }

/* 功能区 */
.corner-placeholder { grid-column: 1 / 2; grid-row: 1 / 2; background: #3a3a3a; border-bottom: 1px solid #444; border-right: 1px solid #444; display: flex; align-items: center; justify-content: center; gap: 4px; }
.guide-toggle-btn { background: none; border: 1px solid #555; color: #777; border-radius: 4px; cursor: pointer; padding: 4px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.guide-toggle-btn:hover { border-color: #888; color: #ccc; }
.guide-toggle-btn.is-active { border-color: #ffd700; color: #ffd700; background: rgba(255, 215, 0, 0.1); }

/* 时间尺 */
.time-ruler-wrapper { grid-column: 2 / 3; grid-row: 1 / 2; background: #2b2b2b; border-bottom: 1px solid #444; overflow: hidden; z-index: 6; user-select: none; }
.time-ruler-track { display: flex; flex-direction: row; width: fit-content; height: 100%; align-items: flex-end; }
.ruler-tick { height: 100%; box-sizing: border-box; flex-shrink: 0; position: relative; }
.ruler-tick::after { content: ''; position: absolute; bottom: 0; right: 0; width: 1px; background: #555; height: 6px; transition: all 0.2s; }
.ruler-tick.major-tick::after { height: 14px; background: #aaa; }
.ruler-tick:hover::after { background: #ffd700; height: 100%; opacity: 0.5; }
.tick-label { position: absolute; right: 0; transform: translateX(50%); top: 2px; font-size: 10px; color: #777; font-family: 'Roboto Mono', monospace; pointer-events: none; }
.ruler-tick.major-tick .tick-label { color: #e0e0e0; font-weight: bold; top: 0px; font-size: 11px; }

/* 左侧栏 */
.tracks-header-sticky { grid-column: 1 / 2; grid-row: 2 / 3; width: 180px; background: #3a3a3a; display: flex; flex-direction: column; z-index: 6; border-right: 1px solid #444; padding: 20px 0; overflow-x: hidden; }
.track-info { flex: 1; min-height: 60px; display: flex; align-items: center; background: #3a3a3a; padding-left: 8px; cursor: pointer; transition: background 0.2s; }
.track-info.is-active { background: #4a5a6a; border-right: 3px solid #ffd700; }
.avatar-image { width: 44px; height: 44px; border-radius: 50%; background: #555; margin-right: 8px; object-fit: cover; }
.avatar-placeholder { width: 44px; height: 44px; border-radius: 50%; background: #444; border: 2px dashed #666; margin-right: 8px; }
.character-select { flex-grow: 1; width: 0; }
.character-select :deep(.el-input__wrapper) { background: transparent !important; box-shadow: none !important; padding: 0; }
.character-select :deep(.el-input__inner) { color: #f0f0f0; font-size: 16px; font-weight: bold; }
.character-select :deep(.el-select__caret) { display: none; }
.track-info:hover .character-select :deep(.el-select__caret) { display: inline-block; }

/* 内容区 */
.tracks-content-scroller { grid-column: 2 / 3; grid-row: 2 / 3; width: 100%; height: 100%; overflow: auto; position: relative; background: #18181c; }
.tracks-content { position: relative; width: fit-content; min-width: 100%; display: flex; flex-direction: column; padding: 20px 0; height: 100%; }
.cursor-guide { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(255, 215, 0, 0.8); pointer-events: none; z-index: 5; box-shadow: 0 0 6px #ffd700; }
.selection-box-overlay { position: absolute; z-index: 100; pointer-events: none; background: transparent; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5); background-image: linear-gradient(to right, rgba(255,255,255,0.9) 60%, transparent 60%), linear-gradient(to right, rgba(255,255,255,0.9) 60%, transparent 60%), linear-gradient(to bottom, rgba(255,255,255,0.9) 60%, transparent 60%), linear-gradient(to bottom, rgba(255,255,255,0.9) 60%, transparent 60%); background-position: top, bottom, left, right; background-repeat: repeat-x, repeat-x, repeat-y, repeat-y; background-size: 10px 1px, 10px 1px, 1px 10px, 1px 10px; }

/* 轨道行 */
.track-row { position: relative; flex: 1; min-height: 60px; display: flex; flex-direction: column; justify-content: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
.track-lane { position: relative; height: 50px; width: 100%; display: flex; background: rgba(255, 255, 255, 0.02); border-top: 2px solid transparent; border-bottom: 2px solid transparent; }
.track-row.is-active-drop .track-lane { border-top: 2px dashed #c0c0c0; border-bottom: 2px dashed #c0c0c0; z-index: 20; }
.time-block { height: 100%; border-right: 1px solid rgba(255, 255, 255, 0.05); flex-shrink: 0; }
.actions-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; }
.connections-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 25; pointer-events: none; overflow: visible; }
</style>