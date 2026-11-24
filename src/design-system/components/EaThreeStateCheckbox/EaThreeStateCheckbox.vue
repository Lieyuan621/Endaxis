<script setup lang="ts">
import EaCloseIcon from '../EaCloseIcon/EaCloseIcon.vue';
import EaCheckbox from '../EaCheckbox/EaCheckbox.vue';

const props = defineProps<{ modelValue: boolean | null }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean | null] }>();

function cycle(_checked: boolean, event: Event) {
  const current = props.modelValue;
  const next = current === null ? true : current ? false : null;
  // 原生 checkbox 只会翻转 checked；从叉回到空框时这两个状态都应为未勾选。
  const input = event.target as HTMLInputElement;
  input.checked = next === true;
  input.indeterminate = next === null;
  emit('update:modelValue', next);
}
</script>

<template>
  <EaCheckbox
    :class="{ 'ea-checkbox--crossed': modelValue === false }"
    :model-value="modelValue === true"
    :indeterminate="modelValue === null"
    @change="cycle"
  >
    <template v-if="modelValue !== true" #mark>
      <EaCloseIcon v-if="modelValue === false" class="cross" :size="14" :stroke-width="3" />
    </template>
    <slot />
  </EaCheckbox>
</template>

<style scoped>
.cross {
  position: absolute;
  inset: 0;
  margin: auto;
  color: var(--ea-on-accent);
}
</style>
