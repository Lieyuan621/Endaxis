/**
 * 定义一名干员的基础资料、属性成长、技能组、天赋、潜能和常驻战斗能力。
 *
 * 生成器把游戏中的角色与养成数据整理成这里的结构；构筑界面用它创建干员方案，模拟器
 * 再按所选等级和养成项安装技能、Buff、事件响应、能力实体及角色专属状态显示。
 */
import {
  type CombatResource,
  type DamageElement,
  type ElementalReaction,
  type LevelValues,
  type OperatorAttribute,
  type OperatorConversionSupport,
  type OperatorRarity,
  type OperatorRole,
  type OperatorWeaponType,
  type SkillLevelSource,
} from './primitives.ts';
import { type BuildCondition, type CombatCondition } from './conditions.ts';
import type { ActionGraphReference, ActionGraphResourceDefinition } from './actionGraph.ts';
import { type CombatEventTrigger } from './actions.ts';
import {
  type ComboSkillPriority,
  type OperatorAbilityEntityDefinitions,
  type SkillGroupDefinition,
} from './skills.ts';
import { type OperatorBuffDefinitions } from './buffs.ts';
import { type AbilityEvent, type AbilityEventResponse } from './abilityEvents.ts';

/** 当前模拟器支持干员被动直接监听的能力事件。 */
export const OPERATOR_PASSIVE_ABILITY_EVENTS = [
  'abilityEntitySpawned',
  'abilityEntityFinished',
  'addedBuff',
  'skillSpGained',
  'receiveHeal',
] as const;
/** 干员被动可以监听的一种能力事件。 */
export type OperatorPassiveAbilityEvent = (typeof OPERATOR_PASSIVE_ABILITY_EVENTS)[number];

/** 干员各等级四维、基础攻击与基础生命的成长定义表。 */
export type AttributeGrowthDefinition = Record<OperatorAttribute, readonly number[]> & {
  /** 各等级的基础攻击力。 */
  baseAttack: readonly number[];
  /** 各等级的基础生命值。 */
  baseHealth: readonly number[];
};

/** 天赋阵列节点提供的四维属性；未配置时使用全局主属性规则。 */
export interface TrustAttributeBonusDefinition {
  /** 各信赖节点提供的属性值。 */
  readonly values: readonly number[];
  /** 每个节点增加的具体属性或相对主副属性。 */
  readonly attributes: readonly (OperatorAttribute | 'main' | 'secondary')[];
}

/** 未单独声明时，干员四个信赖节点依次增加的主属性。编译器和编辑器共同读取。 */
export const DEFAULT_TRUST_ATTRIBUTE_BONUS = {
  /** 四个节点依次增加 10、15、15、20 点。 */
  values: [10, 15, 15, 20],
  /** 默认全部增加干员主属性。 */
  attributes: ['main'],
} as const satisfies TrustAttributeBonusDefinition;

/** 天赋和潜能可以直接修改的静态面板属性。 */
export const UPGRADE_BASE_PANEL_STATS = [
  'health',
  'defense',
  'criticalRate',
  'artsIntensity',
] as const;

/**
 * 构筑确定后写入角色静态属性基础层的面板字段。
 * 这里只包含能从面板继续无损传入战斗快照的属性；按伤害类型筛选的战斗属性不属于此集合。
 */
export type UpgradeBasePanelStat = (typeof UPGRADE_BASE_PANEL_STATS)[number];

/** 天赋和潜能可以提供常驻增伤的目标分类。 */
export const UPGRADE_STATIC_DAMAGE_INCREASE_TARGETS = [
  'normalAttack',
  'battleSkill',
  'physical',
  'electric',
  'cryo',
] as const;

/**
 * 潜能在构筑期确定、在每次命中按伤害语义选择的增伤属性。
 * 普攻目标由命中标签选择，因此能够覆盖重击、下落攻击和冲刺攻击，不等同于 SkillType。
 */
export type UpgradeStaticDamageIncreaseTarget =
  (typeof UPGRADE_STATIC_DAMAGE_INCREASE_TARGETS)[number];

/**
 * 天赋和潜能能够施加到编译结果的结构化修正。
 * 新种类必须有明确合并规则，不能通过任意对象补丁修改技能定义。
 */
export type UpgradeModifierDefinition =
  | {
      /** 满足条件时增加伤害。 */
      kind: 'addConditionalDamage';
      /** 增伤生效条件。 */
      condition: CombatCondition;
      /** 单个增伤值或按养成等级排列的增伤值。 */
      values: LevelValues;
    }
  | {
      /** 启用技能中的一个可选动作分支。 */
      kind: 'enableSkillBranch';
      /** 目标技能组。 */
      skillGroupKey: string;
      /** 目标分支。 */
      branchKey: string;
    }
  | {
      /** 乘算某个技能步骤产生效果的持续时间。 */
      kind: 'multiplyEffectDuration';
      /** 目标技能组。 */
      skillGroupKey: string;
      /** 目标步骤。 */
      stepKey: string;
      /** 持续时间乘数。 */
      multiplier: number;
    }
  | {
      /** 乘算技能的资源费用。 */
      kind: 'multiplySkillCost';
      /** 目标技能组。 */
      skillGroupKey: string;
      /** 组内存在隐藏替换技能时，明确限定原生修正指向的可养成技能。 */
      skillKey?: string;
      /** 要修改的资源。 */
      resource: CombatResource;
      /** 费用乘数。 */
      multiplier: number;
    }
  | {
      /** 设置一个技能步骤的效果系数。 */
      kind: 'setEffectiveness';
      /** 目标技能组。 */
      skillGroupKey: string;
      /** 目标步骤。 */
      stepKey: string;
      /** 新的效果系数。 */
      value: number;
    }
  | {
      /** 将构筑期常驻增伤写入对应伤害属性；数值使用小数，例如 15% 写作 0.15。 */
      kind: 'addStaticDamageIncrease';
      /** 增伤对应的攻击、元素或目标分类。 */
      target: UpgradeStaticDamageIncreaseTarget;
      /** 加入该分类的增伤值。 */
      value: number;
    }
  | {
      /** 原生 HealOutputIncrease / HealTakenIncrease 的基础加算。 */
      kind: 'addStaticHealingIncrease';
      /** 增加治疗输出还是受到治疗。 */
      target: 'output' | 'taken';
      /** 加入的治疗加成值。 */
      value: number;
    }
  | {
      /** 修改一个技能组的独立面板数值。 */
      kind: 'addSkillStat';
      /** 目标技能组。 */
      skillGroupKey: string;
      /** 要修改的技能数值。 */
      stat: 'criticalRate';
      /** 加入的数值。 */
      value: number;
    }
  | {
      /**
       * 养成效果直接修补目标技能组编译后的初始动作黑板。
       * `operation` 使用与原生 SkillBBModifier 相同的 add/multiply/assign 语义；
       * `value` 按天赋/潜能等级解析，而不是按技能等级解析。
       */
      kind: 'patchSkillBlackboard';
      /** 目标技能组。 */
      skillGroupKey: string;
      /** 多形态技能组只修改指定技能定义；省略时修改组内全部形态。 */
      skillKey?: string;
      /** 要修改的技能黑板键。 */
      blackboardKey: string;
      /** 对原值执行加算、乘算或直接赋值。 */
      operation: 'add' | 'multiply' | 'assign';
      /** 单个数值或按养成等级排列的数值。 */
      value: LevelValues;
      /** 仅该养成等级区间安装此补丁；用于原生按等级切换不同标志键的结构。 */
      minimumUpgradeLevel?: number;
      /** 超过此养成等级后不再安装此补丁。 */
      maximumUpgradeLevel?: number;
      /** 原生 activeCondition；按最终构筑属性选择是否应用。 */
      condition?: BuildCondition;
    }
  | {
      /** 修改已启用天赋安装的隐藏被动技能黑板；目标天赋关闭时不产生被动程序。 */
      kind: 'patchPassiveBlackboard';
      /** 目标隐藏被动技能。 */
      passiveSkillKey: string;
      /** 要修改的被动黑板键。 */
      blackboardKey: string;
      /** 对原值执行加算、乘算或直接赋值。 */
      operation: 'add' | 'multiply' | 'assign';
      /** 单个数值或按养成等级排列的数值。 */
      value: LevelValues;
    }
  | {
      /** 乘算整个技能组造成的伤害。 */
      kind: 'multiplySkillDamage';
      /** 目标技能组。 */
      skillGroupKey: string;
      /** 伤害乘数。 */
      multiplier: number;
    }
  | {
      /** 乘算一个具体技能步骤造成的伤害。 */
      kind: 'multiplyStepDamage';
      /** 目标技能组。 */
      skillGroupKey: string;
      /** 目标步骤。 */
      stepKey: string;
      /** 伤害乘数。 */
      multiplier: number;
    }
  | {
      /** 乘算技能冷却时间。 */
      kind: 'multiplySkillCooldown';
      /** 目标技能组。 */
      skillGroupKey: string;
      /** 只修改指定分支；省略时修改整个技能组。 */
      branchKey?: string;
      /** 冷却时间乘数。 */
      multiplier: number;
    }
  | {
      /** 为技能冷却时间增加固定帧数。 */
      kind: 'addSkillCooldownFrames';
      /** 目标技能组。 */
      skillGroupKey: string;
      /** 多形态技能组只修改指定技能定义；省略时修改组内全部形态。 */
      skillKey?: string;
      /** 增加的冷却帧数。 */
      frames: number;
      /** 构筑满足该条件时才应用。 */
      condition?: BuildCondition;
    }
  | {
      /** 为一项或多项干员四维增加固定值。 */
      kind: 'addBuildAttribute';
      /** 要增加的四维属性。 */
      attributes: readonly OperatorAttribute[];
      /** 每项属性增加的数值。 */
      value: number;
    }
  | {
      /**
       * 修改静态面板属性的基础层。`flat` 在基础倍率前加算，`percent` 以小数累加到基础倍率。
       * 该边界对应原生八槽公式的基础加算与基础倍率，但名称描述实际运算，避免泄漏原生枚举名。
       */
      kind: 'modifyBasePanelStat';
      /** 要修改的基础面板属性。 */
      stat: UpgradeBasePanelStat;
      /** 使用固定加值或百分比加值。 */
      operation: 'flat' | 'percent';
      /** 加入的数值。 */
      value: number;
    }
  | {
      /** 增加指定元素反应的持续时间。 */
      kind: 'addReactionDuration';
      /** 目标元素反应。 */
      reaction: ElementalReaction;
      /** 单个秒数或按养成等级排列的秒数。 */
      seconds: LevelValues;
    }
  | {
      /** 增加指定元素反应的效果系数。 */
      kind: 'addReactionEffectiveness';
      /** 目标元素反应。 */
      reaction: ElementalReaction;
      /** 单个加值或按养成等级排列的加值。 */
      value: LevelValues;
    };

/** `UpgradeModifierDefinition` 中全部修正种类，供校验和分派使用。 */
export const UPGRADE_MODIFIER_KINDS = [
  'addConditionalDamage',
  'enableSkillBranch',
  'multiplyEffectDuration',
  'multiplySkillCost',
  'setEffectiveness',
  'addSkillStat',
  'patchSkillBlackboard',
  'patchPassiveBlackboard',
  'multiplySkillDamage',
  'multiplyStepDamage',
  'multiplySkillCooldown',
  'addSkillCooldownFrames',
  'addBuildAttribute',
  'modifyBasePanelStat',
  'addStaticDamageIncrease',
  'addStaticHealingIncrease',
  'addReactionDuration',
  'addReactionEffectiveness',
] as const satisfies readonly UpgradeModifierDefinition['kind'][];

/** 一种天赋或潜能修正。 */
export type UpgradeModifierKind = (typeof UPGRADE_MODIFIER_KINDS)[number];

/** 天赋和潜能的事件响应可以监听的事件。 */
export type UpgradeEvent =
  | Extract<
      CombatEventTrigger,
      {
        /** 技力获取事件。 */
        kind: 'spGained';
      }
    >
  /** 元素附着被复合反应消费。 */
  | {
      /** 事件种类判别值。 */
      kind: 'elementalAttachmentConsumed';
    }
  /** 原生 OnConsumeBuff：只匹配由当前干员作为 finish source 消费的明确 Buff 身份。 */
  | {
      /** Buff 消费事件。 */
      kind: 'buffConsumed';
      /** 任一匹配即可触发的 Buff ID。 */
      buffIds: readonly string[];
    }
  | Extract<
      CombatEventTrigger,
      {
        /** 技能命中事件。 */
        kind: 'skillHit';
      }
    >;

/** 天赋或潜能在战斗事件发生后执行的一项响应。 */
export interface UpgradeEventHandlerDefinition {
  /** 要监听的事件及其筛选参数。 */
  event: UpgradeEvent;
  /** 监听器实例的原生常量黑板；数组按当前养成等级解析。 */
  blackboard?: Readonly<Record<string, LevelValues>>;
  /** 事件触发后执行的动作序列。 */
  sequence: ActionGraphReference;
}

/**
 * 天赋启用后随干员能力系统一起安装的常驻被动。
 * 它复用技能步骤协议，但不属于技能库，也不能被时间轴输入释放。
 */
export interface OperatorPassiveSkillDefinition {
  /** 正式被动程序的局部主图与宏；不借用干员总图。 */
  readonly actionGraph: ActionGraphResourceDefinition;
  /** 被动技能在干员定义中的唯一名称。 */
  key: string;
  /** 角色基础被动跟随其所属原生技能组；养成附加被动不设置该字段。 */
  levelSource?: SkillLevelSource;
  /** 被动启用序列读取的初始黑板；数组按所属技能或当前养成等级解析。 */
  blackboard?: Readonly<Record<string, LevelValues>>;
  /** 原生被动 Skill.Enable 时执行的有序行为。 */
  enableSequence: ActionGraphReference;
  /** 被动 Skill 的原生事件响应；与启用程序共享被动黑板。 */
  abilityEventResponses?: readonly AbilityEventResponse<OperatorPassiveAbilityEvent>[];
}

/** 一个天赋槽或潜能槽的等级、修正和被动能力。 */
export interface OperatorUpgradeDefinition {
  /** 初始化及养成事件响应的所属图；纯属性/附着 Buff 配置不需要程序图。 */
  readonly actionGraph?: ActionGraphResourceDefinition;
  /** 这一天赋或潜能可以选择的等级数量。 */
  levels: number;
  /**
   * 原生效果已经取证，但在 Endaxis 固定模拟模型中没有可观察结果。
   * 这是完整转换结论，不是尚未建模；保留原因以便模型边界改变时重新审计。
   */
  simulationNoEffect?:
    | 'uniqueEnemyHasNoAlternateTarget'
    | 'enemyDoesNotDealDamage'
    | 'enemyDoesNotInflictSpellStatusOnOperators';
  /** 各等级提供的结构化修正。 */
  modifiers?: readonly UpgradeModifierDefinition[];
  /** 启用后注册的战斗事件响应。 */
  eventHandlers?: readonly UpgradeEventHandlerDefinition[];
  /** 养成启用后直接安装的初始化行为；不是技能，也不进入可释放技能集合。 */
  initializationSequence?: ActionGraphReference;
  /** 原生 CharMiscFeature 直接附着的 Buff；数值按这一天赋或潜能的等级解析。 */
  attachedBuffs?: readonly {
    readonly buffId: string;
    readonly blackboardAssignments?: Readonly<Record<string, LevelValues>>;
  }[];
  /** 仅在这个养成项启用时安装；每个被动在一场战斗中只启用一次。 */
  passiveSkills?: readonly OperatorPassiveSkillDefinition[];
}

/** 干员定义可以监听的构筑事件。 */
export const OPERATOR_EVENTS = ['deckAttributesChanged'] as const;

/** 一种干员构筑事件。 */
export type OperatorEvent = (typeof OPERATOR_EVENTS)[number];

/** 干员对一项构筑事件的响应。 */
export interface OperatorEventHandlerDefinition {
  /** 响应在此干员定义中的唯一名称。 */
  key: string;
  /** 要监听的构筑事件。 */
  event: OperatorEvent;
  /** 事件发生后执行的动作序列。 */
  sequence: ActionGraphReference;
}

/** 由静态构筑条件派生、在本场战斗创建技能实例前写入的原生实体黑板值。 */
export interface OperatorEntityBlackboardInitializerDefinition {
  /** 要初始化的实体黑板键。 */
  key: `EntityBB_${string}`;
  /** 根据最终构筑判断写入哪个值。 */
  condition: BuildCondition;
  /** 条件成立时写入的值。 */
  trueValue: number;
  /** 条件不成立时写入的值。 */
  falseValue: number;
}

/** 原生角色专属 HUD 的可读外观身份；纹理路径和动画参数仍由 UI 资产层维护。 */
export type OperatorPassiveUiAppearance = Extract<
  OperatorPassiveUiDefinition,
  { appearance: string }
>['appearance'];

/** 读取 NotifyCharPassiveUIAction 发布的数值；不从 Buff 层数或能力实体推算状态。 */
export interface NumericPassiveUiDefinition {
  /** 运行时通过 CharacterPassiveUiValueChanged 回执提供当前干员的显示数值。 */
  readonly kind: 'numeric';
  /** 可选择的角色专属外观。 */
  readonly appearance:
    'tangtangDroplets' | 'laevatainCounter' | 'zhuangFangyiThunder' | 'arcaneSigils';
  /** 计数显示的上限。 */
  readonly maximum: number;
  /** 达到该值时原生节点进入满层/强化状态；没有独立满层态时省略。 */
  readonly activeAt?: number;
}

/** 原生 UICharPassiveLiino：观察两种演唱姿态 Buff。 */
export interface LiinoPassiveUiDefinition {
  /** HUD 类型判别值。 */
  readonly kind: 'buffProgress';
  /** 使用的角色专属外观。 */
  readonly appearance: 'liinoMusic';
  /** 普通状态读取的 Buff ID。 */
  readonly normalBuffId: string;
  /** 终结技状态读取的 Buff ID。 */
  readonly ultimateBuffId: string;
}

/** 原生 UICharPassiveTyphoea：观察后备猎矢、战斗猎矢与启示。 */
export interface TyphoeaPassiveUiDefinition {
  /** Typhoea 原生 HUD 同时观察三种 Buff 层数；不复制为独立战斗状态。 */
  readonly kind: 'buffCounters';
  /** 使用的角色专属外观。 */
  readonly appearance: 'typhoeaArrows';
  /** 后备箭层数对应的 Buff ID。 */
  readonly reserveArrowBuffId: string;
  /** 战斗箭层数对应的 Buff ID。 */
  readonly battleArrowBuffId: string;
  /** 点数层数对应的 Buff ID。 */
  readonly pointBuffId: string;
  /** 箭数量显示上限。 */
  readonly maximumArrows: number;
  /** 点数显示上限。 */
  readonly maximumPoints: number;
}

/** 显示归属当前干员、匹配定义的在场能力实体数量；不创建战斗状态。 */
export interface AbilityEntityCountPassiveUiDefinition {
  readonly kind: 'abilityEntityCount';
  readonly abilityEntityId: string;
  /** 图标资源路径。 */
  readonly icon: string;
  /** 实体显示名称的 i18n 键。 */
  readonly nameKey: string;
}

/** 任意一种角色专属 HUD 定义。 */
export type OperatorPassiveUiDefinition =
  | NumericPassiveUiDefinition
  | LiinoPassiveUiDefinition
  | TyphoeaPassiveUiDefinition
  | AbilityEntityCountPassiveUiDefinition;

/** 原生角色常驻条件；独立于技能块，也不复用旧手写语义连携规则。 */
export interface ComboSkillConditionDefinition {
  /** 当前条件的独立程序图。 */
  readonly actionGraph: ActionGraphResourceDefinition;
  /** 条件在此干员定义中的唯一名称。 */
  key: string;
  /** 原生角色模板注册该条件时绑定的具体连携技能；展示分组不得参与运行语义。 */
  skillKey: string;
  /** 要监听的能力事件。 */
  event: AbilityEvent;
  /** 原生条件命中后直接 TryCastComboSkill；false 才进入 Pending 窗口。 */
  immediately: boolean;
  /** 模板字面初值，不是等级数组；null 为禁用，{} 为启用空板，每条注册独立复制。 */
  initialValues: Readonly<Record<string, number | string | null>> | null;
  /** 判断事件是否满足连携条件的动作序列。 */
  sequence: ActionGraphReference;
}

/** 一名干员可用于构筑和战斗模拟的完整定义。 */
export interface OperatorDefinition {
  /** 稳定英文名；项目引用与实例关联使用此身份。 */
  slug: string;
  /** 项目模板可提供独立展示名；内置定义继续使用本地化文本。 */
  displayName?: string;
  /** 项目模板继承头像、技能图标和本地化回退时使用的内置资源 slug；不参与对象身份。 */
  assetSlug?: string;
  /** 游戏原生角色 ID。 */
  gameId: string;
  /** 干员星级。 */
  rarity: OperatorRarity;
  /** 编辑器选择和“拉满”时使用的产品默认潜能；省略时沿用旧版星级策略。 */
  defaultPotential?: number;
  /** 干员可以装备的武器类型。 */
  weaponType: OperatorWeaponType;
  /** 干员元素。 */
  element: DamageElement;
  /** 干员战斗定位。 */
  role: OperatorRole;
  /** 干员主属性。 */
  mainAttribute: OperatorAttribute;
  /** 干员副属性。 */
  secondaryAttribute: OperatorAttribute;
  /** 各等级四维、攻击和生命成长。 */
  attributes: AttributeGrowthDefinition;
  /** 仅记录偏离全局 `[10, 15, 15, 20]` 主属性规则的干员。 */
  trustAttributeBonus?: TrustAttributeBonusDefinition;
  /** 技能库中可以放置的技能组。 */
  skillGroups: readonly SkillGroupDefinition[];
  /** 完美闪避成功后由中心状态机施放的隐藏技能；不作为普通技能块出现在技能库。 */
  dodgeSkill?: import('./skills.ts').SkillDefinition;
  /** 进入原生 Dash 状态时附着到当前干员的 Buff，以及创建实例时写入的字面黑板。 */
  dashBuffs?: readonly {
    readonly buffId: string;
    readonly blackboard: Readonly<Record<string, number | string>>;
  }[];
  /** 战斗时可被 Buff/Mode 改写的技能槽；独立于技能库分组。 */
  skillSlots?: readonly import('./skills.ts').OperatorSkillSlotDefinition[];
  /** 四类玩家语义动作的原生路由；缺失边必须诊断为 unknown。 */
  playerActionRoutes?: import('./skills.ts').OperatorPlayerActionRoutes;
  /** CharacterData 中会覆盖普攻序列或命令映射的模式；独立于技能库分组。 */
  playerActionModes?: readonly import('./skills.ts').OperatorPlayerActionModeDefinition[];
  /** 旧项目技能身份到当前规范身份的只读兼容映射；不得作为技能库中的额外入口展示。 */
  skillAliases?: readonly {
    /** 旧项目中的技能组和技能键。 */
    readonly from: readonly [skillGroupKey: string, skillKey: string];
    /** 当前对应的技能组和技能键。 */
    readonly to: readonly [skillGroupKey: string, skillKey: string];
  }[];
  /** 干员级附属对象；编辑器后续可在干员层级创建和修改，技能不得复制其完整定义。 */
  buffDefinitions?: OperatorBuffDefinitions;
  /** 此干员附属 Buff 的名称翻译键；仅用于展示，不进入战斗回执。 */
  buffDisplayNameKeys?: Readonly<Record<string, string>>;
  /** 干员专属技能入口的名称翻译键；按技能 key 查找，不改变技能路由。 */
  skillDisplayNameKeys?: Readonly<Record<string, string>>;
  /** 干员级能力实体蓝图；子技能按引用它的技能等级编译。 */
  abilityEntityDefinitions?: OperatorAbilityEntityDefinitions;
  /** 原生角色常驻连携条件；多段连携的后续窗口仍由技能序列中的步骤开启。 */
  comboSkillConditions?: readonly ComboSkillConditionDefinition[];
  /** SkillDataBundle.comboSkillPriorityType；单敌人运行时不评分，但转换不得丢失。 */
  comboSkillPriority?: ComboSkillPriority;
  /** 角色模板的字面实体初值；不是技能初值，动态值也不随每次技能施放重置。 */
  entityBlackboard?: Readonly<Record<string, number | string>>;
  /** CharacterTable 明确挂载的角色专属战斗 HUD；不存在时不得从遗留 prefab 猜测。 */
  passiveUi?: OperatorPassiveUiDefinition;
  /** 技能间共享的实体黑板初值；条件只读取已解析的静态构筑。 */
  entityBlackboardInitializers?: readonly OperatorEntityBlackboardInitializerDefinition[];
  /** 角色自身始终安装的隐藏基础被动；与受构筑开关控制的天赋/潜能被动分开。 */
  passiveSkills?: readonly OperatorPassiveSkillDefinition[];
  /** 构筑属性变化时执行的干员级响应。 */
  eventHandlers?: readonly OperatorEventHandlerDefinition[];
  /** 固定两个按顺序排列的天赋槽；只修改槽内内容，不改变槽位数量。 */
  talents: readonly OperatorUpgradeDefinition[];
  /** 固定五个按顺序排列的潜能槽；校验器会报告数量不正确的草稿。 */
  potentials: readonly OperatorUpgradeDefinition[];
  /** 未提供时视为人工审核完成；宽松转换产物必须显式携带该字段。 */
  conversionSupport?: OperatorConversionSupport;
}
