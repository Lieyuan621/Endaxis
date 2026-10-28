import type { ProjectileLaunchSchedule } from '../../../../packages/game-data-contract/src/projectileSchedule';

/** 发射时固定时间表；后续黑板写入和恢复都不重新求值。 */
export function resolveProjectileSchedule<Input>(
  schedule: ProjectileLaunchSchedule<Input>,
  resolve: (input: Input) => number,
): ProjectileLaunchSchedule {
  const frame = (input: Input): number => {
    const value = resolve(input);
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error('projectile callback time must be a non-negative integer frame');
    return value;
  };
  const callbacks = schedule.callbacks.map(callback => {
    const triggerFrames = callback.triggerFrames.map(frame);
    if (triggerFrames.some((value, index) => index > 0 && value <= triggerFrames[index - 1]!))
      throw new Error(`projectile ${callback.event} callback frames must be strictly increasing`);
    return { ...callback, triggerFrames };
  });
  const endFrame = frame(schedule.endFrame);
  if (callbacks.some(callback => callback.triggerFrames.some(value => value > endFrame)))
    throw new Error('projectile end frame precedes a scheduled callback');
  return { ...schedule, callbacks, endFrame };
}
