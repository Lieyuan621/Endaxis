import { describe, expect, it } from 'vitest';

import {
  collectBlackboardKeys,
  numericDeclaredBlackboard,
  parseDeclaredBlackboard,
  parseSkillPatchSource,
  parseTagQuerySource,
  parseTargetReferenceSource,
} from '../src/index.ts';
import { targetFixture } from './sourceFixtures.ts';

describe('GameplayTag 查询', () => {
  it.each(['HasAny', 'HasAll', 'ExceptAny', 'ExceptAll'])('锁定已验证的查询结构：%s', queryType => {
    const payload = {
      value: { queryType, tags: [{ tagId: 1001 }, { tagId: -2002 }] },
      path: 'buff.tagQuery',
    };
    expect(parseTagQuerySource(payload.value, payload.path)).toMatchSnapshot();
  });

  it('拒绝未知查询枚举和多余字段', () => {
    expect(() => parseTagQuerySource({ queryType: 'Maybe', tags: [] }, 'buff.tagQuery')).toThrow(
      'buff.tagQuery.queryType: unsupported value',
    );
    expect(() =>
      parseTagQuerySource(
        { queryType: 'HasAny', tags: [], guessedMeaning: 'born' },
        'buff.tagQuery',
      ),
    ).toThrow('buff.tagQuery: unexpected fields');
  });
});

describe('TargetSettings', () => {
  it('保留普通目标引用，不提前归约模拟目标', () => {
    const payload = { value: targetFixture('Target'), path: 'skill.target' };
    expect(parseTargetReferenceSource(payload.value, payload.path)).toMatchSnapshot();
  });

  it('保留 owner-spawned 实体类型和 Tag 验证器', () => {
    const payload = {
      value: targetFixture('InstantSearch', {
        finderData: {
          $type: 'Example.Selector+OwnerSpawnedEntityFinder+Data, Example',
          spawnedObjectType: 'AbilityEntity',
        },
        validatorData: [
          {
            $type: 'Example.Selector+TagValidator+Data, Example',
            query: { queryType: 'HasAll', tags: [{ tagId: 801 }, { tagId: 802 }] },
          },
        ],
        postProcessorData: [],
      }),
      path: 'skill.spawnedTarget',
    };
    expect(parseTargetReferenceSource(payload.value, payload.path)).toMatchSnapshot();
  });

  it('未知选择器阻塞解析', () => {
    expect(() =>
      parseTargetReferenceSource(
        targetFixture('InstantSearch', {
          finderData: { $type: 'Example.Selector+GuessedFinder+Data, Example' },
          validatorData: [],
          postProcessorData: [],
        }),
        'skill.target',
      ),
    ).toThrow('skill.target.selectorData.finderData: unsupported finder');
  });

  it('严格识别无配置字段的 GodEntityFinder，不把它伪装成普通战斗目标', () => {
    expect(
      parseTargetReferenceSource(
        targetFixture('InstantSearch', {
          finderData: {
            $type: 'Beyond.Gameplay.Core.Selector+GodEntityFinder+Data, Gameplay.Beyond',
          },
          validatorData: [],
          postProcessorData: [],
        }),
        'buff.godEntity',
      ),
    ).toMatchObject({
      targetSource: 'InstantSearch',
      finderType: 'GodEntityFinder',
    });
    expect(() =>
      parseTargetReferenceSource(
        targetFixture('InstantSearch', {
          finderData: {
            $type: 'Beyond.Gameplay.Core.Selector+GodEntityFinder+Data, Gameplay.Beyond',
            guessedTarget: 'enemy',
          },
          validatorData: [],
          postProcessorData: [],
        }),
        'buff.godEntity',
      ),
    ).toThrow('buff.godEntity.selectorData.finderData: unexpected fields');
  });

  it('保留 Typhoea 屏幕选中目标 Finder 的原生身份', () => {
    expect(
      parseTargetReferenceSource(
        targetFixture('InstantSearch', {
          finderData: {
            $type:
              'Beyond.Gameplay.Core.Selector+TyphoeaArcherySelectedFinder+Data, Gameplay.Beyond',
          },
          validatorData: [],
          postProcessorData: [],
        }),
        'skill.selectedTargets',
      ),
    ).toMatchObject({
      targetSource: 'InstantSearch',
      finderType: 'TyphoeaArcherySelectedFinder',
    });
  });

  it('严格识别无配置字段的 AllEnemyFinder', () => {
    expect(
      parseTargetReferenceSource(
        targetFixture('InstantSearch', {
          finderData: {
            $type: 'Beyond.Gameplay.Core.Selector+AllEnemyFinder+Data, Gameplay.Beyond',
          },
          validatorData: [],
          postProcessorData: [],
        }),
        'skill.allEnemies',
      ),
    ).toMatchObject({ finderType: 'AllEnemyFinder' });
  });

  it('保留无配置字段的 InScreenValidator', () => {
    expect(
      parseTargetReferenceSource(
        targetFixture('InstantSearch', {
          finderData: {
            $type: 'Beyond.Gameplay.Core.Selector+AllEnemyFinder+Data, Gameplay.Beyond',
          },
          validatorData: [
            {
              $type: 'Beyond.Gameplay.Core.Selector+InScreenValidator+Data, Gameplay.Beyond',
            },
          ],
          postProcessorData: [],
        }),
        'skill.visibleEnemies',
      ),
    ).toMatchObject({ validatorTypes: ['InScreenValidator'] });
  });

  it('保留 ShapeFinderData 的结构事实，不假称可执行空间查询', () => {
    expect(
      parseTargetReferenceSource(
        targetFixture('InstantSearch', {
          finderData: {
            $type: 'Example.Selector+ShapeFinder+ShapeFinderData, Example',
            checkAlive: true,
            autoSetTargetFaction: true,
            containsUnMarkable: false,
            factionTarget: 'Anti',
            targetFactionType: 0,
            shapeData: {
              _shape: 'Sphere',
              _rotationOffset: { x: 0, y: 0, z: 0 },
              _useExtentKey: false,
              _extent: { x: 0, y: 0, z: 0 },
              _extentXKey: '',
              _extentYKey: '',
              _extentZKey: '',
              _useCenterKey: false,
              _center: { x: 0, y: 0, z: 0 },
              _centerXKey: '',
              _centerYKey: '',
              _centerZKey: '',
              _heightKey: '',
              _height: 0,
              _radiusKey: '',
              _radius: 4,
            },
            limitHeight: false,
            maxHeight: 0,
            limitAngle: false,
            angleKey: '',
            angle: 0,
          },
          validatorData: [],
          postProcessorData: [],
        }),
        'skill.target',
      ).finderShape,
    ).toMatchObject({ shape: 'Sphere', radius: 4, factionTarget: 'Anti' });
  });

  it('保留 OwnerPartsFinder 的部件 Tag 查询，不猜测部件或模拟目标', () => {
    expect(
      parseTargetReferenceSource(
        targetFixture('InstantSearch', {
          finderData: {
            $type: 'Example.Selector+OwnerPartsFinder+Data, Example',
            partQuery: { queryType: 'HasAny', tags: [{ tagId: 1302805660 }] },
          },
          validatorData: [],
          postProcessorData: [],
        }),
        'skill.ownerParts',
      ),
    ).toMatchObject({
      finderType: 'OwnerPartsFinder',
      finderOwnerPartsQuery: { queryType: 'hasAny', tagIds: [1302805660] },
    });
  });

  it('接受没有自有字段的 ConvertToPosition，并只保留处理器身份', () => {
    expect(
      parseTargetReferenceSource(
        targetFixture('InstantSearch', {
          finderData: { $type: 'Example.Selector+SourceFinder+Data, Example' },
          validatorData: [],
          postProcessorData: [{ $type: 'Example.Selector+ConvertToPosition+Data, Example' }],
        }),
        'skill.convertToPosition',
      ).postProcessorTypes,
    ).toEqual(['ConvertToPosition']);
  });
});

describe('黑板声明和引用', () => {
  it('递归收集并稳定排序启用的黑板引用', () => {
    const payload = {
      second: { useBlackboardKey: true, blackboardKey: 'damage_ratio' },
      nested: [
        { useBlackboardKey: true, blackboardKey: 'atk_scale' },
        { useBlackboardKey: false, blackboardKey: 'ignored' },
      ],
    };
    expect(collectBlackboardKeys(payload)).toEqual(['atk_scale', 'damage_ratio']);
  });

  it('区分数值、字符串和动态初值', () => {
    const payload = {
      value: {
        blackboard: [
          { key: 'ratio', valueDouble: 0.8, valueStr: '', isDynamic: false },
          { key: 'identity', valueDouble: 0, valueStr: 'child_skill', isDynamic: false },
          { key: 'runtime', valueDouble: 1, valueStr: '', isDynamic: true },
        ],
      },
      path: 'skill.example',
    };
    const parsed = parseDeclaredBlackboard(payload.value, payload.path);
    expect(parsed).toMatchSnapshot();
    expect(numericDeclaredBlackboard(parsed)).toEqual({ ratio: 0.8 });
    expect(numericDeclaredBlackboard(parsed, true)).toEqual({ ratio: 0.8, runtime: 1 });
  });
});

describe('SkillPatch', () => {
  it('拒绝等级间缺失黑板键', () => {
    expect(() =>
      parseSkillPatchSource(
        {
          SkillPatchDataBundle: [
            { level: 1, blackboard: [{ key: 'atk', value: 1 }] },
            { level: 2, blackboard: [] },
          ],
        },
        'skill',
      ),
    ).toThrow('blackboard key atk is missing at some levels');
  });

  it('相同重复值去重，冲突重复值阻塞', () => {
    expect(
      parseSkillPatchSource(
        {
          SkillPatchDataBundle: [
            {
              level: 1,
              blackboard: [
                { key: 'music_trigger', value: 3 },
                { key: 'music_trigger', value: 3 },
              ],
            },
          ],
        },
        'skill',
      ).blackboard.music_trigger,
    ).toEqual([3]);
    expect(() =>
      parseSkillPatchSource(
        {
          SkillPatchDataBundle: [
            {
              level: 1,
              blackboard: [
                { key: 'music_trigger', value: 3 },
                { key: 'music_trigger', value: 4 },
              ],
            },
          ],
        },
        'skill',
      ),
    ).toThrow('conflicting duplicate blackboard key music_trigger');
  });
});
