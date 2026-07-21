import { describe, expect, test } from 'vitest';
import { getOperator } from '@/data';
import { resolveEffectiveOperatorForTrack } from './instanceLookup';

describe('resolveEffectiveOperatorForTrack', () => {
  test('resolves Arcane form skills when track has no instances', () => {
    const base = getOperator('arcane');
    expect(base?.forms).toBeTruthy();
    expect(base?.combatSkills?.battleSkill?.segments?.length ?? 0).toBe(0);

    const effective = resolveEffectiveOperatorForTrack({ id: 'arcane' }, base!);
    expect(effective.combatSkills?.battleSkill?.segments?.length ?? 0).toBeGreaterThan(0);
    expect(effective.combatSkills?.comboSkill?.segments?.length ?? 0).toBeGreaterThan(0);
    expect(effective.combatSkills?.ultimate?.segments?.length ?? 0).toBeGreaterThan(0);
  });

  test('returns base sheet unchanged for form-less operators', () => {
    const base = getOperator('lifeng') ?? getOperator('camille');
    expect(base).toBeTruthy();
    expect(base?.forms).toBeFalsy();
    const effective = resolveEffectiveOperatorForTrack({ id: base!.id }, base!);
    expect(effective).toBe(base);
  });
});
