<script setup lang="ts">
import { computed, useAttrs } from 'vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'full';
    width?: string | number;
    busy?: boolean;
    closeOnClickModal?: boolean;
    closeOnPressEscape?: boolean;
    destroyOnClose?: boolean;
    appendToBody?: boolean;
  }>(),
  {
    title: '',
    size: 'md',
    width: undefined,
    busy: false,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    destroyOnClose: false,
    appendToBody: true,
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
const width = computed(() => {
  if (props.width !== undefined) return props.width;
  if (props.size === 'sm') return '440px';
  if (props.size === 'lg') return '900px';
  if (props.size === 'full') return 'calc(100vw - 32px)';
  return '640px';
});

function beforeClose(done: () => void) {
  if (!props.busy) done();
}
</script>

<template>
  <el-dialog
    v-bind="attrs"
    class="ea-dialog"
    :class="[`ea-dialog--${size}`, { 'ea-dialog--busy': busy }]"
    modal-class="ea-dialog-overlay"
    :model-value="modelValue"
    :title="title"
    :width="width"
    :close-on-click-modal="!busy && closeOnClickModal"
    :close-on-press-escape="!busy && closeOnPressEscape"
    :show-close="!busy"
    :destroy-on-close="destroyOnClose"
    :append-to-body="appendToBody"
    :before-close="beforeClose"
    @update:model-value="emit('update:modelValue', $event)"
    @open="emit('open')"
    @opened="emit('opened')"
    @close="emit('close')"
    @closed="emit('closed')"
  >
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </el-dialog>
</template>
