import {
  resolveBlackboardKey,
  type BlackboardFieldContext,
} from '../../application/editor/blackboardFieldContext.ts';
export { resolveBlackboardMapping } from './blackboardMappingSchema.ts';
export type {
  BlackboardMappingDescriptor,
  BlackboardMappingDestination,
  BlackboardMappingValue,
} from './blackboardMappingSchema.ts';
import type {
  BlackboardMappingDescriptor,
  BlackboardMappingValue,
} from './blackboardMappingSchema.ts';

export interface BlackboardMappingRow {
  /** Preserves imported rows, including invalid values, until explicitly edited. */
  readonly originalKey?: string;
  key: string;
  value: unknown;
}

export function isMappingRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function createMappingRows(value: unknown): BlackboardMappingRow[] {
  return isMappingRecord(value)
    ? Object.entries(value).map(([key, value]) => ({ originalKey: key, key, value }))
    : [];
}

export function isLevelValues(value: unknown): value is number | readonly number[] {
  return typeof value === 'number'
    ? Number.isFinite(value)
    : Array.isArray(value) &&
        value.length > 0 &&
        value.every(item => typeof item === 'number' && Number.isFinite(item));
}

export function isActionValueOperand(value: unknown): boolean {
  if (!isMappingRecord(value)) return false;
  switch (value.kind) {
    case 'constant':
      return typeof value.value === 'number' && Number.isFinite(value.value);
    case 'valueNode':
      return typeof value.nodeId === 'string' && value.nodeId.trim() !== '';
    default:
      return false;
  }
}

export function validMappingValue(value: unknown, mode: BlackboardMappingValue): boolean {
  if (mode === 'string') return typeof value === 'string';
  if (mode === 'copy') return typeof value === 'string' && value.trim() !== '';
  if (mode === 'levels') return isLevelValues(value);
  return isActionValueOperand(value) || (mode === 'levelsOrOperand' && isLevelValues(value));
}

export function defaultMappingValue(mode: BlackboardMappingValue): unknown {
  return mode === 'string' || mode === 'copy' ? '' : undefined;
}

export function unchangedMappingRow(row: BlackboardMappingRow, original: unknown): boolean {
  return (
    isMappingRecord(original) &&
    row.originalKey !== undefined &&
    row.key === row.originalKey &&
    Object.hasOwn(original, row.originalKey) &&
    JSON.stringify(original[row.originalKey]) === JSON.stringify(row.value)
  );
}

export type MappingValidationError = 'emptyKey' | 'unsafeKey' | 'duplicateKey' | 'invalidValue';
export function mappingValidationError(
  rows: readonly BlackboardMappingRow[],
  original: unknown,
  mode: BlackboardMappingValue,
): MappingValidationError | undefined {
  const used = new Set<string>();
  for (const row of rows) {
    if (used.has(row.key)) return 'duplicateKey';
    used.add(row.key);
    // Retaining an old invalid row is allowed; editing another row must not silently repair it.
    if (unchangedMappingRow(row, original)) continue;
    if (!row.key.trim()) return 'emptyKey';
    if (['__proto__', 'constructor', 'prototype'].includes(row.key)) return 'unsafeKey';
    if (!validMappingValue(row.value, mode)) return 'invalidValue';
  }
  return undefined;
}

/** Object.fromEntries preserves own __proto__ properties in imported data without invoking setters. */
export function mappingFromRows(rows: readonly BlackboardMappingRow[]): Record<string, unknown> {
  return Object.fromEntries(rows.map(row => [row.key, row.value]));
}

/** 检查数据节点读取的变量是否适用于目标作用域。 */
export function validNumericReadSource(value: unknown, context: BlackboardFieldContext): boolean {
  if (!isMappingRecord(value)) return true;
  if (value.kind === 'blackboard')
    return resolveBlackboardKey(context, typeof value.key === 'string' ? value.key : '', {
      mode: 'read',
      valueType: 'number',
      ...(typeof value.fallback === 'number' ? { fallback: value.fallback } : {}),
    }).valid;
  if (value.kind === 'parameter')
    return resolveBlackboardKey(
      context,
      typeof value.parameter === 'string' ? value.parameter : '',
      {
        mode: 'parameter',
        valueType: 'number',
      },
    ).valid;
  return true;
}

/** 复制映射直接引用变量名；数值映射的节点连接由图编辑事务检查。 */
export function validMappingSources(
  rows: readonly BlackboardMappingRow[],
  original: unknown,
  mode: BlackboardMappingValue,
  context: BlackboardFieldContext,
): boolean {
  if (mode !== 'copy') return true;
  return rows.every(
    row =>
      unchangedMappingRow(row, original) ||
      (typeof row.value === 'string' &&
        resolveBlackboardKey(context, row.value, { mode: 'read', valueType: 'any' }).valid),
  );
}

/** Shared host-level guard for a retry after a rejected command or scope/catalog update. */
export function validMappingDraft(
  value: unknown,
  previous: unknown,
  descriptor: BlackboardMappingDescriptor,
  context: BlackboardFieldContext,
): boolean {
  if (!isMappingRecord(value)) return false;
  const rows = createMappingRows(value);
  return (
    mappingValidationError(rows, previous, descriptor.value) === undefined &&
    validMappingSources(rows, previous, descriptor.value, context)
  );
}
