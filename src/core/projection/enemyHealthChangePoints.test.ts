import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';
import { projectEnemyHealthChangePoints } from './enemyHealthChangePoints';

const baseData: Record<string, CombatReceiptValue> = {
  damageType: 'physical',
  value: 100,
  actualDamage: 95,
  remainingHealth: 9905,
  isCritical: false,
  criticalMultiplier: 1,
  defenseMultiplier: 0.95,
  resistanceMultiplier: 1,
  weaknessShelterMultiplier: 1,
  runtimeExtensionMultiplier: 1,
  igniteMultiplier: 1,
  physicalInflictionMultiplier: 1,
};

function damageEntry(overrides: Partial<CombatReceiptEntry> = {}): CombatReceiptEntry {
  return {
    sequence: 3,
    frame: 12,
    time: 0.4,
    event: 'DamageApplied',
    sourceId: 'perlica',
    targetId: 'enemy',
    data: { ...baseData },
    ...overrides,
  };
}

describe('projectEnemyHealthChangePoints', () => {
  it('只保留落到当前单敌人身上的伤害事实', () => {
    const entries = [
      damageEntry(),
      damageEntry({
        sequence: 4,
        targetId: 'other',
        data: { ...baseData, remainingHealth: 50 },
      }),
      { ...damageEntry({ sequence: 5 }), event: 'SpChanged' } as CombatReceiptEntry,
    ];
    const points = projectEnemyHealthChangePoints(entries);
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      frame: 12,
      sequence: 3,
      sourceId: 'perlica',
      targetId: 'enemy',
      damageType: 'physical',
      value: 100,
      actualDamage: 95,
      remainingHealth: 9905,
    });
  });

  it('缺失关键字段时严格失败', () => {
    expect(() => projectEnemyHealthChangePoints([damageEntry({ sourceId: undefined })])).toThrow(
      'has no sourceId',
    );
    expect(() =>
      projectEnemyHealthChangePoints([
        damageEntry({
          data: { ...baseData, actualDamage: undefined as unknown as CombatReceiptValue },
        }),
      ]),
    ).toThrow('has no finite actualDamage');
    expect(() =>
      projectEnemyHealthChangePoints([damageEntry({ data: { ...baseData, isCritical: 1 } })]),
    ).toThrow('no boolean isCritical');
  });
});
