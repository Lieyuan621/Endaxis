import { describe, expect, it } from 'vitest';
import { projectHitDamageReceipts } from './hitEffectProjection';

const baseDamage: Record<string, number | boolean | string | null> = {
  damageType: 'physical',
  value: 100,
  actualDamage: 95,
  remainingHealth: 9905,
  isCritical: false,
  criticalMultiplier: 1,
  defenseMultiplier: 1,
  resistanceMultiplier: 1,
  weaknessShelterMultiplier: 1,
  runtimeExtensionMultiplier: 1,
  igniteMultiplier: 1,
  physicalInflictionMultiplier: 1,
};

describe('projectHitDamageReceipts', () => {
  it('搬运伤害事实并保留可选步骤键', () => {
    const points = projectHitDamageReceipts([
      {
        sequence: 1,
        frame: 10,
        time: 1 / 3,
        event: 'DamageApplied',
        sourceId: 'perlica',
        targetId: 'enemy',
        data: {
          ...baseDamage,
          stepKey: 'step:damage',
          castId: 'cast:1',
          hitId: 'hit:1',
        },
      },
      {
        sequence: 2,
        frame: 20,
        time: 2 / 3,
        event: 'DamageApplied',
        sourceId: 'perlica',
        targetId: 'enemy',
        data: { ...baseDamage, value: 200 },
      },
    ]);
    expect(points).toEqual([
      {
        frame: 10,
        time: 1 / 3,
        sequence: 1,
        sourceId: 'perlica',
        targetId: 'enemy',
        damageType: 'physical',
        value: 100,
        actualDamage: 95,
        isCritical: false,
        stepKey: 'step:damage',
        castId: 'cast:1',
        hitId: 'hit:1',
      },
      {
        frame: 20,
        time: 2 / 3,
        sequence: 2,
        sourceId: 'perlica',
        targetId: 'enemy',
        damageType: 'physical',
        value: 200,
        actualDamage: 95,
        isCritical: false,
      },
    ]);
  });

  it('缺失关键字段时严格失败', () => {
    expect(() =>
      projectHitDamageReceipts([
        {
          sequence: 1,
          frame: 1,
          time: 0,
          event: 'DamageApplied',
          sourceId: 'a',
          targetId: 'e',
          data: { ...baseDamage, value: undefined as unknown as number },
        },
      ]),
    ).toThrow('has no finite value');
  });
});
