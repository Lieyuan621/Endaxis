<script setup lang="ts">
import { ref } from 'vue';
import type { SkillBuffSlotReplacement } from '../../../../../packages/game-data-contract/src/buffs';

const props = defineProps<{
  replacements: readonly SkillBuffSlotReplacement[];
  singleEntry?: boolean;
}>();
const emit = defineEmits<{ update: [replacements: readonly SkillBuffSlotReplacement[]] }>();
const collapsed = ref(true);

function replace(index: number, replacement: SkillBuffSlotReplacement): void {
  emit(
    'update',
    props.replacements.map((item, itemIndex) => (itemIndex === index ? replacement : item)),
  );
}

function add(): void {
  emit('update', [
    ...props.replacements,
    {
      skillGroupKey: 'skill',
      targetSkillKey: '',
      revertedSkillKey: '',
      inheritOriginSkillCooldownProgress: false,
    },
  ]);
}

function remove(index: number): void {
  emit(
    'update',
    props.replacements.filter((_, itemIndex) => itemIndex !== index),
  );
}

function move(index: number, offset: -1 | 1): void {
  const target = index + offset;
  if (target < 0 || target >= props.replacements.length) return;
  const next = [...props.replacements];
  [next[index], next[target]] = [next[target]!, next[index]!];
  emit('update', next);
}

function setText(
  index: number,
  replacement: SkillBuffSlotReplacement,
  field: 'skillGroupKey' | 'targetSkillKey' | 'revertedSkillKey',
  event: Event,
): void {
  replace(index, { ...replacement, [field]: (event.target as HTMLInputElement).value });
}
</script>

<template>
  <section class="slot-replacement-editor" :class="{ 'single-entry': singleEntry }">
    <header v-if="!singleEntry">
      <button type="button" @click="collapsed = !collapsed">
        {{ collapsed ? '▸' : '▾' }} 技能槽替换 <span>{{ replacements.length }}</span>
      </button>
      <button type="button" title="添加技能槽替换" @click="add">＋</button>
    </header>
    <p v-if="!collapsed">替换由当前 Buff 实例启用，停用或结束时还原。</p>
    <article
      v-for="(replacement, index) in replacements"
      v-show="singleEntry || !collapsed"
      :key="index"
    >
      <header v-if="!singleEntry">
        <strong>槽替换 {{ index + 1 }}</strong>
        <button type="button" :disabled="index === 0" @click="move(index, -1)">↑</button>
        <button type="button" :disabled="index === replacements.length - 1" @click="move(index, 1)">
          ↓
        </button>
        <button type="button" @click="remove(index)">×</button>
      </header>
      <label
        ><span>技能组键</span
        ><input
          type="text"
          :value="replacement.skillGroupKey"
          @input="setText(index, replacement, 'skillGroupKey', $event)"
      /></label>
      <label
        ><span>换入技能键</span
        ><input
          type="text"
          :value="replacement.targetSkillKey"
          @input="setText(index, replacement, 'targetSkillKey', $event)"
      /></label>
      <label
        ><span>还原技能键</span
        ><input
          type="text"
          :value="replacement.revertedSkillKey"
          @input="setText(index, replacement, 'revertedSkillKey', $event)"
      /></label>
      <label class="cooldown-progress"
        ><input
          type="checkbox"
          :checked="replacement.inheritOriginSkillCooldownProgress"
          @change="
            replace(index, {
              ...replacement,
              inheritOriginSkillCooldownProgress: ($event.target as HTMLInputElement).checked,
            })
          "
        /><span>继承原技能冷却进度（证据位）</span></label
      >
    </article>
  </section>
</template>

<style scoped>
.slot-replacement-editor {
  margin-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 10px;
}
.slot-replacement-editor > header,
.slot-replacement-editor article > header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) repeat(3, 30px);
  gap: 5px;
}
.slot-replacement-editor > header {
  grid-template-columns: minmax(0, 1fr) 30px;
}
.slot-replacement-editor > header button:first-child {
  text-align: left;
}
.slot-replacement-editor button,
.slot-replacement-editor input {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.slot-replacement-editor > p {
  color: var(--ea-fg-muted);
  font-size: 11px;
}
.slot-replacement-editor article {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid var(--ea-border-soft);
}
.slot-replacement-editor article > header {
  grid-column: 1 / -1;
}
.slot-replacement-editor article > label {
  display: grid;
  grid-template-columns: 105px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
.slot-replacement-editor article > .cooldown-progress {
  display: flex;
}
.cooldown-progress input {
  width: 15px;
  height: 15px;
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
