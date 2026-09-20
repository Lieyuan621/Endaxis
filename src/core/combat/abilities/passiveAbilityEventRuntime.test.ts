import { createTestBuffReference } from '../buffs/buffTestFixtures';
import { expect, it, vi } from 'vitest';
import type { AbilityEvent } from '../../../../packages/game-data-contract/src/abilityEvents';
import { AbilityEventDispatcher } from '../events/abilityEventDispatcher';
import { lifecycleAbilityEvent, type AbilityEventPayloadMap } from '../events/combatAbilityEvent';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { ActionBlackboardOperationExecutor } from '../actions/actionBlackboardOperationExecutor';
import { PassiveAbilityEventRuntime } from './passiveAbilityEventRuntime';
import type { CombatOperationContext } from '../skills/skillRuntime';

const responses = [
  {
    event: 'abilityEntityFinished' as const,
    priority: 0,
    sequence: {
      steps: [
        {
          kind: 'changeResource' as const,
          parameters: { resource: 'sp' as const, amount: 1, recipient: 'team' as const },
        },
      ],
    },
  },
];

it('retains both registration failure and cleanup failure for diagnosis', () => {
  const original = new Error('register');
  const cleanup = new Error('unregister');
  let count = 0;
  let caught: unknown;
  try {
    new PassiveAbilityEventRuntime(
      { execute: () => true, evaluate: () => true },
      { blackboard: new ActionBlackboard() },
      [responses[0]!, responses[0]!],
      () => {
        if (++count === 2) throw original;
        return {
          dispose: () => {
            throw cleanup;
          },
        };
      },
    );
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(AggregateError);
  expect((caught as AggregateError).errors).toEqual([original, cleanup]);
});

it('owns children even when the passive has no event responses', () => {
  const host = new PassiveAbilityEventRuntime(
    { execute: () => true, evaluate: () => true },
    { blackboard: new ActionBlackboard() },
    [],
    () => {
      throw new Error('no response should register');
    },
  );
  const finish = vi.fn(() => true);
  host.addChildBuff({ isRecycled: false, reference: createTestBuffReference(), finish });
  host.enable();
  host.dispose();
  host.dispose();
  expect(finish).toHaveBeenCalledExactlyOnceWith('other', null);
});

it.each(['dispose', 'ownerPermission'] as const)(
  '%s 会阻止被动响应后续动作，但仍清理已开始的动作',
  mode => {
    const dispatcher = new AbilityEventDispatcher<AbilityEvent, AbilityEventPayloadMap>();
    let ownerPermitted = true;
    const execute = vi.fn(() => {
      if (mode === 'dispose') host.dispose();
      else ownerPermitted = false;
      return true;
    });
    const end = vi.fn();
    const step = responses[0]!.sequence.steps[0]!;
    const host = new PassiveAbilityEventRuntime(
      { execute, end, evaluate: () => true },
      { blackboard: new ActionBlackboard(), canExecuteAction: () => ownerPermitted },
      [{ ...responses[0]!, sequence: { steps: [step, step] } }],
      (event, priority, handle) =>
        dispatcher.registerAction(event, priority, published => handle(published)),
    );
    host.enable();
    dispatcher.dispatch(
      {
        event: 'abilityEntityFinished',
        payload: { sourceId: 'owner', targetId: 'entity' },
      },
      [],
    );
    expect(execute).toHaveBeenCalledOnce();
    expect(end).toHaveBeenCalledOnce();
    host.dispose();
  },
);

it('技力与治疗原生响应写入各自的请求量和实际量，不合并或继承上一事件', () => {
  const dispatcher = new AbilityEventDispatcher<AbilityEvent, AbilityEventPayloadMap>();
  const blackboard = new ActionBlackboard();
  const host = new PassiveAbilityEventRuntime(
    new ActionBlackboardOperationExecutor({ execute: () => false, evaluate: () => false }),
    { blackboard },
    [
      {
        event: 'skillSpGained',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'storeEventSpGainAmount',
              parameters: { outputKey: 'sp', realDeltaOutputKey: 'spActual' },
            },
          ],
        },
      },
      {
        event: 'receiveHeal',
        priority: 0,
        sequence: {
          steps: [
            {
              kind: 'storeEventHealValues',
              parameters: { finalHealOutputKey: 'heal', realHealOutputKey: 'healActual' },
            },
          ],
        },
      },
    ],
    (event, priority, handle) =>
      dispatcher.registerAction(event, priority, published => handle(published)),
  );
  host.enable();
  dispatcher.dispatch(
    {
      event: 'skillSpGained',
      payload: {
        sourceOperatorId: 'operator',
        source: 'powerAttack',
        gainKind: 'refund',
        requestedAmount: 30,
        amount: 0,
      },
    },
    [],
  );
  dispatcher.dispatch(
    {
      event: 'receiveHeal',
      payload: {
        sourceId: 'healer',
        targetId: 'operator',
        requestedHealing: 50,
        actualHealing: 0,
        overhealing: 50,
        tags: [],
      },
    },
    [],
  );
  expect(blackboard.getNumber('sp')).toBe(30);
  expect(blackboard.getNumber('spActual')).toBe(0);
  expect(blackboard.getNumber('heal')).toBe(50);
  expect(blackboard.getNumber('healActual')).toBe(0);
  host.dispose();
});

it('初始化只屏蔽当前未启用宿主，不改变已启用监听者及同优先级注册顺序', () => {
  const dispatcher = new AbilityEventDispatcher<AbilityEvent, AbilityEventPayloadMap>();
  const seen: string[] = [];
  const create = (id: string) =>
    new PassiveAbilityEventRuntime(
      {
        evaluate: () => true,
        execute: () => {
          seen.push(id);
          return true;
        },
      },
      { blackboard: new ActionBlackboard() },
      responses,
      (event, priority, handle) =>
        dispatcher.registerAction(event, priority, published => handle(published)),
    );
  const fire = () =>
    dispatcher.dispatch(
      {
        event: 'abilityEntityFinished',
        payload: { sourceId: 'owner', targetId: 'entity' },
      },
      [],
    );
  const first = create('first');
  fire();
  expect(seen).toEqual([]);
  first.enable();
  const second = create('second');
  fire();
  expect(seen).toEqual(['first']);
  second.enable();
  fire();
  expect(seen).toEqual(['first', 'first', 'second']);
  first.dispose();
  second.dispose();
  fire();
  expect(seen).toHaveLength(3);
});

it('添加 Buff 的被动响应保留原事件、来源与目标，并在被动释放时注销', () => {
  const dispatcher = new AbilityEventDispatcher<AbilityEvent, AbilityEventPayloadMap>();
  const seen: unknown[] = [];
  const owner: CombatOperationContext = { blackboard: new ActionBlackboard() };
  const runtime = new PassiveAbilityEventRuntime(
    {
      evaluate: () => true,
      execute: (_step, context) => {
        seen.push({
          event: context?.event,
          input: context?.actionInputTarget,
          source: context?.eventSkillCastInfo,
        });
        return true;
      },
    },
    owner,
    [{ ...responses[0]!, event: 'addedBuff' }],
    (event, priority, handle) =>
      dispatcher.registerAction(event, priority, published =>
        handle(published, {
          inputTarget: { kind: 'operator', operatorId: 'source' },
          triggerTarget: { kind: 'operator', operatorId: 'owner' },
        }),
      ),
  );
  const published = {
    event: 'addedBuff' as const,
    payload: {
      sourceId: 'source',
      targetId: 'owner',
      buffId: 'fixture',
      buffTags: [],
      skillCastInfo: null,
    },
  };
  dispatcher.dispatch(published, []);
  expect(seen).toEqual([]);
  runtime.enable();
  dispatcher.dispatch(published, []);
  expect(seen).toEqual([
    { event: published, input: { kind: 'operator', operatorId: 'source' }, source: null },
  ]);
  expect(owner.event).toBeUndefined();
  runtime.dispose();
  dispatcher.dispatch(published, []);
  expect(seen).toHaveLength(1);
});

it('复用被动黑板与所有权，事件目标独立，并在注销后停止响应', () => {
  const dispatcher = new AbilityEventDispatcher<AbilityEvent, AbilityEventPayloadMap>();
  const blackboard = new ActionBlackboard({ count: 0 });
  const owner = { blackboard, actionOwnerId: 'owner', actionSourceId: 'owner' };
  const seen: CombatOperationContext[] = [];
  const runtime = new PassiveAbilityEventRuntime(
    {
      evaluate: () => true,
      execute: (_step, context) => {
        seen.push({ ...context! });
        context!.blackboard.assignDynamic('count', context!.blackboard.getNumber('count')! + 1);
        return true;
      },
    },
    owner,
    responses,
    (event, priority, handle) =>
      dispatcher.registerAction(event, priority, published =>
        handle(published, {
          inputTarget: { kind: 'abilityEntity', instanceId: 7 },
          triggerTarget: null,
        }),
      ),
  );
  const fire = () =>
    dispatcher.dispatch(
      {
        event: 'abilityEntityFinished',
        payload: { sourceId: 'owner', targetId: 'ability-entity:7' },
      },
      [],
    );
  fire();
  expect(blackboard.getNumber('count')).toBe(0);
  runtime.enable();
  fire();
  fire();
  expect(blackboard.getNumber('count')).toBe(2);
  expect(seen[0]).toMatchObject({
    actionOwnerId: 'owner',
    actionSourceId: 'owner',
    actionInputTarget: { kind: 'abilityEntity', instanceId: 7 },
    event: { event: 'abilityEntityFinished', payload: { targetId: 'ability-entity:7' } },
  });
  expect(seen[0]!.blackboard).toBe(blackboard);
  expect(seen[0]!.targetContext).not.toBe(seen[1]!.targetContext);
  expect(owner).not.toHaveProperty('event');
  runtime.dispose();
  runtime.dispose();
  expect(() => runtime.enable()).toThrow('disposed passive event host');
  fire();
  expect(seen).toHaveLength(2);
});

it('恢复时按保存订阅重绑响应，不重新注册或改写原分支黑板', () => {
  const dispatcher = new AbilityEventDispatcher<AbilityEvent, AbilityEventPayloadMap>();
  const originalBlackboard = new ActionBlackboard({ count: 0 });
  const original = new PassiveAbilityEventRuntime(
    {
      evaluate: () => true,
      execute: (_step, context) => {
        context!.blackboard.assignDynamic('count', context!.blackboard.getNumber('count')! + 1);
        return true;
      },
    },
    { blackboard: originalBlackboard },
    responses,
    (event, priority, handle) =>
      dispatcher.registerAction(event, priority, published => handle(published)),
  );
  original.enable();

  const copied = structuredClone({
    passive: original.runtimeState,
    events: dispatcher.runtimeState,
  });
  const restoredDispatcher = new AbilityEventDispatcher<AbilityEvent, AbilityEventPayloadMap>(
    copied.events,
  );
  const restoredBlackboard = ActionBlackboard.bindRuntimeState(copied.passive.blackboard);
  const restored = new PassiveAbilityEventRuntime(
    {
      evaluate: () => true,
      execute: (_step, context) => {
        context!.blackboard.assignDynamic('count', context!.blackboard.getNumber('count')! + 1);
        return true;
      },
    },
    { blackboard: restoredBlackboard },
    responses,
    (event, _priority, handle, subscriptions) => {
      if (subscriptions === undefined) throw new Error('restore requires saved subscriptions');
      return restoredDispatcher.bindSubscriptionFor(event, subscriptions[0]!, published =>
        handle(published),
      );
    },
    copied.passive,
  );
  restoredDispatcher.dispatch(
    {
      event: 'abilityEntityFinished',
      payload: { sourceId: 'owner', targetId: 'entity' },
    },
    [],
  );

  expect(restoredBlackboard.getNumber('count')).toBe(1);
  expect(originalBlackboard.getNumber('count')).toBe(0);
  expect(copied.events.nextRegistrationId).toBe(dispatcher.runtimeState.nextRegistrationId);
  restored.dispose();
  original.dispose();
});

it('注册中途失败会注销之前已安装的监听', () => {
  const dispose = vi.fn();
  let count = 0;
  expect(
    () =>
      new PassiveAbilityEventRuntime(
        { execute: () => true, evaluate: () => true },
        { blackboard: new ActionBlackboard({}) },
        [...responses, ...responses],
        () => {
          if (++count === 2) throw new Error('registration failed');
          return { dispose };
        },
      ),
  ).toThrow('registration failed');
  expect(dispose).toHaveBeenCalledOnce();
});

it('当前响应步骤已进入时不重启本序列，仍恢复外层事件目标', () => {
  const callbacks: Parameters<ConstructorParameters<typeof PassiveAbilityEventRuntime>[3]>[2][] =
    [];
  const seen: string[] = [];
  let nested = false;
  const runtime = new PassiveAbilityEventRuntime(
    {
      evaluate: () => true,
      execute: (_step, context) => {
        const target = context?.event
          ? (lifecycleAbilityEvent(context.event)?.payload.targetId ?? '')
          : '';
        seen.push(target);
        if (!nested) {
          nested = true;
          callbacks[0]!({
            event: 'abilityEntityFinished',
            payload: { sourceId: 'owner', targetId: 'inner' },
          });
          expect(context!.event).toMatchObject({ payload: { targetId: 'outer' } });
        }
        return true;
      },
    },
    { blackboard: new ActionBlackboard({}) },
    responses,
    (_event, _priority, handle) => {
      callbacks.push(handle);
      return { dispose() {} };
    },
  );
  runtime.enable();
  callbacks[0]!({
    event: 'abilityEntityFinished',
    payload: { sourceId: 'owner', targetId: 'outer' },
  });
  callbacks[0]!({
    event: 'abilityEntityFinished',
    payload: { sourceId: 'owner', targetId: 'next' },
  });
  expect(seen).toEqual(['outer', 'next']);
  runtime.dispose();
});
