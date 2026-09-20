import { describe, expect, it } from 'vitest';

import {
  parseWeaponBreakthroughSkillLevels,
  parseWeaponGemTermDefinitions,
  parseWeaponPotentialSkillLevels,
  parseWeaponSkillLevelOneTags,
  resolveWeaponSkillLevels,
} from '../src/index.ts';

describe('武器技能等级', () => {
  it('按突破、潜能、基质标签顺序解析，并分别受最终上限约束', () => {
    const breakthrough = parseWeaponBreakthroughSkillLevels(
      {
        breakthrough_fixture: {
          list: [
            breakthroughRow(80, [
              [3, 9],
              [3, 9],
              [1, 4],
            ]),
          ],
        },
      },
      'breakthrough_fixture',
    );
    const potential = parseWeaponPotentialSkillLevels(
      {
        potential_fixture: {
          list: [
            potentialRow(5, [
              [0, 0],
              [0, 0],
              [5, 5],
            ]),
          ],
        },
      },
      'potential_fixture',
    );
    const terms = parseWeaponGemTermDefinitions(
      {
        gem_a: gemRow('gem_a', 'tag_a'),
        gem_b: gemRow('gem_b', 'tag_b'),
        gem_c: gemRow('gem_c', 'tag_c'),
      },
      ['gem_a', 'gem_b', 'gem_c'],
    );
    const tags = parseWeaponSkillLevelOneTags(
      {
        skill_a: patchRow('skill_a', 'tag_a'),
        skill_b: patchRow('skill_b', 'tag_b'),
        skill_c: patchRow('skill_c', 'tag_c'),
      },
      ['skill_a', 'skill_b', 'skill_c'],
    );

    expect(
      resolveWeaponSkillLevels(
        ['skill_a', 'skill_b', 'skill_c'],
        80,
        breakthrough,
        5,
        potential,
        [
          { termId: 'gem_a', cost: 6 },
          { termId: 'gem_b', cost: 6 },
          { termId: 'gem_c', cost: 3 },
        ],
        terms,
        tags,
      ),
    ).toEqual([
      { skillId: 'skill_a', level: 9, maxLevel: 9 },
      { skillId: 'skill_b', level: 9, maxLevel: 9 },
      { skillId: 'skill_c', level: 9, maxLevel: 9 },
    ]);
  });

  it('缺突破行返回空，缺潜能行保留突破结果', () => {
    const rows = [
      {
        breakthroughLevel: 20,
        skillLevelBounds: [{ lowerBound: 2, upperBound: 5 }],
      },
    ];
    expect(resolveWeaponSkillLevels(['skill'], 40, rows, 1, [], [], {}, {})).toEqual([]);
    expect(resolveWeaponSkillLevels(['skill'], 20, rows, 99, [], [], {}, {})).toEqual([
      { skillId: 'skill', level: 2, maxLevel: 5 },
    ]);
  });

  it('边界不足时失败，但忽略模板中的尾部占位边界', () => {
    expect(() =>
      resolveWeaponSkillLevels(
        ['skill_a', 'skill_b'],
        1,
        [{ breakthroughLevel: 1, skillLevelBounds: [{ lowerBound: 1, upperBound: 3 }] }],
        1,
        [],
        [],
        {},
        {},
      ),
    ).toThrow('breakthroughRows: expected at least 2 weapon skill bounds, found 1');
    expect(
      resolveWeaponSkillLevels(
        ['skill_a', 'skill_b'],
        1,
        [
          {
            breakthroughLevel: 1,
            skillLevelBounds: [
              { lowerBound: 3, upperBound: 9 },
              { lowerBound: 1, upperBound: 4 },
              { lowerBound: 0, upperBound: 0 },
            ],
          },
        ],
        0,
        [],
        [],
        {},
        {},
      ),
    ).toEqual([
      { skillId: 'skill_a', level: 3, maxLevel: 9 },
      { skillId: 'skill_b', level: 1, maxLevel: 4 },
    ]);
  });
});

function breakthroughRow(level: number, bounds: number[][]): Record<string, unknown> {
  return {
    breakItemList: [{ count: 0, id: 'item_fixture' }],
    breakthroughGold: 0,
    breakthroughLv: level,
    breakthroughShowLv: 4,
    skillLevelBounds: bounds.map(([lowerBound, upperBound]) => ({ lowerBound, upperBound })),
  };
}

function potentialRow(level: number, bounds: number[][]): Record<string, unknown> {
  return {
    talentLv: level,
    skillLevelExtraBounds: bounds.map(([lowerBound, upperBound]) => ({ lowerBound, upperBound })),
  };
}

function gemRow(termId: string, tagId: string): Record<string, unknown> {
  return {
    gemTermId: termId,
    isSkillTerm: true,
    sortOrder: 1,
    tagDesc: { id: 0, text: '' },
    tagIcon: '',
    tagId,
    tagName: { id: 0, text: '' },
    termType: 0,
  };
}

function patchRow(skillId: string, tagId: string): Record<string, unknown> {
  return {
    SkillPatchDataBundle: [{ level: 1, skillId, tagId }],
  };
}
