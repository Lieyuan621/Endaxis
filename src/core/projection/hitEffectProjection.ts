/**
 * 把模拟日志里的伤害、附着事件整理成固定格式，供命中点提示和详情使用。
 * 保留伤害事实，必要时沿对象产生链补齐展示归属，不计算任何伤害。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';
import type { DamageType } from '../game-data/operatorDefinition';
import { deriveHitId } from '../combat/timeline/deriveHitId';
import { CombatObjectOrigins } from './combatObjectOrigins';

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

/** 展示身份与数值解析分离，标记和详情选择使用同一归属规则。 */
export function projectHitDamageIdentity(
  entry: CombatReceiptEntry,
  origins: CombatObjectOrigins,
): Pick<HitDamageReceipt, 'stepKey' | 'castId' | 'hitId'> {
  const data = requireData(entry);
  const stepKey = readOptionalString(entry, data, 'stepKey');
  let castId = readOptionalString(entry, data, 'castId');
  let hitId = readOptionalString(entry, data, 'hitId');
  // 子技能可以不继承原生施放信息，展示归属仍由对象的产生链确定。
  // 这里只补展示身份，不修改回执，也不沿增益提供者或当前主控猜测来源。
  if (castId === undefined && stepKey !== undefined) {
    const origin = origins.findAncestor(
      origins.get({ kind: 'receipt', sequence: entry.sequence }),
      node => origins.isSkillCast(node, entry.sequence),
      { relations: ['producedBy', 'originCast'], throughSequence: entry.sequence },
    );
    if (origin.status === 'found' && origin.node.ref.kind === 'action') {
      castId = origin.node.ref.actionId;
      hitId ??= deriveHitId(castId, stepKey);
    }
  }
  return {
    ...(stepKey === undefined ? {} : { stepKey }),
    ...(castId === undefined ? {} : { castId }),
    ...(hitId === undefined ? {} : { hitId }),
  };
}

/** 无法定位到技能命中点的伤害仍须保留独立的回执入口。 */
export function isUnattributedDamageReceipt(
  entry: CombatReceiptEntry,
  origins: CombatObjectOrigins,
): boolean {
  if (entry.event !== 'DamageApplied') return false;
  const identity = projectHitDamageIdentity(entry, origins);
  return !identity.castId || !identity.hitId || !identity.stepKey;
}

function readDamagePoint(
  entry: CombatReceiptEntry,
  origins: CombatObjectOrigins,
): HitDamageReceipt {
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
    isCritical: data.isCritical,
    ...projectHitDamageIdentity(entry, origins),
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

/** 按回执原始顺序输出全部生命伤害事实。 */
export function projectHitDamageReceipts(
  entries: readonly CombatReceiptEntry[],
  origins = new CombatObjectOrigins(entries),
): readonly HitDamageReceipt[] {
  const points: HitDamageReceipt[] = [];
  for (const entry of entries) {
    if (entry.event !== 'DamageApplied') continue;
    points.push(readDamagePoint(entry, origins));
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
