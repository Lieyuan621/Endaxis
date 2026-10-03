import type { TimeScaleCurveKeyDefinition } from '../../../packages/game-data-contract/src/conditions';
import { compileTimeScaleCurve } from '../../core/combat/time/timeScaleCurve';

export interface CurvePreviewPoint {
  readonly time: number;
  readonly value: number;
}
export interface CurvePreview {
  readonly paths: readonly (readonly CurvePreviewPoint[])[];
  /** Exact values at key times are separate from one-sided limits at discontinuities. */
  readonly keys: readonly CurvePreviewPoint[];
  readonly jumps: readonly { time: number; left: number; right: number; exact: number }[];
  readonly x: readonly [number, number];
  readonly y: readonly [number, number];
}
export const TIME_SCALE_CURVE_PREVIEW_MAX_KEYS = 128;
const MAX_SAMPLES = 512;
/** Bounded runtime sampling. Never approximate a step with a diagonal connector. */
export function timeScaleCurvePreview(keys: readonly TimeScaleCurveKeyDefinition[]): CurvePreview {
  if (keys.length > TIME_SCALE_CURVE_PREVIEW_MAX_KEYS)
    throw new Error('timeScaleCurve.previewLimit');
  const evaluate = compileTimeScaleCurve(keys);
  const x: [number, number] = [Math.min(0, keys[0]!.time), Math.max(1, keys.at(-1)!.time)];
  if (!Number.isFinite(x[1] - x[0])) throw new Error('timeScaleCurve.previewRange');
  const paths: CurvePreviewPoint[][] = [];
  const jumps: { time: number; left: number; right: number; exact: number }[] = [];
  const samples = Math.max(2, Math.floor(MAX_SAMPLES / Math.max(1, keys.length - 1)));
  if (x[0] < keys[0]!.time)
    paths.push([
      { time: x[0], value: evaluate(x[0]) },
      { time: keys[0]!.time, value: evaluate(keys[0]!.time) },
    ]);
  for (let index = 0; index < keys.length - 1; index++) {
    const left = keys[index]!;
    const right = keys[index + 1]!;
    const stepped = !Number.isFinite(left.outTangent) || !Number.isFinite(right.inTangent);
    const path: CurvePreviewPoint[] = [];
    for (let sample = 0; sample <= samples; sample++) {
      const fraction = sample / samples;
      let time = left.time * (1 - fraction) + right.time * fraction;
      // Sample the actual runtime on each side. In particular, an interior key after a
      // step belongs to the previous segment at that exact time. Separate exact markers
      // below retain that behavior without a diagonal line across the jump.
      if (sample === 0 && index > 0) time = nextFloat(left.time, true);
      if (sample === samples) time = nextFloat(right.time, false);
      if (time < left.time || time >= right.time || (index > 0 && time <= left.time)) continue;
      path.push({ time, value: evaluate(time) });
    }
    paths.push(path);
    if (stepped) {
      const before = evaluate(nextFloat(right.time, false));
      const after = evaluate(nextFloat(right.time, true));
      if (before !== after)
        jumps.push({ time: right.time, left: before, right: after, exact: evaluate(right.time) });
    }
  }
  if (keys.at(-1)!.time < x[1])
    paths.push([
      { time: keys.at(-1)!.time, value: evaluate(keys.at(-1)!.time) },
      { time: x[1], value: evaluate(x[1]) },
    ]);
  const exactKeys = keys.map(key => ({ time: key.time, value: evaluate(key.time) }));
  const values = [...paths.flat(), ...exactKeys].map(point => point.value);
  values.push(...jumps.flatMap(jump => [jump.left, jump.right]));
  if (values.some(value => !Number.isFinite(value))) throw new Error('timeScaleCurve.previewRange');
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 0.5;
    max += 0.5;
  }
  if (!Number.isFinite(max - min) || max === min) throw new Error('timeScaleCurve.previewRange');
  return { paths, keys: exactKeys, jumps, x, y: [min, max] };
}

/** Adjacent IEEE-754 time, avoiding an arbitrary epsilon or changing user key times. */
function nextFloat(value: number, up: boolean): number {
  if (value === 0) return up ? Number.MIN_VALUE : -Number.MIN_VALUE;
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);
  const bits = view.getBigUint64(0);
  view.setBigUint64(0, value > 0 === up ? bits + 1n : bits - 1n);
  return view.getFloat64(0);
}
