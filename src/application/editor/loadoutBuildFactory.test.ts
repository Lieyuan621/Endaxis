import { describe, expect, it } from 'vitest';
import type { GearDefinition, WeaponDefinition } from '../../core/game-data/equipmentDefinition';
import { perlica } from '../../data/operators';
import { gameDataRepository } from '../../data/gameDataRepository';
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
  it('按干员技能等级来源建立一次默认值', () => {
    const build = createDefaultOperatorInstance({
      ...perlica,
      // 组级字段只负责迁移期展示；养成实例必须从每个技能读取等级来源。
      skillGroups: perlica.skillGroups.map(group => ({ ...group, levelSource: 'basicAttack' })),
    });

    expect(build.operatorSlug).toBe(perlica.slug);
    expect(build.skillLevels).toEqual({
      basicAttack: 12,
      battleSkill: 12,
      comboSkill: 12,
      ultimate: 12,
    });
    expect(build).toMatchObject({
      level: 90,
      promoted: true,
      potential: 5,
      trustLevel: 4,
      talentStates: { 0: 2, 1: 1 },
    });
  });

  it('按定义词条数量建立武器和装备初始等级', () => {
    const weapon: WeaponDefinition = {
      slug: 'weapon',
      rarity: 6,
      weaponType: 'sword',
      baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
      traits: [
        { key: 'first', levelCount: 9 },
        { key: 'second', levelCount: 9 },
      ],
    };
    const gear: GearDefinition = {
      slug: 'gear',
      slotType: 'armor',
      levelRequirement: 70,
      baseDefense: 100,
      traits: [
        { key: 'first', levelCount: 4, display: gearDisplay },
        { key: 'second', levelCount: 4, display: gearDisplay },
      ],
    };

    expect(createDefaultWeaponInstance(weapon)).toMatchObject({
      level: 90,
      tuned: true,
      potential: 0,
      traitLevels: [9, 9],
    });
    expect(createDefaultGearInstance(gear, 3).artificingLevels).toEqual([3, 3]);
  });

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

  it('所有正式干员只从当前定义建立默认潜能与技能、天赋加点', () => {
    for (const operator of gameDataRepository.getOperators()) {
      const build = createDefaultOperatorInstance(operator);
      const expectedPotential = operator.defaultPotential ?? (operator.rarity <= 5 ? 5 : 0);
      const expectedSkillLevels = Object.fromEntries(
        [
          ...new Set(
            operator.skillGroups.flatMap(group => {
              const skills = Array.isArray(group.skills) ? group.skills : [group.skills];
              return [...skills, ...(group.replacementSkills ?? [])].flatMap(skill =>
                skill.levelSource === undefined ? [] : [skill.levelSource],
              );
            }),
          ),
        ].map(source => [source, 12]),
      );
      const expectedTalentStates = Object.fromEntries(
        operator.talents.map((talent, index) => [String(index), talent.levels]),
      );

      expect(build.potential, `${operator.slug} 默认潜能`).toBe(expectedPotential);
      expect(build.skillLevels, `${operator.slug} 默认技能加点`).toEqual(expectedSkillLevels);
      expect(build.talentStates, `${operator.slug} 默认天赋加点`).toEqual(expectedTalentStates);
    }
  });

  it('所有正式武器只从当前定义建立默认潜能与词条上限', () => {
    for (const weapon of gameDataRepository.getWeapons()) {
      const build = createDefaultWeaponInstance(weapon);
      const potential = weapon.rarity <= 5 ? 5 : 0;
      const expectedTraitLevels = weapon.traits.map(trait => {
        if (trait.key === 'skill1' || trait.key === 'skill2') return Math.min(trait.levelCount, 9);
        if (trait.key === 'skill3') return Math.min(trait.levelCount, 4 + potential);
        return trait.levelCount;
      });

      expect(build, `${weapon.slug} 默认武器养成`).toMatchObject({
        level: 90,
        tuned: true,
        potential,
        traitLevels: expectedTraitLevels,
      });
    }
  });
});
