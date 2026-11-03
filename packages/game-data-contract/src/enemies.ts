import type { AttributeModifier } from './modifiers.ts';
import type { DamageElement, EnemyRank, ImageRef } from './primitives.ts';

/** 普通敌人选择器的默认等级。关卡可引用其他明确导出的等级，不插值。 */
export const ENEMY_LEVELS = [1, 20, 40, 60, 80, 90] as const;
export type EnemyLevelHp = Readonly<Partial<Record<number, number>>>;

export interface EnemyBirthBuffOption {
  readonly nameKey?: string;
  /** 选择器名称的格式化参数，不参与战斗结算。 */
  readonly nameParams?: Readonly<Record<string, number>>;
  /** 可执行出生 Buff 的公共定义 ID。 */
  readonly runtimeBuffId?: string;
  readonly blackboard?: Readonly<Record<string, number>>;
  readonly key: string;
  readonly buffId: string;
  readonly origin: 'enemy' | 'stage';
  readonly supported: boolean;
  readonly modifiers: readonly AttributeModifier[];
}
export const ENEMY_TIERS = ['normal', 'advanced', 'elite', 'boss', 'leader'] as const;
/** 定义筛选和展示使用的敌人强度分类。 */
export type EnemyTier = (typeof ENEMY_TIERS)[number];

/** 敌人失衡规则的定义默认值；时长沿用数据源的秒单位，进入场景时再换算为项目帧。 */
export interface EnemyStaggerDefinition {
  readonly maximum: number;
  /** 已损失失衡值占上限的递增阈值；跨越阈值会触发对应节点事件。 */
  readonly knotThresholds: readonly number[];
  readonly knotBreakDurationSeconds: number;
  readonly brokenDurationSeconds: number;
  /** 基础失衡恢复时间倍率，省略时为 1。 */
  readonly recoveryTimeMultiplier?: number;
  /** 对该敌人施放处决后，玩家获得的技力。 */
  readonly finisherSpRecovery: number;
}

/**
 * 一个敌人的稳定定义身份和默认基础数值。
 * 这里不保存本地化名称，也不持有项目实例或运行时可变状态。
 */
export interface EnemyDefinition {
  readonly attributeModifiers?: readonly AttributeModifier[];
  readonly birthBuffs?: readonly EnemyBirthBuffOption[];
  readonly id: string;
  readonly icon?: ImageRef;
  readonly tier: EnemyTier;
  /** 原生战斗等级；独立于五档展示 tier，供 CheckEnemyRank 等战斗规则读取。 */
  readonly rank: EnemyRank;
  /** 仅包含选择器和关卡实际引用等级的生命值。 */
  readonly levelHp: EnemyLevelHp;
  readonly defense: number;
  readonly resistances: Readonly<Record<DamageElement, number>>;
  readonly superArmor: number;
  readonly stagger: EnemyStaggerDefinition;
  readonly finisherMultiplier: number;
}

/** 关卡内的出生配置身份；enemyId 为原生 EnemyTable 身份，templateId 用于展示查询。 */
export interface StageEnemyIdentity {
  readonly stageId: string;
  readonly enemyId: string;
  readonly templateId: string;
  readonly spawnId?: string;
}

/** 关卡持有的出生条目。额外出生效果来自刷怪器，不属于全局敌人定义。 */
export interface EnemySpawnDefinition {
  readonly id: string;
  readonly source: StageEnemyIdentity;
  readonly definitionId: string;
  readonly level: number | null;
  readonly count: number | null;
  readonly nameKey: string;
  readonly birthBuffs?: readonly EnemyBirthBuffOption[];
}

export interface EnemyStageDefinition {
  readonly id: string;
  readonly groupId: string;
  readonly difficultyOrder: number;
  readonly groupNameKey: string;
  readonly seriesId: string;
  readonly nameKey: string;
  readonly difficultyNameKey: string;
  readonly seriesNameKey: string;
  readonly sort: number;
  readonly enemies: readonly EnemySpawnDefinition[];
}
