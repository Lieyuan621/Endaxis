import { describe, expect, it } from 'vitest';
import {
  resolveTimelineCastMoveFrame,
  resolveTimelineCastMovePointerFrame,
} from './timelineCastMoveGeometry';

describe('timeline cast move geometry', () => {
  it('writes the pointer actual frame directly to the skill placement', () => {
    const frame = resolveTimelineCastMoveFrame({
      pointerActualFrame: 18,
      pointerOffsetActualFrames: 2,
      snapFrames: 1,
      actualMaximumFrame: 30,
    });

    expect(frame).toEqual({ actualFrame: 16, placementFrame: 16 });
  });

  it('snaps and clamps in the actual-time domain', () => {
    expect(
      resolveTimelineCastMoveFrame({
        pointerActualFrame: 44,
        pointerOffsetActualFrames: 3,
        snapFrames: 5,
        actualMaximumFrame: 30,
      }),
    ).toEqual({ actualFrame: 30, placementFrame: 30 });
  });

  it('rejects invalid frame-domain inputs', () => {
    expect(() =>
      resolveTimelineCastMoveFrame({
        pointerActualFrame: Number.NaN,
        pointerOffsetActualFrames: 0,
        snapFrames: 1,
        actualMaximumFrame: 30,
      }),
    ).toThrow('must be finite');
    expect(() =>
      resolveTimelineCastMoveFrame({
        pointerActualFrame: 10,
        pointerOffsetActualFrames: -1,
        snapFrames: 1,
        actualMaximumFrame: 30,
      }),
    ).toThrow('must be non-negative');
  });

  it('projects client coordinates with preparation frames and the grabbed block offset', () => {
    expect(
      resolveTimelineCastMovePointerFrame({
        clientX: 210,
        laneLeftPx: 100,
        pxPerFrame: 2,
        prepFrames: 20,
        pointerOffsetActualFrames: 5,
        snapFrames: 1,
        actualMaximumFrame: 300,
      }),
    ).toEqual({ actualFrame: 30, placementFrame: 30 });
  });

  it('keeps the same actual frame across zoom levels', () => {
    const common = {
      prepFrames: 20,
      pointerOffsetActualFrames: 5,
      snapFrames: 1,
      actualMaximumFrame: 300,
    };
    expect(
      resolveTimelineCastMovePointerFrame({
        ...common,
        clientX: 155,
        laneLeftPx: 100,
        pxPerFrame: 1,
      }),
    ).toEqual({ actualFrame: 30, placementFrame: 30 });
    expect(
      resolveTimelineCastMovePointerFrame({
        ...common,
        clientX: 320,
        laneLeftPx: 100,
        pxPerFrame: 4,
      }),
    ).toEqual({ actualFrame: 30, placementFrame: 30 });
  });

  it('moves in real frames through the collapsed preparatory projection', () => {
    expect(
      resolveTimelineCastMovePointerFrame({
        clientX: 198,
        laneLeftPx: 100,
        pxPerFrame: 2,
        prepFrames: 20,
        prepExpanded: false,
        pointerOffsetActualFrames: 5,
        snapFrames: 1,
        actualMaximumFrame: 300,
      }),
    ).toEqual({ actualFrame: 35, placementFrame: 35 });
  });

  it('uses the live lane edge so horizontal auto-scroll advances the preview', () => {
    const common = {
      clientX: 210,
      pxPerFrame: 2,
      prepFrames: 20,
      pointerOffsetActualFrames: 5,
      snapFrames: 1,
      actualMaximumFrame: 300,
    };
    expect(resolveTimelineCastMovePointerFrame({ ...common, laneLeftPx: 100 }).actualFrame).toBe(
      30,
    );
    expect(resolveTimelineCastMovePointerFrame({ ...common, laneLeftPx: 64 }).actualFrame).toBe(48);
  });

  it('allows the preparation area and rejects invalid browser geometry', () => {
    const input = {
      clientX: 90,
      laneLeftPx: 100,
      pxPerFrame: 2,
      prepFrames: 20,
      pointerOffsetActualFrames: 5,
      snapFrames: 1,
      actualMaximumFrame: 300,
    };
    expect(resolveTimelineCastMovePointerFrame(input)).toEqual({
      actualFrame: -20,
      placementFrame: -20,
    });
    expect(() => resolveTimelineCastMovePointerFrame({ ...input, pxPerFrame: 0 })).toThrow(
      'positive finite',
    );
    expect(() => resolveTimelineCastMovePointerFrame({ ...input, clientX: Number.NaN })).toThrow(
      'must be finite',
    );
  });
});
