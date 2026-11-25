import { expect, it } from 'vitest';
import { selectMainEnemyTarget } from './enemyTargetSelection';

it('首轨默认优先，按帧手动切换，不可命中时从首轨重新选择', () => {
  const selection = { order: ['b', 'a', 'c'], switches: [{ frame: 30, targetId: 'a' }] };
  expect(selectMainEnemyTarget(selection, 0, () => true)).toBe('b');
  expect(selectMainEnemyTarget(selection, 30, () => true)).toBe('a');
  expect(selectMainEnemyTarget(selection, 60, id => id !== 'a')).toBe('b');
  expect(selectMainEnemyTarget(selection, 60, id => id === 'c')).toBe('c');
  expect(selectMainEnemyTarget(selection, 60, id => id === 'b')).toBe('b');
  expect(selectMainEnemyTarget(selection, 60, () => false)).toBeUndefined();
});
