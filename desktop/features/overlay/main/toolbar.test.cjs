const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture } = require('../../../tests/native-fixture.cjs');
const { createToolbar } = require('./toolbar.cjs');

test('toolbar hides after three seconds away and returns over a click-through HUD', t => {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  const f = fixture(t);
  let cursor = { x: 1800, y: 1000 };
  f.screen.getCursorScreenPoint = () => cursor;
  const hud = new f.electron.BrowserWindow({ x: 100, y: 100, width: 800, height: 200 });
  hud.setIgnoreMouseEvents(true);
  const toolbar = createToolbar(f.electron, {
    hud, url: 'app://endaxis/overlay-toolbar', getState: () => ({}), command() {},
  });
  t.after(() => toolbar.dispose());
  toolbar.window.emit('ready-to-show');
  assert.equal(toolbar.window.isVisible(), true);
  t.mock.timers.tick(3000);
  assert.equal(toolbar.window.isVisible(), false);
  cursor = { x: 200, y: 150 };
  t.mock.timers.tick(150);
  assert.equal(toolbar.window.isVisible(), true);
  const b = toolbar.window.getBounds();
  cursor = { x: b.x + 20, y: b.y + 20 };
  t.mock.timers.tick(4000);
  assert.equal(toolbar.window.isVisible(), true);
  cursor = { x: 1800, y: 1000 };
  t.mock.timers.tick(3000);
  assert.equal(toolbar.window.isVisible(), false);
  toolbar.dispose();
  t.mock.timers.tick(4000);
});
