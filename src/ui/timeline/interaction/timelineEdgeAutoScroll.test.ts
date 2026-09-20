import { describe, expect, test } from 'vitest';
import { projectTimelineEdgeAutoScrollDelta } from './timelineEdgeAutoScroll';

const viewport = { left: 100, right: 900, top: 80, bottom: 680 };

describe('projectTimelineEdgeAutoScrollDelta', () => {
  test('does not scroll in the safe center', () => {
    expect(
      projectTimelineEdgeAutoScrollDelta({ ...viewport, pointerX: 400, pointerY: 300 }),
    ).toEqual({ x: 0, y: 0 });
  });

  test('accelerates toward each edge and caps movement outside the viewport', () => {
    expect(
      projectTimelineEdgeAutoScrollDelta({ ...viewport, pointerX: 118, pointerY: 662 }),
    ).toEqual({ x: -9, y: 9 });
    expect(
      projectTimelineEdgeAutoScrollDelta({ ...viewport, pointerX: 50, pointerY: 720 }),
    ).toEqual({ x: -18, y: 18 });
  });
});
