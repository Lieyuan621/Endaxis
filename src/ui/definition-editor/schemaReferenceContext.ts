import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue';
import type { DefinitionFieldSchema, DefinitionSchemaReferences } from './fieldSchema';
import { EMPTY_SCHEMA_REFERENCES } from '../../core/editor/resolveDefinitionSchema';

const schemaReferencesKey: InjectionKey<ComputedRef<DefinitionSchemaReferences>> =
  Symbol('schemaReferences');
/** Each form inherits only its own generated root's references. */
export function useSchemaReferences(schema: () => DefinitionFieldSchema | undefined) {
  const inherited = inject(schemaReferencesKey, undefined);
  const references = computed(
    () => schema()?.references ?? inherited?.value ?? EMPTY_SCHEMA_REFERENCES,
  );
  provide(schemaReferencesKey, references);
  return references;
}
