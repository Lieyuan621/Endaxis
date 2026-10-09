import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MONITOR_SECTION_WEIGHTS,
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
  });
  it('transfers height only between adjacent expanded sections from actual starting heights', () => {
    const bodies = { affliction: 202, poise: 40, sp: 100 };
    const minimums = monitorSectionBodyMinimums();
    expect(resizeMonitorSectionBodies(bodies, 'affliction', 'poise', 0, minimums)).toEqual(bodies);
    expect(resizeMonitorSectionBodies(bodies, 'affliction', 'poise', -1000, minimums)).toEqual({
      affliction: 54,
      poise: 188,
      sp: 100,
    });
    expect(resizeMonitorSectionBodies(bodies, 'affliction', 'poise', 1000, minimums)).toEqual({
      affliction: 210,
      poise: 32,
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
    ).toEqual({ affliction: 114, sp: 86 });
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
    expect(result.poise).toBeCloseTo((30 * 32) / (32 + 86));
    expect(result.sp).toBeCloseTo((30 * 86) / (32 + 86));
  });

  it('uses v3 weights while respecting the SP minimum at the default 240px height', () => {
    const layout = resolveMonitorSectionLayout(
      240,
      { affliction: false, poise: false, sp: false },
      DEFAULT_MONITOR_SECTION_WEIGHTS,
    );
    expect(layout.bodies).toEqual({ affliction: 114, poise: 40, sp: 86 });
    expect(layout.rects).toEqual({
      affliction: { bodyHeight: 114, stripHeight: 0, shellHeight: 114 },
      poise: { bodyHeight: 40, stripHeight: 0, shellHeight: 40 },
      sp: { bodyHeight: 86, stripHeight: 0, shellHeight: 86 },
    });
  });

  it('distributes unconstrained body space 3:1:2 in v3', () => {
    const layout = resolveMonitorSectionLayout(
      360,
      { affliction: false, poise: false, sp: false },
      DEFAULT_MONITOR_SECTION_WEIGHTS,
    );
    expect(layout.bodies).toEqual({ affliction: 180, poise: 60, sp: 120 });
  });

  it('reserves collapsed strips before redistributing expanded section bodies', () => {
    const layout = resolveMonitorSectionLayout(
      180,
      { affliction: false, poise: true, sp: false },
      DEFAULT_MONITOR_SECTION_WEIGHTS,
    );
    expect(layout.bodies).toEqual({ affliction: 80, poise: 0, sp: 86 });
    expect(layout.rects.poise).toEqual({ bodyHeight: 0, stripHeight: 14, shellHeight: 14 });
    expect(Object.values(layout.rects).reduce((sum, section) => sum + section.shellHeight, 0)).toBe(
      180,
    );
  });

  it('keeps all three compact sections visible in the shortest measured viewport', () => {
    const layout = resolveMonitorSectionLayout(
      116,
      { affliction: false, poise: false, sp: false },
      DEFAULT_MONITOR_SECTION_WEIGHTS,
    );
    expect(layout.bodies).toEqual({ affliction: 81, poise: 33, sp: 86 });
    expect(Object.values(layout.rects).reduce((sum, section) => sum + section.shellHeight, 0)).toBe(
      200,
    );
  });
});
