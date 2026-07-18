import { describe, expect, it } from 'vitest';
import { computeStats } from './computeStats';
import type { BaseStatValues, ResolvedStatModifier } from './types';

const BASE: BaseStatValues = {
  level: 60,
  baseAtk: 1000,
  baseHp: 1000,
  weaponAtk: 0,
  baseAttrs: { strength: 0, agility: 0, intellect: 0, will: 0 },
  mainAttributeName: 'strength',
  secondaryAttributeName: 'agility',
};

describe('computeStats — dynamic attributeAtkPercent', () => {
  it('applies a dynamic (runtime) attributeAtkPercent buff to ATK', () => {
    const without = computeStats(BASE, [], []);
    const withBuff = computeStats(
      BASE,
      [],
      [{ stat: { modifier: 'attributeAtkPercent' }, value: 10 } as unknown as ResolvedStatModifier],
    );

    expect(without.attack).toBe(1000);
    expect(withBuff.attack).toBe(1100);
    expect(withBuff.attack).toBeGreaterThan(without.attack);
  });
});
