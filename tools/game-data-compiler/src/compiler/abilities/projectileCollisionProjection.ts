import type {
  ProjectileFlightTemplateDefinition,
  ProjectilePointDefinition,
} from '../../../../../packages/game-data-contract/src/projectiles.ts';
import type { ProjectileRuntimeSource } from '../../source/projectileRuntime.ts';

/** 原生碰撞形状保留尺寸；固定场景只将角色碰撞体简化为端点。 */
export function projectProjectileCollisionSource(
  source: ProjectileRuntimeSource,
  target: Extract<ProjectilePointDefinition, { side: string }>,
  path: string,
): ProjectileFlightTemplateDefinition['collision'] {
  if (source.hitOnReach || isEmptyProjectileCollisionPopulation(source.targetFilter))
    return undefined;
  const shape = source.colliderShape;
  if (!shape || shape.shapeType === 0) return undefined;
  const constant = (value: number) => ({ kind: 'constant' as const, value });
  if (shape.shapeType === 2)
    return {
      kind: 'box',
      target,
      centerMeters: [
        constant(shape.center[0]),
        constant(shape.center[1]),
        constant(shape.center[2]),
      ],
      halfExtentsMeters: [
        constant(shape.extent[0]),
        constant(shape.extent[1]),
        constant(shape.extent[2]),
      ],
    };
  if (shape.center.some(value => value !== 0))
    throw new Error(`${path}: non-box projectile collision center requires projection`);
  if (shape.shapeType === 1)
    return { kind: 'sphere', target, radiusMeters: constant(shape.radius) };
  if (shape.shapeType === 3 && shape.ring) {
    const ring = shape.ring;
    if (ring.isSector && ring.sectorAngle < 360)
      throw new Error(`${path}: sector projectile collision requires orientation projection`);
    return {
      kind: 'ring',
      target,
      innerRadiusMeters: constant(ring.initialInnerRadius),
      outerRadiusMeters: constant(ring.initialOuterRadius),
      innerRadiusSpeed: constant(ring.innerRadiusIncreaseSpeed),
      outerRadiusSpeed: constant(ring.outerRadiusIncreaseSpeed),
      heightMeters: constant(ring.height),
    };
  }
  throw new Error(`${path}: unsupported projectile collision shape ${shape.shapeType}`);
}

/** 手动阵营掩码为零时，原生 Filter 对任何实体都返回 false。 */
export function isEmptyProjectileCollisionPopulation(
  filter: ProjectileRuntimeSource['targetFilter'],
): boolean {
  return !filter.autoSetTargetFaction && filter.targetFactionType === 0;
}

export function isSupportedSingleEnemyOrGoodCharacterTargetFilter(
  filter: ProjectileRuntimeSource['targetFilter'],
): boolean {
  if (filter.factionTarget !== 1) return false;
  if (filter.autoSetTargetFaction) return !filter.filterObjectType;
  return isFixedGoodCharacterTargetFilter(filter);
}

export function isFixedGoodCharacterTargetFilter(
  filter: ProjectileRuntimeSource['targetFilter'],
): boolean {
  // FactionType.Good(4) + ObjectType.Character(8): Liino's expanding sound wave
  // invokes its hit callback once for every party operator in the all-range model.
  // Keep the masks exact so a different manual population cannot enter this fold.
  return (
    !filter.autoSetTargetFaction &&
    filter.targetFactionType === 4 &&
    filter.filterObjectType &&
    filter.objectType === 8
  );
}
