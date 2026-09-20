import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import {
  downloadGameDataSources,
  loadSourceCatalog,
  writeAtomicJson,
} from './downloadGameDataSources.ts';
import { DEFAULT_CDN, DEFAULT_VFS_BASE } from './gameDataProviders.ts';
import { generateGearDefinitions } from './generateGearDefinitions.ts';
import { exportGameplayTagConfigSet } from './exportGameplayTagConfigSet.ts';
import { generateGameplayTagCatalog } from './generateGameplayTagCatalog.ts';
import { generateGameplayTagPredefine } from './generateGameplayTagPredefine.ts';
import { verifyGameDataSnapshot } from './verifyGameDataSnapshot.ts';
import { auditOperatorTemplateRefresh } from '../src/audits/operatorTemplateRefresh.ts';
import { auditOperatorSkillLibraries } from '../src/audits/operatorSkillLibraries.ts';
import { readGameplayTagPaths } from './readGameplayTagPaths.ts';
import { readAbilityEntityTemplates } from './readAbilityEntityTemplates.ts';
import { generateTimeDilationCatalog } from './generateTimeDilationCatalog.ts';
import { generateBattleCommandMappingCatalog } from './generateBattleCommandMappingCatalog.ts';
import { generateMovementSettingCatalog } from './generateMovementSettingCatalog.ts';
import { generateDashEnergyConfig } from './generateDashEnergyConfig.ts';
import { generateHitStopCurveCatalog } from './generateHitStopCurveCatalog.ts';
import { generateSkillSettingCatalog } from './generateSkillSettingCatalog.ts';
import { formatGeneratedCandidate, formatGeneratedSource } from './formatGeneratedSource.ts';
import { generateGlobalBuffCatalog } from './generateGlobalBuffCatalog.ts';
import { generateContingencyContractLocales } from './generateContingencyContractLocales.ts';
import { generateConsumableDefinitions } from './generateConsumableDefinitions.ts';
import { generateCombatDefinitionCandidates } from './generateCombatDefinitionCandidates.ts';
import { requireArray, requireNonEmptyString, requireRecord } from '../src/source/primitives.ts';
import { typeCheckCandidateOverlay } from '../src/compiler/publication/candidateTypeCheck.ts';
import { checkCandidateGameAssets } from '../src/compiler/publication/candidateAssetCheck.ts';
import { auditCandidateOperatorSkills } from './auditCandidateOperatorSkills.ts';
import { auditCandidateEquipment } from './auditCandidateEquipment.ts';
import { extractEnemyRankEvidence } from './extractEnemyRankEvidence.ts';
import { generateEnemyDefinitions } from './generateEnemyDefinitions.ts';
import { auditCandidateEnemyDefinitions } from './auditCandidateEnemyDefinitions.ts';
import { exportReferencedGameIcons } from './exportReferencedGameIcons.ts';
import { publishGameDataCandidate } from '../src/compiler/publication/gameDataCandidatePublisher.ts';
import { OPERATOR_DEFINITION_OUTPUTS } from './operatorDefinitionOutputs.ts';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../..');
const runFile = promisify(execFile);
const GAME_LOCALE_FILES = ['zh', 'en'].flatMap(locale =>
  [
    'operators',
    'terms',
    'weapons',
    'gearsets',
    'gearpieces',
    'enemies',
    'contingency-contracts',
    'consumables',
  ].map(name => `${locale}/${name}.json`),
);
const GAME_LOCALE_REBUILD_OUTPUTS = GAME_LOCALE_FILES.map(file => `src/i18n/game-locales/${file}`);

export interface RebuildArguments {
  readonly sourceRoot?: string;
  readonly version?: string;
  readonly cdn: string;
  readonly vfsBase: string;
  readonly workers: number;
  readonly tablesOnly: boolean;
  readonly publish: boolean;
  /** 显式本机 VFS 通用 worker，不执行 HTTP 响应中的命令。 */
  readonly unityWorker?: string;
}

export const GAME_DATA_CANDIDATE_TSCONFIG = 'tsconfig.app.json';

const GAME_DATA_PUBLISH_DIRECTORY_OUTPUTS = [
  'src/data/buffs/generated',
  'src/data/equipment/generated',
  'src/data/equipment/generated-weapons',
  'src/data/equipment/generated-gear-sets',
  'src/data/enemies/generated',
  'src/data/mechanics/generated',
  'src/data/consumables/generated',
  // These roots contain referenced game-derived WebP files plus the four explicitly audited
  // project defaults. Replacing the roots removes stale, no-longer-referenced game icons.
  'public/equipment',
  'public/consumables',
  'public/enemies',
  'public/icons',
  'public/operators',
  'public/weapons',
] as const;

const GAME_DATA_PUBLISH_FILE_OUTPUTS = [
  ...OPERATOR_DEFINITION_OUTPUTS,
  'src/data/combat/gameplayTagCatalog.generated.ts',
  'src/data/combat/gameplayTagPredefine.generated.ts',
  'src/data/combat/hitStopCurveCatalog.generated.ts',
  'src/data/combat/timeDilationCatalog.generated.ts',
  'src/data/combat/battleCommandMappingCatalog.generated.ts',
  'src/data/combat/movementSettingCatalog.generated.ts',
  'src/data/combat/dashEnergyConfig.generated.ts',
  'src/data/combat/skillSettings.generated.ts',
  ...GAME_LOCALE_REBUILD_OUTPUTS,
] as const;

/** 游戏派生产物不等于整个 src/data 或 public；混合文件不能直接登记为可删除目录。 */
export const GAME_DATA_REBUILD_BOUNDARIES = [
  {
    id: 'operators',
    outputs: OPERATOR_DEFINITION_OUTPUTS,
    blocker:
      '同批 31 名/328 技能候选、虚拟落位类型检查、325 个可放置技能单放、198 张技能库卡片整链、31 条全卡片组合轴、单文件 1 MiB 源码上限及可回滚发布已接入；仍需机制定向组合和数值回归。不得复用正式派生目录。',
  },
  {
    id: 'common-buffs',
    outputs: ['src/data/buffs/generated'],
    blocker:
      '同批 31 名闭包已可汇总 61 个公共 Buff，并随技能单放、技能库卡片整链和每名干员全卡片组合轴模拟及发布；仍需机制定向组合和显示身份审计。',
  },
  {
    id: 'gears',
    outputs: ['src/data/equipment/generated'],
    blocker:
      '单件装备已可从表格独立生成，并随同批候选通过最低/最高精炼、第二饰品槽、双饰品装配模拟和发布；仍需机制定向差分。',
  },
  {
    id: 'weapons',
    outputs: ['src/data/equipment/generated-weapons'],
    blocker:
      '完整标签和被动来源已可同次任务编译 79 把武器并通过候选类型/资源、逐武器兼容干员装配模拟和发布；仍需机制定向组合回归。',
  },
  {
    id: 'gear-sets',
    outputs: ['src/data/equipment/generated-gear-sets'],
    blocker:
      '同次任务完整标签与被动闭包已可生成并发布全部套装，并逐套通过三件套四技能场景及无套装/纯静态基线差分；仍需机制定向数值和来源版本核对。',
  },
  {
    id: 'consumables',
    outputs: ['src/data/consumables/generated'],
    blocker:
      '主动使用物品由同批 UseItemTable、ItemTable 与 BuffData 严格生成；当前只发布原生 300 秒干员增益物品，治疗、复活、驱散和投掷物仍明确排除。Buff 最终定义随公共 Buff 目录发布。',
  },
  {
    id: 'global-catalogs',
    outputs: [
      'src/data/combat/gameplayTagCatalog.generated.ts',
      'src/data/combat/gameplayTagPredefine.generated.ts',
      'src/data/combat/hitStopCurveCatalog.generated.ts',
      'src/data/combat/timeDilationCatalog.generated.ts',
      'src/data/combat/battleCommandMappingCatalog.generated.ts',
      'src/data/combat/movementSettingCatalog.generated.ts',
      'src/data/combat/dashEnergyConfig.generated.ts',
      'src/data/combat/skillSettings.generated.ts',
      'src/data/mechanics/generated',
    ],
    blocker:
      '完整标签配置集、预定义表、TimeDilation、SkillSetting、危机合约表目录与其引用的 GlobalBuff 已可自动导出转换；其他全局配置/HUD prefab 仍待接入。VFS worker 需显式配置，且仍须闭合 AKEDB/VFS 版本身份。',
  },
  {
    id: 'template-evidence',
    outputs: [],
    blocker:
      '能力实体、当前所需投射物 EntityBB、TimeDilation、SkillSetting 与两个已登记 GlobalBuff 均直接读取本次来源；仍须由整批候选反向证明 GlobalBuff 身份清单没有漏项。',
  },
  {
    id: 'enemies',
    outputs: ['src/data/enemies/generated'],
    blocker:
      '87 个原生 eny_* 敌人已可由同批表格与 VFS Unity worker 原始 EnemyTemplateData.rank 生成并发布；韧性节点 2 秒仍是明确标注的项目兼容常量。敌人图标已进入隔离引用闭包。',
  },
  {
    id: 'locales',
    outputs: GAME_LOCALE_REBUILD_OUTPUTS,
    blocker:
      '干员、战斗术语、武器、套装、单件装备、枚举、敌人、危机合约和消耗品的 18 个中英文文件已可由同批本地 TableCfg、候选身份和项目自有枚举配置严格生成，并随完整候选通过资源与发布门禁。',
  },
  {
    id: 'icons',
    outputs: [],
    blocker:
      '完整候选可在隔离 public 根按引用导出并发布 WebP，项目占位图明确复制为 kept-local；不能把混有自有 UI 的整个 public 目录登记为游戏派生目录。',
  },
  {
    id: 'simulation-and-publication',
    outputs: [],
    blocker:
      '全部候选闭合后执行严格契约、技能上轴、配装模拟、图片引用及来源冻结检查，成功才允许可回滚逐文件发布；该完整路径已由统一入口实际通过。',
  },
] as const;

export interface RebuildStage {
  readonly id: string;
  readonly status: 'passed' | 'blocked' | 'failed';
  readonly detail: unknown;
}

/**
 * 当前第一阶段只产出隔离候选与完整性报告，绝不替换正式数据。
 * sourceRoot 是显式的离线重试输入，仍须逐文件复验，不寻找其他历史缓存。
 */
export async function rebuildGameData(args: RebuildArguments, projectRoot = PROJECT_ROOT) {
  const root = await fs.realpath(projectRoot);
  const runParent = path.join(root, 'tmp', 'game-data-rebuild');
  // 不允许 tmp 或其子目录是指向正式资源/外部工作树的 junction。
  for (const directory of [path.join(root, 'tmp'), runParent]) {
    await fs.mkdir(directory, { recursive: true });
    if ((await fs.lstat(directory)).isSymbolicLink())
      throw new Error(`rebuild directory is a link: ${directory}`);
    if (path.resolve(await fs.realpath(directory)) !== path.resolve(directory)) {
      throw new Error(`rebuild directory escapes project: ${directory}`);
    }
  }
  const runRoot = await fs.mkdtemp(path.join(runParent, 'run-'));
  const candidateRoot = path.join(runRoot, 'candidate');
  const sourceRoot = args.sourceRoot
    ? path.resolve(args.sourceRoot)
    : path.join(runRoot, 'sources');
  const sourceCatalogPath = path.join(root, 'tools/game-data-compiler/game-data-sources.json');
  const stages: RebuildStage[] = [];
  let snapshot: Awaited<ReturnType<typeof verifyGameDataSnapshot>> | undefined;
  const stage = async (id: string, action: () => Promise<unknown>) => {
    try {
      const detail = await action();
      stages.push({ id, status: 'passed', detail });
      return true;
    } catch (error) {
      stages.push({
        id,
        status: 'failed',
        detail: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  };
  const sourceOkay = await stage('sources', async () => {
    if (!args.sourceRoot) {
      await downloadGameDataSources({
        cdn: args.cdn,
        vfsBase: args.vfsBase,
        sourceMode: 'hybrid',
        version: args.version ?? 'latest',
        sourceCatalog: sourceCatalogPath,
        output: sourceRoot,
        workers: args.workers,
        tablesOnly: args.tablesOnly,
      });
    }
    snapshot = await verifyGameDataSnapshot(sourceRoot, await loadSourceCatalog(sourceCatalogPath));
    if (args.version && args.version !== 'latest' && snapshot.version !== args.version) {
      throw new Error(
        `snapshot version ${snapshot.version} does not match requested ${args.version}`,
      );
    }
    return snapshot;
  });
  if (sourceOkay) {
    const missingRequestedInputs = snapshot!.missingInputs.filter(
      input => !args.tablesOnly || input.startsWith('TableCfg-current/'),
    );
    stages.push({
      id: 'source-coverage',
      status: missingRequestedInputs.length ? 'blocked' : 'passed',
      detail: { missingInputs: missingRequestedInputs },
    });
    await stage('content-inventory', () => inspectSourceIdentities(sourceRoot, root));
    if (args.tablesOnly || missingRequestedInputs.length !== 0 || !args.unityWorker) {
      await stage('gears', async () => {
        const relativeOutput = 'src/data/equipment/generated';
        const generationArgs = {
          tablesDirectory: path.join(sourceRoot, 'TableCfg-current'),
          outputDirectory: path.join(candidateRoot, relativeOutput),
          check: false,
        };
        const generated = await generateGearDefinitions(generationArgs);
        // 重跑真实领域生成器做确定性检查，不把写文件成功当成重建成功。
        await generateGearDefinitions({ ...generationArgs, check: true });
        return {
          ...generated,
          deterministicCheck: 'passed',
          comparison: await compareCandidateFiles(
            path.join(root, relativeOutput),
            generationArgs.outputDirectory,
          ),
        };
      });
    }
    if (!args.tablesOnly && missingRequestedInputs.length === 0) {
      await stage('ability-entity-templates', async () => {
        const catalog = readAbilityEntityTemplates(path.join(sourceRoot, 'AbilityEntityData'));
        return {
          templateCount: catalog.templates.length,
          source: 'current-snapshot/AbilityEntityData',
          note: '严格模板前缀及身份索引通过；不代表组件/子技能闭包或模拟通过，不生成聚合中间文件。',
        };
      });
    }
    if (!args.tablesOnly && missingRequestedInputs.length === 0 && args.unityWorker) {
      await stage('enemies', async () => {
        const relativeOutput = 'src/data/enemies/generated';
        const rankOutput = path.join(runRoot, 'enemy-ranks.tmp.json');
        try {
          const rankInput = {
            tablesDirectory: path.join(sourceRoot, 'TableCfg-current'),
            unityWorker: args.unityWorker!,
            output: rankOutput,
            vfsUrl: args.vfsBase.replace(/\/api\/endaxis-data\/?$/, ''),
            workers: Math.min(args.workers, 4),
          };
          const ranks = await extractEnemyRankEvidence(rankInput);
          const firstRankText = await fs.readFile(rankOutput, 'utf8');
          await extractEnemyRankEvidence(rankInput);
          if ((await fs.readFile(rankOutput, 'utf8')) !== firstRankText) {
            throw new Error('enemy rank evidence changed on identical second extraction');
          }
          const generationInput = {
            tablesDirectory: rankInput.tablesDirectory,
            rankEvidence: rankOutput,
            runtimeDefaults: path.join(
              root,
              'tools/game-data-compiler/config/enemies/runtime-defaults.json',
            ),
            selectionCategories: path.join(
              root,
              'tools/game-data-compiler/config/enemies/selection-categories.json',
            ),
            outputDirectory: path.join(candidateRoot, relativeOutput),
            check: false,
          };
          const generated = await generateEnemyDefinitions(generationInput);
          await generateEnemyDefinitions({ ...generationInput, check: true });
          return {
            ranks,
            generated,
            audit: await auditCandidateEnemyDefinitions({
              tablesDirectory: rankInput.tablesDirectory,
              rankEvidence: rankOutput,
              runtimeDefaults: generationInput.runtimeDefaults,
              selectionCategories: generationInput.selectionCategories,
            }),
            deterministicCheck: 'passed',
            comparison: await compareCandidateFiles(
              path.join(root, relativeOutput),
              generationInput.outputDirectory,
            ),
          };
        } finally {
          await fs.rm(rankOutput, { force: true });
        }
      });
      const tags = path.join(candidateRoot, 'src/data/combat/gameplayTagCatalog.generated.ts');
      const tagRoot = path.join(runRoot, 'unity-sources', 'GameplayTagConfigSet');
      const tagsOkay = await stage('gameplay-tags', async () => {
        const exported = await exportGameplayTagConfigSet({
          output: tagRoot,
          vfsBase: args.vfsBase,
          cdn: args.cdn,
          version: snapshot!.version,
          unityWorker: args.unityWorker!,
        });
        const input = {
          dump: exported.manifestPath,
          output: tags,
          sourceSet: true,
          sourceRoot: tagRoot,
          allowNewSource: true,
          check: false,
        };
        const generated = await generateGameplayTagCatalog(input);
        await generateGameplayTagCatalog({ ...input, check: true });
        return {
          ...exported,
          ...generated,
          deterministicCheck: 'passed',
          note: '同次任务补取完整配置集；VFS 客户端与 AKEDB 版本一致性仍未证明，非发布许可。',
        };
      });
      if (tagsOkay) {
        const timeDilationCatalog = path.join(
          candidateRoot,
          'src/data/combat/timeDilationCatalog.generated.ts',
        );
        const battleCommandMappingCatalog = path.join(
          candidateRoot,
          'src/data/combat/battleCommandMappingCatalog.generated.ts',
        );
        const movementSettingCatalog = path.join(
          candidateRoot,
          'src/data/combat/movementSettingCatalog.generated.ts',
        );
        const dashEnergyConfig = path.join(
          candidateRoot,
          'src/data/combat/dashEnergyConfig.generated.ts',
        );
        const hitStopCurveCatalog = path.join(
          candidateRoot,
          'src/data/combat/hitStopCurveCatalog.generated.ts',
        );
        const skillSettingCatalog = path.join(runRoot, 'intermediate/skill-setting.catalog.json');
        const runtimeSkillSettings = path.join(
          candidateRoot,
          'src/data/combat/skillSettings.generated.ts',
        );
        const globalBuffCatalog = path.join(
          runRoot,
          'intermediate/global-buff-templates.generated.json',
        );
        const contingencyContractLocaleRoot = path.join(candidateRoot, 'src/i18n/game-locales');
        let contingencyContractGlobalBuffIds: readonly string[] = [];
        const contingencyContractOkay = await stage('contingency-contract-locales', async () => {
          const input = {
            tableRoot: path.join(sourceRoot, 'TableCfg-current'),
            revision: snapshot!.version,
            output: contingencyContractLocaleRoot,
            check: false,
          };
          const generated = await generateContingencyContractLocales(input);
          await generateContingencyContractLocales({ ...input, check: true });
          contingencyContractGlobalBuffIds = generated.globalBuffIds;
          return {
            ...generated,
            deterministicCheck: 'passed',
            note: 'termType 只按当前程序集显式枚举分类；目录尚不表示对应 Buff 已全部进入模拟。',
          };
        });
        const timeDilationOkay = await stage('time-dilation', async () => {
          const sourceUrl = await resolveNamedManifestAssetPreview(
            args.vfsBase,
            'timedilationconfig.asset',
            'assets/beyond/dynamicassets/gamedata/gameplayconfig/timedilationconfig.asset',
          );
          const input = {
            sourceUrl,
            gameplayTagCatalog: tags,
            output: timeDilationCatalog,
            check: false,
          };
          const generated = await generateTimeDilationCatalog(input);
          await generateTimeDilationCatalog({ ...input, check: true });
          return {
            ...generated,
            sourceUrl,
            deterministicCheck: 'passed',
            note: '来自当前 VFS manifest；在 VFS 与 AKEDB 版本身份闭合前仍只是候选。',
          };
        });
        const battleCommandMappingOkay = await stage('battle-command-mapping', async () => {
          const sourceUrl = await resolveNamedManifestAssetPreview(
            args.vfsBase,
            'battlecommandmappingconfig.asset',
            'assets/beyond/dynamicassets/gamedata/gameplayconfig/battlecommandmappingconfig.asset',
          );
          const input = { sourceUrl, output: battleCommandMappingCatalog, check: false };
          const generated = await generateBattleCommandMappingCatalog(input);
          await generateBattleCommandMappingCatalog({ ...input, check: true });
          return {
            ...generated,
            sourceUrl,
            deterministicCheck: 'passed',
            note: '来自当前 VFS manifest；保留原生秒值，不在生成边界量化为帧。',
          };
        });
        const movementSettingOkay = await stage('movement-setting', async () => {
          const sourceUrl = await resolveNamedManifestAssetPreview(
            args.vfsBase,
            'movementsetting_default.asset',
            'assets/beyond/dynamicassets/gamedata/gameplayconfig/movementsetting/movementsetting_default.asset',
          );
          const input = { sourceUrl, output: movementSettingCatalog, check: false };
          const generated = await generateMovementSettingCatalog(input);
          await generateMovementSettingCatalog({ ...input, check: true });
          return {
            ...generated,
            sourceUrl,
            deterministicCheck: 'passed',
            note: '来自当前 VFS manifest；连续 Dash 的内外窗口保留原生秒值。',
          };
        });
        const dashEnergyOkay = await stage('dash-energy', async () => {
          const input = {
            source: path.join(sourceRoot, 'TableCfg-current/GlobalConst.json'),
            output: dashEnergyConfig,
            check: false,
          };
          const generated = await generateDashEnergyConfig(input);
          await generateDashEnergyConfig({ ...input, check: true });
          return {
            ...generated,
            deterministicCheck: 'passed',
            note: '账号能量上限除以单次 Dash 消耗，生成模拟使用的共享闪避次数。',
          };
        });
        const hitStopOkay = await stage('hit-stop', async () => {
          const sourceUrl = await resolveNamedManifestAssetPreview(
            args.vfsBase,
            'hitstopconfig.asset',
            'assets/beyond/dynamicassets/gamedata/gameplayconfig/hitstopconfig.asset',
          );
          const input = { sourceUrl, output: hitStopCurveCatalog, check: false };
          const generated = await generateHitStopCurveCatalog(input);
          await generateHitStopCurveCatalog({ ...input, check: true });
          return {
            ...generated,
            sourceUrl,
            deterministicCheck: 'passed',
            note: '来自当前 VFS manifest；与 TimeDilation 分开保留命中停顿曲线身份。',
          };
        });
        const skillSettingOkay = await stage('skill-setting', async () => {
          const sourceUrl = await resolveNamedManifestAssetPreview(
            args.vfsBase,
            'skillsetting.asset',
            'assets/beyond/dynamicassets/gamedata/gameplayconfig/skillsetting.asset',
          );
          const input = {
            sourceUrl,
            revision: snapshot!.version,
            output: skillSettingCatalog,
            runtimeOutput: runtimeSkillSettings,
            check: false,
          };
          const generated = await generateSkillSettingCatalog(input);
          await generateSkillSettingCatalog({ ...input, check: true });
          return {
            ...generated,
            sourceUrl,
            deterministicCheck: 'passed',
            note: '来自当前 VFS manifest；在 VFS 与 AKEDB 版本身份闭合前仍只是候选。',
          };
        });
        const globalBuffsOkay = await stage('global-buffs', async () => {
          if (!contingencyContractOkay) {
            throw new Error('Contingency Contract catalog is unavailable');
          }
          const input = {
            vfsBase: args.vfsBase,
            revision: snapshot!.version,
            identities: path.join(
              root,
              'tools/game-data-compiler/config/globalBuffIdentities.json',
            ),
            output: globalBuffCatalog,
            check: false,
            additionalIdentities: contingencyContractGlobalBuffIds,
            referenceDataRoot: path.join(sourceRoot, 'BuffData'),
            tolerateUnsupportedAdditionalIdentities: true,
          };
          const generated = await generateGlobalBuffCatalog(input);
          await generateGlobalBuffCatalog({ ...input, check: true });
          return {
            ...generated,
            deterministicCheck: 'passed',
            note: '基础身份清单与当前危机合约 SelfGlobalBuff 词条取并集；候选生成仍须反向核验其他领域无遗漏引用。',
          };
        });
        const operatorCandidateInput = {
          manifest: path.join(root, 'tools/game-data-compiler/config/operators.json'),
          sourceRoot,
          tableRoot: path.join(sourceRoot, 'TableCfg-current'),
          skillPatchTable: path.join(sourceRoot, 'TableCfg-current/SkillPatchTable.json'),
          buffDataRoot: path.join(sourceRoot, 'BuffData'),
          gameplayTagCatalog: tags,
          timeDilationCatalog,
          globalBuffCatalog,
          skillSettingCatalog,
        };
        let combatOkay = false;
        if (
          contingencyContractOkay &&
          timeDilationOkay &&
          battleCommandMappingOkay &&
          movementSettingOkay &&
          dashEnergyOkay &&
          hitStopOkay &&
          skillSettingOkay &&
          globalBuffsOkay
        ) {
          combatOkay = await stage('combat-definitions', async () => {
            const input = {
              ...operatorCandidateInput,
              candidateRoot,
              auditRoot: path.join(runRoot, 'audit'),
              mechanicScope: path.join(
                root,
                'tools/game-data-compiler/config/contingencyContractSimulationScope.json',
              ),
              check: false,
            };
            const generated = await generateCombatDefinitionCandidates(input);
            await generateCombatDefinitionCandidates({ ...input, check: true });
            return {
              ...generated,
              deterministicCheck: 'passed',
              comparison: {
                operators: await compareCandidateFileSet(
                  root,
                  candidateRoot,
                  OPERATOR_DEFINITION_OUTPUTS,
                ),
                directories: await Promise.all(
                  [
                    'src/data/buffs/generated',
                    'src/data/equipment/generated',
                    'src/data/equipment/generated-weapons',
                    'src/data/equipment/generated-gear-sets',
                    'src/data/mechanics/generated',
                  ].map(async output => ({
                    output,
                    ...(await compareCandidateFiles(
                      path.join(root, output),
                      path.join(candidateRoot, output),
                    )),
                  })),
                ),
              },
            };
          });
        } else {
          stages.push({
            id: 'combat-definitions',
            status: 'blocked',
            detail:
              '同次任务的危机合约、TimeDilation、HitStop、SkillSetting 或 GlobalBuff 候选未通过。',
          });
        }
        let consumablesOkay = false;
        if (combatOkay) {
          consumablesOkay = await stage('consumables', async () => {
            const definitionOutput = path.join(
              candidateRoot,
              'src/data/consumables/generated/consumableDefinitions.generated.ts',
            );
            const buffOutput = path.join(
              candidateRoot,
              'src/data/buffs/generated/consumableBuffDefinitions.generated.ts',
            );
            const input = {
              tableRoot: path.join(sourceRoot, 'TableCfg-current'),
              buffDataRoot: path.join(sourceRoot, 'BuffData'),
              definitionOutput,
              buffOutput,
            };
            const generated = await generateConsumableDefinitions(input);
            const first = await Promise.all([
              fs.readFile(definitionOutput, 'utf8'),
              fs.readFile(buffOutput, 'utf8'),
            ]);
            await generateConsumableDefinitions(input);
            const second = await Promise.all([
              fs.readFile(definitionOutput, 'utf8'),
              fs.readFile(buffOutput, 'utf8'),
            ]);
            if (first[0] !== second[0] || first[1] !== second[1]) {
              throw new Error('consumable candidate changed on identical second generation');
            }
            return { ...generated, deterministicCheck: 'passed' };
          });
        } else {
          stages.push({
            id: 'consumables',
            status: 'blocked',
            detail: '战斗定义未通过，不能把消耗品 Buff 写入不完整候选。',
          });
        }
        // GlobalBuff 模板只用于把本次来源编译进最终定义，不是运行时或发布产物。
        await fs.rm(path.dirname(globalBuffCatalog), { recursive: true, force: true });
        await stage('operator-refresh', async () => {
          const detail = await inspectOperatorRefresh(sourceRoot, root, tags);
          await writeAtomicJson(path.join(runRoot, 'audit', 'operator-refresh.json'), detail);
          // 保留完整逐项报告；编译前缀通过不能掩盖技能组阻塞或需要审阅的 pin/新增身份。
          if (
            detail.templates.blockedCount ||
            detail.skillLibraries.blockedCount ||
            detail.templates.changedPinCount ||
            detail.templates.unconfiguredSourceFiles.length
          )
            stages.push({
              id: 'operator-refresh-review',
              status: 'blocked',
              detail: {
                report: path.join(runRoot, 'audit', 'operator-refresh.json'),
                templateFailures: detail.templates.blockedCount,
                skillLibraryFailures: detail.skillLibraries.blockedCount,
                changedPins: detail.templates.changedPinCount,
                unconfiguredTemplates: detail.templates.unconfiguredSourceFiles,
              },
            });
          return detail;
        });
        await stage('gameplay-tag-predefine', async () => {
          const params = [
            path.join(sourceRoot, 'GameplayConfig/GameplayTagPredefineTable.json'),
            path.join(candidateRoot, 'src/data/combat/gameplayTagPredefine.generated.ts'),
            snapshot!.version,
            tags,
          ] as const;
          const generated = await generateGameplayTagPredefine(...params);
          await generateGameplayTagPredefine(...params, true);
          return { ...generated, deterministicCheck: 'passed' };
        });
        if (combatOkay && consumablesOkay) {
          await stage('locales', async () => {
            const relative = 'src/i18n/game-locales';
            const output = path.join(candidateRoot, relative);
            const input = {
              tableRoot: path.join(sourceRoot, 'TableCfg-current'),
              operatorManifest: path.join(root, 'tools/game-data-compiler/config/operators.json'),
              weaponDefinitionRoot: path.join(
                candidateRoot,
                'src/data/equipment/generated-weapons',
              ),
              gearDefinitionRoot: path.join(candidateRoot, 'src/data/equipment/generated'),
              gearSetDefinitionRoot: path.join(
                candidateRoot,
                'src/data/equipment/generated-gear-sets',
              ),
              uiLocaleRoot: path.join(root, 'src/i18n/locales'),
              output,
            };
            const generated = await exportCandidateGameLocales(root, input);
            const before = await readDirectoryTextFiles(output);
            await exportCandidateGameLocales(root, input);
            const after = await readDirectoryTextFiles(output);
            if (!sameTextFiles(before, after))
              throw new Error('locale candidate output changed on identical second generation');
            return {
              ...generated,
              deterministicCheck: 'passed',
              comparison: await compareCandidateFileSet(
                path.join(root, relative),
                output,
                GAME_LOCALE_FILES,
              ),
              note: '游戏文本只读同批 TableCfg 与候选定义身份；枚举显示词是项目自有语义配置。不联网、不合并正式语言目录、不发布。',
            };
          });
          await stage('icons', async () => ({
            ...(await exportReferencedGameIcons({
              workers: args.workers,
              sourceMode: 'hybrid',
              cdn: args.cdn,
              overwrite: false,
              dryRun: false,
              refreshRichText: false,
              prune: false,
              vfsBaseUrl: args.vfsBase.replace(/\/api\/endaxis-data\/?$/, ''),
              gameDataSourceRoot: sourceRoot,
              outputRoot: path.join(candidateRoot, 'public'),
              additionalReferenceRoots: [path.join(candidateRoot, 'src')],
              auditOutput: path.join(runRoot, 'audit', 'referenced-game-icons.json'),
            })),
            note: '扫描正式运行源码与同批候选，向隔离 public 根只补缺漏；游戏图经 AKEDB 优先/VFS 补缺导出，项目占位图只复制并标记 kept-local。',
          }));
        } else {
          for (const id of ['locales', 'icons'])
            stages.push({
              id,
              status: 'blocked',
              detail: '战斗定义的联合生成与独立检查未通过，不读取不完整候选。',
            });
        }
        await stage('gameplay-tags-after-generation', async () => {
          const detail = requireRecord(
            stages.find(item => item.id === 'gameplay-tags')!.detail,
            'GameplayTag stage',
          );
          const verified = await generateGameplayTagCatalog({
            dump: path.join(tagRoot, 'source-set.json'),
            output: tags,
            sourceSet: true,
            sourceRoot: tagRoot,
            allowNewSource: true,
            check: true,
          });
          if (verified.sourceSha256 !== detail.sourceSha256)
            throw new Error('GameplayTag source set changed during generation');
          return verified;
        });
        const typeCheckDependencies = [
          'combat-definitions',
          'consumables',
          'enemies',
          'gameplay-tags',
          'time-dilation',
          'hit-stop',
          'skill-setting',
          'contingency-contract-locales',
          'global-buffs',
          'gameplay-tag-predefine',
          'locales',
          'icons',
          'gameplay-tags-after-generation',
        ];
        const generationUnavailable = typeCheckDependencies.filter(
          id => stages.find(item => item.id === id)?.status !== 'passed',
        );
        if (generationUnavailable.length === 0) {
          await stage('generated-format', () =>
            formatGeneratedCandidate(candidateRoot, [
              ...GAME_DATA_PUBLISH_DIRECTORY_OUTPUTS,
              ...GAME_DATA_PUBLISH_FILE_OUTPUTS,
            ]),
          );
        } else {
          stages.push({
            id: 'generated-format',
            status: 'blocked',
            detail: { unavailableStages: generationUnavailable },
          });
        }
        const unavailable = [
          ...generationUnavailable,
          ...(stages.find(item => item.id === 'generated-format')?.status === 'passed'
            ? []
            : ['generated-format']),
        ];
        if (unavailable.length === 0) {
          const candidateTypeCheckOkay = await stage('candidate-type-check', async () => ({
            ...typeCheckCandidateOverlay({
              projectRoot: root,
              candidateRoot,
              configFile: GAME_DATA_CANDIDATE_TSCONFIG,
              replacementPaths: GAME_DATA_REBUILD_BOUNDARIES.flatMap(item => item.outputs),
            }),
            note: '所有已登记领域候选以未来正式路径进入 TypeScript 读视图；未覆盖工作树正式文件。',
          }));
          await stage('candidate-assets', async () => ({
            ...(await checkCandidateGameAssets({
              projectRoot: root,
              candidateRoot,
              replacementPaths: GAME_DATA_REBUILD_BOUNDARIES.flatMap(item => item.outputs),
            })),
            note: '仅检查候选字面图片引用已存在于 public；不下载、不发布。',
          }));
          if (candidateTypeCheckOkay) {
            await stage('candidate-operator-skills', async () => ({
              ...(await auditCandidateOperatorSkills({
                candidateRoot,
                potential: 0,
                endFrame: 3600,
              })),
              note: '逐个放置全部非 internal 干员技能，按技能库自身放置语义运行每张卡片的完整技能链，并按声明顺序把每名干员的全部可见卡片放入同一轴；分组只构造测试输入，候选仍不发布。',
            }));
            await stage('candidate-equipment', async () => ({
              ...(await auditCandidateEquipment({ candidateRoot, endFrame: 300 })),
              note: '逐把装配候选武器；逐件检查装备最低/最高精炼、饰品第二槽与双饰品；逐套运行三件套四技能场景并验证相对无套装基线的可观察差分，运行时套装另验证相对纯静态基线的下游差分。候选仍不发布。',
            }));
          } else {
            stages.push({
              id: 'candidate-operator-skills',
              status: 'blocked',
              detail: { unavailableStages: ['candidate-type-check'] },
            });
            stages.push({
              id: 'candidate-equipment',
              status: 'blocked',
              detail: { unavailableStages: ['candidate-type-check'] },
            });
          }
        } else {
          stages.push({
            id: 'candidate-type-check',
            status: 'blocked',
            detail: { unavailableStages: unavailable },
          });
          stages.push({
            id: 'candidate-assets',
            status: 'blocked',
            detail: { unavailableStages: unavailable },
          });
          stages.push({
            id: 'candidate-operator-skills',
            status: 'blocked',
            detail: { unavailableStages: unavailable },
          });
          stages.push({
            id: 'candidate-equipment',
            status: 'blocked',
            detail: { unavailableStages: unavailable },
          });
        }
      } else {
        for (const id of [
          'operator-refresh',
          'combat-definitions',
          'consumables',
          'contingency-contract-locales',
          'gameplay-tag-predefine',
          'locales',
          'icons',
          'candidate-type-check',
          'candidate-assets',
          'candidate-operator-skills',
          'candidate-equipment',
        ])
          stages.push({
            id,
            status: 'blocked',
            detail: '完整 GameplayTag 配置集未通过，不借正式目录补齐。',
          });
      }
    } else if (!args.tablesOnly) {
      stages.push({
        id: 'gameplay-tags',
        status: 'blocked',
        detail: '需要完整来源快照及显式 --unity-worker；不会使用旧标签目录。',
      });
      stages.push({
        id: 'candidate-type-check',
        status: 'blocked',
        detail: '完整候选未生成，不能用旧正式文件补齐类型检查。',
      });
      stages.push({
        id: 'candidate-assets',
        status: 'blocked',
        detail: '完整候选未生成，不能用旧正式定义代替资源引用闭包。',
      });
      stages.push({
        id: 'candidate-operator-skills',
        status: 'blocked',
        detail: '完整候选未生成，不能用旧正式定义代替逐技能模拟。',
      });
      stages.push({
        id: 'candidate-equipment',
        status: 'blocked',
        detail: '完整候选未生成，不能用旧正式定义代替逐武器装配模拟。',
      });
    }
    await stage('sources-after-generation', async () => {
      const after = await verifyGameDataSnapshot(
        sourceRoot,
        await loadSourceCatalog(sourceCatalogPath),
      );
      if (after.snapshotSha256 !== snapshot!.snapshotSha256)
        throw new Error('source snapshot changed during generation');
      return { snapshotSha256: after.snapshotSha256 };
    });
  } else {
    for (const id of ['content-inventory', 'gears']) {
      stages.push({
        id,
        status: 'blocked',
        detail: '来源完整性校验未通过，不读取旧输入或正式产物补齐。',
      });
    }
  }
  let published = false;
  if (args.publish) {
    const unavailableStages = stages.filter(item => item.status !== 'passed').map(item => item.id);
    if (args.tablesOnly || unavailableStages.length > 0) {
      stages.push({
        id: 'publication',
        status: 'blocked',
        detail: {
          unavailableStages,
          ...(args.tablesOnly ? { reason: '--tables-only cannot publish a partial snapshot' } : {}),
        },
      });
    } else {
      published = await stage('publication', async () => ({
        ...(await publishGameDataCandidate({
          projectRoot: root,
          candidateRoot,
          directoryOutputs: GAME_DATA_PUBLISH_DIRECTORY_OUTPUTS,
          fileOutputs: GAME_DATA_PUBLISH_FILE_OUTPUTS,
        })),
        note: '全部候选门禁和来源冻结检查通过后，逐文件同步专用生成/图片目录并精确替换混合目录中的语言与全局文件；过期文件删除，任一失败由预先备份逆序恢复。',
      }));
    }
  }
  const report = {
    sourcePolicy: 'akedb-primary-vfs-fallback',
    fullRebuild: published,
    published,
    requestedScope: args.tablesOnly
      ? 'tables-and-gear-candidate'
      : args.publish
        ? 'full-and-publish'
        : 'full-candidate',
    runRoot,
    sourceRoot,
    candidateRoot,
    stages,
    remaining: published ? [] : GAME_DATA_REBUILD_BOUNDARIES,
  };
  await writeAtomicJson(path.join(runRoot, 'report.json'), report);
  // 完整重建在剩余边界闭合前不能返回成功；显式表格切片仅对该切片返回成功。
  const exitCode = stages.some(item => item.status === 'failed')
    ? 1
    : published
      ? 0
      : args.tablesOnly && stages.every(item => item.status === 'passed')
        ? 0
        : 2;
  return { report, exitCode };
}

async function inspectSourceIdentities(sourceRoot: string, projectRoot: string) {
  const table = async (name: string) =>
    requireRecord(await readJson(path.join(sourceRoot, 'TableCfg-current', `${name}.json`)), name);
  const manifest = requireRecord(
    await readJson(path.join(projectRoot, 'tools/game-data-compiler/config/operators.json')),
    'operators',
  );
  const configuredCharacters = requireArray(manifest.operators, 'operators.operators').map(
    (value, index) =>
      requireNonEmptyString(
        requireRecord(value, `operator[${index}]`).charId,
        `operator[${index}].charId`,
      ),
  );
  const configuredSuits = requireArray(
    await readJson(
      path.join(projectRoot, 'tools/game-data-compiler/config/gearSetIdentities.json'),
    ),
    'gearSetIdentities',
  ).map(value => requireNonEmptyString(value, 'gearSetIdentity'));
  const compare = (source: readonly string[], configured: readonly string[]) => ({
    sourceCount: source.length,
    configuredCount: configured.length,
    unconfiguredSourceIds: source.filter(id => !configured.includes(id)).sort(),
    configuredIdsMissingFromSource: configured.filter(id => !source.includes(id)).sort(),
  });
  return {
    characters: compare(Object.keys(await table('CharacterTable')), configuredCharacters),
    weapons: { sourceCount: Object.keys(await table('WeaponBasicTable')).length },
    gears: { sourceCount: Object.keys(await table('EquipTable')).length },
    gearSets: compare(Object.keys(await table('EquipSuitTable')), configuredSuits),
    note: '未配置身份不等于新增可玩内容；别名、管理员表现变体和非玩家记录须分别审计。',
  };
}

/** 正式目录只在生成之后作为可选比较对象；删除正式目录不影响候选生成。 */
export async function compareCandidateFiles(baseline: string, candidate: string) {
  async function files(root: string): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    async function walk(directory: string) {
      for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isSymbolicLink()) throw new Error(`generated directory contains a link: ${file}`);
        if (entry.isDirectory()) await walk(file);
        else
          result.set(
            path.relative(root, file).split(path.sep).join('/'),
            (await fs.readFile(file, 'utf8')).replaceAll('\r\n', '\n'),
          );
      }
    }
    await walk(root);
    return result;
  }
  const current = await files(candidate);
  const baselineExists = await fs.stat(baseline).then(
    () => true,
    (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    },
  );
  if (!baselineExists)
    return { baselinePresent: false, added: [...current.keys()].sort(), changed: [], removed: [] };
  const previous = await files(baseline);
  return {
    baselinePresent: true,
    added: [...current.keys()].filter(file => !previous.has(file)).sort(),
    changed: [...current.keys()]
      .filter(file => previous.has(file) && current.get(file) !== previous.get(file))
      .sort(),
    removed: [...previous.keys()].filter(file => !current.has(file)).sort(),
  };
}

async function compareCandidateFileSet(
  baselineRoot: string,
  candidateRoot: string,
  files: readonly string[],
) {
  const added: string[] = [];
  const changed: string[] = [];
  for (const relative of files) {
    const candidate = (await fs.readFile(path.join(candidateRoot, relative), 'utf8')).replaceAll(
      '\r\n',
      '\n',
    );
    const baseline = await fs.readFile(path.join(baselineRoot, relative), 'utf8').then(
      content => content.replaceAll('\r\n', '\n'),
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return null;
        throw error;
      },
    );
    if (baseline === null) added.push(relative);
    else if (baseline !== candidate) changed.push(relative);
  }
  return { baselinePresent: added.length !== files.length, added, changed, removed: [] };
}

interface CandidateLocaleInput {
  readonly tableRoot: string;
  readonly operatorManifest: string;
  readonly weaponDefinitionRoot: string;
  readonly gearDefinitionRoot: string;
  readonly gearSetDefinitionRoot: string;
  readonly uiLocaleRoot: string;
  readonly output: string;
}

/**
 * 本地化必须消费本次候选定义的稳定身份，不能从正式本地化或旧生成目录反推。
 * Python 仍是既有文本清洗实现；统一入口负责固定全部输入并复验完整输出契约。
 */
async function exportCandidateGameLocales(projectRoot: string, input: CandidateLocaleInput) {
  const script = path.join(projectRoot, 'tools/game-data-compiler/scripts/exportGameLocales.py');
  await runFile(
    'python',
    [
      script,
      '--table-root',
      input.tableRoot,
      '--operator-manifest',
      input.operatorManifest,
      '--weapon-definition-root',
      input.weaponDefinitionRoot,
      '--gear-definition-root',
      input.gearDefinitionRoot,
      '--gear-set-definition-root',
      input.gearSetDefinitionRoot,
      '--ui-locale-root',
      input.uiLocaleRoot,
      '--output',
      input.output,
    ],
    { cwd: projectRoot, maxBuffer: 16 * 1024 * 1024 },
  );
  const expectedFiles = [
    'consumables.json',
    'contingency-contracts.json',
    'enemies.json',
    'gearpieces.json',
    'gearsets.json',
    'operators.json',
    'terms.json',
    'weapons.json',
  ];
  const counts: Record<string, Record<string, number>> = {};
  for (const locale of ['zh', 'en']) {
    const directory = path.join(input.output, locale);
    const actualFiles = (await fs.readdir(directory)).sort();
    if (actualFiles.join('\n') !== expectedFiles.join('\n'))
      throw new Error(
        `locale ${locale}: expected ${expectedFiles.join(', ')}, got ${actualFiles.join(', ')}`,
      );
    counts[locale] = {};
    for (const file of expectedFiles) {
      const output = path.join(directory, file);
      const formatted = await formatGeneratedSource(await fs.readFile(output, 'utf8'), output);
      await fs.writeFile(output, formatted, 'utf8');
      const document = requireRecord(await readJson(output), `${locale}/${file}`);
      const count = Object.keys(document).length;
      if (count === 0) throw new Error(`${locale}/${file}: empty locale document`);
      counts[locale]![file.slice(0, -'.json'.length)] = count;
    }
  }
  for (const file of expectedFiles) {
    const key = file.slice(0, -'.json'.length);
    if (counts.zh![key] !== counts.en![key])
      throw new Error(
        `${file}: zh/en identity count differs (${counts.zh![key]} != ${counts.en![key]})`,
      );
  }
  return { counts, source: 'fixed-local-TableCfg-and-candidate-identities' };
}

async function readDirectoryTextFiles(root: string) {
  const result = new Map<string, string>();
  async function walk(directory: string) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`generated directory contains a link: ${file}`);
      if (entry.isDirectory()) await walk(file);
      else
        result.set(
          path.relative(root, file).split(path.sep).join('/'),
          await fs.readFile(file, 'utf8'),
        );
    }
  }
  await walk(root);
  return result;
}

function sameTextFiles(left: ReadonlyMap<string, string>, right: ReadonlyMap<string, string>) {
  return (
    left.size === right.size && [...left].every(([file, content]) => right.get(file) === content)
  );
}

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

/** 只读取本次复验过的原始集合；不加载旧生成定义或聚合目录。 */
export async function inspectOperatorRefresh(
  sourceRoot: string,
  projectRoot: string,
  tags: string,
) {
  const collection = async (directory: string) => {
    const records: Record<string, unknown> = {};
    for (const file of await fs.readdir(path.join(sourceRoot, directory))) {
      if (!file.endsWith('.json')) continue;
      records[directory === 'CharacterData' ? `${directory}/${file}` : file] = await readJson(
        path.join(sourceRoot, directory, file),
      );
    }
    return records;
  };
  const manifest = await readJson(
    path.join(projectRoot, 'tools/game-data-compiler/config/operators.json'),
  );
  return {
    templates: auditOperatorTemplateRefresh(
      manifest,
      await collection('CharacterData'),
      readGameplayTagPaths(tags),
    ),
    skillLibraries: auditOperatorSkillLibraries(
      manifest,
      await collection('SkillData'),
      await readJson(path.join(sourceRoot, 'TableCfg-current/SkillPatchTable.json')),
      await readJson(path.join(sourceRoot, 'TableCfg-current/CharGrowthTable.json')),
    ),
  };
}

export function parseRebuildArguments(values: readonly string[]): RebuildArguments {
  const entries = new Map<string, string>();
  let tablesOnly = false;
  let publish = false;
  const allowed = new Set([
    '--source-root',
    '--version',
    '--cdn',
    '--vfs-base',
    '--workers',
    '--unity-worker',
  ]);
  for (let i = 0; i < values.length; i++) {
    const flag = values[i]!;
    if (flag === '--tables-only' && !tablesOnly) {
      tablesOnly = true;
      continue;
    }
    if (flag === '--publish' && !publish) {
      publish = true;
      continue;
    }
    if (!allowed.has(flag) || entries.has(flag))
      throw new Error(`unknown or duplicate argument: ${flag}`);
    const value = values[++i];
    if (!value || value.startsWith('--')) throw new Error(`missing value for ${flag}`);
    entries.set(flag, value);
  }
  const workers = Number(entries.get('--workers') ?? 6);
  if (!Number.isInteger(workers) || workers <= 0)
    throw new Error('--workers: expected positive integer');
  if (tablesOnly && publish) throw new Error('--publish cannot be combined with --tables-only');
  return {
    ...(entries.has('--source-root')
      ? { sourceRoot: path.resolve(entries.get('--source-root')!) }
      : {}),
    ...(entries.has('--version') ? { version: entries.get('--version')! } : {}),
    cdn: entries.get('--cdn') ?? DEFAULT_CDN,
    vfsBase: entries.get('--vfs-base') ?? DEFAULT_VFS_BASE,
    workers,
    tablesOnly,
    publish,
    ...(entries.has('--unity-worker')
      ? { unityWorker: path.resolve(entries.get('--unity-worker')!) }
      : {}),
  };
}

async function resolveNamedManifestAssetPreview(
  vfsBase: string,
  name: string,
  expectedPath: string,
): Promise<string> {
  const endpoint = new URL('/api/manifest-assets/by-name', vfsBase);
  endpoint.searchParams.set('name', name);
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}`);
  const document = (await response.json()) as {
    candidates?: readonly { path?: unknown; previewUrl?: unknown }[];
  };
  const matches = (document.candidates ?? []).filter(item => item.path === expectedPath);
  if (matches.length !== 1 || typeof matches[0]!.previewUrl !== 'string')
    throw new Error(`${endpoint}: expected exactly one ${expectedPath}`);
  return new URL(matches[0]!.previewUrl, vfsBase).href;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const { report, exitCode } = await rebuildGameData(parseRebuildArguments(process.argv.slice(2)));
  for (const stage of report.stages) console.log(`${stage.id}: ${stage.status}`);
  console.log(
    `fullRebuild=${report.fullRebuild}; published=${report.published}; report: ${path.join(report.runRoot, 'report.json')}`,
  );
  process.exitCode = exitCode;
}
