<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaInput, EaSelect, type EaSelectValue } from '@/design-system';

const props = defineProps<{
  text?: string;
  value?: number | readonly number[];
  required: boolean;
  label: string;
  readonly?: boolean;
}>();
const emit = defineEmits<{
  change: [text: string];
  valueChange: [value: number | readonly number[] | undefined];
}>();
const { t } = useI18n();
const value = computed<number | readonly number[] | undefined>(() =>
  props.text !== undefined ? (props.text ? JSON.parse(props.text) : undefined) : props.value,
);
const mode = ref<'unset' | 'levels' | 'single'>('unset');
const values = computed<readonly (number | undefined)[]>(() =>
  Array.isArray(value.value)
    ? value.value.length
      ? value.value
      : [undefined]
    : [value.value as number | undefined],
);
const drafts = ref<string[]>([]);
watch(
  value,
  current => {
    mode.value = current === undefined ? 'unset' : Array.isArray(current) ? 'levels' : 'single';
    drafts.value = values.value.map(value => (value === undefined ? '' : String(value)));
  },
  { immediate: true },
);
function publish(value: number | readonly number[] | undefined) {
  if (props.readonly) return;
  emit('valueChange', value);
  emit('change', value === undefined ? '' : JSON.stringify(value));
}
function switchMode(next: EaSelectValue | EaSelectValue[]) {
  if (props.readonly || (next !== 'unset' && next !== 'single' && next !== 'levels')) return;
  if (next === 'unset' && props.required) return;
  mode.value = next;
  if (next === 'unset') publish(undefined);
  else if (value.value !== undefined && values.value[0] !== undefined)
    publish(
      next === 'levels'
        ? values.value.filter((value): value is number => value !== undefined)
        : values.value[0],
    );
}
function update(index: number, raw: string) {
  if (props.readonly) return;
  drafts.value[index] = raw;
  const nextValue = Number(raw);
  if (raw.trim() === '' || !Number.isFinite(nextValue)) {
    const previous = values.value[index];
    drafts.value[index] = previous === undefined ? '' : String(previous);
    return;
  }
  const next = [...values.value];
  next[index] = nextValue;
  if (next.some(value => value === undefined)) return;
  publish(mode.value === 'levels' ? (next as number[]) : next[0]);
}
function remove(index: number) {
  publish(values.value.filter((value, i): value is number => i !== index && value !== undefined));
}
function add() {
  const last = values.value.at(-1);
  if (last !== undefined)
    publish([...values.value.filter((value): value is number => value !== undefined), last]);
}
</script>

<template>
  <div class="level-values">
    <EaSelect
      class="level-values__mode"
      :aria-label="label"
      size="sm"
      :model-value="mode"
      :disabled="readonly"
      :options="[
        ...(!required ? [{ value: 'unset', label: t('actionGraphEditor.unset') }] : []),
        { value: 'single', label: t('actionGraphEditor.singleValue') },
        { value: 'levels', label: t('actionGraphEditor.levelValues') },
      ]"
      @change="switchMode"
    />
    <template v-if="mode !== 'unset'">
      <label v-for="(item, index) in values" :key="index" class="level-row">
        <span v-if="mode === 'levels'">{{
          t('actionGraphEditor.levelIndex', { index: index + 1 })
        }}</span>
        <EaInput
          class="level-row__input"
          size="sm"
          type="number"
          step="any"
          :aria-label="`${label} ${index + 1}`"
          :model-value="drafts[index] ?? (item === undefined ? '' : String(item))"
          :disabled="readonly"
          @input="drafts[index] = $event"
          @change="update(index, $event)"
        />
        <EaButton
          v-if="mode === 'levels'"
          size="sm"
          :disabled="readonly || values.length <= 1"
          :aria-label="t('actionGraphEditor.removeValue')"
          @click="remove(index)"
          >−</EaButton
        >
      </label>
      <EaButton
        v-if="mode === 'levels'"
        size="sm"
        :disabled="readonly || values.at(-1) === undefined"
        @click="add"
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
.level-values__mode {
  width: 100%;
}
.level-row__input {
  flex: 1;
  min-width: 0;
}
</style>
