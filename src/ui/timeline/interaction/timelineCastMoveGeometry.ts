import { snapTimelineFrame } from './timelineSnap';
import { timelinePxToExactFrame } from '../timelineGeometry';

export interface TimelineCastMoveFrame {
  readonly placementFrame: number;
  readonly actualFrame: number;
}

export interface TimelineCastMovePointerInput {
  readonly clientX: number;
  readonly laneLeftPx: number;
  readonly pxPerFrame: number;
  readonly prepFrames: number;
  readonly pointerOffsetActualFrames: number;
  readonly snapFrames: number;
  readonly minimumFrame?: number;
  readonly actualMaximumFrame: number;
  readonly prepExpanded?: boolean;
  readonly prepEndFrame?: number;
}

/**
 * 技能块位置就是实际战斗帧。时间膨胀映射不参与写回，因而前置或自身
 * 时间膨胀都不能反向改变玩家已经选择的现实落点。
 */
export function resolveTimelineCastMoveFrame(input: {
  readonly pointerActualFrame: number;
  readonly pointerOffsetActualFrames: number;
  readonly snapFrames: number;
  readonly minimumFrame?: number;
  readonly actualMaximumFrame: number;
}): TimelineCastMoveFrame {
  if (
    !Number.isFinite(input.pointerActualFrame) ||
    !Number.isFinite(input.pointerOffsetActualFrames)
  ) {
    throw new TypeError('timeline cast move frame inputs must be finite');
  }
  if (input.pointerOffsetActualFrames < 0) {
    throw new RangeError('pointerOffsetActualFrames must be non-negative');
  }
  const actualFrame = snapTimelineFrame(
    input.pointerActualFrame - input.pointerOffsetActualFrames,
    input.snapFrames,
    input.actualMaximumFrame,
    input.minimumFrame ?? 0,
  );
  return Object.freeze({ actualFrame, placementFrame: actualFrame });
}

/**
 * 从浏览器客户区坐标解析动作移动帧。lane 的实时左缘已经包含水平滚动偏移，
 * 因此边缘自动滚动后以同一鼠标坐标重算即可自然推进现实帧，不维护第二套滚动状态。
 */
export function resolveTimelineCastMovePointerFrame(
  input: TimelineCastMovePointerInput,
): TimelineCastMoveFrame {
  if (!Number.isFinite(input.clientX) || !Number.isFinite(input.laneLeftPx)) {
    throw new TypeError('timeline cast move pixel coordinates must be finite');
  }
  if (!Number.isFinite(input.pxPerFrame) || input.pxPerFrame <= 0) {
    throw new RangeError('pxPerFrame must be a positive finite number');
  }
  if (!Number.isInteger(input.prepFrames) || input.prepFrames < 0) {
    throw new RangeError('prepFrames must be a non-negative integer');
  }

  const minimumFrame = input.minimumFrame ?? -input.prepFrames;
  const pointerActualFrame = Math.max(
    minimumFrame,
    Math.min(
      input.actualMaximumFrame,
      timelinePxToExactFrame(
        input.clientX - input.laneLeftPx,
        input.prepFrames,
        input.pxPerFrame,
        input.prepExpanded,
        input.prepEndFrame,
      ),
    ),
  );
  return resolveTimelineCastMoveFrame({
    pointerActualFrame,
    pointerOffsetActualFrames: input.pointerOffsetActualFrames,
    snapFrames: input.snapFrames,
    minimumFrame,
    actualMaximumFrame: input.actualMaximumFrame,
  });
}
