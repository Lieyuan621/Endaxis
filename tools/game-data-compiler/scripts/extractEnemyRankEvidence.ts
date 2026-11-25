import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { findEnemyIconPath, loadLocalImageSources } from './localImageSources.ts';
import { localResource, parseJson } from './gameDataProviders.ts';

const RANK_NAMES = ['mob', 'boss', 'elite'] as const;

interface Arguments {
  readonly tablesDirectory: string;
  readonly output: string;
  readonly localBase: string;
  readonly workers: number;
  readonly version?: string;
}

interface ParsedEnemyRank {
  readonly nativeValue: number;
  readonly rank: (typeof RANK_NAMES)[number];
  readonly modelKey: string;
  readonly componentCount: number;
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
    'EnemyTemplateDisplayInfoTable',
  );
  const ids = Object.keys(displayTable)
    .filter(id => id.startsWith('eny_'))
    .sort();
  if (!ids.length) throw new Error('EnemyTemplateDisplayInfoTable has no enemies');
  const images = await loadLocalImageSources(args.localBase);
  const entries = await mapConcurrent(ids, args.workers, async id => {
    const url = new URL('EnemyData/' + id + '.json', args.localBase.replace(/\/?$/, '/'));
    const resource = await localResource(
      args.localBase,
      'EnemyData/' + id + '.json',
      args.version ?? null,
    );
    const document = requireRecord(parseJson(resource.content), url.href);
    if (document.id !== id) throw new Error(url + ': enemy identity mismatch');
    const raw = Buffer.from(requireString(document.rawBase64, url + '.rawBase64'), 'base64');
    const parsed = parseEnemyTemplateRank(raw, id);
    const iconAssetPath = findEnemyIconPath(images, id);
    return [
      id,
      {
        ...parsed,
        ...(iconAssetPath === undefined ? {} : { iconAssetPath }),
        assetPath: requireString(document.container, url + '.container'),
        rawSha256: createHash('sha256').update(raw).digest('hex'),
      },
    ] as const;
  });
  const result = {
    format: 'EndaxisEnemyRankEvidence',
    nativeValues: { '0': 'mob', '1': 'boss', '2': 'elite' },
    enemies: Object.fromEntries(entries),
  };
  await mkdir(resolve(args.output, '..'), { recursive: true });
  await writeFile(args.output, JSON.stringify(result, null, 2) + '\n', 'utf8');
  return { enemyCount: entries.length, output: args.output };
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

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0)
    throw new Error(`${label}: expected non-empty string`);
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
  const output = resolve(parsed.get('--output') ?? 'tmp/enemy-ranks.generated.json');
  const workers = Number(parsed.get('--workers') ?? 4);
  if (!parsed.has('--tables')) throw new Error('--tables is required');
  if (!Number.isInteger(workers) || workers <= 0)
    throw new Error('--workers must be a positive integer');
  return {
    tablesDirectory,
    output,
    workers,
    ...(parsed.has('--version') ? { version: parsed.get('--version')! } : {}),
    localBase: (parsed.get('--local-base') ?? 'http://127.0.0.1:8766/api/data').replace(/\/$/, ''),
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  console.log(
    JSON.stringify(await extractEnemyRankEvidence(parseArguments(process.argv.slice(2)))),
  );
}
