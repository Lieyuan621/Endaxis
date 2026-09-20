import { describe, expect, it } from 'vitest';
import {
  hasAbilityEventActionContextBinding,
  resolveAbilityEventActionContextBinding,
} from './abilityEventActionContext';
import type { CombatAbilityEvent } from './combatAbilityEvent';
import type { AbilityEvent } from '../../../../packages/game-data-contract/src/abilityEvents';
import { CombatBuffContainer } from '../buffs/combatBuffs';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { createEventBuff } from './buffEventTestFixture';

describe('AbilityEvent action context binding', () => {
  it('泛型订阅保持名称与载荷关联，可以直接交给统一绑定入口', () => {
    const bind = <Name extends AbilityEvent>(event: CombatAbilityEvent<Name>) =>
      resolveAbilityEventActionContextBinding(event);
    expect(bind({ event: 'weaknessSet', payload: { sourceId: 'enemy' } })).toEqual({
      inputTargetId: 'enemy',
      triggerTargetId: null,
    });
  });
  const pair = { sourceId: 'operator', targetId: 'enemy' };
  const buffPayload = { ...pair, buffId: 'buff', buffTags: [] };
  it('输出阶段以接收者为InputTarget，以发布者为Trigger', () => {
    const events: CombatAbilityEvent[] = [
      { event: 'beforeOutputBuff', payload: buffPayload },
      { event: 'outputBuff', payload: { ...buffPayload, buff: createEventBuff() } },
      { event: 'outputCriticalDamage', payload: createDamagePayload(pair) },
      { event: 'beforeOutputPhysicalInfliction', payload: { ...pair, type: 'fracture' } },
      {
        event: 'outputHeal',
        payload: { ...pair, requestedHealing: 10, actualHealing: 0, overhealing: 10, tags: [] },
      },
    ];
    for (const event of events) {
      expect(hasAbilityEventActionContextBinding(event.event)).toBe(true);
      expect(resolveAbilityEventActionContextBinding(event)).toEqual({
        inputTargetId: 'enemy',
        triggerTargetId: 'operator',
      });
    }
  });
  it('接收阶段以来源为InputTarget，以承受者为Trigger', () => {
    const events: CombatAbilityEvent[] = [
      { event: 'beforeAddedBuff', payload: buffPayload },
      { event: 'addedBuff', payload: buffPayload },
      { event: 'takeCriticalDamage', payload: createDamagePayload(pair) },
      { event: 'beforeTakePhysicalInfliction', payload: { ...pair, type: 'fracture' } },
      { event: 'afterTakePhysicalInfliction', payload: { ...pair, type: 'fracture' } },
      { event: 'poiseZero', payload: pair },
      { event: 'poiseKnotBreak', payload: pair },
    ];
    for (const event of events)
      expect(resolveAbilityEventActionContextBinding(event)).toEqual({
        inputTargetId: 'operator',
        triggerTargetId: 'enemy',
      });
  });
  it('消费与吸收绑定真实Buff所属者，不借监听者', () => {
    const container = new CombatBuffContainer('enemy', new CombatAttributeSet());
    const buff = container.add({ id: 'buff', stackingType: 'unlimited' }, 'operator')!;
    for (const event of ['buffConsumed', 'buffAbsorbed'] as const) {
      expect(
        resolveAbilityEventActionContextBinding({
          event,
          payload: { ...buffPayload, buff, layers: 1, sourceId: 'camille' },
        }),
      ).toEqual({ inputTargetId: 'enemy', triggerTargetId: 'camille' });
    }
  });
  it('无目标弱点设置不补Trigger，未审计事件不补绑定', () => {
    expect(
      resolveAbilityEventActionContextBinding({
        event: 'weaknessSet',
        payload: { sourceId: 'enemy' },
      }),
    ).toEqual({ inputTargetId: 'enemy', triggerTargetId: null });
    expect(
      resolveAbilityEventActionContextBinding({
        event: 'afterAddedShield',
        payload: { ...pair, gainedValue: 10, currentValue: 10 },
      }),
    ).toBeUndefined();
    if (false) {
      // @ts-expect-error 事件名和载荷不可拆开传递。
      resolveAbilityEventActionContextBinding('outputBuff', buffPayload);
      // @ts-expect-error 缺少目标的Buff事件不是合法的内部事件。
      resolveAbilityEventActionContextBinding({
        event: 'outputBuff',
        payload: { sourceId: 'operator', buffId: 'buff', buffTags: [] },
      });
    }
  });
});

function createDamagePayload(pair: { readonly sourceId: string; readonly targetId: string }) {
  return {
    ...pair,
    damageType: 'physical' as const,
    tags: [],
    features: [],
    result: {
      value: 1,
      isCritical: true,
      criticalMultiplier: 1.5,
      defenseMultiplier: 1,
      resistanceMultiplier: 1,
      weaknessShelterMultiplier: 1,
      runtimeExtensionMultiplier: 1,
      igniteMultiplier: 1,
      physicalInflictionMultiplier: 1,
    },
  };
}
