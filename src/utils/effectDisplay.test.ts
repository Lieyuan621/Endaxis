import { describe, expect, it } from 'vitest';
import { getDisplayKeyCandidates, resolveEffectDisplayKey } from './effectDisplay';

describe('effect display key resolution', () => {
  it('derives display keys from simulator stat effects', () => {
    const effect = {
      kind: 'status',
      stat: { modifier: 'dmgBonus', elements: 'heat' },
      target: 'self',
      value: 25,
    };

    expect(resolveEffectDisplayKey(effect)).toBe('dmgBonus:heat');
    expect(getDisplayKeyCandidates(effect)).toContain('dmgBonus:heat');
  });

  it('derives arts group display keys from multi-element stat effects', () => {
    expect(
      resolveEffectDisplayKey({
        kind: 'status',
        stat: { modifier: 'resistanceShred', elements: ['heat', 'cryo', 'electric', 'nature'] },
        target: 'enemy',
        value: 12,
      }),
    ).toBe('resistanceShred:arts');
  });

  it('derives display candidates from runtime state projection keys', () => {
    expect(getDisplayKeyCandidates('state:razorClawmark')).toContain('razorClawmark');
  });
});
