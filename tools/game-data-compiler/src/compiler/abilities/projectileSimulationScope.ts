import { projectileResourcePatch } from '../../patches/projectiles.ts';
import type { ProjectileRuntimeSource } from '../../source/projectileRuntime.ts';
import { isFixedGoodCharacterTargetFilter } from './projectileCollisionProjection.ts';

/** 只改变生成后的模拟范围；原生资源、到达命中和友方碰撞不受影响。 */
export function omitsProjectileEnemyCollision(
  projectileId: string,
  runtime: ProjectileRuntimeSource,
): boolean {
  return (
    projectileResourcePatch(projectileId)?.skipEnemyCollision === true &&
    !runtime.hitOnReach &&
    !isFixedGoodCharacterTargetFilter(runtime.targetFilter)
  );
}
