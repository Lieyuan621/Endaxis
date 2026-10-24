const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { createOverlaySession, fitBounds } = require('./session.cjs');
const { fixture } = require('../../../tests/native-fixture.cjs');

function open(f, extra = {}, services = {}) {
  const session = createOverlaySession(
    f.electron,
    {
      urls: {
        hud: 'app://endaxis/overlay',
        settings: 'app://endaxis/overlay-settings',
        toolbar: 'app://endaxis/overlay-toolbar',
      },
      dataRoot: f.directory,
      locale: 'en',
      args: new Map(),
      openEditor() {},
      quit() {},
      ...extra,
    },
    services,
  );
  return session;
}

test('settings commands are HUD-mediated, state is cached and settings never outlives HUD', t => {
  const f = fixture(t);
  const session = open(f);
  t.after(() => session.destroy());
  const hud = session.hud;
  f.call('endaxis:overlay-settings:open', undefined, hud);
  const settings = session.settings;
  assert.equal(settings.options.parent, hud);
  assert.equal(path.basename(settings.options.webPreferences.preload), 'settings.cjs');
  assert.deepEqual(hud.messages.at(-1), [
    'endaxis:overlay-settings:command',
    { type: 'requestState' },
  ]);
  assert.equal(f.call('endaxis:overlay-settings:get-state', undefined, settings), null);
  const state = { locale: 'en', preferences: { width: 900 }, canArm: true };
  assert.equal(f.call('endaxis:overlay-settings:publish', state, settings), null);
  assert.equal(f.call('endaxis:overlay-settings:publish', state, hud), true);
  assert.deepEqual(f.call('endaxis:overlay-settings:get-state', undefined, settings), state);
  assert.deepEqual(settings.messages.at(-1), ['endaxis:overlay-settings:state', state]);
  assert.equal(f.call('endaxis:countdown-arm', undefined, settings), null);
  assert.equal(
    f.call('endaxis:overlay-settings:command', { type: 'countdownArm' }, settings),
    true,
  );
  assert.deepEqual(hud.messages.at(-1), [
    'endaxis:overlay-settings:command',
    { type: 'countdownArm' },
  ]);
  assert.equal(
    f.call('endaxis:overlay-settings:command', { type: 'patch', patch: { width: 800 } }, settings),
    true,
  );
  assert.equal(
    f.call(
      'endaxis:overlay-settings:command',
      { type: 'patch', patch: { arbitrary: 'value' } },
      settings,
    ),
    false,
  );
  assert.equal(f.call('endaxis:overlay-settings:command', { type: 'quit' }, settings), false);
  settings.close();
  assert.equal(hud.isDestroyed(), false);
  assert.equal(session.settings, null);
  f.call('endaxis:overlay-settings:open', undefined, hud);
  const replacement = session.settings;
  assert.notEqual(replacement, settings);
  replacement.webContents.emit('did-finish-load');
  assert.deepEqual(replacement.messages.at(-1), ['endaxis:overlay-settings:state', state]);
  hud.close();
  assert.equal(session.disposed, true);
  assert.equal(replacement.isDestroyed(), true);
  assert.equal(f.handlers.size, 0);
  assert.equal(f.shortcuts.size, 0);
  assert.equal(f.screen.listenerCount('display-metrics-changed'), 0);
});

test('closing during pending selection or capture prevents updates reaching a reopened HUD', async t => {
  const f = fixture(t);
  let resolveSelection;
  let callbacks;
  let configured = 0;
  let triggerDisposed = 0;
  let pickerDisposed = 0;
  const session = open(
    f,
    {},
    {
      createCountdownTrigger: options => {
        callbacks = options;
        return {
          info: () => ({}),
          disarm() {},
          configure() {
            configured++;
          },
          dispose() {
            triggerDisposed++;
          },
        };
      },
      createRegionPicker: () => ({
        pick: () =>
          new Promise(resolve => {
            resolveSelection = resolve;
          }),
        dispose() {
          pickerDisposed++;
        },
      }),
    },
  );
  f.call('endaxis:overlay-settings:open', undefined, session.hud);
  const settings = session.settings;
  settings.show();
  const pending = f.call('endaxis:countdown-select', undefined, session.hud);
  assert.equal(settings.isVisible(), false);
  session.close();
  const second = open(f);
  t.after(() => second.destroy());
  const messages = second.hud.messages.length;
  resolveSelection({ displayId: '1' });
  assert.equal(await pending, null);
  callbacks.onUpdate({ armed: true });
  callbacks.onTrigger({ elapsedSeconds: 0.2 });
  assert.equal(second.hud.messages.length, messages);
  assert.equal(settings.isDestroyed(), true);
  assert.equal(configured, 0);
  assert.equal(triggerDisposed, 1);
  assert.equal(pickerDisposed, 1);
});

test('late ready events cannot show disposed HUD or settings and settings restores after picker failure', async t => {
  const f = fixture(t);
  const session = open(
    f,
    {},
    {
      createCountdownTrigger: () => ({ info: () => ({}), disarm() {}, dispose() {} }),
      createRegionPicker: () => ({
        pick: async () => {
          throw new Error('capture denied');
        },
        dispose() {},
      }),
    },
  );
  f.call('endaxis:overlay-settings:open', undefined, session.hud);
  const settings = session.settings;
  settings.show();
  await assert.rejects(
    f.call('endaxis:countdown-select', undefined, session.hud),
    /capture denied/,
  );
  assert.equal(settings.isVisible(), true);
  session.destroy();
  session.hud.emit('ready-to-show');
  settings.emit('ready-to-show');
  settings.webContents.emit('did-finish-load');
  assert.equal(session.hud.isVisible(), false);
  assert.equal(settings.isVisible(), false);
  assert.equal(f.handlers.size, 0);
  assert.equal(f.shortcuts.size, 0);
});

test('recovery shortcut failure still allows click-through and reload disarms monitoring', t => {
  const f = fixture(t, { unavailableShortcuts: ['Control+Alt+O', 'Control+Alt+Home'] });
  let stopped = 0;
  const session = open(
    f,
    {},
    {
      createCountdownTrigger: () => ({
        info: () => ({}),
        disarm() {
          stopped++;
        },
        dispose() {},
      }),
    },
  );
  t.after(() => session.destroy());
  const info = f.call('endaxis:desktop-info', undefined, session.hud);
  assert.equal(info.playbackShortcutsAvailable, false);
  assert.equal(f.call('endaxis:set-click-through', true, session.hud), true);
  assert.equal(f.call('endaxis:set-click-through', false, session.hud), false);
  f.call('endaxis:countdown-info', undefined, session.hud);
  f.shortcuts.get('Control+Alt+R')();
  assert.equal(stopped, 1);
  f.shortcuts.get('Control+Alt+Space')();
  assert.deepEqual(session.hud.messages.at(-1), ['endaxis:playback-command', 'toggle']);
  assert.equal(session.hud.focused, undefined);
});

test('native window bounds are restored after closing and remain within the display', t => {
  const f = fixture(t);
  const session = open(f);
  const bounds = { x: -1400, y: 100, width: 1000, height: 300 };
  assert.equal(session.hud.options.resizable, true);
  session.hud.setBounds(bounds);
  session.destroy();
  const reopened = open(f);
  t.after(() => reopened.destroy());
  assert.deepEqual(reopened.hud.getBounds(), bounds);
  assert.deepEqual(
    fitBounds(
      { x: -1900, y: 100, width: 3000, height: 3000 },
      { x: -1920, y: 0, width: 1920, height: 1080 },
    ),
    { x: -1920, y: 0, width: 1920, height: 1080 },
  );
});
