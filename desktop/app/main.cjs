const fs = require('node:fs');
const path = require('node:path');
const {
  pageUrls,
  registerAppScheme,
  serveAppProtocol,
  protectWindow,
  isWindowSender,
} = require('./protocol.cjs');
const { createOverlaySession } = require('../features/overlay/main/session.cjs');
const { message, normalizeLocale } = require('./messages.cjs');

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

function storagePaths(app, args) {
  if (app.isPackaged) {
    const dataRoot = path.join(path.dirname(app.getPath('exe')), 'data');
    return { dataRoot, profile: path.join(dataRoot, 'profile') };
  }
  const { workspaceIdentity } = require('./server.cjs');
  const profile = args.has('user-data-dir')
    ? path.resolve(args.get('user-data-dir'))
    : path.join(app.getPath('appData'), 'EndaxisOverlay', workspaceIdentity());
  return { dataRoot: profile, profile };
}

function startDesktop(electron, argv = process.argv.slice(1), services = {}) {
  const { app, BrowserWindow, ipcMain, globalShortcut } = electron;
  const args = parseArgs(argv);
  // Electron's OS locale lookup is only available after ready on Windows.
  let locale = normalizeLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  const { dataRoot, profile } = storagePaths(app, args);
  try {
    fs.mkdirSync(profile, { recursive: true });
    const probe = path.join(profile, `.write-check-${process.pid}`);
    fs.writeFileSync(probe, '');
    fs.unlinkSync(probe);
  } catch (error) {
    electron.dialog?.showErrorBox(
      message(locale, 'startupFailed'),
      message(locale, 'dataDirectoryUnavailable') + '\n' + dataRoot,
    );
    throw error;
  }
  app.setPath('userData', profile);
  app.setPath('sessionData', profile);
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }
  if (app.isPackaged) registerAppScheme(electron.protocol);
  let editor = null;
  let overlay = null;
  let server = null;
  let removeProtocol = null;
  let urls = null;
  let quitting = false;
  let initializing = true;
  let pendingEditorFocus = false;
  let shutdown = null;
  let handlersInstalled = false;

  function maybeQuit() {
    if (!quitting && !editor && !overlay) app.quit();
  }
  function openEditor() {
    if (quitting) return;
    if (!urls) {
      pendingEditorFocus = true;
      return;
    }
    if (editor && !editor.isDestroyed()) {
      if (editor.isMinimized()) editor.restore();
      editor.show();
      editor.focus();
      return;
    }
    const window = new BrowserWindow({
      icon: path.join(__dirname, '../assets/icon.ico'),
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
    editor = window;
    window.setMenuBarVisibility(false);
    protectWindow(window, urls.editor);
    window.on('closed', () => {
      if (editor === window) editor = null;
      maybeQuit();
    });
    void window.loadURL(urls.editor).catch(error => console.error('[endaxis]', error));
  }
  function openOverlay() {
    if (quitting || !urls) return;
    if (overlay && !overlay.disposed) {
      overlay.show();
      return;
    }
    let current;
    current = (services.createOverlaySession || createOverlaySession)(
      electron,
      {
        urls,
        dataRoot,
        args,
        locale,
        openEditor,
        quit: () => app.quit(),
        onClosed: () => {
          if (overlay === current) overlay = null;
          maybeQuit();
        },
      },
      services,
    );
    overlay = current;
  }
  function cleanup() {
    overlay?.destroy();
    overlay = null;
    globalShortcut.unregisterAll();
    if (handlersInstalled) ipcMain.removeHandler('endaxis:show-overlay');
    handlersInstalled = false;
    removeProtocol?.();
    removeProtocol = null;
  }
  app.on('second-instance', openEditor);
  app.on('activate', openEditor);
  app.on('window-all-closed', () => {
    if (!initializing) app.quit();
  });
  app.on('before-quit', event => {
    quitting = true;
    cleanup();
    if (initializing) {
      event.preventDefault();
      return;
    }
    if (server || shutdown) {
      event.preventDefault();
      if (!shutdown) {
        const owned = server;
        server = null;
        shutdown = Promise.resolve()
          .then(() => owned.close())
          .catch(error => console.error('[endaxis]', error))
          .finally(() => {
            shutdown = null;
            app.quit();
          });
      }
    }
  });
  return app
    .whenReady()
    .then(async () => {
      if (quitting) {
        initializing = false;
        app.quit();
        return;
      }
      locale = normalizeLocale(app.getLocale?.() ?? locale);
      if (app.isPackaged) {
        removeProtocol = serveAppProtocol(electron, path.join(app.getAppPath(), 'dist'));
        urls = pageUrls(null, true);
      } else {
        const { ROOT, validateUrl, startServer } = require('./server.cjs');
        let origin;
        if (args.has('url')) origin = validateUrl(args.get('url'));
        else {
          const started = await (services.startServer || startServer)(ROOT);
          server = started.server;
          origin = started.url;
        }
        if (quitting) {
          if (server) await server.close();
          server = null;
          initializing = false;
          app.quit();
          return;
        }
        urls = pageUrls(origin, false);
      }
      globalShortcut.register('Control+Alt+Q', () => app.quit());
      ipcMain.handle('endaxis:show-overlay', event => {
        if (quitting || !isWindowSender(event, editor)) return null;
        openOverlay();
      });
      handlersInstalled = true;
      if (!args.has('no-editor') || pendingEditorFocus) openEditor();
      if (args.has('overlay') || args.has('capture') || args.has('no-editor')) openOverlay();
      initializing = false;
    })
    .catch(async error => {
      console.error('[endaxis] Startup failed:', error);
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
}

module.exports = { parseArgs, storagePaths, startDesktop };
if (process.type === 'browser') {
  try {
    startDesktop(require('electron'));
  } catch (error) {
    console.error('[endaxis] Startup failed:', error);
    require('electron').app.exit(1);
  }
}
