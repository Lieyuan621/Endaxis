<script setup lang="ts">
import OperatorAvatar from '../../components/OperatorAvatar.vue';

/** 只负责切换标记展示；文档选择、拖拽、右键命令由编辑器编排。 */
defineProps<{
  left: number;
  avatar?: string;
  timeLabel: string;
  title?: string;
  label?: string;
  projected?: boolean;
  warning?: boolean;
  selected?: boolean;
  dragging?: boolean;
}>();
defineEmits<{
  pointerdown: [event: PointerEvent];
  click: [event: MouseEvent];
  contextmenu: [event: MouseEvent];
}>();
</script>

<template>
  <div
    class="timeline-marker track-switch-marker"
    :class="{
      'track-switch-marker--automatic': projected,
      'track-switch-marker--warning': warning,
      selected,
      dragging,
    }"
    :style="{ left: `${left}px` }"
    :title="title"
    :aria-label="label"
    @pointerdown="$emit('pointerdown', $event)"
    @click="$emit('click', $event)"
    @contextmenu="$emit('contextmenu', $event)"
  >
    <OperatorAvatar v-if="avatar" class="track-switch-marker__avatar" :src="avatar" />
    <span class="track-switch-marker__time">{{ timeLabel }}</span>
    <i class="track-switch-marker__pointer"></i>
  </div>
</template>

<style scoped>
.timeline-marker.track-switch-marker {
  position: absolute;
  box-sizing: border-box;
  user-select: none;
  top: calc(var(--timeline-action-top, 55px) - 42px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 30;
  padding: 0;
  border: 0;
  background: transparent;
  transform: translateX(-50%);
  transition: transform 0.1s;
  cursor: grab;
}

.track-switch-marker.dragging {
  transition: none;
  cursor: grabbing;
}

.track-switch-marker--automatic {
  opacity: 0.48;
  pointer-events: none;
}

.track-switch-marker--warning {
  opacity: 1;
  pointer-events: auto;
}

.track-switch-marker--warning .track-switch-marker__avatar {
  outline: 1px solid #e05c63;
}

.track-switch-marker--automatic .track-switch-marker__avatar,
.track-switch-marker--automatic .track-switch-marker__time {
  border-style: dashed;
  box-shadow: none;
}

.track-switch-marker__avatar.operator-avatar-crop {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #d3adff;
  background: #222;
  box-shadow: 0 2px 4px rgb(0 0 0 / 50%);
}

.track-switch-marker__time {
  padding: 1px 5px;
  border: 1px solid rgb(211 173 255 / 65%);
  border-radius: 10px;
  background: rgb(24 18 30 / 92%);
  box-shadow: 0 1px 4px rgb(0 0 0 / 35%);
  color: #f0dcff;
  font-size: 9px;
  font-weight: bold;
  line-height: 1.2;
  text-shadow: 0 1px 2px rgb(0 0 0 / 80%);
  white-space: nowrap;
}

.track-switch-marker__pointer {
  width: 0;
  height: 0;
  border-top: 7px solid #d3adff;
  border-right: 5px solid transparent;
  border-left: 5px solid transparent;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 40%));
}

.timeline-marker.track-switch-marker.selected {
  outline: 0;
}

.track-switch-marker.selected .track-switch-marker__avatar {
  border-color: #fff;
  box-shadow: 0 0 8px #fff;
}

.track-switch-marker.selected .track-switch-marker__time {
  border-color: rgb(255 255 255 / 85%);
  color: #fff;
}

.track-switch-marker.selected .track-switch-marker__pointer {
  border-top-color: #fff;
}
</style>
