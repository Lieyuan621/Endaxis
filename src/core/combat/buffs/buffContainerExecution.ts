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
  const delta = Math.max(0, deltaTime);
  for (const [stackingKey, values] of state.addingCooldowns) {
    // 冷却数组由容器独占；原地保留未到期项，避免每帧创建两份数组。
    let count = 0;
    for (const value of values) {
      const remaining = value - delta;
      if (remaining > 0.00001) values[count++] = remaining;
    }
    values.length = count;
    if (count === 0) state.addingCooldowns.delete(stackingKey);
  }
}
