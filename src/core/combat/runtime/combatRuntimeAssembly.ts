import type { AbilityEvent } from '../../../../packages/game-data-contract/src/abilityEvents';
import { cloneCombatAttributes, readCombatAttribute } from '../attributes/combatAttributeExecution';
import { ATTRIBUTE_MODIFIER_SOURCES } from '../state/foundationState';
import type { LogicalAbilityEntitySpawnRequest } from '../abilities/logicalAbilityEntityRuntime';
import type {
  CombatObjectType,
  InflictionElement,
} from '../../../../packages/game-data-contract/src/primitives';
import { isEmptyActionProgram } from '../../compiler/actionProgramInspection';
import type { ResolvedCombatStepParameters } from '../../compiler/combatProgram';
import type { CompiledStepParameters } from '../../compiler/compiledGraphData';
import type { CompiledOperatorReactionModifier } from '../../compiler/compileOperatorUpgrades';
import { runtimeTargetEntityId } from '../../game-data/logicalAbilityEntity';
import type {
  ComboSkillPriority,
  OperatorPlayerActionModeDefinition,
  OperatorPlayerActionRoutes,
  OperatorRole,
  PlayerSkillInput,
} from '../../game-data/operatorDefinition';
import {
  advanceAbilitySkillSlotReplacements,
  finishAbilitySkillSlotReplacement,
  replaceAbilitySkillSlot,
  type SkillSlotReplacementHost,
} from '../abilities/abilitySystemExecution';
import { createCallbackSkillHostFactory } from '../abilities/callbackSkillHost';
import type { RegisterPassiveAbilityEventAction } from '../abilities/passiveAbilityEventRuntime';
import { bindProjectileCallbackLifecycle } from '../abilities/projectileCallbackRuntime';
import type { ActionExecutionTrace } from '../actions/actionExecutionTrace';
import type { BuffConsumedEvent } from '../buffs/buffOperationExecutor';
import { skillAbilityEvent } from '../events/combatAbilityEvent';
import type {
  AbilityConsumedBuffPayload,
  AbilityEventPayloadMap,
  AbilityPhysicalInflictionPayload,
} from '../events/combatAbilityEvent';
import type { CombatObjectRef } from '../receipt/combatReceipt';
import type { CombatReceiptView } from '../receipt/combatReceiptHistory';
import { hasUnmodeledIncomingAttackTrigger } from '../skills/comboConditionCheckability';
import type {
  ComboSkillConditionState,
  OperatorInitializationState,
  OperatorUpgradeEventState,
  PassiveAbilityEventState,
  SkillCooldownSnapshot,
} from '../state/abilityState';
import {
  createOperatorCenterState,
  type OperatorCenterState,
  type SkillCooldownState,
  type SkillRuntimeState,
} from '../state/abilityState';
import type { CombatStateGraph } from '../state/combatState';
import type {
  CombatInputRuntimeState,
  CombatSharedState,
  CombatSkillInput,
  ConsumableUseInput,
  DodgeInputRuntimeState,
  ExternalCombatEventRuntimeState,
  PlayerMultiDashState,
} from '../state/environmentState';
import type { CombatSkillCastInfo, GlobalBuffInstanceState } from '../state/foundationState';
import type { BuffContainerState } from '../state/instanceState';
import type { GameplayTagPredefine } from '../tags/gameplayTagPredefine';
import type { GameplayTag } from '../tags/gameplayTags';
import type { CombatFrameInputs } from './combatSimulation';
import type { RestoredCombatOperatorCore } from './restoration/combatOperatorCoreRestoration';
/**
 * 将已解析资源和已编译技能组装成一次可执行的战斗运行时。
 * 这里只负责依赖接线与原生阶段顺序，不解析存档，也不为还没做通的战斗操作提供默认行为。
 */
import type {
  CompiledComboSkillConditionProgram,
  CompiledOperatorInitializationProgram,
  CompiledOperatorPassiveProgram,
  CompiledOperatorUpgradeEventProgram,
  CompiledSkillCooldownProgram,
  CompiledSkillExecutionProgram,
  CompiledSkillProgram,
  CompiledSkillSlotGroup,
  ResolvedAbilityEntityDefinition,
  ResolvedCombatOperationStep,
  ResolvedSkillBuffDefinition,
} from '../../compiler/combatProgram';
import type { CompiledEquipmentContribution } from '../../compiler/compileEquipment';
import type { ResolvedOperatorPanel } from '../../compiler/resolveOperatorPanel';
import type { ConsumableDefinition } from '../../game-data/consumableDefinition';
import type { EnemyRank } from '../../game-data/enemyRank';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import {
  logicalAbilityEntityRuntimeId,
  runtimeTargetFromEntityId,
} from '../../game-data/logicalAbilityEntity';
import type {
  CombatTarget,
  DamageElement,
  GlobalCooldownTarget,
} from '../../game-data/operatorDefinition';
import { AbilityEntityChildSkillPrograms } from '../abilities/abilityEntityChildSkillPrograms';
import { AbilityEntityInstanceIdAllocator } from '../abilities/abilityEntityInstanceIdAllocator';
import { AbilityEntityOperationExecutor } from '../abilities/abilityEntityOperationExecutor';
import {
  failAfterAbilityHostCleanup,
  runAbilityHostCleanup,
} from '../abilities/abilityEventHostLifecycle';
import {
  AbilitySystemRuntime,
  type AbilitySystemRuntimeOptions,
} from '../abilities/abilitySystemRuntime';
import {
  EquipmentEventRuntime,
  type EquipmentEventExecutionContext,
  type RegisterEquipmentAbilityEventAction,
} from '../abilities/equipmentEventRuntime';
import {
  LogicalAbilityEntityRuntime,
  type LogicalAbilityEntityRuntimeHooks,
} from '../abilities/logicalAbilityEntityRuntime';
import { OperatorUpgradeEventRuntime } from '../abilities/operatorUpgradeEventRuntime';
import { PassiveAbilityEventRuntime } from '../abilities/passiveAbilityEventRuntime';
import type { ProjectileCallbackPrograms } from '../abilities/projectileCallbackPrograms';
import {
  ProjectileLifecycleRuntime,
  type ProjectileBuffLifecycle,
} from '../abilities/projectileLifecycleRuntime';
import {
  EnemyRankConditionExecutor,
  EnemySuperArmorConditionExecutor,
} from '../abilities/targetConditionExecutors';
import { TargetContextOperationExecutor } from '../abilities/targetContextOperationExecutor';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { ActionBlackboardOperationExecutor } from '../actions/actionBlackboardOperationExecutor';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { CombatOperationPrograms } from '../actions/combatOperationPrograms';
import {
  BuffOperationExecutor,
  type BuffApplicationHandle,
  type BuffLifecycleOperationSource,
  type BuffOperationDependencies,
  type BuffOperationTarget,
} from '../buffs/buffOperationExecutor';
import { GlobalBuffOperationExecutor, GlobalBuffRuntime } from '../buffs/globalBuffRuntime';
import type { PlayerDamageDefenderSnapshot } from '../damage/playerActiveDamageInput';
import type { SharedDamageTransfer } from '../damage/playerDamageOperationExecutor';
import type {
  AbilityEventRegistration,
  TrackedAbilityEventRegistration,
} from '../events/abilityEventDispatcher';
import {
  CombatSemanticEventRuntime,
  type CombatSemanticEventContext,
  type RegisterCombatAbilityEvent,
} from '../events/combatSemanticEventRuntime';
import { CustomAbilityEventOperationExecutor } from '../events/customAbilityEventOperationExecutor';
import { EventContextConditionExecutor } from '../events/eventContextConditionExecutor';
import { ExternalCombatEventRuntime } from '../events/externalCombatEventRuntime';
import type { ProbabilitySampleSource } from '../random/probabilitySampleSource';
import { CombatReceiptCollector, type CombatReceiptSink } from '../receipt/combatReceipt';
import { CombatResourceRuntime } from '../resources/combatResourceRuntime';
import { CombatResources, type CombatResourceSnapshot } from '../resources/combatResources';
import type { CombatVitals } from '../resources/combatVitals';
import type { CombatVitalsConditionDependencies } from '../resources/combatVitalsConditionExecutor';
import { CombatVitalsConditionExecutor } from '../resources/combatVitalsConditionExecutor';
import { SkillResourceOperationExecutor } from '../resources/skillResourceOperationExecutor';
import { CharacterPassiveUiOperationExecutor } from '../skills/characterPassiveUiOperationExecutor';
import {
  createCombatInputExecution,
  type CombatInputExecution,
} from '../skills/combatInputExecution';
import { CombatSkillPrograms } from '../skills/combatSkillPrograms';
import { prepareComboCast } from '../skills/comboCastPreparation';
import type {
  ComboConditionRegistration,
  PendingComboCondition,
} from '../skills/comboSkillConditionRuntime';
import { ComboWindowOperationExecutor } from '../skills/comboWindowOperationExecutor';
import { ComboWindowRuntime, type ComboWindowConsumeResult } from '../skills/comboWindowRuntime';
import { DodgeInputRuntime, recordDodgeReceipt } from '../skills/dodgeInputRuntime';
import { GlobalCooldowns } from '../skills/globalCooldowns';
import { HideUiOperationExecutor } from '../skills/hideUiOperationExecutor';
import {
  OperatorCenterStateRuntime,
  type DashTimingProgram,
} from '../skills/operatorCenterStateRuntime';
import { OperatorControlConditionExecutor } from '../skills/operatorControlConditionExecutor';
import {
  OperatorControlRuntime,
  type OperatorControlConfiguration,
} from '../skills/operatorControlRuntime';
import { PlayerMultiDashRuntime } from '../skills/playerMultiDashRuntime';
import { SkillCastIdAllocator } from '../skills/skillCastInfo';
import {
  BasicAttackSkillCastInheritanceRegistry,
  SkillCastInheritanceOperationExecutor,
} from '../skills/skillCastInheritanceOperationExecutor';
import { SkillCastOperationExecutor } from '../skills/skillCastOperationExecutor';
import { SkillCooldown } from '../skills/skillCooldown';
import {
  adjustMatchingSkillCooldowns,
  SkillCooldownOperationExecutor,
} from '../skills/skillCooldownOperationExecutor';
import { SkillInputGroupTiming } from '../skills/skillInputGroupTiming';
import {
  SkillRuntime,
  type CombatOperationContext,
  type CombatOperationExecutor,
  type ProjectileRuntimeDependencies,
} from '../skills/skillRuntime';
import { sameSkillSimulationInputs } from '../skills/skillSimulationInputs';
import { SkillSlotOperationExecutor } from '../skills/skillSlotOperationExecutor';
import { UltimatePresentationRuntime } from '../skills/ultimatePresentationRuntime';
import {
  createCombatOperationHostState,
  type CombatOperationHostState,
} from '../state/actionState';
import type { TimeDilationInstanceSnapshot } from '../state/environmentState';
import {
  createDodgeInputState,
  type ScheduledConsumableUseInput,
  type ScheduledDodgeInput,
  type ScheduledExternalCombatEventInput,
  type ScheduledSkillInput,
} from '../state/environmentState';
import type {
  AbilityEventSubscriptionReference,
  BuffReference,
  PostSkillCastRequest,
  SkillSimulationInputs,
} from '../state/foundationState';
import { TimedMarkerOperationExecutor } from '../status/timedMarkerOperationExecutor';
import { TimedMarkerContainer } from '../status/timedMarkers';
import { COMBAT_FRAME_INTERVAL, COMBAT_FRAMES_PER_SECOND, CombatClock } from '../time/combatClock';
import { TimeDilationOperationExecutor } from '../time/timeDilationOperationExecutor';
import {
  TimeDilationRuntime,
  uniformAbilityTickDeltas,
  type AbilityTickDeltas,
  type TimeDilationEndReason,
  type TimeDilationInstanceKind,
  type TimeDilationPrograms,
  type TimeDilationRuntimeConfig,
} from '../time/timeDilationRuntime';
import type { CombatFrameInput } from './combatFrameInput';
import { bindCombatFramePipeline } from './combatFramePipeline';
import { CombatInputRuntime, type SkillInputGroup } from './combatInputRuntime';
import { CombatSharedRuntime } from './combatSharedRuntime';
import { CombatSimulation, type FrameRuntime } from './combatSimulation';
import {
  bindRestoredCombatRuntimeAbilityEntityRelations,
  resolveRestoredAbilityEntityDefinition,
} from './restoration/combatRuntimeAbilityEntityRelationRestoration';
import { bindRestoredCombatAbilityEntityDirectory } from './restoration/combatRuntimeAbilityEntityRestoration';
import { bindRestoredCombatBuffInstances } from './restoration/combatRuntimeBuffInstanceRestoration';
import { bindRestoredCombatRuntimeFrame } from './restoration/combatRuntimeFrameRestoration';
import { configureRestoredCombatObjectReferences } from './restoration/combatRuntimeObjectReferenceRestoration';
import { bindRestoredCombatRuntimeOperators } from './restoration/combatRuntimeOperatorRestoration';
import {
  bindRestoredCombatProjectileRelations,
  createRestoredCombatProjectileDirectory,
} from './restoration/combatRuntimeProjectileRestoration';
import {
  bindRestoredCombatRuntimeFoundation,
  type RestoredCombatEnvironmentInput,
  type RestoredCombatRuntimeFoundation,
} from './restoration/combatRuntimeRestoreFoundation';
import {
  prepareCombatRuntimeRestore,
  type CombatRuntimeRestorePreparation,
} from './restoration/combatRuntimeRestorePreparation';
import { resolveCombatSkillCooldownConfiguration } from './restoration/combatSkillCooldownRestoration';

/** 同一干员在一场战斗中唯一的 Buff 状态与实体黑板所有者。 */
export type OperatorBuffRuntime = FrameRuntime &
  BuffOperationTarget & {
    readonly entityBlackboard?: ActionBlackboard;
    advanceWithDeltas?(deltas: AbilityTickDeltas): void;
  };

/** 一个干员按原生技能定义顺序进入运行时的完整程序。 */
export interface CombatOperatorProgram {
  readonly operatorId: string;
  /** 原始轨道对应的零基队伍槽位；不能用过滤空轨后的干员顺序代替。 */
  readonly squadSlotIndex?: number;
  /** CharacterTable.profession 的一一映射；仅职业筛选实际出现时要求提供。 */
  readonly operatorRole?: OperatorRole;
  /** CharacterTable.charTypeId 的一一映射；仅角色类型筛选实际出现时要求提供。 */
  readonly element?: DamageElement;
  /** CharacterTable.charTypeId 原字符串，不从技能或展示属性推断。 */
  readonly characterTypeId?: string;
  readonly skills: readonly CompiledSkillProgram[];
  /** 时间轴施放身份与固定技能定义的显式绑定；定义本身不携带单次施放状态。 */
  readonly skillCasts?: readonly CombatSkillCastProgram[];
  /** 完整定义中的未放置技能；只供原生 CastSkill/换槽等内部路由启动。 */
  readonly definitionSkillPrograms?: readonly CompiledSkillProgram[];
  /** 中心 Dash 状态使用的隐藏技能与入场 Buff；不属于时间轴可放置技能目录。 */
  readonly dodgeProgram?: {
    readonly skillId: string;
    readonly dashBuffs: readonly {
      readonly buffId: string;
      readonly blackboard: Readonly<Record<string, number | string>>;
    }[];
  };
  /** 完整定义的静态冷却目录，独立于时间轴放置；缺省仅供底层程序兼容。 */
  readonly skillCooldownPrograms?: readonly CompiledSkillCooldownProgram[];
  /** 与技能等级解耦的干员附属 Buff 蓝图；不含任何单次模拟实例状态。 */
  readonly buffDefinitions?: Readonly<Record<string, ResolvedSkillBuffDefinition>>;
  /** Buff 生命周期直接引用的、同样与技能等级解耦的能力实体闭包。 */
  readonly abilityEntityDefinitions?: Readonly<Record<string, ResolvedAbilityEntityDefinition>>;
  /** 原生技能槽的基础及替换成员；与技能库展示组、成员是否可见无关。 */
  readonly skillSlotGroups?: readonly CompiledSkillSlotGroup[];
  /** 四类语义动作的显式技能请求路由；运行时不得从技能库分组恢复。 */
  readonly playerActionRoutes?: OperatorPlayerActionRoutes;
  readonly playerActionModes?: readonly OperatorPlayerActionModeDefinition[];
  /** 构筑启用的养成初始化行为；在 Buff 生命周期装配后执行一次。 */
  readonly initializationPrograms?: readonly CompiledOperatorInitializationProgram[];
  /** 构筑启用的常驻被动；按声明顺序在战斗装配完成后启用一次。 */
  readonly passivePrograms?: readonly CompiledOperatorPassiveProgram[];
  /** 构筑启用的养成事件监听器；按养成声明顺序注册到数据动作阶段。 */
  readonly upgradeEventPrograms?: readonly CompiledOperatorUpgradeEventProgram[];
  /** 复合元素状态由环境创建；这里保存当前构筑对其持续时间和效能的静态修正。 */
  readonly reactionModifiers?: readonly CompiledOperatorReactionModifier[];
  /** 原生附着事件的常驻条件；不按技能块重复注册，不替代旧语义连携规则。 */
  readonly comboConditionPrograms?: readonly CompiledComboSkillConditionProgram[];
  /** 原生多目标候选选择策略；当前单敌人投影只保留事实，不执行评分差异。 */
  readonly comboConditionPriority?: ComboSkillPriority;
  /** 已按当前构筑等级和装备者主副属性解析的静态装备贡献。 */
  readonly equipmentContributions?: readonly CompiledEquipmentContribution[];
  /** 场景编译入口提供的静态面板；底层运行时单元测试可按需省略。 */
  readonly panel?: ResolvedOperatorPanel;
  /** 已由场景编译器从静态构筑条件求值；运行时只负责在技能创建前安装。 */
  readonly initialEntityBlackboard?: Readonly<Record<string, number | string>>;
  /** 同一实例既参与原生帧阶段，也承载该干员可被技能查询的 Buff。 */
  readonly buffRuntime?: OperatorBuffRuntime;
  /** 通用语义状态与 Buff 分属两个显式所有者；容器只在本次模拟中使用。 */
  readonly actionRuntime?: FrameRuntime;
}

export interface CombatSkillCastProgram {
  readonly castId: string;
  readonly program: CompiledSkillProgram;
}

/** 敌方 Buff 既是技能查询目标，也是必须随战斗时钟推进的实体运行时。 */
export interface EnemyBuffRuntime extends FrameRuntime, BuffOperationTarget {
  advanceWithDeltas?(deltas: AbilityTickDeltas): void;
  recycleFinishedBuffs?(): void;
}

/** 动态能力实体独占的 Buff 所有者；生命周期使用该实体的四路时间增量。 */
export interface AbilityEntityBuffRuntime extends BuffOperationTarget {
  advanceWithDeltas(deltas: AbilityTickDeltas): void;
  recycleFinishedBuffs?(): void;
  releaseAll(): void;
}

/** 项目敌人进入运行时的静态输入；所有字段均来自项目实例而非定义回查。 */
export interface CombatEnemyProgram {
  readonly source:
    | { readonly kind: 'prefab'; readonly enemyId: string; readonly level: number }
    | { readonly kind: 'custom'; readonly level: number };
  readonly rank: EnemyRank;
  readonly health: number;
  readonly superArmor: number;
  readonly defenderAttributes: PlayerDamageDefenderSnapshot;
  /** 节点阈值已进入运行时程序；节点 Buff 的执行仍待接入统一事件系统。 */
  readonly stagger: {
    readonly maximum: number;
    readonly knotThresholds: readonly number[];
    readonly knotBreakDurationFrames: number;
    readonly brokenDurationFrames: number;
    readonly finisherSpRecovery: number;
  };
}

/** 非资源操作执行器工厂能够读取的稳定运行时依赖。 */
type CombatOperationProgram = CompiledSkillExecutionProgram & {
  /** 时间轴技能保留编辑身份；能力实体与投射物回调没有该字段。 */
  readonly skillGroupKey?: string;
  readonly skillLevel?: number;
};

interface CombatDamageTargetBindings {
  /** 查询本次战斗分支的部位身份和账本；不能捕获另一切面的实体目录。 */
  readonly resolveSharedDamageTransfer?: (
    target: RuntimeTargetRef,
  ) => SharedDamageTransfer | undefined;
}

export interface CombatOperationExecutorContext extends CombatDamageTargetBindings {
  readonly queryTargets?: CombatOperationExecutor['queryTargets'];
  readonly resolveInflictionTarget?: (target: RuntimeTargetRef) => RuntimeTargetRef;
  readonly readSimulationInputs?: () => SkillSimulationInputs | undefined;
  /** 当前时间轴施放身份；固定定义和非技能宿主不提供。 */
  readonly castId?: string;
  readonly program: CompiledSkillProgram;
  /** 伤害、治疗和属性读取归属的干员；能力实体作为动作宿主时仍指向其定义宿主。 */
  readonly sourceOperatorId?: string;
  /** 把能力实体 AbilitySystem 身份沿来源链解析到实际干员/敌人。 */
  readonly resolveAbilitySystemSourceId?: (entityId: string) => string;
  /** 当前定义宿主的已解析 Buff 闭包，供具有隐式 Buff 依赖的原生根动作复用。 */
  readonly buffDefinitions?: CombatOperatorProgram['buffDefinitions'];
  readonly enemy: CombatEnemyProgram;
  readonly equipmentContributions: readonly CompiledEquipmentContribution[];
  readonly panel?: ResolvedOperatorPanel;
  readonly clock: CombatClock;
  readonly resources: CombatResources;
  readonly receipt: CombatReceiptSink;
  /** 全场唯一的语义事件中心；执行器只报告已完成的战斗事实。 */
  readonly semanticEvents: CombatSemanticEventRuntime;
}

/** 装配根在任何开局程序执行前交给外部战斗环境的一次性运行时上下文。 */
export interface CombatBattleRuntimeContext {
  /** 当前已生效的主控身份；不查询未来排程。 */
  readonly isOperatorControlled?: (operatorId: string) => boolean;
  readonly enemy: CombatEnemyProgram;
  readonly clock: CombatClock;
  readonly resources: CombatResources;
  readonly receipt: CombatReceiptSink;
  readonly resolveProjectileRuntimeDependencies: (
    definitionOperatorId: string,
  ) => ProjectileRuntimeDependencies;
}

/** 外部环境完成绑定后才可创建、需要由装配根逐帧推进的运行时。 */
export interface BoundCombatBattleRuntimes {
  readonly frameEndEvents?: FrameRuntime;
  readonly environmentState?: NonNullable<CombatStateGraph['environment']>;
  /** 活的订阅目录：随后创建的实体事件中心也必须登记在同一 Map 中。 */
  readonly eventStates?: NonNullable<CombatStateGraph['events']['native']>;
  /**
   * 将保存的原生事件订阅接回当前分支的处理函数。环境负责按状态目录定位发布实体，
   * 并补回本次事件的运行时目标上下文；调用方不得重新注册或猜测实体身份。
   */
  readonly bindNativeEventSubscription?: (
    reference: AbilityEventSubscriptionReference,
    receive: (context: CombatSemanticEventContext) => void,
  ) => TrackedAbilityEventRegistration;
  readonly enemyVitalsRuntime?: (FrameRuntime & { advance?(deltaSeconds: number): void }) | null;
  /** 原生 ControlledStateComponent.FixedTick 消费实体最终时间倍率，不用 Ability/Buff 默认时钟。 */
  readonly enemyControlRuntime?: { advance(entityDeltaSeconds: number): void } | null;
}

/** 配装事件中未被通用执行器消费的操作，由环境按明确来源决定是否支持。 */
export interface EquipmentEventOperationExecutorContext
  extends EquipmentEventExecutionContext, CombatDamageTargetBindings {
  readonly buffDefinitions?: CombatOperatorProgram['buffDefinitions'];
  readonly enemy: CombatEnemyProgram;
  readonly panel?: ResolvedOperatorPanel;
  readonly clock: CombatClock;
  readonly resources: CombatResources;
  readonly receipt: CombatReceiptSink;
  readonly semanticEvents: CombatSemanticEventRuntime;
}

/** HP 伤害共用末端，但配装来源不能冒充主动技能程序。 */
export type CombatDamageExecutorContext =
  CombatOperationExecutorContext | EquipmentEventOperationExecutorContext;

/** 场景编译器拥有的战斗输入，不属于外部运行环境。 */
export interface CombatRuntimeScenarioOptions {
  readonly resources: CombatResourceSnapshot;
  /** 由场景敌人实例编译得到，操作执行器不得另行读取定义默认值。 */
  readonly enemy: CombatEnemyProgram;
  /** 顺序应来自已解析队伍/实体启动结果，装配器不会自行排序。 */
  readonly operators: readonly CombatOperatorProgram[];
  /** 当前版本可主动使用的物品目录；物品输入只引用稳定 ID。 */
  readonly consumables?: readonly ConsumableDefinition[];
  readonly consumableUses?: readonly ScheduledConsumableUseInput[];
  readonly dodgeInputs?: readonly ScheduledDodgeInput[];
  readonly inputs?: readonly ScheduledSkillInput[];
  /** 正式连续组由锚点启动，其余成员按实际块边界逐段开始。 */
  readonly skillInputGroups?: readonly SkillInputGroup[];
  /** 时间轴显式输入的受击事实；不执行敌方伤害或生命扣减。 */
  readonly externalEvents?: readonly ScheduledExternalCombatEventInput[];
  /** 场景的初始主控、自动切换规则与手动切人排程；不是切面状态。 */
  readonly operatorControl?: OperatorControlConfiguration;
  /** 独立运行环境的控制查询；场景模拟使用 operatorControl 和运行时当前身份。 */
  readonly isOperatorControlled?: (operatorId: string, frame: number) => boolean;
}

export interface CombatRuntimeAssemblyOptions
  extends CombatRuntimeScenarioOptions, CombatRuntimeEnvironmentOptions {}

/** 应用装配层提供的运行时端口与模拟选项；新增字段在此显式确定归属。 */
export interface CombatRuntimeInputRules {
  /** 原生连携候选等待时长，单位为秒。 */
  readonly comboSkillPendingInterval: number;
  /** 同帧连携的角色优先级；不影响战斗宿主的启动及推进顺序。 */
  readonly comboSkillOrder?: readonly string[];
  /** BattleCommandMappingConfig 的三项原生 Dash 计时；存在闪避输入时必须提供。 */
  readonly dashTiming?: DashTimingProgram;
  readonly skillAvailabilityTags?: GameplayTagPredefine;
  readonly resolveDashControllerState?: (operatorId: string) => {
    readonly playerActionEnabled: boolean;
    readonly movementGaitAllowsDash: boolean;
    readonly isInAir: boolean;
  };
}

/** 新建与恢复共用的输入规则；只提取规则，不复制宿主、当前状态或未来排程。 */
export function getCombatRuntimeInputRules(
  options: CombatRuntimeInputRules,
): CombatRuntimeInputRules {
  return {
    comboSkillPendingInterval: options.comboSkillPendingInterval,
    ...(options.comboSkillOrder === undefined ? {} : { comboSkillOrder: options.comboSkillOrder }),
    ...(options.dashTiming === undefined ? {} : { dashTiming: options.dashTiming }),
    ...(options.skillAvailabilityTags === undefined
      ? {}
      : { skillAvailabilityTags: options.skillAvailabilityTags }),
    ...(options.resolveDashControllerState === undefined
      ? {}
      : { resolveDashControllerState: options.resolveDashControllerState }),
  };
}

export interface CombatRuntimeEnvironmentOptions extends CombatRuntimeInputRules {
  readonly executionTrace?: ActionExecutionTrace;
  /** 同一切面树共享的能力实体子技能程序目录；普通新战斗省略时创建一份。 */
  readonly abilityEntityChildSkillPrograms?: AbilityEntityChildSkillPrograms;
  /** 同一切面树共享的编译动作槽目录；恢复分支必须沿用原目录。 */
  readonly combatOperationPrograms?: CombatOperationPrograms;
  /** 同一切面树共享的普通技能程序与伤害快照槽位目录；恢复分支必须沿用原目录。 */
  readonly combatSkillPrograms?: CombatSkillPrograms;
  /** 准备期从负帧开始；省略时保持独立运行时原有的第 0 帧起点。 */
  readonly initialFrame?: number;
  readonly submitCastRandomSeed?: (castId: string, seed?: number) => void;
  /** 逐帧驱动在初始化之后、起始帧输入之前交还控制权。 */
  readonly deferInitialInput?: boolean;
  /** RandomUtil.Dice 使用的独立样本源；只有实际执行概率条件时才要求存在。 */
  readonly probabilitySamples?: ProbabilitySampleSource;
  /** StoreAttributeValue 的动态来源属性读取端口；只有技能实际使用时才要求提供。 */
  readonly readSourceAttributeValue?: (
    sourceId: string,
    request: CompiledStepParameters['storeSourceAttributeValue'],
  ) => number;
  /** 必须先于养成初始化和常驻被动执行，使帧 0 行为拥有同一时钟、回执和资源账本。 */
  readonly bindBattleRuntime?: (
    context: CombatBattleRuntimeContext,
  ) => BoundCombatBattleRuntimes | void;
  readonly registerCombatAbilityEvent?: RegisterCombatAbilityEvent;
  /** 当前单敌人模型中的目标 Buff 查询端口。 */
  readonly enemyBuffRuntime: EnemyBuffRuntime;
  /** 缺省表示场景不启用时间膨胀；存在相关技能步骤时必须配置。 */
  readonly timeDilation?: {
    readonly config: TimeDilationRuntimeConfig;
  };
  /**
   * 敌人生命与失衡账本的逐帧推进器；由环境创建并交给装配根，装配层不猜测推进顺序。
   * `null` 表示环境没有绑定敌人（例如空场景），装配根会跳过注册。
   */
  readonly enemyVitalsRuntime?:
    (FrameRuntime & { advance?(deltaSeconds: number): void }) | null; /**
   * 为没有显式 `buffRuntime` 绑定的干员创建本场战斗唯一的 Buff runtime。
   * 伤害环境与技能操作必须共享该实例，不能各自维护同一干员的 Buff 状态。
   */
  readonly createOperatorBuffRuntime?: (
    operatorId: string,
    panel?: ResolvedOperatorPanel,
    reactionModifiers?: CombatOperatorProgram['reactionModifiers'],
    /** 恢复分支的容器数据；提供时必须直接绑定，不能重新初始化面板属性或实体黑板。 */
    restoredState?: BuffContainerState<string>,
  ) => OperatorBuffRuntime;
  /** 按每次回能时的 Buff 属性状态解析 UltimateSpGainScalar。 */
  readonly resolveUltimateEnergyGainMultiplier?: (operatorId: string) => number;
  /** 仅在能力实体首次成为 Buff 目标时创建，返回值必须由该实例独占。 */
  readonly createAbilityEntityBuffRuntime?: (
    entityId: string,
    entityBlackboard: ActionBlackboard,
    target: RuntimeTargetRef,
    bornTags: readonly GameplayTag[],
    /** 恢复分支中的实体容器数据；提供时不得重新添加出生标签或初始化属性。 */
    restoredState?: BuffContainerState<string>,
  ) => AbilityEntityBuffRuntime;
  /** 仅临时放置规划启用，不修改项目中的持久连续组。 */
  readonly continuationPlanCastIds?: readonly string[];
  readonly continuationPlanMode?: 'continuation' | 'compact';
  /**
   * 返回本次模拟中的生命账本。只有技能包含生命条件时才会调用；
   * `operatorId` 用于解析 caster，enemy 则指向当前单敌人。
   */
  readonly resolveVitals?: (
    target: Parameters<CombatVitalsConditionDependencies['resolveTarget']>[0],
    operatorId: string,
    buffSourceId?: string,
  ) => CombatVitals;
  /** 按稳定干员 ID 返回生命账本，供队伍生命比例选择器使用。 */
  readonly resolveOperatorVitals?: (operatorId: string) => CombatVitals;
  /**
   * 返回处理伤害、Buff、附着和条件等职责的后续执行器。
   * 共享技力与战技扣费转能由装配器统一包在该执行器外层。
   */
  readonly createOperationExecutor: (
    context: CombatOperationExecutorContext,
  ) => CombatOperationExecutor;
  /** 发布端使用公共事件载荷；具体生产能力由安装的运行时端口决定。 */
  readonly onPostSkillCastRequest?: (ownerId: string, info: CombatSkillCastInfo | null) => void;
  readonly emitAbilityEvent?: <Event extends AbilityEvent>(
    entityId: string,
    event: Event,
    payload: AbilityEventPayloadMap[Event],
  ) => void;
  /** 所有开局附着 Buff 注册完成后，为每名干员发布一次本场入战事实。 */
  readonly emitOperatorEnterFight?: (operatorId: string) => void;
  /** 宿主释放后取消尚未发送的事件，也使正在发送的旧批次停止。 */
  readonly clearPendingAbilityEvents?: (entityId: string) => void;
  /** Buff 消费/吸收的原生 AbilityEvent 阶段；语义事件仍由装配根并行发布给配装与养成。 */
  readonly emitBuffLifecycleAbilityEvent?: (
    event: 'buffConsumed' | 'buffAbsorbed',
    payload: AbilityConsumedBuffPayload,
  ) => void;
  /** 仅在存在配装事件处理器时需要；不得通过伪造技能程序复用技能末端执行器。 */
  readonly createEquipmentEventOperationExecutor?: (
    context: EquipmentEventOperationExecutorContext,
  ) => CombatOperationExecutor;
  /** 配装原生 AbilitySystem 事件的注册端口；仅有语义事件的旧定义不需要。 */
  readonly registerEquipmentAbilityEventAction?: RegisterEquipmentAbilityEventAction;
  readonly registerPassiveAbilityEventAction?: (
    operatorId: string,
    ...args: Parameters<RegisterPassiveAbilityEventAction>
  ) => AbilityEventRegistration;
  /** 原生立即连携入口；普通窗口连携不依赖此端口。 */
  readonly castComboSkillImmediately?: (operatorId: string, skillKey: string) => void;
  /** 接入真实 AbilityEvent 的 combo 阶段；标准环境提供，不能用后置 semantic event 替代。 */
  readonly registerComboSkillCondition?: (
    registration: ComboConditionRegistration,
  ) => AbilityEventRegistration;
  /** 原生 markDie / InSilence 语义或显式场景投影；标准木桩环境提供存活/未沉默常量。 */
  readonly comboConditionEligibility?: {
    readonly isAlive: (operatorId: string) => boolean;
    readonly isSilenced: (operatorId: string) => boolean;
  };
  /** 可选审计观察者；候选始终由 assembly 写入连携窗口，不依赖外部接收方。 */
  readonly onPendingComboCondition?: (
    operatorId: string,
    program: CompiledComboSkillConditionProgram,
    pending: PendingComboCondition,
  ) => void;
  readonly receipt?: CombatReceiptCollector;
}

/** 从同一切面树的固定程序与标准环境配置建立完整的当前分支装配。 */
export interface CombatRuntimeAssemblyRestoreOptions extends CombatRuntimeInputRules {
  readonly operatorControl?: OperatorControlConfiguration;
  readonly receiptHistory: CombatReceiptView;
  readonly graph: CombatStateGraph;
  readonly resources: CombatResourceSnapshot;
  readonly enemy: CombatEnemyProgram;
  readonly operators: readonly CombatOperatorProgram[];
  readonly consumables?: readonly ConsumableDefinition[];
  readonly consumableUses?: readonly ScheduledConsumableUseInput[];
  readonly dodgeInputs?: readonly ScheduledDodgeInput[];
  readonly inputs?: readonly ScheduledSkillInput[];
  readonly skillInputGroups?: readonly SkillInputGroup[];
  readonly externalEvents?: readonly ScheduledExternalCombatEventInput[];
  readonly environment: RestoredCombatEnvironmentInput;
  readonly abilityEntityChildSkillPrograms: AbilityEntityChildSkillPrograms;
  readonly combatOperationPrograms: CombatOperationPrograms;
  readonly combatSkillPrograms: CombatSkillPrograms;
  readonly projectileCallbackPrograms: ProjectileCallbackPrograms;
  readonly timeDilation?: {
    readonly config: TimeDilationRuntimeConfig;
    readonly programs: TimeDilationPrograms;
  };
}

type CombatAbilityRuntimeBindings = Pick<
  AbilitySystemRuntimeOptions,
  | 'onPostSkillCastRequest'
  | 'beforePostSkillCastStart'
  | 'emitBeforeSkillCast'
  | 'resolveActualFrame'
  | 'onSkillOperableBoundaryReached'
  | 'resolveTickDeltas'
  | 'advanceSkillSlotReplacements'
  | 'dashOffsetFrames'
  | 'onCurrentSkillChanged'
  | 'onPostSkillCastResolved'
>;

type CombatAbilityEntityEventHooks = Pick<
  LogicalAbilityEntityRuntimeHooks,
  | 'spawned'
  | 'childSkillRequested'
  | 'finished'
  | 'timedMarkerCreated'
  | 'timedMarkerFinished'
  | 'soulDisabled'
>;

interface PreparedCombatRuntimeAssemblyRestore {
  readonly preparation: CombatRuntimeRestorePreparation;
  readonly options: CombatRuntimeAssemblyRestoreOptions;
}

const unsupportedReactiveTerminal: CombatOperationExecutor = {
  execute(step): boolean {
    throw new Error(`reactive event handler does not support '${step.kind}'`);
  },
  evaluate(condition): boolean {
    throw new Error(`reactive event handler cannot evaluate '${condition.kind}'`);
  },
};

/** Center Dash 是固定行为程序；单次输入身份由 producedBy 保留，不进入程序查找键。 */
const CENTER_DASH_ACTION_ID = 'center:dash';

/**
 * 普通 execute/end/evaluate 仍沿完整责任链传播；Reset 阶段的原生计算准备只交给
 * 战斗环境末端。外层解释器没有自己的准备状态，不能因未声明 prepare 而截断它。
 */
function withTerminalPreparation(
  chain: CombatOperationExecutor,
  terminal: CombatOperationExecutor,
  operationHost?: CombatOperationExecutor['operationHost'],
  executionTrace?: CombatOperationExecutor['executionTrace'],
  aura?: CombatOperationExecutor['aura'],
  frame?: () => number,
  queryTargets?: CombatOperationExecutor['queryTargets'],
  comboWindows?: ComboWindowRuntime,
  ownerTagQuery?: CombatOperationExecutor['ownerTagQuery'],
): CombatOperationExecutor {
  return {
    ...(executionTrace === undefined ? {} : { executionTrace }),
    ...(aura === undefined ? {} : { aura }),
    frame,
    queryTargets,
    comboWindows,
    ownerTagQuery,
    ...(operationHost === undefined ? {} : { operationHost }),
    prepare: (step, context) => terminal.prepare?.(step, context),
    execute: (step, context) => chain.execute(step, context),
    end: (step, context) => chain.end?.(step, context),
    evaluate: (condition, context) => chain.evaluate(condition, context),
  };
}

/** 一次战斗的时钟、账本、实体能力系统与回执的唯一装配根。 */
export class CombatRuntimeAssembly {
  /** 全场共享数据的内部装配入口；不等于完整战斗切面。 */
  readonly sharedState: CombatSharedState;
  readonly stateGraph: CombatStateGraph;
  /** 普通整轴模拟使用的固定输入计划；逐帧会话改由调用方在每一帧提交输入。 */
  readonly #scheduledFrameInputs: CombatFrameInputs;
  readonly #frameEndEvents: FrameRuntime | undefined;
  readonly #inputRuntime: CombatInputRuntime;
  readonly #dodgeInputRuntime: DodgeInputRuntime;
  readonly #dodgeInputState: DodgeInputRuntimeState;
  #inputExecution: CombatInputExecution | undefined;
  #groupTiming: SkillInputGroupTiming | undefined;
  readonly #externalEventRuntime: ExternalCombatEventRuntime;
  readonly #options: CombatRuntimeAssemblyOptions;
  readonly #castParameters: Map<string, SkillSimulationInputs>;
  readonly clock: CombatClock;
  readonly resources: CombatResources;
  readonly receipt: CombatReceiptCollector;
  readonly ultimatePresentation: UltimatePresentationRuntime;
  /** 全场唯一的连携窗口队列；诊断和投影应读取它，不得自行重算窗口顺序。 */
  readonly comboWindows: ComboWindowRuntime;
  /** 配装、连携和养成监听器共用的语义事件中心。 */
  readonly semanticEvents: CombatSemanticEventRuntime;
  readonly timeDilation: TimeDilationRuntime | null;
  /** 按实际战斗帧驱动各个运行时；每个对象自行消费对应的局部 delta。 */
  readonly simulation: CombatSimulation;
  readonly #operatorControl: OperatorControlRuntime;
  /** 全场唯一的零空间能力实体实例目录。 */
  readonly abilityEntities: LogicalAbilityEntityRuntime;
  /** 动态生成的实体子技能程序在整个切面树中保持同一编号与动作槽位映射。 */
  readonly abilityEntityChildSkillPrograms: AbilityEntityChildSkillPrograms;
  /** 所有技能、Buff、被动和装备宿主共用的固定动作槽目录。 */
  readonly combatOperationPrograms: CombatOperationPrograms;
  /** 普通技能恢复时按固定身份复用已编译程序和伤害快照槽位。 */
  readonly combatSkillPrograms: CombatSkillPrograms;
  /** syncTimeScale=false 的投射物 duration-finish 使用全局战斗时间，且不归技能寿命所有。 */
  readonly #abilityEntityInstanceIds: AbilityEntityInstanceIdAllocator;
  readonly projectileLifetimes: ProjectileLifecycleRuntime;
  /** 战斗级父实例与队员子 Buff 镜像的唯一目录。 */
  readonly globalBuffs: GlobalBuffRuntime;
  /** 实际运行时干员；Buff 生命周期按宿主切换执行身份时复用其构筑与面板。 */
  readonly #operators = new Map<string, CombatOperatorProgram>();
  readonly #consumables = new Map<string, ConsumableDefinition>();
  readonly #entityBlackboards = new Map<string, ActionBlackboard>();
  readonly #abilitySystems = new Map<string, AbilitySystemRuntime>();
  readonly #operatorCenters = new Map<string, OperatorCenterStateRuntime>();
  readonly #playerMultiDash: PlayerMultiDashRuntime;
  readonly #playerMultiDashState: PlayerMultiDashState;
  readonly #operatorCenterStates = new Map<string, OperatorCenterState>();
  readonly #skillPrograms = new Map<string, CompiledSkillProgram>();
  readonly #skillStates = new Map<string, Map<string, SkillRuntimeState>>();
  readonly #cooldownStates = new Map<string, Map<string, SkillCooldownState>>();
  /** 外部放置计划的延迟装配器，不属于战斗数据图。 */
  readonly #pendingCastFactories = new Map<string, () => SkillRuntime>();
  readonly #enemyBuffRuntime: EnemyBuffRuntime;
  readonly #operatorBuffs = new Map<string, BuffOperationTarget>();
  readonly #abilityEntityBuffs = new Map<number, AbilityEntityBuffRuntime>();
  readonly #operatorOrder: string[] = [];
  readonly #enemyTimedMarkers: TimedMarkerContainer;
  readonly #operatorTimedMarkers = new Map<string, TimedMarkerContainer>();
  readonly #globalCooldowns: GlobalCooldowns;
  readonly #skillCastIds: SkillCastIdAllocator;
  readonly #basicAttackSkillCastInheritance: BasicAttackSkillCastInheritanceRegistry;
  /** 原生 ChangeSkillAction 每槽只允许一个有效句柄；新句柄会先结束旧句柄。 */
  /** 同一干员同一技能的所有放置块共用一份冷却事实。 */
  readonly #skillCooldowns = new Map<
    string,
    {
      readonly cooldown: SkillCooldown;
      readonly program: CompiledSkillCooldownProgram;
      readonly skillIds: Set<string>;
      readonly periodFrames?: number;
      readonly commitFrame?: number;
    }
  >();
  readonly #nativeSkillKeys = new Map<string, string>();
  readonly #ambiguousNativeSkillKeys = new Set<string>();
  readonly #equipmentEventRuntimes = new Map<string, EquipmentEventRuntime>();
  readonly #operatorUpgradeEventRuntimes: OperatorUpgradeEventRuntime[] = [];
  readonly #operatorUpgradeEventStates = new Map<string, OperatorUpgradeEventState>();
  readonly #operatorComboConditionStates = new Map<string, Map<string, ComboSkillConditionState>>();
  readonly #comboConditionRegistrations: AbilityEventRegistration[] = [];
  /** 保留常驻监听步骤的所有者，便于后续补充场景卸载时的对称注销。 */
  readonly #passiveAbilityEvents: PassiveAbilityEventRuntime[] = [];
  readonly #operatorPassiveStates = new Map<string, Map<string, PassiveAbilityEventState>>();
  readonly #operatorInitializationStates = new Map<
    string,
    Map<string, OperatorInitializationState>
  >();
  /** 每个能力实体实例独占自身的原生被动 Ability；实体结束时立即对称注销。 */
  readonly #abilityEntityPassiveEvents = new Map<number, PassiveAbilityEventRuntime[]>();
  /** 原生被动 Ability 持有的 asChildBuff；被动在整场固定战斗中常驻。 */
  /** 只复用解释链的构造上下文；每个 Buff 实例必须独占有状态的动作执行器。 */
  readonly #reactiveOperationBindings = new Map<string, () => CombatOperationExecutor>();
  readonly #castOperationBindings = new Map<
    string,
    readonly {
      readonly operator: CombatOperatorProgram;
      readonly program: CompiledSkillProgram;
    }[]
  >();
  /** 无 castId 的原生内部技能 key 只在所属干员内唯一，不能与玩家块的全局身份混用。 */
  readonly #unboundSkillOperationBindings = new Map<
    string,
    readonly {
      readonly operator: CombatOperatorProgram;
      readonly program: CompiledSkillProgram;
    }[]
  >();

  static restore(options: CombatRuntimeAssemblyRestoreOptions): CombatRuntimeAssembly {
    const preparation = prepareCombatRuntimeRestore(
      options.graph,
      options.operators,
      options.combatSkillPrograms,
    );
    return new CombatRuntimeAssembly({} as CombatRuntimeAssemblyOptions, {
      preparation,
      options,
    });
  }

  constructor(
    inputOptions: CombatRuntimeAssemblyOptions,
    restored?: PreparedCombatRuntimeAssemblyRestore,
  ) {
    let options = inputOptions;
    let restoredFoundation: RestoredCombatRuntimeFoundation | undefined;
    if (restored === undefined) {
      this.abilityEntityChildSkillPrograms =
        options.abilityEntityChildSkillPrograms ?? new AbilityEntityChildSkillPrograms();
      this.combatOperationPrograms =
        options.combatOperationPrograms ?? new CombatOperationPrograms();
      this.combatSkillPrograms = options.combatSkillPrograms ?? new CombatSkillPrograms();
    } else {
      const restoreOptions = restored.options;
      this.abilityEntityChildSkillPrograms = restoreOptions.abilityEntityChildSkillPrograms;
      this.combatOperationPrograms = restoreOptions.combatOperationPrograms;
      this.combatSkillPrograms = restoreOptions.combatSkillPrograms;
      restoredFoundation = bindRestoredCombatRuntimeFoundation({
        preparation: restored.preparation,
        shared: {
          receipt: new CombatReceiptCollector(restoreOptions.receiptHistory),
          comboSkillPendingInterval: restoreOptions.comboSkillPendingInterval,
          comboSkillOrder: restoreOptions.comboSkillOrder,
          resources: restoreOptions.resources,
          resourceResolvers: {
            ultimateEnergyGainMultiplier: operatorId =>
              restoredFoundation!.environment.runtimeOptions.resolveUltimateEnergyGainMultiplier?.(
                operatorId,
              ) ??
              restoreOptions.graph.shared.resources.squad.find(
                member => member.operatorId === operatorId,
              )!.ultimateEnergyGainMultiplier,
          },
          ...(restoreOptions.timeDilation === undefined
            ? {}
            : {
                timeDilation: {
                  config: restoreOptions.timeDilation.config,
                  observer: {
                    started: (kind, instance, entityId) =>
                      this.#recordTimeDilation('TimeDilationStarted', kind, instance, entityId),
                    rejected: (kind, instance, entityId) =>
                      this.#recordTimeDilation('TimeDilationRejected', kind, instance, entityId),
                    ended: (kind, instance, reason, entityId) =>
                      this.#recordTimeDilation(
                        'TimeDilationEnded',
                        kind,
                        instance,
                        entityId,
                        reason,
                      ),
                  },
                },
              }),
        },
        ...(restoreOptions.timeDilation === undefined
          ? {}
          : { timeDilationPrograms: restoreOptions.timeDilation.programs }),
        environment: restoreOptions.environment,
        enemy: restoreOptions.enemy,
        resolveProjectileRuntimeDependencies: definitionOperatorId =>
          this.#projectileRuntimeDependencies(definitionOperatorId),
      });
      options = {
        resources: restoreOptions.resources,
        enemy: restoreOptions.enemy,
        operators: [...restored.preparation.programs.values()],
        ...(restoreOptions.consumables === undefined
          ? {}
          : { consumables: restoreOptions.consumables }),
        ...(restoreOptions.consumableUses === undefined
          ? {}
          : { consumableUses: restoreOptions.consumableUses }),
        ...(restoreOptions.dodgeInputs === undefined
          ? {}
          : { dodgeInputs: restoreOptions.dodgeInputs }),
        ...(restoreOptions.inputs === undefined ? {} : { inputs: restoreOptions.inputs }),
        ...(restoreOptions.skillInputGroups === undefined
          ? {}
          : { skillInputGroups: restoreOptions.skillInputGroups }),
        ...(restoreOptions.externalEvents === undefined
          ? {}
          : { externalEvents: restoreOptions.externalEvents }),
        ...restoredFoundation.environment.runtimeOptions,
        abilityEntityChildSkillPrograms: restoreOptions.abilityEntityChildSkillPrograms,
        combatOperationPrograms: restoreOptions.combatOperationPrograms,
        combatSkillPrograms: restoreOptions.combatSkillPrograms,
        ...(restoreOptions.timeDilation === undefined
          ? {}
          : { timeDilation: { config: restoreOptions.timeDilation.config } }),
        ...getCombatRuntimeInputRules(restoreOptions),
        ...(restoreOptions.environment.isOperatorControlled === undefined
          ? {}
          : { isOperatorControlled: restoreOptions.environment.isOperatorControlled }),
        operatorControl: restoreOptions.operatorControl,
      };
    }

    for (const definition of options.consumables ?? []) {
      if (this.#consumables.has(definition.id)) {
        throw new Error(`duplicate consumable '${definition.id}'`);
      }
      this.#consumables.set(definition.id, definition);
    }
    const externalControlQuery = options.isOperatorControlled;
    const hasControlQuery =
      options.operatorControl !== undefined || externalControlQuery !== undefined;
    const controlState =
      restored?.preparation.graph.inputs.control ??
      new Map(
        options.operators.map(operator => [
          operator.operatorId,
          options.operatorControl === undefined
            ? (externalControlQuery?.(operator.operatorId, options.initialFrame ?? 0) ?? false)
            : operator.operatorId === options.operatorControl.initialOperatorId,
        ]),
      );
    if (hasControlQuery) {
      options = {
        ...options,
        isOperatorControlled: operatorId => controlState.get(operatorId) ?? false,
      };
    }
    this.#options = options;
    this.#dodgeInputState = restored?.preparation.graph.inputs.dodges ?? createDodgeInputState();
    this.#castParameters = restored?.preparation.graph.inputs.castParameters ?? new Map();
    if (options.deferInitialInput || restored?.preparation.graph.inputs.initialInputPending) {
      this.#requireLiveInputs();
    }
    if (restored !== undefined) {
      const preparation = restored.preparation;
      const foundation = restoredFoundation!;
      this.#frameEndEvents = foundation.boundEnvironment.frameEndEvents;
      const sharedRuntime = foundation.shared;
      this.#playerMultiDashState = sharedRuntime.runtimeState.multiDash;
      this.#playerMultiDash = new PlayerMultiDashRuntime(options.dashTiming);
      this.clock = sharedRuntime.clock;
      this.resources = sharedRuntime.resources;
      this.receipt = sharedRuntime.receipt;
      this.#operatorControl = new OperatorControlRuntime({
        clock: this.clock,
        state: controlState,
        configuration: options.operatorControl,
        readControl: externalControlQuery,
        emit: options.emitAbilityEvent,
        receipt: this.receipt,
      });
      this.ultimatePresentation = sharedRuntime.ultimatePresentation;
      this.comboWindows = sharedRuntime.comboWindows;
      this.timeDilation = sharedRuntime.timeDilation;
      this.#globalCooldowns = sharedRuntime.globalCooldowns;
      this.#abilityEntityInstanceIds = sharedRuntime.abilityEntityInstanceIds;
      this.sharedState = sharedRuntime.runtimeState;
      this.#skillCastIds = sharedRuntime.skillCastIds;
      this.#basicAttackSkillCastInheritance = sharedRuntime.basicAttackInheritance;
      this.semanticEvents = foundation.semanticEvents;
      this.#enemyBuffRuntime = foundation.enemyBuffTarget as EnemyBuffRuntime;
      this.#enemyTimedMarkers = new TimedMarkerContainer(
        'enemy',
        this.timeDilation?.getEntityClock('enemy') ?? this.clock,
        undefined,
        preparation.graph.enemy.timedMarkers,
        { globalScaled: this.timeDilation ?? this.clock },
      );

      for (const [operatorId, program] of preparation.programs) {
        const buffRuntime = foundation.operatorBuffTargets.get(operatorId);
        if (buffRuntime === undefined) {
          throw new Error(`restored operator '${operatorId}' has no Buff target`);
        }
        const runtimeOperator = { ...program, buffRuntime };
        this.#operators.set(operatorId, runtimeOperator);
        this.#operatorBuffs.set(operatorId, buffRuntime);
        this.#operatorOrder.push(operatorId);
        const state = preparation.operators.get(operatorId)!;
        this.#entityBlackboards.set(
          operatorId,
          ActionBlackboard.bindRuntimeState(state.blackboard),
        );
        this.#registerOperatorSkillPrograms(runtimeOperator);
        for (const sourceActionId of [
          ...(runtimeOperator.equipmentContributions ?? []).flatMap(contribution =>
            contribution.eventHandlers.map(
              handler =>
                `equipment:${contribution.source.kind}:${contribution.source.slug}:${handler.key}`,
            ),
          ),
          ...(runtimeOperator.passivePrograms ?? []).map(program => `passive:${program.key}`),
          ...(runtimeOperator.initializationPrograms ?? []).map(
            program => `upgrade-initialization:${program.key}`,
          ),
          ...(runtimeOperator.upgradeEventPrograms ?? []).map(
            program => `upgrade-event:${program.key}`,
          ),
          ...(runtimeOperator.comboConditionPrograms ?? []).map(
            program => `native-combo-condition:${program.key}`,
          ),
          ...(runtimeOperator.dodgeProgram?.dashBuffs.length ? [CENTER_DASH_ACTION_ID] : []),
        ]) {
          this.#registerRestoredReactiveOperationBinding(runtimeOperator, sourceActionId, options);
        }
      }

      this.projectileLifetimes = createRestoredCombatProjectileDirectory({
        preparation,
        foundation,
        callbackPrograms: restored.options.projectileCallbackPrograms,
        buffLifecycle: this.#projectileBuffLifecycle(),
      });
      const entities = bindRestoredCombatAbilityEntityDirectory({
        preparation,
        foundation,
        hooks: this.#createAbilityEntityEventHooks(),
        resolveDynamicBuffs: instanceId => this.#abilityEntityBuffs.get(instanceId),
      });
      this.abilityEntities = entities.runtime;
      for (const [instanceId, state] of preparation.graph.instances.abilityEntities.instances) {
        const operator = this.#operators.get(state.ownerId);
        const definition =
          operator === undefined
            ? undefined
            : resolveRestoredAbilityEntityDefinition(operator, state, this.combatOperationPrograms);
        if (operator !== undefined && definition !== undefined) {
          for (const passive of definition.passiveSkills ?? []) {
            this.#registerRestoredReactiveOperationBinding(
              operator,
              `ability-entity:${instanceId}:passive:${passive.key}`,
              options,
            );
          }
        }
        if (!state.buffContainerCreated) continue;
        const target = entities.targets.get(logicalAbilityEntityRuntimeId(instanceId));
        if (target === undefined) {
          throw new Error(`restored AbilityEntity '${instanceId}' has no Buff target`);
        }
        this.#abilityEntityBuffs.set(instanceId, target as AbilityEntityBuffRuntime);
      }
      for (const [instanceId, state] of preparation.graph.instances.projectiles.instances) {
        if (state.buffs === null) continue;
        const target = entities.targets.get(logicalAbilityEntityRuntimeId(instanceId));
        if (target === undefined)
          throw new Error(`restored projectile '${instanceId}' has no Buff target`);
        this.#abilityEntityBuffs.set(instanceId, target as AbilityEntityBuffRuntime);
      }
      configureRestoredCombatObjectReferences({ entities, projectiles: this.projectileLifetimes });
      for (const target of entities.targets.values()) this.#configureBuffLifecycle(target, options);

      // 新建装配通过 #requirePartyBuffTargets 使用 CharacterTeamFinder 的逆序。
      // 恢复装配必须保持同一顺序，否则群体 Buff 的实例编号和事件先后会在分支中改变。
      const partyTargets = [...preparation.programs.keys()].reverse().map(operatorId => {
        const target = entities.targets.get(operatorId);
        if (target === undefined) {
          throw new Error(`restored party Buff target '${operatorId}' is missing`);
        }
        return target;
      });
      this.globalBuffs = new GlobalBuffRuntime(
        () => partyTargets,
        (sourceOperatorId, buffId) => {
          if (sourceOperatorId !== 'battle') {
            return this.#operators.get(sourceOperatorId)?.buffDefinitions?.[buffId];
          }
          for (const operator of this.#operators.values()) {
            const definition = operator.buffDefinitions?.[buffId];
            if (definition !== undefined) return definition;
          }
          return undefined;
        },
        this.resources.sharedSpGainModifiers,
        this.resources.sharedSpRecoveryModifiers,
        preparation.graph.instances.globalBuffs,
        (state, producedBy) => this.#recordGlobalBuffCreated(state, producedBy),
      );

      const buffs = bindRestoredCombatBuffInstances({
        preparation,
        foundation,
        entities,
        globalBuffs: this.globalBuffs,
        resolveDefinition: (definitionOwnerId, definitionId) =>
          this.#operators.get(definitionOwnerId)?.buffDefinitions?.[definitionId],
        resolveGlobalDefinition: (
          _sourceId,
          id,
          _sourceActionOwnerId,
          _sourceActionId,
          definitionProgramId,
        ) => {
          if (definitionProgramId === null) {
            throw new Error(`restored global Buff '${id}' has no fixed definition program`);
          }
          const step =
            this.combatOperationPrograms.resolve<ResolvedCombatOperationStep>(definitionProgramId);
          if (step.kind !== 'createGlobalBuff' || step.parameters.globalBuffId !== id) {
            throw new Error(`restored global Buff '${id}' definition program does not match`);
          }
          return step.parameters.definition;
        },
      });

      const operators = bindRestoredCombatRuntimeOperators({
        preparation,
        foundation,
        entities,
        createCoreBindings: operator => ({
          createSkillDependencies: (binding, context) =>
            this.#createSkillDependencies({
              operator,
              program: binding.program,
              castId: binding.state.castId,
              enemy: options.enemy,
              entityBlackboard: context.blackboard,
              createDelegate: options.createOperationExecutor,
              isOperatorControlled: options.isOperatorControlled,
              resolveVitals: options.resolveVitals,
              resolveOperatorVitals: options.resolveOperatorVitals,
              operationState: binding.state.operations,
              getNonReturnedSpCost: () => binding.state.execution.nonReturnedSpCost,
            }),
          abilityRuntime: this.#createAbilityRuntimeBindings(operator.operatorId),
          onCooldownReady: skillId =>
            this.receipt.record({
              frame: this.clock.frame,
              time: this.clock.time,
              event: 'SkillCooldownReady',
              sourceId: operator.operatorId,
              data: { skillId },
            }),
        }),
        onCoreBound: (operator, core) => {
          this.#operators.set(operator.operatorId, operator);
          this.#entityBlackboards.set(operator.operatorId, core.blackboard);
          this.#abilitySystems.set(operator.operatorId, core.ability);
          this.#bindOperatorCenter(
            operator,
            preparation.operators.get(operator.operatorId)!.center,
            options,
          );
          this.#operatorTimedMarkers.set(operator.operatorId, core.timedMarkers);
          const state = preparation.operators.get(operator.operatorId)!;
          this.#skillStates.set(operator.operatorId, state.skills);
          this.#cooldownStates.set(operator.operatorId, state.cooldowns);
          for (const [skillId, binding] of core.cooldowns) {
            this.#skillCooldowns.set(`${operator.operatorId}\u0000${skillId}`, {
              cooldown: binding.cooldown,
              program: binding.program,
              skillIds: new Set(binding.skillIds),
              ...binding.configuration,
            });
          }
          this.#restorePendingCastFactories(operator, core, options);
        },
        createSourceBindings: operator => ({
          createEquipmentExecutor: context =>
            this.#createEquipmentEventOperationChain(operator, context, options),
          registerEquipmentAbilityEventAction: options.registerEquipmentAbilityEventAction,
          createInitializationOperations: (program, state) => {
            const sourceActionId = `upgrade-initialization:${program.key}`;
            return this.#createReactiveOperationChain(
              operator,
              sourceActionId,
              this.#createReactiveTerminal(operator, sourceActionId, options),
              options,
              state.operations,
            );
          },
          createPassiveOperations: (program, state) => {
            const sourceActionId = `passive:${program.key}`;
            return this.#createReactiveOperationChain(
              operator,
              sourceActionId,
              this.#createReactiveTerminal(operator, sourceActionId, options),
              options,
              state.operations,
            );
          },
          registerPassive: (event, priority, handle, subscriptions) => {
            const register = options.registerPassiveAbilityEventAction;
            if (register === undefined) {
              throw new Error(
                `operator '${operator.operatorId}' passive requires event registration`,
              );
            }
            return register(operator.operatorId, event, priority, handle, subscriptions);
          },
          createUpgradeExecutor: context => {
            const sourceActionId = `upgrade-event:${context.programKey}`;
            return this.#createReactiveOperationChain(
              operator,
              sourceActionId,
              this.#createReactiveTerminal(operator, sourceActionId, options),
              options,
            );
          },
        }),
        onSourcesBound: (operator, sources) => {
          if (sources.equipment !== null) {
            this.#equipmentEventRuntimes.set(operator.operatorId, sources.equipment.runtime);
          }
          if (sources.upgradeEvents !== null) {
            this.#operatorUpgradeEventRuntimes.push(sources.upgradeEvents);
            this.#operatorUpgradeEventStates.set(
              operator.operatorId,
              sources.upgradeEvents.runtimeState,
            );
          }
          this.#operatorInitializationStates.set(
            operator.operatorId,
            preparation.operators.get(operator.operatorId)!.initializations,
          );
          this.#operatorPassiveStates.set(
            operator.operatorId,
            preparation.operators.get(operator.operatorId)!.passives,
          );
          this.#operatorComboConditionStates.set(
            operator.operatorId,
            preparation.operators.get(operator.operatorId)!.comboConditions,
          );
          this.#passiveAbilityEvents.push(...sources.passives.runtimes.values());
        },
      });
      operators.bindRestoredChildren();

      const abilityEntityRelations = bindRestoredCombatRuntimeAbilityEntityRelations({
        preparation,
        foundation,
        entities,
        operators,
        childSkillPrograms: this.abilityEntityChildSkillPrograms,
        combatOperationPrograms: this.combatOperationPrograms,
        createPassiveOperations: ({ ownerId, entity, program, state }) => {
          const operator = this.#operators.get(ownerId)!;
          const sourceActionId = `ability-entity:${entity.instanceId}:passive:${program.key}`;
          return this.#createReactiveOperationChain(
            operator,
            sourceActionId,
            this.#createReactiveTerminal(operator, sourceActionId, options),
            options,
            state.operations,
          );
        },
        registerPassive: (entityId, event, priority, handle, subscriptions) => {
          const register = options.registerPassiveAbilityEventAction;
          if (register === undefined) {
            throw new Error(`AbilityEntity '${entityId}' passive requires event registration`);
          }
          return register(entityId, event, priority, handle, subscriptions);
        },
        createChildSkillBindings: ({ ownerId, entity, state }) => {
          const operator = this.#operators.get(ownerId)!;
          const fixed = this.abilityEntityChildSkillPrograms.resolve(state.programId);
          const entityState = this.abilityEntities.runtimeState.instances.get(entity.instanceId)!;
          const origin = entityState.skillCastInfo;
          const originProgram =
            origin == null
              ? undefined
              : (this.#skillPrograms.get(
                  `${ownerId}\u0000${origin.originSkillId}\u0000${origin.originCastId ?? ''}`,
                ) ?? this.#skillPrograms.get(`${ownerId}\u0000${origin.originSkillId}\u0000`));
          return {
            operations: this.#createOperationChain({
              operator,
              sourceActionId:
                origin?.originCastId ?? origin?.originSkillId ?? fixed.program.skillId,
              ...(origin?.originCastId === undefined ? {} : { castId: origin.originCastId }),
              program: originProgram ?? { ...fixed.program, operatorId: ownerId, costs: [] },
              enemy: options.enemy,
              createDelegate: options.createOperationExecutor,
              isOperatorControlled: options.isOperatorControlled,
              resolveVitals: options.resolveVitals,
              resolveOperatorVitals: options.resolveOperatorVitals,
              getNonReturnedSpCost: () => origin?.nonReturnedSpCost ?? 0,
              operationHost: {
                state: state.host.skill.operations,
                programs: this.combatOperationPrograms,
              },
            }),
            ...this.#projectileRuntimeDependencies(ownerId),
          };
        },
      });
      for (const [instanceId, passives] of abilityEntityRelations.passives) {
        this.#abilityEntityPassiveEvents.set(instanceId, [...passives.runtimes.values()]);
      }

      // Buff 的 SkillAffix 先接回投射物 reset 监听，投射物随后核对完整的监听登记。
      buffs.restoration.bindRelations();
      bindRestoredCombatProjectileRelations({
        projectiles: this.projectileLifetimes,
        foundation,
        entities,
        createCallbackBindings: ({ definitionOperatorId, state }) => {
          const operator = this.#operators.get(definitionOperatorId)!;
          const program = restored.options.projectileCallbackPrograms.resolve(state.programId!);
          const origin = state.skillCastInfo;
          const originProgram =
            origin === null
              ? undefined
              : (this.#skillPrograms.get(
                  `${definitionOperatorId}\u0000${origin.originSkillId}\u0000${origin.originCastId ?? ''}`,
                ) ??
                this.#skillPrograms.get(
                  `${definitionOperatorId}\u0000${origin.originSkillId}\u0000`,
                ));
          const operations = this.#createOperationChain({
            operator,
            sourceActionId: origin?.originCastId ?? origin?.originSkillId ?? program.skillId,
            ...(origin?.originCastId === undefined ? {} : { castId: origin.originCastId }),
            program: {
              operatorId: definitionOperatorId,
              skillId: originProgram?.skillId ?? origin?.originSkillId ?? program.skillId,
              ...(originProgram?.skillGroupKey === undefined
                ? {}
                : { skillGroupKey: originProgram.skillGroupKey }),
              ...(state.skillCastInfo === null
                ? {}
                : { skillType: state.skillCastInfo.originSkillType }),
              nativeSkillType: program.nativeSkillType,
              ...(program.normalSkillSubType === undefined
                ? {}
                : { normalSkillSubType: program.normalSkillSubType }),
              element: program.element,
              naturalDurationFrames: program.naturalDurationFrames,
              initialBlackboard: program.initialBlackboard,
              timelineActions: program.timelineActions,
              costFrame: program.castResource.costFrame,
              costs: [program.castResource.cost],
            },
            enemy: options.enemy,
            createDelegate: options.createOperationExecutor,
            isOperatorControlled: options.isOperatorControlled,
            resolveVitals: options.resolveVitals,
            resolveOperatorVitals: options.resolveOperatorVitals,
            getNonReturnedSpCost: () => state.skillCastInfo?.nonReturnedSpCost ?? 0,
            ...(state.host === null
              ? {}
              : {
                  operationHost: {
                    state: state.host.skill.operations,
                    programs: this.combatOperationPrograms,
                  },
                }),
          });
          return { operations, ...this.#projectileRuntimeDependencies(definitionOperatorId) };
        },
      });
      this.#installComboSkillConditions(true);

      this.#inputRuntime = this.#createCombatInputRuntime(options, preparation.graph.inputs.skills);
      this.#dodgeInputRuntime = this.#createDodgeInputRuntime(options);
      this.#externalEventRuntime = this.#createExternalCombatEventRuntime(
        options,
        preparation.graph.inputs.externalEvents,
      );

      const frame = bindRestoredCombatRuntimeFrame({
        preparation,
        foundation,
        entities,
        objects: {
          projectiles: this.projectileLifetimes,
          buffs,
          operators,
        },
        bindInputPhases: true,
        control: this.#operatorControl,
        playerMultiDash: {
          advanceFrame: () =>
            this.#playerMultiDash.advanceFrame(
              this.#playerMultiDashState,
              this.timeDilation?.currentGlobalScale ?? 1,
            ),
        },
        operatorCenters: this.#centerFrameRuntimes(),
      });
      this.simulation = frame.simulation;
      this.#scheduledFrameInputs = {
        skillInputs: () => {
          this.#applyScheduledConsumables();
          this.#dodgeInputRuntime.applyCurrentFrame(this.#dodgeInputState);
          this.#inputRuntime.applyCurrentFrame();
        },
        externalEvents: () => this.#externalEventRuntime.applyCurrentFrame(),
      };
      this.stateGraph = preparation.graph;
      return;
    }
    const sharedRuntime = new CombatSharedRuntime({
      comboSkillPendingInterval: options.comboSkillPendingInterval,
      resources: options.resources,
      resourceResolvers: {
        ultimateEnergyGainMultiplier: options.resolveUltimateEnergyGainMultiplier,
      },
      operatorOrder: options.operators.map(operator => operator.operatorId),
      comboSkillOrder: options.comboSkillOrder,
      ...(options.initialFrame === undefined ? {} : { initialFrame: options.initialFrame }),
      ...(options.receipt === undefined ? {} : { receipt: options.receipt }),
      ...(options.timeDilation === undefined
        ? {}
        : {
            timeDilation: {
              config: options.timeDilation.config,
              observer: {
                started: (kind, instance, entityId) =>
                  this.#recordTimeDilation('TimeDilationStarted', kind, instance, entityId),
                rejected: (kind, instance, entityId) =>
                  this.#recordTimeDilation('TimeDilationRejected', kind, instance, entityId),
                ended: (kind, instance, reason, entityId) =>
                  this.#recordTimeDilation('TimeDilationEnded', kind, instance, entityId, reason),
              },
            },
          }),
    });
    this.#playerMultiDashState = sharedRuntime.runtimeState.multiDash;
    this.#playerMultiDash = new PlayerMultiDashRuntime(options.dashTiming);
    this.clock = sharedRuntime.clock;
    this.resources = sharedRuntime.resources;
    this.receipt = sharedRuntime.receipt;
    this.#operatorControl = new OperatorControlRuntime({
      clock: this.clock,
      state: controlState,
      configuration: options.operatorControl,
      readControl: externalControlQuery,
      emit: options.emitAbilityEvent,
      receipt: this.receipt,
    });
    this.ultimatePresentation = sharedRuntime.ultimatePresentation;
    this.comboWindows = sharedRuntime.comboWindows;
    this.timeDilation = sharedRuntime.timeDilation;
    this.#globalCooldowns = sharedRuntime.globalCooldowns;
    this.#abilityEntityInstanceIds = sharedRuntime.abilityEntityInstanceIds;
    this.sharedState = sharedRuntime.runtimeState;
    this.#skillCastIds = sharedRuntime.skillCastIds;
    this.#basicAttackSkillCastInheritance = sharedRuntime.basicAttackInheritance;
    this.simulation = new CombatSimulation(this.clock);
    this.projectileLifetimes = new ProjectileLifecycleRuntime(
      () => this.#abilityEntityInstanceIds.allocate(),
      undefined,
      this.#projectileBuffLifecycle(),
    );
    this.#enemyTimedMarkers = new TimedMarkerContainer(
      'enemy',
      this.timeDilation?.getEntityClock('enemy') ?? this.clock,
    );
    this.globalBuffs = new GlobalBuffRuntime(
      () => this.#requirePartyBuffTargets(),
      (sourceOperatorId, buffId) => {
        if (sourceOperatorId !== 'battle') {
          return this.#operators.get(sourceOperatorId)?.buffDefinitions?.[buffId];
        }
        for (const operator of this.#operators.values()) {
          const definition = operator.buffDefinitions?.[buffId];
          if (definition !== undefined) return definition;
        }
        return undefined;
      },
      this.resources.sharedSpGainModifiers,
      this.resources.sharedSpRecoveryModifiers,
      undefined,
      (state, producedBy) => this.#recordGlobalBuffCreated(state, producedBy),
    );
    const boundBattleRuntimes =
      options.bindBattleRuntime?.({
        isOperatorControlled: operatorId => controlState.get(operatorId) ?? false,
        enemy: options.enemy,
        clock: this.clock,
        resources: this.resources,
        receipt: this.receipt,
        resolveProjectileRuntimeDependencies: definitionOperatorId =>
          this.#projectileRuntimeDependencies(definitionOperatorId),
      }) ?? {};
    // 原生事件目录及其恢复绑定端口属于环境。先绑定环境，再建立依赖它的语义事件层。
    this.#frameEndEvents = boundBattleRuntimes.frameEndEvents;
    this.semanticEvents = new CombatSemanticEventRuntime(options.registerCombatAbilityEvent);
    this.abilityEntities = new LogicalAbilityEntityRuntime({
      allocateInstanceId: () => this.#abilityEntityInstanceIds.allocate(),
      timedMarkerClocks: {
        globalScaled: this.timeDilation ?? this.clock,
      },
      resolveDeltaSeconds: entity =>
        COMBAT_FRAME_INTERVAL *
        (this.timeDilation?.getEntityScale(logicalAbilityEntityRuntimeId(entity.instanceId)) ?? 1),
      hooks: {
        tickBuffs: entity => {
          const runtime = this.#abilityEntityBuffs.get(entity.instanceId);
          if (runtime === undefined) return;
          runtime.advanceWithDeltas(
            this.timeDilation === null
              ? {
                  defaultDeltaSeconds: COMBAT_FRAME_INTERVAL,
                  globalAndSelfScaledDeltaSeconds: COMBAT_FRAME_INTERVAL,
                  globalScaledDeltaSeconds: COMBAT_FRAME_INTERVAL,
                  selfScaledDeltaSeconds: COMBAT_FRAME_INTERVAL,
                  skillCooldownDeltaSeconds: COMBAT_FRAME_INTERVAL,
                }
              : this.timeDilation.getAbilityTickDeltas(
                  logicalAbilityEntityRuntimeId(entity.instanceId),
                  COMBAT_FRAME_INTERVAL,
                ),
          );
        },
        recycleBuffs: entity =>
          this.#abilityEntityBuffs.get(entity.instanceId)?.recycleFinishedBuffs?.(),
        ...this.#createAbilityEntityEventHooks(),
      },
    });
    if (options.enemyBuffRuntime.ownerId !== 'enemy') {
      throw new Error(`enemy Buff runtime owner must be 'enemy'`);
    }
    this.#enemyBuffRuntime = options.enemyBuffRuntime;

    for (const operator of options.operators) {
      if (this.#abilitySystems.has(operator.operatorId)) {
        throw new Error(`duplicate combat operator '${operator.operatorId}'`);
      }
      const buffRuntime =
        operator.buffRuntime ??
        options.createOperatorBuffRuntime?.(
          operator.operatorId,
          operator.panel,
          operator.reactionModifiers,
        );
      const runtimeOperator =
        buffRuntime === operator.buffRuntime ? operator : { ...operator, buffRuntime };
      this.#operators.set(operator.operatorId, runtimeOperator);
      const entityBlackboard = buffRuntime?.entityBlackboard ?? new ActionBlackboard();
      entityBlackboard.assign(operator.initialEntityBlackboard);
      this.#entityBlackboards.set(operator.operatorId, entityBlackboard);
      this.#operatorOrder.push(operator.operatorId);
      if (buffRuntime !== undefined) {
        this.#operatorBuffs.set(operator.operatorId, buffRuntime);
      }
      this.#operatorTimedMarkers.set(
        operator.operatorId,
        new TimedMarkerContainer(
          operator.operatorId,
          this.timeDilation?.getEntityClock(operator.operatorId) ?? this.clock,
        ),
      );
      const hiddenSkillPrograms = this.#registerOperatorSkillPrograms(runtimeOperator);
      // 放置块自定义定义仍是实际执行体；同 ID 的其他块必须保持冷却一致。
      // 原目录保留推进顺序，额外自定义身份追加；不执行静态目录中的任何技能动作。
      const cooldownPrograms = new Map<string, CompiledSkillCooldownProgram>();
      for (const program of runtimeOperator.skillCooldownPrograms ?? []) {
        if (program.operatorId !== operator.operatorId)
          throw new Error(`static cooldown '${program.skillId}' belongs to another operator`);
        if (cooldownPrograms.has(program.skillId))
          throw new Error(`duplicate static cooldown '${program.skillId}'`);
        cooldownPrograms.set(program.skillId, program);
      }
      const placedCooldownPrograms = new Map<string, CompiledSkillProgram>();
      for (const program of [
        ...runtimeOperator.skills,
        ...(runtimeOperator.skillCasts ?? []).map(binding => binding.program),
      ]) {
        const previous = placedCooldownPrograms.get(program.skillId);
        if (previous !== undefined) {
          if (
            previous.cooldownFrames !== program.cooldownFrames ||
            previous.skillType !== program.skillType ||
            (program.cooldownFrames !== undefined && previous.costFrame !== program.costFrame)
          ) {
            throw new Error(
              `skill '${program.skillId}' of '${operator.operatorId}' has inconsistent cooldown configuration`,
            );
          }
          continue;
        }
        placedCooldownPrograms.set(program.skillId, program);
        cooldownPrograms.set(program.skillId, program);
      }
      for (const program of cooldownPrograms.values())
        this.#resolveSkillCooldown(runtimeOperator, program);
      const skills: SkillRuntime[] = [];
      const allPrograms = [...runtimeOperator.skills, ...hiddenSkillPrograms];
      for (const program of allPrograms) {
        skills.push(
          this.#createSkillRuntime(
            runtimeOperator,
            program,
            cooldownPrograms.get(program.skillId)!,
            options.enemy,
            entityBlackboard,
            options.createOperationExecutor,
            options.isOperatorControlled,
            options.resolveVitals,
            options.resolveOperatorVitals,
          ),
        );
      }
      const definitionIds = new Set(allPrograms.map(program => program.skillId));
      for (const { castId, program } of runtimeOperator.skillCasts ?? []) {
        if (!definitionIds.has(program.skillId)) {
          throw new Error(
            `combat cast '${operator.operatorId}:${program.skillId}:${castId}' has no fixed definition`,
          );
        }
        const key = `${operator.operatorId}\u0000${program.skillId}\u0000${castId}`;
        this.#pendingCastFactories.set(key, () =>
          this.#createSkillRuntime(
            runtimeOperator,
            program,
            cooldownPrograms.get(program.skillId)!,
            options.enemy,
            entityBlackboard,
            options.createOperationExecutor,
            options.isOperatorControlled,
            options.resolveVitals,
            options.resolveOperatorVitals,
            castId,
          ),
        );
      }
      this.#abilitySystems.set(
        operator.operatorId,
        new AbilitySystemRuntime({
          ...this.#createAbilityRuntimeBindings(operator.operatorId),
          buffRuntime,
          skills,
          skillDefinitions: [...cooldownPrograms.values()],
          skillTickPlan: [...cooldownPrograms.keys()].map(skillId => {
            const ledger = this.#skillCooldowns.get(`${operator.operatorId}\u0000${skillId}`)!;
            if (ledger.cooldown.runtimeState.timer === undefined) return { skillId };
            return {
              skillId,
              advanceCooldown: deltaSeconds => {
                if (ledger.cooldown.ready) return;
                const recoveryScalar =
                  ledger.program.skillType === 'comboSkill'
                    ? (runtimeOperator.buffRuntime?.getAttributeValue?.(
                        'ComboSkillCooldownRecoveryScalar',
                      ) ?? 1)
                    : 1;
                if (!Number.isFinite(recoveryScalar) || recoveryScalar < 0) {
                  throw new RangeError(
                    `combo skill cooldown recovery scalar of '${operator.operatorId}' must be non-negative and finite, received ${recoveryScalar}`,
                  );
                }
                if (
                  !ledger.cooldown.advance(deltaSeconds * COMBAT_FRAMES_PER_SECOND * recoveryScalar)
                )
                  return;
                // 共享冷却属于技能定义，不能借任意放置块（可能尚未提交）的身份发布。
                this.receipt.record({
                  frame: this.clock.frame,
                  time: this.clock.time,
                  event: 'SkillCooldownReady',
                  sourceId: operator.operatorId,
                  data: { skillId },
                });
              },
            };
          }),
          skillSlotGroups: runtimeOperator.skillSlotGroups,
          playerActionRoutes: runtimeOperator.playerActionRoutes,
          playerActionModes: runtimeOperator.playerActionModes,
          actionRuntime: operator.actionRuntime,
        }),
      );
    }

    for (const operator of this.#operators.values()) {
      this.#bindOperatorCenter(operator, createOperatorCenterState(), options);
    }

    try {
      for (const operator of options.operators) {
        const contributions = operator.equipmentContributions ?? [];
        const hasEvents = contributions.some(contribution => contribution.eventHandlers.length > 0);
        if (
          !hasEvents &&
          !contributions.some(
            contribution =>
              contribution.initializationSequence !== undefined ||
              contribution.enableSequence !== undefined,
          )
        )
          continue;
        if (hasEvents && options.createEquipmentEventOperationExecutor === undefined) {
          throw new Error(
            `operator '${operator.operatorId}' has equipment event handlers but no equipment event executor`,
          );
        }
        this.#equipmentEventRuntimes.set(
          operator.operatorId,
          new EquipmentEventRuntime(
            this.semanticEvents,
            operator.operatorId,
            contributions,
            context => this.#createEquipmentEventOperationChain(operator, context, options),
            options.registerEquipmentAbilityEventAction,
          ),
        );
      }

      for (const operator of options.operators) {
        const programs = operator.upgradeEventPrograms ?? [];
        if (programs.length === 0) continue;
        const runtime = new OperatorUpgradeEventRuntime(
          this.semanticEvents,
          operator.operatorId,
          programs,
          context =>
            this.#createReactiveOperationChain(
              operator,
              `upgrade-event:${context.programKey}`,
              this.#createReactiveTerminal(
                operator,
                `upgrade-event:${context.programKey}`,
                options,
              ),
              options,
            ),
        );
        this.#operatorUpgradeEventRuntimes.push(runtime);
        this.#operatorUpgradeEventStates.set(operator.operatorId, runtime.runtimeState);
      }

      this.#configureBuffLifecycle(this.#enemyBuffRuntime, options);
      for (const target of this.#operatorBuffs.values())
        this.#configureBuffLifecycle(target, options);

      // 所有角色/槽位/操作链就绪后、任何开局动作前注册；构造失败不可遗留外部事件监听。
      this.#installComboSkillConditions();
      // 养成直接附着 Buff 与原生被动都必须晚于实体和 Buff 生命周期装配。
      for (const operator of options.operators) {
        for (const initialization of operator.initializationPrograms ?? []) {
          const operations = this.#createReactiveOperationChain(
            operator,
            `upgrade-initialization:${initialization.key}`,
            this.#createReactiveTerminal(
              operator,
              `upgrade-initialization:${initialization.key}`,
              options,
            ),
            options,
          );
          const blackboard =
            initialization.equipmentContributionIndex === undefined
              ? new ActionBlackboard(initialization.initialBlackboard)
              : this.#equipmentEventRuntimes
                  .get(operator.operatorId)!
                  .blackboardFor(initialization.equipmentContributionIndex);
          const runtime = new CombatActionSequenceRuntime(
            operations,
            {
              blackboard,
              actionOwnerId: operator.operatorId,
              actionSourceId: operator.operatorId,
              ...(initialization.equipmentContributionIndex === undefined
                ? {}
                : {
                    addAbilityChildBuff: (child: BuffApplicationHandle) => {
                      const ability = this.#equipmentEventRuntimes.get(operator.operatorId);
                      if (ability === undefined)
                        throw new Error(
                          `operator '${operator.operatorId}' has no equipment Ability runtime`,
                        );
                      ability.addChildBuff(initialization.equipmentContributionIndex!, child);
                    },
                  }),
            },
            {},
            this.semanticEvents,
            operator.operatorId,
          );
          const initializationSequence = runtime.createSequence(initialization.sequence);
          const enableSequence =
            initialization.enableSequence === undefined
              ? null
              : runtime.createSequence(initialization.enableSequence);
          const operationState = operations.operationHost?.state;
          if (operationState === undefined)
            throw new Error(`initialization '${initialization.key}' has no operation host state`);
          let initializationStates = this.#operatorInitializationStates.get(operator.operatorId);
          if (initializationStates === undefined) {
            initializationStates = new Map();
            this.#operatorInitializationStates.set(operator.operatorId, initializationStates);
          }
          if (initializationStates.has(initialization.key))
            throw new Error(
              `duplicate initialization key '${operator.operatorId}:${initialization.key}'`,
            );
          const initializationState: OperatorInitializationState = {
            key: initialization.key,
            ...(initialization.equipmentContributionIndex === undefined
              ? {}
              : { equipmentContributionIndex: initialization.equipmentContributionIndex }),
            blackboard: blackboard.runtimeState,
            operations: operationState,
            enableSequence: enableSequence?.runtimeState ?? null,
            initializationSequence: initializationSequence.runtimeState,
            initializationExecuted: false,
          };
          initializationStates.set(initialization.key, initializationState);
          if (initialization.enableSequence !== undefined) {
            if (initialization.equipmentContributionIndex === undefined)
              throw new Error(`initialization '${initialization.key}' has no equipment Ability`);
            this.#equipmentEventRuntimes
              .get(operator.operatorId)!
              .onDisable(initialization.equipmentContributionIndex, () => enableSequence!.end({}));
            if (!enableSequence!.tryExecute({}))
              throw new Error(`equipment '${initialization.key}' enable sequence returned false`);
          }
          if (initialization.equipmentContributionIndex !== undefined)
            this.#equipmentEventRuntimes
              .get(operator.operatorId)!
              .enable(initialization.equipmentContributionIndex);
          // 仅有监听的能力也需要走启用位置，但没有初始化动作，不伪造养成初始化回执。
          if (
            initialization.equipmentContributionIndex !== undefined &&
            initialization.enableSequence === undefined &&
            operator.equipmentContributions?.[initialization.equipmentContributionIndex]
              ?.initializationSequence === undefined &&
            isEmptyActionProgram(initialization.sequence)
          )
            continue;
          initializationSequence.executeInstant({});
          initializationState.initializationExecuted = true;
          this.receipt.record({
            frame: this.clock.frame,
            time: this.clock.time,
            event: 'OperatorUpgradeInitialized',
            sourceId: operator.operatorId,
            data: { key: initialization.key },
          });
        }
        this.#equipmentEventRuntimes.get(operator.operatorId)?.assertAllEnabled();
        for (const passive of operator.passivePrograms ?? []) {
          const blackboard = new ActionBlackboard(
            passive.initialBlackboard,
            this.#entityBlackboards.get(operator.operatorId),
          );
          const operations = this.#createReactiveOperationChain(
            operator,
            `passive:${passive.key}`,
            this.#createReactiveTerminal(operator, `passive:${passive.key}`, options),
            options,
          );
          const ownerContext = {
            blackboard,
            actionOwnerId: operator.operatorId,
            actionSourceId: operator.operatorId,
          };
          const eventHost = new PassiveAbilityEventRuntime(
            operations,
            ownerContext,
            passive.abilityEventResponses ?? [],
            (event, priority, handle, subscriptions) => {
              const register = options.registerPassiveAbilityEventAction;
              if (register === undefined)
                throw new Error(`passive '${passive.key}' requires ability event registration`);
              return register(operator.operatorId, event, priority, handle, subscriptions);
            },
          );
          this.#passiveAbilityEvents.push(eventHost);
          let passiveStates = this.#operatorPassiveStates.get(operator.operatorId);
          if (passiveStates === undefined) {
            passiveStates = new Map();
            this.#operatorPassiveStates.set(operator.operatorId, passiveStates);
          }
          if (passiveStates.has(passive.key))
            throw new Error(`duplicate passive key '${operator.operatorId}:${passive.key}'`);
          passiveStates.set(passive.key, eventHost.runtimeState);
          const runtime = new CombatActionSequenceRuntime(
            operations,
            {
              ...ownerContext,
              addAbilityChildBuff: child => eventHost.addChildBuff(child),
            },
            {},
            this.semanticEvents,
            operator.operatorId,
          );
          const sequence = runtime.createSequence(passive.enableSequence);
          eventHost.recordEnableSequence(sequence.runtimeState);
          eventHost.onDisable(() => sequence.end({}));
          if (!sequence.tryExecute({})) {
            throw new Error(`passive skill '${passive.key}' enable sequence returned false`);
          }
          eventHost.enable();
          this.receipt.record({
            frame: this.clock.frame,
            time: this.clock.time,
            event: 'PassiveSkillEnabled',
            sourceId: operator.operatorId,
            data: { passiveKey: passive.key },
          });
        }
      }

      // 原生 OnEnterFight 晚于开局常驻 Buff 的创建与事件注册；本模型一场模拟只入战一次。
      for (const operator of options.operators) {
        options.emitOperatorEnterFight?.(operator.operatorId);
      }

      bindCombatFramePipeline(this.simulation, {
        timeDilation: this.timeDilation,
        control: this.#operatorControl,
        frameEndEvents: boundBattleRuntimes.frameEndEvents,
        enemyControl: boundBattleRuntimes.enemyControlRuntime,
        resources: new CombatResourceRuntime(this.resources, this.clock, this.receipt),
        globalBuffs: this.globalBuffs,
        abilityEntities: this.abilityEntities,
        projectiles: this.projectileLifetimes,
        enemyBuffs: this.#enemyBuffRuntime,
        enemyVitals: boundBattleRuntimes.enemyVitalsRuntime ?? options.enemyVitalsRuntime,
        comboWindows: this.comboWindows,
        playerMultiDash: {
          advanceFrame: () =>
            this.#playerMultiDash.advanceFrame(
              this.#playerMultiDashState,
              this.timeDilation?.currentGlobalScale ?? 1,
            ),
        },
        operatorCenters: this.#centerFrameRuntimes(),
        abilities: options.operators.map(operator =>
          this.#requireAbilitySystem(operator.operatorId),
        ),
        bindInputPhases: true,
      });
      this.#inputRuntime = this.#createCombatInputRuntime(options);
      this.#dodgeInputRuntime = this.#createDodgeInputRuntime(options);
      this.#externalEventRuntime = this.#createExternalCombatEventRuntime(options);
      this.#scheduledFrameInputs = {
        skillInputs: () => {
          this.#applyScheduledConsumables();
          this.#dodgeInputRuntime.applyCurrentFrame(this.#dodgeInputState);
          this.#inputRuntime.applyCurrentFrame();
        },
        externalEvents: () => this.#externalEventRuntime.applyCurrentFrame(),
      };
      if (!options.deferInitialInput) {
        this.#operatorControl.advanceFrame();
        this.#scheduledFrameInputs.skillInputs?.();
        this.#scheduledFrameInputs.externalEvents?.();
        this.#frameEndEvents?.advanceFrame();
      }
    } catch (error) {
      failAfterAbilityHostCleanup(error, [
        () => this.disposeEquipmentEvents(),
        () => this.disposePassiveAbilityEvents(),
        () => this.disposeComboSkillConditions(),
      ]);
    }
    this.stateGraph = {
      shared: this.sharedState,
      inputs: {
        castParameters: this.#castParameters,
        initialInputPending: options.deferInitialInput === true,
        control: this.#operatorControl.runtimeState,
        skills: this.#inputRuntime.runtimeState,
        dodges: this.#dodgeInputState,
        externalEvents: this.#externalEventRuntime.runtimeState,
      },
      environment: boundBattleRuntimes.environmentState ?? null,
      events: {
        native: boundBattleRuntimes.eventStates ?? null,
      },
      operators: new Map(
        [...this.#abilitySystems].map(([operatorId, ability]) => {
          const blackboard = this.#entityBlackboards.get(operatorId);
          if (blackboard === undefined)
            throw new Error(`missing operator blackboard '${operatorId}'`);
          const skills = this.#skillStates.get(operatorId) ?? new Map<string, SkillRuntimeState>();
          this.#skillStates.set(operatorId, skills);
          const cooldowns =
            this.#cooldownStates.get(operatorId) ?? new Map<string, SkillCooldownState>();
          this.#cooldownStates.set(operatorId, cooldowns);
          return [
            operatorId,
            {
              center: this.#operatorCenterStates.get(operatorId)!,
              blackboard: blackboard.runtimeState,
              ability: ability.runtimeState,
              skills,
              passives:
                this.#operatorPassiveStates.get(operatorId) ??
                new Map<string, PassiveAbilityEventState>(),
              equipment: this.#equipmentEventRuntimes.get(operatorId)?.runtimeState ?? null,
              initializations:
                this.#operatorInitializationStates.get(operatorId) ??
                new Map<string, OperatorInitializationState>(),
              upgradeEvents: this.#operatorUpgradeEventStates.get(operatorId) ?? null,
              comboConditions:
                this.#operatorComboConditionStates.get(operatorId) ??
                new Map<string, ComboSkillConditionState>(),
              cooldowns,
              timedMarkers: this.#operatorTimedMarkers.get(operatorId)!.runtimeState,
              buffs: this.#operatorBuffs.get(operatorId)?.runtimeState ?? null,
            },
          ];
        }),
      ),
      enemy: {
        timedMarkers: this.#enemyTimedMarkers.runtimeState,
        buffs: this.#enemyBuffRuntime.runtimeState ?? null,
      },
      instances: {
        abilityEntities: this.abilityEntities.runtimeState,
        projectiles: this.projectileLifetimes.runtimeState,
        globalBuffs: this.globalBuffs.runtimeState,
      },
    };
  }

  tryStartSkill(operatorId: string, skillId: string, castId?: string): boolean {
    const ability = this.#requireAbilitySystem(operatorId);
    this.#ensureCastInstance(operatorId, ability.resolveSkillId(skillId), castId);
    if (!ability.canStartSkill(skillId, castId)) return false;
    return this.#withPreparedSkillStart(
      operatorId,
      skillId,
      () => ability.tryStartSkill(skillId, castId),
      castId,
    );
  }

  /** 玩家时间轴输入记录原生槽位解析差异，但始终执行块中显式声明的技能。 */
  tryStartPlayerInput(
    operatorId: string,
    expectedSkillId: string,
    castId?: string,
    action?: PlayerSkillInput,
    simulationInputs: SkillSimulationInputs = {},
  ): boolean {
    const ability = this.#requireAbilitySystem(operatorId);
    const parameterKey = `${operatorId}\u0000${castId ?? expectedSkillId}`;
    const existingParameters = this.#castParameters.get(parameterKey);
    if (
      existingParameters !== undefined &&
      !sameSkillSimulationInputs(existingParameters, simulationInputs)
    ) {
      throw new Error(`cannot change submitted skill parameters '${parameterKey}'`);
    }
    if (existingParameters === undefined)
      this.#castParameters.set(parameterKey, structuredClone(simulationInputs));
    if (castId !== undefined)
      this.#options.submitCastRandomSeed?.(castId, simulationInputs.randomSeed);
    else if (simulationInputs.randomSeed !== undefined)
      throw new Error('a cast seed requires a cast id');
    this.#ensureCastInstance(operatorId, expectedSkillId, castId);
    const program = this.#skillPrograms.get(
      `${operatorId}\u0000${expectedSkillId}\u0000${castId ?? ''}`,
    );
    this.#operatorControl.beforeSkillInput(operatorId, action, program?.skillType, castId);
    const center = this.#operatorCenters.get(operatorId);
    const centerState = this.#operatorCenterStates.get(operatorId);
    if (
      ability.nativeSkillTypeForSkill(expectedSkillId) === 'attack' &&
      center !== undefined &&
      centerState !== undefined
    ) {
      const window = center.inspect(centerState);
      if (window.canConsumeAttack === false || window.canLeaveForAttack === false) {
        this.receipt.record({
          frame: this.clock.frame,
          time: this.clock.time,
          event: 'SkillInputBlockedByDashWindow',
          sourceId: operatorId,
          data: {
            skillId: expectedSkillId,
            ...(castId === undefined ? {} : { castId }),
            dodgeId: centerState.dashId,
            attackInputBlocked: window.canConsumeAttack === false,
            attackTransitionBlocked: window.canLeaveForAttack === false,
          },
        });
      }
    }
    const tagRules = this.#options.skillAvailabilityTags;
    if (tagRules !== undefined) {
      const blocker = tagRules.getCommonSkillCastBlocker(
        this.#resolveBuffTarget('caster', operatorId),
      );
      if (blocker !== undefined) {
        this.receipt.record({
          frame: this.clock.frame,
          time: this.clock.time,
          event: 'SkillInputBlockedByCommonTag',
          sourceId: operatorId,
          data: {
            skillId: expectedSkillId,
            blocker,
            blockingTags: tagRules
              .getSkillCastBlockerTags(this.#resolveBuffTarget('caster', operatorId), blocker)
              .join('|'),
            ...(castId === undefined ? {} : { castId }),
          },
        });
      }
    }
    // OnPressUltimateSkillStart checks inUltimateCasting before requesting a cast.
    // This is an input diagnostic, not a general skill lifecycle/interruption gate.
    if (action === 'ultimate' && this.ultimatePresentation.inUltimateCasting) {
      this.receipt.record({
        frame: this.clock.frame,
        time: this.clock.time,
        event: 'UltimateInputBlockedByPresentation',
        sourceId: operatorId,
        data: { skillId: expectedSkillId, ...(castId === undefined ? {} : { castId }) },
      });
    }
    const resolution = this.#resolvePlayerInputSkill({
      operatorId,
      skillId: expectedSkillId,
      action,
    });
    if (resolution.status === 'mismatched') {
      this.receipt.record({
        frame: this.clock.frame,
        time: this.clock.time,
        event: 'SkillInputResolvedToDifferentSkill',
        sourceId: operatorId,
        data: {
          skillId: expectedSkillId,
          actualSkillId: resolution.actualSkillKey,
          ...(castId === undefined ? {} : { castId }),
        },
      });
    } else if (resolution.status === 'unknown') {
      this.receipt.record({
        frame: this.clock.frame,
        time: this.clock.time,
        event: 'SkillInputResolutionUnknown',
        sourceId: operatorId,
        data: {
          skillId: expectedSkillId,
          reason: resolution.reason,
          ...(castId === undefined ? {} : { castId }),
        },
      });
    }
    // 原生先解析操作实际指向的技能，再对该技能执行中断门禁。时间轴块即使不一致
    // 仍会被强制执行，但诊断不能拿块中期望技能冒充原生请求。
    const interruptionSkillId =
      resolution.status === 'matched' || resolution.status === 'mismatched'
        ? resolution.actualSkillKey
        : expectedSkillId;
    if (tagRules !== undefined) {
      const target = this.#resolveBuffTarget('caster', operatorId);
      // 公共门禁已经诊断；原生 CheckTag 在此短路，不再叠加类型专用原因。
      if (tagRules.getCommonSkillCastBlocker(target) === undefined) {
        const nativeSkillType = ability.nativeSkillTypeForSkill(interruptionSkillId);
        const currentNormalSkillId = ability.currentNormalSkillId;
        const blocker = tagRules.getSkillTypeCastBlocker(
          target,
          nativeSkillType,
          currentNormalSkillId === undefined
            ? undefined
            : interruptionSkillId === currentNormalSkillId,
        );
        if (blocker !== undefined) {
          this.receipt.record({
            frame: this.clock.frame,
            time: this.clock.time,
            event: 'SkillInputBlockedByTypeTag',
            sourceId: operatorId,
            data: {
              skillId: expectedSkillId,
              assessedSkillId: interruptionSkillId,
              nativeSkillType,
              blocker,
              blockingTags: tagRules.getSkillCastBlockerTags(target, blocker).join('|'),
              ...(castId === undefined ? {} : { castId }),
            },
          });
        }
      }
    }
    const interruption = ability.evaluatePlayerInputInterruption(
      interruptionSkillId,
      interruptionSkillId === expectedSkillId ? castId : undefined,
    );
    if (interruption.status === 'blocked') {
      this.receipt.record({
        frame: this.clock.frame,
        time: this.clock.time,
        event: 'SkillInputCannotInterruptCurrentSkill',
        sourceId: operatorId,
        data: {
          skillId: expectedSkillId,
          assessedSkillId: interruptionSkillId,
          currentSkillId: interruption.currentSkillKey,
          ...(ability.currentSkillCastId === undefined
            ? {}
            : { currentCastId: ability.currentSkillCastId }),
          // 保存输入阶段实际读到的局部帧，不用两个全局输入时刻相减推测。
          // 膨胀与同帧推进顺序都会使这两个量不同。
          ...(ability.currentSkillTimelineFrame === undefined
            ? {}
            : { currentSkillTimelineFrame: ability.currentSkillTimelineFrame }),
          ...(castId === undefined ? {} : { castId }),
        },
      });
    } else if (interruption.status === 'unknown') {
      this.receipt.record({
        frame: this.clock.frame,
        time: this.clock.time,
        event: 'SkillInputInterruptionUnknown',
        sourceId: operatorId,
        data: {
          skillId: expectedSkillId,
          assessedSkillId: interruptionSkillId,
          reason: interruption.reason,
          ...(castId === undefined ? {} : { castId }),
        },
      });
    }
    if (!ability.canStartSkill(expectedSkillId, castId, false)) return false;
    return this.#withPreparedSkillStart(
      operatorId,
      expectedSkillId,
      () => {
        // 玩家默认施放遵循技能的选目标策略；实体和延迟请求仍使用各自传入的目标。
        ability.prepareCastInput(
          expectedSkillId,
          castId,
          {
            skipApplyCost: false,
            inputTarget:
              program?.defaultTarget === 'enemy'
                ? { kind: 'enemy' }
                : program?.defaultTarget === 'owner'
                  ? { kind: 'operator', operatorId }
                  : undefined,
          },
          false,
        );
        return ability.tryStartTimelineSkill(expectedSkillId, castId);
      },
      castId,
      undefined,
      false,
      action === 'comboSkill',
    );
  }

  /** 通知承受附着的干员；异常生效后再倒序通知队伍。 */
  #publishCharacterInfliction(
    ownerId: string,
    sourceId: string,
    event: ResolvedCombatStepParameters['triggerCharacterInflictionEvent']['event'],
    element: InflictionElement,
  ): void {
    const emit = this.#options.emitAbilityEvent;
    if (emit === undefined)
      throw new Error('character infliction event publisher is not configured');
    emit(ownerId, event, { sourceId: ownerId, targetId: sourceId, element });
    if (event !== 'afterTakeSpellAbnormal') return;
    // 原生倒序通知队伍；第二份事件上下文元素为池复位后的默认 Fire。
    for (const memberId of [...this.#operators.keys()].reverse())
      emit(memberId, 'squadTakeSpellAbnormal', {
        sourceId: memberId,
        targetId: ownerId,
        element: 'heat',
      });
  }

  #publishBeforePhysicalInfliction(payload: AbilityPhysicalInflictionPayload): void {
    if (this.#options.emitAbilityEvent === undefined)
      throw new Error('physical infliction requires an ability event publisher');
    this.#options.emitAbilityEvent(payload.sourceId, 'beforeOutputPhysicalInfliction', payload);
    this.#options.emitAbilityEvent(payload.targetId, 'beforeTakePhysicalInfliction', payload);
  }

  /** 物理异常后置事件按原生顺序同步通知输出方与承受方。 */
  #publishAfterPhysicalInfliction(payload: AbilityPhysicalInflictionPayload): void {
    if (this.#options.emitAbilityEvent === undefined)
      throw new Error('physical infliction requires an ability event publisher');
    this.#options.emitAbilityEvent(payload.sourceId, 'afterOutputPhysicalInfliction', payload);
    this.#options.emitAbilityEvent(payload.targetId, 'afterTakePhysicalInfliction', payload);
  }

  #ensureCastInstance(operatorId: string, skillId: string, castId?: string): void {
    if (castId === undefined) return;
    const key = `${operatorId}\u0000${skillId}\u0000${castId}`;
    const create = this.#pendingCastFactories.get(key);
    if (create !== undefined) {
      this.#requireAbilitySystem(operatorId).registerCastInstance(create());
      this.#pendingCastFactories.delete(key);
      return;
    }
    if (this.#skillStates.get(operatorId)?.has(`${skillId}\u0000${castId}`)) return;
    const definition = this.#skillPrograms.get(`${operatorId}\u0000${skillId}\u0000`);
    if (definition === undefined) return;
    const sourceBinding = this.#unboundSkillOperationBindings
      .get(`${operatorId}\u0000${skillId}`)
      ?.find(binding => binding.program === definition);
    if (sourceBinding === undefined)
      throw new Error(`missing skill definition binding '${operatorId}:${skillId}'`);
    const { program } = this.combatSkillPrograms.registerCast(definition, castId);
    this.#skillPrograms.set(key, program);
    this.#castOperationBindings.set(castId, [
      ...(this.#castOperationBindings.get(castId) ?? []),
      { ...sourceBinding, program },
    ]);
    const runtime = this.#createSkillRuntime(
      sourceBinding.operator,
      program,
      definition,
      this.#options.enemy,
      this.#entityBlackboards.get(operatorId)!,
      this.#options.createOperationExecutor,
      this.#options.isOperatorControlled,
      this.#options.resolveVitals,
      this.#options.resolveOperatorVitals,
      castId,
    );
    this.#requireAbilitySystem(operatorId).registerCastInstance(runtime);
  }

  #withPreparedSkillStart<T>(
    operatorId: string,
    skillId: string,
    start: () => T,
    castId?: string,
    inheritedSkillCastInfo?: CombatSkillCastInfo,
    resolveSkillSlot = true,
    consumeComboWindow = true,
  ): T {
    const ability = this.#requireAbilitySystem(operatorId);
    const definitionSkillId = ability.resolveSkillId(skillId, undefined, resolveSkillSlot);
    this.#ensureCastInstance(operatorId, definitionSkillId, castId);
    const resolvedSkillId = ability.resolveSkillId(skillId, castId, resolveSkillSlot);
    const program = this.#skillPrograms.get(
      `${operatorId}\u0000${resolvedSkillId}\u0000${castId ?? ''}`,
    );
    const effectiveInheritedSkillCastInfo =
      inheritedSkillCastInfo ??
      (program?.skillType === 'basicAttack'
        ? this.#basicAttackSkillCastInheritance.get(operatorId)
        : undefined);
    const skillCastId =
      effectiveInheritedSkillCastInfo?.skillCastId ?? this.#skillCastIds.allocate();
    ability.prepareSkillCastId(skillId, castId, skillCastId, resolveSkillSlot);
    const prepareAndStart = (result?: ComboWindowConsumeResult): T => {
      if (program?.skillType === 'comboSkill' && result !== undefined) {
        if (result.consumed) {
          if (result.window.nativeCondition !== undefined) {
            ability.prepareAfterSkillCastStart(
              skillId,
              castId,
              prepareComboCast(program, result.window.nativeCondition),
              resolveSkillSlot,
            );
          } else {
            ability.prepareSkillStartBlackboard(
              skillId,
              castId,
              result.window.blackboard,
              resolveSkillSlot,
            );
          }
        }
        if (result.reason !== undefined) {
          this.receipt.record({
            frame: this.clock.frame,
            time: this.clock.time,
            event: 'ComboWindowUnavailableAtStart',
            sourceId: operatorId,
            data: {
              skillId,
              ...(castId === undefined ? {} : { castId }),
              reason: result.reason,
              ...(result.reason === 'windowMissing' &&
              hasUnmodeledIncomingAttackTrigger(
                this.#operators.get(operatorId)?.comboConditionPrograms ?? [],
                resolvedSkillId,
              )
                ? { triggerNotModeled: true }
                : {}),
              expectedOperatorId: result.expected?.operatorId ?? null,
              expectedSkillId: result.expected?.nextSkillKey ?? null,
            },
          });
        }
        if (
          (!result.consumed || result.window.nativeCondition === undefined) &&
          program.smartTarget !== undefined
        )
          ability.prepareAfterSkillCastStart(
            skillId,
            castId,
            prepareComboCast(program),
            resolveSkillSlot,
          );
      }
      if (
        (program?.skillType !== 'comboSkill' || !consumeComboWindow) &&
        program?.smartTarget !== undefined
      )
        ability.prepareAfterSkillCastStart(
          skillId,
          castId,
          prepareComboCast(program),
          resolveSkillSlot,
        );
      if (program !== undefined) {
        // Route selection must precede BeforeCastStart: a successful native
        // SwitchToAddBuff(asSkillCast=false) never publishes this skill event.
        ability.prepareBeforeSkillCastStart(
          skillId,
          castId,
          {
            sourceId: operatorId,
            targetId: operatorId,
            skillType: program.skillType,
            element: program.element,
            skillId: program.executionSkillId ?? program.skillId,
            skillCastId,
            skillCastInfo: effectiveInheritedSkillCastInfo ?? {
              skillCastId,
              originSkillId: program.skillId,
              originSkillType: program.skillType,
              ...(castId === undefined ? {} : { originCastId: castId }),
              nonReturnedSpCost: 0,
            },
          },
          resolveSkillSlot,
        );
      }
      return start();
    };
    if (program?.skillType === 'comboSkill' && consumeComboWindow)
      return this.comboWindows.consume(
        operatorId,
        resolvedSkillId,
        prepareAndStart,
        ability.skillSlotKeyForSkill(resolvedSkillId),
        skillCastId,
        castId,
        true,
      );
    return prepareAndStart();
  }

  requestPostSkillCast(operatorId: string, request: PostSkillCastRequest): void {
    this.#requireAbilitySystem(operatorId).requestPostSkillCast(request);
  }

  requestPostNativeSkillCast(
    operatorId: string,
    request: Omit<PostSkillCastRequest, 'skillId'> & { readonly nativeSkillId: string },
  ): void {
    const skillId = this.#nativeSkillKeys.get(`${operatorId}\u0000${request.nativeSkillId}`);
    if (skillId === undefined) {
      if (this.#ambiguousNativeSkillKeys.has(`${operatorId}\u0000${request.nativeSkillId}`)) {
        throw new Error(`native skill '${request.nativeSkillId}' is ambiguous for '${operatorId}'`);
      }
      throw new Error(
        `native skill '${request.nativeSkillId}' is not registered for '${operatorId}'`,
      );
    }
    this.requestPostSkillCast(operatorId, { ...request, skillId, resolveSkillSlot: false });
  }

  #canContinueInputGroup(previous: ScheduledSkillInput): boolean {
    const center = this.#operatorCenters.get(previous.operatorId);
    const state = this.#operatorCenterStates.get(previous.operatorId);
    if (
      center !== undefined &&
      state !== undefined &&
      center.inspect(state).canLeaveForAttack === false
    )
      return false;
    const timing = this.#inputTiming();
    if (timing.canContinue(previous, this.clock.frame)) return true;
    const interruption = timing.find(previous.castId, 'SkillInterrupted');
    if (interruption?.data?.reason !== 'dash' || interruption.frame >= this.clock.frame) {
      return false;
    }
    if (center === undefined || state === undefined) return false;
    const canLeaveForAttack = center.inspect(state).canLeaveForAttack;
    // 缺少原生窗口时不把连续组永久卡死；已知窗口则等待实际开放。
    return canLeaveForAttack !== false;
  }

  #inputTiming(): SkillInputGroupTiming {
    return (this.#groupTiming ??= new SkillInputGroupTiming(this.receipt.history, input => {
      const program = this.#skillPrograms.get(
        `${input.operatorId}\u0000${input.skillId}\u0000${input.castId ?? ''}`,
      );
      if (program === undefined) throw new Error(`missing group skill program '${input.castId}'`);
      return program.timelineBlockFrames;
    }));
  }

  #createInputExecution(): CombatInputExecution {
    return (this.#inputExecution ??= createCombatInputExecution(
      (operatorId, skillId, castId, action, simulationInputs) =>
        this.tryStartPlayerInput(operatorId, skillId, castId, action, simulationInputs),
      this.receipt,
    ));
  }

  /**
   * 只在对应玩家输入即将提交时，把单次释放程序接入当前分支。
   * 该登记会随检查点的 CombatSkillPrograms 复制，但不会进入纯数据状态图。
   */
  #bindSkillCastProgram({ castId, program }: CombatSkillCastProgram): void {
    if (castId.length === 0) throw new Error('combat cast id must not be empty');
    const operator = this.#operators.get(program.operatorId);
    if (operator === undefined) {
      throw new Error(
        `combat cast '${castId}' belongs to unknown operator '${program.operatorId}'`,
      );
    }
    const definitionKey = `${program.operatorId}\u0000${program.skillId}\u0000`;
    if (!this.#skillPrograms.has(definitionKey)) {
      throw new Error(
        `combat cast '${program.operatorId}:${program.skillId}:${castId}' has no fixed definition`,
      );
    }
    const key = `${program.operatorId}\u0000${program.skillId}\u0000${castId}`;
    const existing = this.#skillPrograms.get(key);
    if (existing !== undefined) {
      if (existing !== program) {
        throw new Error(`combat skill program '${key}' is already bound to another definition`);
      }
      return;
    }
    const cooldownProgram = this.#skillCooldowns.get(
      `${program.operatorId}\u0000${program.skillId}`,
    )?.program;
    if (cooldownProgram === undefined) {
      throw new Error(
        `combat cast '${program.operatorId}:${program.skillId}:${castId}' has no cooldown definition`,
      );
    }
    this.#resolveSkillCooldown(operator, program);
    this.combatSkillPrograms.register(program, castId);
    this.#skillPrograms.set(key, program);
    this.#castOperationBindings.set(castId, [
      ...(this.#castOperationBindings.get(castId) ?? []),
      { operator, program },
    ]);
    this.#pendingCastFactories.set(key, () =>
      this.#createSkillRuntime(
        operator,
        program,
        cooldownProgram,
        this.#options.enemy,
        this.#entityBlackboards.get(program.operatorId)!,
        this.#options.createOperationExecutor,
        this.#options.isOperatorControlled,
        this.#options.resolveVitals,
        this.#options.resolveOperatorVitals,
        castId,
      ),
    );
  }

  #createCombatInputRuntime(
    options: CombatRuntimeAssemblyOptions,
    restoredState?: CombatInputRuntimeState,
  ): CombatInputRuntime {
    return new CombatInputRuntime({
      clock: this.clock,
      inputs: options.inputs ?? [],
      ...(options.skillInputGroups === undefined
        ? {}
        : {
            skillInputGroups: {
              groups: options.skillInputGroups,
              canContinue: previous => this.#canContinueInputGroup(previous),
            },
          }),
      ...(options.continuationPlanCastIds === undefined
        ? {}
        : {
            continuationPlan: {
              castIds: options.continuationPlanCastIds,
              ignoreInputFailures: options.continuationPlanMode === 'compact',
              canContinue: (input, previous) =>
                this.#canPlanContinuation(
                  input,
                  previous,
                  options.continuationPlanMode ?? 'continuation',
                ),
            },
          }),
      execution: this.#createInputExecution(),
      ...(restoredState === undefined ? {} : { restoredState }),
    });
  }

  #canPlanContinuation(
    input: ScheduledSkillInput,
    previous: ScheduledSkillInput,
    mode: 'continuation' | 'compact',
  ): boolean {
    if (mode === 'compact') {
      const timing = this.#inputTiming();
      const interruption = timing.find(previous.castId, 'SkillInterrupted');
      if (interruption !== undefined && interruption.frame <= this.clock.frame) return true;
      const boundary = timing.find(previous.castId, 'SkillOperableBoundaryReached');
      if (boundary !== undefined) return boundary.frame < this.clock.frame;
      const processed = timing.find(previous.castId, 'SkillInputProcessed');
      const program = this.#skillPrograms.get(
        `${previous.operatorId}\u0000${previous.skillId}\u0000${previous.castId ?? ''}`,
      );
      return (
        program !== undefined &&
        (processed?.data?.accepted === false || program.timelineBlockFrames === 0) &&
        this.clock.frame >= previous.frame + Math.max(1, program.timelineBlockFrames + 1)
      );
    }
    const ability = this.#requireAbilitySystem(input.operatorId);
    const resolution = this.#resolvePlayerInputSkill(input);
    return (
      resolution.status === 'matched' &&
      ability.evaluatePlayerInputInterruption(input.skillId).status === 'allowed'
    );
  }

  #createExternalCombatEventRuntime(
    options: CombatRuntimeAssemblyOptions,
    restoredState?: ExternalCombatEventRuntimeState,
  ): ExternalCombatEventRuntime {
    return new ExternalCombatEventRuntime({
      clock: this.clock,
      events: options.externalEvents ?? [],
      controlComboCooldown: (operatorId, mode) => {
        const visited = new Set<SkillCooldown>();
        for (const ledger of this.#skillCooldowns.values()) {
          if (
            ledger.program.operatorId !== operatorId ||
            ledger.program.skillType !== 'comboSkill' ||
            visited.has(ledger.cooldown)
          )
            continue;
          visited.add(ledger.cooldown);
          if (!ledger.cooldown.overrideByTimeline(mode === 'ready')) continue;
          this.#recordSkillCooldownAdjusted(
            operatorId,
            ledger.program.skillId,
            'set',
            'baseDurationRatio',
            mode === 'ready' ? 0 : 1,
            ledger.cooldown.snapshot,
          );
          this.receipt.record({
            frame: this.clock.frame,
            time: this.clock.time,
            event: 'TimelineComboCooldownControlled',
            sourceId: operatorId,
            data: { skillId: ledger.program.skillId, mode },
          });
        }
      },
      ...(restoredState === undefined ? {} : { restoredState }),
    });
  }

  /** 指定本次输入阶段可跳过原排程；用于逐帧提交，入口不会保留到下一帧。 */
  advanceFrame(inputs = this.#scheduledFrameInputs): void {
    this.#requireInitialInputApplied();
    this.simulation.advanceFrame(inputs);
  }

  advanceFrames(count: number): void {
    if (count > 0) this.#requireInitialInputApplied();
    this.simulation.advanceFrames(count, this.#scheduledFrameInputs);
  }

  /** 逐帧驱动只用于没有预置人工排程的装配，避免混用游标和即时输入。 */
  advanceInputFrame(input: CombatFrameInput): void {
    this.#requireInitialInputApplied();
    this.simulation.advanceFrame(this.#liveFrameInputs(input));
  }

  /** 起始帧只处理输入，不 Tick、不推进时钟；顺序与旧装配的起始输入一致。 */
  applyInitialInput(input: CombatFrameInput): void {
    if (!this.stateGraph.inputs.initialInputPending) {
      throw new Error('initial combat input has already been applied');
    }
    const phases = this.#liveFrameInputs(input);
    this.stateGraph.inputs.initialInputPending = false;
    phases.controlInputs!();
    phases.skillInputs();
    phases.externalEvents();
    this.#frameEndEvents?.advanceFrame();
  }

  #requireInitialInputApplied(): void {
    if (this.stateGraph.inputs.initialInputPending) {
      throw new Error('apply initial combat input before advancing frames');
    }
  }

  #requireLiveInputs(): void {
    if (
      (this.#options.operatorControl?.scheduledSwitches.length ?? 0) > 0 ||
      (this.#options.inputs?.length ?? 0) > 0 ||
      (this.#options.consumableUses?.length ?? 0) > 0 ||
      (this.#options.dodgeInputs?.length ?? 0) > 0 ||
      (this.#options.externalEvents?.length ?? 0) > 0 ||
      (this.#options.skillInputGroups?.length ?? 0) > 0 ||
      this.#options.continuationPlanCastIds !== undefined
    ) {
      throw new Error('live frame input requires an assembly without scheduled inputs');
    }
  }

  #liveFrameInputs(input: CombatFrameInput): CombatFrameInputs {
    this.#requireLiveInputs();
    return {
      controlInputs: () => this.#operatorControl.applyInput(input.controlledOperatorId),
      skillInputs: () => {
        for (const use of input.consumableUses ?? []) this.#applyConsumableUse(use);
        // 同帧先执行全部 Dash，再处理成功声明，与固定排程一致。
        for (const kind of ['dash', 'perfectDodgeSuccess'] as const)
          for (const dodge of input.dodges ?? [])
            if (dodge.kind === kind)
              this.#dodgeInputRuntime.applyInput(this.#dodgeInputState, {
                ...dodge,
                frame: this.clock.frame,
              });
        const execution = this.#createInputExecution();
        if (typeof input.skills === 'function') {
          let active = true;
          const requireCurrentPhase = (frame = this.clock.frame) => {
            if (!active || frame !== this.clock.frame) {
              throw new Error('skill input port is only valid in the current frame input phase');
            }
          };
          try {
            input.skills({
              resolvePlayerInputSkill: skill => {
                requireCurrentPhase();
                return this.#resolvePlayerInputSkill(skill);
              },
              submit: (skill, frame, skillProgram) => {
                requireCurrentPhase(frame);
                if (skillProgram !== undefined) {
                  if (
                    skill.castId !== skillProgram.castId ||
                    skill.operatorId !== skillProgram.program.operatorId ||
                    skill.skillId !== skillProgram.program.skillId
                  ) {
                    throw new Error('custom skill program does not match the submitted input');
                  }
                  this.#bindSkillCastProgram(skillProgram);
                }
                return execution.submit(skill, frame);
              },
              groupBlocked: event => {
                requireCurrentPhase(event.frame);
                execution.groupBlocked(event);
              },
              canContinue: previous => {
                requireCurrentPhase();
                return this.#canContinueInputGroup(previous);
              },
              canPlanContinuation: (input, previous, mode) => {
                requireCurrentPhase();
                return this.#canPlanContinuation(input, previous, mode);
              },
            });
          } finally {
            active = false;
          }
          return;
        }
        for (const skill of input.skills ?? []) {
          execution.submit({ ...skill, frame: this.clock.frame }, this.clock.frame);
        }
      },
      externalEvents: () => {
        for (const event of input.externalEvents ?? [])
          this.#externalEventRuntime.applyInput(event);
      },
    };
  }

  #resolvePlayerInputSkill(input: CombatSkillInput) {
    // 原生连携输入优先使用 HUD 当前候选，而非无候选时的静态技能槽。
    const pendingCombo = input.action === 'comboSkill' ? this.comboWindows.first : undefined;
    if (
      pendingCombo !== undefined &&
      pendingCombo.operatorId === input.operatorId &&
      pendingCombo.nativeCondition === undefined
    ) {
      return pendingCombo.nextSkillKey === input.skillId
        ? ({ status: 'matched', actualSkillKey: pendingCombo.nextSkillKey } as const)
        : ({ status: 'mismatched', actualSkillKey: pendingCombo.nextSkillKey } as const);
    }
    return this.#requireAbilitySystem(input.operatorId).resolvePlayerInputSkill(
      input.skillId,
      input.action,
      this.#enemyBuffRuntime.matchesEntityTags(['Status/CanBeBreakingAttacked'], 'hasAny') &&
        !this.#operatorBuffs
          .get(input.operatorId)
          ?.matchesEntityTags(['Status/DisableBreakingAttack'], 'hasAny'),
    );
  }

  #applyConsumableUse(input: ConsumableUseInput): void {
    const definition = this.#consumables.get(input.consumableId);
    if (definition === undefined) {
      throw new Error(`unknown consumable '${input.consumableId}'`);
    }
    const operator = this.#operators.get(input.operatorId);
    if (operator === undefined) {
      throw new Error(`unknown consumable target operator '${input.operatorId}'`);
    }
    const target = this.#operatorBuffs.get(input.operatorId);
    if (target === undefined) {
      throw new Error(`operator '${input.operatorId}' has no Buff runtime for consumable use`);
    }
    const applyBuff = target.apply?.bind(target);
    if (applyBuff === undefined) {
      throw new Error(`operator '${input.operatorId}' Buff runtime cannot apply consumables`);
    }

    const replacedBuffIds = [...this.#consumables.values()]
      .filter(candidate => candidate.exclusiveGroup === definition.exclusiveGroup)
      .flatMap(candidate => candidate.applications.map(application => application.buffId));
    target.finishByIds(replacedBuffIds, 'other', input.operatorId, null);
    for (const application of definition.applications) {
      const buffDefinition = operator.buffDefinitions?.[application.buffId];
      if (buffDefinition === undefined) {
        throw new Error(
          `consumable '${definition.id}' requires missing Buff '${application.buffId}' on operator '${input.operatorId}'`,
        );
      }
      applyBuff({
        buffId: application.buffId,
        definition: buffDefinition,
        sourceId: input.operatorId,
        definitionOwnerId: input.operatorId,
        sourceActionId: `consumable:${input.useId}`,
        blackboardValues: application.blackboardValues,
      });
    }
    this.receipt.record({
      frame: this.clock.frame,
      time: this.clock.time,
      event: 'ConsumableUsed',
      sourceId: input.operatorId,
      targetId: input.operatorId,
      data: { useId: input.useId, consumableId: definition.id },
    });
  }

  #applyScheduledConsumables(): void {
    for (const input of this.#options.consumableUses ?? []) {
      if (input.frame === this.clock.frame) this.#applyConsumableUse(input);
    }
  }

  #projectileRuntimeDependencies(operatorId: string): ProjectileRuntimeDependencies {
    return {
      createCallbackSkillHost: createCallbackSkillHostFactory({
        callbackPrograms: this.projectileLifetimes.callbackPrograms,
        clock: this.clock,
        receipt: this.receipt,
        definitionOperatorId: operatorId,
        allocateSkillCastId: () => this.#skillCastIds.allocate(),
        emitEvent: (ownerId, event, payload) =>
          this.#options.emitAbilityEvent?.(ownerId, event, payload),
      }),
      launchProjectile: request => {
        const { skillCastInfo, producedBy } = request;
        const sourceId = request.sourceId ?? operatorId;
        if (request.hit?.target === 'currentTarget' && request.hitTarget === undefined)
          throw new Error('projectile current target is missing');
        const hitTarget: RuntimeTargetRef =
          request.hitTarget ??
          (request.hit?.target === 'controlledOperator'
            ? {
                kind: 'operator',
                operatorId: this.#operatorOrder.find(id =>
                  this.#operatorControl.runtimeState.get(id),
                )!,
              }
            : { kind: 'enemy' });
        if (hitTarget.kind === 'operator' && hitTarget.operatorId === undefined)
          throw new Error('projectile target requires a controlled operator');
        for (const callback of request.callbacks)
          if (callback.runtime.runtimeState.event === 'block') {
            // 原生 Block 将阻挡位置作为回调输入；零空间模型只保留位置身份。
            callback.runtime.runtimeState.inputTarget = {
              kind: 'spatialPoint',
              pointId: this.sharedState.identities.spatialPoints.nextSpatialPointId++,
            };
          } else if (callback.runtime.runtimeState.event === 'hit') {
            callback.runtime.runtimeState.inputTarget = hitTarget;
            if (request.hit?.target === 'allOperators')
              callback.runtime.runtimeState.inputTargets = this.#operatorOrder.map(operatorId => ({
                kind: 'operator' as const,
                operatorId,
              }));
          }
        // 发射集合与碰撞对象都是稳定身份；筛选后的输入随回调状态进入切面。
        // 空白名单不能触发命中，也不能触发 maxHitCount 导致的提前结束。
        if (request.onlyHitTargets !== undefined) {
          const allowed = new Set(request.onlyHitTargets.map(runtimeTargetEntityId));
          allowed.delete(undefined);
          for (const { runtime } of request.callbacks) {
            const state = runtime.runtimeState;
            if (state.event !== 'hit') continue;
            state.inputTargets = (state.inputTargets ?? [hitTarget]).filter(target =>
              allowed.has(runtimeTargetEntityId(target)),
            );
          }
        }
        const entity = this.projectileLifetimes.launch({
          callbacks: request.callbacks.map(callback => callback.runtime.runtimeState),
          entityBlackboard: request.entityBlackboard,
          callbackPrograms: request.callbacks.map(callback => callback.program),
          source: this.#resolveRuntimeTarget(sourceId),
          finishDelaySeconds: request.finish,
          recycleDelaySeconds: request.recycleDelaySeconds,
          firstTickHit: request.hit,
          released: () =>
            this.timeDilation?.releaseInheritedEntityScale(
              logicalAbilityEntityRuntimeId(entity.instanceId),
            ),
          ...bindProjectileCallbackLifecycle(
            request.callbacks.map(callback => callback.runtime),
            () =>
              COMBAT_FRAME_INTERVAL *
              (this.timeDilation?.getEntityScale(
                logicalAbilityEntityRuntimeId(entity.instanceId),
              ) ?? 1),
          ),
        });
        if (request.syncTimeScale)
          this.timeDilation?.inheritEntityScale(
            logicalAbilityEntityRuntimeId(entity.instanceId),
            sourceId,
          );
        this.receipt.record({
          frame: this.clock.frame,
          time: this.clock.time,
          event: 'ProjectileLaunched',
          sourceId,
          subject: entity.target,
          producedBy,
          runtimeSource: this.#resolveRuntimeTarget(sourceId),
          data: {
            ...(skillCastInfo?.originCastId === undefined
              ? {}
              : { castId: skillCastInfo.originCastId }),
          },
        });
        this.#options.emitAbilityEvent?.(sourceId, 'projectileLaunched', {
          sourceId,
          ...(skillCastInfo === undefined ? {} : { skillCastInfo }),
          entity: {
            instanceId: entity.target.instanceId,
            onReset: callback => entity.onReset(callback),
          },
        });
        return entity;
      },
    };
  }

  /** 新战斗与恢复分支共用同一套固定技能寻址，不在恢复器另猜隐藏技能或原生路由。 */
  #registerOperatorSkillPrograms(operator: CombatOperatorProgram): readonly CompiledSkillProgram[] {
    const registerCastOperationBinding = (program: CompiledSkillProgram, castId?: string) => {
      const bindingsMap =
        castId === undefined ? this.#unboundSkillOperationBindings : this.#castOperationBindings;
      const bindingKey =
        castId === undefined ? `${operator.operatorId}\u0000${program.skillId}` : castId;
      const bindings = bindingsMap.get(bindingKey) ?? [];
      if (bindings.some(binding => binding.program.skillId === program.skillId)) {
        throw new Error(
          `duplicate combat skill operation binding '${bindingKey}/${program.skillId}'`,
        );
      }
      bindingsMap.set(bindingKey, [
        ...bindings,
        {
          operator,
          program,
        },
      ]);
    };
    const registerNativeSkill = (program: CompiledSkillProgram): boolean => {
      if (program.nativeSkillType === undefined) return false;
      const nativeKey = `${operator.operatorId}\u0000${program.executionSkillId ?? program.skillId}`;
      if (this.#ambiguousNativeSkillKeys.has(nativeKey)) return true;
      const previous = this.#nativeSkillKeys.get(nativeKey);
      if (previous !== undefined && previous !== program.skillId) {
        this.#nativeSkillKeys.delete(nativeKey);
        this.#ambiguousNativeSkillKeys.add(nativeKey);
        return true;
      }
      this.#nativeSkillKeys.set(nativeKey, program.skillId);
      return false;
    };
    const registerProgramIdentity = (
      program: CompiledSkillProgram,
      castId: string | undefined,
      hidden: boolean,
    ) => {
      const programKey = `${operator.operatorId}\u0000${program.skillId}\u0000${castId ?? ''}`;
      if (this.#skillPrograms.has(programKey)) {
        throw new Error(
          `${hidden ? 'duplicate hidden' : 'duplicate'} combat skill program '${programKey}'`,
        );
      }
      this.#skillPrograms.set(programKey, program);
    };

    for (const program of operator.skills) {
      registerProgramIdentity(program, undefined, false);
      // 保持既有歧义路由行为；此处只抽取登记代码，不在切面改造中修正它。
      if (registerNativeSkill(program)) continue;
      registerCastOperationBinding(program);
    }
    const placedUnboundSkillIds = new Set(operator.skills.map(program => program.skillId));
    const hiddenSkillPrograms = (operator.definitionSkillPrograms ?? []).filter(
      program => !placedUnboundSkillIds.has(program.skillId),
    );
    for (const program of hiddenSkillPrograms) {
      registerProgramIdentity(program, undefined, true);
      registerCastOperationBinding(program);
      registerNativeSkill(program);
    }
    for (const { castId, program } of operator.skillCasts ?? []) {
      registerProgramIdentity(program, castId, false);
      registerCastOperationBinding(program, castId);
    }
    return hiddenSkillPrograms;
  }

  #createSkillRuntime(
    operator: CombatOperatorProgram,
    program: CompiledSkillProgram,
    cooldownProgram: CompiledSkillCooldownProgram,
    enemy: CombatEnemyProgram,
    entityBlackboard: ActionBlackboard,
    createDelegate: CombatRuntimeAssemblyOptions['createOperationExecutor'],
    isOperatorControlled: CombatRuntimeAssemblyOptions['isOperatorControlled'],
    resolveVitals: CombatRuntimeAssemblyOptions['resolveVitals'],
    resolveOperatorVitals: CombatRuntimeAssemblyOptions['resolveOperatorVitals'],
    castId: string | null = null,
  ): SkillRuntime {
    const operatorId = operator.operatorId;
    if (program.operatorId !== operatorId) {
      throw new Error(
        `skill '${program.skillId}' belongs to '${program.operatorId}', expected '${operatorId}'`,
      );
    }

    let runtime: SkillRuntime;
    const operationState = createCombatOperationHostState();
    const cooldownBinding = this.#resolveSkillCooldown(operator, cooldownProgram);
    const skillProgramBinding = this.combatSkillPrograms.register(
      program,
      castId === null ? undefined : castId,
    );
    runtime = new SkillRuntime(program, {
      castId,
      ...this.#createSkillDependencies({
        operator,
        program,
        castId,
        enemy,
        entityBlackboard,
        createDelegate,
        isOperatorControlled,
        resolveVitals,
        resolveOperatorVitals,
        operationState,
        getNonReturnedSpCost: () => runtime.nonReturnedSpCost,
      }),
      damageSnapshotProgram: skillProgramBinding.damageSnapshots,
      ...cooldownBinding,
    });
    const skills = this.#skillStates.get(operatorId) ?? new Map<string, SkillRuntimeState>();
    skills.set(`${program.skillId}\u0000${castId ?? ''}`, runtime.runtimeState);
    this.#skillStates.set(operatorId, skills);
    return runtime;
  }

  /** 恢复只绑定检查点时已经实例化的技能；尚未轮到的放置块仍按新战斗路径延迟创建。 */
  #restorePendingCastFactories(
    operator: CombatOperatorProgram,
    core: RestoredCombatOperatorCore,
    options: CombatRuntimeAssemblyOptions,
  ): void {
    const savedSkills = this.#skillStates.get(operator.operatorId)!;
    for (const { castId, program } of operator.skillCasts ?? []) {
      const stateKey = `${program.skillId}\u0000${castId}`;
      if (savedSkills.has(stateKey)) continue;
      const key = `${operator.operatorId}\u0000${program.skillId}\u0000${castId}`;
      if (this.#pendingCastFactories.has(key)) {
        throw new Error(`duplicate pending combat skill '${key}'`);
      }
      const cooldownProgram = core.cooldowns.get(program.skillId)?.program;
      if (cooldownProgram === undefined) {
        throw new Error(
          `restored skill '${operator.operatorId}:${stateKey}' has no shared cooldown program`,
        );
      }
      this.#pendingCastFactories.set(key, () =>
        this.#createSkillRuntime(
          operator,
          program,
          cooldownProgram,
          options.enemy,
          core.blackboard,
          options.createOperationExecutor,
          options.isOperatorControlled,
          options.resolveVitals,
          options.resolveOperatorVitals,
          castId,
        ),
      );
    }
  }

  /** 普通新技能与恢复技能只在状态来源上不同，运行端口和操作责任链必须完全一致。 */
  #createSkillDependencies(options: {
    readonly operator: CombatOperatorProgram;
    readonly program: CompiledSkillProgram;
    readonly castId: string | null;
    readonly enemy: CombatEnemyProgram;
    readonly entityBlackboard: ActionBlackboard;
    readonly createDelegate: CombatRuntimeAssemblyOptions['createOperationExecutor'];
    readonly isOperatorControlled: CombatRuntimeAssemblyOptions['isOperatorControlled'];
    readonly resolveVitals: CombatRuntimeAssemblyOptions['resolveVitals'];
    readonly resolveOperatorVitals: CombatRuntimeAssemblyOptions['resolveOperatorVitals'];
    readonly operationState: CombatOperationHostState;
    readonly getNonReturnedSpCost: () => number;
  }) {
    const { operator, program } = options;
    const operatorId = operator.operatorId;
    return {
      clock: this.clock,
      resources: this.resources,
      resolveCosts: (
        costs: Parameters<
          NonNullable<ConstructorParameters<typeof SkillRuntime>[1]['resolveCosts']>
        >[0],
      ) =>
        costs.map(cost =>
          cost.resource === 'sp'
            ? {
                ...cost,
                value: Math.max(
                  0,
                  Math.fround(
                    cost.value +
                      (operator.buffRuntime?.getAttributeValue?.('AtbCostAddition') ?? 0),
                  ),
                ),
              }
            : cost,
        ),
      receipt: this.receipt,
      operations: this.#createOperationChain({
        operator,
        program,
        ...(options.castId === null ? {} : { castId: options.castId }),
        enemy: options.enemy,
        createDelegate: options.createDelegate,
        isOperatorControlled: options.isOperatorControlled,
        resolveVitals: options.resolveVitals,
        resolveOperatorVitals: options.resolveOperatorVitals,
        getNonReturnedSpCost: options.getNonReturnedSpCost,
        operationHost: {
          state: options.operationState,
          programs: this.combatOperationPrograms,
        },
      }),
      operationState: options.operationState,
      allocateSkillCastId: () => this.#skillCastIds.allocate(),
      semanticEvents: this.semanticEvents,
      entityBlackboard: options.entityBlackboard,
      hostIdentity: {
        actionOwnerId: operatorId,
        actionSourceId: operatorId,
        eventSourceId: operatorId,
        semanticEventOwnerOperatorId: operatorId,
      },
      emitSkillEnd: (
        payload: Parameters<
          NonNullable<ConstructorParameters<typeof SkillRuntime>[1]['emitSkillEnd']>
        >[0],
      ) => this.#options.emitAbilityEvent?.(operatorId, 'skillEnd', payload),
      emitSkillInterrupted: (
        payload: Parameters<
          NonNullable<ConstructorParameters<typeof SkillRuntime>[1]['emitSkillInterrupted']>
        >[0],
      ) => this.#options.emitAbilityEvent?.(operatorId, 'skillInterrupted', payload),
      emitAfterSkillApplyCost: (
        payload: Parameters<
          NonNullable<ConstructorParameters<typeof SkillRuntime>[1]['emitAfterSkillApplyCost']>
        >[0],
      ) => this.#options.emitAbilityEvent?.(operatorId, 'afterSkillApplyCost', payload),
      ...this.#projectileRuntimeDependencies(operatorId),
    };
  }

  /** 能力系统的事件和推进端口不携带初始状态，可直接用于新建或绑定保存数据。 */
  #createAbilityRuntimeBindings(operatorId: string): CombatAbilityRuntimeBindings {
    return {
      onPostSkillCastResolved: () => {
        const state = this.#operatorCenterStates.get(operatorId);
        if (state?.pendingPerfectDodgeId != null) {
          recordDodgeReceipt(this.receipt, this.clock, operatorId, state.pendingPerfectDodgeId, {
            event: 'PerfectDodgeDeclarationRejected',
            data: { reason: 'nativeSkillNotStarted' },
          });
          state.pendingPerfectDodgeId = null;
        }
      },
      onCurrentSkillChanged: type => {
        const center = this.#operatorCenters.get(operatorId);
        const state = this.#operatorCenterStates.get(operatorId);
        if (center !== undefined && state !== undefined) center.onSkillChanged(state, type);
      },
      ...(this.#options.dashTiming === undefined
        ? {}
        : { dashOffsetFrames: this.#options.dashTiming.dashOffsetFrames }),
      onPostSkillCastRequest: info => this.#options.onPostSkillCastRequest?.(operatorId, info),
      beforePostSkillCastStart: request => {
        const ability = this.#requireAbilitySystem(operatorId);
        this.#withPreparedSkillStart(
          operatorId,
          request.skillId,
          () => undefined,
          request.castId,
          request.inheritedSkillCastInfo,
          request.resolveSkillSlot !== false,
          false,
        );
        ability.prepareCastInput(
          request.skillId,
          request.castId,
          {
            skipApplyCost: request.skipApplyCost ?? false,
            ...(request.inputTarget === undefined ? {} : { inputTarget: request.inputTarget }),
            ...(request.producedBy === undefined ? {} : { producedBy: request.producedBy }),
            ...(request.inheritedSkillCastInfo === undefined
              ? {}
              : { inheritedSkillCastInfo: request.inheritedSkillCastInfo }),
          },
          request.resolveSkillSlot !== false,
        );
      },
      emitBeforeSkillCast: payload =>
        this.#options.emitAbilityEvent?.(operatorId, 'beforeCastSkill', payload),
      advanceSkillSlotReplacements: deltaSeconds =>
        advanceAbilitySkillSlotReplacements(
          this.#requireAbilitySystem(operatorId).runtimeState,
          deltaSeconds,
          this.#skillSlotReplacementHost(operatorId),
        ),
      resolveActualFrame: () => this.clock.frame,
      onSkillOperableBoundaryReached: fact =>
        this.receipt.record({
          frame: fact.reachedAtFrame,
          time: fact.reachedAtFrame / COMBAT_FRAMES_PER_SECOND,
          event: 'SkillOperableBoundaryReached',
          sourceId: operatorId,
          data: {
            castId: fact.castId,
            durationFrames: fact.durationFrames,
          },
        }),
      ...(this.timeDilation === null
        ? {}
        : {
            resolveTickDeltas: () =>
              this.timeDilation!.getAbilityTickDeltas(operatorId, COMBAT_FRAME_INTERVAL),
          }),
    };
  }

  #recordGlobalBuffCreated(state: GlobalBuffInstanceState, producedBy?: CombatObjectRef): void {
    this.receipt.record({
      frame: this.clock.frame,
      time: this.clock.time,
      event: 'GlobalBuffCreated',
      subject: { kind: 'globalBuff', instanceId: state.instanceId },
      producedBy,
      sourceId: state.sourceId,
      data: {
        buffId: state.id,
        ...(state.sourceActionId === undefined ? {} : { sourceActionId: state.sourceActionId }),
      },
    });
  }

  /** 恢复目录负责数据推进；业务事件与清理顺序仍使用正式装配的同一组钩子。 */
  #createAbilityEntityEventHooks(releaseBuffs = true): CombatAbilityEntityEventHooks {
    return {
      soulDisabled: (entity, mainBody) => {
        const mainBodyId = runtimeTargetEntityId(mainBody)!;
        this.#options.emitAbilityEvent?.(mainBodyId, 'soulDisabled', {
          sourceId: mainBodyId,
          targetId: runtimeTargetEntityId(entity)!,
        });
      },
      spawned: (entity, producedBy) => {
        const entityId = logicalAbilityEntityRuntimeId(entity.instanceId);
        this.receipt.record({
          frame: this.clock.frame,
          time: this.clock.time,
          event: 'AbilityEntitySpawned',
          subject: { kind: 'abilityEntity', instanceId: entity.instanceId },
          producedBy,
          runtimeSource: entity.source,
          sourceId: entity.ownerId,
          targetId: entityId,
          data: {
            abilityEntityId: entity.abilityEntityId,
            ...(entity.skillCastInfo?.originCastId === undefined
              ? {}
              : { castId: entity.skillCastInfo.originCastId }),
            childSkillId: entity.childSkillId ?? null,
            remainingDurationSeconds: entity.remainingDurationSeconds,
          },
        });
        this.#options.emitAbilityEvent?.(entity.ownerId, 'abilityEntitySpawned', {
          entity: {
            instanceId: entity.instanceId,
            onReset: callback =>
              this.abilityEntities.onReset(
                { kind: 'abilityEntity', instanceId: entity.instanceId },
                callback,
              ),
          },
          ...(entity.skillCastInfo === undefined ? {} : { skillCastInfo: entity.skillCastInfo }),
          sourceId: entity.ownerId,
          targetId: entityId,
        });
      },
      childSkillRequested: (entity, childSkillId) =>
        this.receipt.record({
          frame: this.clock.frame,
          time: this.clock.time,
          event: 'AbilityEntityChildSkillRequested',
          sourceId: entity.ownerId,
          targetId: logicalAbilityEntityRuntimeId(entity.instanceId),
          data: { abilityEntityId: entity.abilityEntityId, childSkillId },
        }),
      finished: (entity, reason) => {
        const entityId = logicalAbilityEntityRuntimeId(entity.instanceId);
        const finishReason =
          reason === 'durationExpired'
            ? 'lifetime'
            : reason === 'stackingLimit'
              ? 'stackEvicted'
              : reason === 'sourceDied' || reason === 'soulMainBodyDied'
                ? reason
                : 'other';
        // 原生先通知自身，再通知来源；自身 Buff 在通知完成后才释放。
        this.#options.emitAbilityEvent?.(entityId, 'abilityEntitySelfFinished', {
          finishReason,
          ...(entity.skillCastInfo === undefined ? {} : { skillCastInfo: entity.skillCastInfo }),
          sourceId: entityId,
          targetId: entityId,
        });
        this.#options.emitAbilityEvent?.(entity.ownerId, 'abilityEntityFinished', {
          finishReason,
          ...(entity.skillCastInfo === undefined ? {} : { skillCastInfo: entity.skillCastInfo }),
          sourceId: entityId,
          targetId: entityId,
        });
        if (reason === 'durationExpired' || reason === 'explicit') {
          this.#options.emitAbilityEvent?.(entityId, 'ownerHpZero', {
            sourceId: entityId,
            targetId: entityId,
          });
        }
        this.#disposeAbilityEntityPassiveSkills(entity.instanceId);
        if (releaseBuffs) {
          const buffRuntime = this.#abilityEntityBuffs.get(entity.instanceId);
          if (buffRuntime !== undefined) {
            buffRuntime.releaseAll();
            this.#abilityEntityBuffs.delete(entity.instanceId);
          }
          this.#options.clearPendingAbilityEvents?.(entityId);
        }
        this.receipt.record({
          frame: this.clock.frame,
          time: this.clock.time,
          event: 'AbilityEntityFinished',
          sourceId: entity.ownerId,
          targetId: entityId,
          data: { abilityEntityId: entity.abilityEntityId, reason },
        });
      },
      timedMarkerCreated: marker =>
        this.receipt.record({
          frame: this.clock.frame,
          time: this.clock.time,
          event: 'TimedMarkerCreated',
          sourceId: marker.ownerId,
          targetId: marker.sourceTargetId,
          data: {
            markerId: marker.markerId,
            createdAt: marker.createdAt,
            expiresAt: marker.expiresAt,
          },
        }),
      timedMarkerFinished: (marker, reason) =>
        this.receipt.record({
          frame: this.clock.frame,
          time: this.clock.time,
          event: 'TimedMarkerFinished',
          sourceId: marker.ownerId,
          targetId: marker.sourceTargetId,
          data: { markerId: marker.markerId, reason },
        }),
    };
  }

  #resolveSkillCooldown(
    operator: CombatOperatorProgram,
    program: CompiledSkillCooldownProgram,
  ): { readonly cooldown?: SkillCooldown; readonly advancesCooldown?: boolean } {
    const operatorId = operator.operatorId;
    const configuration = resolveCombatSkillCooldownConfiguration(operator, program);
    const periodFrames = configuration.periodFrames;
    const key = `${operatorId}\u0000${program.skillId}`;
    const existing = this.#skillCooldowns.get(key);
    if (existing !== undefined) {
      if (
        existing.periodFrames !== periodFrames ||
        existing.program.skillType !== program.skillType ||
        existing.commitFrame !== configuration.commitFrame
      ) {
        throw new Error(
          `skill '${program.skillId}' of '${operatorId}' has inconsistent cooldown configuration`,
        );
      }
      if (program.nativeSkillType !== undefined)
        existing.skillIds.add(program.executionSkillId ?? program.skillId);
      return { cooldown: existing.cooldown, advancesCooldown: false };
    }
    const cooldown = new SkillCooldown(
      periodFrames,
      configuration.commitFrame,
      program.skillType === 'comboSkill'
        ? () => operator.buffRuntime?.getAttributeValue?.('ComboSkillCooldownScalar') ?? 1
        : undefined,
    );
    this.#skillCooldowns.set(key, {
      cooldown,
      program,
      skillIds: new Set(
        program.nativeSkillType === undefined ? [] : [program.executionSkillId ?? program.skillId],
      ),
      ...(periodFrames === undefined
        ? {}
        : {
            periodFrames,
            ...(configuration.commitFrame === undefined
              ? {}
              : { commitFrame: configuration.commitFrame }),
          }),
    });
    const states = this.#cooldownStates.get(operatorId) ?? new Map<string, SkillCooldownState>();
    states.set(program.skillId, cooldown.runtimeState);
    this.#cooldownStates.set(operatorId, states);
    return { cooldown, advancesCooldown: false };
  }

  /** 对称注销本 assembly 的原生常驻条件；不会清除同一事件中心里其他所有者的注册。 */
  disposeComboSkillConditions(): void {
    runAbilityHostCleanup(
      this.#comboConditionRegistrations.splice(0).map(registration => () => registration.dispose()),
    );
  }

  disposePassiveAbilityEvents(): void {
    const entityRuntimes = [...this.#abilityEntityPassiveEvents.values()].flat();
    this.#abilityEntityPassiveEvents.clear();
    runAbilityHostCleanup([
      ...this.#operatorUpgradeEventRuntimes.splice(0).map(runtime => () => runtime.dispose()),
      ...this.#passiveAbilityEvents.splice(0).map(runtime => () => runtime.dispose()),
      ...entityRuntimes.map(runtime => () => runtime.dispose()),
    ]);
  }

  #prepareSoul(
    target: RuntimeTargetRef,
    definition: NonNullable<ResolvedAbilityEntityDefinition['soul']>,
    operatorId: string,
  ): NonNullable<LogicalAbilityEntitySpawnRequest['soul']> {
    const mainBody = this.abilityEntities.mainBody(target);
    if (
      mainBody.kind !== 'enemy' ||
      definition.damageTransferType !== 'sharedDamage' ||
      definition.useMainBodyHp
    )
      throw new Error('Soul initialization requires an enemy body and independent SharedDamage HP');
    const bodyVitals = this.#options.resolveVitals?.('enemy', operatorId);
    if (bodyVitals === undefined) throw new Error('Soul initialization requires main-body vitals');
    return {
      mainBody,
      damageTransferType: 'sharedDamage',
      useMainBodyPoise: definition.useMainBodyPoise,
      damageRatio: definition.damageRatio,
      poiseRatio: definition.poiseRatio,
      vitals: {
        health: 0,
        maxHealth: bodyVitals.maxHealth,
        poise: 0,
        maxPoise: 0,
        poiseRecoveryTime: 0,
        poiseRecoveryTimeMultiplier: 1,
        poiseBrokenEndTime: 0,
        poiseImmune: false,
      },
    };
  }

  #initializeSoul(entity: RuntimeTargetRef, definition: ResolvedAbilityEntityDefinition): void {
    if (entity.kind !== 'abilityEntity' || definition.soul === undefined)
      throw new Error('Soul initialization requires a Soul ability entity');
    const state = this.abilityEntities.runtimeState.instances.get(entity.instanceId)?.soul;
    const vitals = this.abilityEntities.soulVitals(entity);
    if (state === undefined || vitals === undefined)
      throw new Error('Soul state is not registered');
    const source = this.#resolveBuffTargetById(runtimeTargetEntityId(state.mainBody)!).runtimeState;
    const target = this.#resolveAbilityEntityBuffTarget(entity, this.#options).runtimeState;
    if (source === undefined || target === undefined)
      throw new Error('Soul initialization requires attribute containers');
    cloneCombatAttributes(source.attributes, target.attributes);
    this.#installAbilityEntityPassiveSkills(entity, definition);
    // 基类 _DoStart 末尾设置满生命，随后 Soul 才读取自己的倍率和生命覆盖。
    const maximum = target.attributes.rawValues.has('MaxHp')
      ? readCombatAttribute(target.attributes, 'MaxHp', 'final', ATTRIBUTE_MODIFIER_SOURCES.all)
      : vitals.maxHealth;
    vitals.initializeHealth(maximum);
    const blackboard = this.abilityEntities.entityBlackboard(entity);
    const resolve = (
      value: number | { readonly blackboardKey: string; readonly fallback: number },
    ) =>
      typeof value === 'number'
        ? value
        : (blackboard.getNumber(value.blackboardKey) ?? value.fallback);
    state.damageRatio = resolve(definition.soul.soulDamageRatio);
    state.poiseRatio = resolve(definition.soul.soulPoiseRatio);
    if (!Number.isFinite(state.damageRatio) || !Number.isFinite(state.poiseRatio))
      throw new Error('Soul transfer ratios must be finite');
    const health = blackboard.getNumber(definition.soul.soulHpBlackboardKey) ?? 0;
    if (health > 0) {
      target.attributes.rawValues.set('MaxHp', health);
      vitals.initializeHealth(health);
    }
  }

  #installAbilityEntityPassiveSkills(
    target: RuntimeTargetRef,
    definition: ResolvedAbilityEntityDefinition,
  ): void {
    if (target.kind !== 'abilityEntity') {
      throw new Error('AbilityEntity passive installation requires an AbilityEntity target');
    }
    const entity = this.abilityEntities.snapshot(target);
    const operator = this.#operators.get(entity.ownerId);
    const passiveSkills = definition.passiveSkills;
    if (passiveSkills === undefined || passiveSkills.length === 0) return;
    if (operator === undefined) {
      throw new Error(
        `AbilityEntity '${entity.abilityEntityId}' passive owner '${entity.ownerId}' does not exist`,
      );
    }
    if (this.#abilityEntityPassiveEvents.has(entity.instanceId)) {
      throw new Error(`AbilityEntity '${entity.instanceId}' passive skills are already installed`);
    }
    const register = this.#options.registerPassiveAbilityEventAction;
    if (register === undefined) {
      throw new Error(
        `AbilityEntity '${entity.abilityEntityId}' passive skills require ability event registration`,
      );
    }
    const entityId = logicalAbilityEntityRuntimeId(entity.instanceId);
    const installed: PassiveAbilityEventRuntime[] = [];
    try {
      for (const passive of passiveSkills) {
        const sourceActionId = `ability-entity:${entity.instanceId}:passive:${passive.key}`;
        const blackboard = new ActionBlackboard(
          passive.initialBlackboard,
          this.abilityEntities.entityBlackboard(target),
        );
        const operations = this.#createReactiveOperationChain(
          operator,
          sourceActionId,
          this.#createReactiveTerminal(operator, sourceActionId, this.#options),
          this.#options,
        );
        const eventHost = new PassiveAbilityEventRuntime(
          operations,
          {
            blackboard,
            actionOwnerId: entityId,
            actionSourceId: entityId,
            actionOwnerAbilityEntity: target,
            currentTarget: target,
            ...(entity.skillCastInfo === undefined || entity.skillCastInfo === null
              ? {}
              : { skillCastInfo: entity.skillCastInfo }),
          },
          passive.abilityEventResponses ?? [],
          (event, priority, handle, subscriptions) =>
            register(entityId, event, priority, handle, subscriptions),
        );
        installed.push(eventHost);
        const entityState = this.abilityEntities.runtimeState.instances.get(entity.instanceId)!;
        if (entityState.passiveAbilities.has(passive.key)) {
          throw new Error(
            `AbilityEntity '${entity.instanceId}' has duplicate passive key '${passive.key}'`,
          );
        }
        entityState.passiveAbilities.set(passive.key, eventHost.runtimeState);
        const runtime = new CombatActionSequenceRuntime(
          operations,
          {
            blackboard,
            actionOwnerId: entityId,
            actionSourceId: entityId,
            actionOwnerAbilityEntity: target,
            currentTarget: target,
            addAbilityChildBuff: child => eventHost.addChildBuff(child),
          },
          {},
          this.semanticEvents,
          entityId,
        );
        const sequence = runtime.createSequence(passive.enableSequence);
        eventHost.recordEnableSequence(sequence.runtimeState);
        eventHost.onDisable(() => sequence.end({}));
        if (!sequence.tryExecute({})) {
          throw new Error(
            `AbilityEntity '${entity.abilityEntityId}' passive skill '${passive.key}' enable sequence returned false`,
          );
        }
        eventHost.enable();
        this.receipt.record({
          frame: this.clock.frame,
          time: this.clock.time,
          event: 'PassiveSkillEnabled',
          sourceId: entityId,
          data: { passiveKey: passive.key, abilityEntityId: entity.abilityEntityId },
        });
      }
      this.#abilityEntityPassiveEvents.set(entity.instanceId, installed);
    } catch (error) {
      runAbilityHostCleanup(installed.map(runtime => () => runtime.dispose()));
      throw error;
    }
  }

  #disposeAbilityEntityPassiveSkills(instanceId: number): void {
    const runtimes = this.#abilityEntityPassiveEvents.get(instanceId);
    if (runtimes === undefined) return;
    this.#abilityEntityPassiveEvents.delete(instanceId);
    runAbilityHostCleanup(runtimes.map(runtime => () => runtime.dispose()));
  }

  disposeEquipmentEvents(): void {
    try {
      runAbilityHostCleanup(
        [...this.#equipmentEventRuntimes.values()].map(runtime => () => runtime.dispose()),
      );
    } finally {
      this.#equipmentEventRuntimes.clear();
    }
  }

  #installComboSkillConditions(restoring = false): void {
    const options = this.#options;
    const pending: {
      operator: CombatOperatorProgram;
      program: CompiledComboSkillConditionProgram;
    }[] = [];
    // 整批先校验依赖和身份，避免后一个角色出错时前一个角色已开始响应。
    for (const operator of this.#operators.values()) {
      const keys = new Set<string>();
      for (const program of operator.comboConditionPrograms ?? []) {
        if (program.key.length === 0 || keys.has(program.key)) {
          throw new Error(
            `operator '${operator.operatorId}' has invalid or duplicate combo condition '${program.key}'`,
          );
        }
        keys.add(program.key);
        if (program.immediately) {
          throw new Error(
            `combo condition '${program.key}' requires target-aware immediate TryCastComboSkill support`,
          );
        }
        const group = operator.skillSlotGroups?.find(
          group => group.skillSlotKey === program.skillSlotKey,
        );
        if (group === undefined)
          throw new Error(
            `combo condition '${program.key}' requires skill slot '${program.skillSlotKey}'`,
          );
        const skill = this.#skillCooldowns.get(
          `${operator.operatorId}\u0000${program.skillKey}`,
        )?.program;
        if (skill === undefined || skill.skillType !== 'comboSkill') {
          throw new Error(
            `combo condition '${program.key}' requires assembled combo skill '${program.skillKey}'`,
          );
        }
        if (
          this.#skillCooldowns.get(`${operator.operatorId}\u0000${program.skillKey}`)?.cooldown
            .comboConditionSnapshot == null
        ) {
          throw new Error(
            `combo condition '${program.key}' requires configured cooldown and startCdFrame for '${program.skillKey}'`,
          );
        }
        pending.push({ operator, program });
      }
    }
    if (pending.length === 0) return;
    const register = options.registerComboSkillCondition;
    const eligibility = options.comboConditionEligibility;
    const onPending = options.onPendingComboCondition;
    if (register === undefined || eligibility === undefined) {
      throw new Error(
        'native combo conditions require event registration and alive/InSilence eligibility',
      );
    }
    for (const { operator, program } of pending) {
      const operatorId = operator.operatorId;
      let states = this.#operatorComboConditionStates.get(operatorId);
      if (states === undefined) {
        states = new Map();
        this.#operatorComboConditionStates.set(operatorId, states);
      }
      const saved = states.get(program.key);
      if (restoring && saved === undefined) {
        throw new Error(`restored combo condition '${operatorId}:${program.key}' has no state`);
      }
      const blackboard =
        saved === undefined
          ? new ActionBlackboard(
              program.initialValues ?? {},
              this.#entityBlackboards.get(operatorId)!,
            )
          : ActionBlackboard.bindRuntimeState(saved.blackboard);
      const operationState = saved?.operations ?? createCombatOperationHostState();
      if (saved === undefined) {
        states.set(program.key, {
          blackboard: blackboard.runtimeState,
          operations: operationState,
        });
      }
      this.#comboConditionRegistrations.push(
        register({
          event: program.event,
          ownerId: operatorId,
          sourceId: operatorId,
          entityBlackboard: this.#entityBlackboards.get(operatorId)!,
          initialValues: program.initialValues,
          directBlackboard: blackboard,
          sequence: program.sequence,
          operations: this.#createReactiveOperationChain(
            operator,
            `native-combo-condition:${program.key}`,
            unsupportedReactiveTerminal,
            options,
            operationState,
          ),
          isOwnerAlive: () => eligibility.isAlive(operatorId),
          isOwnerSilenced: () => eligibility.isSilenced(operatorId),
          currentComboCooldown: () => {
            const skillKey = this.#requireAbilitySystem(operatorId).currentSkillKeyForSlot(
              program.skillSlotKey,
            );
            const cooldown = this.#skillCooldowns.get(`${operatorId}\u0000${skillKey}`)?.cooldown;
            if (cooldown === undefined) return null;
            // 零冷却形态在定义中省略周期，已有账本始终就绪；不等于缺少当前技能。
            if (!cooldown.snapshot.configured) return { oneReady: true };
            return cooldown.comboConditionSnapshot;
          },
          resolveTarget: entityId => this.#resolveRuntimeTarget(entityId),
          onPending: value => {
            this.comboWindows.open(
              operatorId,
              program.skillKey,
              {},
              { ...value, skillSlotKey: program.skillSlotKey },
            );
            onPending?.(operatorId, program, value);
          },
        }),
      );
    }
  }

  #readTargetVitals(
    entityId: string,
    operatorId: string,
    property?: 'currentHealth' | 'maxHealth' | 'currentPoise',
  ): CombatVitals | undefined {
    const target = this.#resolveRuntimeTarget(entityId);
    if (target.kind === 'abilityEntity') {
      const soul = this.abilityEntities.runtimeState.instances.get(target.instanceId)?.soul;
      if (property === 'currentPoise' && soul?.useMainBodyPoise)
        return this.#readTargetVitals(runtimeTargetEntityId(soul.mainBody)!, operatorId, property);
      return this.abilityEntities.soulVitals(target);
    }
    return target.kind === 'enemy'
      ? this.#options.resolveVitals?.('enemy', operatorId)
      : this.#options.resolveOperatorVitals?.(entityId);
  }

  #resolveRuntimeTarget(entityId: string): RuntimeTargetRef {
    if (entityId === 'enemy') return { kind: 'enemy' };
    if (this.#operators.has(entityId)) return { kind: 'operator', operatorId: entityId };
    const match = /^ability-entity:([1-9]\d*)$/.exec(entityId);
    if (match !== null) {
      const target = { kind: 'abilityEntity' as const, instanceId: Number(match[1]) };
      // Buff 等持久对象可在来源实体回收后继续发布带来源身份的事件。
      // 此处只解析身份；存活条件与实际操作仍由各自的实体查询执行。
      if (target.instanceId < this.#abilityEntityInstanceIds.runtimeState.next) return target;
    }
    throw new Error(`combo condition references unknown entity '${entityId}'`);
  }

  #changeSkillSlot(
    operatorId: string,
    skillSlotKey: string,
    targetSkillKey: string,
    inheritOriginSkillCooldownProgress: boolean,
    reverting = false,
  ): void {
    const abilitySystem = this.#requireAbilitySystem(operatorId);
    const previousNativeSkillType = abilitySystem.nativeSkillTypeForSkill(targetSkillKey);
    const previousSkillKey = abilitySystem.changeSkillSlot(skillSlotKey, targetSkillKey, reverting);
    let inheritedCooldownProgress: number | undefined;
    try {
      if (inheritOriginSkillCooldownProgress && previousSkillKey !== targetSkillKey) {
        const source = this.#skillCooldowns.get(`${operatorId}\u0000${previousSkillKey}`);
        const target = this.#skillCooldowns.get(`${operatorId}\u0000${targetSkillKey}`);
        if ((source === undefined) !== (target === undefined)) {
          throw new Error(
            `ability skill slot '${skillSlotKey}' cannot inherit cooldown from ` +
              `'${previousSkillKey}' to '${targetSkillKey}' before both skills are assembled`,
          );
        }
        if (source !== undefined && target !== undefined) {
          inheritedCooldownProgress = source.cooldown.snapshot.progress;
          target.cooldown.setProgress(inheritedCooldownProgress);
        }
      }
    } catch (error) {
      abilitySystem.changeSkillSlot(skillSlotKey, previousSkillKey, true);
      abilitySystem.changeNativeSkillType(targetSkillKey, previousNativeSkillType);
      throw error;
    }
    this.receipt.record({
      frame: this.clock.frame,
      time: this.clock.time,
      event: 'SkillSlotChanged',
      sourceId: operatorId,
      data: {
        skillSlotKey,
        targetSkillKey,
        previousSkillKey,
        inheritOriginSkillCooldownProgress,
        ...(inheritedCooldownProgress === undefined ? {} : { inheritedCooldownProgress }),
      },
    });
  }

  #replaceSkillSlot(
    operatorId: string,
    parameters: {
      readonly skillSlotKey: string;
      readonly targetSkillKey: string;
      readonly revertedSkillKey?: string;
      readonly durationSeconds?: number;
      readonly inheritOriginSkillCooldownProgress: boolean;
    },
  ): number {
    return replaceAbilitySkillSlot(
      this.#requireAbilitySystem(operatorId).runtimeState,
      parameters,
      this.#skillSlotReplacementHost(operatorId),
    );
  }

  #finishSkillSlotReplacement(
    operatorId: string,
    skillSlotKey: string,
    registrationId: number,
  ): void {
    finishAbilitySkillSlotReplacement(
      this.#requireAbilitySystem(operatorId).runtimeState,
      skillSlotKey,
      registrationId,
      this.#skillSlotReplacementHost(operatorId),
    );
  }

  #skillSlotReplacementHost(operatorId: string): SkillSlotReplacementHost {
    return {
      currentSkillKey: group =>
        this.#requireAbilitySystem(operatorId).currentSkillKeyForSlot(group),
      changeSkillSlot: (group, skill, inherit, reverting) =>
        this.#changeSkillSlot(operatorId, group, skill, inherit, reverting),
    };
  }

  #adjustSkillCooldowns(
    operatorId: string,
    skill: CompiledStepParameters['adjustSkillCooldown']['skill'],
    operation: 'reduce' | 'set',
    basis: 'baseDurationRatio' | 'absoluteFrames',
    value: number,
  ): number {
    return adjustMatchingSkillCooldowns(
      this.#skillCooldowns,
      operatorId,
      skill,
      operation,
      basis,
      value,
      (skillId, snapshot) =>
        this.#recordSkillCooldownAdjusted(operatorId, skillId, operation, basis, value, snapshot),
    );
  }

  #recordSkillCooldownAdjusted(
    operatorId: string,
    skillId: string,
    operation: 'reduce' | 'set',
    basis: 'baseDurationRatio' | 'absoluteFrames',
    value: number,
    snapshot: SkillCooldownSnapshot,
  ): void {
    this.receipt.record({
      frame: this.clock.frame,
      time: this.clock.time,
      event: 'SkillCooldownAdjusted',
      sourceId: operatorId,
      data: {
        skillId,
        operation,
        basis,
        value,
        remainingFrames: snapshot.remainingFrames,
        ready: snapshot.ready,
      },
    });
  }

  #createBuffLifecycleOperationChain(
    source: BuffLifecycleOperationSource,
    options: CombatRuntimeAssemblyOptions,
  ): CombatOperationExecutor {
    const cast = source.skillCastInfo;
    const castId = cast?.originCastId ?? source.sourceActionId;
    const candidates =
      cast?.originCastId !== undefined
        ? (this.#castOperationBindings.get(cast.originCastId) ?? [])
        : cast !== null
          ? (this.#unboundSkillOperationBindings.get(
              `${source.definitionOwnerId}\u0000${cast.originSkillId}`,
            ) ?? [])
          : (this.#castOperationBindings.get(source.sourceActionId) ??
            this.#unboundSkillOperationBindings.get(
              `${source.definitionOwnerId}\u0000${source.sourceActionId}`,
            ) ??
            []);
    let binding:
      | { readonly operator: CombatOperatorProgram; readonly program: CombatOperationProgram }
      | undefined =
      cast === null
        ? candidates.length === 1
          ? candidates[0]
          : undefined
        : candidates.find(candidate => candidate.program.skillId === cast.originSkillId);
    // Buff 的创建者可以被动作改成干员，并不一定是实际施法宿主。
    // 独立实体施法按施法身份查找子技能，不能只从 Buff 创建者反推程序。
    if (binding === undefined && cast !== null && cast.originCastId === undefined) {
      const target = runtimeTargetFromEntityId(source.sourceId);
      const entity =
        target.kind === 'abilityEntity'
          ? this.abilityEntities.runtimeState.instances.get(target.instanceId)
          : undefined;
      const child =
        entity?.childSkills.find(skill => skill.skillId === cast.originSkillId) ??
        [...this.abilityEntities.runtimeState.instances.values()]
          .flatMap(instance => instance.childSkills)
          .find(
            skill =>
              skill.skillId === cast.originSkillId &&
              skill.host.skill.execution.skillCastId === cast.skillCastId,
          );
      const operator = this.#operators.get(source.definitionOwnerId);
      if (child !== undefined && operator !== undefined) {
        const { program } = this.abilityEntityChildSkillPrograms.resolve(child.programId);
        binding = {
          operator,
          program: { ...program, operatorId: operator.operatorId, costs: [] },
        };
      }
    }
    if (binding === undefined && cast?.originCastId === undefined) {
      for (const operatorId of [source.sourceId, source.definitionOwnerId, source.ownerId]) {
        const createOperations = this.#reactiveOperationBindings.get(
          `${operatorId}\u0000${source.sourceActionId}`,
        );
        if (createOperations !== undefined) return createOperations();
      }
    }
    if (binding === undefined) {
      throw new Error(
        `Buff lifecycle references unknown source action '${castId}' (skill '${cast?.originSkillId}', definition owner '${source.definitionOwnerId}', candidates: ${candidates.map(candidate => candidate.program.skillId).join(', ')})`,
      );
    }
    if (cast !== null && binding.program.skillId !== cast.originSkillId) {
      throw new Error(
        `Buff lifecycle source '${source.sourceId}' does not match action '${castId}'`,
      );
    }
    // 干员宿主上的 Buff 生命周期相对实际宿主执行；敌方与能力实体仍沿用
    // 当前创建来源干员。施法快照只负责定位原程序，不强迫后代 Buff 继续归因原施法者。
    const ownerOperator = this.#operators.get(source.ownerId);
    const sourceOperator = this.#operators.get(source.sourceId);
    const definitionOperator = this.#operators.get(source.definitionOwnerId);
    if (definitionOperator === undefined) {
      throw new Error(
        `Buff lifecycle definition owner '${source.definitionOwnerId}' is not a combat operator`,
      );
    }
    const operationOperator = ownerOperator ?? sourceOperator ?? binding.operator;
    const operationProgram =
      operationOperator.operatorId === binding.program.operatorId
        ? binding.program
        : { ...binding.program, operatorId: operationOperator.operatorId };
    return this.#createOperationChain({
      operator: operationOperator,
      sourceActionId: castId,
      ...(cast?.originCastId === undefined ? {} : { castId: cast.originCastId }),
      // 宿主、Buff 来源和触发施法都可能属于不同干员；定义目录使用实例保存的显式身份。
      definitionOperator,
      program: operationProgram,
      enemy: options.enemy,
      createDelegate: options.createOperationExecutor,
      isOperatorControlled: options.isOperatorControlled,
      resolveVitals: options.resolveVitals,
      resolveOperatorVitals: options.resolveOperatorVitals,
      getNonReturnedSpCost: () => cast?.nonReturnedSpCost ?? 0,
      operationHost: {
        state: source.operations ?? createCombatOperationHostState(),
        programs: this.combatOperationPrograms,
      },
    });
  }

  /** 普通施放与常驻事件共享技能控制绑定和包装顺序。 */
  #wrapSkillControlOperations(
    operatorId: string,
    delegate: CombatOperationExecutor,
    queryTargets: TargetContextOperationExecutor['queryTargets'],
    requestEntityCast: AbilityEntityOperationExecutor['requestSkillCast'],
  ): CombatOperationExecutor {
    const cooldownDelegate = new SkillCooldownOperationExecutor({
      queryTargets,
      reduceByBaseDurationRatio: (skill, ratio, targetId = operatorId) =>
        this.#adjustSkillCooldowns(targetId, skill, 'reduce', 'baseDurationRatio', ratio),
      reduceByAbsoluteFrames: (skill, frames, targetId = operatorId) =>
        this.#adjustSkillCooldowns(targetId, skill, 'reduce', 'absoluteFrames', frames),
      setByBaseDurationRatio: (skill, ratio, targetId = operatorId) =>
        this.#adjustSkillCooldowns(targetId, skill, 'set', 'baseDurationRatio', ratio),
      setByAbsoluteFrames: (skill, frames, targetId = operatorId) =>
        this.#adjustSkillCooldowns(targetId, skill, 'set', 'absoluteFrames', frames),
      delegate,
    });
    const baseDelegate = new SkillSlotOperationExecutor({
      changeSkillSlot: (skillSlotKey, targetSkillKey, inheritCooldownProgress) =>
        this.#changeSkillSlot(operatorId, skillSlotKey, targetSkillKey, inheritCooldownProgress),
      replaceSkillSlot: parameters => this.#replaceSkillSlot(operatorId, parameters),
      finishSkillSlotReplacement: (group, id) =>
        this.#finishSkillSlotReplacement(operatorId, group, id),
      activatePlayerActionMode: modeId =>
        this.#requireAbilitySystem(operatorId).activatePlayerActionMode(modeId).registrationId,
      finishPlayerActionMode: id =>
        this.#requireAbilitySystem(operatorId).finishPlayerActionModeActivation(id),
      overrideBasicAttackMapping: skillId =>
        this.#requireAbilitySystem(operatorId).overrideBasicAttackMapping(skillId).registrationId,
      finishBasicAttackMapping: id =>
        this.#requireAbilitySystem(operatorId).finishBasicAttackMapping(id),
      setMultiDashLimit: limit => {
        this.#requireAbilitySystem(operatorId).runtimeState.overrideMultiDashLimit = limit;
      },
      changeNativeSkillType: (skillKey, nativeSkillType) =>
        this.#requireAbilitySystem(operatorId).changeNativeSkillType(skillKey, nativeSkillType),
      delegate: cooldownDelegate,
    });
    return new SkillCastOperationExecutor({
      casterId: operatorId,
      queryTargets,
      interruptCurrentSkill: target => {
        if (target.kind === 'operator')
          this.#requireAbilitySystem(target.operatorId).interruptCurrentSkill();
        else if (target.kind === 'abilityEntity')
          this.abilityEntities.childSkillHosts(target).ability.interruptCurrentSkill();
      },
      request: (request, caster, context) => {
        if (caster?.kind === 'abilityEntity') {
          if (!context) throw new Error('entity skill cast requires its action context');
          requestEntityCast(caster, request, context);
        } else {
          this.requestPostNativeSkillCast(
            caster?.kind === 'operator' ? caster.operatorId : operatorId,
            request,
          );
        }
      },
      delegate: baseDelegate,
    });
  }

  #createOperationChain(options: {
    readonly operator: CombatOperatorProgram;
    /** 当前时间轴施放身份；定义程序本身始终与单次施放无关。 */
    readonly castId?: string;
    /** 后代技能使用自身程序执行，但回执与事件继续归因发起这条动作链的来源。 */
    readonly sourceActionId?: string;
    /** 跨实体 Buff 生命周期仍从创建该定义的原始 AbilitySystem 解析后代资源。 */
    readonly definitionOperator?: CombatOperatorProgram;
    readonly program: CombatOperationProgram;
    readonly enemy: CombatEnemyProgram;
    readonly createDelegate: CombatRuntimeAssemblyOptions['createOperationExecutor'];
    readonly isOperatorControlled: CombatRuntimeAssemblyOptions['isOperatorControlled'];
    readonly resolveVitals: CombatRuntimeAssemblyOptions['resolveVitals'];
    readonly resolveOperatorVitals: CombatRuntimeAssemblyOptions['resolveOperatorVitals'];
    readonly getNonReturnedSpCost: () => number;
    readonly operationHost?: {
      readonly state: CombatOperationHostState;
      readonly programs: CombatOperationPrograms;
    };
  }): CombatOperationExecutor {
    const {
      operator,
      program,
      enemy,
      createDelegate,
      isOperatorControlled,
      resolveVitals,
      resolveOperatorVitals,
      getNonReturnedSpCost,
    } = options;
    const definitionOperator = options.definitionOperator ?? operator;
    const sourceActionId = options.sourceActionId ?? options.castId ?? program.skillId;
    const operationHost = options.operationHost ?? {
      state: createCombatOperationHostState(),
      programs: this.combatOperationPrograms,
    };
    const operatorId = operator.operatorId;
    const terminalDelegate = createDelegate({
      queryTargets: (query, context) => targetContextOperations.queryTargets(query, context),
      resolveInflictionTarget: target => {
        if (target.kind !== 'abilityEntity') return target;
        const entity = this.abilityEntities.snapshot(target);
        const owner = this.#operators.get(entity.ownerId);
        const definition =
          owner === undefined
            ? undefined
            : this.#resolveOperatorAbilityEntityDefinition(owner, entity.abilityEntityId);
        return definition?.soul?.canBeDirectlyBuffed === false
          ? this.abilityEntities.mainBody(target)
          : target;
      },
      readSimulationInputs: () =>
        this.#castParameters.get(
          `${definitionOperator.operatorId}\u0000${options.castId ?? program.skillId}`,
        ),
      // 环境末端的旧公开端口仍声明时间轴程序；嵌入式宿主不会读取编辑身份。
      program: program as CompiledSkillProgram,
      ...(options.castId === undefined ? {} : { castId: options.castId }),
      sourceOperatorId: definitionOperator.operatorId,
      resolveAbilitySystemSourceId: entityId => this.#resolveAbilitySystemSourceId(entityId),
      resolveSharedDamageTransfer: target => this.abilityEntities.sharedDamageTransfer(target),
      buffDefinitions: definitionOperator.buffDefinitions,
      enemy,
      equipmentContributions: operator.equipmentContributions ?? [],
      ...(operator.panel === undefined ? {} : { panel: operator.panel }),
      clock: this.clock,
      resources: this.resources,
      receipt: this.receipt,
      semanticEvents: this.semanticEvents,
    });
    const passiveUiDelegate = new CharacterPassiveUiOperationExecutor({
      sourceOperatorId: operatorId,
      resolveTargetId: target => (target === 'enemy' ? 'enemy' : operatorId),
      clock: this.clock,
      receipt: this.receipt,
      delegate: terminalDelegate,
    });
    const deferredSkillCasts = this.#wrapSkillControlOperations(
      operatorId,
      passiveUiDelegate,
      (query, context) => targetContextOperations.queryTargets(query, context),
      (entity, request, context) =>
        abilityEntityOperations.requestSkillCast(entity, request, context),
    );
    const customAbilityEvents: CustomAbilityEventOperationExecutor =
      new CustomAbilityEventOperationExecutor({
        sourceId: operatorId,
        queryTargets: (query, context) => targetContextOperations.queryTargets(query, context),
        emit: (entityId, payload) => {
          if (this.#options.emitAbilityEvent === undefined) {
            throw new Error('custom ability event requires an AbilitySystem event emitter');
          }
          this.#options.emitAbilityEvent(entityId, 'customAbilityEvent', payload);
        },
        delegate: deferredSkillCasts,
      });
    const targetContextOperations = new TargetContextOperationExecutor(
      operatorId,
      customAbilityEvents,
      id => this.#resolveAbilitySystemSourceId(id),
      {
        readSquadSlot: index => this.#readSquadSlot(index),
        listOperatorIds: () => this.#operatorOrder,
        isOperatorControlled: candidate => {
          if (isOperatorControlled === undefined) {
            throw new Error(
              `character-team query '${program.skillId}' requires the current controlled operator`,
            );
          }
          return isOperatorControlled(candidate, this.clock.frame);
        },
        resolveVitals: candidate => {
          if (resolveOperatorVitals === undefined) {
            throw new Error(`character-team query '${program.skillId}' requires operator vitals`);
          }
          return resolveOperatorVitals(candidate);
        },
      },
      id => this.#findAbilitySystemSource(id),
      id => this.#resolveAbilityEntityObjectType(id),
      () => this.projectileLifetimes.getUnfinishedTargets(),
      {
        // MainTargetFinder 读取全局主目标；单敌场景固定为木桩。
        mainTarget: () => ({ kind: 'enemy' }),
        enemyMatchesTags: query =>
          this.#resolveBuffTargetById('enemy').matchesEntityTags(query.tags, query.tagQueryType),
        ownerSpawned: query => this.abilityEntities.findOwnerSpawned(query),
        mainBody: target => this.abilityEntities.mainBody(target),
        exclusionTarget: target => this.#resolveExclusionTarget(target),
        allyHitBox: (owner, query) => this.#queryAllyHitBox(owner, query),
        abilityEntityTarget: owner => this.abilityEntities.snapshot(owner).target,
        ownerSoul: owner => this.abilityEntities.ownerSoul(owner),
        ownerSpawnedProjectiles: ownerId => this.projectileLifetimes.findOwnerSpawned(ownerId),
        entityLifeState: target => this.#queryEntityLifeState(target),
      },
      this.sharedState.identities.spatialPoints,
    );
    const abilityEntityOperations = new AbilityEntityOperationExecutor(
      operatorId,
      this.abilityEntities,
      targetContextOperations,
      {
        resolveOperations: state =>
          this.#createOperationChain({
            ...options,
            operationHost: { state, programs: operationHost.programs },
          }),
        semanticEvents: this.semanticEvents,
        installPassiveSkills: (entity, definition) =>
          this.#installAbilityEntityPassiveSkills(entity, definition),
        prepareSoul: (target, definition) => this.#prepareSoul(target, definition, operatorId),
        initializeSoul: (entity, definition) => this.#initializeSoul(entity, definition),
        programs: this.abilityEntityChildSkillPrograms,
        finishProjectile: target => this.projectileLifetimes.finishByAction(target),
        ...this.#projectileRuntimeDependencies(operatorId),
      },
      abilityEntityId =>
        this.#resolveOperatorAbilityEntityDefinition(definitionOperator, abilityEntityId, program),
      { state: operationHost.state.abilityEntities, programs: operationHost.programs },
    );
    const timeDilationOperations = this.#wrapPresentationAndTimeOperations(
      abilityEntityOperations,
      operatorId,
      program.skillId,
      isOperatorControlled,
      operationHost,
      (query, context) => targetContextOperations.queryTargets(query, context),
    );
    const buffOperations = new BuffOperationExecutor({
      queryTargets: (query, context) => targetContextOperations.queryTargets(query, context),
      isEntityAvailable: target => this.#queryEntityLifeState(target) !== undefined,
      triggerCharacterInflictionEvent: (ownerId, sourceId, event, element) =>
        this.#publishCharacterInfliction(ownerId, sourceId, event, element),
      isCharacterTarget: id => this.#operators.has(id),
      beforeCharacterInfliction: (ownerId, sourceId, element) => {
        if (this.#options.emitAbilityEvent === undefined)
          throw new Error('character infliction event publisher is not configured');
        this.#options.emitAbilityEvent(ownerId, 'beforeTakeSpellInfliction', {
          sourceId: ownerId,
          targetId: sourceId,
          element,
        });
      },
      sourceId: operatorId,
      definitionOwnerId: definitionOperator.operatorId,
      readProcessingSkillCastId: ownerId =>
        this.#abilitySystems.get(ownerId)?.currentProcessingSkillCastId,
      sourceActionId,
      resolveTarget: target => this.#resolveBuffTarget(target, operatorId),
      resolveApplicationTargets: target =>
        this.#resolveBuffApplicationTargets(
          target,
          operatorId,
          isOperatorControlled,
          resolveOperatorVitals,
        ),
      resolveCurrentAbilityEntityTarget: target =>
        this.#resolveAbilityEntityBuffTarget(target, this.#options),
      resolveAbilityEntityTimedMarkerSource: (target, markerId) =>
        this.abilityEntities.timedMarkers(target).latestActiveSourceTargetId(markerId),
      resolveEventTarget: targetId => this.#resolveBuffTargetById(targetId),
      resolveBuffReference: reference => this.#resolveBuffReference(reference),
      resolveBuffDefinition: buffId => definitionOperator.buffDefinitions?.[buffId],
      onPhysicalInflictionApplied: event => this.#publishAfterPhysicalInfliction(event),
      onBeforeOutputPhysicalInfliction: payload => this.#publishBeforePhysicalInfliction(payload),
      delegate: timeDilationOperations,
    });
    const globalBuffOperations = new GlobalBuffOperationExecutor(
      {
        sourceId: operatorId,
        sourceActionId,
        runtime: this.globalBuffs,
        delegate: buffOperations,
      },
      { state: operationHost.state.globalBuffs, programs: operationHost.programs },
    );
    const timedMarkerOperations = new TimedMarkerOperationExecutor(
      {
        globalCooldowns: this.#globalCooldowns,
        resolveCooldownCharacter: (target, context) =>
          this.#requireCooldownCharacter(target, operatorId, context),
        resolveTarget: target =>
          target === 'enemy'
            ? this.#enemyTimedMarkers
            : this.#requireTimedMarkerContainer(operatorId),
        queryTargets: (query, context) => targetContextOperations.queryTargets(query, context),
        resolveEventTarget: targetId => this.#resolveTimedMarkerContainerById(targetId),
        globalScaledClock: this.timeDilation ?? this.clock,
        delegate: globalBuffOperations,
      },
      { state: operationHost.state.timedMarkers, programs: operationHost.programs },
    );
    const superArmorConditions = new EnemySuperArmorConditionExecutor(
      enemy.superArmor,
      timedMarkerOperations,
    );
    const rankConditions = new EnemyRankConditionExecutor(enemy.rank, superArmorConditions);
    const vitalsConditions = new CombatVitalsConditionExecutor({
      resolveTarget: (target, buffSourceId) => {
        if (resolveVitals === undefined) {
          throw new Error(`skill '${program.skillId}' requires a combat vitals resolver`);
        }
        return resolveVitals(target, operatorId, buffSourceId);
      },
      resolveContextTarget: candidate => {
        if (resolveOperatorVitals === undefined) {
          throw new Error(`skill '${program.skillId}' requires operator vitals`);
        }
        return resolveOperatorVitals(candidate);
      },
      delegate: rankConditions,
    });
    const controlConditions = new OperatorControlConditionExecutor({
      isCasterControlled: () => {
        if (isOperatorControlled === undefined) {
          throw new Error(`skill '${program.skillId}' requires the current controlled operator`);
        }
        return isOperatorControlled(operatorId, this.clock.frame);
      },
      delegate: vitalsConditions,
    });
    const comboWindowOperations = new ComboWindowOperationExecutor(
      operatorId,
      this.comboWindows,
      controlConditions,
      (skillSlotKey, ownerId) =>
        this.#requireAbilitySystem(ownerId).currentSkillKeyForSlot(skillSlotKey),
    );
    const eventConditions = new EventContextConditionExecutor(
      comboWindowOperations,
      isOperatorControlled === undefined
        ? undefined
        : sourceId => isOperatorControlled(sourceId, this.clock.frame),
      sourceId => runtimeTargetEntityId(this.#findAbilitySystemSource(sourceId)),
      (targetId, ownedTags, requiredTags, match) =>
        this.#resolveBuffTargetById(targetId).matchesTags!(ownedTags, requiredTags, match),
      (target, context) => {
        const targetId = this.#resolveCurrentSkillOwnerId(operatorId, target, context);
        return targetId === undefined
          ? undefined
          : this.#abilitySystems.get(targetId)?.currentSkillType;
      },
      id => this.#resolveAbilityEntityObjectType(id),
      (target, context) => this.#resolveNormalSkillSubType(operatorId, target, context),
    );
    const skillCastInheritance = new SkillCastInheritanceOperationExecutor(
      definitionOperator.operatorId,
      this.#basicAttackSkillCastInheritance,
      eventConditions,
      { state: operationHost.state.skillCastInheritance, programs: operationHost.programs },
    );
    const delegate = new ActionBlackboardOperationExecutor(
      skillCastInheritance,
      this.#options.probabilitySamples,
      this.#options.readSourceAttributeValue === undefined
        ? undefined
        : {
            sourceId: operator.operatorId,
            read: (sourceId, request) =>
              this.#options.readSourceAttributeValue!(
                this.#resolveAbilitySystemSourceId(sourceId),
                request,
              ),
          },
      ownerId => this.#abilitySystems.get(ownerId)?.currentSkillTimelineFrame,
      {
        sourceId: operatorId,
        resolve: ownerId => this.#resolveOwnerDeckAttributes(ownerId),
      },
      {
        sourceId: operatorId,
        resolve: entityId => this.#operators.get(entityId)?.element,
        readSquadSlot: index => this.#readSquadSlot(index),
        readTypeId: entityId => this.#operators.get(entityId)?.characterTypeId,
      },
      {
        sourceId: operatorId,
        resolve: entityId => this.#operators.get(entityId)?.operatorRole,
      },
      {
        read: (entityId, property) => {
          const vitals = this.#readTargetVitals(entityId, operatorId, property);
          if (vitals === undefined) {
            throw new Error(`skill '${program.skillId}' cannot resolve vitals for '${entityId}'`);
          }
          return property === 'currentHealth'
            ? vitals.health
            : property === 'maxHealth'
              ? vitals.maxHealth
              : vitals.poise;
        },
        queryTargets: (query, context) => targetContextOperations.queryTargets(query, context),
        setHealthFloor: (entityId, mode, value) => {
          const vitals = this.#readTargetVitals(entityId, operatorId);
          if (vitals === undefined) {
            throw new Error(`skill '${program.skillId}' cannot resolve vitals for '${entityId}'`);
          }
          return vitals.requestHealthFloor(
            mode === 'maxHealthRatio' ? vitals.maxHealth * value : value,
          );
        },
        removeHealthFloor: (entityId, handle) => {
          const vitals = this.#readTargetVitals(entityId, operatorId);
          if (vitals === undefined) {
            throw new Error(`skill '${program.skillId}' cannot resolve vitals for '${entityId}'`);
          }
          vitals.removeHealthFloor(handle);
        },
      },
      { state: operationHost.state.actionBlackboard, programs: operationHost.programs },
    );
    const operationChain = new SkillResourceOperationExecutor(
      {
        sourceOperatorId: operatorId,
        sourceActionId: program.skillId,
        clock: this.clock,
        resources: this.resources,
        receipt: this.receipt,
        getNonReturnedSpCost,
        finisherSpRecovery: enemy.stagger.finisherSpRecovery,
        onSpGained: event => {
          if (this.#options.emitAbilityEvent === undefined)
            throw new Error('SP gain requires an ability event publisher');
          this.#options.emitAbilityEvent(event.sourceId, 'skillSpGained', event);
        },
        onPerfectDodge: sourceOperatorId => {
          if (this.#options.emitAbilityEvent === undefined)
            throw new Error('perfect Dodge record requires an ability event publisher');
          this.#options.emitAbilityEvent(sourceOperatorId, 'perfectDodge', {
            sourceId: sourceOperatorId,
            targetId: sourceOperatorId,
          });
        },
        delegate,
      },
      { state: operationHost.state.resources, programs: operationHost.programs },
    );
    return withTerminalPreparation(
      operationChain,
      terminalDelegate,
      operationHost,
      this.#options.executionTrace === undefined
        ? undefined
        : {
            recorder: this.#options.executionTrace,
            frame: () => this.clock.frame,
            receiptCount: () => this.receipt.history.length,
          },
      buffOperations.aura,
      () => this.clock.frame,
      (query, context) => targetContextOperations.queryTargets(query, context),
      this.comboWindows,
      buffOperations.ownerTagQuery,
    );
  }

  #createEquipmentEventOperationChain(
    operator: CombatOperatorProgram,
    source: EquipmentEventExecutionContext,
    options: CombatRuntimeAssemblyOptions,
  ): CombatOperationExecutor {
    const createTerminal = options.createEquipmentEventOperationExecutor;
    if (createTerminal === undefined) {
      throw new Error('equipment event executor is not configured');
    }
    const sourceActionId = `equipment:${source.source.kind}:${source.source.slug}:${source.handlerKey}`;
    const terminal = createTerminal({
      ...source,
      resolveSharedDamageTransfer: target => this.abilityEntities.sharedDamageTransfer(target),
      buffDefinitions: operator.buffDefinitions,
      enemy: options.enemy,
      ...(operator.panel === undefined ? {} : { panel: operator.panel }),
      clock: this.clock,
      resources: this.resources,
      receipt: this.receipt,
      semanticEvents: this.semanticEvents,
    });
    return this.#createReactiveOperationChain(operator, sourceActionId, terminal, options);
  }

  /** 常驻事件监听器共用的条件与动作解释链；来源模块只提供末端能力和归因身份。 */
  #createReactiveOperationChain(
    operator: CombatOperatorProgram,
    sourceActionId: string,
    terminal: CombatOperationExecutor,
    options: CombatRuntimeAssemblyOptions,
    restoredOperationHost?: CombatOperationHostState,
  ): CombatOperationExecutor {
    const operatorId = operator.operatorId;
    const operationHost = {
      state: restoredOperationHost ?? createCombatOperationHostState(),
      programs: this.combatOperationPrograms,
    };
    const passiveUiOperations = new CharacterPassiveUiOperationExecutor({
      sourceOperatorId: operatorId,
      resolveTargetId: target => (target === 'enemy' ? 'enemy' : operatorId),
      clock: this.clock,
      receipt: this.receipt,
      delegate: terminal,
    });
    const deferredSkillCasts = this.#wrapSkillControlOperations(
      operatorId,
      passiveUiOperations,
      (query, context) => targetContextOperations.queryTargets(query, context),
      (entity, request, context) =>
        abilityEntityOperations.requestSkillCast(entity, request, context),
    );
    const customAbilityEvents: CustomAbilityEventOperationExecutor =
      new CustomAbilityEventOperationExecutor({
        sourceId: operatorId,
        queryTargets: (query, context) => targetContextOperations.queryTargets(query, context),
        emit: (entityId, payload) => {
          if (options.emitAbilityEvent === undefined) {
            throw new Error('custom ability event requires an AbilitySystem event emitter');
          }
          options.emitAbilityEvent(entityId, 'customAbilityEvent', payload);
        },
        delegate: deferredSkillCasts,
      });
    const targetContextOperations = new TargetContextOperationExecutor(
      operatorId,
      customAbilityEvents,
      id => this.#resolveAbilitySystemSourceId(id),
      {
        readSquadSlot: index => this.#readSquadSlot(index),
        listOperatorIds: () => this.#operatorOrder,
        isOperatorControlled: candidate => {
          if (options.isOperatorControlled === undefined) {
            throw new Error(
              `character-team query '${sourceActionId}' requires the current controlled operator`,
            );
          }
          return options.isOperatorControlled(candidate, this.clock.frame);
        },
        resolveVitals: candidate => {
          if (options.resolveOperatorVitals === undefined) {
            throw new Error(`character-team query '${sourceActionId}' requires operator vitals`);
          }
          return options.resolveOperatorVitals(candidate);
        },
      },
      id => this.#findAbilitySystemSource(id),
      id => this.#resolveAbilityEntityObjectType(id),
      () => this.projectileLifetimes.getUnfinishedTargets(),
      {
        // MainTargetFinder 读取全局主目标；单敌场景固定为木桩。
        mainTarget: () => ({ kind: 'enemy' }),
        enemyMatchesTags: query =>
          this.#resolveBuffTargetById('enemy').matchesEntityTags(query.tags, query.tagQueryType),
        ownerSpawned: query => this.abilityEntities.findOwnerSpawned(query),
        mainBody: target => this.abilityEntities.mainBody(target),
        exclusionTarget: target => this.#resolveExclusionTarget(target),
        allyHitBox: (owner, query) => this.#queryAllyHitBox(owner, query),
        abilityEntityTarget: owner => this.abilityEntities.snapshot(owner).target,
        ownerSoul: owner => this.abilityEntities.ownerSoul(owner),
        ownerSpawnedProjectiles: ownerId => this.projectileLifetimes.findOwnerSpawned(ownerId),
        entityLifeState: target => this.#queryEntityLifeState(target),
      },
      this.sharedState.identities.spatialPoints,
    );
    const abilityEntityOperations = new AbilityEntityOperationExecutor(
      operatorId,
      this.abilityEntities,
      targetContextOperations,
      {
        resolveOperations: state =>
          this.#createReactiveOperationChain(operator, sourceActionId, terminal, options, state),
        semanticEvents: this.semanticEvents,
        installPassiveSkills: (entity, definition) =>
          this.#installAbilityEntityPassiveSkills(entity, definition),
        prepareSoul: (target, definition) => this.#prepareSoul(target, definition, operatorId),
        initializeSoul: (entity, definition) => this.#initializeSoul(entity, definition),
        programs: this.abilityEntityChildSkillPrograms,
        finishProjectile: target => this.projectileLifetimes.finishByAction(target),
        ...this.#projectileRuntimeDependencies(operatorId),
      },
      abilityEntityId => this.#resolveOperatorAbilityEntityDefinition(operator, abilityEntityId),
      { state: operationHost.state.abilityEntities, programs: operationHost.programs },
    );
    const timeDilationOperations = this.#wrapPresentationAndTimeOperations(
      abilityEntityOperations,
      operatorId,
      sourceActionId,
      options.isOperatorControlled,
      operationHost,
      (query, context) => targetContextOperations.queryTargets(query, context),
    );
    const buffOperations = new BuffOperationExecutor({
      queryTargets: (query, context) => targetContextOperations.queryTargets(query, context),
      isEntityAvailable: target => this.#queryEntityLifeState(target) !== undefined,
      triggerCharacterInflictionEvent: (ownerId, sourceId, event, element) =>
        this.#publishCharacterInfliction(ownerId, sourceId, event, element),
      isCharacterTarget: id => this.#operators.has(id),
      beforeCharacterInfliction: (ownerId, sourceId, element) => {
        if (this.#options.emitAbilityEvent === undefined)
          throw new Error('character infliction event publisher is not configured');
        this.#options.emitAbilityEvent(ownerId, 'beforeTakeSpellInfliction', {
          sourceId: ownerId,
          targetId: sourceId,
          element,
        });
      },
      sourceId: operatorId,
      sourceActionId,
      readProcessingSkillCastId: ownerId =>
        this.#abilitySystems.get(ownerId)?.currentProcessingSkillCastId,
      resolveTarget: target => this.#resolveBuffTarget(target, operatorId),
      resolveApplicationTargets: target =>
        this.#resolveBuffApplicationTargets(
          target,
          operatorId,
          options.isOperatorControlled,
          options.resolveOperatorVitals,
        ),
      resolveCurrentAbilityEntityTarget: target =>
        this.#resolveAbilityEntityBuffTarget(target, options),
      resolveAbilityEntityTimedMarkerSource: (target, markerId) =>
        this.abilityEntities.timedMarkers(target).latestActiveSourceTargetId(markerId),
      resolveEventTarget: targetId => this.#resolveBuffTargetById(targetId),
      resolveBuffReference: reference => this.#resolveBuffReference(reference),
      resolveBuffDefinition: buffId => operator.buffDefinitions?.[buffId],
      onPhysicalInflictionApplied: event => this.#publishAfterPhysicalInfliction(event),
      onBeforeOutputPhysicalInfliction: payload => this.#publishBeforePhysicalInfliction(payload),
      delegate: timeDilationOperations,
    });
    const globalBuffOperations = new GlobalBuffOperationExecutor(
      {
        sourceId: operatorId,
        sourceActionId,
        runtime: this.globalBuffs,
        delegate: buffOperations,
      },
      { state: operationHost.state.globalBuffs, programs: operationHost.programs },
    );
    const markerOperations = new TimedMarkerOperationExecutor(
      {
        globalCooldowns: this.#globalCooldowns,
        resolveCooldownCharacter: (target, context) =>
          this.#requireCooldownCharacter(target, operatorId, context),
        resolveTarget: target =>
          target === 'enemy'
            ? this.#enemyTimedMarkers
            : this.#requireTimedMarkerContainer(operatorId),
        queryTargets: (query, context) => targetContextOperations.queryTargets(query, context),
        resolveEventTarget: targetId => this.#resolveTimedMarkerContainerById(targetId),
        globalScaledClock: this.timeDilation ?? this.clock,
        delegate: globalBuffOperations,
      },
      { state: operationHost.state.timedMarkers, programs: operationHost.programs },
    );
    const superArmorConditions = new EnemySuperArmorConditionExecutor(
      options.enemy.superArmor,
      markerOperations,
    );
    const rankConditions = new EnemyRankConditionExecutor(options.enemy.rank, superArmorConditions);
    const vitalsConditions = new CombatVitalsConditionExecutor({
      resolveTarget: (target, buffSourceId) => {
        if (options.resolveVitals === undefined) {
          throw new Error(`reactive event '${sourceActionId}' requires a vitals resolver`);
        }
        return options.resolveVitals(target, operatorId, buffSourceId);
      },
      resolveContextTarget: candidate => {
        if (options.resolveOperatorVitals === undefined) {
          throw new Error(`reactive event '${sourceActionId}' requires operator vitals`);
        }
        return options.resolveOperatorVitals(candidate);
      },
      delegate: rankConditions,
    });
    const controlConditions = new OperatorControlConditionExecutor({
      isCasterControlled: () => {
        if (options.isOperatorControlled === undefined) {
          throw new Error(`reactive event '${sourceActionId}' requires control state`);
        }
        return options.isOperatorControlled(operatorId, this.clock.frame);
      },
      delegate: vitalsConditions,
    });
    const comboWindowOperations = new ComboWindowOperationExecutor(
      operatorId,
      this.comboWindows,
      controlConditions,
      (skillSlotKey, ownerId) =>
        this.#requireAbilitySystem(ownerId).currentSkillKeyForSlot(skillSlotKey),
    );
    const eventConditions = new EventContextConditionExecutor(
      comboWindowOperations,
      options.isOperatorControlled === undefined
        ? undefined
        : sourceId => options.isOperatorControlled!(sourceId, this.clock.frame),
      sourceId => runtimeTargetEntityId(this.#findAbilitySystemSource(sourceId)),
      (targetId, ownedTags, requiredTags, match) =>
        this.#resolveBuffTargetById(targetId).matchesTags!(ownedTags, requiredTags, match),
      (target, context) => {
        const targetId = this.#resolveCurrentSkillOwnerId(operatorId, target, context);
        return targetId === undefined
          ? undefined
          : this.#abilitySystems.get(targetId)?.currentSkillType;
      },
      id => this.#resolveAbilityEntityObjectType(id),
      (target, context) => this.#resolveNormalSkillSubType(operatorId, target, context),
    );
    const skillCastInheritance = new SkillCastInheritanceOperationExecutor(
      operatorId,
      this.#basicAttackSkillCastInheritance,
      eventConditions,
      { state: operationHost.state.skillCastInheritance, programs: operationHost.programs },
    );
    const blackboardOperations = new ActionBlackboardOperationExecutor(
      skillCastInheritance,
      this.#options.probabilitySamples,
      options.readSourceAttributeValue === undefined
        ? undefined
        : {
            sourceId: operatorId,
            read: (sourceId, request) =>
              options.readSourceAttributeValue!(
                this.#resolveAbilitySystemSourceId(sourceId),
                request,
              ),
          },
      undefined,
      {
        sourceId: operatorId,
        resolve: ownerId => this.#resolveOwnerDeckAttributes(ownerId),
      },
      {
        sourceId: operatorId,
        resolve: entityId => this.#operators.get(entityId)?.element,
        readTypeId: entityId => this.#operators.get(entityId)?.characterTypeId,
        readSquadSlot: index => this.#readSquadSlot(index),
      },
      {
        sourceId: operatorId,
        resolve: entityId => this.#operators.get(entityId)?.operatorRole,
      },
      {
        read: (entityId, property) => {
          const vitals = this.#readTargetVitals(entityId, operatorId, property);
          if (vitals === undefined) {
            throw new Error(
              `reactive event '${sourceActionId}' cannot resolve vitals for '${entityId}'`,
            );
          }
          return property === 'currentHealth'
            ? vitals.health
            : property === 'maxHealth'
              ? vitals.maxHealth
              : vitals.poise;
        },
        queryTargets: (query, context) => targetContextOperations.queryTargets(query, context),
        setHealthFloor: (entityId, mode, value) => {
          const vitals = this.#readTargetVitals(entityId, operatorId);
          if (vitals === undefined) {
            throw new Error(
              `reactive event '${sourceActionId}' cannot resolve vitals for '${entityId}'`,
            );
          }
          return vitals.requestHealthFloor(
            mode === 'maxHealthRatio' ? vitals.maxHealth * value : value,
          );
        },
        removeHealthFloor: (entityId, handle) => {
          const vitals = this.#readTargetVitals(entityId, operatorId);
          if (vitals === undefined) {
            throw new Error(
              `reactive event '${sourceActionId}' cannot resolve vitals for '${entityId}'`,
            );
          }
          vitals.removeHealthFloor(handle);
        },
      },
      { state: operationHost.state.actionBlackboard, programs: operationHost.programs },
    );
    const operationChain = new SkillResourceOperationExecutor(
      {
        sourceOperatorId: operatorId,
        sourceActionId,
        clock: this.clock,
        resources: this.resources,
        receipt: this.receipt,
        getNonReturnedSpCost: () => 0,
        finisherSpRecovery: options.enemy.stagger.finisherSpRecovery,
        onSpGained: event => {
          if (this.#options.emitAbilityEvent === undefined)
            throw new Error('SP gain requires an ability event publisher');
          this.#options.emitAbilityEvent(event.sourceId, 'skillSpGained', event);
        },
        onPerfectDodge: sourceOperatorId => {
          if (this.#options.emitAbilityEvent === undefined)
            throw new Error('perfect Dodge record requires an ability event publisher');
          this.#options.emitAbilityEvent(sourceOperatorId, 'perfectDodge', {
            sourceId: sourceOperatorId,
            targetId: sourceOperatorId,
          });
        },
        delegate: blackboardOperations,
      },
      { state: operationHost.state.resources, programs: operationHost.programs },
    );
    const reactiveOperations = withTerminalPreparation(
      operationChain,
      terminal,
      operationHost,
      this.#options.executionTrace === undefined
        ? undefined
        : {
            recorder: this.#options.executionTrace,
            frame: () => this.clock.frame,
            receiptCount: () => this.receipt.history.length,
          },
      buffOperations.aura,
      () => this.clock.frame,
      (query, context) => targetContextOperations.queryTargets(query, context),
      this.comboWindows,
      buffOperations.ownerTagQuery,
    );
    const bindingKey = `${operatorId}\u0000${sourceActionId}`;
    if (!this.#reactiveOperationBindings.has(bindingKey)) {
      this.#reactiveOperationBindings.set(bindingKey, () =>
        this.#createReactiveOperationChain(operator, sourceActionId, terminal, options),
      );
    }
    return reactiveOperations;
  }

  #createReactiveTerminal(
    operator: CombatOperatorProgram,
    sourceActionId: string,
    options: CombatRuntimeAssemblyOptions,
  ): CombatOperationExecutor {
    const template = operator.skills[0] ?? operator.definitionSkillPrograms?.[0];
    if (template === undefined) return unsupportedReactiveTerminal;
    return options.createOperationExecutor({
      castId: sourceActionId,
      sourceOperatorId: operator.operatorId,
      resolveAbilitySystemSourceId: entityId => this.#resolveAbilitySystemSourceId(entityId),
      resolveSharedDamageTransfer: target => this.abilityEntities.sharedDamageTransfer(target),
      buffDefinitions: operator.buffDefinitions,
      program: {
        ...template,
        skillId: sourceActionId,
        initialBlackboard: {},
        timelineBlockFrames: 0,
        cooldownFrames: undefined,
        costFrame: undefined,
        costs: [],
        timelineActions: [],
        abilityEntityDefinitions: operator.abilityEntityDefinitions,
      },
      enemy: options.enemy,
      equipmentContributions: operator.equipmentContributions ?? [],
      ...(operator.panel === undefined ? {} : { panel: operator.panel }),
      clock: this.clock,
      resources: this.resources,
      receipt: this.receipt,
      semanticEvents: this.semanticEvents,
    });
  }

  /** Buff 实例先于来源宿主恢复时，按固定来源程序预建当前分支的生命周期操作工厂。 */
  #registerRestoredReactiveOperationBinding(
    operator: CombatOperatorProgram,
    sourceActionId: string,
    options: CombatRuntimeAssemblyOptions,
  ): void {
    const bindingKey = `${operator.operatorId}\u0000${sourceActionId}`;
    if (this.#reactiveOperationBindings.has(bindingKey)) return;
    this.#reactiveOperationBindings.set(bindingKey, () =>
      this.#createReactiveOperationChain(
        operator,
        sourceActionId,
        this.#createReactiveTerminal(operator, sourceActionId, options),
        options,
      ),
    );
  }

  #requireAbilitySystem(operatorId: string): AbilitySystemRuntime {
    const abilitySystem = this.#abilitySystems.get(operatorId);
    if (abilitySystem === undefined) {
      throw new Error(`combat operator '${operatorId}' is not configured`);
    }
    return abilitySystem;
  }

  #wrapPresentationAndTimeOperations(
    delegate: CombatOperationExecutor,
    operatorId: string,
    sourceActionId: string,
    isOperatorControlled: CombatRuntimeAssemblyOptions['isOperatorControlled'],
    operationHost?: {
      readonly state: CombatOperationHostState;
      readonly programs: CombatOperationPrograms;
    },
    queryTargets?: CombatOperationExecutor['queryTargets'],
  ): CombatOperationExecutor {
    delegate = new HideUiOperationExecutor(
      this.ultimatePresentation,
      operatorId,
      sourceActionId,
      delegate,
    );
    if (this.timeDilation === null) return delegate;
    const binding = operationHost ?? {
      state: createCombatOperationHostState(),
      programs: this.combatOperationPrograms,
    };
    return new TimeDilationOperationExecutor(
      {
        queryTargets,
        runtime: this.timeDilation,
        resolveTargetIds: target => {
          if (target === 'caster') return [operatorId];
          if (target === 'enemy') return ['enemy'];
          if (isOperatorControlled === undefined) {
            throw new Error(
              `time dilation '${sourceActionId}' requires the current controlled operator`,
            );
          }
          return this.#operatorOrder.filter(candidate =>
            isOperatorControlled(candidate, this.clock.frame),
          );
        },
        resolveAbilityEntityTargetIds: query => {
          if (query.kind !== 'ownerSpawned') {
            throw new Error(`unsupported ability-entity target query '${String(query.kind)}'`);
          }
          return this.abilityEntities
            .findOwnerSpawned({
              ownerId: operatorId,
              ...(query.abilityEntityIds === undefined
                ? {}
                : { abilityEntityIds: query.abilityEntityIds }),
            })
            .map(target => {
              if (target.kind !== 'abilityEntity') {
                throw new Error('owner-spawned AbilityEntity query returned a non-entity target');
              }
              return logicalAbilityEntityRuntimeId(target.instanceId);
            });
        },
        resolveContextAbilityEntityId: instanceId => {
          const target = { kind: 'abilityEntity' as const, instanceId };
          return this.abilityEntities.isActive(target) || this.projectileLifetimes.isActive(target)
            ? logicalAbilityEntityRuntimeId(instanceId)
            : null;
        },
        sourceId: operatorId,
        sourceActionId,
        delegate,
      },
      { state: binding.state.timeDilation, programs: binding.programs },
    );
  }

  #recordTimeDilation(
    event: 'TimeDilationStarted' | 'TimeDilationRejected' | 'TimeDilationEnded',
    kind: TimeDilationInstanceKind,
    instance: TimeDilationInstanceSnapshot,
    entityId?: string,
    reason?: TimeDilationEndReason,
  ): void {
    this.receipt.record({
      frame: this.clock.frame,
      time: this.clock.time,
      event,
      ...(instance.source?.sourceId === undefined ? {} : { sourceId: instance.source.sourceId }),
      ...(event === 'TimeDilationEnded' || instance.source?.producedBy === undefined
        ? {}
        : { producedBy: instance.source.producedBy }),
      ...(entityId === undefined ? {} : { targetId: entityId }),
      data: {
        instanceId: instance.id,
        kind,
        durationSeconds: instance.durationSeconds,
        slot: instance.slot,
        priority: instance.priority,
        currentScale: instance.currentScale,
        ...(instance.source?.curveKey === undefined ? {} : { curveKey: instance.source.curveKey }),
        ...(instance.source?.sourceActionId === undefined
          ? {}
          : { sourceActionId: instance.source.sourceActionId }),
        ...(instance.source?.sourceCastId === undefined
          ? {}
          : { sourceCastId: instance.source.sourceCastId }),
        ...(reason === undefined ? {} : { reason }),
      },
    });
  }

  #requireCooldownCharacter(
    target: GlobalCooldownTarget,
    operatorId: string,
    context: CombatOperationContext | undefined,
  ): string {
    const id =
      target === 'caster'
        ? operatorId
        : target === 'buffOwner'
          ? context?.buffOwnerId
          : context?.buffSourceId;
    // Native GlobalCD uses the selected entity's serverId, including enemies.
    // The parameter name charServerId does not restrict it to player characters.
    if (id === undefined || (id !== 'enemy' && !this.#operators.has(id))) {
      throw new Error(`global cooldown ${target} requires a supported combat entity identity`);
    }
    return id;
  }

  #requireTimedMarkerContainer(operatorId: string): TimedMarkerContainer {
    const container = this.#operatorTimedMarkers.get(operatorId);
    if (container === undefined) {
      throw new Error(`combat operator '${operatorId}' has no timed marker container`);
    }
    return container;
  }

  /** Buff 生命周期使用实际宿主身份；敌人和能力实体不能按干员 ID 查询。 */
  #resolveTimedMarkerContainerById(targetId: string): TimedMarkerContainer {
    if (targetId === 'enemy') return this.#enemyTimedMarkers;
    const abilityEntity = /^ability-entity:(\d+)$/.exec(targetId);
    if (abilityEntity !== null) {
      return this.abilityEntities.timedMarkers({
        kind: 'abilityEntity',
        instanceId: Number(abilityEntity[1]),
      });
    }
    return this.#requireTimedMarkerContainer(targetId);
  }

  #resolveBuffTarget(target: CombatTarget, operatorId: string): BuffOperationTarget {
    if (target === 'enemy') return this.#enemyBuffRuntime;
    const casterBuffs = this.#operatorBuffs.get(operatorId);
    if (casterBuffs === undefined) {
      throw new Error(`combat operator '${operatorId}' has no Buff operation target`);
    }
    return casterBuffs;
  }

  /** 原生 ObjectPtr 的旧引用可随宿主回收失效；不能用必须存活的新动作目标入口解析。 */
  #resolveBuffReference(reference: BuffReference): BuffApplicationHandle | undefined {
    if (!Number.isSafeInteger(reference.instanceId) || reference.instanceId <= 0)
      throw new Error('Buff reference requires a positive instance id');
    const owner = runtimeTargetFromEntityId(reference.ownerId);
    if (owner.kind === 'abilityEntity') {
      if (owner.instanceId >= this.#abilityEntityInstanceIds.runtimeState.next)
        throw new Error(`Buff owner '${reference.ownerId}' was never allocated`);
      const target = this.#abilityEntityBuffs.get(owner.instanceId);
      if (target !== undefined) {
        if (target.resolveHandle === undefined)
          throw new Error(`Buff owner '${reference.ownerId}' cannot resolve instance references`);
        return target.resolveHandle(reference);
      }
      if (
        !this.abilityEntities.isActive(owner) &&
        !this.projectileLifetimes.runtimeState.instances.has(owner.instanceId)
      )
        return undefined;
      throw new Error(`live Buff owner '${reference.ownerId}' has no Buff container`);
    }
    const target = this.#resolveBuffTargetById(reference.ownerId);
    if (target.resolveHandle === undefined)
      throw new Error(`Buff owner '${reference.ownerId}' cannot resolve instance references`);
    return target.resolveHandle(reference);
  }

  /** 帧端口只保存干员身份；中心算法在步进中取得当前分支的数据。 */
  #centerFrameRuntimes(): readonly FrameRuntime[] {
    return [...this.#operatorCenters].map(([operatorId, center]) => ({
      advanceFrame: () =>
        center.advanceFrame(
          this.#operatorCenterStates.get(operatorId)!,
          this.timeDilation?.getEntityScale(operatorId) ?? 1,
        ),
    }));
  }

  #bindOperatorCenter(
    operator: CombatOperatorProgram,
    state: OperatorCenterState,
    options: CombatRuntimeAssemblyOptions,
  ): void {
    if (this.#operatorCenterStates.has(operator.operatorId))
      throw new Error(`duplicate center state for operator '${operator.operatorId}'`);
    this.#operatorCenterStates.set(operator.operatorId, state);
    const ability = this.#requireAbilitySystem(operator.operatorId);
    const dashBuffs = operator.dodgeProgram?.dashBuffs ?? [];
    const target =
      dashBuffs.length === 0 ? undefined : this.#operatorBuffs.get(operator.operatorId);
    const apply = target?.applyScoped?.bind(target);
    if (dashBuffs.length > 0) {
      this.#registerRestoredReactiveOperationBinding(operator, CENTER_DASH_ACTION_ID, options);
    }
    this.#operatorCenters.set(
      operator.operatorId,
      new OperatorCenterStateRuntime({
        operatorId: operator.operatorId,
        clock: this.clock,
        ...(options.dashTiming === undefined ? {} : { timing: options.dashTiming }),
        receipt: this.receipt,
        interruptCurrentSkillForDash: () => ability.interruptCurrentSkillForDash(),
        addDashBuffs: dashId =>
          dashBuffs.map(application => {
            if (target === undefined) {
              throw new Error(`operator '${operator.operatorId}' has no Buff runtime for Dash`);
            }
            if (apply === undefined) {
              throw new Error(
                `operator '${operator.operatorId}' Buff runtime cannot apply scoped Dash Buffs`,
              );
            }
            const definition = operator.buffDefinitions?.[application.buffId];
            if (definition === undefined)
              throw new Error(
                `operator '${operator.operatorId}' Dash Buff '${application.buffId}' has no definition`,
              );
            const handle = apply!({
              buffId: application.buffId,
              definition,
              sourceId: operator.operatorId,
              definitionOwnerId: operator.operatorId,
              sourceActionId: CENTER_DASH_ACTION_ID,
              blackboardValues: application.blackboard,
              producedBy: {
                kind: 'action',
                ownerId: operator.operatorId,
                actionId: `dash:${dashId}`,
              },
            });
            if (handle === null)
              throw new Error(
                `operator '${operator.operatorId}' Dash Buff '${application.buffId}' was rejected`,
              );
            return handle.reference;
          }),
        clearDashBuffs: references => {
          for (const reference of references) target?.resolveHandle?.(reference)?.finish('early');
        },
      }),
    );
  }

  #createDodgeInputRuntime(options: CombatRuntimeAssemblyOptions): DodgeInputRuntime {
    return new DodgeInputRuntime(
      {
        clock: this.clock,
        inputs: options.dodgeInputs ?? [],
        executeDash: input => {
          const center = this.#operatorCenters.get(input.operatorId);
          if (center === undefined)
            throw new Error(`operator '${input.operatorId}' has no CenterState runtime`);
          const state = this.#operatorCenterStates.get(input.operatorId)!;
          const centerBefore = center.inspect(state);
          const ability = this.#requireAbilitySystem(input.operatorId);
          const multiDashBefore = this.#playerMultiDash.inspect(
            this.#playerMultiDashState,
            ability.runtimeState.overrideMultiDashLimit,
          );
          const operatorWasControlled =
            this.#operatorControl.runtimeState.get(input.operatorId) === true;
          const dashTagBlockers = options.skillAvailabilityTags?.getDashInputBlockers(
            this.#resolveBuffTarget('caster', input.operatorId),
          );
          const dashControllerState = options.resolveDashControllerState?.(input.operatorId);
          // 只维护内部账本以便切面和原生返还动作一致；体力不参与排轴闪避许可或 UI 诊断。
          this.resources.consumeDashEnergy();
          const interrupted = center.enterDash(state, {
            dashId: input.dodgeId,
            operatorId: input.operatorId,
            direction: input.direction,
          });
          this.#playerMultiDash.recordDash(this.#playerMultiDashState);
          const ultimateCannotDash =
            interrupted?.nativeSkillType === 'ultimateSkill' && interrupted.canDash !== true;
          if (
            !operatorWasControlled ||
            centerBefore.perfectDodgeDashAvailable === false ||
            multiDashBefore.canStartMultiDash === false ||
            ultimateCannotDash ||
            (dashTagBlockers?.length ?? 0) > 0 ||
            dashControllerState?.playerActionEnabled === false ||
            dashControllerState?.movementGaitAllowsDash === false ||
            dashControllerState?.isInAir === true
          ) {
            recordDodgeReceipt(this.receipt, this.clock, input.operatorId, input.dodgeId, {
              event: 'DodgeInputForced',
              data: {
                operatorNotControlled: !operatorWasControlled,
                perfectDodgeDashBlocked: centerBefore.perfectDodgeDashAvailable === false,
                repeatDashTooEarly: multiDashBefore.repeatDashTooEarly === true,
                multiDashLimitReached: multiDashBefore.multiDashLimitReached === true,
                ultimateCannotDash,
                inImmobilized: dashTagBlockers?.includes('InImmobilized') === true,
                inDisableDash: dashTagBlockers?.includes('InDisableDash') === true,
                hasSuperArmor: dashTagBlockers?.includes('SuperArmor') === true,
                playerActionDisabled: dashControllerState?.playerActionEnabled === false,
                movementGaitTooLow: dashControllerState?.movementGaitAllowsDash === false,
                isInAir: dashControllerState?.isInAir === true,
                ...(interrupted === null
                  ? {}
                  : {
                      interruptedSkillId: interrupted.skillId,
                      interruptedTimelineFrame: interrupted.timelineFrame,
                    }),
              },
            });
          }
          const operator = this.#operators.get(input.operatorId);
          if (
            options.dashTiming === undefined ||
            operator?.dodgeProgram === undefined ||
            options.skillAvailabilityTags === undefined
          ) {
            recordDodgeReceipt(this.receipt, this.clock, input.operatorId, input.dodgeId, {
              event: 'DodgeInputPartiallySimulated',
              data: {
                missingDashTiming: options.dashTiming === undefined,
                missingDodgeProgram: operator?.dodgeProgram === undefined,
                missingDashTagRules: options.skillAvailabilityTags === undefined,
              },
            });
          }
        },
        declarePerfectDodgeSuccess: input => {
          const center = this.#operatorCenters.get(input.operatorId);
          const operator = this.#operators.get(input.operatorId);
          if (center === undefined)
            throw new Error(`operator '${input.operatorId}' has no CenterState runtime`);
          const missingDodgeProgram = operator?.dodgeProgram === undefined;
          const state = this.#operatorCenterStates.get(input.operatorId)!;
          const dashNotActive = !center.canDeclarePerfectDodgeSuccess(state, input.dodgeId);
          recordDodgeReceipt(this.receipt, this.clock, input.operatorId, input.dodgeId, {
            event: 'PerfectDodgeDeclared',
            data: {},
          });
          if (missingDodgeProgram || dashNotActive) {
            recordDodgeReceipt(this.receipt, this.clock, input.operatorId, input.dodgeId, {
              event: 'PerfectDodgeDeclarationForced',
              data: { missingDodgeProgram, dashNotActive },
            });
            // 输入已被记录；找不到对应的 Dash 时，不能把它广播给另一轮监听器。
            return;
          }
          if (this.#options.emitAbilityEvent === undefined) {
            recordDodgeReceipt(this.receipt, this.clock, input.operatorId, input.dodgeId, {
              event: 'PerfectDodgeDeclarationRejected',
              data: { reason: 'missingAbilityEventPublisher' },
            });
            return;
          }
          state.perfectDodgeConsumed = true;
          state.pendingPerfectDodgeId = input.dodgeId;
          const ability = this.#requireAbilitySystem(input.operatorId);
          const previousRequest = ability.runtimeState.postSkillCastRequest;
          // 时间轴标签只声明“本次 Dash 窗口收到一次可闪避的直接攻击”。
          // 技力、时间膨胀、体力返还、成功 Buff 和 Dodge 技能均由公共监听 Buff 的原生动作链产生。
          this.#options.emitAbilityEvent(input.operatorId, 'beforeTakeDamage', {
            external: true,
            sourceId: 'enemy',
            targetId: input.operatorId,
            tags: [],
            features: [],
          });
          const pending = ability.runtimeState.postSkillCastRequest;
          if (
            state.pendingPerfectDodgeId !== null &&
            (pending === previousRequest || pending?.skillId !== operator?.dodgeProgram?.skillId)
          ) {
            state.pendingPerfectDodgeId = null;
            recordDodgeReceipt(this.receipt, this.clock, input.operatorId, input.dodgeId, {
              event: 'PerfectDodgeDeclarationRejected',
              data: { reason: 'nativeSuccessNotTriggered' },
            });
          }
        },
      },
      this.#dodgeInputState,
    );
  }

  #resolveBuffTargetById(targetId: string): BuffOperationTarget {
    if (targetId === 'enemy') return this.#enemyBuffRuntime;
    const abilityEntityMatch = /^ability-entity:(\d+)$/.exec(targetId);
    if (abilityEntityMatch !== null) {
      return this.#resolveAbilityEntityBuffTarget(
        { kind: 'abilityEntity', instanceId: Number(abilityEntityMatch[1]) },
        this.#options,
      );
    }
    const target = this.#operatorBuffs.get(targetId);
    if (target === undefined) {
      throw new Error(`combat entity '${targetId}' has no Buff operation target`);
    }
    return target;
  }

  #resolveOwnerDeckAttributes(ownerId: string) {
    const owner = this.#operators.get(ownerId);
    if (owner === undefined) return undefined;
    if (owner.panel === undefined) throw new Error(`operator '${ownerId}' has no Deck snapshot`);
    return owner.panel.attributes;
  }

  #readSquadSlot(index: number): string | undefined {
    if (!Number.isInteger(index) || index < 0) return undefined;
    for (const operator of this.#operators.values()) {
      if (operator.squadSlotIndex === index) return operator.operatorId;
    }
    return undefined;
  }

  #resolveAbilitySystemSourceId(entityId: string): string {
    const match = /^ability-entity:(\d+)$/.exec(entityId);
    if (match === null) return entityId;
    const source = this.#findAbilitySystemSource(entityId);
    if (source.kind === 'operator') return source.operatorId;
    if (source.kind === 'enemy') return 'enemy';
    if (source.kind === 'abilityEntity') {
      return this.#resolveAbilitySystemSourceId(logicalAbilityEntityRuntimeId(source.instanceId));
    }
    throw new Error('spatial points cannot be AbilitySystem sources');
  }

  /** ExcludeTarget 只归一化比较身份，不改写保留下来的部位句柄。 */
  #resolveExclusionTarget(target: RuntimeTargetRef): RuntimeTargetRef {
    if (target.kind !== 'abilityEntity') return target;
    const entity = this.abilityEntities.snapshot(target);
    const owner = this.#operators.get(entity.ownerId);
    const soul =
      owner === undefined
        ? undefined
        : this.#resolveOperatorAbilityEntityDefinition(owner, entity.abilityEntityId)?.soul;
    return soul?.canBeDirectlyBuffed === false && !soul.asIndividualInExcludeTargetProcessor
      ? this.abilityEntities.mainBody(target)
      : target;
  }

  #resolveOperatorAbilityEntityDefinition(
    operator: CombatOperatorProgram,
    abilityEntityId: string,
    preferredProgram?: CombatOperationProgram,
  ): ResolvedAbilityEntityDefinition | undefined {
    const preferred = preferredProgram?.abilityEntityDefinitions?.[abilityEntityId];
    if (preferred !== undefined) return preferred;
    const direct = operator.abilityEntityDefinitions?.[abilityEntityId];
    if (direct !== undefined) return direct;
    const fixedPrograms = new Set([
      ...operator.skills,
      ...(operator.definitionSkillPrograms ?? []),
    ]);
    const candidatePrograms = new Set([
      ...fixedPrograms,
      ...(operator.skillCasts ?? []).map(binding => binding.program),
    ]);
    const candidates = [...candidatePrograms].flatMap(program => {
      const definition = program.abilityEntityDefinitions?.[abilityEntityId];
      return definition === undefined ? [] : [{ program, definition }];
    });
    if (candidates.length === 0) return undefined;
    if (candidates.every(candidate => candidate.definition === candidates[0]!.definition)) {
      return candidates[0]!.definition;
    }
    const skillIds = new Set(candidates.map(candidate => candidate.program.skillId));
    if (skillIds.size !== 1) return undefined;
    const fixedCandidates = candidates.filter(candidate => fixedPrograms.has(candidate.program));
    return fixedCandidates.length === 1 ? fixedCandidates[0]!.definition : undefined;
  }

  /** 查询句柄有效性与存活标记，不以血量或投射物飞行阶段代替。 */
  #queryEntityLifeState(target: RuntimeTargetRef): 'alive' | 'dead' | 'unknown' | undefined {
    if (target.kind === 'spatialPoint') return undefined;
    if (target.kind === 'abilityEntity') {
      const alive = this.abilityEntities.isAlive(target);
      if (alive !== undefined) return alive ? 'alive' : 'dead';
      // 飞行结束不等于原生实体死亡，未闭合死亡接口前不替换为 phase 判断。
      return this.projectileLifetimes.findSource(target.instanceId) === undefined
        ? undefined
        : 'unknown';
    }
    if (target.kind === 'operator' && !this.#operators.has(target.operatorId)) return undefined;
    return this.abilityEntities.isMarkedDead(target) ? 'dead' : 'alive';
  }

  #queryAllyHitBox(
    owner: RuntimeTargetRef,
    query: Extract<ActionTargetQuery, { kind: 'allyHitBox' }>,
  ): readonly RuntimeTargetRef[] {
    const factionOf = (target: RuntimeTargetRef): CombatFaction | undefined =>
      target.kind === 'enemy'
        ? 'bad'
        : target.kind === 'operator'
          ? 'good'
          : this.abilityEntities.faction(target);
    const faction = factionOf(owner);
    if (faction === undefined) throw new Error('hit-box owner has no declared faction');
    const candidates: RuntimeTargetRef[] = [
      { kind: 'enemy' },
      ...this.#operatorOrder.map(operatorId => ({ kind: 'operator' as const, operatorId })),
      ...Array.from(this.abilityEntities.runtimeState.instances.keys(), instanceId => ({
        kind: 'abilityEntity' as const,
        instanceId,
      })),
    ];
    const matches = candidates.filter(target => {
      const targetFaction = factionOf(target);
      if (targetFaction === undefined) throw new Error('hit-box candidate has no declared faction');
      if (targetFaction !== faction) return false;
      if (query.checkAlive && this.#queryEntityLifeState(target) !== 'alive') return false;
      if (query.containsUnmarkable) return true;
      const rules = this.#options.skillAvailabilityTags;
      if (!rules) throw new Error('hit-box selection requires predefined gameplay tags');
      const tags = this.#resolveBuffTargetById(runtimeTargetEntityId(target)!);
      return ['IsUnMarkable', 'IsUnMarkableAlly'].every(name => {
        const rule = rules.getQuery(name);
        return !tags.matchesEntityTags(rule.tags, rule.queryType);
      });
    });
    // 原生后处理原位替换，保留两个部位映射为同一主体后的重复项。
    return query.replacePartsWithMainBodies
      ? matches.map(target => this.abilityEntities.mainBody(target))
      : matches;
  }

  #resolveAbilityEntityObjectType(instanceId: number): CombatObjectType {
    // 共享实例编号不改变对象自身的语义类型。
    if (this.projectileLifetimes.findSource(instanceId) !== undefined) return 'projectile';
    this.abilityEntities.snapshot({ kind: 'abilityEntity', instanceId });
    return 'abilityEntity';
  }

  #findAbilitySystemSource(ownerId: string): RuntimeTargetRef {
    const match = /^ability-entity:(\d+)$/.exec(ownerId);
    if (match === null)
      return ownerId === 'enemy' ? { kind: 'enemy' } : { kind: 'operator', operatorId: ownerId };
    const source =
      this.projectileLifetimes.findSource(Number(match[1])) ??
      this.abilityEntities.snapshot({
        kind: 'abilityEntity',
        instanceId: Number(match[1]),
      }).source;
    if (source.kind === 'spatialPoint')
      throw new Error('spatial points cannot be AbilitySystem sources');
    return source;
  }

  /** 普通实体与能力实体共用 Buff 生命周期接线，发布与兼容订阅只能维护一份。 */
  #recordBuffConsumption(
    eventName: 'BuffConsumed' | 'BuffAbsorbed',
    event: BuffConsumedEvent,
  ): void {
    this.receipt.record({
      frame: this.clock.frame,
      time: this.clock.time,
      event: eventName,
      sourceId: event.sourceOperatorId,
      targetId: event.targetId,
      data: {
        buffId: event.buffId,
        instanceId: event.buff.instanceId,
        layers: event.layers,
        ...(event.skillCastInfo?.originCastId === undefined
          ? {}
          : { castId: event.skillCastInfo.originCastId }),
      },
    });
  }

  #configureBuffLifecycle(
    target: BuffOperationTarget,
    options: CombatRuntimeAssemblyOptions,
  ): void {
    target.configureSourceEntityBlackboard?.(sourceId => {
      if (sourceId === 'enemy') {
        const state = this.#enemyBuffRuntime.runtimeState?.entityBlackboard;
        return state === undefined ? undefined : ActionBlackboard.bindRuntimeState(state);
      }
      const source = runtimeTargetFromEntityId(sourceId);
      if (source.kind !== 'abilityEntity') return this.#entityBlackboards.get(sourceId);
      if (this.abilityEntities.isActive(source))
        return this.abilityEntities.entityBlackboard(source);
      const projectile = this.projectileLifetimes.runtimeState.instances.get(source.instanceId);
      return projectile === undefined
        ? undefined
        : ActionBlackboard.bindRuntimeState(projectile.entityBlackboard);
    });
    if (target.ownerId.startsWith('ability-entity:')) {
      target.configureBuffApplicationRecipient?.(applyTags => {
        const entity = this.#resolveRuntimeTarget(target.ownerId);
        if (entity.kind !== 'abilityEntity') return;
        const soul = this.abilityEntities.runtimeState.instances.get(entity.instanceId)?.soul;
        if (soul === undefined) return;
        // 1.6.3 CanAddToSoul 的 HasAny 查询；与 canBeDirectlyBuffed 的法术附着转发不同。
        if (
          target.matchesTags?.(
            applyTags,
            ['Skill/Character/chr_0036_jsspsi/soul/SoulBuff'],
            'hasAny',
          )
        )
          return;
        return this.#resolveBuffTargetById(runtimeTargetEntityId(soul.mainBody)!);
      });
    }
    target.configureLifecycleOperations?.(source =>
      this.#createBuffLifecycleOperationChain(source, options),
    );
    const tags = options.skillAvailabilityTags;
    if (tags !== undefined) {
      target.configureEntityTagAdded?.(tag => {
        // 恢复时先绑定 Buff，再绑定技能系统；执行时取当前宿主。
        const ability = this.#abilitySystems.get(target.ownerId);
        if (ability === undefined) return;
        const immobilized =
          target.matchesTags?.([tag], [tags.getTag('Immobilized')], 'hasAny') === true;
        if (immobilized) ability.applyControlTagChange(true, true);
        const silence = tags.getQuery('InSilence');
        if (target.matchesTags?.([tag], silence.tags, silence.queryType))
          ability.applyControlTagChange(true, false);
        const disarmed = tags.getQuery('InDisarmed');
        if (target.matchesEntityTags?.(disarmed.tags, disarmed.queryType))
          ability.applyControlTagChange(false, true);
      });
    }
    target.configureBuffConsumedObserver?.(event => {
      this.#recordBuffConsumption('BuffConsumed', event);
      options.emitBuffLifecycleAbilityEvent?.('buffConsumed', {
        ...event,
        sourceId: event.sourceOperatorId,
      });
    });
    target.configureBuffAbsorbedObserver?.(event => {
      this.#recordBuffConsumption('BuffAbsorbed', event);
      options.emitBuffLifecycleAbilityEvent?.('buffAbsorbed', {
        ...event,
        sourceId: event.sourceOperatorId,
      });
    });
  }

  #projectileBuffLifecycle(): ProjectileBuffLifecycle {
    return {
      tick: instanceId => {
        const buffs = this.#abilityEntityBuffs.get(instanceId);
        if (buffs === undefined) return;
        buffs.advanceWithDeltas(
          this.timeDilation?.getAbilityTickDeltas(
            logicalAbilityEntityRuntimeId(instanceId),
            COMBAT_FRAME_INTERVAL,
          ) ?? uniformAbilityTickDeltas(COMBAT_FRAME_INTERVAL),
        );
      },
      recycleFinished: instanceId => {
        this.#abilityEntityBuffs.get(instanceId)?.recycleFinishedBuffs?.();
      },
      recycled: instanceId => {
        this.#options.clearPendingAbilityEvents?.(logicalAbilityEntityRuntimeId(instanceId));
        if (!this.projectileLifetimes.runtimeState.instances.has(instanceId))
          this.#abilityEntityBuffs.delete(instanceId);
      },
    };
  }

  #resolveAbilityEntityBuffTarget(
    target: RuntimeTargetRef,
    options: CombatRuntimeAssemblyOptions,
  ): AbilityEntityBuffRuntime {
    const projectile =
      target.kind === 'abilityEntity'
        ? this.projectileLifetimes.runtimeState.instances.get(target.instanceId)
        : undefined;
    if (
      target.kind !== 'abilityEntity' ||
      (!this.abilityEntities.isActive(target) && projectile === undefined)
    ) {
      throw new Error('current Buff target is not an active AbilityEntity');
    }
    let runtime = this.#abilityEntityBuffs.get(target.instanceId);
    if (runtime !== undefined) return runtime;
    const create = options.createAbilityEntityBuffRuntime;
    if (create === undefined) {
      throw new Error('AbilityEntity Buff runtime is not configured');
    }
    runtime = create(
      logicalAbilityEntityRuntimeId(target.instanceId),
      projectile
        ? ActionBlackboard.bindRuntimeState(projectile.entityBlackboard)
        : this.abilityEntities.entityBlackboard(target),
      target,
      projectile ? [] : this.abilityEntities.snapshot(target).bornTags,
    );
    if (runtime.ownerId !== logicalAbilityEntityRuntimeId(target.instanceId)) {
      throw new Error(
        `AbilityEntity Buff owner '${runtime.ownerId}' does not match instance '${target.instanceId}'`,
      );
    }
    this.#configureBuffLifecycle(runtime, options);
    this.#abilityEntityBuffs.set(target.instanceId, runtime);
    if (projectile) projectile.buffs = runtime.runtimeState ?? null;
    else {
      const entityState = this.abilityEntities.runtimeState.instances.get(target.instanceId)!;
      entityState.buffContainerCreated = true;
      entityState.buffs = runtime.runtimeState ?? null;
    }
    return runtime;
  }

  #resolveCurrentSkillOwnerId(
    operatorId: string,
    target: 'caster' | 'buffOwner' | 'controlledOperator',
    context?: CombatOperationContext,
  ): string | undefined {
    if (target === 'caster') return operatorId;
    if (target === 'buffOwner') return context?.buffOwnerId;
    const isControlled = this.#options.isOperatorControlled;
    if (isControlled === undefined)
      throw new Error('current skill query requires operator control');
    return this.#operatorOrder.find(id => isControlled(id, this.clock.frame));
  }

  #resolveNormalSkillSubType(
    operatorId: string,
    target: 'caster' | 'buffOwner' | 'controlledOperator' | 'event',
    context?: CombatOperationContext,
  ) {
    if (target === 'event') {
      const event = context?.event === undefined ? undefined : skillAbilityEvent(context.event);
      if (event === undefined) throw new Error('skill subtype query requires a skill event');
      return this.#requireAbilitySystem(event.payload.sourceId).normalSkillSubTypeForSkill(
        event.payload.skillId,
      );
    }
    const ownerId = this.#resolveCurrentSkillOwnerId(operatorId, target, context);
    if (ownerId === undefined) throw new Error('skill subtype query requires a skill owner');
    const ability = this.#requireAbilitySystem(ownerId);
    const skillId = ability.currentSkillId;
    if (skillId === null) throw new Error('skill subtype query requires a current skill');
    return ability.normalSkillSubTypeForSkill(skillId);
  }

  #requirePartyBuffTargets(excludedOperatorId?: string): readonly BuffOperationTarget[] {
    // 当前不结算队员死亡，已装配干员即存活队伍；逆序保持原生 CharacterTeamFinder 的遍历顺序。
    return [...this.#operatorOrder]
      .reverse()
      .filter(operatorId => operatorId !== excludedOperatorId)
      .map(operatorId => {
        const target = this.#operatorBuffs.get(operatorId);
        if (target === undefined) {
          throw new Error(`combat operator '${operatorId}' has no Buff operation target`);
        }
        return target;
      });
  }

  #resolveBuffApplicationTargets(
    target: Parameters<NonNullable<BuffOperationDependencies['resolveApplicationTargets']>>[0],
    casterId: string,
    isOperatorControlled: CombatRuntimeAssemblyOptions['isOperatorControlled'],
    resolveOperatorVitals: CombatRuntimeAssemblyOptions['resolveOperatorVitals'],
  ): readonly BuffOperationTarget[] {
    if (target === 'currentTarget' || target === 'actionInputTarget') {
      throw new Error(`${target} must be resolved from the active operation context`);
    }
    if (
      target === 'eventTarget' ||
      target === 'eventSource' ||
      target === 'buffOwner' ||
      target === 'buffSource'
    ) {
      throw new Error(`${target} must be resolved from the active operation context`);
    }
    if (target === 'party' || target === 'partyExceptCaster') {
      return this.#requirePartyBuffTargets(target === 'partyExceptCaster' ? casterId : undefined);
    }
    if (target === 'partyExceptCasterAndSameCharacterType') {
      const casterType = this.#operators.get(casterId)?.element;
      if (casterType === undefined) {
        throw new Error(`combat operator '${casterId}' has no character type identity`);
      }
      const targets = [...this.#operatorOrder]
        .reverse()
        .filter(
          operatorId =>
            operatorId !== casterId && this.#operators.get(operatorId)?.element !== casterType,
        );
      return targets.map(operatorId => {
        const resolved = this.#operatorBuffs.get(operatorId);
        if (resolved === undefined) {
          throw new Error(`combat operator '${operatorId}' has no Buff operation target`);
        }
        return resolved;
      });
    }
    if (
      target !== 'controlledOperator' &&
      target !== 'casterAndControlledOperator' &&
      target !== 'casterAndLowestHealthRatioOperatorExceptCaster'
    ) {
      return [this.#resolveBuffTarget(target, casterId)];
    }
    let selectedId: string;
    if (target === 'controlledOperator' || target === 'casterAndControlledOperator') {
      if (isOperatorControlled === undefined) {
        throw new Error(`Buff target '${target}' requires the scenario control timeline`);
      }
      const controlled = this.#operatorOrder.filter(operatorId =>
        isOperatorControlled(operatorId, this.clock.frame),
      );
      if (controlled.length !== 1) {
        throw new Error(`Buff target '${target}' requires exactly one controlled operator`);
      }
      selectedId = controlled[0]!;
    } else {
      const candidates = [...this.#operatorOrder].reverse().filter(id => id !== casterId);
      // Native MergeTargetAction merges the selected teammate group with Owner.
      // An empty teammate group still leaves the caster; there is no health read.
      if (candidates.length === 0) {
        return [this.#resolveBuffTarget('caster', casterId)];
      }
      if (resolveOperatorVitals === undefined) {
        throw new Error(`Buff target '${target}' requires operator health ledgers`);
      }
      selectedId = candidates[0]!;
      for (const candidateId of candidates.slice(1)) {
        const candidate = resolveOperatorVitals(candidateId);
        const selected = resolveOperatorVitals(selectedId);
        if (candidate.health / candidate.maxHealth < selected.health / selected.maxHealth) {
          selectedId = candidateId;
        }
      }
    }
    const selectedIds =
      target === 'controlledOperator' ? [selectedId] : [...new Set([casterId, selectedId])];
    return selectedIds.map(operatorId => {
      const runtime = this.#operatorBuffs.get(operatorId);
      if (runtime === undefined) {
        throw new Error(`combat operator '${operatorId}' has no Buff operation target`);
      }
      return runtime;
    });
  }
}
import type { ActionTargetQuery } from '../../../../packages/game-data-contract/src/conditions';
import type { CombatFaction } from '../../../../packages/game-data-contract/src/primitives';
