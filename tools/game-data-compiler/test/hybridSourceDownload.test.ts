import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadGameDataSources, parseArguments } from '../scripts/downloadGameDataSources.ts';
import {
  exportReference,
  parseArguments as iconArguments,
} from '../scripts/exportReferencedGameIcons.ts';

const roots: string[] = [];
afterEach(async () => {
  vi.unstubAllGlobals();
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true });
});

async function setup() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-hybrid-'));
  roots.push(root);
  const catalog = path.join(root, 'sources.json');
  await fs.writeFile(
    catalog,
    JSON.stringify({
      tableCfg: ['CharacterTable'],
      jsonCollections: { SkillData: 'SkillData', AbilityEntityData: 'AbilityEntityData' },
      jsonFiles: [],
    }),
  );
  const skill = JSON.stringify({ castType: 'Active' });
  const record = (content: string | Uint8Array) => ({
    size: Buffer.byteLength(content),
    md5: createHash('md5').update(content).digest('hex'),
    version: '1.5.3@3',
  });
  const manifest = {
    latest: '1.5.3@4',
    versions: [{ id: '1.5.3@4', tableCfgPath: 'public/1.5.3/4/TableCfg' }],
  };
  const index = {
    schemaVersion: 2,
    revision: 'revision-1',
    datasets: {
      json: { files: { 'SkillData/a.json': record(skill) } },
      images: { files: {} as Record<string, ReturnType<typeof record>> },
    },
  };
  const bodies: Record<string, string | Uint8Array | number> = {
    '/manifest.json': JSON.stringify(manifest),
    '/asset-sync-index.json': JSON.stringify(index),
    '/public/1.5.3/4/TableCfg/CharacterTable.json': '{}',
    '/public/Json/SkillData/a.json': skill,
    '/api/endaxis-data/SkillData/manifest.json': JSON.stringify([
      { contentFile: 'a.json' },
      { contentFile: 'b.json' },
    ]),
    '/api/endaxis-data/SkillData/a.json': JSON.stringify({ castType: 0 }),
    '/api/endaxis-data/SkillData/b.json': JSON.stringify({ castType: 'Passive' }),
    '/api/endaxis-data/AbilityEntityData/manifest.json': JSON.stringify([
      { contentFile: 'entity.json' },
    ]),
    '/api/endaxis-data/AbilityEntityData/entity.json': '{}',
  };
  const requests: URL[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const url = new URL(input);
      requests.push(url);
      const body = bodies[url.pathname] ?? 404;
      const headers: Record<string, string> =
        url.hostname === 'vfs.test' ? { 'X-Endaxis-Source': 'vfs-index-browser' } : {};
      return new Response(
        typeof body === 'number' ? null : typeof body === 'string' ? body : new Uint8Array(body),
        { status: typeof body === 'number' ? body : 200, headers },
      );
    }),
  );
  const args = {
    cdn: 'https://cdn.test',
    vfsBase: 'http://vfs.test/api/endaxis-data',
    vfsVersion: '1.5.3@3',
    sourceCatalog: catalog,
    output: path.join(root, 'snapshot'),
    workers: 2,
    tablesOnly: false,
  };
  return { root, args, bodies, requests, record, index };
}

describe('AKEDB 优先、VFS 补缺', () => {
  it('默认融合；显式 VFS-only 仅供对照，未知选项拒绝', () => {
    expect(parseArguments([])).toMatchObject({ sourceMode: 'hybrid', version: 'latest' });
    expect(parseArguments(['--source-mode', 'vfs-only'])).toMatchObject({ sourceMode: 'vfs-only' });
    expect(() => parseArguments(['--source-mode', 'oops'])).toThrow();
    expect(() => parseArguments(['--unknown', 'x'])).toThrow();
  });

  it('清单并集、同名 CDN 优先，逐文件记录版本、补缺原因与哈希', async () => {
    const { args, requests } = await setup();
    await downloadGameDataSources(args);
    const ledger = JSON.parse(
      await fs.readFile(path.join(args.output, 'source-provenance.json'), 'utf8'),
    );
    expect(ledger.akedb.version).toBe('1.5.3@4');
    expect(ledger.vfs).toMatchObject({ declaredVersion: '1.5.3@3', versionVerified: false });
    expect(ledger.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          logicalPath: 'SkillData/a.json',
          provider: 'akedb',
          version: '1.5.3@3',
        }),
        expect.objectContaining({
          logicalPath: 'SkillData/b.json',
          provider: 'vfs-index-browser',
          fallbackReason: 'not-in-akedb-index',
        }),
        expect.objectContaining({
          logicalPath: 'AbilityEntityData/entity.json',
          provider: 'vfs-index-browser',
        }),
      ]),
    );
    expect(ledger.snapshotSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(requests.some(u => u.pathname === '/api/endaxis-data/SkillData/a.json')).toBe(false);
    expect(
      requests
        .filter(u => ['/manifest.json', '/asset-sync-index.json'].includes(u.pathname))
        .every(u => u.searchParams.has('t')),
    ).toBe(true);
  });

  it('已收录资源返回 404 时补取 VFS，但不改写内容', async () => {
    const { args, bodies } = await setup();
    bodies['/public/Json/SkillData/a.json'] = 404;
    await downloadGameDataSources(args);
    const ledger = JSON.parse(
      await fs.readFile(path.join(args.output, 'source-provenance.json'), 'utf8'),
    );
    expect(
      ledger.entries.find((e: { logicalPath: string }) => e.logicalPath === 'SkillData/a.json'),
    ).toMatchObject({ provider: 'vfs-index-browser', fallbackReason: 'akedb-http-404' });
  });

  it.each(['server', 'integrity', 'json'] as const)(
    'CDN %s 错误不换源，不发布半成品',
    async kind => {
      const { args, bodies, requests, index, record } = await setup();
      if (kind === 'server') bodies['/public/Json/SkillData/a.json'] = 503;
      else bodies['/public/Json/SkillData/a.json'] = 'bad-json';
      if (kind === 'json') {
        index.datasets.json.files['SkillData/a.json'] = record('bad-json');
        bodies['/asset-sync-index.json'] = JSON.stringify(index);
      }
      await expect(downloadGameDataSources(args)).rejects.toThrow();
      await expect(fs.stat(args.output)).rejects.toMatchObject({ code: 'ENOENT' });
      expect(requests.some(u => u.pathname === '/api/endaxis-data/SkillData/a.json')).toBe(false);
    },
  );

  it('VFS 清单损坏不能当成空集合', async () => {
    const { args, bodies } = await setup();
    bodies['/api/endaxis-data/SkillData/manifest.json'] = '{}';
    await expect(downloadGameDataSources(args)).rejects.toThrow('expected array');
  });

  it('拒绝覆盖已有快照', async () => {
    const { args } = await setup();
    await fs.mkdir(args.output);
    await fs.writeFile(path.join(args.output, 'keep.txt'), 'keep');
    await expect(downloadGameDataSources(args)).rejects.toThrow('already exists');
    expect(await fs.readFile(path.join(args.output, 'keep.txt'), 'utf8')).toBe('keep');
  });

  it('图片按原始路径和大小写取 CDN，同名不查询 VFS', async () => {
    const { args, bodies, requests, index, record, root } = await setup();
    const png = await sharp({ create: { width: 1, height: 1, channels: 4, background: '#00ff00' } })
      .png()
      .toBuffer();
    index.datasets.images.files['assets/icon_CriticalRate.png'] = record(png);
    bodies['/asset-sync-index.json'] = JSON.stringify(index);
    bodies['/public/images/assets/icon_CriticalRate.png'] = new Uint8Array(png);
    const result = await exportReference(
      {
        publicPath: '/icons/test.webp',
        sourceNames: ['icon_criticalrate.png'],
        preferredPathSegments: [],
        referencedBy: ['test'],
      },
      iconArguments(['--cdn', args.cdn, '--output-root', path.join(root, 'icons')]),
    );
    expect(result).toMatchObject({
      provider: 'akedb',
      version: '1.5.3@3',
      sourcePath: 'assets/icon_CriticalRate.png',
    });
    expect(requests.some(u => u.pathname.includes('by-name'))).toBe(false);
  });
});
