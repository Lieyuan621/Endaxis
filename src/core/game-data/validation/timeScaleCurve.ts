/** Shared curve structure validation. No catalog, runtime or editor dependencies. */
interface SkillDefinitionValidationIssue {
  path: string;
  message: string;
}
function push(out: SkillDefinitionValidationIssue[], path: string, message: string): void {
  out.push({ path, message });
}
function asRecord(
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
function requireString(
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
function requireFiniteNumber(
  value: Record<string, unknown>,
  key: string,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  if (typeof value[key] !== 'number' || !Number.isFinite(value[key]))
    push(out, `${path}.${key}`, 'expected a finite number');
}

export function validateTimeScaleCurve(
  value: unknown,
  path: string,
  out: SkillDefinitionValidationIssue[],
): void {
  const record = asRecord(value, path, out);
  if (record === null) return;
  const kind = requireString(record, 'kind', path, out);
  if (kind === 'named') {
    const key = requireString(record, 'key', path, out);
    if (key !== null && key.length === 0) push(out, `${path}.key`, 'expected a non-empty string');
    return;
  }
  if (kind !== 'inline') {
    if (kind !== null) push(out, `${path}.kind`, "expected 'named' or 'inline'");
    return;
  }
  if (!Array.isArray(record.keys) || record.keys.length === 0) {
    push(out, `${path}.keys`, 'expected a non-empty array');
    return;
  }
  let previousTime = Number.NEGATIVE_INFINITY;
  record.keys.forEach((value, index) => {
    const keyPath = `${path}.keys[${index}]`;
    const key = asRecord(value, keyPath, out);
    if (key === null) return;
    for (const field of ['time', 'value', 'inWeight', 'outWeight']) {
      requireFiniteNumber(key, field, keyPath, out);
    }
    for (const field of ['inTangent', 'outTangent']) {
      const tangent = key[field];
      if (typeof tangent !== 'number' || Number.isNaN(tangent))
        push(out, `${keyPath}.${field}`, 'expected a number other than NaN');
    }
    const time = key.time;
    if (typeof time === 'number' && Number.isFinite(time)) {
      if (time <= previousTime) push(out, `${keyPath}.time`, 'expected strictly increasing times');
      previousTime = time;
    }
    const weightedMode = key.weightedMode;
    if (
      typeof weightedMode !== 'number' ||
      !Number.isInteger(weightedMode) ||
      weightedMode < 0 ||
      weightedMode > 3
    ) {
      push(out, `${keyPath}.weightedMode`, 'expected an integer from 0 to 3');
    }
  });
}
