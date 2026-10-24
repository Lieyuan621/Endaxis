const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createInputDecoder } = require('./input-feedback.cjs');
test('short press and hold are mutually exclusive, holding does not repeat', () => {
  const events = [];
  const d = createInputDecoder(e => events.push(e));
  const sample = (at, keyboard) => d.sample({ at, keyboard, pad: 4, buttons: 0 });
  sample(0, 0);
  sample(10, 1);
  sample(110, 0);
  sample(200, 2);
  d.tick(399);
  assert.equal(events.length, 1);
  d.tick(400);
  assert.equal(events.at(-1).type, 'ultimate');
  d.tick(650);
  sample(700, 0);
  assert.deepEqual(
    events.map(e => [e.type, e.trackIndex, e.at]),
    [
      ['battleSkill', 0, 10],
      ['ultimate', 1, 400],
    ],
  );
});
test('controller uses LB face/direction chords and RB; stopping cancels holds', () => {
  const events = [];
  const d = createInputDecoder(e => events.push(e));
  const sample = (at, buttons) =>
    d.sample({ at, keyboard: 0, pad: 0, buttons });
  sample(0, 0);
  sample(10, 0x4100);
  sample(100, 0x100);
  sample(120, 0x101);
  sample(140, 0);
  sample(160, 0x200);
  sample(180, 0x200);
  sample(200, 0);
  sample(220, 0x200);
  sample(240, 0x8100);
  d.reset();
  d.tick(1000);
  sample(1100, 0x8100);
  sample(1200, 0);
  assert.deepEqual(
    events.map(e => [e.type, e.trackIndex]),
    [
      ['battleSkill', 0],
      ['switch', 1],
      ['comboSkill', undefined],
      ['comboSkill', undefined],
    ],
  );
});

test('attack hold stops on release, LB skill chord and stopping', () => {
  const events = [];
  const d = createInputDecoder(e => events.push(e));
  const sample = (at, keyboard, buttons) =>
    d.sample({ at, keyboard, pad: 0, buttons });
  sample(0, 0, 0);
  sample(10, 512, 0);
  sample(20, 0, 0);
  sample(30, 0, 0x4000);
  sample(40, 0, 0x4100);
  sample(50, 0, 0);
  sample(60, 0, 0x4000);
  d.reset();
  assert.deepEqual(
    events.filter(e => e.type === 'attack').map(e => e.pressed),
    [true, false, true, false, true, false],
  );
});

test('controller ultimate fires at 200 ms while the skill chord remains held', () => {
  const events = [];
  const d = createInputDecoder(e => events.push(e));
  const sample = (at, buttons) => d.sample({ at, keyboard: 0, pad: 0, buttons });
  sample(0, 0);
  sample(10, 0x8100);
  sample(209, 0x8100);
  assert.equal(events.length, 0);
  sample(210, 0x8100);
  assert.deepEqual(events.map(e => [e.type, e.trackIndex, e.at]), [['ultimate', 1, 210]]);
  sample(600, 0x8100);
  sample(700, 0);
  assert.equal(events.length, 1);
});
