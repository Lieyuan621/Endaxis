import { equipmentFixture } from './sourceFixtures.ts';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  rebuildGameData,
  parseRebuildArguments,
  compareCandidateFiles,
  GAME_DATA_REBUILD_BOUNDARIES,
  GAME_DATA_CANDIDATE_TSCONFIG,
} from '../scripts/rebuildGameData.ts';
import { verifyGameDataSnapshot } from '../scripts/verifyGameDataSnapshot.ts';

const roots: string[] = [];
it('正式游戏定义目录不保留 JSON 中间产物', async () => {
  const files = await fs.readdir(path.resolve('src/data'), { recursive: true });
  expect(files.filter(file => file.endsWith('.json'))).toEqual([]);
});

it('候选类型门禁使用当前应用配置，不引用已经删除的 Next 配置', async () => {
  const config = JSON.parse(
    await fs.readFile(new URL(`../../../${GAME_DATA_CANDIDATE_TSCONFIG}`, import.meta.url), 'utf8'),
  );
  expect(config.include).toContain('src/**/*.ts');
});
afterEach(async () => {
  vi.unstubAllGlobals();
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true });
});

const hash = (content: string | Uint8Array) => createHash('sha256').update(content).digest('hex');
async function json(file: string, value: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value));
}

async function setup() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-rebuild-'));
  roots.push(root);
  const fixture = equipmentFixture();
  const sourceRoot = path.join(root, 'input');
  const configRoot = path.join(root, 'tools/game-data-compiler');
  const tables: Record<string, unknown> = {
    EquipTable: { [fixture.equipmentId]: fixture.equipTableEntry },
    ItemTable: { [fixture.equipmentId]: fixture.itemTableEntry },
    CharacterTable: { chr_known: {}, chr_new_or_nonplayable: {} },
    WeaponBasicTable: { wpn_new: {} },
    EquipSuitTable: { suit_known: {}, suit_new: {} },
  };
  const catalog = {
    tableCfg: Object.keys(tables),
    jsonCollections: { SkillData: 'SkillData' },
    jsonFiles: [],
  };
  await json(path.join(configRoot, 'game-data-sources.json'), catalog);
  await json(path.join(configRoot, 'config/operators.json'), {
    operators: [{ charId: 'chr_known' }, { charId: 'chr_removed' }],
  });
  await json(path.join(configRoot, 'config/gearSetIdentities.json'), ['suit_known']);
  const entries = [];
  for (const [name, value] of Object.entries(tables)) {
    const logicalPath = `TableCfg-current/${name}.json`;
    const content = JSON.stringify(value);
    await json(path.join(sourceRoot, logicalPath), value);
    entries.push({
      logicalPath,
      provider: 'akedb',
      version: 'test@1',
      byteLength: Buffer.byteLength(content),
      sha256: hash(content),
    });
  }
  entries.sort((a, b) => a.logicalPath.localeCompare(b.logicalPath));
  const ledger = {
    schemaVersion: 2,
    mode: 'hybrid',
    akedb: { version: 'test@1' },
    inventories: [],
    snapshotSha256: hash(entries.map(e => `${e.logicalPath}\0${e.sha256}\n`).join('')),
    entries,
  };
  const ledgerPath = path.join(sourceRoot, 'source-provenance.json');
  await json(ledgerPath, ledger);
  return { root, sourceRoot, fixture, catalog, ledger, ledgerPath, tables };
}

describe('从无产物工作树重建装备候选', () => {
  it('默认保留 AKEDB 主源；发布必须显式开启，且不提供 VFS-only 或正式输出路径开关', () => {
    expect(parseRebuildArguments([])).toMatchObject({
      workers: 6,
      tablesOnly: false,
      publish: false,
      cdn: 'https://data.akedata.wiki',
    });
    expect(parseRebuildArguments(['--publish']).publish).toBe(true);
    expect(parseRebuildArguments(['--unity-worker', 'worker.exe']).unityWorker).toBe(
      path.resolve('worker.exe'),
    );
    expect(() => parseRebuildArguments(['--unity-worker'])).toThrow('missing');
    for (const values of [
      ['--publish', '--publish'],
      ['--publish', '--tables-only'],
      ['--source-mode', 'vfs-only'],
      ['--output', 'src'],
      ['--workers', '0'],
      ['--version', 'a', '--version', 'b'],
      ['--tables-only', '--tables-only'],
    ]) {
      expect(() => parseRebuildArguments(values)).toThrow();
    }
    const localeBoundary = GAME_DATA_REBUILD_BOUNDARIES.find(item => item.id === 'locales')!;
    expect(localeBoundary.outputs).toHaveLength(16);
    expect(localeBoundary.outputs).not.toContain('src/i18n/game-locales');
    expect(localeBoundary.outputs.filter(file => file.endsWith('/enemies.json'))).toHaveLength(2);
    expect(
      localeBoundary.outputs.filter(file => file.endsWith('/contingency-contracts.json')),
    ).toHaveLength(2);
    expect(localeBoundary.outputs.filter(file => file.endsWith('/consumables.json'))).toHaveLength(
      2,
    );
  });

  it('正式资源全不存在时生成真实夹具，并通过重复生成 --check；完整重建仍明确未完成', async () => {
    const { root, sourceRoot, fixture } = await setup();
    const { report, exitCode } = await rebuildGameData(
      parseRebuildArguments(['--source-root', sourceRoot]),
      root,
    );
    expect(exitCode).toBe(2);
    expect(report).toMatchObject({ fullRebuild: false, published: false });
    expect(report.stages.find(s => s.id === 'source-coverage')).toMatchObject({
      status: 'blocked',
    });
    expect(report.stages.find(s => s.id === 'gameplay-tags')).toMatchObject({ status: 'blocked' });
    expect(report.stages.find(s => s.id === 'candidate-type-check')).toMatchObject({
      status: 'blocked',
      detail: expect.stringContaining('不能用旧正式文件补齐'),
    });
    const gear = report.stages.find(s => s.id === 'gears');
    expect(gear).toMatchObject({
      status: 'passed',
      detail: {
        definitionCount: 1,
        definitionIds: [fixture.equipmentId],
        deterministicCheck: 'passed',
        comparison: { baselinePresent: false },
      },
    });
    await expect(fs.stat(path.join(root, 'src'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(
      fs.stat(path.join(report.candidateRoot, 'src/data/equipment/generated/index.generated.ts')),
    ).resolves.toBeDefined();
    expect(JSON.parse(await fs.readFile(path.join(report.runRoot, 'report.json'), 'utf8'))).toEqual(
      report,
    );
  });

  it('身份清单报告未配置与已消失项，不把角色差异擅自注册为可玩干员', async () => {
    const { root, sourceRoot } = await setup();
    const { report, exitCode } = await rebuildGameData(
      parseRebuildArguments(['--source-root', sourceRoot, '--tables-only']),
      root,
    );
    expect(exitCode).toBe(0);
    expect(report.fullRebuild).toBe(false);
    expect(report.stages.find(s => s.id === 'content-inventory')).toMatchObject({
      detail: {
        characters: {
          unconfiguredSourceIds: ['chr_new_or_nonplayable'],
          configuredIdsMissingFromSource: ['chr_removed'],
        },
        gearSets: { unconfiguredSourceIds: ['suit_new'] },
      },
    });
  });

  it('实际走下载器，从 AKEDB 请求表后直接生成，不需要已有来源/产物', async () => {
    const { root, tables } = await setup();
    const requests: string[] = [];
    vi.stubGlobal('fetch', async (input: string | URL) => {
      const url = new URL(input);
      requests.push(url.href);
      let value: unknown;
      if (url.pathname === '/manifest.json')
        value = { latest: 'test@1', versions: [{ id: 'test@1', tableCfgPath: 'tables' }] };
      else if (url.pathname === '/asset-sync-index.json')
        value = {
          schemaVersion: 2,
          revision: 'one',
          datasets: { json: { files: {} }, images: { files: {} } },
        };
      else if (url.pathname.startsWith('/tables/'))
        value = tables[path.basename(url.pathname, '.json')];
      return new Response(value === undefined ? null : JSON.stringify(value), {
        status: value === undefined ? 404 : 200,
      });
    });
    const { report, exitCode } = await rebuildGameData(
      parseRebuildArguments(['--tables-only', '--cdn', 'https://akedb.test']),
      root,
    );
    expect(exitCode).toBe(0);
    expect(report.stages.find(s => s.id === 'sources')).toMatchObject({
      detail: { providerCounts: { akedb: 5, vfs: 0 } },
    });
    expect(requests.every(url => url.startsWith('https://akedb.test/'))).toBe(true);
    expect(report.sourceRoot.startsWith(report.runRoot + path.sep)).toBe(true);
  });

  it('损坏来源不生成任何候选，也不回退旧缓存；明确版本冲突同样阻断', async () => {
    const { root, sourceRoot, ledgerPath, ledger } = await setup();
    let result = await rebuildGameData(
      parseRebuildArguments(['--source-root', sourceRoot, '--version', 'other']),
      root,
    );
    expect(result.exitCode).toBe(1);
    expect(result.report.stages[0]).toMatchObject({
      status: 'failed',
      detail: expect.stringContaining('does not match'),
    });
    await json(ledgerPath, { ...ledger, mode: 'vfs-only' });
    result = await rebuildGameData(parseRebuildArguments(['--source-root', sourceRoot]), root);
    expect(result.exitCode).toBe(1);
    expect(result.report.stages.find(s => s.id === 'gears')?.status).toBe('blocked');
    await expect(fs.stat(result.report.candidateRoot)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('比较只忽略换行，保留新增/删除/内容变化，正式目录不被写入', async () => {
    const { root } = await setup();
    const baseline = path.join(root, 'baseline');
    const candidate = path.join(root, 'candidate');
    await fs.mkdir(baseline);
    await fs.mkdir(candidate);
    await fs.writeFile(path.join(baseline, 'same.ts'), 'a\r\n');
    await fs.writeFile(path.join(candidate, 'same.ts'), 'a\n');
    await fs.writeFile(path.join(baseline, 'removed.ts'), 'old');
    await fs.writeFile(path.join(candidate, 'added.ts'), 'new');
    await fs.writeFile(path.join(baseline, 'changed.ts'), 'a');
    await fs.writeFile(path.join(candidate, 'changed.ts'), 'b');
    expect(await compareCandidateFiles(baseline, candidate)).toEqual({
      baselinePresent: true,
      added: ['added.ts'],
      removed: ['removed.ts'],
      changed: ['changed.ts'],
    });
    expect(await fs.readFile(path.join(baseline, 'changed.ts'), 'utf8')).toBe('a');
  });

  it('清单缺一张非装备表也不能宣布表格切片成功，但仍收集独立装备结果', async () => {
    const { root, sourceRoot, catalog } = await setup();
    await json(path.join(root, 'tools/game-data-compiler/game-data-sources.json'), {
      ...catalog,
      tableCfg: [...catalog.tableCfg, 'I18nTextTable_CN'],
    });
    const { report, exitCode } = await rebuildGameData(
      parseRebuildArguments(['--source-root', sourceRoot, '--tables-only']),
      root,
    );
    expect(exitCode).toBe(2);
    expect(report.stages.find(s => s.id === 'source-coverage')).toMatchObject({
      status: 'blocked',
      detail: { missingInputs: ['TableCfg-current/I18nTextTable_CN.json'] },
    });
    expect(report.stages.find(s => s.id === 'gears')?.status).toBe('passed');
  });

  it('tmp 是指向其他目录的 junction 时不在链接目标里创建运行目录', async () => {
    const { root, sourceRoot } = await setup();
    const external = path.join(root, 'must-not-write');
    await fs.mkdir(external);
    await fs.symlink(external, path.join(root, 'tmp'), 'junction');
    await expect(
      rebuildGameData(parseRebuildArguments(['--source-root', sourceRoot]), root),
    ).rejects.toThrow('link');
    expect(await fs.readdir(external)).toEqual([]);
  });
});

describe('本地来源快照重新核验', () => {
  it('核对所有字节/条目/整批哈希，同时保留缺失集合与混源证据边界', async () => {
    const { sourceRoot, catalog } = await setup();
    expect(await verifyGameDataSnapshot(sourceRoot, catalog)).toMatchObject({
      resourceCount: 5,
      providerCounts: { akedb: 5, vfs: 0 },
      missingInputs: ['SkillData/<inventory>'],
      vfsVersionVerified: false,
    });
  });

  it.each([
    'bytes',
    'missing',
    'extra',
    'duplicate',
    'hash',
    'traversal',
    'provider',
    'fallback',
    'count',
  ])('拒绝 %s，不把损坏或混入文件的目录视作有效快照', async kind => {
    const { sourceRoot, catalog, ledger, ledgerPath } = await setup();
    const first = ledger.entries[0]!;
    if (kind === 'bytes') await fs.appendFile(path.join(sourceRoot, first.logicalPath), ' ');
    if (kind === 'missing') await fs.unlink(path.join(sourceRoot, first.logicalPath));
    if (kind === 'extra') await json(path.join(sourceRoot, 'SkillData/stale.json'), {});
    if (kind === 'duplicate') ledger.entries.push({ ...first });
    if (kind === 'hash') ledger.snapshotSha256 = '0'.repeat(64);
    if (kind === 'traversal') first.logicalPath = 'TableCfg-current/../escape.json';
    if (kind === 'provider') first.provider = 'old-cache';
    if (kind === 'fallback') first.provider = 'vfs-index-browser';
    if (kind === 'count')
      (ledger.inventories as unknown[]).push({
        collection: 'SkillData',
        files: 1,
        vfs: 'available',
      });
    await json(ledgerPath, ledger);
    await expect(verifyGameDataSnapshot(sourceRoot, catalog)).rejects.toThrow();
  });

  it('VFS 补缺可通过身份核验，但清单不可达仍不算全量覆盖', async () => {
    const { sourceRoot, catalog, ledger, ledgerPath } = await setup();
    await json(path.join(sourceRoot, 'SkillData/new.json'), {});
    ledger.entries.push({
      logicalPath: 'SkillData/new.json',
      provider: 'vfs-index-browser',
      version: 'unknown',
      byteLength: 2,
      sha256: hash('{}'),
      fallbackReason: 'not-in-akedb-index',
    } as (typeof ledger.entries)[number]);
    ledger.entries.sort((a, b) => a.logicalPath.localeCompare(b.logicalPath));
    ledger.snapshotSha256 = hash(
      ledger.entries.map(e => `${e.logicalPath}\0${e.sha256}\n`).join(''),
    );
    (ledger.inventories as unknown[]).push({
      collection: 'SkillData',
      files: 1,
      vfs: 'unavailable: timeout',
    });
    await json(ledgerPath, ledger);
    expect(await verifyGameDataSnapshot(sourceRoot, catalog)).toMatchObject({
      providerCounts: { akedb: 5, vfs: 1 },
      missingInputs: ['SkillData/<VFS inventory unavailable>'],
    });
  });
});
