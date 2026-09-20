import { describe, expect, it } from 'vitest';

import {
  STANDARD_OPERATOR_PANEL_MILESTONES,
  compileOperatorAttributeGrowthSource,
  findExactCharacterAttributeKeyFrame,
  parseOperatorCharacterTableSource,
} from '../src/index.ts';

describe('干员 CharacterTable 适配', () => {
  it('严格读取身份、默认武器和精确属性关键帧', () => {
    const character = parseOperatorCharacterTableSource(characterTable(), 'chr_0004_pelica', {
      CriticalRate: 0.05,
    });
    expect(character).toMatchObject({
      characterId: 'chr_0004_pelica',
      characterTypeId: 'Pulse',
      profession: 'CASTER',
      rarity: 6,
      nativeWeaponType: 'Wand',
      mainAttribute: 'intellect',
      secondaryAttribute: 'will',
      weaponType: 'arts-unit',
      element: 'electric',
      role: 'caster',
      projectedRarity: 6,
      defaultWeaponId: 'wpn_funnel_0002',
    });
    expect(findExactCharacterAttributeKeyFrame(character, 90, 4)).toMatchObject({
      level: 90,
      breakStage: 4,
      attributes: { Atk: 303, CriticalRate: 0.05 },
    });
    expect(findExactCharacterAttributeKeyFrame(character, 90, 3)).toBeNull();
  });

  it.each([4, 5, 6, 3, 7])('星级 %s 保留原生值，按正式范围接受或阻断', rarity => {
    const table = characterTable();
    table.chr_0004_pelica.rarity = rarity;
    if ([4, 5, 6].includes(rarity)) {
      expect(parseOperatorCharacterTableSource(table, 'chr_0004_pelica')).toMatchObject({
        rarity,
        projectedRarity: rarity,
      });
    } else {
      expect(() => parseOperatorCharacterTableSource(table, 'chr_0004_pelica')).toThrow(
        `rarity ${rarity} has no supported Next projection`,
      );
    }
  });

  it('按显式六档里程碑投影，并锁定对象级面板结果', () => {
    const table = characterTable();
    const character = parseOperatorCharacterTableSource(table, 'chr_0004_pelica');
    const result = compileOperatorAttributeGrowthSource(
      character,
      STANDARD_OPERATOR_PANEL_MILESTONES,
    );
    expect(result).toEqual({
      strength: [9, 26, 45, 64, 82, 91],
      agility: [9, 27, 46, 65, 84, 93],
      intellect: [21, 51, 83, 114, 145, 161],
      will: [13, 34, 57, 79, 102, 113],
      baseAttack: [30, 88, 150, 211, 272, 303],
      baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
    });
  });

  it('拒绝身份漂移、重复属性、非主属性身份和缺失精确里程碑', () => {
    const mismatched = characterTable();
    mismatched.chr_0004_pelica.charId = 'chr_wrong';
    expect(() => parseOperatorCharacterTableSource(mismatched, 'chr_0004_pelica')).toThrow(
      'does not match map key',
    );

    const duplicate = characterTable();
    duplicate.chr_0004_pelica.attributes[0]!.Attribute.attrs.push({
      attrType: 39,
      attrValue: 1,
    });
    expect(() => parseOperatorCharacterTableSource(duplicate, 'chr_0004_pelica')).toThrow(
      'duplicate attribute Str',
    );

    const invalidPrimary = characterTable();
    invalidPrimary.chr_0004_pelica.mainAttrType = 2;
    expect(() => parseOperatorCharacterTableSource(invalidPrimary, 'chr_0004_pelica')).toThrow(
      'is not a primary attribute',
    );

    const invalidProfession = characterTable();
    invalidProfession.chr_0004_pelica.profession = 9;
    expect(() => parseOperatorCharacterTableSource(invalidProfession, 'chr_0004_pelica')).toThrow(
      'unknown ProfessionCategory 9',
    );

    const incomplete = characterTable();
    incomplete.chr_0004_pelica.attributes.pop();
    const character = parseOperatorCharacterTableSource(incomplete, 'chr_0004_pelica');
    expect(() =>
      compileOperatorAttributeGrowthSource(character, STANDARD_OPERATOR_PANEL_MILESTONES),
    ).toThrow('missing exact panel key frame (90, 4)');
  });
});

interface CharacterTableFixture {
  chr_0004_pelica: {
    charId: string;
    charTypeId: string;
    profession: number;
    rarity: number;
    mainAttrType: number;
    subAttrType: number;
    defaultWeaponId: string;
    charPassiveUIPrefabName: string;
    weaponType: number;
    attributes: Array<{
      Attribute: { attrs: Array<{ attrType: number; attrValue: number }> };
      breakStage: number;
    }>;
    ignoredFutureField: boolean;
  };
}

function characterTable(): CharacterTableFixture {
  const panels = [
    [1, 0, 9.278, 9.484, 21.649, 13.608, 30, 500],
    [20, 0, 26.907, 27.505, 51.547, 34.952, 88, 1566],
    [40, 1, 45.463, 46.474, 83.019, 57.419, 150, 2689],
    [60, 2, 64.02, 65.443, 114.491, 79.887, 211, 3811],
    [80, 3, 82.577, 84.412, 145.963, 102.354, 272, 4934],
    [90, 4, 91.855, 93.896, 161.699, 113.588, 303, 5495],
  ] as const;
  return {
    chr_0004_pelica: {
      charId: 'chr_0004_pelica',
      charTypeId: 'Pulse',
      profession: 5,
      rarity: 6,
      mainAttrType: 41,
      subAttrType: 42,
      defaultWeaponId: 'wpn_funnel_0002',
      charPassiveUIPrefabName: '',
      weaponType: 2,
      attributes: panels.map(
        ([level, breakStage, strength, agility, intellect, will, attack, health]) => ({
          Attribute: {
            attrs: [
              { attrType: 0, attrValue: level },
              { attrType: 39, attrValue: strength },
              { attrType: 40, attrValue: agility },
              { attrType: 41, attrValue: intellect },
              { attrType: 42, attrValue: will },
              { attrType: 2, attrValue: attack },
              { attrType: 1, attrValue: health },
            ],
          },
          breakStage,
        }),
      ),
      ignoredFutureField: true,
    },
  };
}
