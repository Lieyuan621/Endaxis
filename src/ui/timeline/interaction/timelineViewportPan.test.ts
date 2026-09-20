import { describe, expect, it } from 'vitest';
import { resolveTimelineViewportPan } from './timelineViewport';

describe('resolveTimelineViewportPan', () => {
  it('鼠标向左上拖动时视口向右下平移', () => {
    expect(
      resolveTimelineViewportPan(
        { pointerX: 200, pointerY: 100, scrollLeft: 300, scrollTop: 120 },
        150,
        70,
      ),
    ).toEqual({ left: 350, top: 150 });
  });

  it('鼠标向右下拖动时不会产生负滚动位置', () => {
    expect(
      resolveTimelineViewportPan(
        { pointerX: 100, pointerY: 100, scrollLeft: 20, scrollTop: 10 },
        180,
        160,
      ),
    ).toEqual({ left: 0, top: 0 });
  });
});
