/**
 * 检查一轮规划内固定目录的复用、每名干员原始文件的释放，以及新一轮对来源变化的重新检查。
 * 使用临时原始文件与真实目录解析器，不加载正式生成数据，也不运行完整干员规划。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OperatorPlanningSources } from '../scripts/operatorPlanningSources.ts';
import { abilityEntityFixture } from './sourceFixtures.ts';

const roots: string[] = [];
const tableNames = [
  'CharacterTable',
  'CharGrowthTable',
  'CharacterPotentialTable',
  'PotentialTalentEffectTable',
  'SkillConditionTable',
];

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'operator-planning-sources-'));
  roots.push(root);
  const tableRoot = path.join(root, 'tables');
  fs.mkdirSync(tableRoot);
  const paths = {
    tableRoot,
    manifest: path.join(root, 'operators.json'),
    skillPatchTable: path.join(tableRoot, 'SkillPatchTable.json'),
    globalBuffCatalog: path.join(root, 'globals.json'),
    skillSettingCatalog: path.join(root, 'settings.json'),
  };
  const sharedFiles = [
    paths.manifest,
    paths.skillPatchTable,
    paths.globalBuffCatalog,
    paths.skillSettingCatalog,
    ...tableNames.map(name => path.join(tableRoot, `${name}.json`)),
  ];
  for (const file of sharedFiles) fs.writeFileSync(file, '{"value":1}');
  return { root, paths, sharedFiles };
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('干员规划读取上下文', () => {
  it('clear 释放两级原文缓存和全部解析目录，累计统计保留且重新读取反映磁盘变化', () => {
    const { root, paths } = setup();
    const skillFile = path.join(root, 'skill.json');
    const entityDirectory = path.join(root, 'AbilityEntityData');
    const tags = path.join(root, 'tags.ts');
    const priorities = path.join(root, 'priorities.ts');
    fs.mkdirSync(entityDirectory);
    fs.writeFileSync(
      path.join(entityDirectory, 'entity_fixture.json'),
      JSON.stringify({ ...abilityEntityFixture(), gameId: 'entity_fixture' }),
    );
    fs.writeFileSync(skillFile, '{"value":1}');
    fs.writeFileSync(
      paths.globalBuffCatalog,
      JSON.stringify({ version: 'fixture', evidence: {}, templates: {} }),
    );
    fs.writeFileSync(
      paths.skillSettingCatalog,
      JSON.stringify({
        schemaVersion: 1,
        revision: 'fixture',
        data: [],
        enhanceFormulas: [],
        resources: {
          atbRecoverInterval: 1,
          atbGainEfficiency: 1,
          atbConsumedDefaultUspGainSelf: 1,
          atbConsumedDefaultUspGainOther: 1,
        },
      }),
    );
    fs.writeFileSync(
      tags,
      "export const GAMEPLAY_TAG_PATHS = Object.freeze([\n  'fixture',\n] as const);\n",
    );
    fs.writeFileSync(
      priorities,
      "export const TIME_DILATION_PRIORITY_DEFINITIONS = Object.freeze([{ tagPath: 'TimeDilation/Priority/Fixture', value: 1 }] as const);\n",
    );
    const sources = new OperatorPlanningSources(paths);
    const catalogs = [
      () => sources.abilityEntities(entityDirectory),
      () => sources.globalBuffs(paths.globalBuffCatalog),
      () => sources.skillSettings(paths.skillSettingCatalog),
      () => sources.gameplayTags(tags),
      () => sources.timeDilationPriorities(priorities),
    ];
    const originals = catalogs.map(read => read());
    sources.readJson(paths.skillPatchTable);
    sources.readJson(skillFile);
    sources.readText(paths.skillPatchTable);
    sources.readText(skillFile);
    const before = sources.statistics();
    expect(before.shared.retainedSourceBytes).toBeGreaterThan(0);
    expect(before.currentOperator.retainedSourceBytes).toBeGreaterThan(0);
    expect(before.shared.cacheHits).toBeGreaterThan(0);
    expect(before.currentOperator.cacheHits).toBeGreaterThan(0);
    expect(before.parsedCatalogs).toBe(5);
    sources.clear();
    expect(sources.statistics()).toEqual({
      shared: { ...before.shared, retainedSourceBytes: 0 },
      currentOperator: { ...before.currentOperator, retainedSourceBytes: 0 },
      parsedCatalogs: 0,
    });
    fs.writeFileSync(paths.skillPatchTable, '{"value":2}');
    fs.writeFileSync(skillFile, '{"value":3}');
    expect(sources.readJson(paths.skillPatchTable)).toEqual({ value: 2 });
    expect(sources.readJson(skillFile)).toEqual({ value: 3 });
    for (const [index, read] of catalogs.entries()) expect(read()).not.toBe(originals[index]);
    expect(sources.statistics().shared.fileReads).toBeGreaterThan(before.shared.fileReads);
    expect(sources.statistics().currentOperator.fileReads).toBeGreaterThan(
      before.currentOperator.fileReads,
    );
    expect(sources.statistics().parsedCatalogs).toBe(5);
  });

  it('固定表与清单在逐人释放后继续复用同一份只读原文和 JSON', () => {
    const { paths, sharedFiles } = setup();
    const sources = new OperatorPlanningSources(paths);
    const originals = sharedFiles.map(file => sources.readJson(file));
    sources.releaseOperator();
    for (const [index, file] of sharedFiles.entries()) {
      expect(sources.readJson(path.relative(process.cwd(), file))).toBe(originals[index]);
      expect(sources.readText(file)).toBe('{"value":1}');
    }
    expect(sources.statistics()).toMatchObject({
      shared: { fileReads: 9, jsonParses: 9, cacheHits: 18 },
      currentOperator: { fileReads: 0, retainedSourceBytes: 0 },
    });
  });

  it('技能原文按人释放，下一名干员从磁盘读取新内容', () => {
    const { root, paths } = setup();
    const file = path.join(root, 'skill.json');
    fs.writeFileSync(file, '{ "value": 1 }');
    const sources = new OperatorPlanningSources(paths);
    expect(sources.readText(file)).toBe('{ "value": 1 }');
    fs.writeFileSync(file, '{"value":2}');
    expect(sources.readJson(file)).toEqual({ value: 1 });
    expect(sources.statistics().currentOperator.retainedSourceBytes).toBeGreaterThan(0);
    sources.releaseOperator();
    expect(sources.statistics().currentOperator.retainedSourceBytes).toBe(0);
    expect(sources.readJson(file)).toEqual({ value: 2 });
    expect(sources.statistics()).toMatchObject({
      shared: { fileReads: 0 },
      currentOperator: { fileReads: 2, jsonParses: 2, cacheHits: 1 },
    });
  });

  it('新的独立上下文重新读取固定表，不继承前一轮快照', () => {
    const { paths } = setup();
    const first = new OperatorPlanningSources(paths);
    const original = first.readJson(paths.skillPatchTable);
    fs.writeFileSync(paths.skillPatchTable, '{"value":2}');
    first.releaseOperator();
    expect(first.readJson(paths.skillPatchTable)).toBe(original);
    const second = new OperatorPlanningSources(paths);
    expect(second.readJson(paths.skillPatchTable)).toEqual({ value: 2 });
    expect(second.statistics().shared.fileReads).toBe(1);
  });

  it('共享原始 JSON 的嵌套值不能被一个干员改写后传给下一个', () => {
    const { paths } = setup();
    fs.writeFileSync(paths.skillPatchTable, '{"levels":[{"value":1}]}');
    const sources = new OperatorPlanningSources(paths);
    const json = sources.readJson(paths.skillPatchTable) as { levels: { value: number }[] };
    expect(() => {
      json.levels[0]!.value = 2;
    }).toThrow(TypeError);
    expect(() => json.levels.push({ value: 3 })).toThrow(TypeError);
    sources.releaseOperator();
    expect(sources.readJson(paths.skillPatchTable)).toEqual({ levels: [{ value: 1 }] });
  });

  it('能力实体目录一轮只扫描一次，新上下文仍检测新出现的非法目录条目', () => {
    const { root, paths } = setup();
    const directory = path.join(root, 'AbilityEntityData');
    fs.mkdirSync(directory);
    fs.writeFileSync(
      path.join(directory, 'entity_fixture.json'),
      JSON.stringify({ ...abilityEntityFixture(), gameId: 'entity_fixture' }),
    );
    const scan = vi.spyOn(fs, 'readdirSync');
    const sources = new OperatorPlanningSources(paths);
    const first = sources.abilityEntities(directory);
    expect(first.byId.has('entity_fixture')).toBe(true);
    sources.releaseOperator();
    expect(sources.statistics().currentOperator.retainedSourceBytes).toBe(0);
    fs.mkdirSync(path.join(directory, 'unexpected'));
    expect(sources.abilityEntities(path.relative(process.cwd(), directory))).toBe(first);
    expect(scan.mock.calls.filter(([file]) => file === directory)).toHaveLength(1);
    expect(sources.statistics().parsedCatalogs).toBe(1);
    expect(() => new OperatorPlanningSources(paths).abilityEntities(directory)).toThrow(
      'unexpected ability entity source entry: unexpected',
    );
    expect(scan.mock.calls.filter(([file]) => file === directory)).toHaveLength(2);
  });

  it('已解析的公共目录跨人复用，新上下文重新验证文本目录', () => {
    const { root, paths } = setup();
    fs.writeFileSync(
      paths.globalBuffCatalog,
      JSON.stringify({
        version: 'fixture',
        evidence: {},
        templates: {},
      }),
    );
    fs.writeFileSync(
      paths.skillSettingCatalog,
      JSON.stringify({
        schemaVersion: 1,
        revision: 'fixture',
        data: [],
        enhanceFormulas: [],
        resources: {
          atbRecoverInterval: 1,
          atbGainEfficiency: 1,
          atbConsumedDefaultUspGainSelf: 1,
          atbConsumedDefaultUspGainOther: 1,
        },
      }),
    );
    const tags = path.join(root, 'tags.ts');
    const priorities = path.join(root, 'priorities.ts');
    fs.writeFileSync(
      tags,
      "export const GAMEPLAY_TAG_PATHS = Object.freeze([\n  'fixture',\n] as const);\n",
    );
    fs.writeFileSync(
      priorities,
      "export const TIME_DILATION_PRIORITY_DEFINITIONS = Object.freeze([{ tagPath: 'TimeDilation/Priority/Fixture', value: 1 }] as const);\n",
    );
    const sources = new OperatorPlanningSources(paths);
    const globals = sources.globalBuffs(paths.globalBuffCatalog);
    const settings = sources.skillSettings(paths.skillSettingCatalog);
    const tagPaths = sources.gameplayTags(tags);
    const priorityValues = sources.timeDilationPriorities(priorities);
    sources.releaseOperator();
    expect(sources.globalBuffs(paths.globalBuffCatalog)).toBe(globals);
    expect(sources.skillSettings(paths.skillSettingCatalog)).toBe(settings);
    expect(sources.gameplayTags(tags)).toBe(tagPaths);
    expect(sources.timeDilationPriorities(priorities)).toBe(priorityValues);
    expect(Object.isFrozen(tagPaths)).toBe(true);
    expect(sources.statistics()).toMatchObject({
      shared: { fileReads: 2, jsonParses: 2 },
      currentOperator: { fileReads: 2, retainedSourceBytes: 0 },
      parsedCatalogs: 4,
    });
    fs.writeFileSync(tags, 'invalid changed source');
    fs.writeFileSync(priorities, 'invalid changed source');
    const second = new OperatorPlanningSources(paths);
    expect(() => second.gameplayTags(tags)).toThrow('GAMEPLAY_TAG_PATHS not found');
    expect(() => second.timeDilationPriorities(priorities)).toThrow(
      'TIME_DILATION_PRIORITY_DEFINITIONS not found',
    );
  });
});
