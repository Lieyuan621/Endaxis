import { type BuffReference } from '../state/foundationState';
import type { BuffContainerState, BuffInstanceState } from '../state/instanceState';

/** 字符串键只用于索引，不承载解析规则；JSON 编码避免目标名称含分隔符时碰撞。 */
export function buffReferenceKey(reference: BuffReference): string {
  return JSON.stringify([reference.ownerId, reference.instanceId]);
}

/** 编号从 1 连续分配且不复用；已分配但已移出容器的实例是失效引用，不是新实例。 */
export function resolveBuffReferenceState<Key extends string>(
  state: BuffContainerState<Key>,
  reference: BuffReference,
): BuffInstanceState<Key> | undefined {
  const id = reference.instanceId;
  if (!Number.isSafeInteger(id) || id < 1 || id >= state.nextInstanceId) {
    throw new Error(`Buff reference '${buffReferenceKey(reference)}' was never allocated`);
  }
  const instance = state.instances.get(id);
  if (
    instance !== undefined &&
    (instance.identity.ownerId !== reference.ownerId || instance.identity.instanceId !== id)
  ) {
    throw new Error(`Buff reference '${buffReferenceKey(reference)}' has a different identity`);
  }
  return instance?.lifecycle.recycled === true ? undefined : instance;
}
