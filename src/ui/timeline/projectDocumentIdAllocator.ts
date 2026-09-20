import type { EndaxisProjectDocument } from '../../core/project/schema';
import type {
  TimelineDocumentIdAllocator,
  TimelineDocumentIdKind,
} from './interaction/placeSkillGroup';

function collectPersistedIds(value: unknown, output: Set<string>): void {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach(item => collectPersistedIds(item, output));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'id' && typeof child === 'string') output.add(child);
    collectPersistedIds(child, output);
  }
}

function normalizedDocumentScope(activeScenarioId: string): string {
  const projectPrefix = activeScenarioId.replace(/:scenario:[^:]+$/, '');
  const normalized = projectPrefix.trim().replace(/[^A-Za-z0-9._-]+/g, '-');
  return normalized.length > 0 ? normalized : 'project';
}

/**
 * Allocate editor identities against the currently opened document. The cursor
 * is only an optimization: every candidate is checked against persisted IDs,
 * so replacing the project cannot make a page-local counter collide.
 */
export function createProjectDocumentIdAllocator(
  getProject: () => EndaxisProjectDocument,
): TimelineDocumentIdAllocator {
  const cursors = new Map<TimelineDocumentIdKind, number>();
  return {
    allocate(kind): string {
      const project = getProject();
      const used = new Set<string>();
      collectPersistedIds(project, used);
      const prefix = `${kind}:${normalizedDocumentScope(project.activeScenarioId)}:`;
      let cursor = cursors.get(kind) ?? 0;
      let candidate = '';
      do candidate = `${prefix}${++cursor}`;
      while (used.has(candidate));
      cursors.set(kind, cursor);
      return candidate;
    },
  };
}
