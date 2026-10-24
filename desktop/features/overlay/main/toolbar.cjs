const path = require('node:path');
const { protectWindow, isWindowSender } = require('../../../app/protocol.cjs');
/** 工具条只跟随宿主；不参与宿主尺寸计算，也不保存独立位置。 */
function createToolbar({ BrowserWindow, ipcMain, screen }, { hud, url, getState, command }) {
  const window = new BrowserWindow({
    parent: hud,
    width: 252,
    height: 44,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    icon: path.join(__dirname, '../../../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/toolbar.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  let disposed = false;
  let ready = false;
  let lastHoveredAt = Date.now();
  let visible = false;
  const contains = (b, point) => point.x >= b.x && point.x <= b.x + b.width &&
    point.y >= b.y && point.y <= b.y + b.height;
  // 原生坐标检测也适用于鼠标穿透的提示条，隐藏后仍可悬停唤回。
  const hoverTimer = setInterval(() => {
    if (disposed || !ready || !hud.isVisible()) return;
    const point = screen.getCursorScreenPoint();
    if (contains(hud.getBounds(), point) || (visible && contains(window.getBounds(), point))) {
      lastHoveredAt = Date.now();
      if (!visible) show();
    } else if (Date.now() - lastHoveredAt >= 3000 && visible) hide();
  }, 150);
  function follow() {
    if (disposed) return;
    const b = hud.getBounds();
    const area = screen.getDisplayMatching(b).workArea;
    const width = 252,
      height = 44,
      gap = 4;
    const x = Math.max(area.x, Math.min(b.x + b.width - width, area.x + area.width - width));
    const y =
      b.y - height - gap >= area.y
        ? b.y - height - gap
        : Math.min(b.y + b.height + gap, area.y + area.height - height);
    window.setBounds({ x, y, width, height }, false);
  }
  function publish() {
    if (disposed) return;
    window.webContents.send('endaxis:toolbar:state', getState());
  }
  function show() {
    if (ready && !disposed) {
      follow();
      window.showInactive();
      visible = true;
      lastHoveredAt = Date.now();
    }
  }
  function hide() {
    if (!disposed) {
      window.hide();
      visible = false;
    }
  }
  const allowed = new Set([
    'toggle',
    'backward',
    'forward',
    'restart',
    'settings',
    'lock',
    'close',
  ]);
  ipcMain.handle('endaxis:toolbar:state', event =>
    isWindowSender(event, window) ? getState() : null,
  );
  ipcMain.handle('endaxis:toolbar:command', (event, value) => {
    if (!disposed && isWindowSender(event, window) && allowed.has(value)) return command(value);
    return null;
  });
  protectWindow(window, url);
  window.setAlwaysOnTop(true, 'screen-saver');
  hud.on('move', follow);
  hud.on('resize', follow);
  hud.on('show', show);
  hud.on('hide', hide);
  window.once('ready-to-show', () => {
    ready = true;
    publish();
    if (hud.isVisible()) show();
  });
  void window.loadURL(url).catch(error => console.error('[endaxis]', error));
  return {
    window,
    publish,
    dispose() {
      if (disposed) return;
      disposed = true;
      clearInterval(hoverTimer);
      hud.removeListener('move', follow);
      hud.removeListener('resize', follow);
      hud.removeListener('show', show);
      hud.removeListener('hide', hide);
      ipcMain.removeHandler('endaxis:toolbar:state');
      ipcMain.removeHandler('endaxis:toolbar:command');
      if (!window.isDestroyed()) window.destroy();
    },
  };
}
module.exports = { createToolbar };
