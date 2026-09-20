/**
 * 敌人在版本化游戏数据中的只读定义。
 * 存档只保存定义身份、等级和用户手动覆盖的值；名称由本地化层按 `id` 解析。
 */
import type { DamageElement } from './operatorDefinition';
import type { EnemyRank } from './enemyRank';
import { ENEMY_LEVELS, type EnemyLevelHp } from '../../../packages/game-data-contract/src/index';
export { ENEMY_LEVELS };

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
  /** 对该敌人施放处决后，玩家获得的技力。 */
  readonly finisherSpRecovery: number;
}

/**
 * 一个敌人的稳定定义身份和默认战斗数值。
 * 这里不保存本地化名称，也不持有项目实例或运行时可变状态。
 */
export interface EnemyDefinition {
  readonly id: string;
  readonly iconPath?: string;
  readonly tier: EnemyTier;
  /** 原生战斗等级；独立于五档展示 tier，供 CheckEnemyRank 等战斗规则读取。 */
  readonly rank: EnemyRank;
  /** 按 ENEMY_LEVELS 排列的六档生命值。 */
  readonly levelHp: EnemyLevelHp;
  readonly defense: number;
  readonly resistances: Readonly<Record<DamageElement, number>>;
  readonly superArmor: number;
  readonly stagger: EnemyStaggerDefinition;
  readonly finisherMultiplier: number;
}

/** 只接受定义中明确存在的等级节点，避免把推测插值伪装成游戏数据。 */
export function getEnemyHpAtLevel(definition: EnemyDefinition, level: number): number | null {
  const index = ENEMY_LEVELS.findIndex(value => value === level);
  return definition.levelHp[index] ?? null;
}
