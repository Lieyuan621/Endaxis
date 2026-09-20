import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { ScenarioDocument } from '../../../core/project/schema';
import {
  updateTrackGearInstance,
  updateTrackOperatorInstance,
  updateTrackWeaponInstance,
} from './loadoutBuildCommands';

function equippedScenario(): ScenarioDocument {
  const scenario = createEmptyScenario('scenario', 'Scenario');

  scenario.tracks[0] = {
    id: 'track:0',
    operator: {
      operatorSlug: 'operator',
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: {},
      talentStates: {},
    },
    weapon: {
      weaponSlug: 'weapon',
      level: 90,
      tuned: true,
      potential: 0,
      traitLevels: [1, 1, 1],
    },
    gears: {
      armor: {
        gearSlug: 'armor',
        artificingLevels: [0, 0],
      },
      gloves: null,
      accessory1: null,
      accessory2: null,
    },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  return scenario;
}

describe('loadoutBuildCommands', () => {
  it('updates operator inputs without mutating the source document', () => {
    const source = equippedScenario();
    const updated = updateTrackOperatorInstance(source, 0, {
      level: 80,
      promoted: false,
      potential: 2,
      trustLevel: 3,
      skillLevels: { basicAttack: 10 },
      talentStates: { 0: 1 },
    });

    expect(updated.tracks[0]!.operator).toMatchObject({
      operatorSlug: 'operator',
      level: 80,
      promoted: false,
      potential: 2,
      trustLevel: 3,
      skillLevels: { basicAttack: 10 },
      talentStates: { 0: 1 },
    });
    expect(source.tracks[0]!.operator!.level).toBe(90);
  });

  it('updates weapon inputs without mutating the source document', () => {
    const source = equippedScenario();
    const updated = updateTrackWeaponInstance(source, 0, {
      level: 80,
      potential: 3,
      tuned: false,
      traitLevels: [4, 5, 6],
    });

    expect(updated.tracks[0]!.weapon).toMatchObject({
      weaponSlug: 'weapon',
      level: 80,
      potential: 3,
      tuned: false,
      traitLevels: [4, 5, 6],
    });
    expect(source.tracks[0]!.weapon!.level).toBe(90);
  });

  it('updates gear artificing inputs without mutating the source document', () => {
    const source = equippedScenario();
    const updated = updateTrackGearInstance(source, 0, 'armor', [1, 2]);

    expect(updated.tracks[0]!.gears.armor!.artificingLevels).toEqual([1, 2]);
    expect(source.tracks[0]!.gears.armor!.artificingLevels).toEqual([0, 0]);
  });

  it('rejects malformed inputs and builds that are not equipped by the track', () => {
    const scenario = equippedScenario();
    expect(() => updateTrackOperatorInstance(scenario, 0, { potential: -1 })).toThrow(
      'operator potential',
    );
    expect(() => updateTrackWeaponInstance(scenario, 0, { level: 0 })).toThrow('weapon level');
    expect(() => updateTrackWeaponInstance(scenario, 0, { traitLevels: [0] })).toThrow(
      'weapon trait level 0',
    );
    expect(() => updateTrackGearInstance(scenario, 0, 'gloves', [0])).toThrow(
      "track 0 has no gear instance in 'gloves'",
    );
  });
});
