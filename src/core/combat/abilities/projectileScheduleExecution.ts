import type { ProjectileScheduleState } from '../state/projectileScheduleState';

/** 使用已有实体时钟；这里只选择到期回调，正文仍由 CallbackSkillHost 执行。 */
export function advanceProjectileSchedule(
  state: ProjectileScheduleState,
  deltaSeconds: number,
  isActive: () => boolean,
  invoke: (callbackIndex: number) => void,
): void {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0)
    throw new RangeError('projectile schedule delta must be non-negative and finite');
  state.elapsedFrames += deltaSeconds * 30;
  while (isActive()) {
    let selected = -1;
    let selectedFrame = Infinity;
    for (let index = 0; index < state.definition.callbacks.length; index++) {
      const frame =
        state.definition.callbacks[index]!.triggerFrames[state.nextTriggerIndices[index]!];
      if (frame !== undefined && frame <= state.elapsedFrames && frame < selectedFrame) {
        selected = index;
        selectedFrame = frame;
      }
    }
    if (selected < 0) return;
    // 调用前推进游标，回调内销毁或建立切面都不会重放当前事件。
    state.nextTriggerIndices[selected]!++;
    invoke(selected);
  }
}
