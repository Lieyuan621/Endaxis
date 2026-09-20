import { describe, expect, test } from 'vitest';
import { passedTimelineDragThreshold, TIMELINE_DRAG_THRESHOLD_PX } from './timelineDragThreshold';

describe('passedTimelineDragThreshold', () => {
  test('ignores ordinary click jitter below the legacy five-pixel radius', () => {
    expect(passedTimelineDragThreshold(100, 50, 103, 53)).toBe(false);
  });

  test('starts at the threshold in any direction', () => {
    expect(TIMELINE_DRAG_THRESHOLD_PX).toBe(5);
    expect(passedTimelineDragThreshold(100, 50, 105, 50)).toBe(true);
    expect(passedTimelineDragThreshold(100, 50, 103, 54)).toBe(true);
  });
});
