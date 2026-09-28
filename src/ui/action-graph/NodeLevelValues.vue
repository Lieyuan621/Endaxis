<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaInput, EaSelect, type EaSelectValue } from '@/design-system';

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
const drafts = ref<string[]>([]);
watch(values, current => (drafts.value = current.map(String)), { immediate: true });

function switchMode(mode: EaSelectValue | EaSelectValue[]) {
  if (mode !== 'unset' && mode !== 'single' && mode !== 'levels') return;
  if (mode === 'unset') emit('change', '');
  else emit('change', JSON.stringify(mode === 'levels' ? values.value : (values.value[0] ?? 0)));
}
function update(index: number, raw: string) {
  const nextValue = Number(raw);
  if (raw.trim() === '' || !Number.isFinite(nextValue)) {
    drafts.value[index] = String(values.value[index]);
    return;
  }
  const next = [...values.value];
  next[index] = nextValue;
  emit('change', JSON.stringify(mode.value === 'levels' ? next : next[0]));
}
</script>

<template>
  <div class="level-values">
    <EaSelect
      class="level-values__mode"
      :aria-label="label"
      size="sm"
      :model-value="mode"
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
          :model-value="drafts[index] ?? String(item)"
          @input="drafts[index] = $event"
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
.level-values__mode {
  width: 100%;
}
.level-row__input {
  flex: 1;
  min-width: 0;
}
</style>
