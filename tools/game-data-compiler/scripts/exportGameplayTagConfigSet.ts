import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { requireArray, requireNonEmptyString, requireRecord } from '../src/source/primitives.ts';
import { AkedbSnapshot } from './gameDataProviders.ts';
import { writeAtomicBytes, writeAtomicJson } from './downloadGameDataSources.ts';
import { readGameplayTagConfigSetExport } from './readGameplayTagConfigSetExport.ts';

const SET = 'assets/beyond/dynamicassets/gamedata/gameplayconfig/gameplaytagconfigset.asset';
const DIRECTORY = 'assets/beyond/dynamicassets/gamedata/gameplayconfig/gameplaytagconfig';
const runFile = promisify(execFile);
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

export interface TagSetExportArguments {
  readonly output: string;
  readonly vfsBase: string;
  readonly unityWorker: string;
  readonly cdn: string;
  readonly version: string;
}

/** 只编排 VFS 的现有通用导出协议，不解包 Unity、不复制旧 26 项成员名单。 */
export async function exportGameplayTagConfigSet(args: TagSetExportArguments) {
  const output = path.resolve(args.output);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.mkdir(output); // 必须独占新目录；不能覆盖以前的证据或正式产物。
  const worker = path.resolve(args.unityWorker);
  const base = new URL(args.vfsBase).origin;
  const akedb = await AkedbSnapshot.load(args.cdn, args.version);
  const available = [...akedb.assets.json.keys()].filter(key => /gameplaytagconfig/i.test(key));
  if (available.length) {
    throw new Error(
      `AKEDB now exposes tag configs; audit its representation before VFS fallback: ${available.join(', ')}`,
    );
  }
  const json = async (route: string) => {
    const response = await fetch(new URL(route, base), { signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`VFS ${route}: HTTP ${response.status}`);
    return requireRecord(await response.json(), route);
  };
  const directoryRoute = `/api/manifest-assets/in-directory?path=${encodeURIComponent(DIRECTORY)}`;
  const setRoute = '/api/manifest-assets/by-name?name=gameplaytagconfigset.asset';
  const discovery = { set: await json(setRoute), directory: await json(directoryRoute) };
  const assets = inspectTagSetDiscovery(discovery.set, discovery.directory);
  await writeAtomicJson(path.join(output, 'discovery.json'), discovery);

  let requestNumber = 0;
  async function invoke(operation: string, arguments_: Record<string, unknown>) {
    const requestId = `tag-set-${++requestNumber}`;
    const requestPath = path.join(output, `request-${requestNumber}.json`);
    await writeAtomicJson(requestPath, {
      protocolVersion: '1.0.0',
      requestId,
      operation,
      arguments: arguments_,
    });
    const command = worker.endsWith('.dll') ? 'dotnet' : worker;
    const prefix = worker.endsWith('.dll') ? [worker] : [];
    const { stdout } = await runFile(command, [...prefix, 'request', requestPath], {
      windowsHide: true,
      timeout: 180_000,
      maxBuffer: 16 * 1024 * 1024,
    });
    const response = requireRecord(JSON.parse(stdout), 'worker response');
    await writeAtomicJson(path.join(output, `response-${requestNumber}.json`), response);
    if (response.ok !== true || response.requestId !== requestId)
      throw new Error(`invalid worker response for ${operation}`);
    return requireRecord(response.result, `${operation}.result`);
  }
  const { stdout } = await runFile(
    worker.endsWith('.dll') ? 'dotnet' : worker,
    [...(worker.endsWith('.dll') ? [worker] : []), 'handshake'],
    { windowsHide: true, timeout: 30_000 },
  );
  const handshake = requireRecord(JSON.parse(stdout), 'handshake');
  const identity = requireRecord(handshake.result, 'handshake.result');
  const protocol = requireRecord(identity.protocol, 'handshake.protocol');
  const capabilities = requireArray(identity.capabilities, 'handshake.capabilities');
  if (
    handshake.ok !== true ||
    protocol.name !== 'vfs-unity-worker' ||
    protocol.version !== '1.0.0' ||
    !['exportMonoBehaviourTypeTreeDump', 'buildCabMap'].every(item => capabilities.includes(item))
  )
    throw new Error('incompatible VFS Unity worker');
  await writeAtomicJson(path.join(output, 'worker.json'), handshake);

  const inputs: { inputId: string; inputPath: string }[] = [];
  const objects = [];
  const bundles = [];
  // 单并发，避免大量 worker 同时加载 Bundle 导致桌面内存压力。
  for (const [index, asset] of assets.entries()) {
    const searchRoute = `/api/search?scope=effective&limit=500&q=${encodeURIComponent(asset.bundleName)}`;
    const search = await json(searchRoute);
    const rows = requireArray(search.items, 'search.items').map(item =>
      requireRecord(item, 'search item'),
    );
    if (rows.length >= 500) throw new Error('VFS bundle lookup may be truncated');
    const matches = rows.filter(
      item => item.path === `Bundle/Data/Bundles/Windows/${asset.bundleName}`,
    );
    if (matches.length !== 1 || !Number.isSafeInteger(matches[0]!.id))
      throw new Error(`expected one effective bundle for ${asset.path}`);
    const row = matches[0]!;
    const response = await fetch(new URL(`/api/raw?id=${row.id}`, base), {
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`bundle download failed: HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length !== row.length) throw new Error(`bundle byte count changed: ${asset.path}`);
    const inputPath = path.join(output, 'bundles', `${index}.ab`);
    await writeAtomicBytes(inputPath, bytes);
    inputs.push({ inputId: asset.path, inputPath });
    bundles.push({
      container: asset.path,
      bundleName: asset.bundleName,
      record: row,
      file: `bundles/${index}.ab`,
      sha256: sha256(bytes),
      byteLength: bytes.length,
    });
    const relativeDirectory = `dump-${index}`;
    const dumpRoot = path.join(output, relativeDirectory);
    const result = await invoke('exportMonoBehaviourTypeTreeDump', {
      inputPath,
      outputDirectory: dumpRoot,
      container: asset.path,
    });
    const artifact = inspectTagDumpArtifact(result, asset.path);
    const dump = await readExportFile(dumpRoot, artifact.relativePath, artifact.sha256);
    if (dump.length !== artifact.byteCount) throw new Error('dump byte count mismatch');
    objects.push({
      container: asset.path,
      sourceFile: artifact.sourceFile,
      pathId: artifact.pathId,
      complete: true,
      dump: { file: `${relativeDirectory}/${artifact.relativePath}`, sha256: artifact.sha256 },
    });
  }
  const cabRoot = path.join(output, 'cab-map');
  const cab = await invoke('buildCabMap', { inputs, outputDirectory: cabRoot });
  const artifacts = requireArray(cab.artifacts, 'CAB artifacts');
  if (cab.artifactCount !== 1 || artifacts.length !== 1)
    throw new Error('expected one CABMap artifact');
  const artifact = requireRecord(artifacts[0], 'CAB artifact');
  const cabFile = requireNonEmptyString(artifact.relativePath, 'CAB file');
  const cabHash = requireNonEmptyString(artifact.sha256, 'CAB sha256');
  await readExportFile(cabRoot, cabFile, cabHash);
  const manifestPath = path.join(output, 'source-set.json');
  await writeAtomicJson(manifestPath, {
    schemaVersion: 1,
    revision: `vfs-manifest-${discovery.set.manifestId}`,
    configSet: objects[0],
    configs: objects.slice(1),
    cabMap: { file: `cab-map/${cabFile}`, sha256: cabHash },
  });
  // 原有公共连接器按 PPtr + CAB + Int64 PathID 检查整套闭包；目录不能充当引用关系。
  const compiled = readGameplayTagConfigSetExport(manifestPath);
  const after = { set: await json(setRoute), directory: await json(directoryRoute) };
  if (JSON.stringify(after) !== JSON.stringify(discovery))
    throw new Error('VFS manifest changed during export');
  // 同时重新下载 Bundle 校验，避免更新过程中保留同一数据库/manifest ID 却更换底层字节。
  for (const bundle of bundles) {
    const response = await fetch(new URL(`/api/raw?id=${bundle.record.id}`, base), {
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok || sha256(new Uint8Array(await response.arrayBuffer())) !== bundle.sha256)
      throw new Error(`VFS bundle changed during export: ${bundle.container}`);
  }
  const provenance = {
    sourcePolicy: 'akedb-primary-vfs-fallback',
    fallbackReason: 'not-in-akedb-index',
    akedb: { version: akedb.version, revision: akedb.revision, evidence: akedb.evidence },
    vfs: { base, manifestId: discovery.set.manifestId, versionVerified: false },
    worker: identity,
    bundles,
    sourceSha256: compiled.sourceSha256,
    configCount: compiled.configCount,
    pathCount: compiled.catalog.paths.length,
    emptyPathCount: compiled.emptyPathCount,
    duplicatePathCount: compiled.duplicatePathCount,
  };
  await writeAtomicJson(path.join(output, 'provenance.json'), provenance);
  return { manifestPath, ...provenance };
}

export function inspectTagSetDiscovery(
  set: Record<string, unknown>,
  directory: Record<string, unknown>,
) {
  if (!Number.isSafeInteger(set.manifestId) || set.manifestId !== directory.manifestId)
    throw new Error('VFS manifest identities differ');
  const roots = requireArray(set.candidates, 'set.candidates')
    .map(value => requireRecord(value, 'set asset'))
    .filter(asset => asset.path === SET);
  if (roots.length !== 1) throw new Error('expected one exact GameplayTagConfigSet asset');
  const configs = requireArray(directory.assets, 'directory.assets').map(value =>
    requireRecord(value, 'config asset'),
  );
  if (!configs.length) throw new Error('empty GameplayTagConfig directory');
  const seen = new Set<string>();
  return [roots[0]!, ...configs].map((asset, index) => {
    const container = requireNonEmptyString(asset.path, 'asset.path');
    if (
      index > 0 &&
      (!container.startsWith(`${DIRECTORY}/`) ||
        container.slice(DIRECTORY.length + 1).includes('/') ||
        !container.endsWith('.asset'))
    )
      throw new Error(`unexpected tag config path: ${container}`);
    if (seen.has(container)) throw new Error(`duplicate tag config: ${container}`);
    seen.add(container);
    const bundleName = requireNonEmptyString(asset.bundleName, 'asset.bundleName');
    if (!/^main\/[a-zA-Z0-9_-]+\.ab$/.test(bundleName)) throw new Error('unexpected bundle name');
    return { path: container, bundleName };
  });
}

export function inspectTagDumpArtifact(result: Record<string, unknown>, container: string) {
  const artifacts = requireArray(result.artifacts, 'dump.artifacts');
  if (result.artifactCount !== 1 || artifacts.length !== 1)
    throw new Error('expected one exact tag object');
  const artifact = requireRecord(artifacts[0], 'dump artifact');
  if (
    artifact.container !== container ||
    artifact.complete !== true ||
    !Number.isSafeInteger(artifact.serializedByteCount) ||
    (artifact.serializedByteCount as number) <= 0 ||
    artifact.consumedByteCount !== artifact.serializedByteCount ||
    !Number.isSafeInteger(artifact.byteCount)
  )
    throw new Error('incomplete or mismatched tag TypeTree object');
  return {
    relativePath: requireNonEmptyString(artifact.relativePath, 'dump path'),
    sha256: requireNonEmptyString(artifact.sha256, 'dump sha256'),
    sourceFile: requireNonEmptyString(artifact.sourceFile, 'dump sourceFile'),
    pathId: requireNonEmptyString(artifact.pathId, 'dump pathId'),
    byteCount: artifact.byteCount,
  };
}

async function readExportFile(root: string, file: string, hash: string) {
  if (
    !/^[a-zA-Z0-9_./-]+$/.test(file) ||
    file.split('/').some(part => part === '..') ||
    path.isAbsolute(file)
  )
    throw new Error('unsafe worker artifact path');
  const resolved = path.resolve(root, file);
  if (path.resolve(await fs.realpath(resolved)) !== resolved)
    throw new Error('linked worker artifact');
  const bytes = await fs.readFile(resolved);
  if (!/^[a-f0-9]{64}$/.test(hash) || sha256(bytes) !== hash)
    throw new Error('worker artifact SHA-256 mismatch');
  return bytes;
}
