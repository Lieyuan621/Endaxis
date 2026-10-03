/** Editor reference lookup. Raw IDs are serialized; source-qualified identities are only for
 * diagnostics/navigation. Never pick an arbitrary winner for a duplicate runtime identity. */
export interface ReferenceNavigationTarget {
  readonly assetId: string;
  readonly resourcePath: readonly (string | number)[];
  readonly page?: string;
}

export interface ReferenceCandidate {
  readonly identity: string;
  readonly value: string;
  readonly label: string;
  readonly family: string;
  readonly owner?: string;
  readonly scope: 'owner' | 'shared' | 'project';
  readonly source: {
    readonly id: string;
    readonly label: string;
    readonly kind: 'builtin' | 'project';
  };
  /** Permission to edit the target, independent of permission to select or view it. */
  readonly writable: boolean;
  readonly target?: ReferenceNavigationTarget;
}

export interface ReferenceCatalog {
  readonly family: string;
  readonly owner?: string;
  /** False when the runtime owner/call context is not known, not when the directory is empty. */
  readonly complete: boolean;
  readonly candidates: readonly ReferenceCandidate[];
}
export type ReferenceChoices = Readonly<Record<string, ReferenceCatalog>>;
export type ReferenceState =
  'unset' | 'valid' | 'invalid' | 'ambiguous' | 'invisible' | 'contextUnknown';
export interface ReferenceResolution {
  readonly state: ReferenceState;
  readonly catalogState: 'available' | 'empty' | 'contextUnknown';
  readonly candidates: readonly (ReferenceCandidate & { readonly selectable: boolean })[];
  readonly matches: readonly ReferenceCandidate[];
  readonly selected?: ReferenceCandidate;
}

export function resolveReference(
  family: string,
  value: string | undefined,
  catalog: ReferenceCatalog | undefined,
): ReferenceResolution {
  const compatible =
    catalog?.family === family
      ? catalog.candidates.filter(candidate => candidate.family === family)
      : [];
  const visible = compatible.filter(
    candidate =>
      candidate.scope !== 'owner' ||
      (catalog?.owner !== undefined && candidate.owner === catalog.owner),
  );
  const complete = catalog?.family === family && catalog.complete;
  const counts = new Map<string, number>();
  for (const candidate of visible)
    counts.set(candidate.value, (counts.get(candidate.value) ?? 0) + 1);
  const candidates = visible.map(candidate => ({
    ...candidate,
    selectable: complete && counts.get(candidate.value) === 1,
  }));
  const matches = value ? visible.filter(candidate => candidate.value === value) : [];
  const state: ReferenceState = !value
    ? 'unset'
    : matches.length > 1
      ? 'ambiguous'
      : !complete
        ? 'contextUnknown'
        : matches.length === 1
          ? 'valid'
          : compatible.some(candidate => candidate.value === value)
            ? 'invisible'
            : 'invalid';
  return {
    state,
    catalogState: !complete ? 'contextUnknown' : candidates.length ? 'available' : 'empty',
    candidates,
    matches,
    ...(state === 'valid' ? { selected: matches[0]! } : {}),
  };
}

export function canSelectReference(
  family: string,
  value: string,
  catalog: ReferenceCatalog | undefined,
): boolean {
  return resolveReference(family, value, catalog).state === 'valid';
}
