import type { DefinitionFieldSchema, DefinitionSchemaReferences } from './fieldSchema.ts';
import {
  resolveDefinitionSchema,
  EMPTY_SCHEMA_REFERENCES,
  createFieldTraversalWork,
  type FieldTraversalWork,
} from './resolveDefinitionSchema.ts';
import { validateTimeScaleCurve } from '../game-data/validation/timeScaleCurve.ts';

export function selectDefinitionSchema(
  declared: DefinitionFieldSchema | undefined,
  value: unknown,
  references: DefinitionSchemaReferences,
  work: FieldTraversalWork = createFieldTraversalWork(),
): DefinitionFieldSchema {
  work.visit();
  const schema = declared && resolveDefinitionSchema(declared, references);
  if (schema?.kind === 'union') {
    const variants = schema.variants.map(variant => resolveDefinitionSchema(variant, references));
    const known = new Set(
      variants.flatMap(variant => (variant.kind === 'object' ? Object.keys(variant.fields) : [])),
    );
    const candidates = variants.filter(variant =>
      matchesShape(variant, value, known, references, work),
    );
    const matches =
      candidates.length > 1
        ? candidates.filter(variant => hasRequiredSlots(variant, value, references, work))
        : candidates;
    return matches.length === 1
      ? matches[0]!
      : {
          kind: 'opaque',
          optional: schema.optional,
          description: schema.description,
          fallback: { reason: 'unsupported-type' },
        };
  }
  return schema ?? { kind: 'opaque' };
}

/** Unknown extension keys do not choose a branch; fields declared by another branch do. */
function matchesShape(
  schema: DefinitionFieldSchema,
  value: unknown,
  known = new Set<string>(),
  references: DefinitionSchemaReferences = EMPTY_SCHEMA_REFERENCES,
  work: FieldTraversalWork = createFieldTraversalWork(),
): boolean {
  work.visit();
  schema = resolveDefinitionSchema(schema, references);
  if (value === undefined) return schema.optional === true;
  if (schema.fallback?.reason === 'no-present-type') return false;
  if (schema.kind === 'union')
    return selectDefinitionSchema(schema, value, references, work).kind !== 'opaque';
  if (schema.kind === 'timeScaleCurve') {
    try {
      const issues: { path: string; message: string }[] = [];
      validateTimeScaleCurve(value, 'curve', issues);
      return !issues.length;
    } catch {
      return false;
    }
  }
  if (schema.kind === 'enum') return schema.options.includes(value as string | number | boolean);
  if (schema.kind === 'null') return value === null;
  if (schema.kind === 'array')
    return (
      Array.isArray(value) &&
      value.every(entry => matchesShape(schema.element, entry, undefined, references, work))
    );
  if (schema.kind === 'tuple')
    return (
      Array.isArray(value) &&
      value.length >= schema.minLength &&
      value.length <= schema.elements.length &&
      value.every((entry, index) =>
        matchesShape(schema.elements[index]!, entry, undefined, references, work),
      )
    );
  if (schema.kind === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    // Prune discriminants before descending regardless of source object key order.
    for (const [key, child] of Object.entries(schema.fields)) {
      const slot = resolveDefinitionSchema(child, references);
      if (
        slot.kind === 'enum' &&
        Object.hasOwn(value, key) &&
        !slot.options.includes((value as Record<string, unknown>)[key] as string | number | boolean)
      )
        return false;
    }
    return Object.entries(value).every(([key, entry]) =>
      Object.hasOwn(schema.fields, key)
        ? matchesShape(schema.fields[key]!, entry, undefined, references, work)
        : !known.has(key),
    );
  }
  if (schema.kind === 'record')
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
  if (['graph', 'condition', 'opaque'].includes(schema.kind)) return true;
  return typeof value === schema.kind;
}

function hasRequiredSlots(
  schema: DefinitionFieldSchema,
  value: unknown,
  references: DefinitionSchemaReferences,
  work: FieldTraversalWork,
): boolean {
  work.visit();
  schema = resolveDefinitionSchema(schema, references);
  if (value === undefined) return schema.optional === true;
  const shape = selectDefinitionSchema(schema, value, references, work);
  if (shape.kind === 'object' && value && typeof value === 'object')
    return Object.entries(shape.fields).every(
      ([key, child]) =>
        (resolveDefinitionSchema(child, references).optional || Object.hasOwn(value, key)) &&
        (!Object.hasOwn(value, key) ||
          hasRequiredSlots(child, (value as Record<string, unknown>)[key], references, work)),
    );
  if (shape.kind === 'array' && Array.isArray(value))
    return value.every(entry => hasRequiredSlots(shape.element, entry, references, work));
  if (shape.kind === 'tuple' && Array.isArray(value))
    return (
      value.length >= shape.minLength &&
      value.every((entry, index) =>
        hasRequiredSlots(shape.elements[index]!, entry, references, work),
      )
    );
  return true;
}
