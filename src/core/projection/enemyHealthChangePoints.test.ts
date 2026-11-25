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
  it('按实例筛选同场伤害、治疗和生命上限变化，不混入其他敌人', () => {
    const entries = [
      damageEntry(),
      damageEntry({ targetId: 'enemy:a' }),
      damageEntry({ targetId: 'enemy:b' }),
      damageEntry({
        targetId: 'enemy:a',
        event: 'HealingApplied',
        data: { actualHealing: 5, currentHealth: 9910 },
      }),
      damageEntry({
        targetId: 'enemy:b',
        event: 'MaxHealthChanged',
        data: { previousHealth: 9905, currentHealth: 10000, maxHealth: 20000 },
      }),
    ];
    expect(
      projectEnemyHealthChangePoints(entries, 'enemy:a').map(point => point.healthChange),
    ).toEqual([-95, 5]);
    expect(
      projectEnemyHealthChangePoints(entries, 'enemy:b').map(point => point.healthChange),
    ).toEqual([-95, 95]);
    expect(projectEnemyHealthChangePoints(entries, 'enemy:missing')).toEqual([]);
  });
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
    const points = projectEnemyHealthChangePoints(entries, 'enemy');
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      frame: 12,
      sequence: 3,
      sourceId: 'perlica',
      targetId: 'enemy',
      healthChange: -95,
      remainingHealth: 9905,
    });
  });

  it('缺失关键字段时严格失败', () => {
    expect(() =>
      projectEnemyHealthChangePoints([damageEntry({ sourceId: undefined })], 'enemy'),
    ).toThrow('has no sourceId');
    expect(() =>
      projectEnemyHealthChangePoints(
        [
          damageEntry({
            data: { ...baseData, actualDamage: undefined as unknown as CombatReceiptValue },
          }),
        ],
        'enemy',
      ),
    ).toThrow('has no finite actualDamage');
  });
});
