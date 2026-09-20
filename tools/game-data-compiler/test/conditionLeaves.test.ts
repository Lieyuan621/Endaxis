import { describe, expect, it } from 'vitest';

import { parseConditionLeafSource } from '../src/index.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const CONDITION_META = {
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 2,
} as const;

describe('公共条件叶子 IR', () => {
  it('严格保留 OnObtainAtb 的获取类型与方式筛选', () => {
    expect(
      parseConditionLeafSource(
        condition('CheckObtainAtbType', {
          checkObtainType: true,
          obtainTypeList: ['Skill'],
          checkObtainMethod: true,
          obtainMethodList: ['Gain'],
        }),
        'fixture.obtainAtbType',
        {},
      ),
    ).toMatchObject({
      kind: 'obtainAtbType',
      checkObtainType: true,
      obtainTypes: ['Skill'],
      checkObtainMethod: true,
      obtainMethods: ['Gain'],
    });
  });

  it('保留被动 CheckCurHpRatio 的比较与黑板阈值', () => {
    expect(
      parseConditionLeafSource(
        {
          $type: 'Beyond.Gameplay.Core.Abilities.Condition.CheckCurHpRatio, Gameplay.Beyond',
          compareType: 'GE',
          value: scalarFixture(0, 'hp_ratio'),
        },
        'passive.toggle.conditions[0]',
        { hp_ratio: [0.5, 1] },
      ),
    ).toMatchObject({
      kind: 'currentHpRatio',
      comparison: 'GE',
      value: { blackboardKey: 'hp_ratio', levelValues: [0.5, 1] },
    });
  });

  it.each([
    {
      name: '浮点黑板比较',
      value: condition('CompareFloat', {
        compare: 'GT',
        valueA: scalarFixture(0, 'talent_enabled'),
        valueB: scalarFixture(0.5),
      }),
      blackboard: { talent_enabled: [0, 1] },
    },
    {
      name: '主控身份',
      value: condition('CheckMainCharacterCondition', {
        checkTarget: { targetSource: 'Owner', targetGroupKey: '' },
      }),
      blackboard: {},
    },
    {
      name: '目标组数量',
      value: condition('CheckEntityNum', {
        checkTarget: { targetSource: 'Context', targetGroupKey: 'targets' },
        minNum: 1,
        compareType: 'GE',
        containsHittableTarget: false,
        excludeDeadEntity: true,
        storeKey: 'target_count',
      }),
      blackboard: {},
    },
    {
      name: 'Buff 高级查询',
      value: condition('CheckBuffStackNumAdvanced', {
        checkTarget: { targetSource: 'Target', targetGroupKey: '' },
        buffSettings: {
          checkType: 'Tag',
          buffIdList: [''],
          tagQuery: { queryType: 'HasAny', tags: [{ tagId: -1480463572 }] },
        },
        buffStackNumType: 'BuffCount',
        compareType: 'GE',
        value: scalarFixture(1),
        limitSkillCastId: false,
      }),
      blackboard: {},
    },
    {
      name: '实体 Tag',
      value: condition('CheckTagMatch', {
        checkTarget: { targetSource: 'Context', targetGroupKey: 'entities' },
        query: { queryType: 'HasAll', tags: [{ tagId: -549424863 }] },
      }),
      blackboard: {},
    },
    {
      name: '定时标记',
      value: condition('CheckTimedMarkerCondition', {
        checkTarget: { targetSource: 'Owner', targetGroupKey: '' },
        id: 'damage_cd',
        blackboardKey: '',
        useBlackboardKey: false,
        returnTrueIfNotExists: true,
      }),
      blackboard: {},
    },
    {
      name: '生命比例',
      value: condition('CheckHp', {
        hpOwner: { targetSource: 'Context', targetGroupKey: 'smart_target' },
        compare: 'LE',
        isRatio: true,
        value: scalarFixture(0.5),
      }),
      blackboard: {},
    },
    {
      name: '距离',
      value: condition('CheckDistanceCondition', {
        source: targetFixture('Owner'),
        target: targetFixture('Target'),
        distance: 8,
        lessThan: true,
        includeTargetRadius: false,
        containsHittableObj: false,
      }),
      blackboard: {},
    },
    {
      name: '概率',
      value: condition('Probablity', { prob: scalarFixture(0, 'proc_chance') }),
      blackboard: { proc_chance: [0.25, 0.5] },
    },
    {
      name: '目标身份相等',
      value: condition('CheckTargetsEqual', {
        firstTargetSettings: targetFixture('Owner'),
        secondTargetSettings: targetFixture('Target'),
      }),
      blackboard: {},
    },
    {
      name: '对象类型',
      value: condition('CheckObjectTypeMatch', {
        target: targetFixture('Target'),
        objectTypeMask: 'Character',
      }),
      blackboard: {},
    },
    {
      name: '敌人等级位集',
      value: condition('CheckEnemyRank', {
        target: targetFixture('Target'),
        enemyRankSet: 'Elite, Boss',
      }),
      blackboard: {},
    },
    {
      name: '霸体值',
      value: condition('CheckSuperArmor', {
        checkTarget: targetFixture('Target'),
        compareType: 'GE',
        value: scalarFixture(0, 'super_armor_threshold'),
      }),
      blackboard: { super_armor_threshold: [10, 20] },
    },
    {
      name: '双方向夹角',
      value: condition('CheckTwoDirectionAngle', {
        dir1Source: targetFixture('Owner'),
        dir1Target: targetFixture('Target'),
        dir1DirectionType: 'TargetDirection',
        dir2Source: targetFixture('Owner'),
        dir2Target: targetFixture('Target'),
        dir2DirectionType: 'SourceForward',
        compareType: 'LE',
        value: scalarFixture(45),
      }),
      blackboard: {},
    },
    {
      name: '能力实体剩余时长',
      value: condition('CheckAbilityEntityCurDuration', {
        abilityEntity: targetFixture('Target'),
        compareType: 'LT',
        value: scalarFixture(3),
        saveCurDuration: false,
        bbKey: '',
      }),
      blackboard: {},
    },
    {
      name: 'OR 组与局部取反',
      value: condition('OrConditionAction', {
        conditionList: [
          {
            actionData: [
              condition('NotNextCheckAction', {}),
              condition('CompareFloat', {
                compare: 'GT',
                valueA: scalarFixture(0, 'enabled'),
                valueB: scalarFixture(0.5),
              }),
              condition('CheckDamageType', { damageType: 'Fire' }),
            ],
            onlyExecuteWhenSourceIsMainChar: false,
            onlyExecuteWhenSourceIsGuard: false,
          },
          {
            actionData: [condition('CheckSkillHasHit', {})],
            onlyExecuteWhenSourceIsMainChar: false,
            onlyExecuteWhenSourceIsGuard: false,
          },
        ],
      }),
      blackboard: { enabled: [0, 1] },
    },
  ])('$name 锁定已验证的对象级结构', ({ value, blackboard }) => {
    const inheritedBlackboard: Record<string, readonly number[]> = {};
    Object.entries(blackboard).forEach(([key, values]) => {
      if (values) inheritedBlackboard[key] = values;
    });
    expect(
      parseConditionLeafSource(value, 'fixture.condition', inheritedBlackboard),
    ).toMatchSnapshot();
  });

  it('未知条件携带原生类型明确阻塞', () => {
    expect(() =>
      parseConditionLeafSource(condition('UnknownNativeCondition', {}), 'fixture.condition', {}),
    ).toThrow('condition parser has not migrated "UnknownNativeCondition"');
  });

  it('按判别字段解析 Advanced 事件 Buff 条件', () => {
    const fixture = (blackboardKey = '', buffIdList: readonly unknown[] = []) =>
      condition('CheckBuffIdInContextAdvanced', {
        checkType: 'Tag',
        buffIdList,
        query: { queryType: 'HasAny', tags: [{ tagId: -1558844517 }] },
        blackboardKey,
      });
    expect(parseConditionLeafSource(fixture(), 'fixture.contextBuffAdvanced', {})).toMatchObject({
      kind: 'contextBuff',
      sourceType: 'CheckBuffIdInContextAdvanced',
      matcher: {
        kind: 'tag',
        queryType: 'hasAny',
        buffTagIds: [-1558844517],
      },
    });
    expect(
      parseConditionLeafSource(
        fixture('buffid', [{ useBlackboardKey: false, value: '', blackboardKey: '' }]),
        'fixture.contextBuffAdvanced',
        {},
      ),
    ).toMatchObject({ buffIdOutputKey: 'buffid' });
    expect(
      parseConditionLeafSource(
        condition('CheckBuffIdInContextAdvanced', {
          checkType: 'Id',
          buffIdList: [{ useBlackboardKey: true, value: '', blackboardKey: 'id' }],
          query: { queryType: 'HasAny', tags: [] },
          blackboardKey: '',
        }),
        'fixture.contextBuffAdvanced',
        {},
      ),
    ).toMatchObject({ matcher: { kind: 'id', buffIds: [{ kind: 'blackboard', key: 'id' }] } });
  });

  it('按 checkType 忽略基础事件 Buff 条件的非活动字段', () => {
    expect(
      parseConditionLeafSource(
        condition('CheckBuffIdInContext', {
          checkType: 'Tag',
          buffIdList: [{ buffId: 'stale.serialized.id' }],
          query: { queryType: 'HasAny', tags: [{ tagId: -1480463572 }] },
          blackboardKey: '',
        }),
        'fixture.contextBuff',
        {},
      ),
    ).toMatchObject({
      kind: 'contextBuff',
      matcher: { kind: 'tag', queryType: 'hasAny', buffTagIds: [-1480463572] },
    });
  });

  it('严格保留 OnConsumeBuff 消费层数比较和值写回键', () => {
    expect(
      parseConditionLeafSource(
        condition('CheckConsumeBuffLayer', {
          num: scalarFixture(0, 'minimum_layer'),
          compareType: 'GE',
          storeKey: 'consume_layer',
        }),
        'fixture.consumeBuffLayer',
        { minimum_layer: [1, 2] },
      ),
    ).toEqual({
      kind: 'consumeBuffLayer',
      sourceType: 'CheckConsumeBuffLayer',
      comparison: 'GE',
      value: {
        value: 0,
        blackboardKey: 'minimum_layer',
        levelValues: [1, 2],
      },
      outputKey: 'consume_layer',
    });
  });

  it('CompareString 严格保留两个字符串黑板操作数', () => {
    expect(
      parseConditionLeafSource(
        condition('CompareString', {
          valueA: { useBlackboardKey: true, value: 'owner_type', blackboardKey: 'owner_type' },
          valueB: { useBlackboardKey: true, value: '', blackboardKey: 'team_type' },
        }),
        'fixture.compareString',
        {},
      ),
    ).toEqual({
      kind: 'stringCompare',
      sourceType: 'CompareString',
      left: { value: 'owner_type', blackboardKey: 'owner_type' },
      right: { value: '', blackboardKey: 'team_type' },
    });
  });

  it('严格解析物理异常事件类型位集并保留 savedKey 边界', () => {
    expect(
      parseConditionLeafSource(
        condition('CheckPhysicalInflictionType', {
          mask: 'Fracture, Crush',
          savedKey: '',
        }),
        'fixture.physicalInflictionType',
        {},
      ),
    ).toMatchObject({
      kind: 'physicalInflictionType',
      types: ['fracture', 'crush'],
      savedKey: '',
    });
    expect(() =>
      parseConditionLeafSource(
        condition('CheckPhysicalInflictionType', { mask: 'Unknown', savedKey: '' }),
        'fixture.physicalInflictionType',
        {},
      ),
    ).toThrow("unknown physical infliction flag 'Unknown'");
  });
});

function condition(sourceType: string, fields: Record<string, unknown>): Record<string, unknown> {
  return {
    $type: `Example.${sourceType}+Data, Example`,
    ...CONDITION_META,
    ...fields,
  };
}
