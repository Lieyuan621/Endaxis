import type { ReferenceCandidate, ReferenceCatalog } from '@/application/editor/referenceResolver';
export function referenceCandidate(
  value: string,
  family = 'buff',
  overrides: Partial<ReferenceCandidate> = {},
): ReferenceCandidate {
  return {
    identity: `project:${value}`,
    value,
    label: value === 'known' ? 'Known buff' : value,
    family,
    scope: 'shared',
    source: { id: 'project', label: 'Project', kind: 'project' },
    writable: true,
    ...overrides,
  };
}
export function referenceCatalog(
  family = 'buff',
  values: readonly string[] = ['known'],
): ReferenceCatalog {
  return {
    family,
    complete: true,
    candidates: values.map(value => referenceCandidate(value, family)),
  };
}
