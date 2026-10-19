import { describe, expect, it } from 'vitest';
import type { EnemyHealthChangePoint } from './enemyHealthChangePoints';
import { projectEnemyHealthCurve, projectEnemyHealthCurveFromReceipt } from './enemyHealthCurves';

const INITIAL = { health: 10000, maxHealth: 10000 };

function change(overrides: Partial<EnemyHealthChangePoint> = {}): EnemyHealthChangePoint {
  return {
    frame: 10,
    time: 1 / 3,
    sequence: 3,
    sourceId: 'perlica',
    targetId: 'enemy',
    healthChange: -500,
    remainingHealth: 9500,
    ...overrides,
  };
}

describe('projectEnemyHealthCurve', () => {
  it('最大生命变化使用独立事实接续曲线，不伪装成治疗', () => {
    const curve = projectEnemyHealthCurveFromReceipt({ health: 400, maxHealth: 1000 }, [
      {
        sequence: 1,
        frame: 0,
        time: 0,
        event: 'MaxHealthChanged',
        sourceId: 'enemy',
        targetId: 'enemy',
        data: { previousHealth: 400, currentHealth: 600, previousMaxHealth: 1000, maxHealth: 1500 },
      },
      {
        sequence: 2,
        frame: 30,
        time: 1,
        event: 'DamageApplied',
        sourceId: 'caster',
        targetId: 'enemy',
        data: { actualDamage: 150, remainingHealth: 450 },
      },
      {
        sequence: 3,
        frame: 60,
        time: 2,
        event: 'MaxHealthChanged',
        sourceId: 'enemy',
        targetId: 'enemy',
        data: { previousHealth: 450, currentHealth: 300, previousMaxHealth: 1500, maxHealth: 1000 },
      },
    ]);
    expect(curve.points.map(point => point.value)).toEqual([400, 600, 450, 300]);
    expect(curve.maxValue).toBe(1500);
  });
  it('从初始生命生成稀疏曲线并保留全部变化点', () => {
    const changes = [
      change(),
      change({
        frame: 20,
        time: 2 / 3,
        sequence: 4,
        healthChange: -300,
        remainingHealth: 9200,
      }),
    ];
    const curve = projectEnemyHealthCurve(INITIAL, changes);
    expect(curve.resource).toBe('enemyHealth');
    expect(curve.maxValue).toBe(10000);
    expect(curve.points).toEqual([
      { frame: 0, time: 0, sequence: null, value: 10000 },
      { frame: 10, time: 1 / 3, sequence: 3, value: 9500 },
      { frame: 20, time: 2 / 3, sequence: 4, value: 9200 },
    ]);
  });

  it('拒绝与事实不连续的生命变化', () => {
    expect(() => projectEnemyHealthCurve(INITIAL, [change({ remainingHealth: 9600 })])).toThrow(
      'increased without a receipt fact',
    );
    expect(() =>
      projectEnemyHealthCurve(INITIAL, [change({ healthChange: -600, remainingHealth: 9300 })]),
    ).toThrow('discontinuous');
  });
});
