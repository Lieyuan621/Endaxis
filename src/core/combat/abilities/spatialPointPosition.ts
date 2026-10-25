import type { SpatialPointOffsetDefinition } from '../../../../packages/game-data-contract/src/conditions';

/** 原生先按朝向旋转，再施加配置四元数；最后换算到双方距离轴。 */
export function offsetSpatialPoint(
  center: readonly [number, number, number],
  local: readonly number[],
  offset: Pick<SpatialPointOffsetDefinition, 'rotation' | 'centerOnGround'> & {
    readonly facing: string | object;
  },
  direction?: readonly [number, number, number],
): [number, number, number] {
  let forwardX = 0,
    forwardZ = offset.facing === 'enemyToOperator' ? -1 : 1;
  if (typeof offset.facing === 'object') {
    if (!direction) throw new Error('spatial point facing requires resolved positions');
    const length = Math.hypot(direction[0], direction[2]);
    // 原生 Normalize 将近零方向置零，Unity LookRotation(0) 返回单位旋转。
    if (length > 1e-5) {
      forwardX = -direction[2] / length;
      forwardZ = direction[0] / length;
    }
  }
  let x = forwardZ * local[0]! + forwardX * local[2]!,
    y = local[1]!,
    z = -forwardX * local[0]! + forwardZ * local[2]!;
  if (offset.rotation) {
    const [qx, qy, qz, qw] = offset.rotation;
    const tx = 2 * (qy * z - qz * y);
    const ty = 2 * (qz * x - qx * z);
    const tz = 2 * (qx * y - qy * x);
    x += qw * tx + qy * tz - qz * ty;
    y += qw * ty + qz * tx - qx * tz;
    z += qw * tz + qx * ty - qy * tx;
  }
  return [center[0] + z, (offset.centerOnGround ? 0 : center[1]) + y, center[2] - x];
}

/** 使用同一查询入口解析方向两端，取原生目标视图中的首个位置。 */
export function spatialPointDirection<Query>(
  facing: string | { readonly source: Query; readonly target: Query; readonly invert: boolean },
  resolve: (query: Query) => readonly [number, number, number],
): readonly [number, number, number] | undefined {
  if (typeof facing === 'string') return undefined;
  const source = resolve(facing.source),
    target = resolve(facing.target);
  const sign = facing.invert ? -1 : 1;
  return [(target[0] - source[0]) * sign, 0, (target[2] - source[2]) * sign];
}
