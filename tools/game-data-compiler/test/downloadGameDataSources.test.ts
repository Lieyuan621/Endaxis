import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  downloadGameDataSources,
  loadSourceCatalog,
  parseArguments,
} from '../scripts/downloadGameDataSources.ts';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map(directory => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe('VFS 精确资源下载器', () => {
  it('只接受 Endaxis 自维护清单声明的安全路径', async () => {
    const root = await temporaryRoot('endaxis-vfs-catalog-');
    const catalog = path.join(root, 'sources.json');
    await writeJson(catalog, {
      tableCfg: ['CharacterTable'],
      jsonCollections: { SkillData: 'SkillData' },
      jsonFiles: ['GameplayConfig/GameplayTagPredefineTable.json'],
    });

    await expect(loadSourceCatalog(catalog)).resolves.toEqual({
      tableCfg: ['CharacterTable'],
      jsonCollections: { SkillData: 'SkillData' },
      jsonFiles: ['GameplayConfig/GameplayTagPredefineTable.json'],
    });
    expect(
      parseArguments(['--json-file', 'GameplayConfig/GameplayTagPredefineTable.json']),
    ).toMatchObject({
      jsonFile: 'GameplayConfig/GameplayTagPredefineTable.json',
    });

    for (const jsonFiles of [['../escape.json'], ['X/a.json', 'X/a.json']]) {
      await writeJson(catalog, { tableCfg: [], jsonCollections: {}, jsonFiles });
      await expect(loadSourceCatalog(catalog)).rejects.toThrow();
    }
  });

  it('从 VFS manifest 下载完整快照 并记录内容哈希', async () => {
    const root = await temporaryRoot('endaxis-vfs-download-');
    const catalog = path.join(root, 'sources.json');
    const output = path.join(root, 'output');
    const repeatedOutput = path.join(root, 'repeated-output');
    await writeJson(catalog, {
      tableCfg: ['CharacterTable'],
      jsonCollections: { SkillData: 'SkillData', CharacterData: 'CharacterData' },
      jsonFiles: ['GameplayConfig/GameplayTagPredefineTable.json'],
    });

    const payloads: Record<string, unknown> = {
      '/api/endaxis-data/TableCfg-current/CharacterTable.json': { table: true },
      '/api/endaxis-data/GameplayConfig/GameplayTagPredefineTable.json': { tags: true },
      '/api/endaxis-data/SkillData/manifest.json': [
        { contentFile: '/api/endaxis-data/SkillData/a.json' },
      ],
      '/api/endaxis-data/SkillData/a.json': { skill: true },
      '/api/endaxis-data/CharacterData/manifest.json': [
        { contentFile: '/api/endaxis-data/CharacterData/chr_0004_pelica.runtime-template.json' },
      ],
      '/api/endaxis-data/CharacterData/chr_0004_pelica.runtime-template.json': {
        format: 'character-template-prefix-v1',
        decodeStatus: 'partial',
        data: { id: 'chr_0004_pelica' },
      },
    };
    const { base, close } = await fixtureServer(payloads, true);
    try {
      await downloadGameDataSources({
        sourceMode: 'vfs-only',
        vfsBase: `${base}/api/endaxis-data`,
        sourceCatalog: catalog,
        output,
        workers: 2,
        tablesOnly: false,
      });
      await downloadGameDataSources({
        sourceMode: 'vfs-only',
        vfsBase: `${base}/api/endaxis-data`,
        sourceCatalog: catalog,
        output: repeatedOutput,
        workers: 1,
        tablesOnly: false,
      });
    } finally {
      await close();
    }

    await expect(readJson(path.join(output, 'SkillData', 'a.json'))).resolves.toEqual({
      skill: true,
    });

    const provenance = (await readJson(path.join(output, 'source-provenance.json'))) as {
      source: string;
      snapshotSha256: string;
      entries: Array<{ logicalPath: string; source: string; sha256: string }>;
    };

    expect(provenance.snapshotSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(provenance.entries.map(entry => entry.logicalPath)).toEqual([
      'CharacterData/chr_0004_pelica.runtime-template.json',
      'GameplayConfig/GameplayTagPredefineTable.json',
      'SkillData/a.json',
      'TableCfg-current/CharacterTable.json',
    ]);
    expect(provenance.entries.every(entry => /^[0-9a-f]{64}$/.test(entry.sha256))).toBe(true);
    expect(await readJson(path.join(repeatedOutput, 'source-provenance.json'))).toEqual(provenance);
  });

  it('拒绝缺少 VFS 来源身份头的同形 HTTP 数据', async () => {
    const root = await temporaryRoot('endaxis-vfs-identity-');
    const catalog = path.join(root, 'sources.json');
    await writeJson(catalog, { tableCfg: ['CharacterTable'], jsonCollections: {}, jsonFiles: [] });
    const { base, close } = await fixtureServer(
      { '/api/endaxis-data/TableCfg-current/CharacterTable.json': { table: true } },
      false,
    );
    try {
      await expect(
        downloadGameDataSources({
          sourceMode: 'vfs-only',
          vfsBase: `${base}/api/endaxis-data`,
          sourceCatalog: catalog,
          output: path.join(root, 'output'),
          workers: 1,
          tablesOnly: true,
        }),
      ).rejects.toThrow('response lacks the required vfs-index-browser source header');
    } finally {
      await close();
    }
  });
});

async function temporaryRoot(prefix: string): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  temporaryDirectories.push(root);
  return root;
}

async function fixtureServer(payloads: Record<string, unknown>, identify: boolean) {
  const server = http.createServer((request, response) => {
    const payload = payloads[request.url ?? ''];
    if (payload === undefined) return void response.writeHead(404).end();
    response.setHeader('Content-Type', 'application/json');
    if (identify) response.setHeader('X-Endaxis-Source', 'vfs-index-browser');
    response.end(JSON.stringify(payload));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('missing fixture port');
  return {
    base: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve())),
      ),
  };
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value));
}

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}
