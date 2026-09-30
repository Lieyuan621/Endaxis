import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import {
  compileWeaponDefinitionsFromFiles,
  generateWeaponDefinitions,
  renderWeaponDefinitionsFromCompiled,
} from '../scripts/generateWeaponDefinitions.ts';
import { renderGearDefinitionsFromCompiled } from '../scripts/generateGearDefinitions.ts';
import { renderGearSetDefinitionsFromCompiled } from '../scripts/generateGearSetDefinitions.ts';
import { formatGeneratedSource } from '../scripts/formatGeneratedSource.ts';
import { activeSkillFixture, equipmentFixture } from './sourceFixtures.ts';

const roots: string[] = [];
const weaponId = 'wpn_lance_fixture';

function setupWeaponSource() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'weapon-compiled-render-'));
  roots.push(root);
  const tables = path.join(root, 'tables');
  const skillData = path.join(root, 'skills');
  const buffData = path.join(root, 'buffs');
  for (const directory of [tables, skillData, buffData]) fs.mkdirSync(directory);
  const writeTable = (name: string, value: unknown) =>
    fs.writeFileSync(path.join(tables, `${name}.json`), JSON.stringify(value));
  const item = equipmentFixture().itemTableEntry;
  writeTable('SkillPatchTable', {});
  writeTable('ItemTable', {
    [weaponId]: { ...item, id: weaponId, iconId: weaponId, rarity: 6 },
  });
  writeTable('WeaponBasicTable', {
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
  writeTable('WeaponUpgradeTemplateTable', {
    upgrade: {
      list: [1, 20, 40, 60, 80, 90].map(weaponLv => ({
        weaponLv,
        baseAtk: weaponLv,
        lvUpExp: 0,
        lvUpGold: 0,
      })),
    },
  });
  fs.writeFileSync(
    path.join(skillData, 'passive_fixture.json'),
    JSON.stringify(activeSkillFixture('passive_fixture', 'Passive')),
  );
  const gameplayTagCatalog = path.join(root, 'tags.ts');
  fs.writeFileSync(
    gameplayTagCatalog,
    "export const GAMEPLAY_TAG_PATHS = Object.freeze([\n  'fixture',\n] as const);\n",
  );
  return {
    root,
    table: path.join(tables, 'WeaponBasicTable.json'),
    source: { tables, skillData, buffData, gameplayTagCatalog },
  };
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

it('渲染已编译武器不重读来源，生成、审计和只读检查保持同一批内容', async () => {
  const { root, table, source } = setupWeaponSource();
  const compiled = compileWeaponDefinitionsFromFiles(source);
  const before = structuredClone(compiled);
  const rendered = renderWeaponDefinitionsFromCompiled(compiled);
  expect(compiled).toEqual(before);

  const output = path.join(root, 'weapons');
  const auditOutput = path.join(root, 'audit');
  expect(await generateWeaponDefinitions({ ...source, output, auditOutput, check: false })).toEqual(
    rendered.summary,
  );
  for (const file of rendered.files) {
    expect(fs.readFileSync(path.join(output, file.relativePath), 'utf8')).toBe(
      await formatGeneratedSource(file.content, path.join(output, file.relativePath)),
    );
  }
  const auditFile = path.join(auditOutput, rendered.auditFiles[0]!.relativePath);
  fs.writeFileSync(auditFile, 'keep audit during check');
  await generateWeaponDefinitions({ ...source, output, auditOutput, check: true });
  expect(fs.readFileSync(auditFile, 'utf8')).toBe('keep audit during check');

  fs.unlinkSync(table);
  expect(renderWeaponDefinitionsFromCompiled(compiled)).toEqual(rendered);
});

it('阻断诊断不能通过已编译批次直接绕过', async () => {
  const diagnostics = [
    { status: 'blocked' as const, sourcePath: 'fixture', reason: 'unsupported source' },
  ];
  expect(() => renderWeaponDefinitionsFromCompiled({ definitions: [], diagnostics })).toThrow(
    'weapon generation blocked',
  );
  await expect(renderGearDefinitionsFromCompiled({ definitions: [], diagnostics })).rejects.toThrow(
    'cannot render equipment definitions',
  );
  await expect(
    renderGearSetDefinitionsFromCompiled({ definitions: [], diagnostics }),
  ).rejects.toThrow('gear sets are not runtime-closed');
});
