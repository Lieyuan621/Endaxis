/**
 * 定义普通 Buff、全局 Buff、护盾以及 Buff 生命周期内可执行的动作和战斗修正。
 *
 * 干员技能和装备按 ID 引用这些蓝图，模拟器据此创建独立实例、处理叠层与持续时间、
 * 注册事件响应和数值修正；界面则读取同一实例的名称、图标、层数和进度显示配置。
 */
import { type ScheduledSequenceDefinition } from './actions.ts';
import type { ActionGraphReference, ActionGraphResourceDefinition } from './actionGraph.ts';
import {
  type ActionBlackboardValue,
  type DamageFeature,
  type DamageTag,
  type DamageType,
  type InflictionElement,
} from './primitives.ts';
import {
  type AttributeModifierSlot,
  type DamageModifierCondition,
  type DamageModifierDefinition,
  type DamageScaleProcessorDefinition,
  type InstantAttributeProcessorDefinition,
  type HealModifierDefinition,
  type PoiseModifierDefinition,
} from './modifiers.ts';
import { type ActionValueOperand } from './conditions.ts';
import { type AbilityEvent, type AbilityEventResponse } from './abilityEvents.ts';

/** 当前公共 Buff 生命周期已经能够注册和归一化的 AbilitySystem 事件。 */
export const BUFF_ABILITY_EVENTS = [
  'enterFight',
  'ownerHpZero',
  'hpChanged',
  'abilityEntitySpawned',
  'abilityEntityFinished',
  'beforeTakeDamage',
  'beforeHitByProjectile',
  'beforeCalculateDamage',
  'beforeDamageAction',
  'beforeOutputDamage',
  'beforeTakePhysicalInfliction',
  'beforeOutputPhysicalInfliction',
  'afterOutputPhysicalInfliction',
  'beforeOutputKnockDown',
  'afterOutputKnockDown',
  'beforeOutputInfliction',
  'beforeOutputSpellBurst',
  'beforeTakeSpellInfliction',
  'ownerSwitchToCenter',
  'ownerSwitchToGuard',
  'beforeTakeInfliction',
  'afterTakeInfliction',
  'takeDamage',
  'takeCriticalDamage',
  'outputDamage',
  'outputCriticalDamage',
  'outputKnockDown',
  'outputHeal',
  'receiveHeal',
  'afterAddedShield',
  'poiseZero',
  'beforeCastSkill',
  'afterSkillApplyCost',
  'skillEnd',
  'beforeOutputBuff',
  'beforeAddedBuff',
  'outputBuff',
  'addedBuff',
  'finishedBuff',
  'buffEndsEarly',
  'afterOutputWeaknessTriggered',
  'customAbilityEvent',
  'afterKillEntity',
  'buffConsumed',
  'skillSpGained',
] as const satisfies readonly AbilityEvent[];

/** Buff 实例可以监听的一种能力事件。 */
export type BuffAbilityEvent = (typeof BUFF_ABILITY_EVENTS)[number];

/**
 * `applyBuff` 步骤内联的 Buff 显示配置。
 * Buff ID、施加次数、目标和本次传入的黑板值由施加动作提供。
 */
export type SkillBuffPresentation = CombatBuffPresentation;

/**
 * Buff 实例生命周期边界上的有序步骤。
 * 每个 Buff 实例独占步骤执行状态和动作黑板；同一时点仍严格按步骤数组顺序执行。
 */
export interface SkillBuffLifecycleSequences {
  /** Buff 第一次启用时执行一次，早于修正注册。 */
  start?: ActionGraphReference;
  /** Buff 每次由停用转为启用后执行，晚于修正注册。 */
  enable?: ActionGraphReference;
  /** Buff 暂停生效、准备注销修正前执行。 */
  disable?: ActionGraphReference;
  /** 同组 Buff 即将增加强化层数前执行。 */
  beforeEnhance?: ActionGraphReference;
  /** Buff 启用期间按触发间隔到点时执行。 */
  trigger?: ActionGraphReference;
  /** Buff 叠层数发生变化时执行。 */
  enhanceChanged?: ActionGraphReference;
  /** 一次叠层流程完成后执行。 */
  afterEnhance?: ActionGraphReference;
  /** Buff 正式结束前执行，结束步骤仍能读取当前实例状态。 */
  finish?: ActionGraphReference;
}

/** Buff 启用期间注册在其所有者 AbilitySystem 上的一条同步事件响应。 */
export type SkillBuffAbilityEventResponse = AbilityEventResponse<BuffAbilityEvent>;

/** Buff 实例对原生 IgniteAction 类型的同步响应。 */
export interface SkillBuffIgniteEventResponse {
  /** 可以触发这项响应的点燃类型。 */
  igniteType: string;
  /** 响应执行后是否立即结束当前 Buff。 */
  finishAfterIgnited: boolean;
  /** 点燃时执行的动作序列。 */
  sequence: ActionGraphReference;
}

/** 原生 ChangeSkillAction 随 DuringBuffEnable 动作结束而撤销的技能槽替换。 */
export interface SkillBuffSlotReplacement {
  /** 要修改的技能组。 */
  readonly skillGroupKey: string;
  /** Buff 启用期间换入的技能。 */
  readonly targetSkillKey: string;
  /** Buff 停用或结束时恢复的技能。 */
  readonly revertedSkillKey: string;
  /** 已保留证据位；运行时尚未接入 true 的双向冷却进度复制。 */
  readonly inheritOriginSkillCooldownProgress: boolean;
}

/** 可以直接写在干员或装备数据中的 Buff 蓝图。 */
type SkillBuffProperties = Omit<BuffDefinitionProperties, 'damageModifiers'> & {
  /** 有动作入口的 Buff 保存自己的图；纯数值 Buff 可以省略。 */
  readonly actionGraph?: ActionGraphResourceDefinition;
  /** Buff 启用期间参与伤害计算的条件和数值处理器。 */
  readonly damageModifiers?: readonly SkillBuffDefinitionDamageModifier[];
  /** 可在施加时从该 Buff 已合并的实例黑板解析。 */
  maxStackCount?: BuffMaxStackCount;
  /** Buff 启用期间按实例局部时钟执行的相对帧时间线。 */
  scheduledSequences?: readonly ScheduledSequenceDefinition[];
  /** Buff 生命周期各阶段执行的动作序列。 */
  lifecycleSequences?: SkillBuffLifecycleSequences;
  /** 每个 Buff 实例独立注册、停用或结束时注销的 Ability 事件响应。 */
  abilityEventResponses?: readonly SkillBuffAbilityEventResponse[];
  /** 每个实例独立持有的点燃响应；处理后是否结束由来源数据显式决定。 */
  igniteEventResponses?: readonly SkillBuffIgniteEventResponse[];
  /** 每次启用时换入、停用或结束时还原；生命周期归当前 Buff 实例所有。 */
  skillSlotReplacements?: readonly SkillBuffSlotReplacement[];
  /** 不参与战斗计算的显示信息。 */
  presentation?: SkillBuffPresentation;
};

/** Buff 定义目录；技能步骤只引用稳定 ID，并在施加时提供实例黑板覆盖值。 */
export type StaticBuffDefinition = Omit<
  SkillBuffProperties,
  | 'actionGraph'
  | 'scheduledSequences'
  | 'lifecycleSequences'
  | 'abilityEventResponses'
  | 'igniteEventResponses'
  | 'damageModifiers'
> & {
  readonly actionGraph?: never;
  readonly scheduledSequences?: never;
  readonly lifecycleSequences?: never;
  readonly abilityEventResponses?: never;
  readonly igniteEventResponses?: never;
  readonly damageModifiers?: readonly (Omit<
    SkillBuffDefinitionDamageModifier,
    'conditionProgram'
  > & { readonly conditionProgram?: never })[];
};

/** 有动作入口就必须带图；纯数值 Buff 不创建空图。 */
export type SkillBuffDefinition =
  | (SkillBuffProperties & { readonly actionGraph: ActionGraphResourceDefinition })
  | StaticBuffDefinition;

export type OperatorBuffDefinitions = Readonly<Record<string, SkillBuffDefinition>>;

/**
 * 一项 GlobalBuff 在固定队伍中的子 Buff 投影。赋值从已经完成创建参数覆盖的
 * GlobalBuff 实例黑板读取，不能直接回读创建动作的黑板。
 */
export interface SkillGlobalBuffChildDefinition {
  /** 投影到队员身上的普通 Buff ID。 */
  readonly buffId: string;
  /** 从全局 Buff 黑板计算并传给子 Buff 的黑板值。 */
  readonly blackboardAssignments: Readonly<Record<string, ActionValueOperand>>;
}

/**
 * 战斗级 GlobalBuff 蓝图。它拥有独立实例、寿命和叠加组；子 Buff 只是该实例
 * 投影到每名队员身上的端口，不能把父层拍平成普通 Buff 叠层。
 */
export interface SkillGlobalBuffDefinition {
  /** 全局 Buff 是保留所有实例，还是按最大层数保留实例。 */
  readonly stackingType: 'unlimited' | 'stack';
  /** `stack` 模式允许同时存在的最大实例数。 */
  readonly maxStackCount?: number;
  /** 全局 Buff 的持续时间。 */
  readonly durationSeconds?: BuffDuration;
  /** 原生父 GlobalBuff 的时长同时作为子 Buff 图标时长；不改变子 Buff 的战斗寿命归属。 */
  readonly applyIconDurationToBuffs?: boolean;
  /** 创建实例时使用的初始黑板值。 */
  readonly blackboard: Readonly<Record<string, ActionBlackboardValue>>;
  /** 父 GlobalBuff 启用期间注册到整场战斗共享 SP 系统的原生全局修正。 */
  readonly sharedSpModifiers?: readonly {
    /** 要修改的共享技力属性。 */
    readonly attribute:
      'spRecovery' | 'gainEfficiency' | 'normalAttackEfficiency' | 'powerAttackEfficiency';
    /** 对该属性执行加算或乘算。 */
    readonly operation: 'addition' | 'multiplier';
    /** 写入属性的数值。 */
    readonly value: ActionValueOperand;
    /** 是否也修改返还技力的获取量。 */
    readonly applyToReturnSpGain: boolean;
  }[];
  /** 此全局 Buff 会投影到队员身上的普通 Buff。 */
  readonly children: readonly SkillGlobalBuffChildDefinition[];
}

/** 同一叠加组再次收到 Buff 时可以采用的全部处理方式。 */
export const BUFF_STACKING_TYPES = [
  /** 每次施加都创建并启用一个独立实例，不限制同时存在的数量。 */
  'unlimited',
  /** 保留所有实例，但同组仅启用优先级最高的一个；最高项结束后自动启用下一项。 */
  'highPriority',
  /** 每次施加创建一个独立层；达到最大层数后先结束组内最低优先项。 */
  'stack',
  /** 复用现有实例并增加强化层数，上限由 maxStackCount 决定，不改变剩余时长。 */
  'enhance',
  /** 复用现有实例，不加层；仅在新时长更长时更新剩余时长。 */
  'refresh',
  /** 复用现有实例，不加层；把新时长累加到当前剩余时长。 */
  'extend',
  /** 复用现有实例，不加层、不改时长；合并输入黑板并重算属性修正。 */
  'modify',
  /** 同组已有实例时拒绝本次施加，已有实例保持不变。 */
  'unique',
  /** 复用现有实例并增加强化层数，同时仅在新时长更长时更新剩余时长。 */
  'enhanceAndRefresh',
  /** 复用现有实例，不加层；用新时长直接替换当前剩余时长。 */
  'overwriteDuration',
  /** 复用现有实例并增加强化层数，同时用新时长直接替换当前剩余时长。 */
  'enhanceAndOverwriteDuration',
  /** 保留所有实例，并按优先级只启用 maxStackCount 个；超出的实例停用但不结束。 */
  'highPriorityWithMaxStack',
  /** 复用单个强化实例；配置时长作为自动加层周期，直至 maxStackCount。 */
  'timedGrowingEnhance',
] as const;

/** 同身份 Buff 再次添加时采用的原生叠加策略。 */
export type BuffStackingType = (typeof BUFF_STACKING_TYPES)[number];

/** 固定秒数或由实例黑板提供的 Buff 持续时间。 */
export type BuffDuration =
  | number
  | {
      /** 读取持续秒数的 Buff 黑板键。 */
      readonly blackboardKey: string;
    };

/** 固定值或由实例黑板提供的 Buff 可触发次数。 */
export type BuffTriggerCount =
  | number
  | {
      /** 读取触发次数的 Buff 黑板键。 */
      readonly blackboardKey: string;
    };

/** 固定最大层数，或从首次施加实例的黑板读取的动态最大层数。 */
export type BuffMaxStackCount =
  | number
  | {
      /** 读取最大层数的 Buff 黑板键。 */
      readonly blackboardKey: string;
    };

/** 固定优先级，或从实例黑板读取并按原生配置选择取反的动态优先级。 */
export type BuffPriority =
  | number
  | {
      /** 读取优先级的 Buff 黑板键。 */
      readonly blackboardKey: string;
      /** 是否对读到的数值取负。 */
      readonly negate?: boolean;
    };

/** 多个护盾可吸收同一次伤害时的消耗优先级。 */
export type BuffShieldPriority = 'normal' | 'prioritizeConsume';

/** 护盾针对一种伤害类型的吸收比例和护盾消耗倍率。 */
export interface BuffShieldDamageAbsorptionDefinition {
  /** 适用的伤害类型。 */
  readonly damageType: DamageType;
  /** 本次伤害由护盾吸收的比例。 */
  readonly ratio: BuffDuration;
  /** 吸收伤害时消耗护盾值的倍率。 */
  readonly scale: BuffDuration;
}

/** 从 Buff 持有者或来源的一项属性计算初始护盾值。 */
export interface BuffShieldAttributeValue {
  /** 读取 Buff 持有者还是 Buff 来源；省略时使用运行时默认对象。 */
  readonly attributeSource?: 'buffOwner' | 'buffSource';
  /** 要读取的原生属性名称。 */
  readonly attribute: string;
  /** 属性值的乘数。 */
  readonly multiplier: BuffDuration;
  /** 乘算后再加入的固定值。 */
  readonly addition: BuffDuration;
}

/** 一个 Buff 提供的护盾及其伤害吸收规则。 */
export interface BuffShieldDefinition {
  /** 是否使用不会耗尽的无限护盾值。 */
  readonly infinityValue: boolean;
  /** 固定护盾值、黑板数值或按属性计算的护盾值。 */
  readonly value: BuffDuration | BuffShieldAttributeValue;
  /** 针对不同伤害类型的吸收规则。 */
  readonly damageAbsorptions: readonly BuffShieldDamageAbsorptionDefinition[];
  /** 护盾最多可以吸收的命中次数。 */
  readonly absorbCount: BuffTriggerCount;
  /** 最后一次消耗护盾时是否仍吸收整次伤害。 */
  readonly absorbAllDamageWhenConsumed: boolean;
  /** 护盾耗尽时是否结束所属 Buff。 */
  readonly removeBuffWhenConsumed: boolean;
  /** 与其他护盾竞争时的消耗优先级。 */
  readonly priority: BuffShieldPriority;
  /** 只保留原生表现选择位；后端不解释 EffectActionCfg。 */
  readonly replaceHitEffect: boolean;
}

/** Buff 生效期间提供的霸体和受击抗性。 */
export interface BuffSustainedProtectionDefinition {
  /** 效果作用于 Buff 持有者还是来源。 */
  readonly target: 'owner' | 'buffSource';
  /** 霸体值。 */
  readonly superArmor: BuffDuration;
  /** 冲击抗性值。 */
  readonly impactResistance: BuffDuration;
}

/**
 * Buff 生命周期的原生开关组合。
 * default：全局缩放时间；global：实体最终时间，允许实体忽略全局缩放；
 * self：全局与实体自身倍率相乘，不采用忽略全局缩放开关。
 * 后两项分别对应 useTimeDilationDt 开启后 onlyUseSelfTimeDilation 的关闭和开启。
 */
export type BuffTimeClock = 'default' | 'global' | 'self';

/** Buff 实例在头像、状态栏和技能按钮上的显示规则。 */
export interface CombatBuffPresentation {
  /** 游戏资源中的图标 ID。 */
  readonly iconId?: string;
  /** 已导出图标的资源路径。 */
  readonly iconPath?: string;
  /** 是否允许界面显示这个 Buff。 */
  readonly visible?: boolean;
  /** 是否显示在普通头顶状态栏。 */
  readonly showInHeadBarCommon?: boolean;
  /** 是否显示在附着状态头顶栏。 */
  readonly showInHeadBarAttached?: boolean;
  /** 是否显示在队伍头像附近。 */
  readonly showInSquadIcon?: boolean;
  /** 是否只为当前主控干员显示。 */
  readonly onlyShowForMainCharacter?: boolean;
  /** 是否在主控干员生命条上播放闪烁。 */
  readonly blinkInMainCharHpBar?: boolean;
  /** 是否在生命条上显示剩余进度。 */
  readonly showProgressInHpBar?: boolean;
  /** 是否在普通技能按钮上显示剩余进度。 */
  readonly showProgressInNormalSkillButton?: boolean;
  /** 普通技能按钮是否使用弱化样式的进度。 */
  readonly useWeakProgressInNormalSkillButton?: boolean;
  /** 是否在终结技按钮上显示剩余进度。 */
  readonly showProgressInUltimateSkillButton?: boolean;
  /** Buff 变化时是否强制发送图标刷新事件。 */
  readonly forceRaiseIconEvent?: boolean;
  /** 是否显示警告背景。 */
  readonly showWarningBackground?: boolean;
  /** 是否播放强提示进入动画。 */
  readonly playStrongInAnimation?: boolean;
  /** 是否配置了干员生命条特效类型。 */
  readonly hasCharHpBarVfxType?: boolean;
  /** 干员生命条使用的特效类型。 */
  readonly charHpBarVfxType?: string;
  /** Buff 在队伍头像区域使用的图标样式。 */
  readonly iconStyleInSquad?: string;
  /** 元素异常显示使用的颜色类型。 */
  readonly abnormalColorType?: string;
  /** 多个 Buff 图标同时出现时的排序设置。 */
  readonly orderPriority?: {
    /** 是否使用资源目录中配置的排序值。 */
    readonly useDirectoryValue: boolean;
    /** 同类图标之间的排序数值。 */
    readonly value: number;
    /** 图标所属的排序类别。 */
    readonly category: string;
  };
}

/** 一个子 Buff 的 ID 及其单独显示配置。 */
export interface CombatBuffChildPresentation {
  /** 子 Buff ID。 */
  readonly buffId: string;
  /** 子 Buff 的显示规则。 */
  readonly presentation: CombatBuffPresentation;
}

/** 原生 KeywordEnhance：由普通 Buff 的加入边沿持久改写关键词 rate。 */
export interface BuffKeywordEnhancementDefinition {
  /** 其中任一 Buff 加入时触发关键词强化。 */
  readonly triggerBuffIds: readonly string[];
  /** 对关键词数值执行赋值、加算或乘算。 */
  readonly operation: 'assign' | 'add' | 'multiply';
  /** 要修改的关键词数值名称。 */
  readonly targetKey: string;
  /** 尚未触发强化时的关键词初始值。 */
  readonly initialValue: BuffDuration;
  /** 每次触发时写入或参与运算的值。 */
  readonly value: BuffDuration;
}

/** 外部 Buff 定义文档当前使用的格式版本。 */
export const COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION = 1 as const;

/** 核心能够理解并交给专用适配器处理的 Buff 语义角色。 */
export type CombatBuffSemanticRole =
  /** 一种元素附着状态。 */
  | {
      /** 语义角色判别值。 */
      readonly kind: 'elementalAttachment';
      /** 附着元素。 */
      readonly element: InflictionElement;
    }
  /** 一种元素爆发状态。 */
  | {
      /** 语义角色判别值。 */
      readonly kind: 'elementalBurst';
      /** 爆发元素。 */
      readonly element: InflictionElement;
    }
  | {
      /** 消耗已有元素附着后形成的复合状态。 */
      readonly kind: 'compoundStatus';
      /** 被消耗的已有附着元素。 */
      readonly consumedElement: InflictionElement;
      /** 本次新加入的元素。 */
      readonly incomingElement: InflictionElement;
    };

/** 定义动作可从常量或当前 Buff 黑板读取的数值。 */
export type CombatBuffDefinitionNumberOperand =
  | number
  | {
      /** 读取数值的 Buff 黑板键。 */
      readonly blackboardKey: string;
    };

/** StoreAttributeValue 在来源实体上选择属性的方式。 */
export type CombatBuffDefinitionAttributeSelector =
  /** 读取指定名称的属性。 */
  | {
      /** 指定属性选择器。 */
      readonly kind: 'specific';
      /** 原生属性名称。 */
      readonly key: string;
    }
  /** 读取来源对象的主属性、副属性或四项属性。 */
  | {
      /** 相对属性选择方式。 */
      readonly kind: 'main' | 'secondary' | 'all';
    };

/** StoreAttributeValue 读取的原生属性聚合阶段，二者都必须排除 Converted 来源。 */
export type CombatBuffDefinitionAttributeStage = 'armedNonConverted' | 'finalNonConverted';

/** 外部 Buff 定义在生命周期中可以执行的一项动作。 */
export type CombatBuffDefinitionAction =
  /** 发出元素附着开始事件。 */
  | {
      /** 动作种类判别值。 */
      readonly kind: 'emitElementalInflictionStarted';
    }
  /** 按当前黑板重新计算 Buff 提供的属性修正值。 */
  | {
      /** 动作种类判别值。 */
      readonly kind: 'refreshAttributeModifierValues';
    }
  | {
      /** 读取来源对象的属性并把计算结果保存到 Buff 黑板。 */
      readonly kind: 'storeAttributeValue';
      /** 当前只允许从 Buff 来源读取属性。 */
      readonly target: 'source';
      /** 要读取的属性。 */
      readonly attribute: CombatBuffDefinitionAttributeSelector;
      /** 读取属性聚合过程中的哪个阶段。 */
      readonly stage: CombatBuffDefinitionAttributeStage;
      /** 是否对读取到的属性向下取整。 */
      readonly useFloor: boolean;
      /** 属性值先除以此数。 */
      readonly divisor: CombatBuffDefinitionNumberOperand;
      /** 除法后乘以此数。 */
      readonly multiplier: CombatBuffDefinitionNumberOperand;
      /** 最后加入的基础值。 */
      readonly base: CombatBuffDefinitionNumberOperand;
      /** 保存结果的 Buff 黑板键。 */
      readonly targetKey: string;
    }
  | {
      /** 对 Buff 黑板中的一个数值赋值或加算。 */
      readonly kind: 'modifyBlackboard';
      /** 使用赋值还是加算。 */
      readonly operation: 'assign' | 'add';
      /** 要修改的 Buff 黑板键。 */
      readonly targetKey: string;
      /** 常量或从另一个黑板键读取的数值。 */
      readonly value:
        | number
        | {
            /** 读取数值的 Buff 黑板键。 */
            readonly blackboardKey: string;
          };
    }
  | {
      /**
       * 把 Buff 黑板数值限制在最小值和最大值之间。
       * 只应用于已确认等价于该运算的原生比较和赋值动作链。
       */
      readonly kind: 'clampBlackboard';
      /** 要限制的 Buff 黑板键。 */
      readonly targetKey: string;
      /** 可选最小值。 */
      readonly minimum?: CombatBuffDefinitionNumberOperand;
      /** 可选最大值。 */
      readonly maximum?: CombatBuffDefinitionNumberOperand;
    }
  | {
      /** 触发法术爆发；伤害由运行时按定义中的 `spellBurst` 参数执行。 */
      readonly kind: 'triggerSpellBurst';
      /** 选择爆发配置的原生类型名称。 */
      readonly burstType: string;
    }
  | {
      /** Buff 生命周期中的原生 DamageAction；倍率读取当前 Buff 黑板并走标准玩家伤害。 */
      readonly kind: 'dealAttackScaledDamage';
      /** 伤害类型。 */
      readonly damageType: DamageType;
      /** 攻击力倍率。 */
      readonly attackScale: CombatBuffDefinitionNumberOperand;
      /** 伤害携带的分类标签。 */
      readonly tags: readonly DamageTag[];
      /** 伤害携带的处理特征。 */
      readonly features: readonly DamageFeature[];
      /** 本次伤害是否可以暴击。 */
      readonly canCritical: boolean;
    }
  | {
      /** 已确认对数值无影响的纯表现动作（动画/特效/声音/镜头等），`actionType` 记录原生类型名。 */
      readonly kind: 'visualOnly';
      /** 原生表现动作类型名，供审计和后续补充表现使用。 */
      readonly actionType: string;
    }
  | {
      /** 已恢复真实语义，但在 Endaxis 固定木桩模型中严格不可触发的动作。 */
      readonly kind: 'simulationNoEffect';
      /** 该动作在当前木桩模拟中无法生效的原因。 */
      readonly reason: 'enemyWeaknessWindowRequiresEnemyActiveBehavior';
      /** 原生动作类型名。 */
      readonly nativeActionType: string;
    };

/** 法术爆发的伤害参数；从原生 `DamageAction` 与 `ReadSkillSettingData` 提取。 */
export interface CombatBuffSpellBurstDefinition {
  /** 选择这组爆发参数的原生爆发类型。 */
  readonly burstType: string;
  /** 爆发伤害的元素类型（原生 damageType 归一化后的语义枚举）。 */
  readonly damageType: DamageType;
  /** 爆发倍率在 SkillSetting 中的 dataKey。 */
  readonly skillSettingDataKey: string;
  /** SkillSetting 列号（原生 1 基；运行时按列号减一取数组下标）。 */
  readonly skillSettingColumn: number;
  /** 原生 DamageAction 的基础倍率；被 SkillSetting 倍率覆盖，仅作证据保留。 */
  readonly atkScaleBase: number;
}

/** 外部 Buff 定义在各生命周期阶段执行的动作集合。 */
export interface CombatBuffDefinitionLifecycleActions {
  /** Buff 创建时执行。 */
  readonly start?: readonly CombatBuffDefinitionAction[];
  /** 周期触发时执行。 */
  readonly trigger?: readonly CombatBuffDefinitionAction[];
  /** 强化层数变化时执行。 */
  readonly enhanceChanged?: readonly CombatBuffDefinitionAction[];
  /** 一次强化流程结束后执行。 */
  readonly afterEnhance?: readonly CombatBuffDefinitionAction[];
  /** Buff 结束前执行。 */
  readonly finish?: readonly CombatBuffDefinitionAction[];
}

/** 外部定义中一项可序列化的原生八槽属性修正。 */
export interface CombatBuffDefinitionAttributeModifier {
  /** 指定属性名称，或在应用时按持有者选择主属性、副属性或全部四维。 */
  readonly attribute:
    | string
    | {
        /** 相对属性选择方式。 */
        readonly kind: 'main' | 'secondary' | 'all';
      };
  /** 要写入的原生属性公式槽。 */
  readonly slot: AttributeModifierSlot;
  /** 固定修正值或从 Buff 黑板读取的值。 */
  readonly value:
    | number
    | {
        /** 读取修正值的 Buff 黑板键。 */
        readonly blackboardKey: string;
      };
  /** 修正 Buff 持有者还是 Buff 来源；省略时修正持有者。 */
  readonly target?: 'owner' | 'buffSource';
  /** 以换算属性来源写入，避免再次参与属性换算。 */
  readonly source?: 'converted';
}

/** 外部和内联 Buff 定义中可序列化的伤害处理器。 */
export type CombatBuffDefinitionDamageProcessor =
  | DamageScaleProcessorDefinition
  | (Pick<InstantAttributeProcessorDefinition, 'kind' | 'targetSide' | 'attribute' | 'values'> & {
      /** Buff 伤害处理器始终读取战斗运行时属性。 */
      readonly attributeTiming: 'runtime';
    });

/** Buff 激活期间向伤害生命周期注册的一项纯数据修正。 */
export interface CombatBuffDefinitionDamageModifier {
  /** 修正安装在攻击方还是防御方时启用。 */
  readonly enabledSide: DamageModifierDefinition['enabledSide'];
  /** 启用处理器前检查的条件。 */
  readonly condition?: DamageModifierCondition;
  /** 条件成立时按顺序执行的伤害处理器。 */
  readonly processors: readonly CombatBuffDefinitionDamageProcessor[];
}

/** 干员内联 Buff 使用的伤害修正，可用动作序列计算较复杂的实例条件。 */
export type SkillBuffDefinitionDamageModifier = CombatBuffDefinitionDamageModifier & {
  /** 以动作序列的最终结果决定是否启用处理器；不能与 `condition` 同时填写。 */
  readonly conditionProgram?: ActionGraphReference;
};

/** 外部 Buff 文档中的一项完整 Buff 定义。 */
export interface CombatBuffDefinitionEntry extends BuffDefinitionProperties {
  /** Buff 的全局唯一 ID。 */
  readonly id: string;
  /** 允许的最大强化层数或叠加实例数。 */
  readonly maxStackCount?: number;
  /** 在各生命周期阶段执行的外部 Buff 动作。 */
  readonly actions?: CombatBuffDefinitionLifecycleActions;
}

/** 一份带格式版本和游戏数据修订号的外部 Buff 定义文档。 */
export interface CombatBuffDefinitionsDocument {
  /** 文档格式版本。 */
  readonly schemaVersion: typeof COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION;
  /** 生成这份文档时使用的游戏数据修订号。 */
  readonly revision: string;
  /** 文档包含的全部 Buff 定义。 */
  readonly buffs: readonly CombatBuffDefinitionEntry[];
}

/**
 * 一种 Buff 的公共配置，说明它如何显示、叠加、计时、触发，以及生效期间提供哪些战斗效果。
 * Buff ID 由使用这个类型的外层对象提供；施加目标、来源和本次传入的黑板值由施加动作提供。
 */
export type BuffDefinitionProperties = {
  /** 启用时记录创建该 Buff 的技能施放编号，供 SkillAffix 条件匹配同一次施放。 */
  readonly affixSkillCastIdentity?: 'sourceSkillCast';
  /** Buff 自身的图标、颜色、排序位置和进度条等显示设置。 */
  readonly presentation?: CombatBuffPresentation;
  /** 跟随本体同时出现和消失的额外显示图标；它们没有独立战斗效果和生命周期。 */
  readonly childPresentations?: readonly CombatBuffChildPresentation[];
  /** 计算持续时间和触发间隔所用的时钟；不填时随全局时间缩放。 */
  readonly timeClock?: BuffTimeClock;
  /** Buff 的分类标签；启用时同时挂到所属实体，并用于按标签查找、计数和结束 Buff。 */
  readonly applyTags?: readonly GameplayTag[];
  /** Buff 到期但被延长逻辑暂时阻止结束时，临时挂到所属实体的标签。 */
  readonly extendTags?: readonly GameplayTag[];
  /** 再次施加同一叠加组的 Buff 时，决定新建实例、加层、刷新时长或拒绝施加。 */
  readonly stackingType: BuffStackingType;
  /** Buff 所属的叠加组；不填时使用 Buff ID，同一组必须使用相同的叠加方式。 */
  readonly stackingKey?: string;
  /** 高优先级模式的启用顺序，以及 Stack 满层时选择被替换实例的顺序。 */
  readonly priority?: BuffPriority;
  /** 普通 Buff 的持续秒数；不填表示无限持续。定时成长型 Buff 用它表示自动加层周期。 */
  readonly durationSeconds?: BuffDuration;
  /** 成功添加后在接收者上创建的同 ID 再次添加冷却；使用普通战斗时间计时。 */
  readonly addingCooldownSeconds?: BuffDuration;
  /** 是否跳过已有添加冷却的拦截；成功添加后仍会创建新的添加冷却。 */
  readonly ignoreAddingCooldown?: boolean;
  /** Buff 启用期间执行 trigger 生命周期动作的时间间隔。 */
  readonly triggerIntervalSeconds?: BuffDuration;
  /** 是否等满一个触发间隔后再首次触发；为 false 时启用后的首次更新即可触发。 */
  readonly waitFirstTriggerInterval?: boolean;
  /** trigger 生命周期动作最多执行的次数；0 表示不触发，负数表示不限制次数。 */
  readonly maxTriggerCount?: BuffTriggerCount;
  /** 每个 Buff 实例的初始黑板值；施加动作可以覆盖这些值，其他字段也可从中取数。 */
  readonly blackboard?: Readonly<Record<string, ActionBlackboardValue>>;
  /** Buff 启用期间注册到目标或来源身上的属性修正。 */
  readonly attributeModifiers?: readonly CombatBuffDefinitionAttributeModifier[];
  /** Buff 启用期间参与伤害计算的条件和数值处理器。 */
  readonly damageModifiers?: readonly CombatBuffDefinitionDamageModifier[];
  /** 指定的其他 Buff 成功加入同一持有者时，对当前 Buff 的关键词倍率执行赋值、加法或乘法。 */
  readonly keywordEnhancements?: readonly BuffKeywordEnhancementDefinition[];
  /** Buff 启用期间参与治疗计算的条件和数值处理器。 */
  readonly healModifiers?: readonly HealModifierDefinition[];
  /** Buff 启用期间参与失衡伤害计算的条件和数值处理器。 */
  readonly poiseModifiers?: readonly PoiseModifierDefinition[];
  /** Buff 启用时创建的护盾；护盾的数值、吸收范围、次数和销毁行为由条目配置。 */
  readonly shields?: readonly BuffShieldDefinition[];
  /** Buff 启用期间提供的霸体值和抗冲击值，可作用于持有者或 Buff 来源。 */
  readonly sustainedProtection?: BuffSustainedProtectionDefinition;
  /** 标记该 Buff 的特殊战斗身份，供元素附着、元素爆发等专用规则识别。 */
  readonly role?: CombatBuffSemanticRole;
  /** 元素爆发 Buff 触发伤害时使用的爆发类型、伤害类型和倍率来源。 */
  readonly spellBurst?: CombatBuffSpellBurstDefinition;
};
import type { GameplayTag } from './gameplayTags.ts';
