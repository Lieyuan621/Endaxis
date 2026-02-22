<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { defineAsyncComponent } from 'vue'

const TimelineEditor = defineAsyncComponent(() => import('./TimelineEditor.vue'))
const MobileTimelineViewer = defineAsyncComponent(() => import('./MobileTimelineViewer.vue'))

function detectMobileViewer() {
  if (typeof window === 'undefined') return false

  const width = Number(window.innerWidth) || 0
  const isSmall = width > 0 && width <= 768

  const coarsePointer = !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '')

  return isSmall && (isAndroid || coarsePointer)
}

const isMobileViewer = ref(false)
const activeComponent = computed(() => (isMobileViewer.value ? MobileTimelineViewer : TimelineEditor))

function refreshMode() {
  isMobileViewer.value = detectMobileViewer()
}

onMounted(() => {
  refreshMode()
  window.addEventListener('resize', refreshMode, { passive: true })
  window.addEventListener('orientationchange', refreshMode, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', refreshMode)
  window.removeEventListener('orientationchange', refreshMode)
})
</script>

<template>
  <component :is="activeComponent" />
</template>