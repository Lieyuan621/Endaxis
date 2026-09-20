<script setup lang="ts">
import { ref } from 'vue';
import type { ActionBlackboardValue } from '../../../../core/game-data/operatorDefinition';

const props = defineProps<{
  blackboard: Readonly<Record<string, ActionBlackboardValue>>;
  alwaysExpanded?: boolean;
}>();
const emit = defineEmits<{
  update: [blackboard: Readonly<Record<string, ActionBlackboardValue>>];
}>();
const collapsed = ref(true);

function addEntry(): void {
  collapsed.value = false;
  let index = 1;
  while (`value${index}` in props.blackboard) index += 1;
  emit('update', { ...props.blackboard, [`value${index}`]: 0 });
}

function removeEntry(key: string): void {
  const next = { ...props.blackboard };
  delete next[key];
  emit('update', next);
}

function renameEntry(oldKey: string, event: Event): void {
  const newKey = (event.target as HTMLInputElement).value.trim();
  if (newKey === '' || (newKey !== oldKey && newKey in props.blackboard)) return;
  const next: Record<string, ActionBlackboardValue> = {};
  for (const [key, value] of Object.entries(props.blackboard))
    next[key === oldKey ? newKey : key] = value;
  emit('update', next);
}

function setKind(key: string, event: Event): void {
  const kind = (event.target as HTMLSelectElement).value;
  if (kind === (props.blackboard[key] === null ? 'null' : typeof props.blackboard[key])) return;
  if (!['number', 'string', 'null'].includes(kind)) return;
  const value: ActionBlackboardValue = kind === 'number' ? 0 : kind === 'string' ? '' : null;
  emit('update', { ...props.blackboard, [key]: value });
}

function setValue(key: string, event: Event): void {
  const previous = props.blackboard[key];
  const raw = (event.target as HTMLInputElement).value;
  const value = typeof previous === 'number' ? Number(raw) : raw;
  if (typeof value === 'number' && !Number.isFinite(value)) return;
  emit('update', { ...props.blackboard, [key]: value });
}
</script>

<template>
  <section class="buff-blackboard-editor" :class="{ 'always-expanded': alwaysExpanded }">
    <header>
      <strong v-if="alwaysExpanded"
        >初始黑板 <span>{{ Object.keys(blackboard).length }}</span></strong
      >
      <button v-else type="button" @click="collapsed = !collapsed">
        {{ collapsed ? '▸' : '▾' }} Buff 初始黑板
        <span>{{ Object.keys(blackboard).length }}</span>
      </button>
      <button type="button" title="添加黑板值" @click="addEntry">＋</button>
    </header>
    <p v-if="alwaysExpanded || !collapsed">
      每个 Buff 实例独立持有；字符串、数字和 null 不做隐式转换。
    </p>
    <div v-if="alwaysExpanded || !collapsed" class="buff-blackboard-list">
      <div v-for="(value, key) in blackboard" :key="key" class="buff-blackboard-entry">
        <input aria-label="黑板键" type="text" :value="key" @change="renameEntry(key, $event)" />
        <select
          aria-label="值类型"
          :value="value === null ? 'null' : typeof value"
          @change="setKind(key, $event)"
        >
          <option value="number">数字</option>
          <option value="string">字符串</option>
          <option value="null">null</option>
        </select>
        <input
          v-if="value !== null"
          aria-label="黑板值"
          :type="typeof value === 'number' ? 'number' : 'text'"
          :step="typeof value === 'number' ? 0.01 : undefined"
          :value="value"
          @input="setValue(key, $event)"
        />
        <span v-else class="null-value">null</span>
        <button type="button" title="删除黑板值" @click="removeEntry(key)">×</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.buff-blackboard-editor {
  margin-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 10px;
}

.buff-blackboard-editor header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.buff-blackboard-editor header button:first-child {
  flex: 1;
  text-align: left;
}

.buff-blackboard-editor button,
.buff-blackboard-editor input,
.buff-blackboard-editor select {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}

.buff-blackboard-editor p {
  margin: 8px 0;
  color: var(--ea-fg-muted);
  font-size: 11px;
}

.buff-blackboard-list {
  display: grid;
  gap: 6px;
}

.buff-blackboard-entry {
  display: grid;
  grid-template-columns: minmax(110px, 1fr) 82px minmax(100px, 1fr) 30px;
  gap: 6px;
}
.always-expanded header {
  align-items: center;
}
.always-expanded header strong {
  font-size: 12px;
}
.always-expanded header strong span {
  color: var(--ea-fg-muted);
  font-weight: normal;
}
.always-expanded .buff-blackboard-entry {
  grid-template-columns: minmax(0, 1fr) 82px 30px;
}
.always-expanded .buff-blackboard-entry > input[aria-label='黑板键'] {
  grid-column: 1 / 3;
}
.always-expanded .buff-blackboard-entry > select {
  grid-row: 2;
  grid-column: 2;
}
.always-expanded .buff-blackboard-entry > input[aria-label='黑板值'],
.always-expanded .buff-blackboard-entry > .null-value {
  grid-row: 2;
  grid-column: 1;
}
.always-expanded .buff-blackboard-entry > button {
  grid-row: 1;
  grid-column: 3;
}

.null-value {
  display: flex;
  align-items: center;
  color: var(--ea-fg-muted);
  font-family: monospace;
}
</style>
