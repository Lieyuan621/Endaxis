import { describe, expect, it } from 'vitest';

import {
  compileAbilityEntityTemplateCatalogSource,
  compileActiveSkillAbilityEntityQueriesSource,
  compileActiveSkillSource,
  compileTargetGroupAbilityEntityQuerySource,
  compileTargetReferenceAbilityEntityQuerySource,
  parseTargetGroupWriteAction,
  parseTargetReferenceSource,
} from '../../src/index.ts';
import { GameplayTagRegistry, gameplayTagIdFromPath } from '../../src/source/nativeGameplayTags.ts';
import {
  abilityEntityFixture,
  activeSkillWithOwnerSpawnedAbilityEntityQueryFixture,
  ownerSpawnedAbilityEntityFindTargetActionFixture,
  targetFixture,
} from '../sourceFixtures.ts';

describe('OwnerSpawned AbilityEntity 公共查询投影', () => {
  it('按原顺序保留 Tag 与同施法验证器，并用同版本父标签求目录候选', () => {
    const parent = gameplayTagIdFromPath('Entity/Water');
    const child = gameplayTagIdFromPath('Entity/Water/Deep');
    const catalog = compileAbilityEntityTemplateCatalogSource({
      abilityentity_water: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_water',
        bornTagIds: [child],
      },
      abilityentity_fire: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_fire',
        bornTagIds: [gameplayTagIdFromPath('Entity/Fire')],
      },
    });
    const source = parseTargetReferenceSource(
      targetFixture('InstantSearch', {
        finderData: {
          $type: 'Example.Selector+OwnerSpawnedEntityFinder+Data, Example',
          spawnedObjectType: 512,
        },
        validatorData: [
          {
            $type: 'Example.Selector+TagValidator+Data, Example',
            query: { queryType: 0, tags: [{ tagId: parent }] },
          },
          { $type: 'Example.Selector+SkillCastIdValidator+Data, Example' },
        ],
        postProcessorData: [],
      }),
      'skill.target',
    );

    expect(
      compileTargetReferenceAbilityEntityQuerySource(
        source,
        catalog,
        new GameplayTagRegistry(['Entity/Water/Deep', 'Entity/Fire']),
        'skill.target',
      ),
    ).toEqual({
      objectFilter: 'abilityEntity',
      owner: { kind: 'actionOwner' },
      center: { kind: 'actionSource' },
      validators: [
        { kind: 'tag', query: { queryType: 'hasAny', tagIds: [parent] } },
        { kind: 'sameSkillCast' },
      ],
      postProcessors: [],
      candidateTemplateIds: ['abilityentity_water'],
    });
  });

  it('未知裸 ID 只精确匹配，不凭哈希猜父子路径', () => {
    const catalog = compileAbilityEntityTemplateCatalogSource({
      abilityentity_exact: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_exact',
        bornTagIds: [321],
      },
      abilityentity_other: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_other',
        bornTagIds: [654],
      },
    });
    const source = spawnedTargetWithValidators([
      {
        $type: 'Example.Selector+TagValidator+Data, Example',
        query: { queryType: 'HasAny', tags: [{ tagId: 321 }] },
      },
    ]);

    expect(
      compileTargetReferenceAbilityEntityQuerySource(
        source,
        catalog,
        new GameplayTagRegistry([]),
        'skill.target',
      ).candidateTemplateIds,
    ).toEqual(['abilityentity_exact']);
  });

  it('目标组写入与 TargetSettings 共用同一投影，不在 Operator 领域重复解释', () => {
    const catalog = compileAbilityEntityTemplateCatalogSource({
      abilityentity_exact: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_exact',
        bornTagIds: [321],
      },
    });
    const write = parseTargetGroupWriteAction(
      ownerSpawnedAbilityEntityFindTargetActionFixture(),
      'skill.find',
      {
        startFrame: 10,
        endFrame: 20,
        actionPath: ['timelineActions[0]', 'actionData[0]'],
      },
    );
    expect(write).not.toBeNull();
    expect(
      compileTargetGroupAbilityEntityQuerySource(
        write!,
        catalog,
        new GameplayTagRegistry([]),
        'skill.find',
      ),
    ).toMatchObject({
      owner: { kind: 'actionOwner' },
      center: { kind: 'actionSource' },
      candidateTemplateIds: ['abilityentity_exact'],
    });
  });

  it('主动技能只消费已收集的目标组写入，不在领域层重扫原始选择器', () => {
    const skill = activeSkillWithOwnerSpawnedAbilityEntityQueryFixture();
    const compiled = compileActiveSkillSource(skill, 'active_fixture.json', null);
    const catalog = compileAbilityEntityTemplateCatalogSource({
      abilityentity_exact: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_exact',
        bornTagIds: [321],
      },
    });

    expect(
      compileActiveSkillAbilityEntityQueriesSource(compiled, catalog, new GameplayTagRegistry([])),
    ).toMatchObject([
      {
        targetGroupKey: 'entities',
        startFrame: 10,
        endFrame: 20,
        sourcePath:
          'active_fixture.json.actionGroupData.timelineActions[0]._sequenceActionData.actionData[0]',
        query: { candidateTemplateIds: ['abilityentity_exact'] },
      },
    ]);
  });

  it('按原顺序保留已闭环的 owner 距离排序和原生数量上限', () => {
    const catalog = compileAbilityEntityTemplateCatalogSource({
      abilityentity_fixture: abilityEntityFixture(),
    });
    const source = parseTargetReferenceSource(
      targetFixture('InstantSearch', {
        finderData: {
          $type: 'Example.Selector+OwnerSpawnedEntityFinder+Data, Example',
          spawnedObjectType: 'AbilityEntity',
        },
        validatorData: [],
        postProcessorData: [
          priorityFilterFixture('DistanceFromOwnerAsc', false, 0),
          priorityFilterFixture('DistanceFromOwnerDes', true, 4),
        ],
      }),
      'skill.target',
    );

    expect(
      compileTargetReferenceAbilityEntityQuerySource(
        source,
        catalog,
        new GameplayTagRegistry([]),
        'skill.target',
      ).postProcessors,
    ).toEqual([
      { kind: 'distanceFromOwner', order: 'ascending', maxTargets: 128 },
      { kind: 'distanceFromOwner', order: 'descending', maxTargets: 4 },
    ]);
  });

  it('把不限量且无 Buff 过滤的主角距离升序保留为木桩模型查询事实', () => {
    const catalog = compileAbilityEntityTemplateCatalogSource({
      abilityentity_fixture: abilityEntityFixture(),
    });
    const source = parseTargetReferenceSource(
      targetFixture('InstantSearch', {
        finderData: {
          $type: 'Example.Selector+OwnerSpawnedEntityFinder+Data, Example',
          spawnedObjectType: 'AbilityEntity',
        },
        validatorData: [],
        postProcessorData: [priorityFilterFixture('DistanceFromMainCharAsc', false, 0)],
      }),
      'skill.target',
    );

    expect(
      compileTargetReferenceAbilityEntityQuerySource(
        source,
        catalog,
        new GameplayTagRegistry([]),
        'skill.target',
      ).postProcessors,
    ).toEqual([{ kind: 'distanceFromMainCharacter', order: 'ascending', maxTargets: 128 }]);

    expect(() =>
      compileTargetReferenceAbilityEntityQuerySource(
        {
          ...source,
          priorityFilters: [
            priorityFilterSource('DistanceFromMainCharAsc'),
            {
              ...priorityFilterSource('DistanceFromMainCharAsc'),
              limitMaxNum: true,
              maxNum: 1,
            },
          ].slice(1),
        },
        catalog,
        new GameplayTagRegistry([]),
        'skill.target',
      ),
    ).toThrow(/unsupported PriorityFilter/);
  });

  it('未证明的对象类型、验证器、后处理器和缺少查询数据都失败关闭', () => {
    const catalog = compileAbilityEntityTemplateCatalogSource({
      abilityentity_fixture: abilityEntityFixture(),
    });
    const registry = new GameplayTagRegistry([]);
    const base = spawnedTargetWithValidators([]);

    expect(() =>
      compileTargetReferenceAbilityEntityQuerySource(
        { ...base, finderSpawnedObjectType: 'All' },
        catalog,
        registry,
        'all',
      ),
    ).toThrow(/expected AbilityEntity/);
    expect(() =>
      compileTargetReferenceAbilityEntityQuerySource(
        { ...base, validatorTypes: ['MainCharacterValidator'] },
        catalog,
        registry,
        'distance',
      ),
    ).toThrow(/unsupported validator/);
    expect(() =>
      compileTargetReferenceAbilityEntityQuerySource(
        {
          ...base,
          postProcessorTypes: ['PriorityFilter'],
          priorityFilters: [priorityFilterSource('DistanceFromCenterAsc')],
        },
        catalog,
        registry,
        'center-priority',
      ),
    ).toThrow(/unsupported PriorityFilter/);
    expect(
      compileTargetReferenceAbilityEntityQuerySource(
        {
          ...base,
          postProcessorTypes: ['ShuffleTarget'],
          shuffleTargets: [{ targetNumLimit: { value: -1, blackboardKey: null } }],
        },
        catalog,
        registry,
        'shuffle',
      ).postProcessors,
    ).toEqual([{ kind: 'shuffle', targetNumLimit: { value: -1, blackboardKey: null } }]);
    expect(() =>
      compileTargetReferenceAbilityEntityQuerySource(
        { ...base, validatorTypes: ['TagValidator'], validatorTagQueries: [] },
        catalog,
        registry,
        'missing-query',
      ),
    ).toThrow(/has no query data/);
  });

  it('原生零 ObjectType 掩码显式投影为空，不猜成 AbilityEntity 或 All', () => {
    const catalog = compileAbilityEntityTemplateCatalogSource({
      abilityentity_fixture: abilityEntityFixture(),
    });
    expect(
      compileTargetReferenceAbilityEntityQuerySource(
        { ...spawnedTargetWithValidators([]), finderSpawnedObjectType: '0' },
        catalog,
        new GameplayTagRegistry([]),
        'zero-mask',
      ),
    ).toMatchObject({ objectFilter: 'none', candidateTemplateIds: [] });
  });
});

function spawnedTargetWithValidators(validatorData: readonly Record<string, unknown>[]) {
  return parseTargetReferenceSource(
    targetFixture('InstantSearch', {
      finderData: {
        $type: 'Example.Selector+OwnerSpawnedEntityFinder+Data, Example',
        spawnedObjectType: 'AbilityEntity',
      },
      validatorData,
      postProcessorData: [],
    }),
    'skill.target',
  );
}

function priorityFilterFixture(
  filterType: string,
  limitMaxNum: boolean,
  maxNum: number,
): Record<string, unknown> {
  return {
    $type: 'Example.Selector+PriorityFilter+Data, Example',
    filterType,
    onlyReserveMaxPriorityTargets: false,
    limitMaxNum,
    maxNum,
    buffFilterSettings: {
      buffSettings: {
        checkType: 'Id',
        buffIdList: [],
        tagQuery: { queryType: 'HasAny', tags: [] },
      },
      buffStackNumType: 'BuffCount',
    },
  };
}

function priorityFilterSource(filterType: string) {
  return {
    filterType,
    onlyReserveMaxPriorityTargets: false,
    limitMaxNum: false,
    maxNum: 0,
    buffFilter: {
      checkType: 'Id',
      buffIds: [],
      tagQuery: { queryType: 'hasAny' as const, tagIds: [] },
      stackCountType: 'BuffCount',
    },
  };
}
