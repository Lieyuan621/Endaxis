import { describe, expect, it } from 'vitest';
import { calculateBreakingAttackValue } from './breakingAttackDamage';

describe('calculateBreakingAttackValue', () => {
  it('preserves every recovered float32 conversion and multiplication boundary', () => {
    const result = calculateBreakingAttackValue({
      attack: 412.3456789,
      targetDamageTakenMultiplier: 1.23456789,
      calculationMultiplier: 1.34567,
      attackScale: 0.54321,
    });
    const scaledAttack = Math.fround(412.3456789 * 1.23456789);
    const expected = Math.fround(
      Math.fround(Math.fround(0.54321) * Math.fround(1.34567)) * scaledAttack,
    );

    expect(result).toBe(expected);
    expect(result).not.toBe(412.3456789 * 1.23456789 * 1.34567 * 0.54321);
  });

  it('keeps the per-hit calculation multiplier separate from the skill attack scale', () => {
    expect(
      calculateBreakingAttackValue({
        attack: 1000,
        targetDamageTakenMultiplier: 1.5,
        calculationMultiplier: 0.25,
        attackScale: 9,
      }),
    ).toBe(3375);
  });
});
