<script setup>
import { onMounted, onUnmounted, ref, nextTick, computed, watch } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { useShareProject } from '@/composables/useShareProject.js'
import html2canvas from 'html2canvas'
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus'
import { snapdom } from '@zumer/snapdom';

// 组件引入
import TimelineGrid from '../components/TimelineGrid.vue'
import ActionLibrary from '../components/ActionLibrary.vue'
import PropertiesPanel from '../components/PropertiesPanel.vue'
import ResourceMonitor from '../components/ResourceMonitor.vue'

const store = useTimelineStore()
const { copyShareCode, importFromCode } = useShareProject()

const watermarkEl = ref(null)
const watermarkSubText = ref('Created by Endaxis')

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
      '确定要删除该方案吗？此操作无法撤销。',
      '删除方案',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    store.deleteScenario(id)
    ElMessage.success('方案已删除')
  }).catch(() => {})
}

function handleDuplicateCurrent() {
  if (!currentScenario.value) return
  if (store.scenarioList.length >= store.MAX_SCENARIOS) {
    ElMessage.warning(`方案数量已达上限 (${store.MAX_SCENARIOS})`)
    return
  }
  store.duplicateScenario(currentScenario.value.id)
  ElMessage.success('方案已复制')
}

function handleAddScenario() {
  if (store.scenarioList.length >= store.MAX_SCENARIOS) {
    ElMessage.warning(`方案数量已达上限 (${store.MAX_SCENARIOS})`)
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

// === 关于弹窗逻辑 ===
const aboutDialogVisible = ref(false)
const CURRENT_NOTICE_VERSION = '2025-12-5-update'

onMounted(() => {
  const lastSeenVersion = localStorage.getItem('endaxis_notice_version')
  if (lastSeenVersion !== CURRENT_NOTICE_VERSION) {
    aboutDialogVisible.value = true
    localStorage.setItem('endaxis_notice_version', CURRENT_NOTICE_VERSION)
  }
})

// === 文件导入相关 ===
const fileInputRef = ref(null)

function triggerImport() {
  if (fileInputRef.value) fileInputRef.value.click()
}

async function onFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    const success = await store.importProject(file)
    if (success) ElMessage.success('项目加载成功！')
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    event.target.value = ''
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
    text: `正在渲染前 ${durationSeconds} 秒的长图...`,
    background: 'rgba(0, 0, 0, 0.9)'
  })

  const originalScrollLeft = store.timelineScrollLeft

  document.body.classList.add('capture-mode')

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
    store.setScrollLeft(0)
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

    await capture.download({ format: 'png', filename: userFilename });

    ElMessage.success(`长图已导出：${userFilename}`)

  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败：' + error.message)
  } finally {
    document.body.classList.remove('capture-mode')
    styleMap.forEach((cssText, el) => el.style.cssText = cssText)
    if (watermarkEl.value) {
      watermarkEl.value.style.display = 'none'
    }
    store.setScrollLeft(originalScrollLeft)
    loading.close()
  }
}

// === 重置与快捷键 ===
function handleReset() {
  ElMessageBox.confirm(
      '确定要清空当前所有进度吗？这将清空所有方案数据。',
      '警告',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning',
      }
  ).then(() => {
    store.resetProject()
    ElMessage.success('项目已重置')
  }).catch(() => {})
}

// === 接收分享码逻辑 ===
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
  if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); store.undo(); ElMessage.info({ message: '已撤销', duration: 800 }); return }
  if ((e.ctrlKey && (e.key === 'y' || e.key === 'Y')) || (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) { e.preventDefault(); store.redo(); ElMessage.info({message: '已重做', duration: 800}); return }
  if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); store.copySelection(); ElMessage.success({message: '已复制', duration: 800}); return }
  if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) { e.preventDefault(); store.pasteSelection(); ElMessage.success({message: '已粘贴', duration: 800}); return }
  if (e.ctrlKey && (e.key === 'g' || e.key === 'G')) { e.preventDefault(); store.toggleCursorGuide(); ElMessage.info({ message: store.showCursorGuide ? '辅助线：开启' : '辅助线：隐藏', duration: 1500 }); return }
  if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); store.toggleBoxSelectMode(); ElMessage.info({ message: store.isBoxSelectMode ? '框选模式：开启' : '框选模式：关闭', duration: 1500 }); return }
  if (e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); store.toggleSnapStep(); const mode = store.snapStep < 0.05 ? '1帧 (1/60s)' : '0.1s';ElMessage.info({message: `吸附精度：${mode}`, duration: 1000}); return }
  if (e.altKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); store.toggleConnectionTool(); ElMessage.info({ message: `连接工具：${store.enableConnectionTool ? '开启' : '关闭'}`,  duration: 1000 }); return }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => { window.removeEventListener('keydown', handleGlobalKeydown) })
</script>

<template>
  <div v-if="store.isLoading" class="loading-screen">
    <div class="loading-content">
      <div class="spinner"></div>
      <p>正在加载资源...</p>
    </div>
  </div>

  <div v-if="!store.isLoading" class="app-layout">
    <aside class="action-library"><ActionLibrary/></aside>

    <main class="timeline-main">
      <header class="timeline-header" @click="store.selectTrack(null)">

        <div class="tech-scenario-bar">

          <div class="ts-header-group">

            <button class="ts-icon-btn" @click="startRenameCurrent" title="重命名当前方案">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>

            <button class="ts-icon-btn" @click="handleDuplicateCurrent" title="复制当前方案">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>

            <button
                v-if="store.scenarioList.length > 1"
                class="ts-icon-btn danger"
                @click="handleDeleteCurrent"
                title="删除当前方案"
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
                {{ currentScenario?.name || '未命名方案' }}
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
                class="ts-add-btn"
                @click="handleAddScenario"
                title="新建方案"
            >+</button>
          </div>

        </div>

        <div class="header-controls">
          <input type="file" ref="fileInputRef" style="display: none" accept=".json" @change="onFileSelected" />

          <button class="control-btn info-btn" @click="aboutDialogVisible = true" title="查看教程与项目信息">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            关于
          </button>

          <div class="divider-vertical"></div>

          <button class="control-btn danger-btn" @click="handleReset" title="清空所有内容">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            重置
          </button>

          <div class="divider-vertical"></div>

          <button class="control-btn export-img-btn" @click="openExportDialog" title="导出为PNG长图">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>
            </svg>
            导出图片
          </button>

          <div class="divider-vertical"></div>

          <button class="control-btn load-btn" @click="triggerImport" title="导入 .json 项目文件">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            加载
          </button>

          <button class="control-btn save-btn" @click="store.exportProject" title="保存为 .json 文件">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            保存
          </button>


          <button class="control-btn share-btn" @click="copyShareCode" title="复制当前方案的分享码">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            分享
          </button>
          <button class="control-btn load-btn" @click="openImportShareDialog" title="粘贴分享码导入方案">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            接收
          </button>
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

    <el-dialog v-model="exportDialogVisible" title="导出长图设置" width="420px" align-center class="custom-dialog">
      <div class="export-form">
        <div class="form-item"><label>文件名称</label><el-input v-model="exportForm.filename" placeholder="请输入文件名" size="large"/></div>
        <div class="form-item"><label>导出时长 (秒)</label><el-input-number v-model="exportForm.duration" :min="10" :max="store.TOTAL_DURATION" :step="10" size="large" style="width: 100%;"/><div class="hint">最大支持 {{ store.TOTAL_DURATION }}s</div></div>
      </div>
      <template #footer><span class="dialog-footer"><el-button @click="exportDialogVisible = false">取消</el-button><el-button type="primary" @click="processExport">开始导出</el-button></span></template>
    </el-dialog>

    <el-dialog
        v-model="importShareDialogVisible"
        title="导入分享方案"
        width="500px"
        align-center
        class="custom-dialog"
        :append-to-body="true"
    >
      <div class="share-import-container">
        <p class="dialog-hint">请粘贴分享码（Endaxis Share Code）：</p>

        <el-alert
            title="警告：导入将覆盖当前所有工程数据，建议先保存。"
            type="warning"
            show-icon
            :closable="false"
            style="margin-bottom: 10px;"
        />

        <el-input
            v-model="shareCodeInput"
            type="textarea"
            :rows="6"
            placeholder="在此粘贴长字符串..."
            resize="none"
        />
      </div>
      <template #footer>
      <span class="dialog-footer">
        <el-button @click="importShareDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportShare">确认覆盖并导入</el-button>
      </span>
      </template>
    </el-dialog>

    <el-dialog
        v-model="aboutDialogVisible"
        title="关于 Endaxis"
        width="500px"
        align-center
        class="custom-dialog"
    >
      <div class="about-content">
        <div class="about-section">
          <h3>欢迎使用</h3>
          <p>Endaxis 是一个专为《明日方舟：终末地》设计的可视化排轴工具。你可以通过拖拽技能、建立连线关系来规划战术流程。</p>
        </div>

        <div class="about-section">
          <h3>项目概况</h3>
          <p>
            大部分干员可能仅有头像和默认占位数据。如果有意向提供详细数据可以联系我们。
          </p>
        </div>

        <div class="about-section">
          <h3>🔗 链接与资源</h3>
          <ul class="link-list">
            <li>
              <span class="link-label">📺 视频教程：</span>
              <a href="https://www.bilibili.com/video/BV1gSSvB6E69/?vd_source=75ba4ea898b31481694ff91bb4513587" target="_blank" class="highlight-link">
                点击观看 Bilibili 教程
              </a>
            </li>
            <li>
              <span class="link-label">📝 文本教程：</span>
              <a href="https://gx3qqg8r3jk.feishu.cn/wiki/TUTyw3s32iPsAXkCfl0cCE0VnOj" target="_blank" class="highlight-link">
                点击查看使用文档
              </a>
            </li>
            <li>
              <span class="link-label">💻 项目仓库：</span>
              <a href="https://github.com/Lieyuan621/Endaxis" target="_blank" class="highlight-link">
                GitHub 仓库
              </a>
            </li>
          </ul>
        </div>

        <div class="about-section">
          <h3>🤝 友情链接</h3>
          <ul class="link-list">
            <li>
              <span class="link-label">地图：</span>
              <a href="https://www.zmdmap.com/" target="_blank" class="highlight-link">
                终末地资源互动地图
              </a>
            </li>
            <li>
              <span class="link-label">一图流：</span>
              <a href="https://ef.yituliu.cn/" target="_blank" class="highlight-link">
                终末地一图流
              </a>
            </li>
          </ul>
        </div>

      </div>

      <template #footer>
    <span class="dialog-footer">
      <el-button type="primary" @click="aboutDialogVisible = false">开始使用</el-button>
    </span>
      </template>
    </el-dialog>

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

.ts-icon-btn { width: 24px; height: 24px; background: transparent; border: 1px solid transparent; border-radius: 4px; color: #888; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
.ts-icon-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; border-color: #555; }
.ts-icon-btn.danger:hover { background: rgba(255, 77, 79, 0.1); color: #ff4d4f; border-color: #ff4d4f; }

.ts-title-wrapper { display: flex; align-items: baseline; color: #f0f0f0; font-size: 16px; font-weight: bold; font-family: 'Segoe UI', sans-serif; letter-spacing: 0.5px; margin-left: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ts-deco-bracket { color: #666; font-weight: 300; margin: 0 2px; user-select: none; flex-shrink: 0; }

.ts-title-text { white-space: nowrap; cursor: pointer; border-bottom: 1px dashed transparent; overflow: hidden; text-overflow: ellipsis; }
.ts-title-text:hover { border-bottom-color: #888; }

.ts-title-input { background: transparent; border: none; border-bottom: 1px solid #ffd700; color: #ffd700; font-size: 16px; font-weight: bold; width: 120px; outline: none; padding: 0; }

.ts-tab-item { min-width: 40px; height: 24px; display: flex; align-items: center; justify-content: center; font-family: 'Roboto Mono', monospace; font-size: 12px; font-weight: bold; color: #aaa; background-color: rgba(255, 255, 255, 0.08); border-radius: 4px; cursor: pointer; transition: all 0.2s; user-select: none; flex-shrink: 0; }
.ts-tab-item:hover { background-color: rgba(255, 255, 255, 0.15); color: #fff; }
.ts-tab-item.is-active { background-color: #e0e0e0; color: #222; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }

.ts-add-btn { width: 24px; height: 24px; background: transparent; border: 1px dashed #555; color: #666; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-left: 4px; font-size: 14px; transition: all 0.2s; flex-shrink: 0; }
.ts-add-btn:hover { border-color: #ffd700; color: #ffd700; background: rgba(255, 215, 0, 0.05); }
.ts-add-btn.is-disabled { opacity: 0.3; cursor: not-allowed; border-color: #444; color: #444; }
.ts-add-btn.is-disabled:hover { background: transparent; border-color: #444; color: #444; }

/* Buttons */
.control-btn { padding: 6px 14px; border: 1px solid #555; background-color: #444; color: #f0f0f0; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; font-weight: 500; }
.control-btn svg { flex-shrink: 0; display: block; }
.control-btn:hover { background-color: #555; border-color: #777; transform: translateY(-1px); }
.control-btn:active { transform: translateY(1px); }
.save-btn:hover { border-color: #4CAF50; color: #4CAF50; background-color: rgba(76, 175, 80, 0.1); }
.load-btn:hover { border-color: #4a90e2; color: #4a90e2; background-color: rgba(74, 144, 226, 0.1); }
.export-img-btn:hover { border-color: #e6a23c; color: #e6a23c; background-color: rgba(230, 162, 60, 0.1); }
.danger-btn:hover { border-color: #a61d24; color: #a61d24; background-color: rgba(255, 77, 79, 0.1); }
.info-btn:hover { border-color: #00e5ff; color: #00e5ff; background-color: rgba(0, 229, 255, 0.1); }
.share-btn:hover { border-color: #722ed1; color: #722ed1; background-color: rgba(114, 46, 209, 0.1); }

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
.form-item label { display: block; margin-bottom: 8px; font-weight: bold; color: #ccc; }
.hint { font-size: 12px; color: #888; margin-top: 6px; }

/* 关于弹窗内容样式 */
.about-content { display: flex; flex-direction: column; gap: 20px; color: #ccc; line-height: 1.6; }
.about-section h3 { margin: 0 0 10px 0; color: #ffd700; font-size: 15px; border-left: 3px solid #ffd700; padding-left: 8px; }
.about-section p { margin: 0; font-size: 13px; }
.link-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.link-list li { display: flex; align-items: center; font-size: 13px; }
.link-label { color: #aaa; margin-right: 5px; }
.highlight-link { color: #00e5ff; text-decoration: none; border-bottom: 1px dashed rgba(0, 229, 255, 0.5); transition: all 0.2s; }
.highlight-link:hover { color: #fff; border-bottom-style: solid; }

.share-import-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dialog-hint {
  color: #aaa;
  font-size: 13px;
  margin: 0;
}
:deep(.el-textarea__inner) {
  background-color: #1f1f1f;
  box-shadow: 0 0 0 1px #444 inset;
  color: #e0e0e0;
  border: none;
}
:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #ffd700 inset;
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
:deep(.el-button) { background: #3a3a3a; border-color: #555; color: #ccc; height: 36px; display: inline-flex; justify-content: center; align-items: center; border-bottom: none !important; outline: none !important; }
:deep(.el-button:hover) { background: #444; color: white; border-color: #777; }
:deep(.el-button--primary) { background: #ffd700; border-color: #ffd700; color: #000; font-weight: bold; }
:deep(.el-button--primary:hover) { background: #ffec3d; border-color: #ffec3d; color: #000; }
</style>