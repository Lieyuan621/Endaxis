import { describe, expect, it } from 'vitest';
import { gameDataRepository } from '../../../data/gameDataRepository';
import {
  createDefaultOperatorInstance,
  createDefaultWeaponInstance,
} from '../../../application/editor/loadoutBuildFactory';
import type { OperatorInstanceViewModel, WeaponInstanceViewModel } from './loadoutBuildViewModel';
import type { OperatorLevel, WeaponLevel } from '../../progression';
import {
  projectMaxOperatorChanges,
  projectMaxWeaponChanges,
  projectOperatorProgressionChange,
  projectWeaponPotentialChange,
  projectWeaponProgressionChange,
} from './loadoutBuildProgression';

function operatorView(slug: string): OperatorInstanceViewModel {
  const definition = gameDataRepository.getOperator(slug)!;
  return { ...createDefaultOperatorInstance(definition), definition };
}

function weaponView(slug: string): WeaponInstanceViewModel {
  const definition = gameDataRepository.getWeapon(slug)!;
  return { ...createDefaultWeaponInstance(definition), definition };
}

describe('loadout build progression projection', () => {
  it('lowering an operator clamps promotion, skill levels and trust in one change', () => {
    const operator = operatorView('perlica');
    expect(projectOperatorProgressionChange(operator, 1, true)).toMatchObject({
      level: 1,
      promoted: false,
      trustLevel: 0,
      skillLevels: {
        basicAttack: 3,
        battleSkill: 3,
        comboSkill: 3,
        ultimate: 3,
      },
    });
  });

  it.each([
    [1, false, false, 3, 0],
    [20, false, false, 3, 0],
    [20, true, true, 3, 1],
    [40, false, false, 3, 1],
    [40, true, true, 6, 2],
    [60, false, false, 6, 2],
    [60, true, true, 9, 3],
    [80, false, false, 9, 3],
    [80, true, true, 12, 4],
    [90, false, true, 12, 4],
  ] as const)(
    'projects operator level %i promoted=%s to native limits',
    (level, requestedPromoted, promoted, skillMaximum, trustMaximum) => {
      const operator = operatorView('perlica');
      const projected = projectOperatorProgressionChange(
        operator,
        level as OperatorLevel,
        requestedPromoted,
      );
      expect(projected.promoted).toBe(promoted);
      expect(projected.trustLevel).toBe(trustMaximum);
      expect(Object.values(projected.skillLevels ?? {})).toEqual(
        expect.arrayContaining([skillMaximum]),
      );
      expect(
        Object.values(projected.skillLevels ?? {}).every(value => value === skillMaximum),
      ).toBe(true);
    },
  );

  it('maxing a six-star operator preserves manually selected potential', () => {
    const operator = { ...operatorView('laevatain'), potential: 3 };
    expect(projectMaxOperatorChanges(operator, operator.definition).potential).toBe(3);
  });

  it('maxing weapons only fills potential for lower rarities', () => {
    const lowerRarity = { ...weaponView('wpn_pistol_0012'), potential: 0 };
    expect(projectMaxWeaponChanges(lowerRarity)).toMatchObject({
      level: 90,
      tuned: true,
      potential: 5,
      traitLevels: [9, 9, 9],
    });

    const sixStarDefinition = gameDataRepository
      .getWeapons()
      .find(definition => definition.rarity === 6)!;
    const sixStar = {
      ...createDefaultWeaponInstance(sixStarDefinition),
      definition: sixStarDefinition,
      potential: 2,
    };
    expect(projectMaxWeaponChanges(sixStar).potential).toBe(2);
  });

  it('changing weapon potential preserves invested skill3 slots', () => {
    const original = weaponView('wpn_pistol_0012');
    const weapon = { ...original, potential: 1, traitLevels: [9, 9, 7] };
    const raised = projectWeaponPotentialChange(weapon, 4);
    expect(raised.potential).toBe(4);
    expect(raised.traitLevels?.[2]).toBe(8);
    const lowered = projectWeaponPotentialChange(
      { ...weapon, potential: 4, traitLevels: [9, 9, 9] },
      1,
    );
    expect(lowered.traitLevels?.[2]).toBe(5);
  });

  it.each([
    [1, true, false, [3, 3, 4]],
    [20, false, false, [3, 3, 4]],
    [20, true, true, [5, 4, 4]],
    [40, false, false, [5, 4, 4]],
    [40, true, true, [6, 6, 4]],
    [60, false, false, [6, 6, 4]],
    [60, true, true, [8, 7, 4]],
    [80, false, false, [8, 7, 4]],
    [80, true, true, [9, 9, 4]],
    [90, false, true, [9, 9, 4]],
  ] as const)(
    'projects weapon level %i tuned=%s to native trait limits',
    (level, requestedTuned, tuned, expectedLevels) => {
      const weapon = {
        ...weaponView('wpn_pistol_0012'),
        level: 90,
        tuned: true,
        potential: 0,
        traitLevels: [9, 9, 9],
      };
      const projected = projectWeaponProgressionChange(
        weapon,
        level as WeaponLevel,
        requestedTuned,
      );
      expect(projected.tuned).toBe(tuned);
      expect(projected.traitLevels).toEqual(expectedLevels);
    },
  );
});
