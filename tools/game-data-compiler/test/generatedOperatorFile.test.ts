import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { writeGeneratedDefinitionFile } from '../src/compiler/publication/writeGeneratedDefinitionFiles.ts';

it('直接替换干员文件时保留混合目录中的相邻文件，并拒绝越界路径', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'operator-file-'));
  try {
    await fs.writeFile(path.join(root, 'helper.ts'), 'handwritten');
    await fs.writeFile(path.join(root, 'sample.ts'), 'old definition');
    await writeGeneratedDefinitionFile(root, {
      relativePath: 'sample.ts',
      content: 'new definition',
    });
    expect(await fs.readFile(path.join(root, 'sample.ts'), 'utf8')).toBe('new definition');
    expect(await fs.readFile(path.join(root, 'helper.ts'), 'utf8')).toBe('handwritten');
    expect((await fs.readdir(root)).sort()).toEqual(['helper.ts', 'sample.ts']);
    await expect(
      writeGeneratedDefinitionFile(root, { relativePath: '../outside.ts', content: 'bad' }),
    ).rejects.toThrow();
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
