import { describe, expect, it } from 'vitest';
import {
  projectTimelineTrackEffectLayout,
  resizeTimelineTrackPair,
  resolveCompactTrackHeights,
  TIMELINE_TRACK_MIN_HEIGHT,
  timelineLowerBuffTop,
  timelineUpperBuffTop,
} from './timelineTrackEffectLayout';

describe('timeline track effect layout', () => {
  it('fills available height and preserves resized proportions across viewport changes', () => {
    expect(resolveCompactTrackHeights([160, 160, 160, 160], 720)).toEqual([180, 180, 180, 180]);
    expect(resolveCompactTrackHeights([200, 120, 160, 160], 800)).toEqual([250, 150, 200, 200]);
    expect(resolveCompactTrackHeights([160, 160, 160, 160], 723).reduce((a, b) => a + b, 0)).toBe(
      723,
    );
    expect(resolveCompactTrackHeights([160, 160, 160, 160], 100)).toEqual([25, 25, 25, 25]);
    expect(resolveCompactTrackHeights([10000, 1, 1, 1], 800)).toEqual([602, 66, 66, 66]);
  });
  it('keeps compact rows at their allocated height when effects use many lanes', () => {
    expect(
      projectTimelineTrackEffectLayout({
        mode: 'compact',
        upperLaneCount: 5,
        lowerLaneCount: 6,
      }),
    ).toEqual({ height: 160, actionTop: 55 });
  });

  it('uses the compact row-height override as its clipping boundary', () => {
    expect(
      projectTimelineTrackEffectLayout({
        mode: 'compact',
        compactHeight: 210,
        upperLaneCount: 8,
        lowerLaneCount: 9,
      }),
    ).toEqual({ height: 210, actionTop: 80 });
  });

  it('resizes adjacent compact rows without changing their pair total', () => {
    expect(resizeTimelineTrackPair([200, 200, 200, 200], 1, 35)).toEqual([200, 235, 165, 200]);
    expect(resizeTimelineTrackPair([160, 160], 0, 500)).toEqual([
      320 - TIMELINE_TRACK_MIN_HEIGHT,
      TIMELINE_TRACK_MIN_HEIGHT,
    ]);
    const original = [160, 160];
    expect(resizeTimelineTrackPair(original, 1, 20)).toBe(original);
    expect(resizeTimelineTrackPair([25, 25, 25, 25], 1, 40)).toEqual([25, 25, 25, 25]);
  });

  it('keeps the legacy baseline height when both sides fit in its padding', () => {
    expect(
      projectTimelineTrackEffectLayout({
        mode: 'loose',
        upperLaneCount: 2,
        lowerLaneCount: 2,
      }),
    ).toEqual({ height: 160, actionTop: 55 });
  });

  it('uses the larger side as symmetric padding and keeps the action centered', () => {
    expect(
      projectTimelineTrackEffectLayout({
        mode: 'loose',
        upperLaneCount: 4,
        lowerLaneCount: 5,
      }),
    ).toEqual({ height: 278, actionTop: 114 });
  });

  it('keeps an explicit compact row height even when it is below the normal resize limit', () => {
    expect(
      projectTimelineTrackEffectLayout({
        mode: 'compact',
        compactHeight: 66,
        upperLaneCount: 1,
        lowerLaneCount: 1,
      }),
    ).toEqual({ height: 66, actionTop: 8 });
  });

  it('stacks visible lower buffs inward from the track edge', () => {
    for (const count of [1, 2, 6, 12]) {
      const { height, actionTop } = projectTimelineTrackEffectLayout({
        mode: 'loose',
        upperLaneCount: 3,
        lowerLaneCount: count,
      });
      expect(timelineLowerBuffTop(actionTop, 0) + 18).toBe(height - 5);
      const nearestBuffTop = timelineLowerBuffTop(actionTop, count - 1);
      expect(nearestBuffTop).toBeGreaterThanOrEqual(actionTop + 50);
      if (count > 1) {
        expect(timelineLowerBuffTop(actionTop, 0) - timelineLowerBuffTop(actionTop, 1)).toBe(22);
      }
    }
  });

  it('uses the same inward lower-buff coordinates inside a compact clipping boundary', () => {
    const { height, actionTop } = projectTimelineTrackEffectLayout({
      mode: 'compact',
      compactHeight: 200,
      upperLaneCount: 20,
      lowerLaneCount: 20,
    });
    expect(height).toBe(200);
    expect(timelineLowerBuffTop(actionTop, 0) + 18).toBe(height - 5);
    expect(timelineLowerBuffTop(actionTop, 19)).toBeLessThan(0);
  });

  it('stacks upper buffs from the outer edge toward the skill area like the legacy layer', () => {
    expect([0, 1, 2, 3].map(timelineUpperBuffTop)).toEqual([5, 29, 53, 77]);
  });
});
