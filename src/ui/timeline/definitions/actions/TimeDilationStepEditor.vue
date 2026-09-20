<script setup lang="ts">
import { ElIcon } from 'element-plus';
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
/**
 * 编辑普通时间膨胀与终结技专用时间膨胀。
 *
 * 曲线保持与技能定义相同的判别联合结构。内联关键帧完整暴露 Unity 曲线参数，
 * 避免编辑后丢失转换数据；普通使用者可以只调整时间和值。
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Delete, Plus } from '@element-plus/icons-vue';
import {
  COMBAT_TARGETS,
  TIME_DILATION_IGNORE_TARGETS,
  type ActionValueOperand,
  type AbilityEntityTargetQuery,
  type CombatStepDefinition,
  type TimeDilationIgnoreTarget,
  type TimeScaleCurveDefinition,
  type TimeScaleCurveKeyDefinition,
} from '../../../../core/game-data/operatorDefinition';
import ActionValueOperandEditor from './ActionValueOperandEditor.vue';
import AbilityEntityTargetQueryEditor from '../operators/AbilityEntityTargetQueryEditor.vue';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';
import TimeScaleCurveEditor from '../skills/TimeScaleCurveEditor.vue';
import { hitStopNamedCurveKeys } from '../../../../data/combat/hitStopCurveCatalog';
import {
  TIME_DILATION_NAMED_CURVE_KEYS,
  TIME_DILATION_PRIORITY_OPTIONS,
  TIME_DILATION_SLOT_DEFINITIONS,
  timeDilationNamedCurveKeys,
} from '../../../../data/combat/timeDilationCatalog';

type TimeDilationStep = CombatStepForKind<'startTimeDilation' | 'startUltimateTimeDilation'>;
type OrdinaryStep = CombatStepForKind<'startTimeDilation'>;

const props = defineProps<{ step: TimeDilationStep }>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();
const { t } = useI18n({ useScope: 'global' });

const ordinary = computed(() => (props.step.kind === 'startTimeDilation' ? props.step : undefined));
const slotOptions = computed(() => {
  const current = ordinary.value?.parameters.slot;
  const definitions: { id: string; label: string }[] = TIME_DILATION_SLOT_DEFINITIONS.map(slot => ({
    id: slot.id,
    label: slot.name,
  }));
  if (
    current !== undefined &&
    current !== 'unassigned' &&
    !definitions.some(slot => slot.id === current)
  ) {
    definitions.unshift({
      id: current,
      label: `${current} — ${t('timeline.skillEditing.unknownTimeDilationSlot')}`,
    });
  }
  return [
    { id: 'unassigned', label: t('timeline.skillEditing.invalidTimeDilationSlot') },
    ...definitions,
  ];
});
const namedCurveOptions = computed(() => {
  const curve = ordinary.value?.parameters.curve;
  if (
    curve?.kind === 'named' &&
    !TIME_DILATION_NAMED_CURVE_KEYS.includes(
      curve.key as (typeof TIME_DILATION_NAMED_CURVE_KEYS)[number],
    )
  ) {
    return [curve.key, ...TIME_DILATION_NAMED_CURVE_KEYS];
  }
  return TIME_DILATION_NAMED_CURVE_KEYS;
});
const priorityOptions = computed(() => {
  const current = props.step.parameters.priority;
  const options = TIME_DILATION_PRIORITY_OPTIONS.map(option => ({
    value: option.value,
    label: `${option.tagPaths.join(' / ')} (${option.value})`,
  }));
  if (!options.some(option => option.value === current)) {
    options.unshift({
      value: current,
      label: `${current} — ${t('timeline.skillEditing.unknownTimeDilationPriority')}`,
    });
  }
  return options;
});
const curvePreviewKeys = computed<readonly TimeScaleCurveKeyDefinition[]>(() => {
  const curve = ordinary.value?.parameters.curve;
  if (curve === undefined) return [];
  return curve.kind === 'inline'
    ? curve.keys
    : (timeDilationNamedCurveKeys(curve.key) ?? hitStopNamedCurveKeys(curve.key) ?? []);
});
const operandLabels = () => ({
  constant: t('timeline.skillEditing.operandConstant'),
  blackboard: t('timeline.skillEditing.operandBlackboard'),
  blackboardKey: t('timeline.skillEditing.operandBlackboardKey'),
  constantValue: t('timeline.skillEditing.operandConstantValue'),
});

function numberFrom(event: Event): number | undefined {
  const value = Number((event.target as HTMLInputElement).value);
  return Number.isFinite(value) ? value : undefined;
}

function updateOrdinary(parameters: OrdinaryStep['parameters']): void {
  if (props.step.kind !== 'startTimeDilation') return;
  emit('update', { ...props.step, parameters });
}

function setScope(event: Event): void {
  const step = ordinary.value;
  if (step === undefined) return;
  const scope = (event.target as HTMLSelectElement).value as 'global' | 'entity';
  const abilityEntityQueries =
    step.parameters.scope === 'global'
      ? step.parameters.ignoredAbilityEntityTargets
      : step.parameters.abilityEntityTargets;
  const common = {
    durationSeconds: step.parameters.durationSeconds,
    slot: step.parameters.slot,
    priority: step.parameters.priority,
    curve: step.parameters.curve,
    finishByAction: step.parameters.finishByAction,
  };
  updateOrdinary(
    scope === 'global'
      ? {
          ...common,
          scope,
          ignoredTargets: ['caster'],
          ...(abilityEntityQueries === undefined
            ? {}
            : { ignoredAbilityEntityTargets: abilityEntityQueries }),
        }
      : {
          ...common,
          scope,
          targets: ['caster'],
          ...(abilityEntityQueries === undefined
            ? {}
            : { abilityEntityTargets: abilityEntityQueries }),
        },
  );
}

function setOrdinaryNumber(field: 'priority', event: Event): void {
  const step = ordinary.value;
  const value = numberFrom(event);
  if (step === undefined || value === undefined || !Number.isInteger(value)) return;
  updateOrdinary({ ...step.parameters, [field]: value });
}

function setSlot(event: Event): void {
  const step = ordinary.value;
  if (step !== undefined)
    updateOrdinary({ ...step.parameters, slot: (event.target as HTMLSelectElement).value });
}

function setDuration(durationSeconds: ActionValueOperand): void {
  const step = ordinary.value;
  if (step === undefined) return;
  updateOrdinary({ ...step.parameters, durationSeconds });
}

function setFinishByAction(event: Event): void {
  const step = ordinary.value;
  if (step === undefined) return;
  updateOrdinary({
    ...step.parameters,
    finishByAction: (event.target as HTMLInputElement).checked,
  });
}

function setTarget(target: TimeDilationIgnoreTarget, checked: boolean): void {
  const step = ordinary.value;
  if (step === undefined) return;
  if (step.parameters.scope === 'global') {
    const ignoredTargets = checked
      ? [...new Set([...step.parameters.ignoredTargets, target])]
      : step.parameters.ignoredTargets.filter(item => item !== target);
    updateOrdinary({ ...step.parameters, ignoredTargets });
    return;
  }
  if (target === 'controlled') return;
  const targets = checked
    ? [...new Set([...step.parameters.targets, target])]
    : step.parameters.targets.filter(item => item !== target);
  if (targets.length > 0 || (step.parameters.abilityEntityTargets?.length ?? 0) > 0) {
    updateOrdinary({ ...step.parameters, targets });
  }
}

function setOrdinaryAbilityEntityQueries(queries: readonly AbilityEntityTargetQuery[]): void {
  const step = ordinary.value;
  if (step === undefined) return;
  if (step.parameters.scope === 'global') {
    const { ignoredAbilityEntityTargets: _removed, ...parameters } = step.parameters;
    updateOrdinary({
      ...parameters,
      ...(queries.length > 0 ? { ignoredAbilityEntityTargets: queries } : {}),
    });
    return;
  }
  const { abilityEntityTargets: _removed, ...parameters } = step.parameters;
  const targets =
    parameters.targets.length === 0 && queries.length === 0
      ? ['caster' as const]
      : parameters.targets;
  updateOrdinary({
    ...parameters,
    targets,
    ...(queries.length > 0 ? { abilityEntityTargets: queries } : {}),
  });
}

function hasTarget(target: TimeDilationIgnoreTarget): boolean {
  const step = ordinary.value;
  if (step === undefined) return false;
  if (step.parameters.scope === 'global') {
    return step.parameters.ignoredTargets.includes(target);
  }
  return target !== 'controlled' && step.parameters.targets.includes(target);
}

function setIgnoreSlotCheck(event: Event): void {
  const step = ordinary.value;
  if (step === undefined || step.parameters.scope !== 'entity') return;
  const ignoreSlotCheck = (event.target as HTMLInputElement).checked;
  updateOrdinary({
    ...step.parameters,
    ...(ignoreSlotCheck ? { ignoreSlotCheck } : { ignoreSlotCheck: undefined }),
  });
}

function toggleCooldownInfluence(event: Event): void {
  const step = ordinary.value;
  if (step === undefined || step.parameters.scope !== 'global') return;
  const enabled = (event.target as HTMLInputElement).checked;
  updateOrdinary({
    ...step.parameters,
    ...(enabled
      ? { influenceSkillCooldownSeconds: { kind: 'constant' as const, value: 0 } }
      : { influenceSkillCooldownSeconds: undefined }),
  });
}

function setCooldownInfluence(influenceSkillCooldownSeconds: ActionValueOperand): void {
  const step = ordinary.value;
  if (step === undefined || step.parameters.scope !== 'global') return;
  updateOrdinary({ ...step.parameters, influenceSkillCooldownSeconds });
}

function setCurveKind(event: Event): void {
  const step = ordinary.value;
  if (step === undefined) return;
  const kind = (event.target as HTMLSelectElement).value as TimeScaleCurveDefinition['kind'];
  const curve: TimeScaleCurveDefinition =
    kind === 'named'
      ? { kind, key: 'RESETto1' }
      : {
          kind,
          keys: [
            {
              time: 0,
              value: 1,
              inTangent: 0,
              outTangent: 0,
              weightedMode: 0,
              inWeight: 0,
              outWeight: 0,
            },
            {
              time: 1,
              value: 1,
              inTangent: 0,
              outTangent: 0,
              weightedMode: 0,
              inWeight: 0,
              outWeight: 0,
            },
          ],
        };
  updateOrdinary({ ...step.parameters, curve });
}

function setNamedCurveKey(event: Event): void {
  const step = ordinary.value;
  if (step === undefined || step.parameters.curve.kind !== 'named') return;
  updateOrdinary({
    ...step.parameters,
    curve: { kind: 'named', key: (event.target as HTMLInputElement).value },
  });
}

function setInlineCurveKeys(keys: readonly TimeScaleCurveKeyDefinition[]): void {
  const step = ordinary.value;
  if (step === undefined || step.parameters.curve.kind !== 'inline') return;
  updateOrdinary({ ...step.parameters, curve: { kind: 'inline', keys } });
}

function replaceCurveKey(index: number, key: TimeScaleCurveKeyDefinition): void {
  const step = ordinary.value;
  if (step === undefined || step.parameters.curve.kind !== 'inline') return;
  const keys = [...step.parameters.curve.keys];
  if (keys[index] === undefined) return;
  keys[index] = key;
  updateOrdinary({ ...step.parameters, curve: { kind: 'inline', keys } });
}

function setCurveKeyNumber(
  index: number,
  field: keyof Pick<
    TimeScaleCurveKeyDefinition,
    'time' | 'value' | 'inTangent' | 'outTangent' | 'inWeight' | 'outWeight'
  >,
  event: Event,
): void {
  const step = ordinary.value;
  const value = numberFrom(event);
  if (step === undefined || step.parameters.curve.kind !== 'inline' || value === undefined) return;
  const key = step.parameters.curve.keys[index];
  if (key !== undefined) replaceCurveKey(index, { ...key, [field]: value });
}

function setWeightedMode(index: number, event: Event): void {
  const step = ordinary.value;
  const weightedMode = Number((event.target as HTMLSelectElement).value) as 0 | 1 | 2 | 3;
  if (step === undefined || step.parameters.curve.kind !== 'inline') return;
  const key = step.parameters.curve.keys[index];
  if (key !== undefined) replaceCurveKey(index, { ...key, weightedMode });
}

function appendCurveKey(): void {
  const step = ordinary.value;
  if (step === undefined || step.parameters.curve.kind !== 'inline') return;
  const previous = step.parameters.curve.keys.at(-1);
  const key: TimeScaleCurveKeyDefinition = {
    time: (previous?.time ?? -1) + 1,
    value: previous?.value ?? 1,
    inTangent: 0,
    outTangent: 0,
    weightedMode: 0,
    inWeight: 0,
    outWeight: 0,
  };
  updateOrdinary({
    ...step.parameters,
    curve: { kind: 'inline', keys: [...step.parameters.curve.keys, key] },
  });
}

function removeCurveKey(index: number): void {
  const step = ordinary.value;
  if (
    step === undefined ||
    step.parameters.curve.kind !== 'inline' ||
    step.parameters.curve.keys.length <= 1
  ) {
    return;
  }
  updateOrdinary({
    ...step.parameters,
    curve: {
      kind: 'inline',
      keys: step.parameters.curve.keys.filter((_, keyIndex) => keyIndex !== index),
    },
  });
}

function setUltimatePriority(event: Event): void {
  if (props.step.kind !== 'startUltimateTimeDilation') return;
  const priority = numberFrom(event);
  if (priority === undefined || !Number.isInteger(priority)) return;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, priority } });
}

function setUltimateScale(targetScale: ActionValueOperand): void {
  if (props.step.kind !== 'startUltimateTimeDilation') return;
  emit('update', { ...props.step, parameters: { ...props.step.parameters, targetScale } });
}

function setUltimateIgnoredTarget(target: TimeDilationIgnoreTarget, checked: boolean): void {
  if (props.step.kind !== 'startUltimateTimeDilation') return;
  const ignoredTargets = checked
    ? [...new Set([...props.step.parameters.ignoredTargets, target])]
    : props.step.parameters.ignoredTargets.filter(item => item !== target);
  emit('update', { ...props.step, parameters: { ...props.step.parameters, ignoredTargets } });
}

function setUltimateAbilityEntityQueries(queries: readonly AbilityEntityTargetQuery[]): void {
  if (props.step.kind !== 'startUltimateTimeDilation') return;
  const { ignoredAbilityEntityTargets: _removed, ...parameters } = props.step.parameters;
  emit('update', {
    ...props.step,
    parameters: {
      ...parameters,
      ...(queries.length > 0 ? { ignoredAbilityEntityTargets: queries } : {}),
    },
  });
}
</script>

<template>
  <div v-if="step.kind === 'startUltimateTimeDilation'" class="step-editor__grid">
    <label>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.timeDilationPriority')"
        :help="t('timeline.skillEditing.fieldHelp.timeDilationPriority')"
      />
      <select :value="step.parameters.priority" @change="setUltimatePriority">
        <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </label>
    <label class="step-editor__operand">
      <EditorFieldLabel
        :label="t('timeline.skillEditing.timeDilationTargetScale')"
        :help="t('timeline.skillEditing.fieldHelp.ultimateTargetScale')"
      />
      <ActionValueOperandEditor
        :value="step.parameters.targetScale"
        :labels="operandLabels()"
        @update="setUltimateScale"
      />
    </label>
    <fieldset class="step-editor__operand">
      <legend>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.timeDilationIgnoredTargets')"
          :help="t('timeline.skillEditing.fieldHelp.ultimateIgnoredTargets')"
        />
      </legend>
      <label
        v-for="target in TIME_DILATION_IGNORE_TARGETS"
        :key="target"
        class="step-editor__check"
      >
        <input
          type="checkbox"
          :checked="step.parameters.ignoredTargets.includes(target)"
          @change="setUltimateIgnoredTarget(target, ($event.target as HTMLInputElement).checked)"
        />
        {{ t(`timeline.skillEditing.targets.${target}`) }}
      </label>
    </fieldset>
    <AbilityEntityTargetQueryEditor
      class="step-editor__operand"
      :queries="step.parameters.ignoredAbilityEntityTargets ?? []"
      @update="setUltimateAbilityEntityQueries"
    />
  </div>

  <template v-else>
    <div class="step-editor__grid">
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.timeDilationScope')"
          :help="t('timeline.skillEditing.fieldHelp.timeDilationScope')"
        />
        <select :value="step.parameters.scope" @change="setScope">
          <option value="global">
            {{ t('timeline.skillEditing.timeDilationScopes.global') }}
          </option>
          <option value="entity">
            {{ t('timeline.skillEditing.timeDilationScopes.entity') }}
          </option>
        </select>
      </label>
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.timeDilationSlot')"
          :help="t('timeline.skillEditing.fieldHelp.timeDilationSlot')"
        />
        <select :value="step.parameters.slot" @change="setSlot">
          <option v-for="option in slotOptions" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.timeDilationPriority')"
          :help="t('timeline.skillEditing.fieldHelp.timeDilationPriority')"
        />
        <select :value="step.parameters.priority" @change="setOrdinaryNumber('priority', $event)">
          <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label class="step-editor__operand">
        <EditorFieldLabel
          :label="t('timeline.skillEditing.durationSeconds')"
          :help="t('timeline.skillEditing.fieldHelp.timeDilationDuration')"
        />
        <ActionValueOperandEditor
          :value="step.parameters.durationSeconds"
          :labels="operandLabels()"
          @update="setDuration"
        />
      </label>
      <label class="step-editor__check step-editor__check--field">
        <input
          type="checkbox"
          :checked="step.parameters.finishByAction"
          @change="setFinishByAction"
        />
        <EditorFieldLabel
          :label="t('timeline.skillEditing.timeDilationFinishByAction')"
          :help="t('timeline.skillEditing.fieldHelp.timeDilationFinishByAction')"
        />
      </label>
      <label
        v-if="step.parameters.scope === 'entity'"
        class="step-editor__check step-editor__check--field"
      >
        <input
          type="checkbox"
          :checked="step.parameters.ignoreSlotCheck ?? false"
          @change="setIgnoreSlotCheck"
        />
        <EditorFieldLabel
          :label="t('timeline.skillEditing.timeDilationIgnoreSlotCheck')"
          :help="t('timeline.skillEditing.fieldHelp.timeDilationIgnoreSlotCheck')"
        />
      </label>
      <label
        v-if="step.parameters.scope === 'global'"
        class="step-editor__check step-editor__check--field"
      >
        <input
          type="checkbox"
          :checked="step.parameters.influenceSkillCooldownSeconds !== undefined"
          @change="toggleCooldownInfluence"
        />
        <EditorFieldLabel
          :label="t('timeline.skillEditing.timeDilationInfluenceCooldown')"
          :help="t('timeline.skillEditing.fieldHelp.timeDilationInfluenceCooldown')"
        />
      </label>
      <label
        v-if="
          step.parameters.scope === 'global' &&
          step.parameters.influenceSkillCooldownSeconds !== undefined
        "
        class="step-editor__operand"
      >
        <EditorFieldLabel
          :label="t('timeline.skillEditing.timeDilationCooldownSeconds')"
          :help="t('timeline.skillEditing.fieldHelp.timeDilationCooldownSeconds')"
        />
        <ActionValueOperandEditor
          :value="step.parameters.influenceSkillCooldownSeconds"
          :labels="operandLabels()"
          @update="setCooldownInfluence"
        />
      </label>
    </div>

    <fieldset>
      <legend>
        <EditorFieldLabel
          :label="
            step.parameters.scope === 'global'
              ? t('timeline.skillEditing.timeDilationIgnoredTargets')
              : t('timeline.skillEditing.timeDilationTargets')
          "
          :help="
            step.parameters.scope === 'global'
              ? t('timeline.skillEditing.fieldHelp.timeDilationIgnoredTargets')
              : t('timeline.skillEditing.fieldHelp.timeDilationTargets')
          "
        />
      </legend>
      <label
        v-for="target in step.parameters.scope === 'global'
          ? TIME_DILATION_IGNORE_TARGETS
          : COMBAT_TARGETS"
        :key="target"
        class="step-editor__check"
      >
        <input
          type="checkbox"
          :checked="hasTarget(target)"
          @change="setTarget(target, ($event.target as HTMLInputElement).checked)"
        />
        {{ t(`timeline.skillEditing.targets.${target}`) }}
      </label>
    </fieldset>

    <AbilityEntityTargetQueryEditor
      :queries="
        step.parameters.scope === 'global'
          ? (step.parameters.ignoredAbilityEntityTargets ?? [])
          : (step.parameters.abilityEntityTargets ?? [])
      "
      @update="setOrdinaryAbilityEntityQueries"
    />

    <fieldset class="curve-editor">
      <legend>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.timeDilationCurve')"
          :help="t('timeline.skillEditing.fieldHelp.timeDilationCurve')"
        />
      </legend>
      <div class="curve-editor__kind">
        <select :value="step.parameters.curve.kind" @change="setCurveKind">
          <option value="named">
            {{ t('timeline.skillEditing.timeDilationCurveKinds.named') }}
          </option>
          <option value="inline">
            {{ t('timeline.skillEditing.timeDilationCurveKinds.inline') }}
          </option>
        </select>
        <select
          v-if="step.parameters.curve.kind === 'named'"
          :value="step.parameters.curve.key"
          @change="setNamedCurveKey"
        >
          <option v-for="key in namedCurveOptions" :key="key" :value="key">
            {{ key }}
          </option>
        </select>
      </div>
      <TimeScaleCurveEditor
        v-if="curvePreviewKeys.length > 0"
        class="curve-editor__graph"
        :keys="curvePreviewKeys"
        :readonly="step.parameters.curve.kind === 'named'"
        @update="setInlineCurveKeys"
      />
      <template v-if="step.parameters.curve.kind === 'inline'">
        <div
          v-for="(key, index) in step.parameters.curve.keys"
          :key="index"
          class="curve-editor__key"
        >
          <strong>{{
            t('timeline.skillEditing.timeDilationCurvePoint', { index: index + 1 })
          }}</strong>
          <label
            v-for="field in [
              'time',
              'value',
              'inTangent',
              'outTangent',
              'inWeight',
              'outWeight',
            ] as const"
            :key="field"
          >
            <EditorFieldLabel
              :label="t(`timeline.skillEditing.timeDilationCurveFields.${field}`)"
              :help="t(`timeline.skillEditing.fieldHelp.timeDilationCurveFields.${field}`)"
            />
            <input
              type="number"
              step="0.01"
              :value="key[field]"
              @input="setCurveKeyNumber(index, field, $event)"
            />
          </label>
          <label>
            <EditorFieldLabel
              :label="t('timeline.skillEditing.timeDilationCurveFields.weightedMode')"
              :help="t('timeline.skillEditing.fieldHelp.timeDilationCurveFields.weightedMode')"
            />
            <select :value="key.weightedMode" @change="setWeightedMode(index, $event)">
              <option v-for="mode in [0, 1, 2, 3]" :key="mode" :value="mode">
                {{ t(`timeline.skillEditing.timeDilationWeightedModes.${mode}`) }}
              </option>
            </select>
          </label>
          <button
            type="button"
            :disabled="step.parameters.curve.keys.length <= 1"
            :title="t('timeline.skillEditing.deleteCurvePoint')"
            @click="removeCurveKey(index)"
          >
            <el-icon><Delete /></el-icon>
          </button>
        </div>
        <button type="button" class="curve-editor__add" @click="appendCurveKey">
          <el-icon><Plus /></el-icon>
          {{ t('timeline.skillEditing.addCurvePoint') }}
        </button>
      </template>
    </fieldset>
  </template>
</template>

<style scoped>
.curve-editor__kind {
  display: grid;
  grid-template-columns: minmax(140px, 220px) minmax(0, 1fr);
  gap: 10px;
}

.curve-editor__key {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 8px 14px;
  margin-top: 12px;
  padding: 12px 48px 12px 12px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}

.curve-editor__graph {
  margin-top: 10px;
}

.curve-editor__key > strong {
  grid-column: 1 / -1;
}

.curve-editor__key > label {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(74px, 100px) minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.curve-editor__key > button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
}

.curve-editor__add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  margin-top: 10px;
  padding: 0 12px;
}

@container (max-width: 560px) {
  .curve-editor__kind,
  .curve-editor__key {
    grid-template-columns: 1fr;
  }
}
</style>
