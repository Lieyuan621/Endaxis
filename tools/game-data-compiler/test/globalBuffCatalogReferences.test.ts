import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  collectReferencedGlobalBuffIds,
  generateGlobalBuffCatalog,
} from '../scripts/generateGlobalBuffCatalog.ts';

describe('GlobalBuff catalog reference closure', () => {
  it('记录全库扫描的导出缺口，但明确要求的模板不可缺失', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'global-buff-export-'));
    const id = 'global_buff_unavailable';
    try {
      await fs.mkdir(path.join(root, 'buffs'));
      await fs.writeFile(
        path.join(root, 'buffs/reference.json'),
        JSON.stringify({ globalBuffId: id }),
      );
      await fs.writeFile(path.join(root, 'ids.json'), '[]');
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string | URL) => {
          if (String(url).includes('/by-name'))
            return new Response(
              JSON.stringify({
                candidates: [
                  {
                    path: `assets/beyond/dynamicassets/gameplay/globalbuff/${id}.asset`,
                    previewUrl: '/broken',
                  },
                ],
              }),
            );
          throw new TypeError('fetch failed');
        }),
      );
      const args = {
        vfsBase: 'http://localhost',
        revision: 'test',
        identities: path.join(root, 'ids.json'),
        output: path.join(root, 'catalog.json'),
        referenceDataRoot: path.join(root, 'buffs'),
        tolerateUnsupportedAdditionalIdentities: true,
        check: false,
      };
      const result = await generateGlobalBuffCatalog(args);
      expect(result.unsupportedAssets).toEqual([expect.objectContaining({ id })]);
      await expect(
        generateGlobalBuffCatalog({ ...args, additionalIdentities: [id] }),
      ).rejects.toThrow('fetch failed');
      await fs.writeFile(args.identities, JSON.stringify([id]));
      await expect(generateGlobalBuffCatalog(args)).rejects.toThrow('fetch failed');
    } finally {
      vi.unstubAllGlobals();
      await fs.rm(root, { recursive: true, force: true });
    }
  });
  it('ignores disabled native actions and their children while retaining enabled siblings', () => {
    expect(
      collectReferencedGlobalBuffIds([
        {
          $type: 'Beyond.Gameplay.Core.CheckConditionAction+Data, Gameplay.Beyond',
          isEnable: false,
          succeedActions: {
            actionData: [{ globalBuffId: { id: 'global_buff_removed_template' } }],
          },
        },
        {
          $type: 'Beyond.Gameplay.Core.CreateGlobalBuffAction+Data, Gameplay.Beyond',
          isEnable: true,
          globalBuffs: [{ globalBuffId: { id: 'global_buff_live' } }],
        },
      ]),
    ).toEqual(['global_buff_live']);
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
