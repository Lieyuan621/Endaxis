import {
  ABILITY_EVENT_ACTION_CONTEXT_BINDINGS,
  ACTION_CONTEXT_BOUND_ABILITY_EVENTS,
  type AbilityEvent,
  type ActionContextBoundAbilityEvent,
} from '../../../../packages/game-data-contract/src/abilityEvents';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import {
  abilityEventSourceId,
  abilityEventTargetId,
  type CombatAbilityEvent,
} from './combatAbilityEvent';

export { ACTION_CONTEXT_BOUND_ABILITY_EVENTS };

/** AbilityEvent 回调进入动作序列时恢复出的公共原生动作目标。 */
export interface AbilityEventRuntimeActionContext {
  readonly inputTarget: RuntimeTargetRef;
  readonly triggerTarget: RuntimeTargetRef | null;
}

export function hasAbilityEventActionContextBinding(
  event: AbilityEvent,
): event is ActionContextBoundAbilityEvent {
  return (ACTION_CONTEXT_BOUND_ABILITY_EVENTS as readonly AbilityEvent[]).includes(event);
}

/**
 * 把公共事件负载恢复成原生动作环境的 InputTarget 与发布者（Trigger）。
 * 输出 Buff/附着事件发布在施加方上，其余已审计事件发布在承受者上。
 */
export function resolveAbilityEventActionContextBinding(
  event: CombatAbilityEvent,
): { readonly inputTargetId: string; readonly triggerTargetId: string | null } | undefined {
  if (!hasAbilityEventActionContextBinding(event.event)) return undefined;
  const binding = ABILITY_EVENT_ACTION_CONTEXT_BINDINGS[event.event];
  // 只要求绑定实际读取的端点；无目标事件不应为了满足通用接口伪造 targetId。
  const endpoint = (name: 'eventSource' | 'eventTarget'): string => {
    const value =
      name === 'eventSource' ? abilityEventSourceId(event) : abilityEventTargetId(event);
    if (value === undefined)
      throw new Error(`${event.event} has no ${name} required by action-context metadata`);
    return value;
  };
  return {
    inputTargetId: endpoint(binding.inputTarget),
    triggerTargetId: binding.triggerTarget === null ? null : endpoint(binding.triggerTarget),
  };
}
