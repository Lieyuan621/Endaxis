import { describe, expect, it } from 'vitest';
import {
  matchBattleLogTypePreset,
  resolveBattleLogTypePreset,
} from './battleLogTypePresets';

describe('battleLogTypePresets', () => {
  const available = [
    'DAMAGE_HIT',
    'STAGGER',
    'INFLICTION_APPLY',
    'REACTION_TRIGGER',
    'DEBUFF_APPLY',
    'OPERATOR_EFFECT_APPLY',
    'SP_CHANGE',
  ];

  it('resolves damage / status / all presets against available types', () => {
    expect(resolveBattleLogTypePreset('damage', available)).toEqual([
      'DAMAGE_HIT',
      'STAGGER',
      'SP_CHANGE',
    ]);
    expect(resolveBattleLogTypePreset('status', available)).toEqual([
      'INFLICTION_APPLY',
      'REACTION_TRIGGER',
      'DEBUFF_APPLY',
      'OPERATOR_EFFECT_APPLY',
    ]);
    expect(resolveBattleLogTypePreset('all', available)).toEqual(available);
  });

  it('matches the active preset from the current selection', () => {
    expect(matchBattleLogTypePreset(new Set(available), available)).toBe('all');
    expect(
      matchBattleLogTypePreset(new Set(['DAMAGE_HIT', 'STAGGER', 'SP_CHANGE']), available),
    ).toBe('damage');
    expect(
      matchBattleLogTypePreset(
        new Set(['INFLICTION_APPLY', 'REACTION_TRIGGER', 'DEBUFF_APPLY', 'OPERATOR_EFFECT_APPLY']),
        available,
      ),
    ).toBe('status');
  });
});
