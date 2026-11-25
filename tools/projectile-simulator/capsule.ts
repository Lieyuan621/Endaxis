import type { Vector3 } from './simulate.ts';

/** Ray distance to a vertical capsule, for offline geometric calibration only. */
export function firstRayCapsuleEntry(input: {
  origin: Vector3;
  direction: Vector3;
  centerX: number;
  centerZ: number;
  bottomY: number;
  topY: number;
  radius: number;
}): number | undefined {
  const { origin, direction, centerX, centerZ, bottomY, topY, radius } = input;
  const length = Math.hypot(...direction);
  if (
    ![...origin, ...direction, centerX, centerZ, bottomY, topY, radius].every(Number.isFinite) ||
    length === 0 ||
    radius <= 0 ||
    bottomY > topY
  )
    throw new Error('Invalid ray or capsule');
  const [dx, dy, dz] = direction.map(v => v / length);
  const x = origin[0] - centerX,
    z = origin[2] - centerZ;
  const nearestY = Math.max(bottomY, Math.min(topY, origin[1]));
  if (x * x + z * z + (origin[1] - nearestY) ** 2 <= radius * radius) return 0;
  const candidates: number[] = [];
  const roots = (a: number, b: number, c: number) => {
    if (a === 0) return [];
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return [];
    const root = Math.sqrt(discriminant);
    return [(-b - root) / (2 * a), (-b + root) / (2 * a)].filter(t => t >= 0);
  };
  for (const t of roots(
    dx! ** 2 + dz! ** 2,
    2 * (x * dx! + z * dz!),
    x * x + z * z - radius * radius,
  )) {
    const y = origin[1] + dy! * t;
    if (y >= bottomY && y <= topY) candidates.push(t);
  }
  for (const capY of [bottomY, topY]) {
    const y = origin[1] - capY;
    for (const t of roots(
      1,
      2 * (x * dx! + y * dy! + z * dz!),
      x * x + y * y + z * z - radius * radius,
    )) {
      candidates.push(t);
    }
  }
  return candidates.length ? Math.min(...candidates) : undefined;
}
