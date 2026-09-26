import { describe, expect, it } from 'vitest';
import type {
  ActionGraphDefinition,
  ActionGraphNode,
  ActionGraphReference,
} from '../../../../packages/game-data-contract/src/actionGraph.ts';
import type { CombatCondition } from '../../../../packages/game-data-contract/src/conditions.ts';
import { projectPureDamageModifierCondition } from '../../src/compiler/conditions/damageModifierConditionProjection.ts';

const empty: ActionGraphReference = { $sequence: null };
const cast: CombatCondition = { kind: 'eventSkillCastMatchesBuffSource' };
const tags: CombatCondition = {
  kind: 'eventDamageTagsMatch',
  match: 'hasAny',
  tags: ['normalSkill'],
};

/** 手工图夹具：guard 把条件包成 conditional 节点；其余链式节点依次给出。 */
function project(build: (nodes: Record<string, ActionGraphNode>) => ActionGraphReference) {
  const nodes: Record<string, ActionGraphNode> = {};
  const entry = build(nodes);
  const graph: ActionGraphDefinition = { nodes };
  return projectPureDamageModifierCondition(graph, entry, 'modifier.condition');
}
const guard = (condition: CombatCondition, whenTrue: ActionGraphReference = empty) =>
  project(nodes => {
    nodes.guard = {
      action: { kind: 'conditional', parameters: { condition }, whenTrue },
      next: null,
    };
    return { $sequence: 'guard' };
  });

describe('伤害修正只在公共动作程序可无损降低时使用纯条件运行协议', () => {
  it('空序列为真，尾条件不能丢失', () => {
    expect(project(() => empty)).toBeUndefined();
    expect(guard(cast)).toEqual({ kind: 'sourceSkillCastMatch' });
    expect(guard({ kind: 'constant', value: false })).toEqual({
      kind: 'buffBlackboardCompare',
      left: 1,
      operator: 'equal',
      right: 0,
    });
  });

  it('串联守卫保留短路顺序，并消除协议适配产生的冗余嵌套', () => {
    expect(
      project(nodes => {
        nodes.inner = {
          action: { kind: 'conditional', parameters: { condition: tags }, whenTrue: empty },
          next: null,
        };
        nodes.outer = {
          action: {
            kind: 'conditional',
            parameters: { condition: cast },
            whenTrue: { $sequence: 'inner' },
          },
          next: null,
        };
        return { $sequence: 'outer' };
      }),
    ).toEqual({
      kind: 'all',
      conditions: [{ kind: 'sourceSkillCastMatch' }, tags],
    });
  });

  it('纯布尔分支保留假分支的返回值', () => {
    expect(
      project(nodes => {
        nodes.innerTrue = {
          action: { kind: 'conditional', parameters: { condition: tags }, whenTrue: empty },
          next: null,
        };
        nodes.innerFalse = {
          action: {
            kind: 'conditional',
            parameters: { condition: { kind: 'constant', value: false } },
            whenTrue: empty,
          },
          next: null,
        };
        nodes.root = {
          action: {
            kind: 'conditional',
            parameters: { condition: cast },
            whenTrue: { $sequence: 'innerTrue' },
            whenFalse: { $sequence: 'innerFalse' },
          },
          next: null,
        };
        return { $sequence: 'root' };
      }),
    ).toEqual({ kind: 'all', conditions: [{ kind: 'sourceSkillCastMatch' }, tags] });
  });

  it.each(['whenTrue', 'whenFalse'] as const)('alwaysNext 不能使 %s 的黑板写入消失', branch => {
    expect(() =>
      project(nodes => {
        nodes.write = {
          action: {
            kind: 'modifyActionValue',
            parameters: {
              key: 'real_imbue_scale',
              operation: 'assign',
              value: { kind: 'constant', value: 0.5 },
            },
          },
          next: null,
        };
        nodes.guard = {
          action: {
            kind: 'conditional',
            parameters: { condition: tags, alwaysNext: true },
            whenTrue: empty,
            [branch]: { $sequence: 'write' },
          },
          next: null,
        };
        return { $sequence: 'guard' };
      }),
    ).toThrow('cannot discard side effects');
  });

  it('具有输出键的条件也不能冒充纯读取', () => {
    expect(() =>
      guard({
        kind: 'abilityEntityRemainingDurationCompare',
        operator: 'greater',
        value: { kind: 'constant', value: 0 },
        outputKey: 'duration',
      }),
    ).toThrow('requires a shared context runtime');
  });

  it('保留混合标签、特征、取反和黑板比较，不再次解析原生数值枚举', () => {
    expect(
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
