import type { EnemyLifecycleDocument } from '../../../core/project/schema';

/** 存档事件 ID 不与界面的出生、死亡标记共享命名空间。 */
export function enemyPresenceMarkerKey(id: string): string {
  return `presence:${id}`;
}

/** 仅纵向避让同帧事件，不改变事件在时间轴上的横坐标。 */
export function layoutEnemyLifecycleMarkers(
  lifecycle: EnemyLifecycleDocument | undefined,
  defaultSpawnFrame: number,
  automaticDeath: boolean,
  actualDeathFrame?: number,
  iconSize = 28,
) {
  const spawnFrame = lifecycle?.spawnFrame ?? defaultSpawnFrame;
  const groups = new Map<number, string[]>();
  const add = (id: string, frame: number) => {
    const group = groups.get(frame) ?? [];
    group.push(id);
    groups.set(frame, group);
  };
  for (const event of lifecycle?.presenceChanges ?? [])
    add(enemyPresenceMarkerKey(event.id), event.frame);
  const deathFrame = lifecycle?.deathFrame;
  if (deathFrame !== undefined) add('death', deathFrame);
  if (automaticDeath && actualDeathFrame !== undefined && actualDeathFrame !== deathFrame)
    add('actualDeath', actualDeathFrame);

  const markers = new Map<string, { top: number; height: number }>();
  let height = iconSize + 2;
  for (const [frame, ids] of groups) {
    const belowAvatar = frame === spawnFrame;
    const markerHeight = belowAvatar ? iconSize / 2 : iconSize / ids.length;
    ids.forEach((id, index) => {
      const top = (belowAvatar ? iconSize + 2 : 1) + index * markerHeight;
      markers.set(id, { top, height: markerHeight });
      height = Math.max(height, top + markerHeight + 1);
    });
  }
  return { markers, height };
}
