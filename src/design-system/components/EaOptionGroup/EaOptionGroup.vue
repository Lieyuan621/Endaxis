<script setup lang="ts">
import { ElOptionGroup } from 'element-plus';

defineOptions({ inheritAttrs: false });

defineProps<{
  label: string;
  disabled?: boolean;
}>();
</script>

<template>
  <ElOptionGroup v-bind="$attrs" :label="label" :disabled="disabled">
    <slot />
  </ElOptionGroup>
</template>
