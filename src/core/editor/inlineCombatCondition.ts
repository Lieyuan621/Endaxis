import { selectDefinitionSchema } from './selectDefinitionSchema.ts';
import type { DefinitionFieldSchema, DefinitionSchemaReferences } from './fieldSchema.ts';
import type { FieldSemantics } from './fieldSemantics.ts';
import {
  assertFiniteFieldValue,
  createFieldTraversalWork,
  resolveDefinitionSchema,
  EMPTY_SCHEMA_REFERENCES,
} from './resolveDefinitionSchema.ts';
import { validateCombatCondition } from '../game-data/validation/combatConditions.ts';
import type { SkillDefinitionValidationIssue } from '../game-data/validation/definitionValues.ts';

export function schemaHasAlias(schema: DefinitionFieldSchema, alias: string): boolean {
  const has = (value: FieldSemantics | undefined): boolean =>
    !!value?.aliases?.some(candidate => candidate === alias) || !!value?.unionVariants?.some(has);
  return has(schema.semantics);
}
export function isInlineCombatCondition(schema: DefinitionFieldSchema): boolean {
  return !!schema.inlineCondition && schemaHasAlias(schema, 'CombatCondition');
}
/** Reuse the standalone validator; this boundary never binds graph or macro inputs. */
export function assertInlineCombatCondition(
  schema: DefinitionFieldSchema,
  value: unknown,
  references: DefinitionSchemaReferences = schema.references ?? EMPTY_SCHEMA_REFERENCES,
): void {
  assertFiniteFieldValue(value);
  if (value === undefined && schema.optional) return;
  const issues: SkillDefinitionValidationIssue[] = [];
  validateCombatCondition(value, 'condition', issues);
  if (issues.length)
    throw new Error(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
  const work = createFieldTraversalWork();
  function check(declared: DefinitionFieldSchema, current: unknown): void {
    work.visit();
    declared = resolveDefinitionSchema(declared, references);
    if (current === undefined && declared.optional) return;
    if (
      (schemaHasAlias(declared, 'ActionValueOperand') ||
        schemaHasAlias(declared, 'ActionStringOperand')) &&
      current &&
      typeof current === 'object' &&
      'kind' in current &&
      ['parameter', 'valueNode', 'stringNode'].includes(String(current.kind))
    )
      throw new Error('inline conditions cannot bind graph or macro inputs');
    const shape = selectDefinitionSchema(declared, current, references, work);
    if (['opaque', 'condition', 'graph'].includes(shape.kind))
      throw new Error('invalid or unsupported inline condition');
    if (shape.kind === 'object' && current && typeof current === 'object')
      for (const [key, child] of Object.entries(shape.fields))
        check(child, (current as Record<string, unknown>)[key]);
    if (shape.kind === 'array' && Array.isArray(current))
      for (const child of current) check(shape.element, child);
    if (shape.kind === 'tuple' && Array.isArray(current))
      current.forEach((child, index) => check(shape.elements[index]!, child));
    if (shape.kind === 'record' && current && typeof current === 'object')
      for (const child of Object.values(current)) check(shape.value, child);
  }
  check(schema, value);
  if (
    schema.inlineCondition === 'enemyStaggered' &&
    (!value ||
      typeof value !== 'object' ||
      !('kind' in value) ||
      value.kind !== 'targetStaggered' ||
      !('target' in value) ||
      value.target !== 'enemy')
  )
    throw new Error('condition only supports targetStaggered for the enemy damage snapshot');
}
