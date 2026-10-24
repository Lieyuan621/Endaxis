const fs = require('node:fs');
const { spawn } = require('node:child_process');
const path = require('node:path');
const readline = require('node:readline');

// 按下不立即认定战技，松开或达到长按阈值后才决定操作类型。
function createInputDecoder(emit, holdMs = 200) {
  let previous = new Set();
  let initialized = false;
  let controller = null;
  let attacking = false;
  const held = new Map();
  function reset() {
    if (attacking) emit({ type: 'attack', pressed: false, at: Date.now() });
    attacking = false;
    held.clear();
    previous.clear();
    initialized = false;
  }
  function tick(at) {
    for (const [key, press] of held) {
      if (!press.long && at - press.at >= holdMs) {
        press.long = true;
        emit({
          type: 'ultimate',
          trackIndex: press.slot,
          at: press.at + holdMs,
          startedAt: press.at,
        });
      }
    }
  }
  function sample({ at, keyboard, pad, buttons }) {
    const down = new Set();
    for (let i = 0; i < 4; i++) {
      if (keyboard & (1 << i)) down.add('k' + i);
      if (keyboard & (1 << (i + 5))) down.add('s' + i);
    }
    if (keyboard & 16) down.add('kc');
    if (buttons & 0x100) {
      [0x4000, 0x8000, 0x2000, 0x1000].forEach((mask, i) => {
        if (buttons & mask) down.add('p' + i);
      });
      [4, 1, 8, 2].forEach((mask, i) => {
        if (buttons & mask) down.add('d' + i);
      });
    }
    if (buttons & 0x200) down.add('pc');
    if (controller !== pad) {
      reset();
      controller = pad;
    }
    const attackDown = Boolean(keyboard & 512 || (buttons & 0x4000 && !(buttons & 0x100)));
    if (attackDown !== attacking) {
      attacking = attackDown;
      emit({ type: 'attack', pressed: attacking, at });
    }
    // 开始监听或接入手柄时已有按键不算新输入，也不消费它的松开。
    if (!initialized) {
      previous = down;
      initialized = true;
      return;
    }
    tick(at);
    for (const key of previous)
      if (!down.has(key)) {
        const press = held.get(key);
        if (press && !press.long)
          emit({ type: 'battleSkill', trackIndex: press.slot, at: press.at });
        held.delete(key);
      }
    for (const key of down)
      if (!previous.has(key)) {
        if (key === 'kc' || key === 'pc') emit({ type: 'comboSkill', at });
        else if (key[0] === 's' || key[0] === 'd')
          emit({ type: 'switch', trackIndex: Number(key[1]), at });
        else held.set(key, { slot: Number(key[1]), at, long: false });
      }
    previous = down;
  }
  return { sample, tick, reset };
}

function createInputFeedback(onInput, onStatus) {
  let child = null,
    lines = null,
    timer = null;
  const decoder = createInputDecoder(onInput);
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    lines?.close();
    lines = null;
    const old = child;
    child = null;
    old?.kill();
    decoder.reset();
  }
  function start() {
    if (child) return;
    if (process.platform !== 'win32') {
      onStatus('unavailable');
      return;
    }
    onStatus('starting');
    const processHandle = spawn(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-EncodedCommand',
        Buffer.from(
          fs.readFileSync(path.join(__dirname, 'input-feedback.ps1'), 'utf8'),
          'utf16le',
        ).toString('base64'),
      ],
      { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    child = processHandle;
    lines = readline.createInterface({ input: child.stdout });
    lines.on('line', line => {
      if (child !== processHandle) return;
      if (line === 'ready') {
        onStatus('listening');
        return;
      }
      const values = line.split(',').map(Number);
      if (values.length !== 4 || !values.every(Number.isFinite)) return;
      const [at, keyboard, pad, buttons] = values;
      decoder.sample({ at, keyboard, pad, buttons });

    });
    child.stderr.on('data', () => {});
    const fail = () => {
      if (child === processHandle) {
        stop();
        onStatus('error');
      }
    };
    child.on('error', fail);
    child.on('exit', fail);
    timer = setInterval(() => decoder.tick(Date.now()), 8);
    timer.unref?.();
  }
  return {
    setEnabled(enabled) {
      if (enabled) start();
      else {
        stop();
        onStatus('off');
      }
    },
    dispose: stop,
  };
}
module.exports = { createInputDecoder, createInputFeedback };
