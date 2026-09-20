import { createTestBuffReference } from '../buffs/buffTestFixtures';
import { expect, it } from 'vitest';
import { AbilityEventDispatcher } from './abilityEventDispatcher';
import type { AbilityEventPayloadMap, CombatAbilityEvent } from './combatAbilityEvent';
import {
  spellBurstAbilityEvent,
  characterInflictionAbilityEvent,
  skillAbilityEvent,
  lifecycleAbilityEvent,
  weaknessAbilityEvent,
  customAbilityEvent,
  poiseAbilityEvent,
  shieldAbilityEvent,
  killAbilityEvent,
  inflictionAbilityEvent,
  spGainAbilityEvent,
  healAbilityEvent,
  damageAbilityEvent,
  physicalAbilityEvent,
  knockDownAbilityEvent,
  buffEnhanceAbilityEvent,
} from './combatAbilityEvent';

it('分类器只收窄统一事件，不读取或重新解释载荷，手工标记不冒充原生事件', () => {
  const published: CombatAbilityEvent<'afterAddedShield'> = {
    event: 'afterAddedShield',
    get payload(): AbilityEventPayloadMap['afterAddedShield'] {
      throw new Error('classification must not parse payload');
    },
  };
  const classifiers = [
    spellBurstAbilityEvent,
    characterInflictionAbilityEvent,
    skillAbilityEvent,
    lifecycleAbilityEvent,
    weaknessAbilityEvent,
    customAbilityEvent,
    poiseAbilityEvent,
    shieldAbilityEvent,
    killAbilityEvent,
    inflictionAbilityEvent,
    spGainAbilityEvent,
    healAbilityEvent,
    damageAbilityEvent,
    physicalAbilityEvent,
    knockDownAbilityEvent,
    buffEnhanceAbilityEvent,
  ];
  for (const classify of classifiers) {
    expect(classify(published)).toBe(classify === shieldAbilityEvent ? published : undefined);
    expect(classify({ kind: 'knockDownOutput' })).toBeUndefined();
  }
  if (false) {
    // @ts-expect-error 仅有名称不构成合法原生事件。
    shieldAbilityEvent({ event: 'afterAddedShield' });
    // @ts-expect-error 不能经 kind 标记偷偷携带一个未校验的原生事件名。
    shieldAbilityEvent({ kind: 'marker', event: 'afterAddedShield', payload: {} });
  }
});

it('发布、数据动作、技能与连携共享同一事件和原始操作端口', () => {
  const calls: string[] = [];
  const payload = {
    sourceId: 'operator',
    targetId: 'enemy',
    type: 'fracture' as const,
    attachBuffToCurrentSkill: () => {
      calls.push('attach');
    },
  };
  const published: CombatAbilityEvent<'beforeOutputPhysicalInfliction'> = {
    event: 'beforeOutputPhysicalInfliction',
    payload,
  };
  const dispatcher = new AbilityEventDispatcher<
    'beforeOutputPhysicalInfliction',
    AbilityEventPayloadMap
  >();
  const check = (event: typeof published, phase: string) => {
    expect(event).toBe(published);
    expect(event.payload).toBe(payload);
    expect(event.payload.attachBuffToCurrentSkill).toBe(payload.attachBuffToCurrentSkill);
    calls.push(phase);
  };
  dispatcher.registerCallback(published.event, event => check(event, 'callback'));
  dispatcher.registerAction(published.event, 0, event => {
    check(event, 'action');
    event.payload.attachBuffToCurrentSkill?.({
      isRecycled: false,
      reference: createTestBuffReference(),
      finish: () => true,
    });
  });
  dispatcher.dispatch(published, [{ onAbilityEvent: event => check(event, 'skill') }], {
    onAbilityEvent: event => check(event, 'combo'),
  });
  expect(calls).toEqual(['callback', 'action', 'attach', 'skill', 'combo']);
});

it('同载荷不同发布阶段仍保留真实事件身份', () => {
  const payload = { sourceId: 'operator', targetId: 'enemy', buffId: 'buff', buffTags: [] };
  const before: CombatAbilityEvent<'beforeAddedBuff'> = { event: 'beforeAddedBuff', payload };
  const after: CombatAbilityEvent<'addedBuff'> = { event: 'addedBuff', payload };
  expect(before.event).not.toBe(after.event);
  expect(before.payload).toBe(after.payload);
});

// 类型回归：不能把另一种载荷挂到同一个事件名上，也不通过 Extract 得到空集后假通过。
const invalidBuffEvent: CombatAbilityEvent<'addedBuff'> = {
  event: 'addedBuff',
  // @ts-expect-error AddedBuff 必须携带原始 Buff 身份和标签。
  payload: { sourceId: 'operator', targetId: 'enemy' },
};
void invalidBuffEvent;

it('按订阅事件推导完整载荷，异类事件不能混配', () => {
  const dispatcher = new AbilityEventDispatcher<
    'addedBuff' | 'afterTakeInfliction',
    AbilityEventPayloadMap
  >();
  let received: CombatAbilityEvent<'afterTakeInfliction'> | undefined;
  dispatcher.registerCallback('afterTakeInfliction', event => {
    received = event;
    expect(event.payload.skillId).toBe('skill');
    expect(event.payload.isExtra).toBe(true);
    // @ts-expect-error 元素附着载荷不是 Buff 施加载荷。
    void event.payload.buffId;
  });
  const event: CombatAbilityEvent<'afterTakeInfliction'> = {
    event: 'afterTakeInfliction',
    payload: {
      sourceId: 'operator',
      targetId: 'enemy',
      skillId: 'skill',
      element: 'electric',
      isExtra: true,
      skillCastInfo: null,
    },
  };
  dispatcher.dispatch(event, []);
  expect(received).toBe(event);
  if (false) {
    // @ts-expect-error 不能把两个独立联合混配为“Buff 名称 + 附着载荷”。
    dispatcher.dispatch({ event: 'addedBuff', payload: event.payload }, []);
  }
});

// 类型边界：外部受击事实不能携带一次并未执行的伤害结果。
const invalidExternalHit: import('./combatAbilityEvent').ExternalOperatorHitPayload = {
  external: true,
  sourceId: 'enemy',
  targetId: 'operator',
  tags: [],
  features: [],
  // @ts-expect-error 外部输入不是伤害结算。
  result: { value: 100 },
};
void invalidExternalHit;
