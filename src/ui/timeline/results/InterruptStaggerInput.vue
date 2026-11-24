<script setup lang="ts">
import { ElAutocomplete } from 'element-plus';
import { nextTick, ref, watch } from 'vue';
import type { EnemyWeaknessBreakOption } from '../../../../packages/game-data-contract/src/enemies';

const props = defineProps<{
  modelValue: number;
  label: string;
  options: (EnemyWeaknessBreakOption & { label: string })[];
}>();
const emit = defineEmits<{ change: [value: number] }>();
const input = ref<InstanceType<typeof ElAutocomplete>>();
const draft = ref<string | number>(props.modelValue);
watch(
  () => props.modelValue,
  value => {
    draft.value = value;
  },
);

function commit() {
  const value = Number(draft.value);
  draft.value = Number.isFinite(value) && value >= 0 ? value : props.modelValue;
  if (draft.value !== props.modelValue) emit('change', draft.value);
}

function select() {
  commit();
  nextTick(() => input.value?.close());
}
</script>

<template>
  <label class="interrupt-stagger-input">
    {{ label }}
    <ElAutocomplete
      ref="input"
      v-model="draft"
      class="ea-input"
      size="small"
      type="number"
      min="0"
      step="any"
      inputmode="decimal"
      :aria-label="label"
      :fetch-suggestions="options"
      value-key="stagger"
      :debounce="0"
      select-when-unmatched
      hide-loading
      placement="top-start"
      popper-class="ea-floating-surface"
      @click="input?.getData(String(draft))"
      @change="commit"
      @select="select"
    >
      <template #default="{ item }">
        <span :title="item.skillId">{{ item.label }}</span>
      </template>
    </ElAutocomplete>
  </label>
</template>

<style scoped>
.interrupt-stagger-input {
  display: inline-flex;
  align-items: center;
  gap: var(--ea-space-2);
  white-space: nowrap;
  color: var(--ea-fg-muted);
  font-size: var(--ea-control-font-size-sm);
}
.interrupt-stagger-input :deep(.el-autocomplete) {
  width: calc(5ch + 12px);
}
.interrupt-stagger-input :deep(.el-input__wrapper) {
  padding-inline: 4px;
}
.interrupt-stagger-input :deep(input[type='number']) {
  appearance: textfield;
}
.interrupt-stagger-input :deep(input::-webkit-inner-spin-button) {
  appearance: none;
}
</style>
