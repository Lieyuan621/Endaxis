/**
 * 战斗环境、全局账本和输入游标的数据。
 *
 * 本文件保存所有参与者共享的时钟与资源、敌我生命、时间膨胀、随机源和已经消费到的位置。
 * 它不负责校验初始配置，也不执行资源、生命或时间推进；这些操作留在 runtime 目录。
 */
import { type ActionBlackboardValue } from '../../../../packages/game-data-contract/src/primitives';
import { type ElementalReaction, type PlayerSkillInput } from '../../game-data/operatorDefinition';
import { type GameplayTag } from '../../../../packages/game-data-contract/src/gameplayTags';
import {
  type CombatObjectRef,
  type SharedSpGainModifierState,
  type SharedSpRecoveryModifierState,
  type SkillSimulationInputs,
} from './foundationState';

/** 当前已经推进到的整数帧。 */
export interface CombatClockState {
  frame: number;
}

/** 下一次分配的能力实体编号。 */
export interface AbilityEntityInstanceIdState {
  next: number;
}

/** 下一次实际施放使用的编号。 */
export interface SkillCastIdState {
  nextId: number;
}

export interface SkillCastInheritanceRegistration {
  readonly operatorId: string;
  readonly id: number;
  readonly skillCastInfo: import('./foundationState').CombatSkillCastInfo;
}

/** 当前帧主动使用物品；目标由 operatorId 明确指定，不伪装为技能施放。 */
export interface ConsumableUseInput {
  readonly useId: string;
  readonly operatorId: string;
  readonly consumableId: string;
}

export interface ScheduledConsumableUseInput extends ConsumableUseInput {
  readonly frame: number;
}

/** 全场普通攻击施法身份继承槽及编号进度。 */
export interface SkillCastInheritanceState {
  readonly registrations: Map<string, SkillCastInheritanceRegistration>;
  nextId: number;
}

export interface BuffProgressPoint {
  readonly frame: number;
  readonly ratio: number | null;
}

export interface BuffProgressCurveState {
  readonly targetId: string;
  readonly buffId: string;
  readonly instanceId: number;
  readonly showInBattleSkillButton: boolean;
  readonly showInUltimateButton: boolean;
  readonly showInHpBar: boolean;
  readonly weakBattleSkillStyle: boolean;
  durationSeconds: number | null;
  readonly points: BuffProgressPoint[];
}

/** Buff 进度曲线历史及仍需采样的实例索引。 */
export interface BuffProgressRecorderState {
  readonly curves: Map<string, BuffProgressCurveState>;
  readonly runtimeCurveKeys: Map<string, Set<string>>;
}

/** 连携条件求值后可保存到候选窗口的数据。 */
export interface ComboCastParameters {
  readonly inputTarget: import('../../game-data/logicalAbilityEntity').RuntimeTargetRef;
  readonly triggerTarget: import('../../game-data/logicalAbilityEntity').RuntimeTargetRef | null;
  readonly assignPairs: Readonly<Record<string, ActionBlackboardValue>> | null;
}

export interface PendingComboWindow {
  readonly sequence: number;
  readonly operatorId: string;
  readonly nextSkillKey: string;
  readonly openedFrame: number;
  readonly blackboard: Readonly<Record<string, number>>;
  readonly nativeCondition?: ComboCastParameters & {
    readonly skillGroupKey: string;
  };
  remainingFrames: number;
}

export interface PendingComboRecord {
  readonly operatorId: string;
  readonly activationSequence: number;
  readonly openedFrame: number;
  readonly candidates: PendingComboWindow[];
}

export interface ComboRingQteRegistration {
  readonly sequence: number;
  readonly operatorId: string;
  readonly startRemainingFrames: number;
  readonly earlyDurationFrames: number;
  readonly activeDurationFrames: number;
}

/** 全场连携候选、暂停状态和 QTE 结果。 */
export interface ComboWindowState {
  readonly records: Map<string, PendingComboRecord>;
  readonly pausedOperators: Set<string>;
  readonly ringQtes: Map<number, ComboRingQteRegistration>;
  readonly successfulRingQteSkillCastIds: Set<number>;
  globallyPaused: boolean;
  nextSequence: number;
  nextRingQteSequence: number;
}

export function createComboWindowState(): ComboWindowState {
  return {
    records: new Map(),
    pausedOperators: new Set(),
    ringQtes: new Map(),
    successfulRingQteSkillCastIds: new Set(),
    globallyPaused: false,
    nextSequence: 0,
    nextRingQteSequence: 0,
  };
}

/** 全场冷却到期时间及最近一次清理时间。 */
export interface GlobalCooldownState {
  readonly entries: Map<string, Map<string, number>>;
  lastTick: number;
}

export type TimedMarkerClockDomain = 'default' | 'global' | 'globalScaled';

export interface TimedMarkerSnapshot {
  readonly instanceId: number;
  readonly ownerId: string;
  readonly markerId: string;
  readonly sourceTargetId: string;
  readonly createdAt: number;
  readonly expiresAt: number;
}

export interface TimedMarkerEntry extends TimedMarkerSnapshot {
  readonly id: string;
  readonly clockDomain: TimedMarkerClockDomain;
  finished: boolean;
}

/** 单个实体拥有的定时标记。 */
export interface TimedMarkerState {
  readonly entries: TimedMarkerEntry[];
  nextInstanceId: number;
}

export function createTimedMarkerState(): TimedMarkerState {
  return { entries: [], nextInstanceId: 1 };
}

/** 原生终结技演出是否正在隐藏普通界面。 */
export interface UltimatePresentationState {
  inUltimateCasting: boolean;
}

/** 原生单周期计时器的数据。 */
export interface PeriodicTimerState {
  period: number;
  remaining: number;
  passed: number;
}

export function createPeriodicTimerState(): PeriodicTimerState {
  return { period: -1, remaining: -1, passed: 0 };
}

export interface OperatorResources extends Omit<
  OperatorResourceSnapshot,
  'ultimateEnergy' | 'allowedUltimateEnergyRecoveryTags'
> {
  ultimateEnergy: number;
  allowedUltimateEnergyRecoveryTags: ReadonlySet<GameplayTag> | null;
}

/** PlayerController 持有的全队共享闪避体力。capacity 为 null 时仅记录相对满值的消耗。 */
export interface DashEnergyState {
  /** 已经从满值消耗的份数；一次普通闪避增加 1，极限闪避当前返还 0.5。 */
  spent: number;
  /** 账号侧闪避体力上限；游戏数据中没有该账号属性时保持 null。 */
  readonly capacity: number | null;
  /** 原生 currentDashCount 低于零后进入的透支状态。 */
  inOverdraft: boolean;
}

/** 技力、终结技能量与回能限制的数据图。 */
export interface CombatResourceState {
  readonly dashEnergy: DashEnergyState;
  sp: number;
  readonly maxSp: number;
  returnedSp: number;
  readonly spRecoveryPerSecond: number;
  readonly spRecoveryPauseDuration: number;
  spRecoveryPauseRemaining: number;
  readonly ultimateEnergySystemUnlocked: boolean;
  readonly squad: readonly OperatorResources[];
  readonly operators: Map<string, OperatorResources>;
  readonly baseUltimateRecoveryRestrictions: Map<string, ReadonlySet<GameplayTag> | null>;
  readonly ultimateRecoveryRestrictionHandles: Map<
    number,
    { readonly operatorId: string; readonly allowed: ReadonlySet<GameplayTag> }
  >;
  nextUltimateRecoveryRestrictionHandle: number;
  readonly normalSkillUltimateEnergy: NormalSkillUltimateEnergySettings;
  readonly sharedSpGainModifiers: SharedSpGainModifierState;
  readonly sharedSpRecoveryModifiers: SharedSpRecoveryModifierState;
}

/** 实体生命、失衡、恢复计时器和生命下限句柄。 */
export interface CombatVitalsState {
  health: number;
  poise: number;
  poiseImmune: boolean;
  stopPoiseRecovery: boolean;
  hasPoiseBrokenTag: boolean;
  readonly maxHealth: number;
  readonly maxPoise: number;
  readonly poiseRecoveryTime: number;
  readonly poiseRecoveryTimeMultiplier: number;
  readonly poiseBrokenEndTime: number;
  readonly poiseRecoveryTimer: PeriodicTimerState;
  readonly poiseBrokenEndTimer: PeriodicTimerState;
  readonly healthFloors: Map<number, number>;
  nextHealthFloorId: number;
}

export interface OrdinaryKnockDownState {
  active: boolean;
  readonly timer: PeriodicTimerState;
}

export function createOrdinaryKnockDownState(): OrdinaryKnockDownState {
  return { active: false, timer: createPeriodicTimerState() };
}

export interface TimeDilationSource {
  readonly sourceId: string;
  readonly sourceActionId: string;
  readonly sourceCastId?: string;
  /** 创建本实例的执行宿主；与展示用的来源技能 ID 分开保存。 */
  readonly producedBy?: CombatObjectRef;
}

export interface TimeDilationInstanceSnapshot {
  readonly id: number;
  readonly durationSeconds: number;
  readonly elapsedSeconds: number;
  readonly slot: string;
  readonly priority: number;
  readonly currentScale: number;
  readonly source?: TimeDilationSource;
}

export interface MutableTimeDilationInstance extends TimeDilationInstanceSnapshot {
  elapsedSeconds: number;
  currentScale: number;
  active: boolean;
}

export interface GlobalTimeDilationInstance extends MutableTimeDilationInstance {
  readonly curveId?: number;
  readonly constantScale?: number;
  readonly influenceSkillCooldownSeconds?: number;
  readonly ignoredOperatorIds: ReadonlySet<string>;
}

export interface EntityTimeDilationInstance extends MutableTimeDilationInstance {
  readonly entityId: string;
  readonly curveId: number;
  readonly lifetimeUsesGlobalScale: boolean;
}

/** 全局和实体时间膨胀实例及累计时间。 */
export interface TimeDilationState {
  readonly globalInstances: GlobalTimeDilationInstance[];
  readonly entityInstances: EntityTimeDilationInstance[];
  readonly ignoreGlobalTimeScaleEntityIds: Set<string>;
  nextInstanceId: number;
  globalScaledTime: number;
}

export function createTimeDilationState(): TimeDilationState {
  return {
    globalInstances: [],
    entityInstances: [],
    ignoreGlobalTimeScaleEntityIds: new Set(),
    nextInstanceId: 0,
    globalScaledTime: 0,
  };
}

/** onPostSkillTryCastRequest 的稳定监听登记顺序。 */
export interface PostSkillRequestListenerState {
  nextRegistrationId: number;
  readonly registrationsByOwner: Map<string, number[]>;
}

export function createPostSkillRequestListenerState(): PostSkillRequestListenerState {
  return { nextRegistrationId: 0, registrationsByOwner: new Map() };
}

/** 标准敌我战斗环境使用的可变数据。 */
export interface StandardCombatEnvironmentState {
  readonly random: SimulationRandomState | null;
  readonly enemyVitals: CombatVitalsState;
  readonly operatorVitals: Map<string, CombatVitalsState>;
  readonly reactions: Map<ElementalReaction, ElementalReactionState>;
  readonly knockDown: OrdinaryKnockDownState | null;
  readonly buffProgress: BuffProgressRecorderState;
  readonly poiseBreakBuffs: Set<number>;
  readonly postSkillRequestListeners: PostSkillRequestListenerState;
}

/** 一组连续技能输入当前消费到的位置。 */
export interface SkillInputGroupRuntimeState {
  readonly anchorCastId: string;
  nextIndex: number;
  previous: ScheduledSkillInput | null;
  stopped: boolean;
}

/** 固定技能输入、自动顺延输入和连续组的消费游标。 */
export interface CombatInputRuntimeState {
  nextInputIndex: number;
  previousFixedInput: ScheduledSkillInput | null;
  readonly continuation: {
    nextIndex: number;
    previous: ScheduledSkillInput | null;
    stopped: boolean;
  };
  readonly groups: SkillInputGroupRuntimeState[];
}

/** 外部战斗事件当前消费到的位置。 */
export interface ExternalCombatEventRuntimeState {
  nextEventIndex: number;
  previousEvent: ScheduledExternalCombatEventInput | null;
}

/** 闪避输入及人工极限闪避成功事实当前消费到的位置。 */
export interface DodgeInputRuntimeState {
  nextInputIndex: number;
  previousInput: ScheduledDodgeInput | null;
  /** 只包含已经提交的身份，供逐帧调用与恢复分支检查重复输入。 */
  readonly executedDashIds: Set<string>;
  readonly declaredSuccessIds: Set<string>;
}

export function createDodgeInputState(): DodgeInputRuntimeState {
  return {
    nextInputIndex: 0,
    previousInput: null,
    executedDashIds: new Set(),
    declaredSuccessIds: new Set(),
  };
}

/** PlayerController 持有的全队连续闪避计数与距上次闪避的时间。 */
export interface PlayerMultiDashState {
  /** 距上一次实际执行 Dash 的模拟帧数；null 表示尚未执行过。 */
  framesSinceLastDash: number | null;
  /** 当前连续 Dash 串中的次数；超过外侧输入窗口后下一次会重置为 1。 */
  count: number;
}

export function createPlayerMultiDashState(): PlayerMultiDashState {
  return { framesSinceLastDash: null, count: 0 };
}

/** 所有干员和动态实例共享的战斗数据。 */
export interface CombatSharedState {
  readonly clock: CombatClockState;
  readonly resources: CombatResourceState;
  /** 原生 PlayerController 的连续闪避窗口；切人不会重置。 */
  readonly multiDash: PlayerMultiDashState;
  readonly timeDilation: TimeDilationState | null;
  readonly comboWindows: ComboWindowState;
  readonly ultimatePresentation: UltimatePresentationState;
  readonly globalCooldowns: GlobalCooldownState;
  readonly basicAttackInheritance: SkillCastInheritanceState;
  readonly identities: {
    readonly abilityEntities: AbilityEntityInstanceIdState;
    readonly skillCasts: SkillCastIdState;
  };
}

/** 单个队员终结技能量及其回复限制的可重建快照。 */
export interface OperatorResourceSnapshot {
  readonly operatorId: string;
  readonly ultimateEnergy: number;
  readonly maxUltimateEnergy: number;
  readonly ultimateEnergyGainMultiplier: number;
  /**
   * 当前终结技能量回复限制聚合后的许可标签；null 表示没有限制，空集合会拦截全部正向回复。
   * 原生由多个有效限制句柄取并集，资源账本只消费聚合结果，不负责 Buff 生命周期。
   */
  readonly allowedUltimateEnergyRecoveryTags: ReadonlySet<GameplayTag> | null;
}

/** 普通战技消耗技力时队内终结技能量的换算参数。 */
export interface NormalSkillUltimateEnergySettings {
  readonly selfGainPerSp: number;
  readonly otherGainPerSp: number;
}

/** 一次技能输入。固定输入已确定实际帧；组后段在运行时到达边界后才确定实际帧。 */
export interface CombatSkillInput {
  readonly simulationInputs?: SkillSimulationInputs;
  readonly operatorId: string;
  readonly skillId: string;
  /** 玩家尝试执行的四类语义动作；与设备键位和技能库分组无关。 */
  readonly action?: PlayerSkillInput;
  /** 文档中的技能释放身份；同技能多次放置靠它区分。 */
  readonly castId?: string;
}

export interface ScheduledSkillInput extends CombatSkillInput {
  /** 固定输入的实际帧；尚未启动的组后段仅携带锚点帧，供编译预检使用。 */
  readonly frame: number;
  /** 动态组与固定输入落在同帧时，仍按轨道和块的原始声明顺序执行。 */
  readonly declarationOrder?: number;
}

/** 时间轴提交给中心状态机的闪避操作；成功事实与 Dash 输入分开排序。 */
export type DodgeInput =
  | {
      readonly kind: 'dash';
      readonly dodgeId: string;
      readonly operatorId: string;
      readonly direction: 'forward' | 'backward';
    }
  | {
      readonly kind: 'perfectDodgeSuccess';
      readonly dodgeId: string;
      readonly operatorId: string;
    };

export type ScheduledDodgeInput = DodgeInput & { readonly frame: number };

export interface ExternalCombatEventInput {
  readonly targetOperatorIds: readonly string[];
  readonly event: { readonly kind: 'comboCooldownControl'; readonly mode: 'cooldown' | 'ready' };
}

export interface ScheduledExternalCombatEventInput extends ExternalCombatEventInput {
  readonly frame: number;
}

/** 敌人身上一个反应状态的当前取值。 */
export interface ElementalReactionState {
  readonly reaction: ElementalReaction;
  readonly level: number;
  /** 到期时间（战斗时钟的秒）；查询时已过期即视为不存在。 */
  readonly expiresAt: number;
  readonly sourceId: string;
}

/** 可完整恢复后续随机序列的原生减法随机状态；不补造未知的初始化规则。 */
export interface BattleRandomState {
  readonly currentIndex: number;
  readonly pairedIndex: number;
  readonly values: readonly number[];
}

/**
 * 场景随机流的全部可变数据。取样表只保存整数，不保存随机函数或闭包。
 * 状态由调用方持有；复制后可独立推进，替换后继续取样，不需要重新创建随机算法。
 */
export interface SimulationRandomState {
  /** 已提交施放的种子选择；null 表示使用全局流，不含未来计划。 */
  readonly submittedCastSeeds: Map<string, number | null>;
  /** 模式与全局种子属于整场固定配置；恢复候选不得在已存在状态上替换。 */
  configuration: { readonly mode: 'expected' | 'sampled'; readonly globalSeed: number } | null;
  /** 已实际取样的施放对种子覆盖的选择；null 表示该施放使用全局流。 */
  readonly usedCastSeeds: Map<string, number | null>;
  /** 随机模式各来源的当前 Mulberry32 整数状态。 */
  readonly streams: Map<string, number>;
  /** 期望模式各来源已经消费的均匀样本数量。 */
  readonly evenIndices: Map<string, number>;
}

/** 创建尚未取样的随机状态，不预装之后技能块的种子或施放计划。 */
export function createSimulationRandomState(): SimulationRandomState {
  return {
    submittedCastSeeds: new Map(),
    configuration: null,
    usedCastSeeds: new Map(),
    streams: new Map(),
    evenIndices: new Map(),
  };
}

export interface ActiveCombatStatus {
  readonly statusKey: string;
  readonly sourceId: string;
  readonly skillId: string;
  stacks: number;
  remainingFrames: number | null;
}

/** 一个实体当前存在的语义状态，保持施加顺序和原始来源；定义规则由程序另行持有。 */
export interface CombatStatusState {
  readonly statuses: Map<string, ActiveCombatStatus>;
}
