import { describe, expect, it } from 'vitest';

import {
  parseAbilityEntityDefinitionReferenceNodes,
  parseProjectileDefinitionReferenceNodes,
} from '../../src/index.ts';
import { abilityEntityFixture } from '../sourceFixtures.ts';

describe('Unity 模板定义身份节点', () => {
  it('按组件内身份关闭 Projectile 定义，且不猜测未知出边', () => {
    expect(
      parseProjectileDefinitionReferenceNodes({
        projectile_fixture: { id: 'projectile_fixture', speed: 12 },
      }),
    ).toEqual([
      {
        kind: 'projectile',
        id: 'projectile_fixture',
        sourcePath: 'ProjectileData.projectile_fixture',
        references: [],
      },
    ]);
  });

  it('严格校验 AbilityEntity 文件身份与内部 gameId 一致', () => {
    expect(() =>
      parseAbilityEntityDefinitionReferenceNodes({
        abilityentity_fixture: { ...abilityEntityFixture(), gameId: 'abilityentity_other' },
      }),
    ).toThrow(/expected "abilityentity_fixture"/);
  });
});
