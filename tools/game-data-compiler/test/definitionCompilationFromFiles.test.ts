import { equipmentFixture } from './sourceFixtures.ts';
/**
 * 用少量真实形状的原始文件验证装备与危机合约的独立编译入口。
 * 渲染函数被设为直接报错，确保这些入口只提供同批编译结果，且保留原来的来源阻断。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { activeSkillFixture, buffFixture as createBuffFixture } from './sourceFixtures.ts';

const { forbiddenRender } = vi.hoisted(() => ({
  forbiddenRender: vi.fn(() => {
    throw new Error('compilation must not render');
  }),
}));
vi.mock('prettier', () => ({ format: forbiddenRender, resolveConfig: forbiddenRender }));
vi.mock('../src/domains/weapon/renderRuntimeDefinitions.ts', () => ({
  renderWeaponDefinitionFiles: forbiddenRender,
}));
vi.mock('../src/domains/equipment/renderFormalDefinitions.ts', () => ({
  renderEquipmentDefinitionFiles: forbiddenRender,
}));
vi.mock('../src/domains/equipment/renderSuitDefinitions.ts', () => ({
  renderEquipmentSuitDefinitionFiles: forbiddenRender,
}));

import { compileWeaponDefinitionsFromFiles } from '../scripts/generateWeaponDefinitions.ts';
import { compileGearSetDefinitionsFromFiles } from '../scripts/generateGearSetDefinitions.ts';
import { compileGearDefinitionsFromFiles } from '../scripts/generateGearDefinitions.ts';
import { compileContingencyContractDefinitionsFromFiles } from '../scripts/generateContingencyContractDefinitions.ts';

const roots: string[] = [];
const gearFixture = equipmentFixture() as {
  equipmentId: string;
  equipTableEntry: Record<string, unknown>;
  itemTableEntry: Record<string, unknown>;
};
const buffFixture = { buff_fixture: createBuffFixture({ applyTags: [] }) };

function writeJson(file: string, value: unknown) {
  fs.writeFileSync(file, JSON.stringify(value));
}

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'definition-source-compilation-'));
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
  return { root, tables, skills, buffs, gameplayTagCatalog };
}

afterEach(() => {
  expect(forbiddenRender).not.toHaveBeenCalled();
  forbiddenRender.mockClear();
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('从原始文件独立编译定义', () => {
  it('单件装备只返回原批次，并在渲染前保留阻断检查', async () => {
    const { root, tables } = setup();
    writeJson(path.join(tables, 'EquipTable.json'), {
      [gearFixture.equipmentId]: gearFixture.equipTableEntry,
    });
    writeJson(path.join(tables, 'ItemTable.json'), {
      [gearFixture.equipmentId]: gearFixture.itemTableEntry,
    });
    const before = fs.readdirSync(root, { recursive: true });
    const batch = await compileGearDefinitionsFromFiles(tables);
    expect(batch.definitions.map(item => item.slug)).toEqual([gearFixture.equipmentId]);
    expect(batch.diagnostics.some(item => item.status === 'blocked')).toBe(false);
    expect(fs.readdirSync(root, { recursive: true })).toEqual(before);
    writeJson(path.join(tables, 'EquipTable.json'), {
      [gearFixture.equipmentId]: {
        ...gearFixture.equipTableEntry,
        equipAttrModifiers: (
          gearFixture.equipTableEntry.equipAttrModifiers as Record<string, unknown>[]
        ).filter(modifier => modifier.attrIndex !== 3),
      },
    });
    await expect(compileGearDefinitionsFromFiles(tables)).rejects.toThrow(
      'cannot render equipment definitions with',
    );
  });

  it('武器保留产品身份与完整词条，所有坏条目仍在同一次阻断中报告', () => {
    const { root, tables, skills, buffs } = setup();
    const weaponId = 'wpn_lance_fixture';
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
    writeJson(path.join(tables, 'ItemTable.json'), {
      [weaponId]: { ...gearFixture.itemTableEntry, id: weaponId, iconId: weaponId, rarity: 6 },
    });
    writeJson(
      path.join(skills, 'passive_fixture.json'),
      activeSkillFixture('passive_fixture', 'Passive'),
    );
    const args = { tables, skillData: skills, buffData: buffs };
    const before = fs.readdirSync(root, { recursive: true });
    const batch = compileWeaponDefinitionsFromFiles(args);
    expect(batch.definitions).toHaveLength(1);
    expect(batch.definitions[0]).toMatchObject({
      slug: weaponId,
      weaponType: 'polearm',
      traits: [{ key: 'skill1' }],
    });
    expect(fs.readdirSync(root, { recursive: true })).toEqual(before);
    writeJson(path.join(tables, 'WeaponBasicTable.json'), { wpn_a_bad: {}, wpn_b_bad: {} });
    expect(() => compileWeaponDefinitionsFromFiles(args)).toThrow(
      /weapon generation blocked by 2 diagnostic\(s\):[\s\S]*wpn_a_bad[\s\S]*wpn_b_bad/,
    );
  });

  it('套装返回与原编译批次相同的身份和诊断，不忽略坏的新条目', async () => {
    const { root, tables, skills, buffs, gameplayTagCatalog } = setup();
    const suit = {
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
    };
    writeJson(path.join(tables, 'EquipSuitTable.json'), { suit_fixture: suit });
    writeJson(
      path.join(skills, 'passive_fixture.json'),
      activeSkillFixture('passive_fixture', 'Passive'),
    );
    const args = {
      tablesDirectory: tables,
      skillDataDirectory: skills,
      buffDataDirectory: buffs,
      gameplayTagCatalog,
    };
    const before = fs.readdirSync(root, { recursive: true });
    const batch = await compileGearSetDefinitionsFromFiles(args);
    expect(batch.definitions.map(item => item.slug)).toEqual(['suit_fixture']);
    expect(batch.diagnostics).toEqual([]);
    expect(fs.readdirSync(root, { recursive: true })).toEqual(before);
    writeJson(path.join(tables, 'EquipSuitTable.json'), { suit_fixture: suit, suit_new_bad: {} });
    await expect(compileGearSetDefinitionsFromFiles(args)).rejects.toThrow(
      'gear sets are not runtime-closed:\nEquipSuitTable.suit_new_bad:',
    );
  });

  it('危机合约返回 Buff 闭包、两种计划、范围与版本，并保留不支持的词条阻断', () => {
    const { root, tables, buffs } = setup();
    const tag = (
      tagId: number,
      buffId: string,
      blackboard: { key: string; value: number; valueStr: string }[],
    ) => ({
      desc: { id: 1, text: '' },
      icon: `icon_${tagId}`,
      name: { id: 2, text: '' },
      romanNumSuffix: '',
      score: 1,
      tagId,
      tagTerms: [{ blackboard, buffId, termType: 1 }],
    });
    const entry = (tagId: number) => ({
      canPreview: false,
      conflictId: '',
      groupId: 10,
      keyId: '',
      lockIds: [],
      tagId,
      unlockActivityStage: '',
      unlockScore: 0,
    });
    const tags = {
      1: tag(1, 'buff_fixture', []),
      2: tag(2, 'buff_cc_enemy_common_hp_up', [{ key: 'hp_up', value: 1.5, valueStr: '' }]),
    };
    writeJson(path.join(tables, 'CcTagTable.json'), tags);
    writeJson(path.join(tables, 'ContingencyContractTable.json'), {
      contract: {
        activityId: 'activity',
        contractGroupMap: { 10: { contractMap: { 1: entry(1), 2: entry(2) } } },
      },
    });
    writeJson(path.join(buffs, 'buff_fixture.json'), {
      ...Object.values(buffFixture)[0],
      id: 'buff_fixture',
    });
    const scope = path.join(root, 'scope.json');
    const globalBuffCatalog = path.join(root, 'globals.json');
    const skillSettingCatalog = path.join(root, 'settings.json');
    writeJson(scope, {
      supportedTagIds: [1],
      enemyMaxHealthTagIds: [2],
      blockedTagReasons: {},
      omittedTagReasons: {},
    });
    writeJson(globalBuffCatalog, { version: 'fixture@1', evidence: {}, templates: {} });
    writeJson(skillSettingCatalog, {
      schemaVersion: 1,
      revision: 'fixture@1',
      data: [],
      enhanceFormulas: [],
      resources: {
        atbRecoverInterval: 1,
        atbGainEfficiency: 1,
        atbConsumedDefaultUspGainSelf: 1,
        atbConsumedDefaultUspGainOther: 1,
      },
    });
    const args = {
      tableRoot: tables,
      buffDataRoot: buffs,
      globalBuffCatalog,
      skillSettingCatalog,
      gameplayTagPaths: [],
      scope,
    };
    const before = fs.readdirSync(root, { recursive: true });
    const compiled = compileContingencyContractDefinitionsFromFiles(args);
    expect(compiled.buffDefinitions.buff_fixture).toBeDefined();
    const plan = compiled.initializationPlans[0];
    expect(plan?.tagId).toBe(1);
    const planEntry = plan?.sequence.$sequence;
    expect(
      planEntry !== null &&
        planEntry !== undefined &&
        plan?.actionGraph.main.nodes[planEntry]?.action,
    ).toMatchObject({ kind: 'applyBuff', parameters: { buffId: 'buff_fixture', target: 'enemy' } });
    expect(compiled.enemyMaxHealthPlans).toEqual([{ tagId: 2, multiplier: 1.5 }]);
    expect(compiled.scope.supportedTagIds).toEqual(new Set([1]));
    expect(compiled.revision).toBe('fixture@1');
    expect(fs.readdirSync(root, { recursive: true })).toEqual(before);
    writeJson(path.join(tables, 'CcTagTable.json'), {
      ...tags,
      1: { ...tags[1], tagTerms: [{ blackboard: [], buffId: 'countdown', termType: 3 }] },
    });
    expect(() => compileContingencyContractDefinitionsFromFiles(args)).toThrow(
      'supported tag 1 contains a challenge-time-only term',
    );
  });
});
