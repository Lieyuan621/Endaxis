import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type { CallbackSkillHostFactory } from '../abilities/callbackSkillHost';
import type {
  ProjectileFinishTiming,
  ProjectileLifetimeReference,
} from '../abilities/projectileLifecycleRuntime';
import {
  DamageCalculationSnapshots,
  type DamageCalculationSnapshotProgram,
} from '../damage/damageCalculationSnapshots';
import type { AbilityResponseEvent, AbilitySkillPayload } from '../events/combatAbilityEvent';
import {
  createSkillExecutionState,
  type RuntimeSkillState,
  type SkillCooldownSnapshot,
  type SkillRuntimeState,
} from '../state/abilityState';
import type { BuffReference } from '../state/foundationState';
import { type SkillCastStartPreparation } from '../state/foundationState';
import { applySkillCastStartPreparation } from './skillCastStartPreparation';
import {
  advanceSkillExecution,
  beginSkillCast,
  endSkillExecution,
  tickSkillExecution,
} from './skillExecution';

/** A detached projectile owns both its callback execution and eventual cleanup. */
export type ScheduleProjectileFinishCallback = (
  delaySeconds: ProjectileFinishTiming,
  recycleDelaySeconds: number,
  execute: () => void,
  beforeReset: () => void,
  skillCastInfo?: CombatSkillCastInfo,
  advanceCallback?: (deltaSeconds: number) => void,
  sourceId?: string,
  callbackState?: import('../state/instanceState').ProjectileCallbackState,
  callbackProgram?: import('../../compiler/combatProgram').CompiledProjectileCallbackSkillProgram,
  producedBy?: import('../receipt/combatReceipt').CombatObjectRef,
) => ProjectileLifetimeReference;

export interface ProjectileRuntimeDependencies {
  readonly scheduleProjectileFinishCallback: ScheduleProjectileFinishCallback;
  readonly createCallbackSkillHost: CallbackSkillHostFactory;
}
/**
 * 编译后技能程序在一次战斗中的有状态执行实例。
 * 每个放置块独立持有调度游标和黑板；同一技能的冷却由装配层显式共享。
 */
import type {
  CompiledSkillExecutionProgram,
  ResolvedActionSequence,
  ResolvedCombatOperationStep,
} from '../../compiler/combatProgram';
import type {
  AbilityEntityTargetRef,
  RuntimeTargetRef,
} from '../../game-data/logicalAbilityEntity';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { ActionBlackboard } from '../actions/actionBlackboard';
import type { ActionSequence } from '../actions/actionSequence';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import type { CombatOperationPrograms } from '../actions/combatOperationPrograms';
import type { CombatExecutionContext } from '../actions/combatStep';
import type { BuffApplicationHandle } from '../buffs/buffOperationExecutor';
import { buffReferenceKey } from '../buffs/buffReference';
import type {
  CombatSemanticEvent,
  CombatSemanticEventRuntime,
} from '../events/combatSemanticEventRuntime';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { CombatResources } from '../resources/combatResources';
import {
  createCombatOperationHostState,
  type CombatOperationHostState,
} from '../state/actionState';
import type { BuffFinishReason, CombatSkillCastInfo } from '../state/foundationState';
import { COMBAT_FRAME_INTERVAL, type CombatClock } from '../time/combatClock';
import type { TimelineActionProcessor } from '../timeline/timelineActionProcessor';
import { SkillCooldown } from './skillCooldown';
import { SkillTimelineJumpGate } from './skillTimelineJump';

/** 技能实例从可释放到结束的运行时生命周期状态。 */
/** 当前已闭环、会改变技能结束事实的中断来源。 */
export type RuntimeSkillInterruptReason = 'default' | 'dash' | 'castNextSkill';

/** CastEnd 在结束时间轴动作期间暴露的唯一技能转场输入。 */
export interface RuntimeSkillTransition {
  readonly nextSkillId: string;
  readonly attachBuffToNextSkill: (buff: BuffApplicationHandle) => void;
}

/** 技能运行时把普通操作和条件判断委托给战斗装配层的端口。 */
export interface CombatOperationContext {
  /** 当前执行程序/放置块；不能用继承的 originCastId 代替实际宿主。 */
  readonly executionActionId?: string;
  /** 仅在执行持有登记的步骤时挂接，实际数据由动作树持有。 */
  actionRegistrationState?: import('../state/actionState').ActionRegistrationState;
  actionBuffReferencesState?: import('../state/actionState').ActionBuffReferencesState;
  /** 临时 BeforeApplyDamageModifierContext；不是 AbilitySystem 广播，不覆盖普通来源施法。 */
  readonly beforeApplyDamageModifier?: import('../damage/damageModifiers').DamageModifierConditionInput & {
    /** 原生 Buff.affixSkillCastId。未绑定与明确无效的 0/null 必须区分，不回退普通 SkillCastInfo。 */
    readonly getBuffAffixSkillCastId?: () => number | null;
  };
  /** 当前动作环境独占的 direct 黑板；生命周期由技能、Buff 或连携条件宿主管理。 */
  readonly blackboard: ActionBlackboard;
  /** 由宿主 Reset 准备、按动作实例保存的原生攻击计算快照。 */
  readonly damageCalculationSnapshots?: DamageCalculationSnapshots;
  /** 只有读取或写入原生 Context 目标组的步骤才要求存在。 */
  readonly targetContext?: RuntimeTargetContext;
  /** 连携条件的原生 InputTarget；承受附着事件中它是施加者，不是物理事件 targetId。 */
  readonly actionInputTarget?: RuntimeTargetRef;
  /** 只在 forEachContextTarget 的 body 内存在。 */
  readonly currentTarget?: RuntimeTargetRef;
  /** 能力实体子技能的稳定 ActionOwner；内层 forEach 不得覆盖。 */
  readonly actionOwnerAbilityEntity?: AbilityEntityTargetRef;
  /** 执行到当前步骤时的施法信息；扣费前后的未返还技力可能不同。 */
  readonly skillCastInfo?: CombatSkillCastInfo;
  /** 当前技能时间轴动作可把原生 AttachingSkill Buff 绑定到本次施法。 */
  readonly attachBuffToCurrentSkill?: (buff: BuffApplicationHandle) => void;
  /** InheritBuffAction 把已找到的同一实例从当前技能结束清理集合解除附着。 */
  readonly detachBuffFromCurrentSkill?: (buff: BuffApplicationHandle) => void;
  /** 只在由下一技能打断的 CastEnd 期间存在；值是下一技能的原生 skillId。 */
  readonly pendingNextSkillId?: string;
  /** 把已脱离当前动作寿命的同一 Buff 实例转交给下一技能。 */
  readonly attachBuffToNextSkill?: (buff: BuffApplicationHandle) => void;
  /**
   * 当前同步事件的来源施法；与拥有该响应的 Buff 自身来源施法严格分离。
   * null 明确表示原生事件载荷没有来源；undefined 表示生产端未提供该端口。
   */
  readonly eventSkillCastInfo?: CombatSkillCastInfo | null;
  /** 仅在同步事件响应期间存在；普通技能步骤不得假设它可用。 */
  readonly event?: CombatSemanticEvent | AbilityResponseEvent;
  /** 仅由 Buff 实例响应提供；用于保留原生 ActionSource 身份。 */
  readonly buffSourceId?: string;
  /** 仅由 Buff 实例响应提供；用于保留原生 ActionOwner 身份。 */
  readonly buffOwnerId?: string;
  /** 当前执行伤害的 Buff 实例；与攻击者和来源施法分开记录。 */
  readonly executingBuff?: {
    readonly buffId: string;
    readonly buffOwnerId: string;
    readonly buffInstanceId: number;
  };
  /** 事件动作宿主；武器/装备是装备者，Buff 是当前 Buff owner。 */
  readonly actionOwnerId?: string;
  /** 已证明的动作来源；用于折叠为初始化后不再拥有事件载荷的 Ability 程序。 */
  readonly actionSourceId?: string;
  /** 仅由 Buff 生命周期与事件响应提供；Environment 查询精确指向当前实例。 */
  readonly finishCurrentBuff?: (
    reason: BuffFinishReason,
    sourceId: string,
    skillCastInfo: CombatSkillCastInfo | null,
  ) => boolean;
  /** 仅 Buff 环境提供；动作结束解除监听，不清除已记录的 affix 编号。 */
  readonly bindCurrentBuffSkillAffix?: (skillCastId: number) => number;
  /** 当前 Buff 由 SkillAffix 绑定的施放编号；0 表示未绑定，与普通来源编号分开读取。 */
  readonly getCurrentBuffAffixSkillCastId?: () => number;
  readonly finishCurrentBuffSkillAffix?: (affixId: number) => void;
  /** 只由 GlobalBuff 投影出的子 Buff 提供；不得按 ID 猜测父层。 */
  readonly finishParentGlobalBuff?: (reason: 'early' | 'other') => boolean;
  /** Environment BuffCount 查询读取正在执行的当前 Buff 增强层数。 */
  readonly getCurrentBuffEnhanceCount?: () => number;
  /** Environment SaveBuffLifeTime 读取当前实例的剩余秒数；无限时长返回 null。 */
  readonly getCurrentBuffRemainingDuration?: () => number | null;
  /** SetBuffDurationAction 修改当前有限时长实例。 */
  readonly setCurrentBuffRemainingDuration?: (duration: number) => void;
  /** 把本次创建的 Buff 绑定为当前生命周期 Buff 的子实例。 */
  readonly addCurrentBuffChild?: (child: BuffApplicationHandle) => void;
  /** 动作所有者为 Ability 时绑定到其自身寿命，不能绑定到当前事件的来源技能。 */
  readonly addAbilityChildBuff?: (child: BuffApplicationHandle) => void;
  /** 仅由 Buff 生命周期与事件响应提供；暂停只作用于当前实例。 */
  readonly setCurrentBuffTimePaused?: (paused: boolean) => void;
  /** Buff 黑板写入后重建依赖动态键的属性修正；普通技能上下文不提供。 */
  readonly refreshCurrentBuffAttributeModifiers?: () => void;
  /** 仅由宿主技能/能力实体子技能提供；普通操作不得缓存或跨宿主调用。 */
  readonly requestTimelineJump?: (destinationFrame: number) => void;
  /** 宿主的实时动作执行许可；与序列有效性、Tick/End 的清理许可不同。 */
  readonly canExecuteAction?: () => boolean;
  /** 仅由技能时间轴宿主提供；结束当前技能且不改写局部帧。 */
  readonly requestTimelineFinish?: () => void;
  /** 原生 AllowNext 窗口实际进入活动分支时，通知技能宿主保存本帧候选。 */
  readonly reachSkillOperableBoundary?: (skillIds: readonly string[]) => void;
  /** 原生 MarkCanDash 只标记当前技能的本次施放。 */
  readonly markCurrentSkillCanDash?: () => void;
  /** 仅由技能时间轴宿主提供；返回原生 StoreCurSkillExecuteFrame 使用的整数局部帧。 */
  readonly getCurrentTimelineFrame?: () => number;
  /** 已发射投射物的 duration-finish 注册端口；注册项不归当前技能寿命所有。 */
  readonly scheduleProjectileFinishCallback?: ScheduleProjectileFinishCallback;
  readonly createCallbackSkillHost?: CallbackSkillHostFactory;
}

export interface CombatOperationExecutor {
  /** 当前执行链使用的动作数据和固定槽目录；回调子技能据此共享同一宿主。 */
  readonly operationHost?: {
    readonly state: CombatOperationHostState;
    readonly programs: CombatOperationPrograms;
  };
  prepare?(step: ResolvedCombatOperationStep, context: CombatOperationContext): void;
  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean;
  end?(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void;
  evaluate(
    condition: ResolvedCombatStepForKind<'conditional'>['parameters']['condition'],
    context?: CombatOperationContext,
  ): boolean;
}

/**
 * 技能程序不携带运行时对象身份。普通干员技能默认仍由 program.operatorId 承担这些职责；
 * 能力实体技能必须显式提供自身身份，不能把发射者或继承的 SkillCastInfo 冒充为 Owner。
 */
export interface SkillRuntimeHostIdentity {
  /** 动作树中 Owner/Source 的真实 AbilitySystem 实体身份。 */
  readonly actionOwnerId: string;
  readonly actionSourceId: string;
  /** 能力实体宿主的稳定句柄；普通干员技能不提供。 */
  readonly actionOwnerAbilityEntity?: AbilityEntityTargetRef;
  /** 回执与技能生命周期事件的发布主体。 */
  readonly eventSourceId: string;
  /** 语义事件注册仍只接受干员；非干员宿主在契约扩展前不得伪造一个。 */
  readonly semanticEventOwnerOperatorId?: string;
}

type SkillRuntimeDependencies = {
  /** 显式施放实例身份；null 或缺失表示固定技能定义。 */
  readonly castId?: string | null;
  readonly clock: CombatClock;
  /** 原生费用属性在开始门禁和实际扣费时分别重新求值。 */
  readonly resolveCosts?: (
    costs: readonly CompiledSkillExecutionProgram['costs'][number][],
  ) => readonly CompiledSkillExecutionProgram['costs'][number][];
  readonly receipt: CombatReceiptSink;
  readonly operations: CombatOperationExecutor;
  readonly allocateSkillCastId: () => number;
  readonly semanticEvents?: CombatSemanticEventRuntime;
  /** 干员实体级黑板由同一能力系统下的所有技能共享，技能 direct blackboard 仅回退读取它。 */
  readonly entityBlackboard?: ActionBlackboard;
  readonly actionBlackboard?: ActionBlackboard;
  /** 同一干员同一技能的多个时间轴块共用冷却账本。 */
  readonly cooldown?: SkillCooldown;
  /** 共享账本只能由一个运行实例逐帧推进。 */
  readonly advancesCooldown?: boolean;
  /** 原生 CastEnd 清理完成后向所有者 AbilitySystem 同步发布 OnSkillEnd。 */
  readonly emitSkillEnd?: (payload: AbilitySkillPayload) => void;
  /** 原生费用实际应用成功后、同帧时间轴动作前同步发布 OnAfterSkillApplyCost。 */
  readonly emitAfterSkillApplyCost?: (payload: AbilitySkillPayload) => void;
  readonly scheduleProjectileFinishCallback?: ScheduleProjectileFinishCallback;
  readonly createCallbackSkillHost?: CallbackSkillHostFactory;
  readonly hostIdentity?: SkillRuntimeHostIdentity;
  readonly damageSnapshotProgram?: DamageCalculationSnapshotProgram;
  /** 干员技能使用战斗账本；零费用实体技能传null，不拥有资源状态。 */
  readonly resources: CombatResources | null;
  /** 必须与构造 operations 执行链时注入的状态是同一对象。 */
  readonly operationState?: CombatOperationHostState;
};

/** 一次编译后技能的有状态实例；创建后只用于一场战斗。 */
export class SkillRuntime {
  readonly runtimeState: SkillRuntimeState;
  readonly #program: CompiledSkillExecutionProgram;
  readonly #dependencies: SkillRuntimeDependencies;
  readonly #context: CombatExecutionContext = {};
  readonly #blackboard: ActionBlackboard;
  readonly #initialBlackboard: ReturnType<ActionBlackboard['snapshot']>;
  readonly #execution: ReturnType<typeof createSkillExecutionState>;
  readonly #targetContext: RuntimeTargetContext;
  readonly #operationContext: CombatOperationContext;
  readonly #sequenceRuntime: CombatActionSequenceRuntime;
  readonly #cooldown: SkillCooldown;
  readonly #advancesCooldown: boolean;
  #timeline: TimelineActionProcessor | null = null;
  readonly #timelineJump = new SkillTimelineJumpGate();
  // null 表示原实例已回收；保留引用身份，直到正常的技能清理阶段移除。
  readonly #attachedBuffBindings = new Map<string, BuffApplicationHandle | null>();
  readonly #hostIdentity: SkillRuntimeHostIdentity;
  #pendingTransition: RuntimeSkillTransition | null = null;

  constructor(
    program: CompiledSkillExecutionProgram,
    dependencies: SkillRuntimeDependencies,
    restored?: {
      readonly state: SkillRuntimeState;
      readonly damageSnapshotProgram: DamageCalculationSnapshotProgram;
      readonly resolveAttachedBuff: (reference: BuffReference) => BuffApplicationHandle | undefined;
    },
  ) {
    this.#program = program;
    this.#dependencies = dependencies;
    const castId = dependencies.castId ?? null;
    if (restored !== undefined && restored.state.castId !== castId) {
      throw new Error('restored skill cast identity does not match its instance');
    }
    if (
      restored !== undefined &&
      dependencies.actionBlackboard !== undefined &&
      dependencies.actionBlackboard.runtimeState !== restored.state.blackboard
    )
      throw new Error('restored skill must use the restored action blackboard');
    this.#execution = restored?.state.execution ?? createSkillExecutionState();
    this.#targetContext = new RuntimeTargetContext(this.#execution.targetContext);
    this.#hostIdentity =
      dependencies.hostIdentity ??
      Object.freeze({
        actionOwnerId: program.operatorId,
        actionSourceId: program.operatorId,
        eventSourceId: program.operatorId,
        semanticEventOwnerOperatorId: program.operatorId,
      });
    this.#blackboard =
      (restored === undefined
        ? dependencies.actionBlackboard
        : ActionBlackboard.bindRuntimeState(restored.state.blackboard)) ??
      new ActionBlackboard(undefined, dependencies.entityBlackboard);
    this.#initialBlackboard = restored?.state.initialBlackboard ?? {
      ...program.initialBlackboard,
      ...this.#blackboard.snapshot(),
    };
    if (
      dependencies.resources !== null &&
      this.#hostIdentity.actionOwnerAbilityEntity !== undefined
    )
      throw new Error('ability entity skill cannot own an operator resource ledger');
    if (dependencies.resources === null) this.#requireNoResourceCost(program.costs);
    this.#cooldown =
      dependencies.cooldown ??
      new SkillCooldown(
        program.cooldownFrames,
        program.costFrame,
        undefined,
        restored?.state.cooldown,
      );
    if (restored !== undefined && this.#cooldown.runtimeState !== restored.state.cooldown)
      throw new Error('restored skill must use the restored shared cooldown');
    this.#advancesCooldown = dependencies.advancesCooldown ?? true;
    const runtime = this;
    this.#operationContext = {
      blackboard: this.#blackboard,
      damageCalculationSnapshots: new DamageCalculationSnapshots(
        restored?.damageSnapshotProgram ?? dependencies.damageSnapshotProgram,
        restored?.state.damageSnapshots,
      ),
      targetContext: this.#targetContext,
      actionOwnerId: this.#hostIdentity.actionOwnerId,
      actionSourceId: this.#hostIdentity.actionSourceId,
      executionActionId: castId ?? this.#program.skillId,
      ...(this.#hostIdentity.actionOwnerAbilityEntity === undefined
        ? {}
        : { actionOwnerAbilityEntity: this.#hostIdentity.actionOwnerAbilityEntity }),
      ...(dependencies.createCallbackSkillHost === undefined
        ? {}
        : { createCallbackSkillHost: dependencies.createCallbackSkillHost }),
      requestTimelineJump: destinationFrame => this.#requestTimelineJump(destinationFrame),
      requestTimelineFinish: () => this.#requestTimelineFinish(),
      reachSkillOperableBoundary: skillIds => this.#reachSkillOperableBoundary(skillIds),
      markCurrentSkillCanDash: () => {
        this.runtimeState.markedCanDash = true;
      },
      getCurrentTimelineFrame: () => roundToEven(this.#execution.passedFrames),
      ...(dependencies.scheduleProjectileFinishCallback === undefined
        ? {}
        : { scheduleProjectileFinishCallback: dependencies.scheduleProjectileFinishCallback }),
      get skillCastInfo() {
        return runtime.skillCastInfo;
      },
      attachBuffToCurrentSkill: buff =>
        runtime.attachBuffToCast(runtime.#execution.skillCastId, buff),
      detachBuffFromCurrentSkill: buff => {
        const key = buffReferenceKey(buff.reference);
        runtime.#execution.attachedBuffs.delete(key);
        runtime.#attachedBuffBindings.delete(key);
      },
      get pendingNextSkillId() {
        return runtime.#pendingTransition?.nextSkillId;
      },
      attachBuffToNextSkill: buff => {
        const transition = runtime.#pendingTransition;
        if (transition === null) throw new Error('no pending next skill during CastEnd');
        transition.attachBuffToNextSkill(buff);
      },
    };
    this.#sequenceRuntime = new CombatActionSequenceRuntime(
      dependencies.operations,
      this.#operationContext,
      {
        stepReached: step => this.record('CombatStepReached', { kind: step.kind }),
        conditionEvaluated: (condition, passed) =>
          this.record('CombatConditionEvaluated', { kind: condition.kind, passed }),
      },
      dependencies.semanticEvents,
      this.#hostIdentity.semanticEventOwnerOperatorId,
      restored?.state.scopes,
    );
    const operationState =
      restored?.state.operations ?? dependencies.operationState ?? createCombatOperationHostState();
    if (
      restored !== undefined &&
      dependencies.operationState !== undefined &&
      dependencies.operationState !== restored.state.operations
    ) {
      throw new Error('restored skill must use the restored operation host state');
    }
    this.runtimeState = restored?.state ?? {
      castId,
      markedCanDash: false,
      execution: this.#execution,
      blackboard: this.#blackboard.runtimeState,
      initialBlackboard: this.#initialBlackboard,
      cooldown: this.#cooldown.runtimeState,
      scopes: this.#sequenceRuntime.scopeState,
      damageSnapshots: this.#operationContext.damageCalculationSnapshots!.runtimeState,
      operations: operationState,
      timeline: null,
    };
    if (restored !== undefined) {
      for (const [key, reference] of this.#execution.attachedBuffs) {
        const binding = restored.resolveAttachedBuff(reference);
        if (
          buffReferenceKey(reference) !== key ||
          (binding !== undefined && buffReferenceKey(binding.reference) !== key)
        )
          throw new Error(`restored attached Buff ${key} has a different identity`);
        this.#attachedBuffBindings.set(key, binding ?? null);
      }
      if (restored.state.timeline !== null)
        this.#timeline = this.#createTimeline(restored.state.timeline);
    }
  }

  /** 固定动作到快照槽位的映射由分支共用，不能跟随状态复制后重新编号。 */
  get damageSnapshotProgram(): DamageCalculationSnapshotProgram {
    return this.#operationContext.damageCalculationSnapshots!.program;
  }

  get state(): RuntimeSkillState {
    return this.#execution.state;
  }

  get skillId(): string {
    return this.#program.skillId;
  }

  /** 路由包装器用实际执行技能 ID，其余技能用自身 ID。 */
  get transitionSkillId(): string {
    return this.#program.executionSkillId ?? this.#program.skillId;
  }

  /** 文档中的技能释放身份；单元测试程序可能缺失。 */
  get castId(): string | undefined {
    return this.runtimeState.castId ?? undefined;
  }

  get skillType(): CompiledSkillExecutionProgram['skillType'] {
    return this.#program.skillType;
  }

  /** 普攻执行到此帧后，连段接续目标才更新为下一段。 */
  get offsetRecordFrame(): number | undefined {
    return this.#program.offsetRecordFrame;
  }

  get nativeSkillType(): CompiledSkillExecutionProgram['nativeSkillType'] {
    return this.#program.nativeSkillType;
  }

  get timelineBlockFrames(): number | undefined {
    return this.#program.timelineBlockFrames;
  }

  /** 玩家技能的正式块宽由实际 AllowNext 分支或 canInterrupt 决定；静态块宽只供预览。 */
  get usesRuntimeOperableBoundary(): boolean {
    return this.#program.exclusiveFrame !== undefined;
  }

  get requiresExecutedOperableBoundaryCandidate(): boolean {
    return this.#program.timelineContinuationSkillId !== undefined;
  }

  get reachedOperableBoundaryFrame(): number | undefined {
    return this.#execution.reachedOperableBoundaryFrame;
  }

  get operableBoundaryCandidateFrame(): number | undefined {
    return this.#execution.operableBoundaryCandidateFrame;
  }

  get operableBoundaryCandidateSkillIds(): readonly string[] {
    return this.#execution.operableBoundaryCandidateSkillIds;
  }

  takeOperableBoundaryCandidate():
    { readonly frame: number; readonly skillIds: readonly string[] } | undefined {
    const frame = this.#execution.operableBoundaryCandidateFrame;
    if (frame === undefined || this.#execution.operableBoundaryCandidateSkillIds.length === 0)
      return undefined;
    const skillIds = [...this.#execution.operableBoundaryCandidateSkillIds];
    this.#execution.operableBoundaryCandidateFrame = undefined;
    this.#execution.operableBoundaryCandidateSkillIds.length = 0;
    return { frame, skillIds };
  }

  markOperableBoundaryReached(frame = this.currentTimelineFrame): void {
    if (this.#execution.reachedOperableBoundaryFrame !== undefined) return;
    this.#execution.reachedOperableBoundaryFrame = frame;
  }

  get passedFrames(): number {
    return this.#execution.passedFrames;
  }

  /** 原生比较 Unity frameCount；固定宿主一次更新映射一帧，不使用技能局部帧。 */
  get startedInCurrentFrame(): boolean {
    return this.#execution.castStartFrame === this.#dependencies.clock.frame;
  }

  /** 原生 canInterrupt 的时间分支；当前全量 SkillData 未出现 MarkCanInterruptAction。 */
  get canInterrupt(): boolean {
    if (this.#program.exclusiveFrame === undefined) {
      throw new Error(`skill '${this.#program.skillId}' requires native exclusiveFrame data`);
    }
    // 原生按秒比较 passedTime > exclusiveFrame / 30 + 0.00001。
    return this.#execution.passedFrames > this.#program.exclusiveFrame + 0.0003;
  }

  /** 原生 Skill.canDash：先复用 canInterrupt，再读取本次施放的 MarkCanDash 标记。 */
  get canDash(): boolean {
    return this.canInterrupt || this.runtimeState.markedCanDash;
  }

  get inputWindows(): CompiledSkillExecutionProgram['inputWindows'] {
    return this.#program.inputWindows;
  }

  get currentTimelineFrame(): number {
    return roundToEven(this.#execution.passedFrames);
  }

  get appliedCost(): boolean {
    return this.#execution.appliedCost;
  }

  get nonReturnedSpCost(): number {
    return this.#execution.nonReturnedSpCost;
  }

  get cooldown(): SkillCooldownSnapshot {
    return this.#cooldown.snapshot;
  }

  get skillCastInfo(): CombatSkillCastInfo {
    if (this.#execution.skillCastId === 0)
      throw new Error(`skill '${this.#program.skillId}' has not started`);
    const origin = this.#execution.inheritedSkillCastInfo;
    if (origin === undefined && this.#program.skillType === undefined) {
      throw new Error(
        `native-only skill '${this.#program.skillId}' requires inherited SkillCastInfo`,
      );
    }
    return {
      skillCastId: this.#execution.skillCastId,
      originSkillId: origin?.originSkillId ?? this.#program.skillId,
      originSkillType: origin?.originSkillType ?? this.#program.skillType!,
      ...(origin?.originCastId !== undefined
        ? { originCastId: origin.originCastId }
        : this.castId === undefined
          ? {}
          : { originCastId: this.castId }),
      nonReturnedSpCost: this.#execution.nonReturnedSpCost,
    };
  }

  get processingSkillCastId(): number | undefined {
    return this.#execution.preparedSkillCastId || this.#execution.skillCastId || undefined;
  }

  get operations(): CombatOperationExecutor {
    return this.#dependencies.operations;
  }

  get operationContext(): CombatOperationContext {
    return this.#operationContext;
  }

  canStart(): boolean {
    return this.#execution.state !== 'casting';
  }

  prepareStartBlackboard(values: Readonly<Record<string, number>>): void {
    if (this.#execution.state === 'casting') {
      throw new Error(`skill '${this.#program.skillId}' is already casting`);
    }
    this.#execution.preparedStartBlackboard = Object.freeze({ ...values });
  }

  prepareAfterCastStart(preparation: SkillCastStartPreparation): void {
    if (!this.canStart()) throw new Error(`skill '${this.skillId}' is already casting`);
    this.#execution.preparedCastStart = structuredClone(preparation);
  }

  prepareSkillCastId(skillCastId: number): void {
    if (this.#execution.state === 'casting') {
      throw new Error(`skill '${this.#program.skillId}' is already casting`);
    }
    if (!Number.isSafeInteger(skillCastId) || skillCastId <= 0) {
      throw new RangeError('prepared skill cast id must be a positive safe integer');
    }
    this.#execution.preparedSkillCastId = skillCastId;
  }

  prepareCastInput(input: {
    readonly skipApplyCost: boolean;
    readonly inheritedSkillCastInfo?: CombatSkillCastInfo;
    readonly producedBy?: import('../receipt/combatReceipt').CombatObjectRef;
  }): void {
    if (this.#execution.state === 'casting') {
      throw new Error(`skill '${this.#program.skillId}' is already casting`);
    }
    const inherited = input.inheritedSkillCastInfo;
    if (inherited !== undefined) {
      if (!Number.isSafeInteger(inherited.skillCastId) || inherited.skillCastId <= 0) {
        throw new RangeError('inherited skill cast id must be a positive safe integer');
      }
      this.#execution.preparedSkillCastInfo = { ...inherited };
      this.#execution.preparedSkillCastId = inherited.skillCastId;
    }
    this.#execution.preparedSkipApplyCost = input.skipApplyCost;
    this.#execution.preparedProducer = input.producedBy;
  }

  /** 时间轴声明的玩家操作即使原生门槛不满足也继续执行，并按旧版展示规则扣费。 */
  prepareForcedTimelineCast(): void {
    if (this.#execution.state === 'casting') {
      throw new Error(`skill '${this.#program.skillId}' is already casting`);
    }
    this.#execution.preparedForceTimelinePayment = true;
  }

  attachBuffToCast(skillCastId: number, buff: BuffApplicationHandle): void {
    const currentCastId = this.#execution.preparedSkillCastId || this.#execution.skillCastId;
    if (skillCastId <= 0 || skillCastId !== currentCastId) {
      throw new Error('cannot attach a Buff using a stale skill cast context');
    }
    // 原生 Skill.AttachBuff 按实例去重，并保留首次附着顺序。
    this.attachInheritedBuff(buff);
  }

  attachInheritedBuff(buff: BuffApplicationHandle): void {
    const reference = buff.reference;
    const key = buffReferenceKey(reference);
    this.#execution.attachedBuffs.set(key, { ...reference });
    this.#attachedBuffBindings.set(key, buff);
  }

  trySwitchToBuffCast(
    currentSkill?: {
      readonly skillType: CompiledSkillExecutionProgram['skillType'];
      readonly skillCastInfo: CombatSkillCastInfo;
      readonly canInterrupt: boolean;
    },
    beforeCastStart?: () => void,
    withProcessingSkill: (execute: () => void) => void = execute => execute(),
  ): boolean {
    const route = this.#program.switchToBuffCast;
    if (
      route?.currentSkillTypes !== undefined &&
      currentSkill !== undefined &&
      currentSkill.skillType === undefined
    ) {
      throw new Error(
        'SwitchToBuffCast player-type condition requires the current skill player type',
      );
    }
    if (
      route === undefined ||
      (route.currentSkillTypes !== undefined &&
        (currentSkill === undefined ||
          currentSkill.skillType === undefined ||
          !route.currentSkillTypes.includes(currentSkill.skillType))) ||
      (route.requiresCurrentSkillNotInterruptible === true &&
        (currentSkill === undefined || currentSkill.canInterrupt))
    ) {
      return false;
    }
    this.#blackboard.restore(this.#initialBlackboard);
    this.#blackboard.assign(this.#execution.preparedStartBlackboard);
    this.#targetContext.clear();
    this.#sequenceRuntime.reset();
    this.#operationContext.damageCalculationSnapshots!.clear();
    if (route.asSkillCast) {
      this.#execution.skillCastId =
        this.#execution.preparedSkillCastId === 0
          ? this.#dependencies.allocateSkillCastId()
          : this.#execution.preparedSkillCastId;
      if (!Number.isSafeInteger(this.#execution.skillCastId) || this.#execution.skillCastId <= 0)
        throw new RangeError('allocated skill cast id must be a positive safe integer');
      this.#execution.nonReturnedSpCost = 0;
    }
    const skillCastInfo = route.asSkillCast ? this.skillCastInfo : currentSkill?.skillCastInfo;
    if (skillCastInfo === undefined) return false;
    // 旁路不启动候选技能；为这次同步执行固定快照施法身份，不能把一个事后会
    // 回落到候选技能的 getter 泄漏给操作执行器。
    const routeContext: CombatOperationContext = {
      blackboard: this.#blackboard,
      damageCalculationSnapshots: this.#operationContext.damageCalculationSnapshots,
      targetContext: this.#targetContext,
      skillCastInfo,
    };
    if (route.condition !== undefined) {
      const passed = this.#dependencies.operations.evaluate(route.condition, routeContext);
      this.record('CombatConditionEvaluated', { kind: route.condition.kind, passed });
      if (!passed) return false;
    }
    const cooldownReserved = this.#cooldown.tryReserve();
    if (this.#cooldown.snapshot.configured) {
      this.record(cooldownReserved ? 'SkillCooldownReserved' : 'SkillCooldownUnavailableAtStart', {
        remainingFrames: this.#cooldown.snapshot.remainingFrames,
      });
    }
    const executeRoute = () => {
      if (route.asSkillCast) {
        beforeCastStart?.();
        this.#applyCost(true);
      }
      this.#sequenceRuntime
        .createSequence(route.sequence, routeContext)
        .executeInstant(this.#context);
      this.record('SkillSwitchedToBuff', { asSkillCast: route.asSkillCast });
      if (route.asSkillCast) this.#emitSkillEnd();
    };
    // 非施法旁路仍处理当前技能；只有 AsSkillCast 临时覆盖至自身，包含结束事件。
    if (route.asSkillCast) withProcessingSkill(executeRoute);
    else executeRoute();
    this.#execution.preparedStartBlackboard = {};
    this.#execution.preparedSkillCastId = 0;
    this.#execution.preparedCastStart = undefined;
    return true;
  }

  tryStart(): boolean {
    if (this.#execution.state === 'casting')
      throw new Error(`skill '${this.#program.skillId}' is casting`);
    const cooldownReserved = this.#cooldown.tryReserve();
    if (this.#cooldown.snapshot.configured) {
      this.record(cooldownReserved ? 'SkillCooldownReserved' : 'SkillCooldownUnavailableAtStart', {
        remainingFrames: this.#cooldown.snapshot.remainingFrames,
      });
    }
    if (!this.#execution.preparedSkipApplyCost && !this.#canPay(this.#resolvedCosts())) {
      this.record('SkillCostUnavailableAtStart');
    }

    this.runtimeState.markedCanDash = false;
    this.#timeline = this.#createTimeline();
    this.#blackboard.restore(this.#initialBlackboard);
    this.#targetContext.clear();
    this.#blackboard.assign(this.#execution.preparedStartBlackboard);
    this.#execution.preparedStartBlackboard = {};
    this.runtimeState.timeline = this.#timeline.runtimeState;
    this.#sequenceRuntime.reset();
    this.#operationContext.damageCalculationSnapshots!.clear();
    this.#timeline.reset(this.#context);
    beginSkillCast(this.#execution, this.#dependencies.clock.frame, () =>
      this.#dependencies.allocateSkillCastId(),
    );
    this.record('SkillStarted', undefined, undefined, this.#execution.preparedProducer);
    this.#execution.preparedProducer = undefined;
    const afterCastStart = this.#execution.preparedCastStart;
    this.#execution.preparedCastStart = undefined;
    if (afterCastStart !== undefined)
      applySkillCastStartPreparation(afterCastStart, this.#operationContext);
    // 原生 `TryCastSkill` 会立即执行一次 `OnTick(0, 0)`。
    this.#tick(0);
    return true;
  }

  advanceFrame(): void {
    this.advance(COMBAT_FRAME_INTERVAL, COMBAT_FRAME_INTERVAL);
  }

  #createTimeline(state?: SkillRuntimeState['timeline']) {
    return this.#sequenceRuntime.createTimeline(
      this.#program.timelineActions,
      {
        started: action => this.record('TimelineActionStarted', { startFrame: action.startFrame }),
        ended: action => this.record('TimelineActionEnded', { startFrame: action.startFrame }),
      },
      state ?? undefined,
    );
  }

  /** 低层显式增量入口，单位秒；AbilitySystem 分派负责施放当帧保护及共享冷却。 */
  advance(timelineDeltaSeconds: number, cooldownDeltaSeconds: number): void {
    advanceSkillExecution(
      this.#execution,
      this.#program.naturalDurationFrames,
      this.#advancesCooldown,
      timelineDeltaSeconds,
      cooldownDeltaSeconds,
      {
        advanceCooldown: delta => this.#cooldown.advance(delta),
        cooldownReady: () => this.record('SkillCooldownReady'),
        tick: delta => this.#tick(delta),
        timelineComplete: () => this.#timeline?.isComplete === true,
        end: () => this.end(),
      },
    );
  }

  end(): void {
    if (this.#execution.state !== 'casting') return;
    const attachedAtEnd = this.#captureAttachedBuffs();
    endSkillExecution(this.#execution, {
      endTimeline: frame => this.#timeline?.end(frame, this.#context),
      finishAttached: () => this.#finishAttachedBuffs(attachedAtEnd),
      finishCooldown: () => this.#cooldown.finishCast(),
      cooldownRefunded: () => this.record('SkillCooldownRefunded'),
      recordEnded: () => this.record('SkillEnded'),
      emitEnded: () => this.#emitSkillEnd(),
    });
  }

  interrupt(reason: RuntimeSkillInterruptReason, transition?: RuntimeSkillTransition): void {
    if (this.#execution.state !== 'casting') return;
    this.#pendingTransition = transition ?? null;
    const attachedAtEnd = this.#captureAttachedBuffs();
    try {
      endSkillExecution(this.#execution, {
        endTimeline: frame => this.#timeline?.end(frame, this.#context),
        finishAttached: () => this.#finishAttachedBuffs(attachedAtEnd),
        finishCooldown: () => this.#cooldown.finishCast(),
        cooldownRefunded: () => this.record('SkillCooldownRefunded'),
        recordEnded: () => this.record('SkillInterrupted', { reason }),
        emitEnded: () => this.#emitSkillEnd(),
      });
    } finally {
      this.#pendingTransition = null;
    }
  }

  createSequence(sequence: ResolvedActionSequence): ActionSequence {
    return this.#sequenceRuntime.createSequence(sequence);
  }

  /**
   * 复现原生 DoOnceAction：内部序列无论返回真假，当前释放实例后续都不再重复执行。
   * 作用域在下一次 tryStart 时统一清空，不能放进跨释放共享的实体黑板。
   */
  tryExecuteOnce(
    scopeKey: string,
    body: ResolvedActionSequence,
    context: CombatExecutionContext,
  ): boolean {
    return this.#sequenceRuntime.tryExecuteOnce(scopeKey, body, context);
  }

  record(
    event: string,
    data?: Readonly<Record<string, boolean | number | string | null>>,
    targetId?: string,
    producedBy?: import('../receipt/combatReceipt').CombatObjectRef,
  ): void {
    this.#dependencies.receipt.record({
      frame: this.#dependencies.clock.frame,
      time: this.#dependencies.clock.time,
      event,
      sourceId: this.#hostIdentity.eventSourceId,
      ...(producedBy === undefined ? {} : { producedBy }),
      ...(targetId === undefined ? {} : { targetId }),
      data: {
        skillId: this.#program.skillId,
        ...(this.castId === undefined ? {} : { castId: this.castId }),
        ...data,
      },
    });
  }

  #tick(deltaTime: number): void {
    tickSkillExecution(this.#execution, this.#program.costFrame, deltaTime, {
      applyCost: () => {
        this.#applyCost(true);
      },
      tickTimeline: (frame, delta) => this.#timeline?.tick(frame, delta, this.#context),
    });
  }

  #resolvedCosts(
    preparation = this.#dependencies.clock.frame < 0,
  ): readonly CompiledSkillExecutionProgram['costs'][number][] {
    const costs = this.#dependencies.resolveCosts?.(this.#program.costs) ?? this.#program.costs;
    // Endaxis 准备期技能免技力费用；终结技能量与技能自身资源效果仍按定义执行。
    return preparation ? costs.filter(cost => cost.resource !== 'sp') : costs;
  }

  #requireNoResourceCost(costs: CompiledSkillExecutionProgram['costs']): void {
    if (costs.some(cost => cost.value !== 0))
      throw new Error(`skill '${this.skillId}' has a nonzero cost but no resource account`);
  }

  #canPay(costs: CompiledSkillExecutionProgram['costs']): boolean {
    if (this.#dependencies.resources !== null)
      return this.#dependencies.resources.canPay(this.#hostIdentity.actionOwnerId, costs);
    this.#requireNoResourceCost(costs);
    return true;
  }

  #applyCost(emitSkillEvent: boolean): boolean {
    const costs = this.#resolvedCosts(this.#execution.preparationCast);
    if (this.#dependencies.resources === null) this.#requireNoResourceCost(costs);
    const payment =
      this.#dependencies.resources === null
        ? { paid: true, nonReturnedSpCost: 0, changes: [] }
        : this.#dependencies.resources.pay(this.#hostIdentity.actionOwnerId, costs, {
            forceTimelinePayment: this.#execution.forceTimelinePayment,
          });
    if (!payment.paid) {
      this.record('SkillCostRejected');
      return false;
    }
    this.#execution.appliedCost = true;
    this.#execution.nonReturnedSpCost = payment.nonReturnedSpCost;
    for (const change of payment.changes) {
      if (change.resource === 'sp') {
        this.record('SpChanged', {
          recipient: 'team',
          baseValue: change.baseValue,
          requestedValue: change.requestedValue,
          actualValue: change.actualValue,
          previousValue: change.previousValue,
          currentValue: change.currentValue,
        });
      } else {
        this.record(
          'UltimateEnergyChanged',
          {
            recipient: 'operator',
            baseValue: change.baseValue,
            requestedValue: change.requestedValue,
            applied: change.applied,
            actualValue: change.actualValue,
            previousValue: change.previousValue,
            currentValue: change.currentValue,
          },
          change.operatorId,
        );
      }
    }
    this.record('SkillCostApplied', {
      nonReturnedSpCost: payment.nonReturnedSpCost,
      ...(this.#dependencies.resources === null
        ? {}
        : {
            remainingSp: this.#dependencies.resources.sp,
            remainingUltimateEnergy: this.#dependencies.resources.getUltimateEnergy(
              this.#hostIdentity.actionOwnerId,
            ),
          }),
    });
    if (emitSkillEvent) this.#dependencies.emitAfterSkillApplyCost?.(this.#skillEventPayload());
    return true;
  }

  #requestTimelineJump(destinationFrame: number): void {
    if (this.#timelineJump.isExecuting) return;
    const timeline = this.#timeline;
    if (timeline === null || this.#execution.state !== 'casting') {
      throw new Error(`skill '${this.#program.skillId}' cannot jump outside an active cast`);
    }
    this.#timelineJump.execute(
      destinationFrame,
      this.#execution.passedFrames,
      this.#program.naturalDurationFrames,
      () => {
        // 原生允许 epsilon 内的微小回拨；它不会重新执行已过的调度项。
        timeline.jumpTo(
          destinationFrame,
          Math.min(destinationFrame, this.#execution.passedFrames),
          this.#context,
        );
        this.#execution.passedFrames = destinationFrame;
        this.record('SkillTimelineJumped', { destinationFrame });
      },
      () => this.end(),
    );
  }

  #requestTimelineFinish(): void {
    const timeline = this.#timeline;
    if (timeline === null || this.#execution.state !== 'casting') {
      throw new Error(`skill '${this.#program.skillId}' cannot finish outside an active cast`);
    }
    timeline.finish(this.#execution.passedFrames, this.#context);
    this.#execution.timelineFinishRequested = true;
    this.record('SkillTimelineFinished');
  }

  #reachSkillOperableBoundary(skillIds: readonly string[]): void {
    if (this.#execution.reachedOperableBoundaryFrame !== undefined) return;
    const frame = this.currentTimelineFrame;
    if (this.#execution.operableBoundaryCandidateFrame !== frame) {
      this.#execution.operableBoundaryCandidateFrame = frame;
      this.#execution.operableBoundaryCandidateSkillIds.length = 0;
    }
    for (const skillId of skillIds) {
      if (!this.#execution.operableBoundaryCandidateSkillIds.includes(skillId)) {
        this.#execution.operableBoundaryCandidateSkillIds.push(skillId);
      }
    }
  }

  #emitSkillEnd(): void {
    this.#dependencies.emitSkillEnd?.(this.#skillEventPayload());
  }

  #finishAttachedBuffs(
    attachedAtEnd: readonly (readonly [string, BuffApplicationHandle | null])[],
  ): void {
    // CastEnd 在 OnSkillEnd 之前正序 MarkFinish(Other)，不传入结束来源/施法信息。
    for (const [, buff] of attachedAtEnd) {
      if (buff !== null && !buff.isRecycled) buff.finish('other', null);
    }
    // CastEnd 在时间轴清理前取快照；清理中新增的实例不属于本次移除集合。
    for (const [key] of attachedAtEnd) {
      this.#execution.attachedBuffs.delete(key);
      this.#attachedBuffBindings.delete(key);
    }
  }

  #captureAttachedBuffs(): readonly (readonly [string, BuffApplicationHandle | null])[] {
    return [...this.#execution.attachedBuffs.keys()].map(key => {
      const buff = this.#attachedBuffBindings.get(key);
      if (buff === undefined) throw new Error(`attached Buff binding ${key} is missing`);
      return [key, buff] as const;
    });
  }

  #skillEventPayload(): AbilitySkillPayload {
    return {
      sourceId: this.#hostIdentity.eventSourceId,
      targetId: this.#hostIdentity.eventSourceId,
      skillType: this.#program.skillType,
      skillId: this.#program.executionSkillId ?? this.#program.skillId,
      skillCastId: this.#execution.skillCastId,
    };
  }
}

function roundToEven(value: number): number {
  const lower = Math.floor(value);
  const fraction = value - lower;
  if (fraction < 0.5) return lower;
  if (fraction > 0.5) return lower + 1;
  return lower % 2 === 0 ? lower : lower + 1;
}
