import { describe, expect, it } from 'vitest';
import {
  enemyStatusRowSize,
  monitorSectionBodyMinimums,
  resolveMonitorSectionLayout,
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

  it('matches main section geometry at the default 240px monitor height', () => {
    const layout = resolveMonitorSectionLayout(
      240,
      { affliction: false, poise: false, sp: false },
      { affliction: 2, poise: 1, sp: 3 },
    );
    expect(layout.bodies).toEqual({ affliction: 66, poise: 33, sp: 99 });
    expect(layout.rects).toEqual({
      affliction: { bodyHeight: 66, stripHeight: 0, shellHeight: 80 },
      poise: { bodyHeight: 33, stripHeight: 0, shellHeight: 47 },
      sp: { bodyHeight: 99, stripHeight: 0, shellHeight: 113 },
    });
  });

  it('reserves collapsed strips before redistributing expanded section bodies', () => {
    const layout = resolveMonitorSectionLayout(
      180,
      { affliction: false, poise: true, sp: false },
      { affliction: 2, poise: 1, sp: 3 },
    );
    expect(layout.bodies).toEqual({ affliction: 55, poise: 0, sp: 83 });
    expect(layout.rects.poise).toEqual({ bodyHeight: 0, stripHeight: 14, shellHeight: 14 });
    expect(Object.values(layout.rects).reduce((sum, section) => sum + section.shellHeight, 0)).toBe(
      180,
    );
  });

  it("keeps main's 96px expanded-body floor in the shortest measured viewport", () => {
    const layout = resolveMonitorSectionLayout(
      116,
      { affliction: false, poise: false, sp: false },
      { affliction: 2, poise: 1, sp: 3 },
    );
    expect(layout.bodies).toEqual({ affliction: 35, poise: 20, sp: 41 });
    expect(Object.values(layout.rects).reduce((sum, section) => sum + section.shellHeight, 0)).toBe(
      138,
    );
  });
});
