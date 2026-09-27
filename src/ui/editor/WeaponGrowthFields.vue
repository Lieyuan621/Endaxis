<script setup lang="ts">
import { EaNumberInput } from '@/design-system';

const props = defineProps<{ values: readonly number[]; readonly: boolean }>();
const emit = defineEmits<{ change: [values: readonly number[]] }>();
const levels = [1, 20, 40, 60, 80, 90];
function change(index: number, value: number | undefined) {
  if (props.readonly || value === undefined || !Number.isFinite(value) || value < 0) return;
  const values = [...props.values];
  values[index] = value;
  emit('change', values);
}
</script>

<template>
  <div class="weapon-growth-fields">
    <label v-for="(level, index) in levels" :key="level">
      <span>Lv{{ level }}</span>
      <EaNumberInput
        :aria-label="`Lv${level}`"
        :model-value="values[index]"
        :disabled="readonly"
        :min="0"
        controls-position="right"
        @change="change(index, $event)"
      />
    </label>
  </div>
</template>

<style scoped>
.weapon-growth-fields {
  display: grid;
  gap: 10px;
}
.weapon-growth-fields label {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
</style>
