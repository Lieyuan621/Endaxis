import type { EnemyLifecycleDocument } from '../../../core/project/schema';
import { enemyPresenceMarkerKey } from './enemyLifecycleMarkerLayout';

/** 切入/切出必须严格递增；出生和死亡可与切换同帧。拖动和数值编辑共用边界。 */
export function enemyLifecycleMarkerBounds(
  lifecycle: EnemyLifecycleDocument,
  markerId: string,
  initialFrame: number,
  endFrame: number,
): readonly [number, number] {
  if (markerId === 'spawn')
    return [
      initialFrame,
      Math.min(lifecycle.presenceChanges[0]?.frame ?? endFrame, lifecycle.deathFrame ?? endFrame),
    ];
  if (markerId === 'death') return [lifecycle.spawnFrame, endFrame];
  const index = lifecycle.presenceChanges.findIndex(
    change => enemyPresenceMarkerKey(change.id) === markerId,
  );
  return [
    index > 0 ? lifecycle.presenceChanges[index - 1]!.frame + 1 : lifecycle.spawnFrame,
    index + 1 < lifecycle.presenceChanges.length
      ? lifecycle.presenceChanges[index + 1]!.frame - 1
      : endFrame,
  ];
}
