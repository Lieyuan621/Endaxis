const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { resolveAppRequest, protectWindow, isWindowSender } = require('./protocol.cjs');
const { fixture } = require('../tests/native-fixture.cjs');

test('protocol resolves three entry documents and absolute assets inside bundled UI only', () => {
  const root = path.resolve('bundle/dist');
  const resolve = url => resolveAppRequest({ url, method: 'GET' }, root);
  assert.equal(
    resolve('app://endaxis/timeline').file,
    path.join(root, 'desktop/renderer/editor/index.html'),
  );
  assert.equal(
    resolve('app://endaxis/overlay').file,
    path.join(root, 'desktop/features/overlay/renderer/index.html'),
  );
  assert.equal(
    resolve('app://endaxis/overlay-settings').file,
    path.join(root, 'desktop/features/overlay/renderer/settings.html'),
  );
  assert.equal(
    resolve('app://endaxis/operators/test/battle%2001.webp').file,
    path.join(root, 'operators/test/battle 01.webp'),
  );
  for (const url of [
    'https://endaxis/timeline',
    'app://other/timeline',
    'app://user@endaxis/timeline',
    'app://endaxis:80/timeline',
  ])
    assert.equal(resolve(url).status, 403);
  for (const url of [
    'app://endaxis/%2e%2e%2fsecret',
    'app://endaxis/%2e%2e%5csecret',
    'app://endaxis/%00',
    'app://endaxis/%zz',
  ])
    assert.ok(resolve(url).status >= 400);
  assert.equal(
    resolveAppRequest({ url: 'app://endaxis/overlay', method: 'POST' }, root).status,
    405,
  );
});

test('native windows deny redirects, foreign navigation, popups and subframe IPC', t => {
  const f = fixture(t);
  const window = new f.electron.BrowserWindow({ width: 1000, height: 500 });
  protectWindow(window, 'app://endaxis/overlay');
  let cancelled = 0;
  const event = {
    preventDefault() {
      cancelled++;
    },
  };
  window.webContents.emit('will-navigate', event, 'app://endaxis/overlay');
  assert.equal(cancelled, 0);
  window.webContents.emit('will-navigate', event, 'https://other.test');
  window.webContents.emit('will-redirect', event, 'https://other.test');
  assert.equal(cancelled, 2);
  assert.deepEqual(window.openHandler({ url: 'https://other.test' }), { action: 'deny' });
  assert.equal(isWindowSender({ sender: window.webContents, senderFrame: {} }, window), false);
  assert.equal(
    isWindowSender(
      { sender: window.webContents, senderFrame: window.webContents.mainFrame },
      window,
    ),
    true,
  );
});
