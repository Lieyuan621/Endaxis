import { describe, expect, it } from 'vitest';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { DamageCalculationSnapshots } from './damageCalculationSnapshots';

describe('DamageCalculationSnapshots', () => {
  it('同一切面反复分支时保留动作身份，不混用另一分支注册的动作', () => {
    const first: ResolvedCombatOperationStep = { kind: 'dealStagger', parameters: { value: 1 } };
    const second = structuredClone(first);
    const third = structuredClone(first);
    const original = new DamageCalculationSnapshots();
    original.set(first, { attack: 10, attackScale: 2, baseValue: 20 });
    const checkpoint = structuredClone(original.runtimeState);
    const branch = () =>
      new DamageCalculationSnapshots(original.program, structuredClone(checkpoint));
    const a = branch();
    a.set(second, { attack: 30, attackScale: 2, baseValue: 60 });
    const b = branch();
    b.set(third, { attack: 40, attackScale: 2, baseValue: 80 });
    expect(a.get(second)?.baseValue).toBe(60);
    expect(a.has(third)).toBe(false);
    expect(b.has(second)).toBe(false);
    expect(b.get(third)?.baseValue).toBe(80);
    original.clear();
    const restored = branch();
    expect(restored.get(first)?.baseValue).toBe(20);
    expect(restored.has(second)).toBe(false);
    expect(restored.size).toBe(1);
    expect([...checkpoint.keys()]).toEqual([0]);
  });
});
