import { readBirthShieldCount } from '../src/domains/enemy/birthShieldLabel.ts';
import { projectEnemyBirthBuffOption } from '../src/domains/enemy/birthBuffOptions.ts';
import { applyEnemyBirthAttribute } from '../../../src/core/game-data/enemyAttributeCalculation.ts';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { parseEnemyTemplateRank } from '../scripts/extractEnemyRankEvidence.ts';
import { auditCandidateEnemyDefinitions } from '../scripts/auditCandidateEnemyDefinitions.ts';
import { generateEnemyStageCatalog } from '../scripts/generateEnemyStageCatalog.ts';
import { readEnemyBornBuffAttributes } from '../src/domains/enemy/bornBuffAttributes.ts';
import { findSpawnerBuffs } from '../src/domains/enemy/spawnerAttributes.ts';
import { buffFixture, scalarFixture } from './sourceFixtures.ts';
import {
  generateEnemyDefinitions,
  planEnemyDefinitions,
} from '../scripts/generateEnemyDefinitions.ts';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(root => rm(root, { recursive: true, force: true })),
  );
});

describe('enemy data generation', () => {
  it('keeps spawner levels and distinct waves separate, and applies the spawn blackboard override', () => {
    const buff = (ratio: number) => ({
      buffId: 'hp',
      blackboard: [{ key: 'ratio', valueFloat: ratio, useString: false }],
    });
    const spawner = (enemyLevel: number, ratio: number) => ({
      enemyLibrary: [
        { enemyId: 'bear', enemyLevel, key: 'used', bornBuffList: [buff(ratio)] },
        { enemyId: 'bear', enemyLevel, key: 'unused', bornBuffList: [buff(999)] },
      ],
      waveMap: { 0: { groupMap: { 0: { actionMap: { 0: { libraryKey: 'used' } } } } } },
    });
    const sources = [spawner(60, 0.5), spawner(90, 6.6), spawner(90, 2)];
    expect(findSpawnerBuffs(sources, ['bear'], 'bear', 60)).toEqual([[buff(0.5)]]);
    expect(findSpawnerBuffs(sources, ['bear'], 'bear', 90)).toEqual([[buff(6.6)], [buff(2)]]);
    const source = buffFixture({
      blackboard: [{ key: 'ratio', valueDouble: 0.5, isDynamic: false }],
      attributeModifier: {
        isConvertedAttribute: false,
        attributeModifiers: [
          {
            modifyAttributeType: 'Specific',
            attributeType: 'MaxHp',
            formulaItem: 'Multiplier',
            param: scalarFixture(0, 'ratio'),
          },
        ],
      },
    });
    expect(readEnemyBornBuffAttributes(source, 'hp', { ratio: 6.6 })[0]?.attrValue).toBe(6.6);
    expect(readEnemyBornBuffAttributes(source, 'hp')[0]?.attrValue).toBe(0.5);
  });
  it('extracts only constant native attributes without compiling birth mechanisms', () => {
    const modifier = {
      modifyAttributeType: 'Specific',
      attributeType: 'MaxPoise',
      formulaItem: 'Addition',
      param: scalarFixture(180),
    };
    const buff = buffFixture({
      attributeModifier: { isConvertedAttribute: false, attributeModifiers: [modifier] },
      buffEventAction: [{ unknownMechanism: true }],
    });
    expect(readEnemyBornBuffAttributes(buff, 'born')).toEqual([
      { attrType: 20, modifyAttributeType: 0, formulaItem: 'Addition', attrValue: 180 },
    ]);
    expect(() =>
      readEnemyBornBuffAttributes(
        {
          ...buff,
          attributeModifier: {
            isConvertedAttribute: false,
            attributeModifiers: [{ ...modifier, param: scalarFixture(180, 'dynamic') }],
          },
        },
        'dynamic',
      ),
    ).toThrow('blackboard');
  });
  it('keeps stage variant differences and verifies the published catalog', async () => {
    const root = await mkdtemp(join(tmpdir(), 'endaxis-stage-generation-test-'));
    temporaryRoots.push(root);
    const base = {
      templateId: 'eny_base',
      attrTemplateId: 'base',
      attrModifiers: [],
      bornBuffs: [],
    };
    await writeJson(join(root, 'EnemyTable.json'), {
      eny_base: base,
      eny_variant: { ...base, bornBuffs: ['buff_variant'] },
    });
    await writeJson(join(root, 'DungeonTable.json'), {
      stage_b: {
        dungeonCategory: 'dungeon_bossrush',
        dungeonSeriesId: 'series',
        dungeonName: { text: 'Stage B' },
        enemyIds: ['eny_base'],
        enemyLevels: [90],
        sortId: 2,
      },
      stage: {
        dungeonCategory: 'dungeon_bossrush',
        dungeonSeriesId: 'series',
        dungeonName: { text: 'Stage' },
        dungeonLevelDesc: { text: 'Level II' },
        enemyIds: ['eny_base', 'eny_variant'],
        enemyLevels: [90, 90],
        sortId: 1,
      },
    });
    for (const name of [
      'DungeonSeriesTable',
      'SeasonTowerGameGroupTable',
      'EnemyDisplayInfoTable',
      'I18nTextTable_CN',
      'I18nTextTable_EN',
    ]) {
      await writeJson(join(root, `${name}.json`), {});
    }
    const args = {
      tablesDirectory: root,
      outputDirectory: join(root, 'output'),
      localeDirectory: join(root, 'locales'),
      check: false,
    };
    await writeJson(join(root, 'DungeonSeriesTable.json'), {
      series: { name: { text: 'Series' } },
    });
    await writeJson(join(root, 'WikiGroupTable.json'), { wiki_type_monster: { list: [] } });
    const result = await generateEnemyStageCatalog(args);
    const content = await readFile(result.output, 'utf8');
    expect(result.stages[0]!.enemies.map(enemy => enemy.source)).toMatchObject([
      { stageId: 'stage', enemyId: 'eny_base', templateId: 'eny-base' },
      { stageId: 'stage', enemyId: 'eny_variant', templateId: 'eny-base' },
    ]);
    expect(result.stages[0]!.enemies.map(enemy => enemy.definitionId)).toEqual([
      'eny-base',
      'eny-variant',
    ]);
    expect(content).not.toContain("name: 'Stage'");
    const stageNameKey = result.stages[0]!.nameKey;
    for (const locale of ['zh-CN', 'en']) {
      const messages = JSON.parse(
        await readFile(
          join(args.localeDirectory, locale === 'zh-CN' ? 'zh' : locale, 'stages.json'),
          'utf8',
        ),
      );
      expect(messages[stageNameKey]).toBe('Stage');
      expect(messages[result.stages[0]!.difficultyNameKey]).toBe('Level II');
    }
    // 合约展示名单可遗漏敌人；以实际刷怪引用补齐，排除未使用的库条目。
    const contract = {
      dungeonCategory: 'dungeon_contract',
      dungeonSeriesId: 'contract_series',
      dungeonName: { text: 'Contract' },
      sceneId: 'contract_scene',
      enemyIds: ['eny_base'],
      enemyLevels: [60],
      sortId: 0,
    };
    const dungeonPathForContract = join(root, 'DungeonTable.json');
    const originalDungeons = JSON.parse(await readFile(dungeonPathForContract, 'utf8'));
    await writeJson(dungeonPathForContract, { ...originalDungeons, contract });
    const spawnerDirectory = join(root, 'spawners');
    await mkdir(join(spawnerDirectory, 'contract_scene'), { recursive: true });
    const buffs = [{ buffId: 'hp', blackboard: [] }];
    await writeJson(join(spawnerDirectory, 'contract_scene', 'spawn.json'), {
      enemyLibrary: [
        { key: 'used', enemyId: 'eny_variant', enemyLevel: 60, bornBuffList: buffs },
        { key: 'unused', enemyId: 'eny_base', enemyLevel: 60, bornBuffList: [] },
      ],
      waveMap: {
        0: { groupMap: { 0: { actionMap: { 0: { libraryKey: 'used', spawnCount: 2 } } } } },
      },
    });
    const buffDirectory = join(root, 'buffs');
    await mkdir(buffDirectory);
    await writeJson(
      join(buffDirectory, 'hp.json'),
      buffFixture({
        attributeModifier: {
          isConvertedAttribute: false,
          attributeModifiers: [
            {
              modifyAttributeType: 'Specific',
              attributeType: 'MaxHp',
              formulaItem: 'Multiplier',
              param: scalarFixture(1),
            },
          ],
        },
      }),
    );
    const withContract = await generateEnemyStageCatalog({
      ...args,
      spawnerDirectory,
      buffDirectory,
    });
    const contractStage = withContract.stages.find(stage => stage.id === 'contract')!;
    expect(contractStage.enemies).toHaveLength(1);
    expect(contractStage.enemies[0]).toMatchObject({
      source: { enemyId: 'eny_variant' },
      level: 60,
      count: 2,
    });
    expect(contractStage.enemies[0]).toMatchObject({
      definitionId: 'eny-variant',
      birthBuffs: [
        {
          origin: 'stage',
          buffId: 'hp',
          modifiers: [{ attribute: 'MaxHp', slot: 'multiplier', value: 1 }],
        },
      ],
    });
    expect(contractStage.enemies[0]!.source.spawnId).toBe(contractStage.enemies[0]!.id);
    const contractMessages = JSON.parse(
      await readFile(join(args.localeDirectory, 'zh', 'stages.json'), 'utf8'),
    );
    expect(contractMessages[contractStage.seriesNameKey]).toBe('Contract');
    await writeJson(dungeonPathForContract, originalDungeons);
    await generateEnemyStageCatalog(args);
    const dungeonPath = join(root, 'DungeonTable.json');
    const dungeons = JSON.parse(await readFile(dungeonPath, 'utf8'));
    await writeJson(dungeonPath, Object.fromEntries(Object.entries(dungeons).reverse()));
    await generateEnemyStageCatalog({ ...args, check: true });
    const englishPath = join(args.localeDirectory, 'en', 'stages.json');
    const english = await readFile(englishPath, 'utf8');
    await writeFile(englishPath, '{}\n');
    await expect(generateEnemyStageCatalog({ ...args, check: true })).rejects.toThrow('stale');
    await writeFile(englishPath, english);
    await writeFile(result.output, '// stale');
    await expect(generateEnemyStageCatalog({ ...args, check: true })).rejects.toThrow('stale');
  });

  it('strictly decodes the proven EnemyTemplateData prefix', () => {
    expect(parseEnemyTemplateRank(enemyRaw('eny_9999_fixture', 2), 'eny_9999_fixture')).toEqual({
      nativeValue: 2,
      rank: 'elite',
      modelKey: 'eny_9999_fixture_postmodel',
      componentCount: 2,
    });
    expect(() =>
      parseEnemyTemplateRank(enemyRaw('eny_9999_fixture', 3), 'eny_9999_fixture'),
    ).toThrow('unknown EnemyRank');
  });

  it('joins native enemy tables, excludes training targets, and labels the compatibility constant', async () => {
    const root = await mkdtemp(join(tmpdir(), 'endaxis-enemy-generation-test-'));
    temporaryRoots.push(root);
    const tables = join(root, 'tables');
    await mkdir(tables);
    await writeJson(join(tables, 'EnemyTemplateDisplayInfoTable.json'), {
      eny_9999_fixture: { templateId: 'eny_9999_fixture', displayType: 2 },
      tatget_001_normal: { templateId: 'tatget_001_normal', displayType: 0 },
    });
    await writeJson(join(tables, 'EnemyTemplateTable.json'), {
      eny_9999_fixture: { templateId: 'eny_9999_fixture' },
    });
    await writeJson(join(tables, 'EnemyTable.json'), {
      eny_9999_fixture: {
        templateId: 'eny_9999_fixture',
        attrTemplateId: 'eny_9999_fixture_attr',
      },
    });
    await writeJson(join(tables, 'EnemyAttributeTemplateTable.json'), {
      eny_9999_fixture_attr: {
        levelDependentAttributes: [
          {
            attrs: [
              { attrType: 0, attrValue: 1 },
              { attrType: 1, attrValue: 1000 },
              { attrType: 3, attrValue: 120 },
            ],
          },
        ],
        levelIndependentAttributes: {
          attrs: [
            { attrType: 20, attrValue: 160 },
            { attrType: 21, attrValue: 7 },
            { attrType: 27, attrValue: 1.25 },
          ],
        },
        poiseKnotPctList: [0.5],
        poiseKnotBuffList: ['buff_common_mini_poise_break'],
        physicalResistance: 1,
        fireResistance: 2,
        crystResistance: 3,
        pulseResistance: 4,
        naturalResistance: 5,
        initialSuperArmor: 20,
        breakingAttackedAtbObtain: 35,
      },
    });
    const ranks = join(root, 'ranks.json');
    await writeJson(ranks, {
      enemies: {
        eny_9999_fixture: { rank: 'elite', iconAssetPath: 'MonsterIcon/eny_9999_fixture.png' },
      },
    });
    const defaults = join(root, 'defaults.json');
    await writeJson(defaults, {
      knotBreakDurationSeconds: 2,
      evidence: 'test compatibility evidence',
    });
    const selectionCategories = join(root, 'selection-categories.json');
    const enemyRows = JSON.parse(await readFile(join(tables, 'EnemyTable.json'), 'utf8'));
    const attributeRows = JSON.parse(
      await readFile(join(tables, 'EnemyAttributeTemplateTable.json'), 'utf8'),
    );
    enemyRows.eny_9999_variant = { ...enemyRows.eny_9999_fixture, attrTemplateId: 'variant_attr' };
    enemyRows.eny_9999_variant.attrModifiers = [
      { attrType: 1, modifyAttributeType: 0, modifierType: 0, attrValue: 100 },
      { attrType: 1, modifyAttributeType: 0, modifierType: 1, attrValue: 0.5 },
      { attrType: 1, modifyAttributeType: 0, modifierType: 4, attrValue: 2 },
      { attrType: 20, modifyAttributeType: 0, modifierType: 4, attrValue: 0 },
    ];
    await writeJson(join(tables, 'AttributeMetaTable.json'), {
      1: { hasMinValue: true, minValue: 0, hasMaxValue: false },
      20: { hasMinValue: true, minValue: 0, hasMaxValue: false },
    });
    attributeRows.variant_attr = structuredClone(attributeRows.eny_9999_fixture_attr);
    attributeRows.variant_attr.levelDependentAttributes[0].attrs.find(
      (entry: { attrType: number }) => entry.attrType === 1,
    ).attrValue = 2400;
    await writeJson(join(tables, 'EnemyTable.json'), enemyRows);
    await writeJson(join(tables, 'EnemyAttributeTemplateTable.json'), attributeRows);

    await writeJson(selectionCategories, {
      hiddenEnemyIds: [],
    });

    await writeJson(join(tables, 'WikiGroupTable.json'), {
      wiki_type_monster: {
        list: [{ groupId: 'wiki_group_monster_animal', groupName: { text: 'Wildlife' } }],
      },
    });
    await writeJson(join(tables, 'WikiEntryTable.json'), {
      wiki_group_monster_animal: { list: ['fixture'] },
    });
    await writeJson(join(tables, 'WikiEntryDataTable.json'), {
      fixture: { groupId: 'wiki_group_monster_animal', refMonsterTemplateId: 'eny_9999_fixture' },
    });
    const plan = await planEnemyDefinitions(tables, ranks, defaults, selectionCategories);
    const variants = await planEnemyDefinitions(tables, ranks, defaults, selectionCategories, [
      'eny_9999_variant',
    ]);
    expect(variants.definitions.find(entry => entry.gameId === 'eny_9999_variant')).toMatchObject({
      id: 'eny-9999-variant',
      levelHp: [{ level: 1, hp: 2400 }],
      stagger: { maximum: 160 },
      rank: 'elite',
    });
    expect(variants.selection.hiddenEnemyIds).toContain('eny-9999-variant');
    const buffs = join(root, 'buffs');
    await mkdir(buffs);
    enemyRows.eny_9999_variant.bornBuffs = ['born_attributes'];
    await writeJson(join(tables, 'EnemyTable.json'), enemyRows);
    await writeJson(join(tables, 'AttributeMetaTable.json'), {
      1: { hasMinValue: true, minValue: 0, hasMaxValue: false },
      20: { hasMinValue: true, minValue: 0, hasMaxValue: false },
      31: { hasMinValue: true, minValue: 0, hasMaxValue: false },
    });
    await writeJson(
      join(buffs, 'born_attributes.json'),
      buffFixture({
        attributeModifier: {
          isConvertedAttribute: false,
          attributeModifiers: [
            {
              modifyAttributeType: 'Specific',
              attributeType: 'MaxHp',
              formulaItem: 'FinalMultiplier',
              param: scalarFixture(2),
            },
            {
              modifyAttributeType: 'Specific',
              attributeType: 'PoiseRecTimeScalar',
              formulaItem: 'Multiplier',
              param: scalarFixture(0.8),
            },
          ],
        },
      }),
    );
    const withBornAttributes = await planEnemyDefinitions(
      tables,
      ranks,
      defaults,
      selectionCategories,
      ['eny_9999_variant'],
      buffs,
    );
    expect(
      withBornAttributes.definitions.find(entry => entry.gameId === 'eny_9999_variant'),
    ).toMatchObject({
      levelHp: [{ level: 1, hp: 2400 }],
      stagger: { maximum: 160, brokenDurationSeconds: 7 },
    });
    const variant = withBornAttributes.definitions.find(
      entry => entry.gameId === 'eny_9999_variant',
    )!;
    const modifiers = [
      ...(variant.attributeModifiers ?? []),
      ...variant.birthBuffs!.flatMap(buff => buff.modifiers),
    ];
    expect(applyEnemyBirthAttribute('MaxHp', variant.levelHp[0]!.hp, modifiers)).toBe(15000);
    expect(applyEnemyBirthAttribute('MaxPoise', variant.stagger.maximum, modifiers)).toBe(0);
    expect(
      variant.stagger.brokenDurationSeconds *
        applyEnemyBirthAttribute('PoiseRecTimeScalar', 1, modifiers),
    ).toBe(12.6);
    for (const name of [
      'DungeonTable',
      'DungeonSeriesTable',
      'SeasonTowerGameGroupTable',
      'EnemyDisplayInfoTable',
      'I18nTextTable_CN',
      'I18nTextTable_EN',
    ]) {
      await writeJson(join(tables, `${name}.json`), {});
    }
    expect(plan.excludedDisplayIds).toEqual(['tatget_001_normal']);
    expect(plan.compatibilityDefaults.evidence).toBe('test compatibility evidence');
    expect(plan.selection.categoryByEnemyId).toEqual({
      'eny-9999-fixture': 'wiki_group_monster_animal',
    });
    expect(plan.selection.enemyOrder).toEqual(['eny-9999-fixture']);
    await expect(
      generateEnemyDefinitions({
        tablesDirectory: tables,
        rankEvidence: ranks,
        runtimeDefaults: defaults,
        selectionCategories,
        outputDirectory: join(root, 'generated'),
        buffDirectory: buffs,
        spawnerDirectory: join(root, 'spawners'),
        localeDirectory: join(root, 'locales'),
        check: false,
      }),
    ).rejects.toThrow('missing HP at level 20');
    expect(plan.definitions).toEqual([
      expect.objectContaining({
        id: 'eny-9999-fixture',
        gameId: 'eny_9999_fixture',
        tier: 'leader',
        rank: 'elite',
        levelHp: [{ level: 1, hp: 1000 }],
        defense: 120,
        resistances: { physical: 1, heat: 2, cryo: 3, electric: 4, nature: 5 },
        stagger: {
          maximum: 160,
          knotThresholds: [0.5],
          knotBreakDurationSeconds: 2,
          brokenDurationSeconds: 7,
          finisherSpRecovery: 35,
        },
      }),
    ]);
    await expect(
      auditCandidateEnemyDefinitions({
        tablesDirectory: tables,
        rankEvidence: ranks,
        runtimeDefaults: defaults,
        selectionCategories,
      }),
    ).resolves.toMatchObject({
      candidateCount: 1,
      definitionIds: ['eny-9999-fixture'],
      fullLevelNodeCount: 1,
      evidence: 'current source tables plus same-run EnemyTemplateData rank extraction',
    });

    await writeJson(selectionCategories, {
      hiddenEnemyIds: [],
    });
    await writeJson(join(tables, 'WikiEntryTable.json'), {
      wiki_group_monster_animal: { list: [] },
    });
    const unlisted = await planEnemyDefinitions(tables, ranks, defaults, selectionCategories);
    expect(unlisted.selection.categoryByEnemyId).toEqual({});
  });
});

function enemyRaw(gameId: string, rank: number): Uint8Array {
  const chunks: Buffer[] = [Buffer.alloc(12), Buffer.from([1]), Buffer.alloc(3), Buffer.alloc(12)];
  chunks.push(unityString(`data_${gameId}`));
  const rootRid = (5n << 32n) | 1n;
  chunks.push(i64(rootRid), i32(2), i32(3), i64(rootRid));
  chunks.push(unityString('EnemyTemplateData'));
  chunks.push(unityString('Beyond.Gameplay'));
  chunks.push(unityString('Gameplay.Beyond'));
  chunks.push(i32(2), i64((5n << 32n) | 2n), i64((5n << 32n) | 3n));
  chunks.push(unityString(`${gameId}_postmodel`), i32(rank));
  return Buffer.concat(chunks);
}

function unityString(value: string): Buffer {
  const encoded = Buffer.from(value, 'utf8');
  const padding = (4 - (encoded.length % 4)) % 4;
  return Buffer.concat([i32(encoded.length), encoded, Buffer.alloc(padding)]);
}

function i32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32LE(value);
  return buffer;
}

function i64(value: bigint): Buffer {
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64LE(value);
  return buffer;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value)}\n`, 'utf8');
}

it('出生选项过滤纯表现，保留包含标签或其他事件动作的 Buff', () => {
  const effect = { $type: 'Beyond.Gameplay.Core.EffectAction+EffectActionData, Gameplay.Beyond' };
  const source = buffFixture({
    applyTags: [],
    buffEventAction: [{ buffEvent: 'DuringBuffEnable', actions: [{ actionData: [effect] }] }],
  });
  expect(projectEnemyBirthBuffOption(source, 'visual', 'enemy', 0)).toBeUndefined();
  expect(projectEnemyBirthBuffOption(source, 'visual', 'stage', 0)).toBeUndefined();
  expect(
    projectEnemyBirthBuffOption({ ...source, applyTags: ['Status/Test'] }, 'tag', 'enemy', 0),
  ).toBeDefined();
  expect(
    projectEnemyBirthBuffOption(
      { ...source, timelineActions: [{ $type: 'UnknownCombatAction' }] },
      'combat',
      'stage',
      0,
    ),
  ).toBeDefined();
});

it('按动作过滤悬赏绑定，混合战斗标签的 Buff 不过滤', () => {
  const source = buffFixture({
    applyTags: [],
    buffEventAction: [
      {
        buffEvent: 'OnBuffStart',
        actions: [
          {
            actionData: [
              {
                $type: 'Beyond.Gameplay.Core.BindBountyEnemyAction+Data, Gameplay.Beyond',
                bountyKey: scalarFixture(0),
              },
            ],
          },
        ],
      },
    ],
  });
  expect(projectEnemyBirthBuffOption(source, 'arbitrary_id', 'stage', 0)).toBeUndefined();
  expect(
    projectEnemyBirthBuffOption(
      { ...source, applyTags: [{ tagId: 1 }] },
      'arbitrary_id',
      'stage',
      0,
    ),
  ).toBeDefined();
});

it('出生过滤配置只排除已核准的模拟范围外入口，保留火盾和周期附着标记', () => {
  const source = buffFixture({ applyTags: [] });
  for (const id of [
    'buff_common_superarmor_behit_sandb',
    'buff_common_atkup',
    'buff_common_speedup',
    'buff_harddung_atkup_limited',
    'buff_eny_0046_lbshamman_hdg016_easymode',
    'buff_eny_0119_kltiger_horn_lighting_fx',
  ]) {
    expect(projectEnemyBirthBuffOption(source, id, 'enemy', 0)).toBeUndefined();
    expect(projectEnemyBirthBuffOption(source, id, 'stage', 0)).toBeUndefined();
  }
  for (const id of [
    'buff_eny_0054_hsmino_hard_pain',
    'buff_eny_0124_kltdcap_hdg027_normaltag',
    'buff_harddung_monitor_hdg005',
    'buff_eny_0125_fdcentur_camera',
    'unreviewed_empty',
  ]) {
    expect(projectEnemyBirthBuffOption(source, id, 'stage', 0)).toBeDefined();
  }
});

it('层叠护盾名称使用子 Buff 初始化层数，并遵循显式传参', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'birth-shield-label-'));
  temporaryRoots.push(directory);
  const start = (action: unknown) => [
    { buffEvent: 'OnBuffStart', actions: [{ actionData: [action] }] },
  ];
  await writeFile(
    join(directory, 'shield.json'),
    JSON.stringify({
      blackboard: [{ key: 'shield_num', valueDouble: 5 }],
      buffEventAction: start({
        $type: 'Beyond.Gameplay.Core.CountShieldUIAction+Data, Gameplay.Beyond',
        curCountShield: { useBlackboardKey: true, blackboardKey: 'shield_num' },
      }),
    }),
  );
  const entry = (assignItems: unknown[] = []) => ({
    blackboard: [{ key: 'shield_num', valueDouble: 3 }],
    buffEventAction: start({
      $type: 'Beyond.Gameplay.Core.CreateBuffAction+Data, Gameplay.Beyond',
      buffs: [{ buffId: 'shield', assignBlackboard: assignItems.length > 0, assignItems }],
    }),
  });
  expect(readBirthShieldCount(entry(), { shield_num: 9 }, directory)).toBe(5);
  expect(
    readBirthShieldCount(
      entry([{ targetKey: 'shield_num', useDirectValue: true, numericValue: 1 }]),
      {},
      directory,
    ),
  ).toBe(1);
  expect(
    readBirthShieldCount(
      entry([{ targetKey: 'shield_num', inputValueKey: 'shield_num' }]),
      { shield_num: 7 },
      directory,
    ),
  ).toBe(7);
});

it.each([1, 2])('出生护盾名称读取 %i 层嵌套条件中的显示动作', depth => {
  let action: Record<string, unknown> = {
    $type: 'Beyond.Gameplay.Core.CountShieldUIAction+Data, Gameplay.Beyond',
    curCountShield: { useBlackboardKey: true, blackboardKey: 'shield_num' },
  };
  for (let i = 0; i < depth; i++)
    action = {
      $type: 'Beyond.Gameplay.Core.IfElseAction+IfElseActionData, Gameplay.Beyond',
      succeedActions: { actionData: [] },
      failActions: { actionData: [action] },
    };
  const source = buffFixture({
    blackboard: [{ key: 'shield_num', valueDouble: depth }],
    buffEventAction: [{ buffEvent: 'OnBuffStart', actions: [{ actionData: [action] }] }],
  });
  expect(
    projectEnemyBirthBuffOption(source, 'buff_eny_0128_babyents_showhp', 'enemy', 0, {}, '.'),
  ).toMatchObject({
    nameKey: 'resourceMonitor.enemy.countShieldLayers',
    nameParams: { count: depth },
  });
});
