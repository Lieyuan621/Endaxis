/** Clamped Hermite/weighted Bezier keys; no game resources or lifecycle state. */
export interface SpeedCurveKey {
  time: number;
  value: number;
  inTangent: number;
  outTangent: number;
  weightedMode?: number;
  inWeight?: number;
  outWeight?: number;
}

export function createCurveEvaluator(curve: readonly SpeedCurveKey[]): (time: number) => number {
  if (!curve.length) throw new Error('Expected at least one curve key');
  for (const [index, key] of curve.entries()) {
    const mode = key.weightedMode ?? 0;
    const validWeight = (weight: number | undefined) =>
      weight !== undefined && Number.isFinite(weight) && weight >= 0 && weight <= 1;
    if (
      ![key.time, key.value].every(Number.isFinite) ||
      ![key.inTangent, key.outTangent].every(
        value => typeof value === 'number' && !Number.isNaN(value),
      ) ||
      !Number.isInteger(mode) ||
      mode < 0 ||
      mode > 3 ||
      ((mode & 1) !== 0 && !validWeight(key.inWeight)) ||
      ((mode & 2) !== 0 && !validWeight(key.outWeight)) ||
      (index > 0 && key.time <= curve[index - 1]!.time)
    )
      throw new Error('Expected ordered curve keys with valid enabled weights');
  }
  return (time: number) => {
    if (!Number.isFinite(time)) throw new Error('Expected finite curve time');
    if (time <= curve[0]!.time) return curve[0]!.value;
    const next = curve.findIndex(key => key.time > time);
    if (next < 0) return curve[curve.length - 1]!.value;
    const a = curve[next - 1]!,
      b = curve[next]!;
    if (!Number.isFinite(a.outTangent) || !Number.isFinite(b.inTangent)) return a.value;
    const width = b.time - a.time,
      t = (time - a.time) / width;
    if ((a.weightedMode ?? 0) & 2 || (b.weightedMode ?? 0) & 1) {
      const outWeight = (a.weightedMode ?? 0) & 2 ? a.outWeight! : 1 / 3;
      const inWeight = (b.weightedMode ?? 0) & 1 ? b.inWeight! : 1 / 3;
      const cubic = (p0: number, p1: number, p2: number, p3: number, u: number) =>
        (1 - u) ** 3 * p0 + 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u ** 2 * p2 + u ** 3 * p3;
      // The Bezier parameter is not normalized time when handles are weighted.
      let low = 0,
        high = 1;
      for (let i = 0; i < 48; i++) {
        const u = (low + high) / 2;
        if (cubic(0, outWeight, 1 - inWeight, 1, u) < t) low = u;
        else high = u;
      }
      return cubic(
        a.value,
        a.value + outWeight * width * a.outTangent,
        b.value - inWeight * width * b.inTangent,
        b.value,
        (low + high) / 2,
      );
    }
    return (
      (2 * t ** 3 - 3 * t ** 2 + 1) * a.value +
      (t ** 3 - 2 * t ** 2 + t) * width * a.outTangent +
      (-2 * t ** 3 + 3 * t ** 2) * b.value +
      (t ** 3 - t ** 2) * width * b.inTangent
    );
  };
}

export function timeForTravelDistance(input: {
  distance: number;
  speed: number;
  curve: readonly SpeedCurveKey[];
  curveTimeScaleSeconds: number;
  maxSeconds: number;
  stepSeconds?: number;
}): number | undefined {
  const { distance, speed, curve, curveTimeScaleSeconds, maxSeconds } = input;
  const step = input.stepSeconds ?? 1 / 3000;
  if (
    ![distance, speed, curveTimeScaleSeconds, maxSeconds, step].every(Number.isFinite) ||
    distance < 0 ||
    speed < 0 ||
    curveTimeScaleSeconds <= 0 ||
    maxSeconds < 0 ||
    step <= 0 ||
    curve.length === 0
  )
    throw new Error('Invalid speed curve calculation input');
  const evaluate = createCurveEvaluator(curve);
  if (distance === 0) return 0;
  const velocity = (seconds: number) => speed * evaluate(seconds / curveTimeScaleSeconds);
  const integral = (start: number, end: number) => {
    const boundaries = [
      start,
      ...curve
        .map(key => key.time * curveTimeScaleSeconds)
        .filter(time => time > start && time < end),
      end,
    ];
    let total = 0;
    for (let index = 1; index < boundaries.length; index++) {
      const a = boundaries[index - 1]!,
        b = boundaries[index]!,
        mid = (a + b) / 2;
      const next = curve.findIndex(key => key.time > mid / curveTimeScaleSeconds);
      const stepped =
        next > 0 &&
        (!Number.isFinite(curve[next - 1]!.outTangent) || !Number.isFinite(curve[next]!.inTangent));
      total += stepped
        ? (b - a) * velocity(mid)
        : ((b - a) * (velocity(a) + 4 * velocity(mid) + velocity(b))) / 6;
    }
    return total;
  };
  let travelled = 0;
  for (let start = 0; start < maxSeconds;) {
    const end = Math.min(start + step, maxSeconds);
    const delta = integral(start, end);
    if (travelled + delta >= distance) {
      let low = start,
        high = end;
      for (let i = 0; i < 40; i++) {
        const mid = (low + high) / 2;
        if (travelled + integral(start, mid) >= distance) high = mid;
        else low = mid;
      }
      return (low + high) / 2;
    }
    travelled += delta;
    start = end;
  }
  return undefined;
}
