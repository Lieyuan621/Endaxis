<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import SearchableOptionPicker from '../../components/SearchableOptionPicker.vue';
const props = defineProps<{
  label: string;
  value: string;
  localIds: readonly string[];
  commonIds: readonly string[];
}>();
const emit = defineEmits<{ update: [value: string]; reveal: [id: string] }>();
const listId = useId();
const anchor = ref<{ x: number; y: number }>();
function open(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  anchor.value = { x: rect.left, y: rect.bottom };
}
function choose(value: string) {
  emit('update', value);
  anchor.value = undefined;
}
const candidates = computed(() => [...new Set([...props.localIds, ...props.commonIds])].sort());
const local = computed(() => props.localIds.includes(props.value));
const known = computed(() => local.value || props.commonIds.includes(props.value));
</script>
<template>
  <div class="reference-field">
    <label :for="`${listId}-input`">{{ label }}</label>
    <div class="reference-input">
      <input
        :id="`${listId}-input`"
        :value="value"
        placeholder="选择或输入 Buff ID"
        @change="emit('update', ($event.target as HTMLInputElement).value)"
      /><button type="button" :aria-label="`选择${label}`" :aria-expanded="!!anchor" @click="open">
        选择…
      </button>
    </div>
    <SearchableOptionPicker
      v-if="anchor"
      :anchor="anchor"
      title="Buff"
      :options="
        candidates.map(value => ({
          value,
          label: value,
          detail: localIds.includes(value) ? '干员定义' : '公共定义',
        }))
      "
      @select="choose"
      @close="anchor = undefined"
    />
    <div class="reference-status">
      <span>{{
        !value
          ? '尚未指定引用'
          : local
            ? '干员自身的 Buff 定义'
            : known
              ? '公共 Buff 定义'
              : '当前定义库中未找到；保留此引用'
      }}</span>
      <button v-if="local" type="button" @click="emit('reveal', value)">查看定义 ›</button>
    </div>
  </div>
</template>
<style scoped>
.reference-field {
  display: grid;
  gap: 8px;
  min-width: 0;
  align-content: start;
  font-size: 12px;
}
input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 7px;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
}
.reference-status {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  align-items: center;
  color: var(--ea-text-secondary);
}
.reference-input {
  display: flex;
  gap: 8px;
  min-width: 0;
}
.reference-input > button {
  flex-shrink: 0;
  border: 1px solid var(--ea-border);
  padding: 0 8px;
}
button {
  color: var(--ea-fg);
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-size: 12px;
}
</style>
