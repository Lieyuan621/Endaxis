import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseHitStopCurveCatalogDumpSource,
  renderHitStopCurveCatalogModule,
} from '../src/source/hitStopCurveCatalog.ts';
import { writeAtomicBytes } from './downloadGameDataSources.ts';
import { formatGeneratedSource } from './formatGeneratedSource.ts';

export async function generateHitStopCurveCatalog(args: {
  readonly sourceUrl: string;
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
    preview.asset?.Name !== 'hitstopconfig' ||
    preview.asset.Container !==
      'assets/beyond/dynamicassets/gamedata/gameplayconfig/hitstopconfig.asset'
  )
    throw new Error(`${args.sourceUrl}: response is not the canonical HitStopConfig asset`);
  if (typeof preview.text !== 'string')
    throw new Error(`${args.sourceUrl}: missing TypeTree dump text`);
  const source = parseHitStopCurveCatalogDumpSource(preview.text, args.sourceUrl);
  const content = await formatGeneratedSource(renderHitStopCurveCatalogModule(source), args.output);
  if (args.check) {
    if ((await fs.readFile(args.output, 'utf8')).replaceAll('\r\n', '\n') !== content)
      throw new Error(`${args.output}: generated HitStop curve catalog is stale`);
  } else {
    await writeAtomicBytes(args.output, new TextEncoder().encode(content));
  }
  return { curveCount: Object.keys(source.curves).length, sourceSha256: source.sha256 };
}

function parseArguments(values: readonly string[]) {
  let check = false;
  const positional: string[] = [];
  for (const value of values) {
    if (value === '--check') check = true;
    else if (value.startsWith('--')) throw new Error(`unsupported argument ${value}`);
    else positional.push(value);
  }
  if (positional.length !== 2) throw new Error('expected <VFS preview URL> <output>');
  return { sourceUrl: positional[0]!, output: path.resolve(positional[1]!), check };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await generateHitStopCurveCatalog(parseArguments(process.argv.slice(2)));
  process.stdout.write(`HitStop curves: ${result.curveCount}; SHA-256: ${result.sourceSha256}\n`);
}
