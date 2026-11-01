<script setup lang="ts">
import TimelineStatusIcon from './TimelineStatusIcon.vue';
defineProps<{ x: number; y: number; size: number; icon: string; title: string; badge?: number }>();
</script>
<template>
  <TimelineStatusIcon
    :size="size"
    :src="icon"
    :count="badge"
    class="effect-marker"
    :style="{ left: x + 'px', top: y + 'px' }"
    :title="title"
  />
</template>
<style scoped>
.effect-marker {
  position: absolute;
  z-index: 10;
  pointer-events: auto;
}
</style>
