import { describe, expect, it } from 'vitest';
import {
  COLLAPSED_PREP_WIDTH_PX,
  frameToCondensedTimelinePx,
  frameToTimelinePx,
  resolveTimelineCursorGuidePosition,
  timelinePxToExactFrame,
  timelinePxToFrame,
  timelineTotalWidth,
} from './timelineGeometry';

describe('timeline geometry', () => {
  it.each([600, -60])(
    'collapses inherited history ending at frame %i without changing frame identity',
    boundary => {
      for (const expanded of [true, false]) {
        for (const frame of [-150, -75, boundary, boundary + 30, 900]) {
          const px = frameToTimelinePx(frame, 150, 2, expanded, boundary);
          expect(timelinePxToExactFrame(px, 150, 2, expanded, boundary)).toBeCloseTo(frame);
        }
      }
      expect(frameToTimelinePx(boundary, 150, 2, false, boundary)).toBe(18);
      expect(frameToTimelinePx(boundary + 30, 150, 2, false, boundary)).toBe(78);
      const start = frameToTimelinePx(boundary - 30, 150, 2, false, boundary);
      const end = frameToTimelinePx(boundary + 30, 150, 2, false, boundary);
      expect(start).toBe(-42);
      expect(end - start).toBe(120);
      expect(timelineTotalWidth(150, 900, 2, false, boundary)).toBe(18 + (900 - boundary) * 2);
    },
  );

  it('places battle frame zero after the preparation area', () => {
    expect(frameToTimelinePx(0, 150, 2)).toBe(300);
    expect(frameToTimelinePx(-150, 150, 2)).toBe(0);
  });

  it('moves hidden history outside the visible interval without squeezing its contents', () => {
    expect(frameToTimelinePx(-150, 150, 2, false)).toBe(18 - 300);
    expect(frameToTimelinePx(-75, 150, 2, false)).toBe(18 - 150);
    expect(frameToTimelinePx(0, 150, 2, false)).toBe(COLLAPSED_PREP_WIDTH_PX);
    expect(frameToTimelinePx(30, 150, 2, false)).toBe(COLLAPSED_PREP_WIDTH_PX + 60);
    expect(timelinePxToExactFrame(COLLAPSED_PREP_WIDTH_PX / 2, 150, 2, false)).toBe(-4.5);
    expect(timelinePxToFrame(COLLAPSED_PREP_WIDTH_PX + 60, 150, 2, false)).toBe(30);
    expect(timelineTotalWidth(150, 900, 2, false)).toBe(COLLAPSED_PREP_WIDTH_PX + 1800);
  });

  it('condenses preparation history for read-only monitor displays', () => {
    expect(frameToCondensedTimelinePx(-150, 150, 2, false)).toBe(0);
    expect(frameToCondensedTimelinePx(-75, 150, 2, false)).toBe(9);
    expect(frameToCondensedTimelinePx(0, 150, 2, false)).toBe(COLLAPSED_PREP_WIDTH_PX);
    expect(frameToCondensedTimelinePx(30, 150, 2, false)).toBe(COLLAPSED_PREP_WIDTH_PX + 60);
  });

  it('condenses inherited history up to its configured boundary', () => {
    expect(frameToCondensedTimelinePx(-150, 150, 2, false, 600)).toBe(0);
    expect(frameToCondensedTimelinePx(225, 150, 2, false, 600)).toBe(9);
    expect(frameToCondensedTimelinePx(600, 150, 2, false, 600)).toBe(18);
    expect(frameToCondensedTimelinePx(630, 150, 2, false, 600)).toBe(78);
  });

  it('round-trips integer frame positions', () => {
    expect(timelinePxToFrame(frameToTimelinePx(42, 150, 2), 150, 2)).toBe(42);
  });

  it('keeps fractional frames available until callers perform snapping', () => {
    expect(timelinePxToExactFrame(383, 150, 2)).toBe(41.5);
    expect(timelinePxToExactFrame(18 + 61, 150, 2, false)).toBe(30.5);
    expect(timelinePxToFrame(383, 150, 2)).toBe(42);
  });

  it('includes preparation and battle spans in total width', () => {
    expect(timelineTotalWidth(150, 900, 2)).toBe(2100);
  });

  it('keeps the guide under the pointer while clamping its sample frame', () => {
    expect(resolveTimelineCursorGuidePosition(120, 150, 900, 2)).toEqual({
      leftPx: 120,
      sampleFrame: -90,
    });
    expect(resolveTimelineCursorGuidePosition(384, 150, 900, 2)).toEqual({
      leftPx: 384,
      sampleFrame: 42,
    });
    expect(resolveTimelineCursorGuidePosition(9999, 150, 900, 2)).toEqual({
      leftPx: 2100,
      sampleFrame: 900,
    });
  });
});
