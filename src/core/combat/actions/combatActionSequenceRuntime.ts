import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type {
  ActionSequenceState,
  ActionStepData,
  CombatEventListenerState,
} from '../state/actionState';
import {
  createActionScopeState,
  createBranchActionState,
  createRepeatedActionState,
  createTargetLoopState,
  createTimelineJumpState,
  type ActionBlackboardScopeState,
} from '../state/actionState';
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
import type { AbilityEventRegistration } from '../events/abilityEventDispatcher';
import { withCombatEventResponseContext } from '../events/abilityEventResponseContext';
import type {
  CombatEventHandlerRegistration,
  CombatSemanticEventContext,
  CombatSemanticEventRuntime,
} from '../events/combatSemanticEventRuntime';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import { operationProducer } from '../receipt/combatObjectIdentity';
import { type TimelineRuntimeState } from '../state/actionState';
import { compileTimelineActionIntervals } from '../timeline/timelineActionExecution';
import {
  TimelineActionProcessor,
  type TimelineActionLifecycleSink,
} from '../timeline/timelineActionProcessor';
import { ActionBlackboard, resolveActionValueOperand } from './actionBlackboard';
import { ActionSequence } from './actionSequence';
import {
  endBranchAction,
  executeConditionalAction,
  executeSwitchAction,
  resetConditionalAction,
  resetSwitchAction,
  tickBranchAction,
  type BranchActionHost,
} from './branchActionExecution';
import { CombatStep, type CombatExecutionContext } from './combatStep';
import {
  executeRepeatedAction,
  resetRepeatedAction,
  tickRepeatedAction,
} from './repeatedActionExecution';
import {
  endTargetLoop,
  executeActionOnce,
  executeTargetLoop,
  executeTimelineJump,
  getActionScopeBlackboard,
  resetActionScopes,
  resetTargetLoop,
  resetTimelineJump,
  tickTargetLoop,
  tickTimelineJump,
  type TargetLoopHost,
  type TimelineJumpExecutionHost,
} from './sequenceControl';

/** 步骤自身没有可变数据；它调用的操作执行器仍须由所属宿主恢复。 */
abstract class StatelessCombatStep extends CombatStep {
  override get executionData(): ActionStepData {
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

  override get executionData(): ActionStepData {
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

class OnceStep extends StatelessCombatStep {
  constructor(
    readonly step: ResolvedCombatStepForKind<'once'>,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
  }

  execute(context: CombatExecutionContext): void {
    this.tryExecute(context);
  }

  override tryExecute(context: CombatExecutionContext): boolean {
    return this.runtime.tryExecuteOnce(
      this.step.parameters.scopeKey,
      this.step.body,
      context,
      this.operationContext,
    );
  }
}

class ActionBlackboardScopeStep extends CombatStep {
  #body?: ActionSequence;
  #state: ActionBlackboardScopeState = { body: null };

  override bindExecutionData(data: ActionStepData | null): void {
    if (data?.kind !== 'blackboardScope') throw new Error('expected blackboard scope data');
    this.#state = data.scope;
    const body = data.scope.body;
    this.#body =
      body === null
        ? undefined
        : this.runtime.createSequence(
            this.step.body,
            {
              ...this.operationContext,
              blackboard: ActionBlackboard.bindRuntimeState(body.blackboard),
            },
            body.sequence,
          );
  }

  override get executionData() {
    return { kind: 'blackboardScope' as const, scope: this.#state };
  }

  constructor(
    readonly step: ResolvedCombatStepForKind<'withActionBlackboardScope'>,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
  }

  execute(context: CombatExecutionContext): void {
    this.#beginExecution();
    this.#getBody().execute(context);
  }

  override tryExecute(context: CombatExecutionContext): boolean {
    this.#beginExecution();
    const result = this.#getBody().tryExecute(context);
    return this.step.parameters.alwaysNext === true || result;
  }

  override tick(deltaTime: number, context: CombatExecutionContext): void {
    this.#getBody().tick(deltaTime, context);
  }

  override end(context: CombatExecutionContext): void {
    this.#body?.end(context);
  }

  override reset(context: CombatExecutionContext): void {
    this.#body?.reset(context);
    this.#body = undefined;
    this.#state.body = null;
  }

  #beginExecution(): void {
    if (this.step.parameters.lifetime === 'execution') {
      this.#body = undefined;
      this.#state.body = null;
    }
  }

  #getBody(): ActionSequence {
    if (this.#body !== undefined) return this.#body;
    const blackboard = this.runtime.getActionBlackboardScope(
      this.step,
      this.operationContext.blackboard,
    );
    this.#body = this.runtime.createSequence(this.step.body, {
      ...this.operationContext,
      blackboard,
    });
    this.#state.body = {
      blackboard: blackboard.runtimeState,
      sequence: this.#body.runtimeState,
    };
    // 该层级按执行惰性创建，外层 reset 时它尚不存在；创建后必须立即准备内部
    // OperationStep，否则 takeAttackSnapshot 等原生 Reset 阶段状态会在首次命中时缺失。
    this.#body.reset({});
    return this.#body;
  }
}

class RepeatEachTickStep extends CombatStep {
  #state = createRepeatedActionState();
  #body: ActionSequence | null = null;
  override bindExecutionData(data: ActionStepData | null): void {
    if (data?.kind !== 'repeat') throw new Error('expected repeated action data');
    this.#state = data.repetition;
    this.#body =
      data.repetition.body === null
        ? null
        : this.runtime.createSequence(this.step.body, this.operationContext, data.repetition.body);
  }
  override get executionData() {
    return { kind: 'repeat' as const, repetition: this.#state };
  }

  constructor(
    readonly step: ResolvedCombatStepForKind<'repeatEachTick'>,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
  }

  execute(context: CombatExecutionContext): void {
    executeRepeatedAction(this.#state, this.step.parameters, () => this.#executeBody(context));
  }

  override tick(deltaTime: number, context: CombatExecutionContext): void {
    tickRepeatedAction(this.#state, this.step.parameters, deltaTime, () =>
      this.#executeBody(context),
    );
  }

  override reset(context: CombatExecutionContext): void {
    this.#body?.reset(context);
    resetRepeatedAction(this.#state);
  }

  override end(context: CombatExecutionContext): void {
    this.#body?.end(context);
  }

  #executeBody(context: CombatExecutionContext): void {
    if (this.step.parameters.nativeExecuteInterval !== undefined) {
      if (this.#body === null) {
        this.#body = this.runtime.createSequence(this.step.body, this.operationContext);
        this.#state.body = this.#body.runtimeState;
      } else {
        this.#body.end(context);
      }
      this.#body.reset(context);
      this.#body.tryExecute(context);
      return;
    }
    const sequence = this.runtime.createSequence(this.step.body, this.operationContext);
    sequence.reset(context);
    const result = sequence.executeInstant(context);
    if (
      !result &&
      this.step.parameters.nativeTickInterval === undefined &&
      this.step.parameters.nativeChanneling === undefined
    ) {
      throw new Error('repeatEachTick body returned false; repeated short-circuit is not modeled');
    }
  }
}

class ForEachContextTargetStep extends CombatStep {
  #state = createTargetLoopState();
  override bindExecutionData(data: ActionStepData | null): void {
    if (data?.kind !== 'targets') throw new Error('expected target loop data');
    this.#state = data.loop;
    this.#bodies.clear();
    for (const [id, body] of data.loop.bodies) {
      this.#bodies.set(
        id,
        this.runtime.createSequence(
          this.step.body,
          { ...this.operationContext, currentTarget: body.target },
          body.sequence,
        ),
      );
    }
  }
  override get executionData() {
    return { kind: 'targets' as const, loop: this.#state };
  }
  // 临时绑定仍持有未迁移的子序列对象，不能用于整场切面。
  readonly #bodies = new Map<number, ActionSequence>();

  constructor(
    readonly step: ResolvedCombatStepForKind<'forEachContextTarget'>,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
  }

  execute(context: CombatExecutionContext): void {
    this.tryExecute(context);
  }

  override tryExecute(context: CombatExecutionContext): boolean {
    const parameters = this.step.parameters;
    const targets =
      parameters.target === 'enemy'
        ? ([{ kind: 'enemy' }] as const)
        : parameters.target === 'caster'
          ? ([{ kind: 'operator', operatorId: this.#ownerOperatorId() }] as const)
          : this.#contextTargets(parameters.contextKey!);
    executeTargetLoop(this.#state, targets, this.#host(context));
    return true;
  }

  override tick(deltaTime: number, context: CombatExecutionContext): void {
    tickTargetLoop(this.#state, deltaTime, this.#host(context));
  }

  override end(context: CombatExecutionContext): void {
    endTargetLoop(this.#state, this.#host(context));
    this.#bodies.clear();
  }

  override reset(): void {
    resetTargetLoop(this.#state);
    this.#bodies.clear();
  }

  #host(context: CombatExecutionContext): TargetLoopHost {
    return {
      start: currentTarget => {
        const id = this.#state.nextBodyId++;
        const sequence = this.runtime.createSequence(this.step.body, {
          ...this.operationContext,
          currentTarget,
        });
        sequence.reset(context);
        sequence.tryExecute(context);
        this.#bodies.set(id, sequence);
        this.#state.bodies.set(id, {
          target: { ...currentTarget },
          sequence: sequence.runtimeState,
        });
        return id;
      },
      tick: (id, delta) => this.#body(id).tick(delta, context),
      end: id => this.#body(id).end(context),
    };
  }

  #body(id: number): ActionSequence {
    const body = this.#bodies.get(id);
    if (body === undefined) throw new Error(`target loop body ${id} is missing`);
    return body;
  }

  #contextTargets(contextKey: string) {
    const targetContext = this.operationContext.targetContext;
    if (targetContext === undefined) {
      throw new Error('forEachContextTarget requires a combat target context');
    }
    return targetContext.get(contextKey);
  }

  #ownerOperatorId(): string {
    const operatorId = this.runtime.ownerOperatorId;
    if (operatorId === undefined) {
      throw new Error('caster forEach target requires an owner operator');
    }
    return operatorId;
  }
}

// 循环在一次 execute 中同步完成，迭代进度不会跨步进保存；派生对象由各自目录持有。
class RepeatByActionValueStep extends StatelessCombatStep {
  constructor(
    readonly step: ResolvedCombatStepForKind<'repeatByActionValue'>,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
  }

  execute(context: CombatExecutionContext): void {
    this.tryExecute(context);
  }

  override tryExecute(context: CombatExecutionContext): boolean {
    const count = resolveActionValueOperand(
      this.step.parameters.count,
      this.operationContext.blackboard,
    );
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError('repeatByActionValue count must be a non-negative integer');
    }
    for (let index = 0; index < count; index += 1) {
      // 每次重新构建步骤实例，确保 execution-lifetime 子黑板不在不同投射物间共享。
      const sequence = this.runtime.createSequence(this.step.body, this.operationContext);
      sequence.reset(context);
      sequence.executeInstant(context);
    }
    return true;
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
class SwitchStep extends CombatStep {
  #branches: readonly ActionSequence[];
  #state = createBranchActionState();
  override bindExecutionData(data: ActionStepData | null): void {
    if (data?.kind !== 'branch' || data.branches.length !== this.step.options.length)
      throw new Error('switch data does not match program');
    this.#branches = this.step.options.map((option, index) =>
      this.runtime.createSequence(option.sequence, this.operationContext, data.branches[index]!),
    );
    this.#state = data.selection;
  }
  override get executionData() {
    return {
      kind: 'branch' as const,
      selection: this.#state,
      branches: this.#branches.map(branch => branch.runtimeState),
    };
  }
  constructor(
    readonly step: ResolvedCombatStepForKind<'switch'>,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
    this.#branches = step.options.map(option =>
      runtime.createSequence(option.sequence, operationContext),
    );
  }
  execute(context: CombatExecutionContext): void {
    this.tryExecute(context);
  }
  override tryExecute(context: CombatExecutionContext): boolean {
    return executeSwitchAction(
      this.#state,
      this.#branches.length,
      this.step.parameters.alwaysNext,
      {
        ...this.#host(context),
        choice: () =>
          resolveActionValueOperand(this.step.parameters.choice, this.operationContext.blackboard),
        value: index =>
          resolveActionValueOperand(
            this.step.options[index]!.value,
            this.operationContext.blackboard,
          ),
      },
    );
  }
  override tick(delta: number, context: CombatExecutionContext): void {
    tickBranchAction(this.#state, delta, this.#host(context));
  }
  override end(context: CombatExecutionContext): void {
    endBranchAction(this.#state, this.#host(context));
  }
  override reset(context: CombatExecutionContext): void {
    resetSwitchAction(this.#branches.length, this.#host(context));
  }
  #host(context: CombatExecutionContext): BranchActionHost {
    return {
      execute: index => this.#branches[index]!.tryExecute(context),
      tick: (index, delta) => this.#branches[index]!.tick(delta, context),
      end: index => this.#branches[index]!.end(context),
      reset: index => this.#branches[index]!.reset(context),
    };
  }
}

/** A stopping one-sided conditional is the DSL's sequential guard. */
class ConditionGuardStep extends StatelessCombatStep {
  constructor(
    readonly step: ResolvedCombatStepForKind<'conditional'>,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
  }

  execute(): void {
    this.tryExecute();
  }

  override tryExecute(): boolean {
    const condition = this.step.parameters.condition;
    const passed = this.runtime.operations.evaluate(condition, this.operationContext);
    this.runtime.hooks.conditionEvaluated?.(condition, passed);
    return passed;
  }
}

class ConditionalStep extends CombatStep {
  #branches: readonly ActionSequence[];
  #state = createBranchActionState();
  override bindExecutionData(data: ActionStepData | null): void {
    const definitions = [
      this.step.whenTrue,
      ...(this.step.whenFalse === undefined ? [] : [this.step.whenFalse]),
    ];
    if (data?.kind !== 'branch' || data.branches.length !== definitions.length)
      throw new Error('conditional data does not match program');
    this.#branches = definitions.map((definition, index) =>
      this.runtime.createSequence(definition, this.operationContext, data.branches[index]!),
    );
    this.#state = data.selection;
  }
  override get executionData() {
    return {
      kind: 'branch' as const,
      selection: this.#state,
      branches: this.#branches.map(branch => branch.runtimeState),
    };
  }
  constructor(
    readonly step: ResolvedCombatStepForKind<'conditional'>,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
    this.#branches = [
      runtime.createSequence(step.whenTrue, operationContext),
      ...(step.whenFalse === undefined
        ? []
        : [runtime.createSequence(step.whenFalse, operationContext)]),
    ];
  }
  execute(context: CombatExecutionContext): void {
    this.tryExecute(context);
  }
  override tryExecute(context: CombatExecutionContext): boolean {
    return executeConditionalAction(
      this.#state,
      this.#branches.length === 2,
      this.step.parameters.alwaysNext === true,
      {
        ...this.#host(context),
        evaluate: () => {
          const condition = this.step.parameters.condition;
          const passed = this.runtime.operations.evaluate(condition, this.operationContext);
          this.runtime.hooks.conditionEvaluated?.(condition, passed);
          return passed;
        },
      },
    );
  }
  override tick(delta: number, context: CombatExecutionContext): void {
    tickBranchAction(this.#state, delta, this.#host(context));
  }
  override end(context: CombatExecutionContext): void {
    endBranchAction(this.#state, this.#host(context));
  }
  override reset(context: CombatExecutionContext): void {
    resetConditionalAction(this.#state, this.#branches.length === 2, this.#host(context));
  }
  #host(context: CombatExecutionContext): BranchActionHost {
    return {
      execute: index => this.#branches[index]!.tryExecute(context),
      tick: (index, delta) => this.#branches[index]!.tick(delta, context),
      end: index => this.#branches[index]!.end(context),
      reset: index => this.#branches[index]!.reset(context),
    };
  }
}

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

class CombatEventListenerStep extends CombatStep {
  readonly #registrations: AbilityEventRegistration[] = [];
  #state: CombatEventListenerState = { responses: [] };

  override bindExecutionData(data: ActionStepData | null): void {
    if (data?.kind !== 'listener') throw new Error('expected listener data');
    if (
      data.listener.responses.length !== 0 &&
      data.listener.responses.length !== this.step.parameters.responses.length
    )
      throw new Error('listener data does not match response count');
    this.#state = data.listener;
    if (data.listener.responses.length > 0) this.#install(true);
  }

  override get executionData() {
    return { kind: 'listener' as const, listener: this.#state };
  }

  constructor(
    readonly step: ResolvedCombatStepForKind<'listenForCombatEvents'>,
    readonly runtime: CombatActionSequenceRuntime,
    readonly operationContext: CombatOperationContext,
  ) {
    super();
  }

  execute(): void {
    if (this.#state.responses.length > 0) return;
    this.#install(false);
  }

  #install(restoring: boolean): void {
    const semanticEvents = this.runtime.semanticEvents;
    const ownerOperatorId = this.operationContext.actionOwnerId ?? this.runtime.ownerOperatorId;
    if (semanticEvents === undefined || ownerOperatorId === undefined) {
      throw new Error('combat event listener requires a semantic event runtime and owner');
    }
    try {
      for (const [index, response] of this.step.parameters.responses.entries()) {
        // Native EventListenerAction registers one runtime SequenceAction, not
        // a factory. Its completed guard entries must remain visible to nested
        // synchronous events until ExecuteInstant performs End/Reset.
        const operationContext = {
          ...this.operationContext,
          event: this.operationContext.event,
        };
        const saved = restoring ? this.#state.responses[index]! : undefined;
        const sequence = this.runtime.createSequence(
          response.sequence,
          operationContext,
          saved?.sequence,
        );
        if (!restoring) sequence.reset({});
        const registration = {
          ownerOperatorId,
          trigger: response.event,
          ...(response.condition === undefined ? {} : { condition: response.condition }),
          createOperations: () => this.runtime.operations,
          createOperationContext: () => operationContext,
          handle: (eventContext: CombatSemanticEventContext) => {
            withCombatEventResponseContext(operationContext, eventContext, () => {
              sequence.executeInstant({});
            });
          },
        };
        const handler: CombatEventHandlerRegistration =
          response.phase === 'dataAction'
            ? { ...registration, phase: 'dataAction', priority: response.priority }
            : { ...registration, phase: 'skill' };
        const installed =
          saved === undefined
            ? semanticEvents.register(handler)
            : semanticEvents.bindRegistration(handler, saved.subscriptions);
        this.#registrations.push(installed);
        if (!restoring)
          this.#state.responses.push({
            sequence: sequence.runtimeState,
            subscriptions: installed.subscriptions,
          });
      }
    } catch (error) {
      // A failed installation must not leave an earlier response active.
      this.#dispose();
      throw error;
    }
  }

  override end(): void {
    this.#dispose();
  }

  override reset(): void {
    this.#dispose();
  }

  #dispose(): void {
    for (const registration of this.#registrations) registration.dispose();
    this.#registrations.length = 0;
    this.#state.responses.length = 0;
  }
}

/** 一个状态所有者范围内的同步动作序列运行环境。 */
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

  createSequence(
    sequence: ResolvedActionSequence,
    operationContext: CombatOperationContext = this.context,
    state?: ActionSequenceState,
  ): ActionSequence {
    return new ActionSequence(
      this.#createSteps(sequence, operationContext),
      operationContext.canExecuteAction,
      state,
    );
  }

  /** Independent interval state, but one host context/blackboard across all intervals. */
  createTimeline(
    actions: readonly CompiledTimelineAction[],
    lifecycle: TimelineActionLifecycleSink = {},
    state?: TimelineRuntimeState,
  ): TimelineActionProcessor {
    let statesBySource: Map<number, ActionSequenceState> | undefined;
    if (state !== undefined) {
      if (state.sequences.length !== actions.length)
        throw new Error('timeline state does not match program length');
      // 保存数组按开始帧排序，配置数组不一定有序，不能直接按配置下标恢复。
      statesBySource = new Map(
        compileTimelineActionIntervals(actions).map((interval, index) => [
          interval.sourceIndex,
          state.sequences[index]!,
        ]),
      );
    }
    return new TimelineActionProcessor(
      actions.map((action, index) => ({
        startFrame: action.startFrame,
        ...(action.endFrame === undefined ? {} : { endFrame: action.endFrame }),
        sequence: this.createSequence(action.sequence, this.context, statesBySource?.get(index)),
      })),
      lifecycle,
      state,
    );
  }

  #createSteps(
    sequence: ResolvedActionSequence,
    operationContext: CombatOperationContext,
  ): CombatStep[] {
    return sequence.steps.flatMap<CombatStep>(step => {
      if (step.kind === 'launchProjectile') {
        return new ProjectileLaunchStep(step, this, operationContext);
      }
      if (isCombatOperationStep(step)) {
        return new OperationStep(step, this, operationContext);
      }
      // Preserve the public/editor condition tree, but restore the native
      // sequential Check -> body boundary in the runtime. A real IfElse with
      // an else branch or alwaysNext keeps its own branch lifecycle.
      if (
        step.kind === 'conditional' &&
        step.whenFalse === undefined &&
        step.parameters.alwaysNext !== true
      ) {
        return [
          new ConditionGuardStep(step, this, operationContext),
          ...this.#createSteps(step.whenTrue, operationContext),
        ];
      }
      if (step.kind === 'conditional') return new ConditionalStep(step, this, operationContext);
      if (step.kind === 'switch') return new SwitchStep(step, this, operationContext);
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
      if (step.kind === 'once') return new OnceStep(step, this, operationContext);
      if (step.kind === 'withActionBlackboardScope') {
        return new ActionBlackboardScopeStep(step, this, operationContext);
      }
      if (step.kind === 'repeatEachTick') {
        return new RepeatEachTickStep(step, this, operationContext);
      }
      if (step.kind === 'repeatByActionValue') {
        return new RepeatByActionValueStep(step, this, operationContext);
      }
      if (step.kind === 'forEachContextTarget') {
        return new ForEachContextTargetStep(step, this, operationContext);
      }
      if (step.kind === 'listenForCombatEvents') {
        return new CombatEventListenerStep(step, this, operationContext);
      }
      const unhandled: never = step;
      throw new Error(`unhandled combat sequence step: ${JSON.stringify(unhandled)}`);
    });
  }

  reset(): void {
    resetActionScopes(this.#scopeState);
    this.#blackboardBindings = new WeakMap();
  }

  getActionBlackboardScope(
    step: ResolvedCombatStepForKind<'withActionBlackboardScope'>,
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

  tryExecuteOnce(
    scopeKey: string,
    body: ResolvedActionSequence,
    context: CombatExecutionContext,
    operationContext: CombatOperationContext = this.context,
  ): boolean {
    return executeActionOnce(this.#scopeState, scopeKey, () => {
      const sequence = this.createSequence(body, operationContext);
      sequence.reset(context);
      sequence.executeInstant(context);
    });
  }
}
