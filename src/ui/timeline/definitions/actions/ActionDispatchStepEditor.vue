<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
/** 编辑会同步派发原生能力事件或请求另一技能施放的步骤。 */
import type { CombatStepDefinition } from '../../../../core/game-data/operatorDefinition';

type ActionDispatchStep = CombatStepForKind<'triggerCustomAbilityEvent' | 'castSkillDuringAction'>;

const props = defineProps<{ step: ActionDispatchStep }>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();

function setString(field: string, event: Event): void {
  emit('update', {
    ...props.step,
    parameters: {
      ...props.step.parameters,
      [field]: (event.target as HTMLInputElement | HTMLSelectElement).value,
    },
  } as ActionDispatchStep);
}

function setEventParam(event: Event): void {
  if (props.step.kind !== 'triggerCustomAbilityEvent') return;
  const eventParam = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(eventParam)) return;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, eventParam } });
}

function setEventSource(event: Event): void {
  if (props.step.kind !== 'triggerCustomAbilityEvent') return;
  const value = (event.target as HTMLSelectElement).value;
  const parameters = { ...props.step.parameters };
  if (value === '') delete parameters.source;
  else parameters.source = value as 'caster' | 'currentAbilityEntity';
  emit('update', { ...props.step, parameters });
}

function setBoolean(field: 'skipApplyCost' | 'inheritSourceSkillCastInfo', event: Event): void {
  if (props.step.kind !== 'castSkillDuringAction') return;
  emit('update', {
    ...props.step,
    parameters: {
      ...props.step.parameters,
      [field]: (event.target as HTMLInputElement).checked,
    },
  });
}
</script>

<template>
  <div class="step-editor__grid">
    <template v-if="step.kind === 'triggerCustomAbilityEvent'">
      <label>
        <span>原生事件名</span>
        <input :value="step.parameters.eventName" @input="setString('eventName', $event)" />
      </label>
      <label>
        <span>事件数值参数</span>
        <input type="number" :value="step.parameters.eventParam" @input="setEventParam" />
      </label>
      <label>
        <span>事件来源</span>
        <select :value="step.parameters.source ?? ''" @change="setEventSource">
          <option value="">施法者（默认）</option>
          <option value="caster">施法者（显式）</option>
          <option value="currentAbilityEntity">当前能力实体</option>
        </select>
      </label>
      <label>
        <span>事件目标</span>
        <input value="施法者" readonly />
      </label>
    </template>

    <template v-else>
      <label>
        <span>原生 Skill ID</span>
        <input :value="step.parameters.skillId" @input="setString('skillId', $event)" />
      </label>
      <label>
        <span>施放目标</span>
        <select :value="step.parameters.target" @change="setString('target', $event)">
          <option value="enemy">固定敌人</option>
          <option value="caster">施法者</option>
        </select>
      </label>
      <label class="step-editor__check step-editor__check--field">
        <input
          type="checkbox"
          :checked="step.parameters.skipApplyCost"
          @change="setBoolean('skipApplyCost', $event)"
        />
        <span>跳过再次扣费</span>
      </label>
      <label class="step-editor__check step-editor__check--field">
        <input
          type="checkbox"
          :checked="step.parameters.inheritSourceSkillCastInfo"
          @change="setBoolean('inheritSourceSkillCastInfo', $event)"
        />
        <span>继承当前技能释放身份</span>
      </label>
    </template>

    <p class="action-dispatch-editor__note">
      原生事件名和 Skill ID
      都是精确身份，不能用编辑器显示名称代替。技能施放请求会在当前动作栈返回后执行。
    </p>
  </div>
</template>

<style scoped>
.action-dispatch-editor__note {
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
