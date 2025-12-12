<script setup>
import { onMounted } from 'vue'
import { useTimelineStore } from './stores/timelineStore.js'
import { useShareProject } from '@/composables/useShareProject.js'
import { ElMessage } from 'element-plus'

const store = useTimelineStore()
const { checkUrlForImport } = useShareProject()

onMounted(async () => {
  // 1. 先加载基础游戏数据 (gamedata.json)
  await store.fetchGameData()

  // 2. 尝试读取浏览器缓存
  const hasAutoSave = store.loadFromBrowser()
  if (hasAutoSave) {
    ElMessage.success('已恢复上次的进度')
  }

  // 3. 检查分享链接导入
  checkUrlForImport()

  // 4. 无论是否读取成功，都开启监听以进行后续的自动保存
  store.initAutoSave()
})
</script>

<template>
  <router-view />
</template>

<style>
/* 顶层样式 */
</style>