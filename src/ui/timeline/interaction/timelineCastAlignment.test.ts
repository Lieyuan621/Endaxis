import { describe, expect, it } from 'vitest';
import { resolveTimelineCastAlignmentFrame } from './timelineCastAlignment';

describe('resolveTimelineCastAlignmentFrame', () => {
  const base = {
    targetStartFrame: 120,
    targetDurationFrames: 60,
    sourceDurationFrames: 30,
    snapFrames: 1,
    maximumFrame: 300,
  } as const;

  it('snaps the source immediately before or after the target', () => {
    expect(resolveTimelineCastAlignmentFrame({ ...base, mode: 'snapBefore' })).toBe(90);
    expect(resolveTimelineCastAlignmentFrame({ ...base, mode: 'snapAfter' })).toBe(180);
  });

  it('aligns matching left or right visual edges', () => {
    expect(resolveTimelineCastAlignmentFrame({ ...base, mode: 'alignStart' })).toBe(120);
    expect(resolveTimelineCastAlignmentFrame({ ...base, mode: 'alignEnd' })).toBe(150);
  });

  it('uses the current snap precision and clamps to the editable real-time range', () => {
    expect(
      resolveTimelineCastAlignmentFrame({
        ...base,
        mode: 'snapBefore',
        targetStartFrame: 5,
        sourceDurationFrames: 30,
      }),
    ).toBe(0);
    expect(
      resolveTimelineCastAlignmentFrame({
        ...base,
        mode: 'snapAfter',
        targetStartFrame: 298,
        snapFrames: 3,
      }),
    ).toBe(300);
  });
});
