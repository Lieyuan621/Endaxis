import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCompilerTemporaryDirectory, renameWithRetry } from '../src/io.ts';

import {
  AkedbSnapshot,
  DEFAULT_CDN,
  DEFAULT_VFS_BASE,
  ResourceHttpError,
  isMissingResource,
  parseJson,
  sha256,
  vfsResource,
  type ResourceBytes,
} from './gameDataProviders.ts';

export interface GameDataSourceCatalog {
  readonly tableCfg: readonly string[];
  readonly jsonCollections: Readonly<Record<string, string>>;
  readonly jsonFiles: readonly string[];
}

export interface DownloadArguments {
  readonly vfsBase: string;
  readonly sourceMode?: 'hybrid' | 'vfs-only';
  readonly cdn?: string;
  readonly version?: string;
  /** 由调用方声明；未知时保留 null，不伪装成已证明与 AKEDB 同版本。 */
  readonly vfsVersion?: string;
  readonly sourceCatalog: string;
  readonly output: string;
  readonly workers: number;
  readonly tablesOnly: boolean;
  readonly jsonFile?: string;
}

export interface SourceProvenanceEntry {
  readonly logicalPath: string;
  readonly source: string;
  readonly provider: ResourceBytes['provider'];
  readonly version: string | null;
  readonly fallbackReason?: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export async function loadSourceCatalog(filePath: string): Promise<GameDataSourceCatalog> {
  const value = requireRecord(await readJson(filePath), filePath);
  const tableCfg = requireStringArray(value.tableCfg, `${filePath}.tableCfg`);
  requireUnique(tableCfg, `${filePath}.tableCfg`);
  tableCfg.forEach((name, index) => requireSafeName(name, `${filePath}.tableCfg[${index}]`));

  const jsonCollections = Object.fromEntries(
    Object.entries(requireRecord(value.jsonCollections, `${filePath}.jsonCollections`)).map(
      ([name, rawDirectory]) => {
        requireSafeName(name, `${filePath}.jsonCollections.${name}`);
        const directory = requireNonEmptyString(
          rawDirectory,
          `${filePath}.jsonCollections.${name}`,
        );
        if (!/^[A-Za-z0-9_]+$/.test(directory)) {
          throw new Error(`${filePath}.jsonCollections.${name}: expected a directory name`);
        }
        return [name, directory];
      },
    ),
  );
  const jsonFiles = requireStringArray(value.jsonFiles ?? [], `${filePath}.jsonFiles`).map(
    (name, index) => requireSafeCollectionFile(name, `${filePath}.jsonFiles[${index}]`),
  );
  requireUnique(jsonFiles, `${filePath}.jsonFiles`);
  requireUnique(Object.values(jsonCollections), `${filePath}.jsonCollections output directories`);
  return { tableCfg, jsonCollections, jsonFiles };
}

export async function downloadGameDataSources(args: DownloadArguments): Promise<void> {
  if (!Number.isInteger(args.workers) || args.workers <= 0)
    throw new Error('--workers: expected a positive integer');
  const catalog = await loadSourceCatalog(args.sourceCatalog);
  if (args.jsonFile && (args.tablesOnly || !catalog.jsonFiles.includes(args.jsonFile))) {
    throw new Error(
      '--json-file must select a declared resource and cannot combine with --tables-only',
    );
  }
  const mode = args.sourceMode ?? 'hybrid';
  if (mode !== 'hybrid' && mode !== 'vfs-only') throw new Error('invalid source mode');
  const provenance: SourceProvenanceEntry[] = [];
  const inventories: Array<{ collection: string; vfs: string; files: number }> = [];
  const output = path.resolve(args.output);
  // 全量刷新只发布到不存在的目录，防止半途失败污染上一批可用快照。
  if (!args.jsonFile) {
    if (
      await fs.stat(output).then(
        () => true,
        e => {
          if (e.code === 'ENOENT') return false;
          throw e;
        },
      )
    ) {
      throw new Error('snapshot output already exists; choose a new --output directory');
    }
  }
  const akedb =
    mode === 'hybrid' ? await AkedbSnapshot.load(args.cdn ?? DEFAULT_CDN, args.version) : null;
  await fs.mkdir(path.dirname(output), { recursive: true });
  const stagingWorkspace = args.jsonFile
    ? undefined
    : await createCompilerTemporaryDirectory('source-snapshot', path.dirname(output));
  const staging = stagingWorkspace ? path.join(stagingWorkspace, 'snapshot') : output;
  if (stagingWorkspace) await fs.mkdir(staging);

  try {
    async function resource(logicalPath: string, tableName?: string): Promise<ResourceBytes> {
      let reason = akedb ? 'not-in-akedb-index' : undefined;
      if (akedb && (tableName || akedb.assets.json.has(logicalPath))) {
        try {
          const item = tableName
            ? await akedb.table(tableName)
            : await akedb.asset('json', logicalPath);
          if (
            tableName !== 'GlobalConst' ||
            typeof (parseJson(item.content) as Record<string, unknown>).maxDashEnergyLimit ===
              'number'
          )
            return item;
          reason = 'akedb-missing-required-field';
        } catch (error) {
          if (!isMissingResource(error)) throw error;
          reason = 'akedb-http-404';
        }
      }
      const result = await vfsResource(args.vfsBase, logicalPath, args.vfsVersion ?? null);
      return { ...result, ...(reason ? { fallbackReason: reason } : {}) };
    }

    async function save(logicalPath: string, destination: string, tableName?: string) {
      const item = await resource(logicalPath, tableName);
      parseJson(item.content);
      await writeAtomicBytes(path.join(staging, destination), item.content);
      const { content, ...identity } = item;
      const entry = {
        logicalPath,
        ...identity,
        byteLength: content.byteLength,
        sha256: sha256(content),
      };
      provenance.push(entry);
      return entry;
    }

    if (args.jsonFile) {
      const entry = await save(args.jsonFile, args.jsonFile);
      await writeAtomicJson(path.join(output, args.jsonFile + '.provenance.json'), entry);
      return;
    }

    await runConcurrent(catalog.tableCfg, args.workers, name =>
      save(`TableCfg-current/${name}.json`, `TableCfg-current/${name}.json`, name).then(() => {}),
    );
    if (!args.tablesOnly) {
      for (const logicalPath of catalog.jsonFiles) await save(logicalPath, logicalPath);
      for (const [collection, directory] of Object.entries(catalog.jsonCollections)) {
        const cdnFiles = akedb?.collectionFiles(collection) ?? [];
        let vfsFiles: string[] = [];
        let vfsStatus = 'available';
        // 取并集以发现 AKEDB 尚未收录的新文件；同名资源只取 AKEDB，不覆盖或合并字段。
        let rawInventory: ResourceBytes | undefined;
        try {
          rawInventory = await vfsResource(
            args.vfsBase,
            `${collection}/manifest.json`,
            args.vfsVersion ?? null,
          );
        } catch (error) {
          const unavailable =
            error instanceof ResourceHttpError ||
            error instanceof TypeError ||
            (error instanceof DOMException && error.name === 'TimeoutError');
          if (cdnFiles.length === 0 || !unavailable) throw error;
          vfsStatus = 'unavailable: ' + String(error);
          process.stderr.write(`${collection}: VFS inventory unavailable; AKEDB coverage only\n`);
        }
        // 坏清单不是网络不可用，必须阻断，不能静默缩小资源集合。
        if (rawInventory)
          vfsFiles = parseCollectionManifest(parseJson(rawInventory.content), collection);
        const entries = [...new Set([...cdnFiles, ...vfsFiles])].sort();
        entries.forEach(name => {
          if (!/^[A-Za-z0-9_.-]+\.json$/.test(name) || name.includes('..'))
            throw new Error('unsafe collection filename');
        });
        inventories.push({ collection, vfs: vfsStatus, files: entries.length });
        await runConcurrent(entries, args.workers, name =>
          save(`${collection}/${name}`, `${directory}/${name}`).then(() => {}),
        );
        process.stdout.write(`${collection}: ${entries.length} files\n`);
      }
    }
    await akedb?.verifyUnchanged();
    const sorted = provenance.sort((a, b) => a.logicalPath.localeCompare(b.logicalPath));
    const snapshotSha256 = createHash('sha256')
      .update(sorted.map(entry => `${entry.logicalPath}\0${entry.sha256}\n`).join(''))
      .digest('hex');
    await writeAtomicJson(path.join(staging, 'source-provenance.json'), {
      schemaVersion: 2,
      mode,
      snapshotSha256,
      akedb: akedb
        ? { version: akedb.version, assetRevision: akedb.revision, evidence: akedb.evidence }
        : null,
      vfs: { base: args.vfsBase, declaredVersion: args.vfsVersion ?? null, versionVerified: false },
      inventories,
      entries: sorted,
    });
    await renameWithRetry(staging, output);
    process.stdout.write(
      `downloaded ${mode} snapshot ${snapshotSha256.slice(0, 12)}: ${sorted.length} resources\n`,
    );
  } finally {
    if (stagingWorkspace) await fs.rm(stagingWorkspace, { recursive: true, force: true });
  }
}

function parseCollectionManifest(value: unknown, collection: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${collection} manifest: expected array`);
  const files = value.map((rawEntry, index) => {
    const entry = requireRecord(rawEntry, `${collection} manifest[${index}]`);
    const contentFile = requireNonEmptyString(
      entry.contentFile,
      `${collection} manifest[${index}].contentFile`,
    );
    const fileName = path.posix.basename(new URL(contentFile, 'http://local/').pathname);
    if (!/^[A-Za-z0-9_.-]+\.json$/.test(fileName)) {
      throw new Error(`${collection} manifest[${index}]: unsafe JSON filename`);
    }
    return fileName;
  });
  requireUnique(files, `${collection} manifest`);
  return files.sort((left, right) => left.localeCompare(right));
}

export async function writeAtomicBytes(output: string, content: Uint8Array): Promise<void> {
  const parent = path.dirname(output);
  await fs.mkdir(parent, { recursive: true });
  const workspace = await createCompilerTemporaryDirectory('atomic-file', parent);
  const temporary = path.join(workspace, 'generated');
  try {
    await fs.writeFile(temporary, content);
    await renameWithRetry(temporary, output);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

export async function writeAtomicJson(output: string, value: unknown): Promise<void> {
  await writeAtomicBytes(output, new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`));
}

export async function runConcurrent<T>(
  values: readonly T[],
  workers: number,
  run: (value: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;
  let failed = false;
  let failure: unknown;
  await Promise.all(
    Array.from({ length: Math.min(workers, values.length) }, async () => {
      while (!failed && nextIndex < values.length) {
        const value = values[nextIndex++]!;
        try {
          await run(value);
        } catch (error) {
          if (!failed) {
            failed = true;
            failure = error;
          }
        }
      }
    }),
  );
  if (failed) throw failure;
}

export function parseArguments(values: readonly string[]): DownloadArguments {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const result = new Map<string, string>();
  let tablesOnly = false;
  for (let index = 0; index < values.length; index += 1) {
    const name = values[index]!;
    if (name === '--tables-only') {
      tablesOnly = true;
      continue;
    }
    const value = values[index + 1];
    if (!name.startsWith('--') || value === undefined) throw new Error(`missing value for ${name}`);
    result.set(name, value);
    index += 1;
  }
  const allowed = new Set([
    '--vfs-base',
    '--source-mode',
    '--cdn',
    '--version',
    '--vfs-version',
    '--source-catalog',
    '--output',
    '--workers',
    '--json-file',
  ]);
  for (const key of result.keys())
    if (!allowed.has(key)) throw new Error(`unknown argument: ${key}`);
  if (
    result.has('--source-mode') &&
    !['hybrid', 'vfs-only'].includes(result.get('--source-mode')!)
  ) {
    throw new Error('--source-mode must be hybrid or vfs-only');
  }
  return {
    vfsBase: result.get('--vfs-base') ?? DEFAULT_VFS_BASE,
    sourceMode: result.get('--source-mode') === 'vfs-only' ? 'vfs-only' : 'hybrid',
    cdn: result.get('--cdn') ?? DEFAULT_CDN,
    version: result.get('--version') ?? 'latest',
    ...(result.has('--vfs-version') ? { vfsVersion: result.get('--vfs-version')! } : {}),
    sourceCatalog: path.resolve(
      result.get('--source-catalog') ??
        path.join(projectRoot, 'tools/game-data-compiler/game-data-sources.json'),
    ),
    output: path.resolve(result.get('--output') ?? path.join(projectRoot, 'tmp/game-data-sources')),
    workers: Number(result.get('--workers') ?? 6),
    tablesOnly,
    ...(result.has('--json-file') ? { jsonFile: result.get('--json-file')! } : {}),
  };
}

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function requireRecord(value: unknown, sourcePath: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${sourcePath}: expected object`);
  }
  return value as Record<string, unknown>;
}

function requireNonEmptyString(value: unknown, sourcePath: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${sourcePath}: expected non-empty string`);
  }
  return value;
}

function requireStringArray(value: unknown, sourcePath: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${sourcePath}: expected array`);
  return value.map((item, index) => requireNonEmptyString(item, `${sourcePath}[${index}]`));
}

function requireUnique(values: readonly string[], sourcePath: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${sourcePath}: duplicate value`);
}

function requireSafeName(value: string, sourcePath: string): void {
  if (!/^[A-Za-z0-9_]+$/.test(value)) throw new Error(`${sourcePath}: expected a safe name`);
}

function requireSafeCollectionFile(value: string, sourcePath: string): string {
  const parsed = requireNonEmptyString(value, sourcePath).replace(/\\/g, '/');
  if (!/^[A-Za-z0-9_]+\/[A-Za-z0-9_.-]+\.json$/.test(parsed)) {
    throw new Error(`${sourcePath}: expected collection/file.json`);
  }
  return parsed;
}

const entryPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (entryPath === import.meta.url) {
  await downloadGameDataSources(parseArguments(process.argv.slice(2)));
}
