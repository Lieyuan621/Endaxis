import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectContingencyContractGlobalBuffIds,
  parseContingencyContractCatalogSource,
  parseContingencyContractLayoutSource,
} from '../src/domains/contingencyContract/contingencyContractSource.ts';
import { writeAtomicBytes } from './downloadGameDataSources.ts';
import { requireArray, requireNonEmptyString, requireRecord } from '../src/source/primitives.ts';

/** 语言文件与行为定义分别生成；返回原生依赖供同批 GlobalBuff 闭包使用。 */
export async function generateContingencyContractLocales(args: {
  readonly tableRoot: string;
  readonly output: string;
  readonly check: boolean;
  readonly supplement?: string;
}) {
  const [tagSource, contracts] = await Promise.all([
    fs.readFile(path.join(args.tableRoot, 'CcTagTable.json'), 'utf8'),
    fs.readFile(path.join(args.tableRoot, 'ContingencyContractTable.json'), 'utf8'),
  ]);
  const tags = JSON.parse(tagSource.replace(/("id"\s*:\s*)(-?\d{16,})(?=\s*[,}])/g, '$1"$2"'));
  const contractTable = JSON.parse(contracts);
  const catalog = parseContingencyContractLayoutSource(tags, contractTable);
  const supplement =
    args.supplement === undefined
      ? undefined
      : requireRecord(JSON.parse(await fs.readFile(args.supplement, 'utf8')), args.supplement);
  const supplementedTags = supplement ? requireRecord(supplement.tags, 'supplement.tags') : {};
  const supplementContract = supplement
    ? catalog.contracts.find(contract => contract.id === supplement.gameId)
    : undefined;
  if (supplement && !supplementContract) throw new Error(`unknown contract ${supplement.gameId}`);
  const supplementedIds = new Set(
    supplementContract?.columns.flatMap(column => column.entries.map(entry => entry.tagId)) ?? [],
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
      catalog.tags.flatMap(tag => {
        if (supplementedIds.has(tag.tagId)) {
          const published = supplementedTags[String(tag.tagId)];
          if (published === undefined) return [];
          const localized = requireRecord(
            requireRecord(published, String(tag.tagId)).text,
            `${tag.tagId}.text`,
          );
          const index = locale === 'zh' ? 0 : 1;
          return [
            [
              tag.tagId,
              {
                name: requireNonEmptyString(
                  requireArray(localized.name, 'name')[index],
                  `${tag.tagId}.${locale}.name`,
                ),
                description: requireNonEmptyString(
                  requireArray(localized.desc, 'desc')[index],
                  `${tag.tagId}.${locale}.desc`,
                ),
              },
            ],
          ];
        }
        return [
          [tag.tagId, { name: text(tag.nameTextId), description: text(tag.descriptionTextId) }],
        ];
      }),
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
    globalBuffIds: Object.values(requireRecord(tags, 'CcTagTable')).every(tag =>
      Object.hasOwn(requireRecord(tag, 'tag'), 'tagTerms'),
    )
      ? collectContingencyContractGlobalBuffIds(
          parseContingencyContractCatalogSource(tags, contractTable),
        )
      : [],
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const positional = args.filter(value => value !== '--check');
  if (positional.length < 2 || positional.length > 3)
    throw new Error('expected <table root> <locale output root> [contract supplement] [--check]');
  console.log(
    await generateContingencyContractLocales({
      tableRoot: path.resolve(positional[0]!),
      output: path.resolve(positional[1]!),
      ...(positional[2] ? { supplement: path.resolve(positional[2]) } : {}),
      check,
    }),
  );
}
