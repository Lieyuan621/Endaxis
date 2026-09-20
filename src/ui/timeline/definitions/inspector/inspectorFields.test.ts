import { effectScope, shallowRef } from 'vue';
import { describe, expect, it } from 'vitest';
import {
  applyBuffInspectorFields,
  applyBuffAssignmentFields,
  validateComparisonInspector,
  validateApplyBuffInspector,
  type ApplyBuffParameters,
  type ActionValueComparison,
} from './combatInspectorFields';
import { inspectorField, inspectorFieldIssues } from './inspectorFields';
import { useDefinitionDraftHistory } from '../useDefinitionDraftHistory';

import { conditionInspectorFields } from './conditionInspectorSchema';
const actionValueComparisonFields = conditionInspectorFields('actionValueCompare')!;
const poiseCompareFields = conditionInspectorFields('poiseCompare')!;
const enemySuperArmorCompareFields = conditionInspectorFields('enemySuperArmorCompare')!;
const currentBuffStackCompareFields = conditionInspectorFields('currentBuffStackCompare')!;
const cameraToTargetAngleCompareFields = conditionInspectorFields('cameraToTargetAngleCompare')!;
const abilityEntityRemainingDurationCompareFields = conditionInspectorFields(
  'abilityEntityRemainingDurationCompare',
)!;
const probabilityFields = conditionInspectorFields('probability')!;
describe('元数据字段编辑', () => {
  it('失衡条件保持必填布尔值和完整动态操作数', () => {
    const original = {
      kind: 'poiseCompare' as const,
      target: 'enemy' as const,
      operator: 'greater' as const,
      returnValueIfMissing: false,
      value: { kind: 'blackboard' as const, key: 'poise', fallback: 0 },
    };
    const fallback = poiseCompareFields.find(field => field.key === 'returnValueIfMissing')!;
    expect(fallback.optional).not.toBe(true);
    expect(fallback.toggle(original, false)).toBe(original);
    expect(fallback.write(original, true)).toEqual({ ...original, returnValueIfMissing: true });
    expect(
      poiseCompareFields.find(field => field.key === 'target')!.write(original, 'caster'),
    ).toEqual({ ...original, target: 'caster' });
  });

  it('剩余时长比较显式编辑可选输出键，不改动比较值', () => {
    const original = {
      kind: 'abilityEntityRemainingDurationCompare' as const,
      operator: 'greater' as const,
      value: { kind: 'constant' as const, value: 0 },
    };
    const output = abilityEntityRemainingDurationCompareFields.find(
      field => field.key === 'outputKey',
    )!;
    const enabled = output.toggle(original, true);
    expect(enabled.outputKey).toBe('');
    expect(output.write(enabled, 'remaining')).toEqual({ ...original, outputKey: 'remaining' });
    expect(output.write(enabled, 12)).toBe(enabled);
    expect(output.toggle(enabled, false)).toEqual(original);
    expect(
      inspectorFieldIssues(validateComparisonInspector(enabled), 'outputKey').length,
    ).toBeGreaterThan(0);
  });

  it('比较控件共享枚举和帮助语义，各类条件保留独立字段标签', () => {
    for (const fields of [
      poiseCompareFields,
      enemySuperArmorCompareFields,
      currentBuffStackCompareFields,
      cameraToTargetAngleCompareFields,
      abilityEntityRemainingDurationCompareFields,
    ]) {
      expect(fields.find(field => field.key === 'operator')?.options).toEqual(
        actionValueComparisonFields.find(field => field.key === 'operator')?.options,
      );
      expect(fields.find(field => field.key === 'value')?.editor).toBe('actionValue');
    }
    expect(
      probabilityFields[0]!.write(
        { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
        { kind: 'blackboard', key: 'chance', fallback: 0 },
      ),
    ).toEqual({
      kind: 'probability',
      probability: { kind: 'blackboard', key: 'chance', fallback: 0 },
    });
  });
  it('切换动态 Buff 引用与关联字段清理是同一个可撤销操作', () => {
    const original: ApplyBuffParameters = {
      buffId: 'custom',
      target: 'enemy',
      durationSeconds: 0,
      effectiveness: 1,
      definition: { durationSeconds: 3, stackingType: 'refresh' },
      blackboardAssignments: {
        levels: [1, 2, 3],
        source: { kind: 'blackboard', key: 'atk', fallback: 4 },
      },
    };
    const field = applyBuffInspectorFields.find(field => field.key === 'buffId')!;
    expect(field.write(original, 3)).toBe(original);
    const next = field.write(original, { blackboardKey: 'buff' });
    expect(next).not.toHaveProperty('definition');
    expect(next).not.toHaveProperty('durationSeconds');
    expect(next).not.toHaveProperty('effectiveness');
    expect(next.blackboardAssignments).toEqual(original.blackboardAssignments);
    expect(original.definition).toBeDefined();
    const scope = effectScope();
    const value = shallowRef(original);
    const history = scope.run(() =>
      useDefinitionDraftHistory(
        () => value.value,
        next => {
          value.value = next;
        },
      ),
    )!;
    try {
      history.commit(next, { path: 'steps[0]' });
      history.restore('undo');
      expect(value.value).toEqual(original);
      history.restore('redo');
      expect(value.value).toEqual(next);
      expect(history.restoredLocation?.value?.path).toBe('steps[0]');
    } finally {
      scope.stop();
    }
  });

  it('赋值字段完整传递逐级数组、零值和动态引用，空字典恢复省略', () => {
    const original: ApplyBuffParameters = { buffId: 'custom', target: 'enemy' };
    const field = applyBuffAssignmentFields[0];
    expect(field.toggle(original, true).blackboardAssignments).toEqual({});
    const assignments = {
      levels: [1, 2, 3],
      zero: 0,
      expression: { kind: 'blackboard' as const, key: 'atk', fallback: 4 },
    };
    const next = field.write(original, assignments);
    expect(next.blackboardAssignments).toEqual(assignments);
    expect(original).not.toHaveProperty('blackboardAssignments');
    expect(field.write(next, {})).not.toHaveProperty('blackboardAssignments');
    expect(field.toggle(next, false)).not.toHaveProperty('blackboardAssignments');
    expect(field.write(next, [])).toBe(next);
    const errors = validateApplyBuffInspector(
      field.write(original, { bad: { kind: 'blackboard', key: '' } }),
    );
    expect(inspectorFieldIssues(errors, 'blackboardAssignments').length).toBeGreaterThan(0);
  });
  it('可选字段区分省略、0 和 false；未知字段和原对象保持不变', () => {
    const original: ApplyBuffParameters = {
      buffId: 'custom',
      target: 'enemy',
      blackboardAssignments: { a: [1, 2] },
    };
    const duration = applyBuffInspectorFields.find(field => field.key === 'durationSeconds')!;
    const enabled = duration.toggle(original, true);
    expect(enabled.durationSeconds).toBe(0);
    expect(duration.toggle(enabled, false)).not.toHaveProperty('durationSeconds');
    expect(original).not.toHaveProperty('durationSeconds');
    expect(enabled.blackboardAssignments).toEqual(original.blackboardAssignments);
    const inherit = applyBuffInspectorFields.find(
      field => field.key === 'inheritSourceSkillCastInfo',
    )!;
    expect(inherit.toggle(original, true).inheritSourceSkillCastInfo).toBe(false);
    expect(duration.write(enabled, NaN)).toBe(enabled);
    expect(
      duration.toggle({ ...original, buffId: { blackboardKey: 'buff' } }, true),
    ).not.toHaveProperty('durationSeconds');
  });

  it('下拉框复用契约枚举；修改通过共享历史恢复到原节点', () => {
    const scope = effectScope();
    const original: ActionValueComparison = {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'test' },
      operator: 'greater',
      right: { kind: 'constant', value: 0.5 },
    };
    const value = shallowRef(original);
    const history = scope.run(() =>
      useDefinitionDraftHistory(
        () => value.value,
        next => {
          value.value = next;
        },
      ),
    )!;
    try {
      const field = actionValueComparisonFields.find(field => field.key === 'operator')!;
      expect(field.write(original, 'not-an-operator')).toBe(original);
      const location = {
        objectId: 'buff-a',
        path: 'lifecycleSequences.start.steps[0].parameters.condition',
      };
      history.commit(field.write(original, 'equal'), location);
      location.objectId = 'later-browsed-buff';
      history.restore('undo');
      expect(value.value).toEqual(original);
      expect(history.restoredLocation?.value?.objectId).toBe('buff-a');
      history.restore('redo');
      expect(value.value.operator).toBe('equal');
      expect(history.restoredLocation?.value?.objectId).toBe('buff-a');
    } finally {
      scope.stop();
    }
  });

  it('字段错误来自现有校验器，复合值错误归属其父字段', () => {
    const errors = validateComparisonInspector({
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: '' },
      operator: 'greater',
      right: { kind: 'constant', value: 1 },
    });
    expect(inspectorFieldIssues(errors, 'left').length).toBeGreaterThan(0);
    expect(inspectorFieldIssues(errors, 'right')).toEqual([]);
    const buffErrors = validateApplyBuffInspector({
      buffId: 'custom',
      target: 'enemy',
      count: { kind: 'blackboard', key: '' },
    });
    expect(inspectorFieldIssues(buffErrors, 'count').length).toBeGreaterThan(0);
  });
});

// 类型检查禁止字段拼写错误、数值字段使用枚举控件和越界枚举选项。
function checkFieldTypes() {
  const field = inspectorField<ActionValueComparison>();
  // @ts-expect-error 不存在的字段
  field('missing', { editor: 'number', labelKey: 'test' });
  // @ts-expect-error 操作数不能绑定数值输入框
  field('left', { editor: 'number', labelKey: 'test' });
  // @ts-expect-error 只接受数值操作数的字段不能写入逐级字典
  field('left', { editor: 'buffAssignments', labelKey: 'test' });
  // @ts-expect-error 枚举字段不能绕过候选范围绑定自由文本
  field('operator', { editor: 'text', labelKey: 'test' });
  field('operator', {
    editor: 'enum',
    // @ts-expect-error 枚举不能接受任意字符串
    options: ['invalid'],
    optionLabelPrefix: '',
    labelKey: 'test',
  });
}
void checkFieldTypes;
