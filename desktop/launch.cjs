/** Vite 服务由持有单实例锁的 Electron 主进程管理，启动器只负责启动 Electron。 */
const { spawn } = require('node:child_process');
const path = require('node:path');
const { ROOT, validateUrl } = require('./server.cjs');
const { parseArgs } = require('./main.cjs');

function resolveElectronBinary() {
  const binary = require('electron');
  if (typeof binary !== 'string' || !binary) throw new Error('未找到 Electron 可执行文件。');
  return binary;
}

function launch(
  argv = process.argv.slice(2),
  spawnProcess = spawn,
  resolveBinary = resolveElectronBinary,
) {
  const args = parseArgs(argv);
  if (args.has('url')) validateUrl(args.get('url'));
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawnProcess(resolveBinary(), [path.join(ROOT, 'desktop'), ...argv], {
    cwd: ROOT,
    stdio: 'inherit',
    windowsHide: true,
    env,
  });
  const shutdown = () => {
    if (!child.killed && child.exitCode === null) child.kill('SIGTERM');
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  const cleanup = () => {
    process.removeListener('SIGINT', shutdown);
    process.removeListener('SIGTERM', shutdown);
  };
  child.once('error', error => {
    cleanup();
    console.error('[endaxis] 无法启动 Electron：', error.message);
    console.error('[endaxis] 请先运行 npm ci 和 npm ci --prefix desktop。');
    process.exitCode = 1;
  });
  child.once('exit', code => {
    cleanup();
    process.exitCode = code ?? 1;
  });
  return child;
}

module.exports = { launch };

if (require.main === module) {
  try {
    launch();
  } catch (error) {
    console.error('[endaxis] 启动失败：', error.message);
    console.error('[endaxis] 请先运行 npm ci 和 npm ci --prefix desktop。');
    process.exitCode = 1;
  }
}
