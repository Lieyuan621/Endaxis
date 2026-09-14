<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { ElPopover } from 'element-plus';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    popperClass?: string;
  }>(),
  {
    popperClass: '',
  },
);

const attrs = useAttrs();
const mergedPopperClass = computed(() =>
  ['ea-floating-surface', 'ea-popover-popper', props.popperClass].filter(Boolean).join(' '),
);
</script>

<template>
  <ElPopover v-bind="attrs" :popper-class="mergedPopperClass">
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
  </ElPopover>
</template>
