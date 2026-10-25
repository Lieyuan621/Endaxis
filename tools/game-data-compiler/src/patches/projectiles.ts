import { readFileSync } from 'node:fs';
import type { ProjectileRuntimeSource } from '../source/projectileRuntime.ts';

interface ProjectileResourcePatch {
  readonly skipEnemyCollision?: boolean;
  readonly collisionRadiusMeters?: { readonly expected: number; readonly replacement: number };
  readonly reason: string;
}

const patches: Readonly<Record<string, ProjectileResourcePatch>> = JSON.parse(
  readFileSync(new URL('../../config/projectiles.json', import.meta.url), 'utf8'),
);

export interface ProjectilePatchRecord {
  readonly resourceId: string;
  readonly reason: string;
  readonly changes: ProjectileResourcePatch;
}

export function projectileResourcePatch(id: string): ProjectileResourcePatch | undefined {
  return patches[id];
}

/** 仅修改解析后的工作副本；原始导出与原生证据保持不变。 */
export function applyProjectileResourcePatch(
  source: ProjectileRuntimeSource,
): ProjectileRuntimeSource {
  const patch = projectileResourcePatch(source.projectileId);
  const radius = patch?.collisionRadiusMeters;
  if (!radius) return source;
  const shape = source.colliderShape;
  const movement = source.moveModes.get('Default');
  if (
    source.useSegmentMove ||
    source.moveModes.size !== 1 ||
    movement?.moveType !== 0 ||
    !shape ||
    shape.shapeType !== 1 ||
    shape.radius !== radius.expected ||
    shape.center.some(value => value !== 0) ||
    source.hitOnReach ||
    source.allowHitSameTarget ||
    !source.finishOnReach ||
    source.keepMoveOnReach ||
    source.maxHitCount !== -1 ||
    source.targetFilter.autoSetTargetFaction !== true ||
    source.targetFilter.factionTarget !== 1
  )
    throw new Error(
      `ProjectileData.${source.projectileId}: collision radius patch expected an unchanged recall projectile`,
    );
  if (!Number.isFinite(radius.replacement) || radius.replacement <= 0)
    throw new Error(`ProjectileData.${source.projectileId}: invalid collision radius patch`);
  return { ...source, colliderShape: { ...shape, radius: radius.replacement } };
}
