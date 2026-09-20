import { describe, expect, it } from 'vitest';
import {
  COARSE_TIMELINE_SNAP_FRAMES,
  PRECISE_TIMELINE_SNAP_FRAMES,
  snapTimelineFrame,
} from './timelineSnap';

describe('timeline snap', () => {
  it('derives the coarse grid from the project frame rate', () => {
    expect(PRECISE_TIMELINE_SNAP_FRAMES).toBe(1);
    expect(COARSE_TIMELINE_SNAP_FRAMES).toBe(3);
  });

  it('rounds to the nearest grid point and clamps to the timeline', () => {
    expect(snapTimelineFrame(7, 3, 120)).toBe(6);
    expect(snapTimelineFrame(8, 3, 120)).toBe(9);
    expect(snapTimelineFrame(-5, 3, 120)).toBe(0);
    expect(snapTimelineFrame(122, 3, 120)).toBe(120);
    expect(snapTimelineFrame(-5, 3, 120, 5)).toBe(5);
    expect(snapTimelineFrame(8, 3, 120, 5)).toBe(9);
  });

  it('rejects invalid grid and timeline values', () => {
    expect(() => snapTimelineFrame(10, 0, 120)).toThrow('positive integer');
    expect(() => snapTimelineFrame(10, 1.5, 120)).toThrow('positive integer');
    expect(() => snapTimelineFrame(10, 1, -1)).toThrow('non-negative integer');
  });
});
