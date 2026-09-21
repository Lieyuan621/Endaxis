import { describe, expect, it, vi } from 'vitest';
import type { ResolvedSkillBuffLifecycleSequences } from '../../compiler/combatProgram';
import { LogicalAbilityEntityRuntime } from '../abilities/logicalAbilityEntityRuntime';
import {
  ProjectileLifecycleRuntime,
  type ProjectileFinishTiming,
} from '../abilities/projectileLifecycleRuntime';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { AbilityEventDispatcher } from '../events/abilityEventDispatcher';
import { withAbilityEventResponseContext } from '../events/abilityEventResponseContext';
import type { AbilityEventPayloadMap } from '../events/combatAbilityEvent';
import { abilityEventSkillCastInfo } from '../events/combatAbilityEvent';
import { EventContextConditionExecutor } from '../events/eventContextConditionExecutor';
import { createKillEvent } from '../events/killEventTestFixture';
import {
  registerPostSkillRequestListener,
  requirePostSkillRequestListener,
  unregisterPostSkillRequestListener,
} from '../skills/postSkillRequestListenerExecution';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import {
  createPostSkillRequestListenerState,
  type PostSkillRequestListenerState,
} from '../state/environmentState';
import type { AbilityResponseEventName } from '../state/foundationState';
import { BuffDefinitionOperationTarget } from './buffDefinitionOperationTarget';
import { attachBuffLifecycleSequences } from './buffLifecycleSequenceRuntime';
import { BuffOperationExecutor } from './buffOperationExecutor';
import { CombatBuffContainer, type CombatBuffDefinition } from './combatBuffs';

describe('attachBuffLifecycleSequences', () => {
  it('带伤害条件的 Buff 外壳保留活动 Enable 序列，结束时只清理恢复分支的动作期 Buff', () => {
    const childDefinition: CombatBuffDefinition<never> = {
      id: 'restored-enable-child',
      stackingType: 'unlimited',
    };
    const createParentDefinition = (container: CombatBuffContainer<never>) => {
      const target = new BuffDefinitionOperationTarget(container, {
        get: id => (id === childDefinition.id ? childDefinition : undefined),
      });
      return attachBuffLifecycleSequences<never>(
        {
          id: 'restored-enable-parent',
          stackingType: 'unlimited',
          damageModifiers: [{ enabledSide: 'attacker', processors: [] }],
        },
        {
          enable: {
            steps: [
              {
                kind: 'applyBuff',
                parameters: {
                  buffId: childDefinition.id,
                  target: 'caster',
                  finishByAction: true,
                },
              },
            ],
          },
        },
        () =>
          new BuffOperationExecutor({
            sourceId: 'owner',
            resolveTarget: () => target,
            resolveEventTarget: () => target,
            delegate: { execute: () => false, evaluate: () => false },
          }),
        undefined,
        [],
        undefined,
        [],
        [],
        [],
        undefined,
        [{ steps: [] }],
      );
    };
    const original = new CombatBuffContainer<never>('owner', new CombatAttributeSet<never>());
    const originalParentDefinition = createParentDefinition(original);
    const oldParent = original.add(originalParentDefinition, 'owner')!;
    const oldChild = original.buffs.find(buff => buff.definition.id === childDefinition.id)!;
    const saved = structuredClone(original.runtimeState);

    const restoredAttributes = new CombatAttributeSet(saved.attributes);
    const restoredBlackboard = ActionBlackboard.bindRuntimeState(saved.entityBlackboard);
    const restored = new CombatBuffContainer<never>(
      'owner',
      restoredAttributes,
      undefined,
      null,
      restoredBlackboard,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      saved,
    );
    const restoredParentDefinition = createParentDefinition(restored);
    restored.bindRestoredInstances(state =>
      state.identity.definitionId === restoredParentDefinition.id
        ? restoredParentDefinition
        : state.identity.definitionId === childDefinition.id
          ? childDefinition
          : undefined,
    );
    restored.bindRestoredRelations(reference => restored.resolveHandle(reference));
    const newParent = restored.getInstance(oldParent.instanceId)!;
    const newChild = restored.getInstance(oldChild.instanceId)!;

    expect(newParent.runtimeState.actionHost!.enable).not.toBeNull();
    newParent.finish('other', null);
    expect(newParent.isFinished).toBe(true);
    expect(newChild.isFinished).toBe(true);
    expect(oldParent.isFinished).toBe(false);
    expect(oldChild.isFinished).toBe(false);
  });

  it('从切面重绑能力事件订阅并保留响应序列进度', () => {
    const createDefinition = (
      dispatcher: AbilityEventDispatcher<AbilityResponseEventName, AbilityEventPayloadMap>,
      reached: string[],
    ) =>
      attachBuffLifecycleSequences<never>(
        { id: 'restored-event-response', stackingType: 'unique' },
        {},
        () => ({
          execute: step => {
            if (step.kind !== 'setContextFlag') throw new Error(`unexpected step '${step.kind}'`);
            reached.push(step.parameters.flag);
            return true;
          },
          evaluate: () => true,
        }),
        undefined,
        [
          {
            event: 'addedBuff',
            priority: 3,
            sequence: {
              steps: [
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'always', value: true, target: 'caster' },
                },
                {
                  kind: 'once',
                  parameters: { scopeKey: 'saved-once' },
                  body: {
                    steps: [
                      {
                        kind: 'setContextFlag',
                        parameters: { flag: 'once', value: true, target: 'caster' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
        (event, priority, handle, subscriptions) =>
          subscriptions === undefined
            ? dispatcher.registerAction(event, priority, published => handle(published))
            : dispatcher.bindSubscriptionFor(event, subscriptions[0]!, published =>
                handle(published),
              ),
      );
    const event = {
      event: 'addedBuff' as const,
      payload: {
        sourceId: 'source',
        targetId: 'owner',
        buffId: 'incoming',
        buffTags: [],
      },
    };
    const originalReached: string[] = [];
    const originalDispatcher = new AbilityEventDispatcher<
      AbilityResponseEventName,
      AbilityEventPayloadMap
    >();
    const original = new CombatBuffContainer<never>('owner', new CombatAttributeSet<never>());
    const originalDefinition = createDefinition(originalDispatcher, originalReached);
    original.add(originalDefinition, 'source');
    originalDispatcher.dispatch(event, []);
    expect(originalReached).toEqual(['always', 'once']);

    const saved = structuredClone({
      container: original.runtimeState,
      events: originalDispatcher.runtimeState,
    });
    const restoredReached: string[] = [];
    const restoredDispatcher = new AbilityEventDispatcher<
      AbilityResponseEventName,
      AbilityEventPayloadMap
    >(saved.events);
    const restored = new CombatBuffContainer<never>(
      'owner',
      new CombatAttributeSet(saved.container.attributes),
      undefined,
      null,
      ActionBlackboard.bindRuntimeState(saved.container.entityBlackboard),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      saved.container,
    );
    const restoredDefinition = createDefinition(restoredDispatcher, restoredReached);
    const nextRegistrationId = restoredDispatcher.runtimeState.nextRegistrationId;
    restored.bindRestoredInstances(state =>
      state.identity.definitionId === restoredDefinition.id ? restoredDefinition : undefined,
    );

    expect(restoredDispatcher.runtimeState.nextRegistrationId).toBe(nextRegistrationId);
    restoredDispatcher.dispatch(event, []);
    expect(restoredReached).toEqual(['always']);
    originalDispatcher.dispatch(event, []);
    expect(originalReached).toEqual(['always', 'once', 'always']);
  });

  it.each(['matching', 'other'] as const)(
    'SkillAffix 将唯一请求引用在 %s 施法时转交或释放',
    mode => {
      const dispatcher = new AbilityEventDispatcher<
        AbilityResponseEventName,
        AbilityEventPayloadMap
      >();
      const container = new CombatBuffContainer<never>('owner', new CombatAttributeSet<never>());
      let request:
        ((info: import('../state/foundationState').CombatSkillCastInfo | null) => void) | undefined;
      const dispose = vi.fn();
      const definition = attachBuffLifecycleSequences<never>(
        { id: 'affix', stackingType: 'unique' },
        { enable: { steps: [{ kind: 'skillAffix', parameters: {} }] } },
        () =>
          new BuffOperationExecutor({
            sourceId: 'owner',
            resolveTarget: () => container,
            readProcessingSkillCastId: () => 42,
            delegate: { execute: () => false, evaluate: () => false },
          }),
        undefined,
        [],
        undefined,
        [],
        [],
        [],
        undefined,
        [],
        (event, callback) => dispatcher.registerCallback(event, callback),
        callback => {
          request = callback;
          return { dispose };
        },
      );
      const buff = container.add(definition, 'owner')!;
      const info = {
        skillCastId: 42,
        originSkillId: 'skill',
        originSkillType: 'battleSkill' as const,
        nonReturnedSpCost: 0,
      };
      const emit = (event: 'beforeCastSkill' | 'skillEnd', skillCastId: number) =>
        dispatcher.dispatch(
          {
            event,
            payload: {
              sourceId: 'owner',
              targetId: 'owner',
              skillId: 'skill',
              skillType: 'battleSkill',
              skillCastId,
            },
          },
          [],
        );
      request!(info);
      request!(info); // 重复匹配只保留一次；不匹配请求本身也不释放旧 pending。
      request!({ ...info, skillCastId: 99 });
      const savedAffixes = structuredClone(buff.runtimeState.actionHost!.affixes);
      expect(savedAffixes[0]).toMatchObject({ references: 2, pendingRequest: true });
      emit('skillEnd', 42);
      expect(buff.isFinished).toBe(false);
      emit('beforeCastSkill', mode === 'matching' ? 42 : 99);
      if (mode === 'matching') {
        expect(buff.isFinished).toBe(false);
        emit('skillEnd', 42);
      }
      expect(buff.isFinished).toBe(true);
      expect(dispose).toHaveBeenCalledOnce();
      expect(buff.runtimeState.actionHost!.affixes).toEqual([]);
      expect(savedAffixes[0]).toMatchObject({
        references: 2,
        pendingRequest: true,
        disposed: false,
      });
      request!(info); // 分发快照残留回调不能重新取得引用。
      expect(dispose).toHaveBeenCalledOnce();
    },
  );

  it('从切面按原编号重绑 SkillAffix 事件与预施法请求', () => {
    const createPostRegistrar =
      (
        state: PostSkillRequestListenerState,
        handlers: Map<
          number,
          (info: import('../state/foundationState').CombatSkillCastInfo | null) => void
        >,
      ) =>
      (
        handle: (info: import('../state/foundationState').CombatSkillCastInfo | null) => void,
        restoredId?: number,
      ) => {
        const registrationId = restoredId ?? registerPostSkillRequestListener(state, 'owner');
        if (restoredId !== undefined) requirePostSkillRequestListener(state, 'owner', restoredId);
        if (handlers.has(registrationId)) throw new Error('duplicate request handler');
        handlers.set(registrationId, handle);
        return {
          registrationId,
          dispose: () => {
            if (!handlers.delete(registrationId)) return;
            unregisterPostSkillRequestListener(state, 'owner', registrationId);
          },
        };
      };
    const createDefinition = (
      container: CombatBuffContainer<never>,
      dispatcher: AbilityEventDispatcher<AbilityResponseEventName, AbilityEventPayloadMap>,
      requestState: PostSkillRequestListenerState,
      requestHandlers: Map<
        number,
        (info: import('../state/foundationState').CombatSkillCastInfo | null) => void
      >,
      restoredProjectiles?: ProjectileLifecycleRuntime,
    ) =>
      attachBuffLifecycleSequences<never>(
        { id: 'restored-affix', stackingType: 'unique' },
        { enable: { steps: [{ kind: 'skillAffix', parameters: {} }] } },
        () =>
          new BuffOperationExecutor({
            sourceId: 'owner',
            resolveTarget: () => container,
            readProcessingSkillCastId: () => 42,
            delegate: { execute: () => false, evaluate: () => false },
          }),
        undefined,
        [],
        undefined,
        [],
        [],
        [],
        undefined,
        [],
        (event, callback, subscriptions) =>
          subscriptions === undefined
            ? dispatcher.registerCallback(event, callback)
            : dispatcher.bindSubscriptionFor(event, subscriptions[0]!, callback),
        createPostRegistrar(requestState, requestHandlers),
        undefined,
        (reference, release) => {
          if (reference.kind === 'entity') {
            if (restoredProjectiles === undefined) {
              throw new Error('restored projectile directory is missing');
            }
            return restoredProjectiles.bindRestoredResetCallback(
              reference.target.instanceId,
              reference.resetRegistrationId,
              release,
            );
          }
          if (reference.reference.ownerId !== container.ownerId) {
            throw new Error('unexpected Buff owner');
          }
          const child = container.getInstance(reference.reference.instanceId);
          if (child === undefined) throw new Error('restored SkillAffix child is missing');
          return child.bindRecycledCallback(reference.recycleRegistrationId, release);
        },
      );
    const originalDispatcher = new AbilityEventDispatcher<
      AbilityResponseEventName,
      AbilityEventPayloadMap
    >();
    const originalRequestState = createPostSkillRequestListenerState();
    const originalRequestHandlers = new Map<
      number,
      (info: import('../state/foundationState').CombatSkillCastInfo | null) => void
    >();
    const original = new CombatBuffContainer<never>('owner', new CombatAttributeSet<never>());
    const originalDefinition = createDefinition(
      original,
      originalDispatcher,
      originalRequestState,
      originalRequestHandlers,
    );
    const oldBuff = original.add(originalDefinition, 'owner')!;
    const child = original.add({ id: 'affix-child', stackingType: 'unique' }, 'owner', {
      skillCastInfo: {
        skillCastId: 42,
        originSkillId: 'skill',
        originSkillType: 'battleSkill',
        nonReturnedSpCost: 0,
      },
    })!;
    originalDispatcher.dispatch(
      {
        event: 'outputBuff',
        payload: {
          sourceId: 'owner',
          targetId: 'owner',
          buffId: child.definition.id,
          buffTags: [],
          buff: child,
          skillCastInfo: child.skillCastInfo,
        },
      },
      [],
    );
    const originalProjectiles = new ProjectileLifecycleRuntime();
    const originalProjectile = originalProjectiles.launch({
      finishDelaySeconds: 'firstTickReach',
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 1 / 30,
      finish: () => {},
      beforeReset: () => {},
    });
    originalDispatcher.dispatch(
      {
        event: 'projectileLaunched',
        payload: {
          sourceId: 'owner',
          skillCastInfo: child.skillCastInfo!,
          entity: originalProjectile,
        },
      },
      [],
    );
    const saved = structuredClone({
      container: original.runtimeState,
      events: originalDispatcher.runtimeState,
      requests: originalRequestState,
      projectiles: originalProjectiles.runtimeState,
    });
    const restoredDispatcher = new AbilityEventDispatcher<
      AbilityResponseEventName,
      AbilityEventPayloadMap
    >(saved.events);
    const restoredRequestHandlers = new Map<
      number,
      (info: import('../state/foundationState').CombatSkillCastInfo | null) => void
    >();
    const restoredProjectiles = new ProjectileLifecycleRuntime(() => 2, {
      state: saved.projectiles,
    });
    const restored = new CombatBuffContainer<never>(
      'owner',
      new CombatAttributeSet(saved.container.attributes),
      undefined,
      null,
      ActionBlackboard.bindRuntimeState(saved.container.entityBlackboard),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      saved.container,
    );
    const restoredDefinition = createDefinition(
      restored,
      restoredDispatcher,
      saved.requests,
      restoredRequestHandlers,
      restoredProjectiles,
    );
    const nextEventId = restoredDispatcher.runtimeState.nextRegistrationId;
    const nextRequestId = saved.requests.nextRegistrationId;
    restored.bindRestoredInstances(state =>
      state.identity.definitionId === restoredDefinition.id
        ? restoredDefinition
        : state.identity.definitionId === child.definition.id
          ? child.definition
          : undefined,
    );
    restored.bindRestoredRelations(reference => restored.resolveHandle(reference));
    restoredProjectiles.bindRestoredRelations({
      resolveHost: () => ({
        resolveTickDeltaSeconds: () => 1 / 30,
        finish: () => {},
        beforeReset: () => {},
      }),
    });
    const restoredBuff = restored.getInstance(oldBuff.instanceId)!;
    expect(restoredDispatcher.runtimeState.nextRegistrationId).toBe(nextEventId);
    expect(saved.requests.nextRegistrationId).toBe(nextRequestId);

    const info = {
      skillCastId: 42,
      originSkillId: 'skill',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 0,
    };
    for (const handle of restoredRequestHandlers.values()) handle(info);
    const emit = (event: 'beforeCastSkill' | 'skillEnd') =>
      restoredDispatcher.dispatch(
        {
          event,
          payload: {
            sourceId: 'owner',
            targetId: 'owner',
            skillId: 'skill',
            skillType: 'battleSkill',
            skillCastId: 42,
          },
        },
        [],
      );
    emit('beforeCastSkill');
    emit('skillEnd');
    expect(restoredBuff.isFinished).toBe(false);
    emit('skillEnd');
    expect(restoredBuff.isFinished).toBe(false);
    const restoredChild = restored.getInstance(child.instanceId)!;
    restoredChild.finish('other');
    restored.recycleFinishedBuffs();
    expect(restoredBuff.isFinished).toBe(false);
    for (let frame = 0; frame < 3; frame++) restoredProjectiles.advanceFrame();
    expect(restoredProjectiles.isActive(originalProjectile.target)).toBe(false);
    expect(restoredBuff.isFinished).toBe(true);
    expect(oldBuff.isFinished).toBe(false);
    expect(child.isFinished).toBe(false);
    expect(originalProjectiles.isActive(originalProjectile.target)).toBe(true);
  });

  it('父结束动作先执行并可新增子实例，标记父已结束后再以空施法清理全部子实例', () => {
    const seen: unknown[] = [];
    let parent: import('./combatBuffs').CombatBuff<never>;
    const container = new CombatBuffContainer<never>(
      'owner',
      new CombatAttributeSet<never>(),
      undefined,
      null,
      undefined,
      (buff, _reason, source) => seen.push([buff.definition.id, parent.isFinished, source]),
    );
    const cast = {
      skillCastId: 7,
      originSkillId: 'origin',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 100,
    };
    const children: import('./combatBuffs').CombatBuff<never>[] = [];
    const createChild = (context: CombatOperationContext, id: string) => {
      const child = container.add({ id, stackingType: 'unlimited' }, 'caster', {
        skillCastInfo: cast,
      })!;
      children.push(child);
      context.addCurrentBuffChild!(child);
    };
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'parent', stackingType: 'unlimited' },
      {
        enable: {
          steps: [
            {
              kind: 'setContextFlag',
              parameters: { flag: 'start', value: true, target: 'caster' },
            },
          ],
        },
        finish: {
          steps: [
            {
              kind: 'setContextFlag',
              parameters: { flag: 'finish', value: true, target: 'caster' },
            },
          ],
        },
      },
      () => ({
        execute: (step, context) => {
          if (step.kind !== 'setContextFlag') return false;
          if (step.parameters.flag === 'start') createChild(context!, 'initial-child');
          else {
            seen.push(['finish-action', parent.isFinished, children[0]!.isFinished]);
            createChild(context!, 'finish-child');
          }
          return true;
        },
        end: step => {
          if (step.kind === 'setContextFlag' && step.parameters.flag === 'start')
            seen.push(['enable-end', parent.isFinished]);
        },
        evaluate: () => false,
      }),
    );
    parent = container.add(definition, 'caster', { skillCastInfo: cast })!;
    parent.finish('other', cast);
    expect(seen).toEqual([
      ['finish-action', false, false],
      ['enable-end', false],
      ['initial-child', true, null],
      ['finish-child', true, null],
      ['parent', true, cast],
    ]);
    expect(children.every(child => child.isFinished)).toBe(true);
    expect(parent.finish('other')).toBe(false);
    expect(seen).toHaveLength(5);
  });
  it.each([false, true])(
    '倒地兼容响应复用目标/来源作用域，不给手工标记补原生信息：native=%s',
    native => {
      const container = new CombatBuffContainer<never>('owner', new CombatAttributeSet<never>());
      let receive!: Parameters<
        import('./buffLifecycleSequenceRuntime').RegisterBuffSemanticEventAction
      >[2];
      let disposed = false;
      const contexts: import('../skills/skillRuntime').CombatOperationContext[] = [];
      const snapshots: unknown[] = [];
      const definition = attachBuffLifecycleSequences<never>(
        { id: 'knock-response', stackingType: 'unique' },
        {},
        () => ({
          execute: (_step, context) => {
            contexts.push(context!);
            snapshots.push({
              event: context?.event,
              source: context?.eventSkillCastInfo,
              owner: context?.actionOwnerId,
              actionSource: context?.actionSourceId,
              input: context?.actionInputTarget,
              trigger: context?.targetContext?.getOptional('trigger'),
            });
            return true;
          },
          evaluate: () => true,
        }),
        undefined,
        [
          {
            event: 'outputKnockDown',
            priority: 0,
            sequence: {
              steps: [
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'seen', value: true, target: 'caster' },
                },
              ],
            },
          },
        ],
        undefined,
        [],
        [],
        [],
        (_event, _priority, handle) => {
          receive = handle;
          return {
            dispose: () => {
              disposed = true;
            },
          };
        },
      );
      const buff = container.add(definition, 'buff-source')!;
      const published = native
        ? {
            event: 'afterOutputKnockDown' as const,
            payload: {
              sourceId: 'owner',
              targetId: 'enemy',
              fromAirborne: true,
              skillCastInfo: null,
            },
          }
        : { kind: 'knockDownOutput' as const, sourceOperatorId: 'owner', targetId: 'enemy' };
      const targets = {
        inputTarget: { kind: 'enemy' as const },
        triggerTarget: { kind: 'operator' as const, operatorId: 'owner' },
      };
      receive(published, native ? targets : undefined);
      expect(snapshots).toEqual([
        {
          event: published,
          source: native ? null : undefined,
          owner: 'owner',
          actionSource: 'buff-source',
          input: native ? targets.inputTarget : undefined,
          trigger: native ? [targets.triggerTarget] : undefined,
        },
      ]);
      expect(contexts[0]?.event).toBeUndefined();
      expect(contexts[0]?.targetContext?.getOptional('trigger')).toBeUndefined();
      buff.finish('other');
      expect(disposed).toBe(true);
    },
  );

  it.each(
    [undefined, 42].flatMap(processing =>
      [false, true].flatMap(hasSource =>
        (
          [
            { name: 'duration', finish: 1, finishTicks: 8, recycleDelay: 0, recycleTicks: 1 },
            {
              name: 'presentation',
              finish: 'firstTickReach',
              finishTicks: 1,
              recycleDelay: 0.25,
              recycleTicks: 2,
            },
            {
              name: 'segments',
              finish: { reachAfterTicks: 2, maxDurationSeconds: 2 },
              finishTicks: 2,
              recycleDelay: 0.25,
              recycleTicks: 2,
            },
          ] satisfies readonly {
            name: string;
            finish: ProjectileFinishTiming;
            finishTicks: number;
            recycleDelay: number;
            recycleTicks: number;
          }[]
        ).map(lifetime => ({ processing, hasSource, ...lifetime })),
      ),
    ),
  )(
    'SkillAffix独立编号与投射物引用 processing=$processing hasSource=$hasSource lifetime=$name',
    ({ processing, hasSource, finish: finishTiming, finishTicks, recycleDelay, recycleTicks }) => {
      const container = new CombatBuffContainer<never>('owner', new CombatAttributeSet<never>());
      const dispatcher = new AbilityEventDispatcher<
        AbilityResponseEventName,
        AbilityEventPayloadMap
      >();
      const observedInActionPhase: boolean[] = [];
      // 先注册动作，仍必须在后来注册的原生回调之后执行。
      dispatcher.registerAction('skillEnd', 0, () => observedInActionPhase.push(buff.isFinished));
      const callbacks = new Set<
        Parameters<import('./buffLifecycleSequenceRuntime').RegisterBuffAbilityEventAction>[2]
      >();
      const definition = attachBuffLifecycleSequences<never>(
        { id: 'affix', stackingType: 'unique' },
        { enable: { steps: [{ kind: 'skillAffix', parameters: {} }] } },
        () =>
          new BuffOperationExecutor({
            sourceId: 'source',
            resolveTarget: () => container,
            readProcessingSkillCastId: owner => {
              expect(owner).toBe('owner');
              return processing;
            },
            delegate: { execute: () => false, evaluate: () => false },
          }),
        undefined,
        [],
        () => {
          throw new Error('SkillAffix must not register a sequence action');
        },
        [],
        [],
        [],
        undefined,
        [],
        (event, callback) => {
          expect([
            'beforeCastSkill',
            'skillEnd',
            'outputBuff',
            'abilityEntitySpawned',
            'projectileLaunched',
          ]).toContain(event);
          callbacks.add(callback);
          const registration = dispatcher.registerCallback(event, callback);
          return {
            dispose: () => {
              callbacks.delete(callback);
              registration.dispose();
            },
          };
        },
      );
      const ordinary = {
        skillCastId: 999,
        originSkillId: 'original',
        originSkillType: 'battleSkill' as const,
        nonReturnedSpCost: 0,
      };
      const buff = container.add(
        definition,
        'source',
        hasSource ? { skillCastInfo: ordinary } : undefined,
      )!;
      expect(buff.affixSkillCastId).toBe(processing ?? 0);
      expect(buff.skillCastInfo).toEqual(hasSource ? ordinary : null);
      expect(callbacks.size).toBe(processing === undefined ? 0 : 1);
      const finish = vi.spyOn(buff, 'finish');
      const emit = (
        sourceId: string,
        skillCastId: number,
        event: 'skillEnd' | 'beforeCastSkill' = 'skillEnd',
      ) => {
        dispatcher.dispatch(
          {
            event,
            payload: {
              sourceId,
              targetId: sourceId,
              skillId: 'skill',
              skillType: 'battleSkill',
              skillCastId,
            },
          },
          [],
        );
      };
      emit('other', 42);
      emit('owner', 999);
      expect(buff.isFinished).toBe(false);
      const output = container.add({ id: 'output', stackingType: 'unique' }, 'owner', {
        skillCastInfo: { ...ordinary, skillCastId: 42 },
      })!;
      dispatcher.dispatch(
        {
          event: 'outputBuff',
          payload: {
            sourceId: 'owner',
            targetId: 'owner',
            buffId: 'output',
            buffTags: [],
            buff: output,
            skillCastInfo: ordinary,
          },
        },
        [],
      );
      expect(output.affixSkillCastId).toBe(0);
      const entities = new LogicalAbilityEntityRuntime({ resolveDeltaSeconds: () => 0.1 });
      const entity = entities.spawn({
        abilityEntityId: 'affix-child',
        ownerId: 'owner',
        source: { kind: 'operator', operatorId: 'owner' },
        definition: { lifetime: { kind: 'infinite' } },
      });
      if (entity.kind !== 'abilityEntity') throw new Error('expected ability entity');
      dispatcher.dispatch(
        {
          event: 'abilityEntitySpawned',
          payload: {
            sourceId: 'owner',
            targetId: 'entity',
            skillCastInfo: { ...ordinary, skillCastId: 42 },
            entity: {
              instanceId: entity.instanceId,
              onReset: callback => entities.onReset(entity, callback),
            },
          },
        },
        [],
      );
      emit('owner', 42, 'beforeCastSkill');
      const projectiles = new ProjectileLifecycleRuntime();
      let projectileDelta: number | null = 0.125;
      const projectile = projectiles.launch({
        finishDelaySeconds: finishTiming,
        recycleDelaySeconds: recycleDelay,
        resolveTickDeltaSeconds: () => projectileDelta,
        finish: () => {},
        beforeReset: () => {},
      });
      dispatcher.dispatch(
        {
          event: 'projectileLaunched',
          payload: {
            sourceId: 'owner',
            skillCastInfo: { ...ordinary, skillCastId: 42 },
            entity: projectile,
          },
        },
        [],
      );
      emit('other', 42, 'beforeCastSkill');
      const savedObjectReferences = structuredClone(
        buff.runtimeState.actionHost!.affixes[0]?.objectReferences,
      );
      if (processing !== undefined) {
        expect(savedObjectReferences!.size).toBe(3);
        expect([...savedObjectReferences!.values()]).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ kind: 'buff', reference: output.reference }),
            expect.objectContaining({ kind: 'entity', target: entity }),
          ]),
        );
      }
      emit('owner', 999, 'beforeCastSkill');
      emit('owner', 42);
      expect(buff.isFinished).toBe(false);
      emit('owner', 42);
      expect(buff.isFinished).toBe(false);
      expect(observedInActionPhase).toEqual([false, false, false, false]);
      output.finish('other');
      expect(buff.isFinished).toBe(false);
      container.recycleFinishedBuffs();
      expect(buff.isFinished).toBe(false);
      entities.finish(entity);
      expect(buff.isFinished).toBe(false);
      const assertPausedReference = () => {
        projectileDelta = null;
        for (let tick = 0; tick < 3; tick++) projectiles.advanceFrame();
        expect(buff.isFinished).toBe(false);
        expect(projectiles.isActive(projectile.target)).toBe(true);
        projectileDelta = 0.125;
      };
      // 来源技能、输出Buff、普通子实体已经结束；只剩投射物引用。
      assertPausedReference();
      for (let tick = 0; tick < finishTicks; tick++) {
        projectiles.advanceFrame();
        expect(buff.isFinished).toBe(false);
      }
      // 结束后的回收计时和已标记回收阶段都必须等待实际Tick准入。
      assertPausedReference();
      for (let tick = 0; tick < recycleTicks; tick++) {
        projectiles.advanceFrame();
        expect(buff.isFinished).toBe(false);
      }
      assertPausedReference();
      projectiles.advanceFrame();
      expect(projectiles.isActive(projectile.target)).toBe(false);
      expect(buff.isFinished).toBe(processing !== undefined);
      if (processing !== undefined) expect(finish).toHaveBeenCalledExactlyOnceWith('other', null);
      else expect(finish).not.toHaveBeenCalled();
      buff.finish('other');
      expect(callbacks.size).toBe(0);
      expect(buff.affixSkillCastId).toBe(processing ?? 0);
    },
  );

  it('前序动作失败不提前执行SkillAffix或注册监听', () => {
    const container = new CombatBuffContainer<never>('owner', new CombatAttributeSet<never>());
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'blocked-affix', stackingType: 'unique' },
      {
        enable: {
          steps: [
            {
              kind: 'setContextFlag',
              parameters: { flag: 'failure', value: true, target: 'caster' },
            },
            { kind: 'skillAffix', parameters: {} },
          ],
        },
      },
      () =>
        new BuffOperationExecutor({
          sourceId: 'owner',
          resolveTarget: () => container,
          readProcessingSkillCastId: () => {
            throw new Error('must not read');
          },
          delegate: { execute: () => false, evaluate: () => false },
        }),
    );
    expect(container.add(definition, 'owner')!.affixSkillCastId).toBe(0);
  });

  it('limited counts in Buff events retain Buff provenance, not event or candidate affix identity', () => {
    const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
    const cast = (id: number) => ({
      skillCastId: id,
      originSkillId: 'skill',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 0,
    });
    const seal = { id: 'seal', stackingType: 'unlimited' as const };
    const matching = container.add(seal, 'operator', { skillCastInfo: cast(42) })!;
    matching.recordBuffAffixSkillCastId(99);
    container.add(seal, 'operator', { skillCastInfo: cast(99) })!.recordBuffAffixSkillCastId(42);
    container.add(seal, 'operator', { skillCastInfo: cast(42) })!.finish('other');
    let handle:
      | Parameters<import('./buffLifecycleSequenceRuntime').RegisterBuffAbilityEventAction>[2]
      | undefined;
    let reached = 0;
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'listener', stackingType: 'unique' },
      {},
      () =>
        new BuffOperationExecutor({
          sourceId: 'operator',
          resolveTarget: () => container,
          resolveEventTarget: () => container,
          delegate: {
            execute: () => {
              reached++;
              return true;
            },
            evaluate: () => false,
          },
        }),
      undefined,
      [
        {
          event: 'beforeCastSkill',
          priority: 0,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'buffIdStackCompare',
                    target: 'buffOwner',
                    buffIds: ['seal'],
                    sameSourceSkillCast: true,
                    operator: 'equal',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                whenTrue: {
                  steps: [
                    {
                      kind: 'setContextFlag',
                      parameters: {
                        flag: 'matched',
                        value: true,
                        target: 'caster',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
      (_event, _priority, callback) => {
        handle = callback;
        return { dispose: () => undefined };
      },
    );
    container.add(definition, 'operator', { skillCastInfo: cast(42) });
    const event = {
      sourceId: 'operator',
      targetId: 'operator',
      skillType: 'battleSkill' as const,
      skillId: 'later-skill',
      skillCastId: 99,
    };
    handle!({ event: 'beforeCastSkill', payload: event });
    expect(reached).toBe(1);
    matching.finish('other');
    handle!({ event: 'beforeCastSkill', payload: event });
    expect(reached).toBe(1);
  });

  it('自定义事件保留原始对象，不虚构施法来源', () => {
    const published = {
      event: 'customAbilityEvent' as const,
      payload: {
        sourceId: 'liino',
        targetId: 'liino',
        eventName: 'liino_comboskill_end',
        eventParam: 0,
      },
    };
    const context: CombatOperationContext = { blackboard: new ActionBlackboard() };
    withAbilityEventResponseContext(context, published, undefined, () => {
      expect(context.event).toBe(published);
      expect(context.eventSkillCastInfo).toBeUndefined();
    });
  });

  it('护盾事件保留原始对象和独立数值', () => {
    const published = {
      event: 'afterAddedShield' as const,
      payload: {
        sourceId: 'operator',
        targetId: 'operator',
        gainedValue: 120,
        currentValue: 350,
      },
    };
    const context: CombatOperationContext = { blackboard: new ActionBlackboard() };
    withAbilityEventResponseContext(context, published, undefined, () => {
      expect(context.event).toBe(published);
      expect(context.eventSkillCastInfo).toBeUndefined();
    });
  });

  it('区分空来源与遗漏来源，接受处决类型且不从其他字段覆盖显式空来源', () => {
    const cast = {
      sourceId: 'owner',
      targetId: 'owner',
      skillCastId: 3,
      skillId: 'finisher',
      skillType: 'finisher' as const,
    };
    expect(abilityEventSkillCastInfo({ event: 'skillEnd', payload: cast })).toBeUndefined();
    const explicit = {
      skillCastId: 3,
      originSkillId: 'finisher',
      originSkillType: 'finisher' as const,
      nonReturnedSpCost: 0,
    };
    expect(
      abilityEventSkillCastInfo({
        event: 'abilityEntityFinished',
        payload: { ...cast, skillCastInfo: explicit },
      }),
    ).toBe(explicit);
    expect(
      abilityEventSkillCastInfo({
        event: 'abilityEntityFinished',
        payload: { ...cast, skillCastInfo: null },
      }),
    ).toBeNull();
  });

  it('把技能槽替换绑定到 Buff 启用边界并在结束时还原', () => {
    const changes: Array<{ targetSkillKey: string; inherit: boolean | undefined }> = [];
    const operations: CombatOperationExecutor = {
      execute: step => {
        if (step.kind === 'changeSkillSlot') {
          changes.push({
            targetSkillKey: step.parameters.targetSkillKey,
            inherit: step.parameters.inheritOriginSkillCooldownProgress,
          });
        }
        return true;
      },
      evaluate: () => true,
    };
    const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'ultimate-form', stackingType: 'unique' },
      {},
      () => operations,
      undefined,
      [],
      undefined,
      [],
      [],
      [
        {
          skillGroupKey: 'battleSkill',
          targetSkillKey: 'battleSkillDuringUltimate',
          revertedSkillKey: 'battleSkill',
          inheritOriginSkillCooldownProgress: true,
        },
      ],
    );

    const buff = container.add(definition, 'operator')!;
    expect(changes).toEqual([{ targetSkillKey: 'battleSkillDuringUltimate', inherit: true }]);

    buff.finish('lifetime');
    expect(changes).toEqual([
      { targetSkillKey: 'battleSkillDuringUltimate', inherit: true },
      { targetSkillKey: 'battleSkill', inherit: true },
    ]);
  });

  it('从切面恢复技能槽替换时不重放应用，结束只还原恢复分支', () => {
    const createDefinition = (changes: string[]) =>
      attachBuffLifecycleSequences<never>(
        { id: 'restored-skill-slot', stackingType: 'unique' },
        {},
        () => ({
          execute: step => {
            if (step.kind !== 'changeSkillSlot') throw new Error(`unexpected step '${step.kind}'`);
            changes.push(step.parameters.targetSkillKey);
            return true;
          },
          evaluate: () => true,
        }),
        undefined,
        [],
        undefined,
        [],
        [],
        [
          {
            skillGroupKey: 'battleSkill',
            targetSkillKey: 'ultimate-form',
            revertedSkillKey: 'normal-form',
            inheritOriginSkillCooldownProgress: true,
          },
        ],
      );
    const originalChanges: string[] = [];
    const original = new CombatBuffContainer<never>('owner', new CombatAttributeSet<never>());
    const originalDefinition = createDefinition(originalChanges);
    const oldBuff = original.add(originalDefinition, 'owner')!;
    expect(originalChanges).toEqual(['ultimate-form']);
    const saved = structuredClone(original.runtimeState);

    const restoredChanges: string[] = [];
    const restored = new CombatBuffContainer<never>(
      'owner',
      new CombatAttributeSet(saved.attributes),
      undefined,
      null,
      ActionBlackboard.bindRuntimeState(saved.entityBlackboard),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      saved,
    );
    const restoredDefinition = createDefinition(restoredChanges);
    restored.bindRestoredInstances(state =>
      state.identity.definitionId === restoredDefinition.id ? restoredDefinition : undefined,
    );
    const newBuff = restored.getInstance(oldBuff.instanceId)!;
    expect(restoredChanges).toEqual([]);

    newBuff.finish('other');
    expect(restoredChanges).toEqual(['normal-form']);
    expect(originalChanges).toEqual(['ultimate-form']);
    expect(oldBuff.isFinished).toBe(false);
  });

  it('为每个 Buff 实例隔离黑板和 once 状态', () => {
    const reached: number[] = [];
    const operations: CombatOperationExecutor = {
      execute(_step, context): boolean {
        reached.push(context!.blackboard.getNumber('instance')!);
        return true;
      },
      evaluate: () => true,
    };
    const once = {
      kind: 'once',
      parameters: { scopeKey: 'enable-once' },
      body: {
        steps: [
          {
            kind: 'setContextFlag',
            parameters: { flag: 'reached', value: true, target: 'caster' },
          },
        ],
      },
    } as const;
    const sequences: ResolvedSkillBuffLifecycleSequences = {
      enable: { steps: [once] },
    };
    const base: CombatBuffDefinition<never> = {
      id: 'isolated',
      stackingType: 'unlimited',
      blackboard: { instance: 0 },
    };
    const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
    const definition = attachBuffLifecycleSequences(base, sequences, () => operations);

    const first = container.add(definition, 'source', { blackboardValues: { instance: 1 } })!;
    const second = container.add(definition, 'source', { blackboardValues: { instance: 2 } })!;
    first.disable();
    first.enable();

    expect(second.isEnabled).toBe(true);
    expect(reached).toEqual([1, 2]);
  });

  it('拒绝把新序列和旧生命周期回调混装到同一定义', () => {
    const definition: CombatBuffDefinition<never> = {
      id: 'mixed',
      stackingType: 'unique',
      actions: { start: () => undefined },
    };
    const operations: CombatOperationExecutor = {
      execute: () => true,
      evaluate: () => true,
    };

    expect(() => attachBuffLifecycleSequences(definition, {}, () => operations)).toThrow(
      'cannot mix legacy lifecycle actions',
    );
  });

  it('按实例来源选择操作链，而不把来源固化到共享定义', () => {
    const reached: string[] = [];
    const executor = (sourceId: string): CombatOperationExecutor => ({
      execute: () => {
        reached.push(sourceId);
        return true;
      },
      evaluate: () => true,
    });
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'shared', stackingType: 'unlimited' },
      {
        start: {
          steps: [
            {
              kind: 'setContextFlag',
              parameters: { flag: 'started', value: true, target: 'caster' },
            },
          ],
        },
      },
      buff => executor(buff.sourceId),
    );
    const container = new CombatBuffContainer<never>('enemy', new CombatAttributeSet<never>());

    container.add(definition, 'operator-a');
    container.add(definition, 'operator-b');

    expect(reached).toEqual(['operator-a', 'operator-b']);
  });

  it('为 Buff 实例保留独立目标组并支持同步逐目标执行', () => {
    const reached: number[] = [];
    const operations: CombatOperationExecutor = {
      execute(step, context): boolean {
        if (step.kind === 'findOwnerSpawnedAbilityEntities') {
          context!.targetContext!.set('seals', [
            { kind: 'abilityEntity', instanceId: 11 },
            { kind: 'abilityEntity', instanceId: 12 },
          ]);
        } else {
          const current = context?.currentTarget;
          if (current?.kind === 'abilityEntity') reached.push(current.instanceId);
        }
        return true;
      },
      evaluate: () => true,
    };
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'target-context', stackingType: 'unique' },
      {
        enable: {
          steps: [
            {
              kind: 'findOwnerSpawnedAbilityEntities',
              parameters: { saveToContextKey: 'seals', abilityEntityIds: ['seal'] },
            },
            {
              kind: 'forEachContextTarget',
              parameters: { contextKey: 'seals' },
              body: {
                steps: [
                  {
                    kind: 'setContextFlag',
                    parameters: { flag: 'visited', value: true, target: 'caster' },
                  },
                ],
              },
            },
          ],
        },
      },
      () => operations,
    );
    const container = new CombatBuffContainer<never>('enemy', new CombatAttributeSet<never>());

    container.add(definition, 'operator');

    expect(reached).toEqual([11, 12]);
  });

  it('按 Buff 实例局部时钟推进时间线，并在停用后从头重新启用', () => {
    const reached: number[] = [];
    const operations: CombatOperationExecutor = {
      execute: (_step, context) => {
        reached.push(context!.blackboard.getNumber('instance')!);
        return true;
      },
      evaluate: () => true,
    };
    const container = new CombatBuffContainer<never>('enemy', new CombatAttributeSet<never>());
    const definition = attachBuffLifecycleSequences<never>(
      {
        id: 'scheduled',
        stackingType: 'unlimited',
        blackboard: { instance: 0 },
      },
      {},
      () => operations,
      undefined,
      [],
      undefined,
      [
        {
          startFrame: 2,
          sequence: {
            steps: [
              {
                kind: 'setContextFlag',
                parameters: { flag: 'reached', value: true, target: 'caster' },
              },
            ],
          },
        },
      ],
    );
    const first = container.add(definition, 'source', { blackboardValues: { instance: 1 } })!;
    container.add(definition, 'source', { blackboardValues: { instance: 2 } });

    container.tick(1 / 30);
    const savedActions = structuredClone(first.runtimeState.actionHost);
    expect(savedActions!.scheduled!.passedFrames).toBe(1);
    first.disable();
    container.tick(1 / 30);
    expect(reached).toEqual([2]);

    first.enable();
    container.tick(1 / 30);
    expect(reached).toEqual([2]);
    container.tick(1 / 30);
    expect(reached).toEqual([2, 1]);
    expect(savedActions!.scheduled!.passedFrames).toBe(1);
    expect(savedActions!.scheduled!.timeline!.scheduling.nextPendingIndex).toBe(0);
    expect(first.runtimeState.actionHost!.scheduled!.passedFrames).toBe(2);
  });

  it('乱序声明的 Buff 局部时间线恢复后仍按声明顺序跨过节点，且不重放已过帧', () => {
    const createDefinition = (reached: string[]) =>
      attachBuffLifecycleSequences<never>(
        { id: 'restored-scheduled', stackingType: 'unique' },
        {},
        () => ({
          execute: step => {
            if (step.kind !== 'setContextFlag') throw new Error(`unexpected step '${step.kind}'`);
            reached.push(step.parameters.flag);
            return true;
          },
          evaluate: () => true,
        }),
        undefined,
        [],
        undefined,
        [
          {
            startFrame: 4,
            sequence: {
              steps: [
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'future', value: true, target: 'caster' },
                },
              ],
            },
          },
          {
            startFrame: 3,
            sequence: {
              steps: [
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'earlier-future', value: true, target: 'caster' },
                },
              ],
            },
          },
          {
            startFrame: 1,
            sequence: {
              steps: [
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'past', value: true, target: 'caster' },
                },
              ],
            },
          },
        ],
      );
    const originalReached: string[] = [];
    const original = new CombatBuffContainer<never>('owner', new CombatAttributeSet<never>());
    const originalDefinition = createDefinition(originalReached);
    original.add(originalDefinition, 'source');
    original.tick(2 / 30);
    expect(originalReached).toEqual(['past']);
    const saved = structuredClone(original.runtimeState);

    const restoredReached: string[] = [];
    const restored = new CombatBuffContainer<never>(
      'owner',
      new CombatAttributeSet(saved.attributes),
      undefined,
      null,
      ActionBlackboard.bindRuntimeState(saved.entityBlackboard),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      saved,
    );
    const restoredDefinition = createDefinition(restoredReached);
    restored.bindRestoredInstances(state =>
      state.identity.definitionId === restoredDefinition.id ? restoredDefinition : undefined,
    );
    restored.tick(2 / 30);

    expect(restoredReached).toEqual(['future', 'earlier-future']);
    expect(originalReached).toEqual(['past']);
  });

  it('让启用序列的作用域操作持续到 Buff 停用或结束', () => {
    const reached: string[] = [];
    const operations: CombatOperationExecutor = {
      execute: () => {
        reached.push('apply');
        return true;
      },
      end: () => reached.push('finish'),
      evaluate: () => true,
    };
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'persistent-aura', stackingType: 'unlimited' },
      {
        enable: {
          steps: [
            {
              kind: 'applyBuff',
              parameters: {
                buffId: 'aura-child',
                target: 'enemy',
                finishByAction: true,
              },
            },
          ],
        },
      },
      () => operations,
    );
    const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
    const disabled = container.add(definition, 'source')!;

    expect(reached).toEqual(['apply']);
    disabled.disable();
    expect(reached).toEqual(['apply', 'finish']);

    const finished = container.add(definition, 'source')!;
    expect(reached).toEqual(['apply', 'finish', 'apply']);
    finished.finish();
    expect(reached).toEqual(['apply', 'finish', 'apply', 'finish']);
  });

  it('只在 Buff 启用期间订阅承伤事件并把伤害属性交给事件条件', () => {
    const reached: string[] = [];
    const terminal: CombatOperationExecutor = {
      execute: (_step, context) => {
        reached.push(context!.event!.kind ?? 'native');
        return true;
      },
      evaluate: condition => {
        throw new Error(`unexpected terminal condition '${condition.kind}'`);
      },
    };
    const dispatcher = new AbilityEventDispatcher<'beforeTakeDamage', AbilityEventPayloadMap>();
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'damage-listener', stackingType: 'unique' },
      {},
      () => new EventContextConditionExecutor(terminal),
      undefined,
      [
        {
          event: 'beforeTakeDamage',
          priority: 7,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'eventDamageTagsMatch',
                    match: 'hasAll',
                    tags: ['normalSkill'],
                  },
                },
                whenTrue: {
                  steps: [
                    {
                      kind: 'conditional',
                      parameters: { condition: { kind: 'eventSourceMatchesBuffSource' } },
                      whenTrue: {
                        steps: [
                          {
                            kind: 'setContextFlag',
                            parameters: { flag: 'matched', value: true, target: 'caster' },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
      (event, priority, handle) => {
        if (event !== 'beforeTakeDamage') throw new Error(`unexpected event '${event}'`);
        return dispatcher.registerAction(event, priority, context => handle(context));
      },
    );
    const container = new CombatBuffContainer<never>('enemy', new CombatAttributeSet<never>());
    const buff = container.add(definition, 'seal')!;
    expect(buff.runtimeState.actionHost!.eventResponses).toHaveLength(1);
    expect(buff.runtimeState.actionHost!.eventResponses[0]!.subscriptions).toHaveLength(1);
    expect(buff.runtimeState.actionHost!.eventResponses[0]!.subscriptions[0]!.state).toBe(
      dispatcher.runtimeState,
    );
    const dispatch = (
      tags: readonly import('../../game-data/operatorDefinition').DamageTag[],
      sourceId = 'seal',
    ) =>
      dispatcher.dispatch(
        {
          event: 'beforeTakeDamage',
          payload: {
            ...createKillEvent(sourceId).payload,
            sourceId,
            targetId: 'enemy',
            tags,
            features: [],
          },
        },
        [],
      );

    dispatch(['normalAttack']);
    dispatch(['normalSkill'], 'other-source');
    dispatch(['normalSkill']);
    buff.disable();
    dispatch(['normalSkill']);
    buff.enable();
    dispatch(['normalSkill']);
    buff.finish();
    dispatch(['normalSkill']);

    expect(reached).toEqual(['native', 'native']);
  });

  it('把失衡归零事件保留为带来源身份的 Ability 事件', () => {
    const reached: string[] = [];
    const terminal: CombatOperationExecutor = {
      execute: (_step, context) => {
        reached.push(context!.event!.kind ?? 'native');
        return true;
      },
      evaluate: condition => {
        throw new Error(`unexpected terminal condition '${condition.kind}'`);
      },
    };
    const dispatcher = new AbilityEventDispatcher<'poiseZero', AbilityEventPayloadMap>();
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'poise-listener', stackingType: 'unique' },
      {},
      () => new EventContextConditionExecutor(terminal, sourceId => sourceId === 'operator'),
      undefined,
      [
        {
          event: 'poiseZero',
          priority: 0,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: { condition: { kind: 'eventSourceControlled' } },
                whenTrue: {
                  steps: [
                    {
                      kind: 'setContextFlag',
                      parameters: { flag: 'broken', value: true, target: 'caster' },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
      (event, priority, handle) => {
        if (event !== 'poiseZero') throw new Error(`unexpected event '${event}'`);
        return dispatcher.registerAction(event, priority, context => handle(context));
      },
    );
    const container = new CombatBuffContainer<never>('enemy', new CombatAttributeSet<never>());
    container.add(definition, 'abilityentity.arcane')!;

    dispatcher.dispatch(
      {
        event: 'poiseZero',
        payload: {
          sourceId: 'operator',
          targetId: 'enemy',
        },
      },
      [],
    );

    expect(reached).toEqual(['native']);
  });

  it('只在 Buff 启用期间订阅原生击杀事件', () => {
    const reached: string[] = [];
    const received: unknown[] = [];
    let handler:
      ((event: import('../events/combatAbilityEvent').NativeKillEvent) => void) | undefined;
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'kill-listener', stackingType: 'unique' },
      {},
      () => ({
        execute: (_step, context) => {
          const event = context!.event!;
          received.push(event);
          reached.push('payload' in event ? event.event : event.kind);
          return true;
        },
        evaluate: () => true,
      }),
      undefined,
      [
        {
          event: 'afterKillEntity',
          priority: 3,
          sequence: {
            steps: [
              {
                kind: 'setContextFlag',
                parameters: { flag: 'extended', value: true, target: 'caster' },
              },
            ],
          },
        },
      ],
      (_event, _priority, callback) => {
        handler = callback;
        return { dispose: () => (handler = undefined) };
      },
    );
    const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
    const buff = container.add(definition, 'operator')!;
    const event = createKillEvent();

    handler!(event);
    buff.disable();
    expect(handler).toBeUndefined();
    buff.enable();
    handler!(event);
    buff.finish();
    expect(handler).toBeUndefined();
    expect(reached).toEqual(['afterKillEntity', 'afterKillEntity']);
    expect(received).toHaveLength(2);
    expect(received[0]).toBe(event);
    expect(received[1]).toBe(event);
  });

  it.each([
    ['skill', 'gain'],
    ['normalAttack', 'gain'],
    ['skill', 'refund'],
  ] as const)('Buff OnObtainAtb 不提前过滤 %s/%s', (source, gainKind) => {
    const reached: string[] = [];
    let handler:
      ((event: import('../events/combatAbilityEvent').SpGainAbilityEvent) => void) | undefined;
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'skill-sp-listener', stackingType: 'unique' },
      {},
      () => ({
        execute: (_step, context) => {
          reached.push(context!.event!.kind ?? 'native');
          return true;
        },
        evaluate: () => true,
      }),
      undefined,
      [
        {
          event: 'skillSpGained',
          priority: 0,
          sequence: {
            steps: [
              {
                kind: 'setContextFlag',
                parameters: { flag: 'reached', value: true, target: 'caster' },
              },
            ],
          },
        },
      ],
      (_event, _priority, callback) => {
        handler = callback;
        return { dispose: () => (handler = undefined) };
      },
    );
    const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
    container.add(definition, 'operator')!;

    handler!({
      event: 'skillSpGained',
      payload: {
        sourceOperatorId: 'operator',
        source,
        gainKind,
        requestedAmount: 20,
        amount: 0,
      },
    });
    expect(reached).toEqual(['native']);
  });

  it('事件响应可以结束正在执行响应的 Buff 并立即注销自身订阅', () => {
    let executions = 0;
    const terminal: CombatOperationExecutor = {
      execute: (step, context) => {
        if (step.kind !== 'finishCurrentBuff') {
          throw new Error(`unexpected operation '${step.kind}'`);
        }
        executions += 1;
        return context!.finishCurrentBuff!(
          step.parameters.reason,
          context!.buffSourceId!,
          context!.skillCastInfo ?? null,
        );
      },
      evaluate: condition => {
        throw new Error(`unexpected condition '${condition.kind}'`);
      },
    };
    const dispatcher = new AbilityEventDispatcher<'beforeTakeDamage', AbilityEventPayloadMap>();
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'self-finishing-listener', stackingType: 'unique' },
      {},
      () => terminal,
      undefined,
      [
        {
          event: 'beforeTakeDamage',
          priority: 0,
          sequence: {
            steps: [
              {
                kind: 'finishCurrentBuff',
                parameters: { reason: 'early', finishSource: 'actionSource' },
              },
            ],
          },
        },
      ],
      (event, priority, handle) => {
        if (event !== 'beforeTakeDamage') throw new Error(`unexpected event '${event}'`);
        return dispatcher.registerAction(event, priority, context => handle(context));
      },
    );
    const container = new CombatBuffContainer<never>('enemy', new CombatAttributeSet<never>());
    const buff = container.add(definition, 'seal')!;
    const dispatch = () =>
      dispatcher.dispatch(
        {
          event: 'beforeTakeDamage',
          payload: {
            ...createKillEvent('seal').payload,
            sourceId: 'seal',
            targetId: 'enemy',
            tags: ['normalSkill'],
            features: [],
          },
        },
        [],
      );

    const consumed: unknown[] = [];
    container.configureConsumedObserver((instance, sourceId, layers, cast) => {
      consumed.push({ instance, sourceId, layers, cast });
    });
    dispatch();
    dispatch();

    expect(executions).toBe(1);
    expect(buff.isFinished).toBe(true);
    expect(buff.runtimeState.actionHost!.eventResponses).toEqual([]);
    expect(consumed).toEqual([{ instance: buff, sourceId: 'seal', layers: 1, cast: null }]);
  });

  it('按原始技能与结束 Buff 身份暂停并恢复当前 Buff 计时', () => {
    const terminal: CombatOperationExecutor = {
      execute: (step, context) => {
        if (step.kind !== 'setCurrentBuffTimePaused') {
          throw new Error(`unexpected operation '${step.kind}'`);
        }
        context!.setCurrentBuffTimePaused!(step.parameters.paused);
        return true;
      },
      evaluate: condition => {
        throw new Error(`unexpected condition '${condition.kind}'`);
      },
    };
    const dispatcher = new AbilityEventDispatcher<
      'beforeCastSkill' | 'finishedBuff',
      AbilityEventPayloadMap
    >();
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'combo-timer', stackingType: 'unique', durationSeconds: 1 },
      {},
      () => new EventContextConditionExecutor(terminal),
      undefined,
      [
        {
          event: 'beforeCastSkill',
          priority: 0,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: {
                  condition: { kind: 'eventSkillIdIn', skillIds: ['native-power-attack'] },
                },
                whenTrue: {
                  steps: [{ kind: 'setCurrentBuffTimePaused', parameters: { paused: true } }],
                },
              },
            ],
          },
        },
        {
          event: 'finishedBuff',
          priority: 0,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: {
                  condition: { kind: 'eventBuffIdMatch', buffIds: ['resume-marker'] },
                },
                whenTrue: {
                  steps: [{ kind: 'setCurrentBuffTimePaused', parameters: { paused: false } }],
                },
              },
            ],
          },
        },
      ],
      (event, priority, handle) => {
        if (event !== 'beforeCastSkill' && event !== 'finishedBuff') {
          throw new Error(`unexpected event '${event}'`);
        }
        return dispatcher.registerAction(event, priority, context => handle(context));
      },
    );
    const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
    const buff = container.add(definition, 'operator')!;

    dispatcher.dispatch(
      {
        event: 'beforeCastSkill',
        payload: {
          sourceId: 'operator',
          targetId: 'operator',
          skillType: 'finisher',
          skillId: 'native-power-attack',
          skillCastId: 1,
        },
      },
      [],
    );
    buff.tick(2);
    expect(buff.remainingDuration).toBe(1);

    dispatcher.dispatch(
      {
        event: 'finishedBuff',
        payload: {
          buff,
          sourceId: 'operator',
          targetId: 'operator',
          buffId: 'resume-marker',
          buffTags: [],
          reason: 'other',
        },
      },
      [],
    );
    buff.tick(1);
    expect(buff.isFinished).toBe(true);
  });

  it.each([false, true])('同级序列独立注册、注销和失败回滚 failSecond=%s', failSecond => {
    const createSequence = vi.spyOn(CombatActionSequenceRuntime.prototype, 'createSequence');
    let registered = 0;
    let disposed = 0;
    const handles: Array<
      Parameters<import('./buffLifecycleSequenceRuntime').RegisterBuffAbilityEventAction>[2]
    > = [];
    let reached = 0;
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'same-priority', stackingType: 'unique' },
      {},
      () => ({
        execute: () => {
          reached += 1;
          return true;
        },
        evaluate: () => false,
      }),
      undefined,
      [
        {
          event: 'addedBuff',
          priority: 0,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: { condition: { kind: 'casterControlled' } },
                whenTrue: {
                  steps: [
                    {
                      kind: 'setContextFlag',
                      parameters: { flag: 'first', value: true, target: 'caster' },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          event: 'addedBuff',
          priority: 0,
          sequence: {
            steps: [
              {
                kind: 'setContextFlag',
                parameters: { flag: 'second', value: true, target: 'caster' },
              },
            ],
          },
        },
      ],
      (_event, _priority, handle) => {
        registered += 1;
        if (failSecond && registered === 2) throw new Error('second registration failed');
        handles.push(handle);
        return {
          dispose: () => {
            disposed += 1;
          },
        };
      },
    );
    const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());

    if (failSecond) {
      expect(() => container.add(definition, 'source')).toThrow('second registration failed');
      createSequence.mockRestore();
      expect(registered).toBe(2);
      expect(disposed).toBe(1);
      expect(reached).toBe(0);
      return;
    }
    const buff = container.add(definition, 'source')!;
    const createdAtRegistration = createSequence.mock.calls.length;
    for (const handle of handles)
      handle({
        event: 'addedBuff',
        payload: {
          sourceId: 'source',
          targetId: 'operator',
          buffId: 'added',
          buffTags: [],
        },
      });

    const createdAfterEvent = createSequence.mock.calls.length;
    createSequence.mockRestore();
    expect(createdAtRegistration).toBe(2);
    expect(createdAfterEvent).toBe(createdAtRegistration);
    expect(registered).toBe(2);
    expect(reached).toBe(1);
    buff.finish('other', null);
    expect(disposed).toBe(2);
    buff.release();
    expect(disposed).toBe(2);
  });

  it.each(['finish', 'disable'] as const)(
    '同次分发前序%s后，同序列及快照中后续动作均不执行',
    mode => {
      const dispatcher = new AbilityEventDispatcher<
        AbilityResponseEventName,
        AbilityEventPayloadMap
      >();
      const reached: string[] = [];
      let finishOwner = () => {};
      const definition = attachBuffLifecycleSequences<never>(
        { id: 'finish-during-dispatch', stackingType: 'unique' },
        {},
        () => ({
          execute: step => {
            if (step.kind !== 'setContextFlag') throw new Error('unexpected step');
            reached.push(step.parameters.flag);
            finishOwner();
            return true;
          },
          evaluate: () => true,
        }),
        undefined,
        ['first', 'second'].map(flag => ({
          event: 'addedBuff' as const,
          priority: 0,
          sequence: {
            steps: [
              {
                kind: 'setContextFlag' as const,
                parameters: { flag, value: true, target: 'caster' as const },
              },
              {
                kind: 'conditional' as const,
                parameters: {
                  condition: {
                    kind: 'probability' as const,
                    probability: { kind: 'constant' as const, value: 1 },
                  },
                },
                whenTrue: {
                  steps: [
                    {
                      kind: 'setContextFlag' as const,
                      parameters: { flag: 'nested-later', value: true, target: 'caster' as const },
                    },
                  ],
                },
              },
            ],
          },
        })),
        (event, priority, handle) =>
          dispatcher.registerAction(event, priority, published => handle(published)),
      );
      const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
      const buff = container.add(definition, 'source')!;
      finishOwner = () => {
        if (mode === 'finish') buff.finish('other', null);
        else buff.disable();
      };
      dispatcher.dispatch(
        {
          event: 'addedBuff',
          payload: {
            sourceId: 'source',
            targetId: 'operator',
            buffId: 'incoming',
            buffTags: [],
          },
        },
        [],
      );
      expect(reached).toEqual(['first']);
      expect(buff.isFinished).toBe(mode === 'finish');
    },
  );

  it('叠层回调使用本次来源，满层仍回调，且不重置实例 once 状态', () => {
    const reached: unknown[] = [];
    const callback = {
      steps: [
        {
          kind: 'setContextFlag' as const,
          parameters: { flag: 'callback', value: true, target: 'caster' as const },
        },
      ],
    };
    const definition = attachBuffLifecycleSequences<never>(
      { id: 'layer', stackingType: 'enhanceAndRefresh', maxStackCount: 2 },
      {
        afterEnhance: {
          steps: [
            ...callback.steps,
            { kind: 'once', parameters: { scopeKey: 'per-buff' }, body: callback },
          ],
        },
      },
      (buff, sourceId = buff.sourceId) => ({
        execute: (_step, context) => {
          reached.push([
            sourceId,
            context?.actionSourceId,
            buff.enhanceCount,
            context?.buffSourceId,
          ]);
          return true;
        },
        evaluate: () => true,
      }),
    );
    const container = new CombatBuffContainer<never>('enemy', new CombatAttributeSet<never>());
    const buff = container.add(definition, 'creator')!;
    expect(reached).toEqual([
      ['creator', 'creator', 1, 'creator'],
      ['creator', 'creator', 1, 'creator'],
    ]);
    container.add(definition, 'teammate-a');
    container.add(definition, 'teammate-b');
    expect(reached).toEqual([
      ['creator', 'creator', 1, 'creator'],
      ['creator', 'creator', 1, 'creator'],
      ['teammate-a', 'teammate-a', 2, 'creator'],
      ['teammate-b', 'teammate-b', 2, 'creator'],
    ]);
    expect(buff.sourceId).toBe('creator');
  });

  it.each(['deferred', 'other', 'early'] as const)(
    '点燃结束只由实际结束入口通知：%s',
    finishMode => {
      const reached: string[] = [];
      const cast = {
        skillCastId: 52,
        originSkillId: 'ignite-skill',
        originSkillType: 'battleSkill' as const,
        nonReturnedSpCost: 0,
      };
      const terminal: CombatOperationExecutor = {
        execute: (_step, context) => {
          reached.push(context?.buffSourceId ?? '<missing>');
          expect(context?.skillCastInfo).toEqual(cast);
          expect(context?.actionSourceId).toBe('original-source');
          expect(context?.actionInputTarget).toEqual({ kind: 'operator', operatorId: 'operator' });
          if (finishMode !== 'deferred')
            container.finishInstance(buff, finishMode, 'nested-source', cast);
          return true;
        },
        evaluate: condition => {
          throw new Error(`unexpected condition '${condition.kind}'`);
        },
      };
      const definition = attachBuffLifecycleSequences<never>(
        { id: 'frozen', stackingType: 'unique' },
        {},
        () => terminal,
        undefined,
        [],
        undefined,
        [],
        [
          {
            igniteType: 'EndminUlt',
            finishAfterIgnited: true,
            sequence: {
              steps: [
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'reached', value: true, target: 'caster' },
                },
              ],
            },
          },
          {
            igniteType: 'EndminUlt',
            finishAfterIgnited: false,
            sequence: {
              steps: [
                {
                  kind: 'setContextFlag',
                  parameters: { flag: 'second-map', value: true, target: 'caster' },
                },
              ],
            },
          },
        ],
      );
      const container = new CombatBuffContainer<never>('enemy', new CombatAttributeSet<never>());
      const originalCast = { ...cast, skillCastId: 12, originSkillId: 'original-skill' };
      const buff = container.add(definition, 'original-source', { skillCastInfo: originalCast })!;
      const consumed: unknown[] = [];
      container.configureConsumedObserver((instance, sourceId, layers, finishCast) => {
        consumed.push({ instance, sourceId, layers, finishCast });
      });

      expect(container.ignite('PhysicalStatus', 'operator')).toBe(0);
      expect(container.ignite('EndminUlt', 'operator', cast)).toBe(1);
      expect(reached).toEqual(
        finishMode === 'deferred' ? ['original-source', 'original-source'] : ['original-source'],
      );
      expect(consumed).toEqual(
        finishMode === 'other'
          ? []
          : [
              {
                instance: buff,
                sourceId: finishMode === 'early' ? 'nested-source' : 'operator',
                layers: 1,
                finishCast: cast,
              },
            ],
      );
      expect(buff.finishReason).toBe(finishMode === 'deferred' ? 'ignite' : finishMode);
      expect(buff.skillCastInfo).toEqual(originalCast);
      expect(buff.sourceId).toBe('original-source');
    },
  );
});

it('物理后置 Buff 监听使用原始注册口并随启停注销，保留挂载端口', () => {
  const dispatcher = new AbilityEventDispatcher<
    'afterOutputPhysicalInfliction',
    import('../events/combatAbilityEvent').AbilityEventPayloadMap
  >();
  const received: unknown[] = [];
  const definition = attachBuffLifecycleSequences<never>(
    { id: 'physical-listener', stackingType: 'unique' },
    {},
    () => ({
      execute: (_step, context) => {
        received.push(context!.event);
        return true;
      },
      evaluate: () => true,
    }),
    undefined,
    [
      {
        event: 'afterOutputPhysicalInfliction',
        priority: 3,
        sequence: {
          steps: [
            { kind: 'setContextFlag', parameters: { flag: 'seen', value: true, target: 'caster' } },
          ],
        },
      },
    ],
    (event, priority, handle) => {
      if (event !== 'afterOutputPhysicalInfliction') throw new Error('unexpected event');
      return dispatcher.registerAction(event, priority, published => handle(published));
    },
  );
  const container = new CombatBuffContainer<never>('operator', new CombatAttributeSet<never>());
  const buff = container.add(definition, 'operator')!;
  const published = {
    event: 'afterOutputPhysicalInfliction' as const,
    payload: {
      sourceId: 'operator',
      targetId: 'enemy',
      type: 'fracture' as const,
      skillCastInfo: null,
      attachBuffToCurrentSkill: () => {},
    },
  };
  dispatcher.dispatch(published, []);
  buff.disable();
  dispatcher.dispatch(published, []);
  buff.enable();
  dispatcher.dispatch(published, []);
  buff.finish();
  dispatcher.dispatch(published, []);
  expect(received).toHaveLength(2);
  expect(received[0]).toBe(published);
  expect(received[1]).toBe(published);
});
