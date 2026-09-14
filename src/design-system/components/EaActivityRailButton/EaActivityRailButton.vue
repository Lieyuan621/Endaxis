<script setup lang="ts">
import { computed } from 'vue';
import EaButton from '../EaButton/EaButton.vue';

const props = withDefaults(
  defineProps<{
    side?: 'left' | 'right';
    active?: boolean;
    icon: string;
    label: string;
    iconSize?: number;
    disabled?: boolean;
  }>(),
  {
    side: 'left',
    active: false,
    iconSize: 24,
    disabled: false,
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const iconStyle = computed(() => {
  const requestedSize = Number(props.iconSize);
  const iconSize = Number.isFinite(requestedSize) && requestedSize > 0 ? requestedSize : 24;
  return { '--ea-activity-rail-icon-size': `${iconSize}px` };
});
</script>

<template>
  <EaButton
    type="button"
    variant="ghost"
    class="ea-activity-rail-button"
    :class="`ea-activity-rail-button--${side}`"
    :pressed="active"
    :disabled="disabled"
    :aria-label="label"
    :data-tooltip="label"
    @click="emit('click', $event)"
  >
    <span class="ea-activity-rail-button__icon-frame" :style="iconStyle">
      <img class="ea-activity-rail-button__icon" :src="icon" alt="" aria-hidden="true" />
    </span>
  </EaButton>
</template>
