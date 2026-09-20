<script setup lang="ts">
/**
 * 编辑动作中的数值来源。
 *
 * 技能步骤可用常量，也可读取当前技能实例的黑板值。调用方负责把更新后的完整操作数
 * 写回原参数；切换类型时草稿可能短暂出现空键，保存前由技能定义校验统一拦截。
 */
import { computed } from 'vue';
import type { ActionValueOperand } from '../../../../core/game-data/operatorDefinition';
import {
  projectActionValueOperandForEditor,
  replaceActionValueOperandForEditor,
  switchActionValueOperandKind,
} from '../skills/skillDefinitionEditorViewModel';

const props = defineProps<{
  value: ActionValueOperand;
  labels: {
    constant: string;
    blackboard: string;
    blackboardKey: string;
    constantValue: string;
  };
}>();

const emit = defineEmits<{ update: [value: ActionValueOperand] }>();

const projected = computed(() => projectActionValueOperandForEditor(props.value));

function setKind(event: Event): void {
  const kind = (event.target as HTMLSelectElement).value as 'constant' | 'blackboard';
  emit('update', switchActionValueOperandKind(props.value, kind));
}

function setKey(event: Event): void {
  emit(
    'update',
    replaceActionValueOperandForEditor(props.value, {
      kind: 'blackboard',
      key: (event.target as HTMLInputElement).value,
    }),
  );
}

function setConstant(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  emit(
    'update',
    replaceActionValueOperandForEditor(props.value, { kind: 'constant', constant: value }),
  );
}
</script>

<template>
  <div class="operand-editor">
    <select class="operand-editor__kind" :value="projected.kind" @change="setKind">
      <option value="constant">{{ labels.constant }}</option>
      <option value="blackboard">{{ labels.blackboard }}</option>
    </select>
    <input
      v-if="projected.kind === 'blackboard'"
      class="operand-editor__input"
      type="text"
      :value="projected.key"
      :placeholder="labels.blackboardKey"
      @input="setKey"
    />
    <input
      v-else
      class="operand-editor__input"
      type="number"
      step="0.01"
      :value="projected.constant ?? ''"
      :placeholder="labels.constantValue"
      @input="setConstant"
    />
  </div>
</template>

<style scoped>
.operand-editor {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(88px, 112px) minmax(0, 1fr);
  gap: 8px;
}

.operand-editor__kind,
.operand-editor__input {
  min-width: 0;
  width: 100%;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  border-radius: 2px;
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  padding: 0 6px;
}

.operand-editor__kind {
  font-size: 11px;
}

.operand-editor__input {
  font:
    12px/30px Consolas,
    monospace;
  text-align: center;
}
</style>
