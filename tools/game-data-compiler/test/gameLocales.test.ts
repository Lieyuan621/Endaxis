import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { generateGameLocaleCandidate } from '../src/domains/locales/gameLocaleCandidate.ts';
import {
  compileWeaponSkillText,
  operatorLocaleIdentities,
} from '../src/domains/locales/gameLocales.ts';
import { normalizeRichText, replacePlaceholders } from '../src/domains/locales/localeText.ts';

it('本地化排除身份来自干员配置，不能排除正式干员或接收错误身份', () => {
  const entry = { slug: 'sample', charId: 'chr_main' };
  expect(
    operatorLocaleIdentities({
      operators: [{ ...entry, excludedLocaleCharIds: ['chr_alternate'] }],
    }).excludedOperators,
  ).toEqual(new Set(['chr_alternate']));
  expect(operatorLocaleIdentities({ operators: [entry] }).excludedOperators.size).toBe(0);
  expect(() =>
    operatorLocaleIdentities({ operators: [{ ...entry, excludedLocaleCharIds: ['chr_main'] }] }),
  ).toThrow('canonical operator');
  expect(() =>
    operatorLocaleIdentities({ operators: [{ ...entry, excludedLocaleCharIds: [1] }] }),
  ).toThrow('string list');
});

it('富文本和算式严格解析，舍入遵循源格式，不执行未知表达式', () => {
  expect(
    replacePlaceholders(
      '{(ATK + 1) / 2:0.0%} {buff_a\\duration:0} {half:0} {other:0}',
      { atk: 2, 'buff_a\\duration': 3, half: 2.5, other: 3.5 },
      'test',
    ),
  ).toBe('150.0% 3 2 4');
  expect(replacePlaceholders('{value:0.00}', { value: 2.675 }, 'test')).toBe('2.67');
  expect(replacePlaceholders('{value:0.##%}', { value: 0.125 }, 'test')).toBe('12.5%');
  for (const expression of [
    '{missing:0}',
    '{atk / 0:0}',
    '{atk.toString():0}',
    '{atk +:0}',
    '{atk; 1:0}',
  ])
    expect(() => replacePlaceholders(expression, { atk: 2 }, 'test')).toThrow();
  const text = '<@ba.vup>10%</><image="TermIcon/icon_term_ba_combo.png" scale=1.0>';
  expect(normalizeRichText(text, 'test')).toBe(
    '<@ba.vup>10%</><image="/icons/icon_term_ba_combo.webp">',
  );
  expect(normalizeRichText('<image="bufficon/new_icon.png">', 'test')).toBe(
    '<image="/icons/new_icon.webp">',
  );
  expect(() => normalizeRichText('<image="../private">', 'unsafe')).toThrow();
  for (const text of ['<unknown>x</>', '<@ba.vup>x', '</>', '<image="unknown.png">'])
    expect(() => normalizeRichText(text, 'test')).toThrow();
});

it('武器描述的等级差异变成参数表，跨等级模板变化则拒绝生成', () => {
  const bundle = (level: number, scale: number) => ({
    level,
    skillName: 'Effect',
    description: 'Damage {scale:0%}; duration {duration:0}s.',
    blackboard: [
      { key: 'scale', value: scale },
      { key: 'duration', value: 15 },
    ],
  });
  expect(compileWeaponSkillText([bundle(2, 0.2), bundle(1, 0.1)], {}, 'skill')).toEqual({
    name: 'Effect',
    description: 'Damage {0}%; duration 15s.',
    values: [10, 20],
  });
  expect(() =>
    compileWeaponSkillText(
      [bundle(1, 0.1), { ...bundle(2, 0.2), description: 'Changed {scale:0%}' }],
      {},
      'skill',
    ),
  ).toThrow('template changed');
});

it('统一候选生成读取本轮身份与精确文本 ID，不读取旧本地化且可重复生成', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-locales-'));
  const write = async (name: string, value: unknown) => {
    const file = path.join(root, name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, typeof value === 'string' ? value : JSON.stringify(value), 'utf8');
  };
  try {
    const tables = {
      CharacterTable: { chr_main: { name: 'Native' } },
      CharacterPotentialTable: {},
      PotentialTalentEffectTable: {},
      CharGrowthTable: {},
      SkillPatchTable: {
        skill: {
          SkillPatchDataBundle: [
            {
              level: 1,
              skillName: 'Skill',
              description: 'Bonus {scale:0%}',
              blackboard: [{ key: 'scale', value: 0.1 }],
            },
          ],
        },
      },
      HyperlinkTextTable: {
        'ba.combo': { name: 'Link', desc: 'Description', iconPath: 'termicon/icon_term_ba_combo' },
      },
      WeaponBasicTable: { wpn_test: { weaponSkillList: ['skill', 'skill'] } },
      ItemTable: {
        wpn_test: { name: 'Weapon' },
        gear_test: { name: 'Gear' },
        food: { name: 'Food', desc: 'Gain {buff_test\\scale:0%}' },
      },
      EquipTable: {
        gear_test: { partType: 0, suitID: 'suit_test', displayBaseAttrModifier: { attrValue: 12 } },
      },
      EquipSuitTable: {
        suit_test: { list: [{ suitName: 'Set', equipCnt: 3, skillID: 'skill', skillLv: 1 }] },
      },
      UseItemTable: {
        food: {
          isPersistentBuff: true,
          duration: 300,
          effectType: 2,
          targetNumType: 0,
          uiType: 3,
          stackingKey: 'buff',
          useActions: [
            { buffBBData: { buffId: 'buff_test', blackboard: [{ key: 'scale', value: 0.1 }] } },
          ],
        },
      },
    };
    for (const [name, value] of Object.entries(tables)) await write(`tables/${name}.json`, value);
    await write(
      'tables/EnemyTemplateDisplayInfoTable.json',
      '{"eny_test":{"templateId":"eny_test","name":{"id":9007199254740993}}}',
    );
    for (const locale of ['CN', 'EN'])
      await write(`tables/I18nTextTable_${locale}.json`, { '9007199254740993': `${locale} enemy` });
    await write('operators.json', { operators: [{ slug: 'configured', charId: 'chr_main' }] });
    await write(
      'weapons/a.generated.ts',
      "const graph = { nested: { slug: 'wrong' } }; const definition = {slug:'wpn_test', assetSlug:'weapon-icon'} as const satisfies WeaponDefinition;",
    );
    await write(
      'gears/a.generated.ts',
      "const definition = {slug:'gear_test', assetSlug:'shared-icon'} as const;",
    );
    await write('sets/a.generated.ts', "const definition = {slug:'suit_test'} as const;");
    for (const locale of ['zh-CN', 'en'])
      await write(`ui/${locale}.json`, { enumTerms: { slotType: { armor: 'Armor' } } });
    const input = {
      tableRoot: path.join(root, 'tables'),
      operatorManifest: path.join(root, 'operators.json'),
      weaponDefinitionRoot: path.join(root, 'weapons'),
      gearDefinitionRoot: path.join(root, 'gears'),
      gearSetDefinitionRoot: path.join(root, 'sets'),
      uiLocaleRoot: path.join(root, 'ui'),
      output: path.join(root, 'output'),
    };
    await generateGameLocaleCandidate(input);
    const read = async (file: string) =>
      JSON.parse(await fs.readFile(path.join(input.output, file), 'utf8'));
    expect(await read('zh/operators.json')).toHaveProperty('configured');
    expect(await read('en/enemies.json')).toEqual({ eny_test: { name: 'EN enemy' } });
    expect(await read('zh/weapons.json')).toHaveProperty('weapon-icon.skill3');
    expect(await read('zh/gearpieces.json')).toHaveProperty('gear_test.defense', 12);
    expect(await read('zh/consumables.json')).toHaveProperty('food.description', 'Gain 10%');
    const files = (await fs.readdir(path.join(input.output, 'zh'))).sort();
    expect(files).toEqual([
      'consumables.json',
      'enemies.json',
      'gearpieces.json',
      'gearsets.json',
      'operators.json',
      'terms.json',
      'weapons.json',
    ]);
    const before = await Promise.all(
      files.map(file => fs.readFile(path.join(input.output, 'zh', file), 'utf8')),
    );
    await generateGameLocaleCandidate(input);
    expect(
      await Promise.all(
        files.map(file => fs.readFile(path.join(input.output, 'zh', file), 'utf8')),
      ),
    ).toEqual(before);
    await fs.rm(path.join(input.tableRoot, 'SkillPatchTable.json'));
    await expect(generateGameLocaleCandidate(input)).rejects.toThrow('ENOENT');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
