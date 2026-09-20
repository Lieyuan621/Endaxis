/**
 * 将元素附着结算回执转换为状态条可消费的有序变化点。
 * 本投影只校验和搬运执行现场事实，不解析附着规则或推导反应。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';
import type { InflictionElement } from '../game-data/operatorDefinition';
import { INFLICTION_ELEMENTS } from '../game-data/operatorDefinition';
import type { ElementalInflictionOutcomeKind } from '../combat/infliction/elementalInfliction';
import { ELEMENTAL_INFLICTION_OUTCOME_KINDS } from '../combat/infliction/elementalInfliction';

/** 一次附着申请完成后的前后状态和实际反应分支。 */
export interface ElementalInflictionChangePoint {
  readonly frame: number;
  readonly time: number;
  readonly sequence: number;
  readonly sourceId: string;
  readonly targetId: string;
  readonly skillId: string;
  readonly requestedElement: InflictionElement;
  readonly isExtra: boolean;
  readonly previousElement: InflictionElement | null;
  readonly previousLayers: number;
  readonly currentElement: InflictionElement | null;
  readonly currentLayers: number;
  readonly outcomeKind: ElementalInflictionOutcomeKind;
  readonly consumedElement?: InflictionElement;
  readonly consumedLayers?: number;
  readonly operationKinds: string;
}

function requireIdentity(entry: CombatReceiptEntry, key: 'sourceId' | 'targetId'): string {
  const value = entry[key];
  if (value === undefined || value.length === 0) {
    throw new Error(`receipt ${entry.sequence} 'ElementalInflictionApplied' has no ${key}`);
  }
  return value;
}

function requireData(entry: CombatReceiptEntry): Readonly<Record<string, CombatReceiptValue>> {
  if (entry.data === undefined) {
    throw new Error(`receipt ${entry.sequence} 'ElementalInflictionApplied' has no data`);
  }
  return entry.data;
}

function requireString(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): string {
  const value = data[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`receipt ${entry.sequence} 'ElementalInflictionApplied' has no ${key}`);
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
    throw new Error(`receipt ${entry.sequence} 'ElementalInflictionApplied' has no boolean ${key}`);
  }
  return value;
}

function requireElement(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): InflictionElement {
  const value = data[key];
  if (!INFLICTION_ELEMENTS.includes(value as InflictionElement)) {
    throw new Error(`receipt ${entry.sequence} 'ElementalInflictionApplied' has invalid ${key}`);
  }
  return value as InflictionElement;
}

function requireAttachment(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  prefix: 'previous' | 'current',
): { element: InflictionElement | null; layers: number } {
  const elementValue = data[`${prefix}Element`];
  const element = elementValue === null ? null : requireElement(entry, data, `${prefix}Element`);
  const layers = data[`${prefix}Layers`];
  const validLayers =
    typeof layers === 'number' &&
    Number.isInteger(layers) &&
    (element === null ? layers === 0 : layers > 0);
  if (!validLayers) {
    throw new Error(
      `receipt ${entry.sequence} 'ElementalInflictionApplied' has invalid ${prefix}Layers`,
    );
  }
  return { element, layers };
}

function requireOutcomeKind(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
): ElementalInflictionOutcomeKind {
  const value = data.outcomeKind;
  if (!ELEMENTAL_INFLICTION_OUTCOME_KINDS.includes(value as ElementalInflictionOutcomeKind)) {
    throw new Error(
      `receipt ${entry.sequence} 'ElementalInflictionApplied' has invalid outcomeKind`,
    );
  }
  return value as ElementalInflictionOutcomeKind;
}

function readConsumedAttachment(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  outcomeKind: ElementalInflictionOutcomeKind,
): { consumedElement?: InflictionElement; consumedLayers?: number } {
  if (outcomeKind !== 'compoundStatus') {
    if (data.consumedElement !== undefined || data.consumedLayers !== undefined) {
      throw new Error(
        `receipt ${entry.sequence} 'ElementalInflictionApplied' has unexpected consumed attachment`,
      );
    }
    return {};
  }
  const consumedElement = requireElement(entry, data, 'consumedElement');
  const consumedLayers = data.consumedLayers;
  if (
    typeof consumedLayers !== 'number' ||
    !Number.isInteger(consumedLayers) ||
    consumedLayers <= 0
  ) {
    throw new Error(
      `receipt ${entry.sequence} 'ElementalInflictionApplied' has invalid consumedLayers`,
    );
  }
  return { consumedElement, consumedLayers };
}

function readPoint(entry: CombatReceiptEntry): ElementalInflictionChangePoint {
  const data = requireData(entry);
  const previous = requireAttachment(entry, data, 'previous');
  const current = requireAttachment(entry, data, 'current');
  const outcomeKind = requireOutcomeKind(entry, data);
  return {
    frame: entry.frame,
    time: entry.time,
    sequence: entry.sequence,
    sourceId: requireIdentity(entry, 'sourceId'),
    targetId: requireIdentity(entry, 'targetId'),
    skillId: requireString(entry, data, 'skillId'),
    requestedElement: requireElement(entry, data, 'requestedElement'),
    isExtra: requireBoolean(entry, data, 'isExtra'),
    previousElement: previous.element,
    previousLayers: previous.layers,
    currentElement: current.element,
    currentLayers: current.layers,
    outcomeKind,
    ...readConsumedAttachment(entry, data, outcomeKind),
    operationKinds: requireString(entry, data, 'operationKinds'),
  };
}

/** 按回执原始顺序输出；同帧多次附着结算不能合并。 */
export function projectElementalInflictionChangePoints(
  entries: readonly CombatReceiptEntry[],
): readonly ElementalInflictionChangePoint[] {
  return entries.filter(entry => entry.event === 'ElementalInflictionApplied').map(readPoint);
}
