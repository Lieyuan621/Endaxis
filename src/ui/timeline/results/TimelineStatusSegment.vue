<script setup lang="ts">
/**
 * 时间轴状态段的统一展示框架。
 *
 * Buff、干员专属 UI 和后续其他状态只提供图形内容；边框、计数、悬停和持续条由这里统一。
 */
import TimelinePointerTooltip from './TimelinePointerTooltip.vue';
import TimelineStatusIcon from './TimelineStatusIcon.vue';
import TimelineStatusDuration from './TimelineStatusDuration.vue';
import TimelineAttachmentContinuation from './TimelineAttachmentContinuation.vue';

withDefaults(
  defineProps<{
    left: number;
    top: number;
    width: number;
    title: string;
    icon?: string;
    fallback?: string;
    durationColor?: string;
    endColor?: string;
    attachment?: boolean;
    count?: number | string | null;
    active?: boolean;
    interactive?: boolean;
    iconWidth?: number;
    iconHeight?: number;
    hideIcon?: boolean;
  }>(),
  { interactive: false, iconWidth: 18, iconHeight: 18 },
);

const emit = defineEmits<{
  activate: [];
}>();
</script>

<template>
  <span
    class="timeline-status-segment"
    :class="{
      'is-active': active,
      'is-interactive': interactive,
    }"
    :style="{
      left: `${left}px`,
      top: `${top}px`,
      '--timeline-status-icon-width': `${iconWidth}px`,
      '--timeline-status-icon-height': `${iconHeight}px`,
    }"
  >
    <TimelinePointerTooltip :text="title" v-slot="{ events }">
      <span v-on="events" class="timeline-status-segment__body" @click.stop>
        <TimelineStatusIcon
          :width="iconWidth"
          :height="iconHeight"
          :count="count"
          :src="icon"
          :fallback="fallback"
          v-if="!hideIcon"
          class="timeline-status-segment__icon"
          :class="{ 'is-clickable': interactive }"
          :role="interactive ? 'button' : undefined"
          :tabindex="interactive ? 0 : undefined"
          :aria-label="interactive ? title : undefined"
          @click.stop="interactive && emit('activate')"
          @keydown.enter.stop.prevent="interactive && emit('activate')"
          @keydown.space.stop.prevent="interactive && emit('activate')"
        >
          <template v-if="$slots.content" #default
            ><span class="timeline-status-segment__content"><slot name="content" /></span
          ></template>
        </TimelineStatusIcon>
        <TimelineAttachmentContinuation
          v-if="attachment && width > 0"
          :width="width + 2"
          :height="iconHeight"
          :color="durationColor"
          :end-color="endColor"
        />
        <TimelineStatusDuration
          v-else-if="width > 0"
          class="timeline-status-segment__duration"
          :style="{ width: `${width}px`, backgroundColor: durationColor }"
        >
        </TimelineStatusDuration>
      </span>
    </TimelinePointerTooltip>
  </span>
</template>

<style scoped>
.timeline-status-segment {
  position: absolute;
  display: flex;
  align-items: center;
  white-space: nowrap;
  pointer-events: none;
}

.timeline-status-segment__body {
  display: flex;
  align-items: center;
  outline: none;
  pointer-events: none;
}

.timeline-status-segment.is-interactive .timeline-status-segment__body {
  pointer-events: auto;
}

.timeline-status-segment__content {
  position: relative;
  width: calc(var(--timeline-status-icon-width) - 2px);
  height: calc(var(--timeline-status-icon-height) - 2px);
  display: grid;
  place-items: center;
  overflow: hidden;
}

.timeline-status-segment.is-active .timeline-status-segment__duration {
  background: color-mix(in srgb, var(--ea-gold) 55%, #555);
}

.timeline-status-segment__body:hover .timeline-status-segment__duration,
.timeline-status-segment__body:focus-within .timeline-status-segment__duration {
  filter: brightness(1.16) saturate(1.08);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 18%),
    0 2px 8px rgb(0 0 0 / 50%);
}
</style>
