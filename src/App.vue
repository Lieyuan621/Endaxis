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
  background: #1e1e1e;
}

::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>