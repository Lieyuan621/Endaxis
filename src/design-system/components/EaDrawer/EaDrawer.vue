<script setup lang="ts">
import { useAttrs } from 'vue';

defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
    modelValue: boolean;
    size?: string | number;
    direction?: 'ltr' | 'rtl' | 'ttb' | 'btt';
    withHeader?: boolean;
    appendToBody?: boolean;
    lockScroll?: boolean;
    closeOnClickModal?: boolean;
    closeOnPressEscape?: boolean;
    destroyOnClose?: boolean;
  }>(),
  {
    size: '80%',
    direction: 'btt',
    withHeader: false,
    appendToBody: true,
    lockScroll: false,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    destroyOnClose: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  open: [];
  opened: [];
  close: [];
  closed: [];
}>();

const attrs = useAttrs();
</script>

<template>
  <el-drawer
    v-bind="attrs"
    class="ea-drawer"
    :model-value="modelValue"
    :direction="direction"
    :size="size"
    :with-header="withHeader"
    :append-to-body="appendToBody"
    :lock-scroll="lockScroll"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :destroy-on-close="destroyOnClose"
    @update:model-value="emit('update:modelValue', $event)"
    @open="emit('open')"
    @opened="emit('opened')"
    @close="emit('close')"
    @closed="emit('closed')"
  >
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </el-drawer>
</template>
