import { describe, expect, it } from 'vitest';
import { resolveTimelineMarkerPointerFrame } from './timelineMarkerMoveGeometry';

const base = {
  surfaceLeftPx: 40,
  trackHeaderWidthPx: 200,
  pxPerFrame: 2,
  prepFrames: 150,
  snapFrames: 1,
  maximumFrame: 3_600,
} as const;

describe('timeline marker move geometry', () => {
  it('preserves either side of the grabbed icon at different zoom levels', () => {
    for (const pxPerFrame of [0.5, 2, 4]) {
      for (const grabOffsetPx of [-10, 10]) {
        const clientX =
          base.surfaceLeftPx +
          base.trackHeaderWidthPx +
          (base.prepFrames + 120) * pxPerFrame +
          grabOffsetPx;
        expect(
          resolveTimelineMarkerPointerFrame({ ...base, pxPerFrame, clientX, grabOffsetPx }),
        ).toBe(120);
        expect(
          resolveTimelineMarkerPointerFrame({
            ...base,
            pxPerFrame,
            clientX: clientX + 12 * pxPerFrame,
            grabOffsetPx,
          }),
        ).toBe(132);
        expect(
          resolveTimelineMarkerPointerFrame({
            ...base,
            pxPerFrame,
            clientX,
            grabOffsetPx,
            surfaceLeftPx: base.surfaceLeftPx - 12 * pxPerFrame,
          }),
        ).toBe(132);
      }
    }
  });

  it('subtracts the grab offset before snapping or clamping at the axis edges', () => {
    const start = base.surfaceLeftPx + base.trackHeaderWidthPx + base.prepFrames * base.pxPerFrame;
    expect(
      resolveTimelineMarkerPointerFrame({ ...base, clientX: start - 10, grabOffsetPx: -10 }),
    ).toBe(0);
    expect(
      resolveTimelineMarkerPointerFrame({
        ...base,
        clientX: start + 17 * base.pxPerFrame + 10,
        grabOffsetPx: 10,
        snapFrames: 3,
      }),
    ).toBe(18);
    expect(
      resolveTimelineMarkerPointerFrame({
        ...base,
        clientX: start + 3600 * base.pxPerFrame + 10,
        grabOffsetPx: 10,
      }),
    ).toBe(3600);
  });

  it('projects client coordinates to real frames after the visual preparation inset', () => {
    expect(resolveTimelineMarkerPointerFrame({ ...base, clientX: 40 + 200 + (150 + 90) * 2 })).toBe(
      90,
    );
  });

  it('projects markers through the collapsed 18px preparatory inset', () => {
    expect(
      resolveTimelineMarkerPointerFrame({
        ...base,
        prepExpanded: false,
        clientX: base.surfaceLeftPx + base.trackHeaderWidthPx + 18 + 90 * base.pxPerFrame,
      }),
    ).toBe(90);
  });

  it('uses the live surface edge after horizontal auto-scroll', () => {
    const clientX = 720;
    const before = resolveTimelineMarkerPointerFrame({ ...base, clientX });
    const after = resolveTimelineMarkerPointerFrame({
      ...base,
      clientX,
      surfaceLeftPx: base.surfaceLeftPx - 72,
    });
    expect(after - before).toBe(36);
  });

  it('keeps the same real frame at different zoom levels', () => {
    expect(
      resolveTimelineMarkerPointerFrame({
        ...base,
        clientX: 40 + 200 + (150 + 120) * 4,
        pxPerFrame: 4,
      }),
    ).toBe(120);
    expect(
      resolveTimelineMarkerPointerFrame({
        ...base,
        clientX: 40 + 200 + (150 + 120) * 0.5,
        pxPerFrame: 0.5,
      }),
    ).toBe(120);
  });

  it('snaps and clamps before the battle start and after the axis end', () => {
    expect(resolveTimelineMarkerPointerFrame({ ...base, clientX: 0, snapFrames: 3 })).toBe(0);
    expect(resolveTimelineMarkerPointerFrame({ ...base, clientX: 20_000, snapFrames: 3 })).toBe(
      3_600,
    );
    expect(
      resolveTimelineMarkerPointerFrame({
        ...base,
        clientX: 40 + 200 + (150 + 17) * 2,
        snapFrames: 3,
      }),
    ).toBe(18);
  });

  it('allows inputs in the expanded preparation range when a negative minimum is requested', () => {
    expect(
      resolveTimelineMarkerPointerFrame({
        ...base,
        clientX: base.surfaceLeftPx + base.trackHeaderWidthPx + 30 * base.pxPerFrame,
        minimumFrame: -base.prepFrames,
      }),
    ).toBe(-120);
    expect(
      resolveTimelineMarkerPointerFrame({
        ...base,
        clientX: 0,
        minimumFrame: -base.prepFrames,
      }),
    ).toBe(-150);
  });

  it('rejects invalid browser geometry instead of writing a guessed frame', () => {
    expect(() => resolveTimelineMarkerPointerFrame({ ...base, clientX: Number.NaN })).toThrow(
      'coordinates must be finite',
    );
    expect(() => resolveTimelineMarkerPointerFrame({ ...base, pxPerFrame: 0, clientX: 0 })).toThrow(
      'positive finite',
    );
    expect(() =>
      resolveTimelineMarkerPointerFrame({ ...base, prepFrames: -1, clientX: 0 }),
    ).toThrow('non-negative integer');
  });
});
