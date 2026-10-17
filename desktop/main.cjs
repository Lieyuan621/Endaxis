/**
 * Endaxis 游戏内提示条 —— Windows 桌面悬浮窗（Electron 主进程）。
 *
 * 行为对齐「QQ 音乐桌面歌词」：
 * - 无边框、透明、置顶（level = screen-saver，尽量压住普通窗口）；
 * - 默认可以交互（拖动/点按钮），按 Ctrl+Alt+O 切换鼠标穿透，穿透后完全不挡游戏点击；
 * - 窗口位置记忆在 userData 里，下次打开回到原处；
 * - 窗口大小跟随 HUD（页面通过 IPC 请求），打开设置面板时临时长高。
 *
 * 页面仍然复用 `/overlay`：它从同一来源的 localStorage 读取排轴方案，
 * 因此和排轴工具天然同步（开发服务器地址由启动器传入）。
 */
const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_URL = 'http://127.0.0.1:5173/overlay';
const MIN_WIDTH = 640;
const MIN_HEIGHT = 150;

function parseArgs(argv) {
  const args = new Map();
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    // 只在第一个 '=' 处切分：URL 里可能带查询串（--url=http://…/overlay?demo=1）
    const [key, ...rest] = raw.slice(2).split('=');
    args.set(key, rest.length ? rest.join('=') : 'true');
  }
  return args;
}

const args = parseArgs(process.argv.slice(1));
const targetUrl = args.get('url') || DEFAULT_URL;
const capturePath = args.get('capture') || '';

/** 上次的窗口位置（只保存位置，不保存大小：大小由 HUD 决定）。 */
function stateFile() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function readState() {
  try {
    const raw = fs.readFileSync(stateFile(), 'utf8');
    const parsed = JSON.parse(raw);
    if (Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y)) {
      return { x: Math.round(parsed.x), y: Math.round(parsed.y) };
    }
  } catch {
    /* 首次启动没有状态文件 */
  }
  return null;
}

function writeState(bounds) {
  try {
    fs.mkdirSync(path.dirname(stateFile()), { recursive: true });
    fs.writeFileSync(stateFile(), JSON.stringify({ x: bounds.x, y: bounds.y }), 'utf8');
  } catch {
    /* 写不了就算了，不影响使用 */
  }
}

let win = null;
let clickThrough = false;

function clampSize(width, height) {
  const display = win ? screen.getDisplayMatching(win.getBounds()) : screen.getPrimaryDisplay();
  const area = display.workArea;
  return {
    width: Math.min(Math.max(MIN_WIDTH, Math.round(width)), area.width),
    height: Math.min(Math.max(MIN_HEIGHT, Math.round(height)), area.height),
  };
}

function setClickThrough(next) {
  clickThrough = Boolean(next);
  if (!win || win.isDestroyed()) return clickThrough;
  // forward:true 让穿透状态下页面仍能收到 mousemove（用于悬停提示）
  win.setIgnoreMouseEvents(clickThrough, { forward: true });
  win.webContents.send('endaxis:click-through', clickThrough);
  return clickThrough;
}

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const area = display.workArea;
  const state = readState();
  const width = clampSize(Number(args.get('width')) || 1120, 0).width;
  const height = clampSize(0, Number(args.get('height')) || 220).height;

  win = new BrowserWindow({
    width,
    height,
    x: state ? Math.min(Math.max(area.x, state.x), area.x + area.width - 240) : Math.round(area.x + (area.width - width) / 2),
    y: state ? Math.min(Math.max(area.y, state.y), area.y + area.height - 120) : area.y + 40,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    title: 'Endaxis 提示条',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  // screen-saver 级别可以浮在大多数窗口之上（包括无边框全屏的游戏窗口）
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setMenuBarVisibility(false);
  win.loadURL(targetUrl);

  win.once('ready-to-show', () => {
    // 截图验证时不抢焦点，避免打扰正在使用电脑的人。
    if (capturePath) win.showInactive();
    else {
      win.show();
      win.focus();
    }
  });

  win.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error(`[endaxis] 加载失败 ${code} ${description} ${url}`);
  });

  win.on('close', () => {
    if (win && !win.isDestroyed()) writeState(win.getBounds());
  });

  win.on('closed', () => {
    win = null;
  });

  if (capturePath) {
    win.webContents.once('did-finish-load', async () => {
      await new Promise(resolve => setTimeout(resolve, 6000));
      try {
        const image = await win.webContents.capturePage();
        fs.writeFileSync(capturePath, image.toPNG());
        console.log(
          `[endaxis] captured ${capturePath} alwaysOnTop=${win.isAlwaysOnTop()} clickThrough=${clickThrough}`,
        );
      } catch (error) {
        console.error('[endaxis] capture failed', error);
      }
      app.quit();
    });
  }
}

function registerShortcuts() {
  const shortcuts = [
    ['Control+Alt+O', () => setClickThrough(!clickThrough)],
    ['Control+Alt+R', () => win && !win.isDestroyed() && win.reload()],
    ['Control+Alt+Q', () => app.quit()],
  ];
  for (const [accelerator, handler] of shortcuts) {
    if (!globalShortcut.register(accelerator, handler)) {
      console.warn(`[endaxis] 全局快捷键注册失败：${accelerator}（可能被其它程序占用）`);
    }
  }
}

app.commandLine.appendSwitch('enable-features', 'CSSBackdropFilter');

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();

  ipcMain.handle('endaxis:desktop-info', () => ({
    clickThrough,
    url: targetUrl,
    alwaysOnTop: win ? win.isAlwaysOnTop() : false,
  }));

  ipcMain.handle('endaxis:toggle-click-through', () => setClickThrough(!clickThrough));
  ipcMain.handle('endaxis:set-click-through', (_event, value) => setClickThrough(value));
  ipcMain.handle('endaxis:quit', () => {
    app.quit();
  });
  ipcMain.handle('endaxis:resize', (_event, size) => {
    if (!win || win.isDestroyed()) return null;
    const { width: nextWidth, height: nextHeight } = clampSize(size?.width ?? 1120, size?.height ?? 220);
    const bounds = win.getBounds();
    win.setBounds({ x: bounds.x, y: bounds.y, width: nextWidth, height: nextHeight }, false);
    return win.getBounds();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
