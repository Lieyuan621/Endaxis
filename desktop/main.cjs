/** 编辑器和 HUD 使用同一 Electron session、同一来源的 IndexedDB。 */
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, workspaceIdentity, validateUrl, startServer } = require('./server.cjs');
const { createCountdownTrigger } = require('./countdown-trigger.cjs');
const { createRegionPicker } = require('./region-picker.cjs');

const MIN_WIDTH = 640;
const MIN_HEIGHT = 150;

function parseArgs(argv) {
  const args = new Map();
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const index = raw.indexOf('=');
    args.set(
      raw.slice(2, index < 0 ? undefined : index),
      index < 0 ? 'true' : raw.slice(index + 1),
    );
  }
  return args;
}

/** IPC 和状态文件只接收有限数值；尺寸变化后同时把位置限制在当前显示器内。 */
function fitBounds(bounds, area) {
  if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) return null;
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  const width = Math.min(Math.max(MIN_WIDTH, Math.round(bounds.width)), area.width);
  const height = Math.min(Math.max(MIN_HEIGHT, Math.round(bounds.height)), area.height);
  return {
    x: Math.min(Math.max(area.x, Math.round(bounds.x)), area.x + area.width - width),
    y: Math.min(Math.max(area.y, Math.round(bounds.y)), area.y + area.height - height),
    width,
    height,
  };
}

function readPosition(file) {
  try {
    const state = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (Number.isFinite(state?.x) && Number.isFinite(state?.y)) {
      return { x: Math.round(state.x), y: Math.round(state.y) };
    }
  } catch {
    // 首次启动或损坏的状态文件使用默认位置。
  }
  return null;
}

function startDesktop(electron, argv = process.argv.slice(1), services = {}) {
  const { app, BrowserWindow, globalShortcut, ipcMain, screen } = electron;
  const args = parseArgs(argv);
  let targetUrl = args.has('url') ? validateUrl(args.get('url')) : null;
  const userData = args.has('user-data-dir')
    ? path.resolve(args.get('user-data-dir'))
    : path.join(app.getPath('appData'), 'EndaxisOverlay', workspaceIdentity());
  fs.mkdirSync(userData, { recursive: true });
  app.setPath('userData', userData);
  app.setPath('sessionData', userData);
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  let hud = null;
  let editor = null;
  let server = null;
  let clickThrough = false;
  let clickThroughAvailable = false;
  let playbackShortcutsAvailable = true;
  let topmostTimer = null;
  let captureTimer = null;
  let quitting = false;
  let initializing = true;
  let pendingEditorFocus = false;
  let countdownTrigger = null;
  let regionPicker = null;
  const stateFile = path.join(app.getPath('userData'), 'window-state.json');
  const channels = [];

  function sendToHud(channel, payload) {
    if (!quitting && hud && !hud.isDestroyed()) hud.webContents.send(channel, payload);
  }

  function countdown() {
    if (!countdownTrigger) {
      countdownTrigger = (services.createCountdownTrigger || createCountdownTrigger)({
        desktopCapturer: electron.desktopCapturer,
        screen,
        nativeImage: electron.nativeImage,
        stateFile: path.join(userData, 'countdown-trigger.json'),
        onUpdate: status => sendToHud('endaxis:countdown-status', status),
        onTrigger: event => sendToHud('endaxis:countdown-trigger', event),
      });
    }
    return countdownTrigger;
  }

  function cancelRegionPicker() {
    regionPicker?.dispose();
    regionPicker = null;
  }

  async function selectCountdownRegion() {
    countdown().disarm();
    if (!regionPicker) {
      regionPicker = (services.createRegionPicker || createRegionPicker)({
        BrowserWindow,
        ipcMain,
        screen,
        desktopCapturer: electron.desktopCapturer,
        owner: () => hud,
      });
    }
    const selection = await regionPicker.pick();
    if (quitting) return null;
    return selection ? countdown().configure(selection) : countdown().info();
  }

  function openEditor() {
    if (!targetUrl) {
      pendingEditorFocus = true;
      return;
    }
    if (editor && !editor.isDestroyed()) {
      if (editor.isMinimized()) editor.restore();
      editor.show();
      editor.focus();
      return;
    }
    editor = new BrowserWindow({
      width: 1440,
      height: 960,
      title: 'Endaxis',
      webPreferences: {
        preload: path.join(__dirname, 'editor-preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    editor.setMenuBarVisibility(false);
    void editor
      .loadURL(new URL('/', targetUrl).href)
      .catch(error => console.error('[endaxis]', error));
    editor.on('closed', () => {
      editor = null;
    });
  }

  function setClickThrough(next) {
    if (typeof next !== 'boolean') return clickThrough;
    clickThrough = next && clickThroughAvailable;
    if (hud && !hud.isDestroyed()) {
      hud.setIgnoreMouseEvents(clickThrough, { forward: true });
      hud.webContents.send('endaxis:click-through', clickThrough);
    }
    return clickThrough;
  }

  function resize(size) {
    if (!hud || hud.isDestroyed() || !size) return null;
    const bounds = hud.getBounds();
    const next = fitBounds(
      { ...bounds, width: size.width, height: size.height },
      screen.getDisplayMatching(bounds).workArea,
    );
    if (!next) return null;
    hud.setBounds(next, false);
    return hud.getBounds();
  }

  function fitCurrentDisplay() {
    if (!hud || hud.isDestroyed()) return;
    const bounds = hud.getBounds();
    const next = fitBounds(bounds, screen.getDisplayMatching(bounds).workArea);
    if (next) hud.setBounds(next, false);
  }

  function handle(channel, callback) {
    channels.push(channel);
    ipcMain.handle(channel, (event, ...values) => {
      if (!hud || hud.isDestroyed() || event.sender !== hud.webContents) return null;
      return callback(...values);
    });
  }

  function cleanup() {
    countdownTrigger?.dispose();
    cancelRegionPicker();
    if (topmostTimer !== null) clearInterval(topmostTimer);
    if (captureTimer !== null) clearTimeout(captureTimer);
    topmostTimer = null;
    captureTimer = null;
    globalShortcut.unregisterAll();
    channels.forEach(channel => ipcMain.removeHandler(channel));
    screen.removeListener('display-removed', fitCurrentDisplay);
    screen.removeListener('display-metrics-changed', fitCurrentDisplay);
  }

  function createHud() {
    const position = readPosition(stateFile);
    const initialSize = {
      width: Number(args.get('width')) || 1120,
      height: Number(args.get('height')) || 220,
    };
    const area = position
      ? screen.getDisplayMatching({ ...position, ...initialSize }).workArea
      : screen.getPrimaryDisplay().workArea;
    const initial = fitBounds(
      {
        ...initialSize,
        x: position?.x ?? area.x + (area.width - initialSize.width) / 2,
        y: position?.y ?? area.y + 40,
      },
      area,
    );
    if (!initial) throw new TypeError('窗口尺寸必须是有限正数。');
    hud = new BrowserWindow({
      ...initial,
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
        sandbox: true,
        backgroundThrottling: false,
      },
    });
    const window = hud;
    window.webContents.on('did-start-loading', () => {
      countdownTrigger?.disarm();
      cancelRegionPicker();
    });
    window.setAlwaysOnTop(true, 'screen-saver');
    window.setMenuBarVisibility(false);
    // 有桌面权限的页面不能通过导航把 preload 能力交给其它来源。
    window.webContents.on('will-navigate', (event, url) => {
      if (url !== targetUrl) event.preventDefault();
    });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    void window.loadURL(targetUrl).catch(error => console.error('[endaxis]', error));
    topmostTimer = setInterval(() => {
      if (!window.isDestroyed()) window.setAlwaysOnTop(true, 'screen-saver');
    }, 2000);
    window.once('ready-to-show', () => window.showInactive());
    window.on('close', () => {
      try {
        const { x, y } = window.getBounds();
        fs.mkdirSync(path.dirname(stateFile), { recursive: true });
        fs.writeFileSync(stateFile, JSON.stringify({ x, y }), 'utf8');
      } catch {
        // 位置无法保存时仍允许正常退出。
      }
    });
    window.on('closed', () => {
      hud = null;
      if (!quitting) app.quit();
    });
    if (args.has('capture')) {
      window.webContents.once('did-finish-load', () => {
        captureTimer = setTimeout(async () => {
          try {
            if (!window.isDestroyed()) {
              const image = await window.webContents.capturePage();
              fs.writeFileSync(args.get('capture'), image.toPNG());
            }
          } catch (error) {
            console.error('[endaxis] 截图失败：', error);
          }
          app.quit();
        }, 6000);
      });
    }
  }

  app.on('second-instance', () => openEditor());
  app.on('activate', () => openEditor());
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', event => {
    quitting = true;
    cleanup();
    if (initializing) {
      event.preventDefault();
      return;
    }
    if (server) {
      event.preventDefault();
      const ownedServer = server;
      server = null;
      void ownedServer
        .close()
        .catch(error => console.error('[endaxis] 关闭服务器失败：', error))
        .finally(() => app.quit());
    }
  });

  const ready = app
    .whenReady()
    .then(async () => {
      if (quitting) {
        initializing = false;
        app.quit();
        return;
      }
      if (!targetUrl) {
        const started = await (services.startServer || startServer)(ROOT);
        server = started.server;
        targetUrl = started.url;
        if (quitting) {
          await server.close();
          server = null;
          initializing = false;
          app.quit();
          return;
        }
      }
      clickThroughAvailable = globalShortcut.register('Control+Alt+O', () =>
        setClickThrough(!clickThrough),
      );
      if (!clickThroughAvailable) {
        console.warn('[endaxis] Ctrl+Alt+O 已被占用，本次禁用鼠标穿透以保留恢复入口。');
      }
      for (const [key, handler] of [
        ['Control+Alt+R', () => hud && !hud.isDestroyed() && hud.reload()],
        ['Control+Alt+Q', () => app.quit()],
      ]) {
        if (!globalShortcut.register(key, handler))
          console.warn(`[endaxis] 全局快捷键注册失败：${key}`);
      }
      // 回放命令只传给 HUD，不显示或聚焦窗口，玩家可以一直留在游戏内操作。
      for (const [key, command] of [
        ['Control+Alt+Space', 'toggle'],
        ['Control+Alt+Home', 'restart'],
        ['Control+Alt+Left', 'backward'],
        ['Control+Alt+Right', 'forward'],
      ]) {
        const registered = globalShortcut.register(key, () => {
          if (hud && !hud.isDestroyed()) hud.webContents.send('endaxis:playback-command', command);
        });
        if (!registered) {
          playbackShortcutsAvailable = false;
          console.warn('[endaxis] 回放快捷键注册失败：' + key + '（可能被其它程序占用）');
        }
      }
      handle('endaxis:desktop-info', () => ({
        clickThrough,
        clickThroughAvailable,
        playbackShortcutsAvailable,
        countdownTriggerAvailable: true,
        url: targetUrl,
        alwaysOnTop: Boolean(hud && hud.isAlwaysOnTop()),
      }));
      handle('endaxis:toggle-click-through', () => setClickThrough(!clickThrough));
      handle('endaxis:set-click-through', setClickThrough);
      handle('endaxis:open-editor', openEditor);
      handle('endaxis:quit', () => app.quit());
      handle('endaxis:resize', resize);
      handle('endaxis:countdown-info', () => countdown().info());
      handle('endaxis:countdown-select', selectCountdownRegion);
      handle('endaxis:countdown-arm', () => countdown().arm());
      handle('endaxis:countdown-disarm', () => countdown().disarm());
      handle('endaxis:countdown-clear', () => countdown().clear());
      channels.push('endaxis:show-overlay');
      ipcMain.handle('endaxis:show-overlay', event => {
        if (!editor || editor.isDestroyed() || event.sender !== editor.webContents) return null;
        if (hud && !hud.isDestroyed()) hud.showInactive();
      });
      createHud();
      screen.on('display-removed', fitCurrentDisplay);
      screen.on('display-metrics-changed', fitCurrentDisplay);
      if (!args.has('no-editor') || pendingEditorFocus) openEditor();
      initializing = false;
    })
    .catch(async error => {
      console.error('[endaxis] 启动失败：', error);
      quitting = true;
      initializing = false;
      cleanup();
      try {
        if (server) await server.close();
      } finally {
        server = null;
        app.exit(1);
      }
    });
  return ready;
}

module.exports = { parseArgs, fitBounds, readPosition, startDesktop };

// Electron 的 bootstrap 可持有 require.main；用宿主身份识别真正的应用入口。
// 普通 Node 的启动器和单元测试导入本文件时不创建窗口。
if (process.type === 'browser') {
  try {
    startDesktop(require('electron'));
  } catch (error) {
    console.error('[endaxis] 启动失败：', error);
    require('electron').app.exit(1);
  }
}
