import { createKillEvent } from './killEventTestFixture';
import type { AbilityEventPayloadMap } from './combatAbilityEvent';
import { AbilityEventDispatcher } from './abilityEventDispatcher';
import {
  CombatSemanticEventRuntime,
  type RegisterCombatAbilityEvent,
} from './combatSemanticEventRuntime';

/** 测试也使用真实公共分发器，不能通过旧语义 emit 绕过原生发布阶段。 */
export function createNativeEventFixture() {
  const dispatcher = new AbilityEventDispatcher<
    keyof AbilityEventPayloadMap,
    AbilityEventPayloadMap
  >();
  const register: RegisterCombatAbilityEvent = (_owner, _scope, name, phase, priority, handle) => {
    if (phase === 'callback') return dispatcher.registerCallback(name, handle);
    if (phase === 'dataAction') return dispatcher.registerAction(name, priority, handle);
    return dispatcher.registerListener(name, phase, handle);
  };
  const semanticEvents = new CombatSemanticEventRuntime(register);
  const emitAddedBuff = (payload: AbilityEventPayloadMap['addedBuff']) =>
    dispatcher.dispatch({ event: 'addedBuff', payload }, []);
  const emitConsumedBuff = (payload: AbilityEventPayloadMap['buffConsumed']) =>
    dispatcher.dispatch({ event: 'buffConsumed', payload }, []);
  const emitOutputDamage = (payload: Partial<AbilityEventPayloadMap['outputDamage']>) =>
    dispatcher.dispatch(
      { event: 'outputDamage', payload: { ...createKillEvent().payload, ...payload } },
      [],
    );
  return {
    dispatcher,
    register,
    semanticEvents,
    emitAddedBuff,
    emitConsumedBuff,
    emitOutputDamage,
  };
}
