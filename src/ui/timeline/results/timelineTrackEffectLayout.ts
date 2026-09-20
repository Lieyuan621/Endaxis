export type TimelineBuffLayoutMode = 'compact' | 'loose';

export interface TimelineTrackEffectLayoutInput {
  readonly mode: TimelineBuffLayoutMode;
  readonly upperLaneCount: number;
  readonly lowerLaneCount: number;
  /** 紧凑模式的本地 UI 高度覆盖；松散模式不消费它。 */
  readonly compactHeight?: number;
}

export interface TimelineTrackEffectLayout {
  readonly height: number;
  readonly actionTop: number;
}

export const TIMELINE_TRACK_BASE_HEIGHT = 160;
export const TIMELINE_ACTION_BASE_TOP = 55;
export const TIMELINE_BUFF_LANE_PITCH = 22;
export const TIMELINE_UPPER_BUFF_LANE_PITCH = 24;
/** 旧版紧凑轨道允许压到 50px 技能区上下各留 8px。 */
export const TIMELINE_TRACK_MIN_HEIGHT = 66;

const BUFF_LAYER_MARGIN = 4;
const BUFF_ICON_SIZE = 18;
/** 旧版上层容器距轨道顶边 2px，18px 图标在 24px 行内再缩进 3px。 */
const UPPER_BUFF_EDGE_INSET = 5;
/** 旧版下方容器距边缘 2px，图标在 24px 行内另缩进 3px。 */
const LOWER_BUFF_EDGE_INSET = 5;

/** 与旧版一致：下方状态从轨道外缘向上排列，不从技能底边向下挤占附属标记。 */
export function timelineLowerBuffTop(actionTop: number, lane: number): number {
  const trackHeight = actionTop * 2 + 50;
  return trackHeight - LOWER_BUFF_EDGE_INSET - BUFF_ICON_SIZE - lane * TIMELINE_BUFF_LANE_PITCH;
}

/** 紧凑轨道按已有高度比例填满可视区域；不增加额外的上下空白。 */
export function resolveCompactTrackHeights(
  weights: readonly number[],
  availableHeight: number,
): readonly number[] {
  if (weights.length === 0) return [];
  const total = Math.max(
    weights.length,
    Math.round(
      Number.isFinite(availableHeight) && availableHeight > 0
        ? availableHeight
        : weights.length * TIMELINE_TRACK_BASE_HEIGHT,
    ),
  );
  const normalized = weights.map(value => (Number.isFinite(value) && value > 0 ? value : 1));
  const minimum =
    total >= weights.length * TIMELINE_TRACK_MIN_HEIGHT ? TIMELINE_TRACK_MIN_HEIGHT : 1;
  const heights = new Array<number>(weights.length).fill(minimum);
  const pending = new Set(normalized.map((_, index) => index));
  let remaining = total;

  while (pending.size > 0) {
    const pendingWeight = [...pending].reduce((sum, index) => sum + (normalized[index] ?? 0), 0);
    const clamped = [...pending].filter(
      index => (remaining * (normalized[index] ?? 0)) / pendingWeight < minimum,
    );
    if (clamped.length === 0) break;
    for (const index of clamped) {
      heights[index] = minimum;
      remaining -= minimum;
      pending.delete(index);
    }
  }

  const pendingIndexes = [...pending];
  const pendingWeight = pendingIndexes.reduce((sum, index) => sum + (normalized[index] ?? 0), 0);
  const allocations = pendingIndexes.map(index => {
    const exact = (remaining * (normalized[index] ?? 0)) / pendingWeight;
    return { index, height: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let undistributed = remaining - allocations.reduce((sum, item) => sum + item.height, 0);
  allocations.sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  for (const item of allocations) {
    if (undistributed <= 0) break;
    item.height += 1;
    undistributed -= 1;
  }
  for (const item of allocations) {
    heights[item.index] = item.height;
  }
  return heights;
}

/** 与旧版一致：上方状态从轨道外缘向下排列，空间不足时在技能区域边界被裁切。 */
export function timelineUpperBuffTop(lane: number): number {
  return UPPER_BUFF_EDGE_INSET + lane * TIMELINE_UPPER_BUFF_LANE_PITCH;
}

/**
 * 计算旧版“紧凑 / 松散”Buff 布局使用的轨道高度。
 *
 * 紧凑模式保持用户分配的轨道高度，超出轨道边界的 Buff 由轨道容器裁掉；这样四条轨道可以
 * 继续填满固定视口，并允许拖动分隔线调整各轨道的可见空间。松散模式按当前 Buff 行数自动增高，
 * 取上下两侧所需空间的较大值作对称留白，使 50px 技能区域始终位于轨道中央。
 */
export function projectTimelineTrackEffectLayout(
  input: TimelineTrackEffectLayoutInput,
): TimelineTrackEffectLayout {
  const baselineHeight = Math.max(
    input.mode === 'compact' ? 1 : TIMELINE_TRACK_BASE_HEIGHT,
    Math.round(
      input.mode === 'compact'
        ? (input.compactHeight ?? TIMELINE_TRACK_BASE_HEIGHT)
        : TIMELINE_TRACK_BASE_HEIGHT,
    ),
  );
  const baselinePadding = (baselineHeight - 50) / 2;
  if (input.mode === 'compact') {
    return { height: baselineHeight, actionTop: baselinePadding };
  }
  const upperNeed =
    input.upperLaneCount > 0
      ? Math.floor(input.upperLaneCount) * TIMELINE_UPPER_BUFF_LANE_PITCH + BUFF_LAYER_MARGIN
      : 0;
  const lowerNeed =
    input.lowerLaneCount > 0
      ? Math.floor(input.lowerLaneCount) * TIMELINE_BUFF_LANE_PITCH + BUFF_LAYER_MARGIN
      : 0;
  const padding = Math.max(baselinePadding, upperNeed, lowerNeed);

  return { height: 50 + padding * 2, actionTop: padding };
}

/** 拖动相邻轨道分隔线时保持两行总高度不变；该状态只属于本地视图。 */
export function resizeTimelineTrackPair(
  heights: readonly number[],
  upperIndex: number,
  delta: number,
): readonly number[] {
  if (!Number.isInteger(upperIndex) || upperIndex < 0 || upperIndex + 1 >= heights.length) {
    return heights;
  }
  const upper = heights[upperIndex] ?? TIMELINE_TRACK_BASE_HEIGHT;
  const lower = heights[upperIndex + 1] ?? TIMELINE_TRACK_BASE_HEIGHT;
  const pairTotal = Math.max(2, upper + lower);
  const minimum = Math.min(TIMELINE_TRACK_MIN_HEIGHT, Math.max(1, Math.floor(pairTotal / 2)));
  const nextUpper = Math.min(pairTotal - minimum, Math.max(minimum, Math.round(upper + delta)));
  const next = [...heights];
  next[upperIndex] = nextUpper;
  next[upperIndex + 1] = pairTotal - nextUpper;
  return next;
}
