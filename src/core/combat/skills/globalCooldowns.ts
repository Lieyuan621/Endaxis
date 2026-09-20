import { VALIDITY_TOLERANCE_SECONDS, type TimedMarkerClock } from '../status/timedMarkers';
import type { GlobalCooldownState } from '../state/environmentState';

export function advanceGlobalCooldowns(state: GlobalCooldownState, time: number): void {
  if (state.lastTick === time) return;
  state.lastTick = time;
  for (const [characterId, markers] of state.entries) {
    for (const [id, expiresAt] of markers) {
      if (expiresAt - time < -VALIDITY_TOLERANCE_SECONDS) markers.delete(id);
    }
    if (!markers.size) state.entries.delete(characterId);
  }
}

/** BattleManager.GlobalTimedMarker 的排轴投影。独立命名空间，按角色/ID 刷新，不创建重复实例。 */
export class GlobalCooldowns {
  constructor(
    readonly clock: TimedMarkerClock,
    readonly runtimeState: GlobalCooldownState = { entries: new Map(), lastTick: clock.time },
  ) {}

  set(characterId: string, markerId: string, durationSeconds: number): void {
    if (!characterId || !markerId)
      throw new TypeError('global cooldown requires character and marker IDs');
    if (!Number.isFinite(durationSeconds))
      throw new TypeError('global cooldown duration must be finite');
    this.#tick();
    const markers = this.runtimeState.entries.get(characterId) ?? new Map<string, number>();
    markers.set(markerId, this.clock.time + durationSeconds);
    this.runtimeState.entries.set(characterId, markers);
  }

  has(characterId: string, markerId: string): boolean {
    this.#tick();
    return this.runtimeState.entries.get(characterId)?.has(markerId) ?? false;
  }

  /** 与现有确定性帧时钟对齐；新加的零时长项在同帧仍存在，下次推进时才清理。 */
  #tick(): void {
    advanceGlobalCooldowns(this.runtimeState, this.clock.time);
  }
}
