import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { compileStandardStumpBuffClosure } from '../src/compiler/buffs/standardStumpBuffClosure.ts';
import { renderCommonBuffDefinitionsSource } from '../src/domains/operator/definitionSourceRenderer.ts';
import { compileConsumableCatalog } from '../src/domains/consumable/definition.ts';

interface Arguments {
  tableRoot: string;
  buffDataRoot: string;
  definitionOutput: string;
  buffOutput: string;
}

const read = (file: string): unknown => JSON.parse(fs.readFileSync(file, 'utf8'));

export async function generateConsumableDefinitions(
  args: Arguments,
): Promise<{ definitionCount: number; buffDefinitionCount: number }> {
  const useItems = read(path.join(args.tableRoot, 'UseItemTable.json'));
  const items = read(path.join(args.tableRoot, 'ItemTable.json')) as Record<string, any>;
  const catalog = compileConsumableCatalog(useItems, items);
  const ownerTargets = new Map(catalog.buffIds.map(id => [id, 'caster'] as const));
  const closure = compileStandardStumpBuffClosure(
    catalog.buffIds,
    (id: string) => read(path.join(args.buffDataRoot, `${id}.json`)),
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
  const prettier = (await resolveConfig(path.resolve('.prettierrc.json'))) ?? {};
  const definitionsSource = await format(
    `/** 由 UseItemTable、ItemTable 与 BuffData 生成；不要手工编辑。 */\n` +
      `import type { ConsumableDefinition } from '../../../../packages/game-data-contract/src/consumables';\n` +
      `export const consumableDefinitions = Object.freeze(${JSON.stringify(catalog.definitions, null, 2)}) as readonly ConsumableDefinition[];\n`,
    { ...prettier, parser: 'typescript' },
  );
  const buffSource = await format(
    renderCommonBuffDefinitionsSource(closure.definitions, 'consumableBuffDefinitions'),
    {
      ...prettier,
      parser: 'typescript',
    },
  );
  for (const [output, content] of [
    [args.definitionOutput, definitionsSource],
    [args.buffOutput, buffSource],
  ]) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, content, 'utf8');
  }
  return {
    definitionCount: catalog.definitions.length,
    buffDefinitionCount: Object.keys(closure.definitions).length,
  };
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
