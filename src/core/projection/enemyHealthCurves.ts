/**
 * 把敌人生命日志整理成曲线：初始生命 + 每次受伤 = 一条折线。
 * 只按日志记录来；日志和曲线对不上就报错，绝不自己补数。
 */
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import {
  projectEnemyHealthChangePoints,
  type EnemyHealthChangePoint,
} from './enemyHealthChangePoints';
import type { ResourceCurvePoint } from './resourceCurves';

/** 单场战斗中敌人的生命曲线。 */
export interface EnemyHealthCurve {
  readonly resource: 'enemyHealth';
  readonly maxValue: number;
  readonly points: readonly ResourceCurvePoint[];
}

/** 曲线初始生命；调用方必须传和这次模拟完全一致的敌人数值。 */
export interface EnemyHealthCurveInitial {
  readonly health: number;
  readonly maxHealth: number;
}

function appendPoint(
  points: ResourceCurvePoint[],
  change: EnemyHealthChangePoint,
  currentValue: number,
): number {
  if (change.remainingHealth !== currentValue - change.actualDamage) {
    throw new Error(
      `enemy health curve is discontinuous at receipt ${change.sequence}: expected ${currentValue - change.actualDamage}, received ${change.remainingHealth}`,
    );
  }
  points.push({
    frame: change.frame,
    time: change.time,
    sequence: change.sequence,
    value: change.remainingHealth,
  });
  return change.remainingHealth;
}

/** 按变化点原始顺序投影敌人生命曲线。 */
export function projectEnemyHealthCurve(
  initial: EnemyHealthCurveInitial,
  changes: readonly EnemyHealthChangePoint[],
  initialFrame = 0,
): EnemyHealthCurve {
  const points: ResourceCurvePoint[] = [
    { frame: initialFrame, time: initialFrame / 30, sequence: null, value: initial.health },
  ];
  let currentValue = initial.health;
  for (const change of changes) {
    if (change.remainingHealth > currentValue - change.actualDamage) {
      throw new Error(
        `enemy health at receipt ${change.sequence} increased without a receipt fact`,
      );
    }
    currentValue = appendPoint(points, change, currentValue);
  }
  return {
    resource: 'enemyHealth',
    maxValue: initial.maxHealth,
    points,
  };
}

/** 从原始战斗回执直接生成敌人生命曲线。 */
export function projectEnemyHealthCurveFromReceipt(
  initial: EnemyHealthCurveInitial,
  entries: readonly CombatReceiptEntry[],
  initialFrame = 0,
): EnemyHealthCurve {
  return projectEnemyHealthCurve(initial, projectEnemyHealthChangePoints(entries), initialFrame);
}
