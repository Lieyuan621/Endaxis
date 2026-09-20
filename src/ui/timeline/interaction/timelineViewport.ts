/**
 * 定义时间轴视图缩放的边界与换算规则。
 * 缩放属于编辑器会话状态，不进入存档；调用方只应把换算后的每帧像素传给几何函数。
 */
// UI 的 100% 表示 50px / 现实秒；当前模拟帧仍为 30Hz。
export const DEFAULT_TIMELINE_PX_PER_FRAME = 50 / 30;
export const MIN_TIMELINE_ZOOM_PERCENT = 30;
export const MAX_TIMELINE_ZOOM_PERCENT = 2400;
export const TIMELINE_ZOOM_SLIDER_MIDPOINT = 500;
export const TIMELINE_ZOOM_SLIDER_MAX = 1000;

/**
 * 滑杆左半段专门表示 30%–100%，右半段表示 100%–2400%。两段分别使用对数尺度，
 * 让相同的视觉距离对应相近的相对倍率变化，同时给缩小区间留下足够行程。
 */
export function timelineZoomPercentToSliderPosition(percent: number): number {
  const normalized = normalizeTimelineZoomPercent(percent);
  if (normalized <= 100) {
    return (
      (Math.log(normalized / MIN_TIMELINE_ZOOM_PERCENT) /
        Math.log(100 / MIN_TIMELINE_ZOOM_PERCENT)) *
      TIMELINE_ZOOM_SLIDER_MIDPOINT
    );
  }
  return (
    TIMELINE_ZOOM_SLIDER_MIDPOINT +
    (Math.log(normalized / 100) / Math.log(MAX_TIMELINE_ZOOM_PERCENT / 100)) *
      (TIMELINE_ZOOM_SLIDER_MAX - TIMELINE_ZOOM_SLIDER_MIDPOINT)
  );
}

export function timelineZoomSliderPositionToPercent(position: number): number {
  const normalizedPosition = Number.isFinite(position)
    ? Math.min(TIMELINE_ZOOM_SLIDER_MAX, Math.max(0, position))
    : TIMELINE_ZOOM_SLIDER_MIDPOINT;
  if (normalizedPosition <= TIMELINE_ZOOM_SLIDER_MIDPOINT) {
    return normalizeTimelineZoomPercent(
      MIN_TIMELINE_ZOOM_PERCENT *
        Math.pow(
          100 / MIN_TIMELINE_ZOOM_PERCENT,
          normalizedPosition / TIMELINE_ZOOM_SLIDER_MIDPOINT,
        ),
    );
  }
  return normalizeTimelineZoomPercent(
    100 *
      Math.pow(
        MAX_TIMELINE_ZOOM_PERCENT / 100,
        (normalizedPosition - TIMELINE_ZOOM_SLIDER_MIDPOINT) /
          (TIMELINE_ZOOM_SLIDER_MAX - TIMELINE_ZOOM_SLIDER_MIDPOINT),
      ),
  );
}

/** 缩放按钮每次增减当前秒宽的约 10%，最小变化 1px / 秒。 */
export function stepTimelineZoomPercent(percent: number, direction: -1 | 1): number {
  return normalizeTimelineZoomPercent(
    percent + direction * Math.max(1, Math.round(percent / 20)) * 2,
  );
}

/** 滚轮按秒宽的 15% 取整到像素，再换回百分比。 */
export function wheelTimelineZoomPercent(percent: number, direction: -1 | 1): number {
  return normalizeTimelineZoomPercent(percent + Math.round((percent / 2) * 0.15 * direction) * 2);
}

export function normalizeTimelineZoomPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 100;
  return Math.min(
    MAX_TIMELINE_ZOOM_PERCENT,
    Math.max(MIN_TIMELINE_ZOOM_PERCENT, Math.round(percent)),
  );
}

export function timelinePxPerFrame(percent: number): number {
  return (DEFAULT_TIMELINE_PX_PER_FRAME * normalizeTimelineZoomPercent(percent)) / 100;
}

export type TimelineWheelIntent =
  | { readonly kind: 'zoom'; readonly direction: -1 | 1 }
  | { readonly kind: 'horizontalPan'; readonly deltaPx: number }
  | { readonly kind: 'verticalPan'; readonly deltaPx: number };

/**
 * Ctrl 围绕指针缩放，Shift 横向平移。普通滚轮直接移动视口，避免原生平滑滚动在边界缓停。
 */
export function resolveTimelineWheelIntent(input: {
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly deltaX: number;
  readonly deltaY: number;
}): TimelineWheelIntent {
  if (input.ctrlKey) {
    return { kind: 'zoom', direction: input.deltaY < 0 ? 1 : -1 };
  }
  if (input.shiftKey) {
    return {
      kind: 'horizontalPan',
      deltaPx: input.deltaY === 0 ? input.deltaX : input.deltaY,
    };
  }
  return { kind: 'verticalPan', deltaPx: input.deltaY };
}

/** WheelEvent 可能以像素、行或页报告位移；统一换算为视口像素。 */
export function timelineWheelDeltaPx(
  delta: number,
  deltaMode: number,
  viewportHeight: number,
): number {
  if (deltaMode === 1) return delta * 16;
  if (deltaMode === 2) return delta * viewportHeight;
  return delta;
}

/** 计算中键拖拽平移后的滚动位置，独立于 DOM 事件以便验证方向和边界。 */
export interface TimelineViewportPanOrigin {
  readonly pointerX: number;
  readonly pointerY: number;
  readonly scrollLeft: number;
  readonly scrollTop: number;
}

export interface TimelineViewportScrollPosition {
  readonly left: number;
  readonly top: number;
}

export function resolveTimelineViewportPan(
  origin: TimelineViewportPanOrigin,
  pointerX: number,
  pointerY: number,
): TimelineViewportScrollPosition {
  return {
    left: Math.max(0, origin.scrollLeft - (pointerX - origin.pointerX)),
    top: Math.max(0, origin.scrollTop - (pointerY - origin.pointerY)),
  };
}
