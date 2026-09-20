<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
import type { GameplayTag } from '../../../../../packages/game-data-contract/src/gameplayTags';

/** 编辑普通治疗公式；目标选择仍由场景中的控制时间线与干员生命账本解析。 */
import { useI18n } from 'vue-i18n';
import {
  HEAL_TARGETS,
  OPERATOR_ATTRIBUTES,
  type ActionValueOperand,
  type CombatStepDefinition,
  type HealTarget,
  type OperatorAttribute,
} from '../../../../core/game-data/operatorDefinition';
import {
  replaceLevelValueForEditor,
  resolveLevelValueForEditor,
} from '../skills/skillDefinitionEditorViewModel';
import ActionValueOperandEditor from './ActionValueOperandEditor.vue';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';
import GameplayTagsEditor from '../inspector/GameplayTagsEditor.vue';

type HealStep = CombatStepForKind<'heal'>;
type FormulaField = 'multiplier' | 'addition';
type HealParameters = HealStep['parameters'];

const props = defineProps<{ step: HealStep; skillLevel: number }>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();
const { t } = useI18n({ useScope: 'global' });

function isOperand(value: unknown): value is ActionValueOperand {
  return typeof value === 'object' && value !== null && 'kind' in value;
}

function isDefinite(
  parameters: HealParameters,
): parameters is Extract<HealParameters, { amount: unknown }> {
  return parameters.amount !== undefined;
}

function update(parameters: HealStep['parameters']): void {
  emit('update', { ...props.step, parameters });
}

function setTarget(event: Event): void {
  const target = (event.target as HTMLSelectElement).value as HealTarget;
  if (!HEAL_TARGETS.includes(target)) return;
  const { contextKey: previousContextKey, ...parameters } = props.step.parameters;
  if (target === 'contextTarget') {
    update({ ...parameters, target, contextKey: previousContextKey ?? '' });
    return;
  }
  update({ ...parameters, target });
}

function setSource(event: Event): void {
  const source = (event.target as HTMLSelectElement).value;
  if (source === 'default') {
    const { source: _source, ...parameters } = props.step.parameters;
    update(parameters);
  } else if (source === 'buffOwner') {
    update({ ...props.step.parameters, source });
  }
}

function setAttributeSource(event: Event): void {
  if (isDefinite(props.step.parameters)) return;
  const source = (event.target as HTMLSelectElement).value;
  if (source === 'healer') {
    const { attributeSource: _attributeSource, ...parameters } = props.step.parameters;
    update(parameters);
  } else if (source === 'target') {
    update({ ...props.step.parameters, attributeSource: 'target' as const });
  }
}

function setContextKey(event: Event): void {
  if (props.step.parameters.target !== 'contextTarget') return;
  update({
    ...props.step.parameters,
    contextKey: (event.target as HTMLInputElement).value,
  });
}

function setAttribute(event: Event): void {
  if (isDefinite(props.step.parameters)) return;
  const attribute = (event.target as HTMLSelectElement).value as OperatorAttribute;
  if (OPERATOR_ATTRIBUTES.includes(attribute)) update({ ...props.step.parameters, attribute });
}

function setFormulaValue(field: FormulaField, event: Event): void {
  if (isDefinite(props.step.parameters)) return;
  const current = props.step.parameters[field];
  if (isOperand(current)) return;
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  update({
    ...props.step.parameters,
    [field]: replaceLevelValueForEditor(current, props.skillLevel, value),
  });
}

function setFormulaOperand(field: FormulaField, value: ActionValueOperand): void {
  if (isDefinite(props.step.parameters)) return;
  update({ ...props.step.parameters, [field]: value });
}

function setFormulaKind(field: FormulaField, event: Event): void {
  if (isDefinite(props.step.parameters)) return;
  const kind = (event.target as HTMLSelectElement).value;
  const current = props.step.parameters[field];
  if (kind === 'blackboard') {
    update({
      ...props.step.parameters,
      [field]:
        isOperand(current) && current.kind === 'blackboard'
          ? current
          : { kind: 'blackboard', key: '' },
    });
    return;
  }
  if (kind !== 'constant') return;
  const value = isOperand(current)
    ? current.kind === 'constant'
      ? current.value
      : field === 'multiplier'
        ? 1
        : 0
    : (resolveLevelValueForEditor(current, props.skillLevel) ?? 0);
  update({ ...props.step.parameters, [field]: value });
}

function formulaValue(field: FormulaField): number | undefined {
  if (isDefinite(props.step.parameters)) return undefined;
  const value = props.step.parameters[field];
  return isOperand(value) ? undefined : resolveLevelValueForEditor(value, props.skillLevel);
}

function setAmountValue(event: Event): void {
  if (!isDefinite(props.step.parameters) || isOperand(props.step.parameters.amount)) return;
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  update({
    ...props.step.parameters,
    amount: replaceLevelValueForEditor(props.step.parameters.amount, props.skillLevel, value),
  });
}

function setAmountOperand(value: ActionValueOperand): void {
  if (!isDefinite(props.step.parameters)) return;
  update({ ...props.step.parameters, amount: value });
}

function setAmountKind(event: Event): void {
  if (!isDefinite(props.step.parameters)) return;
  const kind = (event.target as HTMLSelectElement).value;
  const current = props.step.parameters.amount;
  if (kind === 'blackboard') {
    update({
      ...props.step.parameters,
      amount:
        isOperand(current) && current.kind === 'blackboard'
          ? current
          : { kind: 'blackboard', key: '' },
    });
  } else if (kind === 'constant') {
    update({
      ...props.step.parameters,
      amount: isOperand(current) ? (current.kind === 'constant' ? current.value : 0) : current,
    });
  }
}

function amountValue(): number | undefined {
  if (!isDefinite(props.step.parameters) || isOperand(props.step.parameters.amount))
    return undefined;
  return resolveLevelValueForEditor(props.step.parameters.amount, props.skillLevel);
}

function setTags(tags: readonly GameplayTag[]): void {
  update({ ...props.step.parameters, tags });
}

const operandLabels = () => ({
  constant: t('timeline.skillEditing.operandConstant'),
  blackboard: t('timeline.skillEditing.operandBlackboard'),
  blackboardKey: t('timeline.skillEditing.operandBlackboardKey'),
  constantValue: t('timeline.skillEditing.operandConstantValue'),
});
</script>

<template>
  <div class="step-editor__grid">
    <label>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.target')"
        :help="t('timeline.skillEditing.fieldHelp.healTarget')"
      />
      <select :value="step.parameters.target" @change="setTarget">
        <option v-for="target in HEAL_TARGETS" :key="target" :value="target">
          {{ t(`timeline.skillEditing.healTargets.${target}`) }}
        </option>
      </select>
    </label>
    <label>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.healSource')"
        :help="t('timeline.skillEditing.fieldHelp.healSource')"
      />
      <select :value="step.parameters.source ?? 'default'" @change="setSource">
        <option value="default">
          {{ t('timeline.skillEditing.healSources.default') }}
        </option>
        <option value="buffOwner">
          {{ t('timeline.skillEditing.healSources.buffOwner') }}
        </option>
      </select>
    </label>
    <label v-if="step.parameters.target === 'contextTarget'">
      <EditorFieldLabel
        :label="t('timeline.skillEditing.healContextKey')"
        :help="t('timeline.skillEditing.fieldHelp.healContextKey')"
      />
      <input :value="step.parameters.contextKey" @input="setContextKey" />
    </label>
    <label v-if="!isDefinite(step.parameters)">
      <EditorFieldLabel
        :label="t('timeline.skillEditing.attribute')"
        :help="t('timeline.skillEditing.fieldHelp.healAttribute')"
      />
      <select :value="step.parameters.attribute" @change="setAttribute">
        <option v-for="attribute in OPERATOR_ATTRIBUTES" :key="attribute" :value="attribute">
          {{ t(`timeline.skillEditing.attributes.${attribute}`) }}
        </option>
      </select>
    </label>
    <label v-if="!isDefinite(step.parameters)">
      <EditorFieldLabel
        :label="t('timeline.skillEditing.healAttributeSource')"
        :help="t('timeline.skillEditing.fieldHelp.healAttributeSource')"
      />
      <select :value="step.parameters.attributeSource ?? 'healer'" @change="setAttributeSource">
        <option value="healer">
          {{ t('timeline.skillEditing.healAttributeSources.healer') }}
        </option>
        <option value="target">
          {{ t('timeline.skillEditing.healAttributeSources.target') }}
        </option>
      </select>
    </label>

    <template v-if="!isDefinite(step.parameters)">
      <label
        v-for="field in ['multiplier', 'addition'] as const"
        :key="field"
        class="step-editor__operand"
      >
        <EditorFieldLabel
          :label="
            t(`timeline.skillEditing.heal${field === 'multiplier' ? 'Multiplier' : 'Addition'}`)
          "
          :help="
            t(
              `timeline.skillEditing.fieldHelp.heal${field === 'multiplier' ? 'Multiplier' : 'Addition'}`,
            )
          "
        />
        <div class="heal-formula-editor">
          <select
            :value="
              isOperand(step.parameters[field]) && step.parameters[field].kind === 'blackboard'
                ? 'blackboard'
                : 'constant'
            "
            @change="setFormulaKind(field, $event)"
          >
            <option value="constant">{{ t('timeline.skillEditing.operandConstant') }}</option>
            <option value="blackboard">
              {{ t('timeline.skillEditing.operandBlackboard') }}
            </option>
          </select>
          <ActionValueOperandEditor
            v-if="isOperand(step.parameters[field])"
            :value="step.parameters[field] as ActionValueOperand"
            :labels="operandLabels()"
            @update="setFormulaOperand(field, $event)"
          />
          <input
            v-else
            type="number"
            step="0.01"
            :value="formulaValue(field)"
            @input="setFormulaValue(field, $event)"
          />
        </div>
      </label>
    </template>

    <label v-if="isDefinite(step.parameters)" class="step-editor__operand">
      <EditorFieldLabel
        :label="t('timeline.skillEditing.healAmount')"
        :help="t('timeline.skillEditing.fieldHelp.healAmount')"
      />
      <div class="heal-formula-editor">
        <select
          :value="isOperand(step.parameters.amount) ? step.parameters.amount.kind : 'constant'"
          @change="setAmountKind"
        >
          <option value="constant">{{ t('timeline.skillEditing.operandConstant') }}</option>
          <option value="blackboard">{{ t('timeline.skillEditing.operandBlackboard') }}</option>
        </select>
        <ActionValueOperandEditor
          v-if="isOperand(step.parameters.amount)"
          :value="step.parameters.amount"
          :labels="operandLabels()"
          @update="setAmountOperand"
        />
        <input v-else type="number" step="0.01" :value="amountValue()" @input="setAmountValue" />
      </div>
    </label>

    <label class="step-editor__operand">
      <EditorFieldLabel
        :label="t('timeline.skillEditing.healTags')"
        :help="t('timeline.skillEditing.fieldHelp.healTags')"
      />
      <GameplayTagsEditor :tags="step.parameters.tags" :minimum="0" @update="setTags" />
    </label>
  </div>
</template>

<style scoped>
.heal-formula-editor {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(88px, 112px) minmax(0, 1fr);
  gap: 8px;
}

.heal-formula-editor :deep(.operand-editor) {
  grid-template-columns: minmax(0, 1fr);
}
</style>
