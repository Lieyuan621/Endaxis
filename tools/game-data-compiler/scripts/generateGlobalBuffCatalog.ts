import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGlobalBuffDumpSource } from '../src/source/globalBuffDumpSource.ts';
import { parseGlobalBuffTemplateCatalogSource } from '../src/source/globalBuffTemplate.ts';
import { writeAtomicBytes } from './downloadGameDataSources.ts';

export async function generateGlobalBuffCatalog(args: {
  readonly vfsBase: string;
  readonly revision: string;
  readonly identities: string;
  readonly output: string;
  readonly check: boolean;
  readonly additionalIdentities?: readonly string[];
  /** 扫描已经取得的 BuffData，补齐动作图字面引用的 GlobalBuff 模板。 */
  readonly referenceDataRoot?: string;
  readonly tolerateUnsupportedAdditionalIdentities?: boolean;
}) {
  const idsValue: unknown = JSON.parse(await fs.readFile(args.identities, 'utf8'));
  if (!Array.isArray(idsValue) || idsValue.some(id => typeof id !== 'string' || id.length === 0))
    throw new Error(`${args.identities}: expected non-empty GlobalBuff ID array`);
  const configuredIds = idsValue as string[];
  const configuredIdSet = new Set(configuredIds);
  const referencedIds =
    args.referenceDataRoot === undefined
      ? []
      : await collectReferencedGlobalBuffIdsFromDirectory(args.referenceDataRoot);
  const ids = [
    ...new Set([...configuredIds, ...(args.additionalIdentities ?? []), ...referencedIds]),
  ].sort();
  if (new Set(configuredIds).size !== configuredIds.length)
    throw new Error(`${args.identities}: duplicate GlobalBuff ID`);
  const templates: Record<string, unknown> = {};
  const assets: { id: string; path: string; sourceUrl: string; sourceSha256: string }[] = [];
  const unsupportedAssets: { id: string; path: string; sourceUrl: string; reason: string }[] = [];
  for (const id of ids) {
    const expectedPath = `assets/beyond/dynamicassets/gameplay/globalbuff/${id}.asset`;
    const sourceUrl = await resolveNamedManifestAssetPreview(
      args.vfsBase,
      `${id}.asset`,
      expectedPath,
    );
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`${sourceUrl}: HTTP ${response.status}`);
    const preview = (await response.json()) as {
      asset?: { Name?: unknown; Container?: unknown };
      text?: unknown;
    };
    if (preview.asset?.Name !== id || preview.asset.Container !== expectedPath)
      throw new Error(`${sourceUrl}: response is not canonical GlobalBuff ${id}`);
    if (typeof preview.text !== 'string')
      throw new Error(`${sourceUrl}: missing TypeTree dump text`);
    let source;
    try {
      source = parseGlobalBuffDumpSource(preview.text, sourceUrl);
    } catch (error) {
      if (!args.tolerateUnsupportedAdditionalIdentities || configuredIdSet.has(id)) throw error;
      unsupportedAssets.push({
        id,
        path: expectedPath,
        sourceUrl,
        reason: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
    if (source.template.id !== id) throw new Error(`${sourceUrl}: GlobalBuff identity mismatch`);
    templates[id] = source.template;
    assets.push({ id, path: expectedPath, sourceUrl, sourceSha256: source.sha256 });
  }
  const catalog = {
    version: args.revision,
    evidence: { source: 'vfs-index-browser', assets, unsupportedAssets },
    templates,
  };
  // 写入前通过实际消费者解析，避免导出结构与整名转换输入漂移。
  parseGlobalBuffTemplateCatalogSource(catalog, args.output);
  const content = `${JSON.stringify(catalog, null, 2)}\n`;
  if (args.check) {
    if ((await fs.readFile(args.output, 'utf8')).replaceAll('\r\n', '\n') !== content)
      throw new Error(`${args.output}: generated GlobalBuff catalog is stale`);
  } else {
    await writeAtomicBytes(args.output, new TextEncoder().encode(content));
  }
  return {
    requestedCount: ids.length,
    referencedCount: referencedIds.length,
    templateCount: Object.keys(templates).length,
    assets,
    unsupportedAssets,
  };
}

/**
 * 只读取原生 GlobalBuffId 字段，不从任意字符串或文件名猜身份。一个 Buff 可以在
 * CreateGlobalBuffAction 与 FinishGlobalBuffAction 中引用未被顶层领域清单直接列出的模板。
 */
export function collectReferencedGlobalBuffIds(value: unknown): string[] {
  const result = new Set<string>();
  const visit = (current: unknown): void => {
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (current === null || typeof current !== 'object') return;
    const record = current as Record<string, unknown>;
    const addWrappedId = (candidate: unknown): void => {
      if (typeof candidate === 'string' && candidate.startsWith('global_buff_')) {
        result.add(candidate);
        return;
      }
      if (candidate !== null && typeof candidate === 'object') {
        const id = (candidate as Record<string, unknown>).id;
        if (typeof id === 'string' && id.startsWith('global_buff_')) result.add(id);
      }
    };
    if ('globalBuffId' in record) addWrappedId(record.globalBuffId);
    if (Array.isArray(record.globalBuffIds)) record.globalBuffIds.forEach(addWrappedId);
    Object.values(record).forEach(visit);
  };
  visit(value);
  return [...result].sort();
}

async function collectReferencedGlobalBuffIdsFromDirectory(root: string): Promise<string[]> {
  const result = new Set<string>();
  const entries = (await fs.readdir(root, { withFileTypes: true }))
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const value: unknown = JSON.parse(await fs.readFile(path.join(root, entry.name), 'utf8'));
    for (const id of collectReferencedGlobalBuffIds(value)) result.add(id);
  }
  return [...result].sort();
}

async function resolveNamedManifestAssetPreview(
  vfsBase: string,
  name: string,
  expectedPath: string,
) {
  const endpoint = new URL('/api/manifest-assets/by-name', vfsBase);
  endpoint.searchParams.set('name', name);
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}`);
  const document = (await response.json()) as {
    candidates?: readonly { path?: unknown; previewUrl?: unknown }[];
  };
  const matches = (document.candidates ?? []).filter(item => item.path === expectedPath);
  if (matches.length !== 1 || typeof matches[0]!.previewUrl !== 'string')
    throw new Error(`${endpoint}: expected exactly one ${expectedPath}`);
  return new URL(matches[0]!.previewUrl, vfsBase).href;
}

async function parseArguments(values: readonly string[]) {
  let check = false;
  let referenceDataRoot: string | undefined;
  let additionalCatalog: string | undefined;
  let tolerateUnsupportedAdditionalIdentities = false;
  const positional: string[] = [];
  for (const value of values) {
    if (value === '--check') check = true;
    else if (value === '--tolerate-unsupported-additional-identities') {
      tolerateUnsupportedAdditionalIdentities = true;
    } else if (value.startsWith('--reference-data-root=')) {
      referenceDataRoot = path.resolve(value.slice('--reference-data-root='.length));
    } else if (value.startsWith('--additional-catalog=')) {
      additionalCatalog = path.resolve(value.slice('--additional-catalog='.length));
    } else if (value.startsWith('--')) throw new Error(`unsupported argument ${value}`);
    else positional.push(value);
  }
  if (positional.length !== 4)
    throw new Error('expected <VFS base URL> <revision> <identity JSON> <output>');
  const output = path.resolve(positional[3]!);
  const temporaryRoot = path.resolve(import.meta.dirname, '../../../tmp');
  if (output === temporaryRoot || !output.startsWith(temporaryRoot + path.sep)) {
    throw new Error('GlobalBuff catalog is an intermediate; output must be under project tmp');
  }
  let additionalIdentities: string[] = [];
  if (additionalCatalog !== undefined) {
    const value: unknown = JSON.parse(await fs.readFile(additionalCatalog, 'utf8'));
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`${additionalCatalog}: expected a GlobalBuff catalog object`);
    }
    const templates = (value as Record<string, unknown>).templates;
    if (templates === null || typeof templates !== 'object' || Array.isArray(templates)) {
      throw new Error(`${additionalCatalog}.templates: expected an object`);
    }
    additionalIdentities = Object.keys(templates as Record<string, unknown>);
  }
  return {
    vfsBase: positional[0]!,
    revision: positional[1]!,
    identities: path.resolve(positional[2]!),
    output,
    check,
    tolerateUnsupportedAdditionalIdentities,
    ...(additionalIdentities.length === 0 ? {} : { additionalIdentities }),
    ...(referenceDataRoot === undefined ? {} : { referenceDataRoot }),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await generateGlobalBuffCatalog(await parseArguments(process.argv.slice(2)));
  process.stdout.write(`GlobalBuff templates: ${result.templateCount}\n`);
}
