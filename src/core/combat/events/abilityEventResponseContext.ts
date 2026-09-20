import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import type { CombatOperationContext } from '../skills/skillRuntime';
import type { AbilityResponseEventName } from '../state/foundationState';
import type { AbilityEventRuntimeActionContext } from './abilityEventActionContext';
import type { CombatAbilityEvent } from './combatAbilityEvent';
import { abilityEventSkillCastInfo } from './combatAbilityEvent';
import type { CombatSemanticEventContext } from './combatSemanticEventRuntime';

/**
 * 同步事件响应唯一的临时上下文边界；宿主仍拥有黑板、序列和注册生命周期。
 * 嵌套通知和异常均恢复外层事件与 Trigger，不清空宿主保存的其他目标组。
 * 此处接收内部生产的强类型事件，不是 JSON 输入校验器，也不重新识别事件类别。
 */
export function withAbilityEventResponseContext<T>(
  context: { -readonly [Key in keyof CombatOperationContext]: CombatOperationContext[Key] },
  published: CombatAbilityEvent<AbilityResponseEventName>,
  targets: AbilityEventRuntimeActionContext | undefined,
  execute: () => T,
): T {
  return withEventContext(context, published, targets, execute);
}

/** 旧定义仅保留触发器筛选；原生响应仍进入同一上下文边界，手工标记不补造目标绑定。 */
export function withCombatEventResponseContext<T>(
  context: { -readonly [Key in keyof CombatOperationContext]: CombatOperationContext[Key] },
  response: CombatSemanticEventContext,
  execute: () => T,
): T {
  if ('event' in response.event)
    return withAbilityEventResponseContext(
      context,
      response.event,
      response.actionContext,
      execute,
    );
  return withEventContext(context, response.event, undefined, execute);
}

function withEventContext<T>(
  context: { -readonly [Key in keyof CombatOperationContext]: CombatOperationContext[Key] },
  event: NonNullable<CombatOperationContext['event']>,
  targets: AbilityEventRuntimeActionContext | undefined,
  execute: () => T,
): T {
  const skillCastInfo = 'payload' in event ? abilityEventSkillCastInfo(event) : undefined;
  const previous = {
    event: context.event,
    eventSkillCastInfo: context.eventSkillCastInfo,
    targetContext: context.targetContext,
    actionInputTarget: context.actionInputTarget,
  };
  const targetContext = context.targetContext ?? new RuntimeTargetContext();
  const trigger = targetContext.getOptional('trigger');
  try {
    context.event = event;
    // 原生只读取栈顶事件；新事件未提供来源时不能继承外层事件的来源。
    context.eventSkillCastInfo = skillCastInfo;
    context.actionInputTarget = targets?.inputTarget;
    context.targetContext = targetContext;
    if (targets?.triggerTarget != null) targetContext.setSingle('trigger', targets.triggerTarget);
    else targetContext.remove('trigger');
    return execute();
  } finally {
    if (trigger === undefined) targetContext.remove('trigger');
    else targetContext.set('trigger', trigger);
    Object.assign(context, previous);
  }
}
