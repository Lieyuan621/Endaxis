export type MonitorSectionKey = 'affliction' | 'poise' | 'sp';

export type MonitorSectionValues = Record<MonitorSectionKey, number>;

export interface MonitorSectionRect {
  readonly bodyHeight: number;
  readonly stripHeight: number;
  readonly shellHeight: number;
}

export interface MonitorSectionLayout {
  readonly bodies: MonitorSectionValues;
  readonly rects: Record<MonitorSectionKey, MonitorSectionRect>;
}

export const MONITOR_RESIZE_HANDLE_REACH = 6;
export const MONITOR_COLLAPSED_STRIP_HEIGHT = 14;
export const MONITOR_MINIMUM_HEIGHT = 116;
const MONITOR_EXPANDED_MINIMUM_HEIGHT = 200;
export const MONITOR_MAXIMUM_HEIGHT = 520;
export const DEFAULT_MONITOR_SECTION_WEIGHTS = {
  affliction: 3,
  poise: 1,
  sp: 2,
} satisfies MonitorSectionValues;

const monitorSectionKeys: readonly MonitorSectionKey[] = ['affliction', 'poise', 'sp'];
/** 容纳展开的紧凑内容；短窗口由工作台整体滚动，不裁切监视区输入。 */
export function monitorMinimumContentHeight(collapsedCount = 0): number {
  const collapsed = Math.min(2, Math.max(0, Math.round(collapsedCount)));
  const expanded = monitorSectionKeys.length - collapsed;
  const largestBodyMinimums = Object.values(monitorSectionBodyMinimums())
    .sort((a, b) => b - a)
    .slice(0, expanded);
  return Math.max(
    collapsed === 0 ? MONITOR_EXPANDED_MINIMUM_HEIGHT : MONITOR_MINIMUM_HEIGHT,
    largestBodyMinimums.reduce((sum, minimum) => sum + minimum, 0) +
      collapsed * MONITOR_COLLAPSED_STRIP_HEIGHT,
  );
}

/** 旧版按可用高度压缩图标，行间距固定为 4px；低于 14px 时由区域裁切。 */
export function enemyStatusRowSize(bodyHeight: number, rowCount: number): number {
  const rows = Math.max(1, rowCount);
  const available = Math.max(0, bodyHeight - 4 * (rows - 1));
  return Math.max(14, Math.min(20, Math.floor(available / rows)));
}

/** 从实际显示高度开始拖动，不能复用已被 min-height 约束改变比例的旧权重。 */
export function resizeMonitorSectionBodies(
  bodies: Partial<Record<MonitorSectionKey, number>>,
  upper: MonitorSectionKey,
  lower: MonitorSectionKey,
  delta: number,
  minimums: Record<MonitorSectionKey, number>,
) {
  const upperBody = bodies[upper] ?? 0;
  const total = upperBody + (bodies[lower] ?? 0);
  const scale = Math.min(1, total / Math.max(1, minimums[upper] + minimums[lower]));
  const nextUpper = Math.min(
    total - minimums[lower] * scale,
    Math.max(minimums[upper] * scale, upperBody + delta),
  );
  return { ...bodies, [upper]: nextUpper, [lower]: total - nextUpper };
}

/** 三段紧凑布局中仍能完整放下数值、进度条与技力输入的最小高度。 */
export function monitorSectionBodyMinimums() {
  return {
    affliction: 54,
    poise: 32,
    // 三行 22px 输入、两段 4px 行距、上下内边距及区块边线。
    sp: 86,
  } satisfies Record<MonitorSectionKey, number>;
}

/**
 * Expanded sections receive exact pixel heights; only collapsed strips consume layout space.
 * The floating chevrons overlay section edges and do not reserve a topbar.
 */
export function resolveMonitorSectionLayout(
  measuredHeight: number,
  collapsed: Record<MonitorSectionKey, boolean>,
  weights: MonitorSectionValues,
): MonitorSectionLayout {
  const expanded = monitorSectionKeys.filter(key => !collapsed[key]);
  const minimums = monitorSectionBodyMinimums();
  const minimumBodySpace = expanded.reduce((sum, key) => sum + minimums[key], 0);
  const collapsedStripSpace =
    MONITOR_COLLAPSED_STRIP_HEIGHT * (monitorSectionKeys.length - expanded.length);
  const totalHeight = Math.min(
    MONITOR_MAXIMUM_HEIGHT,
    Math.max(
      monitorMinimumContentHeight(monitorSectionKeys.length - expanded.length),
      minimumBodySpace + collapsedStripSpace,
      Math.round(measuredHeight || 200),
    ),
  );
  const expandedBodySpace = Math.max(minimumBodySpace, totalHeight - collapsedStripSpace);
  const bodies: MonitorSectionValues = { affliction: 0, poise: 0, sp: 0 };

  if (expanded.length === 1) {
    bodies[expanded[0]!] = expandedBodySpace;
  } else if (expanded.length > 0) {
    const normalizedWeights: MonitorSectionValues = {
      affliction: Math.max(
        0.1,
        Number(weights.affliction) || DEFAULT_MONITOR_SECTION_WEIGHTS.affliction,
      ),
      poise: Math.max(0.1, Number(weights.poise) || DEFAULT_MONITOR_SECTION_WEIGHTS.poise),
      sp: Math.max(0.1, Number(weights.sp) || DEFAULT_MONITOR_SECTION_WEIGHTS.sp),
    };
    const totalWeight = expanded.reduce((sum, key) => sum + normalizedWeights[key], 0);
    const minimumSum = expanded.reduce((sum, key) => sum + minimums[key], 0);

    if (expandedBodySpace < minimumSum) {
      const scale = expandedBodySpace / Math.max(1, minimumSum);
      let remaining = expandedBodySpace;
      expanded.forEach((key, index) => {
        const proposed =
          index === expanded.length - 1
            ? remaining
            : Math.max(8, Math.floor(minimums[key] * scale));
        bodies[key] = proposed;
        remaining -= proposed;
      });
    } else {
      for (const key of expanded) {
        bodies[key] = Math.max(
          minimums[key],
          Math.round(expandedBodySpace * (normalizedWeights[key] / totalWeight)),
        );
      }

      const assigned = expanded.reduce((sum, key) => sum + bodies[key], 0);
      if (assigned > expandedBodySpace) {
        let overflow = assigned - expandedBodySpace;
        for (const key of expanded) {
          if (overflow <= 0) break;
          const reduction = Math.min(overflow, Math.max(0, bodies[key] - minimums[key]));
          bodies[key] -= reduction;
          overflow -= reduction;
        }
      } else if (assigned < expandedBodySpace) {
        bodies[expanded[expanded.length - 1]!] += expandedBodySpace - assigned;
      }
    }
  }

  const rects = Object.fromEntries(
    monitorSectionKeys.map(key => {
      const isCollapsed = collapsed[key];
      const bodyHeight = isCollapsed ? 0 : bodies[key];
      const stripHeight = isCollapsed ? MONITOR_COLLAPSED_STRIP_HEIGHT : 0;
      return [
        key,
        {
          bodyHeight,
          stripHeight,
          shellHeight: bodyHeight + stripHeight,
        },
      ];
    }),
  ) as Record<MonitorSectionKey, MonitorSectionRect>;

  return { bodies, rects };
}
