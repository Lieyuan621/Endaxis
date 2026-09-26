/**
 * 动作执行层的可变数据。
 *
 * 本文件只定义黑板、动作作用域、动作进度和动作产生的句柄账本。动作程序、执行器和回调
 * 不属于切面数据，恢复时由运行时重新绑定。放在同一文件内可以直接看清一个动作宿主保存
 * 的完整数据，而不必在十个只有少量字段的文件之间跳转。
 */
import {
  type ActionBlackboardState,
  type GlobalBuffInstanceState,
  type BuffReference,
  type AbilityEventSubscriptionReference,
} from './foundationState';
import { type RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { type SkillCastInheritanceRegistration } from './environmentState';

/** 一个技能或 Buff 动作宿主的作用域数据。 */
export interface ActionScopeState {
  nextGraphInvocationId: number;
  readonly executedOnce: Set<string>;
  readonly blackboards: Map<ActionBlackboardState, Map<string, ActionBlackboardState>>;
}

export function createActionScopeState(): ActionScopeState {
  return { executedOnce: new Set(), blackboards: new Map(), nextGraphInvocationId: 1 };
}

/** 分支动作当前选中的程序下标；null 表示尚未选择。 */
export interface BranchActionState {
  activeBranch: number | null;
}

export function createBranchActionState(): BranchActionState {
  return { activeBranch: null };
}

/** 重复动作的计时和触发次数。 */
export interface RepeatedActionState {
  skipInitialTick: boolean;
  timerSeconds: number;
  scanCount: number;
  targetTriggerCount: number;
  lastTargetTriggerSeconds: number;
  /** ExecuteInterval 当前保留的子序列；切面只保存数据，恢复后重新绑定执行器。 */
  body: ActionSequenceState | null;
}

export function createRepeatedActionState(): RepeatedActionState {
  return {
    skipInitialTick: false,
    timerSeconds: 0,
    scanCount: 0,
    targetTriggerCount: 0,
    lastTargetTriggerSeconds: 0,
    body: null,
  };
}

/** 目标循环当前运行的子序列和目标。 */
export interface TargetLoopState<Execution = ActionSequenceState> {
  readonly activeBodies: number[];
  readonly bodies: Map<number, { readonly target: RuntimeTargetRef; readonly sequence: Execution }>;
  nextBodyId: number;
}

export function createTargetLoopState<
  Execution = ActionSequenceState,
>(): TargetLoopState<Execution> {
  return { activeBodies: [], bodies: new Map(), nextBodyId: 1 };
}

/** 时间轴跳转动作的执行进度。 */
export interface TimelineJumpState {
  jumped: boolean;
  skipInitialTick: boolean;
}

export function createTimelineJumpState(): TimelineJumpState {
  return { jumped: false, skipInitialTick: false };
}

/** 动作结束时要停止的膨胀实例，以及要恢复的实体忽略设置。 */
export interface TimeDilationActionState {
  readonly instanceIds: Map<number, readonly number[]>;
  readonly ignoredEntityIds: Map<number, readonly string[]>;
}

export function createTimeDilationActionState(): TimeDilationActionState {
  return { instanceIds: new Map(), ignoredEntityIds: new Map() };
}

/** 动作持续期内创建的全局 Buff。 */
export interface GlobalBuffActionState {
  readonly active: Map<number, readonly GlobalBuffInstanceState[]>;
}

export function createGlobalBuffActionState(): GlobalBuffActionState {
  return { active: new Map() };
}

export interface AbilityEntityActionState {
  readonly actionDurationEntities: Map<number, readonly RuntimeTargetRef[]>;
}

export interface SkillResourceActionState {
  readonly ultimateRecoveryRestrictionHandles: Map<number, number>;
}

export interface TimedMarkerActionReference {
  readonly ownerId: string;
  readonly sourceTargetId: string;
}

export interface TimedMarkerActionState {
  readonly markers: Map<number, readonly TimedMarkerActionReference[]>;
}

export interface ComboWindowActionState {
  readonly ringQteRegistrations: Map<number, Map<ActionBlackboardState, number>>;
}

export interface HealthFloorActionReference {
  readonly entityId: string;
  readonly handle: number;
}

export interface ActionBlackboardActionState {
  readonly healthFloors: Map<number, HealthFloorActionReference>;
}

export interface SkillCastInheritanceActionState {
  readonly registrations: Map<number, SkillCastInheritanceRegistration>;
}

/** 一个动作宿主在步骤开始与结束之间持有的全部句柄和实例账本。 */
export interface CombatOperationHostState {
  readonly abilityEntities: AbilityEntityActionState;
  readonly resources: SkillResourceActionState;
  readonly timedMarkers: TimedMarkerActionState;
  readonly comboWindows: ComboWindowActionState;
  readonly actionBlackboard: ActionBlackboardActionState;
  readonly skillCastInheritance: SkillCastInheritanceActionState;
  readonly timeDilation: TimeDilationActionState;
  readonly globalBuffs: GlobalBuffActionState;
}

export function createCombatOperationHostState(): CombatOperationHostState {
  return {
    abilityEntities: { actionDurationEntities: new Map() },
    resources: { ultimateRecoveryRestrictionHandles: new Map() },
    timedMarkers: { markers: new Map() },
    comboWindows: { ringQteRegistrations: new Map() },
    actionBlackboard: { healthFloors: new Map() },
    skillCastInheritance: { registrations: new Map() },
    timeDilation: createTimeDilationActionState(),
    globalBuffs: createGlobalBuffActionState(),
  };
}

export const COMBAT_STEP_STATE = {
  pending: 'pending',
  started: 'started',
  ticking: 'ticking',
  ended: 'ended',
} as const;

/** 步骤尚未开始、已经进入、正在持续执行或已经结束。 */
export type CombatStepState = (typeof COMBAT_STEP_STATE)[keyof typeof COMBAT_STEP_STATE];

/** 执行结果决定是否继续 Tick，进入时的许可决定是否调用 End。 */
export interface ActionStepState {
  state: CombatStepState;
  executeResult: boolean;
  executionPermitted: boolean;
}

export type ActionSequenceState = ActionGraphExecutionState;

/** 一个图入口的执行数据；程序在切面外共享，节点数据只在到达或 Reset 时建立。 */
export interface ActionGraphExecutionState {
  readonly revision: string;
  readonly entry: string | null;
  /** 当前宿主内的调用实例身份；分配器随宿主切面保存，恢复复用此身份。 */
  readonly invocation: string;
  /** 静态调用位置，与逐目标等动态调用实例分开；缺省 once/父层黑板身份取此值。 */
  readonly callSite: string;
  closed: boolean;
  readonly nodes: Map<
    string,
    {
      readonly lifecycle: ActionStepState;
      readonly data: ActionGraphNodeData;
    }
  >;
}

/** 图控制状态中的子项是实际调用帧，不包含子程序定义或执行器。 */
export type ActionGraphNodeData =
  | { readonly kind: 'graphMacro'; body: ActionGraphExecutionState | null }
  | {
      readonly kind: 'graphListener';
      readonly listener: CombatEventListenerState<ActionGraphExecutionState>;
    }
  | { readonly kind: 'graphTargets'; readonly loop: TargetLoopState<ActionGraphExecutionState> }
  | GraphLeafStepData
  | { readonly kind: 'repeat'; readonly repetition: RepeatedActionState }
  | {
      readonly kind: 'graphScope';
      body: {
        readonly blackboard: ActionBlackboardState;
        readonly execution: ActionGraphExecutionState;
      } | null;
    }
  | {
      readonly kind: 'graphBranch';
      readonly selection: BranchActionState;
      readonly branches: Map<number, ActionGraphExecutionState>;
    }
  | { readonly kind: 'graphGuard'; body: ActionGraphExecutionState | null };

/** 当前动作持有的登记。结束动作时按编号解除，不保存回调。 */
export interface ActionRegistrationState {
  registrationId: number | null;
}

/** 动作负责结束或转交的 Buff；对象句柄由当前分支按引用重新解析。 */
export interface ActionBuffReferencesState {
  active: boolean;
  readonly references: BuffReference[];
}

/** 叶子操作的登记与句柄数据，图执行器按调用实例持有，不含子程序状态。 */
export type OperationStepData =
  | { readonly kind: 'playerActionMode'; readonly activation: ActionRegistrationState }
  | { readonly kind: 'basicAttackMapping'; readonly activation: ActionRegistrationState }
  | { readonly kind: 'multiDashLimit'; readonly activation: ActionRegistrationState }
  | { readonly kind: 'skillSlotReplacement'; readonly activation: ActionRegistrationState }
  | { readonly kind: 'skillAffix'; readonly activation: ActionRegistrationState }
  | { readonly kind: 'actionDurationBuffs'; readonly buffs: ActionBuffReferencesState }
  | { readonly kind: 'inheritedBuff'; readonly buffs: ActionBuffReferencesState }
  | { readonly kind: 'buffHold'; readonly buffs: ActionBuffReferencesState }
  | { readonly kind: 'stateless' };

export type GraphLeafStepData =
  OperationStepData | { readonly kind: 'jump'; readonly jump: TimelineJumpState };

export type ActionStepData =
  | GraphLeafStepData
  | { readonly kind: 'graph'; readonly graph: ActionGraphExecutionState }
  | { readonly kind: 'repeat'; readonly repetition: RepeatedActionState };

/**
 * 时间轴调度进度。活动项与进入中的项只保存程序数组下标，不保存动作对象。
 * starting 相关字段用于同步跳转和中断；它们不允许作为帧中保存入口。
 */
export interface TimelineActionState {
  readonly active: number[];
  nextPendingIndex: number;
  starting: number | null;
  startingCrossedByJump: boolean;
  startingJumpDestination: number | null;
  ended: boolean;
}

export function createTimelineActionState(): TimelineActionState {
  return {
    active: [],
    nextPendingIndex: 0,
    starting: null,
    startingCrossedByJump: false,
    startingJumpDestination: null,
    ended: false,
  };
}

/** 调度器和按开始帧排序的序列数据；未迁移步骤仍会拒绝恢复绑定。 */
export interface TimelineRuntimeState<Execution = ActionSequenceState> {
  readonly scheduling: ReturnType<typeof createTimelineActionState>;
  readonly sequences: readonly Execution[];
}

/** 监听动作已安装的响应序列和稳定订阅引用。 */
export interface CombatEventListenerState<Execution = ActionSequenceState> {
  readonly responses: {
    readonly sequence: Execution;
    readonly subscriptions: readonly AbilityEventSubscriptionReference[];
  }[];
}
