/** 容器计数与冷却推进，不持有 Buff 对象或生命周期回调。 */
import type { BuffContainerState } from '../state/instanceState';
import type { GameplayTag } from '../tags/gameplayTags';

export function addBuffEntityTags(state: BuffContainerState, tags: readonly GameplayTag[]): void {
  for (const tag of tags) state.entityTagCounts.set(tag, (state.entityTagCounts.get(tag) ?? 0) + 1);
}

export function removeBuffEntityTags(
  state: BuffContainerState,
  tags: readonly GameplayTag[],
): void {
  for (const tag of tags) {
    const next = (state.entityTagCounts.get(tag) ?? 0) - 1;
    if (next > 0) state.entityTagCounts.set(tag, next);
    else state.entityTagCounts.delete(tag);
  }
}

export function advanceBuffAddingCooldowns(state: BuffContainerState, deltaTime: number): void {
  if (!Number.isFinite(deltaTime)) throw new TypeError('buff delta time must be finite');
  for (const [buffId, values] of state.addingCooldowns) {
    const remaining = values
      .map(value => value - Math.max(0, deltaTime))
      .filter(value => value > 0.00001);
    if (remaining.length === 0) state.addingCooldowns.delete(buffId);
    else state.addingCooldowns.set(buffId, remaining);
  }
}
