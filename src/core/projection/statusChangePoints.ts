/**
 * 将通用语义状态回执转换为状态条可消费的有序变化点。
 * 本投影只校验执行现场记录的快照，不计算叠层、刷新、消费或到期结果。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';
import {
  COMBAT_STATUS_CHANGE_REASONS,
  type CombatStatusChangeReason,
} from '../combat/status/combatStatuses';

export type StatusChangeReason = CombatStatusChangeReason;

/** 一次通用状态动作完成后的请求参数、前后状态和执行定位。 */
export interface StatusChangePoint {
  readonly frame: number;
  readonly time: number;
  readonly sequence: number;
  readonly sourceId: string;
  readonly targetId: string;
  readonly skillId: string;
  readonly statusKey: string;
  readonly reason: StatusChangeReason;
  readonly requestedStacks: number | null;
  readonly requestedDurationFrames: number | null;
  readonly requestedMaxStacks: number | null;
  readonly previousStacks: number;
  readonly previousRemainingFrames: number | null;
  readonly currentStacks: number;
  readonly currentRemainingFrames: number | null;
}

function requireData(entry: CombatReceiptEntry): Readonly<Record<string, CombatReceiptValue>> {
  if (entry.data === undefined) {
    throw new Error(`receipt ${entry.sequence} 'StatusChanged' has no data`);
  }
  return entry.data;
}

function requireIdentity(entry: CombatReceiptEntry, key: 'sourceId' | 'targetId'): string {
  const value = entry[key];
  if (value === undefined || value.length === 0) {
    throw new Error(`receipt ${entry.sequence} 'StatusChanged' has no ${key}`);
  }
  return value;
}

function requireString(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): string {
  const value = data[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`receipt ${entry.sequence} 'StatusChanged' has invalid ${key}`);
  }
  return value;
}

function requireReason(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
): StatusChangeReason {
  const value = data.reason;
  if (!COMBAT_STATUS_CHANGE_REASONS.includes(value as StatusChangeReason)) {
    throw new Error(`receipt ${entry.sequence} 'StatusChanged' has invalid reason`);
  }
  return value as StatusChangeReason;
}

function requireOptionalNonNegativeInteger(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): number | null {
  const value = data[key];
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`receipt ${entry.sequence} 'StatusChanged' has invalid ${key}`);
  }
  return value;
}

function requireStacks(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): number {
  const value = data[key];
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`receipt ${entry.sequence} 'StatusChanged' has invalid ${key}`);
  }
  return value;
}

function readPoint(entry: CombatReceiptEntry): StatusChangePoint {
  const data = requireData(entry);
  return {
    frame: entry.frame,
    time: entry.time,
    sequence: entry.sequence,
    sourceId: requireIdentity(entry, 'sourceId'),
    targetId: requireIdentity(entry, 'targetId'),
    skillId: requireString(entry, data, 'skillId'),
    statusKey: requireString(entry, data, 'statusKey'),
    reason: requireReason(entry, data),
    requestedStacks: requireOptionalNonNegativeInteger(entry, data, 'requestedStacks'),
    requestedDurationFrames: requireOptionalNonNegativeInteger(
      entry,
      data,
      'requestedDurationFrames',
    ),
    requestedMaxStacks: requireOptionalNonNegativeInteger(entry, data, 'requestedMaxStacks'),
    previousStacks: requireStacks(entry, data, 'previousStacks'),
    previousRemainingFrames: requireOptionalNonNegativeInteger(
      entry,
      data,
      'previousRemainingFrames',
    ),
    currentStacks: requireStacks(entry, data, 'currentStacks'),
    currentRemainingFrames: requireOptionalNonNegativeInteger(
      entry,
      data,
      'currentRemainingFrames',
    ),
  };
}

/** 按回执原始顺序输出；同帧多次状态变化不会合并。 */
export function projectStatusChangePoints(
  entries: readonly CombatReceiptEntry[],
): readonly StatusChangePoint[] {
  return entries.filter(entry => entry.event === 'StatusChanged').map(readPoint);
}
