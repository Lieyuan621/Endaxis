import type { GlobalEffectDefinition } from '../game-data/globalEffectDefinition';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { SkillGraphPresentation } from './graphPresentation';
/**
 * 项目存档的数据结构。
 * 存档包含用户编辑内容以及编辑器版本元数据；
 * 通过计算得到的面板数据、模拟状态、投影结果一概不保存
 */
import type {
  DamageElement,
  OperatorDefinition,
  SkillDefinition,
} from '../game-data/operatorDefinition';

import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../game-data/equipmentDefinition';
import type { EnemyRank } from '../game-data/enemyRank';

export const PROJECT_KIND = 'EndaxisProject' as const;
export const PROJECT_SCHEMA_VERSION = 1 as const;
export const PROJECT_FPS = 30 as const;

/** 存档 JSON 相关结构定义 */
export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

/** 一个干员养成方案中由用户决定的稳定输入。 */
export interface OperatorInstanceDocument {
  /** 引用内置或项目级干员模板；项目模板 ID 使用 `project:operator:` 命名空间。 */
  operatorSlug: string;
  level: number;
  promoted: boolean;
  potential: number;
  trustLevel: number;
  skillLevels: Record<string, number>;
  talentStates: Record<string, number>;
  baseStatOverrides?: Record<string, number>;
}

/** 一把武器的等级、突破、潜能与词条等级配置。词条数量由武器定义决定。 */
export interface WeaponInstanceDocument {
  /** 引用内置或项目级武器模板。 */
  weaponSlug: string;
  level: number;
  tuned: boolean;
  potential: number;
  traitLevels: number[];
}

/** 一件装备的定义身份与精锻等级配置。 */
export interface GearInstanceDocument {
  /** 引用内置或项目级装备模板。 */
  gearSlug: string;
  artificingLevels: number[];
}

/** 项目模板的来源只用于审计、展示和显式重新派生；运行时直接消费物化后的完整定义。 */
export interface ProjectTemplateOriginDocument {
  templateId: string;
}

export interface ProjectOperatorTemplateDocument {
  id: string;
  name: string;
  origin?: ProjectTemplateOriginDocument;
  definition: OperatorDefinition;
  /** 项目自定义资源的画布坐标，以对象内路径为键；不参与战斗。 */
  graphPresentations?: Readonly<Record<string, SkillGraphPresentation>>;
}

export interface ProjectWeaponTemplateDocument {
  id: string;
  name: string;
  origin?: ProjectTemplateOriginDocument;
  definition: WeaponDefinition;
  graphPresentations?: Readonly<Record<string, SkillGraphPresentation>>;
}

export interface ProjectGearTemplateDocument {
  id: string;
  name: string;
  origin?: ProjectTemplateOriginDocument;
  definition: GearDefinition;
  graphPresentations?: Readonly<Record<string, SkillGraphPresentation>>;
}

export interface ProjectGearSetTemplateDocument {
  id: string;
  name: string;
  origin?: ProjectTemplateOriginDocument;
  definition: GearSetDefinition;
  graphPresentations?: Readonly<Record<string, SkillGraphPresentation>>;
}

export interface ProjectGlobalEffectTemplateDocument {
  id: string;
  name: string;
  origin?: ProjectTemplateOriginDocument;
  definition: GlobalEffectDefinition;
  graphPresentations?: Readonly<Record<string, SkillGraphPresentation>>;
}

/** 随项目保存、由全部场景实例共享的自定义模板库。 */
export interface ProjectDefinitionLibraryDocument {
  operators: Record<string, ProjectOperatorTemplateDocument>;
  weapons: Record<string, ProjectWeaponTemplateDocument>;
  gears: Record<string, ProjectGearTemplateDocument>;
  gearSets: Record<string, ProjectGearSetTemplateDocument>;
  /** 自定义全局效果；目录可省略表示空库。 */
  globalEffects?: Record<string, ProjectGlobalEffectTemplateDocument>;
}

/** 操作段的配置位置及其试图释放的技能。武器被动不产生玩家操作段。 */
export type DefinitionActionSource = {
  kind: 'operatorSkill';
  /** 所属技能库展示组，用于解析段配置和显示，不参与原生路由。 */
  skillGroupKey: string;
  /** 配置目标 SkillDefinition.key；输入不匹配时仍强制执行此技能并报告诊断。 */
  skillKey: string;
  /** 玩家尝试执行的四类语义动作；新放置块必须保存，旧项目可在路由唯一时恢复。 */
  action?: import('../game-data/operatorDefinition').PlayerSkillInput;
};

/**
 * 仅保留身份和展示信息的自由时间轴块。
 * 它目前没有 `SkillDefinition`，不能进入战斗编译；可执行自定义技能应使用
 * `operatorSkill` 来源并在 `SkillCastDocument.customDefinition` 保存完整覆盖。
 */
export interface CustomActionDefinition {
  kind: 'custom';
  /** 用户定义的身份标识，刻意保持开放而不限制为枚举。 */
  actionType: string;
  name: string;
  element?: DamageElement;
  iconKey?: string;
}

/** 时间轴技能释放所引用的游戏定义，或尚未接入模拟的自由展示块来源。 */
export type SkillCastSource = DefinitionActionSource | CustomActionDefinition;

/** 独立技能或手动组首保存作者帧，后续技能只保存前驱身份，计算出的起点不写回存档。 */
export type SkillCastPlacementDocument =
  { startFrame: number; afterCastId?: never } | { afterCastId: string; startFrame?: never };

/** 轴上技能段实例：一次玩家输入及其配置目标，不是运行时 Skill 的实例。 */
export interface SkillCastDocument {
  id: string;
  /** 用于找到游戏数据中的技能模板。 */
  source: SkillCastSource;
  placement: SkillCastPlacementDocument;
  /** 纯展示覆盖（颜色、锁定等），不包含技能逻辑。 */
  presentation?: {
    graph?: SkillGraphPresentation;
    locked?: boolean;
    disabled?: boolean;
    color?: string | null;
  };
  /** 玩家在本次释放时决定的随机模拟输入。 */
  simulationInputs?: {
    /** 随机模式下只接管这个技能块及其派生行为；省略时使用场景全局种子。 */
    randomSeed?: number;
    /** 按伤害 step key 覆盖本次结果；true 为暴击，false 为明确不暴击。 */
    criticalOverrides?: Record<string, boolean>;
  };
  /** 完整覆盖所属技能；正式项目必须携带自身局部图，不能借用模板节点或内嵌 Buff。 */
  customDefinition?: SkillDefinition;
}

/** 玩家在指定帧对这条干员轨道主动使用一次物品。 */
export interface ConsumableUseDocument {
  id: string;
  frame: number;
  consumableId: string;
}

/**
 * 一条干员轨道持有自己的养成与配装实例。
 * 实例属于轨道本身，不与其他轨道共享；空轨道整体为 `null`。
 */
export interface TrackDocument {
  /** 轨道的稳定身份；与轨道序号无关，交换轨道时随轨道对象一起移动。 */
  id: string;
  /** 轨道的干员实例；null 表示空轨道。 */
  operator: OperatorInstanceDocument | null;
  /** 轨道当前装备的武器实例；null 表示未装备。 */
  weapon: WeaponInstanceDocument | null;
  /** 轨道四个装备槽的实例；未装备的槽位为 null。 */
  gears: {
    armor: GearInstanceDocument | null;
    gloves: GearInstanceDocument | null;
    accessory1: GearInstanceDocument | null;
    accessory2: GearInstanceDocument | null;
  };
  initialState: {
    ultimateEnergy: number;
    maxUltimateEnergyOverride?: number;
  };
  skillCasts: SkillCastDocument[];
  /** 旧项目省略时等价于空数组。 */
  consumableUses?: ConsumableUseDocument[];
}

/** 四条时间轴轨道使用的稳定零基序号。 */
export type TrackIndex = 0 | 1 | 2 | 3;
/** 固定包含四个槽位的队伍轨道列表。 */
export type TrackListDocument = [
  TrackDocument | null,
  TrackDocument | null,
  TrackDocument | null,
  TrackDocument | null,
];

/** 用户连线只连接两个技能块，端口控制线条从哪一侧进出。 */
export type ConnectionEndpoint = { kind: 'skillCast'; skillCastId: string; port?: string };

/** 用户在两个时间轴端点之间建立的一条逻辑连接。 */
export interface ConnectionDocument {
  id: string;
  consumption: boolean;
  from: ConnectionEndpoint;
  to: ConnectionEndpoint;
}

/** 敌人失衡规则的项目值；定义中的秒数在创建实例时已经转换为项目帧。 */
export interface EnemyStaggerEditableValues {
  maximum: number;
  knotThresholds: number[];
  knotBreakDurationFrames: number;
  brokenDurationFrames: number;
  finisherSpRecovery: number;
}

/** 编辑器完整暴露、并允许用户覆盖的敌人数值。 */
export interface EnemyEditableValues {
  hp: number;
  defense: number;
  superArmor: number;
  finisherMultiplier: number;
  resistances: Record<string, number>;
  stagger: EnemyStaggerEditableValues;
}

export const ENEMY_EDITABLE_FIELDS = [
  'hp',
  'defense',
  'superArmor',
  'finisherMultiplier',
  'resistances',
  'stagger.maximum',
  'stagger.knotThresholds',
  'stagger.knotBreakDurationFrames',
  'stagger.brokenDurationFrames',
  'stagger.finisherSpRecovery',
] as const;
/** 用户可以覆盖的敌人默认值路径。 */
export type EnemyEditableField = (typeof ENEMY_EDITABLE_FIELDS)[number];

/** 场景中的敌人：来自定义（prefab）的实例，或自定义敌人配置。 */
export interface EnemyDocument {
  source: { kind: 'prefab'; enemyId: string; level: number } | { kind: 'custom'; level: number };
  /** 场景实例捕获的原生战斗等级；运行时不回查敌人定义。 */
  rank: EnemyRank;
  editable: EnemyEditableValues;
  /** `editable` 中被用户改离已捕获默认值的键。 */
  edited: EnemyEditableField[];
}

/** 循环分界线 */
export interface CycleBoundaryDocument {
  id: string;
  frame: number;
}

/** 切入干员标记 */
export interface ControlSwitchDocument {
  id: string;
  frame: number;
  trackIndex: TrackIndex;
}

/** 外部事件的作用域同时决定时间轴表现：单干员为轨道标记，全队为全局竖线。 */
export type ExternalEventTargetDocument =
  { scope: 'operator'; trackIndex: TrackIndex } | { scope: 'team' };

/** 用户排轴控制，不发布受击或技能释放事件，也不创建连携候选。 */
export type ExternalCombatEventDocument = {
  kind: 'comboCooldownControl';
  mode: 'cooldown' | 'ready';
};

/**
 * 用户显式声明的外部事件标记。它不代表敌方技能，也不会自行扣减生命。
 */
export interface ExternalEventMarkerDocument {
  id: string;
  frame: number;
  target: ExternalEventTargetDocument;
  event: ExternalCombatEventDocument;
}

/** 时间轴上一次普通闪避或人工声明成功的极限闪避输入。 */
export interface DodgeMarkerDocument {
  id: string;
  frame: number;
  trackIndex: 0 | 1 | 2 | 3;
  direction: 'forward' | 'backward';
  mode: { kind: 'dodge' } | { kind: 'perfectDodge'; successDelayFrames: number };
}

/** 一次模拟的时间范围、共享资源规则与控制事件。敌人失衡规则归敌人实例所有。 */
export interface BattleDocument {
  /** 法术爆发、物理异常的逐次命中覆盖，与技能块本身的覆盖分开。 */
  reactionCriticalOverrides?: Record<string, boolean>;
  prepFrames: number;
  durationFrames: number;
  /** 模拟起始线和模拟终止线 */
  simulationRange?: {
    startFrame?: number;
    endFrame?: number;
  };
  resourceRules: {
    maxSp: number;
    initialSp: number;
    spRecoveryPerSecond: number;
    defaultSkillSpCost: number;
  };
  /** 场景随机策略；旧项目省略时使用期望模式和种子 0。 */
  random?: {
    mode: import('../combat/random/simulationRandom').SimulationRandomMode;
    globalSeed: number;
  };
  /** 方案级输入规则；省略时只使用手动切人标记。推断出的标记不持久化。 */
  automaticControlSwitches?: boolean;
  cycleBoundaries: CycleBoundaryDocument[];
  controlSwitches: ControlSwitchDocument[];
  /** 旧 schema-1 文档可以省略；省略与空数组语义相同。 */
  externalEventMarkers?: ExternalEventMarkerDocument[];
  /** 旧 schema-1 文档可以省略；省略与空数组语义相同。 */
  dodgeMarkers?: DodgeMarkerDocument[];
}

/**
 * 场景自带完整历史输入；来源仅用于导航，不参与恢复或有效性检查。
 */
export interface ScenarioInheritanceDocument {
  sourceScenarioId: string;
  /** 最早可编辑的输入帧，历史为严格小于此帧的输入。 */
  frame: number;
}

/** 方案对一条全局效果资产的引用；定义只由项目资产库或内置仓库持有。 */
export interface GlobalEffectReferenceDocument {
  effectId: string;
  enabled: boolean;
}

/** 场景级全局修正配置。 */
export interface GlobalConfigDocument {
  /** 内置与自定义全局效果均走这个引用列表；省略等价于空列表。 */
  effects?: GlobalEffectReferenceDocument[];
  /** 自定义数值直接保存为 Buff，由场景机制施加到全队。 */
  customBuff?: SkillBuffDefinition;
}

/** 场景机制参数允许持久化的标量类型。 */
export type MechanicParameterValue = boolean | number | string;

/** 用户选择的一项定义机制及其显式参数。 */
export interface MechanicSelectionDocument {
  id: string;
  mechanicId: string;
  enabled: boolean;
  parameters: Record<string, MechanicParameterValue>;
}

/** 当前场景启用或禁用的全部机制选择。 */
export interface ScenarioMechanicsDocument {
  selections: MechanicSelectionDocument[];
}

/** 只影响场景编辑体验、不参与战斗计算的布局设置。 */
export interface ScenarioEditorDocument {
  trackHeightWeights: [number, number, number, number];
  prepExpanded: boolean;
  /** 旧版工具栏的三态初始终结技能量预设；省略时从当前轨道值推导。 */
  initialUltimateEnergyPreset?: {
    mode: 'empty' | 'full' | 'custom';
    customByTrackId: Record<string, number>;
  };
}

/** 一个可独立编辑、模拟或从其他场景边界继承的完整场景。 */
export interface ScenarioDocument {
  id: string;
  name: string;
  inheritance?: ScenarioInheritanceDocument;
  tracks: TrackListDocument;
  connections: ConnectionDocument[];
  enemy: EnemyDocument;
  battle: BattleDocument;
  mechanics: ScenarioMechanicsDocument;
  globalConfig: GlobalConfigDocument;
  editor: ScenarioEditorDocument;
}

/** 项目存档的顶层持久化结构。时间采用 ISO 8601 UTC 格式。 */
export interface EndaxisProjectDocument {
  kind: typeof PROJECT_KIND;
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  createdWith: string;
  /** 项目创建时间，后续编辑和导入保持不变。 */
  createdAt: string;
  fps: typeof PROJECT_FPS;
  /** 打开的方案id */
  activeScenarioId: string;
  /** schema-1 旧文档可省略；加载后等价于空库。 */
  definitionLibrary?: ProjectDefinitionLibraryDocument;
  scenarios: ScenarioDocument[];
}
