import { describe, expect, it } from 'vitest';
import {
  resolveTimelineCastAlignmentFrame,
  resolveTimelineCastAlignmentSpan,
} from './timelineCastAlignment';

it('选中连续组任意一段时按整组范围接前后方，目标连续组也取整体', () => {
  const blocks = [
    { id: 'a1', startFrame: 10, endFrame: 30, locked: false },
    { id: 'a2', startFrame: 30, endFrame: 65, locked: false },
    { id: 'b1', startFrame: 120, endFrame: 150, locked: false },
    { id: 'b2', startFrame: 150, endFrame: 190, locked: false },
  ];
  const groups = [
    ['a1', 'a2'],
    ['b1', 'b2'],
  ];
  const source = resolveTimelineCastAlignmentSpan('a2', blocks, groups)!;
  const target = resolveTimelineCastAlignmentSpan('b1', blocks, groups)!;
  expect(source).toEqual(resolveTimelineCastAlignmentSpan('a1', blocks, groups));
  expect(target).toEqual(resolveTimelineCastAlignmentSpan('b2', blocks, groups));
  expect(source.anchorId).toBe('a1');
  const input = {
    targetStartFrame: target.startFrame,
    targetDurationFrames: target.durationFrames,
    sourceDurationFrames: source.durationFrames,
    snapFrames: 1,
    maximumFrame: 300,
  };
  expect(resolveTimelineCastAlignmentFrame({ ...input, mode: 'snapBefore' })).toBe(65);
  expect(resolveTimelineCastAlignmentFrame({ ...input, mode: 'snapAfter' })).toBe(190);
  expect(
    resolveTimelineCastAlignmentSpan(
      'a1',
      blocks.map(b => ({ ...b, locked: b.id === 'a2' })),
      groups,
    )?.locked,
  ).toBe(true);
  expect(resolveTimelineCastAlignmentSpan('missing', blocks, groups)).toBeUndefined();
});

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
