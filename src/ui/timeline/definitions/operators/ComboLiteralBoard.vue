<script setup lang="ts">
import { EaButton } from '../../../../design-system/index';
import type { ComboSkillConditionDefinition } from '../../../../core/game-data/operatorDefinition';
const props = defineProps<{ value: ComboSkillConditionDefinition['initialValues'] }>();
const emit = defineEmits<{
  update: [value: ComboSkillConditionDefinition['initialValues'], path?: readonly string[]];
}>();
function add() {
  if (props.value === null) return;
  let n = 1;
  while (Object.hasOwn(props.value, `value${n}`)) n++;
  emit('update', { ...props.value, [`value${n}`]: 0 });
}
function rename(key: string, event: Event) {
  const name = (event.target as HTMLInputElement).value.trim();
  if (!props.value || !name || (name !== key && Object.hasOwn(props.value, name))) return;
  emit(
    'update',
    Object.fromEntries(Object.entries(props.value).map(([k, v]) => [k === key ? name : k, v])),
  );
}
function write(key: string, event: Event) {
  if (!props.value || !Object.hasOwn(props.value, key)) return;
  const raw = (event.target as HTMLInputElement).value;
  if (typeof props.value[key] === 'number' && (raw === '' || !Number.isFinite(Number(raw)))) return;
  emit(
    'update',
    {
      ...props.value,
      [key]: typeof props.value[key] === 'number' ? Number(raw) : raw,
    },
    [key],
  );
}
function remove(key: string) {
  if (props.value)
    emit('update', Object.fromEntries(Object.entries(props.value).filter(([k]) => k !== key)));
}
</script>
<template>
  <div class="literal-board" :data-property-path="JSON.stringify(['initialValues'])">
    <label class="enabled"
      ><input
        type="checkbox"
        :checked="value !== null"
        @change="emit('update', ($event.target as HTMLInputElement).checked ? {} : null)"
      />启用此常驻条件</label
    >
    <template v-if="value !== null">
      <header>
        <span>注册时的字面黑板</span><EaButton size="sm" @click="add">＋ 添加</EaButton>
      </header>
      <div v-for="(item, key) in value" :key="key" class="entry">
        <input aria-label="黑板键" :value="key" @change="rename(key, $event)" />
        <select
          aria-label="值类型"
          :value="item === null ? 'null' : typeof item"
          @change="
            emit('update', {
              ...value,
              [key]:
                ($event.target as HTMLSelectElement).value === 'null'
                  ? null
                  : ($event.target as HTMLSelectElement).value === 'number'
                    ? 0
                    : '',
            })
          "
        >
          <option value="number">数值</option>
          <option value="string">文本</option>
          <option value="null">空值</option>
        </select>
        <span class="value-cell" :data-property-path="JSON.stringify(['initialValues', key])"
          ><input
            aria-label="黑板值"
            :type="typeof item === 'number' ? 'number' : 'text'"
            step="any"
            :value="item ?? ''"
            :disabled="item === null"
            @change="write(key, $event)"
        /></span>
        <EaButton variant="danger" size="sm" icon-only title="删除黑板项" @click="remove(key)"
          >×</EaButton
        >
      </div>
      <p v-if="!Object.keys(value).length">空黑板；此条件仍启用。</p>
    </template>
    <p v-else>此常驻条件禁用；其响应序列仍可编辑。</p>
  </div>
</template>
<style scoped>
.literal-board {
  display: grid;
  gap: 10px;
  min-width: 0;
}
header,
.enabled {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
header {
  justify-content: space-between;
}
.entry {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 65px 28px;
  gap: 6px;
}
.entry > input:first-child {
  grid-column: 1 / -1;
}
input,
select {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  padding: 6px;
  background: var(--ea-fill-input);
  color: var(--ea-fg);
  border: 1px solid var(--ea-border);
}
.entry > select {
  grid-column: 2;
  grid-row: 2;
}
.entry > .value-cell {
  grid-column: 1;
  grid-row: 2;
  min-width: 0;
}
.value-cell input {
  width: 100%;
}
p {
  font-size: 12px;
  color: var(--ea-text-secondary);
}
</style>
