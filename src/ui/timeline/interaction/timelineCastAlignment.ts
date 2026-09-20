import { snapTimelineFrame } from './timelineSnap';

export type TimelineCastAlignmentMode = 'snapBefore' | 'snapAfter' | 'alignStart' | 'alignEnd';

/**
 * 以玩家看到的实际时间边缘计算技能块的新落点。项目中的 placement 本来就是实际帧，
 * 因此时间膨胀只影响传入的块宽，不参与反向换算。
 */
export function resolveTimelineCastAlignmentFrame(input: {
  readonly mode: TimelineCastAlignmentMode;
  readonly targetStartFrame: number;
  readonly targetDurationFrames: number;
  readonly sourceDurationFrames: number;
  readonly snapFrames: number;
  readonly minimumFrame?: number;
  readonly maximumFrame: number;
}): number {
  const targetEndFrame = input.targetStartFrame + input.targetDurationFrames;
  const rawFrame =
    input.mode === 'snapBefore'
      ? input.targetStartFrame - input.sourceDurationFrames
      : input.mode === 'snapAfter'
        ? targetEndFrame
        : input.mode === 'alignStart'
          ? input.targetStartFrame
          : targetEndFrame - input.sourceDurationFrames;
  return snapTimelineFrame(rawFrame, input.snapFrames, input.maximumFrame, input.minimumFrame ?? 0);
}
