/** 检查原文与 JSON 的共同来源、冻结、容量淘汰和独立验收时的重新读取。 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { SourceFileCache } from '../src/source/sourceFileCache.ts';

const roots: string[] = [];

function fixture(files: Readonly<Record<string, string>>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'source-file-cache-'));
  roots.push(root);
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(root, name), text);
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('原始文件缓存', () => {
  it('原文与懒解析 JSON 来自同次读取，命中保留解析对象', () => {
    const text = '{ "value": 1 }\r\n';
    const root = fixture({ 'source.json': text });
    const file = path.join(root, 'source.json');
    const cache = new SourceFileCache(100);
    expect(cache.readText(file)).toBe(text);
    expect(cache.statistics().jsonParses).toBe(0);
    fs.writeFileSync(file, '{"value":2}');
    const json = cache.readJson(file);
    expect(json).toEqual({ value: 1 });
    expect(cache.readJson(file)).toBe(json);
    expect(cache.readText(file)).toBe(text);
    expect(cache.statistics()).toEqual({
      fileReads: 1,
      jsonParses: 1,
      cacheHits: 3,
      retainedSourceBytes: Buffer.byteLength(text),
      peakRetainedSourceBytes: Buffer.byteLength(text),
    });
  });

  it('冻结所有嵌套对象和数组，不能经一个消费者改写另一个消费者的来源', () => {
    const root = fixture({ 'source.json': '{"items":[{"value":1}],"__proto__":{"key":2}}' });
    const file = path.join(root, 'source.json');
    const cache = new SourceFileCache(100);
    const json = cache.readJson(file) as {
      items: { value: number }[];
      __proto__: { key: number };
    };
    expect(Object.isFrozen(json)).toBe(true);
    expect(Object.isFrozen(json.items)).toBe(true);
    expect(Object.isFrozen(json.items[0])).toBe(true);
    expect(Object.isFrozen(json.__proto__)).toBe(true);
    expect(() => {
      json.items[0]!.value = 2;
    }).toThrow(TypeError);
    expect(() => json.items.push({ value: 2 })).toThrow(TypeError);
    expect(() => {
      json.__proto__.key = 3;
    }).toThrow(TypeError);
    expect(cache.readJson(file)).toEqual({ items: [{ value: 1 }], ['__proto__']: { key: 2 } });
  });

  it('clear 释放两种表示，下一次读取看到文件变化但累计统计保留', () => {
    const root = fixture({ 'source.json': '{"value":1}' });
    const file = path.join(root, 'source.json');
    const cache = new SourceFileCache(100);
    cache.readJson(file);
    cache.readText(file);
    const before = cache.statistics();
    cache.clear();
    expect(cache.statistics()).toEqual({ ...before, retainedSourceBytes: 0 });
    fs.writeFileSync(file, '{"value":2}');
    expect(cache.readJson(file)).toEqual({ value: 2 });
    expect(cache.statistics()).toEqual({ ...before, fileReads: 2, jsonParses: 2 });
    expect(before.fileReads).toBe(1);
  });

  it('规范化相对路径、绝对路径和点路径别名', () => {
    const root = fixture({ 'source.json': 'null' });
    const file = path.join(root, 'source.json');
    const cache = new SourceFileCache(100);
    expect(cache.readJson(path.relative(process.cwd(), file))).toBeNull();
    expect(cache.readJson(`${root}${path.sep}.${path.sep}source.json`)).toBeNull();
    expect(cache.readText(file)).toBe('null');
    expect(cache.statistics()).toMatchObject({ fileReads: 1, jsonParses: 1, cacheHits: 2 });
  });

  it('按最近使用顺序淘汰，JSON 命中也更新顺序', () => {
    const root = fixture({ 'a.json': '1', 'b.json': '2', 'c.json': '3' });
    const file = (name: string) => path.join(root, `${name}.json`);
    const cache = new SourceFileCache(2);
    cache.readText(file('a'));
    cache.readText(file('b'));
    expect(cache.readJson(file('a'))).toBe(1);
    cache.readText(file('c'));
    fs.writeFileSync(file('a'), '9');
    fs.writeFileSync(file('b'), '8');
    expect(cache.readJson(file('a'))).toBe(1);
    expect(cache.readJson(file('b'))).toBe(8);
    expect(cache.statistics()).toEqual({
      fileReads: 4,
      jsonParses: 2,
      cacheHits: 2,
      retainedSourceBytes: 2,
      peakRetainedSourceBytes: 2,
    });
  });

  it('按 UTF-8 字节限制容量，可一次淘汰多个文件且不超过峰值上限', () => {
    const root = fixture({ a: '中', b: '文', c: '测试', d: '四' });
    const cache = new SourceFileCache(8);
    cache.readText(path.join(root, 'a'));
    cache.readText(path.join(root, 'b'));
    expect(cache.statistics().retainedSourceBytes).toBe(6);
    cache.readText(path.join(root, 'c'));
    expect(cache.statistics().retainedSourceBytes).toBe(6);
    cache.readText(path.join(root, 'd'));
    expect(cache.statistics()).toMatchObject({
      fileReads: 4,
      cacheHits: 0,
      retainedSourceBytes: 3,
      peakRetainedSourceBytes: 6,
    });
  });

  it('超大文件仍可解析并冻结，但不保留，也不挤出已缓存的小文件', () => {
    const root = fixture({ small: '1', large: '{"value":12345}' });
    const cache = new SourceFileCache(2);
    cache.readText(path.join(root, 'small'));
    const first = cache.readJson(path.join(root, 'large'));
    const second = cache.readJson(path.join(root, 'large'));
    expect(first).toEqual({ value: 12345 });
    expect(second).not.toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
    expect(cache.readText(path.join(root, 'small'))).toBe('1');
    expect(cache.statistics()).toEqual({
      fileReads: 3,
      jsonParses: 2,
      cacheHits: 1,
      retainedSourceBytes: 1,
      peakRetainedSourceBytes: 1,
    });
  });

  it('读盘失败不缓存，文件随后出现时可以读取', () => {
    const root = fixture({});
    const file = path.join(root, 'later.json');
    const cache = new SourceFileCache(100);
    expect(() => cache.readJson(file)).toThrow();
    expect(cache.statistics()).toMatchObject({
      fileReads: 1,
      jsonParses: 0,
      retainedSourceBytes: 0,
    });
    fs.writeFileSync(file, 'false');
    expect(cache.readJson(file)).toBe(false);
    expect(cache.statistics()).toMatchObject({ fileReads: 2, jsonParses: 1, cacheHits: 0 });
  });

  it('超出容量时配对读取只读盘一次，原文与冻结 JSON 始终一致', () => {
    const text = '{ "value": 1 }\r\n';
    const root = fixture({ 'source.json': text });
    const file = path.join(root, 'source.json');
    const cache = new SourceFileCache(1);
    const first = cache.readJsonDocument(file);
    expect(first).toEqual({ text, json: { value: 1 } });
    expect(Object.isFrozen(first.json)).toBe(true);
    expect(cache.statistics()).toEqual({
      fileReads: 1,
      jsonParses: 1,
      cacheHits: 0,
      retainedSourceBytes: 0,
      peakRetainedSourceBytes: 0,
    });
    fs.writeFileSync(file, '{"value":2}');
    const second = cache.readJsonDocument(file);
    expect(second).toEqual({ text: '{"value":2}', json: { value: 2 } });
    expect(first.json).toEqual(JSON.parse(first.text));
    expect(cache.statistics()).toMatchObject({ fileReads: 2, jsonParses: 2, cacheHits: 0 });
  });

  it('配对读取失败不保留错误原文，修复后重新读取同一份文本与 JSON', () => {
    const root = fixture({ 'source.json': '{bad}' });
    const file = path.join(root, 'source.json');
    const cache = new SourceFileCache(100);
    expect(() => cache.readJsonDocument(file)).toThrow(SyntaxError);
    expect(cache.statistics().retainedSourceBytes).toBe(0);
    fs.writeFileSync(file, '{"fixed":true}');
    expect(cache.readJsonDocument(file)).toEqual({
      text: '{"fixed":true}',
      json: { fixed: true },
    });
    expect(cache.statistics()).toMatchObject({ fileReads: 2, jsonParses: 2, cacheHits: 0 });
  });

  it('JSON 失败会移除已缓存原文，修复文件后重新读取解析', () => {
    const root = fixture({ 'source.json': '{bad}' });
    const file = path.join(root, 'source.json');
    const cache = new SourceFileCache(100);
    cache.readText(file);
    expect(() => cache.readJson(file)).toThrow(SyntaxError);
    expect(cache.statistics().retainedSourceBytes).toBe(0);
    fs.writeFileSync(file, '{"fixed":true}');
    expect(cache.readJson(file)).toEqual({ fixed: true });
    expect(cache.statistics()).toMatchObject({ fileReads: 2, jsonParses: 2, cacheHits: 1 });
  });

  it('零容量不保留空文件；容量参数必须为非负安全整数', () => {
    const root = fixture({ empty: '' });
    const cache = new SourceFileCache(0);
    expect(cache.readText(path.join(root, 'empty'))).toBe('');
    expect(cache.readText(path.join(root, 'empty'))).toBe('');
    expect(cache.statistics()).toEqual({
      fileReads: 2,
      jsonParses: 0,
      cacheHits: 0,
      retainedSourceBytes: 0,
      peakRetainedSourceBytes: 0,
    });
    for (const capacity of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
      expect(() => new SourceFileCache(capacity)).toThrow(RangeError);
  });
});
