/**
 * 定义武器、装备、装备套装及其被动能力的数据格式。
 *
 * 这些定义同时保存装备的基础资料、成长数值、面板展示词条和实际战斗贡献。构筑界面
 * 用它们展示并选择装备，构筑解析器和模拟器则读取修正、事件响应、Buff 与初始化动作。
 */
import { type LevelValues, type OperatorWeaponType } from './primitives.ts';
import { type CombatCondition } from './conditions.ts';
import { type ActionSequenceDefinition, type CombatEventTrigger } from './actions.ts';
import { type OperatorBuffDefinitions } from './buffs.ts';
import type { AbilityEvent } from './abilityEvents.ts';

/** 数据中允许出现的武器星级。 */
export const WEAPON_RARITIES = [3, 4, 5, 6] as const;

/** 武器定义中已经存在的星级范围。 */
export type WeaponRarity = (typeof WEAPON_RARITIES)[number];

/** 兼容既有配装入口；公共构筑结构只在 buildModifiers 中定义。 */
export {
  BUILD_PANEL_STATS as EQUIPMENT_PANEL_STATS,
  BUILD_DAMAGE_SCALE_TARGETS as EQUIPMENT_DAMAGE_SCALE_TARGETS,
  type BuildPanelStat as EquipmentPanelStat,
  type BuildAttribute as EquipmentAttribute,
  type BuildDamageScaleTarget as EquipmentDamageScaleTarget,
} from './buildModifiers.ts';
import type { BuildModifierDefinition } from './buildModifiers.ts';

/** 武器、装备词条或套装可以提供的一项常驻构筑修正。 */
export type EquipmentModifierDefinition = BuildModifierDefinition;

/** 需要把多项实际修正合并成一行显示的装备词条。 */
export const EQUIPMENT_TRAIT_DISPLAY_COMPOSITES = [
  'cryoAndElectricDamageIncrease',
  'heatAndNatureDamageIncrease',
  'allSkillDamageIncrease',
  'allDamageReduction',
  'spellDamageIncrease',
] as const;

/** 一种复合装备词条显示方式。 */
export type EquipmentTraitDisplayComposite = (typeof EQUIPMENT_TRAIT_DISPLAY_COMPOSITES)[number];

/**
 * 游戏 EquipTable.displayAttrModifiers 的规范化结果。它只决定一条词条如何显示；
 * `modifiers` 仍是实际战斗效果，二者不得互相反推。
 */
export type EquipmentTraitDisplayDefinition =
  | {
      /** 直接按一项实际修正生成显示文字。 */
      readonly kind: 'modifier';
      /** 用于显示的修正定义。 */
      readonly modifier: EquipmentModifierDefinition;
    }
  | {
      /** 使用预设的复合词条文字。 */
      readonly kind: 'composite';
      /** 复合词条的类型。 */
      readonly composite: EquipmentTraitDisplayComposite;
      /** 显示的单个数值或各等级数值。 */
      readonly value: LevelValues;
    };

/** 配装被动直接监听的原生 AbilitySystem 事件。 */
export const EQUIPMENT_ABILITY_EVENTS = [
  'enterFight',
  'beforeOutputDamage',
  'outputCriticalDamage',
  'outputHeal',
  'beforeCastSkill',
  'afterSkillApplyCost',
  'beforeOutputPhysicalInfliction',
  'afterOutputPhysicalInfliction',
  'beforeOutputInfliction',
  'beforeOutputSpellBurst',
  'beforeOutputBuff',
  'outputBuff',
  'addedBuff',
  'buffEnhanceChanged',
  'buffConsumed',
  'skillSpGained',
] as const satisfies readonly AbilityEvent[];

/** 装备被动可以直接监听的一种能力事件。 */
export type EquipmentAbilityEvent = (typeof EQUIPMENT_ABILITY_EVENTS)[number];

/** 所有装备事件响应共用的字段。 */
interface EquipmentEventHandlerDefinitionBase {
  /** 响应在同一装备定义中的唯一名称。 */
  readonly key: string;
  /** 原生数据动作优先级；同级按定义中的注册顺序执行。 */
  readonly priority?: number;
  /** 事件发生后还需满足的条件。 */
  readonly condition?: CombatCondition;
  /** 条件成立时执行的动作序列。 */
  readonly sequence: ActionSequenceDefinition;
}

/** 配装能力监听战斗事件后执行的纯数据序列。 */
export type EquipmentEventHandlerDefinition = EquipmentEventHandlerDefinitionBase &
  (
    | {
        /** 监听一项语义战斗事件。 */
        readonly event: CombatEventTrigger;
        /** 使用语义战斗事件时不能同时监听能力事件。 */
        readonly abilityEvent?: never;
      }
    | {
        /** 使用能力事件时不能同时监听语义战斗事件。 */
        readonly event?: never;
        /** 直接监听的一项原生能力事件。 */
        readonly abilityEvent: EquipmentAbilityEvent;
      }
  );

/** 武器词条、装备词条与套装共用的声明式贡献集合。 */
export interface EquipmentContributionDefinition {
  /** 构筑阶段持续生效的属性修正。 */
  readonly modifiers?: readonly EquipmentModifierDefinition[];
  /** 装备能力注册的战斗事件响应。 */
  readonly eventHandlers?: readonly EquipmentEventHandlerDefinition[];
  /** 该贡献安装行为所引用的 Buff 蓝图；与干员 Buff 共用同一运行时。 */
  readonly buffDefinitions?: OperatorBuffDefinitions;
  /** 配装能力的初始黑板，按词条等级解析；初始化与全部事件响应共享同一实例。 */
  readonly blackboard?: Readonly<Record<string, LevelValues>>;
  /** 能力启用前执行一次；期间自身事件响应关闭，典型用途为原生普通启动 Buff。 */
  readonly enableSequence?: ActionSequenceDefinition;
  /** 能力启用后在帧 0 执行一次；Toggle 初次安装及固定构筑刷新程序使用此入口。 */
  readonly initializationSequence?: ActionSequenceDefinition;
}

/** 一条按武器词条等级解析的能力。三星武器可只有两条，四星及以上通常为三条。 */
export interface WeaponTraitDefinition extends EquipmentContributionDefinition {
  /** 词条在该武器中的唯一名称。 */
  readonly key: string;
  /** 这条词条可以解析的等级数量。 */
  readonly levelCount: number;
}

/** 一把武器在只读定义中的稳定身份、成长数据与词条能力。 */
export interface WeaponDefinition {
  /** 游戏原生武器对象 ID（`wpn_*`）；项目引用、实例关联与校验均以它为准。 */
  readonly slug: string;
  /** 缺少本地化资源时可使用的武器名称。 */
  readonly displayName?: string;
  /** 仅用于定位图标/本地化等展示资源；资源复用不得改变 slug 身份。 */
  readonly assetSlug?: string;
  /** 与语言无关的展示资源；名称和描述仍由 locale family 按需解析。 */
  readonly iconPath?: string;
  /** 武器星级。 */
  readonly rarity: WeaponRarity;
  /** 可装备这把武器的干员武器类型。 */
  readonly weaponType: OperatorWeaponType;
  /** 依次对应 1、20、40、60、80、90 级节点；其他等级必须由有证据的成长规则解析，不能擅自插值。 */
  readonly baseAttackAtLevelNodes: readonly number[];
  /** 按武器词条槽顺序保存的被动能力。 */
  readonly traits: readonly WeaponTraitDefinition[];
}

/** 装备定义使用的三个槽位类型。 */
export const GEAR_SLOT_TYPES = ['armor', 'gloves', 'accessory'] as const;

/** 装备自身的槽位类型；两个配件槽共享同一种定义类型。 */
export type GearSlotType = (typeof GEAR_SLOT_TYPES)[number];

/** 一条按精锻等级解析的装备能力；build 中的 0 表示初始档。 */
export interface GearTraitDefinition extends EquipmentContributionDefinition {
  /** 词条在该装备中的唯一名称。 */
  readonly key: string;
  /** 这条词条可以解析的精锻等级数量。 */
  readonly levelCount: number;
  /** 每条原生装备词条都有且只有一份 displayAttrModifiers 展示定义。 */
  readonly display: EquipmentTraitDisplayDefinition;
}

/** 一件装备在只读定义中的稳定身份、基础防御、词条与套装归属。 */
export interface GearDefinition {
  /** 游戏原生装备对象 ID（`item_equip_*`）；项目引用、实例关联与校验均以它为准。 */
  readonly slug: string;
  /** 缺少本地化资源时可使用的装备名称。 */
  readonly displayName?: string;
  /** 仅用于定位图标/本地化等展示资源；共用 iconId 不得改变 slug 身份。 */
  readonly assetSlug?: string;
  /** 与语言无关的展示资源；名称和描述仍由 locale family 按需解析。 */
  readonly iconPath?: string;
  /** 这件装备占用的槽位。 */
  readonly slotType: GearSlotType;
  /** 可以穿戴这件装备的最低干员等级。 */
  readonly levelRequirement: number;
  /** 装备提供的基础防御力。 */
  readonly baseDefense: number;
  /** 按词条槽顺序保存的装备能力。 */
  readonly traits: readonly GearTraitDefinition[];
  /** 所属套装的 ID；省略表示不属于套装。 */
  readonly gearSetSlug?: string;
}

/**
 * 套装的独立定义身份与三件套贡献。
 * 三件触发属于全局装备规则，因此不在每项定义中重复保存 requiredCount。
 */
export interface GearSetDefinition extends EquipmentContributionDefinition {
  /** 游戏原生套装 ID。 */
  readonly slug: string;
  /** 缺少本地化资源时可使用的套装名称。 */
  readonly displayName?: string;
  /** 套装效果在时间轴上的展示图标；独立于效果自身的原生图标。 */
  readonly iconPath?: string;
}
