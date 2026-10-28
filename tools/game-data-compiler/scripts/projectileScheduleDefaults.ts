import { projectileSchedules } from '../config/projectileSchedules.ts';
import {
  projectileSchedulePresets,
  omittedCallbacklessProjectileIds,
} from '../config/projectileSchedulePresets.ts';
import type { ProjectileLaunchSchedule } from '../../../packages/game-data-contract/src/projectileSchedule.ts';
import {
  projectileLaunchSourceKey,
  resolveProjectileScheduleConfiguration,
} from '../src/compiler/abilities/projectileScheduleConfiguration.ts';
import type { ProjectileLaunchActionSource } from '../src/source/referenceActions.ts';

/** 可选时延覆盖；未配置时由投影器将启用回调设为发射当刻执行。 */
export function configuredProjectileSchedule(
  launch: Pick<ProjectileLaunchActionSource, 'projectileId' | 'serverActionIndex'>,
  sourcePath: string,
  events: readonly ProjectileLaunchSchedule['callbacks'][number]['event'][],
) {
  const resource = /(?:^|\.)(SkillData|BuffData)\.([^.]+)/.exec(sourcePath);
  const resourceId = resource?.[2];
  if (resourceId) {
    const key = projectileLaunchSourceKey(resourceId, launch.serverActionIndex);
    if (projectileSchedules.has(key))
      return resolveProjectileScheduleConfiguration(projectileSchedules, key);
  }
  const preset = projectileSchedulePresets[launch.projectileId];
  if (!preset) return undefined;
  const callbacks = events.map(event => {
    const triggerFrames = preset.callbacks[event];
    if (!triggerFrames)
      throw new Error(
        `${sourcePath}: missing configured projectile event ${launch.projectileId}/${event}`,
      );
    return { event, triggerFrames };
  });
  return {
    endFrame: preset.endFrame,
    callbacks,
  };
}

export function shouldOmitProjectileLaunch(
  launch: Pick<ProjectileLaunchActionSource, 'projectileId' | 'callbacks'>,
): boolean {
  return (
    omittedCallbacklessProjectileIds.has(launch.projectileId) &&
    !launch.callbacks.some(callback => callback.enabled)
  );
}
