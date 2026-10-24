<script setup lang="ts">
import TimelineEditor from '@/ui/timeline/TimelineEditor.vue';
import type { TimelineEditorProps, TimelineEditorEvents } from '@/ui/timeline/timelineEditorHost';
import OverlayButton from './OverlayButton.vue';

const props = defineProps<TimelineEditorProps>();
const emit = defineEmits<TimelineEditorEvents>();
</script>

<template>
  <TimelineEditor
    v-bind="props"
    @project-change="emit('projectChange', $event)"
    @initial-ready="emit('initialReady')"
  >
    <template #toolbar-actions="{ context }">
      <OverlayButton :context="context" />
    </template>
  </TimelineEditor>
</template>
