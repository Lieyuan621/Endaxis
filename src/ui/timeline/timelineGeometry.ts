/**
 * Next 时间轴 UI 共用的整数帧几何换算。
 * 准备阶段显示在战斗第 0 帧左侧，但项目和模拟中的帧身份保持不变。
 */
export const COLLAPSED_PREP_WIDTH_PX = 18;

export function frameToTimelinePx(
  frame: number,
  prepFrames: number,
  pxPerFrame: number,
  prepExpanded = true,
  prepEndFrame = 0,
): number {
  const length = prepFrames + prepEndFrame;
  if (prepExpanded || length <= 0) return (frame + prepFrames) * pxPerFrame;
  // 折叠是裁掉历史视野，不是压缩历史时间；跨边界的持续效果仍保持原比例。
  return COLLAPSED_PREP_WIDTH_PX + (frame - prepEndFrame) * pxPerFrame;
}

export function timelinePxToExactFrame(
  px: number,
  prepFrames: number,
  pxPerFrame: number,
  prepExpanded = true,
  prepEndFrame = 0,
): number {
  if (!(pxPerFrame > 0)) throw new RangeError('pxPerFrame must be positive');
  const length = prepFrames + prepEndFrame;
  if (prepExpanded || length <= 0) return px / pxPerFrame - prepFrames;
  return prepEndFrame + (px - COLLAPSED_PREP_WIDTH_PX) / pxPerFrame;
}

export function timelinePxToFrame(
  px: number,
  prepFrames: number,
  pxPerFrame: number,
  prepExpanded = true,
  prepEndFrame = 0,
): number {
  return Math.round(timelinePxToExactFrame(px, prepFrames, pxPerFrame, prepExpanded, prepEndFrame));
}

export function timelineTotalWidth(
  prepFrames: number,
  durationFrames: number,
  pxPerFrame: number,
  prepExpanded = true,
  prepEndFrame = 0,
): number {
  return frameToTimelinePx(durationFrames, prepFrames, pxPerFrame, prepExpanded, prepEndFrame);
}

export interface TimelineCursorGuidePosition {
  /** 辅助线在时间轴内容区内的真实像素位置。 */
  readonly leftPx: number;
  /** 该位置对应的可采样现实帧，包含准备区的负帧。 */
  readonly sampleFrame: number;
}

/**
 * 将鼠标位置解析为悬停辅助线位置和模拟采样帧。
 *
 * 辅助线必须紧跟鼠标，不能吸附到编辑光标；采样帧则必须限制在准备区与战斗区间内。
 */
export function resolveTimelineCursorGuidePosition(
  pointerPx: number,
  prepFrames: number,
  durationFrames: number,
  pxPerFrame: number,
  prepExpanded = true,
  prepEndFrame = 0,
): TimelineCursorGuidePosition {
  const width = timelineTotalWidth(
    prepFrames,
    durationFrames,
    pxPerFrame,
    prepExpanded,
    prepEndFrame,
  );
  const leftPx = Math.max(0, Math.min(width, pointerPx));
  const sampleFrame = Math.max(
    -prepFrames,
    Math.min(
      durationFrames,
      timelinePxToFrame(leftPx, prepFrames, pxPerFrame, prepExpanded, prepEndFrame),
    ),
  );
  return { leftPx, sampleFrame };
}
