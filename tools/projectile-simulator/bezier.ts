import type { Vector3 } from './simulate.ts';

/** Geometric calculator only: returns curve progress, not a game callback time. */
export function firstBezierSphereEntry(
  points: readonly [Vector3, Vector3, Vector3, Vector3],
  center: Vector3,
  radius: number,
  samples = 8192,
): number | undefined {
  if (
    ![...points.flat(), ...center, radius].every(Number.isFinite) ||
    radius <= 0 ||
    !Number.isInteger(samples) ||
    samples < 1
  )
    throw new Error('Invalid Bezier geometry');
  const squaredDistance = (t: number) => {
    const weights = [(1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3];
    return center.reduce((sum, coordinate, axis) => {
      const value = points.reduce(
        (total, point, index) => total + point[axis]! * weights[index]!,
        0,
      );
      return sum + (value - coordinate) ** 2;
    }, 0);
  };
  if (squaredDistance(0) <= radius ** 2) return 0;
  for (let index = 1; index <= samples; index++) {
    const progress = index / samples;
    if (squaredDistance(progress) > radius ** 2) continue;
    let low = (index - 1) / samples,
      high = progress;
    for (let iteration = 0; iteration < 40; iteration++) {
      const mid = (low + high) / 2;
      if (squaredDistance(mid) <= radius ** 2) high = mid;
      else low = mid;
    }
    return (low + high) / 2;
  }
  return undefined;
}

/** First progress at or below a horizontal plane; split at extrema to retain narrow crossings. */
export function firstBezierGroundEntry(
  heights: readonly [number, number, number, number],
  groundHeight: number,
): number | undefined {
  if (![...heights, groundHeight].every(Number.isFinite)) throw new Error('Invalid Bezier heights');
  const [p0, p1, p2, p3] = heights;
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 3 * p0 - 6 * p1 + 3 * p2;
  const c = -3 * p0 + 3 * p1;
  const value = (t: number) => ((a * t + b) * t + c) * t + p0 - groundHeight;
  if (value(0) <= 0) return 0;
  const extrema: number[] = [];
  if (a === 0) {
    if (b !== 0) extrema.push(-c / (2 * b));
  } else {
    const discriminant = 4 * b * b - 12 * a * c;
    if (discriminant >= 0) {
      extrema.push((-2 * b - Math.sqrt(discriminant)) / (6 * a));
      extrema.push((-2 * b + Math.sqrt(discriminant)) / (6 * a));
    }
  }
  const boundaries = [0, ...extrema.filter(t => t > 0 && t < 1).sort((x, y) => x - y), 1];
  for (let i = 1; i < boundaries.length; i++) {
    let low = boundaries[i - 1]!;
    let high = boundaries[i]!;
    if (value(high) > 0) continue;
    for (let iteration = 0; iteration < 48; iteration++) {
      const middle = (low + high) / 2;
      if (value(middle) <= 0) high = middle;
      else low = middle;
    }
    return high;
  }
  return undefined;
}
