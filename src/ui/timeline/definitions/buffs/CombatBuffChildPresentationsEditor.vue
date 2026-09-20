<script setup lang="ts">
import type {
  CombatBuffChildPresentation,
  CombatBuffPresentation,
} from '../../../../../packages/game-data-contract/src/buffs';
import CombatBuffPresentationEditor from './CombatBuffPresentationEditor.vue';
import { cloneStructureValue } from '../skillStructureEditorCommands';
import type { InspectorPropertyPath } from '../inspector/inspectorProperty';

const props = defineProps<{
  children: readonly CombatBuffChildPresentation[];
  propertyPath?: InspectorPropertyPath;
}>();
const emit = defineEmits<{
  update: [children: readonly CombatBuffChildPresentation[], focus?: InspectorPropertyPath];
}>();

function replace(
  index: number,
  child: CombatBuffChildPresentation,
  field: 'buffId' | 'presentation',
): void {
  emit(
    'update',
    props.children.map((item, itemIndex) => (itemIndex === index ? child : item)),
    [index, field],
  );
}

function nextId(): string {
  let index = 1;
  const ids = new Set(props.children.map(child => child.buffId));
  while (ids.has(`child-buff-${index}`)) index += 1;
  return `child-buff-${index}`;
}

function add(): void {
  emit(
    'update',
    [...props.children, { buffId: nextId(), presentation: { visible: true } }],
    [props.children.length],
  );
}

function duplicate(index: number): void {
  const child = props.children[index];
  if (!child) return;
  const next = [...props.children];
  // 复制展示覆盖，分配独立 ID；嵌套排序参数也不能与原项共享。
  next.splice(index + 1, 0, { ...cloneStructureValue(child), buffId: nextId() });
  emit('update', next, [index + 1]);
}

function remove(index: number): void {
  emit(
    'update',
    props.children.filter((_, itemIndex) => itemIndex !== index),
    [index],
  );
}

function move(index: number, offset: -1 | 1): void {
  const target = index + offset;
  if (target < 0 || target >= props.children.length) return;
  const next = [...props.children];
  [next[index], next[target]] = [next[target]!, next[index]!];
  emit('update', next, [target]);
}

function setBuffId(index: number, child: CombatBuffChildPresentation, event: Event): void {
  const buffId = (event.target as HTMLInputElement).value.trim();
  if (
    buffId === '' ||
    props.children.some((item, itemIndex) => itemIndex !== index && item.buffId === buffId)
  )
    return;
  replace(index, { ...child, buffId }, 'buffId');
}

function setPresentation(
  index: number,
  child: CombatBuffChildPresentation,
  presentation: CombatBuffPresentation | undefined,
): void {
  replace(index, { ...child, presentation: presentation ?? {} }, 'presentation');
}
</script>

<template>
  <details class="child-presentations">
    <summary>
      子 Buff 展示身份 <span>{{ children.length }}</span>
    </summary>
    <button type="button" title="添加子 Buff 展示身份" @click="add">＋ 添加子表现</button>
    <p>每一项只覆盖指定子 Buff 的原生展示身份，不改变其战斗定义。</p>
    <article
      v-for="(child, index) in children"
      :key="`${child.buffId}:${index}`"
      :data-property-path="propertyPath && JSON.stringify([...propertyPath, index])"
    >
      <header>
        <label
          ><span>子 Buff ID</span
          ><input
            type="text"
            :value="child.buffId"
            :data-property-path="propertyPath && JSON.stringify([...propertyPath, index, 'buffId'])"
            @change="setBuffId(index, child, $event)"
        /></label>
        <button type="button" title="上移子表现" :disabled="index === 0" @click="move(index, -1)">
          ↑
        </button>
        <button
          type="button"
          title="下移子表现"
          :disabled="index === children.length - 1"
          @click="move(index, 1)"
        >
          ↓
        </button>
        <button type="button" title="复制子表现" @click="duplicate(index)">⧉</button>
        <button type="button" title="删除子表现" @click="remove(index)">×</button>
      </header>
      <CombatBuffPresentationEditor
        :data-property-path="
          propertyPath && JSON.stringify([...propertyPath, index, 'presentation'])
        "
        :title="`子展示：${child.buffId}`"
        :presentation="child.presentation"
        :initially-collapsed="false"
        required
        @update="setPresentation(index, child, $event)"
      />
    </article>
  </details>
</template>

<style scoped>
.child-presentations > summary {
  cursor: pointer;
}
.child-presentations {
  margin-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 10px;
}
.child-presentations article > header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) repeat(3, 30px);
  gap: 5px;
}
.child-presentations button,
.child-presentations input {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.child-presentations > p {
  color: var(--ea-fg-muted);
  font-size: 11px;
}
.child-presentations article {
  margin-top: 8px;
  padding: 10px;
  border: 1px solid var(--ea-border-soft);
}
.child-presentations article > header label {
  grid-column: 1 / -1;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
.child-presentations article > header button {
  width: 30px;
  justify-self: end;
}
</style>
