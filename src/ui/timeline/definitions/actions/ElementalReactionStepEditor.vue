<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
/**
 * 元素反应步骤的参数编辑器。
 *
 * 反应身份、目标和效果参数统一在这里编辑；消费反应的目标受模型约束固定为敌人。
 */
import { useI18n } from 'vue-i18n';
import {
  COMBAT_TARGETS,
  ELEMENTAL_REACTIONS,
  type CombatStepDefinition,
  type CombatTarget,
  type ElementalReaction,
} from '../../../../core/game-data/operatorDefinition';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';

type ReactionStep = CombatStepForKind<'applyElementalReaction' | 'consumeElementalReaction'>;

const props = defineProps<{ step: ReactionStep }>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();
const { t } = useI18n({ useScope: 'global' });

function setReaction(event: Event): void {
  const reaction = (event.target as HTMLSelectElement).value as ElementalReaction;
  if (!ELEMENTAL_REACTIONS.includes(reaction)) return;
  if (props.step.kind === 'applyElementalReaction') {
    emit('update', { ...props.step, parameters: { ...props.step.parameters, reaction } });
    return;
  }
  emit('update', { ...props.step, parameters: { ...props.step.parameters, reaction } });
}

function setTarget(event: Event): void {
  if (props.step.kind !== 'applyElementalReaction') return;
  const target = (event.target as HTMLSelectElement).value as CombatTarget;
  if (!COMBAT_TARGETS.includes(target)) return;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, target } });
}

function setNumber(field: 'durationSeconds' | 'effectiveness', event: Event): void {
  if (props.step.kind !== 'applyElementalReaction') return;
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, [field]: value } });
}
</script>

<template>
  <div class="step-editor__grid">
    <label>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.reaction')"
        :help="t('timeline.skillEditing.fieldHelp.reaction')"
      />
      <select :value="step.parameters.reaction" @change="setReaction">
        <option v-for="reaction in ELEMENTAL_REACTIONS" :key="reaction" :value="reaction">
          {{ t(`timeline.skillEditing.reactions.${reaction}`) }}
        </option>
      </select>
    </label>

    <label>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.target')"
        :help="t('timeline.skillEditing.fieldHelp.reactionTarget')"
      />
      <select
        v-if="step.kind === 'applyElementalReaction'"
        :value="step.parameters.target"
        @change="setTarget"
      >
        <option v-for="target in COMBAT_TARGETS" :key="target" :value="target">
          {{ t(`timeline.skillEditing.targets.${target}`) }}
        </option>
      </select>
      <em v-else>{{ t('timeline.skillEditing.targets.enemy') }}</em>
    </label>

    <label v-if="step.kind === 'applyElementalReaction'">
      <EditorFieldLabel
        :label="t('timeline.skillEditing.durationSeconds')"
        :help="t('timeline.skillEditing.fieldHelp.reactionDuration')"
      />
      <input
        type="number"
        min="0"
        step="0.01"
        :value="step.parameters.durationSeconds"
        @input="setNumber('durationSeconds', $event)"
      />
    </label>

    <label v-if="step.kind === 'applyElementalReaction'">
      <EditorFieldLabel
        :label="t('timeline.skillEditing.effectiveness')"
        :help="t('timeline.skillEditing.fieldHelp.reactionEffectiveness')"
      />
      <input
        type="number"
        min="0"
        step="0.01"
        :value="step.parameters.effectiveness"
        @input="setNumber('effectiveness', $event)"
      />
    </label>
  </div>
</template>
