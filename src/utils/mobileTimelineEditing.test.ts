import { describe, expect, it } from 'vitest';
import {
  clampTimelineGroupDelta,
  getStepSampleAtTime,
  getSnappedTimelineDragDelta,
  getVerticalEdgeScrollSpeed,
  isTapGesture,
  pointerYToTimelineTime,
  remapSwappedIndex,
  snapTimelineTime,
  timelineYToTime,
} from './mobileTimelineEditing';

describe('mobile timeline editing helpers', () => {
  it('distinguishes taps from scroll gestures', () => {
    expect(isTapGesture({ x: 10, y: 10 }, { x: 15, y: 14 })).toBe(true);
    expect(isTapGesture({ x: 10, y: 10 }, { x: 10, y: 25 })).toBe(false);
  });

  it('keeps mobile editing targets attached to tracks after swapping them', () => {
    expect(remapSwappedIndex(0, 0, 3)).toBe(3);
    expect(remapSwappedIndex(3, 0, 3)).toBe(0);
    expect(remapSwappedIndex(2, 0, 3)).toBe(2);
    expect(remapSwappedIndex(null, 0, 3)).toBeNull();
  });

  it('converts pointer positions to snapped timeline time', () => {
    expect(
      pointerYToTimelineTime({
        clientY: 225,
        timelineTop: 100,
        pixelsPerSecond: 50,
        snapStep: 0.5,
        maxTime: 20,
      }),
    ).toBe(2.5);
  });

  it('converts positions across a collapsed preparation area', () => {
    const options = {
      pixelsPerSecond: 40,
      prepDuration: 5,
      prepExpanded: false,
      collapsedPrepPx: 18,
    };

    expect(timelineYToTime({ ...options, offsetY: 9 })).toBe(2.5);
    expect(timelineYToTime({ ...options, offsetY: 18 })).toBe(5);
    expect(timelineYToTime({ ...options, offsetY: 58 })).toBe(6);
  });

  it('clamps snapped times to the editable range', () => {
    expect(snapTimelineTime(-1, 0.5, 20)).toBe(0);
    expect(snapTimelineTime(21, 0.5, 20)).toBe(20);
  });

  it('samples the latest resource point at or before the guide time', () => {
    const points = [
      { time: 0, val: 10 },
      { time: 2, val: 20 },
      { time: 5, val: 30 },
    ];
    expect(getStepSampleAtTime(points, 3)?.val).toBe(20);
    expect(getStepSampleAtTime(points, 5)?.val).toBe(30);
  });

  it('keeps every grouped action inside the editable range', () => {
    expect(
      clampTimelineGroupDelta({ desiredDelta: -4, startTimes: [2, 3], minTime: 0, maxTime: 10 }),
    ).toBe(-2);
    expect(
      clampTimelineGroupDelta({ desiredDelta: 8, startTimes: [2, 4], minTime: 0, maxTime: 10 }),
    ).toBe(6);
  });

  it('snaps drag movement from the action border without time-warp remapping', () => {
    expect(
      getSnappedTimelineDragDelta({
        initialStart: 3,
        pointerDelta: 1.24,
        startTimes: [3, 3.5],
        snapStep: 0.5,
        minTime: 0,
        maxTime: 10,
      }),
    ).toBe(1);
  });

  it('keeps dragged actions out of a collapsed preparation area', () => {
    expect(
      getSnappedTimelineDragDelta({
        initialStart: 6,
        pointerDelta: -5,
        startTimes: [6, 8],
        snapStep: 0.5,
        minTime: 5,
        maxTime: 20,
      }),
    ).toBe(-1);
  });

  it('calculates proportional edge auto-scroll speed', () => {
    expect(getVerticalEdgeScrollSpeed({ clientY: 100, top: 100, bottom: 500 })).toBe(-10);
    expect(getVerticalEdgeScrollSpeed({ clientY: 472, top: 100, bottom: 500 })).toBe(5);
    expect(getVerticalEdgeScrollSpeed({ clientY: 300, top: 100, bottom: 500 })).toBe(0);
  });
});
