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

export const MONITOR_SECTION_TOPBAR_HEIGHT = 14;
export const MONITOR_RESIZE_HANDLE_REACH = 6;
export const MONITOR_COLLAPSED_STRIP_HEIGHT = 14;
export const MONITOR_MINIMUM_HEIGHT = 116;
export const MONITOR_MAXIMUM_HEIGHT = 520;
export const MONITOR_MINIMUM_EXPANDED_BODY_SPACE = 96;

const monitorSectionKeys: readonly MonitorSectionKey[] = ['affliction', 'poise', 'sp'];

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

/** 与旧版一致：内容密度不能抬高分隔条的拖动下限。 */
export function monitorSectionBodyMinimums() {
  return {
    affliction: 46,
    poise: 26,
    sp: 52,
  } satisfies Record<MonitorSectionKey, number>;
}

/**
 * Reproduces main's resource-monitor geometry. Expanded sections receive exact pixel heights;
 * collapsed strips and topbars are removed before distributing the remaining body space.
 */
export function resolveMonitorSectionLayout(
  measuredHeight: number,
  collapsed: Record<MonitorSectionKey, boolean>,
  weights: MonitorSectionValues,
): MonitorSectionLayout {
  const totalHeight = Math.min(
    MONITOR_MAXIMUM_HEIGHT,
    Math.max(MONITOR_MINIMUM_HEIGHT, Math.round(measuredHeight || 200)),
  );
  const expanded = monitorSectionKeys.filter(key => !collapsed[key]);
  const minimums = monitorSectionBodyMinimums();
  const expandedBodySpace = Math.max(
    MONITOR_MINIMUM_EXPANDED_BODY_SPACE,
    totalHeight -
      MONITOR_SECTION_TOPBAR_HEIGHT * expanded.length -
      MONITOR_COLLAPSED_STRIP_HEIGHT * (monitorSectionKeys.length - expanded.length),
  );
  const bodies: MonitorSectionValues = { affliction: 0, poise: 0, sp: 0 };

  if (expanded.length === 1) {
    bodies[expanded[0]!] = expandedBodySpace;
  } else if (expanded.length > 0) {
    const normalizedWeights: MonitorSectionValues = {
      affliction: Math.max(0.1, Number(weights.affliction) || 2),
      poise: Math.max(0.1, Number(weights.poise) || 1),
      sp: Math.max(0.1, Number(weights.sp) || 3),
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
          shellHeight: bodyHeight + stripHeight + (isCollapsed ? 0 : MONITOR_SECTION_TOPBAR_HEIGHT),
        },
      ];
    }),
  ) as Record<MonitorSectionKey, MonitorSectionRect>;

  return { bodies, rects };
}
