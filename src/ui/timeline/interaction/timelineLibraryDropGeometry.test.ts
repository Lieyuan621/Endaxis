import { describe, expect, it } from 'vitest';
import { resolveTimelineLibraryDropFrame } from './timelineLibraryDropGeometry';

function dropFrame(overrides: Partial<Parameters<typeof resolveTimelineLibraryDropFrame>[0]> = {}) {
  return resolveTimelineLibraryDropFrame({
    clientX: 210,
    laneLeftPx: 100,
    dragOffsetPx: 10,
    pxPerFrame: 2,
    prepFrames: 20,
    snapFrames: 1,
    maximumFrame: 300,
    ...overrides,
  });
}

describe('timeline library drop geometry', () => {
  it('preserves the point grabbed in the drag image', () => {
    expect(dropFrame()).toBe(30);
    expect(dropFrame({ dragOffsetPx: 30 })).toBe(20);
  });

  it('places in negative visible time and clamps at the preparation boundary', () => {
    expect(dropFrame({ clientX: 130 })).toBe(-10);
    expect(dropFrame({ clientX: 90 })).toBe(-20);
  });

  it('inverts the cropped preparatory projection when collapsed', () => {
    expect(dropFrame({ clientX: 188, prepExpanded: false })).toBe(30);
    expect(dropFrame({ clientX: 119, prepExpanded: false })).toBe(-4);
  });

  it('is invariant across zoom levels for the same visible frame', () => {
    expect(dropFrame({ clientX: 160, pxPerFrame: 1 })).toBe(30);
    expect(dropFrame({ clientX: 310, pxPerFrame: 4 })).toBe(30);
  });

  it('snaps and clamps in the actual-time domain', () => {
    expect(dropFrame({ clientX: 207, snapFrames: 3 })).toBe(30);
    expect(dropFrame({ clientX: 810, maximumFrame: 120 })).toBe(120);
  });

  it('rejects invalid geometry instead of writing a guessed frame', () => {
    expect(() => dropFrame({ pxPerFrame: 0 })).toThrow('positive finite');
    expect(() => dropFrame({ prepFrames: -1 })).toThrow('non-negative integer');
    expect(() => dropFrame({ clientX: Number.NaN })).toThrow('must be finite');
  });
});
