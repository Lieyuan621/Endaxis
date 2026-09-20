<script setup lang="ts">
import {
  createHealCondition as createCondition,
  createHealProcessor as createProcessor,
} from './buffCalculationModifierGraph';
import { ref } from 'vue';
import type {
  HealModifierCondition,
  HealModifierDefinition,
  HealModifierNumber,
  HealModifierSide,
} from '../../../../../packages/game-data-contract/src/modifiers';
import {
  COMPARISON_OPERATORS,
  type ComparisonOperator,
} from '../../../../../packages/game-data-contract/src/primitives';
import BuffDefinitionScalarEditor from './BuffDefinitionScalarEditor.vue';
import GameplayTagsEditor from '../inspector/GameplayTagsEditor.vue';

type HealProcessor = HealModifierDefinition['processors'][number];
const HEAL_SIDES = ['healer', 'receiver'] as const satisfies readonly HealModifierSide[];
const props = defineProps<{ modifiers: readonly HealModifierDefinition[] }>();
const emit = defineEmits<{ update: [modifiers: readonly HealModifierDefinition[]] }>();
const collapsed = ref(true);

function replaceModifier(index: number, modifier: HealModifierDefinition): void {
  emit(
    'update',
    props.modifiers.map((item, itemIndex) => (itemIndex === index ? modifier : item)),
  );
}
function addModifier(): void {
  emit('update', [
    ...props.modifiers,
    { enabledSide: 'healer', processors: [createProcessor('modifyCalculationResult')] },
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
  modifier: HealModifierDefinition,
  condition: HealModifierCondition | undefined,
): void {
  const next = { ...modifier };
  if (condition === undefined) delete next.condition;
  else next.condition = condition;
  replaceModifier(index, next);
}
function replaceProcessor(
  modifierIndex: number,
  modifier: HealModifierDefinition,
  processorIndex: number,
  processor: HealProcessor,
): void {
  replaceModifier(modifierIndex, {
    ...modifier,
    processors: modifier.processors.map((item, index) =>
      index === processorIndex ? processor : item,
    ),
  });
}
function addProcessor(index: number, modifier: HealModifierDefinition): void {
  replaceModifier(index, {
    ...modifier,
    processors: [...modifier.processors, createProcessor('modifyCalculationResult')],
  });
}
function removeProcessor(
  index: number,
  modifier: HealModifierDefinition,
  processorIndex: number,
): void {
  if (modifier.processors.length <= 1) return;
  replaceModifier(index, {
    ...modifier,
    processors: modifier.processors.filter((_, i) => i !== processorIndex),
  });
}
function moveProcessor(
  index: number,
  modifier: HealModifierDefinition,
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
  replaceModifier(index, { ...modifier, processors });
}
function setNumber(
  value: HealModifierNumber | undefined,
  callback: (value: HealModifierNumber) => void,
): void {
  if (value !== undefined) callback(value);
}
</script>

<template>
  <section class="heal-modifier-editor">
    <header>
      <button type="button" @click="collapsed = !collapsed">
        {{ collapsed ? '▸' : '▾' }} 治疗修正器 <span>{{ modifiers.length }}</span></button
      ><button type="button" @click="addModifier">＋</button>
    </header>
    <article
      v-for="(modifier, modifierIndex) in modifiers"
      v-show="!collapsed"
      :key="modifierIndex"
    >
      <header>
        <strong>治疗修正 {{ modifierIndex + 1 }}</strong
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
              enabledSide: ($event.target as HTMLSelectElement).value as HealModifierSide,
            })
          "
        >
          <option v-for="side in HEAL_SIDES" :key="side" :value="side">{{ side }}</option>
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
                ? createCondition('targetHealthCompare')
                : undefined,
            )
          "
        /><span>启用治疗条件</span></label
      >
      <fieldset v-if="modifier.condition" class="heal-condition">
        <legend>治疗条件</legend>
        <label
          ><span>类型</span
          ><select
            :value="modifier.condition.kind"
            @change="
              setCondition(
                modifierIndex,
                modifier,
                createCondition(
                  ($event.target as HTMLSelectElement).value as HealModifierCondition['kind'],
                ),
              )
            "
          >
            <option value="targetHealthCompare">targetHealthCompare</option>
            <option value="buffBlackboardCompare">buffBlackboardCompare</option>
            <option value="healTagsMatch">healTagsMatch</option>
          </select></label
        >
        <template v-if="modifier.condition.kind === 'targetHealthCompare'">
          <label
            ><span>数值类型</span
            ><select
              :value="modifier.condition.valueType"
              @change="
                setCondition(modifierIndex, modifier, {
                  ...modifier.condition!,
                  valueType: ($event.target as HTMLSelectElement).value as 'current' | 'ratio',
                } as HealModifierCondition)
              "
            >
              <option value="current">current</option>
              <option value="ratio">ratio</option>
            </select></label
          >
          <label
            ><span>比较</span
            ><select
              :value="modifier.condition.operator"
              @change="
                setCondition(modifierIndex, modifier, {
                  ...modifier.condition!,
                  operator: ($event.target as HTMLSelectElement).value as ComparisonOperator,
                } as HealModifierCondition)
              "
            >
              <option v-for="operator in COMPARISON_OPERATORS" :key="operator" :value="operator">
                {{ operator }}
              </option>
            </select></label
          >
          <label
            ><span>数值</span
            ><BuffDefinitionScalarEditor
              :value="modifier.condition.value"
              @update="
                setNumber($event, value =>
                  setCondition(modifierIndex, modifier, {
                    ...modifier.condition!,
                    value,
                  } as HealModifierCondition),
                )
              "
          /></label>
        </template>
        <template v-else-if="modifier.condition.kind === 'buffBlackboardCompare'">
          <label
            ><span>左值</span
            ><BuffDefinitionScalarEditor
              :value="modifier.condition.left"
              @update="
                setNumber($event, left =>
                  setCondition(modifierIndex, modifier, {
                    ...modifier.condition!,
                    left,
                  } as HealModifierCondition),
                )
              "
          /></label>
          <label
            ><span>比较</span
            ><select
              :value="modifier.condition.operator"
              @change="
                setCondition(modifierIndex, modifier, {
                  ...modifier.condition!,
                  operator: ($event.target as HTMLSelectElement).value as ComparisonOperator,
                } as HealModifierCondition)
              "
            >
              <option v-for="operator in COMPARISON_OPERATORS" :key="operator" :value="operator">
                {{ operator }}
              </option>
            </select></label
          >
          <label
            ><span>右值</span
            ><BuffDefinitionScalarEditor
              :value="modifier.condition.right"
              @update="
                setNumber($event, right =>
                  setCondition(modifierIndex, modifier, {
                    ...modifier.condition!,
                    right,
                  } as HealModifierCondition),
                )
              "
          /></label>
        </template>
        <template v-else
          ><label
            ><span>匹配方式</span
            ><select
              :value="modifier.condition.match"
              @change="
                setCondition(modifierIndex, modifier, {
                  ...modifier.condition!,
                  match: ($event.target as HTMLSelectElement).value as 'hasAny' | 'hasAll',
                } as HealModifierCondition)
              "
            >
              <option value="hasAny">hasAny</option>
              <option value="hasAll">hasAll</option>
            </select></label
          ><GameplayTagsEditor
            :tags="modifier.condition.tags"
            :minimum="0"
            @update="
              setCondition(modifierIndex, modifier, {
                ...modifier.condition!,
                tags: $event,
              } as HealModifierCondition)
            "
        /></template>
      </fieldset>
      <section class="heal-processors">
        <header>
          <strong>处理器 {{ modifier.processors.length }}</strong
          ><button type="button" @click="addProcessor(modifierIndex, modifier)">＋</button>
        </header>
        <article v-for="(processor, processorIndex) in modifier.processors" :key="processorIndex">
          <header>
            <select
              :value="processor.kind"
              @change="
                replaceProcessor(
                  modifierIndex,
                  modifier,
                  processorIndex,
                  createProcessor(
                    ($event.target as HTMLSelectElement).value as HealProcessor['kind'],
                  ),
                )
              "
            >
              <option value="modifyCalculationResult">计算结果</option>
              <option value="modifyHealingIncrease">治疗提升</option></select
            ><button
              type="button"
              :disabled="processorIndex === 0"
              @click="moveProcessor(modifierIndex, modifier, processorIndex, -1)"
            >
              ↑</button
            ><button
              type="button"
              :disabled="processorIndex === modifier.processors.length - 1"
              @click="moveProcessor(modifierIndex, modifier, processorIndex, 1)"
            >
              ↓</button
            ><button
              type="button"
              :disabled="modifier.processors.length <= 1"
              @click="removeProcessor(modifierIndex, modifier, processorIndex)"
            >
              ×
            </button>
          </header>
          <template v-if="processor.kind === 'modifyCalculationResult'"
            ><label
              ><span>基础倍率</span
              ><BuffDefinitionScalarEditor
                :value="processor.baseMultiplier"
                @update="
                  setNumber($event, baseMultiplier =>
                    replaceProcessor(modifierIndex, modifier, processorIndex, {
                      ...processor,
                      baseMultiplier,
                    }),
                  )
                " /></label
            ><label
              ><span>倍率次数</span
              ><BuffDefinitionScalarEditor
                :value="processor.multiplierCount"
                @update="
                  setNumber($event, multiplierCount =>
                    replaceProcessor(modifierIndex, modifier, processorIndex, {
                      ...processor,
                      multiplierCount,
                    }),
                  )
                " /></label
          ></template>
          <template v-else
            ><label
              ><span>作用侧</span
              ><select
                :value="processor.side"
                @change="
                  replaceProcessor(modifierIndex, modifier, processorIndex, {
                    ...processor,
                    side: ($event.target as HTMLSelectElement).value as HealModifierSide,
                  })
                "
              >
                <option v-for="side in HEAL_SIDES" :key="side" :value="side">{{ side }}</option>
              </select></label
            ><label
              ><span>增量</span
              ><BuffDefinitionScalarEditor
                :value="processor.addition"
                @update="
                  setNumber($event, addition =>
                    replaceProcessor(modifierIndex, modifier, processorIndex, {
                      ...processor,
                      addition,
                    }),
                  )
                " /></label
          ></template>
        </article>
      </section>
    </article>
  </section>
</template>

<style scoped>
.heal-modifier-editor {
  margin-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 10px;
}
.heal-modifier-editor > header,
.heal-modifier-editor article > header,
.heal-processors > header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) repeat(3, 30px);
  gap: 5px;
}
.heal-modifier-editor > header,
.heal-processors > header {
  grid-template-columns: minmax(0, 1fr) 30px;
}
.heal-modifier-editor button,
.heal-modifier-editor input,
.heal-modifier-editor select {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.heal-modifier-editor > article,
.heal-processors > article {
  display: grid;
  gap: 8px;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid var(--ea-border-soft);
}
.heal-modifier-editor label {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
.heal-modifier-editor .condition-toggle {
  display: flex;
}
.condition-toggle input {
  width: 15px;
  height: 15px;
}
.heal-condition,
.heal-processors {
  display: grid;
  gap: 8px;
  border: 1px solid var(--ea-border-soft);
}
</style>
