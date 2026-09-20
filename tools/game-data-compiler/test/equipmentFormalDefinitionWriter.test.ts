import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { checkEquipmentDefinitionFiles, writeEquipmentDefinitionFiles } from '../src/index.ts';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(path => rm(path, { recursive: true, force: true })),
  );
});

describe('装备正式定义原子写盘', () => {
  it('只读核对完整目录并只归一化换行编码', async () => {
    const root = await createTemporaryRoot();
    const output = join(root, 'generated');
    const files = [
      { relativePath: 'index.generated.ts', content: 'index\n' },
      { relativePath: 'set-a/gear.generated.ts', content: 'line 1\nline 2\n' },
    ];
    await writeEquipmentDefinitionFiles(output, files);
    await writeFile(join(output, 'set-a/gear.generated.ts'), 'line 1\r\nline 2\r\n', 'utf8');

    expect(() => checkEquipmentDefinitionFiles(output, files)).not.toThrow();
    await writeFile(join(output, 'set-a/gear.generated.ts'), 'changed\n', 'utf8');
    expect(() => checkEquipmentDefinitionFiles(output, files)).toThrow(
      'generated definition file is stale: set-a/gear.generated.ts',
    );
    await writeFile(join(output, 'set-a/gear.generated.ts'), files[1]!.content, 'utf8');
    await writeFile(join(output, 'stale.generated.ts'), 'stale\n', 'utf8');
    expect(() => checkEquipmentDefinitionFiles(output, files)).toThrow(
      'generated definition file set is stale',
    );
  });

  it('用完整批次替换旧目录并移除陈旧生成物', async () => {
    const root = await createTemporaryRoot();
    const output = join(root, 'generated');
    await writeEquipmentDefinitionFiles(output, [
      { relativePath: 'set-a/old.generated.ts', content: 'old\n' },
    ]);

    await writeEquipmentDefinitionFiles(output, [
      { relativePath: 'index.generated.ts', content: 'index\n' },
      { relativePath: 'set-b/new.generated.ts', content: 'new\n' },
    ]);

    await expect(readFile(join(output, 'index.generated.ts'), 'utf8')).resolves.toBe('index\n');
    await expect(readFile(join(output, 'set-b/new.generated.ts'), 'utf8')).resolves.toBe('new\n');
    await expect(readFile(join(output, 'set-a/old.generated.ts'), 'utf8')).rejects.toThrow();
  });

  it('拒绝越界路径和重复规范路径，并保留原目录', async () => {
    const root = await createTemporaryRoot();
    const output = join(root, 'generated');
    await writeEquipmentDefinitionFiles(output, [
      { relativePath: 'existing.generated.ts', content: 'existing\n' },
    ]);

    await expect(
      writeEquipmentDefinitionFiles(output, [
        { relativePath: '../escape.ts', content: 'escape\n' },
      ]),
    ).rejects.toThrow('unsafe rendered definition path');
    await expect(readFile(join(output, 'existing.generated.ts'), 'utf8')).resolves.toBe(
      'existing\n',
    );

    await expect(
      writeEquipmentDefinitionFiles(output, [
        { relativePath: 'same.ts', content: 'left\n' },
        { relativePath: './same.ts', content: 'right\n' },
      ]),
    ).rejects.toThrow('duplicate rendered definition path');
  });

  it('深层候选不会因完整 UUID 暂存名撞上 Windows 目录重命名边界', async () => {
    const root = await createTemporaryRoot();
    const relativePath =
      'suit_crush_fracture/item_equip_t4_suit_crush_fracture_hand_02.generated.ts';
    const legacySuffix = `.generated.staging-${process.pid}-${'0'.repeat(36)}`;
    const fixedLength = join(root, legacySuffix, relativePath).length;
    const output = join(root, 'x'.repeat(Math.max(1, 270 - fixedLength)), 'generated');
    const legacyDeepPath = join(dirname(output), legacySuffix, relativePath);
    expect(legacyDeepPath.length).toBeGreaterThanOrEqual(260);

    await writeEquipmentDefinitionFiles(output, [{ relativePath, content: 'gear\n' }]);
    await expect(readFile(join(output, relativePath), 'utf8')).resolves.toBe('gear\n');
  });
});

async function createTemporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'endaxis-equipment-writer-'));
  temporaryRoots.push(root);
  await writeFile(join(root, '.owner'), 'test\n', 'utf8');
  return root;
}
