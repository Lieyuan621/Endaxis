import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkCandidateGameAssets } from '../../src/compiler/publication/candidateAssetCheck.ts';

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true });
});

async function setup(source: string, createAsset: boolean) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-candidate-assets-'));
  roots.push(root);
  const candidate = path.join(root, 'candidate/src/data/generated');
  await fs.mkdir(candidate, { recursive: true });
  await fs.writeFile(path.join(candidate, 'definition.ts'), source);
  if (createAsset) {
    await fs.mkdir(path.join(root, 'public/weapons/arts-unit'), { recursive: true });
    await fs.writeFile(path.join(root, 'public/weapons/arts-unit/new.webp'), 'fixture');
  }
  return root;
}

describe('候选游戏资源闭包', () => {
  it('通过已存在的候选字面图片引用', async () => {
    const root = await setup("export const icon = '/weapons/arts-unit/new.webp';", true);
    await expect(
      checkCandidateGameAssets({
        projectRoot: root,
        candidateRoot: path.join(root, 'candidate'),
        replacementPaths: ['src/data/generated'],
      }),
    ).resolves.toEqual({ referencedAssetCount: 1, referencingFileCount: 1 });
  });

  it('拒绝缺图而不过滤引用', async () => {
    const root = await setup("export const icon = '/icons/missing.webp';", false);
    await expect(
      checkCandidateGameAssets({
        projectRoot: root,
        candidateRoot: path.join(root, 'candidate'),
        replacementPaths: ['src/data/generated'],
      }),
    ).rejects.toThrow('/icons/missing.webp');
  });

  it('隔离 public 存在时不允许正式 public 偷偷补齐候选', async () => {
    const root = await setup("export const icon = '/icons/formal-only.webp';", false);
    await fs.mkdir(path.join(root, 'public/icons'), { recursive: true });
    await fs.writeFile(path.join(root, 'public/icons/formal-only.webp'), 'formal');
    await fs.mkdir(path.join(root, 'candidate/public'), { recursive: true });
    await expect(
      checkCandidateGameAssets({
        projectRoot: root,
        candidateRoot: path.join(root, 'candidate'),
        replacementPaths: ['src/data/generated'],
      }),
    ).rejects.toThrow('/icons/formal-only.webp');
  });
});
