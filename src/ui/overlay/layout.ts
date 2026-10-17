/**
 * 游戏内提示条的几何与采样工具（纯函数）。
 *
 * 三条对齐规则是这里的核心：
 * - 战技（battleSkill）：图标**垂直居中**于轴线；
 * - 终结技（ultimate）：图标**底边贴住**轴线，整体位于轴线上方；
 * - 连携技（comboSkill）：图标**顶边贴住**轴线，整体位于轴线下方。
 *
 * 其它类型（普攻/下落/处决）按战技处理，视觉上不会跳出三条带。
 */

import type { OverlayCast, OverlaySkillType, OverlayTimePoint, OverlayTimeWindow } from './plan';

export interface BeltGeometryInput {
  iconSize: number;
  /** 轴线上下各留出的余量，避免图标贴边。 */
  padding?: number;
}

export interface BeltGeometry {
  iconSize: number;
  padding: number;
  /** 轴线在传送带内的 y 坐标。 */
  axisY: number;
  /** 传送带总高度。 */
  height: number;
}

export function computeBeltGeometry(input: BeltGeometryInput): BeltGeometry {
  const iconSize = Math.max(12, input.iconSize);
  const padding = Math.max(0, input.padding ?? Math.round(iconSize * 0.18));
  return {
    iconSize,
    padding,
    axisY: padding + iconSize,
    height: iconSize * 2 + padding * 2,
  };
}

/** 图标顶边位置：由技能类型决定与轴线的对齐方式。 */
export function laneTop(type: OverlaySkillType, geometry: BeltGeometry): number {
  const { axisY, iconSize } = geometry;
  if (type === 'ultimate') return axisY - iconSize;
  if (type === 'comboSkill') return axisY;
  // battleSkill 以及其它类型：垂直居中
  return axisY - iconSize / 2;
}

/** 时间 → 传送带内的 x 坐标（gateX 为「现在」所在的横坐标）。 */
export function xForTime(
  time: number,
  now: number,
  pxPerSecond: number,
  gateX = 0,
): number {
  return gateX + (time - now) * pxPerSecond;
}

/** 只在可视窗口内的动作会被渲染。 */
export function isVisibleAt(
  time: number,
  now: number,
  secondsAhead: number,
  iconPx: number,
  pxPerSecond: number,
): boolean {
  const x = (time - now) * pxPerSecond;
  const margin = iconPx * 1.4;
  return x >= -margin && x <= secondsAhead * pxPerSecond + margin;
}

/** 下一个动作的下标（第一个开始时间不早于 now 的动作）。无则返回 -1。 */
export function findNextCastIndex(casts: OverlayCast[], now: number, epsilon = 0.02): number {
  for (let index = 0; index < casts.length; index += 1) {
    if (casts[index]!.start >= now - epsilon) return index;
  }
  return -1;
}

/** 距离下一个动作还有多少秒；没有下一个动作时返回 null。 */
export function countdownToNext(casts: OverlayCast[], now: number, epsilon = 0.02): number | null {
  const index = findNextCastIndex(casts, now, epsilon);
  if (index < 0) return null;
  return Math.max(0, casts[index]!.start - now);
}

/** 时间序列采样：返回 `time <= now` 的最后一个值。 */
export function samplePoints(
  points: OverlayTimePoint[] | undefined,
  now: number,
  fallback = 0,
): number {
  if (!points?.length) return fallback;
  let value = points[0]!.value;
  for (const point of points) {
    if (point.time > now) break;
    value = point.value;
  }
  return value;
}

/** 时间序列中的最大值，用于把 gauge 归一化成 0..1。 */
export function seriesMax(points: OverlayTimePoint[] | undefined, fallback = 1): number {
  if (!points?.length) return fallback;
  let max = 0;
  for (const point of points) max = Math.max(max, point.value);
  return max > 0 ? max : fallback;
}

/** now 是否落在某个连携窗口内；返回该窗口。 */
export function activeWindow(
  windows: OverlayTimeWindow[] | undefined,
  now: number,
): OverlayTimeWindow | null {
  if (!windows?.length) return null;
  for (const window of windows) {
    if (now >= window.start && now <= window.end) return window;
  }
  return null;
}

export interface TimeTick {
  time: number;
  x: number;
  major: boolean;
}

/** 传送带上的刻度：每秒一个，每 5 秒加重。 */
export function buildTimeTicks(
  now: number,
  secondsAhead: number,
  pxPerSecond: number,
  gateX = 0,
): TimeTick[] {
  const ticks: TimeTick[] = [];
  const start = Math.ceil(now);
  const end = Math.floor(now + secondsAhead);
  for (let time = start; time <= end; time += 1) {
    ticks.push({
      time,
      x: xForTime(time, now, pxPerSecond, gateX),
      major: time % 5 === 0,
    });
  }
  return ticks;
}

/** 倒计时文案：一位小数，超过 60 秒显示整数秒。 */
export function formatCountdown(seconds: number | null): string {
  if (seconds === null) return '--';
  if (seconds >= 60) return String(Math.round(seconds));
  return seconds.toFixed(1);
}
