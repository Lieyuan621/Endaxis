import type { CommonDefinitionSource } from '../../core/game-data/gameDataRepository';
import type {
  ReferenceCandidate,
  ReferenceCatalog,
  ReferenceChoices,
} from '../../application/editor/referenceResolver';
import { operatorReferenceChoices } from '../../application/editor/operatorReferenceChoices';
import type { WorkspaceAssetSource } from './workspaceSession';
import { describeWorkspaceResources } from './workspaceResources';

/** Draft documents have their own navigation identity before publication. Their eventual
 * project ID is not necessarily the still-unrewritten slug in the editing snapshot. */
export interface WorkspaceReferenceAsset extends WorkspaceAssetSource {
  readonly catalogId?: string;
  readonly published?: boolean;
}

/** Common resources retain their source even if a malformed directory repeats a raw ID. */
export function sharedBuffAssetId(sourceId: string, id: string): string {
  return `buff:${JSON.stringify([sourceId, id])}`;
}

/** A selected project asset is not a license to flatten all project owners into one namespace.
 * Other owners are retained only to distinguish known-invisible IDs from missing values. */
export function workspaceReferenceChoices(
  current: WorkspaceReferenceAsset,
  assets: readonly WorkspaceReferenceAsset[],
  sharedSources: readonly CommonDefinitionSource[] | undefined,
  resourceNames?: ReadonlyMap<string, string>,
): ReferenceChoices {
  const sharedTarget = (
    source: CommonDefinitionSource,
    family: 'buff' | 'abilityEntity',
    id: string,
  ) => {
    if (family !== 'buff') return undefined; // No standalone shared-entity view exists yet.
    const asset = assets.find(asset => asset.id === sharedBuffAssetId(source.id, id));
    return asset ? { assetId: asset.id, resourcePath: [] } : undefined;
  };
  const own =
    current.edit.kind === 'operator'
      ? operatorReferenceChoices(current.edit.definition, sharedSources ?? [], {
          assetId: current.id,
          assetName: current.name,
          writable: current.custom,
          sourceKind: current.custom ? 'project' : 'builtin',
          sharedTarget,
        })
      : undefined;
  const result: Record<string, ReferenceCatalog> = {};
  for (const family of ['skill', 'skillGroup', 'skillSlot', 'buff', 'abilityEntity']) {
    const candidates: ReferenceCandidate[] = [...(own?.[family]?.candidates ?? [])];
    if (!own) {
      // Standalone resources have no fixed runtime operator. Expose known source metadata,
      // but do not certify that these candidates exhaust the caller's lookup scope.
      for (const source of sharedSources ?? []) {
        const values =
          family === 'buff'
            ? source.buffDefinitions
            : family === 'abilityEntity'
              ? source.abilityEntityDefinitions
              : undefined;
        for (const value of Object.keys(values ?? {}))
          candidates.push({
            identity: JSON.stringify([source.id, family, value]),
            value,
            label: value,
            family,
            scope: 'shared',
            source: { id: source.id, label: source.id, kind: 'builtin' },
            writable: false,
            target: sharedTarget(source, family as 'buff' | 'abilityEntity', value),
          });
      }
      for (const resource of describeWorkspaceResources(
        current.edit,
        resource => resource.identity,
      )) {
        if (resource.definitionResource.kind !== family) continue;
        // A common Buff is already present in the shared directory.
        if (current.edit.kind === 'buff') continue;
        candidates.push({
          identity: JSON.stringify([current.id, resource.definitionResource.path]),
          value: resource.definitionResource.identity,
          label: resource.name,
          family,
          owner: current.id,
          scope: 'owner',
          source: {
            id: current.id,
            label: current.name,
            kind: current.custom ? 'project' : 'builtin',
          },
          writable: current.custom,
          target: { assetId: current.id, resourcePath: resource.definitionResource.path },
        });
      }
    }
    for (const asset of assets) {
      if (asset.id === current.id || asset.edit.kind !== 'operator') continue;
      const others = operatorReferenceChoices(asset.edit.definition, [], {
        assetId: asset.id,
        assetName: asset.name,
        writable: asset.custom,
        sourceKind: asset.custom ? 'project' : 'builtin',
      });
      candidates.push(...(others[family]?.candidates ?? []));
    }
    const namedCandidates = candidates.map(candidate => {
      const target = candidate.target;
      const label =
        target?.assetId === current.id
          ? resourceNames?.get(JSON.stringify(target.resourcePath))
          : candidate.scope === 'shared' && target
            ? assets.find(asset => asset.id === target.assetId)?.name
            : undefined;
      return label && candidate.family !== 'skillGroup' && candidate.family !== 'skillSlot'
        ? { ...candidate, label }
        : candidate;
    });
    result[family] = {
      family,
      owner: own?.[family]?.owner ?? current.id,
      complete:
        !!own && ((family !== 'buff' && family !== 'abilityEntity') || sharedSources !== undefined),
      candidates: namedCandidates,
    };
  }
  result.gearSet = {
    family: 'gearSet',
    complete: true,
    candidates: assets.flatMap(asset =>
      asset.edit.kind === 'gearSet' && asset.published !== false
        ? [
            {
              identity: JSON.stringify([asset.id, []]),
              value: asset.catalogId ?? asset.edit.definition.slug,
              label: asset.name,
              family: 'gearSet',
              scope: 'project' as const,
              source: {
                id: asset.id,
                label: asset.name,
                kind: asset.custom ? ('project' as const) : ('builtin' as const),
              },
              writable: asset.custom,
              target: { assetId: asset.id, resourcePath: [] },
            },
          ]
        : [],
    ),
  };
  return result;
}
