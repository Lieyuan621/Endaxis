import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { requireArray, requireRecord, requireNonEmptyString } from '../src/source/primitives.ts';
import { parseContingencyContractLayoutSource } from '../src/domains/contingencyContract/contingencyContractSource.ts';

const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const read = async (file: string) => JSON.parse(await fs.readFile(file, 'utf8'));
/** 原始表保持不变；补充文件单独冻结，派生表只供合约编译消费。 */
export async function prepareContractSources(
  tableRoot: string,
  output: string,
  cdn: string,
  localRoot?: string,
) {
  const raw = await fs.readFile(path.join(tableRoot, 'CcTagTable.json'), 'utf8');
  const tags = JSON.parse(raw.replace(/("id"\s*:\s*)(-?\d{16,})(?=\s*[,}])/g, '$1"$2"'));
  if (Object.values(tags).every(tag => Object.hasOwn(tag as object, 'tagTerms'))) return undefined;
  const contracts = await read(path.join(tableRoot, 'ContingencyContractTable.json'));
  const layout = parseContingencyContractLayoutSource(tags, contracts);
  await fs.mkdir(output, { recursive: true });
  const mergedTags = structuredClone(tags);
  const texts = {
    CN: await read(path.join(tableRoot, 'I18nTextTable_CN.json')),
    EN: await read(path.join(tableRoot, 'I18nTextTable_EN.json')),
  };
  const receipts: {
    gameId: string;
    file: string;
    source: string;
    sha256: string;
    byteLength: number;
  }[] = [];
  const periods: { gameId: string; tableRoot: string; supplement: string }[] = [];
  for (const contract of layout.contracts) {
    if (!/^[a-zA-Z0-9_-]+$/.test(contract.id)) throw new Error('Unsafe contract ID');
    const file = contract.id + '.json';
    const source = localRoot
      ? path.resolve(localRoot, file)
      : new URL('public/' + file, cdn.replace(/\/?$/, '/')).href;
    let bytes: Uint8Array;
    if (localRoot) bytes = await fs.readFile(source);
    else {
      const response = await fetch(source, {
        headers: { 'User-Agent': 'Endaxis-Next/1', Referer: 'https://akedata.wiki/' },
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`${source}: HTTP ${response.status}`);
      bytes = new Uint8Array(await response.arrayBuffer());
    }
    const supplement = JSON.parse(new TextDecoder('utf8', { fatal: true }).decode(bytes));
    if (
      supplement.schemaVersion !== 1 ||
      supplement.gameId !== contract.id ||
      !supplement.tags ||
      Array.isArray(supplement.tags)
    )
      throw new Error(`${source}: invalid contract supplement`);
    const tagIds = new Set(
      contract.columns.flatMap(column => column.entries.map(entry => String(entry.tagId))),
    );
    for (const id of Object.keys(supplement.tags))
      if (!tagIds.has(id) || !tags[id]) throw new Error(`${source}: unrelated tag ${id}`);
    for (const id of tagIds) {
      const record = supplement.tags[id];
      if (!record || typeof record !== 'object') throw new Error(`${source}: missing tag ${id}`);
      if (record.tagTerms !== undefined) mergedTags[id].tagTerms = record.tagTerms;
      for (const [language, index] of [
        ['CN', 0],
        ['EN', 1],
      ] as const)
        for (const field of ['name', 'desc']) {
          const text = record.text?.[field]?.[index];
          if (text !== undefined) {
            if (typeof text !== 'string' || !text)
              throw new Error(`${source}: invalid ${id}.${field}.${language}`);
            texts[language][String(tags[id][field].id)] = text;
          }
        }
    }
    const supplementFile = path.join(output, file);
    await fs.writeFile(supplementFile, bytes);
    receipts.push({
      gameId: contract.id,
      file,
      source,
      sha256: digest(bytes),
      byteLength: bytes.length,
    });
    const periodRoot = path.join(output, contract.id);
    await fs.mkdir(periodRoot, { recursive: true });
    await fs.writeFile(
      path.join(periodRoot, 'CcTagTable.json'),
      JSON.stringify(Object.fromEntries([...tagIds].map(id => [id, mergedTags[id]]))),
    );
    await fs.writeFile(
      path.join(periodRoot, 'ContingencyContractTable.json'),
      JSON.stringify({ [contract.id]: contracts[contract.id] }),
    );
    periods.push({
      gameId: contract.id,
      tableRoot: periodRoot,
      supplement: supplementFile,
    });
  }
  const localeRoot = path.join(output, 'locales');
  await fs.mkdir(localeRoot, { recursive: true });
  for (const [file, value] of Object.entries({
    'CcTagTable.json': mergedTags,
    'ContingencyContractTable.json': contracts,
    'I18nTextTable_CN.json': texts.CN,
    'I18nTextTable_EN.json': texts.EN,
  }))
    await fs.writeFile(path.join(localeRoot, file), JSON.stringify(value));
  await fs.writeFile(
    path.join(output, 'source-provenance.json'),
    JSON.stringify({ entries: receipts }, null, 2),
  );
  const globalBuffIds = [
    ...new Set(
      Object.entries(mergedTags).flatMap(([id, raw]) => {
        const tag = requireRecord(raw, `tag ${id}`);
        return requireArray(tag.tagTerms ?? [], `${id}.tagTerms`).flatMap(rawTerm => {
          const term = requireRecord(rawTerm, `${id}.term`);
          return term.termType === 2 ? [requireNonEmptyString(term.buffId, `${id}.buffId`)] : [];
        });
      }),
    ),
  ];
  return { localeRoot, periods, receipts, globalBuffIds };
}
export async function verifyContractSources(output: string) {
  const { entries } = await read(path.join(output, 'source-provenance.json'));
  for (const entry of entries) {
    const bytes = await fs.readFile(path.join(output, entry.file));
    if (digest(bytes) !== entry.sha256 || bytes.length !== entry.byteLength)
      throw new Error(`Contract source changed: ${entry.file}`);
  }
  return { verified: entries.length };
}
