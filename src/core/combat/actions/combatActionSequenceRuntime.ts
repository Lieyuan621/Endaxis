import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type { CompiledCondition } from '../../compiler/compiledGraphData';
import { conditionInputExpression } from '../../compiler/compiledGraphData';
import type { RuntimeTargetGroup, RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { runtimeTargetFromEntityId } from '../../game-data/logicalAbilityEntity';
import { resolveDirectActionTargets } from '../abilities/targetContextOperationExecutor';
import type {
  ActionBuffReferencesState,
  ActionRegistrationState,
  ActionSequenceState,
  ActionStepData,
  GraphLeafStepData,
  OperationStepData,
} from '../state/actionState';
import { createActionSequenceHostState } from '../state/actionState';
import type { ProjectileCallbackState } from '../state/instanceState';
import { COMBAT_FRAMES_PER_SECOND } from '../time/combatClock';
import type { ExecutionTracePhase } from './actionExecutionTrace';
import { CombatActionEventListener } from './combatActionEventListener';

/**
 * 把编译后的同步动作序列绑定到操作执行器和动作黑板。
 * 技能、Buff 等状态所有者应各自持有实例，避免共享 once 作用域或运行时黑板。
 */
import type {
  CompiledTimelineAction,
  ResolvedActionSequence,
  ResolvedCombatOperationStep,
  ResolvedCombatStep,
} from '../../compiler/combatProgram';
import { isCombatOperationStep } from '../../compiler/combatProgram';
import type {
  CompiledActionGraph,
  CompiledGraphOperation,
} from '../../compiler/compileActionGraph';
import type { AbilityEntityTargetRef } from '../../game-data/logicalAbilityEntity';
import { ProjectileCallbackRuntime } from '../abilities/projectileCallbackRuntime';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { DamageCalculationSnapshots } from '../damage/damageCalculationSnapshots';
import type { CombatSemanticEventRuntime } from '../events/combatSemanticEventRuntime';
import { operationProducer } from '../receipt/combatObjectIdentity';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { ActionGraphExecutionState, TimelineRuntimeState } from '../state/actionState';
import {
  bindTimelineProgram,
  type TimelineActionLifecycleSink,
  type TimelineActionProcessor,
} from '../timeline/timelineActionProcessor';
import { ActionBlackboard, resolveActionValueOperand } from './actionBlackboard';
import type { CombatActionExecution } from './actionGraphExecution';
import { ActionGraphExecution, type ActionGraphExecutionHost } from './actionGraphExecution';
import { CombatStep } from './combatStep';

/** 步骤自身没有可变数据；它调用的操作执行器仍须由所属宿主恢复。 */
abstract class StatelessCombatStep extends CombatStep {
  override get executionData(): OperationStepData {
    return { kind: 'stateless' as const };
  }
  override bindExecutionData(data: ActionStepData | null): void {
    if (data?.kind !== 'stateless') throw new Error('expected stateless step data');
  }
}

export interface CombatActionSequenceRuntimeHooks {
  readonly stepReached?: (step: ResolvedCombatStep) => void;
  readonly conditionEvaluated?: (condition: CompiledCondition, passed: boolean) => void;
}

class OperationStep extends StatelessCombatStep {
  #registrationState: ActionRegistrationState | null = null;
  #buffReferencesState: ActionBuffReferencesState | null = null;

  constructor(
    readonly step: ResolvedCombatOperationStep,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
    if (
      step.kind === 'changePlayerActionMode' ||
      step.kind === 'overrideBasicAttackMapping' ||
      step.kind === 'overrideMultiDashLimit' ||
      step.kind === 'skillAffix' ||
      (step.kind === 'changeSkillSlot' && step.parameters.lifetime !== undefined)
    )
      this.#registrationState = { registrationIds: [] };
    if (step.kind === 'applyBuff' && step.parameters.finishByAction === true)
      this.#buffReferencesState = { active: false, references: [] };
    if (step.kind === 'inheritBuffById')
      this.#buffReferencesState = { active: false, references: [] };
    if (step.kind === 'holdBuffsById')
      this.#buffReferencesState = { active: false, references: [] };
  }

  override get executionData(): OperationStepData {
    if (this.#registrationState !== null) {
      return {
        kind: this.#registrationKind(),
        activation: this.#registrationState,
      };
    }
    if (this.#buffReferencesState !== null) {
      return {
        kind: this.#buffReferencesKind(),
        buffs: this.#buffReferencesState,
      };
    }
    return super.executionData;
  }

  override bindExecutionData(data: ActionStepData | null): void {
    if (this.step.kind === 'dealDamage' && this.step.parameters.takeAttackSnapshot === true) {
      const snapshots = this.operationContext.damageCalculationSnapshots;
      if (snapshots === undefined) {
        throw new Error('restored attack snapshot requires a stateful action host');
      }
      snapshots.bindProgramStep(this.step);
    }
    if (this.#registrationState !== null) {
      const expected = this.#registrationKind();
      if (data?.kind !== expected) throw new Error('expected matching action registration data');
      this.#registrationState = data.activation;
      return;
    }
    if (this.#buffReferencesState !== null) {
      const expected = this.#buffReferencesKind();
      if (data?.kind !== expected) throw new Error('expected matching action Buff data');
      this.#buffReferencesState = data.buffs;
      return;
    }
    super.bindExecutionData(data);
  }

  #withState<T>(operation: () => T): T {
    if (this.#registrationState === null && this.#buffReferencesState === null) return operation();
    const context = this.operationContext;
    const previous = context.actionRegistrationState;
    const previousBuffs = context.actionBuffReferencesState;
    if (this.#registrationState !== null) context.actionRegistrationState = this.#registrationState;
    if (this.#buffReferencesState !== null)
      context.actionBuffReferencesState = this.#buffReferencesState;
    try {
      return operation();
    } finally {
      if (previous === undefined) delete context.actionRegistrationState;
      else context.actionRegistrationState = previous;
      if (previousBuffs === undefined) delete context.actionBuffReferencesState;
      else context.actionBuffReferencesState = previousBuffs;
    }
  }

  #registrationKind():
    | 'playerActionMode'
    | 'basicAttackMapping'
    | 'multiDashLimit'
    | 'skillSlotReplacement'
    | 'skillAffix' {
    switch (this.step.kind) {
      case 'changePlayerActionMode':
        return 'playerActionMode';
      case 'overrideBasicAttackMapping':
        return 'basicAttackMapping';
      case 'overrideMultiDashLimit':
        return 'multiDashLimit';
      case 'changeSkillSlot':
        return 'skillSlotReplacement';
      case 'skillAffix':
        return 'skillAffix';
      default:
        throw new Error('operation does not own a registration');
    }
  }

  #buffReferencesKind(): 'actionDurationBuffs' | 'inheritedBuff' | 'buffHold' {
    if (this.step.kind === 'inheritBuffById') return 'inheritedBuff';
    if (this.step.kind === 'holdBuffsById') return 'buffHold';
    return 'actionDurationBuffs';
  }

  execute(): void {
    this.tryExecute();
  }

  override tryExecute(): boolean {
    this.runtime.hooks.stepReached?.(this.step);
    return this.#withState(() => this.runtime.operations.execute(this.step, this.operationContext));
  }

  override end(): void {
    this.#withState(() => this.runtime.operations.end?.(this.step, this.operationContext));
  }

  override reset(): void {
    this.#withState(() => this.runtime.operations.prepare?.(this.step, this.operationContext));
  }
}

class ProjectileLaunchStep extends StatelessCombatStep {
  constructor(
    readonly step: ResolvedCombatStepForKind<'launchProjectile'>,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
  }

  execute(): void {
    this.tryExecute();
  }

  override tryExecute(): boolean {
    const parent = this.operationContext;
    const launch = parent.launchProjectile;
    if (launch === undefined) throw new Error('projectile launch requires a runtime');
    const targets = this.step.parameters.targets;
    const emitters = this.step.parameters.emitters;
    if ((targets || emitters) && !parent.targetContext)
      throw new Error('projectile launch requires a target context');
    // 原生先固定两组查询；同步 launch 回调修改 Context 不改变本次遍历。
    const selected = targets
      ? parent.targetContext!.get(targets.contextKey).map(target => ({ ...target }))
      : undefined;
    const emitterCount = emitters ? parent.targetContext!.get(emitters.contextKey).length : 1;
    const filter = this.step.parameters.onlyHitTargets;
    if (filter && !this.runtime.operations.queryTargets)
      throw new Error('projectile hit filter requires a target query');
    const onlyHitTargets = filter
      ? this.runtime.operations.queryTargets!(filter, parent).map(target => ({ ...target }))
      : undefined;
    for (let emitterIndex = 0; emitterIndex < emitterCount; emitterIndex++) {
      // _Launch 每个发射点准备一次黑板；同一点的每枚投射物持有独立副本。
      const prepared = parent.blackboard.createLocalScope(
        {},
        this.step.parameters.inheritActionBlackboard,
        this.step.parameters.entityInitialValues ?? {},
        this.step.parameters.entityAssignments,
      );
      if (selected) {
        for (const target of selected)
          this.launchSingle(
            { ...parent, currentTarget: target, actionInputTarget: target },
            prepared.forkEntityScope(),
            onlyHitTargets,
          );
      } else {
        this.launchSingle(parent, prepared.forkEntityScope(), onlyHitTargets);
      }
    }
    return true;
  }

  private launchSingle(
    parent: CombatOperationContext,
    blackboard: ActionBlackboard,
    onlyHitTargets?: readonly RuntimeTargetRef[],
  ): void {
    const launch = parent.launchProjectile!;
    const sourceId =
      this.step.parameters.source === 'actionOwner'
        ? (parent.actionOwnerId ?? parent.buffOwnerId ?? this.runtime.ownerOperatorId)
        : (parent.actionSourceId ?? parent.buffSourceId ?? this.runtime.ownerOperatorId);
    let entity: AbilityEntityTargetRef | undefined;
    const callbacks = this.step.callbacks.map(({ event, skill }) => {
      const createHost = parent.createCallbackSkillHost;
      const definitionOperatorId = this.runtime.ownerOperatorId;
      if (createHost === undefined || definitionOperatorId === undefined)
        throw new Error('projectile callback requires a skill host and definition operator');
      const context: CombatOperationContext = {
        blackboard: blackboard.detachedSnapshot(),
        damageCalculationSnapshots: new DamageCalculationSnapshots(),
        targetContext: new RuntimeTargetContext(),
        skillCastInfo:
          parent.skillCastInfo === undefined
            ? undefined
            : Object.freeze({ ...parent.skillCastInfo }),
        launchProjectile: launch,
        createCallbackSkillHost: createHost,
      };
      const state: ProjectileCallbackState = {
        event,
        programId: null,
        definitionOperatorId,
        skillId: skill.skillId,
        blackboard: context.blackboard.runtimeState,
        skillCastInfo: context.skillCastInfo ?? null,
        host: null,
        ...(event === 'hit' && this.step.parameters.hit?.hitTagFilter !== undefined
          ? { hitTagFilter: this.step.parameters.hit.hitTagFilter }
          : {}),
      };
      return {
        program: skill,
        runtime: new ProjectileCallbackRuntime(
          state,
          () => {
            if (entity === undefined) throw new Error('projectile callback started before launch');
            return createHost(
              skill,
              {
                ...context,
                actionInputTarget: state.inputTarget,
                actionOwnerId: `ability-entity:${entity.instanceId}`,
                actionSourceId: sourceId,
                actionOwnerAbilityEntity: entity,
              },
              this.runtime.operations,
            );
          },
          () =>
            state.hitTagFilter === undefined ||
            this.runtime.operations.evaluate(
              { kind: 'entityTagMatch', target: 'enemy', ...state.hitTagFilter },
              context,
            ),
        ),
      };
    });
    entity = launch({
      entityBlackboard: blackboard.runtimeState.entity!,
      onlyHitTargets,
      syncTimeScale: this.step.parameters.syncTimeScale,
      finish: this.step.parameters.finish,
      recycleDelaySeconds: this.step.parameters.recycleDelaySeconds ?? 0,
      callbacks,
      skillCastInfo: parent.skillCastInfo,
      sourceId,
      producedBy: operationProducer(parent),
      hit: this.step.parameters.hit,
      hitTarget:
        this.step.parameters.hit?.target === 'currentTarget' ? parent.currentTarget : undefined,
    }).target;
    // 原生在发射初始化末尾施放，目标为投射物自身。必须等 launch 返回后再执行：
    // 此时实例、来源、回收绑定均已就绪；恢复切面不会重新执行发射动作。
    for (const callback of callbacks)
      if (callback.runtime.runtimeState.event === 'launch') callback.runtime.start(entity);
  }
}

class SkillOperableBoundaryStep extends StatelessCombatStep {
  constructor(
    readonly step: ResolvedCombatStepForKind<'reachSkillOperableBoundary'>,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
  }

  execute(): void {
    this.runtime.hooks.stepReached?.(this.step);
    this.operationContext.reachSkillOperableBoundary?.(this.step.parameters.skillIds);
  }
}

class MarkCurrentSkillInputStep extends StatelessCombatStep {
  constructor(
    readonly step: ResolvedCombatStepForKind<
      'markCurrentSkillCanDash' | 'markCurrentSkillCanInterrupt'
    >,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
  }

  execute(): void {
    this.runtime.hooks.stepReached?.(this.step);
    const mark = this.operationContext[this.step.kind];
    if (mark === undefined) throw new Error(`${this.step.kind} requires a skill host`);
    mark();
  }
}

export class CombatActionSequenceRuntime {
  readonly #sequenceHostState: ReturnType<typeof createActionSequenceHostState>;

  /** 宿主下动作共用的黑板作用域。 */
  get sequenceHostState(): ReturnType<typeof createActionSequenceHostState> {
    return this.#sequenceHostState;
  }
  // 相同子技能 ID/静态路径在不同投射物中不能复用同一块 direct/entity 板。

  constructor(
    readonly operations: CombatOperationExecutor,
    readonly context: CombatOperationContext,
    readonly hooks: CombatActionSequenceRuntimeHooks = {},
    readonly semanticEvents?: CombatSemanticEventRuntime,
    readonly ownerOperatorId?: string,
    sequenceHostState = createActionSequenceHostState(),
  ) {
    this.#sequenceHostState = sequenceHostState;
  }

  /** 图入口直接绑定现有操作执行器；不经过序列树或展开器。 */
  createGraphSequence(
    program: CompiledActionGraph,
    entry: string | null,
    invocation: string,
    operationContext: CombatOperationContext = this.context,
    state?: ActionGraphExecutionState,
  ): ActionGraphExecution {
    return new ActionGraphExecution(
      program,
      entry,
      invocation,
      this.#graphHost(operationContext),
      state,
    );
  }

  #graphHost(operationContext: CombatOperationContext): ActionGraphExecutionHost {
    const trace = this.operations.executionTrace;
    return {
      frame: this.operations.frame,
      get inputTarget() {
        return operationContext.actionInputTarget;
      },
      selectTargets: (selection, input) => {
        if (selection.kind === 'context')
          return operationContext.targetContext?.getOptional(selection.key) ?? [];
        if (selection.kind === 'inputTarget') return input === null ? [] : [input];
        if (selection.kind !== 'owner' && selection.kind !== 'source') {
          if (!this.operations.queryTargets) throw new Error('channeling requires a target query');
          return this.operations.queryTargets(selection, operationContext);
        }
        const id =
          selection.kind === 'owner'
            ? operationContext.actionOwnerId
            : operationContext.actionSourceId;
        return id === undefined ? [] : [runtimeTargetFromEntityId(id)];
      },
      executionPolicy: this.#sequenceHostState.executionPolicy,
      requestTimelineJump: operationContext.requestTimelineJump,
      ...(trace === undefined
        ? {}
        : {
            trace: <T>(
              program: CompiledActionGraph,
              nodeId: string,
              invocation: string,
              phase: ExecutionTracePhase,
              execute: () => T,
            ) =>
              trace.recorder.run(
                operationContext,
                trace.frame(),
                program,
                nodeId,
                invocation,
                phase,
                trace.receiptCount,
                execute,
                this,
              ),
          }),
      listener: (responses, state, create) =>
        new CombatActionEventListener(
          responses,
          state,
          this.operations,
          operationContext,
          this.semanticEvents,
          operationContext.actionOwnerId ?? this.ownerOperatorId,
          (reference, context, index, saved) =>
            create(reference, index, this.#graphHost(context), saved),
        ),
      observeOwnerTags: changed => {
        if (!this.operations.ownerTagQuery) throw new Error('owner tag query is not configured');
        return this.operations.ownerTagQuery(operationContext).observe(changed);
      },
      ownerTagsMatch: parameters => {
        if (!this.operations.ownerTagQuery) throw new Error('owner tag query is not configured');
        return this.operations.ownerTagQuery(operationContext).matches(parameters);
      },
      withTarget: (target, asInput) =>
        this.#graphHost({
          ...operationContext,
          currentTarget: target,
          ...(asInput ? { actionInputTarget: target } : {}),
        }),
      withSavedInput: target =>
        this.#graphHost({
          ...operationContext,
          actionInputTarget: target ?? undefined,
          currentTarget: target ?? undefined,
          event: undefined,
          eventSkillCastInfo: undefined,
        }),
      comboQte: {
        register: (early, active) => {
          const windows = this.operations.comboWindows;
          const owner = operationContext.actionSourceId ?? this.ownerOperatorId;
          if (!windows || owner === undefined)
            throw new Error('QTE requires a character source and combo runtime');
          return windows.registerRingQte(
            owner,
            Math.fround(early) * COMBAT_FRAMES_PER_SECOND,
            Math.fround(active) * COMBAT_FRAMES_PER_SECOND,
          );
        },
        bind: (registration, triggered) => {
          if (!this.operations.comboWindows) throw new Error('QTE runtime is not configured');
          this.operations.comboWindows.bindRingQte(registration, triggered);
        },
        end: registration => this.operations.comboWindows?.unregisterRingQte(registration),
      },
      aura: parameters => {
        const operations = this.operations.aura;
        if (!operations) throw new Error('Aura Buff operations are not configured');
        return {
          targets: () => operations.targets(parameters, operationContext),
          apply: target => operations.apply(parameters, target, operationContext),
          finish: references => operations.finish(references),
        };
      },
      targets: parameters => this.resolveLoopTargets(parameters, operationContext),
      bindOperation: action => this.#createLeafStep(action, operationContext),
      canExecute: () => operationContext.canExecuteAction?.() !== false,
      ...(trace === undefined
        ? {}
        : {
            observeCondition: (input: CompiledCondition, passed: boolean) =>
              trace.recorder.observe('condition', conditionInputExpression(input), passed),
          }),
      evaluate: input => {
        const condition = conditionInputExpression(input);
        const passed = this.operations.evaluate(condition, operationContext);
        this.hooks.conditionEvaluated?.(condition, passed);
        return passed;
      },
      value: operand => {
        const value = resolveActionValueOperand(operand, operationContext.blackboard);
        trace?.recorder.observe('value', operand, value);
        return value;
      },
    };
  }

  createSequence(
    sequence: ResolvedActionSequence,
    operationContext: CombatOperationContext = this.context,
    state?: ActionSequenceState,
  ): CombatActionExecution {
    const invocation =
      state?.invocation ?? `call:${this.#sequenceHostState.nextGraphInvocationId++}`;
    return new ActionGraphExecution(
      sequence.graph,
      sequence.entry,
      invocation,
      this.#graphHost(operationContext),
      state,
      sequence.callSite,
    );
  }

  resolveLoopTargets(
    parameters: ResolvedCombatStepForKind<'forEachContextTarget'>['parameters'],
    context: CombatOperationContext,
  ): RuntimeTargetGroup {
    const direct = resolveDirectActionTargets(parameters.targets, context, this.ownerOperatorId);
    if (direct !== undefined) return direct;
    if (!this.operations.queryTargets) throw new Error('forEach requires a target query');
    return this.operations.queryTargets(parameters.targets, context);
  }

  /** Independent interval state, but one host context/blackboard across all intervals. */
  createTimeline(
    actions: readonly CompiledTimelineAction[],
    lifecycle: TimelineActionLifecycleSink = {},
    state?: TimelineRuntimeState,
  ): TimelineActionProcessor {
    return bindTimelineProgram(
      actions,
      (sequence, _index, saved) => this.createSequence(sequence, this.context, saved),
      lifecycle,
      state,
    );
  }

  #createLeafStep(
    step: CompiledGraphOperation,
    operationContext: CombatOperationContext,
  ): CombatStep & { readonly executionData: GraphLeafStepData } {
    if (isCombatOperationStep(step)) return new OperationStep(step, this, operationContext);
    if (step.kind === 'launchProjectile')
      return new ProjectileLaunchStep(step, this, operationContext);
    if (step.kind === 'reachSkillOperableBoundary') {
      return new SkillOperableBoundaryStep(step, this, operationContext);
    }
    if (step.kind === 'markCurrentSkillCanDash' || step.kind === 'markCurrentSkillCanInterrupt') {
      return new MarkCurrentSkillInputStep(step, this, operationContext);
    }

    const unhandled: never = step;
    throw new Error(`unhandled leaf step: ${JSON.stringify(unhandled)}`);
  }
}
