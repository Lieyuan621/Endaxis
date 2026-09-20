/**
 * 将失衡结算回执转换为曲线可消费的有序变化点。
 * 本投影只校验和搬运 `PoiseApplied` 事实，不计算失衡伤害或状态转换。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';

/** 一次失衡结算及其结算前后状态。 */
export interface PoiseChangePoint {
  readonly frame: number;
  readonly time: number;
  readonly sequence: number;
  readonly sourceId: string;
  readonly targetId: string;
  readonly calculationValue: number;
  readonly calculatedDamage: number;
  readonly requestedDelta: number;
  readonly actualDelta: number;
  readonly previousPoise: number;
  readonly currentPoise: number;
  readonly cancelled: boolean;
  readonly cancelledByImmunity: boolean;
  readonly poiseImmune: boolean;
  readonly ignorePoiseImmune: boolean;
  readonly brokePoise: boolean;
  readonly inPoiseRecovery: boolean;
  readonly hasPoiseBrokenTag: boolean;
}

function requireIdentity(entry: CombatReceiptEntry, key: 'sourceId' | 'targetId'): string {
  const value = entry[key];
  if (value === undefined || value.length === 0) {
    throw new Error(`receipt ${entry.sequence} 'PoiseApplied' has no ${key}`);
  }
  return value;
}

function requireData(entry: CombatReceiptEntry): Readonly<Record<string, CombatReceiptValue>> {
  if (entry.data === undefined) {
    throw new Error(`receipt ${entry.sequence} 'PoiseApplied' has no data`);
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
    throw new Error(`receipt ${entry.sequence} 'PoiseApplied' has no finite ${key}`);
  }
  return value;
}

function requireBoolean(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): boolean {
  const value = data[key];
  if (typeof value !== 'boolean') {
    throw new Error(`receipt ${entry.sequence} 'PoiseApplied' has no boolean ${key}`);
  }
  return value;
}

function readPoint(entry: CombatReceiptEntry): PoiseChangePoint {
  const data = requireData(entry);
  return {
    frame: entry.frame,
    time: entry.time,
    sequence: entry.sequence,
    sourceId: requireIdentity(entry, 'sourceId'),
    targetId: requireIdentity(entry, 'targetId'),
    calculationValue: requireNumber(entry, data, 'calculationValue'),
    calculatedDamage: requireNumber(entry, data, 'calculatedDamage'),
    requestedDelta: requireNumber(entry, data, 'requestedDelta'),
    actualDelta: requireNumber(entry, data, 'actualDelta'),
    previousPoise: requireNumber(entry, data, 'previousPoise'),
    currentPoise: requireNumber(entry, data, 'currentPoise'),
    cancelled: requireBoolean(entry, data, 'cancelled'),
    cancelledByImmunity: requireBoolean(entry, data, 'cancelledByImmunity'),
    poiseImmune: requireBoolean(entry, data, 'poiseImmune'),
    ignorePoiseImmune: requireBoolean(entry, data, 'ignorePoiseImmune'),
    brokePoise: requireBoolean(entry, data, 'brokePoise'),
    inPoiseRecovery: requireBoolean(entry, data, 'inPoiseRecovery'),
    hasPoiseBrokenTag: requireBoolean(entry, data, 'hasPoiseBrokenTag'),
  };
}

/** 按回执原始顺序输出；同帧多次失衡结算不能合并。 */
export function projectPoiseChangePoints(
  entries: readonly CombatReceiptEntry[],
): readonly PoiseChangePoint[] {
  return entries.filter(entry => entry.event === 'PoiseApplied').map(readPoint);
}
