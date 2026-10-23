/**
 * 敌人在版本化游戏数据中的只读定义。
 * 存档保存原生来源、等级及完整数值快照；名称和图片由本地化与定义层解析。
 */
import { ENEMY_LEVELS, type EnemyLevelHp } from '../../../packages/game-data-contract/src/index';
import type { ImageRef } from '../../../packages/game-data-contract/src/primitives';
import type { EnemyDocument } from '../project/schema';
import type { EnemyRank } from './enemyRank';
import type { DamageElement } from './operatorDefinition';
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

/** 只接受定义中明确存在的等级节点，避免把推测插值伪装成游戏数据。 */
export function getEnemyHpAtLevel(definition: EnemyDefinition, level: number): number | null {
  return definition.levelHp[level] ?? null;
}

/** 关卡实例只依赖基础模板资料；关卡修正数值由存档快照提供。 */
export function getEnemySourceDefinitionId(source: EnemyDocument['source']): string | null {
  if (source.kind === 'custom') return null;
  return source.kind === 'stage' ? source.templateId : source.enemyId;
}
