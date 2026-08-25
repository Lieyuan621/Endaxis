<script setup>
import { computed, onMounted, onUnmounted, provide, ref, h } from 'vue';
import { defineAsyncComponent } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import LoadingTerminal from '@/components/LoadingTerminal.vue';
import TimelineResetDialog from '@/components/TimelineResetDialog.vue';
import { useTimelineStore } from '@/stores/timelineStore';
import { isNativeApp } from '@/platform/nativeBridge';
import { reportBootLoadFailure } from '@/utils/bootLoader';
import { shouldUseTouchLayout } from '@/utils/touchLayout';

const store = useTimelineStore();
const { t } = useI18n();
const resetDialogVisible = ref(false);
const resetDialogLockScroll = ref(true);

function openTimelineResetDialog({ lockScroll = true } = {}) {
  resetDialogLockScroll.value = lockScroll;
  resetDialogVisible.value = true;
}

function handleReset(mode) {
  if (mode === 'all') {
    store.resetProject();
    ElMessage.success(t('timeline.reset.done'));
    return;
  }

  const preserveLoadout = mode === 'currentKeepLoadout';
  store.resetCurrentScenario({ preserveLoadout });
  ElMessage.success(
    t(preserveLoadout ? 'timeline.reset.currentKeepLoadoutDone' : 'timeline.reset.currentDone'),
  );
}

provide('openTimelineResetDialog', openTimelineResetDialog);

function chunkLoadingFallback() {
  if (typeof document !== 'undefined' && document.getElementById('boot-loader')) return null;
  return h(LoadingTerminal, {
    fullScreen: true,
    scanner: true,
    message: '正在加载...',
  });
}

function loadInitialView(loader) {
  return loader().then(
    module => module,
    error => {
      reportBootLoadFailure();
      throw error;
    },
  );
}

const TimelineEditor = defineAsyncComponent({
  loader: () => loadInitialView(() => import('./TimelineEditor.vue')),
  loadingComponent: { render: chunkLoadingFallback },
  delay: 0,
});
const MobileAppShell = defineAsyncComponent({
  loader: () => loadInitialView(() => import('./MobileAppShell.vue')),
  loadingComponent: { render: chunkLoadingFallback },
  delay: 0,
});

function detectMobileViewer() {
  if (typeof window === 'undefined') return false;
  if (isNativeApp()) return true;

  const coarsePointer = !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const browserNavigator = typeof navigator === 'undefined' ? undefined : navigator;

  return shouldUseTouchLayout({
    viewportWidth: window.innerWidth,
    coarsePointer,
    userAgent: browserNavigator?.userAgent,
    platform: browserNavigator?.platform,
    maxTouchPoints: browserNavigator?.maxTouchPoints,
  });
}

const isMobileViewer = ref(detectMobileViewer());
const activeComponent = computed(() => (isMobileViewer.value ? MobileAppShell : TimelineEditor));

function refreshMode() {
  isMobileViewer.value = detectMobileViewer();
}

onMounted(() => {
  refreshMode();
  window.addEventListener('resize', refreshMode, { passive: true });
  window.addEventListener('orientationchange', refreshMode, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('resize', refreshMode);
  window.removeEventListener('orientationchange', refreshMode);
});
</script>

<template>
  <component :is="activeComponent" />
  <TimelineResetDialog
    v-model="resetDialogVisible"
    :lock-scroll="resetDialogLockScroll"
    @confirm="handleReset"
  />
</template>
