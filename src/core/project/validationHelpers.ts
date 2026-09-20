/**
 * 项目校验器共享的严格 JSON 检查原语。新增 schema 字段时应复用这些路径工具，
 * 保证错误能定位到用户文档，而不是返回脱离上下文的类型异常。
 */
import type { JsonObject } from './schema';

/** 带 JSON 路径的结构问题，供加载 UI 定位具体非法字段。 */
export interface ValidationIssue {
  path: string;
  message: string;
}

export function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function requireString(
  object: JsonObject,
  key: string,
  path: string,
  issues: ValidationIssue[],
): string | null {
  const value = object[key];
  if (typeof value === 'string' && value.length > 0) return value;
  issues.push({ path: `${path}.${key}`, message: 'expected a non-empty string' });
  return null;
}

export function requireNonNegativeInteger(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return;
  issues.push({ path, message: 'expected a non-negative integer' });
}

export function requirePositiveInteger(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return;
  issues.push({ path, message: 'expected a positive integer' });
}

export function requireInteger(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (typeof value === 'number' && Number.isInteger(value)) return;
  issues.push({ path, message: 'expected an integer' });
}

export function requireFiniteNumber(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (typeof value === 'number' && Number.isFinite(value)) return;
  issues.push({ path, message: 'expected a finite number' });
}

export function requireBoolean(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (typeof value === 'boolean') return;
  issues.push({ path, message: 'expected a boolean' });
}

export function validateFiniteNumberRecord(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!isObject(value)) {
    issues.push({ path, message: 'expected an object' });
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    requireFiniteNumber(entry, `${path}.${key}`, issues);
  }
}

export function validateEditedFields(
  value: unknown,
  allowed: ReadonlySet<string>,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(value)) {
    issues.push({ path, message: 'expected an array' });
    return;
  }
  const seen = new Set<string>();
  value.forEach((entry, index) => {
    if (typeof entry !== 'string' || !allowed.has(entry)) {
      issues.push({ path: `${path}[${index}]`, message: 'unexpected editable field' });
      return;
    }
    if (seen.has(entry)) {
      issues.push({ path: `${path}[${index}]`, message: 'duplicate editable field' });
    }
    seen.add(entry);
  });
}

export function requireEnum(
  value: unknown,
  allowed: ReadonlySet<string>,
  path: string,
  issues: ValidationIssue[],
): void {
  if (typeof value === 'string' && allowed.has(value)) return;
  issues.push({ path, message: 'unexpected enum value' });
}
