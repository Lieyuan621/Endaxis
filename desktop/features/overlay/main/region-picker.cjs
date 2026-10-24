/** 冻结当前显示器供用户框选；参考图始终裁自这一帧，不重抓变化中的数字。 */
const path = require('node:path');
const { message } = require('../../../app/messages.cjs');

const INIT_CHANNEL = 'endaxis:region-picker:init';
const SELECT_CHANNEL = 'endaxis:region-picker:select';
const MIN_DIP = 8;

function normalizeRegion(value, bounds) {
  if (!value || typeof value !== 'object') return null;
  const { x, y, width, height } = value;
  if (![x, y, width, height].every(item => typeof item === 'number' && Number.isFinite(item)))
    return null;
  if (
    x < 0 ||
    y < 0 ||
    x >= 1 ||
    y >= 1 ||
    width <= 0 ||
    height <= 0 ||
    width > 1 ||
    height > 1 ||
    x + width > 1 + 1e-9 ||
    y + height > 1 + 1e-9
  )
    return null;
  const clippedWidth = Math.min(width, 1 - x);
  const clippedHeight = Math.min(height, 1 - y);
  if (
    clippedWidth * bounds.width + 1e-6 < MIN_DIP ||
    clippedHeight * bounds.height + 1e-6 < MIN_DIP
  )
    return null;
  return { x, y, width: clippedWidth, height: clippedHeight };
}

function pixelRegion(region, size) {
  const x = Math.floor(region.x * size.width);
  const y = Math.floor(region.y * size.height);
  return {
    x,
    y,
    width: Math.min(size.width, Math.ceil((region.x + region.width) * size.width)) - x,
    height: Math.min(size.height, Math.ceil((region.y + region.height) * size.height)) - y,
  };
}

function createRegionPicker({
  BrowserWindow,
  ipcMain,
  screen,
  desktopCapturer,
  owner,
  text = key => message('zh-CN', key),
  locale = () => 'zh-CN',
}) {
  let disposed = false;
  let active = null;

  function pick() {
    if (disposed || active) return Promise.resolve(null);
    const hud = owner();
    if (!hud || hud.isDestroyed()) return Promise.resolve(null);
    let display;
    try {
      display = screen.getDisplayMatching(hud.getBounds());
    } catch (error) {
      return Promise.reject(error);
    }
    const bounds = { ...display.bounds };
    let resolve;
    let reject;
    const result = new Promise((accept, fail) => {
      resolve = accept;
      reject = fail;
    });
    const session = {
      done: false,
      window: null,
      image: null,
      waitTimer: null,
      finishWait: null,
      handlersInstalled: false,
      wasVisible: hud.isVisible(),
    };
    active = session;

    function restoreHud() {
      if (session.wasVisible && owner() === hud && !hud.isDestroyed()) hud.showInactive();
    }

    function finish(value, error) {
      if (session.done) return;
      session.done = true;
      if (active === session) active = null;
      if (session.waitTimer !== null) clearTimeout(session.waitTimer);
      session.finishWait?.();
      screen.removeListener('display-removed', displayRemoved);
      screen.removeListener('display-metrics-changed', displayChanged);
      hud.removeListener('closed', ownerClosed);
      if (session.handlersInstalled) {
        ipcMain.removeHandler(INIT_CHANNEL);
        ipcMain.removeListener(SELECT_CHANNEL, selected);
      }
      const window = session.window;
      session.window = null;
      session.image = null;
      if (window && !window.isDestroyed()) {
        window.removeListener('closed', pickerClosed);
        window.destroy();
      }
      restoreHud();
      if (error) reject(error);
      else resolve(value);
    }

    function displayRemoved(_event, changed) {
      if (changed.id === display.id) finish(null);
    }
    function displayChanged(_event, changed) {
      if (changed.id === display.id) finish(null);
    }
    function ownerClosed() {
      finish(null);
    }
    function pickerClosed() {
      finish(null);
    }
    function authorized(event) {
      const window = session.window;
      return (
        !session.done && window && !window.isDestroyed() && event.sender === window.webContents
      );
    }
    function selected(event, value) {
      if (!authorized(event)) return;
      if (value === null) {
        finish(null);
        return;
      }
      const region = normalizeRegion(value, bounds);
      if (!region) return;
      const crop = pixelRegion(region, session.image.getSize());
      if (crop.width < 1 || crop.height < 1) return;
      try {
        const referenceImage = session.image.crop(crop);
        if (referenceImage.isEmpty()) return;
        finish({ displayId: String(display.id), region, referenceImage });
      } catch (error) {
        finish(null, error);
      }
    }

    session.cancel = () => finish(null);
    screen.on('display-removed', displayRemoved);
    screen.on('display-metrics-changed', displayChanged);
    hud.once('closed', ownerClosed);

    void (async () => {
      try {
        if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite))
          throw new Error(text('displayUnreadable'));
        if (bounds.width <= 0 || bounds.height <= 0) throw new Error(text('displaySizeInvalid'));
        if (session.wasVisible) hud.hide();
        // 让桌面合成器移除 HUD，避免参考图包含提示条本身。
        await new Promise(ready => {
          session.finishWait = ready;
          session.waitTimer = setTimeout(ready, 100);
        });
        session.waitTimer = null;
        session.finishWait = null;
        if (session.done || disposed) return;
        const scale = Number.isFinite(display.scaleFactor) ? Math.max(1, display.scaleFactor) : 1;
        const ratio = Math.min(1, 8192 / Math.max(bounds.width * scale, bounds.height * scale));
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: {
            width: Math.max(1, Math.round(bounds.width * scale * ratio)),
            height: Math.max(1, Math.round(bounds.height * scale * ratio)),
          },
          fetchWindowIcons: false,
        });
        if (session.done || disposed) return;
        const image = sources.find(source => source.display_id === String(display.id))?.thumbnail;
        if (!image || image.isEmpty()) throw new Error(text('captureDenied'));
        const size = image.getSize();
        if (![size.width, size.height].every(value => Number.isInteger(value) && value > 0))
          throw new Error(text('captureSizeInvalid'));
        session.image = image;
        const window = new BrowserWindow({
          icon: path.join(__dirname, '../../../assets/icon.ico'),
          ...bounds,
          frame: false,
          resizable: false,
          movable: false,
          minimizable: false,
          maximizable: false,
          fullscreenable: false,
          skipTaskbar: true,
          alwaysOnTop: true,
          show: false,
          backgroundColor: '#000000',
          title: text('pickerTitle'),
          webPreferences: {
            preload: path.join(__dirname, '../preload/picker.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
          },
        });
        session.window = window;
        window.setAlwaysOnTop(true, 'screen-saver');
        window.setMenuBarVisibility(false);
        window.webContents.on('will-navigate', event => event.preventDefault());
        window.webContents.on('will-redirect', event => event.preventDefault());
        window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
        window.once('closed', pickerClosed);
        ipcMain.handle(INIT_CHANNEL, event =>
          authorized(event)
            ? {
                image: session.image.toDataURL(),
                minSize: MIN_DIP,
                displayLabel: display.label || '',
                locale: locale(),
                labels: Object.fromEntries(
                  [
                    'pickerTitle',
                    'pickerImageAlt',
                    'pickerAreaLabel',
                    'pickerHeading',
                    'pickerHelp',
                    'pickerConfirm',
                    'pickerCancel',
                    'pickerReading',
                    'pickerReselect',
                    'pickerMinimum',
                    'pickerDragAgain',
                    'pickerDrag',
                    'pickerLoadFailed',
                    'pickerExpired',
                  ].map(key => [key, text(key)]),
                ),
              }
            : null,
        );
        session.handlersInstalled = true;
        ipcMain.on(SELECT_CHANNEL, selected);
        window.once('ready-to-show', () => {
          if (!session.done && !window.isDestroyed()) window.show();
        });
        await window.loadFile(path.join(__dirname, '../picker/region-picker.html'));
      } catch (error) {
        finish(null, error);
      }
    })();
    return result;
  }

  return {
    pick,
    dispose() {
      disposed = true;
      active?.cancel();
    },
  };
}

module.exports = { createRegionPicker, normalizeRegion, pixelRegion };
