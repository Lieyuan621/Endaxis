import { describe, expect, it } from 'vitest';
import { parseGlobalBuffTemplateCatalogSource } from '../src/source/globalBuffTemplate.ts';
import { collectReferencedGlobalBuffIds } from '../scripts/generateGlobalBuffCatalog.ts';

describe('GlobalBuff catalog reference closure', () => {
  it('临时编译目录满足公共来源协议，不要求生产目录保留模板副本', () => {
    const catalog = { version: 'fixture', evidence: {}, templates: {} };
    const parsed = parseGlobalBuffTemplateCatalogSource(catalog);
    expect(parsed.byId.size).toBe(Object.keys(catalog.templates).length);
  });
  it('collects literal create and finish identities without treating unrelated strings as IDs', () => {
    expect(
      collectReferencedGlobalBuffIds({
        actions: [
          { globalBuffId: { id: 'global_buff_created' } },
          {
            globalBuffIds: [{ id: 'global_buff_finished' }, { id: 'global_buff_created' }],
          },
          { description: 'global_buff_not_a_reference' },
          { globalBuffId: { id: 'buff_not_global' } },
        ],
      }),
    ).toEqual(['global_buff_created', 'global_buff_finished']);
  });

  it('accepts the legacy direct-string field shape but rejects empty and arbitrary identities', () => {
    expect(
      collectReferencedGlobalBuffIds({
        globalBuffId: 'global_buff_direct',
        nested: { globalBuffIds: ['', 'ordinary_buff', { id: '' }] },
      }),
    ).toEqual(['global_buff_direct']);
  });
});
