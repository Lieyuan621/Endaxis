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
import EnemySettingsPanel from '../components/EnemySettingsPanel.vue'
import ContingencyContractPanel from '../components/ContingencyContractPanel.vue'
import PropertiesPanel from '../components/PropertiesPanel.vue'
import ResourceMonitor from '../components/ResourceMonitor.vue'
import SimLogPanel from '../components/SimLogPanel.vue'
import DamageAnalysisDialog from '../components/DamageAnalysisDialog.vue'

import { addMetadataToPng, readMetadataFromPng } from '../utils/pngUtils.js'

const store = useTimelineStore()
const { t, locale } = useI18n({ useScope: 'global' })
const { copyShareCode, importFromCode } = useShareProject()

const TIMELINE_LAYOUT_KEY = 'endaxis:timeline-workbench-layout:v1'
const ACTIVITY_BAR_WIDTH = 48
const PANEL_MAX_WIDTH = 480
const LEFT_PANEL_MIN_WIDTH = 200
const RIGHT_PANEL_MIN_WIDTH = 260
const BOTTOM_PANEL_MIN_HEIGHT = 220
const TIMELINE_MAIN_MIN_WIDTH = 540
const TIMELINE_MAIN_MIN_HEIGHT = 600
const DEFAULT_LEFT_PANEL_WIDTH = 200
const DEFAULT_RIGHT_PANEL_WIDTH = 260
const DEFAULT_BOTTOM_PANEL_HEIGHT = 220
const BOTTOM_RESIZER_HEIGHT = 1
const RIGHT_TOOLS_VISIBLE = false
const watermarkEl = ref(null)
const watermarkSubText = ref('Created by Endaxis')
const appLayoutRef = ref(null)
const timelineWorkspaceRef = ref(null)
const timelineWorkspaceHeight = ref(0)
const leftPanelWidth = ref(DEFAULT_LEFT_PANEL_WIDTH)
const rightPanelWidth = ref(DEFAULT_RIGHT_PANEL_WIDTH)
const bottomPanelHeight = ref(DEFAULT_BOTTOM_PANEL_HEIGHT)
const isLeftPanelCollapsed = ref(false)
const isRightPanelCollapsed = ref(false)
const isBottomPanelCollapsed = ref(false)
const activeWorkbenchDrag = ref(null)
const rightPanelTool = ref('inspector') // 'inspector' | 'battleLog'
const leftBottomTool = ref('enemy') // 'enemy' | 'contract'
const analysisDialogVisible = ref(false)
const resourceMonitorExpandAllToken = ref(0)
const resourceMonitorCollapsedCount = ref(0)

let workbenchDragState = null
let timelineWorkspaceResizeObserver = null

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function updateTimelineWorkspaceMetrics() {
  timelineWorkspaceHeight.value = timelineWorkspaceRef.value?.clientHeight || 0
}

function getMaxBottomPanelHeight(workspaceHeight = timelineWorkspaceHeight.value) {
  const availableHeight = Math.max(0, Number(workspaceHeight) || 0)
  if (availableHeight <= 0) return bottomPanelHeight.value
  return Math.max(0, availableHeight - TIMELINE_MAIN_MIN_HEIGHT - BOTTOM_RESIZER_HEIGHT)
}

const bottomPanelMinHeight = computed(() => {
  if (leftBottomTool.value === 'contract') return BOTTOM_PANEL_MIN_HEIGHT
  const collapsedCount = Math.min(Math.max(Number(resourceMonitorCollapsedCount.value) || 0, 0), 2)
  if (collapsedCount === 1) return Math.round(BOTTOM_PANEL_MIN_HEIGHT * 0.75)
  if (collapsedCount >= 2) return Math.round(BOTTOM_PANEL_MIN_HEIGHT * 0.5)
  return BOTTOM_PANEL_MIN_HEIGHT
})

function getSafeLocalStorage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function persistWorkbenchLayout() {
  const storage = getSafeLocalStorage()
  if (!storage) return

  storage.setItem(TIMELINE_LAYOUT_KEY, JSON.stringify({
    leftPanelWidth: Math.round(leftPanelWidth.value),
    rightPanelWidth: Math.round(rightPanelWidth.value),
    bottomPanelHeight: Math.round(bottomPanelHeight.value),
    isLeftPanelCollapsed: isLeftPanelCollapsed.value,
    isRightPanelCollapsed: isRightPanelCollapsed.value,
    isBottomPanelCollapsed: isBottomPanelCollapsed.value,
    rightPanelTool: rightPanelTool.value,
    leftBottomTool: leftBottomTool.value,
  }))
}

function restoreWorkbenchLayout() {
  const storage = getSafeLocalStorage()
  if (!storage) return

  try {
    const raw = storage.getItem(TIMELINE_LAYOUT_KEY)
    if (!raw) return

    const parsed = JSON.parse(raw)
    if (Number.isFinite(parsed.leftPanelWidth)) {
      leftPanelWidth.value = clamp(parsed.leftPanelWidth, LEFT_PANEL_MIN_WIDTH, PANEL_MAX_WIDTH)
    }
    if (Number.isFinite(parsed.rightPanelWidth)) {
      rightPanelWidth.value = clamp(parsed.rightPanelWidth, RIGHT_PANEL_MIN_WIDTH, PANEL_MAX_WIDTH)
    }
    if (Number.isFinite(parsed.bottomPanelHeight)) {
      bottomPanelHeight.value = Math.max(0, parsed.bottomPanelHeight)
    }
    isLeftPanelCollapsed.value = parsed.isLeftPanelCollapsed === true
    isRightPanelCollapsed.value = parsed.isRightPanelCollapsed === true
    isBottomPanelCollapsed.value = parsed.isBottomPanelCollapsed === true
    rightPanelTool.value = (parsed.rightPanelTool === 'battleLog') ? 'battleLog' : 'inspector'
    leftBottomTool.value = parsed.leftBottomTool === 'contract' ? 'contract' : 'enemy'
  } catch (error) {
    console.error(error)
  }
}

function resetWorkbenchLayout(target = 'all') {
  if (target === 'all' || target === 'left') {
    leftPanelWidth.value = DEFAULT_LEFT_PANEL_WIDTH
    isLeftPanelCollapsed.value = false
  }
  if (target === 'all' || target === 'right') {
    rightPanelWidth.value = DEFAULT_RIGHT_PANEL_WIDTH
    isRightPanelCollapsed.value = false
    rightPanelTool.value = 'inspector'
  }
  if (target === 'all' || target === 'bottom') {
    bottomPanelHeight.value = DEFAULT_BOTTOM_PANEL_HEIGHT
    isBottomPanelCollapsed.value = false
    leftBottomTool.value = 'enemy'
  }
  persistWorkbenchLayout()
}

function toggleWorkbenchPanel(target) {
  if (target === 'left') {
    isLeftPanelCollapsed.value = !isLeftPanelCollapsed.value
  } else if (target === 'right') {
    isRightPanelCollapsed.value = !isRightPanelCollapsed.value
  } else if (target === 'bottom') {
    if (isBottomPanelCollapsed.value) {
      resourceMonitorExpandAllToken.value += 1
      isBottomPanelCollapsed.value = false
    } else {
      isBottomPanelCollapsed.value = true
    }
  }
  persistWorkbenchLayout()
}

function toggleRightTool(tool) {
  const nextTool = tool === 'battleLog' ? 'battleLog' : 'inspector'

  if (isRightPanelCollapsed.value) {
    rightPanelTool.value = nextTool
    isRightPanelCollapsed.value = false
    persistWorkbenchLayout()
    return
  }

  if (rightPanelTool.value === nextTool) {
    isRightPanelCollapsed.value = true
    persistWorkbenchLayout()
    return
  }

  rightPanelTool.value = nextTool
  persistWorkbenchLayout()
}

function beginWorkbenchResize(type, event) {
  event.preventDefault()
  activeWorkbenchDrag.value = type
  workbenchDragState = {
    startX: event.clientX,
    startY: event.clientY,
    leftPanelWidth: leftPanelWidth.value,
    rightPanelWidth: rightPanelWidth.value,
    bottomPanelHeight: bottomPanelHeight.value,
  }
  document.body.style.userSelect = 'none'
  document.body.style.cursor = type === 'bottom' ? 'ns-resize' : 'ew-resize'
  window.addEventListener('pointermove', onWorkbenchResizeMove)
  window.addEventListener('pointerup', endWorkbenchResize)
}

function applyWorkbenchResize(event) {
  if (!activeWorkbenchDrag.value || !workbenchDragState) return

  if (activeWorkbenchDrag.value === 'left' || activeWorkbenchDrag.value === 'right') {
    const rect = appLayoutRef.value?.getBoundingClientRect()
    if (!rect) return

    const availableWidth = rect.width - TIMELINE_MAIN_MIN_WIDTH

    if (activeWorkbenchDrag.value === 'left') {
      const maxPanelWidth = clamp(Math.floor(availableWidth / 2), LEFT_PANEL_MIN_WIDTH, PANEL_MAX_WIDTH)
      const nextWidth = workbenchDragState.leftPanelWidth + (event.clientX - workbenchDragState.startX)
      leftPanelWidth.value = clamp(nextWidth, LEFT_PANEL_MIN_WIDTH, maxPanelWidth)
      return
    }

    const maxPanelWidth = clamp(Math.floor(availableWidth / 2), RIGHT_PANEL_MIN_WIDTH, PANEL_MAX_WIDTH)
    const nextWidth = workbenchDragState.rightPanelWidth - (event.clientX - workbenchDragState.startX)
    rightPanelWidth.value = clamp(nextWidth, RIGHT_PANEL_MIN_WIDTH, maxPanelWidth)
    return
  }

  const rect = timelineWorkspaceRef.value?.getBoundingClientRect()
  if (!rect) return

  const maxBottomHeight = getMaxBottomPanelHeight(rect.height)
  const minBottomHeight = Math.min(bottomPanelMinHeight.value, maxBottomHeight)
  const nextHeight = workbenchDragState.bottomPanelHeight - (event.clientY - workbenchDragState.startY)
  bottomPanelHeight.value = clamp(nextHeight, minBottomHeight, maxBottomHeight)
}

function onWorkbenchResizeMove(event) {
  applyWorkbenchResize(event)
}

function endWorkbenchResize() {
  workbenchDragState = null
  activeWorkbenchDrag.value = null
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  window.removeEventListener('pointermove', onWorkbenchResizeMove)
  window.removeEventListener('pointerup', endWorkbenchResize)
  persistWorkbenchLayout()
}

const appLayoutStyle = computed(() => ({
  gridTemplateColumns: `${ACTIVITY_BAR_WIDTH}px ${isLeftPanelCollapsed.value ? 0 : leftPanelWidth.value}px ${isLeftPanelCollapsed.value ? 0 : 1}px minmax(${TIMELINE_MAIN_MIN_WIDTH}px, 1fr) ${(!RIGHT_TOOLS_VISIBLE || isRightPanelCollapsed.value) ? 0 : 1}px ${(!RIGHT_TOOLS_VISIBLE || isRightPanelCollapsed.value) ? 0 : rightPanelWidth.value}px ${RIGHT_TOOLS_VISIBLE ? ACTIVITY_BAR_WIDTH : 0}px`,
}))

const effectiveBottomPanelHeight = computed(() => {
  if (isBottomPanelCollapsed.value) return 0
  const maxBottomHeight = getMaxBottomPanelHeight()
  const minBottomHeight = Math.min(bottomPanelMinHeight.value, maxBottomHeight)
  return Math.round(clamp(bottomPanelHeight.value, minBottomHeight, maxBottomHeight))
})

function handleResourceMonitorSectionCollapseChange(count) {
  resourceMonitorCollapsedCount.value = Math.min(Math.max(Number(count) || 0, 0), 2)
}

const timelineWorkspaceStyle = computed(() => ({
  gridTemplateRows: `minmax(${TIMELINE_MAIN_MIN_HEIGHT}px, 1fr) ${isBottomPanelCollapsed.value ? 0 : BOTTOM_RESIZER_HEIGHT}px ${effectiveBottomPanelHeight.value}px`,
}))

const leftPanelStackStyle = computed(() => ({
  gridTemplateRows: isBottomPanelCollapsed.value
    ? 'minmax(0, 1fr)'
    : `minmax(0, 1fr) ${BOTTOM_RESIZER_HEIGHT}px ${effectiveBottomPanelHeight.value}px`,
}))

function toggleBottomTool(tool = 'enemy') {
  const nextTool = tool === 'contract' ? 'contract' : 'enemy'

  if (isBottomPanelCollapsed.value) {
    leftBottomTool.value = nextTool
    resourceMonitorExpandAllToken.value += 1
    isBottomPanelCollapsed.value = false
    persistWorkbenchLayout()
    return
  }

  if (leftBottomTool.value === nextTool) {
    isBottomPanelCollapsed.value = true
    persistWorkbenchLayout()
    return
  }

  leftBottomTool.value = nextTool
  persistWorkbenchLayout()
}

function toggleActivityPanel(target) {
  if (target === 'library') {
    isLeftPanelCollapsed.value = !isLeftPanelCollapsed.value
  } else if (target === 'bottom') {
    toggleBottomTool('enemy')
    return
  }
  persistWorkbenchLayout()
}

function closeBottomPanelFromResourceMonitor() {
  isBottomPanelCollapsed.value = true
  persistWorkbenchLayout()
}

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
  restoreWorkbenchLayout()
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('resize', updateScrollMask) // 窗口缩放时重算
  nextTick(() => updateScrollMask())
})

onUnmounted(() => {
  endWorkbenchResize()
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
const hideEffectsHovered = ref(false)

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
  nextTick(() => {
    updateTimelineWorkspaceMetrics()
    if (typeof ResizeObserver !== 'undefined' && timelineWorkspaceRef.value) {
      timelineWorkspaceResizeObserver = new ResizeObserver(() => {
        updateTimelineWorkspaceMetrics()
      })
      timelineWorkspaceResizeObserver.observe(timelineWorkspaceRef.value)
    }
  })
  
  window.addEventListener('dragstart', onGlobalDragStart, true)
  window.addEventListener('dragend', onGlobalDragEnd, true)

  window.addEventListener('dragenter', handleWindowDragEnter)
  window.addEventListener('dragleave', handleWindowDragLeave)
  window.addEventListener('dragover', handleWindowDragOver)
  window.addEventListener('drop', handleWindowDrop)
})

onUnmounted(() => { 
  window.removeEventListener('keydown', handleGlobalKeydown)
  if (timelineWorkspaceResizeObserver) {
    timelineWorkspaceResizeObserver.disconnect()
    timelineWorkspaceResizeObserver = null
  }
  
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

  <div v-if="!store.isLoading" ref="appLayoutRef" class="app-layout workbench-layout" :style="appLayoutStyle">
    <aside class="activity-bar">
      <div class="activity-bar__group activity-bar__group--top">
        <button
          type="button"
          class="activity-bar__button activity-bar__button--lib"
          :class="{ 'is-active': !isLeftPanelCollapsed }"
          @click="toggleActivityPanel('library')"
        >
          <svg
              class="activity-bar__icon activity-bar__icon--lib"
              viewBox="0 0 184 182"
              aria-hidden="true"
              shape-rendering="crispEdges"
          >
            <path
                fill="currentColor"
                fill-rule="evenodd"
                d="M88.6 1.7 L53.5 38.1 L92 76.3 L127.1 38.1 Z M56.9 65.9 L26.8 97.1 L31.8 104 L61.9 72.8 Z M123.7 65.9 L118.7 72.8 L150.5 104 L155.5 98.8 Z M53.5 90.1 L92 128.3 L128.8 90.1 L128.8 175.1 L53.5 175.1 Z M3.3 138.7 L21.7 156 L51.8 126.5 L31.8 109.2 Z M148.9 109.2 L132.3 128.3 L162.3 156 L179 138.7 Z"
            />
          </svg>
        </button>
      </div>
      <div class="activity-bar__group activity-bar__group--bottom">
        <button
          type="button"
          class="activity-bar__button activity-bar__button--contract"
          :class="{ 'is-active': !isBottomPanelCollapsed && leftBottomTool === 'contract' }"
          @click="toggleBottomTool('contract')"
        >
          <img
            class="activity-bar__image-icon activity-bar__image-icon--contract"
            src="/contingency_contract/deco_contract_028.webp"
            alt=""
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          class="activity-bar__button activity-bar__button--panel"
          :class="{ 'is-active': !isBottomPanelCollapsed && leftBottomTool === 'enemy' }"
          @click="toggleBottomTool('enemy')"
        >
          <svg
              class="activity-bar__icon activity-bar__icon--panel"
              viewBox="0 0 288 288"
              aria-hidden="true"
          >
            <defs>
              <mask id="enemyPanelMask">
                <rect width="288" height="288" fill="black" />

                <g fill="white">
                  <rect x="74" y="38" width="140" height="38" />
                  <circle cx="80" cy="131" r="40" />
                  <path d=" M40 89 H248 V194 H210 L192 214 V256 H96 V214 L78 194 H40 Z " />
                </g>

                <g fill="black">
                  <path d="M95 130 L117 152 L95 174 L73 152 Z" />
                  <path d="M193 130 L215 152 L193 174 L171 152 Z" />
                </g>
              </mask>
            </defs>

            <rect
                width="288"
                height="288"
                fill="currentColor"
                mask="url(#enemyPanelMask)"
            />
          </svg>

        </button>
      </div>
    </aside>

    <aside class="workbench-panel action-library-panel">
      <template v-if="!isLeftPanelCollapsed">
        <div class="workbench-panel__body action-library-stack" :style="leftPanelStackStyle">
          <div class="action-library-stack__main action-library">
            <ActionLibrary
              :on-reset-panel="() => resetWorkbenchLayout('left')"
              :on-collapse-panel="() => toggleWorkbenchPanel('left')"
            />
          </div>
          <div v-if="!isBottomPanelCollapsed" class="action-library-stack__divider"></div>
          <div
            v-if="!isBottomPanelCollapsed"
            class="action-library-stack__bottom"
            :class="{ 'is-contract': leftBottomTool === 'contract' }"
          >
            <EnemySettingsPanel v-if="leftBottomTool === 'enemy'" />
            <div v-else class="contract-side-panel">
              <img src="/contingency_contract/1/deco_contingency_select_tag_3.webp" alt="" aria-hidden="true" />
              <div class="contract-side-title">{{ t('contingencyContract.operationName') }}</div>
            </div>
          </div>
        </div>
      </template>
    </aside>

    <div
      v-if="!isLeftPanelCollapsed"
      class="workbench-resizer workbench-resizer--vertical workbench-resizer--left"
      :class="{ 'is-active': activeWorkbenchDrag === 'left' }"
      @pointerdown="beginWorkbenchResize('left', $event)"
      @dblclick="resetWorkbenchLayout('left')"
    ></div>

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

          <div
            class="hide-effects-group"
            @mouseenter="hideEffectsHovered = true"
            @mouseleave="hideEffectsHovered = false"
          >
            <button
              class="ea-btn ea-btn--sm ea-btn--lift hide-effects-btn"
              type="button"
              :title="t('timeline.header.hideEffectsTooltip')"
              :disabled="!store.teamTracksInfo.some(track => track.id)"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {{ t('timeline.header.hideEffectsLabel') }}
            </button>

            <div v-show="hideEffectsHovered" class="hide-effects-dropdown">
              <template v-for="(track, index) in store.teamTracksInfo" :key="index">
                <div
                  v-if="track.id"
                  class="hide-effects-row"
                  @click="store.toggleOperatorEffectsVisible(index)"
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="14"
                    height="14"
                    fill="none"
                    :stroke="store.getCharacterElementColor(track.id)"
                    stroke-width="1.5"
                  >
                    <rect x="1" y="1" width="14" height="14" rx="2" />
                    <polyline
                      v-if="store.operatorEffectsVisible[index]"
                      points="3,8 6.5,11.5 13,4.5"
                      stroke-width="2"
                    />
                  </svg>
                  <span class="hide-effects-name">{{ track.name }}</span>
                </div>
              </template>
            </div>
          </div>

          <button
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--hover-green"
            type="button"
            :title="t('timeline.analysis.tooltip')"
            @click="analysisDialogVisible = true"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9v9z"></path>
              <path d="M12 3a9 9 0 0 1 9 9h-9z"></path>
            </svg>
            {{ t('timeline.analysis.button') }}
          </button>

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

      <div ref="timelineWorkspaceRef" class="timeline-workspace" :style="timelineWorkspaceStyle">
        <div class="timeline-grid-container"><TimelineGrid/></div>

        <div
          v-if="!isBottomPanelCollapsed"
          class="workbench-resizer workbench-resizer--horizontal workbench-resizer--bottom"
          :class="{ 'is-active': activeWorkbenchDrag === 'bottom' }"
          @pointerdown="beginWorkbenchResize('bottom', $event)"
          @dblclick="resetWorkbenchLayout('bottom')"
        ></div>

        <div v-if="!isBottomPanelCollapsed" class="workbench-panel resource-monitor-panel">
          <div class="workbench-panel__body resource-monitor-panel__body">
            <ResourceMonitor
              v-if="leftBottomTool === 'enemy'"
              :expand-all-token="resourceMonitorExpandAllToken"
              @collapse-panel="closeBottomPanelFromResourceMonitor"
              @section-collapse-change="handleResourceMonitorSectionCollapseChange"
            />
            <ContingencyContractPanel v-else />
          </div>
        </div>

        <div class="export-watermark" ref="watermarkEl">
          Endaxis
          <span class="watermark-sub">{{ watermarkSubText }}</span>
        </div>
      </div>
    </main>

    <div
      v-if="RIGHT_TOOLS_VISIBLE && !isRightPanelCollapsed"
      class="workbench-resizer workbench-resizer--vertical workbench-resizer--right"
      :class="{ 'is-active': activeWorkbenchDrag === 'right' }"
      @pointerdown="beginWorkbenchResize('right', $event)"
      @dblclick="resetWorkbenchLayout('right')"
    ></div>

    <aside v-if="RIGHT_TOOLS_VISIBLE" class="workbench-panel properties-sidebar" :class="{ 'is-collapsed-rail': isRightPanelCollapsed }">
      <template v-if="!isRightPanelCollapsed">
        <div class="workbench-panel__body properties-sidebar__body">
          <PropertiesPanel
            v-if="rightPanelTool === 'inspector'"
            :on-reset-panel="() => resetWorkbenchLayout('right')"
            :on-collapse-panel="() => toggleWorkbenchPanel('right')"
          />
          <SimLogPanel
            v-else
            :on-collapse-panel="() => toggleWorkbenchPanel('right')"
          />
        </div>
      </template>
    </aside>

    <aside v-if="RIGHT_TOOLS_VISIBLE" class="activity-bar activity-bar--right">
      <div class="activity-bar__group activity-bar__group--top">
        <button
          type="button"
          class="activity-bar__button activity-bar__button--inspector"
          :class="{ 'is-active': !isRightPanelCollapsed && rightPanelTool === 'inspector' }"
          @click="toggleRightTool('inspector')"
        >
          <svg class="activity-bar__icon activity-bar__icon--inspector" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M8 9.2h16v3H8Zm0 10.8h16v3H8Z" fill="#4f5054"/>
            <path d="M12.2 7.3h3.6v6.8h-3.6Zm4 10.8h3.6v6.8h-3.6Z" fill="#f5c31e"/>
            <path d="M13.9 14.1a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm4.1 10.8a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Z" fill="#ffffff"/>
          </svg>
        </button>

        <button
          type="button"
          class="activity-bar__button activity-bar__button--battle-log"
          :class="{ 'is-active': !isRightPanelCollapsed && rightPanelTool === 'battleLog' }"
          @click="toggleRightTool('battleLog')"
        >
          <svg class="activity-bar__icon activity-bar__icon--battle-log" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M10 6h14a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" fill="#ffffff" opacity="0.92"/>
            <path d="M12 11h12v2H12zM12 16h12v2H12zM12 21h12v2H12z" fill="#ffffff" opacity="0.82"/>
            <circle cx="10" cy="12" r="1.2" fill="#ffffff" opacity="0.9"/>
            <circle cx="10" cy="17" r="1.2" fill="#ffffff" opacity="0.9"/>
            <circle cx="10" cy="22" r="1.2" fill="#ffffff" opacity="0.9"/>
          </svg>
        </button>
      </div>
    </aside>

    <DamageAnalysisDialog
      :visible="analysisDialogVisible"
      @update:visible="analysisDialogVisible = $event"
    />

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
.app-layout { display: grid; grid-template-rows: 100vh; height: 100vh; overflow: hidden; background-color: #1e1f22; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.workbench-layout { gap: 0; }
.activity-bar { grid-column: 1; display: flex; flex-direction: column; align-items: center; background: linear-gradient(180deg, #1f1f1f 0%, #151515 100%); border-right: 1px solid rgba(255, 255, 255, 0.06); padding: 10px 0 12px; }
.activity-bar--right { grid-column: 7; border-right: none; border-left: 1px solid rgba(255, 255, 255, 0.06); }
.activity-bar__group { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 100%; }
.activity-bar__group--top { padding-top: 2px; }
.activity-bar__group--bottom { margin-top: auto; padding-top: 14px; }
.activity-bar__button { position: relative; width: 100%; height: 42px; display: inline-flex; align-items: center; justify-content: center; border: none; background: transparent; color: rgba(255, 255, 255, 0.42); cursor: pointer; padding: 0; transition: color 0.14s ease; }
.activity-bar__button::after { content: ''; position: absolute; left: 50%; top: 50%; width: 34px; height: 34px; border-radius: 8px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.06); transform: translate(-50%, -50%); opacity: 0; transition: opacity 0.14s ease, background-color 0.14s ease, border-color 0.14s ease; pointer-events: none; }
.activity-bar__button:hover { color: rgba(255, 255, 255, 0.84); background: rgba(255, 255, 255, 0.035); }
.activity-bar__button:hover::after { opacity: 0.55; }
.activity-bar__button.is-active { color: #f2f2f2; }
.activity-bar__button.is-active::after { opacity: 1; background: rgba(255, 255, 255, 0.07); border-color: rgba(255, 255, 255, 0.09); }
.activity-bar__icon { width: 24px; height: 24px; display: block; opacity: 0.78; transition: transform 0.14s ease, opacity 0.14s ease; }
.activity-bar__button:hover .activity-bar__icon,
.activity-bar__button.is-active .activity-bar__icon { opacity: 1; transform: scale(1.02); }
.activity-bar__button--lib .activity-bar__icon { width: 24px; height: 24px; }
.activity-bar__button--panel .activity-bar__icon { width: 24px; height: 24px; transform: translateY(0.5px); }
.activity-bar__button--inspector .activity-bar__icon { width: 22px; height: 22px; }
.activity-bar__image-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  display: block;
  opacity: 0.78;
  filter: saturate(0.9) brightness(0.82);
  transition: transform 0.14s ease, opacity 0.14s ease, filter 0.14s ease;
}
.activity-bar__button:hover .activity-bar__image-icon,
.activity-bar__button.is-active .activity-bar__image-icon {
  opacity: 1;
  filter: saturate(1.06) brightness(1.06) drop-shadow(0 0 8px rgba(255, 215, 0, 0.18));
  transform: scale(1.04);
}
.workbench-panel { position: relative; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; background: #252526; }
.action-library-panel { grid-column: 2; }
.timeline-main { grid-column: 4; }
.properties-sidebar { grid-column: 6; }
.workbench-panel__header { height: 25px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end; padding: 0 8px 0 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.035); background: #252526; }
.workbench-panel__header--dense { height: 24px; }
.workbench-panel__label { color: rgba(255, 255, 255, 0.56); font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
.workbench-panel__tools { display: flex; align-items: center; gap: 2px; }
.workbench-icon-btn { width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 4px; background: transparent; color: rgba(255, 255, 255, 0.38); cursor: pointer; padding: 0; }
.workbench-icon-btn:hover { color: rgba(255, 255, 255, 0.84); background: rgba(255, 255, 255, 0.045); }
.workbench-panel__body { flex: 1; min-height: 0; min-width: 0; overflow: hidden; }
.panel-chrome { position: absolute; top: 8px; z-index: 35; display: flex; align-items: center; gap: 2px; padding: 2px 4px 2px 6px; border-radius: 8px 0 0 8px; border: 1px solid rgba(255, 255, 255, 0.06); border-right: none; background: linear-gradient(90deg, rgba(37, 37, 38, 0.86) 0%, rgba(37, 37, 38, 0.62) 100%); backdrop-filter: blur(4px); opacity: 0.18; transform: translateX(2px); transition: opacity 0.14s ease, background-color 0.14s ease, transform 0.14s ease; }
.action-library-panel:hover .panel-chrome,
.properties-sidebar:hover .panel-chrome,
.resource-monitor-panel:hover .panel-chrome,
.panel-chrome:focus-within { opacity: 1; background: linear-gradient(90deg, rgba(37, 37, 38, 0.96) 0%, rgba(37, 37, 38, 0.82) 100%); transform: translateX(0); }
.panel-chrome--left { right: 0; }
.panel-chrome--right { right: 0; }
.panel-chrome__btn { width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 4px; background: transparent; color: rgba(255, 255, 255, 0.38); cursor: pointer; padding: 0; }
.panel-chrome__btn:hover { color: rgba(255, 255, 255, 0.88); background: rgba(255, 255, 255, 0.055); }
.workbench-resizer { position: relative; background: rgba(255, 255, 255, 0.05); z-index: 30; touch-action: none; }
.workbench-resizer--left { grid-column: 3; }
.workbench-resizer--right { grid-column: 5; }
.workbench-resizer::before { content: ''; position: absolute; inset: 0; opacity: 0; transition: opacity 0.12s ease, background-color 0.12s ease; }
.workbench-resizer:hover::before, .workbench-resizer.is-active::before { opacity: 1; background: rgba(255, 255, 255, 0.12); }
.workbench-resizer--vertical { cursor: ew-resize; }
.workbench-resizer--horizontal { cursor: ns-resize; }
.workbench-resizer--vertical::after { content: ''; position: absolute; top: 0; left: 50%; width: 9px; height: 100%; transform: translateX(-50%); }
.workbench-resizer--horizontal::after { content: ''; position: absolute; top: 50%; left: 0; width: 100%; height: 9px; transform: translateY(-50%); }
.action-library-panel { z-index: 10; }
.action-library-stack { display: grid; min-height: 0; background-color: #252526; }
.action-library-stack__main,
.action-library-stack__bottom {
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
.action-library-stack__divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
}
.action-library-stack__bottom {
  background: #252526;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}
.action-library-stack__bottom.is-contract {
  border-top: none;
}
.contract-side-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  box-sizing: border-box;
  background: #252526;
  overflow: hidden;
}
.contract-side-panel img {
  width: min(82px, 48%);
  max-height: 82px;
  object-fit: contain;
  opacity: 0.78;
  filter: saturate(1.02) brightness(0.92);
}
.contract-side-title {
  color: #ff4d4f;
  font-size: 13px;
  font-weight: 900;
  text-align: center;
  white-space: nowrap;
}
.action-library { background-color: #252526; display: flex; flex-direction: column; overflow-y: auto; z-index: 10; height: 100%; }
.timeline-main { position: relative; display: flex; flex-direction: column; overflow: hidden; background-color: #1f1f22; z-index: 1; min-width: 0; }
.properties-sidebar { z-index: 10; }
.properties-sidebar__body { background-color: #252526; }
.workbench-rail { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 10px; }
.workbench-rail__button { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 6px; background: transparent; color: rgba(255, 255, 255, 0.48); cursor: pointer; padding: 0; }
.workbench-rail__button:hover { color: rgba(255, 255, 255, 0.9); background: rgba(255, 255, 255, 0.06); }

/* Header */
.timeline-header { height: 50px; flex-shrink: 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); background-color: #3a3a3a; display: flex; align-items: center; justify-content: space-between; padding: 0 10px 0 0; cursor: default; user-select: none; }

.header-controls { display: flex; align-items: center; gap: 10px; }
.divider-vertical { width: 1px; height: 20px; background-color: #555; margin: 0 5px; }
.hide-effects-group { position: relative; }
.hide-effects-group::after { content: ''; position: absolute; left: 0; right: 0; top: 100%; height: 6px; z-index: 39; }
.hide-effects-btn { white-space: nowrap; display: flex; align-items: center; gap: 5px; }
.hide-effects-dropdown { position: absolute; top: 100%; left: 0; min-width: 160px; margin-top: 4px; padding: 4px 0; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; z-index: 40; }
.hide-effects-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; cursor: pointer; white-space: nowrap; user-select: none; color: #ccc; font-size: 12px; }
.hide-effects-row:hover { background: #3a3a3a; color: #fff; }
.hide-effects-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }

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
.timeline-workspace { flex-grow: 1; display: grid; overflow: hidden; position: relative; min-height: 0; background: #1f1f22; }
.timeline-grid-container { grid-row: 1; overflow: hidden; min-height: 0; min-width: 0; }
.workbench-resizer--bottom { grid-row: 2; }
.resource-monitor-panel { grid-row: 3; z-index: 20; background: #252526; min-height: 0; }
.resource-monitor-panel__body { background: #252526; position: relative; }

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
