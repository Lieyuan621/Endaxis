const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const test = require('node:test');
const { createCountdownTrigger } = require('./countdown-trigger.cjs');
const { pixelRegion } = require('./region-picker.cjs');

const STATE_FILE = '/local-profile/countdown.json';

function bitmap(seed = 7) {
  const result = Buffer.alloc(64 * 32 * 4);
  let state = seed;
  for (let offset = 0; offset < result.length; offset += 4) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const value = state >>> 24;
    result[offset] = value;
    result[offset + 1] = value;
    result[offset + 2] = value;
    result[offset + 3] = 255;
  }
  return result;
}

const REFERENCE = bitmap();
const ABSENT = Buffer.alloc(64 * 32 * 4);

class Image {
  constructor(pixels, size = { width: 64, height: 32 }, crops = []) {
    this.pixels = pixels;
    this.size = size;
    this.crops = crops;
  }
  isEmpty() {
    return this.pixels.length === 0;
  }
  getSize() {
    return this.size;
  }
  resize(size) {
    return new Image(this.pixels, size, this.crops);
  }
  crop(region) {
    this.crops.push(region);
    return new Image(this.pixels, { width: region.width, height: region.height }, this.crops);
  }
  toBitmap() {
    return this.pixels;
  }
  toDataURL() {
    return `data:image/png;base64,${this.pixels.toString('base64')}`;
  }
}

function memoryFiles(initial = new Map()) {
  const data = new Map(initial);
  return {
    data,
    existsSync: file => data.has(file),
    statSync: file => ({ size: Buffer.byteLength(data.get(file)) }),
    readFileSync: file => data.get(file),
    mkdirSync() {},
    writeFileSync: (file, value) => data.set(file, value),
    renameSync: (from, to) => {
      data.set(to, data.get(from));
      data.delete(from);
    },
    unlinkSync: file => data.delete(file),
  };
}

async function settle() {
  await new Promise(resolve => setImmediate(resolve));
}

function fixture(t, persisted = new Map()) {
  let time = 0;
  let nextTimer = 0;
  let pendingCaptures = 0;
  let peakCaptures = 0;
  const timers = new Map();
  const frames = [];
  const calls = [];
  const triggers = [];
  const updates = [];
  const files = memoryFiles(persisted);
  const screen = new EventEmitter();
  const display = {
    id: 8,
    label: 'Game screen',
    bounds: { x: -1920, y: 0, width: 1920, height: 1080 },
    scaleFactor: 1.25,
    rotation: 0,
  };
  const displays = [display];
  screen.getAllDisplays = () => displays;
  const controller = createCountdownTrigger({
    screen,
    stateFile: STATE_FILE,
    nativeImage: { createFromBitmap: pixels => new Image(pixels) },
    desktopCapturer: {
      async getSources(options) {
        calls.push(options);
        pendingCaptures++;
        peakCaptures = Math.max(peakCaptures, pendingCaptures);
        try {
          const value = frames.shift() ?? ABSENT;
          if (value instanceof Error) throw value;
          const pixels = typeof value === 'function' ? await value() : value;
          if (Array.isArray(pixels)) return pixels;
          return [
            { display_id: '8', thumbnail: pixels instanceof Image ? pixels : new Image(pixels) },
          ];
        } finally {
          pendingCaptures--;
        }
      },
    },
    onUpdate: value => updates.push(value),
    onTrigger: value => triggers.push(value),
    services: {
      fs: files,
      now: () => time,
      setTimeout: (callback, wait) => {
        timers.set(++nextTimer, { callback, due: time + wait });
        return nextTimer;
      },
      clearTimeout: id => timers.delete(id),
    },
  });
  t.after(() => controller.dispose());
  const selection = {
    displayId: '8',
    region: { x: 0.25, y: 0.1, width: 0.2, height: 0.1 },
    referenceImage: new Image(REFERENCE),
  };
  async function tick(elapsed = 200) {
    time += elapsed;
    const due = [...timers].filter(([, timer]) => timer.due <= time);
    for (const [id, timer] of due) {
      timers.delete(id);
      timer.callback();
    }
    await settle();
  }
  return {
    controller,
    selection,
    frames,
    triggers,
    updates,
    timers,
    files,
    screen,
    display,
    displays,
    calls,
    tick,
    get peakCaptures() {
      return peakCaptures;
    },
  };
}

test('unconfigured capture stays idle and absent-to-two-present frames triggers once with compensation', async t => {
  const f = fixture(t);
  assert.deepEqual(f.controller.info(), { phase: 'unconfigured', configured: false, armed: false });
  f.controller.configure(f.selection);
  assert.equal(f.controller.info().phase, 'ready');
  assert.equal(f.calls.length, 0);
  f.frames.push(ABSENT, REFERENCE, REFERENCE, REFERENCE);
  f.controller.arm();
  await settle();
  assert.equal(f.controller.info().phase, 'watching');
  await f.tick();
  assert.equal(f.controller.info().phase, 'confirming');
  await f.tick(275);
  assert.deepEqual(f.triggers, [{ elapsedSeconds: 0.275 }]);
  assert.equal(f.controller.info().phase, 'triggered');
  assert.equal(f.controller.info().armed, false);
  assert.equal(f.timers.size, 0);
  await f.tick(1000);
  assert.equal(f.triggers.length, 1);
  assert.equal(f.calls.length, 3);
});

test('arming over an existing pattern waits for disappearance and a fresh confirmed appearance', async t => {
  const f = fixture(t);
  f.controller.configure(f.selection);
  f.frames.push(REFERENCE, REFERENCE, ABSENT, REFERENCE, REFERENCE);
  f.controller.arm();
  await settle();
  assert.equal(f.controller.info().phase, 'waiting-clear');
  await f.tick();
  assert.equal(f.controller.info().phase, 'waiting-clear');
  await f.tick();
  assert.equal(f.controller.info().phase, 'watching');
  await f.tick();
  assert.equal(f.controller.info().phase, 'confirming');
  await f.tick();
  assert.equal(f.triggers.length, 1);
});

test('a missed confirmation cancels the candidate and compensation starts at the next candidate', async t => {
  const f = fixture(t);
  f.controller.configure(f.selection);
  f.frames.push(ABSENT, REFERENCE, ABSENT, REFERENCE, REFERENCE);
  f.controller.arm();
  await settle();
  await f.tick();
  await f.tick();
  assert.equal(f.controller.info().phase, 'watching');
  assert.equal(f.triggers.length, 0);
  await f.tick();
  await f.tick();
  assert.deepEqual(f.triggers, [{ elapsedSeconds: 0.2 }]);
});

test('capture selects only the exact display id and maps normalized ROI to actual thumbnail dimensions', async t => {
  const f = fixture(t);
  f.controller.configure(f.selection);
  const selected = new Image(ABSENT, { width: 1000, height: 500 });
  f.frames.push([
    { display_id: 'other-screen', thumbnail: new Image(REFERENCE) },
    { display_id: '8', thumbnail: selected },
  ]);
  f.controller.arm();
  await settle();
  assert.equal(f.controller.info().phase, 'watching');
  assert.deepEqual(selected.crops, [{ x: 250, y: 50, width: 200, height: 50 }]);
  assert.deepEqual(f.calls[0].thumbnailSize, { width: 2400, height: 1350 });
  assert.deepEqual(f.calls[0].types, ['screen']);
  assert.ok(f.controller.info().previewUrl.startsWith('data:image/png;base64,'));
});

test('fractional ROI at noninteger DPI uses the same outward pixel rounding as the frozen picker', async t => {
  const cases = [
    {
      region: { x: 0.1239, y: 0.2358, width: 0.1111, height: 0.0876 },
      expected: { x: 123, y: 132, width: 112, height: 51 },
    },
    {
      region: { x: 0.9017, y: 0.9021, width: 0.0983, height: 0.0979 },
      expected: { x: 898, y: 507, width: 99, height: 56 },
    },
  ];
  for (const { region, expected } of cases) {
    const f = fixture(t);
    f.controller.configure({ ...f.selection, region });
    const selected = new Image(ABSENT, { width: 997, height: 563 });
    f.frames.push(selected);
    f.controller.arm();
    await settle();
    assert.equal(f.controller.info().phase, 'watching');
    assert.equal(f.display.scaleFactor, 1.25);
    assert.deepEqual(f.calls[0].thumbnailSize, { width: 2400, height: 1350 });
    assert.deepEqual(selected.crops, [expected]);
    assert.deepEqual(selected.crops[0], pixelRegion(region, selected.getSize()));
  }
});

test('disarm, rearm and disposal invalidate pending captures without concurrent requests or late triggers', async t => {
  const f = fixture(t);
  f.controller.configure(f.selection);
  let finish;
  f.frames.push(() => new Promise(resolve => (finish = resolve)), ABSENT, REFERENCE, REFERENCE);
  f.controller.arm();
  await settle();
  f.controller.disarm();
  f.controller.arm();
  assert.equal(f.calls.length, 1);
  await f.tick();
  assert.equal(f.calls.length, 1);
  finish(REFERENCE);
  await settle();
  assert.equal(f.controller.info().phase, 'checking');
  await f.tick();
  assert.equal(f.controller.info().phase, 'watching');
  assert.equal(f.peakCaptures, 1);
  await f.tick();
  assert.equal(f.controller.info().phase, 'confirming');
  f.controller.dispose();
  const updateCount = f.updates.length;
  await f.tick(1000);
  assert.equal(f.triggers.length, 0);
  assert.equal(f.updates.length, updateCount);
  assert.equal(f.timers.size, 0);
  assert.equal(f.controller.info().armed, false);
  assert.equal(f.screen.listenerCount('display-removed'), 0);
  f.controller.arm();
  assert.equal(f.controller.info().armed, false);
});

test('disposing during an awaited capture ignores both late results and failures', async t => {
  for (const shouldReject of [false, true]) {
    const f = fixture(t);
    f.controller.configure(f.selection);
    let finish;
    f.frames.push(
      () =>
        new Promise((resolve, reject) => {
          finish = () => (shouldReject ? reject(new Error('late failure')) : resolve(REFERENCE));
        }),
    );
    f.controller.arm();
    await settle();
    f.controller.dispose();
    const updateCount = f.updates.length;
    finish();
    await settle();
    assert.equal(f.updates.length, updateCount);
    assert.equal(f.triggers.length, 0);
    assert.equal(f.timers.size, 0);
  }
});

test('capture errors and a missing exact source stop with an actionable error', async t => {
  for (const frame of [
    new Error('screen capture denied'),
    [{ display_id: '', thumbnail: new Image(REFERENCE) }],
  ]) {
    const f = fixture(t);
    f.controller.configure(f.selection);
    f.frames.push(frame);
    f.controller.arm();
    await settle();
    assert.equal(f.controller.info().phase, 'error');
    assert.equal(f.controller.info().armed, false);
    assert.ok(f.controller.info().error.length > 0);
    assert.equal(f.timers.size, 0);
  }
});

test('display removal, resolution, scale and rotation changes invalidate configuration immediately', async t => {
  for (const mutate of [
    f => f.displays.splice(0),
    f => (f.display.bounds.width = 1600),
    f => (f.display.scaleFactor = 1.5),
    f => (f.display.rotation = 90),
  ]) {
    const f = fixture(t);
    f.controller.configure(f.selection);
    f.controller.arm();
    await settle();
    mutate(f);
    f.screen.emit('display-metrics-changed');
    assert.equal(f.controller.info().phase, 'error');
    assert.equal(f.controller.info().armed, false);
    assert.equal(f.timers.size, 0);
    await f.tick();
    assert.equal(f.triggers.length, 0);
  }
});

test('persisted reference contains only a small ROI and restores ready, never armed', t => {
  const f = fixture(t);
  f.controller.configure(f.selection);
  const persisted = JSON.parse(f.files.data.get(STATE_FILE));
  assert.equal(persisted.version, 1);
  assert.equal(Buffer.from(persisted.bitmap, 'base64').length, 64 * 32 * 4);
  assert.equal(persisted.template.width, 64);
  assert.equal(persisted.template.height, 32);
  assert.equal(persisted.previewUrl, undefined);
  assert.equal(persisted.armed, undefined);
  assert.equal(f.files.data.has(`${STATE_FILE}.tmp`), false);
  const restored = fixture(t, f.files.data);
  assert.equal(restored.controller.info().phase, 'ready');
  assert.equal(restored.controller.info().armed, false);
  assert.equal(restored.calls.length, 0);
  assert.equal(restored.controller.info().previewUrl, f.controller.info().previewUrl);
  restored.controller.clear();
  assert.equal(restored.files.data.has(STATE_FILE), false);
  assert.equal(restored.controller.info().phase, 'unconfigured');
});

test('malformed, oversized and tampered persisted configurations remain unarmed', t => {
  const valid = fixture(t);
  valid.controller.configure(valid.selection);
  const saved = JSON.parse(valid.files.data.get(STATE_FILE));
  const tampered = { ...saved, template: { ...saved.template, gray: [...saved.template.gray] } };
  tampered.template.gray[0] = (tampered.template.gray[0] + 127) % 256;
  for (const raw of [
    '{',
    'x'.repeat(128 * 1024 + 1),
    JSON.stringify({ ...saved, version: 2 }),
    JSON.stringify({ ...saved, region: { ...saved.region, width: 10 } }),
    JSON.stringify({ ...saved, bitmap: saved.bitmap + '====' }),
    JSON.stringify({ ...saved, signature: { ...saved.signature, scaleFactor: 2 } }),
    JSON.stringify(tampered),
  ]) {
    const f = fixture(t, new Map([[STATE_FILE, raw]]));
    assert.equal(f.controller.info().phase, 'error');
    assert.equal(f.controller.info().armed, false);
    assert.equal(f.calls.length, 0);
  }
});

test('too-small, out-of-bounds and low-contrast references are rejected before persistence', t => {
  for (const patch of [
    { region: { x: 0, y: 0, width: 0.001, height: 0.001 } },
    { region: { x: 0.9, y: 0.9, width: 0.2, height: 0.2 } },
    { referenceImage: new Image(ABSENT) },
  ]) {
    const f = fixture(t);
    assert.equal(f.controller.configure({ ...f.selection, ...patch }).phase, 'error');
    assert.equal(f.files.data.has(STATE_FILE), false);
    assert.equal(f.calls.length, 0);
    assert.equal(f.controller.info().armed, false);
  }
});
