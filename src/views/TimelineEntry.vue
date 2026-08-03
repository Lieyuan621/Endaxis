<script setup>
import { computed, onMounted, onUnmounted, ref, h } from 'vue';
import { defineAsyncComponent } from 'vue';
import LoadingTerminal from '@/components/LoadingTerminal.vue';

function chunkLoadingFallback() {
  return h(LoadingTerminal, {
    fullScreen: true,
    scanner: true,
    message: '正在加载...',
  });
}

const TimelineEditor = defineAsyncComponent({
  loader: () => import('./TimelineEditor.vue'),
  loadingComponent: { render: chunkLoadingFallback },
  delay: 0,
});
const MobileTimelineViewer = defineAsyncComponent({
  loader: () => import('./MobileTimelineViewer.vue'),
  loadingComponent: { render: chunkLoadingFallback },
  delay: 0,
});

function detectMobileViewer() {
  if (typeof window === 'undefined') return false;

  const width = Number(window.innerWidth) || 0;
  const isSmall = width > 0 && width <= 768;

  const coarsePointer = !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');

  return isSmall && (isAndroid || coarsePointer);
}

const isMobileViewer = ref(false);
const activeComponent = computed(() =>
  isMobileViewer.value ? MobileTimelineViewer : TimelineEditor,
);

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
