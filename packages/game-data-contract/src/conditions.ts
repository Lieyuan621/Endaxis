/**
 * 定义技能、Buff、装备和事件响应共用的条件表达式。
 *
 * 每个条件只保存判断所需的数据，不执行代码。模拟器根据 `kind` 读取当前动作、事件、角色、
 * 敌人或 Buff 状态并返回真假；条件还可以通过 `not`、`all` 和 `any` 组合成条件树。
 */
import type { GameplayTag, GameplayTagMatchType, GameplayTagQueryType } from './gameplayTags.ts';
import {
  type BuffSingleTarget,
  type CombatObjectTypeSelection,
  type CombatTarget,
  type ComparisonOperator,
  type DamageElement,
  type DamageFeature,
  type DamageTag,
  type DamageType,
  type ElementalReaction,
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

/**
 * 模拟器在技能实例黑板中记录“当前技能是否已经命中过”的内部键。
 * 编译器生成命中条件时引用它，干员数据不应自行写入这个键。
 */
export const NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY = '__endaxis_native_skill_has_hit';

/**
 * 技能可用性、条件动作、Buff 修正和事件响应可以使用的完整条件联合。
 * 每一项的 `kind` 决定模拟器读取哪些字段以及检查哪一种战斗状态。
 */
export type CombatCondition =
  | {
      /** 从当前资源图的数据节点读取条件；编译时绑定，不缓存判断结果。 */
      kind: 'conditionNode';
      nodeId: string;
    }
  /** 原生显式返回动作的布尔结果；用于控制流，不代表战斗状态。 */
  | {
      /** 直接返回固定真假值。 */
      kind: 'constant';
      /** 条件结果。 */
      value: boolean;
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
      /** 比较镜头前向到施法者→目标方向、绕世界上轴的有符号角度。 */
      kind: 'cameraToTargetAngleCompare';
      /** 角度比较符。 */
      operator: ComparisonOperator;
      /** 与有符号角度比较的度数。 */
      value: ActionValueOperand;
    }
  | {
      /** 检查构筑是否启用了一个技能动作分支。 */
      kind: 'skillBranchEnabled';
      /** 要检查的分支键。 */
      branchKey: string;
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
      target: CombatTarget | HealTarget;
      /** target=contextTarget 时读取动作目标组中的唯一干员实例。 */
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
      /** 要检查的施法者或敌人。 */
      target: CombatTarget;
      /** 目标没有失衡系统时直接采用的结果。 */
      returnValueIfMissing: boolean;
      /** 数值比较符。 */
      operator: ComparisonOperator;
      /** 与当前失衡值比较的值。 */
      value: ActionValueOperand;
    }
  | {
      /** 比较动作环境中的一个标志值。 */
      kind: 'contextFlagEquals';
      /** 要读取的标志名称。 */
      flag: string;
      /** 期望的值。 */
      value: boolean | number | string;
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
      /** 比较当前命中角色的投射物免疫忽略等级。 */
      kind: 'eventProjectileIgnoreImmuneLevelCompare';
      /** 原生 CheckProjectileIgnoreImmuneLevel.checkType。 */
      operator: ComparisonOperator;
      /** 原生免疫忽略等级枚举的整数值。 */
      value: number;
    }
  | {
      /** 比较本次释放 Context 中已查询目标组的实例数量。 */
      kind: 'contextTargetCountCompare';
      /** 动作环境中的目标组名称。 */
      contextKey: string;
      /** 数量比较符。 */
      operator: ComparisonOperator;
      /** 与实际目标数量比较的值。 */
      value: number;
      /** 原生 CheckEntityNum.storeKey：判断时同步保存实际数量。 */
      outputKey?: string;
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
      /** 比较命名 Context 中首个目标与动作身份；连携的 trigger 也走同一目标组协议。 */
      kind: 'contextTargetIdentityMatch';
      /** 动作环境中的目标组名称。 */
      contextKey: string;
      /** 与组内首个目标比较的对象身份。 */
      other: 'actionSource' | 'actionOwner' | 'controlledOperator';
      /** 判断两者相同或不同。 */
      operator: 'equal' | 'notEqual';
    }
  | {
      /** 查询命名 Context 首个实体当前持有的 GameplayTag。 */
      kind: 'contextTargetEntityTagMatch';
      /** 动作环境中的目标组名称。 */
      contextKey: string;
      /** 标签集合匹配方式。 */
      tagQueryType: GameplayTagQueryType;
      /** 参与匹配的实体标签。 */
      tags: readonly GameplayTag[];
    }
  | {
      /** CheckBuffStackNumByTag 的首目标增强层数；空组直接 false，不读取阈值。 */
      kind: 'contextTargetBuffStackCompare';
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
      /** CheckBuffStackNumAdvanced(Id) 的命名组首目标增强层数；空组直接 false。 */
      kind: 'contextTargetBuffIdStackCompare';
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
      /** 比较当前 Context 迭代目标的有限能力实体剩余时长。 */
      kind: 'abilityEntityRemainingDurationCompare';
      /** 剩余秒数比较符。 */
      operator: ComparisonOperator;
      /** 与剩余时长比较的秒数。 */
      value: ActionValueOperand;
      /** 原生 saveCurDuration/bbKey：比较时把实际剩余时长写回当前动作黑板。 */
      outputKey?: string;
    }
  | {
      /** 检查兼容状态是否处于激活状态。 */
      kind: 'statusActive';
      /** 状态键。 */
      statusKey: string;
      /** 要检查的对象。 */
      target: CombatTarget;
      /** 状态至少需要达到的层数。 */
      minimumStacks?: number;
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
      /** 当前 beforeCastSkill 对应的连携输入命中了 ShowComboRingQte 有效阶段。 */
      kind: 'eventComboRingQteSucceeded';
    }
  | {
      /** 检查目标能力系统中是否存在仍有效的原生定时标记。 */
      kind: 'timedMarkerPresent';
      /** 定时标记所属对象。 */
      target: TimedMarkerTarget;
      /** 标记 ID 或动作黑板中的标记 ID。 */
      markerId: ActionStringOperand;
    }
  | {
      /** 检查当前能力实体或 Context 能力实体集合中仍有效的定时标记。 */
      kind: 'abilityEntityTimedMarkerPresent';
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
      /** 任一匹配即可成立的技能分类。 */
      skillTypes: readonly SkillType[];
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
      /** 检查施法者还是当前 Buff 持有者。 */
      target: 'caster' | 'buffOwner';
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
      /** 当前 Context 目标组是否包含事件目标。 */
      kind: 'contextTargetContains';
      /** 要检查的动作目标组。 */
      parentContextKey: string;
      /** 当前只支持检查事件目标。 */
      child: 'eventTarget';
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
      /** 比较治疗事件的来源与目标身份。 */
      kind: 'eventSourceTargetMatch';
      /** 判断事件来源与目标相同或不同。 */
      operator: 'equal' | 'notEqual';
    }
  | {
      /** 比较当前动作宿主与事件目标，不把宿主身份猜成事件来源。 */
      kind: 'eventActionOwnerTargetMatch';
      /** 判断动作宿主与事件目标相同或不同。 */
      operator: 'equal' | 'notEqual';
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
  /** 承伤事件的伤害来源是否是当前现实时间下的主控干员。 */
  | {
      /** 条件种类判别值。 */
      kind: 'eventSourceControlled';
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
      /** 检查敌人身上是否存在指定元素附着。 */
      kind: 'elementalInflictionPresent';
      /** 任一匹配即可成立的元素。 */
      elements: DamageElement | readonly DamageElement[];
      /** 至少需要达到的附着层数。 */
      minimumStacks?: number;
    }
  | {
      /** 检查指定复合元素反应是否生效。 */
      kind: 'elementalReactionActive';
      /** 要检查的元素反应。 */
      reaction: ElementalReaction;
      /** 反应至少需要达到的等级。 */
      minimumLevel?: number;
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

/** `CombatCondition` 中全部条件种类，供校验和条件分派使用。 */
export const COMBAT_CONDITION_KINDS = [
  'constant',
  'combatActive',
  'singleEnemyPresent',
  'casterControlled',
  'characterTypeIn',
  'operatorRoleIn',
  'enemyRankIn',
  'enemySuperArmorCompare',
  'cameraToTargetAngleCompare',
  'skillBranchEnabled',
  'targetStaggered',
  'healthCompare',
  'poiseCompare',
  'contextFlagEquals',
  'actionValueCompare',
  'buffBlackboardValueCompare',
  'probability',
  'contextTargetCountCompare',
  'contextTargetObjectTypeMatch',
  'actionInputTargetObjectTypeMatch',
  'actionInputTargetIdentityMatch',
  'contextTargetIdentityMatch',
  'contextTargetEntityTagMatch',
  'contextTargetBuffStackCompare',
  'contextTargetBuffIdStackCompare',
  'abilityEntityRemainingDurationCompare',
  'statusActive',
  'buffStackCompare',
  'buffTagIdCountCompare',
  'currentBuffStackCompare',
  'entityTagMatch',
  'buffIdStackCompare',
  'timedMarkerPresent',
  'globalCooldownPresent',
  'casterComboPending',
  'eventComboRingQteSucceeded',
  'abilityEntityTimedMarkerPresent',
  'eventDamageTagsMatch',
  'eventDamageGameplayTagsMatch',
  'eventDamageFeaturesMatch',
  'eventDamageTypeIn',
  'eventInflictionElementIn',
  'eventPhysicalInflictionTypeIn',
  'eventProjectilePerfectDodgeCooldownEquals',
  'eventProjectileIgnoreImmuneLevelCompare',
  'eventSkillTypeIn',
  'eventCustomAbilityNameMatch',
  'currentSkillTypeIn',
  'originSkillTypeIn',
  'contextTargetContains',
  'eventSkillIdIn',
  'eventSkillCastMatchesBuffSource',
  'eventBuffIdMatch',
  'eventBuffEndedEarly',
  'eventBuffTagsMatch',
  'eventTargetBuffCountCompare',
  'eventHealTagsMatch',
  'eventSpGainMatch',
  'eventConsumedBuffLayerCompare',
  'eventSourceTargetMatch',
  'eventActionOwnerTargetMatch',
  'eventOverheal',
  'eventSourceMatchesBuffSource',
  'eventSourceMatchesBuffSourceEntitySource',
  'eventSourceControlled',
  'buffSourceMatchesOwner',
  'ownerSpawnedAbilityEntityPresent',
  'elementalInflictionPresent',
  'elementalReactionActive',
  'not',
  'all',
  'any',
  'deckAttributeCompare',
] as const satisfies readonly CombatCondition['kind'][];

/** 一种战斗条件的 `kind` 值。 */
export type CombatConditionKind = (typeof COMBAT_CONDITION_KINDS)[number];

/** 条件和动作使用的数值常量或当前动作黑板引用。 */
export type ActionValueOperand =
  | {
      /** 从当前资源图读取数值表达式，在使用点按当前作用域求值。 */
      kind: 'valueNode';
      nodeId: string;
    }
  | {
      /** 从当前动作黑板读取。 */
      kind: 'blackboard';
      /** 要读取的黑板键。 */
      key: string;
      /** 仅在原生调用点明确使用 GetValueOrDefault 时携带；缺省仍严格报错。 */
      fallback?: number;
    }
  | {
      /** 直接使用固定数值。 */
      kind: 'constant';
      /** 固定数值。 */
      value: number;
    }
  | {
      /** 引用宏调用参数；只允许出现在声明了同名参数的宏图内。 */
      kind: 'parameter';
      /** 形参名；在使用点求值，不做调用时快照。 */
      parameter: string;
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
  CombatCondition,
  {
    /** 构筑条件目前只比较最终面板中的两项四维。 */
    kind: 'deckAttributeCompare';
  }
>;
