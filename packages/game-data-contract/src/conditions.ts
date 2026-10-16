/**
 * 定义技能、Buff、装备和事件响应共用的条件表达式。
 *
 * 模拟器在消费输入时读取当前动作、事件、角色、敌人或 Buff 状态并返回真假。
 * `checkActionResult` 显式表示在该求值位置调用行为；不得按纯计算重排或缓存。
 * 条件通过 `not`、`all` 和 `any` 节点的输入连线组合。
 */
export const SKILL_INTERRUPT_REASONS = [
  'default',
  'enterFreeState',
  'aiManual',
  'mud',
  'detachSkill',
  'interruptAction',
  'dash',
  'castNextSkill',
] as const;
export type SkillInterruptReason = (typeof SKILL_INTERRUPT_REASONS)[number];

import type { GameplayTag, GameplayTagMatchType, GameplayTagQueryType } from './gameplayTags.ts';
import type { ActionGraphReference } from './actionGraph.ts';
import {
  type BuffSingleTarget,
  type CombatObjectTypeSelection,
  type CombatTarget,
  type ComparisonOperator,
  type DamageElement,
  type DamageFeature,
  type DamageTag,
  type DamageType,
  type EnemyRank,
  type HealTarget,
  type InflictionElement,
  type OperatorAttribute,
  type OperatorRole,
  type SkillType,
  type SpGainKind,
  type SpGainSource,
  type TimedMarkerTarget,
  type GlobalCooldownTarget,
  type ActionStringOperand,
} from './primitives.ts';

/** Buff 条件可以检查的单体目标，包含事件动作的输入目标。 */
export type BuffConditionTarget = BuffSingleTarget | 'actionInputTarget';

/** 从动作环境读取首个实体；命名组为空时不产生目标。 */
export type ActionEntitySelection =
  | { readonly kind: 'owner' | 'source' | 'inputTarget' }
  | { readonly kind: 'mainCharacter' }
  | { readonly kind: 'context'; readonly key: string };

/** 动作内部解析的目标配置，不增加图中的调用或临时目标组。 */
export type ActionTargetQuery =
  | ActionEntitySelection
  | { readonly kind: 'battleMainTarget' }
  /** 战斗全局机制对象，独立于主控和敌人。 */
  | { readonly kind: 'godEntity' }
  /** 零空间模型中已证明查询范围覆盖的未结束投射物。 */
  | { readonly kind: 'unfinishedProjectiles' }
  | { readonly kind: 'fixed'; readonly target: 'enemy' | 'caster' }
  /** 固定单敌人候选经原生 TagValidator 筛选，空结果仍覆盖目标组。 */
  | {
      readonly kind: 'enemyByTags';
      readonly tagQueryType: GameplayTagQueryType;
      readonly tags: readonly GameplayTag[];
    }
  | {
      readonly kind: 'characterTeam';
      readonly excludeOwner: boolean;
      /** 排除的 selector owner；省略时使用动作 Owner，不能替换成定义所属干员。 */
      readonly owner?: ActionEntitySelection;
    }
  | { readonly kind: 'mainTarget'; readonly owner: ActionEntitySelection }
  /** 读取所选能力实体控制器当前保存的目标，不替换为主敌人或技能输入快照。 */
  | { readonly kind: 'abilityEntityTarget'; readonly owner: ActionEntitySelection }
  /** 读取所选对象主体的 soulPart，不按来源干员枚举召唤物。 */
  | { readonly kind: 'ownerSoul'; readonly owner: ActionEntitySelection }
  /** 零空间 Normal 命中盒的同阵营候选；查询时读取实体当前状态。 */
  | {
      readonly kind: 'allyHitBox';
      readonly owner: ActionEntitySelection;
      readonly checkAlive: boolean;
      readonly containsUnmarkable: boolean;
      readonly replacePartsWithMainBodies: boolean;
    }
  | {
      readonly kind: 'fixedPoint';
      readonly owner: ActionEntitySelection;
      readonly center: ActionEntitySelection;
      readonly directionTarget: ActionEntitySelection;
    }
  | {
      readonly kind: 'ownerSpawned';
      readonly owner: ActionEntitySelection;
      readonly objectType: 'abilityEntity' | 'all';
      readonly abilityEntityIds?: readonly string[];
      readonly sameSourceSkillCast: boolean;
    };

/**
 * 技能可用性、条件动作、Buff 修正和事件响应使用的布尔输入。
 * 固定真假直接保存；其余判断通过本图的布尔数据节点连接。
 */
export const ABILITY_ENTITY_FINISH_REASONS = [
  'other',
  'lifetime',
  'stackEvicted',
  'sourceDied',
  'targetDied',
  'soulMainBodyDied',
] as const;
export type AbilityEntityFinishReason = (typeof ABILITY_ENTITY_FINISH_REASONS)[number];

export type CombatCondition =
  | { readonly kind: 'constant'; readonly value: boolean }
  | { readonly kind: 'conditionNode'; readonly nodeId: string };

/** 布尔数据节点的操作。子条件通过输入引用连接，不能内嵌另一个条件操作。 */
export type CombatConditionExpression =
  | {
      /** 在消费此输入的位置即时执行行为序列，读取其执行结果；不得提前求值或缓存结果。 */
      kind: 'checkActionResult';
      action: ActionGraphReference;
    }
  | { /** 当前技能在本次施放中是否进入过战斗伤害处理。 */ readonly kind: 'skillHasHit' }
  | CombatCondition
  | {
      kind: 'entityCountCompare';
      target: ActionTargetQuery;
      containsHittableTarget: boolean;
      excludeDeadEntity: boolean;
      operator: ComparisonOperator;
      value: number;
      outputKey?: string;
    }
  | {
      /** 比较两个查询首项目标的距离；任一目标没有位置则失败。 */
      kind: 'targetDistance';
      source: ActionTargetQuery;
      target: ActionTargetQuery;
      distance: number;
      lessThan: boolean;
      includeTargetRadius: boolean;
      containsHittableObject: boolean;
    }
  | {
      /** 区分大小写地比较两个字符串。 */
      kind: 'stringEquals';
      left: ActionStringOperand;
      right: ActionStringOperand;
    }
  /** 时间轴模拟始终处于战斗阶段，用于承接原生的队伍战斗状态检查。 */
  | {
      /** 条件种类判别值。 */
      kind: 'combatActive';
    }
  /** Endaxis 固定单敌人场景中，表示原生智能目标数量检查已被模型保证。 */
  | {
      /** 条件种类判别值。 */
      kind: 'singleEnemyPresent';
    }
  /** 当前技能所属干员是否为该帧的主控干员；必须由场景运行时提供主控身份。 */
  | {
      /** 条件种类判别值。 */
      kind: 'casterControlled';
    }
  /** 按 CharacterTable.charTypeId 的一一元素投影筛选施法者或 Buff 持有者。 */
  | {
      /** 条件种类判别值。 */
      kind: 'characterTypeIn';
      /** 检查施法者还是当前 Buff 持有者。 */
      target: 'caster' | 'buffOwner';
      /** 任一匹配即可成立的角色元素类型。 */
      characterTypes: readonly DamageElement[];
    }
  /** 按 CharacterTable.profession 检查已确定身份的干员；不适用于敌人或能力实体。 */
  | {
      /** 条件种类判别值。 */
      kind: 'operatorRoleIn';
      /** 要检查的干员身份。 */
      target: 'caster' | 'buffOwner' | 'eventTarget';
      /** 任一匹配即可成立的职业。 */
      roles: readonly OperatorRole[];
    }
  /** 当前单敌人是否属于任一原生 EnemyTemplateData.rank。 */
  | {
      /** 条件种类判别值。 */
      kind: 'enemyRankIn';
      /** 任一匹配即可成立的敌人强度分级。 */
      ranks: readonly EnemyRank[];
    }
  | {
      /** 比较当前单敌人的原生整数超级护甲值。 */
      kind: 'enemySuperArmorCompare';
      /** 数值比较符。 */
      operator: ComparisonOperator;
      /** 与敌人超级护甲比较的值。 */
      value: ActionValueOperand;
    }
  | {
      /** 检查目标当前是否处于失衡状态。 */
      kind: 'targetStaggered';
      /** 要检查的施法者或敌人。 */
      target: CombatTarget;
    }
  | {
      /** 比较目标当前生命值或当前/最大生命比例。 */
      kind: 'healthCompare';
      /** 要检查的对象。 */
      target: CombatTarget | HealTarget | 'actionInputTarget';
      /** target=contextTarget 时读取动作目标组中的首个对象。 */
      contextKey?: string;
      /** 比较当前生命值还是当前生命比例。 */
      valueType: 'current' | 'ratio';
      /** 数值比较符。 */
      operator: ComparisonOperator;
      /** 与生命值或比例比较的值。 */
      value: ActionValueOperand;
    }
  | {
      /** 比较目标当前失衡值；目标没有失衡系统时返回原生配置值。 */
      kind: 'poiseCompare';
      /** 要检查的对象；currentTarget 读取当前动作输入目标。 */
      target: CombatTarget | 'currentTarget' | 'actionInputTarget';
      /** 目标没有失衡系统时直接采用的结果。 */
      returnValueIfMissing: boolean;
      /** 数值比较符。 */
      operator: ComparisonOperator;
      /** 与当前失衡值比较的值。 */
      value: ActionValueOperand;
    }
  | {
      /** 比较同一技能实例动作黑板中的动态值与常量，或比较两个动态值。 */
      kind: 'actionValueCompare';
      /** 比较左值。 */
      left: ActionValueOperand;
      /** 数值比较符。 */
      operator: ComparisonOperator;
      /** 比较右值。 */
      right: ActionValueOperand;
    }
  | {
      /** GetTargetBuffBBAdvanced + CompareFloat：找不到 Buff 时为 false，找到时先写动作黑板。 */
      kind: 'buffBlackboardValueCompare';
      /** 要查找 Buff 的对象。 */
      target: BuffConditionTarget;
      /** 按 Buff ID 或 Buff 标签查找。 */
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
      /** 从找到的 Buff 黑板读取的键。 */
      desiredKey: string;
      /** 把读到的值同步写入当前动作黑板的键。 */
      outputKey: string;
      /** 数值比较符。 */
      operator: ComparisonOperator;
      /** 与 Buff 黑板值比较的值。 */
      value: ActionValueOperand;
    }
  | {
      /** 以原生 RandomUtil.Dice(float) 对动作黑板或常量概率取样。 */
      kind: 'probability';
      /** 0 到 1 的命中概率。 */
      probability: ActionValueOperand;
    }
  | {
      /** 检查当前命中角色的投射物是否处于完美闪避冷却。 */
      kind: 'eventProjectilePerfectDodgeCooldownEquals';
      /** 原生 CheckProjectileInPerfectDodgeCd.isInCd。 */
      value: boolean;
    }
  | {
      /** 检查当前能力实体事件中的原生结束原因。 */
      kind: 'eventAbilityEntityFinishReasonIn';
      reasons: readonly AbilityEntityFinishReason[];
    }
  | {
      /** 比较当前命中角色的投射物免疫忽略等级。 */
      kind: 'eventProjectileIgnoreImmuneLevelCompare';
      /** 原生 CheckProjectileIgnoreImmuneLevel.checkType。 */
      operator: ComparisonOperator;
      /** 原生免疫忽略等级枚举的整数值。 */
      value: number;
    }
  | {
      /** 命名组中任一对象匹配可读类型集合；enemy 同时接受 enemyPart。 */
      kind: 'contextTargetObjectTypeMatch';
      /** 动作环境中的目标组名称。 */
      contextKey: string;
      /** 允许匹配的对象类型。 */
      objectTypes: CombatObjectTypeSelection;
    }
  | {
      /** 原生事件动作的 InputTarget 对象类型；与物理 eventTarget 方向可能相反。 */
      kind: 'actionInputTargetObjectTypeMatch';
      /** 允许匹配的对象类型。 */
      objectTypes: CombatObjectTypeSelection;
    }
  | {
      /** 比较原生事件动作 InputTarget 与 ActionSource/ActionOwner/当前主控身份。 */
      kind: 'actionInputTargetIdentityMatch';
      /** 与输入目标比较的另一个对象身份。 */
      other: 'actionSource' | 'actionOwner' | 'controlledOperator';
      /** 判断两者相同或不同。 */
      operator: 'equal' | 'notEqual';
    }
  | {
      /** 比较命名 Context 中目标与指定对象的身份。 */
      kind: 'contextTargetIdentityMatch';
      /** 首目标为空时不匹配；全组比较要求两组互相包含。 */
      selection: 'first' | 'all';
      /** 动作环境中的目标组名称。 */
      contextKey: string;
      /** 用于比较的对象身份。 */
      other: 'actionSource' | 'actionOwner' | 'controlledOperator' | 'actionInputTarget';
      /** 判断两者相同或不同。 */
      operator: 'equal' | 'notEqual';
    }
  | {
      /** 命名 Context 的全部有效实体均须满足标签查询，空组失败。 */
      kind: 'contextTargetEntityTagMatch';
      /** 动作环境中的目标组名称。 */
      contextKey: string;
      /** 标签集合匹配方式。 */
      tagQueryType: GameplayTagQueryType;
      /** 参与匹配的实体标签。 */
      tags: readonly GameplayTag[];
    }
  | {
      /** 按标签查询命名组首目标的增强层数。 */
      kind: 'contextTargetBuffStackCompare';
      /** 高级检查无目标时比较零；普通检查直接失败，不读取阈值。 */
      compareZeroWhenTargetMissing: boolean;
      /** 动作环境中的目标组名称。 */
      contextKey: string;
      /** 标签集合匹配方式。 */
      tagQueryType: GameplayTagQueryType;
      /** 用于查找 Buff 的标签。 */
      buffTags: readonly GameplayTag[];
      /** 层数比较符。 */
      operator: ComparisonOperator;
      /** 与累计强化层数比较的值。 */
      value: ActionValueOperand;
    }
  | {
      /** 按 ID 查询命名组首目标的增强层数。 */
      kind: 'contextTargetBuffIdStackCompare';
      /** 高级检查无目标时比较零；普通检查直接失败，不读取阈值。 */
      compareZeroWhenTargetMissing: boolean;
      /** 动作环境中的目标组名称。 */
      contextKey: string;
      /** 任一匹配即可选中的 Buff ID。 */
      buffIds: readonly string[];
      /** 层数比较符。 */
      operator: ComparisonOperator;
      /** 与累计强化层数比较的值。 */
      value: ActionValueOperand;
    }
  | {
      /** 比较首个目标能力实体的剩余时长；无限寿命读取为 -1。 */
      kind: 'abilityEntityRemainingDurationCompare';
      /** 省略时读取当前 Context 迭代目标。 */
      target?: ActionTargetQuery;
      /** 仅比较成功时写入剩余秒数，失败保留旧值。 */
      outputKey?: string;
      /** 剩余秒数比较符。 */
      operator: ComparisonOperator;
      /** 与剩余时长比较的秒数。 */
      value: ActionValueOperand;
    }
  | {
      /** Environment 查询只读取执行中 Buff 的增强层数，不查询任何目标容器。 */
      kind: 'currentBuffStackCompare';
      /** 层数比较符。 */
      operator: ComparisonOperator;
      /** 与当前 Buff 强化层数比较的值。 */
      value: ActionValueOperand;
    }
  | {
      /** 按原生 Buff 标签查询累计强化层数，并使用原生容差比较。 */
      kind: 'buffStackCompare';
      /** 要统计 Buff 的对象。 */
      target: BuffConditionTarget;
      /** 标签集合匹配方式。 */
      tagQueryType: GameplayTagQueryType;
      /** 用于查找 Buff 的标签。 */
      buffTags: readonly GameplayTag[];
      /** 是否只统计和当前 Buff 来自同一次技能施放的实例。 */
      sameSourceSkillCast?: boolean;
      /** 层数比较符。 */
      operator: ComparisonOperator;
      /** 与累计强化层数比较的值。 */
      value: ActionValueOperand;
    }
  | {
      /** 按原生 Buff 标签查询未结束 Buff 的不同定义 ID 数，不累计实例数或强化层数。 */
      kind: 'buffTagIdCountCompare';
      /** 要统计 Buff 的对象。 */
      target: BuffConditionTarget;
      /** 标签集合匹配方式。 */
      tagQueryType: GameplayTagQueryType;
      /** 用于查找 Buff 的标签。 */
      buffTags: readonly GameplayTag[];
      /** 数量比较符。 */
      operator: ComparisonOperator;
      /** 与不同 Buff ID 数量比较的值。 */
      value: ActionValueOperand;
    }
  | {
      /** 查询目标实体当前持有的 GameplayTag；它与 Buff 身份、数量和层数无关。 */
      kind: 'entityTagMatch';
      /** 要检查的对象。 */
      target: BuffConditionTarget;
      /** 标签集合匹配方式。 */
      tagQueryType: GameplayTagQueryType;
      /** 参与匹配的实体标签。 */
      tags: readonly GameplayTag[];
    }
  | {
      /** 按Buff 定义 身份查询累计强化层数；ID 列表按“任一匹配”处理。 */
      kind: 'buffIdStackCompare';
      /** 要统计 Buff 的对象。 */
      target: BuffConditionTarget;
      /** 任一匹配即可计入的 Buff ID。 */
      buffIds: readonly string[];
      /** 是否只统计和当前 Buff 来自同一次技能施放的实例。 */
      sameSourceSkillCast?: boolean;
      /** 层数比较符。 */
      operator: ComparisonOperator;
      /** 与累计强化层数比较的值。 */
      value: number | ActionValueOperand;
    }
  | {
      /** 查询角色的战斗级冷却；与能力系统上的同名普通标记相互隔离。 */
      kind: 'globalCooldownPresent';
      /** 全局冷却所属对象。 */
      target: GlobalCooldownTarget;
      /** 全局冷却标记 ID。 */
      markerId: string;
    }
  | {
      /** 施放者的原生连携候选列表非空；不检查冷却、队首、当前技能或可释放性。 */
      kind: 'casterComboPending';
    }
  | {
      /** 检查目标能力系统中是否存在仍有效的原生定时标记。 */
      kind: 'timedMarkerPresent';
      /** 有目标时，改为检查标记不存在；无目标始终不通过。 */
      returnTrueIfNotExists: boolean;
      /** 定时标记所属对象。 */
      target: TimedMarkerTarget;
      /** 标记 ID 或动作黑板中的标记 ID。 */
      markerId: ActionStringOperand;
    }
  | {
      /** 检查当前能力实体或 Context 能力实体集合中仍有效的定时标记。 */
      kind: 'abilityEntityTimedMarkerPresent';
      /** 有目标时，改为检查标记不存在；无目标始终不通过。 */
      returnTrueIfNotExists: boolean;
      /** 标记 ID 或动作黑板中的标记 ID。 */
      markerId: ActionStringOperand;
      /** 指定时检查该动作目标组中的能力实体；省略时检查当前能力实体。 */
      contextKey?: string;
    }
  | {
      /** 匹配触发当前响应的伤害事件标签；普通技能步骤没有事件上下文。 */
      kind: 'eventDamageTagsMatch';
      /** 标签集合匹配方式。 */
      match: GameplayTagMatchType;
      /** 参与匹配的伤害标签。 */
      tags: readonly DamageTag[];
    }
  | {
      /** 检查当前事件中当前主体对应的转移部位标签，不回退到动作环境或施法来源。 */
      kind: 'eventTransferredPartTagsMatch';
      tagQueryType: GameplayTagQueryType;
      tags: readonly GameplayTag[];
      /** 匹配成功才保存部位目标；失败保留已有目标组。 */
      saveToContextKey?: string;
    }
  | {
      /** 匹配伤害包 DamageUnit.damageTags 的原生 GameplayTag。 */
      kind: 'eventDamageGameplayTagsMatch';
      /** 标签集合匹配方式。 */
      match: GameplayTagMatchType;
      /** 参与匹配的原生伤害 GameplayTag。 */
      tags: readonly GameplayTag[];
    }
  | {
      /** 匹配触发当前响应的伤害行为特征；普通技能步骤没有事件上下文。 */
      kind: 'eventDamageFeaturesMatch';
      /** 特征集合匹配方式。 */
      match: GameplayTagMatchType;
      /** 参与匹配的伤害特征。 */
      features: readonly DamageFeature[];
    }
  | {
      /** 匹配触发当前响应的伤害类型；未声明类型的外部事实不会命中。 */
      kind: 'eventDamageTypeIn';
      /** 任一匹配即可成立的伤害类型。 */
      damageTypes: readonly DamageType[];
    }
  | {
      /** 匹配触发当前响应的元素附着类型。 */
      kind: 'eventInflictionElementIn';
      /** 任一匹配即可成立的元素附着类型。 */
      elements: readonly InflictionElement[];
      /** 命中后把原生元素编号写入已声明键；缺键报错，EntityBB_ 写入共享实体板。 */
      outputKey?: string;
    }
  | {
      /** 匹配来源 AbilitySystem 即将输出的物理异常类型。 */
      kind: 'eventPhysicalInflictionTypeIn';
      /** 任一匹配即可成立的物理异常类型。 */
      types: readonly ('airborne' | 'knockDown' | 'fracture' | 'crush')[];
      /** 命中后把原生物理异常编号写入已声明键；规则与元素 savedKey 相同。 */
      outputKey?: string;
    }
  | {
      /** 匹配触发 Buff 响应的待施放技能类型。 */
      kind: 'eventSkillTypeIn';
      /** 只限制原生战技；其他原生类型不受此字段影响。省略表示不限。 */
      normalSkillSubType?: 'normal' | 'additionalNormalSkill';
      /** 任一匹配即可成立的技能分类。 */
      skillTypes: readonly SkillType[];
    }
  | {
      /** 检查技能事件中的技能配置属性；无技能事件时读取当前执行技能。 */
      kind: 'skillDamageTypeIn';
      damageTypes: readonly DamageElement[];
    }
  | {
      /** 精确匹配当前 OnCustomAbilityEvent 的命名载荷。 */
      kind: 'eventCustomAbilityNameMatch';
      /** 要匹配的自定义事件名称。 */
      eventName: string;
      /** 名称匹配后把事件 float 参数写入当前动作黑板；对应原生 savedParamKey。 */
      outputKey?: string;
    }
  | {
      /** 查询目标 AbilitySystem 当前仍在施放的技能类型；不读取事件载荷。 */
      kind: 'currentSkillTypeIn';
      /** 只限制原生战技；其他原生类型不受此字段影响。省略表示不限。 */
      normalSkillSubType?: 'normal' | 'additionalNormalSkill';
      /** 检查施法者、当前 Buff 持有者或当前主控；在求值时解析身份。 */
      target: 'caster' | 'buffOwner' | 'controlledOperator';
      /** 任一匹配即可成立的当前技能分类。 */
      skillTypes: readonly SkillType[];
    }
  | {
      /** 匹配当前事件的来源施法类型；按原生载荷类型读取，不回退到监听 Buff 的来源。 */
      kind: 'originSkillTypeIn';
      /** 任一匹配即可成立的来源技能分类。 */
      skillTypes: readonly SkillType[];
    }
  | {
      /** 当前中断事件的原因是否在给定列表中。 */
      kind: 'skillInterruptReasonIn';
      reasons: readonly SkillInterruptReason[];
    }
  | {
      /** 父目标组是否包含全部子目标；空子组返回真。 */
      kind: 'targetContains';
      /** 用于查找的父目标组。 */
      parent: ActionTargetQuery;
      /** 要检查的子目标组。 */
      child: ActionTargetQuery;
    }
  | {
      /** 匹配触发 Buff 响应的待施放技能稳定身份。 */
      kind: 'eventSkillIdIn';
      /** 任一匹配即可成立的原生技能 ID。 */
      skillIds: readonly string[];
    }
  /** 原生 CheckSkillCastId；事件分支读取来源身份，伤害修正分支必须显式读取 Buff affixSkillCastId。 */
  | {
      /** 条件种类判别值。 */
      kind: 'eventSkillCastMatchesBuffSource';
    }
  | {
      /** 匹配触发当前响应的新施加 Buff 身份。 */
      kind: 'eventBuffIdMatch';
      /** 任一匹配即可成立的新 Buff ID。 */
      buffIds: readonly string[];
      /** 条件命中后把事件 Buff ID 写入当前动作黑板。 */
      buffIdOutputKey?: string;
    }
  /** 当前 Buff 结束事件由原生 Ignite/Early 原因触发。 */
  | {
      /** 条件种类判别值。 */
      kind: 'eventBuffEndedEarly';
    }
  | {
      /** 匹配触发当前响应的新施加 Buff 原生标签。 */
      kind: 'eventBuffTagsMatch';
      /** 标签集合匹配方式。 */
      match: 'hasAny' | 'hasAll' | 'exceptAny' | 'exceptAll';
      /** 参与匹配的新 Buff 标签。 */
      buffTags: readonly GameplayTag[];
      /** Advanced 条件命中后把事件 Buff ID 写入当前动作黑板。 */
      buffIdOutputKey?: string;
    }
  | {
      /** 按当前事件真实目标统计匹配标签的 Buff 实例数；不累计 Buff 增强层数。 */
      kind: 'eventTargetBuffCountCompare';
      /** 标签集合匹配方式。 */
      tagQueryType: GameplayTagQueryType;
      /** 用于查找 Buff 的标签。 */
      buffTags: readonly GameplayTag[];
      /** 数量比较符。 */
      operator: ComparisonOperator;
      /** 与 Buff 实例数比较的值。 */
      value: ActionValueOperand;
    }
  | {
      /** 匹配当前治疗事件携带的原生治疗标签。 */
      kind: 'eventHealTagsMatch';
      /** 标签集合匹配方式。 */
      match: 'hasAny' | 'hasAll' | 'exceptAny' | 'exceptAll';
      /** 参与匹配的治疗标签。 */
      tags: readonly GameplayTag[];
    }
  | {
      /** 匹配 OnObtainAtb 事件携带的来源与获得方式。 */
      kind: 'eventSpGainMatch';
      /** 允许的技力来源；省略时不筛选来源。 */
      sources?: readonly SpGainSource[];
      /** 允许的正常获取或返还类型；省略时不筛选类型。 */
      gainKinds?: readonly SpGainKind[];
    }
  | {
      /** 比较 Buff 增强事件携带的层数（不是当前总层数）；成功后可写入黑板。 */
      kind: 'eventBuffEnhanceLayerCompare';
      operator: ComparisonOperator;
      value: ActionValueOperand;
      outputKey?: string;
    }
  | {
      /** 比较 OnConsumeBuff 事件快照中的实际消费层数；命中后可写入动作黑板。 */
      kind: 'eventConsumedBuffLayerCompare';
      /** 层数比较符。 */
      operator: ComparisonOperator;
      /** 与实际消费层数比较的值。 */
      value: ActionValueOperand;
      /** 条件命中后保存实际消费层数的动作黑板键。 */
      outputKey?: string;
    }
  | {
      /** 原生 CheckOverHeal；非空键会在判断前接收对应事件值。 */
      kind: 'eventOverheal';
      /** 保存过量治疗值的动作黑板键。 */
      overHealKey?: string;
      /** 保存最终治疗值的动作黑板键。 */
      finalHealKey?: string;
      /** 保存实际恢复生命值的动作黑板键。 */
      realHealKey?: string;
    }
  /** 承伤/加 Buff 事件的物理来源是否等于创建监听 Buff 的实体。 */
  | {
      /** 条件种类判别值。 */
      kind: 'eventSourceMatchesBuffSource';
    }
  /** 事件来源是否等于 Buff 来源能力实体的原生 AbilitySystem.source。 */
  | {
      /** 条件种类判别值。 */
      kind: 'eventSourceMatchesBuffSourceEntitySource';
    }
  /** 当前 Buff 的创建来源实体是否也是其宿主。 */
  | {
      /** 条件种类判别值。 */
      kind: 'buffSourceMatchesOwner';
    }
  | {
      /** 当前施术者生成的活动能力实体中是否存在匹配模板（零空间不再做距离裁剪）。 */
      kind: 'ownerSpawnedAbilityEntityPresent';
      /** 只匹配这些能力实体 ID；省略时接受任意 ID。 */
      abilityEntityIds?: readonly string[];
      /** 是否只接受和当前 Buff 来自同一次技能施放的实体。 */
      sameSourceSkillCast?: boolean;
    }
  | {
      /** 对一个子条件的结果取反。 */
      kind: 'not';
      /** 要取反的条件。 */
      condition: CombatCondition;
    }
  | {
      /** 所有子条件都成立时返回真。 */
      kind: 'all';
      /** 需要同时成立的条件。 */
      conditions: readonly CombatCondition[];
    }
  | {
      /** 任一子条件成立时返回真。 */
      kind: 'any';
      /** 只需其中一项成立的条件。 */
      conditions: readonly CombatCondition[];
    }
  | {
      /** 在构筑阶段比较两项干员四维。 */
      kind: 'deckAttributeCompare';
      /** 左侧属性。 */
      left: OperatorAttribute;
      /** 数值比较符。 */
      operator: ComparisonOperator;
      /** 右侧属性。 */
      right: OperatorAttribute;
    };

/** 布尔数据节点的全部操作种类。 */
export const COMBAT_CONDITION_KINDS = [
  'checkActionResult',
  'constant',
  'combatActive',
  'skillHasHit',
  'singleEnemyPresent',
  'casterControlled',
  'characterTypeIn',
  'operatorRoleIn',
  'enemyRankIn',
  'enemySuperArmorCompare',
  'targetDistance',
  'targetStaggered',
  'healthCompare',
  'poiseCompare',
  'actionValueCompare',
  'stringEquals',
  'buffBlackboardValueCompare',
  'probability',
  'entityCountCompare',
  'contextTargetObjectTypeMatch',
  'actionInputTargetObjectTypeMatch',
  'actionInputTargetIdentityMatch',
  'contextTargetIdentityMatch',
  'contextTargetEntityTagMatch',
  'contextTargetBuffStackCompare',
  'contextTargetBuffIdStackCompare',
  'abilityEntityRemainingDurationCompare',
  'buffStackCompare',
  'buffTagIdCountCompare',
  'currentBuffStackCompare',
  'entityTagMatch',
  'buffIdStackCompare',
  'timedMarkerPresent',
  'globalCooldownPresent',
  'casterComboPending',
  'abilityEntityTimedMarkerPresent',
  'eventDamageTagsMatch',
  'eventTransferredPartTagsMatch',
  'eventDamageGameplayTagsMatch',
  'eventDamageFeaturesMatch',
  'eventDamageTypeIn',
  'eventInflictionElementIn',
  'eventPhysicalInflictionTypeIn',
  'eventProjectilePerfectDodgeCooldownEquals',
  'eventAbilityEntityFinishReasonIn',
  'eventProjectileIgnoreImmuneLevelCompare',
  'eventSkillTypeIn',
  'skillDamageTypeIn',
  'eventCustomAbilityNameMatch',
  'currentSkillTypeIn',
  'originSkillTypeIn',
  'skillInterruptReasonIn',
  'targetContains',
  'eventSkillIdIn',
  'eventSkillCastMatchesBuffSource',
  'eventBuffIdMatch',
  'eventBuffEndedEarly',
  'eventBuffTagsMatch',
  'eventTargetBuffCountCompare',
  'eventHealTagsMatch',
  'eventSpGainMatch',
  'eventConsumedBuffLayerCompare',
  'eventBuffEnhanceLayerCompare',
  'eventOverheal',
  'eventSourceMatchesBuffSource',
  'eventSourceMatchesBuffSourceEntitySource',
  'buffSourceMatchesOwner',
  'ownerSpawnedAbilityEntityPresent',
  'not',
  'all',
  'any',
  'deckAttributeCompare',
] as const satisfies readonly CombatConditionExpression['kind'][];

/** 一种战斗条件的 `kind` 值。 */
export type CombatConditionKind = (typeof COMBAT_CONDITION_KINDS)[number];

/** 条件与动作的数值输入：固定值或本图数值节点的引用。 */
export type ActionValueOperand =
  | { readonly kind: 'constant'; readonly value: number }
  | { readonly kind: 'valueNode'; readonly nodeId: string };

/** 数值数据节点的操作；读取发生在消费输入时，不缓存战斗中的数值。 */
export type ActionValueExpression =
  | ActionValueOperand
  | {
      readonly kind: 'blackboard';
      /** 在当前调用的变量作用域中读取。 */
      readonly key: string;
      /** 仅在原生调用明确提供缺省值时设置。 */
      readonly fallback?: number;
    }
  | {
      readonly kind: 'parameter';
      /** 宏形参名称；实参仍在消费输入时求值。 */
      readonly parameter: string;
    };

/** 时间倍率曲线中的一个关键点。 */
export interface TimeScaleCurveKeyDefinition {
  /** 关键点在曲线中的横坐标。 */
  readonly time: number;
  /** 关键点的时间倍率值。 */
  readonly value: number;
  /** 进入该点时的切线斜率。 */
  readonly inTangent: number;
  /** 离开该点时的切线斜率。 */
  readonly outTangent: number;
  /** Unity 对左右切线权重的启用模式。 */
  readonly weightedMode: 0 | 1 | 2 | 3;
  /** 左切线权重。 */
  readonly inWeight: number;
  /** 右切线权重。 */
  readonly outWeight: number;
}

/** 时间膨胀使用的曲线：按名称引用公共曲线，或直接提供关键点。 */
export type TimeScaleCurveDefinition =
  | {
      /** 引用全局游戏设置中的曲线。 */
      readonly kind: 'named';
      /** 公共曲线名称。 */
      readonly key: string;
    }
  | {
      /** 在当前动作中直接定义曲线。 */
      readonly kind: 'inline';
      /** 按时间排序的关键点。 */
      readonly keys: readonly TimeScaleCurveKeyDefinition[];
    };

/** 修改已有动作黑板值时支持的运算。 */
export const ACTION_VALUE_OPERATIONS = [
  /** 用输入值替换旧值。 */
  'assign',
  /** 在旧值上加输入值。 */
  'add',
  /** 旧值乘以输入值。 */
  'multiply',
  /** 旧值除以输入值。 */
  'divide',
  /** 对输入值向下取整。 */
  'floor',
  /** 对输入值向上取整。 */
  'ceil',
  /** 把输入值四舍五入为整数。 */
  'roundToInt',
] as const;

/** 一种动作黑板修改运算。 */
export type ActionValueOperation = (typeof ACTION_VALUE_OPERATIONS)[number];

/** 用两个独立操作数计算新值时支持的运算。 */
export const ACTION_VALUE_CALCULATION_OPERATIONS = ['add', 'multiply', 'divide'] as const;

/** 一种双操作数计算，不读取目标黑板键的旧值。 */
export type ActionValueCalculationOperation = (typeof ACTION_VALUE_CALCULATION_OPERATIONS)[number];

/** 只依赖养成面板、可在战斗开始前决定的条件子集。 */
export type BuildCondition = Extract<
  CombatConditionExpression,
  {
    /** 构筑条件目前只比较最终面板中的两项四维。 */
    kind: 'deckAttributeCompare';
  }
>;
