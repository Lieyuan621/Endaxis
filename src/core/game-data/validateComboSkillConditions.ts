import { ABILITY_EVENTS } from './operatorDefinition';
import { type SkillDefinitionValidationIssue } from './validateSkillDefinition';
import { validateActionSequenceDefinition } from './validation/actionPrograms';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 只校验结构；允许编辑时暂存悬空组引用，实际场景编译时再严格绑定。 */
export function validateComboSkillConditions(
  value: unknown,
  path = 'comboSkillConditions',
): SkillDefinitionValidationIssue[] {
  const issues: SkillDefinitionValidationIssue[] = [];
  if (value === undefined) return issues;
  if (!Array.isArray(value)) return [{ path, message: 'expected an array' }];
  const keys = new Set<string>();
  const fields = new Set(['key', 'skillKey', 'event', 'immediately', 'initialValues', 'sequence']);
  value.forEach((entry: unknown, index) => {
    const p = `${path}[${index}]`;
    if (!isRecord(entry)) {
      issues.push({ path: p, message: 'expected an object' });
      return;
    }
    for (const key of Object.keys(entry)) {
      if (!fields.has(key))
        issues.push({ path: `${p}.${key}`, message: 'unsupported combo condition field' });
    }
    for (const key of ['key', 'skillKey']) {
      if (typeof entry[key] !== 'string' || entry[key].length === 0)
        issues.push({ path: `${p}.${key}`, message: 'expected a non-empty string' });
    }
    if (typeof entry.key === 'string') {
      if (keys.has(entry.key))
        issues.push({ path: `${p}.key`, message: 'duplicate combo condition key' });
      keys.add(entry.key);
    }
    if (!ABILITY_EVENTS.some(event => event === entry.event))
      issues.push({ path: `${p}.event`, message: 'expected a known AbilitySystem event' });
    if (typeof entry.immediately !== 'boolean')
      issues.push({ path: `${p}.immediately`, message: 'expected a native boolean' });
    if (entry.initialValues !== null) {
      if (!isRecord(entry.initialValues))
        issues.push({
          path: `${p}.initialValues`,
          message: 'expected a literal blackboard object or null',
        });
      else
        for (const [key, initial] of Object.entries(entry.initialValues)) {
          const valuePath = `${p}.initialValues.${JSON.stringify(key)}`;
          if (key.length === 0)
            issues.push({ path: valuePath, message: 'expected a non-empty blackboard key' });
          if (
            initial !== null &&
            typeof initial !== 'string' &&
            !(typeof initial === 'number' && Number.isFinite(initial))
          )
            issues.push({
              path: valuePath,
              message: 'expected a finite number, string or null (not level values)',
            });
        }
    }
    issues.push(...validateActionSequenceDefinition(entry.sequence, `${p}.sequence`));
  });
  return issues;
}
