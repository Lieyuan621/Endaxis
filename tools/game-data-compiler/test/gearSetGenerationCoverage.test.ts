import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  compileAllGearSetDefinitions,
  generateGearSetDefinitions,
} from '../scripts/generateGearSetDefinitions.ts';
import { compileEquipmentSuitStaticDefinitionBatchSource } from '../src/domains/equipment/suitStaticDefinition.ts';
import { compileEquipmentSuitRuntimeBatchSource } from '../src/domains/equipment/suitRuntimeDefinition.ts';
import { activeSkillFixture } from './sourceFixtures.ts';

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true });
});
const passive = activeSkillFixture('passive_fixture', 'Passive');
const skillData = { passive_fixture: passive };
const suit = (id: string, skillId = 'passive_fixture') => ({
  equipList: ['gear_a', 'gear_b', 'gear_c'],
  list: [
    {
      equipCnt: 3,
      skillID: skillId,
      skillLv: 1,
      suitID: id,
      suitLogoName: `icon_${id}`,
      suitName: { id: 1, text: '' },
    },
  ],
});

describe('套装来源全量发现，不依赖已发布身份名单', () => {
  it('未知于旧配置的身份也进入相同的转换路径，输出与公共批量编译等价', () => {
    const table = {
      suit_fixture_new: suit('suit_fixture_new'),
      suit_fixture_old: suit('suit_fixture_old'),
    };
    const result = compileAllGearSetDefinitions(table, skillData, {}, {});
    const shared = compileEquipmentSuitStaticDefinitionBatchSource(table, skillData, {});
    expect(result).toEqual(
      compileEquipmentSuitRuntimeBatchSource(shared.definitions, shared.runtimeDependencies, {}),
    );
    expect(result.definitions.map(d => d.slug)).toEqual(['suit_fixture_new', 'suit_fixture_old']);
    expect(result.definitions.map(d => d.skillId)).toEqual(['passive_fixture', 'passive_fixture']);
  });

  it('逐项收集错误，坏的新条目不会被跳过或遮住后续有效条目', () => {
    const result = compileAllGearSetDefinitions(
      {
        suit_a_bad: {},
        suit_b_missing: suit('suit_b_missing', 'missing'),
        suit_c_ok: suit('suit_c_ok'),
        suit_d_empty: { equipList: [], list: [] },
      },
      skillData,
      {},
      {},
    );
    expect(result.definitions.map(d => d.slug)).toEqual(['suit_c_ok']);
    expect(result.diagnostics.filter(d => d.status === 'blocked').map(d => d.sourcePath)).toEqual([
      'EquipSuitTable.suit_a_bad',
      'EquipSuitTable.suit_b_missing',
      'EquipSuitTable.suit_d_empty',
    ]);
    expect(() => compileAllGearSetDefinitions({}, {}, {}, {})).toThrow('empty source');
  });

  it('任一来源失败时不写任何候选文件，也不替换已有目录', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-suit-generation-'));
    roots.push(root);
    const tables = path.join(root, 'tables'),
      skills = path.join(root, 'skills'),
      buffs = path.join(root, 'buffs'),
      output = path.join(root, 'output');
    for (const dir of [tables, skills, buffs, output]) await fs.mkdir(dir);
    await fs.writeFile(path.join(output, 'sentinel.txt'), 'preserve');
    await fs.writeFile(
      path.join(tables, 'EquipSuitTable.json'),
      JSON.stringify({ suit_ok: suit('suit_ok'), suit_new_bad: {} }),
    );
    await fs.writeFile(path.join(tables, 'SkillPatchTable.json'), '{}');
    await fs.writeFile(path.join(skills, 'passive_fixture.json'), JSON.stringify(passive));
    await expect(
      generateGearSetDefinitions({
        tablesDirectory: tables,
        skillDataDirectory: skills,
        buffDataDirectory: buffs,
        gameplayTagCatalog: 'src/data/combat/gameplayTagCatalog.generated.ts',
        outputDirectory: output,
        check: false,
      }),
    ).rejects.toThrow('suit_new_bad');
    expect(await fs.readdir(output)).toEqual(['sentinel.txt']);
    expect(await fs.readFile(path.join(output, 'sentinel.txt'), 'utf8')).toBe('preserve');
  });
});
