import type { PoiseCurve } from '../../../core/projection/poiseCurves';
import type { ResourceCurvePoint } from '../../../core/projection/resourceCurves';

export interface PoiseDisplayPoint {
  readonly frame: number;
  readonly value: number;
}

/** 每次原生失衡结算都是瞬时变化；绘图先保持旧值，再在同帧跳到新值。 */
export function poiseDisplayPoints(
  points: readonly PoiseDisplayPoint[],
  endFrame: number,
): readonly PoiseDisplayPoint[] {
  const result: PoiseDisplayPoint[] = [];
  for (const point of points) {
    const previous = result.at(-1);
    if (previous !== undefined && previous.frame < point.frame && previous.value !== point.value) {
      result.push({ frame: point.frame, value: previous.value });
    }
    result.push(point);
  }
  const last = result.at(-1);
  if (last !== undefined && last.frame < endFrame)
    result.push({ frame: endFrame, value: last.value });
  return result;
}

/** 运行时存剩余抗性，旧版监控器显示已积累失衡。仅转换展示值，保留事实点身份。 */
export function poiseProgressPoints(curve: PoiseCurve): readonly ResourceCurvePoint[] {
  return curve.points.map(point => ({
    ...point,
    value: Math.max(0, Math.min(curve.maxValue, curve.maxValue - point.value)),
  }));
}

export interface SpDisplayPoint {
  readonly frame: number;
  readonly value: number;
  readonly source?: 'autoRecovery';
}

/** 只补绘图锚点，不重算技力。自动恢复回执描述该帧区间，其余变化在记录帧瞬时发生。 */
export function spDisplayPoints(
  points: readonly SpDisplayPoint[],
  startFrame: number,
  endFrame: number,
): readonly SpDisplayPoint[] {
  const first = points[0];
  if (first === undefined) return [];
  const result: SpDisplayPoint[] = [];
  if (startFrame < first.frame) result.push({ frame: startFrame, value: first.value });
  for (const point of points) {
    const previous = result.at(-1);
    if (previous !== undefined && previous.value !== point.value) {
      const beforeFrame = point.source === 'autoRecovery' ? point.frame - 1 : point.frame;
      if (previous.frame < beforeFrame) result.push({ frame: beforeFrame, value: previous.value });
    }
    result.push(point);
  }
  const last = result.at(-1)!;
  if (last.frame < endFrame) result.push({ frame: endFrame, value: last.value });
  return result;
}
