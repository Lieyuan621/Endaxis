import type { DefinitionFieldSchema, DefinitionSchemaReferences } from './fieldSchema.ts';

export const EMPTY_SCHEMA_REFERENCES: DefinitionSchemaReferences = Object.freeze({});

/** Cache only immutable resolutions in the supplied document context. No catalog registry. */
const resolvedReferences = new WeakMap<
  DefinitionSchemaReferences,
  WeakMap<DefinitionFieldSchema, DefinitionFieldSchema>
>();

export function resolveDefinitionSchema(
  schema: DefinitionFieldSchema,
  references: DefinitionSchemaReferences = schema.references ?? EMPTY_SCHEMA_REFERENCES,
): Exclude<DefinitionFieldSchema, { kind: 'ref' }> {
  if (schema.kind !== 'ref') return schema;
  let cache = resolvedReferences.get(references);
  if (!cache) resolvedReferences.set(references, (cache = new WeakMap()));
  const cached = cache.get(schema);
  if (cached) return cached as Exclude<DefinitionFieldSchema, { kind: 'ref' }>;
  const chain: DefinitionFieldSchema[] = [];
  const seen = new Set<string>();
  let current: DefinitionFieldSchema = schema;
  while (current.kind === 'ref') {
    if (seen.has(current.ref)) throw new Error(`cyclic schema reference '${current.ref}'`);
    seen.add(current.ref);
    chain.push(current);
    const target: DefinitionFieldSchema | undefined = references[current.ref];
    if (!target) throw new Error(`missing schema reference '${current.ref}'`);
    current = target;
  }
  let result: DefinitionFieldSchema = current;
  for (const entry of chain.reverse()) {
    const {
      kind: _kind,
      ref: _ref,
      references: _references,
      ...metadata
    } = entry as Extract<DefinitionFieldSchema, { kind: 'ref' }>;
    result = { ...result, ...metadata, optional: entry.optional === true };
  }
  cache.set(schema, result);
  return result as Exclude<DefinitionFieldSchema, { kind: 'ref' }>;
}

/** All value scans share a finite budget, including unknown extension values and identity
 * comparisons. Ancestors, rather than a global seen set, reject cycles but permit sharing. */
export const FIELD_VALUE_VISIT_LIMIT = 16_384;
export const FIELD_VALUE_DEPTH_LIMIT = 192;
export function assertFiniteFieldValue(value: unknown): void {
  const ancestors = new Set<object>();
  let visits = 0;
  const stack: { value: unknown; depth: number; leave?: boolean }[] = [{ value, depth: 0 }];
  while (stack.length) {
    const item = stack.pop()!;
    if (item.leave) {
      ancestors.delete(item.value as object);
      continue;
    }
    if (++visits > FIELD_VALUE_VISIT_LIMIT || item.depth > FIELD_VALUE_DEPTH_LIMIT)
      throw new Error('field value traversal budget exceeded');
    if (!item.value || typeof item.value !== 'object') continue;
    if (ancestors.has(item.value)) throw new Error('cyclic field value');
    ancestors.add(item.value);
    stack.push({ ...item, leave: true });
    const entries = Object.values(item.value);
    if (visits + stack.length + entries.length > FIELD_VALUE_VISIT_LIMIT * 2)
      throw new Error('field value traversal budget exceeded');
    for (let index = entries.length - 1; index >= 0; index--)
      stack.push({ value: entries[index], depth: item.depth + 1 });
  }
}

export interface FieldTraversalWork {
  visit: () => void;
}
export function createFieldTraversalWork(): FieldTraversalWork {
  let remaining = 131_072;
  return {
    visit() {
      if (--remaining < 0) throw new Error('field traversal work budget exceeded');
    },
  };
}
