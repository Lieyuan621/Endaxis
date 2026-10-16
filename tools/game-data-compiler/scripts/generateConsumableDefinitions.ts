import type { GraphSharedEntityValueUsage } from '../src/compiler/optimization/graphValueOptimization.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { compileStandardStumpBuffClosure } from '../src/compiler/buffs/standardStumpBuffClosure.ts';
import { renderCommonBuffDefinitionsSource } from '../src/domains/operator/definitionSourceRenderer.ts';
import { compileConsumableCatalog } from '../src/domains/consumable/definition.ts';
import { finalizeCommonBuffDefinitions } from '../src/compiler/finalizeDefinitions.ts';
import type { DefinitionOptimizationMode } from '../src/compiler/optimization/definitionOptimization.ts';
import {
  createNativeJsonEncodingReader,
  type NativeJsonEncodingSchema,
} from '../src/source/nativeJsonEncoding.ts';

interface Arguments {
  tableRoot: string;
  buffDataRoot: string;
  definitionOutput: string;
  buffOutput: string;
  nativeJsonEncoding?: NativeJsonEncodingSchema;
}

const read = (file: string): unknown => JSON.parse(fs.readFileSync(file, 'utf8'));

export function compileConsumableDefinitionsFromFiles(
  args: Pick<Arguments, 'tableRoot' | 'buffDataRoot' | 'nativeJsonEncoding'>,
) {
  const readNative = args.nativeJsonEncoding
    ? createNativeJsonEncodingReader(args.nativeJsonEncoding)
    : undefined;
  const useItems = read(path.join(args.tableRoot, 'UseItemTable.json'));
  const items = read(path.join(args.tableRoot, 'ItemTable.json'));
  const catalog = compileConsumableCatalog(useItems, items);
  const ownerTargets = new Map(catalog.buffIds.map(id => [id, 'caster'] as const));
  const closure = compileStandardStumpBuffClosure(
    catalog.buffIds,
    (id: string) => {
      const file = path.join(args.buffDataRoot, `${id}.json`);
      const value = read(file);
      return readNative ? readNative(value, 'Beyond.Gameplay.Core.BuffData', file) : value;
    },
    undefined,
    undefined,
    undefined,
    undefined,
    ownerTargets,
    new Set(catalog.buffIds),
    undefined,
    ownerTargets,
  );
  const blocked = closure.diagnostics.filter(item => item.status === 'blocked');
  if (blocked.length)
    throw new Error(`consumable Buff roots are blocked: ${JSON.stringify(blocked)}`);
  return { definitions: catalog.definitions, buffDefinitions: closure.definitions };
}

export async function renderConsumableDefinitionsFromCompiled(
  compiled: ReturnType<typeof compileConsumableDefinitionsFromFiles>,
  mode: DefinitionOptimizationMode = 'apply',
  sharedUsage?: GraphSharedEntityValueUsage,
) {
  const { definitions: buffDefinitions } = finalizeCommonBuffDefinitions(
    compiled.buffDefinitions,
    mode,
    sharedUsage,
  );
  const prettier = (await resolveConfig(path.resolve('.prettierrc.json'))) ?? {};
  const definitionsSource = await format(
    `/** 由 UseItemTable、ItemTable 与 BuffData 生成；不要手工编辑。 */\n` +
      `import type { ConsumableDefinition } from '../../../../packages/game-data-contract/src/consumables';\n` +
      `export const consumableDefinitions = Object.freeze(${JSON.stringify(compiled.definitions, null, 2)}) as readonly ConsumableDefinition[];\n`,
    { ...prettier, parser: 'typescript' },
  );
  const buffSource = await format(
    renderCommonBuffDefinitionsSource(buffDefinitions, 'consumableBuffDefinitions'),
    {
      ...prettier,
      parser: 'typescript',
    },
  );
  return {
    definitionFile: {
      relativePath: 'consumableDefinitions.generated.ts',
      content: definitionsSource,
    },
    buffFile: { relativePath: 'consumableBuffDefinitions.generated.ts', content: buffSource },
    summary: {
      definitionCount: compiled.definitions.length,
      buffDefinitionCount: Object.keys(compiled.buffDefinitions).length,
    },
  };
}

export async function generateConsumableDefinitions(args: Arguments) {
  const rendered = await renderConsumableDefinitionsFromCompiled(
    compileConsumableDefinitionsFromFiles(args),
  );
  for (const [output, content] of [
    [args.definitionOutput, rendered.definitionFile.content],
    [args.buffOutput, rendered.buffFile.content],
  ]) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, content, 'utf8');
  }
  return rendered.summary;
}

function parseArguments(argv: readonly string[]): Arguments {
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) values.set(argv[i]!, argv[i + 1]!);
  const required = (name: string) => {
    const value = values.get(name);
    if (!value) throw new Error(`missing ${name}`);
    return path.resolve(value);
  };
  return {
    tableRoot: required('--table-root'),
    buffDataRoot: required('--buff-data-root'),
    definitionOutput: required('--definition-output'),
    buffOutput: required('--buff-output'),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateConsumableDefinitions(parseArguments(process.argv.slice(2)));
}
