/**
 * 把技能内联的 Unity AnimationCurve 编译成运行时函数。
 * 时间膨胀会使用带权关键帧，普通 Hermite 插值不能得到相同行为。
 */
import type {
  TimeScaleCurveDefinition,
  TimeScaleCurveKeyDefinition,
} from '../../game-data/operatorDefinition';
import type { TimeScaleCurve, TimeDilationRuntime } from './timeDilationRuntime';

const WEIGHTED_IN = 1;
const WEIGHTED_OUT = 2;
const DEFAULT_WEIGHT = 1 / 3;

export function resolveTimeScaleCurve(
  definition: TimeScaleCurveDefinition,
  runtime: TimeDilationRuntime,
): TimeScaleCurve {
  return definition.kind === 'named'
    ? runtime.resolveCurve(definition.key)
    : compileTimeScaleCurve(definition.keys);
}

export function compileTimeScaleCurve(
  keys: readonly TimeScaleCurveKeyDefinition[],
): TimeScaleCurve {
  validateKeys(keys);
  const stableKeys = keys.map(key => Object.freeze({ ...key }));
  return time => evaluateTimeScaleCurve(stableKeys, time);
}

export function evaluateTimeScaleCurve(
  keys: readonly TimeScaleCurveKeyDefinition[],
  time: number,
): number {
  if (keys.length === 0) throw new Error('time-scale curve contains no keys');
  if (time <= keys[0]!.time) return keys[0]!.value;
  if (time >= keys.at(-1)!.time) return keys.at(-1)!.value;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const left = keys[index]!;
    const right = keys[index + 1]!;
    if (time <= right.time) return evaluateSegment(left, right, time);
  }
  return keys.at(-1)!.value;
}

function evaluateSegment(
  left: TimeScaleCurveKeyDefinition,
  right: TimeScaleCurveKeyDefinition,
  time: number,
): number {
  // Unity uses infinite tangents for constant/stepped segments. The value changes only at the
  // following key; feeding Infinity into Bezier control points would instead produce NaN.
  if (!Number.isFinite(left.outTangent) || !Number.isFinite(right.inTangent)) return left.value;
  const duration = right.time - left.time;
  const outWeight = (left.weightedMode & WEIGHTED_OUT) !== 0 ? left.outWeight : DEFAULT_WEIGHT;
  const inWeight = (right.weightedMode & WEIGHTED_IN) !== 0 ? right.inWeight : DEFAULT_WEIGHT;
  const x1 = left.time + duration * outWeight;
  const y1 = left.value + duration * outWeight * left.outTangent;
  const x2 = right.time - duration * inWeight;
  const y2 = right.value - duration * inWeight * right.inTangent;
  const parameter = solveBezierParameter(left.time, x1, x2, right.time, time);
  return cubicBezier(left.value, y1, y2, right.value, parameter);
}

function solveBezierParameter(
  x0: number,
  x1: number,
  x2: number,
  x3: number,
  time: number,
): number {
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 32; iteration += 1) {
    const middle = (low + high) * 0.5;
    if (cubicBezier(x0, x1, x2, x3, middle) < time) low = middle;
    else high = middle;
  }
  return (low + high) * 0.5;
}

function cubicBezier(p0: number, p1: number, p2: number, p3: number, parameter: number): number {
  const inverse = 1 - parameter;
  return (
    inverse * inverse * inverse * p0 +
    3 * inverse * inverse * parameter * p1 +
    3 * inverse * parameter * parameter * p2 +
    parameter * parameter * parameter * p3
  );
}

function validateKeys(keys: readonly TimeScaleCurveKeyDefinition[]): void {
  if (keys.length === 0) throw new Error('time-scale curve contains no keys');
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index]!;
    for (const value of [key.time, key.value, key.inWeight, key.outWeight]) {
      if (!Number.isFinite(value)) throw new Error(`time-scale curve key ${index} is not finite`);
    }
    if (Number.isNaN(key.inTangent) || Number.isNaN(key.outTangent))
      throw new Error(`time-scale curve key ${index} has a NaN tangent`);
    if (!Number.isInteger(key.weightedMode) || key.weightedMode < 0 || key.weightedMode > 3) {
      throw new Error(`time-scale curve key ${index} has an invalid weighted mode`);
    }
    if (index > 0 && keys[index - 1]!.time >= key.time) {
      throw new Error('time-scale curve key times must be strictly increasing');
    }
  }
}
