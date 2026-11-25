import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import {
  formatGeneratedCandidate,
  formatGeneratedSource,
} from '../src/compiler/publication/formatGeneratedSource.ts';

it('领域生成与全量格式化保持相同格式，长等级数组不拆行且数据不变', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'generated-format-'));
  try {
    const document = {
      levels: Array.from({ length: 12 }, (_, i) => i + 1),
      values: Array.from({ length: 12 }, (_, i) => `${100 + i}.123%`),
      description: '包含逗号、引号 " 和换行\n的文本',
      talent: { name: '天赋', description: '简短说明' },
    };
    const files = ['zh/operators.json', 'en/operators.json'];
    const generated = await Promise.all(
      files.map(async relative => {
        const output = path.join(root, relative);
        const text = await formatGeneratedSource(JSON.stringify(document), output);
        expect(text).toMatch(/"values": \[[^\n]*\]/);
        expect(JSON.parse(text)).toEqual(document);
        await fs.mkdir(path.dirname(output), { recursive: true });
        await fs.writeFile(output, JSON.stringify(document, null, 4));
        return text;
      }),
    );
    await expect(formatGeneratedCandidate(root, files, { check: true })).rejects.toThrow(
      'Generated formatting differs',
    );
    expect(await fs.readFile(path.join(root, files[0]!), 'utf8')).toBe(
      JSON.stringify(document, null, 4),
    );
    for (let round = 0; round < 2; round++) {
      await formatGeneratedCandidate(root, files);
      await formatGeneratedCandidate(root, files, { check: true });
      expect(
        await Promise.all(files.map(file => fs.readFile(path.join(root, file), 'utf8'))),
      ).toEqual(generated);
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
