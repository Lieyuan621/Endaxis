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
  it('原始 SkillData 的技能类型数字枚举与已解码名称一致', () => {
    const payload = {
      checkTargetCurSkill: false,
      skillOwner: targetFixture('Owner'),
      mustBeforeExclusiveTime: false,
      attackTypeMask: 'All',
    };
    const numeric = parseConditionLeafSource(
      condition('CheckSkillType', { ...payload, skillTypeList: [2, 6] }),
      'SkillData.native.condition',
      {},
    );
    const named = parseConditionLeafSource(
      condition('CheckSkillType', { ...payload, skillTypeList: ['NormalSkill', 'ComboSkill'] }),
      'SkillData.named.condition',
      {},
    );
    expect(numeric).toEqual(named);
  });
  it('原始 SkillData 的伤害分类比较枚举与已解码名称一致', () => {
    const numeric = parseConditionLeafSource(
      condition('CheckDamageDecorateMask', { checkType: 2, mask: 256 }),
      'SkillData.native.condition',
      {},
    );
    const named = parseConditionLeafSource(
      condition('CheckDamageDecorateMask', { checkType: 'HasAll', mask: 256 }),
      'SkillData.named.condition',
      {},
    );
    expect(numeric).toMatchObject({ kind: 'damageDecorateMask', checkType: 'HasAll', mask: 256 });
    expect(numeric).toEqual(named);
  });
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

  it('保留能力实体剩余时长的比较和目标', () => {
    expect(
      parseConditionLeafSource(
        condition('CheckAbilityEntityCurDuration', {
          abilityEntity: targetFixture('Target'),
          compareType: 'LT',
          value: scalarFixture(3),
          saveCurDuration: false,
          bbKey: '',
        }),
        'fixture.condition',
        {},
      ),
    ).toMatchObject({
      kind: 'abilityEntityDuration',
      comparison: 'LT',
      target: { targetSource: 'Target' },
      value: { value: 3 },
    });
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
