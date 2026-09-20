import { NATIVE_SKILL_TYPES, COMBAT_RESOURCES } from '../operatorDefinition';
import { BUFF_APPLICATION_TARGETS, BUFF_APPLICATION_SOURCES } from '../operatorDefinition';
import {
  assertGameplayTag,
  GAMEPLAY_TAG_QUERY_TYPES,
} from '../../../../packages/game-data-contract/src/gameplayTags';
import {
  COMBAT_TARGETS,
  TIMED_MARKER_TARGETS,
  DAMAGE_TAGS,
  DAMAGE_ELEMENTS,
  DAMAGE_FEATURES,
  DAMAGE_TYPES,
  ELEMENTAL_REACTIONS,
  INFLICTION_ELEMENTS,
  OPERATOR_ATTRIBUTES,
  PHYSICAL_INFLICTION_TYPES,
  SKILL_TYPES,
} from '../operatorDefinition';

export const DAMAGE_FEATURES_SET = new Set<string>(DAMAGE_FEATURES);
export const DAMAGE_ELEMENTS_SET = new Set<string>(DAMAGE_ELEMENTS);

export interface SkillDefinitionValidationIssue {
  path: string;
  message: string;
}

export const DAMAGE_TYPES_SET = new Set<string>(DAMAGE_TYPES);

export const DAMAGE_TAGS_SET = new Set<string>(DAMAGE_TAGS);

export const INFLICTION_ELEMENTS_SET = new Set<string>(INFLICTION_ELEMENTS);

export const ELEMENTAL_REACTIONS_SET = new Set<string>(ELEMENTAL_REACTIONS);

export const COMBAT_TARGETS_SET = new Set<string>(COMBAT_TARGETS);

export const TIMED_MARKER_TARGETS_SET = new Set<string>(TIMED_MARKER_TARGETS);

export const OPERATOR_ATTRIBUTES_SET = new Set<string>(OPERATOR_ATTRIBUTES);

export const PHYSICAL_INFLICTION_TYPES_SET = new Set<string>(PHYSICAL_INFLICTION_TYPES);

export const SKILL_TYPES_SET = new Set<string>(SKILL_TYPES);

export const TAG_QUERY_TYPES_SET = new Set<string>(GAMEPLAY_TAG_QUERY_TYPES);

export function issue(path: string, message: string): SkillDefinitionValidationIssue {
  return { path, message };
}

export function push(out: SkillDefinitionValidationIssue[], path: string, message: string): void {
  out.push(issue(path, message));
}

/** 结构判断：仅当是普通对象时返回 Record，否则记录 issue 并返回 null。 */
export function asRecord(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    push(out, path, 'expected an object');
    return null;
  }
  return value as Record<string, unknown>;
}

export function requireString(
  value: Record<string, unknown>,
  key: string,
  path: string,
  out: SkillDefinitionValidationIssue[],
): string | null {
  const v = value[key];
  if (typeof v !== 'string' || v.length === 0) {
    push(out, `${path}.${key}`, 'expected a non-empty string');
    return null;
  }
  return v;
}

export const NATIVE_SKILL_TYPES_SET = new Set<string>(NATIVE_SKILL_TYPES);
export const COMBAT_RESOURCES_SET = new Set<string>(COMBAT_RESOURCES);

export function requireFiniteNumber(
  value: Record<string, unknown>,
  key: string,
  path: string,
  out: SkillDefinitionValidationIssue[],
): number | null {
  const v = value[key];
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    push(out, `${path}.${key}`, 'expected a finite number');
    return null;
  }
  return v;
}

export function requireNonNegativeInteger(
  value: Record<string, unknown>,
  key: string,
  path: string,
  out: SkillDefinitionValidationIssue[],
): number | null {
  const v = value[key];
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
    push(out, `${path}.${key}`, 'expected a non-negative integer');
    return null;
  }
  return v;
}

export function requireBoolean(
  value: Record<string, unknown>,
  key: string,
  path: string,
  out: SkillDefinitionValidationIssue[],
): boolean | null {
  const v = value[key];
  if (typeof v !== 'boolean') {
    push(out, `${path}.${key}`, 'expected a boolean');
    return null;
  }
  return v;
}

export function requireEnum(
  value: Record<string, unknown>,
  key: string,
  allowed: ReadonlySet<string>,
  path: string,
  out: SkillDefinitionValidationIssue[],
): string | null {
  const v = value[key];
  if (typeof v !== 'string' || !allowed.has(v)) {
    push(out, `${path}.${key}`, `expected one of ${[...allowed].join(', ')}`);
    return null;
  }
  return v;
}

/**
 * LevelValues：接受 finite number 或非空 finite number 数组。
 * 数组元素逐项校验；空数组、非数值、无穷均报错。
 */
export function validateLevelValues(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) push(out, path, 'expected a finite number');
    return;
  }
  if (!Array.isArray(value) || value.length === 0) {
    push(out, path, 'expected a finite number or a non-empty number array');
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== 'number' || !Number.isFinite(entry)) {
      push(out, `${path}[${index}]`, 'expected a finite number');
    }
  });
}

/** ActionValueOperand：blackboard（key）或 constant（value）。 */
export function validateActionValueOperand(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  const record = asRecord(value, path, out);
  if (record === null) return;
  const kind = requireString(record, 'kind', path, out);
  if (kind === 'blackboard') {
    requireString(record, 'key', path, out);
    if (record.fallback !== undefined) requireFiniteNumber(record, 'fallback', path, out);
  } else if (kind === 'constant') {
    requireFiniteNumber(record, 'value', path, out);
  } else if (kind !== null) {
    push(out, `${path}.kind`, "expected 'blackboard' or 'constant'");
  }
}

export function validateActionStringOperand(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  if (typeof value === 'string') {
    if (value.length === 0) push(out, path, 'expected a non-empty string');
    return;
  }
  const record = asRecord(value, path, out);
  if (record !== null) requireString(record, 'blackboardKey', path, out);
}

/** 值可以是 LevelValues 或 ActionValueOperand 的字段。 */
export function validateLevelValuesOrActionValueOperand(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    validateActionValueOperand(value, path, out);
  } else {
    validateLevelValues(value, path, out);
  }
}

/** 非空字符串数组。 */
export function validateNonEmptyStringArray(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  if (!Array.isArray(value) || value.length === 0) {
    push(out, path, 'expected a non-empty array');
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== 'string' || entry.length === 0) {
      push(out, `${path}[${index}]`, 'expected a non-empty string');
    }
  });
}

/** 非空且只包含已定义伤害标签的数组。 */
export function validateDamageTags(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
  requireNonEmpty = true,
): void {
  if (!Array.isArray(value) || (requireNonEmpty && value.length === 0)) {
    push(out, path, requireNonEmpty ? 'expected a non-empty array' : 'expected an array');
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== 'string' || !DAMAGE_TAGS_SET.has(entry)) {
      push(out, `${path}[${index}]`, 'unknown damage tag');
    }
  });
}

export function validateDamageFeatures(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  if (!Array.isArray(value) || value.length === 0) {
    push(out, path, 'expected a non-empty array');
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== 'string' || !DAMAGE_FEATURES_SET.has(entry)) {
      push(out, `${path}[${index}]`, 'unknown damage feature');
    }
  });
}

/** 布尔/数字/字符串三选一。 */
export function validateScalar(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  if (typeof value !== 'boolean' && typeof value !== 'number' && typeof value !== 'string') {
    push(out, path, 'expected a boolean, number, or string');
  }
}

/** 元素或元素数组。 */
export function validateElements(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  if (Array.isArray(value)) {
    value.forEach((element, index) => {
      if (typeof element !== 'string' || !DAMAGE_ELEMENTS_SET.has(element)) {
        push(out, `${path}[${index}]`, 'unknown damage element');
      }
    });
    return;
  }
  if (typeof value !== 'string' || !DAMAGE_ELEMENTS_SET.has(value)) {
    push(out, path, 'unknown damage element');
  }
}

export function validateGameplayTag(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  try {
    assertGameplayTag(value);
  } catch {
    push(out, path, 'expected readable GameplayTag path');
  }
}

export function validateGameplayTags(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
  allowEmpty = false,
): void {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    push(out, path, allowEmpty ? 'expected an array' : 'expected a non-empty array');
    return;
  }
  value.forEach((tag, index) => validateGameplayTag(tag, path + '[' + index + ']', out));
}

export const BUFF_APPLICATION_TARGETS_SET = new Set<string>(BUFF_APPLICATION_TARGETS);
export const BUFF_APPLICATION_SOURCES_SET = new Set<string>(BUFF_APPLICATION_SOURCES);
export function requireInteger(
  value: Record<string, unknown>,
  key: string,
  path: string,
  out: SkillDefinitionValidationIssue[],
): number | null {
  const v = value[key];
  if (typeof v !== 'number' || !Number.isInteger(v)) {
    push(out, `${path}.${key}`, 'expected an integer');
    return null;
  }
  return v;
}
