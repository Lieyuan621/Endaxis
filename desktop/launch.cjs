/**
 * 一键启动桌面悬浮窗：
 *   1. 如果开发服务器（127.0.0.1:5173）没在跑，先把它拉起来；
 *   2. 等端口就绪；
 *   3. 启动 Electron 悬浮窗（页面 /overlay，和排轴工具同源，方案自动同步）；
 *   4. 悬浮窗关闭时，把本次启动的开发服务器一并关掉。
 *
 * 也可以带参数：
 *   node desktop/launch.cjs --url=http://127.0.0.1:5173/overlay
 *   node desktop/launch.cjs --capture=D:\shot.png   （截图后退出，用于验证）
 */
const { spawn, spawnSync } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DEV_HOST = '127.0.0.1';
const DEV_PORT = 5173;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function probe() {
  return new Promise(resolve => {
    const request = http.get(
      { host: DEV_HOST, port: DEV_PORT, path: '/', timeout: 900 },
      response => {
        response.resume();
        resolve(true);
      },
    );
    request.on('error', () => resolve(false));
    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(timeoutMs = 90_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await probe()) return true;
    await sleep(400);
  }
  return false;
}

function resolveElectronBinary() {
  try {
    // 在普通 Node 环境下，require('electron') 返回可执行文件路径
    const binary = require('electron');
    if (typeof binary === 'string' && binary.length > 0) return binary;
  } catch {
    /* 继续走下面的兜底路径 */
  }
  const fallback = path.join(ROOT, 'node_modules', 'electron', 'dist', 'electron.exe');
  return fallback;
}

function killTree(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
}

async function main() {
  const extraArgs = process.argv.slice(2);
  let server = null;

  if (await probe()) {
    console.log('[endaxis] 复用已运行的开发服务器 http://127.0.0.1:5173');
  } else {
    const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
    console.log('[endaxis] 启动开发服务器…');
    server = spawn(
      process.execPath,
      [viteBin, '--host', DEV_HOST, '--port', String(DEV_PORT), '--strictPort'],
      { cwd: ROOT, stdio: 'inherit', windowsHide: true },
    );
    server.on('exit', code => {
      if (code !== 0) console.error(`[endaxis] 开发服务器退出：${code}`);
    });
    if (!(await waitForServer())) {
      console.error('[endaxis] 开发服务器 90 秒内没有就绪，已中止。');
      killTree(server);
      process.exitCode = 1;
      return;
    }
    console.log('[endaxis] 开发服务器就绪');
  }

  const electronBinary = resolveElectronBinary();
  const urlArg = extraArgs.find(arg => arg.startsWith('--url='));
  const url = urlArg ? urlArg.slice('--url='.length) : `http://${DEV_HOST}:${DEV_PORT}/overlay`;
  const appArgs = [path.join(ROOT, 'desktop'), `--url=${url}`, ...extraArgs.filter(a => !a.startsWith('--url='))];

  console.log(`[endaxis] 启动悬浮窗：${url}`);
  // 注意：某些开发环境（例如 Electron 系 IDE / 带 Electron 的终端）会设置
  // ELECTRON_RUN_AS_NODE=1，那会让 electron.exe 退化成普通 Node、不创建窗口。
  const childEnv = { ...process.env };
  delete childEnv.ELECTRON_RUN_AS_NODE;

  const electron = spawn(electronBinary, appArgs, { cwd: ROOT, stdio: 'inherit', env: childEnv });

  electron.on('error', error => {
    console.error('[endaxis] 无法启动 Electron：', error.message);
    console.error('[endaxis] 请确认已执行 npm install（需要 node_modules/electron）。');
    killTree(server);
    process.exitCode = 1;
  });

  electron.on('exit', code => {
    console.log(`[endaxis] 悬浮窗已关闭（${code ?? 0}）`);
    killTree(server);
    process.exitCode = code ?? 0;
  });

  const shutdown = () => {
    killTree(electron);
    killTree(server);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(error => {
  console.error('[endaxis] 启动失败：', error);
  process.exitCode = 1;
});
