import { describe, expect, it } from 'vitest';

import { discoverEquipmentSuitPassiveSkillRequests } from '../src/index.ts';

describe('装备套装被动发现', () => {
  it('按原生阈值顺序产生公共请求，并保留件数和技能等级', () => {
    expect(
      discoverEquipmentSuitPassiveSkillRequests(
        {
          suit_fixture: suitFixture([
            threshold('suit_fixture', 2, 'passive_suit_two', 1),
            threshold('suit_fixture', 4, 'passive_suit_four', 3),
          ]),
        },
        ['suit_fixture'],
      ),
    ).toEqual([
      {
        originKind: 'equipmentSuit',
        originId: 'suit_fixture',
        sourcePath: 'EquipSuitTable.suit_fixture.list[0]',
        skillId: 'passive_suit_two',
        levelSource: { kind: 'equipmentSuitThreshold', level: 1, requiredCount: 2 },
        inputBlackboard: {},
      },
      expect.objectContaining({
        sourcePath: 'EquipSuitTable.suit_fixture.list[1]',
        skillId: 'passive_suit_four',
        levelSource: { kind: 'equipmentSuitThreshold', level: 3, requiredCount: 4 },
      }),
    ]);
  });

  it('拒绝阈值所属套装不一致以及重复装备 ID', () => {
    expect(() =>
      discoverEquipmentSuitPassiveSkillRequests(
        { suit_fixture: suitFixture([threshold('other_suit', 3, 'passive_suit', 1)]) },
        ['suit_fixture'],
      ),
    ).toThrow('EquipSuitTable.suit_fixture.list[0].suitID: expected "suit_fixture"');

    const duplicate = suitFixture([threshold('suit_fixture', 3, 'passive_suit', 1)]);
    duplicate.equipList = ['equip_a', 'equip_a'];
    expect(() =>
      discoverEquipmentSuitPassiveSkillRequests({ suit_fixture: duplicate }, ['suit_fixture']),
    ).toThrow('EquipSuitTable.suit_fixture.equipList: duplicate equipment ID');
  });
});

function suitFixture(list: unknown[]): Record<string, unknown> {
  return { equipList: ['equip_a', 'equip_b'], list };
}

function threshold(
  suitId: string,
  equipCnt: number,
  skillId: string,
  skillLv: number,
): Record<string, unknown> {
  return {
    equipCnt,
    skillID: skillId,
    skillLv,
    suitID: suitId,
    suitLogoName: 'icon_suit_fixture',
    suitName: { id: 0, text: '' },
  };
}
