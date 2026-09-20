import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const retiredRoots = [
  'src/data/operators/generated',
  'src/data/operators/generated-active-skills',
  'src/data/operators/generated-runtime',
] as const;

describe('旧干员生成产物退役门禁', () => {
  it.each(retiredRoots)('%s 不再保存正式或中间文件', relativeRoot => {
    expect(collectFiles(path.resolve(relativeRoot))).toEqual([]);
  });

  it('正式 manifest 不再携带旧 Python 输出所有权', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.resolve('tools/game-data-compiler/config/operators.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(manifest).not.toHaveProperty('legacyOutputOperatorSlugs');
  });

  it('TS 编译器测试不再通过运行时 Python oracle 验证自己', () => {
    expect(fs.existsSync(path.resolve('tools/game-data-compiler/test/pythonOracle.ts'))).toBe(
      false,
    );
  });

  it('根 scripts 目录不再保存第二套游戏数据工具', () => {
    expect(collectFiles(path.resolve('scripts'))).toEqual([]);
  });

  it('manifest 不再允许手写连携注册', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.resolve('tools/game-data-compiler/config/operators.json'), 'utf8'),
    ) as { operators: { slug: string; comboSkillRegistrations?: unknown }[] };
    expect(
      manifest.operators
        .filter(operator => operator.comboSkillRegistrations !== undefined)
        .map(operator => operator.slug),
    ).toEqual([]);
  });
});

function collectFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.join(entry.parentPath, entry.name))
    .sort();
}
