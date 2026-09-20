import { createHash } from 'node:crypto';
import { requireRecord, requireString } from '../src/source/primitives.ts';

export const DEFAULT_CDN = 'https://data.akedata.wiki';
export const DEFAULT_VFS_BASE = 'http://127.0.0.1:8765/api/endaxis-data';

export interface AssetRecord {
  readonly size: number;
  readonly md5: string;
  readonly version: string;
}

export interface ResourceBytes {
  readonly content: Uint8Array;
  readonly source: string;
  readonly provider: 'akedb' | 'vfs-index-browser';
  readonly version: string | null;
  readonly fallbackReason?: string;
}

/** 同一次任务持有同一份索引，避免每个资源重新解析 latest 而跨批混用。 */
export class AkedbSnapshot {
  readonly base: string;
  readonly version: string;
  readonly tablePath: string;
  readonly revision: string;
  readonly assets: Readonly<Record<'json' | 'images', ReadonlyMap<string, AssetRecord>>>;
  readonly evidence: readonly { path: string; sha256: string }[];
  private constructor(
    base: string,
    version: string,
    tablePath: string,
    revision: string,
    assets: AkedbSnapshot['assets'],
    evidence: AkedbSnapshot['evidence'],
  ) {
    this.base = base;
    this.version = version;
    this.tablePath = tablePath;
    this.revision = revision;
    this.assets = assets;
    this.evidence = evidence;
  }

  static async load(base: string, requestedVersion = 'latest'): Promise<AkedbSnapshot> {
    const manifest = await fetchBytes(base, 'manifest.json', true);
    const index = await fetchBytes(base, 'asset-sync-index.json', true);
    const m = requireRecord(parseJson(manifest.content), 'AKEDB manifest');
    const version =
      requestedVersion === 'latest' ? requireString(m.latest, 'manifest.latest') : requestedVersion;
    if (!Array.isArray(m.versions)) throw new Error('manifest.versions: expected array');
    const versions = m.versions
      .map(v => requireRecord(v, 'manifest version'))
      .filter(v => v.id === version);
    if (versions.length !== 1) throw new Error(`AKEDB manifest: unavailable version ${version}`);
    const tablePath = safeAssetPath(requireString(versions[0]!.tableCfgPath, 'tableCfgPath'));
    const i = requireRecord(parseJson(index.content), 'AKEDB asset index');
    if (i.schemaVersion !== 2) throw new Error('unsupported AKEDB asset index schema');
    const datasets = requireRecord(i.datasets, 'asset index.datasets');
    const assets = { json: new Map<string, AssetRecord>(), images: new Map<string, AssetRecord>() };
    for (const kind of ['json', 'images'] as const) {
      const dataset = requireRecord(datasets[kind], `asset index.${kind}`);
      const files = requireRecord(dataset.files, `asset index.${kind}.files`);
      for (const [assetPath, raw] of Object.entries(files)) {
        safeAssetPath(assetPath);
        const entry = requireRecord(raw, assetPath);
        if (
          !Number.isSafeInteger(entry.size) ||
          (entry.size as number) < 0 ||
          typeof entry.md5 !== 'string' ||
          !/^[a-f0-9]{32}$/i.test(entry.md5)
        ) {
          throw new Error(`invalid AKEDB asset integrity record: ${assetPath}`);
        }
        assets[kind].set(assetPath, {
          size: entry.size as number,
          md5: entry.md5.toLowerCase(),
          version: requireString(entry.version, `${assetPath}.version`),
        });
      }
    }
    return new AkedbSnapshot(
      base,
      version,
      tablePath,
      requireString(i.revision, 'asset index.revision'),
      assets,
      [
        { path: 'manifest.json', sha256: sha256(manifest.content) },
        { path: 'asset-sync-index.json', sha256: sha256(index.content) },
      ],
    );
  }

  collectionFiles(collection: string): string[] {
    return [...this.assets.json.keys()]
      .filter(p => p.startsWith(`${collection}/`))
      .map(p => p.slice(collection.length + 1));
  }

  async table(name: string): Promise<ResourceBytes> {
    const resource = await fetchBytes(this.base, `${this.tablePath}/${name}.json`);
    return { ...resource, provider: 'akedb', version: this.version };
  }

  async asset(kind: 'json' | 'images', assetPath: string): Promise<ResourceBytes> {
    const record = this.assets[kind].get(assetPath);
    if (!record) throw new Error(`AKEDB asset not indexed: ${assetPath}`);
    const prefix = kind === 'json' ? 'public/Json' : 'public/images';
    const resource = await fetchBytes(
      this.base,
      `${prefix}/${safeAssetPath(assetPath)}`,
      false,
      record.md5,
    );
    if (
      resource.content.byteLength !== record.size ||
      createHash('md5').update(resource.content).digest('hex') !== record.md5
    ) {
      throw new Error(`AKEDB asset hash/size mismatch: ${assetPath}; no fallback permitted`);
    }
    return { ...resource, provider: 'akedb', version: record.version };
  }

  async verifyUnchanged(): Promise<void> {
    for (const item of this.evidence) {
      const current = await fetchBytes(this.base, item.path, true);
      if (sha256(current.content) !== item.sha256)
        throw new Error(`AKEDB snapshot changed during export: ${item.path}`);
    }
  }
}

export class ResourceHttpError extends Error {
  readonly status: number;
  constructor(status: number, source: string) {
    super(`${source}: HTTP ${status}`);
    this.status = status;
  }
}

export function isMissingResource(error: unknown): boolean {
  return error instanceof ResourceHttpError && error.status === 404;
}

export async function vfsResource(
  base: string,
  logicalPath: string,
  version: string | null,
): Promise<ResourceBytes> {
  const resource = await fetchBytes(base, safeAssetPath(logicalPath), false, undefined, true);
  return { ...resource, provider: 'vfs-index-browser', version };
}

async function fetchBytes(
  base: string,
  assetPath: string,
  fresh = false,
  revision?: string,
  vfs = false,
) {
  const url = new URL(safeAssetPath(assetPath), `${base.replace(/\/+$/, '')}/`);
  if (fresh) url.searchParams.set('t', String(Date.now()));
  else if (revision) url.searchParams.set('v', revision);
  // 只重试传输中断，保持原 URL / 版本 / 校验不变；状态码或内容错误不能借重试换源掩盖。
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Endaxis-Next/1',
          ...(fresh ? { 'Cache-Control': 'no-cache' } : {}),
        },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new ResourceHttpError(response.status, url.href);
      if (vfs && response.headers.get('x-endaxis-source') !== 'vfs-index-browser') {
        throw new Error(`${url}: response lacks the required vfs-index-browser source header`);
      }
      return { content: new Uint8Array(await response.arrayBuffer()), source: url.href };
    } catch (error) {
      const retryableHttpResponse = error instanceof ResourceHttpError && error.status === 570;
      if (!retryableHttpResponse && !isTransientTransportError(error)) throw error;
      if (attempt === 3 && retryableHttpResponse) throw error;
      if (attempt === 3)
        throw new TypeError(`${url}: transport failed after ${attempt} attempts`, { cause: error });
      await new Promise(resolve => setTimeout(resolve, 250 * attempt));
    }
  }
}

function isTransientTransportError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'TimeoutError') return true;
  if (!(error instanceof Error)) return false;
  const cause = error.cause as { code?: string } | undefined;
  return new Set([
    'ECONNRESET',
    'EPIPE',
    'ETIMEDOUT',
    'EAI_AGAIN',
    'UND_ERR_SOCKET',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_HEADERS_TIMEOUT',
    'UND_ERR_BODY_TIMEOUT',
  ]).has(cause?.code ?? '');
}

export function safeAssetPath(value: string): string {
  if (
    !value ||
    value.includes('\\') ||
    /[?#%:]/.test(value) ||
    value.split('/').some(p => !p || p === '.' || p === '..')
  ) {
    throw new Error(`unsafe asset path: ${value}`);
  }
  return value;
}

export function parseJson(content: Uint8Array): unknown {
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(content));
}

export function sha256(content: Uint8Array): string {
  return createHash('sha256').update(content).digest('hex');
}
