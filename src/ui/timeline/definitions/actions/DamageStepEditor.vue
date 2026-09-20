<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
/**
 * 伤害与失衡步骤的专用参数编辑器。
 *
 * 只处理 dealDamage、dealFixedDamage、dealStagger 与 applyElementalInfliction。
 * 每次更新都回传完整步骤对象，并保留 parameters 中未展示的字段；逐等级值只在
 * 当前等级编辑，动作黑板操作数交给 ActionValueOperandEditor 切换常量或黑板引用。
 */
import { useI18n } from 'vue-i18n';
import {
  COMBAT_TARGETS,
  DAMAGE_CALCULATIONS,
  DAMAGE_FEATURES,
  DAMAGE_TAGS,
  DAMAGE_TYPES,
  INFLICTION_ELEMENTS,
  type CombatStepDefinition,
  type CombatTarget,
  type DamageCalculation,
  type DamageFeature,
  type DamageTag,
  type DamageType,
  type InflictionElement,
} from '../../../../core/game-data/operatorDefinition';
import {
  replaceLevelValueForEditor,
  resolveLevelValueForEditor,
} from '../skills/skillDefinitionEditorViewModel';
import ActionValueOperandEditor from './ActionValueOperandEditor.vue';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';

type DamageStep = CombatStepForKind<
  'dealDamage' | 'dealFixedDamage' | 'dealStagger' | 'applyElementalInfliction'
>;

const props = defineProps<{ step: DamageStep; skillLevel: number }>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();
const { t } = useI18n({ useScope: 'global' });

const operandLabels = () => ({
  constant: t('timeline.skillEditing.operandConstant'),
  blackboard: t('timeline.skillEditing.operandBlackboard'),
  blackboardKey: t('timeline.skillEditing.operandBlackboardKey'),
  constantValue: t('timeline.skillEditing.operandConstantValue'),
});

function finiteNumber(event: Event): number | undefined {
  const value = Number((event.target as HTMLInputElement).value);
  return Number.isFinite(value) ? value : undefined;
}

function isScalar(value: unknown): value is number {
  return typeof value === 'number';
}

function isLevelValues(value: unknown): value is number | readonly number[] {
  return typeof value === 'number' || Array.isArray(value);
}

function isActionValueOperand(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && 'kind' in value;
}

function update(step: CombatStepDefinition): void {
  emit('update', step);
}

function setDamageType(event: Event): void {
  const damageType = (event.target as HTMLSelectElement).value as DamageType;
  if (!DAMAGE_TYPES.includes(damageType)) return;
  if (props.step.kind === 'dealDamage') {
    const step = props.step;
    update({ ...step, parameters: { ...step.parameters, damageType } });
    return;
  }
  if (props.step.kind === 'dealFixedDamage') {
    const step = props.step;
    update({ ...step, parameters: { ...step.parameters, damageType } });
  }
}

function setCalculation(event: Event): void {
  if (props.step.kind !== 'dealDamage') return;
  const value = (event.target as HTMLSelectElement).value;
  const parameters = { ...props.step.parameters };
  if (value === '') {
    delete parameters.calculation;
    delete parameters.calculationMultiplier;
  } else {
    const calculation = value as DamageCalculation;
    if (!DAMAGE_CALCULATIONS.includes(calculation)) return;
    parameters.calculation = calculation;
    if (calculation !== 'breakingAttack') delete parameters.calculationMultiplier;
  }
  update({ ...props.step, parameters });
}

function setCalculationMultiplier(event: Event): void {
  if (props.step.kind !== 'dealDamage' || props.step.parameters.calculation !== 'breakingAttack')
    return;
  const raw = (event.target as HTMLInputElement).value;
  const parameters = { ...props.step.parameters };
  if (raw === '') {
    delete parameters.calculationMultiplier;
  } else {
    const value = finiteNumber(event);
    if (value === undefined) return;
    parameters.calculationMultiplier = replaceLevelValueForEditor(
      props.step.parameters.calculationMultiplier ?? 1,
      props.skillLevel,
      value / 100,
    );
  }
  update({ ...props.step, parameters });
}

function calculationMultiplierAtCurrentLevel(): number | undefined {
  if (
    props.step.kind !== 'dealDamage' ||
    props.step.parameters.calculationMultiplier === undefined
  ) {
    return undefined;
  }
  return resolveLevelValueForEditor(props.step.parameters.calculationMultiplier, props.skillLevel);
}

function toggleStatusScaling(enabled: boolean): void {
  if (props.step.kind !== 'dealDamage') return;
  const parameters = { ...props.step.parameters };
  if (enabled) {
    parameters.attackScalePerStatusStack = {
      statusKey: 'status',
      target: 'enemy',
      coefficient: 0,
    };
  } else {
    delete parameters.attackScalePerStatusStack;
  }
  update({ ...props.step, parameters });
}

function setStatusScalingKey(event: Event): void {
  if (
    props.step.kind !== 'dealDamage' ||
    props.step.parameters.attackScalePerStatusStack === undefined
  )
    return;
  update({
    ...props.step,
    parameters: {
      ...props.step.parameters,
      attackScalePerStatusStack: {
        ...props.step.parameters.attackScalePerStatusStack,
        statusKey: (event.target as HTMLInputElement).value,
      },
    },
  });
}

function setStatusScalingTarget(event: Event): void {
  if (
    props.step.kind !== 'dealDamage' ||
    props.step.parameters.attackScalePerStatusStack === undefined
  )
    return;
  const target = (event.target as HTMLSelectElement).value as CombatTarget;
  if (!COMBAT_TARGETS.includes(target)) return;
  update({
    ...props.step,
    parameters: {
      ...props.step.parameters,
      attackScalePerStatusStack: { ...props.step.parameters.attackScalePerStatusStack, target },
    },
  });
}

function setStatusScalingCoefficient(event: Event): void {
  if (
    props.step.kind !== 'dealDamage' ||
    props.step.parameters.attackScalePerStatusStack === undefined
  )
    return;
  const value = finiteNumber(event);
  if (value === undefined) return;
  const scaling = props.step.parameters.attackScalePerStatusStack;
  update({
    ...props.step,
    parameters: {
      ...props.step.parameters,
      attackScalePerStatusStack: {
        ...scaling,
        coefficient: replaceLevelValueForEditor(scaling.coefficient, props.skillLevel, value / 100),
      },
    },
  });
}

function setAttackScale(event: Event): void {
  if (props.step.kind !== 'dealDamage' || !isLevelValues(props.step.parameters.attackScale)) return;
  const percentage = finiteNumber(event);
  if (percentage === undefined || percentage < 0) return;
  update({
    ...props.step,
    parameters: {
      ...props.step.parameters,
      attackScale: replaceLevelValueForEditor(
        props.step.parameters.attackScale,
        props.skillLevel,
        percentage / 100,
      ),
    },
  });
}

function attackScaleAtCurrentLevel(): number | undefined {
  if (props.step.kind !== 'dealDamage' || !isLevelValues(props.step.parameters.attackScale)) {
    return undefined;
  }
  return resolveLevelValueForEditor(props.step.parameters.attackScale, props.skillLevel);
}

function attackScaleOperandLabel(): string {
  if (props.step.kind !== 'dealDamage' || isLevelValues(props.step.parameters.attackScale))
    return '';
  const operand = props.step.parameters.attackScale;
  return operand.kind === 'blackboard'
    ? t('timeline.skillEditing.blackboardReference', { key: operand.key })
    : `${operand.value * 100}%`;
}

function levelValuesTitle(value: number | readonly number[]): string {
  return typeof value === 'number'
    ? `${value}`
    : value.map((item, index) => `Lv${index + 1}: ${item}`).join('\n');
}

function toggleDamageTag(tag: DamageTag): void {
  if (props.step.kind !== 'dealDamage') return;
  const tags = props.step.parameters.tags.includes(tag)
    ? props.step.parameters.tags.filter(current => current !== tag)
    : [...props.step.parameters.tags, tag];
  update({ ...props.step, parameters: { ...props.step.parameters, tags } });
}

function toggleDamageFeature(feature: DamageFeature): void {
  if (props.step.kind !== 'dealDamage' && props.step.kind !== 'dealFixedDamage') return;
  const current = props.step.parameters.features ?? [];
  const features = current.includes(feature)
    ? current.filter(item => item !== feature)
    : [...current, feature];
  if (props.step.kind === 'dealDamage') {
    const step = props.step;
    if (features.length > 0) {
      update({ ...step, parameters: { ...step.parameters, features } });
    } else {
      const { features: _, ...parameters } = step.parameters;
      update({ ...step, parameters });
    }
    return;
  }
  const step = props.step;
  if (features.length > 0) {
    update({ ...step, parameters: { ...step.parameters, features } });
  } else {
    const { features: _, ...parameters } = step.parameters;
    update({ ...step, parameters });
  }
}

function setStagger(event: Event): void {
  if (props.step.kind === 'dealDamage') {
    if (props.step.parameters.stagger !== undefined && !isScalar(props.step.parameters.stagger)) {
      return;
    }
    const raw = (event.target as HTMLInputElement).value;
    const stagger = raw === '' ? undefined : finiteNumber(event);
    if (stagger !== undefined && stagger < 0) return;
    const parameters = { ...props.step.parameters, stagger };
    if (stagger === undefined) delete parameters.stagger;
    update({ ...props.step, parameters });
    return;
  }
  if (props.step.kind !== 'dealStagger' || !isScalar(props.step.parameters.value)) return;
  const value = finiteNumber(event);
  if (value === undefined || value < 0) return;
  update({ ...props.step, parameters: { value } });
}

function setInflictionElement(event: Event): void {
  if (props.step.kind !== 'applyElementalInfliction') return;
  const element = (event.target as HTMLSelectElement).value as InflictionElement;
  if (!INFLICTION_ELEMENTS.includes(element)) return;
  update({ ...props.step, parameters: { ...props.step.parameters, element } });
}

function setInflictionExtra(event: Event): void {
  if (props.step.kind !== 'applyElementalInfliction') return;
  update({
    ...props.step,
    parameters: {
      ...props.step.parameters,
      isExtra: (event.target as HTMLInputElement).checked,
    },
  });
}

function setFixedDamageValue(event: Event): void {
  if (props.step.kind !== 'dealFixedDamage' || !isLevelValues(props.step.parameters.value)) return;
  const value = finiteNumber(event);
  if (value === undefined || value < 0) return;
  update({
    ...props.step,
    parameters: {
      ...props.step.parameters,
      value: replaceLevelValueForEditor(props.step.parameters.value, props.skillLevel, value),
    },
  });
}

function fixedDamageValueAtCurrentLevel(): number | undefined {
  if (props.step.kind !== 'dealFixedDamage' || !isLevelValues(props.step.parameters.value)) {
    return undefined;
  }
  return resolveLevelValueForEditor(props.step.parameters.value, props.skillLevel);
}

function setFixedDamageOperand(operand: Parameters<typeof setFixedValue>[0]): void {
  setFixedValue(operand);
}

function setFixedValue(
  operand: { kind: 'blackboard'; key: string } | { kind: 'constant'; value: number },
): void {
  if (props.step.kind !== 'dealFixedDamage') return;
  update({ ...props.step, parameters: { ...props.step.parameters, value: operand } });
}

function setFixedDamageStagger(event: Event): void {
  if (props.step.kind !== 'dealFixedDamage') return;
  const raw = (event.target as HTMLInputElement).value;
  const stagger = raw === '' ? undefined : finiteNumber(event);
  if (stagger !== undefined && stagger < 0) return;
  const parameters = { ...props.step.parameters, stagger };
  if (stagger === undefined) delete parameters.stagger;
  update({ ...props.step, parameters });
}

function setFixedTags(tag: DamageTag): void {
  if (props.step.kind !== 'dealFixedDamage') return;
  const tags = props.step.parameters.tags.includes(tag)
    ? props.step.parameters.tags.filter(current => current !== tag)
    : [...props.step.parameters.tags, tag];
  update({ ...props.step, parameters: { ...props.step.parameters, tags } });
}
</script>

<template>
  <template v-if="step.kind === 'dealDamage'">
    <div class="step-editor__grid">
      <label>
        <span>{{ t('timeline.skillEditing.damageType') }}</span>
        <select :value="step.parameters.damageType" @change="setDamageType">
          <option v-for="item in DAMAGE_TYPES" :key="item" :value="item">
            {{ t(`timeline.skillEditing.damageTypes.${item}`) }}
          </option>
        </select>
      </label>
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.damageCalculation')"
          :help="t('timeline.skillEditing.fieldHelp.damageCalculation')"
        />
        <select :value="step.parameters.calculation ?? ''" @change="setCalculation">
          <option value="">{{ t('timeline.skillEditing.damageCalculations.default') }}</option>
          <option v-for="item in DAMAGE_CALCULATIONS" :key="item" :value="item">
            {{ t(`timeline.skillEditing.damageCalculations.${item}`) }}
          </option>
        </select>
      </label>
      <label v-if="step.parameters.calculation === 'breakingAttack'">
        <EditorFieldLabel
          :label="t('timeline.skillEditing.calculationMultiplier')"
          :help="t('timeline.skillEditing.fieldHelp.calculationMultiplier')"
        />
        <input
          type="number"
          step="0.01"
          :value="
            calculationMultiplierAtCurrentLevel() === undefined
              ? ''
              : calculationMultiplierAtCurrentLevel()! * 100
          "
          @input="setCalculationMultiplier"
        />
      </label>
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.attackScale')"
          :help="t('timeline.skillEditing.fieldHelp.attackScale')"
        />
        <input
          v-if="attackScaleAtCurrentLevel() !== undefined"
          type="number"
          min="0"
          step="0.01"
          :value="attackScaleAtCurrentLevel()! * 100"
          :title="
            isLevelValues(step.parameters.attackScale)
              ? levelValuesTitle(step.parameters.attackScale)
              : ''
          "
          @input="setAttackScale"
        />
        <em v-else :title="attackScaleOperandLabel()">{{ attackScaleOperandLabel() }}</em>
      </label>
      <label>
        <span>{{ t('timeline.skillEditing.stagger') }}</span>
        <input
          v-if="step.parameters.stagger === undefined || isScalar(step.parameters.stagger)"
          type="number"
          min="0"
          step="0.01"
          :value="step.parameters.stagger ?? ''"
          @input="setStagger"
        />
        <em v-else>{{ t('timeline.skillEditing.complexValueReadonly') }}</em>
      </label>
    </div>
    <fieldset>
      <legend>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.statusStackScaling')"
          :help="t('timeline.skillEditing.fieldHelp.statusStackScaling')"
        />
      </legend>
      <label class="step-editor__check">
        <input
          type="checkbox"
          :checked="step.parameters.attackScalePerStatusStack !== undefined"
          @change="toggleStatusScaling(($event.target as HTMLInputElement).checked)"
        />
        <span>{{ t('timeline.skillEditing.enableStatusStackScaling') }}</span>
      </label>
      <div
        v-if="step.parameters.attackScalePerStatusStack !== undefined"
        class="step-editor__grid step-editor__grid--nested"
      >
        <label>
          <EditorFieldLabel
            :label="t('timeline.skillEditing.statusKey')"
            :help="t('timeline.skillEditing.fieldHelp.statusScalingKey')"
          />
          <input
            type="text"
            :value="step.parameters.attackScalePerStatusStack.statusKey"
            @input="setStatusScalingKey"
          />
        </label>
        <label>
          <span>{{ t('timeline.skillEditing.target') }}</span>
          <select
            :value="step.parameters.attackScalePerStatusStack.target"
            @change="setStatusScalingTarget"
          >
            <option v-for="target in COMBAT_TARGETS" :key="target" :value="target">
              {{ t(`timeline.skillEditing.targets.${target}`) }}
            </option>
          </select>
        </label>
        <label>
          <EditorFieldLabel
            :label="t('timeline.skillEditing.perStackCoefficient')"
            :help="t('timeline.skillEditing.fieldHelp.perStackCoefficient')"
          />
          <input
            type="number"
            step="0.01"
            :value="
              (resolveLevelValueForEditor(
                step.parameters.attackScalePerStatusStack.coefficient,
                skillLevel,
              ) ?? 0) * 100
            "
            @input="setStatusScalingCoefficient"
          />
        </label>
      </div>
    </fieldset>
    <fieldset>
      <legend>{{ t('timeline.skillEditing.damageTags') }}</legend>
      <label v-for="tag in DAMAGE_TAGS" :key="tag" class="step-editor__check">
        <input
          type="checkbox"
          :checked="step.parameters.tags.includes(tag)"
          @change="toggleDamageTag(tag)"
        />
        <span>{{ t(`timeline.skillEditing.damageTagNames.${tag}`) }}</span>
      </label>
    </fieldset>
    <fieldset>
      <legend>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.damageFeatures')"
          :help="t('timeline.skillEditing.fieldHelp.damageFeatures')"
        />
      </legend>
      <label v-for="feature in DAMAGE_FEATURES" :key="feature" class="step-editor__check">
        <input
          type="checkbox"
          :checked="step.parameters.features?.includes(feature) ?? false"
          @change="toggleDamageFeature(feature)"
        />
        <span>{{ t(`timeline.skillEditing.damageFeatureNames.${feature}`) }}</span>
      </label>
    </fieldset>
  </template>

  <div v-else-if="step.kind === 'dealStagger'" class="step-editor__grid">
    <label>
      <span>{{ t('timeline.skillEditing.stagger') }}</span>
      <input
        v-if="isScalar(step.parameters.value)"
        type="number"
        min="0"
        step="0.01"
        :value="step.parameters.value"
        @input="setStagger"
      />
      <em v-else>{{ t('timeline.skillEditing.complexValueReadonly') }}</em>
    </label>
  </div>

  <div v-else-if="step.kind === 'applyElementalInfliction'" class="step-editor__grid">
    <label>
      <span>{{ t('timeline.skillEditing.element') }}</span>
      <select :value="step.parameters.element" @change="setInflictionElement">
        <option v-for="item in INFLICTION_ELEMENTS" :key="item" :value="item">
          {{ t(`timeline.skillEditing.damageTypes.${item}`) }}
        </option>
      </select>
    </label>
    <label class="step-editor__check step-editor__check--field">
      <input type="checkbox" :checked="step.parameters.isExtra" @change="setInflictionExtra" />
      <EditorFieldLabel
        :label="t('timeline.skillEditing.extraInfliction')"
        :help="t('timeline.skillEditing.fieldHelp.extraInfliction')"
      />
    </label>
  </div>

  <template v-else-if="step.kind === 'dealFixedDamage'">
    <div class="step-editor__grid">
      <label>
        <span>{{ t('timeline.skillEditing.damageType') }}</span>
        <select :value="step.parameters.damageType" @change="setDamageType">
          <option v-for="item in DAMAGE_TYPES" :key="item" :value="item">
            {{ t(`timeline.skillEditing.damageTypes.${item}`) }}
          </option>
        </select>
      </label>
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.fixedValue')"
          :help="t('timeline.skillEditing.fieldHelp.fixedValue')"
        />
        <input
          v-if="fixedDamageValueAtCurrentLevel() !== undefined"
          type="number"
          min="0"
          step="0.01"
          :value="fixedDamageValueAtCurrentLevel()"
          @input="setFixedDamageValue"
        />
        <ActionValueOperandEditor
          v-else-if="isActionValueOperand(step.parameters.value)"
          :value="
            step.parameters.value as
              { kind: 'blackboard'; key: string } | { kind: 'constant'; value: number }
          "
          :labels="operandLabels()"
          @update="setFixedDamageOperand"
        />
      </label>
      <label>
        <span>{{ t('timeline.skillEditing.stagger') }}</span>
        <input
          v-if="step.parameters.stagger === undefined || isScalar(step.parameters.stagger)"
          type="number"
          min="0"
          step="0.01"
          :value="step.parameters.stagger ?? ''"
          @input="setFixedDamageStagger"
        />
        <em v-else>{{ t('timeline.skillEditing.complexValueReadonly') }}</em>
      </label>
    </div>
    <fieldset>
      <legend>{{ t('timeline.skillEditing.damageTags') }}</legend>
      <label v-for="tag in DAMAGE_TAGS" :key="tag" class="step-editor__check">
        <input
          type="checkbox"
          :checked="step.parameters.tags.includes(tag)"
          @change="setFixedTags(tag)"
        />
        <span>{{ t(`timeline.skillEditing.damageTagNames.${tag}`) }}</span>
      </label>
    </fieldset>
    <fieldset>
      <legend>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.damageFeatures')"
          :help="t('timeline.skillEditing.fieldHelp.damageFeatures')"
        />
      </legend>
      <label v-for="feature in DAMAGE_FEATURES" :key="feature" class="step-editor__check">
        <input
          type="checkbox"
          :checked="step.parameters.features?.includes(feature) ?? false"
          @change="toggleDamageFeature(feature)"
        />
        <span>{{ t(`timeline.skillEditing.damageFeatureNames.${feature}`) }}</span>
      </label>
    </fieldset>
  </template>
</template>
