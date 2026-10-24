const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function fixture(t, { packaged = false, lock = true, unavailableShortcuts = [] } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'endaxis-native-'));
  const windows = [];
  const handlers = new Map();
  const shortcuts = new Map();
  const protocols = new Map();
  const paths = { appData: directory, exe: path.join(directory, 'Endaxis.exe') };
  const app = new EventEmitter();
  Object.assign(app, {
    isPackaged: packaged,
    quits: 0,
    getPath: key => paths[key],
    setPath: (key, value) => {
      paths[key] = value;
    },
    getLocale: () => 'en',
    getAppPath: () => path.join(directory, 'resources', 'app.asar'),
    requestSingleInstanceLock: () => lock,
    whenReady: () => Promise.resolve(),
    quit() {
      app.quits++;
      let prevented = false;
      app.emit('before-quit', {
        preventDefault() {
          prevented = true;
        },
      });
      if (!prevented) for (const window of windows) window.destroy();
    },
    exit(code) {
      app.exitCode = code;
    },
  });
  class BrowserWindow extends EventEmitter {
    constructor(options) {
      super();
      this.options = options;
      this.bounds = {
        x: options.x ?? 0,
        y: options.y ?? 0,
        width: options.width,
        height: options.height,
      };
      this.visible = options.show !== false;
      this.messages = [];
      this.webContents = new EventEmitter();
      this.webContents.mainFrame = {};
      this.webContents.send = (...args) => this.messages.push(args);
      this.webContents.setWindowOpenHandler = handler => {
        this.openHandler = handler;
      };
      windows.push(this);
    }
    isDestroyed() {
      return Boolean(this.destroyed);
    }
    isMinimized() {
      return false;
    }
    isVisible() {
      return this.visible;
    }
    restore() {}
    focus() {
      this.focused = true;
    }
    show() {
      this.visible = true;
    }
    showInactive() {
      this.visible = true;
      this.shownInactive = true;
    }
    hide() {
      this.visible = false;
    }
    setTitle(value) {
      this.title = value;
    }
    setMenuBarVisibility() {}
    setAlwaysOnTop() {}
    isAlwaysOnTop() {
      return true;
    }
    setIgnoreMouseEvents(value) {
      this.ignored = value;
    }
    getBounds() {
      return { ...this.bounds };
    }
    setBounds(value) {
      this.bounds = { ...value };
      this.boundsWrites = (this.boundsWrites ?? 0) + 1;
    }
    loadURL(url) {
      this.url = url;
      this.webContents.emit('did-start-loading');
      return Promise.resolve();
    }
    close() {
      if (this.destroyed) return;
      let prevented = false;
      this.emit('close', {
        preventDefault() {
          prevented = true;
        },
      });
      if (!prevented) this.destroy();
    }
    destroy() {
      if (!this.destroyed) {
        this.destroyed = true;
        this.visible = false;
        this.emit('closed');
      }
    }
  }
  const screen = new EventEmitter();
  screen.getPrimaryDisplay = () => ({ workArea: { x: 0, y: 0, width: 1920, height: 1080 } });
  screen.getDisplayMatching = bounds => ({
    workArea: { x: bounds.x < 0 ? -1920 : 0, y: 0, width: 1920, height: 1080 },
  });
  const ipcMain = new EventEmitter();
  ipcMain.handle = (channel, handler) => {
    if (handlers.has(channel)) throw new Error('Duplicate IPC handler: ' + channel);
    handlers.set(channel, handler);
  };
  ipcMain.removeHandler = channel => handlers.delete(channel);
  const electron = {
    app,
    BrowserWindow,
    ipcMain,
    screen,
    globalShortcut: {
      register(key, handler) {
        if (unavailableShortcuts.includes(key)) return false;
        shortcuts.set(key, handler);
        return true;
      },
      unregister: key => shortcuts.delete(key),
      unregisterAll: () => shortcuts.clear(),
    },
    protocol: {
      registerSchemesAsPrivileged(value) {
        electron.schemes = value;
      },
      handle: (scheme, handler) => protocols.set(scheme, handler),
      unhandle: scheme => protocols.delete(scheme),
    },
    net: {
      fetch: async (...args) => {
        electron.fetched = args;
        return new Response('asset');
      },
    },
  };
  t.after(() => {
    app.quit();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    electron,
    app,
    windows,
    screen,
    handlers,
    shortcuts,
    protocols,
    paths,
    directory,
    call(channel, value, window = windows.at(-1)) {
      return handlers.get(channel)?.(
        { sender: window.webContents, senderFrame: window.webContents.mainFrame },
        value,
      );
    },
  };
}

module.exports = { fixture };
