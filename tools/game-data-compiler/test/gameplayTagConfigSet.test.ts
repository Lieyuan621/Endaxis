import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { readGameplayTagConfigSetExport } from '../scripts/readGameplayTagConfigSetExport.ts';
import { parseOperatorSourceFileArguments } from '../scripts/operatorSourceFiles.ts';
import {
  parseGameplayTagConfigDumpSource,
  parseGameplayTagConfigSetDumpSource,
} from '../src/source/gameplayTagConfigDump.ts';
import { compileGameplayTagConfigSetSource } from '../src/compiler/catalogs/gameplayTagCatalog.ts';

const bytes = (value: string) => new TextEncoder().encode(value);
const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'endaxis-tag-set-'));
  dirs.push(root);
  function file(name: string, text: string) {
    fs.writeFileSync(path.join(root, name), text);
    return { file: name, sha256: createHash('sha256').update(text).digest('hex') };
  }
  const manifest = {
    schemaVersion: 1,
    revision: 'fixture',
    configSet: {
      container: 'set.asset',
      sourceFile: 'CAB-set',
      pathId: '10',
      complete: true,
      dump: file(
        'set.txt',
        'vector configs Array Array int size = 2\nPPtr<$GameplayTagConfig> data int m_FileID = 2 SInt64 m_PathID = 9007199254740993\nPPtr<$GameplayTagConfig> data int m_FileID = 1 SInt64 m_PathID = 9007199254740993',
      ),
    },
    configs: [
      {
        container: 'a.asset',
        sourceFile: 'CAB-a',
        pathId: '9007199254740993',
        complete: true,
        dump: file(
          'a.txt',
          'vector _keyData Array Array int size = 3 string data = "A" string data = "B" string data = ""',
        ),
      },
      {
        container: 'b.asset',
        sourceFile: 'CAB-b',
        pathId: '9007199254740993',
        complete: true,
        dump: file('b.txt', 'vector _keyData Array Array int size = 1 string data = "B"'),
      },
    ],
    cabMap: file(
      'cab.json',
      JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            cab: 'CAB-set',
            inputId: 'set.asset',
            serializedFileOffset: 0,
            dependencies: ['CAB-a', 'CAB-b'],
          },
          { cab: 'CAB-a', inputId: 'a.asset', serializedFileOffset: 0, dependencies: [] },
          { cab: 'CAB-b', inputId: 'b.asset', serializedFileOffset: 0, dependencies: [] },
        ],
      }),
    ),
  };
  const manifestPath = path.join(root, 'source-set.json');
  const write = () => fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  write();
  return { root, manifest, manifestPath, write };
}

describe('GameplayTagConfigSet 引用闭包', () => {
  it('保留新版单配置内部重复路径，由配置集投影计数去重而非误报来源损坏', () => {
    const source = parseGameplayTagConfigDumpSource(
      bytes(
        'vector _keyData Array Array int size = 3 string data = "NPC/AvatarMesh/Actor/liino" string data = "NPC/AvatarMesh/Actor/liino" string data = ""',
      ),
      'current-client',
    );
    expect(source.paths).toHaveLength(3);
    const result = compileGameplayTagConfigSetSource(
      [{ fileId: 0, pathId: '1' }],
      'CAB',
      [],
      [{ sourceFile: 'CAB', pathId: '1', source }],
    );
    expect(result.catalog.paths).toEqual(['NPC/AvatarMesh/Actor/liino']);
    expect(result).toMatchObject({ duplicatePathCount: 1, emptyPathCount: 1 });
  });
  it('Operator 来源审计可以消费完整路径目录，不能同时混入单配置 dump', () => {
    const base = [
      '--manifest',
      'manifest',
      '--skill-data',
      'skills',
      '--buff-data',
      'buffs',
      '--tables',
      'tables',
      '--projectile-data',
      'projectiles',
      '--ability-entity-data',
      'entities',
    ];
    expect(
      parseOperatorSourceFileArguments([...base, '--gameplay-tag-catalog', 'tags.ts'], true),
    ).toMatchObject({ gameplayTagCatalog: path.resolve('tags.ts') });
    expect(
      parseOperatorSourceFileArguments([...base, '--gameplay-tag-dump', 'tags.txt'], true),
    ).toMatchObject({ gameplayTagDump: path.resolve('tags.txt') });
    expect(() =>
      parseOperatorSourceFileArguments(
        [...base, '--gameplay-tag-catalog', 'tags.ts', '--gameplay-tag-dump', 'tags.txt'],
        true,
      ),
    ).toThrow('not both');
  });
  it('正式入口支持独立来源目录、确定性检查和写入前失败', () => {
    const f = fixture();
    const script = fileURLToPath(
      new URL('../scripts/generateGameplayTagCatalog.ts', import.meta.url),
    );
    const output = path.join(f.root, 'generated.ts');
    const args = [
      '--experimental-strip-types',
      script,
      f.manifestPath,
      output,
      '--source-set',
      '--source-root',
      f.root,
      '--allow-new-source',
    ];
    execFileSync(process.execPath, args, { stdio: 'pipe' });
    const expected = fs.readFileSync(output, 'utf8');
    expect(expected).toContain("'B',\n  'A',");
    execFileSync(process.execPath, [...args, '--check'], { stdio: 'pipe' });
    fs.appendFileSync(path.join(f.root, 'a.txt'), 'broken');
    expect(() => execFileSync(process.execPath, args, { stdio: 'pipe' })).toThrow();
    expect(fs.readFileSync(output, 'utf8')).toBe(expected);
  });
  it('按 fileId + Int64 pathId 链接，保留集合顺序而非输入文件顺序', () => {
    const f = fixture();
    const result = readGameplayTagConfigSetExport(f.manifestPath);
    expect(result.catalog.paths).toEqual(['B', 'A']);
    expect(result).toMatchObject({ configCount: 2, emptyPathCount: 1, duplicatePathCount: 1 });
    f.manifest.configs.reverse();
    f.write();
    expect(readGameplayTagConfigSetExport(f.manifestPath).catalog).toEqual(result.catalog);
  });
  it('空来源配置合法，空标签仍保留到投影而非在读取时消失', () => {
    expect(
      parseGameplayTagConfigDumpSource(bytes('vector _keyData Array Array int size = 0'), 'empty')
        .paths,
    ).toEqual([]);
    expect(
      parseGameplayTagConfigDumpSource(
        bytes('vector _keyData Array Array int size = 1 string data = ""'),
        'empty-tag',
      ).paths,
    ).toEqual(['']);
  });
  it('不能把 obsoletes 的字符串填入活动标签，也不能截掉多余活动条目', () => {
    for (const text of [
      'vector _keyData Array Array int size = 2 string data = "A" vector obsoletes Array Array int size = 1 string data = "B"',
      'vector _keyData Array Array int size = 1 string data = "A" string data = "B"',
    ])
      expect(() => parseGameplayTagConfigDumpSource(bytes(text), 'fixture')).toThrow(
        /expected .* tag paths/,
      );
  });
  it('引用数量和 Int64 范围严格校验', () => {
    expect(() =>
      parseGameplayTagConfigSetDumpSource(
        bytes('vector configs Array Array int size = 1'),
        'fixture',
      ),
    ).toThrow('expected 1 config references');
    expect(() =>
      parseGameplayTagConfigSetDumpSource(
        bytes(
          'vector configs Array Array int size = 1 PPtr<$GameplayTagConfig> data int m_FileID = 1 SInt64 m_PathID = 9223372036854775808',
        ),
        'fixture',
      ),
    ).toThrow('invalid config PPtr');
  });
  it.each([
    'missing',
    'wrong-file',
    'wrong-object',
    'partial',
    'hash',
    'escape',
    'ads',
    'extra-field',
  ] as const)('拒绝不完整或伪配的导出：%s', change => {
    const f = fixture();
    const first = f.manifest.configs[0]!;
    if (change === 'missing') f.manifest.configs.pop();
    if (change === 'wrong-file') first.sourceFile = 'CAB-b';
    if (change === 'wrong-object') first.pathId = '11';
    if (change === 'partial') first.complete = false;
    if (change === 'hash') fs.appendFileSync(path.join(f.root, 'a.txt'), 'corrupt');
    if (change === 'escape') first.dump.file = '../outside.txt';
    if (change === 'ads') first.dump.file = 'a.txt:stream';
    if (change === 'extra-field') Object.assign(first, { guess: true });
    f.write();
    expect(() => readGameplayTagConfigSetExport(f.manifestPath)).toThrow();
  });
  it('拒绝相对路径经链接离开来源目录', () => {
    const f = fixture();
    const outside = fixture();
    fs.symlinkSync(
      outside.root,
      path.join(f.root, 'linked'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    f.manifest.configs[0]!.dump.file = 'linked/a.txt';
    f.write();
    expect(() => readGameplayTagConfigSetExport(f.manifestPath)).toThrow('link');
  });
  it('拒绝多余对象和重复配置引用，不以目录扫描结果代替引用闭包', () => {
    const object = { sourceFile: 'CAB', pathId: '1', source: { paths: ['Tag'] } };
    expect(() => compileGameplayTagConfigSetSource([], 'CAB', [], [object])).toThrow(
      'unreferenced',
    );
    expect(() =>
      compileGameplayTagConfigSetSource(
        [
          { fileId: 0, pathId: '1' },
          { fileId: 0, pathId: '1' },
        ],
        'CAB',
        [],
        [object],
      ),
    ).toThrow('duplicate config');
    expect(() =>
      compileGameplayTagConfigSetSource([{ fileId: 0, pathId: '1' }], 'CAB', [], [object, object]),
    ).toThrow('ambiguous');
  });
});
