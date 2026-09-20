<script setup lang="ts">
import { computed } from 'vue';
import type { DefinitionProperty } from '../definitionEditContext';
import type { SkillStructureNode } from '../skillStructureMindMapModel';
import type {
  HealModifierCondition,
  HealModifierDefinition,
  PoiseModifierCondition,
  PoiseModifierDefinition,
} from '../../../../../packages/game-data-contract/src/modifiers';
import { COMPARISON_OPERATORS } from '../../../../../packages/game-data-contract/src/primitives';
import { createHealCondition, createHealProcessor } from './buffCalculationModifierGraph';
import BuffDefinitionScalarEditor from './BuffDefinitionScalarEditor.vue';
import BuffPoiseModifierConditionEditor from './BuffPoiseModifierConditionEditor.vue';
import GameplayTagsEditor from '../inspector/GameplayTagsEditor.vue';

const props = defineProps<{ node: SkillStructureNode; property: DefinitionProperty }>();
const heal = computed(() => props.node.payloadKind?.startsWith('buffHeal'));
const modifier = computed(
  () => props.property.read() as HealModifierDefinition | PoiseModifierDefinition,
);
const condition = computed(() => props.property.read() as HealModifierCondition);
const poiseCondition = computed(() => props.property.read() as PoiseModifierCondition);
const processor = computed(
  () =>
    props.property.read() as
      HealModifierDefinition['processors'][number] | PoiseModifierDefinition['processors'][number],
);
const sides = computed(() =>
  heal.value
    ? [
        { value: 'healer', label: '治疗施加方' },
        { value: 'receiver', label: '治疗接收方' },
      ]
    : [
        { value: 'attacker', label: '伤害来源方' },
        { value: 'defender', label: '伤害目标方' },
      ],
);
function set(field: string, value: unknown) {
  props.property.child(field).update(() => value);
}
function select(field: string, event: Event) {
  set(field, (event.target as HTMLSelectElement).value);
}
function changeCondition(event: Event) {
  const kind = (event.target as HTMLSelectElement).value;
  if (kind === condition.value.kind) return;
  if (
    kind === 'targetHealthCompare' ||
    kind === 'buffBlackboardCompare' ||
    kind === 'healTagsMatch'
  )
    props.property.update(() => createHealCondition(kind));
}
function changeProcessor(event: Event) {
  const kind = (event.target as HTMLSelectElement).value;
  if (kind === processor.value.kind) return;
  if (kind === 'modifyCalculationResult' || kind === 'modifyHealingIncrease')
    props.property.update(() => createHealProcessor(kind));
}
</script>
<template>
  <div class="calculation-fields">
    <label
      v-if="node.payloadKind === 'buffHealModifier' || node.payloadKind === 'buffPoiseModifier'"
    >
      <span>启用侧</span
      ><select :value="modifier.enabledSide" @change="select('enabledSide', $event)">
        <option v-for="side in sides" :key="side.value" :value="side.value">
          {{ side.label }}
        </option>
      </select>
    </label>
    <BuffPoiseModifierConditionEditor
      v-else-if="node.payloadKind === 'buffPoiseCondition'"
      :condition="poiseCondition"
      layer-only
      @update="property.update(() => $event)"
    />
    <template v-else-if="node.payloadKind === 'buffHealCondition'">
      <label
        ><span>条件类型</span
        ><select :value="condition.kind" @change="changeCondition">
          <option value="targetHealthCompare">生命比较</option>
          <option value="buffBlackboardCompare">Buff 黑板比较</option>
          <option value="healTagsMatch">治疗标签匹配</option>
        </select></label
      >
      <p>切换类型会替换当前条件参数，可撤销。</p>
      <template v-if="condition.kind === 'healTagsMatch'">
        <label
          ><span>匹配方式</span
          ><select :value="condition.match" @change="select('match', $event)">
            <option value="hasAny">任一匹配</option>
            <option value="hasAll">全部匹配</option>
          </select></label
        >
        <label
          ><span>治疗标签</span
          ><GameplayTagsEditor :tags="condition.tags" :minimum="0" @update="set('tags', $event)"
        /></label>
      </template>
      <template v-else>
        <label v-if="condition.kind === 'targetHealthCompare'"
          ><span>数值类型</span
          ><select :value="condition.valueType" @change="select('valueType', $event)">
            <option value="current">当前生命</option>
            <option value="ratio">生命比例</option>
          </select></label
        >
        <label v-else
          ><span>左值</span
          ><BuffDefinitionScalarEditor :value="condition.left" @update="set('left', $event)"
        /></label>
        <label
          ><span>比较运算</span
          ><select :value="condition.operator" @change="select('operator', $event)">
            <option v-for="operator in COMPARISON_OPERATORS" :key="operator" :value="operator">
              {{ operator }}
            </option>
          </select></label
        >
        <label v-if="condition.kind === 'targetHealthCompare'"
          ><span>阈值</span
          ><BuffDefinitionScalarEditor :value="condition.value" @update="set('value', $event)"
        /></label>
        <label v-else
          ><span>右值</span
          ><BuffDefinitionScalarEditor :value="condition.right" @update="set('right', $event)"
        /></label>
      </template>
    </template>
    <template v-else>
      <label v-if="heal"
        ><span>处理器类型</span
        ><select :value="processor.kind" @change="changeProcessor">
          <option value="modifyCalculationResult">修改治疗计算结果</option>
          <option value="modifyHealingIncrease">修改治疗提升</option>
        </select></label
      >
      <p>
        {{ processor.timing === 'afterCalculation' ? '计算结束后处理' : '计算开始前处理'
        }}<template v-if="heal">；切换类型会替换参数，可撤销。</template>
      </p>
      <template v-if="processor.kind === 'modifyCalculationResult'">
        <label
          ><span>基础倍率</span
          ><BuffDefinitionScalarEditor
            :value="processor.baseMultiplier"
            @update="set('baseMultiplier', $event)"
        /></label>
        <label
          ><span>倍率次数</span
          ><BuffDefinitionScalarEditor
            :value="processor.multiplierCount"
            @update="set('multiplierCount', $event)"
        /></label>
      </template>
      <template v-else>
        <label
          ><span>作用侧</span
          ><select :value="processor.side" @change="select('side', $event)">
            <option v-for="side in sides" :key="side.value" :value="side.value">
              {{ side.label }}
            </option>
          </select></label
        >
        <label
          ><span>增加量</span
          ><BuffDefinitionScalarEditor
            :value="processor.addition"
            @update="set('addition', $event)"
        /></label>
      </template>
    </template>
  </div>
</template>
<style scoped>
.calculation-fields,
label {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.calculation-fields {
  gap: 14px;
}
label > span,
p {
  color: var(--ea-fg-muted);
}
p {
  margin: 0;
  font-size: 12px;
}
select {
  width: 100%;
  min-width: 0;
  height: 30px;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
}
</style>
