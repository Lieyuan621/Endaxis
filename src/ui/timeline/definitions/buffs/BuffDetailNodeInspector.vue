<script setup lang="ts">
import { computed } from 'vue';
import type { DefinitionProperty } from '../definitionEditContext';
import type { SkillStructureNode } from '../skillStructureMindMapModel';
import type {
  SkillBuffDefinitionDamageModifier,
  CombatBuffDefinitionDamageProcessor,
} from '../../../../../packages/game-data-contract/src/buffs';
import type { DamageModifierCondition } from '../../../../../packages/game-data-contract/src/modifiers';
import BuffDamageModifierConditionEditor from './BuffDamageModifierConditionEditor.vue';
import BuffDamageProcessorInspector from './BuffDamageProcessorInspector.vue';
import BuffCalculationNodeInspector from './BuffCalculationNodeInspector.vue';
import BuffShieldEditor from './BuffShieldEditor.vue';

import type { BuffShieldDefinition } from '../../../../../packages/game-data-contract/src/buffs';
import BuffAttributeModifierEditor from './BuffAttributeModifierEditor.vue';
import BuffSkillSlotReplacementEditor from './BuffSkillSlotReplacementEditor.vue';
import BuffKeywordEnhancementEditor from './BuffKeywordEnhancementEditor.vue';
import type {
  CombatBuffDefinitionAttributeModifier,
  SkillBuffSlotReplacement,
  BuffKeywordEnhancementDefinition,
} from '../../../../../packages/game-data-contract/src/buffs';

const props = defineProps<{ node: SkillStructureNode; property: DefinitionProperty }>();
const modifier = computed(() => props.property.read() as SkillBuffDefinitionDamageModifier);
const processor = computed(() => props.property.read() as CombatBuffDefinitionDamageProcessor);
const condition = computed(() => props.property.read() as DamageModifierCondition);
const attribute = computed(() => props.property.read() as CombatBuffDefinitionAttributeModifier);
const replacement = computed(() => props.property.read() as SkillBuffSlotReplacement);
const enhancement = computed(() => props.property.read() as BuffKeywordEnhancementDefinition);
const shield = computed(() => props.property.read() as BuffShieldDefinition);
function updateMember(values: readonly unknown[]): void {
  if (values.length === 1) props.property.update(() => values[0]);
}
function updateShield(values: readonly BuffShieldDefinition[], field?: 'damageAbsorptions'): void {
  const shield = values[0];
  if (values.length !== 1 || !shield) return;
  if (field) {
    props.property.child(field).update(() => shield[field]);
  } else updateMember(values);
}
</script>
<template>
  <section class="damage-node-inspector">
    <header>
      <small>{{ node.kind }}</small
      ><strong>{{ node.label }}</strong>
    </header>
    <BuffCalculationNodeInspector
      v-if="node.payloadKind?.startsWith('buffHeal') || node.payloadKind?.startsWith('buffPoise')"
      :node="node"
      :property="property"
    />
    <BuffShieldEditor
      v-else-if="node.payloadKind === 'buffShield'"
      :shields="[shield]"
      :property-path="property.path"
      single-entry
      @update="updateShield"
    />

    <BuffAttributeModifierEditor
      v-else-if="node.payloadKind === 'buffAttributeModifier'"
      :modifiers="[attribute]"
      single-entry
      @update="updateMember"
    />
    <BuffSkillSlotReplacementEditor
      v-else-if="node.payloadKind === 'buffSlotReplacement'"
      :replacements="[replacement]"
      single-entry
      @update="updateMember"
    />
    <BuffKeywordEnhancementEditor
      v-else-if="node.payloadKind === 'buffKeywordEnhancement'"
      :enhancements="[enhancement]"
      single-entry
      @update="updateMember"
    />
    <label v-else-if="node.kind === '伤害修正器'">
      <span>启用侧</span>
      <select
        :value="modifier.enabledSide"
        @change="
          property.child('enabledSide').update(() => ($event.target as HTMLSelectElement).value)
        "
      >
        <option value="attacker">伤害来源方</option>
        <option value="defender">伤害目标方</option>
      </select>
    </label>
    <BuffDamageModifierConditionEditor
      v-else-if="node.kind === '伤害修正条件'"
      :condition="condition"
      layer-only
      @update="property.update(() => $event)"
    />
    <BuffDamageProcessorInspector
      v-else-if="node.kind === '伤害处理器'"
      :processor="processor"
      @update="property.update(() => $event)"
    />
    <p v-else-if="node.kind === '伤害条件程序'">
      在图上添加和编辑步骤。删除此节点可清除整个条件程序；可通过撤销恢复。
    </p>
    <p v-else-if="node.kind === '伤害修正条件槽'">
      点击图节点的＋设置条件。条件树与条件程序是两种互斥的表达方式；如需更换，请先删除原有条件节点，再添加另一种。
    </p>
    <p v-else>在图中选择具体成员，编辑它自身的参数。</p>
  </section>
</template>
<style scoped>
.damage-node-inspector {
  display: grid;
  gap: 14px;
  min-width: 0;
}
header,
label {
  display: grid;
  gap: 5px;
  min-width: 0;
}
header {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--ea-border-soft);
}
small,
label span,
p {
  color: var(--ea-fg-muted);
}
select {
  height: 30px;
  width: 100%;
  min-width: 0;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
}
</style>
