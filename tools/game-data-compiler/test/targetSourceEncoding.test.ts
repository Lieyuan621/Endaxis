import { describe, expect, it } from 'vitest';
import { parseTargetReferenceSource, selectorComponentName } from '../src/source/target.ts';
import {
  readActionTarget,
  readDirectionType,
  readTargetSource,
  readFactionTarget,
  readHitBoxObjectType,
} from '../src/source/targetEnums.ts';
import { targetFixture } from './sourceFixtures.ts';

describe('公共目标来源编码', () => {
  it('不把通用实体类型或未命名组合掩码冒充 HitBoxFinder 枚举', () => {
    for (const value of [0, 3, 5, 7, 'Character', 'Enemy']) {
      expect(() => readHitBoxObjectType(value, 'finder.targetObjectType')).toThrow(
        'finder.targetObjectType',
      );
    }
    expect(() => readFactionTarget('Enemy', 'finder.factionTarget')).toThrow(
      'finder.factionTarget',
    );
  });
  it.each(['Data', 'HitBoxFinderData'])('Selector 的点号/加号表示解析为同一身份：%s', suffix => {
    for (const type of [
      `Beyond.Gameplay.Core.Selector+HitBoxFinder+${suffix}, Gameplay.Beyond`,
      `Beyond.Gameplay.Core.Selector.HitBoxFinder.${suffix}`,
    ])
      expect(selectorComponentName({ $type: type }, 'fixture')).toBe('HitBoxFinder');
  });

  it.each(['Example.Other.HitBoxFinder.Data', 'Example.Selector.HitBoxFinder.OtherData', 'Data'])(
    '拒绝不属于 Selector 的形状：%s',
    type => {
      expect(() => selectorComponentName({ $type: type }, 'fixture')).toThrow('fixture.$type');
    },
  );

  const targetSources = [
    'Target',
    'Source',
    'Context',
    'InstantSearch',
    'Owner',
    'MainCharacter',
    'MainTarget',
  ];
  const actionTargets = [
    'ActionSource',
    'ActionOwner',
    'InputTarget',
    'CurrentTarget',
    'ContextTarget',
  ];
  const directions = [
    'SourceForward',
    'TargetForward',
    'SourceToTarget',
    'TargetToSource',
    'CameraForward',
  ];

  it('所有精确枚举常量均保留命名身份', () => {
    for (const [read, names] of [
      [readTargetSource, targetSources],
      [readActionTarget, actionTargets],
      [readDirectionType, directions],
    ] as const) {
      names.forEach((name, index) => {
        expect(read(index, 'fixture')).toBe(name);
        expect(read(name, 'fixture')).toBe(name);
      });
    }
  });

  it('完整目标引用的数字/命名形式相等，三种目标身份不混用', () => {
    const named = {
      ...targetFixture('Context'),
      targetGroupKey: 'saved',
      selectorOwner: 'ActionOwner',
      centerType: 'InputTarget',
      target: 'ContextTarget',
      ownerContextKey: 'owner',
      centerContextKey: 'center',
      targetContextKey: 'selected',
      selectorDirection: 'TargetToSource',
    };
    expect(
      parseTargetReferenceSource(
        {
          ...named,
          targetSource: 2,
          selectorOwner: 1,
          centerType: 2,
          target: 4,
          selectorDirection: 3,
        },
        'fixture',
      ),
    ).toEqual(parseTargetReferenceSource(named, 'fixture'));
  });

  it('非搜索来源允许 null finder，InstantSearch 仍严格拒绝缺失 finder', () => {
    const empty = { finderData: null, validatorData: [], postProcessorData: [] };
    expect(parseTargetReferenceSource(targetFixture('Source', empty), 'fixture')).toEqual(
      parseTargetReferenceSource(targetFixture('Source'), 'fixture'),
    );
    expect(() =>
      parseTargetReferenceSource(targetFixture('InstantSearch', empty), 'fixture'),
    ).toThrow('fixture.selectorData.finderData: expected object');
    expect(() => parseTargetReferenceSource(targetFixture('InstantSearch'), 'fixture')).toThrow(
      'unexpected fields',
    );
    expect(() =>
      parseTargetReferenceSource(
        targetFixture('Source', { ...empty, finderData: undefined }),
        'fixture',
      ),
    ).toThrow('fixture.selectorData.finderData: expected object');
  });

  it('HitBoxFinder 的编码差异不改变目标查询 IR，非连续枚举不按下标读取', () => {
    for (const [faction, factionName] of [
      [0, 'Ally'],
      [1, 'Anti'],
    ] as const) {
      for (const [object, objectName] of [
        [1, 'Normal'],
        [2, 'Interactive'],
        [4, 'NoInteractive'],
      ] as const) {
        const finder = {
          $type: 'Beyond.Gameplay.Core.Selector+HitBoxFinder+Data, Gameplay.Beyond',
          factionTarget: factionName,
          targetObjectType: objectName,
          checkAlive: true,
          autoSetTargetFaction: true,
          targetFactionType: 0,
        };
        const named = targetFixture('InstantSearch', {
          finderData: finder,
          validatorData: [],
          postProcessorData: [],
        });
        const encoded = {
          ...named,
          targetSource: 3,
          selectorData: {
            finderData: {
              ...finder,
              $type: 'Beyond.Gameplay.Core.Selector.HitBoxFinder.Data',
              factionTarget: faction,
              targetObjectType: object,
            },
            validatorData: [],
            postProcessorData: [],
          },
        };
        expect(parseTargetReferenceSource(encoded, 'fixture')).toEqual(
          parseTargetReferenceSource(named, 'fixture'),
        );
      }
    }
  });

  it.each([null, undefined, true, '0', 'Unknown', -1, 7, 0.5])(
    '未知枚举 %s 保留失败路径',
    value => {
      for (const read of [readTargetSource, readActionTarget, readDirectionType]) {
        expect(() => read(value, 'fixture.value')).toThrow('fixture.value');
      }
    },
  );
});
