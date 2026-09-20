import { createKillEvent } from './killEventTestFixture';
import { CombatBuffContainer } from '../buffs/combatBuffs';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { abilityEventSourceId, abilityEventTargetId } from './combatAbilityEvent';
import { expect, it } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import type { CombatOperationContext } from '../skills/skillRuntime';
import { withAbilityEventResponseContext } from './abilityEventResponseContext';
import { abilityEventSkillCastInfo } from './combatAbilityEvent';

const payload = {
  sourceId: 'owner',
  targetId: 'entity',
  entity: {
    instanceId: 1,
    onReset: () => {
      throw new Error('context projection must not subscribe to reset');
    },
  },
};

it.each(['beforeCastSkill', 'afterSkillApplyCost', 'skillEnd'] as const)(
  '%s 当前技能字段不能补造事件来源或零费用',
  event => {
    const published = {
      event,
      payload: {
        ...payload,
        skillId: 'current',
        skillType: 'battleSkill' as const,
        skillCastId: 9,
      },
    };
    const context: CombatOperationContext = {
      blackboard: new ActionBlackboard(),
      eventSkillCastInfo: null,
    };
    withAbilityEventResponseContext(context, published, undefined, () => {
      expect(context.event).toBe(published);
      expect(context.eventSkillCastInfo).toBeUndefined();
    });
    expect(context.eventSkillCastInfo).toBeNull();
  },
);

it('来源读取端口只接受强类型事件，不接受裸载荷或损坏来源', () => {
  if (false) {
    // @ts-expect-error 裸载荷不是事件；内部端口不再承担任意 JSON 解析。
    abilityEventSkillCastInfo({ sourceId: 'owner', targetId: 'enemy' });
    abilityEventSkillCastInfo({
      event: 'abilityEntityFinished',
      // @ts-expect-error 来源类型由统一载荷映射约束。
      payload: { ...payload, skillCastInfo: false },
    });
  }
  expect(abilityEventSkillCastInfo({ event: 'abilityEntityFinished', payload })).toBeUndefined();
});

it.each(['beforeOutputSpellBurst', 'beforeTakeSpellInfliction'] as const)(
  '%s 保留原始法术事件及明确空来源，缺省元素不补造',
  event => {
    const published = Object.freeze({
      event,
      payload: Object.freeze({ ...payload, burstType: 'Pulse', skillCastInfo: null }),
    });
    const context: CombatOperationContext = { blackboard: new ActionBlackboard() };
    withAbilityEventResponseContext(context, published, undefined, () => {
      expect(context.event).toBe(published);
      expect(context.eventSkillCastInfo).toBeNull();
      expect(abilityEventSkillCastInfo(published)).toBeNull();
      expect('element' in published.payload).toBe(false);
    });
    expect(context.event).toBeUndefined();
  },
);

it.each(['beforeCastSkill', 'afterSkillApplyCost', 'skillEnd'] as const)(
  '%s 保留当前施法身份、继承来源与原始挂载端口',
  event => {
    const attachBuffToCurrentSkill = () => {};
    const origin = {
      skillCastId: 1,
      originSkillId: 'origin',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 0,
    };
    const published = {
      event,
      payload: {
        ...payload,
        skillId: 'current',
        skillType: 'comboSkill' as const,
        skillCastId: 2,
        skillCastInfo: origin,
        ...(event === 'beforeCastSkill' ? { attachBuffToCurrentSkill } : {}),
      },
    };
    const context: CombatOperationContext = { blackboard: new ActionBlackboard() };
    withAbilityEventResponseContext(context, published, undefined, () => {
      expect(context.event).toBe(published);
      expect(context.eventSkillCastInfo).toBe(origin);
      expect(abilityEventSkillCastInfo(published)).toBe(origin);
      expect(published.payload.attachBuffToCurrentSkill).toBe(
        event === 'beforeCastSkill' ? attachBuffToCurrentSkill : undefined,
      );
    });
    expect(context.event).toBeUndefined();
  },
);

it.each([
  'enterFight',
  'ownerSwitchToCenter',
  'ownerSwitchToGuard',
  'ownerHpZero',
  'abilityEntitySpawned',
  'abilityEntityFinished',
] as const)('%s 生命周期响应保留同一对象与来源，异常后恢复宿主', event => {
  const published = Object.freeze({
    event,
    payload: Object.freeze({ ...payload, skillCastInfo: null }),
  });
  const context: CombatOperationContext = { blackboard: new ActionBlackboard() };
  expect(() =>
    withAbilityEventResponseContext(context, published, undefined, () => {
      expect(context.event).toBe(published);
      expect(context.eventSkillCastInfo).toBeNull();
      throw new Error('nested response failed');
    }),
  ).toThrow('nested response failed');
  expect(context.event).toBeUndefined();
  expect(context.eventSkillCastInfo).toBeUndefined();
  expect(context.targetContext).toBeUndefined();
});

it.each(['weaknessSet', 'afterOutputWeaknessTriggered', 'customAbilityEvent'] as const)(
  '%s 保留原始事件身份，不继承宿主施法来源',
  event => {
    const published = Object.freeze({
      event,
      payload: Object.freeze({ ...payload, eventName: 'named', eventParam: 2.5 }),
    });
    const context: CombatOperationContext = {
      blackboard: new ActionBlackboard(),
      eventSkillCastInfo: null,
    };
    withAbilityEventResponseContext(context, published, undefined, () => {
      expect(context.event).toBe(published);
      expect(context.eventSkillCastInfo).toBeUndefined();
    });
    expect(context.event).toBeUndefined();
    expect(context.eventSkillCastInfo).toBeNull();
  },
);

it.each(['poiseZero', 'poiseKnotBreak', 'afterAddedShield'] as const)(
  '%s 响应直接读取原事件，并恢复 Input/Trigger',
  event => {
    const published = {
      event,
      payload: { sourceId: 'owner', targetId: 'entity', gainedValue: 0, currentValue: 350 },
    };
    const context: CombatOperationContext = {
      blackboard: new ActionBlackboard(),
      eventSkillCastInfo: null,
    };
    const inputTarget = { kind: 'operator' as const, operatorId: 'owner' };
    const triggerTarget = { kind: 'enemy' as const };
    withAbilityEventResponseContext(context, published, { inputTarget, triggerTarget }, () => {
      expect(context.event).toBe(published);
      expect(context.actionInputTarget).toBe(inputTarget);
      expect(context.targetContext?.get('trigger')).toEqual([triggerTarget]);
      expect(context.eventSkillCastInfo).toBeUndefined();
    });
    expect(context.event).toBeUndefined();
    expect(context.actionInputTarget).toBeUndefined();
    expect(context.targetContext).toBeUndefined();
    expect(context.eventSkillCastInfo).toBeNull();
  },
);

it('Buff 层数变化直接消费原对象，不生成自身目标或继承外层施法来源', () => {
  const buff = new CombatBuffContainer<string>('owner', new CombatAttributeSet()).add(
    { id: 'buff', stackingType: 'enhance' },
    'source',
  )!;
  const published = Object.freeze({
    event: 'buffEnhanceChanged' as const,
    payload: Object.freeze({
      sourceId: 'owner',
      buffId: 'buff',
      buff,
      buffTags: [],
      layerCount: -2,
      reason: 'ignite' as const,
    }),
  });
  const context: CombatOperationContext = {
    blackboard: new ActionBlackboard(),
    eventSkillCastInfo: null,
  };
  withAbilityEventResponseContext(context, published, undefined, () => {
    expect(context.event).toBe(published);
    expect(context.eventSkillCastInfo).toBeUndefined();
    expect(abilityEventSourceId(published)).toBe('owner');
    expect(abilityEventTargetId(published)).toBeUndefined();
    expect(context.actionInputTarget).toBeUndefined();
    expect(context.targetContext?.getOptional('trigger')).toBeUndefined();
  });
  expect(context.eventSkillCastInfo).toBeNull();
});

it.each(['beforeOutputKnockDown', 'afterOutputKnockDown'] as const)(
  '%s 从原始载荷读取技能来源，不丢失明确空值',
  event => {
    const cast = {
      skillCastId: 7,
      originSkillId: 'skill',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 0,
    };
    for (const skillCastInfo of [cast, null, undefined]) {
      const published = { event, payload: { ...payload, fromAirborne: true, skillCastInfo } };
      expect(abilityEventSkillCastInfo(published)).toBe(skillCastInfo);
    }
  },
);

it.each([
  'beforeOutputInfliction',
  'beforeTakeInfliction',
  'afterOutputInfliction',
  'afterTakeInfliction',
] as const)('%s 保留附着原始对象、额外施加标记与来源', event => {
  const published = {
    event,
    payload: {
      sourceId: 'operator',
      targetId: 'enemy',
      skillId: 'skill',
      element: 'nature' as const,
      isExtra: true,
      skillCastInfo: null,
    },
  };
  const context: CombatOperationContext = { blackboard: new ActionBlackboard() };
  withAbilityEventResponseContext(context, published, undefined, () => {
    expect(context.event).toBe(published);
    expect(context.eventSkillCastInfo).toBeNull();
    expect(abilityEventSkillCastInfo(published)).toBeNull();
  });
});

it('技力响应保留原对象与来源，没有目标也不继承外层施法信息', () => {
  const published = {
    event: 'skillSpGained' as const,
    payload: {
      sourceOperatorId: 'operator',
      source: 'normalAttack' as const,
      gainKind: 'refund' as const,
      requestedAmount: 10,
      amount: 0,
    },
  };
  const context: CombatOperationContext = {
    blackboard: new ActionBlackboard(),
    eventSkillCastInfo: null,
  };
  withAbilityEventResponseContext(context, published, undefined, () => {
    expect(context.event).toBe(published);
    expect(context.eventSkillCastInfo).toBeUndefined();
    expect(abilityEventSourceId(published)).toBe('operator');
    expect(abilityEventTargetId(published)).toBeUndefined();
  });
  expect(context.eventSkillCastInfo).toBeNull();
});

it.each(['beforeOutputBuff', 'beforeAddedBuff', 'addedBuff', 'outputBuff'] as const)(
  '%s 整组复用原始发布对象，不压平施加阶段或丢失字段',
  event => {
    const published = Object.freeze({
      event,
      payload: Object.freeze({
        sourceId: 'owner',
        targetId: 'entity',
        buffId: 'buff:test',
        buffTags: [],
        skillCastInfo: null,
        isExtra: true,
        buff: createEventBuff(),
      }),
    });
    const context: CombatOperationContext = { blackboard: new ActionBlackboard() };
    expect(abilityEventSkillCastInfo(published)).toBeNull();
    withAbilityEventResponseContext(context, published, undefined, () => {
      expect(context.event).toBe(published);
      expect('kind' in context.event!).toBe(false);
      expect(context.eventSkillCastInfo).toBeNull();
    });
    expect(context.event).toBeUndefined();
  },
);

it.each(['finishedBuff', 'buffEndsEarly', 'buffConsumed', 'buffAbsorbed'] as const)(
  '%s 保留通知身份、结束原因和消费快照，不合并为另一事件',
  event => {
    const published = Object.freeze({
      event,
      payload: Object.freeze({
        sourceId: 'owner',
        targetId: 'enemy',
        buffId: 'buff:test',
        buffTags: [],
        reason: 'early' as const,
        layers: 3,
        blackboardValues: Object.freeze({ count: 7 }),
        buff: createEventBuff({ count: 7 }),
        skillCastInfo: null,
      }),
    });
    const context: CombatOperationContext = { blackboard: new ActionBlackboard() };
    withAbilityEventResponseContext(context, published, undefined, () => {
      expect(context.event).toBe(published);
      expect(context.eventSkillCastInfo).toBeNull();
      expect('kind' in context.event!).toBe(false);
    });
    expect(context.event).toBeUndefined();
  },
);

it('嵌套事件及异常恢复外层 Trigger、Input 与事件，保留宿主目标组和黑板', () => {
  const targetContext = new RuntimeTargetContext();
  const saved = { kind: 'abilityEntity' as const, instanceId: 1 };
  const outer = { kind: 'abilityEntity' as const, instanceId: 2 };
  const inner = { kind: 'abilityEntity' as const, instanceId: 3 };
  targetContext.setSingle('saved', saved);
  targetContext.setSingle('trigger', saved);
  const context: CombatOperationContext = {
    blackboard: new ActionBlackboard({ count: 0 }),
    targetContext,
    actionOwnerId: 'owner',
    actionSourceId: 'source',
  };
  withAbilityEventResponseContext(
    context,
    { event: 'abilityEntitySpawned', payload },
    { inputTarget: outer, triggerTarget: outer },
    () => {
      const event = context.event;
      expect(targetContext.get('trigger')).toEqual([outer]);
      expect(() =>
        withAbilityEventResponseContext(
          context,
          { event: 'abilityEntityFinished', payload },
          { inputTarget: inner, triggerTarget: inner },
          () => {
            expect(targetContext.get('trigger')).toEqual([inner]);
            context.blackboard.assignDynamic('count', 1);
            throw new Error('nested');
          },
        ),
      ).toThrow('nested');
      expect(context.event).toBe(event);
      expect(context.actionInputTarget).toBe(outer);
      expect(targetContext.get('trigger')).toEqual([outer]);
    },
  );
  expect(context.event).toBeUndefined();
  expect(context.actionInputTarget).toBeUndefined();
  expect(targetContext.get('trigger')).toEqual([saved]);
  expect(targetContext.get('saved')).toEqual([saved]);
  expect(context.blackboard.getNumber('count')).toBe(1);
  expect(context.actionSourceId).toBe('source');
});

it('无 Trigger 的事件不会读到上次触发目标，退出后恢复宿主目标', () => {
  const targetContext = new RuntimeTargetContext();
  const target = { kind: 'abilityEntity' as const, instanceId: 1 };
  targetContext.setSingle('trigger', target);
  const context: CombatOperationContext = { blackboard: new ActionBlackboard({}), targetContext };
  withAbilityEventResponseContext(
    context,
    { event: 'abilityEntityFinished', payload },
    { inputTarget: target, triggerTarget: null },
    () => {
      expect(targetContext.getOptional('trigger')).toBeUndefined();
    },
  );
  expect(targetContext.get('trigger')).toEqual([target]);
});

it('读取来源抛错时不改动宿主上下文', () => {
  const context: CombatOperationContext = { blackboard: new ActionBlackboard({}) };
  const before = { ...context };
  expect(() =>
    withAbilityEventResponseContext(
      context,
      {
        event: 'abilityEntityFinished',
        payload: {
          ...payload,
          get skillCastInfo(): never {
            throw new Error('source read failed');
          },
        },
      },
      undefined,
      () => {
        throw new Error('must not execute');
      },
    ),
  ).toThrow('source read failed');
  expect(context).toEqual(before);
});

it('栈顶事件缺少或明确没有来源时遮蔽外层来源，结束后恢复', () => {
  const source = {
    skillCastId: 7,
    originSkillId: 'outer',
    originSkillType: 'battleSkill' as const,
    nonReturnedSpCost: 0,
  };
  const context: CombatOperationContext = {
    blackboard: new ActionBlackboard({}),
    eventSkillCastInfo: source,
  };
  withAbilityEventResponseContext(
    context,
    { event: 'abilityEntityFinished', payload },
    undefined,
    () => {
      expect(context.eventSkillCastInfo).toBeUndefined();
    },
  );
  expect(context.eventSkillCastInfo).toBe(source);
  withAbilityEventResponseContext(
    context,
    { event: 'abilityEntityFinished', payload: { ...payload, skillCastInfo: null } },
    undefined,
    () => {
      expect(context.eventSkillCastInfo).toBeNull();
    },
  );
  expect(context.eventSkillCastInfo).toBe(source);
});

it.each(['outputHeal', 'receiveHeal'] as const)('%s 响应保留原始通知和满血治疗载荷', event => {
  const published = {
    event,
    payload: {
      sourceId: 'healer',
      targetId: 'receiver',
      requestedHealing: 100,
      actualHealing: 0,
      overhealing: 100,
      tags: [],
    },
  };
  const context: CombatOperationContext = { blackboard: new ActionBlackboard() };
  withAbilityEventResponseContext(context, published, undefined, () => {
    expect(context.event).toBe(published);
    expect('kind' in context.event!).toBe(false);
  });
});

it.each([
  'beforeTakeDamage',
  'beforeOutputDamage',
  'takeDamage',
  'takeCriticalDamage',
  'outputDamage',
  'outputCriticalDamage',
  'afterKillEntity',
] as const)('%s 直接保留结果载荷和原始事件对象', event => {
  const published = { event, payload: createKillEvent().payload };
  const context: CombatOperationContext = { blackboard: new ActionBlackboard() };
  withAbilityEventResponseContext(context, published, undefined, () => {
    expect(context.event).toBe(published);
    expect('kind' in context.event!).toBe(false);
  });
});

it.each([
  'beforeTakePhysicalInfliction',
  'beforeOutputPhysicalInfliction',
  'afterTakePhysicalInfliction',
  'afterOutputPhysicalInfliction',
] as const)('%s 沿用同一个物理异常事件及技能挂载端口', event => {
  const attachBuffToCurrentSkill = () => {};
  const published = {
    event,
    payload: {
      sourceId: 'operator',
      targetId: 'enemy',
      type: 'fracture' as const,
      skillCastInfo: null,
      attachBuffToCurrentSkill,
    },
  };
  const context: CombatOperationContext = { blackboard: new ActionBlackboard() };
  withAbilityEventResponseContext(context, published, undefined, () => {
    expect(context.event).toBe(published);
    expect(context.eventSkillCastInfo).toBeNull();
  });
});
it.each(['beforeOutputKnockDown', 'afterOutputKnockDown'] as const)(
  '%s 保留专属通知身份与浮空转入标识',
  event => {
    const published = {
      event,
      payload: { sourceId: 'operator', targetId: 'enemy', fromAirborne: true },
    };
    const context: CombatOperationContext = { blackboard: new ActionBlackboard() };
    withAbilityEventResponseContext(context, published, undefined, () =>
      expect(context.event).toBe(published),
    );
  },
);
import { createEventBuff } from './buffEventTestFixture';
