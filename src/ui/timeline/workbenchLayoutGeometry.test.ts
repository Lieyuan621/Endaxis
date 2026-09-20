import { describe, expect, it } from 'vitest';
import {
  resolveWorkbenchBottomHeight,
  resolveWorkbenchBottomHeightBounds,
} from './workbenchLayoutGeometry';

describe('workbench bottom panel geometry', () => {
  it.each([68, 800])('moves immediately from the visible height for saved request %i', saved => {
    const displayed = resolveWorkbenchBottomHeight(1080, saved, false);
    const delta = saved < displayed ? 40 : -40;
    expect(resolveWorkbenchBottomHeight(1080, displayed + delta, false)).toBe(displayed + delta);
    expect(resolveWorkbenchBottomHeight(1080, saved + delta, false)).toBe(displayed);
  });
  it.each([
    [0, 240],
    [1, 180],
    [2, 120],
  ])('uses the legacy minimum with %i folded sections', (count, minimum) => {
    expect(resolveWorkbenchBottomHeightBounds(1080, 240, count).minimum).toBe(minimum);
    expect(resolveWorkbenchBottomHeight(1080, 1, false, count)).toBe(minimum);
    expect(resolveWorkbenchBottomHeight(720, 1, false, count)).toBe(68);
    expect(resolveWorkbenchBottomHeight(1080, 1, true, count)).toBe(0);
  });
  it.each([
    ['unmeasured root', 0, 240, false, 240],
    ['short 720px root', 720, 240, false, 68],
    ['exact default capacity', 892, 240, false, 240],
    ['normal desktop root', 1080, 240, false, 240],
    ['expanded panel', 1200, 480, false, 480],
    ['viewport-limited expansion', 1200, 800, false, 548],
    ['collapsed panel', 1080, 240, true, 0],
  ] as const)('%s resolves to %dpx', (_label, height, requested, collapsed, expected) => {
    expect(resolveWorkbenchBottomHeight(height, requested, collapsed)).toBe(expected);
  });

  it('lowers the minimum only when the viewport cannot preserve 600px of timeline', () => {
    expect(resolveWorkbenchBottomHeightBounds(720, 240)).toEqual({ minimum: 68, maximum: 68 });
    expect(resolveWorkbenchBottomHeightBounds(1080, 240)).toEqual({
      minimum: 240,
      maximum: 428,
    });
  });
});
