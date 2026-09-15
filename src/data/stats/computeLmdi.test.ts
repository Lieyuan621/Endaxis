import { describe, expect, it } from 'vitest';
import { computeExpectedDamageWithBreakdown } from './computeDamage';
import { computeLmdiContributions, computeReactionLmdiContributions } from './computeLmdi';
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
  intrinsicOverrides: { critRate: 0.1, critDmg: 0.5 },
};

describe('forced-crit LMDI attribution', () => {
  it('does not credit external crit rate while retaining external crit damage credit', () => {
    const critRateMod = {
      stat: { modifier: 'critRate' },
      value: 50,
      external: true,
    } as ResolvedStatModifier;
    const critDmgMod = {
      stat: { modifier: 'critDmg' },
      value: 50,
      external: true,
    } as ResolvedStatModifier;
    const actualStatus = computeStats(BASE, [], [critRateMod, critDmgMod]);
    const actualBreakdown = computeExpectedDamageWithBreakdown({
      attack: actualStatus.attack,
      multiplier: 100,
      critRate: 1,
      critDmg: actualStatus.critDmg,
      dmgBonus: 0,
      dmgBonusExternalMult: 1,
      ampBonus: 0,
      directMultiplier: 1,
      enemyDef: 100,
      resistanceIgnore: 0,
      resistanceShred: 0,
      susceptibility: 0,
      increasedDmgTaken: 0,
      dmgTakenExternalMult: 1,
      linkStacks: 0,
      staggerMult: 1,
      finisherMult: 1,
    });

    const result = computeLmdiContributions({
      baseStats: BASE,
      selfOperatorMods: [],
      externalOperatorMods: [
        { sourceId: 'crit-rate-source', mod: critRateMod },
        { sourceId: 'crit-dmg-source', mod: critDmgMod },
      ],
      selfEnemyMods: [],
      externalEnemyMods: [],
      hit: { multiplier: 100 },
      linkStacks: 0,
      linkSources: undefined,
      hittingTrackId: 'attacker',
      element: 'physical',
      enemyDef: 100,
      actualBreakdown,
      staggerMult: 1,
      staggerSources: undefined,
      finisherMult: 1,
      forceCrit: true,
    });

    expect(result.external['crit-rate-source']).toBeUndefined();
    expect(result.external['crit-dmg-source']).toBeGreaterThan(0);
    expect(
      result.self + Object.values(result.external).reduce((sum, value) => sum + value, 0),
    ).toBeCloseTo(actualBreakdown.expectedDamage, 8);
  });

  it('uses the same crit attribution rule for generated reaction damage', () => {
    const critRateMod = {
      stat: { modifier: 'critRate' },
      value: 50,
      external: true,
    } as ResolvedStatModifier;
    const critDmgMod = {
      stat: { modifier: 'critDmg' },
      value: 50,
      external: true,
    } as ResolvedStatModifier;
    const actualStatus = computeStats(BASE, [], [critRateMod, critDmgMod]);
    const actualStandardBreakdown = computeExpectedDamageWithBreakdown({
      attack: actualStatus.attack,
      multiplier: 100,
      critRate: 1,
      critDmg: actualStatus.critDmg,
      dmgBonus: 0,
      dmgBonusExternalMult: 1,
      ampBonus: 0,
      directMultiplier: 1,
      enemyDef: 100,
      resistanceIgnore: 0,
      resistanceShred: 0,
      susceptibility: 0,
      increasedDmgTaken: 0,
      dmgTakenExternalMult: 1,
      linkStacks: 0,
      staggerMult: 1,
      finisherMult: 1,
    });

    const result = computeReactionLmdiContributions({
      baseStats: BASE,
      selfOperatorMods: [],
      externalOperatorMods: [
        { sourceId: 'crit-rate-source', mod: critRateMod },
        { sourceId: 'crit-dmg-source', mod: critDmgMod },
      ],
      selfEnemyMods: [],
      externalEnemyMods: [],
      hit: { multiplier: 100 },
      hittingTrackId: 'attacker',
      element: 'electric',
      enemyDef: 100,
      actualStandardBreakdown,
      actualArtsIntensityMult: 1,
      actualDamage: actualStandardBreakdown.expectedDamage,
      isCombustionDot: false,
      staggerMult: 1,
      staggerSources: undefined,
      finisherMult: 1,
      forceCrit: true,
    });

    expect(result.external['crit-rate-source']).toBeUndefined();
    expect(result.external['crit-dmg-source']).toBeGreaterThan(0);
    expect(
      result.self + Object.values(result.external).reduce((sum, value) => sum + value, 0),
    ).toBeCloseTo(actualStandardBreakdown.expectedDamage, 8);
  });
});
