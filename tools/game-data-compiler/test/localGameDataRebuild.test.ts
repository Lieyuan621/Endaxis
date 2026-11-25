import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  hasExportedFile,
  parseLocalRebuildConfig,
  sourceServiceAddress,
} from '../scripts/rebuildLocalGameData.ts';

const config = {
  version: 'fixture',
  python: '../tool/.venv/python',
  akeToolRoot: '../ake',
  vfsRoot: './vfs',
  runtimeRoot: './runtime',
  jsonRoot: './Json',
  tableRoot: './TableCfg',
  imageRoot: './images',
};
const file = path.resolve('tmp/fixture/settings.json');

describe('local resource rebuild boundary', () => {
  it('recognizes collections whose exports are all in nested folders', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-nested-export-'));
    try {
      await fs.mkdir(path.join(root, 'stage', 'wave'), { recursive: true });
      await fs.writeFile(path.join(root, 'stage', 'wave', 'spawner.json'), '{}');
      expect(await hasExportedFile(root, ['.json'])).toBe(true);
      expect(await hasExportedFile(root, ['.png', '.webp'])).toBe(false);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
  it('resolves inputs relative to the configuration, with explicit local-only defaults', () => {
    expect(parseLocalRebuildConfig(config, file)).toMatchObject({
      python: path.resolve(path.dirname(file), config.python),
      akeToolRoot: path.resolve(path.dirname(file), config.akeToolRoot),
      vfsRoot: path.resolve(path.dirname(file), config.vfsRoot),
      sourceMode: 'local-only',
      workers: 2,
    });
    expect(parseLocalRebuildConfig({ ...config, python: 'python' }, file).python).toBe('python');
  });
  it.each([
    { ...config, keyFile: './key' },
    { ...config, runtimeRoot: undefined },
    { ...config, workers: 0 },
    { ...config, sourceMode: 'fallback' },
    { ...config, imageRoot: '' },
    { ...config, runtimeRoo: './typo' },
  ])('rejects incomplete or ambiguous input before execution: %j', value => {
    expect(() => parseLocalRebuildConfig(value, file)).toThrow();
  });
  it('supports a key file without a native runtime host', () => {
    const value = parseLocalRebuildConfig(
      { ...config, runtimeRoot: undefined, keyFile: './key' },
      file,
    );
    expect(value.runtimeRoot).toBeUndefined();
    expect(value.keyFile).toBe(path.resolve(path.dirname(file), 'key'));
  });
  it('accepts only a validated address reported by the newly started source process', () => {
    expect(sourceServiceAddress('other output', 'fixture')).toBeUndefined();
    expect(
      sourceServiceAddress('ENDAXIS_SOURCE_READY {"port":12345,"version":"fixture"}', 'fixture'),
    ).toBe('http://127.0.0.1:12345/api/data');
    for (const value of [
      { port: 0, version: 'fixture' },
      { port: 12345, version: 'other' },
      { port: '12345', version: 'fixture' },
    ])
      expect(() =>
        sourceServiceAddress('ENDAXIS_SOURCE_READY ' + JSON.stringify(value), 'fixture'),
      ).toThrow();
  });
});
