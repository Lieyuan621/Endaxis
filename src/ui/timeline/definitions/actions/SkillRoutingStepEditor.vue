<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
/** 编辑原生玩家操作路由状态；这些字段不参与技能库分组。 */
import {
  NATIVE_SKILL_TYPES,
  type CombatStepDefinition,
} from '../../../../core/game-data/operatorDefinition';

type SkillRoutingStep = CombatStepForKind<
  | 'changeSkillSlot'
  | 'changePlayerActionMode'
  | 'changeNativeSkillType'
  | 'overrideBasicAttackMapping'
>;

const props = defineProps<{ step: SkillRoutingStep }>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();

function setString(field: string, event: Event): void {
  emit('update', {
    ...props.step,
    parameters: {
      ...props.step.parameters,
      [field]: (event.target as HTMLInputElement | HTMLSelectElement).value,
    },
  } as SkillRoutingStep);
}

function setOptionalString(field: 'revertedSkillKey', event: Event): void {
  if (props.step.kind !== 'changeSkillSlot') return;
  const value = (event.target as HTMLInputElement).value.trim();
  const parameters = { ...props.step.parameters };
  if (value === '') delete parameters[field];
  else parameters[field] = value;
  emit('update', { ...props.step, parameters });
}

function setCooldownInheritance(event: Event): void {
  if (props.step.kind !== 'changeSkillSlot') return;
  emit('update', {
    ...props.step,
    parameters: {
      ...props.step.parameters,
      inheritOriginSkillCooldownProgress: (event.target as HTMLInputElement).checked,
    },
  });
}

function setSlotLifetime(event: Event): void {
  if (props.step.kind !== 'changeSkillSlot') return;
  const value = (event.target as HTMLSelectElement).value;
  const parameters = { ...props.step.parameters };
  if (value === '') {
    delete parameters.lifetime;
    delete parameters.revertedSkillKey;
  } else {
    parameters.lifetime = value as 'infinite' | 'finishByAction';
  }
  emit('update', { ...props.step, parameters });
}
</script>

<template>
  <div class="step-editor__grid">
    <template v-if="step.kind === 'changeSkillSlot'">
      <label>
        <span>稳定技能组键</span>
        <input :value="step.parameters.skillGroupKey" @input="setString('skillGroupKey', $event)" />
      </label>
      <label>
        <span>目标技能键</span>
        <input
          :value="step.parameters.targetSkillKey"
          @input="setString('targetSkillKey', $event)"
        />
      </label>
      <label>
        <span>替换生命周期</span>
        <select :value="step.parameters.lifetime ?? ''" @change="setSlotLifetime">
          <option value="">显式持续替换</option>
          <option value="finishByAction">随原生动作结束</option>
          <option value="infinite">无限，等待显式还原</option>
        </select>
      </label>
      <label>
        <span>还原技能键</span>
        <input
          :value="step.parameters.revertedSkillKey ?? ''"
          :disabled="step.parameters.lifetime === undefined"
          @input="setOptionalString('revertedSkillKey', $event)"
        />
      </label>
      <label class="step-editor__check step-editor__check--field">
        <input
          type="checkbox"
          :checked="step.parameters.inheritOriginSkillCooldownProgress === true"
          @change="setCooldownInheritance"
        />
        <span>继承原形态冷却进度</span>
      </label>
    </template>

    <template v-else-if="step.kind === 'overrideBasicAttackMapping'">
      <label>
        <span>普攻目标原生技能 ID（随动作结束撤销）</span>
        <input :value="step.parameters.skillId" @input="setString('skillId', $event)" />
      </label>
    </template>
    <template v-else-if="step.kind === 'changePlayerActionMode'">
      <label>
        <span>原生操作模式 ID</span>
        <input :value="step.parameters.modeId" @input="setString('modeId', $event)" />
      </label>
      <label>
        <span>生命周期</span>
        <input value="随原生动作结束" readonly />
      </label>
    </template>

    <template v-else>
      <label>
        <span>目标技能键</span>
        <input
          :value="step.parameters.targetSkillKey"
          @input="setString('targetSkillKey', $event)"
        />
      </label>
      <label>
        <span>原生 SkillType</span>
        <select
          :value="step.parameters.nativeSkillType"
          @change="setString('nativeSkillType', $event)"
        >
          <option v-for="skillType in NATIVE_SKILL_TYPES" :key="skillType" :value="skillType">
            {{ skillType }}
          </option>
        </select>
      </label>
    </template>

    <p class="skill-routing-editor__note">
      这里编辑游戏原生的技能槽、操作模式与可变
      SkillType。它们决定后续操作路由，不改变技能库分组，也不改变技能等级来源。
    </p>
  </div>
</template>

<style scoped>
.skill-routing-editor__note {
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
