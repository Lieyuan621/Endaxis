import { describe, expect, it } from 'vitest';

import {
  compileAbilityEntityTemplateCatalogSource,
  resolveAbilityEntityTemplateIdsByTagQuery,
} from '../../src/index.ts';
import { abilityEntityFixture } from '../sourceFixtures.ts';
import { GameplayTagRegistry, gameplayTagIdFromPath } from '../../src/source/nativeGameplayTags.ts';

describe('AbilityEntity 公共模板目录', () => {
  it('按稳定身份排序，并建立不猜测父子语义的精确 born tag 索引', () => {
    const catalog = compileAbilityEntityTemplateCatalogSource({
      abilityentity_z: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_z',
        bornTagIds: [2, 2, 3],
      },
      abilityentity_a: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_a',
        bornTagIds: [2, 4],
      },
    });

    expect(catalog.templates.map(value => value.gameId)).toEqual([
      'abilityentity_a',
      'abilityentity_z',
    ]);
    expect(catalog.byId.get('abilityentity_z')?.durationBlackboard.blackboardKey).toBe(
      'EntityBB_duration',
    );
    expect(catalog.idsByExactBornTag.get(2)).toEqual(['abilityentity_a', 'abilityentity_z']);
    expect(catalog.idsByExactBornTag.get(3)).toEqual(['abilityentity_z']);
  });

  it('文件键与模板 gameId 不一致时失败关闭', () => {
    expect(() =>
      compileAbilityEntityTemplateCatalogSource({
        abilityentity_fixture: { ...abilityEntityFixture(), gameId: 'abilityentity_other' },
      }),
    ).toThrow(/expected "abilityentity_fixture"/);
  });

  it('复用运行时层级规则解析父标签，未知裸 ID 仍只能精确匹配', () => {
    const parent = gameplayTagIdFromPath('Entity/Water');
    const child = gameplayTagIdFromPath('Entity/Water/Deep');
    const unknown = 123456;
    const catalog = compileAbilityEntityTemplateCatalogSource({
      abilityentity_child: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_child',
        bornTagIds: [child],
      },
      abilityentity_unknown: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_unknown',
        bornTagIds: [unknown],
      },
    });
    const registry = new GameplayTagRegistry(['Entity/Water/Deep']);

    expect(
      resolveAbilityEntityTemplateIdsByTagQuery(
        catalog,
        { queryType: 'hasAny', tagIds: [parent] },
        registry,
      ),
    ).toEqual(['abilityentity_child']);
    expect(
      resolveAbilityEntityTemplateIdsByTagQuery(
        catalog,
        { queryType: 'hasAny', tagIds: [unknown] },
        registry,
      ),
    ).toEqual(['abilityentity_unknown']);
  });
});
