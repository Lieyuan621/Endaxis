import { compileEnemyLifecycle } from '../../../core/compiler/compileEnemyLifecycle';
import { expect, it } from 'vitest';
import { enemyLifecycleMarkerBounds } from './enemyLifecycleEditing';
import type { EnemyLifecycleDocument } from '../../../core/project/schema';

it('拖动边界不会把不同切换事件挤到同帧，边界结果可正式编译', () => {
  const lifecycle: EnemyLifecycleDocument = {
    spawnFrame: -150,
    presenceChanges: [
      { id: 'a', frame: 30, present: false },
      { id: 'b', frame: 31, present: true },
      { id: 'c', frame: 32, present: false },
    ],
  };
  expect(enemyLifecycleMarkerBounds(lifecycle, 'presence:b', -150, 900)).toEqual([31, 31]);
  for (const change of lifecycle.presenceChanges) {
    for (const frame of enemyLifecycleMarkerBounds(lifecycle, `presence:${change.id}`, -150, 900)) {
      expect(() =>
        compileEnemyLifecycle(
          {
            ...lifecycle,
            presenceChanges: lifecycle.presenceChanges.map(item =>
              item.id === change.id ? { ...item, frame } : item,
            ),
          },
          -150,
        ),
      ).not.toThrow();
    }
  }
});

it('出生不能晚于手动死亡时刻', () => {
  const lifecycle: EnemyLifecycleDocument = {
    spawnFrame: -150,
    deathFrame: 0,
    presenceChanges: [{ id: 'spawn', frame: 30, present: false }],
  };
  expect(enemyLifecycleMarkerBounds(lifecycle, 'spawn', -150, 900)).toEqual([-150, 0]);
  expect(enemyLifecycleMarkerBounds(lifecycle, 'presence:spawn', -150, 900)).toEqual([-150, 900]);
});
