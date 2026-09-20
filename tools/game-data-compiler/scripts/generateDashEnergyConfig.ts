import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseDashEnergyConfigSource,
  renderDashEnergyConfigModule,
} from '../src/source/dashEnergyConfigSource.ts';
import { writeAtomicBytes } from './downloadGameDataSources.ts';
import { formatGeneratedSource } from './formatGeneratedSource.ts';

export async function generateDashEnergyConfig(args: {
  readonly source: string;
  readonly output: string;
  readonly check: boolean;
}) {
  const raw = await fs.readFile(args.source, 'utf8');
  const source = parseDashEnergyConfigSource(JSON.parse(raw), args.source);
  const content = await formatGeneratedSource(renderDashEnergyConfigModule(source), args.output);
  if (args.check) {
    if ((await fs.readFile(args.output, 'utf8')).replaceAll('\r\n', '\n') !== content) {
      throw new Error(`${args.output}: generated Dash energy config is stale`);
    }
  } else {
    await writeAtomicBytes(args.output, new TextEncoder().encode(content));
  }
  return source;
}

function parseArguments(values: readonly string[]) {
  let check = false;
  const positional: string[] = [];
  for (const value of values) {
    if (value === '--check') check = true;
    else if (value.startsWith('--')) throw new Error(`unsupported argument ${value}`);
    else positional.push(value);
  }
  if (positional.length !== 2) throw new Error('expected <GlobalConst.json> <output>');
  return { source: path.resolve(positional[0]!), output: path.resolve(positional[1]!), check };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await generateDashEnergyConfig(parseArguments(process.argv.slice(2)));
  process.stdout.write(`Maximum Dash capacity (not account capacity): ${result.maximumCapacity}\n`);
}
