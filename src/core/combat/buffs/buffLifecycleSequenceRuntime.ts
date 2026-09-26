import { skillAbilityEvent } from '../events/combatAbilityEvent';
import { createSkillAffixState } from '../state/instanceState';
import {
  prepareSkillAffixRequest,
  releaseSkillAffixReference,
  startSkillAffixCast,
} from './skillAffixExecution';
/**
 * 把编译后的有序步骤绑定到 Buff 的同步生命周期边界。
 * 每个 Buff 实例独占动作黑板和 once 状态；调用方仍需提供完整战斗操作链。
 */
import type {
  CompiledTimelineAction,
  ResolvedActionSequence,
  ResolvedSkillBuffAbilityEventResponse,
  ResolvedSkillBuffIgniteEventResponse,
  ResolvedSkillBuffLifecycleSequences,
} from '../../compiler/combatProgram';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { runtimeTargetFromEntityId } from '../../game-data/logicalAbilityEntity';
import type { SkillBuffSlotReplacement } from '../../game-data/operatorDefinition';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import type { CombatActionExecution as ActionSequence } from '../actions/actionGraphExecution';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import type { CombatExecutionContext } from '../actions/combatStep';
import {
  DamageCalculationSnapshotProgram,
  DamageCalculationSnapshots,
} from '../damage/damageCalculationSnapshots';
import { createDamageModifierConditionProgram } from '../damage/damageModifierSequenceRuntime';
import type { AbilityEventRuntimeActionContext } from '../events/abilityEventActionContext';
import type { AbilityEventRegistration } from '../events/abilityEventDispatcher';
import {
  withAbilityEventResponseContext,
  withCombatEventResponseContext,
} from '../events/abilityEventResponseContext';
import type { CombatAbilityEvent } from '../events/combatAbilityEvent';
import type { KnockDownOutputEvent } from '../events/combatSemanticEventRuntime';
import type {
  CombatOperationContext,
  CombatOperationExecutor,
  ProjectileRuntimeDependencies,
} from '../skills/skillRuntime';
import {
  createCombatOperationHostState,
  type CombatOperationHostState,
} from '../state/actionState';
import type {
  AbilityEventSubscriptionReference,
  CombatSkillCastInfo,
} from '../state/foundationState';
import { type AbilityResponseEventName } from '../state/foundationState';
import { COMBAT_FRAMES_PER_SECOND } from '../time/combatClock';
import type { TimelineActionProcessor } from '../timeline/timelineActionProcessor';
import type {
  BuffDuringEnableAction,
  BuffLifecycleActions,
  CombatBuff,
  CombatBuffDefinition,
} from './combatBuffs';

export interface BuffAbilityEventRegistration extends AbilityEventRegistration {
  readonly subscriptions?: readonly AbilityEventSubscriptionReference[];
}

/** 由 Buff 所有者环境提供的事件注册端口，避免生命周期层依赖具体伤害环境。 */
export type RegisterBuffAbilityEventAction = (
  event: AbilityResponseEventName,
  priority: number,
  handle: (
    published: CombatAbilityEvent<AbilityResponseEventName>,
    actionContext?: AbilityEventRuntimeActionContext,
  ) => void,
  subscriptions?: readonly AbilityEventSubscriptionReference[],
) => BuffAbilityEventRegistration;

export type RegisterBuffSemanticEventAction = (
  event: 'outputKnockDown',
  priority: number,
  handle: (event: KnockDownOutputEvent, actionContext?: AbilityEventRuntimeActionContext) => void,
  subscriptions?: readonly AbilityEventSubscriptionReference[],
) => BuffAbilityEventRegistration;

/** 原生 RegisterEvent 回调阶段；不进入 SequenceAction 优先级队列。 */
export type RegisterBuffAbilityEventCallback = (
  event: AbilityResponseEventName,
  handle: (published: CombatAbilityEvent<AbilityResponseEventName>) => void,
  subscriptions?: readonly AbilityEventSubscriptionReference[],
) => BuffAbilityEventRegistration;

class BuffScheduledSequenceAction<Key extends string> implements BuffDuringEnableAction<Key> {
  readonly #context: CombatExecutionContext = {};
  readonly #actions: readonly CompiledTimelineAction[];
  readonly #runtimeFor: (buff: CombatBuff<Key>) => CombatActionSequenceRuntime;
  #timeline: TimelineActionProcessor | null = null;
  #state: import('../state/instanceState').BuffScheduledActionState = {
    passedFrames: 0,
    timeline: null,
  };

  constructor(
    actions: readonly CompiledTimelineAction[],
    runtimeFor: (buff: CombatBuff<Key>) => CombatActionSequenceRuntime,
  ) {
    // 保留配置顺序；公共 createTimeline 负责到期索引和切面数组之间的映射。
    this.#actions = actions;
    this.#runtimeFor = runtimeFor;
  }

  createRuntimeInstance(): BuffDuringEnableAction<Key> {
    return new BuffScheduledSequenceAction(this.#actions, this.#runtimeFor);
  }

  bindRestored(buff: CombatBuff<Key>): void {
    const saved = buff.runtimeState.actionHost?.scheduled;
    if (saved === null || saved === undefined) {
      throw new Error(`restored Buff '${buff.definition.id}' has no scheduled action state`);
    }
    this.#state = saved;
    if (saved.timeline === null) {
      if (buff.isEnabled) {
        throw new Error(`restored enabled Buff '${buff.definition.id}' has no scheduled timeline`);
      }
      this.#timeline = null;
      return;
    }
    if (saved.timeline.sequences.length !== this.#actions.length) {
      throw new Error(
        `restored Buff '${buff.definition.id}' scheduled action count does not match`,
      );
    }
    const runtime = this.#runtimeFor(buff);
    try {
      this.#timeline = runtime.createTimeline(this.#actions, {}, saved.timeline);
    } catch (cause) {
      throw new Error(
        `restored Buff '${buff.owner.ownerId}:${buff.definition.id}:${buff.instanceId}' scheduled actions cannot bind`,
        { cause },
      );
    }
  }

  tryExecute(buff: CombatBuff<Key>): boolean {
    if (this.#timeline !== null) throw new Error(`Buff '${buff.definition.id}' timeline is active`);
    const runtime = this.#runtimeFor(buff);
    this.#timeline = runtime.createTimeline(this.#actions);
    this.#state.passedFrames = 0;
    this.#state.timeline = this.#timeline.runtimeState;
    buff.runtimeState.actionHost!.scheduled = this.#state;
    this.#timeline.reset(this.#context);
    this.#timeline.tick(0, 0, this.#context);
    return true;
  }

  tick(deltaTime: number): void {
    if (this.#timeline === null || this.#timeline.isComplete) return;
    this.#state.passedFrames += deltaTime * COMBAT_FRAMES_PER_SECOND;
    this.#timeline.tick(this.#state.passedFrames, deltaTime, this.#context);
  }

  end(): void {
    this.#timeline?.end(this.#state.passedFrames, this.#context);
  }

  reset(): void {
    this.#timeline = null;
    this.#state.passedFrames = 0;
    this.#state.timeline = null;
  }
}

class BuffSkillSlotReplacementAction<Key extends string> implements BuffDuringEnableAction<Key> {
  #active = false;

  constructor(
    readonly replacements: readonly SkillBuffSlotReplacement[],
    readonly resolveOperations: (buff: CombatBuff<Key>) => CombatOperationExecutor,
    readonly ensureActionHost: (buff: CombatBuff<Key>) => void,
  ) {}

  createRuntimeInstance(): BuffDuringEnableAction<Key> {
    return new BuffSkillSlotReplacementAction(
      this.replacements,
      this.resolveOperations,
      this.ensureActionHost,
    );
  }

  bindRestored(buff: CombatBuff<Key>): void {
    const active = buff.runtimeState.actionHost?.skillSlotsReplaced;
    if (active === undefined) {
      throw new Error(`restored Buff '${buff.definition.id}' has no skill-slot state`);
    }
    if (active !== buff.isEnabled) {
      throw new Error(`restored Buff '${buff.definition.id}' skill-slot state is inconsistent`);
    }
    this.#active = active;
  }

  tryExecute(buff: CombatBuff<Key>): boolean {
    if (this.#active)
      throw new Error(`buff '${buff.definition.id}' skill slots are already replaced`);
    this.ensureActionHost(buff);
    const operations = this.resolveOperations(buff);
    let applied = 0;
    try {
      for (const replacement of this.replacements) {
        operations.execute({
          kind: 'changeSkillSlot',
          parameters: {
            skillGroupKey: replacement.skillGroupKey,
            targetSkillKey: replacement.targetSkillKey,
            inheritOriginSkillCooldownProgress: replacement.inheritOriginSkillCooldownProgress,
          },
        });
        applied += 1;
      }
      this.#active = true;
      buff.runtimeState.actionHost!.skillSlotsReplaced = true;
      return true;
    } catch (error) {
      for (const replacement of this.replacements.slice(0, applied).reverse()) {
        operations.execute({
          kind: 'changeSkillSlot',
          parameters: {
            skillGroupKey: replacement.skillGroupKey,
            targetSkillKey: replacement.revertedSkillKey,
            inheritOriginSkillCooldownProgress: replacement.inheritOriginSkillCooldownProgress,
          },
        });
      }
      throw error;
    }
  }

  tick(): void {}

  end(buff: CombatBuff<Key>): void {
    if (!this.#active) return;
    const operations = this.resolveOperations(buff);
    for (const replacement of [...this.replacements].reverse()) {
      operations.execute({
        kind: 'changeSkillSlot',
        parameters: {
          skillGroupKey: replacement.skillGroupKey,
          targetSkillKey: replacement.revertedSkillKey,
          inheritOriginSkillCooldownProgress: replacement.inheritOriginSkillCooldownProgress,
        },
      });
    }
    this.#active = false;
    buff.runtimeState.actionHost!.skillSlotsReplaced = false;
  }

  reset(buff: CombatBuff<Key>): void {
    this.#active = false;
    buff.runtimeState.actionHost!.skillSlotsReplaced = false;
  }
}

class CompositeBuffDuringEnableAction<Key extends string> implements BuffDuringEnableAction<Key> {
  constructor(readonly actions: readonly BuffDuringEnableAction<Key>[]) {}

  createRuntimeInstance(): BuffDuringEnableAction<Key> {
    return new CompositeBuffDuringEnableAction(
      this.actions.map(action => action.createRuntimeInstance()),
    );
  }

  bindRestored(buff: CombatBuff<Key>): void {
    for (const action of this.actions) {
      if (action.bindRestored === undefined) {
        throw new Error(`restored Buff '${buff.definition.id}' has an unbindable active action`);
      }
      action.bindRestored(buff);
    }
  }

  tryExecute(buff: CombatBuff<Key>): boolean {
    for (const action of this.actions) {
      if (!action.tryExecute(buff)) return false;
    }
    return true;
  }

  tick(deltaTime: number, buff: CombatBuff<Key>): void {
    for (const action of this.actions) action.tick(deltaTime, buff);
  }

  end(buff: CombatBuff<Key>): void {
    for (const action of [...this.actions].reverse()) action.end(buff);
  }

  reset(buff: CombatBuff<Key>): void {
    for (const action of this.actions) action.reset(buff);
  }
}

export type RegisterPostSkillCastRequest = (
  handle: (info: CombatSkillCastInfo | null) => void,
  restoredRegistrationId?: number,
) => { readonly registrationId?: number; dispose(): void };

/** 恢复 SkillAffix 持有的实体 reset 或 Buff recycle 登记。 */
export type BindRestoredSkillAffixObjectReference = (
  reference: import('../state/instanceState').SkillAffixObjectReference,
  release: () => void,
) => { dispose(): void };

/** 为一份已编译 Buff 定义安装同步生命周期序列。 */
export function attachBuffLifecycleSequences<Key extends string>(
  definition: CombatBuffDefinition<Key>,
  sequences: ResolvedSkillBuffLifecycleSequences,
  resolveOperations: (
    buff: CombatBuff<Key>,
    actionSourceId?: string,
    skillCastInfo?: CombatSkillCastInfo | null,
    operationState?: CombatOperationHostState,
  ) => CombatOperationExecutor,
  currentTarget?: RuntimeTargetRef,
  abilityEventResponses: readonly ResolvedSkillBuffAbilityEventResponse[] = [],
  registerAbilityEventAction?: RegisterBuffAbilityEventAction,
  scheduledSequences: readonly CompiledTimelineAction[] = [],
  igniteEventResponses: readonly ResolvedSkillBuffIgniteEventResponse[] = [],
  skillSlotReplacements: readonly SkillBuffSlotReplacement[] = [],
  registerSemanticEventAction?: RegisterBuffSemanticEventAction,
  damageModifierConditionPrograms: readonly (ResolvedActionSequence | undefined)[] = [],
  registerAbilityEventCallback?: RegisterBuffAbilityEventCallback,
  registerPostSkillCastRequest?: RegisterPostSkillCastRequest,
  resolveProjectileRuntimeDependencies?: (
    definitionOwnerId: string,
  ) => ProjectileRuntimeDependencies,
  bindRestoredSkillAffixObjectReference?: BindRestoredSkillAffixObjectReference,
): CombatBuffDefinition<Key> {
  if (definition.actions !== undefined) {
    throw new Error(
      `buff '${definition.id}' cannot mix legacy lifecycle actions with ordered lifecycle sequences`,
    );
  }

  const runtimes = new WeakMap<CombatBuff<Key>, CombatActionSequenceRuntime>();
  const eventRegistrations = new WeakMap<CombatBuff<Key>, BuffAbilityEventRegistration[]>();
  const activeEnableSequences = new WeakMap<CombatBuff<Key>, ActionSequence>();
  const triggerSequences = new WeakMap<CombatBuff<Key>, ActionSequence>();
  interface SkillAffixBinding {
    dispose(): void;
    bindObjectReferences(): void;
  }
  const affixBindings = new WeakMap<CombatBuff<Key>, Map<number, SkillAffixBinding>>();
  const damageSnapshotProgram = new DamageCalculationSnapshotProgram();
  const bindSkillAffixState = (
    buff: CombatBuff<Key>,
    state: import('../state/instanceState').SkillAffixState,
    restoring: boolean,
  ): void => {
    if (registerAbilityEventCallback === undefined)
      throw new Error('SkillAffix requires Buff ability-event registration');
    if (state.disposed) throw new Error(`SkillAffix '${state.instanceId}' is already disposed`);
    const affixes = buff.runtimeState.actionHost!.affixes;
    const bindings = affixBindings.get(buff) ?? new Map<number, SkillAffixBinding>();
    if (bindings.has(state.instanceId)) {
      throw new Error(`SkillAffix '${state.instanceId}' is already bound`);
    }
    affixBindings.set(buff, bindings);
    const registrations: AbilityEventRegistration[] = [];
    const objectReferences = new Map<number, { dispose(): void }>();
    const registration: SkillAffixBinding = {
      dispose: () => {
        if (state.disposed) return;
        state.disposed = true;
        state.pendingRequest = false;
        for (const handle of registrations) handle.dispose();
        state.eventSubscriptions.clear();
        state.postSkillRequestRegistrationId = null;
        for (const handle of objectReferences.values()) handle.dispose();
        objectReferences.clear();
        state.objectReferences.clear();
        const index = affixes.indexOf(state);
        if (index !== -1) affixes.splice(index, 1);
        bindings.delete(state.instanceId);
      },
      bindObjectReferences: () => {
        if (objectReferences.size !== 0) {
          throw new Error(`SkillAffix '${state.instanceId}' object references are already bound`);
        }
        if (
          state.objectReferences.size !== 0 &&
          bindRestoredSkillAffixObjectReference === undefined
        ) {
          throw new Error(`SkillAffix '${state.instanceId}' has no object reference binding port`);
        }
        for (const [referenceId, saved] of state.objectReferences) {
          const reference = bindRestoredSkillAffixObjectReference!(saved, () => {
            objectReferences.delete(referenceId);
            state.objectReferences.delete(referenceId);
            decreaseReference();
          });
          objectReferences.set(referenceId, reference);
        }
      },
    };
    const decreaseReference = () => {
      if (!releaseSkillAffixReference(state)) return;
      // Native SkillAffix._DecreaseRefCount ends with Other and an empty cast context.
      if (buff.finish('other', null)) registration.dispose();
    };
    const handle = (published: CombatAbilityEvent<AbilityResponseEventName>) => {
      if (state.disposed) return;
      if (published.event === 'abilityEntitySpawned' || published.event === 'projectileLaunched') {
        if (
          published.payload.sourceId !== buff.owner.ownerId ||
          published.payload.skillCastInfo?.skillCastId !== state.skillCastId
        )
          return;
        const referenceId = state.nextObjectReferenceId++;
        const reference = published.payload.entity.onReset(() => {
          objectReferences.delete(referenceId);
          state.objectReferences.delete(referenceId);
          decreaseReference();
        });
        objectReferences.set(referenceId, reference);
        state.objectReferences.set(referenceId, {
          kind: 'entity',
          target: { kind: 'abilityEntity', instanceId: published.payload.entity.instanceId },
          resetRegistrationId: reference.registrationId,
        });
        state.references++;
        return;
      }
      if (published.event === 'outputBuff') {
        const output = published.payload.buff;
        if (
          published.payload.sourceId !== buff.owner.ownerId ||
          output.affixSkillCastId !== 0 ||
          output.skillCastInfo?.skillCastId !== state.skillCastId
        )
          return;
        const referenceId = state.nextObjectReferenceId++;
        const reference = output.onRecycled(() => {
          objectReferences.delete(referenceId);
          state.objectReferences.delete(referenceId);
          decreaseReference();
        });
        objectReferences.set(referenceId, reference);
        state.objectReferences.set(referenceId, {
          kind: 'buff',
          reference: { ownerId: published.payload.targetId, instanceId: output.instanceId },
          recycleRegistrationId: reference.registrationId,
        });
        state.references++;
        return;
      }
      const event = skillAbilityEvent(published);
      if (event === undefined || event.payload.sourceId !== buff.owner.ownerId) return;
      if (event.event === 'beforeCastSkill') {
        if (startSkillAffixCast(state, event.payload.skillCastId)) decreaseReference();
        return;
      }
      if (event.event === 'skillEnd' && event.payload.skillCastId === state.skillCastId)
        decreaseReference();
    };
    try {
      if (registerPostSkillCastRequest !== undefined) {
        if (restoring && state.postSkillRequestRegistrationId === null) {
          throw new Error(`SkillAffix '${state.instanceId}' has no saved request listener`);
        }
        const requestRegistration = registerPostSkillCastRequest(
          info => prepareSkillAffixRequest(state, info?.skillCastId),
          restoring ? (state.postSkillRequestRegistrationId ?? undefined) : undefined,
        );
        if (!restoring) {
          state.postSkillRequestRegistrationId = requestRegistration.registrationId ?? null;
        }
        registrations.push(requestRegistration);
      } else if (restoring && state.postSkillRequestRegistrationId !== null) {
        throw new Error(`SkillAffix '${state.instanceId}' request listener has no binding port`);
      }
      for (const event of [
        'beforeCastSkill',
        'skillEnd',
        'outputBuff',
        'abilityEntitySpawned',
        'projectileLaunched',
      ] as const) {
        const saved = restoring ? state.eventSubscriptions.get(event) : undefined;
        if (restoring && (saved === undefined || saved.length === 0)) {
          throw new Error(`SkillAffix '${state.instanceId}' has no saved '${event}' subscription`);
        }
        const eventRegistration = registerAbilityEventCallback(event, handle, saved);
        if (!restoring && eventRegistration.subscriptions !== undefined) {
          state.eventSubscriptions.set(event, [...eventRegistration.subscriptions]);
        }
        registrations.push(eventRegistration);
      }
    } catch (error) {
      registration.dispose();
      throw error;
    }
    bindings.set(state.instanceId, registration);
  };
  const runtimeFor = (
    buff: CombatBuff<Key>,
    restoredHost?: import('../state/instanceState').BuffActionHostState,
  ): CombatActionSequenceRuntime => {
    let runtime = runtimes.get(buff);
    if (runtime !== undefined) return runtime;
    // 伤害修正条件会在 Buff 外壳构造时先索取宿主，此时恢复动作尚未正式重绑。
    // 已有数据必须直接绑定，不能用空宿主覆盖其中的 Enable/SkillAffix 进度。
    restoredHost ??= buff.runtimeState.actionHost ?? undefined;
    const actionOwner = runtimeTargetFromEntityId(buff.owner.ownerId);
    const context: CombatOperationContext = {
      actionOwnerId: buff.owner.ownerId,
      ...(actionOwner.kind === 'abilityEntity' ? { actionOwnerAbilityEntity: actionOwner } : {}),
      blackboard: buff.blackboard,
      canExecuteAction: () => buff.isEnabled && !buff.isFinished,
      damageCalculationSnapshots: new DamageCalculationSnapshots(
        damageSnapshotProgram,
        restoredHost?.damageSnapshots,
      ),
      targetContext: new RuntimeTargetContext(restoredHost?.targets),
      ...(currentTarget === undefined ? {} : { currentTarget }),
      ...(buff.skillCastInfo === null ? {} : { skillCastInfo: buff.skillCastInfo }),
      buffSourceId: buff.sourceId,
      buffOwnerId: buff.owner.ownerId,
      executingBuff: {
        buffId: buff.definition.id,
        buffOwnerId: buff.owner.ownerId,
        buffInstanceId: buff.instanceId,
      },
      ...(resolveProjectileRuntimeDependencies === undefined
        ? {}
        : resolveProjectileRuntimeDependencies(buff.definitionOwnerId)),
      finishCurrentBuff: (reason, sourceId, skillCastInfo) =>
        buff.owner.finishInstance(buff, reason, sourceId, skillCastInfo),
      getCurrentBuffAffixSkillCastId: () => buff.affixSkillCastId,
      bindCurrentBuffSkillAffix: skillCastId => {
        buff.recordBuffAffixSkillCastId(skillCastId);
        const host = buff.runtimeState.actionHost!;
        const state = createSkillAffixState(host.nextAffixId++, skillCastId);
        host.affixes.push(state);
        bindSkillAffixState(buff, state, false);
        return state.instanceId;
      },
      finishCurrentBuffSkillAffix: affixId => {
        const binding = affixBindings.get(buff)?.get(affixId);
        if (binding === undefined) throw new Error(`SkillAffix '${affixId}' binding is missing`);
        binding.dispose();
      },
      ...(buff.finishParentGlobalBuff === null
        ? {}
        : { finishParentGlobalBuff: buff.finishParentGlobalBuff }),
      getCurrentBuffEnhanceCount: () => buff.enhanceCount,
      getCurrentBuffRemainingDuration: () => buff.remainingDuration,
      setCurrentBuffRemainingDuration: duration => buff.rawSetRemainingDuration(duration),
      refreshCurrentBuffAttributeModifiers: () => buff.refreshAttributeModifierValues(),
      addCurrentBuffChild: child => buff.attachChildBuff(child),
      setCurrentBuffTimePaused: paused => buff.setTimePaused(paused),
    };
    const operationState = restoredHost?.operations ?? createCombatOperationHostState();
    const defaultOperations = resolveOperations(buff, undefined, undefined, operationState);
    const callbackOperations = new WeakMap<CombatOperationContext, CombatOperationExecutor>();
    const operationsFor = (callback?: CombatOperationContext): CombatOperationExecutor => {
      if (callback?.actionSourceId === undefined) return defaultOperations;
      let operations = callbackOperations.get(callback);
      if (operations === undefined) {
        operations = resolveOperations(
          buff,
          callback.actionSourceId,
          callback.skillCastInfo ?? null,
          operationState,
        );
        callbackOperations.set(callback, operations);
      }
      return operations;
    };
    // 回调更换操作来源，但仍使用同一个实例运行时，不能重置 once 和动作黑板作用域。
    runtime = new CombatActionSequenceRuntime(
      {
        execute: (step, callback) => operationsFor(callback).execute(step, callback),
        evaluate: (condition, callback) => operationsFor(callback).evaluate(condition, callback),
        prepare: (step, callback) => operationsFor(callback).prepare?.(step, callback),
        end: (step, callback) => operationsFor(callback).end?.(step, callback),
      },
      context,
      {},
      undefined,
      buff.definitionOwnerId,
      restoredHost?.scopes,
    );
    runtimes.set(buff, runtime);
    if (restoredHost !== undefined) return runtime;
    buff.runtimeState.actionHost = {
      operations: operationState,
      affixes: [],
      nextAffixId: 1,
      eventResponses: [],
      scopes: runtime.scopeState,
      targets: context.targetContext!.runtimeState,
      damageSnapshots: context.damageCalculationSnapshots!.runtimeState,
      enable: null,
      trigger: null,
      scheduled: null,
      skillSlotsReplaced: false,
    };
    return runtime;
  };
  const bindRestoredActions = (buff: CombatBuff<Key>): void => {
    const host = buff.runtimeState.actionHost;
    if (host === null) throw new Error(`buff '${definition.id}' has no saved action host`);
    const runtime = runtimeFor(buff, host);
    for (const affix of host.affixes) bindSkillAffixState(buff, affix, true);
    if (scheduledSequences.length !== 0 || skillSlotReplacements.length !== 0)
      buff.bindRestoredDuringEnableAction();
    else if (host.scheduled !== null)
      throw new Error(`buff '${definition.id}' saved an unexpected scheduled action`);
    if (host.trigger !== null) {
      if (sequences.trigger === undefined)
        throw new Error(`buff '${definition.id}' saved an unexpected trigger sequence`);
      triggerSequences.set(
        buff,
        runtime.createSequence(sequences.trigger, runtime.context, host.trigger),
      );
    } else if (sequences.trigger !== undefined && buff.isStarted) {
      throw new Error(`buff '${definition.id}' is missing its saved trigger sequence`);
    }
    if (host.enable !== null) {
      if (sequences.enable === undefined)
        throw new Error(`buff '${definition.id}' saved an unexpected enable sequence`);
      activeEnableSequences.set(
        buff,
        runtime.createSequence(sequences.enable, runtime.context, host.enable),
      );
    } else if (sequences.enable !== undefined && buff.isEnabled) {
      throw new Error(`buff '${definition.id}' is missing its saved enable sequence`);
    }
    if (buff.isEnabled) registerEventResponses(buff, host.eventResponses);
    else if (host.eventResponses.length !== 0)
      throw new Error(`buff '${definition.id}' has subscriptions while disabled`);
  };
  const bindRestoredRelations = (buff: CombatBuff<Key>): void => {
    const host = buff.runtimeState.actionHost;
    if (host === null) return;
    const bindings = affixBindings.get(buff);
    for (const affix of host.affixes) {
      const binding = bindings?.get(affix.instanceId);
      if (binding === undefined) {
        throw new Error(`SkillAffix '${affix.instanceId}' binding is missing`);
      }
      binding.bindObjectReferences();
    }
  };
  const execute = (sequence: ResolvedActionSequence | undefined, buff: CombatBuff<Key>): void => {
    if (sequence === undefined) return;
    runtimeFor(buff).createSequence(sequence).executeInstant({});
  };
  // 叠层者可能不是最初创建者；每次回调只替换本次执行环境，不修改 Buff 的归属和来源施法。
  const executeEnhance = (
    sequence: ResolvedActionSequence | undefined,
    buff: CombatBuff<Key>,
    sourceId: string,
  ): void => {
    if (sequence === undefined) return;
    runtimeFor(buff)
      .createSequence(sequence, {
        ...runtimeFor(buff).context,
        actionSourceId: sourceId,
      })
      .executeInstant({});
  };
  const startEnableSequence = (buff: CombatBuff<Key>): void => {
    if (sequences.enable === undefined) return;
    if (activeEnableSequences.has(buff)) {
      throw new Error(`buff '${definition.id}' enable sequence is already active`);
    }
    const sequence = runtimeFor(buff).createSequence(sequences.enable);
    activeEnableSequences.set(buff, sequence);
    buff.runtimeState.actionHost!.enable = sequence.runtimeState;
    try {
      sequence.tryExecute({});
    } catch (error) {
      sequence.end({});
      sequence.reset({});
      activeEnableSequences.delete(buff);
      buff.runtimeState.actionHost!.enable = null;
      throw error;
    }
  };
  const endEnableSequence = (buff: CombatBuff<Key>): void => {
    const sequence = activeEnableSequences.get(buff);
    if (sequence === undefined) return;
    sequence.end({});
    sequence.reset({});
    activeEnableSequences.delete(buff);
    buff.runtimeState.actionHost!.enable = null;
  };
  const disposeEventResponses = (buff: CombatBuff<Key>): void => {
    for (const registration of eventRegistrations.get(buff) ?? []) registration.dispose();
    eventRegistrations.delete(buff);
    const host = buff.runtimeState.actionHost;
    if (host !== null) host.eventResponses.length = 0;
  };
  const registerEventResponses = (
    buff: CombatBuff<Key>,
    restoredResponses?: readonly import('../state/instanceState').BuffEventResponseState[],
  ): void => {
    if (abilityEventResponses.length === 0) return;
    if (
      abilityEventResponses.some(response => response.event !== 'outputKnockDown') &&
      registerAbilityEventAction === undefined
    ) {
      throw new Error(`buff '${definition.id}' has ability event responses, but no event runtime`);
    }
    if (
      abilityEventResponses.some(response => response.event === 'outputKnockDown') &&
      registerSemanticEventAction === undefined
    ) {
      throw new Error(`buff '${definition.id}' has semantic event responses, but no event runtime`);
    }
    if (eventRegistrations.has(buff)) {
      throw new Error(`buff '${definition.id}' ability event responses are already active`);
    }
    const registrations: BuffAbilityEventRegistration[] = [];
    const responseStates: import('../state/instanceState').BuffEventResponseState[] = [];
    try {
      // Each native SequenceAction owns its registration; equal priority does not merge programs.
      for (const [index, response] of abilityEventResponses.entries()) {
        const restored = restoredResponses?.[index];
        if (restoredResponses !== undefined && restored === undefined) {
          throw new Error(`buff '${definition.id}' saved event responses do not match its program`);
        }
        const runtime = runtimeFor(buff);
        const context = {
          ...runtime.context,
          actionOwnerId: buff.owner.ownerId,
          actionSourceId: buff.sourceId,
        };
        const sequence = runtime.createSequence(response.sequence, context, restored?.sequence);
        if (restored === undefined) sequence.reset({});
        let registration: BuffAbilityEventRegistration;
        if (response.event === 'outputKnockDown') {
          registration = registerSemanticEventAction!(
            response.event,
            response.priority,
            (event, actionContext) => {
              if (buff.isFinished) return;
              withCombatEventResponseContext(context, { event, actionContext }, () =>
                sequence.executeInstant({}),
              );
            },
            restored?.subscriptions,
          );
        } else {
          registration = registerAbilityEventAction!(
            response.event,
            response.priority,
            (published, actionContext) => {
              // SequenceAction.isValid delegates to Buff.isActionValid (!isFinished).
              if (buff.isFinished) return;
              withAbilityEventResponseContext(context, published, actionContext, () =>
                sequence.executeInstant({}),
              );
            },
            restored?.subscriptions,
          );
        }
        registrations.push(registration);
        responseStates.push({
          sequence: sequence.runtimeState,
          subscriptions: [...(registration.subscriptions ?? [])],
        });
      }
    } catch (error) {
      for (const registration of registrations) registration.dispose();
      throw error;
    }
    if (
      restoredResponses !== undefined &&
      restoredResponses.length !== abilityEventResponses.length
    ) {
      for (const registration of registrations) registration.dispose();
      throw new Error(`buff '${definition.id}' saved event response count does not match`);
    }
    eventRegistrations.set(buff, registrations);
    const savedResponses = buff.runtimeState.actionHost!.eventResponses;
    savedResponses.splice(0, savedResponses.length, ...responseStates);
  };
  const actions: BuffLifecycleActions<Key> = {
    ...(scheduledSequences.length === 0 && skillSlotReplacements.length === 0
      ? {}
      : {
          duringEnable: new CompositeBuffDuringEnableAction([
            ...(scheduledSequences.length === 0
              ? []
              : [new BuffScheduledSequenceAction(scheduledSequences, runtimeFor)]),
            ...(skillSlotReplacements.length === 0
              ? []
              : [
                  new BuffSkillSlotReplacementAction(
                    skillSlotReplacements,
                    resolveOperations,
                    buff => void runtimeFor(buff),
                  ),
                ]),
          ]),
        }),
    ...(sequences.start === undefined && sequences.trigger === undefined
      ? {}
      : {
          start: buff => {
            if (sequences.trigger !== undefined) {
              const sequence = runtimeFor(buff).createSequence(sequences.trigger);
              sequence.reset({});
              triggerSequences.set(buff, sequence);
              buff.runtimeState.actionHost!.trigger = sequence.runtimeState;
            }
            execute(sequences.start, buff);
          },
        }),
    ...(sequences.enable === undefined && abilityEventResponses.length === 0
      ? {}
      : {
          enable: buff => {
            startEnableSequence(buff);
            try {
              registerEventResponses(buff);
            } catch (error) {
              endEnableSequence(buff);
              throw error;
            }
          },
        }),
    ...(sequences.enable === undefined &&
    sequences.disable === undefined &&
    abilityEventResponses.length === 0
      ? {}
      : {
          disable: buff => {
            disposeEventResponses(buff);
            endEnableSequence(buff);
            execute(sequences.disable, buff);
          },
        }),
    ...(sequences.beforeEnhance === undefined
      ? {}
      : {
          beforeEnhance: (buff, sourceId) =>
            executeEnhance(sequences.beforeEnhance, buff, sourceId),
        }),
    ...(sequences.enhanceChanged === undefined
      ? {}
      : {
          enhanceChanged: (buff, sourceId) =>
            executeEnhance(sequences.enhanceChanged, buff, sourceId),
        }),
    ...(sequences.afterEnhance === undefined
      ? {}
      : {
          afterEnhance: (buff, sourceId) => executeEnhance(sequences.afterEnhance, buff, sourceId),
        }),
    ...(sequences.trigger === undefined
      ? {}
      : {
          trigger: buff => {
            const sequence = triggerSequences.get(buff);
            if (sequence === undefined)
              throw new Error(`buff '${definition.id}' trigger sequence was not prepared`);
            sequence.executeInstant({});
          },
        }),
    ...(igniteEventResponses.length === 0
      ? {}
      : {
          ignite: (buff, igniteType, sourceId, skillCastInfo) => {
            const responses = igniteEventResponses.filter(
              response => response.igniteType === igniteType,
            );
            if (responses.length === 0) return false;
            const runtime = runtimeFor(buff);
            let finishAfterIgnited = false;
            for (const response of responses) {
              if (buff.isFinished) break;
              runtime
                .createSequence(response.sequence, {
                  ...runtime.context,
                  // OnIgnite 保留 Buff 来源，只把点燃者作为输入目标。
                  actionSourceId: buff.sourceId,
                  ...(skillCastInfo === undefined ? {} : { skillCastInfo }),
                  actionInputTarget: runtimeTargetFromEntityId(sourceId),
                })
                .executeInstant({});
              finishAfterIgnited ||= response.finishAfterIgnited;
            }
            // 原生 OnIgnite 遍历映射后统一 ConsumeBuff；普通动作提前结束不会补造消费。
            if (finishAfterIgnited)
              buff.owner.finishInstance(buff, 'ignite', sourceId, skillCastInfo ?? null);
            return true;
          },
        }),
    ...(sequences.start === undefined &&
    sequences.enable === undefined &&
    sequences.finish === undefined &&
    abilityEventResponses.length === 0
      ? {}
      : {
          finish: buff => {
            execute(sequences.finish, buff);
            endEnableSequence(buff);
            disposeEventResponses(buff);
          },
          release: buff => {
            endEnableSequence(buff);
            disposeEventResponses(buff);
          },
        }),
  };
  if (
    damageModifierConditionPrograms.length !== 0 &&
    damageModifierConditionPrograms.length !== (definition.damageModifiers?.length ?? 0)
  ) {
    throw new Error(`buff '${definition.id}' damage modifier condition programs are misaligned`);
  }
  const damageModifiers = definition.damageModifiers?.map((modifier, index) => {
    const program = damageModifierConditionPrograms[index];
    if (program === undefined) return modifier;
    if (modifier.condition !== undefined) {
      throw new Error(`buff '${definition.id}' damage modifier cannot mix condition forms`);
    }
    return {
      ...modifier,
      createConditionProgram: (buff: CombatBuff<Key>) =>
        createDamageModifierConditionProgram(program, runtimeFor(buff), {
          getBuffAffixSkillCastId: () => buff.affixSkillCastId,
        }),
    };
  });
  return {
    ...definition,
    ...(damageModifiers === undefined ? {} : { damageModifiers }),
    actions,
    bindRestoredActions,
    bindRestoredRelations,
  };
}
