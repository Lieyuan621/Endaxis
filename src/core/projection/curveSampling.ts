/**
 * 查一条曲线在某个时间点显示什么值。
 *
 * 曲线只在数值变化时记录一个点，两点之间沿用上一个值。
 * 本模块不算任何战斗数值，只回答"这帧曲线显示多少"。
 */
import type { ResourceCurvePoint } from './resourceCurves';

/** 采样时处于未知状态（没有早于或等于该帧的曲线点）。 */
export interface SampledStepCurveValue {
  readonly frame: number;
  readonly value: number | null;
  readonly known: boolean;
}

/** 帧 `frame` 上的值等于最后一个 `point.frame <= frame` 的曲线点值。 */
export function sampleStepCurve(
  points: readonly ResourceCurvePoint[],
  frame: number,
): SampledStepCurveValue {
  if (!Number.isFinite(frame)) {
    throw new RangeError('sample frame must be finite');
  }
  let value: number | null = null;
  for (const point of points) {
    if (point.frame > frame) break;
    value = point.value;
  }
  return { frame, value, known: value !== null };
}
