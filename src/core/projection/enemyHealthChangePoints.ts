/**
 * 从模拟日志里挑出"敌人受伤"的记录，整理成曲线用的变化点。
 * 只检查和搬运字段，不算伤害、不算护甲减免。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';
import type { DamageType } from '../game-data/operatorDefinition';

/** 当前单敌人模型中的固定目标身份；多目标模型接入后应改为按目标筛选。 */
export const SINGLE_ENEMY_TARGET_ID = 'enemy' as const;

/** 一次落到敌人身上的生命伤害事实。 */
export interface EnemyHealthChangePoint {
  readonly frame: number;
  readonly time: number;
  readonly sequence: number;
  readonly sourceId: string;
  readonly targetId: string;
  readonly damageType: DamageType;
  readonly value: number;
  readonly actualDamage: number;
  readonly remainingHealth: number;
  readonly isCritical: boolean;
}

function requireIdentity(entry: CombatReceiptEntry, key: 'sourceId' | 'targetId'): string {
  const value = entry[key];
  if (value === undefined || value.length === 0) {
    throw new Error(`receipt ${entry.sequence} 'DamageApplied' has no ${key}`);
  }
  return value;
}

function requireData(entry: CombatReceiptEntry): Readonly<Record<string, CombatReceiptValue>> {
  if (entry.data === undefined) {
    throw new Error(`receipt ${entry.sequence} 'DamageApplied' has no data`);
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
    throw new Error(`receipt ${entry.sequence} 'DamageApplied' has no finite ${key}`);
  }
  return value;
}

function readPoint(entry: CombatReceiptEntry): EnemyHealthChangePoint {
  const data = requireData(entry);
  const damageType = data.damageType;
  if (typeof damageType !== 'string' || damageType.length === 0) {
    throw new Error(`receipt ${entry.sequence} 'DamageApplied' has no damageType`);
  }
  if (typeof data.isCritical !== 'boolean') {
    throw new Error(`receipt ${entry.sequence} 'DamageApplied' has no boolean isCritical`);
  }
  return {
    frame: entry.frame,
    time: entry.time,
    sequence: entry.sequence,
    sourceId: requireIdentity(entry, 'sourceId'),
    targetId: requireIdentity(entry, 'targetId'),
    damageType: damageType as DamageType,
    value: requireNumber(entry, data, 'value'),
    actualDamage: requireNumber(entry, data, 'actualDamage'),
    remainingHealth: requireNumber(entry, data, 'remainingHealth'),
    isCritical: data.isCritical,
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
    if (entry.event !== 'DamageApplied') continue;
    const point = readPoint(entry);
    if (point.targetId === SINGLE_ENEMY_TARGET_ID) points.push(point);
  }
  return points;
}
