import { describe, expect, test } from 'vitest';
import type { GearInstanceViewModel, TrackLoadoutInstanceViewModel } from './loadoutBuildViewModel';
import { projectActiveGearSetLabels } from './activeGearSetHint';

function gear(slot: GearInstanceViewModel['slot'], set: string): GearInstanceViewModel {
  return {
    slot,
    gearSlug: `gear:${slot}`,
    artificingLevels: [],
    definition: {
      slug: `gear:${slot}`,
      slotType: slot === 'accessory1' || slot === 'accessory2' ? 'accessory' : slot,
      levelRequirement: 1,
      baseDefense: 0,
      traits: [],
      gearSetSlug: set,
    },
  };
}

function loadout(sets: readonly (string | null)[]): TrackLoadoutInstanceViewModel {
  const resolve = (slot: GearInstanceViewModel['slot'], index: number) =>
    sets[index] === null ? null : gear(slot, sets[index]!);
  return {
    trackIndex: 0,
    operator: null,
    weapon: null,
    gears: {
      armor: resolve('armor', 0),
      gloves: resolve('gloves', 1),
      accessory1: resolve('accessory1', 2),
      accessory2: resolve('accessory2', 3),
    },
  };
}

describe('projectActiveGearSetLabels', () => {
  test('uses the same three-piece activation boundary as scenario compilation', () => {
    expect(
      projectActiveGearSetLabels(loadout(['set:a', 'set:a', null, null]), { 'set:a': 'A' }),
    ).toEqual([]);
    expect(
      projectActiveGearSetLabels(loadout(['set:a', 'set:a', 'set:a', null]), { 'set:a': 'A' }),
    ).toEqual(['A']);
  });

  test('does not claim an unresolved set is active', () => {
    expect(
      projectActiveGearSetLabels(loadout(['missing', 'missing', 'missing', null]), {}),
    ).toEqual([]);
  });
});
