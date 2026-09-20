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
    damageType: 'physical',
    value: 500,
    actualDamage: 500,
    remainingHealth: 9500,
    isCritical: false,
    ...overrides,
  };
}

describe('projectEnemyHealthCurve', () => {
  it('从初始生命生成稀疏曲线并保留全部变化点', () => {
    const changes = [
      change(),
      change({
        frame: 20,
        time: 2 / 3,
        sequence: 4,
        value: 300,
        actualDamage: 300,
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
      projectEnemyHealthCurve(INITIAL, [change({ actualDamage: 600, remainingHealth: 9300 })]),
    ).toThrow('discontinuous');
  });

  it('从原始回执直接投影', () => {
    const curve = projectEnemyHealthCurveFromReceipt(INITIAL, [
      {
        sequence: 3,
        frame: 10,
        time: 1 / 3,
        event: 'DamageApplied',
        sourceId: 'perlica',
        targetId: 'enemy',
        data: {
          damageType: 'physical',
          value: 500,
          actualDamage: 500,
          remainingHealth: 9500,
          isCritical: false,
        },
      },
    ]);
    expect(curve.points.at(-1)).toMatchObject({ frame: 10, value: 9500 });
  });
});
