export type MonitorSectionKey = 'affliction' | 'poise' | 'sp';

export const MONITOR_SECTION_TOPBAR_HEIGHT = 14;
export const MONITOR_RESIZE_HANDLE_REACH = 6;

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
