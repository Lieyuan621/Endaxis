import { describe, expect, it } from 'vitest';
import type { ActionSequenceDefinition } from '../../../../packages/game-data-contract/src/actions.ts';
import type { CombatCondition } from '../../../../packages/game-data-contract/src/conditions.ts';
import { projectPureDamageModifierCondition } from '../../src/compiler/conditions/damageModifierConditionProjection.ts';

const empty: ActionSequenceDefinition = { steps: [] };
const guard = (condition: CombatCondition, whenTrue = empty): ActionSequenceDefinition => ({
  steps: [{ kind: 'conditional', parameters: { condition }, whenTrue }],
});
const cast: CombatCondition = { kind: 'eventSkillCastMatchesBuffSource' };
const tags: CombatCondition = {
  kind: 'eventDamageTagsMatch',
  match: 'hasAny',
  tags: ['normalSkill'],
};
const project = (sequence: ActionSequenceDefinition) =>
  projectPureDamageModifierCondition(sequence, 'modifier.condition');

describe('伤害修正只在公共动作程序可无损降低时使用纯条件运行协议', () => {
  it('空序列为真，尾条件不能丢失', () => {
    expect(project(empty)).toBeUndefined();
    expect(project(guard(cast))).toEqual({ kind: 'sourceSkillCastMatch' });
    expect(project(guard({ kind: 'constant', value: false }))).toEqual({
      kind: 'buffBlackboardCompare',
      left: 1,
      operator: 'equal',
      right: 0,
    });
  });

  it('串联守卫保留短路顺序，并消除协议适配产生的冗余嵌套', () => {
    expect(project(guard(cast, guard(tags)))).toEqual({
      kind: 'all',
      conditions: [{ kind: 'sourceSkillCastMatch' }, tags],
    });
  });

  it('纯布尔分支保留假分支的返回值', () => {
    expect(
      project({
        steps: [
          {
            kind: 'conditional',
            parameters: { condition: cast },
            whenTrue: guard(tags),
            whenFalse: guard({ kind: 'constant', value: false }),
          },
        ],
      }),
    ).toEqual({ kind: 'all', conditions: [{ kind: 'sourceSkillCastMatch' }, tags] });
  });

  it.each(['whenTrue', 'whenFalse'] as const)('alwaysNext 不能使 %s 的黑板写入消失', branch => {
    const sequence: ActionSequenceDefinition = {
      steps: [
        {
          kind: 'conditional',
          parameters: { condition: tags, alwaysNext: true },
          whenTrue: empty,
          [branch]: {
            steps: [
              {
                kind: 'modifyActionValue',
                parameters: {
                  key: 'real_imbue_scale',
                  operation: 'assign',
                  value: { kind: 'constant', value: 0.5 },
                },
              },
            ],
          },
        },
      ],
    };
    expect(() => project(sequence)).toThrow('cannot discard side effects');
  });

  it('具有输出键的条件也不能冒充纯读取', () => {
    expect(() =>
      project(
        guard({
          kind: 'abilityEntityRemainingDurationCompare',
          operator: 'greater',
          value: { kind: 'constant', value: 0 },
          outputKey: 'duration',
        }),
      ),
    ).toThrow('requires a shared context runtime');
  });

  it('保留混合标签、特征、取反和黑板比较，不再次解析原生数值枚举', () => {
    expect(
      project(
        guard({
          kind: 'any',
          conditions: [
            tags,
            {
              kind: 'not',
              condition: { kind: 'eventDamageFeaturesMatch', match: 'hasAll', features: ['dot'] },
            },
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'ratio' },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
          ],
        }),
      ),
    ).toEqual({
      kind: 'any',
      conditions: [
        tags,
        {
          kind: 'not',
          condition: { kind: 'eventDamageFeaturesMatch', match: 'hasAll', features: ['dot'] },
        },
        {
          kind: 'buffBlackboardCompare',
          left: { blackboardKey: 'ratio' },
          operator: 'greater',
          right: 0,
        },
      ],
    });
  });
});
