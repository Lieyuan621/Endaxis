import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  requireArray,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from '../src/source/primitives.ts';
import {
  parseGameplayTagConfigDumpSource,
  parseGameplayTagConfigSetDumpSource,
} from '../src/source/gameplayTagConfigDump.ts';
import { compileGameplayTagConfigSetSource } from '../src/compiler/catalogs/gameplayTagCatalog.ts';

/**
 * 读取配置集导出清单 v1。它只包装 VFS worker 的原始 dump、CABMap、对象身份和校验和，
 * 不复制 Unity 解包器；相对文件必须在指定来源目录内（默认清单目录），缺件、半截导出或哈希变化均阻断。
 */
export function readGameplayTagConfigSetExport(manifestPath: string, sourceRoot?: string) {
  const root =
    sourceRoot === undefined ? path.dirname(path.resolve(manifestPath)) : path.resolve(sourceRoot);
  if (path.resolve(fs.realpathSync(root)) !== root)
    throw new Error('source directory contains a link');
  const manifestBytes = fs.readFileSync(manifestPath);
  const manifest = requireRecord(JSON.parse(manifestBytes.toString('utf8')), manifestPath);
  requireExactFields(
    manifest,
    new Set(['schemaVersion', 'revision', 'configSet', 'configs', 'cabMap']),
    manifestPath,
  );
  if (manifest.schemaVersion !== 1)
    throw new Error(`${manifestPath}: unsupported export schemaVersion`);
  const revision = requireNonEmptyString(manifest.revision, `${manifestPath}.revision`);

  function readCheckedFile(value: unknown, label: string) {
    const record = requireRecord(value, label);
    requireExactFields(record, new Set(['file', 'sha256']), label);
    const file = requireNonEmptyString(record.file, `${label}.file`);
    const expected = requireNonEmptyString(record.sha256, `${label}.sha256`);
    const resolved = path.resolve(root, file);
    const relative = path.relative(root, resolved);
    if (
      !/^[a-zA-Z0-9_./-]+$/.test(file) ||
      path.isAbsolute(file) ||
      relative === '..' ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    ) {
      throw new Error(`${label}: export file escapes source directory`);
    }
    if (path.resolve(fs.realpathSync(resolved)) !== resolved)
      throw new Error(`${label}: export file contains a link`);
    const bytes = fs.readFileSync(resolved);
    if (
      !/^[0-9a-f]{64}$/.test(expected) ||
      createHash('sha256').update(bytes).digest('hex') !== expected
    ) {
      throw new Error(`${label}: source SHA-256 mismatch`);
    }
    return bytes;
  }

  function readObject(value: unknown, label: string) {
    const record = requireRecord(value, label);
    requireExactFields(
      record,
      new Set(['container', 'sourceFile', 'pathId', 'complete', 'dump']),
      label,
    );
    if (record.complete !== true) throw new Error(`${label}: incomplete TypeTree export`);
    const container = requireNonEmptyString(record.container, `${label}.container`);
    const sourceFile = requireNonEmptyString(record.sourceFile, `${label}.sourceFile`);
    const pathId = requireNonEmptyString(record.pathId, `${label}.pathId`);
    if (
      !/^-?[1-9][0-9]*$/.test(pathId) ||
      BigInt(pathId) < -(1n << 63n) ||
      BigInt(pathId) >= 1n << 63n
    ) {
      throw new Error(`${label}: expected nonzero Int64 pathId string`);
    }
    return { container, sourceFile, pathId, bytes: readCheckedFile(record.dump, `${label}.dump`) };
  }

  const configSet = readObject(manifest.configSet, 'configSet');
  const configs = requireArray(manifest.configs, 'configs').map((value, index) =>
    readObject(value, `configs[${index}]`),
  );
  const cabMap = requireRecord(
    JSON.parse(readCheckedFile(manifest.cabMap, 'cabMap').toString('utf8')),
    'cabMap',
  );
  requireExactFields(cabMap, new Set(['schemaVersion', 'entries']), 'cabMap');
  if (cabMap.schemaVersion !== 1) throw new Error('cabMap: unsupported schemaVersion');
  const cabEntries = new Map<string, { inputId: string; dependencies: readonly string[] }>();
  for (const [index, value] of requireArray(cabMap.entries, 'cabMap.entries').entries()) {
    const label = `cabMap.entries[${index}]`;
    const row = requireRecord(value, label);
    requireExactFields(
      row,
      new Set(['cab', 'inputId', 'serializedFileOffset', 'dependencies']),
      label,
    );
    const cab = requireNonEmptyString(row.cab, `${label}.cab`);
    if (
      typeof row.serializedFileOffset !== 'number' ||
      !Number.isSafeInteger(row.serializedFileOffset) ||
      row.serializedFileOffset < 0
    ) {
      throw new Error(`${label}: invalid serializedFileOffset`);
    }
    const inputId = requireNonEmptyString(row.inputId, `${label}.inputId`);
    const dependencies = requireArray(row.dependencies, `${label}.dependencies`).map((value, i) =>
      requireNonEmptyString(value, `${label}.dependencies[${i}]`),
    );
    if (cabEntries.has(cab)) throw new Error(`${label}: duplicate CAB identity`);
    cabEntries.set(cab, { inputId, dependencies });
  }
  for (const object of [configSet, ...configs]) {
    if (cabEntries.get(object.sourceFile)?.inputId !== object.container) {
      throw new Error(`${object.container}: object sourceFile does not match CABMap inputId`);
    }
  }
  const result = compileGameplayTagConfigSetSource(
    parseGameplayTagConfigSetDumpSource(configSet.bytes, configSet.container),
    configSet.sourceFile,
    cabEntries.get(configSet.sourceFile)!.dependencies,
    configs.map(object => ({
      sourceFile: object.sourceFile,
      pathId: object.pathId,
      source: parseGameplayTagConfigDumpSource(object.bytes, object.container),
    })),
  );
  return {
    ...result,
    revision,
    sourceSha256: createHash('sha256').update(manifestBytes).digest('hex'),
  };
}
