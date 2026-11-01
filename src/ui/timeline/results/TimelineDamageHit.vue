<script setup lang="ts">
import TimelineStatusIcon from './TimelineStatusIcon.vue';
defineProps<{ x: number; y: number; title: string; icon?: string }>();
const emit = defineEmits<{ activate: [] }>();
</script>
<template>
  <button
    type="button"
    class="enemy-damage-hit"
    :style="{ left: x + 'px', top: y + 'px' }"
    :title="title"
    :aria-label="title"
    @mousedown.stop="emit('activate')"
    @click.stop
    @dblclick.stop
    @keydown.enter.stop.prevent="emit('activate')"
    @keydown.space.stop.prevent="emit('activate')"
  >
    <TimelineStatusIcon v-if="icon" :src="icon" class="standalone-damage-icon" />
    <span class="enemy-damage-diamond" />
  </button>
</template>
<style scoped>
.enemy-damage-hit {
  appearance: none;
  position: absolute;
  z-index: 15;
  width: 12px;
  height: 12px;
  padding: 3px;
  margin: -3px;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
}
.enemy-damage-diamond {
  display: block;
  width: 6px;
  height: 6px;
  background: #fff;
  border: 1px solid #666;
  box-sizing: border-box;
  transform: rotate(45deg);
  pointer-events: none;
  transition:
    background-color 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    border-color 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    box-shadow 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.standalone-damage-icon {
  position: absolute;
  width: var(--aff-icon-size, 20px);
  height: var(--aff-icon-size, 20px);
  left: 3px;
  bottom: 6px;
}
.enemy-damage-hit:focus-visible {
  outline: none;
}
.enemy-damage-hit:focus-visible .enemy-damage-diamond {
  box-shadow: var(--ea-focus-ring);
}
@media (hover: hover) and (pointer: fine) {
  .enemy-damage-hit:hover .enemy-damage-diamond {
    background: var(--ea-gold);
    border-color: #fff;
    box-shadow: 0 0 4px color-mix(in srgb, var(--ea-gold) 80%, transparent);
    transform: rotate(45deg) scale(1.3);
  }
}
</style>
