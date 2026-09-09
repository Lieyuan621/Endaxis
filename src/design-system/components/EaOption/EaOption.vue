<script setup lang="ts">
import { ElOption } from 'element-plus';

defineOptions({ inheritAttrs: false });

defineProps<{
  value: string | number | boolean;
  label?: string | number;
  disabled?: boolean;
}>();
</script>

<template>
  <ElOption v-bind="$attrs" :value="value" :label="label" :disabled="disabled">
    <slot>{{ label }}</slot>
  </ElOption>
</template>
