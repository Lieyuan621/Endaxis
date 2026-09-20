import type {
  CombatStepDefinition,
  CombatStepParameters,
} from '../../../../../packages/game-data-contract/src/actions';
import { validateActionSequenceDefinition } from '../../../../core/game-data/validation/actionPrograms';
import { stepStructure } from './stepStructure.generated';
import { parameterInspectorField } from './parameterInspectorSchema';
import { createInspectorField, type InspectorField } from './inspectorFields';

type DisplayAnnotation = Partial<
  Pick<InspectorField<object>, 'labelKey' | 'helpKey' | 'optionLabelPrefix'>
>;
type StepAnnotations = {
  [K in keyof CombatStepParameters]?: Partial<
    Record<keyof CombatStepParameters[K], DisplayAnnotation>
  >;
};
/** 只缩写本地 i18n 前缀；不包含类型、枚举候选、默认值或写入函数。 */
function display(label?: string, options?: string, help?: string): DisplayAnnotation {
  const prefix = 'timeline.skillEditing.';
  return {
    ...(label ? { labelKey: prefix + label } : {}),
    ...(options ? { optionLabelPrefix: prefix + options + '.' } : {}),
    ...(help ? { helpKey: prefix + help } : {}),
  };
}
const buffOutput = display('assignmentTargetKey', undefined, 'buffRuntimeContextHelp');
const sourceArithmetic = {
  useFloor: display('sourceUseFloor', undefined, 'sourceArithmeticHelp'),
  divisor: display('sourceDivisor'),
  multiplier: display('sourceMultiplier'),
  base: display('sourceBase'),
  targetKey: display('assignmentTargetKey'),
};
/** 步骤名与字段名由契约约束；显示差异是数据，不用 if 链实现。 */
const stepAnnotations = {
  setCurrentBuffRemainingDuration: {
    operation: display('operation', 'buffDurationOperations', 'buffRuntimeContextHelp'),
    value: display('buffRemainingOperand', undefined, 'buffRuntimeContextHelp'),
  },
  finishCurrentBuff: {
    reason: display('buffFinishReason', 'buffFinishReasons', 'buffRuntimeContextHelp'),
    finishSource: display('buffSource', 'actionContextIdentities', 'buffRuntimeContextHelp'),
  },
  setCurrentBuffTimePaused: {
    paused: display('buffTimePaused', undefined, 'buffRuntimeContextHelp'),
  },
  readEventBuffBlackboard: { outputKey: buffOutput },
  readCurrentBuffRemainingDuration: { outputKey: buffOutput },
  readBuffRemainingDuration: { outputKey: buffOutput },
  readAbilityEntityRemainingDuration: { outputKey: display('assignmentTargetKey') },
  setAbilityEntityRemainingDuration: { value: display('entityRemainingSeconds') },
  startCurrentAbilityEntityChildSkillById: { childSkillId: display('entityTemplateChildSkillId') },
  storeSourceAttributeValue: {
    ...sourceArithmetic,
    attribute: display('sourceAttributeSelector', 'sourceAttributeKinds'),
    stage: display('sourceAttributeStage', 'sourceAttributeStages'),
  },
  storeEntityPropertyValue: {
    ...sourceArithmetic,
    property: display('sourceEntityProperty', 'sourceEntityProperties'),
  },
  setIgnoreGlobalTimeScale: {
    abilityEntityTargets: display(
      'abilityEntityTimeDilationQueries',
      'abilityEntityQueryKinds',
      'ignoreGlobalTimeScaleHelp',
    ),
    ignore: display('ignoreGlobalTimeScale'),
    revertOnEnd: display('revertTimeScaleOnEnd'),
  },
  adjustSkillCooldown: {
    skill: display(
      'cooldownSkillSelector',
      'cooldownSkillSelectorKinds',
      'fieldHelp.cooldownSkillSelector',
    ),
    operation: display(undefined, 'cooldownOperations', 'fieldHelp.cooldownOperation'),
    basis: display('cooldownBasis', 'cooldownBases', 'fieldHelp.cooldownBasis'),
    value: display(undefined, undefined, 'fieldHelp.cooldownValue'),
  },
  setHealthFloor: {
    mode: display('healthFloorMode', 'healthFloorModes'),
    value: display('healthFloorValue', undefined, 'healthFloorHelp'),
  },
  storeEventSpGainAmount: { outputKey: display('spValueOutputKey') },
  storeShieldValue: {
    target: display('target', 'actionContextIdentities'),
    value: display('capturedShieldValue', 'shieldCaptureValues'),
  },
} satisfies StepAnnotations;

/** 完整参数联合整体替换；子序列和定义不进入参数表单。 */
export function stepInspectorFields<K extends keyof CombatStepParameters>(
  kind: K,
): readonly InspectorField<Readonly<CombatStepParameters[K]>>[] | undefined {
  const shape = stepStructure[kind];
  if (shape.type === 'union') {
    type Parameters = Readonly<CombatStepParameters[K]>;
    const field = createInspectorField<{ value: Parameters }>('value', {
      editor: 'union',
      variants: shape.variants,
      labelKey: 'timeline.skillEditing.stepParameters',
    });
    return [
      {
        ...field,
        key: '',
        disabled: undefined,
        read: (value: Parameters) => value,
        write: (value: Parameters, input: unknown) => field.write({ value }, input).value,
        toggle: (value: Parameters) => value,
      },
    ];
  }
  if (shape.type !== 'object') return undefined;
  return Object.entries(shape.properties).map(([key, field]) => {
    const result = parameterInspectorField<Readonly<CombatStepParameters[K]>>(
      key,
      field,
      key === 'value' ? 'value' : undefined,
    );
    const annotation = (
      (stepAnnotations as StepAnnotations)[kind] as
        Readonly<Record<string, DisplayAnnotation>> | undefined
    )?.[key];
    const annotated = { ...result, ...annotation };
    // 联动规则不是显示注解：沿用旧面板的一次写入，不重复声明字段结构。
    if (kind === 'adjustSkillCooldown' && key === 'operation')
      return {
        ...annotated,
        write(value, input) {
          const next = result.write(value, input);
          return next !== value && input === 'reduce'
            ? { ...next, basis: 'baseDurationRatio' }
            : next;
        },
      };
    if (kind === 'adjustSkillCooldown' && key === 'basis')
      return {
        ...annotated,
        disabled: value => 'operation' in value && value.operation === 'reduce',
      };
    return annotated;
  });
}

export function validateStepInspector(step: CombatStepDefinition) {
  const prefix = '.steps[0].parameters';
  return validateActionSequenceDefinition({ steps: [step] }, '')
    .filter(issue => issue.path === prefix || issue.path.startsWith(prefix + '.'))
    .map(issue => ({
      ...issue,
      path: issue.path === prefix ? '' : issue.path.slice(prefix.length + 1),
    }));
}
