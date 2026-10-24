<script setup lang="ts">
import BuffStatusIcon from './BuffStatusIcon.vue';
import { showBuffLayerBadge } from './buffDisplayName';
defineProps<{
  buffs: readonly {
    buffId: string;
    icon?: string;
    tooltip: string;
    layers: number;
    maxStackCount?: number;
    displayCount?: number;
  }[];
  overflow?: number;
}>();
const emit = defineEmits<{ select: [buffId: string] }>();
</script>
<template>
  <span v-if="buffs.length" class="last-hit-buffs">
    <button
      v-for="buff in buffs"
      :key="buff.buffId"
      type="button"
      class="last-hit-buff"
      :title="buff.tooltip"
      @click.stop="emit('select', buff.buffId)"
    >
      <BuffStatusIcon
        :icon="buff.icon"
        :label="buff.tooltip"
        :count="showBuffLayerBadge(buff) ? Math.max(1, buff.layers) : undefined"
      />
    </button>
    <strong v-if="overflow" class="last-hit-buff-more">+{{ overflow }}</strong>
  </span>
</template>
<style scoped>
.last-hit-buffs {
  margin-top: 2px;
  min-height: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.last-hit-buff {
  appearance: none;
  padding: 0;
  border: 0;
  background: none;
  display: flex;
  cursor: default;
}
.last-hit-buff-more {
  color: var(--ea-fg-muted, rgb(255 255 255 / 55%));
  font: 700 10px/1 monospace;
}
</style>
