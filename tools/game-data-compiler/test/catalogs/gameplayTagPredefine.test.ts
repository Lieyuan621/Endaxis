import { fixtureGameplayTagCatalog, fixtureGameplayTagRegistry } from '../gameplayTagFixtures.ts';
import { gameplayTagIdFromPath } from '../../src/source/nativeGameplayTags.ts';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseGameplayTagPredefineTableSource } from '../../src/source/gameplayTagPredefineTable.ts';
import { compileGameplayTagPredefine } from '../../src/compiler/catalogs/gameplayTagPredefine.ts';
import { generateGameplayTagPredefine } from '../../scripts/generateGameplayTagPredefine.ts';
import { GameplayTagPredefine } from '../../../../src/core/combat/tags/gameplayTagPredefine';
import { CombatBuffContainer } from '../../../../src/core/combat/buffs/combatBuffs';
import { CombatAttributeSet } from '../../../../src/core/combat/attributes/combatAttributes';
import { GameplayTagRegistry } from '../../../../src/core/combat/tags/gameplayTags';

const statusPath = 'Skill/Character/Common/PhysicalStatus/KnockdownStatus';
// 原生物理异常使用的免疫路径与 ID；不是完整生产配置。
function sourceTable() {
  return {
    predefinedTags: { Immobilized: { tagId: 430405417 } },
    predefinedQuery: { CantCastAnySkill: { queryType: 0, tags: [{ tagId: -1855674685 }] } },
    tagName2Immune: {
      [statusPath]: { predefinedTag: [{ tagId: -859615201 }, { tagId: 535615229 }] },
    },
  };
}
const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(directory => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe('GameplayTagPredefine 公共转换', () => {
  it('缺失路径时阻断整个输出，不丢条目、不覆盖已有文件', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-tag-predefine-'));
    directories.push(directory);
    const input = path.join(directory, 'source.json');
    const output = path.join(directory, 'generated.ts');
    await fs.writeFile(
      input,
      JSON.stringify({ ...sourceTable(), predefinedTags: { Missing: { tagId: 123 } } }),
    );
    await fs.writeFile(output, 'keep previous output');
    await expect(
      generateGameplayTagPredefine(input, output, 'fixture', fixtureGameplayTagCatalog),
    ).rejects.toThrow('无法解析 GameplayTag ID 123');
    expect(await fs.readFile(output, 'utf8')).toBe('keep previous output');
  });
  it('严格原表→唯一契约→现有实体标签存储的免疫准入', () => {
    const definition = compileGameplayTagPredefine(
      parseGameplayTagPredefineTableSource(sourceTable(), 'fixture'),
      fixtureGameplayTagRegistry,
    );
    expect(definition.immunityQueries).toEqual([
      {
        tag: statusPath,
        query: {
          queryType: 'hasAny',
          tags: [-859615201, 535615229].map(id => fixtureGameplayTagRegistry.resolve(id)),
        },
      },
    ]);
    const table = new GameplayTagPredefine(definition);
    const target = new CombatBuffContainer('enemy', new CombatAttributeSet<string>());
    expect(table.getTag('Immobilized')).toBe(fixtureGameplayTagRegistry.resolve(430405417));
    expect(table.getQuery('CantCastAnySkill')).toEqual({
      queryType: 'hasAny',
      tags: [fixtureGameplayTagRegistry.resolve(-1855674685)],
    });
    const tag = statusPath;
    expect(table.canAddTag(target, tag)).toBe(true);
    target.addEntityTags([fixtureGameplayTagRegistry.resolve(535615229)]);
    expect(table.canAddTag(target, tag)).toBe(false);
    target.removeEntityTags([fixtureGameplayTagRegistry.resolve(535615229)]);
    expect(table.canAddTag(target, tag)).toBe(true);
  });

  it.each(['hasAny', 'hasAll', 'exceptAny', 'exceptAll'])('缓存查询按原生枚举顺序读取 %s', kind => {
    const source = sourceTable();
    source.predefinedQuery.CantCastAnySkill.queryType = [
      'hasAny',
      'hasAll',
      'exceptAny',
      'exceptAll',
    ].indexOf(kind);
    expect(
      parseGameplayTagPredefineTableSource(source, 'fixture').predefinedQuery.CantCastAnySkill
        ?.queryType,
    ).toBe(kind);
  });

  it.each([-1, 4, 1.5, 'HasAny', null])('拒绝缓存查询的未知枚举 %s', kind => {
    const source = sourceTable();
    expect(() =>
      parseGameplayTagPredefineTableSource(
        { ...source, predefinedQuery: { X: { queryType: kind, tags: [] } } },
        'fixture',
      ),
    ).toThrow('fixture.predefinedQuery.X.queryType');
  });

  it.each([2147483648, -2147483649, 1.5, '1'])('标签 ID 必须是有符号 Int32：%s', id => {
    expect(() =>
      parseGameplayTagPredefineTableSource(
        { ...sourceTable(), predefinedTags: { X: { tagId: id } } },
        'fixture',
      ),
    ).toThrow('fixture.predefinedTags.X.tagId');
  });

  it('未知顶层/条目字段和缺失字典不能静默过滤', () => {
    expect(() =>
      parseGameplayTagPredefineTableSource({ ...sourceTable(), unexpected: {} }, 'fixture'),
    ).toThrow('unexpected fields');
    expect(() =>
      parseGameplayTagPredefineTableSource(
        { ...sourceTable(), predefinedTags: { X: { tagId: 1, extra: 1 } } },
        'fixture',
      ),
    ).toThrow('unexpected fields');
    expect(() => parseGameplayTagPredefineTableSource({ predefinedTags: {} }, 'fixture')).toThrow(
      'unexpected fields',
    );
    expect(() =>
      parseGameplayTagPredefineTableSource(
        { ...sourceTable(), tagName2Immune: { X: {} } },
        'fixture',
      ),
    ).toThrow('unexpected fields');
  });

  it('免疫查询复用非精确层级匹配，不把子标签当作未免疫', () => {
    const registry = new GameplayTagRegistry(['Immune/Physical', 'Immune/Physical/Boss']);
    const definition = compileGameplayTagPredefine(
      parseGameplayTagPredefineTableSource(
        {
          ...sourceTable(),
          tagName2Immune: {
            [statusPath]: { predefinedTag: [{ tagId: gameplayTagIdFromPath('Immune/Physical') }] },
          },
        },
        'fixture',
      ),
      fixtureGameplayTagRegistry,
    );
    const target = new CombatBuffContainer('enemy', new CombatAttributeSet<string>(), registry);
    target.addEntityTags(['Immune/Physical/Boss']);
    expect(new GameplayTagPredefine(definition).canAddTag(target, statusPath)).toBe(false);
  });

  it('文件生成只替换目标，--check 不写入且保留来源 SHA', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-tag-predefine-'));
    directories.push(directory);
    const input = path.join(directory, 'source.json');
    const output = path.join(directory, 'generated.ts');
    await fs.writeFile(input, JSON.stringify(sourceTable()));
    await fs.writeFile(path.join(directory, 'other.json'), 'keep');
    const result = await generateGameplayTagPredefine(
      input,
      output,
      'fixture',
      fixtureGameplayTagCatalog,
    );
    expect(result).toMatchObject({
      tags: 1,
      queries: 1,
      immunityQueries: 1,
      sourceSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    await expect(
      generateGameplayTagPredefine(input, output, 'fixture', fixtureGameplayTagCatalog, true),
    ).resolves.toEqual(result);
    const original = await fs.readFile(output, 'utf8');
    await expect(
      generateGameplayTagPredefine(input, output, 'changed', fixtureGameplayTagCatalog, true),
    ).rejects.toThrow('stale');
    expect(await fs.readFile(output, 'utf8')).toBe(original);
    expect(await fs.readFile(path.join(directory, 'other.json'), 'utf8')).toBe('keep');
  });

  it('生成内容不依赖候选文件的物理暂存深度', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-tag-predefine-'));
    directories.push(directory);
    const input = path.join(directory, 'source.json');
    const shallow = path.join(directory, 'shallow.ts');
    const deep = path.join(directory, 'a/b/c/deep.ts');
    await fs.mkdir(path.dirname(deep), { recursive: true });
    await fs.writeFile(input, JSON.stringify(sourceTable()));
    await generateGameplayTagPredefine(input, shallow, 'fixture', fixtureGameplayTagCatalog);
    await generateGameplayTagPredefine(input, deep, 'fixture', fixtureGameplayTagCatalog);
    expect(await fs.readFile(deep, 'utf8')).toBe(await fs.readFile(shallow, 'utf8'));
    expect(await fs.readFile(deep, 'utf8')).toContain(
      '"../../../packages/game-data-contract/src/gameplayTags.ts"',
    );
  });
});
