import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkGeneratedFiles } from '../scripts/generateWeaponDefinitions.ts';

const relativePath = 'arts-unit/wpn_test.generated.ts';
const content = 'const definition = { rarity: 4 };\nexport default definition;\n';
let directory: string;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'endaxis-weapon-check-'));
  fs.mkdirSync(path.join(directory, 'arts-unit'));
});

afterEach(() => {
  // 只清理由本测试创建的独占临时目录。
  if (
    path.dirname(directory) !== path.resolve(os.tmpdir()) ||
    !path.basename(directory).startsWith('endaxis-weapon-check-')
  )
    throw new Error('unexpected test directory');
  fs.rmSync(directory, { recursive: true, force: true });
});

describe('武器生成产物的只读检查', () => {
  it.each([
    ['LF', '\n', '\n'],
    ['Windows 检出', '\r\n', '\n'],
    ['预期 CRLF', '\n', '\r\n'],
    ['两侧 CRLF', '\r\n', '\r\n'],
  ])('%s 不因换行编码误报过期，也不改写文件', (_name, actualEol, expectedEol) => {
    const file = path.join(directory, relativePath);
    const actual = content.replaceAll('\n', actualEol!);
    fs.writeFileSync(file, actual);
    expect(() =>
      checkGeneratedFiles(directory, [
        {
          relativePath,
          content: content.replaceAll('\n', expectedEol!),
        },
      ]),
    ).not.toThrow();
    expect(fs.readFileSync(file, 'utf8')).toBe(actual);
  });

  it.each([
    content.replace('rarity: 4', 'rarity: 5'),
    content.replace('const ', 'const  '),
    content.trimEnd(),
  ])('数值、空白或末尾换行变化仍必须报错：%s', actual => {
    fs.writeFileSync(path.join(directory, relativePath), actual.replaceAll('\n', '\r\n'));
    expect(() => checkGeneratedFiles(directory, [{ relativePath, content }])).toThrow(
      `generated weapon file is stale: ${relativePath}`,
    );
  });

  it('文件缺失或多出文件仍必须报错', () => {
    expect(() => checkGeneratedFiles(directory, [{ relativePath, content }])).toThrow(
      'generated weapon file set is stale',
    );
    fs.writeFileSync(path.join(directory, relativePath), content);
    fs.writeFileSync(path.join(directory, 'unexpected.ts'), content);
    expect(() => checkGeneratedFiles(directory, [{ relativePath, content }])).toThrow(
      'generated weapon file set is stale',
    );
  });
});
