import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectContingencyContractGlobalBuffIds,
  parseContingencyContractCatalogSource,
} from '../src/domains/mechanics/contingencyContractSource.ts';
import { writeAtomicBytes } from './downloadGameDataSources.ts';

/** 语言文件与行为定义分别生成；返回原生依赖供同批 GlobalBuff 闭包使用。 */
export async function generateContingencyContractLocales(args: {
  readonly tableRoot: string;
  readonly output: string;
  readonly check: boolean;
}) {
  const [tagSource, contracts] = await Promise.all([
    fs.readFile(path.join(args.tableRoot, 'CcTagTable.json'), 'utf8'),
    fs.readFile(path.join(args.tableRoot, 'ContingencyContractTable.json'), 'utf8'),
  ]);
  const catalog = parseContingencyContractCatalogSource(
    JSON.parse(tagSource.replace(/("id"\s*:\s*)(-?\d{16,})(?=\s*[,}])/g, '$1"$2"')),
    JSON.parse(contracts),
  );
  for (const [locale, tableName] of [
    ['zh', 'CN'],
    ['en', 'EN'],
  ] as const) {
    const texts: unknown = JSON.parse(
      await fs.readFile(path.join(args.tableRoot, `I18nTextTable_${tableName}.json`), 'utf8'),
    );
    if (texts === null || typeof texts !== 'object' || Array.isArray(texts))
      throw new Error(`${tableName}: expected text table`);
    const text = (id: string) => {
      const value = (texts as Record<string, unknown>)[id];
      if (typeof value !== 'string' || value.length === 0)
        throw new Error(`${tableName}: missing ${id}`);
      return value;
    };
    const entries = Object.fromEntries(
      catalog.tags.map(tag => [
        tag.tagId,
        {
          name: text(tag.nameTextId),
          description: text(tag.descriptionTextId),
        },
      ]),
    );
    const content = `${JSON.stringify(entries, null, 2)}\n`;
    const output = path.join(args.output, locale, 'contingency-contracts.json');
    if (args.check) {
      if ((await fs.readFile(output, 'utf8')).replaceAll('\r\n', '\n') !== content)
        throw new Error(`${output}: generated Contingency Contract locale is stale`);
    } else await writeAtomicBytes(output, new TextEncoder().encode(content));
  }
  return {
    contractCount: catalog.contracts.length,
    tagCount: catalog.tags.length,
    globalBuffIds: collectContingencyContractGlobalBuffIds(catalog),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const positional = args.filter(value => value !== '--check');
  if (positional.length !== 2)
    throw new Error('expected <table root> <locale output root> [--check]');
  console.log(
    await generateContingencyContractLocales({
      tableRoot: path.resolve(positional[0]!),
      output: path.resolve(positional[1]!),
      check,
    }),
  );
}
