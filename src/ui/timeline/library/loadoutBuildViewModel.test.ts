import { describe, expect, it } from 'vitest';

import { createGameDataRepository } from '../../../data/gameDataRepository';
import { perlica } from '../../../data/operators/index';
import {
  gearDefinitions,
  gearSetDefinitions,
  weaponDefinitions,
} from '../../../data/equipment/index';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { ScenarioDocument } from '../../../core/project/schema';
import { projectTrackLoadoutBuilds } from './loadoutBuildViewModel';

const weapon = weaponDefinitions.find(value => value.weaponType === perlica.weaponType)!;
const armor = gearDefinitions.find(value => value.slotType === 'armor')!;
const accessory = gearDefinitions.find(value => value.slotType === 'accessory')!;
const repository = createGameDataRepository({
  revision: 'fixture',
  operators: [perlica],
  weapons: [weapon],
  gears: [armor, accessory],
  gearSets: gearSetDefinitions,
});

function createEquippedScenario(): ScenarioDocument {
  const scenario = createEmptyScenario('scenario', 'Scenario');

  scenario.tracks[0] = {
    id: 'track:0',
    operator: {
      operatorSlug: perlica.slug,
      level: 90,
      promoted: true,
      potential: 3,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 11 },
      talentStates: { talent1: 2 },
      baseStatOverrides: { attack: 1234 },
    },
    weapon: {
      weaponSlug: weapon.slug,
      level: 80,
      tuned: true,
      potential: 2,
      traitLevels: [3, 4, 5],
    },
    gears: {
      armor: {
        gearSlug: armor.slug,
        artificingLevels: [1, 2],
      },
      gloves: null,
      accessory1: {
        gearSlug: accessory.slug,
        artificingLevels: [3],
      },
      accessory2: null,
    },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  return scenario;
}

describe('projectTrackLoadoutBuilds', () => {
  it('按轨道和槽位解析所选定义', () => {
    const scenario = createEquippedScenario();

    const projected = projectTrackLoadoutBuilds(scenario, 0, repository);

    expect(projected.operator?.definition).toBe(perlica);
    expect(projected.weapon?.definition).toBe(weapon);
    expect(projected.gears.armor?.definition).toBe(armor);
    expect(projected.gears.accessory1?.definition).toBe(accessory);
    expect(projected.gears.gloves).toBeNull();
    expect(projected.gears.accessory2).toBeNull();
  });

  it('复制项目中的可编辑集合，避免投影被源文档后续修改', () => {
    const scenario = createEquippedScenario();
    const projected = projectTrackLoadoutBuilds(scenario, 0, repository);

    scenario.tracks[0]!.operator!.skillLevels.basicAttack = 1;
    scenario.tracks[0]!.weapon!.traitLevels[0] = 9;
    scenario.tracks[0]!.gears.armor!.artificingLevels[0] = 3;

    expect(projected.operator?.skillLevels.basicAttack).toBe(12);
    expect(projected.weapon?.traitLevels).toEqual([3, 4, 5]);
    expect(projected.gears.armor?.artificingLevels).toEqual([1, 2]);
  });

  it('拒绝武器实例指向的缺失定义', () => {
    const scenario = createEquippedScenario();
    scenario.tracks[0]!.weapon!.weaponSlug = 'missing-weapon';

    expect(() => projectTrackLoadoutBuilds(scenario, 0, repository)).toThrow(
      "weapon definition 'missing-weapon' does not exist",
    );
  });

  it('拒绝 Build 指向的缺失定义', () => {
    const scenario = createEquippedScenario();
    scenario.tracks[0]!.gears.armor!.gearSlug = 'missing-gear';

    expect(() => projectTrackLoadoutBuilds(scenario, 0, repository)).toThrow(
      "gear definition 'missing-gear' does not exist",
    );
  });

  it('拒绝索引返回与查询身份不一致的定义', () => {
    const scenario = createEquippedScenario();
    const inconsistentRepository = {
      ...repository,
      getOperator: () => ({ ...perlica, slug: 'wrong-operator' }),
    };

    expect(() => projectTrackLoadoutBuilds(scenario, 0, inconsistentRepository)).toThrow(
      `operator definition '${perlica.slug}' resolved definition identity 'wrong-operator'`,
    );
  });
});
