<script setup>
import { useTimelineStore } from '../stores/timelineStore.js'
import draggable from 'vuedraggable'
import { ref, provide, onMounted, onUnmounted, nextTick, computed } from 'vue'
import ActionItem from './ActionItem.vue'
import ActionConnector from './ActionConnector.vue'

const store = useTimelineStore()

const TIME_BLOCK_WIDTH = 50
provide('TIME_BLOCK_WIDTH', TIME_BLOCK_WIDTH)

const timeBlocks = ref(Array.from({ length: 60 }, (_, i) => i + 1))

const svgRenderKey = ref(0)
function forceSvgUpdate() {
  svgRenderKey.value++
}

const tracksContentRef = ref(null)
const timeRulerWrapperRef = ref(null)
const tracksHeaderRef = ref(null)
const dragOffsetX = ref(0)

// 【新增】将干员列表按星级分组
const groupedCharacters = computed(() => {
  const groups = {}
  // 遍历所有干员，按 rarity 分组
  store.characterRoster.forEach(char => {
    const rarity = char.rarity || 0
    if (!groups[rarity]) {
      groups[rarity] = []
    }
    groups[rarity].push(char)
  })

  // 将对象转换为数组，并按星级降序排列
  return Object.keys(groups)
      .sort((a, b) => b - a) // Key 是字符串，但减法会自动转数字
      .map(rarity => ({
        label: rarity > 0 ? `${rarity} ★` : '未知星级',
        options: groups[rarity]
      }))
})

function syncRulerScroll() {
  if (timeRulerWrapperRef.value && tracksContentRef.value) {
    timeRulerWrapperRef.value.scrollLeft = tracksContentRef.value.scrollLeft
  }
}

function syncVerticalScroll() {
  if (tracksHeaderRef.value && tracksContentRef.value) {
    tracksHeaderRef.value.scrollTop = tracksContentRef.value.scrollTop
  }
}

function getStartTimeFromEvent(evt, customOffset = null) {
  const trackRect = tracksContentRef.value.getBoundingClientRect()
  const scrollLeft = tracksContentRef.value.scrollLeft
  const mouseX = evt.originalEvent.clientX
  const activeOffset = customOffset !== null ? customOffset : dragOffsetX.value
  const adjustedMouseX = mouseX - activeOffset
  const mouseXInTrack = adjustedMouseX - trackRect.left + scrollLeft
  const fractionalBlockIndex = mouseXInTrack / TIME_BLOCK_WIDTH
  return Math.round(fractionalBlockIndex * 2) / 2
}

function onActionDragStart(evt) {
  if (evt.from !== evt.to) {
    dragOffsetX.value = 0
    return
  }
  const movedItemEl = evt.item
  const blockRect = movedItemEl.getBoundingClientRect()
  const cursorX = evt.originalEvent.clientX
  dragOffsetX.value = cursorX - blockRect.left
}

function onActionAdd(track, evt) {
  const accurateOffset = store.globalDragOffset
  const startTime = getStartTimeFromEvent(evt, accurateOffset)
  const addedItem = track.actions[evt.newIndex]
  if (addedItem) {
    addedItem.startTime = startTime
  }
  nextTick(() => {
    syncRulerScroll()
    dragOffsetX.value = 0
  })
}

function onActionDragEnd(track, evt) {
  if (evt.from !== evt.to) return
  const movedItem = track.actions[evt.newIndex]
  if (movedItem) {
    movedItem.startTime = getStartTimeFromEvent(evt)
  }
  syncRulerScroll()
  nextTick(() => {
    forceSvgUpdate()
  })
}

function onBackgroundClick(event) {
  if (event.target === tracksContentRef.value) {
    store.cancelLinking()
    store.selectTrack(null)
  }
}

function handleKeyDown(event) {
  if (!store.selectedActionId) return
  if (event.key === 'Delete') {
    store.removeAction(store.selectedActionId)
    event.preventDefault()
  }
}

onMounted(() => {
  if (tracksContentRef.value) {
    tracksContentRef.value.addEventListener('scroll', syncRulerScroll)
    tracksContentRef.value.addEventListener('scroll', syncVerticalScroll)
  }
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  if (tracksContentRef.value) {
    tracksContentRef.value.removeEventListener('scroll', syncRulerScroll)
    tracksContentRef.value.removeEventListener('scroll', syncVerticalScroll)
  }
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="timeline-grid-layout">
    <div class="corner-placeholder"></div>

    <div
        class="time-ruler-wrapper"
        ref="timeRulerWrapperRef"
        @click="store.selectTrack(null)"
    >
      <div class="time-ruler-track">
        <div v-for="block in timeBlocks" :key="block" class="ruler-tick" :style="{ minWidth: `${TIME_BLOCK_WIDTH}px` }"
             :class="{ 'major-tick': (block === 1 || block % 5 === 0) }">
          <span v-if="block === 1 || block % 5 === 0" class="tick-label">{{ block }}s</span>
        </div>
      </div>
    </div>

    <div
        class="tracks-header-sticky"
        ref="tracksHeaderRef"
        @click="store.selectTrack(null)"
    >
      <div v-for="(track, index) in store.teamTracksInfo" :key="index"
           class="track-info"
           @click.stop="store.selectTrack(track.id)"
           :class="{ 'is-active': track.id && track.id === store.activeTrackId }">
        <img v-if="track.id" :src="track.avatar" class="avatar-image" :alt="track.name"/>
        <div v-else class="avatar-placeholder"></div>
        <el-select :model-value="track.id" @change="(newId) => store.changeTrackOperator(index, track.id, newId)"
                   placeholder="选择干员" class="character-select" @click.stop>
          <el-option-group
              v-for="group in groupedCharacters"
              :key="group.label"
              :label="group.label"
          >
            <el-option
                v-for="character in group.options"
                :key="character.id"
                :label="character.name"
                :value="character.id"
            />
          </el-option-group>
        </el-select>
      </div>
    </div>

    <div class="tracks-content-scroller" ref="tracksContentRef" @click="onBackgroundClick">
      <div class="tracks-content">

        <svg class="connections-svg">
          <template v-if="tracksContentRef">
            <ActionConnector
                v-for="conn in store.connections"
                :key="conn.id"
                :connection="conn"
                :container-ref="tracksContentRef"
                :render-key="svgRenderKey"
            />
          </template>
        </svg>

        <div v-for="track in store.tracks" :key="track.id" class="track-row"
             :class="{ 'is-active-drop': track.id === store.activeTrackId }">
          <div v-for="block in timeBlocks" :key="block" class="time-block"></div>

          <draggable
              class="actions-container"
              v-model="track.actions"
              :group="{ name: 'skills', pull: true, put: track.id === store.activeTrackId }"
              :sort="false"
              item-key="instanceId"
              @add="onActionAdd(track, $event)"
              @end="onActionDragEnd(track, $event)"
              @start="onActionDragStart"
              handle=".action-item-wrapper"
              ghost-class="skill-ghost"
              drag-class="timeline-dragging-item"
          >
            <template #item="{ element }">
              <ActionItem :action="element"/>
            </template>
          </draggable>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-grid-layout {
  display: grid;
  grid-template-columns: 180px 1fr;
  grid-template-rows: 40px 1fr;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.corner-placeholder {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  background-color: #3a3a3a;
  border-bottom: 1px solid #444;
  border-right: 1px solid #444;
}

.time-ruler-wrapper {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  background-color: #3a3a3a;
  border-bottom: 1px solid #444;
  overflow: hidden;
  z-index: 6;
}

.time-ruler-track {
  display: flex;
  flex-direction: row;
  width: fit-content;
  height: 100%;
}

.ruler-tick {
  height: 100%;
  border-right: 1px solid #4a4a4a;
  box-sizing: border-box;
  flex-shrink: 0;
  position: relative;
  color: #aaa;
}

.ruler-tick::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 1px;
  height: 5px;
  background-color: #666;
}

.ruler-tick.major-tick::after {
  height: 10px;
  background-color: #aaa;
}

.tick-label {
  position: absolute;
  left: 4px;
  top: 4px;
  font-size: 12px;
  color: #f0f0f0;
  font-weight: bold;
}

.tracks-header-sticky {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  width: 180px;
  background-color: #3a3a3a;
  display: flex;
  flex-direction: column;
  z-index: 6;
  border-right: 1px solid #444;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 20px 0;
  height: 100%;
  justify-content: space-evenly;
  overflow-x: scroll;
}

.tracks-content-scroller {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
}

.tracks-content {
  position: relative;
  width: fit-content;
  min-width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 20px 0;
  justify-content: space-evenly;
  min-height: 100%;
}

.track-info {
  height: 50px;
  display: flex;
  align-items: center;
  background-color: #3a3a3a;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.2s;
  box-sizing: border-box;
  padding-left: 8px;
}

.track-info.is-active {
  background-color: #4a5a6a;
  border-right: 3px solid #ffd700;
}

.avatar-image {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #555;
  margin-right: 8px;
  flex-shrink: 0;
  object-fit: cover;
}

.character-select {
  flex-grow: 1;
  width: 0;
}

.character-select :deep(.el-input__wrapper) {
  background-color: transparent !important;
  box-shadow: none !important;
  padding: 0;
}

.character-select :deep(.el-input__inner) {
  color: #f0f0f0;
  font-size: 16px;
  font-weight: bold;
}

.character-select :deep(.el-input) {
  --el-input-border-color: transparent;
  --el-input-hover-border-color: transparent;
  --el-input-focus-border-color: transparent;
}

.character-select :deep(.el-select__caret) {
  display: none;
}

.track-info:hover .character-select :deep(.el-select__caret) {
  display: inline-block;
}

.track-row {
  position: relative;
  height: 50px;
  display: flex;
  flex-direction: row;
  background-color: #333;
  transition: background-color 0.2s, filter 0.3s, opacity 0.3s;
  overflow: visible;
}

.track-row.is-active-drop {
  border-top: 2px dashed #c0c0c0;
  border-bottom: 2px dashed #c0c0c0;
  z-index: 5;
}

.time-block {
  width: 50px;
  height: 100%;
  border-right: 1px solid #4a4a4a;
  box-sizing: border-box;
  flex-shrink: 0;
}

.actions-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: auto;
}

.connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 15;
  pointer-events: none;
  overflow: visible;
}
.avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #444; /* 深灰色背景 */
  border: 2px dashed #666; /* 虚线边框表示待添加 */
  margin-right: 8px;
  flex-shrink: 0;
  box-sizing: border-box;
}
</style>