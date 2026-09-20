import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);
const RANK_NAMES = ['mob', 'boss', 'elite'] as const;

interface Arguments {
  readonly tablesDirectory: string;
  readonly unityWorker: string;
  readonly output: string;
  readonly vfsUrl: string;
  readonly workers: number;
}

interface ParsedEnemyRank {
  readonly nativeValue: number;
  readonly rank: (typeof RANK_NAMES)[number];
  readonly modelKey: string;
  readonly componentCount: number;
}

interface WorkerResponse {
  readonly ok?: boolean;
  readonly result?: {
    readonly artifactCount?: number;
    readonly artifacts?: readonly { readonly relativePath?: string }[];
  };
  readonly error?: { readonly code?: string; readonly message?: string };
}

export function parseEnemyTemplateRank(raw: Uint8Array, expectedGameId: string): ParsedEnemyRank {
  const data = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
  let offset = 12;
  offset = align4(offset + 1);
  offset += 12;
  [, offset] = readString(data, offset);

  const [rootRid, afterRootRid] = readInt64(data, offset);
  offset = afterRootRid;
  const [registryVersion, afterVersion] = readInt32(data, offset);
  offset = afterVersion;
  const [referenceCount, afterReferenceCount] = readInt32(data, offset);
  offset = afterReferenceCount;
  if (registryVersion !== 2 || referenceCount <= 0) {
    throw new Error(`unexpected managed reference registry ${registryVersion}/${referenceCount}`);
  }

  const [firstRid, afterFirstRid] = readInt64(data, offset);
  offset = afterFirstRid;
  let className: string;
  [className, offset] = readString(data, offset);
  let namespace: string;
  [namespace, offset] = readString(data, offset);
  let assembly: string;
  [assembly, offset] = readString(data, offset);
  const dataOffset = offset;
  if (rootRid !== firstRid)
    throw new Error(`root rid ${rootRid} does not match first record ${firstRid}`);
  if (
    className !== 'EnemyTemplateData' ||
    namespace !== 'Beyond.Gameplay' ||
    assembly !== 'Gameplay.Beyond'
  ) {
    throw new Error(`unexpected managed type ${namespace}.${className}, ${assembly}`);
  }

  const encodedId = Buffer.from(expectedGameId, 'utf8');
  let occurrence = data.indexOf(encodedId, dataOffset);
  let modelKeyOffset = -1;
  let modelKey = '';
  while (occurrence >= 0) {
    const prefix = occurrence - 4;
    if (prefix >= dataOffset) {
      try {
        const [candidate, candidateEnd] = readString(data, prefix);
        if (candidate.startsWith(expectedGameId) && candidate !== expectedGameId) {
          modelKeyOffset = prefix;
          modelKey = candidate;
          offset = candidateEnd;
          break;
        }
      } catch {
        // The byte sequence can occur in later payloads without being a string boundary.
      }
    }
    occurrence = data.indexOf(encodedId, occurrence + 1);
  }
  if (modelKeyOffset < 0) throw new Error('could not locate EnemyTemplateData.modelKey');

  const rootHighWord = firstRid >> 32n;
  let componentCount = 0;
  for (let count = 1; count < referenceCount; count += 1) {
    const candidateOffset = modelKeyOffset - 4 - count * 8;
    if (candidateOffset < dataOffset) break;
    if (data.readInt32LE(candidateOffset) !== count) continue;
    const references = Array.from({ length: count }, (_, index) =>
      data.readBigInt64LE(candidateOffset + 4 + index * 8),
    );
    if (
      new Set(references).size === count &&
      references.every(reference => reference !== 0n && reference >> 32n === rootHighWord)
    ) {
      componentCount = count;
      break;
    }
  }
  if (componentCount === 0) throw new Error('could not validate EnemyTemplateData.componentList');

  const [nativeValue] = readInt32(data, offset);
  const rank = RANK_NAMES[nativeValue];
  if (rank === undefined) throw new Error(`unknown EnemyRank value ${nativeValue}`);
  if (!modelKey.includes(expectedGameId)) {
    throw new Error(
      `model key ${JSON.stringify(modelKey)} does not contain expected id ${expectedGameId}`,
    );
  }
  return { nativeValue, rank, modelKey, componentCount };
}

export async function extractEnemyRankEvidence(args: Arguments) {
  const displayTable = requireRecord(
    JSON.parse(
      await readFile(join(args.tablesDirectory, 'EnemyTemplateDisplayInfoTable.json'), 'utf8'),
    ),
    'EnemyTemplateDisplayInfoTable.json',
  );
  // Training targets share this display table but are not enemy template assets and are not
  // selectable combat enemies. The native enemy identity namespace is the explicit boundary.
  const gameIds = Object.keys(displayTable)
    .filter(gameId => gameId.startsWith('eny_'))
    .sort((left, right) => left.localeCompare(right));
  if (gameIds.length === 0) throw new Error('EnemyTemplateDisplayInfoTable.json has no enemies');

  const runRoot = await mkdtemp(join(tmpdir(), 'endaxis-enemy-ranks-'));
  const bundlePromises = new Map<number, Promise<string>>();
  let manifestId: number | undefined;
  try {
    const entries = await mapConcurrent(gameIds, args.workers, async gameId => {
      const assetName = `data_${gameId}.asset`;
      const lookup = requireRecord(
        await fetchJson(
          `${args.vfsUrl}/api/manifest-assets/by-name?name=${encodeURIComponent(assetName)}`,
        ),
        `VFS ${assetName}`,
      );
      const candidates = requireArray(lookup.candidates, `${assetName}.candidates`);
      if (candidates.length !== 1)
        throw new Error(`${assetName}: expected one manifest candidate, got ${candidates.length}`);
      const candidate = requireRecord(candidates[0], `${assetName}.candidates[0]`);
      const assetIndex = requireInteger(candidate.assetIndex, `${assetName}.assetIndex`);
      const currentManifestId = requireInteger(lookup.manifestId, `${assetName}.manifestId`);
      if (manifestId !== undefined && manifestId !== currentManifestId) {
        throw new Error(
          `VFS manifest changed during extraction: ${manifestId} -> ${currentManifestId}`,
        );
      }
      manifestId = currentManifestId;
      const assetPath = requireString(candidate.path, `${assetName}.path`);
      const bundleName = requireString(candidate.bundleName, `${assetName}.bundleName`);
      const search = requireRecord(
        await fetchJson(
          `${args.vfsUrl}/api/search?scope=effective&q=${encodeURIComponent(bundleName.split('/').pop() ?? bundleName)}&limit=20`,
        ),
        `${assetName}.bundleSearch`,
      );
      const expectedLogicalPath = `Bundle/Data/Bundles/Windows/${bundleName}`;
      const bundleMatches = requireArray(search.items, `${assetName}.bundleSearch.items`)
        .map((value, index) => requireRecord(value, `${assetName}.bundleSearch.items[${index}]`))
        .filter(value => value.path === expectedLogicalPath);
      if (bundleMatches.length !== 1) {
        throw new Error(
          `${assetName}: expected one effective bundle '${expectedLogicalPath}', got ${bundleMatches.length}`,
        );
      }
      const recordId = requireInteger(bundleMatches[0].id, `${assetName}.bundleSearch.id`);
      let bundlePromise = bundlePromises.get(recordId);
      if (bundlePromise === undefined) {
        bundlePromise = downloadBundle(args.vfsUrl, recordId, runRoot);
        bundlePromises.set(recordId, bundlePromise);
      }
      const bundlePath = await bundlePromise;
      const outputDirectory = join(runRoot, 'raw', gameId);
      await mkdir(outputDirectory, { recursive: true });
      const requestPath = join(runRoot, 'requests', `${gameId}.json`);
      await mkdir(join(runRoot, 'requests'), { recursive: true });
      await writeFile(
        requestPath,
        `${JSON.stringify({
          protocolVersion: '1.0.0',
          requestId: randomUUID(),
          operation: 'exportMonoBehaviourRaw',
          arguments: { inputPath: bundlePath, outputDirectory, container: assetPath },
        })}\n`,
        'utf8',
      );
      const { stdout, stderr } = await execFileAsync(args.unityWorker, ['request', requestPath], {
        maxBuffer: 4 * 1024 * 1024,
        windowsHide: true,
      });
      const response = JSON.parse(stdout.trim()) as WorkerResponse;
      if (response.ok !== true) {
        throw new Error(
          `${assetName}: Unity worker failed ${response.error?.code ?? ''} ${response.error?.message ?? stderr}`.trim(),
        );
      }
      const artifacts = response.result?.artifacts ?? [];
      if (
        response.result?.artifactCount !== 1 ||
        artifacts.length !== 1 ||
        typeof artifacts[0]?.relativePath !== 'string'
      ) {
        throw new Error(`${assetName}: Unity worker returned ${artifacts.length} raw artifacts`);
      }
      const raw = await readFile(join(outputDirectory, artifacts[0].relativePath));
      const parsed = parseEnemyTemplateRank(raw, gameId);
      const iconLookup = requireRecord(
        await fetchJson(
          `${args.vfsUrl}/api/manifest-assets/by-name?name=${encodeURIComponent(`${gameId}.png`)}`,
        ),
        `VFS ${gameId}.png`,
      );
      const iconCandidates = requireArray(iconLookup.candidates, `${gameId}.png.candidates`)
        .map((value, index) => requireRecord(value, `${gameId}.png.candidates[${index}]`))
        .filter(value =>
          requireString(value.path, `${gameId}.png.path`).toLowerCase().includes('/monstericon/'),
        );
      if (iconCandidates.length > 1) {
        throw new Error(
          `${gameId}.png: expected at most one normal monster icon, got ${iconCandidates.length}`,
        );
      }
      return [
        gameId,
        {
          rank: parsed.rank,
          nativeValue: parsed.nativeValue,
          assetPath,
          assetIndex,
          rawSha256: createHash('sha256').update(raw).digest('hex'),
          modelKey: parsed.modelKey,
          componentCount: parsed.componentCount,
          ...(iconCandidates.length === 1
            ? { iconAssetPath: requireString(iconCandidates[0].path, `${gameId}.png.path`) }
            : {}),
        },
      ] as const;
    });

    const result = {
      format: 'EndaxisEnemyRankEvidence',
      manifestId,
      nativeValues: { '0': 'mob', '1': 'boss', '2': 'elite' },
      enemies: Object.fromEntries(entries),
    };
    await mkdir(resolve(args.output, '..'), { recursive: true });
    await writeFile(args.output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    return { enemyCount: entries.length, manifestId, output: args.output };
  } finally {
    await rm(runRoot, { recursive: true, force: true });
  }
}

async function downloadBundle(vfsUrl: string, recordId: number, runRoot: string): Promise<string> {
  const response = await fetchWithRetry(`${vfsUrl}/api/raw?id=${recordId}`);
  if (!response.ok) throw new Error(`VFS raw bundle ${recordId}: HTTP ${response.status}`);
  const output = join(runRoot, 'bundles', `${recordId}.ab`);
  await mkdir(join(runRoot, 'bundles'), { recursive: true });
  await writeFile(output, Buffer.from(await response.arrayBuffer()));
  return output;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetchWithRetry(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return response;
      lastError = new Error(`${url}: HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolvePromise => setTimeout(resolvePromise, attempt * 250));
  }
  throw new Error(`${url}: request failed after 4 attempts`, { cause: lastError });
}

async function mapConcurrent<T, R>(
  values: readonly T[],
  workers: number,
  run: (value: T) => Promise<R>,
): Promise<R[]> {
  const result = new Array<R>(values.length);
  let nextIndex = 0;
  await Promise.all(
    Array.from({ length: Math.min(workers, values.length) }, async () => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= values.length) return;
        result[index] = await run(values[index]);
      }
    }),
  );
  return result;
}

function readInt32(data: Buffer, offset: number): [number, number] {
  if (offset + 4 > data.length)
    throw new Error(`unexpected end of payload at 0x${offset.toString(16)}`);
  return [data.readInt32LE(offset), offset + 4];
}

function readInt64(data: Buffer, offset: number): [bigint, number] {
  if (offset + 8 > data.length)
    throw new Error(`unexpected end of payload at 0x${offset.toString(16)}`);
  return [data.readBigInt64LE(offset), offset + 8];
}

function readString(data: Buffer, offset: number): [string, number] {
  const [length, start] = readInt32(data, offset);
  if (length < 0 || start + length > data.length)
    throw new Error(`invalid string length ${length} at 0x${offset.toString(16)}`);
  return [data.toString('utf8', start, start + length), align4(start + length)];
}

function align4(value: number): number {
  return (value + 3) & ~3;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error(`${label}: expected object`);
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label}: expected array`);
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0)
    throw new Error(`${label}: expected non-empty string`);
  return value;
}

function requireInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value))
    throw new Error(`${label}: expected safe integer`);
  return value;
}

function parseArguments(values: readonly string[]): Arguments {
  const parsed = new Map<string, string>();
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith('--') || value === undefined || value.startsWith('--'))
      throw new Error('expected --key value arguments');
    parsed.set(key, value);
  }
  const tablesDirectory = resolve(parsed.get('--tables') ?? '');
  const unityWorker = resolve(parsed.get('--unity-worker') ?? '');
  const output = resolve(parsed.get('--output') ?? 'tmp/enemy-ranks.generated.json');
  const workers = Number(parsed.get('--workers') ?? 4);
  if (!isAbsolute(tablesDirectory) || !isAbsolute(unityWorker))
    throw new Error('--tables and --unity-worker are required');
  if (!Number.isInteger(workers) || workers <= 0)
    throw new Error('--workers must be a positive integer');
  return {
    tablesDirectory,
    unityWorker,
    output,
    workers,
    vfsUrl: (parsed.get('--vfs-url') ?? 'http://127.0.0.1:8765').replace(/\/$/, ''),
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  console.log(
    JSON.stringify(await extractEnemyRankEvidence(parseArguments(process.argv.slice(2)))),
  );
}
