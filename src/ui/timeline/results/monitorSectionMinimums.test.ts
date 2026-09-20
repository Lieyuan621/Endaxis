import { describe, expect, it } from 'vitest';
import {
  enemyStatusRowSize,
  monitorSectionBodyMinimums,
  resizeMonitorSectionBodies,
} from './monitorSectionMinimums';

describe('legacy enemy status density and dividers', () => {
  it('shrinks icons with available height and restores them when expanded', () => {
    expect(enemyStatusRowSize(140, 6)).toBe(20);
    expect(enemyStatusRowSize(128, 6)).toBe(18);
    expect(enemyStatusRowSize(104, 6)).toBe(14);
    expect(enemyStatusRowSize(46, 6)).toBe(14);
    expect(enemyStatusRowSize(140, 6)).toBe(20);
    expect(enemyStatusRowSize(140, 3)).toBe(20);
  });
  it('uses fixed legacy body minimums regardless of content density', () => {
    expect(monitorSectionBodyMinimums()).toEqual({ affliction: 46, poise: 26, sp: 52 });
  });
  it('transfers height only between adjacent expanded sections from actual starting heights', () => {
    const bodies = { affliction: 202, poise: 40, sp: 100 };
    const minimums = monitorSectionBodyMinimums();
    expect(resizeMonitorSectionBodies(bodies, 'affliction', 'poise', 0, minimums)).toEqual(bodies);
    expect(resizeMonitorSectionBodies(bodies, 'affliction', 'poise', -1000, minimums)).toEqual({
      affliction: 46,
      poise: 196,
      sp: 100,
    });
    expect(resizeMonitorSectionBodies(bodies, 'affliction', 'poise', 1000, minimums)).toEqual({
      affliction: 216,
      poise: 26,
      sp: 100,
    });
    expect(bodies).toEqual({ affliction: 202, poise: 40, sp: 100 });
  });
  it('resizes across a collapsed middle section without assigning it a height', () => {
    expect(
      resizeMonitorSectionBodies(
        { affliction: 100, sp: 100 },
        'affliction',
        'sp',
        20,
        monitorSectionBodyMinimums(),
      ),
    ).toEqual({ affliction: 120, sp: 80 });
  });
  it('preserves pair total when the viewport cannot fit both minimums', () => {
    const result = resizeMonitorSectionBodies(
      { poise: 10, sp: 20 },
      'poise',
      'sp',
      200,
      monitorSectionBodyMinimums(),
    );
    expect(result.poise! + result.sp!).toBeCloseTo(30);
    expect(result.poise).toBeCloseTo(10);
    expect(result.sp).toBeCloseTo(20);
  });
});
