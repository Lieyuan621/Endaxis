import { snapTimelineFrame } from './timelineSnap';
import { timelinePxToExactFrame } from '../timelineGeometry';

export interface TimelineLibraryDropGeometryInput {
  readonly clientX: number;
  readonly laneLeftPx: number;
  readonly dragOffsetPx: number;
  readonly pxPerFrame: number;
  readonly prepFrames: number;
  readonly snapFrames: number;
  readonly maximumFrame: number;
  readonly prepExpanded?: boolean;
  readonly prepEndFrame?: number;
}

/**
 * 将技能库原生拖放的鼠标位置投影为项目保存的现实帧。
 *
 * `dragOffsetPx` 是用户抓住拖影的位置；准备区只改变画布原点，不允许把后续技能平移。
 * 此函数不读取时间膨胀映射，因为玩家放下技能块时编辑的是现实时间。
 */
export function resolveTimelineLibraryDropFrame(input: TimelineLibraryDropGeometryInput): number {
  if (
    !Number.isFinite(input.clientX) ||
    !Number.isFinite(input.laneLeftPx) ||
    !Number.isFinite(input.dragOffsetPx)
  ) {
    throw new TypeError('timeline library drop pixel coordinates must be finite');
  }
  if (!Number.isFinite(input.pxPerFrame) || input.pxPerFrame <= 0) {
    throw new RangeError('pxPerFrame must be a positive finite number');
  }
  if (!Number.isInteger(input.prepFrames) || input.prepFrames < 0) {
    throw new RangeError('prepFrames must be a non-negative integer');
  }

  const contentPx = input.clientX - input.laneLeftPx - input.dragOffsetPx;
  const actualFrame = Math.round(
    timelinePxToExactFrame(
      contentPx,
      input.prepFrames,
      input.pxPerFrame,
      input.prepExpanded,
      input.prepEndFrame,
    ),
  );
  return snapTimelineFrame(actualFrame, input.snapFrames, input.maximumFrame, -input.prepFrames);
}
