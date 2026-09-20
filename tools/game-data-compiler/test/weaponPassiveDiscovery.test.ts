import { describe, expect, it } from 'vitest';

import { discoverWeaponPassiveSkillRequests } from '../src/index.ts';

describe('武器被动发现', () => {
  it('按原生槽位产生公共请求，并保留突破与潜能等级模板', () => {
    expect(
      discoverWeaponPassiveSkillRequests({ wpn_fixture: weaponFixture() }, ['wpn_fixture']),
    ).toEqual([
      {
        originKind: 'weapon',
        originId: 'wpn_fixture',
        sourcePath: 'WeaponBasicTable.wpn_fixture.weaponSkillList[0]',
        skillId: 'wpn_attr_fixture',
        levelSource: {
          kind: 'weaponProgression',
          slotIndex: 0,
          breakthroughTemplateId: 'breakthrough_fixture',
          talentTemplateId: 'talent_fixture',
        },
        inputBlackboard: {},
      },
      expect.objectContaining({
        skillId: 'sk_wpn_fixture',
        levelSource: expect.objectContaining({ slotIndex: 1 }),
      }),
    ]);
  });

  it('拒绝表键与 weaponId 不一致', () => {
    expect(() =>
      discoverWeaponPassiveSkillRequests({ wrong_key: weaponFixture() }, ['wrong_key']),
    ).toThrow('WeaponBasicTable.wrong_key.weaponId: expected "wrong_key"');
  });
});

function weaponFixture(): Record<string, unknown> {
  return {
    breakthroughTemplateId: 'breakthrough_fixture',
    engName: { id: 0, text: '' },
    levelTemplateId: 'level_fixture',
    maxLv: 90,
    modelPath: '',
    potentialUpItemList: [],
    rarity: 6,
    talentTemplateId: 'talent_fixture',
    weaponDesc: { id: 0, text: '' },
    weaponId: 'wpn_fixture',
    weaponPotentialSkill: 'sk_wpn_fixture',
    weaponSkillList: ['wpn_attr_fixture', 'sk_wpn_fixture'],
    weaponType: 1,
  };
}
