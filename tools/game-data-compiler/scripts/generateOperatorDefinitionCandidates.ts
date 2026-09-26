import { OperatorPlanningSources } from './operatorPlanningSources.ts';
import path from 'node:path';
import {
  checkGeneratedDefinitionFiles,
  writeGeneratedDefinitionFiles,
  type RenderedDefinitionFileSource,
} from '../src/compiler/publication/writeGeneratedDefinitionFiles.ts';
import { requireArray, requireNonEmptyString, requireRecord } from '../src/source/primitives.ts';
import { planOperatorDefinition, renderOperatorDefinitionFiles } from './planOperatorDefinition.ts';
import { optimizeOperatorDefinitionPrograms } from '../src/compiler/optimization/definitionProgramOptimization.ts';
import {
  createGraphSharedEntityValueUsageCollector,
  type GraphSharedEntityValueUsage,
} from '../src/compiler/optimization/graphValueOptimization.ts';
import { compileEntityValueConsumers } from './compileEntityValueConsumers.ts';
import {
  createCommonBuffCollector,
  renderCollectedCommonBuffDefinitions,
} from './generateCommonBuffDefinitions.ts';

type PlanArguments = Parameters<typeof planOperatorDefinition>[0];

export interface OperatorDefinitionCandidateArguments extends Omit<
  PlanArguments,
  'slug' | 'output' | 'auditOutput' | 'sources'
> {
  readonly outputRoot: string;
  readonly auditRoot: string;
  /** 同轮生成公共 Buff 时提供独立输出目录，避免再规划全部干员。 */
  readonly commonBuffOutput?: string;
  readonly check: boolean;
}

/**
 * 从同一 manifest 和同一组来源渲染全部干员，可顺带生成公共 Buff。
 * 全部规划、冲突检查与渲染成功后才逐目录写入；各目录独立替换，写入失败须阻止发布。
 */
export async function generateOperatorDefinitionCandidates(
  args: OperatorDefinitionCandidateArguments,
) {
  if (
    path.resolve(args.outputRoot) ===
    path.resolve(import.meta.dirname, '../../../src/data/operators')
  )
    throw new Error(
      'operator candidates require an isolated directory; publish generated files individually',
    );
  const outputDirectories = [args.outputRoot, args.auditRoot];
  if (args.commonBuffOutput !== undefined) outputDirectories.push(args.commonBuffOutput);
  for (const [index, directory] of outputDirectories.entries()) {
    for (const other of outputDirectories.slice(index + 1)) {
      if (containsDirectory(directory, other) || containsDirectory(other, directory))
        throw new Error('operator, audit and common Buff output directories must not overlap');
    }
  }
  const rendered = await renderOperatorDefinitionBatch({
    ...args,
    includeCommonBuffs: args.commonBuffOutput !== undefined,
  });
  if (args.check) {
    checkGeneratedDefinitionFiles(args.outputRoot, rendered.files);
    checkGeneratedDefinitionFiles(args.auditRoot, rendered.auditFiles);
    if (rendered.commonBuffs && args.commonBuffOutput !== undefined)
      checkGeneratedDefinitionFiles(args.commonBuffOutput, rendered.commonBuffs.files);
  } else {
    await writeGeneratedDefinitionFiles(args.auditRoot, rendered.auditFiles);
    await writeGeneratedDefinitionFiles(args.outputRoot, rendered.files);
    if (rendered.commonBuffs && args.commonBuffOutput !== undefined)
      await writeGeneratedDefinitionFiles(args.commonBuffOutput, rendered.commonBuffs.files);
  }
  return rendered.summary;
}

/** 写入多少名干员与分析多少名干员分开：选中一人时仍从完整 manifest 收集消费者。 */
export interface OperatorDefinitionBatchArguments extends Omit<
  OperatorDefinitionCandidateArguments,
  'check' | 'commonBuffOutput'
> {
  readonly includeCommonBuffs: boolean;
  readonly selectedSlug?: string;
}

/** 正式单人入口和整批候选共用的无写入步骤，保证同来源、同模式得到相同文本。 */
export async function renderOperatorDefinitionBatch(
  args: OperatorDefinitionBatchArguments,
  equipmentUsage?: GraphSharedEntityValueUsage,
) {
  // 先完成外部领域并释放其原始数据，再读干员来源，避免两个大批次同时驻留。
  const externalUsage =
    args.includeCommonBuffs && args.optimization !== 'off'
      ? (equipmentUsage ?? (await compileEntityValueConsumers(args)))
      : undefined;
  const usage = externalUsage
    ? createGraphSharedEntityValueUsageCollector(externalUsage.commonAbilityEntityDefinitions)
    : undefined;
  if (externalUsage) usage!.addUsage(externalUsage);
  const sources = new OperatorPlanningSources(args);
  const manifest = requireRecord(sources.readJson(args.manifest), args.manifest);
  const rows = requireArray(manifest.operators, `${args.manifest}.operators`);
  const slugs = rows.map((value, index) =>
    requireNonEmptyString(
      requireRecord(value, `${args.manifest}.operators[${index}]`).slug,
      `${args.manifest}.operators[${index}].slug`,
    ),
  );
  if (new Set(slugs).size !== slugs.length)
    throw new Error('operator manifest contains duplicate slugs');
  if (args.selectedSlug !== undefined && !slugs.includes(args.selectedSlug))
    throw new Error(`operator manifest does not contain '${args.selectedSlug}'`);

  const files: RenderedDefinitionFileSource[] = [];
  const auditFiles: RenderedDefinitionFileSource[] = [];
  const summaries = [];
  const prepared: {
    readonly slug: string;
    readonly operator: ReturnType<typeof planOperatorDefinition>['operator'];
    readonly audit: string;
  }[] = [];
  const commonBuffs = args.includeCommonBuffs ? createCommonBuffCollector() : undefined;
  for (const slug of slugs) {
    const plan = planOperatorDefinition({
      ...args,
      sources,
      slug,
      // 全部消费者收齐后再优化，只保留最终定义和审计文本，不保留原始动作图等完整计划。
      optimization: 'off',
      // 单技能规划仍用这两个路径生成稳定相对文件名；整批成功后由调用方选择写入目标。
      output: args.outputRoot,
      auditOutput: `${args.auditRoot}/${slug}`,
    });
    commonBuffs?.add(slug, plan.commonBuffDefinitions);
    usage?.addOperator(plan.operator);
    prepared.push({ slug, operator: plan.operator, audit: JSON.stringify(plan.audit) });
    summaries.push({
      slug,
      skillCount: plan.activeSkills.length,
      talentCount: plan.operator.talents.length,
      potentialCount: plan.operator.potentials.length,
      entityCount: Object.keys(plan.operator.abilityEntityDefinitions!).length,
      privateBuffCount: Object.keys(plan.operator.buffDefinitions!).length,
      commonBuffCount: Object.keys(plan.commonBuffDefinitions).length,
    });
    sources.releaseOperator();
  }

  // 系统根先补入原始公共定义。缺少完整公共目录时不宣称已经覆盖跨干员消费者。
  const renderedCommonBuffs = commonBuffs
    ? await renderCollectedCommonBuffDefinitions(args, commonBuffs, sources)
    : undefined;
  if (commonBuffs) usage?.addBuffDefinitions(commonBuffs.definitions);
  const sharedEntityUsage = usage?.finish();
  // 保存来源编译结束时的统计；紧接着释放缓存，统计中的容量不代表渲染阶段仍持有这些对象。
  const sourceReads = sources.statistics();
  sources.clear();
  while (prepared.length > 0) {
    const item = prepared.shift()!;
    if (args.selectedSlug !== undefined && item.slug !== args.selectedSlug) continue;
    const optimized = optimizeOperatorDefinitionPrograms(
      item.operator,
      args.optimization ?? 'apply',
      sharedEntityUsage,
    );
    const rendered = await renderOperatorDefinitionFiles(item.slug, optimized.operator, {
      ...requireRecord(JSON.parse(item.audit), `${item.slug}.audit`),
      optimization: optimized.report,
    });
    files.push(rendered.file);
    auditFiles.push({
      relativePath: `${item.slug}/${rendered.auditFile.relativePath}`,
      content: rendered.auditFile.content,
    });
  }
  return {
    files,
    auditFiles,
    commonBuffs: renderedCommonBuffs,
    summary: {
      operatorCount: summaries.length,
      skillCount: summaries.reduce((sum, item) => sum + item.skillCount, 0),
      operators: summaries,
      sourceReads,
      ...(sharedEntityUsage
        ? {
            entityValueConsumers: {
              reads: [...sharedEntityUsage.reads].sort(),
              unknownAccess: sharedEntityUsage.unknownAccess,
            },
          }
        : {}),
      ...(renderedCommonBuffs
        ? {
            commonBuffs: {
              buffCount: renderedCommonBuffs.buffCount,
              optimization: renderedCommonBuffs.optimization,
            },
          }
        : {}),
    },
  };
}

function containsDirectory(parent: string, child: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return (
    relative === '' ||
    (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  );
}
