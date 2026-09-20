/**
 * Ability 订阅与同步分发算法。状态由每次调用传入，宿主端口仅在这次调用中使用。
 * 各阶段分别取得遍历副本：本阶段新注册者等下次事件，尚未进入的阶段能看到新增注册。
 */
import type { AbilityEventPhase, AbilityEventState } from '../state/foundationState';

export function registerAbilityEvent<Event extends PropertyKey>(
  state: AbilityEventState<Event>,
  event: Event,
  phase: AbilityEventPhase,
  handlerId: number,
  priority = 0,
): number {
  if (!Number.isInteger(priority))
    throw new TypeError('ability event action priority must be an integer');
  const id = state.nextRegistrationId++;
  const registry = state.phases[phase];
  const entries = registry.get(event) ?? [];
  entries.push({ id, handlerId, priority });
  if (phase === 'action')
    entries.sort((left, right) => right.priority - left.priority || left.id - right.id);
  registry.set(event, entries);
  return id;
}

/** 注销由当前状态决定是否已经完成，不在返回句柄的闭包里另存 disposed。 */
export function unregisterAbilityEvent<Event extends PropertyKey>(
  state: AbilityEventState<Event>,
  event: Event,
  phase: AbilityEventPhase,
  registrationId: number,
): void {
  const registry = state.phases[phase];
  const entries = registry.get(event);
  if (entries === undefined) return;
  const index = entries.findIndex(entry => entry.id === registrationId);
  if (index < 0) return;
  entries.splice(index, 1);
  if (entries.length === 0) registry.delete(event);
}

export interface AbilityEventExecutionHost {
  /** 阶段开始时解析处理程序。即使随后注销，本阶段已选中的程序仍须执行。 */
  resolveHandler(handlerId: number): () => void;
  /** 原有 AbilitySystem 提供的即时技能监听者，位于已注册 skill 监听之后。 */
  dispatchSkills?(): void;
  /** 原有即时连携监听者，位于已注册 combo 监听之后。 */
  dispatchCombo?(): void;
}

export function dispatchAbilityEvent<Event extends PropertyKey>(
  state: AbilityEventState<Event>,
  event: Event,
  host: AbilityEventExecutionHost,
): void {
  const dispatchPhase = (phase: AbilityEventPhase) => {
    const handlers = (state.phases[phase].get(event) ?? []).map(entry =>
      host.resolveHandler(entry.handlerId),
    );
    for (const handle of handlers) handle();
  };
  dispatchPhase('callback');
  dispatchPhase('action');
  dispatchPhase('skill');
  host.dispatchSkills?.();
  dispatchPhase('combo');
  host.dispatchCombo?.();
}
