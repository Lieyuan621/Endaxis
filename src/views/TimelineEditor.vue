<script setup>
import { onMounted, ref } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import html2canvas from 'html2canvas'
import { ElLoading, ElMessage } from 'element-plus'

// 子组件
import TimelineGrid from '../components/TimelineGrid.vue'
import ActionLibrary from '../components/ActionLibrary.vue'
import PropertiesPanel from '../components/PropertiesPanel.vue'
import SpMonitor from '../components/SpMonitor.vue'

const store = useTimelineStore()
const fileInputRef = ref(null)

// ===================================================================================
// 1. 项目管理 (Load / Save / Import)
// ===================================================================================

onMounted(() => {
  store.fetchGameData()
})

function triggerImport() {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
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
// 2. 长图导出逻辑 (Export Image)
// ===================================================================================

/**
 * 导出高清长图
 * 难点：HTML2Canvas 无法截取 overflow:hidden/scroll 内部的内容。
 * 策略：[Freeze] -> [Expand] -> [Patch] -> [Capture] -> [Restore]
 */
async function exportAsImage() {
  // 配置导出参数
  const durationSeconds = store.TOTAL_DURATION + 5 // 多截 5s 留白
  const pixelsPerSecond = store.timeBlockWidth
  const sidebarWidth = 180
  const rightMargin = 100
  const contentWidth = durationSeconds * pixelsPerSecond
  const totalWidth = sidebarWidth + contentWidth + rightMargin

  // 显示全屏 Loading，防止用户在导出期间操作
  const loading = ElLoading.service({
    lock: true,
    text: '正在进行像素级对齐并渲染长图...',
    background: 'rgba(0, 0, 0, 0.9)',
  })

  // --- A. 状态备份 (Snapshot) ---
  const originalScrollLeft = store.timelineScrollLeft
  const workspaceEl = document.querySelector('.timeline-workspace')
  const timelineMain = document.querySelector('.timeline-main')
  const gridLayout = document.querySelector('.timeline-grid-layout')
  const scrollers = document.querySelectorAll('.tracks-content-scroller, .chart-scroll-wrapper, .timeline-grid-container')
  const tracksContent = document.querySelector('.tracks-content')

  // 样式备份 Map
  const styleMap = new Map()
  const backupStyle = (el) => {
    if (el) styleMap.set(el, el.style.cssText)
  }

  backupStyle(workspaceEl)
  backupStyle(timelineMain)
  backupStyle(gridLayout)
  backupStyle(tracksContent)
  scrollers.forEach(el => backupStyle(el))

  const hiddenSelects = []
  const tempLabels = []

  try {
    // --- B. 归位与展开 (Expand) ---
    store.setScrollLeft(0)
    scrollers.forEach(el => el.scrollLeft = 0)
    await new Promise(resolve => setTimeout(resolve, 100)) // 等待 Vue 渲染

    // 强制撑开所有容器
    if (timelineMain) {
      timelineMain.style.width = `${totalWidth}px`;
      timelineMain.style.overflow = 'visible';
    }
    if (workspaceEl) {
      workspaceEl.style.width = `${totalWidth}px`;
      workspaceEl.style.overflow = 'visible';
    }

    if (gridLayout) {
      gridLayout.style.width = `${totalWidth}px`
      gridLayout.style.display = 'grid'
      gridLayout.style.gridTemplateColumns = `${sidebarWidth}px ${contentWidth + rightMargin}px`
      gridLayout.style.overflow = 'visible'
    }

    scrollers.forEach(el => {
      el.style.width = '100%'
      el.style.overflow = 'visible'
      el.style.maxWidth = 'none'
    })

    if (tracksContent) {
      tracksContent.style.width = `${contentWidth}px`
      tracksContent.style.minWidth = `${contentWidth}px`
      // 修正 SVG 宽度
      const svgs = tracksContent.querySelectorAll('svg')
      svgs.forEach(svg => {
        svg.style.width = `${contentWidth}px`
        svg.setAttribute('width', contentWidth)
      })
    }

    // --- C. 控件修补 (Patching) ---
    // html2canvas 渲染 Select 组件会有错位，临时替换为纯文本
    const rows = document.querySelectorAll('.track-info')
    store.teamTracksInfo.forEach((info, index) => {
      const row = rows[index]
      if (!row) return

      // 对齐高度：给 Header 行加上透明边框，与右侧 Track 行保持一致
      const originalRowStyle = row.style.cssText
      styleMap.set(row, originalRowStyle)
      row.style.borderTop = '2px solid transparent'
      row.style.borderBottom = '2px solid transparent'
      row.style.boxSizing = 'border-box'

      // 替换控件
      const select = row.querySelector('.character-select')
      if (select) {
        select.style.display = 'none'
        hiddenSelects.push(select)

        const label = document.createElement('div')
        label.innerText = info.name || '未选择'
        Object.assign(label.style, {
          color: '#f0f0f0', fontSize: '16px', fontWeight: 'bold',
          height: '50px', lineHeight: '50px', paddingLeft: '10px',
          flexGrow: '1', marginTop: '15px', fontFamily: 'sans-serif'
        })
        row.appendChild(label)
        tempLabels.push(label)
      }
    })

    await new Promise(resolve => setTimeout(resolve, 400)) // 等待重排

    // --- D. 截图 (Capture) ---
    const canvas = await html2canvas(workspaceEl, {
      backgroundColor: '#282828',
      scale: 1.5, // 高清倍率
      width: totalWidth,
      height: workspaceEl.scrollHeight + 20,
      windowWidth: totalWidth,
      useCORS: true,
      logging: false
    })

    // --- E. 下载 (Download) ---
    const link = document.createElement('a')
    link.download = `Endaxis_Full_${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    ElMessage.success('高清长图导出成功！')

  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败：' + error.message)
  } finally {
    // --- F. 恢复现场 (Restore) ---
    tempLabels.forEach(el => el.remove())
    hiddenSelects.forEach(el => el.style.display = '')
    styleMap.forEach((cssText, el) => el.style.cssText = cssText)
    store.setScrollLeft(originalScrollLeft)
    loading.close()
  }
}
</script>

<template>
  <div v-if="store.isLoading" class="loading-screen">
    正在加载游戏数据...
  </div>

  <div v-if="!store.isLoading" class="app-layout">

    <aside class="action-library">
      <ActionLibrary/>
    </aside>

    <main class="timeline-main">

      <header class="timeline-header" @click="store.selectTrack(null)">
        <span class="header-title">控制区</span>

        <div class="zoom-controls">
          <span class="zoom-label">🔍 缩放</span>
          <el-slider
              v-model="store.zoomLevel"
              :min="0.2" :max="2.0" :step="0.1"
              :format-tooltip="(val) => `${Math.round(val * 100)}%`"
              size="small"
              style="width: 100px"
          />
        </div>

        <div class="header-controls">
          <button class="control-btn export-img-btn" @click="exportAsImage">📷 导出图片</button>
          <button class="control-btn save-btn" @click="store.exportProject">💾 保存项目</button>
          <button class="control-btn load-btn" @click="triggerImport">📂 读取项目</button>

          <input type="file" ref="fileInputRef" style="display: none" accept=".json" @change="onFileSelected"/>
        </div>
      </header>

      <div class="timeline-workspace">
        <div class="timeline-grid-container">
          <TimelineGrid/>
        </div>
        <div class="sp-monitor-panel">
          <SpMonitor/>
        </div>
      </div>
    </main>

    <aside class="properties-sidebar">
      <PropertiesPanel/>
    </aside>

  </div>
</template>

<style scoped>
/* 全局 Loading */
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  font-size: 20px;
  color: #f0f0f0;
}

/* === 整体布局 === */
.app-layout {
  display: grid;
  grid-template-columns: 200px 1fr 250px; /* 左 | 中 | 右 */
  grid-template-rows: 100vh;
  height: 100vh;
  overflow: hidden;
  background-color: #2c2c2c;
}

/* 左侧栏 */
.action-library {
  background-color: #333;
  border-right: 1px solid #444;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  z-index: 10;
}

/* 中间栏 */
.timeline-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #282828;
  z-index: 1;
  border-right: 1px solid #444;
}

/* 顶部 Header */
.timeline-header {
  height: 50px;
  flex-shrink: 0;
  border-bottom: 1px solid #444;
  background-color: #3a3a3a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  cursor: default;
  user-select: none;
}

.header-title {
  font-weight: bold;
  color: #aaa;
}

.header-controls {
  display: flex;
  gap: 10px;
}

.control-btn {
  padding: 5px 12px;
  border: 1px solid #555;
  background-color: #444;
  color: #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.control-btn:hover {
  background-color: #555;
  border-color: #777;
}

.control-btn:active {
  transform: translateY(1px);
}

.save-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.load-btn:hover {
  border-color: #4a90e2;
  color: #4a90e2;
}

.export-img-btn:hover {
  border-color: #e6a23c;
  color: #e6a23c;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 20px;
  background: #333;
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid #444;
}

.zoom-label {
  font-size: 12px;
  color: #aaa;
}

/* 工作区组合 */
.timeline-workspace {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.timeline-grid-container {
  flex-grow: 1;
  overflow: hidden;
  min-height: 0;
}

.sp-monitor-panel {
  height: 140px;
  flex-shrink: 0;
  border-top: 2px solid #444;
  z-index: 20;
}

/* 右侧栏 */
.properties-sidebar {
  background-color: #333;
  overflow: hidden;
  z-index: 10;
}
</style>