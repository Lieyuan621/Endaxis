import type { SpawnResourceSlot } from './spawnDefinitionSchema.ts';
import type { GraphContainerBoundaries } from './graphSequenceContainerSchema';
import {
  resolveDefinitionSchema,
  EMPTY_SCHEMA_REFERENCES,
} from '../../core/editor/resolveDefinitionSchema.ts';
import type {
  DefinitionFieldSchema,
  DefinitionSchemaReferences,
} from '../definition-editor/fieldSchema.ts';

/** Admit a container only when every declared leaf has an actual editor. Pins/resources
 * remain the responsibility of graph hosts, including currently absent alternatives. */
export function supportsStructuredValue(
  schema: DefinitionFieldSchema,
  name?: string,
  references: DefinitionSchemaReferences = schema.references ?? EMPTY_SCHEMA_REFERENCES,
  graphOperands?: ReadonlySet<DefinitionFieldSchema>,
  graphBoundaries?: GraphContainerBoundaries,
  ownedResources?: ReadonlyMap<DefinitionFieldSchema, SpawnResourceSlot>,
): boolean {
  const seen = new Set<DefinitionFieldSchema>();
  function visit(schema: DefinitionFieldSchema, name?: string): boolean {
    schema = resolveDefinitionSchema(schema, references);
    if (ownedResources?.has(schema)) return true;
    if (graphBoundaries?.sequences.has(schema) || graphBoundaries?.conditions.has(schema))
      return true;
    if (schema.fallback) return false;
    if (graphOperands?.has(schema)) return true;
    if (
      schema.semantics?.aliases?.some(alias =>
        [
          'ActionValueOperand',
          'CombatCondition',
          'BuildCondition',
          'ActionGraphReference',
        ].includes(alias),
      )
    )
      return false;
    if (seen.has(schema)) return true;
    if (seen.size >= 16_384) throw new Error('schema traversal budget exceeded');
    seen.add(schema);
    switch (schema.kind) {
      case 'graph':
      case 'condition':
      case 'opaque':
        return false;
      case 'array':
        return visit(schema.element, name);
      case 'tuple':
        return schema.elements.every(child => visit(child));
      case 'record':
        return visit(schema.value, name);
      case 'union':
        return schema.variants.every(child => visit(child, name));
      case 'object':
        return Object.entries(schema.fields).every(([key, child]) => visit(child, key));
      default:
        return true;
    }
  }
  return visit(schema, name);
}

/** Asset compatibility tables and derived enemy tables have separate host ownership. */
export function isReadonlyDefinitionSlot(name: string, source?: readonly string[]): boolean {
  return (
    (name === 'skillAliases' &&
      !!source?.some(value => /^packages\/game-data-contract\/src\/operators\.ts:/.test(value))) ||
    (name === 'levelHp' &&
      !!source?.some(value => /^src\/core\/game-data\/enemyDefinition\.ts:/.test(value)))
  );
}

/** 已有资产的身份字段只读；创建身份使用资源创建流程。 */
export function isProtectedDefinitionIdentity(name: string, rootField: boolean): boolean {
  return name === 'key' || (rootField && ['slug', 'gameId', 'skillId'].includes(name));
}
