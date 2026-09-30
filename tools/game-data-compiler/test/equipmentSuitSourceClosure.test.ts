import { describe, expect, it } from 'vitest';

import { compileEquipmentSuitSourceClosure } from '../src/index.ts';
import { activeSkillFixture, buffFixture as sourceBuffFixture } from './sourceFixtures.ts';

describe('装备套装来源闭包', () => {
  it('关闭三件套被动的 SkillData 与 BuffData 引用', () => {
    const result = compileEquipmentSuitSourceClosure(
      { suit_fixture: suitFixture(3) },
      { passive_fixture: passiveFixture('passive_fixture', 'buff_fixture') },
      {},
      { buff_fixture: buffFixture('buff_fixture') },
    );

    expect(result).toEqual({
      suits: [
        {
          suitId: 'suit_fixture',
          skillId: 'passive_fixture',
          skillLevel: 1,
          requiredCount: 3,
        },
      ],
      passiveSkillDefinitionCount: 1,
      buffDefinitionIds: ['buff_fixture'],
    });
  });

  it('拒绝非三件阈值与缺失的活动 Buff 定义', () => {
    expect(() =>
      compileEquipmentSuitSourceClosure(
        { suit_fixture: suitFixture(2) },
        { passive_fixture: passiveFixture('passive_fixture', 'buff_fixture') },
        {},
        { buff_fixture: buffFixture('buff_fixture') },
      ),
    ).toThrow('Next GearSetDefinition requires exactly 3 pieces');

    expect(() =>
      compileEquipmentSuitSourceClosure(
        { suit_fixture: suitFixture(3) },
        { passive_fixture: passiveFixture('passive_fixture', 'buff_missing') },
        {},
        {},
      ),
    ).toThrow('missing active buff definition "buff_missing"');
  });
});

function suitFixture(equipCnt: number): Record<string, unknown> {
  return {
    equipList: ['gear-a', 'gear-b', 'gear-c'],
    list: [
      {
        equipCnt,
        skillID: 'passive_fixture',
        skillLv: 1,
        suitID: 'suit_fixture',
        suitLogoName: 'icon_suit_fixture',
        suitName: { id: 1, text: '' },
      },
    ],
  };
}

function passiveFixture(skillId: string, buffId: string): Record<string, unknown> {
  return {
    ...activeSkillFixture(skillId, 'Passive'),
    blackboard: [],
    buffs: [{ buffId, assignBlackboard: false, assignItems: [] }],
    durationFrame: 0,
    exclusiveFrame: 0,
  };
}

function buffFixture(id: string): Record<string, unknown> {
  return sourceBuffFixture({ id, applyTags: [] });
}
