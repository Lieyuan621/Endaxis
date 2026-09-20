/**
 * 定义战斗过程中临时修改属性、伤害、治疗和失衡伤害的规则。
 *
 * Buff 等战斗能力用这些结构注册处理器。模拟器会在指定计算阶段检查来源方、目标方、
 * 伤害标签和其他条件，再把数值写入对应的公式槽或倍率区间。
 */
import type { GameplayTag, GameplayTagMatchType, GameplayTagQueryType } from './gameplayTags.ts';
import {
  type CombatTarget,
  type ComparisonOperator,
  type DamageFeature,
  type DamageTag,
  type DamageType,
} from './primitives.ts';

/** 属性修正是在构筑阶段写入，还是在战斗运行时写入。 */
export const ATTRIBUTE_MODIFIER_TIMINGS = ['deck', 'runtime'] as const;

/** 属性修正写入原生八槽公式的处理时机。 */
export type AttributeModifierTiming = (typeof ATTRIBUTE_MODIFIER_TIMINGS)[number];

/** 原生属性公式支持的八个数值槽。 */
export const ATTRIBUTE_MODIFIER_SLOTS = [
  'addition',
  'multiplier',
  'finalAddition',
  'finalMultiplier',
  'baseAddition',
  'baseMultiplier',
  'baseFinalAddition',
  'baseFinalMultiplier',
] as const;

/** 原生属性聚合公式中的固定槽位。 */
export type AttributeModifierSlot = (typeof ATTRIBUTE_MODIFIER_SLOTS)[number];

/** 一个修正在各槽位提供的稀疏数值集合。 */
export interface AttributeModifierValues {
  /** 普通固定加值。 */
  readonly addition: number;
  /** 普通乘数。 */
  readonly multiplier: number;
  /** 普通最终固定加值。 */
  readonly finalAddition: number;
  /** 普通最终乘数。 */
  readonly finalMultiplier: number;
  /** 基础固定加值。 */
  readonly baseAddition: number;
  /** 基础乘数。 */
  readonly baseMultiplier: number;
  /** 基础最终固定加值。 */
  readonly baseFinalAddition: number;
  /** 基础最终乘数。 */
  readonly baseFinalMultiplier: number;
}

/**
 * 属性、Buff 和技能分类汇入最终伤害公式前的统一倍率容器。
 * 调用方必须保留来源方/目标方与区间身份，不能先行压缩为一个总乘区。
 */
export const DAMAGE_SCALE_ZONES = [
  'product',
  'normal',
  'abnormalAndBurst',
  'enhanced',
  'combo',
  'vulnerable',
  'race',
] as const;

/** 七区间伤害倍率中的稳定区间身份。 */
export type DamageScaleZone = (typeof DAMAGE_SCALE_ZONES)[number];

/** 伤害修正可以安装在伤害来源方或目标方。 */
export const DAMAGE_MODIFIER_SIDES = ['attacker', 'defender'] as const;

/** 指明修正来自伤害来源方还是目标方。 */
export type DamageModifierSide = (typeof DAMAGE_MODIFIER_SIDES)[number];

/** 伤害倍率与其他伤害修正使用同一来源方/目标方身份。 */
export const DAMAGE_SCALE_SIDES = DAMAGE_MODIFIER_SIDES;

/** 区分来源方增伤和目标方易伤/减伤的倍率所有者。 */
export type DamageScaleSide = (typeof DAMAGE_SCALE_SIDES)[number];

/** 伤害处理器可以在基础伤害计算前或后执行。 */
export const DAMAGE_PROCESS_TIMINGS = ['beforeCalculation', 'afterCalculation'] as const;

/** 伤害修正器可以挂载的原生处理阶段。 */
export type DamageProcessTiming = (typeof DAMAGE_PROCESS_TIMINGS)[number];

/** 伤害目标可能使用的生命形态。 */
export const DAMAGE_TARGET_HEALTH_TYPES = ['none', 'normal', 'independent'] as const;

/** 目标的生命形态分类，供特定伤害规则筛选。 */
export type DamageTargetHealthType = (typeof DAMAGE_TARGET_HEALTH_TYPES)[number];

/** 伤害处理器中的动态数值可直接取常量，也可读取所属 Buff 实例的黑板。 */
export type DamageModifierNumber =
  | number
  | {
      /** 读取数值的 Buff 黑板键。 */
      readonly blackboardKey: string;
    };

/** 只依赖本次伤害事件和参战对象状态的伤害修正条件。 */
export type DamageModifierExternalCondition =
  | {
      /** 检查来源方或目标方的 GameplayTag。 */
      readonly kind: 'entityTagMatch';
      /** 要检查的对象。 */
      readonly target: CombatTarget;
      /** 标签集合的匹配方式。 */
      readonly tagQueryType: GameplayTagQueryType;
      /** 参与匹配的标签。 */
      readonly tags: readonly GameplayTag[];
    }
  /** 仅在伤害来源是当前受控干员时成立。 */
  | {
      /** 条件种类判别值。 */
      readonly kind: 'casterControlled';
    }
  | {
      /** 比较指定对象身上若干 Buff 的实例总数。 */
      readonly kind: 'buffIdCountCompare';
      /** 要统计 Buff 的对象。 */
      readonly target: 'caster' | 'enemy';
      /** 计入统计的 Buff ID。 */
      readonly buffIds: readonly string[];
      /** 计数比较符。 */
      readonly operator: ComparisonOperator;
      /** 与实例总数比较的值。 */
      readonly value: DamageModifierNumber;
    }
  | {
      /** 检查本次伤害携带的伤害标签。 */
      readonly kind: 'eventDamageTagsMatch';
      /** 标签集合的匹配方式。 */
      readonly match: GameplayTagMatchType;
      /** 参与匹配的伤害标签。 */
      readonly tags: readonly DamageTag[];
    }
  | {
      /** 检查本次伤害携带的特征。 */
      readonly kind: 'eventDamageFeaturesMatch';
      /** 特征集合的匹配方式。 */
      readonly match: GameplayTagMatchType;
      /** 参与匹配的伤害特征。 */
      readonly features: readonly DamageFeature[];
    }
  | {
      /** 检查本次伤害的伤害类型。 */
      readonly kind: 'eventDamageTypesMatch';
      /** 任一匹配即可成立的伤害类型。 */
      readonly damageTypes: readonly DamageType[];
    }
  | {
      /** 比较敌人的当前生命或生命比例。 */
      readonly kind: 'targetHealthCompare';
      /** 当前只支持伤害目标。 */
      readonly target: 'enemy';
      /** 比较生命数值还是生命比例。 */
      readonly valueType: 'current' | 'ratio';
      /** 数值比较符。 */
      readonly operator: ComparisonOperator;
      /** 与目标生命比较的值。 */
      readonly value: DamageModifierNumber;
    }
  | {
      /** 比较敌人的当前失衡值。 */
      readonly kind: 'targetPoiseCompare';
      /** 当前只支持伤害目标。 */
      readonly target: 'enemy';
      /** 目标没有失衡条时直接采用的判断结果。 */
      readonly returnValueIfMissing: boolean;
      /** 数值比较符。 */
      readonly operator: ComparisonOperator;
      /** 与目标失衡值比较的值。 */
      readonly value: DamageModifierNumber;
    };

/** 伤害修正专用条件树；Buff 黑板只在持有该修正的实例内求值。 */
export type DamageModifierCondition =
  | DamageModifierExternalCondition
  /** 本次伤害与创建当前 Buff 的技能属于同一次施放。 */
  | {
      /** 条件种类判别值。 */
      readonly kind: 'sourceSkillCastMatch';
    }
  | {
      /** 比较同一 Buff 黑板中的两个动态值或常量。 */
      readonly kind: 'buffBlackboardCompare';
      /** 左操作数。 */
      readonly left: DamageModifierNumber;
      /** 数值比较符。 */
      readonly operator: ComparisonOperator;
      /** 右操作数。 */
      readonly right: DamageModifierNumber;
    }
  | {
      /** 对一个子条件取反。 */
      readonly kind: 'not';
      /** 要取反的条件。 */
      readonly condition: DamageModifierCondition;
    }
  | {
      /** 所有子条件都成立时返回真。 */
      readonly kind: 'all';
      /** 需要同时成立的条件。 */
      readonly conditions: readonly DamageModifierCondition[];
    }
  | {
      /** 任一子条件成立时返回真。 */
      readonly kind: 'any';
      /** 只需其中一项成立的条件。 */
      readonly conditions: readonly DamageModifierCondition[];
    };

/** 在指定阶段向倍率区间或即时属性写入修正的处理器定义。 */
export type DamageProcessorDefinition =
  | {
      /** 直接乘算当前伤害值。 */
      readonly kind: 'multiplyValue';
      /** 执行乘算的伤害计算阶段。 */
      readonly timing: DamageProcessTiming;
      /** 只处理这些目标生命形态。 */
      readonly targetHealthTypes: readonly DamageTargetHealthType[];
      /** 伤害乘数。 */
      readonly scale: number;
    }
  | DamageScaleProcessorDefinition
  | InstantAttributeProcessorDefinition;

/** 向伤害公式的一个倍率区间写入加值。 */
export interface DamageScaleProcessorDefinition {
  /** 处理器种类判别值。 */
  readonly kind: 'damageScale';
  /** 修正属于攻击方还是防御方。 */
  readonly side: DamageScaleSide;
  /** 写入的伤害倍率区间。 */
  readonly zone: DamageScaleZone;
  /** 加入该区间的数值。 */
  readonly addition: DamageModifierNumber;
}

/** 在一次伤害计算中临时修改某项原生属性。 */
export interface InstantAttributeProcessorDefinition {
  /** 处理器种类判别值。 */
  readonly kind: 'instantAttribute';
  /** 要修改攻击方还是防御方的属性。 */
  readonly targetSide: DamageModifierSide;
  /** 原生属性名称。 */
  readonly attribute: string;
  /** 八槽完整值，或只写入一个槽的动态值。 */
  readonly values:
    | AttributeModifierValues
    | {
        /** 要写入的单个公式槽。 */
        readonly slot: AttributeModifierSlot;
        /** 写入该槽的值。 */
        readonly value: DamageModifierNumber;
      };
  /** 属性值取构筑结果还是当前战斗运行时结果。 */
  readonly attributeTiming: AttributeModifierTiming;
}

/** 一个 Buff 在伤害生命周期中注册的全部处理器。 */
export interface DamageModifierDefinition {
  /** 只有此修正安装在指定一方时才启用。 */
  readonly enabledSide: DamageModifierSide;
  /** 按顺序执行的伤害处理器。 */
  readonly processors: readonly DamageProcessorDefinition[];
  /** 启用处理器前必须满足的条件。 */
  readonly condition?: DamageModifierCondition;
}

/** 治疗修正安装在治疗者或受治疗者一方。 */
export type HealModifierSide = 'healer' | 'receiver';

/** 治疗修正沿用伤害修正的计算前、计算后阶段。 */
export type HealProcessTiming = DamageProcessTiming;

/** 治疗处理器中的常量或 Buff 黑板数值。 */
export type HealModifierNumber =
  | number
  | {
      /** 读取数值的 Buff 黑板键。 */
      readonly blackboardKey: string;
    };

/** 决定一项治疗修正是否生效的条件。 */
export type HealModifierCondition =
  | {
      /** 比较受治疗者的当前生命值或生命比例。 */
      readonly kind: 'targetHealthCompare';
      /** 比较当前生命值还是当前生命比例。 */
      readonly valueType: 'current' | 'ratio';
      /** 数值比较符。 */
      readonly operator: ComparisonOperator;
      /** 与生命值或比例比较的值。 */
      readonly value: HealModifierNumber;
    }
  | {
      /** 比较同一 Buff 黑板中的两个动态值或常量。 */
      readonly kind: 'buffBlackboardCompare';
      /** 左操作数。 */
      readonly left: HealModifierNumber;
      /** 数值比较符。 */
      readonly operator: ComparisonOperator;
      /** 右操作数。 */
      readonly right: HealModifierNumber;
    }
  | {
      /** 检查本次治疗携带的标签。 */
      readonly kind: 'healTagsMatch';
      /** 匹配任一标签或全部标签。 */
      readonly match: 'hasAny' | 'hasAll';
      /** 参与匹配的治疗标签。 */
      readonly tags: readonly GameplayTag[];
    };

/** 在基础治疗计算完成后乘算结果。 */
export interface ModifyHealCalculationResultProcessorDefinition {
  /** 处理器种类判别值。 */
  readonly kind: 'modifyCalculationResult';
  /** 此处理器固定在基础计算完成后执行。 */
  readonly timing: 'afterCalculation';
  /** 每次乘算使用的基础倍率。 */
  readonly baseMultiplier: HealModifierNumber;
  /** 重复应用基础倍率的次数。 */
  readonly multiplierCount: HealModifierNumber;
}

/** 在治疗计算前修改治疗加成。 */
export interface ModifyHealingIncreaseProcessorDefinition {
  /** 处理器种类判别值。 */
  readonly kind: 'modifyHealingIncrease';
  /** 此处理器固定在治疗计算前执行。 */
  readonly timing: 'beforeCalculation';
  /** 修改治疗者的输出加成或受治疗者的承疗加成。 */
  readonly side: HealModifierSide;
  /** 加入对应治疗加成区的数值。 */
  readonly addition: HealModifierNumber;
}

/** 一个 Buff 在治疗生命周期中注册的条件和处理器。 */
export interface HealModifierDefinition {
  /** 只有此修正安装在指定一方时才启用。 */
  readonly enabledSide: HealModifierSide;
  /** 启用处理器前必须满足的条件。 */
  readonly condition?: HealModifierCondition;
  /** 按顺序执行的治疗处理器。 */
  readonly processors: readonly (
    ModifyHealCalculationResultProcessorDefinition | ModifyHealingIncreaseProcessorDefinition
  )[];
}

/** 失衡伤害修正沿用伤害修正的攻击方、目标方身份。 */
export type PoiseModifierSide = DamageModifierSide;

/** 失衡伤害修正沿用伤害修正的计算阶段。 */
export type PoiseProcessTiming = DamageProcessTiming;

/** 失衡伤害处理器中的常量或 Buff 黑板数值。 */
export type PoiseModifierNumber =
  | number
  | {
      /** 读取数值的 Buff 黑板键。 */
      readonly blackboardKey: string;
    };

/** 决定一项失衡伤害修正是否生效的条件。 */
export type PoiseModifierCondition =
  /** 伤害来源是当前主控干员。 */
  | {
      /** 条件种类判别值。 */
      readonly kind: 'casterControlled';
    }
  | {
      /** 检查本次伤害携带的标签。 */
      readonly kind: 'eventDamageTagsMatch';
      /** 匹配任一标签或全部标签。 */
      readonly match: 'hasAny' | 'hasAll';
      /** 参与匹配的伤害标签。 */
      readonly tags: readonly DamageTag[];
    }
  | {
      /** 所有子条件都成立时返回真。 */
      readonly kind: 'all';
      /** 需要同时成立的条件。 */
      readonly conditions: readonly PoiseModifierCondition[];
    };

/** 在失衡伤害计算前修改攻击方或目标方的倍率。 */
export interface ModifyPoiseScalarProcessorDefinition {
  /** 处理器种类判别值。 */
  readonly kind: 'modifyPoiseScalar';
  /** 此处理器固定在失衡伤害计算前执行。 */
  readonly timing: 'beforeCalculation';
  /** 修改攻击方还是目标方的倍率。 */
  readonly side: PoiseModifierSide;
  /** 加入对应倍率区的数值。 */
  readonly addition: PoiseModifierNumber;
}

/** 一个 Buff 在失衡伤害生命周期中注册的条件和处理器。 */
export interface PoiseModifierDefinition {
  /** 只有此修正安装在指定一方时才启用。 */
  readonly enabledSide: PoiseModifierSide;
  /** 启用处理器前必须满足的条件。 */
  readonly condition?: PoiseModifierCondition;
  /** 按顺序执行的失衡伤害处理器。 */
  readonly processors: readonly ModifyPoiseScalarProcessorDefinition[];
}
