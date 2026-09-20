import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  compileGameplayTagCatalogSource,
  parseGameplayTagConfigDumpSource,
  renderGameplayTagCatalogModule,
} from '../src/index.ts';
import { writeAtomicBytes } from './downloadGameDataSources.ts';
import { readGameplayTagConfigSetExport } from './readGameplayTagConfigSetExport.ts';

const EXPECTED_DUMP_SHA256 = '3758bb1f10764ce9d1bda9ef5200d77b3fe93ea59dbd0e09f196c18221019cf8';
const EXPECTED_SET_SHA256 = '5d6901da5e6139aafbc88f8c71de4de50563fbbb0db69c3de7f258ba92d4789a';
export async function generateGameplayTagCatalog(args: ReturnType<typeof parseArguments>) {
  const bytes = new Uint8Array(await fs.readFile(args.dump));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (
    sha256 !== (args.sourceSet ? EXPECTED_SET_SHA256 : EXPECTED_DUMP_SHA256) &&
    !args.allowNewSource
  ) {
    throw new Error(
      `unexpected GameplayTagConfig dump SHA-256 ${sha256}; ` +
        'audit the new source before passing --allow-new-source',
    );
  }
  const completeSet = args.sourceSet
    ? readGameplayTagConfigSetExport(args.dump, args.sourceRoot)
    : undefined;
  const catalog =
    completeSet?.catalog ??
    compileGameplayTagCatalogSource(parseGameplayTagConfigDumpSource(bytes, args.dump));
  const content = renderGameplayTagCatalogModule(catalog, sha256);
  if (args.check) {
    const existing = await fs.readFile(args.output, 'utf8');
    if (existing !== content) {
      throw new Error(`${args.output}: generated GameplayTag catalog is stale`);
    }
  } else {
    await writeAtomicBytes(args.output, new TextEncoder().encode(content));
  }
  return {
    pathCount: catalog.paths.length,
    sourceSha256: sha256,
    ...(completeSet
      ? {
          configCount: completeSet.configCount,
          emptyPathCount: completeSet.emptyPathCount,
          duplicatePathCount: completeSet.duplicatePathCount,
        }
      : {}),
  };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  console.log(await generateGameplayTagCatalog(parseArguments(process.argv.slice(2))));
}

function parseArguments(values: readonly string[]) {
  const positional: string[] = [];
  let allowNewSource = false;
  let check = false;
  let sourceSet = false;
  let sourceRoot: string | undefined;
  for (let index = 0; index < values.length; index++) {
    const value = values[index]!;
    if (value === '--allow-new-source') allowNewSource = true;
    else if (value === '--check') check = true;
    else if (value === '--source-set') sourceSet = true;
    else if (value === '--source-root') {
      sourceRoot = values[++index];
      if (!sourceRoot || sourceRoot.startsWith('--'))
        throw new Error('--source-root requires a directory');
    } else if (value.startsWith('--')) throw new Error(`unsupported argument ${value}`);
    else positional.push(value);
  }
  if (positional.length !== 2) {
    throw new Error(
      'expected <GameplayTagConfig dump or source-set.json> <output> [--source-set] [--check]',
    );
  }
  if (sourceRoot !== undefined && !sourceSet)
    throw new Error('--source-root requires --source-set');
  return {
    dump: path.resolve(positional[0]!),
    output: path.resolve(positional[1]!),
    allowNewSource,
    check,
    sourceSet,
    sourceRoot,
  };
}
