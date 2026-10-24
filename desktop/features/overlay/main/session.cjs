const { createInputFeedback } = require('./input-feedback.cjs');
const { createToolbar } = require('./toolbar.cjs');
const fs = require('node:fs');
const path = require('node:path');
const { createCountdownTrigger } = require('./countdown-trigger.cjs');
const { createRegionPicker } = require('./region-picker.cjs');
const { protectWindow, isWindowSender } = require('../../../app/protocol.cjs');
const { message, normalizeLocale } = require('../../../app/messages.cjs');

function fitBounds(bounds, area) {
  if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) return null;
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  const width = Math.min(Math.max(640, Math.round(bounds.width)), area.width);
  const height = Math.min(Math.max(150, Math.round(bounds.height)), area.height);
  return {
    x: Math.min(Math.max(area.x, Math.round(bounds.x)), area.x + area.width - width),
    y: Math.min(Math.max(area.y, Math.round(bounds.y)), area.y + area.height - height),
    width,
    height,
  };
}

function readPosition(file) {
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (Number.isFinite(value?.x) && Number.isFinite(value?.y))
      return {
        x: Math.round(value.x),
        y: Math.round(value.y),
        ...(Number.isFinite(value.width) && value.width >= 640
          ? { width: Math.round(value.width) }
          : {}),
        ...(Number.isFinite(value.height) && value.height >= 180
          ? { height: Math.round(value.height) }
          : {}),
      };
  } catch {}
  return null;
}

const SETTINGS_COMMANDS = new Set([
  'resetPreferences',
  'reload',
  'countdownSelect',
  'countdownArm',
  'countdownClear',
  'countdownStop',
]);
const PREFERENCE_KEYS = new Set([
  'secondsAhead',
  'scale',
  'showBasic',
  'showHeavy',
  'showStatusEffects',
  'layoutMode',
  'labelMode',
  'inputFeedback',
  'inputTolerance',
  'playbackMode',
  'showResources',
  'transparent',
  'width',
  'hudOpacity',
  'compactMode',
  'startDelaySeconds',
]);

function settingsCommand(value) {
  if (!value || typeof value !== 'object') return null;
  if (SETTINGS_COMMANDS.has(value.type)) return { type: value.type };
  if (
    value.type !== 'patch' ||
    !value.patch ||
    typeof value.patch !== 'object' ||
    Array.isArray(value.patch)
  )
    return null;
  const patch = {};
  for (const [key, item] of Object.entries(value.patch)) {
    if (!PREFERENCE_KEYS.has(key) || !['string', 'number', 'boolean'].includes(typeof item))
      return null;
    if (typeof item === 'number' && !Number.isFinite(item)) return null;
    patch[key] = item;
  }
  return { type: 'patch', patch };
}

/** One live HUD owns all native feature resources. Nothing survives its disposal. */
function createOverlaySession(electron, options, services = {}) {
  const { BrowserWindow, ipcMain, globalShortcut, screen } = electron;
  const { urls, dataRoot, args = new Map(), openEditor, quit, onClosed } = options;
  let locale = normalizeLocale(options.locale);
  let disposed = false;
  let generation = 0;
  let settings = null;
  let state = null;
  let inputFeedback = null;
  let trigger = null;
  let picker = null;
  let clickThrough = false;
  let playbackShortcutsAvailable = true;
  let topmostTimer = null;
  let captureTimer = null;
  const channels = [];
  const shortcuts = [];
  const stateFile = path.join(dataRoot, 'window-state.json');
  const position = readPosition(stateFile);
  const size = {
    width: Number(args.get('width')) || position?.width || 1120,
    height: Number(args.get('height')) || position?.height || 260,
  };
  const area = position
    ? screen.getDisplayMatching({ ...position, ...size }).workArea
    : screen.getPrimaryDisplay().workArea;
  const initial = fitBounds(
    {
      ...size,
      x: position?.x ?? area.x + (area.width - size.width) / 2,
      y: position?.y ?? area.y + 40,
    },
    area,
  );
  if (!initial) throw new TypeError('Invalid overlay window bounds.');
  const hud = new BrowserWindow({
    icon: path.join(__dirname, '../../../assets/icon.ico'),
    ...initial,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: true,
    minWidth: 640,
    minHeight: 180,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    title: message(locale, 'hudTitle'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/hud.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  let toolbar = null;
  function sendHud(channel, value) {
    if (!disposed && !hud.isDestroyed()) hud.webContents.send(channel, value);
  }
  function sendState() {
    toolbar?.publish();
    if (!disposed && settings && !settings.isDestroyed())
      settings.webContents.send('endaxis:overlay-settings:state', state);
  }
  function countdown() {
    if (!trigger)
      trigger = (services.createCountdownTrigger || createCountdownTrigger)({
        desktopCapturer: electron.desktopCapturer,
        screen,
        nativeImage: electron.nativeImage,
        stateFile: path.join(dataRoot, 'countdown-trigger.json'),
        text: key => message(locale, key),
        onUpdate: value => sendHud('endaxis:countdown-status', value),
        onTrigger: value => sendHud('endaxis:countdown-trigger', value),
      });
    return trigger;
  }
  function cancelPicker() {
    picker?.dispose();
    picker = null;
  }
  async function selectRegion() {
    const token = ++generation;
    countdown().disarm();
    if (!picker)
      picker = (services.createRegionPicker || createRegionPicker)({
        BrowserWindow,
        ipcMain,
        screen,
        desktopCapturer: electron.desktopCapturer,
        owner: () => (disposed ? null : hud),
        text: key => message(locale, key),
        locale: () => locale,
      });
    const settingsAtStart = settings;
    const settingsVisible =
      settingsAtStart && !settingsAtStart.isDestroyed() && settingsAtStart.isVisible();
    if (settingsVisible) settingsAtStart.hide();
    try {
      const selection = await picker.pick();
      if (disposed || token !== generation) return null;
      return selection ? countdown().configure(selection) : countdown().info();
    } finally {
      if (
        !disposed &&
        settingsVisible &&
        settings === settingsAtStart &&
        !settingsAtStart.isDestroyed()
      )
        settingsAtStart.show();
    }
  }
  function setClickThrough(next) {
    if (disposed || typeof next !== 'boolean') return clickThrough;
    clickThrough = next;
    hud.setIgnoreMouseEvents(clickThrough, { forward: true });
    sendHud('endaxis:click-through', clickThrough);
    toolbar?.publish();
    return clickThrough;
  }
  function fitDisplay() {
    if (disposed) return;
    const bounds = hud.getBounds();
    const next = fitBounds(bounds, screen.getDisplayMatching(bounds).workArea);
    if (next) hud.setBounds(next, false);
  }
  function handle(channel, owner, callback) {
    channels.push(channel);
    ipcMain.handle(channel, (event, ...values) => {
      if (disposed || !isWindowSender(event, owner())) return null;
      return callback(...values);
    });
  }
  function requestState() {
    sendHud('endaxis:overlay-settings:command', { type: 'requestState' });
  }
  function openSettings() {
    if (disposed) return;
    if (settings && !settings.isDestroyed()) {
      if (settings.isMinimized()) settings.restore();
      settings.show();
      settings.focus();
      requestState();
      return;
    }
    const workArea = screen.getDisplayMatching(hud.getBounds()).workArea;
    const width = Math.min(660, workArea.width);
    const height = Math.min(800, workArea.height);
    const window = new BrowserWindow({
      icon: path.join(__dirname, '../../../assets/icon.ico'),
      parent: hud,
      width,
      height,
      x: Math.round(workArea.x + (workArea.width - width) / 2),
      y: Math.round(workArea.y + (workArea.height - height) / 2),
      title: message(locale, 'settingsTitle'),
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/settings.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    settings = window;
    window.setMenuBarVisibility(false);
    window.setAlwaysOnTop(true, 'screen-saver');
    protectWindow(window, urls.settings);
    window.on('closed', () => {
      if (settings === window) settings = null;
    });
    window.webContents.on('did-finish-load', () => {
      if (!disposed && settings === window) {
        sendState();
        requestState();
      }
    });
    window.once('ready-to-show', () => {
      if (!disposed && !window.isDestroyed()) window.show();
    });
    requestState();
    void window.loadURL(urls.settings).catch(error => console.error('[endaxis]', error));
  }
  function register(key, callback) {
    const registered = globalShortcut.register(key, () => {
      if (!disposed) callback();
    });
    if (registered) shortcuts.push(key);
    else console.warn('[endaxis] Global shortcut unavailable:', key);
    return registered;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    generation++;
    try {
      const { x, y, width, height } = hud.getBounds();
      fs.mkdirSync(dataRoot, { recursive: true });
      fs.writeFileSync(stateFile, JSON.stringify({ x, y, width, height }), 'utf8');
    } catch {}
    inputFeedback?.dispose();
    inputFeedback = null;
    trigger?.dispose();
    trigger = null;
    cancelPicker();
    if (settings && !settings.isDestroyed()) settings.destroy();
    settings = null;
    toolbar?.dispose();
    toolbar = null;
    state = null;
    if (topmostTimer !== null) clearInterval(topmostTimer);
    if (captureTimer !== null) clearTimeout(captureTimer);
    topmostTimer = null;
    captureTimer = null;
    shortcuts.forEach(key => globalShortcut.unregister(key));
    channels.forEach(channel => ipcMain.removeHandler(channel));
    screen.removeListener('display-removed', fitDisplay);
    screen.removeListener('display-metrics-changed', fitDisplay);
  }

  try {
    toolbar = createToolbar(electron, {
      hud,
      url: urls.toolbar,
      getState: () => (state ? { ...state, clickThrough } : null),
      command: value => {
        if (value === 'settings') return openSettings();
        if (value === 'lock') return setClickThrough(!clickThrough);
        if (value === 'close') return hud.close();
        sendHud('endaxis:playback-command', value);
      },
    });
    hud.setAlwaysOnTop(true, 'screen-saver');
    hud.setMenuBarVisibility(false);
    protectWindow(hud, urls.hud);
    hud.webContents.on('did-start-loading', () => {
      if (disposed) return;
      generation++;
      trigger?.disarm();
      inputFeedback?.setEnabled(false);
      cancelPicker();
      state = null;
      sendState();
    });
    hud.once('ready-to-show', () => {
      if (!disposed && !hud.isDestroyed()) hud.showInactive();
    });
    hud.on('close', dispose);
    hud.on('closed', () => {
      dispose();
      onClosed?.();
    });
    topmostTimer = setInterval(() => {
      if (disposed || hud.isDestroyed()) return;
      hud.setAlwaysOnTop(true, 'screen-saver');
      if (settings && !settings.isDestroyed()) settings.setAlwaysOnTop(true, 'screen-saver');
    }, 2000);
    topmostTimer.unref?.();
    register('Control+Alt+O', () => setClickThrough(!clickThrough));
    register(
      'Control+Alt+R',
      () => void hud.loadURL(urls.hud).catch(error => console.error('[endaxis]', error)),
    );
    for (const [key, command] of [
      ['Control+Alt+Space', 'toggle'],
      ['Control+Alt+Home', 'restart'],
      ['Control+Alt+Left', 'backward'],
      ['Control+Alt+Right', 'forward'],
    ]) {
      if (!register(key, () => sendHud('endaxis:playback-command', command)))
        playbackShortcutsAvailable = false;
    }
    const fromHud = () => hud;
    const fromSettings = () => settings;
    handle('endaxis:input-feedback:enable', fromHud, enabled => {
      if (typeof enabled !== 'boolean') return false;
      if (!inputFeedback && enabled)
        inputFeedback = createInputFeedback(
          event => sendHud('endaxis:input-feedback:event', event),
          status => sendHud('endaxis:input-feedback:status', status),
        );
      inputFeedback?.setEnabled(enabled);
      return true;
    });
    handle('endaxis:desktop-info', fromHud, () => ({
      clickThrough,
      playbackShortcutsAvailable,
      countdownTriggerAvailable: true,
      url: urls.hud,
      alwaysOnTop: hud.isAlwaysOnTop(),
    }));
    handle('endaxis:toggle-click-through', fromHud, () => setClickThrough(!clickThrough));
    handle('endaxis:set-click-through', fromHud, setClickThrough);
    handle('endaxis:open-editor', fromHud, openEditor);
    handle('endaxis:quit', fromHud, quit);
    handle('endaxis:close-overlay', fromHud, () => hud.close());
    handle('endaxis:countdown-info', fromHud, () => countdown().info());
    handle('endaxis:countdown-select', fromHud, selectRegion);
    handle('endaxis:countdown-arm', fromHud, () => countdown().arm());
    handle('endaxis:countdown-disarm', fromHud, () => countdown().disarm());
    handle('endaxis:countdown-clear', fromHud, () => countdown().clear());
    handle('endaxis:overlay-settings:open', fromHud, openSettings);
    handle('endaxis:overlay-settings:publish', fromHud, value => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
      state = value;
      if (value.locale === 'zh-CN' || value.locale === 'en') locale = value.locale;
      if (settings && !settings.isDestroyed()) settings.setTitle(message(locale, 'settingsTitle'));
      sendState();
      return true;
    });
    handle('endaxis:overlay-settings:get-state', fromSettings, () => {
      requestState();
      return state;
    });
    handle('endaxis:overlay-settings:command', fromSettings, value => {
      const command = settingsCommand(value);
      if (!command) return false;
      sendHud('endaxis:overlay-settings:command', command);
      return true;
    });
    handle('endaxis:overlay-settings:close', fromSettings, () => settings?.close());
    screen.on('display-removed', fitDisplay);
    screen.on('display-metrics-changed', fitDisplay);
    if (args.has('capture'))
      hud.webContents.once('did-finish-load', () => {
        const token = generation;
        captureTimer = setTimeout(async () => {
          try {
            if (disposed || token !== generation) return;
            const image = await hud.webContents.capturePage();
            if (disposed || token !== generation) return;
            fs.writeFileSync(args.get('capture'), image.toPNG());
            quit();
          } catch (error) {
            console.error('[endaxis] Capture failed:', error);
          }
        }, 6000);
      });
    void hud.loadURL(urls.hud).catch(error => console.error('[endaxis]', error));
  } catch (error) {
    dispose();
    if (!hud.isDestroyed()) hud.destroy();
    throw error;
  }
  return {
    hud,
    get settings() {
      return settings;
    },
    get disposed() {
      return disposed;
    },
    show() {
      if (!disposed && !hud.isDestroyed()) hud.showInactive();
    },
    close() {
      if (!hud.isDestroyed()) hud.close();
      else dispose();
    },
    destroy() {
      dispose();
      if (!hud.isDestroyed()) hud.destroy();
    },
  };
}

module.exports = { createOverlaySession, fitBounds, readPosition, settingsCommand };
