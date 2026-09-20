<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
/** Buff 点燃、跨技能继承与终结技能量回复限制的本层参数编辑器。 */
import {
  BUFF_SINGLE_TARGETS,
  type BuffSingleTarget,
  type CombatStepDefinition,
} from '../../../../core/game-data/operatorDefinition';

type BuffLifecycleOperationStep = CombatStepForKind<
  'igniteBuffs' | 'inheritBuffById' | 'restrictUltimateEnergyRecovery'
>;

const props = defineProps<{ step: BuffLifecycleOperationStep }>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();

function list(value: string): string[] {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function setString(field: 'igniteType' | 'buffId', event: Event): void {
  emit('update', {
    ...props.step,
    parameters: {
      ...props.step.parameters,
      [field]: (event.target as HTMLInputElement).value,
    },
  } as BuffLifecycleOperationStep);
}

function setIgniteTarget(field: 'target' | 'source', event: Event): void {
  if (props.step.kind !== 'igniteBuffs') return;
  const value = (event.target as HTMLSelectElement).value as BuffSingleTarget | 'currentBuffSource';
  emit('update', {
    ...props.step,
    parameters: { ...props.step.parameters, [field]: value },
  });
}

function setInheritanceSkillIds(event: Event): void {
  if (props.step.kind !== 'inheritBuffById') return;
  emit('update', {
    ...props.step,
    parameters: {
      ...props.step.parameters,
      inheritToNextSkillIds: list((event.target as HTMLInputElement).value),
    },
  });
}

function setRecoveryTags(event: Event): void {
  if (props.step.kind !== 'restrictUltimateEnergyRecovery') return;
  emit('update', {
    ...props.step,
    parameters: {
      ...props.step.parameters,
      allowedRecoveryTags: list((event.target as HTMLInputElement).value),
    },
  });
}

function setBoolean(
  field: 'finishByAction' | 'finishWithNextSkillIfNotInherited' | 'clearUltimateEnergyOnEnd',
  event: Event,
): void {
  emit('update', {
    ...props.step,
    parameters: {
      ...props.step.parameters,
      [field]: (event.target as HTMLInputElement).checked,
    },
  } as BuffLifecycleOperationStep);
}
</script>

<template>
  <div class="step-editor__grid">
    <template v-if="step.kind === 'igniteBuffs'">
      <label>
        <span>点燃类型</span>
        <input :value="step.parameters.igniteType" @input="setString('igniteType', $event)" />
      </label>
      <label>
        <span>接收目标</span>
        <select :value="step.parameters.target" @change="setIgniteTarget('target', $event)">
          <option v-for="target in BUFF_SINGLE_TARGETS" :key="target" :value="target">
            {{ target }}
          </option>
        </select>
      </label>
      <label>
        <span>事件来源</span>
        <select :value="step.parameters.source" @change="setIgniteTarget('source', $event)">
          <option v-for="target in BUFF_SINGLE_TARGETS" :key="target" :value="target">
            {{ target }}
          </option>
          <option value="currentBuffSource">currentBuffSource</option>
        </select>
      </label>
    </template>

    <template v-else-if="step.kind === 'inheritBuffById'">
      <label>
        <span>继承的 Buff 身份</span>
        <input :value="step.parameters.buffId" @input="setString('buffId', $event)" />
      </label>
      <label>
        <span>允许的后续原生 Skill ID</span>
        <input
          :value="step.parameters.inheritToNextSkillIds.join(', ')"
          @input="setInheritanceSkillIds"
        />
      </label>
      <label class="step-editor__check step-editor__check--field">
        <input
          type="checkbox"
          :checked="step.parameters.finishByAction"
          @change="setBoolean('finishByAction', $event)"
        />
        <span>动作结束时停止等待继承</span>
      </label>
      <label class="step-editor__check step-editor__check--field">
        <input
          type="checkbox"
          :checked="step.parameters.finishWithNextSkillIfNotInherited"
          @change="setBoolean('finishWithNextSkillIfNotInherited', $event)"
        />
        <span>下一技能不匹配时结束 Buff</span>
      </label>
    </template>

    <template v-else>
      <label class="step-editor__operand">
        <span>允许回复的 GameplayTag</span>
        <input :value="step.parameters.allowedRecoveryTags.join(', ')" @input="setRecoveryTags" />
      </label>
      <label class="step-editor__check step-editor__check--field">
        <input
          type="checkbox"
          :checked="step.parameters.clearUltimateEnergyOnEnd"
          @change="setBoolean('clearUltimateEnergyOnEnd', $event)"
        />
        <span>限制结束时清空终结技能量</span>
      </label>
    </template>

    <p class="buff-lifecycle-operation-editor__note">
      ID 与 GameplayTag 均按原生精确身份匹配；逗号仅用于在编辑框中分隔列表，不属于实际值。
    </p>
  </div>
</template>

<style scoped>
.buff-lifecycle-operation-editor__note {
  grid-column: 1 / -1;
  margin: 0;
  padding: 10px 12px;
  border-left: 2px solid var(--ea-gold);
  background: color-mix(in srgb, var(--ea-gold) 7%, transparent);
  color: var(--ea-fg-muted);
  line-height: 1.6;
}
</style>
