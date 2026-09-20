/** 能力实体的死亡、延迟回收和寿命推进。实际清理子对象及发布通知由当前宿主执行。 */
import type { LogicalAbilityEntityFinishReason } from '../state/foundationState';
import type { LogicalAbilityEntityState } from '../state/instanceState';

/** 首次死亡时登记回收原因；死亡本身不移除目录中的实体。 */
export function killLogicalAbilityEntity(
  state: LogicalAbilityEntityState,
  reason: LogicalAbilityEntityFinishReason,
): boolean {
  if (!state.isAlive) return false;
  state.isAlive = false;
  state.pendingRelease = true;
  state.pendingReleaseElapsedSeconds = 0;
  state.pendingReleaseReason = reason;
  return true;
}

/** 返回是否已到回收时刻；调用方只在待回收分支使用。 */
export function advanceAbilityEntityRelease(
  state: LogicalAbilityEntityState,
  delta: number,
): boolean {
  requireDelta(delta, 'AbilityEntity release delta');
  state.pendingReleaseElapsedSeconds += delta;
  return (
    state.pendingReleaseElapsedSeconds >= (state.definition.deathReleaseDelaySeconds ?? 0) - 0.00001
  );
}

/** 先更新实体局部时间，再处理标记，最后扣减寿命；返回是否自然到期。 */
export function advanceAbilityEntityLifetime(
  state: LogicalAbilityEntityState,
  delta: number,
  sweepMarkers: () => void,
): boolean {
  requireDelta(delta, 'AbilityEntity delta');
  state.elapsedDurationSeconds += delta;
  sweepMarkers();
  if (state.remainingDurationSeconds === null) return false;
  state.remainingDurationSeconds = Math.max(0, state.remainingDurationSeconds - delta);
  return state.remainingDurationSeconds === 0;
}

function requireDelta(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite number`);
  }
}
