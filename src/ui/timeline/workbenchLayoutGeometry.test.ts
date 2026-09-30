import { describe, expect, it } from 'vitest';
import {
  resolveWorkbenchBottomHeight,
  resolveWorkbenchBottomHeightBounds,
  resolveWorkbenchSidePanelMaximumWidth,
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
  });
  it.each([
    ['unmeasured root', 0, 240, 240],
    ['expanded panel', 1200, 480, 480],
    ['viewport-limited expansion', 1200, 800, 629],
  ] as const)('%s resolves within its viewport', (_label, height, requested, expected) => {
    expect(resolveWorkbenchBottomHeight(height, requested, false)).toBe(expected);
  });

  it('shrinks below the preferred minimum in a short window and hides a collapsed panel', () => {
    expect(resolveWorkbenchBottomHeight(720, 1, false)).toBe(149);
    expect(resolveWorkbenchBottomHeight(1080, 1, true)).toBe(0);
  });

  it('lowers the minimum only when the viewport cannot preserve 520px of timeline', () => {
    expect(resolveWorkbenchBottomHeightBounds(720, 240)).toEqual({ minimum: 149, maximum: 149 });
    expect(resolveWorkbenchBottomHeightBounds(1080, 240)).toEqual({
      minimum: 240,
      maximum: 509,
    });
  });

  it('matches the main branch responsive side-panel cap', () => {
    expect(resolveWorkbenchSidePanelMaximumWidth(1920, 200)).toBe(480);
    expect(resolveWorkbenchSidePanelMaximumWidth(1200, 200)).toBe(330);
    expect(resolveWorkbenchSidePanelMaximumWidth(800, 200)).toBe(200);
    expect(resolveWorkbenchSidePanelMaximumWidth(0, 200)).toBe(480);
  });
});
