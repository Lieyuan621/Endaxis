import { requireBoolean, requireExactFields, requireNumber, requireRecord } from './primitives.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import { readAdvancedDirectionType, readMountPoint } from './spatialEnums.ts';

export type Vector3Source = readonly [number, number, number];
export type QuaternionSource = readonly [number, number, number, number];

export interface AdvancedDirectionSource {
  readonly directionType: string;
  readonly sourceMountPoint: string;
  readonly targetMountPoint: string;
  readonly customSourceAndTarget: boolean;
  readonly clampToXZ: boolean;
  readonly invertDirection: boolean;
  /** 仅部分原生实例序列化这两个字段，不能从 customSourceAndTarget 反推其存在性。 */
  readonly source: TargetReferenceSource | null;
  readonly target: TargetReferenceSource | null;
}

export function parseVector3Source(value: unknown, path: string): Vector3Source {
  const vector = requireRecord(value, path);
  requireExactFields(vector, new Set(['x', 'y', 'z']), path);
  return [
    requireNumber(vector.x, `${path}.x`),
    requireNumber(vector.y, `${path}.y`),
    requireNumber(vector.z, `${path}.z`),
  ];
}

export function parseQuaternionSource(value: unknown, path: string): QuaternionSource {
  const quaternion = requireRecord(value, path);
  requireExactFields(quaternion, new Set(['x', 'y', 'z', 'w']), path);
  return [
    requireNumber(quaternion.x, `${path}.x`),
    requireNumber(quaternion.y, `${path}.y`),
    requireNumber(quaternion.z, `${path}.z`),
    requireNumber(quaternion.w, `${path}.w`),
  ];
}

export function parseAdvancedDirectionSource(
  value: unknown,
  path: string,
): AdvancedDirectionSource {
  const direction = requireRecord(value, path);
  const hasSource = 'source' in direction;
  const hasTarget = 'target' in direction;
  const fields = new Set([
    'directionType',
    'sourceMountPoint',
    'targetMountPoint',
    'customSourceAndTarget',
    'clampToXZ',
    'invertDirection',
  ]);
  if (hasSource) fields.add('source');
  if (hasTarget) fields.add('target');
  requireExactFields(direction, fields, path);
  const customSourceAndTarget = requireBoolean(
    direction.customSourceAndTarget,
    `${path}.customSourceAndTarget`,
  );
  // 未自定义时，VFS 的显式 null 与旧 JSON 的省略字段都表示没有覆盖引用。
  // 非空载荷照常解析；显式 undefined 不是合法序列化值，仍由严格解析器拒绝。
  const source =
    hasSource && direction.source !== null
      ? parseTargetReferenceSource(direction.source, `${path}.source`)
      : null;
  const target =
    hasTarget && direction.target !== null
      ? parseTargetReferenceSource(direction.target, `${path}.target`)
      : null;
  return {
    directionType: readAdvancedDirectionType(direction.directionType, `${path}.directionType`),
    sourceMountPoint: readMountPoint(direction.sourceMountPoint, `${path}.sourceMountPoint`),
    targetMountPoint: readMountPoint(direction.targetMountPoint, `${path}.targetMountPoint`),
    customSourceAndTarget,
    clampToXZ: requireBoolean(direction.clampToXZ, `${path}.clampToXZ`),
    invertDirection: requireBoolean(direction.invertDirection, `${path}.invertDirection`),
    source,
    target,
  };
}
