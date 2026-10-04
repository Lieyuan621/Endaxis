import { sameFieldDeclaration } from '../../core/editor/fieldSemantics.ts';
import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated.ts';
import {
  resolveDefinitionSchema,
  EMPTY_SCHEMA_REFERENCES,
} from '../../core/editor/resolveDefinitionSchema.ts';
import type {
  DefinitionFieldSchema,
  DefinitionSchemaReferences,
} from '../definition-editor/fieldSchema.ts';

/** Only these graph-owned rows have an implemented metadata editor and graph navigation.
 * The referenced programs and boolean expressions remain owned by graph commands. */
export interface GraphContainerBoundaries {
  readonly sequences: ReadonlySet<DefinitionFieldSchema>;
  readonly conditions: ReadonlySet<DefinitionFieldSchema>;
}
export function graphSequenceBoundaries(
  schema: DefinitionFieldSchema | undefined,
  kind: string | undefined,
  path: readonly (string | number)[] | undefined,
  references: DefinitionSchemaReferences = schema?.references ?? EMPTY_SCHEMA_REFERENCES,
): GraphContainerBoundaries | undefined {
  if (!schema || !path || !kind) return;
  if (!(
    (kind === 'switch' && path.length === 1 && path[0] === 'options') ||
    (kind === 'listenForCombatEvents' &&
      path.length === 2 &&
      path[0] === 'parameters' &&
      path[1] === 'responses')
  ))
    return;
  const formal = actionNodeSchemas[kind].fields.find(
    field => field.path.join('.') === path.join('.'),
  );
  if (!sameFieldDeclaration(formal?.valueSchema, schema)) return;
  const array = resolveDefinitionSchema(schema, references);
  if (array.kind !== 'array') return;
  const row = resolveDefinitionSchema(array.element, references);
  if (row.kind !== 'object' || !row.fields.sequence) return;
  const sequence = resolveDefinitionSchema(row.fields.sequence, references);
  if (!sequence.semantics?.aliases?.includes('ActionGraphReference')) return;
  const condition =
    row.fields.condition && resolveDefinitionSchema(row.fields.condition, references);
  if (
    kind === 'listenForCombatEvents' &&
    !condition?.semantics?.aliases?.includes('CombatCondition')
  )
    return;
  return { sequences: new Set([sequence]), conditions: new Set(condition ? [condition] : []) };
}

/** Empty new ports carry no hidden fields and never imply a target-node mutation. */
export function isEmptyGraphSequence(value: unknown): boolean {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    Object.hasOwn(value, '$sequence') &&
    (value as { $sequence: unknown }).$sequence === null
  );
}
