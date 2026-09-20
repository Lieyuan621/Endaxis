import { snapTimelineFrame } from './timelineSnap';
import { timelinePxToExactFrame } from '../timelineGeometry';

export interface TimelineMarkerPointerInput {
  readonly clientX: number;
  readonly surfaceLeftPx: number;
  readonly trackHeaderWidthPx: number;
  readonly pxPerFrame: number;
  readonly prepFrames: number;
  readonly snapFrames: number;
  readonly maximumFrame: number;
  /** 最早可写入的现实帧；普通标记默认为战斗开始，准备阶段输入可显式传负值。 */
  readonly minimumFrame?: number;
  /** 抓取点相对标记竖线的位置；在吸附和边界裁定之前扣除。 */
  readonly grabOffsetPx?: number;
  readonly prepExpanded?: boolean;
  readonly prepEndFrame?: number;
}

/**
 * 把标记拖动的客户区横坐标投影为项目中的现实帧。
 *
 * surfaceLeftPx 来自当前滚动位置下时间轴表面的实时边界，因此自动滚动后只需
 * 用同一鼠标坐标重新投影；准备区只是视觉偏移，不会改变项目保存的帧语义。
 */
export function resolveTimelineMarkerPointerFrame(input: TimelineMarkerPointerInput): number {
  if (
    !Number.isFinite(input.clientX) ||
    !Number.isFinite(input.surfaceLeftPx) ||
    !Number.isFinite(input.trackHeaderWidthPx) ||
    !Number.isFinite(input.grabOffsetPx ?? 0)
  ) {
    throw new TypeError('timeline marker pixel coordinates must be finite');
  }
  if (input.trackHeaderWidthPx < 0) {
    throw new RangeError('trackHeaderWidthPx must be non-negative');
  }
  if (!Number.isFinite(input.pxPerFrame) || input.pxPerFrame <= 0) {
    throw new RangeError('pxPerFrame must be a positive finite number');
  }
  if (!Number.isInteger(input.prepFrames) || input.prepFrames < 0) {
    throw new RangeError('prepFrames must be a non-negative integer');
  }

  const frame = timelinePxToExactFrame(
    input.clientX - input.surfaceLeftPx - input.trackHeaderWidthPx - (input.grabOffsetPx ?? 0),
    input.prepFrames,
    input.pxPerFrame,
    input.prepExpanded,
    input.prepEndFrame,
  );
  const minimumFrame = input.minimumFrame ?? 0;
  if (!Number.isInteger(minimumFrame) || minimumFrame > input.maximumFrame) {
    throw new RangeError('minimumFrame must be an integer no greater than maximumFrame');
  }
  return snapTimelineFrame(frame, input.snapFrames, input.maximumFrame, minimumFrame);
}
