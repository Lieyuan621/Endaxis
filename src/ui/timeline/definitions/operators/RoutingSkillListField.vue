<script setup lang="ts">
import InspectorStringList from '../inspector/InspectorStringList.vue';
import SearchableOptionPicker from '../../components/SearchableOptionPicker.vue';
import { computed, ref } from 'vue';
const props = defineProps<{
  label: string;
  field: string;
  value: readonly string[] | undefined;
  optional?: boolean;
  skillKeys?: readonly string[];
}>();
const emit = defineEmits<{ update: [value: readonly string[] | undefined] }>();
const picker = ref<{ x: number; y: number; index?: number }>();
const options = computed(() =>
  [...new Set(props.skillKeys ?? [])].map(key => ({ value: key, label: key })),
);
function choose(event: MouseEvent, index?: number) {
  picker.value = { x: event.clientX, y: event.clientY, index };
}
function select(key: string) {
  const selection = picker.value;
  picker.value = undefined;
  if (!selection || !options.value.some(option => option.value === key)) return;
  const values = [...(props.value ?? [])];
  if (selection.index === undefined) values.push(key);
  else if (selection.index < values.length) values[selection.index] = key;
  else return;
  emit('update', values);
}
function move(index: number, offset: number) {
  const values = [...(props.value ?? [])];
  const target = index + offset;
  if (index < 0 || target < 0 || index >= values.length || target >= values.length) return;
  [values[index], values[target]] = [values[target]!, values[index]!];
  emit('update', values);
}
</script>
<template>
  <section class="routing-list-field" :data-property-path="JSON.stringify([field])">
    <header>
      <span>{{ label }}</span>
      <label v-if="optional"
        ><input
          type="checkbox"
          :checked="value !== undefined"
          @change="emit('update', ($event.target as HTMLInputElement).checked ? [] : undefined)"
        />显式设置</label
      >
    </header>
    <template v-if="!optional || value !== undefined">
      <InspectorStringList :label="label" :value="value ?? []" @update="emit('update', $event)">
        <template #actions="{ index }">
          <button
            type="button"
            :aria-label="`选择 ${label} ${index + 1}`"
            @click="choose($event, index)"
          >
            选择技能
          </button>
          <button
            type="button"
            :disabled="index === 0"
            :aria-label="`上移 ${label} ${index + 1}`"
            @click="move(index, -1)"
          >
            ↑
          </button>
          <button
            type="button"
            :disabled="index === (value?.length ?? 0) - 1"
            :aria-label="`下移 ${label} ${index + 1}`"
            @click="move(index, 1)"
          >
            ↓
          </button>
        </template>
        <template #add>
          <div class="add-actions">
            <button type="button" class="inspector-list__add" @click="choose($event)">
              ＋ 选择技能
            </button>
            <button type="button" @click="emit('update', [...(value ?? []), ''])">
              ＋ 手动填写
            </button>
          </div>
        </template>
      </InspectorStringList>
      <p v-if="!value?.length">空列表：未列出任何技能。</p>
    </template>
    <p v-else>未设置此字段；不等同于显式空列表。</p>
    <SearchableOptionPicker
      v-if="picker"
      :anchor="picker"
      title="技能引用"
      :options="options"
      @select="select"
      @close="picker = undefined"
    />
  </section>
</template>
<style scoped>
.routing-list-field {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.add-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
button {
  min-height: 28px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
button:disabled {
  opacity: 0.4;
}
header,
label {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  font-size: 12px;
}
header {
  justify-content: space-between;
}
label {
  color: var(--ea-text-secondary);
}
p {
  margin: 0;
  color: var(--ea-text-secondary);
  font-size: 11px;
  line-height: 1.5;
}
</style>
