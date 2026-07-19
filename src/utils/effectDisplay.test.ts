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

  it('prefers kind over runtime id for non-status effects without a name', () => {
    expect(
      resolveEffectDisplayKey({
        kind: 'spReturn',
        id: 'tangtang-waterspouts-sp-return',
        value: 0,
      }),
    ).toBe('spReturn');
  });

  it('prefers name over runtime id for named status effects', () => {
    expect(
      resolveEffectDisplayKey({
        kind: 'status',
        id: 'tangtang-whirlpools',
        name: 'whirlpools',
        target: 'self',
      }),
    ).toBe('whirlpools');
  });

  it('prefers branded name over mechanical stat key (Antal focus)', () => {
    expect(
      resolveEffectDisplayKey({
        kind: 'status',
        id: 'antal-battle-focus',
        name: 'focus',
        stat: { modifier: 'susceptibility', elements: ['electric', 'heat'] },
        target: 'enemy',
      }),
    ).toBe('focus');
  });

  it('ignores displayType when it was auto-stamped from the stat key', () => {
    expect(
      resolveEffectDisplayKey({
        kind: 'status',
        id: 'antal-battle-focus',
        name: 'focus',
        displayType: 'susceptibility:arts',
        stat: { modifier: 'susceptibility', elements: ['electric', 'heat'] },
      }),
    ).toBe('focus');
  });

  it('ignores displayType when it was seeded from the runtime id', () => {
    expect(
      resolveEffectDisplayKey({
        kind: 'status',
        id: 'lastrite-hypothermic-perfusion',
        name: 'hypothermicPerfusion',
        displayType: 'lastrite-hypothermic-perfusion',
        target: 'team',
      }),
    ).toBe('hypothermicPerfusion');
  });

  it('derives display candidates from runtime state projection keys', () => {
    expect(getDisplayKeyCandidates('state:razorClawmark')).toContain('razorClawmark');
  });
});
