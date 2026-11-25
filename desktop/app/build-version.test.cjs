const test = require('node:test');
const assert = require('node:assert/strict');
const { encodeBuildVersion, versionOrder } = require('./build-version.cjs');

test('displays build time in Beijing time, including year rollover and leap day', () => {
  for (const [utc, expected] of [
    ['2026-12-31T16:00:03Z', '2027.1.1-T000003'],
    ['2024-02-29T05:06:07Z', '2024.2.29-T130607'],
  ]) assert.equal(encodeBuildVersion(new Date(utc)), expected);
  assert.ok(versionOrder('2026.10.1-T000000') > versionOrder('2026.9.30-T235959'));
  assert.equal(encodeBuildVersion(new Date('2026-11-25T09:05:07Z')), '2026.11.25-T170507');
});
