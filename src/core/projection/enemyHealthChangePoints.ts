/**
 * 从伤害、治疗和最大生命变更回执提取敌人生命变化，保留原始事件顺序。
 * 只检查和搬运字段，不算伤害、不算护甲减免。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';

/** 当前单敌人模型中的固定目标身份；多目标模型接入后应改为按目标筛选。 */
export const SINGLE_ENEMY_TARGET_ID = 'enemy' as const;

/** 一次落到敌人身上的生命变化事实。 */
export interface EnemyHealthChangePoint {
  readonly frame: number;
  readonly time: number;
  readonly sequence: number;
  readonly sourceId: string;
  readonly targetId: string;
  readonly healthChange: number;
  readonly remainingHealth: number;
  readonly maxHealth?: number;
  /** 上限同步直接记录写入前后值，避免相减再相加的浮点误差。 */
  readonly previousHealth?: number;
}

function requireIdentity(entry: CombatReceiptEntry, key: 'sourceId' | 'targetId'): string {
  const value = entry[key];
  if (value === undefined || value.length === 0) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no ${key}`);
  }
  return value;
}

function requireData(entry: CombatReceiptEntry): Readonly<Record<string, CombatReceiptValue>> {
  if (entry.data === undefined) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no data`);
  }
  return entry.data;
}

function requireNumber(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): number {
  const value = data[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no finite ${key}`);
  }
  return value;
}

function readPoint(entry: CombatReceiptEntry): EnemyHealthChangePoint {
  const data = requireData(entry);
  if (entry.event === 'MaxHealthChanged') {
    const remainingHealth = requireNumber(entry, data, 'currentHealth');
    return {
      frame: entry.frame,
      time: entry.time,
      sequence: entry.sequence,
      sourceId: requireIdentity(entry, 'sourceId'),
      targetId: requireIdentity(entry, 'targetId'),
      healthChange: remainingHealth - requireNumber(entry, data, 'previousHealth'),
      previousHealth: requireNumber(entry, data, 'previousHealth'),
      remainingHealth,
      maxHealth: requireNumber(entry, data, 'maxHealth'),
    };
  }
  return {
    frame: entry.frame,
    time: entry.time,
    sequence: entry.sequence,
    sourceId: requireIdentity(entry, 'sourceId'),
    targetId: requireIdentity(entry, 'targetId'),
    healthChange:
      requireNumber(
        entry,
        data,
        entry.event === 'HealingApplied' ? 'actualHealing' : 'actualDamage',
      ) * (entry.event === 'HealingApplied' ? 1 : -1),
    remainingHealth: requireNumber(
      entry,
      data,
      entry.event === 'HealingApplied' ? 'currentHealth' : 'remainingHealth',
    ),
  };
}

/**
 * 按回执原始顺序输出全部落到当前单敌人身上的变化点。
 * 其他目标的伤害事实不属于敌人曲线，但不会被本投影误删或合并。
 */
export function projectEnemyHealthChangePoints(
  entries: readonly CombatReceiptEntry[],
): readonly EnemyHealthChangePoint[] {
  const points: EnemyHealthChangePoint[] = [];
  for (const entry of entries) {
    if (
      entry.event !== 'DamageApplied' &&
      entry.event !== 'HealingApplied' &&
      entry.event !== 'MaxHealthChanged'
    )
      continue;
    const point = readPoint(entry);
    if (point.targetId === SINGLE_ENEMY_TARGET_ID) points.push(point);
  }
  return points;
}
