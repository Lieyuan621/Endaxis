/** 提示条的时间位置和资源采样。 */
import type { OverlayCast, OverlayTimePoint, OverlayTimeWindow } from './plan';

/** 时间 → 传送带内的 x 坐标（gateX 为「现在」所在的横坐标）。 */
export function xForTime(time: number, now: number, pxPerSecond: number, gateX = 0): number {
  return gateX + (time - now) * pxPerSecond;
}

/** 下一个动作的下标（第一个开始时间不早于 now 的动作）。无则返回 -1。 */
export function findNextCastIndex(casts: OverlayCast[], now: number, epsilon = 0.02): number {
  for (let index = 0; index < casts.length; index += 1) {
    if (casts[index]!.start >= now - epsilon) return index;
  }
  return -1;
}

/** 同一时刻需要执行的下一组动作；相邻帧保持各自的提示。 */
export function findNextCastGroup(casts: OverlayCast[], now: number): OverlayCast[] {
  const start = findNextCastIndex(casts, now);
  if (start < 0) return [];
  let end = start + 1;
  while (end < casts.length && Math.abs(casts[end]!.start - casts[start]!.start) <= 1e-6) {
    end += 1;
  }
  return casts.slice(start, end);
}

/** 轴时间保留负准备期，四舍五入到 0.1 秒后统一处理分秒进位。 */
export function formatOverlayTime(time: number): string {
  const tenths = Math.round(Math.abs(time) * 10);
  const minutes = Math.floor(tenths / 600);
  const seconds = ((tenths % 600) / 10).toFixed(1).padStart(4, '0');
  return `${time < 0 ? '-' : ''}${minutes}:${seconds}`;
}

/** 时间序列采样：返回 `time <= now` 的最后一个值。 */
export function samplePoints(
  points: OverlayTimePoint[] | undefined,
  now: number,
  fallback = 0,
): number {
  if (!points?.length) return fallback;
  // 数据按时间排序；同一时刻的最后一个点表示当帧资源变化后的值。
  let left = 0;
  let right = points.length;
  while (left < right) {
    const middle = Math.floor((left + right) / 2);
    if (points[middle]!.time <= now) left = middle + 1;
    else right = middle;
  }
  return left > 0 ? points[left - 1]!.value : fallback;
}

/** now 是否落在某个连携窗口内；返回该窗口。 */
export function activeWindow(
  windows: OverlayTimeWindow[] | undefined,
  now: number,
): OverlayTimeWindow | null {
  if (!windows?.length) return null;
  for (const window of windows) {
    if (now >= window.start && now < window.end) return window;
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
