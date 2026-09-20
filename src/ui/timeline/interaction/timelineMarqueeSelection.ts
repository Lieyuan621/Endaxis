/**
 * 计算时间轴框选命中的动作，并更新 UI 会话中的临时选择状态。
 *
 * 本模块只处理与渲染框架无关的二维几何和选择语义，不读取 DOM，不修改存档。
 * 调用方负责把屏幕坐标统一到同一坐标系，再把结果交回具体的 UI 状态容器。
 */
import { selectTimelineAction, type TimelineActionSelection } from './timelineActionSelection';

/** 从按下点拖拽到当前点形成的框选区域，允许任意拖拽方向。 */
export interface TimelineMarqueeRectangle {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
}

/** 一个动作块在框选坐标系中的矩形；负宽高也会按反向矩形归一化。 */
export interface TimelineActionRectangle {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Ctrl 与 Meta 使用相同的逐项切换语义，以兼容 Windows/Linux 和 macOS。 */
export interface TimelineMarqueeSelectionModifiers {
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
}

interface NormalizedRectangle {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

interface HitAction {
  readonly id: string;
  readonly bounds: NormalizedRectangle;
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${field} must be finite`);
}

function normalizeMarquee(rectangle: TimelineMarqueeRectangle): NormalizedRectangle {
  requireFinite(rectangle.startX, 'startX');
  requireFinite(rectangle.startY, 'startY');
  requireFinite(rectangle.endX, 'endX');
  requireFinite(rectangle.endY, 'endY');
  return {
    left: Math.min(rectangle.startX, rectangle.endX),
    top: Math.min(rectangle.startY, rectangle.endY),
    right: Math.max(rectangle.startX, rectangle.endX),
    bottom: Math.max(rectangle.startY, rectangle.endY),
  };
}

function normalizeAction(rectangle: TimelineActionRectangle): NormalizedRectangle {
  if (rectangle.id.length === 0) throw new TypeError('action rectangle id must not be empty');
  requireFinite(rectangle.x, 'action.x');
  requireFinite(rectangle.y, 'action.y');
  requireFinite(rectangle.width, 'action.width');
  requireFinite(rectangle.height, 'action.height');
  return {
    left: Math.min(rectangle.x, rectangle.x + rectangle.width),
    top: Math.min(rectangle.y, rectangle.y + rectangle.height),
    right: Math.max(rectangle.x, rectangle.x + rectangle.width),
    bottom: Math.max(rectangle.y, rectangle.y + rectangle.height),
  };
}

function intersects(left: NormalizedRectangle, right: NormalizedRectangle): boolean {
  return (
    left.left <= right.right &&
    left.right >= right.left &&
    left.top <= right.bottom &&
    left.bottom >= right.top
  );
}

function collectHitIds(
  marquee: NormalizedRectangle,
  actions: readonly TimelineActionRectangle[],
): readonly string[] {
  const hits = new Map<string, HitAction>();
  for (const action of actions) {
    const bounds = normalizeAction(action);
    if (intersects(marquee, bounds) && !hits.has(action.id)) {
      hits.set(action.id, { id: action.id, bounds });
    }
  }
  return [...hits.values()]
    .sort(
      (left, right) =>
        left.bounds.top - right.bounds.top ||
        left.bounds.left - right.bounds.left ||
        left.id.localeCompare(right.id),
    )
    .map(hit => hit.id);
}

function hasSameIds(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  return left.size === right.size && [...left].every(id => right.has(id));
}

/**
 * 应用一次完成的框选。
 *
 * 普通框选以全部命中项替换旧选择；Ctrl/Meta 框选对每个命中项执行一次切换。
 * 零面积拖拽被视为尚未形成框选，因此原选择及其对象引用都会保持不变。
 */
export function applyTimelineMarqueeSelection(
  selection: TimelineActionSelection,
  marqueeRectangle: TimelineMarqueeRectangle,
  actionRectangles: readonly TimelineActionRectangle[],
  modifiers: TimelineMarqueeSelectionModifiers = {},
): TimelineActionSelection {
  const marquee = normalizeMarquee(marqueeRectangle);
  if (marquee.left === marquee.right || marquee.top === marquee.bottom) return selection;

  const hitIds = collectHitIds(marquee, actionRectangles);
  if (modifiers.ctrlKey || modifiers.metaKey) {
    return hitIds.reduce((current, id) => selectTimelineAction(current, id, true), selection);
  }

  const selectedIds = new Set(hitIds);
  const primaryId =
    selection.primaryId !== null && selectedIds.has(selection.primaryId)
      ? selection.primaryId
      : (hitIds[0] ?? null);
  if (selection.primaryId === primaryId && hasSameIds(selection.selectedIds, selectedIds)) {
    return selection;
  }
  return { selectedIds, primaryId };
}
