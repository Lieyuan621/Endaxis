import { withAbilityEventResponseContext } from '../events/abilityEventResponseContext';
import { CombatVitals } from '../resources/combatVitals';
import type { BoundCombatBattleRuntimes } from './combatRuntimeAssembly';

import { expectTypeOf } from 'vitest';
import { AbilitySystemRuntime } from '../abilities/abilitySystemRuntime';
import type { HealthDamageEventPayload } from '../damage/healthDamage';
import type { PoiseDamageModifier } from '../damage/poiseDamage';
import { resolveAbilityEventActionContextBinding } from '../events/abilityEventActionContext';
import type { AbilityEventPayloadMap } from '../events/combatAbilityEvent';
import { buffEnhanceAbilityEvent } from '../events/combatAbilityEvent';
import { SimulationRandomSource } from '../random/simulationRandom';
import { createSimulationRandomState } from '../state/environmentState';
import type { KnockDownEventPayload } from '../status/knockDownOperationExecutor';
import type {
  StandardPlayerDamageEvent,
  StandardPlayerDamagePayloadMap,
} from './standardPlayerDamageEnvironment';

it.each(['expected', 'sampled'] as const)('环境保存 %s 模式实际消费的随机位置', mode => {
  const state = createSimulationRandomState();
  const settings = { mode, globalSeed: 42 };
  const source = new SimulationRandomSource(settings, () => state);
  const environment = new StandardPlayerDamageEnvironment({
    ...createEnvironment().options,
    criticalSamples: source,
    probabilitySamples: source,
    randomState: state,
  });
  source.nextCriticalSample();
  source.nextProbabilitySample();
  expect(environment.runtimeState.random).toBe(state);
  const saved = structuredClone(environment.runtimeState);
  const restored = new SimulationRandomSource(settings, () => saved.random!);
  expect(restored.nextCriticalSample()).toBe(source.nextCriticalSample());
  expect(restored.nextProbabilitySample()).toBe(source.nextProbabilitySample());
  const before = structuredClone(saved.random);
  source.nextCriticalSample();
  expect(saved.random).toEqual(before);
  expect(createEnvironment().runtimeState.random).toBeNull();
});

it('环境数据端口引用实际生命账本，保存后原分支受伤不改变切面', () => {
  const environment = createEnvironment();
  const bound = bindBattleWithoutProjectiles(environment, createContext());
  expect(bound.environmentState).toBe(environment.runtimeState);
  expect(environment.runtimeState.enemyVitals).toBe(environment.enemyVitals.runtimeState);
  const saved = structuredClone(environment.runtimeState);
  const before = saved.enemyVitals.health;
  environment.enemyVitals.takeDamage(10);
  expect(environment.runtimeState.enemyVitals.health).toBe(before - 10);
  expect(saved.enemyVitals.health).toBe(before);
});

it('生命变化事件在写入生命后送给对应实体，零伤害不触发', () => {
  const environment = createEnvironment();
  const observed: number[] = [];
  environment.eventsFor('enemy').registerAction('hpChanged', 0, event => {
    expect(event.payload).toEqual({ sourceId: 'enemy', targetId: 'enemy' });
    observed.push(environment.enemyVitals.health);
  });
  const before = environment.enemyVitals.health;
  environment.enemyVitals.takeDamage(10);
  environment.enemyVitals.takeDamage(0);
  expect(observed).toEqual([before - 10]);
});

it('恢复环境直接绑定账本和事件目录，不重新登记监听或改写原分支', () => {
  const original = createEnvironment();
  const received = vi.fn();
  const registration = original.eventsFor('enemy').registerCallback('afterAddedShield', received);
  const saved = structuredClone({
    environment: original.runtimeState,
    events: new Map([['enemy', original.eventsFor('enemy').runtimeState]]),
    subscription: registration.subscriptions[0]!,
  });
  const restoredEnemyVitals = CombatVitals.bindRuntimeState(saved.environment.enemyVitals);
  const restored = new StandardPlayerDamageEnvironment({
    ...original.options,
    enemyVitals: restoredEnemyVitals,
    restoredState: saved.environment,
    restoredEventStates: saved.events,
  });

  expect(restored.runtimeState).toBe(saved.environment);
  expect(restored.eventsFor('enemy').runtimeState).toBe(saved.events.get('enemy'));
  expect(restored.runtimeState.postSkillRequestListeners).toBe(
    saved.environment.postSkillRequestListeners,
  );
  expect(restored.runtimeState.buffProgress).toBe(saved.environment.buffProgress);
  expect(restored.runtimeState.reactions).toBe(saved.environment.reactions);
  const restoredReceived = vi.fn();
  restored
    .eventsFor('enemy')
    .bindSubscriptionFor('afterAddedShield', saved.subscription, restoredReceived);
  restored.eventsFor('enemy').dispatch(
    {
      event: 'afterAddedShield',
      payload: {
        sourceId: 'enemy',
        targetId: 'enemy',
        gainedValue: 10,
        currentValue: 10,
      },
    },
    [],
  );
  expect(restoredReceived).toHaveBeenCalledOnce();
  expect(received).not.toHaveBeenCalled();
  restoredEnemyVitals.takeDamage(10);
  expect(original.enemyVitals.health).not.toBe(restoredEnemyVitals.health);
});

it('环境按保存的状态目录接回原生事件订阅，不重新分配编号', () => {
  const original = createEnvironment();
  const registration = original.eventsFor('enemy').registerCallback('afterAddedShield', () => {});
  const saved = structuredClone({
    environment: original.runtimeState,
    events: new Map([['enemy', original.eventsFor('enemy').runtimeState]]),
    subscription: registration.subscriptions[0]!,
  });
  const restored = new StandardPlayerDamageEnvironment({
    ...original.options,
    enemyVitals: CombatVitals.bindRuntimeState(saved.environment.enemyVitals),
    restoredState: saved.environment,
    restoredEventStates: saved.events,
  });
  const bound = bindBattleWithoutProjectiles(restored, createContext());
  const before = saved.events.get('enemy')!.nextRegistrationId;
  const received = vi.fn();

  bound.bindNativeEventSubscription!(saved.subscription, received);

  expect(saved.events.get('enemy')!.nextRegistrationId).toBe(before);
  restored.eventsFor('enemy').dispatch(
    {
      event: 'afterAddedShield',
      payload: {
        sourceId: 'enemy',
        targetId: 'enemy',
        gainedValue: 10,
        currentValue: 10,
      },
    },
    [],
  );
  expect(received).toHaveBeenCalledOnce();
  expect(received.mock.calls[0]![0].event.event).toBe('afterAddedShield');
});

it('恢复环境直接绑定敌人与干员 Buff 数据，不重建属性和实体黑板', () => {
  const original = createEnvironment();
  const originalOperator = original.runtimeOptions.createOperatorBuffRuntime!('operator');
  const saved = structuredClone({
    environment: original.runtimeState,
    events: new Map([['enemy', original.eventsFor('enemy').runtimeState]]),
    enemyBuffs: original.runtimeOptions.enemyBuffRuntime.runtimeState!,
    operatorBuffs: originalOperator.runtimeState!,
  });
  const restored = new StandardPlayerDamageEnvironment({
    ...original.options,
    enemyVitals: CombatVitals.bindRuntimeState(saved.environment.enemyVitals),
    restoredState: saved.environment,
    restoredEventStates: saved.events,
    restoredBuffStates: {
      enemy: saved.enemyBuffs,
      operators: new Map([['operator', saved.operatorBuffs]]),
    },
  });
  const restoredOperator = restored.runtimeOptions.createOperatorBuffRuntime!('operator');

  expect(restored.runtimeOptions.enemyBuffRuntime.runtimeState).toBe(saved.enemyBuffs);
  expect(restoredOperator.runtimeState).toBe(saved.operatorBuffs);
  expect(restoredOperator.entityBlackboard!.runtimeState).toBe(
    saved.operatorBuffs.entityBlackboard,
  );
  expect(restoredOperator.runtimeState!.attributes).toBe(saved.operatorBuffs.attributes);
});

it('恢复能力实体 Buff 目标时复用保存的属性与黑板，且不重复施加出生标签', () => {
  const original = createEnvironment();
  const originalBlackboard = new ActionBlackboard({ phase: 3 });
  const originalTarget = original.runtimeOptions.createAbilityEntityBuffRuntime!(
    'ability-entity:7',
    originalBlackboard,
    { kind: 'abilityEntity', instanceId: 7 },
    ['Test/Tag123'],
  );
  const saved = structuredClone({
    blackboard: originalBlackboard.runtimeState,
    buffs: originalTarget.runtimeState!,
  });
  const restoredBlackboard = ActionBlackboard.bindRuntimeState(saved.blackboard);
  const restored = createEnvironment().runtimeOptions.createAbilityEntityBuffRuntime!(
    'ability-entity:7',
    restoredBlackboard,
    { kind: 'abilityEntity', instanceId: 7 },
    ['Test/Tag123'],
    saved.buffs,
  );

  expect(saved.buffs.entityBlackboard).toBe(saved.blackboard);
  expect(restored.runtimeState).toBe(saved.buffs);
  expect(restored.runtimeState!.entityBlackboard).toBe(restoredBlackboard.runtimeState);
  expect(restored.runtimeState!.entityTagCounts.get('Test/Tag123')).toBe(1);
  expect(
    ActionBlackboard.bindRuntimeState(restored.runtimeState!.entityBlackboard!).getNumber('phase'),
  ).toBe(3);
});

it('队伍订阅保留每个实体的注册引用，注销只清除对应的注册', () => {
  const environment = createEnvironment();
  environment.runtimeOptions.createOperatorBuffRuntime!('first');
  environment.runtimeOptions.createOperatorBuffRuntime!('second');
  const first = environment.eventsFor('first');
  const second = environment.eventsFor('second');
  const persistent = first.registerAction('addedBuff', 0, () => {});
  const registration = environment.runtimeOptions.registerCombatAbilityEvent!(
    'first',
    'team',
    'addedBuff',
    'dataAction',
    3,
    () => {},
  );
  expect(registration.subscriptions).toHaveLength(2);
  expect(registration.subscriptions.map(reference => reference.state)).toEqual([
    first.runtimeState,
    second.runtimeState,
  ]);
  registration.dispose();
  expect(first.runtimeState.phases.action.get('addedBuff')!.map(entry => entry.id)).toEqual([
    persistent.subscriptions[0]!.id,
  ]);
  expect(second.runtimeState.phases.action.has('addedBuff')).toBe(false);
});

it('战斗事件目录包含绑定后新建的实体，复制后不受订阅注销影响', () => {
  const environment = createEnvironment();
  const bound = bindBattleWithoutProjectiles(environment, createContext());
  const states = bound.eventStates!;
  const dispatcher = environment.eventsFor('late-entity');
  expect(states.get('late-entity')).toBe(dispatcher.runtimeState);
  const registration = dispatcher.registerCallback('afterAddedShield', () => {});
  const saved = structuredClone(states);
  registration.dispose();
  expect(states.get('late-entity')!.phases.callback.has('afterAddedShield')).toBe(false);
  expect(saved.get('late-entity')!.phases.callback.get('afterAddedShield')).toHaveLength(1);
  environment.eventsFor('another-entity');
  expect(states.has('another-entity')).toBe(true);
  expect(saved.has('another-entity')).toBe(false);
});

it('延迟请求对象通知接到对应 Buff 宿主，注销不影响之后的新订阅', () => {
  const environment = createEnvironment();
  const target = environment.runtimeOptions.enemyBuffRuntime;
  if (!(target instanceof BuffDefinitionOperationTarget)) throw new Error('fixture');
  const received: unknown[] = [];
  const register = target.registerPostSkillCastRequest!;
  const first = register(info => received.push(info));
  expect(first.registrationId).toBe(0);
  expect(
    environment.runtimeState.postSkillRequestListeners.registrationsByOwner.get('enemy'),
  ).toEqual([0]);
  environment.runtimeOptions.onPostSkillCastRequest?.('operator', null);
  expect(received).toEqual([]);
  const create = () =>
    new AbilitySystemRuntime({
      skills: [
        {
          skillId: 'next',
          skillType: 'battleSkill',
          state: 'ready',
          canStart: () => true,
          tryStart: () => true,
          interrupt: () => {},
          advanceFrame: () => {},
        },
      ],
      onPostSkillCastRequest: info =>
        environment.runtimeOptions.onPostSkillCastRequest?.('enemy', info),
    });
  create().requestPostSkillCast({ skillId: 'next' });
  expect(received).toEqual([null]);
  first.dispose();
  const second = register(info => received.push(info));
  expect(second.registrationId).toBe(1);
  first.dispose();
  create().requestPostSkillCast({ skillId: 'next' });
  expect(received).toEqual([null, null]);
  second.dispose();
  create().requestPostSkillCast({ skillId: 'next' });
  expect(received).toHaveLength(2);
});

it('恢复后的 Buff 目标按保存编号接回延迟请求监听，不消费新编号', () => {
  const original = createEnvironment();
  const originalTarget = original.runtimeOptions.enemyBuffRuntime;
  if (!(originalTarget instanceof BuffDefinitionOperationTarget)) throw new Error('fixture');
  const originalRegistration = originalTarget.registerPostSkillCastRequest!(() => {});
  expect(originalRegistration.registrationId).toBe(0);
  const saved = structuredClone(original.runtimeState);
  const restored = new StandardPlayerDamageEnvironment({
    ...original.options,
    enemyVitals: CombatVitals.bindRuntimeState(saved.enemyVitals),
    restoredState: saved,
  });
  const restoredTarget = restored.runtimeOptions.enemyBuffRuntime;
  if (!(restoredTarget instanceof BuffDefinitionOperationTarget)) throw new Error('fixture');
  const restoredRegistration = restoredTarget.registerPostSkillCastRequest!(() => {}, 0);

  expect(restoredRegistration.registrationId).toBe(0);
  expect(saved.postSkillRequestListeners.nextRegistrationId).toBe(1);
  expect(saved.postSkillRequestListeners.registrationsByOwner.get('enemy')).toEqual([0]);
});

it.each([
  'enhance',
  'enhanceAndRefresh',
  'enhanceAndOverwriteDuration',
  'timedGrowingEnhance',
] as const)('%s 增强尝试在后置动作后发布本次来源，满层仍发布', stackingType => {
  const environment = createEnvironment();
  const context = createContext();
  environment.runtimeOptions.createOperationExecutor(context);
  const target = environment.runtimeOptions.enemyBuffRuntime;
  if (!(target instanceof BuffDefinitionOperationTarget)) throw new Error('fixture');
  const original = {
    skillCastId: 1,
    originSkillId: 'old',
    originSkillType: 'basicAttack' as const,
    nonReturnedSpCost: 0,
  };
  const incoming = {
    ...original,
    skillCastId: 2,
    originSkillId: 'incoming',
    originSkillType: 'comboSkill' as const,
  };
  let afterCount = 0;
  const definition = {
    id: 'enhance-attempt',
    stackingType,
    maxStackCount: 2,
    durationSeconds: 1,
    actions: {
      afterEnhance: () => {
        afterCount += 1;
      },
    },
  };
  const buff = target.container.add(definition, 'operator', { skillCastInfo: original })!;
  const initialAfterCount = stackingType === 'timedGrowingEnhance' ? 0 : 1;
  expect(afterCount).toBe(initialAfterCount);
  const seen: AbilityEventPayloadMap['buffEnhanceChanged'][] = [];
  environment.eventsFor('enemy').registerCallback('buffEnhanceChanged', event => {
    expect(afterCount).toBe(initialAfterCount + seen.length + 1);
    expect(event.payload.buff).toBe(buff);
    expect(event.payload.layerCount).toBe(1);
    expect(event.payload.reason).toBe('lifetime');
    seen.push(event.payload);
  });
  if (stackingType === 'timedGrowingEnhance') {
    target.container.tick(1);
    expect(buff.enhanceCount).toBe(2);
    expect(seen).toEqual([]);
  }
  const incomingProducer = {
    kind: 'action' as const,
    ownerId: 'operator',
    actionId: 'passive:incoming-talent',
  };
  target.container.add(definition, 'operator', {
    skillCastInfo: incoming,
    producedBy: incomingProducer,
  });
  target.container.add(definition, 'operator');
  expect(buff.enhanceCount).toBe(2);
  expect(seen.map(event => event.skillCastInfo)).toEqual([incoming, null]);
  const entries = (context.receipt as CombatReceiptCollector).entries;
  expect(entries.find(entry => entry.event === 'BuffStackChanged')?.producedBy).toEqual(
    stackingType === 'timedGrowingEnhance'
      ? { kind: 'buff', ownerId: 'enemy', instanceId: buff.instanceId }
      : incomingProducer,
  );
  expect(
    entries.filter(entry => entry.event === 'BuffStackChanged').map(entry => entry.data),
  ).toEqual([
    { buffId: definition.id, instanceId: buff.instanceId, previousLayers: 1, layers: 2, delta: 1 },
  ]);
  expect(
    entries
      .filter(entry => entry.event === 'BuffEnhanceAttempted')
      .map(entry => entry.data?.layers),
  ).toEqual(stackingType === 'timedGrowingEnhance' ? [2, 2] : [1, 2, 2]);
});

it('标准环境公共事件载荷复用权威映射，不被过程通知的 unknown 放宽', () => {
  expectTypeOf<StandardPlayerDamagePayloadMap['addedBuff']>().toEqualTypeOf<
    AbilityEventPayloadMap['addedBuff']
  >();
  expectTypeOf<StandardPlayerDamagePayloadMap['weaknessSet']>().toEqualTypeOf<
    AbilityEventPayloadMap['weaknessSet']
  >();
  expectTypeOf<StandardPlayerDamagePayloadMap['beforeOutputDamage']>().toEqualTypeOf<
    AbilityEventPayloadMap['beforeOutputDamage']
  >();
});
it('过程事件载荷覆盖全部广播键，复用生产端类型且不含 unknown 兜底', () => {
  expectTypeOf<keyof StandardPlayerDamagePayloadMap>().toEqualTypeOf<StandardPlayerDamageEvent>();
  expectTypeOf<StandardPlayerDamagePayloadMap[StandardPlayerDamageEvent]>().not.toBeUnknown();
  expectTypeOf<
    StandardPlayerDamagePayloadMap['beforeKillEntity']
  >().toEqualTypeOf<HealthDamageEventPayload>();
  expectTypeOf<
    StandardPlayerDamagePayloadMap['beforeTakePoiseDamage']
  >().toEqualTypeOf<PoiseDamageModifier>();
  expectTypeOf<
    StandardPlayerDamagePayloadMap['beforeTakeKnockDown']
  >().toEqualTypeOf<KnockDownEventPayload>();
  expectTypeOf<StandardPlayerDamagePayloadMap['beforeTakeSpellBurst']>().toEqualTypeOf<
    AbilityEventPayloadMap['beforeOutputSpellBurst']
  >();
});

it.each(['early', 'absorbed'] as const)('结束通知和%s回调保持同一独立来源', reason => {
  const original = {
    skillCastId: 1,
    originSkillId: 'original',
    originSkillType: 'basicAttack' as const,
    nonReturnedSpCost: 0,
  };
  for (const source of [
    undefined,
    null,
    {
      ...original,
      skillCastId: 2,
      originSkillId: 'finish',
      originSkillType: 'comboSkill' as const,
    },
  ]) {
    const environment = createEnvironment();
    environment.runtimeOptions.createOperationExecutor(createContext());
    const target = environment.runtimeOptions.enemyBuffRuntime;
    if (!(target instanceof BuffDefinitionOperationTarget)) throw new Error('fixture');
    const buff = target.container.add(
      { id: 'finish-source', stackingType: 'enhance', blackboard: { value: 7 } },
      'operator',
      { skillCastInfo: original },
    )!;
    const order: string[] = [];
    for (const eventName of ['finishedBuff', 'buffEndsEarly', 'buffEnhanceChanged'] as const) {
      environment.eventsFor('enemy').registerCallback(eventName, event => {
        order.push(event.event);
        expect(event.payload.skillCastInfo).toBe(source);
      });
    }
    const observer = (event: import('../buffs/buffOperationExecutor').BuffConsumedEvent) => {
      order.push('source-notification');
      expect(event.skillCastInfo).toBe(source);
      expect(event).toMatchObject({
        sourceOperatorId: 'operator',
        targetId: 'enemy',
        buffId: buff.definition.id,
        layers: 1,
        blackboardValues: { value: 7 },
      });
      expect(buff.isFinished).toBe(true);
    };
    if (reason === 'early') target.configureBuffConsumedObserver(observer);
    else target.configureBuffAbsorbedObserver(observer);
    target.finishByIds([buff.definition.id], reason, 'operator', source);
    expect(order).toEqual(
      reason === 'early'
        ? ['finishedBuff', 'buffEndsEarly', 'buffEnhanceChanged', 'source-notification']
        : ['finishedBuff', 'buffEnhanceChanged', 'source-notification'],
    );
  }
});

it.each([
  [false, false],
  [false, true],
  [true, false],
  [true, true],
])('结束/减层事件保留实际 Buff 与独立来源，无来源=%s，按标签=%s', (noSource, byTags) => {
  for (const count of [undefined, 1]) {
    const environment = createEnvironment();
    environment.runtimeOptions.createOperationExecutor(createContext());
    const target = environment.runtimeOptions.enemyBuffRuntime;
    if (!(target instanceof BuffDefinitionOperationTarget)) throw new Error('fixture');
    const original = {
      skillCastId: 1,
      originSkillId: 'original',
      originSkillType: 'basicAttack' as const,
      nonReturnedSpCost: 0,
    };
    const finishSource = noSource
      ? null
      : {
          ...original,
          skillCastId: 2,
          originSkillId: 'finisher',
          originSkillType: 'comboSkill' as const,
        };
    const definition = {
      id: 'layer-source',
      stackingType: 'enhanceAndRefresh' as const,
      maxStackCount: 3,
    };
    const buff = target.container.add(definition, 'operator', { skillCastInfo: original })!;
    target.container.add(definition, 'operator', { skillCastInfo: original });
    const received: AbilityEventPayloadMap['buffEnhanceChanged'][] = [];
    environment.eventsFor('enemy').registerCallback('buffEnhanceChanged', event => {
      received.push(event.payload);
      expect(event.payload.buff).toBe(buff);
      expect(event.payload.skillCastInfo).toBe(finishSource);
      expect(event.payload.buff.isFinished).toBe(count === undefined);
      expect(event.payload).not.toHaveProperty('targetId');
      const conditions = new EventContextConditionExecutor({
        execute: () => false,
        evaluate: () => false,
      });
      const context = { blackboard: new ActionBlackboard(), event, skillCastInfo: original };
      expect(
        conditions.evaluate({ kind: 'eventBuffIdMatch', buffIds: [definition.id] }, context),
      ).toBe(true);
      expect(
        conditions.evaluate({ kind: 'eventBuffTagsMatch', buffTags: [], match: 'hasAll' }, context),
      ).toBe(true);
      expect(
        conditions.evaluate({ kind: 'originSkillTypeIn', skillTypes: ['comboSkill'] }, context),
      ).toBe(!noSource);
      expect(
        conditions.evaluate({ kind: 'originSkillTypeIn', skillTypes: ['basicAttack'] }, context),
      ).toBe(false);
    });
    const operations = new BuffOperationExecutor({
      sourceId: 'operator',
      resolveTarget: () => target,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const common = {
      target: 'enemy' as const,
      reason: 'other' as const,
      ...(count === undefined ? {} : { count: { kind: 'constant' as const, value: count } }),
    };
    operations.execute(
      byTags
        ? {
            kind: 'finishBuffsByTag',
            parameters: { ...common, buffTags: [], tagQueryType: 'hasAll' },
          }
        : { kind: 'finishBuffsById', parameters: { ...common, buffIds: [definition.id] } },
      {
        blackboard: new ActionBlackboard(),
        ...(finishSource === null ? {} : { skillCastInfo: finishSource }),
        eventSkillCastInfo: original,
      },
    );
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      reason: 'other',
      layerCount: count === undefined ? -2 : -1,
    });
  }
});

it('Buff 层数变化在 owner 发布，载荷不伪造目标且消费同一原始对象', () => {
  const environment = createEnvironment();
  bindBattleWithoutProjectiles(environment, createContext());
  const target = environment.runtimeOptions.enemyBuffRuntime;
  if (!(target instanceof BuffDefinitionOperationTarget)) throw new Error('fixture');
  const received: number[] = [];
  environment.eventsFor('enemy').registerCallback('buffEnhanceChanged', event => {
    const published = buffEnhanceAbilityEvent(event);
    if (published === undefined) throw new Error('fixture event');
    expect(published).toBe(event);
    expect(published.payload.sourceId).toBe('enemy');
    expect('targetId' in published.payload).toBe(false);
    const context: import('../skills/skillRuntime').CombatOperationContext = {
      blackboard: new ActionBlackboard(),
    };
    withAbilityEventResponseContext(context, event, undefined, () => {
      expect(context.event).toBe(event);
    });
    received.push(published.payload.layerCount);
  });
  const definition = {
    id: 'layer-test',
    stackingType: 'enhanceAndRefresh' as const,
    maxStackCount: 3,
  };
  target.container.add(definition, 'operator');
  target.container.add(definition, 'operator');
  expect(received).toContain(1);
});

import { describe, expect, it, vi } from 'vitest';
import { compileEventTargetSimpleDamageOperationSource } from '../../../../tools/game-data-compiler/src/compiler/actions/simpleDamageOperation.ts';
import { compilePendingComboConditionSource } from '../../../../tools/game-data-compiler/src/compiler/conditions/comboSkillConditions.ts';
import { parseDamageActionSource } from '../../../../tools/game-data-compiler/src/source/damageActions.ts';
import { parseUnityComboSkillConditionsSource } from '../../../../tools/game-data-compiler/src/source/unityComboSkillConditions.ts';
import { fixtureGameplayTagRegistry } from '../../../../tools/game-data-compiler/test/gameplayTagFixtures.ts';
import {
  scalarFixture,
  targetFixture,
} from '../../../../tools/game-data-compiler/test/sourceFixtures.ts';
import { unityComboConditionFixture } from '../../../../tools/game-data-compiler/test/unityComboConditionFixture.ts';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import { skillSettings } from '../../../data/combat/skillSettings';
import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import { compileActionSequence } from '../../compiler/compileSkill';
import type { ActionSequenceDefinition } from '../../game-data/operatorDefinition';
import { validateSkillDefinition } from '../../game-data/validateSkillDefinition';
import { TargetContextOperationExecutor } from '../abilities/targetContextOperationExecutor';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { ActionBlackboardOperationExecutor } from '../actions/actionBlackboardOperationExecutor';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { ATTRIBUTE_MODIFIER_SOURCES } from '../state/foundationState';
import {
  attributeModifierValues,
  createCombatAttributeModifier,
} from '../attributes/combatAttributes';
import { BuffDefinitionOperationTarget } from '../buffs/buffDefinitionOperationTarget';
import { BuffOperationExecutor } from '../buffs/buffOperationExecutor';
import type { CombatBuffDefinitionsDocument } from '../buffs/combatBuffDefinitions';
import { POISE_BREAK_BUFF_ID } from '../buffs/poiseBreakBuffRuntime';
import { CombatSemanticEventRuntime } from '../events/combatSemanticEventRuntime';
import { EventContextConditionExecutor } from '../events/eventContextConditionExecutor';
import { ELEMENTAL_INFLICTION_EVENTS } from '../infliction/elementalInflictionOperationExecutor';
import type { SkillSettingsDocument } from '../infliction/skillSettings';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatResources } from '../resources/combatResources';
import { CombatVitalsConditionExecutor } from '../resources/combatVitalsConditionExecutor';
import { createEnemyCombatVitals } from '../resources/combatVitalsFactory';
import type { PendingComboCondition } from '../skills/comboSkillConditionRuntime';
import { CombatClock } from '../time/combatClock';
import type {
  CombatEnemyProgram,
  CombatOperationExecutorContext,
  EquipmentEventOperationExecutorContext,
} from './combatRuntimeAssembly';
import { CombatRuntimeAssembly } from './combatRuntimeAssembly';
import { StandardPlayerDamageEnvironment } from './standardPlayerDamageEnvironment';

it('发布链的连携准入不因完整事件收窄而放开增强/普通结束通知', () => {
  const environment = createEnvironment();
  environment.runtimeOptions.createOperationExecutor(createContext());
  const target = environment.runtimeOptions.enemyBuffRuntime;
  if (!(target instanceof BuffDefinitionOperationTarget)) throw new Error('fixture');
  const notifications: string[] = [];
  environment
    .eventsFor('enemy')
    .registerCallback('buffEnhanceChanged', () => notifications.push('enhance'));
  environment
    .eventsFor('enemy')
    .registerCallback('finishedBuff', () => notifications.push('finish'));
  const combo = vi.spyOn(environment.comboConditions, 'onAbilityEvent');
  const definition = { id: 'admission', stackingType: 'enhance' as const, maxStackCount: 2 };
  const buff = target.container.add(definition, 'operator')!;
  target.container.add(definition, 'operator');
  buff.finish('other', null);
  expect(notifications).toEqual(['enhance', 'enhance', 'finish', 'enhance']);
  expect(
    combo.mock.calls.some(([event]) =>
      ['buffEnhanceChanged', 'finishedBuff'].includes(event.event),
    ),
  ).toBe(false);
});

const damageStep: ResolvedCombatStepForKind<'dealDamage'> = {
  kind: 'dealDamage',
  parameters: { damageType: 'electric', attackScale: 1, tags: ['normalSkill'] },
};

it.each([
  ['heat', 'fire', 'Fire', 'fireBurst'],
  ['electric', 'pulse', 'Pulse', 'electricBurst'],
  ['cryo', 'cryst', 'Cryst', 'cryoBurst'],
  ['nature', 'natural', 'Natural', 'natureBurst'],
] as const)(
  '生成的%s爆发独占完整生命周期，重复施加仍各结算一次',
  (element, idPart, burstType, tag) => {
    const buffId = `buff_common_${idPart}_${idPart}_triggered`;
    const base = createContext();
    const context: CombatOperationExecutorContext = {
      ...base,
      buffDefinitions: {
        [buffId]: {
          stackingType: 'unlimited',
          priority: 0,
          durationSeconds: 5,
          triggerIntervalSeconds: 1,
          waitFirstTriggerInterval: true,
          maxTriggerCount: 1,
          lifecycleSequences: {
            trigger: compileActionSequence(
              {
                steps: [
                  { kind: 'triggerSpellBurst', parameters: { burstType } },
                  {
                    kind: 'dealDamage',
                    parameters: { damageType: element, attackScale: 1, tags: [tag] },
                  },
                ],
              },
              1,
            ),
          },
        },
      },
    };
    // 故意不提供旧聚合入口的 SkillSetting：若误执行兼容回调，测试必须失败。
    const environment = new StandardPlayerDamageEnvironment({
      ...createEnvironment().options,
      elementalInflictionDocument: elementalAttachments,
    });
    bindBattleWithoutProjectiles(environment, context);
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const target = environment.runtimeOptions.enemyBuffRuntime;
    if (!(target instanceof BuffDefinitionOperationTarget))
      throw new Error('missing enemy Buff runtime');
    const sources: string[] = [];
    target.configureLifecycleOperations(source => {
      sources.push(source.sourceId);
      return executor;
    });
    const events: string[] = [];
    environment
      .eventsFor('operator')
      .registerAction('beforeOutputSpellBurst', 0, () => events.push('source'));
    environment
      .eventsFor('enemy')
      .registerAction('beforeTakeSpellBurst', 0, () => events.push('target'));
    // 首次建立附着，随后两次同元素输入分别触发爆发，原有附着不会被同元素爆发消费。
    for (let index = 0; index < 3; index++) {
      executor.execute({
        kind: 'applyElementalInfliction',
        parameters: { element, isExtra: false },
      });
    }
    const receipt = context.receipt as CombatReceiptCollector;
    expect(receipt.entries.filter(entry => entry.event === 'DamageApplied')).toHaveLength(0);
    for (let frame = 0; frame < 61; frame++) target.advanceFrame();
    expect(events).toEqual(['source', 'target', 'source', 'target']);
    expect(sources.length).toBeGreaterThan(0);
    expect(new Set(sources)).toEqual(new Set(['operator']));
    expect(receipt.entries.filter(entry => entry.event === 'DamageApplied')).toHaveLength(2);
    expect(
      receipt.entries
        .filter(entry => entry.event === 'DamageApplied')
        .map(entry => entry.data?.spellBurstType),
    ).toEqual([burstType, burstType]);
    for (let frame = 0; frame < 300; frame++) target.advanceFrame();
    expect(receipt.entries.filter(entry => entry.event === 'DamageApplied')).toHaveLength(2);
  },
);

const testEnemy: CombatEnemyProgram = {
  source: { kind: 'custom', level: 90 },
  rank: 'mob',
  health: 10000,
  superArmor: 0,
  defenderAttributes: {
    defense: 200,
    shelterDamageMultiplier: 0,
    breakingAttackDamageTakenMultiplier: 1,
    resistances: {
      physical: { percent: 0, damageTakenMultiplier: 1 },
      heat: { percent: 0, damageTakenMultiplier: 1 },
      electric: { percent: 20, damageTakenMultiplier: 1 },
      cryo: { percent: 0, damageTakenMultiplier: 1 },
      nature: { percent: 0, damageTakenMultiplier: 1 },
      ether: { percent: 0, damageTakenMultiplier: 1 },
    },
  },
  stagger: {
    maximum: 300,
    knotThresholds: [0.5],
    knotBreakDurationFrames: 60,
    brokenDurationFrames: 300,
    finisherSpRecovery: 100,
  },
};

function createContext(): CombatOperationExecutorContext {
  return {
    program: {
      operatorId: 'operator',
      skillGroupKey: 'battleSkill',
      skillId: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 1,
      initialBlackboard: {},
      timelineBlockFrames: 1,
      costs: [],
      timelineActions: [],
    },
    enemy: testEnemy,
    panel: {
      operatorId: 'operator',
      level: 1,
      attributes: { strength: 0, agility: 0, intellect: 0, will: 0 },
      attack: 700,
      attackBeforeAttributeScalar: 700,
      mainAttribute: 'intellect',
      secondaryAttribute: 'will',
      health: 5000,
      defense: 0,
      criticalRate: 0.15,
      criticalDamage: 0.6,
      artsIntensity: 0,
      ultimateEnergyGainEfficiency: 1,
      skillCooldownReduction: 0,
      staggerDamagePercent: 0,
      combatModifiers: [
        { kind: 'damageBonus', damageTypes: 'electric', skillTypes: 'battleSkill', value: 0.2 },
      ],
      receipt: [],
    },
    equipmentContributions: [],
    clock: new CombatClock(),
    resources: new CombatResources({
      sp: 0,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: false,
      normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
      squad: [],
    }),
    receipt: new CombatReceiptCollector(),
    semanticEvents: new CombatSemanticEventRuntime(),
  };
}

/** 本组隔离用例不发射投射物；新增相关动作时必须换实际宿主，不能靠空回调漏执行。 */
function bindBattleWithoutProjectiles(
  environment: StandardPlayerDamageEnvironment,
  context: CombatOperationExecutorContext,
): BoundCombatBattleRuntimes {
  return environment.runtimeOptions.bindBattleRuntime!({
    enemy: context.enemy,
    clock: context.clock,
    resources: context.resources,
    receipt: context.receipt,
    resolveProjectileRuntimeDependencies: () => ({
      launchProjectile: () => {
        throw new Error('fixture does not support projectile launches');
      },
      createCallbackSkillHost: () => {
        throw new Error('fixture does not support callback skills');
      },
    }),
  })!;
}

function createEnvironment(
  enemy: CombatEnemyProgram = testEnemy,
  criticalSample = 1,
  randomMode?: 'expected' | 'sampled',
): StandardPlayerDamageEnvironment {
  return new StandardPlayerDamageEnvironment({
    criticalSamples: { nextCriticalSample: () => criticalSample },
    ...(randomMode === undefined ? {} : { randomMode }),
    resolveNonRandomRuntimeSnapshot: () => ({
      runtimeExtensionMultiplier: 1,
      appliesIgniteDamageMultiplier: false,
      appliesPhysicalInflictionDamageMultiplier: false,
    }),
    enemyVitals: createEnemyCombatVitals(enemy),
  });
}

function createEquipmentContext(): EquipmentEventOperationExecutorContext {
  const { program: _program, equipmentContributions: _contributions, ...battle } = createContext();
  return {
    ...battle,
    operatorId: 'operator',
    source: { kind: 'weaponTrait', slug: 'fixture', traitKey: 'effect' },
    handlerKey: 'additional-hit',
    event: {
      event: 'afterOutputPhysicalInfliction',
      payload: {
        sourceId: 'operator',
        targetId: 'enemy',
        type: 'airborne',
      },
    },
  };
}

it('原生爆发事件不隐式造成伤害，后续 DamageAction 只结算一次', () => {
  const context = createContext();
  // 不提供 SkillSetting，事件动作本身不应依赖伤害倍率目录。
  const environment = new StandardPlayerDamageEnvironment({
    ...createEnvironment().options,
    elementalInflictionDocument: elementalAttachments,
  });
  const executor = environment.runtimeOptions.createOperationExecutor(context);
  const events: string[] = [];
  environment
    .eventsFor('operator')
    .registerAction('beforeOutputSpellBurst', 0, () => events.push('source'));
  environment
    .eventsFor('enemy')
    .registerAction('beforeTakeSpellBurst', 0, () => events.push('target'));
  const samples = vi.spyOn(environment.options.criticalSamples, 'nextCriticalSample');
  const initialHealth = environment.enemyVitals.health;
  expect(
    executor.execute({ kind: 'triggerSpellBurst', parameters: { burstType: 'Natural' } }),
  ).toBe(true);
  expect(events).toEqual(['source', 'target']);
  expect(samples).not.toHaveBeenCalled();
  expect(environment.enemyVitals.health).toBe(initialHealth);
  const receipt = context.receipt as CombatReceiptCollector;
  expect(
    receipt.entries.some(
      entry => entry.event === 'DamageApplied' || entry.event === 'SpellBurstApplied',
    ),
  ).toBe(false);
  executor.execute(damageStep);
  expect(receipt.entries.filter(entry => entry.event === 'DamageApplied')).toHaveLength(1);
});

it.each([
  ['buff', true],
  ['buff', false],
  ['burst', true],
] as const)('%s伤害共用双方乘区，canCritical=%s保留随机数边界', (route, canCritical) => {
  const environment = new StandardPlayerDamageEnvironment({
    ...createEnvironment().options,
    spellInflictionSettings: createSkillSettings(),
    elementalInflictionDocument: {
      schemaVersion: 1,
      revision: 'damage-pipeline-test',
      buffs: [
        {
          id: 'attachment.pipeline',
          stackingType: 'unlimited',
          role: { kind: 'elementalAttachment', element: 'electric' },
          spellBurst: {
            burstType: 'Pulse',
            damageType: 'electric',
            skillSettingDataKey: '法术爆发伤害倍率',
            skillSettingColumn: 1,
            atkScaleBase: 50,
          },
          actions: {
            start:
              route === 'burst'
                ? [{ kind: 'triggerSpellBurst', burstType: 'Pulse' }]
                : [
                    {
                      kind: 'dealAttackScaledDamage',
                      damageType: 'electric',
                      attackScale: 1,
                      tags: ['electricAbnormal'],
                      features: [],
                      canCritical,
                    },
                  ],
          },
        },
      ],
    },
  });
  const context = createContext();
  const executor = environment.runtimeOptions.createOperationExecutor(context);
  const source = environment.runtimeOptions.createOperatorBuffRuntime!(
    'operator',
    context.panel,
    [],
  );
  if (!(source instanceof BuffDefinitionOperationTarget)) throw new Error('fixture');
  source.container.add(
    {
      id: 'source-scale',
      stackingType: 'unlimited',
      attributeModifiers: [
        {
          attribute: 'electricDamageIncrease',
          timing: 'runtime',
          values: attributeModifierValues('baseAddition', 0.5),
        },
      ],
      damageModifiers: [
        {
          enabledSide: 'attacker',
          processors: [{ kind: 'damageScale', side: 'attacker', zone: 'normal', addition: 0.2 }],
        },
      ],
    },
    'operator',
  );
  const target = environment.runtimeOptions.enemyBuffRuntime;
  if (!(target instanceof BuffDefinitionOperationTarget)) throw new Error('fixture');
  target.container.add(
    {
      id: 'target-scale',
      stackingType: 'unlimited',
      damageModifiers: [
        {
          enabledSide: 'defender',
          processors: [{ kind: 'damageScale', side: 'defender', zone: 'normal', addition: 0.3 }],
        },
      ],
    },
    'operator',
  );
  const samples = vi.spyOn(environment.options.criticalSamples, 'nextCriticalSample');
  const absorb = vi
    .spyOn(target.container, 'absorbDamage')
    .mockImplementation((_type, value) => value / 2);
  const initialHealth = environment.enemyVitals.health;
  const preparation = vi.fn();
  environment.eventsFor('operator').registerAction('beforeDamageAction', 0, preparation);
  const skillBlackboard = new ActionBlackboard();
  executor.execute(
    {
      kind: 'applyElementalInfliction',
      parameters: { element: 'electric', isExtra: false },
    },
    {
      blackboard: skillBlackboard,
      skillCastInfo: {
        skillCastId: 42,
        originSkillId: 'attachment-source',
        originSkillType: 'battleSkill',
        nonReturnedSpCost: 100,
      },
    },
  );
  const entries = (context.receipt as CombatReceiptCollector).entries;
  const hit = entries.find(e => e.event === 'DamageApplied')!;
  expect(hit.data?.damageScaleMultiplier).toBeCloseTo(2.21);
  expect(absorb).toHaveBeenCalledOnce();
  expect(absorb.mock.calls[0]![0]).toBe('electric');
  expect(hit.data?.actualDamage).toBeCloseTo(absorb.mock.calls[0]![1] / 2);
  expect(initialHealth - environment.enemyVitals.health).toBeCloseTo(
    Number(hit.data?.actualDamage),
  );
  if (route === 'buff') {
    expect(hit.data?.buffId).toBe('attachment.pipeline');
    expect(hit.data?.canCritical).toBe(canCritical);
  } else expect(hit.data?.spellBurstType).toBe('Pulse');
  expect(preparation).toHaveBeenCalledOnce();
  expect(preparation.mock.calls[0]![0].payload.skillCastId).toBe(42);
  expect(skillBlackboard.snapshot()).toEqual({});
  expect(samples).toHaveBeenCalledTimes(canCritical ? 1 : 0);
  expect(
    entries.find(e => e.event === (route === 'buff' ? 'BuffDamageApplied' : 'SpellBurstApplied'))
      ?.data?.actualDamage,
  ).toBe(hit.data?.actualDamage);
});

it.each([15, 0, -1])('腐蚀输出收集仅延长正时长%s，并只提高减抗上限', duration => {
  const environment = createEnvironment();
  environment.runtimeOptions.createOperationExecutor(createContext());
  environment.runtimeOptions.createOperatorBuffRuntime!('operator', createContext().panel, [
    { reaction: 'corrosion', durationSecondsAddition: 10, effectivenessAddition: 0.2 },
  ]);
  const target = environment.runtimeOptions.enemyBuffRuntime;
  if (!(target instanceof BuffDefinitionOperationTarget)) throw new Error('fixture');
  const input = {
    duration,
    max_def_decrease: 0.2,
    start_def_decrease: 0.05,
    def_decrease_tick: 0.01,
  };
  target.apply({
    buffId: 'collected-corrosion',
    sourceId: 'operator',
    blackboardValues: input,
    definition: {
      stackingType: 'stack',
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: ['Skill/Character/Common/SpellStatus/Corrupt'],
    },
  });
  const buff = target.container.buffs[0]!;
  expect(buff.blackboard.getNumber('duration')).toBe(duration > 0 ? duration + 10 : duration);
  expect(buff.blackboard.getNumber('max_def_decrease')).toBeCloseTo(0.24);
  expect(buff.blackboard.getNumber('start_def_decrease')).toBe(0.05);
  expect(buff.blackboard.getNumber('def_decrease_tick')).toBe(0.01);
  expect(input.duration).toBe(duration);
});

it('反应工厂创建的腐蚀也经过公共收集，时长与上限不会重复加成', () => {
  // 使用明确的工厂输入隔离创建链，不依赖某个干员战技是否实际施加附着。
  const values = {
    duration: 15,
    max_def_decrease: 0.2,
    start_def_decrease: 0.05,
    def_decrease_tick: 0.01,
  };
  const environment = new StandardPlayerDamageEnvironment({
    criticalSamples: { nextCriticalSample: () => 1 },
    resolveNonRandomRuntimeSnapshot: () => ({
      runtimeExtensionMultiplier: 1,
      appliesIgniteDamageMultiplier: false,
      appliesPhysicalInflictionDamageMultiplier: false,
    }),
    enemyVitals: createEnemyCombatVitals(testEnemy),
    spellInflictionSettings: skillSettings,
    elementalInflictionDocument: {
      schemaVersion: 1,
      revision: 'test',
      buffs: [
        {
          id: 'attachment.electric',
          stackingType: 'enhanceAndRefresh',
          durationSeconds: 10,
          role: { kind: 'elementalAttachment', element: 'electric' },
        },
        {
          id: 'status.corrosion',
          stackingType: 'stack',
          durationSeconds: { blackboardKey: 'duration' },
          applyTags: ['Skill/Character/Common/SpellStatus/Corrupt'],
          role: { kind: 'compoundStatus', consumedElement: 'electric', incomingElement: 'nature' },
        },
      ],
    },
    compoundStatusFactories: {
      schemaVersion: 1,
      revision: 'test',
      factories: [
        {
          id: 'factory.corrosion',
          consumedElement: 'electric',
          incomingElement: 'nature',
          durationSeconds: 0.1,
          blackboard: values,
          skillSettingLookups: [],
          createdBuff: {
            buffId: 'status.corrosion',
            blackboardAssignments: Object.keys(values).map(key => ({
              targetKey: key,
              inputKey: key,
            })),
          },
        },
      ],
    },
  });
  const context = createContext();
  const executor = environment.runtimeOptions.createOperationExecutor(context);
  environment.runtimeOptions.createOperatorBuffRuntime!('operator', context.panel, [
    { reaction: 'corrosion', durationSecondsAddition: 10, effectivenessAddition: 0.2 },
  ]);
  for (const element of ['electric', 'nature'] as const) {
    expect(
      executor.execute({
        kind: 'applyElementalInfliction',
        parameters: { element, isExtra: false },
      }),
    ).toBe(true);
  }
  const target = environment.runtimeOptions.enemyBuffRuntime;
  if (!(target instanceof BuffDefinitionOperationTarget)) throw new Error('fixture');
  const buff = target.container.buffs.find(
    buff => buff.blackboard.getNumber('max_def_decrease') !== undefined,
  )!;
  expect(buff).toBeDefined();
  expect(buff.blackboard.getNumber('duration')).toBe(25);
  expect(buff.blackboard.getNumber('max_def_decrease')).toBeCloseTo(0.24);
  expect(buff.blackboard.getNumber('start_def_decrease')).toBe(0.05);
  expect(buff.blackboard.getNumber('def_decrease_tick')).toBe(0.01);
});

it.each(['criticalRate', 'criticalDamageIncrease'] as const)(
  '即时 %s 最终乘法作用于完整面板，结束后下一击恢复',
  attribute => {
    const original = createContext();
    const context = {
      ...original,
      program: { ...original.program, statModifiers: { criticalRate: 0.3 } },
    };
    const environment = createEnvironment(testEnemy, 0.1);
    const samples = vi.spyOn(environment.options.criticalSamples, 'nextCriticalSample');
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const blackboard = new ActionBlackboard({ multiplier: 0, atk_scale_lance: 1 });
    const runtime = new CombatActionSequenceRuntime(executor, { blackboard });
    // 原生形状 → 公共投影 → 正式编译 → 实际环境；不用手写运行时修正绕过生成链。
    const raw = {
      $type: 'Beyond.Gameplay.Core.DamageAction+DamageActionData, Gameplay.Beyond',
      isEnable: true,
      priorityLevel: 'Default',
      priorityOffset: 0,
      serverActionIndex: 0,
      alwaysNext: true,
      attacker: 'ActionSource',
      targetSettings: targetFixture('Target'),
      effectSource: targetFixture('Source'),
      hitEnvironment: false,
      hitEnvData: {},
      damageUnits: [
        {
          damageType: 'Physical',
          damageAttributeType: 'Hp',
          simpleCalculation: true,
          atkScale: scalarFixture(0, 'atk_scale_lance'),
          takeAtkSnapshot: false,
          damageDecorateMask: 0,
          controlEffectRoll: true,
          onlyEnableForMainChar: false,
          damageProcessors: [],
          ignoreDamageImmuneLevel: 'None',
          ignorePoiseImmune: false,
          reduceDamageForGuard: false,
          reduceDamageForGuardRatio: 1,
          gainCost: false,
          costDataList: [],
          playDefaultHitEffect: false,
          playHitEffect: false,
          effectData: {},
          playHitSound: false,
          hitSoundData: {},
          playHitFlashEffect: false,
          hideMainCharHpScreenEffect: false,
          hidePoiseUIEffect: false,
          enablePoiseBreakTimeDilation: false,
          damageVisualImportance: 'Level0',
          enableDamageVisualCoalition: false,
          damageVisualCoalitionGroupKey: '',
          alwaysStartNewCoalition: false,
          alwaysEndCoalition: false,
          updatePositionOnCoalition: false,
        },
      ],
    };
    const projected = compileEventTargetSimpleDamageOperationSource(
      parseDamageActionSource(
        {
          ...raw,
          damageUnits: [
            {
              ...raw.damageUnits[0]!,
              damageProcessors: [
                {
                  $type: 'Beyond.Gameplay.Core.InstantModifyAttribute, Gameplay.Beyond',
                  modifyTargetSide: 'Attacker',
                  modifier: {
                    modifyAttributeType: 'Specific',
                    attributeType:
                      attribute === 'criticalRate' ? 'CriticalRate' : 'CriticalDamageIncrease',
                    formulaItem: 'FinalMultiplier',
                    param: scalarFixture(0, 'multiplier'),
                  },
                },
              ],
            },
          ],
        },
        'critical.damage',
        {},
      ),
      'critical.damage',
    );
    const sequence = runtime.createSequence(compileActionSequence({ steps: [projected] }, 1));
    sequence.executeInstant({});
    expect(samples).toHaveBeenCalledTimes(attribute === 'criticalRate' ? 0 : 1);
    executor.execute(damageStep);
    blackboard.assignDynamic('multiplier', 1);
    sequence.executeInstant({});
    const hits = (context.receipt as CombatReceiptCollector).entries.filter(
      entry => entry.event === 'DamageApplied',
    );
    expect(hits).toHaveLength(3);
    expect(hits[0]!.data?.criticalMultiplier).toBe(1);
    expect(hits[0]!.data?.isCritical).toBe(attribute !== 'criticalRate');
    expect(hits[1]!.data?.criticalMultiplier).toBe(1.6);
    expect(hits[2]!.data?.criticalMultiplier).toBe(1.6);
    expect(samples).toHaveBeenCalledTimes(attribute === 'criticalRate' ? 2 : 3);
  },
);

it.each(['burst', 'buff'] as const)(
  '%s 旁路读取完整暴击属性，不重复加入面板或继承技能加成',
  route => {
    const run = (sample: number, finalMultiplier: number, canCritical = true) => {
      const nextCriticalSample = vi.fn(() => sample);
      const base = createContext();
      const context = {
        ...base,
        program: { ...base.program, statModifiers: { criticalRate: 0.8 } },
      };
      const environment = new StandardPlayerDamageEnvironment({
        criticalSamples: { nextCriticalSample },
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        enemyVitals: createEnemyCombatVitals(testEnemy),
        spellInflictionSettings: createSkillSettings(),
        elementalInflictionDocument: {
          schemaVersion: 1,
          revision: 'critical-test',
          buffs: [
            {
              id: 'attachment.electric',
              stackingType: 'enhanceAndRefresh',
              stackingKey: 'attachment.electric',
              maxStackCount: 4,
              durationSeconds: 10,
              role: { kind: 'elementalAttachment', element: 'electric' },
            },
            {
              id: 'burst.electric',
              stackingType: 'unlimited',
              durationSeconds: 5,
              triggerIntervalSeconds: 1,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              role: { kind: 'elementalBurst', element: 'electric' },
              actions: {
                trigger:
                  route === 'burst'
                    ? [{ kind: 'triggerSpellBurst', burstType: 'Pulse' }]
                    : [
                        {
                          kind: 'dealAttackScaledDamage',
                          damageType: 'electric',
                          attackScale: 1,
                          tags: [],
                          features: [],
                          canCritical,
                        },
                      ],
              },
              spellBurst: {
                burstType: 'Pulse',
                damageType: 'electric',
                skillSettingDataKey: '法术爆发伤害倍率',
                skillSettingColumn: 1,
                atkScaleBase: 50,
              },
            },
          ],
        },
      });
      const executor = environment.runtimeOptions.createOperationExecutor(context);
      const owner = environment.runtimeOptions.createOperatorBuffRuntime!(
        'operator',
        context.panel,
      );
      if (!(owner instanceof BuffDefinitionOperationTarget))
        throw new Error('fixture Buff runtime');
      owner.container.attributes.addModifier(
        createCombatAttributeModifier(
          'criticalRate',
          attributeModifierValues('finalMultiplier', finalMultiplier),
          ATTRIBUTE_MODIFIER_SOURCES.buff,
          'runtime',
        ),
      );
      owner.container.attributes.addModifier(
        createCombatAttributeModifier(
          'criticalDamageIncrease',
          attributeModifierValues('finalMultiplier', 2),
          ATTRIBUTE_MODIFIER_SOURCES.buff,
          'runtime',
        ),
      );
      for (let i = 0; i < 2; i++)
        executor.execute({
          kind: 'applyElementalInfliction',
          parameters: { element: 'electric', isExtra: false },
        });
      for (let frame = 0; frame < 31; frame++)
        environment.runtimeOptions.enemyBuffRuntime.advanceFrame();
      const hits = (context.receipt as CombatReceiptCollector).entries.filter(
        entry => entry.event === 'DamageApplied',
      );
      expect(hits).toHaveLength(1);
      if (route === 'buff') {
        expect(hits[0]).toMatchObject({
          sourceId: 'operator',
          targetId: 'enemy',
          data: {
            buffId: 'burst.electric',
            buffOwnerId: 'enemy',
            buffInstanceId: expect.any(Number),
            sourceActionId: expect.any(String),
          },
        });
        expect(hits[0]!.data).toMatchObject({
          attack: 700,
          baseDamage: 700,
          finalAttackValue: 700,
          standardCalculation: true,
          canCritical,
          skillMultiplierPercent: 100,
          enemyDefense: 200,
          enemyResistancePercent: 20,
          criticalDamageIncrease: 1.2,
        });
        const detail = hits[0]!.data!;
        expect(detail.nonCriticalDamage).toBeCloseTo((700 / 3) * 0.8);
        expect(detail.expectedDamage).toBeCloseTo(
          Number(detail.nonCriticalDamage) * Number(detail.criticalExpectationMultiplier),
        );
        if (!canCritical) {
          expect(nextCriticalSample).not.toHaveBeenCalled();
          expect(detail).toMatchObject({ criticalRate: 0, criticalExpectationMultiplier: 1 });
          expect(detail.expectedDamage).toBe(detail.nonCriticalDamage);
        }
        const audits = (context.receipt as CombatReceiptCollector).entries.filter(
          entry => entry.event === 'BuffDamageApplied',
        );
        expect(audits).toHaveLength(1);
        const applied = (context.receipt as CombatReceiptCollector).entries.find(
          entry => entry.event === 'BuffApplied' && entry.data?.buffId === 'burst.electric',
        );
        expect(applied).toBeDefined();
        expect(hits[0]!.data!.buffInstanceId).toBe(applied!.data!.instanceId);
        expect(hits[0]!.data!.buffOwnerId).toBe(applied!.targetId);
        expect(hits[0]!.data!.sourceActionId).toBe(applied!.data!.sourceActionId);
        for (const key of ['buffId', 'buffOwnerId', 'buffInstanceId', 'sourceActionId']) {
          expect(audits[0]!.data![key]).toBe(hits[0]!.data![key]);
        }
      } else {
        expect(hits[0]!.data).not.toHaveProperty('buffInstanceId');
      }
      if (finalMultiplier === 0) expect(nextCriticalSample).not.toHaveBeenCalled();
      return hits[0]!.data;
    };
    expect(run(0.2, 1)).toMatchObject({ isCritical: false, criticalMultiplier: 1 });
    expect(run(0.1, 1)).toMatchObject({ isCritical: true, criticalMultiplier: 2.2 });
    expect(run(0.1, 0)).toMatchObject({ isCritical: false, criticalMultiplier: 1 });
    if (route === 'buff')
      expect(run(0.1, 1, false)).toMatchObject({ isCritical: false, criticalMultiplier: 1 });
  },
);

it('技能编译保留即时 Atk 修正，只影响当前命中且每次读取当前黑板', () => {
  const context = createContext();
  const environment = createEnvironment();
  const executor = environment.runtimeOptions.createOperationExecutor(context);
  const blackboard = new ActionBlackboard({ bonus: 0.5 });
  const compiled = compileActionSequence(
    {
      steps: [
        {
          kind: 'dealDamage',
          parameters: {
            ...damageStep.parameters,
            instantAttributeModifiers: [
              {
                targetSide: 'attacker',
                attribute: 'Atk',
                slot: 'baseMultiplier',
                value: { kind: 'blackboard', key: 'bonus' },
                attributeTiming: 'runtime',
              },
            ],
          },
        },
      ],
    },
    1,
  );
  const runtime = new CombatActionSequenceRuntime(executor, { blackboard });
  const sequence = runtime.createSequence(compiled);
  sequence.executeInstant({});
  executor.execute(damageStep);
  blackboard.assignDynamic('bonus', 1);
  sequence.executeInstant({});
  executor.execute(damageStep);
  const hits = (context.receipt as CombatReceiptCollector).entries.filter(
    entry => entry.event === 'DamageApplied',
  );
  // 基础攻击 700、战技增伤 20%、防御除以 3、电抗 20%。即时攻击不残留到下一击。
  const base = ((700 * 1.2) / 3) * 0.8;
  expect(hits).toHaveLength(4);
  for (const [index, scale] of [1.5, 1, 2, 1].entries()) {
    expect(hits[index]!.data?.value).toBeCloseTo(base * scale);
  }
});

it('装备末端从真实配装上下文结算伤害，不继承触发技能或发送伪技能命中', () => {
  const environment = createEnvironment();
  const context = {
    ...createEquipmentContext(),
    semanticEvents: new CombatSemanticEventRuntime(
      environment.runtimeOptions.registerCombatAbilityEvent,
    ),
  };
  const events: unknown[] = [];
  environment
    .eventsFor('operator')
    .registerAction('outputDamage', 0, event => events.push(event.payload));
  let skillHits = 0;
  context.semanticEvents.register({
    ownerOperatorId: 'operator',
    trigger: { kind: 'skillHit', skillGroupKey: 'battleSkill', scope: 'operator' },
    phase: 'dataAction',
    handle: () => {
      skillHits += 1;
    },
  });
  const executor = environment.runtimeOptions.createEquipmentEventOperationExecutor!(context);
  executor.execute(
    { ...damageStep, parameters: { ...damageStep.parameters, tags: [] } },
    {
      blackboard: new ActionBlackboard(),
      eventSkillCastInfo: {
        skillCastId: 42,
        originSkillId: 'trigger-skill',
        originSkillType: 'battleSkill',
        nonReturnedSpCost: 100,
      },
    },
  );
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({ skillCastInfo: null });
  const hit = (context.receipt as CombatReceiptCollector).entries.find(
    entry => entry.event === 'DamageApplied',
  )!;
  expect(hit.data?.value).toBeCloseTo((700 / 3) * 0.8);
  expect(hit.data?.sourceActionId).toBe('equipment:weaponTrait:fixture:additional-hit');
  expect(hit.data?.castId).toBeUndefined();
  expect(hit.data?.skillType).toBeUndefined();
  expect(skillHits).toBe(0);
});

it('装备末端满血治疗仍按 output、receive 顺序发布事件，且不需要任何主动技能', () => {
  const context = createEquipmentContext();
  const environment = createEnvironment();
  const events: string[] = [];
  for (const event of ['outputHeal', 'receiveHeal'] as const) {
    environment.eventsFor('operator').registerAction(event, 0, current => {
      expect(current.payload).toMatchObject({
        requestedHealing: 100,
        actualHealing: 0,
        overhealing: 100,
      });
      events.push(event);
    });
  }
  const executor = environment.runtimeOptions.createEquipmentEventOperationExecutor!(context);
  expect(
    executor.execute({ kind: 'heal', parameters: { target: 'caster', amount: 100, tags: [] } }),
  ).toBe(true);
  expect(events).toEqual(['outputHeal', 'receiveHeal']);
});

it('按随机模式的暴击后效策略发布事件，并保留伤害动作的目标上下文', () => {
  const reached: string[] = [];
  const nonCritical = createEnvironment(testEnemy, 1);
  nonCritical
    .eventsFor('enemy')
    .registerAction('takeCriticalDamage', 0, () => reached.push('non-critical'));
  nonCritical
    .eventsFor('operator')
    .registerAction('outputCriticalDamage', 0, () => reached.push('non-critical-output'));
  expect(
    nonCritical.runtimeOptions.createOperationExecutor(createContext()).execute(damageStep),
  ).toBe(true);

  const critical = createEnvironment(testEnemy, 0);
  critical.eventsFor('enemy').registerAction('takeCriticalDamage', 0, event => {
    const { payload } = event;
    const result = (payload as { result: { isCritical: boolean } }).result;
    expect(result.isCritical).toBe(true);
    expect(resolveAbilityEventActionContextBinding(event)).toEqual({
      inputTargetId: 'operator',
      triggerTargetId: 'enemy',
    });
    reached.push('critical');
  });
  critical.eventsFor('operator').registerAction('outputCriticalDamage', 0, event => {
    const { payload } = event;
    const result = (payload as { result: { isCritical: boolean } }).result;
    expect(result.isCritical).toBe(true);
    expect(resolveAbilityEventActionContextBinding(event)).toEqual({
      inputTargetId: 'enemy',
      triggerTargetId: 'operator',
    });
    reached.push('critical-output');
  });
  expect(critical.runtimeOptions.createOperationExecutor(createContext()).execute(damageStep)).toBe(
    true,
  );

  const expected = createEnvironment(testEnemy, 1, 'expected');
  expected.eventsFor('enemy').registerAction('takeCriticalDamage', 0, event => {
    expect(event.payload.result.isCritical).toBe(false);
    expect(event.payload.triggersCriticalEffects).toBe(true);
    reached.push('expected');
  });
  expected.eventsFor('operator').registerAction('outputCriticalDamage', 0, event => {
    expect(event.payload.result.isCritical).toBe(false);
    expect(event.payload.triggersCriticalEffects).toBe(true);
    reached.push('expected-output');
  });
  expect(expected.runtimeOptions.createOperationExecutor(createContext()).execute(damageStep)).toBe(
    true,
  );

  expect(reached).toEqual(['critical', 'critical-output', 'expected', 'expected-output']);
});

function createInflictionEnvironment(): StandardPlayerDamageEnvironment {
  const document: CombatBuffDefinitionsDocument = {
    schemaVersion: 1,
    revision: 'test',
    buffs: [
      {
        id: 'attachment.electric',
        applyTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
        stackingType: 'enhanceAndRefresh',
        stackingKey: 'attachment.electric',
        maxStackCount: 4,
        durationSeconds: 10,
        role: { kind: 'elementalAttachment', element: 'electric' },
        actions: { afterEnhance: [{ kind: 'emitElementalInflictionStarted' }] },
      },
      {
        id: 'burst.electric',
        stackingType: 'unlimited',
        role: { kind: 'elementalBurst', element: 'electric' },
      },
      {
        id: 'attachment.heat',
        applyTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
        stackingType: 'enhanceAndRefresh',
        stackingKey: 'attachment.heat',
        maxStackCount: 4,
        durationSeconds: 10,
        role: { kind: 'elementalAttachment', element: 'heat' },
      },
      {
        id: 'status.electric.heat',
        stackingType: 'unlimited',
        role: {
          kind: 'compoundStatus',
          consumedElement: 'electric',
          incomingElement: 'heat',
        },
      },
    ],
  };
  return new StandardPlayerDamageEnvironment({
    criticalSamples: { nextCriticalSample: () => 1 },
    resolveNonRandomRuntimeSnapshot: () => ({
      runtimeExtensionMultiplier: 1,
      appliesIgniteDamageMultiplier: false,
      appliesPhysicalInflictionDamageMultiplier: false,
    }),
    elementalInflictionDocument: document,
    enemyVitals: createEnemyCombatVitals(testEnemy),
  });
}

/** 只有附着、没有爆发定义；重复施加时按严格定义失败。 */
function createAttachmentOnlyEnvironment(): StandardPlayerDamageEnvironment {
  const document: CombatBuffDefinitionsDocument = {
    schemaVersion: 1,
    revision: 'test',
    buffs: [
      {
        id: 'attachment.electric',
        stackingType: 'enhanceAndRefresh',
        stackingKey: 'attachment.electric',
        maxStackCount: 4,
        durationSeconds: 10,
        role: { kind: 'elementalAttachment', element: 'electric' },
      },
    ],
  };
  return new StandardPlayerDamageEnvironment({
    criticalSamples: { nextCriticalSample: () => 1 },
    resolveNonRandomRuntimeSnapshot: () => ({
      runtimeExtensionMultiplier: 1,
      appliesIgniteDamageMultiplier: false,
      appliesPhysicalInflictionDamageMultiplier: false,
    }),
    elementalInflictionDocument: document,
    enemyVitals: createEnemyCombatVitals(testEnemy),
  });
}

/** 假 SkillSetting：法术爆发伤害倍率第 1 列 = 1.5，无增强公式。 */
function createSkillSettings(): SkillSettingsDocument {
  return {
    schemaVersion: 1,
    revision: 'test',
    data: [
      {
        key: '法术爆发伤害倍率',
        values: [1.5, 2, 2.5, 3],
        enhanceFormulaKey: '',
      },
    ],
    enhanceFormulas: [],
  };
}

describe('StandardPlayerDamageEnvironment', () => {
  it.each(['heat', 'electric', 'cryo', 'nature'] as const)(
    '%s 五条真实条件由 assembly 自动注册，连续技能附着共享实体板且不重复安装',
    element => {
      for (const [deckGate, placeCombo] of [
        [0, true],
        [1, true],
        [0, false],
        [1, false],
      ] as const) {
        const context = createContext();
        const environment = new StandardPlayerDamageEnvironment({
          criticalSamples: { nextCriticalSample: () => 1 },
          resolveNonRandomRuntimeSnapshot: () => ({
            runtimeExtensionMultiplier: 1,
            appliesIgniteDamageMultiplier: false,
            appliesPhysicalInflictionDamageMultiplier: false,
          }),
          enemyVitals: createEnemyCombatVitals(testEnemy),
          elementalInflictionDocument: elementalAttachments,
          spellInflictionSettings: skillSettings,
        });
        const fixture = unityComboConditionFixture();
        const programs = parseUnityComboSkillConditionsSource(
          fixture.conditions,
          fixture.references,
          'fixture.combo',
        ).conditions.map((source, index) => {
          const compiled = compilePendingComboConditionSource(source, {
            gameplayTagRegistry: fixtureGameplayTagRegistry,
            actionOwnerTarget: 'caster',
            actionSourceTarget: 'caster',
            actionTargetTarget: 'eventTarget',
          });
          return {
            key: `${index}`,
            skillGroupKey: 'combo',
            skillKey: 'combo',
            event: compiled.event,
            immediately: source.immediately,
            initialValues: { consumed_type: 0, consumed_layer: 0 },
            sequence: compileActionSequence(compiled.sequence as ActionSequenceDefinition, 1),
          };
        });
        const pending: string[] = [];
        const combo = {
          ...context.program,
          operatorId: 'owner',
          skillGroupKey: 'combo',
          skillId: 'combo',
          skillType: 'comboSkill' as const,
          cooldownFrames: 300,
          costFrame: 0,
        };
        const assembly = new CombatRuntimeAssembly({
          ...environment.runtimeOptions,
          enemy: testEnemy,
          resources: context.resources.snapshot(),
          operators: [
            {
              operatorId: 'owner',
              panel: context.panel,
              // 零放置和重复放置拥有同一份常驻配置，均只安装五条条件。
              skillCooldownPrograms: [combo],
              skills: [combo],
              ...(placeCombo
                ? {
                    skillCasts: [
                      { castId: 'a', program: combo },
                      { castId: 'b', program: combo },
                    ],
                  }
                : {}),
              initialEntityBlackboard: {
                EntityBB_consumed_type: 0,
                EntityBB_wisd_greater_will: deckGate,
              },
              skillSlotGroups: [
                { skillGroupKey: 'combo', baseSkillKey: 'combo', replacementSkillKeys: [] },
              ],
              comboConditionPrograms: programs,
            },
            {
              operatorId: 'operator',
              panel: context.panel,
              skills: [
                {
                  ...context.program,
                  timelineActions: [
                    {
                      startFrame: 0,
                      sequence: {
                        steps: [
                          {
                            kind: 'applyElementalInfliction',
                            parameters: { element, isExtra: false },
                          },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          ],
          comboConditionEligibility: { isAlive: () => true, isSilenced: () => false },
          onPendingComboCondition: (ownerId, program, value) => {
            expect(ownerId).toBe('owner');
            expect(value).toMatchObject({
              inputTarget: { kind: 'operator', operatorId: 'operator' },
              triggerTarget: { kind: 'enemy' },
              assignPairs: { consumed_type: 0, consumed_layer: 0 },
            });
            pending.push(program.key);
          },
        });
        expect(assembly.tryStartSkill('operator', 'battleSkill')).toBe(true);
        expect(pending).toEqual([
          ...(element === 'nature' ? ['0'] : []),
          ...(deckGate === 0 ? ['4'] : []),
        ]);
        pending.length = 0;
        assembly.advanceFrame();
        expect(assembly.tryStartSkill('operator', 'battleSkill')).toBe(true);
        expect(pending).toEqual([
          { nature: '0', heat: '1', electric: '2', cryo: '3' }[element],
          ...(deckGate === 0 ? ['4'] : []),
        ]);
        const entity =
          environment.runtimeOptions.createOperatorBuffRuntime!('owner')!.entityBlackboard!;
        expect(entity.getNumber('EntityBB_consumed_type')).toBe(
          deckGate === 0 ? { heat: 0, electric: 1, cryo: 2, nature: 3 }[element] : 0,
        );
        assembly.disposeComboSkillConditions();
        assembly.disposeComboSkillConditions();
        pending.length = 0;
        assembly.advanceFrame();
        assembly.tryStartSkill('operator', 'battleSkill');
        expect(pending).toEqual([]);
      }
    },
  );
  it.each(['heat', 'electric', 'cryo', 'nature'] as const)(
    '%s 真实五条条件经 RID 来源/公共编译，在连续两次附着前查询旧层数',
    element => {
      for (const deckGate of [0, 1]) {
        const context = createContext();
        const environment = new StandardPlayerDamageEnvironment({
          criticalSamples: { nextCriticalSample: () => 1 },
          resolveNonRandomRuntimeSnapshot: () => ({
            runtimeExtensionMultiplier: 1,
            appliesIgniteDamageMultiplier: false,
            appliesPhysicalInflictionDamageMultiplier: false,
          }),
          enemyVitals: createEnemyCombatVitals(testEnemy),
          elementalInflictionDocument: elementalAttachments,
          spellInflictionSettings: skillSettings,
        });
        const executor = environment.runtimeOptions.createOperationExecutor(context);
        const terminal = {
          execute: () => {
            throw new Error('unexpected operation');
          },
          evaluate: () => {
            throw new Error('unexpected condition');
          },
        };
        const queries = new BuffOperationExecutor({
          sourceId: 'owner',
          resolveTarget: () => {
            throw new Error('wrong target channel');
          },
          resolveEventTarget: id => {
            expect(id).toBe('enemy');
            return environment.runtimeOptions.enemyBuffRuntime;
          },
          delegate: new TargetContextOperationExecutor('owner', terminal),
        });
        const operations = new ActionBlackboardOperationExecutor(
          new EventContextConditionExecutor(queries),
        );
        const fixture = unityComboConditionFixture();
        const source = parseUnityComboSkillConditionsSource(
          fixture.conditions,
          fixture.references,
          'fixture.combo',
        );
        const entity = new ActionBlackboard({
          EntityBB_consumed_type: 0,
          EntityBB_wisd_greater_will: deckGate,
        });
        const pending: number[] = [];
        source.conditions.forEach((condition, index) => {
          const compiled = compilePendingComboConditionSource(condition, {
            gameplayTagRegistry: fixtureGameplayTagRegistry,
            actionOwnerTarget: 'caster',
            actionSourceTarget: 'caster',
            actionTargetTarget: 'eventTarget',
          });
          expect(
            validateSkillDefinition({
              key: 'check',
              timelineBlockFrames: 1,
              scheduledSequences: [{ startFrame: 0, sequence: compiled.sequence }],
            }),
          ).toEqual([]);
          environment.comboConditions.registerPendingCondition({
            event: compiled.event,
            ownerId: 'owner',
            sourceId: 'owner',
            entityBlackboard: entity,
            initialValues: { consumed_type: 0, consumed_layer: 0 },
            sequence: compileActionSequence(compiled.sequence as ActionSequenceDefinition, 1),
            operations,
            isOwnerAlive: () => true,
            isOwnerSilenced: () => false,
            currentComboCooldown: () => ({ oneReady: true, maxPassedTime: 0, startCdFrame: 0 }),
            resolveTarget: id =>
              id === 'enemy' ? { kind: 'enemy' } : { kind: 'operator', operatorId: id },
            onPending: p => {
              pending.push(index);
              expect(p.assignPairs).toEqual({ consumed_type: 0, consumed_layer: 0 });
            },
          });
        });
        const step = {
          kind: 'applyElementalInfliction' as const,
          parameters: { element, isExtra: false },
        };
        executor.execute(step);
        expect(pending).toEqual([
          ...(element === 'nature' ? [0] : []),
          ...(deckGate === 0 ? [4] : []),
        ]);
        pending.length = 0;
        executor.execute(step);
        expect(pending).toEqual([
          { nature: 0, heat: 1, electric: 2, cryo: 3 }[element],
          ...(deckGate === 0 ? [4] : []),
        ]);
        expect(entity.getNumber('EntityBB_consumed_type')).toBe(
          deckGate === 0 ? { heat: 0, electric: 1, cryo: 2, nature: 3 }[element] : 0,
        );
      }
    },
  );

  it.each(['heat', 'electric', 'cryo', 'nature'] as const)(
    '%s 真实附着按 callback→action→combo 分派四阶段，前置检查先于 Buff 写入',
    element => {
      const context = createContext();
      const environment = new StandardPlayerDamageEnvironment({
        criticalSamples: { nextCriticalSample: () => 1 },
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        enemyVitals: createEnemyCombatVitals(testEnemy),
        elementalInflictionDocument: elementalAttachments,
        spellInflictionSettings: skillSettings,
      });
      const executor = environment.runtimeOptions.createOperationExecutor(context);
      const order: string[] = [];
      const pending: PendingComboCondition[] = [];
      const operations = new EventContextConditionExecutor({
        execute: () => {
          throw new Error('unexpected');
        },
        evaluate: () => {
          throw new Error('unexpected');
        },
      });
      const entity = new ActionBlackboard({ EntityBB_type: -1 });
      for (const type of ELEMENTAL_INFLICTION_EVENTS) {
        const publisher = type.includes('Output') ? 'operator' : 'enemy';
        environment
          .eventsFor(publisher)
          .registerCallback(type, () => order.push(`${type}:callback`));
        environment
          .eventsFor(publisher)
          .registerAction(type, 0, () => order.push(`${type}:action`));
        environment.comboConditions.registerPendingCondition({
          event: type,
          ownerId: 'owner',
          sourceId: 'owner',
          entityBlackboard: entity,
          initialValues: {},
          operations,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'eventInflictionElementIn',
                    elements: [element],
                    outputKey: 'EntityBB_type',
                  },
                },
                whenTrue: { steps: [] },
              },
            ],
          },
          isOwnerAlive: () => true,
          isOwnerSilenced: () => false,
          currentComboCooldown: () => ({ oneReady: true, maxPassedTime: 0, startCdFrame: 0 }),
          resolveTarget: id =>
            id === 'enemy' ? { kind: 'enemy' } : { kind: 'operator', operatorId: id },
          onPending: p => {
            order.push(`${type}:combo`);
            pending.push(p);
            const applied = (context.receipt as CombatReceiptCollector).entries.some(
              entry => entry.event === 'BuffApplied',
            );
            expect(applied).toBe(type.startsWith('after'));
            expect(entity.getNumber('EntityBB_type')).toBe(
              { heat: 0, electric: 1, cryo: 2, nature: 3 }[element],
            );
          },
        });
      }
      expect(
        executor.execute({
          kind: 'applyElementalInfliction',
          parameters: { element, isExtra: false },
        }),
      ).toBe(true);
      expect(order).toEqual(
        ELEMENTAL_INFLICTION_EVENTS.flatMap(type => [
          `${type}:callback`,
          `${type}:action`,
          `${type}:combo`,
        ]),
      );
      expect(pending).toHaveLength(4);
      expect(pending[1]).toMatchObject({
        inputTarget: { kind: 'operator', operatorId: 'operator' },
        triggerTarget: { kind: 'enemy' },
        assignPairs: {},
      });
    },
  );

  it('reads MaxUltimateSp from the bound combat resource ledger', () => {
    const environment = createEnvironment();
    const baseContext = createContext();
    const context = {
      ...baseContext,
      resources: new CombatResources({
        ...baseContext.resources.snapshot(),
        ultimateEnergySystemUnlocked: true,
        squad: [
          {
            operatorId: 'operator',
            ultimateEnergy: 40,
            maxUltimateEnergy: 80,
            ultimateEnergyGainMultiplier: 1,
            allowedUltimateEnergyRecoveryTags: null,
          },
        ],
      }),
    };
    environment.runtimeOptions.createOperationExecutor(context);

    expect(
      environment.runtimeOptions.readSourceAttributeValue?.('operator', {
        attribute: { kind: 'specific', key: 'maxUltimateEnergy' },
        stage: 'armedNonConverted',
        useFloor: false,
        divisor: { kind: 'constant', value: 1 },
        multiplier: { kind: 'constant', value: 1 },
        base: { kind: 'constant', value: 0 },
        targetKey: 'usp_step',
      }),
    ).toBe(80);
  });

  it('reads MaxHp from the bound operator health ledger', () => {
    const environment = createEnvironment();
    const context = createContext();
    environment.runtimeOptions.createOperationExecutor(context);

    expect(
      environment.runtimeOptions.readSourceAttributeValue?.('operator', {
        attribute: { kind: 'specific', key: 'maxHealth' },
        stage: 'finalNonConverted',
        useFloor: false,
        divisor: { kind: 'constant', value: 1 },
        multiplier: { kind: 'constant', value: 1 },
        base: { kind: 'constant', value: 0 },
        targetKey: 'max_hp',
      }),
    ).toBe(5000);
  });

  it('敌方来源读取敌方具体属性和最大生命值', () => {
    const environment = createEnvironment();
    environment.runtimeOptions.createOperationExecutor(createContext());
    const runtime = environment.runtimeOptions.enemyBuffRuntime;
    if (!(runtime instanceof BuffDefinitionOperationTarget))
      throw new Error('fixture enemy Buff runtime');
    runtime.container.attributes.addModifier(
      createCombatAttributeModifier(
        'cryoAbnormalDamageIncrease',
        attributeModifierValues('addition', 0.25),
        ATTRIBUTE_MODIFIER_SOURCES.buff,
        'runtime',
      ),
    );
    const read = environment.runtimeOptions.readSourceAttributeValue!;
    const request = {
      attribute: { kind: 'specific', key: 'cryoAbnormalDamageIncrease' },
      stage: 'finalNonConverted',
      useFloor: false,
      divisor: { kind: 'constant', value: 1 },
      multiplier: { kind: 'constant', value: 1 },
      base: { kind: 'constant', value: 0 },
      targetKey: 'cryo_damage_increase',
    } as const;

    expect(read('enemy', request)).toBeCloseTo(0.25);
    expect(
      read('enemy', {
        ...request,
        attribute: { kind: 'specific', key: 'maxHealth' },
      }),
    ).toBe(10000);
  });

  it('resolves an ability entity source back to its operator before reading panel attributes', () => {
    const environment = createEnvironment();
    const baseContext = createContext();
    environment.runtimeOptions.createOperationExecutor({
      ...baseContext,
      program: { ...baseContext.program, operatorId: 'ability-entity:1' },
      sourceOperatorId: 'operator',
      resolveAbilitySystemSourceId: id => (id === 'ability-entity:1' ? 'operator' : id),
    });

    expect(
      environment.runtimeOptions.readSourceAttributeValue?.('ability-entity:1', {
        attribute: { kind: 'specific', key: 'maxHealth' },
        stage: 'finalNonConverted',
        useFloor: false,
        divisor: { kind: 'constant', value: 1 },
        multiplier: { kind: 'constant', value: 1 },
        base: { kind: 'constant', value: 0 },
        targetKey: 'max_hp',
      }),
    ).toBe(5000);
  });

  it('副属性快照在执行时读取非转换阶段，并保留技能黑板乘加公式', () => {
    const environment = createEnvironment();
    const baseContext = createContext();
    if (baseContext.panel === undefined) throw new Error('fixture panel');
    const context = {
      ...baseContext,
      panel: {
        ...baseContext.panel,
        attributes: { ...baseContext.panel.attributes, will: 100 },
      },
    };
    environment.runtimeOptions.createOperationExecutor(context);
    const runtime = environment.runtimeOptions.createOperatorBuffRuntime?.(
      'operator',
      context.panel,
    );
    if (!(runtime instanceof BuffDefinitionOperationTarget))
      throw new Error('fixture Buff runtime');
    const read = environment.runtimeOptions.readSourceAttributeValue!;
    const blackboard = new ActionBlackboard({ sub_ratio: 0.02 });
    const executor = new ActionBlackboardOperationExecutor(
      {
        execute: () => false,
        evaluate: () => false,
      },
      undefined,
      { sourceId: 'operator', read },
    );
    const parameters = {
      attribute: { kind: 'secondary' },
      stage: 'finalNonConverted',
      useFloor: false,
      divisor: { kind: 'blackboard', key: 'unused-divisor' },
      multiplier: { kind: 'blackboard', key: 'sub_ratio' },
      base: { kind: 'constant', value: 1 },
      targetKey: 'atb_up',
    } as const;
    const execute = () =>
      executor.execute({ kind: 'storeSourceAttributeValue', parameters }, { blackboard });
    expect(execute()).toBe(true);
    expect(blackboard.getNumber('atb_up')).toBeCloseTo(3);
    for (const [source, value] of [
      [ATTRIBUTE_MODIFIER_SOURCES.buff, 25],
      [ATTRIBUTE_MODIFIER_SOURCES.converted, 1000],
    ] as const) {
      runtime.container.attributes.addModifier(
        createCombatAttributeModifier(
          'will',
          attributeModifierValues('addition', value),
          source,
          'runtime',
        ),
      );
    }
    execute();
    expect(blackboard.getNumber('atb_up')).toBeCloseTo(3.5);
    expect(read('operator', { ...parameters, stage: 'armedNonConverted' })).toBe(100);
    blackboard.assignDynamic('sub_ratio', 0.04);
    execute();
    expect(blackboard.getNumber('atb_up')).toBeCloseTo(6);
  });

  it('reuses one operator Buff runtime for assembly operations and damage modifiers', () => {
    const environment = createEnvironment();
    const createRuntime = environment.runtimeOptions.createOperatorBuffRuntime;

    expect(createRuntime).toBeDefined();
    const panel = createContext().panel;
    expect(createRuntime?.('operator', panel)).toBe(createRuntime?.('operator', panel));
    expect(createRuntime?.('operator', panel)?.ownerId).toBe('operator');
  });

  it('applies a Buff blackboard damage bonus only while the target entity tag matches', () => {
    const environment = createEnvironment();
    const context = createContext();
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const operatorBuffs = environment.runtimeOptions.createOperatorBuffRuntime?.(
      'operator',
      context.panel,
    );
    if (!(operatorBuffs instanceof BuffDefinitionOperationTarget)) {
      throw new Error('operator Buff runtime is unavailable');
    }
    operatorBuffs.apply({
      buffId: 'buff.fluorite.talent-1',
      sourceId: 'operator',
      blackboardValues: {},
      definition: {
        stackingType: 'unique',
        blackboard: { dmg_up: 0.2 },
        damageModifiers: [
          {
            enabledSide: 'attacker',
            condition: {
              kind: 'entityTagMatch',
              target: 'enemy',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/Common/Affixes/Slow'],
            },
            processors: [
              {
                kind: 'damageScale',
                side: 'attacker',
                zone: 'normal',
                addition: { blackboardKey: 'dmg_up' },
              },
            ],
          },
        ],
      },
    });

    const healthBeforeNormalHit = environment.enemyVitals.health;
    expect(executor.execute(damageStep)).toBe(true);
    const normalDamage = healthBeforeNormalHit - environment.enemyVitals.health;

    const enemyBuffs = environment.runtimeOptions.enemyBuffRuntime;
    if (!(enemyBuffs instanceof BuffDefinitionOperationTarget)) {
      throw new Error('enemy Buff runtime is unavailable');
    }
    enemyBuffs.container.addEntityTags(['Skill/Character/Common/Affixes/Slow']);
    const healthBeforeTaggedHit = environment.enemyVitals.health;
    expect(executor.execute(damageStep)).toBe(true);
    const taggedDamage = healthBeforeTaggedHit - environment.enemyVitals.health;

    expect(normalDamage).toBe(224);
    // 面板已有同区间 +20%，天赋再加 +20%，因此区间倍率从 1.2 变为 1.4。
    expect(taggedDamage).toBeCloseTo(normalDamage * (1.4 / 1.2));
  });

  it('runs an affixed Buff condition program against the current damage before processors', () => {
    const environment = createEnvironment();
    const context = createContext();
    bindBattleWithoutProjectiles(environment, context);
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const operatorBuffs = environment.runtimeOptions.createOperatorBuffRuntime?.(
      'operator',
      context.panel,
    );
    if (!(operatorBuffs instanceof BuffDefinitionOperationTarget))
      throw new Error('missing Buff runtime');
    const conditionOperations = new ActionBlackboardOperationExecutor(
      new EventContextConditionExecutor({ execute: () => false, evaluate: () => false }),
    );
    operatorBuffs.configureLifecycleOperations(() => conditionOperations);
    const cast = {
      skillCastId: 42,
      originSkillId: 'battleSkill',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 0,
    };
    operatorBuffs.apply({
      buffId: 'buff.effectful-modifier',
      sourceId: 'operator',
      blackboardValues: {},
      skillCastInfo: cast,
      definition: {
        stackingType: 'unique',
        affixSkillCastIdentity: 'sourceSkillCast',
        blackboard: { imbue_scale: 0.5, real_imbue_scale: 0 },
        damageModifiers: [
          {
            enabledSide: 'attacker',
            conditionProgram: {
              steps: [
                {
                  kind: 'conditional',
                  parameters: { condition: { kind: 'eventSkillCastMatchesBuffSource' } },
                  whenTrue: {
                    steps: [
                      {
                        kind: 'calculateActionValue',
                        parameters: {
                          key: 'real_imbue_scale',
                          operation: 'multiply',
                          left: { kind: 'blackboard', key: 'imbue_scale' },
                          right: { kind: 'constant', value: 1.5 },
                        },
                      },
                    ],
                  },
                },
              ],
            },
            processors: [
              {
                kind: 'damageScale',
                side: 'attacker',
                zone: 'combo',
                addition: { blackboardKey: 'real_imbue_scale' },
              },
            ],
          },
        ],
      },
    });
    const before = environment.enemyVitals.health;
    expect(
      executor.execute(damageStep, { blackboard: new ActionBlackboard(), skillCastInfo: cast }),
    ).toBe(true);
    const matchingDamage = before - environment.enemyVitals.health;
    const beforeOther = environment.enemyVitals.health;
    expect(
      executor.execute(damageStep, {
        blackboard: new ActionBlackboard(),
        skillCastInfo: { ...cast, skillCastId: 43 },
      }),
    ).toBe(true);
    const otherDamage = beforeOther - environment.enemyVitals.health;
    expect(matchingDamage).toBeCloseTo(otherDamage * 1.75);
    expect(operatorBuffs.container.buffs[0]!.affixSkillCastId).toBe(42);
  });

  it('filters defender vulnerability by the current damage type', () => {
    const environment = createEnvironment();
    const context = createContext();
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const enemyBuffs = environment.runtimeOptions.enemyBuffRuntime;
    if (!(enemyBuffs instanceof BuffDefinitionOperationTarget)) {
      throw new Error('enemy Buff runtime is unavailable');
    }
    enemyBuffs.apply({
      buffId: 'buff.spell-vulnerable',
      sourceId: 'operator',
      blackboardValues: {},
      definition: {
        stackingType: 'unique',
        damageModifiers: [
          {
            enabledSide: 'defender',
            condition: { kind: 'eventDamageTypesMatch', damageTypes: ['electric'] },
            processors: [
              { kind: 'damageScale', side: 'defender', zone: 'vulnerable', addition: 0.3 },
            ],
          },
        ],
      },
    });

    const beforeElectric = environment.enemyVitals.health;
    expect(executor.execute(damageStep)).toBe(true);
    const electricDamage = beforeElectric - environment.enemyVitals.health;

    const physicalStep = {
      ...damageStep,
      parameters: { ...damageStep.parameters, damageType: 'physical' as const },
    };
    const beforePhysical = environment.enemyVitals.health;
    expect(executor.execute(physicalStep)).toBe(true);
    const physicalDamage = beforePhysical - environment.enemyVitals.health;

    const baseline = createEnvironment();
    const baselineExecutor = baseline.runtimeOptions.createOperationExecutor(createContext());
    const beforeBaseline = baseline.enemyVitals.health;
    expect(baselineExecutor.execute(physicalStep)).toBe(true);

    expect(electricDamage).toBeGreaterThan(224);
    expect(physicalDamage).toBeCloseTo(beforeBaseline - baseline.enemyVitals.health);
  });

  it('evaluates attached-Buff damage bonuses against the enemy current health ratio', () => {
    const environment = createEnvironment();
    const context = createContext();
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const operatorBuffs = environment.runtimeOptions.createOperatorBuffRuntime?.(
      'operator',
      context.panel,
    );
    if (!(operatorBuffs instanceof BuffDefinitionOperationTarget)) {
      throw new Error('operator Buff runtime is unavailable');
    }
    operatorBuffs.apply({
      buffId: 'buff.chen.potential-1',
      sourceId: 'operator',
      blackboardValues: { extra_dmg: 0.2, hp_remain: 0.5 },
      definition: {
        stackingType: 'unique',
        blackboard: { extra_dmg: 0, hp_remain: 0.5 },
        damageModifiers: [
          {
            enabledSide: 'attacker',
            condition: {
              kind: 'targetHealthCompare',
              target: 'enemy',
              valueType: 'ratio',
              operator: 'less',
              value: { blackboardKey: 'hp_remain' },
            },
            processors: [
              {
                kind: 'damageScale',
                side: 'attacker',
                zone: 'normal',
                addition: { blackboardKey: 'extra_dmg' },
              },
            ],
          },
        ],
      },
    });

    const healthBeforeHigh = environment.enemyVitals.health;
    expect(executor.execute(damageStep)).toBe(true);
    const highHealthDamage = healthBeforeHigh - environment.enemyVitals.health;
    environment.enemyVitals.takeDamage(environment.enemyVitals.maxHealth);
    environment.enemyVitals.heal(environment.enemyVitals.maxHealth * 0.49);
    const healthBeforeLow = environment.enemyVitals.health;
    expect(executor.execute(damageStep)).toBe(true);
    const lowHealthDamage = healthBeforeLow - environment.enemyVitals.health;

    expect(highHealthDamage).toBe(224);
    expect(lowHealthDamage).toBeCloseTo(highHealthDamage * (1.4 / 1.2));
  });

  it('shares the scene-injected vitals instance across damage writes and poise', () => {
    const vitals = createEnemyCombatVitals(testEnemy);
    const environment = new StandardPlayerDamageEnvironment({
      criticalSamples: { nextCriticalSample: () => 1 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      enemyVitals: vitals,
    });

    expect(environment.enemyVitals).toBe(vitals);
    expect(environment.runtimeOptions.resolveVitals!('enemy', 'operator')).toBe(vitals);

    const executor = environment.runtimeOptions.createOperationExecutor(createContext());
    expect(executor.execute(damageStep)).toBe(true);
    // 生命写入与失衡读取落在同一实例上：生命下降而失衡仍为满值，不存在两份镜像状态。
    expect(vitals.health).toBeLessThan(vitals.maxHealth);
    expect(vitals.poise).toBe(testEnemy.stagger.maximum);
    expect(environment.enemyVitals.health).toBe(vitals.health);
  });

  it('creates full-health operator ledgers and resolves the controlled heal target', () => {
    const environment = new StandardPlayerDamageEnvironment({
      criticalSamples: { nextCriticalSample: () => 1 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      enemyVitals: createEnemyCombatVitals(testEnemy),
      isOperatorControlled: operatorId => operatorId === 'operator:b',
    });
    const sourceBase = createContext();
    const sourceReceipt = new CombatReceiptCollector();
    const source: CombatOperationExecutorContext = {
      ...sourceBase,
      receipt: sourceReceipt,
      program: { ...sourceBase.program, operatorId: 'operator:a' },
      panel: {
        ...sourceBase.panel!,
        operatorId: 'operator:a',
        attributes: { ...sourceBase.panel!.attributes, will: 100 },
      },
    };
    const targetBase = createContext();
    const target: CombatOperationExecutorContext = {
      ...targetBase,
      program: { ...targetBase.program, operatorId: 'operator:b' },
      panel: { ...targetBase.panel!, operatorId: 'operator:b' },
    };
    const sourceExecutor = environment.runtimeOptions.createOperationExecutor(source);
    environment.runtimeOptions.createOperationExecutor(target);
    const targetVitals = environment.runtimeOptions.resolveVitals!('caster', 'operator:b');
    targetVitals.takeDamage(250);

    expect(
      sourceExecutor.execute({
        kind: 'heal',
        parameters: {
          target: 'controlledOperator',
          attribute: 'will',
          multiplier: 2,
          addition: 0,
          tags: [],
        },
      }),
    ).toBe(true);
    expect(targetVitals.health).toBe(4950);
    expect(sourceReceipt.entries.at(-1)).toMatchObject({
      event: 'HealingApplied',
      sourceId: 'operator:a',
      targetId: 'operator:b',
      data: { requestedHealing: 200, actualHealing: 200, overhealing: 0 },
    });
  });

  it('completes healer subscriptions before receiver publication and shares each original event', () => {
    const environment = new StandardPlayerDamageEnvironment({
      criticalSamples: { nextCriticalSample: () => 1 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      enemyVitals: createEnemyCombatVitals(testEnemy),
      isOperatorControlled: operatorId => operatorId === 'operator:receiver',
    });
    const order: string[] = [];
    let outputPayload: unknown;
    environment.eventsFor('operator:healer').registerAction('outputHeal', 0, ({ payload }) => {
      outputPayload = payload;
      expect(payload).toMatchObject({
        sourceId: 'operator:healer',
        targetId: 'operator:receiver',
        actualHealing: 0,
      });
      order.push('output');
    });
    let receivedEvent: unknown;
    environment.eventsFor('operator:receiver').registerAction('receiveHeal', 0, event => {
      expect(event.payload).not.toBe(outputPayload);
      expect(event.payload).toEqual(outputPayload);
      receivedEvent = event;
      order.push('receive');
    });

    const context = createContext();
    const semanticEvents = new CombatSemanticEventRuntime(
      environment.runtimeOptions.registerCombatAbilityEvent,
    );
    semanticEvents.register({
      ownerOperatorId: 'operator:receiver',
      trigger: { kind: 'operatorHealed' },
      phase: 'skill',
      handle: ({ event }) => {
        expect(event).toBe(receivedEvent);
        order.push('receiverSkill');
      },
    });
    semanticEvents.register({
      ownerOperatorId: 'operator:healer',
      trigger: { kind: 'operatorHealed', role: 'source' },
      phase: 'skill',
      handle: () => order.push('healerSkill'),
    });
    const executor = environment.runtimeOptions.createOperationExecutor({
      ...context,
      semanticEvents,
      program: { ...context.program, operatorId: 'operator:healer' },
      panel: {
        ...context.panel!,
        operatorId: 'operator:healer',
        attributes: { ...context.panel!.attributes, will: 100 },
      },
    });
    environment.runtimeOptions.createOperationExecutor({
      ...createContext(),
      program: { ...context.program, operatorId: 'operator:receiver' },
      panel: { ...context.panel!, operatorId: 'operator:receiver' },
      semanticEvents,
    });

    expect(
      executor.execute({
        kind: 'heal',
        parameters: {
          target: 'controlledOperator',
          attribute: 'will',
          multiplier: 1,
          addition: 0,
          tags: [],
        },
      }),
    ).toBe(true);
    expect(order).toEqual(['output', 'healerSkill', 'receive', 'receiverSkill']);
  });

  it('evaluates health conditions against the shared post-damage vitals', () => {
    const environment = createEnvironment();
    const executor = environment.runtimeOptions.createOperationExecutor(createContext());
    expect(executor.execute(damageStep)).toBe(true);
    expect(environment.enemyVitals.health).toBeLessThan(testEnemy.health);

    const conditions = new CombatVitalsConditionExecutor({
      resolveTarget: target => environment.runtimeOptions.resolveVitals!(target, 'operator'),
      delegate: { execute: () => true, evaluate: () => true },
    });
    // 生命比例已低于 1，证明条件读取的是伤害写入后的同一账本。
    expect(
      conditions.evaluate(
        {
          kind: 'healthCompare',
          target: 'enemy',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 1 },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);
  });

  it('executes the strict standard life-damage subset with compiled panel and enemy inputs', () => {
    const environment = createEnvironment();
    const context = {
      ...createContext(),
      semanticEvents: new CombatSemanticEventRuntime(
        environment.runtimeOptions.registerCombatAbilityEvent,
      ),
    };
    const events: string[] = [];
    context.semanticEvents.register({
      ownerOperatorId: 'operator',
      trigger: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
      phase: 'dataAction',
      handle: () => events.push(`semantic:${environment.enemyVitals.health}`),
    });
    context.semanticEvents.register({
      ownerOperatorId: 'operator',
      trigger: { kind: 'skillHit', skillGroupKey: 'battleSkill', scope: 'operator' },
      phase: 'dataAction',
      handle: () => events.push('semantic:skill'),
    });
    for (const event of [
      'beforeDamageAction',
      'beforeCalculateDamage',
      'beforeOutputDamage',
      'outputDamage',
    ] as const) {
      environment
        .eventsFor('operator')
        .registerAction(event, 10, ({ event: current }) => events.push(current));
    }
    for (const event of ['beforeTakeDamage', 'takeDamage'] as const) {
      environment
        .eventsFor('enemy')
        .registerAction(event, 10, ({ event: current }) => events.push(current));
    }

    const executor = environment.runtimeOptions.createOperationExecutor(context);

    expect(executor.execute(damageStep)).toBe(true);
    expect(environment.enemyVitals.health).toBe(9776);
    expect(events).toEqual([
      'beforeDamageAction',
      'beforeCalculateDamage',
      'beforeTakeDamage',
      'beforeOutputDamage',
      'takeDamage',
      'outputDamage',
      'semantic:9776',
      'semantic:skill',
    ]);
  });

  it('击杀定义监听与原生监听按优先级共享同一事件', () => {
    const baseContext = createContext();
    const lowHealthEnemy = { ...testEnemy, health: 100 };
    const environment = createEnvironment(lowHealthEnemy);
    const context: CombatOperationExecutorContext = {
      ...baseContext,
      enemy: lowHealthEnemy,
      semanticEvents: new CombatSemanticEventRuntime(
        environment.runtimeOptions.registerCombatAbilityEvent,
      ),
    };
    const events: string[] = [];
    let original: unknown;
    environment.eventsFor('operator').registerCallback('afterKillEntity', event => {
      original = event;
    });
    environment
      .eventsFor('operator')
      .registerAction('afterKillEntity', 10, () => events.push('internal:afterKillEntity'));
    context.semanticEvents.register({
      ownerOperatorId: 'operator',
      trigger: { kind: 'enemyDefeated', scope: 'operator' },
      phase: 'dataAction',
      handle: ({ event }) => {
        expect(event).toBe(original);
        expect('event' in event && event.event).toBe('afterKillEntity');
        if ('event' in event && event.event === 'afterKillEntity') {
          expect(event.payload.features).toEqual(['canBreakWeakness']);
        }
        events.push(`defeated:${environment.enemyVitals.health}`);
      },
    });

    const executor = environment.runtimeOptions.createOperationExecutor(context);
    expect(
      executor.execute({
        ...damageStep,
        parameters: { ...damageStep.parameters, features: ['canBreakWeakness'] },
      }),
    ).toBe(true);

    expect(events).toEqual(['internal:afterKillEntity', 'defeated:0']);
  });

  it('applies poise damage and recovers after the break duration', () => {
    const context = {
      ...createContext(),
      buffDefinitions: {
        [POISE_BREAK_BUFF_ID]: {
          stackingType: 'unlimited' as const,
          blackboard: { dmg_up: 0.37 },
          damageModifiers: [
            {
              enabledSide: 'defender' as const,
              processors: [
                {
                  kind: 'damageScale' as const,
                  side: 'defender' as const,
                  zone: 'product' as const,
                  addition: { blackboardKey: 'dmg_up' },
                },
              ],
            },
          ],
        },
      },
    };
    const receipt = context.receipt as CombatReceiptCollector;
    const environment = createEnvironment();
    const executor = environment.runtimeOptions.createOperationExecutor(context);

    expect(
      executor.execute({
        ...damageStep,
        parameters: { ...damageStep.parameters, stagger: 10 },
      }),
    ).toBe(true);
    expect(environment.enemyVitals.poise).toBe(290);
    expect(receipt.entries.at(-1)).toMatchObject({
      event: 'PoiseApplied',
      data: { requestedDelta: -10, currentPoise: 290 },
    });

    expect(executor.execute({ kind: 'dealStagger', parameters: { value: 300 } })).toBe(true);
    expect(environment.enemyVitals.poise).toBe(0);
    expect(receipt.entries.at(-1)?.data?.brokePoise).toBe(true);
    const buffs = environment.runtimeOptions
      .enemyBuffRuntime as BuffDefinitionOperationTarget<string>;
    expect(buffs.container.findFirstByIds([POISE_BREAK_BUFF_ID])?.sourceId).toBe('operator');
    const damage = () => {
      executor.execute(damageStep);
      return receipt.entries.filter(e => e.event === 'DamageApplied').at(-1)!.data!.value as number;
    };
    const during = damage();

    const vitalsRuntime = environment.enemyVitalsRuntime;
    expect(vitalsRuntime).not.toBeNull();
    for (let frame = 0; frame < 320; frame += 1) vitalsRuntime!.advanceFrame();
    expect(environment.enemyVitals.poise).toBe(300);
    expect(receipt.entries.some(entry => entry.event === 'PoiseRecovered')).toBe(true);
    expect(buffs.getCountByIds([POISE_BREAK_BUFF_ID])).toBe(0);
    expect(during / damage()).toBeCloseTo(1.37);
  });

  it('失衡归零缺少系统 Buff 定义时明确失败，不偷偷使用默认倍率', () => {
    const environment = createEnvironment();
    const executor = environment.runtimeOptions.createOperationExecutor(createContext());
    expect(() => executor.execute({ kind: 'dealStagger', parameters: { value: 300 } })).toThrow(
      POISE_BREAK_BUFF_ID,
    );
  });

  it('applies the resolved equipment poise-output addition to every stagger hit', () => {
    const base = createContext();
    const context = {
      ...base,
      panel: { ...base.panel!, staggerDamagePercent: 0.2 },
    };
    const receipt = context.receipt as CombatReceiptCollector;
    const environment = createEnvironment();
    const executor = environment.runtimeOptions.createOperationExecutor(context);

    expect(
      executor.execute({
        ...damageStep,
        parameters: { ...damageStep.parameters, stagger: 10 },
      }),
    ).toBe(true);
    expect(environment.enemyVitals.poise).toBe(288);
    expect(receipt.entries.at(-1)).toMatchObject({
      event: 'PoiseApplied',
      data: { calculatedDamage: 12, requestedDelta: -12, currentPoise: 288 },
    });
  });

  it('executes index elemental infliction and consumes attachments on bursts', () => {
    const context = createContext();
    const receipt = context.receipt as CombatReceiptCollector;
    const environment = createInflictionEnvironment();
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const step = {
      kind: 'applyElementalInfliction' as const,
      parameters: { element: 'electric' as const, isExtra: false },
    };

    expect(executor.execute(step)).toBe(true);
    expect(receipt.entries.at(-1)).toMatchObject({
      event: 'ElementalInflictionApplied',
      data: {
        requestedElement: 'electric',
        currentElement: 'electric',
        outcomeKind: 'attachmentOnly',
      },
    });

    expect(executor.execute(step)).toBe(true);
    expect(receipt.entries.at(-1)).toMatchObject({
      event: 'ElementalInflictionApplied',
      data: { outcomeKind: 'burst', currentLayers: 2 },
    });
  });

  it('publishes the actual attachment layers consumed by a different incoming element', () => {
    const environment = createInflictionEnvironment();
    const context = {
      ...createContext(),
      semanticEvents: new CombatSemanticEventRuntime(
        environment.runtimeOptions.registerCombatAbilityEvent,
      ),
    };
    environment.runtimeOptions.enemyBuffRuntime.configureBuffConsumedObserver!(event =>
      environment.runtimeOptions.emitBuffLifecycleAbilityEvent!('buffConsumed', {
        ...event,
        sourceId: event.sourceOperatorId,
      }),
    );
    const consumed: number[] = [];
    context.semanticEvents.register({
      ownerOperatorId: 'operator',
      trigger: { kind: 'elementalAttachmentConsumed' },
      phase: 'dataAction',
      handle: event => {
        if ('payload' in event.event && event.event.event === 'buffConsumed') {
          consumed.push(event.event.payload.layers);
        }
      },
    });
    const executor = environment.runtimeOptions.createOperationExecutor(context);

    expect(
      executor.execute({
        kind: 'applyElementalInfliction',
        parameters: { element: 'electric', isExtra: false },
      }),
    ).toBe(true);
    expect(
      executor.execute({
        kind: 'applyElementalInfliction',
        parameters: { element: 'electric', isExtra: false },
      }),
    ).toBe(true);
    expect(
      executor.execute({
        kind: 'applyElementalInfliction',
        parameters: { element: 'heat', isExtra: false },
      }),
    ).toBe(true);

    expect(consumed).toEqual([2]);
  });

  it('records a burst without applying a missing burst buff definition', () => {
    const context = createContext();
    const environment = createAttachmentOnlyEnvironment();
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const step = {
      kind: 'applyElementalInfliction' as const,
      parameters: { element: 'electric' as const, isExtra: false },
    };

    expect(executor.execute(step)).toBe(true);
    // 定义中没有爆发条目，第二次同元素施加按严格定义失败，而不是静默跳过。
    expect(() => executor.execute(step)).toThrow(
      "buff definition is missing elemental burst 'electric'",
    );
  });

  it('executes a real spell burst with SkillSetting when the burst buff is triggered', () => {
    const context = createContext();
    const receipt = context.receipt as CombatReceiptCollector;
    const environment = new StandardPlayerDamageEnvironment({
      criticalSamples: { nextCriticalSample: () => 1 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      enemyVitals: createEnemyCombatVitals(testEnemy),
      elementalInflictionDocument: {
        schemaVersion: 1,
        revision: 'test',
        buffs: [
          {
            id: 'attachment.electric',
            stackingType: 'enhanceAndRefresh',
            stackingKey: 'attachment.electric',
            maxStackCount: 4,
            durationSeconds: 10,
            role: { kind: 'elementalAttachment', element: 'electric' },
          },
          {
            id: 'burst.electric',
            stackingType: 'unlimited',
            durationSeconds: 5,
            triggerIntervalSeconds: 1,
            waitFirstTriggerInterval: true,
            maxTriggerCount: 1,
            role: { kind: 'elementalBurst', element: 'electric' },
            actions: {
              trigger: [{ kind: 'triggerSpellBurst', burstType: 'Pulse' }],
            },
            spellBurst: {
              burstType: 'Pulse',
              damageType: 'electric',
              skillSettingDataKey: '法术爆发伤害倍率',
              skillSettingColumn: 1,
              atkScaleBase: 50,
            },
          },
        ],
      },
      spellInflictionSettings: createSkillSettings(),
    });
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const step = {
      kind: 'applyElementalInfliction' as const,
      parameters: { element: 'electric' as const, isExtra: false },
    };

    // 第一次施加附着；第二次触发爆发 Buff，等待 1 秒触发间隔后打出伤害。
    expect(executor.execute(step)).toBe(true);
    expect(executor.execute(step)).toBe(true);
    expect(receipt.entries.find(entry => entry.event === 'BuffApplied')).toMatchObject({
      sourceId: 'operator',
      targetId: 'enemy',
      data: {
        buffId: 'attachment.electric',
        instanceId: 1,
        layers: 1,
      },
    });
    const buffRuntime = environment.runtimeOptions.enemyBuffRuntime;
    for (let frame = 0; frame < 31; frame += 1) buffRuntime.advanceFrame();
    const burst = receipt.entries.find(entry => entry.event === 'SpellBurstApplied');
    expect(burst).toMatchObject({
      sourceId: 'operator',
      data: { burstType: 'Pulse', skillScale: 1.5, enhanceFactor: 1 },
    });
    expect((burst?.data?.value ?? 0) as number).toBeGreaterThan(0);
    // 敌人实际掉了血（数值经过防御与抗性修正，不断言具体值）。
    expect(environment.enemyVitals.health).toBeLessThan(10000);
  });

  it('executes all four generated 1.4.4 spell bursts through the standard environment', () => {
    const expectedBurstTypes = {
      heat: 'Fire',
      electric: 'Pulse',
      cryo: 'Cryst',
      nature: 'Natural',
    } as const;

    for (const [element, burstType] of Object.entries(expectedBurstTypes)) {
      const context = createContext();
      const receipt = context.receipt as CombatReceiptCollector;
      const environment = new StandardPlayerDamageEnvironment({
        criticalSamples: { nextCriticalSample: () => 1 },
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        enemyVitals: createEnemyCombatVitals(testEnemy),
        elementalInflictionDocument: elementalAttachments,
        spellInflictionSettings: skillSettings,
      });
      const executor = environment.runtimeOptions.createOperationExecutor(context);
      const step = {
        kind: 'applyElementalInfliction' as const,
        parameters: {
          element: element as keyof typeof expectedBurstTypes,
          isExtra: false,
        },
      };

      expect(executor.execute(step)).toBe(true);
      expect(executor.execute(step)).toBe(true);
      for (let frame = 0; frame < 31; frame += 1) {
        environment.runtimeOptions.enemyBuffRuntime.advanceFrame();
      }

      expect(receipt.entries.find(entry => entry.event === 'SpellBurstApplied')).toMatchObject({
        sourceId: 'operator',
        data: { burstType, skillScale: 1.6, enhanceFactor: 1 },
      });
      expect(environment.enemyVitals.health).toBeLessThan(testEnemy.health);
    }
  });

  it('uses the resolved panel infliction-enhance attribute for spell bursts', () => {
    const baseContext = createContext();
    if (baseContext.panel === undefined) throw new Error('test fixture requires a resolved panel');
    const receipt = new CombatReceiptCollector();
    const context: CombatOperationExecutorContext = {
      ...baseContext,
      panel: { ...baseContext.panel, artsIntensity: 2 },
      receipt,
    };
    const environment = new StandardPlayerDamageEnvironment({
      criticalSamples: { nextCriticalSample: () => 1 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      enemyVitals: createEnemyCombatVitals(testEnemy),
      elementalInflictionDocument: {
        schemaVersion: 1,
        revision: 'test',
        buffs: [
          {
            id: 'attachment.electric',
            stackingType: 'enhanceAndRefresh',
            stackingKey: 'attachment.electric',
            maxStackCount: 4,
            durationSeconds: 10,
            role: { kind: 'elementalAttachment', element: 'electric' },
          },
          {
            id: 'burst.electric',
            stackingType: 'unlimited',
            durationSeconds: 5,
            triggerIntervalSeconds: 1,
            waitFirstTriggerInterval: true,
            maxTriggerCount: 1,
            role: { kind: 'elementalBurst', element: 'electric' },
            actions: {
              trigger: [{ kind: 'triggerSpellBurst', burstType: 'Pulse' }],
            },
            spellBurst: {
              burstType: 'Pulse',
              damageType: 'electric',
              skillSettingDataKey: '法术爆发伤害倍率',
              skillSettingColumn: 1,
              atkScaleBase: 50,
            },
          },
        ],
      },
      spellInflictionSettings: {
        schemaVersion: 1,
        revision: 'test',
        data: [{ key: '法术爆发伤害倍率', values: [1.5, 2, 2.5, 3], enhanceFormulaKey: 'linear' }],
        enhanceFormulas: [{ key: 'linear', kind: 'linear', paramA: 0.5 }],
      },
    });
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const step = {
      kind: 'applyElementalInfliction' as const,
      parameters: { element: 'electric' as const, isExtra: false },
    };

    expect(executor.execute(step)).toBe(true);
    expect(executor.execute(step)).toBe(true);
    const buffRuntime = environment.runtimeOptions.enemyBuffRuntime;
    for (let frame = 0; frame < 40; frame += 1) buffRuntime.advanceFrame();
    expect(receipt.entries.find(entry => entry.event === 'SpellBurstApplied')).toMatchObject({
      data: { enhanceFactor: 2 },
    });
  });

  it('fails explicitly when a burst triggers without SkillSetting data', () => {
    const context = createContext();
    const environment = new StandardPlayerDamageEnvironment({
      criticalSamples: { nextCriticalSample: () => 1 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      enemyVitals: createEnemyCombatVitals(testEnemy),
      elementalInflictionDocument: {
        schemaVersion: 1,
        revision: 'test',
        buffs: [
          {
            id: 'attachment.electric',
            stackingType: 'enhanceAndRefresh',
            stackingKey: 'attachment.electric',
            maxStackCount: 4,
            durationSeconds: 10,
            role: { kind: 'elementalAttachment', element: 'electric' },
          },
          {
            id: 'burst.electric',
            stackingType: 'unlimited',
            durationSeconds: 5,
            triggerIntervalSeconds: 1,
            waitFirstTriggerInterval: true,
            maxTriggerCount: 1,
            role: { kind: 'elementalBurst', element: 'electric' },
            actions: {
              trigger: [{ kind: 'triggerSpellBurst', burstType: 'Pulse' }],
            },
            spellBurst: {
              burstType: 'Pulse',
              damageType: 'electric',
              skillSettingDataKey: '法术爆发伤害倍率',
              skillSettingColumn: 1,
              atkScaleBase: 50,
            },
          },
        ],
      },
    });
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const step = {
      kind: 'applyElementalInfliction' as const,
      parameters: { element: 'electric' as const, isExtra: false },
    };

    expect(executor.execute(step)).toBe(true);
    // 第二次施加触发爆发 Buff，推进 1 秒触发间隔后因缺少 SkillSetting 明确失败。
    expect(executor.execute(step)).toBe(true);
    const buffRuntime = environment.runtimeOptions.enemyBuffRuntime;
    expect(() => {
      for (let frame = 0; frame < 40; frame += 1) buffRuntime.advanceFrame();
    }).toThrow('requires SkillSetting data');
  });

  it('records entity buff release without publishing finish or layer events', () => {
    const context = createContext();
    const environment = createEnvironment();
    environment.runtimeOptions.createOperationExecutor(context);
    const runtime = environment.runtimeOptions.createAbilityEntityBuffRuntime!(
      'entity:test',
      new ActionBlackboard(),
      { kind: 'abilityEntity', instanceId: 1 },
      [],
    );
    if (!(runtime instanceof BuffDefinitionOperationTarget)) throw new Error('fixture');
    const events: string[] = [];
    for (const name of ['finishedBuff', 'buffEndsEarly', 'buffEnhanceChanged'] as const)
      environment.eventsFor('entity:test').registerCallback(name, () => events.push(name));
    runtime.container.add({ id: 'release-test', stackingType: 'unlimited' }, 'operator');
    runtime.releaseAll();
    runtime.releaseAll();
    expect(events).toEqual([]);
    const entries = (context.receipt as CombatReceiptCollector).entries;
    expect(entries.filter(entry => entry.event === 'BuffReleased')).toHaveLength(1);
    expect(entries.filter(entry => entry.event === 'BuffFinished')).toHaveLength(0);
  });

  it('records attachment expiry as a BuffFinished fact for effect segments', () => {
    const context = createContext();
    const receipt = context.receipt as CombatReceiptCollector;
    const environment = createInflictionEnvironment();
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const step = {
      kind: 'applyElementalInfliction' as const,
      parameters: { element: 'electric' as const, isExtra: false },
    };

    expect(executor.execute(step)).toBe(true);
    const buffRuntime = environment.runtimeOptions.enemyBuffRuntime;
    for (let frame = 0; frame < 310; frame += 1) buffRuntime.advanceFrame();

    const finished = receipt.entries.filter(entry => entry.event === 'BuffFinished');
    expect(finished.length).toBe(1);
    expect(finished[0]).toMatchObject({
      targetId: 'enemy',
      data: {
        buffId: 'attachment.electric',
        instanceId: 1,
        reason: 'lifetime',
        layers: 1,
      },
    });
  });

  it('records visible operator Buff instances with their native icon identity', () => {
    const context = createContext();
    const receipt = context.receipt as CombatReceiptCollector;
    const environment = createEnvironment();
    environment.runtimeOptions.createOperationExecutor(context);
    const runtime = environment.runtimeOptions.createOperatorBuffRuntime!('operator');

    expect(
      runtime.apply!({
        buffId: 'buff:operator-visible',
        sourceId: 'operator',
        blackboardValues: {},
        definition: {
          stackingType: 'unique',
          durationSeconds: 5,
          attributeModifiers: [{ attribute: 'Atk', slot: 'baseMultiplier', value: 0.1 }],
          presentation: {
            visible: true,
            iconId: 'icon_battle_buff_atk_up',
            iconPath: '/icons/icon_battle_buff_atk_up.webp',
            showInSquadIcon: true,
            showProgressInHpBar: true,
            showProgressInNormalSkillButton: true,
            useWeakProgressInNormalSkillButton: true,
            showWarningBackground: true,
            iconStyleInSquad: 'LifeTime',
            abnormalColorType: 'Fire',
            orderPriority: {
              useDirectoryValue: false,
              value: 12,
              category: 'CommonCharBuff',
            },
          },
          childPresentations: [
            {
              buffId: 'buff:operator-visible:child',
              presentation: {
                visible: true,
                iconPath: '/icons/icon_battle_buff_child.webp',
              },
            },
          ],
        },
      }),
    ).toBe(true);
    expect(receipt.entries.find(entry => entry.event === 'BuffApplied')).toMatchObject({
      event: 'BuffApplied',
      sourceId: 'operator',
      targetId: 'operator',
      data: {
        buffId: 'buff:operator-visible',
        instanceId: 1,
        layers: 1,
        sourceActionId: 'buff:operator-visible',
        simpleModifierAttribute: 'Atk',
        simpleModifierSlot: 'baseMultiplier',
        simpleModifierValue: 0.1,
        visible: true,
        iconId: 'icon_battle_buff_atk_up',
        iconPath: '/icons/icon_battle_buff_atk_up.webp',
        showInSquadIcon: true,
        showProgressInHpBar: true,
        showProgressInNormalSkillButton: true,
        useWeakProgressInNormalSkillButton: true,
        showWarningBackground: true,
        iconStyleInSquad: 'LifeTime',
        abnormalColorType: 'Fire',
        orderUseDirectoryValue: false,
        orderPriorityValue: 12,
        orderPriorityCategory: 'CommonCharBuff',
      },
    });
    expect(receipt.entries.find(entry => entry.event === 'BuffPresentationStarted')).toMatchObject({
      targetId: 'operator',
      data: {
        buffId: 'buff:operator-visible:child',
        parentBuffId: 'buff:operator-visible',
        instanceId: 1,
        sourceActionId: 'buff:operator-visible',
        iconPath: '/icons/icon_battle_buff_child.webp',
      },
    });
    for (let frame = 0; frame < 3; frame += 1) {
      context.clock.advanceFrame();
      runtime.advanceFrame!();
    }
    expect(environment.buffProgressCurves).toHaveLength(1);
    expect(environment.buffProgressCurves[0]).toMatchObject({
      targetId: 'operator',
      buffId: 'buff:operator-visible',
      instanceId: 1,
      showInBattleSkillButton: true,
      showInHpBar: true,
      weakBattleSkillStyle: true,
    });
    expect(environment.buffProgressCurves[0]?.points.map(point => point.frame)).toEqual([0, 3]);
    expect(environment.buffProgressCurves[0]?.points[1]?.ratio).toBeCloseTo(0.98);
  });

  it('真实伤害事件通过公共分派器进入 OnTakeDamage 连携条件', () => {
    const context = createContext();
    const environment = createEnvironment();
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const pending = vi.fn();
    environment.comboConditions.registerPendingCondition({
      event: 'takeDamage',
      ownerId: 'operator',
      sourceId: 'operator',
      entityBlackboard: new ActionBlackboard(),
      initialValues: null,
      sequence: compileActionSequence(
        {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventDamageTagsMatch',
                  match: 'hasAny',
                  tags: ['cryoBurst'],
                },
              },
              whenTrue: { steps: [] },
            },
          ],
        },
        1,
      ),
      operations: new EventContextConditionExecutor({
        execute: () => {
          throw new Error('unexpected combo condition operation');
        },
        evaluate: () => {
          throw new Error('unexpected delegated combo condition');
        },
      }),
      isOwnerAlive: () => true,
      isOwnerSilenced: () => false,
      currentComboCooldown: () => ({ oneReady: true, maxPassedTime: 0, startCdFrame: 0 }),
      resolveTarget: id =>
        id === 'enemy' ? { kind: 'enemy' } : { kind: 'operator', operatorId: id },
      onPending: pending,
    });

    expect(
      executor.execute({
        kind: 'dealDamage',
        parameters: { damageType: 'cryo', attackScale: 1, tags: ['cryoBurst'] },
      }),
    ).toBe(true);
    expect(pending).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        inputTarget: { kind: 'operator', operatorId: 'operator' },
        triggerTarget: { kind: 'enemy' },
      }),
    );
  });

  it('真实伤害在扣血前事件中按原生 input/trigger 身份触发主控来源连携条件', () => {
    const context = createContext();
    const environment = createEnvironment();
    const pending = vi.fn();
    environment.comboConditions.registerPendingCondition({
      event: 'beforeTakeDamage',
      ownerId: 'operator',
      sourceId: 'operator',
      entityBlackboard: new ActionBlackboard(),
      initialValues: null,
      sequence: compileActionSequence(
        {
          steps: [
            {
              kind: 'conditional',
              parameters: { condition: { kind: 'eventSourceControlled' } },
              whenTrue: { steps: [] },
            },
          ],
        },
        1,
      ),
      operations: new EventContextConditionExecutor(
        {
          execute: () => {
            throw new Error('unexpected combo condition operation');
          },
          evaluate: () => {
            throw new Error('unexpected delegated combo condition');
          },
        },
        operatorId => operatorId === 'operator',
      ),
      isOwnerAlive: () => true,
      isOwnerSilenced: () => false,
      currentComboCooldown: () => ({ oneReady: true, maxPassedTime: 0, startCdFrame: 0 }),
      resolveTarget: id =>
        id === 'enemy' ? { kind: 'enemy' } : { kind: 'operator', operatorId: id },
      onPending: pending,
    });

    const executor = environment.runtimeOptions.createOperationExecutor(context);
    expect(
      executor.execute({
        kind: 'dealDamage',
        parameters: {
          damageType: 'physical',
          attackScale: 1,
          tags: ['normalAttackLastCombo'],
        },
      }),
    ).toBe(true);

    expect(pending).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        inputTarget: { kind: 'operator', operatorId: 'operator' },
        triggerTarget: { kind: 'enemy' },
      }),
    );
  });

  it('真实 Buff 成功事件通过公共分派器进入 OnAddedBuff 连携条件', () => {
    const context = createContext();
    const environment = createEnvironment();
    environment.runtimeOptions.createOperationExecutor(context);
    const pending = vi.fn();
    environment.comboConditions.registerPendingCondition({
      event: 'addedBuff',
      ownerId: 'operator',
      sourceId: 'operator',
      entityBlackboard: new ActionBlackboard(),
      initialValues: null,
      sequence: compileActionSequence(
        {
          steps: [
            {
              kind: 'conditional',
              parameters: {
                condition: {
                  kind: 'eventBuffTagsMatch',
                  match: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellBurst'],
                },
              },
              whenTrue: { steps: [] },
            },
          ],
        },
        1,
      ),
      operations: new EventContextConditionExecutor({
        execute: () => {
          throw new Error('unexpected combo condition operation');
        },
        evaluate: () => {
          throw new Error('unexpected delegated combo condition');
        },
      }),
      isOwnerAlive: () => true,
      isOwnerSilenced: () => false,
      currentComboCooldown: () => ({ oneReady: true, maxPassedTime: 0, startCdFrame: 0 }),
      resolveTarget: id =>
        id === 'enemy' ? { kind: 'enemy' } : { kind: 'operator', operatorId: id },
      onPending: pending,
    });

    const enemyBuffs = environment.runtimeOptions.enemyBuffRuntime;
    if (!(enemyBuffs instanceof BuffDefinitionOperationTarget)) {
      throw new Error('enemy Buff runtime is unavailable');
    }
    expect(
      enemyBuffs.apply({
        buffId: 'buff.fixture.spell-burst',
        sourceId: 'operator',
        blackboardValues: {},
        definition: {
          stackingType: 'unique',
          applyTags: ['Skill/Character/Common/SpellBurst'],
        },
      }),
    ).toBe(true);
    expect(pending).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        inputTarget: { kind: 'operator', operatorId: 'operator' },
        triggerTarget: { kind: 'enemy' },
      }),
    );
  });

  it('applies reactions with levels and evaluates reaction conditions', () => {
    const context = createContext();
    const receipt = context.receipt as CombatReceiptCollector;
    const environment = createEnvironment();
    const executor = environment.runtimeOptions.createOperationExecutor(context);
    const step = {
      kind: 'applyElementalReaction' as const,
      parameters: {
        reaction: 'electrification' as const,
        target: 'enemy' as const,
        durationSeconds: 5,
        effectiveness: 1,
      },
    };

    expect(executor.execute(step)).toBe(true);
    expect(executor.execute(step)).toBe(true);
    expect(receipt.entries.at(-1)).toMatchObject({
      event: 'ElementalReactionApplied',
      data: { reaction: 'electrification', level: 2, previousLevel: 1 },
    });
    expect(
      executor.evaluate({
        kind: 'elementalReactionActive',
        reaction: 'electrification',
        minimumLevel: 2,
      }),
    ).toBe(true);
    expect(executor.evaluate({ kind: 'elementalReactionActive', reaction: 'corrosion' })).toBe(
      false,
    );
  });

  it('rejects operations outside the recovered subset', () => {
    const environment = createEnvironment();
    const executor = environment.runtimeOptions.createOperationExecutor(createContext());

    expect(() =>
      executor.execute({
        kind: 'applyBuff',
        parameters: { buffId: 'buff:missing', target: 'enemy' },
      }),
    ).toThrow("does not support 'applyBuff'");
  });
});

it.each(['beforeDamageAction', 'beforeCalculateDamage'] as const)(
  '%s 响应沿用真实可变伤害包，不转换成字段副本',
  event => {
    const environment = createEnvironment();
    const operationContext = { blackboard: new ActionBlackboard() };
    let calls = 0;
    environment.eventsFor('operator').registerAction(event, 0, published => {
      withAbilityEventResponseContext(operationContext, published, undefined, () => {
        expect(operationContext).toHaveProperty('event', published);
        // toHaveProperty 是深相等；此处另验证原始对象身份。
        expect(Reflect.get(operationContext, 'event')).toBe(published);
        calls++;
      });
    });
    environment.runtimeOptions.createOperationExecutor(createContext()).execute(damageStep);
    expect(calls).toBe(1);
  },
);

it('执行程序使用自定义组键时原样随输出传递，承伤方不携带此归属', () => {
  const environment = createEnvironment();
  const context = createContext();
  const outputs: unknown[] = [];
  const targets: unknown[] = [];
  environment
    .eventsFor('operator')
    .registerAction('outputDamage', 0, event => outputs.push(event.payload));
  environment
    .eventsFor('enemy')
    .registerAction('takeDamage', 0, event => targets.push(event.payload));
  environment.runtimeOptions
    .createOperationExecutor({
      ...context,
      program: { ...context.program, skillId: 'unrelated-id', skillGroupKey: 'custom-group' },
    })
    .execute(damageStep);
  expect(outputs).toHaveLength(1);
  expect(outputs[0]).toHaveProperty('executingSkillGroupKey', 'custom-group');
  expect(targets).toHaveLength(1);
  expect(targets[0]).not.toHaveProperty('executingSkillGroupKey');
});
