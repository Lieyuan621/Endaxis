/**
 * 定义整个战斗数据包共用的基础名称、目标选择和简单数值类型。
 *
 * 干员、技能、Buff、装备、条件和动作都会引用这里的类型。集中定义可以让生成器、编辑器
 * 和模拟器对元素、技能类型、战斗对象及动作目标采用同一种解释。
 */
/** 干员的四项基础属性。 */
export const OPERATOR_ATTRIBUTES = [
  /** 力量。 */
  'strength',
  /** 敏捷。 */
  'agility',
  /** 智识。 */
  'intellect',
  /** 意志。 */
  'will',
] as const;

/** 能力查询可以识别的战斗对象类型。 */
export const COMBAT_OBJECT_TYPES = [
  /** 无有效对象类型。 */
  'invalid',
  /** 可操控角色。 */
  'character',
  /** 敌人主体。 */
  'enemy',
  /** 可交互对象。 */
  'interactive',
  /** 投射物。 */
  'projectile',
  /** 工厂区域对象。 */
  'factoryRegion',
  /** 非玩家角色。 */
  'npc',
  /** 技能创建的能力实体。 */
  'abilityEntity',
  /** 演出实体。 */
  'cinematicEntity',
  /** 远端工厂实体。 */
  'remoteFactoryEntity',
  /** 生物实体。 */
  'creature',
  /** 游戏中的 GodEntity 类型实体。 */
  'godEntity',
  /** 敌人的独立部位。 */
  'enemyPart',
  /** 社交建筑实体。 */
  'socialBuilding',
] as const;
/** 一种战斗对象类型。 */
export type CombatObjectType = (typeof COMBAT_OBJECT_TYPES)[number];
/** 对象类型查询的选择范围；空数组不匹配对象，`all` 匹配全部。 */
export type CombatObjectTypeSelection = readonly CombatObjectType[] | 'all';

/** 干员养成、面板和条件判断共同使用的四维属性身份。 */
export type OperatorAttribute = (typeof OPERATOR_ATTRIBUTES)[number];

/** 动作使用的字符串常量，或从当前动作黑板读取字符串的引用。 */
export type ActionStringOperand =
  | string
  | {
      /** 读取字符串的当前动作黑板键。 */
      readonly blackboardKey: string;
    };

/** HealAction 的 MultiplyAttributeCalculation 可读取的已支持来源属性。 */
export type HealCalculationAttribute = OperatorAttribute | 'maxHealth';

/** 游戏数据中允许出现的干员星级。 */
export const OPERATOR_RARITIES = [4, 5, 6] as const;

/** 干员定义允许的星级；数据适配器不得传入定义外的数值。 */
export type OperatorRarity = (typeof OPERATOR_RARITIES)[number];

/** 干员和武器使用的武器类型。 */
export const OPERATOR_WEAPON_TYPES = [
  /** 单手剑。 */
  'sword',
  /** 双手剑。 */
  'greatsword',
  /** 长柄武器。 */
  'polearm',
  /** 手铳。 */
  'handcannon',
  /** 施术单元。 */
  'arts-unit',
] as const;

/** 用于校验干员与武器配置兼容性的武器类型。 */
export type OperatorWeaponType = (typeof OPERATOR_WEAPON_TYPES)[number];

/** 干员的战斗职业。 */
export const OPERATOR_ROLES = [
  /** 近卫。 */
  'guard',
  /** 术师。 */
  'caster',
  /** 重装。 */
  'defender',
  /** 先锋。 */
  'vanguard',
  /** 辅助。 */
  'supporter',
  /** 突击。 */
  'striker',
] as const;

/** 干员定义和 UI 分类共同使用的战斗定位。 */
export type OperatorRole = (typeof OPERATOR_ROLES)[number];

/** 干员和伤害使用的五种元素。 */
export const DAMAGE_ELEMENTS = [
  /** 物理。 */
  'physical',
  /** 灼热。 */
  'heat',
  /** 寒冷。 */
  'cryo',
  /** 电磁。 */
  'electric',
  /** 自然。 */
  'nature',
] as const;

/** 干员和伤害表现使用的元素身份，包含物理。 */
export type DamageElement = (typeof DAMAGE_ELEMENTS)[number];

/** 可以形成元素附着的四种非物理元素。 */
export const INFLICTION_ELEMENTS = ['heat', 'electric', 'cryo', 'nature'] as const;

/** 能附着到敌人并参与复合状态的非物理元素。 */
export type InflictionElement = (typeof INFLICTION_ELEMENTS)[number];

/** 生命伤害计算使用的伤害类型。 */
export const DAMAGE_TYPES = [
  /** 物理伤害。 */
  'physical',
  /** 无视通常抗性计算的真实伤害。 */
  'true',
  /** 灼热伤害。 */
  'heat',
  /** 电磁伤害。 */
  'electric',
  /** 寒冷伤害。 */
  'cryo',
  /** 生命汲取伤害。 */
  'lifeDrain',
  /** 自然伤害。 */
  'nature',
  /** 以太伤害。 */
  'ether',
] as const;

/** 生命伤害公式选择抗性和特殊路径时使用的伤害类型。 */
export type DamageType = (typeof DAMAGE_TYPES)[number];

/** 当前模拟器识别的复合元素反应。 */
export const ELEMENTAL_REACTIONS = [
  /** 导电。 */
  'electrification',
  /** 腐蚀。 */
  'corrosion',
] as const;

/** 元素附着组合形成、可被状态和事件引用的复合反应。 */
export type ElementalReaction = (typeof ELEMENTAL_REACTIONS)[number];

/** 已解析伤害命中携带的可叠加分类。 */
export const DAMAGE_TAGS = [
  /** 普通攻击伤害。 */
  'normalAttack',
  /** 普通攻击连段最后一击。 */
  'normalAttackLastCombo',
  /** 重击伤害。 */
  'powerAttack',
  /** 战技伤害。 */
  'normalSkill',
  /** 连携技伤害。 */
  'comboSkill',
  /** 终结技伤害。 */
  'ultimateSkill',
  /** 下落攻击伤害。 */
  'plungingAttack',
  /** 冲刺攻击伤害。 */
  'dashAttack',
  /** 灼热爆发伤害。 */
  'fireBurst',
  /** 电磁爆发伤害。 */
  'electricBurst',
  /** 寒冷爆发伤害。 */
  'cryoBurst',
  /** 自然爆发伤害。 */
  'natureBurst',
  /** 灼热异常伤害。 */
  'fireAbnormal',
  /** 电磁异常伤害。 */
  'electricAbnormal',
  /** 寒冷异常伤害。 */
  'cryoAbnormal',
  /** 自然异常伤害。 */
  'natureAbnormal',
] as const;

/** 单次伤害携带的可叠加语义分类，供公式、事件和机制筛选。 */
export type DamageTag = (typeof DAMAGE_TAGS)[number];

/** 不参与技能类型归类，但会影响命中处理或事件筛选的伤害特征。 */
export const DAMAGE_FEATURES = [
  /** 可以削减弱点值。 */
  'canBreakWeakness',
  /** 具有粉碎效果。 */
  'crush',
  /** 具有击飞效果。 */
  'airborne',
  /** 具有击倒效果。 */
  'knockDown',
  /** 具有碎冰效果。 */
  'shatter',
  /** 持续伤害。 */
  'dot',
  /** 残留区域造成的伤害。 */
  'remainArea',
  /** 天赋造成的伤害。 */
  'talentDamage',
  /** 物理异常造成的伤害。 */
  'physicalInfliction',
] as const;

/** 单次伤害携带的一种处理特征。 */
export type DamageFeature = (typeof DAMAGE_FEATURES)[number];

/** 技能在构筑、事件和伤害分类中使用的大类。 */
export const SKILL_TYPES = [
  /** 普通攻击。 */
  'basicAttack',
  /** 战技。 */
  'battleSkill',
  /** 连携技。 */
  'comboSkill',
  /** 终结技。 */
  'ultimate',
  /** 处决技。 */
  'finisher',
  /** 下落攻击。 */
  'plungingAttack',
  /** 完美闪避成功后由中心状态机触发的隐藏技能。 */
  'dodge',
] as const;

/** 技能库、养成等级和战斗事件共同使用的技能大类。 */
export type SkillType = (typeof SKILL_TYPES)[number];

/** 可从干员养成方案读取等级的四类主动技能。 */
export const SKILL_LEVEL_SOURCES = [
  /** 从普通攻击等级读取。 */
  'basicAttack',
  /** 从战技等级读取。 */
  'battleSkill',
  /** 从连携技等级读取。 */
  'comboSkill',
  /** 从终结技等级读取。 */
  'ultimate',
] as const;

/** 指明一个技能组从干员养成方案的哪个字段读取等级。 */
export type SkillLevelSource = (typeof SKILL_LEVEL_SOURCES)[number];

/** 宽松生成结果可能明确缺少的能力类别。 */
export const OPERATOR_MISSING_CAPABILITIES = [
  /** 缺少技能的动作或伤害行为。 */
  'skillBehavior',
  /** 缺少技能可用条件、冷却或资源约束。 */
  'skillAvailability',
  /** 缺少天赋效果。 */
  'talentEffects',
  /** 缺少潜能效果。 */
  'potentialEffects',
  /** 缺少运行该干员所需的通用机制。 */
  'runtimeDependencies',
] as const;

/** 宽松转换允许省略、但必须向使用者声明的能力类别。 */
export type OperatorMissingCapability = (typeof OPERATOR_MISSING_CAPABILITIES)[number];

/**
 * 干员定义相对原始数据的转换支持状态。
 * 这里只保存稳定、非本地化的能力摘要；解析异常、文件路径等审计细节留在生成报告中。
 */
export interface OperatorConversionSupport {
  /** `complete` 表示已覆盖全部已知能力，`partial` 表示仍有明确缺项。 */
  readonly completeness: 'complete' | 'partial';
  /** 宽松转换时未能生成的能力列表。 */
  readonly missingCapabilities: readonly {
    /** 缺失能力的类别。 */
    readonly capability: OperatorMissingCapability;
    /** 仅当缺失能力能明确归到某个技能组时，给出该技能组的稳定键。 */
    readonly skillGroupKeys?: readonly string[];
  }[];
}

/** 战斗动作可以直接增减的资源。 */
export const COMBAT_RESOURCES = [
  /** 全队共享的行动技力。 */
  'sp',
  /** 干员个人的终结技能量。 */
  'ultimateEnergy',
] as const;

/** 通用技能步骤当前允许结算的共享或个人战斗资源。 */
export type CombatResource = (typeof COMBAT_RESOURCES)[number];

/** 最常用的施法者与当前敌人目标。 */
export const COMBAT_TARGETS = ['caster', 'enemy'] as const;

/** 干员 DSL 中无需多敌人寻址的语义目标。 */
export type CombatTarget = (typeof COMBAT_TARGETS)[number];

/** 普通定时标记可以归属的对象。 */
export const TIMED_MARKER_TARGETS = [
  /** 当前动作的施法者。 */
  ...COMBAT_TARGETS,
  /** 触发事件的对端对象。 */
  'eventTarget',
  /** 当前 Buff 的持有者。 */
  'buffOwner',
  /** 当前 Buff 的来源。 */
  'buffSource',
] as const;

/** 定时标记还可明确落到触发当前响应的事件目标。 */
export type TimedMarkerTarget = (typeof TIMED_MARKER_TARGETS)[number];

/** 全局冷却按角色身份索引；Buff 的持有者与来源在执行时解析，不等同于施法者。 */
export const GLOBAL_COOLDOWN_TARGETS = ['caster', 'buffOwner', 'buffSource'] as const;
/** 全局冷却记录可以归属的一种对象。 */
export type GlobalCooldownTarget = (typeof GLOBAL_COOLDOWN_TARGETS)[number];

/** 全局时间膨胀可以排除的对象。 */
export const TIME_DILATION_IGNORE_TARGETS = [...COMBAT_TARGETS, 'controlled'] as const;

/** 全局时间膨胀还可在动作执行帧排除当前主控干员。 */
export type TimeDilationIgnoreTarget = (typeof TIME_DILATION_IGNORE_TARGETS)[number];

/** 局部时间膨胀可以作用的实体。 */
export const TIME_DILATION_ENTITY_TARGETS = [...COMBAT_TARGETS, 'controlled', 'buffOwner'] as const;

/** 实体时间膨胀可作用于普通技能目标、当前主控，或 Buff 生命周期中的实际接收者。 */
export type TimeDilationEntityTarget = (typeof TIME_DILATION_ENTITY_TARGETS)[number];

/** 需要在运行时解析成一个具体 Buff 容器的目标。 */
export const BUFF_SINGLE_TARGETS = [
  /** 当前施法者或当前敌人。 */
  ...COMBAT_TARGETS,
  /** 当前主控干员。 */
  'controlledOperator',
  /** 当前动作所属的能力实体。 */
  'currentAbilityEntity',
  /** 触发事件的对端对象。 */
  'eventTarget',
  /** 发布触发事件的对象。 */
  'eventSource',
  /** 当前 Buff 的持有者。 */
  'buffOwner',
  /** 当前 Buff 的来源。 */
  'buffSource',
  /** forEachContextTarget 正在迭代的动态实体；只允许在该作用域内求值。 */
  'currentTarget',
  /** 本次动作序列的输入目标；点燃回调中为点燃者，不等于 Buff 来源。 */
  'actionInputTarget',
] as const;

/** 需要解析到单个 Buff 容器的实例级目标。 */
export type BuffSingleTarget = (typeof BUFF_SINGLE_TARGETS)[number];

/** 施加 Buff 时可以选择的单体或队伍目标。 */
export const BUFF_APPLICATION_TARGETS = [
  /** 所有单体 Buff 目标。 */
  ...BUFF_SINGLE_TARGETS,
  /** 全队干员。 */
  'party',
  /** 除施法者外的全队干员。 */
  'partyExceptCaster',
  /** 除施法者以及同角色类型实体外的全队干员。 */
  'partyExceptCasterAndSameCharacterType',
  /** 施法者和当前主控干员。 */
  'casterAndControlledOperator',
  /** 施法者和除施法者外生命比例最低的干员。 */
  'casterAndLowestHealthRatioOperatorExceptCaster',
] as const;

/** Buff 施加允许面向单体、能力实体，以及由原生队伍选择器严格证明的集合。 */
export type BuffApplicationTarget = (typeof BUFF_APPLICATION_TARGETS)[number];

/** 施加 Buff 时可以记录为来源的对象。 */
export const BUFF_APPLICATION_SOURCES = [
  /** 当前施法者或当前敌人。 */
  ...COMBAT_TARGETS,
  /** 当前动作所属的能力实体。 */
  'currentAbilityEntity',
  /** 发布触发事件的对象。 */
  'eventSource',
  /** 当前 Buff 的来源。 */
  'buffSource',
  /** 当前 Buff 的持有者。 */
  'buffOwner',
] as const;

/** Buff 来源允许保留能力实体 ActionOwner 的稳定身份。 */
export type BuffApplicationSource = (typeof BUFF_APPLICATION_SOURCES)[number];

/** 条件表达式支持的比较符。 */
export const COMPARISON_OPERATORS = [
  /** 等于。 */
  'equal',
  /** 不等于。 */
  'notEqual',
  /** 大于。 */
  'greater',
  /** 大于或等于。 */
  'greaterOrEqual',
  /** 小于。 */
  'less',
  /** 小于或等于。 */
  'lessOrEqual',
] as const;

/** 数据驱动条件中支持的数值比较运算。 */
export type ComparisonOperator = (typeof COMPARISON_OPERATORS)[number];

/** 所有等级共用一个值，或为每个等级分别提供值。 */
export type LevelValues = number | readonly number[];

/** 一次伤害可以选择的基础计算方式。 */
export const DAMAGE_CALCULATIONS = [
  /** 使用标准伤害公式。 */
  'standard',
  /** 使用破防攻击公式。 */
  'breakingAttack',
  /** 直接按指定属性计算。 */
  'attribute',
] as const;

/** 命中进入标准或破防专用公式前处理的计算路径。 */
export type DamageCalculation = (typeof DAMAGE_CALCULATIONS)[number];

/** 战斗资源变化可以作用的范围。 */
export const RESOURCE_RECIPIENTS = [
  /** 当前施法者。 */
  'caster',
  /** 整个队伍。 */
  'team',
] as const;

/** 资源变化步骤当前允许作用的施法者或全队范围。 */
export type ResourceRecipient = (typeof RESOURCE_RECIPIENTS)[number];

/** 治疗动作支持的目标选择方式。 */
export const HEAL_TARGETS = [
  /** 当前敌人目标。 */
  'enemy',
  /** 当前施法者。 */
  'caster',
  /** 当前 Buff 的来源。 */
  'buffSource',
  /** 当前 Buff 的持有者。 */
  'buffOwner',
  /** 当前主控干员。 */
  'controlledOperator',
  /** 全队生命比例最低的干员。 */
  'lowestHealthRatioOperator',
  /** 除当前主控外生命比例最低的干员。 */
  'lowestHealthRatioOperatorExceptControlled',
  /** 当前动作环境中绑定的目标。 */
  'contextTarget',
  /** `forEachContextTarget` 正在迭代的对象。 */
  'currentTarget',
  /** 本次技能施放输入中保存的目标。 */
  'actionInputTarget',
] as const;

/** 当前原生治疗样本能够严格归约的队伍目标身份。 */
export type HealTarget = (typeof HEAL_TARGETS)[number];

/** 技力增加的结算种类。 */
export const SP_GAIN_KINDS = [
  /** 正常获得技力。 */
  'gain',
  /** 返还此前消耗的技力。 */
  'refund',
] as const;

/** 技力增加是否计入返还技力；返还部分再次被消耗时不会重复转化为终结技能量。 */
export type SpGainKind = (typeof SP_GAIN_KINDS)[number];

/** 获得技力的动作来源。 */
export const SP_GAIN_SOURCES = [
  /** 未细分的默认来源。 */
  'default',
  /** 普通攻击。 */
  'normalAttack',
  /** 重击。 */
  'powerAttack',
  /** 其他技能。 */
  'skill',
] as const;

/** 原生共享 SP 获取效率用于区分普攻、重击和其他动作来源。 */
export type SpGainSource = (typeof SP_GAIN_SOURCES)[number];

/** 物理异常的类型。 */
export const PHYSICAL_INFLICTION_TYPES = [
  /** 击飞。 */
  'airborne',
  /** 击倒。 */
  'knockDown',
  /** 破裂。 */
  'fracture',
  /** 粉碎。 */
  'crush',
] as const;

/** 一种物理异常类型。 */
export type PhysicalInflictionType = (typeof PHYSICAL_INFLICTION_TYPES)[number];

/** 原生 EnemyTemplateData.rank；与用于筛选和展示的五档 EnemyTier 无关。 */
export const ENEMY_RANKS = ['mob', 'elite', 'boss'] as const;

/** 敌人的原生强度分级。 */
export type EnemyRank = (typeof ENEMY_RANKS)[number];

/** 动作黑板可以保存的标量值。 */
export type ActionBlackboardValue = string | number | null;
