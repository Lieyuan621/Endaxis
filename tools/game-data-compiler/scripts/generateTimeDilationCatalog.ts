import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseTimeDilationCatalogDumpSource,
  renderTimeDilationCatalogModule,
} from '../src/source/timeDilationCatalogSource.ts';
import { writeAtomicBytes } from './downloadGameDataSources.ts';
import { formatGeneratedSource } from './formatGeneratedSource.ts';
import { readGameplayTagPaths } from './readGameplayTagPaths.ts';

export async function generateTimeDilationCatalog(args: {
  readonly sourceUrl: string;
  readonly gameplayTagCatalog: string;
  readonly output: string;
  readonly check: boolean;
}) {
  const response = await fetch(args.sourceUrl);
  if (!response.ok) throw new Error(`${args.sourceUrl}: HTTP ${response.status}`);
  const preview = (await response.json()) as {
    asset?: { Name?: unknown; Container?: unknown };
    text?: unknown;
  };
  if (
    preview.asset?.Name !== 'timedilationconfig' ||
    preview.asset.Container !==
      'assets/beyond/dynamicassets/gamedata/gameplayconfig/timedilationconfig.asset'
  )
    throw new Error(`${args.sourceUrl}: response is not the canonical TimeDilationConfig asset`);
  if (typeof preview.text !== 'string')
    throw new Error(`${args.sourceUrl}: missing TypeTree dump text`);
  const source = parseTimeDilationCatalogDumpSource(preview.text, args.sourceUrl);
  const content = await formatGeneratedSource(
    renderTimeDilationCatalogModule(source, readGameplayTagPaths(args.gameplayTagCatalog)),
    args.output,
  );
  if (args.check) {
    if ((await fs.readFile(args.output, 'utf8')).replaceAll('\r\n', '\n') !== content)
      throw new Error(`${args.output}: generated TimeDilation catalog is stale`);
  } else {
    await writeAtomicBytes(args.output, new TextEncoder().encode(content));
  }
  return {
    priorityCount: source.priorities.length,
    curveCount: Object.keys(source.curves).length,
    slotSpecialConfigCount: source.slotSpecialConfigs.length,
    sourceSha256: source.sha256,
  };
}

function parseArguments(values: readonly string[]) {
  let check = false;
  const positional: string[] = [];
  for (const value of values) {
    if (value === '--check') check = true;
    else if (value.startsWith('--')) throw new Error(`unsupported argument ${value}`);
    else positional.push(value);
  }
  if (positional.length !== 3)
    throw new Error('expected <VFS preview URL> <gameplay-tag-catalog> <output>');
  return {
    sourceUrl: positional[0]!,
    gameplayTagCatalog: path.resolve(positional[1]!),
    output: path.resolve(positional[2]!),
    check,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArguments(process.argv.slice(2));
  const result = await generateTimeDilationCatalog(args);
  process.stdout.write(
    `TimeDilation priorities: ${result.priorityCount}; curves: ${result.curveCount}; SHA-256: ${result.sourceSha256}\n`,
  );
}
