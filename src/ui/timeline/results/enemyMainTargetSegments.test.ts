import { expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import { projectEnemyMainTargetSegments } from './enemyMainTargetSegments';

it('主目标高亮跟随手动切换、切出和死亡，不高亮未出生的敌人', () => {
  const event = (frame: number, targetId: string, current: string): CombatReceiptEntry => ({
    frame,
    time: frame / 30,
    sequence: frame,
    targetId,
    event: 'EnemyLifecycleChanged',
    data: { current },
  });
  expect(
    projectEnemyMainTargetSegments(
      [
        event(0, 'a', 'present'),
        event(0, 'c', 'present'),
        event(10, 'b', 'present'),
        event(40, 'b', 'absent'),
        event(50, 'b', 'present'),
        event(60, 'b', 'dead'),
      ],
      { order: ['a', 'b', 'c'], switches: [{ frame: 20, targetId: 'b' }] },
      -10,
      80,
    ),
  ).toEqual([
    { start: -10, end: 0, targetId: undefined },
    { start: 0, end: 20, targetId: 'a' },
    { start: 20, end: 40, targetId: 'b' },
    { start: 40, end: 50, targetId: 'a' },
    { start: 50, end: 60, targetId: 'b' },
    { start: 60, end: 80, targetId: 'a' },
  ]);
});
