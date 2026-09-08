import { describe, expect, it } from 'vitest';
import { computeHitDamageWithBreakdown } from './computeDamage';
import { computeStats } from './computeStats';
import { resolveEffect } from '../collect';
import type { ResolvedDamageBase } from '../types';

describe('alternate damage base', () => {
  it.each([
    { attack: 1000, multiplier: 200, damageBase: undefined, expected: 2000 },
    { attack: 1000, multiplier: 500, damageBase: { stat: 'defense', flat: 300 }, expected: 800 },
    { attack: 0, multiplier: 500, damageBase: { stat: 'defense', flat: 300 }, expected: 800 },
    { attack: 1000, multiplier: 0, damageBase: { stat: 'defense', flat: 300 }, expected: 300 },
    { attack: 1000, multiplier: 200, damageBase: { stat: 'attack', flat: 300 }, expected: 2300 },
  ])(
    'computes $expected base damage with attack=$attack and multiplier=$multiplier',
    ({ attack, multiplier, damageBase, expected }) => {
      const status = computeStats(
        {
          level: 60,
          baseAtk: attack,
          baseHp: 1000,
          weaponAtk: 0,
          baseAttrs: { strength: 0, agility: 0, intellect: 0, will: 0 },
          mainAttributeName: 'strength',
          secondaryAttributeName: 'will',
          intrinsicOverrides: { defense: 100, critRate: 0 },
        },
        [],
        [],
      );
      const result = computeHitDamageWithBreakdown(
        { multiplier, damageBase: damageBase as ResolvedDamageBase | undefined },
        status,
        100,
        undefined,
        'physical',
      );
      expect(result?.base).toBe(expected);
      expect(result?.expectedDamage).toBe(expected / 2);
    },
  );

  it('resolves a leveled flat base term without mutating the raw definition', () => {
    const effect = {
      kind: 'damageHit' as const,
      element: 'physical' as const,
      multiplier: [100, 200],
      damageBase: { stat: 'defense' as const, flat: [100, 300] },
    };
    expect(resolveEffect(effect, 0)).toMatchObject({
      multiplier: 100,
      damageBase: { stat: 'defense', flat: 100 },
    });
    expect(resolveEffect(effect, 1)).toMatchObject({
      multiplier: 200,
      damageBase: { stat: 'defense', flat: 300 },
    });
    expect(effect.damageBase.flat).toEqual([100, 300]);
  });
});
