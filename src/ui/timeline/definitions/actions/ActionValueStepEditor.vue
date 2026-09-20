<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
/**
 * 动作黑板运算步骤的专用参数编辑器。
 *
 * 只处理 modifyActionValue 与 calculateActionValue。每次更新都回传完整步骤对象，
 * 并保留 parameters 中未展示的字段；操作数交给 ActionValueOperandEditor 编辑。
 */
import { useI18n } from 'vue-i18n';
import {
  ACTION_VALUE_CALCULATION_OPERATIONS,
  ACTION_VALUE_OPERATIONS,
  type ActionValueOperand,
} from '../../../../core/game-data/operatorDefinition';
import ActionValueOperandEditor from './ActionValueOperandEditor.vue';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';

type ActionValueStep = CombatStepForKind<'modifyActionValue' | 'calculateActionValue'>;

const props = defineProps<{ step: ActionValueStep; skillLevel: number }>();
const emit = defineEmits<{ update: [step: ActionValueStep] }>();
const { t } = useI18n({ useScope: 'global' });

const operandLabels = () => ({
  constant: t('timeline.skillEditing.operandConstant'),
  blackboard: t('timeline.skillEditing.operandBlackboard'),
  blackboardKey: t('timeline.skillEditing.operandBlackboardKey'),
  constantValue: t('timeline.skillEditing.operandConstantValue'),
});

function setKey(event: Event): void {
  const key = (event.target as HTMLInputElement).value;
  if (props.step.kind === 'modifyActionValue') {
    emit('update', { ...props.step, parameters: { ...props.step.parameters, key } });
  } else {
    emit('update', { ...props.step, parameters: { ...props.step.parameters, key } });
  }
}

function setOperation(event: Event): void {
  if (props.step.kind === 'modifyActionValue') {
    const operation = (event.target as HTMLSelectElement)
      .value as (typeof ACTION_VALUE_OPERATIONS)[number];
    if (!ACTION_VALUE_OPERATIONS.includes(operation)) return;
    emit('update', { ...props.step, parameters: { ...props.step.parameters, operation } });
    return;
  }
  const operation = (event.target as HTMLSelectElement)
    .value as (typeof ACTION_VALUE_CALCULATION_OPERATIONS)[number];
  if (!ACTION_VALUE_CALCULATION_OPERATIONS.includes(operation)) return;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, operation } });
}

function setValue(value: ActionValueOperand): void {
  if (props.step.kind !== 'modifyActionValue') return;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, value } });
}

function setLeft(value: ActionValueOperand): void {
  if (props.step.kind !== 'calculateActionValue') return;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, left: value } });
}

function setRight(value: ActionValueOperand): void {
  if (props.step.kind !== 'calculateActionValue') return;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, right: value } });
}
</script>

<template>
  <template v-if="step.kind === 'modifyActionValue'">
    <div class="step-editor__grid">
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.blackboardKey')"
          :help="t('timeline.skillEditing.fieldHelp.blackboardKey')"
        />
        <input type="text" :value="step.parameters.key" @input="setKey" />
      </label>
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.operation')"
          :help="t('timeline.skillEditing.fieldHelp.actionOperation')"
        />
        <select :value="step.parameters.operation" @change="setOperation">
          <option v-for="item in ACTION_VALUE_OPERATIONS" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
      </label>
    </div>
    <div class="step-editor__grid">
      <label class="step-editor__operand">
        <EditorFieldLabel
          :label="t('timeline.skillEditing.value')"
          :help="t('timeline.skillEditing.fieldHelp.actionOperand')"
        />
        <ActionValueOperandEditor
          :value="step.parameters.value"
          :labels="operandLabels()"
          @update="setValue"
        />
      </label>
    </div>
  </template>

  <template v-else-if="step.kind === 'calculateActionValue'">
    <div class="step-editor__grid">
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.blackboardKey')"
          :help="t('timeline.skillEditing.fieldHelp.blackboardKey')"
        />
        <input type="text" :value="step.parameters.key" @input="setKey" />
      </label>
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.operation')"
          :help="t('timeline.skillEditing.fieldHelp.calculationOperation')"
        />
        <select :value="step.parameters.operation" @change="setOperation">
          <option v-for="item in ACTION_VALUE_CALCULATION_OPERATIONS" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
      </label>
    </div>
    <div class="step-editor__grid">
      <label class="step-editor__operand">
        <EditorFieldLabel
          :label="t('timeline.skillEditing.operandLeft')"
          :help="t('timeline.skillEditing.fieldHelp.calculationOperand')"
        />
        <ActionValueOperandEditor
          :value="step.parameters.left"
          :labels="operandLabels()"
          @update="setLeft"
        />
      </label>
      <label class="step-editor__operand">
        <EditorFieldLabel
          :label="t('timeline.skillEditing.operandRight')"
          :help="t('timeline.skillEditing.fieldHelp.calculationOperand')"
        />
        <ActionValueOperandEditor
          :value="step.parameters.right"
          :labels="operandLabels()"
          @update="setRight"
        />
      </label>
    </div>
  </template>
</template>
