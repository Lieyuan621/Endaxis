/**
 * 将资源变化回执转换为曲线可消费的有序变化点。
 * 本投影只校验和搬运运行时事实，不计算恢复、收益倍率、费用或差值。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';
import type { SpGainKind } from '../game-data/operatorDefinition';

interface ResourceChangePointBase {
  readonly frame: number;
  readonly time: number;
  readonly sequence: number;
  readonly sourceId?: string;
  readonly skillId?: string;
  readonly baseValue: number;
  readonly requestedValue: number;
  readonly actualValue: number;
  readonly previousValue: number;
  readonly currentValue: number;
}

/** 资源变化记录的来源标记；目前只有每帧自动回复一种。 */
export type ResourceChangeSource = 'autoRecovery';

/** 全队共享技力的一次已记录变化。 */
export interface SpChangePoint extends ResourceChangePointBase {
  readonly resource: 'sp';
  readonly recipient: 'team';
  readonly gainKind?: SpGainKind;
  /** 每帧自动回复；曲线展示时不再单独标点。 */
  readonly source?: ResourceChangeSource;
}

/** 干员终结技能量变化。 */
export interface UltimateEnergyChangePoint extends ResourceChangePointBase {
  readonly resource: 'ultimateEnergy';
  readonly recipient: 'operator';
  readonly targetId: string;
  readonly applied: boolean;
}

/** 后续资源曲线可按 resource 判别的有序变化点。 */
export type ResourceChangePoint = SpChangePoint | UltimateEnergyChangePoint;

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

function readOptionalString(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): string | undefined {
  const value = data[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has invalid ${key}`);
  }
  return value;
}

function readBase(entry: CombatReceiptEntry) {
  const data = requireData(entry);
  if (entry.sourceId !== undefined && entry.sourceId.length === 0) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has invalid sourceId`);
  }
  const skillId = readOptionalString(entry, data, 'skillId');
  return {
    data,
    point: {
      frame: entry.frame,
      time: entry.time,
      sequence: entry.sequence,
      ...(entry.sourceId === undefined ? {} : { sourceId: entry.sourceId }),
      ...(skillId === undefined ? {} : { skillId }),
      baseValue: requireNumber(entry, data, 'baseValue'),
      requestedValue: requireNumber(entry, data, 'requestedValue'),
      actualValue: requireNumber(entry, data, 'actualValue'),
      previousValue: requireNumber(entry, data, 'previousValue'),
      currentValue: requireNumber(entry, data, 'currentValue'),
    },
  };
}

function readSpPoint(entry: CombatReceiptEntry): SpChangePoint {
  const { data, point } = readBase(entry);
  if (data.recipient !== 'team') {
    throw new Error(`receipt ${entry.sequence} 'SpChanged' has invalid recipient`);
  }
  const gainKind = readOptionalString(entry, data, 'gainKind');
  if (gainKind !== undefined && gainKind !== 'gain' && gainKind !== 'refund') {
    throw new Error(`receipt ${entry.sequence} 'SpChanged' has invalid gainKind`);
  }
  const source = readOptionalString(entry, data, 'source');
  if (source !== undefined && source !== 'autoRecovery') {
    throw new Error(`receipt ${entry.sequence} 'SpChanged' has invalid source`);
  }
  return {
    ...point,
    resource: 'sp',
    recipient: 'team',
    ...(gainKind === undefined ? {} : { gainKind }),
    ...(source === undefined ? {} : { source }),
  };
}

function readUltimateEnergyPoint(entry: CombatReceiptEntry): UltimateEnergyChangePoint {
  const { data, point } = readBase(entry);
  if (data.recipient !== 'operator') {
    throw new Error(`receipt ${entry.sequence} 'UltimateEnergyChanged' has invalid recipient`);
  }
  if (entry.targetId === undefined || entry.targetId.length === 0) {
    throw new Error(`receipt ${entry.sequence} 'UltimateEnergyChanged' has no targetId`);
  }
  if (typeof data.applied !== 'boolean') {
    throw new Error(`receipt ${entry.sequence} 'UltimateEnergyChanged' has no applied`);
  }
  return {
    ...point,
    resource: 'ultimateEnergy',
    recipient: data.recipient,
    targetId: entry.targetId,
    applied: data.applied,
  };
}

/** 按回执原始顺序输出变化点；同帧事实不能合并，否则会丢失账本的中间状态。 */
export function projectResourceChangePoints(
  entries: readonly CombatReceiptEntry[],
): readonly ResourceChangePoint[] {
  const points: ResourceChangePoint[] = [];
  for (const entry of entries) {
    if (entry.event === 'SpChanged') points.push(readSpPoint(entry));
    if (entry.event === 'UltimateEnergyChanged') points.push(readUltimateEnergyPoint(entry));
  }
  return points;
}
