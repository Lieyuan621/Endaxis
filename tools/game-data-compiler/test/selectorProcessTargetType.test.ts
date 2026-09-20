import { describe, expect, it } from 'vitest';
import {
  parsePriorityFilterSource,
  parsePriorityFilterSources,
  parseShuffleTargetSources,
} from '../src/source/selectorComponents.ts';
import { parseExcludeTargetSource } from '../src/source/target.ts';
import {
  selectorExcludesPlainOwner,
  selectorExcludesPlainCurrentTarget,
} from '../src/source/selectorFacts.ts';
import { targetFixture, scalarFixture } from './sourceFixtures.ts';

describe('排除与随机筛选的普通目标通道', () => {
  const exclude = {
    $type: 'Beyond.Gameplay.Core.Selector+ExcludeTarget+Data, Gameplay.Beyond',
    excludedTargetSettings: targetFixture('Owner'),
  };
  const shuffle = {
    $type: 'Beyond.Gameplay.Core.Selector+ShuffleTarget+Data, Gameplay.Beyond',
    targetNumLimit: scalarFixture(-1),
  };
  const parseShuffle = (value: unknown) =>
    parseShuffleTargetSources({ postProcessorData: [value] }, 'selector');

  it('排除的公共解析及身份识别入口兼容显式 Targets', () => {
    const current = { ...exclude, processTargetType: 'Targets' };
    expect(parseExcludeTargetSource(current, 'exclude')).toEqual(
      parseExcludeTargetSource(exclude, 'exclude'),
    );
    expect(selectorExcludesPlainOwner({ postProcessorData: [current] }, 'selector')).toBe(true);
    expect(selectorExcludesPlainCurrentTarget({ postProcessorData: [current] }, 'selector')).toBe(
      false,
    );
  });
  it.each([-1, 0, 1, 3])('随机筛选保留限量值 %s，不在来源层执行或删除洗牌', limit => {
    const old = { ...shuffle, targetNumLimit: scalarFixture(limit) };
    expect(parseShuffle({ ...old, processTargetType: 'Targets' })).toEqual(parseShuffle(old));
  });
  it.each([0, 1, '0', null, undefined, 'HittableTargets', 'Unknown'])(
    '各入口均拒绝未支持通道 %j',
    processTargetType => {
      const current = { ...exclude, processTargetType };
      expect(() => parseExcludeTargetSource(current, 'exclude')).toThrow('processTargetType');
      expect(() =>
        selectorExcludesPlainOwner({ postProcessorData: [current] }, 'selector'),
      ).toThrow('processTargetType');
      expect(() =>
        selectorExcludesPlainCurrentTarget({ postProcessorData: [current] }, 'selector'),
      ).toThrow('processTargetType');
      expect(() => parseShuffle({ ...shuffle, processTargetType })).toThrow('processTargetType');
    },
  );
  it('新增字段不绕过载荷与其他字段校验', () => {
    expect(() =>
      parseExcludeTargetSource({ ...exclude, processTargetType: 'Targets', extra: 1 }, 'exclude'),
    ).toThrow('unexpected fields');
    expect(() =>
      parseExcludeTargetSource(
        { ...exclude, processTargetType: 'Targets', excludedTargetSettings: {} },
        'exclude',
      ),
    ).toThrow();
    expect(() => parseShuffle({ ...shuffle, processTargetType: 'Targets', extra: 1 })).toThrow(
      'unexpected fields',
    );
    expect(() =>
      parseShuffle({ ...shuffle, processTargetType: 'Targets', targetNumLimit: null }),
    ).toThrow('targetNumLimit');
  });
});

const priority = {
  $type: 'Beyond.Gameplay.Core.Selector+PriorityFilter+Data, Gameplay.Beyond',
  filterType: 'DistanceFromOwnerAsc',
  onlyReserveMaxPriorityTargets: false,
  limitMaxNum: true,
  maxNum: 1,
  buffFilterSettings: {
    buffSettings: { checkType: 'Id', buffIdList: [], tagQuery: { queryType: 'HasAny', tags: [] } },
    buffStackNumType: 'BuffCount',
  },
};

describe('PriorityFilter 普通目标通道', () => {
  it('旧版缺省与新版显式 Targets 在所有公共入口产生同一来源结构', () => {
    const current = { ...priority, processTargetType: 'Targets' };
    const expected = parsePriorityFilterSource(priority, 'priority');
    expect(parsePriorityFilterSource(current, 'priority')).toEqual(expected);
    expect(parsePriorityFilterSources({ postProcessorData: [current] }, 'selector')).toEqual([
      expected,
    ]);
  });

  it.each([0, 1, '0', null, undefined, 'HittableTargets', 'Unknown'])(
    '不强转枚举，也不把其他通道 %j 当普通目标',
    processTargetType => {
      const current = { ...priority, processTargetType };
      expect(() => parsePriorityFilterSource(current, 'priority')).toThrow(
        'priority.processTargetType',
      );
      expect(() =>
        parsePriorityFilterSources({ postProcessorData: [current] }, 'selector'),
      ).toThrow('selector.postProcessorData[0].processTargetType');
    },
  );

  it('支持新增字段不放宽其他结构校验', () => {
    expect(() =>
      parsePriorityFilterSource(
        { ...priority, processTargetType: 'Targets', extra: 1 },
        'priority',
      ),
    ).toThrow('unexpected fields');
    expect(() =>
      parsePriorityFilterSource(
        { ...priority, $type: 'Beyond.Gameplay.Core.Selector+ShuffleTarget+Data' },
        'priority',
      ),
    ).toThrow('expected PriorityFilter');
  });
});
