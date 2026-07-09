import { describe, expect, it } from 'vitest';
import { EnemyState } from './EnemyState';

function createEnemyState() {
  return new EnemyState(
    {
      level: 80,
      defense: 100,
      resistance: {},
      maxHp: 100000,
      maxStagger: 100,
      staggerNodeCount: 0,
      staggerNodeDuration: 0,
      staggerBreakDuration: 0,
    } as any,
    {
      getShiftedTime: (time: number, duration: number) => time + duration,
    } as any,
  );
}

describe('EnemyState status stacking', () => {
  it('replaces same-id enemy statuses when stack strategy is replace', () => {
    const enemy = createEnemyState();

    enemy.applyStatus({
      id: 'enemy-status',
      value: 10,
      stacks: 2,
      maxStacks: 5,
      expiresAt: 10,
      sourceId: 'alpha',
    });
    enemy.applyStatus({
      id: 'enemy-status',
      value: 20,
      stacks: 1,
      maxStacks: 5,
      expiresAt: 20,
      sourceId: 'beta',
      stackStrategy: 'REPLACE',
    });

    expect(enemy.getStatusStacks('enemy-status', 1)).toBe(1);
    expect(enemy.enemyStatusEffects.get('enemy-status')).toMatchObject({
      value: 20,
      expiresAt: 20,
      sourceId: 'beta',
    });
  });
});
