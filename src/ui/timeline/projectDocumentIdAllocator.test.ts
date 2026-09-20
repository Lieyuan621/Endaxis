import { describe, expect, it } from 'vitest';
import type { EndaxisProjectDocument } from '../../core/project/schema';
import { createProjectDocumentIdAllocator } from './projectDocumentIdAllocator';

function project(projectId: string, ids: readonly string[]): EndaxisProjectDocument {
  return {
    activeScenarioId: `${projectId}:scenario:1`,
    scenarios: ids.map(id => ({ id })),
  } as unknown as EndaxisProjectDocument;
}

describe('project document id allocator', () => {
  it('skips identities already persisted in the current document', () => {
    let current = project('my-project', ['skillCast:my-project:1', 'skillCast:my-project:3']);
    const allocator = createProjectDocumentIdAllocator(() => current);

    expect(allocator.allocate('skillCast')).toBe('skillCast:my-project:2');
    expect(allocator.allocate('skillCast')).toBe('skillCast:my-project:4');
    current = project('opened-project', ['skillCast:opened-project:5']);
    expect(allocator.allocate('skillCast')).toBe('skillCast:opened-project:6');
  });

  it('normalizes project ids before embedding them in document identities', () => {
    const current = project('  custom project / one  ', []);
    const allocator = createProjectDocumentIdAllocator(() => current);

    expect(allocator.allocate('track')).toBe('track:custom-project-one:1');
  });
});
