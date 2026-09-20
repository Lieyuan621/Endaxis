<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
import type { CombatStepDefinition } from '../../../../core/game-data/operatorDefinition';
type Step = CombatStepForKind<'forEachContextTarget'>;
const props = defineProps<{ step: Step }>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();
function setMode(event: Event): void {
  const mode = (event.target as HTMLSelectElement).value;
  emit('update', {
    ...props.step,
    parameters:
      mode === 'context' ? { contextKey: 'targets' } : { target: mode as 'enemy' | 'caster' },
  });
}
</script>

<template>
  <div class="foreach-target">
    <label
      ><span>迭代来源</span
      ><select :value="step.parameters.target ?? 'context'" @change="setMode">
        <option value="context">Context 目标组快照</option>
        <option value="enemy">固定敌人</option>
        <option value="caster">固定施法者</option>
      </select></label
    >
    <label v-if="step.parameters.contextKey !== undefined"
      ><span>Context 键</span
      ><input
        type="text"
        :value="step.parameters.contextKey"
        @input="
          emit('update', {
            ...step,
            parameters: { contextKey: ($event.target as HTMLInputElement).value },
          })
        "
    /></label>
    <p>在左侧循环节点上添加动作，直接选择其下的动作编辑；每轮会设置稳定的 currentTarget。</p>
  </div>
</template>

<style scoped>
.foreach-target {
  display: grid;
  gap: 10px;
}
.foreach-target label {
  display: grid;
  grid-template-columns: minmax(140px, 180px) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}
.foreach-target input,
.foreach-target select {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.foreach-target p {
  margin: 0;
  color: var(--ea-fg-muted);
}
</style>
