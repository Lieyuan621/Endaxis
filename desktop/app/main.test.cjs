const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { startDesktop, storagePaths } = require('./main.cjs');
const { serverOptions, startServer, workspaceIdentity, validateUrl } = require('./server.cjs');
const { launch } = require('./launch.cjs');
const { fixture } = require('../tests/native-fixture.cjs');

const devArgs = ['--url=http://127.0.0.1:31337/'];
const flush = () => new Promise(resolve => setImmediate(resolve));

test('default startup opens only editor; a closed HUD is recreated with fresh native lifetime', async t => {
  const f = fixture(t);
  await startDesktop(f.electron, devArgs);
  assert.equal(f.windows.length, 1);
  const editor = f.windows[0];
  assert.match(editor.url, /desktop\/renderer\/editor\/index.html$/);
  assert.deepEqual([...f.shortcuts.keys()], ['Control+Alt+Q']);
  f.call('endaxis:show-overlay', undefined, editor);
  const first = f.windows[1];
  f.call('endaxis:show-overlay', undefined, editor);
  assert.equal(f.windows.length, 3);
  f.call('endaxis:close-overlay', undefined, first);
  assert.equal(first.isDestroyed(), true);
  assert.equal(f.windows[2].isDestroyed(), true);
  assert.equal(f.app.quits, 0);
  assert.deepEqual([...f.shortcuts.keys()], ['Control+Alt+Q']);
  assert.equal(f.screen.listenerCount('display-removed'), 0);
  assert.equal(f.handlers.has('endaxis:countdown-arm'), false);
  f.call('endaxis:show-overlay', undefined, editor);
  const second = f.windows[3];
  assert.notEqual(second, first);
  assert.equal(f.call('endaxis:desktop-info', undefined, first), null);
  assert.equal(f.call('endaxis:desktop-info', undefined, second).clickThrough, false);
  editor.close();
  assert.equal(f.app.quits, 0);
  second.close();
  assert.equal(f.app.quits, 1);
});

test('packaged application uses stable protocol and portable profile without starting Vite', async t => {
  const f = fixture(t, { packaged: true });
  await startDesktop(f.electron, ['--url=https://ignored.test', '--user-data-dir=ignored'], {
    startServer: () => {
      throw new Error('Vite must not run');
    },
  });
  assert.equal(f.windows[0].url, 'app://endaxis/timeline');
  assert.equal(f.paths.userData, path.join(f.directory, 'data', 'profile'));
  assert.equal(f.paths.sessionData, f.paths.userData);
  assert.deepEqual(f.electron.schemes[0].privileges, {
    standard: true,
    secure: true,
    supportFetchAPI: true,
  });
  const response = await f.protocols.get('app')({
    url: 'app://endaxis/icons/default_icon.webp',
    method: 'GET',
  });
  assert.equal(response.status, 200);
  assert.match(f.electron.fetched[0], /app.asar\/dist\/icons\/default_icon.webp$/);
  f.call('endaxis:show-overlay', undefined, f.windows[0]);
  assert.equal(f.windows[1].url, 'app://endaxis/overlay');
  assert.equal(storagePaths(f.app, new Map()).profile, f.paths.userData);
});

test('native locale is read only after Electron is ready', async t => {
  const f = fixture(t);
  let ready = false;
  f.app.whenReady = async () => {
    ready = true;
  };
  f.app.getLocale = () => {
    assert.equal(ready, true);
    return 'en';
  };
  await startDesktop(f.electron, devArgs);
  assert.equal(f.windows.length, 1);
});

test('single-instance lock precedes dev server; second invocation focuses one editor', async t => {
  let starts = 0;
  let closes = 0;
  const start = async () => {
    starts++;
    return {
      url: 'http://127.0.0.1:31337/',
      server: {
        close: async () => {
          closes++;
        },
      },
    };
  };
  const duplicate = fixture(t, { lock: false });
  await startDesktop(duplicate.electron, [], { startServer: start });
  assert.equal(starts, 0);
  const f = fixture(t);
  await startDesktop(f.electron, [], { startServer: start });
  f.app.emit('second-instance');
  assert.equal(f.windows.length, 1);
  assert.equal(f.windows[0].focused, true);
  f.app.quit();
  await flush();
  assert.equal(closes, 1);
  assert.equal(f.handlers.size, 0);
  assert.equal(f.shortcuts.size, 0);
});

test('quit during dev server startup closes the service before opening windows', async t => {
  const f = fixture(t);
  let resolveStart;
  let closes = 0;
  const ready = startDesktop(f.electron, [], {
    startServer: () =>
      new Promise(resolve => {
        resolveStart = resolve;
      }),
  });
  await flush();
  f.app.quit();
  resolveStart({
    url: 'http://127.0.0.1:31337/',
    server: {
      close: async () => {
        closes++;
      },
    },
  });
  await ready;
  assert.equal(closes, 1);
  assert.equal(f.windows.length, 0);
});

test('worktree dev server never attaches to an occupied port and uses desktop config', async () => {
  const root = path.resolve('worktree-a');
  let options;
  let closes = 0;
  await assert.rejects(
    startServer(root, async received => {
      options = received;
      return {
        listen: async () => {
          throw new Error('occupied');
        },
        close: async () => {
          closes++;
        },
      };
    }),
    /occupied/,
  );
  assert.equal(options.configFile, path.join(root, 'desktop/vite.config.ts'));
  assert.equal(options.server.host, '127.0.0.1');
  assert.equal(options.server.strictPort, true);
  assert.equal(options.server.port, serverOptions(root).server.port);
  assert.notEqual(workspaceIdentity(root), workspaceIdentity(path.resolve('worktree-b')));
  assert.equal(closes, 1);
});

test('unsupported development URLs cannot spawn Electron', () => {
  for (const url of ['file:///tmp/a', 'javascript:alert(1)', 'https://user:pass@example.test']) {
    assert.throws(() => validateUrl(url));
    assert.throws(() =>
      launch(
        [`--url=${url}`],
        () => {
          throw new Error('must not spawn');
        },
        () => 'electron',
      ),
    );
  }
});
