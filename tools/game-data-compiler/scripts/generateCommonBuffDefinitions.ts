import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { format, resolveConfig } from 'prettier';
import {
  writeGeneratedDefinitionFiles,
  checkGeneratedDefinitionFiles,
} from '../src/compiler/publication/writeGeneratedDefinitionFiles.ts';
import { renderCommonBuffDefinitionsSource } from '../src/domains/operator/definitionSourceRenderer.ts';
import {
  requireArray,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from '../src/source/primitives.ts';
import { planOperatorDefinition } from './planOperatorDefinition.ts';
import { OperatorPlanningSources } from './operatorPlanningSources.ts';
import { compileStandardStumpBuffClosure } from '../src/compiler/buffs/standardStumpBuffClosure.ts';
import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
import { readGameplayTagPaths } from './generateOperatorActiveSkillRuntime.ts';
import type { OperatorBuffDefinitions } from '../../../packages/game-data-contract/src/buffs.ts';
import type { DefinitionOptimizationMode } from '../src/compiler/optimization/definitionOptimization.ts';
import { optimizeCommonBuffDefinitions } from '../src/compiler/optimization/equipmentDefinitionOptimization.ts';
import { readGeneratedTimeDilationPriorities } from '../src/compiler/catalogs/generatedTimeDilationCatalog.ts';

interface Arguments {
  readonly manifest: string;
  readonly sourceRoot: string;
  readonly tableRoot: string;
  readonly skillPatchTable: string;
  readonly buffDataRoot: string;
  readonly gameplayTagCatalog: string;
  readonly timeDilationCatalog: string;
  readonly globalBuffCatalog: string;
  readonly skillSettingCatalog: string;
  readonly output: string;
  readonly check: boolean;
  /** 默认应用已验证的优化；report 仅报告候选，off 用于生成对照。 */
  readonly optimization?: DefinitionOptimizationMode;
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const presentationNamesPath = path.resolve(
  scriptDirectory,
  '../config/commonBuffPresentationNames.json',
);

/**
 * 从所有正式干员的原始闭包收集公共 Buff，并生成一份全局只读目录。
 * 干员只负责暴露“使用了哪些公共 ID”；重复 ID 必须得到完全一致的定义，不能靠导入顺序覆盖。
 */
export async function generateCommonBuffDefinitions(args: Arguments) {
  const sources = new OperatorPlanningSources(args);
  const manifest = requireRecord(sources.readJson(args.manifest), args.manifest);
  const slugs = requireArray(manifest.operators, `${args.manifest}.operators`).map((value, index) =>
    requireNonEmptyString(
      requireRecord(value, `${args.manifest}.operators[${index}]`).slug,
      `${args.manifest}.operators[${index}].slug`,
    ),
  );
  if (new Set(slugs).size !== slugs.length)
    throw new Error('operator manifest has duplicate slugs');

  const collector = createCommonBuffCollector();
  for (const slug of slugs) {
    const plan = planOperatorDefinition({
      ...args,
      sources,
      slug,
      output: path.join('tmp', 'game-data-generated', 'operator-definitions', slug),
      auditOutput: path.join('tmp', 'game-data-audit', 'operator-definitions', slug),
    });
    collector.add(slug, plan.commonBuffDefinitions);
    sources.releaseOperator();
  }
  const rendered = await renderCollectedCommonBuffDefinitions(args, collector, sources);
  if (args.check) checkGeneratedDefinitionFiles(args.output, rendered.files);
  else await writeGeneratedDefinitionFiles(args.output, rendered.files);
  return {
    operatorCount: slugs.length,
    buffCount: rendered.buffCount,
    optimization: rendered.optimization,
    sourceReads: sources.statistics(),
  };
}

/** 已有干员计划时直接收集其中的公共定义，再补系统根、优化并渲染；本函数不写文件。 */
export async function renderCollectedCommonBuffDefinitions(
  args: Pick<
    Arguments,
    | 'buffDataRoot'
    | 'globalBuffCatalog'
    | 'skillSettingCatalog'
    | 'gameplayTagCatalog'
    | 'timeDilationCatalog'
    | 'optimization'
  >,
  collector: CommonBuffCollector<OperatorBuffDefinitions[string]>,
  sources?: OperatorPlanningSources,
) {
  const readSource = sources?.readJson ?? read;
  // 系统附着产生的 Buff 不一定被干员技能直接引用，仍须进入同一公共定义所有权。
  // 清单仅声明根身份；动作、倍率、标签和生命周期全部走公共原始 Buff 编译器。
  const systemRootDeclarations = readSystemBuffRootDeclarations(
    path.resolve(scriptDirectory, '../config/systemBuffRoots.json'),
  );
  const systemRoots = systemRootDeclarations.map(item => item.buffId);
  const timeDilationPriorities = readGeneratedTimeDilationPriorities(args.timeDilationCatalog);
  const systemClosure = compileStandardStumpBuffClosure(
    systemRoots,
    (id: string) => readSource(path.join(args.buffDataRoot, `${id}.json`)),
    readSource(args.globalBuffCatalog),
    readSource(args.skillSettingCatalog),
    undefined,
    () => ({
      resolveTimeDilationPriority: (tagId: number, sourcePath: string) => {
        const priority = timeDilationPriorities.get(tagId);
        if (priority === undefined)
          throw new Error(`${sourcePath}: unknown time-dilation priority ${tagId}`);
        return priority;
      },
    }),
    new Map(systemRootDeclarations.map(item => [item.buffId, item.owner] as const)),
    new Set(),
    new GameplayTagRegistry(
      sources?.gameplayTags(args.gameplayTagCatalog) ??
        readGameplayTagPaths(args.gameplayTagCatalog),
    ),
    new Map(systemRootDeclarations.map(item => [item.buffId, item.source] as const)),
    new Set(),
    new Map(),
    new Map(
      systemRootDeclarations.flatMap(item =>
        item.buffId === 'buff_common_dash' ? [[item.buffId, {}] as const] : [],
      ),
    ),
  );
  const blocked = systemClosure.diagnostics.filter(item => item.status === 'blocked');
  if (blocked.length) throw new Error(`system Buff roots are blocked: ${JSON.stringify(blocked)}`);
  collector.add('<system>', systemClosure.definitions);
  const optimized = optimizeCommonBuffDefinitions(
    collector.definitions,
    args.optimization ?? 'apply',
  );
  const definitions = optimized.definitions;
  const presentationNameKeys = readPresentationNameKeys(presentationNamesPath);

  const prettierConfig = (await resolveConfig(path.resolve('.prettierrc.json'))) ?? {};
  const content = await format(renderCommonBuffDefinitionsSource(definitions), {
    ...prettierConfig,
    parser: 'typescript',
  });
  const presentationNamesContent = await format(
    renderCommonBuffPresentationNamesSource(presentationNameKeys),
    { ...prettierConfig, parser: 'typescript' },
  );
  const files = [
    { relativePath: 'commonBuffDefinitions.generated.ts', content },
    {
      relativePath: 'commonBuffPresentationNames.generated.ts',
      content: presentationNamesContent,
    },
  ];
  return {
    files,
    buffCount: Object.keys(definitions).length,
    optimization: optimized.report,
  };
}

export interface SystemBuffRootDeclaration {
  readonly buffId: string;
  readonly owner: 'caster' | 'enemy';
  readonly source: 'caster' | 'enemy';
}

/** 字符串沿用“玩家施加给敌人”；其他宿主必须在清单中显式声明。 */
export function readSystemBuffRootDeclarations(sourcePath: string): SystemBuffRootDeclaration[] {
  const roots = requireArray(read(sourcePath), sourcePath).map((value, index) => {
    const itemPath = `${sourcePath}[${index}]`;
    const declaration =
      typeof value === 'string'
        ? {
            buffId: requireNonEmptyString(value, itemPath),
            owner: 'enemy' as const,
            source: 'caster' as const,
          }
        : (() => {
            const item = requireRecord(value, itemPath);
            requireExactFields(item, new Set(['buffId', 'owner', 'source']), itemPath);
            const buffId = requireNonEmptyString(item.buffId, `${itemPath}.buffId`);
            const owner = requireNonEmptyString(item.owner, `${itemPath}.owner`);
            const source = requireNonEmptyString(item.source, `${itemPath}.source`);
            if (owner !== 'caster' && owner !== 'enemy')
              throw new Error(`${itemPath}.owner: unsupported system Buff owner ${owner}`);
            if (source !== 'caster' && source !== 'enemy')
              throw new Error(`${itemPath}.source: unsupported system Buff source ${source}`);
            return {
              buffId,
              owner: owner as SystemBuffRootDeclaration['owner'],
              source: source as SystemBuffRootDeclaration['source'],
            };
          })();
    const id = declaration.buffId;
    if (!/^buff_common_[a-z0-9_]+$/.test(id)) throw new Error(`invalid system Buff root '${id}'`);
    return declaration;
  });
  if (new Set(roots.map(item => item.buffId)).size !== roots.length)
    throw new Error('duplicate system Buff roots');
  return roots;
}

export function readSystemBuffRoots(sourcePath: string): string[] {
  return readSystemBuffRootDeclarations(sourcePath).map(item => item.buffId);
}

export function readPresentationNameKeys(sourcePath: string): Record<string, string> {
  const source = requireRecord(read(sourcePath), sourcePath);
  const result: Record<string, string> = {};
  for (const [buffId, value] of Object.entries(source)) {
    result[requireNonEmptyString(buffId, `${sourcePath}.<key>`)] = requireNonEmptyString(
      value,
      `${sourcePath}.${buffId}`,
    );
  }
  return result;
}

export function renderCommonBuffPresentationNamesSource(
  presentationNameKeys: Readonly<Record<string, string>>,
): string {
  return (
    `/** 由 tools/game-data-compiler 公共 Buff 生成器生成；不要手工编辑。 */\n` +
    `export const commonBuffPresentationNameKeys = Object.freeze(${JSON.stringify(presentationNameKeys, null, 2)} as const);\n`
  );
}

export interface CommonBuffCollector<T> {
  readonly definitions: Readonly<Record<string, T>>;
  add(slug: string, definitions: Readonly<Record<string, T>>): void;
}

/** 逐人去重，只保留每个 ID 的一份原始定义；必须先检查冲突，再做优化。 */
export function createCommonBuffCollector<
  T = OperatorBuffDefinitions[string],
>(): CommonBuffCollector<T> {
  const definitions: Record<string, T> = {};
  const ownerById = new Map<string, string>();
  return {
    definitions,
    add(slug, batch) {
      for (const [id, definition] of Object.entries(batch)) {
        if (ownerById.has(id)) {
          if (!isDeepStrictEqual(definitions[id], definition)) {
            throw new Error(
              `common Buff '${id}' differs between '${ownerById.get(id)}' and '${slug}'`,
            );
          }
          continue;
        }
        Object.defineProperty(definitions, id, { value: definition, enumerable: true });
        ownerById.set(id, slug);
      }
    },
  };
}

function read(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const values = new Map<string, string>();
  let check = false;
  const allowed = new Set([
    '--manifest',
    '--source-root',
    '--table-root',
    '--skill-patch-table',
    '--buff-data-root',
    '--gameplay-tag-catalog',
    '--time-dilation-catalog',
    '--global-buff-catalog',
    '--skill-setting-catalog',
    '--output',
  ]);
  for (let index = 2; index < process.argv.length; index++) {
    const flag = process.argv[index]!;
    if (flag === '--check') {
      check = true;
      continue;
    }
    if (!allowed.has(flag)) throw new Error(`unsupported argument ${flag}`);
    const value = process.argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`missing value for ${flag}`);
    if (values.has(flag)) throw new Error(`duplicate argument ${flag}`);
    values.set(flag, value);
  }
  const required = (flag: string) => {
    const value = values.get(flag);
    if (!value) throw new Error(`missing ${flag}`);
    return value;
  };
  console.log(
    await generateCommonBuffDefinitions({
      manifest: required('--manifest'),
      sourceRoot: required('--source-root'),
      tableRoot: required('--table-root'),
      skillPatchTable: required('--skill-patch-table'),
      buffDataRoot: required('--buff-data-root'),
      gameplayTagCatalog: required('--gameplay-tag-catalog'),
      timeDilationCatalog: required('--time-dilation-catalog'),
      globalBuffCatalog: required('--global-buff-catalog'),
      skillSettingCatalog: required('--skill-setting-catalog'),
      output: required('--output'),
      check,
    }),
  );
}
