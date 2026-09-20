import { equipmentFixture } from './sourceFixtures.ts';
/** 验证同批编译结果可重复渲染，独立生成只编译一次，正式文件和检查行为保持一致。 */
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { activeSkillFixture } from './sourceFixtures.ts';

vi.mock('node:fs/promises', async importOriginal => {
  const original = await importOriginal<typeof import('node:fs/promises')>();
  return { ...original, readFile: vi.fn(original.readFile) };
});

import {
  compileWeaponDefinitionsFromFiles,
  generateWeaponDefinitions,
  renderWeaponDefinitionsFromCompiled,
} from '../scripts/generateWeaponDefinitions.ts';
import { formatGeneratedSource } from '../scripts/formatGeneratedSource.ts';
import {
  compileGearDefinitionsFromFiles,
  generateGearDefinitions,
  planGearDefinitions,
  renderGearDefinitionsFromCompiled,
} from '../scripts/generateGearDefinitions.ts';
import {
  compileGearSetDefinitionsFromFiles,
  generateGearSetDefinitions,
  renderGearSetDefinitionsFromCompiled,
} from '../scripts/generateGearSetDefinitions.ts';
import {
  compileContingencyContractDefinitionsFromFiles,
  generateContingencyContractDefinitions,
  renderContingencyContractDefinitionsFromCompiled,
} from '../scripts/generateContingencyContractDefinitions.ts';

const roots: string[] = [];
const gearFixture = equipmentFixture() as {
  equipmentId: string;
  equipTableEntry: Record<string, unknown>;
  itemTableEntry: Record<string, unknown>;
};
const weaponId = 'wpn_lance_fixture';

function writeJson(file: string, value: unknown) {
  fs.writeFileSync(file, JSON.stringify(value));
}

/** 四个来源都只有一个条目，仍走正式来源解析器和领域编译器。 */
function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'definition-compiled-render-'));
  roots.push(root);
  const tables = path.join(root, 'tables');
  const skills = path.join(root, 'skills');
  const buffs = path.join(root, 'buffs');
  for (const directory of [tables, skills, buffs]) fs.mkdirSync(directory);
  const gameplayTagCatalog = path.join(root, 'tags.ts');
  fs.writeFileSync(
    gameplayTagCatalog,
    "export const GAMEPLAY_TAG_PATHS = Object.freeze([\n  'fixture',\n] as const);\n",
  );
  writeJson(path.join(tables, 'SkillPatchTable.json'), {});
  writeJson(path.join(tables, 'EquipTable.json'), {
    [gearFixture.equipmentId]: gearFixture.equipTableEntry,
  });
  writeJson(path.join(tables, 'ItemTable.json'), {
    [gearFixture.equipmentId]: gearFixture.itemTableEntry,
    [weaponId]: { ...gearFixture.itemTableEntry, id: weaponId, iconId: weaponId, rarity: 6 },
  });
  writeJson(path.join(tables, 'WeaponBasicTable.json'), {
    [weaponId]: {
      breakthroughTemplateId: 'breakthrough',
      engName: { id: 1, text: '' },
      levelTemplateId: 'upgrade',
      maxLv: 90,
      modelPath: `Gameplay/${weaponId}.prefab`,
      potentialUpItemList: [],
      rarity: 6,
      talentTemplateId: 'potential',
      weaponDesc: { id: 2, text: '' },
      weaponId,
      weaponPotentialSkill: 'passive_fixture',
      weaponSkillList: ['passive_fixture'],
      weaponType: 5,
    },
  });
  writeJson(path.join(tables, 'WeaponUpgradeTemplateTable.json'), {
    upgrade: {
      list: [1, 20, 40, 60, 80, 90].map(weaponLv => ({
        weaponLv,
        baseAtk: weaponLv,
        lvUpExp: 0,
        lvUpGold: 0,
      })),
    },
  });
  writeJson(
    path.join(skills, 'passive_fixture.json'),
    activeSkillFixture('passive_fixture', 'Passive'),
  );
  writeJson(path.join(tables, 'EquipSuitTable.json'), {
    suit_fixture: {
      equipList: ['gear_a', 'gear_b', 'gear_c'],
      list: [
        {
          equipCnt: 3,
          skillID: 'passive_fixture',
          skillLv: 1,
          suitID: 'suit_fixture',
          suitLogoName: 'icon_fixture',
          suitName: { id: 1, text: '' },
        },
      ],
    },
  });
  writeJson(path.join(tables, 'CcTagTable.json'), {
    1: {
      desc: { id: 1, text: '' },
      icon: 'icon_1',
      name: { id: 2, text: '' },
      romanNumSuffix: '',
      score: 1,
      tagId: 1,
      tagTerms: [
        {
          buffId: 'buff_cc_enemy_common_hp_up',
          termType: 1,
          blackboard: [{ key: 'hp_up', value: 1.5, valueStr: '' }],
        },
      ],
    },
  });
  writeJson(path.join(tables, 'ContingencyContractTable.json'), {
    contract: {
      activityId: 'activity',
      contractGroupMap: {
        10: {
          contractMap: {
            1: {
              canPreview: false,
              conflictId: '',
              groupId: 10,
              keyId: '',
              lockIds: [],
              tagId: 1,
              unlockActivityStage: '',
              unlockScore: 0,
            },
          },
        },
      },
    },
  });
  const scope = path.join(root, 'scope.json');
  const globalBuffCatalog = path.join(root, 'globals.json');
  const skillSettingCatalog = path.join(root, 'settings.json');
  writeJson(scope, {
    supportedTagIds: [],
    enemyMaxHealthTagIds: [1],
    blockedTagReasons: {},
    omittedTagReasons: {},
  });
  writeJson(globalBuffCatalog, { version: 'fixture@1', evidence: {}, templates: {} });
  writeJson(skillSettingCatalog, {});
  return {
    root,
    tables,
    weapon: { tables, skillData: skills, buffData: buffs, gameplayTagCatalog },
    gearSet: {
      tablesDirectory: tables,
      skillDataDirectory: skills,
      buffDataDirectory: buffs,
      gameplayTagCatalog,
    },
    mechanic: {
      tableRoot: tables,
      buffDataRoot: buffs,
      globalBuffCatalog,
      skillSettingCatalog,
      gameplayTagPaths: [],
      scope,
    },
  };
}

function expectFiles(output: string, files: readonly { relativePath: string; content: string }[]) {
  const paths = fs
    .readdirSync(output, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry =>
      path.relative(output, path.join(entry.parentPath, entry.name)).replaceAll('\\', '/'),
    )
    .sort();
  expect(paths).toEqual(files.map(file => file.relativePath).sort());
  for (const file of files)
    expect(fs.readFileSync(path.join(output, file.relativePath), 'utf8')).toBe(file.content);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('复用已编译批次渲染', () => {
  it('武器一次读取来源，正式文件与独立审计同值；check 保留审计目录', async () => {
    const source = setup();
    const table = path.join(source.tables, 'WeaponBasicTable.json');
    const reads = vi.spyOn(fs, 'readFileSync');
    const compiled = compileWeaponDefinitionsFromFiles(source.weapon);
    const before = structuredClone(compiled);
    const rendered = renderWeaponDefinitionsFromCompiled(compiled);
    expect(reads.mock.calls.filter(([file]) => file === table)).toHaveLength(1);
    expect(compiled).toEqual(before);
    const output = path.join(source.root, 'weapons');
    const auditOutput = path.join(source.root, 'audit');
    expect(
      await generateWeaponDefinitions({ ...source.weapon, output, auditOutput, check: false }),
    ).toEqual(rendered.summary);
    expect(reads.mock.calls.filter(([file]) => file === table)).toHaveLength(2);
    expectFiles(
      output,
      await Promise.all(
        rendered.files.map(async file => ({
          ...file,
          content: await formatGeneratedSource(file.content, path.join(output, file.relativePath)),
        })),
      ),
    );
    expectFiles(auditOutput, rendered.auditFiles);
    const auditFile = path.join(auditOutput, rendered.auditFiles[0]!.relativePath);
    fs.writeFileSync(auditFile, 'keep audit during check');
    await generateWeaponDefinitions({ ...source.weapon, output, auditOutput, check: true });
    expect(reads.mock.calls.filter(([file]) => file === table)).toHaveLength(3);
    expect(fs.readFileSync(auditFile, 'utf8')).toBe('keep audit during check');
    fs.unlinkSync(table);
    expect(renderWeaponDefinitionsFromCompiled(compiled)).toEqual(rendered);
  });

  it('单件装备生成与只读规划共用渲染，已编译结果不再依赖来源文件', async () => {
    const source = setup();
    const table = path.join(source.tables, 'EquipTable.json');
    const compiled = await compileGearDefinitionsFromFiles(source.tables);
    const before = structuredClone(compiled);
    const rendered = await renderGearDefinitionsFromCompiled(compiled);
    expect(vi.mocked(readFile).mock.calls.filter(([file]) => file === table)).toHaveLength(1);
    const outputDirectory = path.join(source.root, 'gears');
    expect(
      await generateGearDefinitions({
        tablesDirectory: source.tables,
        outputDirectory,
        check: false,
      }),
    ).toEqual({ outputDirectory, ...rendered.summary });
    expect(vi.mocked(readFile).mock.calls.filter(([file]) => file === table)).toHaveLength(2);
    expectFiles(outputDirectory, rendered.files);
    expect(await planGearDefinitions(source.tables)).toEqual({
      batch: compiled,
      files: rendered.files,
    });
    expect(vi.mocked(readFile).mock.calls.filter(([file]) => file === table)).toHaveLength(3);
    expect(compiled).toEqual(before);
    fs.unlinkSync(table);
    expect(await renderGearDefinitionsFromCompiled(compiled)).toEqual(rendered);
  });

  it('套装渲染只做优化和格式化，check 仍拒绝过期正式内容', async () => {
    const source = setup();
    const table = path.join(source.tables, 'EquipSuitTable.json');
    const compiled = await compileGearSetDefinitionsFromFiles(source.gearSet);
    const before = structuredClone(compiled);
    const rendered = await renderGearSetDefinitionsFromCompiled(compiled);
    expect(vi.mocked(readFile).mock.calls.filter(([file]) => file === table)).toHaveLength(1);
    const outputDirectory = path.join(source.root, 'sets');
    expect(
      await generateGearSetDefinitions({ ...source.gearSet, outputDirectory, check: false }),
    ).toEqual({ outputDirectory, ...rendered.summary });
    expect(vi.mocked(readFile).mock.calls.filter(([file]) => file === table)).toHaveLength(2);
    expectFiles(outputDirectory, rendered.files);
    fs.appendFileSync(path.join(outputDirectory, rendered.files[0]!.relativePath), '\nchanged');
    await expect(
      generateGearSetDefinitions({ ...source.gearSet, outputDirectory, check: true }),
    ).rejects.toThrow('stale');
    expect(vi.mocked(readFile).mock.calls.filter(([file]) => file === table)).toHaveLength(3);
    expect(compiled).toEqual(before);
    fs.unlinkSync(table);
    expect(await renderGearSetDefinitionsFromCompiled(compiled)).toEqual(rendered);
  });

  it('危机合约范围、版本和计划不重新编译，输出内容与独立生成一致', async () => {
    const source = setup();
    const table = path.join(source.tables, 'CcTagTable.json');
    const reads = vi.spyOn(fs, 'readFileSync');
    const compiled = compileContingencyContractDefinitionsFromFiles(source.mechanic);
    const before = structuredClone(compiled);
    const rendered = await renderContingencyContractDefinitionsFromCompiled(compiled);
    expect(reads.mock.calls.filter(([file]) => file === table)).toHaveLength(1);
    const output = path.join(source.root, 'mechanics');
    expect(
      await generateContingencyContractDefinitions({ ...source.mechanic, output, check: false }),
    ).toEqual(rendered.summary);
    expect(reads.mock.calls.filter(([file]) => file === table)).toHaveLength(2);
    expectFiles(output, rendered.files);
    await generateContingencyContractDefinitions({ ...source.mechanic, output, check: true });
    expect(reads.mock.calls.filter(([file]) => file === table)).toHaveLength(3);
    expect(compiled).toEqual(before);
    fs.unlinkSync(table);
    expect(await renderContingencyContractDefinitionsFromCompiled(compiled)).toEqual(rendered);
  });

  it('绕过来源文件直接传入 blocked 批次也不能渲染', async () => {
    const diagnostics = [
      { status: 'blocked' as const, sourcePath: 'fixture', reason: 'unsupported source' },
    ];
    expect(() => renderWeaponDefinitionsFromCompiled({ definitions: [], diagnostics })).toThrow(
      'weapon generation blocked',
    );
    await expect(
      renderGearSetDefinitionsFromCompiled({ definitions: [], diagnostics }),
    ).rejects.toThrow('gear sets are not runtime-closed');
    await expect(
      renderGearDefinitionsFromCompiled({ definitions: [], diagnostics }),
    ).rejects.toThrow('cannot render equipment definitions');
  });
});
