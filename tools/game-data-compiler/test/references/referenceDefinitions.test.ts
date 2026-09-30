import { describe, expect, it } from 'vitest';

import { parseAbilityEntityDefinitionReferenceNodes } from '../../src/index.ts';
import { abilityEntityFixture } from '../sourceFixtures.ts';

describe('Unity 模板定义身份节点', () => {
  it('严格校验 AbilityEntity 文件身份与内部 gameId 一致', () => {
    expect(() =>
      parseAbilityEntityDefinitionReferenceNodes({
        abilityentity_fixture: { ...abilityEntityFixture(), gameId: 'abilityentity_other' },
      }),
    ).toThrow(/expected "abilityentity_fixture"/);
  });
});
