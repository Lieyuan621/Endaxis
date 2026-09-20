/**
 * 在一次规划或验收中复用原始文件的文本与 JSON，避免同一来源被反复读取、解析。
 * 按最近使用顺序淘汰文件；容量只计算原文的 UTF-8 字节，不代表字符串、JSON 对象及索引的 JS 堆占用。
 * 缓存由调用方创建和清理，不跨两轮独立验收共享，也不缓存编译结果或文件读取错误。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface CachedSourceFile {
  readonly text: string;
  readonly sourceBytes: number;
  jsonParsed: boolean;
  json: unknown;
}

export interface SourceFileCacheStatistics {
  /** 实际发起的磁盘读取次数，包含失败的读取。 */
  readonly fileReads: number;
  /** JSON.parse 调用次数，包含解析失败。 */
  readonly jsonParses: number;
  /** 命中已保留原文的次数；首次读取后的第一次 JSON 解析也可能命中原文。 */
  readonly cacheHits: number;
  /** 当前保留的原文 UTF-8 字节数，不含解析结果及缓存结构占用。 */
  readonly retainedSourceBytes: number;
  /** 此实例曾保留的原文字节数峰值；clear 不重置统计。 */
  readonly peakRetainedSourceBytes: number;
}

export class SourceFileCache {
  readonly #maxSourceBytes: number;
  readonly #files = new Map<string, CachedSourceFile>();
  #fileReads = 0;
  #jsonParses = 0;
  #cacheHits = 0;
  #retainedSourceBytes = 0;
  #peakRetainedSourceBytes = 0;

  /** 零表示不保留文件；容量必须是非负安全整数，单位为原文 UTF-8 字节。 */
  constructor(maxSourceBytes: number) {
    if (!Number.isSafeInteger(maxSourceBytes) || maxSourceBytes < 0)
      throw new RangeError('maxSourceBytes must be a non-negative safe integer');
    this.#maxSourceBytes = maxSourceBytes;
  }

  /** 保留磁盘原文，不通过重新序列化 JSON 生成文本，来源哈希可以直接使用此返回值。 */
  readText(file: string): string {
    return this.#read(resolve(file)).text;
  }

  /**
   * 首次按同一份缓存原文解析，并冻结全部 JSON 对象和数组，防止下游改写共享来源。
   * 解析失败会移除原文，下次调用重新读盘；超出容量的文件每次单独读取和解析。
   */
  readJson(file: string): unknown {
    return this.readJsonDocument(file).json;
  }

  /** 原文与 JSON 总是来自同次读取；超出容量、不保留缓存时也可安全配对计算来源哈希。 */
  readJsonDocument(file: string): { readonly text: string; readonly json: unknown } {
    const resolved = resolve(file);
    const entry = this.#read(resolved);
    if (!entry.jsonParsed) {
      try {
        this.#jsonParses++;
        entry.json = freezeJson(JSON.parse(entry.text));
        entry.jsonParsed = true;
      } catch (error) {
        this.#remove(resolved);
        throw error;
      }
    }
    return { text: entry.text, json: entry.json };
  }

  /** 释放原文、解析结果和路径索引；累计读盘、解析、命中和峰值统计继续保留。 */
  clear(): void {
    this.#files.clear();
    this.#retainedSourceBytes = 0;
  }

  statistics(): SourceFileCacheStatistics {
    return {
      fileReads: this.#fileReads,
      jsonParses: this.#jsonParses,
      cacheHits: this.#cacheHits,
      retainedSourceBytes: this.#retainedSourceBytes,
      peakRetainedSourceBytes: this.#peakRetainedSourceBytes,
    };
  }

  #read(file: string): CachedSourceFile {
    const cached = this.#files.get(file);
    if (cached !== undefined) {
      this.#cacheHits++;
      this.#files.delete(file);
      this.#files.set(file, cached);
      return cached;
    }

    this.#fileReads++;
    const text = readFileSync(file, 'utf8');
    const sourceBytes = Buffer.byteLength(text, 'utf8');
    const entry: CachedSourceFile = { text, sourceBytes, jsonParsed: false, json: undefined };
    // 超大文件不驱逐已经缓存的小文件，零容量连空文件也不保留。
    if (this.#maxSourceBytes === 0 || sourceBytes > this.#maxSourceBytes) return entry;
    while (this.#retainedSourceBytes + sourceBytes > this.#maxSourceBytes) {
      this.#remove(this.#files.keys().next().value!);
    }
    this.#files.set(file, entry);
    this.#retainedSourceBytes += sourceBytes;
    this.#peakRetainedSourceBytes = Math.max(
      this.#peakRetainedSourceBytes,
      this.#retainedSourceBytes,
    );
    return entry;
  }

  #remove(file: string): void {
    const entry = this.#files.get(file);
    if (entry === undefined) return;
    this.#files.delete(file);
    this.#retainedSourceBytes -= entry.sourceBytes;
  }
}

/** JSON.parse 只会生成普通对象、数组和原始值；迭代遍历避免深层 JSON 耗尽调用栈。 */
function freezeJson(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  const pending: object[] = [value];
  while (pending.length > 0) {
    const current = pending.pop()!;
    Object.freeze(current);
    for (const child of Object.values(current)) {
      if (child !== null && typeof child === 'object') pending.push(child);
    }
  }
  return value;
}
