import { describe, expect, it } from 'vitest';
import { getWeaponTraitValueText } from './weaponTraitPresentation';

describe('current weapon trait presentation', () => {
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
