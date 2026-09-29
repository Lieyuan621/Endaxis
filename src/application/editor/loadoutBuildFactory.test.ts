import { describe, expect, it } from 'vitest';
import type { GearDefinition, WeaponDefinition } from '../../core/game-data/equipmentDefinition';
import { perlica } from '../../data/operators';
import {
  createDefaultGearInstance,
  createDefaultOperatorInstance,
  createDefaultWeaponInstance,
  resolveGearArtificingLevels,
  resolveMaxGearArtificingLevels,
} from './loadoutBuildFactory';

const gearDisplay = {
  kind: 'modifier',
  modifier: { kind: 'panelStat', stat: 'attackFlat', value: 0 },
} as const;

describe('loadoutBuildFactory', () => {
  it('装备精锻按每条词条自己的 0 基档位上限解析', () => {
    const gear: GearDefinition = {
      slug: 'custom-gear',
      slotType: 'gloves',
      levelRequirement: 70,
      baseDefense: 1,
      traits: [
        { key: 'single', levelCount: 1, display: gearDisplay },
        { key: 'four-levels', levelCount: 4, display: gearDisplay },
        { key: 'six-levels', levelCount: 6, display: gearDisplay },
      ],
    };

    expect(resolveGearArtificingLevels(gear, 3)).toEqual([0, 3, 3]);
    expect(resolveGearArtificingLevels(gear, 99)).toEqual([0, 3, 5]);
    expect(resolveMaxGearArtificingLevels(gear)).toEqual([0, 3, 5]);
    expect(createDefaultGearInstance(gear, 99).artificingLevels).toEqual([0, 3, 5]);
  });

  it('非原生三槽身份的自定义武器词条直接使用定义级数', () => {
    const weapon: WeaponDefinition = {
      slug: 'custom-weapon',
      rarity: 6,
      weaponType: 'sword',
      baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
      traits: [
        { key: 'skill1', levelCount: 12 },
        { key: 'custom-passive', levelCount: 12 },
      ],
    };

    expect(createDefaultWeaponInstance(weapon).traitLevels).toEqual([9, 12]);
  });

  it('沿用旧版低星满潜和显式默认潜能策略', () => {
    const lowRarityWeapon: WeaponDefinition = {
      slug: 'weapon-low',
      rarity: 5,
      weaponType: 'sword',
      baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
      traits: [
        { key: 'skill1', levelCount: 9 },
        { key: 'skill2', levelCount: 9 },
        { key: 'skill3', levelCount: 9 },
      ],
    };
    expect(createDefaultWeaponInstance(lowRarityWeapon)).toMatchObject({
      potential: 5,
      traitLevels: [9, 9, 9],
    });
    expect(
      createDefaultOperatorInstance({ ...perlica, rarity: 6, defaultPotential: 2 }),
    ).toMatchObject({ potential: 2 });
  });
});
