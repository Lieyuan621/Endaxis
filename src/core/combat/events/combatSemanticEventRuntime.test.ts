import { describe, expect, it } from 'vitest';
import { CombatSemanticEventRuntime, isKnockDownOutputEvent } from './combatSemanticEventRuntime';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { AbilityEventDispatcher } from './abilityEventDispatcher';
import type { AbilityEventPayloadMap } from './combatAbilityEvent';
import { createKillEvent } from './killEventTestFixture';
import { EventContextConditionExecutor } from './eventContextConditionExecutor';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { createNativeEventFixture } from './nativeEventTestFixture';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';

describe('CombatSemanticEventRuntime', () => {
  it('手工事件恢复沿用原订阅，不在绑定阶段触发响应', () => {
    const original = new CombatSemanticEventRuntime();
    const definition = {
      ownerOperatorId: 'operator',
      trigger: { kind: 'airborneOutput' as const },
      phase: 'dataAction' as const,
      priority: 2,
    };
    const registration = original.register({ ...definition, handle: () => {} });
    const saved = structuredClone({
      state: original.runtimeState,
      subscriptions: registration.subscriptions,
    });
    const restored = new CombatSemanticEventRuntime(undefined, {
      state: saved.state,
      bindNative: () => {
        throw new Error('fixture has no native subscriptions');
      },
    });
    let count = 0;
    const bound = restored.bindRegistration(
      {
        ...definition,
        handle: () => {
          count++;
        },
      },
      saved.subscriptions,
    );
    expect(count).toBe(0);
    expect(saved.state.nextRegistrationId).toBe(1);
    registration.dispose();
    restored.emit({ kind: 'airborneOutput', sourceOperatorId: 'operator', targetId: 'enemy' });
    expect(count).toBe(1);
    bound.dispose();
    restored.emit({ kind: 'airborneOutput', sourceOperatorId: 'operator', targetId: 'enemy' });
    expect(count).toBe(1);
  });

  it.each(['addedBuff', 'outputBuff'] as const)(
    '直接订阅 %s 保留载荷、条件和原生实体归属',
    event => {
      const owner = new AbilityEventDispatcher<
        keyof AbilityEventPayloadMap,
        AbilityEventPayloadMap
      >();
      const other = new AbilityEventDispatcher<
        keyof AbilityEventPayloadMap,
        AbilityEventPayloadMap
      >();
      const runtime = new CombatSemanticEventRuntime((id, scope, name, phase, priority, handle) => {
        expect(scope).toBe('operator');
        expect(phase).toBe('dataAction');
        return (id === 'owner' ? owner : other).registerAction(name, priority, handle);
      });
      const payload = {
        sourceId: 'owner',
        targetId: 'owner',
        buffId: 'signal',
        buff: createEventBuff(),
        buffTags: [],
        skillCastInfo: null,
      };
      const native = { event, payload };
      let count = 0;
      const registration = runtime.register({
        ownerOperatorId: 'owner',
        trigger: { kind: 'abilityEvent', event },
        phase: 'dataAction',
        condition: { kind: 'eventBuffIdMatch', buffIds: ['signal'] },
        createOperations: () =>
          new EventContextConditionExecutor({ execute: () => false, evaluate: () => false }),
        handle: context => {
          expect(context.event).toBe(native);
          expect('payload' in context.event && context.event.payload).toBe(payload);
          count++;
        },
      });
      other.dispatch(native, []);
      expect(count).toBe(0);
      owner.dispatch(native, []);
      expect(count).toBe(1);
      registration.dispose();
      owner.dispatch(native, []);
      expect(count).toBe(1);
    },
  );

  it('倒地旧触发器端口仅接受后置通知或手工标记，不接受前置及通用物理异常', () => {
    const payload = { sourceId: 'operator', targetId: 'enemy', fromAirborne: true };
    expect(isKnockDownOutputEvent({ event: 'beforeOutputKnockDown', payload })).toBe(false);
    expect(isKnockDownOutputEvent({ event: 'afterOutputKnockDown', payload })).toBe(true);
    expect(
      isKnockDownOutputEvent({
        event: 'afterOutputPhysicalInfliction',
        payload: { ...payload, type: 'knockDown' },
      }),
    ).toBe(false);
    expect(
      isKnockDownOutputEvent({
        kind: 'airborneOutput',
        sourceOperatorId: 'operator',
        targetId: 'enemy',
      }),
    ).toBe(false);
    expect(
      isKnockDownOutputEvent({
        kind: 'knockDownOutput',
        sourceOperatorId: 'operator',
        targetId: 'enemy',
      }),
    ).toBe(true);
  });

  it('旧定义筛选的条件读取原事件目标与空来源，异常后恢复外层上下文', () => {
    const dispatcher = new AbilityEventDispatcher<
      keyof AbilityEventPayloadMap,
      AbilityEventPayloadMap
    >();
    const targets = {
      inputTarget: { kind: 'enemy' as const },
      triggerTarget: { kind: 'operator' as const, operatorId: 'operator' },
    };
    const runtime = new CombatSemanticEventRuntime(
      (_owner, _scope, name, _phase, priority, handle) =>
        dispatcher.registerAction(name, priority, event => handle(event, targets)),
    );
    const outer = createKillEvent('outer');
    const targetContext = new RuntimeTargetContext();
    targetContext.setSingle('trigger', { kind: 'operator', operatorId: 'outer' });
    const context = {
      blackboard: new ActionBlackboard(),
      event: outer,
      targetContext,
      actionInputTarget: { kind: 'enemy' as const },
    };
    const published = createKillEvent();
    const operations: CombatOperationExecutor = {
      execute: () => true,
      evaluate: (_condition, current) => {
        expect(current?.event).toBe(published);
        expect(current?.eventSkillCastInfo).toBeNull();
        expect(current?.actionInputTarget).toBe(targets.inputTarget);
        expect(current?.targetContext?.getOptional('trigger')).toEqual([targets.triggerTarget]);
        throw new Error('condition failed');
      },
    };
    runtime.register({
      ownerOperatorId: 'operator',
      trigger: { kind: 'enemyDefeated', scope: 'operator' },
      phase: 'dataAction',
      condition: { kind: 'combatActive' },
      createOperations: () => operations,
      createOperationContext: () => context,
      handle: () => {
        throw new Error('must not execute');
      },
    });
    expect(() => dispatcher.dispatch(published, [])).toThrow('condition failed');
    expect(context.event).toBe(outer);
    expect(targetContext.getOptional('trigger')).toEqual([
      { kind: 'operator', operatorId: 'outer' },
    ]);
  });

  it('附着消费筛选与公共消费订阅共用对象，不把其他 Buff 消费或吸收当作附着消费', () => {
    const { semanticEvents: runtime, dispatcher } = createNativeEventFixture();
    const received: unknown[] = [];
    const registration = runtime.register({
      ownerOperatorId: 'consumer',
      trigger: { kind: 'elementalAttachmentConsumed' },
      phase: 'dataAction',
      handle: context => received.push(context.event),
    });
    const published = {
      event: 'buffConsumed' as const,
      payload: {
        buff: createEventBuff(),
        sourceId: 'consumer',
        targetId: 'enemy',
        buffId: 'custom-id',
        buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
        layers: 3,
      },
    };
    dispatcher.dispatch(published, []);
    expect(received).toHaveLength(1);
    expect(received[0]).toBe(published);
    dispatcher.dispatch(
      {
        ...published,
        payload: { ...published.payload, buffTags: ['Skill/Character/Common/SpellStatus/Conduct'] },
      },
      [],
    );
    dispatcher.dispatch({ event: 'buffAbsorbed', payload: published.payload }, []);
    expect(received).toHaveLength(1);
    registration.dispose();
    dispatcher.dispatch(published, []);
    expect(received).toHaveLength(1);
  });

  it('附着定义筛选直接在来源后置通知响应，不在其他三阶段重复触发', () => {
    const { semanticEvents: runtime, dispatcher } = createNativeEventFixture();
    const received: unknown[] = [];
    const order: number[] = [];
    dispatcher.registerAction('afterOutputInfliction', 10, () => order.push(10));
    const registration = runtime.register({
      ownerOperatorId: 'operator',
      trigger: { kind: 'elementalInflictionApplied', scope: 'operator', elements: ['nature'] },
      phase: 'dataAction',
      priority: 5,
      handle: context => {
        order.push(5);
        received.push(context.event);
      },
    });
    dispatcher.registerAction('afterOutputInfliction', 0, () => order.push(0));
    const published = {
      event: 'afterOutputInfliction' as const,
      payload: {
        sourceId: 'operator',
        targetId: 'enemy',
        skillId: 'skill',
        element: 'nature' as const,
        isExtra: true,
        skillCastInfo: null,
      },
    };
    dispatcher.dispatch(published, []);
    expect(order).toEqual([10, 5, 0]);
    expect(received).toHaveLength(1);
    expect(received[0]).toBe(published);
    for (const event of [
      'beforeOutputInfliction',
      'beforeTakeInfliction',
      'afterTakeInfliction',
    ] as const)
      dispatcher.dispatch({ event, payload: published.payload }, []);
    dispatcher.dispatch({ ...published, payload: { ...published.payload, element: 'heat' } }, []);
    dispatcher.dispatch({ ...published, payload: { ...published.payload, sourceId: 'other' } }, []);
    expect(received).toHaveLength(1);
    registration.dispose();
    dispatcher.dispatch(published, []);
    expect(received).toHaveLength(1);
  });

  it('技力定义订阅与原始订阅共用对象和优先级，实增为零仍响应，注销后停止', () => {
    const { semanticEvents: runtime, dispatcher } = createNativeEventFixture();
    const received: unknown[] = [];
    const order: number[] = [];
    dispatcher.registerAction('skillSpGained', 10, () => order.push(10));
    const registration = runtime.register({
      ownerOperatorId: 'operator',
      trigger: { kind: 'spGained' },
      phase: 'dataAction',
      priority: 5,
      handle: context => {
        order.push(5);
        received.push(context.event);
      },
    });
    dispatcher.registerAction('skillSpGained', 0, () => order.push(0));
    const published = {
      event: 'skillSpGained' as const,
      payload: {
        sourceOperatorId: 'operator',
        source: 'normalAttack' as const,
        gainKind: 'refund' as const,
        requestedAmount: 20,
        amount: 0,
      },
    };
    dispatcher.dispatch(published, []);
    expect(order).toEqual([10, 5, 0]);
    expect(received).toHaveLength(1);
    expect(received[0]).toBe(published);
    registration.dispose();
    dispatcher.dispatch(published, []);
    expect(received).toHaveLength(1);
  });

  it('击倒旧筛选直接订阅组件通知并兼容手工标记，保持身份、顺序与共同注销', () => {
    const { semanticEvents: runtime, dispatcher } = createNativeEventFixture();
    const order: string[] = [];
    const received: unknown[] = [];
    dispatcher.registerAction('afterOutputKnockDown', 10, () => order.push('high'));
    const registration = runtime.register({
      ownerOperatorId: 'operator',
      trigger: { kind: 'knockDownOutput' },
      phase: 'dataAction',
      priority: 5,
      handle: context => {
        order.push('definition');
        received.push(context.event);
      },
    });
    expect(registration.subscriptions).toHaveLength(2);
    expect(registration.subscriptions[0]!.state).toBe(dispatcher.runtimeState);
    expect(registration.subscriptions[1]!.state).toBe(runtime.runtimeState);
    expect(registration.subscriptions.map(reference => reference.event)).toEqual([
      'afterOutputKnockDown',
      'knockDownOutput',
    ]);
    dispatcher.registerAction('afterOutputKnockDown', 0, () => order.push('low'));
    const published = {
      event: 'afterOutputKnockDown' as const,
      payload: { sourceId: 'operator', targetId: 'enemy', fromAirborne: true },
    };
    const authored = {
      kind: 'knockDownOutput' as const,
      sourceOperatorId: 'operator',
      targetId: 'enemy',
    };
    dispatcher.dispatch(published, []);
    expect(order).toEqual(['high', 'definition', 'low']);
    runtime.emit(authored);
    expect(received).toHaveLength(2);
    expect(received[0]).toBe(published);
    expect(received[1]).toBe(authored);
    expect('fromAirborne' in authored).toBe(false);
    dispatcher.dispatch({ ...published, payload: { ...published.payload, sourceId: 'other' } }, []);
    dispatcher.dispatch({ event: 'beforeOutputKnockDown', payload: published.payload }, []);
    dispatcher.dispatch(
      {
        event: 'afterOutputPhysicalInfliction',
        payload: { sourceId: 'operator', targetId: 'enemy', type: 'knockDown' },
      },
      [],
    );
    expect(received).toHaveLength(2);
    registration.dispose();
    dispatcher.dispatch(published, []);
    runtime.emit(authored);
    expect(received).toHaveLength(2);
  });

  it('消费订阅直接接收原始通知一次，不把吸收当作消费，注销后不再响应', () => {
    const { semanticEvents: runtime, dispatcher } = createNativeEventFixture();
    const received: unknown[] = [];
    const registration = runtime.register({
      ownerOperatorId: 'operator:a',
      trigger: { kind: 'buffConsumed' },
      phase: 'dataAction',
      handle: context => received.push(context.event),
    });
    const payload = {
      sourceId: 'operator:a',
      buff: createEventBuff(),
      targetId: 'enemy',
      buffId: 'test',
      buffTags: [],
      layers: 2,
    };
    const published = { event: 'buffConsumed' as const, payload };
    dispatcher.dispatch({ event: 'buffAbsorbed', payload }, []);
    expect(received).toEqual([]);
    dispatcher.dispatch(published, []);
    expect(received).toHaveLength(1);
    expect(received[0]).toBe(published);
    registration.dispose();
    dispatcher.dispatch(published, []);
    expect(received).toHaveLength(1);
  });

  it('matches consumed Buff identity and consuming operator', () => {
    const { semanticEvents: runtime, emitConsumedBuff } = createNativeEventFixture();
    const received: string[] = [];
    runtime.register({
      ownerOperatorId: 'operator:a',
      trigger: { kind: 'buffConsumed', buffIds: ['buff:no-guard'] },
      phase: 'dataAction',
      handle: context => {
        if ('payload' in context.event && context.event.event === 'buffConsumed') {
          received.push(`${context.event.event}:${context.event.payload.sourceId}`);
        }
      },
    });

    emitConsumedBuff({
      buff: createEventBuff(),
      buffTags: [],
      sourceId: 'operator:b',
      targetId: 'enemy',
      buffId: 'buff:no-guard',
      layers: 1,
    });
    emitConsumedBuff({
      buff: createEventBuff(),
      buffTags: [],
      sourceId: 'operator:a',
      targetId: 'enemy',
      buffId: 'buff:other',
      layers: 1,
    });
    emitConsumedBuff({
      buff: createEventBuff(),
      buffTags: [],
      sourceId: 'operator:a',
      targetId: 'enemy',
      buffId: 'buff:no-guard',
      layers: 2,
    });

    expect(received).toEqual(['buffConsumed:operator:a']);
  });

  it('routes Buff application facts only to the Buff owner', () => {
    const { semanticEvents: runtime, emitAddedBuff } = createNativeEventFixture();
    const received: string[] = [];
    for (const ownerOperatorId of ['operator:a', 'operator:b']) {
      runtime.register({
        ownerOperatorId,
        trigger: { kind: 'buffApplied' },
        phase: 'skill',
        handle: context => {
          expect('event' in context.event && context.event.event).toBe('addedBuff');
          received.push(ownerOperatorId);
        },
      });
    }

    emitAddedBuff({
      targetId: 'operator:b',
      buffId: 'buff:test',
      sourceId: 'operator:a',
      buffTags: [],
    });

    expect(received).toEqual(['operator:b']);
  });

  it('routes external hit facts only to the targeted operator', () => {
    const { semanticEvents: runtime, dispatcher } = createNativeEventFixture();
    const received: string[] = [];
    for (const ownerOperatorId of ['operator:a', 'operator:b']) {
      runtime.register({
        ownerOperatorId,
        trigger: { kind: 'operatorHit' },
        phase: 'skill',
        handle: () => received.push(ownerOperatorId),
      });
    }

    dispatcher.dispatch(
      {
        event: 'takeDamage',
        payload: {
          external: true,
          sourceId: 'enemy',
          targetId: 'operator:b',
          tags: ['normalAttack'],
          features: ['crush'],
        },
      },
      [],
    );

    expect(received).toEqual(['operator:b']);
  });

  it('routes successful heal facts only to the receiver, including zero-real-delta heals', () => {
    const { semanticEvents: runtime, dispatcher } = createNativeEventFixture();
    const received: string[] = [];
    for (const ownerOperatorId of ['operator:healer', 'operator:receiver']) {
      runtime.register({
        ownerOperatorId,
        trigger: { kind: 'operatorHealed' },
        phase: 'skill',
        handle: ({ event }) => {
          expect(event).toMatchObject({
            event: 'receiveHeal',
            payload: {
              sourceId: 'operator:healer',
              targetId: 'operator:receiver',
              requestedHealing: 100,
              actualHealing: 0,
              overhealing: 100,
              tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
            },
          });
          received.push(ownerOperatorId);
        },
      });
    }

    for (const event of ['outputHeal', 'receiveHeal'] as const) {
      dispatcher.dispatch(
        {
          event,
          payload: {
            sourceId: 'operator:healer',
            targetId: 'operator:receiver',
            requestedHealing: 100,
            actualHealing: 0,
            overhealing: 100,
            tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
          },
        },
        [],
      );
    }

    expect(received).toEqual(['operator:receiver']);
  });

  it('can route successful healing by its source without changing the receiver default', () => {
    const { semanticEvents: runtime, dispatcher } = createNativeEventFixture();
    const received: string[] = [];
    runtime.register({
      ownerOperatorId: 'operator:healer',
      trigger: { kind: 'operatorHealed', role: 'source' },
      phase: 'dataAction',
      handle: () => received.push('source'),
    });
    runtime.register({
      ownerOperatorId: 'operator:receiver',
      trigger: { kind: 'operatorHealed' },
      phase: 'dataAction',
      handle: () => received.push('target'),
    });

    for (const event of ['outputHeal', 'receiveHeal'] as const) {
      dispatcher.dispatch(
        {
          event,
          payload: {
            sourceId: 'operator:healer',
            targetId: 'operator:receiver',
            requestedHealing: 100,
            actualHealing: 0,
            overhealing: 100,
            tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
          },
        },
        [],
      );
    }

    expect(received).toEqual(['source', 'target']);
  });

  it('routes airborne output to the source operator regardless of its target', () => {
    const runtime = new CombatSemanticEventRuntime();
    const received: string[] = [];
    for (const ownerOperatorId of ['operator:a', 'operator:b']) {
      runtime.register({
        ownerOperatorId,
        trigger: { kind: 'airborneOutput' },
        phase: 'skill',
        handle: () => received.push(ownerOperatorId),
      });
    }

    runtime.emit({
      kind: 'airborneOutput',
      sourceOperatorId: 'operator:a',
      targetId: 'enemy',
    });

    expect(received).toEqual(['operator:a']);
  });

  it('distinguishes operator and team scopes while preserving registration order', () => {
    const { semanticEvents: runtime, emitOutputDamage } = createNativeEventFixture();
    const received: string[] = [];
    runtime.register({
      ownerOperatorId: 'operator:b',
      trigger: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
      phase: 'dataAction',
      handle: () => received.push('operator-b'),
    });
    runtime.register({
      ownerOperatorId: 'operator:b',
      trigger: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'team' },
      phase: 'dataAction',
      handle: () => received.push('team'),
    });

    emitOutputDamage({
      sourceId: 'operator:a',
      tags: ['normalSkill'],
    });
    expect(received).toEqual(['team']);

    emitOutputDamage({
      sourceId: 'operator:b',
      tags: ['normalSkill'],
    });
    expect(received).toEqual(['team', 'operator-b', 'team']);
  });

  it('matches elemental lists, skill groups and owner-relative status targets', () => {
    const { semanticEvents: runtime, emitOutputDamage, dispatcher } = createNativeEventFixture();
    const received: string[] = [];
    runtime.register({
      ownerOperatorId: 'operator:a',
      trigger: {
        kind: 'elementalInflictionApplied',
        elements: ['heat', 'nature'],
        scope: 'team',
      },
      phase: 'dataAction',
      handle: () => received.push('infliction'),
    });
    runtime.register({
      ownerOperatorId: 'operator:a',
      trigger: { kind: 'skillHit', skillGroupKey: 'battleSkill', scope: 'operator' },
      phase: 'dataAction',
      handle: () => received.push('skill'),
    });

    dispatcher.dispatch(
      {
        event: 'afterOutputInfliction',
        payload: {
          sourceId: 'operator:b',
          targetId: 'enemy',
          skillId: 'skill',
          isExtra: false,
          element: 'nature',
        },
      },
      [],
    );
    emitOutputDamage({
      sourceId: 'operator:a',
      executingSkillGroupKey: 'battleSkill',
    });
    expect(received).toEqual(['infliction', 'skill']);
  });

  it('matches physical infliction type and team scope', () => {
    const { semanticEvents: runtime, dispatcher } = createNativeEventFixture();
    const received: string[] = [];
    runtime.register({
      ownerOperatorId: 'operator:a',
      trigger: { kind: 'physicalInflictionApplied', types: ['fracture', 'crush'], scope: 'team' },
      phase: 'combo',
      handle: () => received.push('physical'),
    });

    dispatcher.dispatch(
      {
        event: 'afterOutputPhysicalInfliction',
        payload: {
          sourceId: 'operator:b',
          targetId: 'enemy',
          type: 'knockDown',
        },
      },
      [],
    );
    dispatcher.dispatch(
      {
        event: 'afterOutputPhysicalInfliction',
        payload: {
          sourceId: 'operator:b',
          targetId: 'enemy',
          type: 'fracture',
        },
      },
      [],
    );

    expect(received).toEqual(['physical']);
  });

  it('matches enemy defeat events by operator or team scope', () => {
    const dispatcher = new AbilityEventDispatcher<
      keyof AbilityEventPayloadMap,
      AbilityEventPayloadMap
    >();
    const runtime = new CombatSemanticEventRuntime(
      (_owner, _scope, name, _phase, priority, handle) =>
        dispatcher.registerAction(name, priority, handle),
    );
    const received: string[] = [];
    runtime.register({
      ownerOperatorId: 'operator:a',
      trigger: { kind: 'enemyDefeated', scope: 'operator' },
      phase: 'dataAction',
      handle: () => received.push('operator'),
    });
    runtime.register({
      ownerOperatorId: 'operator:a',
      trigger: { kind: 'enemyDefeated', scope: 'team' },
      phase: 'dataAction',
      handle: () => received.push('team'),
    });

    dispatcher.dispatch(createKillEvent('operator:b'), []);
    dispatcher.dispatch(createKillEvent('operator:a'), []);

    expect(received).toEqual(['team', 'operator', 'team']);
  });

  it('原生击杀与定义监听共享四阶段、事件身份与注销边界', () => {
    const dispatcher = new AbilityEventDispatcher<
      keyof AbilityEventPayloadMap,
      AbilityEventPayloadMap
    >();
    const runtime = new CombatSemanticEventRuntime(
      (_owner, _scope, name, phase, priority, handle) => {
        if (phase === 'callback') return dispatcher.registerCallback(name, handle);
        if (phase === 'dataAction') return dispatcher.registerAction(name, priority, handle);
        return dispatcher.registerListener(name, phase, handle);
      },
    );
    const event = createKillEvent();
    const calls: string[] = [];
    dispatcher.registerAction('afterKillEntity', 10, received => {
      expect(received).toBe(event);
      calls.push('native-action');
    });
    const registrations = (['callback', 'dataAction', 'skill', 'combo'] as const).map(phase =>
      runtime.register({
        ownerOperatorId: 'operator',
        trigger: { kind: 'enemyDefeated', scope: 'operator' },
        phase,
        handle: context => {
          expect(context.event).toBe(event);
          expect('kind' in context.event).toBe(false);
          calls.push(phase);
        },
      }),
    );
    dispatcher.dispatch(event, []);
    expect(calls).toEqual(['callback', 'native-action', 'dataAction', 'skill', 'combo']);
    registrations.forEach(registration => {
      registration.dispose();
      registration.dispose();
    });
    calls.length = 0;
    dispatcher.dispatch(event, []);
    expect(calls).toEqual(['native-action']);
    expect(() => runtime.emit(event)).toThrow('entity events must be published');
  });

  it('Buff 输出筛选使用同一原生通知及完整 Buff 数据', () => {
    const dispatcher = new AbilityEventDispatcher<
      keyof AbilityEventPayloadMap,
      AbilityEventPayloadMap
    >();
    const runtime = new CombatSemanticEventRuntime(
      (_owner, _scope, name, phase, priority, handle) => {
        if (phase === 'callback') return dispatcher.registerCallback(name, handle);
        if (phase === 'dataAction') return dispatcher.registerAction(name, priority, handle);
        return dispatcher.registerListener(name, phase, handle);
      },
    );
    const event = {
      event: 'outputBuff' as const,
      payload: {
        buff: createEventBuff(),
        sourceId: 'operator',
        targetId: 'enemy',
        buffId: 'buff:test',
        buffTags: [],
        skillCastInfo: null,
      },
    };
    const calls: string[] = [];
    dispatcher.registerCallback('outputBuff', received => {
      expect(received).toBe(event);
      calls.push('callback');
    });
    runtime.register({
      ownerOperatorId: 'operator',
      trigger: { kind: 'buffOutput' },
      phase: 'dataAction',
      condition: { kind: 'eventBuffIdMatch', buffIds: ['buff:test'] },
      createOperations: () =>
        new EventContextConditionExecutor({ execute: () => false, evaluate: () => false }),
      handle: context => {
        expect(context.event).toBe(event);
        expect('kind' in context.event).toBe(false);
        calls.push('definition');
      },
    });
    runtime.register({
      ownerOperatorId: 'other',
      trigger: { kind: 'buffOutput' },
      phase: 'dataAction',
      handle: () => calls.push('wrong-owner'),
    });
    dispatcher.registerListener('outputBuff', 'skill', () => calls.push('skill'));
    dispatcher.dispatch(event, []);
    expect(calls).toEqual(['callback', 'definition', 'skill']);
    const conditions = new EventContextConditionExecutor({
      execute: () => false,
      evaluate: () => false,
    });
    const blackboard = new ActionBlackboard();
    expect(
      conditions.evaluate(
        { kind: 'eventBuffIdMatch', buffIds: ['buff:test'], buffIdOutputKey: 'matched' },
        { blackboard, event },
      ),
    ).toBe(true);
    expect(blackboard.snapshot().matched).toBe('buff:test');
  });

  it('supports disposing a registration', () => {
    const { semanticEvents: runtime, emitOutputDamage } = createNativeEventFixture();
    let count = 0;
    const registration = runtime.register({
      ownerOperatorId: 'operator:a',
      trigger: { kind: 'damageTagHit', tag: 'normalAttack', scope: 'operator' },
      phase: 'dataAction',
      handle: () => count++,
    });
    registration.dispose();
    emitOutputDamage({
      sourceId: 'operator:a',
      tags: ['normalAttack'],
    });
    expect(count).toBe(0);
  });

  it('dispatches native phases in order and sorts data actions by priority', () => {
    const { semanticEvents: runtime, emitOutputDamage } = createNativeEventFixture();
    const received: string[] = [];
    const register = (
      phase: 'callback' | 'dataAction' | 'skill' | 'combo',
      label: string,
      priority = 0,
    ) => {
      const base = {
        ownerOperatorId: 'operator:a',
        trigger: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'team' },
        handle: () => received.push(label),
      } as const;
      return phase === 'dataAction'
        ? runtime.register({ ...base, phase, priority })
        : runtime.register({ ...base, phase });
    };

    register('combo', 'combo');
    register('dataAction', 'data-low', 1);
    register('skill', 'skill');
    register('callback', 'callback');
    register('dataAction', 'data-high', 2);

    emitOutputDamage({
      sourceId: 'operator:a',
      tags: ['normalSkill'],
    });

    expect(received).toEqual(['callback', 'data-high', 'data-low', 'skill', 'combo']);
  });

  it('uses a phase snapshot while preserving synchronous nested dispatch', () => {
    const { semanticEvents: runtime, emitOutputDamage } = createNativeEventFixture();
    const received: string[] = [];
    const trigger = { kind: 'damageTagHit', tag: 'normalSkill', scope: 'team' } as const;
    let nested = false;
    runtime.register({
      ownerOperatorId: 'operator:a',
      trigger,
      phase: 'callback',
      handle: () => {
        received.push(nested ? 'nested-callback' : 'outer-callback');
        if (nested) return;
        nested = true;
        runtime.register({
          ownerOperatorId: 'operator:a',
          trigger,
          phase: 'callback',
          handle: () => received.push('late-callback'),
        });
        emitOutputDamage({
          sourceId: 'operator:a',
          tags: ['normalSkill'],
        });
      },
    });

    emitOutputDamage({
      sourceId: 'operator:a',
      tags: ['normalSkill'],
    });

    expect(received).toEqual(['outer-callback', 'nested-callback', 'late-callback']);
  });

  it('evaluates conditions through the shared operation chain before handling', () => {
    const { semanticEvents: runtime, emitOutputDamage } = createNativeEventFixture();
    const received: string[] = [];
    let evaluations = 0;
    let executorCreations = 0;
    const operations: CombatOperationExecutor = {
      execute: () => true,
      evaluate: condition => {
        evaluations += 1;
        return condition.kind === 'combatActive';
      },
    };
    runtime.register({
      ownerOperatorId: 'operator:a',
      trigger: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
      phase: 'dataAction',
      condition: { kind: 'combatActive' },
      createOperations: () => {
        executorCreations += 1;
        return operations;
      },
      handle: (_context, getOperations) => {
        expect(getOperations()).toBe(operations);
        received.push('handled');
      },
    });

    emitOutputDamage({
      sourceId: 'operator:a',
      tags: ['normalSkill'],
    });

    expect(evaluations).toBe(1);
    expect(executorCreations).toBe(1);
    expect(received).toEqual(['handled']);
  });

  it('routes skill SP gains only to their source operator and exact gain method', () => {
    const { semanticEvents: runtime, dispatcher } = createNativeEventFixture();
    const received: string[] = [];
    for (const ownerOperatorId of ['operator:a', 'operator:b']) {
      runtime.register({
        ownerOperatorId,
        trigger: { kind: 'spGained', source: 'skill', gainKind: 'gain' },
        phase: 'dataAction',
        handle: () => received.push(ownerOperatorId),
      });
    }

    dispatcher.dispatch(
      {
        event: 'skillSpGained',
        payload: {
          sourceOperatorId: 'operator:b',
          source: 'normalAttack',
          gainKind: 'gain',
          requestedAmount: 10,
          amount: 10,
        },
      },
      [],
    );
    dispatcher.dispatch(
      {
        event: 'skillSpGained',
        payload: {
          sourceOperatorId: 'operator:b',
          source: 'skill',
          gainKind: 'refund',
          requestedAmount: 10,
          amount: 10,
        },
      },
      [],
    );
    dispatcher.dispatch(
      {
        event: 'skillSpGained',
        payload: {
          sourceOperatorId: 'operator:b',
          source: 'skill',
          gainKind: 'gain',
          requestedAmount: 10,
          amount: 10,
        },
      },
      [],
    );

    expect(received).toEqual(['operator:b']);
  });

  it('routes attachment consumption only to the operator that caused it', () => {
    const { semanticEvents: runtime, emitConsumedBuff } = createNativeEventFixture();
    const received: number[] = [];
    runtime.register({
      ownerOperatorId: 'operator:last-rite',
      trigger: { kind: 'elementalAttachmentConsumed' },
      phase: 'dataAction',
      handle: context => {
        if ('payload' in context.event && context.event.event === 'buffConsumed') {
          received.push(context.event.payload.layers);
        }
      },
    });

    emitConsumedBuff({
      buff: createEventBuff(),
      sourceId: 'operator:other',
      targetId: 'enemy',
      buffId: 'attachment:cryo',
      buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
      layers: 2,
    });
    emitConsumedBuff({
      buff: createEventBuff(),
      sourceId: 'operator:last-rite',
      targetId: 'enemy',
      buffId: 'attachment:cryo',
      buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
      layers: 4,
    });

    expect(received).toEqual([4]);
  });
});

it('标签命中订阅与原始伤害订阅混排，保留同一对象且不响应暴击附加通知', () => {
  const { semanticEvents, dispatcher } = createNativeEventFixture();
  const order: string[] = [];
  const published = {
    event: 'outputDamage' as const,
    payload: { ...createKillEvent().payload, tags: ['normalSkill' as const] },
  };
  dispatcher.registerAction('outputDamage', 10, event => {
    expect(event).toBe(published);
    order.push('native-high');
  });
  const registration = semanticEvents.register({
    ownerOperatorId: 'operator',
    trigger: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
    phase: 'dataAction',
    priority: 5,
    handle: ({ event }) => {
      expect(event).toBe(published);
      order.push('tag');
    },
  });
  dispatcher.registerAction('outputDamage', 0, () => order.push('native-low'));
  dispatcher.dispatch(published, []);
  dispatcher.dispatch({ event: 'outputCriticalDamage', payload: published.payload }, []);
  expect(order).toEqual(['native-high', 'tag', 'native-low']);
  registration.dispose();
  dispatcher.dispatch(published, []);
  expect(order).toEqual(['native-high', 'tag', 'native-low', 'native-high', 'native-low']);
});

it('外部受击只在 takeDamage 响应一次，保留原对象且没有伪造结果', () => {
  const { semanticEvents, dispatcher } = createNativeEventFixture();
  const payload = {
    external: true as const,
    sourceId: 'enemy' as const,
    targetId: 'operator',
    tags: [],
    features: [],
  };
  const published = { event: 'takeDamage' as const, payload };
  const received: unknown[] = [];
  dispatcher.registerAction('takeDamage', 10, event => received.push(event));
  semanticEvents.register({
    ownerOperatorId: 'operator',
    trigger: { kind: 'operatorHit' },
    phase: 'dataAction',
    priority: 0,
    handle: ({ event }) => received.push(event),
  });
  dispatcher.dispatch({ event: 'beforeTakeDamage', payload }, []);
  dispatcher.dispatch(published, []);
  expect(received).toHaveLength(2);
  expect(received[0]).toBe(published);
  expect(received[1]).toBe(published);
  expect('result' in payload).toBe(false);
});

it('技能命中按明确执行组匹配，不从继承来源或技能 ID 推断，且不重复响应暴击', () => {
  const { semanticEvents, dispatcher } = createNativeEventFixture();
  const received: unknown[] = [];
  semanticEvents.register({
    ownerOperatorId: 'operator',
    trigger: { kind: 'skillHit', skillGroupKey: 'custom-group', scope: 'operator' },
    phase: 'dataAction',
    handle: ({ event }) => received.push(event),
  });
  const payload = {
    ...createKillEvent().payload,
    skillCastInfo: {
      skillCastId: 1,
      originSkillId: 'custom-group',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 0,
    },
  };
  dispatcher.dispatch({ event: 'outputDamage', payload }, []);
  expect(received).toEqual([]);
  const published = {
    event: 'outputDamage' as const,
    payload: { ...payload, executingSkillGroupKey: 'custom-group' },
  };
  dispatcher.dispatch(published, []);
  dispatcher.dispatch({ event: 'outputCriticalDamage', payload: published.payload }, []);
  expect(received).toHaveLength(1);
  expect(received[0]).toBe(published);
});
import { createEventBuff } from './buffEventTestFixture';
