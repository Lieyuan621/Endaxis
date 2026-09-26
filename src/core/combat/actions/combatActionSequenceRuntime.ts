import { CombatActionEventListener } from './combatActionEventListener';
import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type {
  ActionSequenceState,
  ActionStepData,
  OperationStepData,
  GraphLeafStepData,
} from '../state/actionState';
import { createActionScopeState, createTimelineJumpState } from '../state/actionState';
import { type ActionBlackboardState } from '../state/foundationState';

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
import type { AbilityEntityTargetRef } from '../../game-data/logicalAbilityEntity';
import { ProjectileCallbackRuntime } from '../abilities/projectileCallbackRuntime';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { DamageCalculationSnapshots } from '../damage/damageCalculationSnapshots';
import type { CombatSemanticEventRuntime } from '../events/combatSemanticEventRuntime';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import { operationProducer } from '../receipt/combatObjectIdentity';
import { type TimelineRuntimeState } from '../state/actionState';
import {
  type TimelineActionProcessor,
  bindTimelineProgram,
  type TimelineActionLifecycleSink,
} from '../timeline/timelineActionProcessor';
import { ActionBlackboard, resolveActionValueOperand } from './actionBlackboard';
import type { CombatActionExecution } from './actionGraphExecution';
import { ActionGraphExecution, type ActionGraphExecutionHost } from './actionGraphExecution';
import type {
  CompiledActionGraph,
  CompiledGraphOperation,
} from '../../compiler/compileActionGraph';
import type { ActionGraphExecutionState } from '../state/actionState';
import { CombatStep } from './combatStep';
import {
  executeActionOnce,
  executeTimelineJump,
  getActionScopeBlackboard,
  resetActionScopes,
  resetTimelineJump,
  tickTimelineJump,
  type TimelineJumpExecutionHost,
} from './sequenceControl';

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
  readonly conditionEvaluated?: (
    condition: ResolvedCombatStepForKind<'conditional'>['parameters']['condition'],
    passed: boolean,
  ) => void;
}

class OperationStep extends StatelessCombatStep {
  #registrationState: import('../state/actionState').ActionRegistrationState | null = null;
  #buffReferencesState: import('../state/actionState').ActionBuffReferencesState | null = null;

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
      this.#registrationState = { registrationId: null };
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
        blackboard: parent.blackboard.detachedSnapshot(),
        damageCalculationSnapshots: new DamageCalculationSnapshots(),
        targetContext: new RuntimeTargetContext(),
        skillCastInfo:
          parent.skillCastInfo === undefined
            ? undefined
            : Object.freeze({ ...parent.skillCastInfo }),
        launchProjectile: launch,
        createCallbackSkillHost: createHost,
      };
      const state: import('../state/instanceState').ProjectileCallbackState = {
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
    return true;
  }
}

/** 原生 Switch 的持久分支实例；选择、生命周期和浮点匹配不能复用普通 conditional。 */
class TimelineJumpStep extends CombatStep {
  #state = createTimelineJumpState();
  override bindExecutionData(data: ActionStepData | null): void {
    if (data?.kind !== 'jump') throw new Error('expected timeline jump data');
    this.#state = data.jump;
  }
  override get executionData() {
    return { kind: 'jump' as const, jump: this.#state };
  }

  constructor(
    readonly step: ResolvedCombatStepForKind<'jumpTimeline'>,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
  }

  execute(): void {
    this.runtime.hooks.stepReached?.(this.step);
    executeTimelineJump(this.#state, this.#host());
  }

  override tick(): void {
    tickTimelineJump(this.#state, this.#host());
  }

  override reset(): void {
    resetTimelineJump(this.#state);
  }

  #host(): TimelineJumpExecutionHost {
    return {
      evaluate: () => {
        const condition = this.step.parameters.condition;
        if (condition === undefined) return true;
        const passed = this.runtime.operations.evaluate(condition, this.operationContext);
        this.runtime.hooks.conditionEvaluated?.(condition, passed);
        return passed;
      },
      resolveRequest: () => {
        const request = this.operationContext.requestTimelineJump;
        if (request === undefined) throw new Error('jumpTimeline requires a timeline host');
        return () => request(this.step.parameters.destinationFrame);
      },
    };
  }
}

class TimelineFinishStep extends StatelessCombatStep {
  constructor(
    readonly step: ResolvedCombatStepForKind<'finishTimeline'>,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
  }

  execute(): void {
    this.runtime.hooks.stepReached?.(this.step);
    const request = this.operationContext.requestTimelineFinish;
    if (request === undefined) throw new Error('finishTimeline requires a timeline host');
    request();
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
  readonly #scopeState: ReturnType<typeof createActionScopeState>;

  /** 宿主下所有动作共用的 once 标记和黑板作用域。 */
  get scopeState(): ReturnType<typeof createActionScopeState> {
    return this.#scopeState;
  }
  // 相同子技能 ID/静态路径在不同投射物中不能复用同一块 direct/entity 板。
  #blackboardBindings = new WeakMap<ActionBlackboardState, ActionBlackboard>();

  constructor(
    readonly operations: CombatOperationExecutor,
    readonly context: CombatOperationContext,
    readonly hooks: CombatActionSequenceRuntimeHooks = {},
    readonly semanticEvents?: CombatSemanticEventRuntime,
    readonly ownerOperatorId?: string,
    scopeState = createActionScopeState(),
  ) {
    this.#scopeState = scopeState;
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
    return {
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
      withTarget: target => this.#graphHost({ ...operationContext, currentTarget: target }),
      targets: parameters => this.resolveLoopTargets(parameters, operationContext),
      bindOperation: action => this.#createLeafStep(action, operationContext),
      canExecute: () => operationContext.canExecuteAction?.() !== false,
      evaluate: condition => {
        const passed = this.operations.evaluate(condition, operationContext);
        this.hooks.conditionEvaluated?.(condition, passed);
        return passed;
      },
      value: operand => resolveActionValueOperand(operand, operationContext.blackboard),
      once: (key, execute) => executeActionOnce(this.#scopeState, key, execute),
      scope: (parameters, saved) => {
        const blackboard =
          saved === undefined
            ? this.getActionBlackboardScope({ parameters }, operationContext.blackboard)
            : ActionBlackboard.bindRuntimeState(saved);
        return {
          blackboard: blackboard.runtimeState,
          host: this.#graphHost({ ...operationContext, blackboard }),
        };
      },
    };
  }

  createSequence(
    sequence: ResolvedActionSequence,
    operationContext: CombatOperationContext = this.context,
    state?: ActionSequenceState,
  ): CombatActionExecution {
    const invocation = state?.invocation ?? `call:${this.#scopeState.nextGraphInvocationId++}`;
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
  ): import('../../game-data/logicalAbilityEntity').RuntimeTargetGroup {
    if (parameters.target === 'enemy') return [{ kind: 'enemy' }];
    if (parameters.target === 'caster') {
      if (this.ownerOperatorId === undefined)
        throw new Error('caster forEach target requires an owner operator');
      return [{ kind: 'operator', operatorId: this.ownerOperatorId }];
    }
    if (!context.targetContext)
      throw new Error('forEachContextTarget requires a combat target context');
    return context.targetContext.get(parameters.contextKey!);
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
    if (step.kind === 'jumpTimeline') {
      return new TimelineJumpStep(step, this, operationContext);
    }
    if (step.kind === 'finishTimeline') {
      return new TimelineFinishStep(step, this, operationContext);
    }
    if (step.kind === 'reachSkillOperableBoundary') {
      return new SkillOperableBoundaryStep(step, this, operationContext);
    }
    if (step.kind === 'markCurrentSkillCanDash' || step.kind === 'markCurrentSkillCanInterrupt') {
      return new MarkCurrentSkillInputStep(step, this, operationContext);
    }

    const unhandled: never = step;
    throw new Error(`unhandled leaf step: ${JSON.stringify(unhandled)}`);
  }

  reset(): void {
    resetActionScopes(this.#scopeState);
    this.#blackboardBindings = new WeakMap();
  }

  getActionBlackboardScope(
    step: Pick<ResolvedCombatStepForKind<'withActionBlackboardScope'>, 'parameters'>,
    parent: ActionBlackboard,
  ): ActionBlackboard {
    this.#blackboardBindings.set(parent.runtimeState, parent);
    const state = getActionScopeBlackboard(
      this.#scopeState,
      parent.runtimeState,
      step.parameters,
      () => {
        const created = parent.createLocalScope(
          step.parameters.initialValues,
          step.parameters.inheritParent,
          step.parameters.entityInitialValues,
          step.parameters.entityAssignments,
        );
        this.#blackboardBindings.set(created.runtimeState, created);
        return created.runtimeState;
      },
    );
    let binding = this.#blackboardBindings.get(state);
    if (binding === undefined) {
      binding = ActionBlackboard.bindRuntimeState(state);
      this.#blackboardBindings.set(state, binding);
    }
    return binding;
  }
}
