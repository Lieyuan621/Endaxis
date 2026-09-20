<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  value: readonly string[];
  options?: readonly string[];
  optionLabelPrefix?: string;
  label: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ update: [value: readonly string[]] }>();
const { t, te } = useI18n({ useScope: 'global' });

// 列表保持原顺序和重复项；类型结构不意味着集合去重，也不意味着非空。
function replace(index: number, value: string) {
  if (props.disabled) return;
  emit(
    'update',
    props.value.map((item, i) => (i === index ? value : item)),
  );
}
function remove(index: number) {
  if (!props.disabled)
    emit(
      'update',
      props.value.filter((_, i) => i !== index),
    );
}
function append() {
  if (!props.disabled) emit('update', [...props.value, props.options?.[0] ?? '']);
}
</script>

<template>
  <div class="inspector-list">
    <div v-for="(item, index) in value" :key="index" class="inspector-list__row">
      <select
        v-if="options"
        :value="item"
        :aria-label="`${label} ${index + 1}`"
        :disabled="disabled"
        @change="replace(index, ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="!options.includes(item)" :value="item" disabled>{{ item }}</option>
        <option v-for="option in options" :key="option" :value="option">
          {{ te(`${optionLabelPrefix}${option}`) ? t(`${optionLabelPrefix}${option}`) : option }}
        </option>
      </select>
      <input
        v-else
        type="text"
        :value="item"
        :aria-label="`${label} ${index + 1}`"
        :disabled="disabled"
        @input="replace(index, ($event.target as HTMLInputElement).value)"
      />
      <button
        type="button"
        :disabled="disabled"
        :aria-label="`${t('common.delete')} ${label} ${index + 1}`"
        @click="remove(index)"
      >
        ×
      </button>
      <div v-if="$slots.actions" class="inspector-list__actions">
        <slot name="actions" :index="index" :item="item" />
      </div>
    </div>
    <slot name="add">
      <button type="button" class="inspector-list__add" :disabled="disabled" @click="append">
        ＋ {{ t('common.add') }}
      </button>
    </slot>
  </div>
</template>

<style scoped>
.inspector-list {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.inspector-list__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 30px;
  gap: 6px;
  min-width: 0;
}
.inspector-list input,
.inspector-list select,
.inspector-list button {
  min-width: 0;
  min-height: 32px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
.inspector-list__add {
  justify-self: start;
}
.inspector-list__actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
</style>
