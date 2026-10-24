const path = require('node:path');
const { pathToFileURL } = require('node:url');

const APP_ORIGIN = 'app://endaxis';
const PAGES = Object.freeze({
  toolbar: '/desktop/features/overlay/renderer/toolbar.html',
  editor: '/desktop/renderer/editor/index.html',
  hud: '/desktop/features/overlay/renderer/index.html',
  settings: '/desktop/features/overlay/renderer/settings.html',
});
const ROUTES = Object.freeze({
  '/overlay-toolbar': PAGES.toolbar,
  '/': PAGES.editor,
  '/timeline': PAGES.editor,
  '/overlay': PAGES.hud,
  '/overlay-settings': PAGES.settings,
});

function pageUrls(origin, packaged) {
  return packaged
    ? {
        toolbar: `${APP_ORIGIN}/overlay-toolbar`,
        editor: `${APP_ORIGIN}/timeline`,
        hud: `${APP_ORIGIN}/overlay`,
        settings: `${APP_ORIGIN}/overlay-settings`,
      }
    : Object.fromEntries(
        Object.entries(PAGES).map(([key, value]) => [key, new URL(value, origin).href]),
      );
}

function resolveAppRequest(request, root) {
  if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) return { status: 405 };
  let url;
  let pathname;
  try {
    url = new URL(request.url);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return { status: 400 };
  }
  if (url.protocol !== 'app:' || url.host !== 'endaxis' || url.username || url.password) {
    return { status: 403 };
  }
  if (!pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('\0')) {
    return { status: 400 };
  }
  const target = path.resolve(root, `.${ROUTES[pathname] ?? pathname}`);
  const relative = path.relative(root, target);
  if (
    !relative ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    return { status: 403 };
  }
  return { file: target };
}

function registerAppScheme(protocol) {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ]);
}

function serveAppProtocol({ protocol, net }, root) {
  protocol.handle('app', async request => {
    const resolved = resolveAppRequest(request, root);
    if (resolved.status) return new Response(null, { status: resolved.status });
    try {
      return await net.fetch(pathToFileURL(resolved.file).href, { method: request.method });
    } catch {
      return new Response(null, { status: 404 });
    }
  });
  return () => protocol.unhandle('app');
}

function protectWindow(window, allowedUrl) {
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== allowedUrl) event.preventDefault();
  });
  window.webContents.on('will-redirect', event => event.preventDefault());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

function isWindowSender(event, window) {
  return Boolean(
    window &&
    !window.isDestroyed() &&
    event.sender === window.webContents &&
    (!event.senderFrame || event.senderFrame === window.webContents.mainFrame),
  );
}

module.exports = {
  APP_ORIGIN,
  PAGES,
  pageUrls,
  resolveAppRequest,
  registerAppScheme,
  serveAppProtocol,
  protectWindow,
  isWindowSender,
};
