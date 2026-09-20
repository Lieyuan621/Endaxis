/** 跨状态层共享的数据节点、稳定身份和修正项；不引用执行实现或上层状态。 */
import { type SkillType, type OperatorAttribute } from '../../game-data/operatorDefinition';
import { type ActionBlackboardValue } from '../../../../packages/game-data-contract/src/primitives';
import { type RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import {
  type AttributeModifierSlot,
  type AttributeModifierTiming,
  type AttributeModifierValues,
  type DamageScaleSide,
  type DamageScaleZone,
  type DamageModifierDefinition,
  type HealModifierDefinition,
  type PoiseModifierDefinition,
} from '../../../../packages/game-data-contract/src/modifiers';
import { type AbilityEvent } from '../../../../packages/game-data-contract/src/abilityEvents';

/** 一项配装贡献的原始定义位置。 */
export type EquipmentContributionSource =
  | { readonly kind: 'weaponTrait'; readonly slug: string; readonly traitKey: string }
  | { readonly kind: 'gearTrait'; readonly slug: string; readonly traitKey: string }
  | { readonly kind: 'gearSet'; readonly slug: string };

/** 面板数值贡献的来源，供伤害快照追溯。 */
export type OperatorPanelContributionSource =
  | { readonly kind: 'operatorBase'; readonly operatorSlug: string }
  | { readonly kind: 'trust'; readonly operatorSlug: string; readonly node: number }
  | {
      readonly kind: 'operatorUpgrade';
      readonly source: 'talent' | 'potential';
      readonly index: number;
    }
  | { readonly kind: 'weaponBase'; readonly weaponSlug: string }
  | { readonly kind: 'gearBase'; readonly gearSlug: string }
  | { readonly kind: 'equipment'; readonly contribution: EquipmentContributionSource };

/** 战斗中的稳定对象身份；回执和切面使用同一份数据类型。 */
export type CombatObjectRef =
  | RuntimeTargetRef
  | ({ readonly kind: 'buff' } & BuffReference)
  | { readonly kind: 'globalBuff'; readonly instanceId: number }
  | { readonly kind: 'action'; readonly ownerId: string; readonly actionId: string }
  | { readonly kind: 'receipt'; readonly sequence: number }
  | { readonly kind: 'modifier'; readonly sequence: number; readonly index: number };

export type DamageModifierResult =
  | { readonly kind: 'damageScale'; readonly zone: DamageScaleZone; readonly addition: number }
  | { readonly kind: 'multiplyValue'; readonly multiplier: number }
  | {
      readonly kind: 'attribute';
      readonly attribute: string;
      readonly zone?: DamageScaleZone;
      readonly slot: AttributeModifierSlot;
      readonly value: number;
    };

/** 已实际应用的伤害修正快照。 */
export type AppliedDamageModifier = {
  readonly panelSource?: OperatorPanelContributionSource;
  readonly buff?: BuffReference;
  readonly buffId?: string;
  readonly sourceId: string;
  readonly sourceActionId?: string;
  readonly side: DamageScaleSide;
} & DamageModifierResult;

/** 与一次攻击读数同时取得的公式输入；攻击快照必须一起保存，不能事后读取当前属性。 */
export interface AttackReceiptSnapshot {
  readonly panelAttack: number;
  readonly operatorBaseAttack: number;
  readonly weaponBaseAttack: number;
  readonly attackPercent: number;
  readonly flatAttack: number;
  readonly mainAttribute: OperatorAttribute;
  readonly secondaryAttribute: OperatorAttribute;
  readonly attributes: Readonly<Record<OperatorAttribute, number>>;
  readonly coefficients: Readonly<Record<OperatorAttribute, number>>;
  readonly runtimeBase?: {
    readonly raw: number;
    readonly armed: number;
    readonly value: number;
    readonly minimum?: number;
    readonly maximum?: number;
    readonly modifiers: AttributeModifierValues;
  };
}

export interface SkillCastEventData extends AbilityOriginPayload {
  /** 玩家技能库分类；实体内部技能没有此分类。 */
  readonly skillType?: SkillType;
  readonly skillId: string;
  readonly skillCastId: number;
}

/** 黑板数据节点。entity 指向同一实体共享的黑板节点。 */
export interface ActionBlackboardState {
  readonly values: Map<string, ActionBlackboardValue>;
  readonly entity?: ActionBlackboardState;
}

export function createActionBlackboardState(
  values?: Readonly<Record<string, ActionBlackboardValue>>,
  entity?: ActionBlackboardState,
): ActionBlackboardState {
  return { values: new Map(Object.entries(values ?? {})), entity };
}

/** 全局 Buff 单个实例的来源、寿命和子实例关系。 */
export interface GlobalBuffInstanceState {
  readonly id: string;
  readonly instanceId: number;
  readonly definitionProgramId: number | null;
  readonly sourceId: string;
  readonly sourceActionOwnerId: string | undefined;
  readonly sourceActionId: string | undefined;
  readonly blackboard: ActionBlackboardState;
  readonly children: BuffReference[];
  readonly sharedSpGainModifiers: readonly SharedSpGainModifier[];
  readonly sharedSpRecoveryModifiers: readonly SharedSpRecoveryModifier[];
  remainingDuration: number | null;
  finished: boolean;
}

/** 单场战斗中定位一个 Buff 实例；各目标容器独立分配编号，因此必须同时保留所属目标。 */
export interface BuffReference {
  readonly ownerId: string;
  readonly instanceId: number;
}

export interface BuffModifierNumberSource {
  readonly buffId: string;
  readonly blackboard: ActionBlackboardState;
}

export const ATTRIBUTE_MODIFIER_SOURCES = {
  none: 0,
  buff: 1,
  equipment: 2,
  weapon: 4,
  talent: 8,
  cardSkill: 16,
  instant: 32,
  converted: 64,
  potential: 128,
  all: -1,
  nonConverted: -65,
  deck: 158,
} as const;

/** 属性修正的稳定来源身份，用于追踪和移除对应修正。 */
export type AttributeModifierSource =
  (typeof ATTRIBUTE_MODIFIER_SOURCES)[keyof typeof ATTRIBUTE_MODIFIER_SOURCES];

export const COMBAT_ATTRIBUTE_VALUE_STAGES = ['armed', 'final'] as const;

/** 属性聚合中可供原生动作读取的已确认阶段。 */
export type CombatAttributeValueStage = (typeof COMBAT_ATTRIBUTE_VALUE_STAGES)[number];

/** 一组战斗属性的基础值和按槽位计算方式。 */
export interface CombatAttributeDefinition {
  /** 省略表示原生 AttributeMeta 没有配置下限。 */
  readonly minimum?: number;
  /** 省略表示原生 AttributeMeta 没有配置上限。 */
  readonly maximum?: number;
  readonly otherAttributeBaseAddition?: number;
  readonly otherAttributeBaseFinalMultiplier?: number;
  readonly otherAttributeFinalMultiplier?: number;
}

/** 一项属性修正。无类实例、访问器或执行回调，可直接进入战斗状态。 */
export interface CombatAttributeModifier<Key extends string> {
  readonly attribute: Key;
  readonly values: AttributeModifierValues;
  readonly source: AttributeModifierSource;
  readonly timing: AttributeModifierTiming;
}

export interface CombatAttributeState<Key extends string> {
  readonly rawValues: Map<Key, number>;
  readonly definitions: Map<Key, CombatAttributeDefinition>;
  readonly modifiers: CombatAttributeModifier<Key>[];
}

export function createCombatAttributeState<Key extends string>(): CombatAttributeState<Key> {
  return { rawValues: new Map(), definitions: new Map(), modifiers: [] };
}

export interface DamageModifierState {
  readonly ownerId: string;
  readonly definition: DamageModifierDefinition;
  readonly numberSource: BuffModifierNumberSource | undefined;
  readonly sourceSkillCastId: number | null;
  readonly hasConditionProgram: boolean;
}

export interface HealModifier {
  readonly ownerId: string;
  readonly definition: HealModifierDefinition;
  readonly numberSource: BuffModifierNumberSource;
}

/** 由一个已启用 Buff 实例持有的失衡修正器。 */
export interface PoiseModifier {
  readonly ownerId: string;
  readonly definition: PoiseModifierDefinition;
  readonly numberSource: BuffModifierNumberSource;
}

export const SHARED_SP_GAIN_ATTRIBUTES = [
  'gainEfficiency',
  'normalAttackEfficiency',
  'powerAttackEfficiency',
] as const;

/** 原生共享 ATB 获取链中已经确认的三项全局属性。 */
export type SharedSpGainAttribute = (typeof SHARED_SP_GAIN_ATTRIBUTES)[number];

export const SHARED_SP_GAIN_MODIFIER_OPERATIONS = ['addition', 'multiplier'] as const;

/** 单段效率中先汇总 addition，再以 max(0, 1 + sum(multiplier)) 相乘。 */
export type SharedSpGainModifierOperation = (typeof SHARED_SP_GAIN_MODIFIER_OPERATIONS)[number];

/**
 * 一项可由 Buff 生命周期独立注册和注销的共享 SP 效率修正。
 * applyToReturnSpGain 只过滤 gainEfficiency；来源专属效率不受该字段影响。
 */
export interface SharedSpGainModifier {
  readonly attribute: SharedSpGainAttribute;
  readonly operation: SharedSpGainModifierOperation;
  readonly value: number;
  readonly applyToReturnSpGain: boolean;
}

export interface SharedSpGainModifierState {
  readonly modifiers: SharedSpGainModifier[];
}

/** 原生 GlobalAttributeType.AtbRecover 的独立注册项。 */
export interface SharedSpRecoveryModifier {
  readonly operation: SharedSpGainModifierOperation;
  readonly value: number;
}

export interface SharedSpRecoveryModifierState {
  readonly modifiers: SharedSpRecoveryModifier[];
}

export const BUFF_FINISH_REASONS = [
  'lifetime',
  'ignite',
  'early',
  'dispelled',
  'absorbed',
  'other',
] as const;

/** Buff 结束时记录并传给生命周期行为的原因。 */
export type BuffFinishReason = (typeof BUFF_FINISH_REASONS)[number];
/**
 * 描述一次技能释放在战斗运行时中的来源身份。
 * 该值只在单场模拟内流转并由 Buff 等实例复制，不属于项目存档或编辑器对象身份。
 */
export interface CombatSkillCastInfo {
  /** 单场运行时内的非零释放序号；0 保留为“没有来源施法”。 */
  readonly skillCastId: number;
  /** 最初发起本次施法链的技能；当前直接释放时就是正在执行的技能。 */
  readonly originSkillId: string;
  /** 最初发起本次施法链的技能类型，供 Buff 来源条件稳定读取。 */
  readonly originSkillType: import('../../game-data/operatorDefinition').SkillType;
  /** 时间轴上的技能块身份；单元测试或非时间轴技能可以缺失。 */
  readonly originCastId?: string;
  /** 本次施法在当前时刻已经实际扣除且未返还的技力。 */
  readonly nonReturnedSpCost: number;
}

/**
 * Ability 事件订阅的纯数据。每项只记录事件、阶段、优先级和处理程序编号，不保存函数。
 * 同一次分发中的临时遍历数组属于调用栈；帧结束后只需保留这里的订阅关系与编号。
 */
export type AbilityEventPhase = 'callback' | 'action' | 'skill' | 'combo';

export interface AbilityEventSubscription {
  /** 当前状态内唯一的订阅编号，用于精确注销某一次注册。 */
  readonly id: number;
  /** 处理逻辑的引用，由本次执行的宿主解析；不是函数对象。 */
  readonly handlerId: number;
  /** 仅 action 阶段按优先级降序排列，其余阶段保持注册顺序。 */
  readonly priority: number;
}

export interface AbilityEventState<Event extends PropertyKey> {
  nextRegistrationId: number;
  readonly phases: Record<AbilityEventPhase, Map<Event, AbilityEventSubscription[]>>;
}

/**
 * 精确指向一次订阅。事件中心之间的编号可能相同，因此必须同时保留目录引用。
 * 复制整场数据图时，这里的目录与根目录仍指向同一份复制结果，不保存分发器对象。
 */
export interface AbilityEventSubscriptionReference {
  readonly state: AbilityEventState<PropertyKey>;
  readonly event: PropertyKey;
  readonly phase: AbilityEventPhase;
  readonly id: number;
}

export function createAbilityEventState<Event extends PropertyKey>(): AbilityEventState<Event> {
  return {
    nextRegistrationId: 0,
    phases: { callback: new Map(), action: new Map(), skill: new Map(), combo: new Map() },
  };
}

export interface AbilityEntityPair {
  readonly sourceId: string;
  readonly targetId: string;
}

export interface AbilityOriginPayload extends AbilityEntityPair {
  /** undefined 是生产者未提供，null 是明确无来源，均不能回退外层事件。 */
  readonly skillCastInfo?: CombatSkillCastInfo | null;
}

/** 原生响应端口；旧 outputKnockDown 标记不是原生事件，不在此边界内。 */
export type AbilityResponseEventName = Exclude<AbilityEvent, 'outputKnockDown'>;

export interface SkillCastStartPreparation {
  readonly trigger?: RuntimeTargetRef;
  readonly smartTarget?: RuntimeTargetRef;
  readonly assignPairs: Readonly<Record<string, ActionBlackboardValue>> | null;
}

/** 一次人工施放的模拟参数，不属于技能定义。 */
export interface SkillSimulationInputs {
  readonly randomSeed?: number;
  readonly criticalOverrides?: Readonly<Record<string, boolean>>;
}

/** 原生单槽延迟施放目前已进入模拟器的稳定字段。 */
export interface PostSkillCastRequest {
  readonly skillId: string;
  readonly castId?: string;
  /** 提交这次延迟施放的执行宿主；技能开始时用于连接来源回执。 */
  readonly producedBy?: CombatObjectRef;
  readonly skipApplyCost?: boolean;
  readonly inheritedSkillCastInfo?: CombatSkillCastInfo;
  /** 原生 forceInterruptCurSkill 分支：先检查请求技能可启动，失败时不得结束当前技能。 */
  readonly interruptCurrentSkillOnlyWhenTargetCastable?: boolean;
  /** 玩家技能槽输入解析当前替换形态；原生 CastSkill 的显式 Skill ID 必须关闭该解析。 */
  readonly resolveSkillSlot?: boolean;
}

export type LogicalAbilityEntityFinishReason =
  'durationExpired' | 'explicit' | 'ownerFinished' | 'sourceDied' | 'stackingLimit';
