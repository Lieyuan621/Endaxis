import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated.ts';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema.ts';

export const SPAWN_RESOURCE_SLOTS = ['childSkill', 'childSkills', 'passiveSkills'] as const;
export type SpawnResourceSlot = (typeof SPAWN_RESOURCE_SLOTS)[number];

/** Only this formal mixed container can expose ordinary values around owned resources. */
export function spawnDefinitionResources(
  schema: DefinitionFieldSchema | undefined,
  kind: string | undefined,
  path: readonly (string | number)[] | undefined,
): ReadonlyMap<DefinitionFieldSchema, SpawnResourceSlot> | undefined {
  if (
    kind !== 'spawnAbilityEntity' ||
    path?.length !== 2 ||
    path[0] !== 'parameters' ||
    path[1] !== 'definition' ||
    schema?.kind !== 'object'
  )
    return;
  const formal = actionNodeSchemas.spawnAbilityEntity.fields.find(
    field => field.path.at(-1) === 'definition',
  )?.valueSchema;
  if (formal?.kind !== 'object' || !formal.source?.some(source => schema.source?.includes(source)))
    return;
  const result = new Map<DefinitionFieldSchema, SpawnResourceSlot>();
  for (const key of SPAWN_RESOURCE_SLOTS) {
    const field = schema.fields[key];
    const original = formal.fields[key];
    if (!field || !original?.source?.some(source => field.source?.includes(source))) return;
    const leaf =
      field.kind === 'array' ? field.element : field.kind === 'record' ? field.value : field;
    if (leaf.kind !== 'opaque' || leaf.fallback?.reason !== 'owned-resource-boundary') return;
    result.set(field, key);
  }
  return result;
}

/** Entire owned slots, including collection order/keys, remain the same objects. */
export function assertSpawnResourceIdentity(previous: unknown, next: unknown): void {
  const before =
    previous && typeof previous === 'object' ? (previous as Record<string, unknown>) : {};
  const after = next && typeof next === 'object' ? (next as Record<string, unknown>) : {};
  for (const key of SPAWN_RESOURCE_SLOTS)
    if (!Object.is(before[key], after[key]))
      throw new Error('spawnDefinitionField.resourceReadonly');
}
