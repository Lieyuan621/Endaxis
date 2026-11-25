import type { ProjectileLaunchSchedule } from '../../../../packages/game-data-contract/src/projectileSchedule';

/** 游标随切面保存，恢复后不能重新执行已经触发的回调。 */
export interface ProjectileScheduleState {
  readonly definition: ProjectileLaunchSchedule;
  elapsedFrames: number;
  readonly nextTriggerIndices: number[];
}

export function createProjectileScheduleState(
  definition: ProjectileLaunchSchedule,
): ProjectileScheduleState {
  return { definition, elapsedFrames: 0, nextTriggerIndices: definition.callbacks.map(() => 0) };
}
