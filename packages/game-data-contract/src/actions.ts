/**
 * 定义战斗模拟器能够执行的全部动作步骤、动作序列和战斗事件响应。
 *
 * 技能、Buff、装备与养成效果都用同一套步骤描述伤害、治疗、资源变化、状态、目标查询、
 * 时间控制和流程控制。模拟器按步骤顺序执行，并用动作黑板和上下文目标组传递中间结果。
 */
import type { GameplayTag, GameplayTagQueryType } from './gameplayTags.ts';
import type { AbilityEvent } from './abilityEvents.ts';

import {
  type BuffApplicationSource,
  type BuffApplicationTarget,
  type BuffSingleTarget,
  type CombatResource,
  type CombatTarget,
  type DamageCalculation,
  type DamageElement,
  type DamageFeature,
  type DamageTag,
  type DamageType,
  type ElementalReaction,
  type HealCalculationAttribute,
  type HealTarget,
  type InflictionElement,
  type LevelValues,
  type OperatorAttribute,
  type PhysicalInflictionType,
  type ResourceRecipient,
  type SkillType,
  type SpGainKind,
  type SpGainSource,
  type ActionStringOperand,
  type TimeDilationIgnoreTarget,
  type TimeDilationEntityTarget,
  type TimedMarkerTarget,
  type GlobalCooldownTarget,
} from './primitives.ts';
import {
  type ActionValueCalculationOperation,
  type ActionValueOperand,
  type ActionValueOperation,
  type CombatCondition,
  type TimeScaleCurveDefinition,
} from './conditions.ts';
import {
  type AbilityEntityChildSkillDefinition,
  type AbilityEntityDefinition,
  type AbilityEntityTargetQuery,
  type SkillTriggerScope,
  type ProjectileCallbackSkillDefinition,
} from './skills.ts';
import { type SkillBuffDefinition, type SkillGlobalBuffDefinition } from './buffs.ts';
import type {
  AttributeModifierSlot,
  AttributeModifierTiming,
  DamageModifierSide,
  DamageScaleSide,
  DamageScaleZone,
} from './modifiers.ts';

/** 治疗目标绑定；Context 使用查询阶段保存的实例，其他目标不得携带查询键。 */
export type HealTargetBinding =
  | {
      /** 使用此前查询并保存的动作目标。 */
      target: 'contextTarget';
      /** 保存目标的动作环境键。 */
      contextKey: string;
    }
  | {
      /** 使用无需额外查询键的治疗目标选择器。 */
      target: Exclude<HealTarget, 'contextTarget'>;
      /** 非 Context 目标禁止携带查询键。 */
      contextKey?: never;
    };

/** 标签结束使用单个已绑定对象；集合与主控选择器不在此动作的目标范围内。 */
export const BUFF_TAG_FINISH_TARGETS = [
  'caster',
  'enemy',
  'currentAbilityEntity',
  'eventTarget',
  'eventSource',
  'buffOwner',
  'buffSource',
  'currentTarget',
] as const satisfies readonly BuffSingleTarget[];
/** 按标签结束 Buff 时允许使用的一种单体目标。 */
export type BuffTagFinishTarget = (typeof BUFF_TAG_FINISH_TARGETS)[number];

/** 一次伤害步骤的完整声明；倍率使用小数，失衡与生命伤害同属该命中。 */
export interface DealDamageParameters {
  /** 本次生命伤害的类型。 */
  damageType: DamageType;
  /** 生成基础伤害所用的公式；标准攻击倍率路径可省略。 */
  calculation?: DamageCalculation;
  /** 单次命中的攻击倍率；原生允许在命中前通过动作黑板动态计算。 */
  attackScale: LevelValues | ActionValueOperand;
  /** 原生动作 Reset 时冻结本伤害单元的攻击计算结果，后续执行复用该值。 */
  takeAttackSnapshot?: boolean;
  /** 破防攻击计算中的逐命中倍率；标准伤害不得设置。 */
  calculationMultiplier?: LevelValues;
  /** MultiplyAttributeCalculation 读取的来源实体原生属性键。 */
  calculationAttribute?: string;
  /** MultiplyAttributeCalculation 在属性乘算后追加的固定或黑板值。 */
  calculationAddition?: LevelValues | ActionValueOperand;
  /** 本次伤害携带的技能和爆发分类标签。 */
  tags: readonly DamageTag[];
  /** DamageUnit.damageTags 携带的原生 GameplayTag；与 damageDecorateMask 分类位分开。 */
  gameplayTags?: readonly GameplayTag[];
  /** 原生伤害位中与技能分类无关的行为特征。 */
  features?: readonly DamageFeature[];
  /** 同一次命中在生命伤害之后结算的失衡伤害；原生同样允许从动作黑板读取。 */
  stagger?: LevelValues | ActionValueOperand;
  /** DefiniteValueCalculation.applyScale 启用时在失衡基础值之后乘用的倍率。 */
  staggerMultiplier?: LevelValues | ActionValueOperand;
  /** 原生 Poise 单元 onlyEnableForMainChar；生命伤害仍正常结算。 */
  staggerOnlyWhenCasterControlled?: boolean;
  /** 每层语义化战斗状态提供的额外攻击倍率。 */
  attackScalePerStatusStack?: {
    /** 要读取层数的状态键。 */
    statusKey: string;
    /** 状态所属对象。 */
    target: CombatTarget;
    /** 每层额外提供的攻击倍率。 */
    coefficient: LevelValues;
  };
  /** 原生 DamageUnit.damageProcessors 中只对当前伤害包生效的属性修正。 */
  instantAttributeModifiers?: readonly {
    /** 修改攻击方还是目标方。 */
    targetSide: DamageModifierSide;
    /** 要修改的原生属性。 */
    attribute: string;
    /** 写入的属性公式槽。 */
    slot: AttributeModifierSlot;
    /** 写入的数值。 */
    value: ActionValueOperand;
    /** 读取构筑属性还是当前运行时属性。 */
    attributeTiming: AttributeModifierTiming;
  }[];
  /** 原生 DamageUnit.damageProcessors 中只对当前伤害包生效的命名伤害倍率区修正。 */
  instantDamageScaleModifiers?: readonly {
    /** 修改攻击方还是目标方。 */
    side: DamageScaleSide;
    /** 写入的伤害倍率区间。 */
    zone: DamageScaleZone;
    /** 加入该区间的数值。 */
    addition: ActionValueOperand;
  }[];
}

/**
 * 不读取攻击力的固定基础值伤害。
 * 固定值只替代标准伤害的“攻击力乘倍率”阶段，后续伤害修正与防御、抗性公式保持不变。
 */
export interface DealFixedDamageParameters {
  /** 本次生命伤害的类型。 */
  damageType: DamageType;
  /** 不依赖攻击力的基础伤害值。 */
  value: LevelValues | ActionValueOperand;
  /** 本次伤害携带的技能和爆发分类标签。 */
  tags: readonly DamageTag[];
  /** 原生伤害位中与技能分类无关的行为特征。 */
  features?: readonly DamageFeature[];
  /** 同一次命中在生命伤害之后结算的失衡伤害。 */
  stagger?: LevelValues | ActionValueOperand;
  /** 失衡基础值结算后乘用的倍率。 */
  staggerMultiplier?: LevelValues | ActionValueOperand;
  /** 原生 Poise 单元 onlyEnableForMainChar；生命伤害仍正常结算。 */
  staggerOnlyWhenCasterControlled?: boolean;
}

/**
 * 语义战斗状态每层能够贡献的修正。
 * 这些定义由编译器展开，不能携带运行时回调或直接引用 UI 状态。
 */
export interface StatusModifierDefinitionMap {
  /** 每层增加攻击力百分比。 */
  attackPercent: {
    /** 修正种类判别值。 */
    kind: 'attackPercent';
    /** 每层增加的攻击力比例。 */
    value: LevelValues;
  };
  /** 每层增加受到指定类型伤害的倍率。 */
  susceptibility: {
    /** 修正种类判别值。 */
    kind: 'susceptibility';
    /** 此易伤覆盖的伤害类型。 */
    damageTypes: readonly DamageType[];
    /** 每层基础易伤值。 */
    value: LevelValues;
    /** 可选的属性换算额外易伤。 */
    attributeScaling?: {
      /** 用于换算额外易伤的干员属性。 */
      attribute: OperatorAttribute;
      /** 每点属性提供的易伤系数。 */
      coefficient: LevelValues;
    };
    /** 易伤总值上限。 */
    cap?: LevelValues;
  };
  /** 标记目标处于减速状态。 */
  slowed: {
    /** 修正种类判别值。 */
    kind: 'slowed';
  };
  /** 阻止指定资源增加。 */
  blockResourceGain: {
    /** 修正种类判别值。 */
    kind: 'blockResourceGain';
    /** 被阻止增加的资源。 */
    resource: CombatResource;
  };
  /** 乘算指定资源的消耗量。 */
  resourceCostMultiplier: {
    /** 修正种类判别值。 */
    kind: 'resourceCostMultiplier';
    /** 要修改费用的资源。 */
    resource: CombatResource;
    /** 费用乘数。 */
    value: number;
  };
  /** 乘算指定技能组的冷却时间。 */
  skillCooldownMultiplier: {
    /** 修正种类判别值。 */
    kind: 'skillCooldownMultiplier';
    /** 目标技能组。 */
    skillGroupKey: string;
    /** 冷却时间乘数。 */
    value: number;
  };
}

/** 一种语义战斗状态可以提供的修正。 */
export type StatusModifierDefinition =
  StatusModifierDefinitionMap[keyof StatusModifierDefinitionMap];

/** `StatusModifierDefinition` 中全部修正种类。 */
export const STATUS_MODIFIER_KINDS = [
  'attackPercent',
  'susceptibility',
  'slowed',
  'blockResourceGain',
  'resourceCostMultiplier',
  'skillCooldownMultiplier',
] as const satisfies readonly StatusModifierDefinition['kind'][];

/**
 * 所有战斗步骤与参数结构的集中映射。
 * 增加步骤时必须同时提供编译、运行时执行和严格校验，不能只扩展此类型。
 */
export interface CombatStepParameters {
  /** 合并稳定目标身份并覆盖写入 Context 目标组；空 sources 用于初始化空组。 */
  mergeContextTargets: {
    /** 保存合并结果的动作环境键。 */
    saveToContextKey: string;
    /** 按顺序加入结果组的单体目标或已有目标组。 */
    sources: readonly (
      | {
          /** 加入一个按身份解析的单体目标。 */
          readonly kind: 'target';
          /** 要加入的对象身份。 */
          readonly target: 'caster' | 'enemy' | 'eventTarget' | 'buffSource' | 'currentTarget';
        }
      | {
          /** 加入一个已有动作目标组。 */
          readonly kind: 'context';
          /** 已有目标组的动作环境键。 */
          readonly contextKey: string;
        }
      /** 原生 SourceFinder：先选动作来源/宿主，再查询其单层 AbilitySystem.source。 */
      | {
          /** 读取能力系统来源。 */
          readonly kind: 'abilitySystemSource';
          /** 从动作来源或动作宿主的能力系统读取。 */
          readonly owner: 'actionSource' | 'actionOwner';
        }
    )[];
  };
  /** 查询当前队伍并把当时的实例身份快照覆盖写入 Context；后续消费者不得重新选人。 */
  findCharacterTeamTargets: {
    /** 保存查询结果的动作环境键。 */
    saveToContextKey: string;
    /** 从队伍中选择全部、主控或生命比例最低的干员。 */
    selection:
      /** 选择全队干员。 */
      | {
          /** 队伍选择种类判别值。 */
          readonly kind: 'allOperators';
        }
      /** 选择当前主控干员。 */
      | {
          /** 队伍选择种类判别值。 */
          readonly kind: 'controlledOperator';
        }
      | {
          /** 选择生命比例最低的干员。 */
          readonly kind: 'lowestHealthRatioOperator';
          /** 在优先级筛选之前排除既有 Context 中保存的稳定身份。 */
          readonly excludedContextKey?: string;
          /** 在优先级筛选之前排除当前技能施术者。 */
          readonly excludeCaster?: true;
          /** 在 forEach Context 内排除当前迭代的干员目标。 */
          readonly excludeCurrentTarget?: true;
        };
  };
  /** 在零空间模型中只保存随机空间点的数量与稳定临时身份，不保存坐标。 */
  createSpatialPointTargets: {
    /** 保存临时空间点目标的动作环境键。 */
    saveToContextKey: string;
    /** 要创建的空间点数量。 */
    count: ActionValueOperand;
  };
  /** 按 owner 与生成期已解析的实体身份查询，并保存为本次释放的 Context 目标组。 */
  findOwnerSpawnedAbilityEntities: {
    /** 保存查询结果的动作环境键。 */
    saveToContextKey: string;
    /** 只查找这些能力实体 ID；省略时不按 ID 筛选。 */
    abilityEntityIds?: readonly string[];
    /** 省略时使用当前动作施法者；存在时从已写入 Context 的单个干员解析 owner。 */
    ownerContextKey?: string;
    /** 原生查询后处理保留的目标数量；零空间模型会消去距离排序，但不能消去截断。 */
    maxTargets?: number;
    /** 使用当前技能或 Buff 继承的施法序号执行 SkillCastIdValidator。 */
    sameSourceSkillCast?: boolean;
    /** 可选地把同一查询结果数量写入动作黑板，后续复用 actionValueCompare。 */
    saveCountToBlackboardKey?: string;
    /** 原生 CircularOrderSort 在项目零空间投影下以槽位 0 为起点执行的环排序。 */
    circularOrder?: {
      /** 保存下一次环形查询起点的动作黑板键。 */
      indexBlackboardKey: string;
      /** 排序后希望保留的目标数。 */
      desiredCount: number;
      /** 保留原生符号语义：非负递减，负值递增。 */
      reverseFlag: number;
    };
  };
  /** 从既有 Context 目标组按运行时索引选出一个稳定句柄，覆盖写入新组。 */
  pickContextTarget: {
    /** 已有目标组的动作环境键。 */
    sourceContextKey: string;
    /** 保存单个选中目标的新动作环境键。 */
    saveToContextKey: string;
    /** 要选取的数组下标。 */
    index: ActionValueOperand;
  };
  /**
   * 对 Context 中的稳定目标句柄逐一同步执行；唯一木桩/施法者已被静态证明时，
   * 也可直接保留原生 ForEach 的即时生命周期与“忽略子序列返回值”边界。
   */
  forEachContextTarget:
    | {
        /** 要遍历的动作目标组。 */
        contextKey: string;
        /** 使用目标组时禁止同时指定固定目标。 */
        target?: never;
      }
    | {
        /** 使用固定目标时不读取动作目标组。 */
        contextKey?: never;
        /** 作为唯一迭代项的固定目标。 */
        target: 'enemy' | 'caster';
      };
  /** 读取当前 Context 迭代目标的能力实体剩余时长到动作黑板。 */
  readAbilityEntityRemainingDuration: {
    /** 保存剩余秒数的动作黑板键。 */
    outputKey: string;
  };
  /** 将当前 Context 迭代目标的能力实体剩余时长赋为一个明确数值。 */
  setAbilityEntityRemainingDuration: {
    /** 新的剩余秒数。 */
    value: ActionValueOperand;
  };
  /** 结束当前 Context 迭代目标所指向的能力实体。 */
  finishCurrentAbilityEntity: Record<string, never>;
  /** 结束当前能力实体子技能的 ActionOwner，不受内层 forEach 当前目标覆盖。 */
  finishActionOwnerAbilityEntity: Record<string, never>;
  /** 仅在当前能力实体的来源已经死亡时结束该实体。 */
  finishCurrentAbilityEntityWhenSourceDies: Record<string, never>;
  /** 在当前 Context 迭代目标所指向的既有能力实体上启动一个无施法子技能。 */
  startCurrentAbilityEntityChildSkill: {
    /** 要启动的无施法子技能。 */
    childSkill: AbilityEntityChildSkillDefinition;
  };
  /** 在当前 Context 能力实体自己的模板中按原生 Skill ID 启动具名子技能。 */
  startCurrentAbilityEntityChildSkillById: {
    /** 能力实体模板中登记的原生子技能 ID。 */
    childSkillId: string;
  };
  /** 在零空间模型中生成一个有独立身份、生命周期和实体黑板的逻辑能力实体。 */
  spawnAbilityEntity: {
    /** 要生成的能力实体模板 ID。 */
    abilityEntityId: string;
    /** 手写定义可暂时内联；生成定义从干员或只读公共定义表按 ID 解析。 */
    definition?: AbilityEntityDefinition;
    /** 原生 assignBlackboard：生成时把当前动作黑板复制为实体黑板初值。 */
    inheritActionBlackboard?: boolean;
    /** 原生 inheritSourceSkillCastId=false 时，实体及其子技能不继承当前施法身份。省略表示继承。 */
    inheritSourceSkillCastInfo?: boolean;
    /** 从实体模板的具名子技能集合选择本次 Spawn 绑定的原生子技能。 */
    childSkillId?: string;
    /**
     * 原生 setAbilityEntitySource 的来源身份。省略表示施术者；投射物/能力实体子技能中的
     * ActionOwner 必须显式保留为当前能力实体，不能在生成期压平成施术者。
     */
    source?: 'caster' | 'currentAbilityEntity';
    /** 生成位置锚点；Buff 局部时间线中的 Owner 是当前 Buff 宿主能力实体。 */
    target?: CombatTarget | 'currentAbilityEntity';
    /** 用动作数值覆盖模板持续时间。 */
    overrideDurationSeconds?: ActionValueOperand;
    /** 保存新实体的动作环境键。 */
    saveToContextKey?: string;
    /** 来源结束时是否同步结束实体。 */
    dieWhenSourceDies: boolean;
    /** 原生 dieOnEnd：生成动作结束时同步结束本动作创建的实体。 */
    finishByAction?: boolean;
    /** 从当前动作黑板计算并覆盖实体黑板的数值。 */
    blackboardAssignments?: Readonly<Record<string, ActionValueOperand>>;
    /** 原生 SpawnAbilityEntity 的直接字符串赋值；与数值操作数分开保存。 */
    stringBlackboardAssignments?: Readonly<Record<string, string>>;
  };
  /** 为目标增加一层元素附着并触发相应事件。 */
  applyElementalInfliction: {
    /** 要施加的元素。 */
    element: InflictionElement;
    /** 是否作为额外附着传播到事件上下文。 */
    isExtra: boolean;
    /** 省略时沿用技能的固定敌人；Buff Owner 必须按生命周期身份校验，不能无条件视为敌人。 */
    target?: 'enemy' | 'buffOwner';
  };
  /** Buff 触发周期中的原生 TriggerSpellBurstEventAction。 */
  triggerSpellBurst: {
    /** 要触发的原生法术爆发类型。 */
    burstType: 'Fire' | 'Pulse' | 'Cryst' | 'Natural';
  };
  /** 在施放者 AbilitySystem 上同步发布一个已命名的原生自定义事件。 */
  triggerCustomAbilityEvent: {
    /** 发布的自定义事件名称。 */
    eventName: string;
    /** 随事件发送的浮点参数。 */
    eventParam: number;
    /** 事件发布到施法者的能力系统。 */
    target: 'caster';
    /** 省略沿用旧定义的 caster；能力实体子技能可保留原生 ActionOwner 事件来源身份。 */
    source?: 'caster' | 'currentAbilityEntity';
  };
  /** 原生 CastSkill：动作栈返回后覆盖写入 AbilitySystem 的单槽延迟施放请求。 */
  castSkillDuringAction: {
    /** 原生表内 Skill ID；可以直接给定，也可以从当前动作黑板读取。装配层必须映射到同干员的稳定技能键。 */
    skillId: ActionStringOperand;
    /** 目标技能作用于施法者还是敌人。 */
    target: 'caster' | 'enemy';
    /** 是否跳过目标技能自己的资源消耗。 */
    skipApplyCost: boolean;
    /** 是否把当前施法身份传给目标技能。 */
    inheritSourceSkillCastInfo: boolean;
    /** 目标技能不可施放时保留当前技能；省略表示旧版无条件消费延迟请求。 */
    interruptCurrentSkillOnlyWhenTargetCastable?: boolean;
  };
  /** 普通根倒地动作；破防与状态 Buff 由公共目录解析，不等同于输出一次成功事件。 */
  applyKnockDown: {
    /** 当前只支持对固定敌人施加倒地。 */
    target: 'enemy';
    /** 倒地持续秒数。 */
    duration: ActionValueOperand;
    /** 是否强制覆盖目标当前控制状态。 */
    force: boolean;
    /** 是否作为额外物理异常传播到事件上下文。 */
    isExtra: boolean;
    /** 原生 AllValid/OnlyAlive 都只选存活目标；OnlyDead 实际跳过全部目标。 */
    targetFilter: 'aliveOnly' | 'skipAll';
    /** 动作根据成功和打断结果返回的时机。 */
    returnWhen: 'always' | 'successAndInterrupted' | 'success' | 'interrupted';
  };
  /**
   * 对固定敌人执行物理异常入口。公共 Buff 蓝图随使用点内联，运行时按目标当前层数
   * 选择首次破防或后续异常链，不把公共 Buff 变成可编辑的项目级钻石依赖。
   */
  applyPhysicalInfliction: {
    /** 当前只支持对固定敌人施加物理异常。 */
    target: 'enemy';
    /** 是否作为额外物理异常传播到事件上下文。 */
    isExtra: boolean;
    /** 目标首次进入破防时使用的 Buff ID。 */
    noGuardBuffId: string;
    /** 首次破防 Buff 的完整定义。 */
    noGuardDefinition: SkillBuffDefinition;
  } & (
    | {
        /** 破裂。 */
        type: 'fracture';
        /** 破裂 Buff ID。 */
        fractureBuffId: string;
        /** 破裂 Buff 定义。 */
        fractureDefinition: SkillBuffDefinition;
      }
    | {
        /** 粉碎。 */
        type: 'crush';
        /** 粉碎 Buff ID。 */
        crushedBuffId: string;
        /** 粉碎 Buff 定义。 */
        crushedDefinition: SkillBuffDefinition;
        /** 粉碎伤害倍率。 */
        damageMultiplier: ActionValueOperand;
        /** 是否跳过命中特效。 */
        ignoreHitEffect: boolean;
      }
    | {
        /** 击飞。 */
        type: 'airborne';
        /** 击飞 Buff ID。 */
        airborneBuffId: string;
        /** 击飞 Buff 定义。 */
        airborneDefinition: SkillBuffDefinition;
        /** 击飞持续秒数。 */
        duration: ActionValueOperand;
        /** 原生击飞高度。 */
        height: ActionValueOperand;
        /** 原生移动速度系数。 */
        speedFactorMultiplier: number;
        /** 是否强制覆盖目标当前控制状态。 */
        force: boolean;
        /** 原生 AllValid/OnlyAlive 都只选存活目标；OnlyDead 实际跳过全部目标。 */
        targetFilter: 'aliveOnly' | 'skipAll';
        /** 动作根据成功和打断结果返回的时机。 */
        returnWhen: 'always' | 'successAndInterrupted' | 'success' | 'interrupted';
      }
  );
  /** 在目标身上创建一个有持续时间和效果系数的复合元素反应。 */
  applyElementalReaction: {
    /** 要创建的复合元素反应。 */
    reaction: ElementalReaction;
    /** 反应作用的对象。 */
    target: CombatTarget;
    /** 原生反应触发 Buff 可从当前动作黑板转交持续时间。 */
    durationSeconds: number | ActionValueOperand;
    /** 构筑期持续时间修正；与动作黑板基础时长分离。 */
    durationMultiplier?: number;
    /** 反应效果系数。 */
    effectiveness: number;
  };
  /** 从目标身上移除一个复合元素反应。 */
  consumeElementalReaction: {
    /** 要移除的元素反应。 */
    reaction: ElementalReaction;
    /** 当前只支持从敌人身上移除。 */
    target: 'enemy';
  };
  /** 报告一次对固定目标成功输出浮空；木桩模型不保存位移、朝向或控制状态。 */
  outputAirborne: {
    /** 接收击飞的对象。 */
    target: CombatTarget;
  };
  /** 报告一次对固定目标成功输出击倒；木桩模型不保存倒地控制状态。 */
  outputKnockDown: {
    /** 接收击倒的对象。 */
    target: CombatTarget;
  };
  /** 造成一次按攻击力或属性计算的伤害。 */
  dealDamage: DealDamageParameters;
  /** 造成一次使用固定基础值的伤害。 */
  dealFixedDamage: DealFixedDamageParameters;
  /** 不伴随生命伤害的独立失衡单元；数值仍会经过来源与目标的失衡倍率。 */
  dealStagger: {
    /** 基础失衡伤害。 */
    value: LevelValues | ActionValueOperand;
    /** DefiniteValueCalculation.applyScale 启用时乘用的倍率。 */
    valueMultiplier?: LevelValues | ActionValueOperand;
    /** 保留原生 PoisePack 的装饰位；当前木桩没有弱点窗口，但不能从数据中丢弃。 */
    features?: readonly DamageFeature[];
  };
  /** 按施法者属性计算，并写入干员生命账本的普通治疗。 */
  heal: HealTargetBinding & {
    /** 原生 Healer=ActionOwner 且动作位于 Buff 生命周期时，治疗来源是 Buff 宿主。 */
    source?: 'buffOwner';
    /** 原生 AbilityAction.alwaysNext；false 时保留治疗应用失败的序列短路。 */
    alwaysNext?: boolean;
    /** 原生 useHealTags 开启时的 GameplayTag 整数身份。 */
    tags: readonly GameplayTag[];
  } & (
      | {
          /** 按原生指定一侧的属性乘区与固定加区计算。 */
          /** 用于计算治疗的属性。 */
          attribute: HealCalculationAttribute;
          /** 省略时读取治疗来源；原生 valueSource=Target 时读取治疗目标。 */
          attributeSource?: 'target';
          /** 属性乘数。 */
          multiplier: LevelValues | ActionValueOperand;
          /** 乘算后加入的固定治疗值。 */
          addition: LevelValues | ActionValueOperand;
          /** 属性公式分支不能同时填写固定治疗值。 */
          amount?: never;
        }
      | {
          /** 原生 DefiniteValueCalculation：直接使用动作值，不读取施法者属性。 */
          /** 直接使用的基础治疗值。 */
          amount: LevelValues | ActionValueOperand;
          /** 固定值分支不能同时填写治疗属性。 */
          attribute?: never;
          /** 固定值分支不能同时填写属性乘数。 */
          multiplier?: never;
          /** 固定值分支不能同时填写固定加值。 */
          addition?: never;
        }
    );
  /** 按目标、来源和黑板赋值创建一个或多个 Buff 实例。 */
  applyBuff: {
    /** 动态身份在执行时从字符串黑板读取；不携带可被误用的字面回退 ID。 */
    buffId:
      | string
      | {
          /** 运行时读取 Buff ID 的动作黑板键。 */
          readonly blackboardKey: string;
        };
    /** 本步骤施加的完整 Buff 蓝图；运行时实例创建后不再被后续同 key 步骤改写。 */
    definition?: SkillBuffDefinition;
    /** 接收 Buff 的单体或队伍目标。 */
    target: BuffApplicationTarget;
    /** 原生 CreateBuffAction 的循环次数；省略时执行一次，正小数按 `int < float` 语义向上取整。 */
    count?: ActionValueOperand;
    /**
     * Buff 的来源实体；省略时沿用当前动作来源。
     * 该字段与接收 Buff 的 `target` 相互独立，只应在原生动作显式改写来源时配置。
     */
    source?: BuffApplicationSource;
    /** 已确定为单一目标的 Context 来源，与 source 互斥；保留查询结果的实例身份。 */
    sourceContextKey?: string;
    /**
     * 原生 Buff 图标的倒计时来源。它只改变可视倒计时，不改变 Buff 自身生命周期；
     * 来源在施加边沿解析成稳定实例身份，同名 TimedMarker 重建不会串线。
     */
    iconDurationSource?:
      /** 使用动作宿主能力实体的剩余寿命。 */
      | {
          /** 图标时长来源判别值。 */
          readonly kind: 'actionOwnerAbilityEntity';
        }
      | {
          /** 使用动作宿主上的一个定时标记。 */
          readonly kind: 'actionOwnerTimedMarker';
          /** 定时标记 ID。 */
          readonly markerId: string;
        };
    /**
     * 在施加时覆盖 Buff 定义黑板的同名默认值。动作操作数从当前动作黑板求值；
     * 等级值在技能或养成初始化程序编译时解析。
     */
    blackboardAssignments?: Readonly<Record<string, LevelValues | ActionValueOperand>>;
    /** 原生字符串输入的字面覆盖；与数值赋值分开，避免把字符串伪装成计算操作数。 */
    stringBlackboardAssignments?: Readonly<Record<string, string>>;
    /**
     * 原生 useDirectValue=false：从当前动作黑板按实际值类型复制到新 Buff。
     * 键是目标 Buff 黑板键，值是当前动作黑板来源键。
     */
    copiedBlackboardAssignments?: Readonly<Record<string, string>>;
    /**
     * 原生 KeywordAction.enhancingList：只附着到本次创建的关键词载体实例，不能改写共享模板。
     * value 在创建边沿从当前动作黑板求值，随后由载体自身监听普通 Buff 的加入边沿。
     */
    keywordEnhancements?: readonly {
      /** 任一加入时触发强化的普通 Buff ID。 */
      triggerBuffIds: readonly string[];
      /** 对关键词值执行赋值、加算或乘算。 */
      operation: 'assign' | 'add' | 'multiply';
      /** 从当前动作黑板或常量读取的运算值。 */
      value: ActionValueOperand;
    }[];
    /** 原生动作要求把当前施法身份复制到新 Buff 时为 true。 */
    inheritSourceSkillCastInfo?: boolean;
    /** 原生 AddBuffContext.isExtra；仅作为 Buff 添加事件事实传播，不自行产生数值效果。 */
    isExtra?: boolean;
    /** 原生区域/动作生命周期结束时，只结束本步骤实际创建的 Buff 实例。 */
    finishByAction?: boolean;
    /**
     * 原生 Aura 离开边沿：先结束本步骤创建的区域 Buff，再在同一批目标上创建有限余效。
     * 只随 finishByAction=true 使用；余效是独立实例，不再归原 Aura 动作托管。
     */
    onActionEndBuffs?: readonly {
      /** 余效 Buff ID。 */
      buffId: string;
      /** 接收余效 Buff 的目标。 */
      target: BuffApplicationTarget;
      /** 余效 Buff 的来源对象。 */
      source?: BuffApplicationSource;
      /** 从当前动作黑板计算并传给余效 Buff 的数值。 */
      blackboardAssignments?: Readonly<Record<string, ActionValueOperand>>;
      /** 直接传给余效 Buff 的字符串值。 */
      stringBlackboardAssignments?: Readonly<Record<string, string>>;
      /** 是否把当前施法身份传给余效 Buff。 */
      inheritSourceSkillCastInfo?: boolean;
    }[];
    /**
     * 当前技能由白名单中的下一原生技能打断时，把本步骤创建的同一 Buff 实例转交给下一技能；
     * 不刷新层数、持续时间、来源或黑板。当前只与 finishByAction=true 的原生组合一起使用。
     */
    inheritToNextSkillIds?: readonly string[];
    /** 原生 asChildBuff：当前动作由 Buff 持有时，父 Buff 结束会同步结束该实例。 */
    asChildBuff?: boolean;
    /** CreateBuffAttachingSkill：绑定事件当前技能而非动作 owner 的寿命。 */
    lifetimeOwner?: 'currentCastSkill';
    /** 覆盖本次 Buff 实例持续时间的秒数。 */
    durationSeconds?: number;
    /** 覆盖本次 Buff 实例效果系数。 */
    effectiveness?: number;
  };
  /** 创建一个独立的战斗级 GlobalBuff 实例，并把其子 Buff 投影到当前固定队伍。 */
  createGlobalBuff: {
    /** 全局 Buff ID。 */
    globalBuffId: string;
    /** 全局 Buff 的完整定义。 */
    definition: SkillGlobalBuffDefinition;
    /** 本步骤重复创建实例的次数。 */
    count?: ActionValueOperand;
    /** GodEntity 持有的原生全局实例保留 battle 来源，不伪装成某名干员。 */
    source?: BuffApplicationSource | 'battle';
    /** 覆盖全局 Buff 初始黑板的数值。 */
    blackboardAssignments?: Readonly<Record<string, ActionValueOperand>>;
    /** 所在动作结束时只清理本步骤创建的 GlobalBuff 实例。 */
    finishByAction?: boolean;
  };
  /** 只结束当前子 Buff 精确关联的那个父 GlobalBuff 实例。 */
  finishParentGlobalBuff: {
    /** 记录到结束事件中的原因。 */
    reason: 'early' | 'other';
  };
  /** 按原生 GlobalBuffId 结束当前战斗中所有同名父实例。 */
  finishGlobalBuffsById: {
    /** 要结束的全局 Buff ID。 */
    globalBuffIds: readonly string[];
    /** 记录到结束事件中的原因。 */
    reason: 'early' | 'other';
  };
  /** 从版本化 SkillSetting 的四列值按运行时列号读取，并写入当前动作黑板。 */
  readSkillSettingData: {
    /** 按顺序读取并写入动作黑板的数据项。 */
    items: readonly {
      /** SkillSetting 中固定四列数值。 */
      values: readonly number[];
      /** 从 1 开始的列号。 */
      column: ActionValueOperand;
      /** 保存结果的动作黑板键。 */
      storeKey: string;
      /** 根据目标对象的强化层数进一步修正读取结果。 */
      enhance?: {
        /** 读取强化层数的对象。 */
        target: 'caster' | 'buffOwner' | 'buffSource';
        /** 按层数应用的线性或饱和公式。 */
        formula:
          | {
              /** 每层按固定系数线性增加。 */
              readonly kind: 'linear';
              /** 线性公式系数。 */
              readonly paramA: number;
            }
          | {
              /** 增幅随层数逐渐趋近上限。 */
              readonly kind: 'saturating';
              /** 饱和公式的强度系数。 */
              readonly paramA: number;
              /** 饱和公式的衰减系数。 */
              readonly paramB: number;
            };
      };
    }[];
  };
  /** 按原生 ID 或标签查询目标的首个有效 Buff，并把其数值黑板写入当前动作黑板。 */
  readBuffBlackboard: {
    /** 要查找 Buff 的对象。 */
    target: BuffSingleTarget;
    /** 按 ID 或标签选择 Buff。 */
    query:
      | {
          /** 按 Buff ID 查找。 */
          kind: 'id';
          /** 任一匹配即可选中的 Buff ID。 */
          buffIds: readonly string[];
        }
      | {
          /** 按 Buff 标签查找。 */
          kind: 'tag';
          /** 标签集合匹配方式。 */
          tagQueryType: GameplayTagQueryType;
          /** 参与匹配的 Buff 标签。 */
          buffTags: readonly GameplayTag[];
        };
    /** 从目标 Buff 黑板读取的键。 */
    desiredKey: string;
    /** 保存到当前动作黑板的键。 */
    outputKey: string;
  };
  /** 原生 Target + Context 查询：先要求动作输入目标存在，再读取事件 Buff 的实时黑板。 */
  readEventBuffBlackboard: {
    /** 从事件 Buff 黑板读取的键。 */
    desiredKey: string;
    /** 保存到当前动作黑板的键。 */
    outputKey: string;
  };
  /** 把当前生命周期环境中有限时长 Buff 的剩余秒数写入动作黑板；无限时长写入 0。 */
  readCurrentBuffRemainingDuration: {
    /** 保存剩余秒数的动作黑板键。 */
    outputKey: string;
  };
  /** 按 ID 读取目标首个有效 Buff 的剩余秒数；无限时长写入 0。 */
  readBuffRemainingDuration: {
    /** 要查找 Buff 的对象。 */
    target: BuffSingleTarget;
    /** 任一匹配即可选中的 Buff ID。 */
    buffIds: readonly string[];
    /** 保存剩余秒数的动作黑板键。 */
    outputKey: string;
  };
  /** 直接修改当前生命周期环境中有限时长 Buff 的剩余秒数。 */
  setCurrentBuffRemainingDuration: {
    /** 对当前剩余时间执行赋值、加算或乘算。 */
    operation: 'assign' | 'add' | 'multiply';
    /** 参与运算的秒数或倍率。 */
    value: ActionValueOperand;
  };
  /** 按当前 Buff 黑板重新解析并替换已注册的属性修正值。 */
  refreshCurrentBuffAttributeModifiers: Record<string, never>;
  /** 记录当前处理技能的附着编号并监听其直接结束；不改变 Buff 普通来源。尚不包含派生对象引用延寿。 */
  skillAffix: Record<string, never>;
  /** 查询匹配 Buff 的累计强化层数或实例数，并写入当前技能实例的动作黑板。 */
  readBuffStackCount: {
    /** 要统计 Buff 的对象。 */
    target: BuffSingleTarget;
    /** 保存统计结果的动作黑板键。 */
    outputKey: string;
    /** 按 ID、当前生命周期环境或标签选择 Buff。 */
    query:
      | {
          /** 按 Buff ID 统计。 */
          kind: 'id';
          /** 任一匹配即可计入的 Buff ID。 */
          buffIds: readonly string[];
        }
      | {
          /** 统计当前正在执行生命周期动作的 Buff。 */
          kind: 'environment';
        }
      | {
          /** 按 Buff 标签统计。 */
          kind: 'tag';
          /** 标签集合匹配方式。 */
          tagQueryType: GameplayTagQueryType;
          /** 参与匹配的 Buff 标签。 */
          buffTags: readonly GameplayTag[];
        };
    /** 是否只统计与当前来源属于同一次技能施放的实例。 */
    sameSourceSkillCast?: boolean;
    /** 缺省保持历史的累计强化层数；原生 BuffCount 必须显式使用 instance。 */
    countType?: 'enhance' | 'instance';
  };
  /** 按原生标签查询结束目标身上的匹配 Buff；count 缺省时结束全部。 */
  finishBuffsByTag: {
    /** 要结束 Buff 的对象。 */
    target: BuffTagFinishTarget;
    /** 标签集合匹配方式。 */
    tagQueryType: GameplayTagQueryType;
    /** 用于查找 Buff 的标签。 */
    buffTags: readonly GameplayTag[];
    /** 记录到结束事件中的原因。 */
    reason: 'early' | 'absorbed' | 'other';
    /** 最多结束的实例数；省略时结束全部匹配项。 */
    count?: ActionValueOperand;
  };
  /** 按 Buff 定义身份结束目标身上的匹配实例；count 缺省时结束全部。 */
  finishBuffsById: {
    /** 要结束 Buff 的单体或队伍目标。 */
    target: BuffApplicationTarget;
    /** 任一匹配即可选中的 Buff ID。 */
    buffIds: readonly string[];
    /** 记录到结束事件中的原因。 */
    reason: 'early' | 'absorbed' | 'other';
    /** 最多结束的实例数；省略时结束全部匹配项。 */
    count?: ActionValueOperand;
  };
  /** 结束当前正在执行生命周期或事件响应的 Buff 实例。 */
  finishCurrentBuff: {
    /** 记录到结束事件中的原因。 */
    reason: 'early' | 'absorbed' | 'other';
    /** 原生 FinishSource；不使用事件来源替代动作来源。 */
    finishSource: 'actionSource' | 'actionOwner';
  };
  /** 设置当前正在执行事件响应的 Buff 实例是否暂停计时。 */
  setCurrentBuffTimePaused: {
    /** `true` 暂停，`false` 恢复。 */
    paused: boolean;
  };
  /** 以原生点燃类型同步触发目标身上所有匹配响应；来源与接收目标保持独立。 */
  igniteBuffs: {
    /** 要查找点燃响应的对象。 */
    target: BuffSingleTarget;
    /** 点燃事件记录的来源对象。 */
    source: BuffSingleTarget | 'currentBuffSource';
    /** 与 Buff 点燃响应匹配的类型名称。 */
    igniteType: string;
  };
  /** 按原生技能筛选立即修改当前冷却；比例基数是配置的基础冷却时长，绝对值单位为秒。 */
  adjustSkillCooldown: {
    /** 当前只修改施法者技能。 */
    target: 'caster';
    /** 按技能类型或原生技能 ID 选择技能。 */
    skill:
      | {
          /** 按技能分类选择。 */
          readonly kind: 'type';
          /** 目标技能分类。 */
          readonly skillType: SkillType;
        }
      | {
          /** 按原生技能 ID 选择。 */
          readonly kind: 'id';
          /** 目标技能 ID。 */
          readonly skillId: string;
        };
    /** 减少当前冷却或直接设置剩余冷却。 */
    operation: 'reduce' | 'set';
    /** 数值按基础冷却比例还是绝对秒数解释。 */
    basis: 'baseDurationRatio' | 'absoluteSeconds';
    /** 要减少或设置的比例或秒数。 */
    value: ActionValueOperand;
  };
  /** 在当前调度区间存续期间禁止施法者身上已匹配的 Buff 结束。 */
  holdBuffsById: {
    /** 当前只保持施法者身上的 Buff。 */
    target: 'caster';
    /** 要阻止结束的 Buff ID。 */
    buffIds: readonly string[];
  };
  /**
   * 从当前技能的结束清理集合摘下目标身上的首个同 ID Buff，并在技能转场时转交同一实例。
   * 该步骤不创建、刷新或复制 Buff；白名单使用原生 Skill ID。
   */
  inheritBuffById: {
    /** 当前只从施法者身上转交 Buff。 */
    target: 'caster';
    /** 要转交的 Buff ID。 */
    buffId: string;
    /** 可以接收此 Buff 的下一技能原生 ID。 */
    inheritToNextSkillIds: readonly string[];
    /** 此 Buff 原本是否由当前动作托管寿命。 */
    finishByAction: boolean;
    /** 没有成功转交时是否随下一技能结束。 */
    finishWithNextSkillIfNotInherited: boolean;
  };
  /** 在动作存续期间只允许带指定标签的正向终结技能量回复；多个实例按原生语义取并集。 */
  restrictUltimateEnergyRecovery: {
    /** 当前只限制施法者的回能。 */
    target: 'caster';
    /** 允许通过的终结技能量回复标签。 */
    allowedRecoveryTags: readonly GameplayTag[];
    /** 动作结束时是否清空终结技能量。 */
    clearUltimateEnergyOnEnd: boolean;
  };
  /** 设置角色的战斗级冷却：同角色/ID 刷新剩余秒数，不受角色时间膨胀或动作结束影响。 */
  setGlobalCooldown: {
    /** 冷却所属的角色身份。 */
    target: GlobalCooldownTarget;
    /** 冷却标记 ID。 */
    markerId: string;
    /** 冷却持续秒数。 */
    durationSeconds: ActionValueOperand;
  };
  /** 在目标能力系统上创建定时标记；同 ID 标记不会互相覆盖。 */
  createTimedMarker: {
    /** 标记所属对象。 */
    target: TimedMarkerTarget;
    /** 标记 ID。 */
    markerId: ActionStringOperand;
    /** 标记持续秒数。 */
    durationSeconds: ActionValueOperand;
    /** 是否随当前动作结束。 */
    autoFinishByAction: boolean;
    /** 原生 useTimeDilationDt=true 时使用全局 allScaledDeltaTime；缺省使用普通帧时钟。 */
    timeDomain?: 'globalScaled';
  };
  /** 在当前能力实体上创建定时标记；每个标记显式选择共享战斗或实体自身时钟。 */
  createAbilityEntityTimedMarker: {
    /** 标记 ID。 */
    markerId: ActionStringOperand;
    /** 标记持续秒数。 */
    durationSeconds: ActionValueOperand;
    /** 是否随当前动作结束。 */
    autoFinishByAction: boolean;
    /** 使用全局时钟还是能力实体自身时钟。 */
    timeDomain: 'global' | 'self';
  };
  /** 创建普通全局或实体时间膨胀实例；终结技专用时间动作另行建模。 */
  startTimeDilation:
    | {
        /** 对整场战斗的全局时钟生效。 */
        scope: 'global';
        /** 时间膨胀持续秒数。 */
        durationSeconds: ActionValueOperand;
        /** 参与同类实例覆盖判断的 GameplayTag 槽。 */
        slot: GameplayTag;
        /** 同槽实例竞争时的优先级。 */
        priority: number;
        /** 随经过时间采样的倍率曲线。 */
        curve: TimeScaleCurveDefinition;
        /** 是否随当前动作结束。 */
        finishByAction: boolean;
        /** 不受此次全局倍率影响的角色目标。 */
        ignoredTargets: readonly TimeDilationIgnoreTarget[];
        /** 不受此次全局倍率影响的能力实体。 */
        ignoredAbilityEntityTargets?: readonly AbilityEntityTargetQuery[];
        /** 时间膨胀期间额外影响的技能冷却秒数。 */
        influenceSkillCooldownSeconds?: ActionValueOperand;
      }
    | {
        /** 只对选定实体的自身时钟生效。 */
        scope: 'entity';
        /** 时间膨胀持续秒数。 */
        durationSeconds: ActionValueOperand;
        /** 参与同类实例覆盖判断的 GameplayTag 槽。 */
        slot: GameplayTag;
        /** 同槽实例竞争时的优先级。 */
        priority: number;
        /** 随经过时间采样的倍率曲线。 */
        curve: TimeScaleCurveDefinition;
        /** 是否随当前动作结束。 */
        finishByAction: boolean;
        /** 要影响的角色目标。 */
        targets: readonly TimeDilationEntityTarget[];
        /** 要影响的能力实体。 */
        abilityEntityTargets?: readonly AbilityEntityTargetQuery[];
        /** 是否跳过同槽优先级检查并直接应用。 */
        ignoreSlotCheck?: boolean;
      };
  /** 终结技专用恒定全局时间倍率；实例随承载动作结束，施法者自动忽略。 */
  startUltimateTimeDilation: {
    /** 与其他终结技时间膨胀竞争时的优先级。 */
    priority: number;
    /** 固定全局时间倍率。 */
    targetScale: ActionValueOperand;
    /** 除施法者外还要排除的角色目标。 */
    ignoredTargets: readonly TimeDilationIgnoreTarget[];
    /** 不受此次倍率影响的能力实体。 */
    ignoredAbilityEntityTargets?: readonly AbilityEntityTargetQuery[];
  };
  /** 原生 HideUIAction；区间生命周期独立于时间膨胀，不代表全部操作不可用。 */
  hideUi: {
    /** `true` 时只屏蔽输入，不隐藏界面。 */
    onlyBlockInput: boolean;
  };
  /** 在动作区间内切换目标能力实体是否忽略全局时间倍率。 */
  setIgnoreGlobalTimeScale: {
    /** 要修改的能力实体。 */
    abilityEntityTargets: readonly AbilityEntityTargetQuery[];
    /** `true` 忽略全局倍率，`false` 恢复接受全局倍率。 */
    ignore: boolean;
    /** 当前动作结束时是否还原原值。 */
    revertOnEnd: boolean;
  };
  /** 修改当前技能实例的动作黑板；不得用于跨技能持久状态。 */
  storeCurrentTimelineFrame: {
    /** 把 Owner AbilitySystem 当前技能的局部整数执行帧写入动作黑板。 */
    outputKey: string;
  };
  /** 读取当前 spGained 语义事件，分别保存原生 Value 与 RealDelta。 */
  storeEventSpGainAmount: {
    /** 效率结算后、共享技力上限截断前的 OnObtainAtb.Value。 */
    outputKey?: string;
    /** 共享技力实际变化量 OnObtainAtb.RealDelta。 */
    realDeltaOutputKey?: string;
  };
  /** 从当前成功治疗事件保存修正后请求值和生命账本实际变化值。 */
  storeEventHealValues: {
    /** 保存修正后请求治疗值的动作黑板键。 */
    finalHealOutputKey?: string;
    /** 保存生命账本实际增加值的动作黑板键。 */
    realHealOutputKey?: string;
  };
  /** 先解析目标；新增值读取147事件，当前值读取目标实时有限护盾。缺目标/事件成功不写。 */
  storeShieldValue: {
    /** 当前只读取动作所有者身上的护盾。 */
    target: 'actionOwner';
    /** 读取本次新增护盾值或当前剩余护盾值。 */
    value: 'gained' | 'current';
    /** 保存结果的动作黑板键。 */
    outputKey: string;
  };
  /** 修改当前动作黑板中的一个数值。 */
  modifyActionValue: {
    /** 要修改的动作黑板键。 */
    key: string;
    /** 对旧值执行的运算。 */
    operation: ActionValueOperation;
    /** 运算输入值。 */
    value: ActionValueOperand;
  };
  /** 计算两个动作黑板操作数，并将单精度结果写入当前技能实例。 */
  calculateActionValue: {
    /** 保存结果的动作黑板键。 */
    key: string;
    /** 对左右值执行的运算。 */
    operation: ActionValueCalculationOperation;
    /** 左操作数。 */
    left: ActionValueOperand;
    /** 右操作数。 */
    right: ActionValueOperand;
  };
  /** 按原生 StoreAttributeValue 语义读取动作来源实体的动态非转化属性。 */
  storeSourceAttributeValue: {
    /** 读取指定属性、主属性、副属性或全部四维。 */
    attribute:
      | {
          /** 读取指定名称的属性。 */
          kind: 'specific';
          /** 原生属性名称。 */
          key: string;
        }
      | {
          /** 读取来源对象的主属性、副属性或全部四维。 */
          kind: 'main' | 'secondary' | 'all';
        };
    /** 读取装备后阶段还是最终阶段的非换算属性。 */
    stage: 'armedNonConverted' | 'finalNonConverted';
    /** 是否先对属性值向下取整。 */
    useFloor: boolean;
    /** 属性值先除以此数。 */
    divisor: ActionValueOperand;
    /** 除法后乘以此数。 */
    multiplier: ActionValueOperand;
    /** 最后加入的基础值。 */
    base: ActionValueOperand;
    /** 保存结果的动作黑板键。 */
    targetKey: string;
  };
  /** 按原生 StoreEntityProperty 读取当前动作所有者的战斗生命/失衡账本。 */
  storeEntityPropertyValue: {
    /** 当前只读取动作所有者。 */
    target: 'actionOwner';
    /** 要读取的生命或失衡账本字段。 */
    property: 'currentHealth' | 'maxHealth' | 'currentPoise';
    /** 是否先对读取值向下取整。 */
    useFloor: boolean;
    /** 读取值先除以此数。 */
    divisor: ActionValueOperand;
    /** 除法后乘以此数。 */
    multiplier: ActionValueOperand;
    /** 最后加入的基础值。 */
    base: ActionValueOperand;
    /** 保存结果的动作黑板键。 */
    targetKey: string;
  };
  /** 在动作寿命内为当前动作所有者注册生命下限；动作结束时移除同一原生句柄。 */
  setHealthFloor: {
    /** 当前只为动作所有者设置生命下限。 */
    target: 'actionOwner';
    /** 使用绝对生命值或最大生命比例。 */
    mode: 'absolute' | 'maxHealthRatio';
    /** 生命下限数值或比例。 */
    value: ActionValueOperand;
  };
  /** 按技能或养成等级解析固定数值后增减战斗资源。 */
  changeResource: {
    /** 要增减的资源。 */
    resource: CombatResource;
    /** 正数增加、负数减少的资源量。 */
    amount: LevelValues;
    /** 原生 ObtainCostAction 在资源效率链之前乘到 amount 上；省略时为 1。 */
    coefficient?: LevelValues;
    /** 资源作用于施法者还是全队。 */
    recipient: ResourceRecipient;
    /** 仅对正向技力变化有效；省略时按普通获得处理。 */
    spGainKind?: SpGainKind;
    /** 正向技力变化来自普攻、重击、技能或默认来源。 */
    spGainSource?: SpGainSource;
    /** 终结技能量专用：按最大能量的比例解释倍率链结果。 */
    isPercentValue?: boolean;
    /** 终结技能量专用：正向回复携带的许可标签。 */
    ultimateRecoveryTag?: GameplayTag;
    /** 终结技能量专用：跳过目标自身的回能效率。 */
    ignoreUltimateEnergyGainMultiplier?: boolean;
  };
  /** 执行时从当前技能动作黑板读取数值，再交给同一资源账本处理。 */
  changeResourceByActionValue: {
    /** 要增减的资源。 */
    resource: CombatResource;
    /** 从动作黑板或常量读取的资源量。 */
    amount: ActionValueOperand;
    /** 原生 ObtainCostAction 在资源效率链之前乘到动态 amount 上；省略时为 1。 */
    coefficient?: LevelValues | ActionValueOperand;
    /** 资源作用于施法者还是全队。 */
    recipient: ResourceRecipient;
    /** 正向技力变化是正常获得还是返还。 */
    spGainKind?: SpGainKind;
    /** 正向技力变化的动作来源。 */
    spGainSource?: SpGainSource;
    /** 是否把终结技能量数值解释为最大能量比例。 */
    isPercentValue?: boolean;
    /** 正向终结技能量回复携带的许可标签。 */
    ultimateRecoveryTag?: GameplayTag;
    /** 是否跳过目标自身的终结技能量获取倍率。 */
    ignoreUltimateEnergyGainMultiplier?: boolean;
  };
  /** 返还 PlayerController 持有的全队共享闪避体力。 */
  recoverDashEnergy: {
    /** 返还的闪避份数；原生极限闪避公共监听器当前配置为 0.5。 */
    amount: ActionValueOperand;
    /** 已进入透支时，是否允许本次返还同时解除透支。 */
    canRecoverWhenOverdraft: boolean;
  };
  /** 记录一次极限闪避成功，并发布原生 OnPerfectDodge 能力事件。 */
  recordPerfectDodge: Record<string, never>;
  /** 按本次技能费用为全队生成终结技能量。 */
  gainSquadUltimateEnergyFromSkillCost: {
    /** 技能费用换算为全队终结技能量的系数。 */
    coefficient: LevelValues;
  };
  /** 按固定系数为全队生成处决技力。 */
  gainFinisherSp: {
    /** 处决技力获取系数。 */
    factor: number;
    /** 处决技力固定发给全队。 */
    recipient: 'team';
  };
  /** 创建或增加一个兼容的语义战斗状态。 */
  applyStatus: {
    /** 状态 ID。 */
    statusKey: string;
    /** 状态所属对象。 */
    target: CombatTarget;
    /** 状态持续帧数；省略时不按时间结束。 */
    durationFrames?: LevelValues;
    /** 本次增加的层数；省略时为一层。 */
    stacks?: number;
    /** 状态允许达到的最大层数。 */
    maxStacks?: number;
    /** 每层状态提供的修正。 */
    modifiers?: readonly StatusModifierDefinition[];
  };
  /** 从一个语义战斗状态中消费层数。 */
  consumeStatus: {
    /** 状态 ID。 */
    statusKey: string;
    /** 状态所属对象。 */
    target: CombatTarget;
    /** 消费层数；省略时结束整个状态。 */
    stacks?: number;
  };
  /** 在所在调度区间内持续检查条件，首次通过时把宿主局部时间轴推进到目的帧。 */
  jumpTimeline: {
    /** 条件成立时跳到的宿主局部帧。 */
    destinationFrame: number;
    /** 跳转条件；省略时立即跳转。 */
    condition?: CombatCondition;
  };
  /** 立即结束当前宿主技能时间轴；只承接原生 InterruptCurSkillAction。 */
  finishTimeline: Record<string, never>;
  /**
   * 原生 AllowNextSkillAction 到达当前有序连段的下一技能窗口。
   * 生成器保留此事实，使条件分支实际执行时决定技能块边界。
   */
  reachSkillOperableBoundary: {
    /** 此窗口允许接续的原生 Skill ID。 */
    skillIds: readonly string[];
  };
  /** 把当前技能的本次施放标为可由 Dash 输入打断。 */
  markCurrentSkillCanDash: Record<string, never>;
  /** 按条件选择真假分支。 */
  conditional: {
    /** 决定执行哪个分支的条件。 */
    condition: CombatCondition;
    /** 原生条件动作通过时无论分支结果如何都允许外层序列继续。 */
    alwaysNext?: boolean;
  };
  /** 原生 Switch：choice 求值一次，与各候选按 float32 差值容差 1e-5f 顺序匹配。 */
  switch: {
    /** 只求值一次的候选匹配值。 */
    choice: ActionValueOperand;
    /** 只覆盖本步骤的返回值，不取消选中序列内部的短路；无匹配时直接返回此值。 */
    alwaysNext: boolean;
  };
  /** 同一个技能释放实例内共享的只执行一次作用域。 */
  once: {
    /** 标识共享一次性状态的作用域键。 */
    scopeKey: string;
  };
  /** 在一次原生子 SkillData 调用的 direct blackboard 中执行 body。 */
  withActionBlackboardScope: {
    /** 子动作黑板作用域名称。 */
    scopeKey: string;
    /** 默认在同一父黑板内复用；execution 用于每次发射等独立实例，不跨循环项共享。 */
    lifetime?: 'parent' | 'execution';
    /** 回调边界忽略局部序列的短路结果，不阻止后续独立回调。 */
    alwaysNext?: boolean;
    /**
     * 原生同一 Buff 实例上的并列回调共享 Buff direct blackboard；仅隔离返回值控制流。
     * 启用时 initialValues 必须为空、inheritParent 必须为 true，且不得声明实体黑板初值或赋值。
     */
    shareParentBlackboard?: boolean;
    /** 子动作黑板的初始值。 */
    initialValues: Readonly<Record<string, LevelValues>>;
    /** 原生 assignBlackboard：调用时把父 direct blackboard 覆盖到子初值之上。 */
    inheritParent: boolean;
    /** 投射物等独立逻辑宿主在模板中声明的实体黑板；省略时继续共享父宿主实体层。 */
    entityInitialValues?: Readonly<Record<string, LevelValues>>;
    /** 创建独立宿主时从父动作黑板求值，并覆盖模板实体黑板初值。 */
    entityAssignments?: Readonly<Record<string, ActionValueOperand>>;
  };
  /** 在承载调度区间内逐 Tick 驱动 body；可保留原生 Channeling 的扫描与单目标门槛。 */
  repeatEachTick: {
    /** 原生 Channeling 动作的逐帧和按目标重复设置。 */
    nativeChanneling?: {
      /** 是否每个模拟帧执行。 */
      executeEachFrame: boolean;
      /** 整体触发间隔秒数。 */
      triggerIntervalSeconds: number;
      /** 每个目标最多触发次数。 */
      maxCountPerTarget: number;
      /** 同一目标再次触发前等待的秒数。 */
      targetTriggerIntervalSeconds: number;
    };
    /** 1.4.4 TickIntervalAction：首次即时执行，之后按单精度累计周期推进。 */
    nativeTickInterval?: {
      /** 是否每个模拟帧执行。 */
      executeEachFrame: boolean;
      /** 两次触发之间的秒数。 */
      intervalSeconds: number;
    };
  };
  /** 按动作黑板或常量次数同步执行独立 body；每次都创建新的子步骤实例。 */
  repeatByActionValue: {
    /** 同步执行子序列的次数。 */
    count: ActionValueOperand;
  };
  /** 无启用回调、已证明同点到达的发射；仍保留发射与 reset 引用，不创建技能。 */
  launchProjectileLifetime: {
    /** 投射物到达目标或超时的结束规则。 */
    finish:
      | 'firstTickReach'
      | {
          /** 经过多少次更新后视为到达。 */
          reachAfterTicks: number;
          /** 即使未到达也会结束的最长秒数。 */
          maxDurationSeconds: number;
        };
    /** 结束后延迟回收对象的秒数。 */
    recycleDelaySeconds?: number;
  };
  /**
   * 原生 ProjectileComponent 的正数 finishDuration 到期回调。
   * 注册发生在发射动作实际执行时，且回调寿命独立于发射技能；不得用于普通技能延迟动作。
   */
  scheduleProjectileFinishCallback: {
    /** 发射后等待多少秒触发结束回调。 */
    delaySeconds: number;
    /** 原生所有启用回调的 SkillData.duration 最大值；与结束倒计时相互独立。 */
    recycleDelaySeconds: number;
  };
  /** 在动作环境中设置一个标志。 */
  setContextFlag: {
    /** 标志名称。 */
    flag: string;
    /** 标志值。 */
    value: boolean | number | string;
    /** 当前只在施法者动作环境中设置。 */
    target: 'caster';
  };
  /** 为当前干员开启固定五秒的连携候选；下一段技能身份随候选进入场景级队列。 */
  openComboWindow:
    | {
        /** 候选中直接保存的下一技能键。 */
        nextSkillKey: string;
      }
    /** TriggerComboSkillAction 读取 owner 当前 ComboSkill 槽，不携带静态技能 ID。 */
    | {
        /** 运行时从当前连携技能槽取得下一技能。 */
        nextSkillKeyFromSlot: 'comboSkill';
        /** 原生 owner 为 Context 时取该组首个角色；省略时为当前执行干员。 */
        ownerContextKey?: string;
      };
  /** 原生 ShowComboRingQte：在当前连携剩余时间上登记提示段与有效输入段。 */
  showComboRingQte: {
    /** 提示出现但尚不可输入的秒数。 */
    earlyDurationSeconds: ActionValueOperand;
    /** 可以成功触发连携的秒数。 */
    activeDurationSeconds: ActionValueOperand;
  };
  /** 切换稳定技能组后续释放所使用的技能形态；当前已启动的释放不受影响。 */
  changeSkillSlot: {
    /** 要修改的技能组或稳定槽位键。 */
    skillGroupKey: string;
    /** 换入的技能键。 */
    targetSkillKey: string;
    /** 原生 ChangeSkillAction 在切换前把当前形态的归一化冷却进度传给目标形态。 */
    inheritOriginSkillCooldownProgress?: boolean;
    /** 省略时为旧的显式一次换槽；原生 ChangeSkillAction 必须声明句柄寿命。 */
    lifetime?: 'infinite' | 'finishByAction';
    /** 原生指定还原技能；省略时由运行时快照替换前槽位。 */
    revertedSkillKey?: string;
  };
  /** Buff 动作有效期间覆盖普攻命令；结束时只移除本次注册。 */
  overrideBasicAttackMapping: {
    /** Buff 有效期内普通攻击操作请求的原生技能 ID。 */
    skillId: string;
  };
  /** 动作有效期间覆盖当前干员可连续执行的 Dash 次数；负数表示无限。 */
  overrideMultiDashLimit: {
    /** 原生 OverrideMultiDashLimit 的 dashCount，可读取动作黑板。 */
    dashCount: ActionValueOperand;
  };
  /** SwitchModeAction：只改变后续玩家操作的原生路由，结束时恢复同层上一模式。 */
  changePlayerActionMode: {
    /** 要启用的模式 ID。 */
    modeId: string;
    /** 当前只支持随动作结束而恢复的模式切换。 */
    lifetime: 'finishByAction';
  };
  /** ChangeSkillType：原地改写既有技能实例的原生分类，不替换技能槽。 */
  changeNativeSkillType: {
    /** 要修改的技能键。 */
    targetSkillKey: string;
    /** 新的原生技能类型。 */
    nativeSkillType: import('./skills.ts').NativeSkillType;
  };
  /** 原生 NotifyCharPassiveUIAction：更新角色专属 HUD 数值，不修改伤害状态。 */
  setCharacterPassiveUiValue: {
    /** 要更新专属 HUD 的对象。 */
    target: CombatTarget;
    /** 写入 HUD 的数值。 */
    value: ActionValueOperand;
  };
  /** Buff 有效期内把其来源施法身份注册为后续普通攻击的施法身份。 */
  inheritSkillCastInfoForBasicAttack: Record<string, never>;
  /**
   * 在所在调度项的有效区间内监听战斗事件。
   * 调度项开始时注册，结束或技能中断时注销；响应序列在事件派发过程中同步执行。
   */
  listenForCombatEvents: {
    /** 当前区间内注册的事件响应。 */
    responses: readonly CombatEventResponseDefinition[];
  };
}

/** `CombatStepParameters` 中全部动作种类，供编译、校验和运行时分派使用。 */
export const COMBAT_STEP_KINDS = [
  'mergeContextTargets',
  'findCharacterTeamTargets',
  'createSpatialPointTargets',
  'findOwnerSpawnedAbilityEntities',
  'pickContextTarget',
  'forEachContextTarget',
  'readAbilityEntityRemainingDuration',
  'setAbilityEntityRemainingDuration',
  'finishCurrentAbilityEntity',
  'finishActionOwnerAbilityEntity',
  'finishCurrentAbilityEntityWhenSourceDies',
  'startCurrentAbilityEntityChildSkill',
  'startCurrentAbilityEntityChildSkillById',
  'spawnAbilityEntity',
  'applyElementalInfliction',
  'triggerSpellBurst',
  'triggerCustomAbilityEvent',
  'castSkillDuringAction',
  'applyPhysicalInfliction',
  'applyKnockDown',
  'applyElementalReaction',
  'consumeElementalReaction',
  'outputAirborne',
  'outputKnockDown',
  'dealDamage',
  'dealFixedDamage',
  'dealStagger',
  'heal',
  'applyBuff',
  'createGlobalBuff',
  'finishParentGlobalBuff',
  'finishGlobalBuffsById',
  'readSkillSettingData',
  'readBuffBlackboard',
  'readEventBuffBlackboard',
  'readCurrentBuffRemainingDuration',
  'readBuffRemainingDuration',
  'setCurrentBuffRemainingDuration',
  'refreshCurrentBuffAttributeModifiers',
  'skillAffix',
  'readBuffStackCount',
  'finishBuffsByTag',
  'finishBuffsById',
  'finishCurrentBuff',
  'setCurrentBuffTimePaused',
  'igniteBuffs',
  'adjustSkillCooldown',
  'holdBuffsById',
  'inheritBuffById',
  'restrictUltimateEnergyRecovery',
  'createTimedMarker',
  'setGlobalCooldown',
  'createAbilityEntityTimedMarker',
  'startTimeDilation',
  'startUltimateTimeDilation',
  'hideUi',
  'setIgnoreGlobalTimeScale',
  'storeCurrentTimelineFrame',
  'storeEventSpGainAmount',
  'storeEventHealValues',
  'storeShieldValue',
  'modifyActionValue',
  'calculateActionValue',
  'storeSourceAttributeValue',
  'storeEntityPropertyValue',
  'setHealthFloor',
  'changeResource',
  'changeResourceByActionValue',
  'recoverDashEnergy',
  'recordPerfectDodge',
  'gainSquadUltimateEnergyFromSkillCost',
  'gainFinisherSp',
  'applyStatus',
  'consumeStatus',
  'jumpTimeline',
  'finishTimeline',
  'reachSkillOperableBoundary',
  'markCurrentSkillCanDash',
  'conditional',
  'switch',
  'once',
  'withActionBlackboardScope',
  'repeatEachTick',
  'repeatByActionValue',
  'scheduleProjectileFinishCallback',
  'launchProjectileLifetime',
  'setContextFlag',
  'openComboWindow',
  'showComboRingQte',
  'changeSkillSlot',
  'overrideBasicAttackMapping',
  'overrideMultiDashLimit',
  'changePlayerActionMode',
  'changeNativeSkillType',
  'setCharacterPassiveUiValue',
  'inheritSkillCastInfoForBasicAttack',
  'listenForCombatEvents',
] as const satisfies readonly (keyof CombatStepParameters)[];

/** 步骤按 kind 区分类型，编译和执行靠它精确分支。 */
export type CombatStepKind = (typeof COMBAT_STEP_KINDS)[number];

/** 单个动作步骤的公共字段，以及少数流程动作额外携带的子序列。 */
type CombatStepNode<K extends CombatStepKind> = {
  /** 仅当其他定义需要引用此步骤时提供。 */
  key?: string;
  /** 选择参数结构和执行器的动作种类。 */
  kind: K;
  /** 此动作种类对应的参数。 */
  parameters: Readonly<CombatStepParameters[K]>;
} & (K extends 'conditional'
  ? {
      /** 条件成立时执行。 */
      whenTrue: ActionSequenceDefinition;
      /** 条件不成立时执行；省略时不执行额外步骤。 */
      whenFalse?: ActionSequenceDefinition;
    }
  : K extends 'switch'
    ? {
        /** 按顺序尝试匹配的候选分支。 */
        options: readonly ActionSwitchOptionDefinition[];
      }
    : K extends 'once'
      ? {
          /** 在此一次性作用域中执行的子序列。 */
          body: ActionSequenceDefinition;
        }
      : K extends 'withActionBlackboardScope'
        ? {
            /** 在子动作黑板中执行的序列。 */
            body: ActionSequenceDefinition;
          }
        : K extends 'repeatEachTick'
          ? {
              /** 每次触发时执行的序列。 */
              body: ActionSequenceDefinition;
            }
          : K extends 'repeatByActionValue'
            ? {
                /** 每次循环执行的序列。 */
                body: ActionSequenceDefinition;
              }
            : K extends 'scheduleProjectileFinishCallback'
              ? {
                  /** 到时启动的投射物回调技能。 */
                  callback: ProjectileCallbackSkillDefinition;
                }
              : K extends 'forEachContextTarget'
                ? {
                    /** 对每个目标执行的序列。 */
                    body: ActionSequenceDefinition;
                  }
                : {});

/** 干员定义中可执行、按 `kind` 精确区分的一项步骤。 */
export type CombatStepDefinition = CombatStepForKind<CombatStepKind>;

/** 指定一个或多个 `kind` 后，保持动作种类、参数和子序列字段对应的步骤类型。 */
export type CombatStepForKind<K extends CombatStepKind> = {
  [Kind in K]: CombatStepNode<Kind>;
}[K];

/** 同一时点严格按数组顺序同步执行的步骤集合。 */
export interface ActionSequenceDefinition {
  /** 按数组顺序同步执行的步骤。 */
  steps: readonly CombatStepDefinition[];
}

/** 候选值是标签而非索引；允许重复，首个匹配获胜。空分支也是有效候选，不得删除。 */
export interface ActionSwitchOptionDefinition {
  /** 与 `switch.choice` 比较的候选值。 */
  readonly value: ActionValueOperand;
  /** 此候选首先匹配时执行的序列。 */
  readonly sequence: ActionSequenceDefinition;
}

/** 相对技能释放帧调度的点事件或持续序列。 */
export interface ScheduledSequenceDefinition {
  /** 相对宿主开始时刻的起始帧。 */
  startFrame: number;
  /** 仅有状态动作需要；到达该帧时对已经开始的序列调用结束生命周期。 */
  endFrame?: number;
  /** 到达起始帧时执行或启动的动作序列。 */
  sequence: ActionSequenceDefinition;
}

/** 技能临时监听器对一类战斗事件的同步响应。 */
export interface CombatEventResponseDefinition {
  /** 响应在当前监听器中的唯一名称。 */
  key: string;
  /** 要监听的战斗事件及其筛选参数。 */
  event: CombatEventTrigger;
  /** 常驻数据动作显式使用 dataAction；技能区间监听器缺省为 skill。 */
  phase?: 'dataAction' | 'skill';
  /** 仅 dataAction 相位使用，数值越大越先执行。 */
  priority?: number;
  /** 事件发生后还需满足的条件。 */
  condition?: CombatCondition;
  /** 条件成立时同步执行的动作序列。 */
  sequence: ActionSequenceDefinition;
}

/**
 * 技能和养成效果可以监听的语义战斗事件。
 * 事件身份不包含复杂筛选逻辑，额外限制应由条件树表达。
 */
/** 已迁入直接原生订阅的身份；能力机制由公共分发器实现，此处只维护迁移准入。 */
export const DIRECT_COMBAT_EVENT_TRIGGER_EVENTS = [
  'addedBuff',
  'outputBuff',
] as const satisfies readonly AbilityEvent[];

/** 技能和养成效果可以监听的一种语义战斗事件。 */
export type CombatEventTrigger =
  | {
      /** 直接监听能力系统事件。 */
      kind: 'abilityEvent';
      /** 允许直接订阅的能力事件。 */
      event: (typeof DIRECT_COMBAT_EVENT_TRIGGER_EVENTS)[number];
    }
  /** 任意干员命中敌人。 */
  | {
      /** 触发器种类判别值。 */
      kind: 'operatorHit';
    }
  /** 干员成功治疗；可限制监听治疗来源或受治疗者。 */
  | {
      /** 触发器种类判别值。 */
      kind: 'operatorHealed';
      /** 只监听治疗来源或受治疗者；省略时两者都可触发。 */
      role?: 'source' | 'target';
    }
  /** 任意 Buff 成功加入目标。 */
  | {
      /** 触发器种类判别值。 */
      kind: 'buffApplied';
    }
  /** 任意来源成功输出 Buff。 */
  | {
      /** 触发器种类判别值。 */
      kind: 'buffOutput';
    }
  /** Buff 被消费；可按 Buff ID 筛选。 */
  | {
      /** 触发器种类判别值。 */
      kind: 'buffConsumed';
      /** 任一匹配即可触发的 Buff ID。 */
      buffIds?: readonly string[];
    }
  /** 成功输出击飞。 */
  | {
      /** 触发器种类判别值。 */
      kind: 'airborneOutput';
    }
  /** 成功输出击倒。 */
  | {
      /** 触发器种类判别值。 */
      kind: 'knockDownOutput';
    }
  /** 获得技力；可按来源和正常获取或返还筛选。 */
  | {
      /** 触发器种类判别值。 */
      kind: 'spGained';
      /** 只监听指定的技力来源。 */
      source?: SpGainSource;
      /** 只监听正常获取或返还。 */
      gainKind?: SpGainKind;
    }
  /** 指定范围内的伤害命中携带某个标签。 */
  | {
      /** 触发器种类判别值。 */
      kind: 'damageTagHit';
      /** 要匹配的伤害标签。 */
      tag: DamageTag;
      /** 检查当前干员还是全队来源。 */
      scope: SkillTriggerScope;
    }
  | {
      /** 指定范围内成功施加一种元素附着。 */
      kind: 'elementalInflictionApplied';
      /** 任一匹配即可成立的元素。 */
      elements: DamageElement | readonly DamageElement[];
      /** 检查当前干员还是全队来源。 */
      scope: SkillTriggerScope;
    }
  | {
      /** 指定范围内成功施加一种物理异常。 */
      kind: 'physicalInflictionApplied';
      /** 任一匹配即可成立的物理异常。 */
      types: PhysicalInflictionType | readonly PhysicalInflictionType[];
      /** 检查当前干员还是全队来源。 */
      scope: SkillTriggerScope;
    }
  /** 指定技能组在相应范围内命中。 */
  | {
      /** 触发器种类判别值。 */
      kind: 'skillHit';
      /** 要匹配的技能组。 */
      skillGroupKey: string;
      /** 检查当前干员还是全队来源。 */
      scope: SkillTriggerScope;
    }
  /** 指定范围内的干员击败敌人。 */
  | {
      /** 触发器种类判别值。 */
      kind: 'enemyDefeated';
      /** 检查当前干员还是全队来源。 */
      scope: SkillTriggerScope;
    };

/** 技能、Buff 与配装事件监听共用的语义触发器词表。 */
export const COMBAT_EVENT_TRIGGER_KINDS = [
  'abilityEvent',
  'operatorHit',
  'operatorHealed',
  'buffApplied',
  'buffOutput',
  'buffConsumed',
  'airborneOutput',
  'knockDownOutput',
  'spGained',
  'damageTagHit',
  'elementalInflictionApplied',
  'physicalInflictionApplied',
  'skillHit',
  'enemyDefeated',
] as const satisfies readonly CombatEventTrigger['kind'][];

/** 一个技能在战斗事件发生后调度的条件化行为。 */
export interface CombatEventHandlerDefinition {
  /** 事件响应在当前技能中的唯一名称。 */
  key: string;
  /** 要监听的战斗事件及其筛选参数。 */
  event: CombatEventTrigger;
  /** 事件发生后还需满足的条件。 */
  condition?: CombatCondition;
  /** 相对事件时刻调度的动作序列。 */
  scheduledSequences: readonly ScheduledSequenceDefinition[];
}
