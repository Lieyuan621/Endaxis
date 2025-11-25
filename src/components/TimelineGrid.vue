<script setup>
import { ref, provide, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import ActionItem from './ActionItem.vue'
import ActionConnector from './ActionConnector.vue'
import GaugeOverlay from './GaugeOverlay.vue'
import { ElMessage } from 'element-plus'

const store = useTimelineStore()

// ===================================================================================
// 1. 初始化与常量
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
const dragStartTimes = new Map()

let resizeObserver = null

// Box Select State
const isBoxSelecting = ref(false)
const boxStart = ref({ x: 0, y: 0 })
const boxRect = ref({ left: 0, top: 0, width: 0, height: 0 })

// ===================================================================================
// 2. 核心逻辑：操作轴计算 (Operation Axis with Clustering)
// ===================================================================================

const operationMarkers = computed(() => {
  // 1. 生成原始数据
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
        // 样式占位符
        top: 0, height: 14, fontSize: 9
      })
    })
  })

  // 按位置排序
  rawMarkers.sort((a, b) => a.left - b.left)

  // 2. 聚类与动态布局
  const finalMarkers = []
  let cluster = []
  let clusterMaxRight = -1

  // 处理单个簇的函数
  const processCluster = (group) => {
    if (group.length === 0) return

    // A. 计算内部堆叠层级
    const levels = []
    group.forEach(m => {
      let placed = false
      for (let i = 0; i < levels.length; i++) {
        if (levels[i] + 1 <= m.left) { // 1px 间隙
          m.rowIndex = i
          levels[i] = m.right
          placed = true
          break
        }
      }
      if (!placed) {
        m.rowIndex = levels.length
        levels.push(m.right)
      }
    })

    const depth = levels.length

    // B. 根据层数决定高度 (动态压缩算法)
    let h, step, fs
    if (depth <= 2) {
      // 宽松模式
      h = 14; step = 16; fs = 9;
    } else if (depth === 3) {
      // 紧凑模式
      h = 12; step = 13; fs = 9;
    } else {
      // 极限模式 (4层及以上)
      h = 10; step = 10; fs = 8;
    }

    // C. 应用样式
    group.forEach(m => {
      m.height = h
      m.top = m.rowIndex * step
      m.fontSize = fs
      finalMarkers.push(m)
    })
  }

  // 遍历并分组
  rawMarkers.forEach(m => {
    if (cluster.length === 0) {
      cluster.push(m)
      clusterMaxRight = m.right
    } else {
      if (m.left < clusterMaxRight) {
        cluster.push(m)
        clusterMaxRight = Math.max(clusterMaxRight, m.right)
      } else {
        processCluster(cluster)
        cluster = [m]
        clusterMaxRight = m.right
      }
    }
  })
  processCluster(cluster)

  return finalMarkers
})

// ===================================================================================
// 3. 辅助计算属性
// ===================================================================================

const timeBlocks = computed(() => Array.from({length: store.TOTAL_DURATION}, (_, i) => i + 1))

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

// ===================================================================================
// 4. 事件处理与工具函数
// ===================================================================================

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

// 滚动同步
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
// 5. 鼠标与拖拽逻辑
// ===================================================================================

function onGridMouseMove(evt) {
  if (!tracksContentRef.value) return
  const rect = tracksContentRef.value.getBoundingClientRect()
  const scrollLeft = tracksContentRef.value.scrollLeft

  // 更新像素坐标 (辅助线)
  cursorX.value = (evt.clientX - rect.left) + scrollLeft
  isCursorVisible.value = true

  // 更新逻辑时间
  const exactTime = cursorX.value / TIME_BLOCK_WIDTH.value
  store.setCursorTime(Math.round(exactTime * 10) / 10)
}

function onGridMouseLeave() { isCursorVisible.value = false }

// 框选逻辑
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

// 动作拖拽逻辑
function onActionMouseDown(evt, track, action) {
  evt.stopPropagation()
  if (evt.button !== 0) return

  wasSelectedOnPress.value = store.multiSelectedIds.has(action.instanceId)

  if (!store.multiSelectedIds.has(action.instanceId)) {
    store.selectAction(action.instanceId)
  }

  isMouseDown.value = true
  isDragStarted.value = false
  movingActionId.value = action.instanceId
  movingTrackId.value = track.id
  initialMouseX.value = evt.clientX
  initialMouseY.value = evt.clientY

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
  const isForm = target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  const isSidebar = target && (target.closest('.properties-sidebar') || target.closest('.action-library'))
  if (isForm || isSidebar) { onWindowMouseUp(evt); return }

  if (!isDragStarted.value) {
    const dist = Math.sqrt(Math.pow(evt.clientX - initialMouseX.value, 2) + Math.pow(evt.clientY - initialMouseY.value, 2))
    if (dist > dragThreshold) isDragStarted.value = true; else return
  }

  const newLeaderTime = calculateTimeFromEvent(evt)
  const leaderOriginalTime = dragStartTimes.get(movingActionId.value)
  if (leaderOriginalTime === undefined) return

  const timeDelta = newLeaderTime - leaderOriginalTime
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
      if (store.isLinking) store.confirmLinking(movingActionId.value)
      else if (store.cancelLinking) store.cancelLinking()
    } else if (_wasDragging) {
      store.commitState()
    }
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
  const skill = store.draggingSkillData;
  if (!skill || store.activeTrackId !== track.id) return
  const startTime = calculateTimeFromEvent(evt)
  store.addSkillToTrack(track.id, skill, startTime)
  nextTick(() => forceSvgUpdate())
}

function onTrackDragOver(evt) {
  evt.preventDefault(); evt.dataTransfer.dropEffect = 'copy'
}

function onActionClick(action) {
  if (!isDragStarted.value && wasSelectedOnPress.value && store.selectedActionId === action.instanceId) store.selectAction(action.instanceId)
}

function onBackgroundClick(event) {
  if (!event || event.target === tracksContentRef.value || event.target.classList.contains('track-row') || event.target.classList.contains('time-block')) {
    store.cancelLinking(); store.selectTrack(null)
  }
}

function handleKeyDown(event) {
  const hasSelection = store.selectedActionId || store.multiSelectedIds.size > 0
  if (!hasSelection) return
  if (event.key === 'Delete') {
    event.preventDefault()
    const count = store.removeCurrentSelection()
    if (count > 0) ElMessage.success(`已删除 ${count} 个动作`)
  }
}

// ===================================================================================
// 6. 生命周期
// ===================================================================================

watch(() => store.timeBlockWidth, () => {
  nextTick(() => { forceSvgUpdate(); updateScrollbarHeight() })
})
watch(() => [store.tracks, store.connections], () => {
  setTimeout(() => { forceSvgUpdate() }, 50)
}, {deep: true})

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
    </div>

    <div class="time-ruler-wrapper" ref="timeRulerWrapperRef" @click="store.selectTrack(null)">
      <div class="time-ruler-track">
        <div v-for="block in timeBlocks" :key="block" class="ruler-tick"
             :style="{ width: `${TIME_BLOCK_WIDTH}px` }"
             :class="{ 'major-tick': (block % 5 === 0) }">
          <span v-if="block % 5 === 0" class="tick-label">{{ block }}s</span>
        </div>
      </div>

      <div class="operation-layer">
        <div v-for="op in operationMarkers" :key="op.id"
             class="key-cap"
             :class="[op.customClass, { 'is-hold': op.isHold }]"
             :style="{
               left: `${op.left}px`,
               top: `${op.top}px`,
               width: op.width ? `${op.width}px` : 'auto',
               height: `${op.height}px`,
               fontSize: `${op.fontSize}px`
             }">
          <span class="key-text">{{ op.label }}</span>
        </div>
      </div>
    </div>

    <div class="tracks-header-sticky" ref="tracksHeaderRef" @click="store.selectTrack(null)"
         :style="{ paddingBottom: `${20 + scrollbarHeight}px` }">
      <div v-for="(track, index) in store.teamTracksInfo" :key="index" class="track-info"
           @click.stop="store.selectTrack(track.id)"
           :class="{ 'is-active': track.id && track.id === store.activeTrackId }">
        <img v-if="track.id" :src="track.avatar" class="avatar-image" :alt="track.name"/>
        <div v-else class="avatar-placeholder"></div>
        <el-select :model-value="track.id" @change="(newId) => store.changeTrackOperator(index, track.id, newId)"
                   placeholder="选择干员" class="character-select" @click.stop>
          <el-option-group v-for="group in groupedCharacters" :key="group.label" :label="group.label">
            <el-option v-for="character in group.options" :key="character.id" :label="character.name"
                       :value="character.id"/>
          </el-option-group>
        </el-select>
      </div>
    </div>

    <div class="tracks-content-scroller" ref="tracksContentRef" @mousedown="onContentMouseDown"
         @mousemove="onGridMouseMove" @mouseleave="onGridMouseLeave">

      <div class="cursor-guide" :style="{ left: `${cursorX}px` }"
           v-show="isCursorVisible && store.showCursorGuide && !store.isBoxSelectMode"></div>
      <div v-if="isBoxSelecting" class="selection-box-overlay"
           :style="{ left: `${boxRect.left}px`, top: `${boxRect.top}px`, width: `${boxRect.width}px`, height: `${boxRect.height}px` }"></div>

      <div class="tracks-content">
        <svg class="connections-svg">
          <template v-if="tracksContentRef">
            <ActionConnector v-for="conn in store.connections" :key="conn.id" :connection="conn"
                             :container-ref="tracksContentRef" :render-key="svgRenderKey"/>
          </template>
        </svg>

        <div v-for="(track, index) in store.tracks" :key="index" class="track-row" :id="`track-row-${index}`"
             :class="{ 'is-active-drop': track.id === store.activeTrackId }" @dragover="onTrackDragOver"
             @drop="onTrackDrop(track, $event)">
          <div class="track-lane">
            <div v-for="block in timeBlocks" :key="block" class="time-block"
                 :style="{ width: `${TIME_BLOCK_WIDTH}px` }"></div>
            <GaugeOverlay v-if="track.id" :track-id="track.id"/>
            <div class="actions-container">
              <ActionItem v-for="action in track.actions" :key="action.instanceId" :action="action"
                          @mousedown="onActionMouseDown($event, track, action)" @click.stop="onActionClick(action)"
                          :class="{ 'is-moving': isDragStarted && movingActionId === action.instanceId }"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-grid-layout {
  display: grid;
  grid-template-columns: 180px 1fr;
  grid-template-rows: 50px 1fr;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* ============================
   Header Components (Row 1)
   ============================ */

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
  background: none;
  border: 1px solid #555;
  color: #777;
  border-radius: 4px;
  cursor: pointer;
  padding: 4px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* 刻度尺区域 */
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

/* ============================
   Sidebar & Content (Row 2)
   ============================ */

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
  cursor: pointer;
  transition: background 0.2s;
}

.track-info.is-active {
  background: #4a5a6a;
  border-right: 3px solid #ffd700;
}

.avatar-image {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #555;
  margin-right: 8px;
  object-fit: cover;
}

.avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #444;
  border: 2px dashed #666;
  margin-right: 8px;
}

.character-select {
  flex-grow: 1;
  width: 0;
}

/* El-select 样式覆盖 */
.character-select :deep(.el-input__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0;
}

.character-select :deep(.el-input__inner) {
  color: #f0f0f0;
  font-size: 16px;
  font-weight: bold;
}

.character-select :deep(.el-select__caret) {
  display: none;
}

.track-info:hover .character-select :deep(.el-select__caret) {
  display: inline-block;
}

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

.selection-box-overlay {
  position: absolute;
  z-index: 100;
  pointer-events: none;
  background: transparent;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.9) 60%, transparent 60%),
  linear-gradient(to right, rgba(255, 255, 255, 0.9) 60%, transparent 60%),
  linear-gradient(to bottom, rgba(255, 255, 255, 0.9) 60%, transparent 60%),
  linear-gradient(to bottom, rgba(255, 255, 255, 0.9) 60%, transparent 60%);
  background-position: top, bottom, left, right;
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-size: 10px 1px, 10px 1px, 1px 10px, 1px 10px;
}

/* ============================
   Track Rows & Action Items
   ============================ */

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

/* ============================
   Operation Layer
   ============================ */

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
  background: #444;
  border: 1px solid #666;
  border-radius: 2px;
  color: #fff;
  font-weight: bold;
  font-family: Consolas, Monaco, monospace;
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: #3a3a3a;
  border: 1px solid #888;
  border-radius: 2px;
  justify-content: center;
  padding: 0 4px;
  box-shadow: 0 1px 1px rgba(0,0,0,0.5);
  white-space: nowrap;
}

.key-cap.is-hold .key-text {
  background: transparent;
  color: #fff;
  padding: 0;
  margin: 0;
  font-size: 9px;
}
</style>