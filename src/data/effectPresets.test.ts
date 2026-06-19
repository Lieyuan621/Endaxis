import { describe, expect, it } from 'vitest';
import { getEffectColor, getEffectIcon, getEffectName } from './effectPresets';
import type { Effect } from './types';

describe('effect display presets', () => {
  it('renders negative dmgBonus with element-specific damage-down icons', () => {
    const cases = [
      ['physical', '/icons/icon_battle_affix_physical_vulnerable.webp', '物理伤害降低'],
      ['heat', '/icons/icon_battle_affix_fire_vulnerable.webp', '灼热伤害降低'],
      ['cryo', '/icons/icon_battle_affix_cryst_vulnerable.webp', '寒冷伤害降低'],
      ['electric', '/icons/icon_battle_affix_pulse_vulnerable.webp', '电磁伤害降低'],
      ['nature', '/icons/icon_battle_affix_natural_vulnerable.webp', '自然伤害降低'],
    ] as const;

    for (const [element, icon, name] of cases) {
      const effect: Effect = {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: [element] },
        target: 'self',
        value: -45,
        duration: 10,
        external: true,
      };

      expect(getEffectIcon(effect)).toBe(icon);
      expect(getEffectColor(effect)).toBe('#b71915');
      expect(getEffectName(effect)).toBe(name);
    }
  });

  it('falls back to the shelter icon for non-element negative dmgBonus', () => {
    const effect: Effect = {
      kind: 'status',
      stat: { modifier: 'dmgBonus', skillTypes: 'ultimate' },
      target: 'self',
      value: -45,
      duration: 10,
      external: true,
    };

    expect(getEffectIcon(effect)).toBe('/icons/icon_battle_affix_shelter.webp');
    expect(getEffectColor(effect)).toBe('#b71915');
    expect(getEffectName(effect)).toBe('终结技伤害降低');
  });

  it('keeps positive dmgBonus on the regular damage-up display', () => {
    const effect: Effect = {
      kind: 'status',
      stat: { modifier: 'dmgBonus', elements: ['physical'] },
      target: 'self',
      value: 20,
      duration: 10,
    };

    expect(getEffectIcon(effect)).toBe('/icons/icon_battle_physical_dmg_up.webp');
  });
});
