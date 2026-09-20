import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { publishGameDataCandidate } from '../../src/compiler/publication/gameDataCandidatePublisher.ts';

const renameFailure = vi.hoisted(() => ({ call: 0, failAt: undefined as number | undefined }));
vi.mock('../../src/io.ts', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/io.ts')>();
  return {
    ...actual,
    renameWithRetry: async (source: string, destination: string) => {
      renameFailure.call += 1;
      if (renameFailure.call === renameFailure.failAt) throw new Error('injected install failure');
      await actual.renameWithRetry(source, destination);
    },
  };
});

const roots: string[] = [];
afterEach(async () => {
  renameFailure.call = 0;
  renameFailure.failAt = undefined;
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true });
});

async function setup() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-publish-'));
  roots.push(root);
  const candidateRoot = path.join(root, 'tmp', 'candidate');
  await fs.mkdir(path.join(candidateRoot, 'generated'), { recursive: true });
  await fs.writeFile(path.join(candidateRoot, 'generated', 'new.ts'), 'new');
  await fs.mkdir(path.join(candidateRoot, 'locales'), { recursive: true });
  await fs.writeFile(path.join(candidateRoot, 'locales', 'zh.json'), '{"new":true}');
  await fs.mkdir(path.join(root, 'generated'), { recursive: true });
  await fs.writeFile(path.join(root, 'generated', 'stale.ts'), 'stale');
  await fs.mkdir(path.join(root, 'locales'), { recursive: true });
  await fs.writeFile(path.join(root, 'locales', 'zh.json'), '{"old":true}');
  return { root, candidateRoot };
}

describe('game-data candidate publisher', () => {
  it('replaces complete directories and exact files, removing stale generated members', async () => {
    const { root, candidateRoot } = await setup();
    const result = await publishGameDataCandidate({
      projectRoot: root,
      candidateRoot,
      directoryOutputs: ['generated'],
      fileOutputs: ['locales/zh.json'],
    });
    expect(result).toMatchObject({ directoryCount: 1, fileCount: 1 });
    await expect(fs.readFile(path.join(root, 'generated', 'new.ts'), 'utf8')).resolves.toBe('new');
    await expect(fs.stat(path.join(root, 'generated', 'stale.ts'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(fs.readFile(path.join(root, 'locales', 'zh.json'), 'utf8')).resolves.toBe(
      '{"new":true}',
    );
  });

  it('rejects links and overlapping targets before changing formal outputs', async () => {
    const { root, candidateRoot } = await setup();
    await expect(
      publishGameDataCandidate({
        projectRoot: root,
        candidateRoot,
        directoryOutputs: ['generated'],
        fileOutputs: ['generated/new.ts'],
      }),
    ).rejects.toThrow('overlap');
    expect(await fs.readFile(path.join(root, 'generated', 'stale.ts'), 'utf8')).toBe('stale');

    // Windows 文件 symlink 需要额外系统权限；junction 同样由 lstat 识别为链接，
    // 在文件/目录种类判断前触发相同的拒绝分支，保留真实文件系统验证。
    await fs.symlink(
      process.platform === 'win32'
        ? path.join(candidateRoot, 'generated')
        : path.join(candidateRoot, 'locales', 'zh.json'),
      path.join(candidateRoot, 'locales', 'link'),
      process.platform === 'win32' ? 'junction' : 'file',
    );
    await expect(
      publishGameDataCandidate({
        projectRoot: root,
        candidateRoot,
        directoryOutputs: [],
        fileOutputs: ['locales/link'],
      }),
    ).rejects.toThrow('link is not allowed');
    expect(await fs.readFile(path.join(root, 'locales', 'zh.json'), 'utf8')).toBe('{"old":true}');
  });

  it('validates every target before changing any formal output', async () => {
    const { root, candidateRoot } = await setup();
    await fs.mkdir(path.join(candidateRoot, 'linked-locales'), { recursive: true });
    await fs.writeFile(path.join(candidateRoot, 'linked-locales', 'zh.json'), 'candidate');
    const external = path.join(root, 'external');
    await fs.mkdir(external);
    await fs.symlink(external, path.join(root, 'linked-locales'), 'junction');

    await expect(
      publishGameDataCandidate({
        projectRoot: root,
        candidateRoot,
        directoryOutputs: ['generated'],
        fileOutputs: ['linked-locales/zh.json'],
      }),
    ).rejects.toThrow('target parent is a link');
    await expect(fs.readFile(path.join(root, 'generated', 'stale.ts'), 'utf8')).resolves.toBe(
      'stale',
    );
    await expect(fs.stat(path.join(root, 'generated', 'new.ts'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(fs.stat(path.join(external, 'zh.json'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('restores the exact previous trees after a mid-install failure', async () => {
    const { root, candidateRoot } = await setup();
    await fs.mkdir(path.join(root, 'generated', 'nested'), { recursive: true });
    await fs.writeFile(path.join(root, 'generated', 'nested', 'old.txt'), 'old nested');
    renameFailure.failAt = 2;

    await expect(
      publishGameDataCandidate({
        projectRoot: root,
        candidateRoot,
        directoryOutputs: ['generated'],
        fileOutputs: ['locales/zh.json'],
      }),
    ).rejects.toThrow('injected install failure');

    await expect(fs.readFile(path.join(root, 'generated', 'stale.ts'), 'utf8')).resolves.toBe(
      'stale',
    );
    await expect(
      fs.readFile(path.join(root, 'generated', 'nested', 'old.txt'), 'utf8'),
    ).resolves.toBe('old nested');
    await expect(fs.stat(path.join(root, 'generated', 'new.ts'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(fs.readFile(path.join(root, 'locales', 'zh.json'), 'utf8')).resolves.toBe(
      '{"old":true}',
    );
  });

  it('restores an old output whose filesystem kind differs from the candidate', async () => {
    const { root, candidateRoot } = await setup();
    await fs.rm(path.join(root, 'generated'), { recursive: true });
    await fs.writeFile(path.join(root, 'generated'), 'old file at directory output');
    renameFailure.failAt = 2;

    await expect(
      publishGameDataCandidate({
        projectRoot: root,
        candidateRoot,
        directoryOutputs: ['generated'],
        fileOutputs: ['locales/zh.json'],
      }),
    ).rejects.toThrow('injected install failure');

    await expect(fs.readFile(path.join(root, 'generated'), 'utf8')).resolves.toBe(
      'old file at directory output',
    );
  });
});
