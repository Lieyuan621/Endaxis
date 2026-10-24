/** Vite 服务由持有单实例锁的 Electron 主进程管理，启动器只负责启动 Electron。 */
const { spawn } = require('node:child_process');
const path = require('node:path');
const { ROOT, validateUrl } = require('./server.cjs');
const { parseArgs } = require('./main.cjs');

function resolveElectronBinary() {
  const binary = require('electron');
  if (typeof binary !== 'string' || !binary) throw new Error('Electron executable was not found.');
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
    windowsHide: false,
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
    console.error('[endaxis] Could not launch Electron:', error.message);
    console.error('[endaxis] Run npm ci and npm ci --prefix desktop first.');
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
    console.error('[endaxis] Startup failed:', error.message);
    console.error('[endaxis] Run npm ci and npm ci --prefix desktop first.');
    process.exitCode = 1;
  }
}
