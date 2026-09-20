/**
 * 把模拟日志里的伤害、附着、反应事件整理成固定格式，供命中点提示和详情使用。
 * 只搬运日志里的字段，不计算任何伤害。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';
import type { DamageType } from '../game-data/operatorDefinition';

/** 一次落到目标身上的生命伤害事实。 */
export interface HitDamageReceipt {
  readonly frame: number;
  readonly time: number;
  readonly sequence: number;
  readonly sourceId: string;
  readonly targetId: string;
  readonly damageType: DamageType;
  readonly value: number;
  readonly actualDamage: number;
  readonly isCritical: boolean;
  /** 定义步骤稳定键；缺失时只能按帧与来源归因。 */
  readonly stepKey?: string;
  readonly castId?: string;
  readonly hitId?: string;
}

/** 一次元素附着事实。 */
export interface HitInflictionReceipt {
  readonly frame: number;
  readonly time: number;
  readonly sequence: number;
  readonly sourceId: string;
  readonly targetId: string;
  readonly skillId: string;
  readonly castId?: string;
  readonly element: string;
  readonly outcomeKind: string;
  readonly currentLayers: number;
}

/** 一次反应施加或消费事实。 */
export interface HitReactionReceipt {
  readonly frame: number;
  readonly time: number;
  readonly sequence: number;
  readonly sourceId: string;
  readonly targetId: string;
  readonly reaction: string;
  readonly castId?: string;
  readonly applied: boolean;
  /** 消费回执中表示是否真的消费成功；施加回执恒为 true。 */
  readonly consumed: boolean;
  readonly level: number;
  readonly previousLevel: number;
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

function requireBoolean(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): boolean {
  const value = data[key];
  if (typeof value !== 'boolean') {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no boolean ${key}`);
  }
  return value;
}

function readDamagePoint(entry: CombatReceiptEntry): HitDamageReceipt {
  const data = requireData(entry);
  const damageType = data.damageType;
  if (typeof damageType !== 'string' || damageType.length === 0) {
    throw new Error(`receipt ${entry.sequence} 'DamageApplied' has no damageType`);
  }
  if (typeof data.isCritical !== 'boolean') {
    throw new Error(`receipt ${entry.sequence} 'DamageApplied' has no boolean isCritical`);
  }
  const stepKey = readOptionalString(entry, data, 'stepKey');
  const castId = readOptionalString(entry, data, 'castId');
  const hitId = readOptionalString(entry, data, 'hitId');
  return {
    frame: entry.frame,
    time: entry.time,
    sequence: entry.sequence,
    sourceId: requireIdentity(entry, 'sourceId'),
    targetId: requireIdentity(entry, 'targetId'),
    damageType: damageType as DamageType,
    value: requireNumber(entry, data, 'value'),
    actualDamage: requireNumber(entry, data, 'actualDamage'),
    isCritical: data.isCritical,
    ...(stepKey === undefined ? {} : { stepKey }),
    ...(castId === undefined ? {} : { castId }),
    ...(hitId === undefined ? {} : { hitId }),
  };
}

function readInflictionPoint(entry: CombatReceiptEntry): HitInflictionReceipt {
  const data = requireData(entry);
  const element = data.requestedElement;
  const outcomeKind = data.outcomeKind;
  const castId = readOptionalString(entry, data, 'castId');
  if (typeof element !== 'string' || element.length === 0) {
    throw new Error(`receipt ${entry.sequence} 'ElementalInflictionApplied' has no element`);
  }
  if (typeof outcomeKind !== 'string' || outcomeKind.length === 0) {
    throw new Error(`receipt ${entry.sequence} 'ElementalInflictionApplied' has no outcomeKind`);
  }
  return {
    frame: entry.frame,
    time: entry.time,
    sequence: entry.sequence,
    sourceId: requireIdentity(entry, 'sourceId'),
    targetId: requireIdentity(entry, 'targetId'),
    skillId: readOptionalString(entry, data, 'skillId') ?? '',
    ...(castId === undefined ? {} : { castId }),
    element,
    outcomeKind,
    currentLayers: requireNumber(entry, data, 'currentLayers'),
  };
}

function readReactionPoint(entry: CombatReceiptEntry): HitReactionReceipt {
  const data = requireData(entry);
  const reaction = data.reaction;
  if (typeof reaction !== 'string' || reaction.length === 0) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no reaction`);
  }
  const applied = entry.event === 'ElementalReactionApplied';
  const consumed = applied ? true : requireBoolean(entry, data, 'consumed');
  const castId = readOptionalString(entry, data, 'castId');
  return {
    frame: entry.frame,
    time: entry.time,
    sequence: entry.sequence,
    sourceId: requireIdentity(entry, 'sourceId'),
    targetId: requireIdentity(entry, 'targetId'),
    reaction,
    ...(castId === undefined ? {} : { castId }),
    applied,
    consumed,
    level: requireNumber(entry, data, 'level'),
    previousLevel: applied ? requireNumber(entry, data, 'previousLevel') : 0,
  };
}

/** 按回执原始顺序输出全部生命伤害事实。 */
export function projectHitDamageReceipts(
  entries: readonly CombatReceiptEntry[],
): readonly HitDamageReceipt[] {
  const points: HitDamageReceipt[] = [];
  for (const entry of entries) {
    if (entry.event === 'DamageApplied') points.push(readDamagePoint(entry));
  }
  return points;
}

/** 按回执原始顺序输出全部元素附着事实。 */
export function projectHitInflictionReceipts(
  entries: readonly CombatReceiptEntry[],
): readonly HitInflictionReceipt[] {
  const points: HitInflictionReceipt[] = [];
  for (const entry of entries) {
    if (entry.event === 'ElementalInflictionApplied') points.push(readInflictionPoint(entry));
  }
  return points;
}

/** 按回执原始顺序输出全部反应施加与消费事实；未消费成功的消费回执不输出。 */
export function projectHitReactionReceipts(
  entries: readonly CombatReceiptEntry[],
): readonly HitReactionReceipt[] {
  const points: HitReactionReceipt[] = [];
  for (const entry of entries) {
    if (entry.event !== 'ElementalReactionApplied' && entry.event !== 'ElementalReactionConsumed') {
      continue;
    }
    const point = readReactionPoint(entry);
    if (!point.applied && !point.consumed) continue;
    points.push(point);
  }
  return points;
}
