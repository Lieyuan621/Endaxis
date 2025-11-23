<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import html2canvas from 'html2canvas'
import { ElLoading, ElMessage } from 'element-plus'

// 子组件引用
import TimelineGrid from '../components/TimelineGrid.vue'
import ActionLibrary from '../components/ActionLibrary.vue'
import PropertiesPanel from '../components/PropertiesPanel.vue'
import SpMonitor from '../components/SpMonitor.vue'
import StaggerMonitor from '../components/StaggerMonitor.vue'

const store = useTimelineStore()
const fileInputRef = ref(null)

// ===================================================================================
// 全局快捷键监听 (Global Hotkeys)
// ===================================================================================
function handleGlobalKeydown(e) {
  // 1. 输入框防冲突保护 (Input Guard)
  // 如果焦点在输入框、文本域、下拉框或可编辑区域，直接忽略快捷键
  const target = e.target
  const isFormElement = target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
  )
  if (isFormElement) return

  // 2. 撤销 (Ctrl + Z)
  if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
    e.preventDefault()
    store.undo()
    ElMessage.info({ message: '已撤销', duration: 800 })
    return
  }

  // 3. 重做 (Ctrl + Y 或 Ctrl + Shift + Z)
  if (
      (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) ||
      (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
  ) {
    e.preventDefault()
    store.redo()
    ElMessage.info({ message: '已重做', duration: 800 })
    return
  }

  // 4. 复制 (Ctrl + C)
  if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
    e.preventDefault()
    store.copySelection()
    ElMessage.success({ message: '已复制', duration: 1000 })
    return
  }

  // 5. 粘贴 (Ctrl + V)
  if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
    e.preventDefault()
    store.pasteSelection()
    ElMessage.success({ message: '已粘贴', duration: 1000 })
    return
  }

  // 6. 切换辅助线 (Ctrl + G)
  if (e.ctrlKey && (e.key === 'g' || e.key === 'G')) {
    e.preventDefault()
    store.toggleCursorGuide()
    ElMessage.info({
      message: store.showCursorGuide ? '辅助线：开启' : '辅助线：隐藏',
      duration: 1500,
    })
    return
  }

  // 7. 切换框选模式 (Ctrl + B)
  if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
    e.preventDefault()
    store.toggleBoxSelectMode()
    ElMessage.info({
      message: store.isBoxSelectMode ? '框选模式：开启' : '框选模式：关闭',
      duration: 1500,
    })
    return
  }
}

// ===================================================================================
// 生命周期与文件操作 (Lifecycle & IO)
// ===================================================================================

onMounted(() => {
  store.fetchGameData()
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

function triggerImport() {
  if (fileInputRef.value) fileInputRef.value.click()
}

async function onFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return
  try {
    await store.importProject(file)
    ElMessage.success('项目加载成功！')
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    event.target.value = ''
  }
}

// ===================================================================================
// 长图导出逻辑 (Export Logic)
// ===================================================================================

async function exportAsImage() {
  const durationSeconds = store.TOTAL_DURATION + 5
  const pixelsPerSecond = store.timeBlockWidth
  const sidebarWidth = 180
  const rightMargin = 100
  const contentWidth = durationSeconds * pixelsPerSecond
  const totalWidth = sidebarWidth + contentWidth + rightMargin

  const loading = ElLoading.service({
    lock: true, text: '正在进行像素级对齐并渲染长图...', background: 'rgba(0, 0, 0, 0.9)',
  })

  // 1. 备份当前状态
  const originalScrollLeft = store.timelineScrollLeft
  const workspaceEl = document.querySelector('.timeline-workspace')
  const timelineMain = document.querySelector('.timeline-main')
  const gridLayout = document.querySelector('.timeline-grid-layout')
  const scrollers = document.querySelectorAll('.tracks-content-scroller, .chart-scroll-wrapper, .timeline-grid-container')
  const tracksContent = document.querySelector('.tracks-content')

  const styleMap = new Map()
  const backupStyle = (el) => { if (el) styleMap.set(el, el.style.cssText) }

  backupStyle(workspaceEl); backupStyle(timelineMain); backupStyle(gridLayout); backupStyle(tracksContent);
  scrollers.forEach(el => backupStyle(el))

  const hiddenSelects = []; const tempLabels = []

  try {
    // 2. 强制展开所有容器
    store.setScrollLeft(0)
    scrollers.forEach(el => el.scrollLeft = 0)
    await new Promise(resolve => setTimeout(resolve, 100))

    if (timelineMain) { timelineMain.style.width = `${totalWidth}px`; timelineMain.style.overflow = 'visible'; }
    if (workspaceEl) { workspaceEl.style.width = `${totalWidth}px`; workspaceEl.style.overflow = 'visible'; }
    if (gridLayout) { gridLayout.style.width = `${totalWidth}px`; gridLayout.style.display = 'grid'; gridLayout.style.gridTemplateColumns = `${sidebarWidth}px ${contentWidth + rightMargin}px`; gridLayout.style.overflow = 'visible'; }
    scrollers.forEach(el => { el.style.width = '100%'; el.style.overflow = 'visible'; el.style.maxWidth = 'none' })

    if (tracksContent) {
      tracksContent.style.width = `${contentWidth}px`; tracksContent.style.minWidth = `${contentWidth}px`
      const svgs = tracksContent.querySelectorAll('svg')
      svgs.forEach(svg => { svg.style.width = `${contentWidth}px`; svg.setAttribute('width', contentWidth) })
    }

    // 3. 替换 Element UI Select 为纯文本 (解决截图空白 bug)
    const rows = document.querySelectorAll('.track-info')
    store.teamTracksInfo.forEach((info, index) => {
      const row = rows[index]
      if (!row) return
      const originalRowStyle = row.style.cssText
      styleMap.set(row, originalRowStyle)
      row.style.borderTop = '2px solid transparent'; row.style.borderBottom = '2px solid transparent'; row.style.boxSizing = 'border-box'

      const select = row.querySelector('.character-select')
      if (select) {
        select.style.display = 'none'; hiddenSelects.push(select)
        const label = document.createElement('div')
        label.innerText = info.name || '未选择'
        Object.assign(label.style, { color: '#f0f0f0', fontSize: '16px', fontWeight: 'bold', height: '50px', lineHeight: '50px', paddingLeft: '10px', flexGrow: '1', marginTop: '15px', fontFamily: 'sans-serif' })
        row.appendChild(label); tempLabels.push(label)
      }
    })

    await new Promise(resolve => setTimeout(resolve, 400))

    // 4. 执行截图
    const canvas = await html2canvas(workspaceEl, {
      backgroundColor: '#282828', scale: 1.5, width: totalWidth, height: workspaceEl.scrollHeight + 20, windowWidth: totalWidth, useCORS: true, logging: false
    })

    // 5. 下载
    const link = document.createElement('a')
    link.download = `Endaxis_Full_${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    ElMessage.success('高清长图导出成功！')

  } catch (error) {
    console.error(error); ElMessage.error('导出失败：' + error.message)
  } finally {
    // 6. 恢复现场
    tempLabels.forEach(el => el.remove()); hiddenSelects.forEach(el => el.style.display = '')
    styleMap.forEach((cssText, el) => el.style.cssText = cssText)
    store.setScrollLeft(originalScrollLeft); loading.close()
  }
}
</script>

<template>
  <div v-if="store.isLoading" class="loading-screen">
    <div class="loading-content">
      <div class="spinner"></div>
      <p>正在加载资源...</p>
    </div>
  </div>

  <div v-if="!store.isLoading" class="app-layout">
    <aside class="action-library">
      <ActionLibrary/>
    </aside>

    <main class="timeline-main">
      <header class="timeline-header" @click="store.selectTrack(null)">
        <div class="header-section">
          <span class="header-title">控制区</span>
          <div class="zoom-controls">
            <span class="zoom-label">🔍 缩放</span>
            <el-slider v-model="store.zoomLevel" :min="0.2" :max="2.0" :step="0.1"
                       :format-tooltip="(val) => `${Math.round(val * 100)}%`"
                       size="small" style="width: 100px"/>
          </div>
        </div>

        <div class="header-controls">
          <button class="control-btn export-img-btn" @click="exportAsImage" title="导出为PNG长图">
            📷 导出图片
          </button>
          <div class="divider-vertical"></div>
          <button class="control-btn save-btn" @click="store.exportProject" title="保存为 .json 文件">
            💾 保存项目
          </button>
          <button class="control-btn load-btn" @click="triggerImport" title="加载 .json 文件">
            📂 读取项目
          </button>
          <input type="file" ref="fileInputRef" style="display: none" accept=".json" @change="onFileSelected"/>
        </div>
      </header>

      <div class="timeline-workspace">
        <div class="timeline-grid-container"><TimelineGrid/></div>
        <div class="stagger-monitor-panel"><StaggerMonitor/></div>
        <div class="sp-monitor-panel"><SpMonitor/></div>
      </div>
    </main>

    <aside class="properties-sidebar">
      <PropertiesPanel/>
    </aside>
  </div>
</template>

<style scoped>
/* ==========================================================================
   布局结构 (Layout)
   ========================================================================== */
.app-layout {
  display: grid;
  grid-template-columns: 200px 1fr 250px; /* 左侧库 | 中间时间轴 | 右侧属性 */
  grid-template-rows: 100vh;
  height: 100vh;
  overflow: hidden;
  background-color: #2c2c2c;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.action-library {
  background-color: #333;
  border-right: 1px solid #444;
  display: flex; flex-direction: column; overflow-y: auto;
  z-index: 10;
}

.timeline-main {
  display: flex; flex-direction: column; overflow: hidden;
  background-color: #282828;
  z-index: 1;
  border-right: 1px solid #444;
}

.properties-sidebar {
  background-color: #333;
  overflow: hidden;
  z-index: 10;
}

/* ==========================================================================
   Header 样式
   ========================================================================== */
.timeline-header {
  height: 50px; flex-shrink: 0;
  border-bottom: 1px solid #444; background-color: #3a3a3a;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px;
  cursor: default; user-select: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.header-section {
  display: flex; align-items: center; gap: 20px;
}

.header-title {
  font-weight: bold; color: #ccc; font-size: 14px;
}

.zoom-controls {
  display: flex; align-items: center; gap: 10px;
  background: #2b2b2b; padding: 4px 15px;
  border-radius: 16px; border: 1px solid #444;
}

.zoom-label { font-size: 12px; color: #888; }

.header-controls { display: flex; align-items: center; gap: 10px; }

.divider-vertical {
  width: 1px; height: 20px; background-color: #555; margin: 0 5px;
}

/* ==========================================================================
   Buttons
   ========================================================================== */
.control-btn {
  padding: 6px 14px; border: 1px solid #555;
  background-color: #444; color: #f0f0f0;
  border-radius: 4px; cursor: pointer; font-size: 12px;
  display: flex; align-items: center; gap: 6px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.control-btn:hover { background-color: #555; border-color: #777; transform: translateY(-1px); }
.control-btn:active { transform: translateY(1px); }

.save-btn:hover { border-color: #4CAF50; color: #4CAF50; background-color: rgba(76, 175, 80, 0.1); }
.load-btn:hover { border-color: #4a90e2; color: #4a90e2; background-color: rgba(74, 144, 226, 0.1); }
.export-img-btn:hover { border-color: #e6a23c; color: #e6a23c; background-color: rgba(230, 162, 60, 0.1); }

/* ==========================================================================
   Workspace
   ========================================================================== */
.timeline-workspace {
  flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;
}

.timeline-grid-container {
  flex-grow: 1; overflow: hidden; min-height: 0;
}

.stagger-monitor-panel {
  height: 60px; flex-shrink: 0;
  border-top: 1px solid #444;
  z-index: 20; background: #252525;
}

.sp-monitor-panel {
  height: 140px; flex-shrink: 0;
  border-top: 1px solid #444;
  z-index: 20; background: #252525;
}

/* ==========================================================================
   Loading Screen
   ========================================================================== */
.loading-screen {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: #18181c; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  color: #888; font-size: 14px;
}
.loading-content { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.spinner {
  width: 30px; height: 30px; border: 3px solid #333;
  border-top-color: #ffd700; border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>