import { describe, expect, it } from 'vitest';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { getWeaponTraitValueText } from './weaponTraitPresentation';

describe('current weapon trait presentation', () => {
  it('derives a unique static value from the current weapon definition', () => {
    const weapon = gameDataRepository.getWeapon('wpn_pistol_0012');
    expect(weapon).not.toBeNull();
    expect(getWeaponTraitValueText(weapon!.traits[0]!, 9)).toBe('+124');
    expect(getWeaponTraitValueText(weapon!.traits[2]!, 9)).toBe('+14%');
  });

  it('does not invent a single summary for event-only or multi-modifier traits', () => {
    expect(
      getWeaponTraitValueText({ key: 'event-only', levelCount: 1, eventHandlers: [] }, 1),
    ).toBe('');
    expect(
      getWeaponTraitValueText(
        {
          key: 'multi',
          levelCount: 1,
          modifiers: [
            { kind: 'panelStat', stat: 'attackFlat', value: 10 },
            { kind: 'panelStat', stat: 'healthFlat', value: 20 },
          ],
        },
        1,
      ),
    ).toBe('');
  });
});
