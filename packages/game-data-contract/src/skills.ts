/**
 * 定义技能、技能组、玩家操作路由和技能创建的能力实体。
 *
 * 干员数据用这些结构说明一次操作会选择哪个技能、何时扣费与进入冷却、按什么时间线
 * 执行动作，以及技能之间如何接续或换槽。编辑器负责放置技能组，模拟器负责执行具体技能。
 */
import {
  type CombatResource,
  type LevelValues,
  type SkillLevelSource,
  type SkillType,
} from './primitives.ts';
import { type CombatEventHandlerDefinition, type ScheduledSequenceDefinition } from './actions.ts';
import { type AbilityEventResponse } from './abilityEvents.ts';
import { type BuildCondition, type CombatCondition } from './conditions.ts';

/** 生成期已从原生 born-tag 证据解析出的可执行能力实体查询。 */
export type AbilityEntityTargetQuery =
  /** 使用当前动作所属的能力实体。 */
  | {
      /** 能力实体查询种类判别值。 */
      readonly kind: 'current';
    }
  | {
      /** 查找当前所有者此前生成且仍可访问的能力实体。 */
      readonly kind: 'ownerSpawned';
      /** 只接受这些能力实体 ID；省略时不按 ID 筛选。 */
      readonly abilityEntityIds?: readonly string[];
    }
  /** 从动作环境中的指定键读取能力实体。 */
  | {
      /** 动作环境查询。 */
      readonly kind: 'context';
      /** 保存能力实体目标组的动作环境键。 */
      readonly contextKey: string;
    };

/** 各技能宿主共用的动作数据；不包含玩家操作、费用或宿主生命周期。 */
export interface SkillActionProgramDefinition {
  /** 创建时按技能等级解析的动作黑板默认值。 */
  blackboard?: Readonly<Record<string, LevelValues>>;
  /** 按技能局部帧安排的动作序列。 */
  scheduledSequences: readonly ScheduledSequenceDefinition[];
}

/** 原生 Skill CastData 中与动作图独立的施放资源配置。 */
export interface SkillCastResourceDefinition {
  /** 从施放开始计数，达到该帧时确认扣费与冷却。 */
  readonly costFrame: number;
  /** 保留原生秒值；负值在消费者语义查明前不得改写。 */
  readonly cooldownSeconds: number;
  /** 原生字段名尚未完成消费者语义核实，当前只保留其整数值。 */
  readonly maxChargeTime: number;
  /** 这次施放消耗的资源及可用门槛。 */
  readonly cost: Readonly<SkillCostDefinition> & {
    /** ATB 可释放门槛，独立于实际 cost.value。 */
    readonly availabilityThreshold: LevelValues;
  };
}

/** 投射物结束时启动的回调技能；它的动作寿命不受投射物对象回收时间影响。 */
export interface ProjectileCallbackSkillDefinition extends Readonly<SkillActionProgramDefinition> {
  /** 投射物回调技能的原生 ID。 */
  readonly skillId: string;
  /** 回调实例实际使用的原生技能类型。 */
  readonly nativeSkillType: NativeSkillType;
  /** 回调技能在没有提前结束时的自然持续帧数。 */
  readonly naturalDurationFrames: number;
  /** 回调技能自己的扣费和冷却设置。 */
  readonly castResource: SkillCastResourceDefinition;
}

/** 由一个逻辑能力实体独占、按该实体局部时钟执行的无施法子技能。 */
export interface AbilityEntityChildSkillDefinition extends Readonly<SkillActionProgramDefinition> {
  /** 子技能的原生 ID。 */
  readonly skillId: string;
}

/** 随能力实体 AbilitySystem 启用，并在该实体结束时销毁的原生被动技能。 */
export interface AbilityEntityPassiveSkillDefinition {
  /** 被动技能在能力实体定义中的唯一名称。 */
  readonly key: string;
  /** 创建时按引用技能等级解析的初始黑板。 */
  readonly blackboard?: Readonly<Record<string, LevelValues>>;
  /** 能力实体启用时执行一次的动作序列。 */
  readonly enableSequence: import('./actions.ts').ActionSequenceDefinition;
  /** 实体存活期间监听的 Buff 加入事件响应。 */
  readonly abilityEventResponses?: readonly AbilityEventResponse<'addedBuff'>[];
}

/** 能力实体模板数值；原生可在生成时用实体黑板覆盖模板默认值。 */
export type AbilityEntityDefinitionNumber =
  | number
  | {
      /** 生成实体时读取的实体黑板键。 */
      readonly blackboardKey: string;
      /** 黑板没有该键时使用的模板默认值。 */
      readonly fallback: number;
    };

/** 可由干员级定义表复用的完整逻辑能力实体蓝图。 */
export interface AbilityEntityDefinition {
  /** AbilityEntityTemplateData.bornTags；实体创建时立即成为其 AbilitySystem 自身标签。 */
  readonly bornTags?: readonly import('./gameplayTags.ts').GameplayTag[];
  /** AbilitySystemData.entityBlackboard 的模板初值；生成动作的显式赋值可覆盖同名键。 */
  readonly blackboard?: Readonly<Record<string, number | string>>;
  /** 能力实体的寿命：限定秒数或无限持续。 */
  readonly lifetime:
    | {
        /** 生命周期种类判别值。 */
        readonly kind: 'limited';
        /** 创建后持续的秒数。 */
        readonly durationSeconds: AbilityEntityDefinitionNumber;
      }
    /** 不按时间自动结束。 */
    | {
        /** 无限生命周期判别值。 */
        readonly kind: 'infinite';
      };
  /** 实体死亡后仍留在 owner children / finder 目录中的控制器回收延迟。 */
  readonly deathReleaseDelaySeconds?: number;
  /** 正数时，同模板新实例会按原生 Group.Add 语义同步释放最早实例。 */
  readonly maxStackingCount?: AbilityEntityDefinitionNumber;
  /** 该模板只使用一个子技能时的简写定义。 */
  readonly childSkill?: AbilityEntityChildSkillDefinition;
  /** 同一原生实体模板可由不同 Spawn 动作绑定不同子技能；键为原生技能 ID。 */
  readonly childSkills?: Readonly<Record<string, AbilityEntityChildSkillDefinition>>;
  /** 能力实体启用期间安装的被动技能。 */
  readonly passiveSkills?: readonly AbilityEntityPassiveSkillDefinition[];
}

/** 干员级能力实体蓝图；技能只引用身份并提供本次生成参数。 */
export type OperatorAbilityEntityDefinitions = Readonly<Record<string, AbilityEntityDefinition>>;

/** 技能的一项等级化资源费用；实际扣除时机由技能 `costFrame` 决定。 */
export interface SkillCostDefinition {
  /** 要消耗的战斗资源。 */
  resource: CombatResource;
  /** 单个费用或按技能等级排列的费用。 */
  value: LevelValues;
}

/** Endaxis 可编辑的四种玩家战斗操作语义；键鼠/手柄绑定不进入战斗数据。 */
export const PLAYER_SKILL_INPUTS = [
  /** 普通攻击操作。 */
  'basicAttack',
  /** 战技操作。 */
  'battleSkill',
  /** 连携技操作。 */
  'comboSkill',
  /** 终结技操作。 */
  'ultimate',
] as const;
/** 一种可由玩家触发的战斗操作。 */
export type PlayerSkillInput = (typeof PLAYER_SKILL_INPUTS)[number];

/** 原生 `Beyond.Gameplay.SkillType`；它是技能实例的可变运行时状态，不是玩家操作或技能库分组。 */
export const NATIVE_SKILL_TYPES = [
  /** 被动技能。 */
  'passiveSkill',
  /** 普通攻击。 */
  'attack',
  /** 破防攻击。 */
  'breakingAttack',
  /** 普通战技。 */
  'normalSkill',
  /** 附着技能。 */
  'attachSkill',
  /** 闪避。 */
  'dodge',
  /** 连携技。 */
  'comboSkill',
  /** 终结技。 */
  'ultimateSkill',
  /** 额外主动技能。 */
  'extraActiveSkill',
] as const;
/** 技能实例在原生能力系统中的类型。 */
export type NativeSkillType = (typeof NATIVE_SKILL_TYPES)[number];

/** CharacterData 的模式只保存会改变四类玩家操作解析结果的字段。 */
export interface OperatorPlayerActionModeDefinition {
  /** 游戏中的模式 ID。 */
  readonly modeId: string;
  /** 多个模式同时存在时所属的互斥或叠加层。 */
  readonly modeLayer: string;
  /** 进入战斗时是否默认启用。 */
  readonly defaultEnabled: boolean;
  /** 此模式下普通攻击序列允许请求的技能。 */
  readonly normalAttackSkillKeys?: readonly string[];
  /** 此模式对四类玩家操作的技能请求覆盖。 */
  readonly commandMappings?: Readonly<
    Partial<
      Record<
        PlayerSkillInput,
        {
          /** 该操作请求的技能 ID。 */
          readonly skillId: string;
        }
      >
    >
  >;
}

/**
 * 原生 AbilitySystem 中可被 ChangeSkillAction 改写的稳定技能槽。
 * 槽位属于战斗路由，不是技能库分组；编辑器可以恰好用同名 key，但二者没有运行时依赖。
 */
export interface OperatorSkillSlotDefinition {
  /** 技能槽在干员定义中的唯一名称。 */
  readonly key: string;
  /** 战斗开始时装入槽位的技能。 */
  readonly baseSkillKey: string;
  /** 未发生槽位替换时仍可由同一语义动作明确请求的技能。 */
  readonly stableSkillKeys?: readonly string[];
  /** Buff 或模式可以换入该槽位的技能。 */
  readonly replacementSkillKeys: readonly string[];
}

/** 一类玩家操作如何解析成具体技能。 */
export type PlayerActionRouteDefinition =
  | {
      /** 通过一个可被运行时替换的技能槽选技能。 */
      readonly kind: 'skillSlot';
      /** 要读取的技能槽。 */
      readonly skillSlotKey: string;
    }
  | {
      /** 从普通攻击序列和当前操作模式中选技能。 */
      readonly kind: 'basicAttack';
      /** 原生 normalAttackList、处决和下落等路径能够请求的技能全集。 */
      readonly skillKeys: readonly string[];
      /** CharacterData.normalAttackList 给出的默认有序普攻连段，不包含处决和下落攻击。 */
      readonly normalAttackSkillKeys?: readonly string[];
      /** 只有 SkillDataBundle/default mode 的命令映射已导入时才允许设置。 */
      readonly defaultSkillKey?: string;
    };

/** 四类语义动作到原生技能请求来源的显式边；不得从技能库分组反推。 */
export type OperatorPlayerActionRoutes = Readonly<
  Partial<Record<PlayerSkillInput, PlayerActionRouteDefinition>>
>;

/**
 * 原生 ComboCacheAction 在一段技能局部时间内对攻击操作的映射覆盖。
 * Skill 命令中的战技/连携会把映射中的 skillId 覆盖为当前槽位技能，
 * 终结技不读该映射，因此它们不能作为“选择哪个技能”的证据。
 */
export interface SkillInputCommandMappingWindow {
  /** 窗口起始帧，包含该帧。 */
  readonly startFrame: number;
  /** 窗口结束帧。 */
  readonly endFrame: number;
  /** 此窗口覆盖的玩家操作。 */
  readonly input: 'basicAttack';
  /** 空值是原生的“该窗口没有直接技能路由”，不得回退为基础技能。 */
  readonly targetSkillId: string | null;
}

/** 原生 AllowNextSkillAction 只授予提前接续许可，不负责选择技能。 */
export interface SkillAllowedNextWindow {
  /** 可以提前接续的起始帧。 */
  readonly startFrame: number;
  /** 可以提前接续的结束帧。 */
  readonly endFrame: number;
  /** 此窗口允许请求的原生技能 ID。 */
  readonly skillIds: readonly string[];
}

/** 事件触发器筛选干员自身或全队来源的范围。 */
export const SKILL_TRIGGER_SCOPES = ['operator', 'team'] as const;
/** 技能事件触发器检查当前干员还是全队来源。 */
export type SkillTriggerScope = (typeof SKILL_TRIGGER_SCOPES)[number];

/** 多个连携目标候选同时成立时的选择策略。 */
export const COMBO_SKILL_PRIORITIES = ['default', 'firstBlackboard', 'enemyRank'] as const;

/** 同一干员存在多个目标候选时，原生运行时选择实际施法目标的策略。 */
export type ComboSkillPriority = (typeof COMBO_SKILL_PRIORITIES)[number];

/**
 * 一个可独立释放或触发的技能定义。
 * 它描述战斗身份和时序，不承载翻译后的名称或编辑器布局。
 */
export interface SkillDefinition extends SkillActionProgramDefinition {
  /** 原生 SkillData.skillId，也是干员定义和时间轴引用此技能时使用的唯一 ID。 */
  key: string;
  /**
   * 此技能执行体参与战斗事件与中断优先级判断时使用的分类。
   * 它属于单个技能，不能从编辑器技能库分组反推。当前枚举是 Endaxis 已支持的战斗分类；
   * 原生可变 SkillType 后续由运行时状态覆盖此初值。
   */
  skillType?: SkillType;
  /** `_InitSkills` 创建实例时得到的原生初值；之后可由 ChangeSkillType 改写。 */
  nativeSkillType?: NativeSkillType;
  /** 从原生 CharGrowthTable 技能组成员关系得到的等级来源；不属于编辑器分组。 */
  levelSource?: SkillLevelSource;
  /**
   * 该次释放所创建的强化状态 Buff 身份。时间轴只按实际 Buff 回执投影生命周期；
   * 省略表示没有已取证的强化状态，不能把任意自身 Buff 猜成强化条。
   */
  enhancementStateBuffId?: string;
  /** 零距离木桩下 StoreSmartTarget 的归约结果；省略表示原技能不执行智能目标存储。 */
  smartTarget?: 'enemy' | 'input' | 'trigger';
  /** 时间轴技能块的显示宽度；由可操作边界推导，不对应原生 `durationFrame`。 */
  timelineBlockFrames: number;
  /**
   * 基础攻击有序连段中建议的下一技能原生 Skill ID，供技能库递归放置、预览选择，并标记
   * 已保留实际 AllowNext 动作的定义。正式块宽读取实际动作候选或 canInterrupt，不按该 ID
   * 预选未来输入。
   */
  timelineContinuationSkillId?: string;
  /** 块宽的接续参照技能；覆盖默认接续目标，仅影响显示，不执行该技能。 */
  timelineBlockFollowUpSkillId?: string;
  /**
   * 原生 `SkillData.durationFrame` 的运行时自然结束周期，已按原生 getter 钳制为至少 1 帧。
   * 它不决定技能块宽度，也不能用 `exclusiveFrame` 或最后一个可见战斗动作代替。
   */
  naturalDurationFrames?: number;
  /** 原生 SkillData.exclusiveFrame；只在需要读取当前技能可中断状态时参与运行时判断。 */
  exclusiveFrame?: number;
  /** 原生 SkillData.offsetRecordFrame；到达时把下一段普攻提交为连段偏移目标。 */
  offsetRecordFrame?: number;
  /**
   * 从原生顶层直连输入 Action 保留的操作解析证据。两类窗口职责不同：
   * commandMappings 选择该操作当前指向的技能，allowedNextSkills 只决定能否提前中断。
   */
  inputWindows?: {
    /** 在指定帧段内覆盖普通攻击操作的技能路由。 */
    readonly commandMappings?: readonly SkillInputCommandMappingWindow[];
    /** 在指定帧段内允许提前接续的技能。 */
    readonly allowedNextSkills?: readonly SkillAllowedNextWindow[];
    /** 存在条件或嵌套输入 Action；当前输入状态不足时必须返回未知而不是猜测。 */
    readonly hasConditionalActions?: boolean;
  };
  /**
   * 技能释放条件只生成合法性诊断；不成立也不会阻止技能进入模拟。
   * 模拟层将用户排入时间轴的动作视为已经成功释放，不得改写或跳过。
   */
  availability?: CombatCondition;
  /** 技能冷却帧数，可按技能等级变化。 */
  cooldownFrames?: LevelValues;
  /** 技能释放时消耗的资源。 */
  costs?: readonly SkillCostDefinition[];
  /** 原生 `CastData.startCdFrame`；配置消耗时编译器要求此字段存在。 */
  costFrame?: number;
  /**
   * 原生 SwitchToAddBuff 的施放前旁路；命中时不启动或中断普通技能时间轴。
   * `currentSkillTypes` 表达依赖上一技能身份的结束技路径；`condition` 表达候选技能自身的
   * 普通条件路径。两者同时存在时均须成立。`asSkillCast` 保留原生是否发布完整施法事件。
   */
  switchToBuffCast?: {
    /** 只在当前技能属于这些分类时启用旁路。 */
    readonly currentSkillTypes?: readonly SkillType[];
    /** 是否要求当前技能仍处于不可中断阶段。 */
    readonly requiresCurrentSkillNotInterruptible?: boolean;
    /** 候选技能自身需要满足的条件。 */
    readonly condition?: import('./conditions.ts').CombatCondition;
    /** 是否仍发布完整的技能施放事件。 */
    readonly asSkillCast?: boolean;
    /** 命中旁路后直接执行的动作序列。 */
    readonly sequence: import('./actions.ts').ActionSequenceDefinition;
  };
  /** 技能启用期间注册的战斗事件响应。 */
  eventHandlers?: readonly CombatEventHandlerDefinition[];
}

/** 编辑器整组放置策略；技能执行与单段放置不读取此元数据。 */
export interface SkillGroupPlacementPolicy {
  /** 当前策略通过递归读取输入窗口展开技能链。 */
  kind: 'recursiveInput';
  /** 技能链的第一段。 */
  firstSkillKey: string;
  /** 到达此技能后停止展开。 */
  terminalSkillKey: string;
  /** 最多放置的技能段数。 */
  maxSegments: number;
  /** 推测失败时按技能组声明顺序放置。 */
  fallback: 'sequence';
}

/**
 * 编辑器技能库中的稳定放置单元。
 * `skills` 为数组时表示一次放置所包含的有序技能链，而不是 UI 变体。
 */
export interface SkillGroupDefinition {
  /** 编辑器一次放置整个技能组时采用的展开规则。 */
  placementPolicy?: SkillGroupPlacementPolicy;
  /** 技能组在干员定义中的唯一名称。 */
  key: string;
  /** 技能库卡片、图标和放置操作使用的技能类别；实际执行仍读取具体技能的类别。 */
  skillType: SkillType;
  /** 技能组默认的养成等级来源；具体技能可以有自己的等级来源。 */
  levelSource: SkillLevelSource;
  /** 单个可放置技能，或作为一个技能库条目放置的有序技能链。 */
  skills: SkillDefinition | readonly SkillDefinition[];
  /** 基础放置项在技能库中的语义强调；省略表示普通操作。 */
  libraryPresentation?: 'enhanced';
  /**
   * 运行时虽以换槽形态注册、但编辑器放置时具有明确先后关系的完整技能键序列。
   * 省略表示 replacement 是状态强化形态，应作为独立卡片；不得由 UI 按名称猜测。
   */
  placementSequenceSkillKeys?: readonly string[];
  /**
   * 同一稳定输入类型下的具名形态链。形态不是新的技能类型；它可以使用不同的养成等级来源，
   * 例如终结技状态下的强化普攻仍属于普攻，但倍率取终结技等级。
   */
  variants?: readonly SkillGroupVariantDefinition[];
  /**
   * 与 `skills` 共用一个稳定放置身份、仅由运行时换槽动作选中的技能形态。
   * 编辑器必须把它们作为可显式放置的具体技能展示；运行时槽位状态只负责校验该操作
   * 当前是否确实会解析到该技能，不能静默把基础块替换为这里的执行体。
   */
  replacementSkills?: readonly SkillDefinition[];
  /**
   * 每个运行时替换技能在技能库中的显式放置语义。运行时替换关系本身不能推出展示语义：
   * `standard` 是普通独立操作，`enhanced` 是强化形态，`internal` 不接受玩家输入。
   * 有序接续技能由 `placementSequenceSkillKeys` 表达，不重复出现在这里。
   */
  replacementSkillPlacements?: Readonly<Record<string, 'standard' | 'enhanced' | 'internal'>>;
  /**
   * 跨原生技能组的换槽形态。技能仍占用本组的稳定槽位，但执行时使用其原生分类与等级源。
   * 仅用于原生输入旁路（例如战技包装器实际 Cast 连携技）；普通同组换槽继续使用 replacementSkills。
   */
  routedReplacementSkills?: readonly RoutedSkillReplacementDefinition[];
  /** 同一稳定技能组的 UI 变体，不会产生独立的释放身份。 */
  presentationVariants?: readonly SkillPresentationVariantDefinition[];
}

/** 技能组中按名称选择的一种完整技能形态。 */
export interface SkillGroupVariantDefinition {
  /** 此形态自己的技能链展开规则。 */
  placementPolicy?: SkillGroupPlacementPolicy;
  /** 形态在技能组中的唯一名称。 */
  key: string;
  /** 此形态使用的养成技能等级来源。 */
  levelSource: SkillLevelSource;
  /** 具名形态在技能库中的语义强调；不能从 variant 结构或 key 名称推断。 */
  libraryPresentation?: 'enhanced';
  /** 此形态包含的单个技能或有序技能链。 */
  skills: SkillDefinition | readonly SkillDefinition[];
}

/** 从其他原生技能组路由到当前稳定技能槽的替换技能。 */
export interface RoutedSkillReplacementDefinition {
  /** 已合并输入包装器资源规则、且拥有独立稳定 key 的执行定义。 */
  skill: SkillDefinition;
  /** 替换形态在技能库中的分类；实际执行读取 `skill.skillType`。 */
  skillType: SkillType;
  /** 替换形态在技能库中的等级来源；实际倍率读取 `skill.levelSource`。 */
  levelSource: SkillLevelSource;
  /** 执行体在原生养成定义中的技能组身份。 */
  executionSkillGroupKey: string;
  /** 执行体在原生养成定义中的稳定技能身份。 */
  executionSkillKey: string;
}

/** 同一技能组根据养成条件切换的展示形态，不产生新的释放身份。 */
export interface SkillPresentationVariantDefinition {
  /** 展示形态在技能组中的唯一名称。 */
  key: string;
  /** 最终构筑满足此条件时选用该展示形态。 */
  condition: BuildCondition;
}
