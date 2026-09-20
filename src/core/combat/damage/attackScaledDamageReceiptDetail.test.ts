import { expect, it } from 'vitest';
import { calculatePlayerActiveDamage, type PlayerActiveDamageInput } from './playerActiveDamage';
import { freezeAttackScaledDamageReceiptDetail } from './attackScaledDamageReceiptDetail';

it.each(['electric', 'true'] as const)(
  'freezes %s formula values without mutating inputs',
  damageType => {
    const input: PlayerActiveDamageInput = Object.freeze({
      damageType,
      finalAttackValue: 200,
      criticalRate: 0.5,
      criticalDamageIncrease: 0.5,
      criticalSample: 0.2,
      defense: 100,
      resistancePercent: 20,
      damageTakenMultiplier: 1.3,
      weaknessDamageMultiplier: 1.1,
      shelterDamageMultiplier: 0.1,
      runtimeExtensionMultiplier: 1,
      igniteDamageMultiplier: 1,
      appliesIgniteDamageMultiplier: false,
      physicalInflictionDamageMultiplier: 1,
      appliesPhysicalInflictionDamageMultiplier: false,
    });
    const damage = Object.freeze(calculatePlayerActiveDamage(input));
    const detail = freezeAttackScaledDamageReceiptDetail(input, damage, 100, 2, undefined);
    expect(detail).toMatchObject({
      attack: 100,
      baseDamage: 200,
      finalAttackValue: 200,
      skillMultiplierPercent: 200,
      criticalExpectationMultiplier: 1.25,
      enemyDefense: 100,
      enemyResistancePercent: 20,
      resistancePercentMultiplier: damageType === 'true' ? 1 : 0.8,
    });
    expect(detail.nonCriticalDamage).toBeCloseTo(damage.value / 1.5);
    expect(detail.expectedDamage).toBeCloseTo((damage.value / 1.5) * 1.25);
    expect(detail).not.toHaveProperty('attackDetailOperatorBase');
    const zero = { ...input, finalAttackValue: 0, criticalRate: 0 };
    expect(
      freezeAttackScaledDamageReceiptDetail(
        zero,
        calculatePlayerActiveDamage(zero),
        0,
        2,
        undefined,
      ),
    ).toMatchObject({
      attack: 0,
      baseDamage: 0,
      expectedDamage: 0,
      criticalExpectationMultiplier: 1,
    });
  },
);
