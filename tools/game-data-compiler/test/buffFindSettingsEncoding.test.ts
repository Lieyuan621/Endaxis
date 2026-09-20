import { describe, expect, it } from 'vitest';
import { parseBuffFindSettingsSource } from '../src/source/buffFindSettings.ts';
import { parseBuffFindSettings } from '../src/source/condition.ts';
import { parsePriorityFilterSources } from '../src/source/selectorComponents.ts';
import { parseKnownNativeActionLeafSource } from '../src/source/actionLeaf.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const settings = {
  checkType: 'Id',
  buffIdList: ['', 'buff_fixture'],
  tagQuery: { queryType: 'HasAny', tags: [{ tagId: 123 }] },
};

describe('共享 BuffFindSettings 来源编码', () => {
  it.each([
    [0, 'Id'],
    [1, 'Tag'],
    [2, 'Environment'],
    [3, 'Context'],
  ])('%s / %s 解析为完整相同载荷，保留非活动字段', (number, name) => {
    const named = { ...settings, checkType: name };
    const numeric = { ...settings, checkType: number };
    expect(parseBuffFindSettingsSource(numeric, 'find')).toEqual(
      parseBuffFindSettingsSource(named, 'find'),
    );
    expect(parseBuffFindSettingsSource(numeric, 'find').buffIds).toEqual(['', 'buff_fixture']);
    expect(parseBuffFindSettings(numeric, 'find')).toEqual(parseBuffFindSettings(named, 'find'));
    expect(parseBuffFindSettings(numeric, 'find').buffIds).toEqual(['buff_fixture']);
  });

  it.each([-1, 4, '0', 'Unknown', null, undefined])('拒绝未知/强转的查询模式 %j', checkType => {
    expect(() => parseBuffFindSettingsSource({ ...settings, checkType }, 'find')).toThrow(
      'find.checkType',
    );
  });

  it('动作与条件均拒绝结构漂移，不因滤空丢失校验', () => {
    for (const parse of [parseBuffFindSettingsSource, parseBuffFindSettings]) {
      expect(() => parse({ ...settings, extra: 1 }, 'find')).toThrow('unexpected fields');
      expect(() => parse({ ...settings, buffIdList: [1] }, 'find')).toThrow('buffIdList[0]');
      expect(() => parse({ checkType: 0, buffIdList: [] }, 'find')).toThrow('unexpected fields');
    }
  });

  it('Selector PriorityFilter 复用完整查询结构，维持非空 ID 支持边界', () => {
    const priority = {
      $type: 'Beyond.Gameplay.Core.Selector+PriorityFilter+Data, Gameplay.Beyond',
      filterType: 'DistanceFromMainCharAsc',
      onlyReserveMaxPriorityTargets: false,
      limitMaxNum: true,
      maxNum: 1,
      buffFilterSettings: {
        buffSettings: { ...settings, buffIdList: ['buff_fixture'] },
        buffStackNumType: 'BuffCount',
      },
    };
    const numeric = structuredClone(priority);
    const nativeSettings = { ...numeric.buffFilterSettings.buffSettings, checkType: 0 };
    const parsePriority = (item: unknown) =>
      parsePriorityFilterSources({ postProcessorData: [item] }, 'filters');
    expect(
      parsePriority({
        ...numeric,
        buffFilterSettings: { ...numeric.buffFilterSettings, buffSettings: nativeSettings },
      }),
    ).toEqual(parsePriority(priority));
    expect(() =>
      parsePriority({
        ...priority,
        buffFilterSettings: { buffSettings: settings, buffStackNumType: 'BuffCount' },
      }),
    ).toThrow('buffIdList[0]');
  });
});

const convert = {
  $type: 'Beyond.Gameplay.Core.ConvertToTargetContext+Data, Gameplay.Beyond',
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 1,
  convertFrom: targetFixture('Target'),
  targetGroupKey: 'center',
  operationType: 'None',
  translateOperation: 'Rotate180DegAroundRef',
  translationRef: 'ActionSource',
  translationDeg: 0,
  excludeTarget: 'InputTarget',
  blackboardVector3: { x: scalarFixture(0), y: scalarFixture(0), z: scalarFixture(0) },
};
const parseConvert = (overrides: Record<string, unknown>) =>
  parseKnownNativeActionLeafSource({ ...convert, ...overrides }, 'convert', {});

describe('目标转换编码与支持子集分离', () => {
  it.each([
    [0, 'None'],
    [1, 'ConvertEntityToPosition'],
    [3, 'ExcludeTarget'],
    [4, 'ConvertEntityToSlot'],
  ])('operationType %s / %s 完整 IR 等价', (number, name) => {
    expect(
      parseConvert({
        operationType: number,
        translateOperation: 0,
        translationRef: 0,
        excludeTarget: 2,
      }),
    ).toEqual(parseConvert({ operationType: name }));
  });

  it('None 分支也保留未消费的旋转/引用字段', () => {
    expect(
      parseConvert({
        translateOperation: 1,
        translationRef: 4,
        excludeTarget: 1,
        translationDeg: 60,
      }),
    ).toEqual(
      parseConvert({
        translateOperation: 'RotateAroundRefCW',
        translationRef: 'ContextTarget',
        excludeTarget: 'ActionOwner',
        translationDeg: 60,
      }),
    );
  });

  it.each([
    [2, 'TranslatePosition'],
    [5, 'ConvertSlotToPosition'],
    [6, 'ConvertSlotToTarget'],
    [7, 'ConvertBlackboardValueToPosition'],
  ])('已知枚举 %s / %s 仍不擅自放开空间行为', (number, name) => {
    expect(() => parseConvert({ operationType: number })).toThrow(
      `unsupported operation "${name}"`,
    );
    expect(() => parseConvert({ operationType: name })).toThrow(`unsupported operation "${name}"`);
  });

  it.each([
    { operationType: 8 },
    { operationType: '0' },
    { translateOperation: 2 },
    { translationRef: 6 },
    { excludeTarget: '2' },
  ])('未知字段值不转成默认操作：%j', overrides => {
    expect(() => parseConvert(overrides)).toThrow('unknown native enum');
  });
});
