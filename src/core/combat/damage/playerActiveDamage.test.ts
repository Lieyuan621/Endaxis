import { describe, expect, it } from 'vitest';
import {
  calculatePlayerActiveDamage,
  getResistanceMultiplier,
  type PlayerActiveDamageInput,
} from './playerActiveDamage';

it.each([
  ['physical', 1],
  ['heat', 1],
  ['electric', 1],
  ['cryo', 1],
  ['nature', 1],
  ['ether', 1],
  ['true', 0],
  ['lifeDrain', 0],
] as const)('抗性公式保留 %s 的既有分类', (damageType, applies) => {
  expect(getResistanceMultiplier(damageType, 50, 0.5)).toBe(applies ? 0.25 : 1);
});

function createInput(): PlayerActiveDamageInput {
  return {
    finalAttackValue: 100,
    damageType: 'physical',
    criticalRate: 0,
    criticalDamageIncrease: 0.5,
    criticalSample: 0.5,
    defense: 0,
    resistancePercent: 0,
    damageTakenMultiplier: 1,
    weaknessDamageMultiplier: 1,
    shelterDamageMultiplier: 0,
    runtimeExtensionMultiplier: 1,
    igniteDamageMultiplier: 1,
    appliesIgniteDamageMultiplier: false,
    physicalInflictionDamageMultiplier: 1,
    appliesPhysicalInflictionDamageMultiplier: false,
  };
}

describe('calculatePlayerActiveDamage', () => {
  it('calculates the recovered factors in native multiplication order', () => {
    const result = calculatePlayerActiveDamage({
      ...createInput(),
      finalAttackValue: 1000,
      criticalRate: 0.5,
      criticalSample: 0.25,
      defense: 100,
      resistancePercent: 20,
      damageTakenMultiplier: 1.25,
      weaknessDamageMultiplier: 1.2,
      shelterDamageMultiplier: 0.25,
      runtimeExtensionMultiplier: 0.8,
    });

    expect(result).toMatchObject({
      isCritical: true,
      criticalMultiplier: 1.5,
      defenseMultiplier: 0.5,
      resistanceMultiplier: 1,
      value: 540,
    });
    expect(result.weaknessShelterMultiplier).toBeCloseTo(0.9);
  });

  it('applies special multipliers only when their recovered mask sets match', () => {
    const result = calculatePlayerActiveDamage({
      ...createInput(),
      igniteDamageMultiplier: 1.4,
      appliesIgniteDamageMultiplier: true,
      physicalInflictionDamageMultiplier: 1.75,
      appliesPhysicalInflictionDamageMultiplier: true,
    });

    expect(result.igniteMultiplier).toBe(1.4);
    expect(result.physicalInflictionMultiplier).toBe(1.75);
    expect(result.value).toBeCloseTo(245);
  });

  it('keeps critical, weakness, shelter, and extension factors for true damage', () => {
    const result = calculatePlayerActiveDamage({
      ...createInput(),
      damageType: 'true',
      criticalRate: 1,
      criticalDamageIncrease: 0.5,
      defense: 9999,
      resistancePercent: 100,
      damageTakenMultiplier: 0.1,
      weaknessDamageMultiplier: 1.2,
      shelterDamageMultiplier: 0.25,
      runtimeExtensionMultiplier: 2,
    });

    expect(result.defenseMultiplier).toBe(1);
    expect(result.resistanceMultiplier).toBe(1);
    expect(result.value).toBeCloseTo(270);
  });

  it('rejects life-drain damage instead of using the ordinary branch', () => {
    expect(() =>
      calculatePlayerActiveDamage({ ...createInput(), damageType: 'lifeDrain' }),
    ).toThrow('separate native calculation branch');
  });
});
