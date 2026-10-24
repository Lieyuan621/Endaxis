const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { createRegionPicker, normalizeRegion, pixelRegion } = require('./region-picker.cjs');

const INIT = 'endaxis:region-picker:init';
const SELECT = 'endaxis:region-picker:select';
const waitForCapture = () => new Promise(resolve => setTimeout(resolve, 120));
const flush = () => new Promise(resolve => setImmediate(resolve));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function fixture({ visible = true, capture } = {}) {
  const handlers = new Map();
  const ipcMain = new EventEmitter();
  ipcMain.handle = (channel, callback) => handlers.set(channel, callback);
  ipcMain.removeHandler = channel => handlers.delete(channel);
  const screen = new EventEmitter();
  const display = {
    id: 20,
    label: 'Secondary display',
    bounds: { x: -1280, y: 100, width: 1280, height: 720 },
    scaleFactor: 1.5,
  };
  screen.getDisplayMatching = () => display;
  const hud = new EventEmitter();
  Object.assign(hud, {
    visible,
    hidden: 0,
    restored: 0,
    isDestroyed: () => Boolean(hud.destroyed),
    isVisible: () => hud.visible,
    getBounds: () => ({ x: -1000, y: 140, width: 900, height: 200 }),
    hide() {
      hud.hidden++;
      hud.visible = false;
    },
    showInactive() {
      hud.restored++;
      hud.visible = true;
    },
  });
  const windows = [];
  class BrowserWindow extends EventEmitter {
    constructor(options) {
      super();
      this.options = options;
      this.webContents = new EventEmitter();
      this.webContents.setWindowOpenHandler = handler => (this.openHandler = handler);
      windows.push(this);
    }
    isDestroyed() {
      return Boolean(this.destroyed);
    }
    setAlwaysOnTop(value, level) {
      this.topmost = { value, level };
    }
    setMenuBarVisibility() {}
    loadFile(file) {
      this.file = file;
      return Promise.resolve();
    }
    show() {
      this.shown = true;
    }
    destroy() {
      this.destroyed = true;
      this.emit('closed');
    }
  }
  const crops = [];
  const referenceImage = { isEmpty: () => false };
  const image = {
    isEmpty: () => false,
    // Deliberately differs from requested 1920×1080 and from the DIP dimensions.
    getSize: () => ({ width: 1600, height: 900 }),
    toDataURL: () => 'data:image/png;base64,frozen-frame',
    crop: bounds => {
      crops.push(bounds);
      return referenceImage;
    },
  };
  const calls = [];
  const desktopCapturer = {
    getSources(options) {
      calls.push({ options, hudVisible: hud.visible });
      return capture
        ? capture(options)
        : Promise.resolve([
            { display_id: '10', thumbnail: { isEmpty: () => true } },
            { display_id: '20', thumbnail: image },
          ]);
    },
  };
  const picker = createRegionPicker({
    BrowserWindow,
    ipcMain,
    screen,
    desktopCapturer,
    owner: () => hud,
  });
  const select = (value, sender = windows[0]?.webContents) =>
    ipcMain.emit(SELECT, { sender }, value);
  const initialize = (sender = windows[0]?.webContents) => handlers.get(INIT)?.({ sender });
  return {
    picker,
    windows,
    handlers,
    ipcMain,
    screen,
    display,
    hud,
    image,
    referenceImage,
    crops,
    calls,
    select,
    initialize,
  };
}

test('regions reject malformed or out-of-range IPC and use actual screenshot pixels', () => {
  const bounds = { width: 1280, height: 720 };
  for (const value of [
    null,
    {},
    { x: 0, y: 0, width: NaN, height: 1 },
    { x: '0', y: 0, width: 0.2, height: 0.2 },
    { x: -0.1, y: 0, width: 0.2, height: 0.2 },
    { x: 0.9, y: 0, width: 0.2, height: 0.2 },
    { x: 0, y: 0.9, width: 0.2, height: 0.2 },
    { x: 0, y: 0, width: 0, height: 0.2 },
    { x: 0, y: 0, width: 0.005, height: 0.2 },
  ]) {
    assert.equal(normalizeRegion(value, bounds), null);
  }
  const region = normalizeRegion({ x: 0.125, y: 0.25, width: 0.5, height: 0.25 }, bounds);
  assert.deepEqual(pixelRegion(region, { width: 1600, height: 900 }), {
    x: 200,
    y: 225,
    width: 800,
    height: 225,
  });
});

test('selection crops the frozen frame, isolates picker IPC and restores the HUD without focus', async () => {
  const f = fixture();
  try {
    const result = f.picker.pick();
    assert.equal(f.hud.hidden, 1);
    assert.equal(await f.picker.pick(), null);
    await waitForCapture();
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].hudVisible, false);
    assert.deepEqual(f.calls[0].options.thumbnailSize, { width: 1920, height: 1080 });
    const window = f.windows[0];
    assert.deepEqual(window.options.webPreferences, {
      preload: path.join(__dirname, '../preload/picker.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    });
    assert.equal(window.options.x, -1280);
    assert.equal(window.options.y, 100);
    assert.equal(window.options.width, 1280);
    assert.equal(f.initialize(f.hud), null);
    assert.equal(f.initialize().image, 'data:image/png;base64,frozen-frame');
    const region = { x: 0.125, y: 0.25, width: 0.5, height: 0.25 };
    f.select(region, f.hud);
    f.select({ ...region, width: Infinity });
    assert.equal(f.crops.length, 0);
    assert.equal(window.isDestroyed(), false);
    let prevented = 0;
    window.webContents.emit('will-navigate', { preventDefault: () => prevented++ });
    window.webContents.emit('will-redirect', { preventDefault: () => prevented++ });
    assert.equal(prevented, 2);
    assert.deepEqual(window.openHandler({ url: 'https://example.com' }), { action: 'deny' });
    f.select(region);
    assert.deepEqual(await result, { displayId: '20', region, referenceImage: f.referenceImage });
    assert.deepEqual(f.crops, [{ x: 200, y: 225, width: 800, height: 225 }]);
    assert.equal(f.calls.length, 1);
    assert.equal(f.hud.restored, 1);
    assert.equal(window.isDestroyed(), true);
    assert.equal(f.handlers.size, 0);
    assert.equal(f.ipcMain.listenerCount(SELECT), 0);
    assert.equal(f.screen.listenerCount('display-metrics-changed'), 0);
    assert.equal(f.screen.listenerCount('display-removed'), 0);
    assert.equal(f.hud.listenerCount('closed'), 0);
  } finally {
    f.picker.dispose();
  }
});

test('cancel and native close resolve null and preserve an originally hidden HUD', async () => {
  const f = fixture({ visible: false });
  try {
    let result = f.picker.pick();
    await waitForCapture();
    f.select(null, f.hud);
    assert.equal(f.windows[0].isDestroyed(), false);
    f.select(null);
    assert.equal(await result, null);
    assert.equal(f.hud.restored, 0);
    assert.equal(f.hud.hidden, 0);
    result = f.picker.pick();
    await waitForCapture();
    f.windows[1].emit('closed');
    assert.equal(await result, null);
    assert.equal(f.handlers.size, 0);
    assert.equal(f.ipcMain.listenerCount(SELECT), 0);
    assert.equal(f.hud.restored, 0);
  } finally {
    f.picker.dispose();
  }
});

test('dispose before capture delay restores immediately without capturing or opening a window', async () => {
  const f = fixture();
  const result = f.picker.pick();
  f.picker.dispose();
  assert.equal(await result, null);
  await flush();
  assert.equal(f.hud.restored, 1);
  assert.equal(f.calls.length, 0);
  assert.equal(f.windows.length, 0);
  assert.equal(await f.picker.pick(), null);
});

test('dispose during asynchronous capture cannot create an orphan picker', async () => {
  const capture = deferred();
  const f = fixture({ capture: () => capture.promise });
  const result = f.picker.pick();
  await waitForCapture();
  assert.equal(f.calls.length, 1);
  f.picker.dispose();
  assert.equal(await result, null);
  assert.equal(f.hud.restored, 1);
  capture.resolve([{ display_id: '20', thumbnail: f.image }]);
  await flush();
  assert.equal(f.windows.length, 0);
  assert.equal(f.handlers.size, 0);
});

test('display changes and HUD closure cancel instead of using stale screen coordinates', async () => {
  for (const reason of ['metrics', 'removed', 'owner']) {
    const f = fixture();
    try {
      const result = f.picker.pick();
      await waitForCapture();
      if (reason === 'owner') {
        f.hud.destroyed = true;
        f.hud.emit('closed');
      } else {
        f.screen.emit(
          reason === 'metrics' ? 'display-metrics-changed' : 'display-removed',
          {},
          f.display,
        );
      }
      assert.equal(await result, null);
      assert.equal(f.windows[0].isDestroyed(), true);
      assert.equal(f.handlers.size, 0);
      assert.equal(f.screen.listenerCount('display-removed'), 0);
      assert.equal(f.hud.restored, reason === 'owner' ? 0 : 1);
    } finally {
      f.picker.dispose();
    }
  }
});

test('capture failure restores the HUD and releases resources for a retry', async () => {
  const f = fixture({ capture: () => Promise.reject(new Error('denied')) });
  try {
    const result = f.picker.pick();
    await assert.rejects(result, /denied/);
    assert.equal(f.hud.restored, 1);
    assert.equal(f.windows.length, 0);
    assert.equal(f.screen.listenerCount('display-metrics-changed'), 0);
    await assert.rejects(f.picker.pick(), /denied/);
    assert.equal(f.calls.length, 2);
  } finally {
    f.picker.dispose();
  }
});

test('picker preload exposes only initialization, normalized selection and cancellation', () => {
  const calls = [];
  let exposed;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../preload/picker.cjs'), 'utf8'), {
    require: name => {
      assert.equal(name, 'electron');
      return {
        contextBridge: {
          exposeInMainWorld: (name, value) => {
            exposed = { name, value };
          },
        },
        ipcRenderer: {
          invoke: channel => calls.push([channel]),
          send: (channel, value) => calls.push([channel, value]),
        },
      };
    },
  });
  assert.equal(exposed.name, 'endaxisRegionPicker');
  assert.deepEqual(Object.keys(exposed.value).sort(), ['cancel', 'confirm', 'initialize']);
  exposed.value.initialize();
  exposed.value.confirm({ x: 0, y: 0.1, width: 0.2, height: 0.3, forbidden: 'ignored' });
  exposed.value.cancel();
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    [INIT],
    [SELECT, { x: 0, y: 0.1, width: 0.2, height: 0.3 }],
    [SELECT, null],
  ]);
});

test('picker interaction confirms a reversed drag once and keeps Escape available', async () => {
  class Element extends EventEmitter {
    constructor() {
      super();
      this.style = {};
      this.clientHeight = 720;
      this.classList = { toggle() {} };
    }
    addEventListener(name, listener) {
      this.on(name, listener);
    }
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 1280, height: 720 };
    }
    setPointerCapture() {}
    releasePointerCapture() {}
    setAttribute() {}
  }
  const elements = new Map(
    [
      'screen',
      'selection-area',
      'selection',
      'confirm',
      'cancel',
      'help',
      'status',
      'heading',
      'description',
    ].map(name => [name, new Element()]),
  );
  const window = new Element();
  const calls = [];
  window.endaxisRegionPicker = {
    initialize: async () => ({ image: 'data:image/png;base64,frozen', minSize: 8 }),
    confirm: region => calls.push({ region }),
    cancel: () => calls.push({ cancel: true }),
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../picker/region-picker.js'), 'utf8'), {
    window,
    document: { getElementById: name => elements.get(name) },
  });
  await flush();
  elements.get('screen').emit('load');
  const area = elements.get('selection-area');
  area.emit('pointerdown', { clientX: 800, clientY: 360, pointerId: 1, button: 0 });
  area.emit('pointermove', { clientX: 160, clientY: 180, pointerId: 1 });
  window.emit('keydown', { code: 'Enter', preventDefault() {} });
  assert.equal(calls.length, 0);
  area.emit('pointerup', { clientX: 160, clientY: 180, pointerId: 1 });
  assert.equal(elements.get('confirm').disabled, false);
  window.emit('keydown', { code: 'Enter', preventDefault() {} });
  elements.get('confirm').emit('click');
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    { region: { x: 0.125, y: 0.25, width: 0.5, height: 0.25 } },
  ]);
  window.emit('keydown', { code: 'Escape', preventDefault() {} });
  assert.deepEqual(calls[1], { cancel: true });
});
