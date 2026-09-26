<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton } from '@/design-system';

const props = defineProps<{ text: string; required: boolean; label: string }>();
const emit = defineEmits<{ change: [text: string] }>();
const { t } = useI18n();
const value = computed<number | readonly number[] | undefined>(() =>
  props.text ? JSON.parse(props.text) : undefined,
);
const mode = computed(() =>
  value.value === undefined ? 'unset' : Array.isArray(value.value) ? 'levels' : 'single',
);
const values = computed<readonly number[]>(() =>
  Array.isArray(value.value) ? value.value : [value.value ?? 0],
);
function switchMode(mode: string) {
  if (mode === 'unset') emit('change', '');
  else emit('change', JSON.stringify(mode === 'levels' ? values.value : (values.value[0] ?? 0)));
}
function update(index: number, event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.value === '' || !Number.isFinite(input.valueAsNumber)) {
    input.value = String(values.value[index]);
    return;
  }
  const next = [...values.value];
  next[index] = input.valueAsNumber;
  emit('change', JSON.stringify(mode.value === 'levels' ? next : next[0]));
}
</script>

<template>
  <div class="level-values">
    <select
      :aria-label="label"
      :value="mode"
      @change="switchMode(($event.target as HTMLSelectElement).value)"
    >
      <option v-if="!required" value="unset">{{ t('actionGraphEditor.unset') }}</option>
      <option value="single">{{ t('actionGraphEditor.singleValue') }}</option>
      <option value="levels">{{ t('actionGraphEditor.levelValues') }}</option>
    </select>
    <template v-if="mode !== 'unset'">
      <label v-for="(item, index) in values" :key="index" class="level-row">
        <span v-if="mode === 'levels'">{{
          t('actionGraphEditor.levelIndex', { index: index + 1 })
        }}</span>
        <input
          type="number"
          step="any"
          :aria-label="`${label} ${index + 1}`"
          :value="item"
          @change="update(index, $event)"
        />
        <EaButton
          v-if="mode === 'levels'"
          size="sm"
          :disabled="values.length <= 1"
          :aria-label="t('actionGraphEditor.removeValue')"
          @click="emit('change', JSON.stringify(values.filter((_, i) => i !== index)))"
          >−</EaButton
        >
      </label>
      <EaButton
        v-if="mode === 'levels'"
        size="sm"
        @click="emit('change', JSON.stringify([...values, values.at(-1) ?? 0]))"
        >{{ t('actionGraphEditor.addValue') }}</EaButton
      >
    </template>
  </div>
</template>

<style scoped>
.level-values {
  display: grid;
  gap: 6px;
}
.level-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.level-row span {
  flex: 0 0 auto;
}
.level-row input {
  flex: 1;
  min-width: 0;
}
</style>
