import type { DefinitionFieldSchema, DefinitionSchemaReferences } from './fieldSchema.ts';
import { EMPTY_SCHEMA_REFERENCES, resolveDefinitionSchema } from './resolveDefinitionSchema.ts';

/** 每个共享定义只检查一次；递归引用单独遍历，内联对象循环仍视为错误。 */
export function auditDefinitionSchema(root: DefinitionFieldSchema) {
  const references: DefinitionSchemaReferences = root.references ?? EMPTY_SCHEMA_REFERENCES;
  const pending = new Set<string>();
  const ancestors = new Set<DefinitionFieldSchema>();
  const visited = new Set<DefinitionFieldSchema>();
  let nodes = 0;
  let edges = 0;
  function visit(schema: DefinitionFieldSchema) {
    if (ancestors.has(schema)) throw new Error('cyclic inline schema object');
    if (visited.has(schema)) return;
    visited.add(schema);
    nodes++;
    if (schema.kind === 'ref') {
      resolveDefinitionSchema(schema, references);
      pending.add(schema.ref);
      edges++;
      return;
    }
    if (schema.kind === 'opaque' && !schema.fallback)
      throw new Error('unexplained schema fallback');
    ancestors.add(schema);
    if (schema.kind === 'object') Object.values(schema.fields).forEach(visit);
    if (schema.kind === 'array') visit(schema.element);
    if (schema.kind === 'record') visit(schema.value);
    if (schema.kind === 'tuple') schema.elements.forEach(visit);
    if (schema.kind === 'union') schema.variants.forEach(visit);
    ancestors.delete(schema);
  }
  visit(root);
  for (const id of pending) {
    const body = references[id];
    if (!body) throw new Error(`missing schema reference '${id}'`);
    visit(body);
  }
  return { nodes, referenceEdges: edges, referenceBodies: pending.size };
}
