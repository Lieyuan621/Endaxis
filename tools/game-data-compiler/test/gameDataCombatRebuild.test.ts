/**
 * 验证完整重建共用两轮战斗定义编译，以及第二轮失败后的发布门禁。
 * 来源、VFS、模拟和发布均使用小型替身；阶段顺序、报告与失败传播执行真实 rebuild 代码。
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  combat: vi.fn(),
  oldGenerator: vi.fn(),
  snapshot: vi.fn(),
  enemyRanks: vi.fn(),
  enemies: vi.fn(),
  globalBuffs: vi.fn(),
  types: vi.fn(),
  assets: vi.fn(),
  operatorSimulation: vi.fn(),
  equipmentSimulation: vi.fn(),
  publish: vi.fn(),
  execFile: vi.fn(),
}));

vi.mock('../scripts/generateCombatDefinitionCandidates.ts', () => ({
  generateCombatDefinitionCandidates: mocks.combat,
}));
// 本测试只验证重建阶段编排；格式化器对正式输出清单的遍历另行验证。
vi.mock('../scripts/formatGeneratedSource.ts', async importOriginal => ({
  ...(await importOriginal<typeof import('../scripts/formatGeneratedSource.ts')>()),
  formatGeneratedCandidate: async () => ({ fileCount: 0 }),
}));
// 完整路径若绕回这些旧入口，会多编译一次并破坏本轮共用来源。
vi.mock('../scripts/generateGearDefinitions.ts', () => ({
  generateGearDefinitions: mocks.oldGenerator,
}));
vi.mock('../scripts/generateWeaponDefinitions.ts', () => ({
  generateWeaponDefinitions: mocks.oldGenerator,
}));
vi.mock('../scripts/generateGearSetDefinitions.ts', () => ({
  generateGearSetDefinitions: mocks.oldGenerator,
}));
vi.mock('../scripts/generateContingencyContractDefinitions.ts', () => ({
  generateContingencyContractDefinitions: mocks.oldGenerator,
}));
vi.mock('../scripts/generateOperatorDefinitionCandidates.ts', () => ({
  generateOperatorDefinitionCandidates: mocks.oldGenerator,
}));
vi.mock('../scripts/verifyGameDataSnapshot.ts', () => ({
  verifyGameDataSnapshot: mocks.snapshot,
}));
vi.mock('../scripts/readAbilityEntityTemplates.ts', () => ({
  readAbilityEntityTemplates: () => ({ templates: [] }),
}));
vi.mock('../scripts/extractEnemyRankEvidence.ts', () => ({
  extractEnemyRankEvidence: mocks.enemyRanks,
}));
vi.mock('../scripts/generateEnemyDefinitions.ts', () => ({
  generateEnemyDefinitions: mocks.enemies,
}));
vi.mock('../scripts/auditCandidateEnemyDefinitions.ts', () => ({
  auditCandidateEnemyDefinitions: async () => ({}),
}));
vi.mock('../scripts/exportGameplayTagConfigSet.ts', () => ({
  exportGameplayTagConfigSet: async () => ({ manifestPath: 'fixture/source-set.json' }),
}));
vi.mock('../scripts/generateGameplayTagCatalog.ts', () => ({
  generateGameplayTagCatalog: async () => ({ sourceSha256: 'fixed-gameplay-tags' }),
}));
vi.mock('../scripts/readGameplayTagPaths.ts', () => ({ readGameplayTagPaths: () => [] }));
vi.mock('../scripts/generateTimeDilationCatalog.ts', () => ({
  generateTimeDilationCatalog: async () => ({}),
}));
vi.mock('../scripts/generateBattleCommandMappingCatalog.ts', () => ({
  generateBattleCommandMappingCatalog: async () => ({}),
}));
vi.mock('../scripts/generateMovementSettingCatalog.ts', () => ({
  generateMovementSettingCatalog: async () => ({}),
}));
vi.mock('../scripts/generateHitStopCurveCatalog.ts', () => ({
  generateHitStopCurveCatalog: async () => ({}),
}));
vi.mock('../scripts/generateSkillSettingCatalog.ts', () => ({
  generateSkillSettingCatalog: async () => ({}),
}));
vi.mock('../scripts/generateDashEnergyConfig.ts', () => ({
  generateDashEnergyConfig: async ({ output, check }: { output: string; check: boolean }) => {
    if (!check) await json(output, { fixture: 'dash-energy' });
    return {};
  },
}));
vi.mock('../scripts/generateGlobalBuffCatalog.ts', () => ({
  generateGlobalBuffCatalog: mocks.globalBuffs,
}));
vi.mock('../scripts/generateContingencyContractLocales.ts', () => ({
  generateContingencyContractLocales: async ({ output }: { output: string }) => {
    for (const locale of ['zh', 'en'])
      await json(path.join(output, locale, 'contingency-contracts.json'), {
        fixture: { name: 'text', description: 'description' },
      });
    return { globalBuffIds: [] };
  },
}));
vi.mock('../scripts/generateGameplayTagPredefine.ts', () => ({
  generateGameplayTagPredefine: async () => ({}),
}));
vi.mock('../src/audits/operatorTemplateRefresh.ts', () => ({
  auditOperatorTemplateRefresh: () => ({
    blockedCount: 0,
    changedPinCount: 0,
    unconfiguredSourceFiles: [],
  }),
}));
vi.mock('../src/audits/operatorSkillLibraries.ts', () => ({
  auditOperatorSkillLibraries: () => ({ blockedCount: 0 }),
}));
vi.mock('../scripts/exportReferencedGameIcons.ts', () => ({
  exportReferencedGameIcons: async () => ({}),
}));
vi.mock('../src/compiler/publication/candidateTypeCheck.ts', () => ({
  typeCheckCandidateOverlay: mocks.types,
}));
vi.mock('../src/compiler/publication/candidateAssetCheck.ts', () => ({
  checkCandidateGameAssets: mocks.assets,
}));
vi.mock('../scripts/auditCandidateOperatorSkills.ts', () => ({
  auditCandidateOperatorSkills: mocks.operatorSimulation,
}));
vi.mock('../scripts/auditCandidateEquipment.ts', () => ({
  auditCandidateEquipment: mocks.equipmentSimulation,
}));
vi.mock('../src/compiler/publication/gameDataCandidatePublisher.ts', () => ({
  publishGameDataCandidate: mocks.publish,
}));
vi.mock('node:child_process', async importOriginal => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  execFile: mocks.execFile,
}));

import { parseRebuildArguments, rebuildGameData } from '../scripts/rebuildGameData.ts';
import { OPERATOR_DEFINITION_OUTPUTS } from '../scripts/operatorDefinitionOutputs.ts';

const roots: string[] = [];
const localeFiles = [
  'consumables',
  'enemies',
  'gearpieces',
  'gearsets',
  'operators',
  'terms',
  'weapons',
];
const domainSummary = {
  gears: { definitionCount: 1 },
  weapons: { definitionCount: 1 },
  gearSets: { definitionCount: 1 },
  mechanics: { buffCount: 1 },
  operators: { operatorCount: 1 },
};
const domainDirectories = [
  'src/data/buffs/generated',
  'src/data/equipment/generated',
  'src/data/equipment/generated-weapons',
  'src/data/equipment/generated-gear-sets',
  'src/data/mechanics/generated',
];

async function json(file: string, value: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value));
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.combat.mockImplementation(
    async ({ candidateRoot, check }: { candidateRoot: string; check: boolean }) => {
      if (!check) {
        for (const output of OPERATOR_DEFINITION_OUTPUTS)
          await json(path.join(candidateRoot, output), { fixture: 'operator' });
        for (const output of domainDirectories)
          await json(path.join(candidateRoot, output, 'fixture.json'), { fixture: 'domain' });
      }
      return domainSummary;
    },
  );
  mocks.oldGenerator.mockImplementation(() => {
    throw new Error('完整重建不应调用独立领域生成器');
  });
  mocks.snapshot.mockResolvedValue({
    version: 'fixture@1',
    missingInputs: [],
    snapshotSha256: 'fixed-source-snapshot',
  });
  mocks.enemyRanks.mockImplementation(async ({ output }: { output: string }) => {
    await json(output, { enemy: 'fixture' });
    return {};
  });
  mocks.enemies.mockImplementation(
    async ({ outputDirectory, check }: { outputDirectory: string; check: boolean }) => {
      if (!check) await json(path.join(outputDirectory, 'enemy.json'), { enemy: 'fixture' });
      return { definitionCount: 1 };
    },
  );
  mocks.globalBuffs.mockImplementation(
    async ({ output, check }: { output: string; check: boolean }) => {
      if (!check) await json(output, { version: 'fixture', evidence: {}, templates: {} });
      return {};
    },
  );
  mocks.types.mockReturnValue({});
  mocks.assets.mockResolvedValue({});
  mocks.operatorSimulation.mockResolvedValue({});
  mocks.equipmentSimulation.mockResolvedValue({});
  mocks.publish.mockResolvedValue({});
  // 只模拟 Python 的文件输出，让 rebuild 自己检查语言文件集合、两轮内容和语言间身份数。
  mocks.execFile.mockImplementation(
    (
      executable: string,
      args: string[],
      _options: unknown,
      callback: (error: Error | null, stdout?: string, stderr?: string) => void,
    ) => {
      expect(executable).toBe('python');
      const output = args[args.indexOf('--output') + 1]!;
      void (async () => {
        for (const locale of ['zh', 'en'])
          for (const file of localeFiles)
            await json(path.join(output, locale, `${file}.json`), { fixture: 'text' });
      })().then(() => callback(null, '', ''), callback);
    },
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: URL) => {
      const name = new URL(input).searchParams.get('name');
      return new Response(
        JSON.stringify({
          candidates: [
            {
              path: `assets/beyond/dynamicassets/gamedata/gameplayconfig/${name === 'movementsetting_default.asset' ? 'movementsetting/' : ''}${name}`,
              previewUrl: `/fixture/${name}`,
            },
          ],
        }),
      );
    }),
  );
});

afterEach(async () => {
  vi.unstubAllGlobals();
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true });
});

async function setup() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-combat-rebuild-'));
  roots.push(root);
  const sourceRoot = path.join(root, 'sources');
  const compilerRoot = path.join(root, 'tools/game-data-compiler');
  await json(path.join(compilerRoot, 'game-data-sources.json'), {
    tableCfg: [],
    jsonCollections: {},
    jsonFiles: [],
  });
  await json(path.join(compilerRoot, 'config/operators.json'), { operators: [] });
  await json(path.join(compilerRoot, 'config/gearSetIdentities.json'), []);
  for (const table of [
    'CharacterTable',
    'WeaponBasicTable',
    'EquipTable',
    'EquipSuitTable',
    'SkillPatchTable',
    'CharGrowthTable',
    'GlobalConst',
    'UseItemTable',
    'ItemTable',
  ])
    await json(path.join(sourceRoot, 'TableCfg-current', `${table}.json`), {});
  for (const directory of ['CharacterData', 'SkillData'])
    await fs.mkdir(path.join(sourceRoot, directory), { recursive: true });
  const args = parseRebuildArguments([
    '--source-root',
    sourceRoot,
    '--unity-worker',
    'fixture-worker.exe',
    '--publish',
  ]);
  return { root, sourceRoot, args };
}

describe('完整重建的统一战斗定义阶段', () => {
  it('仅调用两轮联合入口，第二轮通过后才开启候选验证和发布', async () => {
    const { root, sourceRoot, args } = await setup();
    const helper = path.join(root, 'src/data/operators/helper.ts');
    await json(helper, { handwritten: true });
    const { report, exitCode } = await rebuildGameData(args, root);
    expect(report.stages.filter(stage => stage.status !== 'passed')).toEqual([]);
    expect(exitCode).toBe(0);
    expect(report.published).toBe(true);
    expect(mocks.combat).toHaveBeenCalledTimes(2);
    const [first, second] = mocks.combat.mock.calls.map(call => call[0]);
    expect(first).toMatchObject({ sourceRoot, check: false });
    expect(second).toEqual({ ...first, check: true });
    expect(mocks.oldGenerator).not.toHaveBeenCalled();
    const combatStages = report.stages.filter(stage => stage.id === 'combat-definitions');
    expect(combatStages).toHaveLength(1);
    expect(combatStages[0]).toMatchObject({
      id: 'combat-definitions',
      status: 'passed',
      detail: {
        ...domainSummary,
        deterministicCheck: 'passed',
        comparison: {
          operators: { added: OPERATOR_DEFINITION_OUTPUTS, changed: [], removed: [] },
          directories: domainDirectories.map(output => ({ output, removed: [] })),
        },
      },
    });
    expect(JSON.parse(await fs.readFile(helper, 'utf8'))).toEqual({ handwritten: true });
    for (const oldId of [
      'gears',
      'weapons',
      'gear-sets',
      'contingency-contract-definitions',
      'operators-and-common-buffs',
    ])
      expect(report.stages.map(stage => stage.id)).not.toContain(oldId);
    for (const gate of [
      mocks.types,
      mocks.assets,
      mocks.operatorSimulation,
      mocks.equipmentSimulation,
    ]) {
      expect(gate).toHaveBeenCalledTimes(1);
      expect(gate.mock.invocationCallOrder[0]).toBeGreaterThan(
        mocks.combat.mock.invocationCallOrder[1]!,
      );
    }
    expect(mocks.snapshot).toHaveBeenCalledTimes(2);
    expect(mocks.publish).toHaveBeenCalledTimes(1);
    expect(mocks.publish.mock.calls[0]![0].fileOutputs).toEqual(
      expect.arrayContaining([
        'src/i18n/game-locales/zh/contingency-contracts.json',
        'src/i18n/game-locales/en/contingency-contracts.json',
      ]),
    );
    expect(mocks.publish.mock.calls[0]![0].fileOutputs).not.toContain(
      'src/data/mechanics/contingency-contract-catalog.generated.json',
    );
    expect(mocks.publish.mock.calls[0]![0].fileOutputs).not.toContain(
      'src/data/global-buffs/global-buff-templates.generated.json',
    );
    const globalBuffOutput = mocks.globalBuffs.mock.calls[0]![0].output;
    expect(path.relative(report.runRoot, globalBuffOutput).replaceAll('\\', '/')).toBe(
      'intermediate/global-buff-templates.generated.json',
    );
    await expect(fs.stat(globalBuffOutput)).rejects.toMatchObject({ code: 'ENOENT' });
    const rankOutput = mocks.enemyRanks.mock.calls[0]![0].output;
    await expect(fs.stat(rankOutput)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(mocks.publish.mock.calls[0]![0].fileOutputs).not.toContain(
      path.relative(report.candidateRoot, rankOutput),
    );
    expect(mocks.publish.mock.calls[0]![0].fileOutputs).not.toContain(
      'src/data/enemies/enemy-ranks.generated.json',
    );
    expect(mocks.publish.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.snapshot.mock.invocationCallOrder[1]!,
    );
  });

  it('敌人生成失败也清理已提取的分类中间文件', async () => {
    const { root, args } = await setup();
    mocks.enemies.mockRejectedValueOnce(new Error('enemy generation failed'));
    const { report } = await rebuildGameData(args, root);
    expect(report.stages.find(stage => stage.id === 'enemies')?.status).toBe('failed');
    expect(mocks.publish).not.toHaveBeenCalled();
    const rankOutput = mocks.enemyRanks.mock.calls[0]![0].output;
    await expect(fs.stat(rankOutput)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('第二轮失败时记在统一阶段，阻止类型、资源、模拟和发布', async () => {
    const { root, args } = await setup();
    mocks.combat
      .mockResolvedValueOnce(domainSummary)
      .mockRejectedValueOnce(new Error('second pass changed'));
    const { report, exitCode } = await rebuildGameData(args, root);
    expect(mocks.combat).toHaveBeenCalledTimes(2);
    expect(mocks.combat.mock.calls.map(call => call[0].check)).toEqual([false, true]);
    expect(mocks.oldGenerator).not.toHaveBeenCalled();
    expect(report.stages.filter(stage => stage.id === 'combat-definitions')).toEqual([
      { id: 'combat-definitions', status: 'failed', detail: 'second pass changed' },
    ]);
    for (const id of [
      'candidate-type-check',
      'candidate-assets',
      'candidate-operator-skills',
      'candidate-equipment',
    ])
      expect(report.stages.find(stage => stage.id === id)).toMatchObject({
        status: 'blocked',
        detail: { unavailableStages: expect.arrayContaining(['combat-definitions']) },
      });
    for (const gate of [
      mocks.types,
      mocks.assets,
      mocks.operatorSimulation,
      mocks.equipmentSimulation,
      mocks.publish,
    ])
      expect(gate).not.toHaveBeenCalled();
    expect(report.stages.find(stage => stage.id === 'publication')).toMatchObject({
      status: 'blocked',
      detail: { unavailableStages: expect.arrayContaining(['combat-definitions']) },
    });
    expect(report.published).toBe(false);
    expect(exitCode).toBe(1);
    const globalBuffOutput = mocks.globalBuffs.mock.calls[0]![0].output;
    await expect(fs.stat(globalBuffOutput)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(fs.stat(path.join(root, 'src'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
