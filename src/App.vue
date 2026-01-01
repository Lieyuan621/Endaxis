<script setup>
import { onMounted } from 'vue'
import { useTimelineStore } from './stores/timelineStore.js'
import { ElMessage } from 'element-plus'

const store = useTimelineStore()

onMounted(async () => {
  // 1. 先加载基础游戏数据 (gamedata.json)
  await store.fetchGameData()

  // 2. 尝试读取浏览器缓存
  const hasAutoSave = store.loadFromBrowser()
  if (hasAutoSave) {
    ElMessage.success('已恢复上次的进度')
  }

  // 3. 无论是否读取成功，都开启监听以进行后续的自动保存
  store.initAutoSave()
})
</script>

<template>
  <router-view/>
</template>

<style>
body,
html,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100vh;
  font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #18181c;
  color: #f0f0f0;
  overflow: hidden;
}

html.dark {
  --el-bg-color-overlay: #1e1e1e !important;
  --el-dialog-bg-color: #1e1e1e !important;
  --el-fill-color-blank: #333333 !important;
}

.el-overlay-dialog .el-dialog {
  background-color: #1e1e1e !important;
  background-image: none !important;
}

.el-dialog__header,
.el-dialog__body,
.el-dialog__footer {
  background-color: #1e1e1e !important;
}

.hidden {
  display: none !important;
}

body.is-lib-dragging .action-item-wrapper {
  pointer-events: none !important;
  opacity: 0.5 !important;
  filter: grayscale(0.5);
  transition: opacity 0.2s;
}

.action-item-wrapper.is-moving {
  opacity: 0.9 !important;
  z-index: 999 !important;
  cursor: grabbing !important;
  transition: none !important;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5) !important;
  border-color: #ffd700 !important;
  transform: scale(1);
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  border: 1px solid transparent;
  background-clip: padding-box;
  transition: background 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

::-webkit-scrollbar-thumb:active {
  background: rgba(255, 255, 255, 0.4);
}
</style>