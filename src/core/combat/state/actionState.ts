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

/** 黑板作用域动作当前创建的子序列；尚未执行或已经重置时 body 为 null。 */
export interface ActionBlackboardScopeState {
  body: {
    readonly blackboard: ActionBlackboardState;
    readonly sequence: ActionSequenceState;
  } | null;
}

/** 一个技能或 Buff 动作宿主的作用域数据。 */
export interface ActionScopeState {
  readonly executedOnce: Set<string>;
  readonly blackboards: Map<ActionBlackboardState, Map<string, ActionBlackboardState>>;
}

export function createActionScopeState(): ActionScopeState {
  return { executedOnce: new Set(), blackboards: new Map() };
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
}

export function createRepeatedActionState(): RepeatedActionState {
  return {
    skipInitialTick: false,
    timerSeconds: 0,
    scanCount: 0,
    targetTriggerCount: 0,
    lastTargetTriggerSeconds: 0,
  };
}

/** 目标循环当前运行的子序列和目标。 */
export interface TargetLoopState {
  readonly activeBodies: number[];
  readonly bodies: Map<
    number,
    { readonly target: RuntimeTargetRef; readonly sequence: ActionSequenceState }
  >;
  nextBodyId: number;
}

export function createTargetLoopState(): TargetLoopState {
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

/** 数组顺序与不可变程序中的步骤顺序一致，不持有步骤对象。 */
export interface ActionSequenceState {
  readonly entries: ActionStepState[];
  /** 与 entries 同下标；保存实际步骤数据的引用，不复制一份镜像。 */
  readonly steps: (ActionStepData | null)[];
}

export function createActionSequenceState(stepCount: number): ActionSequenceState {
  return {
    steps: Array.from({ length: stepCount }, () => null),
    entries: Array.from({ length: stepCount }, () => ({
      state: COMBAT_STEP_STATE.pending,
      executeResult: false,
      executionPermitted: false,
    })),
  };
}

/** 当前动作持有的登记。结束动作时按编号解除，不保存回调。 */
export interface ActionRegistrationState {
  registrationId: number | null;
}

/** 动作负责结束或转交的 Buff；对象句柄由当前分支按引用重新解析。 */
export interface ActionBuffReferencesState {
  active: boolean;
  readonly references: BuffReference[];
}

export type ActionStepData =
  | { readonly kind: 'playerActionMode'; readonly activation: ActionRegistrationState }
  | { readonly kind: 'basicAttackMapping'; readonly activation: ActionRegistrationState }
  | { readonly kind: 'multiDashLimit'; readonly activation: ActionRegistrationState }
  | { readonly kind: 'skillSlotReplacement'; readonly activation: ActionRegistrationState }
  | { readonly kind: 'skillAffix'; readonly activation: ActionRegistrationState }
  | { readonly kind: 'actionDurationBuffs'; readonly buffs: ActionBuffReferencesState }
  | { readonly kind: 'inheritedBuff'; readonly buffs: ActionBuffReferencesState }
  | { readonly kind: 'buffHold'; readonly buffs: ActionBuffReferencesState }
  | { readonly kind: 'stateless' }
  | { readonly kind: 'sequence'; readonly sequence: ActionSequenceState }
  | {
      readonly kind: 'branch';
      readonly selection: BranchActionState;
      readonly branches: readonly ActionSequenceState[];
    }
  | { readonly kind: 'repeat'; readonly repetition: RepeatedActionState }
  | { readonly kind: 'targets'; readonly loop: TargetLoopState }
  | { readonly kind: 'blackboardScope'; readonly scope: ActionBlackboardScopeState }
  | { readonly kind: 'listener'; readonly listener: CombatEventListenerState }
  | { readonly kind: 'jump'; readonly jump: TimelineJumpState };

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
export interface TimelineRuntimeState {
  readonly scheduling: ReturnType<typeof createTimelineActionState>;
  readonly sequences: readonly ActionSequenceState[];
}

/** 监听动作已安装的响应序列和稳定订阅引用。 */
export interface CombatEventListenerState {
  readonly responses: {
    readonly sequence: ActionSequenceState;
    readonly subscriptions: readonly AbilityEventSubscriptionReference[];
  }[];
}
