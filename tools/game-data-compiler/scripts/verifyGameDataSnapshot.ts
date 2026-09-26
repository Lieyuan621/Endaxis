import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runConcurrent, type GameDataSourceCatalog } from './downloadGameDataSources.ts';
import { requireArray, requireNonEmptyString, requireRecord } from '../src/source/primitives.ts';

/** 只核对输入身份/完整性，不据此声明 AKEDB 与 VFS 来自同一客户端版本。 */
export async function verifyGameDataSnapshot(root: string, catalog: GameDataSourceCatalog) {
  if ((await fs.lstat(root)).isSymbolicLink()) throw new Error('snapshot root is a link');
  const ledger = requireRecord(
    JSON.parse(await fs.readFile(path.join(root, 'source-provenance.json'), 'utf8')),
    'source-provenance',
  );
  if (ledger.schemaVersion !== 2 || ledger.mode !== 'hybrid') {
    throw new Error('rebuild requires a schemaVersion=2 hybrid snapshot (AKEDB primary)');
  }
  const akedb = requireRecord(ledger.akedb, 'source-provenance.akedb');
  const version = requireNonEmptyString(akedb.version, 'source-provenance.akedb.version');
  const byPath = new Map<string, { sha256: string; byteLength: number; provider: string }>();
  const entries = requireArray(ledger.entries, 'source-provenance.entries');
  const relativeFiles = new Map<string, string>();
  const destinations = new Set<string>();
  for (const value of entries) {
    const entry = requireRecord(value, 'source-provenance.entries[]');
    const logicalPath = requireNonEmptyString(entry.logicalPath, 'entry.logicalPath');
    // A logical name is not an arbitrary filesystem path (also rejects Windows drive/ADS syntax).
    if (
      !/^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+\.json$/.test(logicalPath) ||
      logicalPath.includes('..')
    ) {
      throw new Error(`unsafe source logical path: ${logicalPath}`);
    }
    const [collection, file] = logicalPath.split('/') as [string, string];
    const directory =
      collection === 'TableCfg-current' ? 'TableCfg-current' : catalog.jsonCollections[collection];
    const isTable =
      collection === 'TableCfg-current' && catalog.tableCfg.includes(file.slice(0, -5));
    if (!isTable && directory === undefined && !catalog.jsonFiles.includes(logicalPath)) {
      throw new Error(`undeclared source: ${logicalPath}`);
    }
    if (collection === 'TableCfg-current' && !isTable) {
      throw new Error(`undeclared table: ${logicalPath}`);
    }
    if (byPath.has(logicalPath)) throw new Error(`duplicate source: ${logicalPath}`);
    const hash = requireNonEmptyString(entry.sha256, `${logicalPath}.sha256`);
    if (
      !/^[a-f0-9]{64}$/.test(hash) ||
      !Number.isSafeInteger(entry.byteLength) ||
      (entry.byteLength as number) < 0
    ) {
      throw new Error(`invalid source integrity record: ${logicalPath}`);
    }
    if (entry.provider !== 'akedb' && entry.provider !== 'vfs-index-browser') {
      throw new Error(`unknown source provider: ${logicalPath}`);
    }
    if (collection === 'BuffData' && entry.provider !== 'akedb') {
      throw new Error(`BuffData must come from AKEDB: ${logicalPath}`);
    }
    if (
      entry.provider === 'vfs-index-browser' &&
      entry.fallbackReason !== 'not-in-akedb-index' &&
      entry.fallbackReason !== 'akedb-http-404' &&
      entry.fallbackReason !== 'akedb-missing-required-field'
    ) {
      throw new Error(`VFS source lacks a hybrid fallback reason: ${logicalPath}`);
    }
    const relativeFile = directory ? `${directory}/${file}` : logicalPath;
    if (destinations.has(relativeFile)) {
      throw new Error(`duplicate source destination: ${relativeFile}`);
    }
    relativeFiles.set(logicalPath, relativeFile);
    destinations.add(relativeFile);
    byPath.set(logicalPath, {
      sha256: hash,
      byteLength: entry.byteLength as number,
      provider: entry.provider,
    });
  }
  const actualFiles: string[] = [];
  async function walk(directory: string, prefix: string) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      if (entry.isSymbolicLink()) throw new Error(`snapshot contains a link: ${relative}`);
      if (entry.isDirectory()) await walk(path.join(directory, entry.name), relative + '/');
      else if (relative !== 'source-provenance.json') actualFiles.push(relative);
    }
  }
  await walk(root, '');
  if (JSON.stringify(actualFiles.sort()) !== JSON.stringify([...relativeFiles.values()].sort())) {
    throw new Error('snapshot file set differs from provenance (missing or unrecorded files)');
  }
  await runConcurrent([...byPath], 6, async ([logicalPath, entry]) => {
    const bytes = await fs.readFile(path.join(root, relativeFiles.get(logicalPath)!));
    if (bytes.byteLength !== entry.byteLength || sha256(bytes) !== entry.sha256) {
      throw new Error(`source integrity mismatch: ${logicalPath}`);
    }
    JSON.parse(bytes.toString('utf8'));
  });
  const ordered = [...byPath].sort(([a], [b]) => a.localeCompare(b));
  const snapshotSha256 = sha256(
    ordered.map(([name, entry]) => `${name}\0${entry.sha256}\n`).join(''),
  );
  if (snapshotSha256 !== ledger.snapshotSha256) throw new Error('source snapshot hash mismatch');
  const missingInputs = [
    ...catalog.tableCfg.map(name => `TableCfg-current/${name}.json`),
    ...catalog.jsonFiles,
  ].filter(name => !byPath.has(name));
  const inventories = requireArray(ledger.inventories, 'source-provenance.inventories');
  for (const collection of Object.keys(catalog.jsonCollections)) {
    const matches = inventories
      .map(value => requireRecord(value, 'inventory'))
      .filter(value => value.collection === collection);
    if (matches.length > 1) throw new Error(`duplicate collection inventory: ${collection}`);
    const count = [...byPath.keys()].filter(name => name.startsWith(collection + '/')).length;
    const inventory = matches[0];
    if (inventory && inventory.files !== count)
      throw new Error(`collection inventory count mismatch: ${collection}`);
    if (!inventory || count === 0) missingInputs.push(`${collection}/<inventory>`);
    else if (collection !== 'BuffData' && inventory.vfs !== 'available')
      missingInputs.push(`${collection}/<VFS inventory unavailable>`);
  }
  return {
    version,
    snapshotSha256,
    resourceCount: byPath.size,
    providerCounts: {
      akedb: ordered.filter(([, entry]) => entry.provider === 'akedb').length,
      vfs: ordered.filter(([, entry]) => entry.provider === 'vfs-index-browser').length,
    },
    vfsVersionVerified: false as const,
    missingInputs,
    logicalPaths: [...byPath.keys()].sort(),
  };
}

function sha256(bytes: string | Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}
