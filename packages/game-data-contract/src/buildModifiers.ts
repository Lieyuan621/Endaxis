/**
 * 定义角色构筑阶段可以提供的常驻属性修正。
 *
 * 武器、装备和干员养成数据使用这些结构描述面板属性、伤害倍率、治疗加成和技能冷却；
 * 构筑解析器会先应用这些修正，再把计算后的属性交给战斗模拟器。
 */
import type { DamageType, LevelValues, OperatorAttribute, SkillType } from './primitives.ts';

/** 可直接显示在构筑面板上的属性名称。 */
export const BUILD_PANEL_STATS = [
  'attackFlat',
  'attackPercent',
  'healthFlat',
  'healthPercent',
  'defenseFlat',
  'defensePercent',
  'criticalRate',
  'criticalDamage',
  'artsIntensity',
  'ultimateEnergyGainEfficiency',
  'skillCooldownReduction',
  'staggerDamagePercent',
] as const;

/** 不需要按伤害类型或技能类型筛选的构筑面板属性。 */
export type BuildPanelStat = (typeof BUILD_PANEL_STATS)[number];

/** 固定四维或相对当前装备者的主、副属性。相对身份由 Build Resolver 解析。 */
export type BuildAttribute = OperatorAttribute | 'main' | 'secondary';

/** 常驻伤害倍率可以影响的攻击类别、元素和目标状态。 */
export const BUILD_DAMAGE_SCALE_TARGETS = [
  'normalAttack',
  'battleSkill',
  'comboSkill',
  'ultimate',
  'physical',
  'heat',
  'electric',
  'cryo',
  'nature',
  'ether',
  'staggeredEnemy',
] as const;

/** 原生常驻伤害倍率属性；运行时按命中分类、元素或目标失衡状态选择。 */
export type BuildDamageScaleTarget = (typeof BUILD_DAMAGE_SCALE_TARGETS)[number];

/**
 * 常驻构筑修正的权威成员表。百分比统一使用小数，例如 5% 写作 0.05。
 * `damageBonus` 独立建模，是为了禁止把筛选条件挂到不支持筛选的普通面板属性上。
 */
export interface BuildModifierDefinitionMap {
  /** 修改力量、敏捷、智识、意志或装备者主副属性。 */
  attribute: {
    /** 修正种类判别值。 */
    readonly kind: 'attribute';
    /** 要修改的属性。 */
    readonly attribute: BuildAttribute;
    /** `flat` 为固定加值，`percent` 为百分比加值。 */
    readonly operation: 'flat' | 'percent';
    /** 单个数值或按等级排列的数值。 */
    readonly value: LevelValues;
  };
  /** 修改不带伤害筛选条件的面板属性。 */
  panelStat: {
    /** 修正种类判别值。 */
    readonly kind: 'panelStat';
    /** 要修改的面板属性。 */
    readonly stat: BuildPanelStat;
    /** 单个数值或按等级排列的数值。 */
    readonly value: LevelValues;
  };
  /** 按伤害类型及可选技能类型增加伤害。 */
  damageBonus: {
    /** 修正种类判别值。 */
    readonly kind: 'damageBonus';
    /** 此加成覆盖的伤害类型。 */
    readonly damageTypes: DamageType | readonly DamageType[];
    /** 进一步限制此加成覆盖的技能类型；省略时不按技能类型筛选。 */
    readonly skillTypes?: SkillType | readonly SkillType[];
    /** 单个加成值或按等级排列的加成值。 */
    readonly value: LevelValues;
  };
  /** 修改游戏原生属性中的伤害倍率项。 */
  damageScale: {
    /** 修正种类判别值。 */
    readonly kind: 'damageScale';
    /** 要修改的伤害倍率项。 */
    readonly target: BuildDamageScaleTarget;
    /** 写入基础加算槽还是普通加算槽；旧数据省略时使用基础加算槽。 */
    readonly slot?: 'baseAddition' | 'addition';
    /** 单个倍率或按等级排列的倍率。 */
    readonly value: LevelValues;
  };
  /** 修改治疗输出或受到治疗的常驻基础加成。 */
  staticHealingIncrease: {
    /** 修正种类判别值。 */
    readonly kind: 'staticHealingIncrease';
    /** `output` 修改治疗输出，`taken` 修改受到的治疗。 */
    readonly target: 'output' | 'taken';
    /** 单个加成值或按等级排列的加成值。 */
    readonly value: LevelValues;
  };
  /** 乘算指定类型技能的冷却时长。 */
  skillCooldownMultiplier: {
    /** 修正种类判别值。 */
    readonly kind: 'skillCooldownMultiplier';
    /** 此倍率覆盖的技能类型。 */
    readonly skillTypes: SkillType | readonly SkillType[];
    /** 冷却时长倍率；例如 `0.9` 表示原时长的 90%。 */
    readonly value: LevelValues;
  };
}

/** 武器、装备和干员养成可以声明的任意一种常驻构筑修正。 */
export type BuildModifierDefinition = BuildModifierDefinitionMap[keyof BuildModifierDefinitionMap];
