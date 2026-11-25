/** 全套游戏资源生成入口；参数与流程说明见 rebuildFromInstalledGame.ts 的文件注释。 */
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { requireNonEmptyString, requireRecord } from '../src/source/primitives.ts';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../..');
const REQUIRED_RUNTIME = [
  'GameAssembly.dll',
  'UnityPlayer.dll',
  'baselib.dll',
  'Endfield.exe',
  'Endfield_Data/il2cpp_data/Metadata/global-metadata.dat',
  'Endfield_Data/il2cpp_data/Resources/mscorlib.dll-resources.dat',
  'Endfield_Data/il2cpp_data/Resources/System.Data.dll-resources.dat',
];

export interface LocalRebuildConfig {
  readonly version: string;
  readonly python: string;
  readonly akeToolRoot: string;
  readonly vfsRoot: string;
  readonly runtimeRoot?: string;
  readonly keyFile?: string;
  readonly jsonRoot: string;
  readonly tableRoot: string;
  readonly imageRoot: string;
  readonly nativeJsonSchema?: string;
  readonly contractValuesRoot?: string;
  readonly sourceMode: 'local-only' | 'hybrid';
  readonly workers: number;
}

/** 路径相对于配置文件；拼写错误和互斥输入在启动原生进程前报出。 */
export function parseLocalRebuildConfig(value: unknown, file: string): LocalRebuildConfig {
  const data = requireRecord(value, file);
  const allowed = new Set([
    'version',
    'python',
    'akeToolRoot',
    'vfsRoot',
    'runtimeRoot',
    'keyFile',
    'jsonRoot',
    'tableRoot',
    'imageRoot',
    'nativeJsonSchema',
    'contractValuesRoot',
    'sourceMode',
    'workers',
  ]);
  for (const key of Object.keys(data))
    if (!allowed.has(key)) throw new Error(`${file}: unknown field ${key}`);
  const text = (key: string) => requireNonEmptyString(data[key], `${file}.${key}`);
  const resolve = (key: string) => path.resolve(path.dirname(file), text(key));
  if ((data.runtimeRoot === undefined) === (data.keyFile === undefined))
    throw new Error(`${file}: specify exactly one of runtimeRoot and keyFile`);
  const sourceMode = data.sourceMode ?? 'local-only';
  if (sourceMode !== 'local-only' && sourceMode !== 'hybrid') throw new Error('invalid sourceMode');
  const workers = data.workers ?? 2;
  if (typeof workers !== 'number' || !Number.isInteger(workers) || workers < 1)
    throw new Error('workers must be a positive integer');
  const python = text('python');
  return {
    version: text('version'),
    python: /[\\/]/.test(python) ? resolve('python') : python,
    akeToolRoot: resolve('akeToolRoot'),
    vfsRoot: resolve('vfsRoot'),
    jsonRoot: resolve('jsonRoot'),
    tableRoot: resolve('tableRoot'),
    imageRoot: resolve('imageRoot'),
    ...(data.runtimeRoot === undefined ? {} : { runtimeRoot: resolve('runtimeRoot') }),
    ...(data.keyFile === undefined ? {} : { keyFile: resolve('keyFile') }),
    ...(data.nativeJsonSchema === undefined
      ? {}
      : { nativeJsonSchema: resolve('nativeJsonSchema') }),
    ...(data.contractValuesRoot === undefined
      ? {}
      : { contractValuesRoot: resolve('contractValuesRoot') }),
    sourceMode,
    workers,
  };
}

async function requirePath(file: string, directory = false) {
  const stat = await fs.stat(file).catch(() => undefined);
  if (!stat || (directory ? !stat.isDirectory() : !stat.isFile() || stat.size === 0))
    throw new Error(`Missing ${directory ? 'directory' : 'file'}: ${file}`);
}

export async function hasExportedFile(
  root: string,
  extensions: readonly string[],
): Promise<boolean> {
  for await (const entry of await fs.opendir(root)) {
    if (entry.isFile() && extensions.includes(path.extname(entry.name).toLowerCase())) return true;
    if (entry.isDirectory() && (await hasExportedFile(path.join(root, entry.name), extensions)))
      return true;
  }
  return false;
}

async function command(executable: string, args: string[], signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<number>((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      signal,
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });
    child.once('error', reject);
    child.once('exit', (code, exitSignal) => {
      if (code === null) reject(new Error(`Process terminated: ${exitSignal}`));
      else resolve(code);
    });
  });
}

export async function checkLocalRebuildInputs(config: LocalRebuildConfig, signal: AbortSignal) {
  await requirePath(path.join(PROJECT_ROOT, 'node_modules'), true);
  for (const root of [
    config.akeToolRoot,
    config.vfsRoot,
    config.jsonRoot,
    config.tableRoot,
    config.imageRoot,
  ])
    await requirePath(root, true);
  await requirePath(path.join(config.akeToolRoot, 'ake_tool/json_host/vfs.py'));
  if (config.runtimeRoot) {
    await requirePath(path.join(config.akeToolRoot, 'ake_tool/json_host/runtime.py'));
    for (const file of REQUIRED_RUNTIME) await requirePath(path.join(config.runtimeRoot, file));
  }
  if (config.keyFile) await requirePath(config.keyFile);
  if (config.nativeJsonSchema) await requirePath(config.nativeJsonSchema);
  if (config.contractValuesRoot) await requirePath(config.contractValuesRoot, true);
  const catalog = JSON.parse(
    await fs.readFile(
      path.join(PROJECT_ROOT, 'tools/game-data-compiler/game-data-sources.json'),
      'utf8',
    ),
  ) as {
    tableCfg: string[];
    jsonFiles: string[];
  };
  for (const table of catalog.tableCfg)
    await requirePath(path.join(config.tableRoot, table + '.json'));
  for (const collection of ['SkillData', 'BuffData', 'SpawnerConfig']) {
    const directory = path.join(config.jsonRoot, collection);
    await requirePath(directory, true);
    if (!(await hasExportedFile(directory, ['.json'])))
      throw new Error(`Empty collection: ${directory}`);
  }
  for (const file of catalog.jsonFiles) await requirePath(path.join(config.jsonRoot, file));
  const vfs = (await fs
    .stat(path.join(config.vfsRoot, 'VFS'))
    .then(stat => stat.isDirectory())
    .catch(() => false))
    ? path.join(config.vfsRoot, 'VFS')
    : config.vfsRoot;
  for (const block of ['7064D8E2', '0CE8FA57', '1CDDBF1F'])
    await requirePath(path.join(vfs, block, block + '.blc'));
  if (!(await hasExportedFile(config.imageRoot, ['.png', '.webp', '.jpg', '.jpeg'])))
    throw new Error(`No exported images: ${config.imageRoot}`);
  if (
    (await command(
      config.python,
      [
        '-c',
        'import sys; sys.path.insert(0, sys.argv[1]); import endaxis_data_tool; import endaxis_data_tool.extract; import ake_tool.json_host.vfs',
        config.akeToolRoot,
      ],
      signal,
    )) !== 0
  )
    throw new Error('Python dependency check failed');
}

/** 只接受此子进程在成功绑定端口后给出的地址，避免误用已有来源服务。 */
export function sourceServiceAddress(line: string, version: string): string | undefined {
  const prefix = 'ENDAXIS_SOURCE_READY ';
  if (!line.startsWith(prefix)) return;
  const value = JSON.parse(line.slice(prefix.length)) as { port: unknown; version: unknown };
  if (
    value.version !== version ||
    typeof value.port !== 'number' ||
    !Number.isInteger(value.port) ||
    value.port < 1 ||
    value.port > 65535
  )
    throw new Error('Invalid source service identity');
  return `http://127.0.0.1:${value.port}/api/data`;
}

function waitForService(child: ChildProcess, version: string): Promise<string> {
  const lines = createInterface({ input: child.stdout! });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('Source service startup timed out')), 30_000);
    const onError = (error: Error) => finish(error);
    const onExit = () => finish(new Error('Source service exited before becoming ready'));
    const finish = (error?: Error, address?: string) => {
      clearTimeout(timer);
      lines.close();
      child.off('error', onError);
      child.off('exit', onExit);
      if (error) reject(error);
      else resolve(address!);
    };
    lines.on('line', line => {
      try {
        const address = sourceServiceAddress(line, version);
        if (address) finish(undefined, address);
      } catch (error) {
        finish(error as Error);
      }
    });
    child.once('error', onError);
    child.once('exit', onExit);
  });
}

async function stopService(child: ChildProcess) {
  if (child.pid === undefined || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise<void>(resolve => {
    const timer = setTimeout(() => child.kill('SIGKILL'), 5_000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill();
  });
}

export async function rebuildLocalGameData(
  config: LocalRebuildConfig,
  publish: boolean,
  signal: AbortSignal,
) {
  await checkLocalRebuildInputs(config, signal);
  const parent = path.join(PROJECT_ROOT, 'tmp/local-game-data');
  await fs.mkdir(parent, { recursive: true });
  const run = await fs.mkdtemp(path.join(parent, 'run-'));
  console.log(`Local preparation: ${run}`);
  const bundles = path.join(run, 'bundles'),
    objects = path.join(run, 'objects'),
    snapshot = path.join(run, 'snapshot');
  for (const args of [
    [
      'prepare',
      '--ake-tool-root',
      config.akeToolRoot,
      '--vfs-root',
      config.vfsRoot,
      '--version',
      config.version,
      ...(config.runtimeRoot
        ? ['--runtime-root', config.runtimeRoot]
        : ['--key-file', config.keyFile!]),
      '--output',
      bundles,
    ],
    ['extract', '--input', bundles, '--version', config.version, '--output', objects],
    ['export', '--manifest', path.join(objects, 'raw-manifest.json'), '--output', snapshot],
  ]) {
    console.log(`Supplemental ${args[0]}`);
    if ((await command(config.python, ['-m', 'endaxis_data_tool', ...args], signal)) !== 0)
      throw new Error(`Supplemental ${args[0]} failed; retained outputs: ${run}`);
  }
  signal.throwIfAborted();
  const log = createWriteStream(path.join(run, 'source-service.log'));
  const service = spawn(
    config.python,
    [
      '-m',
      'endaxis_data_tool',
      'serve',
      '--port',
      '0',
      '--json-root',
      config.jsonRoot,
      '--table-root',
      config.tableRoot,
      '--image-root',
      config.imageRoot,
      '--supplemental-root',
      snapshot,
      '--version',
      config.version,
    ],
    {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    },
  );
  service.stderr!.pipe(log);
  const onAbort = () => service.kill();
  signal.addEventListener('abort', onAbort, { once: true });
  try {
    const localBase = await waitForService(service, config.version);
    signal.throwIfAborted();
    const code = await command(
      process.execPath,
      [
        '--experimental-strip-types',
        path.join(PROJECT_ROOT, 'tools/game-data-compiler/scripts/rebuildGameData.ts'),
        '--version',
        config.version,
        '--local-base',
        localBase,
        '--source-mode',
        config.sourceMode,
        '--workers',
        String(config.workers),
        ...(config.nativeJsonSchema ? ['--native-json-schema', config.nativeJsonSchema] : []),
        ...(config.contractValuesRoot ? ['--contract-values-root', config.contractValuesRoot] : []),
        ...(publish ? ['--publish'] : []),
      ],
      signal,
    );
    if (code !== 0 && code !== 2) throw new Error(`Game data rebuild failed; source log: ${run}`);
    return code;
  } finally {
    signal.removeEventListener('abort', onAbort);
    await stopService(service);
    log.end();
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.once('SIGINT', cancel);
  process.once('SIGTERM', cancel);
  try {
    if (args[0] !== '--config') {
      const { rebuildFromInstalledGame } = await import('./rebuildFromInstalledGame.ts');
      process.exitCode = await rebuildFromInstalledGame(
        args,
        controller.signal,
        (inputs, file, publish, signal) =>
          rebuildLocalGameData(parseLocalRebuildConfig(inputs, file), publish, signal),
      );
    } else {
      const file = args[0] === '--config' && args[1] ? path.resolve(args[1]) : undefined;
      if (
        !file ||
        args.slice(2).some(flag => !['--publish', '--check-inputs'].includes(flag)) ||
        new Set(args.slice(2)).size !== args.slice(2).length ||
        (args.includes('--publish') && args.includes('--check-inputs'))
      )
        throw new Error('Usage: --config <file.json> [--check-inputs | --publish]');
      const config = parseLocalRebuildConfig(JSON.parse(await fs.readFile(file, 'utf8')), file);
      if (args.includes('--check-inputs')) {
        await checkLocalRebuildInputs(config, controller.signal);
        console.log(
          'Local inputs and Python imports passed; native initialization and generation were not executed.',
        );
      } else
        process.exitCode = await rebuildLocalGameData(
          config,
          args.includes('--publish'),
          controller.signal,
        );
    }
  } finally {
    process.off('SIGINT', cancel);
    process.off('SIGTERM', cancel);
  }
}
