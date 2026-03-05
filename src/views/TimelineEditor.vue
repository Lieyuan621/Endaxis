<script setup>
import { onMounted, onUnmounted, ref, nextTick, computed, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { useShareProject } from '@/composables/useShareProject.js'
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus'
import { snapdom } from '@zumer/snapdom';
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'

// 组件引入
import TimelineGrid from '../components/TimelineGrid.vue'
import ActionLibrary from '../components/ActionLibrary.vue'
import PropertiesPanel from '../components/PropertiesPanel.vue'
import ResourceMonitor from '../components/ResourceMonitor.vue'

import { addMetadataToPng, readMetadataFromPng } from '../utils/pngUtils.js'

const store = useTimelineStore()
const { t, locale } = useI18n({ useScope: 'global' })
const { copyShareCode, importFromCode } = useShareProject()

const watermarkEl = ref(null)
const watermarkSubText = ref('Created by Endaxis')

function changeLocale(next) {
  setLocale(next)
}

// === 方案管理逻辑 ===
const editingScenarioId = ref(null)
const renameInputRef = ref(null)

const currentScenario = computed(() => {
  return store.scenarioList.find(s => s.id === store.activeScenarioId) || store.scenarioList[0]
})

const formatIndex = (index) => {
  return (index + 1).toString().padStart(2, '0')
}

function startRenameCurrent() {
  if (!currentScenario.value) return
  editingScenarioId.value = currentScenario.value.id
  nextTick(() => {
    if (renameInputRef.value) {
      renameInputRef.value.focus()
      renameInputRef.value.select()
    }
  })
}

function finishRename() {
  editingScenarioId.value = null
}

function handleDeleteCurrent() {
  if (!currentScenario.value) return
  handleDeleteScenario(currentScenario.value.id)
}

function handleDeleteScenario(id) {
  ElMessageBox.confirm(
      t('timeline.scenario.deleteConfirm'),
      t('timeline.scenario.deleteTitle'),
      { confirmButtonText: t('common.delete'), cancelButtonText: t('common.cancel'), type: 'warning' }
  ).then(() => {
    store.deleteScenario(id)
    ElMessage.success(t('timeline.scenario.deleted'))
  }).catch(() => {})
}

function handleDuplicateCurrent() {
  if (!currentScenario.value) return
  if (store.scenarioList.length >= store.MAX_SCENARIOS) {
    ElMessage.warning(t('timeline.scenario.limit', { max: store.MAX_SCENARIOS }))
    return
  }
  store.duplicateScenario(currentScenario.value.id)
  ElMessage.success(t('timeline.scenario.duplicated'))
}

function handleAddScenario() {
  if (store.scenarioList.length >= store.MAX_SCENARIOS) {
    ElMessage.warning(t('timeline.scenario.limit', { max: store.MAX_SCENARIOS }))
    return
  }
  store.addScenario()
}

// === 滚动遮罩逻辑 ===
const tabsGroupRef = ref(null)
const tabsMaskStyle = ref({})

function updateScrollMask() {
  const el = tabsGroupRef.value
  if (!el) return

  const tolerance = 2
  const isAtStart = el.scrollLeft <= tolerance
  const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - tolerance
  const isNoScroll = el.scrollWidth <= el.clientWidth

  if (isNoScroll) {
    tabsMaskStyle.value = { maskImage: 'none', WebkitMaskImage: 'none' }
    return
  }

  const startStr = isAtStart ? 'black 0%' : 'transparent 0px, black 20px'
  const endStr = isAtEnd ? 'black 100%' : 'black calc(100% - 20px), transparent 100%'

  const gradient = `linear-gradient(to right, ${startStr}, ${endStr})`

  tabsMaskStyle.value = {
    maskImage: gradient,
    WebkitMaskImage: gradient
  }
}

watch(() => store.scenarioList.length, async () => {
  await nextTick()
  updateScrollMask()
})

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('resize', updateScrollMask) // 窗口缩放时重算
  nextTick(() => updateScrollMask())
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('resize', updateScrollMask)
})

// === 文件导入相关 ===
const fileInputRef = ref(null)

function triggerImport() {
  if (fileInputRef.value) fileInputRef.value.click()
}

async function processFile(file) {
  if (!file) return

  try {
    const fileExtension = file.name.split('.').pop().toLowerCase()
    
    if (fileExtension === 'png') {
        const metadata = await readMetadataFromPng(file, 'EndaxisData');
        if (metadata) {
             const success = store.importShareString(metadata);
             if (success) {
                 ElMessage.success(t('timeline.import.pngSuccess'));
                 return true;
             }
        }
        ElMessage.warning(t('timeline.import.pngNoData'));
    } else {
        const success = await store.importProject(file)
        if (success) {
          ElMessage.success(t('timeline.import.projectLoaded'))
          return true
        }
    }
  } catch (e) {
    ElMessage.error(t('timeline.import.failed', { msg: e.message }))
  }
  return false
}

async function onFileSelected(event) {
  const file = event.target.files[0]
  await processFile(file)
  event.target.value = ''
}

// === 拖拽导入逻辑 ===
const isDragging = ref(false)
const isInternalDrag = ref(false)
let dragCounter = 0

function hasFiles(e) {
  if (isInternalDrag.value) return false
  return e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')
}

// 区分内部拖拽和外部拖拽
function onGlobalDragStart(e) {
  isInternalDrag.value = true
}

function onGlobalDragEnd(e) {
  isInternalDrag.value = false
}

function handleWindowDragEnter(e) {
  if (!hasFiles(e)) return
  e.preventDefault()
  dragCounter++
  if (dragCounter === 1) {
    isDragging.value = true
  }
}

function handleWindowDragLeave(e) {
  if (!hasFiles(e)) return
  e.preventDefault()
  dragCounter--
  if (dragCounter === 0) {
    isDragging.value = false
  }
}

function handleWindowDragOver(e) {
  if (!hasFiles(e)) return
  e.preventDefault()
}

async function handleWindowDrop(e) {
  if (!hasFiles(e)) return
  e.preventDefault()
  dragCounter = 0
  isDragging.value = false
  
  const file = e.dataTransfer?.files[0]
  if (file) {
    await processFile(file)
  }
}

// === 导出长图相关 ===
const exportDialogVisible = ref(false)
const exportForm = ref({ filename: '', duration: 60 })

function openExportDialog() {
  const dateStr = new Date().toISOString().slice(0, 10)
  exportForm.value.filename = `Endaxis_Timeline_${dateStr}`
  exportForm.value.duration = 60
  exportDialogVisible.value = true
}

function handleExportJson() {
  let rawFilename = exportForm.value.filename || 'Endaxis_Export'
  rawFilename = rawFilename.trim()
  if (rawFilename.toLowerCase().endsWith('.png')) {
    rawFilename = rawFilename.slice(0, -4)
  }
  if (!rawFilename) {
    rawFilename = 'Endaxis_Export'
  }
  let userFilename = rawFilename
  if (!userFilename.toLowerCase().endsWith('.json')) {
    userFilename += '.json'
  }
  store.exportProject({ filename: userFilename })
}

async function processExport() {
  exportDialogVisible.value = false
  const userDuration = exportForm.value.duration
  let rawFilename = exportForm.value.filename || 'Endaxis_Export'
  let userFilename = rawFilename
  if (!userFilename.toLowerCase().endsWith('.png')) userFilename += '.png'

  const durationSeconds = userDuration
  const pixelsPerSecond = store.timeBlockWidth
  const sidebarWidth = 180
  const rightMargin = 50

  const contentWidth = durationSeconds * pixelsPerSecond
  const totalWidth = sidebarWidth + contentWidth + rightMargin

  const loading = ElLoading.service({
    lock: true,
    text: t('timeline.export.rendering', { seconds: durationSeconds }),
    background: 'rgba(0, 0, 0, 0.9)'
  })

  const originalShift = store.timelineShift


  const timelineMain = document.querySelector('.timeline-main')
  const workspaceEl = document.querySelector('.timeline-workspace')
  const gridLayout = document.querySelector('.timeline-grid-layout')
  const scrollers = document.querySelectorAll('.tracks-content-scroller, .chart-scroll-wrapper, .timeline-grid-container')
  const tracksContent = document.querySelector('.tracks-content')
  const settingsScrollArea = document.querySelector('.settings-scroll-area')
  const mainPaths = document.querySelectorAll('path.main-path');
  const pathHoverZones = document.querySelectorAll('path.hover-zone');

  const styleMap = new Map()
  const backupStyle = (el) => { if (el) styleMap.set(el, el.style.cssText) }
  backupStyle(workspaceEl); backupStyle(timelineMain); backupStyle(gridLayout); backupStyle(tracksContent); backupStyle(settingsScrollArea)
  scrollers.forEach(el => backupStyle(el))
  mainPaths.forEach(el => backupStyle(el))
  pathHoverZones.forEach(el => backupStyle(el))

  try {
    store.setTimelineShift(0)
    store.setIsCapturing(true)
    document.body.classList.add('capture-mode')
    scrollers.forEach(el => el.scrollLeft = 0)

    watermarkSubText.value = rawFilename.replace(/\.png$/i, '')
    if (watermarkEl.value) {
      watermarkEl.value.style.display = 'block'
    }

    await new Promise(resolve => setTimeout(resolve, 100))

    if (timelineMain) { timelineMain.style.width = `${totalWidth}px`; timelineMain.style.overflow = 'visible'; }
    if (workspaceEl) { workspaceEl.style.width = `${totalWidth}px`; workspaceEl.style.overflow = 'visible'; }
    if (gridLayout) {
      gridLayout.style.width = `${totalWidth}px`
      gridLayout.style.display = 'grid'
      gridLayout.style.gridTemplateColumns = `${sidebarWidth}px ${contentWidth + rightMargin}px`
      gridLayout.style.overflow = 'visible'
    }
    scrollers.forEach(el => { el.style.width = '100%'; el.style.overflow = 'visible'; el.style.maxWidth = 'none' })

    if (tracksContent) {
      tracksContent.style.width = `${contentWidth}px`
      tracksContent.style.minWidth = `${contentWidth}px`
      const svgs = tracksContent.querySelectorAll('svg')
      svgs.forEach(svg => {
        svg.style.width = `${contentWidth}px`
        svg.setAttribute('width', contentWidth)
      })
    }

    if (settingsScrollArea) {
      settingsScrollArea.style.overflow = 'visible'
    }

    mainPaths.forEach(path => {
      const computed = window.getComputedStyle(path);
      path.style.strokeDasharray = computed.strokeDasharray;
      path.style.stroke = computed.stroke;
      path.style.strokeWidth = computed.strokeWidth;
    })

    pathHoverZones.forEach(path => {
      path.style.display = 'none'
    })

    await new Promise(resolve => setTimeout(resolve, 400))

    const capture = await snapdom(workspaceEl, {
      scale: 1.5,
      width: totalWidth,
      height: workspaceEl.scrollHeight + 20,
    })

    const captureBlob = await capture.toBlob({type: 'png', dpr: 1});
    
    let pngBlob = captureBlob
    
    try {
      // 仅包含当前截图的方案数据
      const shareString = await store.exportShareString({ includeScenarios: store.activeScenarioId });
      // 写入元数据失败不阻止导出
      pngBlob = await addMetadataToPng(captureBlob, 'EndaxisData', shareString);
    } catch (error) {
      console.error(error)
    }
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pngBlob);
    link.download = userFilename;
    link.click();
    URL.revokeObjectURL(link.href);

    ElMessage.success(t('timeline.export.imageExported', { filename: userFilename }))

  } catch (error) {
    console.error(error)
    ElMessage.error(t('timeline.export.failed', { msg: error.message }))
  } finally {
    document.body.classList.remove('capture-mode')
    store.setIsCapturing(false)
    styleMap.forEach((cssText, el) => el.style.cssText = cssText)
    if (watermarkEl.value) {
      watermarkEl.value.style.display = 'none'
    }
    store.setTimelineShift(originalShift)
    loading.close()
  }
}

// === 重置与快捷键 ===
function handleReset() {
  ElMessageBox.confirm(
      t('timeline.reset.confirm'),
      t('common.warning'),
      {
        confirmButtonText: t('timeline.reset.confirmButton'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
  ).then(() => {
    store.resetProject()
    ElMessage.success(t('timeline.reset.done'))
  }).catch(() => {})
}

// === 接收数据码逻辑 ===
const importShareDialogVisible = ref(false)
const shareCodeInput = ref('')

function openImportShareDialog() {
  shareCodeInput.value = '' // 清空输入框
  importShareDialogVisible.value = true
}

function handleImportShare() {
  const success = importFromCode(shareCodeInput.value)
  if (success) {
    importShareDialogVisible.value = false
    shareCodeInput.value = '' // 成功后清空
  }
}

function handleGlobalKeydown(e) {
  const target = e.target
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return
  if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); store.undo(); ElMessage.info({ message: t('timeline.shortcut.undo'), duration: 800 }); return }
  if ((e.ctrlKey && (e.key === 'y' || e.key === 'Y')) || (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) { e.preventDefault(); store.redo(); ElMessage.info({message: t('timeline.shortcut.redo'), duration: 800}); return }
  if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); store.copySelection(); ElMessage.success({message: t('timeline.shortcut.copied'), duration: 800}); return }
  if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) { e.preventDefault(); store.pasteSelection(); ElMessage.success({message: t('timeline.shortcut.pasted'), duration: 800}); return }
  if (e.ctrlKey && (e.key === 'g' || e.key === 'G')) { e.preventDefault(); store.toggleCursorGuide(); ElMessage.info({ message: store.showCursorGuide ? t('timeline.shortcut.cursorGuideOn') : t('timeline.shortcut.cursorGuideOff'), duration: 1500 }); return }
  if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); store.toggleBoxSelectMode(); ElMessage.info({ message: store.isBoxSelectMode ? t('timeline.shortcut.boxSelectOn') : t('timeline.shortcut.boxSelectOff'), duration: 1500 }); return }
  if (e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); store.toggleSnapStep(); const mode = store.snapStep < 0.05 ? t('timeline.shortcut.snapModeFrame') : t('timeline.shortcut.snapMode01'); ElMessage.info({message: t('timeline.shortcut.snapPrecision', { mode }), duration: 1000}); return }
  if (e.altKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); store.toggleConnectionTool(); ElMessage.info({ message: t('timeline.shortcut.connectionTool', { state: store.enableConnectionTool ? t('common.on') : t('common.off') }),  duration: 1000 }); return }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  
  window.addEventListener('dragstart', onGlobalDragStart, true)
  window.addEventListener('dragend', onGlobalDragEnd, true)

  window.addEventListener('dragenter', handleWindowDragEnter)
  window.addEventListener('dragleave', handleWindowDragLeave)
  window.addEventListener('dragover', handleWindowDragOver)
  window.addEventListener('drop', handleWindowDrop)
})

onUnmounted(() => { 
  window.removeEventListener('keydown', handleGlobalKeydown)
  
  window.removeEventListener('dragstart', onGlobalDragStart, true)
  window.removeEventListener('dragend', onGlobalDragEnd, true)

  window.removeEventListener('dragenter', handleWindowDragEnter)
  window.removeEventListener('dragleave', handleWindowDragLeave)
  window.removeEventListener('dragover', handleWindowDragOver)
  window.removeEventListener('drop', handleWindowDrop)
})
</script>

<template>
  <div v-if="store.isLoading" class="loading-screen">
    <div class="loading-content">
      <div class="spinner"></div>
      <p>{{ t('timeline.loading') }}</p>
    </div>
  </div>

  <div v-if="!store.isLoading" class="app-layout">
    <aside class="action-library"><ActionLibrary/></aside>

    <main class="timeline-main">
      <header class="timeline-header" @click="store.selectTrack(null)">

        <div class="tech-scenario-bar">

          <div class="ts-header-group">

            <button class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--ghost ea-btn--no-shrink" @click="startRenameCurrent" :title="t('timeline.scenario.renameTooltip')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>

            <button class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--ghost ea-btn--no-shrink" @click="handleDuplicateCurrent" :title="t('timeline.scenario.duplicateTooltip')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>

            <button
                v-if="store.scenarioList.length > 1"
                class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--ghost ea-btn--hover-danger ea-btn--no-shrink"
                @click="handleDeleteCurrent"
                :title="t('timeline.scenario.deleteTooltip')"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>

            <div class="ts-title-wrapper">
              <div class="ts-deco-bracket">[</div>
              <input
                  v-if="editingScenarioId === currentScenario?.id"
                  ref="renameInputRef"
                  v-model="currentScenario.name"
                  @blur="finishRename"
                  @keydown.enter="finishRename"
                  class="ts-title-input"
              />
              <span v-else class="ts-title-text" @dblclick="startRenameCurrent">
                {{ currentScenario?.name || t('timeline.scenario.unnamed') }}
              </span>
              <div class="ts-deco-bracket">]</div>
            </div>

          </div>

          <div
              class="ts-tabs-group"
              ref="tabsGroupRef"
              :style="tabsMaskStyle"
              @scroll="updateScrollMask"
          >
            <div
                v-for="(sc, index) in store.scenarioList"
                :key="sc.id"
                class="ts-tab-item"
                :class="{ 'is-active': sc.id === store.activeScenarioId }"
                @click="store.switchScenario(sc.id)"
            >
              {{ formatIndex(index) }}
            </div>

            <button
                v-if="store.scenarioList.length < store.MAX_SCENARIOS"
                class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--icon-plus ea-btn--no-shrink ts-add-btn"
                @click="handleAddScenario"
                :title="t('timeline.scenario.addTooltip')"
            >+</button>
          </div>

        </div>

        <div class="header-controls">
          <input type="file" ref="fileInputRef" style="display: none" accept=".json,.png" @change="onFileSelected" />

          <el-dropdown @command="changeLocale" trigger="click" placement="bottom-end">
            <button class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-info" type="button" :title="t('timeline.header.languageTooltip')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M2 12h20"></path>
                <path d="M12 2a15 15 0 0 1 0 20"></path>
                <path d="M12 2a15 15 0 0 0 0 20"></path>
              </svg>
              {{ t('common.language') }}
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="zh-CN" :disabled="locale === 'zh-CN'">{{ t('locale.zhCN') }}</el-dropdown-item>
                <el-dropdown-item command="en" :disabled="locale === 'en'">{{ t('locale.en') }}</el-dropdown-item>
                <el-dropdown-item command="ru" :disabled="locale === 'ru'">{{ t('locale.ru') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <div class="divider-vertical"></div>

          <button class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-danger-dark" @click="handleReset" :title="t('timeline.header.resetTooltip')">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            {{ t('common.reset') }}
          </button>

          <div class="divider-vertical"></div>

          <button class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-orange" @click="openExportDialog" :title="t('common.export')">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 3h7v7"></path>
              <path d="M10 14L21 3"></path>
              <path d="M21 14v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7"></path>
            </svg>
            {{ t('common.export') }}
          </button>

          <div class="project-btn-group">
            <button class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-blue group-item" @click="triggerImport" :title="t('timeline.header.loadTooltip')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {{ t('common.load') }}
            </button>

            <button class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-blue group-item" @click="openImportShareDialog" :title="t('timeline.header.receiveTooltip')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
              {{ t('common.receive') }}
            </button>
          </div>
        </div>
      </header>

      <div class="timeline-workspace">
        <div class="timeline-grid-container"><TimelineGrid/></div>
        <div class="resource-monitor-panel"><ResourceMonitor/></div>

        <div class="export-watermark" ref="watermarkEl">
          Endaxis
          <span class="watermark-sub">{{ watermarkSubText }}</span>
        </div>
      </div>
    </main>

    <aside class="properties-sidebar"><PropertiesPanel/></aside>

    <el-dialog v-model="exportDialogVisible" :title="t('timeline.export.dialogTitle')" width="460px" align-center class="custom-dialog">
      <div class="export-form">
        <div class="form-item"><label>{{ t('timeline.export.filenameLabel') }}</label><el-input v-model="exportForm.filename" :placeholder="t('timeline.export.filenamePlaceholder')" size="large"/></div>
        <div class="form-item"><label>{{ t('timeline.export.durationLabel') }}</label><el-input-number v-model="exportForm.duration" :min="10" :max="store.TOTAL_DURATION" :step="10" size="large" style="width: 100%;"/><div class="hint">{{ t('timeline.export.durationHintMax', { max: store.TOTAL_DURATION }) }}</div></div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <button type="button" class="ea-btn ea-btn--sm ea-btn--lift ea-btn--outline-muted" @click="exportDialogVisible = false">{{ t('common.cancel') }}</button>
          <button type="button" class="ea-btn ea-btn--sm ea-btn--lift ea-btn--fill-success" @click="handleExportJson">{{ t('timeline.export.exportJson') }}</button>
          <button type="button" class="ea-btn ea-btn--sm ea-btn--lift ea-btn--fill-success" @click="copyShareCode">{{ t('timeline.export.copyCode') }}</button>
          <button type="button" class="ea-btn ea-btn--sm ea-btn--lift ea-btn--fill-gold" @click="processExport">{{ t('timeline.export.exportImage') }}</button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
        v-model="importShareDialogVisible"
        :title="t('timeline.import.dialogTitle')"
        width="500px"
        align-center
        class="custom-dialog"
        :append-to-body="true"
    >
      <div class="share-import-container">
        <p class="dialog-hint">{{ t('timeline.import.dialogHint') }}</p>

        <el-alert
            :title="t('timeline.import.dialogAlert')"
            type="warning"
            show-icon
            :closable="false"
            style="margin-bottom: 10px;"
        />

        <el-input
            v-model="shareCodeInput"
            type="textarea"
            :rows="6"
            :placeholder="t('timeline.import.dialogPlaceholder')"
            resize="none"
        />
      </div>
      <template #footer>
      <span class="dialog-footer">
        <button type="button" class="ea-btn ea-btn--sm ea-btn--lift ea-btn--outline-muted" @click="importShareDialogVisible = false">{{ t('common.cancel') }}</button>
        <button type="button" class="ea-btn ea-btn--sm ea-btn--lift ea-btn--fill-gold" @click="handleImportShare">{{ t('timeline.import.dialogConfirm') }}</button>
      </span>
      </template>
    </el-dialog>

    <div v-show="isDragging" class="drop-overlay">
      <div class="drop-content">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="64" height="64">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <p>{{ t('timeline.import.dropHint') }}</p>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* App Layout */
.app-layout { display: grid; grid-template-columns: 200px 1fr 250px; grid-template-rows: 100vh; height: 100vh; overflow: hidden; background-color: #2c2c2c; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.action-library { background-color: #333; border-right: 1px solid #444; display: flex; flex-direction: column; overflow-y: auto; z-index: 10; }
.timeline-main { display: flex; flex-direction: column; overflow: hidden; background-color: #282828; z-index: 1; border-right: 1px solid #444; }
.properties-sidebar { background-color: #333; overflow: hidden; z-index: 10; }

/* Header */
.timeline-header { height: 50px; flex-shrink: 0; border-bottom: 1px solid #444; background-color: #3a3a3a; display: flex; align-items: center; justify-content: space-between; padding: 0 10px 0 0; cursor: default; user-select: none; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); }

.header-controls { display: flex; align-items: center; gap: 10px; }
.divider-vertical { width: 1px; height: 20px; background-color: #555; margin: 0 5px; }

/* === 方案选择器样式 === */
.tech-scenario-bar { display: flex; align-items: center; height: 36px; background: linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%); padding: 0 10px; flex: 1; min-width: 0; margin-right: 20px; }

.ts-header-group { display: flex; align-items: center; gap: 4px; position: relative; padding-right: 10px; width: 260px; flex-shrink: 0; overflow: hidden; }

.ts-tabs-group { display: flex; align-items: center; gap: 6px; background: transparent; padding: 0; border-radius: 0; flex-grow: 1; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none; }
.ts-tabs-group::-webkit-scrollbar { display: none; }


.ts-title-wrapper { display: flex; align-items: baseline; color: #f0f0f0; font-size: 16px; font-weight: bold; font-family: 'Segoe UI', sans-serif; letter-spacing: 0.5px; margin-left: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ts-deco-bracket { color: #666; font-weight: 300; margin: 0 2px; user-select: none; flex-shrink: 0; }

.ts-title-text { white-space: nowrap; cursor: pointer; border-bottom: 1px dashed transparent; overflow: hidden; text-overflow: ellipsis; }
.ts-title-text:hover { border-bottom-color: #888; }

.ts-title-input { background: transparent; border: none; border-bottom: 1px solid #ffd700; color: #ffd700; font-size: 16px; font-weight: bold; width: 120px; outline: none; padding: 0; }

.ts-tab-item { min-width: 40px; height: 24px; display: flex; align-items: center; justify-content: center; font-family: 'Roboto Mono', monospace; font-size: 12px; font-weight: bold; color: #aaa; background-color: rgba(255, 255, 255, 0.08); border-radius: 4px; cursor: pointer; transition: all 0.2s; user-select: none; flex-shrink: 0; }
.ts-tab-item:hover { background-color: rgba(255, 255, 255, 0.15); color: #fff; }
.ts-tab-item.is-active { background-color: #e0e0e0; color: #222; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }

.ts-add-btn { margin-left: 4px; font-size: 14px; }

/* 按钮组容器 */
.project-btn-group { display: flex; align-items: center; }
.project-btn-group .group-item { position: relative; border-radius: 0; margin-right: -1px; }
.project-btn-group .group-item:first-child { border-top-left-radius: 4px; border-bottom-left-radius: 4px; }
.project-btn-group .group-item:last-child { border-top-right-radius: 4px; border-bottom-right-radius: 4px; margin-right: 0; }
.project-btn-group .group-item:hover { z-index: 2; border-color: currentColor; }

/* Workspace & Panels */
.timeline-workspace { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
.timeline-grid-container { flex-grow: 1; overflow: hidden; min-height: 0; }
.resource-monitor-panel { height: 200px; flex-shrink: 0; border-top: 1px solid #444; z-index: 20; background: #252525; }

/* Loading */
.loading-screen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #18181c; z-index: 9999; display: flex; align-items: center; justify-content: center; color: #888; font-size: 14px; }
.loading-content { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.spinner { width: 30px; height: 30px; border: 3px solid #333; border-top-color: #ffd700; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Export Dialog Styles */
.export-form { display: flex; flex-direction: column; gap: 20px; padding: 10px 0; }
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}
.form-item label { display: block; margin-bottom: 8px; font-weight: bold; color: #ccc; }
.hint { font-size: 12px; color: #888; margin-top: 6px; }

.share-import-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dialog-hint {
  color: #888;
  font-size: 12px;
  margin: 0;
}
:deep(.el-textarea__inner) {
  background-color: #1a1a1a;
  box-shadow: inset 0 0 0 1px #333;
  color: #e0e0e0;
  border: none;
  font-family: monospace;
}
:deep(.el-textarea__inner:focus) {
  box-shadow: inset 0 0 0 1px #ffd700;
}
/* === 水印样式 === */
.export-watermark {
  display: none;
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 9999;
  text-align: right;
  pointer-events: none;
  user-select: none;
  font-family: 'Segoe UI', sans-serif;
  font-size: 24px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.15);
}

.watermark-sub {
  display: block;
  font-size: 12px;
  opacity: 0.7;
}
/* Dark Mode Adapter for Element Plus Dialog */
:deep(.el-dialog) { background-color: #2b2b2b; border: 1px solid #444; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
:deep(.el-dialog__header) { margin-right: 0; border-bottom: 1px solid #3a3a3a; padding: 15px 20px; }
:deep(.el-dialog__title) { color: #f0f0f0; font-size: 16px; font-weight: 600; }
:deep(.el-dialog__body) { color: #ccc; padding: 25px 25px 10px 25px; }
:deep(.el-dialog__footer) { padding: 15px 25px 20px; border-top: 1px solid #3a3a3a; }
:deep(.el-input__wrapper) { background-color: #1f1f1f; box-shadow: 0 0 0 1px #444 inset; padding: 4px 11px; }
  :deep(.el-input__inner) { color: white; height: 36px; line-height: 36px; }
  :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px #666 inset; }
  :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #ffd700 inset; }

.drop-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ffd700;
  gap: 20px;
  font-size: 24px;
  font-weight: bold;
}
</style>