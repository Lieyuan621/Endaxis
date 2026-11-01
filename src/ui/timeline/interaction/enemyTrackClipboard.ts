import type { EnemyInstanceDocument, ScenarioDocument } from '../../../core/project/schema';
import type { TimelineDocumentIdAllocator } from './placeSkillGroup';

export interface EnemyTrackClipboard {
  enemy: EnemyInstanceDocument;
  switches: NonNullable<ScenarioDocument['battle']['enemyTargetSwitches']>;
}

/** 输入为文档快照；剪贴板不保存运行时对象。 */
export function copyEnemyTrack(
  enemy: EnemyInstanceDocument,
  switches: EnemyTrackClipboard['switches'],
): EnemyTrackClipboard {
  return structuredClone({
    enemy,
    switches: switches.filter(marker => marker.targetId === enemy.id),
  });
}

export function instantiateEnemyTrack(
  clipboard: EnemyTrackClipboard,
  ids: TimelineDocumentIdAllocator,
): EnemyTrackClipboard {
  const result = structuredClone(clipboard);
  result.enemy.id = ids.allocate('enemy');
  for (const marker of result.enemy.enemy.lifecycle?.presenceChanges ?? [])
    marker.id = ids.allocate('enemyPresence');
  for (const marker of result.switches) {
    marker.id = ids.allocate('enemyTarget');
    marker.targetId = result.enemy.id;
  }
  return result;
}
