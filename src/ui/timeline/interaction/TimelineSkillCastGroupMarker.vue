<script setup lang="ts">
/** 只画连续组的括号和选择入口，位置由成员共用的时间投影提供。 */
import { EaButton } from '../../../design-system/index';

defineProps<{
  left: number;
  width: number;
  label: string;
  selected: boolean;
}>();
defineEmits<{ select: [] }>();
</script>

<template>
  <div
    class="skill-cast-group-marker"
    :class="{ 'is-selected': selected }"
    :style="{ left: `${left}px`, width: `${Math.max(2, width)}px` }"
  >
    <EaButton
      class="group-select-hitbox"
      variant="ghost"
      size="sm"
      :title="label"
      :aria-label="label"
      @pointerdown.stop
      @click.stop="$emit('select')"
    />
  </div>
</template>

<style scoped>
.skill-cast-group-marker {
  position: absolute;
  top: calc(var(--timeline-action-top, 55px) - 4px);
  height: 8px;
  box-sizing: border-box;
  border: 1px solid var(--ea-fg-muted, #aaa);
  border-bottom: 0;
  color: var(--ea-fg-muted, #aaa);
  pointer-events: none;
  z-index: 30000;
}

.skill-cast-group-marker.is-selected {
  border-color: var(--ea-action-selected, #fff);
  color: var(--ea-action-selected, #fff);
}

.skill-cast-group-marker:hover,
.skill-cast-group-marker:focus-within {
  border-color: var(--ea-action-selected, #fff);
}

.group-select-hitbox {
  position: absolute;
  inset: 0;
  min-width: 0;
  height: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: transparent;
  pointer-events: auto;
  cursor: pointer;
}

.group-select-hitbox.ea-button:hover:not(:disabled),
.group-select-hitbox.ea-button:focus-visible {
  border: 0;
  outline: 0;
  background: transparent;
  color: transparent;
  box-shadow: none;
}
</style>
