<script setup lang="ts">
import { ref } from 'vue';
import type {
  PoiseModifierCondition,
  PoiseModifierDefinition,
  PoiseModifierNumber,
  PoiseModifierSide,
} from '../../../../../packages/game-data-contract/src/modifiers';
import BuffDefinitionScalarEditor from './BuffDefinitionScalarEditor.vue';
import BuffPoiseModifierConditionEditor from './BuffPoiseModifierConditionEditor.vue';
import { createPoiseProcessor } from './buffCalculationModifierGraph';

const POISE_SIDES = ['attacker', 'defender'] as const satisfies readonly PoiseModifierSide[];
const props = defineProps<{ modifiers: readonly PoiseModifierDefinition[] }>();
const emit = defineEmits<{ update: [modifiers: readonly PoiseModifierDefinition[]] }>();
const collapsed = ref(true);
function replaceModifier(index: number, modifier: PoiseModifierDefinition): void {
  emit(
    'update',
    props.modifiers.map((item, itemIndex) => (itemIndex === index ? modifier : item)),
  );
}
function addModifier(): void {
  emit('update', [
    ...props.modifiers,
    {
      enabledSide: 'attacker',
      processors: [createPoiseProcessor()],
    },
  ]);
}
function removeModifier(index: number): void {
  emit(
    'update',
    props.modifiers.filter((_, itemIndex) => itemIndex !== index),
  );
}
function moveModifier(index: number, offset: -1 | 1): void {
  const target = index + offset;
  if (target < 0 || target >= props.modifiers.length) return;
  const next = [...props.modifiers];
  [next[index], next[target]] = [next[target]!, next[index]!];
  emit('update', next);
}
function setCondition(
  index: number,
  modifier: PoiseModifierDefinition,
  condition: PoiseModifierCondition | undefined,
): void {
  const next = { ...modifier };
  if (condition === undefined) delete next.condition;
  else next.condition = condition;
  replaceModifier(index, next);
}
function setNumber(
  value: PoiseModifierNumber | undefined,
  apply: (value: PoiseModifierNumber) => void,
): void {
  if (value !== undefined) apply(value);
}
</script>

<template>
  <section class="poise-editor">
    <header>
      <button type="button" @click="collapsed = !collapsed">
        {{ collapsed ? '▸' : '▾' }} 韧性修正器 <span>{{ modifiers.length }}</span></button
      ><button type="button" @click="addModifier">＋</button>
    </header>
    <article
      v-for="(modifier, modifierIndex) in modifiers"
      v-show="!collapsed"
      :key="modifierIndex"
    >
      <header>
        <strong>韧性修正 {{ modifierIndex + 1 }}</strong
        ><button
          type="button"
          :disabled="modifierIndex === 0"
          @click="moveModifier(modifierIndex, -1)"
        >
          ↑</button
        ><button
          type="button"
          :disabled="modifierIndex === modifiers.length - 1"
          @click="moveModifier(modifierIndex, 1)"
        >
          ↓</button
        ><button type="button" @click="removeModifier(modifierIndex)">×</button>
      </header>
      <label
        ><span>启用侧</span
        ><select
          :value="modifier.enabledSide"
          @change="
            replaceModifier(modifierIndex, {
              ...modifier,
              enabledSide: ($event.target as HTMLSelectElement).value as PoiseModifierSide,
            })
          "
        >
          <option v-for="side in POISE_SIDES" :key="side" :value="side">{{ side }}</option>
        </select></label
      >
      <label class="condition-toggle"
        ><input
          type="checkbox"
          :checked="modifier.condition !== undefined"
          @change="
            setCondition(
              modifierIndex,
              modifier,
              ($event.target as HTMLInputElement).checked
                ? { kind: 'casterControlled' }
                : undefined,
            )
          "
        /><span>启用韧性条件</span></label
      >
      <BuffPoiseModifierConditionEditor
        v-if="modifier.condition"
        :condition="modifier.condition"
        @update="setCondition(modifierIndex, modifier, $event)"
      />
      <fieldset>
        <legend>处理器</legend>
        <article
          v-for="(processor, processorIndex) in modifier.processors"
          :key="processorIndex"
          class="processor"
        >
          <label><span>类型</span><input value="modifyPoiseScalar" disabled /></label
          ><label><span>时机</span><input value="beforeCalculation" disabled /></label>
          <label
            ><span>作用侧</span
            ><select
              :value="processor.side"
              @change="
                replaceModifier(modifierIndex, {
                  ...modifier,
                  processors: modifier.processors.map((item, index) =>
                    index === processorIndex
                      ? {
                          ...processor,
                          side: ($event.target as HTMLSelectElement).value as PoiseModifierSide,
                        }
                      : item,
                  ),
                })
              "
            >
              <option v-for="side in POISE_SIDES" :key="side" :value="side">{{ side }}</option>
            </select></label
          >
          <label
            ><span>加算值</span
            ><BuffDefinitionScalarEditor
              :value="processor.addition"
              @update="
                setNumber($event, addition =>
                  replaceModifier(modifierIndex, {
                    ...modifier,
                    processors: modifier.processors.map((item, index) =>
                      index === processorIndex ? { ...processor, addition } : item,
                    ),
                  }),
                )
              "
          /></label>
          <button
            type="button"
            :disabled="modifier.processors.length <= 1"
            @click="
              replaceModifier(modifierIndex, {
                ...modifier,
                processors: modifier.processors.filter((_, index) => index !== processorIndex),
              })
            "
          >
            删除处理器
          </button>
        </article>
        <button
          type="button"
          @click="
            replaceModifier(modifierIndex, {
              ...modifier,
              processors: [
                ...modifier.processors,
                {
                  kind: 'modifyPoiseScalar',
                  timing: 'beforeCalculation',
                  side: 'attacker',
                  addition: 0,
                },
              ],
            })
          "
        >
          ＋ 添加处理器
        </button>
      </fieldset>
    </article>
  </section>
</template>

<style scoped>
.poise-editor {
  margin-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 10px;
}
.poise-editor > header,
.poise-editor article > header {
  display: flex;
  gap: 6px;
  align-items: center;
}
.poise-editor > header > :first-child,
.poise-editor article > header strong {
  flex: 1;
  text-align: left;
}
.poise-editor article {
  display: grid;
  gap: 8px;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid var(--ea-border-soft);
}
.poise-editor label {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
.poise-editor .condition-toggle {
  display: flex;
}
.poise-editor button,
.poise-editor input,
.poise-editor select {
  min-width: 0;
  min-height: 30px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.processor {
  display: grid;
  gap: 8px;
}
</style>
