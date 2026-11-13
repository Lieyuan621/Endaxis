/**
 * rebuild:game-data:local 的游戏目录入口；不需要预先使用 AKE GUI。
 *
 * 必需：--game-root <游戏安装目录> --ake-tool-root <AKEDatabase/tools/ake-data-tool>
 *       --data-tool-root <endaxis-data-tool 仓库目录>
 * 可选：--python <endaxis-data-tool 的 Python>；--ake-python <AKE 的 Python>；
 *       默认分别使用两个仓库的 .venv/Scripts/python.exe；--workers 默认 2；
 *       --work-root <工作目录>，默认 tmp/local-game-data-cache；
 *       --contract-values-root <离线合约补充目录>；--publish 写入正式资源目录。
 *       --check-inputs 只检查输入和工具环境；--help 显示参数。
 *
 * 先按各仓库的说明准备运行环境；本脚本不安装依赖或初始化子模块。
 * 使用 AKE 的读取器导出本机 TableCfg、Json 和图片，再导出补充资源并运行 Endaxis 全量生成与验收。
 * 游戏目录只读，VFS 独立复制并缓存。每次输出放到新的运行目录。
 * 不上传 AKE 数据、不提交、不部署。默认生成候选（成功时退出码 2）；
 * --publish 在全部验收通过后同步本地正式资源。失败时保留日志与中间输出。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '../../..');
export const INSTALLED_GAME_HELP = `Usage: npm run rebuild:game-data:local --
  --game-root <game> --ake-tool-root <AKEDatabase/tools/ake-data-tool>
  --data-tool-root <endaxis-data-tool> [--python <data-tool-python>] [--ake-python <ake-python>] [--workers 2]
  [--work-root <cache>] [--contract-values-root <directory>]
  [--publish | --check-inputs]
Exports TableCfg, Json, images and supplemental data, then generates and validates
Endaxis resources. --publish writes local resource files; nothing is uploaded.
Without --publish, a successful candidate returns exit code 2.
`;

export function parseInstalledGameArguments(args: readonly string[]) {
  const flags = new Set(['--publish', '--check-inputs']);
  const values = new Map<string, string>();
  const enabled = new Set<string>();
  const names = new Set([
    '--game-root',
    '--ake-tool-root',
    '--data-tool-root',
    '--python',
    '--ake-python',
    '--workers',
    '--work-root',
    '--contract-values-root',
  ]);
  for (let index = 0; index < args.length; index++) {
    const name = args[index]!;
    if (values.has(name) || enabled.has(name)) throw new Error(`Duplicate argument: ${name}`);
    if (flags.has(name)) enabled.add(name);
    else {
      if (!names.has(name)) throw new Error(`Unknown argument: ${name}`);
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`Missing value: ${name}`);
      values.set(name, value);
    }
  }
  const required = (key: string) => {
    const value = values.get(key);
    if (!value) throw new Error(`Required argument: ${key}`);
    return path.resolve(value);
  };
  const workers = Number(values.get('--workers') ?? '2');
  if (!Number.isSafeInteger(workers) || workers < 1)
    throw new Error('workers must be a positive integer');
  if (enabled.has('--publish') && enabled.has('--check-inputs'))
    throw new Error('--publish and --check-inputs cannot be combined');
  return {
    gameRoot: required('--game-root'),
    akeToolRoot: required('--ake-tool-root'),
    dataToolRoot: required('--data-tool-root'),
    python:
      values.get('--python') ?? path.join(required('--data-tool-root'), '.venv/Scripts/python.exe'),
    akePython:
      values.get('--ake-python') ??
      path.join(required('--ake-tool-root'), '.venv/Scripts/python.exe'),
    workRoot: path.resolve(
      values.get('--work-root') ?? path.join(ROOT, 'tmp/local-game-data-cache'),
    ),
    workers,
    publish: enabled.has('--publish'),
    checkInputs: enabled.has('--check-inputs'),
    contractValuesRoot: values.has('--contract-values-root')
      ? path.resolve(values.get('--contract-values-root')!)
      : undefined,
  };
}

async function execute(executable: string, args: string[], signal: AbortSignal, cwd = ROOT) {
  signal.throwIfAborted();
  const code = await new Promise<number>((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      stdio: 'inherit',
      windowsHide: true,
      signal,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });
  if (code !== 0) throw new Error(`Command failed (${code}): ${executable} ${args[0]}`);
}

export async function rebuildFromInstalledGame(
  args: readonly string[],
  signal: AbortSignal,
  rebuildPrepared: (
    inputs: unknown,
    file: string,
    publish: boolean,
    signal: AbortSignal,
  ) => Promise<number>,
) {
  if (args.includes('--help')) {
    console.log(INSTALLED_GAME_HELP);
    return 0;
  }
  const config = parseInstalledGameArguments(args);
  if (process.platform !== 'win32') throw new Error('Installed-game export requires Windows x64');
  for (const file of [
    path.join(config.gameRoot, 'GameAssembly.dll'),
    path.join(config.gameRoot, 'Endfield_Data/il2cpp_data/Metadata/global-metadata.dat'),
    path.join(config.akeToolRoot, 'requirements.txt'),
    path.join(config.akeToolRoot, 'ake_tool/json_host/export_json.py'),
    path.join(config.dataToolRoot, 'pyproject.toml'),
    path.join(ROOT, 'node_modules/typescript/package.json'),
  ])
    await fs.access(file);
  const relativeWork = path.relative(config.gameRoot, config.workRoot);
  if (relativeWork === '' || (!relativeWork.startsWith('..') && !path.isAbsolute(relativeWork)))
    throw new Error('Work directory must be outside the game installation');
  for (const python of new Set([config.python, config.akePython])) {
    await execute(
      python,
      [
        '-c',
        'import sys, struct; assert sys.version_info >= (3,11) and struct.calcsize("P") == 8, "64-bit Python 3.11+ required"',
      ],
      signal,
    );
  }
  await execute(
    config.akePython,
    [
      '-c',
      'import sys; from pathlib import Path; sys.path.insert(0, sys.argv[1]); import ake_tool.json_unpacker, UnityPy, cryptography; from ake_tool.json_host.export_json import REQUIRED_RUNTIME; missing=[name for name in REQUIRED_RUNTIME if not (Path(sys.argv[2])/name).is_file()]; assert not missing, missing',
      config.akeToolRoot,
      config.gameRoot,
    ],
    signal,
  );
  await execute(config.python, ['-c', 'import endaxis_data_tool'], signal);
  if (config.checkInputs) {
    console.log(
      'Installed-game paths and prepared Python environments passed; no export was started.',
    );
    return 0;
  }
  await fs.mkdir(config.workRoot, { recursive: true });
  const run = await fs.mkdtemp(path.join(config.workRoot, 'run-'));
  const exported = path.join(run, 'ake');
  console.log(`Installed-game export: ${run}`);
  await execute(
    config.akePython,
    [
      path.join(import.meta.dirname, 'exportInstalledGame.py'),
      '--game-root',
      config.gameRoot,
      '--ake-tool-root',
      config.akeToolRoot,
      '--work-root',
      config.workRoot,
      '--output',
      exported,
      '--workers',
      String(config.workers),
    ],
    signal,
  );
  const file = path.join(exported, 'compiler-inputs.json');
  const inputs = JSON.parse(await fs.readFile(file, 'utf8'));
  inputs.python = config.python;
  if (config.contractValuesRoot) inputs.contractValuesRoot = config.contractValuesRoot;
  await fs.writeFile(file, JSON.stringify(inputs, null, 2) + '\n');
  return rebuildPrepared(inputs, file, config.publish, signal);
}
