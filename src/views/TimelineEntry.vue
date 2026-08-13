<script setup>
import { computed, onMounted, onUnmounted, ref, h } from 'vue';
import { defineAsyncComponent } from 'vue';
import LoadingTerminal from '@/components/LoadingTerminal.vue';
import { isNativeApp } from '@/platform/nativeBridge';
import { reportBootLoadFailure } from '@/utils/bootLoader';

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

  const width = Number(window.innerWidth) || 0;
  const isSmall = width > 0 && width <= 768;

  const coarsePointer = !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');

  return isSmall && (isAndroid || coarsePointer);
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
</template>
