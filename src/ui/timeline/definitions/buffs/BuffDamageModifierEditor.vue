<script setup lang="ts">
import { inject, ref } from 'vue';
import { definitionStructureNavigationKey } from '../definitionStructureNavigation';
import type {
  SkillBuffDefinitionDamageModifier as CombatBuffDefinitionDamageModifier,
  CombatBuffDefinitionDamageProcessor,
} from '../../../../../packages/game-data-contract/src/buffs';
import type {
  ActionSequenceDefinition,
  CombatStepDefinition,
} from '../../../../core/game-data/operatorDefinition';
import type { EditableCombatStepKind } from '../skills/skillDefinitionEditorViewModel';
import {
  DAMAGE_MODIFIER_SIDES,
  type DamageModifierSide,
} from '../../../../../packages/game-data-contract/src/modifiers';
import BuffDamageProcessorInspector from './BuffDamageProcessorInspector.vue';
import { createBuffDamageProcessor as createProcessor } from './buffDamageProcessorEditing';
import BuffDamageModifierConditionEditor from './BuffDamageModifierConditionEditor.vue';
import ActionSequenceEditor from '../actions/ActionSequenceEditor.vue';
const navigateStructure = inject(definitionStructureNavigationKey, undefined);

const props = defineProps<{
  modifiers: readonly CombatBuffDefinitionDamageModifier[];
  skillLevel: number;
  createStep?: (kind: EditableCombatStepKind) => CombatStepDefinition;
  duplicateStep?: (step: CombatStepDefinition) => CombatStepDefinition;
}>();
const emit = defineEmits<{
  update: [modifiers: readonly CombatBuffDefinitionDamageModifier[]];
}>();
const collapsed = ref(true);

function replaceModifier(index: number, modifier: CombatBuffDefinitionDamageModifier): void {
  emit(
    'update',
    props.modifiers.map((item, i) => (i === index ? modifier : item)),
  );
}

function replaceProcessor(
  modifierIndex: number,
  modifier: CombatBuffDefinitionDamageModifier,
  processorIndex: number,
  processor: CombatBuffDefinitionDamageProcessor,
): void {
  replaceModifier(modifierIndex, {
    ...modifier,
    processors: modifier.processors.map((item, i) => (i === processorIndex ? processor : item)),
  });
}

function addModifier(): void {
  emit('update', [
    ...props.modifiers,
    { enabledSide: 'attacker', processors: [createProcessor('damageScale')] },
  ]);
}

function removeModifier(index: number): void {
  emit(
    'update',
    props.modifiers.filter((_, i) => i !== index),
  );
}

function moveModifier(index: number, offset: -1 | 1): void {
  const target = index + offset;
  if (target < 0 || target >= props.modifiers.length) return;
  const next = [...props.modifiers];
  [next[index], next[target]] = [next[target]!, next[index]!];
  emit('update', next);
}

function setEnabledSide(
  index: number,
  modifier: CombatBuffDefinitionDamageModifier,
  event: Event,
): void {
  const enabledSide = (event.target as HTMLSelectElement).value as DamageModifierSide;
  if (!DAMAGE_MODIFIER_SIDES.includes(enabledSide)) return;
  replaceModifier(index, { ...modifier, enabledSide });
}

function setConditionMode(
  index: number,
  modifier: CombatBuffDefinitionDamageModifier,
  event: Event,
): void {
  const next = { ...modifier };
  delete next.condition;
  delete next.conditionProgram;
  const mode = (event.target as HTMLSelectElement).value;
  if (mode === 'condition') next.condition = { kind: 'casterControlled' };
  else if (mode === 'program') next.conditionProgram = { steps: [] };
  replaceModifier(index, next);
}

function conditionMode(
  modifier: CombatBuffDefinitionDamageModifier,
): 'none' | 'condition' | 'program' {
  return modifier.conditionProgram !== undefined
    ? 'program'
    : modifier.condition !== undefined
      ? 'condition'
      : 'none';
}

function setConditionProgram(
  index: number,
  modifier: CombatBuffDefinitionDamageModifier,
  conditionProgram: ActionSequenceDefinition,
): void {
  replaceModifier(index, { ...modifier, condition: undefined, conditionProgram });
}

function addProcessor(index: number, modifier: CombatBuffDefinitionDamageModifier): void {
  replaceModifier(index, {
    ...modifier,
    processors: [...modifier.processors, createProcessor('damageScale')],
  });
}

function removeProcessor(
  modifierIndex: number,
  modifier: CombatBuffDefinitionDamageModifier,
  processorIndex: number,
): void {
  if (modifier.processors.length <= 1) return;
  replaceModifier(modifierIndex, {
    ...modifier,
    processors: modifier.processors.filter((_, i) => i !== processorIndex),
  });
}

function moveProcessor(
  modifierIndex: number,
  modifier: CombatBuffDefinitionDamageModifier,
  processorIndex: number,
  offset: -1 | 1,
): void {
  const target = processorIndex + offset;
  if (target < 0 || target >= modifier.processors.length) return;
  const processors = [...modifier.processors];
  [processors[processorIndex], processors[target]] = [
    processors[target]!,
    processors[processorIndex]!,
  ];
  replaceModifier(modifierIndex, { ...modifier, processors });
}
</script>

<template>
  <section class="damage-modifier-editor">
    <header>
      <button type="button" @click="collapsed = !collapsed">
        {{ collapsed ? '▸' : '▾' }} 伤害修正器 <span>{{ modifiers.length }}</span>
      </button>
      <button type="button" title="添加伤害修正器" @click="addModifier">＋</button>
    </header>
    <p v-if="!collapsed">处理器和递归条件树直接编辑公共伤害修正协议，不会转换成技能条件。</p>
    <article
      v-for="(modifier, modifierIndex) in modifiers"
      v-show="!collapsed"
      :key="modifierIndex"
      class="damage-modifier"
    >
      <header>
        <strong>伤害修正 {{ modifierIndex + 1 }}</strong>
        <button
          type="button"
          :disabled="modifierIndex === 0"
          @click="moveModifier(modifierIndex, -1)"
        >
          ↑
        </button>
        <button
          type="button"
          :disabled="modifierIndex === modifiers.length - 1"
          @click="moveModifier(modifierIndex, 1)"
        >
          ↓
        </button>
        <button type="button" @click="removeModifier(modifierIndex)">×</button>
      </header>
      <label>
        <span>启用侧</span>
        <select
          :value="modifier.enabledSide"
          @change="setEnabledSide(modifierIndex, modifier, $event)"
        >
          <option v-for="side in DAMAGE_MODIFIER_SIDES" :key="side" :value="side">
            {{ side }}
          </option>
        </select>
      </label>
      <label class="condition-toggle">
        <span>条件形式</span>
        <select
          :value="conditionMode(modifier)"
          @change="setConditionMode(modifierIndex, modifier, $event)"
        >
          <option value="none">无条件</option>
          <option value="condition">纯条件树</option>
          <option value="program">同步条件程序</option>
        </select>
      </label>
      <BuffDamageModifierConditionEditor
        v-if="modifier.condition"
        :condition="modifier.condition"
        @update="replaceModifier(modifierIndex, { ...modifier, condition: $event })"
      />
      <section v-if="modifier.conditionProgram" class="condition-program">
        <p>按顺序判断条件并计算当前 Buff 黑板；序列最终返回值决定是否应用下方处理器。</p>
        <button
          v-if="navigateStructure?.canNavigate(modifier.conditionProgram)"
          type="button"
          @click="navigateStructure?.(modifier.conditionProgram)"
        >
          在主图中编辑条件程序
        </button>
        <ActionSequenceEditor
          v-else-if="createStep && duplicateStep"
          :sequence="modifier.conditionProgram"
          :skill-level="skillLevel"
          :create-step="createStep"
          :duplicate-step="duplicateStep"
          @update="setConditionProgram(modifierIndex, modifier, $event)"
        />
      </section>
      <section class="processor-list">
        <header>
          <strong>处理器 {{ modifier.processors.length }}</strong>
          <button type="button" @click="addProcessor(modifierIndex, modifier)">＋</button>
        </header>
        <article
          v-for="(processor, processorIndex) in modifier.processors"
          :key="processorIndex"
          class="processor"
        >
          <div class="processor-heading">
            <button
              type="button"
              :disabled="processorIndex === 0"
              @click="moveProcessor(modifierIndex, modifier, processorIndex, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              :disabled="processorIndex === modifier.processors.length - 1"
              @click="moveProcessor(modifierIndex, modifier, processorIndex, 1)"
            >
              ↓
            </button>
            <button
              type="button"
              :disabled="modifier.processors.length <= 1"
              @click="removeProcessor(modifierIndex, modifier, processorIndex)"
            >
              ×
            </button>
          </div>
          <BuffDamageProcessorInspector
            :processor="processor"
            @update="replaceProcessor(modifierIndex, modifier, processorIndex, $event)"
          />
        </article>
      </section>
    </article>
  </section>
</template>

<style scoped>
.damage-modifier-editor {
  margin-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 10px;
}

.damage-modifier-editor > header,
.damage-modifier > header,
.processor-list > header,
.processor-heading {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}

.damage-modifier-editor > header button:first-child {
  flex: 1;
  text-align: left;
}

.damage-modifier-editor button,
.damage-modifier-editor input,
.damage-modifier-editor select {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}

.damage-modifier-editor > p,
.readonly-values {
  color: var(--ea-fg-muted);
  font-size: 11px;
}

.damage-modifier,
.processor {
  display: grid;
  gap: 8px;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid var(--ea-border-soft);
}

.damage-modifier > label,
.processor > label {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.damage-modifier > .condition-toggle {
  display: flex;
}

.condition-toggle input {
  width: 15px;
  height: 15px;
}

.processor-list {
  padding-left: 10px;
  border-left: 2px solid var(--ea-border-soft);
}

.processor-heading select {
  flex: 1;
}

.full-attribute-values {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 10px;
  border: 1px solid var(--ea-border-soft);
}

.full-attribute-values label {
  display: grid;
  grid-template-columns: minmax(100px, 1fr) minmax(70px, 0.7fr);
  align-items: center;
  gap: 6px;
}
</style>
