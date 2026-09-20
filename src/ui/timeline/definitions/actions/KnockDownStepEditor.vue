<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
import type {
  ActionValueOperand,
  CombatStepDefinition,
} from '../../../../core/game-data/operatorDefinition';
import ActionValueOperandEditor from './ActionValueOperandEditor.vue';

type KnockDownStep = CombatStepForKind<'applyKnockDown'>;
const props = defineProps<{ step: KnockDownStep }>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();
const labels = {
  constant: '常量',
  blackboard: '动作黑板',
  blackboardKey: '黑板键',
  constantValue: '常量值',
};

function setDuration(duration: ActionValueOperand): void {
  emit('update', { ...props.step, parameters: { ...props.step.parameters, duration } });
}

function setBoolean(field: 'force' | 'isExtra', event: Event): void {
  emit('update', {
    ...props.step,
    parameters: {
      ...props.step.parameters,
      [field]: (event.target as HTMLInputElement).checked,
    },
  });
}

function setTargetFilter(event: Event): void {
  const targetFilter = (event.target as HTMLSelectElement).value as 'aliveOnly' | 'skipAll';
  emit('update', { ...props.step, parameters: { ...props.step.parameters, targetFilter } });
}

function setReturnWhen(event: Event): void {
  const returnWhen = (event.target as HTMLSelectElement).value as
    'always' | 'successAndInterrupted' | 'success' | 'interrupted';
  emit('update', { ...props.step, parameters: { ...props.step.parameters, returnWhen } });
}
</script>

<template>
  <div class="step-editor__grid">
    <label>
      <span>目标</span>
      <input value="固定敌人" readonly />
    </label>
    <label>
      <span>原生目标过滤</span>
      <select :value="step.parameters.targetFilter" @change="setTargetFilter">
        <option value="aliveOnly">仅存活目标</option>
        <option value="skipAll">跳过全部目标（OnlyDead）</option>
      </select>
    </label>
    <label>
      <span>动作返回条件</span>
      <select :value="step.parameters.returnWhen" @change="setReturnWhen">
        <option value="always">总是继续</option>
        <option value="successAndInterrupted">成功且打断</option>
        <option value="success">成功</option>
        <option value="interrupted">打断</option>
      </select>
    </label>
    <label class="step-editor__check step-editor__check--field">
      <input
        type="checkbox"
        :checked="step.parameters.force"
        @change="setBoolean('force', $event)"
      />
      <span>强制倒地</span>
    </label>
    <label class="step-editor__check step-editor__check--field">
      <input
        type="checkbox"
        :checked="step.parameters.isExtra"
        @change="setBoolean('isExtra', $event)"
      />
      <span>额外物理异常</span>
    </label>
    <label class="step-editor__operand">
      <span>持续秒数</span>
      <ActionValueOperandEditor
        :value="step.parameters.duration"
        :labels="labels"
        @update="setDuration"
      />
    </label>
    <p class="knock-down-editor__note">
      木桩敌人不会主动行动，但倒地结果仍可触发公共事件和连携条件，因此保留原生过滤与返回语义。
    </p>
  </div>
</template>

<style scoped>
.knock-down-editor__note {
  grid-column: 1 / -1;
  margin: 0;
  padding: 10px 12px;
  border-left: 2px solid var(--ea-gold);
  background: color-mix(in srgb, var(--ea-gold) 7%, transparent);
  color: var(--ea-fg-muted);
  line-height: 1.6;
}
input[readonly] {
  color: var(--ea-fg-muted);
}
</style>
