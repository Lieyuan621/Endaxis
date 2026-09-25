/**
 * 干员能力、技能和常驻事件来源的可变数据。
 *
 * 本文件按“事件宿主 → 技能选择 → 单次技能执行 → 常驻来源”组织。它只保存恢复所需的数据；
 * 编译后的技能程序、事件处理函数和运行时端口仍由对应运行时模块持有。
 */
import {
  type SkillCastEventData,
  type AbilityEventSubscriptionReference,
  type BuffReference,
  type CombatSkillCastInfo,
  type PostSkillCastRequest,
  type SkillCastStartPreparation,
  type ActionBlackboardState,
  type AppliedDamageModifier,
  type CombatObjectRef,
} from './foundationState';
import { type ActionBlackboardValue } from '../../../../packages/game-data-contract/src/primitives';
import { type NativeSkillType, type PlayerSkillInput } from '../../game-data/operatorDefinition';
import {
  type ActionSequenceState,
  type TimelineRuntimeState,
  createCombatOperationHostState,
  type ActionScopeState,
  type CombatOperationHostState,
} from './actionState';
import { type PeriodicTimerState } from './environmentState';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';

export interface DamageCalculationSnapshot {
  readonly attackModifiers?: readonly AppliedDamageModifier[];
  readonly attackDetail?: import('./foundationState').AttackReceiptSnapshot;
  readonly attack: number;
  readonly attackScale: number;
  readonly baseValue: number;
}

export type DamageCalculationSnapshotState = Map<number, DamageCalculationSnapshot>;

/** 当前释放已经建立的命名目标组。 */
export interface RuntimeTargetContextState {
  readonly groups: Map<string, import('../../game-data/logicalAbilityEntity').RuntimeTargetGroup>;
}

export function createRuntimeTargetContextState(): RuntimeTargetContextState {
  return { groups: new Map() };
}

export interface SkillOperableBoundaryFact {
  readonly castId: string;
  readonly durationFrames: number;
  readonly reachedAtFrame: number;
}

export type CenterStateKind = 'free' | 'attack' | 'skill' | 'dash';

/**
 * 原生 CenterStateMachine 中由玩家移动/技能输入共同维护的可恢复状态。
 * 专属 Dodge 仍是普通技能实例；perfectDodgeActive 只说明当前处于该技能阶段。
 */
export interface OperatorCenterState {
  state: CenterStateKind;
  dashId: string | null;
  direction: 'forward' | 'backward';
  /** 当前 Dash 的原生攻击窗口数值是否已有可靠证据。 */
  dashTimingKnown: boolean;
  attackBlockRemainingFrames: number;
  attackAllowRemainingFrames: number;
  perfectDodgeDashBlockRemainingFrames: number;
  perfectDodgeActive: boolean;
  perfectDodgeConsumed: boolean;
  /** 已提交原生成功事件、等待隐藏技能实际启动的标签；不能用后来 Dash 的身份替换。 */
  pendingPerfectDodgeId: string | null;
  readonly dashBuffReferences: BuffReference[];
}

export function createOperatorCenterState(): OperatorCenterState {
  return {
    state: 'free',
    dashId: null,
    direction: 'forward',
    dashTimingKnown: false,
    attackBlockRemainingFrames: 0,
    attackAllowRemainingFrames: 0,
    perfectDodgeDashBlockRemainingFrames: 0,
    perfectDodgeActive: false,
    perfectDodgeConsumed: false,
    pendingPerfectDodgeId: null,
    dashBuffReferences: [],
  };
}

export interface PendingSkillOperableBoundary {
  readonly castId: string;
  readonly durationFrames: number;
  readonly actualStartFrame: number;
  accumulatedFrames: number;
}

/** 待到达的技能显示边界和已经登记过的施放身份。 */
export interface SkillOperableBoundaryState {
  readonly pendingByCastId: Map<string, PendingSkillOperableBoundary>;
  readonly registeredCastIds: Set<string>;
}

export function createSkillOperableBoundaryState(): SkillOperableBoundaryState {
  return { pendingByCastId: new Map(), registeredCastIds: new Set() };
}

/** 被动、装备和养成 Ability 共用的事件订阅与子 Buff 账本。 */
export interface AbilityEventHostState {
  enabled: boolean;
  disposed: boolean;
  readonly registrations: AbilityEventSubscriptionReference[][];
  readonly childBuffs: BuffReference[];
}

export function createAbilityEventHostState(): AbilityEventHostState {
  return { enabled: false, disposed: false, registrations: [], childBuffs: [] };
}

/** 等待真正施放时发布的事件数据，以及 Buff 附着所用的原始技能寻址方式。 */
export interface BeforeSkillCastPreparation {
  readonly skillId: string;
  readonly castId: string | undefined;
  readonly resolveSkillSlot: boolean;
  readonly payload: SkillCastEventData;
}

export interface AbilitySkillSlotState {
  readonly baseSkillKey: string;
  readonly input: PlayerSkillInput;
  readonly defaultForInput: boolean;
  readonly stableInputSkillKeys: ReadonlySet<string>;
  readonly allowedSkillKeys: ReadonlySet<string>;
  currentSkillKey: string;
}

/** ComboController 唯一的连段偏移包；只保存可恢复数据，映射效果由 AbilitySystem 即时解释。 */
export interface ComboOffsetModifierState {
  readonly trigger: 'dash' | 'skill' | 'jump';
  readonly triggerSkillKey: string | null;
  readonly targetSkillKey: string;
  remainingFrames: number;
  reduceDuration: boolean;
  skillCasted: boolean;
}

/** 单个干员的技能选择、形态切换和延迟施放数据。 */
export interface AbilitySystemState {
  readonly skillSlotReplacements: Map<
    string,
    {
      readonly registrationId: number;
      readonly revertedSkillKey: string;
      readonly inheritOriginSkillCooldownProgress: boolean;
    }
  >;
  nextSkillSlotReplacementId: number;
  readonly playerActionModeActivations: Map<
    number,
    {
      readonly layer: string;
      readonly modeId: string;
      readonly previousModeId: string | null;
    }
  >;
  nextPlayerActionModeActivationId: number;
  readonly beforeCastStarts: Map<string, BeforeSkillCastPreparation>;
  readonly operableBoundaries: SkillOperableBoundaryState;
  readonly nativeSkillTypeBySkillId: Map<string, NativeSkillType>;
  readonly skillSlotGroups: Map<string, AbilitySkillSlotState>;
  readonly activePlayerActionModeByLayer: Map<string, string>;
  readonly registeredOperableBoundaryCastIds: Set<string>;
  readonly buffBasicAttackMappings: Map<number, string>;
  nextBasicAttackMappingId: number;
  /** 当前动作寿命内的连续 Dash 次数覆盖；null 使用原生默认值 2。 */
  overrideMultiDashLimit: number | null;
  /** 最近一次技能开始或普攻 offsetRecordFrame 提交的后继身份。 */
  comboOffsetTargetSkillKey: string | null;
  comboOffsetModifier: ComboOffsetModifierState | null;
  /** 已执行 offsetRecordFrame 提交的当前施放身份，防止每帧重复刷新。 */
  comboOffsetRecordedSkillKey: string | null;
  currentSkillKey: string | null;
  processingSkillKey: string | null;
  postSkillCastRequest: PostSkillCastRequest | null;
}

export function createAbilitySystemState(): AbilitySystemState {
  return {
    skillSlotReplacements: new Map(),
    nextSkillSlotReplacementId: 0,
    playerActionModeActivations: new Map(),
    nextPlayerActionModeActivationId: 0,
    beforeCastStarts: new Map(),
    operableBoundaries: createSkillOperableBoundaryState(),
    nativeSkillTypeBySkillId: new Map(),
    skillSlotGroups: new Map(),
    activePlayerActionModeByLayer: new Map(),
    registeredOperableBoundaryCastIds: new Set(),
    buffBasicAttackMappings: new Map(),
    nextBasicAttackMappingId: 0,
    overrideMultiDashLimit: null,
    comboOffsetTargetSkillKey: null,
    comboOffsetModifier: null,
    comboOffsetRecordedSkillKey: null,
    currentSkillKey: null,
    processingSkillKey: null,
    postSkillCastRequest: null,
  };
}

/** 一项共享冷却的当前计时和本次施放预占事实。 */
export interface SkillCooldownState {
  readonly timer: PeriodicTimerState | undefined;
  reservedByCurrentCast: boolean;
}

/** 投影与合法性诊断读取的冷却事实。 */
export interface SkillCooldownSnapshot {
  readonly configured: boolean;
  readonly ready: boolean;
  readonly remainingFrames: number;
  readonly progress: number;
}

/** 冷却固定配置；动态倍率在实际预占时读取。 */
export interface SkillCooldownProgram {
  readonly periodFrames: number;
  readonly commitFrame?: number;
}

export type RuntimeSkillState = 'ready' | 'casting' | 'ended';

/** 一次技能宿主的施放进度、输入准备和扣费事实。 */
export interface SkillExecutionState {
  readonly targetContext: RuntimeTargetContextState;
  preparedCastStart: SkillCastStartPreparation | undefined;
  readonly attachedBuffs: Map<string, BuffReference>;
  state: RuntimeSkillState;
  passedFrames: number;
  castStartFrame: number | undefined;
  appliedCost: boolean;
  attemptedCost: boolean;
  nonReturnedSpCost: number;
  skillCastId: number;
  preparedSkillCastId: number;
  preparedSkillCastInfo: CombatSkillCastInfo | undefined;
  /** 本次延迟施放请求的产生者；开始回执记录后清除。 */
  preparedProducer: CombatObjectRef | undefined;
  inheritedSkillCastInfo: CombatSkillCastInfo | undefined;
  preparedSkipApplyCost: boolean;
  /** 下一次施放的目标与本次施放的目标分开保存，避免准备输入改变当前技能。 */
  preparedInputTarget: RuntimeTargetRef | null | undefined;
  inputTarget: RuntimeTargetRef | null | undefined;
  preparedForceTimelinePayment: boolean;
  forceTimelinePayment: boolean;
  preparationCast: boolean;
  timelineFinishRequested: boolean;
  reachedOperableBoundaryFrame: number | undefined;
  /** 本帧实际执行的 AllowNextSkillAction 所公开的候选；AbilitySystem 在技能 Tick 后解释玩家路由。 */
  operableBoundaryCandidateFrame: number | undefined;
  readonly operableBoundaryCandidateSkillIds: string[];
  preparedStartBlackboard: Readonly<Record<string, number>>;
}

export function createSkillExecutionState(): SkillExecutionState {
  return {
    targetContext: createRuntimeTargetContextState(),
    preparedCastStart: undefined,
    attachedBuffs: new Map(),
    state: 'ready',
    passedFrames: 0,
    castStartFrame: undefined,
    appliedCost: false,
    attemptedCost: false,
    nonReturnedSpCost: 0,
    skillCastId: 0,
    preparedSkillCastId: 0,
    preparedSkillCastInfo: undefined,
    preparedProducer: undefined,
    inheritedSkillCastInfo: undefined,
    preparedSkipApplyCost: false,
    preparedInputTarget: undefined,
    inputTarget: undefined,
    preparedForceTimelinePayment: false,
    forceTimelinePayment: false,
    preparationCast: false,
    timelineFinishRequested: false,
    reachedOperableBoundaryFrame: undefined,
    operableBoundaryCandidateFrame: undefined,
    operableBoundaryCandidateSkillIds: [],
    preparedStartBlackboard: {},
  };
}

/** 一个技能宿主已经接入的完整数据。 */
export interface SkillRuntimeState {
  readonly castId: string | null;
  /** 当前这次施放是否已经执行原生 MarkCanDash；新一次施放会清零。 */
  markedCanDash: boolean;
  /** 本次施放已执行 MarkCanInterrupt；新一次施放清零。 */
  markedCanInterrupt: boolean;
  readonly execution: SkillExecutionState;
  readonly blackboard: ActionBlackboardState;
  readonly initialBlackboard: Readonly<Record<string, ActionBlackboardValue>>;
  readonly cooldown: SkillCooldownState;
  readonly scopes: ActionScopeState;
  readonly damageSnapshots: DamageCalculationSnapshotState;
  readonly operations: CombatOperationHostState;
  timeline: TimelineRuntimeState | null;
}

/** 投射物回调技能的数据；两个字段一起复制以保留内部共享关系。 */
export interface CallbackSkillHostState {
  readonly skill: SkillRuntimeState;
  readonly ability: AbilitySystemState;
}

/** 能力实体的一次子技能执行数据。 */
export interface AbilityEntityChildSkillState {
  readonly programId: number;
  readonly skillId: string;
  readonly host: CallbackSkillHostState;
}

/** 一条常驻连携条件的数据。 */
export interface ComboSkillConditionState {
  readonly blackboard: ActionBlackboardState;
  readonly operations: CombatOperationHostState;
}

export interface EquipmentEventHandlerState {
  readonly key: string;
  readonly sequence: ActionSequenceState;
}

export interface EquipmentContributionEventState {
  readonly blackboard: ActionBlackboardState;
  readonly host: AbilityEventHostState;
  readonly responses: EquipmentEventHandlerState[];
}

/** 一名干员全部装备贡献的事件状态。 */
export interface EquipmentEventState {
  readonly contributions: Map<number, EquipmentContributionEventState>;
}

export function createEquipmentEventState(): EquipmentEventState {
  return { contributions: new Map() };
}

export function createEquipmentContributionEventState(
  blackboard: ActionBlackboardState,
): EquipmentContributionEventState {
  return { blackboard, host: createAbilityEventHostState(), responses: [] };
}

/** 一条干员养成或装备初始化程序的数据。 */
export interface OperatorInitializationState {
  readonly key: string;
  readonly equipmentContributionIndex?: number;
  readonly blackboard: ActionBlackboardState;
  readonly operations: CombatOperationHostState;
  readonly enableSequence: ActionSequenceState | null;
  readonly initializationSequence: ActionSequenceState;
  initializationExecuted: boolean;
}

export interface OperatorUpgradeEventProgramState {
  readonly key: string;
  readonly subscriptions: readonly AbilityEventSubscriptionReference[];
}

/** 干员养成事件监听的稳定订阅身份。 */
export interface OperatorUpgradeEventState {
  readonly programs: OperatorUpgradeEventProgramState[];
}

export function createOperatorUpgradeEventState(): OperatorUpgradeEventState {
  return { programs: [] };
}

/** 一个原生被动 Ability 的事件响应进度。 */
export interface PassiveAbilityEventState {
  readonly host: AbilityEventHostState;
  readonly blackboard: ActionBlackboardState;
  readonly operations: CombatOperationHostState;
  enableSequence: ActionSequenceState | null;
  readonly responses: ActionSequenceState[];
}

export function createPassiveAbilityEventState(
  blackboard: ActionBlackboardState,
  operations: CombatOperationHostState = createCombatOperationHostState(),
): PassiveAbilityEventState {
  return {
    host: createAbilityEventHostState(),
    blackboard,
    operations,
    enableSequence: null,
    responses: [],
  };
}
