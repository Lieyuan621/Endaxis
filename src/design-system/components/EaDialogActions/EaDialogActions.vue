<script setup lang="ts">
withDefaults(
  defineProps<{
    align?: 'start' | 'center' | 'end' | 'between';
    stackOnMobile?: boolean;
  }>(),
  {
    align: 'end',
    stackOnMobile: false,
  },
);
</script>

<template>
  <div
    class="ea-dialog-actions"
    :class="[`ea-dialog-actions--${align}`, { 'ea-dialog-actions--stack-mobile': stackOnMobile }]"
  >
    <slot />
  </div>
</template>
