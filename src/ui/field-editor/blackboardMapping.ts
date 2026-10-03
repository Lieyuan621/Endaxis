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
    case 'blackboard':
      return (
        typeof value.key === 'string' &&
        value.key.trim() !== '' &&
        (value.fallback === undefined ||
          (typeof value.fallback === 'number' && Number.isFinite(value.fallback)))
      );
    case 'parameter':
      return typeof value.parameter === 'string' && value.parameter.trim() !== '';
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

/** Recheck source types/scopes at the transaction boundary, including a changed context. */
export function validMappingSources(
  rows: readonly BlackboardMappingRow[],
  original: unknown,
  mode: BlackboardMappingValue,
  context: BlackboardFieldContext,
  allowsParameters = true,
): boolean {
  return rows.every(row => {
    if (unchangedMappingRow(row, original)) return true;
    const value = row.value;
    const key =
      mode === 'copy'
        ? value
        : isMappingRecord(value) && value.kind === 'blackboard'
          ? value.key
          : undefined;

    if (
      typeof key === 'string' &&
      !resolveBlackboardKey(context, key, {
        mode: 'read',
        valueType: mode === 'copy' ? 'any' : 'number',
        ...(isMappingRecord(value) &&
        value.kind === 'blackboard' &&
        typeof value.fallback === 'number'
          ? { fallback: value.fallback }
          : {}),
      }).valid
    )
      return false;
    if (isMappingRecord(value) && value.kind === 'parameter')
      return (
        allowsParameters &&
        resolveBlackboardKey(context, typeof value.parameter === 'string' ? value.parameter : '', {
          mode: 'parameter',
          valueType: 'number',
        }).valid
      );
    return true;
  });
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
    validMappingSources(
      rows,
      previous,
      descriptor.value,
      context,
      descriptor.allowsParameters !== false,
    )
  );
}
