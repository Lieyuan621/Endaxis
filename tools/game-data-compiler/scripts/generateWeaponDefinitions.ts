import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
import { readGameplayTagPaths } from './readGameplayTagPaths.ts';
import { formatGeneratedSource } from './formatGeneratedSource.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { attachWeaponProductIdentities } from '../src/domains/weapon/productIdentity.ts';
import {
  compileWeaponRuntimeDefinitionBatchSource,
  type CompiledWeaponRuntimeDefinitionBatchSource,
} from '../src/domains/weapon/runtimeDefinition.ts';
import {
  compileWeaponStaticDefinitionBatchSource,
  type CompiledWeaponStaticDefinitionBatchSource,
} from '../src/domains/weapon/staticDefinition.ts';
import {
  renderWeaponDefinitionFiles,
  type RenderedWeaponDefinitionFileSource,
} from '../src/domains/weapon/renderRuntimeDefinitions.ts';
import { writeWeaponDefinitionFiles } from '../src/domains/weapon/writeRuntimeDefinitions.ts';
import type { BuildDefinitionDiagnosticSource } from '../src/compiler/build/formalBuildDefinition.ts';
import type { DefinitionOptimizationMode } from '../src/compiler/optimization/definitionOptimization.ts';
import type { DefinitionProgramOptimizationReport } from '../src/compiler/optimization/definitionProgramOptimization.ts';
import { optimizeWeaponDefinitionPrograms } from '../src/compiler/optimization/equipmentDefinitionOptimization.ts';

export interface WeaponDefinitionSourceArguments {
  readonly tables: string;
  readonly skillData: string;
  readonly buffData: string;
  /** 同版本路径目录；缺省不猜标签，遇到带标签行为时阻断。 */
  readonly gameplayTagCatalog?: string;
}

interface Arguments extends WeaponDefinitionSourceArguments {
  readonly output: string;
  readonly auditOutput?: string;
  readonly check: boolean;
  /** 默认应用已验证的优化；report 仅报告候选，off 用于生成对照。 */
  readonly optimization?: DefinitionOptimizationMode;
}

/** 从同批原始文件编译完整武器行为；不优化、渲染或写盘，来源阻断仍按生成入口报错。 */
export function compileWeaponDefinitionsFromFiles(args: WeaponDefinitionSourceArguments) {
  const weaponTable = readJson(path.join(args.tables, 'WeaponBasicTable.json'));
  const upgradeTable = readJson(path.join(args.tables, 'WeaponUpgradeTemplateTable.json'));
  const patchTable = readJson(path.join(args.tables, 'SkillPatchTable.json'));
  const itemTable = readJson(path.join(args.tables, 'ItemTable.json'));
  const skillData = readDefinitionDirectory(args.skillData, 'skillId');
  const buffData = readDefinitionDirectory(args.buffData, 'id');
  const staticBatch = compileWeaponStaticDefinitionsIndependently(
    weaponTable,
    upgradeTable,
    skillData,
    patchTable,
  );
  const identified = attachWeaponProductIdentities(staticBatch.definitions, itemTable);
  const runtimeBatch = compileWeaponRuntimeDefinitionBatchSource(
    identified,
    staticBatch.runtimeDependencies,
    buffData,
    args.gameplayTagCatalog === undefined
      ? undefined
      : new GameplayTagRegistry(readGameplayTagPaths(args.gameplayTagCatalog)),
  );
  const diagnostics = [...staticBatch.diagnostics, ...runtimeBatch.diagnostics];
  assertNoBlockedDiagnostics(diagnostics);
  return { definitions: runtimeBatch.definitions, diagnostics };
}

/**
 * 从已下载的 TableCfg、SkillData、BuffData 编译全部武器；本入口不下载资源，也不支持单把筛选。
 * 输入应来自匹配的游戏版本，调用方需核对来源记录，脚本不会自动证明三个目录版本一致。
 *
 * CLI 参数采用 `--参数名 <目录>`，不是 `--参数名=<目录>`；`--check` 是不带值的开关。
 * 目录可用绝对路径或相对当前工作目录的路径，含空格时加引号。下例在 Endaxis 工作树根目录执行。
 *
 * @param args.tables 对应必填 `--tables <目录>`，读取 WeaponBasicTable.json、
 * WeaponUpgradeTemplateTable.json、SkillPatchTable.json、ItemTable.json，分别用于武器条目、
 * 攻击成长、被动技能逐等级补丁及产品资源身份。
 * 示例：`--tables tmp/game-data-sources/TableCfg-current`。
 *
 * @param args.skillData 对应必填 `--skill-data <目录>`，读取武器词条使用的 SkillData。
 * 只扫描目录直属的 .json，每份必须有唯一 skillId；不是表目录，也不是单个 JSON 文件。
 * 示例：`--skill-data tmp/game-data-sources/SkillData`。
 *
 * @param args.buffData 对应必填 `--buff-data <目录>`，读取词条依赖的 Buff 定义及行为闭包。
 * 只扫描目录直属的 .json，每份必须有唯一 id；缺失或未支持的依赖会阻断正式生成。
 * 示例：`--buff-data tmp/game-data-sources/BuffData`。
 *
 * @param args.gameplayTagCatalog 对应可选 `--gameplay-tag-catalog <TS文件>`，读取同版本可读标签路径目录。
 * 原生数字身份仅在转换期间解析；非空标签缺少目录或路径时阻断，不输出数字/占位标签。
 * 示例：`--gameplay-tag-catalog src/data/combat/gameplayTagCatalog.generated.ts`。
 *
 * @param args.output 对应可选 `--output <目录>`；CLI 默认 src/data/equipment/generated-weapons。
 * 按武器类型子目录输出 .generated.ts，并生成 index.generated.ts。写入时替换整个目标目录，
 * 不要指向含手工文件的目录或仓库根目录。直接调用本函数时必须传入 output。
 * 示例：`--output src/data/equipment/generated-weapons`。
 *
 * @param args.auditOutput 对应可选 `--audit-output <目录>`；默认 tmp/generated-next-weapons。
 * 成功生成时写入 weapon-definitions.audit.json，与正式目录分别替换，不是跨目录事务。
 * 两个输出目录应互相独立；审计属于可重建临时数据，不提交 Git。
 * 示例：`--audit-output tmp/generated-next-weapons`。
 *
 * @param args.check 对应可选开关 `--check`，CLI 默认 false。为 true 时仍执行完整编译，
 * 但只比较正式目录的文件集合和内容，不写正式文件，也不写审计。比较忽略 CRLF/LF 差异，
 * 文件缺失、多出或内容变化仍以 stale 错误退出；stale 不等于编译失败。
 * 不传该开关才实际生成；任一来源/行为诊断 blocked 时，两种模式都在写入前失败。
 *
 * @returns definitionCount 是武器数量；fileCount 是正式 TS 文件数量，包含索引、不含审计。
 *
 * @example 终端只读检查（删除末尾 --check 即实际生成）
 * npm run generate:game-data:weapons -- --tables tmp/game-data-sources/TableCfg-current --skill-data tmp/game-data-sources/SkillData --buff-data tmp/game-data-sources/BuffData --gameplay-tag-catalog src/data/combat/gameplayTagCatalog.generated.ts --output src/data/equipment/generated-weapons --audit-output tmp/generated-next-weapons --check
 *
 * @example IDE 的 npm 调试配置
 * package.json 选择当前工作树，命令选 run，脚本选 generate:game-data:weapons。
 * “实参”填写以下一行（保留开头的 --，用于 npm 参数转发）：
 * -- --tables tmp/game-data-sources/TableCfg-current --skill-data tmp/game-data-sources/SkillData --buff-data tmp/game-data-sources/BuffData --gameplay-tag-catalog src/data/combat/gameplayTagCatalog.generated.ts --output src/data/equipment/generated-weapons --audit-output tmp/generated-next-weapons --check
 */
export async function generateWeaponDefinitions(args: Arguments): Promise<{
  readonly definitionCount: number;
  readonly fileCount: number;
  readonly optimization: readonly DefinitionProgramOptimizationReport[];
}> {
  const compiled = compileWeaponDefinitionsFromFiles(args);
  const rendered = renderWeaponDefinitionsFromCompiled(compiled, args.optimization);
  const files: RenderedWeaponDefinitionFileSource[] = [];
  for (const file of rendered.files) {
    files.push({
      ...file,
      content: await formatGeneratedSource(file.content, path.join(args.output, file.relativePath)),
    });
  }
  if (args.check) checkGeneratedFiles(args.output, files);
  else {
    await writeWeaponDefinitionFiles(args.output, files);
    await writeWeaponDefinitionFiles(
      args.auditOutput ?? path.resolve('tmp/generated-next-weapons'),
      rendered.auditFiles,
    );
  }
  return rendered.summary;
}

/** 复用同批编译结果完成优化和渲染；不再读取来源，不检查或写入输出目录。 */
export function renderWeaponDefinitionsFromCompiled(
  compiled: CompiledWeaponRuntimeDefinitionBatchSource,
  optimization: DefinitionOptimizationMode = 'apply',
) {
  assertNoBlockedDiagnostics(compiled.diagnostics);
  const optimized = compiled.definitions.map(definition =>
    optimizeWeaponDefinitionPrograms(definition, optimization),
  );
  const batch = {
    definitions: optimized.map(result => result.definition),
    diagnostics: compiled.diagnostics,
    optimization: optimized.map(result => result.report),
  };
  const files = renderWeaponDefinitionFiles(batch);
  const definitions = files.filter(file => !file.relativePath.endsWith('.audit.json'));
  return {
    files: definitions,
    auditFiles: files.filter(file => file.relativePath.endsWith('.audit.json')),
    summary: {
      definitionCount: batch.definitions.length,
      fileCount: definitions.length,
      optimization: batch.optimization,
    },
  };
}

/**
 * 正式生成也必须逐把收集来源失败，不能因排序靠前的一把武器遮蔽其余诊断。
 * 只要任一项阻断，调用方最终不会写盘，因此这里的成功候选仍保持整批原子性。
 */
export function compileWeaponStaticDefinitionsIndependently(
  weaponTable: unknown,
  upgradeTable: unknown,
  skillData: unknown,
  patchTable: unknown,
): CompiledWeaponStaticDefinitionBatchSource {
  const weaponIds = Object.keys(requireRecord(weaponTable, 'WeaponBasicTable')).sort(
    (left, right) => left.localeCompare(right),
  );
  const definitions: CompiledWeaponStaticDefinitionBatchSource['definitions'][number][] = [];
  const runtimeDependencies: CompiledWeaponStaticDefinitionBatchSource['runtimeDependencies'][number][] =
    [];
  const diagnostics: BuildDefinitionDiagnosticSource[] = [];
  for (const weaponId of weaponIds) {
    try {
      const result = compileWeaponStaticDefinitionBatchSource(
        weaponTable,
        upgradeTable,
        skillData,
        patchTable,
        [weaponId],
      );
      definitions.push(...result.definitions);
      runtimeDependencies.push(...result.runtimeDependencies);
      diagnostics.push(...result.diagnostics);
    } catch (error) {
      diagnostics.push({
        status: 'blocked',
        sourcePath: `WeaponBasicTable.${weaponId}`,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { definitions, runtimeDependencies, diagnostics };
}

function assertNoBlockedDiagnostics(diagnostics: readonly BuildDefinitionDiagnosticSource[]): void {
  const blocked = diagnostics.filter(item => item.status === 'blocked');
  if (blocked.length === 0) return;
  throw new Error(
    `weapon generation blocked by ${blocked.length} diagnostic(s):\n${blocked
      .map(item => `- ${item.sourcePath}: ${item.reason}`)
      .join('\n')}`,
  );
}

export function parseArguments(values: readonly string[]): Arguments {
  const paths = new Map<string, string>();
  let check = false;
  for (let index = 0; index < values.length;) {
    const name = values[index]!;
    if (name === '--check') {
      check = true;
      index += 1;
      continue;
    }
    const value = values[index + 1];
    if (!name.startsWith('--') || value === undefined) {
      throw new Error('expected --name <path> arguments and optional --check');
    }
    paths.set(name, value);
    index += 2;
  }
  return {
    tables: requiredPath(paths, '--tables'),
    skillData: requiredPath(paths, '--skill-data'),
    buffData: requiredPath(paths, '--buff-data'),
    gameplayTagCatalog: paths.get('--gameplay-tag-catalog'),
    output: path.resolve(paths.get('--output') ?? 'src/data/equipment/generated-weapons'),
    auditOutput: path.resolve(paths.get('--audit-output') ?? 'tmp/generated-next-weapons'),
    check,
  };
}

function readDefinitionDirectory(
  directory: string,
  identityField: 'skillId' | 'id',
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const name of fs
    .readdirSync(directory)
    .filter(name => name.endsWith('.json'))
    .sort()) {
    if (!/^[A-Za-z0-9._-]+\.json$/.test(name)) {
      throw new Error(`${directory}: unsafe definition filename ${JSON.stringify(name)}`);
    }
    const value = readJson(path.join(directory, name));
    const row = requireRecord(value, name);
    const identity = row[identityField];
    if (typeof identity !== 'string' || identity.length === 0) {
      throw new Error(`${name}.${identityField}: expected non-empty string`);
    }
    if (identity in result) {
      throw new Error(`${name}.${identityField}: duplicate identity ${JSON.stringify(identity)}`);
    }
    result[identity] = value;
  }
  return result;
}

export function checkGeneratedFiles(
  outputDirectory: string,
  files: readonly RenderedWeaponDefinitionFileSource[],
): void {
  const expected = new Map(
    files.map(file => [
      file.relativePath.replaceAll('\\', '/'),
      file.content.replaceAll('\r\n', '\n'),
    ]),
  );
  const actualPaths = listFiles(outputDirectory).map(file =>
    path.relative(outputDirectory, file).replaceAll('\\', '/'),
  );
  const expectedPaths = [...expected.keys()].sort();
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error('generated weapon file set is stale');
  }
  for (const relativePath of expectedPaths) {
    const actual = fs.readFileSync(path.join(outputDirectory, relativePath), 'utf8');
    // Git 在 Windows 检出时可能写入 CRLF；只消除换行编码差异，不忽略空白或实际内容变化。
    if (actual.replaceAll('\r\n', '\n') !== expected.get(relativePath)) {
      throw new Error(`generated weapon file is stale: ${relativePath}`);
    }
  }
}

function listFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap(entry => {
      const child = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(child) : [child];
    })
    .sort((left, right) => left.localeCompare(right));
}

function requiredPath(values: ReadonlyMap<string, string>, name: string): string {
  const value = values.get(name);
  if (!value) throw new Error(`missing ${name}`);
  return path.resolve(value);
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function requireRecord(value: unknown, sourcePath: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${sourcePath}: expected object`);
  }
  return value as Record<string, unknown>;
}

async function run(): Promise<void> {
  const result = await generateWeaponDefinitions(parseArguments(process.argv.slice(2)));
  process.stdout.write(
    `weapon definitions: ${result.definitionCount}; generated files: ${result.fileCount}\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await run();
}
