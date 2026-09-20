import { describe, expect, it } from 'vitest';
import { layoutEnemyMarkerLanes } from './enemyMarkerLayout';

describe('enemy instantaneous marker lanes', () => {
  it('preserves duplicate events and separates overlapping icons', () => {
    expect(layoutEnemyMarkerLanes([100, 100, 105])).toEqual([0, 1, 2]);
  });
  it('reuses a row only after the full icon plus gap and preserves receipt order', () => {
    expect(layoutEnemyMarkerLanes([44, 0, 21, 22])).toEqual([0, 0, 1, 0]);
    expect(layoutEnemyMarkerLanes([])).toEqual([]);
  });
  it('does not change lanes when the viewport scrolls but repacks on zoom', () => {
    expect(layoutEnemyMarkerLanes([-500, -485, -470])).toEqual(layoutEnemyMarkerLanes([0, 15, 30]));
    expect(layoutEnemyMarkerLanes([0, 15, 30])).toEqual([0, 1, 0]);
    expect(layoutEnemyMarkerLanes([0, 30, 60])).toEqual([0, 0, 0]);
  });
});
