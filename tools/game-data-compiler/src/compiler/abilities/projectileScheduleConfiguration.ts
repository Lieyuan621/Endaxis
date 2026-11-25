import type { ProjectileLaunchSchedule } from '../../../../../packages/game-data-contract/src/projectileSchedule.ts';

export interface ProjectileScheduleConfiguration {
  readonly schedule: ProjectileLaunchSchedule;
}

/** 当前资源版本的定位键，不是写入用户存档的稳定发射 ID。 */
export function projectileLaunchSourceKey(resourceId: string, serverActionIndex: number): string {
  if (!resourceId.trim() || !Number.isSafeInteger(serverActionIndex) || serverActionIndex < 0)
    throw new Error(`Invalid projectile launch identity: ${resourceId}/${serverActionIndex}`);
  return `${resourceId}:${serverActionIndex}`;
}

export function resolveProjectileScheduleConfiguration(
  configurations: ReadonlyMap<string, ProjectileScheduleConfiguration>,
  sourceKey: string,
): ProjectileLaunchSchedule {
  const configuration = configurations.get(sourceKey);
  if (!configuration) throw new Error(`Missing projectile callback schedule: ${sourceKey}`);
  const { schedule } = configuration;
  if (!Number.isSafeInteger(schedule.endFrame) || schedule.endFrame < 0)
    throw new Error(`Invalid projectile endFrame: ${sourceKey}`);
  const events = new Set<string>();
  for (const callback of schedule.callbacks) {
    if (events.has(callback.event))
      throw new Error(`Duplicate projectile callback event: ${sourceKey}/${callback.event}`);
    events.add(callback.event);
    let previous = -1;
    for (const frame of callback.triggerFrames) {
      if (
        !Number.isSafeInteger(frame) ||
        frame < 0 ||
        frame <= previous ||
        frame > schedule.endFrame
      )
        throw new Error(`Invalid projectile trigger frame: ${sourceKey}/${callback.event}/${frame}`);
      previous = frame;
    }
  }
  return schedule;
}
