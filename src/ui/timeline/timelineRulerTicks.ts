import { PROJECT_FPS } from '../../core/project/schema';
import { frameToTimelinePx, timelinePxToExactFrame } from './timelineGeometry';

export interface TimelineRulerTick {
  readonly key: string;
  readonly left: number;
  readonly type: 'major' | 'majorDim' | 'minor' | 'frame';
  readonly label: string;
}

export interface TimelineRulerTickProjectionInput {
  readonly prepFrames: number;
  readonly durationFrames: number;
  readonly pxPerFrame: number;
  readonly visibleLeftPx: number;
  readonly visibleWidthPx: number;
  readonly bufferPx?: number;
  readonly prepExpanded?: boolean;
  readonly prepEndFrame?: number;
}

/** 按旧版缩放阈值投影现实时间刻度，并只保留可见窗口附近的 DOM。 */
export function projectTimelineRulerTicks(
  input: TimelineRulerTickProjectionInput,
): readonly TimelineRulerTick[] {
  const pixelsPerSecond = input.pxPerFrame * PROJECT_FPS;
  const stepFrames =
    pixelsPerSecond >= 800
      ? 1
      : pixelsPerSecond >= 200
        ? PROJECT_FPS / 10
        : pixelsPerSecond >= 100
          ? PROJECT_FPS / 2
          : PROJECT_FPS;
  const bufferPx = input.bufferPx ?? 100;
  const visibleStartFrame = timelinePxToExactFrame(
    Math.max(0, input.visibleLeftPx - bufferPx),
    input.prepFrames,
    input.pxPerFrame,
    input.prepExpanded,
    input.prepEndFrame,
  );
  const visibleEndFrame = timelinePxToExactFrame(
    input.visibleLeftPx + input.visibleWidthPx + bufferPx,
    input.prepFrames,
    input.pxPerFrame,
    input.prepExpanded,
    input.prepEndFrame,
  );
  const minimumFrame = Math.max(
    input.prepExpanded === false ? (input.prepEndFrame ?? 0) : -input.prepFrames,
    visibleStartFrame,
  );
  const maximumFrame = Math.min(input.durationFrames, visibleEndFrame);
  const first = Math.ceil(minimumFrame / stepFrames) * stepFrames;
  const result: TimelineRulerTick[] = [];

  for (let frame = first; frame <= maximumFrame; frame += stepFrames) {
    const roundedFrame = Math.round(frame);
    const secondRemainder = ((roundedFrame % PROJECT_FPS) + PROJECT_FPS) % PROJECT_FPS;
    const integerSecond = secondRemainder === 0;
    let type: TimelineRulerTick['type'];
    let label = '';
    if (integerSecond) {
      const seconds = roundedFrame / PROJECT_FPS;
      const showLabel = pixelsPerSecond >= 100 || seconds % 5 === 0;
      type = showLabel ? 'major' : 'majorDim';
      if (showLabel) label = `${seconds}s`;
    } else if (pixelsPerSecond >= 800) {
      type = secondRemainder % 5 === 0 ? 'minor' : 'frame';
      if (type === 'minor') label = `${secondRemainder}f`;
    } else {
      type = 'minor';
      if (pixelsPerSecond >= 500) {
        label = `.${Math.round((secondRemainder / PROJECT_FPS) * 10)}`;
      }
    }
    result.push({
      key: `time:${roundedFrame}`,
      left: frameToTimelinePx(
        roundedFrame,
        input.prepFrames,
        input.pxPerFrame,
        input.prepExpanded,
        input.prepEndFrame,
      ),
      type,
      label,
    });
  }
  return result;
}
