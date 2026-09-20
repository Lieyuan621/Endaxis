/**
 * 战斗中动态创建的实例数据。
 *
 * 这里集中保存 Buff 动作宿主、全局 Buff、能力实体、投射物和 SkillAffix 的身份与寿命。
 * 所有跨实例关系都使用稳定编号、目标引用或共享数据节点；回调和运行对象由恢复阶段重新绑定。
 */
import {
  type GlobalBuffInstanceState,
  type AbilityEventSubscriptionReference,
  type AbilityResponseEventName,
  type ActionBlackboardState,
  type BuffFinishReason,
  type BuffReference,
  type CombatSkillCastInfo,
  type LogicalAbilityEntityFinishReason,
  type SharedSpGainModifier,
  type DamageModifierState,
  type HealModifier,
  type PoiseModifier,
  createActionBlackboardState,
  type SharedSpGainModifierState,
  createCombatAttributeState,
  type CombatAttributeState,
  type CombatAttributeModifier,
} from './foundationState';
import {
  type AbilityEntityTargetRef,
  type LogicalAbilityEntityDefinition,
  type RuntimeTargetRef,
} from '../../game-data/logicalAbilityEntity';
import {
  type ActionSequenceState,
  type ActionScopeState,
  type CombatOperationHostState,
  type TimelineRuntimeState,
} from './actionState';
import { type DamageType } from '../../game-data/operatorDefinition';
import {
  type AbilityEntityChildSkillState,
  type CallbackSkillHostState,
  type DamageCalculationSnapshotState,
  type PassiveAbilityEventState,
  type RuntimeTargetContextState,
} from './abilityState';
import { type TimedMarkerState } from './environmentState';
import { type GameplayTag } from '../../../../packages/game-data-contract/src/gameplayTags';

export type SkillAffixObjectReference =
  | {
      readonly kind: 'entity';
      readonly target: AbilityEntityTargetRef;
      readonly resetRegistrationId: number;
    }
  | {
      readonly kind: 'buff';
      readonly reference: BuffReference;
      readonly recycleRegistrationId: number;
    };

/** SkillAffix 等待技能及衍生对象结束的引用计数数据。 */
export interface SkillAffixState {
  readonly instanceId: number;
  readonly objectReferences: Map<number, SkillAffixObjectReference>;
  readonly eventSubscriptions: Map<AbilityResponseEventName, AbilityEventSubscriptionReference[]>;
  postSkillRequestRegistrationId: number | null;
  nextObjectReferenceId: number;
  readonly skillCastId: number;
  references: number;
  pendingRequest: boolean;
  disposed: boolean;
}

export function createSkillAffixState(instanceId: number, skillCastId: number): SkillAffixState {
  return {
    instanceId,
    objectReferences: new Map(),
    eventSubscriptions: new Map(),
    postSkillRequestRegistrationId: null,
    nextObjectReferenceId: 1,
    skillCastId,
    references: 1,
    pendingRequest: false,
    disposed: false,
  };
}

export interface BuffScheduledActionState {
  passedFrames: number;
  timeline: TimelineRuntimeState | null;
}

export interface BuffEventResponseState {
  readonly sequence: ActionSequenceState;
  readonly subscriptions: AbilityEventSubscriptionReference[];
}

/** 一个 Buff 生命周期的动作进度和共享执行数据。 */
export interface BuffActionHostState {
  readonly operations: CombatOperationHostState;
  readonly affixes: SkillAffixState[];
  nextAffixId: number;
  readonly eventResponses: BuffEventResponseState[];
  readonly scopes: ActionScopeState;
  readonly targets: RuntimeTargetContextState;
  readonly damageSnapshots: DamageCalculationSnapshotState;
  enable: ActionSequenceState | null;
  trigger: ActionSequenceState | null;
  scheduled: BuffScheduledActionState | null;
  skillSlotsReplaced: boolean;
}

export interface GlobalBuffState {
  nextInstanceId: number;
  readonly groups: Map<string, GlobalBuffInstanceState[]>;
}

export function createGlobalBuffState(): GlobalBuffState {
  return { nextInstanceId: 1, groups: new Map() };
}

/** 能力实体的身份、寿命、标记、子技能与黑板数据。 */
export interface LogicalAbilityEntityState {
  /** 创建时实际使用的固定定义槽位；与是否继承伤害施法来源无关。 */
  readonly definitionProgramId?: number;
  buffContainerCreated: boolean;
  buffs: BuffContainerState | null;
  readonly childSkills: AbilityEntityChildSkillState[];
  readonly passiveAbilities: Map<string, PassiveAbilityEventState>;
  readonly childBuffs: BuffReference[];
  readonly resetCallbackIds: number[];
  nextResetCallbackId: number;
  readonly timedMarkers: TimedMarkerState;
  readonly skillCastInfo?: CombatSkillCastInfo | null;
  readonly instanceId: number;
  readonly abilityEntityId: string;
  readonly definition: LogicalAbilityEntityDefinition;
  readonly ownerId: string;
  readonly source: RuntimeTargetRef;
  readonly sourceSkillCastId?: number;
  target?: RuntimeTargetRef;
  readonly dieWhenSourceDies: boolean;
  readonly blackboard: ActionBlackboardState;
  remainingDurationSeconds: number | null;
  elapsedDurationSeconds: number;
  isAlive: boolean;
  pendingRelease: boolean;
  pendingReleaseElapsedSeconds: number;
  pendingReleaseReason?: LogicalAbilityEntityFinishReason;
}

export interface LogicalAbilityEntityDirectoryState {
  readonly instances: Map<number, LogicalAbilityEntityState>;
  readonly deadSources: RuntimeTargetRef[];
}

/** 发射时确定的投射物回调输入，以及命中后创建的技能宿主数据。 */
export interface ProjectileCallbackState {
  programId: number | null;
  readonly definitionOperatorId: string;
  readonly skillId: string;
  readonly blackboard: ActionBlackboardState;
  readonly skillCastInfo: CombatSkillCastInfo | null;
  host: CallbackSkillHostState | null;
}

export interface ProjectileLifetimeState {
  readonly callback: ProjectileCallbackState | null;
  readonly instanceId: number;
  readonly source?: RuntimeTargetRef;
  phase: 'active' | 'finished' | 'marked' | 'reset';
  remainingSeconds: number;
  remainingReachTicks: number | null;
  readonly recycleDelaySeconds: number;
  readonly resetListeners: Map<number, number>;
}

/** 当前全部投射物及本帧已经准入的实例。 */
export interface ProjectileLifecycleState {
  readonly instances: Map<number, ProjectileLifetimeState>;
  admittedAbilities: number[] | null;
  nextResetRegistrationId: number;
}

export function createProjectileLifecycleState(): ProjectileLifecycleState {
  return { instances: new Map(), admittedAbilities: null, nextResetRegistrationId: 0 };
}

/**
 * Buff 周期触发器的全部计时数据。负触发次数沿用原生无限触发表示，不归一化成另一种规则。
 * 本状态只覆盖周期触发；Buff 的属性、叠层、生命周期和子对象仍由各自的完整状态负责。
 */
export interface BuffTriggerState {
  intervalSeconds: number | null;
  remainingSeconds: number;
  remainingCount: number;
}

export function createBuffTriggerState(): BuffTriggerState {
  return { intervalSeconds: null, remainingSeconds: 0, remainingCount: 0 };
}

/** 同一目标内一个叠层组的成员与计数。成员只保存该目标容器内的 Buff 实例编号。 */
export interface BuffStackingState {
  readonly members: number[];
  currentStackCount: number;
  maxStackCount: number;
}

export function createBuffStackingState(): BuffStackingState {
  return { members: [], currentStackCount: 0, maxStackCount: 0 };
}

export interface BuffShieldState {
  readonly maxValue: number;
  readonly maxAbsorbCount: number;
  readonly absorptions: Map<DamageType, readonly [number, number]>;
  remainingValue: number;
  remainingAbsorbCount: number;
  consumed: boolean;
}

export interface BuffLifecycleState {
  affixSkillCastId: number;
  passedTime: number;
  remainingDuration: number | null;
  timedGrowthPeriod: number | null;
  timedGrowthRemaining: number;
  started: boolean;
  enabled: boolean;
  finished: boolean;
  finishing: boolean;
  timePaused: boolean;
  finishable: boolean;
  appliedTags: boolean;
  appliedExtendTags: boolean;
  finishReason: BuffFinishReason | null;
  released: boolean;
  recycled: boolean;
  enhanceCount: number;
}

export function createBuffLifecycleState(): BuffLifecycleState {
  return {
    affixSkillCastId: 0,
    passedTime: 0,
    remainingDuration: null,
    timedGrowthPeriod: null,
    timedGrowthRemaining: 0,
    started: false,
    enabled: false,
    finished: false,
    finishing: false,
    timePaused: false,
    finishable: true,
    appliedTags: false,
    appliedExtendTags: false,
    finishReason: null,
    released: false,
    recycled: false,
    enhanceCount: 1,
  };
}

export interface BuffInstanceIdentity {
  readonly ownerId: string;
  readonly instanceId: number;
  readonly definitionId: string;
  readonly sourceId: string;
}

export interface BuffInstanceState<Key extends string> {
  actionHost: BuffActionHostState | null;
  /** onRecycled 回调的稳定登记顺序；函数由恢复后的宿主按编号重绑。 */
  readonly recycleCallbackIds: number[];
  nextRecycleCallbackId: number;
  sharedSpGainModifiers: readonly SharedSpGainModifier[];
  readonly identity: BuffInstanceIdentity;
  sourceActionId: string;
  definitionOwnerId: string;
  /** null 表示创建时没有显式的来源属性读取目标；否则恢复时必须按实体身份接回读取端口。 */
  sourceAttributeOwnerId: string | null;
  skillCastInfo: CombatSkillCastInfo | null;
  priority: number;
  damageModifiers: readonly DamageModifierState[];
  healModifiers: readonly HealModifier[];
  poiseModifiers: readonly PoiseModifier[];
  readonly shields: BuffShieldState[];
  readonly blackboard: ActionBlackboardState;
  readonly lifecycle: BuffLifecycleState;
  readonly trigger: BuffTriggerState;
  readonly attributes: BuffAttributeState<Key>;
  readonly children: BuffChildrenState;
}

export function createBuffInstanceState<Key extends string>(
  identity: BuffInstanceIdentity,
  blackboard: ActionBlackboardState = createActionBlackboardState(),
): BuffInstanceState<Key> {
  return {
    actionHost: null,
    recycleCallbackIds: [],
    nextRecycleCallbackId: 0,
    sharedSpGainModifiers: [],
    identity,
    sourceActionId: identity.definitionId,
    definitionOwnerId: identity.sourceId,
    sourceAttributeOwnerId: null,
    skillCastInfo: null,
    priority: 0,
    damageModifiers: [],
    healModifiers: [],
    poiseModifiers: [],
    shields: [],
    blackboard,
    lifecycle: createBuffLifecycleState(),
    trigger: createBuffTriggerState(),
    attributes: createBuffAttributeState<Key>(),
    children: createBuffChildrenState(),
  };
}

export interface BuffContainerState<Key extends string = string> {
  readonly sharedSpGainModifiers: SharedSpGainModifierState | null;
  readonly damageModifiers: DamageModifierState[];
  readonly healModifiers: HealModifier[];
  readonly poiseModifiers: PoiseModifier[];
  readonly activeShields: BuffShieldState[];
  readonly sustainedProtections: Map<BuffInstanceState<Key>, readonly [number, number]>;
  readonly attributes: CombatAttributeState<Key>;
  readonly entityBlackboard: ActionBlackboardState;
  /** 已完成创建的实例数据；尚在 Start 中的实例可能还未进入发布列表。 */
  readonly instances: Map<number, BuffInstanceState<Key>>;
  readonly stackingGroups: Map<string, BuffStackingState>;
  /** 发布顺序，区别于分配顺序；Start 中新建的子实例可能先发布。 */
  readonly memberIds: number[];
  nextInstanceId: number;
  releasing: boolean;
  readonly entityTagCounts: Map<GameplayTag, number>;
  readonly addingCooldowns: Map<string, number[]>;
}

export function createBuffContainerState<Key extends string = string>(
  attributes: CombatAttributeState<Key> = createCombatAttributeState<Key>(),
  entityBlackboard: ActionBlackboardState = createActionBlackboardState(),
  sharedSpGainModifiers: SharedSpGainModifierState | null = null,
): BuffContainerState<Key> {
  return {
    sharedSpGainModifiers,
    damageModifiers: [],
    healModifiers: [],
    poiseModifiers: [],
    activeShields: [],
    sustainedProtections: new Map(),
    attributes,
    entityBlackboard,
    instances: new Map(),
    stackingGroups: new Map(),
    memberIds: [],
    nextInstanceId: 1,
    releasing: false,
    entityTagCounts: new Map(),
    addingCooldowns: new Map(),
  };
}

export interface BuffChildrenState {
  readonly members: Map<string, BuffReference>;
}

export function createBuffChildrenState(): BuffChildrenState {
  return { members: new Map() };
}

export interface BuffAttributeState<Key extends string> {
  modifiers: readonly CombatAttributeModifier<Key>[];
}

export function createBuffAttributeState<Key extends string>(): BuffAttributeState<Key> {
  return { modifiers: [] };
}
