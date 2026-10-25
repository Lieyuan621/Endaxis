/** 固定朝向 +Z 下的 RandomPointFinder；输出转换到干员—敌人的 X 轴。 */
export function sampleRandomPointPositions(
  count: number,
  center: readonly [number, number, number],
  shape: 'circle' | 'sector',
  minimumRadius: number,
  radius: number,
  angleDegrees: number,
  rotationDegrees: readonly [number, number, number],
  sample: (minimum: number, maximum: number) => number,
): [number, number, number][] {
  if (!Number.isFinite(count) || !Number.isSafeInteger(Math.ceil(count)))
    throw new RangeError('random point count must be finite and safely representable');
  const points: [number, number, number][] = [];
  const f = Math.fround;
  const span = shape === 'circle' ? f(2 * Math.PI) : f(f(angleDegrees / 360) * f(2 * Math.PI));
  const start = shape === 'circle' ? 0 : f(f(90 - f(angleDegrees * 0.5)) * f(Math.PI / 180));
  const step = f(span / count);
  const [rx, ry, rz] = rotationDegrees.map(value => (value * Math.PI) / 180);
  const cx = Math.cos(rx!),
    sx = Math.sin(rx!);
  const cy = Math.cos(ry!),
    sy = Math.sin(ry!);
  const cz = Math.cos(rz!),
    sz = Math.sin(rz!);
  // 原生整数索引与浮点点数比较，正的小数点数不能向下截断。
  for (let index = 0; index < count; index++) {
    const angle = sample(f(f(index * step) + start), f(f((index + 1) * step) + start));
    const length = sample(minimumRadius, radius);
    const x = Math.cos(angle) * length,
      z = Math.sin(angle) * length;
    // Unity Euler 按 Z、X、Y 旋转；固定朝向下基准旋转为单位四元数。
    const xz = x * cz,
      yz = x * sz;
    const yx = yz * cx - z * sx,
      zx = yz * sx + z * cx;
    const xy = xz * cy + zx * sy,
      zy = -xz * sy + zx * cy;
    points.push([center[0] + zy, center[1] + yx, center[2] - xy]);
  }
  return points;
}
