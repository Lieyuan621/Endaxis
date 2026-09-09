<script setup>
import { computed, onMounted } from 'vue';
import { useTimelineStore } from './stores/timelineStore.js';
import { useI18n } from 'vue-i18n';
import { getElementPlusLocale } from '@/i18n/elementPlusLocale';
import { markBootReady } from '@/utils/bootLoader';

const store = useTimelineStore();
const { locale } = useI18n({ useScope: 'global' });
const elementLocale = computed(() => getElementPlusLocale(locale.value));

onMounted(async () => {
  try {
    // 1. 先初始化基础游戏数据
    await store.fetchGameData();

    // 2. 尝试读取浏览器缓存
    await store.loadFromBrowser();

    // 3. 无论是否读取成功，都开启监听以进行后续的自动保存
    store.initAutoSave();
  } finally {
    markBootReady('data');
  }
});
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>
