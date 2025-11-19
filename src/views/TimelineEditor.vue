<script setup>
import TimelineGrid from '../components/TimelineGrid.vue'
import ActionLibrary from '../components/ActionLibrary.vue'
import PropertiesPanel from '../components/PropertiesPanel.vue'
import { onMounted } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'

const store = useTimelineStore()

onMounted(() => {
  store.fetchGameData()
})
</script>

<template>
  <div v-if="store.isLoading" class="loading-screen">
    正在加载游戏数据...
  </div>

  <div v-if="!store.isLoading" class="app-layout">

    <aside class="action-library">
      <ActionLibrary />
    </aside>

    <main class="timeline-main">
      <header class="timeline-header" @click="store.selectTrack(null)">
        <span>控制区</span>
      </header>
      <div class="timeline-grid-container">
        <TimelineGrid />
      </div>
    </main>

    <aside class="properties-sidebar">
      <PropertiesPanel />
    </aside>

  </div>
</template>

<style scoped>
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  font-size: 20px;
  color: #f0f0f0;
}

/* 使用 Grid 实现三栏布局 */
.app-layout {
  display: grid;
  /* 定义三列：左(200px) - 中(剩余空间) - 右(250px) */
  grid-template-columns: 200px 1fr 250px;
  /* 定义一行：占满屏幕高度 */
  grid-template-rows: 100vh;

  height: 100vh;
  overflow: hidden;
  background-color: #2c2c2c;
}

/* 左侧边栏样式 */
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

/* 中间主区域样式 */
.timeline-main {
  display: grid;
  grid-template-rows: 50px 1fr;
  overflow: hidden;
  background-color: #282828;
  z-index: 1;
  border-right: 1px solid #444;
}

.timeline-header {
  height: 50px;
  border-bottom: 1px solid #444;
  display: flex;
  align-items: center;
  padding-left: 20px;
  background-color: #3a3a3a;
  cursor: default;
  user-select: none;
}

.timeline-grid-container {
  padding: 0;
  height: 100%;
  overflow: hidden;
}

/* 右侧属性面板容器样式 */
.properties-sidebar {
  background-color: #333;
  overflow: hidden;
  z-index: 10;
}
</style>