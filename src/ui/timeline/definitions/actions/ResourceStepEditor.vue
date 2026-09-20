<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
import type { GameplayTag } from '../../../../../packages/game-data-contract/src/gameplayTags';

/**
 * 资源变化步骤的专用参数编辑器。
 *
 * 只处理 changeResource 与 changeResourceByActionValue。每次更新都回传完整步骤对象，
 * 并保留 parameters 中未展示的字段；动态数值交给 ActionValueOperandEditor 编辑。
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  COMBAT_RESOURCES,
  RESOURCE_RECIPIENTS,
  SP_GAIN_KINDS,
  SP_GAIN_SOURCES,
  type ActionValueOperand,
  type CombatResource,
  type CombatStepDefinition,
  type ResourceRecipient,
  type SpGainKind,
  type SpGainSource,
} from '../../../../core/game-data/operatorDefinition';
import {
  replaceLevelValueForEditor,
  resolveLevelValueForEditor,
} from '../skills/skillDefinitionEditorViewModel';
import ActionValueOperandEditor from './ActionValueOperandEditor.vue';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';
import GameplayTagsEditor from '../inspector/GameplayTagsEditor.vue';

type ResourceStep = CombatStepForKind<'changeResource' | 'changeResourceByActionValue'>;

const props = defineProps<{ step: ResourceStep; skillLevel: number }>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();
const { t } = useI18n({ useScope: 'global' });
const recoveryTags = computed(() => {
  const id = props.step.parameters.ultimateRecoveryTag;
  return id === undefined ? [] : [id];
});

const operandLabels = () => ({
  constant: t('timeline.skillEditing.operandConstant'),
  blackboard: t('timeline.skillEditing.operandBlackboard'),
  blackboardKey: t('timeline.skillEditing.operandBlackboardKey'),
  constantValue: t('timeline.skillEditing.operandConstantValue'),
});

function isScalar(value: unknown): value is number {
  return typeof value === 'number';
}

function isActionValueOperand(value: unknown): value is ActionValueOperand {
  return typeof value === 'object' && value !== null && 'kind' in value;
}

function update(step: ResourceStep): void {
  emit('update', step);
}

function setResource(event: Event): void {
  const resource = (event.target as HTMLSelectElement).value as CombatResource;
  if (!COMBAT_RESOURCES.includes(resource)) return;
  const parameters = { ...props.step.parameters, resource };
  if (resource !== 'sp') {
    delete parameters.spGainKind;
    delete parameters.spGainSource;
  }
  if (resource !== 'ultimateEnergy') {
    delete parameters.isPercentValue;
    delete parameters.ultimateRecoveryTag;
    delete parameters.ignoreUltimateEnergyGainMultiplier;
  }
  update({ ...props.step, parameters } as ResourceStep);
}

function setRecipient(event: Event): void {
  const recipient = (event.target as HTMLSelectElement).value as ResourceRecipient;
  if (!RESOURCE_RECIPIENTS.includes(recipient)) return;
  if (props.step.kind === 'changeResource') {
    update({ ...props.step, parameters: { ...props.step.parameters, recipient } });
    return;
  }
  update({ ...props.step, parameters: { ...props.step.parameters, recipient } });
}

function setAmount(event: Event): void {
  if (props.step.kind !== 'changeResource' || !isScalar(props.step.parameters.amount)) return;
  const amount = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(amount)) return;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, amount } });
}

function setOperandAmount(value: ActionValueOperand): void {
  if (props.step.kind !== 'changeResourceByActionValue') return;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, amount: value } });
}

function setCoefficient(event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  const parameters = { ...props.step.parameters };
  if (raw === '') delete parameters.coefficient;
  else {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    const current = props.step.parameters.coefficient;
    parameters.coefficient = replaceLevelValueForEditor(
      current === undefined || isActionValueOperand(current) ? 1 : current,
      props.skillLevel,
      value,
    );
  }
  update({ ...props.step, parameters } as ResourceStep);
}

function setCoefficientOperand(value: ActionValueOperand): void {
  if (props.step.kind !== 'changeResourceByActionValue') return;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, coefficient: value } });
}

function coefficientAtCurrentLevel(): number | undefined {
  return props.step.parameters.coefficient === undefined ||
    isActionValueOperand(props.step.parameters.coefficient)
    ? undefined
    : resolveLevelValueForEditor(props.step.parameters.coefficient, props.skillLevel);
}

function setSpGainKind(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  const parameters = { ...props.step.parameters };
  if (value === '') delete parameters.spGainKind;
  else if (SP_GAIN_KINDS.includes(value as SpGainKind)) parameters.spGainKind = value as SpGainKind;
  update({ ...props.step, parameters } as ResourceStep);
}

function setSpGainSource(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  const parameters = { ...props.step.parameters };
  if (value === '') delete parameters.spGainSource;
  else if (SP_GAIN_SOURCES.includes(value as SpGainSource))
    parameters.spGainSource = value as SpGainSource;
  update({ ...props.step, parameters } as ResourceStep);
}

function setBooleanMetadata(
  field: 'isPercentValue' | 'ignoreUltimateEnergyGainMultiplier',
  checked: boolean,
): void {
  const parameters = { ...props.step.parameters };
  if (checked) parameters[field] = true;
  else delete parameters[field];
  update({ ...props.step, parameters } as ResourceStep);
}

function setRecoveryTags(tags: readonly GameplayTag[]): void {
  const parameters = { ...props.step.parameters };
  const id = tags[0];
  if (id === undefined) delete parameters.ultimateRecoveryTag;
  else parameters.ultimateRecoveryTag = id;
  update({ ...props.step, parameters } as ResourceStep);
}
</script>

<template>
  <div class="step-editor__grid">
    <label>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.resource')"
        :help="t('timeline.skillEditing.fieldHelp.resource')"
      />
      <select :value="step.parameters.resource" @change="setResource">
        <option v-for="item in COMBAT_RESOURCES" :key="item" :value="item">{{ item }}</option>
      </select>
    </label>

    <label v-if="step.kind === 'changeResource'">
      <EditorFieldLabel
        :label="t('timeline.skillEditing.value')"
        :help="t('timeline.skillEditing.fieldHelp.dynamicResourceValue')"
      />
      <input
        v-if="isScalar(step.parameters.amount)"
        type="number"
        step="0.01"
        :value="step.parameters.amount"
        @input="setAmount"
      />
      <em v-else>{{ t('timeline.skillEditing.complexValueReadonly') }}</em>
    </label>
    <label v-else class="step-editor__operand">
      <EditorFieldLabel
        :label="t('timeline.skillEditing.value')"
        :help="t('timeline.skillEditing.fieldHelp.dynamicResourceValue')"
      />
      <ActionValueOperandEditor
        :value="step.parameters.amount"
        :labels="operandLabels()"
        @update="setOperandAmount"
      />
    </label>

    <label>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.recipient')"
        :help="t('timeline.skillEditing.fieldHelp.resourceRecipient')"
      />
      <select :value="step.parameters.recipient" @change="setRecipient">
        <option v-for="item in RESOURCE_RECIPIENTS" :key="item" :value="item">
          {{ t(`timeline.skillEditing.recipients.${item}`) }}
        </option>
      </select>
    </label>
    <label>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.coefficient')"
        :help="t('timeline.skillEditing.fieldHelp.resourceCoefficient')"
      />
      <ActionValueOperandEditor
        v-if="isActionValueOperand(step.parameters.coefficient)"
        :value="step.parameters.coefficient"
        :labels="operandLabels()"
        @update="setCoefficientOperand"
      />
      <input
        v-else
        type="number"
        step="0.01"
        :value="coefficientAtCurrentLevel() ?? ''"
        @input="setCoefficient"
      />
    </label>
  </div>
  <fieldset v-if="step.parameters.resource === 'sp'">
    <legend>{{ t('timeline.skillEditing.spGainMetadata') }}</legend>
    <div class="step-editor__grid step-editor__grid--nested">
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.spGainKind')"
          :help="t('timeline.skillEditing.fieldHelp.spGainKind')"
        />
        <select :value="step.parameters.spGainKind ?? ''" @change="setSpGainKind">
          <option value="">{{ t('timeline.skillEditing.none') }}</option>
          <option v-for="item in SP_GAIN_KINDS" :key="item" :value="item">
            {{ t(`timeline.skillEditing.spGainKinds.${item}`) }}
          </option>
        </select>
      </label>
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.spGainSource')"
          :help="t('timeline.skillEditing.fieldHelp.spGainSource')"
        />
        <select :value="step.parameters.spGainSource ?? ''" @change="setSpGainSource">
          <option value="">{{ t('timeline.skillEditing.none') }}</option>
          <option v-for="item in SP_GAIN_SOURCES" :key="item" :value="item">
            {{ t(`timeline.skillEditing.spGainSources.${item}`) }}
          </option>
        </select>
      </label>
    </div>
  </fieldset>
  <fieldset v-else-if="step.parameters.resource === 'ultimateEnergy'">
    <legend>{{ t('timeline.skillEditing.ultimateEnergyMetadata') }}</legend>
    <div class="step-editor__grid step-editor__grid--nested">
      <label class="step-editor__check step-editor__check--field">
        <input
          type="checkbox"
          :checked="step.parameters.isPercentValue === true"
          @change="
            setBooleanMetadata('isPercentValue', ($event.target as HTMLInputElement).checked)
          "
        />
        <EditorFieldLabel
          :label="t('timeline.skillEditing.percentOfMaximum')"
          :help="t('timeline.skillEditing.fieldHelp.percentOfMaximum')"
        />
      </label>
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.recoveryTag')"
          :help="t('timeline.skillEditing.fieldHelp.recoveryTag')"
        />
        <GameplayTagsEditor
          :tags="recoveryTags"
          :minimum="0"
          :maximum="1"
          @update="setRecoveryTags"
        />
      </label>
      <label class="step-editor__check step-editor__check--field">
        <input
          type="checkbox"
          :checked="step.parameters.ignoreUltimateEnergyGainMultiplier === true"
          @change="
            setBooleanMetadata(
              'ignoreUltimateEnergyGainMultiplier',
              ($event.target as HTMLInputElement).checked,
            )
          "
        />
        <EditorFieldLabel
          :label="t('timeline.skillEditing.ignoreGainMultiplier')"
          :help="t('timeline.skillEditing.fieldHelp.ignoreGainMultiplier')"
        />
      </label>
    </div>
  </fieldset>
</template>
