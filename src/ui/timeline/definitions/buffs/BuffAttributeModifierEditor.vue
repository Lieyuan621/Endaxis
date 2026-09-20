<script setup lang="ts">
import { ref } from 'vue';
import {
  ATTRIBUTE_MODIFIER_SLOTS,
  type AttributeModifierSlot,
} from '../../../../../packages/game-data-contract/src/modifiers';
import type {
  BuffDuration,
  CombatBuffDefinitionAttributeModifier,
} from '../../../../../packages/game-data-contract/src/buffs';
import BuffDefinitionScalarEditor from './BuffDefinitionScalarEditor.vue';

const props = defineProps<{
  modifiers: readonly CombatBuffDefinitionAttributeModifier[];
  singleEntry?: boolean;
}>();
const emit = defineEmits<{
  update: [modifiers: readonly CombatBuffDefinitionAttributeModifier[]];
}>();
const collapsed = ref(true);

function replace(index: number, modifier: CombatBuffDefinitionAttributeModifier): void {
  emit(
    'update',
    props.modifiers.map((item, itemIndex) => (itemIndex === index ? modifier : item)),
  );
}

function add(): void {
  emit('update', [...props.modifiers, { attribute: 'Atk', slot: 'baseAddition', value: 0 }]);
}

function remove(index: number): void {
  emit(
    'update',
    props.modifiers.filter((_, itemIndex) => itemIndex !== index),
  );
}

function move(index: number, offset: -1 | 1): void {
  const target = index + offset;
  if (target < 0 || target >= props.modifiers.length) return;
  const next = [...props.modifiers];
  [next[index], next[target]] = [next[target]!, next[index]!];
  emit('update', next);
}

function setAttribute(
  index: number,
  modifier: CombatBuffDefinitionAttributeModifier,
  event: Event,
): void {
  replace(index, { ...modifier, attribute: (event.target as HTMLInputElement).value });
}

function setAttributeSelection(
  index: number,
  modifier: CombatBuffDefinitionAttributeModifier,
  event: Event,
): void {
  const kind = (event.target as HTMLSelectElement).value;
  if (kind === 'specific') {
    if (typeof modifier.attribute !== 'string') replace(index, { ...modifier, attribute: 'Atk' });
  } else if (kind === 'main' || kind === 'secondary' || kind === 'all') {
    if (typeof modifier.attribute === 'object' && modifier.attribute.kind === kind) return;
    replace(index, { ...modifier, attribute: { kind } });
  }
}

function setSlot(
  index: number,
  modifier: CombatBuffDefinitionAttributeModifier,
  event: Event,
): void {
  const slot = (event.target as HTMLSelectElement).value as AttributeModifierSlot;
  if (!ATTRIBUTE_MODIFIER_SLOTS.includes(slot)) return;
  replace(index, { ...modifier, slot });
}

function setValue(
  index: number,
  modifier: CombatBuffDefinitionAttributeModifier,
  value: BuffDuration | undefined,
): void {
  if (value === undefined) return;
  replace(index, { ...modifier, value });
}

function setTarget(
  index: number,
  modifier: CombatBuffDefinitionAttributeModifier,
  event: Event,
): void {
  const target = (event.target as HTMLSelectElement).value;
  const next = { ...modifier };
  if (target === '') delete next.target;
  else next.target = target as 'owner' | 'buffSource';
  replace(index, next);
}

function setConverted(
  index: number,
  modifier: CombatBuffDefinitionAttributeModifier,
  event: Event,
): void {
  const next = { ...modifier };
  if ((event.target as HTMLInputElement).checked) next.source = 'converted';
  else delete next.source;
  replace(index, next);
}
</script>

<template>
  <section class="buff-modifier-editor" :class="{ 'single-entry': singleEntry }">
    <header v-if="!singleEntry">
      <button type="button" @click="collapsed = !collapsed">
        {{ collapsed ? '▸' : '▾' }} 属性修正器 <span>{{ modifiers.length }}</span>
      </button>
      <button type="button" title="添加属性修正器" @click="add">＋</button>
    </header>
    <p v-if="!collapsed">属性名与八槽公式身份直接来自公共 Buff 契约。</p>
    <article
      v-for="(modifier, index) in modifiers"
      v-show="singleEntry || !collapsed"
      :key="index"
      class="buff-modifier-item"
    >
      <div v-if="!singleEntry" class="buff-modifier-item__actions">
        <strong>属性修正 {{ index + 1 }}</strong>
        <button type="button" :disabled="index === 0" @click="move(index, -1)">↑</button>
        <button type="button" :disabled="index === modifiers.length - 1" @click="move(index, 1)">
          ↓
        </button>
        <button type="button" @click="remove(index)">×</button>
      </div>
      <label>
        <span>属性选择</span>
        <select
          :value="typeof modifier.attribute === 'string' ? 'specific' : modifier.attribute.kind"
          @change="setAttributeSelection(index, modifier, $event)"
        >
          <option value="specific">指定属性</option>
          <option value="main">主属性</option>
          <option value="secondary">副属性</option>
          <option value="all">全部属性</option>
        </select>
      </label>
      <label v-if="typeof modifier.attribute === 'string'">
        <span>属性键</span>
        <input
          type="text"
          :value="modifier.attribute"
          @input="setAttribute(index, modifier, $event)"
        />
      </label>
      <label>
        <span>聚合槽位</span>
        <select :value="modifier.slot" @change="setSlot(index, modifier, $event)">
          <option v-for="slot in ATTRIBUTE_MODIFIER_SLOTS" :key="slot" :value="slot">
            {{ slot }}
          </option>
        </select>
      </label>
      <label>
        <span>数值</span>
        <BuffDefinitionScalarEditor
          :value="modifier.value"
          @update="setValue(index, modifier, $event)"
        />
      </label>
      <label>
        <span>目标</span>
        <select :value="modifier.target ?? ''" @change="setTarget(index, modifier, $event)">
          <option value="">owner（省略）</option>
          <option value="owner">owner</option>
          <option value="buffSource">buffSource</option>
        </select>
      </label>
      <label class="converted-source">
        <input
          type="checkbox"
          :checked="modifier.source === 'converted'"
          @change="setConverted(index, modifier, $event)"
        />
        <span>Converted 来源</span>
      </label>
    </article>
  </section>
</template>

<style scoped>
.buff-modifier-editor {
  margin-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 10px;
}

.buff-modifier-editor > header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.buff-modifier-editor > header button:first-child {
  flex: 1;
  text-align: left;
}

.buff-modifier-editor button,
.buff-modifier-editor input,
.buff-modifier-editor select {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}

.buff-modifier-editor > p {
  margin: 8px 0;
  color: var(--ea-fg-muted);
  font-size: 11px;
}

.buff-modifier-item {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid var(--ea-border-soft);
}

.buff-modifier-item > label {
  min-width: 0;
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.buff-modifier-item__actions {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr repeat(3, 30px);
  gap: 4px;
}

.buff-modifier-item .converted-source {
  display: flex;
}

.converted-source input {
  width: 16px;
  height: 16px;
}
.single-entry {
  margin-top: 0;
  border: 0;
  padding: 0;
}
.single-entry article {
  margin: 0;
  padding: 0;
  border: 0;
  grid-template-columns: minmax(0, 1fr);
}
.single-entry article > label {
  grid-template-columns: minmax(0, 1fr);
  gap: 5px;
}
</style>
