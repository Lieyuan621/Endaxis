import { compileActionNode } from '../src/compiler/actions/combatActionLeafProjection.ts';
import { createActionGraphBuilder } from '../src/compiler/actions/actionGraphBuilder.ts';
import { collectCompiledBuffIds } from '../src/compiler/references/compiledReferences.ts';
import { describe, expect, it } from 'vitest';
import { parseConditionLeafSource } from '../src/source/condition.ts';
import { parseForcedElementalStatusActionSource } from '../src/source/elementalInflictionActions.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const meta = { isEnable: true, priorityLevel: 'Default', priorityOffset: 0, serverActionIndex: 1 };
const parse = (name: string, fields: Record<string, unknown>) =>
  parseConditionLeafSource(
    {
      ...meta,
      $type: `Beyond.Gameplay.Core.Conditions.${name}+Data, Gameplay.Beyond`,
      ...fields,
    },
    'condition',
    {},
  );

describe('条件共享原生枚举读取', () => {
  it.each(['CheckBuffStackNumAdvanced', 'CheckBuffStackNumByTag'])(
    '%s 的查询、计数、比较数字编码一并等价',
    name => {
      const query = { queryType: 'HasAny', tags: [{ tagId: 123 }] };
      const fields = {
        checkTarget: { targetSource: 'Target', targetGroupKey: '' },
        buffStackNumType: 'BuffCount',
        compareType: 'GE',
        value: scalarFixture(2),
        ...(name === 'CheckBuffStackNumAdvanced'
          ? {
              buffSettings: { checkType: 1, buffIdList: [''], tagQuery: query },
              limitSkillCastId: false,
            }
          : { tagQuery: query }),
      };
      expect(
        parse(name, {
          ...fields,
          checkTarget: { targetSource: 0, targetGroupKey: '' },
          buffStackNumType: 0,
          compareType: 3,
        }),
      ).toEqual(parse(name, fields));
    },
  );
});

describe('ForceSpellStatus 精确读取 EnergyShardType', () => {
  const action = {
    ...meta,
    $type: 'Beyond.Gameplay.Core.ForceSpellStatusAction+Data, Gameplay.Beyond',
    source: targetFixture('Source'),
    target: targetFixture('Target'),
    consumedLayer: scalarFixture(2),
    count: scalarFixture(1),
    consumedType: scalarFixture(2),
    isExtra: false,
  };
  it('强制反应保留单个原生动作边界及隐式Buff依赖', () => {
    const source = parseForcedElementalStatusActionSource(
      { ...action, spellStatusType: 'Fire', isExtra: true },
      'force',
      {},
    );
    const steps = compileActionNode(
      {
        sourcePath: 'force',
        metadata: {
          nativeType: action.$type,
          nativeName: 'ForceSpellStatusAction',
          enabled: true,
          priorityLevel: 'Default',
          priorityOffset: 0,
          serverActionIndex: 1,
        },
        body: { kind: 'leaf', value: { family: 'forcedElementalStatus', action: source } },
      },
      new Set(),
      new Map(),
      {
        graph: createActionGraphBuilder(),
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      },
    );
    expect(steps).toEqual([
      {
        kind: 'forceSpellStatus',
        parameters: {
          target: 'enemy',
          element: 'heat',
          consumedElement: 'cryo',
          consumedLayers: { kind: 'constant', value: 2 },
          count: { kind: 'constant', value: 1 },
          isExtra: true,
        },
      },
    ]);
    expect([...collectCompiledBuffIds(steps)]).toEqual(['buff_common_fire_fire_burning_triggered']);
  });
  it.each([
    [0, 'Fire'],
    [3, 'Natural'],
  ])('%s / %s 不套用含 Physical 的伤害枚举', (value, name) => {
    expect(
      parseForcedElementalStatusActionSource({ ...action, spellStatusType: value }, 'force', {}),
    ).toEqual(
      parseForcedElementalStatusActionSource({ ...action, spellStatusType: name }, 'force', {}),
    );
  });
  it.each([4, 'Physical', '0'])('不把标记成员/其他类型当成法术状态：%j', value => {
    expect(() =>
      parseForcedElementalStatusActionSource({ ...action, spellStatusType: value }, 'force', {}),
    ).toThrow('spellStatusType');
  });
});
