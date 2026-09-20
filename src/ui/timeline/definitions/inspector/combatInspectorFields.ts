import {
  BUFF_APPLICATION_TARGETS,
  COMBAT_TARGETS,
  type CombatCondition,
  type CombatStepParameters,
} from '../../../../core/game-data/operatorDefinition';
import { validateCombatConditionDefinition } from '../../../../core/game-data/validateSkillDefinition';
import { validateActionSequenceDefinition } from '../../../../core/game-data/validation/actionPrograms';
import { inspectorField } from './inspectorFields';

export type ApplyBuffParameters = Readonly<CombatStepParameters['applyBuff']>;
export type ActionValueComparison = Extract<CombatCondition, { kind: 'actionValueCompare' }>;
const buff = inspectorField<ApplyBuffParameters>();
const prefix = 'timeline.skillEditing.';

/** 引用方式变更的关联清理只执行一次，并与引用本身一起进入历史。 */
export function replaceApplyBuffReference(
  value: ApplyBuffParameters,
  buffId: ApplyBuffParameters['buffId'],
): ApplyBuffParameters {
  const next = { ...value, buffId };
  if (typeof buffId !== 'string') {
    delete next.definition;
    delete next.durationSeconds;
    delete next.effectiveness;
  }
  return next;
}

/** 通用字段和复合字段共用提交边界；内联蓝图仍由定义编辑器承担。 */
export const applyBuffInspectorFields = [
  buff('buffId', {
    editor: 'stringReference',
    labelKey: `${prefix}buffId`,
    helpKey: `${prefix}fieldHelp.buffId`,
    replace: replaceApplyBuffReference,
  }),
  buff('target', {
    editor: 'enum',
    options: BUFF_APPLICATION_TARGETS,
    optionLabelPrefix: `${prefix}buffTargets.`,
    labelKey: `${prefix}target`,
    helpKey: `${prefix}fieldHelp.buffTarget`,
  }),
  buff('count', {
    editor: 'actionValue',
    optional: true,
    create: () => ({ kind: 'constant', value: 1 }),
    labelKey: `${prefix}buffCount`,
    helpKey: `${prefix}fieldHelp.buffCount`,
  }),
  buff('source', {
    editor: 'enum',
    options: COMBAT_TARGETS,
    optionLabelPrefix: `${prefix}targets.`,
    optional: true,
    create: () => 'caster',
    labelKey: `${prefix}buffSource`,
    helpKey: `${prefix}fieldHelp.buffSource`,
    replace(value, source) {
      const next = { ...value, source };
      if (source !== undefined) delete next.sourceContextKey;
      return next;
    },
  }),
  buff('sourceContextKey', {
    editor: 'text',
    optional: true,
    create: () => 'source',
    labelKey: `${prefix}buffSourceContextKey`,
    helpKey: `${prefix}fieldHelp.buffSourceContextKey`,
    replace(value, sourceContextKey) {
      const next = { ...value, sourceContextKey };
      if (sourceContextKey !== undefined) delete next.source;
      return next;
    },
  }),
  buff('durationSeconds', {
    editor: 'number',
    optional: true,
    create: () => 0,
    disabled: value => typeof value.buffId !== 'string',
    labelKey: `${prefix}durationSeconds`,
    helpKey: `${prefix}fieldHelp.buffDuration`,
  }),
  buff('effectiveness', {
    editor: 'number',
    optional: true,
    create: () => 1,
    disabled: value => typeof value.buffId !== 'string',
    labelKey: `${prefix}effectiveness`,
    helpKey: `${prefix}fieldHelp.buffEffectiveness`,
  }),
  buff('inheritSourceSkillCastInfo', {
    editor: 'boolean',
    optional: true,
    create: () => false,
    labelKey: `${prefix}inheritSkillCast`,
    helpKey: `${prefix}fieldHelp.inheritSkillCast`,
  }),
] as const;

export const applyBuffAssignmentFields = [
  buff('blackboardAssignments', {
    editor: 'buffAssignments',
    labelKey: `${prefix}buffAssignments`,
    helpKey: `${prefix}fieldHelp.buffAssignments`,
    optional: true,
    create: () => ({}),
    replace(value, input) {
      const next = { ...value };
      if (Object.keys(input).length === 0) delete next.blackboardAssignments;
      else next.blackboardAssignments = input;
      return next;
    },
  }),
] as const;

export function validateApplyBuffInspector(parameters: ApplyBuffParameters) {
  const root = '.steps[0].parameters.';
  return validateActionSequenceDefinition({ steps: [{ kind: 'applyBuff', parameters }] }, '').map(
    issue => ({
      ...issue,
      path: issue.path.startsWith(root) ? issue.path.slice(root.length) : issue.path,
    }),
  );
}

export function validateComparisonInspector(value: CombatCondition) {
  return validateCombatConditionDefinition(value, '').map(issue => ({
    ...issue,
    path: issue.path.replace(/^\./, ''),
  }));
}
