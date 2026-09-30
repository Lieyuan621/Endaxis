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
  it('数字和名称形式解析为相同查询', () => {
    const named = { ...settings, checkType: 'Context' };
    const numeric = { ...settings, checkType: 3 };
    expect(parseBuffFindSettings(numeric, 'find')).toEqual(parseBuffFindSettings(named, 'find'));
  });

  it('来源保留空 ID 占位，执行查询忽略它', () => {
    expect(parseBuffFindSettingsSource(settings, 'find').buffIds).toEqual(['', 'buff_fixture']);
    expect(parseBuffFindSettings(settings, 'find').buffIds).toEqual(['buff_fixture']);
  });

  it('拒绝字符串数字和缺失的查询模式', () => {
    for (const checkType of ['0', undefined]) {
      expect(() => parseBuffFindSettingsSource({ ...settings, checkType }, 'find')).toThrow(
        'find.checkType',
      );
    }
  });

  it('执行查询拒绝结构漂移，不因滤空丢失校验', () => {
    expect(() => parseBuffFindSettings({ ...settings, extra: 1 }, 'find')).toThrow(
      'unexpected fields',
    );
    expect(() => parseBuffFindSettings({ ...settings, buffIdList: [1] }, 'find')).toThrow(
      'buffIdList[0]',
    );
    expect(() => parseBuffFindSettings({ checkType: 0, buffIdList: [] }, 'find')).toThrow(
      'unexpected fields',
    );
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
  it('operationType 的数字和名称形式生成相同 IR', () => {
    expect(
      parseConvert({
        operationType: 4,
        translateOperation: 0,
        translationRef: 0,
        excludeTarget: 2,
      }),
    ).toEqual(parseConvert({ operationType: 'ConvertEntityToSlot' }));
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

  it('已知但未支持的空间行为不会被放行', () => {
    expect(() => parseConvert({ operationType: 7 })).toThrow(
      'unsupported operation "ConvertBlackboardValueToPosition"',
    );
  });

  it('未知枚举值不转成默认操作', () => {
    expect(() => parseConvert({ operationType: '0' })).toThrow('unknown native enum');
    expect(() => parseConvert({ translationRef: 6 })).toThrow('unknown native enum');
  });
});
