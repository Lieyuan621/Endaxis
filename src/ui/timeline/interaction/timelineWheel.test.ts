import { describe, expect, test } from 'vitest';
import { resolveTimelineWheelIntent, timelineWheelDeltaPx } from './timelineViewport';

describe('resolveTimelineWheelIntent', () => {
  test('gives Ctrl zoom priority and preserves wheel direction', () => {
    expect(
      resolveTimelineWheelIntent({ ctrlKey: true, shiftKey: true, deltaX: 0, deltaY: -120 }),
    ).toEqual({ kind: 'zoom', direction: 1 });
    expect(
      resolveTimelineWheelIntent({ ctrlKey: true, shiftKey: false, deltaX: 0, deltaY: 120 }),
    ).toEqual({ kind: 'zoom', direction: -1 });
  });

  test('maps Shift wheel to horizontal pan without changing document state', () => {
    expect(
      resolveTimelineWheelIntent({ ctrlKey: false, shiftKey: true, deltaX: 0, deltaY: 80 }),
    ).toEqual({ kind: 'horizontalPan', deltaPx: 80 });
    expect(
      resolveTimelineWheelIntent({ ctrlKey: false, shiftKey: true, deltaX: 32, deltaY: 0 }),
    ).toEqual({ kind: 'horizontalPan', deltaPx: 32 });
  });

  test('routes an ordinary wheel event to direct vertical movement', () => {
    expect(
      resolveTimelineWheelIntent({ ctrlKey: false, shiftKey: false, deltaX: 0, deltaY: 80 }),
    ).toEqual({ kind: 'verticalPan', deltaPx: 80 });
  });
});

test('converts line and page wheel deltas before moving the viewport', () => {
  expect(timelineWheelDeltaPx(3, 1, 600)).toBe(48);
  expect(timelineWheelDeltaPx(1, 2, 600)).toBe(600);
  expect(timelineWheelDeltaPx(80, 0, 600)).toBe(80);
});
