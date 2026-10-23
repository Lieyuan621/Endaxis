const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const path = require('node:path');
const os = require('node:os');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const { startDesktop, fitBounds } = require('./main.cjs');
const { startServer, serverOptions, workspaceIdentity, validateUrl } = require('./server.cjs');
const { launch } = require('./launch.cjs');

function desktopFixture({ lock = true, unlockShortcut = true, unavailableShortcuts = [] } = {}) {
  const windows = [];
  const handlers = new Map();
  const shortcuts = new Map();
  const paths = { appData: path.join(os.tmpdir(), 'endaxis-desktop-tests') };
  const app = new EventEmitter();
  Object.assign(app, {
    quits: 0,
    getPath: key => paths[key],
    setPath: (key, value) => {
      paths[key] = value;
    },
    requestSingleInstanceLock: () => lock,
    whenReady: () => Promise.resolve(),
    quit() {
      app.quits++;
      app.emit('before-quit', { preventDefault() {} });
    },
    exit(code) {
      app.exitCode = code;
    },
  });
  class BrowserWindow extends EventEmitter {
    constructor(options) {
      super();
      this.options = options;
      this.bounds = { x: 0, y: 0, width: options.width, height: options.height, ...options };
      this.webContents = new EventEmitter();
      this.messages = [];
      this.webContents.send = (...message) => this.messages.push(message);
      this.webContents.setWindowOpenHandler = () => {};
      windows.push(this);
    }
    isDestroyed() {
      return Boolean(this.destroyed);
    }
    isMinimized() {
      return false;
    }
    restore() {}
    focus() {
      this.focused = true;
    }
    show() {}
    showInactive() {
      this.shownInactive = true;
    }
    setMenuBarVisibility() {}
    setAlwaysOnTop() {}
    isAlwaysOnTop() {
      return true;
    }
    loadURL(url) {
      this.url = url;
      return Promise.resolve();
    }
    reload() {}
    setIgnoreMouseEvents(value) {
      this.ignored = value;
    }
    getBounds() {
      return this.bounds;
    }
    setBounds(bounds) {
      this.bounds = bounds;
    }
  }
  const screen = new EventEmitter();
  const primary = { workArea: { x: 0, y: 0, width: 1920, height: 1080 } };
  const secondary = { workArea: { x: -1920, y: 0, width: 1920, height: 1080 } };
  screen.getPrimaryDisplay = () => primary;
  screen.getDisplayMatching = bounds => (bounds.x < 0 ? secondary : primary);
  const electron = {
    app,
    BrowserWindow,
    screen,
    globalShortcut: {
      register(key, handler) {
        const accepted =
          (key !== 'Control+Alt+O' || unlockShortcut) && !unavailableShortcuts.includes(key);
        if (accepted) shortcuts.set(key, handler);
        return accepted;
      },
      unregisterAll: () => shortcuts.clear(),
    },
    ipcMain: {
      handle: (channel, handler) => handlers.set(channel, handler),
      removeHandler: channel => handlers.delete(channel),
    },
  };
  const call = (channel, value, sender = windows[0]?.webContents) =>
    handlers.get(channel)({ sender }, value);
  return { electron, app, windows, handlers, shortcuts, screen, call, paths };
}

test('Electron bootstrap creates the HUD even when require.main belongs to its loader', async () => {
  const fixture = desktopFixture();
  const entryRequire = id => (id === 'electron' ? fixture.electron : require(id));
  entryRequire.main = { filename: 'electron' };
  try {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'main.cjs'), 'utf8'), {
      require: entryRequire,
      module: { exports: {} },
      __dirname,
      process: {
        type: 'browser',
        argv: ['electron', '--url=https://example.test/overlay', '--no-editor'],
      },
      console,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
    });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(fixture.windows.length, 1);
    assert.equal(fixture.windows[0].url, 'https://example.test/overlay');
  } finally {
    fixture.app.quit();
  }
});

test('countdown IPC is HUD-only, emits only to its HUD and releases monitoring and picker on reload/quit', async () => {
  const fixture = desktopFixture();
  const counts = { created: 0, armed: 0, stopped: 0, disposed: 0, selected: 0, pickerDisposed: 0 };
  const state = { phase: 'ready', configured: true, armed: false };
  let callbacks;
  const service = {
    info: () => state,
    arm: () => {
      counts.armed++;
      return state;
    },
    disarm: () => {
      counts.stopped++;
      return state;
    },
    configure: selection => {
      assert.equal(selection.displayId, '1');
      counts.selected++;
      return state;
    },
    clear: () => state,
    dispose: () => {
      counts.disposed++;
    },
  };
  try {
    await startDesktop(fixture.electron, ['--url=https://example.test/overlay'], {
      createCountdownTrigger: options => {
        counts.created++;
        callbacks = options;
        return service;
      },
      createRegionPicker: () => ({
        pick: async () => ({ displayId: '1' }),
        dispose: () => {
          counts.pickerDisposed++;
        },
      }),
    });
    await new Promise(resolve => setImmediate(resolve));
    const hud = fixture.windows[0];
    const editor = fixture.windows[1];
    assert.equal(fixture.call('endaxis:countdown-info', undefined, editor.webContents), null);
    assert.equal(counts.created, 0);
    assert.deepEqual(fixture.call('endaxis:countdown-info'), state);
    assert.equal(counts.created, 1);
    assert.equal(path.basename(callbacks.stateFile), 'countdown-trigger.json');
    fixture.call('endaxis:countdown-arm', undefined, editor.webContents);
    assert.equal(counts.armed, 0);
    fixture.call('endaxis:countdown-arm');
    assert.equal(counts.armed, 1);
    await fixture.call('endaxis:countdown-select');
    assert.equal(counts.selected, 1);
    callbacks.onUpdate(state);
    callbacks.onTrigger({ elapsedSeconds: 0.2 });
    assert.deepEqual(hud.messages.slice(-2), [
      ['endaxis:countdown-status', state],
      ['endaxis:countdown-trigger', { elapsedSeconds: 0.2 }],
    ]);
    assert.equal(editor.messages.length, 0);
    hud.webContents.emit('did-start-loading');
    assert.equal(counts.pickerDisposed, 1);
    assert.ok(counts.stopped >= 2);
  } finally {
    fixture.app.quit();
  }
  assert.equal(counts.disposed, 1);
  assert.equal(fixture.handlers.size, 0);
});

test('single-instance ownership precedes starting a worktree server; second invocation focuses its editor', async () => {
  let starts = 0;
  let closes = 0;
  const fixture = desktopFixture();
  const start = async () => {
    starts++;
    return {
      server: {
        close: async () => {
          closes++;
        },
      },
      url: 'http://127.0.0.1:31337/overlay',
    };
  };
  await startDesktop(fixture.electron, ['--no-editor'], { startServer: start });
  assert.equal(starts, 1);
  assert.equal(fixture.windows.length, 1);
  fixture.app.emit('second-instance');
  assert.equal(fixture.windows.length, 2);
  assert.equal(fixture.windows[1].url, 'http://127.0.0.1:31337/');
  assert.equal(
    path.basename(fixture.windows[1].options.webPreferences.preload),
    'editor-preload.cjs',
  );
  assert.equal(path.basename(fixture.windows[0].options.webPreferences.preload), 'preload.cjs');
  assert.equal(fixture.call('endaxis:show-overlay'), null);
  fixture.call('endaxis:show-overlay', undefined, fixture.windows[1].webContents);
  assert.equal(fixture.windows[0].shownInactive, true);
  assert.equal(
    fixture.windows[0].options.webPreferences.partition,
    fixture.windows[1].options.webPreferences.partition,
  );
  fixture.app.emit('second-instance');
  assert.equal(fixture.windows.length, 2);
  assert.equal(fixture.windows[1].focused, true);
  fixture.app.quit();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(closes, 1);
  assert.equal(fixture.handlers.size, 0);
  assert.equal(fixture.shortcuts.size, 0);
  assert.equal(fixture.screen.listenerCount('display-removed'), 0);

  const duplicate = desktopFixture({ lock: false });
  await startDesktop(duplicate.electron, [], { startServer: start });
  assert.equal(starts, 1);
  assert.equal(duplicate.windows.length, 0);
  assert.equal(duplicate.app.quits, 1);
});

test('a conflicting recovery shortcut disables click-through, including IPC, while editor remains reopenable', async () => {
  const fixture = desktopFixture({ unlockShortcut: false });
  await startDesktop(fixture.electron, ['--url=http://127.0.0.1:31337/overlay']);
  try {
    assert.equal(fixture.windows.length, 2);
    assert.equal(fixture.call('endaxis:desktop-info').clickThroughAvailable, false);
    assert.equal(fixture.call('endaxis:set-click-through', true), false);
    assert.equal(fixture.call('endaxis:toggle-click-through'), false);
    assert.equal(fixture.windows[0].ignored, false);
    fixture.call('endaxis:open-editor');
    assert.equal(fixture.windows[1].focused, true);
    assert.equal(fixture.call('endaxis:quit', undefined, fixture.windows[1].webContents), null);
    assert.equal(fixture.app.quits, 0);
  } finally {
    fixture.app.quit();
  }
});

test('resizing remains on a secondary display, rejects malformed IPC, and clamps the full window', async () => {
  const fixture = desktopFixture();
  await startDesktop(fixture.electron, ['--url=https://example.test/overlay', '--no-editor']);
  try {
    const hud = fixture.windows[0];
    hud.setBounds({ x: -720, y: 950, width: 640, height: 150 });
    assert.deepEqual(fixture.call('endaxis:resize', { width: 1400, height: 500 }), {
      x: -1400,
      y: 580,
      width: 1400,
      height: 500,
    });
    const before = { ...hud.getBounds() };
    for (const size of [
      { width: Infinity, height: 200 },
      { width: '1200', height: 200 },
      { width: 800, height: -1 },
      {},
    ]) {
      assert.equal(fixture.call('endaxis:resize', size), null);
      assert.deepEqual(hud.getBounds(), before);
    }
    assert.equal(fixture.call('endaxis:set-click-through', true), true);
    assert.equal(fixture.call('endaxis:set-click-through', 'false'), true);
    fixture.shortcuts.get('Control+Alt+O')();
    assert.equal(hud.ignored, false);
    assert.deepEqual(
      fitBounds(
        { x: -1900, y: 100, width: 3000, height: 3000 },
        { x: -1920, y: 0, width: 1920, height: 1080 },
      ),
      {
        x: -1920,
        y: 0,
        width: 1920,
        height: 1080,
      },
    );
  } finally {
    fixture.app.quit();
  }
});

test('worktree server never reuses an occupied service; failed startup closes its own server', async () => {
  let received;
  let closes = 0;
  const root = path.resolve('worktree-a');
  const collision = new Error('Port is already in use');
  await assert.rejects(
    startServer(root, async options => {
      received = options;
      return {
        listen: async () => {
          throw collision;
        },
        close: async () => {
          closes++;
        },
      };
    }),
    collision,
  );
  assert.equal(received.root, root);
  assert.equal(received.server.strictPort, true);
  assert.equal(received.server.host, '127.0.0.1');
  assert.equal(received.server.port, serverOptions(root).server.port);
  assert.notEqual(workspaceIdentity(root), workspaceIdentity(path.resolve('worktree-b')));
  assert.equal(closes, 1);
});

test('explicit HTTP URL skips local server; unsupported URLs cannot spawn Electron', async () => {
  const fixture = desktopFixture();
  let starts = 0;
  await startDesktop(
    fixture.electron,
    ['--url=https://example.test/overlay?demo=1', '--no-editor'],
    {
      startServer: async () => {
        starts++;
        throw new Error('must not start');
      },
    },
  );
  try {
    assert.equal(starts, 0);
    assert.equal(fixture.windows[0].url, 'https://example.test/overlay?demo=1');
    assert.equal(
      validateUrl('http://127.0.0.1:31337/overlay?demo=1'),
      'http://127.0.0.1:31337/overlay?demo=1',
    );
    let spawned = false;
    for (const url of [
      'file:///tmp/page.html',
      'javascript:alert(1)',
      'https://user:pass@example.test',
    ]) {
      assert.throws(() =>
        launch(
          [`--url=${url}`],
          () => {
            spawned = true;
          },
          () => 'electron',
        ),
      );
    }
    assert.equal(spawned, false);
  } finally {
    fixture.app.quit();
  }
});

test('quitting while the local server starts waits for cleanup without opening orphan windows', async () => {
  const fixture = desktopFixture();
  let resolveStart;
  let closes = 0;
  const ready = startDesktop(fixture.electron, [], {
    startServer: () =>
      new Promise(resolve => {
        resolveStart = resolve;
      }),
  });
  await new Promise(resolve => setImmediate(resolve));
  fixture.app.quit();
  resolveStart({
    server: {
      close: async () => {
        closes++;
      },
    },
    url: 'http://127.0.0.1:31337/overlay',
  });
  await ready;
  assert.equal(closes, 1);
  assert.equal(fixture.windows.length, 0);
  assert.equal(fixture.handlers.size, 0);
  assert.equal(fixture.shortcuts.size, 0);
});

test('global playback shortcuts send enumerated commands only to the live HUD without taking focus', async () => {
  const fixture = desktopFixture();
  await startDesktop(fixture.electron, ['--url=https://example.test/overlay']);
  try {
    const [hud, editor] = fixture.windows;
    const dispatch = [
      ['Control+Alt+Space', 'toggle'],
      ['Control+Alt+Home', 'restart'],
      ['Control+Alt+Left', 'backward'],
      ['Control+Alt+Right', 'forward'],
    ];
    assert.equal(fixture.call('endaxis:desktop-info').playbackShortcutsAvailable, true);
    for (const [key, command] of dispatch) {
      fixture.shortcuts.get(key)();
      assert.deepEqual(hud.messages.at(-1), ['endaxis:playback-command', command]);
    }
    assert.equal(hud.messages.length, 4);
    assert.equal(editor.messages.length, 0);
    assert.equal(hud.focused, undefined);
    assert.equal(editor.focused, undefined);
    assert.equal(hud.shownInactive, undefined);
    hud.destroyed = true;
    fixture.shortcuts.get('Control+Alt+Space')();
    assert.equal(hud.messages.length, 4);
  } finally {
    fixture.app.quit();
  }

  const partial = desktopFixture({ unavailableShortcuts: ['Control+Alt+Home'] });
  await startDesktop(partial.electron, ['--url=https://example.test/overlay', '--no-editor']);
  try {
    const info = partial.call('endaxis:desktop-info');
    assert.equal(info.playbackShortcutsAvailable, false);
    assert.equal(info.clickThroughAvailable, true);
    assert.equal(partial.call('endaxis:set-click-through', true), true);
    partial.shortcuts.get('Control+Alt+Space')();
    assert.deepEqual(partial.windows[0].messages.at(-1), ['endaxis:playback-command', 'toggle']);
  } finally {
    partial.app.quit();
  }
});
