import type { NodeFieldSchema } from '../action-graph/nodeSchema';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';

/** A list is a container, never itself a pin. Definition condition trees remain separate. */
export function isConditionListField(schema: NodeFieldSchema | DefinitionFieldSchema): boolean {
  return (
    'control' in schema &&
    schema.control === 'json' &&
    !schema.valueSchema.semantics?.tuple &&
    schema.valueSchema.semantics?.arrayElement?.aliases?.includes('CombatCondition') === true
  );
}
