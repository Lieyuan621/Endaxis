'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { createTemplate, matchTemplate, validateTemplate } = require('./template-match.cjs');

const WIDTH = 64;
const HEIGHT = 32;

function pattern(x, y) {
  const left = x >= 7 && x <= 16 && y >= 5 && y <= 26 && (x <= 9 || y <= 7 || y >= 24);
  const colon = x >= 30 && x <= 32 && ((y >= 8 && y <= 10) || (y >= 21 && y <= 23));
  const right =
    x >= 46 && x <= 56 && y >= 7 && y <= 24 && (x <= 48 || x >= 54 || y <= 9 || y >= 22);
  return left || colon || right ? 190 : 32;
}

function bitmap(pixel = pattern, width = WIDTH, height = HEIGHT) {
  const result = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const value = pixel(x, y);
      result[index] = value - 10;
      result[index + 1] = value;
      result[index + 2] = value + 10;
      result[index + 3] = 255;
    }
  }
  return result;
}

test('creates a JSON-serializable bounded template and matches identical pixels', () => {
  const image = bitmap();
  const template = JSON.parse(JSON.stringify(createTemplate(image, WIDTH, HEIGHT)));
  assert.equal(validateTemplate(template), true);
  assert.deepEqual(Object.keys(template).sort(), ['gray', 'height', 'version', 'width']);
  assert.equal(template.version, 1);
  assert.equal(template.gray.length, WIDTH * HEIGHT);
  assert.ok(matchTemplate(template, image, WIDTH, HEIGHT) > 0.9999);
});

test('normalizes brightness and contrast changes without depending on RGB channel order', () => {
  const image = bitmap();
  const template = createTemplate(image, WIDTH, HEIGHT);
  const shiftedBrightness = bitmap((x, y) => Math.round(pattern(x, y) * 0.8 + 40));
  assert.ok(matchTemplate(template, shiftedBrightness, WIDTH, HEIGHT) > 0.999);
  for (let index = 0; index < image.length; index += 4) {
    [image[index], image[index + 2]] = [image[index + 2], image[index]];
  }
  assert.ok(matchTemplate(template, image, WIDTH, HEIGHT) > 0.9999);
});

test('matches a fixed outer border even when the crop interior is uniform', () => {
  const image = bitmap((x, y) =>
    x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1 ? 190 : 32,
  );
  const template = createTemplate(image, WIDTH, HEIGHT);
  assert.equal(validateTemplate(template), true);
  assert.ok(matchTemplate(template, image, WIDTH, HEIGHT) > 0.9999);
});

test('tolerates one-pixel horizontal and vertical movement in every direction', () => {
  const template = createTemplate(bitmap(), WIDTH, HEIGHT);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const translated = bitmap((x, y) => pattern(x - dx, y - dy));
      assert.ok(matchTemplate(template, translated, WIDTH, HEIGHT) > 0.999, `offset ${dx},${dy}`);
    }
  }
});

test('scores an unrelated pattern low and rejects black or low-contrast captures', () => {
  const template = createTemplate(bitmap(), WIDTH, HEIGHT);
  const unrelated = bitmap((x, y) => ((Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? 200 : 40));
  assert.ok(matchTemplate(template, unrelated, WIDTH, HEIGHT) < 0.4);
  const black = Buffer.alloc(WIDTH * HEIGHT * 4);
  const lowContrast = bitmap((x, y) => (pattern(x, y) > 100 ? 105 : 100));
  for (const image of [black, lowContrast]) {
    assert.equal(createTemplate(image, WIDTH, HEIGHT), null);
    assert.equal(matchTemplate(template, image, WIDTH, HEIGHT), 0);
  }
});

test('rejects illegal sizes, buffer types, lengths and mismatched template dimensions', () => {
  const image = bitmap();
  const template = createTemplate(image, WIDTH, HEIGHT);
  for (const [width, height] of [
    [0, HEIGHT],
    [-1, HEIGHT],
    [7, HEIGHT],
    [WIDTH, 7],
    [WIDTH + 0.5, HEIGHT],
    [129, HEIGHT],
    [WIDTH, 65],
    [Infinity, HEIGHT],
    ['64', HEIGHT],
  ]) {
    assert.equal(createTemplate(image, width, height), null);
    assert.equal(matchTemplate(template, image, width, height), 0);
  }
  for (const invalid of [null, [], new Uint16Array(WIDTH * HEIGHT * 2), image.subarray(4)]) {
    assert.equal(createTemplate(invalid, WIDTH, HEIGHT), null);
    assert.equal(matchTemplate(template, invalid, WIDTH, HEIGHT), 0);
  }
  assert.equal(matchTemplate(template, bitmap(pattern, HEIGHT, WIDTH), HEIGHT, WIDTH), 0);
});

test('rejects corrupt, oversized, sparse and low-information templates loaded from settings', () => {
  const template = createTemplate(bitmap(), WIDTH, HEIGHT);
  const corrupt = [
    null,
    [],
    {},
    { ...template, version: 2 },
    { ...template, width: 1000000 },
    { ...template, extra: true },
    { ...template, gray: template.gray.slice(1) },
    { ...template, gray: new Array(WIDTH * HEIGHT) },
    { ...template, gray: new Array(WIDTH * HEIGHT).fill(0) },
    { ...template, gray: new Array(8193).fill(100) },
  ];
  for (const value of [-1, 256, NaN, Infinity, 100.5, '100', null]) {
    const gray = [...template.gray];
    gray[0] = value;
    corrupt.push({ ...template, gray });
  }
  for (const value of corrupt) {
    assert.equal(validateTemplate(value), false);
    assert.equal(matchTemplate(value, bitmap(), WIDTH, HEIGHT), 0);
  }
});
