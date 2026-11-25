import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { requireArray, requireNonEmptyString, requireRecord } from '../src/source/primitives.ts';
import { writeAtomicBytes, writeAtomicJson } from './downloadGameDataSources.ts';
import { localResource, parseJson } from './gameDataProviders.ts';
import { readGameplayTagConfigSetExport } from './readGameplayTagConfigSetExport.ts';

const ROOT = 'assets/beyond/dynamicassets/gamedata/gameplayconfig/';
const SET = ROOT + 'gameplaytagconfigset.asset';
const DIRECTORY = ROOT + 'gameplaytagconfig/';
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

export interface TagSetExportArguments {
  readonly output: string;
  readonly localBase: string;
  readonly cdn: string;
  readonly version: string;
}

export function inspectTagObject(value: unknown) {
  const row = requireRecord(value, 'tag object');
  const asset = requireRecord(row.asset, 'tag asset');
  const container = requireNonEmptyString(asset.Container, 'container');
  if (
    container !== SET &&
    !(
      container.startsWith(DIRECTORY) &&
      !container.slice(DIRECTORY.length).includes('/') &&
      container.endsWith('.asset')
    )
  )
    throw new Error('unexpected tag asset path');
  if (
    !Number.isSafeInteger(row.serializedByteCount) ||
    (row.serializedByteCount as number) <= 0 ||
    row.consumedByteCount !== row.serializedByteCount
  )
    throw new Error('incomplete tag TypeTree');
  const pathId = requireNonEmptyString(row.pathId, 'pathId');
  if (
    !/^-?[1-9][0-9]*$/.test(pathId) ||
    BigInt(pathId) < -(1n << 63n) ||
    BigInt(pathId) >= 1n << 63n
  )
    throw new Error('invalid Int64 pathId');
  return {
    container,
    sourceFile: requireNonEmptyString(row.sourceFile, 'sourceFile'),
    pathId,
    text: requireNonEmptyString(row.text, 'text'),
    dependencies: requireArray(row.dependencies, 'dependencies').map(x =>
      requireNonEmptyString(x, 'dependency'),
    ),
  };
}

/** Download the exported object identities and TypeTrees, then validate their PPtr/CAB closure. */
export async function exportGameplayTagConfigSet(args: TagSetExportArguments) {
  const output = path.resolve(args.output);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.mkdir(output);
  const inventory = await localResource(
    args.localBase,
    'GameplayTagData/manifest.json',
    args.version,
  );
  const entries = requireArray(parseJson(inventory.content), 'GameplayTagData manifest');
  const objects = [];
  const cabEntries = new Map<
    string,
    { cab: string; inputId: string; serializedFileOffset: number; dependencies: readonly string[] }
  >();
  for (const [index, entry] of entries.entries()) {
    const href = requireNonEmptyString(
      requireRecord(entry, 'manifest entry').contentFile,
      'contentFile',
    );
    const base = new URL(args.localBase);
    const url = new URL(href, base);
    if (
      url.origin !== base.origin ||
      !url.pathname.startsWith(base.pathname.replace(/\/$/, '') + '/GameplayTagData/')
    )
      throw new Error('unexpected tag resource URL');
    const file = url.pathname.split('/').at(-1)!;
    const resource = await localResource(args.localBase, 'GameplayTagData/' + file, args.version);
    const row = inspectTagObject(parseJson(resource.content));
    const relative = 'objects/' + index + '.txt';
    const bytes = new TextEncoder().encode(row.text);
    await writeAtomicBytes(path.join(output, relative), bytes);
    objects.push({
      container: row.container,
      sourceFile: row.sourceFile,
      pathId: row.pathId,
      complete: true,
      dump: { file: relative, sha256: sha256(bytes) },
    });
    if (cabEntries.has(row.sourceFile)) throw new Error('duplicate tag CAB identity');
    cabEntries.set(row.sourceFile, {
      cab: row.sourceFile,
      inputId: row.container,
      serializedFileOffset: 0,
      dependencies: row.dependencies,
    });
  }
  const sets = objects.filter(o => o.container === SET);
  if (sets.length !== 1) throw new Error('expected one GameplayTagConfigSet');
  const configs = objects.filter(o => o.container !== SET);
  if (!configs.length) throw new Error('empty GameplayTagConfig directory');
  const cabBytes = new TextEncoder().encode(
    JSON.stringify({ schemaVersion: 1, entries: [...cabEntries.values()] }),
  );
  await writeAtomicBytes(path.join(output, 'cab-map.json'), cabBytes);
  const manifestPath = path.join(output, 'source-set.json');
  await writeAtomicJson(manifestPath, {
    schemaVersion: 1,
    revision: args.version,
    configSet: sets[0],
    configs,
    cabMap: { file: 'cab-map.json', sha256: sha256(cabBytes) },
  });
  const compiled = readGameplayTagConfigSetExport(manifestPath);
  return {
    manifestPath,
    source: 'endaxis-data-tool',
    configCount: compiled.configCount,
    sourceSha256: compiled.sourceSha256,
    pathCount: compiled.catalog.paths.length,
  };
}
