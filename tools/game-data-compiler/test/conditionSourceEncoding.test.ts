import { describe, expect, it } from 'vitest';
import { parseConditionLeafSource } from '../src/source/condition.ts';
import { readCompareType } from '../src/source/conditionEnums.ts';
import { readBuffStackNumType } from '../src/source/buffFindSettings.ts';
import { parseForcedElementalStatusActionSource } from '../src/source/elementalInflictionActions.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const meta = { isEnable: true, priorityLevel: 'Default', priorityOffset: 0, serverActionIndex: 1 };
const parse = (name: string, fields: Record<string, unknown>) => parseConditionLeafSource({
  ...meta, $type: `Beyond.Gameplay.Core.Conditions.${name}+Data, Gameplay.Beyond`, ...fields,
}, 'condition', {});

describe('条件共享原生枚举读取', () => {
  it.each([[0, 'LT'], [1, 'LE'], [2, 'GT'], [3, 'GE'], [4, 'Equals']])('比较 %s / %s', (value, name) => {
    expect(readCompareType(value, 'compare')).toBe(name);
    expect(readCompareType(name, 'compare')).toBe(name);
  });
  it.each([[0, 'BuffCount'], [1, 'BuffIdCount']])('Buff 计数 %s / %s', (value, name) => {
    expect(readBuffStackNumType(value, 'count')).toBe(name);
    expect(readBuffStackNumType(name, 'count')).toBe(name);
  });
  it.each([-1, 5, '0', null])('未知枚举不强转：%j', value => {
    expect(() => readCompareType(value, 'compare')).toThrow('compare');
    expect(() => readBuffStackNumType(value, 'count')).toThrow('count');
  });

  it.each([
    ['CheckMainCharacterCondition', {}],
    ['CheckTagMatch', { query: { queryType: 'HasAny', tags: [{ tagId: 123 }] } }],
    ['CheckTimedMarkerCondition', { id: 'marker', blackboardKey: '', useBlackboardKey: false, returnTrueIfNotExists: false }],
  ] as const)('%s 使用原生 TargetSource，完整条件 IR 不因编码改变', (name, fields) => {
    expect(parse(name, { ...fields, checkTarget: { targetSource: 2, targetGroupKey: 'tar' } }))
      .toEqual(parse(name, { ...fields, checkTarget: { targetSource: 'Context', targetGroupKey: 'tar' } }));
    expect(() => parse(name, { ...fields, checkTarget: { targetSource: 7, targetGroupKey: 'tar' } }))
      .toThrow('targetSource');
  });

  it('实体数量条件保留完整目标引用、保存键及受击目标选项', () => {
    const fields = {
      minNum: 1, compareType: 'GE', containsHittableTarget: true, excludeDeadEntity: true, storeKey: 'count',
      checkTarget: targetFixture('Context', undefined, 'tar'),
    };
    expect(parse('CheckEntityNum', { ...fields, compareType: 3, checkTarget: { ...fields.checkTarget, targetSource: 2 } }))
      .toEqual(parse('CheckEntityNum', fields));
  });

  it.each(['CheckBuffStackNumAdvanced', 'CheckBuffStackNumByTag'])('%s 的查询、计数、比较数字编码一并等价', name => {
    const query = { queryType: 'HasAny', tags: [{ tagId: 123 }] };
    const fields = {
      checkTarget: { targetSource: 'Target', targetGroupKey: '' },
      buffStackNumType: 'BuffCount', compareType: 'GE', value: scalarFixture(2),
      ...(name === 'CheckBuffStackNumAdvanced'
        ? { buffSettings: { checkType: 1, buffIdList: [''], tagQuery: query }, limitSkillCastId: false }
        : { tagQuery: query }),
    };
    expect(parse(name, { ...fields, checkTarget: { targetSource: 0, targetGroupKey: '' }, buffStackNumType: 0, compareType: 3 }))
      .toEqual(parse(name, fields));
  });

  it('生命条件的目标来源编码不改动既有比较/阈值语义', () => {
    const fields = { compare: 'LE', isRatio: true, value: scalarFixture(0.5) };
    expect(parse('CheckHp', { ...fields, hpOwner: { targetSource: 2, targetGroupKey: 'tar' } }))
      .toEqual(parse('CheckHp', { ...fields, hpOwner: { targetSource: 'Context', targetGroupKey: 'tar' } }));
  });
});

describe('ForceSpellStatus 精确读取 EnergyShardType', () => {
  const action = {
    ...meta, $type: 'Beyond.Gameplay.Core.ForceSpellStatusAction+Data, Gameplay.Beyond',
    source: targetFixture('Source'), target: targetFixture('Target'),
    consumedLayer: scalarFixture(2), count: scalarFixture(1), consumedType: scalarFixture(2), isExtra: false,
  };
  it.each([[0, 'Fire'], [1, 'Pulse'], [2, 'Cryst'], [3, 'Natural']])('%s / %s 不套用含 Physical 的伤害枚举', (value, name) => {
    expect(parseForcedElementalStatusActionSource({ ...action, spellStatusType: value }, 'force', {}))
      .toEqual(parseForcedElementalStatusActionSource({ ...action, spellStatusType: name }, 'force', {}));
  });
  it.each([4, 'Enum', 'Burst', 'Physical', '0', -1])('不把标记成员/其他类型当成法术状态：%j', value => {
    expect(() => parseForcedElementalStatusActionSource({ ...action, spellStatusType: value }, 'force', {}))
      .toThrow('spellStatusType');
  });
});
